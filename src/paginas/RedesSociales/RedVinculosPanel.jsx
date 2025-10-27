// Fusion of WindowSeek + Navbar for RedesSociales module
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import img from "../../assets/naat_blanco.png";
import "./redes_sociales.css";
import { ImSpinner } from "react-icons/im";
 

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
  
  const DEFAULT_FORM = {
    username: "",
    platform: "",
  };
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [dataResult, setDataResult] = useState(null);
  
  const [roots, setRoots] = useState([]);

  useEffect(() => {
    localStorage.setItem("rv_formState", JSON.stringify(formState));
  }, [formState]);

  
  

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
    // Export a screenshot of the panel (.redvinc-panel) to a PDF file
    exportToPDF: async (filename = null) => {
      try {
        const el = document.querySelector('.netlink-graph-container');
        if (!el) {
          alert('No se encontró el panel para exportar.');
          return;
        }

        // helper to dynamically load scripts
        const loadScript = (src) =>
          new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => resolve();
            s.onerror = (e) => reject(e);
            document.head.appendChild(s);
          });

        // Ensure html2canvas and jsPDF are available (load from CDN if needed)
        if (typeof window.html2canvas === 'undefined') {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }

        const html2canvas = window.html2canvas;
        let jsPDFConstructor = null;
        if (window.jspdf && window.jspdf.jsPDF) jsPDFConstructor = window.jspdf.jsPDF;
        else if (window.jsPDF) jsPDFConstructor = window.jsPDF;
        else if (window.jspdf) jsPDFConstructor = window.jspdf;

        if (!html2canvas || !jsPDFConstructor) {
          alert('Librerías necesarias no disponibles para exportar a PDF.');
          return;
        }

        // Render the element to canvas (higher scale for quality)
        const canvas = await html2canvas(el, { useCORS: true, scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        // Create a PDF and fit the image preserving aspect ratio
        const doc = new jsPDFConstructor('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10; // mm
        let imgWidth = pageWidth - margin * 2;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;
        if (imgHeight > pageHeight - margin * 2) {
          imgHeight = pageHeight - margin * 2;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        doc.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, margin, imgWidth, imgHeight);
        const name = filename || (formState.username ? `${formState.username}.pdf` : 'grafo.pdf');
        doc.save(name);
      } catch (e) {
        console.error('exportToPDF error', e);
        alert('No se pudo exportar a PDF.');
      }
    },
  }));

  

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

      {/* Toolbar moved to top bar in redes_sociales.jsx */}
    </div>
  );
});

export default RedVinculosPanel;
