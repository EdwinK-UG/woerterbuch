#!/usr/bin/env node
/* A contact sheet of a format-v1 scene (grammatik/buehne/szene.js), headless with the installed Google Chrome (the
   DevTools protocol over Node's own WebSocket, no extra packages). The film plays muted (each line then lasts its
   reading time, so the board steps fire as they would with a recording of that length); near the end of every line
   the picture is paused and photographed. For each frame it also measures how much the narrator's board and the
   bubble cover the people (their upper third: the faces), which board steps have not fired, and whether anything
   with text or meaning (the board and everything on it, the bubble, cards, the Merksatz, the lamps, the wheel, word
   and picture props, the tape's labels) comes closer than --margin px (default 8) to an edge of the picture, or
   crosses it ("edge": the fit rule in docs/scene-format.md, player behaviour). What lies wholly outside the picture is
   not shown and only listed (report.json "outside").
     node tools/scene-frames.cjs <page url> <out dir> [--size 1280x800] [--phone [390x844]] [--at 0.9] [--speed 3] [--acts 0-3] [--sound] [--margin 8]
   --phone: a touch phone, 390 × 844 unless a size follows (--phone 320x640, --phone 844x390). --sound: plays the
   recordings (real time; board steps follow the recording). Writes <out>/frames/*.jpg, <out>/report.json and
   <out>/index.html (the sheet), and <out>/sheet.jpg (with ffmpeg). Holds no lesson text. */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), { spawn, execFileSync } = require("child_process");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const argv = process.argv.slice(2), opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const [url, out] = argv; if (!url || !out) { console.error("usage: scene-frames <url> <out dir> [--size WxH] [--phone] [--at 0.9] [--speed 3] [--acts a-b]"); process.exit(1); }
const phone = argv.includes("--phone"), phoneSize = phone && /^\d+x\d+$/.test(opt("phone", "")) ? opt("phone") : "390x844";
const [W, H] = (phone ? phoneSize : opt("size", "1280x800")).split("x").map(Number), MARGIN = +opt("margin", 8);
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
  // edges: the box around an element and everything visible in it (a wagon or label may stick out of its board)
  const SKIP = '.wait, .tf-shaving, .tf-cork, .tf-plane, .tf-sparks';
  const rel = (r) => ({ x: r.x - st.x, y: r.y - st.y, w: r.width, h: r.height });
  function hull(el) {
    let a = null;
    for (const e of [el, ...el.querySelectorAll('*')]) {
      if (e !== el && e.closest(SKIP)) continue;
      const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || +getComputedStyle(e).opacity < 0.1) continue;
      a = a ? { l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom) } : { l: r.left, t: r.top, r: r.right, b: r.bottom };
    }
    return a && rel({ x: a.l, y: a.t, width: a.r - a.l, height: a.b - a.t });
  }
  const things = [];
  for (const [what, sel] of [['board', '.tafel.on'], ['bubble', '.bub.on'], ['card', '#cards .card'], ['merk', '#merk.on'], ['lamps', '#lamps.on'], ['wheel', '#wheel.on']])
    for (const el of document.querySelectorAll(sel)) { if (getComputedStyle(el).visibility === 'hidden') continue; const r = hull(el); if (r) things.push({ what, ...r }); }
  // (players before 27 Nov 2026 had no props.boxes(): their props' rough boxes from what boards keep clear of)
  const propBoxes = z.props && z.props.boxes ? z.props.boxes() : B.occupied().filter((o) => String(o.who).startsWith('prop:')).map((o) => ({ ...o, id: String(o.who).slice(5) }));
  for (const p of propBoxes) things.push({ what: String(p.id).startsWith('mark:') ? 'label' : 'prop', id: p.id, x: p.x, y: p.y, w: p.w, h: p.h });
  const edge = [], outside = [];
  for (const r of things) {
    // wholly outside the picture: not shown at all (a label on a part of the tape the camera has not reached)
    if (r.x + r.w <= 0 || r.x >= st.width || r.y + r.h <= 0 || r.y >= st.height) { outside.push(r.what + (r.id ? ' ' + r.id : '')); continue; }
    const d = { left: r.x, top: r.y, right: st.width - r.x - r.w, bottom: st.height - r.y - r.h };
    for (const [side, v] of Object.entries(d)) if (v < ${MARGIN} - 0.5) edge.push({ what: r.what, id: r.id, side, d: +v.toFixed(1), w: +r.w.toFixed(0), h: +r.h.toFixed(0) });
  }
  return { line: B.S.line && B.S.line.id, scene: B.S.scene, board: board && { ...board, cover: cover(board), off: off(board) }, bubble: bubble && { ...bubble, cover: cover(bubble), off: off(bubble) }, waiting, edge, outside, stage: [st.width, st.height] };
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
    const shot = new Set(); let n = 0, idle = 0, lastT = -1, lastMove = Date.now();
    for (;;) {
      await sleep(60);
      const s = await ev(`(() => { const B = window.__szene.B, L = B.S.line; return { mode: B.S.mode, scene: B.S.scene, n: B.S.scenes.length, id: L && L.id, p: B.progress(), t: B.S.t }; })()`);
      if (!s) continue;
      // a page error can stop the scene clock: give up rather than wait for ever
      if (s.t !== lastT) { lastT = s.t; lastMove = Date.now(); } else if (Date.now() - lastMove > 30000) throw Error("the scene clock stopped for 30 s (a page error?)");
      if (s.scene > A1 || s.mode === "idle") { if (++idle > 5) break; continue; } idle = 0;
      const key = s.scene + ":" + s.id;
      if (s.id && !shot.has(key) && s.p >= AT) {
        shot.add(key); await ev("window.__szene.B.setPaused(true)"); await sleep(250);
        const m = await ev(MEASURE), f = `${String(++n).padStart(3, "0")}-${s.scene}-${s.id}.jpg`;
        const img = await cmd("Page.captureScreenshot", { format: "jpeg", quality: 70 });
        fs.writeFileSync(path.join(out, "frames", f), Buffer.from(img.result.data, "base64"));
        report.push({ file: f, ...m }); await ev("window.__szene.B.setPaused(false)");
        const warn = [m.board && m.board.cover.some((c) => c.face > 0.25) && "board covers a face", m.bubble && m.bubble.cover.some((c) => c.face > 0.25 && c.who !== m.bubbleWho) && "bubble covers a face", m.waiting && `${m.waiting} board steps waiting`, (m.board && m.board.off) && "board off-stage", ...m.edge.map((e) => `edge: ${e.what}${e.id ? " " + e.id : ""} ${e.side} ${e.d}px (${e.w}×${e.h})`)].filter(Boolean);
        console.log(f, warn.join("; "));
      }
    }
    ws.close();
  } finally { chrome.kill(); setTimeout(() => fs.rmSync(dir, { recursive: true, force: true }), 500); }
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 1));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  fs.writeFileSync(path.join(out, "index.html"), `<!doctype html><meta charset="utf-8"><title>Contact sheet</title><style>body{font:13px system-ui;margin:16px;background:#f4efe4}div{display:grid;grid-template-columns:repeat(auto-fill,minmax(${phone ? 180 : 320}px,1fr));gap:10px}figure{margin:0}img{width:100%;border-radius:6px}figcaption{color:#555}b{color:#c0392b}</style><h1>${esc(url)}</h1><div>${report.map((r) => `<figure><img src="frames/${r.file}" loading="lazy"><figcaption>${esc(r.file)} ${r.board && r.board.cover.some((c) => c.face > 0.25) ? "<b>board on a face</b>" : ""} ${r.waiting ? `<b>${r.waiting} waiting</b>` : ""} ${r.edge && r.edge.length ? `<b>edge: ${esc(r.edge.map((e) => e.what + " " + e.side).join(", "))}</b>` : ""}</figcaption></figure>`).join("")}</div>`);
  try { execFileSync("ffmpeg", ["-v", "error", "-y", "-pattern_type", "glob", "-i", path.join(out, "frames", "*.jpg"), "-vf", `scale=${phone ? 200 : 400}:-1,tile=${phone ? 10 : 6}x${Math.ceil(report.length / (phone ? 10 : 6))}`, "-frames:v", "1", path.join(out, "sheet.jpg")]); } catch (e) { console.error("no sheet.jpg (ffmpeg)", e.message.slice(0, 120)); }
  const edges = report.filter((r) => r.edge && r.edge.length), kinds = {};
  for (const r of edges) for (const e of r.edge) kinds[e.what] = (kinds[e.what] || 0) + 1;
  console.log(`edge findings (closer than ${MARGIN} px or off the picture): ${edges.length} of ${report.length} frames` + (edges.length ? " — " + Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(", ") : ""));
  console.log(`${report.length} frames → ${out}`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
