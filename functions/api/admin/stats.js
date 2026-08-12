async function safe(fn, label, ms) {
  ms = ms || 10000;
  var timer = new Promise(function(_, rj) { setTimeout(function() { rj(new Error('timeout ' + label)); }, ms); });
  try { return await Promise.race([fn(), timer]); }
  catch (e) { return { error: e.message || String(e) }; }
}

export async function onRequest(context) {
  try {
    var db = context.env.DB;

    var results = await Promise.all([
      safe(function() { return db.prepare("SELECT COUNT(DISTINCT s.fingerprint) as count FROM sesiones s JOIN usuarios u ON s.email = u.email WHERE u.tipo = 'visitante' AND julianday('now') - julianday(s.ultimo_acceso) < 0.02").first(); }, 'va'),
      safe(function() { return db.prepare("SELECT COUNT(*) as count FROM page_views WHERE timestamp >= datetime('now','-1 day')").first(); }, 'ph'),
      safe(function() { return db.prepare("SELECT COUNT(*) as count FROM clicks WHERE timestamp >= datetime('now','-1 day')").first(); }, 'ch'),
      safe(function() { return db.prepare("SELECT pv.email, u.nombre, u.tipo, pv.ruta, pv.timestamp FROM page_views pv JOIN usuarios u ON pv.email = u.email ORDER BY pv.timestamp DESC LIMIT 50").all(); }, 'ar'),
      safe(function() { return db.prepare("SELECT c.timestamp, c.email, u.nombre, u.tipo, c.branch, c.equipo_nro, c.accion, c.detalle FROM clicks c JOIN usuarios u ON c.email = u.email ORDER BY c.timestamp DESC LIMIT 50").all(); }, 'ac'),
      safe(function() { return db.prepare("SELECT s.email, u.nombre, s.fingerprint, s.ultimo_acceso FROM sesiones s JOIN usuarios u ON s.email = u.email WHERE u.tipo = 'visitante' GROUP BY s.email, s.fingerprint ORDER BY s.ultimo_acceso DESC").all(); }, 'sv'),
    ]);

    var va = results[0], ph = results[1], ch = results[2], ar = results[3], ac = results[4], sv = results[5];

    return new Response(JSON.stringify({
      visitantesActivos: (va && va.count) || 0,
      paginasHoy: (ph && ph.count) || 0,
      clicksHoy: (ch && ch.count) || 0,
      actividadReciente: (ar && ar.results) || [],
      clicksRecientes: (ac && ac.results) || [],
      sesionesVisitantes: (sv && sv.results) || []
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
