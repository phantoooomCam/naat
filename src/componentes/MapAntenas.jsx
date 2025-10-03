"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Polygon, Circle, InfoWindow, OverlayView } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer"; // ya no se usa, pero se deja comentado si quieres clustering más adelante
// Eliminado el icono MdCellTower: ahora solo se muestra un círculo con el número de rank
import fetchWithAuth from "../utils/fetchWithAuth.js";
import "./MapAntenas.css";

const libraries = ["geometry"];

// Ya no se muestran markers ni clustering: cada antena se dibuja como un círculo con su rank usando OverlayView.

/**
 * Mapa de Antenas — cookies + fetchWithAuth + .env API key:
 * - Backend devuelve: { latitudDecimal, longitudDecimal, azimuth, frecuencia, rank }
 * - Marker con label = rank; tamaño/visibilidad según rank
 * - Sectores: triángulo (centro, azimuth-5°, azimuth+5°) a 400 m
 * - Google key: SOLO desde .env (VITE_GOOGLE_MAPS_API_KEY)
 * - Auth: SOLO cookie (manejado por fetchWithAuth)
 * - URL: relativa por defecto (útil con proxy Vite). Puedes pasar apiBase para forzar host.
 */
// height: permite ajustar el alto desde el padre (por ejemplo "100%" para ocupar todo el content-display-area,
// o valores como "600px", "70vh", etc.). Por defecto 100% para que se adapte.
// Filtro: Se añade un dropdown estilo Excel para seleccionar qué ranks de antenas mostrar.
const MapAntenas = ({ idSabana, apiBase = "", height = "100%" }) => {
  const [antenas, setAntenas] = useState([]);
  const [error, setError] = useState("");
  const [selectedAntenna, setSelectedAntenna] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  // Antenas visibles actualmente en el viewport (optimización rendimiento)
  const debounceTimerRef = useRef(null);
  // Filtro por rank
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRanks, setSelectedRanks] = useState(new Set());
  const [rankSearch, setRankSearch] = useState("");

  // API Key únicamente desde variable de entorno (Vite)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

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

  // Cargar antenas (vía fetchWithAuth: cookies, 401/403, etc.)
  useEffect(() => {
    if (!idSabana) return;
    const controller = new AbortController();

    const fetchAntenas = async () => {
      try {
        setError("");
        const url = `${apiBase}/api/sabanas/${idSabana}/registros/coordenadas-decimales`;

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
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Error fetching antenna data:", err);
        setError(err.message || "Error desconocido");
      }
    };

    fetchAntenas();
    return () => controller.abort();
  }, [idSabana, apiBase]);

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

  const filteredAntenas = useMemo(() => {
    if (selectedRanks.size === 0) return [];
    return antenas.filter((a) =>
      selectedRanks.has(a.rank == null ? "__SIN_RANK__" : String(a.rank))
    );
  }, [antenas, selectedRanks]);

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
    // Mover controles para que no queden pegados al borde inferior (evita desbordes visibles)
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
    } catch (e) {
      // Silenciar si algo falla (ambiente SSR o google undefined temporalmente)
      // console.warn('No se pudo reubicar controles del mapa', e);
    }
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
  const recalculateSectors = useCallback(() => setAntenas((prev) => prev), []);

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
  const allSelected = selectedRanks.size === uniqueRanksSorted.length && uniqueRanksSorted.length > 0;
  const selectAll = () => setSelectedRanks(new Set(uniqueRanksSorted));
  const clearAll = () => setSelectedRanks(new Set());

  const filteredRankList = uniqueRanksSorted.filter((rk) => {
    if (!rankSearch.trim()) return true;
    const label = rk === "__SIN_RANK__" ? "Sin rank" : rk;
    return label.toLowerCase().includes(rankSearch.toLowerCase());
  });

  const visibleCount = filteredAntenas.length;
  const totalCount = antenas.length;

  // Resumen Top #1
  const top = antenas.find((a) => a.rank === 1);
  const topText = top ? `Top #1: ${top.frecuencia} apariciones` : null;

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
  if (antenas.length === 0) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status">
          No hay ubicaciones de antenas para mostrar.
        </div>
      </div>
    );
  }

  return (
    <div className="mapa-antenas-wrapper" style={{ height }}>
      {/* Header + controles */}
      <div className="mapa-antenas-header">
        <h4>
          Mapa de Antenas — {visibleCount} / {totalCount} visibles
          {totalCount !== 1 ? " ubicaciones" : " ubicación"}
          {topText ? (
            <span style={{ marginLeft: 10, color: "#6b7280", fontWeight: 500 }}>
              ({topText})
            </span>
          ) : null}
        </h4>
        <div className="mapa-antenas-toolbar">
          <button
            className="mapa-antenas-btn"
            onClick={fitBounds}
            title="Ajustar vista"
          >
            Ajustar vista
          </button>
          <button
            className="mapa-antenas-btn"
            onClick={recalculateSectors}
            title="Recalcular sectores"
          >
            Recalcular sectores
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
              <div className="mapa-antenas-filter-panel" role="dialog" aria-label="Filtro de ranks">
                <div className="filter-header">
                  <strong>Filtrar ranks</strong>
                  <button
                    type="button"
                    className="close-btn"
                    onClick={() => setFilterOpen(false)}
                    aria-label="Cerrar"
                  >×</button>
                </div>
                <div className="filter-actions">
                  <button type="button" onClick={selectAll} disabled={allSelected}>
                    Seleccionar todo
                  </button>
                  <button type="button" onClick={clearAll} disabled={selectedRanks.size === 0}>
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
                  {filteredRankList.length === 0 && (
                    <div className="filter-empty">Sin coincidencias</div>
                  )}
                  {filteredRankList.map((rk) => {
                    const checked = selectedRanks.has(rk);
                    const label = rk === "__SIN_RANK__" ? "Sin rank" : rk;
                    return (
                      <label key={rk} className="filter-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRank(rk)}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="filter-footer">
                  <span>{visibleCount} visibles</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Sin leyenda: reemplazada por panel de filtro */}
      {/* Mapa */}
      <GoogleMap
        mapContainerClassName="mapa-antenas-canvas"
        center={
          filteredAntenas[0]
            ? {
                lat: filteredAntenas[0].latitudDecimal,
                lng: filteredAntenas[0].longitudDecimal,
              }
            : { lat: 0, lng: 0 }
        }
        zoom={15}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {/* Círculo con número de rank */}
        {filteredAntenas.map((antena, index) => {
          const rankVal = antena.rank ?? null;
          const sizePx = circleSizeForRank(rankVal || 9999);
          const displayNumber = rankVal || index + 1; // fallback
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
                title={`Antena #${displayNumber}`}
                style={{
                  width: sizePx,
                  height: sizePx,
                  transform: "translate(-50%, -50%)",
                  zIndex: 100000 - (rankVal || 9999),
                  fontSize: Math.max(10, Math.round(sizePx * 0.45)),
                }}
              >
                {displayNumber}
              </button>
            </OverlayView>
          );
        })}

        {/* Cobertura */}
        {coverageShapes.map((shape) =>
          shape.type === "circle" ? (
            <Circle
              key={shape.key}
              center={shape.center}
              radius={shape.radius}
              options={shape.options}
            />
          ) : (
            <Polygon
              key={shape.key}
              paths={shape.paths}
              options={shape.options}
            />
          )
        )}

        {/* InfoWindow */}
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
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      {filteredAntenas.length === 0 && (
        <div className="mapa-antenas-status" style={{ position: "absolute", inset: 0 }}>
          Ninguna antena coincide con el filtro.
        </div>
      )}
    </div>
  );
};

export default MapAntenas;
