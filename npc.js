// ─── BUSCAR NPC ───────────────────────────────────────────────────────────────
const NPC_WOWHEAD = 'https://es.wowhead.com/npc=';

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
    if (q.length < 2) { npcHideSuggestions(); return; }
    if (/^\d+$/.test(q)) { npcHideSuggestions(); return; } // es un ID, no busca por nombre
    npcSearchTimer = setTimeout(() => npcFetchSuggestions(q), 250);
  });

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = input.value.trim();
    if (/^\d+$/.test(q)) { npcHideSuggestions(); openNpcById(parseInt(q)); return; }
    // si hay sugerencias, elegir la primera
    const first = document.querySelector('#npcSuggestions .autocomplete-item');
    if (first) first.click();
  });

  // cerrar la lista al hacer click afuera
  document.addEventListener('click', e => {
    if (!e.target.closest('.autocomplete-wrap')) npcHideSuggestions();
  });
}

// Abrir por ID directo (cuando el NPC no aparece en el autocompletado)
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
  document.getElementById('npc-loading').classList.remove('hidden');

  document.getElementById('npcName').textContent = npc.name;
  document.getElementById('npcId').textContent = npc.id;
  const typeLabel = npc.type == null ? 'NPC' : (CREATURE_TYPES[npc.type] || 'NPC');
  const clsLabel  = npc.cls  == null ? '—'   : (CREATURE_CLASS[npc.cls] || 'Normal');
  document.getElementById('npcSub').textContent = npc.cls == null ? typeLabel : `${typeLabel} · ${clsLabel}`;

  const url = `${NPC_WOWHEAD}${npc.id}`;
  document.getElementById('npcWowheadBtn').href = url;

  // Info confiable (de nuestro índice) + link con tooltip de Wowhead al pasar el mouse
  document.getElementById('npcTooltip').innerHTML = `
    <div class="npc-info-row"><span class="npc-info-k">Tipo</span><span class="npc-info-v">${typeLabel}</span></div>
    <div class="npc-info-row"><span class="npc-info-k">Clasificación</span><span class="npc-info-v">${clsLabel}</span></div>
    <div class="npc-info-row"><span class="npc-info-k">ID</span><span class="npc-info-v">${npc.id}</span></div>
    <a href="${url}" target="_blank" rel="noopener" class="npc-wh-link" data-wowhead="npc=${npc.id}">
      ${escapeHtml(npc.name)} — ver tooltip de Wowhead
    </a>`;

  // re-escanear tooltips de Wowhead sobre el nuevo contenido
  if (typeof WH !== 'undefined' && WH.Tooltips && WH.Tooltips.refreshLinks) WH.Tooltips.refreshLinks();
  else if (typeof $WowheadPower !== 'undefined' && $WowheadPower.refreshLinks) $WowheadPower.refreshLinks();

  // Modelo 3D
  const frame = document.getElementById('npcModelFrame');
  if (typeof initNpc3D === 'function') {
    initNpc3D(frame, npc.id).then(() => {
      document.getElementById('npc-loading').classList.add('hidden');
    }).catch(err => {
      console.warn('NPC 3D falló:', err);
      document.getElementById('npc-loading').classList.add('hidden');
      frame.querySelector('.model-3d') || (frame.innerHTML = '<div class="model-glow"></div><div class="npc-model-fail">Modelo 3D no disponible para este NPC.</div>');
    });
  } else {
    document.getElementById('npc-loading').classList.add('hidden');
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

document.addEventListener('DOMContentLoaded', npcInit);
