"use client"
import { useState } from "react"

import Header from "../../../../componentes/Header"
import Sidebar from "../../../../componentes/Sidebar"
import Procesar_Caso from "./Procesar_Caso"
import "./Caso.css"

function Caso() {
  const [activeView, setActiveView] = useState("procesamiento")
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
        <Procesar_Caso activeView={activeView} />
      </main>
    </div>
  )
}

export default Caso
