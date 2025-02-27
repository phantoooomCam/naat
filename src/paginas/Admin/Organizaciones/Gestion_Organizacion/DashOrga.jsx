import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";

const DashOrga = () => {
  const [organizaciones, setOrganizaciones] = useState([]);
  const API_URL = "http://192.168.100.89:5096/api/organizaciones"; // Ruta corregida
  const token = localStorage.getItem("token"); // Reemplázalo con el token válido

  const obtenerOrganizaciones = async () => {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Enviar el token
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

  useEffect(() => {
    obtenerOrganizaciones();
  }, []);

  return (
    <div className="content-wrapper">
      <div className="content-container">
        <h2>Lista de Organizaciones</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Accciones</th>
              </tr>
            </thead>
            <tbody>
              {organizaciones.map((org) => (
                <tr key={org.idOrganizacion}>
                  <td>{org.idOrganizacion}</td>
                  <td>{org.nombreOrganizacion}</td>
                  <td>
                        <button
                          className="bg-yellow-500"
                        >
                          Editar
                        </button>
                        <button
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

export default DashOrga;
