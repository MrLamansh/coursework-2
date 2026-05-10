import { useEffect, useMemo, useState } from "react";
import { getMyPayments } from "../api/payments";
import { getPaymentStatuses, getPaymentTypes } from "../api/directories";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU");
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return "—";
  }

  const num = parseFloat(value);
  return !Number.isNaN(num)
    ? num.toLocaleString("ru-RU", { style: "currency", currency: "RUB" })
    : String(value);
};

const getStatusLabel = (status) => {
  if (!status) {
    return null;
  }

  return status.name || `Статус #${status.id}`;
};

function MyPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const paymentTypeById = useMemo(() => {
    const map = new Map();
    paymentTypes.forEach((item) => {
      map.set(String(item.id), item);
    });
    return map;
  }, [paymentTypes]);

  const paymentStatusById = useMemo(() => {
    const map = new Map();
    paymentStatuses.forEach((item) => {
      map.set(String(item.id), item);
    });
    return map;
  }, [paymentStatuses]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentsResult, typesResult, statusesResult] =
        await Promise.allSettled([
          getMyPayments(),
          getPaymentTypes(),
          getPaymentStatuses(),
        ]);

      if (paymentsResult.status === "rejected") {
        const paymentsError = paymentsResult.reason;
        console.error(paymentsError);
        setError(
          paymentsError?.response?.data?.detail || "Не удалось загрузить платежи"
        );
        return;
      }

      setPayments(paymentsResult.value);
      setPaymentTypes(typesResult.status === "fulfilled" ? typesResult.value : []);
      setPaymentStatuses(
        statusesResult.status === "fulfilled" ? statusesResult.value : []
      );
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось загрузить платежи");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        const paymentTypeLabel =
          paymentTypeById.get(String(payment.payment_type_id))?.name ||
          String(payment.payment_type_id || "");
        const paymentStatusLabel =
          getStatusLabel(
            paymentStatusById.get(String(payment.payment_status_id))
          ) || String(payment.payment_status_id || "");

        const matchesSearch = [
          payment.id,
          paymentTypeLabel,
          paymentStatusLabel,
          payment.amount,
          payment.contract_id,
          payment.domain_id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "all" ||
          String(payment.payment_status_id) === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  }, [
    normalizedSearch,
    paymentStatusById,
    paymentTypeById,
    payments,
    statusFilter,
  ]);

  if (loading) {
    return <p>Загрузка платежей...</p>;
  }

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Мои платежи</h2>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="Поиск по платежам"
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
          {paymentStatuses.map((status) => (
            <option key={status.id} value={String(status.id)}>
              {getStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      {payments.length === 0 ? (
        <p>Платежи не найдены.</p>
      ) : filteredPayments.length === 0 ? (
        <p>По текущим фильтрам платежи не найдены.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Сумма</th>
              <th style={cellStyle}>Тип</th>
              <th style={cellStyle}>Статус</th>
              <th style={cellStyle}>Договор</th>
              <th style={cellStyle}>Домен</th>
              <th style={cellStyle}>Дата платежа</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => {
              const paymentTypeLabel =
                paymentTypeById.get(String(payment.payment_type_id))?.name ||
                `Тип #${payment.payment_type_id}`;
              const paymentStatusLabel =
                getStatusLabel(
                  paymentStatusById.get(String(payment.payment_status_id))
                ) || `Статус #${payment.payment_status_id}`;

              return (
                <tr key={payment.id}>
                  <td style={cellStyle}>{payment.id}</td>
                  <td style={cellStyle}>{formatCurrency(payment.amount)}</td>
                  <td style={cellStyle}>{paymentTypeLabel}</td>
                  <td style={cellStyle}>{paymentStatusLabel}</td>
                  <td style={cellStyle}>{payment.contract_id || "—"}</td>
                  <td style={cellStyle}>{payment.domain_id || "—"}</td>
                  <td style={cellStyle}>{formatDate(payment.payment_date)}</td>
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

export default MyPaymentsPage;

