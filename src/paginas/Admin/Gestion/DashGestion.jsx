import { useState } from "react";
import './Gestion.css';

const GestionDash = () => {
  const [users, setUsers] = useState([
    { id: 1, name: "Juan Pérez", email: "juan@email.com", role: "Admin" },
    { id: 2, name: "Ana López", email: "ana@email.com", role: "Usuario" },
    { id: 3, name: "Diego Flores", email: "bigocam123@gmail.com", role: "Admin" }
  ]);
  
  const [formData, setFormData] = useState({ id: null, name: "", email: "", role: "Usuario" });
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setUsers(users.map(user => (user.id === formData.id ? formData : user)));
    } else {
      setUsers([...users, { ...formData, id: users.length + 1 }]);
    }
    setFormData({ id: null, name: "", email: "", role: "Usuario" });
    setIsEditing(false);
  };

  const handleEdit = (user) => {
    setFormData(user);
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div className="content-wrapper">
      <div className="content-container">
        <h2 className="text-xl">Gestión de Usuarios</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre"
            required
            className="border p-2 rounded"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Correo"
            required
            className="border p-2 rounded"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="Usuario">Usuario</option>
            <option value="Admin">Admin</option>
          </select>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            {isEditing ? "Actualizar Usuario" : "Agregar Usuario"}
          </button>
        </form>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => handleEdit(user)} className="mr-2 bg-yellow-500 text-white p-2 rounded">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white p-2 rounded">
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
