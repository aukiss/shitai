import { ok, fail, verifyToken, store, requireJSONBody } from './_helpers.mjs';

export default async (req) => {
  const auth = req.headers.get('authorization')||'';
  let user;
  try{ user = verifyToken(auth); } catch { return fail('未登录', 401); }
  const s = await store();
  const key = `progress/${user.uid}.json`;
  if (req.method === 'GET'){
    const data = await s.getJSON(key) || { stats:{done:0, correct:0, streak:0, lastDay:''}, mistakes:[], records:[] };
    return ok(data);
  }
  if (req.method === 'POST'){
    const payload = requireJSONBody(await req.text());
    await s.setJSON(key, payload);
    return ok({ saved: true });
  }
  return fail('Method not allowed', 405);
}
