const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");

test("every site script and executable inline block parses", () => {
  for (const directory of [".", "js", "grammatik"]) {
    for (const file of fs.readdirSync(directory).filter(name => name.endsWith(".js"))) {
      const filename = directory + "/" + file;
      new vm.Script(fs.readFileSync(filename, "utf8"), { filename });
    }
  }
  const html = fs.readFileSync("index.html", "utf8");
  assert.equal((html.match(/<!doctype html>/gi) || []).length, 1);
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/application\/ld\+json/.test(match[1])) JSON.parse(match[2]);
    else if (!/\bsrc=|application\/octet-stream/.test(match[1])) {
      new vm.Script(match[2], { filename: "index.html inline script" });
    }
  }
  for (const file of fs.readdirSync("worker/src").filter(name => name.endsWith(".js"))) {
    const result = spawnSync(process.execPath, ["--check", "worker/src/" + file], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
});
