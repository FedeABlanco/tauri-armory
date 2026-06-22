// ─── BUSCAR NPC ───────────────────────────────────────────────────────────────
const ZAM_THUMB = 'https://wow.zamimg.com/modelviewer/live/webthumbs/npc';
const ZAM_MAPS  = 'https://wow.zamimg.com/images/wow/maps';

let npcSearchTimer = null;
let currentNpc = null;

function npcWowheadUrl(id) { return `https://${i18n.whDomain()}/npc=${id}`; }

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
    if (!e.target.closest('#tab-npc .autocomplete-wrap')) npcHideSuggestions();
  });
}

function openNpcById(id) {
  if (!id) return;
  openNpc({ id, name: `NPC #${id}`, cls: null, type: null });
}

async function npcFetchSuggestions(q) {
  try {
    const res  = await fetch(`/api/npc-search?q=${encodeURIComponent(q)}&lang=${i18n.lang}`);
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
    box.innerHTML = `<div class="autocomplete-empty">${i18n.t('ac.empty')}</div>`;
    box.classList.remove('hidden');
    return;
  }
  box.innerHTML = '';
  list.forEach(npc => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    const typeLabel = npc.type ? i18n.creatureType(npc.type) : '';
    item.innerHTML = `
      <span class="ac-name">${escapeHtml(npc.name)}</span>
      <span class="ac-meta">${typeLabel}${npc.cls ? ' · ' + i18n.creatureClass(npc.cls) : ''} · #${npc.id}</span>`;
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

function npcSubText(npc) {
  if (npc.type == null) return '';
  return `${i18n.creatureType(npc.type)}${npc.cls ? ' · ' + i18n.creatureClass(npc.cls) : ''}`;
}

function openNpc(npc) {
  currentNpc = npc;
  document.getElementById('npc-empty').classList.add('hidden');
  document.getElementById('npc-error').classList.add('hidden');
  document.getElementById('npc-result').classList.remove('hidden');

  document.getElementById('npcName').textContent = npc.name;
  document.getElementById('npcId').textContent = npc.id;
  document.getElementById('npcSub').textContent = npcSubText(npc);
  document.getElementById('npcWowheadBtn').href = npcWowheadUrl(npc.id);
  document.getElementById('npcTooltip').innerHTML = `<span style="color:#8a7050">${i18n.t('npc.loadingWH')}</span>`;
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

  const img = document.getElementById('npcImage');
  img.classList.remove('hidden');
  img.src = `${ZAM_THUMB}/${id % 256}/${id}.png`;
  img.onerror = () => img.classList.add('hidden');

  if (typeof initNpc3D === 'function') {
    initNpc3D(frame, id).catch(err => {
      console.warn('NPC 3D no disponible, usando imagen:', err);
      if (img.classList.contains('hidden')) {
        frame.insertAdjacentHTML('beforeend', `<div class="npc-model-fail">${i18n.t('npc.noModel')}</div>`);
      }
    });
  }
}

async function fetchNpcDetails(id) {
  try {
    const r = await fetch(`https://nether.wowhead.com/tooltip/npc/${id}?locale=${i18n.whLocale()}`, { mode: 'cors' });
    const data = await r.json();

    if (data.name) document.getElementById('npcName').textContent = data.name;

    let tipHtml = '';
    if (data.tooltip) {
      const tmp = document.createElement('div');
      tmp.innerHTML = data.tooltip;
      tmp.querySelector('b.q, b.q0, b.q1, b.q2, b.q3, b.q4')?.closest('tr')?.remove();
      tipHtml = tmp.innerHTML.trim();
    }
    document.getElementById('npcTooltip').innerHTML =
      tipHtml || `<span style="color:#8a7050">${i18n.t('npc.noData')}</span>`;

    if (data.map && data.map.zone) renderNpcMap(data.map);
  } catch (err) {
    document.getElementById('npcTooltip').innerHTML =
      `<span style="color:#8a7050">${i18n.t('npc.loadFail')}</span>`;
  }
}

async function renderNpcMap(map) {
  const zone = map.zone;
  const coordsObj = map.coords || {};
  const firstKey = Object.keys(coordsObj)[0];
  const coords = (firstKey != null ? coordsObj[firstKey] : []) || [];
  if (!zone) return;

  try {
    const zr = await fetch(`/api/zone-name?id=${zone}&lang=${i18n.lang}`);
    const zd = await zr.json();
    document.getElementById('npcZone').textContent = zd.name ? `— ${zd.name}` : '';
  } catch (_) {}

  const mapDiv = document.getElementById('npcMap');
  mapDiv.innerHTML = '';
  const imgEl = document.createElement('img');
  imgEl.className = 'npc-map-img';
  const loc = i18n.mapLoc();
  imgEl.src = `${ZAM_MAPS}/${loc}/original/${zone}.jpg`;
  imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = `${ZAM_MAPS}/enus/original/${zone}.jpg`; };
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

// Al cambiar de idioma: re-etiquetar y recargar datos (sin recargar el modelo 3D)
i18n.onLangChange(() => {
  if (!currentNpc) return;
  document.getElementById('npcSub').textContent = npcSubText(currentNpc);
  document.getElementById('npcWowheadBtn').href = npcWowheadUrl(currentNpc.id);
  fetchNpcDetails(currentNpc.id);
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

document.addEventListener('DOMContentLoaded', npcInit);
