/* The bake (tools/bake-scene-assets.html, run by tools/bake-scene-assets.cjs): draws the stage's pictures, animals and
   sets with their own live code and saves them as WebP sheets plus JSON manifests in assets/scene/
   (format: docs/scene-assets.md). Then it draws the same moments again, live and from the baked files through the
   reference player (bake-scene-assets.player.js), and saves the comparison as .local/scene-assets-check.jpg.
   The live code is imported unchanged. The two sets keep their drawing parts inside createWerkstatt/createVillage,
   so they are loaded through a thin wrapper that adds those parts to the returned object (importPatched). */
import { BILDER, ICONS } from '/grammatik/buehne/bilder.js';
import { createFx, THINGS, CASE } from '/grammatik/buehne/tiere.js';
import { createWerkstatt as liveWerkstatt, SPOTS } from '/grammatik/buehne/sets/werkstatt.js';
import { createVillage as liveVillage, PLACES, BRIDGE } from '/grammatik/dorf/village.js';
import { createSee as liveSee, SPOTS as SEE_SPOTS, BRIDGE as SEE_BRIDGE, HOUSE } from '/grammatik/buehne/sets/see.js';
import { createWohnung as liveWohnung, SPOTS as WOHNUNG_SPOTS } from '/grammatik/buehne/sets/wohnung.js';
import { createRedaktion as liveRedaktion, SPOTS as REDAKTION_SPOTS, CLOCK as REDAKTION_CLOCK, SCREEN as REDAKTION_SCREEN, PRESS as REDAKTION_PRESS, DESK as REDAKTION_DESK } from '/grammatik/buehne/sets/redaktion.js';
import * as PL from './bake-scene-assets.player.js';

const TAU = Math.PI * 2, PI = Math.PI;
const Q = new URLSearchParams(location.search), ONLY = new Set((Q.get('only') || 'bilder,tiere,sets,check').split(','));
const SET = Q.get('set');            // --set <name>: bake (and check) only that set
const OUT = 'assets/scene/';
const REF_H = 673, DPR = 2, Z_CSS = (REF_H * 0.8) / 2.75, ZB = Z_CSS * DPR;   // the site's picture height; device px per metre
/* The set images reach TOP_M metres above the ground line (the reference picture shows 2.75 m; close-ups lift the camera
   and show the lamp, the beams and the top of the wall) and as far below it as the reference picture (0.2 × 673 px). */
const TOP_M = 4, GY_IMG = Math.round(TOP_M * ZB), GY_CSS = GY_IMG / DPR, H_CSS = GY_CSS + Math.round(0.2 * REF_H * DPR) / DPR, H_IMG = H_CSS * DPR;
const r3 = (v) => Math.round(v * 1e3) / 1e3, r4 = (v) => Math.round(v * 1e4) / 1e4, r8 = (v) => Math.round(v * 1e8) / 1e8;
const report = { seams: {}, checks: {}, bytes: {} };

/* ---------- small tools ---------- */
const lines = [];
const log = (...a) => { const s = a.join(' '); lines.push(s); document.getElementById('log').textContent = lines.join('\n'); console.log(s); };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const ctx = (cv) => cv.getContext('2d', { willReadFrequently: true });
async function save(path, body) { const r = await fetch('/__save?path=' + encodeURIComponent(path), { method: 'POST', body }); if (!r.ok) throw Error('save ' + path); }
const encode = (cv, type, q) => new Promise((ok) => cv.toBlob(ok, type, q));
async function saveWebp(rel, cv, q) { const b = await encode(cv, 'image/webp', q); await save(OUT + rel, b); report.bytes[rel] = b.size; return b.size; }
const saveJson = (rel, o) => save(OUT + rel, JSON.stringify(o, null, 1));
const load = (src) => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(Error('load ' + src)); i.src = src; });

// the tight box (with a margin) of everything drawn on a canvas; null when empty
function bbox(cv, pad = 2, region) {
  const [rx, ry, rw, rh] = region || [0, 0, cv.width, cv.height], d = ctx(cv).getImageData(rx, ry, rw, rh).data;
  let x0 = rw, y0 = rh, x1 = -1, y1 = -1;
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) if (d[(y * rw + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const bx = Math.max(rx, rx + x0 - pad), by = Math.max(ry, ry + y0 - pad);
  return { x: bx, y: by, w: Math.min(rx + rw, rx + x1 + 1 + pad) - bx, h: Math.min(ry + rh, ry + y1 + 1 + pad) - by };
}
const union = (a, b) => !a ? b : !b ? a : (() => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }; })();
// how different two same-sized drawings are, both laid on white: mean |difference| (0–255) and the share of pixels
// that differ visibly (any channel by more than 40)
function diff(a, b) {
  const w = a.width, h = a.height, flat = (cv) => { const o = canvas(w, h), c = ctx(o); c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.drawImage(cv, 0, 0, w, h); return c.getImageData(0, 0, w, h).data; };
  const p = flat(a), q = flat(b); let sum = 0, bad = 0;
  for (let i = 0; i < p.length; i += 4) { const d0 = Math.abs(p[i] - q[i]), d1 = Math.abs(p[i + 1] - q[i + 1]), d2 = Math.abs(p[i + 2] - q[i + 2]); sum += d0 + d1 + d2; if (Math.max(d0, d1, d2) > 40) bad++; }
  return { mean: r3(sum / (w * h * 3)), visible: r4(bad / (w * h)) };
}
// a sheet: n frames of fw × fh, left to right, wrapping into rows so no side passes WebP's 16383 px
async function sheet(rel, n, fw, fh, draw, q) {
  const cols = Math.min(n, Math.floor(16383 / fw)), rows = Math.ceil(n / cols), cv = canvas(cols * fw, rows * fh), c = cv.getContext('2d');
  for (let i = 0; i < n; i++) { c.save(); c.translate((i % cols) * fw, Math.floor(i / cols) * fh); c.beginPath(); c.rect(0, 0, fw, fh); c.clip(); draw(c, i); c.restore(); }
  const bytes = await saveWebp(rel, cv, q);
  return { file: rel, frames: n, cols, rows, bytes };
}
// a loop: how far frame 0 is from the frame one loop later (0 = a perfect loop)
function seam(draw, w, h, T) { const a = canvas(w, h), b = canvas(w, h); draw(a.getContext('2d'), 0); draw(b.getContext('2d'), T); return diff(a, b).mean; }
// a 2D context that only lets some fills and strokes through (to split one drawing function into two images)
function filtered(c, keep) {
  return new Proxy(c, {
    get(o, k) { const v = o[k]; if (typeof v !== 'function') return v; if (['fill', 'stroke', 'fillRect', 'strokeRect', 'fillText'].includes(k)) return (...a) => (keep(k, o) ? v.apply(o, a) : undefined); return v.bind(o); },
    set(o, k, v) { o[k] = v; return true; },
  });
}
// loads a set module with its inner drawing functions exposed: the source is fetched as it is, its relative import is
// made absolute, and the names are added to the object createX returns. Fails loudly if the code no longer fits.
async function importPatched(url, names) {
  let src = await (await fetch(url, { cache: 'no-store' })).text();
  src = src.replace(/from '\.\.\/bilder\.js'/, `from '${location.origin}/grammatik/buehne/bilder.js'`);
  const re = /return \{ V, size, setCam, draw, foot,/;
  if (!re.test(src)) throw Error('wrapper: the return line of ' + url + ' changed; update importPatched');
  src = src.replace(re, `return { __bake: { ${names.join(', ')} }, V, size, setCam, draw, foot,`);
  return import(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
}
const frameCount = (loop) => Math.min(48, Math.max(16, 16 * Math.ceil(loop / 2 - 1e-9)));   // ≥ 16, and ≥ 8 fps for long loops

/* ============ 1. the pictures of meaning (bilder.js) ============ */
/* Loop lengths read from each picture's code (seconds). Where the motions do not share a period, the loop follows the
   main motion and the seam (report.seams) says how far the others are off. No entry: 2 s. A picture that does not
   change with t gets one frame. */
const PIC_LOOP = {
  schluessel: TAU / 1.6,       // the magnifying glass circles at 1.6 rad/s (the key's wobble, 3 rad/s, is 1.9 swings)
  kaffee: 1 / 0.6,             // steam: (t · 0.6 + i / 3) % 1
  suppe: TAU / 3,              // the ladle stirs at 3 rad/s (steam 1.67 s, flames 0.45 s do not divide it)
  zusammen: TAU / 3,           // the same pot with two ladles
  reparieren: 2.4,             // t % 2.4
  aufstehen: 4,                // t % 4
  saegen: (4 * TAU) / 7,       // 4 saw strokes (7 rad/s) = 5.03 sawdust falls (1 / 1.4 s)
  malen: 4,                    // t % 4
  rauchen: 1 / 0.6,            // steam
  aufraeumen: 3,               // t % 3
  fenster: 3.5,                // t % 3.5
  essen: 1.5,                  // the minute hand: (t · 40) % 60 (steam 1.67 s is 0.9 of it)
  telefonieren: TAU / 20,      // the phone shakes at 20 rad/s
  tanzen: (2 * TAU) / 6,       // two dance swings (6 rad/s) = 1.05 note rises (2 s)
  helfen: TAU / 3,             // the plank bobs at 3 rad/s
  schwimmen: TAU,              // the swimmer drifts with sin(t); the arm (5 rad/s) turns 5 times
  pfannkuchen: 2,              // t % 2
  putzen: TAU,                 // sponge 5 rad/s and bubbles 3 rad/s meet after 2π
  fit: PI / 2.5,               // |sin(2.5 t)|
  // the B2–C1 films (Passiv, k99)
  gestohlen: 4,                // t % 4
  kuchen: 1 / 0.6,             // steam
  muell: 4,                    // t % 4 (the truck drives through)
  stromausfall: 4,             // t % 4
  // the Futur II film (k439)
  vergessen: 2.5,              // t % 2.5
  meeresspiegel: 3,            // t % 3
  abgabe: 2.5,                 // t % 2.5
  drehkreuz: 3,                // t % 3
  bericht: 2.5,                // t % 2.5
  regennacht: 110 / 60,        // two falls of the rain ((i·23 + 120 t) % 110)
  // the Nominalstil film (k482)
  sanierung: 3, vulkan: 3, wohnungsbau: 3, vorhang: 3, schiff: 3,   // t % 3
  katzerettung: 2.5, katzeheld: 2.5, grillmenge: 2.5,               // t % 2.5
};
function isStill(draw, w, h) {
  const ref = canvas(w, h); draw(ref.getContext('2d'), 0); const a = ctx(ref).getImageData(0, 0, w, h).data;
  for (const t of [0.37, 1.13, 2.71, 4.4]) { const o = canvas(w, h); draw(o.getContext('2d'), t); const b = ctx(o).getImageData(0, 0, w, h).data; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; }
  return true;
}
async function bakeBilder() {
  const man = { version: 1, box: [160, 100], scale: 2, frame: [320, 200], reducedMotionT: 1.5, pictures: {}, icons: { box: [28, 28], size: [56, 56], files: {} } };
  for (const name of Object.keys(BILDER)) {
    const draw = (c, t) => { c.save(); c.scale(2, 2); BILDER[name](c, t); c.restore(); };
    const still = isStill(draw, 320, 200), loop = still ? 0 : (PIC_LOOP[name] ?? 2), frames = still ? 1 : frameCount(loop);
    const s = await sheet(`bilder/${name}.webp`, frames, 320, 200, (c, i) => draw(c, (i * loop) / frames), +(Q.get('q') || 0.8));
    const e = { file: s.file, frames, cols: s.cols, rows: s.rows };
    if (still) e.still = true; else { Object.assign(e, { loop: r8(loop), fps: r3(frames / loop) }); e.stillFrame = PL.loopFrame(e, man.reducedMotionT); report.seams['bilder/' + name] = seam(draw, 320, 200, loop); }
    if (!(name in PIC_LOOP) && !still) e.defaultLoop = true;
    man.pictures[name] = e;
    log(`  bilder/${name}: ${still ? 'still' : frames + ' frames over ' + loop.toFixed(3) + ' s'}, ${(s.bytes / 1024).toFixed(1)} KB`);
  }
  for (const k of Object.keys(ICONS)) {
    const cv = canvas(56, 56), c = cv.getContext('2d'); c.scale(2, 2); ICONS[k](c);
    await saveWebp(`icons/${k}.webp`, cv, 1); man.icons.files[k] = `icons/${k}.webp`;
  }
  await saveJson('bilder.json', man);
  return man;
}

/* ============ 2. the animals (tiere.js) ============ */
// createFx needs a stage: a set with foot() and a camera, frame hooks, and the two canvases #fxb / #fx
const SW = 1400, SH = 1000, FX = 700, FY = 760;           // scratch canvas, where the feet stand
let FXK;
function fxKit() {
  if (FXK) return FXK;
  for (const id of ['fxb', 'fx']) { const c = document.createElement('canvas'); c.id = id; document.body.append(c); }
  const set = { V: { W: SW, H: SH, dpr: 1, cam: { x: 0, z: ZB } }, foot: () => ({ x: FX, y: FY, k: 1 }) };
  const B = { set, onFrame: [], occupiers: [], until: async () => {}, wait: async () => {}, S: { t: 0 } };
  const fx = createFx(B), A = { dog: fx.animal('dog', 'dog'), cat: fx.animal('cat', 'cat'), ball: fx.animal('ball', 'ball') };
  return (FXK = { B, fx, A, cv: document.getElementById('fx') });
}
// draw one animal in one state on #fx; shadow: false draws it without the ground shadow (a tiny raise skips it)
function renderAnimal(kind, o, shadow = false) {
  const { B, fx, A, cv } = fxKit();
  for (const [k, a] of Object.entries(A)) { a.alpha = k === kind ? 1 : 0; a.show = k === kind; }
  fx.F.birds = null; fx.F.pack = null; fx.F.flyers = []; fx.F.rings = [];
  Object.assign(A[kind], { t: o.t, running: !!o.run, mood: o.mood || 'idle', hop: o.hop || 0, spin: o.spin || 0, raise: shadow ? 0 : 1e-9, left: false, look: 0, tx: null });
  B.onFrame[0](o.t, 0); return cv;
}
const HOP_FRAMES = 10;
// the states baked per kind. loop: seconds; t0: where the strip starts. walk/scared are not separate drawings in
// tiere.js (see 'same'): walking draws the idle pose gliding, and only the 'happy' mood changes the drawing.
const ANIMALS = {
  dog: {
    idle: { loop: (3 * TAU) / 7, frames: 32, note: 'three tail wags at 7 rad/s; breathing (2.2 rad/s) and the ear (2.4 rad/s) nearly loop with them' },
    happy: { loop: (7 * TAU) / 16, frames: 32, mood: 'happy', note: 'seven fast wags at 16 rad/s, tongue out' },
    run: { loop: (3 * TAU) / 13, frames: 24, run: true, note: 'three strides at 13 rad/s; the ear flap (14.3 rad/s) is a little off at the seam' },
    hop: { hop: true, frames: HOP_FRAMES },
    walk: { same: 'idle', note: 'tiere.js has no walk cycle: a walking animal is drawn in its idle pose while it moves' },
    scared: { same: 'idle', running: 'run', note: 'jagd sets mood "scared" but tiere.js draws only "happy" differently: scared looks like idle (run while running)' },
  },
  cat: {
    idle: { loop: 3.7, frames: 32, note: 'one blink every 3.7 s (at the loop start); the tail sway (1.6 rad/s) is 0.94 of it' },
    run: { loop: (2 * TAU) / 14, frames: 16, run: true, t0: 0.5, note: 'two strides at 14 rad/s, eyes open' },
    hop: { hop: true, frames: HOP_FRAMES, t0: 0.5 },
    walk: { same: 'idle', note: 'no walk cycle in tiere.js (glides in its idle pose)' },
  },
  ball: {
    idle: { still: true },
    walk: { roll: true, frames: 16, note: 'one full turn; advance by distance: frame = (spin / 2π mod 1) × frames, spin = distance / 0.12 m' },
    run: { loop: PI / 7, frames: 16, run: true, note: 'bounce |sin(7 t)| × 0.14 m with the spin of the default run speed (2.02 turns per loop)' },
    hop: { hop: true, frames: HOP_FRAMES },
  },
};
function animalFrame(kind, st, K, i) {
  const t0 = st.t0 || 0;
  if (st.still) return { t: 0 };
  if (st.roll) return { t: 0, spin: (i / st.frames) * TAU };
  if (st.hop) { const tau = i / (st.frames * K.hopDecay); return { t: t0 + tau, hop: 1 - i / st.frames }; }
  const t = t0 + (i * st.loop) / st.frames; return { t, run: st.run, mood: st.mood, spin: st.run && kind === 'ball' ? (K.run / 0.12) * t : 0 };
}
async function bakeTiere() {
  const { A, fx, B, cv } = fxKit();
  const man = { version: 1, pxPerMetre: r4(ZB), faces: 'right', note: 'feet at foot; scale = (z × k) / pxPerMetre; mirror for left; animals draw in front of the people', kinds: {} };
  for (const [kind, states] of Object.entries(ANIMALS)) {
    const K = { ...A[kind].K, hopDecay: 2.4 };
    // one frame size for all the kind's states: the union of every frame's box
    let box = null;
    for (const st of Object.values(states)) { if (st.same) continue; const n = st.frames || 1; for (let i = 0; i < n; i++) box = union(box, bbox(renderAnimal(kind, animalFrame(kind, st, K, i)), 3)); }
    const fw = box.w, fh = box.h, E = {
      height: K.h, speed: K.speed, runSpeed: K.run, ring: K.ring, frame: [fw, fh], foot: [FX - box.x, FY - box.y],
      shadow: { rx: r4(K.h * (kind === 'ball' ? 0.45 : 0.62)), ry: 0.04, color: 'rgba(40,60,30,.18)' },
      hop: { lift: kind === 'ball' ? 0.25 : 0.18, decay: K.hopDecay, duration: r4(1 / K.hopDecay) }, states: {},
    };
    for (const [name, st] of Object.entries(states)) {
      if (st.same) { E.states[name] = { same: st.same, ...(st.running ? { running: st.running } : {}), note: st.note }; continue; }
      const n = st.frames || 1;
      const s = await sheet(`tiere/${kind}-${name}.webp`, n, fw, fh, (c, i) => c.drawImage(renderAnimal(kind, animalFrame(kind, st, K, i)), box.x, box.y, fw, fh, 0, 0, fw, fh), 0.92);
      const e = { file: s.file, frames: n, cols: s.cols, rows: s.rows };
      if (st.loop) { Object.assign(e, { loop: r8(st.loop), fps: r3(n / st.loop) }); report.seams[`tiere/${kind}-${name}`] = seam((c, t) => c.drawImage(renderAnimal(kind, { ...animalFrame(kind, st, K, 0), t: (st.t0 || 0) + t, spin: st.run && kind === 'ball' ? (K.run / 0.12) * t : 0 }), 0, 0), SW, SH, st.loop); }
      if (st.hop) Object.assign(e, { once: true, duration: E.hop.duration, fps: r3(n * K.hopDecay), note: 'the lift is in the frames; afterwards back to idle' });
      if (st.roll) Object.assign(e, { advance: 'distance', metresPerLoop: r4(TAU * 0.12) });
      if (st.note) e.note = st.note;
      E.states[name] = e;
      log(`  tiere/${kind}-${name}: ${n} frames ${fw}×${fh}, ${(s.bytes / 1024).toFixed(1)} KB`);
    }
    man.kinds[kind] = E;
  }

  // birds: one bird (number 0 of the flock, held still) flapping; the flock is laid out by the player
  const BY = 0.5, birdAt = (dt) => { for (const a of Object.values(A)) { a.alpha = 0; a.show = false; } fx.F.pack = null; fx.F.flyers = []; fx.F.birds = { x0: 3 - 0.9 * dt, y: BY - Math.sin(dt * 1.4) * 0.05, t0: 0 }; B.onFrame[0](dt, 0); return cv; };
  const bl = TAU / 9, bn = 16, ax = FX, ay = FY - BY * ZB, win = [ax - 0.2 * ZB, ay - 0.2 * ZB, 0.4 * ZB, 0.4 * ZB].map(Math.round);
  let bb = null; for (let i = 0; i < bn; i++) bb = union(bb, bbox(birdAt((i * bl) / bn), 2, win));
  const bs = await sheet('tiere/bird-fly.webp', bn, bb.w, bb.h, (c, i) => c.drawImage(birdAt((i * bl) / bn), bb.x, bb.y, bb.w, bb.h, 0, 0, bb.w, bb.h), 0.92);
  man.birds = { file: bs.file, frames: bn, cols: bs.cols, rows: bs.rows, loop: r8(bl), fps: r3(bn / bl), frame: [bb.w, bb.h], anchor: [r3(ax - bb.x), r3(ay - bb.y)],
    flock: { count: 5, start: -3, speed: 0.9, gap: 0.45, jitter: [3.1, 0.2], rows: [1.7, 0.25], bob: [1.4, 0.05], phase: 1.3, flapRate: 9,
      note: 'bird i at wx = x0 + start + speed·dt + gap·i + jitter[1]·sin(jitter[0]·i), height wy = y + rows[1]·sin(rows[0]·i) + bob[1]·sin(bob[0]·dt + i) metres above the line d = -1, flap frame at time dt + i·phase/flapRate' } };
  report.seams['tiere/bird-fly'] = seam((c, t) => c.drawImage(birdAt(t), 0, 0), SW, SH, bl);

  // the backpack: one frame per fill (0 … 4), drawn with its shadow
  const packAt = (fill) => { for (const a of Object.values(A)) { a.alpha = 0; a.show = false; } fx.F.birds = null; fx.F.flyers = []; fx.F.pack = { x: 0, d: 0, fill, shake: 0 }; B.onFrame[0](0, 0); return cv; };
  let pb = null; for (let f = 0; f <= 4; f++) pb = union(pb, bbox(packAt(f), 2));
  const ps = await sheet('tiere/pack.webp', 5, pb.w, pb.h, (c, i) => c.drawImage(packAt(i), pb.x, pb.y, pb.w, pb.h, 0, 0, pb.w, pb.h), 0.92);
  man.pack = { file: ps.file, frames: 5, cols: ps.cols, rows: ps.rows, frame: [pb.w, pb.h], foot: [FX - pb.x, FY - pb.y], state: 'fill', values: [0, 1, 2, 3, 4],
    shake: { amp: 0.03, w: 40, drop: 0.03, note: 'rotate by amp·shake·sin(w·t) about the foot; shake starts at 1 and drops by 0.03 per drawn frame' } };
  fx.F.pack = null;

  // the things for the backpack: stills centred on their middle
  man.things = {};
  for (const k of Object.keys(THINGS)) {
    const o = canvas(SW, SH), c = o.getContext('2d'); c.translate(FX, FY - 300); c.scale(ZB, ZB); THINGS[k](c);
    const b = bbox(o, 2), t = canvas(b.w, b.h); t.getContext('2d').drawImage(o, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    await saveWebp(`tiere/thing-${k}.webp`, t, 0.92);
    man.things[k] = { file: `tiere/thing-${k}.webp`, size: [b.w, b.h], centre: [FX - b.x, FY - 300 - b.y] };
  }
  // the case rings: simple shapes, no image
  man.rings = { cases: CASE, radius: 'kinds[kind].ring for an animal, the figure height C.m × 0.2 for a person (metres)', ry: 0.3,
    pulse: { amp: 0.25, w: 12, decay: 1.5 }, lineWidth: { min: 2.5, perMetre: 0.035 }, glow: { blur: 8, pulse: 10 }, fade: 5,
    badge: { at: [0.78, 0.75], radius: { min: 9, perMetre: 0.085 }, border: 0.16, font: '800, 1.15 × radius, Inter' },
    note: 'ellipse at the feet, rx = radius·z·k·(1 + amp·pulse·sin(w·t)), ry = rx × 0.3; back half (π…2π) filled with soft and stroked behind the people, front half stroked in front; a letter badge at the front right' };
  await saveJson('tiere.json', man);
  return man;
}

/* ============ 3. the sets ============ */
async function setBase(create, world, H = H_CSS, gy = GY_CSS) {
  const camX = (world[0] + world[1]) / 2, Wcss = Math.round((world[1] - world[0]) * Z_CSS * DPR) / DPR, W = Wcss * DPR;
  // setCam puts the ground at 0.8 H + ty·z: ty moves it to gy
  const bg = canvas(1, 1), fg = canvas(1, 1), S = create(bg, fg); S.size(Wcss, H, DPR); S.setCam(camX, Z_CSS, (gy - 0.8 * H) / Z_CSS);
  const layer = (fns, t = 0) => { const cv = canvas(W, H * DPR), c = cv.getContext('2d'); c.setTransform(DPR, 0, 0, DPR, 0, 0); for (const f of fns) f(c, t); return cv; };
  return { S, K: S.__bake, V: S.V, bg, fg, camX, W, layer };
}
// saves a whole-set image cropped to what it holds
// res < 1 stores a smooth image (a light, a gradient) smaller; the player still draws it into the box w × h
async function cropSave(rel, cv, q = 0.88, res = 1) {
  const b = bbox(cv, 1); const o = canvas(b.w * res, b.h * res), oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high'; oc.drawImage(cv, b.x, b.y, b.w, b.h, 0, 0, o.width, o.height);
  const bytes = await saveWebp(rel, o, q); log(`  ${rel}: ${o.width}×${o.height}${res < 1 ? ' (box ' + b.w + '×' + b.h + ')' : ''}, ${(bytes / 1024).toFixed(0)} KB`);
  return { file: rel, x: b.x, y: b.y, w: b.w, h: b.h, ...(res < 1 ? { res } : {}) };
}
// a sheet of drawings that all happen on the set canvas, cropped to the union of their boxes
async function cropSheet(rel, n, render, q = 0.88) {
  let b = null; for (let i = 0; i < n; i++) b = union(b, bbox(render(i), 1));
  const s = await sheet(rel, n, b.w, b.h, (c, i) => c.drawImage(render(i), b.x, b.y, b.w, b.h, 0, 0, b.w, b.h), q);
  log(`  ${rel}: ${n} × ${b.w}×${b.h}, ${(s.bytes / 1024).toFixed(0)} KB`);
  return { file: rel, x: b.x, y: b.y, frame: [b.w, b.h], frames: n, cols: s.cols, rows: s.rows };
}
const depthSpec = { front: 0.55, back: 1.05, backDepth: 2.6, kBack: 0.06, note: 'feet at depth d: y = ground + d·front·z (d ≥ 0) or ground + back·z·max(-1, d / backDepth) (d < 0); size factor k = 1 + kBack·d for d < 0' };

async function bakeWerkstatt() {
  const WS = await importPatched('/grammatik/buehne/sets/werkstatt.js', ['wall', 'shelf', 'windowFrame', 'toolWall', 'planksLeaning', 'door', 'floor', 'stool', 'benchBack', 'casements', 'sign', 'lampAndDust', 'benchFront', 'floorBits', 'broom', 'X', 'm', 'Yd', 'WX', 'WY', 'wallBase', 'shavings', 'dust', 'P']);
  const { K, V, camX, W, layer } = await setBase(WS.createWerkstatt, [-10, 7]);
  Object.assign(V, { win: 0, sign: null, signPic: null, signGlow: 0, sweep: null, t: 0 });
  const d = (v) => v * DPR, P = K.P, items = {}, dir = 'sets/werkstatt/';
  log('werkstatt: ' + W + '×' + H_IMG);
  items.wall = { type: 'image', parallax: P, extend: 'up', ...(await cropSave(dir + 'wall.webp', layer([K.wall, K.shelf, K.windowFrame, K.toolWall, K.planksLeaning, K.door]))) };
  items.floor = { type: 'image', parallax: 1, extend: 'down', ...(await cropSave(dir + 'floor.webp', layer([K.floor, K.stool, K.benchBack]))) };
  items.shavings = { type: 'shavings', parallax: 1, ...(await cropSave(dir + 'shavings.webp', layer([K.floorBits]))), originX: r3(d(K.X(0))),
    items: K.shavings.map((s) => [r4(s.x), r4(s.d), r4(s.a), r4(s.s)]), stroke: 'rgba(240,205,150,.9)', lineWidth: 0.012, arc: [0.3, r4(TAU - 0.6)],
    pile: { dx: 0.25, d: 0.2, rx: [0.08, 0.004], ry: [0.03, 0.0015], color: '#e8c48c' },
    note: 'no sweep: the image. While sweeping (state sweep = the broom\'s x in metres) draw each shaving [x, d, angle, size] right of the broom as an elliptic arc (radii size and 0.45·size metres) and the pile: upper half-ellipse at x = sweep + dx, depth d, radii rx[0] + n·rx[1], ry[0] + n·ry[1] for n swept shavings' };
  const winValues = Array.from({ length: 11 }, (_, i) => i / 10);
  items.window = { type: 'states', parallax: P, state: 'win', values: winValues, note: 'the casements: 0 shut … 1 open', ...(await cropSheet(dir + 'window.webp', winValues.length, (i) => { V.win = winValues[i]; return layer([K.casements]); })) };
  V.win = 0;
  const glow = [0, 0.2, 0.4, 0.6, 0.8, 1];
  V.sign = '';
  items.sign = { type: 'states', parallax: P, state: 'signGlow', when: 'sign', values: glow, ...(await cropSheet(dir + 'sign.webp', glow.length, (i) => { V.signGlow = glow[i]; return layer([K.sign]); })) };
  V.signGlow = 0;
  // where the player puts the sign's picture and words (metres, from the sign board's top centre: SPOTS.sign on the wall, height 1.68)
  const sx = K.WX(SPOTS.sign), sy = K.WY(1.68), sw = K.m(1.35), sh = K.m(0.62), ps = (sh * 0.86) / 100, mm = (v) => r4(v / Z_CSS);
  Object.assign(items.sign, { board: { centre: [r3(d(sx)), r3(d(sy))], w: 1.35, h: 0.62 },
    pic: { left: mm(-sw / 2 + K.m(0.04) - 40 * ps), top: mm(sh * 0.07), scale: r8(0.0086 * 0.62), note: 'a picture of meaning (bilder.json, 160 × 100 box) at left/top metres from the board\'s top centre, 1 box unit = scale metres' },
    text: { font: 'Inter, system-ui, sans-serif', size: 0.12, weights: [500, 700], colors: ['#3a2a1a', '#2f7d5b'], bold: ['{v:…}', '{t:…}'], fit: 0.9, shrink: 0.92, lines: 'one line, or two split where the halves are closest in width; shrink by 0.92 until every line fits fit × the text width', box: { withPic: { w: mm(sw - 80 * ps - K.m(0.08)), cx: mm(sw / 2 - (sw - 80 * ps - K.m(0.08)) / 2 - K.m(0.02)) }, withoutPic: { w: 1.35, cx: 0 } }, y: { one: 0.5, two: [0.32, 0.7] } },
    note: 'state sign: null = no sign, "" = the empty board; the board and its glow are baked, the picture and words are drawn by the player' });
  V.sign = null;
  items.front = { type: 'image', parallax: 1, ...(await cropSave(dir + 'front.webp', layer([K.benchFront]))) };
  V.sweep = 0; const bb = await cropSave(dir + 'broom.webp', layer([(c) => K.broom(c, 0)])); V.sweep = null;
  items.broom = { type: 'pivot', parallax: 1, state: 'sweep', hideAbove: 6.5, ...bb, pivot: [r3(d(K.X(0))), r3(d(K.Yd(0.2)))], angle: { baked: -0.35, base: -0.35, amp: 0.15, w: 10 },
    note: 'baked at sweep = 0; move the pivot by sweep metres and rotate the image about it by base + amp·sin(w·t) - baked' };
  // the lamp: its light (the one gradient fill) and the lamp itself, without the dust
  const saved = K.dust.splice(0);
  const lampPart = (light) => layer([(c) => K.lampAndDust(filtered(c, (op, o) => (o.fillStyle instanceof CanvasGradient) === light && (light ? op === 'fill' : true)), 0)]);
  items.light = { type: 'image', parallax: P, sway: { amp: 0.02, w: 0.7 }, ...(await cropSave(dir + 'light.webp', lampPart(true), 0.85, 0.5)) };
  items.lamp = { type: 'image', parallax: P, sway: { amp: 0.02, w: 0.7 }, extend: 'up', ...(await cropSave(dir + 'lamp.webp', lampPart(false))), note: 'the cord runs up to the top of the picture (extend up)' };
  K.dust.push(...saved);
  items.dust = { type: 'particles', parallax: P, from: 'lamp', origin: [r3(d(K.X(-0.4, P))), r3(d(K.WY(3.05) + K.m(0.25)))], items: K.dust.map((q) => [r4(q.u), r4(q.v), r4(q.ph), r4(q.sp)]),
    spread: 2.4, drift: [0.8, 0.05], drop: 0.2, rgb: '255,245,210', alpha: 0.55, radius: 0.008, minRadius: 0.8,
    note: 'dust in the lamp light: u = (u0 + t·sp) mod 1; x = lamp + (v - 0.5)·spread·u + drift[1]·sin(drift[0]·t + ph); y = lamp + drop + u·(ground - lamp); alpha·sin(πu); radius max(radius m, minRadius CSS px)' };
  const man = { name: 'werkstatt', version: 1, pxPerMetre: r4(ZB), refHeight: REF_H, top: TOP_M, scale: DPR, width: W, height: H_IMG, groundY: GY_IMG, camX, world: [-10, 7],
    depth: depthSpec, spots: SPOTS, items, back: ['wall', 'floor', 'shavings', 'window', 'sign'], front: ['front', 'broom', 'light', 'lamp', 'dust'],
    state: { win: 0, sign: null, signGlow: 0, sweep: null } };
  await saveJson('sets/werkstatt.json', man);
  return man;
}

async function bakeDorf() {
  const VL = await importPatched('/grammatik/dorf/village.js', ['sky', 'mountains', 'hills', 'village', 'meadow', 'stream', 'waterfall', 'cloudsDraw', 'lamb', 'clouds', 'X', 'm', 'Yd']);
  const { S, K, V, camX, W, layer, fg } = await setBase(VL.createVillage, [-10, 12]);
  const d = (v) => v * DPR, items = {}, dir = 'sets/dorf/';
  log('dorf: ' + W + '×' + H_IMG);
  V.lambHop = 0; S.draw(0, 0);                   // fills the cached ground layer (V.B) and the front canvas
  // the sky's gradient runs from the top of the picture to the horizon, so it is baked in the reference picture
  // (673 px, ground at 0.8) and placed GY_IMG - 0.8 × 1346 px lower in the set's image; above it the top row repeats
  { const R = await setBase(VL.createVillage, [-10, 12], REF_H, REF_H * 0.8), sky = await cropSave(dir + 'sky.webp', R.layer([R.K.sky]));
    items.sky = { type: 'image', parallax: 0.04, extend: 'up', ...sky, y: r3(sky.y + GY_IMG - REF_H * DPR * 0.8) }; }
  items.mountains = { type: 'image', parallax: 0.12, ...(await cropSave(dir + 'mountains.webp', layer([K.mountains]))) };
  items.hills = { type: 'image', parallax: 0.32, ...(await cropSave(dir + 'hills.webp', layer([K.hills]))) };
  items.village = { type: 'image', parallax: 0.62, ...(await cropSave(dir + 'village.webp', layer([K.village]))) };
  items.meadow = { type: 'image', parallax: 1, extend: 'down', ...(await cropSave(dir + 'meadow.webp', layer([K.meadow]))) };
  // clouds: one cloud (the largest), the player places and scales each
  const saved = K.clouds.splice(0), big = Math.max(...saved.map((c) => c.s));
  K.clouds.push({ x: 0, y: 0, s: big, v: 0 });
  const cl = await cropSave(dir + 'cloud.webp', layer([(c) => K.cloudsDraw(c, 0)]), 0.9);
  K.clouds.splice(0); K.clouds.push(...saved);
  items.clouds = { type: 'sprites', parallax: 0.06, ...cl, anchor: [r3(d(K.X(0, 0.06))), r3(d(V.hz - K.m(0.95)))], bakedScale: r4(big), wrap: 60, rise: 0.75,
    items: saved.map((c) => [r4(c.x), r4(c.y), r4(c.s), r4(c.v)]), note: 'cloud [x, y, s, v]: wx = ((x + t·v + wrap/2) mod wrap) - wrap/2 metres from the anchor, y·rise metres higher, scaled s / bakedScale about the anchor' };
  // the waterfall: 3 foam puffs (1.3 /s) = 2.08 streak falls (0.9 /s)
  const wl = 3 / 1.3, wn = 32;
  items.waterfall = { type: 'loop', parallax: 0.32, loop: r8(wl), fps: r3(wn / wl), ...(await cropSheet(dir + 'waterfall.webp', wn, (i) => layer([(c) => K.waterfall(c, (i * wl) / wn)]), 0.9)) };
  report.seams['sets/dorf/waterfall'] = seam((c, t) => { c.setTransform(DPR, 0, 0, DPR, 0, 0); K.waterfall(c, t); }, W, H_IMG, wl);
  // the stream: its ripples and sparkles never repeat (each ripple has its own speed), so the loop crossfades its
  // first second with the second after its end: no seam, and during that second each frame mixes two moments
  const sl = 4, sn = 32, fade = 1;
  const streamAt = (t) => layer([(c) => K.stream(c, t)]);
  const streamFrame = (i) => {
    const t = (i * sl) / sn; if (t >= fade) return streamAt(t);
    const w = t / fade, o = canvas(W, H_IMG), c = o.getContext('2d'); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 1 - w; c.drawImage(streamAt(t + sl), 0, 0); c.globalAlpha = w; c.drawImage(streamAt(t), 0, 0); return o;
  };
  items.stream = { type: 'loop', parallax: 1, loop: sl, fps: r3(sn / sl), crossfade: fade, ...(await cropSheet(dir + 'stream.webp', sn, streamFrame, 0.8)),
    note: 'banks, water, ripples and sparkles; the first second of the loop is crossfaded with the second after it' };
  items.ground = { type: 'image', parallax: 1, ...(await cropSave(dir + 'ground.webp', (() => { const o = canvas(W, H_IMG); o.getContext('2d').drawImage(V.B, 0, 0); return o; })())) };
  const ll = TAU / 2.4, ln = 16;
  items.lamb = { type: 'loop', parallax: 1, loop: r8(ll), fps: r3(ln / ll), hop: { state: 'lambHop', lift: 0.08, decay: 2.2, note: 'bleat: lambHop = 1, falls by decay per second; lift sin(π·min(1, lambHop))·lift metres' },
    ...(await cropSheet(dir + 'lamb.webp', ln, (i) => layer([(c) => K.lamb(c, (i * ll) / ln)]), 0.9)), note: 'breathing at 2.4 rad/s' };
  items.front = { type: 'image', parallax: 1, ...(await cropSave(dir + 'front.webp', (() => { const o = canvas(W, H_IMG); o.getContext('2d').drawImage(fg, 0, 0); return o; })())) };
  const man = { name: 'dorf', version: 1, pxPerMetre: r4(ZB), refHeight: REF_H, top: TOP_M, scale: DPR, width: W, height: H_IMG, groundY: GY_IMG, camX, world: [-10, 12],
    depth: depthSpec, spots: PLACES, bridge: { ...BRIDGE, note: 'on the bridge (|x - bridge.x| < half, |d| < 0.25) the feet rise by rise·sin(π·(x - x + half) / (2·half)) metres' },
    items, back: ['sky', 'mountains', 'hills', 'village', 'meadow', 'clouds', 'waterfall', 'stream', 'ground', 'lamb'], front: ['front'], state: { lambHop: 0 } };
  return { man, S };
}

// the lake (Konjunktiv II film, id 97): grey and sunny sky and water (the sunny ones fade in with `sun`), the land,
// the footbridge (rubbed out from its right end as `bridge` falls), the boathouse door, the clock's hands
async function bakeSee() {
  const SE = await importPatched('/grammatik/buehne/sets/see.js', ['sky', 'mountains', 'hills', 'lake', 'island', 'shore', 'bridge', 'door', 'clockHands', 'reeds', 'X', 'm', 'Yd']);
  const world = [-11, 13], { K, V, camX, W, layer } = await setBase(SE.createSee, world);
  Object.assign(V, { sun: 0, clock: 870, door: 0, bridge: 1, t: 0 });
  const d = (v) => v * DPR, items = {}, dir = 'sets/see/';
  log('see: ' + W + '×' + H_IMG);
  // the sky's gradient runs from the top of the picture to the horizon: baked in the reference picture, as the village's
  { const R = await setBase(SE.createSee, world, REF_H, REF_H * 0.8), shift = GY_IMG - REF_H * DPR * 0.8;
    for (const [name, sunny] of [['sky', false], ['skySun', true]]) {
      const im = await cropSave(dir + name + '.webp', R.layer([(c) => R.K.sky(c, sunny)]), 0.86);
      items[name] = { type: 'image', parallax: 0.04, extend: 'up', ...im, y: r3(im.y + shift), ...(sunny ? { fade: 'sun' } : {}) };
    } }
  items.mountains = { type: 'image', parallax: 0.12, ...(await cropSave(dir + 'mountains.webp', layer([K.mountains]))) };
  items.hills = { type: 'image', parallax: 0.3, ...(await cropSave(dir + 'hills.webp', layer([K.hills]))) };
  items.lake = { type: 'image', parallax: 1, extend: 'down', ...(await cropSave(dir + 'lake.webp', layer([(c) => K.lake(c, false)]), 0.84)) };
  items.lakeSun = { type: 'image', parallax: 1, extend: 'down', fade: 'sun', ...(await cropSave(dir + 'lakeSun.webp', layer([(c) => K.lake(c, true)]), 0.84)) };
  items.island = { type: 'image', parallax: 1, extend: 'down', ...(await cropSave(dir + 'island.webp', layer([K.island]))) };
  items.shore = { type: 'image', parallax: 1, extend: 'down', ...(await cropSave(dir + 'shore.webp', layer([K.shore]))) };
  const tenth = Array.from({ length: 11 }, (_, i) => i / 10);
  items.bridge = { type: 'states', parallax: 1, state: 'bridge', values: tenth, note: 'the footbridge: 1 there … 0 rubbed out (from its right end)', ...(await cropSheet(dir + 'bridge.webp', 11, (i) => { V.bridge = tenth[i]; return layer([K.bridge]); })) };
  V.bridge = 1;
  items.door = { type: 'states', parallax: 1, state: 'door', values: tenth, note: 'the boathouse door: 0 shut … 1 open', ...(await cropSheet(dir + 'door.webp', 11, (i) => { V.door = tenth[i]; return layer([K.door]); })) };
  V.door = 0;
  const k = 1 + HOUSE.d * 0.06;
  items.clock = { type: 'clock', parallax: 1, state: 'clock', centre: [r3(d(K.X(HOUSE.clock.x))), r3(d(K.Yd(HOUSE.d) - K.m(HOUSE.clock.y) * k))], r: r4(HOUSE.clock.r * k), color: '#2a2f3a',
    hands: { hour: { len: 0.5, width: 0.028, minWidth: 1.5 }, minute: { len: 0.78, width: 0.016, minWidth: 1 } }, pin: { radius: 0.02, minRadius: 1.5 },
    note: 'state clock = minutes after midnight (870 = 14:30): the hour hand at ((v/60) mod 12)/12 of a turn, the minute hand at (v mod 60)/60, from 12 o\'clock; len × r metres long, width metres (at least minWidth CSS px)' };
  items.front = { type: 'image', parallax: 1, ...(await cropSave(dir + 'front.webp', layer([K.reeds]))) };
  const man = { name: 'see', version: 1, pxPerMetre: r4(ZB), refHeight: REF_H, top: TOP_M, scale: DPR, width: W, height: H_IMG, groundY: GY_IMG, camX, world,
    depth: depthSpec, spots: SEE_SPOTS, bridge: { ...SEE_BRIDGE, note: 'on the footbridge (while bridge > 0.5, |x - bridge.x| < half, |d| < 0.3) the feet rise by rise·sin(π·(x - bridge.x + half) / (2·half)) metres' },
    items, back: ['sky', 'skySun', 'mountains', 'hills', 'lake', 'lakeSun', 'island', 'shore', 'bridge', 'door', 'clock'], front: ['front'], state: { sun: 0, clock: 870, door: 0, bridge: 1 } };
  await saveJson('sets/see.json', man);
  return man;
}

// Lena's flat (Futur II film, id 439): the wall with the street in the windows (day; wet after the rain and evening
// fade in with `wet` and `eve`), the casements and the front door as state sheets, the parquet, and the finished
// flat (curtains, pictures, plants, the lamp's shade and light, a rug) fading in with `done`
async function bakeWohnung() {
  const WO = await importPatched('/grammatik/buehne/sets/wohnung.js', ['wall', 'view', 'frames', 'floor', 'casements', 'doorLeaf', 'doneWall', 'doneLight', 'doneFloor', 'sofa', 'X', 'm', 'Yd']);
  const world = [-9, 12.5], { K, V, camX, W, layer } = await setBase(WO.createWohnung, world), P = 0.93;
  Object.assign(V, { win: 0, wet: 0, eve: 0, done: 0, door: 0, t: 0 });
  const items = {}, dir = 'sets/wohnung/';
  log('wohnung: ' + W + '×' + H_IMG);
  items.wall = { type: 'image', parallax: P, extend: 'up', ...(await cropSave(dir + 'wall.webp', layer([K.wall]))) };
  for (const [name, mode, fade] of [['view', 'day', null], ['viewWet', 'wet', 'wet'], ['viewEve', 'eve', 'eve']])
    items[name] = { type: 'image', parallax: P, ...(fade ? { fade } : {}), ...(await cropSave(dir + name + '.webp', layer([(c) => K.view(c, mode)]), 0.86)) };
  items.frames = { type: 'image', parallax: P, ...(await cropSave(dir + 'frames.webp', layer([K.frames]))) };
  const tenth = Array.from({ length: 11 }, (_, i) => i / 10);
  items.window = { type: 'states', parallax: P, state: 'win', values: tenth, note: 'the big window\'s casements: 0 shut … 1 open (the second window stays shut)', ...(await cropSheet(dir + 'window.webp', 11, (i) => { V.win = tenth[i]; return layer([K.casements]); })) };
  V.win = 0;
  items.door = { type: 'states', parallax: P, state: 'door', values: tenth, note: 'the front door: 0 shut … 1 open (the landing behind it is in the frames image)', ...(await cropSheet(dir + 'door.webp', 11, (i) => { V.door = tenth[i]; return layer([K.doorLeaf]); })) };
  V.door = 0;
  items.floor = { type: 'image', parallax: 1, extend: 'down', ...(await cropSave(dir + 'floor.webp', layer([K.floor]))) };
  items.doneFloor = { type: 'image', parallax: 1, fade: 'done', ...(await cropSave(dir + 'doneFloor.webp', layer([K.doneFloor]))) };
  items.doneWall = { type: 'image', parallax: P, fade: 'done', ...(await cropSave(dir + 'doneWall.webp', layer([K.doneWall]))) };
  items.doneLight = { type: 'image', parallax: P, fade: 'done', ...(await cropSave(dir + 'doneLight.webp', layer([K.doneLight]), 0.85, 0.5)) };
  const man = { name: 'wohnung', version: 1, pxPerMetre: r4(ZB), refHeight: REF_H, top: TOP_M, scale: DPR, width: W, height: H_IMG, groundY: GY_IMG, camX, world,
    depth: depthSpec, spots: WOHNUNG_SPOTS, items, back: ['wall', 'view', 'viewWet', 'viewEve', 'frames', 'window', 'door', 'floor', 'doneFloor', 'doneWall', 'doneLight'], front: [],
    state: { win: 0, wet: 0, eve: 0, done: 0, door: 0 } };
  await saveJson('sets/wohnung.json', man);
  return man;
}

// the newsroom (Nominalstil film, id 482): the wall (window, pinboard, the clock's face and the deadline plate, an old
// front page, the shelf), the glass door and the clock's hands, the floor (Frau Adler's desk, a plant, Lena's chair),
// the big screen and its column filling with print (`page`), the printing press still and running (`press`: a 1 s
// loop faded in over the still), and Lena's desk in front of the people
async function bakeRedaktion() {
  const RE = await importPatched('/grammatik/buehne/sets/redaktion.js', ['wall', 'floor', 'screen', 'page', 'press', 'doorLeaf', 'deskFront', 'X', 'm', 'Yd', 'WX', 'WY']);
  const world = [-9, 12], { K, V, camX, W, layer } = await setBase(RE.createRedaktion, world), P = 0.93;
  Object.assign(V, { clock: 1040, page: 0, press: 0, door: 0, t: 0 });
  const d = (v) => v * DPR, items = {}, dir = 'sets/redaktion/';
  log('redaktion: ' + W + '×' + H_IMG);
  items.wall = { type: 'image', parallax: P, extend: 'up', ...(await cropSave(dir + 'wall.webp', layer([K.wall]))) };
  const tenth = Array.from({ length: 11 }, (_, i) => i / 10);
  items.door = { type: 'states', parallax: P, state: 'door', values: tenth, note: 'the glass door: 0 shut … 1 open', ...(await cropSheet(dir + 'door.webp', 11, (i) => { V.door = tenth[i]; return layer([K.doorLeaf]); })) };
  V.door = 0;
  items.clock = { type: 'clock', parallax: P, state: 'clock', centre: [r3(d(K.WX(REDAKTION_CLOCK.x))), r3(d(K.WY(REDAKTION_CLOCK.y)))], r: REDAKTION_CLOCK.r, color: '#2a2f3a',
    hands: { hour: { len: 0.5, width: 0.024, minWidth: 1.5 }, minute: { len: 0.78, width: 0.014, minWidth: 1 } }, pin: { radius: 0.018, minRadius: 1.5 },
    note: 'the wall clock (as the lake\'s): state clock = minutes after midnight (1040 = 17:20)' };
  items.floor = { type: 'image', parallax: 1, extend: 'down', ...(await cropSave(dir + 'floor.webp', layer([K.floor]))) };
  items.screen = { type: 'image', parallax: 1, ...(await cropSave(dir + 'screen.webp', layer([K.screen]))), note: 'the big screen stands on the floor (parallax 1): props at its depth stay on it' };
  items.page = { type: 'states', parallax: 1, state: 'page', values: tenth, note: 'the screen\'s narrow column: 0 empty (a glowing dashed frame) … 1 full of print', ...(await cropSheet(dir + 'page.webp', 11, (i) => { V.page = tenth[i]; return layer([K.page]); })) };
  V.page = 0;
  items.press = { type: 'image', parallax: 1, ...(await cropSave(dir + 'press.webp', layer([(c) => K.press(c, 0, 0)]))) };
  const pn = 16;
  items.pressRun = { type: 'loop', parallax: 1, loop: 1, fps: pn, fade: 'press', ...(await cropSheet(dir + 'pressRun.webp', pn, (i) => layer([(c) => K.press(c, i / pn, 1)]))),
    note: 'the press running (rattling, rollers turning, a sheet coming out), a 1 s loop drawn over the still image with the state press (0 … 1) as its opacity' };
  items.desk = { type: 'image', parallax: 1, ...(await cropSave(dir + 'desk.webp', layer([K.deskFront]))), note: 'Lena\'s desk, in front of the people' };
  const man = { name: 'redaktion', version: 1, pxPerMetre: r4(ZB), refHeight: REF_H, top: TOP_M, scale: DPR, width: W, height: H_IMG, groundY: GY_IMG, camX, world,
    depth: depthSpec, spots: REDAKTION_SPOTS, screen: REDAKTION_SCREEN, press: REDAKTION_PRESS, desk: REDAKTION_DESK, items,
    back: ['wall', 'door', 'clock', 'floor', 'screen', 'page', 'press', 'pressRun'], front: ['desk'], state: { clock: 1040, page: 0, press: 0, door: 0 } };
  await saveJson('sets/redaktion.json', man);
  return man;
}

/* ============ 4. the check: live drawing vs the baked files through the reference player ============ */
const pairs = [];   // { section, label, live, baked, d }
function pair(section, label, live, baked) { const dd = diff(live, baked); pairs.push({ section, label, live, baked, d: dd }); report.checks[`${section}/${label}`] = dd; }
async function images(files) { const o = {}; for (const f of files) o[f] = await load('/' + OUT + f + '?v=' + Date.now()); return o; }

async function checkBilder(man) {
  const imgs = await images([...Object.values(man.pictures).map((e) => e.file), ...Object.values(man.icons.files)]);
  for (const [name, e] of Object.entries(man.pictures)) {
    const i = e.still ? 0 : Math.floor(e.frames * 0.4), t = e.still ? 1.7 : (i * e.loop) / e.frames, tp = e.still ? t : ((i + 0.5) * e.loop) / e.frames;   // the player samples mid-frame
    const live = canvas(320, 200), lc = live.getContext('2d'); lc.scale(2, 2); BILDER[name](lc, t);
    const baked = canvas(320, 200); PL.drawPicture(baked.getContext('2d'), man, imgs, name, tp, 0, 0, 320, 200);
    pair('pictures', `${name} t=${t.toFixed(2)}`, live, baked);
  }
  for (const [k, f] of Object.entries(man.icons.files)) {
    const live = canvas(56, 56), lc = live.getContext('2d'); lc.scale(2, 2); ICONS[k](lc);
    const baked = canvas(56, 56); baked.getContext('2d').drawImage(imgs[f], 0, 0); pair('icons', k, live, baked);
  }
}
async function checkTiere(man) {
  const files = [...Object.values(man.kinds).flatMap((k) => Object.values(k.states).filter((s) => s.file).map((s) => s.file)), man.birds.file, man.pack.file, ...Object.values(man.things).map((t) => t.file)];
  const imgs = await images(files), { A, fx, B, cv } = fxKit(), crop = [FX - 330, FY - 470, 660, 520];
  const cut = (src) => { const o = canvas(crop[2], crop[3]); o.getContext('2d').drawImage(src, crop[0], crop[1], crop[2], crop[3], 0, 0, crop[2], crop[3]); return o; };
  for (const [kind, states] of Object.entries(ANIMALS)) {
    const K = { ...A[kind].K, hopDecay: 2.4 };
    for (const [name, st] of Object.entries(states)) {
      if (st.same) continue;
      const n = st.frames || 1, i = Math.floor(n * 0.4), o = animalFrame(kind, st, K, i);
      const live = cut(renderAnimal(kind, o, true));
      const b = canvas(SW, SH), bc = b.getContext('2d');
      const lt = st.loop ? ((i + 0.5) * st.loop) / n : 0;   // mid-frame
      // a hop is drawn as the player does it: the idle sheet lifted by the hop curve
      PL.drawAnimal(bc, man, imgs, st.hop ? { kind, state: 'idle', t: o.t, hop: o.hop } : { kind, state: name, t: lt, spin: o.spin, running: st.run }, FX, FY, ZB);
      pair('animals', `${kind} ${name}`, live, cut(b));
    }
  }
  // the flock, 1.7 s after it started
  const dt = 1.7; for (const a of Object.values(A)) { a.alpha = 0; a.show = false; } fx.F.pack = null; fx.F.birds = { x0: 0, y: 0.5, t0: 0 }; B.onFrame[0](dt, 0);
  const lb = canvas(SW, SH); lb.getContext('2d').drawImage(cv, 0, 0);
  const bb = canvas(SW, SH); PL.drawBirds(bb.getContext('2d'), man, imgs, dt, 0, 0.5, (wx) => SW / 2 + wx * ZB, FY, ZB);
  const bc = [FX - 650, FY - 400, 1300, 260], cutB = (s) => { const o = canvas(bc[2], bc[3]); o.getContext('2d').drawImage(s, ...bc, 0, 0, bc[2], bc[3]); return o; };
  pair('animals', 'birds (flock) dt=1.7', cutB(lb), cutB(bb)); fx.F.birds = null;
  // the pack, filled twice
  fx.F.pack = { x: 0, d: 0, fill: 2, shake: 0 }; B.onFrame[0](0, 0); const lp = cut(cv);
  const pb = canvas(SW, SH), pe = man.pack; PL.cell(pb.getContext('2d'), imgs[pe.file], pe, 2, FX - pe.foot[0], FY - pe.foot[1], pe.frame[0], pe.frame[1]); pair('animals', 'pack fill=2', lp, cut(pb)); fx.F.pack = null;
  for (const [k, e] of Object.entries(man.things)) {
    const l = canvas(SW, SH), lc = l.getContext('2d'); lc.translate(FX, FY - 300); lc.scale(ZB, ZB); THINGS[k](lc);
    const b = canvas(SW, SH); b.getContext('2d').drawImage(imgs[e.file], FX - e.centre[0], FY - 300 - e.centre[1]);
    const tc = [FX - 200, FY - 500, 400, 400], c2 = (s) => { const o = canvas(tc[2], tc[3]); o.getContext('2d').drawImage(s, ...tc, 0, 0, tc[2], tc[3]); return o; };
    pair('animals', 'thing ' + k, c2(l), c2(b));
  }
}
// a set at a camera, drawn live (the site's module, untouched) and by the player from the baked files
async function checkSet(man, createLive, label, view, state, setLive) {
  const files = Object.values(man.items).filter((i) => i.file).map((i) => i.file), imgs = await images(files);
  const Wc = 1196, bg = canvas(1, 1), fg = canvas(1, 1), S = createLive(bg, fg); S.size(Wc, REF_H, DPR); S.setCam(view.camX, Z_CSS * (view.k || 1), view.ty || 0);
  setLive(S.V); S.draw(view.t, 0);
  const live = canvas(Wc * DPR, REF_H * DPR), lc = live.getContext('2d'); lc.drawImage(bg, 0, 0); lc.drawImage(fg, 0, 0);
  const baked = canvas(Wc * DPR, REF_H * DPR), bc = baked.getContext('2d'), v = { W: Wc * DPR, H: REF_H * DPR, z: ZB * (view.k || 1), camX: view.camX, ty: view.ty || 0, t: view.t, dpr: DPR };
  PL.drawSet(bc, man, imgs, v, state, 'back'); PL.drawSet(bc, man, imgs, v, state, 'front');
  pair('sets', `${man.name} ${label}`, live, baked);
}

/* ---------- the contact sheet ---------- */
async function contactSheet() {
  const SHEET_W = 2400, PAD = 16, LAB = 30, out = [], sections = [...new Set(pairs.map((p) => p.section))];
  const scaleFor = { pictures: 0.625, icons: 1.5, animals: 0.45, sets: 0.49 };
  // lay out row by row, each pair = live | baked
  let y = 70; const place = [];
  for (const s of sections) {
    const list = pairs.filter((p) => p.section === s), k = scaleFor[s] || 0.5; y += 44; place.push({ head: s, y: y - 14 });
    let x = PAD, rowH = 0;
    for (const p of list) {
      const w = p.live.width * k, h = p.live.height * k, pw = w * 2 + 6;
      if (x + pw > SHEET_W - PAD) { x = PAD; y += rowH + LAB + PAD; rowH = 0; }
      place.push({ p, x, y, w, h }); x += pw + PAD * 1.5; rowH = Math.max(rowH, h);
    }
    y += rowH + LAB + PAD;
  }
  const cv = canvas(SHEET_W, y + PAD), c = cv.getContext('2d');
  c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#222'; c.font = '700 26px system-ui'; c.fillText('Scene assets: live Canvas drawing (left of each pair) vs baked WebP through the reference player (right), same moment', PAD, 40);
  for (const q of place) {
    if (q.head) { c.fillStyle = '#222'; c.font = '700 22px system-ui'; c.fillText(q.head, PAD, q.y); continue; }
    const { p, x, w, h } = q, yy = q.y;
    for (const [img, dx] of [[p.live, 0], [p.baked, w + 6]]) { c.fillStyle = '#fff'; c.fillRect(x + dx, yy, w, h); c.drawImage(img, x + dx, yy, w, h); c.strokeStyle = '#ccc'; c.strokeRect(x + dx + 0.5, yy + 0.5, w - 1, h - 1); }
    c.fillStyle = p.d.visible > 0.01 ? '#b3261e' : '#333'; c.font = '13px system-ui';
    c.fillText(`${p.label} · Δ ${p.d.mean} · ${(p.d.visible * 100).toFixed(2)} % px`, x, yy + h + 18);
  }
  const b = await encode(cv, 'image/jpeg', 0.86); await save('.local/scene-assets-check.jpg', b);
  log(`check sheet: .local/scene-assets-check.jpg ${cv.width}×${cv.height}, ${(b.size / 1024).toFixed(0)} KB`);
}

/* ---------- run ---------- */
(async () => {
  try {
    await document.fonts.ready;
    const getJson = async (rel) => (await fetch('/' + OUT + rel, { cache: 'no-store' })).json();
    if (ONLY.has('bilder')) { log('pictures…'); await bakeBilder(); }
    if (ONLY.has('tiere')) { log('animals…'); await bakeTiere(); }
    if (ONLY.has('sets') && SET) { log('set ' + SET + '…'); await ({ werkstatt: bakeWerkstatt, see: bakeSee, wohnung: bakeWohnung, redaktion: bakeRedaktion }[SET])(); }
    else if (ONLY.has('sets')) { log('sets…'); await bakeWerkstatt(); const { man } = await bakeDorf(); await saveJson('sets/dorf.json', man); await bakeSee(); await bakeWohnung(); await bakeRedaktion(); }
    if (ONLY.has('check')) {
      log('check…');
      await checkBilder(await getJson('bilder.json'));
      await checkTiere(await getJson('tiere.json'));
      const wm = await getJson('sets/werkstatt.json'), dm = await getJson('sets/dorf.json');
      await checkSet(wm, liveWerkstatt, 'cam -3, t 1.3, window .6, empty sign glowing .6', { camX: -3, t: 1.3 }, { win: 0.6, sign: '', signGlow: 0.6, sweep: null }, (V) => Object.assign(V, { win: 0.6, sign: '', signPic: null, signGlow: 0.6, sweep: null }));
      await checkSet(wm, liveWerkstatt, 'cam 1, t .4, sweeping at x 1.2', { camX: 1, t: 0.4 }, { win: 0, sign: null, sweep: 1.2 }, (V) => Object.assign(V, { win: 0, sign: null, signGlow: 0, sweep: 1.2 }));
      await checkSet(wm, liveWerkstatt, 'cam -6.3, zoom 1.3, t 2', { camX: -6.3, k: 1.3, t: 2 }, { win: 1, sign: null, sweep: null }, (V) => Object.assign(V, { win: 1, sign: null, signGlow: 0, sweep: null }));
      await checkSet(dm, liveVillage, 'cam 2, t 0', { camX: 2, t: 0 }, { lambHop: 0 }, (V) => { V.lambHop = 0; });
      await checkSet(dm, liveVillage, 'cam -5.5, t 2.7, lamb hopping .5', { camX: -5.5, t: 2.7 }, { lambHop: 0.5 }, (V) => { V.lambHop = 0.5; });
      await checkSet(dm, liveVillage, 'cam 8, zoom .85, t 1.25', { camX: 8, k: 0.85, t: 1.25 }, { lambHop: 0 }, (V) => { V.lambHop = 0; });
      const sm = await getJson('sets/see.json'), seeAt = (st) => (V) => Object.assign(V, st);
      for (const [label, view, st] of [['cam -3, grey, 14:30', { camX: -3, t: 0 }, { sun: 0, clock: 870, door: 0, bridge: 1 }], ['cam -7, half sun, bridge .4, door .6, 13:50', { camX: -7, t: 1 }, { sun: 0.5, clock: 830, door: 0.6, bridge: 0.4 }],
        ['cam 4.3, sunny', { camX: 4.3, t: 0 }, { sun: 1, clock: 870, door: 0, bridge: 1 }], ['cam 9, sunny', { camX: 9, t: 0 }, { sun: 1, clock: 870, door: 0, bridge: 1 }]])
        await checkSet(sm, liveSee, label, view, st, seeAt(st));
      const wo = await getJson('sets/wohnung.json');
      for (const [label, view, st] of [['cam 0, day', { camX: 0, t: 0 }, { win: 0, wet: 0, eve: 0, done: 0, door: 0 }], ['cam -4, wet, window .7, door .6', { camX: -4, t: 1 }, { win: 0.7, wet: 1, eve: 0, done: 0, door: 0.6 }],
        ['cam 6, evening, finished', { camX: 6, t: 0 }, { win: 0, wet: 0, eve: 1, done: 1, door: 0 }], ['cam 9.5, half finished', { camX: 9.5, t: 0 }, { win: 0, wet: 0, eve: 0, done: 0.5, door: 0 }]])
        await checkSet(wo, liveWohnung, label, view, st, seeAt(st));
      const re = await getJson('sets/redaktion.json');
      for (const [label, view, st] of [['cam 0, 17:20', { camX: 0, t: 0 }, { clock: 1040, page: 0, press: 0, door: 0 }], ['cam 4, press running, page .6, 17:45', { camX: 4, t: 0.4 }, { clock: 1065, page: 0.6, press: 1, door: 0 }],
        ['cam -5, door .7, page full', { camX: -5, t: 0 }, { clock: 1079, page: 1, press: 0, door: 0.7 }]])
        await checkSet(re, liveRedaktion, label, view, st, seeAt(st));
      await contactSheet();
    }
    await save('.local/scene-assets-report.json', JSON.stringify(report, null, 1));
    log('seams (mean |Δ| between frame 0 and one loop later):'); for (const [k, v] of Object.entries(report.seams)) log('  ' + k.padEnd(28) + v);
    log('checks (mean |Δ|, share of visibly different px):'); for (const [k, v] of Object.entries(report.checks)) log('  ' + k.padEnd(60) + v.mean + '  ' + (v.visible * 100).toFixed(2) + ' %');
    window.__done = { ok: true };
  } catch (e) { log('ERROR ' + (e.stack || e)); window.__done = { ok: false, error: String(e.stack || e) }; }
})();
