#!/usr/bin/env node
// Full-production narration integrity for the B2/C1 films. Builds a baseline from the frozen lesson folder and checks a candidate
// folder, or a private lesson bundle, against it. The baseline holds hashes, ids and counts only; keep it private anyway.
//   node tools/film-integrity.cjs baseline --lessons /ABS/complete-lessons --out /ABS/film-baseline.json
//   node tools/film-integrity.cjs check --baseline /ABS/film-baseline.json --lessons /ABS/candidate-lessons
//   node tools/film-integrity.cjs check --baseline /ABS/film-baseline.json --bundle /ABS/.local/lesson-bundle/lessons.json
// Semantic fields compared per film: title; scene ids and order; per cue: id, exact say (UTF-8 SHA-256), authored seconds and stage;
// scene from/to tokens, art, variants, takeaway and quiz; lesson examples, understand blocks and exercises (JSON). A visual-only
// change outside these fields passes. In bundle mode each lesson must start with the frozen file byte-for-byte and may only be
// followed by one GRAM.filmVisual(...) call. Exit 1 lists every difference with film/scene/cue locations.
"use strict";
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), crypto = require("node:crypto"), zlib = require("node:zlib");
const sha = (x) => crypto.createHash("sha256").update(x).digest("hex"), J = (x) => sha(JSON.stringify(x === undefined ? null : x));
const args = Object.fromEntries(process.argv.slice(3).reduce((a, v, i, l) => (v.startsWith("--") ? a.concat([[v.slice(2), l[i + 1]]]) : a), []));
function evaluate(source) { let c = null; try { vm.runInNewContext(source, { GRAM: { add: (x) => { c = x; } }, window: { GRAM: null } }, { timeout: 5000 }); } catch (e) { if (/\bfilm\s*:/.test(source)) throw e; return null; } return c; }   // vocabulary chapters need the full app; film lessons must load
function digest(lesson) {
  const f = lesson.film;
  return { key: lesson.level + "-" + lesson.n, title: f.title, scenes: f.scenes.map((s) => ({ id: s.id,
    cues: s.beats.map((b, i) => ({ id: s.id + "--" + (i + 1), say: sha(Buffer.from(b.say, "utf8")), chars: [...b.say].length, seconds: b.seconds, stage: b.stage })),
    picture: J({ from: s.from, to: s.to, art: s.art, variants: s.variants, takeaway: s.takeaway, fromLabel: s.fromLabel, toLabel: s.toLabel }), quiz: J(s.quiz) })),
    lesson: { examples: J(lesson.examples), understand: J(lesson.understand), exercises: J(lesson.exercises) } };
}
function films(dir) {
  const out = {};
  for (const f of fs.readdirSync(dir).filter((x) => /^k\d+\.js$/.test(x))) { const bytes = fs.readFileSync(path.join(dir, f)), c = evaluate(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (c && c.film && ["B2", "C1"].includes(c.level)) out[c.n] = Object.assign({ n: c.n, sha256: sha(bytes) }, digest(c)); }
  return out;
}
function compare(base, cand, problems) {
  for (const [n, b] of Object.entries(base)) {
    const c = cand[n], at = b.key; if (!c) { problems.push(at + ": film missing"); continue; }
    if (c.title !== b.title) problems.push(at + ": title changed");
    const ids = (x) => x.scenes.map((s) => s.id).join("|"); if (ids(c) !== ids(b)) problems.push(at + ": scene ids or order changed (" + ids(b) + " -> " + ids(c) + ")");
    const seen = new Set(); for (const s of c.scenes) { if (seen.has(s.id)) problems.push(at + ": duplicate scene id " + s.id); seen.add(s.id); }
    b.scenes.forEach((bs, si) => { const cs = c.scenes.find((x) => x.id === bs.id); if (!cs) return; const where = at + " " + bs.id;
      if (cs.cues.length !== bs.cues.length) problems.push(where + ": cue count " + bs.cues.length + " -> " + cs.cues.length);
      bs.cues.forEach((bc, ci) => { const cc = cs.cues[ci]; if (!cc) return; for (const k of ["say", "seconds", "stage"]) if (JSON.stringify(cc[k]) !== JSON.stringify(bc[k])) problems.push(where + " " + bc.id + ": " + (k === "say" ? "narration text" : "authored " + k) + " changed"); });
      if (cs.picture !== bs.picture) problems.push(where + ": original scene examples changed"); if (cs.quiz !== bs.quiz) problems.push(where + ": original quiz changed"); });
    for (const k of ["examples", "understand", "exercises"]) if (c.lesson[k] !== b.lesson[k]) problems.push(at + ": lesson " + k + " changed");
  }
  for (const n of Object.keys(cand)) if (!base[n]) problems.push(cand[n].key + ": film not in baseline");
}
if (require.main === module) {
  const mode = process.argv[2];
  if (mode === "baseline") { const all = films(path.resolve(args.lessons)), list = Object.values(all);
    const out = { schema: "deutschklinik.film-integrity/1", created: new Date().toISOString(), films: list.length, scenes: list.reduce((a, f) => a + f.scenes.length, 0), cues: list.reduce((a, f) => a + f.scenes.reduce((b, s) => b + s.cues.length, 0), 0), lessons: all };
    fs.writeFileSync(path.resolve(args.out), JSON.stringify(out, null, 1) + "\n", { mode: 0o600 }); console.log("baseline: " + out.films + " films, " + out.scenes + " scenes, " + out.cues + " cues"); }
  else if (mode === "check") {
    const base = JSON.parse(fs.readFileSync(path.resolve(args.baseline), "utf8")), problems = []; let cand = {};
    if (args.bundle) { const raw = JSON.parse(fs.readFileSync(path.resolve(args.bundle), "utf8")), lessons = JSON.parse(zlib.gunzipSync(Buffer.from(raw.gzip, "base64")).toString("utf8"));
      for (const [n, b] of Object.entries(base.lessons)) { const l = lessons[n]; if (!l) { problems.push(b.key + ": not in bundle"); continue; }
        const rest = l.source; let original = null;
        for (const cut of [rest.indexOf("\n;window.GRAM && window.GRAM.filmVisual"), rest.length]) if (cut >= 0 && sha(Buffer.from(rest.slice(0, cut), "utf8")) === b.sha256) { original = rest.slice(0, cut); break; }
        if (original == null) { problems.push(b.key + ": bundled source is not the frozen lesson file"); continue; }
        const tail = rest.slice(original.length); if (tail && !/^\n;window\.GRAM && window\.GRAM\.filmVisual && window\.GRAM\.filmVisual\(\d+, \{[^\n<]*\}\);\n$/.test(tail)) problems.push(b.key + ": unexpected text after the lesson source");
        cand[n] = Object.assign({ n: +n, sha256: b.sha256 }, digest(evaluate(original))); } }
    else cand = films(path.resolve(args.lessons));
    compare(base.lessons, cand, problems);
    if (problems.length) { console.error(problems.length + " difference(s):\n  " + problems.join("\n  ")); process.exitCode = 1; }
    else console.log("PASS: " + Object.keys(cand).length + " films, " + base.scenes + " scenes, " + base.cues + " cues unchanged (narration, ids, order, authored timing, examples, quizzes)");
  } else { console.error("usage: film-integrity.cjs baseline|check …"); process.exitCode = 2; }
}
module.exports = { films, compare, digest };
