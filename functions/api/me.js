import { jwtVerify } from 'jose';

export async function onRequest(context) {
  const SECRET = new TextEncoder().encode(context.env.JWT_SECRET || 'dyp-demo-secret-key-2026-cambiame-en-produccion');
  const cookie = context.request.headers.get('Cookie') || '';
  const match = cookie.match(/dyp_token=([^;]+)/);
  if (!match)
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  try {
    const { payload } = await jwtVerify(match[1], SECRET);
    return new Response(JSON.stringify({ email: payload.email, tipo: payload.tipo }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}
