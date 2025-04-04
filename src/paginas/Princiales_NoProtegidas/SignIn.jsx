import React, { useState, useEffect } from "react";
import "./login-signin.css";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import NAAT from "../../assets/completo_blanco.png";
import NAAT2 from "../../assets/naat.png";

export default function SignIn() {
  const [isRegister, setIsRegister] = useState(true);
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

  // States de la contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Validations
  const [validations, setValidations] = useState({
    telefono: true,
    correo: true,
    clave: true,
  });

  // Validate Phone Number (10 digits)
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  // Validate Email Format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate Password Strength
  const validatePassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // Funcion para el registro
  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const phoneValid = validatePhoneNumber(telefono);
    const emailValid = validateEmail(correoRegistro);
    const passwordValid = validatePassword(claveRegistro);

    // Update validations state
    setValidations({
      telefono: phoneValid,
      correo: emailValid,
      clave: passwordValid,
    });

    // Check if all validations pass
    if (!phoneValid || !emailValid || !passwordValid) {
      setError("Por favor, verifica los campos de registro.");
      return;
    }

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
        "http://localhost:44444/api/usuarios/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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
      const response = await fetch("http://localhost:44444/api/usuarios/login", { //https://naatintelligence.com:44445
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 👈 Esto es lo nuevo
        body: JSON.stringify(requestBody),
      });
      

      const data = await response.json();

      if (data.usuario) {
        localStorage.setItem("user", JSON.stringify(data.usuario));
      
        if (data.usuario.nivel === 1) {
          navigate("/dashboard");
        } else if (data.usuario.nivel === 2) {
          navigate("/home_org");
        } else if (data.usuario.nivel === 3) {
          navigate("/home_area");
        } else if (data.usuario.nivel === 4) {
          navigate("/home_depto");
        } else if (data.usuario.nivel === 5) {
          navigate("/home_analista");
        } else {
          navigate("/");
        }
      }
       else {
        // Manejo de errores
        setError("Credenciales inválidas");
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      setError("Error al intentar iniciar sesión");
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
                placeholder="Tu teléfono (10 dígitos)"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={
                  !validations.telefono && telefono ? "input-error" : ""
                }
              />
              {!validations.telefono && telefono && (
                <span className="error-text">
                  Debe ser un número de 10 dígitos
                </span>
              )}
            </div>
            <div className="auth-input-box">
              <FaEnvelope className="auth-input-icon" />
              <input
                type="email"
                placeholder="tucorreo@ejemplo.com"
                required
                value={correoRegistro}
                onChange={(e) => setCorreoRegistro(e.target.value)}
                className={
                  !validations.correo && correoRegistro ? "input-error" : ""
                }
              />
              {!validations.correo && correoRegistro && (
                <span className="error-text">Introduce un correo válido</span>
              )}
            </div>
            <div className="auth-input-box">
              <input
                type={showRegisterPassword ? "text" : "password"}
                placeholder="Password (8+ caracteres, mayúscula, minúscula, signo)"
                required
                value={claveRegistro}
                onChange={(e) => setClaveRegistro(e.target.value)}
                className={
                  !validations.clave && claveRegistro ? "input-error" : ""
                }
              />
              <span
                className="auth-password-toggle"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
              >
                <FontAwesomeIcon
                  icon={showRegisterPassword ? faEyeSlash : faEye}
                />
              </span>
              {!validations.clave && claveRegistro && (
                <span className="error-text">
                  La contraseña debe tener al menos 8 caracteres, una mayúscula,
                  una minúscula, un número y un signo
                </span>
              )}
            </div>
            <button type="submit" className="auth-btn">
              REGISTRARSE
            </button>
          </form>
        </div>

        {/* Formulario de Login */}
        <div className="auth-form-box auth-form-box-register">
          <form onSubmit={handleLogin}>
            <Link to="/">
              <img src={NAAT2} alt="NAAT Logo" className="auth-signin-logo" />
            </Link>
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
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
              />
              <span
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
            </div>
            <div className="auth-forgot-link">
              <Link to="/forgot_password">¿Olvidaste tu contraseña?</Link>
            </div>

            <button type="submit" className="auth-btn">
              INICIAR SESIÓN
            </button>
            <div className="btn-responsive">
              <Link to="/registro">
                <button type="button" className="auth-btn">
                  REGISTRARSE
                </button>
              </Link>
            </div>
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
