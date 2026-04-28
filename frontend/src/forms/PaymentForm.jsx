import { useEffect, useState } from "react";

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

  const handleChange = (event) => {
	const { name, value } = event.target;

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
	  domain_id: formData.domain_id ? Number(formData.domain_id) : null,
	});
  };

  const hasContractOptions = contractOptions.length > 0;
  const hasDomainOptions = domainOptions.length > 0;
  const hasPaymentTypeOptions = paymentTypeOptions.length > 0;
  const hasPaymentStatusOptions = paymentStatusOptions.length > 0;

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
			style={inputStyle}
		  >
			<option value="">Без домена</option>
			{domainOptions.map((domain) => (
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

