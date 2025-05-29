"use client"

import PropTypes from "prop-types"
import "../../SuperAdmin_Funciones/Inicio/DashHome.css"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { FaUsers, FaChartLine, FaSignInAlt, FaBuilding, FaTasks, FaLayerGroup, FaClipboardList } from "react-icons/fa"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import fetchWithAuth from "../../../utils/fetchWithAuth"

const DashHome_Organizacion = ({ activeView }) => {
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
  const [usuarios, setUsuarios] = useState([])
  const [ingresos, setIngresos] = useState([])
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [totalAreas, setTotalAreas] = useState(0)
  const [totalDepartamentos, setTotalDepartamentos] = useState(0)
  const [userTypeData, setUserTypeData] = useState([])
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

  // Fetch datos reales
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        // Obtener usuarios de la organización
        const usuariosResponse = await fetchWithAuth("/api/usuarios")
        let usuariosOrg = []
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json()
          // Filtrar usuarios de la misma organización
          usuariosOrg = usuariosData.filter((u) => u.idOrganizacion === usuario.idOrganizacion)
          setUsuarios(usuariosOrg)
          setTotalUsuarios(usuariosOrg.length)

          // Agrupar por nivel para la gráfica de distribución
          const conteoPorNivel = {
            "Super Admin": 0,
            "Admin Org": 0,
            "Jefe de Área": 0,
            "Jefe de Departamento": 0,
            Analista: 0,
          }

          usuariosOrg.forEach((user) => {
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
        }

        // Obtener áreas de la organización
        const areasResponse = await fetchWithAuth("/api/areas")
        if (areasResponse.ok) {
          const areasData = await areasResponse.json()
          const areasFiltradas = areasData.filter((area) => area.idOrganizacion === usuario.idOrganizacion)
          setTotalAreas(areasFiltradas.length)
        }

        // Obtener departamentos de la organización
        const deptosResponse = await fetchWithAuth("/api/departamentos")
        if (deptosResponse.ok) {
          const deptosData = await deptosResponse.json()
          const deptosFiltrados = Array.isArray(deptosData)
            ? deptosData.filter((depto) => depto.idOrganizacion === usuario.idOrganizacion)
            : Array.isArray(deptosData.departamentos)
              ? deptosData.departamentos.filter((depto) => depto.idOrganizacion === usuario.idOrganizacion)
              : []
          setTotalDepartamentos(deptosFiltrados.length)
        }

        // Obtener ingresos de usuarios de la organización
        if (usuariosOrg.length > 0) {
          const ingresosResponse = await fetchWithAuth("/api/ingresos")
          if (ingresosResponse.ok) {
            const ingresosData = await ingresosResponse.json()
            const usuariosIds = usuariosOrg.map((u) => u.id)
            const ingresosOrg = ingresosData
              .filter((ingreso) => usuariosIds.includes(ingreso.idUsuario))
              .sort((a, b) => new Date(b.hora || b.fechaHora) - new Date(a.hora || a.fechaHora))
              .slice(0, 10)
            setIngresos(ingresosOrg)
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError("Error al cargar los datos del dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [usuario.idOrganizacion])

  // Preparar datos para gráfica de usuarios por área
  const usuariosPorArea = usuarios.reduce((acc, usuario) => {
    const areaId = usuario.idArea || "Sin Área"
    acc[areaId] = (acc[areaId] || 0) + 1
    return acc
  }, {})

  const usuariosAreaData = Object.entries(usuariosPorArea).map(([area, cantidad], index) => ({
    name: area === "Sin Área" ? "Sin Área" : `Área ${area}`,
    value: cantidad,
    color: ["#33608d", "#2c7a7b", "#6b46c1", "#d69e2e", "#e53e3e", "#8b5cf6"][index % 6],
  }))

  const COLORS = [
    "#2c3e50", // azul oscuro elegante
    "#1976d2", // azul brillante
    "#3f7cac", // azul intermedio
    "#90caf9", // azul claro
    "#546e7a", // gris azulado
  ]

  // Formatear fecha como en IngresosSist
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Sin fecha"
    const fecha = new Date(fechaISO)
    return fecha.toLocaleString()
  }

  // Traducir tipo como en IngresosSist
  const traducirTipo = (tipo) => {
    if (tipo === "Iniciar Sesión") return "Inicio Sesión"
    if (tipo === "Cerrar Sesión") return "Cerró Sesión"
    return tipo || "N/A"
  }

  const dashboardCards = [
    {
      id: 1,
      title: "Gestión Usuarios",
      route: "/gestion",
      icon: <FaUsers />,
      description: "Administrar usuarios de la organización",
    },
    {
      id: 2,
      title: "Casos",
      route: "/caso",
      icon: <FaClipboardList />,
      description: "Gestionar casos de la organización",
    },
  ]

  if (loading) {
    return (
      <div className="home-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando dashboard de la organización...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-view">
        <div className="error-container">
          <h2>Error al cargar datos</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Reintentar
          </button>
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
            <p>Usuarios Totales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaLayerGroup />
          </div>
          <div className="stat-content">
            <h3>{totalAreas}</h3>
            <p>Áreas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaTasks />
          </div>
          <div className="stat-content">
            <h3>{totalDepartamentos}</h3>
            <p>Departamentos</p>
          </div>
        </div>
      </div>

      {/* Gráficos y visualizaciones */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Distribución de Usuarios por Nivel</h3>
          <div className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}>
            <div className="chart-scroll-container">
              {userTypeData.length > 0 ? (
                windowWidth <= 768 ? (
                  <PieChart width={windowWidth <= 480 ? 300 : 400} height={300}>
                    <Pie
                      data={userTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={windowWidth <= 480 ? 80 : 90}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={windowWidth > 480}
                      label={
                        windowWidth > 480 ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : null
                      }
                    >
                      {userTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} usuario(s)`, name]} />
                  </PieChart>
                ) : (
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
                )
              ) : (
                <div className="no-results">
                  <p>No hay usuarios para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Usuarios por Área</h3>
          <div className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}>
            <div className="chart-scroll-container">
              {usuariosAreaData.length > 0 ? (
                windowWidth <= 768 ? (
                  <PieChart width={windowWidth <= 480 ? 300 : 400} height={300}>
                    <Pie
                      data={usuariosAreaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {usuariosAreaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={usuariosAreaData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {usuariosAreaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="no-results">
                  <p>No hay usuarios para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla resumen de ingresos */}
      <div className="recent-activity-card">
        <h3>Resumen de Ingresos al Sistema</h3>
        <div className="table-responsive">
          <table className="activity-table">
            <thead>
              <tr>
                <th>ID Ingreso</th>
                <th>ID Usuario</th>
                <th>Nombre</th>
                <th>Apellido Paterno</th>
                <th>Apellido Materno</th>
                <th>Fecha y Hora</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.length > 0 ? (
                ingresos.map((ingreso) => (
                  <tr key={ingreso.idIngreso}>
                    <td>{ingreso.idIngreso}</td>
                    <td>{ingreso.idUsuario}</td>
                    <td>{ingreso.nombre || "N/A"}</td>
                    <td>{ingreso.apellidoPaterno || "N/A"}</td>
                    <td>{ingreso.apellidoMaterno || "N/A"}</td>
                    <td>{formatearFecha(ingreso.hora || ingreso.fechaHora)}</td>
                    <td>{traducirTipo(ingreso.tipo)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-results">
                    No hay ingresos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accesos rápidos */}
      <h2 className="section-title">Accesos Rápidos</h2>
      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <div key={card.id} className="card" onClick={() => navigate(card.route)}>
            <span className="icon">{card.icon}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

DashHome_Organizacion.propTypes = {
  activeView: PropTypes.string.isRequired,
}

HomeView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
}

export default DashHome_Organizacion
