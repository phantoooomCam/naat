import { FiHome, FiUsers, FiSettings, FiBarChart2, FiHelpCircle } from 'react-icons/fi';
import { BiLogIn } from "react-icons/bi";
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import './Sidebar.css';
import NAAT from '../../../assets/completo_blanco.png';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRender = useRef(true);
  
  // Inicialización de estado desde localStorage
  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('expandedMenus');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error cargando estado del menú:", e);
      return [];
    }
  });

  const menuItems = [
    { id: '/dashboard', icon: <FiHome />, label: 'Inicio' },
    {
      id: 'usuarios',
      icon: <FiUsers />,
      label: 'Usuarios',
      subItems: [
        { id: '/gestion', label: 'Gestionar Usuarios' },
        { id: '/usuarios/listar', label: 'Solicitudes' }
      ]
    },
    {
      id: 'sistema',
      icon: <FiSettings />,
      label: 'Sistema',
      subItems: [
        { id: '/sistema/configuracion', label: 'Actividad' },
        { id: '/ingresos', label: 'Ingresos' }
      ]
    },
    {
      id: 'organizaciones',
      icon: <FiHelpCircle />,
      label: 'Organizaciones',
      subItems: [
        { id: '/orga', label: 'Gestion Organización' },
        { id: '/depto', label: 'Gestion Departamento' },
        { id: '/area', label: 'Gestion Area' }   
      ]
    },
  ];

  // Guardar en localStorage cada vez que cambia expandedMenus
  useEffect(() => {
    // Evitar guardar en el primer renderizado para no sobrescribir el estado inicial
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    try {
      localStorage.setItem('expandedMenus', JSON.stringify(expandedMenus));
    } catch (e) {
      console.error("Error guardando estado del menú:", e);
    }
  }, [expandedMenus]);

  // Expandir menús iniciales solo una vez
  useEffect(() => {
    if (expandedMenus.length === 0) {
      const currentPath = location.pathname;
      const menusToExpand = [];
      
      menuItems.forEach(item => {
        if (item.subItems?.some(subItem => currentPath.startsWith(subItem.id))) {
          menusToExpand.push(item.id);
        }
      });
      
      if (menusToExpand.length > 0) {
        setExpandedMenus(menusToExpand);
      }
    }
  }, []);

  // Función para alternar menú manualmente
  const toggleSubMenu = (menuId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setExpandedMenus(prevMenus => {
      if (prevMenus.includes(menuId)) {
        return prevMenus.filter(id => id !== menuId);
      } else {
        return [...prevMenus, menuId];
      }
    });
  };

  // Función para navegación manual
  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    navigate(path);
  };

  // Verificar si un subítem está activo
  const isSubItemActive = (subItemId) => {
    return location.pathname === subItemId || location.pathname.startsWith(subItemId);
  };

  // Verificar si un menú principal está activo
  const isMenuActive = (item) => {
    if (item.id === '/dashboard') {
      return location.pathname === item.id;
    }
    return item.subItems?.some(subItem => isSubItemActive(subItem.id));
  };

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
          <div key={item.id} className="menu-container">
            {item.id === '/dashboard' ? (
              <div 
                className="menu-link"
                onClick={(e) => handleNavigation(item.id, e)}
              >
                <button className={`menu-item ${isMenuActive(item) ? 'active' : ''}`}>
                  <span className="icon">{item.icon}</span>
                  {isOpen && <span className="label">{item.label}</span>}
                </button>
              </div>
            ) : (
              <div className="menu-wrapper">
                <button
                  className={`menu-item ${isMenuActive(item) ? 'active' : ''}`}
                  onClick={(e) => toggleSubMenu(item.id, e)}
                >
                  <span className="icon">{item.icon}</span>
                  {isOpen && <span className="label">{item.label}</span>}
                </button>
              </div>
            )}

            {/* Submenús siempre renderizados pero con display condicional */}
            <div 
              className="sub-menu" 
              style={{ display: expandedMenus.includes(item.id) ? 'block' : 'none' }}
            >
              {item.subItems?.map((subItem) => (
                <div 
                  key={subItem.id} 
                  className="menu-link"
                  onClick={(e) => handleNavigation(subItem.id, e)}
                >
                  <button
                    className={`sub-menu-item ${isSubItemActive(subItem.id) ? 'active' : ''}`}
                  >
                    {isOpen && <span className="label">{subItem.label}</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
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