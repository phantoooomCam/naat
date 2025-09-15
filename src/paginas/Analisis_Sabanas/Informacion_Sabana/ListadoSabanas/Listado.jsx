import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../../../componentes/Header";
import Sidebar from "../../../../componentes/Sidebar";
import ListadoSabanas from "./ListadoSabanas";

function Listado() {
  const [activeView, setActiveView] = useState("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard-container">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`main-content ${sidebarOpen ? "" : "collapsed"}`}>
        <Header />
        <ListadoSabanas activeView={activeView} />
      </main>
    </div>
  );
}

export default Listado;