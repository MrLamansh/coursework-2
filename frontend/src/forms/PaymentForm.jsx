import { useEffect, useMemo, useState } from "react";
import { getDomains } from "../api/domains";

const toDatetimeLocalValue = (value) => {
  if (!value) {
	return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
	return typeof value === "string" ? value.slice(0, 16) : "";
  }

  const pad = (number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
	date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toOptionLabel = (item, fallbackPrefix) => {
  if (!item) {
	return "";
  }

  return item.name || `${fallbackPrefix} #${item.id}`;
};

const normalizeNullableInt = (value) => {
  if (value === "" || value === null || value === undefined) {
	return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function PaymentForm({
  onSubmit,
  onCancel,
  loading,
  initialData = null,
  contractOptions = [],
  domainOptions = [],
  paymentTypeOptions = [],
  paymentStatusOptions = [],
}) {
  const [formData, setFormData] = useState({
	amount: "",
	payment_date: "",
	payment_type_id: "",
	payment_status_id: "",
	contract_id: "",
	domain_id: "",
  });
  const [availableDomains, setAvailableDomains] = useState(null);
  const [domainsLoading, setDomainsLoading] = useState(false);

  useEffect(() => {
	if (initialData) {
	  setFormData({
		amount: initialData.amount ? String(initialData.amount) : "",
		payment_date: toDatetimeLocalValue(initialData.payment_date),
		payment_type_id: initialData.payment_type_id || "",
		payment_status_id: initialData.payment_status_id || "",
		contract_id: initialData.contract_id || "",
		domain_id: initialData.domain_id || "",
	  });
	} else {
	  setFormData({
		amount: "",
		payment_date: "",
		payment_type_id: "",
		payment_status_id: "",
		contract_id: "",
		domain_id: "",
	  });
	}
  }, [initialData]);

  const selectedContractId = normalizeNullableInt(formData.contract_id);

  const fallbackDomainsForContract = useMemo(() => {
	if (!selectedContractId) {
	  return [];
	}

	return domainOptions.filter(
	  (domain) => String(domain.contract_id) === String(selectedContractId)
	);
  }, [domainOptions, selectedContractId]);

  const visibleDomains =
	selectedContractId ? availableDomains ?? fallbackDomainsForContract : [];

  useEffect(() => {
	let isActive = true;

	if (!selectedContractId) {
	  setAvailableDomains([]);
	  setDomainsLoading(false);
	  setFormData((prev) =>
		prev.domain_id ? { ...prev, domain_id: "" } : prev
	  );
	  return () => {
		isActive = false;
	  };
	}

	const loadDomains = async () => {
	  setDomainsLoading(true);

	  try {
		const domains = await getDomains(selectedContractId);
		if (!isActive) {
		  return;
		}

		const normalizedDomains = Array.isArray(domains) ? domains : [];
		setAvailableDomains(normalizedDomains);
		setFormData((prev) => {
		  if (!prev.domain_id) {
			return prev;
		  }

		  const hasSelectedDomain = normalizedDomains.some(
			(domain) => String(domain.id) === String(prev.domain_id)
		  );

		  return hasSelectedDomain ? prev : { ...prev, domain_id: "" };
		});
	  } catch (error) {
		if (!isActive) {
		  return;
		}

		setAvailableDomains(fallbackDomainsForContract);
		setFormData((prev) => {
		  if (!prev.domain_id) {
			return prev;
		  }

		  const hasSelectedDomain = fallbackDomainsForContract.some(
			(domain) => String(domain.id) === String(prev.domain_id)
		  );

		  return hasSelectedDomain ? prev : { ...prev, domain_id: "" };
		});
	  } finally {
		if (isActive) {
		  setDomainsLoading(false);
		}
	  }
	};

	loadDomains();

	return () => {
	  isActive = false;
	};
  }, [fallbackDomainsForContract, selectedContractId]);

  const handleChange = (event) => {
	const { name, value } = event.target;

	if (name === "contract_id") {
	  setFormData((prev) => ({
		...prev,
		contract_id: value,
		domain_id: "",
	  }));
	  setAvailableDomains(null);
	  return;
	}

	setFormData((prev) => ({
	  ...prev,
	  [name]: value,
	}));
  };

  const handleSubmit = (event) => {
	event.preventDefault();

	const amount = parseFloat(formData.amount);

	onSubmit({
	  amount: !Number.isNaN(amount) ? amount : 0,
	  payment_date: formData.payment_date,
	  payment_type_id: Number(formData.payment_type_id),
	  payment_status_id: Number(formData.payment_status_id),
	  contract_id: Number(formData.contract_id),
	  domain_id: normalizeNullableInt(formData.domain_id),
	});
  };

  const hasContractOptions = contractOptions.length > 0;
  const hasDomainOptions = visibleDomains.length > 0;
  const hasPaymentTypeOptions = paymentTypeOptions.length > 0;
  const hasPaymentStatusOptions = paymentStatusOptions.length > 0;
  const domainSelectDisabled =
	!selectedContractId || domainsLoading || visibleDomains.length === 0;
  const domainSelectPlaceholder = !selectedContractId
	? "Сначала выберите договор"
	: domainsLoading
	? "Загружаем домены..."
	: visibleDomains.length === 0
	? "У договора нет доменов"
	: "Выберите домен (необязательно)";

  return (
	<form onSubmit={handleSubmit} style={formStyle}>
	  <h3 style={{ marginBottom: "16px" }}>
		{initialData ? "Редактировать платёж" : "Добавить платёж"}
	  </h3>

	  <label style={labelStyle}>
		Сумма (в рублях)
		<input
		  type="number"
		  name="amount"
		  placeholder="0.00"
		  value={formData.amount}
		  onChange={handleChange}
		  required
		  step="0.01"
		  min="0"
		  style={inputStyle}
		/>
	  </label>

	  <label style={labelStyle}>
		Дата платежа
		<input
		  type="datetime-local"
		  name="payment_date"
		  value={formData.payment_date}
		  onChange={handleChange}
		  required
		  style={inputStyle}
		/>
	  </label>

	  <label style={labelStyle}>
		Тип платежа
		{hasPaymentTypeOptions ? (
		  <select
			name="payment_type_id"
			value={formData.payment_type_id}
			onChange={handleChange}
			required
			style={inputStyle}
		  >
			<option value="">Выберите тип</option>
			{paymentTypeOptions.map((item) => (
			  <option key={item.id} value={item.id}>
				{toOptionLabel(item, "Тип")}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="payment_type_id"
			placeholder="ID типа платежа"
			value={formData.payment_type_id}
			onChange={handleChange}
			required
			min="1"
			style={inputStyle}
		  />
		)}
	  </label>

	  <label style={labelStyle}>
		Статус платежа
		{hasPaymentStatusOptions ? (
		  <select
			name="payment_status_id"
			value={formData.payment_status_id}
			onChange={handleChange}
			required
			style={inputStyle}
		  >
			<option value="">Выберите статус</option>
			{paymentStatusOptions.map((item) => (
			  <option key={item.id} value={item.id}>
				{toOptionLabel(item, "Статус")}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="payment_status_id"
			placeholder="ID статуса платежа"
			value={formData.payment_status_id}
			onChange={handleChange}
			required
			min="1"
			style={inputStyle}
		  />
		)}
	  </label>

	  <label style={labelStyle}>
		Договор
		{hasContractOptions ? (
		  <select
			name="contract_id"
			value={formData.contract_id}
			onChange={handleChange}
			required
			style={inputStyle}
		  >
			<option value="">Выберите договор</option>
			{contractOptions.map((contract) => (
			  <option key={contract.id} value={contract.id}>
				{contract.contact_number || `Договор #${contract.id}`}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="contract_id"
			placeholder="ID договора"
			value={formData.contract_id}
			onChange={handleChange}
			required
			min="1"
			style={inputStyle}
		  />
		)}
	  </label>

	  <label style={labelStyle}>
		Домен
		{hasDomainOptions ? (
		  <select
			name="domain_id"
			value={formData.domain_id}
			onChange={handleChange}
			disabled={domainSelectDisabled}
			style={inputStyle}
		  >
			<option value="">{domainSelectPlaceholder}</option>
			{visibleDomains.map((domain) => (
			  <option key={domain.id} value={domain.id}>
				{domain.domain_name || `Домен #${domain.id}`}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="domain_id"
			placeholder="ID домена (необязательно)"
			value={formData.domain_id}
			onChange={handleChange}
			min="1"
			style={inputStyle}
		  />
		)}
	  </label>

	  <div style={{ display: "flex", gap: "12px" }}>
		<button type="submit" disabled={loading} style={saveButtonStyle}>
		  {loading
			? initialData
			  ? "Сохранение..."
			  : "Создание..."
			: initialData
			? "Сохранить изменения"
			: "Сохранить"}
		</button>

		<button type="button" onClick={onCancel} style={cancelButtonStyle}>
		  Отмена
		</button>
	  </div>
	</form>
  );
}

const formStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  border: "1px solid #e5e7eb",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "14px",
  color: "#4b5563",
};

const inputStyle = {
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
};

const saveButtonStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};

const cancelButtonStyle = {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
};

export default PaymentForm;

