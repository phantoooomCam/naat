import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faFile, faTrash, faEye } from "@fortawesome/free-solid-svg-icons";
import "./Sabana.css";

const Procesar_Sabana = () => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const processFiles = (newFiles) => {
    const processedFiles = newFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date().toLocaleDateString()
    }));
    
    setFiles(prevFiles => [...prevFiles, ...processedFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleFileDelete = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };

  const [filters, setFilters] = useState({
    fileTypes: [],
    fileSizes: []
  });

  const handleFilterChange = (type, value) => {
    setFilters(prev => {
      const currentFilter = prev[type];
      const newFilter = currentFilter.includes(value)
        ? currentFilter.filter(f => f !== value)
        : [...currentFilter, value];
      return { ...prev, [type]: newFilter };
    });
  };

  const filteredFiles = files.filter(file => {
    const typeMatch = filters.fileTypes.length === 0 || 
      filters.fileTypes.some(type => file.type.includes(type));
    
    const sizeMatch = filters.fileSizes.length === 0 || 
      filters.fileSizes.some(size => {
        const fileSize = file.size / 1024; // KB
        switch(size) {
          case 'small': return fileSize < 1000;
          case 'medium': return fileSize >= 1000 && fileSize < 10000;
          case 'large': return fileSize >= 10000;
          default: return true;
        }
      });
    
    return typeMatch && sizeMatch;
  });

  return (
    <div className="sabana-container">
      <div className="sabana-header">
        <h2>Procesamiento de Sábana</h2>
        <p>Gestiona y procesa tus archivos de manera eficiente</p>
      </div>

      <div className="sabana-content">
        {/* Upload Card */}
        <div 
          className={`upload-card ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            multiple 
            ref={inputRef}
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <div className="upload-content">
            <FontAwesomeIcon icon={faUpload} className="upload-icon" />
            <p>Arrastra y suelta archivos aquí o</p>
            <button 
              onClick={() => inputRef.current.click()}
              className="upload-button"
            >
              Selecciona Archivos
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content-area">
          {/* Files List Card */}
          <div className="files-card">
            <div className="card-header">
              <h3>Archivos Subidos</h3>
            </div>
            <div className="files-list">
              {filteredFiles.map(file => (
                <div 
                  key={file.id} 
                  className="file-item"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="file-info">
                    <FontAwesomeIcon icon={faFile} />
                    <span>{file.name}</span>
                  </div>
                  <div className="file-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileDelete(file.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters Card */}
          <div className="filters-card">
            <div className="card-header">
              <h3>Filtrar Archivos</h3>
            </div>
            <div className="filters-content">
              <div className="filter-group">
                <h4>Tipo de Archivo</h4>
                {['Imágenes', 'PDFs', 'Documentos'].map(type => (
                  <label key={type} className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={filters.fileTypes.includes(type.toLowerCase())}
                      onChange={() => handleFilterChange('fileTypes', type.toLowerCase())}
                    />
                    {type}
                  </label>
                ))}
              </div>
              <div className="filter-group">
                <h4>Tamaño</h4>
                {['Pequeño', 'Mediano', 'Grande'].map(size => (
                  <label key={size} className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={filters.fileSizes.includes(size.toLowerCase())}
                      onChange={() => handleFilterChange('fileSizes', size.toLowerCase())}
                    />
                    {size}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Work Area Card */}
          <div className="work-area-card">
            <div className="card-header">
              <h3>Área de Trabajo</h3>
            </div>
            <div className="work-content">
              {selectedFile ? (
                <div className="selected-file-preview">
                  <FontAwesomeIcon icon={faFile} className="file-preview-icon" />
                  <h4>{selectedFile.name}</h4>
                  <p>Tipo: {selectedFile.type}</p>
                  <p>Tamaño: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                  <p>Fecha de subida: {selectedFile.uploadDate}</p>
                </div>
              ) : (
                <p>Selecciona un archivo para trabajar</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Procesar_Sabana;