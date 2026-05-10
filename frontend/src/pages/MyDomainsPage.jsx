import { useEffect, useState } from "react";
import { getMyDomains } from "../api/domains";
import { getDomainStatuses, getRegistrars } from "../api/directories";
import { formatDate } from "../utils/formatDate";
import { getExpiryColor, getExpiryLabel } from "../utils/domainExpiry";

function MyDomainsPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMap, setStatusMap] = useState({});
  const [registrarMap, setRegistrarMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadDomains = async () => {
    try {
      setLoading(true);
      setError("");

      const [domainsResult, statusesResult, registrarsResult] =
        await Promise.allSettled([
          getMyDomains(),
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

      if (statusesResult.status === "fulfilled") {
        const map = {};
        statusesResult.value.forEach((status) => {
          map[String(status.id)] = status.name;
        });
        setStatusMap(map);
      }

      if (registrarsResult.status === "fulfilled") {
        const map = {};
        registrarsResult.value.forEach((registrar) => {
          map[String(registrar.id)] = registrar.name;
        });
        setRegistrarMap(map);
      }
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

  const filteredDomains = domains
    .filter((domain) => {
      const matchesSearch = String(domain.domain_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || String(domain.current_status_id) === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));

  if (loading) {
    return <p>Загрузка доменов...</p>;
  }

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Мои домены</h2>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="Поиск по названию домена"
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
          {Object.entries(statusMap).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
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
                  {domain.status?.name ||
                    statusMap[String(domain.current_status_id)] ||
                    "—"}
                </td>
                <td style={cellStyle}>
                  {domain.registrar?.name ||
                    registrarMap[String(domain.registrar_id)] ||
                    "—"}
                </td>
                <td style={cellStyle}>
                  {domain.contract?.contact_number || domain.contract_id || "—"}
                </td>
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
};

export default MyDomainsPage;

