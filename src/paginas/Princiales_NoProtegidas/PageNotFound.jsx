"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import NAAT_image from "../../assets/naat.png"
import "./HomeAlt.css"

export default function PageNotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const numbersRef = useRef(null)
  const cardRef = useRef(null)

  // Handle mouse movement for parallax effect - reduced sensitivity
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // Calculate mouse position as percentage of window - reduced sensitivity by dividing by 3
    const x = (clientX / windowWidth - 0.5) / 6
    const y = (clientY / windowHeight - 0.5) / 6

    setMousePosition({ x, y })
  }

  // Animation sequence on load
  useEffect(() => {
    setIsLoaded(true)

    // Create the glitch effect for the 404 numbers
    const glitchEffect = () => {
      if (!numbersRef.current) return

      const numbers = numbersRef.current
      numbers.classList.add("glitch-active")

      setTimeout(() => {
        numbers.classList.remove("glitch-active")
      }, 200)
    }

    // Run the glitch effect periodically
    const glitchInterval = setInterval(() => {
      const shouldGlitch = Math.random() > 0.8
      if (shouldGlitch) glitchEffect()
    }, 4000)

    return () => clearInterval(glitchInterval)
  }, [])

  return (
    <div className="error-page-wrapper" onMouseMove={handleMouseMove}>
      <div className="error-nav">
        <Link to="/" className="error-logo">
          <img src={NAAT_image || "/placeholder.svg"} alt="Logo" />
        </Link>
      </div>

      <div className={`error-content ${isLoaded ? "loaded" : ""}`}>
        <div
          className="error-background"
          style={{
            transform: `translate(${mousePosition.x * -8}px, ${mousePosition.y * -8}px)`,
          }}
        >
          <div className="bg-circle circle-1"></div>
          <div className="bg-circle circle-2"></div>
          <div className="bg-circle circle-3"></div>
        </div>

        <div
          className={`error-card ${isHovering ? "hovering" : ""}`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          ref={cardRef}
        >
          <div
            className="error-visual"
            style={{
              transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
            }}
          >
            <div className="error-numbers" ref={numbersRef}>
              <span className="number">4</span>
              <div className="number-middle">
                <div className="orbit">
                  <div className="planet"></div>
                  <div className="satellite"></div>
                </div>
              </div>
              <span className="number">4</span>
            </div>
          </div>

          <div className="error-message">
            <h2>Página no encontrada</h2>
            <p>La página que estás buscando parece haberse perdido en el espacio digital.</p>
            <Link to="/" className="back-button">
              <span className="button-text">Volver al inicio</span>
              <span className="button-icon"></span>
            </Link>
          </div>
        </div>

        <div className="error-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 15}s`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}

