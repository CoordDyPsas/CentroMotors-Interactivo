const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmzSSzvInJvvFDV-D_BTi7p5VrhUjfB3ja6uAy8v44epabHqWsOb6SZvnCMCVQCLnrZYFGoIOfKLnt/pub?gid=359397000&single=true&output=csv';
const BK = ['monsenor', 'colon', 'sagrada-familia'];
const BO = { colon: 0, 'sagrada-familia': 8, monsenor: 16 };

function parseAll(csv) {
  const rows = csv.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const r = []; let c = '', q = false;
    for (const ch of l) { if (ch === '"') { q = !q; continue; } if (ch === ',' && !q) { r.push(c); c = ''; continue; } c += ch; }
    r.push(c); return r;
  });
  let hi = -1;
  for (let i = 0; i < rows.length; i++) { if (rows[i].some(c => /Equipo/i.test(c))) { hi = i; break; } }
  if (hi === -1) return null;
  const branches = {};
  for (const key of BK) {
    const off = BO[key]; const eqs = [];
    for (const row of rows.slice(hi + 1)) {
      if (row.length <= off + 6) continue;
      const v = row.slice(off, off + 7).map(s => (s || '').trim());
      if (!v[0] && !v[1]) continue;
      const nro = parseInt(v[1] || v[0], 10);
      if (isNaN(nro)) continue;
      const el = (v[5] || '').toLowerCase();
      eqs.push({ nro, ubicacion: v[0] || '', marca: v[2] || '', capacidad: v[3] || '', ultimo_service: v[4] || '', estado: el === 'ok' ? 'OK' : el === 'necesita service' ? 'Necesita service' : el === 'no funciona' ? 'No funciona' : v[5] || '', ot: v[6] || '' });
    }
    branches[key] = eqs;
  }
  return branches;
}

export async function onRequest(context) {
  try {
    const r = await fetch(CSV_URL + '&_cb=' + Date.now(), { headers: { 'Cache-Control': 'no-cache' } });
    const branches = parseAll(await r.text());
    if (!branches) return new Response(JSON.stringify({ success: false, output: 'Could not parse CSV' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    const d = new Date();
    return new Response(JSON.stringify({ success: true, output: 'OK', branches, timestamp: d.toISOString() }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, output: e.message }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
