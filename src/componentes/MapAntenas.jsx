"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
  OverlayView,
  InfoWindow,
} from "@react-google-maps/api";
// NUEVO: Librerías para captura y PDF
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { LuRadioTower } from "react-icons/lu";
import { FiBarChart2, FiLoader, FiMap, FiFileText, FiZap, FiClock } from "react-icons/fi";
import { useIntersectingSectors } from "../assets/hooks/useIntersectingSectors";
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

// NUEVO: Cache simple en memoria
const dataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getCacheKey = (sabanaId, fromDate, toDate, type) => {
  return `${type}_${sabanaId}_${fromDate}_${toDate}`;
};

const MapAntenas = ({ 
  idSabana, 
  fromDate, 
  toDate, 
  allowedSiteIds, 
  routeMode = false, 
  routeDate = null, 
  shouldTraceRoute = false, 
  onRouteTraced = null,
  intersectionMode = false,
  intersectionHour = null,
  onIntersectionStats = null,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [sites, setSites] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSectors, setLoadingSectors] = useState(false); // NUEVO: Estado separado para sectores
  const [error, setError] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [sabanaColorMap, setSabanaColorMap] = useState({});
  
  // MODIFICADO: Ahora es un objeto { sabanaId: points[] }
  const [routePointsBySabana, setRoutePointsBySabana] = useState({});
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [activeRouteDate, setActiveRouteDate] = useState(null);
  
  // NUEVO: Estados para modo de intersección
  const [intersectionSectors, setIntersectionSectors] = useState([]);
  const [loadingIntersections, setLoadingIntersections] = useState(false);
  const [intersectionError, setIntersectionError] = useState(null);
  
  // NUEVO: Estados para InfoWindow de sectores
  const [selectedSector, setSelectedSector] = useState(null);
  const [sectorTimeInfo, setSectorTimeInfo] = useState({});
  // NUEVO: Estados de exportación a PDF
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  
  // Referencias nativas para polylines y marcadores (ahora por sábana)
  const nativeOverlaysBySabanaRef = useRef({});
  const sectorsLoadedRef = useRef(false); // NUEVO: Bandera para cargar sectores solo una vez

  // NUEVO: Hook para detectar intersecciones
  const { highlightedIds, pairs, stats } = useIntersectingSectors(
    intersectionMode ? intersectionSectors : [],
    600, // distancia máxima
    5    // mitad del cono
  );

  // NUEVO: Notificar estadísticas al componente padre
  useEffect(() => {
    if (intersectionMode && onIntersectionStats) {
      onIntersectionStats(stats);
    }
  }, [intersectionMode, stats, onIntersectionStats]);

  // NUEVO: Procesar información de tiempo de los sectores
  useEffect(() => {
    if (!intersectionMode || !intersectionSectors.length) {
      setSectorTimeInfo({});
      return;
    }

    // Agrupar sectores por sectorId para obtener todas las horas en que se usó
    const timeInfo = {};
    intersectionSectors.forEach(sector => {
      if (!timeInfo[sector.sectorId]) {
        timeInfo[sector.sectorId] = {
          hours: [],
          sector: sector
        };
      }
      // Si el sector tiene información de hora, agregarla
      if (sector.timestamp || sector.hora) {
        const hora = sector.timestamp || sector.hora;
        if (!timeInfo[sector.sectorId].hours.includes(hora)) {
          timeInfo[sector.sectorId].hours.push(hora);
        }
      }
    });

    setSectorTimeInfo(timeInfo);
  }, [intersectionMode, intersectionSectors]);

  // NUEVO: Función para formatear la hora
  const formatHour = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return timestamp;
    }
  };

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Colores únicos por sábana - Paleta personalizada
  const baseSabanaColors = [
    "#001219", "#005f73", "#0a9396", "#ee9b00", 
    "#ca6702", "#bb3e03", "#ae2012", "#9b2226",
  ];

  // NUEVO: Generar colores adicionales semejantes si se necesitan más de 8 sábanas
  const generateSimilarColor = useCallback((baseColor, variation) => {
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgbToHsl = (r, g, b) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
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

    const hslToRgb = (h, s, l) => {
      h /= 360; s /= 100; l /= 100;
      let r, g, b;

      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
      };
    };

    const rgb = hexToRgb(baseColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Variar el tono ligeramente y ajustar luminosidad
    const newHue = (hsl.h + (variation * 15)) % 360;
    const newSat = Math.min(100, Math.max(20, hsl.s + (variation * 10)));
    const newLight = Math.min(70, Math.max(20, hsl.l + (variation * 8)));
    
    const newRgb = hslToRgb(newHue, newSat, newLight);
    return `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
  }, []);

  // Generar array de colores extendido si hay más sábanas
  const sabanaColors = useMemo(() => {
    const sabanaCount = Array.isArray(idSabana) ? idSabana.length : 1;
    
    if (sabanaCount <= baseSabanaColors.length) {
      return baseSabanaColors;
    }
    
    // Si necesitamos más colores, generamos variaciones
    const extendedColors = [...baseSabanaColors];
    const neededColors = sabanaCount - baseSabanaColors.length;
    
    for (let i = 0; i < neededColors; i++) {
      const baseColorIndex = i % baseSabanaColors.length;
      const variation = Math.floor(i / baseSabanaColors.length) + 1;
      const newColor = generateSimilarColor(baseSabanaColors[baseColorIndex], variation);
      extendedColors.push(newColor);
    }
    
    return extendedColors;
  }, [idSabana, generateSimilarColor]);

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

  // OPTIMIZADO: Cargar solo sitios inicialmente
  useEffect(() => {
    if (!idSabana || !isLoaded || routeMode) return;

    const controller = new AbortController();
    sectorsLoadedRef.current = false; // Reset al cambiar parámetros

    const fetchSites = async () => {
      setLoading(true);
      setError(null);
      setSites([]);
      setSectors([]); // Limpiar sectores

      const sabanaIds = (Array.isArray(idSabana) ? idSabana : [idSabana]).map(id => Number(id));

      try {
        const hasFilter = Array.isArray(allowedSiteIds);
        const selectedCount = hasFilter ? allowedSiteIds.length : null;

        if (hasFilter && selectedCount === 0) {
          setSites([]);
          setSectors([]);
          return;
        }

        const allSites = [];

        // OPTIMIZACIÓN: Cargar sitios en paralelo con Promise.allSettled (más robusto)
        const results = await Promise.allSettled(sabanaIds.map(async (sabanaId) => {
          // Verificar cache
          const cacheKey = getCacheKey(sabanaId, fromDate, toDate, 'sites');
          const cached = dataCache.get(cacheKey);
          
          if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return cached.data;
          }

          const baseApiBody = {
            sabanas: [{ id: sabanaId }],
            from: fromDate,
            to: toDate,
            tz: "America/Mexico_City",
            minFreq: 1,
            perSabana: false,
          };

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
          
          const sitesWithSabanaId = fetchedSites.map(site => ({ ...site, sabanaId }));
          
          // Guardar en cache
          dataCache.set(cacheKey, {
            data: sitesWithSabanaId,
            timestamp: Date.now()
          });
          
          return sitesWithSabanaId;
        }));

        // Procesar resultados (incluyendo errores)
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            allSites.push(...result.value);
          }
        });
        
        setSites(allSites);

      } catch (err) {
        if (err.name !== "AbortError") {
          setError("No se pudieron cargar los datos de las antenas. " + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSites();

    return () => {
      controller.abort();
    };
  }, [idSabana, fromDate, toDate, isLoaded, allowedSiteIds, routeMode]);

  // NUEVO: Cargar sectores solo cuando el mapa esté listo y visible
  useEffect(() => {
    if (!sites.length || sectorsLoadedRef.current || !mapRef || !isLoaded || routeMode) return;

    const controller = new AbortController();

    const fetchSectors = async () => {
      setLoadingSectors(true);

      const sabanaIds = [...new Set(sites.map(s => s.sabanaId))];
      const allSectors = [];

      try {
        const hasFilter = Array.isArray(allowedSiteIds);
        
        const results = await Promise.allSettled(sabanaIds.map(async (sabanaId) => {
          // Verificar cache
          const cacheKey = getCacheKey(sabanaId, fromDate, toDate, 'sectors');
          const cached = dataCache.get(cacheKey);
          
          if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return cached.data;
          }

          const baseApiBody = {
            sabanas: [{ id: sabanaId }],
            from: fromDate,
            to: toDate,
            tz: "America/Mexico_City",
            minFreq: 1,
            perSabana: false,
          };

          const sitesInThisSabana = sites.filter(s => s.sabanaId === sabanaId);
          const siteIds = hasFilter 
            ? allowedSiteIds 
            : sitesInThisSabana.map(site => site.siteId);

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
          
          const sectorsWithSabanaId = fetchedSectors.map(sector => ({ ...sector, sabanaId }));
          
          // Guardar en cache
          dataCache.set(cacheKey, {
            data: sectorsWithSabanaId,
            timestamp: Date.now()
          });
          
          return sectorsWithSabanaId;
        }));

        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            allSectors.push(...result.value);
          }
        });
        
        setSectors(allSectors);
        sectorsLoadedRef.current = true;

      } catch (err) {
        // Error silencioso para sectores
      } finally {
        setLoadingSectors(false);
      }
    };

    // Delay para dar prioridad a la renderización del mapa
    const timeoutId = setTimeout(fetchSectors, 100);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [sites, mapRef, isLoaded, fromDate, toDate, allowedSiteIds, routeMode]);

  // NUEVO: Cargar sectores para análisis de intersección
  useEffect(() => {
    if (!intersectionMode || !intersectionHour || !idSabana || !isLoaded) {
      setIntersectionSectors([]);
      return;
    }

    const controller = new AbortController();

    const fetchIntersectionSectors = async () => {
      setLoadingIntersections(true);
      setIntersectionError(null);

      try {
        // Convertir hora local a UTC (ventana de 1 hora)
        const fromLocal = new Date(intersectionHour);
        fromLocal.setMinutes(0, 0, 0);
        const toLocal = new Date(fromLocal);
        toLocal.setHours(toLocal.getHours() + 1);

        const sabanaIds = Array.isArray(idSabana) ? idSabana : [idSabana];
        const allSectors = [];

        // Cargar sectores para cada sábana
        const results = await Promise.allSettled(
          sabanaIds.map(async (sabanaId) => {
            const body = {
              sabanas: [{ id: Number(sabanaId) }],
              from: fromLocal.toISOString(),
              to: toLocal.toISOString(),
              tz: "America/Mexico_City",
              topN: 500, // Limitar para rendimiento
              minFreq: 1,
              perSabana: false,
            };

            const res = await fetchWithAuth(
              "/api/sabanas/registros/batch/sectors/summary",
              {
                method: "POST",
                signal: controller.signal,
                body: JSON.stringify(body),
              }
            );

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            const sectors = Array.isArray(data) ? data : (data.items || []);
            return sectors.map(s => ({ ...s, sabanaId: Number(sabanaId) }));
          })
        );

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            allSectors.push(...result.value);
          }
        });

        setIntersectionSectors(allSectors);
      } catch (err) {
        if (err.name !== "AbortError") {
          setIntersectionError("Error al cargar sectores: " + err.message);
        }
      } finally {
        setLoadingIntersections(false);
      }
    };

    fetchIntersectionSectors();

    return () => controller.abort();
  }, [intersectionMode, intersectionHour, idSabana, isLoaded]);

  // NUEVO: Limpia overlays de una sábana específica
  const clearNativeRouteOverlaysForSabana = useCallback((sabanaId) => {
    const overlays = nativeOverlaysBySabanaRef.current[sabanaId];
    if (!overlays) return;

    // Limpiar polylines
    (overlays.polylines || []).forEach(polyline => {
      try {
        polyline.setMap(null);
      } catch (e) {
        // Error silencioso
      }
    });
    
    // Limpiar marcadores
    (overlays.markers || []).forEach(marker => {
      try {
        marker.setMap(null);
      } catch (e) {
        // Error silencioso
      }
    });
    
    delete nativeOverlaysBySabanaRef.current[sabanaId];
  }, []);

  // NUEVO: Limpia TODOS los overlays de todas las sábanas
  const clearAllNativeRouteOverlays = useCallback(() => {
    Object.keys(nativeOverlaysBySabanaRef.current).forEach(sabanaId => {
      clearNativeRouteOverlaysForSabana(Number(sabanaId));
    });
    nativeOverlaysBySabanaRef.current = {};
  }, [clearNativeRouteOverlaysForSabana]);

  // MODIFICADO: Dibuja la ruta de UNA sábana específica
  const drawNativeRouteForSabana = useCallback((sabanaId, points, colorIndex) => {
    if (!mapRef || !window.google || points.length < 2) return;
    
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
            
            newRoutePoints[numericId] = filtered;
            
            // Dibujar inmediatamente
            if (filtered.length >= 2) {
              drawNativeRouteForSabana(numericId, filtered, colorIndex);
            }
          } catch (err) {
            if (err.name !== "AbortError") {
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

  // OPTIMIZADO: Memoizar sitios filtrados - retornar todos si no hay filtro
  const filteredSites = useMemo(() => {
    if (!allowedSiteIds || allowedSiteIds.length === 0) return sites;
    const set = new Set(allowedSiteIds);
    return sites.filter((s) => set.has(s.siteId));
  }, [sites, allowedSiteIds]);

  // MODIFICADO: Ahora obtenemos todos los puntos de todas las sábanas
  const allRoutePoints = useMemo(() => {
    return Object.values(routePointsBySabana).flat();
  }, [routePointsBySabana]);

  // OPTIMIZADO: Memoizar sectores filtrados - retornar todos si no hay filtro
  const filteredSectors = useMemo(() => {
    if (!allowedSiteIds || allowedSiteIds.length === 0) return sectors;
    const set = new Set(allowedSiteIds);
    return sectors.filter((sec) => set.has(sec.siteId));
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

  // NUEVO: Exportar el mapa a PDF (capturando el contenedor del mapa)
  const handleExportPdf = useCallback(async () => {
    if (!mapRef) return;
    try {
      setExporting(true);
      setExportError(null);

      // Obtener el elemento DOM del mapa (incluye overlays, polígonos, info windows y marcadores)
      const mapElement = mapRef.getDiv();

      // Asegurar fondo blanco en la captura y mayor resolución
      const scale = Math.max(window.devicePixelRatio || 1, 2);
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scale,
        logging: false,
        windowWidth: mapElement.scrollWidth,
        windowHeight: mapElement.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Elegir orientación de la hoja según la imagen
      const orientation = imgW >= imgH ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgAspect = imgW / imgH;

      // Escalar la imagen para que quepa en la página manteniendo proporción
      let renderW = pageW;
      let renderH = renderW / imgAspect;
      if (renderH > pageH) {
        renderH = pageH;
        renderW = renderH * imgAspect;
      }
      const x = (pageW - renderW) / 2;
      const y = (pageH - renderH) / 2;

      pdf.addImage(imgData, "PNG", x, y, renderW, renderH, undefined, "FAST");

      const sabanaIds = Array.isArray(idSabana) ? idSabana.join("-") : idSabana;
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      pdf.save(`Mapa-${sabanaIds || "sabanas"}-${ts}.pdf`);
    } catch (e) {
      setExportError("No se pudo exportar el mapa. " + (e?.message || ""));
    } finally {
      setExporting(false);
    }
  }, [mapRef, idSabana]);

  // OPTIMIZADO: Calcular polígonos solo cuando cambian los sectores
  const sectorPolygons = useMemo(() => {
    if (routeMode) return [];
    
    const source = intersectionMode 
      ? intersectionSectors 
      : (filteredSectors.length > 0 ? filteredSectors : sectors);
    
    if (!source.length || !isLoaded || !window.google?.maps?.geometry) return [];

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

      // Determinar color: fucsia si intersecta, color de sábana si no
      const isHighlighted = highlightedIds.has(sector.sectorId);
      const baseColor = sabanaColorMap[sector.sabanaId] || "#2563eb";
      const sectorColor = isHighlighted ? "#ff00ff" : baseColor;
      const opacity = isHighlighted ? 1 : 0.6;
      const fillOpacity = isHighlighted ? 0.4 : 0.2;

      return {
        id: sector.sectorId,
        path: [origin, point1, point2],
        rank: sector.rankDelSitio,
        color: sectorColor,
        sabanaId: sector.sabanaId,
        isHighlighted,
        opacity,
        fillOpacity,
      };
    });
  }, [sectors, filteredSectors, intersectionSectors, isLoaded, routeMode, 
      sabanaColorMap, highlightedIds, intersectionMode]);

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
      <div className="map-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={fitBoundsToSites} disabled={routeMode ? allRoutePoints.length === 0 : sites.length === 0}>
          Ajustar Vista
        </button>
        <button
          onClick={handleExportPdf}
          disabled={!mapRef || exporting}
          style={{ marginLeft: 'auto' }}
          title={!mapRef ? "Mapa no listo" : "Exportar vista actual a PDF"}
        >
          {exporting ? "Exportando…" : "Exportar PDF"}
        </button>
      </div>

      <div className="map-legend">
        <h4>Leyenda</h4>
        {intersectionMode ? (
          <>
            <div className="legend-item">
              <div style={{ 
                width: 24, 
                height: 4, 
                backgroundColor: '#ff00ff',
                boxShadow: '0 0 10px #ff00ff'
              }}></div>
              <span style={{ fontWeight: 'bold' }}>Sectores Coincidentes</span>
            </div>
            <div className="legend-item">
              <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                <FiBarChart2 style={{ marginRight: 6 }} />
                Total: {stats.total} | Coinciden: {stats.intersecting} | Pares: {stats.pairsCount}
              </span>
            </div>
            <div className="legend-item" style={{ fontSize: '11px', marginTop: '8px' }}>
              <span>Criterio: ≤600m, azimuths ±5°</span>
            </div>
            {loadingIntersections && (
              <div className="legend-item" style={{ color: '#f59e0b', fontSize: '11px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <FiLoader style={{ marginRight: 6 }} /> Analizando intersecciones...
                </span>
              </div>
            )}
          </>
        ) : !routeMode ? (
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
            {/* NUEVO: Indicador de carga de sectores */}
            {loadingSectors && (
              <div className="legend-item" style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <FiLoader style={{ marginRight: 6 }} /> Cargando sectores...
                </span>
              </div>
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
              <React.Fragment key={poly.id}>
                <Polygon
                  path={poly.path}
                  onClick={() => {
                    if (intersectionMode && poly.isHighlighted) {
                      setSelectedSector(poly);
                    }
                  }}
                  options={{
                    fillColor: poly.color,
                    fillOpacity: poly.fillOpacity || 0.2,
                    strokeColor: poly.color,
                    strokeOpacity: poly.opacity || 0.6,
                    strokeWeight: poly.isHighlighted ? 3 : 1,
                    zIndex: poly.isHighlighted ? 10000 + poly.rank : poly.rank,
                    clickable: intersectionMode && poly.isHighlighted,
                    cursor: intersectionMode && poly.isHighlighted ? 'pointer' : 'default',
                  }}
                />
                
                {/* InfoWindow para sectores coincidentes */}
                {intersectionMode && selectedSector?.id === poly.id && (
                  <InfoWindow
                    position={{
                      lat: poly.path[0].lat(),
                      lng: poly.path[0].lng()
                    }}
                    onCloseClick={() => setSelectedSector(null)}
                  >
                    <div style={{ 
                      padding: '12px',
                      minWidth: '200px',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                      <h3 style={{ 
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        borderBottom: '2px solid #ff00ff',
                        paddingBottom: '6px'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <FiZap style={{ color: '#f59e0b' }} />
                          Sector Coincidente
                        </span>
                      </h3>
                      <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                        <p style={{ margin: '6px 0' }}>
                          <strong>Sector ID:</strong> {poly.id}
                        </p>
                        <p style={{ margin: '6px 0' }}>
                          <strong>Sábana:</strong> #{poly.sabanaId}
                        </p>
                        <p style={{ margin: '6px 0' }}>
                          <strong>Ranking:</strong> #{poly.rank}
                        </p>
                        
                        {sectorTimeInfo[poly.id]?.hours.length > 0 && (
                          <>
                            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                            <p style={{ margin: '6px 0', fontWeight: 'bold', color: '#ff00ff' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <FiClock /> Horas de Uso:
                              </span>
                            </p>
                            <ul style={{ 
                              margin: '4px 0', 
                              paddingLeft: '20px',
                              listStyle: 'none'
                            }}>
                              {sectorTimeInfo[poly.id].hours.map((hora, idx) => (
                                <li key={idx} style={{ 
                                  padding: '3px 0',
                                  fontSize: '13px',
                                  color: '#64748b'
                                }}>
                                  • {formatHour(hora)}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </React.Fragment>
            ))}

            {(filteredSites.length > 0 ? filteredSites : sites).map((site) => {
              const siteColor = sabanaColorMap[site.sabanaId] || "#2563eb";
              
              return (
                <OverlayView
                  key={`${site.siteId}_${site.sabanaId}`}
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

      {(!routeMode && !intersectionMode && (loading || error)) && (
        <div className="map-overlay-status">
            {loading && (
              <div className="mapa-antenas-status loading" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiLoader /> Cargando sitios...
              </div>
            )}
            {error && <div className="mapa-antenas-status error">{error}</div>}
        </div>
      )}
      
      {intersectionMode && intersectionError && (
        <div className="map-overlay-status">
          <div className="mapa-antenas-status error">{intersectionError}</div>
        </div>
      )}
      
      {(routeMode && (routeLoading || routeError)) && (
        <div className="map-overlay-status">
            {routeLoading && (
              <div className="mapa-antenas-status loading" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiMap /> Trazando ruta...
              </div>
            )}
            {routeError && <div className="mapa-antenas-status error">{routeError}</div>}
        </div>
      )}

      {/* NUEVO: Estado y errores de exportación */}
      {(exporting || exportError) && (
        <div className="map-overlay-status">
          {exporting && (
            <div className="mapa-antenas-status loading" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FiFileText /> Generando PDF…
            </div>
          )}
          {exportError && (
            <div className="mapa-antenas-status error">{exportError}</div>
          )}
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
  intersectionMode: PropTypes.bool,
  intersectionHour: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onIntersectionStats: PropTypes.func,
};

export default MapAntenas;
