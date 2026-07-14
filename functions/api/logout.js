export async function onRequest(context) {
  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Location': '/login' });
  headers.append('Set-Cookie', 'dyp_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return new Response('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/login"></head><body></body></html>', { status: 302, headers });
}
