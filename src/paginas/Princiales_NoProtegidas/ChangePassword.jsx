import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Change.css"; // Cambio del nombre del archivo CSS

const PasswordChange = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Recuperar el objeto del usuario desde el localStorage
  const usuario = JSON.parse(localStorage.getItem("user"));
  const userId = usuario ? usuario.id : null; // Suponiendo que el ID del usuario está en 'id'

  const token = localStorage.getItem("token"); // El token almacenado en localStorage
  const navigate = useNavigate();

  // Observador para el sidebar
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"));
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true });
    return () => observer.disconnect();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  const notificarCambioPassword = async (userId, setError, setSuccess) => {
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch(
        "http://192.168.100.89:44444/api/usuarios/change-password/{id}", // o el endpoint que tú necesites
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ idUsuario: userId }),
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        setError(result.mensaje || "Error al notificar el cambio de contraseña.");
        return false;
      }
  
      setSuccess(true);
      return true;
    } catch (err) {
      setError("Error de red al notificar el cambio.");
      return false;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setError("No se ha detectado un ID de sesión válido.");
      return;
    }

    // Crear el objeto JSON con las claves exactas que espera el backend
    const passwordData = {
      oldPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    };

    try {
      // Enviar los datos al backend
      const response = await fetch(
        `http://192.168.100.89:44444/api/usuarios/change-password/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(passwordData),
        }
      );

      // Verificar que la respuesta del servidor sea exitosa
      if (!response.ok) {
        throw new Error("Error en la solicitud");
      }

      // Ahora parseamos la respuesta como JSON en lugar de texto
      const responseData = await response.json();

      // Verificamos el mensaje en el objeto JSON de respuesta
      if (responseData.mensaje === "Contraseña actualizada exitosamente.") {
        setSuccess(true);
        setError(""); // Limpiar cualquier mensaje de error previo

        // Esperar 1 segundo antes de redirigir al Sign-In
        setTimeout(() => {
          handleLogout();
          navigate("/");
        }, 1000);
      } else {
        setError("Error al cambiar la contraseña.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      setError("Error al cambiar la contraseña.");
    }
  };

  return (
    <div className={`password-container ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="password-content">
        <div className="password-header">
          <h2>Cambiar Contraseña</h2>
          <p className="password-subtitle">Actualiza tu contraseña para mantener tu cuenta segura</p>
        </div>
        
        {(error || success) && (
          <div className={`status-message ${error ? 'error' : 'success'}`}>
            {error || "¡Contraseña cambiada exitosamente!"}
          </div>
        )}
        
        <div className="password-card">
          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Contraseña Actual</label>
              <div className="password-input-group">
                <input
                  type={showPasswords.currentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility("currentPassword")}
                  aria-label={showPasswords.currentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPasswords.currentPassword ? (
                    <Eye className="icon" />
                  ) : (
                    <EyeOff className="icon" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña</label>
              <div className="password-input-group">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Ingresa tu nueva contraseña"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  aria-label={showPasswords.newPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPasswords.newPassword ? (
                    <Eye className="icon" />
                  ) : (
                    <EyeOff className="icon" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-save-password">
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChange;