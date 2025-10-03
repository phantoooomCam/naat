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
import { useNavigate } from "react-router-dom";

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
    <div className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
      <div className="content-wrapper">
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

  const [idSabana, setIdSabana] = useState(null);
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fileProgress, setFileProgress] = useState({});
  const [fileStatus, setFileStatus] = useState({});
  const [filters, setFilters] = useState({});
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [pendingMessages, setPendingMessages] = useState([]); // 🔧 NUEVO: Mensajes pendientes

  // ---- Estado derivado para 1 solo archivo ----
  const hasSingleFile = files.length === 1;
  const onlyFileId = hasSingleFile ? files[0].id : null;
  const onlyFileStatus = hasSingleFile ? fileStatus[onlyFileId] : null;
  const onlyFileProgress = hasSingleFile ? fileProgress[onlyFileId] || 0 : 0;

  // ¿ya está procesado? (por estado o por 100%)
  const isProcessed =
    onlyFileStatus === "procesado" || onlyFileProgress === 100;

  // REGLAS:
  // Guardar en BD: hay archivo y NO está procesado
  const canGuardar = hasSingleFile && !isProcessed && !isProcessing;

  // Procesar Archivos: hay archivo y SÍ está procesado
  const canProcesar = hasSingleFile && isProcessed && !isProcessing;

  // 🔧 CAMBIO 1: Usar refs para mantener los valores actualizados
  const fileIdByServerIdRef = useRef({});
  const [fileIdByServerId, setFileIdByServerId] = useState({});

  const stateToProgress = {
    en_cola: 33,
    procesando: 66,
    procesado: 100,
  };

  const getStatusText = (status) => {
    const statusMap = {
      en_cola: "En cola",
      procesando: "Procesando",
      procesado: "Procesado",
    };
    return statusMap[status] || "Pendiente";
  };
  // 🔧 FUNCIÓN PARA PROCESAR UN MENSAJE
  const processMessage = (message) => {
    const stateMatch = message.match(/estado:\s*(\w+)/);
    const fileMatch = message.match(/archivo\s+(\d+)/);

    if (!stateMatch || !fileMatch) {
      return false; // No se pudo procesar
    }

    const state = stateMatch[1].toLowerCase();
    const serverId = fileMatch[1];

    if (!stateToProgress.hasOwnProperty(state)) {
      return false;
    }

    const fileId = fileIdByServerIdRef.current[serverId];
    if (!fileId) {
      return false; // No se pudo procesar, pero el mensaje es válido
    }

    const progressValue = stateToProgress[state];

    setFileProgress((prev) => {
      const updated = { ...prev, [fileId]: progressValue };
      return updated;
    });

    setFileStatus((prev) => {
      const updated = { ...prev, [fileId]: state };
      return updated;
    });

    return true; // Procesado exitosamente
  };
  // 🔧 FUNCIÓN PARA PROCESAR MENSAJES PENDIENTES
  const processPendingMessages = () => {
    setPendingMessages((currentPending) => {
      const stillPending = [];

      currentPending.forEach((message) => {
        const processed = processMessage(message);
        if (!processed) {
          // Si no se pudo procesar, mantenerlo en pending
          stillPending.push(message);
        }
      });

      return stillPending;
    });
  };

  // 🔧 CAMBIO 2: Actualizar ref cuando cambie el estado
  useEffect(() => {
    fileIdByServerIdRef.current = fileIdByServerId;
  }, [fileIdByServerId]);

  // 🔧 CAMBIO 3: WebSocket mejorado
  useEffect(() => {
    const ws = new WebSocket("ws://192.168.100.89:44444");

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = event.data;

      // Siempre agregar a la lista de mensajes para mostrar
      setMessages((prevMessages) => [...prevMessages, message]);

      // Intentar procesar el mensaje inmediatamente
      const processed = processMessage(message);

      if (!processed) {
        setPendingMessages((prev) => [...prev, message]);
      }
    };

    ws.onerror = (error) => {
      console.error("Error en WebSocket:", error);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
      setIsConnected(false);
    };
  }, []);
  //Proceso de sabanas

  // 🔧 PROCESAR MENSAJES PENDIENTES CUANDO CAMBIE EL MAPEO
  useEffect(() => {
    fileIdByServerIdRef.current = fileIdByServerId;

    // Si hay mapeo y mensajes pendientes, procesarlos
    if (
      Object.keys(fileIdByServerId).length > 0 &&
      pendingMessages.length > 0
    ) {
      processPendingMessages();
    }
  }, [fileIdByServerId, pendingMessages.length]);

  useEffect(() => {
    const fetchCompanias = async () => {
      try {
        const response = await fetchWithAuth("/api/sabanas/companias");
        if (!response.ok) {
          throw new Error("Error al obtener las compañías");
        }
        const data = await response.json();
        setCompanias(data);
      } catch (error) {}
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
      } catch (error) {}
    };
    fetchCasos();
  }, []);

  const processFiles = (newFiles) => {
    const incoming = Array.from(newFiles).map((f) => ({
      id: crypto?.randomUUID?.() ?? Date.now() + Math.random(),
      name: f.name,
      type: f.type,
      size: f.size,
      uploadDate: new Date().toLocaleDateString(),
      rawFile: f,
    }));

    setFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}::${f.size}`));
      const deduped = incoming.filter(
        (f) => !existingKeys.has(`${f.name}::${f.size}`)
      );
      return [...prev, ...deduped];
    });

    setFileProgress((prev) => {
      const next = { ...prev };
      incoming.forEach((f) => {
        next[f.id] = 0;
      });
      return next;
    });

    setFileStatus((prev) => {
      const next = { ...prev };
      incoming.forEach((f) => {
        next[f.id] = "pendiente";
      });
      return next;
    });
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
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleFileDelete = (fileId) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((file) => file.id !== fileId);
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile(null);
      }
      return updatedFiles;
    });

    // Limpiar el progreso del archivo eliminado
    setFileProgress((prev) => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });

    setFileStatus((prev) => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  const handleClearAllFiles = () => {
    setFiles([]);
    setSelectedFile(null);
    setFileProgress({});
    setFileStatus({});
    setCurrentProcessingIndex(0); // Reiniciar el índice
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

    if (!idSabana) {
      setProcessingStatus("error");
      setStatusMessage("Primero guarda en BD para obtener el id_sabana.");
      setTimeout(() => setProcessingStatus(null), 3000);
      return;
    }

    navigate("/procesamiento_sabana", { state: { idSabana } });
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

    if (!idCompania) {
      setProcessingStatus("error");
      setStatusMessage("Debe seleccionar una compañía válida");
      setTimeout(() => setProcessingStatus(null), 3000);
      return;
    }

    setIsProcessing(true);
    setProcessingStatus(null);

    // 🔧 CAMBIO 7: Inicializar todos los archivos en "pendiente"
    const initialProgress = {};
    const initialStatus = {};
    files.forEach((file) => {
      initialProgress[file.id] = 0;
      initialStatus[file.id] = "pendiente";
    });
    setFileProgress(initialProgress);
    setFileStatus(initialStatus);
    setCurrentProcessingIndex(0);

    try {
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
        throw new Error(errorData?.mensaje || "Error al guardar el número");
      }

      const numeroData = await numeroResponse.json();
      const idNumeroTelefonico = numeroData.id;

      const unionCaso = {
        idNumeroTelefonico: idNumeroTelefonico,
      };

      console.log("ID Caso Seleccionado:", casoSeleccionado);
      console.log("Payload de Unión:", unionCaso);
      try {
        const casoUnion = await fetchWithAuth(
          `/api/sabanas/numeros-telefonicos-casos/${casoSeleccionado}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(unionCaso),
          }
        );

        if (!casoUnion) {
          throw new Error("No se recibió respuesta del servidor.");
        }

        if (!casoUnion.ok) {
          const errorData = await casoUnion.json();
          throw new Error(
            errorData?.mensaje || "Error al unir el número con el dato"
          );
        }

        const unionData = await casoUnion.json();
        console.log("Relación creada correctamente:", unionData);
      } catch (error) {
        console.error("Error al guardar en la BD:", error.message);
      }

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        if (files[i].rawFile) {
          formData.append("archivos", files[i].rawFile);
        }
      }

      formData.append("idCaso", casoSeleccionado.toString());
      formData.append("idNumeroTelefonico", idNumeroTelefonico.toString());
      formData.append("idCompaniaTelefonica", idCompania.toString());

      const response = await fetchWithAuth("/api/sabanas/archivos/subir", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setIsProcessing(false);

      if (response.ok) {
        const idSabana = data.ids_sabanas[0];
        setIdSabana(idSabana);

        // 🔧 CAMBIO 8: Mapeo mejorado con logging
        if (Array.isArray(data.ids_sabanas)) {
          const newMapping = {};
          files.forEach((file, idx) => {
            const serverId = data.ids_sabanas[idx];
            if (serverId != null) {
              newMapping[serverId] = file.id;
            }
          });

          setFileIdByServerId(newMapping);
          fileIdByServerIdRef.current = newMapping; // 🔧 Actualizar ref inmediatamente
        }

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
      setStatusMessage(error.message || "Error de conexión al servidor");
      setTimeout(() => setProcessingStatus(null), 3000);
    }
  };
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  return (
    <div className={`dashh-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}>
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
        <div className="header-content">
          <h2>Procesamiento de Sabanas</h2>
        </div>

        {/* <div>
          <h2>
            Estado de WebSocket: {isConnected ? "Conectado" : "Desconectado"}
          </h2>

          <div>
            <h3>Mensajes Recibidos:</h3>
            <ul>
              {messages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        </div> */}

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
            aria-label="Seleccionar archivo"
          />
          <div className="upload-content">
            <FontAwesomeIcon icon={faUpload} className="upload-icon" />
            <p>Arrastra y suelta archivos aquí o</p>
            <button
              onClick={() => inputRef.current.click()}
              className="upload-button"
              disabled={isProcessing}
            >
              Selecciona Archivo
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
                  className={`file-item-enhanced ${
                    selectedFile && selectedFile.id === file.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="file-main-info">
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

                  <div className="file-progress-container">
                    <div className="circular-progress-container">
                      {fileStatus[file.id] === "procesado" ? (
                        <div className="completion-indicator">
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="completion-icon"
                          />
                          <span className="completion-text">Completado</span>
                        </div>
                      ) : fileStatus[file.id] === "procesando" ||
                        fileStatus[file.id] === "en_cola" ? (
                        <div className="spinner-container">
                          <div className="spinner"></div>
                          <span className="spinner-text">Procesando...</span>
                        </div>
                      ) : (
                        <div className="pending-indicator">
                          <div className="pending-circle"></div>
                          <span className="pending-text">Pendiente</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-files"></div>
          )}

          <div className="processing-buttons">
            <button
              className="process-button"
              onClick={handleProcessFiles}
              disabled={!canProcesar}
            >
              {isProcessing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Analizando...</span>
                </>
              ) : (
                <span>Analizar Archivos</span>
              )}
            </button>

            <button
              className="save-button"
              onClick={handleGuardarEnBD}
              disabled={!canGuardar}
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
