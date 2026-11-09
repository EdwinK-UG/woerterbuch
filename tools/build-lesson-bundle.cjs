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
  lessons[n] = { level, source };
}
const output = path.join(root, ".local/lesson-bundle");
fs.mkdirSync(output, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(output, "lessons.json"), JSON.stringify({ gzip: zlib.gzipSync(JSON.stringify(lessons)).toString("base64") }), { mode: 0o600 });
console.log("Built private bundle for " + Object.keys(lessons).length + " lessons" + (visuals ? ", " + attached + " with film overlays" : "") + ".");
