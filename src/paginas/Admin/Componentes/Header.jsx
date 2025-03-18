import { useState, useEffect, useRef } from "react";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import "./Header.css";

const Header = () => {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre || "Usuario";
  const apellido = usuario?.apellidoPaterno || "Apellido";
  const idUsuario = usuario?.idUsuario || null;
  const niveles = {
    1: "Super Administrador",
    2: "Administrador Organizacion",
    3: "Jefe Area",
    4: "Jefe Departamento",
    5: "Analista",
  };

  // 🔹 Asegurar que nivel sea un número antes de buscar en el mapeo
  const nivel = Number(usuario?.nivel) || 0;
  const nivelNombre = niveles[nivel] || "Desconocido";

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 🔹 Estado para el sidebar
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Error: No hay token almacenado.");
        return;
      }

      const response = await fetch(
        "http://192.168.100.89:44444/api/usuarios/logout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.mensaje || "Error al cerrar sesión.");
      }

      // ✅ Eliminar el token y la información del usuario del almacenamiento local
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // ✅ Redirigir al usuario a la página de inicio de sesión
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // 🔹 Detectar si el sidebar está abierto o cerrado dinámicamente
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarOpen(!sidebar.classList.contains("closed"));
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside); // 🔹 Cierra en dispositivos táctiles
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside); // 🔹 Limpia el evento táctil
    };
  }, [isProfileOpen]);

  return (
    <header className={`header ${isSidebarOpen ? "" : "full-width"}`}>
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
              <p className="role">{nivelNombre}</p>
              <Link to="/administrarcuenta" className="link-contra">
                Administrar Cuenta
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
