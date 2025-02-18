import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../Dashboard/Header";
import Sidebar from "../Dashboard/Sidebar";
import GestionDash from "./DashGestion";
import "./Gestion.css";

function Gestion() {
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
        <GestionDash/> 
      </main>

       

    </div>
  );
}

export default Gestion;
