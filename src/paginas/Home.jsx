import React from "react";
import '../../assets/styles/styles.css';

export default function Home(){
    return(
        <>
            <header>
                <nav className="navbar">
                    <div className="logo">
                        <a href="index.html">
                         <img src="NAAT_1.png" alt="Logo" className="logo-img" />
                        </a>
                    </div>
                    <div className="auth-buttons">
                        <a href="registro.html" className="btn">Registarse</a>
                        <a href="signin.html" className="btn">Iniciar Sesión</a>
                    </div>
                </nav>
            </header>
            <section className="main-content">
                <div className="left-side">
                    <h2>Tu seguridad importa !</h2>
                    <dotlottie-player
                    className="large-animation"
                    src="https://lottie.host/d32d6cbc-6fb7-4b95-b6b0-2b73094aaaaf/UFFyKjmhs0.lottie"
                    background="transparent"
                    speed="1"
                    loop
                    autoPlay
                    ></dotlottie-player>
                    <div className="info-buttons">
                    <a href="signup.html" className="btn btn-contact">
                        Servicios <i className="bi bi-arrow-right-circle"></i>
                    </a>
                    <a href="signin.html" className="btn btn-contact">
                        Contacto <i className="bi bi-arrow-right-circle"></i>
                    </a>
                    </div>
                </div>
                <div className="right-side">
                    <h3>Ingresa a NA AT</h3>
                    <form action="#" method="POST">
                    <input type="email" id="email" name="email" placeholder="Ingresa tu correo" required />
                    <input type="password" id="password" name="password" placeholder="Ingresa tu contraseña" required />
                    <button type="submit" className="btn">Iniciar Sesión</button>
                    </form>
                </div>
            </section>
        </>
    )
}