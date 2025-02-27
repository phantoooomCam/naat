import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../../paginas/Admin/Componentes/Header"
import SideAdmin from "../SideAdmin";
import Changepasswd from "../../../paginas/Error/ChangePassword"



function Cambiar() {
  const [activeView, setActiveView] = useState("inicio");
  const [sideAdminOpen, setSideAdminOpen] = useState(true);

  return (
    <div className="dashboard-container">
      <SideAdmin
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={sideAdminOpen}
        toggleSideAdmin={() => setSideAdminOpen(!sideAdminOpen)}
      />
      <main className={`main-content ${sideAdminOpen ? "" : "collapsed"}`}>
        <Header />
        <Changepasswd/>
        
      </main>
       

    </div>
  );
}

export default Cambiar;
