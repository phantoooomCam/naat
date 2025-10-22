import React from 'react';
import PropTypes from 'prop-types';
import { 
  FiSearch, 
  FiCheckCircle, 
  FiXCircle, 
  FiCalendar, 
  FiDatabase,
  FiActivity,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';
import './DebugFilterStatus.css';

/**
 * Componente temporal para debugging del estado de filtros
 * Muestra información útil sobre por qué el botón está deshabilitado
 */
const DebugFilterStatus = ({ 
  idSabana, 
  filtrosMapaAplicados, 
  intersectionMode,
  intersectionStats 
}) => {
  const canActivate = !!(idSabana && filtrosMapaAplicados.fromDate && filtrosMapaAplicados.toDate);
  
  return (
    <div className="debug-filter-status">
      <div className="debug-header">
        <FiSearch className="debug-icon" />
        <span className="debug-title">Estado de Filtros (Debug)</span>
      </div>
      
      <div className="debug-content">
        <div className={`debug-item ${idSabana ? 'valid' : 'invalid'}`}>
          <div className="debug-label">
            <FiDatabase className="debug-item-icon" />
            Sábana:
          </div>
          <span className="debug-value">
            {idSabana ? (
              <>
                <FiCheckCircle className="status-icon" />
                {Array.isArray(idSabana) ? idSabana.join(', ') : idSabana}
              </>
            ) : (
              <>
                <FiXCircle className="status-icon" />
                No seleccionada
              </>
            )}
          </span>
        </div>
        
        <div className={`debug-item ${filtrosMapaAplicados.fromDate ? 'valid' : 'invalid'}`}>
          <div className="debug-label">
            <FiCalendar className="debug-item-icon" />
            Fecha Inicio:
          </div>
          <span className="debug-value">
            {filtrosMapaAplicados.fromDate ? (
              <>
                <FiCheckCircle className="status-icon" />
                {new Date(filtrosMapaAplicados.fromDate).toLocaleString('es-MX')}
              </>
            ) : (
              <>
                <FiXCircle className="status-icon" />
                No configurada
              </>
            )}
          </span>
        </div>
        
        <div className={`debug-item ${filtrosMapaAplicados.toDate ? 'valid' : 'invalid'}`}>
          <div className="debug-label">
            <FiCalendar className="debug-item-icon" />
            Fecha Fin:
          </div>
          <span className="debug-value">
            {filtrosMapaAplicados.toDate ? (
              <>
                <FiCheckCircle className="status-icon" />
                {new Date(filtrosMapaAplicados.toDate).toLocaleString('es-MX')}
              </>
            ) : (
              <>
                <FiXCircle className="status-icon" />
                No configurada
              </>
            )}
          </span>
        </div>
        
        <div className={`debug-item ${intersectionMode ? 'active' : ''}`}>
          <div className="debug-label">
            <FiActivity className="debug-item-icon" />
            Modo Intersección:
          </div>
          <span className="debug-value">
            {intersectionMode ? (
              <>
                <FiCheckCircle className="status-icon" />
                ACTIVO
              </>
            ) : (
              <>
                <FiInfo className="status-icon" />
                Inactivo
              </>
            )}
          </span>
        </div>
        
        {intersectionMode && (
          <div className="debug-item stats">
            <div className="debug-label">
              <FiActivity className="debug-item-icon" />
              Estadísticas:
            </div>
            <span className="debug-value">
              Total: {intersectionStats.total} | 
              Coinciden: {intersectionStats.intersecting} | 
              Pares: {intersectionStats.pairsCount}
            </span>
          </div>
        )}
        
        <div className={`debug-item result ${canActivate ? 'can-activate' : 'cannot-activate'}`}>
          <div className="debug-label">
            {canActivate ? (
              <FiCheckCircle className="debug-item-icon" />
            ) : (
              <FiAlertCircle className="debug-item-icon" />
            )}
            Estado del Botón:
          </div>
          <span className="debug-value">
            {canActivate ? 'PUEDE ACTIVARSE' : 'DESHABILITADO'}
          </span>
        </div>
      </div>
      
      {!canActivate && (
        <div className="debug-footer">
          <FiInfo className="debug-hint-icon" />
          <span className="debug-hint">
            {!idSabana ? 'Selecciona una sábana' : 'Aplica filtros de fecha para activar'}
          </span>
        </div>
      )}
    </div>
  );
};

DebugFilterStatus.propTypes = {
  idSabana: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
  filtrosMapaAplicados: PropTypes.shape({
    fromDate: PropTypes.string,
    toDate: PropTypes.string,
  }).isRequired,
  intersectionMode: PropTypes.bool.isRequired,
  intersectionStats: PropTypes.shape({
    total: PropTypes.number,
    intersecting: PropTypes.number,
    pairsCount: PropTypes.number,
  }).isRequired,
};

export default DebugFilterStatus;
