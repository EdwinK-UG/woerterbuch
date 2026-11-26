/* Voices for the animated grammar scenes on the shared stage (grammatik/buehne/, plan docs/grammar-animation-plan.md),
   with ElevenLabs. One private folder per chapter: .local/scenes/<scene>/lines.json (e.g. k05). The cast's voices are
   shared by every chapter in .local/scenes/voices.json: { "elisa": "<voice id>", "liv": "…", "anton": "…", … }.
     node tools/scene-audio.cjs voices                          list the account's voices (name, id, labels)
     node tools/scene-audio.cjs library <gender> <age>          German Voice Library voices + preview clips (read only)
     node tools/scene-audio.cjs add <gender-age.json> <name> <role>   add a library voice to the account for a role
     node tools/scene-audio.cjs samples <role> <id…>            one line of a scene in several candidate voices
     node tools/scene-audio.cjs scout [role…]                    Voice Library candidates for roles without a voice (free)
     node tools/scene-audio.cjs audition                         render .local/scenes/audition.json + a listening page
     node tools/scene-audio.cjs cast <role> <voice id>           give a role its voice
     node tools/scene-audio.cjs record <scene> [--dry]          record every line that changed (hash of text, voice, settings);
                                                               .local/scenes/<scene>/voices.json overrides the shared cast
     node tools/scene-audio.cjs pack <scene>                    the upload folder for tools/upload-film-audio.cjs
   The key comes only from ELEVENLABS_API_KEY. This file holds no lesson text.
   Children (Max, Mia, Finn): ElevenLabs does not allow child voices; their lines are skipped until a voice is chosen
   (plan §4), and the scene shows them with reading time. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto"), { execFileSync } = require("child_process");
const { call, speak, credits } = require("./elevenlabs.cjs");
const { splitSpeak, runs, SPLIT_MODEL, NARRATOR } = require("./split-voice.cjs");
const { isAzure, speakAzure } = require("./azure-tts.cjs");
// the bilingual narrator speaks English with German woven in: each language is recorded natively, then joined
const SPLIT = new Set(["narrator"]);

const ROOT = path.join(__dirname, "..", ".local", "scenes"), VOICES = path.join(ROOT, "voices.json");
const MODEL = "eleven_multilingual_v2";
const SETTINGS = {
  default: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 1 },
  elisa: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: 1.0 },   // the German narrator: Otto since 24 Nov 2026 (lighter, natural pace; .local/scenes/audition/narrator-2026-11.md)
  liv: { stability: 0.4, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true, speed: 1.05 },
  // the ElevenLabs settings of the non-German narrators. Since 25 Nov 2026 English (Katja) and French (Florian) are Azure
  // voices (voices.json "azure:…", tools/azure-tts.cjs: no settings, default rate); these apply to Swahili (Mohammed)
  narrator: { stability: 0.55, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 1.0 },
  anton: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: 0.95 },  // Christian Plasa, a little slower
  finn: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true, speed: 1.0 },     // the quieter boy
  kid: { stability: 0.38, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true, speed: 1.06 },   // Max, Mia, Finn: lively
};
// whom to look for in the Voice Library, per role still without a voice (plan §1.3). ElevenLabs has no child voices:
// the children are young adult voices, played livelier (like Liv's Lucy).
const SCOUT = {
  anton: { gender: "male", ages: ["middle_aged"] },            // Meister Anton, the carpenter: warm, calm, a little rough
  adler: { gender: "female", ages: ["middle_aged", "old"] },   // Frau Adler, the mayor: clear, friendly, formal (Sie)
  max: { gender: "male", ages: ["young"] },                    // Max, the cheeky village boy
  finn: { gender: "male", ages: ["young"] },                   // Finn, a quieter boy
  mia: { gender: "female", ages: ["young"] },                  // Mia, Liv's little friend
};
const KIDS = new Set(["max", "mia", "finn"]);
// A short character line ("Super!", "Genau!", "Hm?") gives the multilingual model too little to tell the language by,
// and it reads words both languages share the English way. So these are spoken with German enforced.
const SHORT_MODEL = "eleven_turbo_v2_5";
const isShort = (ln) => !ln.who.includes("+") && !SPLIT.has(ln.who) && spoken(ln.text).split(/\s+/).filter((w) => /[A-Za-zÄÖÜäöüß]/.test(w)).length <= 3;
// what a recording depends on: a line is recorded again when this changes
// lang: the scene's explaining language (lines.json `lang`; en when absent): the narrator's model depends on it;
// deVoice: the second voice of a duet (Swahili), which speaks the German runs
const hashOf = (ln, cast, lang = "en", deVoice = null) => { const roles = ln.who.split("+"), split = roles.length === 1 && SPLIT.has(roles[0]);
  return crypto.createHash("sha256").update(JSON.stringify([split ? ln.text : spoken(ln.text), roles.map((r) => cast[r]).concat(split && deVoice ? ["de:" + deVoice] : []), split ? (NARRATOR[lang] || NARRATOR.en).model : isShort(ln) ? SHORT_MODEL + ":de" : MODEL, roles.map((r) => SETTINGS[r] || SETTINGS.default)])).digest("hex").slice(0, 16); };
const spoken = (t) => t.replace(/\{[a-z]+:([^}]*)\}/g, "$1").replace(/\s+/g, " ").trim();
const read = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const sceneDir = (s) => { if (!/^[a-z0-9-]+$/.test(s || "")) { console.error("scene name like k05"); process.exit(1); } return path.join(ROOT, s); };

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "voices") {
    const { voices } = await (await call("/v1/voices")).json();
    for (const v of voices) console.log([v.name, v.voice_id, v.category, Object.entries(v.labels || {}).map(([k, x]) => k + "=" + x).join(" ")].join(" | "));
    return;
  }
  if (cmd === "library") {
    const [gender = "male", age = "middle_aged"] = args, dir = path.join(ROOT, "library"); fs.mkdirSync(dir, { recursive: true });
    const { voices } = await (await call(`/v1/shared-voices?page_size=12&language=de&gender=${gender}&age=${age}`)).json();
    const out = [];
    for (const v of voices) {
      const f = `${gender}-${age}-${v.name.split(/[\s-]/)[0].toLowerCase().replace(/[^a-z0-9]/g, "")}.mp3`;
      if (v.preview_url) { const a = await fetch(v.preview_url); if (a.ok) fs.writeFileSync(path.join(dir, f), Buffer.from(await a.arrayBuffer())); }
      out.push({ name: v.name, id: v.voice_id, owner: v.public_owner_id, accent: v.accent, age: v.age, desc: (v.description || "").slice(0, 120), file: f, uses: v.cloned_by_count });
      console.log([v.name, v.accent, v.age, v.cloned_by_count, f].join(" | "));
    }
    fs.writeFileSync(path.join(dir, `${gender}-${age}.json`), JSON.stringify(out, null, 1));
    console.log("previews in .local/scenes/library/"); return;
  }
  if (cmd === "add") {
    const [file, name, role] = args, list = read(path.join(ROOT, "library", file), []), v = list.find((x) => x.name.startsWith(name || "\0"));
    if (!v || !role) { console.error("usage: add <gender-age.json> <name> <role>"); process.exit(1); }
    const r = await call(`/v1/voices/add/${v.owner}/${v.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_name: v.name.split(" - ")[0] }) });
    const { voice_id } = await r.json(); const cast = read(VOICES, {}); cast[role] = voice_id; fs.writeFileSync(VOICES, JSON.stringify(cast, null, 1));
    console.log("added", v.name, "as", role); return;
  }
  if (cmd === "samples") {            // samples <role> <voice id…>: the role's first two lines of any scene, once per voice
    const [role, ...ids] = args; const dir = path.join(ROOT, "samples"); fs.mkdirSync(dir, { recursive: true });
    const lines = fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, "lines.json"))).flatMap((d) => Object.values(read(path.join(ROOT, d, "lines.json")).lines)).filter((l) => l.who === role).slice(0, 2);
    if (!lines.length || !ids.length) { console.error("usage: samples <role> <voice id…> (the role needs lines in a scene)"); process.exit(1); }
    const text = lines.map((l) => spoken(l.text)).join(" ");
    for (const id of ids) { const { bytes } = await speak(text, id, MODEL, { voice_settings: SETTINGS[role] || SETTINGS.default }); fs.writeFileSync(path.join(dir, `${role}-${id}.mp3`), bytes); console.log("sample", role, id); }
    console.log("used", credits(text.length * ids.length)); return;
  }
  if (cmd === "scout") {
    // scout [role…]: German Voice Library voices that could play each role still without a voice, most used first,
    // with their free preview clips in .local/scenes/scout/ (read only: no credits, nothing added to the account)
    const want = args.length ? args : Object.keys(SCOUT), cast = read(VOICES, {}), taken = new Set(Object.values(cast)), dir = path.join(ROOT, "scout");
    fs.mkdirSync(dir, { recursive: true });
    for (const role of want) {
      const q = SCOUT[role]; if (!q) { console.error("no search for", role); continue; }
      const seen = new Map();
      for (const age of q.ages) for (const sort of ["cloned_by_count", "usage_character_count_1y"]) {
        let r; try { r = await call(`/v1/shared-voices?page_size=40&language=de&gender=${q.gender}&age=${age}&sort=${sort}`, {}, true); } catch (e) { continue; }
        for (const v of (await r.json()).voices || []) if (!taken.has(v.voice_id) && !seen.has(v.voice_id)) seen.set(v.voice_id, v);
      }
      const list = [...seen.values()].map((v) => ({ role, name: v.name, id: v.voice_id, owner: v.public_owner_id, age: v.age, accent: v.accent, locale: v.locale || (v.verified_languages || []).filter((l) => l.language === "de").map((l) => l.locale || l.accent).join(","),
        use: v.use_case, desc: (v.description || "").replace(/\s+/g, " ").slice(0, 200), descriptive: v.descriptive, category: v.category, uses: v.cloned_by_count || 0, chars1y: v.usage_character_count_1y || 0, notice: v.notice_period || 0, free: v.free_users_allowed, preview: v.preview_url }))
        .sort((a, b) => b.chars1y - a.chars1y || b.uses - a.uses).slice(0, 18);
      for (const v of list) {
        v.file = `${role}-${v.id}.mp3`;
        if (v.preview && !fs.existsSync(path.join(dir, v.file))) { try { const a = await fetch(v.preview); if (a.ok) fs.writeFileSync(path.join(dir, v.file), Buffer.from(await a.arrayBuffer())); else v.file = null; } catch (e) { v.file = null; } }
      }
      fs.writeFileSync(path.join(dir, `${role}.json`), JSON.stringify(list, null, 1));
      console.log(`\n== ${role} (${q.gender}, ${q.ages.join("/")}): ${list.length} voices`);
      for (const v of list) console.log([v.name.slice(0, 40), v.age, v.accent, v.use, v.descriptive, `${v.uses} clones`, `${Math.round(v.chars1y / 1000)}k chars/yr`].join(" | "));
    }
    return;
  }
  if (cmd === "audition") {
    // audition: .local/scenes/audition.json { role: { text, ids: [voice id…] } } → each role's text in each voice, and a
    // listening page .local/scenes/audition/index.html (with the library preview clips next to them)
    const plan = read(path.join(ROOT, "audition.json")), dir = path.join(ROOT, "audition"); fs.mkdirSync(dir, { recursive: true });
    if (!plan) { console.error("no .local/scenes/audition.json"); process.exit(1); }
    let chars = 0; const page = [];
    for (const [role, { text, ids, note }] of Object.entries(plan)) {
      const info = new Map(read(path.join(ROOT, "scout", `${role}.json`), []).map((v) => [v.id, v])), rows = [];
      for (const id of ids) {
        const f = `${role}-${id}.mp3`, set = SETTINGS[role] || (KIDS.has(role) ? SETTINGS.kid : SETTINGS.default);
        if (!fs.existsSync(path.join(dir, f))) { fs.writeFileSync(path.join(dir, f), (await speak(text, id, MODEL, { voice_settings: set })).bytes); chars += text.length; console.log("sample", role, (info.get(id) || {}).name || id); }
        rows.push({ id, f, v: info.get(id) || { name: id } });
      }
      page.push({ role, text, note, rows });
    }
    const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stimmen-Casting</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:20px auto;padding:0 16px;background:#f4efe4;color:#2a2f3a}h2{margin:28px 0 4px}.t{color:#6b7482;margin:0 0 10px}
.v{background:#fffcf6;border:1px solid #e6dccb;border-radius:12px;padding:10px 12px;margin:8px 0}.v b{font-size:16px}.m{color:#6b7482;font-size:13px;margin:2px 0 6px}.a{display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:13px}audio{height:34px}code{font-size:12px;background:#eee;padding:1px 4px;border-radius:4px}</style>
<h1>Stimmen-Casting</h1><p class="t">Each voice reads the role's line (left) – the right player is the voice's own library preview. To choose one: <code>node tools/scene-audio.cjs cast &lt;role&gt; &lt;id&gt;</code></p>
${page.map((p) => `<h2>${esc(p.role)}</h2><p class="t">${esc(p.note || "")} „${esc(p.text)}“</p>${p.rows.map((r, i) => `<div class="v"><b>${i + 1}. ${esc(r.v.name)}</b><div class="m">${esc([r.v.age, r.v.accent, r.v.use, r.v.descriptive].filter(Boolean).join(" · "))}${r.v.desc ? " — " + esc(r.v.desc) : ""}</div>
<div class="a">Rolle <audio controls preload="none" src="${r.f}"></audio>${r.v.file ? `Vorschau <audio controls preload="none" src="../scout/${r.v.file}"></audio>` : ""}<code>${esc(r.id)}</code></div></div>`).join("")}`).join("")}`);
    console.log("listening page: .local/scenes/audition/index.html; used", credits(chars)); return;
  }
  if (cmd === "cast") {            // cast <role> <voice id>: the role's voice for every scene
    const [role, id] = args; if (!role || !/^([A-Za-z0-9]{10,40}|azure:[A-Za-z]{2}-[A-Za-z]{2}-[A-Za-z]+Neural(:tagged)?)$/.test(id || "")) { console.error("usage: cast <role> <ElevenLabs voice id | azure:<voice>[:tagged]>"); process.exit(1); }
    const cast = read(VOICES, {}); cast[role] = id; fs.writeFileSync(VOICES, JSON.stringify(cast, null, 1)); console.log(role, "→", id); return;
  }
  if (cmd === "record") {
    // a scene's own voices.json (e.g. the B2–C1 films: Azure voices for every role) overrides the shared cast
    const dir = sceneDir(args[0]), LINES = path.join(dir, "lines.json"), dry = args.includes("--dry"), data = read(LINES), cast = { ...read(VOICES, {}), ...read(path.join(dir, "voices.json"), {}) };
    if (!data) { console.error("no", LINES); process.exit(1); }
    // the Swahili and French versions: their own narrator (voices.json narrator-sw / narrator-fr) and model
    const lang = data.lang || "en", nar = NARRATOR[lang] || NARRATOR.en, deVoice = nar.de ? cast[nar.de.role] : null;
    const de = nar.de ? { voice: deVoice, model: nar.de.model, settings: SETTINGS.narrator } : null;
    if (lang !== "en") cast.narrator = cast[nar.role];
    fs.mkdirSync(path.join(dir, "audio"), { recursive: true });
    let chars = 0, made = 0, kept = 0; const missing = new Set();
    for (const [id, ln] of Object.entries(data.lines)) {
      const roles = ln.who.split("+");
      if (roles.some((r) => KIDS.has(r) && !cast[r])) { missing.add(roles.filter((r) => KIDS.has(r)).join("+")); continue; }
      if (roles.some((r) => !cast[r])) { roles.filter((r) => !cast[r]).forEach((r) => missing.add(r)); continue; }
      const split = roles.length === 1 && SPLIT.has(roles[0]), text = spoken(ln.text), hash = hashOf(ln, cast, lang, deVoice);
      const rel = `audio/${id}.mp3`;
      if (ln.hash === hash && ln.audio === rel && fs.existsSync(path.join(dir, rel))) { kept++; continue; }
      chars += text.length * roles.length; if (dry) { console.log("would record", id, ln.who, text); continue; }
      if (roles.length > 1) {         // two people at once: both voices, mixed
        const parts = [];
        for (const [i, r] of roles.entries()) { const f = path.join(dir, "audio", `${id}.part${i}.mp3`); fs.writeFileSync(f, (await speak(text, cast[r], MODEL, { voice_settings: SETTINGS[r] || SETTINGS.default })).bytes); parts.push(f); }
        execFileSync("ffmpeg", ["-v", "error", "-y", ...parts.flatMap((f) => ["-i", f]), "-filter_complex", `amix=inputs=${parts.length}:normalize=0`, "-ar", "44100", "-b:a", "96k", path.join(dir, rel)]);
        parts.forEach((f) => fs.unlinkSync(f));
      } else if (split && isAzure(cast[roles[0]])) await speakAzure(runs(ln.text, lang), cast[roles[0]], path.join(dir, rel), lang);   // one request per line
      else if (!split && isAzure(cast[roles[0]])) await speakAzure([{ lang: "de", t: text }], cast[roles[0]], path.join(dir, rel), "de");   // one German voice, one request
      else if (split) await splitSpeak(ln.text, cast[roles[0]], SETTINGS[roles[0]], path.join(dir, rel), { base: lang, model: nar.model, de });
      else fs.writeFileSync(path.join(dir, rel), (await speak(text, cast[roles[0]], isShort(ln) ? SHORT_MODEL : MODEL, { voice_settings: SETTINGS[roles[0]] || (KIDS.has(roles[0]) ? SETTINGS.kid : SETTINGS.default), ...(isShort(ln) ? { language_code: "de" } : {}) })).bytes);
      ln.audio = rel; ln.hash = hash; made++; console.log("recorded", id, ln.who);
      fs.writeFileSync(LINES, JSON.stringify(data, null, 1));          // after every line, so a stop loses nothing
    }
    if (missing.size) console.log("no voice yet for:", [...missing].join(", "), "(set it in .local/scenes/voices.json; their lines play with reading time)");
    console.log(`${dry ? "would record" : `recorded ${made} lines,`} kept ${kept}; ${credits(chars)}`);
    return;
  }
  if (cmd === "pack") {
    // Each line travels as one cue "<scene>|<line>|<who>" (say = its text, plus its clip); everything else the scene
    // needs (strips, signs, cards, practice …) is one cue "<scene>|data|-" with JSON as say and a silent clip.
    // pack k05 k05-en: one chapter's scenes (both languages) into one narration list, as the Worker keeps one per chapter
    const scenes = args.filter((a) => !a.startsWith("--")), first = read(path.join(sceneDir(scenes[0]), "lines.json"));
    const scene = scenes[0], dir = sceneDir(scene), data = first, out = path.join(dir, "upload", "k" + Number(data.chapter));   // the Worker's folder: k<chapter>
    fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
    const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
    const secs = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
    const silent = path.join(out, "silent.mp3"); execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.1", "-b:a", "48k", silent]);
    // files from several scenes meet in one folder: name each after its cue (k05-en|e01 → k05-en-e01.mp3), so none overwrites another
    const cue = (id, say, src) => { const f = src === silent ? "silent.mp3" : id.split("|").slice(0, 2).join("-").replace(/[^\w-]/g, "_") + ".mp3"; if (src !== path.join(out, f)) fs.copyFileSync(src, path.join(out, f)); return { id, say, seconds: src === silent ? 0 : Math.round(secs(src) * 100) / 100, file: f, audio: sha(src) }; };
    const cues = [];
    for (const sc of scenes) {
      const sdir = sceneDir(sc), sdata = read(path.join(sdir, "lines.json"));
      if (Number(sdata.chapter) !== Number(data.chapter)) { console.error(sc, "belongs to another chapter"); process.exit(1); }
      for (const [id, ln] of Object.entries(sdata.lines)) cues.push(cue(`${sc}|${id}|${ln.who}`, ln.text, ln.audio && fs.existsSync(path.join(sdir, ln.audio)) ? path.join(sdir, ln.audio) : silent));
      const { lines, chapter, level, title, ...rest } = sdata;
      const glosses = Object.fromEntries(Object.entries(lines).filter(([, l]) => l.gloss || l.en).map(([k, l]) => [k, l.gloss || l.en]));   // the glosses (English, Swahili, French) travel with the data
      cues.push(cue(`${sc}|data|-`, JSON.stringify(Object.keys(glosses).length ? { ...rest, glosses } : rest), silent));
    }
    fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({ version: 2, chapter: data.chapter, level: data.level, title: data.title, voice: "cast", model: MODEL, cues }, null, 1));
    console.log(`packed ${cues.length} cues (${cues.filter((c) => c.seconds).length} with sound) into ${path.relative(process.cwd(), out)}`); return;
  }
  console.error("usage: voices | scout [role…] | audition | cast <role> <id> | library <gender> <age> | add <file> <name> <role> | samples <role> <id…> | record <scene> [--dry] | pack <scene>"); process.exit(1);
}
if (require.main === module) main();
module.exports = { SETTINGS, KIDS, spoken, isShort, hashOf };
