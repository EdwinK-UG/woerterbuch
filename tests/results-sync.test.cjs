const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { randomUUID } = require("node:crypto");
const grammar = fs.readFileSync("grammatik/grammatik.js", "utf8");
const source = grammar.slice(
  grammar.indexOf("const LKEY = 'gd_gram'"),
  grammar.indexOf("function chapterProgress"),
);
function fixture() {
  const memory = new Map(),
    rows = new Map(),
    events = {};
  let user = { id: "first" },
    loseReply = true;
  const context = {
    structuredClone,
    crypto: { randomUUID },
    Date,
    setTimeout: () => 1,
    clearTimeout() {},
    localStorage: {
      getItem: (k) => memory.get(k),
      setItem: (k, v) => memory.set(k, v),
    },
    V: () => ({ querySelector: () => null }),
    window: { addEventListener: (name, callback) => (events[name] = callback) },
    ACCT: {
      user: () => user,
      token: async () => user.id,
      resultRows: async () =>
        [...rows.values()].filter((r) => r.user_id === user.id),
      api: async (_path, options) => {
        for (const row of options.body)
          rows.set(row.user_id + "|" + row.attempt_id, row);
        if (loseReply) {
          loseReply = false;
          throw Error("reply lost after insert");
        }
      },
    },
  };
  context.window.ACCT = context.ACCT;
  vm.runInNewContext(
    source + "\nwindow.review={record,sync,pull,attempts,best,store}",
    context,
  );
  return {
    ...context.window.review,
    rows,
    events,
    changeUser: (id) => {
      user = { id };
      events["acct:out"]();
    },
  };
}
test("a lost insert response and retries preserve one server attempt per UUID", async () => {
  const f = fixture(),
    at = Date.now();
  f.record({ ch: 1, ex: "u1", at, score: 1, total: 1, passed: true });
  await f.sync();
  assert.equal(f.rows.size, 1);
  assert.equal(f.store().att[0].sent, false);
  await f.sync();
  assert.equal(f.rows.size, 1);
  assert.equal(f.store().att[0].sent, true);
  f.record({ ch: 1, ex: "u2", at, score: 1, total: 1, passed: true });
  await f.sync();
  assert.equal(f.rows.size, 2);
  assert.equal(f.attempts().length, 2);
});
test("queued attempts remain bound to the original account", async () => {
  const f = fixture();
  f.record({
    ch: 1,
    ex: "u1",
    at: Date.now(),
    score: 1,
    total: 1,
    passed: true,
  });
  await f.sync();
  f.changeUser("second");
  await f.sync();
  await f.pull();
  assert.equal(f.rows.size, 1);
  assert.equal(f.attempts().length, 0);
});
