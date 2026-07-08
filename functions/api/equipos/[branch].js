const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmzSSzvInJvvFDV-D_BTi7p5VrhUjfB3ja6uAy8v44epabHqWsOb6SZvnCMCVQCLnrZYFGoIOfKLnt/pub?gid=359397000&single=true&output=csv';
const BRANCHES = { colon: 0, 'sagrada-familia': 8, monsenor: 16, hino: 24 };

function parseCSV(csv, branchKey) {
  const offset = BRANCHES[branchKey];
  if (offset === undefined) return null;
  const rows = csv.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const r = []; let c = '', q = false;
    for (const ch of l) { if (ch === '"') { q = !q; continue; } if (ch === ',' && !q) { r.push(c); c = ''; continue; } c += ch; }
    r.push(c); return r;
  });
  let hi = -1;
  for (let i = 0; i < rows.length; i++) { if (rows[i].some(c => /Equipo/i.test(c))) { hi = i; break; } }
  if (hi === -1) return null;
  const equipos = [];
  for (const row of rows.slice(hi + 1)) {
    if (row.length <= offset + 6) continue;
    const v = row.slice(offset, offset + 7).map(s => (s || '').trim());
    if (!v[0] && !v[1]) continue;
    const nro = parseInt(v[1] || v[0], 10);
    if (isNaN(nro)) continue;
    const el = (v[5] || '').toLowerCase();
    equipos.push({ nro, ubicacion: v[0] || '', marca: v[2] || '', capacidad: v[3] || '', ultimo_service: v[4] || '', estado: el === 'ok' ? 'OK' : el === 'necesita service' ? 'Necesita service' : el === 'no funciona' ? 'No funciona' : v[5] || '', ot: v[6] || '' });
  }
  return equipos;
}

export async function onRequest(context) {
  const { branch } = context.params;
  try {
    const r = await fetch(CSV_URL + '&_cb=' + Date.now(), { headers: { 'Cache-Control': 'no-cache' } });
    const equipos = parseCSV(await r.text(), branch);
    if (!equipos) return new Response(JSON.stringify({ error: 'Branch not found: ' + branch }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(equipos), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
