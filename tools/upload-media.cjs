#!/usr/bin/env node
/* Uploads dictionary audio and pictures to the public R2 bucket behind media.deutschklinik.com.

   node tools/upload-media.cjs --audio        German clips from .local/dictionary-audio/v1 -> audio/v1/<name>.mp3
   node tools/upload-media.cjs --pictures     Gemini pictures -> pics/v1/<name>.webp (640 px WebP) + pics/index.json
   options: --concurrency 12, --dry (list only)

   Uses wrangler's own login (worker/node_modules/.bin/wrangler). Uploaded keys are remembered in
   .local/media-uploaded.txt, so later runs send only new files. Clips and pictures never change under a
   name (audio names are content hashes; a redone picture gets a new name), so they are cached for a year.
   pics/index.json maps each headword to its picture and is cached for an hour, so daily batches appear
   without a site release. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const BUCKET = "deutschklinik-media";
const WRANGLER = path.join(root, "worker/node_modules/.bin/wrangler");
const LEDGER = path.join(root, ".local/media-uploaded.txt");
const AUDIO = path.join(root, ".local/dictionary-audio/v1");
const PICS = path.join(root, ".local/gemini-images");
const WEBP = path.join(PICS, "webp");
const YEAR = "public, max-age=31536000, immutable";

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = n => argv.includes("--" + n);
const die = m => { console.error("\n" + m + "\n"); process.exit(1); };
const concurrency = Number(flag("concurrency", 12));

const uploaded = new Set(fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, "utf8").split("\n").filter(Boolean) : []);

function put(key, file, type, cache) {
  return new Promise(resolve => {
    const child = spawn(WRANGLER, ["r2", "object", "put", `${BUCKET}/${key}`, "--file", file, "--content-type", type, "--cache-control", cache, "--remote"], { cwd: path.join(root, "worker"), stdio: ["ignore", "ignore", "pipe"] });
    let err = ""; child.stderr.on("data", d => { err += d; });
    child.on("close", code => resolve(code === 0 ? "" : (err.trim().split("\n").pop() || "exit " + code)));
  });
}

async function uploadAll(jobs, label) {
  const todo = jobs.filter(j => !uploaded.has(j.key));
  console.log(`${label}: ${jobs.length} files, ${jobs.length - todo.length} already uploaded, ${todo.length} to send.`);
  if (has("dry") || !todo.length) return 0;
  let next = 0, ok = 0, failed = 0;
  async function worker() {
    while (next < todo.length) {
      const j = todo[next++];
      const error = await put(j.key, j.file, j.type, j.cache || YEAR);
      if (error) { failed++; console.warn(`${j.key}: ${error}`); if (/auth|login|token|403|10000/i.test(error) && failed > 5) die("Cloudflare refused the uploads; run `npx wrangler login` in worker/ and try again."); }
      else { ok++; if (!j.always) { uploaded.add(j.key); fs.appendFileSync(LEDGER, j.key + "\n"); } }
      if ((ok + failed) % 500 === 0) console.log(`${label}: ${ok + failed}/${todo.length} …`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`${label}: sent ${ok}${failed ? `, ${failed} failed (run again to retry)` : ""}.`);
  return failed;
}

async function audio() {
  if (!fs.existsSync(AUDIO)) die("No recorded audio in .local/dictionary-audio/v1.");
  // Oldest first: the recorder did the core words first, so they go online first too.
  const jobs = fs.readdirSync(AUDIO).filter(f => /^[0-9a-f]{32}\.mp3$/.test(f))
    .map(f => ({ key: "audio/v1/" + f, file: path.join(AUDIO, f), type: "audio/mpeg", t: fs.statSync(path.join(AUDIO, f)).mtimeMs }))
    .sort((a, b) => a.t - b.t);
  await uploadAll(jobs, "Audio");
}

async function pictures() {
  const made = [];
  for (const dir of ["test", "core-nouns"]) {
    const file = path.join(PICS, dir, "manifest.json");
    if (!fs.existsSync(file)) continue;
    for (const item of JSON.parse(fs.readFileSync(file, "utf8")).items) if (item.made && fs.existsSync(path.join(PICS, dir, item.file))) made.push({ ...item, src: path.join(PICS, dir, item.file) });
  }
  // Shrink to 640 px WebP (about 40-70 KB) with Pillow; originals stay on this Mac.
  fs.mkdirSync(WEBP, { recursive: true });
  const convert = made.filter(m => !fs.existsSync(path.join(WEBP, m.file.replace(/\.[^.]+$/, ".webp"))));
  if (convert.length) {
    const script = "import sys\nfrom PIL import Image\nfor src, dst in zip(sys.argv[1::2], sys.argv[2::2]):\n    im = Image.open(src).convert('RGB'); im.thumbnail((640, 640)); im.save(dst, 'WEBP', quality=80, method=6)\n";
    for (let k = 0; k < convert.length; k += 200) {
      const args = convert.slice(k, k + 200).flatMap(m => [m.src, path.join(WEBP, m.file.replace(/\.[^.]+$/, ".webp"))]);
      const r = spawnSync("python3", ["-I", "-c", script, ...args], { stdio: "inherit" });
      if (r.status !== 0) die("WebP conversion failed (needs python3 with Pillow).");
    }
    console.log(`Converted ${convert.length} pictures to WebP.`);
  }
  const jobs = made.map(m => { const name = m.file.replace(/\.[^.]+$/, ".webp"); return { key: "pics/v1/" + name, file: path.join(WEBP, name), type: "image/webp" }; });
  const failed = await uploadAll(jobs, "Pictures");
  // The index lists only pictures that are actually uploaded.
  const index = {};
  for (const m of made) { const key = "pics/v1/" + m.file.replace(/\.[^.]+$/, ".webp"); if (uploaded.has(key)) index[m.word] = key; }
  const indexFile = path.join(WEBP, "index.json");
  fs.writeFileSync(indexFile, JSON.stringify({ version: 1, pictures: index }) + "\n");
  if (!has("dry")) await uploadAll([{ key: "pics/index.json", file: indexFile, type: "application/json", cache: "public, max-age=3600", always: true }], "Index");
  console.log(`Index lists ${Object.keys(index).length} pictures.${failed ? " Some uploads failed; run again." : ""}`);
}

(async () => {
  if (!fs.existsSync(WRANGLER)) die("wrangler is missing; run npm ci in worker/.");
  if (has("audio")) await audio();
  if (has("pictures")) await pictures();
  if (!has("audio") && !has("pictures")) console.log("Choose --audio and/or --pictures.");
})();
