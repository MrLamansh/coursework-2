import { useEffect, useState } from "react";

const toOptionLabel = (item, fallbackPrefix) => {
  if (!item) {
	return "";
  }

  return item.name || item.title || `${fallbackPrefix} #${item.id}`;
};

const normalizeNullableInt = (value) => {
  if (value === "" || value === null || value === undefined) {
	return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function RequestForm({
  onSubmit,
  onCancel,
  loading,
  initialData = null,
  requestTypeOptions = [],
  requestStatusOptions = [],
  clientOptions = [],
  contractOptions = [],
  domainOptions = [],
}) {
  const [formData, setFormData] = useState({
	request_type_id: "",
	execution_status_id: "",
	client_id: "",
	contract_id: "",
	domain_id: "",
	assigned_engineer_id: "",
	description: "",
  });

  useEffect(() => {
	if (initialData) {
	  setFormData({
		request_type_id: initialData.request_type_id || "",
		execution_status_id: initialData.execution_status_id || "",
		client_id: initialData.client_id || "",
		contract_id: initialData.contract_id || "",
		domain_id: initialData.domain_id || "",
		assigned_engineer_id: initialData.assigned_engineer_id || "",
		description: initialData.description || "",
	  });
	} else {
	  setFormData({
		request_type_id: "",
		execution_status_id: "",
		client_id: "",
		contract_id: "",
		domain_id: "",
		assigned_engineer_id: "",
		description: "",
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

	onSubmit({
	  request_type_id: Number(formData.request_type_id),
	  execution_status_id: Number(formData.execution_status_id),
	  client_id: Number(formData.client_id),
	  contract_id: normalizeNullableInt(formData.contract_id),
	  domain_id: normalizeNullableInt(formData.domain_id),
	  assigned_engineer_id: normalizeNullableInt(formData.assigned_engineer_id),
	  description: formData.description.trim() || null,
	});
  };

  const hasRequestTypeOptions = requestTypeOptions.length > 0;
  const hasRequestStatusOptions = requestStatusOptions.length > 0;
  const hasClientOptions = clientOptions.length > 0;
  const hasContractOptions = contractOptions.length > 0;
  const hasDomainOptions = domainOptions.length > 0;

  return (
	<form onSubmit={handleSubmit} style={formStyle}>
	  <h3 style={{ marginBottom: "16px" }}>
		{initialData ? "Редактировать заявку" : "Добавить заявку"}
	  </h3>

	  <label style={labelStyle}>
		Тип заявки
		{hasRequestTypeOptions ? (
		  <select
			name="request_type_id"
			value={formData.request_type_id}
			onChange={handleChange}
			required
			style={inputStyle}
		  >
			<option value="">Выберите тип</option>
			{requestTypeOptions.map((item) => (
			  <option key={item.id} value={item.id}>
				{toOptionLabel(item, "Тип")}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="request_type_id"
			placeholder="ID типа заявки"
			value={formData.request_type_id}
			onChange={handleChange}
			required
			min="1"
			style={inputStyle}
		  />
		)}
	  </label>

	  <label style={labelStyle}>
		Статус выполнения
		{hasRequestStatusOptions ? (
		  <select
			name="execution_status_id"
			value={formData.execution_status_id}
			onChange={handleChange}
			required
			style={inputStyle}
		  >
			<option value="">Выберите статус</option>
			{requestStatusOptions.map((item) => (
			  <option key={item.id} value={item.id}>
				{toOptionLabel(item, "Статус")}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="execution_status_id"
			placeholder="ID статуса выполнения"
			value={formData.execution_status_id}
			onChange={handleChange}
			required
			min="1"
			style={inputStyle}
		  />
		)}
	  </label>

	  <label style={labelStyle}>
		Клиент
		{hasClientOptions ? (
		  <select
			name="client_id"
			value={formData.client_id}
			onChange={handleChange}
			required
			style={inputStyle}
		  >
			<option value="">Выберите клиента</option>
			{clientOptions.map((client) => (
			  <option key={client.id} value={client.id}>
				{client.name || client.contact_person || `Клиент #${client.id}`}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="client_id"
			placeholder="ID клиента"
			value={formData.client_id}
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

	  <label style={labelStyle}>
		Назначенный инженер
		<input
		  type="number"
		  name="assigned_engineer_id"
		  placeholder="ID инженера (необязательно)"
		  value={formData.assigned_engineer_id}
		  onChange={handleChange}
		  min="1"
		  style={inputStyle}
		/>
	  </label>

	  <label style={labelStyle}>
		Описание
		<textarea
		  name="description"
		  placeholder="Описание заявки"
		  value={formData.description}
		  onChange={handleChange}
		  rows={4}
		  style={{ ...inputStyle, resize: "vertical" }}
		/>
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

export default RequestForm;

