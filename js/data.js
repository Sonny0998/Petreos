/* ==========================================================================
   PÉTREOS · CAPA DE DATOS
   Lee Google Sheets (CSV publicado) y, si no hay enlace o falla la red,
   usa el respaldo local (data/catalogo-local.js). No requiere servidor.
   ========================================================================== */
(function () {
  "use strict";

  const PLACEHOLDER = "img/placeholder.svg";

  /* ---------- CSV robusto (comillas, comas y saltos de línea) ---------- */
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c !== "\r") field += c;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim() !== ""));
  }

  /* "Imágenes extra" → "imagenes_extra" */
  const toKey = (s) =>
    String(s || "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  const ALIASES = {
    foto: "imagen", imagen_principal: "imagen", fotos_extra: "galeria",
    imagenes_extra: "galeria", mas_fotos: "galeria", precio_mxn: "precio",
    descripcion_corta: "descripcion", tamano: "medidas", dimensiones: "medidas"
  };

  function rowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0].map((h) => ALIASES[toKey(h)] || toKey(h));
    return rows.slice(1).map((r) => {
      const o = {};
      headers.forEach((h, i) => { if (h) o[h] = (r[i] || "").trim(); });
      return o;
    });
  }

  const slug = (s) => toKey(s).replace(/_/g, "-");
  const isYes = (v) => /^(si|sí|yes|x|1|true|verdadero)$/i.test(String(v || "").trim());
  const isNo = (v) => /^(no|0|false|falso)$/i.test(String(v || "").trim());

  /* Convierte enlaces de Google Drive / Dropbox en imágenes directas */
  function imgUrl(url) {
    const u = String(url || "").trim();
    if (!u) return PLACEHOLDER;
    const drive =
      u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) ||
      u.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([\w-]+)/);
    if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1600`;
    if (/dropbox\.com/.test(u)) return u.replace(/dl=0/, "raw=1");
    return u;
  }

  function normalizeProduct(o, i) {
    const imagen = imgUrl(o.imagen);
    const extra = String(o.galeria || "")
      .split(/[|\n]/).map((s) => s.trim()).filter(Boolean).map(imgUrl);
    return {
      id: slug(o.id || o.nombre) || `pieza-${i + 1}`,
      nombre: o.nombre || "",
      categoria: o.categoria || "Otros",
      material: o.material || "",
      estilo: o.estilo || "",
      descripcion: o.descripcion || "",
      medidas: o.medidas || "",
      acabado: o.acabado || "",
      precio: o.precio || "",
      imagen,
      galeria: [imagen, ...extra],
      destacado: isYes(o.destacado),
      visible: !isNo(o.visible),
      orden: Number.isFinite(Number.parseFloat(o.orden)) ? Number.parseFloat(o.orden) : 9999
    };
  }

  function prepare(list) {
    return list
      .map(normalizeProduct)
      .filter((p) => p.visible && p.nombre)
      .sort((a, b) => a.orden - b.orden || Number(b.destacado) - Number(a.destacado));
  }

  async function fetchCSV(url) {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(`${url}${sep}_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (/^\s*<(!doctype|html)/i.test(text)) throw new Error("El enlace no es un CSV publicado");
    return parseCSV(text);
  }

  function rowsToAjustes(rows) {
    const out = {};
    rows.forEach((r) => {
      const k = toKey(r[0]);
      if (k && k !== "clave") out[k] = (r[1] || "").trim();
    });
    return out;
  }

  async function loadCatalog() {
    const cfg = window.PETREOS_CONFIG || {};
    const ajustes = Object.assign({}, cfg.ajustes);
    let productos = null;
    let fuente = "local";

    const tasks = [];
    if (cfg.productosCSV) {
      tasks.push(
        fetchCSV(cfg.productosCSV)
          .then((rows) => { productos = prepare(rowsToObjects(rows)); fuente = "google-sheets"; })
          .catch((e) => console.warn("[Pétreos] No se pudo leer la hoja de productos:", e.message))
      );
    }
    if (cfg.ajustesCSV) {
      tasks.push(
        fetchCSV(cfg.ajustesCSV)
          .then((rows) => {
            const extra = rowsToAjustes(rows);
            Object.keys(extra).forEach((k) => { if (extra[k] !== "") ajustes[k] = extra[k]; });
          })
          .catch((e) => console.warn("[Pétreos] No se pudo leer la hoja de ajustes:", e.message))
      );
    }
    await Promise.all(tasks);

    if (!productos) {
      const local = (window.PETREOS_LOCAL && window.PETREOS_LOCAL.productos) || [];
      productos = prepare(local);
    }
    return { productos, ajustes, fuente };
  }

  function formatPrice(value, moneda) {
    const v = String(value || "").trim();
    if (!v) return "";
    const n = Number(v.replace(/[$,\s]/g, ""));
    if (!Number.isFinite(n)) return v; // texto libre: "Desde $4,500", "Sobre pedido"
    try {
      return new Intl.NumberFormat("es-MX", {
        style: "currency", currency: moneda || "MXN", maximumFractionDigits: 0
      }).format(n);
    } catch (_) { return `$${n.toLocaleString("es-MX")}`; }
  }

  const waLink = (num, msg) =>
    `https://wa.me/${String(num || "").replace(/\D/g, "")}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  window.PetreosData = { loadCatalog, formatPrice, waLink, imgUrl, esc, PLACEHOLDER };
})();
