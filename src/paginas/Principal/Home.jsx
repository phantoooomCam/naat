import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaGoogle } from "react-icons/fa";
import "./styles.css";
import NAAT_image from "../../assets/naat.jpg";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { signInWithGoogle } from "../../firebase-config";

export default function Home() {
  const [user, setUser] = useState(null);

  const handleGoogleSignIn = async () => {
    const userData = await signInWithGoogle();
    if (userData) {
      setUser(userData);
    }
  };

  return (
    <>
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
                className={location.pathname === "/" ? "active" : ""}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to="/login"
                className={location.pathname === "/login" ? "active" : ""}
              >
                Servicios
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className={location.pathname === "/contact" ? "active" : ""}
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

      <section className="main-content-home">
        <div className="left-side-home">
          <h2 className="h2-home">¡Tu seguridad importa!</h2>

          <div className="lottie-container">
            <DotLottieReact
              src="https://lottie.host/c37c2d86-b787-4fb4-8c32-c68ce369cd71/FhkPOM1Yo6.lottie"
              loop
              autoplay
              style={{ width: "700px", height: "700px" }}
            />
          </div>
        </div>

        <div className="right-side-home">
          {user ? (
            <div className="user-info">
              <h3 className="h3-home">Bienvenido, {user.name}</h3>
              <img
                src={user.photo}
                alt="Foto de perfil"
                className="user-photo"
              />
              <p>{user.email}</p>
            </div>
          ) : (
            <>
              <h3 className="h3-home">Ingresa a NA'AT</h3>
              <form action="#" method="POST" className="form-home">
                <div className="input-container">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    className="input-home"
                    id="email"
                    name="email"
                    placeholder="Ingresa tu correo"
                    required
                  />
                </div>

                <div className="input-container">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    className="input-home"
                    id="password"
                    name="password"
                    placeholder="Ingresa tu contraseña"
                    required
                  />
                </div>

                <button type="submit" className="btnr-home">
                  Iniciar Sesión
                </button>

                <button
                  type="button"
                  className="btn-google"
                  onClick={handleGoogleSignIn}
                >
                  <FaGoogle className="google-icon" /> Iniciar Sesión con Google
                </button>
              </form>
            </>
          )}
        </div>
      </section>

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
    </>
  );
}
