import { jwtVerify } from 'jose';

export async function onRequest(context) {
  if (context.request.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/dyp_token=([^;]+)/);
  if (!match)
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  try {
    const SECRET = new TextEncoder().encode(context.env.JWT_SECRET || 'dyp-demo-secret-key-2026-cambiame-en-produccion');
    const { payload } = await jwtVerify(match[1], SECRET);
    if (payload.tipo !== 'admin')
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

    const { email } = await context.request.json();
    if (!email)
      return new Response(JSON.stringify({ error: 'Email requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    await context.env.DB.prepare('DELETE FROM sesiones WHERE email = ?').bind(email).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}
