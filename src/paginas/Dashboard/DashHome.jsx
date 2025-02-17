import PropTypes from 'prop-types';
import './DashHome.css';

const DashHome = ({ activeView }) => {
  const views = {
    inicio: <HomeView />,
    reportes: <ReportsView />,
    config: <ConfigView />,
    ayuda: <HelpView />
  };

  return (
    <div className="dash-home">
      <div className="container">
        {views[activeView]}
      </div>
    </div>
  );
};

const HomeView = () => {
  // Obtener el usuario desde localStorage dentro del componente HomeView
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre || "Usuario"; // Si no hay usuario, se muestra "Usuario"

  return (
    <div className="home-view">
      <h1>Bienvenido, {nombre} al Panel de Control</h1>
      <div className="cards-grid">
        <div className="card blue"></div>
        <div className="card green"></div>
        <div className="card orange"></div>
      </div>
    </div>
  );
};

// Componentes de ejemplo para otras vistas
const ReportsView = () => <div className="chart-placeholder" />;
const ConfigView = () => <h1>Configuración del Sistema</h1>;
const HelpView = () => <h1>Centro de Ayuda</h1>;

DashHome.propTypes = {
  activeView: PropTypes.string.isRequired,
};

export default DashHome;
