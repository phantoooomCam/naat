"use client";
import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFilter,
  faClipboardList,
  faFile,
  faFolderOpen,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import "./ListadoSabanas.css";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

// Si ya usas fetchWithAuth en el proyecto, descomenta y corrige la ruta.
// import fetchWithAuth from "../../../../utils/fetchWithAuth"

const ListadoSabanas = ({ activeView, idCaso: idCasoProp }) => {
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
    listados: <Listado idCaso={idCasoProp} />,
  };

  return (
    <div
      className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <div className="content-wrapper">{views[activeView] || views.listados}</div>
    </div>
  );
};

const Listado = ({ idCaso: idCasoProp }) => {
  const { idCaso: idCasoParam } = useParams();

  const [sabanas, setSabanas] = useState([]);
  const [selectedSabana, setSelectedSabana] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    procesado: false,
    pendiente: false,
    error: false,
  });
  const location = useLocation();
  const idCaso = location.state?.idCaso;
  const navigate = useNavigate();

  // Elegir fetcher (usa fetchWithAuth si está disponible, si no window.fetch)
  const doFetch = async (url, init) => {
    if (typeof fetchWithAuth === "function") {
      return fetchWithAuth(url, { method: "GET", ...(init || {}) });
    }
    return fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      ...(init || {}),
    });
  };

  useEffect(() => {
    if (!idCaso) {
      setError("No se proporcionó idCaso para consultar archivos.");
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await doFetch(
          `/api/sabanas/archivos/por-caso/${encodeURIComponent(idCaso)}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) {
          let detail = "";
          try {
            const data = await res.json();
            detail = data?.mensaje || JSON.stringify(data);
          } catch {
            /* ignore */
          }
          throw new Error(
            `HTTP ${res.status} ${res.statusText}${
              detail ? ` — ${detail}` : ""
            }`
          );
        }
        const data = await res.json();
        // Esperado:
        // [
        //   {
        //     "idArchivo": 105,
        //     "ruta": "ftp/upload/3335547293/3335547293 Altan.xlsx",
        //     "estado": "procesado",
        //     "nombreArchivo": "3335547293 Altan.xlsx",
        //     "departamento": "Desarrollo de Software",
        //     "area": "Tecnologia",
        //     "organizacion": "RyR"
        //   }
        // ]
        setSabanas(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error al cargar sábanas:", err);
          setError(err.message || "Error desconocido al cargar sábanas");
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [idCaso]);

  const filteredSabanas = sabanas.filter((sabana) => {
    if (
      searchTerm &&
      !sabana?.nombreArchivo
        ?.toLowerCase?.()
        .includes(searchTerm.toLowerCase()) &&
      !sabana?.estado?.toLowerCase?.().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    if (!filters.procesado && !filters.pendiente && !filters.error) {
      return true;
    }
    if (filters.procesado && sabana.estado === "procesado") return true;
    if (filters.pendiente && sabana.estado === "pendiente") return true;
    if (filters.error && sabana.estado === "error") return true;

    return false;
  });

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case "procesado":
        return "estado-procesado";
      case "subido":
        return "estado-pendiente";
      case "error":
        return "estado-error";
      default:
        return "";
    }
  };

  const handleVerSabana = (sabana) => {
    if (!sabana?.idArchivo) return;
    navigate("/procesamiento_sabana", {
      state: { idSabana: sabana.idArchivo },
    });
  };

  return (
    <div className="listado-sabanas-container">
      <div className="sabanas-header">
        <div className="header-content">
          <h2>Listado de Sábanas</h2>
          <p>Gestiona y visualiza todas las sábanas del caso</p>
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

      <div className="dashboard-grid">
        {/* Filtros */}
        <div className="filtros-card">
          <div className="card-header">
            <h3>
              <FontAwesomeIcon icon={faFilter} /> Filtros
            </h3>
          </div>
          <div className="filtros-content">
            <div className="filter-group-horizontal">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.procesado}
                  onChange={() =>
                    handleFilterChange("procesado", !filters.procesado)
                  }
                />
                <span>Procesadas</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.pendiente}
                  onChange={() =>
                    handleFilterChange("pendiente", !filters.pendiente)
                  }
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

        {/* Lista principal */}
        <div className="sabanas-card-main">
          <div className="card-header">
            <h3>
              <FontAwesomeIcon icon={faClipboardList} /> Sábanas
            </h3>
            <span className="sabana-count">
              {filteredSabanas.length} sábanas
            </span>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
              <p>Cargando sábanas...</p>
            </div>
          ) : error ? (
            <div className="empty-sabanas">
              <FontAwesomeIcon icon={faFolderOpen} className="empty-icon" />
              <p>Error: {error}</p>
            </div>
          ) : filteredSabanas.length > 0 ? (
            <div className="sabanas-grid-container">
              {filteredSabanas.map((sabana) => (
                <div
                  key={sabana.idArchivo}
                  className={`sabana-card ${
                    selectedSabana?.idArchivo === sabana.idArchivo
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedSabana(sabana)}
                >
                  <div className="sabana-card-header">
                    <div className="sabana-id">#{sabana.idArchivo}</div>
                    <span
                      className={`estado-badge ${getEstadoClass(
                        sabana.estado
                      )}`}
                    >
                      {sabana.estado}
                    </span>
                  </div>

                  <div className="sabana-card-body">
                    <div className="archivo-info">
                      <FontAwesomeIcon icon={faFile} className="archivo-icon" />
                      <h4 className="archivo-nombre">{sabana.nombreArchivo}</h4>
                    </div>

                    <div className="sabana-meta">
                      <p className="departamento">{sabana.departamento}</p>
                      <p className="organizacion">{sabana.organizacion}</p>
                    </div>
                  </div>

                  <div className="sabana-card-footer">
                    <button
                      className="ver-sabana-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerSabana(sabana);
                      }}
                    >
                      <FontAwesomeIcon icon={faFolderOpen} />
                      Ver Sábana
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-sabanas">
              <FontAwesomeIcon icon={faFolderOpen} className="empty-icon" />
              <p>No hay sábanas disponibles</p>
            </div>
          )}
        </div>

        {/* Panel lateral de detalles */}
        <div className="detalles-card-sidebar">
          <div className="card-header">
            <h3>
              <FontAwesomeIcon icon={faFile} /> Detalles
            </h3>
          </div>
          <div className="detalles-content">
            {selectedSabana ? (
              <div className="selected-sabana-preview">
                <div className="sabana-preview-header">
                  <FontAwesomeIcon
                    icon={faFile}
                    className="sabana-preview-icon"
                  />
                  <h4>{selectedSabana.nombreArchivo}</h4>
                </div>

                <div className="sabana-preview-body">
                  <div className="sabana-details-grid">
                    <div className="detail-row">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value">
                        {selectedSabana.idArchivo}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Estado:</span>
                      <span className="detail-value">
                        <span
                          className={`estado-badge ${getEstadoClass(
                            selectedSabana.estado
                          )}`}
                        >
                          {selectedSabana.estado}
                        </span>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Depto:</span>
                      <span className="detail-value">
                        {selectedSabana.departamento}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Área:</span>
                      <span className="detail-value">
                        {selectedSabana.area}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Org:</span>
                      <span className="detail-value">
                        {selectedSabana.organizacion}
                      </span>
                    </div>
                  </div>
                  <button
                    className="view-details-button"
                    onClick={() => handleVerSabana(selectedSabana)}
                  >
                    <FontAwesomeIcon icon={faFolderOpen} />
                    <span>Ver Sábana</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <FontAwesomeIcon icon={faFile} className="no-sabana-icon" />
                <p>Selecciona una sábana para ver detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ListadoSabanas.propTypes = {
  activeView: PropTypes.string.isRequired,
  idCaso: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Listado.propTypes = {
  idCaso: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ListadoSabanas;
