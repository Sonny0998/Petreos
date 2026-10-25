/* ==========================================================================
   PÉTREOS · INTERFAZ
   Catálogo dinámico, filtros, ficha de producto, lista de cotización
   y envío por WhatsApp. Todo el contenido viene de PetreosData.
   ========================================================================== */
(function () {
  "use strict";

  const D = window.PetreosData;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = D.esc;

  const QUOTE_KEY = "petreos-cotizacion";
  const state = {
    productos: [],
    ajustes: {},
    filtro: { cat: "Todas", material: "", q: "" },
    quote: readQuote()
  };

  /* ---------- Utilidades ---------- */
  function readQuote() {
    try { return JSON.parse(localStorage.getItem(QUOTE_KEY)) || []; } catch (_) { return []; }
  }
  function saveQuote() {
    try { localStorage.setItem(QUOTE_KEY, JSON.stringify(state.quote)); } catch (_) { /* modo privado */ }
  }
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const byId = (id) => state.productos.find((p) => p.id === id);
  const priceLabel = (p) => D.formatPrice(p.precio, state.ajustes.moneda) || "Precio a cotizar";

  let toastTimer;
  function toast(msg) {
    const t = $("[data-toast]");
    t.textContent = msg;
    t.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2400);
  }

  function openWhatsApp(msg) {
    window.open(D.waLink(state.ajustes.whatsapp, msg), "_blank", "noopener");
  }

  /* ---------- Ajustes (textos, contacto, redes) ---------- */
  function applyAjustes() {
    const a = state.ajustes;

    $$("[data-ajuste]").forEach((el) => {
      const val = a[el.dataset.ajuste];
      if (!val) return;
      if (el.hasAttribute("data-rich")) {
        el.innerHTML = esc(val).replace(/\*(.+?)\*/g, "<em>$1</em>");
      } else el.textContent = val;
    });

    $$("[data-wa]").forEach((el) => { el.href = D.waLink(a.whatsapp, a.mensaje_whatsapp); });

    const telHref = `tel:${String(a.telefono || "").replace(/[^\d+]/g, "")}`;
    $$("[data-tel]").forEach((el) => {
      el.href = telHref;
      if (!el.textContent.trim()) el.textContent = a.telefono;
    });

    if (a.email) $$("[data-email]").forEach((el) => { el.href = `mailto:${a.email}`; el.textContent = a.email; });

    $$("[data-show-if]").forEach((el) => { el.hidden = !a[el.dataset.showIf]; });

    $$("[data-social]").forEach((el) => {
      const url = a[el.dataset.social];
      el.hidden = !url;
      if (url) el.href = url;
    });

    const map = $("[data-map]");
    if (map && a.direccion) map.src = `https://maps.google.com/maps?q=${encodeURIComponent(a.direccion)}&z=14&output=embed`;

    const h1 = $("[data-hero-img]"), h2 = $("[data-hero-img-2]");
    if (h1 && a.hero_imagen) h1.src = D.imgUrl(a.hero_imagen);
    if (h2 && a.hero_imagen_2) h2.src = D.imgUrl(a.hero_imagen_2);

    $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- Filtros ---------- */
  function buildFilters() {
    const cats = ["Todas", ...new Set(state.productos.map((p) => p.categoria))];
    $("[data-chips]").innerHTML = cats
      .map((c) => {
        const n = c === "Todas" ? state.productos.length : state.productos.filter((p) => p.categoria === c).length;
        const active = c === state.filtro.cat;
        return `<button class="chip${active ? " is-active" : ""}" type="button" role="tab" aria-selected="${active}" data-cat="${esc(c)}">${esc(c)} <span>${n}</span></button>`;
      })
      .join("");

    const mats = [...new Set(state.productos.map((p) => p.material).filter(Boolean))].sort();
    $("[data-material]").innerHTML =
      `<option value="">Todos los materiales</option>` +
      mats.map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join("");
  }

  function filtered() {
    const { cat, material, q } = state.filtro;
    const nq = norm(q);
    return state.productos.filter((p) => {
      if (cat !== "Todas" && p.categoria !== cat) return false;
      if (material && p.material !== material) return false;
      if (nq) {
        const hay = norm([p.nombre, p.categoria, p.material, p.estilo, p.descripcion].join(" "));
        return nq.split(/\s+/).every((w) => hay.includes(w));
      }
      return true;
    });
  }

  /* ---------- Render del catálogo ---------- */
  function cardHTML(p) {
    const meta = [p.material, p.estilo].filter(Boolean).map(esc).join(" · ");
    return `
      <article class="card" data-id="${esc(p.id)}">
        <button class="card__media" type="button" data-open="${esc(p.id)}" aria-label="Ver detalles de ${esc(p.nombre)}">
          <img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" loading="lazy" decoding="async">
          ${p.destacado ? '<span class="tag">Destacado</span>' : ""}
          <span class="card__zoom" aria-hidden="true">Ver pieza</span>
        </button>
        <div class="card__body">
          <p class="card__cat">${esc(p.categoria)}</p>
          <h3 class="card__title">${esc(p.nombre)}</h3>
          ${meta ? `<p class="card__meta">${meta}</p>` : ""}
          <div class="card__foot">
            <span class="price">${esc(priceLabel(p))}</span>
            <button class="btn btn--sm btn--outline" type="button" data-add="${esc(p.id)}" aria-label="Agregar ${esc(p.nombre)} a la cotización">+ Cotizar</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const list = filtered();
    const grid = $("[data-grid]");
    grid.innerHTML = list.map(cardHTML).join("");
    grid.setAttribute("aria-busy", "false");
    $("[data-empty]").hidden = list.length > 0;
    $("[data-results]").textContent =
      list.length === state.productos.length
        ? `${list.length} piezas en el catálogo`
        : `${list.length} de ${state.productos.length} piezas`;

    // Fotos horizontales ocupan dos columnas automáticamente
    $$("img", grid).forEach((img) => {
      const mark = () => {
        if (img.naturalWidth / img.naturalHeight > 1.2) img.closest(".card").classList.add("card--wide");
      };
      img.complete && img.naturalWidth ? mark() : img.addEventListener("load", mark, { once: true });
      img.addEventListener("error", () => { img.src = D.PLACEHOLDER; }, { once: true });
    });
  }

  /* ---------- Ficha de producto (modal) ---------- */
  const modal = $("[data-modal]");

  function openProduct(id, push = true) {
    const p = byId(id);
    if (!p) return;
    const rows = [
      ["Categoría", p.categoria], ["Material", p.material], ["Estilo", p.estilo],
      ["Medidas", p.medidas || "Sobre pedido / consultar"], ["Acabado", p.acabado]
    ].filter(([, v]) => v);

    const thumbs = p.galeria.length > 1
      ? `<div class="gallery__thumbs">${p.galeria.map((src, i) =>
          `<button type="button" class="${i === 0 ? "is-active" : ""}" data-thumb="${esc(src)}" aria-label="Foto ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("")}</div>`
      : "";

    $("[data-modal-body]").innerHTML = `
      <div class="gallery">
        <div class="gallery__main"><img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" data-main-img></div>
        ${thumbs}
      </div>
      <div class="detail">
        <p class="eyebrow">${esc(p.categoria)}</p>
        <h2 id="modal-title" class="detail__title">${esc(p.nombre)}</h2>
        <p class="detail__price">${esc(priceLabel(p))}</p>
        ${p.descripcion ? `<p class="detail__desc">${esc(p.descripcion)}</p>` : ""}
        <dl class="specs">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        <p class="detail__note">Cada pieza se talla a mano: medidas, tono de piedra y acabado pueden adaptarse a tu proyecto.</p>
        <div class="detail__actions">
          <button class="btn btn--gold" type="button" data-ask="${esc(p.id)}">Preguntar por WhatsApp</button>
          <button class="btn btn--outline" type="button" data-add="${esc(p.id)}">+ Agregar a cotización</button>
          <button class="btn-link" type="button" data-share="${esc(p.id)}">Compartir pieza</button>
        </div>
      </div>`;

    $("[data-main-img]", modal).addEventListener("error", (e) => { e.target.src = D.PLACEHOLDER; }, { once: true });
    if (!modal.open) modal.showModal();
    document.body.classList.add("no-scroll");
    if (push) history.replaceState(null, "", `#pieza-${p.id}`);
  }

  function closeDialog(dlg) {
    if (dlg.open) dlg.close();
  }

  [modal, $("[data-drawer]")].forEach((dlg) => {
    dlg.addEventListener("close", () => {
      document.body.classList.remove("no-scroll");
      if (dlg === modal && location.hash.startsWith("#pieza-")) history.replaceState(null, "", location.pathname + location.search);
    });
    // Cerrar al hacer clic fuera del contenido
    dlg.addEventListener("click", (e) => { if (e.target === dlg) closeDialog(dlg); });
    $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", () => closeDialog(dlg)));
  });

  function openFromHash() {
    const m = location.hash.match(/^#pieza-(.+)$/);
    if (m) openProduct(decodeURIComponent(m[1]), false);
  }

  async function share(id) {
    const p = byId(id);
    const url = `${location.origin}${location.pathname}#pieza-${id}`;
    try {
      if (navigator.share) await navigator.share({ title: p.nombre, text: `${p.nombre} · Pétreos`, url });
      else { await navigator.clipboard.writeText(url); toast("Enlace copiado"); }
    } catch (_) { /* cancelado */ }
  }

  /* ---------- Cotización ---------- */
  function addToQuote(id) {
    const item = state.quote.find((i) => i.id === id);
    if (item) item.qty += 1; else state.quote.push({ id, qty: 1 });
    saveQuote();
    updateQuoteUI();
    toast(`${byId(id).nombre} agregado a tu cotización`);
  }

  function updateQuoteUI() {
    state.quote = state.quote.filter((i) => byId(i.id)); // limpia piezas eliminadas de la hoja
    const total = state.quote.reduce((s, i) => s + i.qty, 0);
    const badge = $("[data-quote-count]");
    badge.textContent = total;
    badge.hidden = total === 0;

    const list = $("[data-quote-list]");
    $("[data-quote-foot]").hidden = total === 0;
    if (!total) {
      list.innerHTML = `<div class="drawer__empty"><p>Tu lista está vacía.</p><p>Agrega piezas del catálogo con <strong>+ Cotizar</strong> y envíanos todo en un solo mensaje.</p></div>`;
      return;
    }
    list.innerHTML = state.quote.map(({ id, qty }) => {
      const p = byId(id);
      return `
        <div class="qitem">
          <img src="${esc(p.imagen)}" alt="" loading="lazy">
          <div class="qitem__info"><strong>${esc(p.nombre)}</strong><small>${esc(p.material)}</small></div>
          <div class="qty" aria-label="Cantidad">
            <button type="button" data-qty="-1" data-id="${esc(id)}" aria-label="Menos">−</button>
            <span>${qty}</span>
            <button type="button" data-qty="1" data-id="${esc(id)}" aria-label="Más">+</button>
          </div>
          <button class="qitem__rm" type="button" data-remove="${esc(id)}" aria-label="Quitar ${esc(p.nombre)}">×</button>
        </div>`;
    }).join("");
  }

  function sendQuote() {
    const name = $("[data-quote-name]").value.trim();
    const notes = $("[data-quote-notes]").value.trim();
    const lines = state.quote.map(({ id, qty }) => {
      const p = byId(id);
      return `• ${p.nombre} (x${qty})${p.material ? ` – ${p.material}` : ""}`;
    });
    const extra = [name && `Nombre: ${name}`, notes && `Notas: ${notes}`].filter(Boolean);
    const msg = [
      `Hola ${state.ajustes.nombre_negocio || "Pétreos"}, me gustaría cotizar:`,
      "", ...lines,
      ...(extra.length ? ["", ...extra] : []),
      "", "Enviado desde el sitio web."
    ].join("\n");
    openWhatsApp(msg);
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open],[data-add],[data-ask],[data-share],[data-thumb],[data-qty],[data-remove],[data-cat],[data-open-quote],[data-reset],[data-quote-send],[data-quote-clear]");
    if (!t) return;
    const d = t.dataset;

    if (d.open) openProduct(d.open);
    else if (d.add) addToQuote(d.add);
    else if (d.ask) {
      const p = byId(d.ask);
      openWhatsApp(`Hola, me interesa la pieza "${p.nombre}" (${p.material}). ¿Me pueden dar precio y medidas disponibles?\n${location.origin}${location.pathname}#pieza-${p.id}`);
    } else if (d.share) share(d.share);
    else if (d.thumb) {
      $("[data-main-img]").src = d.thumb;
      $$("[data-thumb]").forEach((b) => b.classList.toggle("is-active", b === t));
    } else if (d.qty) {
      const it = state.quote.find((i) => i.id === d.id);
      it.qty = Math.max(1, it.qty + Number(d.qty));
      saveQuote(); updateQuoteUI();
    } else if (d.remove) {
      state.quote = state.quote.filter((i) => i.id !== d.remove);
      saveQuote(); updateQuoteUI();
    } else if (d.cat) {
      state.filtro.cat = d.cat;
      $$("[data-cat]").forEach((c) => {
        const on = c === t;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-selected", on);
      });
      render();
    } else if ("openQuote" in d) {
      closeDialog(modal);
      $("[data-drawer]").showModal();
      document.body.classList.add("no-scroll");
    } else if ("reset" in d) {
      state.filtro = { cat: "Todas", material: "", q: "" };
      $("[data-search]").value = ""; $("[data-material]").value = "";
      buildFilters(); render();
    } else if ("quoteSend" in d) sendQuote();
    else if ("quoteClear" in d) { state.quote = []; saveQuote(); updateQuoteUI(); }
  });

  let searchTimer;
  $("[data-search]").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.filtro.q = e.target.value; render(); }, 160);
  });
  $("[data-material]").addEventListener("change", (e) => { state.filtro.material = e.target.value; render(); });

  $("[data-contact-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const nombre = f.nombre.value.trim(), mensaje = f.mensaje.value.trim();
    const err = $("[data-form-error]");
    err.hidden = !!(nombre && mensaje);
    if (!nombre || !mensaje) { (nombre ? f.mensaje : f.nombre).focus(); return; }
    openWhatsApp([
      `Hola, soy ${nombre}${f.ciudad.value.trim() ? ` de ${f.ciudad.value.trim()}` : ""}.`,
      `Proyecto: ${f.tipo.value}`, "", mensaje
    ].join("\n"));
    f.reset();
  });

  /* ---------- Header y navegación ---------- */
  const header = $("[data-header]");
  const burger = $("[data-burger]");
  const nav = $("[data-nav]");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function toggleNav(open) {
    const isOpen = open ?? !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", isOpen);
    burger.setAttribute("aria-expanded", isOpen);
    burger.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("nav-open", isOpen);
  }
  burger.addEventListener("click", () => toggleNav());
  $$("a", nav).forEach((a) => a.addEventListener("click", () => toggleNav(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleNav(false); });

  // Resalta la sección visible en el menú
  if ("IntersectionObserver" in window) {
    const links = $$('a[href^="#"]:not([href="#"])', nav);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-current", l.getAttribute("href") === `#${en.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((l) => { const s = $(l.getAttribute("href")); if (s) spy.observe(s); });

    const rev = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); rev.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => rev.observe(el));
  } else $$(".reveal").forEach((el) => el.classList.add("is-visible"));

  /* ---------- Arranque ---------- */
  D.loadCatalog().then(({ productos, ajustes, fuente }) => {
    state.productos = productos;
    state.ajustes = ajustes;
    document.documentElement.dataset.fuente = fuente;
    applyAjustes();
    buildFilters();
    render();
    updateQuoteUI();
    openFromHash();
  });
  window.addEventListener("hashchange", openFromHash);
})();
