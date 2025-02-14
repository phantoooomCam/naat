import { useState } from 'react';
import { FiUser, FiLogOut } from 'react-icons/fi';
import PropTypes from 'prop-types';
import './Header.css';

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const user = {
    name: 'Juan Pérez',
    email: 'juan@empresa.com',
    role: 'Administrador',
    avatar: 'https://i.pravatar.cc/100'
  };

  return (
    <header className="header">
      <div className="profile-container">
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
              <h3>{user.name}</h3>
              <p className="email">{user.email}</p>
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