// Cloudflare Pages Function: GET /api/equipos/:branch
// Fetches live data from Google Sheets CSV and returns filtered by branch

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmzSSzvInJvvFDV-D_BTi7p5VrhUjfB3ja6uAy8v44epabHqWsOb6SZvnCMCVQCLnrZYFGoIOfKLnt/pub?gid=359397000&single=true&output=csv';

const BRANCHES = {
  colon: 0,
  'sagrada-familia': 8,
  monsenor: 16,
  hino: 24
};

function parseCSV(csv, branchKey) {
  const offset = BRANCHES[branchKey];
  if (offset === undefined) return null;

  const lines = csv.split('\n');
  const rows = lines.map(l => l.trim()).filter(Boolean).map(l => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (const ch of l) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
      current += ch;
    }
    result.push(current);
    return result;
  });

  // Find header row with "Equipo"
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(c => /Equipo/i.test(c))) { headerIdx = i; break; }
  }
  if (headerIdx === -1) return null;

  const dataRows = rows.slice(headerIdx + 1);
  const equipos = [];

  for (const row of dataRows) {
    if (row.length <= offset + 6) continue;
    const vals = row.slice(offset, offset + 7).map(s => (s || '').trim());
    if (!vals[0] && !vals[1]) continue;

    const nroRaw = vals[1] || vals[0];
    const nro = parseInt(nroRaw, 10);
    if (isNaN(nro)) continue;

    const estadoRaw = (vals[5] || '').toLowerCase();
    let estado;
    if (estadoRaw === 'ok') estado = 'OK';
    else if (estadoRaw === 'necesita service') estado = 'Necesita service';
    else if (estadoRaw === 'no funciona') estado = 'No funciona';
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

  return equipos;
}

export async function onRequest(context) {
  const { branch } = context.params;
  const url = CSV_URL + '&_cb=' + Date.now();

  try {
    const resp = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache, no-store' }
    });
    const csv = await resp.text();
    const equipos = parseCSV(csv, branch);

    if (!equipos) {
      return new Response(JSON.stringify({ error: 'Branch not found: ' + branch }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(equipos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
