#!/usr/bin/env node
/* Uploads the recorded film narration (tools/film-audio.cjs) to the private R2 bucket the Worker reads.

   node tools/upload-film-audio.cjs --dry                         what would be uploaded
   node tools/upload-film-audio.cjs --local                       into wrangler's local storage, for `wrangler dev`
   node tools/upload-film-audio.cjs --remote                      into the real bucket (needs a wrangler login)
   options: --bucket NAME (default deutschklinik-film-audio), --only 487 (one film), --config FILE (wrangler config)

   Each clip is stored once under kN/<sha256 of the audio>.mp3, so a re-recorded line never overwrites an old one.
   kN/manifest.json lists the film's lines and is written after its clips, so it never points at a missing file.
   Only clips whose file still matches its recorded fingerprint are included. Recordings come from FILM_AUDIO_DIR
   (default .local/film-audio-final). Uploaded keys are remembered per bucket, so a later run sends only new files. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const SRC = process.env.FILM_AUDIO_DIR || path.join(root, ".local/film-audio-final");
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes("--" + n);
const die = (m) => { console.error("\n" + m + "\n"); process.exit(1); };
const BUCKET = flag("bucket", "deutschklinik-film-audio"), only = flag("only", "");
if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(BUCKET)) die("Unexpected bucket name.");
const where = has("remote") ? "remote" : has("local") ? "local" : has("dry") ? "dry" : die("Choose --dry, --local or --remote.");

function films() {
  if (!fs.existsSync(SRC)) die("No recordings at " + SRC + ".");
  const out = [];
  for (const d of fs.readdirSync(SRC).filter((d) => /^k\d+$/.test(d)).sort((a, b) => a.slice(1) - b.slice(1))) {
    if (only && d !== "k" + Number(only)) continue;
    const m = JSON.parse(fs.readFileSync(path.join(SRC, d, "manifest.json"), "utf8"));
    if (m.version !== 2) { console.warn(`Skipped ${d}: made with an older recording tool.`); continue; }
    const cues = [];
    for (const c of m.cues) {
      const file = path.join(SRC, d, c.file);
      const ok = fs.existsSync(file) && crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") === c.audio;
      if (!ok) { console.warn(`Skipped ${d}/${c.id}: the audio file no longer matches its recording.`); continue; }
      cues.push({ id: c.id, say: c.say, seconds: c.seconds, key: `${d}/${c.audio}.mp3`, file });
    }
    out.push({ dir: d, manifest: { version: 1, chapter: m.chapter, level: m.level, title: m.title, voice: m.voice, model: m.model, cues: cues.map(({ file, ...c }) => c) }, cues });
  }
  return out;
}

function wrangler(args) {
  const config = flag("config", "");                 // e.g. a local test config for `wrangler dev`
  const r = spawnSync("npx", ["--no-install", "wrangler", ...args, "--" + where, ...(config ? ["--config", path.resolve(config)] : [])], { cwd: path.join(root, "worker"), encoding: "utf8" });
  if (r.status !== 0) die("wrangler failed:\n" + (r.stderr || r.stdout).split("\n").slice(-15).join("\n"));
}

const list = films(), doneFile = path.join(SRC, `uploaded-${BUCKET}-${where}.json`);
const done = new Set(where === "dry" ? [] : (() => { try { return JSON.parse(fs.readFileSync(doneFile, "utf8")); } catch { return []; } })());
const clips = list.flatMap((f) => f.cues).filter((c) => !done.has(c.key));
const bytes = clips.reduce((a, c) => a + fs.statSync(c.file).size, 0);
console.log(`\n${list.length} films, ${list.reduce((a, f) => a + f.cues.length, 0)} clips. To upload to ${BUCKET} (${where}): ${clips.length} clips, ${(bytes / 1e6).toFixed(1)} MB, then ${list.length} film lists.`);
if (where === "dry") process.exit(0);

const tmp = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "film-upload-"));
try {
  for (let i = 0; i < clips.length; i += 200) {
    const batch = clips.slice(i, i + 200), pairs = path.join(tmp, "clips.json");
    fs.writeFileSync(pairs, JSON.stringify(batch.map((c) => ({ key: c.key, file: c.file }))));
    wrangler(["r2", "bulk", "put", BUCKET, "--filename", pairs, "--ct", "audio/mpeg", "--cc", "private, max-age=31536000, immutable", "--concurrency", "8"]);
    batch.forEach((c) => done.add(c.key));
    fs.writeFileSync(doneFile, JSON.stringify([...done]));
    console.log(`  clips ${Math.min(i + 200, clips.length)}/${clips.length}`);
  }
  const lists = list.map((f) => { const file = path.join(tmp, f.dir + ".json"); fs.writeFileSync(file, JSON.stringify(f.manifest)); return { key: f.dir + "/manifest.json", file }; });
  fs.writeFileSync(path.join(tmp, "lists.json"), JSON.stringify(lists));
  wrangler(["r2", "bulk", "put", BUCKET, "--filename", path.join(tmp, "lists.json"), "--ct", "application/json", "--cc", "no-store", "--concurrency", "8"]);
  console.log(`  film lists ${lists.length}/${lists.length}\n\nDone.\n`);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
