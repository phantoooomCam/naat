"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
  OverlayView,
  Polyline,
  Marker,
} from "@react-google-maps/api";
import { LuRadioTower } from "react-icons/lu";
import "./MapAntenas.css";

const fetchWithAuth = (url, options) => {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};

const libraries = ["geometry"];

const MapAntenas = ({ idSabana, fromDate, toDate, allowedSiteIds, routeMode = false, routeDate = null }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [sites, setSites] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  // Ruta diaria
  const [routePoints, setRoutePoints] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routeDirections, setRouteDirections] = useState([]); // array de DirectionsResult por segmento
  const [routeRenderKey, setRouteRenderKey] = useState(0); // fuerza desmontar/ montar capas de ruta
  const routeOverlayRefs = useRef({ polylines: [] });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Antenas y sectores (deshabilitado en modo rutas)
  useEffect(() => {
    if (!idSabana || !isLoaded || routeMode) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setSites([]);
      setSectors([]);

      const sabanaIds = (Array.isArray(idSabana) ? idSabana : [idSabana]).map(
        (id) => ({ id: Number(id) })
      );

      const baseApiBody = {
        sabanas: sabanaIds,
        from: fromDate,
        to: toDate,
        tz: "America/Mexico_City",
        minFreq: 1,
        perSabana: false,
      };

      try {
        const hasFilter = Array.isArray(allowedSiteIds);
        const selectedCount = hasFilter ? allowedSiteIds.length : null;

        // Si hay filtro y está vacío, limpiamos el mapa
        if (hasFilter && selectedCount === 0) {
          setSites([]);
          setSectors([]);
          return;
        }

        // --- PASO 1: Obtener sitios (filtrados por siteIds si aplica) ---
        const sitesBody = hasFilter
          ? { ...baseApiBody, siteIds: allowedSiteIds, sortBy: "rank", order: "asc" }
          : { ...baseApiBody, topN: 1000 };

        const sitesRes = await fetchWithAuth("/api/sabanas/registros/batch/antennas/summary", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify(sitesBody),
        });

        if (!sitesRes.ok) {
          const errorData = await sitesRes.text();
          throw new Error(`Fallo al obtener sitios: ${sitesRes.status} ${errorData}`);
        }

        const sitesData = await sitesRes.json();
        const fetchedSites = Array.isArray(sitesData) ? sitesData : (sitesData.items || []);
        setSites(fetchedSites);

        // Si no se encontraron sitios, no necesitamos buscar sectores
        if (fetchedSites.length === 0) {
          setSectors([]);
          return;
        }

        // --- PASO 2: Extraer los IDs de los sitios obtenidos ---
        const siteIds = hasFilter ? allowedSiteIds : fetchedSites.map(site => site.siteId);

        // --- PASO 3: Obtener TODOS los sectores para ESOS sitios ---
        const sectorsApiBody = {
          ...baseApiBody,
          siteIds: siteIds,
        };

        const sectorsRes = await fetchWithAuth("/api/sabanas/registros/batch/sectors/summary", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify(sectorsApiBody),
        });

        if (!sectorsRes.ok) {
          const errorData = await sectorsRes.text();
          throw new Error(`Fallo al obtener sectores: ${sectorsRes.status} ${errorData}`);
        }
        
        const sectorsData = await sectorsRes.json();
        setSectors(Array.isArray(sectorsData) ? sectorsData : (sectorsData.items || []));

      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching map data:", err);
          setError(
            "No se pudieron cargar los datos de las antenas. " + err.message
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [idSabana, fromDate, toDate, isLoaded, allowedSiteIds, routeMode]);

  // Rutas diarias (solo cuando routeMode === true)
  useEffect(() => {
    if (!idSabana || !isLoaded || !routeMode) return;
    // routeDate debe ser YYYY-MM-DD
    if (!routeDate) {
      setRoutePoints([]);
      return;
    }

    const controller = new AbortController();

    const fetchRoute = async () => {
      setRouteLoading(true);
      setRouteError(null);
      setRoutePoints([]);
      setRouteDirections([]);

      const sabanaIds = (Array.isArray(idSabana) ? idSabana : [idSabana]).map(
        (id) => ({ id: Number(id) })
      );

      try {
        const res = await fetchWithAuth("/api/sabanas/registros/batch/routes/day", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            sabanas: sabanaIds,
            date: routeDate,
            tz: "America/Mexico_City",
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Fallo al obtener ruta: ${res.status} ${txt}`);
        }

        const data = await res.json();
        const points = Array.isArray(data?.points) ? data.points : [];
        // Ignorar coordenadas 0,0
        const filtered = points.filter((p) => Number(p.lat) !== 0 || Number(p.lng) !== 0);
        setRoutePoints(filtered);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching route:", err);
          setRouteError(
            "No se pudo cargar la ruta diaria. " + (err.message || "")
          );
        }
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
    return () => controller.abort();
  }, [idSabana, isLoaded, routeMode, routeDate]);

  // Limpiar líneas y puntos cuando se desactiva el modo ruta
  useEffect(() => {
    if (!routeMode) {
      setRouteDirections([]);
      setRoutePoints([]);
      // limpiar manualmente las polilíneas que puedan quedar
      routeOverlayRefs.current.polylines.forEach((pl) => {
        try { pl.setMap(null); } catch (_) {}
      });
      routeOverlayRefs.current.polylines = [];
    }
  }, [routeMode]);

  // Al cambiar de fecha de ruta, limpiar y forzar re-render de capas
  useEffect(() => {
    if (!routeMode) return;
    setRouteDirections([]);
    setRoutePoints([]);
    setRouteRenderKey((k) => k + 1);
    // limpiar manualmente las polilíneas actuales
    routeOverlayRefs.current.polylines.forEach((pl) => {
      try { pl.setMap(null); } catch (_) {}
    });
    routeOverlayRefs.current.polylines = [];
  }, [routeDate, routeMode]);

  // Limpiar polilíneas si cambia la sabana (seguridad extra)
  useEffect(() => {
    routeOverlayRefs.current.polylines.forEach((pl) => {
      try { pl.setMap(null); } catch (_) {}
    });
    routeOverlayRefs.current.polylines = [];
  }, [idSabana]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      routeOverlayRefs.current.polylines.forEach((pl) => {
        try { pl.setMap(null); } catch (_) {}
      });
      routeOverlayRefs.current.polylines = [];
    };
  }, []);

  const filteredSites = useMemo(() => {
    if (!allowedSiteIds || allowedSiteIds.length === 0) return [];
    const set = new Set(allowedSiteIds);
    return (sites || []).filter((s) => set.has(s.siteId));
  }, [sites, allowedSiteIds]);

  // Ruta: puntos filtrados (sin 0,0) y numerados
  const filteredRoutePoints = useMemo(() => {
    if (!routePoints?.length) return [];
    return routePoints.filter((p) => Number(p.lat) !== 0 || Number(p.lng) !== 0);
  }, [routePoints]);

  const filteredSectors = useMemo(() => {
    if (!allowedSiteIds || allowedSiteIds.length === 0) return [];
    const set = new Set(allowedSiteIds);
    return (sectors || []).filter((sec) => set.has(sec.siteId));
  }, [sectors, allowedSiteIds]);

  const fitBoundsToSites = useCallback(() => {
    if (!mapRef) return;
    // En modo rutas, ajustar a los puntos de ruta
    if (routeMode && filteredRoutePoints.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredRoutePoints.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
      mapRef.fitBounds(bounds);
      return;
    }

    const targets = filteredSites.length > 0 ? filteredSites : sites;
    if (targets.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      targets.forEach((site) => {
        bounds.extend(new window.google.maps.LatLng(site.lat, site.lng));
      });
      mapRef.fitBounds(bounds);
    }
  }, [mapRef, sites, filteredSites, routeMode, filteredRoutePoints]);

  // MODIFICADO: Este useEffect ahora se encarga de ajustar la vista inicial automáticamente
  useEffect(() => {
    if (!mapRef) return;
    if (routeMode) {
      if (filteredRoutePoints.length > 0) fitBoundsToSites();
      return;
    }
    const targets = filteredSites.length > 0 ? filteredSites : sites;
    if (targets.length > 0) {
      fitBoundsToSites();
    }
  }, [sites, filteredSites, mapRef, fitBoundsToSites, routeMode, filteredRoutePoints]);

  const onMapLoad = useCallback((map) => {
    setMapRef(map);
  }, []);

  const sectorPolygons = useMemo(() => {
    if (routeMode) return [];
    const source = filteredSectors.length > 0 ? filteredSectors : sectors;
    if (!source.length || !isLoaded || !window.google.maps.geometry) return [];

    return source.map((sector) => {
      const origin = new window.google.maps.LatLng(sector.lat, sector.lng);
      const point1 = window.google.maps.geometry.spherical.computeOffset(
        origin,
        400,
        sector.azimuth - 5
      );
      const point2 = window.google.maps.geometry.spherical.computeOffset(
        origin,
        400,
        sector.azimuth + 5
      );

      return {
        id: sector.sectorId,
        path: [origin, point1, point2],
        rank: sector.rankDelSitio,
      };
    });
  }, [sectors, filteredSectors, isLoaded, routeMode]);

  // Calcular rutas sobre calles usando Directions API (segmentado si > 25 puntos)
  useEffect(() => {
    if (!isLoaded || !routeMode) {
      setRouteDirections([]);
      return;
    }
    const pts = filteredRoutePoints;
    if (!pts || pts.length < 2) {
      setRouteDirections([]);
      return;
    }

    let cancelled = false;
    const directionsService = new window.google.maps.DirectionsService();

    const chunkSize = 25; // 1 + 23 waypoints + 1
    const makeChunks = (arr) => {
      if (arr.length <= chunkSize) return [arr];
      const chunks = [];
      let start = 0;
      while (start < arr.length - 1) {
        const end = Math.min(start + chunkSize - 1, arr.length - 1);
        // chunk includes origin arr[start]...arr[end]
        const chunk = arr.slice(start, end + 1);
        chunks.push(chunk);
        // overlap next chunk origin with previous end to keep continuity
        start = end;
      }
      return chunks;
    };

    const chunks = makeChunks(pts);
    const run = async () => {
      const results = [];
      for (const chunk of chunks) {
        if (cancelled) return;
        const origin = { lat: chunk[0].lat, lng: chunk[0].lng };
        const destination = { lat: chunk[chunk.length - 1].lat, lng: chunk[chunk.length - 1].lng };
        const inter = chunk.slice(1, -1);
        const waypoints = inter.slice(0, 23).map((p) => ({ location: { lat: p.lat, lng: p.lng }, stopover: false }));

        const req = {
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
          provideRouteAlternatives: false,
        };

        const dir = await new Promise((resolve, reject) => {
          directionsService.route(req, (res, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) resolve(res);
            else reject(new Error(`Directions failed: ${status}`));
          });
        }).catch((e) => {
          console.warn(e);
          return null;
        });

        if (cancelled) return;
        if (dir) results.push(dir);
      }
      if (!cancelled) setRouteDirections(results);
    };

    setRouteDirections([]);
    run();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, routeMode, filteredRoutePoints]);

  // Paleta de colores para segmentos
  const segmentColors = useMemo(() => [
    "#2563eb", // azul
    "#10b981", // verde
    "#ef4444", // rojo
    "#f59e0b", // ámbar
    "#8b5cf6", // púrpura
    "#06b6d4", // cian
    "#84cc16", // lima
    "#f97316", // naranja
    "#db2777", // rosa
    "#0ea5e9", // azul claro
  ], []);

  // Convertir Directions en segmentos coloreados por tramo consecutivo
  const coloredSegments = useMemo(() => {
    if (!routeMode) return [];
    const segs = [];
    if (routeDirections.length === 0) return segs; // no dibujar hasta tener Directions
    let globalIdx = 0;
    for (const dir of routeDirections) {
      const route = dir?.routes?.[0];
      if (!route?.legs) continue;
      for (const leg of route.legs) {
        const path = [];
        if (Array.isArray(leg.steps)) {
          for (const step of leg.steps) {
            const stepPath = step.path || [];
            for (const ll of stepPath) {
              const lat = typeof ll.lat === "function" ? ll.lat() : ll.lat;
              const lng = typeof ll.lng === "function" ? ll.lng() : ll.lng;
              path.push({ lat, lng });
            }
          }
        }
        if (path.length >= 2) {
          segs.push({
            index: globalIdx,
            color: segmentColors[globalIdx % segmentColors.length],
            path,
          });
        }
        globalIdx++;
      }
    }
    return segs;
  }, [routeMode, routeDirections, segmentColors]);

  // Forzar remount y limpieza cuando cambian las Directions
  useEffect(() => {
    if (!routeMode) return;
    // limpiar manualmente las polilíneas actuales antes de re-renderizar
    routeOverlayRefs.current.polylines.forEach((pl) => {
      try { pl.setMap(null); } catch (_) {}
    });
    routeOverlayRefs.current.polylines = [];
    setRouteRenderKey((k) => k + 1);
  }, [routeDirections, routeMode]);

  // Clustering de puntos repetidos: principal = índice menor; otros alrededor
  const clusteredSteps = useMemo(() => {
    if (!routeMode) return [];
    const groups = new Map();
    filteredRoutePoints.forEach((p, i) => {
      const key = `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`;
      const arr = groups.get(key) || [];
      arr.push({ idx: i + 1, p });
      groups.set(key, arr);
    });

    const clusters = [];
    groups.forEach((arr) => {
      arr.sort((a, b) => a.idx - b.idx);
      const principal = arr[0];
      const others = arr.slice(1).map((x) => x.idx);
      clusters.push({ lat: principal.p.lat, lng: principal.p.lng, mainIndex: principal.idx, others });
    });
    return clusters;
  }, [routeMode, filteredRoutePoints]);

  if (loadError) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status error">
          Error al cargar Google Maps: {loadError.message}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status loading">Cargando mapa...</div>
      </div>
    );
  }

  return (
    <div className="mapa-antenas-wrapper">
      <div className="map-controls">
  <button onClick={fitBoundsToSites} disabled={routeMode ? filteredRoutePoints.length === 0 : sites.length === 0}>Ajustar Vista</button>
      </div>

      <div className="map-legend">
        <h4>Leyenda</h4>
        {!routeMode ? (
          <>
            <div className="legend-item">
              <LuRadioTower className="legend-icon" />
              <span>Antena (Sitio)</span>
            </div>
            <div className="legend-item">
              <div className="legend-polygon"></div>
              <span>Sector (Azimut)</span>
            </div>
            <div className="legend-item">
              <span className="legend-rank">N</span>
              <span>Ranking por Frecuencia</span>
            </div>
          </>
        ) : (
          <div className="legend-item">
            <div style={{ width: 24, height: 4, background: "#2563eb" }}></div>
            <span style={{ marginLeft: 8 }}>Ruta diaria</span>
          </div>
        )}
      </div>

      <GoogleMap
        mapContainerClassName="mapa-antenas-canvas"
        onLoad={onMapLoad}
        // MODIFICADO: Se eliminan 'center' y 'zoom' para permitir que fitBounds controle la vista
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
        }}
      >
        {!routeMode && (
          <>
            {sectorPolygons.map((poly) => (
              <Polygon
                key={poly.id}
                path={poly.path}
                options={{
                  fillColor: "#2563eb",
                  fillOpacity: 0.2,
                  strokeColor: "#2563eb",
                  strokeOpacity: 0.6,
                  strokeWeight: 1,
                  zIndex: poly.rank,
                }}
              />
            ))}

            {(filteredSites.length > 0 ? filteredSites : sites).map((site) => (
              <OverlayView
                key={site.siteId}
                position={{ lat: site.lat, lng: site.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="antenna-marker" title={`Sitio #${site.siteId} - Rank #${site.rank}`}>
                  <LuRadioTower className="antenna-icon" />
                  <span className="rank-badge">{site.rank}</span>
                </div>
              </OverlayView>
            ))}
          </>
        )}

        {routeMode && filteredRoutePoints.length > 0 && (
          <>
            {/* Dibujar segmentos con colores distintos */}
            <div key={`routes-${routeRenderKey}`}>
            {coloredSegments.map((seg) => (
              <Polyline
                key={`seg-${seg.index}`}
                path={seg.path}
                options={{
                  geodesic: false,
                  strokeColor: seg.color,
                  strokeOpacity: 0.95,
                  strokeWeight: 4,
                }}
                onLoad={(poly) => {
                  // registrar referencia para poder limpiar manualmente
                  routeOverlayRefs.current.polylines.push(poly);
                }}
                onUnmount={(poly) => {
                  // remover de la lista al desmontar
                  routeOverlayRefs.current.polylines = routeOverlayRefs.current.polylines.filter((p) => p !== poly);
                }}
              />
            ))}

            {/* Marcadores numerados con clustering (principal + secundarios alrededor) */}
            {clusteredSteps.map((cluster, ci) => (
              <>
                {/* Secundarios (alrededor) primero para que el principal quede arriba */}
                {(() => {
                  if (!window.google?.maps?.geometry) return null;
                  const center = new window.google.maps.LatLng(cluster.lat, cluster.lng);
                  const radius = 10; // metros
                  const total = cluster.others.length;
                  return cluster.others.map((num, idx) => {
                    const angle = (360 / total) * idx;
                    const pos = window.google.maps.geometry.spherical.computeOffset(center, radius, angle);
                    return (
                      <OverlayView
                        key={`cl-other-${ci}-${idx}`}
                        position={{ lat: pos.lat(), lng: pos.lng() }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div
                          title={`Paso ${num}`}
                          style={{
                            transform: "translate(-50%, -50%)",
                            background: "#2563eb",
                            color: "#fff",
                            borderRadius: "9999px",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            border: "2px solid #fff",
                            boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                          }}
                        >
                          {num}
                        </div>
                      </OverlayView>
                    );
                  });
                })()}

                {/* Principal arriba, más grande y con zIndex alto */}
                <OverlayView
                  key={`cl-main-${ci}`}
                  position={{ lat: cluster.lat, lng: cluster.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div
                    title={`Paso ${cluster.mainIndex}`}
                    style={{
                      transform: "translate(-50%, -50%)",
                      background: "#111827",
                      color: "#fff",
                      borderRadius: "9999px",
                      width: 30,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 900,
                      border: "3px solid #fff",
                      boxShadow: "0 0 8px rgba(0,0,0,0.45)",
                      zIndex: 99999,
                    }}
                  >
                    {cluster.mainIndex}
                  </div>
                </OverlayView>
              </>
            ))}
            </div>
          </>
        )}
      </GoogleMap>

      {(!routeMode && (loading || error)) && (
        <div className="map-overlay-status">
            {loading && <div className="mapa-antenas-status loading">Cargando antenas...</div>}
            {error && <div className="mapa-antenas-status error">{error}</div>}
        </div>
      )}
      {(routeMode && (routeLoading || routeError)) && (
        <div className="map-overlay-status">
            {routeLoading && <div className="mapa-antenas-status loading">Cargando ruta...</div>}
            {routeError && <div className="mapa-antenas-status error">{routeError}</div>}
        </div>
      )}
    </div>
  );
};

MapAntenas.propTypes = {
  idSabana: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]).isRequired,
  fromDate: PropTypes.string,
  toDate: PropTypes.string,
  allowedSiteIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  routeMode: PropTypes.bool,
  routeDate: PropTypes.string,
};

export default MapAntenas;

