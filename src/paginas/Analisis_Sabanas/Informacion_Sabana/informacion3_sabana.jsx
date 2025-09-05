"use client"

import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFilter, faInfoCircle, faProjectDiagram, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons"
import "./informacion_sabana.css"
import { useLocation } from "react-router-dom"

const Informacion3_Sabana = ({ activeView }) => {
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
    gestion: <GestionSabanaView />, // Removed isSidebarCollapsed prop here, as it's handled by the outer wrapper
  }

  return (
    // Apply sidebar collapse class to the main wrapper
    <div className={`sabana-info-wrapper ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">{views[activeView] || views.gestion}</div>
    </div>
  )
}

const GestionSabanaView = () => {
  // Removed isSidebarCollapsed prop from here
  const [filters, setFilters] = useState({
    ubicacion: false,
    contactos: false,
    ciudades: false,
    puntosInteres: false,
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
  })

  const [activeButton, setActiveButton] = useState(null)

  //Ubicacion del id_sabanas
  const location = useLocation()
  const idSabana = location.state?.idSabana || null
  const [registros, setRegistros] = useState([])
  const [error, setError] = useState("")

  const [searchFilter, setSearchFilter] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(10)

  const getTypeText = (typeId) => {
    const typeMap = {
      0: "Datos",
      1: "MensajeriaMultimedia",
      2: "Mensaje2ViasEnt",
      3: "Mensaje2ViasSal",
      4: "VozEntrante",
      5: "VozSaliente",
      6: "VozTransfer",
      7: "VozTransito",
      8: "Ninguno",
      9: "Wifi",
      10: "ReenvioSal",
      11: "ReenvioEnt",
    }
    return typeMap[typeId] || `Tipo ${typeId}`
  }

  const getTypeBadgeClass = (typeId) => {
    const classMap = {
      0: "type-datos",
      1: "type-mensajeria",
      2: "type-mensaje2vias-ent",
      3: "type-mensaje2vias-sal",
      4: "type-voz-entrante",
      5: "type-voz-saliente",
      6: "type-voz-transfer",
      7: "type-voz-transito",
      8: "type-ninguno",
      9: "type-wifi",
      10: "type-reenvio-sal",
      11: "type-reenvio-ent",
    }
    return `type-badge ${classMap[typeId] || "type-ninguno"}`
  }

  const filteredRegistros = registros.filter((registro) => {
    const searchTerm = searchFilter.toLowerCase()
    const typeText = getTypeText(registro.id_tipo_registro).toLowerCase()
    return (
      registro.numero_a.toString().includes(searchTerm) ||
      registro.numero_b.toString().includes(searchTerm) ||
      typeText.includes(searchTerm)
    )
  })

  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRegistros.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRegistros.length / recordsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchFilter])

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))
  }

  useEffect(() => {
    if (!idSabana) return

    const controller = new AbortController()

    const fetchData = async () => {
      try {
        const res = await fetch(`http://192.168.100.92:8000/jobs/registros/${idSabana}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`Error ${res.status}`)
        }
        const data = await res.json()
        setRegistros(Array.isArray(data) ? data : [])
      } catch (error) {
        if (error.name !== "AbortError") setError(error.message)
      }
    }
    fetchData()
    return () => controller.abort()
  }, [idSabana])

  const handleButtonClick = (buttonType) => {
    setActiveButton(buttonType)
    console.log(`Botón clickeado: ${buttonType}`)
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getVisiblePages = () => {
    const maxVisible = 3
    const pages = []

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than or equal to maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show current page and surrounding pages
      let start = Math.max(1, currentPage - 1)
      const end = Math.min(totalPages, start + maxVisible - 1)

      // Adjust start if we're near the end
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1)
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  return (
    // Removed the collapsed class from sabana-main-container as it's handled by sabana-info-wrapper
    <div className="sabana-main-container">
      <div className="sabana-title-section">
        <div className="title-content">
          <h2>Gestión de Sabana</h2>
        </div>
      </div>

      <div className="sabana-grid-layout">
        <div className="section-left">
          <div className="section-header">
            <h3>Filtro de Sabana</h3>
          </div>

          <div className="filtros-wrapper-card">
            <div className="filtros-header">
              <h4>
                <FontAwesomeIcon icon={faFilter} /> Filtrar Archivos
              </h4>
            </div>
            <div className="filtros-body">
              <div className="checkbox-section">
                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.ubicacion}
                    onChange={(e) => handleFilterChange("ubicacion", e.target.checked)}
                  />
                  <span>Buscar coincidencias de ubicación</span>
                </label>

                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.contactos}
                    onChange={(e) => handleFilterChange("contactos", e.target.checked)}
                  />
                  <span>Buscar coincidencias de contactos</span>
                </label>

                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.ciudades}
                    onChange={(e) => handleFilterChange("ciudades", e.target.checked)}
                  />
                  <span>Buscar localización en ciudades</span>
                </label>

                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.puntosInteres}
                    onChange={(e) => handleFilterChange("puntosInteres", e.target.checked)}
                  />
                  <span>Buscar cercanía en puntos de interés</span>
                </label>
              </div>

              <div className="datetime-section">
                <div className="date-row">
                  <div className="input-field">
                    <label htmlFor="fecha-inicio">Fecha Inicio:</label>
                    <input
                      id="fecha-inicio"
                      type="date"
                      value={filters.fechaInicio}
                      onChange={(e) => handleFilterChange("fechaInicio", e.target.value)}
                      className="date-field"
                    />
                  </div>

                  <div className="input-field">
                    <label htmlFor="fecha-fin">Fecha Fin:</label>
                    <input
                      id="fecha-fin"
                      type="date"
                      value={filters.fechaFin}
                      onChange={(e) => handleFilterChange("fechaFin", e.target.value)}
                      className="date-field"
                    />
                  </div>
                </div>

                <div className="time-row">
                  <div className="input-field">
                    <label htmlFor="hora-inicio">Hora Inicio:</label>
                    <input
                      id="hora-inicio"
                      type="time"
                      value={filters.horaInicio}
                      onChange={(e) => handleFilterChange("horaInicio", e.target.value)}
                      className="time-field"
                    />
                  </div>

                  <div className="input-field">
                    <label htmlFor="hora-fin">Hora Fin:</label>
                    <input
                      id="hora-fin"
                      type="time"
                      value={filters.horaFin}
                      onChange={(e) => handleFilterChange("horaFin", e.target.value)}
                      className="time-field"
                    />
                  </div>
                </div>
              </div>

              <div className="buttons-section">
                <button
                  className={`info-action-btn ${activeButton === "info" ? "active" : ""}`}
                  onClick={() => handleButtonClick("info")}
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>Información General</span>
                </button>

                <button
                  className={`info-action-btn ${activeButton === "network" ? "active" : ""}`}
                  onClick={() => handleButtonClick("network")}
                >
                  <FontAwesomeIcon icon={faProjectDiagram} />
                  <span>Red de Vínculos</span>
                </button>

                <button
                  className={`info-action-btn ${activeButton === "map" ? "active" : ""}`}
                  onClick={() => handleButtonClick("map")}
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span>Ubicación en mapa</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="section-right">
          <div className="section-header">
            <h3>Detalles de Sabana</h3>
          </div>
          <div className="content-display-area">
            {error && (
              <div className="error-message">
                <p>Error: {error}</p>
              </div>
            )}

            {registros.length === 0 && !error ? (
              <div className="placeholder-text">
                <p>No hay registros disponibles</p>
                <p>ID Sabana: {idSabana || "No especificado"}</p>
              </div>
            ) : (
              <div className="registros-container">
                <div className="registros-header">
                  <h4>Registros Telefónicos ({filteredRegistros.length} total)</h4>
                  {registros.length > 0 && (
                    <div className="imei-info">
                      <strong>IMEI:</strong> {registros[0].imei}
                    </div>
                  )}
                  <div className="pagination-info">
                    Página {currentPage} de {totalPages} - Mostrando {currentRecords.length} de{" "}
                    {filteredRegistros.length} registros
                  </div>
                </div>

                <div className="search-filter">
                  <input
                    type="text"
                    placeholder="Buscar por número o tipo..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="table-container">
                  <table className="registros-table">
                    <thead>
                      <tr>
                        <th>Número A</th>
                        <th>Número B</th>
                        <th>Tipo</th>
                        <th>Fecha/Hora</th>
                        <th>Duración</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.map((registro) => (
                        <tr key={registro.id_registro_telefonico}>
                          <td>{registro.numero_a}</td>
                          <td>{registro.numero_b}</td>
                          <td>
                            <span className={getTypeBadgeClass(registro.id_tipo_registro)}>
                              {getTypeText(registro.id_tipo_registro)}
                            </span>
                          </td>
                          <td>{formatDate(registro.fecha_hora)}</td>
                          <td>{formatDuration(registro.duracion)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="pagination-btn">
                      Anterior
                    </button>

                    <div className="pagination-numbers">
                      {getVisiblePages().map((pageNumber) => (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`pagination-btn ${currentPage === pageNumber ? "active" : ""}`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="pagination-btn">
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

Informacion3_Sabana.propTypes = {
  activeView: PropTypes.string.isRequired,
}

GestionSabanaView.propTypes = {
  // isSidebarCollapsed: PropTypes.bool, // Removed propType as prop is no longer passed
}

export default Informacion3_Sabana
