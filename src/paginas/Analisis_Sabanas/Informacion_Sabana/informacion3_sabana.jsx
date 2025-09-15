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

/* ===========================
   Helper: resolver idSabana por idCaso
   =========================== */
// ✅ Único endpoint que consultamos: /api/casos/:id
async function resolveSabanaIdByCaso(idCaso) {
  try {
    const res = await fetchWithAuth(`/api/casos/${idCaso}`);
    if (!res?.ok) return null;
    const raw = await res.json();

    // Normaliza posibles campos donde venga la relación de sábanas/ids
    const collectIds = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((s) => s?.idSabana ?? s?.id_sabana ?? s?.id ?? s?.Id ?? null)
        .filter(Boolean);
    };

    // 1) arrays típicos
    let ids =
      collectIds(raw?.sabanas) ||
      collectIds(raw?.Sabanas) ||
      collectIds(raw?.ids_sabanas) ||
      collectIds(raw?.idsSabanas);

    // 2) simple: id en campo suelto
    if ((!ids || ids.length === 0) && raw?.idSabana) ids = [raw.idSabana];

    return Array.isArray(ids) && ids.length ? ids[0] : null;
  } catch {
    return null;
  }
}

const Informacion3_Sabana = ({ activeView }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ======= ESTADOS / FILTROS (tu código existente) =======
  const [filters, setFilters] = useState({
    voz: false,
    mensajes: false,
    datos: false,
    mensaje2ViasEnt: false,
    mensaje2ViasSal: false,
    vozEntrante: false,
    vozSaliente: false,
    vozTransito: false,
    ningunFiltro: false,
    wifi: false,
    reenvioSal: false,
    reenvioEnt: false,
    ubicacion: false,
    contactos: false,
    ciudades: false,
    puntosInteres: false,
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
    6: true, // VozTransito
    7: true, // Ninguno
    8: true, // Wifi
    9: true, // ReenvioSal
    10: true, // ReenvioEnt
    11: true, // ??? (si lo usas)
  });

  const [activeButton, setActiveButton] = useState("info");

  // ======= AQUÍ ESTÁ EL CAMBIO CLAVE =======
  const location = useLocation();
  const { idSabana: idSabanaFromState, idCaso } = location.state ?? {};
  const [idSabana, setIdSabana] = useState(idSabanaFromState ?? null);

  const [registros, setRegistros] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState("fechaHora_desc");
  const [total, setTotal] = useState(0);

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowsAction, setSelectedRowsAction] = useState(null);

  const [showSidebarContent, setShowSidebarContent] = useState(false);

  const [mapCenter, setMapCenter] = useState({
    lat: 19.432608,
    lng: -99.133209,
  }); // CDMX default
  const [mapZoom, setMapZoom] = useState(10);

  const typeLabels = {
    0: "Datos",
    1: "Mensajería Multimedia",
    2: "Mensaje 2 Vías Entrante",
    3: "Mensaje 2 Vías Saliente",
    4: "Voz Entrante",
    5: "Voz Saliente",
    6: "Voz Tránsito",
    7: "Ninguno",
    8: "Wifi",
    9: "Reenvío Salida",
    10: "Reenvío Entrada",
    11: "Otro",
  };

  const typeIcons = {
    0: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v2H3zm2 6h14v2H5zm-2 6h18v2H3z" />
      </svg>
    ),
    1: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    2: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48L12 17l7.15-4.05L20 11.47 12 7.53 4 11.47z" />
      </svg>
    ),
    3: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48L12 17l7.15-4.05L20 11.47 12 7.53 4 11.47z" />
      </svg>
    ),
    4: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2.73a1 1 0 0 0 1.02-.25l2.2-2.2a1 1 0 0 0 .25-1.02 16.79 16.79 0 0 0-.57-3.57 1 1 0 0 0-1.25-.2l-2.49 1a12.05 12.05 0 0 1-4.5-4.5l1-2.49a1 1 0 0 0-.2-1.25 16.79 16.79 0 0 0-3.57-.57 1 1 0 0 0-1.02.25l-2.2 2.2a1 1 0 0 0-.25 1.02l.73 2.2z" />
        <path d="M19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7z" />
        <path d="M15 12h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
      </svg>
    ),
    5: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2.73a1 1 0 0 0 1.02-.25l2.2-2.2a1 1 0 0 0 .25-1.02 16.79 16.79 0 0 0-.57-3.57 1 1 0 0 0-1.25-.2l-2.49 1a12.05 12.05 0 0 1-4.5-4.5l1-2.49a1 1 0 0 0-.2-1.25 16.79 16.79 0 0 0-3.57-.57 1 1 0 0 0-1.02.25l-2.2 2.2a1 1 0 0 0-.25 1.02l.73 2.2z" />
        <path d="M19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7z" />
        <path d="M15 12h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
      </svg>
    ),
    6: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l10-5v11l-10 5-10-5V6l10 5z" />
      </svg>
    ),
    7: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
      </svg>
    ),
    8: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-14a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" />
      </svg>
    ),
    9: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h16v2H4zm0 7h16v2H4zm0 7h16v2H4z" />
      </svg>
    ),
    10: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h16v2H4zm0 7h16v2H4zm0 7h16v2H4z" />
      </svg>
    ),
    11: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
  };

  const typeColors = (typeId) => {
    const colorMap = {
      0: "#3498db",
      1: "#9b59b6",
      2: "#2ecc71",
      3: "#27ae60",
      4: "#e67e22",
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

  /* ======= Sticky sidebar listener ======= */
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

  /* ======= Resolver idSabana automáticamente si vienes con idCaso ======= */
  useEffect(() => {
    if (idSabana || !idCaso) return;
    let alive = true;
    (async () => {
      const resolved = await resolveSabanaIdByCaso(idCaso);
      if (!alive) return;
      if (resolved != null) {
        setIdSabana(resolved);
        setError(""); // si usas estado de error
      } else {
        setError("No se encontró una sábana asociada a este caso.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [idCaso, idSabana]);

  /* ======= Carga de registros por idSabana (como ya lo tenías) ======= */
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

        const body = {
          filtros: {
            voz: filters.voz,
            mensajes: filters.mensajes,
            datos: filters.datos,
            mensaje2ViasEnt: filters.mensaje2ViasEnt,
            mensaje2ViasSal: filters.mensaje2ViasSal,
            vozEntrante: filters.vozEntrante,
            vozSaliente: filters.vozSaliente,
            vozTransito: filters.vozTransito,
            ningunFiltro: filters.ningunFiltro,
            wifi: filters.wifi,
            reenvioSal: filters.reenvioSal,
            reenvioEnt: filters.reenvioEnt,
            ubicacion: filters.ubicacion,
            contactos: filters.contactos,
            ciudades: filters.ciudades,
            puntosInteres: filters.puntosInteres,
            rangoFecha: {
              inicio: filters.fechaInicio || null,
              fin: filters.fechaFin || null,
              horaInicio: filters.horaInicio || null,
              horaFin: filters.horaFin || null,
            },
          },
        };

        const res = await fetchWithAuth(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res || !res.ok)
          throw new Error("No se pudieron obtener los registros");

        const json = await res.json();
        const mapped = (json?.items ?? json?.Items ?? json ?? []).map(
          mapToSnake
        );

        setRegistros(mapped);
        setTotal(json?.total ?? json?.Total ?? mapped.length);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Error al cargar registros");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
    return () => controller.abort();
  }, [idSabana, page, pageSize, sort, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleFiltroRedChange = (tipoId, checked) => {
    setFiltrosRedVinculos((prev) => ({
      ...prev,
      [tipoId]: checked,
    }));
  };

  const onMapMove = (center, zoom) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  const GestionSabanaView = () => {
    const renderContent = () => {
      if (loading) {
        return (
          <div className="placeholder-text">
            <p>Cargando registros…</p>
            <p>
              ID Sabana: {idSabana || "No especificado"}
              {location.state?.idCaso
                ? ` (Caso #${location.state.idCaso})`
                : ""}
            </p>
          </div>
        );
      }

      if (error) {
        return (
          <div className="placeholder-text error">
            <p>{error}</p>
            <p>
              ID Sabana: {idSabana || "No especificado"}
              {location.state?.idCaso
                ? ` (Caso #${location.state.idCaso})`
                : ""}
            </p>
          </div>
        );
      }

      if (registros.length === 0) {
        return (
          <div className="placeholder-text">
            <p>No hay registros disponibles</p>
            <p>
              ID Sabana: {idSabana || "No especificado"}
              {location.state?.idCaso
                ? ` (Caso #${location.state.idCaso})`
                : ""}
            </p>
          </div>
        );
      }

      switch (activeButton) {
        case "info":
          return (
            <TablaRegistros
              rows={registros}
              total={total}
              page={page}
              pageSize={pageSize}
              sort={sort}
              setPage={setPage}
              setPageSize={setPageSize}
              setSort={setSort}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              action={selectedRowsAction}
              setAction={setSelectedRowsAction}
            />
          );
        case "vinculos":
          return (
            <div className="vinculos-wrapper">
              <div className="vinculos-toolbar">
                <div className="filters-section">
                  <FontAwesomeIcon icon={faFilter} />
                  <span>Filtros de vínculos</span>
                </div>
              </div>
              <RedVinculos
                registros={registros}
                typeLabels={typeLabels}
                typeIcons={typeIcons}
                typeColors={typeColors}
                filters={filtrosRedVinculos}
              />
            </div>
          );
        case "mapa":
          return (
            <div className="mapa-wrapper">
              <div className="mapa-toolbar">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span>Mapa de ubicaciones</span>
              </div>
              <div className="map-placeholder">
                {/* Aquí iría tu componente de mapa si lo tienes listo */}
                <p>Mapa próximamente…</p>
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="sabana-view">
        <div className="sabana-header">
          <div className="sabana-tabs">
            <button
              className={`tab-btn ${activeButton === "info" ? "active" : ""}`}
              onClick={() => setActiveButton("info")}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>Información</span>
            </button>
            <button
              className={`tab-btn ${
                activeButton === "vinculos" ? "active" : ""
              }`}
              onClick={() => setActiveButton("vinculos")}
            >
              <FontAwesomeIcon icon={faProjectDiagram} />
              <span>Red de vínculos</span>
            </button>
            <button
              className={`tab-btn ${activeButton === "mapa" ? "active" : ""}`}
              onClick={() => setActiveButton("mapa")}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>Mapa</span>
            </button>
          </div>
        </div>

        <div className="sabana-content-grid">
          {/* Sidebar de filtros */}
          <aside
            className={`sabana-sidebar ${showSidebarContent ? "open" : ""}`}
          >
            <div className="sidebar-header">
              <FontAwesomeIcon icon={faFilter} />
              <h4>Filtros</h4>
            </div>

            <div className="filters-group">
              <label>
                <input
                  type="checkbox"
                  checked={filters.voz}
                  onChange={(e) => handleFilterChange("voz", e.target.checked)}
                />
                Voz
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.mensajes}
                  onChange={(e) =>
                    handleFilterChange("mensajes", e.target.checked)
                  }
                />
                Mensajes
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.datos}
                  onChange={(e) =>
                    handleFilterChange("datos", e.target.checked)
                  }
                />
                Datos
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.mensaje2ViasEnt}
                  onChange={(e) =>
                    handleFilterChange("mensaje2ViasEnt", e.target.checked)
                  }
                />
                2 vías (Entrante)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.mensaje2ViasSal}
                  onChange={(e) =>
                    handleFilterChange("mensaje2ViasSal", e.target.checked)
                  }
                />
                2 vías (Saliente)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.vozEntrante}
                  onChange={(e) =>
                    handleFilterChange("vozEntrante", e.target.checked)
                  }
                />
                Voz Entrante
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.vozSaliente}
                  onChange={(e) =>
                    handleFilterChange("vozSaliente", e.target.checked)
                  }
                />
                Voz Saliente
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.vozTransito}
                  onChange={(e) =>
                    handleFilterChange("vozTransito", e.target.checked)
                  }
                />
                Voz Tránsito
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.ningunFiltro}
                  onChange={(e) =>
                    handleFilterChange("ningunFiltro", e.target.checked)
                  }
                />
                Ninguno
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.wifi}
                  onChange={(e) => handleFilterChange("wifi", e.target.checked)}
                />
                Wifi
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.reenvioSal}
                  onChange={(e) =>
                    handleFilterChange("reenvioSal", e.target.checked)
                  }
                />
                Reenvío Salida
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.reenvioEnt}
                  onChange={(e) =>
                    handleFilterChange("reenvioEnt", e.target.checked)
                  }
                />
                Reenvío Entrada
              </label>
            </div>

            <div className="filters-group">
              <div className="date-time-row">
                <div>
                  <label>Fecha inicio</label>
                  <input
                    type="date"
                    value={filters.fechaInicio}
                    onChange={(e) =>
                      handleFilterChange("fechaInicio", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label>Fecha fin</label>
                  <input
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) =>
                      handleFilterChange("fechaFin", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="date-time-row">
                <div>
                  <label>Hora inicio</label>
                  <input
                    type="time"
                    value={filters.horaInicio}
                    onChange={(e) =>
                      handleFilterChange("horaInicio", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label>Hora fin</label>
                  <input
                    type="time"
                    value={filters.horaFin}
                    onChange={(e) =>
                      handleFilterChange("horaFin", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Zona de contenido principal */}
          <div className="sabana-content">
            <div className="sabana-content-header">
              <h3>Detalles de Sabana</h3>
            </div>
            <div className="content-display-area">{renderContent()}</div>
          </div>
        </div>
      </div>
    );
  };

  const views = {
    gestion: <GestionSabanaView />,
  };

  return (
    <div
      className={`sabana-info-wrapper ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <main className="sabana-info-content">{views[activeView]}</main>
    </div>
  );
};

Informacion3_Sabana.propTypes = {
  activeView: PropTypes.string.isRequired,
};

export default Informacion3_Sabana;
