// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
let lbCurrentSub = 'pvp2v2';

const CLASS_NAMES_LB = {
  1:'Guerrero', 2:'Paladín', 3:'Cazador', 4:'Pícaro', 5:'Sacerdote',
  6:'C. Muerte', 7:'Chamán', 8:'Mago', 9:'Brujo', 10:'Monje',
  11:'Druida', 12:'C. Demoníaco',
};
const CLASS_COLORS_LB = {
  1:'#C79C6E', 2:'#F58CBA', 3:'#ABD473', 4:'#FFF569', 5:'#FFFFFF',
  6:'#C41F3B', 7:'#0070DE', 8:'#69CCF0', 9:'#9482C9', 10:'#00FF96',
  11:'#FF7D0A', 12:'#A330C9',
};

function lbSwitchSub(sub) {
  lbCurrentSub = sub;
  document.querySelectorAll('.sub-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sub === sub);
  });
  lbLoad();
}

async function lbLoad() {
  const realm = document.getElementById('globalRealm').value;
  const loadEl  = document.getElementById('lb-loading');
  const errEl   = document.getElementById('lb-error');
  const content = document.getElementById('lb-content');

  loadEl.classList.remove('hidden');
  errEl.classList.add('hidden');
  content.innerHTML = '';

  try {
    if (lbCurrentSub === 'pvp2v2' || lbCurrentSub === 'pvp3v3') {
      const bracket = lbCurrentSub === 'pvp2v2' ? '2v2' : '3v3';
      const res = await fetch(`/api/pvp-ladder?realm=${encodeURIComponent(realm)}&bracket=${bracket}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.errorstring || 'Sin datos');
      renderPvpTable(data.response, bracket);
    } else {
      const res = await fetch(`/api/pve-rankings?realm=${encodeURIComponent(realm)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.errorstring || 'Sin datos');
      renderPveTable(data.response);
    }
  } catch (err) {
    errEl.textContent = 'No se pudieron cargar los rankings: ' + err.message;
    errEl.classList.remove('hidden');
  } finally {
    loadEl.classList.add('hidden');
  }
}

function renderPvpTable(rows, bracket) {
  const content = document.getElementById('lb-content');
  if (!rows || rows.length === 0) {
    content.innerHTML = '<div class="status-msg"><span>No hay datos de arena disponibles para este realm.</span></div>';
    return;
  }

  // Tally class distribution
  const classCounts = {};
  rows.forEach(r => {
    const c = r.class;
    if (c) classCounts[c] = (classCounts[c] || 0) + 1;
  });
  const topClass = Object.entries(classCounts).sort((a,b) => b[1]-a[1])[0];

  let html = `
    <div class="lb-summary">
      <div class="lb-summary-card">
        <span class="lb-summary-label">Jugadores en ranking</span>
        <span class="lb-summary-val">${rows.length}</span>
      </div>
      <div class="lb-summary-card">
        <span class="lb-summary-label">Rating más alto</span>
        <span class="lb-summary-val" style="color:#ffd100">${rows[0]?.rating || '—'}</span>
      </div>
      <div class="lb-summary-card">
        <span class="lb-summary-label">Clase dominante</span>
        <span class="lb-summary-val" style="color:${CLASS_COLORS_LB[topClass?.[0]] || '#fff'}">${CLASS_NAMES_LB[topClass?.[0]] || '—'}</span>
      </div>
    </div>
    <div class="lb-table-wrap">
    <table class="lb-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Personaje</th>
          <th>Clase</th>
          <th>Rating</th>
          <th>V</th>
          <th>D</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>`;

  rows.slice(0, 100).forEach((r, i) => {
    const wins   = r.seasonWins   || r.wins   || 0;
    const losses = r.seasonLosses || r.losses || 0;
    const total  = wins + losses;
    const pct    = total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '—';
    const color  = CLASS_COLORS_LB[r.class] || '#e8d5a0';
    const medal  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;

    html += `<tr class="${i < 3 ? 'lb-top3' : ''}">
      <td class="lb-rank">${medal}</td>
      <td class="lb-name">
        <span style="color:${color};font-weight:bold">${r.name || '—'}</span>
        ${r.guildName ? `<span class="lb-guild">&lt;${r.guildName}&gt;</span>` : ''}
      </td>
      <td><span style="color:${color}">${CLASS_NAMES_LB[r.class] || '—'}</span></td>
      <td class="lb-rating">${r.rating || '—'}</td>
      <td class="lb-wins">${wins}</td>
      <td class="lb-losses">${losses}</td>
      <td class="lb-pct">${pct}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  content.innerHTML = html;
}

function renderPveTable(rows) {
  const content = document.getElementById('lb-content');
  if (!rows || rows.length === 0) {
    content.innerHTML = '<div class="status-msg"><span>No hay datos de hermandades disponibles para este realm.</span></div>';
    return;
  }

  let html = `
    <div class="lb-table-wrap">
    <table class="lb-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Hermandad</th>
          <th>Miembros</th>
          <th>Nivel</th>
          <th>Facción</th>
        </tr>
      </thead>
      <tbody>`;

  rows.slice(0, 100).forEach((g, i) => {
    const faction = g.faction === 0 ? '<span style="color:#0070dd">Alianza</span>' : '<span style="color:#cc2200">Horda</span>';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1;
    html += `<tr class="${i < 3 ? 'lb-top3' : ''}">
      <td class="lb-rank">${medal}</td>
      <td class="lb-name" style="color:#c8960c;font-weight:bold">${g.name || '—'}</td>
      <td>${g.memberCount || g.members || '—'}</td>
      <td>${g.level || '—'}</td>
      <td>${faction}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  content.innerHTML = html;
}
