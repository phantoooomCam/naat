import { useState, useEffect, useRef } from 'react';
import { FiUser, FiLogOut } from 'react-icons/fi';
import PropTypes from 'prop-types';
import './Header.css';

const Header = () => {
  const usuario = JSON.parse(localStorage.getItem("user"));
  const nombre = usuario?.nombre|| "Usuario"; // Si no hay usuario, se muestra "Usuario"
  const apellido =usuario?.apellidoPaterno || "Apellido";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const user = {
    name: 'Juan Pérez',
    email: 'juan@empresa.com',
    role: 'Administrador',
    avatar: 'https://i.pravatar.cc/100'
  };

  // Cerrar el menú si el usuario hace clic fuera del perfil
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="header">
      <div className="profile-container" ref={profileRef}>
        <button 
          className="profile-btn"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <img 
            src={user.avatar} 
            alt="Perfil" 
            className="avatar"
          />
        </button>

        {isProfileOpen && (
          <div className="profile-card">
            <div className="user-info">
              <img 
                src={user.avatar} 
                alt="Perfil" 
                className="avatar-lg"
              />
              <h3>{nombre + " " + apellido}</h3>
              <p className="role">{user.role}</p>
            </div>
            
            <button className="logout-btn">
              <FiLogOut className="icon" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
