// Fusion of WindowSeek + Navbar for RedesSociales module
import React, { useState, useEffect, useRef } from "react";
import img from "/naat_blanco.png";
import "./redes_sociales.css";
import { ImSpinner } from "react-icons/im";

// Espera ref del grafo (WindowNet) via props
const RedVinculosPanel = ({ netRef, onGraphData }) => {
  const platformOptions = ["facebook", "instagram", "x"];
  const [openMenu, setOpenMenu] = useState(null);
  const [formState, setFormState] = useState(() => {
    const saved = localStorage.getItem("rv_formState");
    return saved
      ? JSON.parse(saved)
      : { url: "", username: "", platform: "", cantidadFotos: 5 };
  });
  const [loading, setLoading] = useState(false);
  const [dataResult, setDataResult] = useState(null);
  const [loadPlatform, setLoadPlatform] = useState("");
  const [loadUsername, setLoadUsername] = useState("");

  useEffect(() => {
    localStorage.setItem("rv_formState", JSON.stringify(formState));
  }, [formState]);

  const toggle = (menu) => setOpenMenu((m) => (m === menu ? null : menu));

  const handleInputChange = (name, value) => {
    setFormState((prev) => {
      const ns = { ...prev, [name]: value };
      if (name === "url") {
        const extracted = extractUsernameFromUrl(value);
        ns.username = extracted || "";
      }
      return ns;
    });
  };

  function extractUsernameFromUrl(url) {
    try {
      const u = new URL(url);
      const seg = u.pathname.split("/").filter(Boolean);
      return seg.length ? seg[0] : null;
    } catch (e) {
      return null;
    }
  }

  function fetchProfileData(platform, username) {
    return fetch(`/related/${platform}/${username}`).then((r) => r.json());
  }
  function scrapeProfile(platform, url, max_photos = 5) {
    return fetch(`/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, url, max_photos }),
    }).then((r) => r.json());
  }

  const handleFetchOrScrape = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!formState.platform || !formState.username || !formState.url) return;
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
          formState.url,
          formState.cantidadFotos || 5
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
    if (!formState.platform || !formState.url) return;
    setLoading(true);
    try {
      const data = await scrapeProfile(
        formState.platform,
        formState.url,
        formState.cantidadFotos || 5
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
            <label>Enlace del perfil (URL):</label>
            <input
              type="text"
              placeholder="https://plataforma.com/usuario"
              value={formState.url}
              onChange={(e) => handleInputChange("url", e.target.value)}
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
          <div className="rv-field">
            <label>Cantidad de fotos a analizar:</label>
            <input
              type="text"
              min={0}
              max={50}
              maxLength={2}
              value={formState.cantidadFotos}
              onChange={(e) =>
                handleInputChange("cantidadFotos", Number(e.target.value))
              }
              required
            />
          </div>
          <div className="rv-buttons">
            <button 
            type="submit" 
            disabled={loading}>
              {loading ? (
                <span>
                  <ImSpinner className="spinner" /> Buscando...
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
          {dataResult ? `Datos cargados.` : "No hay información aún"}
        </div>
      </div>

      {/* Toolbar */}
      <div className="rv-navbar">
        <h4 className="rv-titulo-grafo">Opciones </h4>
        <div className="rv-left">
          <div className="rv-section">
            <button className="rv-item" onClick={() => toggle("archivo")}>
              Archivo ▾
            </button>
            {openMenu === "archivo" && (
              <div className="rv-dropdown">
                <button onClick={() => call("saveGraph")}>Guardar grafo</button>
                <div className="rv-divider" />
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
                    onClick={() =>
                      call("loadGraph", loadPlatform, loadUsername)
                    }
                  >
                    Cargar
                  </button>
                </div>
                <div className="rv-divider" />
                <button onClick={() => call("exportToExcel")}>
                  Exportar a Excel
                </button>
              </div>
            )}
          </div>
          <div className="rv-section">
            <button className="rv-item" onClick={() => toggle("insertar")}>
              Insertar ▾
            </button>
            {openMenu === "insertar" && (
              <div className="rv-dropdown">
                <button onClick={() => call("createNode")}>Nuevo nodo</button>
                <button onClick={() => call("createEdge")}>
                  Nuevo vínculo
                </button>
              </div>
            )}
          </div>
          <div className="rv-section">
            <button className="rv-item" onClick={() => toggle("editar")}>
              Editar ▾
            </button>
            {openMenu === "editar" && (
              <div className="rv-dropdown">
                <button onClick={() => call("editNodePhoto")}>
                  Editar foto (nodo)
                </button>
                <button onClick={() => call("editNodeName")}>
                  Editar nombre (nodo)
                </button>
                <button onClick={() => call("editEdgeRelation")}>
                  Editar vínculo (arista)
                </button>
                <div className="rv-divider" />
                <button onClick={() => call("deleteSelected")}>
                  Eliminar seleccionado
                </button>
              </div>
            )}
          </div>
          <div className="rv-section">
            <button
              className="rv-item"
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
