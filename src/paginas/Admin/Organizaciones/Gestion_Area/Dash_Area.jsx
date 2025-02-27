import { useState, useEffect } from "react";
import "../../Usuarios/Gestion/Gestion.css";

const DashArea = () => {
  const [areas, setAreas] = useState([]);
  const API_URL = "http://192.168.100.89:44444/api/areas"; // Ruta corregida
  const token = localStorage.getItem("token"); // Reemplázalo con el token válidas

  
  const obtenerAreas = async () => {
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
      setAreas(data);
    } catch (error) {
      console.error("Error al obtener areas:", error);
    }
  };

  useEffect(() => {
    obtenerAreas();
  }, []);


  return (
    <div className="content-wrapper">
      <div className="content-container">
        <h2>Lista de Areas</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>id_area</th>
                <th>Nombre</th>
                <th>id_organizacion</th>
                <th>Accciones</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.idArea}>
                  <td>{area.idArea}</td>
                  <td>{area.nombreArea}</td>
                  <td>{area.idOrganizacion}</td>
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

export default DashArea;