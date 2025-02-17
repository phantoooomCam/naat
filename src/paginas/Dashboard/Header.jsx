import { useState, useEffect, useRef } from "react";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre || "Usuario";
  const apellido = usuario?.apellidoPaterno || "Apellido";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Generar avatar con las iniciales del usuario
  const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(iniciales)}&size=100&background=random`;

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="header">
      <div className="profile-container" ref={profileRef}>
        <button
          className="profile-btn"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <img src={avatarUrl} alt="Perfil" className="avatar" />
        </button>

        {isProfileOpen && (
          <div className="profile-card">
            <div className="user-info">
              <img src={avatarUrl} alt="Perfil" className="avatar-lg" />
              <h3>{nombre + " " + apellido}</h3>
              <p className="role">Administrador</p>
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
