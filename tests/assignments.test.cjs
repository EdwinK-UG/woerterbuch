const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("konto.js", "utf8");
const window = { GRAM: { requiredExercises: () => ["u1", "u2"] } };
const helpers = vm.runInNewContext(
  source.slice(
    source.indexOf("const chNo"),
    source.indexOf("function kpis"),
  ) + "\n({doneTask,chHash,exHash,taskItems,chTitle})",
  { window, GRAM: window.GRAM, T: (en) => en },
);
const done = helpers.doneTask;
test("legacy chapters, frozen requirements and individual exercises use the assignment pass mark", () => {
  const scores = { "me|1|u1": 1, "me|1|u2": 0.69, "other|1|u2": 1 };
  assert.equal(done(scores, "me", { items: [{ ch: 1, ex: null }] }, 70), 0);
  assert.equal(done(scores, "me", { items: [{ ch: 1, ex: "u1" }] }, 70), 1);
  assert.equal(
    done(scores, "me", { items: [{ ch: 1, required: ["u1"] }] }, 70),
    1,
  );
  assert.equal(done(scores, "me", { items: [{ ch: 1, required: [] }] }, 70), 0);
  scores["me|1|u2"] = 0.7;
  assert.equal(done(scores, "me", { items: [{ ch: 1, ex: null }] }, 70), 1);
});
test("assignment links are built only from a chapter number and a plain exercise id", () => {
  window.GRAM.chapters = () => [{ n: 7, vocab: true, title: "Topic" }, { n: 201, title: "Chapter" }];
  const attack = '"><img src=x onerror=alert(1)>';
  assert.equal(helpers.chHash(201), "#/g/201");
  assert.equal(helpers.chHash(7), "#/v/7");
  for (const bad of [attack, "201", "201/../x", 2.5, -1, null, undefined, {}, [201], 1e9])
    assert.equal(helpers.chHash(bad), "#/start", String(bad));
  assert.equal(helpers.exHash("u-1_b"), "/ue-u-1_b");
  for (const bad of [attack, "u1/x", "u 1", "", null, 5, "x".repeat(41)]) assert.equal(helpers.exHash(bad), "", String(bad));
  const stored = [{ ch: attack, ex: "u1" }, attack, null, { ch: 201, ex: attack }, { ch: 7 }];
  assert.deepEqual(JSON.parse(JSON.stringify(helpers.taskItems({ items: stored }))), [{ ch: 201, ex: attack }, { ch: 7 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(helpers.taskItems({ items: "x" }))), []);
  assert.ok(!helpers.chTitle(attack).includes("<"));
  // A malformed stored item is ignored when counting, instead of breaking the page.
  assert.equal(done({ "me|201|u1": 1, "me|201|u2": 1 }, "me", { items: stored }, 70), 0);
  assert.equal(done({ "me|7|u1": 1, "me|7|u2": 1 }, "me", { items: stored }, 70), 1);
});
