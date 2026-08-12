const BRANCHES = ['colon', 'monsenor', 'sagrada-familia', 'hino'];
const RESTRICTED = ['colon', 'monsenor'];

function denied() {
  return json({ error: 'No disponible' }, 403);
}

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
}

async function eliminarSubtree(db, id, branch, equipoNro) {
  var rows = await db.prepare('SELECT id, parent_id FROM comentarios WHERE branch = ? AND equipo_nro = ?').bind(branch, equipoNro).all();
  var hijos = {};
  rows.results.forEach(r => {
    if (!hijos[r.parent_id]) hijos[r.parent_id] = [];
    hijos[r.parent_id].push(r.id);
  });
  var cola = [id];
  var ids = [id];
  while (cola.length) {
    var actual = cola.shift();
    (hijos[actual] || []).forEach(h => { ids.push(h); cola.push(h); });
  }
  var ph = ids.map(() => '?').join(',');
  await db.prepare('DELETE FROM comentarios WHERE id IN (' + ph + ')').bind(...ids).run();
}

async function restaurarSubtree(db, id, branch, equipoNro) {
  var rows = await db.prepare('SELECT id, parent_id FROM comentarios WHERE branch = ? AND equipo_nro = ?').bind(branch, equipoNro).all();
  var hijos = {};
  rows.results.forEach(r => {
    if (!hijos[r.parent_id]) hijos[r.parent_id] = [];
    hijos[r.parent_id].push(r.id);
  });
  var cola = [id];
  var ids = [id];
  while (cola.length) {
    var actual = cola.shift();
    (hijos[actual] || []).forEach(h => { ids.push(h); cola.push(h); });
  }
  var ph = ids.map(() => '?').join(',');
  await db.prepare('UPDATE comentarios SET archivado = 0 WHERE id IN (' + ph + ')').bind(...ids).run();
}

async function archivarResueltos(db, branch, equipoNro) {
  var rows = await db.prepare('SELECT id, parent_id, resuelto, archivado FROM comentarios WHERE branch = ? AND equipo_nro = ?').bind(branch, equipoNro).all();
  var todos = rows.results;
  var porId = {};
  todos.forEach(r => { r.hijos = []; porId[r.id] = r; });
  todos.forEach(r => { if (r.parent_id && porId[r.parent_id]) porId[r.parent_id].hijos.push(r); });
  var aArchivar = new Set();
  todos.forEach(r => { if (r.resuelto && !r.archivado) aArchivar.add(r.id); });
  var nuevo = true;
  while (nuevo) {
    nuevo = false;
    todos.forEach(r => {
      if (!r.archivado && !aArchivar.has(r.id) && r.parent_id && aArchivar.has(r.parent_id)) {
        aArchivar.add(r.id);
        nuevo = true;
      }
    });
  }
  if (aArchivar.size) {
    var ph = [...aArchivar].map(() => '?').join(',');
    await db.prepare('UPDATE comentarios SET archivado = 1 WHERE id IN (' + ph + ')').bind(...aArchivar).run();
  }
  return aArchivar.size;
}

export async function onRequest(context) {
  var db = context.env.DB;
  var user = context.data.user;
  var method = context.request.method;
  var url = new URL(context.request.url);

  if (method === 'GET') {
    try {
      var branch = url.searchParams.get('branch');
      var equipoNro = parseInt(url.searchParams.get('equipo'), 10);
      if (!branch || BRANCHES.indexOf(branch) === -1 || isNaN(equipoNro))
        return json({ error: 'Parametros invalidos (branch y equipo requeridos)' }, 400);
      if (user.tipo !== 'admin' && RESTRICTED.indexOf(branch) !== -1)
        return denied();
      var result = await db.prepare('SELECT id, parent_id, email, nombre, tipo, texto, creado, resuelto, archivado FROM comentarios WHERE branch = ? AND equipo_nro = ? ORDER BY id ASC').bind(branch, equipoNro).all();
      return json({ comments: result.results || [] });
    } catch (e) {
      return json({ error: 'Error al listar comentarios' }, 500);
    }
  }

  if (method === 'POST') {
    try {
      var body = await context.request.json();
      var branch = (body.branch || '').trim();
      var equipoNro = parseInt(body.equipo_nro, 10);
      var texto = (body.texto || '').trim();
      var parentId = body.parent_id ? parseInt(body.parent_id, 10) : null;
      if (!branch || BRANCHES.indexOf(branch) === -1 || isNaN(equipoNro))
        return json({ error: 'Parametros invalidos (branch y equipo requeridos)' }, 400);
      if (user.tipo !== 'admin' && RESTRICTED.indexOf(branch) !== -1)
        return denied();
      if (!texto) return json({ error: 'El comentario no puede estar vacio' }, 400);
      if (texto.length > 2000) return json({ error: 'El comentario no puede superar los 2000 caracteres' }, 400);
      if (parentId) {
        var padre = await db.prepare('SELECT id, archivado FROM comentarios WHERE id = ? AND branch = ? AND equipo_nro = ?').bind(parentId, branch, equipoNro).first();
        if (!padre) return json({ error: 'El comentario al que respondes no existe' }, 400);
        if (padre.archivado) return json({ error: 'No se puede responder a un comentario archivado. Restauralo primero.' }, 400);
      }
      var result = await db.prepare('INSERT INTO comentarios (branch, equipo_nro, email, nombre, tipo, texto, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(branch, equipoNro, user.email, user.nombre, user.tipo, texto, parentId).run();
      var id = result.meta.last_row_id;
      var created = await db.prepare('SELECT id, parent_id, email, nombre, tipo, texto, creado, resuelto, archivado FROM comentarios WHERE id = ?').bind(id).first();
      return json({ success: true, comment: created }, 201);
    } catch (e) {
      return json({ error: 'Error al crear comentario' }, 500);
    }
  }

  if (method === 'PATCH') {
    try {
      var body = await context.request.json();
      if (body.accion === 'archivar_resueltos') {
        var branch = (body.branch || '').trim();
        var equipoNro = parseInt(body.equipo_nro, 10);
        if (!branch || BRANCHES.indexOf(branch) === -1 || isNaN(equipoNro))
          return json({ error: 'Parametros invalidos (branch y equipo requeridos)' }, 400);
        if (user.tipo !== 'admin' && RESTRICTED.indexOf(branch) !== -1)
          return denied();
        var cantidad = await archivarResueltos(db, branch, equipoNro);
        return json({ success: true, archivados: cantidad });
      }
      var id = parseInt(body.id, 10);
      if (isNaN(id)) return json({ error: 'Parametro id requerido' }, 400);
      var existing = await db.prepare('SELECT email, branch, equipo_nro FROM comentarios WHERE id = ?').bind(id).first();
      if (!existing) return json({ error: 'Comentario no encontrado' }, 404);
      if (user.tipo !== 'admin' && RESTRICTED.indexOf(existing.branch) !== -1)
        return denied();
      if (existing.email !== user.email && user.tipo !== 'admin')
        return json({ error: 'No tenes permiso para modificar este comentario' }, 403);
      if ('resuelto' in body)
        await db.prepare('UPDATE comentarios SET resuelto = ? WHERE id = ?').bind(body.resuelto ? 1 : 0, id).run();
      if ('archivado' in body) {
        if (body.archivado)
          await db.prepare('UPDATE comentarios SET archivado = 1 WHERE id = ?').bind(id).run();
        else
          await restaurarSubtree(db, id, existing.branch, existing.equipo_nro);
      }
      var updated = await db.prepare('SELECT id, parent_id, email, nombre, tipo, texto, creado, resuelto, archivado FROM comentarios WHERE id = ?').bind(id).first();
      return json({ success: true, comment: updated });
    } catch (e) {
      return json({ error: 'Error al actualizar comentario' }, 500);
    }
  }

  if (method === 'DELETE') {
    try {
      var id = parseInt(url.searchParams.get('id'), 10);
      if (isNaN(id)) return json({ error: 'Parametro id requerido' }, 400);
      var existing = await db.prepare('SELECT email, branch, equipo_nro FROM comentarios WHERE id = ?').bind(id).first();
      if (!existing) return json({ error: 'Comentario no encontrado' }, 404);
      if (user.tipo !== 'admin' && RESTRICTED.indexOf(existing.branch) !== -1)
        return denied();
      if (existing.email !== user.email && user.tipo !== 'admin')
        return json({ error: 'No tenes permiso para eliminar este comentario' }, 403);
      await eliminarSubtree(db, id, existing.branch, existing.equipo_nro);
      return json({ success: true });
    } catch (e) {
      return json({ error: 'Error al eliminar comentario' }, 500);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
}
