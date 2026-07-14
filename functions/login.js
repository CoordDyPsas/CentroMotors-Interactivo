export async function onRequest(context) {
  const url = new URL(context.request.url);
  const redirect = url.searchParams.get('r') || '/';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Iniciar sesión — DyP</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;background:#f0f2f5;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{background:#fff;border-radius:16px;padding:48px 40px 40px;width:380px;box-shadow:0 4px 32px rgba(0,0,0,0.08);text-align:center}
.logo{margin-bottom:24px}
.logo svg{width:100px;height:41px}
h1{font-size:20px;font-weight:700;color:#111;margin-bottom:6px}
p.sub{font-size:13px;color:#666;margin-bottom:28px}
.form-group{text-align:left;margin-bottom:16px}
label{display:block;font-size:12px;font-weight:600;color:#333;margin-bottom:4px}
input{width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s}
input:focus{border-color:#ff6900}
.btn{width:100%;padding:11px;background:#ff6900;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px;transition:background .2s}
.btn:hover{background:#e55d00}
.btn:disabled{opacity:.6;cursor:not-allowed}
.error{color:#e63946;font-size:12px;margin-top:10px;display:none}
.footer{font-size:11px;color:#999;margin-top:24px}
</style>
</head>
<body>
<div class="card">
<div class="logo">
<svg viewBox="0 0 100 41" fill="none" xmlns="http://www.w3.org/2000/svg">
<path class="d-path" d="M0 0h27.2c9.1 0 16 2.7 20.3 7.8 3.8 4.5 5.8 10 5.8 16.4 0 6.4-2 12-5.8 16.4C43.1 45.8 36.3 48 27.2 48H0V0zm10.3 9.7v28.6h16c5.6 0 10-1.8 13-5.2 3-3.4 4.6-7.8 4.6-13.1 0-5.4-1.6-9.7-4.8-12.9-3-3-7.2-4.6-12.4-4.6H10.3z" fill="#111"/>
<path class="y-path" d="M59.6 48l12.5-20.5L60 8h10.3l7.6 13 7.5-13h10L85.4 27.5 98 48H87.4L79 34.5 70.4 48H59.6z" fill="#111"/>
<path class="p-path" d="M14.4 17.5h12.4c3.8 0 6.8 1 8.8 2.9 1.8 1.7 2.8 3.9 2.8 6.6 0 3-1 5.4-3 7.3-2 1.8-4.9 2.8-8.4 2.8H14.4V17.5zm0-9.5v38h12.9c5.3 0 9.6-1.5 12.8-4.3 3.2-2.8 4.9-6.6 4.9-11.2 0-4.3-1.5-7.9-4.4-10.6-2.8-2.7-6.8-4.1-11.6-4.1H24.5V8h-10z" fill="#111"/>
</svg>
</div>
<h1>Planos Interactivos</h1>
<p class="sub">Centro Motors — DyP</p>
<form id="loginForm">
<div class="form-group">
<label for="email">Email</label>
<input type="email" id="email" placeholder="tu@email.com" required autocomplete="email">
</div>
<div class="form-group">
<label for="password">Contraseña</label>
<input type="password" id="password" placeholder="••••••••" required autocomplete="current-password">
</div>
<div class="error" id="errorMsg">Credenciales inválidas</div>
<button type="submit" class="btn" id="submitBtn">Ingresar</button>
</form>
<div class="footer">DyP — Desarrollos y Proyectos</div>
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
    else { err.textContent = d.error || 'Credenciales inválidas'; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Ingresar'; }
  } catch(e) {
    err.textContent = 'Error de conexión'; err.style.display = 'block'; btn.disabled = false; btn.textContent = 'Ingresar';
  }
};
</script>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
