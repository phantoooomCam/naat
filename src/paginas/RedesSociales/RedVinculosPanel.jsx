// Fusion of WindowSeek + Navbar for RedesSociales module
import React, { useState, useEffect, useRef } from "react";
import img from "../../assets/naat_blanco.png";
import "./redes_sociales.css";
import { ImSpinner } from "react-icons/im";
import { MdOutlineAddPhotoAlternate } from "react-icons/md";
import { MdPersonAddAlt } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import { FaEdit } from "react-icons/fa";
import { AiOutlineUserDelete } from "react-icons/ai";
import { HiOutlineViewGridAdd } from "react-icons/hi";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";

// Valida https://(www.)?(facebook|instagram|x).com/<segmento>
export function validateSocialUrl(raw) {
  try {
    const u = new URL(raw);

    if (u.protocol !== "https:") {
      return { ok: false, msg: "URL invalido" };
    }

    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const allowed = new Set(["facebook.com", "instagram.com", "x.com"]);
    if (!allowed.has(host)) {
      return {
        ok: false,
        msg: "URL invalido",
      };
    }

    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length === 0) {
      return {
        ok: false,
        msg: "URL invalido",
      };
    }

    // (Opcional) Reglas del identificador
    if (!/^[A-Za-z0-9._%-\-]+$/.test(segments[0])) {
      return {
        ok: false,
        msg: "URL invalido",
      };
    }

    return { ok: true, msg: "" };
  } catch {
    return { ok: false, msg: "URL inválido" };
  }
}

// Espera ref del grafo (WindowNet) via props
const RedVinculosPanel = ({ netRef, onGraphData }) => {
  const platformOptions = ["facebook", "instagram", "x"];
  const [openMenu, setOpenMenu] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const DEFAULT_FORM = {
    username: "",
    platform: "",
  };
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [dataResult, setDataResult] = useState(null);
  const [loadPlatform, setLoadPlatform] = useState("");
  const [loadUsername, setLoadUsername] = useState("");

  useEffect(() => {
    localStorage.setItem("rv_formState", JSON.stringify(formState));
  }, [formState]);

  const toggle = (menu) => {
    setOpenMenu((m) => (m === menu ? null : menu));
    setOpenSubmenu(null);
  };

  const toggleSub = (submenu) => {
    setOpenSubmenu((s) => (s === submenu ? null : submenu));
  };
  

  const handleInputChange = (name, value) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  

  function fetchProfileData(platform, username) {
    return fetch(`/related/${platform}/${username}`).then((r) => r.json());
  }

  function scrapeProfile(platform, username) {
    const roots = [{ platform, username }];
    return fetch(`/multi-scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roots }),
    }).then((r) => r.json());
  }

  const handleFetchOrScrape = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!formState.platform || !formState.username) return;
    setLoading(true);
    setDataResult(null);
    try {
      const relatedData = await fetchProfileData(
        formState.platform,
        formState.username
      );
      const updatedAt =
        relatedData["Perfil objetivo"]?.updated_at ||
        relatedData["Perfil objetivo"]?.created_at;
      let useScrape = true;
      if (updatedAt) {
        const last = new Date(updatedAt);
        const now = new Date();
        const diffDays = (now - last) / (1000 * 60 * 60 * 24);
        if (diffDays <= 1) useScrape = false;
      }
      let data;
      if (useScrape) {
        data = await scrapeProfile(
          formState.platform,
          formState.username
        );
      } else {
        data = relatedData;
      }
      setDataResult(data);
      onGraphData && onGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceScrape = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!formState.platform || !formState.username) return;
    setLoading(true);
    try {
      const data = await scrapeProfile(
        formState.platform,
        formState.username
      );
      setDataResult(data);
      onGraphData && onGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Navbar actions
  const call = (fnName, ...args) => {
    if (netRef?.current && typeof netRef.current[fnName] === "function") {
      netRef.current[fnName](...args);
    }
  };

  return (
    <div className="redvinc-panel">
      {/* Seek / search form */}
      <div className="rv-seek-wrapper">
        <h3 className="rv-title">Red de vínculos</h3>
        <form className="rv-form" onSubmit={handleFetchOrScrape}>
          <div className="rv-field">
            <label>Nombre de usuario:</label>
            <input
              type="text"
              placeholder="usuario"
              value={formState.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              required
            />
          </div>
          <div className="rv-field">
            <label>Plataforma:</label>
            <select
              value={formState.platform}
              onChange={(e) => handleInputChange("platform", e.target.value)}
              required
            >
              <option value="">--Selecciona--</option>
              {platformOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          
          <div className="rv-buttons">
            <button type="submit" disabled={loading}>
              {loading ? (
                <span>
                  <ImSpinner className="spinner" />
                </span>
              ) : (
                "Buscar"
              )}
            </button>
            <button
              type="button"
              onClick={handleForceScrape}
              disabled={loading}
            >
              Actualizar
            </button>
          </div>
        </form>
        <div className="rv-status">
          {dataResult ? `Cargado` : "No hay información aún"}
        </div>
      </div>

      {/* Toolbar */}
      <div className="rv-navbar">
        <h4 className="rv-titulo-grafo">Opciones </h4>
        <div className="rv-left">
          <div className="rv-section">
            <button
              className={`rv-item ${openMenu === "archivo" ? "is-active" : ""}`}
              onClick={() => toggle("archivo")}
            >
              Archivos{" "}
              {openMenu === "archivo" ? (
                <MdOutlineKeyboardArrowDown />
              ) : (
                <MdOutlineKeyboardArrowRight />
              )}
            </button>

            {openMenu === "archivo" && (
              <div className="rv-dropdown-submenu">
                <div className="rv-dropdown-inner">
                  <label
                    className="seccion-submenu-rv"
                  >
                    Red de vínculos
                  </label>

                  <button
                    className="seccion-submenu-rv-2"
                    type="button"
                    onClick={() => toggleSub("cargarGrafo")}
                  >
                    Cargar red de vínculos ▾
                  </button>

                  {/* Submenú animable */}
                  <div className="rv-subdropdown">
                    {openSubmenu === "cargarGrafo" && (
                      <div className="rv-form-inline">
                        <select
                          value={loadPlatform}
                          onChange={(e) => setLoadPlatform(e.target.value)}
                        >
                          <option value="">plataforma</option>
                          {platformOptions.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
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
                          onClick={() =>
                            call("loadGraph", loadPlatform, loadUsername)
                          }
                        >
                          Cargar red de vínculos
                        </button>
                      </div>
                    )}
                  </div>

                  <button onClick={() => call("saveGraph")} type="button">
                    Guardar grafo
                  </button>
                  <button onClick={() => call("loadFromLocal")} type="button">
                    Cargar desde archivo
                  </button>
                  <div className="rv-divider" />
                  <label className="seccion-submenu-rv">Archivo</label>
                  <button
                    onClick={() => call("saveGraphAsLocalFile")}
                    type="button"
                  >
                    Guardar archivo local
                  </button>
                  <button onClick={() => call("exportToExcel")} type="button">
                    Exportar a Excel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="rv-section">
            <button
              className={`rv-item ${
                openMenu === "insertar" ? "is-active" : ""
              }`}
              onClick={() => toggle("insertar")}
            >
              Insertar{" "}
              {openMenu === "insertar" ? (
                <MdOutlineKeyboardArrowDown />
              ) : (
                <MdOutlineKeyboardArrowRight />
              )}
            </button>
            {openMenu === "insertar" && (
              <div className="rv-dropdown">
                <button onClick={() => call("createNode")}>
                  <MdPersonAddAlt /> Nuevo involucrado
                </button>
                <button onClick={() => call("createEdge")}>
                  <HiOutlineViewGridAdd /> Nuevo vínculo
                </button>
              </div>
            )}
          </div>
          <div className="rv-section">
            <button
              className={`rv-item ${openMenu === "editar" ? "is-active" : ""}`}
              onClick={() => {
                toggle("editar");
              }}
            >
              Editar{" "}
              {openMenu === "editar" ? (
                <MdOutlineKeyboardArrowDown />
              ) : (
                <MdOutlineKeyboardArrowRight />
              )}
            </button>
            {openMenu === "editar" && (
              <div className="rv-dropdown">
                <button onClick={() => call("editNodePhoto")}>
                  <MdOutlineAddPhotoAlternate /> Editar foto (nodo)
                </button>
                <button onClick={() => call("editNodeName")}>
                  <CiEdit /> Editar nombre (nodo)
                </button>
                <button onClick={() => call("editEdgeRelation")}>
                  <FaEdit /> Editar vínculo (arista)
                </button>
                <button onClick={() => call("deleteSelected")}>
                  <AiOutlineUserDelete /> Eliminar seleccionado
                </button>
              </div>
            )}
          </div>
          <div className="rv-section">
            <button
              className={`rv-item ${
                openMenu === "rectangular" ? "is-active" : ""
              }`}
              onClick={() => call("layoutRectangular")}
            >
              Rectangular
            </button>
          </div>
        </div>
        <div className="rv-right">
          <button className="rv-item" onClick={() => call("undo")}>
            ⟲ Deshacer
          </button>
          <button className="rv-item" onClick={() => call("redo")}>
            ⟳ Rehacer
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedVinculosPanel;
