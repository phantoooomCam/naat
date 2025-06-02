"use client";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faFile,
  faTrash,
  faCheck,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import "./Sabana.css";
import fetchWithAuth from "../../../../utils/fetchWithAuth";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [casos, setCasos] = useState([]);
  const [casoSeleccionado, setCasoSeleccionado] = useState("");
  const [companias, setCompanias] = useState([]);
  const [codigoPais, setCodigoPais] = useState("+52");

  useEffect(() => {
    const fetchCompanias = async () => {
      try {
        const response = await fetchWithAuth("/api/sabanas/companias");
        if (!response.ok) {
          throw new Error("Error al obtener las compañías");
        }
        const data = await response.json();
        setCompanias(data);
      } catch (error) {
        // console.error("Error fetching compañías:", error);
      }
    };

    fetchCompanias();
  }, []);

  useEffect(() => {
    const fetchCasos = async () => {
      try {
        const response = await fetchWithAuth("/api/casos");
        if (!response.ok) {
          throw new Error("Error al obtener los casos");
        }
        const data = await response.json();
        const casosTrasnformados = data.map((caso) => ({
          id: caso.idCaso,
          titulo: caso.nombre,
        }));
        setCasos(casosTrasnformados);
      } catch (error) {
        // console.error("Error fetching casos:", error);
      }
    };
    fetchCasos();
  }, []);

  const processFiles = (newFiles) => {
    const processedFiles = newFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: new Date().toLocaleDateString(),
      rawFile: file,
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
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((file) => file.id !== fileId);
      // Si el archivo seleccionado es el que se está eliminando, deseleccionarlo
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile(null);
      }
      return updatedFiles;
    });
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

  const handleProcessFiles = () => {
    if (files.length === 0) {
      setProcessingStatus("error");
      setStatusMessage("No hay archivos para procesar");
      setTimeout(() => setProcessingStatus(null), 3000);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus(null);

    // Simulación de procesamiento
    setTimeout(() => {
      setIsProcessing(false);
      setProcessingStatus("success");
      setStatusMessage("Archivos procesados correctamente");
      setTimeout(() => setProcessingStatus(null), 3000);
    }, 2000);
  };

  const handleGuardarEnBD = async () => {
  const companiaSeleccionada = companias.find(
    (compania) => compania.nombre === telco
  );
  const idCompania = companiaSeleccionada ? companiaSeleccionada.id : null;

  if (files.length === 0) {
    setProcessingStatus("error");
    setStatusMessage("No hay archivos para guardar");
    setTimeout(() => setProcessingStatus(null), 3000);
    return;
  }

  if (!casoSeleccionado) {
    setProcessingStatus("error");
    setStatusMessage("Debe seleccionar un caso");
    setTimeout(() => setProcessingStatus(null), 3000);
    return;
  }

  setIsProcessing(true);
  setProcessingStatus(null);

  try {
    // Primero enviar el número telefónico
    const numeroPayload = {
      numero: phoneNumber,
      codigoArea: codigoPais, 
    };

    const numeroResponse = await fetchWithAuth("/api/sabanas/numeros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(numeroPayload),
    });

    if (!numeroResponse.ok) {
      const errorData = await numeroResponse.json();
      console.warn("⚠️ Error al guardar número:", errorData?.mensaje || "Desconocido");
    }

    // Subir archivos con idCaso
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      if (files[i].rawFile) {
        formData.append("archivos", files[i].rawFile);
      }
    }

    // Agregamos el idCaso
    formData.append("idCaso", casoSeleccionado.toString());

    const response = await fetchWithAuth("/api/sabanas/archivos/subir", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setIsProcessing(false);

    if (response.ok) {
      setProcessingStatus("success");
      setStatusMessage("Archivos guardados correctamente");
    } else {
      setProcessingStatus("error");
      setStatusMessage(data.message || "Error al guardar los archivos");
    }

    setTimeout(() => setProcessingStatus(null), 3000);
  } catch (error) {
    console.error("❌ Error al guardar en BD:", error);
    setIsProcessing(false);
    setProcessingStatus("error");
    setStatusMessage("Error de conexión al servidor");
    setTimeout(() => setProcessingStatus(null), 3000);
  }
};


  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  return (
    <div
      className={`sabana-container ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      {/* Status message */}
      {processingStatus && (
        <div className={`status-message ${processingStatus}`}>
          <div className="status-icon">
            {processingStatus === "success" ? (
              <FontAwesomeIcon icon={faCheck} />
            ) : (
              <FontAwesomeIcon icon={faExclamationTriangle} />
            )}
          </div>
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="sabana-header">
        <h2>Procesamiento de Sabanas</h2>
        <p>Sube y procesa archivos de sabana para análisis</p>
      </div>

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
            aria-label="Seleccionar archivos"
          />
          <div className="upload-content">
            <FontAwesomeIcon icon={faUpload} className="upload-icon" />
            <p>Arrastra y suelta archivos aquí o</p>
            <button
              onClick={() => inputRef.current.click()}
              className="upload-button"
              disabled={isProcessing}
            >
              Selecciona Archivos
            </button>
          </div>
        </div>

        <div className="filters-card">
          <div className="card-header">
            <h3>Detalles de Sabana</h3>
          </div>
          <div className="filters-content">
            <div className="filter-group">
              <label htmlFor="telco-select">
                Selecciona una compañía:
                <select
                  id="telco-select"
                  className="phone-select"
                  value={telco}
                  onChange={(e) => setTelco(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="">Selecciona una compañía</option>
                  {companias.map((compania) => (
                    <option key={compania.id} value={compania.nombre}>
                      {compania.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="phone-input">
                Número telefónico:
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    className="phone-select"
                    value={codigoPais}
                    onChange={(e) => setCodigoPais(e.target.value)}
                    disabled={isProcessing}
                  >
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>

                  <input
                    id="phone-input"
                    type="text"
                    className="phone-input"
                    placeholder="Número"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 10) setPhoneNumber(value);
                    }}
                    disabled={isProcessing}
                  />
                </div>
              </label>

              <label htmlFor="caso-select">
                Caso relacionado:
                <select
                  id="caso-select"
                  className="phone-select"
                  value={casoSeleccionado}
                  onChange={(e) => setCasoSeleccionado(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="">Selecciona un caso</option>
                  {casos.map((caso) => (
                    <option key={caso.id} value={caso.id}>
                      {caso.titulo}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content-area-sabana">
        <div className="files-card">
          <div className="card-header">
            <h3>Archivos Subidos</h3>
            <span className="file-count">{files.length} archivos</span>
          </div>

          {files.length > 0 ? (
            <div className="files-list">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`file-item ${
                    selectedFile && selectedFile.id === file.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="file-info">
                    <FontAwesomeIcon icon={faFile} className="file-icon" />
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <span className="file-meta">
                        {formatFileSize(file.size)} • {file.uploadDate}
                      </span>
                    </div>
                  </div>
                  <div className="file-actions">
                    <button
                      className="delete-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileDelete(file.id);
                      }}
                      disabled={isProcessing}
                      aria-label={`Eliminar archivo ${file.name}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
               ))} 
            </div>
          ) : (
            <div className="empty-files">
              <p>No hay archivos subidos</p>
              <button
                onClick={() => inputRef.current.click()}
                className="upload-button-small"
                disabled={isProcessing}
              >
                Subir archivos
              </button>
            </div>
          )}

          <div className="processing-buttons">
            <button
              className="process-button"
              onClick={handleProcessFiles}
              disabled={isProcessing || files.length === 0}
            >
              {isProcessing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>Procesar Archivos</span>
              )}
            </button>
            <button
              className="save-button"
              onClick={handleGuardarEnBD}
              disabled={isProcessing || files.length === 0}
            >
              {isProcessing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar en Base de Datos</span>
              )}
            </button>
            <button
              className="clear-button"
              onClick={handleClearAllFiles}
              disabled={isProcessing || files.length === 0}
            >
              <span>Limpiar Todo</span>
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
                    disabled={isProcessing}
                  />
                  <span>Buscar coincidencias de ubicación</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.contactos}
                    onChange={() =>
                      handleFilterChange("contactos", !filters.contactos)
                    }
                    disabled={isProcessing}
                  />
                  <span>Buscar coincidencias de contactos</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.ciudades}
                    onChange={() =>
                      handleFilterChange("ciudades", !filters.ciudades)
                    }
                    disabled={isProcessing}
                  />
                  <span>Buscar localización en ciudades</span>
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
                    disabled={isProcessing}
                  />
                  <span>Buscar cercanía en puntos de interés</span>
                </label>
              </div>
              <div className="date-time-filters">
                <label htmlFor="fecha-inicio">
                  Fecha Inicio:
                  <input
                    id="fecha-inicio"
                    type="date"
                    value={filters.fechaInicio}
                    onChange={(e) =>
                      handleFilterChange("fechaInicio", e.target.value)
                    }
                    className="date-input"
                    disabled={isProcessing}
                  />
                </label>
                <label htmlFor="fecha-fin">
                  Fecha Fin:
                  <input
                    id="fecha-fin"
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) =>
                      handleFilterChange("fechaFin", e.target.value)
                    }
                    className="date-input"
                    disabled={isProcessing}
                  />
                </label>
                <label htmlFor="hora-inicio">
                  Hora Inicio:
                  <input
                    id="hora-inicio"
                    type="time"
                    value={filters.horaInicio}
                    onChange={(e) =>
                      handleFilterChange("horaInicio", e.target.value)
                    }
                    className="time-input"
                    disabled={isProcessing}
                  />
                </label>
                <label htmlFor="hora-fin">
                  Hora Fin:
                  <input
                    id="hora-fin"
                    type="time"
                    value={filters.horaFin}
                    onChange={(e) =>
                      handleFilterChange("horaFin", e.target.value)
                    }
                    className="time-input"
                    disabled={isProcessing}
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
                <div className="file-details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Tipo:</span>
                    <span className="detail-value">
                      {selectedFile.type || "Desconocido"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tamaño:</span>
                    <span className="detail-value">
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Fecha de subida:</span>
                    <span className="detail-value">
                      {selectedFile.uploadDate}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <FontAwesomeIcon icon={faFile} className="no-file-icon" />
                <p>Selecciona un archivo para trabajar</p>
              </div>
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
