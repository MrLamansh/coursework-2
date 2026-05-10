import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <aside className="sidebar">
      <h2 className="sidebar-logo">Domain Manager</h2>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard">Дашборд</NavLink>

        {/* Меню для всех ролей */}
        {role === "client" && (
          <>
            <NavLink to="/my-domains">Мои домены</NavLink>
            <NavLink to="/my-payments">Мои платежи</NavLink>
            <NavLink to="/my-requests">Мои заявки</NavLink>
          </>
        )}

        {/* Меню для manager */}
        {role === "manager" && (
          <>
            <NavLink to="/clients">Клиенты</NavLink>
            <NavLink to="/domains">Домены</NavLink>
            <NavLink to="/requests">Заявки</NavLink>
            <NavLink to="/contracts">Договоры</NavLink>
            <NavLink to="/payments">Платежи</NavLink>
            <NavLink to="/reports">Отчёты</NavLink>
            <NavLink to="/users">Пользователи</NavLink>
          </>
        )}

        {/* Меню для engineer */}
        {role === "engineer" && (
          <>
            <NavLink to="/domains">Домены</NavLink>
            <NavLink to="/requests">Заявки</NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;