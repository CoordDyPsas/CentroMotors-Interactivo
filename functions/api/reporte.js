function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

function buildMIME(to, subject, htmlBody) {
  const boundary = '----=_Part_' + Date.now();
  const lines = [
    'To: ' + to,
    'Reply-To: coordinacionst.dypsas@gmail.com',
    'Subject: =?UTF-8?B?' + btoa(unescape(encodeURIComponent(subject))) + '?=',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent('Reporte de urgencia de service — DyP Centro Motors'))),
    '',
    '--' + boundary,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(htmlBody))),
    '',
    '--' + boundary + '--'
  ];
  return lines.join('\r\n');
}

function buildEmailHTML(branchName, rows) {
  const now = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false });
  const colores = { 'OK': '#2ecc71', 'Necesita service': '#ff6900', 'No funciona': '#666' };
  let tableRows = '';
  rows.forEach(function(r, i) {
    const c = colores[r.estado] || '#999';
    tableRows += '<tr>'
      + '<td style="padding:5px 6px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:#888;width:30px">' + (i + 1) + '</td>'
      + '<td style="padding:5px 6px;border-bottom:1px solid #eee;word-wrap:break-word;overflow-wrap:break-word">' + esc(r.ubicacion) + '</td>'
      + '<td style="padding:5px 6px;border-bottom:1px solid #eee;white-space:nowrap">' + esc(r.marca || '-') + '</td>'
      + '<td style="padding:5px 6px;border-bottom:1px solid #eee;white-space:nowrap">' + esc(r.capacidad || '-') + '</td>'
      + '<td style="padding:5px 6px;border-bottom:1px solid #eee;background:' + c + ';color:#fff;font-weight:600;text-align:center;border-radius:4px;white-space:nowrap;font-size:11px">' + esc(r.estado) + '</td>'
      + '<td style="padding:5px 6px;border-bottom:1px solid #eee;white-space:nowrap;font-size:12px">' + esc(r.ultimo_service || '-') + '</td></tr>';
  });
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;margin:0;padding:16px;-webkit-text-size-adjust:100%">'
    + '<div style="max-width:100%;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">'
    + '<div style="background:#ff6900;padding:16px 18px;color:#fff"><h1 style="margin:0;font-size:18px;line-height:1.3">Reporte de urgencia de service</h1>'
    + '<p style="margin:4px 0 0;opacity:0.9;font-size:12px">' + esc(branchName) + ' — ' + now + '</p></div>'
    + '<div style="padding:12px 14px;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:auto">'
    + '<thead><tr style="background:#ff6900;color:#fff">'
    + '<th style="padding:6px 6px;text-align:left;font-size:11px">#</th>'
    + '<th style="padding:6px 6px;text-align:left;font-size:11px">Ubicación</th>'
    + '<th style="padding:6px 6px;text-align:left;font-size:11px">Marca</th>'
    + '<th style="padding:6px 6px;text-align:left;font-size:11px">Cap.</th>'
    + '<th style="padding:6px 6px;text-align:left;font-size:11px">Estado</th>'
    + '<th style="padding:6px 6px;text-align:left;font-size:11px">Últ. service</th>'
    + '</tr></thead><tbody>' + tableRows + '</tbody></table></div>'
    + '<div style="padding:10px 18px;background:#f9f9f9;font-size:10px;color:#999;text-align:center;border-top:1px solid #eee">'
    + 'DyP — Desarrollos y Proyectos | Centro Motors</div></div></body></html>';
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function getAccessToken(env) {
  const clientId = env.GMAIL_CLIENT_ID;
  const clientSecret = env.GMAIL_CLIENT_SECRET;
  const refreshToken = env.GMAIL_REFRESH_TOKEN;

  const body = 'client_id=' + encodeURIComponent(clientId)
    + '&client_secret=' + encodeURIComponent(clientSecret)
    + '&refresh_token=' + encodeURIComponent(refreshToken)
    + '&grant_type=refresh_token';

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  });
  const data = await r.json();
  if (data.error) throw new Error('Token refresh failed: ' + (data.error_description || data.error));
  return data.access_token;
}

async function sendGmail(accessToken, to, subject, mimeMessage) {
  const raw = btoa(unescape(encodeURIComponent(mimeMessage))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: raw })
  });
  const data = await r.json();
  if (data.error) throw new Error('Gmail send failed: ' + (data.error.message || JSON.stringify(data.error)));
  return data;
}

export async function onRequest(context) {
  if (context.request.method !== 'POST')
    return json({ error: 'Method not allowed' }, 405);

  const user = context.data && context.data.user;
  if (!user || (user.tipo !== 'admin' && user.tipo !== 'propio'))
    return json({ error: 'No autorizado' }, 403);

  try {
    const { branch, branchName, rows } = await context.request.json();

    if (!branch || !branchName || !Array.isArray(rows) || !rows.length)
      return json({ error: 'Faltan campos requeridos (branch, branchName, rows)' }, 400);

    const to = context.env.REPORTE_TO;
    if (!to) return json({ error: 'Destinatario no configurado' }, 500);

    const subject = 'Reporte de urgencia — ' + branchName;
    const htmlBody = buildEmailHTML(branchName, rows);
    const mimeMessage = buildMIME(to, subject, htmlBody);

    const accessToken = await getAccessToken(context.env);
    const result = await sendGmail(accessToken, to, subject, mimeMessage);

    return json({ success: true, messageId: result.id });
  } catch (e) {
    console.error('reporte.js:', e && e.message);
    return json({ error: e && e.message ? e.message : 'Error al enviar email' }, 500);
  }
}
