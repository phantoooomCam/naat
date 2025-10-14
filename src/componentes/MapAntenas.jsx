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

// Esta función ahora está corregida para enviar credenciales (cookies).
// Si tienes esta función en un archivo de utilidades, puedes importarla en lugar de definirla aquí.
const fetchWithAuth = (url, options) => {
  return fetch(url, {
    ...options,
    credentials: "include", // CORRECCIÓN: Permite el envío de cookies de autenticación.
    headers: {
      "Content-Type": "application/json",
      // ...cualquier otra cabecera de autenticación que necesites
      ...options.headers,
    },
  });
};

// Se necesita la librería 'geometry' para calcular los conos de azimut
const libraries = ["geometry"];

const MapAntenas = ({ idSabana, fromDate, toDate }) => {
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

      // Normaliza el idSabana para que siempre sea un array de objetos
      const sabanaIds = (Array.isArray(idSabana) ? idSabana : [idSabana]).map(
        (id) => ({ id: Number(id) })
      );

      const apiBody = {
        sabanas: sabanaIds,
        from: fromDate || null,
        to: toDate || null,
        minFreq: 1,
        perSabana: false,
      };

      try {
        const [sitesRes, sectorsRes] = await Promise.all([
          // 1. Llamada para obtener sitios y ranking
          fetchWithAuth("/api/sabanas/registros/batch/antennas/summary", {
            method: "POST",
            signal: controller.signal,
            body: JSON.stringify({ ...apiBody, topN: 200 }),
          }),
          // 2. Llamada para obtener los azimuts
          fetchWithAuth("/api/sabanas/registros/batch/sectors/summary", {
            method: "POST",
            signal: controller.signal,
            body: JSON.stringify({ ...apiBody, topN: 1000 }),
          }),
        ]);

        if (!sitesRes.ok) {
            const errorData = await sitesRes.text();
            throw new Error(`Fallo al obtener sitios: ${sitesRes.status} ${errorData}`);
        }
        if (!sectorsRes.ok) {
            const errorData = await sectorsRes.text();
            throw new Error(`Fallo al obtener sectores: ${sectorsRes.status} ${errorData}`);
        }

        const sitesData = await sitesRes.json();
        const sectorsData = await sectorsRes.json();

        setSites(sitesData.items || []);
        setSectors(sectorsData.items || []);

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
  }, [idSabana, fromDate, toDate, isLoaded]);

  // Centra y ajusta el zoom del mapa para ver todos los sitios
  const fitBoundsToSites = useCallback(() => {
    if (mapRef && sites.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      sites.forEach((site) => {
        bounds.extend(new window.google.maps.LatLng(site.lat, site.lng));
      });
      mapRef.fitBounds(bounds);
    }
  }, [mapRef, sites]);

  // Ajusta la vista cuando los sitios cambian
  useEffect(() => {
    if (sites.length > 0) {
        fitBoundsToSites();
    }
  }, [sites, fitBoundsToSites]);

  const onMapLoad = useCallback((map) => {
    setMapRef(map);
  }, []);

  // Memoiza el cálculo de los polígonos para optimizar el rendimiento
  const sectorPolygons = useMemo(() => {
    if (!sectors.length || !isLoaded || !window.google.maps.geometry) return [];

    return sectors.map((sector) => {
      const origin = new window.google.maps.LatLng(sector.lat, sector.lng);
      // Calcula los dos puntos finales del cono
      const point1 = window.google.maps.geometry.spherical.computeOffset(
        origin,
        400, // 400m de distancia
        sector.azimuth - 5 // Ángulo -5 grados
      );
      const point2 = window.google.maps.geometry.spherical.computeOffset(
        origin,
        400, // 400m de distancia
        sector.azimuth + 5 // Ángulo +5 grados
      );

      return {
        id: sector.sectorId,
        path: [origin, point1, point2],
        rank: sector.rankDelSitio,
      };
    });
  }, [sectors, isLoaded]);

  // Manejo de estado de error de la API de Google Maps
  if (loadError) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status error">
          Error al cargar Google Maps: {loadError.message}
        </div>
      </div>
    );
  }

  // Manejo de estado de carga inicial del mapa
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
        center={{ lat: 19.4326, lng: -99.1332 }} // Centro por defecto
        zoom={5}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Renderiza los polígonos de los sectores */}
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
                zIndex: poly.rank, // El ranking puede influir en la superposición
              }}
            />
        ))}

        {/* Renderiza los marcadores de los sitios */}
        {sites.map((site) => (
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

      {/* Muestra un mensaje de carga o error sobre el mapa */}
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
};

export default MapAntenas;