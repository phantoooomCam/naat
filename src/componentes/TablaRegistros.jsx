"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const TablaRegistros = ({
  registros,
  total,
  page,
  pageSize,
  setPage,
  setPageSize,
  sort,
  setSort,
  loading,
  error,
}) => {

  const [searchFilter, setSearchFilter] = useState("");

  const getTypeText = (typeId) => {
    const typeMap = {
      0: "Datos",
      1: "MensajeriaMultimedia",
      2: "Mensaje2ViasEnt",
      3: "Mensaje2ViasSal",
      4: "VozEntrante",
      5: "VozSaliente",
      6: "VozTransfer",
      7: "VozTransito",
      8: "Ninguno",
      9: "Wifi",
      10: "ReenvioSal",
      11: "ReenvioEnt",
    };
    return typeMap[typeId] || `Tipo ${typeId}`;
  };

  const getTypeBadgeClass = (typeId) => {
    const classMap = {
      0: "type-datos",
      1: "type-mensajeria",
      2: "type-mensaje2vias-ent",
      3: "type-mensaje2vias-sal",
      4: "type-voz-entrante",
      5: "type-voz-saliente",
      6: "type-voz-transfer",
      7: "type-voz-transito",
      8: "type-ninguno",
      9: "type-wifi",
      10: "type-reenvio-sal",
      11: "type-reenvio-ent",
    };
    return `type-badge ${classMap[typeId] || "type-ninguno"}`;
  };

  const filteredRegistros = registros.filter((registro) => {
    const s = searchFilter.toLowerCase();
    const typeText = getTypeText(registro.id_tipo_registro).toLowerCase();
    return (
      (registro.numero_a?.toString() || "").includes(s) ||
      (registro.numero_b?.toString() || "").includes(s) ||
      typeText.includes(s)
    );
  });

 
  const totalPages = Math.ceil((total || 0) / (pageSize || 10));


  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };
  const handlePageChange = (p) => setPage(p);

  const getVisiblePages = () => {
    const maxVisible = 3;
    const pages = [];
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 1);
      const end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1)
        start = Math.max(1, end - maxVisible + 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="error-message">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (registros.length === 0) {
    return (
      <div className="placeholder-text">
        <p>No hay registros disponibles</p>
      </div>
    );
  }

  return (
    <div className="registros-container">
      <div className="registros-header">
        <h4>Registros Telefónicos ({total} total)</h4>
        {registros.length > 0 && (
          <div className="imei-info">
            <strong>IMEI:</strong> {registros[0].imei}
          </div>
        )}
        <div className="pagination-info">
          Página {page} de {totalPages} - Mostrando {filteredRegistros.length}{" "}
          de {registros.length} registros en esta página
        </div>
      </div>

      <div className="search-filter">
        <input
          type="text"
          placeholder="Buscar por número o tipo..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        <table className="registros-table">
          <thead>
            <tr>
              <th>Número A</th>
              <th>Número B</th>
              <th>Tipo</th>
              <th>Fecha/Hora</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistros.map((registro) => (
              <tr key={registro.id_registro_telefonico}>
                <td>{registro.numero_a}</td>
                <td>{registro.numero_b}</td>
                <td>
                  <span
                    className={getTypeBadgeClass(registro.id_tipo_registro)}
                  >
                    {getTypeText(registro.id_tipo_registro)}
                  </span>
                </td>
                <td>{formatDate(registro.fecha_hora)}</td>
                <td>{formatDuration(registro.duracion || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className="pagination-btn"
          >
            Anterior
          </button>

          <div className="pagination-numbers">
            {getVisiblePages().map((n) => (
              <button
                key={n}
                onClick={() => handlePageChange(n)}
                className={`pagination-btn ${page === n ? "active" : ""}`}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

TablaRegistros.propTypes = {
  registros: PropTypes.array.isRequired,
  total: PropTypes.number,
  page: PropTypes.number,
  pageSize: PropTypes.number,
  setPage: PropTypes.func,
  setPageSize: PropTypes.func,
  sort: PropTypes.string,
  setSort: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
};

export default TablaRegistros;
