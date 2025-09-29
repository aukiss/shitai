import { ok, fail, verifyToken, store, requireJSONBody } from './_helpers.mjs';

export default async (req) => {
  const auth = req.headers.get('authorization')||'';
  try{ verifyToken(auth); } catch { return fail('未登录', 401); }
  const s = await store();
  const key = `bank/main.json`;
  if (req.method === 'GET'){
    const data = await s.getJSON(key) || [];
    return ok({ items: data });
  }
  if (req.method === 'POST'){
    const payload = requireJSONBody(await req.text());
    const items = Array.isArray(payload.items)? payload.items : [];
    await s.setJSON(key, items);
    return ok({ saved: items.length });
  }
  return fail('Method not allowed', 405);
}
