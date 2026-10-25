/* ==========================================================================
   PÉTREOS · CATÁLOGO IMPRIMIBLE (A4 → PDF)
   Usa los mismos datos que el sitio. Se genera solo, sin diseñar nada a mano.
   ========================================================================== */
(function () {
  "use strict";

  const D = window.PetreosData;
  const esc = D.esc;
  const $ = (s) => document.querySelector(s);
  const PER_PAGE = 4;

  let data = { productos: [], ajustes: {} };

  const chunk = (arr, n) => arr.reduce((acc, x, i) => (i % n ? acc[acc.length - 1].push(x) : acc.push([x]), acc), []);
  const today = () => new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  function cover(a, titulo) {
    return `
      <section class="page page--cover">
        <img class="cover__logo" src="img/marca/logo.png" alt="${esc(a.nombre_negocio)}">
        <div class="cover__body">
          <p class="cover__kicker">Catálogo de piezas</p>
          <h1>${esc(titulo)}</h1>
          <p class="cover__lead">Esculturas, fuentes y elementos arquitectónicos tallados a mano en cantera, recinto, mármol y granito.</p>
        </div>
        <div class="cover__img"><img src="${esc(D.imgUrl(a.hero_imagen))}" alt=""></div>
        <footer class="cover__foot"><span>${esc(today())}</span><span>${esc(a.telefono || "")}</span></footer>
      </section>`;
  }

  function item(p, showPrices) {
    const price = D.formatPrice(p.precio, data.ajustes.moneda) || "Precio a cotizar";
    const specs = [["Material", p.material], ["Estilo", p.estilo], ["Medidas", p.medidas || "Sobre pedido"], ["Acabado", p.acabado]]
      .filter(([, v]) => v)
      .map(([k, v]) => `<li><b>${k}</b>${esc(v)}</li>`).join("");
    return `
      <article class="item">
        <div class="item__img"><img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" onerror="this.src='${D.PLACEHOLDER}'"></div>
        <div class="item__body">
          <p class="item__cat">${esc(p.categoria)}</p>
          <h3>${esc(p.nombre)}</h3>
          <ul>${specs}</ul>
          ${p.descripcion ? `<p class="item__desc">${esc(p.descripcion)}</p>` : ""}
          ${showPrices ? `<p class="item__price">${esc(price)}</p>` : ""}
        </div>
      </article>`;
  }

  function productPages(list, showPrices) {
    const pages = chunk(list, PER_PAGE);
    return pages.map((group, i) => `
      <section class="page">
        <header class="page__head">
          <img src="img/marca/logo.png" alt="">
          <span>${esc(group[0].categoria === group[group.length - 1].categoria ? group[0].categoria : "Catálogo")}</span>
        </header>
        <div class="items">${group.map((p) => item(p, showPrices)).join("")}</div>
        <footer class="page__foot"><span>${esc(data.ajustes.nombre_negocio)}</span><span>${i + 2}</span></footer>
      </section>`).join("");
  }

  function backCover(a) {
    return `
      <section class="page page--back">
        <img src="img/marca/logo-claro.png" alt="${esc(a.nombre_negocio)}">
        <h2>Diseñamos y tallamos la pieza que tu proyecto necesita</h2>
        <p>Además de las piezas de este catálogo fabricamos columnas, capiteles, molduras, arcos, balaustradas, chimeneas, fuentes, pisos y recubrimientos, y realizamos restauración de elementos arquitectónicos.</p>
        <ul>
          ${a.telefono ? `<li><b>Teléfono / WhatsApp</b>${esc(a.telefono)}</li>` : ""}
          ${a.email ? `<li><b>Correo</b>${esc(a.email)}</li>` : ""}
          ${a.direccion ? `<li><b>Dirección</b>${esc(a.direccion)}</li>` : ""}
          ${a.contacto_nombre ? `<li><b>Contacto</b>${esc(a.contacto_nombre)}</li>` : ""}
        </ul>
        <p class="back__note">Precios, medidas y disponibilidad sujetos a cambio. Cada pieza es tallada a mano, por lo que puede presentar variaciones naturales de tono y veta.</p>
      </section>`;
  }

  function render() {
    const cat = $("[data-cat]").value;
    const showPrices = $("[data-prices]").checked;
    const list = cat ? data.productos.filter((p) => p.categoria === cat) : data.productos;
    const sorted = [...list].sort((a, b) => a.categoria.localeCompare(b.categoria, "es") || a.orden - b.orden);
    $("[data-book]").innerHTML =
      cover(data.ajustes, cat || "Colección completa") +
      productPages(sorted, showPrices) +
      backCover(data.ajustes);
    document.title = `Catálogo ${cat ? `– ${cat} ` : ""}· ${data.ajustes.nombre_negocio}`;
  }

  D.loadCatalog().then((res) => {
    data = res;
    const cats = [...new Set(res.productos.map((p) => p.categoria))];
    $("[data-cat]").insertAdjacentHTML("beforeend", cats.map((c) => `<option>${esc(c)}</option>`).join(""));
    const pre = new URLSearchParams(location.search).get("categoria");
    if (pre && cats.includes(pre)) $("[data-cat]").value = pre;
    render();
  });

  $("[data-cat]").addEventListener("change", render);
  $("[data-prices]").addEventListener("change", render);
  $("[data-print]").addEventListener("click", () => window.print());
})();
