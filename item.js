// ─── BUSCAR ÍTEM ──────────────────────────────────────────────────────────────
const ITEM_WOWHEAD = 'https://es.wowhead.com/item=';
const NETHER_I     = 'https://nether.wowhead.com/tooltip/item';
const ICON_BASE_I  = 'https://wow.zamimg.com/images/wow/icons/large/';

const QUALITY_COLOR_I = {
  0: '#9d9d9d', 1: '#ffffff', 2: '#1eff00', 3: '#0070dd',
  4: '#a335ee', 5: '#ff8000', 6: '#e6cc80', 7: '#e6cc80',
};
const QUALITY_NAME_I = {
  0: 'Pobre', 1: 'Común', 2: 'Poco común', 3: 'Poco común',
  4: 'Épico', 5: 'Legendario', 6: 'Artefacto', 7: 'Patrimonio',
};

let itemSearchTimer = null;

function itemInit() {
  const input = document.getElementById('itemSearch');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(itemSearchTimer);
    if (q.length < 2 || /^\d+$/.test(q)) { itemHideSuggestions(); return; }
    itemSearchTimer = setTimeout(() => itemFetchSuggestions(q), 250);
  });

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = input.value.trim();
    if (/^\d+$/.test(q)) { itemHideSuggestions(); openItem(parseInt(q)); return; }
    const first = document.querySelector('#itemSuggestions .autocomplete-item');
    if (first) first.click();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#tab-item .autocomplete-wrap')) itemHideSuggestions();
  });
}

async function itemFetchSuggestions(q) {
  try {
    const res  = await fetch(`/api/item-search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.errorstring || 'error');
    itemRenderSuggestions(data.response || []);
  } catch (err) {
    itemHideSuggestions();
  }
}

function itemRenderSuggestions(list) {
  const box = document.getElementById('itemSuggestions');
  if (!list.length) {
    box.innerHTML = '<div class="autocomplete-empty">Sin resultados. Si sabés el ID (de la URL de Wowhead), pegalo y Enter.</div>';
    box.classList.remove('hidden');
    return;
  }
  box.innerHTML = '';
  list.forEach(it => {
    const el = document.createElement('div');
    el.className = 'autocomplete-item';
    el.innerHTML = `<span class="ac-name">${escapeHtmlI(it.name)}</span><span class="ac-meta">#${it.id}</span>`;
    el.addEventListener('click', () => {
      document.getElementById('itemSearch').value = it.name;
      itemHideSuggestions();
      openItem(it.id, it.name);
    });
    box.appendChild(el);
  });
  box.classList.remove('hidden');
}

function itemHideSuggestions() {
  const box = document.getElementById('itemSuggestions');
  if (box) { box.classList.add('hidden'); box.innerHTML = ''; }
}

async function openItem(id, name) {
  document.getElementById('item-empty').classList.add('hidden');
  document.getElementById('item-result').classList.remove('hidden');

  document.getElementById('itemName').textContent = name || `Ítem #${id}`;
  document.getElementById('itemName').style.color = '';
  document.getElementById('itemId').textContent = id;
  document.getElementById('itemSub').textContent = '';
  document.getElementById('itemWowheadBtn').href = `${ITEM_WOWHEAD}${id}`;
  document.getElementById('itemIcon').src = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
  document.getElementById('itemIcon').style.borderColor = '#3a2800';
  document.getElementById('itemTooltip').innerHTML = '<span style="color:#8a7050">Cargando datos de Wowhead...</span>';

  try {
    const r = await fetch(`${NETHER_I}/${id}?locale=6`, { mode: 'cors' });
    const data = await r.json();

    const q = data.quality ?? 1;
    const color = QUALITY_COLOR_I[q] || '#ffffff';

    if (data.name) {
      document.getElementById('itemName').textContent = data.name;
      document.getElementById('itemName').style.color = color;
    }
    document.getElementById('itemSub').textContent = QUALITY_NAME_I[q] || '';

    if (data.icon) {
      const icon = document.getElementById('itemIcon');
      icon.src = `${ICON_BASE_I}${data.icon}.jpg`;
      icon.style.borderColor = color;
    }

    let tipHtml = '';
    if (data.tooltip) {
      const tmp = document.createElement('div');
      tmp.innerHTML = data.tooltip;
      tmp.querySelector('b.q, b.q0, b.q1, b.q2, b.q3, b.q4, b.q5')?.closest('tr')?.remove();
      tipHtml = tmp.innerHTML.trim();
    }
    document.getElementById('itemTooltip').innerHTML =
      tipHtml || '<span style="color:#8a7050">Sin datos en Wowhead para este ítem.</span>';
  } catch (err) {
    document.getElementById('itemTooltip').innerHTML =
      '<span style="color:#8a7050">No se pudieron cargar los datos. Usá el botón para verlo en Wowhead.</span>';
  }
}

function escapeHtmlI(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

document.addEventListener('DOMContentLoaded', itemInit);
