#!/usr/bin/env node
/* Makes dictionary pictures with the Gemini web app (your Google AI Pro allowance), at a calm, human pace.

   node tools/gemini-images.cjs --open                                  open the Gemini Chrome window (sign in once)
   node tools/gemini-images.cjs --probe                                 report what the script sees on the page
   node tools/gemini-images.cjs --run --manifest .local/gemini-images/test/manifest.json --limit 10

   The window is ordinary Google Chrome with its own profile (.local/gemini-images/chrome-profile), opened with a
   local-only debugging port so the script can type prompts and save pictures. You sign in yourself; the script
   never handles passwords. Each manifest item gets its file (named after the word and sense) next to the manifest,
   and the manifest records when it was made. The run stops at once on a usage-limit message, a CAPTCHA or an
   "unusual traffic" page, and leaves those for you; it never tries to get around them.
   Needs playwright-core in .local/gemini-images (npm install there). */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const BASE = path.join(root, ".local/gemini-images");
const PROFILE = path.join(BASE, "chrome-profile");
const PORT = 9333;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const GEMINI = "https://gemini.google.com/app";

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = n => argv.includes("--" + n);
const die = m => { console.error("\n" + m + "\n"); process.exit(1); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const between = (a, b) => a + Math.random() * (b - a);

function playwright() {
  try { return require(path.join(BASE, "node_modules/playwright-core")); }
  catch { die("playwright-core is missing. Run: cd .local/gemini-images && npm install playwright-core@1.57.0"); }
}

async function running() {
  try { return (await fetch(`http://127.0.0.1:${PORT}/json/version`, { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; }
}

async function open() {
  if (await running()) return console.log("The Gemini window is already open.");
  fs.mkdirSync(PROFILE, { recursive: true });
  spawn(CHROME, [`--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`, "--no-first-run", "--no-default-browser-check", GEMINI], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 20 && !(await running()); i++) await sleep(500);
  console.log((await running()) ? "Opened. Sign in to Google in that window if asked." : "Chrome did not open its debugging port.");
}

async function connect() {
  if (!(await running())) die("The Gemini window is not open. Run with --open first.");
  const browser = await playwright().chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().startsWith("https://gemini.google.com"));
  if (!page) { page = await context.newPage(); await page.goto(GEMINI); }
  return { browser, context, page };
}

// Things that must stop the run and go to a person.
async function blocked(page) {
  const text = (await page.locator("body").innerText().catch(() => "")).slice(0, 20000);
  if (/unusual traffic|not a robot|captcha/i.test(text) || await page.locator('iframe[src*="recaptcha"]').count()) return "a CAPTCHA or unusual-traffic check";
  if (/(reached|hit) your (daily )?(limit|image limit)|limit resets|try again (tomorrow|later)/i.test(text)) return "the Gemini usage limit";
  if (/accounts\.google\.com/.test(page.url()) || /\bSign in\b/.test(text) && !(await page.locator('[contenteditable="true"]').count())) return "a signed-out window";
  return "";
}

async function probe() {
  const { browser, page } = await connect();
  await page.bringToFront();
  console.log("URL:", page.url());
  console.log("Stop reason, if any:", (await blocked(page)) || "none");
  console.log("Editable prompt boxes:", await page.locator('[contenteditable="true"]').count());
  const labels = await page.locator("button[aria-label]").evaluateAll(b => b.map(x => x.getAttribute("aria-label")).filter(Boolean));
  console.log("Buttons:", [...new Set(labels)].slice(0, 60).join(" | "));
  await page.screenshot({ path: path.join(BASE, "probe.png") });
  console.log("Screenshot: .local/gemini-images/probe.png");
  await browser.close(); // disconnects only; the window stays open
}

async function generate(page, prompt, file) {
  await page.goto(GEMINI, { waitUntil: "domcontentloaded" });
  const box = page.locator('rich-textarea [contenteditable="true"], [contenteditable="true"][role="textbox"]').first();
  await box.waitFor({ timeout: 30000 });
  const before = await page.locator("generated-image img, single-image img").count();
  await box.click();
  await page.keyboard.type(prompt, { delay: between(8, 20) });
  await sleep(between(600, 1500));
  await page.keyboard.press("Enter");
  // Wait for a new generated picture, checking for limits or checks along the way.
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    const stop = await blocked(page);
    if (stop) return { stop };
    if (await page.locator("generated-image img, single-image img").count() > before) break;
    await sleep(3000);
  }
  const img = page.locator("generated-image img, single-image img").last();
  if (!(await img.count())) return { error: "no picture appeared within 4 minutes" };
  await img.waitFor({ state: "visible", timeout: 60000 });
  await sleep(2500);
  // Prefer Gemini's own full-size download; fall back to the shown picture.
  await img.hover().catch(() => {});
  const download = page.locator('button[aria-label*="Download" i]').last();
  if (await download.count()) {
    try {
      const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), download.click()]);
      await dl.saveAs(file);
      return { ok: true, via: "download" };
    } catch { /* fall through to the shown picture */ }
  }
  const src = await img.getAttribute("src");
  if (!src) return { error: "the picture had no address" };
  const bytes = await page.evaluate(async u => { const r = await fetch(u); return Array.from(new Uint8Array(await r.arrayBuffer())); }, src);
  fs.writeFileSync(file, Buffer.from(bytes));
  return { ok: true, via: "shown picture" };
}

async function run() {
  const manifestPath = path.resolve(flag("manifest", path.join(BASE, "test/manifest.json")));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const dir = path.dirname(manifestPath), limit = Number(flag("limit", 10));
  const todo = manifest.items.filter(x => !x.made).slice(0, limit);
  console.log(`${new Date().toISOString()} ${todo.length} pictures to make.`);
  if (!todo.length) return;
  // One run at a time (a daily run must not overlap a run started by hand).
  const lock = path.join(BASE, "run.lock");
  try { fs.writeFileSync(lock, String(process.pid), { flag: "wx" }); }
  catch { const pid = Number(fs.readFileSync(lock, "utf8")); try { process.kill(pid, 0); return console.log(`Another run (pid ${pid}) is still going.`); } catch { fs.writeFileSync(lock, String(process.pid)); } }
  process.on("exit", () => { try { if (fs.readFileSync(lock, "utf8") === String(process.pid)) fs.unlinkSync(lock); } catch {} });
  if (!(await running())) { await open(); await sleep(15000); }
  const { browser, page } = await connect();
  await page.bringToFront();
  let made = 0;
  for (const item of todo) {
    item.prompt = item.scene
      ? `Create an image. ${item.scene}. ${manifest.style}`
      : `Create an image that helps a German learner understand the noun "${[item.article, item.word.replace(/[¹²³⁴⁵⁶⁷⁸⁹]/g, "")].filter(Boolean).join(" ")}" in this meaning: "${item.meaning}". ` +
        `German explanation: "${item.definition}".` + (item.example ? ` Example sentence: "${item.example}" (${item.exampleEn}).` : "") +
        ` Show one clear, everyday scene in which this meaning is instantly recognisable. ${manifest.style}`;
    const result = await generate(page, item.prompt, path.join(dir, item.file));
    if (result.stop) { console.log(`Stopped: ${result.stop}. Nothing more is attempted; please look at the window.`); break; }
    if (result.error) { console.log(`${item.word}: ${result.error}`); item.error = result.error; }
    else {
      // Name the file after what Gemini actually delivered (usually JPEG).
      const saved = path.join(dir, item.file), head = fs.readFileSync(saved).subarray(0, 12);
      const ext = head[0] === 0xff && head[1] === 0xd8 ? ".jpg" : head[0] === 0x89 && head[1] === 0x50 ? ".png" : head.subarray(8, 12).toString() === "WEBP" ? ".webp" : path.extname(item.file);
      if (ext !== path.extname(item.file)) { const renamed = item.file.replace(/\.[^.]+$/, ext); fs.renameSync(saved, path.join(dir, renamed)); item.file = renamed; }
      item.made = new Date().toISOString(); item.via = result.via; delete item.error; made++; console.log(`${item.word}: saved ${item.file}`);
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    if (item !== todo[todo.length - 1]) await sleep(between(45000, 90000)); // a calm, human pace
  }
  console.log(`Made ${made} pictures.`);
  await browser.close();
}

// Builds the prompt list for the ★ core nouns: one picture for each noun's first meaning.
function plan() {
  const zlib = require("node:zlib"), crypto = require("node:crypto");
  require(path.join(root, "js/dictionary-english.js"));
  const read = n => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, n))));
  const core = read("core.bin"), defs = read("defs.bin");
  const reviewed = require(path.join(root, "content/dictionary-english.json"));
  const shard = id => { const f = path.join(root, "content/english", id + ".json"); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {}; };
  const shards = {};
  const test = JSON.parse(fs.readFileSync(path.join(BASE, "test/manifest.json"), "utf8"));
  const done = new Set(test.items.map(x => x.word));
  const ascii = w => w.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss")
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹]/g, c => String("¹²³⁴⁵⁶⁷⁸⁹".indexOf(c) + 1)).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const items = [], names = new Set();
  core.e.forEach((row, i) => {
    const word = row[0], definition = defs[i][0];
    if (row[3] !== "n" || !/class="core"/.test(definition) || done.has(word)) return;
    const src = DictionaryEnglish.source(word, definition), meaning = src.find(x => x.key === "s0");
    if (!meaning) return;
    const hash = crypto.createHash("sha256").update(JSON.stringify([word, definition])).digest("hex");
    const en = reviewed[hash] || (shards[hash.slice(0, 2)] ||= shard(hash.slice(0, 2)))[hash] || [];
    const enOf = key => (en.find(x => x.key === key) || {}).en || "";
    let file = ascii(word) + "-s0.jpg"; for (let n = 2; names.has(file); n++) file = ascii(word) + "-" + n + "-s0.jpg";
    names.add(file);
    const example = src.find(x => x.key === "e0:0");
    items.push({ file, word, article: row[2] || "", sense: "s0", hash, meaning: enOf("s0") || meaning.text, definition: meaning.text, example: example?.text || "", exampleEn: enOf("e0:0") });
  });
  const out = path.join(BASE, "core-nouns/manifest.json");
  if (fs.existsSync(out)) die("core-nouns/manifest.json already exists; delete it first to rebuild (made pictures are recorded in it).");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ style: test.style, items }, null, 2) + "\n");
  console.log(`Planned ${items.length} core-noun pictures in .local/gemini-images/core-nouns/manifest.json.`);
}

(async () => {
  if (has("plan")) return plan();
  if (has("open")) return open();
  if (has("probe")) return probe();
  if (has("run")) return run();
  console.log("Choose --open, --probe or --run.");
})();
