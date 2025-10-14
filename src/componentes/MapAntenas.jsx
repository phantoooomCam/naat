"use client";

import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import "./MapAntenas.css";

// La librería 'geometry' ya no es necesaria
const libraries = [];

/**
 * Componente que renderiza un mapa de Google vacío.
 * No recibe propiedades y está centrado por defecto en la Ciudad de México.
 */
const MapAntenas = () => {
  // La API Key se sigue cargando desde las variables de entorno
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  // Coordenadas para centrar el mapa por defecto (Ciudad de México)
  const defaultCenter = {
    lat: 19.4326,
    lng: -99.1332,
  };

  // Manejo de estado de error al cargar el script de Google Maps
  if (loadError) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status error">
          Error cargando Google Maps: {loadError.message}
        </div>
      </div>
    );
  }

  // Manejo de estado de carga
  if (!isLoaded) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status loading">Cargando Google Maps...</div>
      </div>
    );
  }

  // Renderizado del mapa
  return (
    <div className="mapa-antenas-wrapper">
      <GoogleMap
        mapContainerClassName="mapa-antenas-canvas"
        center={defaultCenter}
        zoom={12} // Un nivel de zoom adecuado para una ciudad
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {/* El mapa está intencionalmente vacío, sin marcadores ni polígonos */}
      </GoogleMap>
    </div>
  );
};

export default MapAntenas;