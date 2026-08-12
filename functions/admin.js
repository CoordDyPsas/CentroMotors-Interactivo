export async function onRequest(context) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard — DyP</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;background:#f0f2f5;padding:24px;color:#111}
h1{font-size:22px;margin-bottom:4px}
.sub{color:#666;font-size:13px;margin-bottom:20px}
.cards{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.card{background:#fff;border-radius:10px;padding:20px 24px;flex:1;min-width:140px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
.card .num{font-size:28px;font-weight:700;color:#ff6900}
.card .lbl{font-size:12px;color:#666;margin-top:2px}
h2{font-size:16px;margin-bottom:10px;margin-top:20px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
th{background:#f8f9fa;font-size:11px;font-weight:600;color:#666;text-transform:uppercase;padding:10px 12px;text-align:left}
td{padding:8px 12px;font-size:13px;border-top:1px solid #eee}
.section{margin-bottom:24px}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
.badge-admin{background:#fff3e0;color:#e65100}
.badge-propio{background:#e3f2fd;color:#1565c0}
.badge-visitante{background:#fce4ec;color:#c62828}
.logout{display:inline-block;margin-top:20px;color:#ff6900;text-decoration:none;font-size:13px;font-weight:600}
.logout:hover{text-decoration:underline}
.loading{color:#999;font-size:13px;padding:12px}
.btn-cerrar{background:#e63946;color:#fff;border:none;border-radius:4px;padding:3px 10px;font-size:11px;cursor:pointer;font-weight:600}
.btn-cerrar:hover{background:#c1121f}
.btn-cerrar:disabled{opacity:.5;cursor:not-allowed}
</style>
</head>
<body>
<a href="javascript:history.back()" style="display:inline-flex;align-items:center;gap:6px;color:#ff6900;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:10px">&larr; Volver</a>
<h1>Dashboard</h1>
<p class="sub">Panel de administracion — Planos Interactivos DyP</p>

<div class="cards" id="cards">
  <div class="card"><div class="num" id="visitantes">-</div><div class="lbl">Visitantes activos</div></div>
  <div class="card"><div class="num" id="paginas">-</div><div class="lbl">Paginas hoy</div></div>
  <div class="card"><div class="num" id="clicks">-</div><div class="lbl">Clicks hoy</div></div>
</div>

<div class="section">
  <h2>Visitantes — Sesiones activas</h2>
  <div id="sesionesContent" class="loading">Cargando...</div>
</div>

<div class="section">
  <h2>Actividad reciente (paginas)</h2>
  <div id="paginasContent" class="loading">Cargando...</div>
</div>

<div class="section">
  <h2>Actividad reciente (clicks)</h2>
  <div id="clicksContent" class="loading">Cargando...</div>
</div>

<div class="section">
  <h2>Sesiones visitantes</h2>
  <div id="visitantesContent" class="loading">Cargando...</div>
</div>

<a class="logout" href="/api/logout">Cerrar sesion</a>

<script>
document.getElementById('visitantes').textContent = '...';

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function badge(tipo) {
  var map = {admin:'admin',propio:'propio',visitante:'visitante'};
  return '<span class="badge badge-' + (map[tipo]||'visitante') + '">' + esc(tipo) + '</span>';
}

function ago(ts) {
  if (!ts) return '-';
  var diff = Math.floor((Date.now() - new Date(ts + 'Z').getTime()) / 1000);
  if (diff < 60) return 'hace ' + diff + 's';
  if (diff < 3600) return 'hace ' + Math.floor(diff/60) + 'm';
  if (diff < 86400) return 'hace ' + Math.floor(diff/3600) + 'h';
  return 'hace ' + Math.floor(diff/86400) + 'd';
}

fetch('/api/admin/stats').then(function(r) {
  if (!r.ok) throw new Error('Status ' + r.status);
  return r.json();
}).then(function(d) {
  document.getElementById('visitantes').textContent = d.visitantesActivos;
  document.getElementById('paginas').textContent = d.paginasHoy;
  document.getElementById('clicks').textContent = d.clicksHoy;

  if (d.sesionesVisitantes && d.sesionesVisitantes.length) {
    var h = '<table><tr><th>Email</th><th>Nombre</th><th>Fingerprint</th><th>Ultimo acceso</th></tr>';
    d.sesionesVisitantes.forEach(function(s) {
      h += '<tr><td>' + esc(s.email) + '</td><td>' + esc(s.nombre||'-') + '</td><td style="font-size:11px;font-family:monospace">' + esc(s.fingerprint.slice(0,16)) + '...</td><td>' + ago(s.ultimo_acceso) + '</td></tr>';
    });
    h += '</table>';
    document.getElementById('sesionesContent').innerHTML = h;
  } else {
    document.getElementById('sesionesContent').innerHTML = '<p style="color:#999;font-size:13px">Sin sesiones activas</p>';
  }

  if (d.actividadReciente && d.actividadReciente.length) {
    var h = '<table><tr><th>Hora</th><th>Email</th><th>Tipo</th><th>Ruta</th></tr>';
    d.actividadReciente.slice(0,20).forEach(function(a) {
      h += '<tr><td style="white-space:nowrap">' + ago(a.timestamp) + '</td><td>' + esc(a.email) + '</td><td>' + badge(a.tipo) + '</td><td>' + esc(a.ruta) + '</td></tr>';
    });
    h += '</table>';
    document.getElementById('paginasContent').innerHTML = h;
  } else {
    document.getElementById('paginasContent').innerHTML = '<p style="color:#999;font-size:13px">Sin actividad</p>';
  }

  if (d.clicksRecientes && d.clicksRecientes.length) {
    var h = '<table><tr><th>Hora</th><th>Email</th><th>Tipo</th><th>Sucursal</th><th>Equipo</th><th>Accion</th></tr>';
    d.clicksRecientes.slice(0,20).forEach(function(c) {
      h += '<tr><td style="white-space:nowrap">' + ago(c.timestamp) + '</td><td>' + esc(c.email) + '</td><td>' + badge(c.tipo) + '</td><td>' + esc(c.branch) + '</td><td>' + esc(c.equipo_nro || '-') + '</td><td>' + esc(c.accion) + (c.detalle ? ' (' + esc(c.detalle) + ')' : '') + '</td></tr>';
    });
    h += '</table>';
    document.getElementById('clicksContent').innerHTML = h;
  } else {
    document.getElementById('clicksContent').innerHTML = '<p style="color:#999;font-size:13px">Sin actividad</p>';
  }

  var sesUnicas = {};
  if (d.sesionesVisitantes) {
    d.sesionesVisitantes.forEach(function(s) { sesUnicas[s.email] = true; });
  }
  document.getElementById('visitantesContent').innerHTML = '<p style="color:#999;font-size:13px">Visitantes unicos con sesion activa: ' + Object.keys(sesUnicas).length + '</p>';
}).catch(function(e) {
  var msg = e.message || String(e);
  document.querySelectorAll('.loading').forEach(function(el) {
    if (el.innerHTML === 'Cargando...')
      el.innerHTML = '<span style="color:#e63946">Error: ' + esc(msg) + '</span>';
  });
});
</script>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
