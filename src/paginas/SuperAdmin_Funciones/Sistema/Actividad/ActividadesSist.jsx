import { useState, useEffect } from "react";
import "../Ingresos/IngresosSist.css";

const ActividadesSist = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [actividades, setActividades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const registrosPorPagina = 10;

  // Observador del sidebar
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

  useEffect(() => {
    fetchActividades();
  }, []);

  const fetchActividades = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://192.168.100.89:44444/api/actividades", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      console.log(data)
      setActividades(data);
    } catch (error) {
      console.error("Error al obtener actividades:", error);
      setError(error.message);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  const datosFiltrados = actividades.filter((item) =>
    `${item.nombre_usuario} ${item.entidad}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString();
  };

  // Paginación
  const indexUltimo = paginaActual * registrosPorPagina;
  const indexPrimero = indexUltimo - registrosPorPagina;
  const datosPaginados = datosFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);

  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="content-wrapper">
        <div className="content-container">
          <h2 className="h2-ingresos">Registro de Actividades</h2>

          <input
            type="text"
            placeholder="Buscar por usuario o entidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />

          {loading && <p>Cargando datos...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className="table-container">
            <table className="tabla-ingresos">
              <thead>
                <tr>
                  <th>ID Actividad</th>
                  <th>Autor</th>
                  <th>Entidad</th>
                  <th>Acción</th>
                  <th>ID Usuario</th>
                  <th>Nombre Usuario</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {datosPaginados.length > 0 ? (
                  datosPaginados.map((item) => (
                    <tr key={item.idActividad}>
                      <td>{item.idActividad}</td>
                      <td>{item.nombreAutor}</td>
                      <td>{item.entidad}</td>
                      <td>{item.accion}</td>
                      <td>{item.idUsuario}</td>
                      <td>{item.nombreUsuario || "N/A"}</td>
                      <td>{formatearFecha(item.fecha)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No se encontraron resultados</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="paginacion">
              <button
                onClick={() => setPaginaActual(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="btn-anterior"
              >
                ← Anterior
              </button>
              <span>
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaActual(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="btn-siguiente"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActividadesSist;