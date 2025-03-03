import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";

const DashDepartamento = () => {
  const [departamentos, setDepartamentos] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] =
    useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    idDepartamento: 0,
    nombreDepartamento: "",
    idArea: 0,
    idOrganizacion: 0,
  });
  const [areas, setAreas] = useState([]);
  const [organizaciones, setOrganizaciones] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "http://192.168.100.89:44444/api";
  const token = localStorage.getItem("token");

  // Obtener departamentos
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
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Departamentos obtenidos:", data);
      setDepartamentos(data);
      setError(null);
    } catch (error) {
      console.error("Error al obtener departamentos:", error);
      setError(
        "Error al cargar los departamentos. Intente nuevamente más tarde."
      );
    } finally {
      setLoading(false);
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

  // Obtener áreas para el formulario
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
    }
  };

  // Crear nuevo departamento
  const crearDepartamento = async () => {
    setLoading(true);
    try {
      // Preparar datos para enviar - Solo enviar los IDs, no los objetos completos
      const dataToSend = {
        idDepartamento: 0,
        nombreDepartamento: formData.nombreDepartamento,
        idArea: parseInt(formData.idArea, 10),
        idOrganizacion: parseInt(formData.idOrganizacion, 10),
      };

      console.log("Enviando datos para crear departamento:", dataToSend);

      const response = await fetch(`${API_URL}/departamentos`, {
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
      console.log("Respuesta al crear departamento:", responseData);

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

  // Actualizar departamento existente
  const actualizarDepartamento = async () => {
    setLoading(true);
    try {
      // Preparar datos para enviar - Solo enviar los IDs, no los objetos completos
      const dataToSend = {
        idDepartamento: parseInt(formData.idDepartamento, 10),
        nombreDepartamento: formData.nombreDepartamento,
        idArea: parseInt(formData.idArea, 10),
        idOrganizacion: parseInt(formData.idOrganizacion, 10),
      };

      console.log("Enviando datos para actualizar departamento:", dataToSend);

      const response = await fetch(
        `${API_URL}/departamentos/${formData.idDepartamento}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Respuesta de error del servidor:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Respuesta al actualizar departamento:", responseData);

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

  // Eliminar departamento
  const eliminarDepartamento = async (id) => {
    if (window.confirm("¿Está seguro que desea eliminar este departamento?")) {
      setLoading(true);
      try {
        console.log("Intentando eliminar departamento con ID:", id);

        const response = await fetch(`${API_URL}/departamentos/${id}`, {
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

        console.log("Departamento eliminado con éxito");
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

  // Filtrar áreas por organización seleccionada
  const areasFiltradas = () => {
    if (!formData.idOrganizacion) return [];
    return areas.filter(
      (area) => area.idOrganizacion === parseInt(formData.idOrganizacion, 10)
    );
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "idOrganizacion") {
      // Al cambiar organización, resetear el área seleccionada
      setFormData({
        ...formData,
        [name]: value,
        idArea: 0, // Resetear área
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombreDepartamento.trim()) {
      setError("El nombre del departamento no puede estar vacío");
      return;
    }

    if (!formData.idOrganizacion) {
      setError("Debe seleccionar una organización");
      return;
    }

    if (!formData.idArea) {
      setError("Debe seleccionar un área");
      return;
    }

    setError(null);

    if (departamentoSeleccionado) {
      actualizarDepartamento();
    } else {
      crearDepartamento();
    }
  };

  // Preparar formulario para editar
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

  // Resetear formulario
  const resetearFormulario = () => {
    setFormData({
      idDepartamento: 0,
      nombreDepartamento: "",
      idArea: 0,
      idOrganizacion: 0,
    });
    setDepartamentoSeleccionado(null);
  };

  // Mostrar formulario para nuevo departamento
  const mostrarFormularioNuevo = () => {
    resetearFormulario();
    setMostrarFormulario(true);
  };

  // Cargar datos iniciales
  useEffect(() => {
    obtenerDepartamentos();
    obtenerOrganizaciones();
    obtenerAreas();
  }, []);

  return (
    <div className="content-wrapper">
      <div className="content-container">
        <div className="header-actions flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Gestión de Departamentos</h2>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={mostrarFormularioNuevo}
            disabled={loading}
          >
            {loading ? "Procesando..." : "Agregar Departamento"}
          </button>
        </div>

        {error && (
          <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {mostrarFormulario && (
          <div className="form-container bg-white p-6 rounded shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {departamentoSeleccionado
                ? "Editar Departamento"
                : "Agregar Departamento"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="form-group">
                  <label
                    htmlFor="idOrganizacion"
                    className="block mb-1 font-medium"
                  >
                    Organización:
                  </label>
                  <select
                    id="idOrganizacion"
                    name="idOrganizacion"
                    value={formData.idOrganizacion}
                    onChange={handleChange}
                    required
                    className="form-select w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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

                <div className="form-group">
                  <label htmlFor="idArea" className="block mb-1 font-medium">
                    Área:
                  </label>
                  <select
                    id="idArea"
                    name="idArea"
                    value={formData.idArea}
                    onChange={handleChange}
                    required
                    className="form-select w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    <p className="text-yellow-600 text-sm mt-1">
                      No hay áreas disponibles para esta organización
                    </p>
                  )}
                </div>

                <div className="form-group md:col-span-2">
                  <label
                    htmlFor="nombreDepartamento"
                    className="block mb-1 font-medium"
                  >
                    Nombre del Departamento:
                  </label>
                  <input
                    type="text"
                    id="nombreDepartamento"
                    name="nombreDepartamento"
                    value={formData.nombreDepartamento}
                    onChange={handleChange}
                    required
                    className="form-input w-full px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={loading}
                    placeholder="Ingrese el nombre del departamento"
                  />
                </div>
              </div>

              <div className="form-actions flex mt-6">
                <button type="submit" className="editar-btn" disabled={loading}>
                  {loading
                    ? "Procesando..."
                    : departamentoSeleccionado
                    ? "Actualizar"
                    : "Guardar"}
                </button>
                <button
                  type="button"
                  className="editar-btn2"
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

        {loading && !mostrarFormulario && (
          <div className="loading-indicator text-center py-4">
            <p>Cargando datos...</p>
          </div>
        )}

        <div className="table-container overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">ID</th>
                <th className="py-2 px-4 border text-left">Nombre</th>
                <th className="py-2 px-4 border text-left">Organización</th>
                <th className="py-2 px-4 border text-left">Área</th>
                <th className="py-2 px-4 border text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {departamentos.length > 0 ? (
                departamentos.map((departamento) => {
                  // Buscar el nombre de la organización y área usando los IDs
                  const organizacion = organizaciones.find(
                    (org) => org.idOrganizacion === departamento.idOrganizacion
                  );
                  const area = areas.find(
                    (area) => area.idArea === departamento.idArea
                  );

                  return (
                    <tr
                      key={departamento.idDepartamento}
                      className="hover:bg-gray-50"
                    >
                      <td className="py-2 px-4 border">
                        {departamento.idDepartamento}
                      </td>
                      <td className="py-2 px-4 border">
                        {departamento.nombreDepartamento}
                      </td>
                      <td className="py-2 px-4 border">
                        {organizacion ? organizacion.nombreOrganizacion : "-"}
                      </td>
                      <td className="py-2 px-4 border">
                        {area ? area.nombreArea : "-"}
                      </td>
                      <td className="py-2 px-4 border text-center">
                        <button
                          className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600"
                          onClick={() => prepararEdicion(departamento)}
                          disabled={loading}
                        >
                          Editar
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          onClick={() =>
                            eliminarDepartamento(departamento.idDepartamento)
                          }
                          disabled={loading}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 px-4 border text-center">
                    {loading
                      ? "Cargando departamentos..."
                      : "No hay departamentos disponibles"}
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

export default DashDepartamento;
