"use client"

import { useState, useEffect } from "react"
import fetchWithAuth from "../../../../utils/fetchWithAuth"

const LogsCasosTabla = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [logs, setLogs] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const registrosPorPagina = 10

  // Observador del sidebar
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar")
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"))
      }
    })

    observer.observe(document.body, { attributes: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchWithAuth("/api/acciones", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`)

      const data = await response.json()
      setLogs(data)
    } catch (error) {
      console.error("Error al obtener logs de casos:", error)
      setError(error.message)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const datosFiltrados = logs.filter((item) => {
    const textoBusqueda = busqueda.toLowerCase()
    return (
      (item.idAcciones?.toString() || "").includes(textoBusqueda) ||
      (item.idUsuario?.toString() || "").includes(textoBusqueda) ||
      (item.idCaso?.toString() || "").includes(textoBusqueda) ||
      (item.accion?.toLowerCase() || "").includes(textoBusqueda)
    )
  })

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleString()
  }

  // Paginación
  const indexUltimo = paginaActual * registrosPorPagina
  const indexPrimero = indexUltimo - registrosPorPagina
  const datosPaginados = datosFiltrados.slice(indexPrimero, indexUltimo)
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina)

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="content-wrapper">
        <div className="content-container">
          <div className="section-header">
            <h2>Registro de Logs de Casos</h2>
            <p className="section-description">Historial de acciones realizadas en los casos</p>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando logs de casos...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <h2>Error al cargar logs de casos</h2>
              <p>{error}</p>
              <button onClick={fetchLogs} className="retry-button">
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <form className="gestion-form">
                <div className="search-container">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Buscar por ID, usuario, caso o acción..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="search-input"
                    />
                    {busqueda && (
                      <button className="clear-search" onClick={() => setBusqueda("")} type="button">
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID Acción</th>
                      <th>ID Usuario</th>
                      <th>ID Caso</th>
                      <th>Acción</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {datosPaginados.length > 0 ? (
                      datosPaginados.map((item) => (
                        <tr key={item.idAcciones}>
                          <td>{item.idAcciones}</td>
                          <td>{item.idUsuario}</td>
                          <td>{item.idCaso}</td>
                          <td>{item.accion}</td>
                          <td>{formatearFecha(item.fecha)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-results">
                          No se encontraron resultados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {datosFiltrados.length > 0 && (
                <div className="paginacion">
                  <button
                    onClick={() => setPaginaActual(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className="pagination-button"
                  >
                    ← Anterior
                  </button>
                  <div className="pagination-info">
                    <span>
                      Página {paginaActual} de {totalPaginas || 1}
                    </span>
                    <span className="pagination-total">{datosFiltrados.length} registros</span>
                  </div>
                  <button
                    onClick={() => setPaginaActual(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas || totalPaginas === 0}
                    className="pagination-button"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LogsCasosTabla;

