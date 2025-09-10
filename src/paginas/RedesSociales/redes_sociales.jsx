"use client";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./redes_sociales.css";

//Funcion para ActiveView
const VinculosRedes = ({ activeView }) => {
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
    redes: <Redes />,
  };

  return (
    <div
      className={`redes-info-wrapper ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <div className="container">{views[activeView] || views.redes}</div>
    </div>
  );
};

//Funcion General
import WindowNet from './WindowNet.jsx';
import RedVinculosPanel from './RedVinculosPanel.jsx';

const Redes = () => {
  const netRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const handleGraphData = (data) => { setGraphData(data); };

  return (
    <div className="redes-main-container">
      <div className="redes-title-section">
        <div className="title-content">
          <h2>Vinculos Redes Sociales</h2>
        </div>
      </div>

      <div className="redes-grid-layout">
        <div className="section-left">
          <div className="inputs-wrapper-card">
            <RedVinculosPanel netRef={netRef} onGraphData={handleGraphData} />
          </div>
        </div>

        <div className="section-right">
          <div className="content-display-area">
            <WindowNet ref={netRef} elements={graphData} />
          </div>
        </div>

      </div>
    </div>
  );
};

VinculosRedes.PropTypes = {
  activeView: PropTypes.string.isRequired,
};

export default VinculosRedes;
