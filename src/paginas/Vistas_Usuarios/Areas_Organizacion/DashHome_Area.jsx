"use client";

import PropTypes from "prop-types";
import "../../SuperAdmin_Funciones/Inicio/DashHome.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaClipboardList } from "react-icons/fa";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import fetchWithAuth from "../../../utils/fetchWithAuth";

const DashHome_Area = ({ activeView }) => {
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
    inicio: <HomeView isSidebarCollapsed={isSidebarCollapsed} />,
  };

  return (
    <div className={`dash-home ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">{views[activeView]}</div>
    </div>
  );
};

const HomeView = ({ isSidebarCollapsed }) => {
  const [usuario, setUsuario] = useState(null);
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await fetchWithAuth("/api/me");
        if (!response || !response.ok)
          throw new Error("Error al obtener usuario");
        const data = await response.json();
        setUsuario({
          idUsuario: parseInt(data.idUsuario),
          idOrganizacion: parseInt(data.idOrganizacion),
          idArea: parseInt(data.idArea),
          idDepartamento: parseInt(data.idDepartamento),
          nivel: parseInt(data.nivel),
          nombre: data.nombre,
          apellidoPaterno: data.apellidoPaterno,
        });
      } catch (err) {
        console.error("Error al cargar usuario:", err);
      }
    };
    fetchUsuario();
  }, []);

  const nombre = usuario?.nombre || "Usuario";
  const navigate = useNavigate();
  const organizacion = usuario?.organizacion || "tu organización";
  const area = usuario?.area || "tu área";
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [organizaciones, setOrganizaciones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!usuario) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Usuarios filtrados por área
        const usuariosResponse = await fetchWithAuth("/api/usuarios");
        let usuariosArea = [];
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          usuariosArea = usuariosData.filter(
            (u) => u.idArea === usuario.idArea
          );
          setUsuarios(usuariosArea);
        }

        // Departamentos filtrados por área
        const deptosResponse = await fetchWithAuth("/api/departamentos");
        if (deptosResponse.ok) {
          const deptosData = await deptosResponse.json();
          const deptosArea = Array.isArray(deptosData)
            ? deptosData.filter((d) => d.idArea === usuario.idArea)
            : Array.isArray(deptosData.departamentos)
            ? deptosData.departamentos.filter(
                (d) => d.idArea === usuario.idArea
              )
            : [];
          setDepartamentos(deptosArea);
        }

        // Organizaciones completas (sin filtro)
        const orgResponse = await fetchWithAuth("/api/organizaciones");
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          setOrganizaciones(orgData);
        }

        // Áreas completas (sin filtro)
        const areasResponse = await fetchWithAuth("/api/areas");
        if (areasResponse.ok) {
          const areasData = await areasResponse.json();
          setAreas(areasData);
        }

        // Ingresos filtrados por usuarios del área
        if (usuariosArea.length > 0) {
          const ingresosResponse = await fetchWithAuth("/api/ingresos");
          if (ingresosResponse.ok) {
            const ingresosData = await ingresosResponse.json();
            const usuariosIds = usuariosArea.map((u) => u.id);
            const ingresosArea = ingresosData
              .filter((ingreso) => usuariosIds.includes(ingreso.idUsuario))
              .sort(
                (a, b) =>
                  new Date(b.hora || b.fechaHora) -
                  new Date(a.hora || a.fechaHora)
              )
              .slice(0, 10);
            setIngresos(ingresosArea);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [usuario]);

  const usuariosPorNivel = usuarios.reduce((acc, usuario) => {
    let nivelNombre = "";
    switch (usuario.nivel) {
      case 1:
        nivelNombre = "Super Admin";
        break;
      case 2:
        nivelNombre = "Admin Org";
        break;
      case 3:
        nivelNombre = "Jefe de Área";
        break;
      case 4:
        nivelNombre = "Jefe de Departamento";
        break;
      case 5:
        nivelNombre = "Analista";
        break;
      default:
        nivelNombre = "Sin Nivel";
        break;
    }
    acc[nivelNombre] = (acc[nivelNombre] || 0) + 1;
    return acc;
  }, {});

  const usuariosNivelData = Object.entries(usuariosPorNivel).map(
    ([nivel, cantidad], index) => ({
      name: nivel,
      value: cantidad,
      color: ["#33608d", "#2c7a7b", "#6b46c1", "#d69e2e", "#e53e3e"][index % 5],
    })
  );

  const departamentosData = departamentos.map((depto, index) => ({
    name: depto.nombreDepartamento || `Departamento ${depto.idDepartamento}`,
    value: 1,
    color: ["#33608d", "#2c7a7b", "#6b46c1", "#d69e2e", "#e53e3e", "#8b5cf6"][
      index % 6
    ],
  }));

  const dashboardCards = [
    {
      id: 1,
      title: "Casos",
      route: "/casos",
      icon: <FaClipboardList />,
      description: "Gestionar casos del área",
    },
  ];

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Sin fecha";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString();
  };

  const traducirTipo = (tipo) => {
    if (tipo === "Iniciar Sesión") return "Inicio Sesión";
    if (tipo === "Cerrar Sesión") return "Cerró Sesión";
    return tipo || "N/A";
  };

  if (loading) {
    return (
      <div className="home-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando dashboard del área...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-view">
        <div className="error-container">
          <h2>Error al cargar datos</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-view">
      <h1>
        Bienvenido {nombre} a {organizacion}
      </h1>

      {/* Gráficos */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Usuarios por Nivel</h3>
          <div
            className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}
          >
            <div className="chart-scroll-container">
              {usuariosNivelData.length > 0 ? (
                windowWidth <= 768 ? (
                  <PieChart width={windowWidth <= 480 ? 300 : 400} height={300}>
                    <Pie
                      data={usuariosNivelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usuariosNivelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={usuariosNivelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {usuariosNivelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="no-results">
                  <p>No hay usuarios para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Departamentos del Área</h3>
          <div
            className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}
          >
            <div className="chart-scroll-container">
              {departamentosData.length > 0 ? (
                windowWidth <= 768 ? (
                  <PieChart width={windowWidth <= 480 ? 300 : 400} height={300}>
                    <Pie
                      data={departamentosData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departamentosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departamentosData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departamentosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="no-results">
                  <p>No hay departamentos para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla resumen de ingresos - Formato completo como IngresosSist */}
      <div className="recent-activity-card">
        <h3>Resumen de Ingresos al Sistema</h3>
        <div className="table-responsive">
          <table className="activity-table">
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
              {ingresos.length > 0 ? (
                ingresos.map((ingreso) => (
                  <tr key={ingreso.idIngreso}>
                    <td>{ingreso.idIngreso}</td>
                    <td>{ingreso.idUsuario}</td>
                    <td>{ingreso.nombre || "N/A"}</td>
                    <td>{ingreso.apellidoPaterno || "N/A"}</td>
                    <td>{ingreso.apellidoMaterno || "N/A"}</td>
                    <td>{formatearFecha(ingreso.hora || ingreso.fechaHora)}</td>
                    <td>{traducirTipo(ingreso.tipo)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-results">
                    No hay ingresos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accesos rápidos */}
      <h2 className="section-title">Accesos Rápidos</h2>
      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <div
            key={card.id}
            className="card"
            onClick={() => navigate(card.route)}
          >
            <span className="icon">{card.icon}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

DashHome_Area.propTypes = {
  activeView: PropTypes.string.isRequired,
};

HomeView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
};

export default DashHome_Area;
