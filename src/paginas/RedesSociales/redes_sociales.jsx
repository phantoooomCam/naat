"use client";
import { useState, useEffect } from "react";
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
const Redes = () => {
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
            <div className="redes-header">
              <h4>
                Red de Vinculos
              </h4>
            </div>

          </div>
        </div>

        <div className="section-right">
          <div className="content-display-area">


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
