// js/pages/dashboard.js — Страница «Дашборд»
// Отвечает за отрисовку KPI, алертов, таблицы ближайших
// продлений и ленты событий.

function renderDashboard() {
  // Подсчёт KPI из массива domains
  const total    = domains.length;
  const expired  = domains.filter(d => d.status === 'expired').length;
  const expiring = domains.filter(d => d.status === 'expiring').length;
  const revenue  = payments.filter(p => p.status === 'confirmed').reduce((s,p)=>s+p.amount,0);

  document.getElementById('kpi-total').textContent    = total;
  document.getElementById('kpi-expiring').textContent = expiring;
  document.getElementById('kpi-expired').textContent  = expired;
  document.getElementById('kpi-revenue').textContent  = fmtMoney(revenue);

  // Алерты: просроченные домены
  const alertBox = document.getElementById('dash-alerts');
  alertBox.innerHTML = '';
  const expiredList = domains.filter(d => d.status === 'expired');
  if (expiredList.length) {
    const names = expiredList.map(d => d.name).join(', ');
    alertBox.innerHTML = `
      <div class="alert-strip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
        <div>
          <div class="alert-title">Просрочено доменов: ${expiredList.length}</div>
          <div class="alert-body">${names}</div>
        </div>
      </div>`;
  }

  // Ближайшие продления (отсортированные по дате истечения)
  const sorted = [...domains].sort((a,b) => new Date(a.expDate)-new Date(b.expDate)).slice(0,5);
  const tbody = document.getElementById('dash-renewals');
  tbody.innerHTML = sorted.map(d => {
    const days = daysUntil(d.expDate);
    const {cls, label} = daysLeftStyle(days);
    const pct = expiryPercent(d.regDate, d.expDate);
    return `
      <tr>
        <td><span class="domain-name">${d.name}</span></td>
        <td>${clientName(d.client)}</td>
        <td>${fmtDate(d.expDate)}</td>
        <td><span class="days-left ${cls}">${label}</span></td>
        <td>
          <div class="expiry-bar">
            <div class="expiry-fill" style="width:${pct}%;background:${barColor(pct)}"></div>
          </div>
        </td>
        <td>${domainBadge(d.status)}</td>
      </tr>`;
  }).join('');

  // Лента событий
  const feed = document.getElementById('dash-activity');
  feed.innerHTML = activity.map(a => `
    <div class="tl-item">
      <div class="tl-dot ${a.type}"></div>
      <div>
        <div class="tl-title">${a.title}</div>
        <div class="tl-meta">${a.meta}</div>
      </div>
    </div>`).join('');
}
