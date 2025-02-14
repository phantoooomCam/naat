import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import "./HomeAlt.css";
import NAAT_image from "../../assets/naat.png";

const HomeAlt = () => {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      const response = await fetch("http://192.168.100.89:44444/api/Autenticacion/Autenticar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario,
          clave
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} - ${data.mensaje || "Sin mensaje"}`);
      }
  
      console.log("Respuesta del servidor:", data); // Verifica qué devuelve en consola
  
      if (data.mensaje === "ok" && data.response?.token) {
        // Guardar tanto el token como el objeto usuario en localStorage
        localStorage.setItem("token", data.response.token);
        localStorage.setItem("user", JSON.stringify(data.response.usuario)); // Guarda el usuario
        navigate("/dashboard");
      } else {
        throw new Error(data.mensaje || "Error en el inicio de sesión");
      }
    } catch (error) {
      console.error("Error en la autenticación:", error);
      setError(error.message || "Hubo un problema con la conexión al servidor");
    }
  };
  
  

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
              <li><Link to="/">Inicio</Link></li>
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
            <div className="lottie-container">
              <DotLottieReact
                src="https://lottie.host/a7b8cab8-0142-4aeb-9051-0c6c3f46f348/0GXQygoQWS.lottie"
                loop
                autoplay
                style={{ width: "650px", height: "650px" }}
              />
            </div>
          </div>
          <div className="login-card-wrapper">
            <div className="login-card">
              <h2>Ingresa a NA'AT</h2>
              {error && <p className="error-message">{error}</p>}
              <form className="login-form" onSubmit={handleLogin}>
                <div className="input-group">
                  <FaEnvelope className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="Ingresa tu usuario" 
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input 
                    type="password" 
                    placeholder="Ingresa tu contraseña" 
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="submit-button">
                  Iniciar Sesión
                </button>
                <div className="divider"><span>O</span></div>
                <button type="button" className="google-button">
                  <FcGoogle /> Iniciar Sesión con Google
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="homealt-footer">
        <div className="footer-links">
          <Link to="/politica-privacidad">Política de Privacidad</Link>
          <Link to="/terminos">Términos y Condiciones</Link>
          <Link to="/contacto">Contacto</Link>
        </div>
        <p className="p-home">2025 NA'AT. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default HomeAlt;
