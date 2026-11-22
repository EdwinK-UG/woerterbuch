#!/usr/bin/env node
/* Sharp pictures of a page or of one element, with the installed Google Chrome (headless, no extra packages: the
   DevTools protocol over Node's own WebSocket). Used for the email artwork (assets/mail/).
     node tools/shoot.cjs <url> <out.png> [--size 1280x720] [--el "#stage"] [--ready "window.__shot"] [--scale 2] [--transparent]
   --ready: a JavaScript expression that becomes true when the page is ready (default: fonts loaded + 1.5 s). */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), { spawn } = require("child_process");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const argv = process.argv.slice(2), opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const [url, out] = argv; if (!url || !out) { console.error("usage: shoot <url> <out.png> [--size WxH] [--el selector] [--ready expr] [--scale 2]"); process.exit(1); }
const [W, H] = opt("size", "1280x720").split("x").map(Number), scale = +opt("scale", 2), sel = opt("el", ""), ready = opt("ready", "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shoot-")), port = 9300 + Math.floor(Math.random() * 400);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "--force-color-profile=srgb", "about:blank"], { stdio: "ignore" });
  try {
    let list; for (let i = 0; i < 150 && !(list && list.some((t) => t.type === "page")); i++) { await sleep(200); try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch (e) { /* starting */ } }
    if (!list) throw Error("Chrome did not start");
    const page = list.find((t) => t.type === "page"), ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const wait = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } else if (m.method === "Runtime.exceptionThrown" && argv.includes("--errors")) console.error("page error:", JSON.stringify(m.params.exceptionDetails).slice(0, 400)); };
    const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evaluate = async (expr) => (await cmd("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
    await cmd("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: scale, mobile: W < 600 });
    if (argv.includes("--transparent")) await cmd("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
    await cmd("Page.enable"); await cmd("Runtime.enable"); await cmd("Page.navigate", { url });
    const t0 = Date.now(); let polls = 0;
    for (;;) {
      await sleep(250);
      const ok = await evaluate(ready ? `!!(${ready})` : `document.readyState === 'complete' && (document.fonts ? document.fonts.status === 'loaded' : true)`);
      if (ok) break;
      if (argv.includes("--verbose") && ++polls % 20 === 0) console.error(Math.round((Date.now() - t0) / 1000) + "s", await evaluate(opt("debug", "document.title")));
      if (Date.now() - t0 > +opt("timeout", 90000)) throw Error("page not ready: " + url + " · " + await evaluate(opt("debug", "document.title")));
    }
    await sleep(ready ? 600 : 1500);
    let clip;
    if (sel) { const r = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()`); clip = { x: r[0], y: r[1], width: r[2], height: r[3], scale: 1 }; }
    const shot = await cmd("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}), captureBeyondViewport: false });
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, Buffer.from(shot.result.data, "base64"));
    console.log("saved", out, clip ? `${Math.round(clip.width * scale)}×${Math.round(clip.height * scale)}` : `${W * scale}×${H * scale}`);
    ws.close();
  } finally { chrome.kill(); setTimeout(() => fs.rmSync(dir, { recursive: true, force: true }), 500); }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
