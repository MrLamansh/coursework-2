// js/utils.js — Вспомогательные функции (без зависимостей)
// Используются во всех модулях страниц.

// Количество дней до даты истечения (< 0 = просрочено)
function daysUntil(expDate) {
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.round((new Date(expDate) - t) / 86400000);
}

// Процент использованного времени домена (0..100)
function expiryPercent(regDate, expDate) {
  const r = new Date(regDate).getTime();
  const e = new Date(expDate).getTime();
  return Math.max(0, Math.min(100, Math.round((Date.now()-r)/(e-r)*100)));
}

// Форматирование даты: '2026-05-15' -> '15 мая 2026'
function fmtDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
}

// Форматирование денег: 1200 -> '1 200 ₽'
function fmtMoney(n) { return n.toLocaleString('ru-RU') + ' ₽'; }

// HTML бейджа статуса домена
function domainBadge(s) {
  const m = { active:['badge-active','Активный'], expired:['badge-expired','Просрочен'], expiring:['badge-warning','Истекает'] };
  const [c,l] = m[s] || ['badge-new',s];
  return `<span class="badge ${c}"><span class="badge-dot"></span>${l}</span>`;
}

// HTML бейджа статуса заявки
function reqBadge(s) {
  const m = { new:['badge-new','Новая'], in_progress:['badge-inwork','В работе'], completed:['badge-done','Выполнена'], cancelled:['badge-expired','Отменена'] };
  const [c,l] = m[s] || ['badge-new',s];
  return `<span class="badge ${c}">${l}</span>`;
}

// HTML бейджа типа заявки
function reqTypeBadge(t) {
  const m = { renewal:['badge-warning','Продление'], registration:['badge-active','Регистрация'], change:['badge-pending','Изм. DNS'] };
  const [c,l] = m[t] || ['badge-new',t];
  return `<span class="badge ${c}">${l}</span>`;
}

// HTML бейджа статуса платежа
function payBadge(s) {
  const m = { confirmed:['badge-active','Подтверждён'], pending:['badge-pending','Ожид. оплаты'], overdue:['badge-expired','Просрочен'] };
  const [c,l] = m[s] || ['badge-new',s];
  return `<span class="badge ${c}">${l}</span>`;
}

// CSS-класс и текст для поля 'дней осталось'
function daysLeftStyle(d) {
  if (d < 0)   return { cls:'critical', label:'Просрочен на '+(-d)+' дн.' };
  if (d <= 60) return { cls:'warning',  label:d+' дн.' };
  return             { cls:'ok',        label:d+' дн.' };
}

// Цвет прогресс-бара по проценту заполнения
function barColor(pct) {
  if (pct >= 90) return 'var(--color-error)';
  if (pct >= 70) return 'var(--color-warning)';
  return 'var(--color-success)';
}

// Имя клиента по id
function clientName(id) { return clients.find(c=>c.id===id)?.name ?? '—'; }

// Toast-уведомление (type: 'success'|'error'|'info'|'warning')
function showToast(msg, type='info') {
  const icons = {
    success:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>`,
    warning:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>`,
  };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = (icons[type]||'') + '<span>' + msg + '</span>';
  document.getElementById('toast-container').append(el);
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),350); }, 3500);
}
