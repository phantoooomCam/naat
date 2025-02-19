import { useState, useEffect } from "react";
import "./IngresosSist.css";

const IngresoSist = () => {
  const [ingresos, setIngresos] = useState([]); // Datos de ingresos obtenidos de la API
  const [busqueda, setBusqueda] = useState(""); // Estado para la búsqueda
  const [paginaActual, setPaginaActual] = useState(1); // Estado de la paginación
  const [loading, setLoading] = useState(false); // Estado de carga
  const [error, setError] = useState(null); // Estado de error
  const registrosPorPagina = 10; // Cantidad de registros por página

  useEffect(() => {
    fetchIngresos();
  }, []);

  // Función para obtener los ingresos desde la API
  const fetchIngresos = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "http://192.168.100.89:44444/api/Administracion/Ingresos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            inicio: 1,
            cantidad: 20, // Número de registros a obtener
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text(); // Obtener respuesta como texto

      if (!text) {
        throw new Error("No se recibieron datos del servidor");
      }

      const data = JSON.parse(text); // Convertir el texto a JSON

      if (data.mensaje === "ok") {
        setIngresos(data.response);
      } else {
        throw new Error(data.mensaje || "Error desconocido");
      }
    } catch (error) {
      console.error("Error detallado:", error);
      setError(error.message);
      setIngresos([]); // Si hay error, limpiar la lista
    } finally {
      setLoading(false);
    }
  };

  // Filtrar por nombre o apellido
  const datosFiltrados = ingresos.filter((item) =>
    `${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  // Paginación
  const indexUltimo = paginaActual * registrosPorPagina;
  const indexPrimero = indexUltimo - registrosPorPagina;
  const datosPaginados = datosFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);

  return (
    <div className="ingreso-sist">
      <h2>Ingresos al Sistema</h2>

      {/* Input de búsqueda */}
      <input
        type="text"
        placeholder="Buscar por nombre o apellido..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="filtro-input"
      />

      {/* Mensajes de carga y error */}
      {loading && <p>Cargando datos...</p>}
      {error && <p className="error">{error}</p>}

      {/* Tabla de ingresos */}
      <table className="tabla-ingresos">
        <thead>
          <tr>
            <th>ID Ingreso</th>
            <th>ID Usuario</th>
            <th>Nombre</th>
            <th>Apellido Paterno</th>
            <th>Apellido Materno</th>
            <th>Hora</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {datosPaginados.length > 0 ? (
            datosPaginados.map((item) => (
              <tr key={item.idIngreso}>
                <td>{item.idIngreso}</td>
                <td>{item.idUsuario}</td>
                <td>{item.nombre}</td>
                <td>{item.apellidoPaterno}</td>
                <td>{item.apellidoMaterno}</td>
                <td>{item.hora}</td>
                <td>{item.tipo}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No se encontraron resultados</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Controles de paginación */}
      <div className="paginacion">
        <button onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1}>
          ← Anterior
        </button>
        <span>Página {paginaActual} de {totalPaginas}</span>
        <button onClick={() => setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas}>
          Siguiente →
        </button>
      </div>
    </div>
  );
};

export default IngresoSist;
