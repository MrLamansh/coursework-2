import { useEffect, useState } from "react";
import { USER_ROLE_LABELS, USER_ROLES } from "../utils/constants";

function UserForm({ onSubmit, onCancel, loading, initialData = null }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "engineer",
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || "",
        password: "",
        role: USER_ROLES.includes(initialData.role) ? initialData.role : "manager",
        is_active: initialData.is_active !== false,
      });
    } else {
      setFormData({
        username: "",
        password: "",
        role: "engineer",
        is_active: true,
      });
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.username.trim()) {
      nextErrors.username = "Имя пользователя обязательно";
    } else if (formData.username.trim().length < 3) {
      nextErrors.username = "Имя пользователя должно быть минимум 3 символа";
    }

    if (!initialData && !formData.password) {
      nextErrors.password = "Пароль обязателен для нового пользователя";
    } else if (formData.password && formData.password.length < 4) {
      nextErrors.password = "Пароль должен быть минимум 4 символа";
    }

    if (!USER_ROLES.includes(formData.role)) {
      nextErrors.role = "Выберите корректную роль";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      username: formData.username.trim(),
      password: initialData && !formData.password ? undefined : formData.password,
      role: formData.role,
      is_active: formData.is_active,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h3 style={{ marginBottom: "16px" }}>
        {initialData ? "Редактировать пользователя" : "Добавить пользователя"}
      </h3>

      <input
        name="username"
        placeholder="Имя пользователя"
        value={formData.username}
        onChange={handleChange}
        required
        style={inputStyle}
        disabled={loading}
      />
      {errors.username && <div style={errorStyle}>{errors.username}</div>}

      <input
        name="password"
        type="password"
        placeholder={initialData ? "Пароль (оставьте пустым, чтобы не менять)" : "Пароль"}
        value={formData.password}
        onChange={handleChange}
        style={inputStyle}
        disabled={loading}
      />
      {errors.password && <div style={errorStyle}>{errors.password}</div>}

      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
        style={inputStyle}
        disabled={loading}
      >
        {USER_ROLES.map((role) => (
          <option key={role} value={role}>
            {USER_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      {errors.role && <div style={errorStyle}>{errors.role}</div>}

      <label style={checkboxRowStyle}>
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          disabled={loading}
        />
        <span>Активный пользователь</span>
      </label>

      <div style={actionsStyle}>
        <button type="submit" style={saveButtonStyle} disabled={loading}>
          {loading ? "Сохранение..." : initialData ? "Обновить" : "Создать"}
        </button>
        <button type="button" onClick={onCancel} style={cancelButtonStyle} disabled={loading}>
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

const errorStyle = {
  color: "#dc2626",
  fontSize: "12px",
  marginTop: "-6px",
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

const checkboxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const actionsStyle = {
  display: "flex",
  gap: "12px",
};

export default UserForm;
