// Private sources and generated deployment bundle must never enter the public tree.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");
const root = path.resolve(__dirname, "..");
const directory = process.env.LESSON_SOURCE_DIR || path.join(root, ".local/lessons");
const context = vm.createContext({ window: { addEventListener() {} }, document: { addEventListener() {} }, location: { hash: "" } });
vm.runInContext(fs.readFileSync(path.join(root, "grammatik/grammatik.js"), "utf8"), context);
const lessons = {};
// FILM_VISUAL_DIR (optional): private film overlays from tools/film-visual.cjs. Each is appended AFTER the unchanged lesson
// source as one GRAM.filmVisual(...) call and only if it was built from exactly this lesson file; otherwise the build stops.
const visuals = process.env.FILM_VISUAL_DIR ? path.resolve(process.env.FILM_VISUAL_DIR) : null;
let attached = 0;
// LESSON_HELP_DIR (default .local/lesson-help): translations of the A1–B1 explanations (tools/lesson-help/), one
// <lang>/k<n>.json per chapter. They are stored next to the unchanged lesson source and served with ?help=<lang>.
// Every entry must be a text of exactly this lesson and keep its markup, otherwise the build stops; texts that are no
// longer in the lesson (it was edited after translating) are dropped and counted.
const helpDir = path.resolve(process.env.LESSON_HELP_DIR || path.join(root, ".local/lesson-help"));
const LessonHelp = require("../js/lesson-help.js");
const { problems } = require("./lesson-help/check.cjs");
let helped = 0, helpTexts = 0, stale = 0;
function helpFor(n, source) {
  const out = {};
  let chapter;
  for (const lang of LessonHelp.LANGS) {
    const file = path.join(helpDir, lang, "k" + n + ".json");
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (data.n !== n || data.lang !== lang || !data.map) throw new Error(file + ': expected { n: ' + n + ', lang: "' + lang + '", map }');
    if (chapter === undefined) {
      const add = context.window.GRAM.add;
      context.window.GRAM.add = c => { chapter = c; };
      context.GRAM = context.window.GRAM;
      try { vm.runInContext(source, context, { timeout: 5000 }); } finally { context.window.GRAM.add = add; }
    }
    if (!LessonHelp.eligible(chapter)) throw new Error(file + ": chapter " + n + " has no translatable explanations");
    const texts = new Set(LessonHelp.strings(chapter)), map = {};
    for (const [de, tr] of Object.entries(data.map)) {
      if (!texts.has(de)) { stale++; continue; }
      const bad = problems(de, tr);
      if (bad.length) throw new Error(file + ": " + JSON.stringify(de.slice(0, 60)) + ": " + bad.join("; ") + "\nRun node tools/lesson-help/check.cjs " + lang + " " + n);
      map[de] = tr; helpTexts++;
    }
    out[lang] = map;
  }
  if (!Object.keys(out).length) return null;
  helped++;
  return out;
}
for (const { n, level } of context.window.GRAM.chapters()) {
  const bytes = fs.readFileSync(path.join(directory, "k" + n + ".js"));
  let source = bytes.toString("utf8");
  const file = visuals && path.join(visuals, "k" + n + ".visual.json");
  if (file && fs.existsSync(file)) {
    const visual = JSON.parse(fs.readFileSync(file, "utf8"));
    const audioFile = path.join(visuals, "k" + n + ".audio.json"), audio = fs.existsSync(audioFile) ? JSON.parse(fs.readFileSync(audioFile, "utf8")) : null;
    const sha = require("node:crypto").createHash("sha256").update(bytes).digest("hex");
    if (visual.n !== n || visual.lessonSHA256 !== sha) throw new Error("Film overlay k" + n + " was built from a different lesson file. Rebuild it with tools/film-visual.cjs.");
    source += "\n;window.GRAM && window.GRAM.filmVisual && window.GRAM.filmVisual(" + n + ", " + JSON.stringify({ visual, audio }).replace(/</g, "\\u003c") + ");\n";
    attached++;
  }
  const help = fs.existsSync(helpDir) ? helpFor(n, bytes.toString("utf8")) : null;
  lessons[n] = help ? { level, source, help } : { level, source };
}
const output = path.join(root, ".local/lesson-bundle");
fs.mkdirSync(output, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(output, "lessons.json"), JSON.stringify({ gzip: zlib.gzipSync(JSON.stringify(lessons)).toString("base64") }), { mode: 0o600 });
console.log("Built private bundle for " + Object.keys(lessons).length + " lessons" + (visuals ? ", " + attached + " with film overlays" : "") +
  (helped ? ", " + helped + " with translated explanations (" + helpTexts + " texts" + (stale ? ", " + stale + " no longer in the lesson and dropped" : "") + ")" : "") + ".");
