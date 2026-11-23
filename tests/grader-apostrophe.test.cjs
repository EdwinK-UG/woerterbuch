const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({ window: { addEventListener() {} }, document: { addEventListener() {} }, location: { hash: "" } });
vm.runInContext(fs.readFileSync(path.join(__dirname, "../grammatik/grammatik.js"), "utf8"), context);
const sn = context.window.GRAM._test.sentenceNorm;

test("typed answers ignore apostrophes unless the exercise marks them as part of the answer", () => {
  // default (every exercise without the flag): unchanged, the apostrophe is ignored
  assert.equal(sn("Das ist Hans' Hut."), sn("Das ist Hans Hut"));
  assert.equal(sn("Na, wie läuft's?", true), "Na, wie läuft s");
  // apostrophe: true (the genitive of names on -s, -x, -z): a missing apostrophe is wrong ...
  assert.notEqual(sn("in Max Wohnzimmer", false, true), sn("in Max' Wohnzimmer", false, true));
  assert.notEqual(sn("Das ist Hans Hut", true, true), sn("Das ist Hans' Hut", true, true));
  // ... but every way of typing it counts, and other punctuation is still ignored as before
  for (const typed of ["in Max’ Wohnzimmer.", "in Max´ Wohnzimmer", "in Max` Wohnzimmer", "in Max‘ Wohnzimmer", "in  Max' Wohnzimmer!"])
    assert.equal(sn(typed, false, true), sn("in Max' Wohnzimmer", false, true), typed);
  assert.equal(sn("Felix’ Zimmer, das", true, true), "Felix' Zimmer, das");
});
