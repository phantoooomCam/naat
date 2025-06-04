import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./login-signin.css";
import { FaLock } from "react-icons/fa";
import { Link } from "react-router-dom";
import NAAT from "../../assets/completo_blanco.png";
import NAAT2 from "../../assets/naat.png";
import fetchWithAuth from "../../utils/fetchWithAuth";


export default function ResetPassword() {
  const [isRegister, setIsRegister] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(window.location.search).get("token");

  const cambioForzado = location.state?.cambioForzado;
  const idUsuario = location.state?.idUsuario;

  useEffect(() => {
    document.body.classList.add("auth-body");

    if (!cambioForzado && token) {
      document.cookie = `jwt_token=${token}; path=/; SameSite=Lax`;
    }

    return () => {
      document.body.classList.remove("auth-body");
    };
  }, [token, cambioForzado]);

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

    try {
      let response;

      if (cambioForzado && idUsuario) {
        response = await fetchWithAuth("/api/usuarios/cambiar-contrasena-forzada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idUsuario,
            nuevaContrasena: password,
          }),
        });
      } else {
        if (!token) {
          setError("Token no encontrado. Solicita un nuevo enlace de recuperación.");
          return;
        }

        response = await fetchWithAuth("/api/usuarios/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        
          body: JSON.stringify({ newPassword: password }),
        });
      }

      const data = await response.json();

      if (response.ok) {
        setMensaje("Tu contraseña ha sido actualizada exitosamente.");

        document.cookie = "jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(data.mensaje || "Hubo un problema al cambiar la contraseña.");
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="auth-container-wrapper">
      <div className={`auth-container ${isRegister ? "auth-active" : ""}`}>
        <div className="auth-form-box auth-form-box-register">
          <form onSubmit={handleSubmit}>
            <Link to="/">
              <img src={NAAT2} alt="NAAT Logo" className="auth-signin-logo" />
            </Link>
            <h1>{cambioForzado ? "Cambia tu contraseña" : "Restablece tu contraseña"}</h1>
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
              {cambioForzado ? "ACTUALIZAR CONTRASEÑA" : "CAMBIAR CONTRASEÑA"}
            </button>
          </form>
        </div>

        <div className="auth-toggle-box">
          <div className="auth-toggle-panel auth-toggle-right">
            <Link to="/">
              <img src={NAAT} alt="NAAT Logo" className="auth-registro-logo" />
            </Link>
            <h1>{cambioForzado ? "Cambio obligatorio" : "Restablecimiento de contraseña"}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
