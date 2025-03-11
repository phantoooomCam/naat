import PropTypes from 'prop-types';
import './DashHome.css';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';

const DashHome = ({ activeView }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"));
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const views = {
    inicio: <HomeView isSidebarCollapsed={isSidebarCollapsed} />,
  };

  return (
    <div className={`dash-home ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="container">
        {views[activeView]}
      </div>
    </div>
  );
};

const HomeView = ({ isSidebarCollapsed }) => {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre || "Usuario";
  const navigate = useNavigate();

  return (
    <div className="home-view">
      <h1>Bienvenido, {nombre} al Panel de Control</h1>

      {/* Primera fila: 3 tarjetas */}
      <div className="row-1">
        <div className="card" onClick={() => navigate("/gestion")}>
          <h2>Gestión Usuarios</h2>
          <DotLottieReact
            src="https://lottie.host/00b12e36-f691-4b85-8546-6f70be161665/9PEhlcnxOD.lottie"
            loop autoplay
            className="lottie-animation"
          />
        </div>

        <div className="card" onClick={() => navigate("*")}>
          <h2>Solicitudes</h2>
          <DotLottieReact
            src="https://lottie.host/4c20add5-f72e-487d-82b6-ab25fa94a43c/ufeVT3x9Lw.lottie"
            loop autoplay
            className="lottie-animation"
          />
        </div>

        <div className="card" onClick={() => navigate("/actividad")}>
          <h2>Actividad del Sistema</h2>
          <DotLottieReact
            src="https://lottie.host/50b978f9-5c84-4593-9ddb-31a9057ffa98/vv8BHKSnq5.lottie"
            loop autoplay
            className="lottie-animation"
          />
        </div>
      </div>

      {/* Segunda fila: 2 tarjetas */}
      <div className="row-2">
        <div className="card" onClick={() => navigate("/ingresos")}>
          <h2>Ingresos del Sistema</h2>
          <DotLottieReact
            src="https://lottie.host/8f61c385-b27f-40ca-a081-618703f087ec/ciho3IyxhD.lottie"
            loop autoplay
            className="lottie-animation"
          />
        </div>

        <div className="card" onClick={() => navigate("/orga")}>
          <h2>Gestión Organización</h2>
          <DotLottieReact
            src="https://lottie.host/1497fda5-bd8a-4e9d-955c-c4c34c62aaca/SXaSgg3pev.lottie"
            loop autoplay
            className="lottie-animation"
          />
        </div>
      </div>

      {/* Tercera fila: 2 tarjetas */}
      <div className="row-3">
        <div className="card" onClick={() => navigate("/depto")}>
          <h2>Gestión Departamento</h2>
          <DotLottieReact
            src="https://lottie.host/28841a49-8ec4-4d38-97af-ab8a4692405b/g6wjbQGXEQ.lottie"
            loop autoplay
            className="lottie-animation"
          />
        </div>

        <div className="card" onClick={() => navigate("/area")}>
          <h2>Gestión Área</h2>
          <DotLottieReact
            src="https://lottie.host/a0a69e2c-5eda-4b41-a4c7-2db4b25cfff9/bXKfcsi9v3.lottie"
            loop autoplay
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

HomeView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
};

export default DashHome;
