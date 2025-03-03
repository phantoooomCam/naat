import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";

const DashOrga = () => {
  const [organizaciones, setOrganizaciones] = useState([]);
  const [filtro, setFiltro] = useState(""); // Estado para la barra de búsqueda
  const [nuevaOrganizacion, setNuevaOrganizacion] = useState(""); // Estado para el formulario
  const [organizacionEditar, setOrganizacionEditar] = useState(null); // Estado para la organización que se está editando
  const API_URL = "http://192.168.100.89:44444/api/organizaciones";
  const token = localStorage.getItem("token");

  const obtenerOrganizaciones = async () => {
    try {
      const response = await fetch(API_URL, {
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
      setOrganizaciones(data);
    } catch (error) {
      console.error("Error al obtener organizaciones:", error);
    }
  };

  const crearOrganizacion = async (e) => {
    e.preventDefault();
    if (nuevaOrganizacion.trim() === "") {
      alert("El nombre de la organización no puede estar vacío.");
      return;
    }

    const nuevaOrg = {
      nombreOrganizacion: nuevaOrganizacion,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevaOrg),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setNuevaOrganizacion(""); // Limpiar el input
      obtenerOrganizaciones(); // Volver a cargar la lista
    } catch (error) {
      console.error("Error al crear organización:", error);
    }
  };

  const eliminarOrganizacion = async (id) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar esta organización?"
    );
    if (!confirmar) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar la lista tras la eliminación
      obtenerOrganizaciones();
    } catch (error) {
      console.error("Error al eliminar organización:", error);
      alert("Error al eliminar la organización.");
    }
  };

  const editarOrganizacion = async (e, id, nuevoNombre) => {
    e.preventDefault(); // Esto previene que el formulario se envíe y recargue la página

    if (nuevoNombre.trim() === "") {
      alert("El nombre de la organización no puede estar vacío.");
      return;
    }

    // Crear el objeto JSON con el id de la organización y el nuevo nombre
    const organizacionActualizada = {
      idOrganizacion: id, // Agregar el id de la organización
      nombreOrganizacion: nuevoNombre,
    };


    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(organizacionActualizada), // Enviar el JSON con el id y el nombre
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Aquí puedes actualizar el estado directamente sin recargar la página
      setOrganizaciones((prevOrganizaciones) =>
        prevOrganizaciones.map((org) =>
          org.idOrganizacion === id
            ? { ...org, nombreOrganizacion: nuevoNombre }
            : org
        )
      );
      setOrganizacionEditar(null); // Limpiar el formulario de edición
    } catch (error) {
      console.error("Error al editar organización:", error);
      alert("Error al editar la organización.");
    }
  };

  const seleccionarOrganizacion = (org) => {
    setOrganizacionEditar(org); // Establecer la organización a editar
  };

  useEffect(() => {
    obtenerOrganizaciones();
  }, []);

  const organizacionesFiltradas = organizaciones.filter((org) =>
    org.nombreOrganizacion.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="content-wrapper">
      <div className="content-container">
        <h2>Lista de Organizaciones</h2>

        <input
          type="text"
          placeholder="Buscar organización..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="search-bar"
        />

        <form onSubmit={crearOrganizacion} className="form-nueva-organizacion">
          <input
            type="text"
            placeholder="Nombre de la nueva organización"
            value={nuevaOrganizacion}
            onChange={(e) => setNuevaOrganizacion(e.target.value)}
          />
          <button type="submit" className="bg-green-500">
            Crear Organización
          </button>
        </form>

        {/* Formulario para editar organización */}
        {organizacionEditar && (
          <form
            onSubmit={(e) =>
              editarOrganizacion(
                e,
                organizacionEditar.idOrganizacion,
                organizacionEditar.nombreOrganizacion
              )
            }
            className="form-editar-organizacion"
          >
            <input
              type="text"
              placeholder="Nuevo nombre de la organización"
              value={organizacionEditar.nombreOrganizacion}
              onChange={(e) =>
                setOrganizacionEditar({
                  ...organizacionEditar,
                  nombreOrganizacion: e.target.value,
                })
              }
            />
            <button type="submit" className="editar-btn">
              Editar Organización
            </button>
          </form>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {organizacionesFiltradas.map((org) => (
                <tr key={org.idOrganizacion}>
                  <td>{org.idOrganizacion}</td>
                  <td>{org.nombreOrganizacion}</td>
                  <td>
                    <button
                      className="bg-yellow-500"
                      onClick={() => seleccionarOrganizacion(org)}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-red-500"
                      onClick={() => eliminarOrganizacion(org.idOrganizacion)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashOrga;
