import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getContracts } from "../api/contracts";
import { getDomains } from "../api/domains";
import {
  createPayment,
  deletePayment,
  getPayments,
  updatePayment,
} from "../api/payments";
import {
  getPaymentStatuses,
  getPaymentTypes,
} from "../api/directories";
import PaymentForm from "../forms/PaymentForm";
import { formatMoney } from "../utils/formatMoney";

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

const getStatusLabel = (status) => {
  if (!status) {
    return null;
  }

  return status.name || `Статус #${status.id}`;
};

function PaymentsPage() {
  const auth = useAuth();
  const role = auth?.user?.role || "manager";
  const canManage = role === "manager";
  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [domains, setDomains] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [lookupWarning, setLookupWarning] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");
      setLookupWarning("");

      const results = await Promise.allSettled([
        getPayments(),
        getContracts(),
        getDomains(),
        getPaymentTypes(),
        getPaymentStatuses(),
      ]);

      const [paymentsResult, contractsResult, domainsResult, typesResult, statusesResult] =
        results;

      if (paymentsResult.status === "rejected") {
        const paymentsError = paymentsResult.reason;
        console.error(paymentsError);
        setError(
          paymentsError?.response?.data?.detail ||
            "Не удалось загрузить платежи"
        );
        return;
      }

      setPayments(paymentsResult.value);

      const warnings = [];

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

      if (typesResult.status === "fulfilled") {
        setPaymentTypes(typesResult.value);
      } else {
        setPaymentTypes([]);
        warnings.push(
          "Не удалось загрузить типы платежей, в форме можно ввести ID вручную."
        );
      }

      if (statusesResult.status === "fulfilled") {
        setPaymentStatuses(statusesResult.value);
      } else {
        setPaymentStatuses([]);
        warnings.push(
          "Не удалось загрузить статусы платежей, в форме можно ввести ID вручную."
        );
      }

      setLookupWarning(warnings.join(" "));
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

  const paymentTypeById = useMemo(
    () => new Map(paymentTypes.map((type) => [String(type.id), type])),
    [paymentTypes]
  );

  const paymentStatusById = useMemo(
    () =>
      new Map(
        paymentStatuses.map((status) => [String(status.id), status])
      ),
    [paymentStatuses]
  );

  const contractById = useMemo(
    () => new Map(contracts.map((contract) => [String(contract.id), contract])),
    [contracts]
  );

  const domainById = useMemo(
    () => new Map(domains.map((domain) => [String(domain.id), domain])),
    [domains]
  );

  const handleCreateClick = () => {
    setEditingPayment(null);
    setShowForm(true);
  };

  const handleEditClick = (payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingPayment) {
        await updatePayment(editingPayment.id, formData);
      } else {
        await createPayment(formData);
      }

      setShowForm(false);
      setEditingPayment(null);
      await loadPayments();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          (editingPayment
            ? "Не удалось обновить платёж"
            : "Не удалось создать платёж")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = async (payment) => {
    const confirmed = window.confirm(
      `Удалить платёж на сумму ${formatMoney(payment.amount)}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(payment.id);
      setError("");

      await deletePayment(payment.id);
      await loadPayments();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось удалить платёж");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return payments.filter((payment) => {
      const paymentTypeLabel =
        paymentTypeById.get(String(payment.payment_type_id))?.name ||
        String(payment.payment_type_id || "");
      const paymentStatusLabel =
        getStatusLabel(
          paymentStatusById.get(String(payment.payment_status_id))
        ) || String(payment.payment_status_id || "");
      const contractLabel =
        contractById.get(String(payment.contract_id))?.contact_number ||
        String(payment.contract_id || "");
      const domainLabel =
        domainById.get(String(payment.domain_id))?.domain_name || "";

      const matchesSearch = [
        String(payment.amount),
        paymentTypeLabel,
        paymentStatusLabel,
        contractLabel,
        domainLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        String(payment.payment_status_id) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    contractById,
    domainById,
    paymentStatusById,
    paymentTypeById,
    payments,
    searchTerm,
    statusFilter,
  ]);

  if (loading) {
    return <p>Загрузка платежей...</p>;
  }

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Платежи</h2>
        {canManage ? (
          <button style={addButtonStyle} onClick={handleCreateClick}>
            Добавить платёж
          </button>
        ) : (
          <span style={readOnlyHintStyle}>Режим просмотра</span>
        )}
      </div>

      {canManage && showForm && (
        <PaymentForm
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          loading={formLoading}
          initialData={editingPayment}
          contractOptions={contracts}
          domainOptions={domains}
          paymentTypeOptions={paymentTypes}
          paymentStatusOptions={paymentStatuses}
        />
      )}

      {error && <p style={errorStyle}>{error}</p>}
      {lookupWarning && <p style={warningStyle}>{lookupWarning}</p>}

      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="Поиск по сумме, договору или домену"
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
              {canManage && <th style={cellStyle}>Действия</th>}
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
              const contractLabel =
                contractById.get(String(payment.contract_id))?.contact_number ||
                `Договор #${payment.contract_id}`;
              const domainLabel =
                domainById.get(String(payment.domain_id))?.domain_name ||
                (payment.domain_id ? `Домен #${payment.domain_id}` : "—");

              return (
                <tr key={payment.id}>
                  <td style={cellStyle}>{payment.id}</td>
                  <td style={cellStyle}>{formatMoney(payment.amount)}</td>
                  <td style={cellStyle}>{paymentTypeLabel}</td>
                  <td style={cellStyle}>{paymentStatusLabel}</td>
                  <td style={cellStyle}>{contractLabel}</td>
                  <td style={cellStyle}>{domainLabel}</td>
                  <td style={cellStyle}>{formatDate(payment.payment_date)}</td>
                  {canManage && (
                    <td style={cellStyle}>
                      <div style={actionsStyle}>
                        <button
                          style={editButtonStyle}
                          onClick={() => handleEditClick(payment)}
                        >
                          Редактировать
                        </button>

                        <button
                          style={deleteButtonStyle}
                          onClick={() => handleDeleteClick(payment)}
                          disabled={deleteLoadingId === payment.id}
                        >
                          {deleteLoadingId === payment.id
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

export default PaymentsPage;

