"use client"

import { useState, useEffect } from "react"
import "../Gestion/Gestion.css"
import fetchWithAuth from "../../../../utils/fetchWithAuth";


const DashSolicitud = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correo: "",
    telefono: "",
    contraseña: "",
    usuario: "",
    idOrganizacion: "",
    nivel: 5,
    rol: "Lector",
  });
  const [organizaciones, setOrganizaciones] = useState([]);

  const [isEditing, setIsEditing] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  

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

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchWithAuth("/api/usuarios/?inicio=1&cantidad=10", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },

      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const text = await response.text()
      if (!text) throw new Error("No se recibieron datos del servidor")

      const data = JSON.parse(text)

      if (Array.isArray(data)) {
        const levelZeroUsers = data.filter((user) => {
          return user.nivel === null || user.nivel === "null"
        })

        setUsers(levelZeroUsers)
        setFilteredUsers(levelZeroUsers)
      } else {
        throw new Error("Formato de datos inesperado")
      }
    } catch (error) {
      console.error("Error completo:", error)
      setError(error.message)
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizaciones = async () => {
    try {
      const response = await fetchWithAuth("/api/organizaciones", {

      });

      if (!response.ok) {
        throw new Error("Error al obtener organizaciones");
      }

      const data = await response.json();
      setOrganizaciones(data);
    } catch (error) {
      console.error("Error al cargar organizaciones:", error);
    }
  };

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchOrganizaciones();
  }, []);


  useEffect(() => {
    const lowercasedSearchText = searchText.toLowerCase()
    const filtered = users.filter((user) =>
      `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno} ${user.nombreUsuario}`
        .toLowerCase()
        .includes(lowercasedSearchText),
    )
    setFilteredUsers(filtered)
  }, [searchText, users])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.id_usuario) return

    try {
      const payload = {
        ...formData,
        organizacion: formData.organizacion
          ? { id: parseInt(formData.organizacion) }
          : null,
      }

      const response = await fetchWithAuth(`/api/usuarios/${formData.id_usuario}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload), 
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al actualizar: ${response.status} - ${errorText}`)
      }

      const activarResponse = await fetchWithAuth("/api/usuarios/activar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idUsuario: formData.id_usuario,
          esReactivacion: false  
        }),
      })

      const activarResult = await activarResponse.json()

      if (!activarResponse.ok) {
        setSuccessMessage(activarResult.mensaje || "Error al activar el usuario.")
        setShowSuccessMessage(true)
        setTimeout(() => {
          setShowSuccessMessage(false)
        }, 3000)
        return
      }

      setSuccessMessage(activarResult.mensaje || "Usuario activado correctamente.")
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)

      setIsEditing(false)
      fetchUsers()
    } catch (error) {
      setError(error.message)
    }
  }


  const handleEdit = (user) => {
    setFormData({
      id_usuario: user.id,
      nombre: user.nombre,
      apellidoPaterno: user.apellidoPaterno,
      apellidoMaterno: user.apellidoMaterno,
      correo: user.correo,
      telefono: user.telefono,
      nivel: user.nivel,
      idOrganizacion: user.organizacion?.idOrganizacion ?? "",
      rol: user.rol,
    })
    setIsEditing(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Está seguro que desea eliminar esta solicitud?")) {
      if (!id) return

      try {
        const response = await fetchWithAuth(`/api/usuarios/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },

        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error al eliminar: ${response.status} - ${errorText}`)
        }

        setUsers(users.filter((user) => user.id !== id))
        setFilteredUsers(filteredUsers.filter((user) => user.id !== id))

        setSuccessMessage("Solicitud eliminada correctamente")
        setShowSuccessMessage(true)
        setTimeout(() => {
          setShowSuccessMessage(false)
        }, 3000)
      } catch (error) {
        setError(error.message)
      }
    }
  }

  if (loading) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando solicitudes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <div className="error-container">
              <h2>Error al cargar solicitudes</h2>
              <p>{error}</p>
              <button onClick={fetchUsers} className="retry-button">
                Reintentar
              </button>
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

      <div className={`content-wrapper ${isEditing ? "editing-mode" : ""}`}>
        <div className="content-container">
          <div className="section-header">
            <h2>Solicitudes de Usuarios</h2>
            <p className="section-description">Gestiona las solicitudes pendientes de aprobación</p>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="gestion-form editing-mode">
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Nombre"
                    readOnly
                  />
                </div>
                <div className="form-field">
                  <label>Apellido Paterno</label>
                  <input
                    type="text"
                    name="apellidoPaterno"
                    value={formData.apellidoPaterno ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Apellido Paterno"
                    readOnly
                  />
                </div>
                <div className="form-field">
                  <label>Apellido Materno</label>
                  <input
                    type="text"
                    name="apellidoMaterno"
                    value={formData.apellidoMaterno ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Apellido Materno"
                    readOnly
                  />
                </div>
                <div className="form-field">
                  <label>Nivel</label>
                  <select name="nivel" value={formData.nivel ?? 4} onChange={handleChange} className="inputedit">
                    <option value={null}>Pendiente</option>
                    <option value={1}>Super Administrador</option>
                    <option value={2}>Administrador de Organización</option>
                    <option value={3}>Jefe de Área</option>
                    <option value={4}>Jefe de Departamento</option>
                    <option value={5}>Analista</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Organización</label>
                <select
                  name="idOrganizacion"
                  value={formData.idOrganizacion}
                  onChange={handleChange}
                  className="inputedit"
                >
                  <option value="">Selecciona una organización</option>
                  {organizaciones.map((org) => (
                    <option key={org.idOrganizacion} value={org.idOrganizacion}>
                      {org.nombreOrganizacion}
                    </option>
                  ))}
                </select>

              </div>


              <div className="form-buttons">
                <button type="submit" className="btn-edit">
                  Aprobar Solicitud
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditing(false)
                  }}
                >
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
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Buscar solicitud..."
                      className="search-input"
                    />
                    {searchText && (
                      <button className="clear-search" onClick={() => setSearchText("")} type="button">
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
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Apellido Paterno</th>
                      <th>Apellido Materno</th>
                      <th>Nivel</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.nombre}</td>
                          <td>{user.apellidoPaterno}</td>
                          <td>{user.apellidoMaterno}</td>
                          <td>
                            <span className="nivel-badge nivel-0">Pendiente</span>
                          </td>
                          <td className="td-btn">
                            <button
                              onClick={() => handleEdit(user)}
                              className="action-button edit-button"
                              title="Aprobar solicitud"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="action-button delete-button"
                              title="Rechazar solicitud"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-results">
                          No hay solicitudes pendientes
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

export default DashSolicitud

