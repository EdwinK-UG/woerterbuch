#!/usr/bin/env node
// Builds and checks the PRIVATE visual overlays for the B2/C1 films. Nothing written here is public: the output belongs in the
// protected lesson bundle (tools/build-lesson-bundle.cjs, FILM_VISUAL_DIR) or a local review folder, never in the repository.
//
//   node tools/film-visual.cjs --lessons /ABS/complete-lessons --authoring /ABS/authoring --audit /ABS/audio-audit.json --out /ABS/built
//
// Each authoring module <LEVEL>-<n>.cjs exports (kit) => ({ key, n, examples:[[key, ref, literal]], cues:{cueId:[S(...)]}, checks, scenes }).
// Checks (exit 1 on any problem):
//   - every example reference re-reads the frozen lesson and equals its literal exactly (", joined" / ", excerpt" supported);
//     the overlay keeps only the path, offsets, length and a hash, never the text
//   - every cue named exists in the film; keyframe fractions start at 0, stay in [0,1) and increase
//   - every piece resolves; a row with `ex` renders exactly that example (punctuation included); a row without one must be
//     a dashed rail (unfinished) or a word list, never an invented complete sentence
//   - no narration, timing or quiz payload keys; source quizzes are referenced, not copied
// Audio: verified decoded 48 kHz frame counts and MP3 SHA-256 from the audit are written separately (k<n>.audio.json).
"use strict";
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), crypto = require("node:crypto");
const E = require("../grammatik/film-stage.js"), kit = require("./film-visual-kit.cjs");
require("../grammatik/film-props.js");   // installs picture kinds on the stage (E.KINDS) for validation
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, l) => (v.startsWith("--") ? a.concat([[v.slice(2), l[i + 1] && !l[i + 1].startsWith("--") ? l[i + 1] : true]]) : a), []));
const need = (k) => { if (!args[k] || args[k] === true) { console.error("missing --" + k); process.exit(2); } return path.resolve(args[k]); };
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const FORBIDDEN = new Set(["say", "seconds", "stage", "beats", "examples", "quiz", "from", "to", "variants", "text", "feedback", "takeaway", "options"]);

function loadLesson(dir, n) {
  const bytes = fs.readFileSync(path.join(dir, "k" + n + ".js")); let lesson;
  vm.runInNewContext(new TextDecoder("utf-8", { fatal: true }).decode(bytes), { GRAM: { add: (x) => { lesson = x; } } }, { timeout: 3000 });
  return { lesson, sha256: sha(bytes) };
}
function resolveExample(lesson, ref, literal) {
  const [p, mode] = ref.split(", "), v = E.get(lesson, p);
  let text = mode === "joined" || (mode === "excerpt" && Array.isArray(v)) ? (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x && x.text)).filter((x) => x !== "" && x != null).join(" ") : undefined) : v;
  if (typeof text !== "string") throw Error("not text at " + ref);
  if (mode === "excerpt") { const i = text.indexOf(literal); if (i < 0) throw Error("excerpt not found at " + ref + ": " + literal); return { ref: p, mode: Array.isArray(v) ? "joined" : "exact", span: [i, i + literal.length], len: literal.length, h: E.fnv(literal), text: literal }; }
  if (text !== literal) throw Error("text differs at " + ref + ": " + JSON.stringify(text));
  return { ref: p, mode: mode === "joined" ? "joined" : "exact", len: text.length, h: E.fnv(text), text };
}
const cueIds = (film) => film.scenes.flatMap((s) => s.beats.map((b, i) => ({ id: s.id + "--" + (i + 1), scene: s.id })));

function build(file, lessonsDir, audit) {
  const mod = require(file)(kit), errors = [], warn = [];
  const { lesson, sha256 } = loadLesson(lessonsDir, mod.n);
  if (lesson.n !== mod.n || mod.key !== lesson.level + "-" + lesson.n) errors.push("key/lesson mismatch " + mod.key);
  const refs = {}, src = { examples: {} };
  for (const [key, ref, literal] of mod.examples || []) { try { if (refs[key]) throw Error("duplicate example key " + key); const r = resolveExample(lesson, ref, literal); src.examples[key] = { text: r.text }; delete r.text; refs[key] = r; } catch (e) { errors.push(key + ": " + e.message); } }
  const all = cueIds(lesson.film), known = new Map(all.map((c) => [c.id, c])), scenes = {}; let rowsChecked = 0, keyframes = 0;
  for (const [cue, list] of Object.entries(mod.cues || {})) {
    const c = known.get(cue); if (!c) { errors.push("unknown cue " + cue); continue; }
    let prev = -1; const out = [];
    list.forEach((k, i) => {
      if (!(k.at >= 0 && k.at < 1) || k.at <= prev || (i === 0 && k.at !== 0)) errors.push(cue + ": keyframe fractions must start at 0 and increase within [0,1): " + k.at); prev = k.at;
      const st = Object.assign({}, k); delete st.at;
      for (const r of st.rows || []) {
        const ids = new Set(); for (const t of r.tiles) { if (ids.has(t.id)) errors.push(cue + " row " + r.id + ": duplicate tile " + t.id); ids.add(t.id); for (const p of t.p) try { E.resolve(src, p.x); } catch (e) { errors.push(cue + ": " + e.message); } }
        let txt = null; try { txt = E.rowText(src, r); } catch (e) { /* reported above */ }
        if (r.ex) { const want = (Array.isArray(r.ex) ? r.ex : [r.ex]).map((x) => (src.examples[x] || { text: "\u0000" + x }).text).join(""); rowsChecked++; if (txt !== want) errors.push(cue + " row " + r.id + ' renders "' + txt + '" but must equal "' + want + '"'); }
        else if (!r.rail && !r.list) errors.push(cue + " row " + r.id + " has no source example and is neither a rail nor a list");
      }
      if (st.pic) { for (const it of st.pic.items || []) { if (!E.KINDS.props.includes(it.k)) errors.push(cue + ": unknown picture item " + it.k); if (it.k === "figure" && !E.KINDS.people.includes(it.who)) errors.push(cue + ": unknown person " + it.who); } for (const m of st.pic.marks || []) if (!E.KINDS.marks.includes(m.k)) errors.push(cue + ": unknown picture mark " + m.k); if (!st.pic.alt) errors.push(cue + ": picture needs a text alternative (alt)"); }
      if (st.park && !["within", "into"].includes(st.park.route)) errors.push(cue + ": unknown park route");
      out.push({ at: k.at, s: st }); keyframes++;
    });
    (scenes[c.scene] = scenes[c.scene] || { cues: {} }).cues[cue] = out;
  }
  for (const [sid, extra] of Object.entries(mod.scenes || {})) { if (!lesson.film.scenes.some((s) => s.id === sid)) errors.push("unknown scene " + sid); scenes[sid] = Object.assign(scenes[sid] || { cues: {} }, extra); }
  for (const s of Object.keys(scenes)) { const sc = lesson.film.scenes.find((x) => x.id === s); if (!sc) continue; const n = sc.beats.length, have = Object.keys(scenes[s].cues).length; if (!scenes[s].kind && have !== n) errors.push("scene " + s + " covers " + have + " of " + n + " cues (all or none)"); }
  const checks = {};
  for (const [sid, ch] of Object.entries(mod.checks || {})) {
    const sc = lesson.film.scenes.find((x) => x.id === sid); if (!sc) { errors.push("check for unknown scene " + sid); continue; }
    if (ch.origin === "source-quiz") { if (!sc.quiz) errors.push(sid + ": no source quiz to reference"); checks[sid] = { origin: "source-quiz" }; }
    else if (ch.origin === "authored-visual-diagnostic") { if (!ch.ask || !ch.answer) errors.push(sid + ": authored check needs ask and answer"); checks[sid] = ch; }
    else errors.push(sid + ": unknown check origin " + ch.origin);
  }
  const visual = { schema: "deutschklinik.film-visual/1", key: mod.key, n: mod.n, lessonSHA256: sha256, refs, scenes, checks };
  const walk = (o, p) => { if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (FORBIDDEN.has(k) && !p.startsWith(".refs")) errors.push("forbidden key " + p + "." + k); walk(v, p + "." + k); } }; walk(visual, "");
  const film = audit && audit.films.find((f) => f.key === mod.key), audio = { schema: "deutschklinik.film-audio-timing/1", key: mod.key, sampleRate: 48000, cues: {} };
  if (film && film.status === "verified") for (const c of film.cues) if (c.status === "verified") audio.cues[c.id] = { frames: c.pcmFrames, mp3: c.mp3SHA256 };
  const covered = Object.values(scenes).reduce((a, s) => a + (s.kind ? s.cueCount || 0 : Object.keys(s.cues).length), 0);
  return { visual, audio, errors, warn, stats: { key: mod.key, scenes: lesson.film.scenes.length, cues: all.length, scenesDrawn: Object.keys(scenes).length, cuesDrawn: covered, keyframes, rowsChecked, recorded: Object.keys(audio.cues).length } };
}

if (require.main === module) {
  const lessonsDir = need("lessons"), authoring = need("authoring"), out = need("out"), audit = args.audit ? JSON.parse(fs.readFileSync(path.resolve(args.audit), "utf8")) : null;
  const only = args.only && args.only !== true ? new Set(String(args.only).split(",")) : null;
  const files = fs.readdirSync(authoring).filter((f) => /^(B2|C1)-\d+\.cjs$/.test(f) && (!only || only.has(f.replace(/\.cjs$/, "")))).sort();
  fs.mkdirSync(out, { recursive: true, mode: 0o700 }); let failed = 0; const stats = [];
  for (const f of files) {
    const r = build(path.join(authoring, f), lessonsDir, audit);
    if (r.errors.length) { failed++; console.error(f + ": " + r.errors.length + " problem(s)\n  " + r.errors.slice(0, 30).join("\n  ")); continue; }
    fs.writeFileSync(path.join(out, "k" + r.visual.n + ".visual.json"), JSON.stringify(r.visual) + "\n", { mode: 0o600 });
    fs.writeFileSync(path.join(out, "k" + r.visual.n + ".audio.json"), JSON.stringify(r.audio) + "\n", { mode: 0o600 });
    stats.push(r.stats); console.log(r.stats.key.padEnd(7) + " " + r.stats.cuesDrawn + "/" + r.stats.cues + " cues, " + r.stats.keyframes + " keyframes, " + r.stats.rowsChecked + " complete rows equal their source, " + r.stats.recorded + " recorded cues");
  }
  if (!only) fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(stats, null, 1) + "\n", { mode: 0o600 });
  process.exitCode = failed ? 1 : 0;
}
module.exports = { build, resolveExample, loadLesson, cueIds };
