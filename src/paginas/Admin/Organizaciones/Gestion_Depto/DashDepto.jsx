import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import "../../Usuarios/Gestion/Gestion.css";

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
    
    if(!formData.idArea) {
      setError("Debe seleccionar un área");
      setLoading(false);
      return;
    }

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
      setIsCreating(false);
      setError(null);
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
    
    if(!formData.idArea) {
      setError("Debe seleccionar un área");
      setLoading(false);
      return;
    }

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
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error("Error al actualizar el departamento:", error);
      setError("Error al actualizar el departamento. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarDepartamento = async (id) => {
    const confirmar = window.confirm("¿Está seguro que desea eliminar este departamento?");
    if (!confirmar) return;
    
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

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className={`content-wrapper ${isEditing || isCreating ? "editing-mode" : ""}`}>
        <div className="content-container">
          <div className="perfil-header">
            <h2>Lista de Departamentos</h2>
            <p className="perfil-subtitle">
              Gestiona la información de los departamentos
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {isEditing ? (
            <form onSubmit={actualizarDepartamento} className="gestion-form editing-mode">
              <div className="form-grid">
                <div>
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
                <div>
                  <label>Área</label>
                  <select
                    name="idArea"
                    value={formData.idArea}
                    onChange={handleChange}
                    className="inputedit"
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
                <div>
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
            <form onSubmit={crearDepartamento} className="gestion-form editing-mode">
              <div className="form-grid">
                <div>
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
                <div>
                  <label>Área</label>
                  <select
                    name="idArea"
                    value={formData.idArea}
                    onChange={handleChange}
                    className="inputedit"
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
                <div>
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
                  <input
                    type="text"
                    placeholder="Buscar departamento..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="search-input"
                  />
                  <button
                    type="button"
                    onClick={handleOpenCreateForm}
                    className="bg-green-500 add-button"
                    disabled={loading}
                  >
                    Agregar
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
                    {departamentosFiltrados.map((departamento) => {
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
                          <td className="td-btn">
                            <button
                              onClick={() => seleccionarDepartamento(departamento)}
                              className="bg-green-400"
                              disabled={loading}
                            >
                              <FontAwesomeIcon
                                icon={faPencilAlt}
                                className="w-6 h-6"
                              />
                            </button>
                            <button
                              onClick={() => eliminarDepartamento(departamento.idDepartamento)}
                              className="bg-red-400"
                              disabled={loading}
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="w-6 h-6"
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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