import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import "../../Usuarios/Gestion/Gestion.css";

const DashArea = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [areas, setAreas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [organizaciones, setOrganizaciones] = useState([]);
  const [formData, setFormData] = useState({
    idArea: 0,
    nombreArea: "",
    idOrganizacion: 0,
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

  const obtenerAreas = async () => {
    setLoading(true);
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
      setError(null);
    } catch (error) {
      console.error("Error al obtener áreas:", error);
      setError("Error al cargar las áreas. Intente nuevamente más tarde.");
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

  const crearArea = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.nombreArea.trim()) {
      setError("El nombre del área no puede estar vacío");
      setLoading(false);
      return;
    }
    
    if (!formData.idOrganizacion) {
      setError("Debe seleccionar una organización");
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        idArea: 0,
        nombreArea: formData.nombreArea,
        idOrganizacion: parseInt(formData.idOrganizacion, 10),
      };

      const response = await fetch(`${API_URL}/areas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      resetearFormulario();
      obtenerAreas();
      setIsCreating(false);
      setError(null);
    } catch (error) {
      console.error("Error al crear el área:", error);
      setError("Error al crear el área. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const actualizarArea = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.nombreArea.trim()) {
      setError("El nombre del área no puede estar vacío");
      setLoading(false);
      return;
    }
    
    if (!formData.idOrganizacion) {
      setError("Debe seleccionar una organización");
      setLoading(false);
      return;
    }

    try {
      const dataToSend = {
        idArea: parseInt(formData.idArea, 10),
        nombreArea: formData.nombreArea,
        idOrganizacion: parseInt(formData.idOrganizacion, 10),
      };

      const response = await fetch(`${API_URL}/areas/${formData.idArea}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      resetearFormulario();
      obtenerAreas();
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error("Error al actualizar el área:", error);
      setError("Error al actualizar el área. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarArea = async (id) => {
    const confirmar = window.confirm("¿Está seguro que desea eliminar esta área?");
    if (!confirmar) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/areas/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      
      obtenerAreas();
      setError(null);
    } catch (error) {
      console.error("Error al eliminar el área:", error);
      setError("Error al eliminar el área. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const seleccionarArea = (area) => {
    setFormData({
      idArea: area.idArea,
      nombreArea: area.nombreArea,
      idOrganizacion: area.idOrganizacion,
    });
    setIsEditing(true);
  };

  const resetearFormulario = () => {
    setFormData({
      idArea: 0,
      nombreArea: "",
      idOrganizacion: 0,
    });
  };

  const handleOpenCreateForm = () => {
    resetearFormulario();
    setIsCreating(true);
  };

  useEffect(() => {
    obtenerAreas();
    obtenerOrganizaciones();
  }, []);

  const areasFiltradas = areas.filter((area) =>
    area.nombreArea.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className={`content-wrapper ${isEditing || isCreating ? "editing-mode" : ""}`}>
        <div className="content-container">
          <div className="perfil-header">
            <h2>Lista de Áreas</h2>
            <p className="perfil-subtitle">
              Gestiona la información de las áreas
            </p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {isEditing ? (
            <form onSubmit={actualizarArea} className="gestion-form editing-mode">
              <div className="form-grid">
                <div>
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
            <form onSubmit={crearArea} className="gestion-form editing-mode">
              <div className="form-grid">
                <div>
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
                    placeholder="Buscar área..."
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
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areasFiltradas.map((area) => {
                      const organizacion = organizaciones.find(
                        (org) => org.idOrganizacion === area.idOrganizacion
                      );
                      
                      return (
                        <tr key={area.idArea}>
                          <td>{area.idArea}</td>
                          <td>{area.nombreArea}</td>
                          <td>{organizacion?.nombreOrganizacion || "-"}</td>
                          <td className="td-btn">
                            <button
                              onClick={() => seleccionarArea(area)}
                              className="bg-green-400"
                              disabled={loading}
                            >
                              <FontAwesomeIcon
                                icon={faPencilAlt}
                                className="w-6 h-6"
                              />
                            </button>
                            <button
                              onClick={() => eliminarArea(area.idArea)}
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

export default DashArea;