import React, { useState } from 'react';
import './Dashboard.css';

// Componente para el Sidebar
const Sidebar = ({ isOpen }) => (
  <div className={`sidebar ${isOpen ? 'open' : ''}`}>
    <div className="sidebar-header">
      <h3>Mi Dashboard</h3>
    </div>
    <nav className="sidebar-nav">
      <ul>
        <li><a href="#"><i className="fas fa-home"></i> Inicio</a></li>
        <li><a href="#"><i className="fas fa-chart-bar"></i> Estadísticas</a></li>
        <li><a href="#"><i className="fas fa-users"></i> Usuarios</a></li>
        <li><a href="#"><i className="fas fa-cog"></i> Configuración</a></li>
      </ul>
    </nav>
  </div>
);

// Componente para el Header
const Header = ({ toggleSidebar }) => (
  <header className="dashboard-header">
    <button className="menu-toggle" onClick={toggleSidebar}>
      <i className="fas fa-bars"></i>
    </button>
    <div className="header-right">
      <div className="user-profile">
        <img src="https://via.placeholder.com/40" alt="Usuario" />
        <span>Usuario</span>
      </div>
    </div>
  </header>
);

// Componente principal del Dashboard
const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Header toggleSidebar={toggleSidebar} />
        <div className="dashboard-content">
          <div className="dashboard-grid">
            {/* Card 1 */}
            <div className="dashboard-card">
              <h3>Total Usuarios</h3>
              <p className="card-value">1,234</p>
              <p className="card-change positive">+5.3%</p>
            </div>
            
            {/* Card 2 */}
            <div className="dashboard-card">
              <h3>Ingresos</h3>
              <p className="card-value">$45,678</p>
              <p className="card-change positive">+2.7%</p>
            </div>
            
            {/* Card 3 */}
            <div className="dashboard-card">
              <h3>Actividad</h3>
              <p className="card-value">789</p>
              <p className="card-change negative">-1.2%</p>
            </div>
            
            {/* Card 4 */}
            <div className="dashboard-card">
              <h3>Rendimiento</h3>
              <p className="card-value">92%</p>
              <p className="card-change positive">+0.8%</p>
            </div>
          </div>

          {/* Área para gráficos o contenido adicional */}
          <div className="dashboard-charts">
            <div className="chart-container">
              <h3>Actividad Reciente</h3>
              <div className="placeholder-chart">
                {/* Aquí puedes agregar tus gráficos o componentes */}
                <p>Área para gráficos o contenido adicional</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
