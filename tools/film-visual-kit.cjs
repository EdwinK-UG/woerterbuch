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
