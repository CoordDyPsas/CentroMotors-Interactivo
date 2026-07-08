// Cloudflare Pages Function: GET /api/sync
// Re-fetches Google Sheets CSV (no cache) and returns data for all branches

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmzSSzvInJvvFDV-D_BTi7p5VrhUjfB3ja6uAy8v44epabHqWsOb6SZvnCMCVQCLnrZYFGoIOfKLnt/pub?gid=359397000&single=true&output=csv';

const BRANCH_KEYS = ['monsenor', 'colon', 'sagrada-familia'];
const BRANCH_OFFSETS = { colon: 0, 'sagrada-familia': 8, monsenor: 16, hino: 24 };

function parseAllBranches(csv) {
  const lines = csv.split('\n');
  const rows = lines.map(l => l.trim()).filter(Boolean).map(l => {
    const result = [];
    let current = '', inQuotes = false;
    for (const ch of l) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
      current += ch;
    }
    result.push(current);
    return result;
  });

  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(c => /Equipo/i.test(c))) { headerIdx = i; break; }
  }
  if (headerIdx === -1) return null;

  const dataRows = rows.slice(headerIdx + 1);
  const branches = {};

  for (const key of BRANCH_KEYS) {
    const offset = BRANCH_OFFSETS[key];
    const equipos = [];

    for (const row of dataRows) {
      if (row.length <= offset + 6) continue;
      const vals = row.slice(offset, offset + 7).map(s => (s || '').trim());
      if (!vals[0] && !vals[1]) continue;

      const nro = parseInt(vals[1] || vals[0], 10);
      if (isNaN(nro)) continue;

      const e = (vals[5] || '').toLowerCase();
      let estado;
      if (e === 'ok') estado = 'OK';
      else if (e === 'necesita service') estado = 'Necesita service';
      else if (e === 'no funciona') estado = 'No funciona';
      else estado = vals[5] || '';

      equipos.push({
        nro,
        ubicacion: vals[0] || '',
        marca: vals[2] || '',
        capacidad: vals[3] || '',
        ultimo_service: vals[4] || '',
        estado,
        ot: vals[6] || ''
      });
    }

    branches[key] = equipos;
  }

  return branches;
}

function pad(n) { return String(n).padStart(2, '0'); }

function now() {
  const d = new Date();
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

export async function onRequest(context) {
  const url = CSV_URL + '&_cb=' + Date.now();

  try {
    const resp = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache, no-store' }
    });
    const csv = await resp.text();
    const branches = parseAllBranches(csv);

    if (!branches) {
      return new Response(JSON.stringify({ success: false, output: 'Could not parse CSV' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      output: 'Synced from Google Sheets',
      branches,
      timestamp: now()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, output: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
