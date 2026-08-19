const BRANCHES = ['colon', 'monsenor', 'sagrada-familia', 'hino'];
const RESTRICTED = ['colon', 'monsenor'];

export async function onRequest(context) {
  var db = context.env.DB;
  var user = context.data.user;
  var url = new URL(context.request.url);
  var branch = url.searchParams.get('branch');
  var equipo = parseInt(url.searchParams.get('equipo'), 10);

  if (!branch || BRANCHES.indexOf(branch) === -1)
    return new Response(JSON.stringify({ error: 'Parametros invalidos (branch requerido)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (user.tipo !== 'admin' && RESTRICTED.indexOf(branch) !== -1)
    return new Response(JSON.stringify({ error: 'No disponible' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

  try {
    var result;
    if (!isNaN(equipo))
      result = await db.prepare('SELECT ot, agregado FROM ot_historial WHERE branch = ? AND equipo_nro = ? ORDER BY agregado ASC').bind(branch, equipo).all();
    else
      result = await db.prepare('SELECT equipo_nro, ot, agregado FROM ot_historial WHERE branch = ? ORDER BY equipo_nro ASC, agregado ASC').bind(branch).all();
    return new Response(JSON.stringify({ historial: result.results || [] }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
