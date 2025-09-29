import { ok, fail, verifyToken, store } from './_helpers.mjs';
export default async (req) => {
  const auth = req.headers.get('authorization')||''; let user; try{ user = verifyToken(auth); } catch { return fail('未登录', 401); }
  const s = await store(); const indexKey = 'users/_index.json'; const idx = await s.getJSON(indexKey) || [];
  const members = idx.filter(u => u.class_id === (user.class_id||'ClassA')); const list = [];
  for(const u of members){ const prog = await s.getJSON(`progress/${u.id}.json`) || {stats:{done:0,correct:0,streak:0,lastDay:''}}; list.push({ id:u.id, phone:u.phone, nickname:u.nickname||'同学', stats:prog.stats }); }
  list.sort((a,b)=> (b.stats.correct/(b.stats.done||1)) - (a.stats.correct/(a.stats.done||1)));
  const avg = list.reduce((acc,x)=>{ acc.done+=x.stats.done; acc.correct+=x.stats.correct; acc.streak+=x.stats.streak; return acc; }, {done:0,correct:0,streak:0});
  const n = list.length||1; const overview = {avg_rate: Math.round((avg.correct/Math.max(1,avg.done))*100), avg_streak: Math.round(avg.streak/n)};
  return ok({ members:list, overview });
}
