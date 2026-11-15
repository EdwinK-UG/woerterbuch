/* "Im Dorf" – A1 · Kapitel 1 (Personalpronomen). Liv and her neighbours introduce themselves in a mountain village
   (2D Rive figures of the cast over a Canvas 2D village), then the learner answers Liv, Max and Herr Berger.
   Like the other lesson scenes this file holds no lesson text: every spoken line and practice text comes from the
   private lines file (opened with ?local from the git-ignored .local/a1k1/, embedded from the lesson page).
   Mobile first: the picture keeps a fixed shape (4:3 on phones) and the words sit below it, not over it; only the
   characters a scene needs are loaded first, the rest while Elisa speaks. */
import { createVillage, PLACES, BRIDGE } from './village.js?v=1';

const $ = (id) => document.getElementById(id);
const qs = new URLSearchParams(location.search);
const LOCAL = qs.has('local'), EMBED = window.parent !== window, TEST = qs.has('test');
const RIVE_JS = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.49.0/rive.js';
const RIV_DIR = '../../tools/liv3d/models/cast/2d/';
const PRIV = '../../.local/a1k1/';

/* ---------- the cast ---------- */
// artboard 1536 x 2048 px; m = its height in metres, g = the feet line in pixels (from each <id>.motion.json)
const CAST = {
  liv:    { id: 'c01', name: 'Liv', col: '#d2453b', m: 1.3026, g: 2016.6 },
  lena:   { id: 'a03', name: 'Lena', col: '#9b5fb5', m: 1.9725, g: 2027.2 },
  berger: { id: 'a05', name: 'Herr Berger', col: '#3d4f6b', m: 2.204, g: 2029.4 },
  opa:    { id: 'a01', name: 'Opa Sepp', col: '#7a5434', m: 1.7595, g: 2024.7 },
  huber:  { id: 'a04', name: 'Frau Huber', col: '#4f8a52', m: 1.7248, g: 2024.3 },
  max:    { id: 'c02', name: 'Max', col: '#c99a2e', m: 1.4584, g: 2019.9 },
};
const SPEAKER = { elisa: { name: 'Erzählerin', col: '#2f7d5b' }, lamb: { name: 'Flocke', col: '#8a8a8a' } };
const LOAD_ORDER = ['liv', 'opa', 'huber', 'lena', 'berger', 'max'];
const PRON = { ich: 'ich', wir: 'ich', du: 'du', ihr: 'du', Sie: 'Sie', er: 'er', sie: 'sie', es: 'es' };

const village = createVillage($('bg'), $('fg'));
const S = { t: 0, paused: false, gen: 0, scene: -1, mode: 'idle', cam: { x: 8, k: 1, ty: 0 }, base: { x: 8, k: 1 }, close: false, waits: [], tweens: [], muted: false, lines: null, practice: null, audio: new Map(), Z0: 100, score: 0, asked: 0 };
const A = {};          // actors by key

/* ---------- loading ---------- */
let riveReady = null;
function loadRiveJs() {
  return riveReady || (riveReady = new Promise((ok, bad) => { const s = document.createElement('script'); s.src = RIVE_JS; s.crossOrigin = 'anonymous'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }));
}
function makeActor(key) {
  const C = CAST[key], cv = document.createElement('canvas'); cv.width = 300; cv.height = 400; $('people').appendChild(cv);
  const a = { key, C, cv, x: -20, d: 0, left: false, show: false, tx: null, speed: 1, run: false, arrive: null, r: null, vm: null, clean: false, checked: 0, sit: false, cssH: 0 };
  a.ready = loadRiveJs().then(() => new Promise((ok) => {
    const r = new window.rive.Rive({ src: RIV_DIR + C.id + '.riv', canvas: cv, artboard: C.id.toUpperCase() + ' 3q', stateMachines: 'Character', autoplay: true, autoBind: true,
      onLoad: () => { a.r = r; a.vm = r.viewModelInstance; setB(a, 'sitting', a.sit); ok(a); },
      onLoadError: () => { console.warn('could not load', C.id); ok(a); } });
  }));
  A[key] = a; return a;
}
const setB = (a, k, v) => { const p = a.vm && a.vm.boolean(k); if (p && p.value !== v) p.value = v; };
const trig = (a, k) => { const p = a.vm && a.vm.trigger(k); if (p) p.trigger(); };
const face = (a, f) => { const p = a.vm && a.vm.enum('face'); if (p) p.value = f; };
// The free Rive plan draws its logo screen (opaque, edge to edge) for the first moments of every file; a figure's own
// artboard leaves the corners empty. So a figure is shown only once its canvas corner is transparent.
const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); probe.canvas.width = probe.canvas.height = 2;
function isClean(a) {
  const W = a.cv.width, H = a.cv.height, px = (x, y) => { probe.clearRect(0, 0, 2, 2); probe.drawImage(a.cv, x, y, 2, 2, 0, 0, 2, 2); return probe.getImageData(0, 0, 2, 2).data; };
  const corner = px(0, 0), body = px(Math.round(W / 2) - 1, Math.round(H * 0.6));       // the hips are at about 60 % of the artboard's height
  return corner[3] === 0 && corner[15] === 0 && body[3] > 0;                             // the logo screen is gone and the figure is drawn
}
async function need(...keys) { await Promise.all(keys.map((k) => A[k].ready)); while (keys.some((k) => A[k].r && !A[k].clean)) await new Promise((r) => setTimeout(r, 80)); }

async function loadLines() {
  if (LOCAL) { const r = await fetch(PRIV + 'lines.json', { cache: 'no-store' }); if (!r.ok) throw Error('no lines'); return r.json(); }
  if (EMBED) return new Promise((ok) => {           // the lesson page sends the chapter's private cues (text + signed audio links)
    addEventListener('message', (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'werkstatt-audio') return;
      const cues = e.data.audio; if (!cues) { ok(null); return; }
      const out = { lines: {}, practice: [] };
      for (const [cid, v] of Object.entries(cues)) {          // "dorf|<line>|<who>"; one cue carries the practice as JSON
        const [tag, id, who] = cid.split('|'); if (tag !== 'dorf' || !v || typeof v.say !== 'string') continue;
        if (id === 'practice') { try { out.practice = JSON.parse(v.say); } catch (err) { /* no practice */ } }
        else out.lines[id] = { who, text: v.say, url: v.seconds > 0.2 ? v.url : null };
      }
      ok(Object.keys(out.lines).length ? out : null);
    });
    parent.postMessage({ type: 'werkstatt-ready', scene: 'dorf' }, location.origin);
  });
  return null;
}
const audioUrl = (ln) => ln.url || (ln.audio && LOCAL ? PRIV + ln.audio : null);
// Two shared players (two voices can speak at once): iPhones only let a page play sound from an element that first
// played inside a tap, so both are started silently in the Start tap and then reused for every line. The clips
// themselves are fetched quietly in the background, in the order they are needed, so each one is in the cache.
const PLAYERS = [new Audio(), new Audio()];
const SILENT = URL.createObjectURL(new Blob([(() => { const n = 800, b = new DataView(new ArrayBuffer(44 + n * 2)), s = (o, x) => [...x].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
  s(0, 'RIFF'); b.setUint32(4, 36 + n * 2, true); s(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true); b.setUint32(24, 16000, true); b.setUint32(28, 32000, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); s(36, 'data'); b.setUint32(40, n * 2, true); return b.buffer; })()], { type: 'audio/wav' }));
function unlockAudio() { for (const pl of PLAYERS) { pl.src = SILENT; pl.play().catch(() => {}); } }
function preloadAudio(ids) {
  for (const id of ids) { const ln = S.lines.lines[id]; const u = ln && audioUrl(ln); if (u) S.audio.set(id, u); }
  (async () => { for (const u of new Set(S.audio.values())) { try { await (await fetch(u, { priority: 'low' })).arrayBuffer(); } catch (e) { /* played from the network later */ } } })();
}

/* ---------- clock, waits, tweens (all on the scene clock, which stops while paused) ---------- */
class Abort extends Error {}
const ss = (k) => k * k * (3 - 2 * k);
function wait(sec, gen = S.gen) { return new Promise((ok, no) => S.waits.push({ at: S.t + sec, ok, no, gen })); }
function until(fn, gen = S.gen) { return new Promise((ok, no) => S.waits.push({ fn, ok, no, gen })); }
function tween(obj, key, to, dur) { return new Promise((ok) => S.tweens.push({ obj, key, a: obj[key], b: to, t0: S.t, dur: Math.max(0.001, dur), ok })); }
function abortAll() { S.gen++; for (const w of S.waits) w.no(new Abort()); S.waits = []; S.tweens = []; stopAudio(); }

/* ---------- people ---------- */
function place(a, x, { d = 0, left = false, show = true } = {}) { a.x = x; a.d = d; a.left = left; a.show = show; a.tx = null; setB(a, 'walking', false); setB(a, 'running', false); setB(a, 'facingLeft', left); }
function walkTo(a, x, { run = false, speed } = {}) {
  a.tx = x; a.run = run; a.speed = speed || (run ? 2.2 : a.key === 'liv' || a.key === 'max' ? 0.95 : 1.0); a.left = x < a.x; setB(a, 'facingLeft', a.left);
  setB(a, run ? 'running' : 'walking', true); setB(a, run ? 'walking' : 'running', false); a.show = true;
  return until(() => a.tx === null);
}
// who is in a scene: the named figures may be shown, everyone else is hidden; Opa (on his bench) and Frau Huber (in her
// stall) live in the village and are always in their places unless a scene moves them. Jumping to any scene is clean.
function cast(...keys) {
  for (const a of Object.values(A)) { a.tx = null; setB(a, 'walking', false); setB(a, 'running', false); if (!keys.includes(a.key)) a.show = false; }
  place(A.opa, PLACES.bench, { d: -0.32, left: false }); A.opa.sit = true; setB(A.opa, 'sitting', true);
  place(A.huber, PLACES.bakery, { d: -0.5, left: true });
}
const turn = (a, left) => { a.left = left; setB(a, 'facingLeft', left); };
const faceTo = (a, b) => turn(a, b.x < a.x);
function stepActors(dt) {
  for (const a of Object.values(A)) {
    if (a.tx === null) continue;
    const dir = Math.sign(a.tx - a.x), mv = a.speed * dt;
    if (Math.abs(a.tx - a.x) <= mv) { a.x = a.tx; a.tx = null; setB(a, 'walking', false); setB(a, 'running', false); } else a.x += dir * mv;
  }
}
function drawActors() {
  const dpr = Math.min(2, devicePixelRatio || 1), now = performance.now();
  const list = Object.values(A).sort((p, q) => p.d - q.d);
  list.forEach((a, i) => {
    if (a.r && !a.clean && now - a.checked > 150) { a.checked = now; a.clean = isClean(a); }
    const vis = a.show && a.r && a.clean; a.cv.classList.toggle('on', vis); if (!a.r) return;
    const f = village.foot(a.x, a.d), h = a.C.m * village.V.cam.z * f.k, w = h * 0.75;
    a.cv.style.width = w + 'px'; a.cv.style.height = h + 'px';
    // Rive stops drawing a canvas that is outside the window: until its logo screen is over, a figure waits inside
    // the picture, invisible, so it is ready the moment it walks in
    const sx = a.clean ? f.x - w / 2 : 0, sy = a.clean ? f.y - h * a.C.g / 2048 : 0;
    a.cv.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`; a.cv.style.zIndex = 10 + i;
    if (Math.abs(h - a.cssH) > a.cssH * 0.08 + 1) { a.cssH = h; a.r.resizeDrawingSurfaceToCanvas(Math.min(dpr, 2048 / h)); }   // close-ups: at most the artboard's own 2048 px
  });
}
// a rectangle around a person's body on screen, for taps and for the ring
function bodyRect(a) { const f = village.foot(a.x, a.d), h = a.C.m * village.V.cam.z * f.k * 0.86; return { x: f.x - h * 0.2, y: f.y - h, w: h * 0.4, h }; }

/* ---------- camera ---------- */
function fitStage() {
  const st = $('stage'), W = st.clientWidth, H = st.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  village.size(W, H, dpr); S.Z0 = (H * 0.8) / 2.75;
  // on a narrow (portrait) picture keep at least 3.6 m in view, so two people fit side by side
  S.Z0 = Math.min(S.Z0, W / 3.6);
}
// The scene's own framing (wide). Dialogue lines move in close on the speaker(s) (see say), the narrator goes back to it.
function cam(x, k = 1, dur = 1.2) { S.base = { x, k }; S.close = false; return Promise.all([tween(S.cam, 'x', x, dur), tween(S.cam, 'k', k, dur), tween(S.cam, 'ty', 0, dur)]); }
const figH = (a) => a.C.m / 1.18;                         // the artboard has 18 % room above the head
// close on one or two people: from about the waist up, faces in the upper third, a little room in the looking direction
function closeUp(list, dur = 0.7) {
  const H = village.V.H, W = village.V.W, Z0 = S.Z0, tall = Math.max(...list.map(figH));
  let k = 1.65 * H / (tall * Z0), x;                     // the figure 1.65 times the picture's height: head to about the waist
  if (list.length === 1) { const a = list[0]; x = a.x + (a.left ? -1 : 1) * 0.1 * figH(a); }
  else { const xs = list.map((a) => a.x), span = Math.max(...xs) - Math.min(...xs) + 0.9; x = (Math.max(...xs) + Math.min(...xs)) / 2; k = Math.min(k, W * 0.92 / (span * Z0)); }
  // someone further back (Frau Huber behind her counter) stands higher in the picture: add that to the head's height
  const lift = Math.max(...list.map((a) => (a.d < 0 ? -a.d / 2.6 * 1.05 : -a.d * 0.55)));
  k = Math.max(S.base.k, Math.min(4.6, k)); const Z = Z0 * k, head = tall * 0.87 + lift;
  const ty = Math.max(0, (0.37 * H + head * Z - 0.8 * H) / Z);
  S.close = true; tween(S.cam, 'x', x, dur); tween(S.cam, 'k', k, dur); tween(S.cam, 'ty', ty, dur);
}
function wide(dur = 0.8) { if (!S.close) return; S.close = false; tween(S.cam, 'x', S.base.x, dur); tween(S.cam, 'k', S.base.k, dur); tween(S.cam, 'ty', 0, dur); }
const inBase = (a) => a.show && Math.abs(a.x - S.base.x) < village.V.W / (2 * S.Z0 * S.base.k) - 0.15;

/* ---------- words ---------- */
const plain = (s) => s.replace(/\*([^*:]+)(?::[^*]+)?\*/g, '$1');
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function rich(text) {
  return esc(text).replace(/\*([^*:]+)(?::([^*]+))?\*/g, (_, w, role) => { const k = role || (w.trim() === 'Sie' ? 'Sie' : w.trim().toLowerCase()); return `<span class="pr" style="--c:var(--${PRON[k] || 'ich'})">${w}</span>`; });
}
function caption(who, text) {
  const sp = CAST[who] || SPEAKER[who] || (who === 'lena+berger' ? { name: 'Lena und Herr Berger', col: CAST.lena.col } : who === 'you' ? { name: 'Du', col: '#2f7d5b' } : { name: '', col: '#999' });
  $('cap').innerHTML = `<span class="who" style="--c:${sp.col}"><i></i>${esc(sp.name)}</span><span class="t">${rich(text)}</span>`;
}
const CARD = { ich: ['ich', '1. Person', 'ich'], du: ['du', '2. Person · informell', 'du'], Sie: ['Sie', '2. Person · höflich', 'Sie'], er: ['er', 'der · 3. Person', 'er'], sie: ['sie', 'die · 3. Person', 'sie'], es: ['es', 'das · 3. Person', 'es'],
  wir: ['wir', 'ich + du / andere', 'ich'], ihr: ['ihr', 'du + du', 'du'], siePl: ['sie', 'zwei oder mehr Personen', 'sie'], SiePl: ['Sie', 'höflich · auch für zwei', 'Sie'] };
function card(...keys) { for (const k of keys) { const [w, l, c] = CARD[k], el = document.createElement('div'); el.className = 'card'; el.style.setProperty('--c', `var(--${c})`); el.innerHTML = `<b>${w}</b><span>${l}</span>`; $('cards').appendChild(el); } }
const clearCards = () => { $('cards').innerHTML = ''; $('table').classList.remove('on'); };
function table() {
  const w = (s, k) => `<b style="color:var(--${k})">${s}</b>`, r = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
  $('table').innerHTML = `<table><tr><th></th><th>eine Person</th><th>mehrere Personen</th></tr>${r('1. Person', w('ich', 'ich'), w('wir', 'ich'))}${r('2. Person informell', w('du', 'du'), w('ihr', 'du'))}${r('2. Person höflich', w('Sie', 'Sie'), w('Sie', 'Sie'))}${r('3. Person', `${w('er', 'er')} · ${w('sie', 'sie')} · ${w('es', 'es')}`, w('sie', 'sie'))}</table>`;
  $('table').classList.add('on');
}

/* ---------- speaking ---------- */
let playing = [];
function stopAudio() { for (const au of playing) { au.pause(); } playing = []; for (const a of Object.values(A)) setB(a, 'talking', false); }
// one or more lines at the same moment (a chorus); waits until all have been said
// say('l01'), say('l09', 'm02') (both at once), say('l04', { frame: ['liv', 'opa'] }) or { frame: false } (no close-up)
async function say(...args) {
  const opt = typeof args[args.length - 1] === 'object' ? args.pop() : {}, ids = args;
  const gen = S.gen, lns = ids.map((id) => [id, S.lines.lines[id]]).filter(([, l]) => l); if (!lns.length) return;
  const [id0, l0] = lns[0]; caption(l0.who, l0.text);
  const talkers = [...new Set(lns.flatMap(([, l]) => l.who.split('+')))].map((k) => A[k]).filter(Boolean);
  const framed = opt.frame === false ? [] : (opt.frame ? opt.frame.map((k) => A[k]) : talkers).filter(inBase);
  if (l0.who === 'elisa') wide(); else if (framed.length && framed.length === (opt.frame || talkers).length) closeUp(framed);
  if (l0.who === 'lamb') village.bleat();
  const clips = lns.map(([id]) => S.audio.get(id)).filter(Boolean).slice(0, PLAYERS.length);
  let dur = Math.max(1.2, plain(l0.text).length * 0.068 + 0.5);    // reading time when a line has no recording
  if (clips.length && !S.muted) {
    stopAudio(); clips.forEach((u, i) => { const pl = PLAYERS[i]; pl.src = u; pl.currentTime = 0; playing.push(pl); });
    const ok = await Promise.all(playing.map((pl) => pl.play().then(() => true, () => false)));
    playing = playing.filter((_, i) => ok[i]); if (gen !== S.gen) { stopAudio(); throw new Abort(); }
    if (playing.length) dur = null;
  }
  talkers.forEach((a) => setB(a, 'talking', true));
  try {
    if (dur) await wait(dur, gen); else await until(() => playing.every((au) => au.ended || au.error || (au.paused && !S.paused)), gen);
    await wait(0.25, gen);
  } finally { talkers.forEach((a) => setB(a, 'talking', false)); playing = playing.filter((au) => !au.ended); }
}

/* ---------- the eight scenes ---------- */
const SCENES = [
  { name: 'Das Dorf', async run() {
    clearCards(); cast();
    S.cam.x = 8; S.cam.k = 0.85; const pan = cam(-2.2, 1, 11);
    await say('e01'); await pan;
  } },
  { name: 'ich', async run() {
    clearCards(); cast('liv'); await need('liv'); cam(-1.6, 1.05, 1.2);
    place(A.liv, -3.9, { left: false }); await walkTo(A.liv, -1.4, { run: true });
    trig(A.liv, 'wave'); face(A.liv, 'happy'); await say('l01'); card('ich'); await say('e02');
  } },
  { name: 'du', async run() {
    clearCards(); cast('liv', 'lena'); await need('liv', 'lena'); place(A.liv, -0.95, { left: false });
    place(A.lena, 5.2, { left: true }); cam(0.2, 1.05, 1.4); await walkTo(A.lena, 0.35);
    trig(A.liv, 'wave'); await say('l02'); trig(A.lena, 'wave'); await say('n01'); await say('l03'); card('du'); await say('e03');
  } },
  { name: 'Sie', async run() {
    clearCards(); cast('liv', 'lena', 'berger'); await need('lena', 'berger', 'liv'); place(A.liv, -0.95); place(A.lena, 0.35, { left: true });
    place(A.berger, 6.4, { left: true }); cam(0.6, 1.0, 1.4); turn(A.lena, false); await walkTo(A.berger, 1.65);
    await say('n02'); trig(A.berger, 'wave'); await say('b01'); await say('n03'); card('Sie'); await say('e04');
    walkTo(A.lena, 5.6); walkTo(A.berger, 6.15); await wait(0.6);
  } },
  { name: 'er · sie · es', async run() {
    clearCards(); cast('liv'); await need('liv', 'opa', 'huber');
    place(A.liv, -1.6, { left: true }); await cam(-2.6, 1.05, 1.2);
    trig(A.liv, 'point'); await say('l04', { frame: ['liv', 'opa'] }); trig(A.opa, 'wave'); await say('o01'); card('er');
    await cam(PLACES.bakery - 0.4, 1.0, 1.3); trig(A.huber, 'wave'); await say('l05'); card('sie');
    await cam(PLACES.pen + 0.6, 1.1, 1.6); await say('l06'); await say('f01'); card('es');
    await cam(-2.6, 0.9, 1.4); await say('e05');
  } },
  { name: 'wir · ihr', async run() {
    clearCards(); cast('liv', 'max'); await need('liv', 'max', 'opa'); place(A.liv, -1.6, { left: false }); cam(-1.0, 0.95, 1.2);
    await walkTo(A.liv, 0.3, { run: true }); turn(A.liv, true);
    place(A.max, -6, { left: false }); await say('l07', { frame: false }); await walkTo(A.max, -0.5, { run: true }); trig(A.max, 'wave'); await say('m01');
    turn(A.max, false); trig(A.liv, 'cheer'); trig(A.max, 'cheer'); await say('l08', { frame: ['liv', 'max'] }); wide(0.6); card('wir');
    turn(A.liv, true); turn(A.max, true); A.opa.sit = false; setB(A.opa, 'sitting', false); await wait(1.0); await say('o02', { frame: false }); card('ihr');
    await say('l09', 'm02', { frame: ['liv', 'max'] }); wide(0.6); walkTo(A.liv, PLACES.bench + 1.2, { run: true }); walkTo(A.max, PLACES.bench + 0.7, { run: true }); await say('e06');
  } },
  { name: 'sie · Sie', async run() {
    clearCards(); cast('lena', 'berger'); await need('lena', 'berger', 'huber');
    place(A.lena, 5.6, { left: false }); place(A.berger, 6.15, { left: false }); place(A.huber, PLACES.bakery, { d: -0.5, left: true }); await cam(6.4, 1.05, 1.3);
    await say('l10'); card('siePl'); trig(A.huber, 'wave'); await say('h01'); card('SiePl'); await say('x01'); await say('e07');
  } },
  { name: 'Alle', async run() {
    clearCards(); cast('liv', 'max'); await need('liv', 'max');
    place(A.liv, -0.3, { left: false }); place(A.max, 0.5, { left: true });
    await cam(0.1, 1.0, 1.2); table(); await say('e08'); trig(A.liv, 'wave'); await wait(0.8); $('table').classList.remove('on');
  } },
];

function dots() {
  $('dots').innerHTML = SCENES.map((s, i) => `<button title="${s.name}" aria-label="Szene ${i + 1}: ${s.name}" data-i="${i}">${i + 1}</button>`).join('');
  $('dots').onclick = (e) => { const b = e.target.closest('button'); if (b) watch(+b.dataset.i); };
}
function markDot() { [...$('dots').children].forEach((b, i) => { b.classList.toggle('on', i === S.scene); b.classList.toggle('done', i < S.scene); }); }
async function watch(from = 0) {
  abortAll(); setPractice(false); S.mode = 'watch'; setPaused(false); const gen = S.gen;
  try {
    for (let i = from; i < SCENES.length; i++) { S.scene = i; markDot(); await SCENES[i].run(); if (gen !== S.gen) return; await wait(0.4, gen); }
    S.scene = SCENES.length; markDot(); caption('elisa', 'Jetzt du! Tipp auf Liv oder auf „Selbst sprechen“.'); S.mode = 'idle'; $('try').focus();
  } catch (e) { if (!(e instanceof Abort)) console.error(e); }
}
function setPaused(p) {
  S.paused = p; $('play').textContent = p ? '▶' : '❚❚'; $('play').setAttribute('aria-label', p ? 'Weiter' : 'Pause');
  for (const au of playing) p ? au.pause() : au.play().catch(() => {});
  for (const a of Object.values(A)) if (a.r) p ? a.r.pause() : a.r.play();
}

/* ---------- practice ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function setPractice(on) { $('practice').classList.toggle('on', on); $('ctl').classList.toggle('pr', on); $('try').textContent = on ? 'Film ansehen' : 'Selbst sprechen'; $('ring').style.display = 'none'; }
const busy = (on) => $('practice').classList.toggle('busy', on);
function answerWith(text) { $('inp').value = text; $('ok').click(); }
async function ringOn(target) {
  const r = target === 'lamb' ? (() => { const p = village.lambAt(); const s = village.V.cam.z * 0.6; return { x: p.x - s / 2, y: p.y - s / 2, w: s, h: s }; })() : bodyRect(A[target]);
  const g = Math.max(r.w, r.h * 0.5), el = $('ring'); el.style.display = 'block'; el.style.left = (r.x + r.w / 2 - g / 2) + 'px'; el.style.top = (r.y + r.h * 0.05) + 'px'; el.style.width = g + 'px'; el.style.height = g + 'px';
}
function ask(item) {        // shows the answers and resolves with true (right) / false (wrong)
  return new Promise((ok) => {
    busy(false); if (!ask.keep) $('prompt').innerHTML = rich(item.prompt || (item.kind === 'choice' ? 'Wähle die richtige Antwort.' : '')); ask.keep = false;
    $('answers').innerHTML = ''; const isChoice = item.kind === 'choice';
    $('say').style.display = isChoice ? 'none' : 'flex'; $('inp').value = '';
    const chips = isChoice ? item.options : item.chips || [];
    chips.forEach((t, i) => { const b = document.createElement('button'); b.innerHTML = rich(t); b.onclick = () => { if (isChoice) done(i === item.right, plain(item.fill ? item.fill.replace('___', t) : t)); else { $('inp').value = plain(t).replace('…', ''); $('inp').focus(); } }; $('answers').appendChild(b); });
    const done = (right, said) => { $('ok').onclick = null; $('inp').onkeydown = null; busy(true); ok({ right, said }); };
    $('ok').onclick = () => {
      const v = $('inp').value.trim().replace(/[.!]+$/, ''); if (!v) { $('inp').focus(); return; }
      const m = new RegExp(item.accept, 'i').exec(v); done(!!m, v);
    };
    $('inp').onkeydown = (e) => { if (e.key === 'Enter') $('ok').click(); };
    if (isChoice) $('answers').querySelector('button').focus(); else $('inp').focus({ preventScroll: true });
    // speech: the text field for free answers, the closest option for choices
    $('mic').style.display = SR ? '' : 'none';
    $('mic').onclick = () => {
      const rec = new SR(); rec.lang = 'de-DE'; rec.interimResults = false; rec.maxAlternatives = 3; $('mic').classList.add('rec');
      rec.onresult = (e) => { const said = e.results[0][0].transcript.trim(); if (!isChoice) { $('inp').value = said.charAt(0).toUpperCase() + said.slice(1); $('ok').click(); return; }
        const norm = (s) => plain(s).toLowerCase().replace(/[^a-zäöüß ]/g, ''); const i = item.options.findIndex((o) => norm(said).includes(norm(o).split(' ')[0])); if (i >= 0) done(i === item.right, said); };
      rec.onend = () => $('mic').classList.remove('rec'); rec.onerror = () => $('mic').classList.remove('rec'); rec.start();
    };
  });
}
async function practise() {
  abortAll(); S.mode = 'practice'; setPaused(false); clearCards(); setPractice(true); busy(true); $('answers').innerHTML = ''; $('prompt').innerHTML = '&nbsp;'; $('inp').value = ''; const gen = S.gen; S.score = 0; S.asked = 0; $('score').textContent = '';
  try {
    if (['liv', 'max', 'berger', 'opa', 'huber'].some((k) => !A[k].clean)) caption('elisa', 'Einen Moment …');
    await need('liv', 'max', 'berger', 'opa', 'huber');
    cast('liv', 'max'); place(A.liv, -0.5, { left: false }); place(A.max, 0.3, { left: true });
    await cam(-0.2, 1.1, 1.0);
    let name = '';
    for (const item of S.lines.practice) {
      if (gen !== S.gen) return;
      $('ring').style.display = 'none';
      const by = item.by || 'liv';
      if (by === 'berger' && !A.berger.show) { place(A.berger, 4.5, { left: true }); cam(0.6, 1.0, 1.0); await walkTo(A.berger, 1.4); }
      if (item.point) { await cam(item.point === 'lamb' ? PLACES.pen + 0.8 : item.point === 'huber' ? PLACES.bakery - 0.6 : PLACES.bench + 0.7, 1.0, 1.1); ringOn(item.point); }
      busy(true); $('answers').innerHTML = ''; $('prompt').innerHTML = '&nbsp;';
      if (item.ask) { if (by === 'liv') trig(A.liv, item.point ? 'point' : 'wave'); await say(item.ask); }
      else caption('elisa', item.prompt);
      let res, tries = 0;
      while (true) {
        res = await Promise.race([ask(item), until(() => false, gen)]); tries++;
        if (res.right) break;
        face(A.liv, 'sad'); trig(A.liv, 'think'); await say('p11'); face(A.liv, 'happy');
        $('prompt').innerHTML = `<b class="no">Noch nicht.</b> ${rich(item.why || item.hint || '')}`; ask.keep = true; if (tries >= 2 && item.kind === 'choice') { res = { right: false }; break; }
      }
      S.asked++; if (res.right && tries === 1) S.score++;
      $('prompt').innerHTML = res.right ? '<b class="ok">Richtig!</b>' : `Richtig ist: ${rich(item.fill ? item.fill.replace('___', item.options[item.right]) : item.options ? item.options[item.right] : '')}`;
      $('score').textContent = `${S.score} / ${S.asked}`;
      $('ring').style.display = 'none';
      if (item.kind === 'name' && res.right) { const m = new RegExp(item.accept, 'i').exec(res.said); name = (m && m[m.length - 1] || '').replace(/[.!]$/, ''); caption('you', res.said + '.'); await wait(0.6); }
      else if (res.said) { caption('you', res.said); await wait(0.5); }
      const who = by === 'max' ? A.max : by === 'berger' ? A.berger : A.liv;
      if (res.right) {
        trig(who, 'cheer'); face(who, 'laugh');
        if (item.after) { await say(item.after); if (item.after === 'p02' && name) { $('cap').querySelector('.t').innerHTML += ` <b>${esc(name)}!</b>`; await wait(1.0); } }
        else await say(by === 'max' ? 'p13' : 'p10');
        face(who, 'happy');
      } else await wait(2.4);              // two wrong tries: the right answer stays on screen a moment, then the next question
      if (item.point) await cam(-0.2, 1.1, 1.0);
    }
    setPractice(false); trig(A.liv, 'cheer'); trig(A.max, 'cheer'); await say('p12');
    caption('elisa', `Fertig! Beim ersten Versuch richtig: ${S.score} von ${S.asked}.`); S.mode = 'idle';
  } catch (e) { if (!(e instanceof Abort)) console.error(e); }
}

/* ---------- the frame ---------- */
let last = performance.now(), visible = true;
function frame(now) {
  const dt = Math.min(TEST ? 2 : 0.25, (now - last) / 1000); last = now;
  if (!S.paused) {
    S.t += dt;
    for (const tw of S.tweens) { const k = Math.min(1, (S.t - tw.t0) / tw.dur); tw.obj[tw.key] = tw.a + (tw.b - tw.a) * ss(k); if (k >= 1) { tw.done = true; tw.ok(); } }
    S.tweens = S.tweens.filter((tw) => !tw.done);
    stepActors(dt);
    const due = S.waits.filter((w) => w.gen !== S.gen || (w.at != null ? S.t >= w.at : w.fn()));
    S.waits = S.waits.filter((w) => !due.includes(w)); due.forEach((w) => (w.gen !== S.gen ? w.no(new Abort()) : w.ok()));
  }
  village.setCam(S.cam.x, S.Z0 * S.cam.k, S.cam.ty);
  if (visible) { village.draw(S.t, S.paused ? 0 : dt); drawActors(); }
  if (!TEST) requestAnimationFrame(frame);
}

/* ---------- start ---------- */
fitStage(); new ResizeObserver(() => { fitStage(); }).observe($('stage'));
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
village.setCam(S.cam.x, S.Z0 * S.cam.k);
if (TEST) setInterval(() => frame(performance.now()), 33); else requestAnimationFrame(frame);   // test pages keep time even in a background tab
dots();
for (const k of LOAD_ORDER) makeActor(k);
if (EMBED) {                    // in the lesson page: tell it our height (the frame grows with the answers) and offer ✕
  const tell = () => parent.postMessage({ type: 'werkstatt-height', h: $('app').getBoundingClientRect().height + 4 }, location.origin);
  new ResizeObserver(tell).observe($('app')); tell();
  const x = document.createElement('button'); x.textContent = '✕'; x.title = 'Schließen'; x.setAttribute('aria-label', 'Schließen');
  x.onclick = () => { stopAudio(); parent.postMessage({ type: 'werkstatt-close' }, location.origin); }; $('corner').appendChild(x);
}
window.__dorf = { S, A, village, watch, practise, setPaused, cam: S.cam, isClean, players: PLAYERS };   // for checks
$('sound').onclick = () => { S.muted = !S.muted; $('sound').textContent = S.muted ? '🔇' : '🔊'; $('sound').setAttribute('aria-pressed', String(!S.muted)); $('sound').setAttribute('aria-label', S.muted ? 'Ton aus' : 'Ton an'); if (S.muted) stopAudio(); };
$('full').onclick = () => { const el = $('app'); if (document.fullscreenElement) document.exitFullscreen(); else (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el); };
$('play').onclick = () => { if (S.mode === 'idle') watch(Math.max(0, Math.min(S.scene, SCENES.length - 1))); else setPaused(!S.paused); };
$('prev').onclick = () => watch(Math.max(0, S.scene - 1));
$('next').onclick = () => watch(Math.min(SCENES.length - 1, S.scene + 1));
$('try').onclick = () => (S.mode === 'practice' ? watch(0) : practise());
$('stage').addEventListener('click', (e) => {      // tap Liv (or Max) to practise with her
  if (!S.lines || $('start').style.display !== 'none') return;
  const b = $('stage').getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
  for (const k of ['liv', 'max']) { const a = A[k]; if (!a.show) continue; const r = bodyRect(a); if (x > r.x - 10 && x < r.x + r.w + 10 && y > r.y && y < r.y + r.h) { if (S.mode !== 'practice') practise(); return; } }
});
(async () => {
  let lines = null; try { lines = await loadLines(); } catch (e) { lines = null; }
  if (!lines) { $('load').textContent = EMBED ? 'Melde dich mit deinem A1-Zugang an, dann spielt die Szene mit Ton.' : 'Nicht verfügbar: diese Szene öffnet sich aus der Lektion.'; return; }
  S.lines = lines; preloadAudio(Object.keys(lines.lines));
  // Opa and Frau Huber are in the village from the start
  place(A.opa, PLACES.bench, { d: -0.32 }); A.opa.sit = true; place(A.huber, PLACES.bakery, { d: -0.5, left: true });
  // the first scene is Elisa over the village (about 10 s): the figures finish loading meanwhile, so start at once
  $('goWatch').disabled = false; $('goTry').disabled = false; $('load').textContent = '';
  const go = (fn) => { unlockAudio(); $('start').style.display = 'none'; fn(); };
  $('goWatch').onclick = () => go(() => watch(0)); $('goTry').onclick = () => go(() => practise());
})();
