import { jwtVerify } from 'jose';

const WHITELIST = ['/login', '/api/login', '/api/logout', '/Logo'];
const ADMIN_ROUTES = ['/admin', '/api/admin'];

export async function onRequest(context) {
  const SECRET = new TextEncoder().encode(context.env.JWT_SECRET || 'dyp-demo-secret-key-2026-cambiame-en-produccion');
  const { request, next, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (WHITELIST.some(p => path === p || path.startsWith(p + '/')))
    return await next();

  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/dyp_token=([^;]+)/);

  if (!match) {
    if (path.startsWith('/api/'))
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    return Response.redirect(new URL('/login?r=' + encodeURIComponent(path), url.origin), 302);
  }

  try {
    const { payload } = await jwtVerify(match[1], SECRET);
    const db = env.DB;
    const user = await db.prepare('SELECT email, tipo, activo FROM usuarios WHERE email = ? AND activo = 1').bind(payload.email).first();
    if (!user)
      return clearAndRedirect(url);

    if (user.tipo === 'visitante') {
      const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0';
      const ua = request.headers.get('User-Agent') || '';
      const fp = await hashFingerprint(ip, ua);
      const existing = await db.prepare('SELECT id FROM sesiones WHERE email = ? AND fingerprint = ?').bind(user.email, fp).first();
      if (!existing) {
        const { count } = (await db.prepare('SELECT COUNT(DISTINCT fingerprint) as count FROM sesiones WHERE email = ?').bind(user.email).first()) || { count: 0 };
        if (count >= 2)
          return new Response(sessionErrorHTML(), { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        await db.prepare('INSERT INTO sesiones (email, fingerprint, jwt_id, ultimo_acceso) VALUES (?, ?, ?, datetime(\'now\'))').bind(user.email, fp, payload.jti).run();
      } else {
        await db.prepare('UPDATE sesiones SET ultimo_acceso = datetime(\'now\') WHERE email = ? AND fingerprint = ?').bind(user.email, fp).run();
      }
    }

    if (ADMIN_ROUTES.some(p => path === p || path.startsWith(p + '/')) && user.tipo !== 'admin')
      return new Response('Acceso denegado', { status: 403 });

    if (!path.includes('.') && !path.startsWith('/api/')) {
      const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0';
      const ua = request.headers.get('User-Agent') || '';
      const fp = await hashFingerprint(ip, ua);
      context.waitUntil(db.prepare('INSERT INTO page_views (email, tipo_usuario, ruta, fingerprint) VALUES (?, ?, ?, ?)').bind(user.email, user.tipo, path, fp).run().catch(() => {}));
    }

    return await next();
  } catch {
    return clearAndRedirect(url);
  }
}

function clearAndRedirect(url) {
  const r = Response.redirect(new URL('/login?r=' + encodeURIComponent(url.pathname), url.origin), 302);
  r.headers.set('Set-Cookie', 'dyp_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return r;
}

async function hashFingerprint(ip, ua) {
  const data = ip + '|' + ua;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  const b = new Uint8Array(hash);
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

function sessionErrorHTML() {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sesión bloqueada</title><style>body{font-family:Inter,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5}.card{background:#fff;border-radius:12px;padding:40px;max-width:420px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.1)}h1{color:#e63946;font-size:22px;margin:0 0 12px}p{color:#555;font-size:14px;line-height:1.5;margin:0 0 20px}.btn{display:inline-block;background:#e63946;color:#fff;border:none;border-radius:6px;padding:10px 24px;font-size:14px;cursor:pointer;text-decoration:none}.btn:hover{background:#c1121f}</style></head><body><div class="card"><h1>Demasiadas sesiones activas</h1><p>Tu cuenta de Visitante solo permite <strong>2 sesiones simultáneas</strong>.<br>Cerrá sesión en otro dispositivo o contactá al administrador.</p><a class="btn" href="/api/logout">Cerrar sesión</a></div></body></html>`;
}
