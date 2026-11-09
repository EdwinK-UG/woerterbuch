#!/usr/bin/env node
// Local, loopback-only review server for the B2/C1 films with their private overlays and original recordings.
// It serves this checkout read-only and, under /review/, the protected inputs WITHOUT copying them:
//   /review/index.json            films found in the lesson folder (level, number, title, overlay present)
//   /review/lessons/k<n>.js       the frozen lesson file, followed by its overlay exactly as tools/build-lesson-bundle.cjs appends it
//   /review/audio/k<n>.json       recorded cues {id, say, seconds, url}; url names the MP3 by its SHA-256 like the Worker does
//   /review/audio/k<n>/<sha>.mp3  the canonical MP3 whose bytes hash to <sha> (checked before it is served)
// node tools/film-review-server.cjs --lessons /ABS/complete-lessons --visual /ABS/built --audio /ABS/film-audio-final [--port 8790]
"use strict";
const http = require("node:http"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto"), vm = require("node:vm");
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, l) => (v.startsWith("--") ? a.concat([[v.slice(2), l[i + 1]]]) : a), []));
const ROOT = path.resolve(__dirname, ".."), LESSONS = path.resolve(args.lessons), VISUAL = path.resolve(args.visual), AUDIO = path.resolve(args.audio), PORT = +(args.port || 8790);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".mp3": "audio/mpeg", ".ico": "image/x-icon" };
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex"), verified = new Map();
const send = (res, code, body, type, extra) => { res.writeHead(code, Object.assign({ "Content-Type": type || "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }, extra)); res.end(body); };
function lessonSource(n) {
  const bytes = fs.readFileSync(path.join(LESSONS, "k" + n + ".js")); let source = bytes.toString("utf8");
  const vf = path.join(VISUAL, "k" + n + ".visual.json");
  if (fs.existsSync(vf)) { const visual = JSON.parse(fs.readFileSync(vf, "utf8")), af = path.join(VISUAL, "k" + n + ".audio.json"), audio = fs.existsSync(af) ? JSON.parse(fs.readFileSync(af, "utf8")) : null;
    if (visual.lessonSHA256 === sha(bytes)) source += "\n;window.GRAM && window.GRAM.filmVisual && window.GRAM.filmVisual(" + n + ", " + JSON.stringify({ visual, audio }).replace(/</g, "\\u003c") + ");\n"; }
  return source;
}
function index() {
  return fs.readdirSync(LESSONS).filter((f) => /^k\d+\.js$/.test(f)).map((f) => { let c; try { vm.runInNewContext(fs.readFileSync(path.join(LESSONS, f), "utf8"), { GRAM: { add: (x) => { c = x; } } }, { timeout: 3000 }); } catch { return null; }
    return c && c.film && ["B2", "C1"].includes(c.level) ? { n: c.n, level: c.level, title: c.film.title || c.title, visual: fs.existsSync(path.join(VISUAL, "k" + c.n + ".visual.json")), recorded: fs.existsSync(path.join(AUDIO, "k" + c.n, "manifest.json")) } : null; }).filter(Boolean).sort((a, b) => a.n - b.n);
}
http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "GET only");
  const url = new URL(req.url, "http://127.0.0.1"), p = decodeURIComponent(url.pathname);
  try {
    if (p === "/review/index.json") return send(res, 200, JSON.stringify(index()), MIME[".json"]);
    let m = /^\/review\/lessons\/k(\d{1,4})\.js$/.exec(p); if (m) return send(res, 200, lessonSource(+m[1]), MIME[".js"]);
    m = /^\/review\/audio\/k(\d{1,4})\.json$/.exec(p);
    if (m) { const f = path.join(AUDIO, "k" + +m[1], "manifest.json"); if (!fs.existsSync(f)) return send(res, 404, "{}", MIME[".json"]); const man = JSON.parse(fs.readFileSync(f, "utf8"));
      return send(res, 200, JSON.stringify({ chapter: man.chapter, level: man.level, cues: man.cues.map((c) => ({ id: c.id, say: c.say, seconds: c.seconds, url: "/review/audio/k" + man.chapter + "/" + c.audio + ".mp3?f=" + encodeURIComponent(c.file) })) }), MIME[".json"]); }
    m = /^\/review\/audio\/k(\d{1,4})\/([0-9a-f]{64})\.mp3$/.exec(p);
    if (m) { const file = path.join(AUDIO, "k" + +m[1], path.basename(url.searchParams.get("f") || "")); if (!/\.mp3$/.test(file) || !fs.existsSync(file)) return send(res, 404, "missing");
      const bytes = fs.readFileSync(file); if (!verified.has(file)) verified.set(file, sha(bytes)); if (verified.get(file) !== m[2]) return send(res, 409, "hash differs");
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
      if (range) { const a = range[1] ? +range[1] : bytes.length - +range[2], b = range[1] && range[2] ? +range[2] : bytes.length - 1; return send(res, 206, req.method === "HEAD" ? null : bytes.subarray(a, b + 1), MIME[".mp3"], { "Accept-Ranges": "bytes", "Content-Range": "bytes " + a + "-" + b + "/" + bytes.length, "Content-Length": b - a + 1 }); }
      return send(res, 200, req.method === "HEAD" ? null : bytes, MIME[".mp3"], { "Accept-Ranges": "bytes", "Content-Length": bytes.length }); }
    const file = path.join(ROOT, path.normalize(p === "/" ? "/prototypes/film/review.html" : p));
    if (!file.startsWith(ROOT + path.sep) || file.includes(path.sep + ".local" + path.sep) || file.includes(path.sep + ".git") || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, "not found");
    return send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || "application/octet-stream");
  } catch (e) { return send(res, 500, String(e.message)); }
}).listen(PORT, "127.0.0.1", () => console.log("Film review on http://127.0.0.1:" + PORT + "/"));
