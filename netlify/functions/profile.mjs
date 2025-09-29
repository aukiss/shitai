import { ok, fail, verifyToken, store, requireJSONBody } from './_helpers.mjs';

export default async (req) => {
  const auth = req.headers.get('authorization')||'';
  let user;
  try{ user = verifyToken(auth); } catch { return fail('未登录', 401); }
  const s = await store();
  const key = `users/${user.phone}.json`;
  if(req.method === 'GET'){
    const rec = await s.getJSON(key);
    if(!rec) return fail('未找到用户', 404);
    const {passhash, ...safe} = rec;
    return ok(safe);
  }
  if(req.method === 'POST'){
    const body = requireJSONBody(await req.text());
    const rec = await s.getJSON(key);
    if(!rec) return fail('未找到用户', 404);
    rec.nickname = String(body.nickname||rec.nickname||'同学');
    rec.class_id = String(body.class_id||rec.class_id||'ClassA');
    await s.setJSON(key, rec);
    return ok({updated:true});
  }
  return fail('Method not allowed', 405);
}
