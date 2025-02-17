import { useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Obtener el usuario desde localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin"); // Redirige a la página de inicio de sesión
  };

  return (
    <header className="header">
      <div className="profile-container">
        <button
          className="profile-btn"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <img
            src={user?.avatar || "https://i.pravatar.cc/100"}
            alt="Perfil"
            className="avatar"
          />
        </button>

        {isProfileOpen && (
          <div className="profile-card">
            <div className="user-info">
              <img
                src={user?.avatar || "https://i.pravatar.cc/100"}
                alt="Perfil"
                className="avatar-lg"
              />
              <h3>{user?.name || "Usuario"}</h3>
              <p className="email">{user?.email || "Sin correo"}</p>
              <p className="role">{user?.role || "Sin rol"}</p>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              <FiLogOut className="icon" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
