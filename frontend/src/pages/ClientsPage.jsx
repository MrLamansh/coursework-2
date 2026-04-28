import { useEffect, useState } from "react";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "../api/clients";
import ClientForm from "../forms/ClientForm";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось загрузить клиентов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreateClick = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEditClick = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      setFormLoading(true);
      setError("");

      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }

      setShowForm(false);
      setEditingClient(null);
      await loadClients();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          (editingClient
            ? "Не удалось обновить клиента"
            : "Не удалось создать клиента")
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = async (client) => {
    const confirmed = window.confirm(
      `Удалить клиента "${client.name || client.company_name || client.id}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(client.id);
      setError("");

      await deleteClient(client.id);
      await loadClients();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Не удалось удалить клиента");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div>
      <div style={headerRowStyle}>
        <h2>Клиенты</h2>
        <button style={addButtonStyle} onClick={handleCreateClick}>
          Добавить клиента
        </button>
      </div>

      {showForm && (
        <ClientForm
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          loading={formLoading}
          initialData={editingClient}
        />
      )}

      {error && <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>}

      {loading ? (
        <p>Загрузка клиентов...</p>
      ) : clients.length === 0 ? (
        <p>Клиенты не найдены.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Компания</th>
              <th style={cellStyle}>Контактное лицо</th>
              <th style={cellStyle}>Email</th>
              <th style={cellStyle}>Телефон</th>
              <th style={cellStyle}>ИНН</th>
              <th style={cellStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td style={cellStyle}>{client.id}</td>
                <td style={cellStyle}>{client.name || "—"}</td>
                <td style={cellStyle}>{client.contact_person || "—"}</td>
                <td style={cellStyle}>{client.email || "—"}</td>
                <td style={cellStyle}>{client.phone || "—"}</td>
                <td style={cellStyle}>{client.inn || "—"}</td>
                <td style={cellStyle}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      style={editButtonStyle}
                      onClick={() => handleEditClick(client)}
                    >
                      Редактировать
                    </button>

                    <button
                      style={deleteButtonStyle}
                      onClick={() => handleDeleteClick(client)}
                      disabled={deleteLoadingId === client.id}
                    >
                      {deleteLoadingId === client.id ? "Удаление..." : "Удалить"}
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

export default ClientsPage;