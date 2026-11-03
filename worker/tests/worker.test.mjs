import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { webcrypto } from "node:crypto";
import { gunzipSync } from 'node:zlib';
import worker from "../src/index.js";
import { drainMail } from "../src/welcome.js";
import { requestLiveClass, sendCourseInvitation } from "../src/invitations.js";
globalThis.crypto ||= webcrypto;
test('term invitation contains configured dates, course length, timetable and course details', async () => {
  const oldFetch=globalThis.fetch, sent=[];
  try {
    globalThis.fetch=async url=>{
      const path=new URL(url).pathname;
      if(path==='/auth/v1/user') return Response.json({id:'teacher',email:'teacher@example.invalid',email_confirmed_at:'2026-11-01T00:00:00Z'});
      if(path.endsWith('/can_manage_class')) return Response.json(true);
      if(path==='/rest/v1/invites') return Response.json([{code:'abcdef123456'}]);
      if(path==='/rest/v1/classes') return Response.json([{name:'Evening German',level:'A1',term_name:'Spring 2027',starts_on:'2027-02-01',ends_on:'2027-02-28',schedule:'Mon & Wed 18:00 EAT (UTC+3)',course_details:'Weekly feedback and lesson recordings'}]);
      throw Error('Unexpected invitation request');
    };
    const response=await sendCourseInvitation(new Request('https://worker.example.invalid/course-invitation',{method:'POST',headers:{Authorization:'Bearer verified'},body:JSON.stringify({class_id:'00000000-0000-4000-ab00-000000000001',to:'student@example.invalid',invite_url:'https://site.example.invalid/?join=abcdef123456'})}),{SITE_URL:'https://site.example.invalid/',SUPABASE_URL:'https://auth.example.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture',SMTP_USER:'hello@example.invalid',SMTP_PASSWORD:'fixture'},{},async (...args)=>sent.push(args));
    assert.equal(response.status,200);
    for(const body of [sent[0][4],sent[0][5]]) for(const phrase of ['Spring 2027','4 weeks','2027','Weekly feedback and lesson recordings']) assert.ok(body.includes(phrase));
    assert.ok(sent[0][4].includes('Mon & Wed 18:00 EAT (UTC+3)'));
    assert.equal(sent[0][10],'teacher@example.invalid');
  } finally {globalThis.fetch=oldFetch;}
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
    const id=core.e.findIndex(row=>row[0]==='Haus'), word='Haus', definition=definitions[id][0];
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
