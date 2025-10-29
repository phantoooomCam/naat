"use client";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./redes_sociales.css";
import "../../componentes/RedVinculos.css";
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import { FaEdit } from "react-icons/fa";
import { AiOutlineUserDelete } from "react-icons/ai";
import { MdOutlineKeyboardArrowRight, MdOutlineKeyboardArrowDown } from "react-icons/md";
import { MdPersonAddAlt } from "react-icons/md";
import { HiOutlineViewGridAdd } from "react-icons/hi";
import { MdEdit, MdOutlineFolderOpen } from "react-icons/md";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { FiUpload, FiDownload, FiSave } from "react-icons/fi";
import { CgInsertAfterO } from "react-icons/cg";
import { TbTopologyStar3 } from "react-icons/tb";
import { FaUndo } from "react-icons/fa";
import { FaRedo } from "react-icons/fa";

//Funcion para ActiveView
const VinculosRedes = ({ activeView }) => {
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
    redes: <Redes />,
  };

  return (
    <div
      className={`dash-gestion ${isSidebarCollapsed ? "collapsed" : ""}`}
    >
      <div className="content-wrapper">{views[activeView] || views.redes}</div>
    </div>
  );
};

//Funcion General
import WindowNet from "./WindowNet.jsx";
import RedVinculosPanel from "./RedVinculosPanel.jsx";

const Redes = () => {
  const netRef = useRef(null);
  const panelRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const [archivoOpen, setArchivoOpen] = useState(false);
  const [loadPlatform, setLoadPlatform] = useState("");
  const [loadUsername, setLoadUsername] = useState("");

  const relaciones_ = {
    comentó: { color: "#0f8e20ff" },
    seguido: { color: "#FF4E45" },
    seguidor: { color: "#2885B0" },
    reaccionó: { color: "#e6de0b" },
    default: { color: "#1A2D42" },
  };
  const handleGraphData = (data) => {
    setGraphData(data);
  };

  const relaciones = {
    seguidor: {color: "#2885B0"},
    seguido: {color: "#FF4E45"},
    comentó: {color: "#0f8e20ff"},
    reaccionó: {color: "#e6de0b"},
    default: {color: "#1A2D42"},
  };
  return (
    <div className="redes-main-container">
      <div className="redes-title-section">
        <div className="title-content">
          <h2>Vinculos Redes Sociales</h2>
        </div>
      </div>

      <div className="redes-grid-layout">
        <div className="section-left">
          <div className="inputs-wrapper-card">
            <RedVinculosPanel ref={panelRef} netRef={netRef} onGraphData={handleGraphData} />
          </div>
        </div>

        <div className="section-right">
          <div className="details-red">
            {/*Opciones de edicion al grafo*/}
            <div className="rv-navbar-up" style={{ padding: 0 }}>
              <div className="rv-left-up" style={{ gap: "0.5rem" }}>
                {/* Archivo dropdown */}
                <div className="rv-section">
                  <button
                    className={`rv-item ${archivoOpen ? "is-active" : ""}`}
                    onClick={() => setArchivoOpen((o) => !o)}
                    type="button"
                    data-tooltip="Archivo"
                  >
                    <MdOutlineFolderOpen /> {archivoOpen ? <MdOutlineKeyboardArrowDown /> : <MdOutlineKeyboardArrowRight />}
                  </button>
                  {archivoOpen && (
                    <div className="rv-modal-overlay" onClick={() => setArchivoOpen(false)}>
                      <div
                        className="rv-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Archivo"
                      >
                        <div className="rv-modal-header">
                          <div className="rv-modal-title"><MdOutlineFolderOpen /> Archivo</div>
                          <button className="rv-modal-close" onClick={() => setArchivoOpen(false)} type="button">×</button>
                        </div>
                        <div className="rv-modal-body">
                          <div className="rv-dropdown-modal">
                            <label className="seccion-submenu-rv-modal">Red de vínculos</label>
                            <div className="rv-form-inline-modal" style={{ margin: "0.25rem 0" }}>
                              <select
                                value={loadPlatform}
                                onChange={(e) => setLoadPlatform(e.target.value)}
                              >
                                <option value="">plataforma</option>
                                <option value="facebook">facebook</option>
                                <option value="instagram">instagram</option>
                                <option value="x">x</option>
                              </select>
                              <input
                                type="text"
                                placeholder="usuario"
                                value={loadUsername}
                                onChange={(e) => setLoadUsername(e.target.value)}
                              />
                              <button
                                className="btn-save"
                                type="button"
                                onClick={() => { netRef.current?.loadGraph(loadPlatform, loadUsername); setArchivoOpen(false); }}
                              >
                                <FiUpload /> Cargar red de vínculos
                              </button>
                            </div>

                            <button className="btn-archivo-option" onClick={() => { netRef.current?.saveGraph(); setArchivoOpen(false); }} type="button">
                              <FiSave /> Guardar grafo
                            </button>
                            <button className="btn-archivo-option" onClick={() => { netRef.current?.loadFromLocal(); setArchivoOpen(false); }} type="button">
                              <FiUpload /> Cargar desde archivo
                            </button>
                            <div className="rv-divider" />
                            <label className="seccion-submenu-rv">Archivo</label>
                            <button className="btn-archivo-option" onClick={() => { netRef.current?.saveAsLocal(); setArchivoOpen(false); }} type="button">
                              <FiDownload /> Guardar archivo local
                            </button>
                            <button className="btn-archivo-option" onClick={() => { netRef.current?.exportToExcel(); setArchivoOpen(false); }} type="button">
                              <FaFileExcel /> Exportar a Excel
                            </button>
                            <button className="btn-archivo-option" onClick={() => { panelRef.current?.exportToPDF(); setArchivoOpen(false); }} type="button">
                              <FaFilePdf /> Exportar a PDF (captura)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Editar dropdown */}
                <div className="rv-section">
                  <button
                    className={`rv-item ${editOpen ? "is-active" : ""}`}
                    onClick={() => setEditOpen((o) => !o)}
                    type="button"
                    data-tooltip="Editar"
                  >
                    <MdEdit /> {editOpen ? <MdOutlineKeyboardArrowDown /> : <MdOutlineKeyboardArrowRight />}
                  </button>
                  {editOpen && (
                    <div className="rv-modal-overlay" onClick={() => setEditOpen(false)}>
                      <div
                        className="rv-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Editar"
                      >
                        <div className="rv-modal-header">
                          <div className="rv-modal-title"><MdEdit /> Editar</div>
                          <button className="rv-modal-close" onClick={() => setEditOpen(false)} type="button">×</button>
                        </div>
                        <div className="rv-modal-body">
                          <div className="rv-dropdown">
                            <button onClick={() => { netRef.current?.editNodePhoto(); setEditOpen(false); }} type="button">
                              <MdOutlineAddPhotoAlternate /> Editar foto (nodo)
                            </button>
                            <button onClick={() => { netRef.current?.editNodeName(); setEditOpen(false); }} type="button">
                              <CiEdit /> Editar nombre (nodo)
                            </button>
                            <button onClick={() => { netRef.current?.editEdgeRelation(); setEditOpen(false); }} type="button">
                              <FaEdit /> Editar vínculo (arista)
                            </button>
                            <button onClick={() => { netRef.current?.deleteSelected(); setEditOpen(false); }} type="button">
                              <AiOutlineUserDelete /> Eliminar seleccionado
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Insertar dropdown */}
                <div className="rv-section">
                  <button
                    className={`rv-item ${insertOpen ? "is-active" : ""}`}
                    onClick={() => setInsertOpen((o) => !o)}
                    type="button"
                    data-tooltip="Agregar"
                  >
                    <CgInsertAfterO /> {insertOpen ? <MdOutlineKeyboardArrowDown /> : <MdOutlineKeyboardArrowRight />}
                  </button>
                  {insertOpen && (
                    <div className="rv-modal-overlay" onClick={() => setInsertOpen(false)}>
                      <div
                        className="rv-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Insertar"
                      >
                        <div className="rv-modal-header">
                          <div className="rv-modal-title"><CgInsertAfterO /> Insertar</div>
                          <button className="rv-modal-close" onClick={() => setInsertOpen(false)} type="button">×</button>
                        </div>
                        <div className="rv-modal-body">
                          <div className="rv-dropdown">
                            <button onClick={() => { netRef.current?.createNode(); setInsertOpen(false); }} type="button">
                              <MdPersonAddAlt /> Nuevo involucrado
                            </button>
                            <button onClick={() => { netRef.current?.createEdge(); setInsertOpen(false); }} type="button">
                              <HiOutlineViewGridAdd /> Nuevo vínculo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Rectangular layout */}
                <div className="rv-section">
                  <button className="rv-item" onClick={() => netRef.current?.layoutRectangular()} type="button" data-tooltip="Organizar nodos">
                    <TbTopologyStar3 />
                  </button>
                </div>
              </div>
              <div className="rv-right-up">
                <button className="rv-item" onClick={() => netRef.current?.undo()} type="button" data-tooltip="Deshacer">
                  <FaUndo />
                </button>
                <button className="rv-item" onClick={() => netRef.current?.redo()} type="button" data-tooltip="Rehacer">
                  <FaRedo />
                </button>
              </div>
            </div>
          </div>
          <div className="content-display-area">
            <WindowNet
              ref={netRef}
              elements={graphData}
              onAddRoot={(platform, username) =>
                panelRef.current?.addRootAndScrape(platform, username)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

VinculosRedes.PropTypes = {
  activeView: PropTypes.string.isRequired,
};

export default VinculosRedes;
