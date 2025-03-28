import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import "../Gestion/Gestion.css";

const DashSolicitud = () => {
  // Estados para el colapso de sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Estados para la gestión de usuarios
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correo: "",
    telefono: "",
    contraseña: "",
    usuario: "",
    organizacion: "",
    nivel: 5,
    rol: "Lector",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [mensaje, setMensaje] = useState(null);
  const [mensajeTipo, setMensajeTipo] = useState("success"); // o "error"

  const usuario = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Observador para el sidebar
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

  // Fetch usuarios
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://192.168.100.89:44444/api/usuarios/?inicio=1&cantidad=10",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const text = await response.text();
      if (!text) throw new Error("No se recibieron datos del servidor");

      const data = JSON.parse(text);

      // DEBUGGING: Log all users and their levels

      if (Array.isArray(data)) {
        // Filtrar usuarios con nivel 0, pero usando comparación flexible
        const levelZeroUsers = data.filter((user) => {
          return user.nivel === null || user.nivel === "null";
        });

        setUsers(levelZeroUsers);
        setFilteredUsers(levelZeroUsers);
      } else {
        throw new Error("Formato de datos inesperado");
      }
    } catch (error) {
      console.error("Error completo:", error);
      setError(error.message);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrado de usuarios
  useEffect(() => {
    const lowercasedSearchText = searchText.toLowerCase();
    const filtered = users.filter((user) =>
      `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno} ${user.nombreUsuario}`
        .toLowerCase()
        .includes(lowercasedSearchText)
    );
    setFilteredUsers(filtered);
  }, [searchText, users]);

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_usuario) return;

    try {
      // Actualiza el usuario con el nuevo nivel
      const response = await fetch(
        `http://192.168.100.89:44444/api/usuarios/${formData.id_usuario}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error al actualizar: ${response.status} - ${errorText}`
        );
      }

      // ✅ Llama al endpoint de activación para notificar por correo
      const activarResponse = await fetch(
        "http://192.168.100.89:44444/api/usuarios/activar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ idUsuario: formData.id_usuario }),
        }
      );

      const activarResult = await activarResponse.json();

      if (!activarResponse.ok) {
        setMensaje(activarResult.mensaje || "Error al activar el usuario.");
        setMensajeTipo("error");
        return;
      }

      // Muestra mensaje opcional
      setMensaje(activarResult.mensaje || "Usuario activado correctamente.");
      setMensajeTipo("success");
      // "Usuario activado correctamente. Se ha enviado un correo de bienvenida."

      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      id_usuario: user.id,
      nombre: user.nombre,
      apellidoPaterno: user.apellidoPaterno,
      apellidoMaterno: user.apellidoMaterno,
      correo: user.correo,
      telefono: user.telefono,
      nivel: user.nivel,
      organizacion: user.organizacion,
      rol: user.rol,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;

    try {
      const response = await fetch(
        `http://192.168.100.89:44444/api/usuarios/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al eliminar: ${response.status} - ${errorText}`);
      }

      setUsers(users.filter((user) => user.id !== id));
      setFilteredUsers(filteredUsers.filter((user) => user.id !== id));
      window.location.reload();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.correo || !formData.contraseña) return;

    const userToCreate = {
      nombre: formData.nombre,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      correo: formData.correo,
      telefono: formData.telefono,
      contraseña: formData.contraseña,
      usuario: formData.usuario,
      organizacion: formData.organizacion,
      nivel: formData.nivel,
      rol: formData.rol,
    };

    try {
      const response = await fetch(
        "http://192.168.100.89:44444/api/usuarios/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(userToCreate),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al crear: ${response.status} - ${errorText}`);
      }

      setIsCreating(false);
      fetchUsers();
      setFormData({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        correo: "",
        telefono: "",
        contraseña: "",
        usuario: "",
        organizacion: "",
        nivel: 5,
        rol: "Lector",
      });
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <h2>Cargando usuarios...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="content-wrapper">
          <div className="content-container">
            <h2>Error al cargar usuarios</h2>
            <p style={{ color: "red" }}>{error}</p>
            <button onClick={fetchUsers} className="bg-blue-500">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="content-wrapper">
        <div className="content-container">
          <h2>Solicitud de Usuarios</h2>

          {isEditing || isCreating ? (
            <form
              onSubmit={isCreating ? handleCreate : handleSubmit}
              className="gestion-form"
            >
              <div className="form-grid">
                <div>
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label>Apellido Paterno</label>
                  <input
                    type="text"
                    name="apellidoPaterno"
                    value={formData.apellidoPaterno ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Apellido Paterno"
                  />
                </div>
                <div>
                  <label>Apellido Materno</label>
                  <input
                    type="text"
                    name="apellidoMaterno"
                    value={formData.apellidoMaterno ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Apellido Materno"
                  />
                </div>
                {/* <div>
                  <label>Correo</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Correo electronico"
                  />
                </div>
                <div>
                  <label>Contraseña</label>
                  <input
                    type="password"
                    name="contraseña"
                    value={formData.contraseña ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Contraseña"
                  />
                </div>
                <div>
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                    placeholder="Telefono"
                  />
                </div> */}
                <div>
                  <label>Nivel</label>
                  <select
                    name="nivel"
                    value={formData.nivel ?? 4}
                    onChange={handleChange}
                    className="inputedit"
                  >
                    <option value={null}>Pendiente</option>
                    <option value={1}>Super Administrador</option>
                    <option value={2}>Administrador de Organizacion</option>
                    <option value={3}>Jefe de area</option>
                    <option value={4}>Jefe de Departamento</option>
                    <option value={5}>Analista</option>
                  </select>
                </div>
                {/* <div>
                  <label>Organización</label>
                  <input
                    type="text"
                    name="organizacion"
                    placeholder="Ingresa Organización"
                    value={formData.organizacion ?? ""}
                    onChange={handleChange}
                    className="inputedit"
                  />
                </div>
                <div>
                  <label>Rol</label>
                  <select
                    name="rol"
                    value={formData.rol ?? "Lector"}
                    onChange={handleChange}
                    className="inputedit"
                  >
                    <option value="Lector">Lector</option>
                    <option value="Editor">Editor</option>
                  </select>
                </div> */}
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-edit">
                  {isCreating ? "Agregar" : "Actualizar"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
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
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar usuario..."
                    className="search-input"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
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
                      <th>Apellido Paterno</th>
                      <th>Apellido Materno</th>
                      {/* <th>Correo</th>
                      <th>Telefono</th> */}
                      <th>Nivel</th>
                      {/* <th>Organización</th>
                      <th>Rol</th> */}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.nombre}</td>
                        <td>{user.apellidoPaterno}</td>
                        <td>{user.apellidoMaterno}</td>
                        {/* <td>{user.correo}</td>
                        <td>{user.telefono}</td> */}
                        <td>
                          {(() => {
                            if (user.nivel === null) {
                              return "Nivel no asignado";
                            }
                            switch (user.nivel) {
                              case 1:
                                return "SuperAdmin";
                              case 2:
                                return "AdminOrganizacion";
                              case 3:
                                return "Jefe de Area";
                              case 4:
                                return "Jefe de Departamento";
                              case 5:
                                return "Analista";
                              default:
                                return "Sin nivel";
                            }
                          })()}
                        </td>
                        {/* <td>{user.nombreOrganizacion}</td>
                        <td>{user.rol}</td> */}
                        <td className="td-btn">
                          <button
                            onClick={() => handleEdit(user)}
                            className="bg-green-400"
                          >
                            <FontAwesomeIcon
                              icon={faPencilAlt}
                              className="w-6 h-6"
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-400"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="w-6 h-6"
                            />
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

export default DashSolicitud;
