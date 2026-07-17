import { jwtVerify } from 'jose';

async function runOrNull(promise, label, timeoutMs = 12000) {
  const timer = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label}`)), timeoutMs));
  try {
    return await Promise.race([promise, timer]);
  } catch (e) {
    console.error('DB write failed:', label, e?.message || e);
    return null;
  }
}

export async function onRequest(context) {
  const SECRET = new TextEncoder().encode(context.env.JWT_SECRET || 'dyp-demo-secret-key-2026-cambiame-en-produccion');
  if (context.request.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/dyp_token=([^;]+)/);
  if (!match)
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  try {
    const { payload } = await jwtVerify(match[1], SECRET);
    const { accion, branch, equipo_nro, detalle } = await context.request.json();

    if (!accion || !branch)
      return new Response(JSON.stringify({ error: 'Faltan campos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    await runOrNull(
      context.env.DB.prepare(
        'INSERT INTO clicks (email, tipo_usuario, branch, equipo_nro, accion, detalle) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(payload.email, payload.tipo, branch, equipo_nro || null, accion, detalle || null).run(),
      'track click'
    );

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('track.js error:', e?.message || e);
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}
