"use client";

import PropTypes from "prop-types";
import "./DashHome.css";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  FaUsers,
  FaBuilding,
  FaTasks,
  FaLayerGroup,
  FaUserClock,
  FaExclamationTriangle,
  FaFolderOpen,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import fetchWithAuth from "../../../utils/fetchWithAuth";

const DashHome = ({ activeView }) => {
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
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [rotatingStatIndex, setRotatingStatIndex] = useState(0);
  const [totalOrganizaciones, setTotalOrganizaciones] = useState(0);
  const [totalAreas, setTotalAreas] = useState(0);
  const [totalDepartamentos, setTotalDepartamentos] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [actividadPorDia, setActividadPorDia] = useState([]);
  const [userTypeData, setUserTypeData] = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [totalCasosActivos, setTotalCasosActivos] = useState(0);

  useEffect(() => {
    const fetchCasosActivos = async () => {
      try {
        const response = await fetchWithAuth("/api/casos?estado=activo");
        if (!response.ok) throw new Error("Error al obtener casos");
        const data = await response.json();
        setTotalCasosActivos(data.length);
      } catch (error) {
        setTotalCasosActivos(0);
        console.error("Error al obtener casos activos:", error);
      }
    };
    fetchCasosActivos();
  }, []);


  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const rotatingData = [
    {
      id: "organizaciones",
      icon: <FaBuilding />,
      value: totalOrganizaciones,
      label: "Organizaciones",
    },
    { id: "areas", icon: <FaLayerGroup />, value: totalAreas, label: "Áreas" },
    {
      id: "departamentos",
      icon: <FaTasks />,
      value: totalDepartamentos,
      label: "Departamentos",
    },
  ];

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetchWithAuth("/api/usuarios", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok)
          throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        setTotalUsuarios(data.length);

        const pendientesUsuarios = data.filter((user) => {
          const nivel = user.nivel;
          return (
            nivel === null ||
            nivel === undefined ||
            nivel === "null" ||
            nivel === "0" ||
            nivel === 0
          );
        });
        setPendientes(pendientesUsuarios.length);

        const conteoPorNivel = {
          "Super Admin": 0,
          "Admin Org": 0,
          "Jefe de Área": 0,
          "Jefe de Departamento": 0,
          Analista: 0,
        };

        data.forEach((user) => {
          switch (user.nivel) {
            case 1:
              conteoPorNivel["Super Admin"]++;
              break;
            case 2:
              conteoPorNivel["Admin Org"]++;
              break;
            case 3:
              conteoPorNivel["Jefe de Área"]++;
              break;
            case 4:
              conteoPorNivel["Jefe de Departamento"]++;
              break;
            case 5:
              conteoPorNivel["Analista"]++;
              break;
            default:
              break;
          }
        });

        const datosGrafico = Object.entries(conteoPorNivel)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({ name, value }));

        setUserTypeData(datosGrafico);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };

    fetchUsuarios();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, areaRes, deptoRes] = await Promise.all([
          fetchWithAuth("/api/organizaciones", {
            headers: { "Content-Type": "application/json" },
          }),
          fetchWithAuth("/api/areas", {
            headers: { "Content-Type": "application/json" },
          }),
          fetchWithAuth("/api/departamentos", {
            headers: { "Content-Type": "application/json" },
          }),
        ]);

        setTotalOrganizaciones((await orgRes.json()).length);
        setTotalAreas((await areaRes.json()).length);
        setTotalDepartamentos((await deptoRes.json()).length);
      } catch (error) {
        console.error("Error al obtener datos rotativos:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const response = await fetchWithAuth("/api/actividades", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const data = await response.json();

        const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        const hoy = new Date();
        const diaSemana = hoy.getDay();

        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - diaSemana);
        inicioSemana.setHours(0, 0, 0, 0);

        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        finSemana.setHours(23, 59, 59, 999);

        const actividadesSemana = data.filter((actividad) => {
          const fecha = new Date(
            actividad.fecha || actividad.fechaHora || actividad.createdAt
          );
          return fecha >= inicioSemana && fecha <= finSemana;
        });

        const resumen = {};
        dias.forEach((dia) => {
          resumen[dia] = {
            name: dia,
            Crear: 0,
            Actualizar: 0,
            Eliminar: 0,
            "Cambiar Contraseña": 0,
            "Reporte Sospechoso": 0,
            Activar: 0,
            "Restablecer Contraseña": 0,
            "Solicitar Recuperación": 0,
          };
        });

        actividadesSemana.forEach((actividad) => {
          const accion = (actividad.accion || "").toLowerCase();
          const fecha = new Date(
            actividad.fecha || actividad.fechaHora || actividad.createdAt
          );
          const dia = dias[fecha.getDay()];

          if (!resumen[dia]) return;

          if (accion.includes("crear")) resumen[dia].Crear += 1;
          else if (accion.includes("actualizar")) resumen[dia].Actualizar += 1;
          else if (accion.includes("eliminar")) resumen[dia].Eliminar += 1;
          else if (accion.includes("cambiar contraseña"))
            resumen[dia]["Cambiar Contraseña"] += 1;
          else if (accion.includes("sospechoso"))
            resumen[dia]["Reporte Sospechoso"] += 1;
          else if (accion.includes("activar")) resumen[dia].Activar += 1;
          else if (accion.includes("restablecer"))
            resumen[dia]["Restablecer Contraseña"] += 1;
          else if (
            accion.includes("recuperación") ||
            accion.includes("recuperar")
          )
            resumen[dia]["Solicitar Recuperación"] += 1;
        });

        const datosGrafica = dias.map((dia) => resumen[dia]);
        setActividadPorDia(datosGrafica);

        const recientes = [...data]
          .filter((a) => !!a.fecha)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 5);

        setActividadReciente(recientes);
      } catch (error) {
        console.error("Error al obtener actividades:", error);
        setActividadPorDia([]);
        setActividadReciente([]);
      }
    };

    fetchActividades();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingStatIndex(
        (prevIndex) => (prevIndex + 1) % rotatingData.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const COLORS = ["#2c3e50", "#1976d2", "#3f7cac", "#90caf9", "#546e7a"];

  const getVisibleBars = () => {
    if (windowWidth <= 480) {
      return (
        <>
          <Bar dataKey="Crear" fill="#33608d" />
          <Bar dataKey="Actualizar" fill="#1f77b4" />
          <Bar dataKey="Eliminar" fill="#d62728" />
        </>
      );
    }

    if (windowWidth <= 768) {
      return (
        <>
          <Bar dataKey="Crear" fill="#33608d" />
          <Bar dataKey="Actualizar" fill="#1f77b4" />
          <Bar dataKey="Eliminar" fill="#d62728" />
          <Bar dataKey="Cambiar Contraseña" fill="#ff7f0e" />
          <Bar dataKey="Reporte Sospechoso" fill="#9467bd" />
        </>
      );
    }

    return (
      <>
        <Bar dataKey="Crear" fill="#33608d" />
        <Bar dataKey="Actualizar" fill="#1f77b4" />
        <Bar dataKey="Eliminar" fill="#d62728" />
        <Bar dataKey="Cambiar Contraseña" fill="#ff7f0e" />
        <Bar dataKey="Reporte Sospechoso" fill="#9467bd" />
        <Bar dataKey="Activar" fill="#2ca02c" />
        <Bar dataKey="Restablecer Contraseña" fill="#17becf" />
        <Bar dataKey="Solicitar Recuperación" fill="#bcbd22" />
      </>
    );
  };

  const getBarChartWidth = () => {
    if (windowWidth <= 480) {
      return 400;
    }
    if (windowWidth <= 768) {
      return 500;
    }
    return "100%";
  };

  const getPieRadius = () => {
    if (windowWidth <= 480) {
      return 80;
    }
    if (windowWidth <= 768) {
      return 90;
    }
    return 100;
  };

  const shouldShowPieLabels = windowWidth > 480;

  return (
    <div className="home-view">
      <h1>Bienvenido {nombre}, al Panel de Control</h1>

      {/* Estadísticas resumidas (del nuevo diseño) */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{totalUsuarios}</h3>
            <p>Usuarios Totales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            {rotatingData[rotatingStatIndex].icon}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={rotatingData[rotatingStatIndex].id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              className="stat-content"
            >
              <h3>{rotatingData[rotatingStatIndex].value}</h3>
              <p>{rotatingData[rotatingStatIndex].label}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaUserClock />
          </div>
          <div className="stat-content">
            <h3>{pendientes}</h3>
            <p>Solicitudes Pendientes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaFolderOpen />
          </div>
          <div className="stat-content">
            <h3>{totalCasosActivos}</h3>
            <p>Casos Activos</p>
          </div>
        </div>

      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Actividad Semanal</h3>
          <div
            className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}
          >
            <div className="chart-scroll-container">
              {windowWidth <= 768 ? (
                <BarChart
                  width={windowWidth <= 480 ? 500 : 600}
                  height={300}
                  data={actividadPorDia}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      bottom: 0,
                      fontSize: windowWidth <= 480 ? "9px" : "11px",
                    }}
                  />
                  {getVisibleBars()}
                </BarChart>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={actividadPorDia}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                    <Bar dataKey="Crear" fill="#33608d" />
                    <Bar dataKey="Actualizar" fill="#1f77b4" />
                    <Bar dataKey="Eliminar" fill="#d62728" />
                    <Bar dataKey="Cambiar Contraseña" fill="#ff7f0e" />
                    <Bar dataKey="Reporte Sospechoso" fill="#9467bd" />
                    <Bar dataKey="Activar" fill="#2ca02c" />
                    <Bar dataKey="Restablecer Contraseña" fill="#17becf" />
                    <Bar dataKey="Solicitar Recuperación" fill="#bcbd22" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Distribución de Usuarios</h3>
          <div
            className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}
          >
            <div className="chart-scroll-container">
              {windowWidth <= 768 ? (
                <PieChart width={300} height={300}>
                  <Pie
                    data={userTypeData}
                    cx={150}
                    cy={150}
                    outerRadius={getPieRadius()}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={shouldShowPieLabels}
                    label={
                      shouldShowPieLabels
                        ? ({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        : null
                    }
                  >
                    {userTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} usuario(s)`, name]}
                  />
                </PieChart>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={true}
                      stroke="#ffffff"
                      strokeWidth={2}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} usuario(s)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de actividad reciente (del nuevo diseño) */}
      <div className="recent-activity-card">
        <h3>Actividad Reciente</h3>
        <div className="table-responsive">
          <table className="activity-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Fecha y Hora</th>
              </tr>
            </thead>
            <tbody>
              {actividadReciente.map((activity) => (
                <tr key={activity.idActividad}>
                  <td>{activity.idActividad}</td>
                  <td>{activity.nombreAutor || "Desconocido"}</td>
                  <td>{activity.accion}</td>
                  <td>
                    {new Date(activity.fecha).toLocaleString("es-MX", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accesos rápidos (combina las tarjetas del código original con el título del nuevo) */}
    </div>
  );
};

DashHome.propTypes = {
  activeView: PropTypes.string.isRequired,
};

HomeView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
};

export default DashHome;
