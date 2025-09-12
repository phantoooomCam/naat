"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft,
  faFile,
  faCalendarAlt,
  faUser,
  faBuilding,
  faTag,
  faShare,
  faPhone,
  faCar,
  faCamera,
  faMapMarkerAlt,
  faUsers,
  faDatabase,
  faShieldAlt,
  faGlobe,
  faEnvelope,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons"
import PropTypes from "prop-types"

// Componente de vista principal
const DetalleView = ({ isSidebarCollapsed, casoId }) => {
  const navigate = useNavigate()
  const [casoData, setCasoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState(null)

  // Datos ficticios del caso
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setCasoData({
        id: casoId,
        titulo: "Investigación de Fraude Financiero - Caso #2024-001",
        descripcion:
          "Investigación exhaustiva sobre actividades fraudulentas detectadas en transacciones bancarias. Se requiere análisis de múltiples fuentes de información para determinar el alcance y los responsables del fraude.",
        estado: "En proceso",
        fechaCreacion: "2024-01-15T10:30:00Z",
        fechaActualizacion: "2024-01-20T14:45:00Z",
        asignado: "Ana García Rodríguez",
        organizacion: "Fiscalía General del Estado",
        area: "Delitos Financieros",
        departamento: "Investigación Especializada",
        prioridad: "Alta",
        numeroExpediente: "FGE-2024-DF-001",
        investigadorPrincipal: "Lic. Carlos Mendoza",
        supervisorCaso: "Mtro. Roberto Silva",
      })
      setLoading(false)
    }, 1000)
  }, [casoId])

  // Secciones disponibles para el caso
  const secciones = [
    {
      id: "redes-sociales",
      titulo: "Redes Sociales",
      descripcion: "Análisis de perfiles y actividad en redes sociales",
      icon: faShare,
      color: "#1DA1F2",
      disponible: true,
    },
    {
      id: "sabanas-telefonicas",
      titulo: "Sábanas Telefónicas",
      descripcion: "Registros de llamadas y comunicaciones",
      icon: faPhone,
      color: "#25D366",
      disponible: true,
    },
    {
      id: "registros-automovilisticos",
      titulo: "Registros Automovilísticos",
      descripcion: "Información vehicular y de tránsito",
      icon: faCar,
      color: "#FF6B35",
      disponible: true,
    },
    {
      id: "evidencia-fotografica",
      titulo: "Evidencia Fotográfica",
      descripcion: "Imágenes y documentos visuales del caso",
      icon: faCamera,
      color: "#8E44AD",
      disponible: true,
    },
    {
      id: "ubicaciones-gps",
      titulo: "Ubicaciones GPS",
      descripcion: "Rastreo y análisis de ubicaciones",
      icon: faMapMarkerAlt,
      color: "#E74C3C",
      disponible: false,
    },
    {
      id: "contactos-asociados",
      titulo: "Contactos Asociados",
      descripcion: "Red de contactos y relaciones",
      icon: faUsers,
      color: "#F39C12",
      disponible: true,
    },
    {
      id: "registros-bancarios",
      titulo: "Registros Bancarios",
      descripcion: "Movimientos y transacciones financieras",
      icon: faDatabase,
      color: "#27AE60",
      disponible: false,
    },
    {
      id: "antecedentes-penales",
      titulo: "Antecedentes Penales",
      descripcion: "Historial criminal y judicial",
      icon: faShieldAlt,
      color: "#C0392B",
      disponible: true,
    },
    {
      id: "actividad-web",
      titulo: "Actividad Web",
      descripcion: "Navegación y actividad en internet",
      icon: faGlobe,
      color: "#3498DB",
      disponible: false,
    },
    {
      id: "comunicaciones-email",
      titulo: "Comunicaciones Email",
      descripcion: "Correos electrónicos y comunicaciones",
      icon: faEnvelope,
      color: "#9B59B6",
      disponible: true,
    },
  ]

  const handleSectionClick = (seccion) => {
    if (seccion.disponible) {
      setSelectedSection(seccion)
      // Aquí podrías navegar a una subsección específica
      console.log(`Navegando a sección: ${seccion.id}`)
    }
  }

  const getEstadoClass = (estado) => {
    switch (estado) {
      case "En proceso":
        return "estado-en-proceso"
      case "Activo":
        return "estado-activo"
      case "Resuelto":
        return "estado-resuelto"
      case "Archivado":
        return "estado-archivado"
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <div className={`detalle-container ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="loading-state">
          <FontAwesomeIcon icon={faFile} className="loading-icon" />
          <p>Cargando detalles del caso...</p>
        </div>
      </div>
    )
  }

  if (!casoData) {
    return (
      <div className={`detalle-container ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="error-state">
          <FontAwesomeIcon icon={faFile} className="error-icon" />
          <p>No se pudo cargar la información del caso</p>
          <button onClick={() => navigate(-1)} className="back-button">
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="detalle-completo-view">
      {/* Header del caso */}
      <div className="detalle-header">
        <div className="header-navigation">
          <button onClick={() => navigate(-1)} className="back-button">
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver a casos
          </button>
        </div>

        <div className="caso-title-section">
          <div className="caso-main-info">
            <h1 className="caso-titulo">{casoData.titulo}</h1>
            <div className="caso-metadata">
              <span className={`estado-badge ${getEstadoClass(casoData.estado)}`}>{casoData.estado}</span>
              <span className="caso-expediente">#{casoData.numeroExpediente}</span>
              <span className="caso-prioridad prioridad-alta">Prioridad {casoData.prioridad}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información general del caso */}
      <div className="caso-info-grid">
        <div className="info-card">
          <div className="info-header">
            <FontAwesomeIcon icon={faFile} className="info-icon" />
            <h3>Información General</h3>
          </div>
          <div className="info-content">
            <p className="caso-descripcion">{casoData.descripcion}</p>

            <div className="info-details">
              <div className="detail-item">
                <FontAwesomeIcon icon={faCalendarAlt} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Fecha de creación:</span>
                  <span className="detail-value">
                    {new Date(casoData.fechaCreacion).toLocaleString("es-MX", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <FontAwesomeIcon icon={faUser} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Investigador principal:</span>
                  <span className="detail-value">{casoData.investigadorPrincipal}</span>
                </div>
              </div>

              <div className="detail-item">
                <FontAwesomeIcon icon={faBuilding} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Organización:</span>
                  <span className="detail-value">{casoData.organizacion}</span>
                </div>
              </div>

              <div className="detail-item">
                <FontAwesomeIcon icon={faTag} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Área:</span>
                  <span className="detail-value">{casoData.area}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones del caso */}
      <div className="secciones-container">
        <div className="secciones-header">
          <h2>Secciones del Caso</h2>
          <p>Selecciona una sección para acceder a la información específica</p>
        </div>

        <div className="secciones-grid">
          {secciones.map((seccion) => (
            <div
              key={seccion.id}
              className={`seccion-card ${!seccion.disponible ? "disabled" : ""} ${
                selectedSection?.id === seccion.id ? "selected" : ""
              }`}
              onClick={() => handleSectionClick(seccion)}
            >
              <div className="seccion-icon-container" style={{ backgroundColor: seccion.color }}>
                <FontAwesomeIcon icon={seccion.icon} className="seccion-icon" />
              </div>

              <div className="seccion-content">
                <h3 className="seccion-titulo">{seccion.titulo}</h3>
                <p className="seccion-descripcion">{seccion.descripcion}</p>

                <div className="seccion-status">
                  {seccion.disponible ? (
                    <span className="status-disponible">Disponible</span>
                  ) : (
                    <span className="status-no-disponible">No disponible</span>
                  )}
                </div>
              </div>

              {seccion.disponible && (
                <div className="seccion-arrow">
                  <FontAwesomeIcon icon={faChevronRight} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      <div className="additional-info">
        <div className="info-summary">
          <h3>Resumen del Caso</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-number">{secciones.filter((s) => s.disponible).length}</span>
              <span className="stat-label">Secciones disponibles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {Math.floor((Date.now() - new Date(casoData.fechaCreacion).getTime()) / (1000 * 60 * 60 * 24))}
              </span>
              <span className="stat-label">Días activo</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">85%</span>
              <span className="stat-label">Progreso</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal con estructura dash-home y container
const DetalleCompleto = ({ casoId }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

  const views = {
    detalle: <DetalleView isSidebarCollapsed={isSidebarCollapsed} casoId={casoId} />,
  }

  return (
    <div className={`dash-home ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">{views.detalle}</div>
    </div>
  )
}

DetalleCompleto.propTypes = {
  casoId: PropTypes.string.isRequired,
}

export default DetalleCompleto
