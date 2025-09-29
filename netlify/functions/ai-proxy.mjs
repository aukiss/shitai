import { fail, verifyToken, rateLimit, auditLog } from './_helpers.mjs';
const BASE = process.env.UPSTREAM_BASE || ''; const APIKEY = process.env.UPSTREAM_API_KEY || ''; const MODEL = process.env.UPSTREAM_MODEL || 'gpt-4o-mini';
const MAX_REQ_10MIN = parseInt(process.env.MAX_REQ_10MIN||'60',10);
export default async (req) => {
  let user=null; const needAuth = process.env.REQUIRE_AUTH !== '0';
  if(needAuth){ const auth = req.headers.get('authorization')||''; try{ user = verifyToken(auth); } catch { return fail('未登录', 401); } }
  if(!BASE) return fail('后端未配置UPSTREAM_BASE', 500);
  const keyBase = user? ('ai-'+user.uid) : 'ai-public'; const rl = await rateLimit(req, keyBase, MAX_REQ_10MIN);
  if(!rl.allowed){ await auditLog({route:'ai-proxy', uid: user?.uid||'', phone:user?.phone||'', ok:false, why:'rate_limit'}); return fail('请求过于频繁，请稍后再试', 429); }
  const incoming = await req.json().catch(()=>({})); const body = { model: incoming.model || MODEL, messages: incoming.messages || [], temperature: incoming.temperature ?? 0.2, response_format: incoming.response_format };
  const started = Date.now();
  try{
    const res = await fetch(BASE.replace(/\/$/,'') + '/chat/completions', { method: 'POST', headers: { 'Content-Type':'application/json', ...(APIKEY? {'Authorization':'Bearer '+APIKEY}:{}) }, body: JSON.stringify(body) });
    const txt = await res.text(); let data=null; try{ data = JSON.parse(txt); }catch{}; const okRes = res.ok;
    await auditLog({route:'ai-proxy', uid:user?.uid||'', phone:user?.phone||'', ok:okRes, ms: Date.now()-started, prompt_len: JSON.stringify(body).length, resp_len: txt.length });
    if(!okRes) return new Response(txt, {status:502, headers:{'Content-Type':'application/json'}}); return new Response(JSON.stringify(data), {status:200, headers:{'Content-Type':'application/json'}});
  }catch(e){ await auditLog({route:'ai-proxy', uid:user?.uid||'', phone:user?.phone||'', ok:false, why:'fetch_error', err:String(e)}); return fail('代理失败', 502); }
}
