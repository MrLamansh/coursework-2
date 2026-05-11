import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getClients } from "../api/clients";
import { getContracts } from "../api/contracts";
import { getDomains } from "../api/domains";
import {
  createRequest,
  deleteRequest,
  getRequests,
  updateRequest,
} from "../api/requests";
import {
  getRequestStatuses,
  getRequestTypes,
} from "../api/directories";
import { getUsers } from "../api/users";
import RequestForm from "../forms/RequestForm";

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const getLabel = (item, fallbackPrefix) => {
  if (!item) {
    return null;
  }

  return item.name || `${fallbackPrefix} #${item.id}`;
};

function RequestsPage() {
  const auth = useAuth();
  const role = auth?.user?.role || "manager";
  const canManageRequests = role === "manager";

  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [domains, setDomains] = useState([]);
  const [requestStatuses, setRequestStatuses] = useState([]);
  const [requestTypes, setRequestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [lookupWarning, setLookupWarning] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      setLookupWarning("");

      const results = await Promise.allSettled([
        getRequests(),
        getClients(),
        getContracts(),
        getDomains(),
        getRequestStatuses(),
        getRequestTypes(),
        getUsers(),
      ]);

      const [
        requestsResult,
        clientsResult,
        contractsResult,
        domainsResult,
        statusesResult,
        typesResult,
        usersResult,
      ] = results;

      if (requestsResult.status === "rejected") {
        const requestsError = requestsResult.reason;
        console.error(requestsError);
        setError(
          requestsError?.response?.data?.detail ||
            "Не удалось загрузить заявки"
        );
        return;
      }

      setRequests(requestsResult.value);

      const warnings = [];

      if (clientsResult.status === "fulfilled") {
        setClients(clientsResult.value);
      } else {
        setClients([]);
        warnings.push("Не удалось загрузить клиентов, будут показаны только ID.");
      }

      if (contractsResult.status === "fulfilled") {
        setContracts(contractsResult.value);
      } else {
        setContracts([]);
        warnings.push("Не удалось загрузить договоры, будут показаны только ID.");
      }

      if (domainsResult.status === "fulfilled") {
        setDomains(domainsResult.value);
      } else {
        setDomains([]);
        warnings.push("Не удалось загрузить домены, будут показаны только ID.");
      }

      if (statusesResult.status === "fulfilled") {
        setRequestStatuses(statusesResult.value);
      } else {
        setRequestStatuses([]);
        warnings.push(
          "Не удалось загрузить статусы заявок, в форме можно ввести ID вручную."
        );
      }

      if (typesResult.status === "fulfilled") {
        setRequestTypes(typesResult.value);
      } else {
        setRequestTypes([]);
        warnings.push(
          "Не удалось загрузить типы заявок, в форме можно ввести ID вручную."
        );
      }

      if (usersResult?.status === "fulfilled") {
        setUsers(usersResult.value);
        setEngineers(
          Array.isArray(usersResult.value)
            ? usersResult.value.filter((u) => u.role === "engineer")
            : []
        );
      } else {
        setUsers([]);
        setEngineers([]);
        warnings.push("Не удалось загрузить пользователей, инженеры будут показаны по ID.");
      }

      setLookupWarning(warnings.join(" "));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const clientById = useMemo(
    () => new Map(clients.map((client) => [String(client.id), client])),
    [clients]
  );

  const contractById = useMemo(
    () => new Map(contracts.map((contract) => [String(contract.id), contract])),
    [contracts]
  );

  const domainById = useMemo(
    () => new Map(domains.map((domain) => [String(domain.id), domain])),
    [domains]
  );

  const userById = useMemo(
    () => new Map(users.map((u) => [String(u.id), u])),
    [users]
  );

  const requestStatusById = useMemo(
    () =>
      new Map(
        requestStatuses.map((status) => [String(status.id), status])
      ),
    [requestStatuses]
  );

  const requestTypeById = useMemo(
    () => new Map(requestTypes.map((type) => [String(type.id), type])),
    [requestTypes]
  );

  const handleCreateClick = () => {
    setEditingRequest(null);
    setShowForm(true);
  };

  const handleEditClick = (request) => {
    setEditingRequest(request);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRequest(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingRequest) {
        await updateRequest(editingRequest.id, formData);
      } else {
        await createRequest(formData);
      }

      setShowForm(false);
      setEditingRequest(null);
      await loadRequests();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          (editingRequest
            ? "Не удалось обновить заявку"
            : "Не удалось создать заявку")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = async (request) => {
    const confirmed = window.confirm(
      `Удалить заявку "${request.request_number || request.id}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(request.id);
      setError("");

      await deleteRequest(request.id);
      await loadRequests();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось удалить заявку");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return requests.filter((request) => {
      const requestTypeLabel =
        getLabel(requestTypeById.get(String(request.request_type_id)), "Тип") ||
        String(request.request_type_id || "");
      const requestStatusLabel =
        getLabel(
          requestStatusById.get(String(request.execution_status_id)),
          "Статус"
        ) || String(request.execution_status_id || "");
      const clientLabel =
        getLabel(clientById.get(String(request.client_id)), "Клиент") ||
        String(request.client_id || "");
      const contractLabel =
        contractById.get(String(request.contract_id))?.contact_number ||
        String(request.contract_id || "");
      const domainLabel =
        domainById.get(String(request.domain_id))?.domain_name ||
        String(request.domain_id || "");

      const matchesSearch = [
        request.request_number,
        requestTypeLabel,
        requestStatusLabel,
        clientLabel,
        contractLabel,
        domainLabel,
        request.description,
        userById.get(String(request.assigned_engineer_id))?.username || request.assigned_engineer_id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        String(request.execution_status_id) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    clientById,
    contractById,
    domainById,
    requestStatusById,
    requestTypeById,
    requests,
    searchTerm,
    statusFilter,
  ]);

  if (loading) {
    return <p>Загрузка заявок...</p>;
  }

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Заявки</h2>
        {canManageRequests ? (
          <button style={addButtonStyle} onClick={handleCreateClick}>
            Добавить заявку
          </button>
        ) : (
          // Показываем подсказку "Режим просмотра" только клиентам, инженерам она не нужна
          role === "client" ? (
            <span style={readOnlyHintStyle}>Режим просмотра</span>
          ) : null
        )}
      </div>

      {canManageRequests && showForm && (
        <RequestForm
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          loading={formLoading}
          initialData={editingRequest}
          requestTypeOptions={requestTypes}
          requestStatusOptions={requestStatuses}
          clientOptions={clients}
          contractOptions={contracts}
          domainOptions={domains}
          engineerOptions={engineers}
        />
      )}

      {error && <p style={errorStyle}>{error}</p>}
      {lookupWarning && <p style={warningStyle}>{lookupWarning}</p>}

      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="Поиск по номеру, клиенту, договору, домену или описанию"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="all">Все статусы</option>
          {requestStatuses.map((status) => (
            <option key={status.id} value={String(status.id)}>
              {status.name || `Статус #${status.id}`}
            </option>
          ))}
        </select>
      </div>

      {requests.length === 0 ? (
        <p>Заявки не найдены.</p>
      ) : filteredRequests.length === 0 ? (
        <p>По текущим фильтрам заявки не найдены.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Номер</th>
              <th style={cellStyle}>Тип</th>
              <th style={cellStyle}>Статус</th>
              <th style={cellStyle}>Клиент</th>
              <th style={cellStyle}>Договор</th>
              <th style={cellStyle}>Домен</th>
              <th style={cellStyle}>Инженер</th>
              <th style={cellStyle}>Описание</th>
              <th style={cellStyle}>Создано</th>
              {canManageRequests && <th style={cellStyle}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => {
              const requestTypeLabel =
                getLabel(
                  requestTypeById.get(String(request.request_type_id)),
                  "Тип"
                ) || `Тип #${request.request_type_id}`;
              const requestStatusLabel =
                getLabel(
                  requestStatusById.get(String(request.execution_status_id)),
                  "Статус"
                ) || `Статус #${request.execution_status_id}`;
              const clientLabel =
                getLabel(clientById.get(String(request.client_id)), "Клиент") ||
                `Клиент #${request.client_id}`;
              const contractLabel =
                contractById.get(String(request.contract_id))?.contact_number ||
                (request.contract_id ? `Договор #${request.contract_id}` : "—");
              const domainLabel =
                domainById.get(String(request.domain_id))?.domain_name ||
                (request.domain_id ? `Домен #${request.domain_id}` : "—");

              return (
                <tr key={request.id}>
                  <td style={cellStyle}>{request.id}</td>
                  <td style={cellStyle}>{request.request_number || "—"}</td>
                  <td style={cellStyle}>{requestTypeLabel}</td>
                  <td style={cellStyle}>{requestStatusLabel}</td>
                  <td style={cellStyle}>{clientLabel}</td>
                  <td style={cellStyle}>{contractLabel}</td>
                  <td style={cellStyle}>{domainLabel}</td>
                  <td style={cellStyle}>
                    {userById.get(String(request.assigned_engineer_id))?.username || "—"}
                  </td>
                  <td style={cellStyle} title={request.description || ""}>
                    {request.description || "—"}
                  </td>
                  <td style={cellStyle}>{formatDateTime(request.created_at)}</td>
                  {canManageRequests && (
                    <td style={cellStyle}>
                      <div style={actionsStyle}>
                        <button
                          style={editButtonStyle}
                          onClick={() => handleEditClick(request)}
                        >
                          Редактировать
                        </button>

                        <button
                          style={deleteButtonStyle}
                          onClick={() => handleDeleteClick(request)}
                          disabled={deleteLoadingId === request.id}
                        >
                          {deleteLoadingId === request.id
                            ? "Удаление..."
                            : "Удалить"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  gap: "12px",
  flexWrap: "wrap",
};

const readOnlyHintStyle = {
  background: "#e0f2fe",
  color: "#075985",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "14px",
};

const filtersStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "16px",
  flexWrap: "wrap",
};

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  minWidth: "240px",
  background: "#fff",
};

const errorStyle = {
  color: "red",
  marginBottom: "16px",
};

const warningStyle = {
  color: "#b45309",
  marginBottom: "16px",
};

const addButtonStyle = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};

const editButtonStyle = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
};

const deleteButtonStyle = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "8px",
  cursor: "pointer",
};

const actionsStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
};

const cellStyle = {
  border: "1px solid #e5e7eb",
  padding: "12px",
  textAlign: "left",
  verticalAlign: "top",
};

export default RequestsPage;