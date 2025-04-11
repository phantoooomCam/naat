import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../../../componentes/Header"
import Sidebar from "../../../../componentes/Sidebar";
import DashArea from "./Dash_Area";
import fetchWithAuth from "../../../../utils/fetchWithAuth";




function Gestion_Area() {
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
        <DashArea/>
      </main>
       

    </div>
  );
}

export default Gestion_Area;
