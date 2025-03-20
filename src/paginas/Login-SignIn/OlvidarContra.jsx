import React, { useState, useEffect } from "react";
import "./login-signin.css";
import { FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";
import NAAT from "../../assets/completo_blanco.png";
import NAAT2 from "../../assets/naat.png";
import { body } from "framer-motion/client";

export default function ForgotPassword() {
  const [isRegister, setIsRegister] = useState(true);
  const [usuario, setUsuario] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Validar formato de correo
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

    if (!validateEmail(usuario)) {
      setError("Por favor, introduce un correo válido.");
      return;
    }

    try {
      const response = await fetch("http://192.168.100.89:44444/api/usuarios/olvidepassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo: usuario }),
      });


      const data = await response.json();
      

      if (response.ok) {
        setMensaje("Correo enviado con éxito. Revisa tu bandeja de entrada.");
        localStorage.setItem("resetToken", data.token); // Guarda el token
      } else {
        setError(data.error || "Hubo un problema al enviar el correo.");
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="auth-container-wrapper">
      <div className={`auth-container ${isRegister ? "auth-active" : ""}`}>
        {/* Formulario de recuperación */}
        <div className="auth-form-box auth-form-box-register">
          <form onSubmit={handleSubmit}>
            <Link to="/">
              <img src={NAAT2} alt="NAAT Logo" className="auth-signin-logo" />
            </Link>
            <h1>Recupera tu cuenta</h1>
            {error && <p className="error-message">{error}</p>}
            {mensaje && <p className="success-message">{mensaje}</p>}
            <div className="auth-input-box">
              <FaEnvelope className="auth-input-icon" />
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-btn">
              RECUPERAR
            </button>
          </form>
        </div>

        {/* Panel de cambio */}
        <div className="auth-toggle-box">
          <div className="auth-toggle-panel auth-toggle-right">
            <Link to="/">
              <img src={NAAT} alt="NAAT Logo" className="auth-registro-logo" />
            </Link>
            <h1>¿Olvidaste tu contraseña?</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
