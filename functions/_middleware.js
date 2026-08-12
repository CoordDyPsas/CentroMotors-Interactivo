var WHITELIST = ['/login', '/api/login', '/api/logout', '/Logo'];
var ADMIN_ROUTES = ['/admin', '/api/admin', '/api/login/diag'];
var BRANCH_ADMIN_ONLY = ['colon', 'monsenor'];

function isWhitelisted(path) {
  if (path === '/api/login/diag' || path.startsWith('/api/login/diag/')) return false;
  return WHITELIST.some(function(p) { return path === p || path.startsWith(p + '/'); });
}

function isBranchRestricted(path) {
  for (var i = 0; i < BRANCH_ADMIN_ONLY.length; i++) {
    var b = BRANCH_ADMIN_ONLY[i];
    if (path === '/' + b || path.startsWith('/' + b + '/')) return true;
    if (path === '/api/equipos/' + b) return true;
  }
  return false;
}

async function verifyToken(token, secret) {
  var parts = token.split('.');
  if (parts.length !== 3) throw new Error('Bad JWT');
  var encoder = new TextEncoder();
  var key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  var sigStr = parts[2].replace(/-/g, '+').replace(/_/g, '/');
  while (sigStr.length % 4) sigStr += '=';
  var bin = atob(sigStr);
  var sigBytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) sigBytes[i] = bin.charCodeAt(i);
  var dataStr = parts[0] + '.' + parts[1];
  var dataBytes = encoder.encode(dataStr);
  var ok = await crypto.subtle.verify('HMAC', key, sigBytes, dataBytes);
  if (!ok) throw new Error('Bad signature');
  var payloadStr = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  while (payloadStr.length % 4) payloadStr += '=';
  var payload = JSON.parse(atob(payloadStr));
  if (payload.exp && payload.exp * 1000 < Date.now()) throw new Error('Token expired');
  return payload;
}

export async function onRequest(context) {
  var SECRET = context.env.JWT_SECRET;
  var request = context.request;
  var url = new URL(request.url);
  var path = url.pathname;

  if (isWhitelisted(path))
    return context.next();

  var cookie = request.headers.get('Cookie') || '';
  var match = cookie.match(/dyp_token=([^;]+)/);

  if (!match || !SECRET) {
    if (path.startsWith('/api/'))
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    var loc = '/login?r=' + encodeURIComponent(path);
    return new Response(null, { status: 302, headers: { 'Location': loc } });
  }

  try {
    var payload = await verifyToken(match[1], SECRET);
    var db = context.env.DB;
    var user = await db.prepare('SELECT email, nombre, tipo, activo FROM usuarios WHERE email = ? AND activo = 1').bind(payload.email).first();
    if (!user) {
      return new Response(null, { status: 302, headers: { 'Location': '/login', 'Set-Cookie': 'dyp_token=; Path=/; Max-Age=0' } });
    }
    context.data = { user: { email: user.email, nombre: user.nombre, tipo: user.tipo } };

    if (user.tipo === 'visitante') {
      var ip = request.headers.get('CF-Connecting-IP') || '0';
      var ua = request.headers.get('User-Agent') || '';
      var fp = await hashFingerprint(ip, ua);
      var existing = await db.prepare("SELECT id FROM sesiones WHERE email = ? AND fingerprint = ? AND julianday('now') - julianday(ultimo_acceso) < 7").bind(user.email, fp).first();
      if (!existing) {
        var countResult = await db.prepare("SELECT COUNT(DISTINCT fingerprint) as count FROM sesiones WHERE email = ? AND julianday('now') - julianday(ultimo_acceso) < 7").bind(user.email).first();
        var count = (countResult || { count: 0 }).count;
        if (count >= 2)
          return new Response(sessionErrorHTML(), { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        await db.prepare("INSERT INTO sesiones (email, fingerprint, jwt_id, ultimo_acceso) VALUES (?, ?, ?, datetime('now'))").bind(user.email, fp, payload.jti).run();
        await db.prepare("DELETE FROM sesiones WHERE julianday('now') - julianday(ultimo_acceso) > 7").run();
      } else {
        await db.prepare("UPDATE sesiones SET ultimo_acceso = datetime('now') WHERE email = ? AND fingerprint = ?").bind(user.email, fp).run();
      }
    }

    if (ADMIN_ROUTES.some(function(p) { return path === p || path.startsWith(p + '/'); }) && user.tipo !== 'admin')
      return new Response('Acceso denegado', { status: 403 });

    if (user.tipo !== 'admin' && isBranchRestricted(path)) {
      if (path.startsWith('/api/'))
        return new Response(JSON.stringify({ error: 'No disponible' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      return new Response(proximamenteHTML(), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    if (!path.includes('.') && !path.startsWith('/api/')) {
      var ip2 = request.headers.get('CF-Connecting-IP') || '0';
      var ua2 = request.headers.get('User-Agent') || '';
      var fp2 = await hashFingerprint(ip2, ua2);
      context.waitUntil(db.prepare('INSERT INTO page_views (email, tipo_usuario, ruta, fingerprint) VALUES (?, ?, ?, ?)').bind(user.email, user.tipo, path, fp2).run().catch(function() {}));
    }

    return context.next();
  } catch(e) {
    return new Response(null, { status: 302, headers: { 'Location': '/login', 'Set-Cookie': 'dyp_token=; Path=/; Max-Age=0' } });
  }
}

function proximamenteHTML() {
  return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Próximamente — DyP</title><style>@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap\');*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#0d0d1a;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#f0f0f0;text-align:center;padding:24px}.pin{color:#ff6900;margin-bottom:18px}h1{font-size:32px;font-weight:700;color:#fff;margin-bottom:8px}h1 span{color:#ff6900}p{color:#888;font-size:15px;max-width:420px;line-height:1.6;margin-bottom:28px}.btn{display:inline-flex;align-items:center;gap:8px;background:#ff6900;color:#fff;border:none;border-radius:8px;padding:12px 26px;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;transition:background .2s}.btn:hover{background:#ff8533}.footer{position:fixed;bottom:18px;font-size:11px;color:rgba(255,255,255,0.4)}</style></head><body><div class="pin"><svg width="56" height="56" viewBox="0 0 256 256" fill="#ff6900"><path d="M128 16a80 80 0 0 0-80 80c0 72 80 144 80 144s80-72 80-144a80 80 0 0 0-80-80zm0 112a32 32 0 1 1 32-32 32 32 0 0 1-32 32z"/></svg></div><h1>Próximamente</h1><p>Este plano interactivo estará disponible próximamente.</p><a class="btn" href="/">Volver al inicio</a><div class="footer">DyP — Aire Acondicionado y Calefacción</div></body></html>';
}

async function hashFingerprint(ip, ua) {
  var data = ip + '|' + ua;
  var hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  var b = new Uint8Array(hash);
  return Array.from(b).map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
}

function sessionErrorHTML() {
  return '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sesion bloqueada</title><style>body{font-family:Inter,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5}.card{background:#fff;border-radius:12px;padding:40px;max-width:420px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.1)}h1{color:#e63946;font-size:22px;margin:0 0 12px}p{color:#555;font-size:14px;line-height:1.5;margin:0 0 20px}.btn{display:inline-block;background:#e63946;color:#fff;border:none;border-radius:6px;padding:10px 24px;font-size:14px;cursor:pointer;text-decoration:none}.btn:hover{background:#c1121f}</style></head><body><div class="card"><h1>Demasiadas sesiones activas</h1><p>Tu cuenta de Visitante solo permite <strong>2 sesiones simultaneas</strong>.<br>Cerra sesion en otro dispositivo o contacta al administrador.</p><a class="btn" href="/api/logout">Cerrar sesion</a></div></body></html>';
}
