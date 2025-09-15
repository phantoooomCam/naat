"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faFile,
  faCalendarAlt,
  faBuilding,
  faTag,
  faShare,
  faPhone,
  faCar,
  faCamera,
  faMapMarkerAlt,
  faUsers,
  faDatabase,
  faShieldAlt,
  faGlobe,
  faEnvelope,
  faChevronRight,
  faStar,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import fetchWithAuth from "../../../../utils/fetchWithAuth";

// Vista principal de detalle
const DetalleView = ({ isSidebarCollapsed, casoId }) => {
  const navigate = useNavigate();
  const [casoData, setCasoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);

  // --- CARGA REAL DESDE EL BACKEND ---
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchWithAuth(`/api/casos/${casoId}`);
        if (!res || !res.ok) throw new Error("No se pudo cargar el caso");
        const raw = await res.json();

        // Extrae idSabana si viene en el caso (múltiples formas posibles)
        const collectIds = (arr) => {
          if (!Array.isArray(arr)) return [];
          return arr
            .map((s) => s?.idSabana ?? s?.id_sabana ?? s?.id ?? s?.Id ?? null)
            .filter(Boolean);
        };
        const sabanasCampo =
          raw.ids_sabanas ??
          raw.idsSabanas ??
          raw.sabanas ??
          raw.Sabanas ??
          null;
        const sabanaIds = Array.isArray(sabanasCampo)
          ? collectIds(sabanasCampo) // arreglo de objetos o ids
          : sabanasCampo
          ? [sabanasCampo]
          : []; // id suelto
        const sabanaIdPrimaria =
          sabanaIds.find(Boolean) ?? raw.idSabana ?? raw.IdSabana ?? null;

        const data = {
          id: raw.idCaso ?? raw.id ?? casoId,
          titulo: raw.nombre ?? raw.titulo ?? "Caso sin título",
          descripcion: raw.descripcion ?? "",
          estado: raw.estado ?? "Activo",
          fechaCreacion: raw.fechaCreacion ?? null,
          fechaActualizacion: raw.fechaActualizacion ?? null,
          asignado: raw.asignadoA ?? raw.investigadorPrincipal ?? "—",
          organizacion:
            raw.nombreOrganizacion ?? raw.organizacion ?? "No especificada",
          area: raw.nombreArea ?? raw.area ?? "No especificada",
          departamento:
            raw.nombreDepartamento ?? raw.departamento ?? "No especificado",
          prioridad: raw.prioridad ?? "—",
          numeroExpediente:
            raw.folio ?? raw.numeroExpediente ?? `CASO-${casoId}`,
          investigadorPrincipal: raw.investigadorPrincipal ?? "—",
          supervisorCaso: raw.supervisorCaso ?? undefined,
          sabanaId: sabanaIdPrimaria, // <-- nuevo
        };

        if (alive) setCasoData(data);
      } catch (err) {
        console.error(err);
        if (alive) setCasoData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [casoId]);

  // --- SECCIONES (sin mostrar estados en UI) ---
  const secciones = [
    {
      id: "redes-sociales",
      titulo: "Redes Sociales",
      descripcion:
        "Análisis completo de perfiles y actividad en plataformas sociales",
      icon: faShare,
      color: "#1DA1F2",
      disponible: true,
      progreso: 85,
    },
    {
      id: "sabanas-telefonicas",
      titulo: "Sábanas Telefónicas",
      descripcion: "Registros detallados de llamadas y comunicaciones móviles",
      icon: faPhone,
      color: "#25D366",
      disponible: true,
      progreso: 92,
    },
    {
      id: "registros-automovilisticos",
      titulo: "Registros Automovilísticos",
      descripcion: "Información vehicular, placas y registros de tránsito",
      icon: faCar,
      color: "#FF6B35",
      disponible: true,
      progreso: 78,
    },
    {
      id: "evidencia-fotografica",
      titulo: "Evidencia Fotográfica",
      descripcion: "Galería de imágenes y documentos visuales del caso",
      icon: faCamera,
      color: "#8E44AD",
      disponible: true,
      progreso: 95,
    },
    {
      id: "ubicaciones-gps",
      titulo: "Ubicaciones GPS",
      descripcion: "Rastreo geográfico y análisis de ubicaciones clave",
      icon: faMapMarkerAlt,
      color: "#E74C3C",
      disponible: false,
      progreso: 0,
    },
    {
      id: "contactos-asociados",
      titulo: "Contactos Asociados",
      descripcion: "Red de contactos, relaciones y conexiones identificadas",
      icon: faUsers,
      color: "#F39C12",
      disponible: true,
      progreso: 67,
    },
    {
      id: "registros-bancarios",
      titulo: "Registros Bancarios",
      descripcion: "Movimientos financieros y transacciones bancarias",
      icon: faDatabase,
      color: "#27AE60",
      disponible: false,
      progreso: 0,
    },
    {
      id: "antecedentes-penales",
      titulo: "Antecedentes Penales",
      descripcion: "Historial criminal, judicial y antecedentes legales",
      icon: faShieldAlt,
      color: "#C0392B",
      disponible: true,
      progreso: 88,
    },
    {
      id: "actividad-web",
      titulo: "Actividad Web",
      descripcion: "Navegación en internet y actividad digital registrada",
      icon: faGlobe,
      color: "#3498DB",
      disponible: false,
      progreso: 0,
    },
    {
      id: "comunicaciones-email",
      titulo: "Comunicaciones Email",
      descripcion: "Correos electrónicos y comunicaciones digitales",
      icon: faEnvelope,
      color: "#9B59B6",
      disponible: true,
      progreso: 73,
    },
  ];

  {/*--------rutas para usar en los detalles completos de gestion de casos-------------*/}
  const rutas = {
    "redes-sociales": "/redes_sociales",
    "sabanas-telefonicas": "/listado_sabanas",
    "registros-automovilisticos": "/autos",
    "evidencia-fotografica": "/fotos",
    "ubicaciones-gps": "/gps",
    "contactos-asociados": "/contactos",
    "registros-bancarios": "/bancos",
    "antecedentes-penales": "/penales",
    "actividad-web": "/web",
    "comunicaciones-email": "/emails",
  };

  // Click: si es Sábanas, navega a /procesamiento_sabana con idCaso e idSabana (si existe)
  const handleSectionClick = (seccion) => {
    if (seccion.id === "sabanas-telefonicas" && casoData?.id) {
      if (casoData?.sabanaId) {
        navigate("/procesamiento_sabana", {
          state: { idSabana: casoData.sabanaId, idCaso: casoData.id },
        });
      } else {
        navigate("/procesamiento_sabana", { state: { idCaso: casoData.id } });
      }
      return;
    }
    setSelectedSection(seccion);
  };

  // Estado del caso (no de tarjetas)
  const getEstadoClass = (estado) => {
    switch ((estado || "").toLowerCase()) {
      case "en proceso":
        return "estado-en-proceso";
      case "activo":
        return "estado-activo";
      case "resuelto":
        return "estado-resuelto";
      case "archivado":
        return "estado-archivado";
      default:
        return "";
    }
  };

  const getEstadoIcon = (estado) => {
    switch ((estado || "").toLowerCase()) {
      case "en proceso":
        return faExclamationTriangle;
      case "activo":
        return faStar;
      case "resuelto":
        return faFile;
      case "archivado":
        return faFile;
      default:
        return faFile;
    }
  };

  if (loading) {
    return (
      <div
        className={`detalle-container ${isSidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="loading-state">
          <FontAwesomeIcon icon={faFile} className="loading-icon" />
          <h3>Cargando detalles del caso...</h3>
          <p>Obteniendo información actualizada del sistema</p>
        </div>
      </div>
    );
  }

  if (!casoData) {
    return (
      <div
        className={`detalle-container ${isSidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="error-state">
          <FontAwesomeIcon icon={faFile} className="error-icon" />
          <h3>Error al cargar el caso</h3>
          <p>No se pudo obtener la información del caso solicitado</p>
          <button onClick={() => navigate(-1)} className="back-button-caso">
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver a casos
          </button>
        </div>
      </div>
    );
  }

  // KPIs para el resumen (puedes retirarlos si ya no usas "progreso")
  const seccionesDisponibles = secciones.filter((s) => s.disponible);
  const diasActivo = casoData?.fechaCreacion
    ? Math.floor(
        (Date.now() - new Date(casoData.fechaCreacion).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;
  const progresoPromedio = Math.round(
    seccionesDisponibles.reduce((acc, s) => acc + (s.progreso ?? 0), 0) /
      Math.max(1, seccionesDisponibles.length)
  );

  return (
    <div className="detalle-completo-view">
      {/* Header del caso */}
      <div className="detalle-header">
        <div className="header-navigation">
          <button onClick={() => navigate(-1)} className="back-button-caso">
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver a casos
          </button>
        </div>

        <div className="caso-title-section">
          <div className="caso-main-info">
            <h1 className="caso-titulo">{casoData.titulo}</h1>
            <div className="caso-metadata">
              <span
                className={`estado-badge ${getEstadoClass(casoData.estado)}`}
              >
                <FontAwesomeIcon
                  icon={getEstadoIcon(casoData.estado)}
                  style={{ marginRight: "0.5rem" }}
                />
                {casoData.estado}
              </span>
              <span className="caso-expediente">
                #{casoData.numeroExpediente}
              </span>
              {casoData.prioridad && casoData.prioridad !== "—" && (
                <span className="caso-prioridad prioridad-alta">
                  <FontAwesomeIcon
                    icon={faStar}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Prioridad {casoData.prioridad}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======= LAYOUT 1/3 — 2/3 ======= */}
      <div className="detalle-two-col">
        {/* IZQUIERDA: 1/3 (Información General + Resumen) */}
        <div className="col-izq">
          <div className="caso-info-grid">
            <div className="info-card">
              <div className="info-header">
                <FontAwesomeIcon icon={faFile} className="info-icon" />
                <h3>Información General del Caso</h3>
              </div>
              <div className="info-content">
                {casoData.descripcion && (
                  <p className="caso-descripcion">{casoData.descripcion}</p>
                )}

                <div className="info-details">
                  <div className="detail-item">
                    <FontAwesomeIcon
                      icon={faCalendarAlt}
                      className="detail-icon"
                    />
                    <div className="detail-content">
                      <span className="detail-label">Fecha de creación</span>
                      <span className="detail-value">
                        {casoData.fechaCreacion
                          ? new Date(casoData.fechaCreacion).toLocaleString(
                              "es-MX",
                              { dateStyle: "full", timeStyle: "short" }
                            )
                          : "No especificada"}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="detail-icon"
                    />
                    <div className="detail-content">
                      <span className="detail-label">Organización</span>
                      <span className="detail-value">
                        {casoData.organizacion}
                      </span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <FontAwesomeIcon icon={faTag} className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Área de trabajo</span>
                      <span className="detail-value">{casoData.area}</span>
                    </div>
                  </div>

                  {casoData.departamento &&
                    casoData.departamento !== "No especificado" && (
                      <div className="detail-item">
                        <FontAwesomeIcon
                          icon={faBuilding}
                          className="detail-icon"
                        />
                        <div className="detail-content">
                          <span className="detail-label">Departamento</span>
                          <span className="detail-value">
                            {casoData.departamento}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Resumen debajo */}
          <div className="info-card resumen-card">
            <div className="info-header">
              <FontAwesomeIcon icon={faFile} className="info-icon" />
              <h3>Resumen Estadístico del Caso</h3>
            </div>
            <div className="info-content">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-number">
                    {seccionesDisponibles.length}
                  </span>
                  <span className="stat-label">Secciones activas</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{diasActivo}</span>
                  <span className="stat-label">Días en investigación</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{progresoPromedio}%</span>
                  <span className="stat-label">Progreso general</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DERECHA: 2/3 (Secciones de Investigación) */}
        <div className="col-der">
          <div className="secciones-container">
            <div className="secciones-header">
              <h2>Secciones de Investigación</h2>
              <p>
                Explora las diferentes áreas de evidencia y análisis disponibles
                para este caso
              </p>
            </div>

            <div className="secciones-grid">
              {secciones.map((seccion) => (
                <div
                  key={seccion.id}
                  className={`seccion-card ${
                    selectedSection?.id === seccion.id ? "selected" : ""
                  }`}
                  onClick={() => navigate(rutas[seccion.id])}
                >
                  <div
                    className="seccion-icon-container"
                    style={{ backgroundColor: seccion.color }}
                  >
                    <FontAwesomeIcon
                      icon={seccion.icon}
                      className="seccion-icon"
                    />
                  </div>

                  <div className="seccion-content">
                    <h3 className="seccion-titulo">{seccion.titulo}</h3>
                    <p className="seccion-descripcion">{seccion.descripcion}</p>
                  </div>

                  {/* Flecha siempre visible */}
                  <div className="seccion-arrow">
                    <FontAwesomeIcon icon={faChevronRight} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* ======= FIN DEL LAYOUT ======= */}
    </div>
  );
};

// Componente principal: obtiene :id de la URL y lo pasa a la vista
const DetalleCompleto = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { id } = useParams();

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

  return (
    <div className={`dash-home ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">
        <DetalleView isSidebarCollapsed={isSidebarCollapsed} casoId={id} />
      </div>
    </div>
  );
};

export default DetalleCompleto;
