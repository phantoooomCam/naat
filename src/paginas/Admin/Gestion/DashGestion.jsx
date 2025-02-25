import { useState, useEffect } from "react";
import "./Gestion.css";

const GestionDash = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    id_usuario: null, // Cambié aquí el nombre
    nombre: "",
    nombreUsuario: "",
    nivel: 4,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [searchText, setSearchText] = useState("");

  const usuario = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://192.168.100.89:5096/api/usuarios/?inicio=1&cantidad=10",
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

      // Verificamos si el formato es el esperado (es un array de usuarios)
      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data); // Inicializamos los usuarios filtrados
      } else {
        throw new Error("Formato de datos inesperado");
      }
    } catch (error) {
      console.error("Error detallado:", error);
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
      console.error("ID no encontrado, no se puede actualizar.");
      return;
    }

    try {
      // Enviar la petición PUT
      const response = await fetch(
        `http://192.168.100.89:5096/api/usuarios/${formData.id_usuario}`,
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
      console.log("Usuario actualizado correctamente.");

      // Cierra el formulario
      setIsEditing(false);

      // Recarga la página
      window.location.reload();
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
    }
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
      console.error("El ID no es válido");
      return;
    }

    try {
      const response = await fetch(
        `http://192.168.100.89:5096/api/usuarios/${id}`,
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

        {/* Barra de búsqueda */}

        <form onSubmit={handleSubmit} className="gestion-form">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar usuario..."
            className="search-input"
          />
        </form>

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
                {/* <th>Contraseña</th>  */}
                <th>Nivel</th>
                <th>Organizacion</th>
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
                  {/* <td>{user.contraseña}</td> */}
                  <td>{user.nivel}</td>
                  <td>{user.organizacion}</td>
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
      </div>
      {isEditing && (
        <form onSubmit={handleSubmit} className="gestion-form">
          <div>
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre ?? ""} // Asegúrate de que formData siempre tenga valor
              onChange={handleChange}
            />
            <input
              type="text"
              name="apellidoPaterno"
              value={formData.apellidoPaterno ?? ""} // Usa el campo correcto en formData
              onChange={handleChange}
            />
            <input
              type="text"
              name="apellidoMaterno"
              value={formData.apellidoMaterno ?? ""} // Usa el campo correcto en formData
              onChange={handleChange}
            />
            <input
              type="email"
              name="correo"
              value={formData.correo ?? ""}
              onChange={handleChange}
            />
            <input
              type="tel"
              name="telefono"
              value={formData.telefono ?? ""}
              onChange={handleChange}
            />
            <select
              name="nivel"
              value={formData.nivel ?? 4} // Valor por defecto 4
              onChange={handleChange}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
            <input
              type="text"
              name="organizacion"
              placeholder="Ingresa Organizacion"
              value={formData.organizacion ?? ""}
              onChange={handleChange}
            />
            <select
              name="rol"
              value={formData.rol ?? "Lector"} // Valor por defecto "Lector"
              onChange={handleChange}
            >
              <option value="Lector">Lector</option>
              <option value="Editor">Editor</option>
            </select>
          </div>
          <button type="submit" className="btn-edit">Enviar</button>
        </form>
      )}
    </div>
  );
};

export default GestionDash;
