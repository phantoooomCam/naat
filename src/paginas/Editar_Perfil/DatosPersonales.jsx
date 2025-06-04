"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { FaUser, FaEnvelope, FaPhone, FaSave, FaTimes } from "react-icons/fa"
import "./PerfilUsuario.css"
import fetchWithAuth from "../../utils/fetchWithAuth";


const PerfilUsuario = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)


  const [perfilData, setPerfilData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correo: "",
    telefono: "",
  })

  const [isEditing, setIsEditing] = useState(false)


  const [isLoading, setIsLoading] = useState(false)

  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" })

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("user")) || {}

    setPerfilData({
      nombre: usuario.nombre || "",
      apellidoPaterno: usuario.apellidoPaterno || "",
      apellidoMaterno: usuario.apellidoMaterno || "",
      correo: usuario.correo || "",
      telefono: usuario.telefono || "",
    })
  }, [])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar")
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"))
      }
    })

    observer.observe(document.body, { attributes: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setPerfilData({
      ...perfilData,
      [name]: value,
    })
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    if (!phone) return true 
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateEmail(perfilData.correo)) {
      setStatusMessage({
        type: "error",
        message: "Por favor, ingresa un correo electrónico válido",
      })
      return
    }

    if (!validatePhone(perfilData.telefono)) {
      setStatusMessage({
        type: "error",
        message: "El teléfono debe contener 10 dígitos",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetchWithAuth("/api/usuarios/perfil", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      
        body: JSON.stringify(perfilData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.mensaje || "Error al actualizar el perfil")
      }

      const usuario = JSON.parse(localStorage.getItem("user")) || {}
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...usuario,
          ...perfilData,
        }),
      )

      setStatusMessage({
        type: "success",
        message: "Perfil actualizado correctamente",
      })
      setIsEditing(false)


      setTimeout(() => {
        setStatusMessage({ type: "", message: "" })
      }, 3000)
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: error.message,
      })


    }
  }

  const handleCancel = () => {
    const usuario = JSON.parse(localStorage.getItem("user")) || {}
    setPerfilData({
      nombre: usuario.nombre || "",
      apellidoPaterno: usuario.apellidoPaterno || "",
      apellidoMaterno: usuario.apellidoMaterno || "",
      correo: usuario.correo || "",
      telefono: usuario.telefono || "",
    })

    setIsEditing(false)
    setStatusMessage({ type: "", message: "" })
  }

  return (
    <div className={`perfil-container ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="perfil-content">
        <div className="perfil-header">
          <h2>Configuración de Perfil</h2>
          <p className="perfil-subtitle">Actualiza tu información personal</p>
        </div>

        {statusMessage.message && <div className={`status-message ${statusMessage.type}`}>{statusMessage.message}</div>}

        <div className="perfil-card">
          {!isEditing ? (
            <div className="perfil-view">
              <div className="perfil-avatar-container">
                <div className="perfil-avatar">
                  {perfilData.nombre ? perfilData.nombre.charAt(0).toUpperCase() : "U"}
                </div>
              </div>

              <div className="perfil-info">
                <h3>{`${perfilData.nombre} ${perfilData.apellidoPaterno} ${perfilData.apellidoMaterno}`}</h3>

                <div className="info-row">
                  <div className="info-label">
                    <FaEnvelope className="info-icon" />
                    <span>Correo electrónico:</span>
                  </div>
                  <div className="info-value">{perfilData.correo}</div>
                </div>

                <div className="info-row">
                  <div className="info-label">
                    <FaPhone className="info-icon" />
                    <span>Teléfono:</span>
                  </div>
                  <div className="info-value">{perfilData.telefono || "No especificado"}</div>
                </div>

                <button className="btn-edit-perfil" onClick={() => setIsEditing(true)}>
                  Editar Perfil
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="perfil-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">
                    <FaUser className="form-icon" />
                    <span>Nombre</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={perfilData.nombre}
                    onChange={handleChange}
                    placeholder="Ingresa tu nombre"
                    required
                    disabled
                    className="form-input disabled"
                  />
                  <small className="form-help">El nombre no puede ser modificado</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="apellidoPaterno">
                    <FaUser className="form-icon" />
                    <span>Apellido Paterno</span>
                  </label>
                  <input
                    type="text"
                    id="apellidoPaterno"
                    name="apellidoPaterno"
                    value={perfilData.apellidoPaterno}
                    onChange={handleChange}
                    placeholder="Ingresa tu apellido paterno"
                    disabled
                    className="form-input disabled"
                  />
                  <small className="form-help">El apellido paterno no puede ser modificado</small>
                </div>

                <div className="form-group">
                  <label htmlFor="apellidoMaterno">
                    <FaUser className="form-icon" />
                    <span>Apellido Materno</span>
                  </label>
                  <input
                    type="text"
                    id="apellidoMaterno"
                    name="apellidoMaterno"
                    value={perfilData.apellidoMaterno}
                    onChange={handleChange}
                    placeholder="Ingresa tu apellido materno"
                    disabled
                    className="form-input disabled"
                  />
                  <small className="form-help">El apellido materno no puede ser modificado</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="correo">
                    <FaEnvelope className="form-icon" />
                    <span>Correo Electrónico</span>
                  </label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={perfilData.correo}
                    onChange={handleChange}
                    placeholder="Ingresa tu correo electrónico"
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefono">
                    <FaPhone className="form-icon" />
                    <span>Teléfono</span>
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={perfilData.telefono}
                    onChange={handleChange}
                    placeholder="Ingresa tu número telefónico (10 dígitos)"
                    className="form-input"
                    maxLength={10}
                    pattern="\d{10}"
                  />
                  <small className="form-help">Formato: 10 dígitos sin espacios ni guiones</small>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel-perfil" onClick={handleCancel} disabled={isLoading}>
                  <FaTimes className="btn-icon" />
                  <span>Cancelar</span>
                </button>
                <button type="submit" className="btn-save-perfil" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="btn-icon" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerfilUsuario

