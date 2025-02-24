import { useState, useEffect, useRef } from "react";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre || "Usuario";
  const apellido = usuario?.apellidoPaterno || "Apellido";
  const idUsuario = usuario?.idUsuario || null;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
  
      if (!token) {
        console.error("Error: No hay token almacenado.");
        return;
      }
  
      const response = await fetch("http://localhost:5096/api/usuarios/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.mensaje || "Error al cerrar sesión.");
      }
  
      // ✅ Eliminar el token y la información del usuario del almacenamiento local
      localStorage.removeItem("token");
      localStorage.removeItem("user");
  
      // ✅ Redirigir al usuario a la página de inicio de sesión
      navigate("/signin");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
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
          <img
            src={`https://ui-avatars.com/api/?name=${nombre}+${apellido}&size=100&background=random`}
            alt="Perfil"
            className="avatar"
          />
        </button>

        {isProfileOpen && (
          <div className="profile-card">
            <div className="user-info">
              <img
                src={`https://ui-avatars.com/api/?name=${nombre}+${apellido}&size=100&background=random`}
                alt="Perfil"
                className="avatar-lg"
              />
              <h3>
                {nombre} {apellido}
              </h3>
              <p className="role">Administrador</p>
              <Link to="/forgotpasswd" className="link-contra">
                Cambiar Contraseña
              </Link>
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
