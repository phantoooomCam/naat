"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { FixedSizeList } from "react-window";
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
  Polyline,
  Circle,
  InfoWindow,
  OverlayView,
  DirectionsService,
} from "@react-google-maps/api";
import fetchWithAuth from "../utils/fetchWithAuth.js";
import "./MapAntenas.css";

const libraries = ["geometry"];

const MapAntenas = ({
  idSabana,
  apiBase = "",
  height = "100%",
  filtros = {},
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [antenas, setAntenas] = useState([]);
  const [error, setError] = useState("");
  const [selectedAntenna, setSelectedAntenna] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  const polylineRefs = useRef([]);
  const spiderlineRefs = useRef([]);

  const debounceTimerRef = useRef(null);
  // Filtro por rank
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRanks, setSelectedRanks] = useState(new Set());
  const [rankSearch, setRankSearch] = useState("");

  const [mapCenter, setMapCenter] = useState(null);

  const [rutaTrazada, setRutaTrazada] = useState([]); // polylíneas de la ruta
  const [puntosCronologicos, setPuntosCronologicos] = useState([]);
  const [solicitudesRuta, setSolicitudesRuta] = useState([]); // cola de tramos
  const [lineasSpider, setLineasSpider] = useState([]); // “spiderfy”

  const [enModoRuta, setEnModoRuta] = useState(false); // interruptor principal
  const [indiceSolicitudActual, setIndiceSolicitudActual] = useState(0);

  const [antenasParaRuta, setAntenasParaRuta] = useState([]); // datos para la ruta del día
  const [mostrandoSelectorFecha, setMostrandoSelectorFecha] = useState(false);
  const [fechaTemporal, setFechaTemporal] = useState("");

  // Centro país (México) para primer render
  const DEFAULT_CENTER = { lat: 23.6345, lng: -102.5528 };
  const DEFAULT_ZOOM = 5; // país

  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);

  const detachPolylines = () => {
    try {
      polylineRefs.current.forEach((p) => p && p.setMap(null));
      spiderlineRefs.current.forEach((p) => p && p.setMap(null));
    } catch (_) {}
    polylineRefs.current = [];
    spiderlineRefs.current = [];
  };

  useEffect(() => {
    if (!enModoRuta) {
      // Saliste de Modo Ruta → quitar del mapa cualquier overlay residual
      detachPolylines();
      // Limpiar estados que dibujan rutas/spider
      setRutaTrazada([]);
      setLineasSpider([]);
      setPuntosCronologicos([]);
      setSolicitudesRuta([]);
      setIndiceSolicitudActual(0);
    }
  }, [enModoRuta]);

  const trazarRutaParaFecha = async (fecha) => {
    if (!fecha) return;

    setMostrandoSelectorFecha(false); // Ocultamos el calendario
    // Aquí podrías poner un estado de carga si quieres

    // 1. Construir el rango de tiempo para el día completo
    const from = `${fecha}T00:00:00`;
    const to = `${fecha}T23:59:59`;
    const params = new URLSearchParams({
      from,
      to,
      bucket: "hour",
      includeRaw: "false",
    });

    try {
      const url = `${apiBase}/api/sabanas/${idSabana}/registros/coordenadas-decimales?${params.toString()}`;
      const response = await fetchWithAuth(url);

      if (!response || !response.ok) {
        throw new Error("No se pudieron obtener los datos para la ruta.");
      }

      const data = await response.json();
      const items = Array.isArray(data) ? data : data.items || [];

      // 2. Guardar los datos específicos del día en su propio estado
      setAntenasParaRuta(items);

      // 3. Activar el "Modo Ruta"
      setEnModoRuta(true);
    } catch (err) {
      console.error("Error al trazar la ruta:", err);
      // Aquí podrías notificar al usuario del error con un toast o un estado
      setError("No se encontraron datos de ruta para el día seleccionado.");
    }
  };

  const generarColorContrastante = (seed) => {
    const h = (seed * 137.5) % 360; // Usa el ángulo dorado para distribuir los matices
    const s = 90; // Saturación alta para colores vivos
    const l = 55; // Luminosidad media para buen contraste
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  const filteredAntenas = useMemo(() => {
    // Semántica corregida:
    //  - set vacío  => mostrar NINGUNA (para que "Limpiar" oculte todo)
    //  - set no vacío => mostrar sólo los ranks seleccionados
    if (selectedRanks.size === 0) return [];
    return antenas.filter((a) =>
      selectedRanks.has(a.rank == null ? "__SIN_RANK__" : String(a.rank))
    );
  }, [antenas, selectedRanks]);

  const directionsCallback = useCallback(
    (response, status) => {
      if (!enModoRuta) return;
      if (status === "OK" && response) {
        // Si la ruta se calculó correctamente, la guardamos en el estado
        setRutaTrazada((prevRutas) => [
          ...prevRutas,
          {
            path: response.routes[0].overview_path, // La ruta de conducción real
            color: generarColorContrastante(indiceSolicitudActual),
          },
        ]);
        // Pasamos a la siguiente solicitud de la cola
        setIndiceSolicitudActual((prevIndex) => prevIndex + 1);
      } else {
        console.error(`Error fetching directions ${status}`);
        // Aunque falle, intentamos calcular la siguiente para no bloquear el proceso
        setIndiceSolicitudActual((prevIndex) => prevIndex + 1);
      }
    },
    [enModoRuta, indiceSolicitudActual]
  );

  useEffect(() => {
    if (!isLoaded || !window.google) return;

    if (antenasParaRuta.length < 2) {
      setRutaTrazada([]);
      setPuntosCronologicos([]);
      setSolicitudesRuta([]);
      setIndiceSolicitudActual(0);
      setLineasSpider([]); // Limpia las líneas
      return;
    }

    const antenasOrdenadas = [...antenasParaRuta].sort(
      (a, b) => new Date(a.primerUso) - new Date(b.primerUso)
    );

    // --- NUEVA LÓGICA DE AGRUPACIÓN Y SPIDERFY ---

    // 1. Agrupar marcadores por coordenada
    const marcadoresPorCoordenada = new Map();
    antenasOrdenadas.forEach((antena, index) => {
      const key = `${antena.latitudDecimal},${antena.longitudDecimal}`;
      if (!marcadoresPorCoordenada.has(key)) {
        marcadoresPorCoordenada.set(key, []);
      }
      marcadoresPorCoordenada.get(key).push({
        position: { lat: antena.latitudDecimal, lng: antena.longitudDecimal },
        numero: index + 1,
      });
    });

    const nuevosPuntosCronologicos = [];
    const nuevasLineasSpider = [];
    const SPIDER_RADIUS_METERS = 25; // Distancia del centro a los satélites

    // 2. Calcular nuevas posiciones para los grupos
    marcadoresPorCoordenada.forEach((grupo) => {
      if (grupo.length <= 1) {
        // A este marcador no le pasa nada, no es satélite
        nuevosPuntosCronologicos.push({ ...grupo[0], esSatelite: false });
      } else {
        const centro = grupo[0].position;
        // El primero se queda en el centro, tampoco es satélite
        nuevosPuntosCronologicos.push({ ...grupo[0], esSatelite: false });

        grupo.slice(1).forEach((marcador, index) => {
          const angulo = (index / (grupo.length - 1)) * 270;
          const nuevaPosicion =
            window.google.maps.geometry.spherical.computeOffset(
              new window.google.maps.LatLng(centro.lat, centro.lng),
              SPIDER_RADIUS_METERS,
              angulo
            );

          // --> MODIFICACIÓN: Añadimos la etiqueta esSatelite: true
          nuevosPuntosCronologicos.push({
            ...marcador,
            position: { lat: nuevaPosicion.lat(), lng: nuevaPosicion.lng() },
            esSatelite: true, // ¡Etiqueta añadida!
          });

          nuevasLineasSpider.push({
            path: [
              centro,
              { lat: nuevaPosicion.lat(), lng: nuevaPosicion.lng() },
            ],
          });
        });
      }
    });

    setPuntosCronologicos(nuevosPuntosCronologicos);
    setLineasSpider(nuevasLineasSpider);

    // La lógica para preparar las solicitudes de ruta no cambia
    const nuevasSolicitudes = [];
    for (let i = 0; i < antenasOrdenadas.length - 1; i++) {
      const puntoA = antenasOrdenadas[i];
      const puntoB = antenasOrdenadas[i + 1];
      nuevasSolicitudes.push({
        origin: { lat: puntoA.latitudDecimal, lng: puntoA.longitudDecimal },
        destination: {
          lat: puntoB.latitudDecimal,
          lng: puntoB.longitudDecimal,
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
    }

    setRutaTrazada([]);
    setSolicitudesRuta(nuevasSolicitudes);
    setIndiceSolicitudActual(0);
  }, [antenasParaRuta, isLoaded]);

  const limpiarRuta = () => {
    // Quitar del mapa cualquier polyline residual
    try {
      polylineRefs.current.forEach((p) => p && p.setMap(null));
      spiderlineRefs.current.forEach((p) => p && p.setMap(null));
    } catch (_) {}
    polylineRefs.current = [];
    spiderlineRefs.current = [];

    // Limpiar estados
    setAntenasParaRuta([]);
    setRutaTrazada([]);
    setPuntosCronologicos([]);
    setLineasSpider([]);
    setSolicitudesRuta([]);
    setIndiceSolicitudActual(0);

    // Salir de modo ruta
    setEnModoRuta(false);
  };

  // API Key únicamente desde variable de entorno (Vite)
  // const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // const { isLoaded, loadError } = useJsApiLoader({
  //   id: "google-map-script",
  //   googleMapsApiKey: apiKey,
  //   libraries,
  // });

  // Opciones base memoizadas
  const circleOptionsBase = useMemo(
    () => ({
      fillColor: "var(--coverage-circle-color)",
      fillOpacity: 0.18,
      strokeColor: "var(--coverage-circle-color)",
      strokeOpacity: 0.7,
      strokeWeight: 1.5,
    }),
    []
  );

  const sectorOptionsBase = useMemo(
    () => ({
      fillColor: "var(--coverage-sector-color)",
      fillOpacity: 0.18,
      strokeColor: "var(--coverage-sector-color)",
      strokeOpacity: 0.7,
      strokeWeight: 1.5,
    }),
    []
  );

  // Helpers visuales según rank
  // Tamaños reducidos para círculos (más compactos en el mapa)
  const circleSizeForRank = (rank) => {
    if (rank === 1) return 28; // antes 40
    if (rank === 2 || rank === 3) return 24; // antes 36
    return 20; // antes 32
  };
  const strokeWeightForRank = (rank) => {
    if (rank === 1) return 3;
    if (rank === 2 || rank === 3) return 2.25;
    return 1.5;
  };
  const strokeOpacityForRank = (rank) => {
    if (rank === 1) return 0.95;
    if (rank === 2 || rank === 3) return 0.85;
    return 0.7;
  };

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    // Construct from parameter (fecha inicio + hora inicio)
    if (filtros.fechaInicio) {
      const horaInicio = filtros.horaInicio || "00:00";
      // Remove 'Z' suffix - backend expects local time format
      const fromDateTime = `${filtros.fechaInicio}T${horaInicio}:00`;
      params.append("from", fromDateTime);
    }

    // Construct to parameter (fecha fin + hora fin)
    if (filtros.fechaFin) {
      const horaFin = filtros.horaFin || "23:59";
      // Remove 'Z' suffix and use :00 for seconds to match exact time
      const toDateTime = `${filtros.fechaFin}T${horaFin}:00`;
      params.append("to", toDateTime);
    }

    // Add bucket parameter for hourly aggregation
    params.append("bucket", "hour");

    // Add includeRaw parameter as shown in the example
    params.append("includeRaw", "false");

    return params.toString();
  }, [filtros]);

  // Cargar antenas (vía fetchWithAuth: cookies, 401/403, etc.)
  useEffect(() => {
    if (!idSabana) return;
    const controller = new AbortController();

    const fetchAntenas = async () => {
      try {
        setError("");
        const queryString = buildQueryParams();
        const url = `${apiBase}/api/sabanas/${idSabana}/registros/coordenadas-decimales${
          queryString ? `?${queryString}` : ""
        }`;

        const response = await fetchWithAuth(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        // fetchWithAuth retorna null en errores (y ya notifica/redirect)
        if (!response) return;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const items = Array.isArray(data)
          ? data
          : data.items || data.Items || [];

        const normalized = items
          .map((item) => ({
            latitudDecimal: item.latitudDecimal ?? item.LatitudDecimal,
            longitudDecimal: item.longitudDecimal ?? item.LongitudDecimal,
            azimuth: item.azimuth ?? item.Azimuth,
            frecuencia: item.frecuencia ?? item.Frecuencia ?? 1,
            rank: item.rank ?? item.Rank ?? null,
            primerUso: item.primerUso,
            ultimoUso: item.ultimoUso,
            serie: item.serie || [],
            fechasUso: item.fechasUso,
          }))
          .filter(
            (it) =>
              typeof it.latitudDecimal === "number" &&
              typeof it.longitudDecimal === "number" &&
              typeof it.azimuth === "number"
          );

        // Ordenar por rank asc; estable por lat/lng/azimuth
        normalized.sort((a, b) => {
          const ra = a.rank ?? Number.MAX_SAFE_INTEGER;
          const rb = b.rank ?? Number.MAX_SAFE_INTEGER;
          if (ra !== rb) return ra - rb;
          if (a.latitudDecimal !== b.latitudDecimal)
            return a.latitudDecimal - b.latitudDecimal;
          if (a.longitudDecimal !== b.longitudDecimal)
            return a.longitudDecimal - b.longitudDecimal;
          return (a.azimuth ?? 0) - (b.azimuth ?? 0);
        });

        setAntenas(normalized);
        // Establecer el centro SOLO la primera vez que llegan datos y aún no se ha fijado
        if (normalized.length > 0) {
          setMapCenter(
            (prev) =>
              prev || {
                lat: normalized[0].latitudDecimal,
                lng: normalized[0].longitudDecimal,
              }
          );
          // Puedes dar un zoom urbano inicial si quieres
          setZoomLevel((z) => (z === DEFAULT_ZOOM ? 12 : z));
        }
      } catch (err) {
        // Si el error es una cancelación, simplemente detenemos la ejecución en silencio.
        // Esto es normal durante el modo estricto de React o si el usuario navega rápido.
        if (err.name === "AbortError") {
          console.log(
            "Fetch abortado, lo cual es normal en el ciclo de vida de React."
          );
          return;
        }

        // Para cualquier otro error, sí lo mostramos al usuario.
        console.error("Error fetching antenna data:", err);
        setError(err.message || "Error desconocido");
      }
    };

    fetchAntenas();
    return () => controller.abort();
  }, [idSabana, apiBase, buildQueryParams, filtros]); // Added filtros to dependencies

  // Actualizar set de ranks disponibles cuando cambian las antenas
  useEffect(() => {
    if (antenas.length === 0) return;
    const unique = new Set(
      antenas.map((a) => (a.rank == null ? "__SIN_RANK__" : String(a.rank)))
    );
    // Si no hay selección previa (o se han incorporado nuevos ranks), inicializar con todos
    if (selectedRanks.size === 0) {
      setSelectedRanks(unique);
    } else {
      // Asegurar que la selección no contenga ranks que ya no existen
      const filtered = new Set();
      selectedRanks.forEach((r) => {
        if (unique.has(r)) filtered.add(r);
      });
      if (filtered.size !== selectedRanks.size) setSelectedRanks(filtered);
    }
  }, [antenas]);

  /** Cobertura calculada sólo sobre las antenas filtradas */
  const coverageShapes = useMemo(() => {
    if (!isLoaded || !window.google || filteredAntenas.length === 0) return [];

    return filteredAntenas.map((antena, index) => {
      const center = new window.google.maps.LatLng(
        antena.latitudDecimal,
        antena.longitudDecimal
      );
      const r = antena.rank ?? 9999;
      const weight = strokeWeightForRank(r);
      const opacity = strokeOpacityForRank(r);

      if (antena.azimuth === 360) {
        return {
          type: "circle",
          key: `circle-${index}`,
          center: { lat: antena.latitudDecimal, lng: antena.longitudDecimal },
          radius: 400,
          options: {
            ...circleOptionsBase,
            strokeWeight: weight,
            strokeOpacity: opacity,
          },
        };
      }

      const leftHeading = (((antena.azimuth - 5) % 360) + 360) % 360;
      const rightHeading = (((antena.azimuth + 5) % 360) + 360) % 360;

      const left = window.google.maps.geometry.spherical.computeOffset(
        center,
        400,
        leftHeading
      );
      const right = window.google.maps.geometry.spherical.computeOffset(
        center,
        400,
        rightHeading
      );

      return {
        type: "polygon",
        key: `sector-${index}`,
        paths: [
          { lat: center.lat(), lng: center.lng() },
          { lat: left.lat(), lng: left.lng() },
          { lat: right.lat(), lng: right.lng() },
        ],
        options: {
          ...sectorOptionsBase,
          strokeWeight: weight,
          strokeOpacity: opacity,
        },
      };
    });
  }, [filteredAntenas, isLoaded, circleOptionsBase, sectorOptionsBase]);

  // Controles
  const onMapLoad = useCallback((map) => {
    setMapRef(map);
    try {
      if (window.google && window.google.maps) {
        map.setOptions({
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_CENTER,
          },
          mapTypeControlOptions: {
            position: window.google.maps.ControlPosition.TOP_LEFT,
          },
        });
      }
    } catch (e) {}

    // <-- NUEVO: sincronizar el estado con el zoom real del mapa
    try {
      const z = map.getZoom?.();
      if (typeof z === "number") setZoomLevel(z);
      map.addListener("zoom_changed", () => {
        const current = map.getZoom?.();
        if (typeof current === "number") setZoomLevel(current);
      });
    } catch (_) {}
  }, []);

  const fitBounds = useCallback(() => {
    if (!mapRef || filteredAntenas.length === 0) return;
    if (filteredAntenas.length === 1) {
      const a = filteredAntenas[0];
      mapRef.setCenter({ lat: a.latitudDecimal, lng: a.longitudDecimal });
      mapRef.setZoom(16);
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      filteredAntenas.forEach((a) =>
        bounds.extend({ lat: a.latitudDecimal, lng: a.longitudDecimal })
      );
      mapRef.fitBounds(bounds);
    }
  }, [mapRef, filteredAntenas]);
  // recalculateSectors removed — se maneja automáticamente mediante filtros y re-render

  // Ranks únicos ordenados para dropdown (mover arriba de returns para respetar orden de hooks)
  const uniqueRanksSorted = useMemo(() => {
    const set = new Set(
      antenas.map((a) => (a.rank == null ? "__SIN_RANK__" : String(a.rank)))
    );
    const arr = Array.from(set);
    // Separar sin rank al final
    const numeric = arr
      .filter((r) => r !== "__SIN_RANK__")
      .map((r) => Number(r))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const result = numeric.map(String);
    if (arr.includes("__SIN_RANK__")) result.push("__SIN_RANK__");
    return result;
  }, [antenas]);

  const toggleRank = (rankKey) => {
    setSelectedRanks((prev) => {
      const next = new Set(prev);
      if (next.has(rankKey)) next.delete(rankKey);
      else next.add(rankKey);
      return next;
    });
  };
  const allSelected =
    selectedRanks.size === uniqueRanksSorted.length &&
    uniqueRanksSorted.length > 0;
  const selectAll = () => setSelectedRanks(new Set(uniqueRanksSorted));
  const clearAll = () => setSelectedRanks(new Set());

  const filteredRankList = uniqueRanksSorted.filter((rk) => {
    if (!rankSearch.trim()) return true;
    const label = rk === "__SIN_RANK__" ? "Sin rank" : rk;
    return label.toLowerCase().includes(rankSearch.toLowerCase());
  });

  const visibleCount = filteredAntenas.length;

  // Estados de carga/errores (después de todos los hooks)
  if (loadError) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status error">
          Error cargando Google Maps: {loadError.message}
        </div>
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status loading">
          Cargando Google Maps...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status error">Error: {error}</div>
      </div>
    );
  }
  // if (antenas.length === 0) {
  //   return (
  //     <div className="mapa-antenas-wrapper">
  //       <div className="mapa-antenas-status">
  //         No hay ubicaciones de antenas para mostrar.
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="mapa-antenas-wrapper" style={{ height }}>
      {/* Header + controles */}
      <div className="mapa-antenas-header">
        <h4>Mapa de Antenas</h4>
        <div className="mapa-antenas-toolbar">
          {/* --> MODIFICADO: Botones condicionales según el modo */}
          {enModoRuta ? (
            <button className="mapa-antenas-btn" onClick={limpiarRuta}>
              Modo Azimuth
            </button>
          ) : (
            <>
              <button
                className="mapa-antenas-btn"
                onClick={() => setMostrandoSelectorFecha(true)}
              >
                Trazar Ruta Diaria
              </button>
              <button
                className="mapa-antenas-btn"
                onClick={fitBounds}
                title="Ajustar vista"
              >
                Ajustar vista
              </button>
              <div className="mapa-antenas-filter-wrapper">
                <button
                  type="button"
                  className="mapa-antenas-btn"
                  onClick={() => setFilterOpen((o) => !o)}
                  title="Filtrar por rank"
                >
                  Filtrar antenas
                </button>
                {filterOpen && (
                  <div
                    className="mapa-antenas-filter-panel"
                    role="dialog"
                    aria-label="Filtro de ranks"
                  >
                    {/* ... Contenido del panel de filtro (sin cambios) ... */}
                    <div className="filter-header">
                      <strong>Filtrar ranks</strong>
                      <button
                        type="button"
                        className="close-btn"
                        onClick={() => setFilterOpen(false)}
                        aria-label="Cerrar"
                      >
                        ×
                      </button>
                    </div>
                    <div className="filter-actions">
                      <button
                        type="button"
                        onClick={selectAll}
                        disabled={allSelected}
                      >
                        Seleccionar todo
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        disabled={selectedRanks.size === 0}
                      >
                        Limpiar
                      </button>
                    </div>
                    <input
                      type="text"
                      className="filter-search"
                      placeholder="Buscar rank..."
                      value={rankSearch}
                      onChange={(e) => setRankSearch(e.target.value)}
                    />
                    <div className="filter-list">
                      {filteredRankList.length === 0 ? (
                        <div className="filter-empty">Sin coincidencias</div>
                      ) : (
                        <FixedSizeList
                          height={180}
                          itemCount={filteredRankList.length}
                          itemSize={28}
                          width={"100%"}
                        >
                          {({ index, style }) => {
                            const rk = filteredRankList[index];
                            const checked = selectedRanks.has(rk);
                            const label =
                              rk === "__SIN_RANK__" ? "Sin rank" : rk;
                            return (
                              <label
                                style={style}
                                key={rk}
                                className="filter-item"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleRank(rk)}
                                />
                                <span>{label}</span>
                              </label>
                            );
                          }}
                        </FixedSizeList>
                      )}
                    </div>
                    <div className="filter-footer">
                      <span>{visibleCount} visibles</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* --> NUEVO: Modal para seleccionar la fecha de la ruta */}
      {mostrandoSelectorFecha && (
        <div className="date-picker-modal-overlay">
          <div className="date-picker-modal">
            <h4>Selecciona un día para la ruta</h4>
            <input
              type="date"
              // 1. El input ahora solo guarda la fecha temporalmente
              onChange={(e) => setFechaTemporal(e.target.value)}
            />
            <div className="date-picker-actions">
              <button onClick={() => setMostrandoSelectorFecha(false)}>
                Cancelar
              </button>
              {/* 2. El botón "Aceptar" ahora es el que llama a la función */}
              <button
                onClick={() => trazarRutaParaFecha(fechaTemporal)}
                // 3. Deshabilitamos el botón si no se ha elegido fecha
                disabled={!fechaTemporal}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <GoogleMap
        center={mapCenter || DEFAULT_CENTER}
        zoom={zoomLevel}
        mapContainerClassName="mapa-antenas-canvas"
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy",
          scrollwheel: true,
        }}
      >
        {/* --- RENDERIZADO CONDICIONAL DE ELEMENTOS VISUALES --- */}
        {!enModoRuta ? (
          <>
            {/* MODO GENERAL: Muestra Ranks y Cobertura */}
            {filteredAntenas.map((antena, index) => {
              const rankVal = antena.rank ?? null;
              const sizePx = circleSizeForRank(rankVal || 9999);
              return (
                <OverlayView
                  key={`antenna-rank-${index}`}
                  position={{
                    lat: antena.latitudDecimal,
                    lng: antena.longitudDecimal,
                  }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedAntenna({ ...antena, index })}
                    className="antenna-rank-circle"
                    title={`Antena Rank #${rankVal}`}
                    style={{
                      width: sizePx,
                      height: sizePx,
                      transform: "translate(-50%, -50%)",
                      zIndex: 100000 - (rankVal || 9999),
                      fontSize: Math.max(10, Math.round(sizePx * 0.45)),
                    }}
                  >
                    {rankVal}
                  </button>
                </OverlayView>
              );
            })}

            {coverageShapes.map((shape) =>
              shape.type === "circle" ? (
                <Circle key={shape.key} {...shape} />
              ) : (
                <Polygon key={shape.key} {...shape} />
              )
            )}
          </>
        ) : (
          <>
            {/* --- LÓGICA DE CÁLCULO DE RUTA (INVISIBLE) --- */}
            {solicitudesRuta.length > 0 &&
              indiceSolicitudActual < solicitudesRuta.length && (
                <DirectionsService
                  options={solicitudesRuta[indiceSolicitudActual]}
                  callback={directionsCallback}
                />
              )}

            {/* MODO RUTA: Muestra la Ruta y los Marcadores de Secuencia */}
            {rutaTrazada.map((tramo, index) => (
              <Polyline
                key={`ruta-conduccion-${index}`}
                path={tramo.path}
                options={{
                  strokeColor: tramo.color,
                  strokeOpacity: 0.8,
                  strokeWeight: 6,
                  zIndex: 50,
                }}
                onLoad={(poly) => {
                  if (poly) polylineRefs.current.push(poly);
                }}
                onUnmount={(poly) => {
                  if (poly) poly.setMap(null);
                }}
              />
            ))}

            {lineasSpider.map((linea, index) => (
              <Polyline
                key={`spider-line-${index}`}
                path={linea.path}
                options={{
                  strokeColor: "#333333",
                  strokeOpacity: 0.7,
                  strokeWeight: 1,
                  zIndex: 10, // más bajo que la ruta para no taparla
                }}
                onLoad={(poly) => {
                  if (poly) spiderlineRefs.current.push(poly);
                }}
                onUnmount={(poly) => {
                  if (poly) poly.setMap(null);
                }}
              />
            ))}

            {puntosCronologicos.map((marcador) => (
              <OverlayView
                key={`marcador-cronologico-${marcador.numero}`}
                position={marcador.position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  className={`ruta-marker ${
                    marcador.esSatelite ? "ruta-marker--satelite" : ""
                  }`}
                  title={`Paso #${marcador.numero}`}
                >
                  {marcador.numero}
                </div>
              </OverlayView>
            ))}
          </>
        )}

        {/* InfoWindow (funciona en ambos modos) */}
        {selectedAntenna && (
          <InfoWindow
            position={{
              lat: selectedAntenna.latitudDecimal,
              lng: selectedAntenna.longitudDecimal,
            }}
            onCloseClick={() => setSelectedAntenna(null)}
          >
            <div className="antenna-info">
              <h5>
                Antena{" "}
                {selectedAntenna.rank
                  ? `#${selectedAntenna.rank}`
                  : `#${selectedAntenna.index + 1}`}
              </h5>
              <p>
                <strong>Latitud:</strong>{" "}
                {selectedAntenna.latitudDecimal.toFixed(6)}
              </p>
              <p>
                <strong>Longitud:</strong>{" "}
                {selectedAntenna.longitudDecimal.toFixed(6)}
              </p>
              <p>
                <strong>Azimuth:</strong>{" "}
                {selectedAntenna.azimuth === 360
                  ? "360° (Cobertura omnidireccional)"
                  : `${selectedAntenna.azimuth}°`}
              </p>
              {typeof selectedAntenna.frecuencia === "number" && (
                <p>
                  <strong>Frecuencia:</strong> {selectedAntenna.frecuencia}
                </p>
              )}
              {selectedAntenna.primerUso && (
                <p>
                  <strong>Primer uso:</strong>{" "}
                  {new Date(selectedAntenna.primerUso).toLocaleString("es-MX")}
                </p>
              )}
              {selectedAntenna.ultimoUso && (
                <p>
                  <strong>Último uso:</strong>{" "}
                  {new Date(selectedAntenna.ultimoUso).toLocaleString("es-MX")}
                </p>
              )}
              {selectedAntenna.serie && selectedAntenna.serie.length > 0 && (
                <div>
                  <strong>Actividad por hora:</strong>
                  <div
                    style={{
                      maxHeight: "100px",
                      overflowY: "auto",
                      fontSize: "0.85em",
                      marginTop: "4px",
                    }}
                  >
                    {selectedAntenna.serie.map((bucket, idx) => (
                      <div key={idx}>
                        {new Date(bucket.bucket).toLocaleString("es-MX", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        : {bucket.count} registros
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {(!antenas || antenas.length === 0) && (
        <div className="map-empty-hint">
          No hay ubicaciones para mostrar todavía. Usa “Filtrar antenas” o
          selecciona un día.
        </div>
      )}

      {/* --> MODIFICADO: La leyenda ahora solo aparece en Modo Ruta */}
      {enModoRuta && puntosCronologicos.length > 0 && (
        <div className="mapa-antenas-legend-ruta">
          <h5>Leyenda de Seguimiento</h5>
          <div className="legend-item">
            {/* Leyenda simplificada para el modo ruta */}
            <div
              className="ruta-marker"
              style={{ position: "relative", transform: "none" }}
            >
              #
            </div>
            <span>
              Marcador numerado indica la <strong>SECUENCIA</strong>{" "}
              cronológica.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapAntenas;
