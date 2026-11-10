import { authenticated } from './control.js';
import { smtpSend } from './mail-body.js';
import { mailBrand } from './mail-brand.js';

const uuid = x => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const email = x => typeof x === 'string' && /^[^\s@<>]+@[^\s@<>]+$/.test(x);
const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reply = (status,body,h) => Response.json(body,{status,headers:{...h,'Cache-Control':'no-store'}});

export function messageContent({subject,body,name,org={},className='',senderName=''}) {
 const b=mailBrand(org),greeting=name?'Hello '+name+',':'Hello,',signature=senderName||b.name;
 return {subject,text:`${greeting}\n\n${body}\n\n${signature}${className?'\n'+className:''}\n${b.name} · on Deutschklinik`,html:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#f6f4ef;font:15px/1.7 Arial,sans-serif;color:#252a30"><table role="presentation" width="100%"><tr><td align="center" style="padding:28px 16px"><table role="presentation" width="100%" style="max-width:520px"><tr><td style="padding:0 8px 20px">${b.logo?`<img src="${esc(b.logo)}" alt="" width="56" height="56" style="object-fit:contain;vertical-align:middle;margin-right:12px">`:''}<b style="color:${b.accent}">${esc(b.name)}</b></td></tr><tr><td style="background:#fff;border:1px solid #e7e2d7;border-top:4px solid ${b.colour};border-radius:20px;padding:28px"><h1 style="font:normal 30px/1.2 Georgia,serif;overflow-wrap:anywhere;margin:0 0 24px">${esc(subject)}</h1><p>${esc(greeting)}</p><div style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(body)}</div><p style="margin-top:28px">${esc(signature)}${className?'<br><small>'+esc(className)+'</small>':''}</p></td></tr><tr><td style="padding:18px 8px;font-size:12px;color:#6b7482">Sent privately to you · ${esc(b.name)} on Deutschklinik</td></tr></table></td></tr></table></body></html>`};
}

// One recipient per request keeps SMTP bounded and never exposes a recipient list.
// The browser reuses its draft ID on retry; receipts prevent duplicate sends.
export async function sendMessage(req,env,h,send=smtpSend) {
 if(req.method!=='POST')return reply(405,{error:'POST only'},h);
 const user=await authenticated(req,env,h);if(user instanceof Response)return user;
 if(Number(req.headers.get('Content-Length'))>16000)return reply(413,{error:'This message is too long.'},h);
 const raw=await req.text();if(new TextEncoder().encode(raw).length>16000)return reply(413,{error:'This message is too long.'},h);
 let b;try{b=JSON.parse(raw);}catch{return reply(400,{error:'Invalid message.'},h);}
 const subject=typeof b?.subject==='string'?b.subject.trim():'',body=typeof b?.body==='string'?b.body.trim():'';
 if(!uuid(b?.draft_id)||!uuid(b?.recipient_id)||(b.class_id!=null&&!uuid(b.class_id))||!subject||subject.length>160||/[\r\n\x00-\x1f\x7f]/.test(subject)||!body||body.length>6000||/\x00/.test(body))return reply(400,{error:'Choose a recipient, a subject (up to 160 characters) and a message (up to 6,000 characters).'},h);
 if(!env.WELCOME_HOOK_SECRET||!env.SMTP_USER||!env.SMTP_PASSWORD)return reply(503,{error:'Email is not configured. Please contact support.'},h);
 let context;
 try{
  const r=await fetch(new URL('/rest/v1/rpc/message_delivery_context',env.SUPABASE_URL),{method:'POST',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:req.headers.get('Authorization'),'Content-Type':'application/json'},body:JSON.stringify({p_recipient:b.recipient_id,p_class:b.class_id||null,p_worker_secret:env.WELCOME_HOOK_SECRET}),signal:AbortSignal.timeout(7000),redirect:'manual'});
  if(!r.ok)return reply(r.status===401?401:r.status===403?403:503,{error:r.status===403?'You may only email learners in your own classes.':'Recipients could not be verified. Please try again.'},h);
  context=await r.json();
 }catch{return reply(503,{error:'Recipients could not be verified. Please try again.'},h);}
 if(context?.recipient?.id!==b.recipient_id||!email(context.recipient.email))return reply(403,{error:'This recipient is unavailable.'},h);
 const id=user.id+':'+b.draft_id+':'+b.recipient_id,now=Date.now(),day=new Date(now).toISOString().slice(0,10);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([b.class_id||null,subject,body])))),x=>x.toString(16).padStart(2,'0')).join('');
 const old=await env.DB.prepare('SELECT state,payload_hash,updated_at FROM direct_messages WHERE id=?1').bind(id).first();
 if(old){
  if(old.payload_hash!==hash)return reply(409,{error:'This draft has already been used. Start a new email to change its text.'},h);
  if(old.state==='sent')return reply(200,{state:'sent',already_sent:true},h);
  if(old.state==='unknown'||old.state==='sending')return reply(409,{state:old.state==='sending'&&old.updated_at>now-120000?'sending':'unknown',error:'Delivery is still pending or could not be confirmed. Check the recipient’s inbox before sending a new email.'},h);
 }
 const claim=await env.DB.prepare(`INSERT INTO direct_messages(id,sender,day,payload_hash,state,updated_at,attempts)
 SELECT ?1,?2,?3,?4,'sending',?5,1 WHERE (SELECT coalesce(sum(attempts),0) FROM direct_messages WHERE sender=?2 AND day=?3)<100
 ON CONFLICT(id) DO UPDATE SET state='sending',updated_at=?5,attempts=direct_messages.attempts+1,day=?3
 WHERE direct_messages.state='failed' AND direct_messages.payload_hash=?4 AND direct_messages.attempts<3
 AND (SELECT coalesce(sum(attempts),0) FROM direct_messages WHERE sender=?2 AND day=?3)<100 RETURNING id`).bind(id,user.id,day,hash,now).first();
 if(!claim)return reply(429,{error:'The sending limit has been reached. Please try again tomorrow or contact support.'},h);
 const brand=mailBrand(context.org||{}),content=messageContent({subject,body,name:context.recipient.name,org:context.org||{},className:context.class_name,senderName:b.class_id?context.sender_name:''});
 const replyTo=b.class_id?user.email:(env.SUPPORT_EMAIL||'support@deutschklinik.com');
 try{
  await send(env.SMTP_USER.trim(),env.SMTP_PASSWORD.replace(/\s+/g,''),context.recipient.email,content.subject,content.text,content.html,'message-'+b.draft_id+'-'+b.recipient_id,env.SMTP_HOST||'smtppro.zoho.com',Number(env.SMTP_PORT||465),undefined,replyTo,{from:b.class_id?'hello@deutschklinik.com':'support@deutschklinik.com',fromName:brand.name});
 }catch(error){
  const uncertain=!error?.smtpCode&&error?.smtpStage==='login_message',state=uncertain?'unknown':'failed';
  await env.DB.prepare('UPDATE direct_messages SET state=?2,updated_at=?3 WHERE id=?1').bind(id,state,Date.now()).run();
  return reply(502,{state,error:uncertain?'Delivery could not be confirmed. Check the recipient’s inbox before sending a new email.':'The email provider did not accept this message. You can retry this recipient.'},h);
 }
 await env.DB.prepare("UPDATE direct_messages SET state='sent',updated_at=?2 WHERE id=?1").bind(id,Date.now()).run();
 return reply(200,{state:'sent'},h);
}
