import PropTypes from 'prop-types';
import './DashHome.css';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from "react-router-dom";

const DashHome = ({ activeView }) => {

  const views = {
    inicio: <HomeView />,
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
  const navigate = useNavigate();

  return (
    <div className="home-view">
      <h1>Bienvenido, {nombre} al Panel de Control</h1>
      <div className="cards-grid">
        <div className="card blue" onClick={() => navigate("/gestion")}>
          <h2>Gestionar Usuarios</h2>
          <DotLottieReact
            src="https://lottie.host/00b12e36-f691-4b85-8546-6f70be161665/9PEhlcnxOD.lottie"
            loop
            autoplay
            className="lottie-animation"
          />
        </div>
        <div className="card green" onClick={() => navigate("/ingresos")}>
          <h2>Ingresos al Sistema</h2>
          <DotLottieReact
            src="https://lottie.host/0ac02a9f-36d2-44fd-bf17-31c8c8cb4bdc/IJJBt2KPzb.lottie"
            loop
            autoplay
            className="lottie-animation"
          />
        </div>
        <div className="card orange" onClick={() => navigate("/actividad")}>
          <h2>Actividad del Sistema</h2>
          <DotLottieReact
            src="https://lottie.host/63f7e54f-126d-48d1-b91c-3f591c5be4d2/s5r8T0SwtQ.lottie"
            loop
            autoplay
            className="lottie-animation"
          />
        </div>
      </div>
    </div>
  );
};



DashHome.propTypes = {
  activeView: PropTypes.string.isRequired,
};

export default DashHome;




