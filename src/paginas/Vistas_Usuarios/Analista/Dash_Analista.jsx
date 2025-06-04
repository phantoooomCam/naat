"use client"

import PropTypes from "prop-types"
import "../../SuperAdmin_Funciones/Inicio/DashHome.css"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { 
  FaClipboardList, 
  FaChartLine, 
  FaExclamationTriangle, 
  FaFileAlt,
  FaPlus,
  FaHistory,
  FaArchive,
  FaCheckCircle,
  FaSpinner
} from "react-icons/fa"
import { LuBookHeadphones } from "react-icons/lu"
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
import fetchWithAuth from "../../../utils/fetchWithAuth"

const Dash_Analista = ({ activeView }) => {
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

  const [casos, setCasos] = useState([])
  const [sabanas, setSabanas] = useState([])
  const [logs, setLogs] = useState([])
  const [companias, setCompanias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [estadisticasCasos, setEstadisticasCasos] = useState({
    total: 0,
    activos: 0,
    archivados: 0,
    reactivados: 0
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        const casosResponse = await fetchWithAuth("/api/casos")
        if (casosResponse.ok) {
          const casosData = await casosResponse.json()
          setCasos(casosData)
          
          const stats = {
            total: casosData.length,
            activos: casosData.filter(c => c.estado === 'activo').length,
            archivados: casosData.filter(c => c.estado === 'archivado').length,
            reactivados: casosData.filter(c => c.estado === 'reactivado').length
          }
          setEstadisticasCasos(stats)
        }

        try {
          const logsResponse = await fetchWithAuth("/api/acciones")
          if (logsResponse.ok) {
            const logsData = await logsResponse.json()
            const userLogs = logsData
              .filter(log => log.idUsuario === usuario.id)
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
              .slice(0, 5)
            setLogs(userLogs)
          }
        } catch (error) {
        }

        try {
          const companiasResponse = await fetchWithAuth("/api/sabanas/companias")
          if (companiasResponse.ok) {
            const companiasData = await companiasResponse.json()
            setCompanias(companiasData)
          }
        } catch (error) {
        }

      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError("Error al cargar los datos del dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [usuario.id])

  const casosEstadoData = [
    { name: 'Activos', value: estadisticasCasos.activos, color: '#2c7a7b' },
    { name: 'Archivados', value: estadisticasCasos.archivados, color: '#64748b' },
    { name: 'Reactivados', value: estadisticasCasos.reactivados, color: '#6b46c1' }
  ].filter(item => item.value > 0)

  const getActividadSemanal = () => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const hoy = new Date()
    const actividadPorDia = []

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy)
      fecha.setDate(hoy.getDate() - i)
      const diaNombre = dias[fecha.getDay()]
      
      const casosDelDia = casos.filter(caso => {
        const fechaCaso = new Date(caso.fechaCreacion)
        return fechaCaso.toDateString() === fecha.toDateString()
      }).length

      actividadPorDia.push({
        name: diaNombre,
        casos: casosDelDia
      })
    }

    return actividadPorDia
  }

  const dashboardCards = [
    { 
      id: 1, 
      title: "Crear Caso", 
      route: "/casos", 
      icon: <FaPlus />,
      description: "Crear un nuevo caso de investigación"
    },
    { 
      id: 2, 
      title: "Procesar Sabana", 
      route: "/sabana", 
      icon: <LuBookHeadphones />,
      description: "Subir y procesar archivos de sabana"
    },
  ]

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "Sin fecha"
    const fecha = new Date(fechaISO)
    return fecha.toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const casosRecientes = casos
    .filter(caso => caso.idUsuario === usuario.id)
    .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="home-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando dashboard...</p>
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
            <FaClipboardList />
          </div>
          <div className="stat-content">
            <h3>{estadisticasCasos.total}</h3>
            <p>Total de Casos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <h3>{estadisticasCasos.activos}</h3>
            <p>Casos Activos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaArchive />
          </div>
          <div className="stat-content">
            <h3>{estadisticasCasos.archivados}</h3>
            <p>Casos Archivados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <h3>{estadisticasCasos.reactivados}</h3>
            <p>Casos Reactivados</p>
          </div>
        </div>
      </div>

      {/* Gráficos y visualizaciones */}
      <div className="charts-container">
        <div className="chart-card">
          <h3>Casos Creados (Últimos 7 días)</h3>
          <div className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}>
            <div className="chart-scroll-container">
              {windowWidth <= 768 ? (
                <BarChart
                  width={windowWidth <= 480 ? 500 : 600}
                  height={300}
                  data={getActividadSemanal()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="casos" fill="#33608d" />
                </BarChart>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={getActividadSemanal()} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="casos" fill="#33608d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Distribución de Casos por Estado</h3>
          <div className={`chart-wrapper ${windowWidth <= 768 ? "mobile" : ""}`}>
            <div className="chart-scroll-container">
              {casosEstadoData.length > 0 ? (
                windowWidth <= 768 ? (
                  <PieChart width={windowWidth <= 480 ? 300 : 400} height={300}>
                    <Pie
                      data={casosEstadoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {casosEstadoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={casosEstadoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {casosEstadoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="no-results">
                  <p>No hay casos para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Casos recientes */}
      <div className="recent-activity-card">
        <h3>Mis Casos Recientes</h3>
        <div className="table-responsive">
          <table className="activity-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Fecha de Creación</th>
              </tr>
            </thead>
            <tbody>
              {casosRecientes.length > 0 ? (
                casosRecientes.map((caso) => (
                  <tr key={caso.idCaso}>
                    <td>{caso.idCaso}</td>
                    <td>{caso.nombre}</td>
                    <td>
                      <span className={`status-badge ${caso.estado}`}>
                        {caso.estado || 'Sin estado'}
                      </span>
                    </td>
                    <td>{formatearFecha(caso.fechaCreacion)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-results">
                    No tienes casos creados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actividad reciente */}
      {logs.length > 0 && (
        <div className="recent-activity-card">
          <h3>Mi Actividad Reciente</h3>
          <div className="table-responsive">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Caso</th>
                  <th>Acción</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.idAccion}>
                    <td>{log.idAccion}</td>
                    <td>{log.idCaso}</td>
                    <td>{log.detalleAccion}</td>
                    <td>{formatearFecha(log.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

Dash_Analista.propTypes = {
  activeView: PropTypes.string.isRequired,
}

HomeView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
}

export default Dash_Analista