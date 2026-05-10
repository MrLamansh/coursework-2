import { useEffect, useMemo, useState } from "react";
import { getMyRequests } from "../api/requests";
import { getRequestStatuses, getRequestTypes } from "../api/directories";

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU");
};

function MyRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestTypes, setRequestTypes] = useState([]);
  const [requestStatuses, setRequestStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const requestTypeById = useMemo(() => {
    const map = new Map();
    requestTypes.forEach((item) => {
      map.set(String(item.id), item);
    });
    return map;
  }, [requestTypes]);

  const requestStatusById = useMemo(() => {
    const map = new Map();
    requestStatuses.forEach((item) => {
      map.set(String(item.id), item);
    });
    return map;
  }, [requestStatuses]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const [requestsResult, typesResult, statusesResult] =
        await Promise.allSettled([
          getMyRequests(),
          getRequestTypes(),
          getRequestStatuses(),
        ]);

      if (requestsResult.status === "rejected") {
        const requestsError = requestsResult.reason;
        console.error(requestsError);
        setError(
          requestsError?.response?.data?.detail || "Не удалось загрузить заявки"
        );
        return;
      }

      setRequests(requestsResult.value);
      setRequestTypes(typesResult.status === "fulfilled" ? typesResult.value : []);
      setRequestStatuses(
        statusesResult.status === "fulfilled" ? statusesResult.value : []
      );
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

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredRequests = useMemo(() => {
    return requests
      .filter((request) => {
        const requestTypeLabel =
          requestTypeById.get(String(request.request_type_id))?.name ||
          String(request.request_type_id || "");
        const requestStatusLabel =
          requestStatusById.get(String(request.execution_status_id))?.name ||
          String(request.execution_status_id || "");

        const matchesSearch = [
          request.id,
          request.request_number,
          requestTypeLabel,
          requestStatusLabel,
          request.description,
          request.contract_id,
          request.domain_id,
          request.assigned_engineer_id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "all" ||
          String(request.execution_status_id) === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [
    normalizedSearch,
    requestStatusById,
    requestTypeById,
    requests,
    statusFilter,
  ]);

  if (loading) {
    return <p>Загрузка заявок...</p>;
  }

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Мои заявки</h2>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="Поиск по номеру, типу, описанию"
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
              <th style={cellStyle}>Договор</th>
              <th style={cellStyle}>Домен</th>
              <th style={cellStyle}>Инженер</th>
              <th style={cellStyle}>Описание</th>
              <th style={cellStyle}>Создано</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => {
              const requestTypeLabel =
                requestTypeById.get(String(request.request_type_id))?.name ||
                `Тип #${request.request_type_id}`;
              const requestStatusLabel =
                requestStatusById.get(String(request.execution_status_id))?.name ||
                `Статус #${request.execution_status_id}`;

              return (
                <tr key={request.id}>
                  <td style={cellStyle}>{request.id}</td>
                  <td style={cellStyle}>{request.request_number || "—"}</td>
                  <td style={cellStyle}>{requestTypeLabel}</td>
                  <td style={cellStyle}>{requestStatusLabel}</td>
                  <td style={cellStyle}>{request.contract_id || "—"}</td>
                  <td style={cellStyle}>{request.domain_id || "—"}</td>
                  <td style={cellStyle}>{request.assigned_engineer_id || "—"}</td>
                  <td style={cellStyle}>{request.description || "—"}</td>
                  <td style={cellStyle}>{formatDateTime(request.created_at)}</td>
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
  minWidth: "220px",
  background: "#fff",
};

const errorStyle = {
  color: "red",
  marginBottom: "16px",
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

export default MyRequestsPage;

