import { jwtVerify } from 'jose';

// Helper: query con timeout para evitar que una query D1 cuelgue toda la respuesta
async function queryOrNull(promise, label, timeoutMs = 12000) {
  const timer = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label}`)), timeoutMs));
  try {
    return await Promise.race([promise, timer]);
  } catch (e) {
    console.error('DB query failed:', label, e?.message || e);
    return null;
  }
}

// Helper: fecha Argentina (UTC-3, sin depender de Intl timezone)
function hoyArg() {
  const now = new Date();
  const arg = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return arg.toISOString().slice(0, 10) + ' 00:00:00';
}

export async function onRequest(context) {
  const SECRET = new TextEncoder().encode(context.env.JWT_SECRET || 'dyp-demo-secret-key-2026-cambiame-en-produccion');
  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/dyp_token=([^;]+)/);
  if (!match)
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  try {
    const { payload } = await jwtVerify(match[1], SECRET);
    if (payload.tipo !== 'admin')
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

    const db = context.env.DB;
    const todayStart = hoyArg();

    const [visitantesActivos, paginasHoy, clicksHoy, activosRecientes, actividad, sessionesVisitantes] = await Promise.all([
      queryOrNull(db.prepare("SELECT COUNT(DISTINCT s.fingerprint) as count FROM sesiones s JOIN usuarios u ON s.email = u.email WHERE u.tipo = 'visitante' AND julianday('now') - julianday(s.ultimo_acceso) < 0.02").first(), 'visitantesActivos'),
      queryOrNull(db.prepare('SELECT COUNT(*) as count FROM page_views WHERE timestamp >= ?').bind(todayStart).first(), 'paginasHoy'),
      queryOrNull(db.prepare('SELECT COUNT(*) as count FROM clicks WHERE timestamp >= ?').bind(todayStart).first(), 'clicksHoy'),
      queryOrNull(db.prepare("SELECT pv.email, u.nombre, u.tipo, pv.ruta, pv.timestamp FROM page_views pv JOIN usuarios u ON pv.email = u.email ORDER BY pv.timestamp DESC LIMIT 50").all(), 'activosRecientes'),
      queryOrNull(db.prepare("SELECT c.timestamp, c.email, u.nombre, u.tipo, c.branch, c.equipo_nro, c.accion, c.detalle FROM clicks c JOIN usuarios u ON c.email = u.email ORDER BY c.timestamp DESC LIMIT 50").all(), 'actividad'),
      queryOrNull(db.prepare("SELECT s.email, u.nombre, s.fingerprint, s.ultimo_acceso FROM sesiones s JOIN usuarios u ON s.email = u.email WHERE u.tipo = 'visitante' GROUP BY s.email, s.fingerprint ORDER BY s.ultimo_acceso DESC").all(), 'sessionesVisitantes'),
    ]);

    return new Response(JSON.stringify({
      visitantesActivos: visitantesActivos?.count || 0,
      paginasHoy: paginasHoy?.count || 0,
      clicksHoy: clicksHoy?.count || 0,
      actividadReciente: activosRecientes?.results || [],
      clicksRecientes: actividad?.results || [],
      sesionesVisitantes: sessionesVisitantes?.results || []
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('stats.js error:', e?.message || e);
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}
