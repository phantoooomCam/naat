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

const HomeView = () => (
  <div className="home-view">
    <h1>Bienvenido al Panel de Control</h1>
    <div className="cards-grid">
      <div className="card blue"></div>
      <div className="card green"></div>
      <div className="card orange"></div>
      <div className="card purple"></div>
    </div>
  </div>
);

// Componentes de ejemplo para otras vistas
const ReportsView = () => <div className="chart-placeholder" />;
const ConfigView = () => <h1>Configuración del Sistema</h1>;
const HelpView = () => <h1>Centro de Ayuda</h1>;

DashHome.propTypes = {
  activeView: PropTypes.string.isRequired,
};

export default DashHome;
