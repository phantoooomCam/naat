// Migrated WindowNet.jsx from net-link project
import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import edgehandles from "cytoscape-edgehandles";
import cxtmenu from "cytoscape-cxtmenu";
import undoRedo from "cytoscape-undo-redo";

cytoscape.use(dagre);
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);
cytoscape.use(undoRedo);

const SERVER_BASE = "http://192.168.100.207:8000"; // replaced by relative proxied paths

// -----------------------------
// Config / Helpers
// -----------------------------
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"]; // extensiones aceptadas en frontend
const LS_KEY_NODE_IMAGES = "windowNetNodeImages"; // persistencia local temporal (hasta que backend guarde en perfiles)
const IMAGE_RETRY_DELAY = 250; // ms para un retry tras 404

// Helpers: simple file picker for local files
function pickLocalFile({ accept } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    if (accept) input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}

// Persistencia local de imagenes para nodos (clave = username/id)
function loadPersistedNodeImages() {
  try {
    const raw = localStorage.getItem(LS_KEY_NODE_IMAGES);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function persistNodeImage(nodeId, url) {
  try {
    const current = loadPersistedNodeImages();
    current[nodeId] = url;
    localStorage.setItem(LS_KEY_NODE_IMAGES, JSON.stringify(current));
  } catch {
    // ignore
  }
}

function removePersistedNodeImage(nodeId) {
  try {
    const current = loadPersistedNodeImages();
    if (current[nodeId]) {
      delete current[nodeId];
      localStorage.setItem(LS_KEY_NODE_IMAGES, JSON.stringify(current));
    }
  } catch {}
}

function resolveStoredUrl(raw) {
  // Alias aceptados actualmente: /data/storage/... y /storage/...
  if (typeof raw !== "string") return raw;
  if (raw.startsWith("/data/storage/images/")) return raw;
  if (raw.startsWith("/storage/images/")) return raw; // alias backend
  return raw; // fallback (posible CDN futuro)
}

// Validar imagen antes de subir
function validateImageFile(file) {
  if (!file) throw new Error("No se seleccionó archivo");
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("El archivo supera 2MB");
  }
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Extensión no permitida (.${ext}). Use: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen válida");
  }
}

// Subir imagen al backend y devolver la URL pública (contrato actual)
async function uploadImageToBackend(file) {
  validateImageFile(file);
  const form = new FormData();
  form.append("file", file);
  // Determinar endpoint real: si backend expone /files/upload-image (anterior) o /upload-image
  // Preferimos usar /api/upload-image si se coloca detrás del proxy /api (ya existente)
  // Fallback: /upload-image
  const candidates = ["/files/upload-image"]; // orden de prueba
  let lastError = null;
  let resp = null;
  for (const url of candidates) {
    try {
      resp = await fetch(url, { method: "POST", body: form, credentials: "include" });
      if (resp.status !== 404) {
        // Si no es 404 asumimos que este endpoint responde (200, 400, etc.)
        break;
      }
      lastError = `Endpoint ${url} devolvió 404`;
    } catch (e) {
      lastError = e.message;
    }
  }
  if (!resp) throw new Error(lastError || "No se pudo contactar al backend");
  if (!resp.ok) {
    let detail = `Error ${resp.status}`;
    try {
      const errJson = await resp.json();
      detail = errJson?.detail || errJson?.error || detail;
    } catch {}
    throw new Error(`${detail}${lastError ? ` (${lastError})` : ""}`);
  }
  const json = await resp.json();
  if (!json?.url) throw new Error("Respuesta sin url");
  // Ya no normalizamos: usar exactamente la URL que devuelve backend
  return json.url;
}

// Layout rectangular adaptado
const applyRectangularLayout = (cy, rootId, _containerRef, opts = {}) => {
  if (!cy) return;
  const {
    cols = 20,
    cellW = 310,
    cellH = 310,
    gapX = 50,
    gapY = 50,
    leftPad = 260,
    topPad = 80,
    rootOffsetX = 140,
  } = opts;

  const root = rootId ? cy.$id(rootId) : cy.nodes().first();
  cy.startBatch();
  if (root && root.nonempty()) {
    root.position({ x: leftPad - rootOffsetX, y: topPad });
    root.data("tipo", root.data("tipo") || "perfil");
  }
  const others = cy.nodes().filter((n) => !root || n.id() !== root.id());
  const sorted = others.sort((a, b) =>
    (a.data("username") || a.id()).localeCompare(b.data("username") || b.id())
  );
  const stepX = cellW + gapX;
  const stepY = cellH + gapY;
  const startX = leftPad;
  const startY = topPad;
  sorted.forEach((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    n.position({ x: startX + col * stepX, y: startY + (row + 1) * stepY });
  });
  cy.endBatch();
  cy.layout({ name: "preset" }).run();
  cy.fit();
};

// Construir elementos desde JSON original (para primera carga via scraping)
function buildGraphData(data) {
  console.log("[buildGraphData] input:", data);
  if (!data || !data["Perfil objetivo"]) {
    console.warn("[buildGraphData] No Perfil objetivo en data");
    return [];
  }
  const nodesMap = new Map();
  const edges = [];
  const edgeSet = new Set();
  const objetivo = data["Perfil objetivo"];
  const relacionados = data["Perfiles relacionados"] || [];
  nodesMap.set(objetivo.username, {
    data: {
      id: objetivo.username,
      label: objetivo.username || objetivo.full_name,
      tipo: "perfil",
      profile_url: objetivo.profile_url,
      photo_url: objetivo.photo_url,
      username: objetivo.username,
      full_name: objetivo.full_name || objetivo.username,
    },
  });
  relacionados.forEach((rel) => {
    const id = rel.username;
    if (!nodesMap.has(id)) {
      nodesMap.set(id, {
        data: {
          id,
          label: rel.username || id,
          tipo: "rel",
          profile_url: rel.profile_url,
          photo_url: rel.photo_url,
          username: id,
          full_name: rel.full_name || id,
        },
      });
    }
    let edgeKey, sourceNode, targetNode;
    const relacion = rel["tipo de relacion"];
    if (relacion === "seguidor") {
      sourceNode = id;
      targetNode = objetivo.username;
      edgeKey = `${sourceNode}->${targetNode}->seguidor`;
    } else if (relacion === "seguido") {
      sourceNode = objetivo.username;
      targetNode = id;
      edgeKey = `${sourceNode}->${targetNode}->seguido`;
    } else {
      sourceNode = id;
      targetNode = objetivo.username;
      edgeKey = `${sourceNode}->${targetNode}->${relacion}`;
    }
    if (!edgeSet.has(edgeKey)) {
      edges.push({
        data: {
          id: edgeKey,
          source: sourceNode,
          target: targetNode,
          rel: relacion,
          relation_type: relacion,
        },
      });
      edgeSet.add(edgeKey);
    }
  });
  const result = [...nodesMap.values(), ...edges];
  console.log("[buildGraphData] output:", result);
  return result;
}

const WindowNet = forwardRef(function WindowNet({ elements }, ref) {
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const ur = useRef(null);
  const menusRef = useRef([]);
  const [platformLoad, setPlatformLoad] = useState(null);
  const [usernameLoad, setUsernameLoad] = useState(null);

  // Shared helper to open picker and update a node photo via undo/redo
  const attemptApplyNodeImage = (cy, nodeId, url, attempt = 1) => {
    const img = new Image();
    img.onload = () => {
      const ele = cy.$id(nodeId);
      if (ele && ele.nonempty()) {
        ele.data("photo_url", url);
        cy.style().update();
      }
    };
    img.onerror = () => {
      if (attempt === 1) {
        setTimeout(() => attemptApplyNodeImage(cy, nodeId, url, 2), IMAGE_RETRY_DELAY);
      } else {
        console.warn("Imagen no accesible tras retry, limpiando:", url);
        removePersistedNodeImage(nodeId);
        const ele = cy.$id(nodeId);
        if (ele && ele.nonempty()) {
          ele.data("photo_url", "");
          cy.style().update();
        }
      }
    };
    img.src = url;
  };

  const openPhotoPickerAndUpdateNode = async (nodeId, cy) => {
    try {
      const file = await pickLocalFile({ accept: "image/*" });
      if (!file) return; // usuario canceló
      const newUrl = await uploadImageToBackend(file);
      // Persistir localmente para rehidratar
      persistNodeImage(nodeId, newUrl);
      // Verificar accesibilidad antes de aplicar (se aplicará al onload)
      attemptApplyNodeImage(cy, nodeId, newUrl);
      // Undo/redo mantiene consistencia de data (photo_url) si se hace revert
      if (ur.current) ur.current.do("updateNodePhoto", { id: nodeId, newUrl });
    } catch (e) {
      console.error(e);
      alert(e.message || "No se pudo actualizar la foto del nodo.");
    }
  };

  const attachPluginsAndMenus = (cy) => {
    try {
      cy.edgehandles && cy.edgehandles({});
    } catch (e) {
      console.warn("edgehandles", e);
    }
    if (typeof cy.undoRedo === "function") {
      ur.current = cy.undoRedo({});
      const urInst = ur.current;
      urInst.action(
        "updateNodePhoto",
        ({ id, newUrl }) => {
          const ele = cy.$id(id);
          const oldUrl = ele.data("photo_url") || "";
          ele.data("photo_url", newUrl);
          cy.style().update();
          return { id, newUrl: oldUrl };
        },
        ({ id, newUrl }) => {
          const ele = cy.$id(id);
          const oldUrl = ele.data("photo_url") || "";
          ele.data("photo_url", newUrl);
          cy.style().update();
          return { id, newUrl: oldUrl };
        }
      );
      urInst.action(
        "updateNodeName",
        ({ id, newName }) => {
          const ele = cy.$id(id);
          const oldLabel = ele.data("label") || "";
          const oldFull = ele.data("full_name") || "";
          ele.data({ label: newName, full_name: newName });
          cy.style().update();
          return { id, newName: oldLabel, oldFull };
        },
        ({ id, newName }) => {
          const ele = cy.$id(id);
          const oldLabel = ele.data("label") || "";
          const oldFull = ele.data("full_name") || "";
          ele.data({ label: newName, full_name: newName });
          cy.style().update();
          return { id, newName: oldLabel, oldFull };
        }
      );
      urInst.action(
        "removeNodeWithEdges",
        ({ nodeId }) => {
          if (!nodeId) return { nodeJson: null, connectedEdges: [] };
          const node = cy.$id(nodeId);
          if (node.empty()) return { nodeJson: null, connectedEdges: [] };
          const connectedEdges = node.connectedEdges().map((e) => e.json());
          const nodeJson = node.json();
          cy.startBatch();
          cy.remove(node);
          cy.endBatch();
          return { nodeJson, connectedEdges };
        },
        ({ nodeJson, connectedEdges }) => {
          if (!nodeJson) return { nodeId: null };
          cy.startBatch();
          const addedNode = cy.add(nodeJson);
          if (Array.isArray(connectedEdges) && connectedEdges.length) {
            cy.add(connectedEdges);
          }
          cy.endBatch();
          addedNode.grabify();
          return { nodeId: nodeJson.data?.id };
        }
      );
    }
    if (menusRef.current.length) {
      menusRef.current.forEach((m) => {
        try {
          m.destroy && m.destroy();
        } catch (e) {}
      });
      menusRef.current = [];
    }
  const nodeMenu = cy.cxtmenu({
      selector: "node",
      commands: [
        {
          content: "Editar Foto",
      select: (ele) => openPhotoPickerAndUpdateNode(ele.id(), cy),
        },
        {
          content: "Editar Nombre",
          select: (ele) => {
            const newName = prompt(
              "Nuevo nombre:",
              ele.data("label") || ele.data("username") || ele.id()
            );
            if (newName && ur.current) {
              ur.current.do("updateNodeName", { id: ele.id(), newName });
            }
          },
        },
        {
          content: "Crear Vínculo",
          select: (ele) => {
            const target = prompt("Username destino:");
            const rel = prompt(
              "Relación (seguidor, seguido, comentó, reaccionó, etc.):"
            );
            if (!target || !rel) return;
            if (cy.$id(target).empty()) {
              alert(`El nodo destino "${target}" no existe.`);
              return;
            }
            const source = ele.id();
            const id = `${source}_${target}_${rel}`;
            if (!cy.$id(id).empty()) return;
            if (ur.current) {
              ur.current.do("add", {
                group: "edges",
                data: { id, source, target, relation_type: rel, rel },
              });
            } else {
              cy.add({
                group: "edges",
                data: { id, source, target, relation_type: rel, rel },
              });
            }
          },
        },
        {
          content: "Eliminar Nodo",
          select: (ele) =>
            ur.current
              ? ur.current.do("removeNodeWithEdges", { nodeId: ele.id() })
              : cy.remove(ele),
        },
      ],
    });
    const edgeMenu = cy.cxtmenu({
      selector: "edge",
      commands: [
        {
          content: "Eliminar Vínculo",
          select: (ele) => {
            if (ur.current) {
              ur.current.do("remove", ele);
            } else {
              cy.remove(ele);
            }
          },
        },
        {
          content: "Editar Relación",
          select: (ele) => {
            const current = ele.data("relation_type") || ele.data("rel") || "";
            const newRel = prompt("Nueva relación:", current);
            if (newRel) {
              const source = ele.data("source");
              const target = ele.data("target");
              ele.data({
                id: `${source}_${target}_${newRel}`,
                relation_type: newRel,
                rel: newRel,
              });
              cy.style().update();
            }
          },
        },
      ],
    });
    menusRef.current.push(nodeMenu, edgeMenu);
    cy.nodes().grabify();
    cy.autoungrabify(false);
  };

  const ensureCy = () => {
    if (cyRef.current && !cyRef.current.destroyed()) return cyRef.current;
    if (!containerRef.current) return null;
    const cy = cytoscape({
      container: containerRef.current,
      elements: buildGraphData(elements),
      layout: { name: "preset" },
      style: [
        {
          selector: "node",
          style: {
            label: "",
            "text-opacity": 0,
            "background-image": (ele) => ele.data("photo_url") || "none",
            "background-fit": "cover",
            "background-opacity": 1,
            width: (ele) => (ele.data("tipo") === "perfil" ? "400rem" : "395rem"),
            height: (ele) => (ele.data("tipo") === "perfil" ? "400rem" : "395rem"),
            "font-size": "20rem",
          },
        },
        {
          selector: "node:selected",
          style: {
            label: (ele) =>
              ele.data("label") || ele.data("username") || ele.data("id"),
            "text-opacity": 1,
            "text-valign": "bottom",
            "text-halign": "center",
            "font-size": "100rem",
          },
        },
        {
          selector: "edge",
          style: {
            label: (ele) => ele.data("relation_type") || ele.data("rel") || "",
            width: 20,
            "text-rotation": "autorotate",
            "font-size":"80rem",
            "line-color": (ele) => {
              const t = ele.data("relation_type") || ele.data("rel");
              switch (t) {
                case "comentó":
                  return "#15a7e6";
                case "seguido":
                  return "#FF4E45";
                case "seguidor":
                  return "#2885B0";
                case "reaccionó":
                  return "#e6de0b";
                default:
                  return "#1A2D42";
              }
            },
            "target-arrow-shape": "triangle",
            "target-arrow-color": (ele) => {
              const t = ele.data("relation_type") || ele.data("rel");
              switch (t) {
                case "comentó":
                  return "#15a7e6";

                case "seguido":
                  return "#FF4E45";
                case "seguidor":
                  return "#2885B0";
                case "reaccionó":
                  return "#e6de0b";

                default:
                  return "#1A2D42";
              }
            },
            "curve-style": "bezier",
          },
        },
      ],
    });
    cyRef.current = cy;
    // Rehidratar imágenes persistidas comprobando 404 y retry
    try {
      const persisted = loadPersistedNodeImages();
      if (persisted && typeof persisted === "object") {
        Object.entries(persisted).forEach(([id, rawUrl]) => {
          const url = resolveStoredUrl(rawUrl);
            const n = cy.$id(id);
            if (!n || n.empty()) return;
            // Si ya trae photo_url desde backend, no sobreescribir
            if (n.data("photo_url")) return;
            // Intentar cargar (aplicación diferida al onload)
            const img = new Image();
            img.onload = () => {
              n.data("photo_url", url);
              cy.style().update();
            };
            img.onerror = () => {
              // Retry único
              setTimeout(() => {
                const img2 = new Image();
                img2.onload = () => {
                  n.data("photo_url", url);
                  cy.style().update();
                };
                img2.onerror = () => {
                  console.warn("Rehidratación fallida imagen nodo", id, url);
                  removePersistedNodeImage(id);
                };
                img2.src = url;
              }, IMAGE_RETRY_DELAY);
            };
            img.src = url;
        });
      }
    } catch {}
    attachPluginsAndMenus(cy);
    return cy;
  };

  // Rebuild graph when new raw data (from Buscar / Actualizar) arrives
  useEffect(() => {
    if (!elements) return; // nothing to do
    const isRaw = !!(
      elements["Perfil objetivo"] && elements["Perfiles relacionados"]
    );
    // Don't interfere with graph-session loading (handled inside getGraphSession)
    if (!isRaw) return;
    const cy = ensureCy();
    if (!cy) return;
    console.log("[WindowNet] Rebuilding graph from raw data");
    const built = buildGraphData(elements);
    cy.startBatch();
    cy.elements().remove();
    cy.add(built);
    cy.endBatch();
    cy.nodes().grabify();
    const root = elements?.["Perfil objetivo"]?.username;
    applyRectangularLayout(cy, root, containerRef, {
      cellW: 510,
      cellH: 510,
      gapX: 50,
      gapY: 50,
      topPad: 80,
      leftPad: 140,
      rootOffsetX: 140,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  // Acciones expuestas
  const createNode = () => {
    const cy = ensureCy();
    if (!cy) return;
    const name = prompt("Username del nuevo nodo:");
    if (!name) return;
    const photo = prompt("URL de la foto (o ruta del backend):", "");
    const center = { x: cy.width() / 2, y: cy.height() / 2 };
    const nodeJson = {
      group: "nodes",
      data: {
        id: name,
        username: name,
        label: name,
        full_name: name,
        photo_url: photo || "",
        tipo: "perfil",
        updated_at: new Date().toISOString(),
      },
      position: center,
    };
    if (ur.current) {
      ur.current.do("add", nodeJson);
    } else {
      cy.add(nodeJson);
    }
  };
  const deleteSelected = () => {
    const cy = ensureCy();
    if (!cy) return;
    const sel = cy.$(":selected");
    if (sel.nonempty()) {
      cy.startBatch();
      sel.forEach((ele) => {
        if (ele.isNode() && ur.current) {
          ur.current.do("removeNodeWithEdges", { nodeId: ele.id() });
        } else if (ele.isEdge() && ur.current) {
          ur.current.do("remove", ele);
        } else {
          cy.remove(ele);
        }
      });
      cy.endBatch();
    }
  };
  const editNodePhoto = async () => {
    const cy = ensureCy();
    if (!cy) return;
    const n = cy.$("node:selected").first();
    if (n && n.length) {
      await openPhotoPickerAndUpdateNode(n.id(), cy);
    } else alert("Selecciona un nodo para editar su foto.");
  };
  const editNodeName = () => {
    const cy = ensureCy();
    if (!cy) return;
    const n = cy.$("node:selected").first();
    if (n && n.length) {
      const current = n.data("label") || n.data("username") || n.id();
      const newName = prompt("Nuevo nombre:", current);
      if (newName && ur.current) {
        ur.current.do("updateNodeName", { id: n.id(), newName });
      }
    } else alert("Selecciona un nodo para editar su nombre.");
  };
  const createEdge = () => {
    const cy = ensureCy();
    if (!cy) return;
    const selNodes = cy.$("node:selected");
    let source, target;
    if (selNodes.length >= 2) {
      source = selNodes[0].id();
      target = selNodes[1].id();
    } else if (selNodes.length === 1) {
      source = selNodes[0].id();
      target = prompt("Username destino:");
    } else {
      source = prompt("Username source:");
      target = prompt("Username destino:");
    }
    if (!source || !target) return;
    if (cy.$id(target).empty() || cy.$id(source).empty()) {
      alert("El nodo source/target no existe.");
      return;
    }
    const rel = prompt(
      "Relación (seguidor, seguido, comentó, reaccionó, etc.):",
      "relacion"
    );
    if (!rel) return;
    const id = `${source}_${target}_${rel}`;
    if (cy.$id(id).nonempty && !cy.$id(id).empty()) return;
    if (ur.current) {
      ur.current.do("add", {
        group: "edges",
        data: { id, source, target, relation_type: rel, rel },
      });
    } else {
      cy.add({
        group: "edges",
        data: { id, source, target, relation_type: rel, rel },
      });
    }
  };
  const deleteSelectedEdge = () => {
    const cy = ensureCy();
    if (!cy) return;
    const e = cy.$("edge:selected");
    if (e.nonempty()) {
      if (ur.current) {
        ur.current.do("remove", e);
      } else {
        cy.remove(e);
      }
    } else alert("Selecciona una arista para eliminar.");
  };
  const editEdgeRelation = () => {
    const cy = ensureCy();
    if (!cy) return;
    const e = cy.$("edge:selected").first();
    if (e && e.length) {
      const current = e.data("relation_type") || e.data("rel") || "";
      const newRel = prompt("Nueva relación:", current);
      if (newRel) {
        const source = e.data("source");
        const target = e.data("target");
        e.data({
          id: `${source}_${target}_${newRel}`,
          relation_type: newRel,
          rel: newRel,
        });
        cy.style().update();
      }
    } else alert("Selecciona una arista para editar.");
  };
  const undo = () => {
    if (ur.current && typeof ur.current.undo === "function") ur.current.undo();
  };
  const redo = () => {
    if (ur.current && typeof ur.current.redo === "function") ur.current.redo();
  };

  const buildExportDataFromCy = () => {
    const cy = cyRef.current;
    if (!cy) return null;
    const platform =
      elements?.["Perfil objetivo"]?.["platform"] ?? platformLoad ?? "";
    const owner_username =
      elements?.["Perfil objetivo"]?.["username"] ?? usernameLoad ?? "";
    if (!owner_username) return null;
    const rootNode = cy.$id(owner_username);
    const rootData = rootNode?.data ? rootNode.data() : {};
    const perfilesRelacionados = [];
    cy.nodes().forEach((n) => {
      if (n.id() === owner_username) return;
      const e = cy
        .edges(
          `[source = "${owner_username}"][target = "${n.id()}"] , [target = "${owner_username}"][source = "${n.id()}"]`
        )
        .first();
      if (!e || e.empty()) return;
      const d = n.data() || {};
      const rel = e.data("relation_type") || e.data("rel") || "";
      perfilesRelacionados.push({
        username: d.username || n.id(),
        full_name: d.full_name || d.label || n.id(),
        profile_url: d.profile_url || "",
        photo_url: d.photo_url || "",
        "tipo de relacion": rel || "relacion",
      });
    });
    return {
      "Perfil objetivo": {
        platform,
        username: owner_username,
        full_name: rootData?.full_name || rootData?.label || owner_username,
        photo_url: rootData?.photo_url || "",
        profile_url: rootData?.profile_url || "",
      },
      "Perfiles relacionados": perfilesRelacionados,
    };
  };

  const exportToExcel = async () => {
    const data = buildExportDataFromCy();
    if (!data) {
      alert("No hay datos para exportar.");
      return;
    }
    try {
      const resp = await fetch(`/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const name = data?.["Perfil objetivo"]?.["username"] || "grafo";
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error al exportar a Excel");
    }
  };

  // Guardar grafo como archivo local (JSON) con File System Access API + fallback
  const saveGraphAsLocalFile = async () => {
    const cy = cyRef.current;
    if (!cy) return;
    const payload = {
      elements: {
        nodes: cy.nodes().map((n) => ({
          data: n.data(),
          position: n.position(),
        })),
        edges: cy.edges().map((e) => ({ data: e.data() })),
      },
      layout: { name: "preset" },
      meta: { exported_at: new Date().toISOString() },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const defaultName = "grafo.json";
    try {
      if ("showSaveFilePicker" in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultName,
          types: [
            { description: "JSON", accept: { "application/json": [".json"] } },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el archivo local.");
    }
  };

  // Cargar grafo desde archivo local (JSON) y renderizarlo
  const loadGraphFromLocalFile = async () => {
    try {
      const file = await pickLocalFile({ accept: "application/json" });
      if (!file) return;
      const text = await file.text();
      const json = JSON.parse(text);

      const cy = ensureCy();
      if (!cy) return;

      let nodes = [];
      let edges = [];

      // Formato sesión guardada
      if (Array.isArray(json?.elements?.nodes) || Array.isArray(json?.elements?.edges)) {
        nodes = json.elements.nodes || [];
        edges = json.elements.edges || [];
      // Formato crudo (scrape/related)
      } else if (json?.["Perfil objetivo"]) {
        const built = buildGraphData(json);
        const sep = built.reduce(
          (acc, el) => {
            if (el.data?.source) acc.edges.push(el);
            else acc.nodes.push(el);
            return acc;
          },
          { nodes: [], edges: [] }
        );
        nodes = sep.nodes;
        edges = sep.edges;
      } else {
        alert("Formato de archivo no reconocido.");
        return;
      }

      cy.startBatch();
      cy.elements().remove();
      cy.add([...(nodes || []), ...(edges || [])]);
      cy.endBatch();
      cy.nodes().grabify();

      const rootId =
        json?.["Perfil objetivo"]?.username ||
        nodes?.find?.((n) => n?.data?.tipo === "perfil")?.data?.id ||
        nodes?.[0]?.data?.id ||
        null;

      const hasPreset =
        json?.layout?.name === "preset" &&
        (nodes || []).some((n) => n?.position && typeof n.position.x === "number");

      if (hasPreset) {
        cy.layout({ name: "preset" }).run();
      } else {
        applyRectangularLayout(cy, rootId, containerRef, {
          cellW: 310,
          cellH: 310,
          gapX: 10,
          gapY: 10,
          leftPad: 240,
          topPad: 80,
          rootOffsetX: 140,
        });
      }
      cy.fit();
      attachPluginsAndMenus(cy);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar el archivo local.");
    }
  };

  const saveGraph = async () => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const nodes = cy.nodes().map((n) => {
      const d = n.data() || {};
      return {
        data: {
          id: n.id(),
          username: d.username || n.id(),
          label: d.label || d.username || d.full_name || n.id(),
          full_name: d.full_name || d.label || n.id(),
          photo_url: d.photo_url || "",
          profile_url: d.profile_url || "",
          tipo: d.tipo || d.type || "rel",
          updated_at: d.updated_at || new Date().toISOString(),
        },
        position: n.position(),
      };
    });
    const edgeSeen = new Set();
    const edges = cy.edges().map((e) => {
      const d = e.data() || {};
      const source = d.source || e.source().id();
      const target = d.target || e.target().id();
      const relation_type = d.relation_type || d.rel || "relacion";
      let id = d.id || e.id() || `${source}_${target}_${relation_type}`;
      if (edgeSeen.has(id)) {
        id = `${id}_${Math.random().toString(36).slice(2, 8)}`;
      }
      edgeSeen.add(id);
      return {
        data: { id, source, target, relation_type, rel: relation_type },
      };
    });
    const platform =
      elements?.["Perfil objetivo"]?.["platform"] ?? platformLoad ?? "";
    const owner_username =
      elements?.["Perfil objetivo"]?.["username"] ?? usernameLoad ?? "";
    const payload = {
      platform,
      owner_username,
      elements: { nodes, edges },
      layout: { name: "preset" },
      meta: { saved_at: new Date().toISOString(), app: "net-link" },
    };
    try {
      const resp = await fetch(`/graph-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result?.detail || "Unprocessable entity");
      alert("Grafo guardado exitosamente.");
    } catch (err) {
      console.error(err);
      alert("Hubo un error al guardar el grafo.");
    }
  };

  const getGraphSession = async (platform, username) => {
    try {
      const resp = await fetch(`/graph-session/${platform}/${username}`);
      const data = await resp.json();
      if (!resp.ok) {
        console.error("Error fetching graph session:", data);
        alert("No se pudo cargar el grafo.");
        return;
      }
      setPlatformLoad(platform);
      setUsernameLoad(username);
      const savedNodes = Array.isArray(data?.elements?.nodes)
        ? data.elements.nodes
        : [];
      const savedEdges = Array.isArray(data?.elements?.edges)
        ? data.elements.edges
        : [];
      const savedLayout = data?.layout;
      const cy = ensureCy();
      if (!cy) {
        alert("El contenedor del grafo aún no está listo.");
        return;
      }
      const elementsToAdd = [];
      savedNodes.forEach((n) => {
        if (!n?.data?.id) return;
        elementsToAdd.push({
          group: "nodes",
          data: {
            ...n.data,
            id: n.data.id,
            tipo: n.data.tipo || n.data.type || "rel",
          },
          position:
            n.position && typeof n.position.x === "number"
              ? n.position
              : undefined,
        });
      });
      savedEdges.forEach((e) => {
        if (!e?.data?.source || !e?.data?.target) return;
        const rel = e?.data?.relation_type || e?.data?.rel || "";
        const id =
          e?.data?.id ||
          `${e.data.source}_${e.data.target}_${rel || "relacion"}`;
        elementsToAdd.push({
          group: "edges",
          data: {
            id,
            source: e.data.source,
            target: e.data.target,
            relation_type: rel,
            rel,
          },
        });
      });
      cy.startBatch();
      cy.elements().remove();
      cy.add(elementsToAdd);
      cy.endBatch();
      cy.nodes().grabify();
      const hasPreset =
        savedLayout?.name === "preset" &&
        savedNodes.some((n) => n?.position && typeof n.position.x === "number");
      if (hasPreset) {
        cy.layout({ name: "preset" }).run();
      } else {
        applyRectangularLayout(cy, username, containerRef, {
          cellW: 310,
          cellH: 310,
          gapX: 50,
          gapY: 50,
          leftPad: 240,
          topPad: 80,
          rootOffsetX: 140,
        });
      }
      cy.fit();
      attachPluginsAndMenus(cy);
    } catch (error) {
      console.error("Error fetching graph session:", error);
      alert("Hubo un error al cargar el grafo.");
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      saveGraph,
      loadGraph: (platform, username) => getGraphSession(platform, username),
      createNode,
      deleteSelected,
      editNodePhoto,
      editNodeName,
      createEdge,
      deleteSelectedEdge,
      editEdgeRelation,
      undo,
      redo,
      exportToExcel,
  saveAsLocal: saveGraphAsLocalFile,
  loadFromLocal: loadGraphFromLocalFile,
      layoutRectangular: () => {
        if (!cyRef.current) return;
        const cy = cyRef.current;
        const root =
          elements?.["Perfil objetivo"]?.["username"] || usernameLoad || null;
        applyRectangularLayout(cy, root, {
          cols: 20,
          cellW: 310,
          cellH: 310,
          gapX: 50,
          gapY: 50,
          leftPad: 260,
          topPad: 80,
          rootOffsetX: 140,
        });
      },
    }),
    [elements, usernameLoad]
  );

  // Inicializar grafo a partir de elementos (scrape inicial)
  useEffect(() => {
    const cy = ensureCy();
    if (!cy) return;
    const plataforma = elements?.["Perfil objetivo"]?.["platform"];
    const usuario = elements?.["Perfil objetivo"]?.["username"];
    if (plataforma) setPlatformLoad(plataforma);
    if (usuario) setUsernameLoad(usuario); // Layout inicial
    const root = usuario;
    applyRectangularLayout(cy, root, containerRef, {
      cellW: 510,
      cellH: 510,
      gapX: 50,
      gapY: 50,
      topPad: 80,
      leftPad: 140,
      rootOffsetX: 140,
    });
  }, [elements]);

  return (
    <div
      ref={containerRef}
      className="netlink-graph-container"
      style={{ width: "100%", height: "100%" }}
    />
  );
});

export default WindowNet;
