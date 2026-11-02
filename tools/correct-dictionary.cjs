const fs = require("node:fs");
const zlib = require("node:zlib");
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const corrections = require("./dictionary-corrections.json");
const read = f => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, f))));
const core = read("core.bin"), definitions = read("defs.bin"), legacy = read("data.bin");
assert.equal(core.e.length, definitions.length);
assert.equal(core.e.length, legacy.e.length);
const check = process.argv.includes("--check");
for (const fix of corrections) {
  const indexes = core.e.flatMap((r, i) => [fix.lemma, fix.oldLemma].includes(r[0]) ? [i] : []);
  assert.equal(indexes.length, 1, "ambiguous correction " + fix.lemma);
  const i = indexes[0], row = core.e[i], full = legacy.e[i];
  assert.ok([fix.lemma, fix.oldLemma].includes(full[0]), "dictionary order mismatch");
  if (fix.oldLemma) {
    if (check) {
      assert.equal(row[0], fix.lemma); assert.equal(full[0], fix.lemma);
      assert.equal(row[1], fix.syllables); assert.equal(full[1], fix.syllables);
      assert.equal(core.a[fix.oldLemma], fix.lemma);
    } else {
      row[0] = full[0] = fix.lemma; row[1] = full[1] = fix.syllables;
      core.a[fix.oldLemma] = legacy.a[fix.oldLemma] = fix.lemma;
      definitions[i][0] = definitions[i][0].replaceAll(fix.oldLemma, fix.lemma);
      full[4] = full[4].replaceAll(fix.oldLemma, fix.lemma);
    }
  }
  if (fix.before) {
    for (const [value, key] of [[definitions[i], 0], [full, 4]]) {
      if (!check && value[key].includes(fix.before)) value[key] = value[key].replace(fix.before, fix.after);
      assert.ok(value[key].includes(fix.after), "correction absent: " + fix.lemma);
      assert.ok(!value[key].includes(fix.before), "uncorrected fragment: " + fix.lemma);
    }
  }
  if (check) assert.equal(row[7], definitions[i][0].length);
  else row[7] = definitions[i][0].length;
}
if (!check) for (const [file, data] of [["core.bin", core], ["defs.bin", definitions], ["data.bin", legacy]])
  fs.writeFileSync(path.join(root, file), zlib.gzipSync(JSON.stringify(data), { level: 9 }));
console.log("Verified " + corrections.length + " sourced dictionary corrections across all data files.");
