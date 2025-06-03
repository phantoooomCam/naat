"use client"

import { useState, useEffect } from "react"
import "../../Usuarios/Gestion/Gestion.css"
import fetchWithAuth from "../../../../utils/fetchWithAuth";


const DashOrga = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [organizaciones, setOrganizaciones] = useState([])
  const [filtro, setFiltro] = useState("")
  const [nuevaOrganizacion, setNuevaOrganizacion] = useState("")
  const [organizacionEditar, setOrganizacionEditar] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const API_URL = "/api/organizaciones"

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

  const obtenerOrganizaciones = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchWithAuth(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setOrganizaciones(data)
    } catch (error) {
      console.error("Error al obtener organizaciones:", error)
      setError("Error al cargar las organizaciones. Intente nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  const crearOrganizacion = async (e) => {
    e.preventDefault()
    if (nuevaOrganizacion.trim() === "") {
      setError("El nombre de la organización no puede estar vacío.")
      return
    }

    setLoading(true)
    const nuevaOrg = {
      nombreOrganizacion: nuevaOrganizacion,
    }

    try {
      const response = await fetchWithAuth(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      
        body: JSON.stringify(nuevaOrg),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      setNuevaOrganizacion("")
      setIsCreating(false)
      obtenerOrganizaciones()

      setSuccessMessage("Organización creada correctamente")
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error al crear organización:", error)
      setError("Error al crear la organización. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const eliminarOrganizacion = async (id) => {
    const confirmar = window.confirm("¿Está seguro de que desea eliminar esta organización?")
    if (!confirmar) return

    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      obtenerOrganizaciones()

      setSuccessMessage("Organización eliminada correctamente")
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error al eliminar organización:", error)
      setError("Error al eliminar la organización. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const editarOrganizacion = async (e) => {
    e.preventDefault()

    if (!organizacionEditar || organizacionEditar.nombreOrganizacion.trim() === "") {
      setError("El nombre de la organización no puede estar vacío.")
      return
    }

    setLoading(true)
    const organizacionActualizada = {
      idOrganizacion: organizacionEditar.idOrganizacion,
      nombreOrganizacion: organizacionEditar.nombreOrganizacion,
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/${organizacionEditar.idOrganizacion}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      
        body: JSON.stringify(organizacionActualizada),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      setOrganizacionEditar(null)
      setIsEditing(false)
      obtenerOrganizaciones()

      setSuccessMessage("Organización actualizada correctamente")
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error al editar organización:", error)
      setError("Error al editar la organización. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const seleccionarOrganizacion = (org) => {
    setOrganizacionEditar(org)
    setIsEditing(true)
  }

  const handleOpenCreateForm = () => {
    setNuevaOrganizacion("")
    setIsCreating(true)
  }

  useEffect(() => {
    obtenerOrganizaciones()
  }, [])

  const organizacionesFiltradas = organizaciones.filter((org) =>
    org.nombreOrganizacion.toLowerCase().includes(filtro.toLowerCase()),
  )

  if (loading && !isEditing && !isCreating) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando organizaciones...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      {showSuccessMessage && (
        <div className="success-message">
          <div className="success-content">
            <span className="success-icon">✓</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <div className={`content-wrapper ${isEditing || isCreating ? "editing-mode" : ""}`}>
        <div className="content-container">
          <div className="section-header">
            <h2>Gestión de Organizaciones</h2>
            <p className="section-description">Administra la información de las organizaciones</p>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: "15px" }}>
              {error}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={editarOrganizacion} className="gestion-form editing-mode">
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre de la Organización</label>
                  <input
                    type="text"
                    placeholder="Nombre de la organización"
                    value={organizacionEditar.nombreOrganizacion}
                    onChange={(e) =>
                      setOrganizacionEditar({
                        ...organizacionEditar,
                        nombreOrganizacion: e.target.value,
                      })
                    }
                    className="inputedit"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-edit" disabled={loading}>
                  {loading ? "Procesando..." : "Actualizar"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditing(false)
                    setOrganizacionEditar(null)
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : isCreating ? (
            <form onSubmit={crearOrganizacion} className="gestion-form editing-mode">
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre de la Nueva Organización</label>
                  <input
                    type="text"
                    placeholder="Nombre de la nueva organización"
                    value={nuevaOrganizacion}
                    onChange={(e) => setNuevaOrganizacion(e.target.value)}
                    className="inputedit"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-edit" disabled={loading}>
                  {loading ? "Procesando..." : "Crear"}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setIsCreating(false)} disabled={loading}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              <form className="gestion-form">
                <div className="search-container">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Buscar organización..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="search-input"
                    />
                    {filtro && (
                      <button className="clear-search" onClick={() => setFiltro("")} type="button">
                        ×
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={handleOpenCreateForm} className="add-button" disabled={loading}>
                    <span className="button-icon">+</span>
                    <span className="button-text">Agregar Organización</span>
                  </button>
                </div>
              </form>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizacionesFiltradas.length > 0 ? (
                      organizacionesFiltradas.map((org) => (
                        <tr key={org.idOrganizacion}>
                          <td>{org.idOrganizacion}</td>
                          <td>{org.nombreOrganizacion}</td>
                          <td className="td-btn">
                            <button
                              onClick={() => seleccionarOrganizacion(org)}
                              className="action-button edit-button"
                              title="Editar organización"
                              disabled={loading}
                            >
                              <i className="fas fa-pencil-alt"></i>
                            </button>
                            <button
                              onClick={() => eliminarOrganizacion(org.idOrganizacion)}
                              className="action-button delete-button"
                              title="Eliminar organización"
                              disabled={loading}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-results">
                          No se encontraron organizaciones
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashOrga

