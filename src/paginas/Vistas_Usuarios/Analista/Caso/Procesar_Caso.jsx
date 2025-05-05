"use client"

import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faFile, faTrash, faCheck, faSpinner, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import "./Caso.css"

const Procesar_Caso = ({ activeView }) => {
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
    procesamiento: <ProcesamientoView isSidebarCollapsed={isSidebarCollapsed} />,
  }

  return (
    <div className={`dash-home ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">{views[activeView] || views.procesamiento}</div>
    </div>
  )
}

// Modificar el componente ProcesamientoView para mejorar la responsividad
const ProcesamientoView = ({ isSidebarCollapsed }) => {
  const [casos, setCasos] = useState([])
  const [selectedCaso, setSelectedCaso] = useState(null)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState(null) // 'success', 'error', null
  const [statusMessage, setStatusMessage] = useState("")

  // Estado para filtros
  const [filters, setFilters] = useState({
    resuelto: false,
    sinResolver: false,
    enProceso: false,
  })

  // Cargar casos de ejemplo
  useEffect(() => {
    const casosDePrueba = [
      {
        id: 1,
        titulo: "Investigación de fraude telefónico",
        descripcion: "Cliente reporta llamadas sospechosas desde múltiples números",
        estado: "En proceso",
        fechaCreacion: "15/04/2023",
        asignado: "Ana Martínez",
      },
      {
        id: 2,
        titulo: "Análisis de patrón de comunicaciones",
        descripcion: "Revisar patrones de comunicación en horarios específicos",
        estado: "Sin resolver",
        fechaCreacion: "03/05/2023",
        asignado: "Carlos Rodríguez",
      },
      {
        id: 3,
        titulo: "Verificación de ubicaciones sospechosas",
        descripcion: "Analizar ubicaciones recurrentes en datos de sabana",
        estado: "Resuelto",
        fechaCreacion: "22/03/2023",
        asignado: "Laura Sánchez",
      },
    ]

    setCasos(casosDePrueba)
  }, [])

  const handleCrearCaso = () => {
    if (!titulo.trim()) {
      setProcessingStatus("error")
      setStatusMessage("El título del caso es obligatorio")
      setTimeout(() => setProcessingStatus(null), 3000)
      return
    }

    setIsProcessing(true)
    setProcessingStatus(null)

    // Simulación de creación de caso
    setTimeout(() => {
      const nuevoCaso = {
        id: Date.now() + Math.random(),
        titulo: titulo,
        descripcion: descripcion,
        estado: "Sin resolver",
        fechaCreacion: new Date().toLocaleDateString(),
        asignado: "Usuario Actual",
      }

      setCasos((prevCasos) => [nuevoCaso, ...prevCasos])
      setTitulo("")
      setDescripcion("")
      setIsProcessing(false)
      setProcessingStatus("success")
      setStatusMessage("Caso creado correctamente")
      setTimeout(() => setProcessingStatus(null), 3000)
    }, 1500)
  }

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))
  }

  const handleCasoDelete = (casoId) => {
    setCasos((prevCasos) => {
      const updatedCasos = prevCasos.filter((caso) => caso.id !== casoId)
      // Si el caso seleccionado es el que se está eliminando, deseleccionarlo
      if (selectedCaso && selectedCaso.id === casoId) {
        setSelectedCaso(null)
      }
      return updatedCasos
    })
  }

  const handleCambiarEstado = (casoId, nuevoEstado) => {
    setCasos((prevCasos) => {
      return prevCasos.map((caso) => {
        if (caso.id === casoId) {
          return { ...caso, estado: nuevoEstado }
        }
        return caso
      })
    })

    // Si el caso seleccionado es el que se está modificando, actualizar también el seleccionado
    if (selectedCaso && selectedCaso.id === casoId) {
      setSelectedCaso((prev) => ({ ...prev, estado: nuevoEstado }))
    }
  }

  // Filtrar casos según los filtros seleccionados
  const filteredCasos = casos.filter((caso) => {
    // Si no hay filtros activos, mostrar todos
    if (!filters.resuelto && !filters.sinResolver && !filters.enProceso) {
      return true
    }

    // Mostrar según los filtros seleccionados
    if (filters.resuelto && caso.estado === "Resuelto") return true
    if (filters.sinResolver && caso.estado === "Sin resolver") return true
    if (filters.enProceso && caso.estado === "En proceso") return true

    return false
  })

  const handleGuardarEnBD = async () => {
    if (casos.length === 0) {
      setProcessingStatus("error")
      setStatusMessage("No hay casos para guardar")
      setTimeout(() => setProcessingStatus(null), 3000)
      return
    }

    setIsProcessing(true)
    setProcessingStatus(null)

    try {
      // Simulación de guardado en base de datos
      setTimeout(() => {
        setIsProcessing(false)
        setProcessingStatus("success")
        setStatusMessage("Casos guardados correctamente")
        setTimeout(() => setProcessingStatus(null), 3000)
      }, 2000)
    } catch (error) {
      console.error(error)
      setIsProcessing(false)
      setProcessingStatus("error")
      setStatusMessage("Error al guardar los casos")
      setTimeout(() => setProcessingStatus(null), 3000)
    }
  }

  const handleClearAllCasos = () => {
    setCasos([])
    setSelectedCaso(null)
  }

  // Obtener clase para el estado
  const getEstadoClass = (estado) => {
    switch (estado) {
      case "Resuelto":
        return "estado-resuelto"
      case "Sin resolver":
        return "estado-sin-resolver"
      case "En proceso":
        return "estado-en-proceso"
      default:
        return ""
    }
  }

  return (
    <div className={`caso-container ${isSidebarCollapsed ? "collapsed" : ""}`}>
      {/* Status message */}
      {processingStatus && (
        <div className={`status-message ${processingStatus}`}>
          <div className="status-icon">
            {processingStatus === "success" ? (
              <FontAwesomeIcon icon={faCheck} />
            ) : (
              <FontAwesomeIcon icon={faExclamationTriangle} />
            )}
          </div>
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="caso-header">
        <h2>Gestión de Casos</h2>
        <p>Crea y administra casos de investigación</p>
      </div>

      <div className="crear-area-grid">
        <div className="crear-card">
          <div className="crear-content">
            <FontAwesomeIcon icon={faPlus} className="crear-icon" />
            <h3>Crear Nuevo Caso</h3>

            <div style={{ width: "100%", textAlign: "left", marginBottom: "15px" }}>
              <label htmlFor="titulo-caso" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Título del Caso:
              </label>
              <input
                id="titulo-caso"
                type="text"
                className="caso-input"
                placeholder="Ingrese el título del caso"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div style={{ width: "100%", textAlign: "left", marginBottom: "15px" }}>
              <label htmlFor="descripcion-caso" style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Descripción:
              </label>
              <textarea
                id="descripcion-caso"
                className="caso-textarea"
                placeholder="Ingrese la descripción del caso"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <button onClick={handleCrearCaso} className="crear-button" disabled={isProcessing || !titulo.trim()}>
              {isProcessing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Creando...</span>
                </>
              ) : (
                <span>Crear Caso</span>
              )}
            </button>
          </div>
        </div>

        <div className="filtros-card">
          <div className="card-header">
            <h3>Filtrar Casos</h3>
          </div>
          <div className="filtros-content">
            <div className="filter-group">
              <div className="checkbox-filter">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.resuelto}
                    onChange={() => handleFilterChange("resuelto", !filters.resuelto)}
                    disabled={isProcessing}
                  />
                  <span>Casos Resueltos</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.sinResolver}
                    onChange={() => handleFilterChange("sinResolver", !filters.sinResolver)}
                    disabled={isProcessing}
                  />
                  <span>Casos Sin Resolver</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.enProceso}
                    onChange={() => handleFilterChange("enProceso", !filters.enProceso)}
                    disabled={isProcessing}
                  />
                  <span>Casos En Proceso</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modificación del orden de los elementos en el JSX para dispositivos móviles */}
      <div className="main-content-area-caso">
        <div className="casos-card">
          <div className="card-header">
            <h3>Casos</h3>
            <span className="caso-count">{casos.length} casos</span>
          </div>

          {casos.length > 0 ? (
            <div className="casos-list">
              {filteredCasos.map((caso) => (
                <div
                  key={caso.id}
                  className={`caso-item ${selectedCaso && selectedCaso.id === caso.id ? "selected" : ""}`}
                  onClick={() => setSelectedCaso(caso)}
                >
                  <div className="caso-info">
                    <FontAwesomeIcon icon={faFile} className="caso-icon" />
                    <div className="caso-details">
                      <span className="caso-name">{caso.titulo}</span>
                      <span className="caso-meta">
                        <span className={`estado-badge ${getEstadoClass(caso.estado)}`}>{caso.estado}</span>
                        <span className="caso-fecha-asignado">
                          {caso.fechaCreacion} • {caso.asignado}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="caso-actions">
                    <button
                      className="delete-caso-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCasoDelete(caso.id)
                      }}
                      disabled={isProcessing}
                      aria-label={`Eliminar caso ${caso.titulo}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-casos">
              <p>No hay casos creados</p>
              <button
                onClick={() => document.getElementById("titulo-caso").focus()}
                className="crear-button-small"
                disabled={isProcessing}
              >
                Crear caso
              </button>
            </div>
          )}

          <div className="action-buttons">
            <button
              className="process-button"
              onClick={() => {
                if (selectedCaso) handleCambiarEstado(selectedCaso.id, "En proceso")
              }}
              disabled={isProcessing || !selectedCaso || selectedCaso?.estado === "En proceso"}
            >
              Marcar En Proceso
            </button>
            <button
              className="save-button"
              onClick={() => {
                if (selectedCaso) handleCambiarEstado(selectedCaso.id, "Resuelto")
              }}
              disabled={isProcessing || !selectedCaso || selectedCaso?.estado === "Resuelto"}
            >
              Marcar Resuelto
            </button>
            <button
              className="clear-button"
              onClick={handleClearAllCasos}
              disabled={isProcessing || casos.length === 0}
            >
              Limpiar Todo
            </button>
          </div>
        </div>

        <div className="detalles-card">
          <div className="card-header">
            <h3>Detalles del Caso</h3>
          </div>
          <div className="detalles-content">
            {selectedCaso ? (
              <div className="selected-caso-preview">
                <FontAwesomeIcon icon={faFile} className="caso-preview-icon" />
                <h4>{selectedCaso.titulo}</h4>
                <p style={{ marginBottom: "20px", textAlign: "left", width: "100%" }}>{selectedCaso.descripcion}</p>
                <div className="caso-details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Estado:</span>
                    <span className="detail-value">
                      <span className={`estado-badge ${getEstadoClass(selectedCaso.estado)}`}>
                        {selectedCaso.estado}
                      </span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Fecha de creación:</span>
                    <span className="detail-value">{selectedCaso.fechaCreacion}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Asignado a:</span>
                    <span className="detail-value">{selectedCaso.asignado}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <FontAwesomeIcon icon={faFile} className="no-caso-icon" />
                <p>Selecciona un caso para ver sus detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

Procesar_Caso.propTypes = {
  activeView: PropTypes.string.isRequired,
}

ProcesamientoView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
}

export default Procesar_Caso
