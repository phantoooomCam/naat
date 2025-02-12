import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import NAAT_image from '../../assets/naat.jpg';
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const Home = () => {
  return (
    <div className="homealt-wrapper">
      <header className="homealt-header">
        <nav className="homealt-nav">
          <div className="nav-left">
            <div className="nav-logo">
              <Link to="/">
                <img src={NAAT_image} alt="Logo" />
              </Link>
            </div>
            <ul className="nav-links">
              <li><Link to="/" className="active">Inicio</Link></li>
              <li><Link to="/servicios">Servicios</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </div>
          <div className="nav-auth">
            <Link to="/login" className="auth-button">Registrarse</Link>
            <Link to="/signin" className="auth-button">Iniciar Sesión</Link>
          </div>
        </nav>
      </header>

      <main className="homealt-main">
        <div className="main-content">
          <div className="content-left">
            <h1>¡Tu seguridad importa!</h1>
            <div className="lottie-wrapper">
              <DotLottieReact
                src="https://lottie.host/c37c2d86-b787-4fb4-8c32-c68ce369cd71/FhkPOM1Yo6.lottie"
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          <div className="login-card">
            <h2>Ingresa a NA'AT</h2>
            <form className="login-form">
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Ingresa tu correo"
                  required
                />
              </div>
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>
              <button type="submit" className="submit-button">
                Iniciar Sesión
              </button>
              <div className="divider">
                <span>o</span>
              </div>
              <button type="button" className="google-button">
                <FaGoogle />
                <span>Iniciar Sesión con Google</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="homealt-footer">
        <div className="footer-links">
          <Link to="/politica-privacidad">Política de Privacidad</Link>
          <Link to="/terminos">Términos y Condiciones</Link>
          <Link to="/contacto">Contacto</Link>
        </div>
        <p className="p-home"> 2025 NA'AT. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Home;
