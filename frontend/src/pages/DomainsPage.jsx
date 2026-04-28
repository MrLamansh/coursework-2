import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createDomain,
  deleteDomain,
  getDomains,
  updateDomain,
} from "../api/domains";
import { getContracts } from "../api/contracts";
import {
  getDomainStatuses,
  getRegistrars,
} from "../api/directories";
import { formatDate } from "../utils/formatDate";
import { getExpiryColor, getExpiryLabel } from "../utils/domainExpiry";
import DomainForm from "../forms/DomainForm";

function DomainsPage() {
  const auth = useAuth();
  const role = auth?.user?.role || "manager";
  const canManage = role === "manager" || role === "engineer";
  const [domains, setDomains] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [domainStatuses, setDomainStatuses] = useState([]);
  const [registrars, setRegistrars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [lookupWarning, setLookupWarning] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadDomains = async () => {
    try {
      setLoading(true);
      setError("");

      const [domainsResult, contractsResult, statusesResult, registrarsResult] =
        await Promise.allSettled([
          getDomains(),
          getContracts(),
          getDomainStatuses(),
          getRegistrars(),
        ]);

      if (domainsResult.status === "rejected") {
        const domainsError = domainsResult.reason;
        console.error(domainsError);
        setError(
          domainsError?.response?.data?.detail || "Не удалось загрузить домены"
        );
        return;
      }

      setDomains(domainsResult.value);

      const warnings = [];

      if (contractsResult.status === "fulfilled") {
        setContracts(contractsResult.value);
      } else {
        setContracts([]);
        warnings.push("Не удалось загрузить договоры для формы домена.");
      }

      if (statusesResult.status === "fulfilled") {
        setDomainStatuses(statusesResult.value);
      } else {
        setDomainStatuses([]);
        warnings.push("Не удалось загрузить статусы доменов для формы домена.");
      }

      if (registrarsResult.status === "fulfilled") {
        setRegistrars(registrarsResult.value);
      } else {
        setRegistrars([]);
        warnings.push("Не удалось загрузить регистраторов для формы домена.");
      }

      setLookupWarning(warnings.join(" "));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось загрузить домены");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const handleCreateClick = () => {
    setEditingDomain(null);
    setShowForm(true);
  };

  const handleEditClick = (domain) => {
    setEditingDomain(domain);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingDomain(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingDomain) {
        await updateDomain(editingDomain.id, formData);
      } else {
        await createDomain(formData);
      }

      setShowForm(false);
      setEditingDomain(null);
      await loadDomains();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          (editingDomain
            ? "Не удалось обновить домен"
            : "Не удалось создать домен")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = async (domain) => {
    const confirmed = window.confirm(
      `Удалить домен "${domain.domain_name || domain.id}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(domain.id);
      setError("");

      await deleteDomain(domain.id);
      await loadDomains();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось удалить домен");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const statusOptions = useMemo(() => {
    const uniqueStatuses = [
      ...new Set(
        domains
          .map((domain) => domain.status?.name || domain.status || "")
          .filter(Boolean)
      ),
    ];

    return uniqueStatuses.sort((a, b) => a.localeCompare(b, "ru"));
  }, [domains]);

  const filteredDomains = useMemo(() => {
    return domains.filter((domain) => {
      const domainName = (domain.domain_name || "").toLowerCase();
      const domainStatus = (domain.status?.name || domain.status || "").toLowerCase();

      const matchesSearch = domainName.includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        domainStatus === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [domains, searchTerm, statusFilter]);

  if (loading) {
    return <p>Загрузка доменов...</p>;
  }

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Домены</h2>
        {canManage ? (
          <button style={addButtonStyle} onClick={handleCreateClick}>
            Добавить домен
          </button>
        ) : (
          <span style={readOnlyHintStyle}>Режим просмотра</span>
        )}
      </div>

      {canManage && showForm && (
        <DomainForm
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          loading={formLoading}
          initialData={editingDomain}
          statusOptions={domainStatuses}
          registrarOptions={registrars}
          contractOptions={contracts}
        />
      )}

      {error && <p style={errorStyle}>{error}</p>}
      {lookupWarning && <p style={warningStyle}>{lookupWarning}</p>}

      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="Поиск по имени домена"
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
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {domains.length === 0 ? (
        <p>Домены не найдены.</p>
      ) : filteredDomains.length === 0 ? (
        <p>По текущим фильтрам домены не найдены.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Имя домена</th>
              <th style={cellStyle}>Дата регистрации</th>
              <th style={cellStyle}>Дата окончания</th>
              <th style={cellStyle}>Срок</th>
              <th style={cellStyle}>Статус</th>
              <th style={cellStyle}>Регистратор</th>
              <th style={cellStyle}>Договор</th>
              {canManage && <th style={cellStyle}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {filteredDomains.map((domain) => (
              <tr
                key={domain.id}
                style={{ backgroundColor: getExpiryColor(domain.expiration_date) }}
              >
                <td style={cellStyle}>{domain.id}</td>
                <td style={cellStyle}>{domain.domain_name || "—"}</td>
                <td style={cellStyle}>{formatDate(domain.registration_date)}</td>
                <td style={cellStyle}>{formatDate(domain.expiration_date)}</td>
                <td style={cellStyle}>{getExpiryLabel(domain.expiration_date)}</td>
                <td style={cellStyle}>
                  {domain.status?.name || domain.status || "—"}
                </td>
                <td style={cellStyle}>
                  {domain.registrar?.name || domain.registrar || "—"}
                </td>
                <td style={cellStyle}>
                  {domain.contract?.contact_number || domain.contract_id || "—"}
                </td>
                {canManage && (
                  <td style={cellStyle}>
                    <div style={actionsStyle}>
                      <button
                        style={editButtonStyle}
                        onClick={() => handleEditClick(domain)}
                      >
                        Редактировать
                      </button>

                      <button
                        style={deleteButtonStyle}
                        onClick={() => handleDeleteClick(domain)}
                        disabled={deleteLoadingId === domain.id}
                      >
                        {deleteLoadingId === domain.id ? "Удаление..." : "Удалить"}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
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
};

export default DomainsPage;