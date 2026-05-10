import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getClients } from "../api/clients.js";
import {
  exportDomains,
  exportExpiringDomains,
  exportClientPayments,
} from "../api/reports.js";

function ReportsPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [expiringDays, setExpiringDays] = useState(30);
  const [loading, setLoading] = useState({
    domains: false,
    expiring: false,
    payments: false,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClients();
  }, [token]);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
      if (data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка загрузки клиентов");
    }
  };

  const handleExportDomains = async () => {
    setLoading((prev) => ({ ...prev, domains: true }));
    setError(null);
    try {
      await exportDomains();
    } catch (err) {
      console.error(err);
      setError(`Ошибка при экспорте: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, domains: false }));
    }
  };

  const handleExportExpiring = async () => {
    setLoading((prev) => ({ ...prev, expiring: true }));
    setError(null);
    try {
      await exportExpiringDomains(expiringDays);
    } catch (err) {
      console.error(err);
      setError(`Ошибка при экспорте: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, expiring: false }));
    }
  };

  const handleExportPayments = async () => {
    if (!selectedClientId) {
      setError("Выберите клиента");
      return;
    }
    setLoading((prev) => ({ ...prev, payments: true }));
    setError(null);
    try {
      await exportClientPayments(selectedClientId);
    } catch (err) {
      console.error(err);
      setError(`Ошибка при экспорте: ${err.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, payments: false }));
    }
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: "24px", color: "#111827" }}>Отчёты</h1>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={containerStyle}>
        {/* Отчёт: Все домены */}
        <div style={reportCardStyle}>
          <h3 style={{ marginTop: 0, color: "#1f2937" }}>Все домены</h3>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>
            Экспортирует список всех активных доменов со статусами и датами окончания.
          </p>
          <button
            onClick={handleExportDomains}
            disabled={loading.domains}
            style={{
              ...buttonStyle,
              opacity: loading.domains ? 0.6 : 1,
              cursor: loading.domains ? "not-allowed" : "pointer",
            }}
          >
            {loading.domains ? "Экспортирование..." : "Скачать CSV"}
          </button>
        </div>

        {/* Отчёт: Истекающие домены */}
        <div style={reportCardStyle}>
          <h3 style={{ marginTop: 0, color: "#1f2937" }}>Истекающие домены</h3>
          <p style={{ color: "#6b7280", marginBottom: "12px" }}>
            Домены, истекающие в течение:
          </p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
            <input
              type="number"
              min="1"
              max="365"
              value={expiringDays}
              onChange={(e) => setExpiringDays(Number(e.target.value))}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                width: "80px",
              }}
            />
            <span style={{ color: "#6b7280" }}>дней</span>
          </div>
          <button
            onClick={handleExportExpiring}
            disabled={loading.expiring}
            style={{
              ...buttonStyle,
              opacity: loading.expiring ? 0.6 : 1,
              cursor: loading.expiring ? "not-allowed" : "pointer",
            }}
          >
            {loading.expiring ? "Экспортирование..." : "Скачать CSV"}
          </button>
        </div>

        {/* Отчёт: Платежи по клиенту */}
        <div style={reportCardStyle}>
          <h3 style={{ marginTop: 0, color: "#1f2937" }}>Платежи по клиенту</h3>
          <p style={{ color: "#6b7280", marginBottom: "12px" }}>
            Выберите клиента:
          </p>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(Number(e.target.value) || "")}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            <option value="">-- Выберите клиента --</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportPayments}
            disabled={loading.payments || !selectedClientId}
            style={{
              ...buttonStyle,
              opacity: loading.payments || !selectedClientId ? 0.6 : 1,
              cursor:
                loading.payments || !selectedClientId ? "not-allowed" : "pointer",
            }}
          >
            {loading.payments ? "Экспортирование..." : "Скачать CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  padding: "24px",
  backgroundColor: "#f9fafb",
  minHeight: "100vh",
};

const containerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
  gap: "20px",
  marginBottom: "24px",
};

const reportCardStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
};

const buttonStyle = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "background-color 0.2s",
};

const errorStyle = {
  padding: "12px 16px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  marginBottom: "16px",
  border: "1px solid #fecaca",
};

export default ReportsPage;

