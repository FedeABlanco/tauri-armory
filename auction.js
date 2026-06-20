// ─── AUCTION HOUSE ────────────────────────────────────────────────────────────
const COPPER_PER_SILVER = 100;
const COPPER_PER_GOLD   = 10000;

function ahFormatPrice(copper) {
  if (!copper || copper <= 0) return '<span style="color:#8a7050">—</span>';
  const g = Math.floor(copper / COPPER_PER_GOLD);
  const s = Math.floor((copper % COPPER_PER_GOLD) / COPPER_PER_SILVER);
  const c = copper % COPPER_PER_SILVER;
  let out = '';
  if (g > 0) out += `<span class="price-gold">${g}o</span> `;
  if (s > 0 || g > 0) out += `<span class="price-silver">${s}p</span> `;
  out += `<span class="price-copper">${c}b</span>`;
  return out;
}

async function ahLoad() {
  const realm   = document.getElementById('globalRealm').value;
  const search  = document.getElementById('ahSearch').value.trim();
  const loadEl  = document.getElementById('ah-loading');
  const errEl   = document.getElementById('ah-error');
  const content = document.getElementById('ah-content');

  if (!search) { alert('Ingresa el nombre de un ítem.'); return; }

  loadEl.classList.remove('hidden');
  errEl.classList.add('hidden');
  content.innerHTML = '';

  try {
    const res  = await fetch(`/api/auction?realm=${encodeURIComponent(realm)}&item=${encodeURIComponent(search)}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.errorstring || 'Sin datos de subasta');

    const rows = data.response;
    if (!rows || rows.length === 0) {
      content.innerHTML = `<div class="status-msg"><span>No se encontraron subastas para "<strong>${search}</strong>" en ${realm}.</span></div>`;
      return;
    }

    // Stats summary
    const prices = rows.map(r => r.buyout || 0).filter(p => p > 0);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const avgPrice = prices.length ? Math.round(prices.reduce((a,b) => a+b, 0) / prices.length) : 0;
    const totalQty = rows.reduce((a, r) => a + (r.count || 1), 0);

    let html = `
      <div class="lb-summary">
        <div class="lb-summary-card">
          <span class="lb-summary-label">Subastas activas</span>
          <span class="lb-summary-val">${rows.length}</span>
        </div>
        <div class="lb-summary-card">
          <span class="lb-summary-label">Precio mínimo</span>
          <span class="lb-summary-val ah-price">${ahFormatPrice(minPrice)}</span>
        </div>
        <div class="lb-summary-card">
          <span class="lb-summary-label">Precio promedio</span>
          <span class="lb-summary-val ah-price">${ahFormatPrice(avgPrice)}</span>
        </div>
        <div class="lb-summary-card">
          <span class="lb-summary-label">Total en stock</span>
          <span class="lb-summary-val">${totalQty}</span>
        </div>
      </div>
      <div class="lb-table-wrap">
      <table class="lb-table">
        <thead>
          <tr>
            <th>Ítem</th>
            <th>Cant.</th>
            <th>Por unidad</th>
            <th>Total</th>
            <th>Vendedor</th>
            <th>Tiempo</th>
          </tr>
        </thead>
        <tbody>`;

    // Sort by unit price ascending
    const sorted = [...rows].sort((a, b) => {
      const au = a.buyout / (a.count || 1);
      const bu = b.buyout / (b.count || 1);
      return au - bu;
    });

    sorted.forEach((r, i) => {
      const qty     = r.count || 1;
      const buyout  = r.buyout || 0;
      const perUnit = qty > 0 ? Math.round(buyout / qty) : 0;
      const timeStr = ahTimeLeft(r.timeLeft);
      const isCheapest = i === 0 ? 'lb-top3' : '';
      const icoName = r.icon ? `https://wow.zamimg.com/images/wow/icons/small/${r.icon}.jpg` : '';

      html += `<tr class="${isCheapest}">
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            ${icoName ? `<img src="${icoName}" class="ah-item-icon" onerror="this.style.display='none'">` : ''}
            <span style="color:#e8d5a0">${r.name || r.itemName || search}</span>
          </div>
        </td>
        <td>${qty}</td>
        <td class="ah-price">${ahFormatPrice(perUnit)}</td>
        <td class="ah-price">${ahFormatPrice(buyout)}</td>
        <td style="color:#8a7050">${r.ownerName || r.owner || '—'}</td>
        <td><span class="ah-time ${ahTimeClass(r.timeLeft)}">${timeStr}</span></td>
      </tr>`;
    });

    html += '</tbody></table></div>';
    content.innerHTML = html;

  } catch (err) {
    errEl.textContent = 'Error al consultar la Casa de Subastas: ' + err.message;
    errEl.classList.remove('hidden');
  } finally {
    loadEl.classList.add('hidden');
  }
}

function ahTimeLeft(t) {
  // Tauri API returns numeric or string time codes
  const map = { 1:'Muy corto', 2:'Corto', 3:'Medio', 4:'Largo', 5:'Muy largo' };
  if (typeof t === 'number') return map[t] || '—';
  return t || '—';
}

function ahTimeClass(t) {
  if (t === 1 || t === 'SHORT') return 'ah-time-short';
  if (t === 2) return 'ah-time-med';
  return 'ah-time-long';
}
