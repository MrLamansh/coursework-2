import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-logo">Domain Manager</h2>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard">Дашборд</NavLink>
        <NavLink to="/clients">Клиенты</NavLink>
        <NavLink to="/domains">Домены</NavLink>
        <NavLink to="/requests">Заявки</NavLink>
        <NavLink to="/contracts">Договоры</NavLink>
        <NavLink to="/payments">Платежи</NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;