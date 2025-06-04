"use client"

import { useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import "./Sidebar.css"
import NAAT from "../assets/completo_blanco.png"
import { FaChevronDown, FaChevronRight } from "react-icons/fa"
import { menu } from "./sidebarConfig"
import fetchWithAuth from "../utils/fetchWithAuth";



const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const initialRender = useRef(true)


  const userLevel = JSON.parse(localStorage.getItem("user"))?.nivel || 1
  const menuItems = menu[userLevel] || []

 
  const [isOpen, setIsOpen] = useState(() => {

    const isMobile = window.matchMedia("(max-width: 768px)").matches
    return localStorage.getItem("sidebarState") ? JSON.parse(localStorage.getItem("sidebarState")) : !isMobile
  })

  const [expandedMenus, setExpandedMenus] = useState(() => {
    try {
      const saved = localStorage.getItem("expandedMenus")
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error("Error cargando estado del menú:", e)
      return []
    }
  })

  const [overlayVisible, setOverlayVisible] = useState(false)

  
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches

  useEffect(() => {
    const handleResize = () => {
     
      if (initialRender.current) {
        if (isMobile()) {
          setIsOpen(false) 
        } else {
          setIsOpen(true)
        }
        initialRender.current = false
      }
    }

    
    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX
    }

    const handleTouchEnd = (event) => {
      touchEndX = event.changedTouches[0].clientX
      const swipeDistance = touchEndX - touchStartX
      const threshold = 70

    
      const isLeftEdgeSwipe = touchStartX < 50

      if (swipeDistance > threshold && !isOpen && isLeftEdgeSwipe) {
        setIsOpen(true) 
        setTimeout(() => setOverlayVisible(true), 50)
      } else if (swipeDistance < -threshold && isOpen) {
        setOverlayVisible(false)
        setTimeout(() => setIsOpen(false), 300)
      }
    }


    window.addEventListener("resize", handleResize)
    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchend", handleTouchEnd)

  
    handleResize()

    
    return () => {
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isOpen])

  
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

  
  const isMenuActive = (item) => {
    if (!item.subItems) {
      return location.pathname === item.id
    }
    return item.subItems.some((subItem) => location.pathname === subItem.id)
  }

 
  const isSubItemActive = (subItemId) => {
    return location.pathname === subItemId
  }

  
  const handleMenuClick = (menuId, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const clickedItem = menuItems.find((item) => item.id === menuId)

   
    if (clickedItem?.subItems) {
      
      if (!isOpen) {
        setIsOpen(true)
        setExpandedMenus([menuId]) 
        localStorage.setItem("expandedMenus", JSON.stringify([menuId]))
        if (isMobile()) {
          setTimeout(() => setOverlayVisible(true), 50)
        }
      } else {
       
        toggleSubMenu(menuId, event)
      }
    } else {
     
      handleNavigation(menuId, event)
    }
  }

 
  const toggleSubMenu = (menuId, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    setExpandedMenus((prevMenus) =>
      prevMenus.includes(menuId) ? prevMenus.filter((id) => id !== menuId) : [...prevMenus, menuId],
    )
  }

  
  const handleNavigation = (path, event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    
    navigate(path)

    if (isMobile()) {
      setOverlayVisible(false)
      setTimeout(() => setIsOpen(false), 300)
    }
  }

  
  useEffect(() => {
    const activeParent = menuItems.find((item) => item.subItems?.some((subItem) => location.pathname === subItem.id))

    if (activeParent && !expandedMenus.includes(activeParent.id)) {
      setExpandedMenus((prev) => [...prev, activeParent.id])
    }
  }, [location.pathname])

 
  const sidebarClass = `sidebar ${isOpen ? "open" : "closed"} ${isMobile() ? "mobile" : ""}`

  
  const handleOverlayClick = () => {
    setOverlayVisible(false)
    setTimeout(() => setIsOpen(false), 300)
  }

  return (
    <>
      
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

