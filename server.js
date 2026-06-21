const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY    = process.env.TAURI_API_KEY    || '98e49c8b3f1917327b3bcfe8956441d5';
const API_SECRET = process.env.TAURI_API_SECRET || '727ab6350cfb42958fd3f999f847c07039a690d3';
const BASE_URL   = 'http://chapi.tauri.hu/apiIndex.php';

// ─── Character data ──────────────────────────────────────────────────────────
app.post('/api/character', async (req, res) => {
  const { realm, name } = req.body;
  const payload = {
    secret: API_SECRET,
    url: 'character-sheet',
    params: { r: realm, n: name },
  };
  try {
    const response = await fetch(`${BASE_URL}?apikey=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, errorstring: err.message });
  }
});

// ─── Portrait proxy (tries Tauri CDN) ────────────────────────────────────────
app.get('/api/portrait', async (req, res) => {
  const portraitPath = req.query.path;
  if (!portraitPath) return res.status(400).end();

  const candidates = [
    `http://armory.tauri.hu/${portraitPath}`,
    `http://cdn.tauri.hu/${portraitPath}`,
    `http://tauri.hu/armory/${portraitPath}`,
  ];

  for (const url of candidates) {
    try {
      const r = await fetch(url, { timeout: 4000 });
      if (r.ok && r.headers.get('content-type')?.startsWith('image')) {
        res.set('Content-Type', r.headers.get('content-type'));
        res.set('Cache-Control', 'public, max-age=3600');
        r.body.pipe(res);
        return;
      }
    } catch (_) { /* try next */ }
  }

  // All failed → 404 so client falls back to class icon
  res.status(404).end();
});

// ─── Wowhead tooltip proxy ────────────────────────────────────────────────────
const tooltipCache = new Map();
app.get('/api/tooltip', async (req, res) => {
  const id = parseInt(req.query.id);
  if (!id) return res.status(400).json({ error: 'id requerido' });

  if (tooltipCache.has(id)) return res.json(tooltipCache.get(id));

  const urls = [
    `https://es.wowhead.com/tooltip/item/${id}?dataEnv=4&locale=0`,
    `https://www.wowhead.com/tooltip/item/${id}?dataEnv=4&locale=0`,
    `https://es.wowhead.com/tooltip/item/${id}`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Referer': 'https://es.wowhead.com/',
    'Origin': 'https://es.wowhead.com',
  };

  for (const url of urls) {
    try {
      const r = await fetch(url, { headers, timeout: 8000 });
      if (!r.ok) continue;
      const data = await r.json();
      if (data && (data.tooltip || data.name)) {
        tooltipCache.set(id, data);
        return res.json(data);
      }
    } catch (_) { /* intenta siguiente */ }
  }

  res.status(404).json({ error: 'tooltip no disponible' });
});

// ─── Model Viewer content proxy ───────────────────────────────────────────────
// Wowhead/zamimg responde 403 a peticiones del navegador con header Origin, pero
// 200 a peticiones server-side (sin Origin). Proxiamos el contenido del visor 3D
// por nuestro propio origen para evitar el bloqueo CORS.
const MV_BASE = 'https://wow.zamimg.com/modelviewer/live/';
app.use('/mv', async (req, res) => {
  const rest = req.url.replace(/^\/+/, '');     // ej: "meta/armor/1/19990.json"
  const target = MV_BASE + rest;
  // Usamos el fetch nativo de Node (undici): node-fetch v2 falla con "Premature close"
  // contra el CDN de zamimg (HTTP/2 + compresión).
  const nativeFetch = globalThis.fetch;
  try {
    const r = await nativeFetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.wowhead.com/',
        'Accept': '*/*',
      },
    });
    if (!r.ok) return res.status(r.status).end();
    const ct = r.headers.get('content-type');
    const buf = Buffer.from(await r.arrayBuffer());
    if (ct) res.set('Content-Type', ct);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(buf);
  } catch (err) {
    console.error('MV proxy error:', target, err.message);
    res.status(502).end();
  }
});

// ─── NPC search (índice en memoria desde wago.tools) ──────────────────────────
// wago.tools expone el DB2 Creature como CSV (~1.5MB, 23k filas). Lo bajamos una
// vez, armamos un índice {id, name, classification, type} y servimos autocompletado.
let npcIndex = null;       // array de {id, name, cls, type}
let npcIndexPromise = null;

// Parser CSV mínimo que respeta comillas (los nombres pueden tener comas).
function parseCsvLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

async function loadNpcIndex() {
  const url = 'https://wago.tools/db2/Creature/csv';
  const r = await globalThis.fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36' },
  });
  if (!r.ok) throw new Error('wago.tools status ' + r.status);
  const text = await r.text();
  const lines = text.split('\n');
  const idx = [];
  // header: ID(0), Name_lang(1), ..., Classification(5), CreatureType(6), ..., DisplayID_0(9)
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const c = parseCsvLine(lines[i]);
    const id = parseInt(c[0]);
    const name = (c[1] || '').trim();
    if (!id || !name) continue;
    idx.push({ id, name, cls: parseInt(c[5]) || 0, type: parseInt(c[6]) || 0 });
  }
  return idx;
}

app.get('/api/npc-search', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ success: true, response: [] });

  try {
    if (!npcIndex) {
      if (!npcIndexPromise) npcIndexPromise = loadNpcIndex();
      npcIndex = await npcIndexPromise;
    }
  } catch (err) {
    npcIndexPromise = null;
    return res.status(502).json({ success: false, errorstring: 'No se pudo cargar la base de NPCs: ' + err.message });
  }

  const starts = [], contains = [];
  for (const npc of npcIndex) {
    const n = npc.name.toLowerCase();
    if (n === q || n.startsWith(q)) starts.push(npc);
    else if (n.includes(q)) contains.push(npc);
    if (starts.length >= 15) break;
  }
  const results = starts.concat(contains).slice(0, 15);
  res.json({ success: true, response: results });
});

// ─── Zona: id → nombre (es) desde wago.tools AreaTable ────────────────────────
let zoneMap = null;       // { [id]: nombre }
let zonePromise = null;

async function loadZoneMap() {
  const url = 'https://wago.tools/db2/AreaTable/csv?locale=esES';
  const r = await globalThis.fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36' },
  });
  if (!r.ok) throw new Error('wago.tools status ' + r.status);
  const text = await r.text();
  const lines = text.split('\n');
  const map = {};
  // header: ID(0), ZoneName(1), AreaName_lang(2), ...
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const c = parseCsvLine(lines[i]);
    const id = parseInt(c[0]);
    const name = (c[2] || '').trim();
    if (id && name) map[id] = name;
  }
  return map;
}

app.get('/api/zone-name', async (req, res) => {
  const id = parseInt(req.query.id);
  if (!id) return res.json({ success: true, name: null });
  try {
    if (!zoneMap) {
      if (!zonePromise) zonePromise = loadZoneMap();
      zoneMap = await zonePromise;
    }
  } catch (err) {
    zonePromise = null;
    return res.json({ success: false, name: null });
  }
  res.json({ success: true, name: zoneMap[id] || null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
