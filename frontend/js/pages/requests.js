// js/pages/requests.js — Страница «Заявки»

async function loadRequestsFromApi() {
  try {
    const res = await fetch(`${API_BASE}/requests`);
    if (!res.ok) throw new Error("Не удалось загрузить заявки");

    const data = await res.json();

    requests = data.map(r => ({
      id: r.id,
      type: r.type,
      client: r.client_id,
      domain: r.domain,
      date: r.date,
      status: r.status,
      assignee: r.assignee || "",
      desc: r.description || ""
    }));

    renderRequests();
  } catch (error) {
    console.error(error);
    showToast("Ошибка загрузки заявок с сервера", "error");
  }
}

function renderRequests() {
  const fStatus = document.getElementById("req-status")?.value || "";
  const fType = document.getElementById("req-type")?.value || "";

  let list = [...requests];
  if (fStatus) list = list.filter(r => r.status === fStatus);
  if (fType) list = list.filter(r => r.type === fType);

  const tbody = document.getElementById("req-tbody");
  if (!tbody) return;

  tbody.innerHTML = list.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${reqTypeBadge(r.type)}</td>
      <td>${clientName(r.client)}</td>
      <td><span class="domain-name">${r.domain}</span></td>
      <td>${fmtDate(r.date)}</td>
      <td>${reqBadge(r.status)}</td>
      <td>${r.assignee || "—"}</td>
      <td>
        <div class="row-actions">
          ${r.status !== "completed" ? `
            <button class="row-btn" onclick="completeRequest(${r.id})" title="Завершить">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          ` : ""}
          <button class="row-btn" onclick="deleteRequest(${r.id})" title="Удалить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("") || `
    <tr>
      <td colspan="8" style="text-align:center;padding:2rem;color:var(--color-text-muted)">
        Нет заявок
      </td>
    </tr>
  `;
}

async function completeRequest(id) {
  const r = requests.find(x => x.id === id);
  if (!r) return;

  const payload = {
    type: r.type,
    client_id: r.client,
    domain: r.domain,
    date: r.date,
    status: "completed",
    assignee: r.assignee,
    description: r.desc
  };

  try {
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Ошибка обновления заявки");

    showToast("Заявка завершена", "success");
    await loadRequestsFromApi();
  } catch (error) {
    console.error(error);
    showToast("Не удалось обновить заявку", "error");
  }
}

async function deleteRequest(id) {
  if (!confirm("Удалить заявку?")) return;

  try {
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("Ошибка удаления заявки");

    showToast("Заявка удалена", "info");
    await loadRequestsFromApi();
  } catch (error) {
    console.error(error);
    showToast("Не удалось удалить заявку", "error");
  }
}

function openRequestModal() {
  document.getElementById("req-modal-domain").value = "";
  document.getElementById("req-modal-client").value = "";
  document.getElementById("req-modal-type").value = "renewal";
  document.getElementById("req-modal-desc").value = "";
  document.getElementById("modal-request").classList.add("open");
}

async function saveRequest() {
  const domain = document.getElementById("req-modal-domain").value.trim();
  const client = +document.getElementById("req-modal-client").value;
  const type = document.getElementById("req-modal-type").value;
  const desc = document.getElementById("req-modal-desc").value.trim();

  if (!domain || !client) {
    showToast("Заполните домен и клиента", "error");
    return;
  }

  const payload = {
    type,
    client_id: client,
    domain,
    date: new Date().toISOString().slice(0, 10),
    status: "new",
    assignee: "",
    description: desc
  };

  try {
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Ошибка создания заявки");

    document.getElementById("modal-request").classList.remove("open");
    showToast("Заявка создана", "success");
    await loadRequestsFromApi();
  } catch (error) {
    console.error(error);
    showToast("Не удалось создать заявку", "error");
  }
}