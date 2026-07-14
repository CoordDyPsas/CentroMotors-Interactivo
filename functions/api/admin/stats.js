import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('dyp-demo-secret-key-2026-cambiame-en-produccion');

export async function onRequest(context) {
  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/dyp_token=([^;]+)/);
  if (!match)
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  try {
    const { payload } = await jwtVerify(match[1], SECRET);
    if (payload.tipo !== 'admin')
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

    const db = context.env.DB;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const todayStart = now.slice(0, 10) + ' 00:00:00';

    const [visitantesActivos, paginasHoy, clicksHoy, activosRecientes, actividad, sessionesVisitantes] = await Promise.all([
      db.prepare("SELECT COUNT(DISTINCT s.fingerprint) as count FROM sesiones s JOIN usuarios u ON s.email = u.email WHERE u.tipo = 'visitante' AND julianday('now') - julianday(s.ultimo_acceso) < 0.02").first(),
      db.prepare('SELECT COUNT(*) as count FROM page_views WHERE timestamp >= ?').bind(todayStart).first(),
      db.prepare('SELECT COUNT(*) as count FROM clicks WHERE timestamp >= ?').bind(todayStart).first(),
      db.prepare("SELECT pv.email, u.nombre, u.tipo, pv.ruta, pv.timestamp FROM page_views pv JOIN usuarios u ON pv.email = u.email ORDER BY pv.timestamp DESC LIMIT 50").all(),
      db.prepare("SELECT c.timestamp, c.email, u.nombre, u.tipo, c.branch, c.equipo_nro, c.accion, c.detalle FROM clicks c JOIN usuarios u ON c.email = u.email ORDER BY c.timestamp DESC LIMIT 50").all(),
      db.prepare("SELECT s.email, u.nombre, s.fingerprint, s.ultimo_acceso FROM sesiones s JOIN usuarios u ON s.email = u.email WHERE u.tipo = 'visitante' GROUP BY s.email, s.fingerprint ORDER BY s.ultimo_acceso DESC").all(),
    ]);

    return new Response(JSON.stringify({
      visitantesActivos: visitantesActivos?.count || 0,
      paginasHoy: paginasHoy?.count || 0,
      clicksHoy: clicksHoy?.count || 0,
      actividadReciente: activosRecientes?.results || [],
      clicksRecientes: actividad?.results || [],
      sesionesVisitantes: sessionesVisitantes?.results || []
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}
