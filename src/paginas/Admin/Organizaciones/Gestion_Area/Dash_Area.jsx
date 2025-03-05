import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";

const DashArea = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [areas, setAreas] = useState([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    idArea: 0,
    nombreArea: "",
    idOrganizacion: 0,
  });
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

  const crearArea = async () => {
    setLoading(true);
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
      setMostrarFormulario(false);
      setError(null);
    } catch (error) {
      console.error("Error al crear el área:", error);
      setError("Error al crear el área. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const actualizarArea = async () => {
    setLoading(true);
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
      setMostrarFormulario(false);
      setError(null);
    } catch (error) {
      console.error("Error al actualizar el área:", error);
      setError("Error al actualizar el área. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarArea = async (id) => {
    if (window.confirm("¿Está seguro que desea eliminar esta área?")) {
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
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombreArea.trim()) return setError("El nombre del área no puede estar vacío");
    if (!formData.idOrganizacion) return setError("Debe seleccionar una organización");
    
    setError(null);
    areaSeleccionada ? actualizarArea() : crearArea();
  };

  const prepararEdicion = (area) => {
    setAreaSeleccionada(area);
    setFormData({
      idArea: area.idArea,
      nombreArea: area.nombreArea,
      idOrganizacion: area.idOrganizacion,
    });
    setMostrarFormulario(true);
  };

  const resetearFormulario = () => {
    setFormData({
      idArea: 0,
      nombreArea: "",
      idOrganizacion: 0,
    });
    setAreaSeleccionada(null);
  };

  const mostrarFormularioNuevo = () => {
    resetearFormulario();
    setMostrarFormulario(true);
  };

  useEffect(() => {
    obtenerAreas();
    obtenerOrganizaciones();
  }, []);

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="content-wrapper">
        <div className="content-container">
          <div className="header-actions">
            <h2>Lista de Áreas</h2>
            <button
              className="bg-green-500"
              onClick={mostrarFormularioNuevo}
              disabled={loading}
            >
              {loading ? "Procesando..." : "Agregar Área"}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {mostrarFormulario && (
            <div className="form-container">
              <h3>{areaSeleccionada ? "Editar Área" : "Agregar Área"}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombre del Área:</label>
                  <input
                    type="text"
                    name="nombreArea"
                    value={formData.nombreArea}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

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

                <div className="form-buttons">
                  <button type="submit" className="btn-edit" disabled={loading}>
                    {areaSeleccionada ? "Actualizar" : "Guardar"}
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
                {areas.map((area) => {
                  const organizacion = organizaciones.find(
                    (org) => org.idOrganizacion === area.idOrganizacion
                  );
                  
                  return (
                    <tr key={area.idArea}>
                      <td>{area.idArea}</td>
                      <td>{area.nombreArea}</td>
                      <td>{organizacion?.nombreOrganizacion || "-"}</td>
                      <td>
                        <button
                          className="bg-yellow-500"
                          onClick={() => prepararEdicion(area)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button
                          className="bg-red-500"
                          onClick={() => eliminarArea(area.idArea)}
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

export default DashArea;