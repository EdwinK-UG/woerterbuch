// Local preview of the translated explanations, before anything is deployed.
//   node tools/lesson-help/preview.cjs [port]      then open http://127.0.0.1:<port>/#/g/5
// Serves the site from this folder and answers lesson requests itself (APP_CONFIG.lessonsUrl), like the lessons
// function would after a release: the lesson from the private bundle, ?help=<lang> from .local/lesson-help/<lang>/.
// Only on 127.0.0.1; private folders are never served as files.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { lessonsFromBundle } = require("./extract.cjs");
const { problems } = require("./check.cjs");
const LessonHelp = require("../../js/lesson-help.js");
const root = path.resolve(__dirname, "../..");
const port = Number(process.argv[2] || 8799);
const lessons = lessonsFromBundle(process.env.LESSON_BUNDLE || path.join(root, ".local/lesson-bundle/lessons.json"));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".riv": "application/octet-stream", ".mp3": "audio/mpeg", ".vrm": "application/octet-stream", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };

function help(n, lang) {
  const file = path.join(root, ".local/lesson-help", lang, "k" + n + ".json");
  if (!fs.existsSync(file)) return {};
  const map = {};
  for (const [de, tr] of Object.entries(JSON.parse(fs.readFileSync(file, "utf8")).map || {})) if (!problems(de, tr).length) map[de] = tr;
  return map;
}
http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const send = (status, type, body) => { res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" }); res.end(body); };
  if (url.pathname === "/__lessons") {
    const n = url.searchParams.get("chapter"), lesson = /^\d+$/.test(n || "") && lessons[n];
    if (!lesson) return send(404, "application/json", '{"error":"Lesson unavailable."}');
    if (!url.searchParams.has("help")) return send(200, "text/javascript; charset=utf-8", lesson.source);
    const lang = url.searchParams.get("help");
    if (!LessonHelp.LANGS.includes(lang)) return send(400, "application/json", '{"error":"Unknown language."}');
    return send(200, "application/json; charset=utf-8", JSON.stringify({ lang, map: help(Number(n), lang) }));
  }
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
  if (rel.split("/").some(p => p.startsWith(".")) || /^(config\.local\.json|worker\/\.dev\.vars|supabase\/)/.test(rel)) return send(404, "text/plain", "Not here");
  const file = path.join(root, rel);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(404, "text/plain", "Not found");
  let body = fs.readFileSync(file);
  if (rel === "config.js") body = Buffer.concat([body, Buffer.from("\nAPP_CONFIG.lessonsUrl = location.origin + '/__lessons';\n")]);
  send(200, TYPES[path.extname(file)] || "application/octet-stream", body);
}).listen(port, "127.0.0.1", () => console.log(`Preview on http://127.0.0.1:${port}/#/g/5 (lessons and translations from .local)`));
