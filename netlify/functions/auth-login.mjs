import { ok, fail, requireJSONBody, store, checkPassword, signToken } from './_helpers.mjs';

export default async (req) => {
  if (req.method !== 'POST') return fail('Method not allowed', 405);
  const data = requireJSONBody(await req.text());
  const phone = String(data.phone||'').trim();
  const password = String(data.password||'').trim();
  const s = await store();
  const userKey = `users/${phone}.json`;
  const record = await s.getJSON(userKey);
  if(!record) return fail('账号不存在', 404);
  const okPass = await checkPassword(password, record.passhash);
  if(!okPass) return fail('密码错误', 401);
  const token = signToken({ uid: record.id, phone: record.phone, class_id: record.class_id||'ClassA', nickname: record.nickname||'同学' });
  return ok({ token, user: { id: record.id, phone: record.phone, nickname: record.nickname||'同学', class_id: record.class_id||'ClassA' } });
}
