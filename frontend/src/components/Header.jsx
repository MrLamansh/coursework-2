import { useAuth } from "../context/AuthContext";

function Header() {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-user-info">
        <p className="header-subtitle">
          Пользователь: {user?.username || "—"}
        </p>
      </div>
    </header>
  );
}

export default Header;