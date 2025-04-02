import PropTypes from "prop-types";
import "./DashHome.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaUsers,
  FaClipboardList,
  FaChartLine,
  FaSignInAlt,
  FaBuilding,
  FaTasks,
  FaLayerGroup,
  FaUserPlus,
  FaUserClock,
  FaExclamationTriangle,
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

// Datos de ejemplo para los gráficos
const activityData = [
  { name: "Lun", usuarios: 40, solicitudes: 24, ingresos: 18 },
  { name: "Mar", usuarios: 30, solicitudes: 13, ingresos: 22 },
  { name: "Mié", usuarios: 20, solicitudes: 28, ingresos: 15 },
  { name: "Jue", usuarios: 27, solicitudes: 18, ingresos: 21 },
  { name: "Vie", usuarios: 18, solicitudes: 23, ingresos: 19 },
  { name: "Sáb", usuarios: 23, solicitudes: 12, ingresos: 8 },
  { name: "Dom", usuarios: 34, solicitudes: 5, ingresos: 3 },
];

const userTypeData = [
  { name: "Super Admin", value: 5 },
  { name: "Admin Org", value: 15 },
  { name: "Jefe Área", value: 25 },
  { name: "Jefe Depto", value: 35 },
  { name: "Analista", value: 85 },
];

const COLORS = ["#222a35", "#33608d", "#4a7ca9", "#6698c5", "#82b4e1"];

const recentActivityData = [
  { id: 1, usuario: "Ana García", accion: "Inicio de sesión", fecha: "2023-11-15 09:23" },
  { id: 2, usuario: "Carlos Pérez", accion: "Creación de usuario", fecha: "2023-11-15 08:45" },
  { id: 3, usuario: "María López", accion: "Actualización de perfil", fecha: "2023-11-14 16:30" },
  { id: 4, usuario: "Juan Rodríguez", accion: "Eliminación de registro", fecha: "2023-11-14 14:15" },
  { id: 5, usuario: "Laura Martínez", accion: "Inicio de sesión", fecha: "2023-11-14 10:05" },
];

const HomeView = ({ isSidebarCollapsed }) => {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre || "Usuario";
  const navigate = useNavigate();

  // Datos de las tarjetas con iconos (mantenidos del código original)
  const dashboardCards = [
    { id: 1, title: "Gestión Usuarios", route: "/gestion", icon: <FaUsers /> },
    { id: 2, title: "Solicitudes", route: "/solicitudes", icon: <FaClipboardList /> },
    { id: 3, title: "Actividad del Sistema", route: "/actividad", icon: <FaChartLine /> },
    { id: 4, title: "Ingresos del Sistema", route: "/ingresos", icon: <FaSignInAlt /> },
    { id: 5, title: "Gestión Organización", route: "/orga", icon: <FaBuilding /> },
    { id: 6, title: "Gestión Departamento", route: "/depto", icon: <FaTasks /> },
    { id: 7, title: "Gestión Área", route: "/area", icon: <FaLayerGroup /> },
  ];

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
            <h3>165</h3>
            <p>Usuarios Totales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaUserPlus />
          </div>
          <div className="stat-content">
            <h3>12</h3>
            <p>Nuevos Usuarios</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaUserClock />
          </div>
          <div className="stat-content">
            <h3>8</h3>
            <p>Solicitudes Pendientes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <h3>3</h3>
            <p>Alertas del Sistema</p>
          </div>
        </div>
      </div>

      {/* Gráficos y visualizaciones (del nuevo diseño) */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Actividad Semanal</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usuarios" name="Usuarios" fill="#33608d" />
                <Bar dataKey="solicitudes" name="Solicitudes" fill="#222a35" />
                <Bar dataKey="ingresos" name="Ingresos" fill="#6698c5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Distribución de Usuarios</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
              {recentActivityData.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.id}</td>
                  <td>{activity.usuario}</td>
                  <td>{activity.accion}</td>
                  <td>{activity.fecha}</td>
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