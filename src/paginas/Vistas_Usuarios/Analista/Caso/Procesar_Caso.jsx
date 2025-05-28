"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Caso.css";
import fetchWithAuth from "../../../../utils/fetchWithAuth";
import {
  faPlus,
  faFile,
  faCheck,
  faSpinner,
  faExclamationTriangle,
  faBoxArchive,
  faFilter,
  faSearch,
  faClipboardList,
  faFolderOpen,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

const Procesar_Caso = ({ activeView }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const views = {
    procesamiento: (
      <ProcesamientoView isSidebarCollapsed={isSidebarCollapsed} />
    ),
  };

  return (
    <div className={`dash-home ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">
        {views[activeView] || views.procesamiento}
      </div>
    </div>
  );
};

const ProcesamientoView = ({ isSidebarCollapsed }) => {
  const [casos, setCasos] = useState([]);
  const [selectedCaso, setSelectedCaso] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null); // 'success', 'error', null
  const [statusMessage, setStatusMessage] = useState("");

  const [userLevel, setUserLevel] = useState(5); // Por defecto nivel 5
  const [organizaciones, setOrganizaciones] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [filteredDepartamentos, setFilteredDepartamentos] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [userOrgId, setUserOrgId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado para filtros
  const [filters, setFilters] = useState({
    activo: false,
    archivado: false,
    reactivado: false,
  });

  useEffect(() => {
    const orgId = userLevel === 2 ? userOrgId : selectedOrg;
    const filtradas = areas.filter(
      (a) => String(a.idOrganizacion) === String(orgId)
    );
    setFilteredAreas(filtradas);
  }, [selectedOrg, userOrgId, userLevel, areas]);

  useEffect(() => {
    if (selectedArea) {
      const departamentosFiltrados = departamentos.filter(
        (d) => d.idArea === Number(selectedArea)
      );
      setFilteredDepartamentos(departamentosFiltrados);
    } else {
      setFilteredDepartamentos([]);
    }
  }, [selectedArea, departamentos]);

  useEffect(() => {
    if (selectedArea) {
      fetchDepartamentosByArea(selectedArea);
    }
  }, [selectedArea]);

  // Cargar casos de ejemplo
  useEffect(() => {
    const fetchCasos = async () => {
      try {
        const response = await fetchWithAuth("/api/casos");
        if (!response.ok) throw new Error("Error al obtener los casos");

        const data = await response.json();

        const casosTransformados = data.map((caso) => ({
          id: caso.idCaso,
          titulo: caso.nombre,
          descripcion: caso.descripcion,
          estado: caso.estado || "Sin estado",
          fechaCreacion: caso.fechaCreacion || "Sin fecha",
          asignado: caso.descripcion, // ← esto mostrará la descripción como "asignado"
        }));

        setCasos(casosTransformados);
      } catch (error) {
        console.error("Error al cargar casos desde el backend:", error);
        setStatusMessage("No se pudieron cargar los casos");
        setProcessingStatus("error");
      }
    };

    fetchCasos();
  }, []);

  // Funciones para cargar datos de selects
  const fetchOrganizaciones = async () => {
    try {
      const response = await fetchWithAuth("/api/organizaciones");

      if (!response || !response.ok) {
        console.warn("❌ Fallo al obtener organizaciones");
        return;
      }

      const data = await response.json();
      setOrganizaciones(data);
    } catch (error) {
      console.error("Error al cargar organizaciones:", error);
    }
  };

  // Ejecutar solo si el usuario es nivel 1
  useEffect(() => {
    if (userLevel === 1) {
      fetchOrganizaciones();
    }
  }, [userLevel]);

  // Obtener nivel del usuario
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData && userData.nivel) {
        const nivel = Number.parseInt(userData.nivel);
        setUserLevel(nivel);

        if (nivel === 1) {
          fetchOrganizaciones(); //
        }
      }

      if (userData?.idOrganizacion) {
        setUserOrgId(userData.idOrganizacion);
      }
    } catch (error) {
      console.error("Error al obtener nivel del usuario:", error);
    }
  }, []);

  useEffect(() => {
    const cargarAreasYFiltrar = async () => {
      if (userLevel === 2 && userOrgId) {
        const res = await fetchWithAuth(`/api/areas?orgId=${userOrgId}`);
        if (res.ok) {
          const data = await res.json();
          setAreas(data);

          // Filtro inmediato tras carga
          const filtradas = Array.isArray(data)
            ? data.filter((a) => String(a.idOrganizacion) === String(userOrgId))
            : [];
          setFilteredAreas(filtradas);

          setSelectedOrg(String(userOrgId)); // opcional, si necesitas mantenerlo para validaciones
        }
      }
    };

    cargarAreasYFiltrar();
  }, [userLevel, userOrgId]);

  const fetchDepartamentos = async (orgId) => {
    try {
      const url = orgId
        ? `/api/departamentos?orgId=${orgId}`
        : "/api/departamentos";
      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setDepartamentos(data);
        setSelectedDept("");
        setSelectedArea("");
      }
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
    }
  };

  const fetchAreas = async (deptId) => {
    try {
      const response = await fetchWithAuth(`/api/areas?deptId=${deptId}`);
      if (response.ok) {
        const data = await response.json();
        setAreas(data);
        setSelectedArea("");
      }
    } catch (error) {
      console.error("Error al cargar áreas:", error);
    }
  };

  // Manejadores de cambio para selects
  const handleOrgChange = (e) => {
    const orgId = e.target.value;
    if (orgId === selectedOrg) return; // 🛑 No hagas nada si no cambió

    setSelectedOrg(orgId);
    setSelectedArea("");
    setSelectedDept("");
    setFilteredAreas([]);
    setFilteredDepartamentos([]);
    fetchAreasByOrg(orgId);
  };

  const handleDeptChange = (e) => {
    const deptId = e.target.value;
    setSelectedDept(deptId);
  };

  const fetchAreasByOrg = async (orgId) => {
    try {
      const res = await fetchWithAuth(`/api/areas?orgId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setAreas(data);
      }
    } catch (error) {
      console.error("Error al cargar áreas:", error);
    }
  };

  const fetchDepartamentosByArea = async (areaId) => {
    try {
      const res = await fetchWithAuth(`/api/departamentos?areaId=${areaId}`);
      const data = await res.json();
      setDepartamentos(data);
    } catch (error) {
      console.error("❌ Error al cargar departamentos:", error);
    }
  };

  // Modificar la función handleCrearCaso para asegurar que los botones funcionen correctamente
  const handleCrearCaso = async () => {
    if (!titulo.trim()) {
      setProcessingStatus("error");
      setStatusMessage("El título del caso es obligatorio");
      setTimeout(() => setProcessingStatus(null), 3000);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus(null);

    try {
      const usuario = JSON.parse(localStorage.getItem("user"));
      const idUsuario = usuario?.id;

      const casoData = {
        nombre: titulo,
        descripcion,
        idUsuario: idUsuario || 1,
      };

      if (userLevel === 1) {
        casoData.idOrganizacion = Number(selectedOrg);
        casoData.idDepartamento = Number(selectedDept);
        casoData.idArea = Number(selectedArea);
      } else if (userLevel === 2) {
        casoData.idDepartamento = Number(selectedDept);
        casoData.idArea = Number(selectedArea);
      } else if (userLevel === 3) {
        casoData.idDepartamento = Number(selectedDept);
      }


      const response = await fetchWithAuth("/api/casos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(casoData),
      });

      if (!response.ok) throw new Error("Error en la creación del caso");

      const result = await response.json();

      const nuevoCaso = {
        id: Date.now(),
        titulo,
        descripcion,
        estado: "activo",
        fechaCreacion: new Date().toLocaleDateString(),
        asignado: "Usuario Actual",
      };

      setCasos((prevCasos) => [nuevoCaso, ...prevCasos]);
      setTitulo("");
      setDescripcion("");
      setSelectedOrg("");
      setSelectedDept("");
      setSelectedArea("");
      setProcessingStatus("success");
      setStatusMessage(result.mensaje || "Caso creado correctamente");
    } catch (error) {
      console.error("ERROR al crear caso:", error);
      setProcessingStatus("error");
      setStatusMessage("Error al crear el caso");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProcessingStatus(null), 3000);
    }
  };

  // Modificar la función actualizarEstadoCaso para asegurar que funcione correctamente
  const actualizarEstadoCaso = async (casoId, nuevoEstado) => {
    try {
      setIsProcessing(true);

      const usuario = JSON.parse(localStorage.getItem("user"));
      const idUsuario = usuario?.id;

      const response = await fetchWithAuth(
        `/api/casos/${casoId}/estado?idUsuario=${idUsuario}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nuevoEstado),
        }
      );

      if (!response.ok) throw new Error("Error al actualizar estado");

      // ✅ Actualiza estado localmente
      setCasos((prevCasos) =>
        prevCasos.map((caso) =>
          caso.id === casoId ? { ...caso, estado: nuevoEstado } : caso
        )
      );

      if (selectedCaso?.id === casoId) {
        setSelectedCaso((prev) => ({ ...prev, estado: nuevoEstado }));
      }

      setProcessingStatus("success");
      setStatusMessage(`Estado actualizado a "${nuevoEstado}"`);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      setProcessingStatus("error");
      setStatusMessage("No se pudo actualizar el estado");
      setIsProcessing(false);
    } finally {
      setTimeout(() => setProcessingStatus(null), 3000);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleCambiarEstado = (casoId, nuevoEstado) => {
    setCasos((prevCasos) => {
      return prevCasos.map((caso) => {
        if (caso.id === casoId) {
          return { ...caso, estado: nuevoEstado };
        }
        return caso;
      });
    });

    // Si el caso seleccionado es el que se está modificando, actualizar también el seleccionado
    if (selectedCaso && selectedCaso.id === casoId) {
      setSelectedCaso((prev) => ({ ...prev, estado: nuevoEstado }));
    }
  };

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const userData = JSON.parse(rawUser);
      const nivel = Number(userData.nivel);

      setUserLevel(nivel);
      setUserOrgId(userData.idOrganizacion);

      if (nivel === 2 && userData.idOrganizacion) {
        setSelectedOrg(String(userData.idOrganizacion));
      }

      if (nivel === 3 && userData.idArea) {
        setSelectedArea(String(userData.idArea));
      }
    }
  }, []);

  useEffect(() => {
    const fetchAreas = async () => {
      if (selectedOrg && userLevel <= 3) {
        // ← asegura que solo se ejecute para niveles válidos
        try {
          const res = await fetchWithAuth(`/api/areas?orgId=${selectedOrg}`);
          const data = await res.json();
          setAreas(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("❌ Error al cargar áreas:", error);
          setAreas([]);
        }
      }
    };

    fetchAreas();
  }, [selectedOrg, userLevel]);

  useEffect(() => {
    const filtradas = areas.filter(
      (a) => String(a.idOrganizacion) === selectedOrg
    );
    setFilteredAreas(filtradas);
  }, [areas, selectedOrg]);

  // Filtrar casos según los filtros seleccionados y término de búsqueda
  const filteredCasos = casos.filter((caso) => {
    // Primero filtrar por término de búsqueda
    if (
      searchTerm &&
      !caso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !caso.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Luego aplicar filtros de estado
    if (!filters.activo && !filters.archivado && !filters.reactivado) {
      return true;
    }
    if (filters.activo && caso.estado === "activo") return true;
    if (filters.archivado && caso.estado === "archivado") return true;
    if (filters.reactivado && caso.estado === "reactivado") return true;

    return false;
  });

  // Obtener clase para el estado
  const getEstadoClass = (estado) => {
    switch (estado) {
      case "Resuelto":
        return "estado-resuelto";
      case "Sin resolver":
        return "estado-sin-resolver";
      case "En proceso":
        return "estado-en-proceso";
      case "activo":
        return "estado-activo";
      case "archivado":
        return "estado-archivado";
      case "reactivado":
        return "estado-reactivado";
      default:
        return "";
    }
  };

  return (
    <div className={`caso-container ${isSidebarCollapsed ? "collapsed" : ""}`}>
      {/* Status message */}
      {processingStatus && (
        <div className={`status-message ${processingStatus}`}>
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="caso-header">
        <div className="header-content">
          <h2>Gestión de Casos</h2>
          <p>Crea y administra casos de investigación</p>
        </div>
        <div className="search-container">
          <div className="search-input-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar casos..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="left-column">
          <div className="crear-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faPlus} /> Crear Nuevo Caso
              </h3>
            </div>
            <div className="crear-content">
              <div className="form-group">
                <label htmlFor="titulo-caso">Título del Caso</label>
                <input
                  id="titulo-caso"
                  type="text"
                  className="caso-input"
                  placeholder="Ingrese el título del caso"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion-caso">Descripción</label>
                <textarea
                  id="descripcion-caso"
                  className="caso-textarea"
                  placeholder="Ingrese la descripción del caso"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              {/* Selects condicionales según nivel de usuario */}
              {userLevel === 1 && (
                <>
                  <div className="form-group">
                    <label htmlFor="organizacion">Organización</label>
                    <select
                      id="organizacion"
                      className="caso-select"
                      value={selectedOrg}
                      onChange={handleOrgChange}
                      disabled={isProcessing}
                    >
                      <option value="">Seleccione una organización</option>
                      {organizaciones.map((o) => (
                        <option key={o.idOrganizacion} value={o.idOrganizacion}>
                          {o.nombreOrganizacion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="area">Área</label>
                    <select
                      id="area"
                      className="caso-select"
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      disabled={isProcessing}
                    >
                      <option value="">Seleccione un área</option>
                      {filteredAreas.map((a) => (
                        <option key={a.idArea} value={a.idArea}>
                          {a.nombreArea}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="departamento">Departamento</label>
                    <select
                      id="departamento"
                      className="caso-select"
                      value={selectedDept}
                      onChange={handleDeptChange}
                      disabled={isProcessing}
                    >
                      <option value="">Seleccione un departamento</option>
                      {filteredDepartamentos.map((d) => (
                        <option key={d.idDepartamento} value={d.idDepartamento}>
                          {d.nombreDepartamento}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {userLevel === 2 && (
                <>
                  <div className="form-group">
                    <label htmlFor="area">Área</label>
                    <select
                      id="area"
                      className="caso-select"
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      disabled={isProcessing}
                    >
                      <option value="">Seleccione un área</option>
                      {filteredAreas.map((a) => (
                        <option key={a.idArea} value={a.idArea}>
                          {a.nombreArea}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="departamento">Departamento</label>
                    <select
                      id="departamento"
                      className="caso-select"
                      value={selectedDept}
                      onChange={handleDeptChange}
                      disabled={isProcessing}
                    >
                      <option value="">Seleccione un departamento</option>
                      {filteredDepartamentos.map((d) => (
                        <option key={d.idDepartamento} value={d.idDepartamento}>
                          {d.nombreDepartamento}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {userLevel === 3 && (
                <div className="form-group">
                  <label htmlFor="departamento">Departamento</label>
                  <select
                    id="departamento"
                    className="caso-select"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    disabled={isProcessing}
                  >
                    <option value="">Seleccione un departamento</option>
                    {departamentos.map((dept) => (
                      <option
                        key={dept.idDepartamento}
                        value={dept.idDepartamento}
                      >
                        {dept.nombreDepartamento}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleCrearCaso}
                className="crear-button"
                disabled={isProcessing || !titulo.trim()}
              >
                {isProcessing ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Crear Caso</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="filtros-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faFilter} /> Filtrar Casos
              </h3>
            </div>
            <div className="filtros-content">
              <div className="filter-group">
                <div className="checkbox-filter">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.activo}
                      onChange={() =>
                        handleFilterChange("activo", !filters.activo)
                      }
                      disabled={isProcessing}
                    />
                    <span>Casos Activos</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.archivado}
                      onChange={() =>
                        handleFilterChange("archivado", !filters.archivado)
                      }
                      disabled={isProcessing}
                    />
                    <span>Casos Archivados</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.reactivado}
                      onChange={() =>
                        handleFilterChange("reactivado", !filters.reactivado)
                      }
                      disabled={isProcessing}
                    />
                    <span>Casos Reactivados</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="casos-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faClipboardList} /> Casos
              </h3>
              <span className="caso-count">{filteredCasos.length} casos</span>
            </div>

            {casos.length > 0 ? (
              <div className="casos-list">
                {filteredCasos.map((caso) => (
                  <div
                    key={caso.id}
                    className={`caso-item ${
                      selectedCaso && selectedCaso.id === caso.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => setSelectedCaso(caso)}
                  >
                    <div className="caso-info">
                      <FontAwesomeIcon icon={faFile} className="caso-icon" />
                      <div className="caso-details">
                        <span className="caso-name">{caso.titulo}</span>
                        <span className="caso-meta">
                          <span
                            className={`estado-badge ${getEstadoClass(
                              caso.estado
                            )}`}
                          >
                            {caso.estado}
                          </span>
                          <span className="caso-fecha-asignado">
                            {caso.fechaCreacion
                              ? new Date(caso.fechaCreacion).toLocaleString(
                                  "es-MX",
                                  {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  }
                                )
                              : "Sin fecha"}{" "}
                            • {caso.asignado}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="caso-actions">
                      <button
                        className="archive-caso-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          actualizarEstadoCaso(caso.id, "archivado");
                        }}
                        disabled={isProcessing}
                        aria-label={`Archivar caso ${caso.titulo}`}
                      >
                        <FontAwesomeIcon icon={faBoxArchive} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-casos">
                <FontAwesomeIcon icon={faFolderOpen} className="empty-icon" />
                <p>No hay casos creados</p>
                <button
                  onClick={() => document.getElementById("titulo-caso").focus()}
                  className="crear-button-small"
                  disabled={isProcessing}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Crear caso</span>
                </button>
              </div>
            )}

            <div className="action-buttons">
              <button
                className="reactivate-button"
                onClick={() => {
                  if (selectedCaso)
                    actualizarEstadoCaso(selectedCaso.id, "reactivado");
                }}
                disabled={
                  isProcessing ||
                  !selectedCaso ||
                  selectedCaso.estado === "reactivado"
                }
              >
                <FontAwesomeIcon icon={faArrowRight} />
                <span>Marcar Reactivado</span>
              </button>

              <button
                className="activate-button"
                onClick={() => {
                  if (selectedCaso)
                    actualizarEstadoCaso(selectedCaso.id, "activo");
                }}
                disabled={
                  isProcessing ||
                  !selectedCaso ||
                  selectedCaso.estado === "activo"
                }
              >
                <FontAwesomeIcon icon={faCheck} />
                <span>Marcar Activo</span>
              </button>
            </div>
          </div>

          <div className="detalles-card">
            <div className="card-header">
              <h3>
                <FontAwesomeIcon icon={faFile} /> Detalles del Caso
              </h3>
            </div>
            <div className="detalles-content">
              {selectedCaso ? (
                <div className="selected-caso-preview">
                  <div className="caso-preview-header">
                    <FontAwesomeIcon
                      icon={faFile}
                      className="caso-preview-icon"
                    />
                    <h4>{selectedCaso.titulo}</h4>
                  </div>

                  <div className="caso-preview-body">
                    <p className="caso-descripcion">
                      {selectedCaso.descripcion}
                    </p>

                    <div className="caso-details-grid">
                      <div className="detail-row">
                        <span className="detail-label">Estado:</span>
                        <span className="detail-value">
                          <span
                            className={`estado-badge ${getEstadoClass(
                              selectedCaso.estado
                            )}`}
                          >
                            {selectedCaso.estado}
                          </span>
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Fecha de creación:</span>
                        <span className="detail-value">
                          {new Date(selectedCaso.fechaCreacion).toLocaleString(
                            "es-MX",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">
                          Descripción del Caso:
                        </span>
                        <span className="detail-value">
                          {selectedCaso.asignado}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <FontAwesomeIcon icon={faFile} className="no-caso-icon" />
                  <p>Selecciona un caso para ver sus detalles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Procesar_Caso.propTypes = {
  activeView: PropTypes.string.isRequired,
};

ProcesamientoView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
};

export default Procesar_Caso;
