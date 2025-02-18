import { FiHome, FiBarChart2, FiSettings, FiHelpCircle, FiUsers } from 'react-icons/fi';
import { BiLogIn } from "react-icons/bi";
import PropTypes from 'prop-types';
import { Link, useLocation } from "react-router-dom";  // Importamos useLocation
import './Sidebar.css';
import NAAT from '../../../assets/completo_blanco.png';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation(); // Obtenemos la URL actual

  const menuItems = [
    { id: '/dashboard', icon: <FiHome />, label: 'Inicio' },
    { id: '/gestion', icon: <FiUsers />, label: 'Gestionar usuarios' },
    { id: '/ingresos', icon: <BiLogIn />, label: 'Ingresos al sistema' },
    { id: '/actividad', icon: <FiBarChart2 />, label: 'Actividad del sistema' }
  ];

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
          <Link to={item.id} key={item.id} className="menu-link">
            <button
              className={`menu-item ${location.pathname === item.id ? 'active' : ''}`} 
            >
              <span className="icon">{item.icon}</span>
              {isOpen && <span className="label">{item.label}</span>}
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Sidebar;
