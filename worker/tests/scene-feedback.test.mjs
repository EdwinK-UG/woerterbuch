import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { sceneFeedback } from "../src/scene-feedback.js";
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// a tiny stand-in for D1: remembers inserted rows and applies the daily limit like the SQL does
function fakeDB(limit = 20) {
  const rows = [];
  return { rows, prepare(sql) { return { bind(...a) { return { async first() {
    assert.ok(sql.includes("INSERT INTO scene_feedback"));
    const [created, day, actor, scene, de, en, prefer, good, improve, device, watched, lang, free, understand, pictures, practice, bugs, version, deL, enL, preference, sw, fr, swL, frL] = a;
    if (rows.filter((r) => r.day === day && r.actor === actor).length >= limit) return null;
    rows.push({ created, day, actor, scene, de, en, prefer, good, improve, device, watched, lang, ...(free || understand || pictures || practice || bugs ? { free, understand, pictures, practice, bugs } : {}), ...(version || deL || enL || preference ? { version, deL, enL, preference } : {}), ...(sw || fr || swL || frL ? { sw, fr, swL, frL } : {}) }); return { id: rows.length };
  } }; } }; } };
}
const req = (body, ip = "203.0.113.9") => new Request("https://w.example/scene-feedback", { method: "POST", headers: { "CF-Connecting-IP": ip }, body: typeof body === "string" ? body : JSON.stringify(body) });

test("scene feedback stores ratings, preference, tidied texts and the device kind, without the visitor's address", async () => {
  const DB = fakeDB(), env = { DB };
  const r = await sceneFeedback(req({ scene: "k05", ratings: { de: 4, en: 5 }, prefer: "en", good: "  Sehr  gut! ", improve: "Line 1\r\n\n\n\nline 2", device: "phone · iOS · Safari <b>", watched: ["de", "en", "x"], lang: "en" }), env, {});
  assert.equal(r.status, 202);
  assert.deepEqual({ ...DB.rows[0], created: 0, day: 0, actor: 0 }, { created: 0, day: 0, actor: 0, scene: "k05", de: 4, en: 5, prefer: "en", good: "Sehr gut!", improve: "Line 1\n\nline 2", device: "phone · iOS · Safari b", watched: "de,en", lang: "en", version: "", deL: null, enL: null, preference: "en" });
  assert.ok(!JSON.stringify(DB.rows).includes("203.0.113.9"));
});
test("scene feedback takes the Swahili and French versions", async () => {
  const DB = fakeDB(), env = { DB };
  const r = await sceneFeedback(req({ scene: "k17", version: "sw-long", ratings: { sw: 5, "sw-long": 4, fr: 3, "fr-long": 2 }, prefer: "sw-long", watched: ["sw", "fr", "xx"], lang: "sw" }), env, {});
  assert.equal(r.status, 202);
  const row = DB.rows[0];
  assert.deepEqual([row.sw, row.fr, row.swL, row.frL, row.version, row.preference, row.watched, row.lang], [5, 3, 4, 2, "sw-long", "sw-long", "sw,fr", "sw"]);
  assert.equal((await sceneFeedback(req({ scene: "k17", ratings: { fr: 9 } }), env, {})).status, 400);
});
test("scene feedback refuses unknown scenes, bad ratings, empty sends and floods", async () => {
  const DB = fakeDB(2), env = { DB };
  assert.equal((await sceneFeedback(req({ scene: "k98", prefer: "de" }), env, {})).status, 400);
  assert.equal((await sceneFeedback(req({ scene: "k05", ratings: { de: 6 } }), env, {})).status, 400);
  assert.equal((await sceneFeedback(req({ scene: "k05", prefer: "maybe" }), env, {})).status, 400);
  assert.equal((await sceneFeedback(req({ scene: "k05" }), env, {})).status, 400);
  assert.equal((await sceneFeedback(req("{not json"), env, {})).status, 400);
  assert.equal((await sceneFeedback(req({ scene: "k05", improve: "x".repeat(4001) }), env, {})).status, 400);
  assert.equal((await sceneFeedback(new Request("https://w.example/scene-feedback"), env, {})).status, 405);
  assert.equal((await sceneFeedback(req({ scene: "k17", prefer: "same" }), env, {})).status, 202);
  assert.equal((await sceneFeedback(req({ scene: "k17", prefer: "same" }), env, {})).status, 202);
  assert.equal((await sceneFeedback(req({ scene: "k17", prefer: "same" }), env, {})).status, 429);
  assert.equal((await sceneFeedback(req({ scene: "k17", prefer: "same" }, "198.51.100.1"), env, {})).status, 202);
});
test("scene feedback keeps each section of the form apart and accepts a section alone", async () => {
  const DB = fakeDB(), env = { DB };
  const r = await sceneFeedback(req({ scene: "k17", free: "Super!", understand: "Too fast at the board.", pictures: "Draw the ball rolling.", practice: "Make it a race.", bugs: "No sound on iOS.", good: "The dog" }), env, {});
  assert.equal(r.status, 202);
  const row = DB.rows[0];
  assert.deepEqual([row.free, row.understand, row.pictures, row.practice, row.bugs, row.good, row.improve], ["Super!", "Too fast at the board.", "Draw the ball rolling.", "Make it a race.", "No sound on iOS.", "The dog", ""]);
  assert.equal((await sceneFeedback(req({ scene: "k17", pictures: "A bigger board" }), env, {})).status, 202);
  assert.equal((await sceneFeedback(req({ scene: "k17", bugs: "x".repeat(4001) }), env, {})).status, 400);
  assert.equal((await sceneFeedback(req({ scene: "k17", practice: 5 }), env, {})).status, 400);
});
test("scene feedback rates the long versions and remembers which version was watched", async () => {
  const DB = fakeDB(), env = { DB };
  assert.equal((await sceneFeedback(req({ scene: "k05", version: "en-long", ratings: { "en-long": 5, de: 3 }, prefer: "en-long" }), env, {})).status, 202);
  const r = DB.rows[0]; assert.deepEqual([r.version, r.de, r.enL, r.deL, r.prefer, r.preference], ["en-long", 3, 5, null, null, "en-long"]);
  assert.equal((await sceneFeedback(req({ scene: "k05", ratings: { "de-long": 0 } }), env, {})).status, 400);
  assert.equal((await sceneFeedback(req({ scene: "k05", prefer: "it-long" }), env, {})).status, 400);
  assert.equal((await sceneFeedback(req({ scene: "k05", version: "x", prefer: "de" }), env, {})).status, 202);
  assert.equal(DB.rows[1].prefer, "de"); assert.equal(DB.rows[1].preference, "de");
  // since the pages show only the long versions, the long ones they have watched are kept too
  assert.equal((await sceneFeedback(req({ scene: "k05", version: "de-long", ratings: { "de-long": 4 }, watched: ["de-long", "en-long", "it-long"] }), env, {})).status, 202);
  assert.equal(DB.rows[2].watched, "de-long,en-long");
});
test("scene feedback takes the four B2–C1 films and still refuses unknown scenes", async () => {
  const DB = fakeDB(), env = { DB };
  for (const scene of ["k99", "k97", "k439", "k482"]) assert.equal((await sceneFeedback(req({ scene, version: "de-long", ratings: { "de-long": 5 } }), env, {})).status, 202);
  assert.deepEqual(DB.rows.map((r) => r.scene), ["k99", "k97", "k439", "k482"]);
  assert.equal((await sceneFeedback(req({ scene: "k98", ratings: { "de-long": 5 } }), env, {})).status, 400);
});
