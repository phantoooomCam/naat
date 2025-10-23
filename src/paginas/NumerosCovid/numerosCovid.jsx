import React from "react";
import { useState } from "react";

import Header from "../../componentes/Header";
import Sidebar from "../../componentes/Sidebar";
import "../../paginas/SuperAdmin_Funciones/Usuarios/Gestion/Gestion.css"
import Covid_Numeros from "./componentecovid";



function NumerosCovid(){
    const[activeView,setActiveView] = useState("inicio");
    const[sidebarOpen,setSidebarOpen] = useState(true);

    return(
        <div className="dashboard-container">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                isOpen={sidebarOpen}
                toggleSidebar={()=>setSidebarOpen(!sidebarOpen)}
            />
            <main className={`main-content ${sidebarOpen ? "" : "collapsed"}`}>

                <Header/>
                <Covid_Numeros activeView={activeView}/>
            </main>

        </div>
    )
}

export default NumerosCovid;