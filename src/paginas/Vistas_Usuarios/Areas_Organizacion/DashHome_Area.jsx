"use client"

import PropTypes from "prop-types"
import "../../SuperAdmin_Funciones/Inicio/DashHome.css"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { FaUsers, FaChartLine, FaSignInAlt, FaTasks, FaUserClock, FaExclamationTriangle } from "react-icons/fa"
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
} from "recharts"

const DashHome_Area = ({ activeView }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar")
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"))
      }
    })

    observer.observe(document.body, { attributes: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  const views = {
    inicio: <HomeView isSidebarCollapsed={isSidebarCollapsed} />,
  }

  return (
    <div className={`dash-home ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">{views[activeView]}</div>
    </div>
  )
}

const HomeView = ({ isSidebarCollapsed }) => {
  const usuario = JSON.parse(localStorage.getItem("user"))
  const nombre = usuario?.nombre || "Usuario"
  const navigate = useNavigate()
  const organizacion = usuario?.organizacion || "tu organización"
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)

  // Estados para datos
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [totalDepartamentos, setTotalDepartamentos] = useState(0)
  const [pendientes, setPendientes] = useState(0)
  const [actividadPorDia, setActividadPorDia] = useState([])
  const [userTypeData, setUserTypeData] = useState([])
  const [actividadReciente, setActividadReciente] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Detectar cambios en el ancho de la ventana
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const getRangoSemanaActual = () => {
    const hoy = new Date()
    const diaSemana = hoy.getDay() // 0=Dom, 1=Lun, ..., 6=Sáb

    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - diaSemana)
    inicioSemana.setHours(0, 0, 0, 0)

    const finSemana = new Date(inicioSemana)
    finSemana.setDate(inicioSemana.getDate() + 6)
    finSemana.setHours(23, 59, 59, 999)

    return { inicioSemana, finSemana }
  }

  // Fetch usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch("/api/usuarios", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

        const data = await response.json()
        setTotalUsuarios(data.length)

        // Usuarios pendientes (nivel null, undefined, 0, "null", "0")
        const pendientesUsuarios = data.filter((user) => {
          const nivel = user.nivel
          return nivel === null || nivel === undefined || nivel === "null" || nivel === "0" || nivel === 0
        })
        setPendientes(pendientesUsuarios.length)

        // Agrupar por nivel
        const conteoPorNivel = {
          "Super Admin": 0,
          "Admin Org": 0,
          "Jefe de Área": 0,
          "Jefe de Departamento": 0,
          Analista: 0,
        }

        data.forEach((user) => {
          switch (user.nivel) {
            case 1:
              conteoPorNivel["Super Admin"]++
              break
            case 2:
              conteoPorNivel["Admin Org"]++
              break
            case 3:
              conteoPorNivel["Jefe de Área"]++
              break
            case 4:
              conteoPorNivel["Jefe de Departamento"]++
              break
            case 5:
              conteoPorNivel["Analista"]++
              break
            default:
              break
          }
        })

        // Convertir a formato para PieChart
        const datosGrafico = Object.entries(conteoPorNivel)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({ name, value }))

        setUserTypeData(datosGrafico)
      } catch (error) {
        console.error("Error al obtener usuarios:", error)
      }
    }

    fetchUsuarios()
  }, [])

  // Fetch departamentos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/departamentos", {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)

        // Filtrar departamentos por área del usuario
        const deptosData = await response.json()
        const deptosFiltrados = deptosData.filter((depto) => depto.idArea == usuario.idArea)
        setTotalDepartamentos(deptosFiltrados.length)

        setLoading(false)
      } catch (error) {
        console.error("Error al obtener departamentos:", error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [usuario.idArea])

  // Fetch actividades
  useEffect(() => {
    const fetchActividades = async () => {
      try {
        const response = await fetch("/api/actividades", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`)

        const data = await response.json()

        const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

        // === FILTRAR SEMANA ACTUAL PARA LA GRÁFICA ===
        const { inicioSemana, finSemana } = getRangoSemanaActual()

        // Filtrar actividades por área del usuario
        const actividadesFiltradas = data.filter((actividad) => {
          const fecha = new Date(actividad.fecha || actividad.fechaHora || actividad.createdAt)
          return fecha >= inicioSemana && fecha <= finSemana && actividad.area == usuario.area
        })

        // === GRÁFICA POR DÍA ===
        const resumen = {}
        dias.forEach((dia) => {
          resumen[dia] = {
            name: dia,
            Crear: 0,
            Actualizar: 0,
            Eliminar: 0,
          }
        })

        actividadesFiltradas.forEach((actividad) => {
          const accion = (actividad.accion || "").toLowerCase()
          const fecha = new Date(actividad.fecha || actividad.fechaHora || actividad.createdAt)
          const dia = dias[fecha.getDay()]

          if (!resumen[dia]) return

          if (accion.includes("crear")) resumen[dia].Crear += 1
          else if (accion.includes("actualizar")) resumen[dia].Actualizar += 1
          else if (accion.includes("eliminar")) resumen[dia].Eliminar += 1
        })

        const datosGrafica = dias.map((dia) => resumen[dia])
        setActividadPorDia(datosGrafica)

        // === ACTIVIDAD RECIENTE (últimas 5) ===
        const recientes = [...actividadesFiltradas]
          .filter((a) => !!a.fecha)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 5)

        setActividadReciente(recientes)
      } catch (error) {
        console.error("Error al obtener actividades:", error)
        setActividadPorDia([])
        setActividadReciente([])
      }
    }

    fetchActividades()
  }, [usuario.area])

  const COLORS = [
    "#2c3e50", // azul oscuro elegante
    "#1976d2", // azul brillante
    "#3f7cac", // azul intermedio
    "#90caf9", // azul claro
    "#546e7a", // gris azulado
  ]

  // Determinar qué barras mostrar según el tamaño de pantalla
  const getVisibleBars = () => {
    if (windowWidth <= 480) {
      return (
        <>
          <Bar dataKey="Crear" fill="#33608d" />
          <Bar dataKey="Actualizar" fill="#1f77b4" />
          <Bar dataKey="Eliminar" fill="#d62728" />
        </>
      )
    }
    return (
      <>
        <Bar dataKey="Crear" fill="#33608d" />
        <Bar dataKey="Actualizar" fill="#1f77b4" />
        <Bar dataKey="Eliminar" fill="#d62728" />
      </>
    )
  }

  // Formatear fecha
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Datos de las tarjetas con iconos
  const dashboardCards = [
    { id: 1, title: "Gestión Usuarios", route: "/gestion", icon: <FaUsers /> },
    {
      id: 3,
      title: "Actividad del Sistema",
      route: "/actividad",
      icon: <FaChartLine />,
    },
    {
      id: 4,
      title: "Ingresos del Sistema",
      route: "/ingresos",
      icon: <FaSignInAlt />,
    },
    {
      id: 6,
      title: "Gestión Departamento",
      route: "/depto",
      icon: <FaTasks />,
    },
  ]

  if (loading) {
    return (
      <div className="home-view">
        <h1>Cargando datos...</h1>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-view">
        <h1>Error al cargar datos</h1>
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="home-view">
      <h1>
        Bienvenido {nombre} a {organizacion}
      </h1>

      {/* Estadísticas resumidas */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{totalUsuarios}</h3>
            <p>Usuarios en el Área</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <h3>1</h3>
            <p>Alertas del Área</p>
          </div>
        </div>
      </div>

      {/* Gráficos y visualizaciones */}
      <div className="charts-container">

        <div className="chart-card">
          <h3>Distribución de Usuarios</h3>
          <div className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}>
            <div className="chart-scroll-container">
              {windowWidth <= 768 ? (
                // Versión móvil con ancho fijo
                <PieChart width={300} height={300}>
                  <Pie
                    data={userTypeData}
                    cx={150}
                    cy={150}
                    outerRadius={windowWidth <= 480 ? 80 : 90}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={windowWidth > 480}
                    label={windowWidth > 480 ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : null}
                  >
                    {userTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} usuario(s)`, name]} />
                </PieChart>
              ) : (
                // Versión escritorio con ResponsiveContainer
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={true}
                      stroke="#ffffff"
                      strokeWidth={2}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} usuario(s)`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <h2 className="section-title">Accesos Rápidos</h2>
      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <div key={card.id} className="card" onClick={() => navigate(card.route)}>
            <span className="icon">{card.icon}</span>
            <h2>{card.title}</h2>
            <p>Administrar {card.title.toLowerCase()}.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

DashHome_Area.propTypes = {
  activeView: PropTypes.string.isRequired,
}

HomeView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
}

export default DashHome_Area

