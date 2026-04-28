import { useEffect, useState } from "react";

function ClientForm({ onSubmit, onCancel, loading, initialData = null }) {
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    inn: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        contact_person: initialData.contact_person || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        inn: initialData.inn || "",
      });
    } else {
      setFormData({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        inn: "",
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

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3 style={{ marginBottom: "16px" }}>
        {initialData ? "Редактировать клиента" : "Добавить клиента"}
      </h3>

      <input
        name="name"
        placeholder="Название компании"
        value={formData.name}
        onChange={handleChange}
        required
        style={inputStyle}
      />

      <input
        name="contact_person"
        placeholder="Контактное лицо"
        value={formData.contact_person}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="phone"
        placeholder="Телефон"
        value={formData.phone}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="inn"
        placeholder="ИНН"
        value={formData.inn}
        onChange={handleChange}
        style={inputStyle}
      />

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

export default ClientForm;