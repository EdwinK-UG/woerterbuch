const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const grammar = fs.readFileSync("grammatik/grammatik.js", "utf8");
const source = grammar.slice(grammar.indexOf("const PKEY = 'gd_place'"), grammar.indexOf("/* ---------- overview: Grammatik"));

function fixture() {
  const memory = new Map(), calls = [], timers = [];
  let user = null; const servers = new Map(); let now = Date.parse("2026-11-25T10:00:00Z");
  const context = {
    Date: class extends Date { static now() { return now; } },
    setTimeout: (fn) => (timers.push(fn), timers.length), clearTimeout() {},
    localStorage: { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) },
    window: { addEventListener() {} }, document: { addEventListener() {} }, location: { hash: "#/g" },
    READY: { 5: 1, 12: 1, 201: 1 }, isRef: () => false, isV: (n) => n > 200, hashOf: (n) => (n > 200 ? "#/v/" : "#/g/") + n,
    chInfo: (n) => ({ g: {}, c: [n, n === 12 ? "Perfekt" : "Thema", "kick", "A2"] }), gNo: (n) => n, topicNo: (n) => n - 200,
    chapterSummary: (n) => ({ vocab: n > 200, exercises: [{ id: "a", title: "Mit haben" }, { id: "b", title: "Mit sein" }] }),
    exLabel: (c, x) => "Übung " + (c.exercises.indexOf(x) + 1), H: (s) => String(s), icn: () => "", icons() {}, $: () => null, V: () => ({ querySelector: () => null }),
    ACCT: {
      token: async () => "token",
      api: async (path, opts = {}) => {
        calls.push({ path, opts });
        const server = servers.get(user.id);
        if (opts.method === "POST") { const b = opts.body; assert.equal(b.user_id, user.id); if (!server || Date.parse(b.at) >= Date.parse(server.at)) servers.set(user.id, { place: b.place, at: b.at }); return null; }
        assert.ok(path.endsWith("user_id=eq." + user.id));
        return server ? [server] : [];
      },
    },
  };
  context.acct = () => user;
  vm.runInNewContext(source + "\nthis.t={notePlace,place,placeCard,pushPlace,pullPlace,placeLocal}", context);
  return { ...context.t, calls, timers, memory,
    signIn: (id) => (user = { id }), signOut: () => (user = null),
    later: (ms) => (now += ms), setServer: (p, at) => servers.set(user.id, { place: p, at: new Date(at).toISOString() }), server: () => servers.get(user.id),
    flush: async () => { const t = timers.splice(0); for (const f of t) await f(); } };
}

test("the place follows the learner and the card says where to continue", async () => {
  const f = fixture();
  f.notePlace(12);                                         // guest opens chapter 12
  f.later(1000); f.notePlace(12, "ue-b");                 // works in exercise 2
  f.later(1000); f.notePlace(12);                          // reopening the chapter keeps the exercise
  assert.equal(f.place().part, "ue-b");
  const card = f.placeCard("g");
  assert.match(card, /href="#\/g\/12\/ue-b"/); assert.match(card, /Weitermachen/); assert.match(card, /Kapitel 12: Perfekt/); assert.match(card, /Übung 2 · Mit sein/);
  assert.equal(f.placeCard("v"), "");                       // a grammar place isn't shown in Wortschatz
  assert.equal(f.calls.length, 0);                          // guests stay on the device
});

test("signed in, the newest place wins between this browser and the app", async () => {
  const f = fixture();
  f.signIn("u1");
  f.setServer({ ch: 5, part: "grs-v" }, Date.parse("2026-11-25T09:00:00Z"));   // the app, an hour ago
  await f.pullPlace();
  assert.equal(f.place().ch, 5); assert.equal(f.place().part, "grs-v");
  f.notePlace(12, "ue-a"); await f.flush();                // now on the web: uploaded
  const post = f.calls.find((c) => c.opts.method === "POST");
  assert.equal(post.path, "/rest/v1/learner_places?on_conflict=user_id");
  assert.equal(post.opts.headers.Prefer, "resolution=merge-duplicates,return=minimal");
  assert.equal(JSON.stringify(post.opts.body.place), '{"ch":12,"part":"ue-a"}'); assert.equal(post.opts.body.user_id, "u1");
  f.setServer({ ch: 201, part: null }, Date.parse("2026-11-25T10:30:00Z"));    // later the learner moves on in the app
  f.later(60 * 60000); await f.pullPlace();
  assert.equal(f.place().ch, 201);
  assert.match(f.placeCard("v"), /Thema 1: Thema/);
});

test("one account's place is never shown to another, and a guest's newer place joins the account", async () => {
  const f = fixture();
  f.signIn("u1"); f.notePlace(12, "ue-a"); await f.flush();
  f.signOut(); assert.equal(f.place(), null);
  f.signIn("u2"); await f.pullPlace(); assert.equal(f.place(), null);
  f.signOut(); f.later(5000); f.notePlace(5);              // as a guest
  f.signIn("u2"); await f.pullPlace(); await f.flush();
  assert.equal(f.place().ch, 5); assert.equal(JSON.stringify(f.server().place), '{"ch":5,"part":null}');
});
