"use client"

import { useState, useEffect } from "react"
import "../../Usuarios/Gestion/Gestion.css"
import fetchWithAuth from "../../../../utils/fetchWithAuth";


const DashArea = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [areas, setAreas] = useState([])
  const [filtro, setFiltro] = useState("")
  const [organizaciones, setOrganizaciones] = useState([])
  const [formData, setFormData] = useState({
    idArea: 0,
    nombreArea: "",
    idOrganizacion: 0,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const API_URL = "/api"

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

  const obtenerAreas = async () => {
    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/areas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data = await response.json()
      setAreas(data)
      setError(null)
    } catch (error) {
      console.error("Error al obtener áreas:", error)
      setError("Error al cargar las áreas. Intente nuevamente más tarde.")
    } finally {
      setLoading(false)
    }
  }

  const obtenerOrganizaciones = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/organizaciones`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const data = await response.json()
      setOrganizaciones(data)
    } catch (error) {
      console.error("Error al obtener organizaciones:", error)
    }
  }

  const crearArea = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.nombreArea.trim()) {
      setError("El nombre del área no puede estar vacío")
      setLoading(false)
      return
    }

    if (!formData.idOrganizacion) {
      setError("Debe seleccionar una organización")
      setLoading(false)
      return
    }

    try {
      const dataToSend = {
        idArea: 0,
        nombreArea: formData.nombreArea,
        idOrganizacion: Number.parseInt(formData.idOrganizacion, 10),
      }

      const response = await fetchWithAuth(`${API_URL}/areas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

      resetearFormulario()
      obtenerAreas()
      setIsCreating(false)
      setError(null)

      setSuccessMessage("Área creada correctamente")
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error al crear el área:", error)
      setError("Error al crear el área. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const actualizarArea = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.nombreArea.trim()) {
      setError("El nombre del área no puede estar vacío")
      setLoading(false)
      return
    }

    if (!formData.idOrganizacion) {
      setError("Debe seleccionar una organización")
      setLoading(false)
      return
    }

    try {
      const dataToSend = {
        idArea: Number.parseInt(formData.idArea, 10),
        nombreArea: formData.nombreArea,
        idOrganizacion: Number.parseInt(formData.idOrganizacion, 10),
      }

      const response = await fetchWithAuth(`${API_URL}/areas/${formData.idArea}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

      resetearFormulario()
      obtenerAreas()
      setIsEditing(false)
      setError(null)

      setSuccessMessage("Área actualizada correctamente")
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error al actualizar el área:", error)
      setError("Error al actualizar el área. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const eliminarArea = async (id) => {
    const confirmar = window.confirm("¿Está seguro que desea eliminar esta área?")
    if (!confirmar) return

    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/areas/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      
      })

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

      obtenerAreas()
      setError(null)

      setSuccessMessage("Área eliminada correctamente")
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error al eliminar el área:", error)
      setError("Error al eliminar el área. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const seleccionarArea = (area) => {
    setFormData({
      idArea: area.idArea,
      nombreArea: area.nombreArea,
      idOrganizacion: area.idOrganizacion,
    })
    setIsEditing(true)
  }

  const resetearFormulario = () => {
    setFormData({
      idArea: 0,
      nombreArea: "",
      idOrganizacion: 0,
    })
  }

  const handleOpenCreateForm = () => {
    resetearFormulario()
    setIsCreating(true)
  }

  useEffect(() => {
    obtenerAreas()
    obtenerOrganizaciones()
  }, [])

  const areasFiltradas = areas.filter((area) => area.nombreArea.toLowerCase().includes(filtro.toLowerCase()))

  if (loading && !isEditing && !isCreating) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando áreas...</p>
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
            <h2>Gestión de Áreas</h2>
            <p className="section-description">Administra la información de las áreas</p>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: "15px" }}>
              {error}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={actualizarArea} className="gestion-form editing-mode">
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre del Área</label>
                  <input
                    type="text"
                    name="nombreArea"
                    placeholder="Nombre del área"
                    value={formData.nombreArea}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={loading}
                  />
                </div>
                <div className="form-field">
                  <label>Organización</label>
                  <select
                    name="idOrganizacion"
                    value={formData.idOrganizacion}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={loading}
                  >
                    <option value="">Seleccione una organización</option>
                    {organizaciones.map((org) => (
                      <option key={org.idOrganizacion} value={org.idOrganizacion}>
                        {org.nombreOrganizacion}
                      </option>
                    ))}
                  </select>
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
                    resetearFormulario()
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : isCreating ? (
            <form onSubmit={crearArea} className="gestion-form editing-mode">
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre del Área</label>
                  <input
                    type="text"
                    name="nombreArea"
                    placeholder="Nombre del área"
                    value={formData.nombreArea}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={loading}
                  />
                </div>
                <div className="form-field">
                  <label>Organización</label>
                  <select
                    name="idOrganizacion"
                    value={formData.idOrganizacion}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={loading}
                  >
                    <option value="">Seleccione una organización</option>
                    {organizaciones.map((org) => (
                      <option key={org.idOrganizacion} value={org.idOrganizacion}>
                        {org.nombreOrganizacion}
                      </option>
                    ))}
                  </select>
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
                      placeholder="Buscar área..."
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
                    <span className="button-text">Agregar Área</span>
                  </button>
                </div>
              </form>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Organización</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areasFiltradas.length > 0 ? (
                      areasFiltradas.map((area) => {
                        const organizacion = organizaciones.find((org) => org.idOrganizacion === area.idOrganizacion)

                        return (
                          <tr key={area.idArea}>
                            <td>{area.idArea}</td>
                            <td>{area.nombreArea}</td>
                            <td>{organizacion?.nombreOrganizacion || "-"}</td>
                            <td className="td-btn">
                              <button
                                onClick={() => seleccionarArea(area)}
                                className="action-button edit-button"
                                title="Editar área"
                                disabled={loading}
                              >
                                <i className="fas fa-pencil-alt"></i>
                              </button>
                              <button
                                onClick={() => eliminarArea(area.idArea)}
                                className="action-button delete-button"
                                title="Eliminar área"
                                disabled={loading}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="no-results">
                          No se encontraron áreas
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

export default DashArea

