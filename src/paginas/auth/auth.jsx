import React, { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import NAAT from '../../assets/naat_name.png';
import "./auth.css";
import { FaUser, FaEnvelope, FaLock, FaPhone } from "react-icons/fa";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false);

  // Variants para animaciones reutilizables
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: { duration: 0.6, ease: "easeInOut" } },
  };

  const slideVariants = {
    hidden: (direction) => ({
      x: direction === "left" ? -600 : 600,
      opacity: 0,
    }),
    visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeInOut" } },
    exit: (direction) => ({
      x: direction === "left" ? -600 : 600,
      opacity: 0,
      transition: { duration: 0.5, ease: "easeInOut" },
    }),
  };

  return (
    <div className="registro-body">
      <motion.div
        className="registro-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Vista de Registro */}
        {!isLogin && (
          <>
            {/* Lado izquierdo - Lottie */}
            <motion.div
              className="registro-left"
              custom="left"
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              willChange="transform, opacity"
            >
              <div className="registro-decorative-content">
                <h1 className="registro-h1">Crea tu cuenta</h1>
                <p className="registro-subtitle">
                  Únete a nuestra comunidad tecnológica.
                </p>
                <DotLottieReact
                  src="https://lottie.host/02867c13-6f60-48eb-9529-c29eb94f2d0b/YffA0B8UhL.lottie"
                  loop
                  autoplay
                  className="registro-lottie-animation"
                />
                <button
                  className="registro-btn-iniciar"
                  onClick={() => setIsLogin(true)}
                >
                  Iniciar sesión
                </button>
              </div>
            </motion.div>

            {/* Lado derecho - Formulario de registro */}
            <motion.div
              className="registro-right"
              custom="right"
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              willChange="transform, opacity"
            >
              <div className="registro-form-container">
                {/* Imagen agregada arriba del formulario */}
                <Link to="/">
                <img src={NAAT} alt="NAAT Logo" className="registro-logo" />
                </Link>

                <h2 className="registro-h2">Registro</h2>
                <form>
                  <div className="registro-form-group">
                    <FaUser className="registro-icon" />
                    <input type="text" placeholder="Tu nombre" required />
                  </div>
                  <div className="registro-form-group">
                    <FaUser className="registro-icon" />
                    <input type="text" placeholder="Tus Apellidos" required />
                  </div>
                  <div className="registro-form-group">
                    <FaPhone className="registro-icon" />
                    <input type="tel" placeholder="Tu teléfono" required />
                  </div>
                  <div className="registro-form-group">
                    <FaEnvelope className="registro-icon" />
                    <input type="email" placeholder="tucorreo@ejemplo.com" required />
                  </div>
                  <div className="registro-form-group">
                    <FaLock className="registro-icon" />
                    <input type="password" placeholder="Password" required />
                  </div>
                  <button type="submit" className="registro-button">
                    Registrarse
                  </button>
                </form>
              </div>
            </motion.div>

          </>
        )}

        {/* Vista de Inicio de Sesión */}
        {isLogin && (
          <>
            {/* Lado izquierdo - Formulario de inicio de sesión */}
            <motion.div
              className="login-left"
              custom="left"
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              willChange="transform, opacity"
            >
              <div className="registro-form-container">
                {/* Imagen agregada arriba del formulario */}
                <Link to="/">
                <img src={NAAT} alt="NAAT Logo" className="registro-logo" />
                </Link>

                <h2 className="registro-h2">Inicio de Sesión</h2>
                <form>
                  <div className="registro-form-group">
                    <FaEnvelope className="registro-icon" />
                    <input type="email" placeholder="tucorreo@ejemplo.com" required />
                  </div>
                  <div className="registro-form-group">
                    <FaLock className="registro-icon" />
                    <input type="password" placeholder="Password" required />
                  </div>
                  <button type="submit" className="registro-button">
                    Iniciar Sesión
                  </button>
                </form>
              </div>
            </motion.div>


            {/* Lado derecho - Lottie */}
            <motion.div
              className="login-right"
              custom="right"
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              willChange="transform, opacity"
            >
              <div className="registro-decorative-content">
                <h1 className="registro-h1">Bienvenido de nuevo</h1>
                <p className="registro-subtitle">Inicia sesión para continuar.</p>
                <DotLottieReact
                  src="https://lottie.host/02867c13-6f60-48eb-9529-c29eb94f2d0b/YffA0B8UhL.lottie"
                  loop
                  autoplay
                  className="registro-lottie-animation"
                />
                <button
                  className="registro-btn-iniciar"
                  onClick={() => setIsLogin(false)}
                >
                  Registrarse
                </button>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
