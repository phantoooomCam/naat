import PropTypes from 'prop-types';
import './DashHome.css';
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { FaUsers, FaClipboardList, FaChartLine, FaSignInAlt, FaBuilding, FaTasks, FaLayerGroup } from 'react-icons/fa';

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
    <div className={`dash-home ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="container">
        {views[activeView]}
      </div>
    </div>
  );
};

const HomeView = ({ isSidebarCollapsed }) => {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre || "Usuario";
  const navigate = useNavigate();

  // Datos de las tarjetas con iconos
  const dashboardCards = [
    { id: 1, title: "Gestión Usuarios", route: "/gestion", icon: <FaUsers /> },
    { id: 2, title: "Solicitudes", route: "/solicitudes", icon: <FaClipboardList /> },
    { id: 3, title: "Actividad del Sistema", route: "/actividad", icon: <FaChartLine /> },
    { id: 4, title: "Ingresos del Sistema", route: "/ingresos", icon: <FaSignInAlt /> },  // Cambio aquí
    { id: 5, title: "Gestión Organización", route: "/orga", icon: <FaBuilding /> },
    { id: 6, title: "Gestión Departamento", route: "/depto", icon: <FaTasks /> },
    { id: 7, title: "Gestión Área", route: "/area", icon: <FaLayerGroup /> },
  ];

  return (
    <div className="home-view">
      <h1>Bienvenido {nombre}, al Panel de Control</h1>
      
      <div className="dashboard-grid">
        {dashboardCards.map(card => (
          <div 
            key={card.id} 
            className="card"
            onClick={() => navigate(card.route)}
          >
            <span className="icon">{card.icon}</span>
            <h2>{card.title}</h2>
            <p>Administrar {card.title.toLowerCase()}.</p>
          </div>
        ))}
      </div>
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
