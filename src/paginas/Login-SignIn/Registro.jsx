import React, { useState, useEffect } from "react";
import "./login-signin.css";
import { FaUser, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";
import { FaGoogle, FaFacebookF, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Link } from "react-router-dom";
import NAAT from "../../assets/completo_blanco.png";

// Función para convertir array de bytes a string hexadecimal
const byteArrayToHexString = (byteArray) => {
  return Array.from(byteArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
};

// Función para generar el hash SHA-512
const generateSHA512 = async (text) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return byteArrayToHexString(hashArray);
};

export default function SignIn() {
  const [isRegister, setIsRegister] = useState(false);
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Generar el hash SHA-512 de la contraseña
      const hashedPassword = await generateSHA512(clave);

      const response = await fetch(
        "http://192.168.100.89:44444/api/Autenticacion/Autenticar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuario: correo,
            clave: hashedPassword, // Enviamos el hash en lugar de la contraseña original
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Error del servidor: ${response.status} - ${
            data.mensaje || "Sin mensaje"
          }`
        );
      }

      console.log("Respuesta del servidor:", data);

      if (data.mensaje === "ok" && data.response?.token) {
        localStorage.setItem("token", data.response.token);
        localStorage.setItem("user", JSON.stringify(data.response.usuario));
        window.location.href = "/dashboard";
      } else {
        throw new Error(data.mensaje || "Error en el inicio de sesión");
      }
    } catch (error) {
      console.error("Error en la autenticación:", error);
      setError(error.message || "Hubo un problema con la conexión al servidor");
    }
  };

  useEffect(() => {
    document.body.classList.add("auth-body");
    return () => {
      document.body.classList.remove("auth-body");
    };
  }, []);

  return (
    <div className="auth-container-wrapper">
      <div className={`auth-container ${isRegister ? "auth-active" : ""}`}>
        {/* Formulario de Registro */}
        <div className="auth-form-box auth-form-box-login">
          <form>
            <h1>Registro</h1>
            <div className="auth-input-box">
              <FaUser className="auth-input-icon" />
              <input type="text" placeholder="Tu Nombre" required />
            </div>
            <div className="auth-input-box">
              <FaUser className="auth-input-icon" />
              <input type="text" placeholder="Tus Apellidos" required />
            </div>
            <div className="auth-input-box">
              <FaPhone className="auth-input-icon" />
              <input type="tel" placeholder="Tu teléfono" required />
            </div>
            <div className="auth-input-box">
              <FaEnvelope className="auth-input-icon" />
              <input type="email" placeholder="tucorreo@ejemplo.com" required />
            </div>
            <div className="auth-input-box">
              <FaLock className="auth-input-icon" />
              <input type="password" placeholder="Password" required />
            </div>
            <button type="submit" className="auth-btn">
              REGISTRARSE
            </button>
          </form>
        </div>

        {/* Formulario de Login */}
        <div className="auth-form-box auth-form-box-register">
          <form onSubmit={handleLogin}>
            <h1>Inicio de Sesión</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="auth-input-box">
              <FaEnvelope className="auth-input-icon" />
              <input
                type="text"
                placeholder="tucorreo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
            <div className="auth-input-box">
              <FaLock className="auth-input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />
            </div>
            <div className="auth-forgot-link">
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>
            <button type="submit" className="auth-btn">
              INICIAR SESIÓN
            </button>
          </form>
        </div>

        {/* Panel de cambio */}
        <div className="auth-toggle-box">
          <div className="auth-toggle-panel auth-toggle-left">
            <Link to="/">
              <img src={NAAT} alt="NAAT Logo" className="auth-registro-logo" />
            </Link>
            <h1>Crea tu cuenta</h1>
            <p>Únete a nuestra comunidad tecnológica.</p>
            <button className="auth-btn" onClick={() => setIsRegister(true)}>
              Iniciar Sesión
            </button>
          </div>

          <div className="auth-toggle-panel auth-toggle-right">
            <Link to="/">
              <img src={NAAT} alt="NAAT Logo" className="auth-registro-logo" />
            </Link>
            <h1>Bienvenido de nuevo</h1>
            <p>Inicia sesión para continuar.</p>
            <button className="auth-btn" onClick={() => setIsRegister(false)}>
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}