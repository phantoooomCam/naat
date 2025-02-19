import { useState, useEffect } from "react";
import "./Gestion.css";

const GestionDash = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    nombreUsuario: "",
    nivel: 4,
  });
  const [isEditing, setIsEditing] = useState(false);

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
      // console.log('Response text:', text); // Para debugging

      if (!text) {
        throw new Error("No se recibieron datos del servidor");
      }

      const data = JSON.parse(text); // Intentamos parsearlo como JSON

      if (data.mensaje === "ok") {
        setUsers(data.response);
      } else {
        throw new Error(data.mensaje || "Error desconocido");
      }
    } catch (error) {
      console.error("Error detallado:", error);
      setError(error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

        <form onSubmit={handleSubmit} className="gestion-form">
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre"
            required
          />
          <input
            type="text"
            name="nombreUsuario"
            value={formData.nombreUsuario}
            onChange={handleChange}
            placeholder="Nombre de Usuario"
            required
          />
          <select name="nivel" value={formData.nivel} onChange={handleChange}>
            <option value={4}>Usuario</option>
            <option value={5}>Admin</option>
          </select>
          <button type="submit" className="bg-blue-500">
            {isEditing ? "Actualizar Usuario" : "Agregar Usuario"}
          </button>
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
              {users.map((user) => (
                <tr key={user.idUsuario}>
                  <td>{user.idUsuario}</td> {/* Mostrar idUsuario */}
                  <td>{user.nombreUsuario}</td> {/* Mostrar nombreUsuario */}
                  <td>{user.estatus}</td> {/* Mostrar estatus */}
                  
                  <td>{user.nombre}</td> {/* Mostrar nombre */}
                  <td>{user.apellidoPaterno}</td>{" "}
                  {/* Mostrar apellidoPaterno */}
                  <td>{user.apellidoMaterno}</td>{" "}
                  {/* Mostrar apellidoMaterno */}
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
