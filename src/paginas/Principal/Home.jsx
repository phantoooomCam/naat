import React from 'react';
import { Link } from 'react-router-dom';
import "./styles.css";
import NAAT_image from '../../assets/naat.jpg';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Home() {
  return (
    <>
      <header className='header-home'>
        <nav className="navbar-home">
          <div className="logo-home">
            <a href="index.html">

              <img src={NAAT_image} alt="Logo" className="logo-img-home" />
            </a>
          </div>
          <ul className='listas-home'>
            <li><a href="index.html" className='a-home'>Inicio</a></li>
            <li><a href="services.html" className='a-home'cl>Servicios</a></li>
            <li><a href="contact.html"className='a-home'>Contacto</a></li>
          </ul>
          <div className="auth-buttons-home">
            <a href="registro.html" className="btn-home">Registrarse</a>
            <a href="signin.html" className="btn-home">Iniciar Sesión</a>
          </div>
          
        </nav>
      </header>

      <section className="main-content-home">
        <div className="left-side-home">
        <h2 className='h2-home'>¡Tu seguridad importa!</h2>
          

          {/* Aquí añades la animación Lottie */}
          <DotLottieReact
            src="https://lottie.host/c37c2d86-b787-4fb4-8c32-c68ce369cd71/FhkPOM1Yo6.lottie"
            loop
            autoplay
            style={{ width: '700px', height: '700px' }} // Ajusta el tamaño aquí
          />
          

        </div>

        <div className="right-side-home">
          <h3 className='h3-home'>Ingresa a NA AT</h3>
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
