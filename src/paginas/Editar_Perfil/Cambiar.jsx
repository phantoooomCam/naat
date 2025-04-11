import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../componentes/Header"
import SideAdmin from "./SideAdmin";
import Changepasswd from "../Princiales_NoProtegidas/ChangePassword"
import fetchWithAuth from "../../utils/fetchWithAuth";




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
