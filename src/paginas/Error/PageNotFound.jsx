import React from "react";
import { Link, useLocation } from "react-router-dom";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import NAAT_image from "../../assets/naat.png";
import "../HomeAlt/HomeAlt.css";

export default function PageNotFound() {
  const location = useLocation();
  
  return (
    <div className="homealt-wrapper">
      <header className="homealt-header">
        <nav className="homealt-nav">
          <div className="nav-left">
            <div className="nav-logo">
              <Link to="/">
                <img src={NAAT_image} alt="Logo" className="logo-img-home" />
              </Link>
            </div>
          </div>
        </nav>
      </header>
      
      <main className="homealt-main">
        <div className="error-container" style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          maxWidth: '900px', 
          margin: '0 auto' 
        }}>
          <h1 style={{ 
            fontSize: '5rem', 
            margin: '0', 
            color: '#222a35', 
            fontWeight: '700'
          }}>404</h1>
          
          <h2 style={{ 
            fontSize: '2rem', 
            color: '#222a35', 
            marginTop: '1rem',
            marginBottom: '2rem' 
          }}>Página no encontrada</h2>
          
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#666', 
            marginBottom: '2rem', 
            maxWidth: '600px', 
            margin: '0 auto 2rem' 
          }}>
            Lo sentimos, la página que estás buscando no existe o ha sido movida a otra ubicación.
          </p>
          
          {/* Animación */}
          {/* <div className="lottie-container-ntf" style={{ 
            width: '500px', 
            height: '500px', 
            margin: '0 auto 2rem' 
          }}>
            <DotLottieReact
              src="https://lottie.host/e4c68d37-5c65-49e0-9c1f-1fa6e9ba0681/YcUfu7v8V2.lottie"
              loop
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </div> */}
          
          <div style={{ marginTop: '2rem' }}>
            <Link to="/" style={{ 
              backgroundColor: '#222a35', 
              color: 'white', 
              padding: '1rem 2rem', 
              borderRadius: '25px', 
              textDecoration: 'none',
              fontWeight: '500',
              display: 'inline-block',
              transition: 'background 0.3s ease'
            }}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      
    </div>
  );
}