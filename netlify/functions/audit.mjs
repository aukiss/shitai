import { ok, fail, verifyToken, isAdmin, store } from './_helpers.mjs';
export default async (req) => {
  const auth = req.headers.get('authorization')||''; let user; try{ user = verifyToken(auth); } catch { return fail('未登录', 401); }
  if(!isAdmin(user)) return fail('无权查看', 403);
  const s = await store(); const day = (new URL(req.url).searchParams.get('day')) || new Date().toISOString().slice(0,10);
  const key = `audit/${day}.jsonl`; const txt = await s.get(key) || ''; const lines = txt.trim().split("\n").filter(Boolean).map(x=>JSON.parse(x)).slice(-500);
  return ok({ day, lines });
}
