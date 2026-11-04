import {authenticated} from './control.js';
import {smtpSend} from './mail-body.js';
import {mailBrand} from './mail-brand.js';
const esc=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reply=(status,value,h)=>Response.json(value,{status,headers:{...h,'Cache-Control':'no-store'}});
export function verificationContent(site,job){
 const b=mailBrand(job.org||{}),reminder=job.stage>0;
 const confirm=new URL('#/confirm-email/'+job.user_id+'/'+job.token,site).href,stop=new URL('#/stop-email/'+job.user_id+'/'+job.token,site).href;
 const title=reminder?'A small reminder.':'Confirm your email.';
 const intro='Your account is ready to use. Please confirm this email address so we can connect you safely with your school.';
 return {subject:(reminder?'Reminder: confirm your email':'Confirm your email')+' · '+b.name,
 text:`${b.name}\n\n${title}\n${intro}\n\nConfirm my email: ${confirm}\n\nThis link is valid for 7 days. You can keep learning while confirmation is pending.\nIf you did not create this account, ignore this email or stop reminders: ${stop}\n\n${b.contact}`,
 html:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#f6f4ef;color:#252a30;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:28px 16px"><table role="presentation" width="100%" style="max-width:480px"><tr><td style="padding:0 8px 20px;font-size:15px;font-weight:bold">${esc(b.name)}</td></tr><tr><td style="background:#fff;border:1px solid #e7e2d7;border-radius:24px;padding:28px"><img src="${esc(new URL('assets/mail/welcome-learner.png',site).href)}" width="160" alt="A new German word and an open book" style="display:block;width:160px;max-width:100%;border-radius:16px;margin-bottom:24px"><h1 style="font:normal 34px/1.15 Georgia,serif;margin:0 0 18px">${title}</h1><p style="font-size:15px;line-height:1.7;color:#6b7482">${intro}</p><p style="margin:26px 0"><a href="${esc(confirm)}" style="display:inline-block;padding:15px 22px;border-radius:99px;background:${b.colour};color:${b.ink};font-size:14px;font-weight:bold;text-decoration:none">Confirm my email ↗</a></p><p style="font-size:12px;line-height:1.6;color:#6b7482">Valid for 7 days. You can keep learning in the meantime.</p></td></tr><tr><td style="padding:20px 8px;font-size:12px;line-height:1.8;color:#6b7482">Didn’t create this account? You can ignore this email or <a href="${esc(stop)}" style="color:#65513d">stop these reminders</a>.<br>Powered by Deutschklinik</td></tr></table></td></tr></table></body></html>`};
}
async function rpc(env,name,body){
 const r=await fetch(new URL('/rest/v1/rpc/'+name,env.SUPABASE_URL),{method:'POST',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({...body,p_worker_secret:env.WELCOME_HOOK_SECRET}),signal:AbortSignal.timeout(7000),redirect:'manual'});
 if(!r.ok)throw Error('Verification queue unavailable');return r.status===204?null:r.json();
}
export async function drainVerification(env,send=smtpSend,user=null){
 if(!env.WELCOME_HOOK_SECRET||!env.SMTP_USER||!env.SMTP_PASSWORD)return {queued:true};
 const jobs=await rpc(env,'claim_verification_mail',{p_user:user});let sent=0;
 for(const job of jobs||[]){
  // Re-check after claiming: confirmation/deletion/suppression may have raced the cron.
  let ok=false;
  try{
   const check=await rpc(env,'verification_mail_current',{p_user:job.user_id,p_claim:job.claim});
   if(!check?.send){await rpc(env,'finish_verification_mail',{p_user:job.user_id,p_claim:job.claim,p_sent:false});continue;}
   const c=verificationContent(env.SITE_URL,job),b=mailBrand(job.org||{});
   await send(env.SMTP_USER.trim(),env.SMTP_PASSWORD.replace(/\s+/g,''),job.email,c.subject,c.text,c.html,'verify-'+job.claim,env.SMTP_HOST||'smtppro.zoho.com',Number(env.SMTP_PORT||465),undefined,b.contact,{from:'hello@deutschklinik.com',fromName:b.name});ok=true;sent++;
  }catch{ /* The queue records only a safe delivery state, never mail or tokens. */ }
  await rpc(env,'finish_verification_mail',{p_user:job.user_id,p_claim:job.claim,p_sent:ok});
 }
 return {sent:sent>0,queued:sent===0};
}
export async function verificationWake(req,env,h){
 if(req.method!=='POST')return reply(405,{error:'POST only'},h);
 const user=await authenticated(req,env,h,{allowUnverified:true});if(user instanceof Response)return user;
 try{return reply(200,await drainVerification(env,smtpSend,user.id),h);}catch{return reply(202,{queued:true},h);}
}
export async function verificationHook(req,env,h){
 if(req.method!=='POST')return reply(405,{error:'POST only'},h);
 const received=req.headers.get('Authorization')||'',wanted='Bearer '+(env.WELCOME_HOOK_SECRET||'');
 const hash=async x=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)));
 const [a,b]=await Promise.all([hash(received),hash(wanted)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 if(!env.WELCOME_HOOK_SECRET||diff)return reply(403,{error:'Forbidden'},h);
 const body=await req.text();if(body.length>200)return reply(413,{error:'Too large'},h);let data;try{data=JSON.parse(body)}catch{return reply(400,{error:'Invalid event'},h)}
 if(!/^[a-f0-9-]{36}$/i.test(data.user_id||''))return reply(400,{error:'Invalid event'},h);
 try{return reply(200,await drainVerification(env,smtpSend,data.user_id),h);}catch{return reply(202,{queued:true},h);}
}
