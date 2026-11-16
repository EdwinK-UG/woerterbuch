const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("public folders contain no lesson bodies or generated deployment bundle", () => {
  assert.equal(fs.readdirSync("grammatik").some(name => /^k\d+\.js$/.test(name)), false);
  assert.equal(fs.existsSync("supabase/functions/lessons/lessons.json"), false);
});

test("lesson delivery checks a fresh profile, rejects missing or wrong enrolment and fails closed", async () => {
  const { lessonHandler } = await import("../supabase/functions/lessons/handler.mjs");
  let profile = { role: "learner", unlocked: ["A1"] }, valid = true, failure = false;
  const handler = lessonHandler({ url: "https://project.invalid", key: "public", lessons: {
    1: { level: "A1", source: "PRIVATE A1" }, 22: { level: "A2", source: "PRIVATE A2" },
    101: { level: "Liste", source: "PRIVATE REFERENCE" },
  }, fetcher: async (url, options) => {
    assert.equal(options.headers.Authorization, "Bearer fixture");
    if (failure) throw Error("network");
    if (url.endsWith("/user")) return new Response(JSON.stringify({ id: "student" }), { status: valid ? 200 : 401 });
    assert.match(url, /user_id=eq.student$/);
    return new Response(JSON.stringify(profile ? [profile] : []));
  } });
  const get = (number, token = "fixture") => handler(new Request("https://project.invalid/functions/v1/lessons?chapter=" + number, {
    headers: token ? { Authorization: "Bearer " + token } : {},
  }));
  assert.equal((await get(1, "")).status, 401);
  let response = await get(1);
  assert.equal(await response.text(), "PRIVATE A1");
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  assert.equal((await get(22)).status, 403);
  assert.equal((await get(101)).status, 200);
  profile.unlocked = [];
  assert.equal((await get(1)).status, 403);
  assert.equal((await get(101)).status, 403);
  profile.role = "teacher";
  assert.equal((await get(22)).status, 200);
  profile = null;
  assert.equal((await get(1)).status, 403);
  valid = false;
  assert.equal((await get(1)).status, 401);
  valid = true; failure = true;
  assert.equal((await get(1)).status, 503);
});

test("the open-access switch serves lessons without sign-in and still refuses unknown chapters", async () => {
  const { lessonHandler } = await import("../supabase/functions/lessons/handler.mjs");
  const handler = lessonHandler({ url: "https://project.invalid", key: "public", open: true,
    lessons: { 109: { level: "B2", source: "PRIVATE B2" } }, fetcher: async () => { throw Error("no account lookup when open"); } });
  const get = number => handler(new Request("https://project.invalid/functions/v1/lessons?chapter=" + number));
  const response = await get(109);
  assert.equal(await response.text(), "PRIVATE B2");
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  assert.equal((await get(1)).status, 404);
  assert.equal((await get("x")).status, 404);
  assert.match(fs.readFileSync("supabase/functions/lessons/index.ts", "utf8"), /^const OPEN_ACCESS = (true|false);$/m);
});

test("sign-out invalidates an in-flight lesson before it can execute", async () => {
  const source = fs.readFileSync("grammatik/grammatik.js", "utf8");
  const listeners = {}, CH = {};
  let finish, executed = false, user = { id: "first" };
  const context = vm.createContext({
    CH, cur: null, acct: () => user, allowed: () => true,
    window: { addEventListener: (type, callback) => listeners[type] = callback },
    ACCT: { token: async () => "fixture" }, APP_CONFIG: { supabaseUrl: "https://test.invalid", supabaseKey: "public" },
    fetch: () => new Promise(resolve => finish = resolve),
    document: { createElement: () => ({}), head: { appendChild() { executed = true; } } },
    URL: { createObjectURL: () => "blob:fixture", revokeObjectURL() {} }, Blob,
  });
  vm.runInContext(source.slice(source.indexOf("let lessonEpoch"), source.indexOf("function jump(anchor)")), context);
  const loading = context.loadChapter(1);
  await new Promise(setImmediate);
  user = null; listeners["acct:out"]();
  finish(new Response("PRIVATE"));
  await assert.rejects(loading, /account changed/);
  assert.equal(executed, false);
  assert.deepEqual(CH, {});
});

test("with openAccess on, a signed-out visitor loads a lesson without sending a sign-in", async () => {
  const source = fs.readFileSync("grammatik/grammatik.js", "utf8");
  const CH = {}, APP_CONFIG = { supabaseUrl: "https://test.invalid", supabaseKey: "public", openAccess: true };
  let sent;
  const context = vm.createContext({
    CH, cur: null, acct: () => null, allowed: () => true,
    window: { addEventListener() {}, APP_CONFIG, GRAM: { lessonEpoch: () => 0 } },
    ACCT: { token: async () => { throw Error("Nicht angemeldet"); } }, APP_CONFIG,
    fetch: async (url, options) => { sent = options.headers; return new Response("CH[109] = { n: 109 };"); },
    document: { createElement: () => ({ remove() {} }), head: { appendChild(script) { CH[109] = { n: 109 }; script.onload(); } } },
    URL: { createObjectURL: () => "blob:fixture", revokeObjectURL() {} }, Blob,
  });
  vm.runInContext(source.slice(source.indexOf("let lessonEpoch"), source.indexOf("function jump(anchor)")), context);
  assert.deepEqual(await context.loadChapter(109), { n: 109 });
  assert.deepEqual(JSON.parse(JSON.stringify(sent)), { apikey: "public" });
  APP_CONFIG.openAccess = false;
  await assert.rejects(context.loadChapter(110), /Enrolment required/);
});
