import { FiHome, FiBarChart2, FiSettings, FiHelpCircle, FiUsers } from 'react-icons/fi';
import { BiLogIn } from "react-icons/bi";
import PropTypes from 'prop-types';
import { useNavigate,useLocation } from 'react-router-dom';  // Importar useNavigate
import './Sidebar.css';
import NAAT from '../../../assets/completo_blanco.png';
import React, { useEffect } from 'react'; // useEffect viene de React


const Sidebar = ({ activeView, setActiveView, isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Obtener la ubicación actual

  const menuItems = [
    { id: 'inicio', icon: <FiHome />, label: 'Inicio', path: '/dashboard' },
    { id: 'gestionar-usuarios', icon: <FiUsers />, label: 'Gestionar usuarios', path: '/gestion' },
    { id: 'Ingresos', icon: <BiLogIn />, label: 'Ingresos al sistema', path: '/ingresos' },
    { id: 'actividad-sistema', icon: <FiBarChart2 />, label: 'Actividad del sistema', path: '/actividad' },
  ];

  // Actualizar activeView inmediatamente al hacer clic
  const handleNavigation = (path, id) => {
    setActiveView(id); // Actualiza el estado de activeView antes de navegar
    navigate(path); // Navegar a la ruta
  };

  // useEffect para sincronizar activeView con la ruta actual
  React.useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find(item => item.path === currentPath);

    // Solo actualizar si es necesario
    if (activeItem && activeView !== activeItem.id) {
      setActiveView(activeItem.id);
    }
  }, [location.pathname, setActiveView, activeView, menuItems]);

  return (
    <nav className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div
          className="logo-wrapper"
          onClick={toggleSidebar}
          style={{ cursor: 'pointer' }}
        >
          <img 
            src={NAAT} 
            alt="NAAT Logo" 
            className="top-logo"
          />
          {isOpen && <h1 className="dashboard-title">Dashboard</h1>}
        </div>
      </div>

      <div className="menu-items">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path, item.id)} // Llamar a handleNavigation con id
          >
            <span className="icon">{item.icon}</span>
            {isOpen && <span className="label">{item.label}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
};

Sidebar.propTypes = {
  activeView: PropTypes.string.isRequired,
  setActiveView: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Sidebar;