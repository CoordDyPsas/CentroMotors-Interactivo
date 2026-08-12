export async function onRequest(context) {
  var u = context.data && context.data.user;
  if (!u) return new Response(JSON.stringify({ tipo: null }), { headers: { 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ email: u.email, nombre: u.nombre, tipo: u.tipo }), { headers: { 'Content-Type': 'application/json' } });
}
