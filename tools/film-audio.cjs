#!/usr/bin/env node
/* Recorded narration for the B2/C1 films ("Animation ansehen"), one audio file per spoken line (cue).

   node tools/film-audio.cjs list [--level B2]          films, their lines and characters, and what is already recorded
   node tools/film-audio.cjs film 147                   record every line of one film
   node tools/film-audio.cjs level B2 --max-chars N     record all films of a level that still need it
   options: --voice ID (default Elisa), --model MODEL (default eleven_multilingual_v2),
            --max-chars N (safety limit per run, default 3000), --fit (level only: record the whole films that fit
            in --max-chars, in lesson order), --dry
   Each clip is sent with the film's neighbouring lines as context (previous_text/next_text, not spoken) and the
   frozen voice settings; the manifest keeps the settings and a SHA-256 of every audio file.

   --dry shows the characters a run WOULD send and calls nothing (no key needed). Unchanged lines are reused: a line
   is recorded again only when its text, voice or model changes. Lessons are read from LESSON_SOURCE_DIR (default
   .local/lessons); audio and manifests go to FILM_AUDIO_DIR (default .local/film-audio/kN/). Both are private and
   must never be committed or published as static files. The API key is read only from ELEVENLABS_API_KEY. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { FORMAT, DEFAULT_MODEL, die, sleep, speak, credits } = require("./elevenlabs.cjs");
const { compile } = require("../grammatik/film.js");

const root = path.resolve(__dirname, "..");
const LESSONS = process.env.LESSON_SOURCE_DIR || path.join(root, ".local/lessons");
const OUT = process.env.FILM_AUDIO_DIR || path.join(root, ".local/film-audio");
const DEFAULT_BUDGET = 3000;
const DEFAULT_VOICE = "Ew9k3hOjG0x2iTWems98";        // Elisa (Voice Library, native German), chosen for the B2/C1 films on 2026-11-08
// Frozen with the approved Elisa pilot. They are part of each clip's hash, so changing them records everything again.
const SETTINGS = { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 1.0 };

const argv = process.argv.slice(2), cmd = argv[0];
const flag = (name, fallback) => { const i = argv.indexOf("--" + name); return i < 0 ? fallback : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true; };
const has = (name) => argv.includes("--" + name);
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 12);

/* ---------- films ---------- */
function loadLesson(file) {
  // Vocabulary lessons need the site's drawing kit and have no film; a grammar lesson that fails to load is reported.
  let found = null; const source = fs.readFileSync(file, "utf8");
  try { vm.runInNewContext(source, { GRAM: { add: (c) => (found = c) } }, { filename: file }); }
  catch (e) { if (/\bfilm\s*:/.test(source)) console.warn("Skipped " + path.basename(file) + ": " + e.message); return null; }
  return found;
}
function films() {
  if (!fs.existsSync(LESSONS)) die("No lessons folder at " + LESSONS + ". Set LESSON_SOURCE_DIR to the released lesson sources.");
  const out = [];
  for (const f of fs.readdirSync(LESSONS).filter((f) => /^k\d+\.js$/.test(f))) {
    const lesson = loadLesson(path.join(LESSONS, f));
    if (lesson && lesson.film) out.push({ n: lesson.n, level: lesson.level, title: lesson.title, cues: compile(lesson.film).cues });
  }
  return out.sort((a, b) => a.n - b.n);
}
const cueFile = (id) => { if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) die("Unexpected cue id " + JSON.stringify(id) + "."); return id + ".mp3"; };

/* MP3 length from its frames (MPEG audio, layer III), so the player can lay out the timeline before a clip loads. */
function mp3Seconds(buf) {
  let i = 0, samples = 0, rate = 0;
  if (buf.slice(0, 3).toString("latin1") === "ID3") i = 10 + ((buf[6] & 127) << 21 | (buf[7] & 127) << 14 | (buf[8] & 127) << 7 | (buf[9] & 127));
  const KBPS = { 1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], 2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160] };
  const RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const ver = (buf[i + 1] >> 3) & 3, layer = (buf[i + 1] >> 1) & 3, br = buf[i + 2] >> 4, sr = (buf[i + 2] >> 2) & 3, pad = (buf[i + 2] >> 1) & 1;
    if (ver === 1 || layer !== 1 || br === 0 || br === 15 || sr === 3) { i++; continue; }
    const hz = RATES[ver][sr], per = ver === 3 ? 1152 : 576, kbps = KBPS[ver === 3 ? 1 : 2][br];
    const len = Math.floor((per / 8) * kbps * 1000 / hz) + pad;
    if (len < 4) { i++; continue; }
    samples += per; rate = hz; i += len;
  }
  return rate ? Math.round((samples / rate) * 1000) / 1000 : 0;
}

/* ---------- manifests ---------- */
const dirOf = (n) => path.join(OUT, "k" + n);
function readManifest(n) {
  try { return JSON.parse(fs.readFileSync(path.join(dirOf(n), "manifest.json"), "utf8")); } catch { return null; }
}
// The neighbouring lines are sent as context but are not part of the hash: editing one line re-records only that line.
const hashOf = (say, voice, model) => sha([say, voice, model, JSON.stringify(SETTINGS)].join("|"));
function plan(film, voice, model) {
  const old = Object.fromEntries(((readManifest(film.n) || {}).cues || []).map((c) => [c.id, c]));
  const todo = film.cues.filter((c) => { const o = old[c.id]; return !(o && o.hash === hashOf(c.say, voice, model) && fs.existsSync(path.join(dirOf(film.n), o.file))); });
  return { old, todo, chars: todo.reduce((a, c) => a + c.say.length, 0) };
}

async function record(film, voice, model) {
  const { old, todo } = plan(film, voice, model), dir = dirOf(film.n);
  fs.mkdirSync(dir, { recursive: true });
  const cues = [];
  const save = () => fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ version: 2, chapter: film.n, level: film.level, title: film.title, voice, model, format: FORMAT, settings: SETTINGS, created: new Date().toISOString(), cues: cues.concat(film.cues.slice(cues.length).map((c) => old[c.id]).filter(Boolean)) }, null, 1));
  for (const [i, c] of film.cues.entries()) {
    if (!todo.includes(c)) { cues.push(old[c.id]); continue; }
    // context from the same film only, so separate clips keep one flow of intonation
    const context = { previous_text: film.cues[i - 1]?.say, next_text: film.cues[i + 1]?.say };
    const { bytes, ext } = await speak(c.say, voice, model, { voice_settings: SETTINGS, ...context });
    if (ext !== "mp3") die("ElevenLabs returned " + ext + " audio instead of MP3; nothing more was recorded.");
    const file = cueFile(c.id), seconds = mp3Seconds(bytes);
    if (!(seconds > 0)) die("Could not read the length of the clip for " + c.id + ".");
    fs.writeFileSync(path.join(dir, file), bytes);
    cues.push({ id: c.id, say: c.say, file, hash: hashOf(c.say, voice, model), seconds, chars: c.say.length,
      audio: crypto.createHash("sha256").update(bytes).digest("hex"), context: { previous: !!context.previous_text, next: !!context.next_text } });
    save(); // after every clip, so an interrupted run loses nothing
    process.stdout.write(`  ${c.id.padEnd(34)} ${seconds.toFixed(1).padStart(5)} s  ${c.say.slice(0, 50)}${c.say.length > 50 ? "…" : ""}\n`);
    await sleep(250);
  }
  save();
}

/* ---------- commands ---------- */
function options() {
  const voice = flag("voice", DEFAULT_VOICE), model = flag("model", DEFAULT_MODEL), budget = +flag("max-chars", DEFAULT_BUDGET);
  if (!voice || voice === true) die("Choose a voice: add --voice VOICE_ID.");
  if (!(budget > 0)) die("--max-chars needs a number.");
  return { voice, model, budget };
}

function cmdList() {
  const level = flag("level", ""), voice = flag("voice", DEFAULT_VOICE), model = flag("model", DEFAULT_MODEL);
  const rows = films().filter((f) => !level || f.level === level);
  let total = 0, missing = 0;
  for (const f of rows) {
    const chars = f.cues.reduce((a, c) => a + c.say.length, 0); total += chars;
    let state = "";
    if (voice && voice !== true) { const p = plan(f, voice, model); missing += p.chars; state = p.todo.length ? `${f.cues.length - p.todo.length}/${f.cues.length} recorded` : "recorded"; }
    console.log(`${f.level}  ${String(f.n).padStart(3)}  ${String(f.cues.length).padStart(2)} lines  ${String(chars).padStart(5)} chars  ${state.padEnd(16)} ${f.title}`);
  }
  console.log(`\n${rows.length} films, ${credits(total)}.` + (voice && voice !== true ? ` Still to record: ${credits(missing)}.` : "") + "\n");
}

async function cmdFilm() {
  const n = +argv[1]; if (!n) die("Usage: node tools/film-audio.cjs film 147 --voice VOICE_ID [--max-chars 3000] [--dry]");
  const { voice, model, budget } = options(), film = films().find((f) => f.n === n);
  if (!film) die("Lesson " + n + " has no film in " + LESSONS + ".");
  const { todo, chars } = plan(film, voice, model);
  console.log(`\n${film.level} ${n} · ${film.title}: ${film.cues.length} lines.\nTo record now: ${todo.length} lines, ${credits(chars)}${todo.length < film.cues.length ? ` (${film.cues.length - todo.length} unchanged lines are reused)` : ""}.`);
  if (has("dry") || !todo.length) return console.log(has("dry") ? "\n--dry: nothing was sent.\n" : "\nNothing to record.\n");
  if (chars > budget) die(`That is more than the safety limit of ${budget.toLocaleString()} characters. Add --max-chars ${chars} if you really want it.`);
  await record(film, voice, model);
  console.log(`\nDone: ${path.relative(root, dirOf(n))}/\n`);
}

async function cmdLevel() {
  const level = argv[1]; if (!["B2", "C1"].includes(level)) die("Usage: node tools/film-audio.cjs level B2 --voice VOICE_ID --max-chars N [--dry]");
  const { voice, model, budget } = options();
  let work = films().filter((f) => f.level === level).map((f) => ({ f, ...plan(f, voice, model) })).filter((w) => w.todo.length);
  let chars = work.reduce((a, w) => a + w.chars, 0);
  console.log(`\n${level}: ${work.length} films still need recording, ${credits(chars)}.`);
  if (chars > budget && has("fit")) {
    // --fit: whole films in lesson order, as many as the limit allows; the rest wait for the next run
    let sum = 0; const fits = [];
    for (const w of work) { if (sum + w.chars > budget) break; sum += w.chars; fits.push(w); }
    const rest = work.slice(fits.length);
    console.log(`--fit: ${fits.length} films (${sum.toLocaleString()} characters) fit in ${budget.toLocaleString()}. Left for later: ${rest.length} films from ${level} ${rest[0].f.n} on, ${rest.reduce((a, w) => a + w.chars, 0).toLocaleString()} characters.`);
    work = fits; chars = sum;
  }
  if (has("dry") || !work.length) return console.log(has("dry") ? "\n--dry: nothing was sent.\n" : "\nNothing to record.\n");
  if (chars > budget) die(`That is more than the safety limit of ${budget.toLocaleString()} characters. Add --max-chars ${chars} if you really want it, or --fit to record only the films that fit.`);
  for (const w of work) { console.log(`\n${level} ${w.f.n} · ${w.f.title}`); await record(w.f, voice, model); }
  console.log(`\nDone: ${work.length} films in ${path.relative(root, OUT)}/\n`);
}

if (require.main === module) {
  (async () => {
    if (cmd === "list") return cmdList();
    if (cmd === "film") return cmdFilm();
    if (cmd === "level") return cmdLevel();
    console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace(/^#!.*\n\/\*\s?/, "").replace(/^ {3}/gm, ""));
  })().catch((e) => die(String(e && e.message || e)));
}
module.exports = { mp3Seconds };
