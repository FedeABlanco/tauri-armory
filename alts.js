// ─── ALT MANAGER ─────────────────────────────────────────────────────────────
const ALTS_KEY = 'tauriArmoryAlts';

const CLASS_NAMES_ALT = {
  1:'Guerrero', 2:'Paladín', 3:'Cazador', 4:'Pícaro', 5:'Sacerdote',
  6:'C. Muerte', 7:'Chamán', 8:'Mago', 9:'Brujo', 10:'Monje',
  11:'Druida', 12:'C. Demoníaco',
};
const CLASS_COLORS_ALT = {
  1:'#C79C6E', 2:'#F58CBA', 3:'#ABD473', 4:'#FFF569', 5:'#FFFFFF',
  6:'#C41F3B', 7:'#0070DE', 8:'#69CCF0', 9:'#9482C9', 10:'#00FF96',
  11:'#FF7D0A', 12:'#A330C9',
};
const ICON_BASE_ALT = 'https://wow.zamimg.com/images/wow/icons/medium/';

function altGetList() {
  try { return JSON.parse(localStorage.getItem(ALTS_KEY) || '[]'); }
  catch { return []; }
}

function altSaveList(list) {
  localStorage.setItem(ALTS_KEY, JSON.stringify(list));
}

function altAdd() {
  const name  = document.getElementById('altName').value.trim();
  const realm = document.getElementById('altRealm').value;
  if (!name) return;

  const list = altGetList();
  if (list.find(a => a.name.toLowerCase() === name.toLowerCase() && a.realm === realm)) {
    alert('Ese personaje ya está en la lista.');
    return;
  }
  list.push({ name, realm, data: null });
  altSaveList(list);
  document.getElementById('altName').value = '';
  altRenderList();
}

function altRemove(name, realm) {
  const list = altGetList().filter(a => !(a.name === name && a.realm === realm));
  altSaveList(list);
  altRenderList();
}

function altRenderList() {
  const list = altGetList();
  const emptyEl   = document.getElementById('alts-empty');
  const contentEl = document.getElementById('alts-content');

  if (list.length === 0) {
    emptyEl.classList.remove('hidden');
    contentEl.innerHTML = '';
    return;
  }
  emptyEl.classList.add('hidden');

  let html = `
    <div class="alts-summary">
      <div class="lb-summary-card">
        <span class="lb-summary-label">Total de alters</span>
        <span class="lb-summary-val">${list.length}</span>
      </div>
      <div class="lb-summary-card">
        <span class="lb-summary-label">Con datos</span>
        <span class="lb-summary-val">${list.filter(a => a.data).length}</span>
      </div>
    </div>
    <div class="lb-table-wrap">
    <table class="lb-table alts-table">
      <thead>
        <tr>
          <th>Personaje</th>
          <th>Realm</th>
          <th>Nivel</th>
          <th>Clase</th>
          <th>iLvl</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>`;

  list.forEach(alt => {
    const d = alt.data;
    const color = d ? (CLASS_COLORS_ALT[d.class] || '#e8d5a0') : '#5a4020';
    const className = d ? (CLASS_NAMES_ALT[d.class] || '—') : '—';
    const level = d ? d.level : '—';
    const ilvl  = d ? (d.avgitemlevel || '—') : '—';
    const guild = d && d.guildName ? `<div class="lb-guild">&lt;${d.guildName}&gt;</div>` : '';

    let statusHtml = '<span class="alt-status alt-status-pending">Sin datos</span>';
    if (d) {
      statusHtml = '<span class="alt-status alt-status-ok">✓ Actualizado</span>';
    }

    html += `<tr id="alt-row-${CSS.escape(alt.name + alt.realm)}">
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          ${d ? `<img src="${ICON_BASE_ALT}classicon_${getClassIconSlug(d.class)}.jpg" class="alt-class-icon" onerror="this.style.display='none'">` : '<div class="alt-class-icon" style="background:#1a1208;border:1px solid #3a2800"></div>'}
          <div>
            <div style="color:${color};font-weight:bold">${alt.name}</div>
            ${guild}
          </div>
        </div>
      </td>
      <td style="color:#8a7050;font-size:11px">${alt.realm}</td>
      <td>${level}</td>
      <td style="color:${color}">${className}</td>
      <td style="color:#ffd100;font-weight:bold">${ilvl}</td>
      <td>${statusHtml}</td>
      <td>
        <button class="alt-btn-remove" onclick="altRemove('${alt.name.replace(/'/g,"\\'")}','${alt.realm.replace(/'/g,"\\'")}')">✕</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  contentEl.innerHTML = html;
}

async function altRefreshAll() {
  const list = altGetList();
  if (list.length === 0) return;

  const loadEl = document.getElementById('alts-loading');
  loadEl.classList.remove('hidden');

  const results = await Promise.allSettled(
    list.map(alt => fetch('/api/character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ realm: alt.realm, name: alt.name }),
    }).then(r => r.json()))
  );

  results.forEach((res, i) => {
    if (res.status === 'fulfilled' && res.value.success) {
      list[i].data = res.value.response;
    }
  });

  altSaveList(list);
  loadEl.classList.add('hidden');
  altRenderList();
}

function getClassIconSlug(classId) {
  const slugs = {
    1:'warrior', 2:'paladin', 3:'hunter', 4:'rogue', 5:'priest',
    6:'deathknight', 7:'shaman', 8:'mage', 9:'warlock', 10:'monk',
    11:'druid', 12:'demonhunter',
  };
  return slugs[classId] || 'warrior';
}
