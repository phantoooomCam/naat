"use client";

import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import fetchWithAuth from "../utils/fetchWithAuth.js"; // ajusta esta ruta si tu estructura difiere

const RedVinculos = ({ idSabana }) => {
  const cyRef = useRef(null);
  const [cy, setCy] = useState(null);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const [relaciones, setRelaciones] = useState([]); // <- antes era "registros"
  const [error, setError] = useState(null);

  const getTypeText = (typeId) => {
    const typeMap = {
      0: "Datos",
      1: "MensajeriaMultimedia",
      2: "Mensaje2ViasEnt",
      3: "Mensaje2ViasSal",
      4: "VozEntrante",
      5: "VozSaliente",
      6: "VozTransfer",
      7: "VozTransito",
      8: "Ninguno",
      9: "Wifi",
      10: "ReenvioSal",
      11: "ReenvioEnt",
    };
    return typeMap?.[typeId] ?? `Tipo ${typeId}`;
  };

  const getTypeColor = (typeId) => {
    const colorMap = {
      0: "#3498db",
      1: "#9b59b6",
      2: "#2ecc71",
      3: "#27ae60",
      4: "#e74c3c",
      5: "#c0392b",
      6: "#f39c12",
      7: "#d35400",
      8: "#95a5a6",
      9: "#1abc9c",
      10: "#8e44ad",
      11: "#2c3e50",
    };
    return colorMap?.[typeId] ?? "#7f8c8d";
  };

  // 1) Traer relaciones únicas desde el endpoint nuevo
  useEffect(() => {
    if (!idSabana) return;
    const controller = new AbortController();

    const fetchRelaciones = async () => {
      try {
        setError(null);
        const API_URL = "/api";
        const url = `${API_URL}/sabanas/${idSabana}/registros/relaciones-unicas`;

        const res = await fetch(
          `/api/sabanas/${idSabana}/registros/relaciones-unicas`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            // IMPORTANTE: si tu backend usa cookie de sesión:
            credentials: "include",
          }
        );
        console.log("raw fetch status:", res?.status); // ¿200?

        // 👇 tu helper puede regresar null; evita llamar .json() en null
        if (!res) {
          setError(
            "Sin respuesta del servidor (res = null). Revisa autenticación o el helper fetchWithAuth."
          );
          setRelaciones([]);
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let data = null;
        try {
          data = await res.json();
        } catch {
          // Si no hay body o no es JSON válido
          data = null;
        }

        // Soportar: array, { items: [...] }, { Items: [...] } o un solo objeto
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.Items)
          ? data.Items
          : data
          ? [data]
          : [];

        setRelaciones(items);
      } catch (err) {
        if (err.name !== "AbortError")
          setError(err.message || "Error desconocido");
        setRelaciones([]);
      }
    };

    fetchRelaciones();
    return () => controller.abort();
  }, [idSabana]);

  // 2) Construir el grafo cuando haya relaciones
  useEffect(() => {
    const loadCytoscape = async () => {
      if (window.cytoscape) {
        initializeNetwork();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/cytoscape@3.26.0/dist/cytoscape.min.js";
      script.onload = () => initializeNetwork();
      document.head.appendChild(script);
    };

    const initializeNetwork = () => {
      if (!cyRef.current || !window.cytoscape) return;

      const numerosA = new Set();
      const numerosB = new Set();
      const edges = [];

      relaciones.forEach((r, index) => {
        // ⭐ incluir camelCase + limpiar espacios:
        const numeroA = (r.numero_a ?? r.NumeroA ?? r.numeroA ?? r.origen ?? "")
          .toString()
          .trim();
        const numeroB = (
          r.numero_b ??
          r.NumeroB ??
          r.numeroB ??
          r.destino ??
          ""
        )
          .toString()
          .trim();

        // ⭐ incluir idTipoRegistro:
        const tipoId = Number(
          r.id_tipo_registro ??
            r.IdTipoRegistro ??
            r.idTipoRegistro ??
            r.tipo ??
            8
        );

        // ⭐ incluir fechaHora:
        const fecha =
          r.fecha_hora ?? r.FechaHora ?? r.fechaHora ?? r.fecha ?? null;

        // ⭐ incluir duracion:
        const duracion = Number(r.duracion ?? r.Duracion ?? 0);

        if (!numeroA || !numeroB) return;

        numerosA.add(numeroA);
        numerosB.add(numeroB);

        edges.push({
          data: {
            id: `edge-${index}`,
            source: numeroA,
            target: numeroB,
            type: getTypeText(tipoId),
            typeId: tipoId,
            fecha,
            duracion,
            color: getTypeColor(tipoId),
          },
        });
      });

      const nodeElements = [];
      Array.from(numerosA).forEach((a) => {
        nodeElements.push({
          data: { id: a, label: a, type: "central", isNumeroA: true },
        });
      });
      Array.from(numerosB).forEach((b) => {
        if (!numerosA.has(b)) {
          nodeElements.push({
            data: { id: b, label: b, type: "peripheral", isNumeroA: false },
          });
        }
      });

      const cytoscapeInstance = window.cytoscape({
        container: cyRef.current,
        elements: [...nodeElements, ...edges],
        style: [
          {
            selector: "node[type='central']",
            style: {
              "background-color": "#e74c3c",
              label: "data(label)",
              color: "#000000",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "14px",
              "font-weight": "bold",
              width: "60px",
              height: "60px",
              "border-width": "3px",
              "border-color": "#c0392b",
            },
          },
          {
            selector: "node[type='peripheral']",
            style: {
              "background-color": "#3498db",
              label: "data(label)",
              color: "#000000",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "12px",
              width: "40px",
              height: "40px",
              "border-width": "2px",
              "border-color": "#2980b9",
            },
          },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "data(color)",
              "target-arrow-color": "data(color)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.8,
            },
          },
          {
            selector: "node:selected",
            style: {
              "background-color": "#f39c12",
              "border-color": "#e67e22",
              "border-width": "4px",
            },
          },
          { selector: "edge:selected", style: { width: 4, opacity: 1 } },
        ],
        layout: {
          name: "concentric",
          animate: true,
          animationDuration: 1000,
          concentric: (node) => (node.data("isNumeroA") ? 2 : 1),
          levelWidth: () => 1,
          minNodeSpacing: 80,
          padding: 50,
        },
      });

      // Tooltip simple en hover de edges
      cytoscapeInstance.on("mouseover", "edge", (evt) => {
        const edge = evt.target;
        const d = edge.data();
        const tooltip = document.createElement("div");
        tooltip.style.position = "absolute";
        tooltip.style.background = "rgba(0,0,0,0.8)";
        tooltip.style.color = "white";
        tooltip.style.padding = "8px";
        tooltip.style.borderRadius = "4px";
        tooltip.style.fontSize = "12px";
        tooltip.style.zIndex = "1000";
        tooltip.style.pointerEvents = "none";
        tooltip.innerHTML = `
          <strong>Tipo:</strong> ${d.type}<br>
          <strong>De:</strong> ${d.source}<br>
          <strong>A:</strong> ${d.target}<br>
          <strong>Duración:</strong> ${Math.floor((d.duracion || 0) / 60)}:${(
          (d.duracion || 0) % 60
        )
          .toString()
          .padStart(2, "0")}
        `;
        document.body.appendChild(tooltip);
        const updatePos = (e) => {
          tooltip.style.left = e.clientX + 10 + "px";
          tooltip.style.top = e.clientY + 10 + "px";
        };
        document.addEventListener("mousemove", updatePos);
        edge.on("mouseout", () => {
          document.removeEventListener("mousemove", updatePos);
          tooltip.remove();
        });
      });

      setCy(cytoscapeInstance);
      setStats({ nodes: nodeElements.length, edges: edges.length });
    };

    loadCytoscape();

    return () => {
      if (cy) cy.destroy();
    };
  }, [relaciones]);

  const resetLayout = () => {
    if (cy) {
      cy.layout({
        name: "concentric",
        animate: true,
        animationDuration: 1000,
        concentric: (node) => (node.data("isNumeroA") ? 2 : 1),
        levelWidth: () => 1,
        minNodeSpacing: 80,
        padding: 50,
      }).run();
    }
  };

  const fitToScreen = () => {
    if (cy) cy.fit(null, 50);
  };

  if (error) {
    return (
      <div className="red-vinculos-container">
        <div className="placeholder-text">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!idSabana || relaciones.length === 0) {
    return (
      <div className="red-vinculos-container">
        <div className="placeholder-text">
          <p>No hay relaciones únicas para mostrar la red de vínculos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="red-vinculos-container">
      <div className="red-vinculos-header">
        <h4>Red de Vínculos Telefónicos</h4>
        <div className="network-stats">
          <span>Nodos: {stats.nodes}</span>
          <span>Conexiones: {stats.edges}</span>
        </div>
        <div className="network-controls">
          <button onClick={resetLayout} className="network-btn">
            Reorganizar
          </button>
          <button onClick={fitToScreen} className="network-btn">
            Ajustar Vista
          </button>
        </div>
      </div>

      <div className="network-legend">
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#e74c3c" }}
          ></div>
          <span>Número Central (A)</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#3498db" }}
          ></div>
          <span>Número Contactado (B)</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#2ecc71" }}
          ></div>
          <span>Mensajes</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#f39c12" }}
          ></div>
          <span>Transfer</span>
        </div>
      </div>

      <div
        ref={cyRef}
        className="cytoscape-container"
        style={{
          width: "100%",
          height: "800px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          backgroundColor: "#f8f9fa",
        }}
      />
    </div>
  );
};

RedVinculos.propTypes = {
  idSabana: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
};

export default RedVinculos;
