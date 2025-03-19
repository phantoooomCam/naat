import { FiHome, FiUsers, FiSettings, FiHelpCircle } from "react-icons/fi";
import { AiOutlineIdcard } from "react-icons/ai";
import { FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { BiLogIn } from "react-icons/bi";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../../paginas/Admin/Componentes/Sidebar.css";
import NAAT from "../../../src/assets/completo_blanco.png";
import {menu} from "../../paginas/AdminOrganizacion/Componentes/sidebarConfig2.jsx";
const SideAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRender = useRef(true);

  const userLevel = JSON.parse(localStorage.getItem('user'))
  const menuItems = menu[userLevel.nivel] || [];
  
  // Estado para controlar si el sidebar está abierto o cerrado
  const [isOpen, setIsOpen] = useState(() => {
    // Comprobamos si es un dispositivo móvil usando matchMedia
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    return JSON.parse(localStorage.getItem('sidebarState')) ?? window.innerWidth > 390;
  });

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

  // Limpiar el estado guardado cuando se desmonta el componente
  useEffect(() => {
    return () => {
      localStorage.removeItem('expandedMenus');
    };
  }, []);

  // Detectar si es un dispositivo móvil
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  // Ajustar automáticamente según el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      // No cambiamos el estado automáticamente al redimensionar
      // para permitir que el usuario controle manualmente el sidebar
      // Solo actualizamos en el montaje inicial
      if (initialRender.current) {
        if (isMobile()) {
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        initialRender.current = false;
      }
    };

    // Eventos de touch para permitir gestos de deslizamiento
    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX;
    };

    const handleTouchEnd = (event) => {
      touchEndX = event.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;
      const threshold = 70;

      // Solo activar swipe en el área izquierda de la pantalla para abrir
      const isLeftEdgeSwipe = touchStartX < 50;

      if (swipeDistance > threshold && !isOpen && isLeftEdgeSwipe) {
        setIsOpen(true); // Abrir sidebar con swipe derecho desde el borde
      } else if (swipeDistance < -threshold && isOpen) {
        setIsOpen(false); // Cerrar sidebar con swipe izquierdo
      }
    };

    // Agregar eventos
    window.addEventListener('resize', handleResize);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    // Ejecutar una vez al inicio para ajustar según el tamaño inicial
    handleResize();

    // Limpiar eventos al desmontar
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen]);

  // Función para alternar el sidebar (toggle)
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Guardar en localStorage cuando cambien los estados relevantes
  useEffect(() => {
    if (!initialRender.current) {
      try {
        localStorage.setItem('expandedMenus', JSON.stringify(expandedMenus));
        localStorage.setItem('sidebarState', JSON.stringify(isOpen));
      } catch (e) {
        console.error("Error guardando estado del menú:", e);
      }
    } else {
      initialRender.current = false;
    }
  }, [expandedMenus, isOpen]);

  // Función para manejar clic en menú cuando el sidebar está cerrado
  const handleMenuClick = (menuId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const clickedItem = menuItems.find(item => item.id === menuId);

    // Si el elemento tiene subItems, manejar expandir/colapsar
    if (clickedItem?.subItems) {
      // Si el sidebar está cerrado y se hace clic en un menú con submenús, abrirlo y expandir el submenú
      if (!isOpen) {
        setIsOpen(true);
        setExpandedMenus([menuId]); // Expande directamente el submenú seleccionado
        localStorage.setItem('expandedMenus', JSON.stringify([menuId]));
      } else {
        // Si el sidebar ya está abierto, comportamiento normal de toggle
        toggleSubMenu(menuId, event);
      }
    } else {
      // Si es un elemento sin subItems, navegar directamente
      handleNavigation(menuId, event);
    }
  };

  // Función para alternar menú manualmente
  const toggleSubMenu = (menuId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setExpandedMenus(prevMenus =>
      prevMenus.includes(menuId) ? [] : [menuId]
    );
  };

  // Función para navegación manual
  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Cerrar todos los submenús antes de navegar
    setExpandedMenus([]);

    // Actualizar localStorage con el array vacío
    localStorage.setItem('expandedMenus', JSON.stringify([]));

    // Navegar a la ruta deseada
    navigate(path);

    // En móviles, siempre cerrar el sidebar después de navegar
    if (isMobile()) {
      setIsOpen(false);
    }
  };

  // Verificar si un subítem está activo
  const isSubItemActive = (subItemId) => {
    return location.pathname === subItemId || location.pathname.startsWith(subItemId);
  };

  // Verificar si un menú principal está activo
  const isMenuActive = (item) => {
    // Si tiene ID directo, comparar con la ruta actual
    if (!item.subItems) {
      return location.pathname === item.id;
    }
    // Si tiene subítems, verificar si alguno está activo
    return item.subItems?.some(subItem => isSubItemActive(subItem.id));
  };
  
  // Aplicar clase adicional cuando estamos en móvil
  const sidebarClass = `sidebar ${isOpen ? 'open' : 'closed'} ${isMobile() ? 'mobile' : ''}`;

  return (
    <>
      {/* Overlay para cerrar el sidebar en móviles al hacer clic fuera */}
      {isOpen && isMobile() && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav className={sidebarClass}>
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
              {/* Manejar tanto elementos con subItems como sin ellos */}
              <div className="menu-wrapper">
                <button
                  className={`menu-item ${isMenuActive(item) ? 'active' : ''}`}
                  onClick={(e) => handleMenuClick(item.id, e)}
                >
                  <span className="icon">{item.icon}</span>
                  {isOpen && <span className="label">{item.label}</span>}
                </button>
              </div>

              {/* Renderizar submenús solo si existen */}
              {item.subItems && (
                <div
                  className="sub-menu"
                  style={{ display: expandedMenus.includes(item.id) ? 'block' : 'none' }}
                >
                  {item.subItems.map((subItem) => (
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
              )}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
};

export default SideAdmin;