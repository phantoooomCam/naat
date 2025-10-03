"use client";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./redes_sociales.css";
import "../../componentes/RedVinculos.css";

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
      className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <div className="content-wrapper">{views[activeView] || views.redes}</div>
    </div>
  );
};

//Funcion General
import WindowNet from "./WindowNet.jsx";
import RedVinculosPanel from "./RedVinculosPanel.jsx";

const Redes = () => {
  const netRef = useRef(null);
  const [graphData, setGraphData] = useState(null);

  const relaciones_ = {
    comentó: { color: "#15a7e6" },
    seguido: { color: "#FF4E45" },
    seguidor: { color: "#075056" },
    reaccionó: { color: "#e6de0b" },
    default: { color: "#1A2D42" },
  };
  const handleGraphData = (data) => {
    setGraphData(data);
  };

  const relaciones = {
    seguidor: {color: "#2885B0"},
    seguido: {color: "#FF4E45"},
    comentó: {color: "#32B028"},
    reaccionó: {color: "#F538CC"},
    default: {color: "#1A2D42"},
  };
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
          <div className="details-red">
            Tipos de relación:
            <div className="network-legend">
              <div className="legend-item">
                {Object.entries(relaciones_).map(([item, info], index) => (
                  <div className="relacion">
                    <div
                      className="legend-color"
                      style={{ backgroundColor: info.color }}
                    ></div>
                    <div className="relacion-nombre">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
