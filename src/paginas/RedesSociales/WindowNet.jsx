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

// Construir elementos desde JSON (soporta esquema legacy y schema_version 2)
function buildGraphData(data) {
  console.log("[buildGraphData] input:", data);
  if (!data) return [];

  // Nuevo esquema v2: { schema_version, root_profiles, profiles[], relations[] }
  const isV2 =
    data.schema_version === 2 ||
    (Array.isArray(data.root_profiles) && Array.isArray(data.profiles));
  if (isV2) {
    const nodesMap = new Map();
    const edges = [];
    const edgeSet = new Set();

    const rootSet = new Set(
      (data.root_profiles || [])
        .filter((s) => typeof s === "string")
        .map((s) => s.trim())
    );

    // Crear nodos
    for (const p of data.profiles || []) {
      if (!p || !p.username) continue;
      const id = p.username;
      const rootKey = `${p.platform}:${p.username}`;
      const isRoot = rootSet.has(rootKey);
      if (!nodesMap.has(id)) {
        nodesMap.set(id, {
          data: {
            id,
            username: p.username,
            platform: p.platform,
            label: p.username || p.full_name || id,
            full_name: p.full_name || p.username || id,
            profile_url: p.profile_url || "",
            photo_url: p.photo_url || "",
            tipo: isRoot ? "perfil" : "rel",
            sources: Array.isArray(p.sources) ? p.sources : [],
          },
        });
      }
    }

    // Crear aristas
    for (const r of data.relations || []) {
      if (!r || !r.source || !r.target) continue;
      const rel = r.type || r.relation_type || r.rel || "relacion";
      const id = `${r.source}_${r.target}_${rel}`;
      if (edgeSet.has(id)) continue;
      edges.push({
        data: {
          id,
          source: r.source,
          target: r.target,
          relation_type: rel,
          rel,
          platform: r.platform || undefined,
        },
      });
      edgeSet.add(id);
    }

    const result = [...nodesMap.values(), ...edges];
    console.log("[buildGraphData] output(v2):", result);
    return result;
  }

  // Legacy: { "Perfil objetivo": {...}, "Perfiles relacionados": [...] }
  if (!data["Perfil objetivo"]) {
    console.warn("[buildGraphData] Formato no reconocido");
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
  console.log("[buildGraphData] output(legacy):", result);
  return result;
}

const WindowNet = forwardRef(function WindowNet({ elements, onAddRoot }, ref) {
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const ur = useRef(null);
  const menusRef = useRef([]);
  const [platformLoad, setPlatformLoad] = useState(null);
  const [usernameLoad, setUsernameLoad] = useState(null);
  // UI para agregar perfiles (scraping directo desde WindowNet)
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [addPlatform, setAddPlatform] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

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

  // WindowNet ya no hace POST; delega a RedVinculosPanel vía onAddRoot

  // Rebuild graph when new raw data arrives (legacy or schema v2)
  useEffect(() => {
    if (!elements) return; // nothing to do
    const isLegacy = !!(
      elements?.["Perfil objetivo"] && elements?.["Perfiles relacionados"]
    );
    const isV2 =
      elements?.schema_version === 2 ||
      (Array.isArray(elements?.profiles) && Array.isArray(elements?.root_profiles));
    // Don't interfere with graph-session loading (handled inside getGraphSession)
    if (!isLegacy && !isV2) return;
    const cy = ensureCy();
    if (!cy) return;
    console.log("[WindowNet] Rebuilding graph from raw data");
    const built = buildGraphData(elements);
    cy.startBatch();
    cy.elements().remove();
    cy.add(built);
    cy.endBatch();
    cy.nodes().grabify();
    let root = null;
    if (isLegacy) {
      root = elements?.["Perfil objetivo"]?.username;
    } else if (isV2) {
      const firstRoot = (elements.root_profiles || [])[0] || null;
      if (firstRoot && typeof firstRoot === "string") {
        const parts = firstRoot.split(":");
        root = parts[1] || null;
      }
    }
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
    const platform = platformLoad ?? elements?.["Perfil objetivo"]?.["platform"] ?? "";
    const owner_username = usernameLoad ?? elements?.["Perfil objetivo"]?.["username"] ?? "";
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
      // Formato schema v2
      } else if (json?.schema_version === 2 || (Array.isArray(json?.profiles) && Array.isArray(json?.root_profiles))) {
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

      let rootId = null;
      if (json?.schema_version === 2 && Array.isArray(json?.root_profiles) && json.root_profiles[0]) {
        const firstRoot = json.root_profiles[0];
        if (typeof firstRoot === "string") rootId = firstRoot.split(":")[1] || null;
      }
      if (!rootId) {
        rootId =
          json?.["Perfil objetivo"]?.username ||
          nodes?.find?.((n) => n?.data?.tipo === "perfil")?.data?.id ||
          nodes?.[0]?.data?.id ||
          null;
      }

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
    const platform = platformLoad ?? elements?.["Perfil objetivo"]?.["platform"] ?? "";
    const owner_username = usernameLoad ?? elements?.["Perfil objetivo"]?.["username"] ?? "";
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

        // Identify parent nodes: prefer nodes explicitly marked as 'perfil'
        let parents = cy.nodes().filter((n) => n.data("tipo") === "perfil");
        // Fallback: nodes with no incoming edges
        if (!parents || parents.length === 0) {
          parents = cy
            .nodes()
            .filter((n) => n.incomers("edge").length === 0);
        }

        // If still nothing, fallback to previous rectangular layout for all nodes
        if (!parents || parents.length === 0) {
          let root = usernameLoad || null;
          if (
            !root &&
            elements?.schema_version === 2 &&
            Array.isArray(elements?.root_profiles)
          ) {
            const firstRoot = elements.root_profiles[0];
            if (typeof firstRoot === "string") root = firstRoot.split(":")[1] || null;
          } else if (!root) {
            root = elements?.["Perfil objetivo"]?.["username"] || null;
          }
          applyRectangularLayout(cy, root, containerRef, {
            cols: 20,
            cellW: 310,
            cellH: 310,
            gapX: 50,
            gapY: 50,
            leftPad: 260,
            topPad: 80,
            rootOffsetX: 140,
          });
          return;
        }

        // Layout parents in a compact rectangular grid
        const pCount = parents.length;
        const cols = Math.max(1, Math.ceil(Math.sqrt(pCount)));
        const cellW = 480;
        const cellH = 480;
        const gapX = 80;
        const gapY = 80;
        const leftPad = 140;
        const topPad = 80;

        parents.forEach((p, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = leftPad + col * (cellW + gapX);
          const y = topPad + row * (cellH + gapY);
          p.position({ x, y });
          p.data("tipo", "perfil");
        });

        // Scale node dimensions based on total node count (apply before perimeter placement)
        const totalNodes = cy.nodes().length;
        let scale = 1;
        if (totalNodes < 20) scale = 0.9; // 10% smaller
        else if (totalNodes < 50) scale = 0.8; // 20% smaller
        else if (totalNodes < 80) scale = 0.6; // 40% smaller
        else scale = 0.4; // 60% smaller for 80 or more
        const baseProfile = 400;
        const baseRel = 395;
        cy.nodes().forEach((n) => {
          const isPerfil = n.data("tipo") === "perfil";
          const base = isPerfil ? baseProfile : baseRel;
          n.style("width", base * scale);
          n.style("height", base * scale);
        });

        // For each parent, arrange its direct neighbors (non-parent nodes) along the parent's perimeter
        // Use rectangular perimeters expanding outward as needed
        const basePad = 50; // distance from parent border to first perimeter
        const ringSpacing = 110; // distance between subsequent perimeters
        const minGapFactor = 1.2; // child size multiplier to avoid overlap

        parents.forEach((parent) => {
          const pId = parent.id();
          const connected = parent.connectedEdges();
          const childIds = new Set();
          connected.forEach((e) => {
            const s = e.data("source");
            const t = e.data("target");
            if (s && s !== pId) childIds.add(s);
            if (t && t !== pId) childIds.add(t);
          });
          const children = Array.from(childIds)
            .map((id) => cy.$id(id))
            .filter((n) => n && n.nonempty() && n.data("tipo") !== "perfil");
          if (!children || children.length === 0) return;

          const pPos = parent.position();
          const pW = parent.width();
          const pH = parent.height();

          // Estimate child dimension using the first child's width, fallback to baseRel * scale
          let childDim = children[0]?.width?.() || baseRel * scale;
          if (!childDim || Number.isNaN(childDim)) childDim = baseRel * scale;
          const minSpacing = Math.max(40, childDim * minGapFactor);

          let placed = 0;
          let ring = 1;
          while (placed < children.length) {
            const rx = pW / 2 + basePad + (ring - 1) * ringSpacing;
            const ry = pH / 2 + basePad + (ring - 1) * ringSpacing;
            const perimeter = 2 * (2 * rx + 2 * ry); // rectangle perimeter length
            const capacity = Math.max(1, Math.floor(perimeter / minSpacing));
            const remaining = children.length - placed;
            const perRing = Math.min(capacity, remaining);
            for (let j = 0; j < perRing; j++) {
              const s = (j / perRing) * perimeter; // distance along perimeter
              let xRel = 0;
              let yRel = 0;
              const topLen = 2 * rx;
              const rightLen = 2 * ry;
              const bottomLen = 2 * rx;
              const leftLen = 2 * ry;
              if (s <= topLen) {
                // Top edge: left -> right at y = -ry
                xRel = -rx + s;
                yRel = -ry;
              } else if (s <= topLen + rightLen) {
                // Right edge: top -> bottom at x = +rx
                const ds = s - topLen;
                xRel = rx;
                yRel = -ry + ds;
              } else if (s <= topLen + rightLen + bottomLen) {
                // Bottom edge: right -> left at y = +ry
                const ds = s - (topLen + rightLen);
                xRel = rx - ds;
                yRel = ry;
              } else {
                // Left edge: bottom -> top at x = -rx
                const ds = s - (topLen + rightLen + bottomLen);
                xRel = -rx;
                yRel = ry - ds;
              }
              const child = children[placed + j];
              child.position({ x: pPos.x + xRel, y: pPos.y + yRel });
              child.data("tipo", child.data("tipo") || "rel");
            }
            placed += perRing;
            ring += 1;
          }
        });

        // Apply preset so Cytoscape honors positions, then fit
        cy.layout({ name: "preset" }).run();
        cy.fit();
      },
    }),
    [elements, usernameLoad]
  );

  // Inicializar grafo a partir de elementos (scrape inicial)
  useEffect(() => {
    const cy = ensureCy();
    if (!cy) return;
    let plataforma = elements?.["Perfil objetivo"]?.["platform"]; 
    let usuario = elements?.["Perfil objetivo"]?.["username"];
    if (elements?.schema_version === 2) {
      const firstRoot = (elements.root_profiles || [])[0];
      if (typeof firstRoot === "string") {
        const [plat, user] = firstRoot.split(":");
        plataforma = plat || plataforma;
        usuario = user || usuario;
      }
    }
    if (plataforma) setPlatformLoad(plataforma);
    if (usuario) setUsernameLoad(usuario); // Layout inicial
    const root = usuario || null;
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
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={containerRef}
        className="netlink-graph-container"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Botón flotante "+" */}
      <button
        type="button"
        onClick={() => setShowAddMenu((v) => !v)}
        title="Agregar perfil (scrape)"
        style={{
          position: "absolute",
          right: 16,
          top: 10,
          width: 48,
          height: 48,
          borderRadius: 24,
          border: "none",
          background: "#1A2D42",
          color: "#fff",
          fontSize: 24,
          cursor: "pointer",
          zIndex: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        +
      </button>

      {showAddMenu && (
        <div
          style={{
            position: "absolute",
            right: 16,
            top: 5,
            zIndex: 11,
            background: "#fff",
            color: "#000",
            padding: 16,
            borderRadius: 12,
            width: 280,
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            border: "1px solid transparent",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>Agregar perfil</strong>
            <button
              onClick={() => setShowAddMenu(false)}
              style={{ background: "transparent", color: "#000", border: "2px solid transparent", fontSize: 18, cursor: "pointer" }}
              title="Cerrar"
            >
              ×
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, opacity: 0.9 }}>Username</label>
            <input
              type="text"
              placeholder="usuario"
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #b2afafff", background: "transparent", color: "#000" }}
            />
            <label style={{ fontSize: 12, opacity: 0.9 }}>Plataforma</label>
            <select
              value={addPlatform}
              onChange={(e) => setAddPlatform(e.target.value)}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #b2afafff", background: "transparent", color: "#000" }}
            >
              <option value="">--Selecciona--</option>
              <option value="x">X</option>
              <option value="instagram">instagram</option>
              <option value="facebook">facebook</option>
            </select>
            {addError && (
              <small style={{ color: "#FF6B6B" }}>{addError}</small>
            )}
            <button
              type="button"
              disabled={addLoading || !addUsername || !addPlatform}
              onClick={async () => {
                setAddError("");
                if (!addUsername || !addPlatform) return;
                try {
                  setAddLoading(true);
                  if (typeof onAddRoot === "function") {
                    await onAddRoot(addPlatform, addUsername);
                  }
                  setShowAddMenu(false);
                  setAddUsername("");
                  setAddPlatform("");
                } catch (e) {
                  console.error(e);
                  setAddError(e.message || "No se pudo completar la solicitud");
                } finally {
                  setAddLoading(false);
                }
              }}
              style={{
                marginTop: 8,
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: addLoading ? "#2b3e55" : "#1A2D42",
                color: "#fff",
                cursor: addLoading ? "not-allowed" : "pointer",
              }}
            >
              {addLoading ? "Enviando..." : "Agregar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default WindowNet;
