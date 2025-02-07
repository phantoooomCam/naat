import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import "./styles.css";
import NAAT_image from '../../assets/naat.jpg';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Home() {
  const fullText = "¡Tu seguridad importa!";
  const [displayText, setDisplayText] = useState(""); 

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(prev => fullText.slice(0, index + 1)); // Usamos slice para evitar "undefined"
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100); 

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className='header-home'>
        <nav className="navbar-home">
          <div className="logo-home">
            <Link to="/">
              <img src={NAAT_image} alt="Logo" className="logo-img-home" />
            </Link>
          </div>
          <ul className='listas-home'>
            <li><Link to="/" className={location.pathname === "/" ? "active" : ""}>Inicio</Link></li>
            <li><Link to="/login" className={location.pathname === "/login" ? "active" : ""}>Servicios</Link></li>
            <li><Link to="/contact" className={location.pathname === "/contact" ? "active" : ""}>Contacto</Link></li>
          </ul>
          <div className="auth-buttons-home">
            <Link to="/login" className="btn-home">Registrarse</Link>
            <Link to="/signin" className="btn-home">Iniciar Sesión</Link>
          </div>
        </nav>
      </header>

      <section className="main-content-home">
        <div className="left-side-home">
          {/* Texto con efecto de escritura */}
          <h2 className='h2-home'>{displayText}</h2>
          
          {/* Animación Lottie */}
          <DotLottieReact
            src="https://lottie.host/c37c2d86-b787-4fb4-8c32-c68ce369cd71/FhkPOM1Yo6.lottie"
            loop
            autoplay
            style={{ width: '700px', height: '700px' }} 
          />
        </div>

        <div className="right-side-home">
          <h3 className='h3-home'>Ingresa a NA´AT</h3>
          <form action="#" method="POST" className='form-home'>
            <input type="email" className='input-home' id="email" name="email" placeholder="Ingresa tu correo" required />
            <input type="password" className='input-home' id="password" name="password" placeholder="Ingresa tu contraseña" required />
            <button type="submit" className="btnr-home">Iniciar Sesión</button>
          </form>
        </div>
      </section>
    </>
  );
}
