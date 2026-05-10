import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createUser, deleteUser, getUsers, updateUser } from "../api/users";
import UserForm from "../forms/UserForm";
import { formatDate } from "../utils/formatDate";

function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    // Только менеджер может видеть список пользователей
    if (currentUser?.role !== "manager") {
      navigate("/");
      return;
    }
    loadUsers();
  }, [currentUser, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
      setError(error?.response?.data?.detail || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) {
          delete payload.password;
        }
        await updateUser(editingUser.id, payload);
      } else {
        await createUser(formData);
      }

      setShowForm(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error("Ошибка при сохранении пользователя:", error);
      setError(error?.response?.data?.detail || "Не удалось сохранить пользователя");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      return;
    }

    try {
      setError("");
      setDeleteLoadingId(userId);
      await deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
      setError(error?.response?.data?.detail || "Не удалось удалить пользователя");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  if (loading) return <p>Загрузка пользователей...</p>;

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Пользователи</h2>
        <button style={addButtonStyle} onClick={handleOpenCreateModal}>
          Добавить пользователя
        </button>
      </div>

      {showForm && (
        <UserForm
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          loading={formLoading}
          initialData={editingUser}
        />
      )}

      {error && <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>}

      {users.length === 0 ? (
        <p>Пользователи не найдены.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Имя пользователя</th>
              <th style={cellStyle}>Роль</th>
              <th style={cellStyle}>Статус</th>
              <th style={cellStyle}>Создан</th>
              <th style={cellStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={cellStyle}>{user.id}</td>
                <td style={cellStyle}>{user.username || "—"}</td>
                <td style={cellStyle}>{user.role || "—"}</td>
                <td style={cellStyle}>{user.is_active ? "Активен" : "Неактивен"}</td>
                <td style={cellStyle}>{formatDate(user.created_at)}</td>
                <td style={cellStyle}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={editButtonStyle} onClick={() => handleOpenEditModal(user)}>
                      Редактировать
                    </button>
                    <button
                      style={deleteButtonStyle}
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteLoadingId === user.id}
                    >
                      {deleteLoadingId === user.id ? "Удаление..." : "Удалить"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff",
};

const cellStyle = {
  border: "1px solid #e5e7eb",
  padding: "12px",
  textAlign: "left",
};

export default UsersPage;

