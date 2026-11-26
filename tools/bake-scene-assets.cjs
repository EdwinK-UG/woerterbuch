#!/usr/bin/env node
/* Bakes the grammar stage's Canvas drawings (pictures of meaning, animals, sets) into public WebP images plus JSON
   manifests under assets/scene/, so the web stage and the native apps draw the same pixels (docs/scene-assets.md).
     node tools/bake-scene-assets.cjs [--only bilder,tiere,sets,check] [--set <name>] [--keep] [--show]
   It serves the repository on a free local port, opens tools/bake-scene-assets.html in headless Google Chrome (the
   DevTools protocol over Node's own WebSocket, as tools/shoot.cjs) and saves what the page posts back. The page
   imports the live drawing code itself (grammatik/buehne/bilder.js, tiere.js, the sets), so a re-bake follows any
   drawing change. Writes only to assets/scene/ and .local/ (the check sheet). --keep: do not clear old files first. */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), http = require("http"), { spawn } = require("child_process");
const ROOT = path.resolve(__dirname, ".."), OUT = path.join(ROOT, "assets/scene");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const argv = process.argv.slice(2), opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const only = opt("only", "bilder,tiere,sets,check"), one = opt("set", "");   // --set <name>: only that set (bake and check)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const WRITABLE = ["assets/scene/", ".local/"];

// clear what this run re-bakes, so a renamed picture leaves no stale file behind
if (!argv.includes("--keep")) {
  const dirs = { bilder: ["bilder", "icons", "bilder.json"], tiere: ["tiere", "tiere.json"], sets: ["sets"] };
  for (const part of only.split(",")) for (const d of (part === "sets" && one ? ["sets/" + one, "sets/" + one + ".json"] : dirs[part]) || []) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (req.method === "POST" && u.pathname === "/__save") {
    const rel = u.searchParams.get("path") || "";
    if (rel.includes("..") || !WRITABLE.some((w) => rel.startsWith(w))) { res.writeHead(403).end("no"); return; }
    const chunks = []; req.on("data", (c) => chunks.push(c)); req.on("end", () => {
      const file = path.join(ROOT, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.concat(chunks));
      res.writeHead(200).end("ok");
    });
    return;
  }
  const file = path.join(ROOT, decodeURIComponent(u.pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, url = `http://127.0.0.1:${port}/tools/bake-scene-assets.html?only=${only}${one ? '&set=' + one : ''}${process.env.BAKE_DBG ? '&dbg=1' : ''}`;
  if (argv.includes("--show")) { console.log("open", url, "(Ctrl-C to stop)"); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bake-")), dport = 9300 + Math.floor(Math.random() * 400);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${dport}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--force-color-profile=srgb", "about:blank"], { stdio: "ignore" });
  try {
    let list; for (let i = 0; i < 150 && !(list && list.some((t) => t.type === "page")); i++) { await sleep(200); try { list = await (await fetch(`http://127.0.0.1:${dport}/json/list`)).json(); } catch (e) { /* starting */ } }
    if (!list) throw Error("Chrome did not start");
    const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const wait = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); }
      else if (m.method === "Runtime.exceptionThrown") console.error("page error:", m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      else if (m.method === "Runtime.consoleAPICalled") console.log(m.params.args.map((a) => a.value ?? a.description).join(" ")); };
    const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async (expr) => (await cmd("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
    await cmd("Emulation.setDeviceMetricsOverride", { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
    await cmd("Runtime.enable"); await cmd("Page.enable"); await cmd("Page.navigate", { url });
    const t0 = Date.now();
    for (;;) {
      await sleep(400);
      const st = await evaluate("window.__done ? JSON.stringify(window.__done) : null");
      if (st) { const d = JSON.parse(st); if (!d.ok) throw Error(d.error); break; }
      if (Date.now() - t0 > +opt("timeout", 600000)) throw Error("bake timed out");
    }
    ws.close();
  } finally { chrome.kill(); server.close(); setTimeout(() => fs.rmSync(dir, { recursive: true, force: true }), 500); }
  // sizes
  const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
  const files = walk(OUT), by = {};
  for (const f of files) { const k = path.relative(OUT, f).split(path.sep)[0].replace(/\.json$/, ".json"); by[k] = (by[k] || 0) + fs.statSync(f).size; }
  const kb = (n) => (n / 1024).toFixed(0) + " KB";
  console.log("\nassets/scene:", files.length, "files,", kb(Object.values(by).reduce((a, b) => a + b, 0)));
  for (const [k, n] of Object.entries(by).sort()) console.log("  " + k.padEnd(14), kb(n));
})().catch((e) => { console.error(e.message || e); server.close(); process.exit(1); });
