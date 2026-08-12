// Endpoint de diagnostico: solo admin (bloqueado por ADMIN_ROUTES en _middleware.js)
export async function onRequest(context) {
  const r = { ok: true, envKeys: Object.keys(context.env || {}), db: !!context.env.DB };

  if (context.env.DB) {
    const db = context.env.DB;
    const tests = {};
    const queries = [
      ['usuarios', 'SELECT COUNT(*) as count FROM usuarios'],
      ['sesiones', 'SELECT COUNT(*) as count FROM sesiones'],
      ['page_views', 'SELECT COUNT(*) as count FROM page_views'],
      ['clicks', 'SELECT COUNT(*) as count FROM clicks'],
    ];
    for (const [name, sql] of queries) {
      try {
        const timer = new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 5000));
        const result = await Promise.race([db.prepare(sql).first(), timer]);
        tests[name] = result;
      } catch (e) {
        tests[name] = { error: e?.message || String(e) };
      }
    }
    r.tests = tests;
  }

  return new Response(JSON.stringify(r, null, 2), { headers: { 'Content-Type': 'application/json' } });
}
