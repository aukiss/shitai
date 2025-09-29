export default async (req) => {
  if (req.method !== 'GET') { return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } }); }
  return new Response(JSON.stringify({ ok: true, time: Date.now() }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
