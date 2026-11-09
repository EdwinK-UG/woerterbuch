// Authoring helpers for private film visual overlays (see tools/film-visual.cjs). Generic code only: no lesson text here.
//   w(k,i) word i of example k · wn without trailing punctuation · wp only that punctuation · wc(k,i,a,b) characters a..b of the word
//   T(id, pieces, opts) tile · P(id, ref) named piece · R(id, ex, tiles, opts) row · S(at, rows, extras) keyframe at a cue fraction
"use strict";
const w = (k, i) => k + "#" + i, wn = (k, i) => k + "#" + i + "!", wp = (k, i) => k + "#" + i + ".", wc = (k, i, a, b) => k + "#" + i + "." + a + "-" + (b == null ? "" : b);
const T = (id, x, o) => Object.assign({ id, p: (Array.isArray(x) ? x : [x]).map((r) => (typeof r === "string" ? { x: r } : r)) }, o || {});
const P = (id, x, o) => Object.assign({ id, x }, o || {});
const pun = (id, x) => T(id, x, { r: "punct", j: 1 });
const R = (id, ex, tiles, o) => Object.assign({ id, ex, tiles }, o || {});
const S = (at, rows, x) => Object.assign({ at, rows }, x || {});
const span = (k, a, b) => Array.from({ length: b - a + 1 }, (_, i) => w(k, a + i));
module.exports = { w, wn, wp, wc, T, P, pun, R, S, span, SUB: "Nebensatz · Ausschnitt", HS: "Hauptsatz" };

/* ---- scene generator: rows from a scene's own constituent tokens ----
   auto(lesson, spec) returns { examples, cues, checks } for every scene in spec.scenes (by scene id):
     { roles: { tokenRole: tileOptions }, fin: { from: i, to: i } (finite token index; default: a verb token at index 1, or 0 for verb-first),
       fields: false (no position chips), tagFrom, tagTo, keep: false (do not keep the from-row above the to-row),
       from: false (never show the from-row as a sentence, e.g. a deliberately wrong order), extra: { cueNo: { ch, br, ar, tl, pic } },
       fromEx / toEx: [ref, literal] override, check }
   Each token is one tile (a constituent), id ta, tb, … by its position in that row; its words are pieces named after the
   token id, so a constituent present in both rows travels to its new place.
   Narration lines with stage 0 show the from-row, stage 1 the result; the change happens at 30 % of the line. */
function auto(lesson, spec) {
  const out = { examples: [], cues: {}, checks: {} }, film = lesson.film;
  const join = (toks) => toks.map((t) => t.text).filter((x) => x !== "").join(" ");
  film.scenes.forEach((sc, si) => {
    const sp = spec.scenes[sc.id]; if (!sp) return;
    const kf = "s" + si + "f", kt = "s" + si + "t", same = join(sc.from) === join(sc.to);
    out.examples.push([kf, sp.fromEx ? sp.fromEx[0] : "film.scenes[" + si + "].from, joined", sp.fromEx ? sp.fromEx[1] : join(sc.from)]);
    if (!same) out.examples.push([kt, sp.toEx ? sp.toEx[0] : "film.scenes[" + si + "].to, joined", sp.toEx ? sp.toEx[1] : join(sc.to)]);
    let cueNo = 1; const rolesNow = () => (typeof sp.roles === "function" ? sp.roles(cueNo) : sp.roles) || {};
    const tiles = (toks, key, side, opt) => {
      let wi = 0; const n = toks.length, verbIdx = toks.map((t, i) => (t.role === "verb" ? i : -1)).filter((i) => i >= 0);
      const finI = sp.fin && sp.fin[side] != null ? sp.fin[side] : verbIdx.includes(1) ? 1 : verbIdx.includes(0) ? 0 : -1;
      const res = [];
      toks.forEach((t, ti) => {
        const words = t.text.split(" ").filter(Boolean), last = ti === n - 1, ps = [];
        words.forEach((wd, k) => { const isLast = k === words.length - 1, punct = /[.,!?;:]$/.test(wd); ps.push(P("k" + (t.id || ti) + (words.length > 1 ? "." + k : ""), isLast && punct ? key + "#" + wi + "!" : key + "#" + wi)); wi++; });
        const base = Object.assign({}, rolesNow()[t.role] || {});
        if (ti === finI) Object.assign(base, { r: "fin" }, sp.fields === false ? {} : { f: 2 });
        else if (t.role === "verb" && ti > finI && finI >= 0 && last && sp.fields !== false) Object.assign(base, { f: "E" }, base.r ? {} : { r: "inf", l: base.l });
        if (sp.fields !== false && ti === 0 && finI === 1) base.f = 1;
        Object.assign(base, ((sp.tile || {})[side] || {})[ti] || {});
        const tile = T("t" + "abcdefghijklmnopqrstuvwxyz"[ti], ps, Object.assign({ N: t.id || undefined }, base));   // tile ids by position (ta, tb, …); piece ids carry the token identity
        res.push(tile);
        const lw = words[words.length - 1]; if (/[.,!?;:]$/.test(lw)) res.push(pun("p" + ti, key + "#" + (wi - 1) + "."));
      });
      return res;
    };
    const fromRow = (o = {}) => R("f", kf, tiles(sc.from, kf, "from"), { tag: sp.tagFrom, dim: o.dim });
    const toRow = () => R("t", same ? kf : kt, tiles(same ? sc.from : sc.to, same ? kf : kt, same ? "from" : "to"), { tag: sp.tagTo || sp.tagFrom });
    const stateOf = (stage) => stage >= 0.5 && !same ? (sp.keep === false || sp.from === false ? [toRow()] : [fromRow({ dim: 0.5 }), toRow()]) : sp.from === false ? [] : [fromRow()];
    let prev = stateOf(sc.beats[0].stage);
    sc.beats.forEach((b, bi) => {
      cueNo = bi + 1; const id = sc.id + "--" + (bi + 1), now = stateOf(b.stage), ex = (sp.extra || {})[bi + 1] || {};
      const list = [S(0, prev)];
      const rest = (o) => { const r = Object.assign({}, o); delete r.at; delete r.rows; delete r.then; return r; };
      if (JSON.stringify(now) !== JSON.stringify(prev) || Object.keys(ex).length) list.push(S(ex.at || 0.3, ex.rows || now, rest(ex)));
      for (const more of ex.then || []) list.push(S(more.at, more.rows || ex.rows || now, rest(more)));
      out.cues[id] = list; prev = list[list.length - 1].rows;
    });
    if (sp.check) out.checks[sc.id] = sp.check; else if (sc.quiz) out.checks[sc.id] = { origin: "source-quiz" };
  });
  return out;
}
module.exports.auto = auto;
/* line(id, key, literal, groups, rowOpts): one row from a registered example; groups = [[wordCount, tileOpts], ...] in order.
   A group's final punctuation becomes its own glued tile, so the row renders the literal exactly. */
function line(id, key, literal, groups, o) {
  const words = literal.split(" "); let i = 0; const tiles = [];
  groups.forEach(([n, opt], gi) => { const ps = []; for (let k = 0; k < n; k++, i++) { const last = k === n - 1, punct = /[.,!?;:]+$/.test(words[i]); ps.push(last && punct && words[i].replace(/[.,!?;:]+$/, "") ? key + "#" + i + "!" : key + "#" + i); }
    const rest = Object.assign({}, opt || {}); delete rest.id; tiles.push(T((opt && opt.id) || "g" + gi, ps, rest)); const lw = words[i - 1]; if (/[.,!?;:]+$/.test(lw) && lw.replace(/[.,!?;:]+$/, "")) tiles.push(pun("q" + gi, key + "#" + (i - 1) + ".")); });
  if (i !== words.length) throw new Error("line " + id + ": groups cover " + i + " of " + words.length + " words");
  return R(id, key, tiles, o);
}
module.exports.line = line;
