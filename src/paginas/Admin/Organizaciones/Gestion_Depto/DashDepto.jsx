import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";

const DashDepartamento = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [departamentos, setDepartamentos] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    idDepartamento: 0,
    nombreDepartamento: "",
    idArea: "",
    idOrganizacion: "",
  });
  const [areas, setAreas] = useState([]);
  const [organizaciones, setOrganizaciones] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "http://192.168.100.89:44444/api";
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
      const response = await fetch(`${API_URL}/departamentos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setDepartamentos(data);
      setError(null);
    } catch (error) {
      console.error("Error al obtener departamentos:", error);
      setError("Error al cargar los departamentos. Intente nuevamente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const obtenerOrganizaciones = async () => {
    try {
      const response = await fetch(`${API_URL}/organizaciones`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setOrganizaciones(data);
    } catch (error) {
      console.error("Error al obtener organizaciones:", error);
    }
  };

  const obtenerAreas = async () => {
    try {
      const response = await fetch(`${API_URL}/areas`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setAreas(data);
    } catch (error) {
      console.error("Error al obtener áreas:", error);
    }
  };

  const crearDepartamento = async () => {
    setLoading(true);
    try {
      const dataToSend = {
        idDepartamento: 0,
        nombreDepartamento: formData.nombreDepartamento,
        idArea: parseInt(formData.idArea, 10),
        idOrganizacion: parseInt(formData.idOrganizacion, 10),
      };

      const response = await fetch(`${API_URL}/departamentos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      
      resetearFormulario();
      obtenerDepartamentos();
      setMostrarFormulario(false);
      setError(null);
    } catch (error) {
      console.error("Error al crear el departamento:", error);
      setError("Error al crear el departamento. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const actualizarDepartamento = async () => {
    setLoading(true);
    try {
      const dataToSend = {
        idDepartamento: parseInt(formData.idDepartamento, 10),
        nombreDepartamento: formData.nombreDepartamento,
        idArea: parseInt(formData.idArea, 10),
        idOrganizacion: parseInt(formData.idOrganizacion, 10),
      };

      const response = await fetch(`${API_URL}/departamentos/${formData.idDepartamento}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      resetearFormulario();
      obtenerDepartamentos();
      setMostrarFormulario(false);
      setError(null);
    } catch (error) {
      console.error("Error al actualizar el departamento:", error);
      setError("Error al actualizar el departamento. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarDepartamento = async (id) => {
    if (window.confirm("¿Está seguro que desea eliminar este departamento?")) {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/departamentos/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        obtenerDepartamentos();
        setError(null);
      } catch (error) {
        console.error("Error al eliminar el departamento:", error);
        setError("Error al eliminar el departamento. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const areasFiltradas = () => {
    if (!formData.idOrganizacion) return [];
    return areas.filter(
      (area) => area.idOrganizacion === parseInt(formData.idOrganizacion, 10)
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "idOrganizacion" && { idArea: "" }) // Resetear área al cambiar organización
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombreDepartamento.trim()) return setError("El nombre del departamento no puede estar vacío");
    if (!formData.idOrganizacion) return setError("Debe seleccionar una organización");
    if (!formData.idArea) return setError("Debe seleccionar un área");
    
    setError(null);
    departamentoSeleccionado ? actualizarDepartamento() : crearDepartamento();
  };

  const prepararEdicion = (departamento) => {
    setDepartamentoSeleccionado(departamento);
    setFormData({
      idDepartamento: departamento.idDepartamento,
      nombreDepartamento: departamento.nombreDepartamento,
      idArea: departamento.idArea,
      idOrganizacion: departamento.idOrganizacion,
    });
    setMostrarFormulario(true);
  };

  const resetearFormulario = () => {
    setFormData({
      idDepartamento: 0,
      nombreDepartamento: "",
      idArea: "",
      idOrganizacion: "",
    });
    setDepartamentoSeleccionado(null);
  };

  const mostrarFormularioNuevo = () => {
    resetearFormulario();
    setMostrarFormulario(true);
  };

  useEffect(() => {
    obtenerDepartamentos();
    obtenerOrganizaciones();
    obtenerAreas();
  }, []);

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="content-wrapper">
        <div className="content-container">
          <div className="header-actions">
            <h2>Gestión de Departamentos</h2>
            <button
              className="bg-green-500"
              onClick={mostrarFormularioNuevo}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Agregar Departamento"}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {mostrarFormulario && (
            <div className="form-container">
              <h3>
                {departamentoSeleccionado ? "Editar Departamento" : "Agregar Departamento"}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Organización:</label>
                    <select
                      name="idOrganizacion"
                      value={formData.idOrganizacion}
                      onChange={handleChange}
                      required
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

                  <div className="form-group">
                    <label>Área:</label>
                    <select
                      name="idArea"
                      value={formData.idArea}
                      onChange={handleChange}
                      required
                      disabled={!formData.idOrganizacion || loading}
                    >
                      <option value="">Seleccione un área</option>
                      {areasFiltradas().map((area) => (
                        <option key={area.idArea} value={area.idArea}>
                          {area.nombreArea}
                        </option>
                      ))}
                    </select>
                    {formData.idOrganizacion && areasFiltradas().length === 0 && (
                      <p className="warning">No hay áreas disponibles para esta organización</p>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Nombre del Departamento:</label>
                    <input
                      type="text"
                      name="nombreDepartamento"
                      value={formData.nombreDepartamento}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Nombre del departamento"
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  <button type="submit" className="btn-edit" disabled={loading}>
                    {loading ? "Procesando..." : departamentoSeleccionado ? "Actualizar" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setMostrarFormulario(false);
                      resetearFormulario();
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && !mostrarFormulario && <div className="loading">Cargando datos...</div>}

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
                {departamentos.map((departamento) => {
                  const organizacion = organizaciones.find(
                    (org) => org.idOrganizacion === departamento.idOrganizacion
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
                      <td>
                        <button
                          className="bg-yellow-500"
                          onClick={() => prepararEdicion(departamento)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button
                          className="bg-red-500"
                          onClick={() => eliminarDepartamento(departamento.idDepartamento)}
                          disabled={loading}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashDepartamento;