"use client"

import { useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import "./Sidebar.css"
import NAAT from "../assets/completo_blanco.png"
import { FaChevronDown, FaChevronRight } from "react-icons/fa"
import { menu } from "./sidebarConfig"

// Define the menu structure here
// const menu = {
//   1: [
//     {
//       id: "/dashboard",
//       label: "Inicio",
//       icon: <FiHome size={20} />,
//     },
//     {
//       id: "/usuarios",
//       label: "Usuarios",
//       icon: <FiUsers size={20} />,
//     },
//     {
//       id: "/organizaciones",
//       label: "Organizaciones",
//       icon: <SlOrganization size={20} />,
//     },
//     {
//       id: "configuracion",
//       label: "Configuración",
//       icon: <FiSettings size={20} />,
//       subItems: [
//         { id: "/configuracion/general", label: "General" },
//         { id: "/configuracion/seguridad", label: "Seguridad" },
//       ],
//     },
//   ],
//   2: [
//     {
//       id: "/dashboard",
//       label: "Inicio",
//       icon: <FiHome size={20} />,
//     },
//     {
//       id: "/usuarios",
//       label: "Usuarios",
//       icon: <FiUsers size={20} />,
//     },
//   ],
// }

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const initialRender = useRef(true)

  // Estructura del menú con submenús
  const userLevel = JSON.parse(localStorage.getItem("user"))?.nivel || 1
  const menuItems = menu[userLevel] || []

  // Estado para controlar si el sidebar está abierto o cerrado
  const [isOpen, setIsOpen] = useState(() => {
    // Comprobamos si es un dispositivo móvil usando matchMedia
    const isMobile = window.matchMedia("(max-width: 768px)").matches
    return localStorage.getItem("sidebarState") ? JSON.parse(localStorage.getItem("sidebarState")) : !isMobile
  })

  // Inicialización de estado desde localStorage para submenús expandidos
  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = localStorage.getItem("expandedMenus")
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error("Error cargando estado del menú:", e)
      return []
    }
  })

  // Estado para controlar la animación del overlay
  const [overlayVisible, setOverlayVisible] = useState(false)

  // Detectar si es un dispositivo móvil
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches

  // Ajustar automáticamente según el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      // Solo actualizamos en el montaje inicial
      if (initialRender.current) {
        if (isMobile()) {
          setIsOpen(false) // En móvil comienza cerrado pero visible
        } else {
          setIsOpen(true)
        }
        initialRender.current = false
      }
    }

    // Eventos de touch para permitir gestos de deslizamiento
    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX
    }

    const handleTouchEnd = (event) => {
      touchEndX = event.changedTouches[0].clientX
      const swipeDistance = touchEndX - touchStartX
      const threshold = 70

      // Solo activar swipe en el área izquierda de la pantalla para abrir
      const isLeftEdgeSwipe = touchStartX < 50

      if (swipeDistance > threshold && !isOpen && isLeftEdgeSwipe) {
        setIsOpen(true) // Abrir sidebar con swipe derecho desde el borde
        setTimeout(() => setOverlayVisible(true), 50)
      } else if (swipeDistance < -threshold && isOpen) {
        setOverlayVisible(false)
        setTimeout(() => setIsOpen(false), 300)
      }
    }

    // Agregar eventos
    window.addEventListener("resize", handleResize)
    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchend", handleTouchEnd)

    // Ejecutar una vez al inicio para ajustar según el tamaño inicial
    handleResize()

    // Limpiar eventos al desmontar
    return () => {
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isOpen])

  // Función para alternar el sidebar (toggle)
  const toggleSidebar = () => {
    if (isMobile()) {
      if (isOpen) {
        setOverlayVisible(false)
        setTimeout(() => setIsOpen(false), 300)
      } else {
        setIsOpen(true)
        setTimeout(() => setOverlayVisible(true), 50)
      }
    } else {
      setIsOpen(!isOpen)
    }
  }

  // Guardar en localStorage cuando cambien los estados relevantes
  useEffect(() => {
    if (!initialRender.current) {
      try {
        localStorage.setItem("expandedMenus", JSON.stringify(expandedMenus))
        localStorage.setItem("sidebarState", JSON.stringify(isOpen))
      } catch (e) {
        console.error("Error guardando estado del menú:", e)
      }
    } else {
      initialRender.current = false
    }
  }, [expandedMenus, isOpen])

  // Verificar si un menú está activo (para resaltarlo)
  const isMenuActive = (item) => {
    if (!item.subItems) {
      return location.pathname === item.id
    }
    return item.subItems.some((subItem) => location.pathname === subItem.id)
  }

  // Verificar si un submenú está activo
  const isSubItemActive = (subItemId) => {
    return location.pathname === subItemId
  }

  // Función para manejar clic en menú cuando el sidebar está cerrado
  const handleMenuClick = (menuId, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const clickedItem = menuItems.find((item) => item.id === menuId)

    // Si el elemento tiene subItems, manejar expandir/colapsar
    if (clickedItem?.subItems) {
      // Si el sidebar está cerrado y se hace clic en un menú con submenús, abrirlo y expandir el submenú
      if (!isOpen) {
        setIsOpen(true)
        setExpandedMenus([menuId]) // Expande directamente el submenú seleccionado
        localStorage.setItem("expandedMenus", JSON.stringify([menuId]))
        if (isMobile()) {
          setTimeout(() => setOverlayVisible(true), 50)
        }
      } else {
        // Si el sidebar ya está abierto, comportamiento normal de toggle
        toggleSubMenu(menuId, event)
      }
    } else {
      // Si es un elemento sin subItems, navegar directamente
      handleNavigation(menuId, event)
    }
  }

  // Función para alternar menú manualmente
  const toggleSubMenu = (menuId, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    setExpandedMenus((prevMenus) =>
      prevMenus.includes(menuId) ? prevMenus.filter((id) => id !== menuId) : [...prevMenus, menuId],
    )
  }

  // Función para navegación manual
  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Navegar a la ruta deseada
    navigate(path)

    // En móviles, siempre cerrar el sidebar después de navegar
    if (isMobile()) {
      setOverlayVisible(false)
      setTimeout(() => setIsOpen(false), 300)
    }
  }

  // Expandir automáticamente el menú activo al cargar
  useEffect(() => {
    const activeParent = menuItems.find((item) => item.subItems?.some((subItem) => location.pathname === subItem.id))

    if (activeParent && !expandedMenus.includes(activeParent.id)) {
      setExpandedMenus((prev) => [...prev, activeParent.id])
    }
  }, [location.pathname])

  // Aplicar clase adicional cuando estamos en móvil
  const sidebarClass = `sidebar ${isOpen ? "open" : "closed"} ${isMobile() ? "mobile" : ""}`

  // Manejar cierre del overlay
  const handleOverlayClick = () => {
    setOverlayVisible(false)
    setTimeout(() => setIsOpen(false), 300)
  }

  return (
    <>
      {/* Overlay para cerrar el sidebar en móviles al hacer clic fuera */}
      {isOpen && isMobile() && (
        <div className={`sidebar-overlay ${overlayVisible ? "visible" : ""}`} onClick={handleOverlayClick} />
      )}

      <nav className={sidebarClass}>
        <div className="sidebar-header">
          <div className="logo-wrapper" onClick={toggleSidebar} style={{ cursor: "pointer" }}>
            <img src={NAAT || "/placeholder.svg"} alt="NAAT Logo" className="top-logo" />
            {isOpen && <h1 className="dashboard-title">Dashboard</h1>}
          </div>
        </div>

        <div className="menu-items">
          {menuItems.map((item) => (
            <div key={item.id} className="menu-container">
              {/* Manejar tanto elementos con subItems como sin ellos */}
              <div className="menu-wrapper">
                <button
                  className={`menu-item ${isMenuActive(item) ? "active" : ""}`}
                  onClick={(e) => handleMenuClick(item.id, e)}
                >
                  <span className="icon">{item.icon}</span>
                  {isOpen && (
                    <>
                      <span className="label">{item.label}</span>
                      {item.subItems && (
                        <span
                          className="menu-arrow"
                          style={{ transform: expandedMenus.includes(item.id) ? "rotate(180deg)" : "rotate(0deg)" }}
                        >
                          {expandedMenus.includes(item.id) ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Renderizar submenús solo si existen */}
              {item.subItems && (
                <div className={`sub-menu ${expandedMenus.includes(item.id) ? "expanded" : ""}`}>
                  {item.subItems.map((subItem) => (
                    <div key={subItem.id} className="menu-link" onClick={(e) => handleNavigation(subItem.id, e)}>
                      <button className={`sub-menu-item ${isSubItemActive(subItem.id) ? "active" : ""}`}>
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
  )
}

export default Sidebar

