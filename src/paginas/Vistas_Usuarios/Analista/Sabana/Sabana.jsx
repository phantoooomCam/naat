import React from "react";
import {useState} from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "../../../../componentes/Header";
import Sidebar from "../../../../componentes/Sidebar";
// import Dash_Analista from "./Dash_Analista";
import Procesar_Sabana from "./Procesar_Sabana";
import "../../../../paginas/SuperAdmin_Funciones/Usuarios/Gestion/Gestion.css";

function Sabana() {
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
          <Procesar_Sabana activeView={activeView} />
        </main>
      </div>
    );
  }

  export default Sabana;
