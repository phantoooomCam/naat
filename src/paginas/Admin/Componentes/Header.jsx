import { useState, useEffect, useRef } from "react";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre || "Usuario";
  const apellido = usuario?.apellidoPaterno || "Apellido";
  const idUsuario = usuario?.idUsuario || null;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Función para registrar el cierre de sesión en el backend
  const registrarCierreSesion = async () => {
    if (!idUsuario) {
      console.error("Error: idUsuario es null, no se puede cerrar sesión.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Error: No hay token almacenado.");
      return;
    }

    try {
      console.log("Enviando petición para cerrar sesión...");
      const response = await fetch(
        "http://192.168.100.89:44444/api/Autenticacion/Salir",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ usuario: usuario.nombreUsuario }), // Verificar si este valor es correcto
        }
      );

      const data = await response.json();
      console.log("Respuesta de la API:", data);

      if (!response.ok) {
        throw new Error(data.mensaje || "Error al registrar cierre de sesión");
      }
    } catch (error) {
      console.error("Error al registrar cierre de sesión:", error);
    }
  };

  const handleLogout = async () => {
    await registrarCierreSesion(); // Registrar el cierre de sesión en la base de datos

    console.log("Eliminando datos de sesión del localStorage...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    console.log("Redirigiendo a /signin");
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
          <img src={`https://ui-avatars.com/api/?name=${nombre}+${apellido}&size=100&background=random`} alt="Perfil" className="avatar" />
        </button>

        {isProfileOpen && (
          <div className="profile-card">
            <div className="user-info">
              <img src={`https://ui-avatars.com/api/?name=${nombre}+${apellido}&size=100&background=random`} alt="Perfil" className="avatar-lg" />
              <h3>{nombre} {apellido}</h3>
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
