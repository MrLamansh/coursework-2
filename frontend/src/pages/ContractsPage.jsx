import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getClients } from "../api/clients";
import {
  createContract,
  deleteContract,
  getContractStatuses,
  getContracts,
  updateContract,
} from "../api/contracts";
import ContractForm from "../forms/ContractForm";

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

const getClientLabel = (client) => {
  if (!client) {
    return null;
  }

  return client.name || client.contact_person || `Клиент #${client.id}`;
};

const getStatusLabel = (status) => {
  if (!status) {
    return null;
  }

  return status.name || `Статус #${status.id}`;
};

function ContractsPage() {
  const auth = useAuth();
  const role = auth?.user?.role || "manager";
  const canManage = role === "manager" || role === "engineer";

  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [contractStatuses, setContractStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [lookupWarning, setLookupWarning] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError("");
      setLookupWarning("");

      const [contractsResult, clientsResult, statusesResult] =
        await Promise.allSettled([
          getContracts(),
          getClients(),
          getContractStatuses(),
        ]);

      if (contractsResult.status === "rejected") {
        const contractsError = contractsResult.reason;
        console.error(contractsError);
        setError(
          contractsError?.response?.data?.detail ||
            "Не удалось загрузить договоры"
        );
        return;
      }

      setContracts(contractsResult.value);

      const warnings = [];

      if (clientsResult.status === "fulfilled") {
        setClients(clientsResult.value);
      } else {
        setClients([]);
        warnings.push(
          "Не удалось загрузить клиентов, в форме можно ввести ID вручную."
        );
      }

      if (statusesResult.status === "fulfilled") {
        setContractStatuses(statusesResult.value);
      } else {
        setContractStatuses([]);
        warnings.push(
          "Не удалось загрузить статусы договоров, в форме можно ввести ID вручную."
        );
      }

      setLookupWarning(warnings.join(" "));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось загрузить договоры");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const clientById = useMemo(() => {
    return new Map(clients.map((client) => [String(client.id), client]));
  }, [clients]);

  const statusById = useMemo(() => {
    return new Map(
      contractStatuses.map((status) => [String(status.id), status])
    );
  }, [contractStatuses]);

  const handleCreateClick = () => {
    setEditingContract(null);
    setShowForm(true);
  };

  const handleEditClick = (contract) => {
    setEditingContract(contract);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingContract(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingContract) {
        await updateContract(editingContract.id, formData);
      } else {
        await createContract(formData);
      }

      setShowForm(false);
      setEditingContract(null);
      await loadContracts();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          (editingContract
            ? "Не удалось обновить договор"
            : "Не удалось создать договор")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = async (contract) => {
    const confirmed = window.confirm(
      `Удалить договор "${contract.contact_number || contract.id}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(contract.id);
      setError("");

      await deleteContract(contract.id);
      await loadContracts();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось удалить договор");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const filteredContracts = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return contracts.filter((contract) => {
      const clientLabel =
        getClientLabel(clientById.get(String(contract.client_id))) ||
        String(contract.client_id || "");
      const statusLabel =
        getStatusLabel(statusById.get(String(contract.status_id))) ||
        String(contract.status_id || "");

      const matchesSearch = [
        contract.contact_number,
        clientLabel,
        statusLabel,
        contract.payment_terms,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        String(contract.status_id) === statusFilter ||
        statusLabel.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [clientById, contracts, searchTerm, statusById, statusFilter]);

  if (loading) {
    return <p>Загрузка договоров...</p>;
  }

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Договоры</h2>
        {canManage ? (
          <button style={addButtonStyle} onClick={handleCreateClick}>
            Добавить договор
          </button>
        ) : (
          <span style={readOnlyHintStyle}>Режим просмотра</span>
        )}
      </div>

      {canManage && showForm && (
        <ContractForm
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          loading={formLoading}
          initialData={editingContract}
          clientOptions={clients}
          statusOptions={contractStatuses}
        />
      )}

      {error && <p style={errorStyle}>{error}</p>}
      {lookupWarning && <p style={warningStyle}>{lookupWarning}</p>}

      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="Поиск по номеру договора, клиенту или статусу"
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
          {contractStatuses.map((status) => (
            <option key={status.id} value={String(status.id)}>
              {getStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      {contracts.length === 0 ? (
        <p>Договоры не найдены.</p>
      ) : filteredContracts.length === 0 ? (
        <p>По текущим фильтрам договоры не найдены.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Номер договора</th>
              <th style={cellStyle}>Дата подписания</th>
              <th style={cellStyle}>Статус</th>
              <th style={cellStyle}>Клиент</th>
              <th style={cellStyle}>Условия оплаты</th>
              {canManage && <th style={cellStyle}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((contract) => {
              const clientLabel =
                getClientLabel(clientById.get(String(contract.client_id))) ||
                `Клиент #${contract.client_id}`;
              const statusLabel =
                getStatusLabel(statusById.get(String(contract.status_id))) ||
                `Статус #${contract.status_id}`;

              return (
                <tr key={contract.id}>
                  <td style={cellStyle}>{contract.id}</td>
                  <td style={cellStyle}>{contract.contact_number || "—"}</td>
                  <td style={cellStyle}>{formatDateTime(contract.sign_date)}</td>
                  <td style={cellStyle}>{statusLabel}</td>
                  <td style={cellStyle}>{clientLabel}</td>
                  <td style={cellStyle} title={contract.payment_terms || ""}>
                    {contract.payment_terms || "—"}
                  </td>
                  {canManage && (
                    <td style={cellStyle}>
                      <div style={actionsStyle}>
                        <button
                          style={editButtonStyle}
                          onClick={() => handleEditClick(contract)}
                        >
                          Редактировать
                        </button>

                        <button
                          style={deleteButtonStyle}
                          onClick={() => handleDeleteClick(contract)}
                          disabled={deleteLoadingId === contract.id}
                        >
                          {deleteLoadingId === contract.id
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
  minWidth: "220px",
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

export default ContractsPage;