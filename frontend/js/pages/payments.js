// js/pages/payments.js — Страница «Платежи»

function renderPayments() {
  const fStatus = document.getElementById('pay-status')?.value || '';
  let list = [...payments];
  if (fStatus) list = list.filter(p => p.status === fStatus);

  const confirmed = payments.filter(p=>p.status==='confirmed').reduce((s,p)=>s+p.amount,0);
  const pending   = payments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.amount,0);
  document.getElementById('pay-confirmed').textContent = fmtMoney(confirmed);
  document.getElementById('pay-pending').textContent   = fmtMoney(pending);

  const tbody = document.getElementById('pay-tbody');
  if (!tbody) return;

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>${fmtDate(p.date)}</td>
      <td><span class="domain-name">${p.domain}</span></td>
      <td>${clientName(p.client)}</td>
      <td>${fmtMoney(p.amount)}</td>
      <td>${p.type === 'renewal' ? 'Продление' : 'Регистрация'}</td>
      <td>${payBadge(p.status)}</td>
      <td>
        ${p.status === 'pending' ? `
          <button class="btn btn-sm btn-primary" onclick="confirmPayment(${p.id})">Подтвердить</button>` : ''}
      </td>
    </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--color-text-muted)">Нет платежей</td></tr>';
}

function confirmPayment(id) {
  const p = payments.find(x=>x.id===id);
  if (p) { p.status = 'confirmed'; showToast('Платёж подтверждён','success'); renderPayments(); }
}
