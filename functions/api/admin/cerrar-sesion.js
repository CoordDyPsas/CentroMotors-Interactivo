export async function onRequest(context) {
  if (context.request.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

  var body;
  try {
    body = await context.request.json();
  } catch(e) {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  var email = body.email;
  if (!email)
    return new Response(JSON.stringify({ error: 'Email requerido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  try {
    await context.env.DB.prepare('DELETE FROM sesiones WHERE email = ?').bind(email).run();
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch(e) {
    return new Response(JSON.stringify({ error: 'Error al cerrar sesion' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
