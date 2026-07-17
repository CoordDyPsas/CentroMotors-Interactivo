export async function onRequest(context) {
  const url = new URL(context.request.url);
  let redirect = url.searchParams.get('r') || '/';
  if (!redirect.startsWith('/') || redirect.includes('://') || redirect.startsWith('//')) redirect = '/';
  redirect = redirect.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Iniciar sesi\u00f3n \u2014 DyP</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;background:#515151;min-height:100vh;display:flex;justify-content:center;align-items:center;position:relative;overflow:hidden}
body::before{content:'';position:fixed;inset:0;background:url('/Logo/Dise\u00f1o%20sin%20t\u00edtulo%20(1).jpg') center/contain no-repeat;opacity:.4;pointer-events:none}
.card{background:rgba(255,105,0,.55);border-radius:16px;padding:48px 40px 40px;width:380px;text-align:center;position:relative;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
.form-group{text-align:left;margin-bottom:16px}
label{display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,.9);margin-bottom:4px}
input{width:100%;padding:10px 14px;border:1.5px solid rgba(255,255,255,.3);border-radius:8px;font-size:14px;outline:none;transition:border-color .2s,background .2s;background:rgba(255,255,255,.15);color:#fff}
input::placeholder{color:rgba(255,255,255,.5)}
input:focus{border-color:#fff;background:rgba(255,255,255,.25)}
.btn{width:100%;padding:11px;background:rgba(0,0,0,.25);color:#fff;border:1.5px solid rgba(255,255,255,.25);border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;transition:background .2s}
.btn:hover{background:rgba(0,0,0,.45)}
.btn:disabled{opacity:.6;cursor:not-allowed}
.error{color:#fff;font-size:12px;margin-top:10px;display:none;background:rgba(0,0,0,.3);padding:8px 12px;border-radius:6px}
.footer{font-size:11px;color:rgba(255,255,255,.6);margin-top:24px}
</style>
</head>
<body>
<div class="card">
<form id="loginForm">
<div class="form-group">
<label for="email">Email</label>
<input type="email" id="email" placeholder="tu@email.com" required autocomplete="email">
</div>
<div class="form-group">
<label for="password">Contrase\u00f1a</label>
<input type="password" id="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required autocomplete="current-password">
</div>
<div class="error" id="errorMsg">Credenciales inv\u00e1lidas</div>
<button type="submit" class="btn" id="submitBtn">Ingresar</button>
</form>
<div class="footer">DyP \u2014 Desarrollos y Proyectos</div>
</div>
<script>
document.getElementById('loginForm').onsubmit = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const err = document.getElementById('errorMsg');
  btn.disabled = true; btn.textContent = 'Ingresando...'; err.style.display = 'none';
  try {
    const r = await fetch('/api/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:document.getElementById('email').value, password:document.getElementById('password').value})
    });
    const d = await r.json();
    if (d.success) { window.location.href = '${redirect}'; }
    else { err.textContent = d.error || 'Credenciales inv\u00e1lidas'; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Ingresar'; }
  } catch(e) {
    err.textContent = 'Error de conexi\u00f3n'; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Ingresar';
  }
};
</script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
