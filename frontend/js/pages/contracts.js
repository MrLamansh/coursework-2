window.loadContractsFromApi = async function() {
  try {
    const data = await window.api("/contracts/");
    window.contracts = data.map(window.normalizeContract);
    renderContracts();
  } catch (error) {
    console.error(error);
    showToast('Ошибка загрузки контрактов', 'error');
  }
};

function renderContracts() {
  const search = document.getElementById('cnt-search')?.value.toLowerCase() || '';
  const tbody = document.getElementById('cnt-tbody');
  if (!tbody) return;

  let list = [...window.contracts];
  if (search) {
    list = list.filter(c =>
      c.contactnumber.toLowerCase().includes(search) ||
      (window.clients.find(cl => cl.id === c.client)?.name || "").toLowerCase().includes(search)
    );
  }

  tbody.innerHTML = list.map(c => {
    const clientObj = window.clients.find(x => x.id === c.client);
    const cName = clientObj ? clientObj.name : `Клиент #${c.client}`;

    // Значок статуса
    let statusHtml = '';
    if (c.status === 'active' || c.status == 1) {
      statusHtml = '<span class="status-badge status-active">Активен</span>';
    } else {
      statusHtml = '<span class="status-badge status-expired">Закрыт</span>';
    }

    return `
      <tr>
        <td style="font-weight:500;">${c.contactnumber || `Договор #${c.id}`}</td>
        <td>${cName}</td>
        <td>${c.date}</td>
        <td>${c.terms || '—'}</td>
        <td>${statusHtml}</td>
        <td>
          <div class="row-actions">
            <button class="row-btn" onclick="openContractModal(${c.id})" title="Редактировать">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="row-btn" onclick="deleteContract(${c.id})" title="Удалить">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--color-text-muted)">Нет договоров</td></tr>';
}

window.openContractModal = function(id) {
  const c = id ? window.contracts.find(x => x.id === id) : null;

  // Безопасно пытаемся найти элементы. Если их нет, ошибка не вылетит.
  const titleEl = document.getElementById('cnt-modal-title') || document.getElementById('con-modal-title');
  if (titleEl) titleEl.textContent = c ? 'Редактировать договор' : 'Добавить договор';

  const setVal = (id1, id2, val) => {
    const el = document.getElementById(id1) || document.getElementById(id2);
    if (el) el.value = val;
  };

  setVal('cnt-modal-id', 'con-modal-id', c?.id || '');
  setVal('cnt-modal-number', 'con-modal-number', c?.contactnumber || '');
  setVal('cnt-modal-client', 'con-modal-client', c?.client || '');
  setVal('cnt-modal-date', 'con-modal-date', c?.date || '');
  setVal('cnt-modal-terms', 'con-modal-terms', c?.terms || '');
  setVal('cnt-modal-status', 'con-modal-status', c?.status || 'active');

  const modal = document.getElementById('modal-contract');
  if (modal) modal.classList.add('open');
  else console.error("Модальное окно 'modal-contract' не найдено в HTML!");
};

window.saveContract = async function() {
  const id = document.getElementById('cnt-modal-id').value;
  const clientId = document.getElementById('cnt-modal-client').value;
  const number = document.getElementById('cnt-modal-number').value.trim();

  if (!clientId || !number) {
    showToast('Укажите клиента и номер договора', 'error');
    return;
  }

  const formData = {
    contactnumber: number,
    client: clientId,
    date: document.getElementById('cnt-modal-date').value,
    terms: document.getElementById('cnt-modal-terms').value.trim(),
    status: document.getElementById('cnt-modal-status').value
  };

  try {
    const payload = window.contractToApi(formData);

    if (id) {
      await window.api(`/contracts/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await window.api("/contracts/", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    document.getElementById('modal-contract').classList.remove('open');
    showToast(id ? 'Договор обновлён' : 'Договор создан', 'success');
    await window.loadContractsFromApi();
  } catch (error) {
    console.error(error);
    showToast('Не удалось сохранить договор', 'error');
  }
};

window.deleteContract = async function(id) {
  if (!confirm('Удалить договор? Это может повлиять на связанные домены и платежи.')) return;

  try {
    await window.api(`/contracts/${id}`, { method: 'DELETE' });
    showToast('Договор удалён', 'info');
    await window.loadContractsFromApi();
  } catch (error) {
    console.error(error);
    showToast('Ошибка удаления', 'error');
  }
};
