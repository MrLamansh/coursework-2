import { useEffect, useState } from "react";

function ClientForm({
  onSubmit,
  onCancel,
  loading,
  initialData = null,
  userOptions = [],
}) {
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    inn: "",
    user_id: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        contact_person: initialData.contact_person || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        inn: initialData.inn || "",
        user_id:
          initialData.user_id === null || initialData.user_id === undefined
            ? ""
            : String(initialData.user_id),
      });
    } else {
      setFormData({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        inn: "",
        user_id: "",
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
      ...formData,
      user_id: formData.user_id === "" ? null : Number(formData.user_id),
    });
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

      <select
        name="user_id"
        value={formData.user_id}
        onChange={handleChange}
        style={inputStyle}
      >
        <option value="">Не привязывать пользователя</option>
        {userOptions.map((user) => (
          <option key={user.id} value={String(user.id)}>
            {user.username} (id: {user.id})
          </option>
        ))}
      </select>

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