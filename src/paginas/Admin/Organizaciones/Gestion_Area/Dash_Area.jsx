import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";

const DashArea = () => {
  const [areas, setAreas] = useState([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    idArea: 0,
    nombreArea: "",
    idOrganizacion: 0,
    organizacion: null, // Inicialmente nulo
  });
  const [organizaciones, setOrganizaciones] = useState([]);
  const [error, setError] = useState(null);

  const API_URL = "http://192.168.100.89:44444/api";
  const token = localStorage.getItem("token");

  // Obtener áreas
  const obtenerAreas = async () => {
    try {
      const response = await fetch(`${API_URL}/areas`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Áreas obtenidas:", data);
      setAreas(data);
    } catch (error) {
      console.error("Error al obtener áreas:", error);
      setError("Error al cargar las áreas. Intente nuevamente más tarde.");
    }
  };

  // Obtener organizaciones para el formulario
  const obtenerOrganizaciones = async () => {
    try {
      const response = await fetch(`${API_URL}/organizaciones`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Organizaciones obtenidas:", data);
      setOrganizaciones(data);
    } catch (error) {
      console.error("Error al obtener organizaciones:", error);
    }
  };

  // Crear nueva área
  const crearArea = async () => {
    try {
      // Preparamos el objeto exactamente como lo espera la API
      const dataToSend = {
        idArea: 0, // Siempre 0 para nuevas áreas
        nombreArea: formData.nombreArea,
        idOrganizacion: parseInt(formData.idOrganizacion, 10),
        organizacion: null, // Puede que la API no necesite esto para crear
      };

      console.log("Enviando datos para crear área:", dataToSend);

      const response = await fetch(`${API_URL}/areas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta de error del servidor:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Respuesta al crear área:", responseData);

      resetearFormulario();
      obtenerAreas();
      setMostrarFormulario(false);
      setError(null);
    } catch (error) {
      console.error("Error al crear el área:", error);
      setError("Error al crear el área. Intente nuevamente.");
    }
  };

  // Actualizar área existente
  const actualizarArea = async () => {
    try {
      // Preparamos el objeto exactamente como lo espera la API
      const dataToSend = {
        idArea: parseInt(formData.idArea, 10),
        nombreArea: formData.nombreArea,
        idOrganizacion: parseInt(formData.idOrganizacion, 10),
        organizacion: null, // No enviamos esto para actualizar
      };

      console.log("Enviando datos para actualizar área:", dataToSend);

      const response = await fetch(`${API_URL}/areas/${formData.idArea}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta de error del servidor:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Respuesta al actualizar área:", responseData);

      resetearFormulario();
      obtenerAreas();
      setMostrarFormulario(false);
      setError(null);
    } catch (error) {
      console.error("Error al actualizar el área:", error);
      setError("Error al actualizar el área. Intente nuevamente.");
    }
  };

  // Eliminar área
  const eliminarArea = async (id) => {
    if (window.confirm("¿Está seguro que desea eliminar esta área?")) {
      try {
        console.log("Intentando eliminar área con ID:", id);

        const response = await fetch(`${API_URL}/areas/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Respuesta de error del servidor:", errorText);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        console.log("Área eliminada con éxito");
        obtenerAreas();
        setError(null);
      } catch (error) {
        console.error("Error al eliminar el área:", error);
        setError("Error al eliminar el área. Intente nuevamente.");
      }
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombreArea.trim()) {
      setError("El nombre del área no puede estar vacío");
      return;
    }

    if (!formData.idOrganizacion) {
      setError("Debe seleccionar una organización");
      return;
    }

    setError(null);

    if (areaSeleccionada) {
      actualizarArea();
    } else {
      crearArea();
    }
  };

  // Preparar formulario para editar
  const prepararEdicion = (area) => {
    setAreaSeleccionada(area);
    setFormData({
      idArea: area.idArea,
      nombreArea: area.nombreArea,
      idOrganizacion: area.idOrganizacion,
    });
    setMostrarFormulario(true);
  };

  // Resetear formulario
  const resetearFormulario = () => {
    setFormData({
      idArea: 0,
      nombreArea: "",
      idOrganizacion: 0,
      organizacion: null,
    });
    setAreaSeleccionada(null);
  };

  // Mostrar formulario para nueva área
  const mostrarFormularioNuevo = () => {
    resetearFormulario();
    setMostrarFormulario(true);
  };

  // Cargar datos iniciales
  useEffect(() => {
    obtenerAreas();
    obtenerOrganizaciones();
  }, []);

  return (
    <div className="content-wrapper">
      <div className="content-container">
        <div className="header-actions">
          <h2>Lista de Áreas</h2>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={mostrarFormularioNuevo}
          >
            Agregar Área
          </button>
        </div>

        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {mostrarFormulario && (
          <div className="form-container bg-white p-4 rounded shadow mb-4">
            <h3 className="text-lg font-semibold mb-4">
              {areaSeleccionada ? "Editar Área" : "Agregar Área"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-4">
                <label htmlFor="nombreArea" className="block mb-1">
                  Nombre del Área:
                </label>
                <input
                  type="text"
                  id="nombreArea"
                  name="nombreArea"
                  value={formData.nombreArea}
                  onChange={handleChange}
                  required
                  className="form-input w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="form-group mb-4">
                <label htmlFor="idOrganizacion" className="block mb-1">
                  Organización:
                </label>
                <select
                  id="idOrganizacion"
                  name="idOrganizacion"
                  value={formData.idOrganizacion}
                  onChange={handleChange}
                  required
                  className="form-select w-full px-3 py-2 border rounded"
                >
                  <option value="">Seleccione una organización</option>
                  {organizaciones.map((org) => (
                    <option key={org.idOrganizacion} value={org.idOrganizacion}>
                      {org.nombreOrganizacion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions flex">
                <button type="submit" className="editar-btn">
                  {areaSeleccionada ? "Actualizar" : "Guardar"}
                </button>
                <button
                  type="button"
                  className="editar-btn2"
                  onClick={() => {
                    setMostrarFormulario(false);
                    resetearFormulario();
                  }}
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
                <th>ID Organización</th>
                <th>Nombre Organización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {areas.length > 0 ? (
                areas.map((area) => (
                  <tr key={area.idArea}>
                    <td>{area.idArea}</td>
                    <td>{area.nombreArea}</td>
                    <td>{area.idOrganizacion}</td>
                    <td>
                      {area.organizacion
                        ? area.organizacion.nombreOrganizacion
                        : organizaciones.find(
                            (org) => org.idOrganizacion === area.idOrganizacion
                          )?.nombreOrganizacion || "-"}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
                        onClick={() => prepararEdicion(area)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded"
                        onClick={() => eliminarArea(area.idArea)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No hay áreas disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashArea;
