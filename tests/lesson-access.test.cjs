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
