// ─── MISIONES ─────────────────────────────────────────────────────────────────
// Búsqueda por nombre = en Wowhead (no hay índice de títulos alcanzable). Por ID
// mostramos el detalle inline (nether.wowhead.com, CORS).
let currentQuestId = null;

function questWowheadUrl(id) { return `https://${i18n.whDomain()}/quest=${id}`; }
function questSearchUrl(q)   { return `https://${i18n.whDomain()}/search?q=${encodeURIComponent(q)}`; }

function questGo() {
  const raw = document.getElementById('questSearch').value.trim();
  if (!raw) return;

  const m = raw.match(/(\d{2,7})/);
  const isMostlyNumeric = /^\D*\d{2,7}\D*$/.test(raw);

  if (m && isMostlyNumeric) {
    openQuest(parseInt(m[1]));
  } else {
    window.open(questSearchUrl(raw), '_blank', 'noopener');
  }
}

async function openQuest(id) {
  currentQuestId = id;
  document.getElementById('quest-empty').classList.add('hidden');
  document.getElementById('quest-result').classList.remove('hidden');

  document.getElementById('questId').textContent = id;
  document.getElementById('questName').textContent = i18n.t('quest.title', { id });
  document.getElementById('questSub').textContent = i18n.t('quest.subLoading');
  document.getElementById('questWowheadBtn').href = questWowheadUrl(id);
  document.getElementById('questTooltip').innerHTML =
    `<span style="color:#8a7050">${i18n.t('quest.loadingWH')}</span>`;

  try {
    const r = await fetch(`https://nether.wowhead.com/tooltip/quest/${id}?locale=${i18n.whLocale()}`, { mode: 'cors' });
    const data = await r.json();

    if (data.name) {
      document.getElementById('questName').textContent = data.name;
      document.getElementById('questSub').textContent = i18n.t('quest.sub');
    }

    let tipHtml = '';
    if (data.tooltip) {
      const tmp = document.createElement('div');
      tmp.innerHTML = data.tooltip;
      tmp.querySelector('b.q, b.q0, b.q1, b.q2, b.q3, b.q4')?.closest('tr')?.remove();
      tipHtml = tmp.innerHTML.trim();
    }
    document.getElementById('questTooltip').innerHTML =
      tipHtml || `<span style="color:#8a7050">${i18n.t('quest.noData')}</span>`;
  } catch (err) {
    document.getElementById('questSub').textContent = '';
    document.getElementById('questTooltip').innerHTML =
      `<span style="color:#8a7050">${i18n.t('quest.loadFail')}</span>`;
  }
}

// Al cambiar de idioma: recargar la misión actual en el nuevo idioma
i18n.onLangChange(() => { if (currentQuestId) openQuest(currentQuestId); });

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('questSearch');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') questGo(); });
});
