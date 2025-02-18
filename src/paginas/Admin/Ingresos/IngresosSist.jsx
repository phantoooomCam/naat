import { useState } from "react";
import "./IngresosSist.css";

const datosPrueba = [
  { idingreso: 1, idusuario: 101, nombre: "Juan", apellidopaterno: "Pérez", apellidomaterno: "López", hora: "10:30", tipo: "Entrada" },
  { idingreso: 2, idusuario: 102, nombre: "Ana", apellidopaterno: "Gómez", apellidomaterno: "Martínez", hora: "11:00", tipo: "Salida" },
  { idingreso: 3, idusuario: 103, nombre: "Carlos", apellidopaterno: "Rodríguez", apellidomaterno: "Fernández", hora: "12:15", tipo: "Entrada" },
  { idingreso: 4, idusuario: 104, nombre: "Laura", apellidopaterno: "Fernández", apellidomaterno: "García", hora: "13:20", tipo: "Entrada" },
  { idingreso: 5, idusuario: 105, nombre: "María", apellidopaterno: "López", apellidomaterno: "Ramírez", hora: "14:40", tipo: "Salida" },
  { idingreso: 6, idusuario: 106, nombre: "Pedro", apellidopaterno: "Méndez", apellidomaterno: "Sánchez", hora: "15:10", tipo: "Entrada" },
  { idingreso: 7, idusuario: 107, nombre: "Sofía", apellidopaterno: "Martínez", apellidomaterno: "Vega", hora: "16:30", tipo: "Entrada" },
  { idingreso: 8, idusuario: 108, nombre: "Luis", apellidopaterno: "Ramírez", apellidomaterno: "Castro", hora: "17:45", tipo: "Salida" },
  { idingreso: 9, idusuario: 109, nombre: "Carolina", apellidopaterno: "Vega", apellidomaterno: "Méndez", hora: "18:50", tipo: "Entrada" },
  { idingreso: 10, idusuario: 110, nombre: "Fernando", apellidopaterno: "Castro", apellidomaterno: "López", hora: "19:05", tipo: "Salida" }
];

const IngresoSist = () => {
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 5;

  // Filtrar por nombre o apellido
  const datosFiltrados = datosPrueba.filter((item) =>
    `${item.nombre} ${item.apellidopaterno} ${item.apellidomaterno}`
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

      {/* Tabla */}
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
              <tr key={item.idingreso}>
                <td>{item.idingreso}</td>
                <td>{item.idusuario}</td>
                <td>{item.nombre}</td>
                <td>{item.apellidopaterno}</td>
                <td>{item.apellidomaterno}</td>
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
        <button
          onClick={() => setPaginaActual(paginaActual - 1)}
          disabled={paginaActual === 1}
        >
          ← Anterior
        </button>
        <span>Página {paginaActual} de {totalPaginas}</span>
        <button
          onClick={() => setPaginaActual(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
};

export default IngresoSist;
