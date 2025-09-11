"use client"

import { useState } from "react"
import { useParams } from "react-router-dom"
import Header from "../../../../componentes/Header"
import Sidebar from "../../../../componentes/Sidebar"
import DetalleCompleto from "./DetalleCompleto"
import "./DetalleCaso.css"

function DetalleCaso() {
  const [activeView, setActiveView] = useState("detalle")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { id } = useParams() // Obtener el ID del caso desde la URL

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
        <DetalleCompleto casoId={id} sidebarOpen={sidebarOpen} />
      </main>
    </div>
  )
}

export default DetalleCaso
