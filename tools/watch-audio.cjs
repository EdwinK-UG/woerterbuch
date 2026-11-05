#!/usr/bin/env node
/* Voice test and audio generation for the "Video ansehen" explainers (ElevenLabs).

   node tools/watch-audio.cjs voices                      list the voices your account can use
   node tools/watch-audio.cjs library [--free] [--gender female] [--search text] [--language de]
                                                          browse the public Voice Library (German by default); previews cost nothing
   node tools/watch-audio.cjs models                      list the speech models
   node tools/watch-audio.cjs sample [--voices a,b,c]     one short German sample per voice, to compare by ear
   node tools/watch-audio.cjs chapter 12 --voice ID       audio for every narrated step of a lesson
   add --dry to any generating command: shows the characters it WOULD send and calls nothing (no key needed)

   The API key is read only from the environment (ELEVENLABS_API_KEY). It is never printed, saved or put on the
   command line. Audio goes to .local/watch-audio/ (not committed). Audio made on a free ElevenLabs plan is for
   testing only: it has no commercial license, so regenerate it on a paid plan before publishing. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const BASE = (process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io").replace(/\/$/, "");
const OUT = process.env.WATCH_AUDIO_DIR || path.join(root, ".local/watch-audio");
const LESSONS = process.env.LESSON_SOURCE_DIR || path.join(root, ".local/lessons");
const FORMAT = "mp3_44100_96";                       // speech does not need more; 192 needs a higher plan
const DEFAULT_MODEL = "eleven_multilingual_v2";
const DEFAULT_BUDGET = 2500;                         // characters per run; protects a 10,000-credit free trial
// Node 18 prints a warning for the built-in fetch; hide only that one
const emit = process.emitWarning;
process.emitWarning = (w, ...rest) => (/Fetch API/.test(String(w)) ? undefined : emit.call(process, w, ...rest));
const { script, stats } = require("../grammatik/watch.js");

/* ---------- small helpers ---------- */
const argv = process.argv.slice(2), cmd = argv[0];
const flag = (name, fallback) => { const i = argv.indexOf("--" + name); return i < 0 ? fallback : argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true; };
const has = (name) => argv.includes("--" + name);
const die = (msg) => { console.error("\n" + msg + "\n"); process.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 12);

function apiKey() {
  const key = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!key) die("No API key found. In your own terminal run:\n  read -rs \"ELEVENLABS_API_KEY?Paste key (hidden): \" && export ELEVENLABS_API_KEY\nthen run this command again in the same terminal window.");
  return key;
}

async function call(pathAndQuery, init = {}, soft = false) {
  const bail = (msg) => { if (soft) throw new Error(msg); die(msg); };
  const url = BASE + pathAndQuery;
  for (let attempt = 1; ; attempt++) {
    let response;
    try { response = await fetch(url, { ...init, headers: { "xi-api-key": apiKey(), ...(init.headers || {}) } }); }
    catch (e) { if (attempt < 3) { await sleep(1500 * attempt); continue; } bail("Could not reach " + BASE + " (" + (e.cause && e.cause.code || e.message) + "). Check the internet connection."); }
    if (response.ok) return response;
    const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
    const lacks = response.status === 401 && /missing_permissions[\s\S]*?permission ([a-z_]+)|permission ([a-z_]+) to execute/i.exec(detail);
    if (lacks) bail("The key works, but it is limited and lacks the permission \"" + (lacks[1] || lacks[2]) + "\".\nIn ElevenLabs open the API key's settings and allow: Text to Speech (access), Voices (read) and Models (read), then run this again.\n" + detail);
    if (response.status === 401) bail("ElevenLabs rejected the API key (401). Check that you pasted the full key and that the trial is active.\n" + detail);
    if (response.status === 429 && attempt < 4) { const wait = Math.min(30, +response.headers.get("retry-after") || 4 * attempt); console.log(`  busy (429) – waiting ${wait}s …`); await sleep(wait * 1000); continue; }
    if (response.status >= 500 && attempt < 3) { await sleep(2000 * attempt); continue; }
    if (/paid_plan_required|library voices/i.test(detail)) bail("This voice comes from the Voice Library, and free plans cannot use those through the API.\nUse one of the premade voices (node tools/watch-audio.cjs voices lists them, e.g. Lily) for testing, or upgrade the plan to use a library voice.\n" + detail);
    if (response.status === 402 || /quota|credit|limit/i.test(detail)) bail("ElevenLabs says the credits or plan do not allow this (" + response.status + "). A free plan cannot use every voice or model.\n" + detail);
    bail(`ElevenLabs returned ${response.status} for ${pathAndQuery.split("?")[0]}.\n${detail}`);
  }
}

/* ---------- lessons → narration ---------- */
function loadLesson(n) {
  const file = path.join(LESSONS, "k" + n + ".js");
  if (!fs.existsSync(file)) die("Lesson " + n + " not found in " + LESSONS + ".");
  let found = null;
  vm.runInNewContext(fs.readFileSync(file, "utf8"), { GRAM: { add: (c) => (found = c) } }, { filename: file });
  if (!found) die("Lesson file " + file + " did not define a lesson.");
  return found;
}
const steps = (n) => script(loadLesson(n)).flatMap((scene, si) => scene.steps.map((st, ti) => ({ scene: si, step: ti, label: scene.label, say: st.say })));

/* ---------- ElevenLabs ---------- */
async function listVoices(soft = false) {
  const out = []; let token = "";
  for (let page = 0; page < 5; page++) {
    const r = await (await call("/v2/voices?page_size=100" + (token ? "&next_page_token=" + encodeURIComponent(token) : ""), {}, soft)).json();
    out.push(...(r.voices || [])); if (!r.has_more || !r.next_page_token) break; token = r.next_page_token;
  }
  return out;
}
const isGerman = (v) => (v.verified_languages || []).some((l) => /^(de|german|deutsch)/i.test(l.language || l.locale || ""));
async function speak(text, voiceId, model) {
  const response = await call(`/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${FORMAT}`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify({ text, model_id: model }),
  });
  const type = response.headers.get("content-type") || "";
  return { bytes: Buffer.from(await response.arrayBuffer()), ext: /wav/i.test(type) ? "wav" : "mp3" };
}
const credits = (chars) => `${chars.toLocaleString()} characters (about ${chars.toLocaleString()} credits on the multilingual model)`;

/* ---------- commands ---------- */
async function cmdVoices() {
  const voices = await listVoices();
  if (!voices.length) die("The account returned no voices.");
  const rows = voices.map((v) => ({ name: v.name, id: v.voice_id, kind: v.category || "", german: isGerman(v) ? "yes" : "", labels: Object.values(v.labels || {}).join(", ") }));
  rows.sort((a, b) => (b.german ? 1 : 0) - (a.german ? 1 : 0) || a.name.localeCompare(b.name));
  console.log(`\n${rows.length} voices. "german = yes" means ElevenLabs lists German as verified for that voice (the multilingual model can still read German with other voices).\n`);
  for (const r of rows) console.log(`${r.name.padEnd(22)} ${r.id}  ${r.kind.padEnd(9)} ${r.german ? "german" : "      "}  ${r.labels}`);
  console.log("\nNext: node tools/watch-audio.cjs sample --voices ID1,ID2,ID3\n");
}

/* The Voice Library holds community voices, including native German speakers. Listing it and playing its preview
   links costs no credits. A voice has to be added to "My voices" (website button) before it can be used here. */
async function cmdLibrary() {
  const q = new URLSearchParams({ page_size: String(+flag("count", 30) || 30), language: String(flag("language", "de")), sort: String(flag("sort", "usage_character_count_1y")) });
  for (const k of ["gender", "age", "accent", "category", "use_cases", "search"]) { const v = flag(k, ""); if (v && v !== true) q.set(k, v); }
  const r = await (await call("/v1/shared-voices?" + q)).json();
  const all = r.voices || [], list = has("free") ? all.filter((v) => v.free_users_allowed && !(v.rate > 1)) : all;
  if (!list.length) die(all.length ? "None of the " + all.length + " voices is open to free plans. Run again without --free." : "The Voice Library returned no voices for these filters.");
  console.log(`\n${list.length} of ${r.total_count || all.length} Voice Library voices (language ${q.get("language")}${has("free") ? ", free plans only" : ""}). "free = no" voices need a paid plan.\n`);
  for (const v of list) {
    const traits = [v.accent, v.gender, v.age, v.use_case, v.descriptive].filter(Boolean).join(", ");
    console.log(`${String(v.name).slice(0, 34).padEnd(35)} ${v.voice_id}  free = ${v.free_users_allowed && !(v.rate > 1) ? "yes" : "no "}  ${traits}`);
    if (v.preview_url) console.log(`    listen (no credits): ${v.preview_url}`);
  }
  console.log("\nTo use one: open it in the Voice Library on the ElevenLabs website, choose \"Add to my voices\", then run: node tools/watch-audio.cjs voices\n");
}

async function cmdModels() {
  const models = await (await call("/v1/models")).json();
  console.log("");
  for (const m of models.filter((x) => x.can_do_text_to_speech)) console.log(`${String(m.model_id).padEnd(28)} ${m.name || ""}`);
  console.log("");
}

async function cmdSample() {
  const model = flag("model", DEFAULT_MODEL), text = steps(12).filter((s) => (s.scene === 0 && s.step === 0) || (s.scene === 1 && s.step === 0)).map((s) => s.say).join(" ");
  let chosen = String(flag("voices", "")).split(",").map((s) => s.trim()).filter(Boolean).map((id) => ({ voice_id: id, name: id.slice(0, 6) }));
  if (has("dry") && !chosen.length) chosen = [{ voice_id: "voice-1", name: "voice-1" }, { voice_id: "voice-2", name: "voice-2" }, { voice_id: "voice-3", name: "voice-3" }];
  if (!chosen.length) { const all = await listVoices(); chosen = [...all.filter(isGerman), ...all.filter((v) => !isGerman(v))].slice(0, 3); }
  console.log(`\nSample text (${text.length} characters): "${text}"\n${chosen.length} voices × ${credits(text.length)} = ${credits(text.length * chosen.length)}`);
  if (has("dry")) return console.log("\n--dry: nothing was sent.\n");
  fs.mkdirSync(path.join(OUT, "samples"), { recursive: true });
  const names = Object.fromEntries((await listVoices(true).catch(() => [])).map((v) => [v.voice_id, v.name]));
  for (const v of chosen) {
    const label = names[v.voice_id] || v.name, { bytes, ext } = await speak(text, v.voice_id, model);
    const file = path.join(OUT, "samples", `${slug(label)}-${slug(model)}.${ext}`); fs.writeFileSync(file, bytes);
    console.log(`  ${label.padEnd(20)} → ${path.relative(root, file)} (${(bytes.length / 1024).toFixed(0)} KB)`); await sleep(300);
  }
  console.log("\nListen to the files (open .local/watch-audio/samples) and tell me which voice you like.\n");
}

async function cmdChapter() {
  const n = +argv[1]; if (!n) die("Usage: node tools/watch-audio.cjs chapter 12 --voice VOICE_ID [--model MODEL] [--max-chars 2500] [--dry]");
  const voice = flag("voice", has("dry") ? "dry-run" : ""), model = flag("model", DEFAULT_MODEL), budget = +flag("max-chars", DEFAULT_BUDGET);
  if (!voice || voice === true) die("Choose a voice: add --voice VOICE_ID (see: node tools/watch-audio.cjs voices).");
  const all = steps(n), dir = path.join(OUT, "k" + n), manifestFile = path.join(dir, "manifest.json");
  let old = {}; try { old = Object.fromEntries(JSON.parse(fs.readFileSync(manifestFile, "utf8")).steps.map((s) => [s.scene + "-" + s.step, s])); } catch (e) { /* first run */ }
  const key = (s) => sha([s.say, voice, model].join("|"));
  const todo = all.filter((s) => { const o = old[s.scene + "-" + s.step]; return !(o && o.hash === key(s) && fs.existsSync(path.join(dir, o.file))); });
  const chars = todo.reduce((a, s) => a + s.say.length, 0);
  console.log(`\nLesson ${n}: ${all.length} narrated steps, ${stats(script(loadLesson(n))).minutes} min.\nTo generate now: ${todo.length} steps, ${credits(chars)}${todo.length < all.length ? ` (${all.length - todo.length} unchanged steps are reused)` : ""}.`);
  if (has("dry")) return console.log("\n--dry: nothing was sent.\n");
  if (chars > budget) die(`That is more than the safety limit of ${budget.toLocaleString()} characters. Add --max-chars ${chars} if you really want it.`);
  fs.mkdirSync(dir, { recursive: true });
  const done = [];
  for (const s of all) {
    const id = s.scene + "-" + s.step, o = old[id];
    if (!todo.includes(s)) { done.push(o); continue; }
    const { bytes, ext } = await speak(s.say, voice, model), file = `s${s.scene}-${s.step}.${ext}`;
    fs.writeFileSync(path.join(dir, file), bytes);
    done.push({ scene: s.scene, step: s.step, say: s.say, file, hash: key(s), chars: s.say.length });
    process.stdout.write(`  ${id.padEnd(5)} ${file} (${(bytes.length / 1024).toFixed(0)} KB)  ${s.say.slice(0, 50)}${s.say.length > 50 ? "…" : ""}\n`); await sleep(250);
  }
  fs.writeFileSync(manifestFile, JSON.stringify({ chapter: n, voice, model, format: FORMAT, created: new Date().toISOString(), steps: done }, null, 1));
  console.log(`\nDone: ${path.relative(root, dir)}/. Play it with the animation: http://localhost:8765/prototypes/watch/preview.html\n`);
}

(async () => {
  if (cmd === "voices") return cmdVoices();
  if (cmd === "library") return cmdLibrary();
  if (cmd === "models") return cmdModels();
  if (cmd === "sample") return cmdSample();
  if (cmd === "chapter") return cmdChapter();
  console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace(/^#!.*\n\/\*\s?/, "").replace(/^ {3}/gm, ""));
})().catch((e) => die(String(e && e.message || e).replace(/xi-api-key[^\s]*/gi, "[key]")));
