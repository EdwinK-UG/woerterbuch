import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { webcrypto } from "node:crypto";
import worker from "../src/index.js";
import { drainMail } from "../src/welcome.js";
globalThis.crypto ||= webcrypto;
const migration = readFileSync(
  new URL("../migrations/0001_review_and_operations.sql", import.meta.url),
  "utf8",
);
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
      GMAIL_USER: "sender@example.invalid",
      GMAIL_APP_PASSWORD: "test-placeholder",
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
