"use client"
import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faSearch,
  faFilter,
  faClipboardList,
  faFile,
  faFolderOpen,
  faArrowRight,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons"
import "./ListadoSabanas.css"

const ListadoSabanas = ({ activeView }) => {
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
    listados: <Listado />,
  }

  return (
    <div className={`redes-info-wrapper ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">{views[activeView] || views.listados}</div>
    </div>
  )
}

const Listado = () => {
  const [sabanas, setSabanas] = useState([])
  const [selectedSabana, setSelectedSabana] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    procesado: false,
    pendiente: false,
    error: false,
  })

  const fetchSabanas = async () => {
    setIsLoading(true)
    try {
      // Aquí irá tu función GET hacia la base de datos
      // Por ahora uso datos de ejemplo basados en tu estructura
      const datosSabanas = [
        {
          idArchivo: 105,
          ruta: "ftp/upload/3335547293/3335547293 Altan.xlsx",
          estado: "procesado",
          nombreArchivo: "3335547293 Altan.xlsx",
          departamento: "Desarrollo de Software",
          area: "Tecnologia",
          organizacion: "RyR",
        },
        {
          idArchivo: 106,
          ruta: "ftp/upload/4445558394/4445558394 Telcel.xlsx",
          estado: "pendiente",
          nombreArchivo: "4445558394 Telcel.xlsx",
          departamento: "Análisis de Datos",
          area: "Tecnologia",
          organizacion: "RyR",
        },
        {
          idArchivo: 107,
          ruta: "ftp/upload/5556669495/5556669495 Movistar.xlsx",
          estado: "procesado",
          nombreArchivo: "5556669495 Movistar.xlsx",
          departamento: "Desarrollo de Software",
          area: "Tecnologia",
          organizacion: "RyR",
        },
      ]
      setSabanas(datosSabanas)
    } catch (error) {
      console.error("Error al cargar sábanas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSabanas()
  }, [])

  const filteredSabanas = sabanas.filter((sabana) => {
    if (
      searchTerm &&
      !sabana.nombreArchivo.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !sabana.estado.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    if (!filters.procesado && !filters.pendiente && !filters.error) {
      return true
    }
    if (filters.procesado && sabana.estado === "procesado") return true
    if (filters.pendiente && sabana.estado === "pendiente") return true
    if (filters.error && sabana.estado === "error") return true

    return false
  })

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))
  }

  const getEstadoClass = (estado) => {
    switch (estado) {
      case "procesado":
        return "estado-procesado"
      case "pendiente":
        return "estado-pendiente"
      case "error":
        return "estado-error"
      default:
        return ""
    }
  }

  const handleVerSabana = (sabana) => {
    console.log("Ver sábana:", sabana)
    // Aquí puedes agregar la lógica para navegar o mostrar detalles
  }

  return (
    <div className="listado-sabanas-container">
      <div className="sabanas-header">
        <div className="header-content">
          <h2>Listado de Sábanas</h2>
          <p>Gestiona y visualiza todas las sábanas procesadas</p>
        </div>
        <div className="search-container">
          <div className="search-input-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar sábanas..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="left-column">
          <div className="filtros-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faFilter} /> Filtrar Sábanas
              </h3>
            </div>
            <div className="filtros-content">
              <div className="filter-group">
                <div className="checkbox-filter">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.procesado}
                      onChange={() => handleFilterChange("procesado", !filters.procesado)}
                    />
                    <span>Procesadas</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.pendiente}
                      onChange={() => handleFilterChange("pendiente", !filters.pendiente)}
                    />
                    <span>Pendientes</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.error}
                      onChange={() => handleFilterChange("error", !filters.error)}
                    />
                    <span>Con Error</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="sabanas-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faClipboardList} /> Sábanas
              </h3>
              <span className="sabana-count">{filteredSabanas.length} sábanas</span>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
                <p>Cargando sábanas...</p>
              </div>
            ) : filteredSabanas.length > 0 ? (
              <div className="sabanas-table-container">
                <table className="sabanas-table">
                  <thead>
                    <tr>
                      <th>ID Archivo</th>
                      <th>Nombre Archivo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSabanas.map((sabana) => (
                      <tr
                        key={sabana.idArchivo}
                        className={`sabana-row ${selectedSabana?.idArchivo === sabana.idArchivo ? "selected" : ""}`}
                        onClick={() => setSelectedSabana(sabana)}
                      >
                        <td className="id-column">{sabana.idArchivo}</td>
                        <td className="nombre-column">
                          <div className="archivo-info">
                            <FontAwesomeIcon icon={faFile} className="archivo-icon" />
                            <span className="archivo-nombre">{sabana.nombreArchivo}</span>
                          </div>
                        </td>
                        <td className="estado-column">
                          <span className={`estado-badge ${getEstadoClass(sabana.estado)}`}>{sabana.estado}</span>
                        </td>
                        <td className="acciones-column">
                          <button
                            className="ver-sabana-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVerSabana(sabana)
                            }}
                          >
                            <FontAwesomeIcon icon={faFolderOpen} />
                            Ver Sábana
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-sabanas">
                <FontAwesomeIcon icon={faFolderOpen} className="empty-icon" />
                <p>No hay sábanas disponibles</p>
              </div>
            )}
          </div>

          <div className="detalles-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faFile} /> Detalles de la Sábana
              </h3>
            </div>
            <div className="detalles-content">
              {selectedSabana ? (
                <div className="selected-sabana-preview">
                  <div className="sabana-preview-header">
                    <FontAwesomeIcon icon={faFile} className="sabana-preview-icon" />
                    <h4>{selectedSabana.nombreArchivo}</h4>
                  </div>

                  <div className="sabana-preview-body">
                    <div className="sabana-details-grid">
                      <div className="detail-row">
                        <span className="detail-label">ID Archivo:</span>
                        <span className="detail-value">{selectedSabana.idArchivo}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Estado:</span>
                        <span className="detail-value">
                          <span className={`estado-badge ${getEstadoClass(selectedSabana.estado)}`}>
                            {selectedSabana.estado}
                          </span>
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Ruta:</span>
                        <span className="detail-value">{selectedSabana.ruta}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Departamento:</span>
                        <span className="detail-value">{selectedSabana.departamento}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Área:</span>
                        <span className="detail-value">{selectedSabana.area}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Organización:</span>
                        <span className="detail-value">{selectedSabana.organizacion}</span>
                      </div>
                    </div>

                    <button className="view-details-button" onClick={() => handleVerSabana(selectedSabana)}>
                      <FontAwesomeIcon icon={faArrowRight} />
                      <span>Ver detalles completos</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <FontAwesomeIcon icon={faFile} className="no-sabana-icon" />
                  <p>Selecciona una sábana para ver sus detalles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

ListadoSabanas.propTypes = {
  activeView: PropTypes.string.isRequired,
}

export default ListadoSabanas
