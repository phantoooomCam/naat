"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useJsApiLoader, GoogleMap, Marker, Polygon, Circle, InfoWindow } from "@react-google-maps/api"
import "./MapAntenas.css"

const libraries = ["geometry"]

const MapAntenas = ({ idSabana, baseUrl = "http://localhost:44444", googleMapsApiKey }) => {
  const [antenas, setAntenas] = useState([])
  const [error, setError] = useState("")
  const [selectedAntenna, setSelectedAntenna] = useState(null)
  const [mapRef, setMapRef] = useState(null)

  // Get API key from props or environment
  const apiKey = googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: libraries,
  })

  // Cell tower icon as SVG data URL
  const cellTowerIcon = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb">
        <path d="M7.3 14.7l1.4 1.4C9.4 15.4 10.6 15 12 15s2.6.4 3.3 1.1l1.4-1.4C15.8 13.8 14 13 12 13s-3.8.8-4.7 1.7zM4.9 12.3l1.4 1.4C7.6 12.4 9.7 11.5 12 11.5s4.4.9 5.7 2.2l1.4-1.4C17.4 10.6 14.8 9.5 12 9.5s-5.4 1.1-7.1 2.8zM2.5 9.9l1.4 1.4C5.6 9.6 8.6 8.5 12 8.5s6.4 1.1 8.1 2.8l1.4-1.4C19.7 8.1 16 6.5 12 6.5s-7.7 1.6-9.5 3.4zM12 2L8.5 5.5 10 7l2-2 2 2 1.5-1.5L12 2zm0 11c-.8 0-1.5.7-1.5 1.5S11.2 16 12 16s1.5-.7 1.5-1.5S12.8 13 12 13z"/>
      </svg>
    `
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  }, [])

  // Fetch antenna data
  useEffect(() => {
    if (!idSabana) return

    const controller = new AbortController()

    const fetchAntenas = async () => {
      try {
        setError("")
        const url = `${baseUrl}/api/sabanas/${idSabana}/registros/coordenadas-decimales`

        const response = await fetch(url, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const items = Array.isArray(data) ? data : data.items || data.Items || []

        // Normalize property names (support both camelCase and PascalCase)
        const normalizedItems = items
          .map((item) => ({
            latitudDecimal: item.latitudDecimal ?? item.LatitudDecimal,
            longitudDecimal: item.longitudDecimal ?? item.LongitudDecimal,
            azimuth: item.azimuth ?? item.Azimuth,
          }))
          .filter((item) => item.latitudDecimal != null && item.longitudDecimal != null && item.azimuth != null)

        setAntenas(normalizedItems)
      } catch (err) {
        if (err.name === "AbortError") return
        console.error("Error fetching antenna data:", err)
        setError(err.message || "Error desconocido")
      }
    }

    fetchAntenas()
    return () => controller.abort()
  }, [idSabana, baseUrl])

  // Calculate sector polygons and circles
  const coverageShapes = useMemo(() => {
    if (!isLoaded || !window.google || antenas.length === 0) return []

    return antenas.map((antena, index) => {
      const center = new window.google.maps.LatLng(antena.latitudDecimal, antena.longitudDecimal)

      if (antena.azimuth === 360) {
        // Full circle coverage
        return {
          type: "circle",
          key: `circle-${index}`,
          center: { lat: antena.latitudDecimal, lng: antena.longitudDecimal },
          radius: 400,
        }
      } else {
        // Sector coverage (±5° from azimuth)
        const startAngle = (((antena.azimuth - 5) % 360) + 360) % 360
        const endAngle = (((antena.azimuth + 5) % 360) + 360) % 360

        const points = [center] // Start from center

        // Generate arc points (1-degree steps for smooth curve)
        let currentAngle = startAngle
        while (true) {
          const point = window.google.maps.geometry.spherical.computeOffset(
            center,
            400, // 400 meters radius
            currentAngle,
          )
          points.push(point)

          // Handle angle wrapping
          if (startAngle <= endAngle) {
            if (currentAngle >= endAngle) break
            currentAngle = Math.min(currentAngle + 1, endAngle)
          } else {
            // Crosses 0° (e.g., 355° to 5°)
            currentAngle = (currentAngle + 1) % 360
            if (currentAngle > endAngle && currentAngle < startAngle) break
          }
        }

        points.push(center) // Close the polygon

        return {
          type: "polygon",
          key: `sector-${index}`,
          paths: points.map((point) => ({ lat: point.lat(), lng: point.lng() })),
        }
      }
    })
  }, [antenas, isLoaded])

  // Fit map bounds to show all antennas
  const fitBounds = useCallback(() => {
    if (!mapRef || antenas.length === 0) return

    if (antenas.length === 1) {
      // Single antenna - center and zoom
      const antenna = antenas[0]
      mapRef.setCenter({ lat: antenna.latitudDecimal, lng: antenna.longitudDecimal })
      mapRef.setZoom(16)
    } else {
      // Multiple antennas - fit bounds
      const bounds = new window.google.maps.LatLngBounds()
      antenas.forEach((antenna) => {
        bounds.extend({ lat: antenna.latitudDecimal, lng: antenna.longitudDecimal })
      })
      mapRef.fitBounds(bounds)
    }
  }, [mapRef, antenas])

  // Recalculate sectors (for future extensibility)
  const recalculateSectors = useCallback(() => {
    // Force re-render of coverage shapes
    setAntenas((prev) => [...prev])
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

  return (
    <div className="mapa-antenas-wrapper">
      {/* Header with controls */}
      <div className="mapa-antenas-header">
        <h4>
          Mapa de Antenas - {antenas.length} ubicación{antenas.length !== 1 ? "es" : ""}
        </h4>
        <div className="mapa-antenas-toolbar">
          <button className="mapa-antenas-btn" onClick={fitBounds} title="Ajustar vista para mostrar todas las antenas">
            Ajustar vista
          </button>
          <button className="mapa-antenas-btn" onClick={recalculateSectors} title="Recalcular sectores de cobertura">
            Recalcular sectores
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mapa-antenas-legend">
        <div className="legend-item">
          <div className="legend-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563eb">
              <path d="M7.3 14.7l1.4 1.4C9.4 15.4 10.6 15 12 15s2.6.4 3.3 1.1l1.4-1.4C15.8 13.8 14 13 12 13s-3.8.8-4.7 1.7zM4.9 12.3l1.4 1.4C7.6 12.4 9.7 11.5 12 11.5s4.4.9 5.7 2.2l1.4-1.4C17.4 10.6 14.8 9.5 12 9.5s-5.4 1.1-7.1 2.8zM2.5 9.9l1.4 1.4C5.6 9.6 8.6 8.5 12 8.5s6.4 1.1 8.1 2.8l1.4-1.4C19.7 8.1 16 6.5 12 6.5s-7.7 1.6-9.5 3.4zM12 2L8.5 5.5 10 7l2-2 2 2 1.5-1.5L12 2zm0 11c-.8 0-1.5.7-1.5 1.5S11.2 16 12 16s1.5-.7 1.5-1.5S12.8 13 12 13z" />
            </svg>
          </div>
          <span>Antena</span>
        </div>
        <div className="legend-item">
          <div className="legend-color sector"></div>
          <span>Sector 400 m ±5°</span>
        </div>
        <div className="legend-item">
          <div className="legend-color circle"></div>
          <span>Círculo 400 m (azimuth=360°)</span>
        </div>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerClassName="mapa-antenas-canvas"
        center={
          antenas[0]
            ? {
                lat: antenas[0].latitudDecimal,
                lng: antenas[0].longitudDecimal,
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
        {/* Antenna markers */}
        {antenas.map((antena, index) => (
          <Marker
            key={`marker-${index}`}
            position={{ lat: antena.latitudDecimal, lng: antena.longitudDecimal }}
            icon={{
              url: cellTowerIcon,
              scaledSize: new window.google.maps.Size(30, 30),
              anchor: new window.google.maps.Point(15, 15),
            }}
            onClick={() => setSelectedAntenna({ ...antena, index })}
          />
        ))}

        {/* Coverage shapes */}
        {coverageShapes.map((shape) => {
          if (shape.type === "circle") {
            return (
              <Circle
                key={shape.key}
                center={shape.center}
                radius={shape.radius}
                options={{
                  fillColor: "var(--coverage-circle-color)",
                  fillOpacity: 0.18,
                  strokeColor: "var(--coverage-circle-color)",
                  strokeOpacity: 0.7,
                  strokeWeight: 1.5,
                }}
              />
            )
          } else {
            return (
              <Polygon
                key={shape.key}
                paths={shape.paths}
                options={{
                  fillColor: "var(--coverage-sector-color)",
                  fillOpacity: 0.18,
                  strokeColor: "var(--coverage-sector-color)",
                  strokeOpacity: 0.7,
                  strokeWeight: 1.5,
                }}
              />
            )
          }
        })}

        {/* Info window */}
        {selectedAntenna && (
          <InfoWindow
            position={{
              lat: selectedAntenna.latitudDecimal,
              lng: selectedAntenna.longitudDecimal,
            }}
            onCloseClick={() => setSelectedAntenna(null)}
          >
            <div className="antenna-info">
              <h5>Antena #{selectedAntenna.index + 1}</h5>
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
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

export default MapAntenas
