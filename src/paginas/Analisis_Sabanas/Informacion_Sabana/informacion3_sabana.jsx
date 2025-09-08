"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faInfoCircle,
  faProjectDiagram,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./informacion_sabana.css";
import { useLocation } from "react-router-dom";
import TablaRegistros from "../../../componentes/TablaRegistros.jsx";
import RedVinculos from "../../../componentes/RedVinculos.jsx";
import "../../../componentes/RedVinculos.css";
import fetchWithAuth from "../../../utils/fetchWithAuth.js";

const Informacion3_Sabana = ({ activeView }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"));
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const views = {
    gestion: <GestionSabanaView />,
  };

  return (
    <div
      className={`sabana-info-wrapper ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <div className="container">{views[activeView] || views.gestion}</div>
    </div>
  );
};

const GestionSabanaView = () => {
  // nuevo estado para server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState("fecha_hora:desc");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    ubicacion: false,
    contactos: false,
    ciudades: false,
    puntosInteres: false,
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
  });

  const [activeButton, setActiveButton] = useState("info");

  const location = useLocation();
  const idSabana = location.state?.idSabana || null;
  const [registros, setRegistros] = useState([]);
  const [error, setError] = useState("");

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  useEffect(() => {
    if (!idSabana) return;

    const controller = new AbortController();

    const mapToSnake = (r) => ({
      id_registro_telefonico: r.idRegistroTelefonico ?? r.IdRegistroTelefonico,
      id_sabanas: r.idSabanas ?? r.IdSabanas,
      numero_a: r.numeroA ?? r.NumeroA,
      numero_b: r.numeroB ?? r.NumeroB,
      id_tipo_registro: r.idTipoRegistro ?? r.IdTipoRegistro,
      fecha_hora: r.fechaHora ?? r.FechaHora,
      duracion: r.duracion ?? r.Duracion,
      latitud: r.latitud ?? r.Latitud,
      longitud: r.longitud ?? r.Longitud,
      azimuth: r.azimuth ?? r.Azimuth,
      latitud_decimal: r.latitudDecimal ?? r.LatitudDecimal,
      longitud_decimal: r.longitudDecimal ?? r.LongitudDecimal,
      altitud: r.altitud ?? r.Altitud,
      coordenada_objetivo: r.coordenadaObjetivo ?? r.CoordenadaObjetivo,
      imei: r.imei ?? r.Imei,
      telefono: r.telefono ?? r.Telefono,
    });

    const fetchPage = async () => {
      try {
        setLoading(true);
        setError("");

        const API_URL = "/api"; // o tu config
        const url = `${API_URL}/sabanas/${idSabana}/registros?page=${page}&pageSize=${pageSize}&sort=${encodeURIComponent(
          sort
        )}`;

        const res = await fetchWithAuth(url, {
          method: "GET",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        });

        // Si tu helper devuelve Response, deja este check:
        if (!res) return; // nada que hacer si no hubo respuesta
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : data.Items ?? [];
        setRegistros(items.map(mapToSnake));
        setTotal(data.total ?? data.Total ?? 0);
      } catch (err) {
        // 👇 ignorar cancelaciones normales del AbortController
        if (err?.name === "AbortError") return;

        // cualquier otro error sí lo mostramos
        console.error("Error al cargar registros:", err);
        setError(err?.message || "Error desconocido");
      } finally {
        // evita setState si ya fue abortado
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchPage();
    return () => controller.abort();
  }, [idSabana, page, pageSize, sort]);

  const handleButtonClick = (buttonType) => {
    setActiveButton(buttonType);
    console.log(`Botón clickeado: ${buttonType}`);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      );
    }

    if (registros.length === 0) {
      return (
        <div className="placeholder-text">
          <p>No hay registros disponibles</p>
          <p>ID Sabana: {idSabana || "No especificado"}</p>
        </div>
      );
    }

    switch (activeButton) {
      case "info":
        return (
          <TablaRegistros
            registros={registros}
            total={total}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            sort={sort}
            setSort={setSort}
            loading={loading}
            error={error}
          />
        );

      case "network":
        return <RedVinculos idSabana={idSabana} />;

      case "map":
        return (
          <div className="placeholder-text">
            <p>Funcionalidad de mapa en desarrollo</p>
            <p>Próximamente se mostrará la ubicación en el mapa</p>
          </div>
        );
      default:
        return (
          <TablaRegistros
            registros={registros}
            total={total}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            sort={sort}
            setSort={setSort}
            loading={loading}
            error={error}
          />
        );
    }
  };

  return (
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
                    onChange={(e) =>
                      handleFilterChange("ubicacion", e.target.checked)
                    }
                  />
                  <span>Buscar coincidencias de ubicación</span>
                </label>

                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.contactos}
                    onChange={(e) =>
                      handleFilterChange("contactos", e.target.checked)
                    }
                  />
                  <span>Buscar coincidencias de contactos</span>
                </label>

                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.ciudades}
                    onChange={(e) =>
                      handleFilterChange("ciudades", e.target.checked)
                    }
                  />
                  <span>Buscar localización en ciudades</span>
                </label>

                <label className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.puntosInteres}
                    onChange={(e) =>
                      handleFilterChange("puntosInteres", e.target.checked)
                    }
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
                      onChange={(e) =>
                        handleFilterChange("fechaInicio", e.target.value)
                      }
                      className="date-field"
                    />
                  </div>

                  <div className="input-field">
                    <label htmlFor="fecha-fin">Fecha Fin:</label>
                    <input
                      id="fecha-fin"
                      type="date"
                      value={filters.fechaFin}
                      onChange={(e) =>
                        handleFilterChange("fechaFin", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleFilterChange("horaInicio", e.target.value)
                      }
                      className="time-field"
                    />
                  </div>

                  <div className="input-field">
                    <label htmlFor="hora-fin">Hora Fin:</label>
                    <input
                      id="hora-fin"
                      type="time"
                      value={filters.horaFin}
                      onChange={(e) =>
                        handleFilterChange("horaFin", e.target.value)
                      }
                      className="time-field"
                    />
                  </div>
                </div>
              </div>

              <div className="buttons-section">
                <button
                  className={`info-action-btn ${
                    activeButton === "info" ? "active" : ""
                  }`}
                  onClick={() => handleButtonClick("info")}
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>Información General</span>
                </button>

                <button
                  className={`info-action-btn ${
                    activeButton === "network" ? "active" : ""
                  }`}
                  onClick={() => handleButtonClick("network")}
                >
                  <FontAwesomeIcon icon={faProjectDiagram} />
                  <span>Red de Vínculos</span>
                </button>

                <button
                  className={`info-action-btn ${
                    activeButton === "map" ? "active" : ""
                  }`}
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
          <div className="content-display-area">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

Informacion3_Sabana.propTypes = {
  activeView: PropTypes.string.isRequired,
};

export default Informacion3_Sabana;
