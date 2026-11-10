import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {sendMessage,messageContent} from '../src/messages.js';
import worker from '../src/index.js';
const id=n=>'00000000-0000-4000-ab00-'+String(n).padStart(12,'0');
function database(){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../migrations/0005_direct_messages.sql',import.meta.url),'utf8'));return {sql,prepare(s){return {bind(...v){return {first:async()=>sql.prepare(s).get(...v)||null,run:async()=>sql.prepare(s).run(...v)}}}}};}
async function fixture(fn){const prev=globalThis.fetch,DB=database(),sent=[];let allowed=true;
 const env={DB,SUPABASE_URL:'https://auth.example.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture',WELCOME_HOOK_SECRET:'fixture-secret',SMTP_USER:'mail@example.invalid',SMTP_PASSWORD:'fixture',SITE_URL:'https://deutschklinik.com',ALLOWED_ORIGINS:'https://deutschklinik.com'};
 globalThis.fetch=async(url,options)=>{const path=new URL(url).pathname;if(path==='/auth/v1/user')return Response.json({id:id(1),email:'teacher@example.invalid',email_confirmed_at:'2026-11-01'});
  if(path.endsWith('/message_delivery_context')){if(!allowed)return Response.json({error:'not authorised'},{status:403});const b=JSON.parse(options.body);assert.equal(b.p_worker_secret,'fixture-secret');return Response.json({recipient:{id:b.p_recipient,email:'real'+b.p_recipient.slice(-1)+'@example.invalid',name:'Learner <one>'},org:{name:'School',theme:'#ac8935'},class_name:'A1',sender_name:'Teacher'});}throw Error('Unexpected fetch');};
 const call=(patch={},send=async(...args)=>sent.push(args))=>sendMessage(new Request('https://worker.invalid/messages/send',{method:'POST',headers:{Authorization:'Bearer fixture',Origin:'https://deutschklinik.com'},body:JSON.stringify({draft_id:id(2),recipient_id:id(3),class_id:id(4),subject:'Our next lesson',body:'Bring your book.',...patch})}),env,{},send);
 try{await fn({DB,env,sent,call,deny:()=>allowed=false});}finally{globalThis.fetch=prev;DB.sql.close();}}
test('selected mail resolves its recipient on the server, brands the message and deduplicates retries',()=>fixture(async({call,sent})=>{
 assert.equal((await call({to:'attacker@example.invalid'})).status,200);assert.equal(sent.length,1);assert.equal(sent[0][2],'real3@example.invalid');assert.equal(sent[0][10],'teacher@example.invalid');assert.equal(sent[0][11].from,'hello@deutschklinik.com');assert.equal(sent[0][11].fromName,'School');assert.ok(sent[0][5].includes('border-top:4px solid #ac8935'));assert.ok(sent[0][5].includes('Learner &lt;one&gt;'));
 assert.equal((await call()).status,200);assert.equal(sent.length,1);
 assert.equal((await call({subject:'Changed'})).status,409);assert.equal(sent.length,1);
 assert.equal((await call({recipient_id:id(5)})).status,200);assert.equal(sent.length,2);assert.ok(!sent[0][5].includes('real5@example.invalid'));
}));
test('founder mail uses support and SMTP/header injection and arbitrary recipients are rejected',()=>fixture(async({call,sent,deny})=>{
 assert.equal((await call({subject:'Subject\r\nBcc: attacker@example.invalid'})).status,400);
 assert.equal((await call({recipient_id:'email@example.invalid'})).status,400);assert.equal((await call({body:'x'.repeat(6001)})).status,400);
 assert.equal((await call({class_id:null})).status,200);assert.equal(sent[0][10],'support@deutschklinik.com');assert.equal(sent[0][11].from,'support@deutschklinik.com');
 deny();assert.equal((await call({recipient_id:id(6)})).status,403);assert.equal(sent.length,1);
}));
test('safe SMTP failures can retry, but uncertain acceptance and concurrent requests never send twice',()=>fixture(async({call,sent})=>{
 let attempts=0;const failure=async()=>{attempts++;throw Object.assign(Error('SMTP rejected'),{smtpCode:535,smtpStage:'AUTH'});};
 assert.equal((await call({},failure)).status,502);assert.equal((await call()).status,200);assert.equal(sent.length,1);assert.equal(attempts,1);
 const uncertain=async()=>{attempts++;throw Object.assign(Error('Connection lost after data'),{smtpStage:'login_message'});};
 let r=await call({recipient_id:id(7)},uncertain);assert.equal((await r.json()).state,'unknown');assert.equal((await call({recipient_id:id(7)},uncertain)).status,409);assert.equal(attempts,2);
 let release;const wait=new Promise(r=>release=r),blocked=async(...args)=>{sent.push(args);await wait;};const first=call({recipient_id:id(8)},blocked);
 while(sent.length<2)await new Promise(r=>setImmediate(r));const second=await call({recipient_id:id(8)},blocked);assert.ok([409,429].includes(second.status));release();assert.equal((await first).status,200);assert.equal(sent.length,2);
}));
test('daily recipient limit is durable and the route rejects untrusted origins before authentication',()=>fixture(async({DB,call,sent,env})=>{
 DB.sql.prepare('insert into direct_messages values(?,?,?,?,?,?,?)').run('previous',id(1),new Date().toISOString().slice(0,10),'hash','sent',100,Date.now());assert.equal((await call()).status,429);assert.equal(sent.length,0);
 const r=await worker.fetch(new Request('https://worker.invalid/messages/send',{method:'POST',headers:{Origin:'https://evil.invalid'},body:'{}'}),env,{});assert.equal(r.status,403);
}));
test('mail treats user-authored message text as text, including HTML and long words',()=>{
 const c=messageContent({subject:'<img onerror=bad>',body:'<script>bad()</script>\nA & B',name:'<Learner>',org:{name:'<School>',theme:'#ffffff'}});assert.ok(!c.html.includes('<script>'));assert.ok(c.html.includes('&lt;script&gt;'));assert.ok(c.html.includes('&lt;img onerror=bad&gt;'));assert.ok(c.text.includes('<script>bad()</script>'));assert.ok(c.html.includes('white-space:pre-wrap'));
});
