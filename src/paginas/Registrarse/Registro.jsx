import React from 'react'
import './Registro.css';
import { Link } from 'react-router-dom';

const Registro = () => {
    const [typedText, setTypedText] = useState('');
    
    useEffect(() => {
      // Efecto de escritura
      const text = "Tu seguridad importa !";
      let index = 0;
      
      const typeEffect = () => {
        if (index < text.length) {
          setTypedText(prev => prev + text[index]);
          index++;
          setTimeout(typeEffect, 50);
        }
      };
      
      typeEffect();
      
      // Efecto binario
      const binaryContainer = document.getElementById('binaryContainer');
      const characters = '01';
      
      const createBinary = () => {
        const element = document.createElement('div');
        element.className = 'registro-binary-line';
        element.style.left = `${Math.random() * 100}%`;
        element.textContent = Array(30).fill(0).map(() => 
          characters.charAt(Math.floor(Math.random() * characters.length))).join(' ');
        
        binaryContainer.appendChild(element);
        
        setTimeout(() => element.remove(), 15000);
      };
      
      const binaryInterval = setInterval(createBinary, 100);
      
      return () => clearInterval(binaryInterval);
    }, []);
  
    return (
      <div className="registro-container">
        <div className="registro-left" style={{background: 'linear-gradient(135deg, #000000, #1a1a1a)'}}>
          <div className="registro-binary-rain" id="binaryContainer"></div>
          <div className="registro-decorative-content">
            <h1 className="registro-h1">Crea tu cuenta</h1>
            <p className="registro-subtitle">{typedText}</p>
          </div>
        </div>
  
        <div className="registro-right">
          <div className="registro-form-container">
            <Link to="/">
              <img src="NAAT_1.png" alt="Logo de NA'AT" className="registro-logo" />
            </Link>
            <h2 className="registro-h2">Registro</h2>
            <form action="#" method="POST" className="registro-form">
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
                <input type="number" id="telefono" name="telefono" placeholder="Tu telefono" className="registro-input" required />
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
    );
  };
  
  export default Registro;
