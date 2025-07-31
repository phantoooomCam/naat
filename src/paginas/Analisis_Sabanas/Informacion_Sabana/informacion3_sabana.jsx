"use client"

import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFilter, faInfoCircle, faProjectDiagram, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons"
import "./informacion_sabana.css"

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
    gestion: <GestionSabanaView isSidebarCollapsed={isSidebarCollapsed} />,
  }

  return (
    <div className={`sabana-info-wrapper ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">{views[activeView] || views.gestion}</div>
    </div>
  )
}

const GestionSabanaView = ({ isSidebarCollapsed }) => {
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

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))
  }

  const handleButtonClick = (buttonType) => {
    setActiveButton(buttonType)
    console.log(`Botón clickeado: ${buttonType}`)
  }

  return (
    <div className={`sabana-main-container ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="sabana-title-section">
        <div className="title-content">
          <h2>Gestión de Sabana</h2>
        </div>
      </div>

      <div className="sabana-grid-layout">
        <div className="section-left">
          <div className="section-header">
            <h3>Section 1</h3>
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
            <h3>Section 2</h3>
          </div>
          <div className="content-display-area">
            <div className="placeholder-text">
              <p>Contenido de la sección 2</p>
              <p>Aquí se mostrará la información según la selección</p>
            </div>
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
  isSidebarCollapsed: PropTypes.bool,
}

export default Informacion3_Sabana
