import { useAuth } from "../context/AuthContext";

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div>
        <h1 className="header-title">Система управления доменами</h1>
        <p className="header-subtitle">
          Пользователь: {user?.username || "—"}
        </p>
      </div>

      <button className="logout-button" onClick={logout}>
        Выйти
      </button>
    </header>
  );
}

export default Header;