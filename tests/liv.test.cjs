const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");

// Liv's files are plain scripts that add globals to window; load them into one sandbox the way the browser does.
function sandbox() {
  const ctx = { Math, JSON, console, Image: class { set src(_) {} }, addEventListener() {}, setTimeout, clearTimeout };
  ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  for (const file of ["grammatik/liv/liv-art.js", "grammatik/liv/engine.js", "grammatik/liv/film-park.js"]) vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  return ctx;
}

test("the generated engine matches its sources and every Liv script parses", () => {
  const before = fs.readFileSync("grammatik/liv/engine.js", "utf8");
  const built = spawnSync(process.execPath, ["tools/liv/build.cjs"], { encoding: "utf8" });
  assert.equal(built.status, 0, built.stderr);
  assert.equal(fs.readFileSync("grammatik/liv/engine.js", "utf8"), before, "run node tools/liv/build.cjs");
  for (const file of ["grammatik/liv/liv-art.js", "grammatik/liv/engine.js", "grammatik/liv/film-park.js"]) new vm.Script(fs.readFileSync(file, "utf8"), { filename: file });
  const mod = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: fs.readFileSync("grammatik/liv/werkstatt/main.js", "utf8"), encoding: "utf8" });
  assert.equal(mod.status, 0, mod.stderr);
});

test("the rig adds only its own globals and Liv has all five views", () => {
  const ctx = sandbox();
  assert.deepEqual(Object.keys(ctx).filter((k) => /^(LIV|GRAM_PARK)/.test(k)).sort(), ["GRAM_PARK", "LIV", "LIV_ART_C01P"]);
  assert.deepEqual(Object.keys(ctx.LIV.SKINS.c01p.cut.views), ["front", "tq", "side", "tqb", "back"]);
  for (const view of ["front", "tq", "side", "tqb", "back"]) for (const part of ["head", "torso", "skirt"]) assert.ok(ctx.LIV_ART_C01P.parts[view + "_" + part], view + "_" + part);
});

test("the park keeps the film player's interface and is a pure function of time", () => {
  const { GRAM_PARK } = sandbox();
  assert.equal(typeof GRAM_PARK.draw, "function"); assert.equal(GRAM_PARK.CYCLE, 8);
  const at = (route, t) => JSON.stringify(GRAM_PARK.frameAt(route, t).f);
  const first = at("into", 3.3); at("within", 6.1); at("into", 0.2);
  assert.equal(at("into", 3.3), first);
  assert.equal(JSON.stringify(sandbox().GRAM_PARK.frameAt("into", 3.3).f), first, "a fresh page shows the same frame");
  assert.equal(at("into", 99), at("into", 8)); assert.equal(at("into", -5), at("into", 0));
});

test("into crosses the gate and within stays inside the park", () => {
  const { GRAM_PARK } = sandbox(), xs = (route) => Array.from({ length: 81 }, (_, i) => GRAM_PARK.frameAt(route, i / 10).f.pose.x);
  const into = xs("into"), within = xs("within");
  assert.ok(into[0] < -1 && into[80] > 1, "starts outside, ends inside");
  assert.ok(Math.min(...within) > 0.5, "never leaves the park");
  assert.ok(Math.max(...within) - Math.min(...within) > 2, "really runs");
  for (const list of [into, within]) assert.ok(Math.abs(list[80] - list[70]) < 0.01, "has come to rest before the end");
});

test("the lesson offers both workshops and neither workshop file holds lesson sentences", () => {
  const gram = fs.readFileSync("grammatik/grammatik.js", "utf8");
  assert.match(gram, /grammatik\/liv\/werkstatt\/index\.html\?v=\d+/); assert.match(gram, /grammatik\/werkstatt\/index\.html\?v=\d+/);
  const main = fs.readFileSync("grammatik/liv/werkstatt/main.js", "utf8");
  assert.match(main, /werkstatt-texts/); assert.match(main, /werkstatt-ready/); assert.match(main, /werkstatt-close/);
  assert.doesNotMatch(main, /\{v:|\{t:/, "sentences come from the lesson page");
  assert.doesNotMatch(main, /\.mp3|speechSynthesis|new Audio\(/, "Liv does not speak");
});
