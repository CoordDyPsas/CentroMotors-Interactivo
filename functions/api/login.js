import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const SECRET = new TextEncoder().encode('dyp-demo-secret-key-2026-cambiame-en-produccion');

export async function onRequest(context) {
  if (context.request.method !== 'POST')
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

  try {
    const { email, password } = await context.request.json();
    if (!email || !password)
      return new Response(JSON.stringify({ success: false, error: 'Email y contraseña requeridos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const db = context.env.DB;
    const user = await db.prepare('SELECT email, password_hash, tipo, activo FROM usuarios WHERE LOWER(email) = ?').bind(email.toLowerCase().trim()).first();

    if (!user || !user.activo || !bcrypt.compareSync(password, user.password_hash))
      return new Response(JSON.stringify({ success: false, error: 'Credenciales inválidas' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const maxAge = user.tipo === 'visitante' ? 3600 : 2592000; // 1h visitante, 30d admin/propio
    const jwt = await new SignJWT({ email: user.email, tipo: user.tipo })
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(crypto.randomUUID())
      .setExpirationTime(maxAge + 's')
      .sign(SECRET);

    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', `dyp_token=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Error interno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
