import bcrypt from 'bcryptjs';

export async function onRequest(context) {
  var db = context.env.DB;
  var method = context.request.method;

  if (method === 'GET') {
    try {
      var result = await db.prepare('SELECT email, nombre, tipo, activo FROM usuarios ORDER BY tipo, email').all();
      return new Response(JSON.stringify({ users: result.results || [] }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Error al listar' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (method === 'POST') {
    try {
      var body = await context.request.json();
      var email = (body.email || '').toLowerCase().trim();
      var nombre = (body.nombre || '').trim();
      var password = body.password || '';
      var tipo = body.tipo || 'visitante';

      if (!email || !password) return new Response(JSON.stringify({ error: 'Email y password requeridos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      if (password.length < 6) return new Response(JSON.stringify({ error: 'Password minimo 6 caracteres' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      if (['admin', 'propio', 'visitante'].indexOf(tipo) === -1) return new Response(JSON.stringify({ error: 'Tipo invalido (admin, propio, visitante)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      var existing = await db.prepare('SELECT email FROM usuarios WHERE LOWER(email) = ?').bind(email).first();
      if (existing) return new Response(JSON.stringify({ error: 'Ya existe un usuario con ese email' }), { status: 409, headers: { 'Content-Type': 'application/json' } });

      var hash = bcrypt.hashSync(password, 10);
      await db.prepare('INSERT INTO usuarios (email, nombre, password_hash, tipo, activo) VALUES (?, ?, ?, ?, 1)').bind(email, nombre || email.split('@')[0], hash, tipo).run();
      return new Response(JSON.stringify({ success: true, email: email, tipo: tipo }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Error al crear' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (method === 'PUT') {
    try {
      var body = await context.request.json();
      var email = (body.email || '').toLowerCase().trim();
      if (!email) return new Response(JSON.stringify({ error: 'Email requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      var user = await db.prepare('SELECT email FROM usuarios WHERE LOWER(email) = ?').bind(email).first();
      if (!user) return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

      if (body.activo !== undefined) {
        await db.prepare('UPDATE usuarios SET activo = ? WHERE LOWER(email) = ?').bind(body.activo ? 1 : 0, email).run();
      }
      if (body.password && body.password.length >= 6) {
        var hash = bcrypt.hashSync(body.password, 10);
        await db.prepare('UPDATE usuarios SET password_hash = ? WHERE LOWER(email) = ?').bind(hash, email).run();
      }
      if (body.nombre !== undefined) {
        await db.prepare('UPDATE usuarios SET nombre = ? WHERE LOWER(email) = ?').bind(body.nombre.trim(), email).run();
      }
      if (body.tipo && ['admin', 'propio', 'visitante'].indexOf(body.tipo) !== -1) {
        await db.prepare('UPDATE usuarios SET tipo = ? WHERE LOWER(email) = ?').bind(body.tipo, email).run();
      }
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Error al actualizar' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (method === 'DELETE') {
    try {
      var body = await context.request.json();
      var email = (body.email || '').toLowerCase().trim();
      if (!email) return new Response(JSON.stringify({ error: 'Email requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      if (email === 'admin@relevamientocm.com') return new Response(JSON.stringify({ error: 'No se puede eliminar al admin principal' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

      await db.prepare('DELETE FROM sesiones WHERE email = (SELECT email FROM usuarios WHERE LOWER(email) = ?)').bind(email).run();
      var del = await db.prepare('DELETE FROM usuarios WHERE LOWER(email) = ?').bind(email).run();
      var changes = del.meta && del.meta.changes ? del.meta.changes : 0;
      if (!changes) return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Error al eliminar' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
