import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../Componentes/Header";
import Sidebar from "../../Componentes/Sidebar";
import ActividadesSist from "./ActividadesSist";
import "../Ingresos/IngresosSist.css";

function ActividadesGestion() {
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
        <ActividadesSist />
      </main>
    </div>
  );
}

export default ActividadesGestion;