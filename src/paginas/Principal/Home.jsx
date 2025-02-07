import React from 'react';
import { Link } from 'react-router-dom';
import "./styles.css";
import NAAT_image from '../../assets/naat.jpg';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';


export default function  Home () {
  return (
    <>
     <header className='header-home'>
        <nav className="navbar-home">
          <div className="logo-home">
            <a href="index.html">
              <img src={NAAT_image} alt="Logo" className="logo-img-home" />
            </a>
          </div>
          <div className="auth-buttons-home">
            <a href="registro.html" className="btn-home">Registarse</a>
            <a href="signin.html" className="btn-home">Iniciar Sesion</a>
          </div>
        </nav>
      </header>

      <section className="main-content-home">
        <div className="left-side-home">
          <h2 className='h2-home'>Tu seguridad importa !</h2>
          <DotLottieReact
      src="https://lottie.host/a0d2fd2c-9910-409f-a8f8-fd171ebdd4a9/ECxElXWjoZ.json"
      loop
      autoplay
      className="large-animation-home"
    />
          <div className="info-buttons-home">
            <a href="signup.html" className="btn-contact-home">
              Servicios <i className="bi bi-arrow-right-circle-home"></i>
            </a>
            <a href="signin.html" className="btn-contact-home">
              Contacto <i className="bi bi-arrow-right-circle-home"></i>
            </a>
          </div>
        </div>
        <div className="right-side-home">
          <h3 className='h3-home'>Ingresa a NA AT</h3>
          <form action="#" method="POST" className='form-home'>
            <input
              type="email"
              className='input-home'
              id="email"
              name="email"
              placeholder="Ingresa tu correo"
              required
            />
            <input
              type="password"
              className='input-home'
              id="password"
              name="password"
              placeholder="Ingresa tu contraseña"
              required
            />
            <button type="submit" className="btnr-home">
              Iniciar Sesion
            </button>
          </form>
        </div>
      </section>
        
      
    </>
  );
}


