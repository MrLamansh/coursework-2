window.loadDomainsFromApi = async function() {
  try {
    const data = await window.api("/domains/");
    window.domains = data.map(window.normalizeDomain);
    renderDomains();
  } catch (error) {
    console.error(error);
    showToast('Ошибка загрузки доменов с сервера', 'error');
  }
};

function renderDomains() {
  const search   = document.getElementById('dom-search')?.value.toLowerCase() || '';
  const fStatus  = document.getElementById('dom-status')?.value || '';
  const fReg     = document.getElementById('dom-registrar')?.value || '';
  const fClient  = document.getElementById('dom-client')?.value || '';

  let list = [...window.domains];
  if (search)  list = list.filter(d => d.name.toLowerCase().includes(search));
  if (fStatus) list = list.filter(d => d.status === fStatus);
  if (fReg)    list = list.filter(d => d.registrar === fReg);
  if (fClient) list = list.filter(d => d.client === +fClient);

  const tbody = document.getElementById('dom-tbody');
  if (!tbody) return;

  // Вспомогательные функции, которые у тебя где-то есть в utils.js (оставляем их)
  const safeDaysUntil = typeof daysUntil === 'function' ? daysUntil : () => 0;
  const safeDaysLeftStyle = typeof daysLeftStyle === 'function' ? daysLeftStyle : () => ({cls: '', label: ''});
  const safeExpiryPercent = typeof expiryPercent === 'function' ? expiryPercent : () => 0;
  const safeBarColor = typeof barColor === 'function' ? barColor : () => '#ccc';
  const safeClientName = typeof clientName === 'function' ? clientName : (id) => `Клиент #${id}`;
  const safeFmtDate = typeof fmtDate === 'function' ? fmtDate : (d) => d;
  const safeFmtMoney = typeof fmtMoney === 'function' ? fmtMoney : (m) => m;
  const safeDomainBadge = typeof domainBadge === 'function' ? domainBadge : (s) => s;

  tbody.innerHTML = list.map(d => {
    const days = safeDaysUntil(d.expDate);
    const {cls, label} = safeDaysLeftStyle(days);
    const pct = safeExpiryPercent(d.regDate, d.expDate);
    
    return `
      <tr>
        <td><span class="domain-name">${d.name}</span></td>
        <td>${safeClientName(d.client)}</td>
        <td>${d.registrar}</td>
        <td>${safeFmtDate(d.expDate)}</td>
        <td><span class="days-left ${cls}">${label}</span>
          <div class="expiry-bar" style="margin-top:4px">
            <div class="expiry-fill" style="width:${pct}%;background:${safeBarColor(pct)}"></div>
          </div>
        </td>
        <td>${safeFmtMoney(d.price)}</td>
        <td>${safeDomainBadge(d.status)}</td>
        <td>
          <div class="row-actions">
            <button class="row-btn" onclick="openDomainModal(${d.id})" title="Редактировать">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="row-btn" onclick="deleteDomain(${d.id})" title="Удалить">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--color-text-muted)">Нет доменов</td></tr>';
}

window.openDomainModal = function(id) {
  const d = id ? window.domains.find(x => x.id === id) : null;
  document.getElementById('dom-modal-title').textContent = d ? 'Редактировать домен' : 'Добавить домен';
  document.getElementById('dom-modal-id').value      = d?.id || '';
  document.getElementById('dom-modal-name').value    = d?.name || '';
  document.getElementById('dom-modal-client').value  = d?.client || '';
  document.getElementById('dom-modal-reg').value     = d?.registrar || '';
  document.getElementById('dom-modal-regdate').value = d?.regDate || '';
  document.getElementById('dom-modal-expdate').value = d?.expDate || '';
  document.getElementById('dom-modal-price').value   = d?.price || '';
  document.getElementById('dom-modal-status').value  = d?.status || 'active';
  document.getElementById('dom-modal-note').value    = d?.note || '';
  document.getElementById('modal-domain').classList.add('open');
};

window.saveDomain = async function() {
  const id = +document.getElementById('dom-modal-id').value;
  const name = document.getElementById('dom-modal-name').value.trim();
  const client = +document.getElementById('dom-modal-client').value;

  if (!name || !client) {
    showToast('Заполните обязательные поля', 'error');
    return;
  }

  // Собираем данные с формы
  const formData = {
    name,
    client_id: client,
    registrar: document.getElementById('dom-modal-reg').value.trim(),
    reg_date: document.getElementById('dom-modal-regdate').value,
    exp_date: document.getElementById('dom-modal-expdate').value,
    status: document.getElementById('dom-modal-status').value
  };

  try {
    // Конвертируем в формат API
    const payload = window.domainToApi(formData);

    if (id) {
      await window.api(`/domains/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await window.api("/domains/", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    document.getElementById('modal-domain').classList.remove('open');
    showToast(id ? 'Домен обновлён' : 'Домен добавлен', 'success');
    await window.loadDomainsFromApi();
  } catch (error) {
    console.error(error);
    showToast('Не удалось сохранить домен', 'error');
  }
};

window.deleteDomain = async function(id) {
  if (!confirm('Удалить домен?')) return;

  try {
    await window.api(`/domains/${id}`, { method: 'DELETE' });
    showToast('Домен удалён', 'info');
    await window.loadDomainsFromApi();
  } catch (error) {
    console.error(error);
    showToast('Не удалось удалить домен', 'error');
  }
};