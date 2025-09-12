"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
import fetchWithAuth from "../../../../utils/fetchWithAuth"

// Vista principal de detalle
const DetalleView = ({ isSidebarCollapsed, casoId }) => {
  const navigate = useNavigate()
  const [casoData, setCasoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState(null)

  // --- CARGA REAL DESDE EL BACKEND ---
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetchWithAuth(`/api/casos/${casoId}`)
        if (!res || !res.ok) throw new Error("No se pudo cargar el caso")
        const raw = await res.json()

        // Mapeo defensivo hacia las claves usadas por tu UI
        const data = {
          id: raw.idCaso ?? raw.id ?? casoId,
          titulo: raw.nombre ?? raw.titulo ?? "Caso sin título",
          descripcion: raw.descripcion ?? "",
          estado: raw.estado ?? "Activo",
          fechaCreacion: raw.fechaCreacion ?? null,
          fechaActualizacion: raw.fechaActualizacion ?? null,
          asignado: raw.asignadoA ?? raw.investigadorPrincipal ?? "—",
          organizacion: raw.nombreOrganizacion ?? raw.organizacion ?? "No especificada",
          area: raw.nombreArea ?? raw.area ?? "No especificada",
          departamento: raw.nombreDepartamento ?? raw.departamento ?? "No especificado",
          prioridad: raw.prioridad ?? "—",
          numeroExpediente: raw.folio ?? raw.numeroExpediente ?? `CASO-${casoId}`,
          investigadorPrincipal: raw.investigadorPrincipal ?? "—",
          supervisorCaso: raw.supervisorCaso ?? undefined,
        }

        if (alive) setCasoData(data)
      } catch (err) {
        console.error(err)
        if (alive) setCasoData(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [casoId])

  // --- SECCIONES DEL CASO (SIN CAMBIOS) ---
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
    if (seccion.disponible) setSelectedSection(seccion)
  }

  const getEstadoClass = (estado) => {
    switch ((estado || "").toLowerCase()) {
      case "en proceso": return "estado-en-proceso"
      case "activo":     return "estado-activo"
      case "resuelto":   return "estado-resuelto"
      case "archivado":  return "estado-archivado"
      default:           return ""
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
              {casoData.prioridad && <span className="caso-prioridad prioridad-alta">Prioridad {casoData.prioridad}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Información general del caso (datos reales) */}
      <div className="caso-info-grid">
        <div className="info-card">
          <div className="info-header">
            <FontAwesomeIcon icon={faFile} className="info-icon" />
            <h3>Información General</h3>
          </div>
          <div className="info-content">
            {casoData.descripcion && <p className="caso-descripcion">{casoData.descripcion}</p>}

            <div className="info-details">
              <div className="detail-item">
                <FontAwesomeIcon icon={faCalendarAlt} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Fecha de creación:</span>
                  <span className="detail-value">
                    {casoData.fechaCreacion
                      ? new Date(casoData.fechaCreacion).toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <FontAwesomeIcon icon={faUser} className="detail-icon" />
                <div className="detail-content">
                  <span className="detail-label">Investigador principal:</span>
                  <span className="detail-value">{casoData.investigadorPrincipal ?? "—"}</span>
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

      {/* --- Secciones del caso (SIN CAMBIOS) --- */}
      <div className="secciones-container">
        <div className="secciones-header">
          <h2>Secciones del Caso</h2>
          <p>Selecciona una sección para acceder a la información específica</p>
        </div>

        <div className="secciones-grid">
          {secciones.map((seccion) => (
            <div
              key={seccion.id}
              className={`seccion-card ${!seccion.disponible ? "disabled" : ""} ${selectedSection?.id === seccion.id ? "selected" : ""}`}
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

      {/* --- Información adicional (SIN CAMBIOS) --- */}
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
                {casoData.fechaCreacion
                  ? Math.floor((Date.now() - new Date(casoData.fechaCreacion).getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
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

// Componente principal: obtiene :id de la URL y lo pasa a la vista
const DetalleCompleto = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { id } = useParams()

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

  return (
    <div className={`dash-home ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">
        <DetalleView isSidebarCollapsed={isSidebarCollapsed} casoId={id} />
      </div>
    </div>
  )
}

export default DetalleCompleto
