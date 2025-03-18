import React from "react";
import {useState} from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../Admin/Componentes/Header";
import Sidebar from "../../Admin/Componentes/Sidebar";
import DashHome_Depto from "./DashHome_Depto";
import "../../Admin/Usuarios/Gestion/Gestion.css"

function Home_Depto() {
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
          <DashHome_Depto activeView={activeView} />
        </main>
      </div>
    );
  }
  
  export default Home_Depto;
  