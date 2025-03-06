import { useState, useEffect } from "react";
import "./PerfilUsuario.css";

const PerfilUsuario = () => {
  // Estado para controlar si sidebar está colapsado
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Estado para almacenar los datos del perfil
  const [perfilData, setPerfilData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correo: "",
    telefono: ""
  });
  
  // Estado para mostrar/ocultar modo edición
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para mensajes de éxito o error
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  
  // Simular carga de datos de usuario desde localStorage (como en tu ejemplo)
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("user")) || {};
    
    // Cargar datos del usuario al estado
    setPerfilData({
      nombre: usuario.nombre || "",
      apellidoPaterno: usuario.apellidoPaterno || "",
      apellidoMaterno: usuario.apellidoMaterno || "",
      correo: usuario.correo || "",
      telefono: usuario.telefono || ""
    });
  }, []);
  
  // Observador para detectar cambios en el sidebar (como en tu ejemplo)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains("closed"));
      }
    });

    observer.observe(document.body, { attributes: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  
  // Handler para actualizar los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfilData({
      ...perfilData,
      [name]: value
    });
  };
  
  // Handler para guardar los cambios
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulación de guardado exitoso (aquí conectarías con tu backend)
    setTimeout(() => {
      // Actualizar localStorage para simular persistencia
      const usuario = JSON.parse(localStorage.getItem("user")) || {};
      localStorage.setItem("user", JSON.stringify({
        ...usuario,
        ...perfilData
      }));
      
      setStatusMessage({
        type: "success",
        message: "Perfil actualizado correctamente"
      });
      
      setIsEditing(false);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setStatusMessage({ type: "", message: "" });
      }, 3000);
    }, 800);
  };
  
  // Handler para cancelar la edición
  const handleCancel = () => {
    // Recargar datos originales
    const usuario = JSON.parse(localStorage.getItem("user")) || {};
    setPerfilData({
      nombre: usuario.nombre || "",
      apellidoPaterno: usuario.apellidoPaterno || "",
      apellidoMaterno: usuario.apellidoMaterno || "",
      correo: usuario.correo || "",
      telefono: usuario.telefono || ""
    });
    
    setIsEditing(false);
  };

  return (
    <div className={`perfil-container ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="perfil-content">
        <div className="perfil-header">
          <h2>Configuración de Perfil</h2>
          <p className="perfil-subtitle">Actualiza tu información personal</p>
        </div>
        
        {statusMessage.message && (
          <div className={`status-message ${statusMessage.type}`}>
            {statusMessage.message}
          </div>
        )}
        
        <div className="perfil-card">
          {!isEditing ? (
            <div className="perfil-view">
              <div className="perfil-avatar">
                {perfilData.nombre ? perfilData.nombre.charAt(0).toUpperCase() : "U"}
              </div>
              
              <div className="perfil-info">
                <h3>{`${perfilData.nombre} ${perfilData.apellidoPaterno} ${perfilData.apellidoMaterno}`}</h3>
                
                <div className="info-row">
                  <div className="info-label">Correo electrónico:</div>
                  <div className="info-value">{perfilData.correo}</div>
                </div>
                
                <div className="info-row">
                  <div className="info-label">Teléfono:</div>
                  <div className="info-value">{perfilData.telefono || "No especificado"}</div>
                </div>
                
                <button 
                  className="btn-edit-perfil"
                  onClick={() => setIsEditing(true)}
                >
                  Editar Perfil
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="perfil-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={perfilData.nombre}
                    onChange={handleChange}
                    placeholder="Ingresa tu nombre"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="apellidoPaterno">Apellido Paterno</label>
                  <input
                    type="text"
                    id="apellidoPaterno"
                    name="apellidoPaterno"
                    value={perfilData.apellidoPaterno}
                    onChange={handleChange}
                    placeholder="Ingresa tu apellido paterno"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="apellidoMaterno">Apellido Materno</label>
                  <input
                    type="text"
                    id="apellidoMaterno"
                    name="apellidoMaterno"
                    value={perfilData.apellidoMaterno}
                    onChange={handleChange}
                    placeholder="Ingresa tu apellido materno"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="correo">Correo Electrónico</label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={perfilData.correo}
                    onChange={handleChange}
                    placeholder="Ingresa tu correo electrónico"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={perfilData.telefono}
                    onChange={handleChange}
                    placeholder="Ingresa tu número telefónico"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel-perfil"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save-perfil">
                  Guardar Cambios
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilUsuario;