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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
