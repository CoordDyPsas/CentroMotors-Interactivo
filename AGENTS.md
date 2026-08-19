# DyP — Planos Interactivos

## Goal
- Create interactive HTML building plans for Toyota Centro Motors branches with AC unit markers, photo carousel, detail panel, DyP branding, and toggleable design modes.

## Agent Rules (OBLIGATORIAS)
- **Mantener `GUIA-AGENTES.md` al día en CADA intervención.** Todo agente que toque este proyecto (código, deploy, D1, datos, URLs, credenciales, flujos, features o troubleshooting) DEBE actualizar `GUIA-AGENTES.md` con la información nueva y registrar el cambio en su sección **"Registro de actualizaciones"**. Una tarea NO está terminada hasta que la guía quede documentada.
- **Mantener `AGENTS.md` (sección Progress) al día** con las features/decisiones nuevas, en el mismo estilo de las entradas existentes.
- La guía es la fuente de verdad operativa para futuros agentes: si algo del entorno cambió (nuevo comando, nueva tabla, nuevo endpoint, cambios de deploy), documentarlo en el mismo paso en que se hace el cambio.

## Constraints & Preferences
- Activation: hover (tooltip preview) + click (full panel with photo + info)
- Each branch in its own subfolder under `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\`
- Menu root index.html to select branch, now with matching theme toggle
- Zoom with mouse wheel (centered on cursor), pan by dragging, double-click zoom in, pinch-to-zoom on touch
- Color-coded markers: orange = Necesita service, green = OK, gray = No funciona; "necesita" markers have subtle pulse animation
- Self-contained HTML files (data embedded, no server needed)
- Photo data: `fotos: ["archivo.jpg", ...]` array
- Carousel with scroll-snap, drag-to-scroll, dot navigation
- Search bar with suggestions dropdown filters markers by #nro or ubicación in real-time
- Status summary in header with clickable filters by estado
- Lightbox: full-screen carousel with drag, arrows, counter, info tooltip, keyboard arrows
- Marker auto-center on click, flash animation on selected marker
- Equipment list overlay, copy-to-clipboard button in panel, minimap in corner
- **Reporte de urgencia de service**: botón en header → overlay con tabla rankeada (sin fecha = más urgente, luego fecha más vieja). Menú raíz: botón por tarjeta, fetcha de API.
- Design modes: **Modo Claro** (default, gray/light theme, `.modo-profesional` class active on `<body>`) and **Modo oscuro** (toggled, dark theme, `.modo-profesional` removed). Button shows ☀️ "Modo Claro" / 🌙 "Modo oscuro". CSS unchanged: `.modo-profesional` still holds the gray-theme styles.
- DyP logo: **inline SVG with traced paths from DyPgris.png** (D: 11 outer + 8 hole pts, Y: 9 pts, P: 18 pts — open counter, no hole), viewBox `0 0 100 41`, fill classes `.d-path`/`.y-path`/`.p-path` invert between modes
- Logo in Modo Claro: badge bg `#fff`, D+P `#111`, subtitle `#111`. Modo oscuro: badge bg `rgba(255,255,255,0.92)`, D+P `#444`, subtitle `#444`.
- Smooth 0.4s transitions on header, badge background, logo fills, and subtitle color
- Header buttons in Modo Claro use `rgba(10,10,10,0.95)` with `border: 1px solid rgba(255,255,255,0.08)`. In Modo oscuro use `#515151`.
- Info-items: `#515151` bg in Modo oscuro, `rgba(10,10,10,0.95)` bg in Modo Claro
- Orange borders (`2px solid #ff6900`) on panel, panel-header, foto-container in both modes
- Toggle-panel (arrow) hidden by default, appears only after selecting an equipo
- Volver button is a single arrow icon placed before the logo (leftmost in header)
- Lista button matches zoom button styling (square 32×32, border-radius 4px) in both modes
- Footer text and logo are white (`#fff`) in both modes; footer bg changes with mode (gray in Claro, dark in oscuro). Footer logo badge always transparent.
- Leyenda and status filter order: OK (green) → Necesita (orange) → No funciona (gray)
- Root menu now has full theme toggle with same localStorage persistence and matching visual design

## Browser Compatibility
- `-webkit-backdrop-filter` prefix for Safari < 14.1 on header, footer, modo-profesional variants
- Firefox: `scrollbar-width: thin` with `* { scrollbar-color: ... }` universal rule for all scrollable areas
- Clipboard fallback for `file://` protocol: creates hidden `<textarea>`, uses `document.execCommand('copy')` when `navigator.clipboard` unavailable
- Google Fonts preconnect includes `crossorigin` attribute

## Performance & UX
- **Skeleton shimmer**: placeholder `<div class="skeleton">` with CSS shimmer animation shown before each carousel/lightbox image loads; removed via `onload="this.previousElementSibling.remove()"`
- **`loading="lazy"`**: all images beyond the first in carousels use `loading="lazy"`; first image uses `loading="eager"`
- **Photo preloading**: `precargarFotos(fotos)` still called on panel open for instant lightbox images
- **Image error handling**: failed src replaces parent content with styled "Foto no disponible" placeholder (not just the img tag, so skeleton is also removed)

## PWA
- Each branch folder + root has `manifest.json` with `display: standalone`, theme_color `#ff6900`
- Minimal `sw.js` with `skipWaiting()` + `clients.claim()` for offline support scaffolding
- Registered via `navigator.serviceWorker.register('sw.js')` — silent catch if unavailable

## Features
### Navigation & State
- **URL hash**: `mostrarEquipo` sets `history.replaceState(null, '', '#eq-' + nro)`; on load, hash `#eq-N` auto-selects the equipo (including piso change)
- **Keyboard shortcuts**: `Escape` closes panel/lightbox, `+`/`=` zoom in, `-` zoom out, `0` reset view, `ArrowLeft`/`ArrowRight` lightbox navigation, `s`/`/` focus search bar
- **Focus trap**: lightbox traps Tab/Shift+Tab within focusable elements when open
- **View Transitions**: `@view-transition { navigation: auto; }` enables Cross-document View Transitions API for same-origin navigation

## Progress
### Done
- Monseñor: 24 equipos (15 PB, 9 PA), 15 photos, full interactive ✅
- Colón: 52 equipos (39 PB, 13 PA), 1 photo (#20 Caja), full interactive ✅
- Sagrada Familia: 18 equipos (13 PB, 5 PA), 0 photos, full interactive ✅
- All branches: coordinates placed and merged into HTML data ✅
- Full UI redesign: glassmorphism header, gradient panel, orange-accent info-items, pill badges, marker glow + hover ring, custom scrollbar ✅
- Panel + lightbox carousels with scroll-snap, drag-to-scroll, dot navigation ✅
- Drag thresholds tuned: panel 7%, lightbox 10% ✅
- Lightbox arrows, photo counter, info tooltip (nro + ubicación + estado) ✅
- Search bar with suggestions dropdown + real-time marker filtering ✅
- Status summary counts in header with clickable filters by estado ✅
- Photo preloading on panel open ✅
- Auto-center marker on click (zoom 60%) ✅
- Minimap in corner with viewport rect, marker dots, click-to-jump ✅
- Date formatting with relative text ("14/06/2025 — hace 12 meses") ✅
- Copy-to-clipboard button in panel header ✅
- Click on plan background closes panel ✅
- Flash animation on selected marker (search suggestion, list, marker click, filter) ✅
- Pulse animation on "Necesita service" markers ✅
- Inter font + Nunito font (Google Fonts) + Phosphor icons (CDN) ✅
- Info-grid icon overlap fixed: `align-items: center`, fixed icon width 22px, text div with `flex: 1` ✅
- Toggle-panel (arrow) starts hidden (`.oculto`), appears after first equipo selection ✅
- Volver button moved before the logo (far left), just an arrow icon, compact 32×32 square ✅
- Lista button styled like zoom buttons in both modes (32×32, border-radius 4px, #515151 bg) ✅
- `overflow-x: auto` removed from header to fix search suggestion dropdown clipping ✅
- **DyP logo traced from PNG** via OpenCV contour detection (eps=12), exact SVG paths for D (enclosed counter), Y (9 pts), P (18 pts, open counter) across all pages ✅
- **DyP logo replaced** from text `<span>` to inline SVG with `.d-path`/`.y-path`/`.p-path` CSS fill classes ✅
- **Modes swapped**: Modo Claro = default (`modo-profesional` active), Modo oscuro = toggled (class removed) ✅
- **Logo badge in Modo Claro**: bg `#fff`, D+P + subtitle `#111`; Modo oscuro: bg `rgba(255,255,255,0.92)`, D+P `#444`, subtitle `#444` ✅
- **Footer**: white text/logo in both modes, bg per mode, logo badge transparent ✅
- **Header/Info-item styling** per mode with correct contrast colors ✅
- **Orange borders** on panel, panel-header, foto-container, info-items in both modes ✅
- **Leyenda & stat filters**: OK → Necesita → No funciona order ✅
- **Root menu index.html** redesigned: full theme toggle, matching header/badge/footer/card styling, localStorage persistence ✅
- localStorage persists with `dyp_tema = 'claro' | 'oscuro'` ✅
- **Browser compatibility**: `-webkit-backdrop-filter` prefix, Firefox `scrollbar-width`, clipboard fallback for `file://`, Google Fonts `crossorigin` ✅
- **View Transitions API**: `@view-transition { navigation: auto; }` ✅
- **PWA support**: `manifest.json` + `sw.js` (skipWaiting + clients.claim) in each branch folder and root ✅
- **URL hash**: `#eq-N` for direct equipo linking (set on mostrarEquipo, read on load) ✅
- **loading="lazy"** + skeleton shimmer on carousel/lightbox images ✅
- **Keyboard shortcuts**: `s`/`/` for search focus ✅
- **Focus trap**: Tab/Shift+Tab trapping inside lightbox (init on open) ✅
- **Image error handling**: skeleton removed on error, styled placeholder shown ✅

### OT Download Links
- OT number in panel info is now a clickable link → opens `https://app22.persat.com.ar/dypsas/DigitalFormToPdfServlet?action=get_work_order_in_pdf&wo_id=N`- Icon changes from `ph-clipboard-text` to `ph-download-simple` + `ph-file-pdf` when OT exists
- `target="_blank"` + `rel="noopener"` — opens in new tab, works with existing session/login
- Empty OT shows `—` (no link)
- Copied text includes full OT download URL
- Apps: monsenor, colon, sagrada-familia ✅

### In Progress
- HINO: user does not have the plans yet

### Recently Done (Ago 2026)
- **Historial de OTs**: tabla `ot_historial` (branch, equipo_nro, ot, agregado; PK compuesta) en D1 (`db/ot_historial.sql`), endpoint `functions/api/ot-historial.js` (GET por branch/equipo, restringido para no-admin en colon/monsenor), y `registrarHistorialOT()` en `/api/sync` que inserta `INSERT OR IGNORE` las OTs numéricas vigentes en cada sync.
- **Tarjeta "Historial OT" colapsable**: en las 3 sucursales, tarjeta aparte bajo la grilla de info (`.ot-historial-card`), contraída por defecto, click para desplegar (`.ot-historial-card.abierto`), contador en badge, pills de OT clicables que abren el PDF. El contenido abre con `max-height:320px` + scroll interno para que muchas OTs no estiren el panel. Se oculta si no hay historial.
- **OT actual incluida en la tarjeta**: se quitó el filtro que excluía la OT actual del listado (sin datos históricos la tarjeta quedaba invisible); ahora muestra todas las OTs registradas del equipo y crece con los syncs.
- **Deploy a Cloudflare Pages con OAuth**: `npx wrangler login` guarda la sesión en `C:\Users\Usuario\.wrangler\config\default.toml` (sin token manual). Deploy: `npx wrangler pages deploy . --project-name relevamientocm --branch main`. D1: `npx wrangler d1 execute dyp-tracking --remote --file db/ot_historial.sql`.
- **Seed del historial**: se sembró `ot_historial` con las OTs vigentes de la planilla (74 filas reconciliadas contra Google Sheets). Se eliminó una fila de prueba falsa `(sagrada-familia, 2, 6163)` que el agente anterior había insertado a mano (la OT 6163 solo corresponde a los equipos 4, 5, 7, 8 de Sagrada Familia).
- **GUIA-AGENTES.md**: manual operativo para agentes (conexión a GitHub/Cloudflare, deploy, D1, arquitectura, troubleshooting). Regla: actualizarla en cada intervención (ver sección Agent Rules).
- **Reporte de urgencia de service (Fase 1+2)**: botón "Reporte" (`ph-chart-bar`) en header de las 3 sucursales. Overlay/modal con tabla rankeada por urgencia de service: sin fecha primero, luego fecha más vieja. Menú raíz: botón "Reporte" en cada tarjeta activa.
  - **Fase 2 (email)**: `functions/api/reporte.js` — POST endpoint, JWT auth (admin/propio), OAuth token refresh, MIME email con tabla HTML, Gmail API REST send. Botón "Enviar por mail" en overlays de las 3 sucursales + menú raíz (solo visible para admin/propio). Cloudflare secrets: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `REPORTE_TO`. CSS: `.reporte-enviar` (branches), `.reporte-enviar-root` (menu). Estados: loading → enviado ✓ / error (auto-reset 3-4s).

### Recently Done (Jul 2026)
- **Filtros avanzados**: `<select>` for Marca and Capacidad in all 3 branches. `equiposFiltrados()` centralizes filtering. Filters apply to markers, stats, search suggestions, equipment list, minimap.
- **Exportar CSV**: Button next to Lista in all 3 branches. Downloads CSV with all columns (Nro, Ubicación, Marca, Capacidad, Estado, Último Service, OT, URL OT, Piso).
- **Dashboard cards**: Root `index.html` renders cards dynamically with per-branch status breakdown pills (OK, Necesita, No funciona).
- **PA image crop (Sagrada Familia)**: plano_pa.png cropped from 3309×2339 to 3309×555 to remove blank space.
- **Dynamic image dimensions**: All `IMG_W`/`IMG_H` constants in sagrada-familia/index.html replaced with `curImgW`/`curImgH` variables updated from `img.naturalWidth`/`img.naturalHeight` on each floor change.
- **Margin crop (Sagrada Familia)**: Both PB and PA images cropped to remove blank sheet margins. PB (165,60,3151,1551) → 2986×1491, PA (165,0,3151,555) → 2986×555. All 18 marker x/y coordinates adjusted accordingly.
- **Reverted PB crop (Sagrada Familia)**: PB image restored to original 3309×2339 (margins left intact), PB marker coords restored to original values. Only PA remains cropped.
- **servidor.py + iniciar.bat**: Local HTTP server with /sync endpoint. `iniciar.bat` starts server on localhost:8000 and opens browser.
- **Sync button**: Added to all 3 branch HTMLs. Detects localhost automatically, calls /sync, updates EQUIPOS in-memory, re-renders markers/stats/filters/list.
- **Fix duplicate code in sync_csv.py**: Removed 2nd ordered/new_json block that caused changes to be counted twice.
- **sync-time in footer**: All 3 branch HTMLs now show sync timestamp in footer (previously only root had it).
- **Comentarios por equipo**: Sección de comentarios en el panel de cada equipo (3 branches). Tabla `comentarios` en D1 (branch, equipo_nro, email, nombre, tipo, texto, creado, parent_id, resuelto). Endpoint `functions/api/comentarios.js` (GET lista, POST crea con `parent_id` opcional, PATCH alterna `resuelto`, DELETE elimina en cascada — propio o admin). `/api/me` y `_middleware.js` ahora devuelven `nombre`. Badge de tipo (Admin/Propio/Visitante), fecha/hora, contador. CSS `.comentarios-*` con estilos para ambos modos.
- **Respuestas anidadas + Resuelto**: Comentarios con árbol de respuestas indentado (`.comentario-respuestas`), botón "Responder" que abre form inline (`toggleRespuesta`), checkbox "Resuelto" (`.comentario-resuelto`, `toggleResuelto` PATCH) solo para autor o admin, y estilos `.comentario-item.resuelto` (opacidad + tachado + borde verde) en ambos modos. `renderComentarios` arma el árbol vía `parent_id`; `enviarComentario(parentId)` publica raíz o respuesta.
- **Archivado de comentarios resueltos**: Columna `archivado` en tabla `comentarios`. Botón "Archivar resueltos" (`archivarResueltos`) en el header de comentarios hace PATCH bulk `{accion:'archivar_resueltos'}` que archiva los resueltos y sus descendientes; botón "Ver archivados"/"Ocultar archivados" (`toggleVerArchivados`) filtra la lista; comentarios archivados muestran badge "Archivado", no permiten responder ni marcar resuelto, y solo autor/admin pueden restaurarlos (`restaurarComentario` PATCH `{id, archivado:0}` desarchiva el subtree). No se pierden datos: el archivo es reversible.
- **Menú por roles**: Colón y Monseñor ocultos para `propio`/`visitante` (se muestran como tarjeta "Próximamente" como HINO) porque se van a vender/presentar; solo `admin` los ve activos. `functions/_middleware.js` tiene `BRANCH_ADMIN_ONLY = ['colon','monsenor']` + `isBranchRestricted(path)`: para no-admin devuelve página "Próximamente" (páginas) o `403 {"error":"No disponible"}` (API). El menú raíz ya no tiene datos de equipos de Colón/Monseñor en el fuente (se limpia para que no queden expuestos); para admin carga sus stats dinámicamente desde `/api/equipos/[branch]` y muestra un botón extra que enlaza a `/admin`.
- **Revisión de código (seguridad/bugs) aplicada**: Revisión completa con hallazgos clasificados por prioridad; fixes backend y frontend aplicados en los 3 branches + `functions/`.
  - **Backend**: `/api/sync` ahora filtra `branches.colon`/`branches.monsenor` para no-admin (cierra el bypass de la restricción por roles); `/api/me` usa `context.data.user` (ya no re-decodifica JWT sin verificar); `/api/login/diag` es admin-only (excluido de WHITELIST); DELETE de comentarios borra en cascada con `eliminarSubtree()` (BFS por `parent_id` dentro de branch+equipo).
  - **Frontend (×3 branches)**: `escJS()` junto a `escaparHTML()`; XSS cerrado en tooltips de marcadores, panel-body (ubicación/marca/capacidad/estado/OT/último service), `formatearFecha`/`calcularProximoService` (fallback escapado), `#lb-info`, sugerencias de búsqueda, lista de equipos, `exportarCSV` (`href` de OT escapado) y `<option>` de filtros (antes solo escapaban `"`). `onclick="abrirOT(...)"` usa `escJS(eq.ot)`. Minimapa: `e.stopPropagation()` en el click (antes el wrapper de zoom lo anulaba). Foto-indicator abre el lightbox en la slide según `track.scrollLeft`, no siempre la 0. `equiposFiltrados()` ahora incluye el filtro de texto de búsqueda (stats/minimapa/lista consistentes con marcadores). `cargarComentarios(nro)` con guard `nro == null` + race guard `equipoSeleccionado.nro === reqNro`; recargas tras PATCH/DELETE sin pasar `null`. `formatearFechaComentario` robusto ante fechas parseables (`isNaN` guard).
  - **Init/race de planos**: nuevo `planoCargado()` reemplaza el `addEventListener('load')` directo: `if (img.complete) planoCargado()` + guard `planoInicializado` (evita re-fetch de `/api/equipos` en cada cambio de piso) + `pendienteEq` para que `#eq-N` de otro piso se abra tras cargar el plano correcto (en vez de `mostrarEquipo` inmediato con el plano equivocado).
  - **Verificado en producción** (deploy `c8e9cf69`): visitante `/colon/`→200 1485B "Próximamente", `/api/equipos/colon`→403, `/api/sync`→solo `sagrada-familia,hino`; admin `/colon/`→200 106582B, `/api/equipos/colon`→200, `/api/login/diag`→200; sin cookie→302; diag como visitante→403.
- **Estado real del repo**: los scripts Python referenciados (`sync_csv.py`, `sync.bat`, `servidor.py`, `iniciar.bat`, `descargar_ot.py`) **no existen en disco** — solo quedan `.pyc` en `__pycache__/` (Python 3.14). El sync en producción se hace vía `/api/sync` (Google Sheets) y el botón Sync en cada branch (localhost). `hino/` está vacía (sin planos todavía).

## Key Decisions
- PDF with ñ‑char filenames renamed to ASCII (plano_pb.png, plano_pa.png)
- Data embedded directly in HTML (no fetch from file://) to work locally
- Zoom formula: panX + mx * (1/zoom − 1/oldZ) for cursor‑centered zoom
- Sagrada Familia: both floors on one image (plano.png), PB/PA toggle filters markers
- Default zoom 41% (instead of fit-to-screen) for initial plan view
- DyP logo: **traced SVG paths** from DyPgris.png via OpenCV contour detection (epsilon=12); D has enclosed counter, P has OPEN counter (no hole)
- Logo uses CSS fill classes (`.d-path`/`.y-path`/`.p-path`) for per-mode color inversion
- Design modes swapped: Modo Claro = default (`modo-profesional` active), Modo oscuro = toggled (class removed). CSS class naming unchanged.
- Header buttons use `rgba(10,10,10,0.95)` in Modo Claro, `#515151` in Modo oscuro
- Clipboard fallback uses execCommand('copy') for file:// protocol
- Skeleton uses CSS `linear-gradient` shimmer animation (no extra JS or library)
- Only first image in carousel uses `loading="eager"`; rest use `loading="lazy"`
- Focus trap created fresh on each lightbox open via patched `abrirLightbox`
- URL hash uses `replaceState` (not pushState) to avoid polluting browser history on each marker click

## Next Steps
1. Wait for HINO PDF and CSV data to repeat the full process
2. Add sync button visibility check: hide when not on localhost (or show disabled state)
3. Consider caching sync output to avoid re-running sync on every page load

## Critical Context
- Monseñor is the reference implementation; colon and sagrada-familia have identical feature set + design
- Logo files stored in `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\Logo\` (DyPgris.png — 1506×1094 px; also LogoWppSTecn.png, LogoWppVentasEmi.png, Diseño sin título (1).jpg)
- DyP branding is **inline SVG paths** traced from DyPgris.png across all pages; `.d-path`, `.y-path`, `.p-path` CSS classes control fill colors per mode
- Python 3.14, OpenCV available for contour detection/tracing tools
- Design mode: default body has `class="modo-profesional"` (Modo Claro). Toggle removes class (Modo oscuro). localStorage key `dyp_tema = 'claro' | 'oscuro'`
- Browser compat: `-webkit-backdrop-filter`, `scrollbar-width` (Firefox), clipboard `execCommand` fallback, `crossorigin` on fonts preconnect
- PWA: manifest.json + sw.js in each branch folder + root
- No libraries added; all improvements use native browser APIs (View Transitions, PWA, etc.)
- All design modes, icons, fonts, and interactions must be compatible and reversible without data loss
- No server or build step required; all assets local

## Relevant Files
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\GUIA-AGENTES.md` — MANUAL OPERATIVO para agentes: cómo conectarse a GitHub y Cloudflare (wrangler login, deploy, D1), arquitectura, implementaciones y troubleshooting. LEER ANTES de intervenir.
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\Planos interactivos - Centro Motors.html` — MENÚ root (full DyP branding with SVG logo + theme toggle)
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\monsenor\index.html` — Monseñor (reference branch, all features)
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\colon\index.html` — Colón (fully upgraded)
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\sagrada-familia\index.html` — Sagrada Familia (fully upgraded)
- Each branch also has: `posicionador.html`, `plano*.png`, `coordenadas_*.json`, `manifest.json`, `sw.js`
- Root also has: `manifest.json`, `sw.js`
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\Logo\DyPgris.png` — source PNG logo (1506×1094, used for SVG tracing)
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\Logo\trazar_final.py` — OpenCV contour-to-SVG script (eps=12)
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\Logo\DyPgris_final_compact.svg` — compact SVG (viewBox 0 0 100 41) with traced paths
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\Logo\DyPgris_simplificado.svg` — full-size SVG trace output
- `C:\Users\Usuario\Downloads\Relevamiento Toyota - Toyota.csv` — source CSV (all branches)
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\sync_csv.py` — sincroniza CSV → HTMLs (Google Sheets + fallback local)
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\sync.bat` — doble clic para ejecutar sync_csv.py
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\servidor.py` — servidor local HTTP con endpoint /sync
- `C:\Users\Usuario\Desktop\TOYOTA\Interactivo\iniciar.bat` — inicia servidor y abre navegador
- Image dimensions: 3309×2339 px (all branches; sagrada-familia PA is 2986×555 after margin crop)

## Sincronizacion CSV a HTML
- **Flujo**: editar Google Sheets -> ejecutar `sync_csv.py` (o `sync.bat`, o boton Sync en pagina) -> actualiza `index.html` de las 3 sucursales
- **Fuente**: URL publica de Google Sheets (con cache-busting + _cb param); respaldo local si no hay internet
- **Cache de Google**: la URL publica puede tener hasta 1 minuto de cache. El script reintenta automaticamente hasta 3 veces con 15s de espera entre intentos si no detecta cambios
- **Campos que sincroniza**: `ubicacion`, `marca`, `capacidad`, `ultimo_service`, `estado`, `ot`
- **Campos que preserva**: `fotos`, `piso`, `x`, `y`
- **Normalizacion**: `estado` se normaliza a mayusculas/minusculas canonicas (OK, Necesita service, No funciona)
- **Timestamp**: cada HTML muestra en el footer el momento de la ultima sincronizacion
- **Batch**: `sync.bat` busca Python en PATH o rutas comunes (`C:\Python314\`, `C:\Python312\`, `C:\Python311\`)
- **Servidor local**: `servidor.py` inicia HTTP server en localhost:8000, sirve archivos estaticos + endpoint /sync
- **Sync button en pagina**: Cada branch HTML tiene boton de sincronizacion (junto al theme toggle). Solo visible cuando se accede via localhost. Llama a fetch('/sync'), actualiza EQUIPOS en memoria y re-renderiza marcadores/stats/filtros/lista sin recargar pagina
- **iniciar.bat**: Busca Python, inicia servidor.py y abre http://localhost:8000 en el navegador
- **Task Scheduler**: programar `sync.bat` para ejecucion diaria automatica
- **Cuidado**: el CSV tiene datos maestros -- si hay errores en la planilla, se reflejan en los HTMLs
