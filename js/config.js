/* ==========================================================================
   PÉTREOS · CONFIGURACIÓN
   Este es el ÚNICO archivo que se edita una sola vez (al instalar el sitio).
   Después, todo el contenido se cambia desde Google Sheets, sin tocar código.
   ========================================================================== */

window.PETREOS_CONFIG = {
  /* 1) Enlace CSV publicado de la pestaña "productos" de tu Google Sheet.
        Archivo → Compartir → Publicar en la web → pestaña "productos" → CSV.
        Si lo dejas vacío, el sitio usa los productos de data/catalogo-local.js */
  productosCSV: "",

  /* 2) Enlace CSV publicado de la pestaña "ajustes" (opcional). */
  ajustesCSV: "",

  /* 3) Valores por defecto. Cualquier fila de la pestaña "ajustes"
        con la misma clave reemplaza estos valores automáticamente. */
  ajustes: {
    nombre_negocio: "Pétreos Arte & Arquitectura",
    whatsapp: "527712227095",            // Solo números: 52 + 10 dígitos
    telefono: "+52 771 222 70 95",
    email: "",
    contacto_nombre: "Mildred Marín",
    direccion: "Carretera México – Pachuca Km 80, Linda Vista, Zempoala, Hidalgo, México",
    horario: "",
    moneda: "MXN",
    hero_titulo: "El arte de la piedra, *tallado a mano*",
    hero_subtitulo:
      "Transformamos cantera, recinto, mármol y granito en esculturas, fuentes y elementos arquitectónicos que reflejan el estilo propio de cada proyecto.",
    hero_imagen: "img/productos/mascara-de-baco.jpg",
    hero_imagen_2: "img/productos/angel-con-anfora.jpg",
    mensaje_whatsapp: "Hola Pétreos, vi su sitio web y me gustaría recibir información.",
    facebook: "",
    instagram: "",
    tiktok: ""
  }
};
