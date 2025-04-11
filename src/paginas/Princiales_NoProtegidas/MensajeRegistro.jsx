import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import NAAT from "../../assets/completo_blanco.png";
import "./mensaje.css";
import fetchWithAuth from "../../utils/fetchWithAuth";


export default function MensajeRegistro() {
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
        <div className="auth-form-box auth-form-box-mensaje">
          <form>
            <h1>Registro exitoso!</h1>
            <p>Un administrador autorizara tu ingreso</p>
            <p>Te notificaremos via correo electronico</p>
            <div className="lottie-check" onClick={() => navigate("/")}>
              <DotLottieReact
                src="https://lottie.host/622fd858-6cc0-4fd2-bae2-27770717cb0c/LDKDhEs0dE.lottie"
                autoplay
                speed={0.5}
                style={{ width: "100%", height: "100%", cursor: "pointer" }} // <-- Aquí lo adaptas
              />
            </div>
          </form>
        </div>

        {/* Formulario de Login */}
        <div className="auth-form-box auth-form-box-register"></div>

        {/* Panel de cambio */}
        <div className="auth-toggle-box">
          <div className="auth-toggle-panel auth-toggle-left">
            <Link to="/">
              <img src={NAAT} alt="NAAT Logo" className="auth-registro-logo" />
            </Link>
            <h1>Regresa al Inicio</h1>
            <p>Pulsa el logo de NAAT</p>
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
