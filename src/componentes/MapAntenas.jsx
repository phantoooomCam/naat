"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useJsApiLoader, GoogleMap, Marker, Polygon, Circle, InfoWindow } from "@react-google-maps/api"
import "./MapAntenas.css"

const libraries = ["geometry"]

/**
 * Mapa de Antenas — con ranking/frecuencia:
 * - Lee { latitudDecimal, longitudDecimal, azimuth, frecuencia, rank } del backend
 * - Etiqueta numérica en cada antena (rank); icono más grande para Top 1..3
 * - Sectores/círculos con strokeWeight/opacity en función del rank
 * - Sectores optimizados con 3 puntos (triángulo): centro + (azimuth-5) + (azimuth+5) a 400 m
 */
const MapAntenas = ({ idSabana, baseUrl = "http://localhost:44444", googleMapsApiKey }) => {
  const [antenas, setAntenas] = useState([])
  const [error, setError] = useState("")
  const [selectedAntenna, setSelectedAntenna] = useState(null)
  const [mapRef, setMapRef] = useState(null)

  // API Key desde prop o variable de entorno (Vite)
  const apiKey = googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  })

  // Icono de torre celular (Material Symbols "cell_tower") como data URL SVG
  const cellTowerIcon = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M7.3 14.7l1.4 1.4C9.4 15.4 10.6 15 12 15s2.6.4 3.3 1.1l1.4-1.4C15.8 13.8 14 13 12 13s-3.8.8-4.7 1.7zM4.9 12.3l1.4 1.4C7.6 12.4 9.7 11.5 12 11.5s4.4.9 5.7 2.2l1.4-1.4C17.4 10.6 14.8 9.5 12 9.5s-5.4 1.1-7.1 2.8zM2.5 9.9l1.4 1.4C5.6 9.6 8.6 8.5 12 8.5s6.4 1.1 8.1 2.8l1.4-1.4C19.7 8.1 16 6.5 12 6.5s-7.7 1.6-9.5 3.4zM12 2L8.5 5.5 10 7l2-2 2 2 1.5-1.5L12 2zm0 11c-.8 0-1.5.7-1.5 1.5S11.2 16 12 16s1.5-.7 1.5-1.5S12.8 13 12 13z"/>
      </svg>
    `
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  }, [])

  // Opciones memoizadas base; los pesos/opacity por rank se ajustan por shape
  const circleOptionsBase = useMemo(
    () => ({
      fillColor: "var(--coverage-circle-color)",
      fillOpacity: 0.18,
      strokeColor: "var(--coverage-circle-color)",
      strokeOpacity: 0.7,
      strokeWeight: 1.5,
    }),
    [],
  )

  const sectorOptionsBase = useMemo(
    () => ({
      fillColor: "var(--coverage-sector-color)",
      fillOpacity: 0.18,
      strokeColor: "var(--coverage-sector-color)",
      strokeOpacity: 0.7,
      strokeWeight: 1.5,
    }),
    [],
  )

  // Cargar antenas (ahora el backend ya devuelve frecuencia/rank)
  useEffect(() => {
    if (!idSabana) return

    const controller = new AbortController()

    const fetchAntenas = async () => {
      try {
        setError("")
        // Usa el mismo endpoint; ahora responde con frecuencia/rank en el DTO
        const url = `${baseUrl}/api/sabanas/${idSabana}/registros/coordenadas-decimales`

        const response = await fetch(url, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        const items = Array.isArray(data) ? data : data.items || data.Items || []

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
              typeof it.azimuth === "number",
          )

        // Orden: rank asc (1,2,3...), después por lat/lng estable
        normalized.sort((a, b) => {
          const ra = a.rank ?? Number.MAX_SAFE_INTEGER
          const rb = b.rank ?? Number.MAX_SAFE_INTEGER
          if (ra !== rb) return ra - rb
          if (a.latitudDecimal !== b.latitudDecimal) return a.latitudDecimal - b.latitudDecimal
          if (a.longitudDecimal !== b.longitudDecimal) return a.longitudDecimal - b.longitudDecimal
          return (a.azimuth ?? 0) - (b.azimuth ?? 0)
        })

        setAntenas(normalized)
      } catch (err) {
        if (err.name === "AbortError") return
        console.error("Error fetching antenna data:", err)
        setError(err.message || "Error desconocido")
      }
    }

    fetchAntenas()
    return () => controller.abort()
  }, [idSabana, baseUrl])

  // Helpers visuales según rank
  const iconSizeForRank = (rank) => {
    if (rank === 1) return 36
    if (rank === 2 || rank === 3) return 32
    return 30
  }

  const strokeWeightForRank = (rank) => {
    if (rank === 1) return 3
    if (rank === 2 || rank === 3) return 2.25
    return 1.5
  }

  const strokeOpacityForRank = (rank) => {
    if (rank === 1) return 0.95
    if (rank === 2 || rank === 3) return 0.85
    return 0.7
  }

  /**
   * Cobertura:
   * - Si azimuth === 360 → círculo de 400 m (con peso/opacity según rank)
   * - Si azimuth ∈ [0,360) → sector como TRIÁNGULO de 3 puntos:
   *   paths = [center, point(azimuth-5, 400m), point(azimuth+5, 400m)]
   */
  const coverageShapes = useMemo(() => {
    if (!isLoaded || !window.google || antenas.length === 0) return []

    return antenas.map((antena, index) => {
      const center = new window.google.maps.LatLng(antena.latitudDecimal, antena.longitudDecimal)
      const rank = antena.rank ?? 9999
      const weight = strokeWeightForRank(rank)
      const opacity = strokeOpacityForRank(rank)

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
        }
      }

      const leftHeading = (((antena.azimuth - 5) % 360) + 360) % 360
      const rightHeading = (((antena.azimuth + 5) % 360) + 360) % 360

      const left = window.google.maps.geometry.spherical.computeOffset(center, 400, leftHeading)
      const right = window.google.maps.geometry.spherical.computeOffset(center, 400, rightHeading)

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
      }
    })
  }, [antenas, isLoaded, circleOptionsBase, sectorOptionsBase])

  // Ajustar vista
  const fitBounds = useCallback(() => {
    if (!mapRef || antenas.length === 0) return

    if (antenas.length === 1) {
      const a = antenas[0]
      mapRef.setCenter({ lat: a.latitudDecimal, lng: a.longitudDecimal })
      mapRef.setZoom(16)
    } else {
      const bounds = new window.google.maps.LatLngBounds()
      antenas.forEach((a) => bounds.extend({ lat: a.latitudDecimal, lng: a.longitudDecimal }))
      mapRef.fitBounds(bounds)
    }
  }, [mapRef, antenas])

  // Re-render suave (por si en el futuro cambian parámetros)
  const recalculateSectors = useCallback(() => {
    setAntenas((prev) => prev)
  }, [])

  const onMapLoad = useCallback((map) => {
    setMapRef(map)
  }, [])

  if (loadError) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status error">Error cargando Google Maps: {loadError.message}</div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status loading">Cargando Google Maps...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status error">Error: {error}</div>
      </div>
    )
  }

  if (antenas.length === 0) {
    return (
      <div className="mapa-antenas-wrapper">
        <div className="mapa-antenas-status">No hay ubicaciones de antenas para mostrar.</div>
      </div>
    )
  }

  // Métricas resumen para header (Top 1)
  const top = antenas.find(a => a.rank === 1)
  const topText = top ? `Top #1: ${top.frecuencia} apariciones` : null

  return (
    <div className="mapa-antenas-wrapper">
      {/* Header con controles */}
      <div className="mapa-antenas-header">
        <h4>
          Mapa de Antenas — {antenas.length} ubicación{antenas.length !== 1 ? "es" : ""}
          {topText ? <span style={{ marginLeft: 10, color: "#6b7280", fontWeight: 500 }}>({topText})</span> : null}
        </h4>
        <div className="mapa-antenas-toolbar">
          <button className="mapa-antenas-btn" onClick={fitBounds} title="Ajustar vista">
            Ajustar vista
          </button>
          <button className="mapa-antenas-btn" onClick={recalculateSectors} title="Recalcular sectores">
            Recalcular sectores
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mapa-antenas-legend">
        <div className="legend-item">
          <div className="legend-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563eb">
              <path d="M7.3 14.7l1.4 1.4C9.4 15.4 10.6 15 12 15s2.6.4 3.3 1.1l1.4-1.4C15.8 13.8 14 13 12 13s-3.8.8-4.7 1.7zM4.9 12.3l1.4 1.4C7.6 12.4 9.7 11.5 12 11.5s4.4.9 5.7 2.2l1.4-1.4C17.4 10.6 14.8 9.5 12 9.5s-5.4 1.1-7.1 2.8zM2.5 9.9l1.4 1.4C5.6 9.6 8.6 8.5 12 8.5s6.4 1.1 8.1 2.8l1.4-1.4C19.7 8.1 16 6.5 12 6.5s-7.7 1.6-9.5 3.4zM12 2L8.5 5.5 10 7l2-2 2 2 1.5-1.5L12 2zm0 11c-.8 0-1.5.7-1.5 1.5S11.2 16 12 16s1.5-.7 1.5-1.5S12.8 13 12 13z" />
            </svg>
          </div>
          <span>Antena (número = rank)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color sector"></div>
          <span>Sector 400 m ±5° (peso según rank)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color circle"></div>
          <span>Círculo 400 m si azimuth=360°</span>
        </div>
      </div>

      {/* Mapa */}
      <GoogleMap
        mapContainerClassName="mapa-antenas-canvas"
        center={
          antenas[0]
            ? { lat: antenas[0].latitudDecimal, lng: antenas[0].longitudDecimal }
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
        {/* Marcadores con label de rank y tamaño por rank */}
        {antenas.map((antena, index) => {
          const r = antena.rank ?? 9999
          const size = iconSizeForRank(r)
          return (
            <Marker
              key={`marker-${index}`}
              position={{ lat: antena.latitudDecimal, lng: antena.longitudDecimal }}
              icon={{
                url: cellTowerIcon,
                scaledSize: new window.google.maps.Size(size, size),
                anchor: new window.google.maps.Point(size / 2, size / 2),
              }}
              label={
                antena.rank
                  ? {
                      text: String(antena.rank),
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                    }
                  : undefined
              }
              zIndex={100000 - r} // Top ranks por encima
              onClick={() => setSelectedAntenna({ ...antena, index })}
            />
          )
        })}

        {/* Cobertura (opciones ajustadas por rank por shape) */}
        {coverageShapes.map((shape) =>
          shape.type === "circle" ? (
            <Circle key={shape.key} center={shape.center} radius={shape.radius} options={shape.options} />
          ) : (
            <Polygon key={shape.key} paths={shape.paths} options={shape.options} />
          ),
        )}

        {/* InfoWindow con frecuencia y rank */}
        {selectedAntenna && (
          <InfoWindow
            position={{ lat: selectedAntenna.latitudDecimal, lng: selectedAntenna.longitudDecimal }}
            onCloseClick={() => setSelectedAntenna(null)}
          >
            <div className="antenna-info">
              <h5>
                Antena {selectedAntenna.rank ? `#${selectedAntenna.rank}` : `#${selectedAntenna.index + 1}`}
              </h5>
              <p>
                <strong>Latitud:</strong> {selectedAntenna.latitudDecimal.toFixed(6)}
              </p>
              <p>
                <strong>Longitud:</strong> {selectedAntenna.longitudDecimal.toFixed(6)}
              </p>
              <p>
                <strong>Azimuth:</strong>{" "}
                {selectedAntenna.azimuth === 360 ? "360° (Cobertura omnidireccional)" : `${selectedAntenna.azimuth}°`}
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
    </div>
  )
}

export default MapAntenas
