# GUÃA PARA AGENTES â€” DyP Planos Interactivos

GuÃ­a de operaciÃ³n para que cualquier agente (o humano) pueda intervenir en este proyecto
sin partir de cero: quÃ© es, cÃ³mo estÃ¡ hecho, y **cÃ³mo conectarse a GitHub y Cloudflare**.

> Complementa a `AGENTS.md` (que es el estado tÃ©cnico/detallado). Este documento es el
> manual operativo: conexiones, comandos, y flujo de trabajo.

> **âš ï¸ REGLA OBLIGATORIA PARA AGENTES:** esta guÃ­a debe mantenerse al dÃ­a en **cada**
> intervenciÃ³n (cÃ³digo, deploy, D1, datos, URLs, credenciales, flujos, features o
> troubleshooting). Si tocÃ¡s algo del proyecto, actualizÃ¡ las secciones correspondientes y
> registrÃ¡ el cambio en **Â§11. Registro de actualizaciones** con fecha y quÃ© cambiÃ³.
> La guÃ­a es la fuente de verdad operativa para futuros agentes. Una tarea NO estÃ¡
> terminada hasta que la guÃ­a quede documentada.

---

## 1. QuÃ© es el proyecto

Planos interactivos de aire acondicionado para **Toyota Centro Motors** (marca **DyP â€”
Desarrollos y Proyectos**). Cada sucursal tiene su propio `index.html` autocontenido con:

- Plano con marcadores de equipos (zoom, pan, minimapa, bÃºsqueda, filtros por estado/marca/capacidad).
- Panel de detalle por equipo (fotos, carousel, lightbox, OT descargable, historial de OTs, comentarios).
- Dos modos de diseÃ±o (Modo Claro / Modo oscuro) con persistencia en `localStorage`.
- Sucursales: **monsenor**, **colon**, **sagrada-familia** (activas), **hino** (nombre visible "Hino / Spilimbergo", sin planos aÃºn) y **lexus** (nueva, sin planos aÃºn).

El menÃº raÃ­z (`Planos interactivos - Centro Motors.html`) lista las sucursales y muestra
un dashboard con el desglose de estados por sucursal.

## 2. Repositorio y estructura

- **Remote:** `https://github.com/CoordDyPsas/CentroMotors-Interactivo.git` (rama `main`).
- **Despliegue:** Cloudflare Pages â†’ https://relevamientocm.pages.dev/

```
Interactivo/
â”œâ”€â”€ Planos interactivos - Centro Motors.html  â† menÃº raÃ­z (dashboard)
â”œâ”€â”€ monsenor/index.html                       â† sucursal de referencia (todas las features)
â”œâ”€â”€ colon/index.html
â”œâ”€â”€ sagrada-familia/index.html
â”œâ”€â”€ hino/                                     â† vacÃ­a (sin planos todavÃ­a)
â”œâ”€â”€ functions/                                â† Cloudflare Pages Functions (backend)
â”‚   â”œâ”€â”€ _middleware.js                        â† auth JWT + roles + restricciones
â”‚   â”œâ”€â”€ login.js, admin.js, ...
â”‚   â””â”€â”€ api/
â”‚       â”œâ”€â”€ login.js, me.js, logout.js
â”‚       â”œâ”€â”€ equipos/[branch].js               â† devuelve EQUIPOS por sucursal
â”‚       â”œâ”€â”€ sync.js                           â† sincroniza Google Sheets + registra historial OT
â”‚       â”œâ”€â”€ ot-historial.js                   â† historial de OTs por equipo
â”‚       â”œâ”€â”€ comentarios.js                    â† comentarios (Ã¡rbol, resuelto, archivado)
â”‚       â””â”€â”€ admin/...
â”œâ”€â”€ db/                                       â† DDL de D1 (tablas), aplicado a mano con wrangler
â”œâ”€â”€ wrangler.toml                             â† binding D1 (database dyp-tracking)
â”œâ”€â”€ deploy-cloudflare.bat                     â† deploy pidiendo token de API
â”œâ”€â”€ Logo/                                     â† logo DyP + scripts de trazado SVG
â””â”€â”€ ot/<sucursal>/                            â† PDFs de OTs descargados
```

## 3. Conectarse a GitHub

```powershell
# Estado
git status
git diff --stat

# Commitear (SOLO si el usuario lo pide)
git add -A
git commit -m "descripciÃ³n clara"
git push origin main
```

Regla: **no hacer commit/push salvo que el usuario lo pida explÃ­citamente.** Antes de
commitear, revisar `git status`, `git diff` y `git log --oneline -10` para respetar el estilo.

## 4. Conectarse a Cloudflare (Pages + D1 + Functions)

### 4.1 Login (una sola vez por mÃ¡quina)

```powershell
npx wrangler login
```

Abre el navegador â†’ iniciÃ¡s sesiÃ³n con la cuenta de Cloudflare. La sesiÃ³n queda guardada en
`C:\Users\Usuario\.wrangler\config\default.toml`. **No hace falta token manual.**

> âš ï¸ **El token de API NO estÃ¡ guardado en el repo ni en ningÃºn archivo del proyecto.**
> No buscarlo ahÃ­. Si `wrangler login` no funciona, hay que crear un token de API:
> https://dash.cloudflare.com/profile/api-tokens â†’ Create Custom Token con permisos
> **Account â€º Cloudflare Pages â€º Edit**, **Account â€º Workers Scripts â€º Edit**, **Account â€º D1 â€º Edit**.

### 4.2 Desplegar a producciÃ³n

```powershell
npx wrangler pages deploy . --project-name relevamientocm --branch main
```

- Sube los estÃ¡ticos + el bundle de Functions. La URL de producciÃ³n queda actualizada.
- Cada deploy imprime una URL de preview Ãºnica; la producciÃ³n sigue siendo
  https://relevamientocm.pages.dev/

### 4.3 Base de datos D1 (`dyp-tracking`, binding `DB`)

```powershell
# MigraciÃ³n (ejecutar DDL):
npx wrangler d1 execute dyp-tracking --remote --file db/ot_historial.sql

# Consulta/UPDATE directo:
npx wrangler d1 execute dyp-tracking --remote --command "SELECT * FROM ot_historial LIMIT 10;"

# Dev local (usa .wrangler/state, NO toca producciÃ³n):
npx wrangler d1 execute dyp-tracking --local --command "SELECT 1;"
```

> âš ï¸ Siempre usar `--remote` para tocar producciÃ³n y `--file` para migraciones desde `db/`.

## 5. Arquitectura y base de datos

- **Frontend:** HTML autocontenido (datos de equipos embebidos en `const EQUIPOS`). Sin build step.
- **Backend:** Cloudflare Pages **Functions** (`functions/**`), middleware global en `_middleware.js`.
- **Auth:** JWT (HMAC-SHA256, `JWT_SECRET` en secrets del proyecto). Cookies `dyp_token`.
  Roles: `admin`, `propio`, `visitante`. Sucursales `colon` y `monsenor` son **admin-only**
  (los no-admin ven "PrÃ³ximamente" / 403).
- **D1** (`dyp-tracking`) â€” tablas (creadas con `db/*.sql`):
  - `usuarios`, `sesiones` â€” auth.
  - `page_views`, `clicks` â€” tracking interno.
  - `comentarios` â€” comentarios por equipo (con `parent_id`, `resuelto`, `archivado`).
  - `ot_historial` â€” historial de OTs (`branch, equipo_nro, ot, agregado`, PK compuesta).

## 6. Implementaciones principales (resumen)

- Panel + lightbox con carousel (scroll-snap, drag, dots), buscador con sugerencias, filtros
  por estado/marca/capacidad, lista de equipos, export CSV, minimapa, copiar al portapapeles.
- Marcadores color-coded (OK/Necesita/No funciona) con pulso en "Necesita", auto-centrado,
  flash al seleccionar, URL hash `#eq-N`.
- Comentarios: Ã¡rbol de respuestas, "Resuelto", "Archivar resueltos" (reversible), roles.
- **Historial de OTs** (feature reciente): tarjeta colapsable en el panel
  ("Historial OT" + contador). Click para desplegar. Se llena con `/api/sync`
  (`INSERT OR IGNORE`, acumula OTs histÃ³ricas) y se consulta con `/api/ot-historial`.
  **La OT actual tambiÃ©n se muestra** en la tarjeta (se quitÃ³ el filtro que la excluÃ­a para
  que la tarjeta sea visible desde el dÃ­a 1).
- PWA (manifest + sw.js minimal), View Transitions, atajos de teclado, focus trap en lightbox.
- **Reporte de urgencia de service** (Fase 1+2): botÃ³n "Reporte" en el header de cada sucursal
  (junto a Lista y CSV). Abre un overlay/modal con tabla rankeada por urgencia (sin fecha
  primero, luego por fecha mÃ¡s vieja). Columnas: #, UbicaciÃ³n, Marca, Capacidad, Estado
  (badge), Ãšltimo service (fecha + relativo). Escape cierra. MenÃº raÃ­z: botÃ³n "Reporte" en
  cada tarjeta activa, fetcha de `/api/equipos/[branch]` (muestra error para no-admin en
  colon/monsenor).
  - **Fase 2 (email vÃ­a Gmail API REST)**: `functions/api/reporte.js` â€” POST endpoint, JWT
    auth (admin/propio), OAuth token refresh con `GMAIL_REFRESH_TOKEN`, MIME email con tabla
    HTML inline, envÃ­o vÃ­a Gmail API REST (`/gmail/v1/users/me/messages/send`). BotÃ³n
    "Enviar por mail" en overlays de las 3 sucursales + menÃº raÃ­z (solo admin/propio).
    Cloudflare secrets: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`,
    `REPORTE_TO`. CSS: `.reporte-enviar` (branches), `.reporte-enviar-root` (menu).
    Estados del botÃ³n: loading â†’ enviado âœ“ / error (auto-reset 3-4s).
- Modos de diseÃ±o con `body.modo-profesional` (Claro) / sin clase (oscuro), persistidos en
  `localStorage` (`dyp_tema`).
- **Ruteo de service** (feature reciente): en el overlay del reporte hay una columna de
  checkboxes por equipo + barra de acciÃ³n (Vencidos / Limpiar / Rutear (n)). `generarRuta()`
  ordena por urgencia (rojoâ†’amarilloâ†’grisâ†’verdeâ†’negro, primera fecha vencida dentro del
  color), arranca en el mÃ¡s urgente, agrupa por bloques de color (`chunksPorUrgencia`) y
  resuelve cada bloque con greedy del vecino mÃ¡s cercano (distancia en px del plano) +
  **`optimizarBloque()` (2-opt)** que elimina cruces/retrocesos manteniendo fijo el primer
  equipo del bloque; separa
  pisos (primero el piso del equipo mÃ¡s urgente). `renderizarRuta()` lista Orden/#/Piso/
  UbicaciÃ³n/Estado/Ãšltimo service/Dist. parcial/Dist. acumulada. `dibujarRuta()` crea un SVG
  dinÃ¡mico `#ruta-svg` dentro del container del plano (polilÃ­nea #ff6900 + nÃºmeros) que hereda
  zoom/pan y se redibuja con el piso. Click en fila centra el equipo (`centrarEnRuta`, cambia
  de piso si hace falta). `refrescarRutaPorFiltros()` (hook al final de `renderizarMarcadores`)
  recalcula la ruta con filtros/bÃºsqueda activos y la cierra si quedan <2 equipos.
  `descargarPDFRuta()` genera `ruta_<branch>.pdf` con jsPDF 2.5.2 + jspdf-autotable 3.8.4.

## 7. SincronizaciÃ³n de datos (Google Sheets â†’ app)

- La fuente de verdad es una **Google Sheet pÃºblica** (URL en `functions/api/sync.js`,
  constante `CSV_URL`). Cada sucursal ocupa un bloque de columnas en la misma hoja.
- **`/api/sync`** (botÃ³n Sync en cada pÃ¡gina, admin): baja el CSV, actualiza datos en memoria
  y **registra el historial OT** (`registrarHistorialOT` inserta cada `ot` numÃ©rico vigente).
- Para **re-sembrar** el historial manualmente (p. ej. si se borrÃ³ la tabla):
  1. Bajar el CSV: `sync.js` `CSV_URL` (agregar `&_cb=<timestamp>` para evitar cachÃ© de Google).
  2. Parsear OTs por `(branch, equipo_nro)` y generar `INSERT OR IGNORE ...`.
  3. `npx wrangler d1 execute dyp-tracking --remote --file seed.sql`.
- VerificaciÃ³n rÃ¡pida: reconciliar `ot_historial` contra la planilla (no deberÃ­a haber filas
  cuyo `ot` no coincida con la OT vigente, salvo OTs histÃ³ricas reales ya reemplazadas).

## 8. Flujo de trabajo tÃ­pico para intervenir

1. **Entender el estado:** leer `AGENTS.md`, `git status` (ver quÃ© hay sin commitear) y el
   historial reciente (`git log --oneline -10`).
2. **Editar:** los cambios se hacen en el disco (HTML/functions). Todo se despliega junto.
3. **Probar:** como las pÃ¡ginas requieren auth y `/api/*` corre en Cloudflare, lo mÃ¡s fiable
   es desplegar y probar en producciÃ³n (Ctrl+F5 para saltar cachÃ©). Alternativa local:
   `npx wrangler pages dev .` (usa la D1 local en `.wrangler/state`, que es una copia vieja).
4. **Desplegar:** comando de la secciÃ³n 4.2.
5. **Si toca la D1:** migraciones con `db/*.sql` (`--remote --file`); datos de prueba, revisar
   siempre contra la planilla y **no dejar datos falsos en producciÃ³n**.
6. **Solo si el usuario lo pide:** commitear y pushear a GitHub.

## 9. Troubleshooting

- **"Sigo viendo lo mismo / no cambia nada":** casi siempre es **cachÃ© del navegador** o
  **no se desplegÃ³**. Hacer Ctrl+F5 y/o correr el deploy. Verificar con
  `npx wrangler pages deployment list --project-name relevamientocm`.
- **Tarjeta "Historial OT" no aparece:** la tabla `ot_historial` estÃ¡ vacÃ­a. Correr el botÃ³n
  Sync (admin) en la sucursal o re-sembrar (secciÃ³n 7).
- **401 al llamar `/api/*`:** falta sesiÃ³n (cookie `dyp_token`). Entrar por `/login`.
- **403 en colon/monsenor:** el usuario no es admin (son sucursales restringidas).
- **`npx wrangler` pide instalaciÃ³n:** es normal, lo baja solo.
- **Login de Cloudflare expirado:** repetir `npx wrangler login`.

## 10. Datos sensibles â€” NO commitear ni exponer

- `JWT_SECRET` (secrets de Cloudflare; **no** hay fallback en el cÃ³digo).
- `wrangler.toml` estÃ¡ en `.gitignore`; contiene el `database_id` de D1.
- Sesiones OAuth de wrangler (`~/.wrangler/`).
- Tokens de API de Cloudflare (solo se ingresan en `wrangler login` o `deploy-cloudflare.bat`).

## 11. Registro de actualizaciones

> Cada vez que intervengas en el proyecto, agregÃ¡ acÃ¡ una entrada con la fecha y un resumen
> de lo que cambiÃ³ (nuevas features, comandos, tablas, endpoints, fixes, datos). Formato:
> `- **DD/MM/YYYY** â€” descripciÃ³n.`

- **12/08/2026** â€” CreaciÃ³n de esta guÃ­a como manual operativo para agentes. Se documentÃ³:
  arquitectura, conexiÃ³n a GitHub (repo `CoordDyPsas/CentroMotors-Interactivo`) y Cloudflare
  (`wrangler login` + deploy a Pages `relevamientocm` + comandos D1 `dyp-tracking`),
  implementaciones, sync de Google Sheets, troubleshooting y datos sensibles.
- **12/08/2026** â€” Desplegado el **historial de OTs** (tarjeta colapsable en las 3 sucursales)
  a producciÃ³n. Creada la tabla `ot_historial` en D1 y sembrada con las OTs vigentes de la
  planilla (74 filas, reconciliadas contra Google Sheets). Eliminada la fila de prueba falsa
  `(sagrada-familia, 2, 6163)`. Se documentÃ³ el flujo completo en Â§4.3, Â§6 y Â§7.
- **13/08/2026** â€” Implementada **Fase 1 del Reporte de Urgencia de Service** en las 3
  sucursales y el menÃº raÃ­z. BotÃ³n "Reporte" (Ã­cono `ph-chart-bar`) en el header junto a
  Lista/CSV. Overlay con tabla rankeada: sin fecha primero (mÃ¡s urgente), luego por fecha
  ascendente. Columnas: #, UbicaciÃ³n, Marca, Capacidad, Estado (badge), Ãšltimo service
  (fecha + relativo). Escape cierra. MenÃº raÃ­z: botÃ³n "Reporte" en cada tarjeta activa,
  fetcha de `/api/equipos/[branch]` con error controlado para colon/monsenor (no-admin).
  CSS: `.reporte-overlay`, `.reporte-panel`, `.reporte-tabla`, `.estado-badge`, ambos modos.
  Funciones: `generarRanking()`, `formatearFechaCorta()`, `abrirReporte()`, `cerrarReporte()`.
  Fase 2 (email vÃ­a Gmail API REST) pendiente.
- **19/08/2026** â€” Implementada **Fase 2 del Reporte de Urgencia (email vÃ­a Gmail API REST)**.
  Creado `functions/api/reporte.js` con: POST endpoint, JWT auth (admin/propio), OAuth token
  refresh, MIME email con tabla HTML, envÃ­o vÃ­a Gmail API REST. Configurados 4 Cloudflare
  secrets (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `REPORTE_TO`).
  Agregado botÃ³n "Enviar por mail" (`.reporte-enviar` / `.reporte-enviar-root`) en overlays
  de las 3 sucursales y menÃº raÃ­z, visible solo para admin/propio. Estados: loading â†’
  enviado âœ“ / error (auto-reset). OAuth creds: proyecto Google Cloud "dyp-email", Gmail
  API habilitada, pantalla de consentimiento "DyP Reportes" (externo, usuario test
  coordinacionst.dypsas@gmail.com).
- **21/08/2026** â€” **Descarga real de PDF del reporte** en `colon/index.html`: reemplazado el
  flujo iframe+print de `descargarPDF()` por generaciÃ³n real con **html2pdf.js 0.10.2**
  (CDN cdnjs, script agregado antes de `</body>`). La funciÃ³n ahora arma un div oculto
  off-screen con la misma tabla rankeada, lo convierte a PDF A4 portrait (`html2canvas`
  scale 2) y descarga `reporte_<branch>.pdf`. BotÃ³n `.reporte-pdf` muestra estado loading
  ("Generando..." con spinner) y se restaura en then/catch.
- **21/08/2026** â€” **Descarga real de PDF del reporte replicada en `sagrada-familia/index.html`**:
  mismo reemplazo que colon (script html2pdf.js 0.10.2 antes de `</body>` + `descargarPDF()`
  con div off-screen, PDF A4 portrait, estado loading del botÃ³n `.reporte-pdf`).
- **21/08/2026** â€” **Descarga real de PDF del reporte replicada en `monsenor/index.html`**:
  mismo reemplazo que colon/sagrada-familia. Script html2pdf.js 0.10.2 (CDN cdnjs) agregado
  antes de `</body>` y `descargarPDF()` global reemplazada de iframe+print a generaciÃ³n real
  con html2pdf.js (div off-screen de 800px, PDF A4 portrait con margin 10mm, `html2canvas`
  scale 2 + useCORS, descarga `reporte_monsenor.pdf`). BotÃ³n `.reporte-pdf` con estado
  loading ("Generando..." con spinner) restaurado en then/catch. Las 3 sucursales quedan
  consistentes.
- **21/08/2026** â€” **Descarga real de PDF del reporte en el menÃº raÃ­z**
  (`Planos interactivos - Centro Motors.html`): script html2pdf.js 0.10.2 (CDN cdnjs)
  agregado antes de `</body>` y `descargarPDFRoot(branchName)` global reemplazada de
  iframe+print a generaciÃ³n real con html2pdf.js (div off-screen de 800px, PDF A4 portrait,
  margin 10mm, `html2canvas` scale 2 + useCORS). A diferencia de las sucursales, la funciÃ³n
  ahora **fetcha sus propios datos** de `/api/equipos/[branch]` en vez de usar el global
  `reporteRootRanking`, y recibe el nombre visible ("Sagrada Familia", "MonseÃ±or", "ColÃ³n")
  derivando el branch key (lowercase, Ã±â†’n, espaciosâ†’guiones). Notas: `/api/equipos/[branch]`
  devuelve un **array JSON pelado** (no `{equipos:[...]}`), por lo que se usa
  `Array.isArray(data) ? data : data.equipos`; el endpoint no expone `piso`, asÃ­ que la
   columna Piso muestra PB para todos (igual que antes). El botÃ³n PDF del overlay raÃ­z pasa
   el nombre vÃ­a mapa inline `{ 'sagrada-familia': 'Sagrada Familia', ... }[reporteRootBranch]`.
- **21/08/2026** â€” **Sistema de semÃ¡foro del reporte replicado en `sagrada-familia/index.html`**
   (reemplaza el ranking viejo por clasificaciÃ³n por vencimiento de service):
   - Nuevas funciones `parsearDias(str)` (dd/mm/yyyy â†’ dÃ­as transcurridos) y
     `clasificarEquipo(eq)` que asigna color: **negro** = No funciona; **gris** = sin fecha;
     **verde** = OK o dentro de intervalo; **amarillo** = a â‰¤30 dÃ­as del vencimiento;
     **rojo** = vencido (> intervalo_mesesÃ—30, default 6 meses).
   - `generarRanking(equipos)` nueva versiÃ³n Ãºnica (la anterior fue eliminada): ordena por
     prioridad rojoâ†’amarilloâ†’grisâ†’verdeâ†’negro y setea `item.sinFecha = color==='gris'`
     (compatible con `enviarReporte`, que sigue usando `.sinFecha`).
   - `abrirReporte()` reemplazada: primera columna "Semaforo" con pill coloreada
     (`SEMAFORO_HEX`: rojo #dc2626, amarillo #eab308, verde #22c55e, negro #1e1e1e,
     gris #9ca3af; labels Vencido/Por vencer/OK/No funciona/Sin registro); filas "Sin
     registro" con borde rojo punteado (border 2px #dc2626 en la pill).
   - `descargarPDF(branchName)` reemplazada (global, jsPDF + autoTable â€” esta sucursal usa
     jspdf@2.5.2 + jspdf-autotable@3.8.4, NO html2pdf): columna Semaforo con fillColor por
     estado ([220,38,38]/[234,179,8]/[34,197,94]/[30,30,30]/[156,163,175]) y borde rojo
     0.3px en toda la fila para items grises vÃ­a `didParseCell`. Nota: habÃ­a UNA sola copia
     de `generarRanking` en este archivo (no dos). Verificado sintaxis JS con node --check.

- **01/09/2026** �?" **Service reciente en 3 equipos de Col�n (7, 8 y 9)**. Se actualizaron en
  colon/index.html los datos maestros (fecha ultimo service = 29/08/2026, estado = OK) y la
  OT vigente. OTs: eq 7 = 9507, eq 8 = 9506, eq 9 = 9505 (antes: eq 7 = 6588, eq 9 = 6617;
  eq 8 no ten�a OT. La info provino de la planilla Google Sheets ya sincronizada). Adem�s se
  registraron las OTs nuevas en la tabla ot_historial v�a db/ot_historial_colon789.sql
  ejecutado con 
px wrangler d1 execute dyp-tracking --remote --file. Gracias al INSERT OR
  IGNORE con PK compuesta (branch, equipo_nro, ot), las OTs anteriores (6588 y 6617) quedan
  **visibles como historial** junto a la nueva (9507/9506/9505), cumpliendo el requisito de
  revisar OT anteriores cuando se actualiza la �ltima. Verificado en D1.

- **01/09/2026** �?" **Liberadas Col�n y Monse�or (todas las roles de usuario)**. Ya no se ocultan a
  propio/isitante. Se elimin�� la restricci�n por roles en server y front:
  - unctions/_middleware.js: quitados BRANCH_ADMIN_ONLY, isBranchRestricted y la funci�n
    proximamenteHTML (ya no se devuelve p�gina "Pr�ximamente" para colon/monsenor).
  - unctions/api/ot-historial.js y unctions/api/comentarios.js: quitado RESTRICTED =
    ['colon','monsenor'] y todos sus checks 403.
  - unctions/api/sync.js: ya no borra ranches.colon/ranches.monsenor para no-admin; devuelve
    todas las sucursales a cualquier usuario autenticado (es admin-only de todos modos).
  - Men� ra�z Planos interactivos - Centro Motors.html: enderDashboard ahora carga las tarjetas
    de Col�n/Monse�or din�micamente desde /api/equipos/[branch] para **todos** los tipos (antes solo
    admin; no-admin ve�a "Pr�ximamente"). Solo HINO queda como tarjeta "Pr�ximamente" (no tiene planos).
  El login sigue siendo obligatorio para todo el sitio (middleware: path no-whitelisted sin cookie ->
  redirect a /login). El bot�n "Enviar por mail" del reporte sigue siendo admin/propio (es un permiso,
  no una restricci�n por sucursal). Deploy: 96d3c3d.relevamientocm.pages.dev.

- **01/09/2026** �?" **"Hino / Spilimbergo" y nueva sucursal "Lexus"**. Renombrada la tarjeta de HINO en el
  men� ra�z a "Hino / Spilimbergo" y agregada "Lexus" como nueva sucursal. Ambas se muestran como tarjeta
  "Pr�ximamente" (marcadas con proximamente: true en SUCURSALES de Planos interactivos - Centro
  Motors.html). Se registr� lexus en los backends: unctions/api/sync.js (BK/BO, offset de planilla
  32), unctions/api/equipos/[branch].js (lexus: 32) y unctions/api/comentarios.js +
  unctions/api/ot-historial.js (arrays BRANCHES). hino conserva su key y offset 24. La planilla de
  Google Sheets a�n no tiene el bloque de columnas de Lexus ni el nombre nuevo de Hino; cuando lleguen los
  planos/CSV se cargar�n normalmente (orden de offsets asumido: colon 0, sagrada-familia 8, monsenor 16,
  hino 24, lexus 32).

- **01/09/2026** �?" **Service reciente en Col�n 10 y 12**. Se actualizaron los datos maestros en
  colon/index.html (fecha ultimo service = 29/08/2026, estado = OK) y las OTs nuevas: eq 10 = 9509,
  eq 12 = 9510 (antes eq 10 = 6617, eq 12 = 6616). Se registraron en ot_historial v�a
  db/ot_historial_colon10_12.sql ejecutado con 
px wrangler d1 execute dyp-tracking --remote --file.
  Por el INSERT OR IGNORE con PK compuesta, las OTs anteriores (6617 y 6616) quedan visibles como
  historial junto a la nueva (9509/9510). Verificado en D1. Deploy: 951421f9.relevamientocm.pages.dev.

- **14/09/2026** ??" **Tarjetas raiz normalizadas (carga instantanea sin fetch)**. Al liberar Colon y
  Monseñor (ya no se ocultan a ningun rol), ya no hace falta ocultar sus datos en el fuente. En
  `Planos interactivos - Centro Motors.html` (menu raiz), SUCURSALES vuelve a incluir para colon y
  monsenor el array estatico `equipos` (solo `{estado}`) + `fotos` (cantidad de equipos con al menos 1
  foto: colon 35, monsenor 21), al igual que venia haciendo sagrada-familia. `renderDashboard()` dejo
  de recibir `tipo` y de hacer `fetch('/api/equipos/[branch]')`: todas las tarjetas se arman al
  instante; solo las sucursales con `proximamente: true` (hino y lexus) muestran "Próximamente". Se
  elimino el tramo de loading/fetch dinamico (codigo muerto). Los datos estaticos quedan ligados a la
  planilla de Google Sheets: si cambian estados, hay que re-embedearlos (mismo tradeoff que
  sagrada-familia). Deploy pendiente.

- **14/09/2026** ??" **Auto-refresh de tarjetas raiz (tradeoff embebido automatizado)**. El menu raiz
  ahora pinta las tarjetas al instante con los datos embebidos (`renderDashboardConRefresh()` llama a
  `renderDashboard()` sincronico sin esperar `/api/me`) y luego `refrescarCardsDesdePlanilla()`
  fetchea `/api/equipos/[branch]` en background (Cache-Control no-cache) para cada sucursal activa,
  actualizando `.count` y los `.stat-pill` en el lugar con un fade sutil (0.55 -> 1, transition .4s)
  unicamente si los estados cambiaron en la planilla. Las tarjetas llevan `data-branch="<id>"` para
  ubicarlas. Cada pill se actualiza via `lastChild.nodeValue` (el numero es el ultimo nodo de texto,
  primero va el `<span class="d">`). Si el fetch falla, quedan los datos embebidos. El `.then` de
  `/api/me` solo setea `usuarioActual` y agrega el boton admin (el render ya paso). Con esto las
  tarjetas de colon/monsenor/sagrada-familia quedan frescas automaticamente sin reintroducir el
  loading lento del fetch dinamico.

- **15/09/2026** - **Revisión de seguridad + bug fixes + dead code + optimización (re-análisis completo)**.
  Fixes backend:
  - `functions/login.js` (C1 XSS): whitelist `^\/[a-zA-Z0-9\/_\-.?=&#%+]*$` + reject `//` prefix; escapes `\` y `'` mantenidos.
  - `functions/_middleware.js` (C2): `verifyToken` exige `payload.exp` (tokens sin exp → rechazados).
  - `functions/api/comentarios.js` (A2/A3): `archivar_resueltos` requiere admin/propio (403); `eliminarSubtree` retorna error 409 si hay respuestas de otros autores (non-admin), con `email` y `tipo` como parámetros.
  - `functions/api/track.js` (A4): reescrito sin `jose` import; usa `context.data.user`.
  - `functions/api/admin/usuarios.js` (A5): auto-desactivación y auto-cambio de rol bloqueados (actor-aware).
  Fixes frontend (3 branches):
  - `cargarHistorialOT`: guard de race (patrón `reqNro` + `equipoSeleccionado.nro !== reqNro`); param `otActual` eliminado (era dead).
  - `formatearFechaCorta`: fallback crudo `return str` → `return escaparHTML(str)` (XSS preventivo).
  - CSS responsive en colon y monsenor: bloque base (`.header-busqueda`, `.filter-select`, `.limpiar-btn`, `.stat-item`, `.header-stats` + modo-profesional) movido **antes** de `@media` para que los overrides responsive tengan efecto real.
  - `esc()`: eliminada 1 copia duplicada top-level en cada branch (colon, monsenor, sagrada); quedan 1 scoped (exportarCSV) + 1 top-level donde corresponde.
  - `centrarEnMarker`: eliminados call sites duplicados en lista y búsqueda (colon/monsenor); `mostrarEquipo` ya lo llama internamente.
  Fix raíz:
  - `formatearFechaCortaRoot`: fallback → `escRoot(str)` (antes `return str` crudo inyectado vía innerHTML).
  - `reporteRootRanking`: eliminado (variable declarada y asignada, nunca leída).
  - `refrescarCardsDesdePlanilla`: cache en `sessionStorage` con TTL 5 min (`cards_api_<branch>`); datos cacheados se aplican sin fade; fetch fresco aplica con fade y persiste en cache.
  Deploy: a4aa3d24.relevamientocm.pages.dev. Verificación: `node --check` de todos los .js y extracción+check del JS inline de los 4 HTML.

- **18/09/2026** — **Herramienta de ruteo de service en las 3 sucursales** (colon, monsenor,
  sagrada-familia). En el overlay del reporte: columna de checkboxes (header = "seleccionar
  todos") + barra de acción con "Vencidos (n)" / "Limpiar" / "Rutear (n)". Algoritmo en
  `generarRuta()`: sort por urgencia (rojo→amarillo→gris→verde→negro; mismo color → primera
  fecha vencida; verde/negro → por nro), arranca en el más urgente, separa pisos (primero el
  del más urgente), `chunksPorUrgencia()` agrupa bloques consecutivos por color y cada bloque
  se resuelve con greedy del vecino más cercano (distancia euclidiana en px) + **`optimizarBloque()`**
  (2-opt): reordena el bloque eliminando cruces/retrocesos con el primer equipo fijo (el más
  urgente del bloque; en el piso 2, el más cercano al final del piso 1). En validación con
  datos reales de Colón (26 vencidos) el recorrido bajó de 5755 px a 5233 px (9%) y el orden
  quedó #35→#42 determinista. `renderizarRuta()`
  tabla Orden/#/Piso/Ubicación/Estado/Último service/Dist. parcial/Dist. acumulada + chips.
  `dibujarRuta()` SVG dinámico `#ruta-svg` dentro del container (polilínea #ff6900 + círculos
  numerados), hereda zoom/pan y se redibuja al cambiar de piso (sagrada usa `curImgW/curImgH`;
  colon/monsenor `IMG_W/IMG_H`). Click en fila = `centrarEnRuta()` (cambia de piso 300ms +
  centra + flash). `refrescarRutaPorFiltros()` hook al final de `renderizarMarcadores` recalcula
  la ruta con filtros/búsqueda activos y la cierra si quedan <2 equipos. `cerrarRuta()` limpia
  overlay+SVG. `descargarPDFRuta()` genera `ruta_<branch>.pdf` con jsPDF 2.5.2 +
  jspdf-autotable 3.8.4 (ya cargadas; sin librerías nuevas). Fix durante la implementación:
  `chunksPorUrgencia` devuelve `{color, items}` → `bloque.items.map(...)` (no `bloque.map`).
  Verificación: `node --check` del JS inline de los 3 HTML + test en Node del algoritmo con
  datos reales de Colón (26 vencidos → orden #35→#42, determinista).
  **Deploy a producción**: `2f95cacf` (Production, main, `npx wrangler pages deploy . --project-name
  relevamientocm --branch main`). Verificado: `/colon/` → 302 a `/login` (auth obligatoria OK),
  `/login` → 200, `/api/equipos/sagrada-familia` sin sesión → 401 `{"error":"No autorizado"}`
  (middleware OK). **Nota wrangler**: wrangler 4.135 muestra warning de que `wrangler.toml`
  (binding D1) se ignora por falta de `pages_build_output_dir` — es análogo al deploy anterior
  `a4aa3d24`; las funciones siguen funcionando (el 401 lo confirma) y el binding D1 se
  configura vía Dashboard.**
