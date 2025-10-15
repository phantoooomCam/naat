"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

const MapAntenas = ({ idSabana, fromDate, toDate, allowedSiteIds }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [sites, setSites] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapRef, setMapRef] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  useEffect(() => {
    if (!idSabana || !isLoaded) return;

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
  }, [idSabana, fromDate, toDate, isLoaded, allowedSiteIds]);

  const filteredSites = useMemo(() => {
    if (!allowedSiteIds || allowedSiteIds.length === 0) return [];
    const set = new Set(allowedSiteIds);
    return (sites || []).filter((s) => set.has(s.siteId));
  }, [sites, allowedSiteIds]);

  const filteredSectors = useMemo(() => {
    if (!allowedSiteIds || allowedSiteIds.length === 0) return [];
    const set = new Set(allowedSiteIds);
    return (sectors || []).filter((sec) => set.has(sec.siteId));
  }, [sectors, allowedSiteIds]);

  const fitBoundsToSites = useCallback(() => {
    const targets = filteredSites.length > 0 ? filteredSites : sites;
    if (mapRef && targets.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      targets.forEach((site) => {
        bounds.extend(new window.google.maps.LatLng(site.lat, site.lng));
      });
      mapRef.fitBounds(bounds);
    }
  }, [mapRef, sites, filteredSites]);

  // MODIFICADO: Este useEffect ahora se encarga de ajustar la vista inicial automáticamente
  useEffect(() => {
    const targets = filteredSites.length > 0 ? filteredSites : sites;
    if (mapRef && targets.length > 0) {
      fitBoundsToSites();
    }
  }, [sites, filteredSites, mapRef, fitBoundsToSites]);

  const onMapLoad = useCallback((map) => {
    setMapRef(map);
  }, []);

  const sectorPolygons = useMemo(() => {
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
  }, [sectors, filteredSectors, isLoaded]);

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
        <button onClick={fitBoundsToSites} disabled={sites.length === 0}>
          Ajustar Vista
        </button>
      </div>

      <div className="map-legend">
        <h4>Leyenda</h4>
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
      </GoogleMap>

      {(loading || error) && (
        <div className="map-overlay-status">
            {loading && <div className="mapa-antenas-status loading">Cargando antenas...</div>}
            {error && <div className="mapa-antenas-status error">{error}</div>}
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
  allowedSiteIds: PropTypes.arrayOf(PropTypes.string),
};

export default MapAntenas;

