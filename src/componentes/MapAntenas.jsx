"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
  OverlayView,
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

const MapAntenas = ({ idSabana, fromDate, toDate, allowedSiteIds, routeMode = false, routeDate = null, shouldTraceRoute = false, onRouteTraced = null }) => {
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
  const [activeRouteDate, setActiveRouteDate] = useState(null);
  
  // NUEVO: Referencias nativas para polylines y marcadores (control total)
  const nativePolylinesRef = useRef([]);
  const nativeMarkersRef = useRef([]);

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

  // NUEVO: Función para limpiar polylines y marcadores nativos
  const clearNativeRouteOverlays = useCallback(() => {
    console.log('🧹 Limpiando overlays nativos...');
    
    // Limpiar polylines
    nativePolylinesRef.current.forEach(polyline => {
      try {
        polyline.setMap(null);
      } catch (e) {
        console.warn('Error limpiando polyline:', e);
      }
    });
    nativePolylinesRef.current = [];
    
    // Limpiar marcadores
    nativeMarkersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        console.warn('Error limpiando marker:', e);
      }
    });
    nativeMarkersRef.current = [];
    
    console.log('✅ Overlays nativos limpiados');
  }, []);

  // NUEVO: Función para dibujar la ruta usando API nativa
  const drawNativeRoute = useCallback((points) => {
    if (!mapRef || !window.google || points.length < 2) return;
    
    console.log('🎨 Dibujando ruta nativa con', points.length, 'puntos');
    
    const directionsService = new window.google.maps.DirectionsService();
    const segmentColors = [
      "#2563eb", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6",
      "#06b6d4", "#84cc16", "#f97316", "#db2777", "#0ea5e9",
    ];

    // Dividir en chunks de máximo 25 puntos
    const chunkSize = 25;
    const chunks = [];
    let start = 0;
    while (start < points.length - 1) {
      const end = Math.min(start + chunkSize - 1, points.length - 1);
      chunks.push(points.slice(start, end + 1));
      start = end;
    }

    let colorIndex = 0;

    // Procesar cada chunk
    const processChunk = async (chunk) => {
      const origin = { lat: chunk[0].lat, lng: chunk[0].lng };
      const destination = { lat: chunk[chunk.length - 1].lat, lng: chunk[chunk.length - 1].lng };
      const waypoints = chunk.slice(1, -1).slice(0, 23).map(p => ({
        location: { lat: p.lat, lng: p.lng },
        stopover: false
      }));

      return new Promise((resolve) => {
        directionsService.route(
          {
            origin,
            destination,
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (result, status) => {
            if (status === 'OK' && result.routes[0]) {
              const route = result.routes[0];
              route.legs.forEach((leg) => {
                const path = [];
                leg.steps.forEach(step => {
                  step.path.forEach(p => {
                    path.push({ lat: p.lat(), lng: p.lng() });
                  });
                });

                if (path.length >= 2) {
                  // Crear polyline nativa
                  const polyline = new window.google.maps.Polyline({
                    path: path,
                    geodesic: false,
                    strokeColor: segmentColors[colorIndex % segmentColors.length],
                    strokeOpacity: 0.95,
                    strokeWeight: 4,
                    map: mapRef,
                  });
                  
                  nativePolylinesRef.current.push(polyline);
                  colorIndex++;
                }
              });
            }
            resolve();
          }
        );
      });
    };

    // Procesar todos los chunks secuencialmente
    const processAllChunks = async () => {
      for (let i = 0; i < chunks.length; i++) {
        await processChunk(chunks[i]);
      }
      console.log('✅ Ruta dibujada completamente');
    };

    processAllChunks();

    // Dibujar marcadores numerados
    const grouped = new Map();
    points.forEach((p, i) => {
      const key = `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`;
      const arr = grouped.get(key) || [];
      arr.push({ idx: i + 1, p });
      grouped.set(key, arr);
    });

    grouped.forEach((arr) => {
      arr.sort((a, b) => a.idx - b.idx);
      const principal = arr[0];
      const others = arr.slice(1);

      // Marcador principal
      const mainMarker = new window.google.maps.Marker({
        position: { lat: principal.p.lat, lng: principal.p.lng },
        map: mapRef,
        label: {
          text: `${principal.idx}`,
          color: '#fff',
          fontSize: '14px',
          fontWeight: '900',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: '#111827',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
        zIndex: 99999,
      });
      nativeMarkersRef.current.push(mainMarker);

      // Marcadores secundarios alrededor
      if (window.google.maps.geometry && others.length > 0) {
        const center = new window.google.maps.LatLng(principal.p.lat, principal.p.lng);
        const radius = 10;
        others.forEach((item, idx) => {
          const angle = (360 / others.length) * idx;
          const pos = window.google.maps.geometry.spherical.computeOffset(center, radius, angle);
          
          const marker = new window.google.maps.Marker({
            position: { lat: pos.lat(), lng: pos.lng() },
            map: mapRef,
            label: {
              text: `${item.idx}`,
              color: '#fff',
              fontSize: '11px',
              fontWeight: '700',
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });
          nativeMarkersRef.current.push(marker);
        });
      }
    });

  }, [mapRef]);

  // Rutas diarias (SOLO cuando shouldTraceRoute === true)
  useEffect(() => {
    if (!idSabana || !isLoaded || !routeMode || !shouldTraceRoute || !mapRef) return;
    
    if (!routeDate) {
      setRoutePoints([]);
      return;
    }

    const controller = new AbortController();

    const fetchRoute = async () => {
      // FASE 1: LIMPIEZA TOTAL
      console.log('🧹 Iniciando limpieza de rutas anteriores...');
      clearNativeRouteOverlays();
      setRoutePoints([]);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // FASE 2: CARGAR NUEVA RUTA
      setRouteLoading(true);
      setRouteError(null);

      const sabanaIds = (Array.isArray(idSabana) ? idSabana : [idSabana]).map(
        (id) => ({ id: Number(id) })
      );

      try {
        console.log('🔄 Cargando nueva ruta para:', routeDate);
        
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
        const filtered = points.filter((p) => Number(p.lat) !== 0 || Number(p.lng) !== 0);
        
        console.log('✅ Nueva ruta cargada con', filtered.length, 'puntos');
        
        setRoutePoints(filtered);
        setActiveRouteDate(routeDate);
        
        // Dibujar la ruta usando API nativa
        if (filtered.length >= 2) {
          drawNativeRoute(filtered);
          
          // Ajustar bounds
          const bounds = new window.google.maps.LatLngBounds();
          filtered.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
          mapRef.fitBounds(bounds);
        }
        
        if (onRouteTraced) {
          onRouteTraced();
        }
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
  }, [idSabana, isLoaded, routeMode, routeDate, shouldTraceRoute, onRouteTraced, mapRef, clearNativeRouteOverlays, drawNativeRoute]);

  // Limpiar cuando se desactiva el modo ruta
  useEffect(() => {
    if (!routeMode) {
      clearNativeRouteOverlays();
      setRoutePoints([]);
    }
  }, [routeMode, clearNativeRouteOverlays]);

  // Limpiar si cambia la sabana
  useEffect(() => {
    clearNativeRouteOverlays();
  }, [idSabana, clearNativeRouteOverlays]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearNativeRouteOverlays();
    };
  }, [clearNativeRouteOverlays]);

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

        {/* Las rutas se dibujan nativamente, no necesitamos componentes React aquí */}
      </GoogleMap>

      {(!routeMode && (loading || error)) && (
        <div className="map-overlay-status">
            {loading && <div className="mapa-antenas-status loading">Cargando antenas...</div>}
            {error && <div className="mapa-antenas-status error">{error}</div>}
        </div>
      )}
      {(routeMode && (routeLoading || routeError)) && (
        <div className="map-overlay-status">
            {routeLoading && <div className="mapa-antenas-status loading">🗺️ Trazando ruta...</div>}
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
  shouldTraceRoute: PropTypes.bool,
  onRouteTraced: PropTypes.func,
};

export default MapAntenas;

