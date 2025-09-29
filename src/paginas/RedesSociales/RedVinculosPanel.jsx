// Fusion of WindowSeek + Navbar for RedesSociales module
import React, { useState, useEffect } from "react";
import img from "../../assets/naat_blanco.png";
import "./redes_sociales.css";
import { ImSpinner } from "react-icons/im";

// Espera ref del grafo (WindowNet) via props
const RedVinculosPanel = ({ netRef, onGraphData }) => {
  const platformOptions = ["facebook", "instagram", "x"];
  const [openMenu, setOpenMenu] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [showAddRoot, setShowAddRoot] = useState(false);
  const [formErrors, setFormErrors] = useState({ url: true, username: true });
  // Mensajes de error por campo (solo se usa si formErrors[campo] === false)
  const [errorMsg, setErrorMsg] = useState({ url: "" });
  const DEFAULT_FORM = {
    url: "",
    platform: "",
    cantidadFotos: 1,
  };
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [dataResult, setDataResult] = useState(null);
  const [roots, setRoots] = useState([]); // array de {platform, username}
  const [newRootPlatform, setNewRootPlatform] = useState("instagram");
  const [newRootUsername, setNewRootUsername] = useState("");
  const [warnings, setWarnings] = useState([]);
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


  // Llamada al endpoint multi-root
  function multiScrape(body) {
    return fetch(`/multi-scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(async (r) => {
      let json = null;
      try {
        json = await r.json();
      } catch {
        json = null;
      }
      if (!r.ok) throw new Error(json?.error?.message || `Error ${r.status}`);
      return json;
    });
  }

  // Buscar / agregar root usando formulario principal
  const handleFetchOrScrape = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (formErrors.url === false) return;
    if (!formState.platform || !formState.username) return;
    setLoading(true);

    try {
      let updatedRoots = roots;
      if (!roots.some(r => r.platform === formState.platform && r.username === formState.username)) {
        updatedRoots = [...roots, { platform: formState.platform, username: formState.username }];
        setRoots(updatedRoots);
      }
      const reqBody = { roots: updatedRoots };
      const json = await multiScrape(reqBody);
      setWarnings(json.warnings || []);
      setDataResult(json);
      if (updatedRoots.length === 1) {
        onGraphData && onGraphData(json);
      } else if (netRef?.current?.mergeMultiRootPayload) {
        netRef.current.mergeMultiRootPayload(json);
      } else {
        onGraphData && onGraphData(json);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error al cargar datos");
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
      // Fuerza re-scrape solo de ese root y lo fusiona
      const json = await multiScrape({ roots: [{ platform: formState.platform, username: formState.username }] });
      setWarnings(json.warnings || []);
      if (!roots.some(r => r.platform === formState.platform && r.username === formState.username)) {
        setRoots(prev => [...prev, { platform: formState.platform, username: formState.username }]);
      }
      if (netRef?.current?.mergeMultiRootPayload && roots.length) {
        netRef.current.mergeMultiRootPayload(json);
      } else {
        onGraphData && onGraphData(json);
      }
      setDataResult(json);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error forzando root");
    } finally {
      setLoading(false);
    }
  };

  const addAnotherRoot = async () => {
    if (!newRootPlatform || !newRootUsername) return;
    if (roots.some(r => r.platform === newRootPlatform && r.username === newRootUsername)) {
      alert("Ese root ya está cargado");
      return;
    }
    setLoading(true);
    try {
      const json = await multiScrape({ roots: [{ platform: newRootPlatform, username: newRootUsername }] });
      setWarnings(json.warnings || []);
      setRoots(prev => [...prev, { platform: newRootPlatform, username: newRootUsername }]);
      if (netRef?.current?.mergeMultiRootPayload) {
        netRef.current.mergeMultiRootPayload(json);
      } else {
        onGraphData && onGraphData(json);
      }
      setShowAddRoot(false);
      setNewRootUsername("");
      setDataResult(json);
    } catch (e) {
      console.error(e);
      alert(e.message || "Error agregando root");
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
    <h3 className="rv-title">Red de vínculos (multi-root)</h3>
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

            <button type="submit" disabled={loading}>
              {loading ? <ImSpinner className="spinner" /> : roots.length ? "Agregar / Refrescar" : "Buscar"}
            </button>
            <button type="button" onClick={handleForceScrape} disabled={loading}>
              Forzar (solo root actual)
            </button>
          </div>
        </form>
        <div className="rv-status">
          {dataResult ? `Roots: ${roots.length}` : "No hay información aún"}
        </div>
        {roots.length > 0 && (
          <div className="rv-roots-chips">
            {roots.map(r => (
              <span key={`${r.platform}:${r.username}`} className="rv-chip">
                {r.platform}:{r.username}
              </span>
            ))}
          </div>
        )}
        {warnings.length > 0 && (
          <div className="rv-warnings">
            {warnings.map((w,i)=>(<div key={i} className="rv-warning-item">⚠ {w.code || w}</div>))}
          </div>
        )}
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
                <button onClick={() => call("saveAsLocal")}>Guardar como (archivo)</button>
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
                <button onClick={() => call("loadFromLocal")}>Cargar desde archivo</button>
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
          <button
            className="rv-item"
            title="Agregar otro root"
            type="button"
            onClick={() => setShowAddRoot(s=>!s)}
          >
            + Root
          </button>
          {showAddRoot && (
            <div className="rv-add-root-pop">
              <div className="rv-add-root-inner">
                <h4>Añadir Root</h4>
                <div className="rv-field-inline">
                  <select value={newRootPlatform} onChange={e=>setNewRootPlatform(e.target.value)}>
                    {platformOptions.map(p=> <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="username"
                    value={newRootUsername}
                    onChange={e=>setNewRootUsername(e.target.value)}
                  />
                </div>
                <div className="rv-buttons-inline">
                  <button type="button" disabled={loading || !newRootUsername} onClick={addAnotherRoot}>{loading? <ImSpinner className="spinner" /> : 'Agregar'}</button>
                  <button type="button" onClick={()=>setShowAddRoot(false)}>Cerrar</button>
                </div>
              </div>
            </div>
          )}
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
