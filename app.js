// Los nombres de clase/raza/slot ahora viven en i18n.js (bilingües).
const QUALITY_COLORS = ['#9d9d9d','#ffffff','#1eff00','#0070dd','#a335ee','#ff8000','#e6cc80'];

const ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/large/';
function wowheadItemBase() { return `https://${i18n.whDomain()}/item=`; }

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

// ─── TAB SWITCHING ───────────────────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.remove('hidden');
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
}

function onRealmChange() {
  // el realm global se usa en la búsqueda de personajes; nada más que propagar por ahora
}

// ─── MAIN FETCH ──────────────────────────────────────────────────────────────
async function buscarPersonaje() {
  const realm = document.getElementById('globalRealm').value;
  const name = document.getElementById('characterName').value.trim();

  if (!name) { alert(i18n.t('alert.needName')); return; }

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
      showError(i18n.t('err.tauri') + data.errorstring);
      return;
    }

    renderSheet(data.response);

  } catch (err) {
    showError(i18n.t('err.net') + err.message);
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
let lastChar = null;

function renderSheet(p) {
  lastChar = p;
  const cls = i18n.tClass(p.class);

  // ── Header (texto dependiente del idioma) ──
  document.getElementById('hdrName').textContent = p.name;
  document.getElementById('hdrName').className = `class-${p.class}`;
  relabelSheetHeader(p, cls);
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
  document.getElementById('st-resource').textContent = formatNum(powerVal);

  // ── Show sheet ──
  document.getElementById('sheet').classList.remove('hidden');

  // Trigger Wowhead tooltips re-scan on new content
  if (typeof WH !== 'undefined' && WH.util && WH.util.refreshLinks) {
    WH.util.refreshLinks();
  }
}

// Texto del header que depende del idioma (se re-aplica al cambiar de idioma)
function relabelSheetHeader(p, cls) {
  document.getElementById('hdrSub').textContent =
    i18n.t('lvl.line', { lvl: p.level, race: i18n.raceName(p.race), cls: cls.name }) +
    (p.realm ? ' · ' + p.realm : '') + (p.guildName ? ' <' + p.guildName + '>' : '');
  document.getElementById('barPowerLabel').textContent = cls.power;
  document.getElementById('st-resource-label').textContent = i18n.t('stat.maxOf', { p: cls.power });
}

// Re-etiquetar el header al cambiar de idioma (sin recargar el modelo 3D)
i18n.onLangChange(() => { if (lastChar) relabelSheetHeader(lastChar, i18n.tClass(lastChar.class)); });

function renderSlot(slotEl, item, index) {
  slotEl.innerHTML = '';
  slotEl.className = 'item-slot';
  slotEl.setAttribute('data-label', i18n.slotName(index));

  if (!item || item.entry === 0) {
    slotEl.classList.add('empty');
    return;
  }

  const q = item.rarity || 0;
  slotEl.classList.add(`q${q}`);

  const iconName = item.icon || 'inv_misc_questionmark';
  const iconUrl = `${ICON_BASE}${iconName}.jpg`;
  const wowheadUrl = `${wowheadItemBase()}${item.entry}`;

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
  const wowheadUrl = `${wowheadItemBase()}${id}`;

  // Rellenar header del popup
  document.getElementById('popupIcon').src = `${ICON_BASE}${icon}.jpg`;
  document.getElementById('popupIcon').style.borderColor = color;
  document.getElementById('popupName').textContent = name;
  document.getElementById('popupName').style.color = color;
  document.getElementById('popupIlvl').textContent = ilvl ? i18n.t('item.ilvl', { n: ilvl }) : '';
  document.getElementById('popupWowheadBtn').href = wowheadUrl;
  document.getElementById('popupTooltip').innerHTML = `<span style="color:#8a7050">${i18n.t('item.loading')}</span>`;

  // Mostrar popup inmediatamente con la info básica
  document.getElementById('itemPopup').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Tooltip completo desde nether.wowhead.com (CORS desde el navegador)
  try {
    const res = await fetch(`https://nether.wowhead.com/tooltip/item/${id}?locale=${i18n.whLocale()}`, { mode: 'cors' });
    const data = await res.json();
    if (data && data.tooltip) {
      const tmp = document.createElement('div');
      tmp.innerHTML = data.tooltip;
      tmp.querySelectorAll('.iconmedium, .icon, br:last-child').forEach(el => el.remove());
      document.getElementById('popupTooltip').innerHTML = tmp.innerHTML;
    } else {
      document.getElementById('popupTooltip').innerHTML = `<span style="color:#8a7050">${i18n.t('item.noData')}</span>`;
    }
  } catch {
    document.getElementById('popupTooltip').innerHTML = `<span style="color:#8a7050">${i18n.t('item.loadFail')}</span>`;
  }
}

function closeItemPopup() {
  document.getElementById('itemPopup').classList.add('hidden');
  document.body.style.overflow = '';
}
