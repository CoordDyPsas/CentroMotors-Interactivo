# GUÍA PARA AGENTES — DyP Planos Interactivos

Guía de operación para que cualquier agente (o humano) pueda intervenir en este proyecto
sin partir de cero: qué es, cómo está hecho, y **cómo conectarse a GitHub y Cloudflare**.

> Complementa a `AGENTS.md` (que es el estado técnico/detallado). Este documento es el
> manual operativo: conexiones, comandos, y flujo de trabajo.

> **⚠️ REGLA OBLIGATORIA PARA AGENTES:** esta guía debe mantenerse al día en **cada**
> intervención (código, deploy, D1, datos, URLs, credenciales, flujos, features o
> troubleshooting). Si tocás algo del proyecto, actualizá las secciones correspondientes y
> registrá el cambio en **§11. Registro de actualizaciones** con fecha y qué cambió.
> La guía es la fuente de verdad operativa para futuros agentes. Una tarea NO está
> terminada hasta que la guía quede documentada.

---

## 1. Qué es el proyecto

Planos interactivos de aire acondicionado para **Toyota Centro Motors** (marca **DyP —
Desarrollos y Proyectos**). Cada sucursal tiene su propio `index.html` autocontenido con:

- Plano con marcadores de equipos (zoom, pan, minimapa, búsqueda, filtros por estado/marca/capacidad).
- Panel de detalle por equipo (fotos, carousel, lightbox, OT descargable, historial de OTs, comentarios).
- Dos modos de diseño (Modo Claro / Modo oscuro) con persistencia en `localStorage`.
- Sucursales: **monsenor**, **colon**, **sagrada-familia** (activas) y **hino** (sin planos aún).

El menú raíz (`Planos interactivos - Centro Motors.html`) lista las sucursales y muestra
un dashboard con el desglose de estados por sucursal.

## 2. Repositorio y estructura

- **Remote:** `https://github.com/CoordDyPsas/CentroMotors-Interactivo.git` (rama `main`).
- **Despliegue:** Cloudflare Pages → https://relevamientocm.pages.dev/

```
Interactivo/
├── Planos interactivos - Centro Motors.html  ← menú raíz (dashboard)
├── monsenor/index.html                       ← sucursal de referencia (todas las features)
├── colon/index.html
├── sagrada-familia/index.html
├── hino/                                     ← vacía (sin planos todavía)
├── functions/                                ← Cloudflare Pages Functions (backend)
│   ├── _middleware.js                        ← auth JWT + roles + restricciones
│   ├── login.js, admin.js, ...
│   └── api/
│       ├── login.js, me.js, logout.js
│       ├── equipos/[branch].js               ← devuelve EQUIPOS por sucursal
│       ├── sync.js                           ← sincroniza Google Sheets + registra historial OT
│       ├── ot-historial.js                   ← historial de OTs por equipo
│       ├── comentarios.js                    ← comentarios (árbol, resuelto, archivado)
│       └── admin/...
├── db/                                       ← DDL de D1 (tablas), aplicado a mano con wrangler
├── wrangler.toml                             ← binding D1 (database dyp-tracking)
├── deploy-cloudflare.bat                     ← deploy pidiendo token de API
├── Logo/                                     ← logo DyP + scripts de trazado SVG
└── ot/<sucursal>/                            ← PDFs de OTs descargados
```

## 3. Conectarse a GitHub

```powershell
# Estado
git status
git diff --stat

# Commitear (SOLO si el usuario lo pide)
git add -A
git commit -m "descripción clara"
git push origin main
```

Regla: **no hacer commit/push salvo que el usuario lo pida explícitamente.** Antes de
commitear, revisar `git status`, `git diff` y `git log --oneline -10` para respetar el estilo.

## 4. Conectarse a Cloudflare (Pages + D1 + Functions)

### 4.1 Login (una sola vez por máquina)

```powershell
npx wrangler login
```

Abre el navegador → iniciás sesión con la cuenta de Cloudflare. La sesión queda guardada en
`C:\Users\Usuario\.wrangler\config\default.toml`. **No hace falta token manual.**

> ⚠️ **El token de API NO está guardado en el repo ni en ningún archivo del proyecto.**
> No buscarlo ahí. Si `wrangler login` no funciona, hay que crear un token de API:
> https://dash.cloudflare.com/profile/api-tokens → Create Custom Token con permisos
> **Account › Cloudflare Pages › Edit**, **Account › Workers Scripts › Edit**, **Account › D1 › Edit**.

### 4.2 Desplegar a producción

```powershell
npx wrangler pages deploy . --project-name relevamientocm --branch main
```

- Sube los estáticos + el bundle de Functions. La URL de producción queda actualizada.
- Cada deploy imprime una URL de preview única; la producción sigue siendo
  https://relevamientocm.pages.dev/

### 4.3 Base de datos D1 (`dyp-tracking`, binding `DB`)

```powershell
# Migración (ejecutar DDL):
npx wrangler d1 execute dyp-tracking --remote --file db/ot_historial.sql

# Consulta/UPDATE directo:
npx wrangler d1 execute dyp-tracking --remote --command "SELECT * FROM ot_historial LIMIT 10;"

# Dev local (usa .wrangler/state, NO toca producción):
npx wrangler d1 execute dyp-tracking --local --command "SELECT 1;"
```

> ⚠️ Siempre usar `--remote` para tocar producción y `--file` para migraciones desde `db/`.

## 5. Arquitectura y base de datos

- **Frontend:** HTML autocontenido (datos de equipos embebidos en `const EQUIPOS`). Sin build step.
- **Backend:** Cloudflare Pages **Functions** (`functions/**`), middleware global en `_middleware.js`.
- **Auth:** JWT (HMAC-SHA256, `JWT_SECRET` en secrets del proyecto). Cookies `dyp_token`.
  Roles: `admin`, `propio`, `visitante`. Sucursales `colon` y `monsenor` son **admin-only**
  (los no-admin ven "Próximamente" / 403).
- **D1** (`dyp-tracking`) — tablas (creadas con `db/*.sql`):
  - `usuarios`, `sesiones` — auth.
  - `page_views`, `clicks` — tracking interno.
  - `comentarios` — comentarios por equipo (con `parent_id`, `resuelto`, `archivado`).
  - `ot_historial` — historial de OTs (`branch, equipo_nro, ot, agregado`, PK compuesta).

## 6. Implementaciones principales (resumen)

- Panel + lightbox con carousel (scroll-snap, drag, dots), buscador con sugerencias, filtros
  por estado/marca/capacidad, lista de equipos, export CSV, minimapa, copiar al portapapeles.
- Marcadores color-coded (OK/Necesita/No funciona) con pulso en "Necesita", auto-centrado,
  flash al seleccionar, URL hash `#eq-N`.
- Comentarios: árbol de respuestas, "Resuelto", "Archivar resueltos" (reversible), roles.
- **Historial de OTs** (feature reciente): tarjeta colapsable en el panel
  ("Historial OT" + contador). Click para desplegar. Se llena con `/api/sync`
  (`INSERT OR IGNORE`, acumula OTs históricas) y se consulta con `/api/ot-historial`.
  **La OT actual también se muestra** en la tarjeta (se quitó el filtro que la excluía para
  que la tarjeta sea visible desde el día 1).
- PWA (manifest + sw.js minimal), View Transitions, atajos de teclado, focus trap en lightbox.
- **Reporte de urgencia de service** (Fase 1): botón "Reporte" en el header de cada sucursal
  (junto a Lista y CSV). Abre un overlay/modal con tabla rankeada por urgencia (sin fecha
  primero, luego por fecha más vieja). Columnas: #, Ubicación, Marca, Capacidad, Estado
  (badge), Último service (fecha + relativo). Escape cierra. Menú raíz: botón "Reporte" en
  cada tarjeta activa, fetcha de `/api/equipos/[branch]` (muestra error para no-admin en
  colon/monsenor). Fase 2 (email) pendiente.
- Modos de diseño con `body.modo-profesional` (Claro) / sin clase (oscuro), persistidos en
  `localStorage` (`dyp_tema`).

## 7. Sincronización de datos (Google Sheets → app)

- La fuente de verdad es una **Google Sheet pública** (URL en `functions/api/sync.js`,
  constante `CSV_URL`). Cada sucursal ocupa un bloque de columnas en la misma hoja.
- **`/api/sync`** (botón Sync en cada página, admin): baja el CSV, actualiza datos en memoria
  y **registra el historial OT** (`registrarHistorialOT` inserta cada `ot` numérico vigente).
- Para **re-sembrar** el historial manualmente (p. ej. si se borró la tabla):
  1. Bajar el CSV: `sync.js` `CSV_URL` (agregar `&_cb=<timestamp>` para evitar caché de Google).
  2. Parsear OTs por `(branch, equipo_nro)` y generar `INSERT OR IGNORE ...`.
  3. `npx wrangler d1 execute dyp-tracking --remote --file seed.sql`.
- Verificación rápida: reconciliar `ot_historial` contra la planilla (no debería haber filas
  cuyo `ot` no coincida con la OT vigente, salvo OTs históricas reales ya reemplazadas).

## 8. Flujo de trabajo típico para intervenir

1. **Entender el estado:** leer `AGENTS.md`, `git status` (ver qué hay sin commitear) y el
   historial reciente (`git log --oneline -10`).
2. **Editar:** los cambios se hacen en el disco (HTML/functions). Todo se despliega junto.
3. **Probar:** como las páginas requieren auth y `/api/*` corre en Cloudflare, lo más fiable
   es desplegar y probar en producción (Ctrl+F5 para saltar caché). Alternativa local:
   `npx wrangler pages dev .` (usa la D1 local en `.wrangler/state`, que es una copia vieja).
4. **Desplegar:** comando de la sección 4.2.
5. **Si toca la D1:** migraciones con `db/*.sql` (`--remote --file`); datos de prueba, revisar
   siempre contra la planilla y **no dejar datos falsos en producción**.
6. **Solo si el usuario lo pide:** commitear y pushear a GitHub.

## 9. Troubleshooting

- **"Sigo viendo lo mismo / no cambia nada":** casi siempre es **caché del navegador** o
  **no se desplegó**. Hacer Ctrl+F5 y/o correr el deploy. Verificar con
  `npx wrangler pages deployment list --project-name relevamientocm`.
- **Tarjeta "Historial OT" no aparece:** la tabla `ot_historial` está vacía. Correr el botón
  Sync (admin) en la sucursal o re-sembrar (sección 7).
- **401 al llamar `/api/*`:** falta sesión (cookie `dyp_token`). Entrar por `/login`.
- **403 en colon/monsenor:** el usuario no es admin (son sucursales restringidas).
- **`npx wrangler` pide instalación:** es normal, lo baja solo.
- **Login de Cloudflare expirado:** repetir `npx wrangler login`.

## 10. Datos sensibles — NO commitear ni exponer

- `JWT_SECRET` (secrets de Cloudflare; **no** hay fallback en el código).
- `wrangler.toml` está en `.gitignore`; contiene el `database_id` de D1.
- Sesiones OAuth de wrangler (`~/.wrangler/`).
- Tokens de API de Cloudflare (solo se ingresan en `wrangler login` o `deploy-cloudflare.bat`).

## 11. Registro de actualizaciones

> Cada vez que intervengas en el proyecto, agregá acá una entrada con la fecha y un resumen
> de lo que cambió (nuevas features, comandos, tablas, endpoints, fixes, datos). Formato:
> `- **DD/MM/YYYY** — descripción.`

- **12/08/2026** — Creación de esta guía como manual operativo para agentes. Se documentó:
  arquitectura, conexión a GitHub (repo `CoordDyPsas/CentroMotors-Interactivo`) y Cloudflare
  (`wrangler login` + deploy a Pages `relevamientocm` + comandos D1 `dyp-tracking`),
  implementaciones, sync de Google Sheets, troubleshooting y datos sensibles.
- **12/08/2026** — Desplegado el **historial de OTs** (tarjeta colapsable en las 3 sucursales)
  a producción. Creada la tabla `ot_historial` en D1 y sembrada con las OTs vigentes de la
  planilla (74 filas, reconciliadas contra Google Sheets). Eliminada la fila de prueba falsa
  `(sagrada-familia, 2, 6163)`. Se documentó el flujo completo en §4.3, §6 y §7.
- **13/08/2026** — Implementada **Fase 1 del Reporte de Urgencia de Service** en las 3
  sucursales y el menú raíz. Botón "Reporte" (ícono `ph-chart-bar`) en el header junto a
  Lista/CSV. Overlay con tabla rankeada: sin fecha primero (más urgente), luego por fecha
  ascendente. Columnas: #, Ubicación, Marca, Capacidad, Estado (badge), Último service
  (fecha + relativo). Escape cierra. Menú raíz: botón "Reporte" en cada tarjeta activa,
  fetcha de `/api/equipos/[branch]` con error controlado para colon/monsenor (no-admin).
  CSS: `.reporte-overlay`, `.reporte-panel`, `.reporte-tabla`, `.estado-badge`, ambos modos.
  Funciones: `generarRanking()`, `formatearFechaCorta()`, `abrirReporte()`, `cerrarReporte()`.
  Fase 2 (email vía Gmail SMTP) pendiente.
