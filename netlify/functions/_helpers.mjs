import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getStore } from '@netlify/blobs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '';

export function ok(data, init={}){ return new Response(JSON.stringify({ok:true, data}), {status:200, headers:{'Content-Type':'application/json', ...init.headers}}); }
export function fail(message, code=400){ return new Response(JSON.stringify({ok:false, error:message}), {status:code, headers:{'Content-Type':'application/json'}}); }
export function requireJSONBody(body){ try{ return JSON.parse(body||'{}'); }catch{ throw new Error('Invalid JSON'); } }
export async function store(){ return await getStore('app'); }
export function signToken(payload){ return jwt.sign(payload, JWT_SECRET, {expiresIn:'30d'}); }
export function verifyToken(authHeader){ if(!authHeader) throw new Error('NO_AUTH'); const token = authHeader.replace(/^Bearer\s+/i, ''); return jwt.verify(token, JWT_SECRET); }
export async function hashPassword(pw){ const salt = bcrypt.genSaltSync(10); return bcrypt.hashSync(pw, salt); }
export async function checkPassword(pw, hash){ return bcrypt.compareSync(pw, hash); }
export async function rateLimit(req, keyBase, max=60){
  const s = await store(); const ip = (req.headers.get('x-forwarded-for')||'').split(',')[0].trim() || 'unknown';
  const now = Date.now(); const windowMs = 10*60*1000; const key = `rl/${keyBase}-${ip}.json`; let rec = await s.getJSON(key) || {ts:[], updated_at:0};
  rec.ts = (rec.ts||[]).filter(t=> now - t < windowMs); if(rec.ts.length >= max){ return {allowed:false, remaining:0}; }
  rec.ts.push(now); rec.updated_at = now; await s.setJSON(key, rec); return {allowed:true, remaining:Math.max(0, max - rec.ts.length)};
}
export async function auditLog(entry){
  try{ const s = await store(); const day = new Date().toISOString().slice(0,10); const key = `audit/${day}.jsonl`;
    const line = JSON.stringify({...entry, t: Date.now()}); let txt = await s.get(key) || ''; txt += line + "\n";
    const lines = txt.split("\n").filter(Boolean); const trimmed = lines.slice(-10000).join("\n") + "\n"; await s.set(key, trimmed);
  }catch(e){}
}
export function isAdmin(user){ return !!user && (user.phone === ADMIN_PHONE && ADMIN_PHONE); }
