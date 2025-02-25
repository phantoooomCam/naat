import React, { useState, useEffect } from "react";
import "./login-signin.css";
import { FaUser, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";
import { FaGoogle, FaFacebookF, FaGithub, FaLinkedinIn } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import NAAT from "../../assets/completo_blanco.png";
import SHA512 from "crypto-js/sha512";

export default function SignIn() {
  const [isRegister, setIsRegister] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  // Use states del registro
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correoRegistro, setCorreoRegistro] = useState("");
  const [claveRegistro, setClaveRegistro] = useState("");

  // Funcion para el registro
  const handleRegister = async (e) => {
    e.preventDefault();
  
    const userData = {
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      correo: correoRegistro,
      telefono,
      contraseña: claveRegistro,
    };
  
    try {
      const response = await fetch(
        "http://192.168.100.89:5096/api/usuarios/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.mensaje || "Error en el registro");
      }
  
      // Cambiar el estado antes de redirigir
      setIsRegister(false);
  
      // Redirigir después de 2 segundos
      navigate("/mensaje");
    } catch (error) {
      console.error(error);
      setError(error.message || "Hubo un problema con el registro");
    }
  };
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const requestBody = {
      correo: usuario,
      contraseña: clave,
    };

    try {
      const response = await fetch(
        "http://192.168.100.89:5096/api/usuarios/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      if (data.token) {
        // Almacenar el token y la información del usuario en el localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.usuario));

        // Redirigir al dashboard si todo está bien
        navigate("/dashboard");
      } else {
        throw new Error("Error en el inicio de sesión");
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
          <form onSubmit={handleRegister}>
            <h1>Registro</h1>
            <div className="auth-input-box">
              <FaUser className="auth-input-icon" />
              <input
                type="text"
                placeholder="Tu Nombre"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="auth-input-box">
              <FaUser className="auth-input-icon" />
              <input
                type="text"
                placeholder="Apellido Paterno"
                required
                value={apellidoPaterno}
                onChange={(e) => setApellidoPaterno(e.target.value)}
              />
            </div>
            <div className="auth-input-box">
              <FaUser className="auth-input-icon" />
              <input
                type="text"
                placeholder="Apellido materno"
                required
                value={apellidoMaterno}
                onChange={(e) => setApellidoMaterno(e.target.value)}
              />
            </div>
            <div className="auth-input-box">
              <FaPhone className="auth-input-icon" />
              <input
                type="tel"
                placeholder="Tu teléfono"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div className="auth-input-box">
              <FaEnvelope className="auth-input-icon" />
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                required
                value={correoRegistro}
                onChange={(e) => setCorreoRegistro(e.target.value)}
              />
            </div>
            <div className="auth-input-box">
              <FaLock className="auth-input-icon" />
              <input
                type="password"
                placeholder="Password"
                required
                value={claveRegistro}
                onChange={(e) => setClaveRegistro(e.target.value)}
              />
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
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
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
              <Link to="/forgotpasswd">¿Olvidaste tu contraseña?</Link>
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
