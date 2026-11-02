// Validate explicitly reviewed content and prepare administrator-controlled D1 SQL.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const document = require("../content/reviewed-entries.json");
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const statements = [], names = new Set();
for (const original of document.entries) {
  const entry = JSON.parse(JSON.stringify(original));
  assert.ok(entry.w && !names.has(entry.w)); names.add(entry.w);
  assert.ok(entry.q.length && entry.q.every(q => typeof q === "string" && !q.includes("|")));
  assert.ok(new URL(entry.reference).protocol === "https:");
  assert.ok(entry.senses.length && entry.senses.every(s => s.d && s.ex.length));
  for (const sense of entry.senses) for (const example of sense.ex) {
    assert.ok(typeof example.t === "string" && example.t.length > 15);
    Object.assign(example, { src: "Deutschklinik · original example", url: "https://github.com/EdwinK-UG/woerterbuch/blob/main/content/reviewed-entries.json", y: "2026" });
  }
  entry.created = document.reviewed + "T18:00:00.000Z";
  statements.push("INSERT INTO entry_publications(lemma,queries,data,reviewed_at) VALUES(" +
    [entry.w, entry.q.join("|"), JSON.stringify(entry)].map(quote).join(",") +
    ",datetime('now')) ON CONFLICT(lemma) DO UPDATE SET queries=excluded.queries,data=excluded.data,reviewed_at=excluded.reviewed_at;");
  statements.push("UPDATE entry_drafts SET state='rejected' WHERE lemma=" + quote(entry.w) + ";");
}
if (process.argv.includes("--write")) {
  const directory = path.join(root, ".local/release");
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(directory, "reviewed-entries.sql"), statements.join("\n"), { mode: 0o600 });
}
console.log("Validated " + names.size + " reviewed original entries.");
