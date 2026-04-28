import { useEffect, useMemo, useState } from "react";

const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value.slice(0, 10) : "";
  }

  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getRegistrarLabel = (registrar) => {
  if (!registrar) {
    return "";
  }

  return registrar.name || `Регистратор #${registrar.id}`;
};

const getStatusLabel = (status) => {
  if (!status) {
    return "";
  }

  return status.name || `Статус #${status.id}`;
};

const getContractLabel = (contract) => {
  if (!contract) {
    return "";
  }

  const clientName = contract.client?.name ? ` — ${contract.client.name}` : "";
  return `${contract.contact_number || `Договор #${contract.id}`}${clientName}`;
};

function DomainForm({
  onSubmit,
  onCancel,
  loading,
  initialData = null,
  statusOptions = [],
  registrarOptions = [],
  contractOptions = [],
}) {
  const [formData, setFormData] = useState({
    domain_name: "",
    registration_date: "",
    expiration_date: "",
    current_status_id: "",
    registrar_id: "",
    contract_id: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        domain_name: initialData.domain_name || "",
        registration_date: toDateInputValue(initialData.registration_date),
        expiration_date: toDateInputValue(initialData.expiration_date),
        current_status_id: initialData.current_status_id || "",
        registrar_id: initialData.registrar_id || "",
        contract_id: initialData.contract_id || "",
      });
    } else {
      setFormData({
        domain_name: "",
        registration_date: "",
        expiration_date: "",
        current_status_id: "",
        registrar_id: "",
        contract_id: "",
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
    onSubmit(formData);
  };

  const hasStatusOptions = statusOptions.length > 0;
  const hasRegistrarOptions = registrarOptions.length > 0;
  const hasContractOptions = contractOptions.length > 0;

  const selectedStatusId = String(formData.current_status_id || "");
  const selectedRegistrarId = String(formData.registrar_id || "");
  const selectedContractId = String(formData.contract_id || "");

  const statusSelectOptions = useMemo(() => {
    if (!hasStatusOptions || !selectedStatusId) {
      return statusOptions;
    }

    const hasSelected = statusOptions.some(
      (item) => String(item.id) === selectedStatusId
    );

    return hasSelected
      ? statusOptions
      : [...statusOptions, { id: selectedStatusId, name: `Статус #${selectedStatusId}` }];
  }, [hasStatusOptions, selectedStatusId, statusOptions]);

  const registrarSelectOptions = useMemo(() => {
    if (!hasRegistrarOptions || !selectedRegistrarId) {
      return registrarOptions;
    }

    const hasSelected = registrarOptions.some(
      (item) => String(item.id) === selectedRegistrarId
    );

    return hasSelected
      ? registrarOptions
      : [
          ...registrarOptions,
          { id: selectedRegistrarId, name: `Регистратор #${selectedRegistrarId}` },
        ];
  }, [hasRegistrarOptions, registrarOptions, selectedRegistrarId]);

  const contractSelectOptions = useMemo(() => {
    if (!hasContractOptions || !selectedContractId) {
      return contractOptions;
    }

    const hasSelected = contractOptions.some(
      (item) => String(item.id) === selectedContractId
    );

    return hasSelected
      ? contractOptions
      : [
          ...contractOptions,
          { id: selectedContractId, contact_number: `Договор #${selectedContractId}` },
        ];
  }, [contractOptions, hasContractOptions, selectedContractId]);

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3 style={{ marginBottom: "16px" }}>
        {initialData ? "Редактировать домен" : "Добавить домен"}
      </h3>

      <input
        name="domain_name"
        placeholder="Имя домена (example.com)"
        value={formData.domain_name}
        onChange={handleChange}
        required
        style={inputStyle}
      />

      <label style={labelStyle}>
        Дата регистрации
        <input
          type="date"
          name="registration_date"
          value={formData.registration_date}
          onChange={handleChange}
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Дата окончания
        <input
          type="date"
          name="expiration_date"
          value={formData.expiration_date}
          onChange={handleChange}
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        Статус домена
        {hasStatusOptions ? (
          <select
            name="current_status_id"
            value={formData.current_status_id}
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
            name="current_status_id"
            placeholder="ID статуса домена"
            value={formData.current_status_id}
            onChange={handleChange}
            required
            min="1"
            style={inputStyle}
          />
        )}
      </label>

      <label style={labelStyle}>
        Регистратор
        {hasRegistrarOptions ? (
          <select
            name="registrar_id"
            value={formData.registrar_id}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="">Выберите регистратора</option>
            {registrarSelectOptions.map((registrar) => (
              <option key={registrar.id} value={registrar.id}>
                {getRegistrarLabel(registrar)}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            name="registrar_id"
            placeholder="ID регистратора"
            value={formData.registrar_id}
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
            {contractSelectOptions.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {getContractLabel(contract)}
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
  padding: "10px",
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

export default DomainForm;
