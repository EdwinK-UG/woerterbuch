// The grammar speaking trainer (docs/speak-trainer.md): the page, the chapter card and the founder's codes.
// The Worker side (codes, limits, the calls to Claude and ElevenLabs) is tested in worker/tests/speak.test.mjs.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

test("the trainer page talks only to the Worker and holds no keys or provider addresses", () => {
  const files = ["grammatik/sprechen/index.html", "grammatik/sprechen/main.js", "grammatik/sprechen/sprechen.css"];
  for (const f of files) {
    const s = read(f);
    assert.doesNotMatch(s, /api\.anthropic\.com|api\.elevenlabs\.io|xi-api-key|x-api-key|sk-ant-|ANTHROPIC_API_KEY|ELEVENLABS_API_KEY/i, f);
  }
  const js = read("grammatik/sprechen/main.js");
  assert.match(js, /APP_CONFIG.workerUrl/);
  assert.match(js, /'\/speak\/turn'/);
  assert.match(js, /parent\.ACCT\.token\(\)/, "the sign-in comes from the lesson page");
  assert.match(js, /MAX_SECONDS = 20/, "a recording is capped");
  // the offline check mode never reaches the network
  assert.match(js, /if \(MOCK\) return pretend\(input\)/);
});

test("the chapter shows the trainer only when the Worker says this account may use it", () => {
  const g = read("grammatik/grammatik.js");
  assert.match(g, /const SPEAK = \{ 5: 'grammatik\/sprechen\/index\.html\?v=1&ch=5' \}/);
  assert.match(g, /\/speak\/access/);
  assert.match(g, /if \(!a \|\| !a\.access \|\| !\(a\.chapters \|\| \[\]\)\.includes\(c\.n\)\) \{ host\.replaceChildren\(\); return; \}/);
  assert.match(g, /data-speak-host=\\?"\$\{c\.n\}\\?"/);
  assert.match(g, /f\.allow = 'autoplay; microphone; fullscreen'/);
  // signed out or a changed account: the answer is asked again
  assert.match(g, /addEventListener\('acct:out', speakReset\)/);
});

test("the account panel redeems LIV codes through the Worker and the founder manages them", () => {
  const k = read("konto.js");
  const join = k.indexOf("async function join(code)"), strip = k.indexOf("replace(/[^0-9a-f]/g, '')", join), liv = k.indexOf("redeemSpeak(code)", join);
  assert.ok(join > 0 && liv > join && liv < strip, "a LIV code is recognised before the class-code clean-up");
  assert.match(k, /workerPost\('\/speak\/redeem', \{ code \}\)/);
  assert.match(k, /workerGet\('\/speak\/codes'\)/);
  assert.match(k, /workerPost\('\/speak\/codes\/revoke', \{ code \}\)/);
  assert.match(k, /function speakCodes\(\) \{\n  if \(!isFounder\(\)\) return;/);
  assert.match(k, /KONTO\.speakCodes\(\)/);
  assert.match(k, /sp\.get\('sprechen'\)/, "the share link …/?sprechen=CODE");
});

test("the Worker keeps the trainer behind the site's origins and its secrets out of the repository", () => {
  const w = read("worker/src/index.js");
  assert.match(w, /if \(url\.pathname\.startsWith\("\/speak\/"\)\) \{\n    if \(!ALLOWED\.includes\(origin\)\) return json/);
  for (const f of ["worker/wrangler.toml", "worker/wrangler.example.toml"].filter((f) => fs.existsSync(path.join(root, f))))
    assert.doesNotMatch(read(f), /ANTHROPIC_API_KEY\s*=|ELEVENLABS_API_KEY\s*=|sk-ant-/, f);
  const m = read("worker/migrations/0009_speak_trainer.sql");
  for (const t of ["speak_codes", "speak_access", "speak_usage", "speak_tries"]) assert.match(m, new RegExp("CREATE TABLE IF NOT EXISTS " + t));
});
