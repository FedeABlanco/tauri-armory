// WoW class metadata
const CLASS_INFO = {
  1:  { name: 'Guerrero',      color: '#C79C6E', power: 'Furia',    powerClass: 'rage'   },
  2:  { name: 'Paladín',       color: '#F58CBA', power: 'Maná',     powerClass: 'mana'   },
  3:  { name: 'Cazador',       color: '#ABD473', power: 'Enfoque',  powerClass: 'energy' },
  4:  { name: 'Pícaro',        color: '#FFF569', power: 'Energía',  powerClass: 'energy' },
  5:  { name: 'Sacerdote',     color: '#FFFFFF', power: 'Maná',     powerClass: 'mana'   },
  6:  { name: 'Caballero Muerte', color: '#C41F3B', power: 'Runas', powerClass: 'energy' },
  7:  { name: 'Chamán',        color: '#0070DE', power: 'Maná',     powerClass: 'mana'   },
  8:  { name: 'Mago',          color: '#69CCF0', power: 'Maná',     powerClass: 'mana'   },
  9:  { name: 'Brujo',         color: '#9482C9', power: 'Maná',     powerClass: 'mana'   },
  10: { name: 'Monje',         color: '#00FF96', power: 'Energía',  powerClass: 'energy' },
  11: { name: 'Druida',        color: '#FF7D0A', power: 'Maná',     powerClass: 'mana'   },
  12: { name: 'Cazador Demoníaco', color: '#A330C9', power: 'Furia', powerClass: 'rage'  },
};

const RACE_INFO = {
  1: 'Humano', 2: 'Orco', 3: 'Enano', 4: 'Elfo de la noche',
  5: 'No-Muerto', 6: 'Tauren', 7: 'Gnomo', 8: 'Troll',
  9: 'Goblin', 10: 'Elfo de sangre', 11: 'Draenei',
  22: 'Huargen', 24: 'Pandaren', 25: 'Pandaren',
};

const QUALITY_COLORS = ['#9d9d9d','#ffffff','#1eff00','#0070dd','#a335ee','#ff8000','#e6cc80'];

const SLOT_NAMES = {
  0: 'Cabeza', 1: 'Cuello', 2: 'Hombros', 3: 'Espalda',
  4: 'Pecho', 5: 'Camisa', 6: 'Tabardo', 7: 'Muñecas',
  8: 'Manos', 9: 'Cintura', 10: 'Piernas', 11: 'Pies',
  12: 'Anillo 1', 13: 'Anillo 2', 14: 'Objeto 1', 15: 'Objeto 2',
  16: 'Mano Principal', 17: 'Mano Secundaria', 18: 'A Distancia',
};

const ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/large/';
const WOWHEAD_BASE = 'https://es.wowhead.com/item=';

// ─── MODEL ROTATION ─────────────────────────────────────────────────────────
let rotation = 0;
let isDragging = false;
let lastX = 0;
let autoRotate = true;
let autoRaf = null;

function initModelDrag() {
  const frame = document.getElementById('modelFrame');
  const img = document.getElementById('characterModel');

  const startDrag = (x) => { isDragging = true; lastX = x; autoRotate = false; cancelAnimationFrame(autoRaf); };
  const moveDrag = (x) => {
    if (!isDragging) return;
    const delta = x - lastX;
    lastX = x;
    rotation += delta * 0.6;
    applyRotation(img, rotation);
  };
  const endDrag = () => {
    isDragging = false;
    setTimeout(() => { autoRotate = true; startAutoRotate(img); }, 2000);
  };

  frame.addEventListener('mousedown', e => startDrag(e.clientX));
  window.addEventListener('mousemove', e => moveDrag(e.clientX));
  window.addEventListener('mouseup', endDrag);
  frame.addEventListener('touchstart', e => startDrag(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove', e => moveDrag(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchend', endDrag);
}

function applyRotation(img, deg) {
  const clamp = ((deg % 360) + 360) % 360;
  // Simulate perspective with scaleX: max distortion at 90° and 270°
  const rad = (clamp * Math.PI) / 180;
  const scaleX = Math.abs(Math.cos(rad));
  const flipped = clamp > 90 && clamp < 270;
  img.style.transform = `translateX(-50%) scaleX(${flipped ? -scaleX : scaleX})`;
}

function startAutoRotate(img) {
  if (!autoRotate) return;
  let last = null;
  const step = (ts) => {
    if (!autoRotate) return;
    if (last !== null) { rotation += (ts - last) * 0.03; }
    last = ts;
    applyRotation(img, rotation);
    autoRaf = requestAnimationFrame(step);
  };
  autoRaf = requestAnimationFrame(step);
}

// ─── MAIN FETCH ──────────────────────────────────────────────────────────────
async function buscarPersonaje() {
  const realm = document.getElementById('realm').value;
  const name = document.getElementById('characterName').value.trim();

  if (!name) { alert('Por favor, ingresa el nombre de un personaje.'); return; }

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('sheet').classList.add('hidden');
  document.getElementById('errorMsg').classList.add('hidden');

  try {
    const res = await fetch('/api/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ realm, name }),
    });
    const data = await res.json();

    if (!data.success) {
      showError('Error de Tauri: ' + data.errorstring);
      return;
    }

    renderSheet(data.response);

  } catch (err) {
    showError('Error de red: ' + err.message);
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ─── RENDER SHEET ────────────────────────────────────────────────────────────
function renderSheet(p) {
  const cls = CLASS_INFO[p.class] || { name: 'Desconocida', color: '#cccccc', power: 'Maná', powerClass: 'mana' };
  const race = RACE_INFO[p.race] || 'Desconocida';
  const gender = p.gender === 0 ? 'Masculino' : 'Femenino';

  // ── Header ──
  document.getElementById('hdrName').textContent = p.name;
  document.getElementById('hdrName').className = `class-${p.class}`;
  document.getElementById('hdrSub').textContent =
    `Nivel ${p.level} ${race} ${cls.name}${p.realm ? ' · ' + p.realm : ''}${p.guildName ? ' <' + p.guildName + '>' : ''}`;
  document.getElementById('hdrIlvl').textContent = p.avgitemlevel || '—';

  // ── Portrait header ──
  const hdrPortrait = document.getElementById('hdrPortrait');
  if (p.portrait_path) {
    hdrPortrait.src = `/api/portrait?path=${encodeURIComponent(p.portrait_path)}`;
    hdrPortrait.onerror = () => setClassIcon(hdrPortrait, p.class);
  } else {
    setClassIcon(hdrPortrait, p.class);
  }

  // ── Model area glow ──
  const glow = document.getElementById('modelGlow');
  glow.style.background = `radial-gradient(ellipse at 50% 60%, ${cls.color}40 0%, transparent 70%)`;

  // ── 3D Character model ──
  const modelFrame = document.getElementById('modelFrame');
  // Hide the flat image
  const modelImg = document.getElementById('characterModel');
  modelImg.style.display = 'none';
  document.querySelector('.drag-hint').style.display = 'none';

  if (typeof initCharacter3D === 'function') {
    initCharacter3D(modelFrame, p).catch(err => {
      console.warn('3D model failed, falling back:', err);
      modelImg.style.display = '';
      setClassModelPlaceholder(p.class, cls);
    });
  } else {
    modelImg.style.display = '';
    setClassModelPlaceholder(p.class, cls);
  }

  // ── Health / Power bars ──
  const hp = p.healthValue || 0;
  document.getElementById('valHealth').textContent = formatNum(hp);
  document.getElementById('barHealth').style.width = '100%';

  const powerInfo = p.additionalBarInfo || {};
  const powerVal = powerInfo.value || 0;
  document.getElementById('barPowerLabel').textContent = cls.power;
  document.getElementById('valPower').textContent = formatNum(powerVal);
  document.getElementById('barPower').style.width = '100%';
  document.getElementById('barPower').closest('.bar').className = `bar power-bar ${cls.powerClass}`;

  // ── Equipment slots ──
  const items = p.characterItems || [];
  for (let i = 0; i < 19; i++) {
    const slotEl = document.getElementById(`slot-${i}`);
    if (!slotEl) continue;
    const item = items[i];
    renderSlot(slotEl, item, i);
  }

  // ── Stats ──
  const s = p.characterStat || {};
  document.getElementById('st-str').textContent = s.effective_strength || 0;
  document.getElementById('st-agi').textContent = s.effective_agility || 0;
  document.getElementById('st-sta').textContent = s.effective_stamina || 0;
  document.getElementById('st-int').textContent = s.effective_intellect || 0;
  document.getElementById('st-spi').textContent = s.effective_spirit || 0;

  // Spell power: look for bonus_damage or compute from intellect
  const sp = s.spell_bonus_damage || s.bonus_damage || s.effective_spell_power || 0;
  document.getElementById('st-sp').textContent = sp || '—';

  const crit = s.spell_crit_pct ?? s.melee_crit ?? 0;
  document.getElementById('st-crit').textContent = crit.toFixed(2) + '%';

  const haste = Math.max(0, s.spell_haste_pct || s.hastepct_melee_dmg || 0);
  document.getElementById('st-haste').textContent = haste.toFixed(2) + '%';

  const mastery = s.mastery_pct || 0;
  document.getElementById('st-mastery').textContent = mastery.toFixed(2) + '%';

  document.getElementById('st-armor').textContent = formatNum(s.effective_armor || 0);
  document.getElementById('st-health').textContent = formatNum(p.healthValue || 0);
  document.getElementById('st-resource-label').textContent = cls.power + ' máx.';
  document.getElementById('st-resource').textContent = formatNum(powerVal);

  // ── Show sheet ──
  document.getElementById('sheet').classList.remove('hidden');

  // Trigger Wowhead tooltips re-scan on new content
  if (typeof WH !== 'undefined' && WH.util && WH.util.refreshLinks) {
    WH.util.refreshLinks();
  }
}

function renderSlot(slotEl, item, index) {
  slotEl.innerHTML = '';
  slotEl.className = 'item-slot';
  slotEl.setAttribute('data-label', SLOT_NAMES[index] || '');

  if (!item || item.entry === 0) {
    slotEl.classList.add('empty');
    return;
  }

  const q = item.rarity || 0;
  slotEl.classList.add(`q${q}`);

  const iconName = item.icon || 'inv_misc_questionmark';
  const iconUrl = `${ICON_BASE}${iconName}.jpg`;
  const wowheadUrl = `${WOWHEAD_BASE}${item.entry}`;

  const link = document.createElement('a');
  link.href = wowheadUrl;
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('data-wowhead', `item=${item.entry}`);
  link.setAttribute('data-item-id', item.entry);
  link.setAttribute('data-item-name', item.name || '');
  link.setAttribute('data-item-icon', iconName);
  link.setAttribute('data-item-ilvl', item.ilevel || '');
  link.setAttribute('data-item-quality', q);

  const img = document.createElement('img');
  img.src = iconUrl;
  img.alt = item.name || '';
  img.onerror = () => { img.src = `${ICON_BASE}inv_misc_questionmark.jpg`; };

  const badge = document.createElement('span');
  badge.className = 'ilvl-badge';
  badge.textContent = item.ilevel || '';

  link.appendChild(img);
  link.appendChild(badge);
  slotEl.appendChild(link);

  // ── Tap-to-tooltip en móvil ──
  link.addEventListener('click', e => {
    if (!isTouchDevice()) return; // escritorio: comportamiento normal
    e.preventDefault();
    openItemPopup(link);
  });
}

function setClassIcon(imgEl, classId) {
  const iconName = getClassIconName(classId);
  imgEl.src = `${ICON_BASE}${iconName}.jpg`;
}

function setClassModelPlaceholder(classId, cls) {
  const modelImg = document.getElementById('characterModel');
  modelImg.src = `${ICON_BASE}${getClassIconName(classId)}.jpg`;
  modelImg.style.height = '50%';
  modelImg.style.filter = `drop-shadow(0 0 20px ${cls.color}80)`;
}

function getClassIconName(classId) {
  const icons = {
    1: 'classicon_warrior', 2: 'classicon_paladin', 3: 'classicon_hunter',
    4: 'classicon_rogue', 5: 'classicon_priest', 6: 'classicon_deathknight',
    7: 'classicon_shaman', 8: 'classicon_mage', 9: 'classicon_warlock',
    10: 'classicon_monk', 11: 'classicon_druid', 12: 'classicon_demonhunter',
  };
  return icons[classId] || 'inv_misc_questionmark';
}

function formatNum(n) {
  return Number(n).toLocaleString('es-AR');
}

// ─── ENTER KEY ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initModelDrag();
  document.getElementById('characterName').addEventListener('keydown', e => {
    if (e.key === 'Enter') buscarPersonaje();
  });
});

// ─── TOUCH DETECTION ─────────────────────────────────────────────────────────
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ─── MOBILE ITEM POPUP ───────────────────────────────────────────────────────
const QUALITY_COLORS_MAP = {
  0: '#9d9d9d', 1: '#ffffff', 2: '#1eff00',
  3: '#0070dd', 4: '#a335ee', 5: '#ff8000', 6: '#e6cc80',
};

async function openItemPopup(linkEl) {
  const id      = linkEl.getAttribute('data-item-id');
  const name    = linkEl.getAttribute('data-item-name');
  const icon    = linkEl.getAttribute('data-item-icon');
  const ilvl    = linkEl.getAttribute('data-item-ilvl');
  const quality = parseInt(linkEl.getAttribute('data-item-quality') || '1');
  const color   = QUALITY_COLORS_MAP[quality] || '#ffffff';
  const wowheadUrl = `${WOWHEAD_BASE}${id}`;

  // Rellenar header del popup
  document.getElementById('popupIcon').src = `${ICON_BASE}${icon}.jpg`;
  document.getElementById('popupIcon').style.borderColor = color;
  document.getElementById('popupName').textContent = name;
  document.getElementById('popupName').style.color = color;
  document.getElementById('popupIlvl').textContent = ilvl ? `Nivel de objeto ${ilvl}` : '';
  document.getElementById('popupWowheadBtn').href = wowheadUrl;
  document.getElementById('popupTooltip').innerHTML = '<span style="color:#8a7050">Cargando...</span>';

  // Mostrar popup inmediatamente con la info básica
  document.getElementById('itemPopup').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Luego cargar el tooltip completo de Wowhead
  try {
    const res = await fetch(`/api/tooltip?id=${id}`);
    if (!res.ok) throw new Error('sin datos');
    const data = await res.json();

    if (data && data.tooltip) {
      // Limpiar el HTML de Wowhead para mostrar solo la tabla de stats
      const tmp = document.createElement('div');
      tmp.innerHTML = data.tooltip;
      // Eliminar elementos no útiles en mobile
      tmp.querySelectorAll('.iconmedium, .icon, br:last-child').forEach(el => el.remove());
      document.getElementById('popupTooltip').innerHTML = tmp.innerHTML;
    } else {
      document.getElementById('popupTooltip').innerHTML = '<span style="color:#8a7050">No se pudo cargar el detalle.</span>';
    }
  } catch {
    document.getElementById('popupTooltip').innerHTML =
      '<span style="color:#8a7050">No se pudo cargar el detalle. Toca el botón para verlo en Wowhead.</span>';
  }
}

function closeItemPopup() {
  document.getElementById('itemPopup').classList.add('hidden');
  document.body.style.overflow = '';
}
