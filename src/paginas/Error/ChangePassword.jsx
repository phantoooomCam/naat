import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import SHA512 from "crypto-js/sha512";
import { useNavigate } from "react-router-dom";
import "./Change.css";

// Función para generar el hash SHA-512
const generateSHA512 = (text) => {
  return SHA512(text).toString().toUpperCase();
};

const PasswordChange = () => {
  const [formData, setFormData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
  });
  const token = localStorage.getItem("token");

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Usar navigate para redirigir
  const navigate = useNavigate();

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.username ||
      !formData.currentPassword ||
      !formData.newPassword
    ) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    // Convertir las contraseñas a SHA-512
    const hashedData = {
      Usuario: formData.username,
      ClaveAnterior: generateSHA512(formData.currentPassword),
      NuevaClave: generateSHA512(formData.newPassword),
    };

    // Enviar los datos al backend
    fetch("http://192.168.100.89:44444/api/Administracion/ModificarClave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(hashedData),
    })
      .then((response) => response.json())
      .then((data) => {
        // Si la respuesta es "ok", consideramos que la contraseña se cambió correctamente
        if (data.mensaje === "ok") {
          setSuccess(true);
          setError("");

          // Esperar 3 segundos antes de redirigir
          setTimeout(() => {
            navigate("/signin");
          }, 3000); // 3000 ms = 3 segundos
        } else {
          setError("Error al cambiar la contraseña");
        }
      })
      .catch((error) => {
        setError("Hubo un error al cambiar la contraseña");
        console.error("Error:", error);
      });
  };

  return (
    <div className="container-change">
      <div className="form-wrapper-change">
        <h2 className="h2-change">Cambiar Contraseña</h2>

        <form onSubmit={handleSubmit} className="password-form-change">
          <div className="input-group-change">
            <input
              className="input-change"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Usuario"
            />
          </div>

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
