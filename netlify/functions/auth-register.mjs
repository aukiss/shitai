import { ok, fail, requireJSONBody, store, hashPassword, signToken } from './_helpers.mjs';
export default async (req) => {
  if (req.method !== 'POST') return fail('Method not allowed', 405);
  const data = requireJSONBody(await req.text());
  const phone = String(data.phone||'').trim(); const password = String(data.password||'').trim();
  const nickname = String(data.nickname||'').trim() || '同学'; const class_id = String(data.class_id||'').trim() || 'ClassA';
  if(!/^\d{6,15}$/.test(phone)) return fail('手机号需为6-15位数字'); if(password.length < 6) return fail('密码至少6位');
  const s = await store(); const userKey = `users/${phone}.json`; const exists = await s.get(userKey); if (exists) return fail('该手机号已注册', 409);
  const passhash = await hashPassword(password); const user = { id: phone, phone, nickname, class_id, created_at: Date.now() };
  await s.setJSON(userKey, { ...user, passhash });
  const indexKey = 'users/_index.json'; const idx = await s.getJSON(indexKey) || []; idx.push({id:user.id, phone:user.phone, nickname:user.nickname, class_id:user.class_id}); await s.setJSON(indexKey, idx);
  const token = signToken({ uid: user.id, phone: user.phone, class_id, nickname }); return ok({ token, user: { id:user.id, phone:user.phone, nickname, class_id } });
}
