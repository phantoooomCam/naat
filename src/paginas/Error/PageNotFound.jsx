import React from "react";
import { Link, useLocation } from "react-router-dom"; // Importar useLocation
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import NAAT_image from "../../assets/naat.png";
import "../HomeAlt/HomeAlt.css"

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
          <div className="nav-auth">
            <Link to="/registro" className="auth-button">Registrarse</Link>
            <Link to="/" className="auth-button">Iniciar Sesión</Link>
          </div>
        </nav>
      </header>

      {/* Animación */}
      <div className="lottie-container-ntf" style={{ width: '700px', height: '700px', margin: '0 auto' }}>
        <DotLottieReact
          src="https://lottie.host/e4c68d37-5c65-49e0-9c1f-1fa6e9ba0681/YcUfu7v8V2.lottie"
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>



    </div>
  );
}
