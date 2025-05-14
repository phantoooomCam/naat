"use client";

import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";
import fetchWithAuth from "../../../../utils/fetchWithAuth";

const DashDepartamento = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [areas, setAreas] = useState([]);
  const [organizaciones, setOrganizaciones] = useState([]);
  const [formData, setFormData] = useState({
    idDepartamento: 0,
    nombreDepartamento: "",
    idArea: "",
    idOrganizacion: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const API_URL = "/api";
  const token = localStorage.getItem("token");

  // Observador del sidebar
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

  const obtenerDepartamentos = async () => {
    setLoading(true);
    try {
      const deptosRes = await fetchWithAuth("/api/departamentos");
      const deptosData = await deptosRes.json();

      // Determinar si la respuesta contiene un arreglo válido
      const deptosArray = Array.isArray(deptosData)
        ? deptosData
        : Array.isArray(deptosData.departamentos)
        ? deptosData.departamentos
        : [];

      // Setear mensaje de error si la respuesta contiene un mensaje en vez de datos
      if (!deptosArray.length && deptosData.mensaje) {
        setError(deptosData.mensaje);
      }

      setDepartamentos(deptosArray);
    } catch (err) {
      console.error("Error al obtener departamentos:", err);
      setError("No se pudieron cargar los departamentos. Intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const obtenerOrganizaciones = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/organizaciones`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setOrganizaciones(data);
    } catch (error) {
      console.error("Error al obtener organizaciones:", error);
    }
  };

  const obtenerAreas = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/areas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setAreas(data);
    } catch (error) {
      console.error("Error al obtener áreas:", error);
    }
  };

  // Filtrar áreas basadas en la organización seleccionada
  useEffect(() => {
    if (formData.idOrganizacion) {
      const areasDeOrganizacion = areas.filter(
        (area) =>
          area.idOrganizacion === Number.parseInt(formData.idOrganizacion, 10)
      );
      setFilteredAreas(areasDeOrganizacion);

      // Reset área seleccionada si la organización cambia
      if (!areasDeOrganizacion.some((a) => a.idArea == formData.idArea)) {
        setFormData((prev) => ({
          ...prev,
          idArea: "",
        }));
      }
    } else {
      setFilteredAreas([]);
    }
  }, [formData.idOrganizacion, areas]);

  const crearDepartamento = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.nombreDepartamento.trim()) {
      setError("El nombre del departamento no puede estar vacío");
      setLoading(false);
      return;
    }

    if (!formData.idOrganizacion) {
      setError("Debe seleccionar una organización");
      setLoading(false);
      return;
    }

    if (!formData.idArea) {
      setError("Debe seleccionar un área");
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        idDepartamento: 0,
        nombreDepartamento: formData.nombreDepartamento,
        idArea: Number.parseInt(formData.idArea, 10),
        idOrganizacion: Number.parseInt(formData.idOrganizacion, 10),
      };

      const response = await fetchWithAuth(`${API_URL}/departamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(dataToSend),
      });

      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);

      resetearFormulario();
      obtenerDepartamentos();
      setIsCreating(false);
      setError(null);

      setSuccessMessage("Departamento creado correctamente");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error al crear el departamento:", error);
      setError("Error al crear el departamento. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const actualizarDepartamento = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.nombreDepartamento.trim()) {
      setError("El nombre del departamento no puede estar vacío");
      setLoading(false);
      return;
    }

    if (!formData.idOrganizacion) {
      setError("Debe seleccionar una organización");
      setLoading(false);
      return;
    }

    if (!formData.idArea) {
      setError("Debe seleccionar un área");
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        idDepartamento: Number.parseInt(formData.idDepartamento, 10),
        nombreDepartamento: formData.nombreDepartamento,
        idArea: Number.parseInt(formData.idArea, 10),
        idOrganizacion: Number.parseInt(formData.idOrganizacion, 10),
      };

      const response = await fetchWithAuth(
        `${API_URL}/departamentos/${formData.idDepartamento}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);

      resetearFormulario();
      obtenerDepartamentos();
      setIsEditing(false);
      setError(null);

      setSuccessMessage("Departamento actualizado correctamente");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error al actualizar el departamento:", error);
      setError("Error al actualizar el departamento. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarDepartamento = async (id) => {
    const confirmar = window.confirm(
      "¿Está seguro que desea eliminar este departamento?"
    );
    if (!confirmar) return;

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/departamentos/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);

      obtenerDepartamentos();
      setError(null);

      setSuccessMessage("Departamento eliminado correctamente");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error("Error al eliminar el departamento:", error);
      setError("Error al eliminar el departamento. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const seleccionarDepartamento = (departamento) => {
    setFormData({
      idDepartamento: departamento.idDepartamento,
      nombreDepartamento: departamento.nombreDepartamento,
      idArea: departamento.idArea,
      idOrganizacion: departamento.idOrganizacion,
    });
    setIsEditing(true);
  };

  const resetearFormulario = () => {
    setFormData({
      idDepartamento: 0,
      nombreDepartamento: "",
      idArea: "",
      idOrganizacion: "",
    });
  };

  const handleOpenCreateForm = () => {
    resetearFormulario();
    setIsCreating(true);
  };

  useEffect(() => {
    obtenerDepartamentos();
    obtenerOrganizaciones();
    obtenerAreas();
  }, []);

  const departamentosFiltrados = departamentos.filter((departamento) =>
    departamento.nombreDepartamento.toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading && !isEditing && !isCreating) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando departamentos...</p>
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
            <h2>Gestión de Departamentos</h2>
            <p className="section-description">
              Administra la información de los departamentos
            </p>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: "15px" }}>
              {error}
            </div>
          )}

          {isEditing ? (
            <form
              onSubmit={actualizarDepartamento}
              className="gestion-form editing-mode"
            >
              <div className="form-grid">
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
                    value={formData.idArea}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={!formData.idOrganizacion || loading}
                  >
                    <option value="">Seleccione un área</option>
                    {filteredAreas.map((area) => (
                      <option key={area.idArea} value={area.idArea}>
                        {area.nombreArea}
                      </option>
                    ))}
                  </select>
                  {formData.idOrganizacion && filteredAreas.length === 0 && (
                    <p className="warning">
                      No hay áreas disponibles para esta organización
                    </p>
                  )}
                </div>
                <div className="form-field">
                  <label>Nombre del Departamento</label>
                  <input
                    type="text"
                    name="nombreDepartamento"
                    placeholder="Nombre del departamento"
                    value={formData.nombreDepartamento}
                    onChange={handleChange}
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
                    setIsEditing(false);
                    resetearFormulario();
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : isCreating ? (
            <form
              onSubmit={crearDepartamento}
              className="gestion-form editing-mode"
            >
              <div className="form-grid">
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
                    value={formData.idArea}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={!formData.idOrganizacion || loading}
                  >
                    <option value="">Seleccione un área</option>
                    {filteredAreas.map((area) => (
                      <option key={area.idArea} value={area.idArea}>
                        {area.nombreArea}
                      </option>
                    ))}
                  </select>
                  {formData.idOrganizacion && filteredAreas.length === 0 && (
                    <p className="warning">
                      No hay áreas disponibles para esta organización
                    </p>
                  )}
                </div>
                <div className="form-field">
                  <label>Nombre del Departamento</label>
                  <input
                    type="text"
                    name="nombreDepartamento"
                    placeholder="Nombre del departamento"
                    value={formData.nombreDepartamento}
                    onChange={handleChange}
                    className="inputedit"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-edit" disabled={loading}>
                  {loading ? "Procesando..." : "Crear"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsCreating(false)}
                  disabled={loading}
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
                      placeholder="Buscar departamento..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="search-input"
                    />
                    {filtro && (
                      <button
                        className="clear-search"
                        onClick={() => setFiltro("")}
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
                    disabled={loading}
                  >
                    <span className="button-icon">+</span>
                    <span className="button-text">Agregar Departamento</span>
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
                      <th>Área</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departamentosFiltrados.length > 0 ? (
                      departamentosFiltrados.map((departamento) => {
                        const organizacion = organizaciones.find(
                          (org) =>
                            org.idOrganizacion === departamento.idOrganizacion
                        );
                        const area = areas.find(
                          (area) => area.idArea === departamento.idArea
                        );

                        return (
                          <tr key={departamento.idDepartamento}>
                            <td>{departamento.idDepartamento}</td>
                            <td>{departamento.nombreDepartamento}</td>
                            <td>{organizacion?.nombreOrganizacion || "-"}</td>
                            <td>{area?.nombreArea || "-"}</td>
                            <td className="td-btn">
                              <button
                                onClick={() =>
                                  seleccionarDepartamento(departamento)
                                }
                                className="action-button edit-button"
                                title="Editar departamento"
                                disabled={loading}
                              >
                                <i className="fas fa-pencil-alt"></i>
                              </button>
                              <button
                                onClick={() =>
                                  eliminarDepartamento(
                                    departamento.idDepartamento
                                  )
                                }
                                className="action-button delete-button"
                                title="Eliminar departamento"
                                disabled={loading}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-results">
                          No se encontraron departamentos
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
  );
};

export default DashDepartamento;
