import { useState, useEffect } from "react";
import "./IngresosSist.css"; // Usamos el CSS unificado

const IngresoSist = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [ingresos, setIngresos] = useState([]);
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
    fetchIngresos();
  }, []);

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

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      setIngresos(data);
    } catch (error) {
      console.error("Error al obtener ingresos:", error);
      setError(error.message);
      setIngresos([]);
    } finally {
      setLoading(false);
    }
  };

  const datosFiltrados = ingresos.filter((item) =>
    `${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString();
  };

  const traducirTipo = (tipo) => {
    if (tipo === "Iniciar Sesión") return "Inicio Sesión";
    if (tipo === "Cerrar Sesión") return "Cerró Sesión";
    return tipo;
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
          <h2>Ingresos al Sistema</h2>

          <input
            type="text"
            placeholder="Buscar por nombre o apellido..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />

          {loading && <p>Cargando datos...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className="table-container">
            <table>
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
                      <td>{item.apellidoMaterno || "N/A"}</td>
                      <td>{formatearFecha(item.hora)}</td>
                      <td>{traducirTipo(item.tipo)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No se encontraron resultados</td>
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

export default IngresoSist;