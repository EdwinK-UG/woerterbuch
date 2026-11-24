// Lists the translatable German texts of every A1–B1 grammar chapter, as the page will look them up.
// Reads the private lesson bundle (LESSON_BUNDLE, default .local/lesson-bundle/lessons.json) and writes
// .local/lesson-help/source/k<n>.json. Nothing here is public: the texts are lesson content.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");
const help = require("../../js/lesson-help.js");
const root = path.resolve(__dirname, "../..");
const bundleFile = process.env.LESSON_BUNDLE || path.join(root, ".local/lesson-bundle/lessons.json");
const out = path.join(root, ".local/lesson-help/source");

function lessonsFromBundle(file) {
  const { gzip } = JSON.parse(fs.readFileSync(file, "utf8"));
  return JSON.parse(zlib.gunzipSync(Buffer.from(gzip, "base64")).toString("utf8"));
}
// Runs one lesson source the way the page does (inside the real grammar engine) and returns the chapter it registers.
let engine = null;
function chapterOf(source) {
  if (!engine) {
    engine = vm.createContext({ window: { addEventListener() {} }, document: { addEventListener() {} }, location: { hash: "" }, console });
    vm.runInContext(fs.readFileSync(path.join(root, "grammatik/grammatik.js"), "utf8"), engine);
    engine.GRAM = engine.window.GRAM;
  }
  let chapter = null;
  const add = engine.GRAM.add;
  engine.GRAM.add = c => { chapter = c; };
  try { vm.runInContext(source, engine, { timeout: 5000 }); } finally { engine.GRAM.add = add; }
  return chapter;
}
module.exports = { lessonsFromBundle, chapterOf };

if (require.main === module) {
  const lessons = lessonsFromBundle(bundleFile);
  fs.mkdirSync(out, { recursive: true, mode: 0o700 });
  let chapters = 0, texts = 0, chars = 0, words = 0;
  for (const [n, { source }] of Object.entries(lessons)) {
    const c = chapterOf(source);
    if (!help.eligible(c)) continue;
    // generated exercises: their titles and instructions are fixed, only the items change
    const strings = help.strings(c);
    fs.writeFileSync(path.join(out, "k" + n + ".json"), JSON.stringify({ n: Number(n), level: c.level, title: c.title, strings }, null, 1) + "\n", { mode: 0o600 });
    chapters++; texts += strings.length; for (const s of strings) { chars += s.length; words += s.split(/\s+/).length; }
  }
  console.log(`${chapters} chapters, ${texts} texts, ${words} words, ${chars} characters → ${path.relative(root, out)}`);
}
