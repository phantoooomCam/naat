import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faFile, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./Sabana.css";

const Procesar_Sabana = ({ activeView }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const views = {
    procesamiento: (
      <ProcesamientoView isSidebarCollapsed={isSidebarCollapsed} />
    ),
  };

  return (
    <div className={`dash-home ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="container">
        {views[activeView] || views.procesamiento}
      </div>
    </div>
  );
};

const ProcesamientoView = ({ isSidebarCollapsed }) => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [telco, setTelco] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const processFiles = (newFiles) => {
    const processedFiles = newFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date().toLocaleDateString(),
      rawFile: file, // <- aquí guardas el archivo real
    }));
    setFiles((prevFiles) => [...prevFiles, ...processedFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
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
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
  };

  const [filters, setFilters] = useState({
    ubicacion: false,
    contactos: false,
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
    ciudades: false,
    puntosInteres: false,
  });

  const handleClearAllFiles = () => {
    setFiles([]);
    setSelectedFile(null);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };
  const inputRef = useRef(null);
  const filteredFiles = files.filter((file) => true);

  const handleGuardarEnBD = async () => {
    if (files.length === 0) {
      alert("No hay archivos para guardar");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      if (files[i].rawFile) {
        formData.append("archivos", files[i].rawFile);
      }
    }

    try {
      const response = await fetch(
        "http://192.168.100.89:44444/api/archivos/subirftp",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Archivos enviados con éxito");
        console.log(data);
      } else {
        alert("Error en el backend");
      }
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div
      className={`sabana-container ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <div className="upload-area-grid">
        <div
          className={`upload-card ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            style={{ display: "none" }}
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

        <div className="filters-card">
          <div className="card-header">
            <h3>Compañía Telefónica</h3>
          </div>
          <div className="filters-content">
            <div className="filter-group">
              <label>
                Selecciona una compañía:
                <select
                  className="phone-select"
                  value={telco}
                  onChange={(e) => setTelco(e.target.value)}
                >
                  <option value="">Selecciona una compañía</option>
                  <option value="Telcel">Telcel</option>
                  <option value="TelcelNuevoFormato">TelcelNuevoFormato</option>
                  <option value="TelcelIMEI">TelcelIMEI</option>
                  <option value="ATT">AT&T</option>
                  <option value="Movistar">Movistar</option>
                  <option value="VirginMobile">VirginMobile</option>
                  <option value="Bait">Bait</option>
                  <option value="Telmex">Telmex</option>
                  <option value="OXXO">OXXO</option>
                  <option value="IZZI">IZZI</option>
                  <option value="Personalizada">Personalizada</option>
                  <option value="ALTAN">ALTAN</option>
                  <option value="ATTNuevoFormato">ATTNuevoFormato</option>
                  <option value="TelcelIMEINuevoFormato">
                    TelcelIMEINuevoFormato
                  </option>
                </select>
              </label>
              <label>
                Número telefónico:
                <input
                  type="text"
                  className="phone-input"
                  placeholder="Número telefónico"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) setPhoneNumber(value);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content-area-sabana">
        <div className="files-card">
          <div className="card-header">
            <h3>Archivos Subidos</h3>
          </div>
          <div className="files-list">
            {filteredFiles.map((file) => (
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

          <div className="processing-buttons">
            <button className="process-button">Procesar Archivos</button>
            <button className="save-button" onClick={handleGuardarEnBD}>
              Guardar en Base de Datos
            </button>
            <button className="clear-button" onClick={handleClearAllFiles}>
              Limpiar Todo
            </button>
          </div>
        </div>

        <div className="filters-card">
          <div className="card-header">
            <h3>Filtrar Archivos</h3>
          </div>
          <div className="filters-content">
            <div className="filter-group">
              <div className="checkbox-filter">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.ubicacion}
                    onChange={() =>
                      handleFilterChange("ubicacion", !filters.ubicacion)
                    }
                  />
                  Buscar coincidencias de ubicación
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.contactos}
                    onChange={() =>
                      handleFilterChange("contactos", !filters.contactos)
                    }
                  />
                  Buscar coincidencias de contactos
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.ciudades}
                    onChange={() =>
                      handleFilterChange("ciudades", !filters.ciudades)
                    }
                  />
                  Buscar localización en ciudades
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.puntosInteres}
                    onChange={() =>
                      handleFilterChange(
                        "puntosInteres",
                        !filters.puntosInteres
                      )
                    }
                  />
                  Buscar cercanía en puntos de interés
                </label>
              </div>
              <div className="date-time-filters">
                <label>
                  Fecha Inicio:
                  <input
                    type="date"
                    value={filters.fechaInicio}
                    onChange={(e) =>
                      handleFilterChange("fechaInicio", e.target.value)
                    }
                    className="date-input"
                  />
                </label>
                <label>
                  Fecha Fin:
                  <input
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) =>
                      handleFilterChange("fechaFin", e.target.value)
                    }
                    className="date-input"
                  />
                </label>
                <label>
                  Hora Inicio:
                  <input
                    type="time"
                    value={filters.horaInicio}
                    onChange={(e) =>
                      handleFilterChange("horaInicio", e.target.value)
                    }
                    className="time-input"
                  />
                </label>
                <label>
                  Hora Fin:
                  <input
                    type="time"
                    value={filters.horaFin}
                    onChange={(e) =>
                      handleFilterChange("horaFin", e.target.value)
                    }
                    className="time-input"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

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
  );
};

Procesar_Sabana.propTypes = {
  activeView: PropTypes.string.isRequired,
};

ProcesamientoView.propTypes = {
  isSidebarCollapsed: PropTypes.bool,
};

export default Procesar_Sabana;
