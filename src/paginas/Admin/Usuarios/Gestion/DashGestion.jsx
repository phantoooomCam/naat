import { useState, useEffect } from "react";
import "./Gestion.css";

const GestionDash = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    nivel: 5,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isCreating, setIsCreating] = useState(false); // Estado para mostrar el formulario de crear usuario

  const usuario = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://naatintelligence.com:44445/api/usuarios/?inicio=1&cantidad=10",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text(); // Primero obtenemos el texto de la respuesta

      if (!text) {
        throw new Error("No se recibieron datos del servidor");
      }

      const data = JSON.parse(text); // Intentamos parsearlo como JSON
      console.log(data);

      // Verificamos si el formato es el esperado (es un array de usuarios)
      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data); // Inicializamos los usuarios filtrados
      } else {
        throw new Error("Formato de datos inesperado");
      }
    } catch (error) {
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

  useEffect(() => {
    // Filtrar usuarios cuando cambia el texto de búsqueda
    const lowercasedSearchText = searchText.toLowerCase();
    const filtered = users.filter((user) =>
      `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno} ${user.nombreUsuario}`
        .toLowerCase()
        .includes(lowercasedSearchText)
    );
    setFilteredUsers(filtered);
  }, [searchText, users]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica que el id_usuario esté presente
    if (!formData.id_usuario) {
      return;
    }

    try {
      // Enviar la petición PUT
      const response = await fetch(
        `https://naatintelligence.com:44445/api/usuarios/${formData.id_usuario}`,
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
          `Error al actualizar usuario: ${response.status} - ${errorText}`
        );
      }

      // Si el update fue exitoso, puedes hacer algo con la respuesta

      // Cierra el formulario
      setIsEditing(false);

      // Recarga la página
      window.location.reload();
    } catch (error) {}
  };

  const handleEdit = (user) => {
    setFormData({
      id_usuario: user.id, // Usamos id_usuario para el campo de id
      nombre: user.nombre,
      apellidoPaterno: user.apellidoPaterno, // Cambié el nombre de la propiedad para coincidir
      apellidoMaterno: user.apellidoMaterno, // Cambié el nombre de la propiedad para coincidir
      correo: user.correo,
      telefono: user.telefono,
      nivel: user.nivel,
      organizacion: user.organizacion,
      rol: user.rol,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!id) {
      return;
    }

    try {
      const response = await fetch(
        `https://naatintelligence.com:44445/api/usuarios/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error al eliminar usuario: ${response.status} - ${errorText}`
        );
      }

      // Actualizar el estado para eliminar el usuario de la lista
      setUsers(users.filter((user) => user.id !== id));
      setFilteredUsers(filteredUsers.filter((user) => user.id !== id));

      window.location.reload();
    } catch (error) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Verificamos que los datos obligatorios estén presentes
    if (!formData.nombre || !formData.correo || !formData.contraseña) {
      return;
    }

    // Creamos un objeto con los campos que queremos enviar (sin id)
    const userToCreate = {
      nombre: formData.nombre,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      correo: formData.correo,
      telefono: formData.telefono,
      contraseña: formData.contraseña, // Asegúrate de que el nombre coincida con el backend
      usuario: formData.usuario, // Si el campo "usuario" es necesario, inclúyelo aquí
      organizacion: formData.organizacion,
      nivel: formData.nivel,
      rol: formData.rol,
    };

    // Enviamos la solicitud POST para crear el usuario
    try {
      const response = await fetch(
        "https://naatintelligence.com:44445/api/usuarios/register",
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
        throw new Error(
          `Error al crear usuario: ${response.status} - ${errorText}`
        );
      }

      setIsCreating(false);
      // Recargar los usuarios después de la creación
      fetchUsers();
      setFormData({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        correo: "",
        telefono: "",
        contrasena: "",
        usuario: "",
        organizacion: "",
        nivel: "",
        rol: "",
      });
    } catch (error) {}
  };

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="content-container">
          <h2>Cargando usuarios...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-wrapper">
        <div className="content-container">
          <h2>Error al cargar usuarios</h2>
          <p style={{ color: "red" }}>{error}</p>
          <button onClick={fetchUsers} className="bg-blue-500">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="content-container">
        <h2>Gestión de Usuarios</h2>

        {/* Si está en modo edición o creación, ocultar la tabla y mostrar solo el formulario */}
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
              <div>
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
              </div>
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
              <div>
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
              </div>
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
            {/* Barra de búsqueda y botón de agregar */}
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

            {/* Tabla de usuarios */}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Apellido Paterno</th>
                    <th>Apellido Materno</th>
                    <th>Correo</th>
                    <th>Telefono</th>
                    <th>Nivel</th>
                    <th>Organización</th>
                    <th>Rol</th>
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
                      <td>{user.correo}</td>
                      <td>{user.telefono}</td>
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
                      <td>{user.nombreOrganizacion}</td>
                      <td>{user.rol}</td>
                      <td>
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-yellow-500"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-500"
                        >
                          Eliminar
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
  );
};

export default GestionDash;
