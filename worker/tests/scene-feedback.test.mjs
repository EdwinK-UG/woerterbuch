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
    const [created, day, actor, scene, de, en, prefer, good, improve, device, watched, lang] = a;
    if (rows.filter((r) => r.day === day && r.actor === actor).length >= limit) return null;
    rows.push({ created, day, actor, scene, de, en, prefer, good, improve, device, watched, lang }); return { id: rows.length };
  } }; } }; } };
}
const req = (body, ip = "203.0.113.9") => new Request("https://w.example/scene-feedback", { method: "POST", headers: { "CF-Connecting-IP": ip }, body: typeof body === "string" ? body : JSON.stringify(body) });

test("scene feedback stores ratings, preference, tidied texts and the device kind, without the visitor's address", async () => {
  const DB = fakeDB(), env = { DB };
  const r = await sceneFeedback(req({ scene: "k05", ratings: { de: 4, en: 5 }, prefer: "en", good: "  Sehr  gut! ", improve: "Line 1\r\n\n\n\nline 2", device: "phone · iOS · Safari <b>", watched: ["de", "en", "x"], lang: "en" }), env, {});
  assert.equal(r.status, 202);
  assert.deepEqual({ ...DB.rows[0], created: 0, day: 0, actor: 0 }, { created: 0, day: 0, actor: 0, scene: "k05", de: 4, en: 5, prefer: "en", good: "Sehr gut!", improve: "Line 1\n\nline 2", device: "phone · iOS · Safari b", watched: "de,en", lang: "en" });
  assert.ok(!JSON.stringify(DB.rows).includes("203.0.113.9"));
});
test("scene feedback refuses unknown scenes, bad ratings, empty sends and floods", async () => {
  const DB = fakeDB(2), env = { DB };
  assert.equal((await sceneFeedback(req({ scene: "k99", prefer: "de" }), env, {})).status, 400);
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
