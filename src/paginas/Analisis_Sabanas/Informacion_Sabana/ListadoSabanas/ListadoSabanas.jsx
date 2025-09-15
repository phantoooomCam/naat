"use client";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

//Funcion para ActiveView

const ListadoSabanas = ({ activeView }) => {
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
    listados: <Listado />,
  };

  return (
    <div
      className={`redes-info-wrapper ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <div className="container">{views[activeView] || views.listados}</div>
    </div>
  );
};


const Listado = () =>{
    
}

ListadoSabanas.PropTypes = {
    activeView:PropTypes.string.isRequired,
}

export default ListadoSabanas;