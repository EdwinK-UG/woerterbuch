#!/usr/bin/env node
/* A contact sheet of a format-v1 scene (grammatik/buehne/szene.js), headless with the installed Google Chrome (the
   DevTools protocol over Node's own WebSocket, no extra packages). The film plays muted (each line then lasts its
   reading time, so the board steps fire as they would with a recording of that length); near the end of every line
   the picture is paused and photographed. For each frame it also measures how much the narrator's board and the
   bubble cover the people (their upper third: the faces) and which board steps have not fired.
     node tools/scene-frames.cjs <page url> <out dir> [--size 1280x800] [--phone] [--at 0.9] [--speed 3] [--acts 0-3] [--sound]
   --phone: 390 × 844, a touch phone. --sound: plays the recordings (real time; board steps follow the recording). Writes <out>/frames/*.jpg, <out>/report.json and
   <out>/index.html (the sheet), and <out>/sheet.jpg (with ffmpeg). Holds no lesson text. */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), { spawn, execFileSync } = require("child_process");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const argv = process.argv.slice(2), opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const [url, out] = argv; if (!url || !out) { console.error("usage: scene-frames <url> <out dir> [--size WxH] [--phone] [--at 0.9] [--speed 3] [--acts a-b]"); process.exit(1); }
const phone = argv.includes("--phone"), [W, H] = (phone ? "390x844" : opt("size", "1280x800")).split("x").map(Number);
const AT = +opt("at", 0.9), SPEED = +opt("speed", 3), [A0, A1] = (opt("acts", "0-99")).split("-").map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.rmSync(path.join(out, "frames"), { recursive: true, force: true }); fs.mkdirSync(path.join(out, "frames"), { recursive: true });

// runs in the page: what covers whom, and which board steps are still waiting
const MEASURE = `(() => {
  const z = window.__szene, B = z.B, st = document.getElementById('stage').getBoundingClientRect();
  const box = (el) => { if (!el || !el.classList.contains('on')) return null; const r = el.getBoundingClientRect(); return { x: r.x - st.x, y: r.y - st.y, w: r.width, h: r.height }; };
  const cut = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const people = B.occupied().filter((o) => !String(o.who).startsWith('prop:') && B.A[o.who]);
  const board = box(document.querySelector('.tafel')), bubble = box(document.querySelector('.bub'));
  const cover = (r) => r ? people.map((p) => { const face = { x: p.x, y: p.y, w: p.w, h: p.h / 3 }; return { who: p.who, face: +(cut(r, face) / (face.w * face.h)).toFixed(2), body: +(cut(r, p) / (p.w * p.h)).toFixed(2) }; }).filter((c) => c.body > 0.02) : [];
  const off = (r) => r ? r.x < -1 || r.y < -1 || r.x + r.w > st.width + 1 || r.y + r.h > st.height + 1 : false;
  const waiting = [...document.querySelectorAll('.tafel .wait')].length;
  return { line: B.S.line && B.S.line.id, scene: B.S.scene, board: board && { ...board, cover: cover(board), off: off(board) }, bubble: bubble && { ...bubble, cover: cover(bubble), off: off(bubble) }, waiting, stage: [st.width, st.height] };
})()`;

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "frames-")), port = 9300 + Math.floor(Math.random() * 400);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required", "--force-color-profile=srgb", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "about:blank"], { stdio: "ignore" });
  const report = [];
  try {
    let list; for (let i = 0; i < 150 && !(list && list.some((t) => t.type === "page")); i++) { await sleep(200); try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch (e) { /* starting */ } }
    const page = list.find((t) => t.type === "page"), ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const wait = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } else if (m.method === "Runtime.exceptionThrown") console.error("page error:", JSON.stringify(m.params.exceptionDetails).slice(0, 400)); };
    const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expr) => { const r = await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result && r.result.exceptionDetails) console.error("eval:", JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result && r.result.result && r.result.result.value; };
    await cmd("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: phone });
    if (phone) await cmd("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await cmd("Page.enable"); await cmd("Runtime.enable");
    const u = new URL(url); u.searchParams.set("speed", String(SPEED)); await cmd("Page.navigate", { url: u.href });
    let ready = false; for (let i = 0; i < 400 && !ready; i++) { await sleep(250); ready = await ev("!!(window.__szene && document.getElementById('goWatch') && !document.getElementById('goWatch').disabled)"); }
    if (!ready) throw Error('the scene did not get ready (is the local server running?)');
    await ev(`(async () => { const B = window.__szene.B; B.S.muted = ${!argv.includes('--sound')}; document.getElementById('start').style.display = 'none'; await window.__szene.ready; window.__seen = []; B.sayHooks.push((w, id) => window.__seen.push(id)); B.watch(${A0}); })()`);
    const shot = new Set(); let n = 0, idle = 0;
    for (;;) {
      await sleep(60);
      const s = await ev(`(() => { const B = window.__szene.B, L = B.S.line; return { mode: B.S.mode, scene: B.S.scene, n: B.S.scenes.length, id: L && L.id, p: B.progress() }; })()`);
      if (!s) continue;
      if (s.scene > A1 || s.mode === "idle") { if (++idle > 5) break; continue; } idle = 0;
      const key = s.scene + ":" + s.id;
      if (s.id && !shot.has(key) && s.p >= AT) {
        shot.add(key); await ev("window.__szene.B.setPaused(true)"); await sleep(250);
        const m = await ev(MEASURE), f = `${String(++n).padStart(3, "0")}-${s.scene}-${s.id}.jpg`;
        const img = await cmd("Page.captureScreenshot", { format: "jpeg", quality: 70 });
        fs.writeFileSync(path.join(out, "frames", f), Buffer.from(img.result.data, "base64"));
        report.push({ file: f, ...m }); await ev("window.__szene.B.setPaused(false)");
        const warn = [m.board && m.board.cover.some((c) => c.face > 0.25) && "board covers a face", m.bubble && m.bubble.cover.some((c) => c.face > 0.25 && c.who !== m.bubbleWho) && "bubble covers a face", m.waiting && `${m.waiting} board steps waiting`, (m.board && m.board.off) && "board off-stage"].filter(Boolean);
        console.log(f, warn.join("; "));
      }
    }
    ws.close();
  } finally { chrome.kill(); setTimeout(() => fs.rmSync(dir, { recursive: true, force: true }), 500); }
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 1));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  fs.writeFileSync(path.join(out, "index.html"), `<!doctype html><meta charset="utf-8"><title>Contact sheet</title><style>body{font:13px system-ui;margin:16px;background:#f4efe4}div{display:grid;grid-template-columns:repeat(auto-fill,minmax(${phone ? 180 : 320}px,1fr));gap:10px}figure{margin:0}img{width:100%;border-radius:6px}figcaption{color:#555}b{color:#c0392b}</style><h1>${esc(url)}</h1><div>${report.map((r) => `<figure><img src="frames/${r.file}" loading="lazy"><figcaption>${esc(r.file)} ${r.board && r.board.cover.some((c) => c.face > 0.25) ? "<b>board on a face</b>" : ""} ${r.waiting ? `<b>${r.waiting} waiting</b>` : ""}</figcaption></figure>`).join("")}</div>`);
  try { execFileSync("ffmpeg", ["-v", "error", "-y", "-pattern_type", "glob", "-i", path.join(out, "frames", "*.jpg"), "-vf", `scale=${phone ? 200 : 400}:-1,tile=${phone ? 10 : 6}x${Math.ceil(report.length / (phone ? 10 : 6))}`, "-frames:v", "1", path.join(out, "sheet.jpg")]); } catch (e) { console.error("no sheet.jpg (ffmpeg)", e.message.slice(0, 120)); }
  console.log(`${report.length} frames → ${out}`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
