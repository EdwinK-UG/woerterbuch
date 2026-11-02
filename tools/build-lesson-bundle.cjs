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
for (const { n, level } of context.window.GRAM.chapters()) {
  lessons[n] = { level, source: fs.readFileSync(path.join(directory, "k" + n + ".js"), "utf8") };
}
const output = path.join(root, ".local/lesson-bundle");
fs.mkdirSync(output, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(output, "lessons.json"), JSON.stringify({ gzip: zlib.gzipSync(JSON.stringify(lessons)).toString("base64") }), { mode: 0o600 });
console.log("Built private bundle for " + Object.keys(lessons).length + " lessons.");
