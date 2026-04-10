// js/pages/reports.js — Страница «Отчёты»

function renderReports() {
  document.getElementById('rep-total').textContent    = domains.length;
  document.getElementById('rep-active').textContent   = domains.filter(d=>d.status==='active').length;
  document.getElementById('rep-expired').textContent  = domains.filter(d=>d.status==='expired').length;
  document.getElementById('rep-expiring').textContent = domains.filter(d=>d.status==='expiring').length;
  document.getElementById('rep-clients').textContent  = clients.length;
  document.getElementById('rep-contracts').textContent = contracts.length;
  const total = payments.filter(p=>p.status==='confirmed').reduce((s,p)=>s+p.amount,0);
  document.getElementById('rep-revenue').textContent  = fmtMoney(total);
}

function exportCSV() {
  const rows = [
    ['Домен','Клиент','Регистратор','Дата регистрации','Дата истечения','Цена','Статус','Заметка'],
    ...domains.map(d => [d.name, clientName(d.client), d.registrar, d.regDate, d.expDate, d.price, d.status, d.note])
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'domains_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  showToast('CSV-файл скачан','success');
}
