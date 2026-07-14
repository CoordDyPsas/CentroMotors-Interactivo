export async function onRequest(context) {
  const { request, env } = context;
  // Clear session from DB if authenticated
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/dyp_token=([^;]+)/);
  if (match) try {
    const { jwtVerify } = await import('jose');
    const SECRET = new TextEncoder().encode(env.JWT_SECRET || 'dyp-demo-secret-key-2026-cambiame-en-produccion');
    const { payload } = await jwtVerify(match[1], SECRET);
    await env.DB.prepare('DELETE FROM sesiones WHERE email = ?').bind(payload.email).run().catch(() => {});
  } catch(e) {}
  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Location': '/login' });
  headers.append('Set-Cookie', 'dyp_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return new Response('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/login"></head><body></body></html>', { status: 302, headers });
}
