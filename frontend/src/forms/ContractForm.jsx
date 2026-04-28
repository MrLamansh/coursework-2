import { useEffect, useMemo, useState } from "react";

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

const getClientLabel = (client) => {
  if (!client) {
	return "";
  }

  return client.name || client.contact_person || `Клиент #${client.id}`;
};

const getStatusLabel = (status) => {
  if (!status) {
	return "";
  }

  return status.name || `Статус #${status.id}`;
};

function ContractForm({
  onSubmit,
  onCancel,
  loading,
  initialData = null,
  clientOptions = [],
  statusOptions = [],
}) {
  const [formData, setFormData] = useState({
	contact_number: "",
	sign_date: "",
	status_id: "",
	client_id: "",
	payment_terms: "",
  });

  useEffect(() => {
	if (initialData) {
	  setFormData({
		contact_number: initialData.contact_number || "",
		sign_date: toDatetimeLocalValue(initialData.sign_date),
		status_id: initialData.status_id || "",
		client_id: initialData.client_id || "",
		payment_terms: initialData.payment_terms || "",
	  });
	} else {
	  setFormData({
		contact_number: "",
		sign_date: "",
		status_id: "",
		client_id: "",
		payment_terms: "",
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

  const hasClientOptions = clientOptions.length > 0;
  const hasStatusOptions = statusOptions.length > 0;

  const selectedClientId = String(formData.client_id || "");
  const selectedStatusId = String(formData.status_id || "");

  const clientSelectOptions = useMemo(() => {
	if (!hasClientOptions || !selectedClientId) {
	  return clientOptions;
	}

	const hasSelectedClient = clientOptions.some(
	  (client) => String(client.id) === selectedClientId
	);

	if (hasSelectedClient) {
	  return clientOptions;
	}

	return [
	  ...clientOptions,
	  {
		id: selectedClientId,
		name: `Клиент #${selectedClientId}`,
	  },
	];
  }, [clientOptions, hasClientOptions, selectedClientId]);

  const statusSelectOptions = useMemo(() => {
	if (!hasStatusOptions || !selectedStatusId) {
	  return statusOptions;
	}

	const hasSelectedStatus = statusOptions.some(
	  (status) => String(status.id) === selectedStatusId
	);

	if (hasSelectedStatus) {
	  return statusOptions;
	}

	return [
	  ...statusOptions,
	  {
		id: selectedStatusId,
		name: `Статус #${selectedStatusId}`,
	  },
	];
  }, [hasStatusOptions, selectedStatusId, statusOptions]);

  const handleSubmit = (event) => {
	event.preventDefault();
	onSubmit(formData);
  };

  return (
	<form onSubmit={handleSubmit} style={formStyle}>
	  <h3 style={{ marginBottom: "16px" }}>
		{initialData ? "Редактировать договор" : "Добавить договор"}
	  </h3>

	  <input
		name="contact_number"
		placeholder="Номер договора"
		value={formData.contact_number}
		onChange={handleChange}
		required
		style={inputStyle}
	  />

	  <label style={labelStyle}>
		Дата подписания
		<input
		  type="datetime-local"
		  name="sign_date"
		  value={formData.sign_date}
		  onChange={handleChange}
		  required
		  style={inputStyle}
		/>
	  </label>

	  <label style={labelStyle}>
		Статус договора
		{hasStatusOptions ? (
		  <select
			name="status_id"
			value={formData.status_id}
			onChange={handleChange}
			required
			style={inputStyle}
		  >
			<option value="">Выберите статус</option>
			{statusSelectOptions.map((status) => (
			  <option key={status.id} value={status.id}>
				{getStatusLabel(status)}
			  </option>
			))}
		  </select>
		) : (
		  <input
			type="number"
			name="status_id"
			placeholder="ID статуса договора"
			value={formData.status_id}
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
			{clientSelectOptions.map((client) => (
			  <option key={client.id} value={client.id}>
				{getClientLabel(client)}
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
		Условия оплаты
		<textarea
		  name="payment_terms"
		  placeholder="Условия оплаты"
		  value={formData.payment_terms}
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

export default ContractForm;

