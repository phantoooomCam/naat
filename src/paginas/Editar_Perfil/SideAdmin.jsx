import { FiHome, FiUsers, FiSettings, FiHelpCircle } from "react-icons/fi";
import { AiOutlineIdcard } from "react-icons/ai";
import { FaCreditCard, FaMoneyBillWave } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { BiLogIn } from "react-icons/bi";
import PropTypes from "prop-types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../../componentes/Sidebar.css";
import NAAT from "../../../src/assets/completo_blanco.png";
import {menu} from "../../componentes/sidebarConfig2";
import fetchWithAuth from "../../utils/fetchWithAuth";



const SideAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRender = useRef(true);

  const userLevel = JSON.parse(localStorage.getItem('user'))
  const menuItems = menu[userLevel.nivel] || [];
  
  const [isOpen, setIsOpen] = useState(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    return JSON.parse(localStorage.getItem('sidebarState')) ?? window.innerWidth > 390;
  });

  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('expandedMenus');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error cargando estado del menú:", e);
      return [];
    }
  });

  useEffect(() => {
    return () => {
      localStorage.removeItem('expandedMenus');
    };
  }, []);

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  useEffect(() => {
    const handleResize = () => {
      if (initialRender.current) {
        if (isMobile()) {
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        initialRender.current = false;
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
      const threshold = 70;

      const isLeftEdgeSwipe = touchStartX < 50;

      if (swipeDistance > threshold && !isOpen && isLeftEdgeSwipe) {
        setIsOpen(true); 
      } else if (swipeDistance < -threshold && isOpen) {
        setIsOpen(false); 
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

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

  const handleMenuClick = (menuId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const clickedItem = menuItems.find(item => item.id === menuId);

    if (clickedItem?.subItems) {
      if (!isOpen) {
        setIsOpen(true);
        setExpandedMenus([menuId]); 
        localStorage.setItem('expandedMenus', JSON.stringify([menuId]));
      } else {
        toggleSubMenu(menuId, event);
      }
    } else {
      handleNavigation(menuId, event);
    }
  };

  const toggleSubMenu = (menuId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setExpandedMenus(prevMenus =>
      prevMenus.includes(menuId) ? [] : [menuId]
    );
  };

  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setExpandedMenus([]);

    localStorage.setItem('expandedMenus', JSON.stringify([]));

    navigate(path);

    if (isMobile()) {
      setIsOpen(false);
    }
  };

  const isSubItemActive = (subItemId) => {
    return location.pathname === subItemId || location.pathname.startsWith(subItemId);
  };

  const isMenuActive = (item) => {
    if (!item.subItems) {
      return location.pathname === item.id;
    }
    return item.subItems?.some(subItem => isSubItemActive(subItem.id));
  };
  
  const sidebarClass = `sidebar ${isOpen ? 'open' : 'closed'} ${isMobile() ? 'mobile' : ''}`;

  return (
    <>
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