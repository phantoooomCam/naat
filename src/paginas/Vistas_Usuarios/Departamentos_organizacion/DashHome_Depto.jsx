"use client";

import PropTypes from "prop-types";
import "../../SuperAdmin_Funciones/Inicio/DashHome.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaUsers, FaSignInAlt } from "react-icons/fa";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import fetchWithAuth from "../../../utils/fetchWithAuth";

const DashHome_Depto = ({ activeView }) => {
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
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [usuarios, setUsuarios] = useState([]);
  const [casos, setCasos] = useState([]);
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
        const usuariosResponse = await fetchWithAuth("/api/usuarios");
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          const usuariosDepartamento = usuariosData.filter(
            (u) => u.idDepartamento === usuario.idDepartamento
          );
          setUsuarios(usuariosDepartamento);
        }

        const casosResponse = await fetchWithAuth("/api/casos");
        if (casosResponse.ok) {
          const casosData = await casosResponse.json();
          const casosDepartamento = casosData.filter(
            (c) => c.idDepartamento === usuario.idDepartamento
          );
          setCasos(casosDepartamento);
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

  const casosEstadoData = [
    {
      name: "Activos",
      value: casos.filter((c) => c.estado === "activo").length,
      color: "#2c7a7b",
    },
    {
      name: "Archivados",
      value: casos.filter((c) => c.estado === "archivado").length,
      color: "#64748b",
    },
    {
      name: "Reactivados",
      value: casos.filter((c) => c.estado === "reactivado").length,
      color: "#6b46c1",
    },
  ].filter((item) => item.value > 0);

  const usuariosPorNivel = usuarios.reduce((acc, usuario) => {
    const nivel = `Nivel ${usuario.nivel}`;
    acc[nivel] = (acc[nivel] || 0) + 1;
    return acc;
  }, {});

  const usuariosNivelData = Object.entries(usuariosPorNivel).map(
    ([nivel, cantidad], index) => ({
      name: nivel,
      value: cantidad,
      color: ["#33608d", "#2c7a7b", "#6b46c1", "#d69e2e", "#e53e3e"][index % 5],
    })
  );

  const dashboardCards = [
    {
      id: 1,
      title: "Gestión Usuarios",
      route: "/gestion",
      icon: <FaUsers />,
      description: "Administrar usuarios del departamento",
    },
    {
      id: 2,
      title: "Ingresos del Sistema",
      route: "/ingresos",
      icon: <FaSignInAlt />,
      description: "Ver historial de accesos al sistema",
    },
  ];

  if (loading) {
    return (
      <div className="home-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando dashboard del departamento...</p>
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
          <h3>Casos del Departamento</h3>
          <div
            className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}
          >
            <div className="chart-scroll-container">
              {casosEstadoData.length > 0 ? (
                windowWidth <= 768 ? (
                  <PieChart width={windowWidth <= 480 ? 300 : 400} height={300}>
                    <Pie
                      data={casosEstadoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {casosEstadoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={casosEstadoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {casosEstadoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="no-results">
                  <p>No hay casos para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Usuarios del Departamento</h3>
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

DashHome_Depto.propTypes = {
  activeView: PropTypes.string.isRequired,
};

HomeView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
};

export default DashHome_Depto;
