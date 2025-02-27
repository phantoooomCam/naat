import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../Componentes/Header"
import Sidebar from "../../Componentes/Sidebar";
import DashOrga from "./DashOrga";
import './Orga.css'



function Gestion_Orga() {
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
        <DashOrga/>
      </main>
       

    </div>
  );
}

export default Gestion_Orga;
