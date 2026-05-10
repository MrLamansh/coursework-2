import { useAuth } from "../context/AuthContext";
import { APP_NAME } from "../utils/constants";

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div>
        <h1 className="header-title">{APP_NAME}</h1>
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