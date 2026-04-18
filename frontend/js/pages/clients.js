async function loadClientsFromApi() {
  try {
    const data = await api("/clients/");
    clients = data.map(normalizeClient);
    renderClients();
    refillClientSelects();
  } catch (error) {
    console.error(error);
    showToast("Ошибка загрузки клиентов с сервера", "error");
  }
}

function renderClients() {
  const search = document.getElementById("cli-search")?.value.toLowerCase() || "";
  let list = [...clients];

  if (search) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(search) ||
      (c.contact || "").toLowerCase().includes(search) ||
      (c.email || "").toLowerCase().includes(search) ||
      (c.inn || "").includes(search)
    );
  }

  const tbody = document.getElementById("cli-tbody");
  if (!tbody) return;

  tbody.innerHTML = list.map(c => {
    const domCount = domains.filter(d => d.client == c.id).length;

    return `
      <tr>
        <td>
          <div style="font-weight: 600;">${c.name}</div>
        </td>
        <td>${c.contact || "—"}</td>
        <td>${c.email || "—"}</td>
        <td>${c.phone || "—"}</td>
        <td>${c.inn || "—"}</td>
        <td>${domCount}</td>
        <td>
          <div class="row-actions">
            <button class="row-btn" onclick="openClientModal(${c.id})" title="Редактировать">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
              </svg>
            </button>
            <button class="row-btn" onclick="deleteClient(${c.id})" title="Удалить">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

window.openClientModal = function(id) {
  const c = id ? window.clients.find(x => x.id === id) : null;
  document.getElementById('cli-modal-title').textContent = c ? 'Редактировать клиента' : 'Добавить клиента';
  document.getElementById('cli-modal-id').value      = c?.id || '';
  document.getElementById('cli-modal-name').value    = c?.name || '';
  document.getElementById('cli-modal-contact').value = c?.contact || '';
  document.getElementById('cli-modal-email').value   = c?.email || '';
  document.getElementById('cli-modal-phone').value   = c?.phone || '';
  document.getElementById('modal-client').classList.add('open');
};

async function saveClient() {
  const id = document.getElementById("cli-modal-id").value.trim();

  const formData = {
    name: document.getElementById("cli-modal-name").value.trim(),
    contact: document.getElementById("cli-modal-contact").value.trim(),
    inn: document.getElementById("cli-modal-inn").value.trim(),
    email: document.getElementById("cli-modal-email").value.trim(),
    phone: document.getElementById("cli-modal-phone").value.trim()
  };

  if (!formData.name || !formData.contact) {
    showToast("Заполните обязательные поля", "error");
    return;
  }

  try {
    const payload = clientToApi(formData);

    if (id) {
      await api(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await api("/clients/", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    document.getElementById("modal-client").classList.remove("open");
    showToast(id ? "Клиент обновлён" : "Клиент добавлен", "success");
    await loadClientsFromApi();
  } catch (error) {
    console.error(error);
    showToast("Не удалось сохранить клиента", "error");
  }
}

async function deleteClient(id) {
  if (!confirm("Удалить клиента?")) return;

  try {
    await api(`/clients/${id}`, { method: "DELETE" });
    showToast("Клиент удалён", "info");
    await loadClientsFromApi();
  } catch (error) {
    console.error(error);
    showToast("Не удалось удалить клиента", "error");
  }
}

function refillClientSelects() {
  const selectIds = ["dom-client", "dom-modal-client", "req-modal-client"];

  selectIds.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;

    const currentValue = sel.value;
    sel.innerHTML = '<option value="">Все клиенты</option>';

    if (id !== "dom-client") {
      sel.innerHTML = '<option value="">Выберите клиента</option>';
    }

    clients.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });

    if ([...sel.options].some(o => o.value == currentValue)) {
      sel.value = currentValue;
    }
  });
}