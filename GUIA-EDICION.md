# Pétreos Arte & Arquitectura · Guía del sitio

## 1. Estructura del proyecto

```
petreos/
├── index.html                 ← Sitio principal
├── catalogo.html              ← Catálogo A4 imprimible / PDF (se genera solo)
├── css/
│   ├── styles.css             ← Estilos del sitio (mobile-first)
│   └── catalogo.css           ← Estilos del catálogo PDF
├── js/
│   ├── config.js              ← ÚNICO archivo que se edita (una sola vez)
│   ├── data.js                ← Lee Google Sheets / respaldo local
│   ├── script.js              ← Catálogo, filtros, ficha, cotización
│   └── catalogo.js            ← Genera el catálogo PDF
├── data/
│   └── catalogo-local.js      ← Respaldo con las 7 piezas actuales
├── img/
│   ├── marca/                 ← logo.png, logo-claro.png, favicon.png
│   ├── productos/             ← fotos recortadas y optimizadas
│   └── placeholder.svg        ← imagen que aparece si falta una foto
└── plantilla/
    └── Petreos-catalogo-plantilla.xlsx  ← Hoja para importar a Google Sheets
```

Para probarlo en VS Code: abre la carpeta y usa la extensión **Live Server**
(clic derecho en `index.html` → *Open with Live Server*). También funciona con doble clic.

---

## 2. Conectar Google Sheets (se hace UNA vez, ~10 minutos)

1. Entra a <https://sheets.google.com> → **En blanco** → **Archivo → Importar → Subir**
   y elige `plantilla/Petreos-catalogo-plantilla.xlsx` → *Reemplazar hoja de cálculo*.
2. Verás 3 pestañas: **productos**, **ajustes** e **instrucciones**.
3. **Archivo → Compartir → Publicar en la web**.
   - En el primer menú elige la pestaña **productos**.
   - En el segundo elige **Valores separados por comas (.csv)**.
   - Clic en **Publicar** y copia el enlace.
4. Repite el paso 3 con la pestaña **ajustes** y copia ese segundo enlace.
5. Abre `js/config.js` y pega los enlaces entre las comillas:

```js
productosCSV: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv",
ajustesCSV:   "https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=123456&single=true&output=csv",
```

Listo. Desde ahora **todo se edita en la hoja**. Los cambios aparecen en el sitio
en unos **5 minutos** (Google guarda una copia temporal).

> Si la hoja falla o el enlace está vacío, el sitio muestra automáticamente
> las piezas de `data/catalogo-local.js`, así nunca queda en blanco.

---

## 3. Agregar, editar o quitar productos (sin código)

| Columna      | Qué poner                                                        | Ejemplo                         |
|--------------|------------------------------------------------------------------|---------------------------------|
| id           | Opcional. Identificador único sin espacios                       | `columna-jonica`                |
| nombre       | **Obligatorio**                                                  | Columna jónica                  |
| categoria    | Crea los filtros automáticamente. Escríbela siempre igual         | Elementos arquitectónicos       |
| material     | Crea el filtro de materiales                                     | Cantera gris                    |
| estilo       | Texto libre                                                      | Griego                          |
| descripcion  | 2–4 líneas                                                       | …                               |
| medidas      | Vacío = “Sobre pedido / consultar”                               | 2.40 m alto × 35 cm diámetro     |
| acabado      | Texto libre                                                      | Labrado a mano                  |
| precio       | Número o texto. Vacío = “Precio a cotizar”                       | `12500` o `Desde $8,000`        |
| imagen       | Enlace de Google Drive o ruta `img/productos/foto.jpg`           | https://drive.google.com/file/d/…|
| galeria      | Más fotos separadas con el símbolo \|                            | enlace1 \| enlace2              |
| destacado    | `si` / `no` → etiqueta dorada                                    | si                              |
| visible      | `no` oculta la pieza sin borrarla                                | si                              |
| orden        | Número; el 1 sale primero                                        | 1                               |

**Fotos desde Google Drive:** sube la foto a una carpeta de Drive → clic derecho →
*Compartir* → *Acceso general: Cualquier persona con el enlace* → *Copiar enlace* →
pégalo en la columna `imagen`. El sitio lo convierte solo en imagen.

**Recomendación de fotos:** verticales (4:5), fondo despejado, buena luz natural,
la pieza centrada. Las horizontales se muestran automáticamente a doble ancho.

---

## 4. Pestaña “ajustes”

Cambia textos y datos de contacto: WhatsApp, teléfono, correo, dirección (también mueve
el mapa), horario, título de portada (lo que va entre `*asteriscos*` sale en dorado cursiva),
fotos de portada y redes sociales. Lo que dejes vacío se oculta.

---

## 5. Catálogo en PDF

Botón **“Descargar catálogo PDF”** → elige categoría (o todo) → **Imprimir / Guardar PDF**
→ destino *Guardar como PDF*, tamaño **A4**, márgenes **Ninguno**, activa
**Gráficos de fondo**. Se genera con los mismos datos de la hoja: siempre actualizado.
Enlace directo a una categoría: `catalogo.html?categoria=Fuentes`.

---

## 6. Publicar el sitio (gratis)

- **Netlify Drop:** <https://app.netlify.com/drop> → arrastra la carpeta `petreos`. Listo.
- **GitHub Pages:** sube la carpeta a un repositorio → *Settings → Pages* → rama `main`.

Después puedes conectar un dominio propio (ej. `petreosarte.com`).

---

## 7. Pendiente por completar (datos que no venían en el material)

- [ ] Medidas y precios de cada pieza.
- [ ] Correo electrónico y horario de atención.
- [ ] Enlaces de Facebook / Instagram.
- [ ] Confirmar que el WhatsApp es el mismo número del teléfono (+52 771 222 70 95).
- [ ] Confirmar materiales: “Rostro en bloque” y “Elefante” se identificaron por foto.
