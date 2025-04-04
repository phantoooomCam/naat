"use client"

import { useState, useEffect } from "react"
import "../../Usuarios/Gestion/Gestion.css"

const ActividadesSist = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [actividades, setActividades] = useState([])
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
    fetchActividades()
  }, [])

  const fetchActividades = async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem("token")

    try {
      const response = await fetch("/api/actividades", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`)

      const data = await response.json()
      setActividades(data)
    } catch (error) {
      console.error("Error al obtener actividades:", error)
      setError(error.message)
      setActividades([])
    } finally {
      setLoading(false)
    }
  }

  const datosFiltrados = actividades.filter((item) => {
    const textoBusqueda = busqueda.toLowerCase()
    return (
      (item.nombreUsuario?.toLowerCase() || "").includes(textoBusqueda) ||
      (item.nombreAutor?.toLowerCase() || "").includes(textoBusqueda) ||
      (item.entidad?.toLowerCase() || "").includes(textoBusqueda) ||
      (item.accion?.toLowerCase() || "").includes(textoBusqueda) ||
      (item.idUsuario?.toString() || "").includes(textoBusqueda)
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
            <h2>Registro de Actividades</h2>
            <p className="section-description">Historial de acciones realizadas en el sistema</p>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando actividades...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <h2>Error al cargar actividades</h2>
              <p>{error}</p>
              <button onClick={fetchActividades} className="retry-button">
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
                      placeholder="Buscar por usuario, entidad o acción..."
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
                      <th>ID Actividad</th>
                      <th>Autor</th>
                      <th>Entidad</th>
                      <th>Acción</th>
                      <th>ID Usuario</th>
                      <th>Nombre Usuario</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosPaginados.length > 0 ? (
                      datosPaginados.map((item) => (
                        <tr key={item.idActividad}>
                          <td>{item.idActividad}</td>
                          <td>{item.nombreAutor}</td>
                          <td>{item.entidad}</td>
                          <td>{item.accion}</td>
                          <td>{item.idUsuario}</td>
                          <td>{item.nombreUsuario || "N/A"}</td>
                          <td>{formatearFecha(item.fecha)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-results">
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

export default ActividadesSist

