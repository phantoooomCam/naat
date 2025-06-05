"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiLogOut, FiSettings, FiUser, FiChevronDown } from "react-icons/fi";
import "./Header.css";
import fetchWithAuth from "../utils/fetchWithAuth";

const Header = () => {
  const [usuario, setUsuario] = useState(null);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchWithAuth("/api/me");

        if (!response || !response.ok) {
          throw new Error("Error al obtener usuario");
        }

        const data = await response.json();

        setUsuario({
          idUsuario: parseInt(data.idUsuario, 10),
          nivel: parseInt(data.nivel, 10),
          idOrganizacion: parseInt(data.idOrganizacion, 10),
          idArea: parseInt(data.idArea, 10),
          idDepartamento: parseInt(data.idDepartamento, 10),
          nombre: data.nombre,
          apellidoPaterno: data.apellidoPaterno,
          apellidoMaterno: data.apellidoMaterno,
        });
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        setUsuario(null);
      }
    };

    fetchUser();
  }, []);

  const nivel = usuario?.nivel || 5;
  const niveles = {
    1: "Super Administrador",
    2: "Administrador Organizacion",
    3: "Jefe Area",
    4: "Jefe Departamento",
    5: "Analista",
  };
  const nivelNombre = niveles[nivel] || "Desconocido";
  const nombre = usuario?.nombre || "Usuario";
  const apellido = `${usuario?.apellidoPaterno || ""} `;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    try {
      const response = await fetchWithAuth("/api/usuarios/logout", {
        method: "POST",
        credentials: "include",
      });

      window.location.href = "/";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Error al cerrar sesión. Intenta de nuevo.");
    }
  };

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
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cerrar el menú de perfil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className={`header ${isSidebarOpen ? "" : "full-width"}`}>
      <div className="header-content">
        {windowWidth > 768 && (
          <div className="header-title">
            <h1>Dashboard</h1>
            <p className="header-subtitle">Bienvenido, {nombre}</p>
          </div>
        )}

        <div className="profile-container" ref={profileRef}>
          <button
            className="profile-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label="Perfil de usuario"
          >
            {windowWidth > 768 && (
              <div className="profile-info">
                <span className="profile-name">{nombre}</span>
                <FiChevronDown
                  style={{
                    transform: isProfileOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>
            )}
            <img
              src={`https://ui-avatars.com/api/?name=${nombre}+${apellido}&size=100&background=random`}
              alt="Perfil"
              className="avatar"
            />
          </button>

          {isProfileOpen && (
            <div
              className="profile-card"
              style={{ animation: "slideIn 0.3s ease" }}
            >
              <div className="user-info">
                <img
                  src={`https://ui-avatars.com/api/?name=${nombre}+${apellido}&size=100&background=random`}
                  alt="Perfil"
                  className="avatar-lg"
                />
                <h3>
                  {nombre} {apellido}
                </h3>
                <span className="role">{nivelNombre}</span>
                <span className="email">{usuario?.correo}</span>
              </div>

              <div className="profile-actions">
                <Link
                  to="/administrarcuenta"
                  className="profile-action-btn"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <FiUser className="icon" />
                  <span>Perfil</span>
                </Link>
                <Link
                  to="/cambiarcontra"
                  className="profile-action-btn"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <FiSettings className="icon" />
                  <span>Cambiar contraseña</span>
                </Link>
              </div>

              <button className="logout-btn" onClick={handleLogout}>
                <FiLogOut className="icon" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
