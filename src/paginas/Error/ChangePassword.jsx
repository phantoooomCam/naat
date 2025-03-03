import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Change.css";

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

  // Recuperar el objeto del usuario desde el localStorage
  const usuario = JSON.parse(localStorage.getItem("user"));
  const userId = usuario ? usuario.id : null; // Suponiendo que el ID del usuario está en 'id'

  const token = localStorage.getItem("token"); // El token almacenado en localStorage
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Error: No hay token almacenado.");
        return;
      }

      const response = await fetch(
        "https://naatintelligence.com:44445/api/usuarios/logout",
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
      navigate("/signin");
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

    console.log(passwordData);

    try {
      // Enviar los datos al backend
      const response = await fetch(
        `https://naatintelligence.com:44445/api/usuarios/change-password/${userId}`,
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
      if (responseData.mensaje === "Contraseña actualizada correctamente.") {
        setSuccess(true);
        setError(""); // Limpiar cualquier mensaje de error previo

        // Esperar 1 segundo antes de redirigir al Sign-In
        setTimeout(() => {
          handleLogout();
          navigate("/signin");
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
    <div className="container-change">
      <div className="form-wrapper-change">
        <h2 className="h2-change">Cambiar Contraseña</h2>

        <form onSubmit={handleSubmit} className="password-form-change">
          <div className="input-group-change">
            <input
              className="input-change"
              type={showPasswords.currentPassword ? "text" : "password"}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Contraseña actual"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("currentPassword")}
              className="toggle-password"
            >
              {showPasswords.currentPassword ? (
                <Eye className="w-5 h-5 text-black" />
              ) : (
                <EyeOff className="w-5 h-5 text-black" />
              )}
            </button>
          </div>

          <div className="input-group-change">
            <input
              className="input-change"
              type={showPasswords.newPassword ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Nueva contraseña"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("newPassword")}
              className="toggle-password"
            >
              {showPasswords.newPassword ? (
                <Eye className="w-5 h-5 text-black" />
              ) : (
                <EyeOff className="w-5 h-5 text-black" />
              )}
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          {success && (
            <p className="success">¡Contraseña cambiada exitosamente!</p>
          )}

          <button type="submit" className="submit-button-change">
            Cambiar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;
