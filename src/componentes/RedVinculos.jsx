"use client";

import PropTypes from "prop-types";

const RedVinculos = ({ idSabana, filtrosActivos, primaryNumbers = [] }) => {
    // Componente intencionalmente vacío - punto de partida para reescribir desde 0
    return <div className="red-vinculos-container" />;
};

RedVinculos.propTypes = {
    idSabana: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(
            PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        ),
    ]).isRequired,
    primaryNumbers: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ),
};

export default RedVinculos;
