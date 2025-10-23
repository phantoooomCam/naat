import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Covid_Numeros = ({ activeView }) => {
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
    numeros: <NumerosView isSidebarCollapsed={isSidebarCollapsed} />,
  };
  return (
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="content-wrapper">
        {views[activeView] || views.numeros}
      </div>
    </div>
  );
};

const NumerosView = ({ isSidebarCollapsed }) => {
    const [processingStatus, setProcessingStatus] = useState(null)
  return (
    <div className={`numeros-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      {processingStatus && (
        <div className={`status-message ${processingStatus}`}>
          <span>{statusMessage}</span>
        </div>
      )}
    <div className="covid-header">
        <div className="header-content">
            <h2>Numeros</h2>
        </div>
    </div>

    </div>
  );
};

Covid_Numeros.propTypes = {
  activeView: PropTypes.string.isRequired,
};

NumerosView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
};

export default Covid_Numeros;
