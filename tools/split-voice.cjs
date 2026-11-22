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

function runs(text) {
  const out = []; let m; const re = /\{[a-z]+:([^}]*)\}|([^{]+)/g;
  while ((m = re.exec(text))) {
    const lang = m[1] != null ? "de" : "en", t = m[1] != null ? m[1] : m[2], last = out[out.length - 1];
    if (last && last.lang === lang) last.t += t;
    // text without letters (", ", " – ") is no language of its own: it stays with the run before it
    else if (!/[A-Za-zÄÖÜäöüß]/.test(t) && last) last.t += t;
    else if (last && lang === "de" && !/[A-Za-zÄÖÜäöüß]/.test(last.t) && out.length > 1 && out[out.length - 2].lang === "de") { out.pop(); out[out.length - 1].t += last.t + t; }
    else out.push({ lang, t });
  }
  return out.filter((r) => /[A-Za-zÄÖÜäöüß]/.test(r.t));
}
// one run, spoken alone with its language enforced: no text of the other language as context (it pulls the accent)
async function speakRun(r, voice, settings, file) {
  const { bytes } = await speak(r.t.trim(), voice, SPLIT_MODEL, { voice_settings: settings, language_code: r.lang });
  fs.writeFileSync(file, bytes);
}
// join the parts with a breath of silence
function join(dir, n, file) {
  const gap = path.join(dir, "gap.mp3");
  if (!fs.existsSync(gap)) execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "0.08", "-b:a", "96k", gap]);
  const list = []; for (let i = 0; i < n; i++) { if (i) list.push(gap); list.push(path.join(dir, `p${i}.mp3`)); }
  execFileSync("ffmpeg", ["-v", "error", "-y", ...list.flatMap((f) => ["-i", f]), "-filter_complex", `${list.map((_, i) => `[${i}:a]`).join("")}concat=n=${list.length}:v=0:a=1,aresample=44100`, "-ac", "1", "-b:a", "96k", file]);
}
// the parts are kept beside the clip (<clip>.parts/: runs.json, p0.mp3 …) so one part can be checked and redone
async function splitSpeak(text, voice, settings, file) {
  const rs = runs(text), dir = file + ".parts"; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "runs.json"), JSON.stringify(rs, null, 1));
  for (let i = 0; i < rs.length; i++) await speakRun(rs[i], voice, settings, path.join(dir, `p${i}.mp3`));
  join(dir, rs.length, file);
  return rs.reduce((s, r) => s + r.t.length, 0);
}
async function redoPart(file, i, voice, settings) {
  const dir = file + ".parts", rs = JSON.parse(fs.readFileSync(path.join(dir, "runs.json"), "utf8"));
  await speakRun(rs[i], voice, settings, path.join(dir, `p${i}.mp3`)); join(dir, rs.length, file);
}
module.exports = { runs, splitSpeak, redoPart, SPLIT_MODEL };
if (require.main === module) {
  // node tools/split-voice.cjs redo <scene> <failed.json>: speak again the parts the language check refused
  const [cmd, scene, list] = process.argv.slice(2);
  if (cmd !== "redo") { console.error("usage: redo <scene> <failed.json>"); process.exit(1); }
  const root = path.join(__dirname, "..", ".local", "scenes"), voices = JSON.parse(fs.readFileSync(path.join(root, "voices.json"), "utf8"));
  const S = { stability: 0.55, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 0.95 };
  (async () => { for (const f of JSON.parse(fs.readFileSync(list, "utf8"))) { await redoPart(path.join(root, scene, f.clip), f.part, voices.narrator, S); console.log("redone", f.clip, "part", f.part, f.lang); } })();
}
