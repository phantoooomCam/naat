"use client"

import React, { useRef, useState, useEffect } from "react" // Agregado React aquí
import PropTypes from "prop-types"
import cytoscape from "cytoscape"
import dagre from "cytoscape-dagre"
import "./RedVinculos.css"
import fetchWithAuth from "../utils/fetchWithAuth.js"

cytoscape.use(dagre)

const RedVinculos = ({ idSabana, filtrosActivos, primaryNumbers = [] }) => {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ nodes: 0, edges: 0, sabanas: 0 })
  const [originalData, setOriginalData] = useState(null)
  
  // SOLUCIONADO: Usar useMemo para evitar recrear el objeto filters en cada render
  const filters = React.useMemo(() => ({
    maxConnectionsPerSabana: filtrosActivos?.maxConnectionsPerSabana || 100,
    showSharedOnly: filtrosActivos?.showSharedOnly || false,
    minConnections: filtrosActivos?.minConnections || 1,
  }), [
    filtrosActivos?.maxConnectionsPerSabana,
    filtrosActivos?.showSharedOnly,
    filtrosActivos?.minConnections
  ])

  useEffect(() => {
    if (!idSabana || !containerRef.current) return

    const controller = new AbortController()

    const fetchAndBuildGraph = async () => {
      try {
        setLoading(true)
        setError(null)

        // Normalize idSabana to array
        const ids = Array.isArray(idSabana) ? idSabana : [idSabana]

        // Build query string
        const params = new URLSearchParams()
        ids.forEach((id) => params.append("ids", id))

        const url = `/api/sabanas/registros/batch/numeros?${params.toString()}`

        const response = await fetchWithAuth(url, {
          method: "GET",
          signal: controller.signal,
        })

        if (!response) return
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        console.log("[v0] Original data received:", data)
        setOriginalData(data) // Guardar datos originales

        // Build graph elements with filters
        const elements = buildGraphElements(data, ids, filters)

        // Initialize Cytoscape
        updateCytoscapeGraph(elements)

        // Update stats
        updateStats(elements, ids)
      } catch (err) {
        if (err.name === "AbortError") return
        console.error("Error fetching network data:", err)
        setError(err.message || "Error al cargar la red de vínculos")
      } finally {
        setLoading(false)
      }
    }

    fetchAndBuildGraph()

    return () => {
      controller.abort()
    }
  }, [idSabana]) // IMPORTANTE: Solo depende de idSabana, NO de filters

  // SOLUCIONADO: useEffect separado solo para rebuilding cuando cambian los filtros
  useEffect(() => {
    if (originalData && idSabana) {
      console.log("[v0] Rebuilding graph with new filters:", filters)
      const ids = Array.isArray(idSabana) ? idSabana : [idSabana]
      const elements = buildGraphElements(originalData, ids, filters)
      updateCytoscapeGraph(elements)
      updateStats(elements, ids)
    }
  }, [filters, originalData, idSabana]) // Ahora filters es estable gracias a useMemo

  const updateStats = (elements, ids) => {
    const nodes = elements.filter(e => e.group === "nodes").length
    const edges = elements.filter(e => e.group === "edges").length
    setStats({ nodes, edges, sabanas: ids.length })
  }

  const updateCytoscapeGraph = (elements) => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      cyRef.current.elements().remove()
      cyRef.current.add(elements)
      cyRef.current
        .layout({
          name: "concentric",
          concentric: function(node) {
            if (node.data("type") === "sabana") {
              return 100
            }
            if (node.data("isShared")) {
              return 50
            }
            return 10
          },
          levelWidth: function(nodes) {
            return Math.max(3, Math.ceil(nodes.length / 8))
          },
          spacingFactor: 1.2,
          padding: 80,
          startAngle: -Math.PI / 2,
          clockwise: true,
          animate: true,
          animationDuration: 800,
          equidistant: false,
        })
        .run()
    } else {
      initializeCytoscape(elements)
    }
  }

  const buildGraphElements = (data, ids, currentFilters) => {
    const elements = []
    const nodesMap = new Map()
    const edgesSet = new Set()
    const numberConnections = new Map()
    const numberFrequency = new Map()

    console.log("[v0] Building graph with filters:", currentFilters)
    console.log("[v0] Data structure:", {
      hasBySabana: !!data.bySabana,
      hasCoincidences: !!(data.coincidences || data.coincidencias),
      ids: ids
    })

    // First pass: Count connections and frequency for each number
    if (data.bySabana) {
      ids.forEach((id) => {
        const records = data.bySabana[String(id)] || data.bySabana[id] || []
        console.log(`[v0] Sabana ${id} has ${records.length} records`)
        
        records.forEach((record) => {
          const { numeroB } = record
          if (!numeroB || 
              numeroB === 'ims' || 
              numeroB === 'internet.itelcel.com' || 
              numeroB === 'BUZON' ||
              numeroB.toString().trim() === '') {
            return
          }
          
          const key = `${numeroB}-${id}`
          if (!numberConnections.has(key)) {
            numberConnections.set(key, true)
            const count = numberFrequency.get(numeroB) || 0
            numberFrequency.set(numeroB, count + 1)
          }
        })
      })
    }

    console.log("[v0] Number frequencies calculated:", numberFrequency.size)

    // Create sabana nodes (central nodes)
    ids.forEach((id) => {
      const nodeId = `sabana-${id}`
      if (!nodesMap.has(nodeId)) {
        elements.push({
          group: "nodes",
          data: {
            id: nodeId,
            label: `Sábana ${id}`,
            type: "sabana",
            sabanaId: id,
          },
        })
        nodesMap.set(nodeId, true)
        console.log("[v0] Created sabana node:", nodeId)
      }
    })

    // Process each sabana's numbers from bySabana data
    if (data.bySabana) {
      ids.forEach((id) => {
        const records = data.bySabana[String(id)] || data.bySabana[id] || []
        const sabanaNodeId = `sabana-${id}`

        console.log(`[v0] Processing sabana ${id} with ${records.length} records`)

        // Filter records based on current filters
        let filteredRecords = records.filter((record) => {
          const { numeroB } = record
          if (!numeroB || 
              numeroB === 'ims' || 
              numeroB === 'internet.itelcel.com' || 
              numeroB === 'BUZON' ||
              numeroB.toString().trim() === '') {
            return false
          }

          const frequency = numberFrequency.get(numeroB) || 0
          
          // Apply filters
          if (currentFilters.showSharedOnly && frequency < 2) {
            return false
          }
          
          if (frequency < currentFilters.minConnections) {
            return false
          }

          return true
        })

        // Remove duplicates by numeroB
        const uniqueNumbers = new Map()
        filteredRecords.forEach(record => {
          if (!uniqueNumbers.has(record.numeroB)) {
            uniqueNumbers.set(record.numeroB, record)
          }
        })
        filteredRecords = Array.from(uniqueNumbers.values())

        // Sort by frequency (shared numbers first) and limit
        filteredRecords = filteredRecords
          .sort((a, b) => {
            const freqA = numberFrequency.get(a.numeroB) || 0
            const freqB = numberFrequency.get(b.numeroB) || 0
            return freqB - freqA
          })
          .slice(0, currentFilters.maxConnectionsPerSabana)

        console.log(`[v0] Filtered to ${filteredRecords.length} unique records for sabana ${id}`)

        filteredRecords.forEach((record) => {
          const { numeroB } = record
          const numeroNodeId = `numero-${numeroB}`
          const frequency = numberFrequency.get(numeroB) || 0

          // Create numero node if it doesn't exist
          if (!nodesMap.has(numeroNodeId)) {
            elements.push({
              group: "nodes",
              data: {
                id: numeroNodeId,
                label: numeroB,
                type: "numero",
                numero: numeroB,
                frequency: frequency,
                isShared: frequency > 1,
              },
            })
            nodesMap.set(numeroNodeId, true)
            // REDUCIDO: Solo log para debugging específico
            // console.log("[v0] Created numero node:", numeroNodeId, "frequency:", frequency)
          }

          // Create edge from sabana to numero
          const edgeId = `${sabanaNodeId}-${numeroNodeId}`
          if (!edgesSet.has(edgeId)) {
            elements.push({
              group: "edges",
              data: {
                id: edgeId,
                source: sabanaNodeId,
                target: numeroNodeId,
                type: "communication",
              },
            })
            edgesSet.add(edgeId)
          }
        })
      })
    }

    console.log("[v0] Final elements:", {
      total: elements.length,
      nodes: elements.filter(e => e.group === "nodes").length,
      edges: elements.filter(e => e.group === "edges").length
    })

    return elements
  }

  const initializeCytoscape = (elements) => {
    if (!containerRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "12px",
            color: "#2c3e50",
            "text-wrap": "wrap",
            "text-max-width": "80px",
            "background-color": (ele) => {
              if (ele.data("type") === "sabana") return "#3498db"
              if (ele.data("isShared")) return "#e74c3c"
              return "#95a5a6"
            },
            width: (ele) => {
              if (ele.data("type") === "sabana") return "80px"
              if (ele.data("isShared")) return "50px"
              return "40px"
            },
            height: (ele) => {
              if (ele.data("type") === "sabana") return "80px"
              if (ele.data("isShared")) return "50px"
              return "40px"
            },
            "border-width": (ele) => {
              if (ele.data("type") === "sabana") return "4px"
              if (ele.data("isShared")) return "3px"
              return "2px"
            },
            "border-color": (ele) => {
              if (ele.data("type") === "sabana") return "#2980b9"
              if (ele.data("isShared")) return "#c0392b"
              return "#7f8c8d"
            },
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": "4px",
            "border-color": "#f39c12",
            "background-color": "#e67e22",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#bdc3c7",
            "target-arrow-color": "#bdc3c7",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
          },
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#e67e22",
            "target-arrow-color": "#e67e22",
            width: 3,
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": "4px",
            "border-color": "#f39c12",
            "background-color": "#e67e22",
            "z-index": 999,
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            "line-color": "#f39c12",
            "target-arrow-color": "#f39c12",
            width: 4,
            "z-index": 999,
          },
        },
      ],
      layout: {
        name: "concentric",
        concentric: function(node) {
          if (node.data("type") === "sabana") {
            return 100
          }
          if (node.data("isShared")) {
            return 50
          }
          return 10
        },
        levelWidth: function(nodes) {
          return Math.max(3, Math.ceil(nodes.length / 8))
        },
        spacingFactor: 1.2,
        padding: 80,
        startAngle: -Math.PI / 2,
        clockwise: true,
        animate: true,
        animationDuration: 800,
        equidistant: false,
      },
      minZoom: 0.1,
      maxZoom: 5,
      wheelSensitivity: 4, 
      touchTapThreshold: 8,
      desktopTapThreshold: 4,
    })

    cyRef.current = cy

    // Improved zoom controls
    cy.on('wheel', function(e) {
      e.preventDefault()
      const zoomLevel = cy.zoom()
      const factor = e.originalEvent.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel * factor))
      
      cy.zoom({
        level: newZoom,
        renderedPosition: {
          x: e.renderedPosition.x,
          y: e.renderedPosition.y
        }
      })
    })

    // Add interaction handlers
    cy.on("tap", "node", (evt) => {
      const node = evt.target
      console.log("[v0] Node clicked:", node.data())
      
      const connectedNodes = node.neighborhood().add(node)
      cy.elements().removeClass('highlighted')
      connectedNodes.addClass('highlighted')
    })

    cy.on("tap", "edge", (evt) => {
      const edge = evt.target
      console.log("[v0] Edge clicked:", edge.data())
    })

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted')
      }
    })
  }

  const handleFitView = () => {
    if (cyRef.current) {
      cyRef.current.fit(null, 50)
    }
  }

  const handleResetZoom = () => {
    if (cyRef.current) {
      cyRef.current.zoom(1)
      cyRef.current.center()
    }
  }

  const handleExportImage = () => {
    if (cyRef.current) {
      const png = cyRef.current.png({ scale: 2, full: true })
      const link = document.createElement("a")
      link.href = png
      link.download = `red-vinculos-${Date.now()}.png`
      link.click()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="red-vinculos-container">
      <div className="red-vinculos-header">
        <h4>Red de Vínculos Telefónicos</h4>
        <div className="network-stats">
          <span>Sábanas: {stats.sabanas}</span>
          <span>Nodos: {stats.nodes}</span>
          <span>Conexiones: {stats.edges}</span>
        </div>
        <div className="network-controls">
          <button className="network-btn" onClick={handleFitView} title="Ajustar vista">
            🔍 Ajustar
          </button>
          <button className="network-btn" onClick={handleResetZoom} title="Restablecer zoom">
            ↺ Reset
          </button>
          <button className="network-btn" onClick={handleExportImage} title="Exportar imagen">
            📷 Exportar
          </button>
        </div>
      </div>

      <div className="network-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#3498db" }}></div>
          <span>Sábana</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#95a5a6" }}></div>
          <span>Número Único</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#e74c3c" }}></div>
          <span>Número Compartido</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: "#bdc3c7", height: "3px" }}></div>
          <span>Conexión</span>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#7f8c8d" }}>Cargando red de vínculos...</div>
      )}

      {error && <div style={{ textAlign: "center", padding: "20px", color: "#e74c3c" }}>Error: {error}</div>}

      <div ref={containerRef} className="cytoscape-container" style={{ display: loading ? "none" : "block" }} />
    </div>
  )
}

RedVinculos.propTypes = {
  idSabana: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]).isRequired,
  filtrosActivos: PropTypes.object,
  primaryNumbers: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
}

export default RedVinculos
