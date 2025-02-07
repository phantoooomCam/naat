import React from 'react';
import './SignIn.css';
import { Link } from 'react-router-dom';
import NAAT from '../../assets/naat_name.png';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function SignIn() {
    return (
        <body className="signin-body">
            <div className="signin-container">
                <div className="signin-left">
                    <div className="signin-form-container">
                        <Link to="/">
                            <img src={NAAT} alt="Logo de NA'AT" className="signin-logo" />
                        </Link>
                        <h2 className="signin-h2">Inicio de Sesión</h2>
                        <form className="signin-form" action="#" method="POST">
                            <div className="signin-form-group">
                                <label htmlFor="email" className="signin-label">Correo Electrónico</label>
                                <input type="email" id="email" name="email" placeholder="tucorreo@ejemplo.com" className="signin-input" required />
                            </div>
                            <div className="signin-form-group">
                                <label htmlFor="password" className="signin-label">Contraseña</label>
                                <input type="password" id="password" name="password" placeholder="Password" className="signin-input" required />
                            </div>
                            <button type="submit" className="signin-button">Iniciar Sesión</button>
                        </form>
                    </div>
                </div>

                <div className="signin-right">
                    <div className="signin-decorative-content">
                        <h1 className="signin-h1">Inicia Sesión</h1>
                        <p className="signin-subtitle">¡Bienvenido de nuevo! Todo listo para ti.</p>
                        <DotLottieReact
                            src="https://lottie.host/02867c13-6f60-48eb-9529-c29eb94f2d0b/YffA0B8UhL.lottie"
                            autoplay
                            loop
                            className="signin-lottie-animation"
                        />
                    </div>
                </div>
            </div>
        </body>
    );
}
