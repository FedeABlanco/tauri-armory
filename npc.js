// ─── BUSCAR NPC ───────────────────────────────────────────────────────────────
const NPC_WOWHEAD = 'https://es.wowhead.com/npc=';
// nether.wowhead.com permite CORS desde el navegador (locale 6 = español)
const NETHER = 'https://nether.wowhead.com/tooltip';
const ZAM_THUMB = 'https://wow.zamimg.com/modelviewer/live/webthumbs/npc';
const ZAM_MAP_ES = 'https://wow.zamimg.com/images/wow/maps/eses/original';
const ZAM_MAP_EN = 'https://wow.zamimg.com/images/wow/maps/enus/original';

const CREATURE_TYPES = {
  1: 'Bestia', 2: 'Dragón', 3: 'Demonio', 4: 'Elemental', 5: 'Gigante',
  6: 'No-muerto', 7: 'Humanoide', 8: 'Alimaña', 9: 'Mecánico', 10: 'Indefinido',
  11: 'Tótem', 12: 'Mascota', 13: 'Nube de gas', 14: 'Mascota salvaje', 15: 'Aberración',
};
const CREATURE_CLASS = {
  0: 'Normal', 1: 'Élite', 2: 'Raro élite', 3: 'Jefe de banda', 4: 'Raro',
};

let npcSearchTimer = null;

function npcInit() {
  const input = document.getElementById('npcSearch');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(npcSearchTimer);
    if (q.length < 2 || /^\d+$/.test(q)) { npcHideSuggestions(); return; }
    npcSearchTimer = setTimeout(() => npcFetchSuggestions(q), 250);
  });

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = input.value.trim();
    if (/^\d+$/.test(q)) { npcHideSuggestions(); openNpcById(parseInt(q)); return; }
    const first = document.querySelector('#npcSuggestions .autocomplete-item');
    if (first) first.click();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.autocomplete-wrap')) npcHideSuggestions();
  });
}

function openNpcById(id) {
  if (!id) return;
  openNpc({ id, name: `NPC #${id}`, cls: null, type: null });
}

async function npcFetchSuggestions(q) {
  try {
    const res  = await fetch(`/api/npc-search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.errorstring || 'error');
    npcRenderSuggestions(data.response || []);
  } catch (err) {
    npcHideSuggestions();
  }
}

function npcRenderSuggestions(list) {
  const box = document.getElementById('npcSuggestions');
  if (!list.length) {
    box.innerHTML = '<div class="autocomplete-empty">Sin resultados. Si sabés el ID (de la URL de Wowhead), pegalo y Enter.</div>';
    box.classList.remove('hidden');
    return;
  }
  box.innerHTML = '';
  list.forEach(npc => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    const typeLabel = CREATURE_TYPES[npc.type] || '';
    item.innerHTML = `
      <span class="ac-name">${escapeHtml(npc.name)}</span>
      <span class="ac-meta">${typeLabel}${npc.cls ? ' · ' + (CREATURE_CLASS[npc.cls] || '') : ''} · #${npc.id}</span>`;
    item.addEventListener('click', () => {
      document.getElementById('npcSearch').value = npc.name;
      npcHideSuggestions();
      openNpc(npc);
    });
    box.appendChild(item);
  });
  box.classList.remove('hidden');
}

function npcHideSuggestions() {
  const box = document.getElementById('npcSuggestions');
  if (box) { box.classList.add('hidden'); box.innerHTML = ''; }
}

function openNpc(npc) {
  document.getElementById('npc-empty').classList.add('hidden');
  document.getElementById('npc-error').classList.add('hidden');
  document.getElementById('npc-result').classList.remove('hidden');

  document.getElementById('npcName').textContent = npc.name;
  document.getElementById('npcId').textContent = npc.id;
  const sub = npc.type == null ? '' :
    `${CREATURE_TYPES[npc.type] || 'NPC'}${npc.cls ? ' · ' + (CREATURE_CLASS[npc.cls] || '') : ''}`;
  document.getElementById('npcSub').textContent = sub;
  document.getElementById('npcWowheadBtn').href = `${NPC_WOWHEAD}${npc.id}`;
  document.getElementById('npcTooltip').innerHTML = '<span style="color:#8a7050">Cargando datos de Wowhead...</span>';
  document.getElementById('npcLocation').classList.add('hidden');
  document.getElementById('npcMap').innerHTML = '';
  document.getElementById('npcZone').textContent = '';

  renderNpcModel(npc.id);
  fetchNpcDetails(npc.id);
}

// Modelo 3D con imagen de respaldo (webthumb) por debajo del canvas
function renderNpcModel(id) {
  const frame = document.getElementById('npcModelFrame');
  const mount = frame.querySelector('.model-3d');
  if (mount) mount.innerHTML = '';
  frame.querySelector('.npc-model-fail')?.remove();

  // imagen de respaldo (queda detrás; si el 3D carga, el canvas la tapa)
  const img = document.getElementById('npcImage');
  img.classList.remove('hidden');
  img.src = `${ZAM_THUMB}/${id % 256}/${id}.png`;
  img.onerror = () => img.classList.add('hidden');

  if (typeof initNpc3D === 'function') {
    initNpc3D(frame, id).catch(err => {
      console.warn('NPC 3D no disponible, usando imagen:', err);
      // si tampoco hay imagen, mostrar aviso
      if (img.classList.contains('hidden')) {
        frame.insertAdjacentHTML('beforeend', '<div class="npc-model-fail">Sin modelo 3D ni imagen para este NPC.</div>');
      }
    });
  }
}

async function fetchNpcDetails(id) {
  try {
    const r = await fetch(`${NETHER}/npc/${id}?locale=6`, { mode: 'cors' });
    const data = await r.json();

    if (data.name) document.getElementById('npcName').textContent = data.name;

    // tooltip: quitamos la fila del nombre (ya está en el título)
    let tipHtml = '';
    if (data.tooltip) {
      const tmp = document.createElement('div');
      tmp.innerHTML = data.tooltip;
      tmp.querySelector('b.q, b.q0, b.q1, b.q2, b.q3, b.q4')?.closest('tr')?.remove();
      tipHtml = tmp.innerHTML.trim();
    }
    document.getElementById('npcTooltip').innerHTML =
      tipHtml || '<span style="color:#8a7050">Sin datos adicionales en Wowhead.</span>';

    if (data.map && data.map.zone) renderNpcMap(data.map);
  } catch (err) {
    document.getElementById('npcTooltip').innerHTML =
      '<span style="color:#8a7050">No se pudieron cargar los datos. Usá el botón para verlo en Wowhead.</span>';
  }
}

async function renderNpcMap(map) {
  const zone = map.zone;
  const coordsObj = map.coords || {};
  const firstKey = Object.keys(coordsObj)[0];
  const coords = (firstKey != null ? coordsObj[firstKey] : []) || [];
  if (!zone) return;

  // nombre de zona (es) desde nuestro proxy de AreaTable
  try {
    const zr = await fetch(`/api/zone-name?id=${zone}`);
    const zd = await zr.json();
    document.getElementById('npcZone').textContent = zd.name ? `— ${zd.name}` : '';
  } catch (_) {}

  const mapDiv = document.getElementById('npcMap');
  const imgEl = document.createElement('img');
  imgEl.className = 'npc-map-img';
  imgEl.src = `${ZAM_MAP_ES}/${zone}.jpg`;
  imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = `${ZAM_MAP_EN}/${zone}.jpg`; };
  mapDiv.appendChild(imgEl);

  coords.slice(0, 50).forEach(pair => {
    const x = pair[0], y = pair[1];
    if (x == null || y == null) return;
    const dot = document.createElement('span');
    dot.className = 'map-dot';
    dot.style.left = x + '%';
    dot.style.top = y + '%';
    mapDiv.appendChild(dot);
  });

  document.getElementById('npcLocation').classList.remove('hidden');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

document.addEventListener('DOMContentLoaded', npcInit);
