// ─── MISIONES ─────────────────────────────────────────────────────────────────
// Los títulos de misión no están en ninguna base alcanzable desde el servidor
// (Wowhead bloquea, y el DB2 de retail no trae el texto). Por eso:
//   - Si escribís un ID → mostramos la misión (tooltip de Wowhead al pasar el mouse + link).
//   - Si escribís un nombre → te abrimos la búsqueda en Wowhead (tu navegador no está bloqueado).
const QUEST_WOWHEAD = 'https://es.wowhead.com/quest=';
const QUEST_SEARCH  = 'https://es.wowhead.com/search?q=';

function questGo() {
  const raw = document.getElementById('questSearch').value.trim();
  if (!raw) return;

  // ¿es un ID? (número, o algo tipo "quest=40519")
  const m = raw.match(/(\d{2,7})/);
  const isMostlyNumeric = /^\D*\d{2,7}\D*$/.test(raw);

  if (m && isMostlyNumeric) {
    openQuest(parseInt(m[1]));
  } else {
    // nombre → buscar en Wowhead
    window.open(QUEST_SEARCH + encodeURIComponent(raw), '_blank', 'noopener');
  }
}

function openQuest(id) {
  document.getElementById('quest-empty').classList.add('hidden');
  document.getElementById('quest-result').classList.remove('hidden');

  document.getElementById('questId').textContent = id;
  document.getElementById('questName').textContent = `Misión #${id}`;
  document.getElementById('questSub').textContent = 'Pasá el mouse sobre el enlace para ver objetivos y recompensas';

  const url = `${QUEST_WOWHEAD}${id}`;
  document.getElementById('questWowheadBtn').href = url;

  document.getElementById('questTooltip').innerHTML = `
    <a href="${url}" target="_blank" rel="noopener" class="npc-wh-link quest-wh-link" data-wowhead="quest=${id}">
      📜 Ver tooltip de la misión #${id} (Wowhead)
    </a>
    <p class="npc-hint">El tooltip muestra objetivos, recompensas y quién la da. El detalle completo y el mapa se abren con el botón de abajo.</p>`;

  if (typeof WH !== 'undefined' && WH.Tooltips && WH.Tooltips.refreshLinks) WH.Tooltips.refreshLinks();
  else if (typeof $WowheadPower !== 'undefined' && $WowheadPower.refreshLinks) $WowheadPower.refreshLinks();
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('questSearch');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') questGo(); });
});
