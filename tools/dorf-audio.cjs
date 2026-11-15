/* Voices for grammatik/dorf ("Im Dorf", A1 · Kapitel 1) with ElevenLabs.
     node tools/dorf-audio.cjs voices                 list the account's voices (name, id, labels) and pick candidates
     node tools/dorf-audio.cjs samples                one short line per role and candidate -> .local/a1k1/samples/
     node tools/dorf-audio.cjs record [--dry]         every line of .local/a1k1/lines.json with the cast's voice
   The key comes only from ELEVENLABS_API_KEY. The lines are private (.local, git-ignored); this file holds none.
   The cast's voices are in .local/a1k1/voices.json: { "liv": "<voice id>", "elisa": "…", … }. A recording is kept
   while its text, voice and settings stay the same (hash in lines.json), so a second run only records what changed. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { call, speak, credits } = require("./elevenlabs.cjs");

const DIR = path.join(__dirname, "..", ".local", "a1k1");
const LINES = path.join(DIR, "lines.json"), VOICES = path.join(DIR, "voices.json"), OUT = path.join(DIR, "audio");
const MODEL = "eleven_multilingual_v2";
// per role: steadier for the narrator, livelier for the children
const SETTINGS = {
  default: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 1 },
  elisa: { stability: 0.55, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 0.95 },
  liv: { stability: 0.4, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true, speed: 1.05 },
};
const spoken = (t) => t.replace(/\*([^*:]+)(?::[^*]+)?\*/g, "$1").replace(/\s+/g, " ").trim();
const read = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);

async function voices() {
  const r = await call("/v1/voices"); const { voices: list } = await r.json();
  return list.map((v) => ({ name: v.name, id: v.voice_id, cat: v.category, labels: v.labels || {}, lang: (v.verified_languages || []).map((l) => l.language).join(",") }));
}
const find = (list, re) => list.filter((v) => re.test(v.name));

async function main() {
  const [cmd = "voices", ...args] = process.argv.slice(2);
  if (cmd === "voices") {
    for (const v of await voices()) console.log([v.name, v.id, v.cat, Object.entries(v.labels).map(([k, x]) => k + "=" + x).join(" "), v.lang].join(" | "));
    return;
  }
  if (cmd === "samples") {
    const list = await voices(), lines = read(LINES).lines, dir = path.join(DIR, "samples"); fs.mkdirSync(dir, { recursive: true });
    const lab = (v) => Object.values(v.labels).join(" ").toLowerCase();
    const pick = {
      liv: [...find(list, /^alice\b/i), ...find(list, /^lucy\b/i)],
      lena: list.filter((v) => /female/.test(lab(v)) && /young/.test(lab(v)) && !/^(alice|lucy)\b/i.test(v.name)).slice(0, 2).concat(find(list, /^petra\b/i)).slice(0, 3),
      opa: list.filter((v) => /\bmale\b/.test(lab(v)) && /old/.test(lab(v))).slice(0, 3),
      huber: list.filter((v) => /female/.test(lab(v)) && /(middle|old)/.test(lab(v)) && !/^(elisa|petra)\b/i.test(v.name)).slice(0, 3),
    };
    const say = { liv: ["l01", "l02"], lena: ["n01"], opa: ["o02"], huber: ["h01"] };
    let chars = 0; const made = [];
    for (const [role, cands] of Object.entries(pick)) {
      for (const v of cands) {
        const text = say[role].map((id) => spoken(lines[id].text)).join(" ");
        const { bytes } = await speak(text, v.id, MODEL, { voice_settings: SETTINGS[role] || SETTINGS.default });
        const f = `${role}-${v.name.split(/[\s-]/)[0].toLowerCase()}.mp3`; fs.writeFileSync(path.join(dir, f), bytes); chars += text.length;
        made.push({ role, file: f, name: v.name, id: v.id, labels: v.labels }); console.log(role, "·", v.name, "→", f);
      }
    }
    fs.writeFileSync(path.join(dir, "samples.json"), JSON.stringify(made, null, 1));
    console.log("used", credits(chars));
    return;
  }
  if (cmd === "record") {
    const dry = args.includes("--dry"), data = read(LINES), cast = read(VOICES, {}); fs.mkdirSync(OUT, { recursive: true });
    let chars = 0, made = 0, kept = 0; const missing = new Set();
    for (const [id, ln] of Object.entries(data.lines)) {
      const roles = ln.who.split("+"), role = roles[0];
      if (role === "lamb" || role === "max") continue;                       // Max: KidVoice; the lamb: a sound in the scene
      const voice = cast[role]; if (!voice) { missing.add(role); continue; }
      const text = spoken(ln.text), set = SETTINGS[role] || SETTINGS.default;
      const hash = crypto.createHash("sha256").update(JSON.stringify([text, voice, MODEL, set, roles])).digest("hex").slice(0, 16);
      const rel = `audio/${id}.mp3`;
      if (ln.hash === hash && ln.audio === rel && fs.existsSync(path.join(DIR, rel))) { kept++; continue; }
      chars += text.length * roles.length; if (dry) { console.log("would record", id, role, text); continue; }
      if (roles.length > 1) {                                                // two people at once: both voices, mixed
        const parts = []; for (const r of roles) { const v = cast[r]; if (!v) { missing.add(r); continue; } parts.push((await speak(text, v, MODEL, { voice_settings: SETTINGS[r] || SETTINGS.default })).bytes); }
        parts.forEach((b, i) => fs.writeFileSync(path.join(OUT, `${id}.part${i}.mp3`), b));
        require("child_process").execFileSync("ffmpeg", ["-v", "error", "-y", ...parts.flatMap((_, i) => ["-i", path.join(OUT, `${id}.part${i}.mp3`)]), "-filter_complex", `amix=inputs=${parts.length}:normalize=0`, "-ar", "44100", "-b:a", "96k", path.join(DIR, rel)]);
        parts.forEach((_, i) => fs.unlinkSync(path.join(OUT, `${id}.part${i}.mp3`)));
      } else fs.writeFileSync(path.join(DIR, rel), (await speak(text, voice, MODEL, { voice_settings: set })).bytes);
      ln.audio = rel; ln.hash = hash; made++; console.log("recorded", id, role);
      fs.writeFileSync(LINES, JSON.stringify(data, null, 1));                 // after every line, so a stop loses nothing
    }
    if (missing.size) console.log("no voice chosen yet for:", [...missing].join(", "), "(set it in .local/a1k1/voices.json)");
    console.log(`${dry ? "would record" : "recorded"} ${dry ? "" : made + " lines, "}kept ${kept}; ${credits(chars)}`);
    return;
  }
  if (cmd === "library") {          // read only: German voices from the Voice Library and their free preview clips
    const [gender = "male", age = "old"] = args, dir = path.join(DIR, "library"); fs.mkdirSync(dir, { recursive: true });
    const r = await call(`/v1/shared-voices?page_size=12&language=de&gender=${gender}&age=${age}`); const { voices: list } = await r.json();
    const out = [];
    for (const v of list) {
      const f = `${gender}-${age}-${v.name.split(/[\s-]/)[0].toLowerCase().replace(/[^a-z0-9]/g, "")}.mp3`;
      if (v.preview_url) { const a = await fetch(v.preview_url); if (a.ok) fs.writeFileSync(path.join(dir, f), Buffer.from(await a.arrayBuffer())); }
      out.push({ name: v.name, id: v.voice_id, owner: v.public_owner_id, accent: v.accent, age: v.age, desc: (v.description || "").slice(0, 120), file: f, uses: v.cloned_by_count });
      console.log([v.name, v.accent, v.age, v.cloned_by_count, f].join(" | "));
    }
    fs.writeFileSync(path.join(dir, `${gender}-${age}.json`), JSON.stringify(out, null, 1));
    return;
  }
  if (cmd === "add") {              // add a Voice Library voice (from a library search) to the account and give it a role
    const [file, name, role] = args, list = read(path.join(DIR, "library", file), []), v = list.find((x) => x.name.startsWith(name));
    if (!v) { console.error("not found:", name); process.exit(1); }
    const r = await call(`/v1/voices/add/${v.owner}/${v.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_name: v.name.split(" - ")[0] }) });
    const { voice_id } = await r.json(); const cast = read(VOICES, {}); cast[role] = voice_id; fs.writeFileSync(VOICES, JSON.stringify(cast, null, 1));
    console.log("added", v.name, "as", role); return;
  }
  if (cmd === "pack") {             // the upload folder for tools/upload-film-audio.cjs (FILM_AUDIO_DIR=.local/a1k1/upload --only 1)
    // Lines, who speaks them and the practice travel through the private film-audio route of chapter 1: each cue's id
    // is "dorf|<line>|<who>", its say the line's text; the practice is one cue with its JSON as say. Lines without a
    // usable recording point at a short silent clip and are shown with reading time. --no-max leaves out Max's
    // KidVoice clips (free plan = no commercial use).
    const data = read(LINES), dir = path.join(DIR, "upload", "k1"), noMax = args.includes("--no-max"); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const { execFileSync } = require("child_process"), sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
    const secs = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
    const silent = path.join(dir, "silent.mp3"); execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.1", "-b:a", "48k", silent]);
    const cue = (id, say, src) => { const f = path.basename(src), a = sha(src); if (src !== path.join(dir, f)) fs.copyFileSync(src, path.join(dir, f)); return { id, say, seconds: src === silent ? 0 : Math.round(secs(src) * 100) / 100, file: f, audio: a }; };
    const cues = [];
    for (const [id, ln] of Object.entries(data.lines)) {
      const src = ln.audio && fs.existsSync(path.join(DIR, ln.audio)) && !(noMax && ln.who === "max") ? path.join(DIR, ln.audio) : silent;
      cues.push(cue(`dorf|${id}|${ln.who}`, ln.text, src));
    }
    cues.push(cue("dorf|practice|-", JSON.stringify(data.practice), silent));
    fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ version: 2, chapter: 1, level: "A1", title: "Im Dorf", voice: "cast", model: MODEL, cues }, null, 1));
    console.log(`packed ${cues.length} cues (${cues.filter((c) => c.seconds).length} with sound) into .local/a1k1/upload/k1`); return;
  }
  console.error("usage: voices | samples | record [--dry] | library [gender] [age] | add <library.json> <name> <role> | pack [--no-max]"); process.exit(1);
}
main();
