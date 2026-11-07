import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { webcrypto } from "node:crypto";
import { gunzipSync } from 'node:zlib';
import worker from "../src/index.js";
import {duration,invitationContent} from "../src/invitation-template.js";
import { drainMail } from "../src/welcome.js";
import {mailBrand} from '../src/mail-brand.js';
import { welcomeContent } from '../src/welcome-template.js';
test('welcome mail guides each audience to its own workflow and escapes personal names',()=>{
 for(const role of ['learner','teacher','school']){
 const content=welcomeContent('https://deutschklinik.com/',{role,name:'<Edwin>'});
 assert.ok(content.html.includes('&lt;Edwin&gt;'));assert.ok(content.html.includes('welcome-'+role+'.png'));
 assert.ok(content.text.includes(role==='learner'?'English meanings':role==='teacher'?'teacher page':'school’s name'));
 if(role!=='learner')assert.ok(!content.text.includes('ask your teacher'));
 }
});
import { requestLiveClass, sendCourseInvitation, previewCourseInvitation, courseInvitationStatus } from "../src/invitations.js";
test('invitation button and wordmark use school colours with readable contrast',()=>{
 for(const colour of ['#ac8935','#ebdf13']){
 const content=invitationContent({org:{name:'School',theme:colour},course:{name:'A1',level:'A1'},inviteUrl:'https://deutschklinik.com/'});
 assert.ok(content.html.includes('background:'+colour+';color:#14202e'));
 assert.ok(!content.html.includes('#1f6feb'));assert.ok(content.html.includes('>School</b> &nbsp; / &nbsp; Course invitation'));
 }
});
test('school welcome mail uses verified school and class context, escapes copy and routes help publicly',()=>{
 const result=welcomeContent('https://deutschklinik.com/',{role:'learner',name:'Learner',org:{kind:'school',name:'Gold School',theme:'#ac8935',logo_url:'https://logo.invalid/gold.png',welcome:'Learn <together>',contact_email:'help@gold.invalid'},class:{name:'Evening A1',level:'A1'}});
 assert.equal(result.subject,'Welcome to Gold School');assert.ok(result.html.includes('Welcome to Gold School.'));assert.ok(result.html.includes('Learn &lt;together&gt;'));assert.ok(result.html.includes('Evening A1'));assert.ok(result.html.includes('https://logo.invalid/gold.png'));assert.ok(result.html.includes('mailto:help@gold.invalid'));assert.ok(result.html.includes('background:#ac8935;color:#14202e'));assert.ok(!result.text.includes('Have a class invitation?'));
});
test('email status is restricted to class managers and cannot expose another class',async()=>{
 const previous=globalThis.fetch;let manager=false,queries=0;
 const DB={prepare(sql){queries++;assert.ok(sql.includes('WHERE id IN (?)'));return {bind(...ids){assert.deepEqual(ids,['abcdef123456']);return {all:async()=>({results:[{id:ids[0],state:'sent',updated_at:100}]})}}}}};
 globalThis.fetch=async url=>{const p=new URL(url).pathname;if(p==='/auth/v1/user')return Response.json({id:'staff',email_confirmed_at:'2026-11-01'});if(p.endsWith('/can_manage_class'))return Response.json(manager);if(p.endsWith('/classes'))return Response.json([{org_id:'org'}]);if(p.endsWith('/orgs'))return Response.json([{owner:'owner'}]);if(p.endsWith('/profiles'))return Response.json([]);if(p.endsWith('/invites'))return Response.json([{code:'abcdef123456'}]);throw Error(p)};
 const call=()=>courseInvitationStatus(new Request('https://worker.invalid/course-invitation/status',{method:'POST',headers:{Authorization:'Bearer fixture'},body:JSON.stringify({class_id:'00000000-0000-4000-ab00-000000000001'})}),{SUPABASE_URL:'https://auth.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture',DB},{});
 try{assert.equal((await call()).status,403);assert.equal(queries,0);manager=true;const r=await call();assert.equal(r.status,200);assert.deepEqual((await r.json()).invitations,[{code:'abcdef123456',state:'sent',updated_at:100}]);}finally{globalThis.fetch=previous}
});
globalThis.crypto ||= webcrypto;
test('term invitation contains configured dates, course length, timetable and course details', async () => {
  const oldFetch=globalThis.fetch, sent=[],dir=mkdtempSync(join(tmpdir(),'invitation-mail-')),DB=db(join(dir,'fixture.sqlite'));
  DB.exec(readFileSync(new URL('../migrations/0003_invitation_delivery.sql',import.meta.url),'utf8'));
  try {
    globalThis.fetch=async url=>{
      const path=new URL(url).pathname;
      if(path==='/auth/v1/user') return Response.json({id:'teacher',email:'teacher@example.invalid',email_confirmed_at:'2026-11-01T00:00:00Z'});
      if(path.endsWith('/can_manage_class')) return Response.json(true);
      if(path==='/rest/v1/invites') return Response.json([{code:'abcdef123456',recipient_email:'student@example.invalid',expires_at:'2099-01-01T00:00:00Z'}]);
      if(path==='/rest/v1/orgs')return Response.json([{name:'Teacher studio',theme:'#725ab3',owner:'teacher'}]);
      if(path==='/rest/v1/profiles')return Response.json([{display_name:'A teacher'}]);
      if(path==='/rest/v1/classes') return Response.json([{name:'Evening German',level:'A1',term_name:'Spring 2027',starts_on:'2027-02-01',ends_on:'2027-02-28',schedule:'Mon & Wed 18:00 EAT (UTC+3)',course_details:'Weekly feedback and lesson recordings'}]);
      throw Error('Unexpected invitation request');
    };
    const response=await sendCourseInvitation(new Request('https://worker.example.invalid/course-invitation',{method:'POST',headers:{Authorization:'Bearer verified'},body:JSON.stringify({class_id:'00000000-0000-4000-ab00-000000000001',to:'student@example.invalid',invite_url:'https://site.example.invalid/?join=abcdef123456'})}),{DB,SITE_URL:'https://site.example.invalid/',SUPABASE_URL:'https://auth.example.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture',SMTP_USER:'hello@example.invalid',SMTP_PASSWORD:'fixture'},{},async (...args)=>sent.push(args));
    assert.equal(response.status,200);
    for(const body of [sent[0][4],sent[0][5]]) for(const phrase of ['Spring 2027','4 weeks','2027','Weekly feedback and lesson recordings']) assert.ok(body.includes(phrase));
    assert.ok(sent[0][4].includes('Mon & Wed 18:00 EAT (UTC+3)'));
    assert.equal(sent[0][10],'teacher@example.invalid');
    assert.ok(sent[0][5].includes('<meta charset="UTF-8">'));
    assert.equal(duration({starts_on:'2026-11-23',ends_on:'2027-02-01'}),'10 weeks + 1 day');
    assert.equal(sent[0][11].from,'hello@deutschklinik.com');
    assert.equal(sent[0][11].fromName,'Teacher studio · Deutschklinik');
    assert.ok(sent[0][5].includes('Teacher studio'));
  } finally {globalThis.fetch=oldFetch;rmSync(dir,{recursive:true,force:true});}
});
test('class application notifies support and the private teacher without a service key', async () => {
  const oldFetch = globalThis.fetch, sent = [];
  try {
    globalThis.fetch = async (url, options) => {
      const path = new URL(url).pathname;
      if (path === '/auth/v1/user') return Response.json({id:'student',email:'student@example.invalid',email_confirmed_at:'2026-11-01T00:00:00Z'});
      if (path === '/rest/v1/rpc/request_live_class') return Response.json({request_id:'application',status:'pending',class_name:'German A1',level:'A1'});
      if (path === '/rest/v1/profiles') return Response.json([{display_name:'Student'}]);
      if (path === '/rest/v1/rpc/teacher_mail_context') {
        assert.deepEqual(JSON.parse(options.body), {p_request:'application',p_worker_secret:'fixture-mail-secret'});
        return Response.json({notification_email:'teacher@example.invalid'});
      }
      throw Error('Unexpected mail request');
    };
    const response = await requestLiveClass(new Request('https://worker.example.invalid/live-class-request', {method:'POST',headers:{Authorization:'Bearer verified'},body:JSON.stringify({class_id:'00000000-0000-4000-ab00-000000000001'})}), {
      SUPABASE_URL:'https://auth.example.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture',SMTP_USER:'hello@example.invalid',SMTP_PASSWORD:'fixture',WELCOME_HOOK_SECRET:'fixture-mail-secret',
    }, {}, async (...args) => sent.push(args));
    assert.equal(response.status,200);
    assert.deepEqual(sent.map(x=>x[2]).sort(),['support@deutschklinik.com','teacher@example.invalid']);
    assert.ok(sent.every(x=>x[4].includes('student@example.invalid')));
    assert.equal((await response.text()).includes('teacher@example.invalid'),false);
  } finally { globalThis.fetch=oldFetch; }
});
const migration = readFileSync(
  new URL("../migrations/0001_review_and_operations.sql", import.meta.url),
  "utf8",
);
test("class invitations reject a learner even if that learner can read the class", async () => {
  const oldFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: 'learner', email: 'learner@example.invalid', email_confirmed_at: '2026-11-01T00:00:00Z' });
      if (String(url).endsWith('/rpc/can_manage_class')) return Response.json(false);
      throw new Error('Unauthorised request reached class data or mail transport');
    };
    const response = await worker.fetch(new Request('https://worker.example.invalid/course-invitation', {
      method: 'POST', headers: { Origin: 'https://client.example.invalid', Authorization: 'Bearer verified', 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: '00000000-0000-4000-ab00-000000000001', to: 'target@example.invalid', invite_url: 'https://client.example.invalid/?join=abcdef123456' }),
    }), { ALLOWED_ORIGINS: 'https://client.example.invalid', SITE_URL: 'https://client.example.invalid/', SUPABASE_URL: 'https://auth.example.invalid', SUPABASE_PUBLISHABLE_KEY: 'fixture' }, {});
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /class teacher or owner/);
  } finally { globalThis.fetch = oldFetch; }
});
const adapter = `import json,sqlite3,sys
path,sql,args,mode=json.load(sys.stdin)
con=sqlite3.connect(path);con.row_factory=sqlite3.Row
if mode=='script':con.executescript(sql); rows=[]
else:rows=[dict(row) for row in con.execute(sql,args)]
con.commit()
print(json.dumps(rows))`;
const db = (file) => {
  function query(sql, args, mode) {
    const r = spawnSync("python3", ["-c", adapter], {
      input: JSON.stringify([file, sql, args, mode]),
      encoding: "utf8",
    });
    if (r.status) throw Error(r.stderr);
    return JSON.parse(r.stdout);
  }
  function prepare(sql, args = []) {
    return {
      bind(...more) {
        return prepare(sql, more);
      },
      async first() {
        return query(sql, args)[0] || null;
      },
      async all() {
        return { results: query(sql, args) };
      },
      async run() {
        return { results: query(sql, args) };
      },
    };
  }
  return {
    prepare,
    exec(sql) {
      return query(sql, [], "script");
    },
  };
};
test('English translates only fingerprinted public source, caches results and keeps the existing job caps', async () => {
  const dir=mkdtempSync(join(tmpdir(),'dictionary-english-')), DB=db(join(dir,'fixture.sqlite'));
  try {
    DB.exec(migration);
    const core=JSON.parse(gunzipSync(readFileSync(new URL('../../core.bin',import.meta.url))));
    const definitions=JSON.parse(gunzipSync(readFileSync(new URL('../../defs.bin',import.meta.url))));
    const id=core.e.findIndex(row=>row[0]==='schön'), word='schön', definition=definitions[id][0];
    const hash=await DictionaryEnglish.fingerprint(word,definition), cache=new Map(); let calls=0, malformed=false;
    const env={DB,IMG:{get:async k=>cache.get(k),put:async(k,v)=>cache.set(k,v)},ALLOWED_ORIGINS:'https://client.example.invalid',GENERATION_ENABLED:'true',GLOBAL_DAILY_JOBS:'2',USER_DAILY_JOBS:'2',AI:{run:async(_model,opts)=>{
      calls++; const data=JSON.parse(opts.messages[1].content);
      return {response:JSON.stringify({items:malformed ? [] : data.items.map(({key,kind})=>({key,en:kind==='meaning'?'house; home':'The old house is a listed building.'}))})};
    }}};
    const call=(source,batch=0,body,origin=env.ALLOWED_ORIGINS)=>worker.fetch(new Request(`https://worker.example.invalid/english?source=${source}&batch=${batch}`,{method:body?'POST':'GET',headers:{Origin:origin,'CF-Connecting-IP':'198.51.100.1'},body:body&&JSON.stringify(body)}),env,{});
    const body={id,word,definition};
    assert.equal((await call(hash)).status,404);
    assert.equal(calls,0);
    assert.equal((await call(hash,0,{...body,definition:definition+' changed'})).status,400);
    const forged=await DictionaryEnglish.fingerprint(word,'arbitrary prompt');
    assert.equal((await call(forged,0,{...body,definition:'arbitrary prompt'})).status,403);
    assert.equal(calls,0);
    const result=await call(hash,0,body); assert.equal(result.status,200);
    assert.equal((await result.json()).items[0].en,'house; home');
    assert.equal(calls,1);
    assert.equal((await call(hash)).status,200);
    assert.equal((await call(hash,0,body)).status,200);
    assert.equal(calls,1);
    assert.equal((await call(hash,0,undefined,'https://untrusted.example.invalid')).status,403);
    malformed=true;
    assert.equal((await call(hash,1,body)).status,502);
    assert.equal((await call(hash,1)).status,404);
    assert.equal((await call(hash,1,body)).status,429);
    assert.equal(calls,2);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test("Worker contract: authenticated generation, durable bounds, review, delayed confirmation", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dictionary-worker-")),
    DB = db(join(dir, "fixture.sqlite")),
    oldFetch = globalThis.fetch;
  try {
    DB.exec(migration);
    DB.exec(migration);
    DB.exec(readFileSync(new URL("../migrations/0002_mail_diagnostics.sql", import.meta.url), "utf8"));
    DB.exec(readFileSync(new URL("../migrations/0004_welcome_context.sql", import.meta.url), "utf8"));
    const kv = new Map(),
      meta = new Map(),
      calls = [];
    const env = {
      DB,
      IMG: {
        async get(k) {
          return kv.get(k) || null;
        },
        async put(k, v, o) {
          kv.set(k, v);
          meta.set(k, o?.metadata);
        },
        async getWithMetadata(k) {
          return { value: kv.get(k), metadata: meta.get(k) };
        },
      },
      ALLOWED_ORIGINS: "https://client.example.invalid",
      SITE_URL: "https://client.example.invalid/",
      SUPABASE_URL: "https://auth.example.invalid",
      SUPABASE_PUBLISHABLE_KEY: "fixture",
      GLOBAL_DAILY_JOBS: "5",
      USER_DAILY_JOBS: "3",
      GENERATION_ENABLED: "true",
      WELCOME_FROM: "2025-01-01T00:00:00Z",
      SMTP_USER: "sender@example.invalid",
      SMTP_PASSWORD: "test-placeholder",
      SMTP_HOST: "smtppro.zoho.com",
      SMTP_PORT: "465",
      WELCOME_HOOK_SECRET: "fixture-hook",
      AI: {
        async run(name, opts) {
          calls.push(name);
          return name.includes("flux")
            ? { image: "AQID" }
            : opts.max_tokens === 700
              ? {
                  response: JSON.stringify({
                    lemma: "Testwort",
                    is_german_word: true,
                    pos: "Substantiv",
                    senses: [
                      {
                        definition: "eine Darstellung für diesen Test",
                        examples: [1],
                      },
                    ],
                  }),
                }
              : { response: "One harmless fixture picture." };
        },
      },
    };
    const u = {
      id: "00000000-0000-4000-ab00-000000000001",
      email: "fixture@example.invalid",
      created_at: "2025-01-01T00:00:00Z",
      email_confirmed_at: "2025-02-01T00:00:00Z",
    };
    globalThis.fetch = async (url, opts) => {
      const x = String(url);
      if(x.endsWith('/rest/v1/rpc/welcome_brand_context'))return Response.json({role:'learner',name:'A learner'});
      if (
        x.startsWith("https://auth.example.invalid/") &&
        opts.headers.Authorization === "Bearer verified"
      )
        return Response.json(u);
      if (x.startsWith("https://api.wortschatz-leipzig.de/"))
        return Response.json({
          sentences: [
            {
              sentence:
                "Dies ist der erste eindeutige Beispielsatz für das Testwort.",
            },
            {
              sentence:
                "Dieser zweite Beispielsatz wurde nur für einen lokalen Test erstellt.",
            },
          ],
        });
      throw Error("Unexpected external request in test");
    };
    const call = (path, opts = {}) =>
      worker.fetch(
        new Request("https://worker.example.invalid" + path, {
          method: opts.method || "GET",
          headers: { Origin: env.ALLOWED_ORIGINS, ...opts.headers },
          body: opts.body,
        }),
        env,
        { waitUntil: (p) => p },
      );
    const signed = { headers: { Authorization: "Bearer verified" } },
      post = { ...signed, method: "POST" };
    assert.equal((await call("/img?w=Test")).status, 401);
    assert.equal(calls.length, 0);
    env.GENERATION_ENABLED = "false";
    assert.equal((await call("/img?w=Test", signed)).status, 503);
    env.GENERATION_ENABLED = "true";
    let hold, started;
    const barrier = new Promise((r) => {
      started = r;
    });
    const savedRun = env.AI.run;
    env.AI.run = async (...args) => {
      if (!hold) {
        await new Promise((resolve) => {
          hold = resolve;
          started();
        });
      }
      return savedRun(...args);
    };
    const first = call("/img?w=Test&seed=99&set=1", signed);
    await barrier;
    assert.equal((await call("/img?w=Test&seed=99&set=1", signed)).status, 409);
    hold();
    assert.equal((await first).status, 200);
    env.AI.run = savedRun;
    assert.equal(kv.has("latest|Test|"), false);
    assert.equal((await call("/pic?w=Test&seed=99")).status, 200);
    assert.equal((await call("/img?w=Test&seed=latest", signed)).status, 200);
    assert.equal(kv.has("v2|Test||1"), false);
    assert.equal((await call("/pic?w=Test")).status, 404);
    let res = await call("/entry?w=Testwort", post);
    assert.equal(res.status, 202);
    assert.equal((await res.json()).pending, true);
    assert.deepEqual(await (await call("/entries")).json(), []);
    assert.equal((await call("/entry?w=Testwort")).status, 404);
    assert.equal((await call("/entry?w=Testwort", post)).status, 202);
    assert.equal((await call("/img?w=More", signed)).status, 429);
    await DB.prepare(
      "INSERT INTO entry_publications SELECT lemma,queries,data,'now' FROM entry_drafts WHERE lemma='Testwort'",
    ).run();
    assert.equal((await (await call("/entries")).json()).length, 1);
    assert.equal(
      (await (await call("/entry?w=Testwort")).json()).entry.w,
      "Testwort",
    );
    assert.equal(
      (await call("/correction?w=Testwort&reason=meaning", post)).status,
      202,
    );
    assert.equal(
      (await call("/correction?w=Testwort&reason=meaning", post)).status,
      200,
    );
    // Another person cannot bypass the independent global budget.
    u.id = "00000000-0000-4000-ab00-000000000002";
    env.GLOBAL_DAILY_JOBS = "3";
    assert.equal((await call("/img?w=More", signed)).status, 429);
    assert.equal((await call("/welcome", { method: "POST" })).status, 401);
    assert.equal((await call("/welcome", post)).status, 202);
    assert.equal((await call("/welcome", post)).status, 200);
    let attempts = 0;
    const fail = async () => {
      attempts++;
      throw Error("fixture failure");
    };
    await drainMail(env, fail);
    assert.equal(attempts, 1);
    let row = await DB.prepare("SELECT * FROM welcome_jobs").first();
    assert.equal(row.state, "queued");
    assert.equal(row.attempts, 1);
    assert.equal(row.last_error, "transport_connect_error");
    await DB.prepare("UPDATE welcome_jobs SET next_try=0").run();
    await Promise.all([
      drainMail(env, async () => {
        attempts++;
      }),
      drainMail(env, async () => {
        attempts++;
      }),
    ]);
    row = await DB.prepare("SELECT * FROM welcome_jobs").first();
    assert.equal(attempts, 2);
    assert.equal(row.state, "sent");
    assert.equal(row.email, null);
    assert.equal(row.last_error, null);
    u.id = "00000000-0000-4000-ab00-000000000003";
    const payload = JSON.stringify({
      schema: "auth",
      table: "users",
      type: "UPDATE",
      old_record: { email_confirmed_at: null },
      record: u,
    });
    assert.equal(
      (await call("/hooks/welcome", { method: "POST", body: payload })).status,
      403,
    );
    assert.equal(
      (
        await call("/hooks/welcome", {
          method: "POST",
          headers: { Authorization: "Bearer fixture-hook" },
          body: payload,
        })
      ).status,
      202,
    );
    u.id = "00000000-0000-4000-ab00-000000000004";
    u.email_confirmed_at = "2020-01-01T00:00:00Z";
    assert.equal(
      (await (await call("/welcome", post)).json()).reason,
      "outside welcome cohort",
    );
  } finally {
    globalThis.fetch = oldFetch;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('invitation errors give a safe diagnosis; retry reuses the link and accepted mail is deduplicated',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'invitation-retry-')),DB=db(join(dir,'fixture.sqlite')),oldFetch=globalThis.fetch;
 DB.exec(readFileSync(new URL('../migrations/0003_invitation_delivery.sql',import.meta.url),'utf8'));
 try{
  globalThis.fetch=async(url)=>{const path=new URL(url).pathname;
   if(path==='/auth/v1/user')return Response.json({id:'teacher',email:'teacher@example.invalid',email_confirmed_at:'2026-11-01'});
   if(path.endsWith('/can_manage_class'))return Response.json(true);
   if(path==='/rest/v1/classes')return Response.json([{org_id:'org',name:'A1 class',level:'A1',term_name:'Autumn',starts_on:'2026-11-23',ends_on:'2027-02-01',schedule:'Mon 20:00 EAT'}]);
   if(path==='/rest/v1/orgs')return Response.json([{owner:'teacher',name:'Teacher studio'}]);
   if(path==='/rest/v1/profiles')return Response.json([{display_name:'Teacher'}]);
   if(path==='/rest/v1/invites')return Response.json([{code:'abcdef123456',recipient_email:'learner@example.invalid',expires_at:'2099-01-01'}]);
   throw Error('unexpected fetch');
  };
  const env={DB,SITE_URL:'https://site.example.invalid/',SUPABASE_URL:'https://auth.example.invalid',SUPABASE_PUBLISHABLE_KEY:'key',SMTP_USER:'support@example.invalid',SMTP_PASSWORD:'not-a-real-secret'};
  const request=()=>new Request('https://worker.example.invalid/course-invitation',{method:'POST',headers:{Authorization:'Bearer verified'},body:JSON.stringify({class_id:'00000000-0000-4000-ab00-000000000001',to:'learner@example.invalid',invite_url:env.SITE_URL+'?join=abcdef123456'})});
  const failed=await sendCourseInvitation(request(),env,{},async()=>{throw Object.assign(Error('private provider response'),{smtpCode:535,smtpStage:'login_message'});});
  assert.equal(failed.status,502);const error=await failed.json();assert.ok(error.error.includes('sign-in'));assert.ok(!JSON.stringify(error).includes('private provider response'));
  assert.equal((await DB.prepare('SELECT last_error FROM invitation_mail').first()).last_error,'smtp_535_login_message');
  let sends=0;const send=async()=>{sends++;};
  assert.equal((await sendCourseInvitation(request(),env,{},send)).status,200);
  assert.equal((await sendCourseInvitation(request(),env,{},send)).status,200);assert.equal(sends,1);
  const preview=await previewCourseInvitation(new Request('https://worker.example.invalid/course-invitation/preview',{method:'POST',headers:{Authorization:'Bearer verified'},body:JSON.stringify({class_id:'00000000-0000-4000-ab00-000000000001',note:'<script>bad()</script>'})}),env,{});
  assert.equal(preview.status,200);const html=(await preview.json()).html;assert.ok(html.includes('&lt;script&gt;'));assert.equal(html.includes('<script>'),false);assert.equal(sends,1);
 }finally{globalThis.fetch=oldFetch;rmSync(dir,{recursive:true,force:true});}
});

test('SMTP authenticates the mailbox and sends a branded alias with teacher reply-to',async()=>{
 const {smtpSend}=await import('../src/mail-body.js');let controller;const commands=[];
 const readable=new ReadableStream({start(c){controller=c;c.enqueue(new TextEncoder().encode('220 mail ready\r\n'));}});
 const replies=['250-mail\r\n250 AUTH LOGIN\r\n','334 user\r\n','334 password\r\n','235 signed in\r\n','250 sender\r\n','250 recipient\r\n','354 send message\r\n','250 accepted\r\n'];
 const writable=new WritableStream({write(data){const command=new TextDecoder().decode(data);commands.push(command);const reply=replies.shift();if(reply)controller.enqueue(new TextEncoder().encode(reply));}});
 await smtpSend('support@example.invalid','fixture','learner@example.invalid','Your invitation','Text','<b>HTML</b>','stable-id','smtp.example.invalid',465,()=>({readable,writable,close:async()=>{}}),'teacher@example.invalid',{from:'hello@example.invalid',fromName:'Teacher studio'});
 assert.equal(commands[2].trim(),Buffer.from('support@example.invalid').toString('base64'));
 assert.ok(commands.includes('MAIL FROM:<hello@example.invalid>\r\n'));
 const mime=commands.find(c=>c.includes('MIME-Version'));assert.ok(mime.includes('Reply-To: <teacher@example.invalid>'));assert.ok(mime.includes('<hello@example.invalid>'));assert.ok(mime.includes('Message-ID: <stable-id@example.invalid>'));
});

test('Cloudflare Auth verification uses supported manual redirects and never follows a token-bearing redirect',async()=>{
 const {authenticated}=await import('../src/control.js');const oldFetch=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async(url,options)=>{calls++;assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://different.example.invalid/'}});};
  const response=await authenticated(new Request('https://worker.example.invalid',{headers:{Authorization:'Bearer verified'}}),{SUPABASE_URL:'https://auth.example.invalid',SUPABASE_PUBLISHABLE_KEY:'public'},{});
  assert.equal(response.status,503);assert.equal(calls,1);
 }finally{globalThis.fetch=oldFetch;}
});

test('brand button labels stay readable across light, dark and middle-luminance school colours',()=>{
 const lum=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0);
 for(const theme of ['#ac8935','#ebdf13','#808080','#777777','#ffffff','#000000','#1f6feb','#ee8868','#28634c']){const b=mailBrand({theme}),a=lum(b.colour),ink=lum(b.ink);assert.ok((Math.max(a,ink)+.05)/(Math.min(a,ink)+.05)>=4.5,theme);}
});

test('verification mail is branded, uses a non-login confirmation capability, and checks current eligibility before sending',async()=>{
 const {drainVerification,verificationContent,verificationHook}=await import('../src/email-verification.js');
 const {authenticated}=await import('../src/control.js');
 const job={user_id:'00000000-0000-4000-ab00-000000000092',email:'learner@example.invalid',claim:'00000000-0000-4000-ab00-000000000095',token:'a'.repeat(64),stage:1,org:{name:'Gold School',theme:'#ac8935'}};
 const c=verificationContent('https://deutschklinik.com/',job);assert.match(c.subject,/Reminder/);assert.ok(c.html.includes('background:#ac8935'));assert.ok(c.text.includes('#/confirm-email/'+job.user_id));assert.ok(c.text.includes('#/stop-email/'));assert.ok(!c.text.includes('access_token'));
 const old=globalThis.fetch,completed=[];let current=true,sends=0;
 const env={SUPABASE_URL:'https://auth.example.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture',WELCOME_HOOK_SECRET:'secret',SMTP_USER:'hello@example.invalid',SMTP_PASSWORD:'fixture',SITE_URL:'https://deutschklinik.com/'};
 globalThis.fetch=async(url,opts={})=>{
  const p=new URL(url).pathname;
  if(p==='/auth/v1/user')return Response.json({id:job.user_id,email_confirmed_at:'2026-11-05',app_metadata:{dk_email_verification_required:true}});
  if(p.endsWith('/claim_verification_mail'))return Response.json([job]);
  if(p.endsWith('/verification_mail_current'))return Response.json({send:current});
  if(p.endsWith('/finish_verification_mail')){completed.push(JSON.parse(opts.body));return Response.json(null);}
  throw Error(p);
 };
 try{
  const req=new Request('https://worker.example.invalid/',{headers:{Authorization:'Bearer fixture'}});
  assert.equal((await authenticated(req,env,{})).status,403);assert.equal((await authenticated(req,env,{},{allowUnverified:true})).id,job.user_id);
  await drainVerification(env,async()=>sends++);assert.equal(sends,1);assert.equal(completed[0].p_sent,true);
  current=false;await drainVerification(env,async()=>sends++);assert.equal(sends,1);assert.equal(completed[1].p_sent,false);
  const bad=await verificationHook(new Request('https://worker.example.invalid/',{method:'POST',headers:{Authorization:'Bearer wrong'},body:JSON.stringify({user_id:job.user_id})}),env,{});assert.equal(bad.status,403);
 }finally{globalThis.fetch=old;}
});
import { signClip, LINK_SECONDS } from "../src/film-audio.js";
test('film narration follows the lesson rule and plays only through signed, short-lived links', async () => {
  const sha = (c) => c.repeat(64), bytes = new TextEncoder().encode('ID3fake-mp3-bytes');
  const files = new Map([
    ['k487/manifest.json', JSON.stringify({ chapter: 487, level: 'C1', cues: [{ id: 'a--1', say: 'Hallo.', seconds: 1.5, key: 'k487/' + sha('a') + '.mp3' }, { id: 'x--1', say: 'Fremd.', seconds: 1, key: 'k100/' + sha('b') + '.mp3' }] })],
    ['k100/manifest.json', JSON.stringify({ chapter: 100, level: 'B2', cues: [{ id: 'b--1', say: 'Servus.', seconds: 2, key: 'k100/' + sha('b') + '.mp3' }] })],
    ['k487/' + sha('a') + '.mp3', bytes],
  ]);
  const object = (key, range) => {
    const data = files.get(key); if (data === undefined) return null;
    const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const m = /bytes=(\d+)-(\d*)/.exec(range?.get?.('Range') || ''), start = m ? +m[1] : 0, end = m && m[2] ? +m[2] : buf.length - 1;
    return { size: buf.length, httpEtag: '"etag"', range: m ? { offset: start, length: end - start + 1 } : undefined,
      body: buf.slice(start, end + 1), json: async () => JSON.parse(new TextDecoder().decode(buf)) };
  };
  const FILM_AUDIO = { get: async (k, o) => object(k, o?.range), head: async (k) => object(k) };
  const env = { FILM_AUDIO, FILM_AUDIO_SIGNING_KEY: 'test-signing-key-that-is-long-enough-123', SUPABASE_URL: 'https://auth.invalid', SUPABASE_PUBLISHABLE_KEY: 'fixture', ALLOWED_ORIGINS: 'https://deutschklinik.com' };
  const people = { learnerB2: { role: 'learner', unlocked: ['B2'] }, founder: { role: 'founder', unlocked: [] } };
  const old = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const who = String(init.headers.Authorization).slice(7), p = new URL(url).pathname;
    if (p === '/auth/v1/user') return who in people ? Response.json({ id: who }) : new Response('{}', { status: 401 });
    if (p === '/rest/v1/profiles') return Response.json([people[new URL(url).searchParams.get('user_id').slice(3)]]);
    throw Error(p);
  };
  const site = { Origin: 'https://deutschklinik.com' };
  const list = (chapter, who, e = env, headers = site) => worker.fetch(new Request('https://w.invalid/film-audio?chapter=' + chapter, { headers: { ...headers, ...(who ? { Authorization: 'Bearer ' + who } : {}) } }), e, {});
  const clip = (url, headers = {}) => worker.fetch(new Request(url, { headers }), env, {});
  try {
    assert.equal((await list(487, 'founder', { ...env, FILM_AUDIO: undefined })).status, 404);    // not set up yet: films stay silent
    assert.equal((await list(487, 'founder', { ...env, FILM_AUDIO_SIGNING_KEY: 'short' })).status, 404);
    assert.equal((await list(487, 'founder', env, {})).status, 403);                               // only from the site
    assert.equal((await list(487, null)).status, 401);
    assert.equal((await list(487, 'stranger')).status, 401);
    assert.equal((await list(487, 'learnerB2')).status, 403);                                      // B2 learner, C1 film
    assert.equal((await list(999, 'founder')).status, 404);
    assert.equal((await list('../k1', 'founder')).status, 400);
    const ok = await list(487, 'founder'), body = await ok.json();
    assert.equal(ok.status, 200); assert.equal(ok.headers.get('Cache-Control'), 'private, no-store');
    assert.deepEqual(body.cues.map((c) => c.id), ['a--1']);                                        // a key from another film is dropped
    assert.equal((await list(100, 'learnerB2')).status, 200);
    const url = body.cues[0].url;
    assert.ok(url.startsWith('https://w.invalid/film-audio/clip?k=k487%2F'));
    const full = await clip(url);                                                                  // no Origin needed for <audio>
    assert.equal(full.status, 200); assert.equal(full.headers.get('Content-Type'), 'audio/mpeg');
    assert.deepEqual(new Uint8Array(await full.arrayBuffer()), bytes);
    const part = await clip(url, { Range: 'bytes=3-6' });
    assert.equal(part.status, 206); assert.equal(part.headers.get('Content-Range'), 'bytes 3-6/' + bytes.length);
    assert.equal(new TextDecoder().decode(await part.arrayBuffer()), 'fake');
    const u = new URL(url), e = +u.searchParams.get('e'), k = u.searchParams.get('k');
    const forged = new URL(url); forged.searchParams.set('k', 'k100/' + sha('b') + '.mp3');
    assert.equal((await clip(forged.href)).status, 403);                                           // the signature binds the clip
    const later = new URL(url); later.searchParams.set('e', String(e + 60));
    assert.equal((await clip(later.href)).status, 403);                                            // and its expiry
    const past = Math.floor(Date.now() / 1000) - 5, expired = new URL(url);
    expired.searchParams.set('e', String(past)); expired.searchParams.set('s', await signClip(env, k, past));
    assert.equal((await clip(expired.href)).status, 403);
    const far = Math.floor(Date.now() / 1000) + LINK_SECONDS * 10, tooLong = new URL(url);
    tooLong.searchParams.set('e', String(far)); tooLong.searchParams.set('s', await signClip(env, k, far));
    assert.equal((await clip(tooLong.href)).status, 403);
    const sneaky = new URL(url); sneaky.searchParams.set('k', 'k487/../secret.mp3');
    assert.equal((await clip(sneaky.href)).status, 400);
    assert.equal((await clip(url.replace(/s=[^&]+/, 's=' + 'A'.repeat(43)))).status, 403);
  } finally { globalThis.fetch = old; }
});
