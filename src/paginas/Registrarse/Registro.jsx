import React from 'react';
import './Registro.css';
import { Link } from 'react-router-dom';
import NAAT_1 from '../../assets/naat.jpg';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Registro() {
    return (
        <body className="registro-body">
            <div className="registro-container">
                <div className="registro-left">
                    <div className="registro-decorative-content">
                        <h1 className="registro-h1">Crea tu cuenta</h1>
                        <p className="registro-subtitle">Únete a nuestra comunidad tecnológica.</p>
                        <DotLottieReact
                            src="https://lottie.host/02867c13-6f60-48eb-9529-c29eb94f2d0b/YffA0B8UhL.lottie"
                            loop
                            autoplay
                            className="registro-lottie-animation"
                        />
                    </div>
                </div>

                <div className="registro-right">
                    <div className="registro-form-container">
                        <Link to="/">
                            <img src={NAAT_1} alt="Logo de NA'AT" className="registro-logo" />
                        </Link>
                        <h2 className="registro-h2">Registro</h2>
                        <form className="registro-form" action="#" method="POST">
                            <div className="registro-form-group">
                                <label htmlFor="nombre" className="registro-label">Nombre(s)</label>
                                <input type="text" id="nombre" name="nombre" placeholder="Tu nombre" className="registro-input" required />
                            </div>
                            <div className="registro-form-group">
                                <label htmlFor="apellidos" className="registro-label">Apellidos</label>
                                <input type="text" id="apellidos" name="apellidos" placeholder="Tus Apellidos" className="registro-input" required />
                            </div>
                            <div className="registro-form-group">
                                <label htmlFor="telefono" className="registro-label">Teléfono</label>
                                <input type="tel" id="telefono" name="telefono" placeholder="Tu teléfono" className="registro-input" required />
                            </div>
                            <div className="registro-form-group">
                                <label htmlFor="email" className="registro-label">Correo Electrónico</label>
                                <input type="email" id="email" name="email" placeholder="tucorreo@ejemplo.com" className="registro-input" required />
                            </div>
                            <div className="registro-form-group">
                                <label htmlFor="password" className="registro-label">Contraseña</label>
                                <input type="password" id="password" name="password" placeholder="Password" className="registro-input" required />
                            </div>
                            <button type="submit" className="registro-button">Registrarse</button>
                        </form>
                    </div>
                </div>
            </div>
        </body>
    );
}
