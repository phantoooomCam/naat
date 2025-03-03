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
      const response = await fetch("http://192.168.100.89:44444/api/ingresos", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setIngresos(data); // ✅ Guardar los ingresos obtenidos en el estado
    } catch (error) {
      console.error("Error al obtener ingresos:", error);
      setError(error.message);
      setIngresos([]); // Limpiar la lista si hay error
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

  // Modificacion para la fecha
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString(); // ✅ Convierte a formato legible (ej. "24/02/2025, 12:30 PM")
  };

  // Paginación
  const indexUltimo = paginaActual * registrosPorPagina;
  const indexPrimero = indexUltimo - registrosPorPagina;
  const datosPaginados = datosFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);

  const traducirTipo = (tipo) => {
    if (tipo === "Iniciar Sesión") return "Inicio Sesión";
    if (tipo === "Cerrar Sesión") return "Cerró Sesión";
    return tipo; // ✅ Si no es ninguno de los anteriores, devolver el valor original
  };

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
            <th>Fecha y Hora</th>
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
                <td>{item.apellidoMaterno || "N/A"}</td> {/* ✅ Mostrar "N/A" si es null */}
                <td>{formatearFecha(item.hora)}</td> {/* ✅ Formatear la fecha */}
                <td>{traducirTipo(item.tipo)}</td> {/* ✅ Aplicar traducción */}
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
