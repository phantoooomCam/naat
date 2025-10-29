"use client";

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faInfoCircle,
  faProjectDiagram,
  faMapMarkerAlt,
  faChevronDown,
  faChevronUp,
  faCheckDouble,
  faBroom,
} from "@fortawesome/free-solid-svg-icons";
import { FaMapMarkedAlt } from "react-icons/fa";
import "./informacion_sabana.css";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import TablaRegistros from "../../../componentes/TablaRegistros.jsx";
import RedVinculos from "../../../componentes/RedVinculos.jsx";
import MapAntenas from "../../../componentes/MapAntenas.jsx";
import IntersectionToggleButton from "../../../componentes/IntersectionToggleButton.jsx";
import DebugFilterStatus from "../../../componentes/DebugFilterStatus.jsx";
import "../../../componentes/RedVinculos.css";
import fetchWithAuth from "../../../utils/fetchWithAuth.js";

const Informacion3_Sabana = ({ activeView }) => {
  // ... (código sin cambios)
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
  // ... (estados de page, pageSize, sort, loading, etc. sin cambios)
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

  // MODIFICADO: Estado para los inputs del filtro del mapa
  const [filtrosMapaAntenas, setFiltrosMapaAntenas] = useState({
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
  });

  // MODIFICADO: Estado para los filtros que se pasarán al mapa (en formato ISO)
  const [filtrosMapaAplicados, setFiltrosMapaAplicados] = useState({
    fromDate: null,
    toDate: null,
  });

  // NUEVO: Estado para catálogo de antenas y selección
  const [catalogoAntenas, setCatalogoAntenas] = useState({
    sites: [],
    sectors: [],
    fechas: { min: null, max: null },
  });
  const [loadingAntenas, setLoadingAntenas] = useState(false);
  const [errorAntenas, setErrorAntenas] = useState("");
  const [expandirFiltroAntenas, setExpandirFiltroAntenas] = useState(false);
  const [sitiosSeleccionados, setSitiosSeleccionados] = useState([]); // array de siteId
  const [sabanaSeleccionadaFiltro, setSabanaSeleccionadaFiltro] =
    useState(null); // para filtrar antenas por sabana
  // NUEVO: rank por sitio y estados de carga/errores
  const [rankPorSitio, setRankPorSitio] = useState({});
  const [loadingRank, setLoadingRank] = useState(false);
  const [errorRank, setErrorRank] = useState("");
  // NUEVO: modo trazado de rutas
  const [routeMode, setRouteMode] = useState(false);
  const [routeDate, setRouteDate] = useState(""); // YYYY-MM-DD
  const [shouldTraceRoute, setShouldTraceRoute] = useState(false); // controla cuándo trazar

  // NUEVO: modo intersección de sectores
  const [intersectionMode, setIntersectionMode] = useState(false);
  const [intersectionStats, setIntersectionStats] = useState({
    total: 0,
    intersecting: 0,
    pairsCount: 0,
  });

  // MODIFICADO: Agregar filtros específicos para Red de Vínculos
  const [filtrosRedVinculos, setFiltrosRedVinculos] = useState({
    // Filtros originales de comunicación (mantenemos para no romper)
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

    // NUEVO: Filtros específicos para la visualización de red
    maxConnectionsPerSabana: 100,
    showSharedOnly: false,
    minConnections: 1,
  });

  const [activeButton, setActiveButton] = useState("info");

  const location = useLocation();
  const idSabana = location.state?.idSabana || null;
  const [error, setError] = useState("");

  console.log("Valor de idSabana al cargar:", idSabana);

  // NUEVO: Colores por sabana (misma paleta que MapAntenas)
  const baseSabanaColors = [
    "#001219",
    "#005f73",
    "#0a9396",
    "#ee9b00",
    "#ca6702",
    "#bb3e03",
    "#ae2012",
    "#9b2226",
  ];

  // Generar mapa de colores por sabana
  const sabanaColorMap = useMemo(() => {
    if (!idSabana) return {};

    const sabanaIds = Array.isArray(idSabana) ? idSabana : [idSabana];
    const colorMap = {};

    sabanaIds.forEach((sabId, idx) => {
      colorMap[Number(sabId)] = baseSabanaColors[idx % baseSabanaColors.length];
    });

    return colorMap;
  }, [idSabana]);

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

  const handleRedVinculosFilterChange = (filterName, value) => {
    setFiltrosRedVinculos((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // MODIFICADO: Combina fecha y hora y actualiza los filtros aplicados
  const aplicarFiltrosMapa = () => {
    const { fechaInicio, horaInicio, fechaFin, horaFin } = filtrosMapaAntenas;

    // Si la fecha existe pero la hora no, se usa el inicio/fin del día
    const from = fechaInicio
      ? `${fechaInicio}T${horaInicio || "00:00:00"}Z`
      : null;
    const to = fechaFin ? `${fechaFin}T${horaFin || "23:59:59"}Z` : null;

    setFiltrosMapaAplicados({ fromDate: from, toDate: to });
  };

  // NUEVO: Limpia los filtros de fecha y hora y refleja en el mapa
  const limpiarFiltrosMapa = () => {
    // Vaciar inputs visibles
    setFiltrosMapaAntenas({
      fechaInicio: "",
      fechaFin: "",
      horaInicio: "",
      horaFin: "",
    });

    // Quitar filtros aplicados para que el mapa muestre todo el rango
    setFiltrosMapaAplicados({ fromDate: null, toDate: null });

    // Si estaba activo el modo intersección (requiere fechas), desactivarlo
    if (intersectionMode) {
      setIntersectionMode(false);
      setIntersectionStats({ total: 0, intersecting: 0, pairsCount: 0 });
    }
  };

  // NUEVO: Fetch de catálogo de antenas para popular el selector
  useEffect(() => {
    if (!idSabana || activeButton !== "map" || routeMode) return;

    const controller = new AbortController();
    const cargarCatalogo = async () => {
      try {
        setLoadingAntenas(true);
        setErrorAntenas("");

        const sabanaIds = Array.isArray(idSabana) ? idSabana : [idSabana];

        // Hacer llamadas individuales por sabana para poder asignar sabanaId
        const results = await Promise.allSettled(
          sabanaIds.map(async (sabanaId) => {
            const body = {
              sabanas: [{ id: Number(sabanaId) }],
              from: filtrosMapaAplicados.fromDate || undefined,
              to: filtrosMapaAplicados.toDate || undefined,
              includeFrequencies: false,
              excludeZero: true,
            };

            const res = await fetchWithAuth(
              "/api/sabanas/registros/batch/catalogs/antennas",
              {
                method: "POST",
                signal: controller.signal,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }
            );

            if (!res.ok) {
              const txt = await res.text();
              throw new Error(
                `Error catálogo antenas sabana ${sabanaId}: ${res.status} ${txt}`
              );
            }

            const data = await res.json();

            // Asignar sabanaId a cada site y sector
            const sites = Array.isArray(data?.sites)
              ? data.sites.map((site) => ({
                  ...site,
                  sabanaId: Number(sabanaId),
                }))
              : [];
            const sectors = Array.isArray(data?.sectors)
              ? data.sectors.map((sector) => ({
                  ...sector,
                  sabanaId: Number(sabanaId),
                }))
              : [];

            return { sites, sectors, fechas: data?.fechas };
          })
        );

        // Combinar resultados de todas las sabanas
        const allSites = [];
        const allSectors = [];
        let minFecha = null;
        let maxFecha = null;

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            allSites.push(...result.value.sites);
            allSectors.push(...result.value.sectors);

            if (result.value.fechas) {
              if (!minFecha || result.value.fechas.min < minFecha) {
                minFecha = result.value.fechas.min;
              }
              if (!maxFecha || result.value.fechas.max > maxFecha) {
                maxFecha = result.value.fechas.max;
              }
            }
          }
        });

        setCatalogoAntenas({
          sites: allSites,
          sectors: allSectors,
          fechas: { min: minFecha, max: maxFecha },
        });

        // Si no hay selección aún, seleccionar todos por default
        setSitiosSeleccionados((prev) =>
          prev && prev.length > 0 ? prev : allSites.map((s) => s.siteId)
        );

        // Si hay múltiples sabanas y no hay sabana seleccionada para filtro, seleccionar la primera
        if (
          Array.isArray(idSabana) &&
          idSabana.length > 1 &&
          !sabanaSeleccionadaFiltro
        ) {
          setSabanaSeleccionadaFiltro(Number(idSabana[0]));
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error(e);
        setErrorAntenas(
          e.message || "No se pudo cargar el catálogo de antenas"
        );
      } finally {
        setLoadingAntenas(false);
      }
    };

    cargarCatalogo();
    return () => controller.abort();
  }, [
    idSabana,
    activeButton,
    filtrosMapaAplicados.fromDate,
    filtrosMapaAplicados.toDate,
    routeMode,
  ]);

  // MODIFICADO: Cargar resumen para obtener rank por siteId - AHORA POR SABANA INDIVIDUAL
  useEffect(() => {
    if (!idSabana || activeButton !== "map" || routeMode) return;

    const siteIds = (catalogoAntenas?.sites ?? []).map((s) => s.siteId);
    if (siteIds.length === 0) {
      setRankPorSitio({});
      return;
    }

    const controller = new AbortController();
    const cargarRank = async () => {
      try {
        setLoadingRank(true);
        setErrorRank("");

        const sabanaIds = (Array.isArray(idSabana) ? idSabana : [idSabana]).map(
          (id) => Number(id)
        );
        const rankMapa = {};

        // NUEVO: Hacer peticiones INDIVIDUALES por cada sábana
        const resultados = await Promise.allSettled(
          sabanaIds.map(async (sabanaId) => {
            // Obtener solo los sitios de esta sábana
            const sitiosDeEstaSabana = catalogoAntenas.sites
              .filter((s) => s.sabanaId === sabanaId)
              .map((s) => s.siteId);

            if (sitiosDeEstaSabana.length === 0) return;

            const body = {
              sabanas: [{ id: sabanaId }], // UNA sola sábana por petición
              from: filtrosMapaAplicados.fromDate || undefined,
              to: filtrosMapaAplicados.toDate || undefined,
              siteIds: sitiosDeEstaSabana,
              sortBy: "rank",
              order: "asc",
              perSabana: false, // Como es una sola sábana, no importa
            };

            const res = await fetchWithAuth(
              "/api/sabanas/registros/batch/antennas/summary",
              {
                method: "POST",
                signal: controller.signal,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }
            );

            if (!res.ok) {
              const txt = await res.text();
              throw new Error(
                `Error resumen antenas sabana ${sabanaId}: ${res.status} ${txt}`
              );
            }

            const items = await res.json();
            const itemsArray = Array.isArray(items)
              ? items
              : items?.items || [];

            // Asignar el rank de esta sábana usando clave compuesta
            for (const it of itemsArray) {
              if (it?.siteId != null && it?.rank != null) {
                // Clave única: siteId_sabanaId para evitar conflictos
                const key = `${it.siteId}_${sabanaId}`;
                rankMapa[key] = it.rank;
              }
            }
          })
        );

        // Verificar si hubo errores
        const errores = resultados.filter((r) => r.status === "rejected");
        if (errores.length > 0) {
          console.error("Errores al cargar ranks:", errores);
        }

        setRankPorSitio(rankMapa);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setErrorRank(e.message || "No se pudo cargar el rank de antenas");
        }
      } finally {
        setLoadingRank(false);
      }
    };

    cargarRank();
    return () => controller.abort();
  }, [
    idSabana,
    activeButton,
    catalogoAntenas.sites,
    filtrosMapaAplicados.fromDate,
    filtrosMapaAplicados.toDate,
    routeMode,
  ]);

  // MODIFICADO: Ordenar catálogo por rank asc si existe - USANDO LA CLAVE COMPUESTA
  const sitiosOrdenados = useMemo(() => {
    const sites = catalogoAntenas?.sites ?? [];
    // Si hay múltiples sabanas y hay una seleccionada para filtro, filtrar solo esa sabana
    const sitesFiltrados =
      Array.isArray(idSabana) && idSabana.length > 1 && sabanaSeleccionadaFiltro
        ? sites.filter((s) => s.sabanaId === sabanaSeleccionadaFiltro)
        : sites;

    return sitesFiltrados.slice().sort((a, b) => {
      // MODIFICADO: Usar clave compuesta siteId_sabanaId
      const keyA = `${a.siteId}_${a.sabanaId}`;
      const keyB = `${b.siteId}_${b.sabanaId}`;
      const ra = rankPorSitio[keyA];
      const rb = rankPorSitio[keyB];

      if (ra == null && rb == null) return 0;
      if (ra == null) return 1;
      if (rb == null) return -1;
      return ra - rb;
    });
  }, [catalogoAntenas.sites, rankPorSitio, idSabana, sabanaSeleccionadaFiltro]);

  const marcarTodosSitios = () => {
    // Si hay múltiples sabanas y hay una seleccionada, marcar solo los de esa sabana
    if (
      Array.isArray(idSabana) &&
      idSabana.length > 1 &&
      sabanaSeleccionadaFiltro
    ) {
      const sitiosDeEstaSabana = catalogoAntenas.sites
        .filter((s) => s.sabanaId === sabanaSeleccionadaFiltro)
        .map((s) => s.siteId);
      setSitiosSeleccionados((prev) => {
        const set = new Set(prev);
        sitiosDeEstaSabana.forEach((id) => set.add(id));
        return Array.from(set);
      });
    } else {
      // Si solo hay una sabana o no hay filtro activo, marcar todos
      setSitiosSeleccionados(catalogoAntenas.sites.map((s) => s.siteId));
    }
  };

  const limpiarSitios = () => {
    // Si hay múltiples sabanas y hay una seleccionada, limpiar solo los de esa sabana
    if (
      Array.isArray(idSabana) &&
      idSabana.length > 1 &&
      sabanaSeleccionadaFiltro
    ) {
      const sitiosDeEstaSabana = catalogoAntenas.sites
        .filter((s) => s.sabanaId === sabanaSeleccionadaFiltro)
        .map((s) => s.siteId);
      setSitiosSeleccionados((prev) =>
        prev.filter((id) => !sitiosDeEstaSabana.includes(id))
      );
    } else {
      // Si solo hay una sabana o no hay filtro activo, limpiar todos
      setSitiosSeleccionados([]);
    }
  };

  // NUEVO: alternar modo rutas/antenas
  const toggleRouteMode = () => {
    setRouteMode((prev) => {
      const next = !prev;
      if (next) {
        // al activar rutas, colapsamos filtro de antenas
        setExpandirFiltroAntenas(false);
        // si no hay fecha de ruta, usamos la fechaInicio del rango si existe
        if (!routeDate && filtrosMapaAntenas.fechaInicio) {
          setRouteDate(filtrosMapaAntenas.fechaInicio);
        }
        // Desactivar modo intersección si estaba activo
        setIntersectionMode(false);
      } else {
        // al desactivar rutas, reseteamos el trigger de trazado
        setShouldTraceRoute(false);
      }
      return next;
    });
  };

  // NUEVO: alternar modo intersección
  const toggleIntersectionMode = () => {
    // Si está intentando activar el modo
    if (!intersectionMode) {
      // Validar sábana
      if (!idSabana) {
        Swal.fire({
          icon: "warning",
          title: "Sábana no seleccionada",
          text: "Debes seleccionar una sábana primero",
          confirmButtonColor: "#667eea",
        });
        return;
      }

      // Validar filtros de fecha
      if (!filtrosMapaAplicados.fromDate || !filtrosMapaAplicados.toDate) {
        Swal.fire({
          icon: "warning",
          title: "Filtros de fecha requeridos",
          text: "Debes aplicar filtros de fecha antes de analizar intersecciones",
          confirmButtonColor: "#667eea",
          html: `
            <p style="margin-bottom: 15px;">Para detectar azimuths coincidentes necesitas configurar:</p>
            <ul style="text-align: left; margin: 0 auto; max-width: 300px; line-height: 1.8;">
              <li>📅 Fecha de inicio</li>
              <li>📅 Fecha de fin</li>
            </ul>
            <p style="margin-top: 15px; font-size: 13px; color: #6b7280;">
              Luego haz click en <strong>"Aplicar Filtros"</strong>
            </p>
          `,
        });
        return;
      }

      // Si pasa todas las validaciones, activar
      if (routeMode) {
        setRouteMode(false);
        setRouteDate("");
        setShouldTraceRoute(false);
      }
      setIntersectionMode(true);
    } else {
      // Desactivar el modo
      setIntersectionMode(false);
      setIntersectionStats({ total: 0, intersecting: 0, pairsCount: 0 });
    }
  };

  // NUEVO: callback para recibir estadísticas del mapa
  const handleIntersectionStats = (stats) => {
    setIntersectionStats(stats);
  };

  // NUEVO: obtener hora para análisis de intersección
  const getIntersectionHour = () => {
    if (!filtrosMapaAplicados.fromDate) return null;
    return filtrosMapaAplicados.fromDate;
  };

  const toggleSitioSeleccion = (siteId, checked) => {
    setSitiosSeleccionados((prev) => {
      const set = new Set(prev);
      if (checked) set.add(siteId);
      else set.delete(siteId);
      return Array.from(set);
    });
  };

  // Mantenemos estas funciones para no romper la referencia
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

  // NUEVO: useEffect para obtener el rango de fechas inicial
  useEffect(() => {
    if (!idSabana) return;

    const fetchDateRange = async () => {
      const ids = (Array.isArray(idSabana) ? idSabana : [idSabana]).map(
        (id) => ({ id: Number(id) })
      );

      try {
        const res = await fetchWithAuth(
          "/api/sabanas/registros/batch/catalogs/antennas",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sabanas: ids }),
          }
        );
        if (!res.ok) throw new Error("Failed to fetch date range");

        const data = await res.json();
        const { min, max } = data.fechas;

        if (min && max) {
          // Parsea las fechas ISO (ej: "2024-05-01T10:00:00Z")
          const fechaInicio = min.substring(0, 10); // "2024-05-01"
          const horaInicio = min.substring(11, 16); // "10:00"
          const fechaFin = max.substring(0, 10);
          const horaFin = max.substring(11, 16);

          // Pre-rellena los inputs del filtro
          setFiltrosMapaAntenas({ fechaInicio, horaInicio, fechaFin, horaFin });

          // Aplica este rango inicial al mapa
          setFiltrosMapaAplicados({ fromDate: min, toDate: max });
        }
      } catch (err) {
        console.error("Error fetching initial date range:", err);
      }
    };

    fetchDateRange();
  }, [idSabana]);

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
  };

  const renderContent = () => {
    // ... (código de renderContent sin cambios significativos)
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
          <MapAntenas
            idSabana={idSabana}
            fromDate={filtrosMapaAplicados.fromDate}
            toDate={filtrosMapaAplicados.toDate}
            allowedSiteIds={sitiosSeleccionados}
            routeMode={routeMode}
            routeDate={routeDate}
            shouldTraceRoute={shouldTraceRoute}
            onRouteTraced={() => setShouldTraceRoute(false)}
            intersectionMode={intersectionMode}
            intersectionHour={intersectionMode ? getIntersectionHour() : null}
            onIntersectionStats={handleIntersectionStats}
          />
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

                    <div style={{ marginTop: "16px", display: "flex", gap: 8 }}>
                      <button
                        className="info-action-btn"
                        onClick={aplicarFiltrosMapa}
                        style={{
                          flex: 1,
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
                      <button
                        className="info-action-btn"
                        onClick={limpiarFiltrosMapa}
                        style={{
                          flex: 1,
                          backgroundColor: "#6b7280",
                          padding: "10px",
                        }}
                        title="Quitar filtros de fecha y hora"
                      >
                        Limpiar filtro
                      </button>
                    </div>
                  </div>
                  {/* NUEVO: Panel de filtro por antenas (oculto en modo rutas) */}
                  {!routeMode && (
                    <div className="antenas-filter" style={{ marginTop: 16 }}>
                      <button
                        type="button"
                        className="info-action-btn"
                        onClick={() => setExpandirFiltroAntenas((v) => !v)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          <FontAwesomeIcon
                            icon={faFilter}
                            style={{ marginRight: 8 }}
                          />
                          Filtrar antenas
                        </span>
                        <FontAwesomeIcon
                          icon={
                            expandirFiltroAntenas ? faChevronUp : faChevronDown
                          }
                        />
                      </button>

                      {expandirFiltroAntenas && (
                        <div
                          className="antenas-filter-body"
                          style={{
                            marginTop: 12,
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          {/* NUEVO: Selector de sabana (solo si hay múltiples) */}
                          {Array.isArray(idSabana) && idSabana.length > 1 && (
                            <div style={{ marginBottom: 12 }}>
                              <label
                                htmlFor="select-sabana-filtro"
                                style={{
                                  display: "block",
                                  marginBottom: 6,
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                Seleccionar sábana:
                              </label>
                              <select
                                id="select-sabana-filtro"
                                value={sabanaSeleccionadaFiltro || ""}
                                onChange={(e) =>
                                  setSabanaSeleccionadaFiltro(
                                    Number(e.target.value)
                                  )
                                }
                                style={{
                                  width: "100%",
                                  padding: "8px",
                                  borderRadius: "4px",
                                  border: "1px solid #d1d5db",
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color:
                                    sabanaColorMap[sabanaSeleccionadaFiltro] ||
                                    "#000",
                                }}
                              >
                                {idSabana.map((id) => (
                                  <option
                                    key={id}
                                    value={id}
                                    style={{
                                      color:
                                        sabanaColorMap[Number(id)] || "#000",
                                      fontWeight: "600",
                                    }}
                                  >
                                    Sábana {id}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              marginBottom: 12,
                            }}
                          >
                            <button
                              type="button"
                              className="info-action-btn"
                              onClick={marcarTodosSitios}
                            >
                              <FontAwesomeIcon
                                icon={faCheckDouble}
                                style={{ marginRight: 6 }}
                              />{" "}
                              Marcar todo
                            </button>
                            <button
                              type="button"
                              className="info-action-btn"
                              onClick={limpiarSitios}
                            >
                              <FontAwesomeIcon
                                icon={faBroom}
                                style={{ marginRight: 6 }}
                              />{" "}
                              Limpiar
                            </button>
                          </div>

                          {loadingAntenas && (
                            <div className="placeholder-text">
                              Cargando antenas...
                            </div>
                          )}
                          {errorAntenas && (
                            <div className="error-message">{errorAntenas}</div>
                          )}

                          {!loadingAntenas && !errorAntenas && (
                            <div
                              style={{
                                maxHeight: 240,
                                overflowY: "auto",
                                paddingRight: 4,
                              }}
                            >
                              {catalogoAntenas.sites.length === 0 ? (
                                <div className="placeholder-text">
                                  No hay antenas en el rango.
                                </div>
                              ) : sitiosOrdenados.length === 0 ? (
                                <div className="placeholder-text">
                                  No hay antenas para la sábana seleccionada.
                                </div>
                              ) : (
                                sitiosOrdenados.map((site) => {
                                  // MODIFICADO: Usar clave compuesta para obtener el rank
                                  const key = `${site.siteId}_${site.sabanaId}`;
                                  const rank = rankPorSitio[key];
                                  return (
                                    <label
                                      key={`${site.siteId}_${site.sabanaId}`}
                                      className="filter-checkbox-label"
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "6px 2px",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={sitiosSeleccionados.includes(
                                          site.siteId
                                        )}
                                        onChange={(e) =>
                                          toggleSitioSeleccion(
                                            site.siteId,
                                            e.target.checked
                                          )
                                        }
                                      />
                                      <span style={{ fontSize: 13 }}>
                                        {rank ?? "—"}. (
                                        {Number(site.lat).toFixed(5)},{" "}
                                        {Number(site.lng).toFixed(5)})
                                        {typeof site.totalSectores === "number"
                                          ? ` — ${site.totalSectores} sectores`
                                          : ""}
                                      </span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* NUEVO: Toggle de rutas/antenas + selector de día */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      margin: "8px 0 12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      className="info-action-btn"
                      onClick={toggleRouteMode}
                      title={
                        routeMode
                          ? "Volver a ver antenas y azimuth"
                          : "Mostrar trazado de rutas del día"
                      }
                      style={{
                        backgroundColor: routeMode ? "#2563eb" : undefined,
                      }}
                    >
                      {routeMode ? "Antenas y Azimuth" : "Trazado de rutas"}
                    </button>
                    {routeMode && (
                      <>
                        <div className="input-field">
                          <label htmlFor="ruta-fecha">Día a trazar:</label>
                          <input
                            id="ruta-fecha"
                            type="date"
                            value={routeDate}
                            onChange={(e) => setRouteDate(e.target.value)}
                            className="date-field"
                          />
                        </div>
                        <button
                          type="button"
                          className="info-action-btn"
                          onClick={() => {
                            if (routeDate) {
                              setShouldTraceRoute(true);
                            }
                          }}
                          disabled={!routeDate}
                          title="Trazar ruta para la fecha seleccionada"
                          style={{
                            backgroundColor: "#10b981",
                            cursor: !routeDate ? "not-allowed" : "pointer",
                            opacity: !routeDate ? 0.5 : 1,
                          }}
                        >
                          <FaMapMarkedAlt style={{ marginRight: 6 }} /> Trazar
                          Ruta
                        </button>
                      </>
                    )}
                  </div>

                  {/* NUEVO: Botón de Azimuth Coincidentes */}
                  {!routeMode && (
                    <div style={{ margin: "8px 0 12px" }}>
                      <IntersectionToggleButton
                        isIntersectionMode={intersectionMode}
                        onToggle={toggleIntersectionMode}
                        hasIntersections={intersectionStats.intersecting > 0}
                        isLoading={loadingAntenas}
                        disabled={
                          !idSabana ||
                          !filtrosMapaAplicados.fromDate ||
                          !filtrosMapaAplicados.toDate
                        }
                        disabledReason={
                          !idSabana
                            ? "Selecciona una sábana primero"
                            : !filtrosMapaAplicados.fromDate ||
                              !filtrosMapaAplicados.toDate
                            ? "Aplica filtros de fecha"
                            : "Debes aplicar filtros"
                        }
                      />
                    </div>
                  )}
                </div>
              ) : activeButton === "network" ? (
                // NUEVO: Panel de filtros específico para Red de Vínculos
                <div className="filtros-panel-red">
                  <h5>
                    <FontAwesomeIcon
                      icon={faProjectDiagram}
                      style={{ marginRight: "8px" }}
                    />
                    Configurar Red de Vínculos
                  </h5>

                  <div className="red-filters-section">
                    <div className="filter-group-red">
                      <label>Máximo de números por sábana:</label>
                      <select
                        value={filtrosRedVinculos.maxConnectionsPerSabana}
                        onChange={(e) =>
                          handleRedVinculosFilterChange(
                            "maxConnectionsPerSabana",
                            parseInt(e.target.value)
                          )
                        }
                        className="filter-select-red"
                      >
                        <option value={10}>10 números</option>
                        <option value={20}>20 números</option>
                        <option value={50}>50 números</option>
                        <option value={100}>100 números</option>
                        <option value={500}>Sin límite</option>
                      </select>
                    </div>

                    <div className="filter-group-red">
                      <label className="filter-checkbox-label-red">
                        <input
                          type="checkbox"
                          checked={filtrosRedVinculos.showSharedOnly}
                          onChange={(e) =>
                            handleRedVinculosFilterChange(
                              "showSharedOnly",
                              e.target.checked
                            )
                          }
                          className="filter-checkbox-red"
                        />
                        <span>
                          Solo mostrar números compartidos entre sábanas
                        </span>
                      </label>
                    </div>

                    <div className="filter-presets-red">
                      <h6>Vistas predefinidas:</h6>
                      <div className="preset-buttons-red">
                        <button
                          className="preset-btn-red"
                          onClick={() =>
                            setFiltrosRedVinculos((prev) => ({
                              ...prev,
                              maxConnectionsPerSabana: 20,
                              showSharedOnly: false,
                              minConnections: 1,
                            }))
                          }
                        >
                          Vista Simple
                        </button>
                        <button
                          className="preset-btn-red"
                          onClick={() =>
                            setFiltrosRedVinculos((prev) => ({
                              ...prev,
                              maxConnectionsPerSabana: 100,
                              showSharedOnly: false,
                              minConnections: 1,
                            }))
                          }
                        >
                          Vista Normal
                        </button>
                        <button
                          className="preset-btn-red"
                          onClick={() =>
                            setFiltrosRedVinculos((prev) => ({
                              ...prev,
                              maxConnectionsPerSabana: 500,
                              showSharedOnly: false,
                              minConnections: 1,
                            }))
                          }
                        >
                          Vista Completa
                        </button>
                        <button
                          className="preset-btn-red"
                          onClick={() =>
                            setFiltrosRedVinculos((prev) => ({
                              ...prev,
                              maxConnectionsPerSabana: 500,
                              showSharedOnly: true,
                              minConnections: 2,
                            }))
                          }
                        >
                          Solo Vínculos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Filtros para "info" (sin cambios)
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

              {/* Botones de navegación sin cambios */}
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

      {/* Componente de Debug - TEMPORAL (desactivado) */}
      {false && (
        <DebugFilterStatus
          idSabana={idSabana}
          filtrosMapaAplicados={filtrosMapaAplicados}
          intersectionMode={intersectionMode}
          intersectionStats={intersectionStats}
        />
      )}
    </div>
  );
};

Informacion3_Sabana.propTypes = {
  activeView: PropTypes.string.isRequired,
};

export default Informacion3_Sabana;
