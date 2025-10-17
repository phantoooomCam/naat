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
  const [sabanaColorMap, setSabanaColorMap] = useState({});
  
  // MODIFICADO: Ahora es un objeto { sabanaId: points[] }
  const [routePointsBySabana, setRoutePointsBySabana] = useState({});
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [activeRouteDate, setActiveRouteDate] = useState(null);
  
  // Referencias nativas para polylines y marcadores (ahora por sábana)
  const nativeOverlaysBySabanaRef = useRef({});

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Colores únicos por sábana (ciclo infinito)
  const sabanaColors = [
    "#2563eb", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6",
    "#06b6d4", "#84cc16", "#f97316", "#db2777", "#0ea5e9",
  ];

  // NUEVO: Genera variaciones de color para segmentos de ruta
  const generateColorVariations = useCallback((baseColor, numVariations) => {
    // Convertir hex a RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Convertir RGB a HSL
    const rgbToHsl = (r, g, b) => {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
          default: h = 0;
        }
      }
      return { h: h * 360, s: s * 100, l: l * 100 };
    };

    const rgb = hexToRgb(baseColor);
    if (!rgb) return [baseColor];

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const variations = [];

    for (let i = 0; i < numVariations; i++) {
      const progress = i / Math.max(numVariations - 1, 1);
      
      // Variar el matiz (hue) en un rango de ±30 grados
      const hueShift = Math.sin(progress * Math.PI * 2) * 30;
      let newHue = (hsl.h + hueShift + 360) % 360;
      
      // Variar la saturación (50% a 100%)
      const newSat = 50 + (progress * 50);
      
      // Variar la luminosidad (35% a 65%)
      const newLight = 35 + (Math.cos(progress * Math.PI * 2) * 15) + 15;
      
      variations.push(`hsl(${newHue}, ${newSat}%, ${newLight}%)`);
    }

    return variations;
  }, []);

  // Asignar colores a las sábanas
  useEffect(() => {
    if (!idSabana) return;
    
    const sabanaIds = Array.isArray(idSabana) ? idSabana : [idSabana];
    const newColorMap = {};
    
    sabanaIds.forEach((sabId, idx) => {
      newColorMap[Number(sabId)] = sabanaColors[idx % sabanaColors.length];
    });
    
    setSabanaColorMap(newColorMap);
  }, [idSabana, sabanaColors]);

  // Antenas y sectores (deshabilitado en modo rutas)
  useEffect(() => {
    if (!idSabana || !isLoaded || routeMode) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setSites([]);
      setSectors([]);

      const sabanaIds = (Array.isArray(idSabana) ? idSabana : [idSabana]).map(id => Number(id));

      try {
        const hasFilter = Array.isArray(allowedSiteIds);
        const selectedCount = hasFilter ? allowedSiteIds.length : null;

        // Si hay filtro y está vacío, limpiamos el mapa
        if (hasFilter && selectedCount === 0) {
          setSites([]);
          setSectors([]);
          return;
        }

        // ESTRATEGIA: Cargar datos de CADA sábana por separado y asignarle su sabanaId
        const allSites = [];
        const allSectors = [];

        // Cargar cada sábana en paralelo
        await Promise.all(sabanaIds.map(async (sabanaId) => {
          const baseApiBody = {
            sabanas: [{ id: sabanaId }], // UNA sábana a la vez
            from: fromDate,
            to: toDate,
            tz: "America/Mexico_City",
            minFreq: 1,
            perSabana: false,
          };

          try {
            // --- Obtener sitios de esta sábana ---
            const sitesBody = hasFilter
              ? { ...baseApiBody, siteIds: allowedSiteIds, sortBy: "rank", order: "asc" }
              : { ...baseApiBody, topN: 1000 };

            const sitesRes = await fetchWithAuth("/api/sabanas/registros/batch/antennas/summary", {
              method: "POST",
              signal: controller.signal,
              body: JSON.stringify(sitesBody),
            });

            if (!sitesRes.ok) {
              throw new Error(`Sábana ${sabanaId} sitios: ${sitesRes.status}`);
            }

            const sitesData = await sitesRes.json();
            const fetchedSites = Array.isArray(sitesData) ? sitesData : (sitesData.items || []);
            
            // AGREGAR sabanaId a cada sitio
            fetchedSites.forEach(site => {
              allSites.push({ ...site, sabanaId });
            });

            // --- Obtener sectores de esta sábana ---
            if (fetchedSites.length > 0) {
              const siteIds = hasFilter ? allowedSiteIds : fetchedSites.map(site => site.siteId);
              
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
                throw new Error(`Sábana ${sabanaId} sectores: ${sectorsRes.status}`);
              }
              
              const sectorsData = await sectorsRes.json();
              const fetchedSectors = Array.isArray(sectorsData) ? sectorsData : (sectorsData.items || []);
              
              // AGREGAR sabanaId a cada sector
              fetchedSectors.forEach(sector => {
                allSectors.push({ ...sector, sabanaId });
              });
            }
          } catch (err) {
            if (err.name !== "AbortError") {
              console.error(`Error en sábana ${sabanaId}:`, err);
            }
          }
        }));

        console.log(`✅ Cargados ${allSites.length} sitios y ${allSectors.length} sectores de ${sabanaIds.length} sábana(s)`);
        setSites(allSites);
        setSectors(allSectors);

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

  // NUEVO: Limpia overlays de una sábana específica
  const clearNativeRouteOverlaysForSabana = useCallback((sabanaId) => {
    console.log(`🧹 Limpiando overlays de sábana ${sabanaId}...`);
    
    const overlays = nativeOverlaysBySabanaRef.current[sabanaId];
    if (!overlays) return;

    // Limpiar polylines
    (overlays.polylines || []).forEach(polyline => {
      try {
        polyline.setMap(null);
      } catch (e) {
        console.warn('Error limpiando polyline:', e);
      }
    });
    
    // Limpiar marcadores
    (overlays.markers || []).forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        console.warn('Error limpiando marker:', e);
      }
    });
    
    delete nativeOverlaysBySabanaRef.current[sabanaId];
    console.log(`✅ Overlays de sábana ${sabanaId} limpiados`);
  }, []);

  // NUEVO: Limpia TODOS los overlays de todas las sábanas
  const clearAllNativeRouteOverlays = useCallback(() => {
    console.log('🧹 Limpiando TODOS los overlays...');
    Object.keys(nativeOverlaysBySabanaRef.current).forEach(sabanaId => {
      clearNativeRouteOverlaysForSabana(Number(sabanaId));
    });
    nativeOverlaysBySabanaRef.current = {};
    console.log('✅ Todos los overlays limpiados');
  }, [clearNativeRouteOverlaysForSabana]);

  // MODIFICADO: Dibuja la ruta de UNA sábana específica
  const drawNativeRouteForSabana = useCallback((sabanaId, points, colorIndex) => {
    if (!mapRef || !window.google || points.length < 2) return;
    
    console.log(`🎨 Dibujando ruta de sábana ${sabanaId} con`, points.length, 'puntos');
    
    // Inicializar contenedor de overlays para esta sábana
    if (!nativeOverlaysBySabanaRef.current[sabanaId]) {
      nativeOverlaysBySabanaRef.current[sabanaId] = {
        polylines: [],
        markers: []
      };
    }
    
    const overlays = nativeOverlaysBySabanaRef.current[sabanaId];
    const directionsService = new window.google.maps.DirectionsService();
    const baseColor = sabanaColors[colorIndex % sabanaColors.length];
    
    // Generar variaciones de color para todos los segmentos punto a punto
    const numSegments = points.length - 1;
    const colorVariations = generateColorVariations(baseColor, numSegments);

    // Procesar CADA PAR de puntos individualmente con su propio color
    const processSegment = async (pointA, pointB, segmentIndex) => {
      return new Promise((resolve) => {
        directionsService.route(
          {
            origin: { lat: pointA.lat, lng: pointA.lng },
            destination: { lat: pointB.lat, lng: pointB.lng },
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (result, status) => {
            if (status === 'OK' && result.routes[0]) {
              const route = result.routes[0];
              const path = [];
              
              // Extraer todos los puntos del path
              route.legs.forEach((leg) => {
                leg.steps.forEach(step => {
                  step.path.forEach(p => {
                    path.push({ lat: p.lat(), lng: p.lng() });
                  });
                });
              });

              if (path.length >= 2) {
                // Usar el color único para este segmento específico
                const segmentColor = colorVariations[segmentIndex];
                
                const polyline = new window.google.maps.Polyline({
                  path: path,
                  geodesic: false,
                  strokeColor: segmentColor,
                  strokeOpacity: 0.9,
                  strokeWeight: 5,
                  map: mapRef,
                });
                
                overlays.polylines.push(polyline);
              }
            }
            resolve();
          }
        );
      });
    };

    // Procesar todos los segmentos secuencialmente
    const processAllSegments = async () => {
      for (let i = 0; i < points.length - 1; i++) {
        await processSegment(points[i], points[i + 1], i);
        // Pequeña pausa para evitar saturar la API de Google
        if (i % 10 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      console.log(`✅ Ruta de sábana ${sabanaId} dibujada con ${points.length - 1} segmentos de colores únicos`);
      
      // Dibujar marcadores después de las polylines
      drawMarkersForSabana(sabanaId, points, baseColor);
    };

    processAllSegments();
  }, [mapRef, sabanaColors, generateColorVariations]);

  // NUEVO: Dibuja marcadores numerados para una sábana
  const drawMarkersForSabana = useCallback((sabanaId, points, color) => {
    if (!mapRef || !window.google) return;
    
    const overlays = nativeOverlaysBySabanaRef.current[sabanaId];
    if (!overlays) return;

    // Agrupar puntos por coordenadas
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
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
        zIndex: 99999,
        title: `Sábana ${sabanaId} - Punto ${principal.idx}`,
      });
      overlays.markers.push(mainMarker);

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
              fillColor: color,
              fillOpacity: 0.8,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
            title: `Sábana ${sabanaId} - Punto ${item.idx}`,
          });
          overlays.markers.push(marker);
        });
      }
    });
  }, [mapRef]);

  // MODIFICADO: Carga rutas para TODAS las sábanas independientemente
  useEffect(() => {
    if (!idSabana || !isLoaded || !routeMode || !shouldTraceRoute || !mapRef) return;
    
    if (!routeDate) {
      setRoutePointsBySabana({});
      return;
    }

    const controller = new AbortController();

    const fetchAllRoutes = async () => {
      // FASE 1: LIMPIEZA TOTAL
      console.log('🧹 Iniciando limpieza de todas las rutas anteriores...');
      clearAllNativeRouteOverlays();
      setRoutePointsBySabana({});
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // FASE 2: CARGAR NUEVAS RUTAS
      setRouteLoading(true);
      setRouteError(null);

      const sabanaIds = Array.isArray(idSabana) ? idSabana : [idSabana];
      const newRoutePoints = {};
      const errors = [];

      try {
        console.log(`🔄 Cargando rutas para ${sabanaIds.length} sábana(s)...`);
        
        // Cargar rutas de cada sábana INDEPENDIENTEMENTE
        const promises = sabanaIds.map(async (sabId, colorIndex) => {
          const numericId = Number(sabId);
          
          try {
            const res = await fetchWithAuth("/api/sabanas/registros/batch/routes/day", {
              method: "POST",
              signal: controller.signal,
              body: JSON.stringify({
                sabanas: [{ id: numericId }], // UNA sábana a la vez
                date: routeDate,
                tz: "America/Mexico_City",
              }),
            });

            if (!res.ok) {
              const txt = await res.text();
              throw new Error(`Sábana ${numericId}: ${res.status} ${txt}`);
            }

            const data = await res.json();
            const points = Array.isArray(data?.points) ? data.points : [];
            const filtered = points.filter((p) => Number(p.lat) !== 0 || Number(p.lng) !== 0);
            
            console.log(`✅ Sábana ${numericId}: ${filtered.length} puntos cargados`);
            
            newRoutePoints[numericId] = filtered;
            
            // Dibujar inmediatamente
            if (filtered.length >= 2) {
              drawNativeRouteForSabana(numericId, filtered, colorIndex);
            }
          } catch (err) {
            if (err.name !== "AbortError") {
              console.error(`Error cargando sábana ${numericId}:`, err);
              errors.push(`Sábana ${numericId}: ${err.message}`);
            }
          }
        });

        await Promise.all(promises);
        
        setRoutePointsBySabana(newRoutePoints);
        setActiveRouteDate(routeDate);
        
        // Ajustar bounds para TODAS las rutas
        const allPoints = Object.values(newRoutePoints).flat();
        if (allPoints.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          allPoints.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
          mapRef.fitBounds(bounds);
        }
        
        if (errors.length > 0) {
          setRouteError(`Errores: ${errors.join('; ')}`);
        }
        
        if (onRouteTraced) {
          onRouteTraced();
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching routes:", err);
          setRouteError("Error general: " + (err.message || ""));
        }
      } finally {
        setRouteLoading(false);
      }
    };

    fetchAllRoutes();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSabana, isLoaded, routeMode, routeDate, shouldTraceRoute, mapRef]);

  // Limpiar cuando se desactiva el modo ruta
  useEffect(() => {
    if (!routeMode) {
      clearAllNativeRouteOverlays();
      setRoutePointsBySabana({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeMode]);

  // Limpiar si cambia la sabana
  useEffect(() => {
    clearAllNativeRouteOverlays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSabana]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      clearAllNativeRouteOverlays();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSites = useMemo(() => {
    if (!allowedSiteIds || allowedSiteIds.length === 0) return [];
    const set = new Set(allowedSiteIds);
    return (sites || []).filter((s) => set.has(s.siteId));
  }, [sites, allowedSiteIds]);

  // MODIFICADO: Ahora obtenemos todos los puntos de todas las sábanas
  const allRoutePoints = useMemo(() => {
    return Object.values(routePointsBySabana).flat();
  }, [routePointsBySabana]);

  const filteredSectors = useMemo(() => {
    if (!allowedSiteIds || allowedSiteIds.length === 0) return [];
    const set = new Set(allowedSiteIds);
    return (sectors || []).filter((sec) => set.has(sec.siteId));
  }, [sectors, allowedSiteIds]);

  const fitBoundsToSites = useCallback(() => {
    if (!mapRef) return;
    if (routeMode && allRoutePoints.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      allRoutePoints.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
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
  }, [mapRef, sites, filteredSites, routeMode, allRoutePoints]);

  useEffect(() => {
    if (!mapRef) return;
    if (routeMode) {
      if (allRoutePoints.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        allRoutePoints.forEach((p) => bounds.extend(new window.google.maps.LatLng(p.lat, p.lng)));
        mapRef.fitBounds(bounds);
      }
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
  }, [sites, filteredSites, mapRef, routeMode, allRoutePoints]);

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

      // Obtener color según la sábana
      const sectorColor = sabanaColorMap[sector.sabanaId] || "#2563eb";

      return {
        id: sector.sectorId,
        path: [origin, point1, point2],
        rank: sector.rankDelSitio,
        color: sectorColor,
        sabanaId: sector.sabanaId,
      };
    });
  }, [sectors, filteredSectors, isLoaded, routeMode, sabanaColorMap]);

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
        <button onClick={fitBoundsToSites} disabled={routeMode ? allRoutePoints.length === 0 : sites.length === 0}>
          Ajustar Vista
        </button>
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
            {Object.keys(sabanaColorMap).length > 1 && (
              <>
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                <div className="legend-item" style={{ fontWeight: 'bold', marginTop: '4px' }}>
                  <span>Colores por Sábana:</span>
                </div>
                {Object.entries(sabanaColorMap).map(([sabanaId, color]) => (
                  <div key={sabanaId} className="legend-item">
                    <div style={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '4px',
                      backgroundColor: color,
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}></div>
                    <span>Sábana #{sabanaId}</span>
                  </div>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <div className="legend-item">
              <span style={{ fontWeight: 'bold' }}>Rutas por Sábana:</span>
            </div>
            {Object.entries(routePointsBySabana).map(([sabanaId, points], idx) => (
              <div key={sabanaId} className="legend-item">
                <div style={{ 
                  width: 24, 
                  height: 4, 
                  background: sabanaColors[idx % sabanaColors.length] 
                }}></div>
                <span style={{ marginLeft: 8 }}>
                  Sábana {sabanaId} ({points.length} pts)
                </span>
              </div>
            ))}
          </>
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
                  fillColor: poly.color,
                  fillOpacity: 0.2,
                  strokeColor: poly.color,
                  strokeOpacity: 0.6,
                  strokeWeight: 1,
                  zIndex: poly.rank,
                }}
              />
            ))}

            {(filteredSites.length > 0 ? filteredSites : sites).map((site) => {
              const siteColor = sabanaColorMap[site.sabanaId] || "#2563eb";
              
              return (
                <OverlayView
                  key={site.siteId}
                  position={{ lat: site.lat, lng: site.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div 
                    className="antenna-marker" 
                    title={`Sitio #${site.siteId} - Rank #${site.rank} - Sábana #${site.sabanaId}`}
                    style={{ '--antenna-color': siteColor }}
                  >
                    <LuRadioTower className="antenna-icon" style={{ color: siteColor }} />
                    <span className="rank-badge" style={{ backgroundColor: siteColor }}>{site.rank}</span>
                  </div>
                </OverlayView>
              );
            })}
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
