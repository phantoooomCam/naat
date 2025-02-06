import React from "react";
import '../assets/styles/registro.css';
import naatImage from '../assets/image/naat.jpg';

const Registro = () => {
  const typeRef = useRef(null);

  useEffect(() => {
    const textElement = typeRef.current;
    const text = "Tu seguridad importa !";
    let index = 0;

    function typeEffect() {
      if (index < text.length) {
        textElement.textContent += text[index];
        index++;
        setTimeout(typeEffect, 50);
      }
    }

    if (textElement) {
      textElement.textContent = "";
      typeEffect();
    }
  }, []);

  return (
    <div className="container">
      <div
        className="left"
        style={{ background: 'linear-gradient(135deg, #000000, #1a1a1a)' }}
      >
        {/* Contenedor para el efecto binary-rain (si tienes lógica adicional, se puede integrar en otro useEffect) */}
        <div className="binary-rain" id="binaryContainer"></div>
        <div className="decorative-content">
          <h1>Crea tu cuenta</h1>
          <p>Únete a nuestra comunidad tecnológica.</p>
          {/* Nuevo contenedor para el efecto type effect */}
          <div className="left-side">
            <h2 ref={typeRef}></h2>
          </div>
        </div>
      </div>

      <div className="right">
        <div className="form-container">
          <a href="index.html">
            <img src={naatImage}alt="Logo de NA'AT" />
          </a>
          <h2>Registro</h2>
          <form action="#" method="POST">
            <div className="form-group">
              <label htmlFor="nombre">Nombre(s)</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="apellidos">Apellidos</label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                placeholder="Tus Apellidos"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="number"
                id="telefono"
                name="telefono"
                placeholder="Tu telefono"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="tucorreo@ejemplo.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                required
              />
            </div>
            <button type="submit">Registrarse</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registro;
