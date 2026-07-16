export async function onRequest(context) {
  const url = new URL(context.request.url);
  let redirect = url.searchParams.get('r') || '/';
  if (!redirect.startsWith('/') || redirect.includes('://')) redirect = '/';
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
body{font-family:Inter,sans-serif;background:#000;min-height:100vh;display:flex;justify-content:center;align-items:center;position:relative;overflow:hidden}
body::before{content:'';position:fixed;inset:0;background:url('/Logo/Dise\u00f1o%20sin%20t\u00edtulo%20(1).jpg') center/contain no-repeat;opacity:.12;pointer-events:none}
.card{background:rgba(255,105,0,.55);border-radius:16px;padding:48px 40px 40px;width:380px;text-align:center;position:relative;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
.logo{margin-bottom:24px}
.logo svg{width:100px;height:41px}
h1{font-size:20px;font-weight:700;color:#fff;margin-bottom:6px}
p.sub{font-size:13px;color:rgba(255,255,255,.8);margin-bottom:28px}
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
<div class="logo">
<svg viewBox="0 0 100 41" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 0h27.2c9.1 0 16 2.7 20.3 7.8 3.8 4.5 5.8 10 5.8 16.4 0 6.4-2 12-5.8 16.4C43.1 45.8 36.3 48 27.2 48H0V0zm10.3 9.7v28.6h16c5.6 0 10-1.8 13-5.2 3-3.4 4.6-7.8 4.6-13.1 0-5.4-1.6-9.7-4.8-12.9-3-3-7.2-4.6-12.4-4.6H10.3z" fill="#fff"/>
<path d="M59.6 48l12.5-20.5L60 8h10.3l7.6 13 7.5-13h10L85.4 27.5 98 48H87.4L79 34.5 70.4 48H59.6z" fill="#fff"/>
<path d="M14.4 17.5h12.4c3.8 0 6.8 1 8.8 2.9 1.8 1.7 2.8 3.9 2.8 6.6 0 3-1 5.4-3 7.3-2 1.8-4.9 2.8-8.4 2.8H14.4V17.5zm0-9.5v38h12.9c5.3 0 9.6-1.5 12.8-4.3 3.2-2.8 4.9-6.6 4.9-11.2 0-4.3-1.5-7.9-4.4-10.6-2.8-2.7-6.8-4.1-11.6-4.1H24.5V8h-10z" fill="#fff"/>
</svg>
</div>
<h1>Planos Interactivos</h1>
<p class="sub">Centro Motors \u2014 DyP</p>
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
