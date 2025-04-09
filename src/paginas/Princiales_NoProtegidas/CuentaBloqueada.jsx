"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import NAAT_image from "../../assets/naat.png"
import { FiAlertTriangle, FiMail, FiLock } from "react-icons/fi"
import "./CuentaBloqueada.css"

export default function CuentaBloqueada() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isLoaded, setIsLoaded] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [showVerificationForm, setShowVerificationForm] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        code: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [codeSent, setCodeSent] = useState(false)
    const cardRef = useRef(null)
    
    // Estados del segundo componente
    const [mensaje, setMensaje] = useState("Procesando solicitud...")
    const [bloqueado, setBloqueado] = useState(false)

    // Handle mouse movement for parallax effect - reduced sensitivity
    const handleMouseMove = (e) => {
        const { clientX, clientY } = e
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight

        // Calculate mouse position as percentage of window - reduced sensitivity
        const x = (clientX / windowWidth - 0.5) / 3
        const y = (clientY / windowHeight - 0.5) / 3

        setMousePosition({ x, y })
    }

    // Animation sequence on load
    useEffect(() => {
        setIsLoaded(true)
    }, [])

    // Verificación de token y reporte de cambio (del segundo componente)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
      
        if (!token) {
          setMensaje("Token no proporcionado.");
          return;
        }
      
        const getUserIdFromToken = (token) => {
          try {
            const payload = token.split(".")[1];
            const decoded = JSON.parse(atob(payload));
            return decoded.idUsuario;
          } catch (error) {
            console.error("❌ Token inválido:", error);
            return null;
          }
        };
      
        const usuarioId = getUserIdFromToken(token);
      
        if (!usuarioId) {
          setMensaje("No se pudo extraer el ID del token.");
          return;
        }
      
        fetch("http://localhost:44444/api/usuarios/reportar-cambio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idUsuario: usuarioId }),
        })
          .then((res) => res.json())
          .then((data) => {
            setBloqueado(true);
            setMensaje(data.mensaje || "Tu cuenta ha sido bloqueada por seguridad.");
          })
          .catch((err) => {
            console.error("❌ Error al reportar cambio sospechoso:", err);
            setMensaje("Hubo un error al procesar tu solicitud.");
          });
      }, []);      

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSendCode = (e) => {
        e.preventDefault()
        if (!formData.email) {
            setErrorMessage("Por favor, ingresa tu correo electrónico")
            return
        }

        setIsSubmitting(true)

        // Simulación de envío de código
        setTimeout(() => {
            setIsSubmitting(false)
            setCodeSent(true)
            setErrorMessage("")
        }, 1500)
    }

    const handleVerify = (e) => {
        e.preventDefault()
        if (!formData.code) {
            setErrorMessage("Por favor, ingresa el código de verificación")
            return
        }

        setIsSubmitting(true)

        // Simulación de verificación
        setTimeout(() => {
            setIsSubmitting(false)
            // Aquí podrías redirigir al usuario o mostrar un mensaje de éxito
            // Por ahora, solo mostramos un error de ejemplo
            setErrorMessage("El código ingresado no es válido. Por favor, intenta nuevamente.")
        }, 1500)
    }

    return (
        <div className="blocked-page-wrapper" onMouseMove={handleMouseMove}>
            <div className="blocked-nav">
                <Link to="/" className="blocked-logo">
                    <img src={NAAT_image || "/placeholder.svg"} alt="Logo" />
                </Link>
            </div>

            <div className={`blocked-content ${isLoaded ? "loaded" : ""}`}>
                <div
                    className="blocked-background"
                    style={{
                        transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)`,
                    }}
                >
                    <div className="bg-circle circle-1"></div>
                    <div className="bg-circle circle-2"></div>
                    <div className="bg-circle circle-3"></div>
                </div>

                <div
                    className={`blocked-card ${isHovering ? "hovering" : ""}`}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    ref={cardRef}
                >
                    <div className="blocked-icon-container">
                        <div className="blocked-icon-wrapper">
                            <FiAlertTriangle className="blocked-icon" />
                        </div>
                    </div>

                    <div className="blocked-message">
                        <h2>{bloqueado ? "Cuenta Bloqueada" : "Verificando cuenta..."}</h2>
                        <p>{mensaje}</p>

                        {bloqueado && !showVerificationForm ? (
                            <div className="blocked-actions">
                                <button className="verify-button" onClick={() => setShowVerificationForm(true)}>
                                    <span className="button-text">Verificar mi identidad</span>
                                </button>
                                <Link to="/contact" className="support-link">
                                    Contactar a soporte técnico
                                </Link>
                            </div>
                        ) : bloqueado && showVerificationForm ? (
                            <div className="verification-form">
                                {errorMessage && <div className="error-alert">{errorMessage}</div>}

                                {!codeSent ? (
                                    <form onSubmit={handleSendCode}>
                                        <div className="form-group">
                                            <label htmlFor="email">Correo electrónico</label>
                                            <div className="input-wrapper">
                                                <FiMail className="input-icon" />
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="Ingresa tu correo electrónico"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" className="verify-button" disabled={isSubmitting}>
                                            {isSubmitting ? "Enviando..." : "Enviar código de verificación"}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerify}>
                                        <div className="form-group">
                                            <label htmlFor="code">Código de verificación</label>
                                            <div className="input-wrapper">
                                                <FiLock className="input-icon" />
                                                <input
                                                    type="text"
                                                    id="code"
                                                    name="code"
                                                    value={formData.code}
                                                    onChange={handleInputChange}
                                                    placeholder="Ingresa el código recibido"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <p className="code-hint">Hemos enviado un código de verificación a tu correo electrónico.</p>
                                        </div>
                                        <button type="submit" className="verify-button" disabled={isSubmitting}>
                                            {isSubmitting ? "Verificando..." : "Verificar código"}
                                        </button>
                                    </form>
                                )}

                                <button
                                    className="back-link"
                                    onClick={() => {
                                        setShowVerificationForm(false)
                                        setCodeSent(false)
                                        setErrorMessage("")
                                    }}
                                >
                                    Volver
                                </button>
                            </div>
                        ) : (
                            <div className="blocked-actions">
                                <p>Si tienes dudas, por favor contacta a soporte.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="blocked-particles">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="particle"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${5 + Math.random() * 10}s`,
                            }}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    )
}