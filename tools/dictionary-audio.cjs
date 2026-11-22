#!/usr/bin/env node
/* Records German audio for dictionary headwords and example sentences with Azure Speech.

   node tools/dictionary-audio.cjs --dry                 count what is left and what it would cost
   node tools/dictionary-audio.cjs --limit 100           record the next 100 clips
   node tools/dictionary-audio.cjs                       record everything that is missing
   options: --core (★ core entries only), --concurrency 6, --budget 3000000 (characters, across all runs)

   Each clip is named after sha256(VOICE + "\n" + text), so the page can find a clip from the text alone,
   with no manifest. Existing files are skipped, so the run can stop and resume at any point.
   Core entries go first, so a partial run covers the most useful words.
   Single words still prefer Wikimedia Commons recordings on the page; these clips fill the gaps.
   The key is read from .env.azure (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION) and is never printed. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
require(path.join(root, "js/dictionary-english.js"));
const VOICE = "de-DE-SeraphinaMultilingualNeural";
const OUT = process.env.DICTIONARY_AUDIO_DIR || path.join(root, ".local/dictionary-audio");
const CLIPS = path.join(OUT, "v1");
const USAGE = path.join(OUT, "usage.json");
const PRICE_PER_MILLION = 15; // USD, Azure standard neural voices (price list, 2026-11-22)

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = n => argv.includes("--" + n);
const die = m => { console.error("\n" + m + "\n"); process.exit(1); };
const limit = Number(flag("limit", Infinity)), concurrency = Number(flag("concurrency", 6));
const budget = Number(flag("budget", 3000000));

// Same cleanup as plainW() in index.html, so page and tool agree on the text.
const plainW = w => w.replace(/[¹²³⁴⁵⁶⁷⁸⁹]/g, "").replace(/^-|-$/g, "").trim();
const clipName = text => crypto.createHash("sha256").update(VOICE + "\n" + text).digest("hex").slice(0, 32) + ".mp3";
const xml = s => s.replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

function texts() {
  const read = n => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root, n))));
  const core = read("core.bin"), defs = read("defs.bin");
  if (core.e.length !== defs.length) die("Dictionary files do not match.");
  const first = [], rest = [], seen = new Set();
  core.e.forEach((row, i) => {
    const isCore = /class="core"/.test(defs[i][0]);
    if (has("core") && !isCore) return;
    const list = isCore ? first : rest;
    const add = (kind, text) => { if (text && !seen.has(text)) { seen.add(text); list.push({ kind, text }); } };
    add("word", plainW(row[0]));
    for (const item of DictionaryEnglish.source(row[0], defs[i][0])) if (item.kind === "example") add("example", item.text);
  });
  return first.concat(rest);
}

function env() {
  const file = path.join(root, ".env.azure");
  if (!fs.existsSync(file)) die("No .env.azure. Save the Azure Speech key there first.");
  const vars = Object.fromEntries(fs.readFileSync(file, "utf8").split("\n").filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
  if (!/^[A-Za-z0-9]{20,}$/.test(vars.AZURE_SPEECH_KEY || "")) die(".env.azure has no valid AZURE_SPEECH_KEY.");
  if (!/^[a-z0-9]+$/.test(vars.AZURE_SPEECH_REGION || "")) die(".env.azure has no valid AZURE_SPEECH_REGION.");
  return vars;
}

async function record(text, { AZURE_SPEECH_KEY: key, AZURE_SPEECH_REGION: region }) {
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='de-DE'><voice name='${VOICE}'><lang xml:lang='de-DE'>${xml(text)}</lang></voice></speak>`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST", body: ssml, signal: AbortSignal.timeout(60000),
      headers: { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "dictionary-audio" },
    }).catch(error => ({ ok: false, status: 0, error }));
    if (res.ok) {
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length < 1000) throw Error("Suspiciously short audio for: " + text);
      return bytes;
    }
    if (res.status === 401 || res.status === 403) die("Azure refused the key (HTTP " + res.status + ").");
    if (res.status === 400) throw Error("Azure rejected the text (HTTP 400): " + text);
    if (attempt >= 5) throw Error("Gave up after retries (HTTP " + res.status + "): " + text);
    await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
  }
}

(async () => {
  fs.mkdirSync(CLIPS, { recursive: true });
  const all = texts();
  const todo = all.filter(t => !fs.existsSync(path.join(CLIPS, clipName(t.text))));
  const batch = todo.slice(0, limit);
  const chars = batch.reduce((n, t) => n + t.text.length, 0);
  const usage = fs.existsSync(USAGE) ? JSON.parse(fs.readFileSync(USAGE, "utf8")) : { characters: 0 };
  console.log(`${all.length} clips in total, ${all.length - todo.length} already recorded, ${todo.length} missing.`);
  console.log(`This run: ${batch.length} clips, ${chars} characters, about $${(chars / 1e6 * PRICE_PER_MILLION).toFixed(2)}. Used so far: ${usage.characters} characters.`);
  if (has("dry") || !batch.length) return;
  if (usage.characters + chars > budget) die(`That would pass the ${budget}-character budget. Raise it with --budget if intended.`);
  const vars = env();
  let next = 0, done = 0, failed = 0, spent = 0;
  const save = () => fs.writeFileSync(USAGE, JSON.stringify({ characters: usage.characters + spent, voice: VOICE, updated: new Date().toISOString() }, null, 2) + "\n");
  async function worker() {
    while (next < batch.length) {
      const t = batch[next++];
      try {
        const bytes = await record(t.text, vars);
        const file = path.join(CLIPS, clipName(t.text));
        fs.writeFileSync(file + ".part", bytes); fs.renameSync(file + ".part", file);
        done++;
      } catch (error) { failed++; console.warn(error.message); }
      spent += t.text.length; // Azure bills characters sent, even for a failed clip.
      if ((done + failed) % 200 === 0) { save(); console.log(`${done + failed}/${batch.length} …`); }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  save();
  console.log(`Recorded ${done} clips${failed ? `, ${failed} failed (run again to retry)` : ""}. Files in ${path.relative(root, CLIPS)}/`);
})();
