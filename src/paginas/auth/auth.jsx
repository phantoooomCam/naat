import React, { useState } from "react";
import "./auth.css";
import { FaUser, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";
import { FaGoogle, FaFacebookF, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Link } from "react-router-dom";
import NAAT from '../../assets/completo_blanco.png';

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <body className="auth-body">  
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
            <button type="submit" className="auth-btn">REGISTRARSE</button>
          </form>
        </div>

        {/* Formulario de Login */}
        <div className="auth-form-box auth-form-box-register">
          <form>
            <h1>Inicio de Sesión</h1>
            <div className="auth-input-box">
              <FaEnvelope className="auth-input-icon" />
              <input type="email" placeholder="tucorreo@ejemplo.com" required />
            </div>
            <div className="auth-input-box">
              <FaLock className="auth-input-icon" />
              <input type="password" placeholder="Password" required />
            </div>
            <div className="auth-forgot-link">
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>
            <button type="submit" className="auth-btn">INICIAR SESIÓN</button>
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
    </body>
  );
}