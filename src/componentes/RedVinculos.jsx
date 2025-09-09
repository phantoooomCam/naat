"use client"

import { useEffect, useRef, useState } from "react"
import PropTypes from "prop-types"

const RedVinculos = ({ idSabana, filtrosActivos }) => {
  const cyRef = useRef(null)
  const [cy, setCy] = useState(null)
  const [stats, setStats] = useState({ nodes: 0, edges: 0 })
  const [relaciones, setRelaciones] = useState([])
  const [error, setError] = useState(null)

  const getTypeText = (typeId) => {
    const typeMap = {
      0: "Datos",
      1: "MensajeriaMultimedia",
      2: "Mensaje2ViasEnt",
      3: "Mensaje2ViasSal",
      4: "VozEntrante",
      5: "VozSaliente",
      6: "VozTransfer",
      7: "VozTransito",
      8: "Ninguno",
      9: "Wifi",
      10: "ReenvioSal",
      11: "ReenvioEnt",
    }
    return typeMap?.[typeId] ?? `Tipo ${typeId}`
  }

  const getTypeIcon = (typeId) => {
    const iconMap = {
      0: ( // Datos
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
        </svg>
      ),
      1: ( // MensajeriaMultimedia
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      ),
      2: ( // Mensaje2ViasEnt
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      ),
      3: ( // Mensaje2ViasSal
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48L12 17l7.15-4.05L20 11.47 12 7.53 4 11.47z" />
        </svg>
      ),
      4: ( // VozEntrante
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          <path d="M19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7z" />
          <path d="M15 12h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
        </svg>
      ),
      5: ( // VozSaliente
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
      ),
      6: ( // VozTransfer
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          <path d="M16 1H8C6.34 1 2 2.34 2 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3z" />
        </svg>
      ),
      7: ( // VozTransito
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3 3 3-3L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      ),
      8: ( // Ninguno
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
      9: ( // Wifi
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
        </svg>
      ),
      10: ( // ReenvioSal
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
      ),
      11: ( // ReenvioEnt
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      ),
    }
    return (
      iconMap?.[typeId] ?? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      )
    )
  }

  const getTypeColor = (typeId) => {
    const colorMap = {
      0: "#3498db",
      1: "#9b59b6",
      2: "#2ecc71",
      3: "#27ae60",
      4: "#e74c3c",
      5: "#c0392b",
      6: "#f39c12",
      7: "#d35400",
      8: "#95a5a6",
      9: "#1abc9c",
      10: "#8e44ad",
      11: "#2c3e50",
    }
    return colorMap?.[typeId] ?? "#7f8c8d"
  }

  useEffect(() => {
    if (!idSabana) return
    const controller = new AbortController()

    const fetchRelaciones = async () => {
      try {
        setError(null)
        const API_URL = "/api"
        const url = `${API_URL}/sabanas/${idSabana}/registros/relaciones-unicas`

        const res = await fetch(`/api/sabanas/${idSabana}/registros/relaciones-unicas`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
        console.log("raw fetch status:", res?.status)

        if (!res) {
          setError("Sin respuesta del servidor (res = null). Revisa autenticación o el helper fetchWithAuth.")
          setRelaciones([])
          return
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        let data = null
        try {
          data = await res.json()
        } catch {
          data = null
        }

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.Items)
              ? data.Items
              : data
                ? [data]
                : []

        setRelaciones(items)
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Error desconocido")
        setRelaciones([])
      }
    }

    fetchRelaciones()
    return () => controller.abort()
  }, [idSabana])

  useEffect(() => {
    const loadCytoscape = async () => {
      if (window.cytoscape) {
        initializeNetwork()
        return
      }
      const script = document.createElement("script")
      script.src = "https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js"
      script.onload = () => initializeNetwork()
      document.head.appendChild(script)
    }

    const initializeNetwork = () => {
      if (!cyRef.current || !window.cytoscape) return

      const numerosA = new Set()
      const numerosB = new Set()
      const edges = []

      const relacionesFiltradas = relaciones.filter((r) => {
        const tipoId = Number(r.id_tipo_registro ?? r.IdTipoRegistro ?? r.idTipoRegistro ?? r.tipo ?? 8)
        return filtrosActivos[tipoId]
      })

      relacionesFiltradas.forEach((r, index) => {
        const numeroA = (r.numero_a ?? r.NumeroA ?? r.numeroA ?? r.origen ?? "").toString().trim()
        const numeroB = (r.numero_b ?? r.NumeroB ?? r.numeroB ?? r.destino ?? "").toString().trim()

        const tipoId = Number(r.id_tipo_registro ?? r.IdTipoRegistro ?? r.idTipoRegistro ?? r.tipo ?? 8)

        const fecha = r.fecha_hora ?? r.FechaHora ?? r.fechaHora ?? r.fecha ?? null
        const duracion = Number(r.duracion ?? r.Duracion ?? 0)

        if (!numeroA || !numeroB) return

        numerosA.add(numeroA)
        numerosB.add(numeroB)

        let source, target, arrowDirection

        switch (tipoId) {
          case 4: // VozEntrante - flecha de B hacia A
            source = numeroB
            target = numeroA
            arrowDirection = "entrante"
            break
          case 5: // VozSaliente - flecha de A hacia B
            source = numeroA
            target = numeroB
            arrowDirection = "saliente"
            break
          case 2: // Mensaje2ViasEnt - flecha de B hacia A
            source = numeroB
            target = numeroA
            arrowDirection = "entrante"
            break
          case 3: // Mensaje2ViasSal - flecha de A hacia B
            source = numeroA
            target = numeroB
            arrowDirection = "saliente"
            break
          case 0: // Datos - flecha del número hacia el número B
            source = numeroA
            target = numeroB
            arrowDirection = "datos"
            break
          default: // Otros tipos - flecha de A hacia B por defecto
            source = numeroA
            target = numeroB
            arrowDirection = "saliente"
        }

        edges.push({
          data: {
            id: `edge-${index}`,
            source: source,
            target: target,
            type: getTypeText(tipoId),
            typeId: tipoId,
            fecha: fecha,
            duracion: duracion,
            color: getTypeColor(tipoId),
            arrowDirection: arrowDirection,
            numeroA: numeroA,
            numeroB: numeroB,
          },
        })
      })

      const bidirectionalEdges = []
      edges.forEach((edge, i) => {
        if (edge.data.typeId === 2 || edge.data.typeId === 3) {
          const reverseEdge = edges.find(
            (e, j) =>
              j !== i &&
              e.data.numeroA === edge.data.numeroB &&
              e.data.numeroB === edge.data.numeroA &&
              (e.data.typeId === 2 || e.data.typeId === 3),
          )

          if (
            reverseEdge &&
            !bidirectionalEdges.some(
              (be) =>
                (be.data.numeroA === edge.data.numeroA && be.data.numeroB === edge.data.numeroB) ||
                (be.data.numeroA === edge.data.numeroB && be.data.numeroB === edge.data.numeroA),
            )
          ) {
            bidirectionalEdges.push({
              data: {
                id: `bidirectional-${edge.data.numeroA}-${edge.data.numeroB}`,
                source: edge.data.numeroA,
                target: edge.data.numeroB,
                type: "Mensaje 2 Vías",
                typeId: "bidirectional",
                color: "#2ecc71",
                arrowDirection: "bidirectional",
                numeroA: edge.data.numeroA,
                numeroB: edge.data.numeroB,
              },
            })
          }
        }
      })

      const filteredEdges = edges.filter((edge) => {
        if (edge.data.typeId === 2 || edge.data.typeId === 3) {
          return !bidirectionalEdges.some(
            (be) =>
              (be.data.numeroA === edge.data.numeroA && be.data.numeroB === edge.data.numeroB) ||
              (be.data.numeroA === edge.data.numeroB && be.data.numeroB === edge.data.numeroA),
          )
        }
        return true
      })

      const allEdges = [...filteredEdges, ...bidirectionalEdges]

      const nodeElements = []
      Array.from(numerosA).forEach((a) => {
        nodeElements.push({
          data: { id: a, label: a, type: "central", isNumeroA: true },
        })
      })
      Array.from(numerosB).forEach((b) => {
        if (!numerosA.has(b)) {
          nodeElements.push({
            data: { id: b, label: b, type: "peripheral", isNumeroA: false },
          })
        }
      })

      const cytoscapeInstance = window.cytoscape({
        container: cyRef.current,
        elements: [...nodeElements, ...allEdges],
        style: [
          {
            selector: "node[type='central']",
            style: {
              "background-color": "#e74c3c",
              label: "data(label)",
              color: "#000000ff",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "14px",
              "font-weight": "bold",
              width: "60px",
              height: "60px",
              "border-width": "3px",
              "border-color": "#c0392b",
            },
          },
          {
            selector: "node[type='peripheral']",
            style: {
              "background-color": "#3498db",
              label: "data(label)",
              color: "#000000ff",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "12px",
              width: "40px",
              height: "40px",
              "border-width": "2px",
              "border-color": "#2980b9",
            },
          },
          {
            selector: "edge[typeId='bidirectional']",
            style: {
              width: 3,
              "line-color": "data(color)",
              "target-arrow-color": "data(color)",
              "source-arrow-color": "data(color)",
              "target-arrow-shape": "triangle",
              "source-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.9,
              label: "2 Vías",
              "font-size": "10px",
              "text-rotation": "autorotate",
              "text-margin-y": -10,
            },
          },
          {
            selector: "edge[arrowDirection='entrante']",
            style: {
              width: 2,
              "line-color": "data(color)",
              "target-arrow-color": "data(color)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.8,
              label: "data(type)",
              "font-size": "9px",
              "text-rotation": "autorotate",
              "text-margin-y": -8,
            },
          },
          {
            selector: "edge[arrowDirection='saliente']",
            style: {
              width: 2,
              "line-color": "data(color)",
              "target-arrow-color": "data(color)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.8,
              label: "data(type)",
              "font-size": "9px",
              "text-rotation": "autorotate",
              "text-margin-y": -8,
            },
          },
          {
            selector: "edge[arrowDirection='datos']",
            style: {
              width: 2,
              "line-color": "data(color)",
              "target-arrow-color": "data(color)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.8,
              label: "Datos",
              "font-size": "9px",
              "text-rotation": "autorotate",
              "text-margin-y": -8,
            },
          },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "data(color)",
              "target-arrow-color": "data(color)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.8,
            },
          },
          {
            selector: "node:selected",
            style: {
              "background-color": "#f39c12",
              "border-color": "#e67e22",
              "border-width": "4px",
            },
          },
          { selector: "edge:selected", style: { width: 4, opacity: 1 } },
        ],
        layout: {
          name: "concentric",
          animate: true,
          animationDuration: 1000,
          concentric: (node) => (node.data("isNumeroA") ? 2 : 1),
          levelWidth: () => 1,
          minNodeSpacing: 100,
          padding: 60,
        },
      })

      cytoscapeInstance.on("mouseover", "edge", (evt) => {
        const edge = evt.target
        const d = edge.data()
        const tooltip = document.createElement("div")
        tooltip.style.position = "absolute"
        tooltip.style.background = "rgba(0,0,0,0.9)"
        tooltip.style.color = "white"
        tooltip.style.padding = "10px"
        tooltip.style.borderRadius = "6px"
        tooltip.style.fontSize = "12px"
        tooltip.style.zIndex = "1000"
        tooltip.style.pointerEvents = "none"
        tooltip.style.maxWidth = "200px"

        let direccionTexto = ""
        if (d.arrowDirection === "bidirectional") {
          direccionTexto = "Bidireccional"
        } else if (d.arrowDirection === "entrante") {
          direccionTexto = `${d.numeroB} → ${d.numeroA}`
        } else if (d.arrowDirection === "saliente") {
          direccionTexto = `${d.numeroA} → ${d.numeroB}`
        } else if (d.arrowDirection === "datos") {
          direccionTexto = `${d.numeroA} → ${d.numeroB} (Datos)`
        }

        tooltip.innerHTML = `
          <strong>Tipo:</strong> ${d.type}<br>
          <strong>Dirección:</strong> ${direccionTexto}<br>
          ${d.duracion ? `<strong>Duración:</strong> ${Math.floor((d.duracion || 0) / 60)}:${((d.duracion || 0) % 60).toString().padStart(2, "0")}<br>` : ""}
          ${d.fecha ? `<strong>Fecha:</strong> ${new Date(d.fecha).toLocaleString()}<br>` : ""}
        `
        document.body.appendChild(tooltip)
        const updatePos = (e) => {
          tooltip.style.left = e.clientX + 10 + "px"
          tooltip.style.top = e.clientY + 10 + "px"
        }
        document.addEventListener("mousemove", updatePos)
        edge.on("mouseout", () => {
          document.removeEventListener("mousemove", updatePos)
          tooltip.remove()
        })
      })

      setCy(cytoscapeInstance)
      setStats({ nodes: nodeElements.length, edges: allEdges.length })
    }

    loadCytoscape()

    return () => {
      if (cy) cy.destroy()
    }
  }, [relaciones, filtrosActivos])

  const resetLayout = () => {
    if (cy) {
      cy.layout({
        name: "concentric",
        animate: true,
        animationDuration: 1000,
        concentric: (node) => (node.data("isNumeroA") ? 2 : 1),
        levelWidth: () => 1,
        minNodeSpacing: 80,
        padding: 50,
      }).run()
    }
  }

  const fitToScreen = () => {
    if (cy) cy.fit(null, 50)
  }

  if (error) {
    return (
      <div className="red-vinculos-container">
        <div className="placeholder-text">
          <p>Error: {error}</p>
        </div>
      </div>
    )
  }

  if (!idSabana || relaciones.length === 0) {
    return (
      <div className="red-vinculos-container">
        <div className="placeholder-text">
          <p>No hay relaciones únicas para mostrar la red de vínculos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="red-vinculos-container">
      <div className="red-vinculos-header">
        <h4>Red de Vínculos Telefónicos</h4>
        <div className="network-stats">
          <span>Nodos: {stats.nodes}</span>
          <span>Conexiones: {stats.edges}</span>
        </div>
        <div className="network-controls">
          <button onClick={resetLayout} className="network-btn">
            Reorganizar
          </button>
          <button onClick={fitToScreen} className="network-btn">
            Ajustar Vista
          </button>
        </div>
      </div>

      <div className="network-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#e74c3c" }}></div>
          <span>Número Central (A)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#3498db" }}></div>
          <span>Número Contactado (B)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#c0392b" }}></div>
          <span>Voz Saliente (A→B)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#e74c3c" }}></div>
          <span>Voz Entrante (B→A)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#2ecc71" }}></div>
          <span>Mensajes 2 Vías (↔)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#3498db" }}></div>
          <span>Datos (A→B)</span>
        </div>
      </div>

      <div
        ref={cyRef}
        className="cytoscape-container"
        style={{
          width: "100%",
          height: "800px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          backgroundColor: "#ffffffff",
        }}
      />
    </div>
  )
}

RedVinculos.propTypes = {
  idSabana: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  filtrosActivos: PropTypes.object.isRequired,
}

export default RedVinculos
