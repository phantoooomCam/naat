import React from "react";
import { Link, useLocation } from "react-router-dom"; // Importar useLocation
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import NAAT_image from "../../assets/naat.jpg";
import "../Principal/styles.css"; // Importar estilos

export default function PageNotFound() {
  const location = useLocation(); // Usar useLocation para obtener la ruta actual

  return (
    <div>
      {/* Header */}
      <header className="header-home">
        <nav className="navbar-home">
          <div className="logo-home">
            <Link to="/">
              <img src={NAAT_image} alt="Logo" className="logo-img-home" />
            </Link>
          </div>
          <ul className="listas-home">
            <li>
              <Link
                to="/"
                className={location.pathname === "/" ? "active" : ""} // Comprobar la ruta actual
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to="/servicios"
                className={location.pathname === "/servicios" ? "active" : ""} // Comprobar la ruta actual
              >
                Servicios
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={location.pathname === "/contact" ? "active" : ""} // Comprobar la ruta actual
              >
                Contacto
              </Link>
            </li>
          </ul>
          <div className="auth-buttons-home">
            <Link to="/login" className="btn-home">
              Registrarse
            </Link>
            <Link to="/signin" className="btn-home">
              Iniciar Sesión
            </Link>
          </div>
        </nav>
      </header>
      
      <div className="lottie-container-ntf">
        <DotLottieReact
          src="https://lottie.host/e4c68d37-5c65-49e0-9c1f-1fa6e9ba0681/YcUfu7v8V2.lottie"
          loop
          autoplay
          style={{ width: "700px", height: "700px" }}
        />
      </div>

      {/* Footer */}
      <footer className="footer-home">
        <div className="footer-content">
          <p className="p-home">© 2025 NA'AT. Todos los derechos reservados.</p>
          <ul className="footer-links">
            <li>
              <Link to="/privacy">Política de Privacidad</Link>
            </li>
            <li>
              <Link to="/terms">Términos y Condiciones</Link>
            </li>
            <li>
              <Link to="/contact">Contacto</Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
