import { useState, useEffect } from "react";
import "./Gestion.css";

const GestionDash = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
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
        "http://192.168.100.89:44444/api/Administracion/Usuarios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            inicio: 1,
            cantidad: 10,
          }),
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

      if (data.mensaje === "ok") {
        setUsers(data.response);
        setFilteredUsers(data.response); // Inicializamos los usuarios filtrados
      } else {
        throw new Error(data.mensaje || "Error desconocido");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí implementarías la lógica para enviar al backend
    setFormData({ id: null, nombre: "", nombreUsuario: "", nivel: 4 });
    setIsEditing(false);
  };

  const handleEdit = (user) => {
    setFormData({
      id: user.idUsuario,
      nombre: user.nombre,
      nombreUsuario: user.nombreUsuario,
      nivel: user.nivel,
    });
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    // Aquí implementarías la lógica para eliminar en el backend
    console.log("Eliminar usuario con ID:", id);
  };

  const getNivelText = (nivel) => {
    return nivel === 5 ? "Admin" : "Usuario";
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
                <th>Usuario</th>
                <th>Estatus</th>
                <th>Nombre</th>
                <th>Apellido Paterno</th>
                <th>Apellido Materno</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.idUsuario}>
                  <td>{user.idUsuario}</td>
                  <td>{user.nombreUsuario}</td>
                  <td>{user.estatus}</td>
                  <td>{user.nombre}</td>
                  <td>{user.apellidoPaterno}</td>
                  <td>{user.apellidoMaterno}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(user)}
                      className="bg-yellow-500"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.idUsuario)}
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
    </div>
  );
};

export default GestionDash;
