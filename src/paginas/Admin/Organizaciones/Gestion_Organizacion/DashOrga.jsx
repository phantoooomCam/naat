import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import "../../Usuarios/Gestion/Gestion.css";

const DashOrga = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [organizaciones, setOrganizaciones] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [nuevaOrganizacion, setNuevaOrganizacion] = useState("");
  const [organizacionEditar, setOrganizacionEditar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const API_URL = "http://192.168.100.89:44444/api/organizaciones";
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

      setNuevaOrganizacion("");
      setIsCreating(false);
      obtenerOrganizaciones();
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

      obtenerOrganizaciones();
    } catch (error) {
      console.error("Error al eliminar organización:", error);
      alert("Error al eliminar la organización.");
    }
  };

  const editarOrganizacion = async (e) => {
    e.preventDefault();

    if (!organizacionEditar || organizacionEditar.nombreOrganizacion.trim() === "") {
      alert("El nombre de la organización no puede estar vacío.");
      return;
    }

    const organizacionActualizada = {
      idOrganizacion: organizacionEditar.idOrganizacion,
      nombreOrganizacion: organizacionEditar.nombreOrganizacion,
    };

    try {
      const response = await fetch(`${API_URL}/${organizacionEditar.idOrganizacion}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(organizacionActualizada),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setOrganizaciones((prevOrganizaciones) =>
        prevOrganizaciones.map((org) =>
          org.idOrganizacion === organizacionEditar.idOrganizacion
            ? { ...org, nombreOrganizacion: organizacionEditar.nombreOrganizacion }
            : org
        )
      );
      setOrganizacionEditar(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error al editar organización:", error);
      alert("Error al editar la organización.");
    }
  };

  const seleccionarOrganizacion = (org) => {
    setOrganizacionEditar(org);
    setIsEditing(true);
  };

  const handleOpenCreateForm = () => {
    setNuevaOrganizacion("");
    setIsCreating(true);
  };

  useEffect(() => {
    obtenerOrganizaciones();
  }, []);

  const organizacionesFiltradas = organizaciones.filter((org) =>
    org.nombreOrganizacion.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className={`content-wrapper ${isEditing || isCreating ? "editing-mode" : ""}`}>
        <div className="content-container">
          <div className="perfil-header">
            <h2>Lista de Organizaciones</h2>
            <p className="perfil-subtitle">
              Gestiona la información de las organizaciones
            </p>
          </div>

          {isEditing ? (
            <form onSubmit={editarOrganizacion} className="gestion-form editing-mode">
              <div className="form-grid">
                <div>
                  <label>Nombre de la Organización</label>
                  <input
                    type="text"
                    placeholder="Nombre de la organización"
                    value={organizacionEditar.nombreOrganizacion}
                    onChange={(e) =>
                      setOrganizacionEditar({
                        ...organizacionEditar,
                        nombreOrganizacion: e.target.value,
                      })
                    }
                    className="inputedit"
                  />
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-edit">
                  Actualizar
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setOrganizacionEditar(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : isCreating ? (
            <form onSubmit={crearOrganizacion} className="gestion-form editing-mode">
              <div className="form-grid">
                <div>
                  <label>Nombre de la Nueva Organización</label>
                  <input
                    type="text"
                    placeholder="Nombre de la nueva organización"
                    value={nuevaOrganizacion}
                    onChange={(e) => setNuevaOrganizacion(e.target.value)}
                    className="inputedit"
                  />
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-edit">
                  Crear
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsCreating(false)}
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
                    placeholder="Buscar organización..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="search-input"
                  />
                  <button
                    type="button"
                    onClick={handleOpenCreateForm}
                    className="bg-green-500 add-button"
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
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizacionesFiltradas.map((org) => (
                      <tr key={org.idOrganizacion}>
                        <td>{org.idOrganizacion}</td>
                        <td>{org.nombreOrganizacion}</td>
                        <td className="td-btn">
                          <button
                            onClick={() => seleccionarOrganizacion(org)}
                            className="bg-green-400"
                          >
                            <FontAwesomeIcon
                              icon={faPencilAlt}
                              className="w-6 h-6"
                            />
                          </button>
                          <button
                            onClick={() => eliminarOrganizacion(org.idOrganizacion)}
                            className="bg-red-400"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-6 h-6" />
                          </button>
                        </td>
                      </tr>
                    ))}
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

export default DashOrga;