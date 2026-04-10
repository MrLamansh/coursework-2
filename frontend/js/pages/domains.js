const API_BASE = 'http://127.0.0.1:8000';

async function loadDomainsFromApi() {
  try {
    const res = await fetch(`${API_BASE}/domains`);
    if (!res.ok) throw new Error('Не удалось загрузить домены');

    const data = await res.json();

    domains = data.map(d => ({
      id: d.id,
      name: d.name,
      client: d.client_id,
      registrar: d.registrar,
      regDate: d.reg_date,
      expDate: d.exp_date,
      price: Number(d.price),
      status: d.status,
      note: d.note || ''
    }));

    renderDomains();
  } catch (error) {
    console.error(error);
    showToast('Ошибка загрузки доменов с сервера', 'error');
  }
}

function renderDomains() {
  const search   = document.getElementById('dom-search')?.value.toLowerCase() || '';
  const fStatus  = document.getElementById('dom-status')?.value || '';
  const fReg     = document.getElementById('dom-registrar')?.value || '';
  const fClient  = document.getElementById('dom-client')?.value || '';

  let list = [...domains];
  if (search)  list = list.filter(d => d.name.toLowerCase().includes(search));
  if (fStatus) list = list.filter(d => d.status === fStatus);
  if (fReg)    list = list.filter(d => d.registrar === fReg);
  if (fClient) list = list.filter(d => d.client === +fClient);

  const tbody = document.getElementById('dom-tbody');
  if (!tbody) return;

  tbody.innerHTML = list.map(d => {
    const days = daysUntil(d.expDate);
    const {cls, label} = daysLeftStyle(days);
    const pct = expiryPercent(d.regDate, d.expDate);
    return `
      <tr>
        <td><span class="domain-name">${d.name}</span></td>
        <td>${clientName(d.client)}</td>
        <td>${d.registrar}</td>
        <td>${fmtDate(d.expDate)}</td>
        <td><span class="days-left ${cls}">${label}</span>
          <div class="expiry-bar" style="margin-top:4px">
            <div class="expiry-fill" style="width:${pct}%;background:${barColor(pct)}"></div>
          </div>
        </td>
        <td>${fmtMoney(d.price)}</td>
        <td>${domainBadge(d.status)}</td>
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

function openDomainModal(id) {
  const d = id ? domains.find(x=>x.id===id) : null;
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
}

async function saveDomain() {
  const id = +document.getElementById('dom-modal-id').value;
  const name = document.getElementById('dom-modal-name').value.trim();
  const client = +document.getElementById('dom-modal-client').value;

  if (!name || !client) {
    showToast('Заполните обязательные поля', 'error');
    return;
  }

  const payload = {
    name,
    client_id: client,
    registrar: document.getElementById('dom-modal-reg').value.trim(),
    reg_date: document.getElementById('dom-modal-regdate').value,
    exp_date: document.getElementById('dom-modal-expdate').value,
    price: +document.getElementById('dom-modal-price').value || 0,
    status: document.getElementById('dom-modal-status').value,
    note: document.getElementById('dom-modal-note').value.trim()
  };

  try {
    const url = id ? `${API_BASE}/domains/${id}` : `${API_BASE}/domains`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Ошибка сохранения домена');
    }

    document.getElementById('modal-domain').classList.remove('open');
    showToast(id ? 'Домен обновлён' : 'Домен добавлен', 'success');
    await loadDomainsFromApi();
  } catch (error) {
    console.error(error);
    showToast('Не удалось сохранить домен', 'error');
  }
}

async function deleteDomain(id) {
  if (!confirm('Удалить домен?')) return;

  try {
    const res = await fetch(`${API_BASE}/domains/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error('Ошибка удаления домена');
    }

    showToast('Домен удалён', 'info');
    await loadDomainsFromApi();
  } catch (error) {
    console.error(error);
    showToast('Не удалось удалить домен', 'error');
  }
}
