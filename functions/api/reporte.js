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
  const iconos = { 'OK': '&#9989;', 'Necesita service': '&#9888;&#65039;', 'No funciona': '&#10060;' };
  let cards = '';
  rows.forEach(function(r, i) {
    const c = colores[r.estado] || '#999';
    const ic = iconos[r.estado] || '';
    cards += '<div style="background:#fff;border:1px solid #eee;border-left:4px solid ' + c + ';border-radius:8px;padding:14px 16px;margin-bottom:8px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
      + '<span style="font-size:15px;font-weight:700;color:#222">Equipo #' + esc(r.nro) + '</span>'
      + '<span style="font-size:12px;color:#888">' + esc(r.ubicacion) + '</span></div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:#555;margin-bottom:8px">'
      + '<span><b>Marca:</b> ' + esc(r.marca || '-') + '</span>'
      + '<span><b>Cap.:</b> ' + esc(r.capacidad || '-') + '</span></div>'
      + '<div style="display:inline-block;background:' + c + ';color:#fff;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:6px">' + ic + ' ' + esc(r.estado) + '</div>'
      + '<div style="font-size:12px;color:#777">Último service: ' + esc(r.ultimo_service || 'Sin registro') + '</div>'
      + '</div>';
  });
  const countOk = rows.filter(function(r) { return r.estado === 'OK'; }).length;
  const countNec = rows.filter(function(r) { return r.estado === 'Necesita service'; }).length;
  const countNf = rows.filter(function(r) { return r.estado === 'No funciona'; }).length;
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="font-family:Arial,Helvetica,sans-serif;background:#f0f0f0;margin:0;padding:12px;-webkit-text-size-adjust:100%">'
    + '<div style="max-width:420px;margin:0 auto">'
    + '<div style="background:#ff6900;padding:18px 20px;color:#fff;border-radius:10px 10px 0 0">'
    + '<h1 style="margin:0;font-size:17px;line-height:1.3">Reporte de urgencia</h1>'
    + '<p style="margin:3px 0 0;opacity:0.9;font-size:12px">' + esc(branchName) + ' — ' + now + '</p></div>'
    + '<div style="background:#fff;padding:12px 16px;display:flex;gap:12px;border-bottom:1px solid #eee;font-size:12px;font-weight:600">'
    + '<span style="color:#2ecc71">' + countOk + ' OK</span>'
    + '<span style="color:#ff6900">' + countNec + ' Necesita</span>'
    + '<span style="color:#666">' + countNf + ' No funciona</span>'
    + '<span style="color:#999;margin-left:auto">' + rows.length + ' total</span></div>'
    + '<div style="padding:12px 16px;background:#f8f8f8;border-radius:0 0 10px 10px">' + cards + '</div>'
    + '<div style="padding:10px;text-align:center;font-size:10px;color:#aaa">DyP — Desarrollos y Proyectos | Centro Motors</div>'
    + '</div></body></html>';
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
