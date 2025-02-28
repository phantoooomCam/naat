import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";

const DashOrga = () => {
  const [organizaciones, setOrganizaciones] = useState([]);
  const [filtro, setFiltro] = useState(""); // Estado para la barra de búsqueda
  const [nuevaOrganizacion, setNuevaOrganizacion] = useState(""); // Estado para el formulario
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

  useEffect(() => {
    obtenerOrganizaciones();
  }, []);

  // Filtrar organizaciones por nombre
  const organizacionesFiltradas = organizaciones.filter((org) =>
    org.nombreOrganizacion.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="content-wrapper">
      <div className="content-container">
        <h2>Lista de Organizaciones</h2>

        {/* Barra de búsqueda */}
        <input
          type="text"
          placeholder="Buscar organización..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="search-bar"
        />

        {/* Formulario para crear nueva organización */}
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

        {/* Tabla de organizaciones */}
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
                    <button className="bg-yellow-500">Editar</button>
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
