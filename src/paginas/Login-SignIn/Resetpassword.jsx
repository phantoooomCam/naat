import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  // ✅ Importa useNavigate
import "./login-signin.css";
import { FaLock } from "react-icons/fa";
import { Link } from "react-router-dom";
import NAAT from "../../assets/completo_blanco.png";
import NAAT2 from "../../assets/naat.png";

export default function ResetPassword({ token: propToken }) {
  const [isRegister, setIsRegister] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate(); // ✅ Hook para redirección

  // Obtener el token desde la prop o desde localStorage
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    document.body.classList.add("auth-body");
    return () => {
      document.body.classList.remove("auth-body");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!token) {
      setError("Token no encontrado. Solicita un nuevo enlace de recuperación.");
      return;
    }

    try {
      const response = await fetch("http://192.168.100.89:44444/api/usuarios/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("Tu contraseña ha sido actualizada exitosamente.");

        // ✅ Redirigir después de 2 segundos para mostrar el mensaje
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(data.error || "Hubo un problema al cambiar la contraseña.");
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="auth-container-wrapper">
      <div className={`auth-container ${isRegister ? "auth-active" : ""}`}>
        {/* Formulario de restablecimiento */}
        <div className="auth-form-box auth-form-box-register">
          <form onSubmit={handleSubmit}>
            <Link to="/">
              <img src={NAAT2} alt="NAAT Logo" className="auth-signin-logo" />
            </Link>
            <h1>Restablece tu contraseña</h1>
            {error && <p className="error-message">{error}</p>}
            {mensaje && <p className="success-message">{mensaje}</p>}

            <div className="auth-input-box">
              <FaLock className="auth-input-icon" />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-input-box">
              <FaLock className="auth-input-icon" />
              <input
                type="password"
                placeholder="Confirma tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-btn">
              CAMBIAR CONTRASEÑA
            </button>
          </form>
        </div>

        {/* Panel de información */}
        <div className="auth-toggle-box">
          <div className="auth-toggle-panel auth-toggle-right">
            <Link to="/">
              <img src={NAAT} alt="NAAT Logo" className="auth-registro-logo" />
            </Link>
            <h1>Restablecimiento de contraseña</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
