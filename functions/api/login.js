import bcrypt from 'bcryptjs';

function base64urlEncode(data) {
  var str;
  if (typeof data === 'string') {
    str = btoa(data);
  } else {
    var bytes = new Uint8Array(data);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    str = btoa(bin);
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJWT(payload, secret) {
  var header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  var body = base64urlEncode(JSON.stringify(payload));
  var data = header + '.' + body;
  var encoder = new TextEncoder();
  var key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  var sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return data + '.' + base64urlEncode(sig);
}

export async function onRequest(context) {
  var SECRET = context.env.JWT_SECRET;
  if (!SECRET)
    return new Response(JSON.stringify({ success: false, error: 'Configuracion invalida' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  if (context.request.method !== 'POST')
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

  try {
    var body = await context.request.json();
    var email = body.email;
    var password = body.password;
    if (!email || !password)
      return new Response(JSON.stringify({ success: false, error: 'Email y contrasena requeridos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    var db = context.env.DB;
    var ip = context.request.headers.get('CF-Connecting-IP') || '0';
    var emailNorm = email.toLowerCase().trim();

    try {
      var intentos = await db.prepare("SELECT COUNT(*) as count FROM login_attempts WHERE email = ? AND ip = ? AND created >= datetime('now','-15 minutes')").bind(emailNorm, ip).first();
      if (intentos && intentos.count >= 5)
        return new Response(JSON.stringify({ success: false, error: 'Demasiados intentos fallidos. Intentá de nuevo en 15 minutos.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    } catch (e) { /* si el rate limit falla, seguimos sin bloquear */ }

    var user = await db.prepare('SELECT email, password_hash, tipo, activo FROM usuarios WHERE LOWER(email) = ?').bind(emailNorm).first();

    if (!user || !user.activo || !bcrypt.compareSync(password, user.password_hash)) {
      try {
        await db.prepare("DELETE FROM login_attempts WHERE created < datetime('now','-1 day')").run();
        await db.prepare('INSERT INTO login_attempts (email, ip, created) VALUES (?, ?, datetime(\'now\'))').bind(emailNorm, ip).run();
      } catch (e) {}
      return new Response(JSON.stringify({ success: false, error: 'Credenciales invalidas' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    var maxAge = user.tipo === 'visitante' ? 3600 : 2592000;
    var now = Math.floor(Date.now() / 1000);
    var jwt = await signJWT({
      email: user.email,
      tipo: user.tipo,
      jti: crypto.randomUUID(),
      exp: now + maxAge
    }, SECRET);

    var headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', 'dyp_token=' + jwt + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=' + maxAge);

    return new Response(JSON.stringify({ success: true, tipo: user.tipo }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Error interno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
