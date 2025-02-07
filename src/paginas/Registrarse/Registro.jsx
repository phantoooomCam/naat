import React, { useState, useEffect, useRef } from 'react';
import './Registro.css';
import { Link } from 'react-router-dom';
import NAAT_1 from '../../assets/naat.jpg';

export default function Registro() {
    const [typedText, setTypedText] = useState('');
    const binaryContainerRef = useRef(null);

    useEffect(() => {
        const text = "Tu seguridad importa !";
        let index = 0;

        const typeEffect = () => {
            setTypedText((prev) => prev + text.charAt(index));
            index++;
            if (index < text.length) {
                setTimeout(typeEffect, 50);
            }
        };

        typeEffect();

        // Efecto binario
        const createBinary = () => {
            if (!binaryContainerRef.current) return;
            const element = document.createElement('div');
            element.className = 'binary-line';
            element.style.left = `${Math.random() * 100}%`;
            element.textContent = Array(30).fill(0).map(() => "01".charAt(Math.floor(Math.random() * 2))).join(' ');

            binaryContainerRef.current.appendChild(element);
            setTimeout(() => element.remove(), 15000);
        };

        const binaryInterval = setInterval(createBinary, 100);
        return () => clearInterval(binaryInterval);
    }, []);

    return (
        <div className="container">
            <div className="left" style={{ background: 'linear-gradient(135deg, #000000, #1a1a1a)' }}>
                <div className="binary-rain" ref={binaryContainerRef}></div>
                <div className="decorative-content">
                    <h1 className="h1">Crea tu cuenta</h1>
                    <p className="subtitle">{typedText}</p>
                </div>
            </div>
            <div className="right">
                <div className="form-container">
                    <Link to="/">
                        <img src={NAAT_1} alt="Logo de NA'AT" className="logo" />
                    </Link>
                    <h2 className="h2">Registro</h2>
                    <form className="form" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-group">
                            <label htmlFor="nombre" className="label">Nombre(s)</label>
                            <input type="text" id="nombre" name="nombre" placeholder="Tu nombre" className="input" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="apellidos" className="label">Apellidos</label>
                            <input type="text" id="apellidos" name="apellidos" placeholder="Tus Apellidos" className="input" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="telefono" className="label">Teléfono</label>
                            <input type="number" id="telefono" name="telefono" placeholder="Tu telefono" className="input" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email" className="label">Correo Electrónico</label>
                            <input type="email" id="email" name="email" placeholder="tucorreo@ejemplo.com" className="input" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password" className="label">Contraseña</label>
                            <input type="password" id="password" name="password" placeholder="Password" className="input" required />
                        </div>
                        <button type="submit" className="button">Registrarse</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
