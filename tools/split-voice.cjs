/* Bilingual narration in one voice, each language spoken natively: a line like
     "The modal verb, {v:will}, sits in position two."
   is cut into English and German runs (German = any {x:…} mark; neighbouring German marks join into one run),
   each run is spoken with the language enforced (eleven_turbo_v2_5 + language_code, with the text around it as
   context for natural intonation), and the runs are joined into one clip. Used by tools/scene-audio.cjs for the
   narrator of the bilingual scenes. */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const { speak } = require("./elevenlabs.cjs");
const SPLIT_MODEL = "eleven_turbo_v2_5";

// base: the language of everything outside the marks (en, or sw / fr for the Swahili and French versions)
function runs(text, base = "en") {
  const out = []; let m; const re = /\{[a-z]+:([^}]*)\}|([^{]+)/g;
  while ((m = re.exec(text))) {
    const lang = m[1] != null ? "de" : base, t = m[1] != null ? m[1] : m[2], last = out[out.length - 1];
    if (last && last.lang === lang) last.t += t;
    // text without letters (", ", " – ") is no language of its own: it stays with the run before it
    else if (!/\p{L}/u.test(t) && last) last.t += t;
    else if (last && lang === "de" && !/\p{L}/u.test(last.t) && out.length > 1 && out[out.length - 2].lang === "de") { out.pop(); out[out.length - 1].t += last.t + t; }
    else out.push({ lang, t });
  }
  return out.filter((r) => /\p{L}/u.test(r.t));
}
// one run, spoken alone with its language enforced: no text of the other language as context (it pulls the accent)
async function speakRun(r, voice, settings, file, model = SPLIT_MODEL) {
  const { bytes } = await speak(r.t.trim(), voice, model, { voice_settings: settings, language_code: r.lang });
  fs.writeFileSync(file, bytes);
}
// join the parts with a breath of silence; duet: two speakers take turns, so a longer pause between them and each
// part brought to the same loudness (two voices from two models are not equally loud)
function join(dir, n, file, duet = false) {
  const gap = path.join(dir, duet ? "gap2.mp3" : "gap.mp3");
  if (!fs.existsSync(gap)) execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", duet ? "0.22" : "0.08", "-b:a", "96k", gap]);
  const list = []; for (let i = 0; i < n; i++) { if (i) list.push(gap); list.push(path.join(dir, `p${i}.mp3`)); }
  const pre = duet ? list.map((f, i) => (f === gap ? `[${i}:a]anull[a${i}]` : `[${i}:a]loudnorm=I=-18:TP=-2:LRA=11,aresample=44100[a${i}]`)).join(";") + ";" : "";
  const ins = list.map((_, i) => (duet ? `[a${i}]` : `[${i}:a]`)).join("");
  execFileSync("ffmpeg", ["-v", "error", "-y", ...list.flatMap((f) => ["-i", f]), "-filter_complex", `${pre}${ins}concat=n=${list.length}:v=0:a=1,aresample=44100`, "-ac", "1", "-b:a", "96k", file]);
}
// the parts are kept beside the clip (<clip>.parts/: runs.json, p0.mp3 …) so one part can be checked and redone
// opts: { base, model } for the Swahili (eleven_v3) and French (eleven_v4) narrators; English keeps SPLIT_MODEL.
// de: { voice, model, settings } – a second voice that speaks the German runs (the Swahili duet), else the narrator does
async function splitSpeak(text, voice, settings, file, { base = "en", model = SPLIT_MODEL, de = null } = {}) {
  const rs = runs(text, base), dir = file + ".parts"; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "runs.json"), JSON.stringify(rs, null, 1));
  for (let i = 0; i < rs.length; i++) { const d = de && rs[i].lang === "de"; await speakRun(rs[i], d ? de.voice : voice, d ? de.settings : settings, path.join(dir, `p${i}.mp3`), d ? de.model : model); }
  join(dir, rs.length, file, !!de);
  return rs.reduce((s, r) => s + r.t.length, 0);
}
async function redoPart(file, i, voice, settings, model = SPLIT_MODEL, de = null) {
  const dir = file + ".parts", rs = JSON.parse(fs.readFileSync(path.join(dir, "runs.json"), "utf8")), d = de && rs[i].lang === "de";
  await speakRun(rs[i], d ? de.voice : voice, d ? de.settings : settings, path.join(dir, `p${i}.mp3`), d ? de.model : model); join(dir, rs.length, file, !!de);
}
// the narrator of each explaining language: its voice in voices.json and its model
// Swahili is a duet: Mohammed (a native Swahili voice that is not made for German) explains, and the German examples
// are spoken by Enniah, the native German voice of the English version. French: one voice verified in both languages,
// on eleven_turbo_v2_5 like English (on eleven_v4 her short German phrases, "den Ball", "du kannst", came out English).
const NARRATOR = { en: { role: "narrator", model: SPLIT_MODEL }, sw: { role: "narrator-sw", model: "eleven_v3", de: { role: "narrator", model: SPLIT_MODEL } }, fr: { role: "narrator-fr", model: SPLIT_MODEL } };
module.exports = { runs, splitSpeak, redoPart, SPLIT_MODEL, NARRATOR };
if (require.main === module) {
  // node tools/split-voice.cjs redo <scene> <failed.json>: speak again the parts the language check refused
  const [cmd, scene, list] = process.argv.slice(2);
  if (cmd !== "redo") { console.error("usage: redo <scene> <failed.json>"); process.exit(1); }
  const root = path.join(__dirname, "..", ".local", "scenes"), voices = JSON.parse(fs.readFileSync(path.join(root, "voices.json"), "utf8"));
  const S = { stability: 0.55, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 0.95 };
  const n = NARRATOR[JSON.parse(fs.readFileSync(path.join(root, scene, "lines.json"), "utf8")).lang || "en"];
  const de = n.de ? { voice: voices[n.de.role], model: n.de.model, settings: S } : null;
  (async () => { for (const f of JSON.parse(fs.readFileSync(list, "utf8"))) { await redoPart(path.join(root, scene, f.clip), f.part, voices[n.role], S, n.model, de); console.log("redone", f.clip, "part", f.part, f.lang); } })();
}
