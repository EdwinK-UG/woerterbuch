/* Requisiten: what a scene can do beyond its people and animals (format v1 steps, docs/scene-format.md), in one
   canvas above the set's front (so a prop on the workbench is not hidden by it) and below the spotlight, bubbles and
   boards. Generic: nothing here knows a chapter.
     prop:  { id: { thing | word, x, y, d, rot, s, alpha, glow, bob, tone, flip, look, on, show } | null }
            a prop: one of the baked THINGS (tiere.js) or a word on a plank; placed at once, or changed (omitted fields
            keep their value); `on: who` carries it with a person (x, y are then offsets, x mirrored when they turn)
     move:  { id: { x, y, d, rot, s, alpha, glow, dur, ease, arc } }   a prop moves by itself (eased; arc = a hop)
     morph: { id: { to, fx: 'shave' | 'stamp' | 'flip' | 'grow' | 'cork' | 'fold', stamp } }   a word prop turns into another word
     tape:  { from, to, d, marks: [{ x, t }], dur } | { lit: i } | false     a measuring tape on the floor: a timeline
     dim:   amount | { to, dur }      the picture darkens (0 normal … 1 dark): a power cut, night
     ghost: { who: amount | { to, dur } }   a person fades to a pale glowing outline (1) or fills in again (0)
     pop:   [id, …]                   props burst into lilac glitter and are gone (a wish meets reality: plopp)
     ride:  { who: id | null }        a person moves with a prop (in a boat), keeping the distance it has now
     rain:  amount | { to, dur, back } rain over the picture (back: it falls upward, time runs backwards)
     tint:  { tone: 'sepia' | 'wish' | null, to, dur }   the whole picture takes a tone (the past; a "what if")
     sit:   { who: true | false }     (regie.js) a person sits down or stands up
   A prop may also be a picture of meaning in a soft bubble (pic, bilder.js; "" an empty bubble), a word on a stone
   (look 'stone'), and take the tone 'wish' (lilac, shimmering: only wished or imagined).
   Since k439 (Futur II): the tone 'guess' (a see-through bubble with a dashed rim and a "?": only supposed) and the step
     sure:  [id, …]                   a guess turns into a fact: the rim fills in, the colours come back, ? flips to ✓
   the looks 'flag' (the word on a little finish flag on a pole) and 'slot' (an empty glowing frame `w` metres wide,
   the word as its label), the morph fx 'cork' (the first {e:…} part pops off like a cork), the tint 'future' (a pale
   blue glow from the edges: ahead in time), and the tape's look 'band' (a glowing time band: sepia behind `now`, bright
   at `now`, pale ahead; marks may be flags; { marks } and { arc: { from, to, t } } change it later).
   Since k482 (Nominalstil): the morph fx 'fold' (the word folds up like a paper fan, gold sparkles fly, and it unfolds
   as the new word: a verb folding into a noun), and morph on a picture bubble (pic): it flips over to the picture `to`.
   Every act starts clean: no props, no tape, no dimming, no rain, no tint, nobody a ghost, nobody riding or sitting. */
import { THINGS } from './tiere.js';
import { BILDER } from './bilder.js';
import * as baked from './baked.js';
import { REDUCED } from './stage.js';
import { play } from './sfx.js';
import { margin } from './platz.js?v=9';

const TAU = Math.PI * 2;
const ease = (k) => k * k * (3 - 2 * k), lin = (k) => k;
const WISH = '#9b6ee8', WISH_S = '#efe6ff';
const CASE = { n: ['#fcf0d9', '#b8730a'], a: ['#dcf3ef', '#0b8579'], d: ['#efe6fd', '#7c3aed'], g: ['#e6ebf1', '#4b5d73'] };
// a text with marks ({e:ge}worden) as runs [{ t, k }]
export function runs(s) {
  const out = []; let i = 0; s = String(s == null ? '' : s);
  for (const m of s.matchAll(/\{([a-z]+):([^}]*)\}/g)) { if (m.index > i) out.push({ t: s.slice(i, m.index) }); out.push({ t: m[2], k: m[1] }); i = m.index + m[0].length; }
  if (i < s.length) out.push({ t: s.slice(i) });
  return out;
}

export function createRequisiten(B) {
  const set = B.set, cv = document.createElement('canvas'); cv.className = 'props'; cv.setAttribute('aria-hidden', 'true'); document.getElementById('stage').append(cv);
  const P = new Map();                      // id → prop
  let tape = null; const D = { dim: 0, rain: 0, back: false, tint: 0, tone: null };
  const bursts = [], riders = new Map();          // pops in flight; who rides on which prop (and how far from it)
  const tmp = document.createElement('canvas'), tmp2 = document.createElement('canvas');

  /* ---------- steps ---------- */
  const FIELDS = ['thing', 'word', 'pic', 'x', 'y', 'd', 'rot', 's', 'alpha', 'glow', 'bob', 'tone', 'flip', 'look', 'on', 'w'];
  function prop(v) {
    for (const [id, o] of Object.entries(v)) {
      if (o === null) { gone(P.get(id)); P.delete(id); continue; }
      let p = P.get(id);
      if (!p) { p = { id, x: 0, y: 0, d: 0, rot: 0, s: 1, alpha: 1, glow: 0, bob: 0, tone: null, flip: false, look: 'wood', on: null, pic: null, w: 1, vis: 0, show: false, ph: Math.random() * TAU, t0: B.S.t }; P.set(id, p); }
      if ('tone' in o && (o.tone !== p.tone || o.tone === 'guess')) p.sure = null;   // a new tone, or the tone guess again: its "?" again
      if ('on' in o && o.on !== p.on && !o.on && p.on) { const w = where(p); p.x = w.x; p.d = w.d; }     // let go: it stays where it is
      for (const f of FIELDS) if (f in o) p[f] = o[f];
      if ('thing' in o) { p.word = null; p.pic = null; } if ('word' in o) { p.thing = null; p.pic = null; } if ('pic' in o) { p.thing = null; p.word = null; }
      const show = o.show ?? true;
      if (show && !p.show) { p.show = true; p.pop = B.S.t; } else if (!show) p.show = false;
    }
  }
  function move(v) {
    const all = [];
    for (const [id, o] of Object.entries(v)) {
      const p = P.get(id); if (!p) continue;
      const to = {}, from = {};
      for (const f of ['x', 'y', 'd', 'rot', 's', 'alpha', 'glow', 'w']) if (typeof o[f] === 'number') { to[f] = o[f]; from[f] = p[f]; }
      const mv = { from, to, t0: B.S.t, dur: Math.max(0.001, REDUCED && (o.dur ?? 0.8) > 0.3 ? 0.001 : o.dur ?? 0.8), arc: o.arc || 0, ease: o.ease === 'linear' ? lin : ease, done: false };
      p.mv = mv; if (!p.show) { p.show = true; p.pop = B.S.t; }
      all.push(B.until(() => mv.done || p.mv !== mv));
    }
    return Promise.all(all);
  }
  function morph(v) {
    const all = [];
    for (const [id, o] of Object.entries(v)) {
      const p = P.get(id); if (!p || (p.word == null && p.pic == null)) continue;
      const isPic = p.word == null;                                     // a picture bubble flips over to another picture (since k482)
      const m = { from: isPic ? p.pic : p.word, to: o.to, fx: isPic ? 'flip' : o.fx || 'flip', stamp: o.stamp || '', t0: B.S.t, dur: REDUCED ? 0.001 : { shave: 1.1, stamp: 1.5, flip: 0.6, grow: 1.2, cork: 1.0, fold: 1.0 }[isPic ? 'flip' : o.fx || 'flip'] || 0.8 };
      if (m.fx === 'cork') play.pop(0.8); else if (m.fx === 'fold') play.slip(); else if (isPic) play.click();
      p.mo = m; all.push(B.until(() => p.mo !== m || B.S.t - m.t0 >= m.dur).then(() => { if (p.mo === m) { if (isPic) p.pic = m.to; else p.word = m.to; p.mo = null; } }));
    }
    return Promise.all(all);
  }
  function setTape(v) {
    if (v === false || v === null) { if (tape) { const T = tape; return B.tween(T, 'u', 0, 0.5).then(() => { if (tape === T) tape = null; }); } return null; }
    const stamp = (ms) => (ms || []).map((m) => ({ ...m, t0: B.S.t }));
    if (v.from == null) {                     // a change to the tape that lies there: lit, new marks (they pop in), an arc
      if (!tape) return null;
      if ('lit' in v) tape.lit = v.lit;
      if (v.marks) { const old = new Map(tape.marks.map((m) => [m.x + '|' + m.t, m])); tape.marks = v.marks.map((m) => old.get(m.x + '|' + m.t) || { ...m, t0: B.S.t }); }
      if ('arc' in v) tape.arc = v.arc ? { ...v.arc, t0: B.S.t } : null;
      if (typeof v.now === 'number') return B.tween(tape, 'now', v.now, REDUCED ? 0.001 : 0.9);    // the bright "now" moves (in thought, to another day)
      return null;
    }
    tape = { from: v.from, to: v.to, d: v.d ?? 0.45, marks: stamp(v.marks).map((m) => ({ ...m, t0: -9 })), lit: v.lit ?? null, u: 0, look: v.look || 'tape', now: v.now ?? null, arc: v.arc ? { ...v.arc, t0: B.S.t } : null };
    return B.tween(tape, 'u', 1, REDUCED ? 0.001 : v.dur ?? 1.5, lin);
  }
  // a guess becomes a fact (since k439): the dashed rim fills in, the picture gets its colours, the "?" flips to a tick
  function sure(v) {
    const all = [];
    for (const id of [].concat(v || [])) { const p = P.get(id); if (!p) continue; const t0 = B.S.t; p.sure = t0; all.push(B.until(() => p.sure !== t0 || B.S.t - t0 >= 0.6)); }
    if (all.length) play.click();
    return Promise.all(all);
  }
  const amount = (v) => (typeof v === 'number' ? { to: v, dur: 0.6 } : { to: v.to ?? 1, dur: v.dur ?? 0.6 });
  function dim(v) { const { to, dur } = amount(v); return B.tween(D, 'dim', to, dur); }
  function ghost(v) {
    return Promise.all(Object.entries(v).map(([w, x]) => { const a = B.A[w]; if (!a) return null; const { to, dur } = amount(typeof x === 'number' ? { to: x, dur: 0.8 } : x); if (a.ghost == null) a.ghost = 0; return B.tween(a, 'ghost', to, dur); }));
  }
  // a prop that goes away ends what it was doing (whoever waits for its move or morph goes on)
  const gone = (p) => { if (!p) return; if (p.mv) p.mv.done = true; p.mo = null; };
  function pop(v) {
    for (const id of [].concat(v || [])) {
      const p = P.get(id); if (!p) continue;
      if (p.vis > 0.05) { const w = where(p), [, hh] = size(p); bursts.push({ x: w.x, y: w.y, d: w.d, t0: B.S.t, r: Math.max(0.25, hh), seed: Math.random() * TAU }); }
      gone(p); P.delete(id); for (const [k, r] of riders) if (r.id === id) riders.delete(k);
    }
    play.plopp();
  }
  function ride(v) {
    for (const [w, id] of Object.entries(v)) {
      const a = B.A[w]; if (!a) continue;
      const p = id && P.get(id); if (!p) { riders.delete(w); continue; }
      riders.set(w, { id, dx: a.x - where(p).x });
    }
  }
  function rain(v) {
    const o = typeof v === 'number' ? { to: v } : v || {};
    if ('back' in o) D.back = !!o.back;
    return B.tween(D, 'rain', o.to ?? 1, o.dur ?? 1.0);
  }
  function tint(v) {
    const o = v || {}; if (o.tone && o.tone !== 'none') D.tone = o.tone;
    const to = o.tone === null || o.tone === 'none' ? 0 : o.to ?? 1;
    return B.tween(D, 'tint', to, o.dur ?? 0.8).then(() => { if (D.tint <= 0.001) D.tone = null; });
  }
  function clear() {
    for (const p of P.values()) gone(p); P.clear(); tape = null; D.dim = 0; D.rain = 0; D.back = false; D.tint = 0; D.tone = null; bursts.length = 0; riders.clear();
    for (const a of Object.values(B.A)) { a.ghost = 0; if (a.sit) B.sit(a, false); }
  }
  B.resetHooks.push(clear);

  /* ---------- where things are ---------- */
  const BUB = [0.62, 0.46];                  // a picture bubble's half width and height in metres (s = 1)
  function where(p) {
    let x = p.x, d = p.d, y = p.y, flip = p.flip;
    const a = p.on && B.A[p.on];
    if (a) { x = a.x + (a.left ? -p.x : p.x); d = a.d + (p.d || 0.02); flip = a.left ? !p.flip : p.flip; }
    if (p.mv && p.mv.arc) { const k = Math.min(1, (B.S.t - p.mv.t0) / p.mv.dur); y += Math.sin(Math.PI * p.mv.ease(k)) * p.mv.arc; }
    if (p.bob) y += Math.sin(B.S.t * 2.4 + p.ph) * p.bob;
    return { x, y, d, flip };
  }
  function size(p) {                          // half width / height in metres (for boards and bubbles to keep clear of)
    const T = baked.M('tiere'), e = T && p.thing && T.things[p.thing];
    if (e) return [e.size[0] / T.pxPerMetre / 2 * p.s, e.size[1] / T.pxPerMetre / 2 * p.s];
    if (p.pic != null) return [BUB[0] * p.s, BUB[1] * p.s];
    return p.word != null ? [(p._w || 0.6) / 2 * p.s, 0.13 * p.s] : [0.2 * p.s, 0.2 * p.s];
  }
  // a word's or a picture bubble's box on screen (the props that hold text or meaning), before any nudge
  function screenBox(p) {
    const w = where(p), f = set.foot(w.x, w.d), s = set.V.cam.z * f.k, k = p.s, cx = f.x, cy = f.y - w.y * s;
    if (p.pic != null) { const rx = BUB[0] * s * k, ry = BUB[1] * s * k; return { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 }; }
    if (p.word == null) return null;
    const px = Math.max(12, 0.15 * s) * k;
    if (p.look === 'flag') { const cw = Math.max(0, (p._w || 0.6) * s * k - px), pole = 1.05 * s * k; return { x: cx, y: cy - pole, w: cw, h: pole }; }
    if (p.look === 'slot') { const sw = (p.w || 1) * s * k, sh = 0.36 * s * k, lab = Math.max(11, 0.12 * s) * k * 1.55; return { x: cx - sw / 2, y: cy - sh / 2 - lab, w: sw, h: sh + lab }; }
    const pw = (p._w || 0.6) * s * k, ph = px * 1.9; return { x: cx - pw / 2, y: cy - ph / 2, w: pw, h: ph };
  }
  // the words and picture bubbles in the picture now (tools/scene-frames.cjs checks they keep off the edges)
  let labels = [];                           // the tape's mark labels as last drawn
  function boxes() {
    const out = labels.slice();
    for (const p of P.values()) { if (!p.show || p.vis < 0.5 || p.alpha < 0.3) continue; const b = screenBox(p); if (b) out.push({ ...b, x: b.x + (p.nx || 0), y: b.y + (p.ny || 0), id: p.id }); }
    return out;
  }
  /* The fit rule for props (docs/scene-format.md, player behaviour): a word or a picture bubble that is in the picture,
     even in part, or that stands in the scene's wide shot as a wide screen shows it (a phone shows less of the room),
     is drawn just inside the picture's margins instead of being cut at its edge. Things (THINGS) stay where they are.
     The shift (p.nx, p.ny, in px) eases, so nothing jumps; a prop that leaves the scene leaves the picture. */
  function nudgeTo(p) {
    const b = screenBox(p); if (!b) return [0, 0];
    const W = set.V.W, H = set.V.H, m = margin(W), base = B.S.base || { x: 0, k: 1 };
    const inPic = b.x < W && b.x + b.w > 0 && b.y < H && b.y + b.h > 0;
    if (!inPic && Math.abs(where(p).x - base.x) > 3.1 / (base.k || 1)) return [0, 0];
    const fit = (x, size, lim) => (size > lim - 2 * m ? (lim - size) / 2 - x : Math.max(m - x, Math.min(0, lim - m - x - size)));
    return [fit(b.x, b.w, W), fit(b.y, b.h, H)];
  }
  // a label on the tape: moved sideways (only) into the picture when it is in it in part
  function labelShift(x, w) { const W = set.V.W, m = margin(W); return x < W && x + w > 0 ? Math.max(m - x, Math.min(0, W - m - x - w)) : 0; }
  B.occupiers.push(() => {
    const out = [], Z = set.V.cam.z;
    for (const p of P.values()) {
      if (!p.show || p.vis < 0.5 || p.alpha < 0.3) continue;
      const w = where(p), f = set.foot(w.x, w.d), s = Z * f.k, [hw, hh] = size(p);
      out.push({ x: f.x + (p.nx || 0) - hw * s, y: f.y + (p.ny || 0) - w.y * s - hh * s, w: hw * 2 * s, h: hh * 2 * s, who: 'prop:' + p.id });
    }
    return out;
  });

  /* ---------- drawing ---------- */
  function fit() { const w = Math.round(set.V.W * set.V.dpr), h = Math.round(set.V.H * set.V.dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.setTransform(set.V.dpr, 0, 0, set.V.dpr, 0, 0); return c; }
  function drawThing(c, kind, s) { if (!baked.thing(c, kind, 0, 0, s, 0, 1)) { if (!THINGS[kind]) return; c.save(); c.scale(s, s); THINGS[kind](c); c.restore(); } }
  // a tone: sepia (the past), gray (a memory), ghost (not yet, or only imagined): drawn on a scratch canvas, then tinted
  function toned(c, tone, draw) {
    const W = cv.width, H = cv.height;
    for (const t of [tmp, tmp2]) if (t.width !== W || t.height !== H) { t.width = W; t.height = H; }
    const a = tmp.getContext('2d'); a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, W, H); a.setTransform(set.V.dpr, 0, 0, set.V.dpr, 0, 0); draw(a);
    const b = tmp2.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'copy'; b.drawImage(tmp, 0, 0);
    if (tone === 'wish') { b.globalCompositeOperation = 'source-atop'; b.fillStyle = 'rgba(176,128,255,.5)'; b.fillRect(0, 0, W, H); }
    else { b.globalCompositeOperation = tone === 'ghost' ? 'source-atop' : 'saturation'; b.fillStyle = tone === 'ghost' ? 'rgba(255,253,240,.82)' : '#808080'; b.fillRect(0, 0, W, H); }
    if (tone === 'sepia') { b.globalCompositeOperation = 'color'; b.fillStyle = '#a5743f'; b.fillRect(0, 0, W, H); }
    b.globalCompositeOperation = 'destination-in'; b.drawImage(tmp, 0, 0); b.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (tone === 'ghost') { c.shadowColor = 'rgba(255,255,235,.95)'; c.shadowBlur = 14 * set.V.dpr; }
    if (tone === 'wish') { c.shadowColor = `rgba(180,130,255,${(0.75 + 0.25 * Math.sin(B.S.t * 3)).toFixed(2)})`; c.shadowBlur = 16 * set.V.dpr; }
    c.drawImage(tmp2, 0, 0); c.restore();
  }
  const FONT = (px) => `600 ${px.toFixed(1)}px Fraunces, Georgia, serif`;
  function wordLayout(c, word, px) {
    c.font = FONT(px); const rs = runs(word), pad = px * 0.18;
    let x = 0; for (const r of rs) { r.w = c.measureText(r.t).width + (r.k ? pad * 2 : 0); r.x = x; x += r.w; }
    return { rs, w: x };
  }
  let look = 'wood';
  function drawRun(c, r, x, y, px, alpha = 1) {
    if (alpha <= 0.01) return;
    c.save(); c.globalAlpha *= alpha; const pad = px * 0.18, h = px * 1.25;
    if (r.k === 'e') { c.fillStyle = '#f2c94c'; rounded(c, x, y - h / 2, r.w, h, px * 0.22); c.fill(); }
    else if (r.k === 'v') { c.fillStyle = '#2a2f3a'; rounded(c, x, y - h / 2, r.w, h, px * 0.22); c.fill(); }
    else if (r.k === 'k') { c.save(); c.shadowColor = 'rgba(170,120,255,.8)'; c.shadowBlur = px * 0.5; c.fillStyle = WISH; rounded(c, x, y - h / 2, r.w, h, px * 0.22); c.fill(); c.restore(); }
    else if (r.k === 't') { c.strokeStyle = '#2a2f3a'; c.lineWidth = Math.max(1, px * 0.07); rounded(c, x + 1, y - h / 2 + 1, r.w - 2, h - 2, px * 0.22); c.stroke(); }
    else if (CASE[r.k]) { c.fillStyle = CASE[r.k][0]; rounded(c, x, y - h / 2, r.w, h, px * 0.22); c.fill(); }
    c.fillStyle = r.k === 'v' || r.k === 'k' ? '#fffcf6' : CASE[r.k] ? CASE[r.k][1] : look === 'stone' ? '#2f3338' : '#3a2414'; c.textBaseline = 'middle'; c.font = FONT(px);
    c.fillText(r.t, x + (r.k ? pad : 0), y + px * 0.04); c.restore();
  }
  function rounded(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  // look 'slot' (since k439): an empty frame w metres wide, glowing gold, its word a small label above it; centred at (0, 0)
  function drawSlot(c, p, s) {
    const px = Math.max(11, 0.12 * s), w = (p.w || 1) * s, h = 0.36 * s, pulse = 0.6 + 0.4 * Math.sin(B.S.t * 3 + p.ph);
    c.save(); c.shadowColor = `rgba(242,201,76,${(0.55 * pulse).toFixed(2)})`; c.shadowBlur = 14;
    c.fillStyle = 'rgba(255,248,220,.22)'; rounded(c, -w / 2, -h / 2, w, h, h * 0.22); c.fill();
    c.setLineDash([px * 0.5, px * 0.3]); c.lineWidth = Math.max(2, 0.025 * s); c.strokeStyle = '#e0a92a'; c.stroke(); c.restore();
    c.font = `700 ${px.toFixed(1)}px Inter, system-ui, sans-serif`; const label = runs(p.word).map((r) => r.t).join(''), tw = c.measureText(label).width + px;
    c.fillStyle = '#e0a92a'; rounded(c, -tw / 2, -h / 2 - px * 1.55, tw, px * 1.35, px * 0.3); c.fill();
    c.fillStyle = '#fffcf6'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 0, -h / 2 - px * 0.85);
    p._w = w / s;
  }
  // look 'flag' (since k439): the word on a little finish flag; (0, 0) is the foot of its pole
  function drawFlag(c, p, s) {
    const px = Math.max(12, 0.15 * s), pole = 1.05 * s, A = wordLayout(c, p.word, px), cw = A.w + px * 1.6, ch = px * 2.0, top = -pole;
    c.fillStyle = '#5b3a22'; c.fillRect(-Math.max(1.5, 0.02 * s), top, Math.max(3, 0.04 * s), pole);
    c.fillStyle = '#d9b24a'; c.beginPath(); c.arc(0, top, Math.max(2.5, 0.035 * s), 0, TAU); c.fill();
    const wave = (u) => Math.sin(B.S.t * 3 + u * 4 + p.ph) * ch * 0.06 * u;
    c.save(); c.beginPath(); c.moveTo(0, top + ch * 0.1);
    for (let i = 0; i <= 10; i++) { const u = i / 10; c.lineTo(u * cw, top + ch * 0.1 + wave(u)); }
    for (let i = 10; i >= 0; i--) { const u = i / 10; c.lineTo(u * cw, top + ch * 1.1 + wave(u)); }
    c.closePath(); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 5; c.fillStyle = '#fffdf6'; c.fill(); c.shadowBlur = 0; c.clip();
    const sq = ch / 4; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#2a2f3a' : '#fffdf6'; c.fillRect(cw - sq * 2 + j * sq, top + ch * 0.1 + i * sq - ch * 0.06, sq, sq + 1); }
    c.restore();
    look = 'paper'; for (const r of A.rs) drawRun(c, r, px * 0.4 + r.x, top + ch * 0.6 + wave(0.3), px);
    p._w = (cw + px) / s;
  }
  function drawWord(c, p, s) {                // a word on a plank (look 'wood') or a card (look 'paper'), centred at (0, 0)
    if (p.look === 'slot') return drawSlot(c, p, s);
    if (p.look === 'flag') return drawFlag(c, p, s);
    const px = Math.max(12, 0.15 * s), mo = p.mo, k = mo ? Math.min(1, (B.S.t - mo.t0) / mo.dur) : 0;
    const A = wordLayout(c, mo ? mo.from : p.word, px), Bt = mo ? wordLayout(c, mo.to, px) : null;
    const fk = mo && mo.fx === 'fold' ? (k < 0.45 ? 1 - 0.9 * ease(k / 0.45) : k < 0.55 ? 0.1 : 0.1 + 0.9 * ease((k - 0.55) / 0.45)) : 1;   // the fold: how open the fan is
    let w = A.w; if (Bt) w = mo.fx === 'shave' || mo.fx === 'grow' || mo.fx === 'cork' ? A.w + (Bt.w - A.w) * ease(Math.min(1, k * 1.4)) : mo.fx === 'fold' ? (k < 0.5 ? A.w : Bt.w) * fk : k < 0.5 ? A.w : Bt.w;
    p._w = (w + px * 1.2) / s;
    const pw = w + px * 1.2, ph = px * 1.9;
    c.save();
    look = p.look;
    if (p.look === 'paper') { c.fillStyle = '#fffdf6'; c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 6; rounded(c, -pw / 2, -ph / 2, pw, ph, px * 0.2); c.fill(); }
    else if (p.look === 'stone') {            // carved in grey stone: reality, solid
      c.fillStyle = '#a9adb2'; rounded(c, -pw / 2, -ph / 2, pw, ph, px * 0.35); c.fill();
      c.fillStyle = 'rgba(255,255,255,.22)'; rounded(c, -pw / 2 + 3, -ph / 2 + 3, pw - 6, ph * 0.4, px * 0.3); c.fill();
      c.fillStyle = 'rgba(60,64,70,.35)'; c.fillRect(-pw / 2, ph / 2 - 4, pw, 4);
      c.strokeStyle = 'rgba(70,74,80,.45)'; c.lineWidth = 1; for (const [a, b] of [[0.18, 0.3], [0.7, 0.55]]) { c.beginPath(); c.moveTo(-pw / 2 + pw * a, -ph / 2); c.lineTo(-pw / 2 + pw * a + px * 0.3, -ph / 2 + ph * b); c.stroke(); }
    }
    else {
      c.fillStyle = '#e0b57a'; rounded(c, -pw / 2, -ph / 2, pw, ph, px * 0.25); c.fill();
      c.strokeStyle = 'rgba(150,95,45,.35)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-pw / 2 + 4, -ph / 2 + ph * i / 4); c.bezierCurveTo(-pw / 6, -ph / 2 + ph * i / 4 - 3, pw / 6, -ph / 2 + ph * i / 4 + 3, pw / 2 - 4, -ph / 2 + ph * i / 4); c.stroke(); }
      c.fillStyle = 'rgba(122,79,44,.55)'; c.fillRect(-pw / 2, ph / 2 - 3, pw, 3);
    }
    c.restore();
    const x0 = -w / 2;
    if (!mo) { for (const r of A.rs) drawRun(c, r, x0 + r.x, 0, px); return; }
    if (mo.fx === 'shave') {                    // the first {e:…} part curls off as a shaving; the rest closes the gap
      const cut = A.rs.findIndex((r) => r.k === 'e'), kk = ease(k);
      A.rs.forEach((r, i) => {
        if (i === cut) { c.save(); c.translate(-A.w / 2 + r.x + r.w / 2 - kk * px * 1.2, -kk * px * 3.2); c.rotate(-kk * 2.4); drawRun(c, { ...r }, -r.w / 2, 0, px * (1 - 0.3 * kk), 1 - kk); c.restore(); return; }
        const shift = i > cut && cut >= 0 ? A.rs[cut].w * kk : 0; drawRun(c, r, -A.w / 2 + r.x - shift + (A.w - w) / 2, 0, px);
      });
      return;
    }
    if (mo.fx === 'cork') {                     // the first {e:…} part pops off like a cork: up, spinning, gone; the rest closes up
      const cut = A.rs.findIndex((r) => r.k === 'e'), kk = ease(Math.min(1, k * 1.3)), fly = Math.min(1, k * 1.15);
      A.rs.forEach((r, i) => {
        if (i === cut) { c.save(); c.translate(-A.w / 2 + r.x + r.w / 2 + fly * px * 2.2, -Math.sin(Math.PI * Math.min(1, fly * 0.8)) * px * 4.5 - fly * px * 1.5); c.rotate(fly * 5.5); drawRun(c, { ...r }, -r.w / 2, 0, px, 1 - Math.max(0, fly - 0.6) / 0.4); c.restore(); return; }
        const shift = i > cut && cut >= 0 ? A.rs[cut].w * kk : 0; drawRun(c, r, -A.w / 2 + r.x - shift + (A.w - w) / 2, 0, px);
      });
      return;
    }
    if (mo.fx === 'fold') {                     // (since k482) folds up like a paper fan, sparkles, unfolds as the new word
      const L = k < 0.5 ? A : Bt;
      c.save(); c.scale(Math.max(0.02, fk), 1); for (const r of L.rs) drawRun(c, r, -L.w / 2 + r.x, 0, px); c.restore();
      const pw2 = w + px * 1.2, ph2 = px * 1.9, n = 6, sh = 1 - fk;      // the pleats: alternate strips shaded as it closes
      c.save(); for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? `rgba(255,255,255,${(0.35 * sh).toFixed(3)})` : `rgba(40,30,20,${(0.28 * sh).toFixed(3)})`; c.fillRect(-pw2 / 2 + (pw2 * i) / n, -ph2 / 2, pw2 / n + 0.5, ph2); } c.restore();
      if (k > 0.3 && k < 0.85 && !REDUCED) {    // gold sparkles fly out from the fold (the magic of the red pen)
        const q = (k - 0.3) / 0.55;
        for (let i = 0; i < 9; i++) { const a = (i * TAU) / 9 + 0.4, rr2 = px * (0.6 + 2.6 * q); gold(c, Math.cos(a) * rr2, Math.sin(a) * rr2 * 0.7, px * 0.32 * (1 - q * 0.6), 1 - q); }
      }
      return;
    }
    if (mo.fx === 'grow') {                     // the new parts come in as ghost letters and settle
      for (const r of Bt.rs) drawRun(c, r, -Bt.w / 2 + r.x, 0, px, r.k === 'e' ? 0.15 + 0.85 * ease(Math.max(0, k * 1.5 - 0.3)) : 1);
      return;
    }
    // flip and stamp: the word flips over to the new one (the stamp first comes down on it)
    const at = mo.fx === 'stamp' ? 0.55 : 0, kf = Math.max(0, Math.min(1, (k - at) / (1 - at)));
    const L = kf < 0.5 ? A : Bt, sy = Math.abs(Math.cos(kf * Math.PI));
    c.save(); c.scale(1, Math.max(0.02, sy)); for (const r of L.rs) drawRun(c, r, -L.w / 2 + r.x, 0, px); c.restore();
    if (mo.fx === 'stamp' && mo.stamp) {
      const ks = Math.min(1, k / 0.22), fade = k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1, sc = 1 + (1 - ease(ks)) * 1.3;
      c.save(); c.globalAlpha *= ks * fade; c.rotate(-0.18); c.scale(sc, sc); c.font = `800 ${(px * 0.95).toFixed(1)}px Inter, system-ui, sans-serif`;
      const tw = c.measureText(mo.stamp).width + px; c.strokeStyle = '#c0392b'; c.lineWidth = Math.max(2, px * 0.12); rounded(c, -tw / 2, -px * 0.75, tw, px * 1.5, px * 0.2); c.stroke();
      c.fillStyle = '#c0392b'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(mo.stamp, 0, px * 0.05); c.restore();
    }
  }
  // a picture of meaning in a soft round bubble, centred at (0, 0); pic "" is an empty bubble
  // a guess (tone 'guess'): 1 while only supposed, falling to 0 as `sure` makes it a fact (0.6 s)
  const guessOf = (p) => (p.tone !== 'guess' ? 0 : p.sure == null ? 1 : 1 - ease(Math.min(1, (B.S.t - p.sure) / 0.6)));
  function badge(c, x, y, r, p) {               // the guess's corner badge: "?" (blue), flipping to a tick (green)
    const k = p.sure == null ? 0 : Math.min(1, (B.S.t - p.sure) / 0.6), sx = Math.abs(Math.cos(Math.PI * k)), ok = k >= 0.5;
    c.save(); c.translate(x, y); c.scale(Math.max(0.05, sx), 1); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 4;
    c.fillStyle = ok ? '#2f9e5b' : '#2f7fd1'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.shadowBlur = 0;
    if (ok) { c.strokeStyle = '#fff'; c.lineWidth = r * 0.28; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-r * 0.45, 0); c.lineTo(-r * 0.1, r * 0.38); c.lineTo(r * 0.5, -r * 0.4); c.stroke(); }
    else { c.fillStyle = '#fff'; c.font = `800 ${(r * 1.35).toFixed(1)}px Inter, system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, r * 0.06); }
    c.restore();
  }
  function drawPic(c, p, s) {
    const rx = BUB[0] * s, ry = BUB[1] * s, wish = p.tone === 'wish', gs = guessOf(p), guess = p.tone === 'guess';
    const mo = p.mo, mk = mo ? Math.min(1, (B.S.t - mo.t0) / mo.dur) : 0, name = mo ? (mk < 0.5 ? mo.from : mo.to) : p.pic;   // since k482: flipping over
    c.save(); if (mo) c.scale(1, Math.max(0.03, Math.abs(Math.cos(Math.PI * mk)))); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU);
    const g = c.createRadialGradient(-rx * 0.35, -ry * 0.4, 0, 0, 0, rx); g.addColorStop(0, `rgba(255,255,255,${(0.96 - 0.5 * gs).toFixed(2)})`); g.addColorStop(1, wish ? 'rgba(236,224,255,.9)' : `rgba(244,248,252,${(0.9 - 0.5 * gs).toFixed(2)})`);
    c.fillStyle = g; c.fill(); c.lineWidth = Math.max(1.5, 0.025 * s) * (1 + 0.4 * gs); c.strokeStyle = wish ? WISH : guess ? '#5d6b7c' : '#8a95a3';
    if (gs > 0.02) c.setLineDash([Math.max(4, 0.06 * s) * gs + 0.01, Math.max(3, 0.04 * s) * gs]); c.stroke(); c.setLineDash([]);
    if (name && BILDER[name]) {
      c.save(); c.beginPath(); c.ellipse(0, 0, rx * 0.93, ry * 0.9, 0, 0, TAU); c.clip(); c.globalAlpha *= 1 - 0.5 * gs;
      const bw = rx * 1.55, bh = bw * 0.625; c.translate(-bw / 2, -bh / 2);
      if (!baked.picture(c, name, REDUCED ? 1.5 : B.S.t - p.t0, 0, 0, bw, bh)) { c.scale(bw / 160, bh / 100); BILDER[name](c, REDUCED ? 1.5 : B.S.t - p.t0); }
      c.restore();
    }
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-rx * 0.55, -ry * 0.55, rx * 0.12, ry * 0.07, -0.6, 0, TAU); c.fill();   // the shine
    if (gs > 0.02) { c.fillStyle = `rgba(235,242,250,${(0.35 * gs).toFixed(2)})`; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill(); }   // a veil: only supposed
    if (guess) badge(c, rx * 0.78, -ry * 0.78, Math.max(7, 0.13 * s), p);
    c.restore();
  }
  function drawProp(c, p, Z) {
    const w = where(p), f = set.foot(w.x, w.d), s = Z * f.k;
    const pop = p.pop != null ? Math.min(1, (B.S.t - p.pop) / 0.28) : 1, sc = p.s * (p.show && pop < 1 && !REDUCED ? 0.6 + 0.4 * ease(pop) + Math.sin(Math.PI * pop) * 0.08 : 1);
    const draw = (cc) => {
      cc.save(); cc.translate(f.x + (p.nx || 0), f.y - w.y * s + (p.ny || 0)); cc.rotate(p.rot); cc.scale(w.flip ? -sc : sc, sc);
      if (p.glow > 0 && p.tone !== 'ghost') { cc.shadowColor = `rgba(255,250,215,${Math.min(1, p.glow)})`; cc.shadowBlur = 18 * p.glow; }
      if (p.word != null) { if (w.flip) cc.scale(-1, 1); drawWord(cc, p, s); } else if (p.pic != null) { if (w.flip) cc.scale(-1, 1); drawPic(cc, p, s); } else drawThing(cc, p.thing, s);
      cc.restore();
    };
    c.save(); c.globalAlpha = p.alpha * p.vis;
    // a picture bubble or a word keeps its colours when wished (it glows lilac); a thing turns lilac
    if (p.tone === 'wish' && (p.pic != null || p.word != null)) { c.save(); c.shadowColor = `rgba(180,130,255,${(0.75 + 0.25 * Math.sin(B.S.t * 3)).toFixed(2)})`; c.shadowBlur = 16; draw(c); c.restore(); }
    else if (p.tone === 'guess') { c.save(); if (p.pic == null) c.globalAlpha *= 1 - 0.45 * guessOf(p); draw(c); c.restore(); }   // a guessed thing is see-through until sure
    else if (p.tone) toned(c, p.tone, draw); else draw(c);
    if (p.tone === 'wish' && !REDUCED) {           // a few twinkles around what is only wished
      const [hw, hh] = size(p);
      for (let i = 0; i < 4; i++) {
        const k = (B.S.t * 0.7 + i / 4 + p.ph) % 1, a = p.ph + i * 1.9, r = 1.1 + 0.25 * Math.sin(i * 3.1);
        const sx = f.x + (p.nx || 0) + Math.cos(a) * hw * r * s, sy = f.y - w.y * s + (p.ny || 0) + Math.sin(a) * hh * r * s, rr = (2 + 3 * Math.sin(Math.PI * k)) * (s / 160);
        star(c, sx, sy, Math.max(1.5, rr * 1.4), Math.sin(Math.PI * k));
      }
    }
    if (p.glow > 0 && p.thing && p.tone !== 'ghost') { c.globalAlpha = p.alpha * p.vis * Math.min(1, p.glow) * 0.5; draw(c); }   // a second pass: the glow shines brighter
    c.restore();
  }
  function gold(c, x, y, r, a) {               // a small gold sparkle (the fold's magic)
    c.save(); c.globalAlpha *= Math.max(0, a); c.fillStyle = '#fff3c4'; c.shadowColor = 'rgba(242,201,76,.95)'; c.shadowBlur = r * 3;
    c.beginPath(); for (let i = 0; i < 8; i++) { const q = (i * Math.PI) / 4, rr = i % 2 ? r * 0.32 : r; c.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); } c.closePath(); c.fill(); c.restore();
  }
  function star(c, x, y, r, a) {
    c.save(); c.globalAlpha *= a; c.fillStyle = '#fbf6ff'; c.shadowColor = 'rgba(170,120,255,.9)'; c.shadowBlur = r * 3;
    c.beginPath(); for (let i = 0; i < 8; i++) { const q = (i * Math.PI) / 4, rr = i % 2 ? r * 0.32 : r; c.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr); } c.closePath(); c.fill(); c.restore();
  }
  // a burst: 14 sparkles fly out from where a prop was and fade (0.6 s), a lilac ring widens
  function drawBurst(c, b, Z) {
    const k = (B.S.t - b.t0) / 0.6; if (k >= 1) return false;
    const f = set.foot(b.x, b.d), s = Z * f.k, cx = f.x, cy = f.y - b.y * s, e = 1 - (1 - k) * (1 - k);
    c.save(); c.globalAlpha = 1 - k; c.strokeStyle = WISH; c.lineWidth = Math.max(1.5, 0.03 * s * (1 - k));
    c.beginPath(); c.ellipse(cx, cy, b.r * s * (0.8 + 0.7 * e), b.r * s * (0.6 + 0.5 * e), 0, 0, TAU); c.stroke(); c.restore();
    for (let i = 0; i < 14; i++) { const a = b.seed + (i * TAU) / 14, rr = b.r * s * (0.6 + 1.1 * e) * (0.8 + 0.3 * Math.sin(i * 7.3)); star(c, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8 + e * 0.15 * s, Math.max(2, 0.05 * s), 1 - k); }
    return true;
  }
  // rain: streaks across the whole picture (screen space); `back` lets them rise (time runs backwards)
  const drops = Array.from({ length: 240 }, (_, i) => ({ u: (i * 0.6180339) % 1, v: (i * 0.7548776) % 1, sp: 0.8 + ((i * 0.3819) % 1) * 0.45 }));
  function drawRain(c, Z) {
    const W = set.V.W, H = set.V.H, n = Math.floor(drops.length * Math.min(1, D.rain)), len = 0.22 * Z, dir = D.back ? -1 : 1;
    c.save(); c.strokeStyle = 'rgba(214,226,242,.62)'; c.lineWidth = Math.max(1, 0.012 * Z); c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i < n; i++) {
      const q = drops[i], y = ((((q.v + dir * B.S.t * 0.9 * q.sp) % 1) + 1) % 1) * (H + len) - len, x = q.u * (W + 0.3 * H) - 0.15 * H + (y / H) * 0.15 * H;
      c.moveTo(x, y); c.lineTo(x - len * 0.18, y + len);
    }
    c.stroke(); c.restore();
  }
  // a mark's label on its post (the tape's, the band's), or a little finish flag (flag: true); pops in when new
  function drawMark(c, T, m, i, s, f) {
    const lit = T.lit === i, dimmed = T.lit != null && !lit, px = Math.max(13, 0.17 * s) * (lit ? 1.2 : 1), post0 = (m.flag ? 0.75 : 0.42) * s;
    const pop = m.t0 > 0 ? Math.min(1, (B.S.t - m.t0) / 0.35) : 1, sc = pop < 1 && !REDUCED ? 0.4 + 0.6 * ease(pop) + Math.sin(Math.PI * pop) * 0.12 : 1;
    c.save(); c.translate(f.x, f.y); c.scale(sc, sc); c.globalAlpha = dimmed ? 0.55 : 1;
    c.font = `700 ${px.toFixed(1)}px Inter, system-ui, sans-serif`; const tw = c.measureText(m.t).width + px * 0.9, bh = px * 1.5;
    // the label keeps inside the picture (the fit rule): a flag near the right edge waves to the left of its pole, a
    // label that would still cross an edge slides sideways along it (its post stays on its point of the tape); and
    // labels never cover each other: one that would cover a label drawn before it is lifted above it, on a longer post
    const W = set.V.W, mg = margin(W), fw = tw + px * 1.1;
    const dir = m.flag && f.x + fw > W - mg && f.x - fw >= mg ? -1 : 1, sx = m.flag ? labelShift(f.x + Math.min(0, dir * fw), fw) : 0, lx = m.flag ? 0 : labelShift(f.x - tw / 2, tw);
    const box = m.flag ? { x: f.x + sx + Math.min(0, dir * fw), y: f.y - post0, w: fw, h: bh } : { x: f.x - tw / 2 + lx, y: f.y - post0 - bh, w: tw, h: bh };
    let lift = 0;
    for (let n = 0; n < 6; n++) {
      const hit = labels.find((q) => q.x < box.x + box.w + 3 && box.x < q.x + q.w + 3 && q.y < box.y + box.h + 2 && box.y < q.y + q.h + 2); if (!hit) break;
      const d = box.y + box.h + 3 - hit.y; lift += d; box.y -= d;
    }
    labels.push({ ...box, id: 'mark:' + m.t });
    const post = post0 + lift;
    c.strokeStyle = '#2a2f3a'; c.lineWidth = Math.max(2, 0.02 * s); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -post); c.stroke();
    if (lit) { c.shadowColor = 'rgba(242,201,76,.95)'; c.shadowBlur = 16; }
    if (m.flag) {                                   // a pennant with a chequered edge, the word on it
      const wave = (u) => Math.sin(B.S.t * 3 + u * 4) * bh * 0.07 * u, X = (u) => sx + dir * u * fw;
      c.beginPath(); c.moveTo(X(0), -post); for (let k = 0; k <= 8; k++) c.lineTo(X(k / 8), -post + wave(k / 8)); for (let k = 8; k >= 0; k--) c.lineTo(X(k / 8), -post + bh + wave(k / 8)); c.closePath();
      c.fillStyle = lit ? '#f2c94c' : '#fffcf6'; c.fill(); c.shadowBlur = 0; c.strokeStyle = '#2a2f3a'; c.lineWidth = 1.5; c.stroke();
      c.save(); c.clip(); const sq = bh / 3, q0 = sx + (dir > 0 ? fw - sq * 2 : -fw); for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) { c.fillStyle = (a + b) % 2 ? '#2a2f3a' : '#fffcf6'; c.fillRect(q0 + b * sq, -post + a * sq - bh * 0.05, sq, sq + 1); } c.restore();
      c.fillStyle = '#2a2f3a'; c.textAlign = dir > 0 ? 'left' : 'right'; c.textBaseline = 'middle'; c.fillText(m.t, sx + dir * px * 0.35, -post + bh / 2 + 1);
    } else {
      c.fillStyle = lit ? '#f2c94c' : '#fffcf6'; rounded(c, lx - tw / 2, -post - bh, tw, bh, bh * 0.3); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = '#2a2f3a'; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = '#2a2f3a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(m.t, lx, -post - bh / 2 + 1);
    }
    c.restore();
  }
  // the tape's look 'band' (since k439): a glowing time band on the floor. Behind `now` it is the past (sepia, fading
  // out toward `from`), at `now` a bright marker, ahead the future (pale, fading toward `to`). An arc: a curved arrow
  // above it from `from` back to `to` (a look back from a point in time), growing in 0.9 s, with its label.
  function drawBand(c, T, Z, top) {
    const x1 = T.from + (T.to - T.from) * T.u; if (x1 <= T.from + 0.01) return;
    const a = set.foot(T.from, T.d), b = set.foot(x1, T.d), s = Z * a.k, h = Math.max(7, 0.1 * s), now = T.now ?? (T.from + T.to) / 2, n = set.foot(now, T.d);
    if (top) { drawArc(c, T, s, h); T.marks.forEach((m, i) => { if (m.x <= x1 + 0.01) drawMark(c, T, m, i, s, set.foot(m.x, T.d)); }); return; }
    const span = Math.max(1, set.foot(T.to, T.d).x - a.x), at = (x) => Math.max(0, Math.min(1, (x - a.x) / span));
    c.save();
    const g = c.createLinearGradient(a.x, 0, a.x + span, 0);
    g.addColorStop(0, 'rgba(165,116,63,.25)'); g.addColorStop(Math.max(0, at(n.x) - 0.25), 'rgba(176,124,66,.75)'); g.addColorStop(Math.max(0, at(n.x) - 0.02), 'rgba(242,201,76,.95)');
    g.addColorStop(at(n.x), 'rgba(255,252,235,1)'); g.addColorStop(Math.min(1, at(n.x) + 0.03), 'rgba(205,235,255,.9)'); g.addColorStop(1, 'rgba(205,235,255,.3)');
    c.shadowColor = 'rgba(255,235,170,.8)'; c.shadowBlur = 14; c.fillStyle = g; rounded(c, a.x, a.y - h / 2, b.x - a.x, h, h / 2); c.fill(); c.shadowBlur = 0;
    // little ticks: days gone by and days to come
    c.strokeStyle = 'rgba(42,47,58,.25)'; c.lineWidth = 1; for (let x = Math.ceil(T.from * 2) / 2; x <= x1; x += 0.5) { const q = set.foot(x, T.d).x; c.beginPath(); c.moveTo(q, a.y - h * 0.35); c.lineTo(q, a.y + h * 0.35); c.stroke(); }
    // the bright "now": a glowing ring on the band
    if (now <= x1) { const pr = 1 + 0.12 * Math.sin(B.S.t * 3); c.shadowColor = 'rgba(255,240,180,1)'; c.shadowBlur = 20; c.fillStyle = '#fffdf2'; c.beginPath(); c.ellipse(n.x, n.y, h * 1.5 * pr, h * 0.9 * pr, 0, 0, TAU); c.fill(); c.shadowBlur = 0; c.strokeStyle = '#e0a92a'; c.lineWidth = 2; c.stroke(); }
    c.restore();
  }
  // the band's arc and marks are drawn over the props (labels stay readable)
  function drawArc(c, T, s, h) {
    if (T.arc) {
      const k = REDUCED ? 1 : Math.min(1, (B.S.t - T.arc.t0) / 0.9), p0 = set.foot(T.arc.from, T.d), p1 = set.foot(T.arc.to, T.d), hh = 0.9 * s, cx = (p0.x + p1.x) / 2, top = Math.min(p0.y, p1.y) - hh;
      const pt = (u) => ({ x: (1 - u) * (1 - u) * p0.x + 2 * u * (1 - u) * cx + u * u * p1.x, y: (1 - u) * (1 - u) * (p0.y - h) + 2 * u * (1 - u) * (top - hh * 0.4) + u * u * (p1.y - h) });
      c.save(); c.strokeStyle = '#e0a92a'; c.lineWidth = Math.max(3, 0.035 * s); c.lineCap = 'round'; c.shadowColor = 'rgba(242,201,76,.8)'; c.shadowBlur = 10; c.setLineDash([Math.max(6, 0.08 * s), Math.max(4, 0.05 * s)]);
      c.beginPath(); for (let i = 0; i <= 30; i++) { const q = pt((i / 30) * k); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); } c.stroke(); c.setLineDash([]);
      const e = pt(k), e0 = pt(Math.max(0, k - 0.04)), ang = Math.atan2(e.y - e0.y, e.x - e0.x), ah = Math.max(9, 0.11 * s);
      c.fillStyle = '#e0a92a'; c.beginPath(); c.moveTo(e.x + Math.cos(ang) * ah * 0.6, e.y + Math.sin(ang) * ah * 0.6); c.lineTo(e.x + Math.cos(ang + 2.5) * ah, e.y + Math.sin(ang + 2.5) * ah); c.lineTo(e.x + Math.cos(ang - 2.5) * ah, e.y + Math.sin(ang - 2.5) * ah); c.closePath(); c.fill();
      if (T.arc.t && k > 0.5) {
        const px = Math.max(13, 0.16 * s), mid = pt(0.5); c.globalAlpha = Math.min(1, (k - 0.5) * 3); c.shadowBlur = 0;
        c.font = `700 ${px.toFixed(1)}px Inter, system-ui, sans-serif`; const tw = c.measureText(T.arc.t).width + px, lx = mid.x + labelShift(mid.x - tw / 2, tw);
        labels.push({ x: lx - tw / 2, y: mid.y - px * 1.9, w: tw, h: px * 1.5, id: 'arc:' + T.arc.t });
        c.fillStyle = '#fffcf6'; rounded(c, lx - tw / 2, mid.y - px * 1.9, tw, px * 1.5, px * 0.4); c.fill(); c.strokeStyle = '#e0a92a'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#2a2f3a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(T.arc.t, lx, mid.y - px * 1.15);
      }
      c.restore();
    }
  }
  function drawTape(c, T, Z, top) {
    if (T.look === 'band') return drawBand(c, T, Z, top);
    if (top) return;
    const x1 = T.from + (T.to - T.from) * T.u, a = set.foot(T.from, T.d), b = set.foot(x1, T.d), s = Z * a.k, h = Math.max(5, 0.075 * s);
    if (x1 <= T.from + 0.01) return;
    c.save();
    c.fillStyle = '#f2c94c'; c.strokeStyle = '#b8902e'; c.lineWidth = 1; c.fillRect(a.x, a.y - h / 2, b.x - a.x, h); c.strokeRect(a.x, a.y - h / 2, b.x - a.x, h);
    c.strokeStyle = 'rgba(42,47,58,.75)';
    for (let x = Math.ceil(T.from * 10) / 10; x <= x1; x += 0.1) { const p = set.foot(x, T.d).x, big = Math.abs(x * 2 - Math.round(x * 2)) < 0.01; c.beginPath(); c.moveTo(p, a.y - h / 2); c.lineTo(p, a.y - h / 2 + (big ? h * 0.75 : h * 0.4)); c.stroke(); }
    c.fillStyle = '#d9b24a'; c.beginPath(); c.arc(b.x, b.y, h * 0.9, 0, TAU); c.fill(); c.strokeStyle = '#8a6a1e'; c.stroke();     // the roll
    c.restore();
    T.marks.forEach((m, i) => { if (m.x <= x1) drawMark(c, T, m, i, s, set.foot(m.x, T.d)); });
  }

  B.onFrame.push((t, dt) => {
    // ghosts: a person's canvas is desaturated, brightened toward white, faint, with a soft white glow
    for (const a of Object.values(B.A)) {
      const g = a.ghost || 0; if (a._ghost === g) continue; a._ghost = g;
      a.cv.style.filter = g > 0.005 ? `saturate(${(1 - g).toFixed(2)}) brightness(${(1 + 0.9 * g).toFixed(2)}) opacity(${(1 - 0.72 * g).toFixed(2)}) drop-shadow(0 0 ${(4 * g).toFixed(1)}px rgba(255,255,240,${(0.95 * g).toFixed(2)}))` : '';
    }
    const c = fit(), Z = set.V.cam.z; labels = [];
    for (const [w, r] of riders) { const a = B.A[w], p = P.get(r.id); if (a && p) { a.x = where(p).x + r.dx; a.tx = null; } }
    // the tint: sepia as a filter on the set, the people and the props; a "what if" as a lilac glow (drawn below)
    const sep = D.tone === 'sepia' && D.tint > 0.005 ? `sepia(${(0.85 * D.tint).toFixed(2)}) saturate(${(1 - 0.15 * D.tint).toFixed(2)})` : '';
    if (sep !== D._f) { D._f = sep; for (const el of [document.getElementById('bg'), document.getElementById('people'), document.getElementById('fg'), cv]) if (el) el.style.filter = sep; }
    for (const p of P.values()) {
      p.vis += ((p.show ? 1 : 0) - p.vis) * Math.min(1, dt * 9);
      if (p.word != null || p.pic != null) {
        const [tx, ty] = nudgeTo(p), e = p.nx == null || p.vis < 0.05 ? 1 : Math.min(1, Math.max(dt, 0.016) * 8);
        p.nx = (p.nx || 0) + (tx - (p.nx || 0)) * e; p.ny = (p.ny || 0) + (ty - (p.ny || 0)) * e;
      } else p.nx = p.ny = 0;
      if (p.mv && !p.mv.done) {
        const mv = p.mv, k = Math.min(1, (B.S.t - mv.t0) / mv.dur), e = mv.ease(k);
        for (const f of Object.keys(mv.to)) p[f] = mv.from[f] + (mv.to[f] - mv.from[f]) * e;
        if (k >= 1) mv.done = true;
      }
    }
    if (tape) drawTape(c, tape, Z);
    [...P.values()].filter((p) => p.vis > 0.01).sort((p, q) => where(p).d - where(q).d).forEach((p) => drawProp(c, p, Z));
    if (tape) drawTape(c, tape, Z, true);
    for (let i = bursts.length - 1; i >= 0; i--) if (!drawBurst(c, bursts[i], Z)) bursts.splice(i, 1);
    if (D.rain > 0.005) drawRain(c, Z);
    if ((D.tone === 'wish' || D.tone === 'future') && D.tint > 0.005) {
      // a "what if": lilac from the edges; ahead in time (since k439): a pale blue-white glow from the edges, a little brighter
      const W = set.V.W, H = set.V.H, a = D.tint, rgb = D.tone === 'wish' ? '170,120,255' : '175,225,255', g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) / 2);
      g.addColorStop(0, `rgba(${rgb},${(0.06 * a).toFixed(3)})`); g.addColorStop(1, `rgba(${rgb},${(0.5 * a).toFixed(3)})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (D.tone === 'future') { c.fillStyle = `rgba(255,255,255,${(0.08 * a).toFixed(3)})`; c.fillRect(0, 0, W, H); }
    }
    if (D.dim > 0.001) { c.fillStyle = `rgba(8, 12, 28, ${(0.8 * D.dim).toFixed(3)})`; c.fillRect(0, 0, set.V.W, set.V.H); }
  });
  return { prop, move, morph, tape: setTape, dim, ghost, pop, ride, rain, tint, sure, clear, P, boxes, get tapeState() { return tape; }, D };
}
