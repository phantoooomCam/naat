// Fusion of WindowSeek + Navbar for RedesSociales module
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import img from "../../assets/naat_blanco.png";
import "./redes_sociales.css";
import { ImSpinner } from "react-icons/im";
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
const RedVinculosPanel = forwardRef(({ netRef, onGraphData }, ref) => {
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
  const [roots, setRoots] = useState([]);

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

  async function scrapeMultipleRoots(allRoots) {
    return fetch(`/multi-scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roots: allRoots }),
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
      // Reset roots to the current searched root
      setRoots([{ platform: formState.platform, username: formState.username }]);
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
      let data;
      // If there are accumulated roots, refresh all; otherwise scrape current form
      if (roots.length > 0) {
        data = await scrapeMultipleRoots(roots);
      } else {
        data = await scrapeProfile(
          formState.platform,
          formState.username
        );
        setRoots([{ platform: formState.platform, username: formState.username }]);
      }
      setDataResult(data);
      onGraphData && onGraphData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Expose API to add a new root and re-scrape all
  useImperativeHandle(ref, () => ({
    addRootAndScrape: async (platform, username) => {
      if (!platform || !username) return;
      const exists = roots.some((r) => r.platform === platform && r.username === username);
      const nextRoots = exists ? roots : [...roots, { platform, username }];
      setRoots(nextRoots);
      try {
        setLoading(true);
        const data = await scrapeMultipleRoots(nextRoots);
        setDataResult(data);
        onGraphData && onGraphData(data);
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
  }));

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
          
        </div>
      </div>
    </div>
  );
});

export default RedVinculosPanel;
