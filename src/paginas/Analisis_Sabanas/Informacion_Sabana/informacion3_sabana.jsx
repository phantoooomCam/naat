"use client";

import { useState, useEffect, useMemo } from "react";
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
import MapAntenas from "../../../componentes/MapAntenas.jsx";
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
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="content-wrapper">
        {views[activeView] || views.gestion}
      </div>
    </div>
  );
};

const GestionSabanaView = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState("fecha_hora:desc");
  const [loading, setLoading] = useState(false);

  const [todosLosRegistros, setTodosLosRegistros] = useState([]);

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

  const [filtrosMapaAntenas, setFiltrosMapaAntenas] = useState({
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
  });

  const [filtrosMapaAplicados, setFiltrosMapaAplicados] = useState({
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
  });

  const [filtrosRedVinculos, setFiltrosRedVinculos] = useState({
    0: true, // Datos
    1: true, // MensajeriaMultimedia
    2: true, // Mensaje2ViasEnt
    3: true, // Mensaje2ViasSal
    4: true, // VozEntrante
    5: true, // VozSaliente
    6: false, // VozTransfer
    7: false, // VozTransito
    8: false, // Ninguno
    9: false, // Wifi
    10: false, // ReenvioSal
    11: false, // ReenvioEnt
  });

  const [activeButton, setActiveButton] = useState("info");

  const location = useLocation();
  const idSabana = location.state?.idSabana || null;
  const [error, setError] = useState("");

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleMapFilterChange = (filterName, value) => {
    setFiltrosMapaAntenas((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const aplicarFiltrosMapa = () => {
    setFiltrosMapaAplicados({ ...filtrosMapaAntenas });
  };

  const handleFiltroRedChange = (tipoId, checked) => {
    setFiltrosRedVinculos((prev) => ({
      ...prev,
      [tipoId]: checked,
    }));
  };

  const toggleTodosFiltrosRed = (seleccionar) => {
    const nuevosFiltros = {};
    Object.keys(filtrosRedVinculos).forEach((key) => {
      nuevosFiltros[key] = seleccionar;
    });
    setFiltrosRedVinculos(nuevosFiltros);
  };

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
    };
    return typeMap?.[typeId] ?? `Tipo ${typeId}`;
  };

  const getTypeIcon = (typeId) => {
    const iconMap = {
      // Datos
      0: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2z" />
        </svg>
      ),
      // MensajeriaMultimedia
      1: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      ),
      // Mensaje2ViasEnt
      2: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48L12 17l7.15-4.05L20 11.47 12 7.53 4 11.47z" />
        </svg>
      ),
      // Mensaje2ViasSal
      3: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48L12 17l7.15-4.05L20 11.47 12 7.53 4 11.47z" />
        </svg>
      ),
      // VozEntrante
      4: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          <path d="M19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7z" />
          <path d="M15 12h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
        </svg>
      ),
      // VozSaliente
      5: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      ),
    };
    return (
      iconMap?.[typeId] ?? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      )
    );
  };

  const getTypeColor = (typeId) => {
    const colorMap = {
      0: "#3498db",
      1: "#9b59b6",
      2: "#2ecc71",
      3: "#27ae60",
      4: "#e74c3c",
      5: "#c0392b",
      6: "#f39c12",
      7: "#d35400",
      8: "#95a5a6",
      9: "#1abc9c",
      10: "#8e44ad",
      11: "#2c3e50",
    };
    return colorMap?.[typeId] ?? "#7f8c8d";
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

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError("");

        const API_URL = "/api";

        // Normaliza: permite 1 o varios ids (e.g., 1, "1", [1], ["1", "2"])
        const ids = (Array.isArray(idSabana) ? idSabana : [idSabana])
          .filter((v) => v !== null && v !== undefined)
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n));

        if (ids.length === 0) {
          setTodosLosRegistros([]);
          return;
        }

        let url;
        if (ids.length > 1) {
          // Endpoint batch
          const qs = new URLSearchParams();
          ids.forEach((id) => qs.append("ids", String(id)));
          if (sort) qs.set("sort", String(sort));
          url = `${API_URL}/sabanas/registros/batch?${qs.toString()}`;
        } else {
          // Endpoint single
          const qs = new URLSearchParams();
          if (sort) qs.set("sort", String(sort));
          const tail = qs.toString();
          url = `${API_URL}/sabanas/${ids[0]}/registros${
            tail ? `?${tail}` : ""
          }`;
        }

        const res = await fetchWithAuth(url, {
          method: "GET",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        });

        if (!res) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : data.Items ?? [];

        const mappedItems = items.map(mapToSnake);
        setTodosLosRegistros(mappedItems);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Fetch de registros abortado (normal en desarrollo).");
          return;
        }
        console.error("Error al cargar registros:", err);
        setError(err?.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    return () => controller.abort();
  }, [idSabana, sort]);

  const registrosFiltrados = useMemo(() => {
    let filtered = [...todosLosRegistros];

    // Filtrar por rango de fechas
    if (filters.fechaInicio || filters.fechaFin) {
      filtered = filtered.filter((registro) => {
        if (!registro.fecha_hora) return false;

        // Extraer solo la fecha (YYYY-MM-DD) del campo fecha_hora
        const fechaRegistro = registro.fecha_hora.split(" ")[0];

        // Comparar con fecha inicio
        if (filters.fechaInicio && fechaRegistro < filters.fechaInicio) {
          return false;
        }

        // Comparar con fecha fin
        if (filters.fechaFin && fechaRegistro > filters.fechaFin) {
          return false;
        }

        return true;
      });
    }

    // Filtrar por rango de horas
    if (filters.horaInicio || filters.horaFin) {
      filtered = filtered.filter((registro) => {
        if (!registro.fecha_hora) return false;

        // Extraer solo la hora (HH:MM:SS) del campo fecha_hora
        const horaRegistro = registro.fecha_hora.split(" ")[1]?.substring(0, 5); // HH:MM

        if (!horaRegistro) return false;

        // Comparar con hora inicio
        if (filters.horaInicio && horaRegistro < filters.horaInicio) {
          return false;
        }

        // Comparar con hora fin
        if (filters.horaFin && horaRegistro > filters.horaFin) {
          return false;
        }

        return true;
      });
    }

    return filtered;
  }, [
    todosLosRegistros,
    filters.fechaInicio,
    filters.fechaFin,
    filters.horaInicio,
    filters.horaFin,
  ]);

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

    if (registrosFiltrados.length === 0 && !loading) {
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
            registros={registrosFiltrados}
            total={registrosFiltrados.length}
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
        return (
          <RedVinculos
            idSabana={idSabana}
            filtrosActivos={filtrosRedVinculos}
          />
        );

      case "map":
        return (
          <MapAntenas idSabana={idSabana} filtros={filtrosMapaAplicados} />
        );

      default:
        return (
          <TablaRegistros
            registros={registrosFiltrados}
            total={registrosFiltrados.length}
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
        <div className="section-left-sabana">
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
              {activeButton === "map" ? (
                <div className="filtros-panel-mapa">
                  <h5>
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      style={{ marginRight: "8px" }}
                    />
                    Filtrar por Fecha y Hora
                  </h5>
                  <div className="datetime-section">
                    <div className="date-row">
                      <div className="input-field">
                        <label htmlFor="mapa-fecha-inicio">Fecha Inicio:</label>
                        <input
                          id="mapa-fecha-inicio"
                          type="date"
                          value={filtrosMapaAntenas.fechaInicio}
                          onChange={(e) =>
                            handleMapFilterChange("fechaInicio", e.target.value)
                          }
                          className="date-field"
                        />
                      </div>

                      <div className="input-field">
                        <label htmlFor="mapa-fecha-fin">Fecha Fin:</label>
                        <input
                          id="mapa-fecha-fin"
                          type="date"
                          value={filtrosMapaAntenas.fechaFin}
                          onChange={(e) =>
                            handleMapFilterChange("fechaFin", e.target.value)
                          }
                          className="date-field"
                        />
                      </div>
                    </div>

                    <div className="time-row">
                      <div className="input-field">
                        <label htmlFor="mapa-hora-inicio">Hora Inicio:</label>
                        <input
                          id="mapa-hora-inicio"
                          type="time"
                          value={filtrosMapaAntenas.horaInicio}
                          onChange={(e) =>
                            handleMapFilterChange("horaInicio", e.target.value)
                          }
                          className="time-field"
                        />
                      </div>

                      <div className="input-field">
                        <label htmlFor="mapa-hora-fin">Hora Fin:</label>
                        <input
                          id="mapa-hora-fin"
                          type="time"
                          value={filtrosMapaAntenas.horaFin}
                          onChange={(e) =>
                            handleMapFilterChange("horaFin", e.target.value)
                          }
                          className="time-field"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "16px" }}>
                      <button
                        className="info-action-btn"
                        onClick={aplicarFiltrosMapa}
                        style={{
                          width: "100%",
                          backgroundColor: "#10b981",
                          padding: "10px",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faFilter}
                          style={{ marginRight: "8px" }}
                        />
                        Aplicar Filtros
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeButton === "network" ? (
                <div className="checkbox-section">
                  <h5
                    className="mb-4"
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Filtrar por tipo de comunicación:
                  </h5>
                  <div
                    className="mb-5"
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <button
                      onClick={() => toggleTodosFiltrosRed(true)}
                      className="info-action-btn"
                      style={{
                        padding: "8px 12px",
                        fontSize: "0.8rem",
                        flex: "1",
                        minWidth: "120px",
                      }}
                    >
                      Seleccionar Todos
                    </button>
                    <button
                      onClick={() => toggleTodosFiltrosRed(false)}
                      className="info-action-btn"
                      style={{
                        padding: "8px 12px",
                        fontSize: "0.8rem",
                        backgroundColor: "#6b7280",
                        flex: "1",
                        minWidth: "120px",
                      }}
                    >
                      Deseleccionar Todos
                    </button>
                  </div>
                  <div className="checkbox-section">
                    {Object.entries(filtrosRedVinculos).map(
                      ([tipoId, activo]) => (
                        <label key={tipoId} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={activo}
                            onChange={(e) =>
                              handleFiltroRedChange(tipoId, e.target.checked)
                            }
                          />
                          <span
                            style={{
                              marginRight: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            {getTypeIcon(Number(tipoId))}
                          </span>
                          <span>{getTypeText(Number(tipoId))}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}

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
