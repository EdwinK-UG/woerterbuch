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
  const exp = require(file), errors = [], warn = [];
  const n0 = typeof exp === "function" ? exp(kit).n : exp.n, { lesson, sha256 } = loadLesson(lessonsDir, n0);
  const mod = typeof exp === "function" ? exp(kit, lesson) : Object.assign({ n: exp.n, key: exp.key, wordRoles: exp.wordRoles }, exp.build(kit, lesson));
  if (exp.decorate) exp.decorate(mod, kit, lesson);
  if (lesson.n !== mod.n || mod.key !== lesson.level + "-" + lesson.n) errors.push("key/lesson mismatch " + mod.key);
  const refs = {}, src = { examples: {} };
  for (const [key, ref, literal] of mod.examples || []) { try { if (refs[key]) throw Error("duplicate example key " + key); const r = resolveExample(lesson, ref, literal); src.examples[key] = { text: r.text }; delete r.text; refs[key] = r; } catch (e) { errors.push(key + ": " + e.message); } }
  const rowSplits = new WeakMap();
  const all = cueIds(lesson.film), known = new Map(all.map((c) => [c.id, c])), scenes = {}; let rowsChecked = 0, keyframes = 0;
  for (const [cue, list] of Object.entries(mod.cues || {})) {
    const c = known.get(cue); if (!c) { errors.push("unknown cue " + cue); continue; }
    let prev = -1; const out = [];
    list.forEach((k, i) => {
      if (!(k.at >= 0 && k.at < 1) || k.at <= prev || (i === 0 && k.at !== 0)) errors.push(cue + ": keyframe fractions must start at 0 and increase within [0,1): " + k.at); prev = k.at;
      const st = Object.assign({}, k); delete st.at;
      for (const r of st.rows || []) {
        const ids = new Set(); for (const t of r.tiles) { if (ids.has(t.id)) errors.push(cue + " row " + r.id + ": duplicate tile " + t.id); ids.add(t.id); for (const p of t.p) try { E.resolve(src, p.x); } catch (e) { errors.push(cue + ": " + e.message); } }
        // A source constituent can be an entire clause. Only explicit word annotations may split its grammar roles.
        const splitEnds = rowSplits.get(r) || new Map(); rowSplits.set(r,splitEnds);
        r.tiles = r.tiles.flatMap(t => {
          let text; try { text = E.rowText(src, { tiles: [t] }); } catch { return [t]; } const roles = (mod.wordRoles || {})[text];
          if (roles?.onlyRole && roles.onlyRole !== t.r) return [t];
          if (!roles) { if (t.r === "fin" && /\s/.test(text)) errors.push(cue + ": finite marking spans multiple words: " + text); return [t]; }
          if(t.p.length>1)splitEnds.set(t.id,t.id+"w"+(t.p.length-1));
          return t.p.map((p, i) => { const tile = { ...t, id: i ? t.id + "w" + i : t.id, p: [p], r: roles[i] || "plain", f: t.p.length === 1 ? t.f : undefined, box: false, l: roles[i] === "fin" ? t.l : undefined };
            if (t.N) tile.N = t.N + "." + i; if (t.n) tile.n = t.n + "." + i; return tile; });
        });
        for(const b of st.br||[])if(b.t[0]===r.id){const last=b.t[2]||b.t[1];if(splitEnds.has(last)){b.t[2]=splitEnds.get(last);}}
        let txt = null; try { txt = E.rowText(src, r); } catch (e) { /* reported above */ }
        if (r.ex) { const want = (Array.isArray(r.ex) ? r.ex : [r.ex]).map((x) => (src.examples[x] || { text: "\u0000" + x }).text).join(""); rowsChecked++; if (txt !== want) errors.push(cue + " row " + r.id + ' renders "' + txt + '" but must equal "' + want + '"'); }
        else if (!r.rail && !r.list) errors.push(cue + " row " + r.id + " has no source example and is neither a rail nor a list");
      }
      if (st.pic) { for (const it of st.pic.items || []) { if (!E.KINDS.props.includes(it.k)) errors.push(cue + ": unknown picture item " + it.k); if (it.k === "figure" && !E.KINDS.people.includes(it.who)) errors.push(cue + ": unknown person " + it.who); } for (const m of st.pic.marks || []) if (!E.KINDS.marks.includes(m.k)) errors.push(cue + ": unknown picture mark " + m.k); if (!st.pic.alt) errors.push(cue + ": picture needs a text alternative (alt)"); }
      if (st.park && !["within", "into"].includes(st.park.route)) errors.push(cue + ": unknown park route");
      { const has = (r, t) => (st.rows || []).some((row) => row.id === r && row.tiles.some((x) => x.id === t || (x.p || []).some((p) => p.id === t)));   // every bracket, arrow, chip and boundary must point at something drawn
        for (const b of st.br || []) for (const t of b.t.slice(1)) if (!has(b.t[0], t)) errors.push(cue + ": bracket points at missing " + b.t[0] + "/" + t);
        for (const a of st.ar || []) for (const e of [a.a, a.b]) if (!has(e[0], e[1])) errors.push(cue + ": arrow end missing " + e.join("/"));
        for (const c of st.ch || []) if (c.at && !has(c.at[0], c.at[1])) errors.push(cue + ": chip anchor missing " + c.at.join("/"));
        for (const d of st.bd || []) if (!has(d[0], d[1])) errors.push(cue + ": boundary anchor missing " + d[0] + "/" + d[1]);
        if (st.tl) { const ids = new Set((st.tl.pts || []).map((q) => q.id)); for (const sp of st.tl.sp || []) { if (sp.a && !ids.has(sp.a)) errors.push(cue + ": timeline span start missing " + sp.a); if (!ids.has(sp.b) && sp.x1 == null) errors.push(cue + ": timeline span end missing " + sp.b); } for (const ar of st.tl.ar || []) if (!ids.has(ar.a) || !ids.has(ar.b)) errors.push(cue + ": timeline arrow end missing"); } }
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
    else if (ch.origin === "authored-visual-diagnostic") { if (!ch.ask || !ch.answer) errors.push(sid + ": authored check needs ask and answer"); if (ch.task) {
        const t = ch.task, valid = Array.isArray(t.items) && t.items.length && t.items.every(x=>typeof x === 'string' && x.trim());
        if (!['order','omit'].includes(t.kind) || !valid || !Array.isArray(t.accept) || !t.accept.length || !t.accept.every(a=>Array.isArray(a) && a.length && new Set(a).size===a.length && a.every(i=>Number.isInteger(i)&&i>=0&&i<t.items.length))) errors.push(sid+": invalid manipulation task");
      } checks[sid] = ch; }
    else errors.push(sid + ": unknown check origin " + ch.origin);
  }
  const visual = { schema: "deutschklinik.film-visual/1", key: mod.key, n: mod.n, lessonSHA256: sha256, refs, scenes, checks };
  const walk = (o, p) => { if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { if (FORBIDDEN.has(k) && !p.startsWith(".refs")) errors.push("forbidden key " + p + "." + k); walk(v, p + "." + k); } }; walk(visual, "");
  const film = audit && audit.films.find((f) => f.key === mod.key), audio = { schema: "deutschklinik.film-audio-timing/1", key: mod.key, sampleRate: 48000, cues: {} };
  if (film && film.status === "verified") for (const c of film.cues) if (c.status === "verified") audio.cues[c.id] = { frames: c.pcmFrames, mp3: c.mp3SHA256 };
  const covered = Object.values(scenes).reduce((a, s) => a + (s.kind ? s.cueCount || 0 : Object.keys(s.cues).length), 0);
  return { visual, audio, errors, warn, stats: { key: mod.key, scenes: lesson.film.scenes.length, cues: all.length, scenesDrawn: Object.keys(scenes).length, cuesDrawn: covered, keyframes, rowsChecked, recorded: Object.keys(audio.cues).length } };
}

function validateReleased(visual, lessonsDir) {
  const errors=[], {lesson,sha256}=loadLesson(lessonsDir,visual.n),src=E.registry(lesson,visual);
  if (visual.lessonSHA256!==sha256) errors.push('lesson hash differs');
  for(const bad of src.bad)errors.push('source reference differs: '+bad);
  const walk=(o,p='')=>{if(o&&typeof o==='object')for(const [k,v]of Object.entries(o)){if(FORBIDDEN.has(k)&&!p.startsWith('.refs'))errors.push('forbidden released payload: '+p+'.'+k);walk(v,p+'.'+k);}};walk(visual);
  const known=new Map(cueIds(lesson.film).map(c=>[c.id,c.scene]));let cues=0;
  for(const [sid,sc]of Object.entries(visual.scenes||{}))for(const [id,list]of Object.entries(sc.cues||{})){
    cues++;if(known.get(id)!==sid)errors.push('unknown cue/scene: '+id);let prev=-1;
    for(const k of list){if(!(k.at>=0&&k.at<1&&k.at>prev)||(prev===-1&&k.at!==0))errors.push(id+': invalid post-timing fraction');prev=k.at;
      for(const row of k.s.rows||[])try{
        if(row.ex){const expected=(Array.isArray(row.ex)?row.ex:[row.ex]).map(x=>src.examples[x].text).join('');if(E.rowText(src,row)!==expected)errors.push(id+': source row differs');}
        for(const t of row.tiles||[])if(['fin','inf','p2','pas','ersatz'].includes(t.r)&&/\s/.test(E.rowText(src,{tiles:[t]})))errors.push(id+': grouped verb role');
      }catch(e){errors.push(id+': '+e.message);}
    }
  }
  if(cues!==known.size)errors.push('cue coverage differs');return {errors,cues};
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
module.exports = { build, resolveExample, loadLesson, cueIds, validateReleased };
