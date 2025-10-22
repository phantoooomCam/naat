import React from 'react';
import PropTypes from 'prop-types';
import { 
  FiZap, 
  FiRadio, 
  FiAlertTriangle, 
  FiCheckCircle 
} from 'react-icons/fi';
import './IntersectionToggleButton.css';

const IntersectionToggleButton = ({ 
  isIntersectionMode, 
  onToggle, 
  hasIntersections,
  isLoading,
  disabled,
  disabledReason = "Debes aplicar filtros de fecha primero"
}) => {
  return (
    <div className="intersection-toggle-container">
      <button
        className={`intersection-toggle-btn ${isIntersectionMode ? 'active' : ''} ${disabled ? 'btn-disabled' : ''}`}
        onClick={onToggle}
        disabled={isLoading}
        title={
          disabled 
            ? disabledReason
            : isIntersectionMode 
              ? "Volver a mostrar todas las antenas y sectores"
              : "Mostrar solo sectores con coincidencias horarias"
        }
      >
        {disabled && (
          <div className="disabled-overlay">
            <FiAlertTriangle className="disabled-icon" />
            <span className="disabled-text">{disabledReason}</span>
          </div>
        )}
        
        <span className="btn-icon">
          {isIntersectionMode ? <FiRadio /> : <FiZap />}
        </span>
        <span className="btn-text">
          {isIntersectionMode ? 'Antenas y Azimuth' : 'Azimuth Coincidentes'}
        </span>
        {isLoading && (
          <span className="btn-spinner">
            <div className="spinner"></div>
          </span>
        )}
      </button>
      
      {isIntersectionMode && !isLoading && (
        <div className={`intersection-status ${hasIntersections ? 'has-results' : 'no-results'}`}>
          {hasIntersections ? (
            <>
              <FiCheckCircle className="status-icon" />
              <span className="status-text">Mostrando coincidencias detectadas</span>
            </>
          ) : (
            <>
              <FiAlertTriangle className="status-icon" />
              <span className="status-text">No hay azimuths que se usen en la misma hora</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

IntersectionToggleButton.propTypes = {
  isIntersectionMode: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  hasIntersections: PropTypes.bool,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  disabledReason: PropTypes.string,
};

IntersectionToggleButton.defaultProps = {
  hasIntersections: false,
  isLoading: false,
  disabled: false,
  disabledReason: "Debes aplicar filtros de fecha primero",
};

export default IntersectionToggleButton;
