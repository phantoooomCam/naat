import { FiHome, FiUsers, FiSettings, FiHelpCircle } from 'react-icons/fi';
import { BiLogIn } from "react-icons/bi";
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import './Sidebar.css';
import NAAT from '../../../assets/completo_blanco.png';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRender = useRef(true);
  
  // Estado para controlar si el sidebar está abierto o cerrado
  // En móviles (<=390px), inicia cerrado; en pantallas grandes, inicia abierto
  const [isOpen, setIsOpen] = useState(window.innerWidth > 390);
  
  // Inicialización de estado desde localStorage para submenús expandidos
  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('expandedMenus');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error cargando estado del menú:", e);
      return [];
    }
  });

  // Estructura del menú
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
        { id: '/area', label: 'Gestion Area' },
        { id: '/depto', label: 'Gestion Departamento' }
         
      ]
    },
  ];

  // Ajustar automáticamente según el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsOpen(false); // En móviles, el sidebar siempre inicia cerrado
      } else {
        setIsOpen(true); // En pantallas grandes, inicia abierto
      }
    };
  
    let touchStartX = 0;
    let touchEndX = 0;
  
    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX;
    };
  
    const handleTouchEnd = (event) => {
      touchEndX = event.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;
  
      if (swipeDistance > 120 && !isOpen) {
        setIsOpen(true); // Abrir sidebar con swipe derecho
      } else if (swipeDistance < -120 && isOpen) {
        setIsOpen(false); // Cerrar sidebar con swipe izquierdo
      }
    };
  
    // Agregar eventos
    window.addEventListener('resize', handleResize);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
  
    // Limpiar eventos al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen]);
  

  // Función para alternar el sidebar
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

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
  }, [expandedMenus.length, location.pathname, menuItems]);

  // Función para manejar clic en menú cuando el sidebar está cerrado
  const handleMenuClick = (menuId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Si el sidebar está cerrado y se hace clic en un menú con submenús
    if (!isOpen && menuId !== '/dashboard') {
      // Abrir el sidebar
      setIsOpen(true);
      
      // Expandir solo este menú y colapsar los demás
      setExpandedMenus([menuId]);
    } else if (menuId === '/dashboard') {
      // Si es el menú de inicio, navegar directamente
      handleNavigation(menuId, event);
    } else {
      // Si el sidebar ya está abierto, comportamiento normal de toggle
      toggleSubMenu(menuId, event);
    }
  };

  // Función para alternar menú manualmente
  const toggleSubMenu = (menuId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    setExpandedMenus((prevMenus) => {
      // Si el menú ya está abierto, se cierra
      if (prevMenus.includes(menuId)) {
        return [];
      }
      
      // Si otro menú estaba abierto, se cierra
      return [menuId];
    });
  };
  

  // Función para navegación manual
  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    navigate(path);
    
    // En móviles, cerrar el sidebar después de navegar
    if (window.innerWidth <= 390) {
      setIsOpen(false);
    }
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
                  onClick={(e) => handleMenuClick(item.id, e)}
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

export default Sidebar;