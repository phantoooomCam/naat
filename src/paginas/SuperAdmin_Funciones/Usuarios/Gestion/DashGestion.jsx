"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import fetchWithAuth from "../../../../utils/fetchWithAuth";

const GestionDash = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correo: "",
    telefono: "",
    contraseña: "",
    usuario: "",
    idOrganizacion: 0,
    nivel: 5,
    rol: "Lector",
    idArea: 0,
    idDepartamento: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 7;

  const [filteredAreas, setFilteredAreas] = useState([]);
  const [filteredDepartamentos, setFilteredDepartamentos] = useState([]);



  const [organizaciones, setOrganizaciones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  const fetchOrganizaciones = async () => {
    try {
      const response = await fetchWithAuth("/api/organizaciones", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response || !response.ok) {
        throw new Error(`Error: ${response?.status || "No response"}`);
      }

      const data = await response.json();
      setOrganizaciones(data);
    } catch (error) {
      console.error("Error al obtener organizaciones:", error);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await fetchWithAuth("/api/areas", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response || !response.ok) {
        throw new Error(`Error: ${response?.status || "No response"}`);
      }

      const data = await response.json();
      setAreas(data);
    } catch (error) {
      console.error("Error al obtener areas:", error);
    }
  };

  const fetchDepartamentos = async () => {
    try {
      const response = await fetchWithAuth("/api/departamentos", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response || !response.ok) {
        throw new Error(`Error: ${response?.status || "Sin respuesta"}`);
      }

      const data = await response.json();

      const deptosArray = Array.isArray(data)
        ? data
        : Array.isArray(data.departamentos)
        ? data.departamentos
        : [];

      if (!deptosArray.length && data.mensaje) {
        setError(data.mensaje); 
      }

      setDepartamentos(deptosArray);
    } catch (error) {
      console.error("Error al obtener departamentos:", error);
      setError("No se pudieron cargar los departamentos. Intente más tarde.");
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"));
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth("/api/usuarios/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const text = await response.text();
      if (!text) throw new Error("No se recibieron datos del servidor");

      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data);
      } else {
        throw new Error("Formato de datos inesperado");
      }
    } catch (error) {
      setError(error.message);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrganizaciones();
    fetchAreas();
    fetchDepartamentos();
  }, []);

  useEffect(() => {
    const lowercasedSearchText = searchText.toLowerCase();
    const filtered = users.filter((user) =>
      `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno} ${user.nombreUsuario}`
        .toLowerCase()
        .includes(lowercasedSearchText)
    );
    setFilteredUsers(filtered);
    setPaginaActual(1); 
  }, [searchText, users]);

  useEffect(() => {
    if (formData.idOrganizacion) {
      const areasDeOrganizacion = areas.filter(
        (area) =>
          area.idOrganizacion === Number.parseInt(formData.idOrganizacion)
      );
      setFilteredAreas(areasDeOrganizacion);

      setFormData((prev) => ({
        ...prev,
        idArea: 0,
        idDepartamento: 0,
      }));
    } else {
      setFilteredAreas([]);
    }
  }, [formData.idOrganizacion, areas]);

  useEffect(() => {
    if (formData.idArea) {
      const departamentosDeArea = departamentos.filter(
        (depto) => depto.idArea === Number.parseInt(formData.idArea)
      );
      setFilteredDepartamentos(departamentosDeArea);

      setFormData((prev) => ({
        ...prev,
        idDepartamento: 0,
      }));
    } else {
      setFilteredDepartamentos([]);
    }
  }, [formData.idArea, departamentos]);

  const indexUltimo = paginaActual * registrosPorPagina;
  const indexPrimero = indexUltimo - registrosPorPagina;
  const usersPaginados = filteredUsers.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(filteredUsers.length / registrosPorPagina);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue =
      name === "idOrganizacion" ||
      name === "idArea" ||
      name === "idDepartamento"
        ? Number(value) || 0
        : value;

    setFormData({
      ...formData,
      [name]: numValue,
    });
  };

  const validarFormulario = () => {
    const errores = {};

    if (formData.telefono && !/^\d{10}$/.test(formData.telefono)) {
      errores.telefono = "El teléfono debe contener exactamente 10 dígitos.";
    }

    if (
      formData.contraseña &&
      !/^.*(?=.{8,})(?=.*[!@#$%^&*()\-_=+{};:,<.>]).*$/.test(
        formData.contraseña
      )
    ) {
      errores.contraseña =
        "La contraseña debe tener al menos 8 caracteres y un carácter especial.";
    }

    setFormErrors(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    if (!formData.id_usuario) return;

    try {
      const response = await fetchWithAuth(
        `/api/usuarios/${formData.id_usuario}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error al actualizar: ${response.status} - ${errorText}`
        );
      }

      setIsEditing(false);
      setSuccessMessage("Usuario actualizado correctamente");
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

      fetchUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEdit = (user) => {
    const org = organizaciones.find(
      (o) => o.nombreOrganizacion === user.organizacion
    );
    const area = areas.find((a) => a.nombreArea === user.area);
    const departamento = departamentos.find(
      (d) => d.nombreDepartamento === user.departamento
    );

    const userData = {
      id_usuario: user.id,
      nombre: user.nombre,
      apellidoPaterno: user.apellidoPaterno,
      apellidoMaterno: user.apellidoMaterno,
      correo: user.correo,
      telefono: user.telefono,
      nivel: user.nivel,
      idOrganizacion: org ? org.idOrganizacion : "",
      idArea: area ? area.idArea : "",
      idDepartamento: departamento ? departamento.idDepartamento : "",
      rol: user.rol,
      contraseña: "",
    };

    setFormData(userData);
    setIsEditing(true);
  };

  useEffect(() => {
    if (formData.idOrganizacion && areas.length > 0) {
      const areasDeOrganizacion = areas.filter(
        (area) =>
          area.idOrganizacion === Number.parseInt(formData.idOrganizacion)
      );
      setFilteredAreas(areasDeOrganizacion);

      if (!areasDeOrganizacion.some((a) => a.idArea == formData.idArea)) {
        setFormData((prev) => ({
          ...prev,
          idArea:
            areasDeOrganizacion.length > 0
              ? areasDeOrganizacion[0].idArea.toString()
              : "",
        }));
      }
    }
  }, [formData.idOrganizacion, areas]);

  useEffect(() => {
    if (formData.idArea && departamentos.length > 0) {
      const departamentosDeArea = departamentos.filter(
        (depto) => depto.idArea === Number.parseInt(formData.idArea)
      );
      setFilteredDepartamentos(departamentosDeArea);

      if (
        !departamentosDeArea.some(
          (d) => d.idDepartamento == formData.idDepartamento
        )
      ) {
        setFormData((prev) => ({
          ...prev,
          idDepartamento:
            departamentosDeArea.length > 0
              ? departamentosDeArea[0].idDepartamento.toString()
              : "",
        }));
      }
    }
  }, [formData.idArea, departamentos]);

  const handleDelete = async (id) => {
    if (window.confirm("¿Está seguro que desea eliminar este usuario?")) {
      if (!id) return;

      try {
        const response = await fetchWithAuth(`/api/usuarios/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Error al eliminar: ${response.status} - ${errorText}`
          );
        }

        setUsers(users.filter((user) => user.id !== id));
        setFilteredUsers(filteredUsers.filter((user) => user.id !== id));

        setSuccessMessage("Usuario eliminado correctamente");
        setShowSuccessMessage(true);

        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    if (!formData.nombre || !formData.correo || !formData.contraseña) return;

    const userToCreate = {
      nombre: formData.nombre,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      correo: formData.correo,
      telefono: formData.telefono,
      contraseña: formData.contraseña,
      usuario: formData.usuario,
      idOrganizacion: formData.idOrganizacion,
      idArea: formData.idArea,
      idDepartamento: formData.idDepartamento,
      nivel: Number.parseInt(formData.nivel, 10),
      rol: formData.rol,
    };

    try {
      const response = await fetchWithAuth("/api/usuarios/crear-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(userToCreate),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al crear: ${response.status} - ${errorText}`);
      }

      fetchUsers();

      setFormData({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        correo: "",
        telefono: "",
        contraseña: "",
        usuario: "",
        idOrganizacion: 0,
        idArea: 0,
        idDepartamento: 0,
        nivel: 5,
        rol: "Lector",
      });

      setIsCreating(false);

      setSuccessMessage("Usuario creado correctamente");
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleOpenCreateForm = () => {
    setFormData({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      correo: "",
      telefono: "",
      contraseña: "",
      usuario: "",
      idOrganizacion: 0,
      idArea: 0,
      idDepartamento: 0,
      nivel: 5,
      rol: "Lector",
    });
    setIsCreating(true); 
  };

  if (loading) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando usuarios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <div className="error-container">
              <h2>Error al cargar usuarios</h2>
              <p>{error}</p>
              <button onClick={fetchUsers} className="retry-button">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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

      <div
        className={`content-wrapper ${
          isEditing || isCreating ? "editing-mode" : ""
        }`}
      >
        <div className="content-container">
          <div className="section-header">
            <h2>Gestión de Usuarios</h2>
            <p className="section-description">
              Administra la información de los usuarios del sistema
            </p>
          </div>

          {isEditing || isCreating ? (
            <form
              onSubmit={isCreating ? handleCreate : handleSubmit}
              className={`gestion-form ${
                isEditing || isCreating ? "editing-mode" : ""
              }`}
            >
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
                  />
                </div>
                <div className="form-field">
                  <label>Correo</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Correo electrónico"
                  />
                </div>
                <div className="form-field">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    name="contraseña"
                    value={formData.contraseña ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Contraseña"
                  />
                  {formErrors.contraseña && (
                    <p className="error-text">{formErrors.contraseña}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Teléfono"
                  />
                  {formErrors.telefono && (
                    <p className="error-text">{formErrors.telefono}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>Nivel</label>
                  <select
                    name="nivel"
                    value={formData.nivel ?? 4}
                    onChange={handleChange}
                    className="inputedit"
                  >
                    <option value={null}>Pendiente</option>
                    <option value={1}>Super Administrador</option>
                    <option value={2}>Administrador de Organización</option>
                    <option value={3}>Jefe de Área</option>
                    <option value={4}>Jefe de Departamento</option>
                    <option value={5}>Analista</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Organización</label>
                  <select
                    name="idOrganizacion"
                    value={formData.idOrganizacion || ""}
                    onChange={handleChange}
                    className="inputedit"
                  >
                    <option value="">Seleccione una organización</option>
                    {organizaciones.map((org) => (
                      <option
                        key={org.idOrganizacion}
                        value={org.idOrganizacion}
                      >
                        {org.nombreOrganizacion}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Área</label>
                  <select
                    name="idArea"
                    value={formData.idArea || ""}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={!formData.idOrganizacion}
                  >
                    <option value="">Seleccione un área</option>
                    {filteredAreas.map((ar) => (
                      <option key={ar.idArea} value={ar.idArea}>
                        {ar.nombreArea}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Departamento</label>
                  <select
                    name="idDepartamento"
                    value={formData.idDepartamento || ""}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={!formData.idArea}
                  >
                    <option value="">Seleccione un departamento</option>
                    {filteredDepartamentos.map((depto) => (
                      <option
                        key={depto.idDepartamento}
                        value={depto.idDepartamento}
                      >
                        {depto.nombreDepartamento}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Rol</label>
                  <select
                    name="rol"
                    value={formData.rol ?? "Lector"}
                    onChange={handleChange}
                    className="inputedit"
                  >
                    <option value="Lector">Lector</option>
                    <option value="Editor">Editor</option>
                  </select>
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-edit">
                  {isCreating ? "Agregar" : "Actualizar"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
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
                      placeholder="Buscar usuario..."
                      className="search-input"
                    />
                    {searchText && (
                      <button
                        className="clear-search"
                        onClick={() => setSearchText("")}
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateForm}
                    className="add-button"
                  >
                    <span className="button-text">Agregar Usuario</span>
                  </button>
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
                      <th>Correo</th>
                      <th>Teléfono</th>
                      <th>Nivel</th>
                      <th>Organización</th>
                      <th>Área</th>
                      <th>Departamento</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersPaginados.length > 0 ? (
                      usersPaginados.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.nombre}</td>
                          <td>{user.apellidoPaterno}</td>
                          <td>{user.apellidoMaterno}</td>
                          <td>{user.correo}</td>
                          <td>{user.telefono}</td>
                          <td>
                            <span className={`nivel-badge nivel-${user.nivel}`}>
                              {(() => {
                                if (user.nivel === null) {
                                  return "Nivel no asignado";
                                }
                                switch (user.nivel) {
                                  case 1:
                                    return "SuperAdmin";
                                  case 2:
                                    return "AdminOrganización";
                                  case 3:
                                    return "Jefe de Área";
                                  case 4:
                                    return "Jefe de Departamento";
                                  case 5:
                                    return "Analista";
                                  default:
                                    return "Sin nivel";
                                }
                              })()}
                            </span>
                          </td>
                          <td>
                            {(() => {
                              const org = organizaciones.find(
                                (o) => o.idOrganizacion == user.organizacion
                              );
                              return org
                                ? org.nombreOrganizacion
                                : user.nombreOrganizacion || "-";
                            })()}
                          </td>
                          <td>
                            {(() => {
                              const area = areas.find(
                                (a) => a.idArea == user.area
                              );
                              return area
                                ? area.nombreArea
                                : user.nombreArea || "-";
                            })()}
                          </td>
                          <td>
                            {(() => {
                              const departamento = departamentos.find(
                                (d) => d.idDepartamento == user.departamento
                              );
                              return departamento
                                ? departamento.nombreDepartamento
                                : user.nombreDepartamento || "-";
                            })()}
                          </td>
                          <td>{user.rol}</td>
                          <td className="td-btn">
                            <button
                              onClick={() => handleEdit(user)}
                              className="action-button edit-button"
                              title="Editar usuario"
                            >
                              <FontAwesomeIcon
                                icon={faPencilAlt}
                                className="action-icon"
                              />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="action-button delete-button"
                              title="Eliminar usuario"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="action-icon"
                              />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="no-results">
                          No se encontraron usuarios
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {filteredUsers.length > 0 && (
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
                    <span className="pagination-total">
                      {filteredUsers.length} usuarios
                    </span>
                  </div>
                  <button
                    onClick={() => setPaginaActual(paginaActual + 1)}
                    disabled={
                      paginaActual === totalPaginas || totalPaginas === 0
                    }
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
  );
};

export default GestionDash;
