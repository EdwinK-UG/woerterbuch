const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
test("a topic builds reproducibly from portable fixtures and a bad template preserves the chapter", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "vocabulary-test-"));
  try {
    const write = (file, text) => {
      fs.mkdirSync(path.dirname(path.join(directory, file)), {
        recursive: true,
      });
      fs.writeFileSync(path.join(directory, file), text);
    };
    write("corpus/raw/deu_sentences.tsv", "1\tdeu\tDies ist ein Test.\n");
    write("corpus/raw/eng_sentences.tsv", "2\teng\tThis is a test.\n");
    write("corpus/raw/deu-eng_links.tsv", "1\t2\n");
    write(
      "a1_201.entries.json",
      JSON.stringify([
        { w: "Test", ar: "der", ps: "n", grp: "fixture", pl: "Tests" },
      ]),
    );
    write(
      "a1_201_curated.json",
      JSON.stringify({ en: { Test: ["test"] }, fix: {}, note: {}, eng: {} }),
    );
    write("a1_201_picks.txt", "Test: 1\n");
    write("k201.tpl.js", "GRAM.add({n:201,words:/*DATA*/[]});\n");
    const command = path.resolve("tools/vocabulary/build_topic.py");
    const build = () =>
      spawnSync("python3", [command, "a1_201"], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          PYTHONDONTWRITEBYTECODE: "1",
          VOCAB_DATA_DIR: path.join(directory, "corpus"),
          VOCAB_OUTPUT_DIR: path.join(directory, "out"),
        },
      });
    const first = build();
    assert.equal(first.status, 0, first.stderr);
    const output = fs.readFileSync(path.join(directory, "out/k201.js"), "utf8");
    assert.match(output, /This is a test/);
    assert.equal(build().status, 0);
    assert.equal(
      fs.readFileSync(path.join(directory, "out/k201.js"), "utf8"),
      output,
    );
    write("k201.tpl.js", "invalid template");
    assert.notEqual(build().status, 0);
    assert.equal(
      fs.readFileSync(path.join(directory, "out/k201.js"), "utf8"),
      output,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
