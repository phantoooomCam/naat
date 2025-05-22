"use client"
import { useState } from "react"
import Header from "../../../../componentes/Header"
import Sidebar from "../../../../componentes/Sidebar"


import LogsCasosTabla from "./LogsCasosTabla"

function LogsCasos() {
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
                <LogsCasosTabla />

            </main>
        </div>
    )
}
export default LogsCasos;

