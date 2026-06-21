// ─── MISIONES ─────────────────────────────────────────────────────────────────
// Los títulos de misión no están en ninguna base que el servidor pueda buscar, así
// que la búsqueda por nombre se hace en Wowhead. Por ID mostramos el detalle inline
// (nether.wowhead.com permite CORS; locale 6 = español).
const QUEST_WOWHEAD = 'https://es.wowhead.com/quest=';
const QUEST_SEARCH  = 'https://es.wowhead.com/search?q=';
const NETHER_Q      = 'https://nether.wowhead.com/tooltip/quest';

function questGo() {
  const raw = document.getElementById('questSearch').value.trim();
  if (!raw) return;

  const m = raw.match(/(\d{2,7})/);
  const isMostlyNumeric = /^\D*\d{2,7}\D*$/.test(raw);

  if (m && isMostlyNumeric) {
    openQuest(parseInt(m[1]));
  } else {
    window.open(QUEST_SEARCH + encodeURIComponent(raw), '_blank', 'noopener');
  }
}

async function openQuest(id) {
  document.getElementById('quest-empty').classList.add('hidden');
  document.getElementById('quest-result').classList.remove('hidden');

  document.getElementById('questId').textContent = id;
  document.getElementById('questName').textContent = `Misión #${id}`;
  document.getElementById('questSub').textContent = 'Cargando datos de Wowhead...';
  document.getElementById('questWowheadBtn').href = `${QUEST_WOWHEAD}${id}`;
  document.getElementById('questTooltip').innerHTML =
    '<span style="color:#8a7050">Cargando objetivos y recompensas...</span>';

  try {
    const r = await fetch(`${NETHER_Q}/${id}?locale=6`, { mode: 'cors' });
    const data = await r.json();

    if (data.name) {
      document.getElementById('questName').textContent = data.name;
      document.getElementById('questSub').textContent = 'Datos de Wowhead';
    }

    let tipHtml = '';
    if (data.tooltip) {
      const tmp = document.createElement('div');
      tmp.innerHTML = data.tooltip;
      // quitar la fila del título (ya está arriba)
      tmp.querySelector('b.q, b.q0, b.q1, b.q2, b.q3, b.q4')?.closest('tr')?.remove();
      tipHtml = tmp.innerHTML.trim();
    }
    document.getElementById('questTooltip').innerHTML =
      tipHtml || '<span style="color:#8a7050">Sin datos en Wowhead para esta misión.</span>';
  } catch (err) {
    document.getElementById('questSub').textContent = '';
    document.getElementById('questTooltip').innerHTML =
      '<span style="color:#8a7050">No se pudieron cargar los datos. Usá el botón para verla en Wowhead.</span>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('questSearch');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') questGo(); });
});
