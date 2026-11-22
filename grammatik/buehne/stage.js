/* Die Bühne (M0): the shared runtime of the animated grammar scenes (plan: docs/grammar-animation-plan.md §1.5).
   Taken from grammatik/dorf/main.js (Im Dorf, Kapitel 1), made independent of the village and of chapter 1:
   - the 2D Rive figures of the cast (loading, the Rive logo check, walking, gestures, faces, talking, mirroring),
   - a set (the drawn place) with the village's interface: size, setCam, foot, draw, V,
   - the camera (wide framing per scene, close-ups on whoever speaks, also vertical),
   - lines and captions, two audio players with the iPhone unlock, reading time for lines not yet recorded,
   - a scene clock with waits and tweens that stop while paused and abort cleanly when the learner jumps,
   - scene dots, pause, the start box, embedding (height, close, private cues by postMessage), test hooks.
   Like every lesson scene, nothing here holds lesson text: the chapter's lines come from its private lines file
   (?local, from the git-ignored .local/scenes/<chapter>/) or, embedded, from the lesson page. */

const qs = new URLSearchParams(location.search);
export const LOCAL = qs.has('local'), EMBED = window.parent !== window, TEST = qs.has('test');
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* The scene's language: German throughout (default), or ?lang=en, the bilingual version: the narrator explains in
   English with the German examples woven in, characters speak German with an English gloss under their line, and the
   buttons and feedback are English.
   ?lang=sw and ?lang=fr are built the same way, explained in Kenyan Swahili and in standard French. */
export const LANGS = ['de', 'en', 'sw', 'fr'];
export const LANG = LANGS.includes(qs.get('lang')) ? qs.get('lang') : 'de';
// short (default) or long: the detailed version with an introduction; VERSION is what the feedback form rates
export const LONG = qs.get('form') === 'long', VERSION = LANG + (LONG ? '-long' : '');
const UI = {
  de: { narrator: 'Erzählerin', you: 'Du', watch: '▶ Zuschauen', play: 'Mitspielen', film: 'Film ansehen', check: 'Prüfen', right: 'Richtig!', notyet: 'Noch nicht.',
    nofit: 'Passt nicht.', rightis: 'Richtig ist:', almost: 'Fast.', oops: 'Hoppla!', wait: '…', done: 'Fertig! Beim ersten Versuch richtig: {s} von {n}.', turn: 'Jetzt du! Tipp auf „Mitspielen“.',
    signin: 'Melde dich mit deinem Zugang an, dann spielt die Szene mit Ton.', none: 'Nicht verfügbar: diese Szene öffnet sich aus der Lektion.', write: 'Schreib …', loading: 'Lädt …' },
  en: { narrator: 'Narrator', you: 'You', watch: '▶ Watch', play: 'Play along', film: 'Watch the film', check: 'Check', right: 'Correct!', notyet: 'Not yet.',
    nofit: "That doesn't fit.", rightis: 'The right answer:', almost: 'Almost.', oops: 'Oops!', wait: '…', done: 'Done! Right the first time: {s} of {n}.', turn: 'Your turn! Tap “Play along”.',
    signin: 'Sign in with your access, then the scene plays with sound.', none: 'Not available: this scene opens from the lesson.', write: 'Write …', loading: 'Loading …' },
  sw: { narrator: 'Msimulizi', you: 'Wewe', watch: '▶ Tazama', play: 'Cheza pamoja', film: 'Tazama filamu', check: 'Kagua', right: 'Sahihi!', notyet: 'Bado.',
    nofit: 'Haifai.', rightis: 'Jibu sahihi:', almost: 'Karibu.', oops: 'Lo!', wait: '…', done: 'Umemaliza! Sahihi mara ya kwanza: {s} kati ya {n}.', turn: 'Sasa ni zamu yako! Bonyeza “Cheza pamoja”.',
    signin: 'Ingia kwa akaunti yako, kisha onyesho litacheza na sauti.', none: 'Haipatikani: onyesho hili linafunguliwa kutoka kwenye somo.', write: 'Andika …', loading: 'Inapakia …' },
  fr: { narrator: 'Narratrice', you: 'Toi', watch: '▶ Regarder', play: 'Jouer', film: 'Voir le film', check: 'Vérifier', right: 'Correct\u202f!', notyet: 'Pas encore.',
    nofit: 'Ça ne va pas.', rightis: 'La bonne réponse\u202f:', almost: 'Presque.', oops: 'Oups\u202f!', wait: '…', done: 'Terminé\u202f! Juste du premier coup\u202f: {s} sur {n}.', turn: 'À toi\u202f! Appuie sur «\u202fJouer\u202f».',
    signin: 'Connecte-toi avec ton accès, et la scène se joue avec le son.', none: 'Non disponible\u202f: cette scène s’ouvre depuis la leçon.', write: 'Écris …', loading: 'Chargement …' },
};
// the switches under the film, in the language of the version being watched (button titles in the button's own language)
const SW = {
  de: { group: 'Erklärungen auf', label: 'Erklärung:', length: 'Länge', short: 'Kurz', long: 'Lang', tShort: 'Die kurze Version', tLong: 'Länger, mit Einführung und mehr Details', title: 'Alles auf Deutsch' },
  en: { group: 'Explanations in', label: 'Explanations:', length: 'Length', short: 'Short', long: 'Long', tShort: 'The short version', tLong: 'Longer, with an introduction and more detail', title: 'Explanations in English, examples in German' },
  sw: { group: 'Maelezo kwa', label: 'Maelezo:', length: 'Urefu', short: 'Fupi', long: 'Ndefu', tShort: 'Toleo fupi', tLong: 'Ndefu zaidi, na utangulizi na maelezo zaidi', title: 'Maelezo kwa Kiswahili, mifano kwa Kijerumani' },
  fr: { group: 'Explications en', label: 'Explications\u202f:', length: 'Durée', short: 'Court', long: 'Long', tShort: 'La version courte', tLong: 'Plus long, avec une introduction et plus de détails', title: 'Explications en français, exemples en allemand' },
};
export const T = (k, vars = {}) => (UI[LANG][k] || UI.de[k] || k).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');
// the narrator: Elisa in the German scenes, the English-speaking narrator in the bilingual ones (she has no figure)
export const isNarrator = (who) => who === 'elisa' || who === 'narrator';
const SPEED = Math.max(0.25, Math.min(8, +qs.get('speed') || 1));    // checks only: &speed=3 runs the scene clock three times as fast
const RIVE_JS = 'https://cdn.jsdelivr.net/npm/@rive-app/canvas@2.49.0/rive.js';
const RIV_DIR = '../../tools/liv3d/models/cast/2d/';
export const $ = (id) => document.getElementById(id);

/* The whole cast (2D Rive, artboard 1536 x 2048 px). m = the artboard's height in metres, g = the feet line in pixels
   (both from <id>.motion.json). col = the speaker's colour in the captions. */
export const CAST = {
  liv:    { id: 'c01', name: 'Liv', col: '#d2453b', m: 1.3026, g: 2016.6, kid: true },
  max:    { id: 'c02', name: 'Max', col: '#c99a2e', m: 1.4584, g: 2019.9, kid: true },
  mia:    { id: 'c03', name: 'Mia', col: '#d9688f', m: 1.2909, g: 2016.3, kid: true },
  finn:   { id: 'c04', name: 'Finn', col: '#c46a2b', m: 1.4139, g: 2019.0, kid: true },
  opa:    { id: 'a01', name: 'Opa Sepp', col: '#7a5434', m: 1.7595, g: 2024.7 },
  anton:  { id: 'a02', name: 'Meister Anton', col: '#8a5a2b', m: 2.1286, g: 2028.8 },
  lena:   { id: 'a03', name: 'Lena', col: '#9b5fb5', m: 1.9725, g: 2027.2 },
  huber:  { id: 'a04', name: 'Frau Huber', col: '#4f8a52', m: 1.7248, g: 2024.3 },
  berger: { id: 'a05', name: 'Herr Berger', col: '#3d4f6b', m: 2.204, g: 2029.4 },
  adler:  { id: 'a06', name: 'Frau Adler', col: '#3f6fa0', m: 1.9531, g: 2027.0 },
};
export const SPEAKER = { elisa: { name: T('narrator'), col: '#2f7d5b' }, narrator: { name: T('narrator'), col: '#2f7d5b' }, you: { name: T('you'), col: '#2f7d5b' }, lamb: { name: 'Flocke', col: '#8a8a8a' } };

/* Text marks used in lines, captions, cards and tiles (the grammar pages' own marks):
   {v:…} the conjugated verb (Position 2), {t:…} the verb part at the end, {e:…} an important part (ending, vowel),
   {n:…} {a:…} {d:…} {g:…} the cases. */
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const plain = (s) => String(s == null ? '' : s).replace(/\{[a-z]+:([^}]*)\}/g, '$1');
export const rich = (s) => esc(s).replace(/\{([a-z]+):([^}]*)\}/g, (_, k, t) => `<span class="cs ${k}">${t}</span>`);

/* create the stage
   set: the drawn place ({ V, size, setCam, foot, draw })
   priv: the private folder for ?local (e.g. '../../.local/scenes/k05/'), tag: the cue tag when embedded ('k05')
   keys: the figures this chapter uses, in loading order (the first is waited for before the start buttons)
   onCast(keys): put the figures that always live in the set in their places (called at every scene start) */
export function createStage({ set, priv, tag, keys, onCast = () => {}, z0 = 2.75, minW = 3.6 }) {
  const S = { t: 0, paused: false, gen: 0, scene: -1, mode: 'idle', cam: { x: 0, k: 1, ty: 0 }, base: { x: 0, k: 1, ty: 0 }, close: false,
    waits: [], tweens: [], muted: false, lines: null, audio: new Map(), Z0: 100, scenes: [], hooks: [] };
  const A = {};

  /* ---------- loading ---------- */
  let riveReady = null;
  const loadRiveJs = () => riveReady || (riveReady = new Promise((ok, bad) => { const s = document.createElement('script'); s.src = RIVE_JS; s.crossOrigin = 'anonymous'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }));
  function makeActor(key) {
    const C = CAST[key], cv = document.createElement('canvas'); cv.width = 300; cv.height = 400; $('people').appendChild(cv);
    const a = { key, C, cv, x: -20, d: 0, left: false, show: false, tx: null, speed: 1, run: false, r: null, vm: null, clean: false, checked: 0, sit: false, cssH: 0 };
    a.ready = loadRiveJs().then(() => new Promise((ok) => {
      const r = new window.rive.Rive({ src: RIV_DIR + C.id + '.riv', canvas: cv, artboard: C.id.toUpperCase() + ' 3q', stateMachines: 'Character', autoplay: true, autoBind: true,
        onLoad: () => { a.r = r; a.vm = r.viewModelInstance; setB(a, 'sitting', a.sit); setB(a, 'facingLeft', a.left); ok(a); },
        onLoadError: () => { console.warn('could not load', C.id); ok(a); } });
    })).catch(() => a);
    A[key] = a; return a;
  }
  const setB = (a, k, v) => { const p = a && a.vm && a.vm.boolean(k); if (p && p.value !== v) p.value = v; };
  const trig = (a, k) => { const p = a && a.vm && a.vm.trigger(k); if (p) p.trigger(); };
  const face = (a, f) => { const p = a && a.vm && a.vm.enum('face'); if (p) p.value = f; };
  // The free Rive plan draws its logo screen (opaque, edge to edge) for the first moments of every file; a figure's own
  // artboard leaves the corners empty. So a figure is shown only once its canvas corner is transparent.
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); probe.canvas.width = probe.canvas.height = 2;
  function isClean(a) {
    const W = a.cv.width, H = a.cv.height, px = (x, y) => { probe.clearRect(0, 0, 2, 2); probe.drawImage(a.cv, x, y, 2, 2, 0, 0, 2, 2); return probe.getImageData(0, 0, 2, 2).data; };
    const corner = px(0, 0), body = px(Math.round(W / 2) - 1, Math.round(H * 0.6));
    return corner[3] === 0 && corner[15] === 0 && body[3] > 0;
  }
  async function need(...ks) { const gen = S.gen; await Promise.all(ks.map((k) => A[k].ready)); while (ks.some((k) => A[k].r && !A[k].clean)) await new Promise((r) => setTimeout(r, 80)); live(gen); }

  async function loadLines() {
    if (LOCAL) { const r = await fetch(priv + 'lines.json', { cache: 'no-store' }); if (!r.ok) throw Error('no lines'); return r.json(); }
    if (EMBED) return new Promise((ok) => {           // the lesson page sends the chapter's private cues (text + signed audio links)
      addEventListener('message', (e) => {
        if (e.origin !== location.origin || !e.data || e.data.type !== 'werkstatt-audio') return;
        const cues = e.data.audio; if (!cues) { ok(null); return; }
        const out = { lines: {} };
        for (const [cid, v] of Object.entries(cues)) {        // "<tag>|<line>|<who>"; the cue "<tag>|data|-" carries the rest as JSON
          const [t, id, who] = cid.split('|'); if (t !== tag || !v || typeof v.say !== 'string') continue;
          if (id === 'data') { try { Object.assign(out, JSON.parse(v.say)); } catch (err) { /* nothing */ } }
          else out.lines[id] = { who, text: v.say, url: v.seconds > 0.2 ? v.url : null };
        }
        ok(Object.keys(out.lines).length ? out : null);
      });
      parent.postMessage({ type: 'werkstatt-ready', scene: tag }, location.origin);
    });
    return null;
  }
  const audioUrl = (ln) => ln.url || (ln.audio && LOCAL ? priv + ln.audio : null);
  // Two shared players (two voices can speak at once): iPhones only let a page play sound from an element that first
  // played inside a tap, so both are started silently in the Start tap and then reused for every line.
  const PLAYERS = [new Audio(), new Audio()];
  const SILENT = URL.createObjectURL(new Blob([(() => { const n = 800, b = new DataView(new ArrayBuffer(44 + n * 2)), s = (o, x) => [...x].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
    s(0, 'RIFF'); b.setUint32(4, 36 + n * 2, true); s(8, 'WAVEfmt '); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true); b.setUint32(24, 16000, true); b.setUint32(28, 32000, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); s(36, 'data'); b.setUint32(40, n * 2, true); return b.buffer; })()], { type: 'audio/wav' }));
  function unlockAudio() { for (const pl of PLAYERS) { pl.src = SILENT; pl.play().catch(() => {}); } }
  function preloadAudio(ids) {
    for (const id of ids) { const ln = S.lines.lines[id]; const u = ln && audioUrl(ln); if (u) S.audio.set(id, u); }
    (async () => { for (const u of new Set(S.audio.values())) { try { await (await fetch(u, { priority: 'low' })).arrayBuffer(); } catch (e) { /* later */ } } })();
  }

  /* ---------- clock, waits, tweens ---------- */
  class Abort extends Error {}
  const ss = (k) => k * k * (3 - 2 * k);
  const wait = (sec, gen = S.gen) => new Promise((ok, no) => S.waits.push({ at: S.t + sec, ok, no, gen }));
  const until = (fn, gen = S.gen) => new Promise((ok, no) => S.waits.push({ fn, ok, no, gen }));
  const tween = (obj, key, to, dur, ease = ss) => new Promise((ok) => S.tweens.push({ obj, key, a: obj[key], b: to, t0: S.t, dur: Math.max(0.001, REDUCED && dur > 0.3 ? 0.001 : dur), ok, ease }));
  function abortAll() { S.gen++; for (const w of S.waits) w.no(new Abort()); S.waits = []; S.tweens = []; stopAudio(); }
  const live = (gen) => { if (gen !== S.gen) throw new Abort(); };

  /* ---------- people ---------- */
  function place(a, x, { d = 0, left = false, show = true } = {}) { a.x = x; a.d = d; a.left = left; a.show = show; a.tx = null; setB(a, 'walking', false); setB(a, 'running', false); setB(a, 'facingLeft', left); }
  function walkTo(a, x, { run = false, speed } = {}) {
    a.tx = x; a.run = run; a.speed = speed || (run ? 2.2 : a.C.kid ? 0.95 : 1.0); a.left = x < a.x; setB(a, 'facingLeft', a.left);
    setB(a, run ? 'running' : 'walking', true); setB(a, run ? 'walking' : 'running', false); a.show = true;
    return until(() => a.tx === null);
  }
  function cast(...show) {           // who is in a scene: the named figures may be shown, everyone else is hidden
    for (const a of Object.values(A)) { a.tx = null; setB(a, 'walking', false); setB(a, 'running', false); if (!show.includes(a.key)) a.show = false; }
    onCast(show);
  }
  const turn = (a, left) => { a.left = left; setB(a, 'facingLeft', left); };
  const faceTo = (a, b) => turn(a, b.x < a.x);
  const sit = (a, on) => { a.sit = on; setB(a, 'sitting', on); };
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
      const f = set.foot(a.x, a.d), h = a.C.m * set.V.cam.z * f.k, w = h * 0.75;
      a.cv.style.width = w + 'px'; a.cv.style.height = h + 'px';
      // Rive stops drawing a canvas outside the window: until its logo screen is over, a figure waits inside the picture
      const sx = a.clean ? f.x - w / 2 : 0, sy = a.clean ? f.y - h * a.C.g / 2048 : 0;
      a.cv.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`; a.cv.style.zIndex = 10 + i;
      if (Math.abs(h - a.cssH) > a.cssH * 0.08 + 1) { a.cssH = h; a.r.resizeDrawingSurfaceToCanvas(Math.min(dpr, 2048 / h)); }
    });
  }
  // what is on screen that explanations should not cover: every shown figure (and whatever chapters add, e.g. animals)
  const occupiers = [];
  function occupied() {
    const out = Object.values(A).filter((a) => a.show && a.clean).map((a) => ({ ...bodyRect(a), who: a.key }));
    for (const f of occupiers) out.push(...f());
    return out;
  }
  function bodyRect(a) { const f = set.foot(a.x, a.d), h = a.C.m * set.V.cam.z * f.k * 0.86; return { x: f.x - h * 0.2, y: f.y - h, w: h * 0.4, h }; }

  /* ---------- camera ---------- */
  function fitStage() {
    const st = $('stage'), W = Math.max(1, st.clientWidth), H = Math.max(1, st.clientHeight), dpr = Math.min(2, devicePixelRatio || 1);
    set.size(W, H, dpr); S.Z0 = Math.min((H * 0.8) / z0, W / minW);     // a narrow picture still shows minW metres
  }
  // the scene's own (wide) framing; ty lifts the view in metres (cross-sections, high shelves)
  function cam(x, k = 1, dur = 1.2, ty = 0) {
    if (S.close) dur = 0.001;                                  // out of a close-up: a cut
    if (S.zoom === false && Math.abs(k - S.cam.k) > 0.01) dur = 0.001;   // no zooming: a new framing is a cut
    S.base = { x, k, ty }; S.close = false; return Promise.all([tween(S.cam, 'x', x, dur), tween(S.cam, 'k', k, dur), tween(S.cam, 'ty', ty, dur)]); }
  const figH = (a) => a.C.m / 1.18;
  function closeUp(list, dur = 0.7) {           // head to about the waist, faces in the upper third
    const H = set.V.H, W = set.V.W, Z0 = S.Z0, tall = Math.max(...list.map(figH));
    // S.room: the film keeps the upper part of the picture free for the bubble (face lower, a little wider)
    const fill = S.room ? 1.2 : 1.65, eye = S.room ? 0.64 : 0.37;
    let k = fill * H / (tall * Z0), x;
    if (list.length === 1) { const a = list[0]; x = a.x + (a.left ? -1 : 1) * 0.1 * figH(a); }
    else { const xs = list.map((a) => a.x), span = Math.max(...xs) - Math.min(...xs) + 0.9; x = (Math.max(...xs) + Math.min(...xs)) / 2; k = Math.min(k, W * 0.92 / (span * Z0)); }
    const lift = Math.max(...list.map((a) => (a.d < 0 ? -a.d / 2.6 * 1.05 : -a.d * 0.55)));
    k = Math.max(S.base.k, Math.min(4.6, k)); const Z = Z0 * k, head = tall * 0.87 + lift;
    const ty = Math.max(0, (eye * H + head * Z - 0.8 * H) / Z);
    // from one close-up to a speaker far away: a cut, not a whip pan across the room
    if (S.close && Math.abs(x - S.cam.x) * Z > W * 0.6) dur = 0.001;
    S.close = true; tween(S.cam, 'x', x, dur); tween(S.cam, 'k', k, dur); tween(S.cam, 'ty', ty, dur);
  }
  function wide(dur = 0.8) { if (!S.close) return; S.close = false; tween(S.cam, 'x', S.base.x, dur); tween(S.cam, 'k', S.base.k, dur); tween(S.cam, 'ty', S.base.ty, dur); }
  // in the scene's wide shot as it would be on a wide screen (a phone shows less, but may still go close on the speaker)
  const inBase = (a) => a.show && Math.abs(a.x - S.base.x) < Math.max(set.V.W / (2 * S.Z0 * S.base.k), 3.1 / S.base.k) - 0.15;

  /* ---------- words ---------- */
  function caption(who, text, gloss) {
    const sp = CAST[who] || SPEAKER[who] || { name: who.split('+').map((k) => (CAST[k] || SPEAKER[k] || { name: k }).name).join(' und '), col: (CAST[who.split('+')[0]] || { col: '#999' }).col };
    $('cap').innerHTML = `<span class="who" style="--c:${sp.col}"><i></i>${esc(sp.name)}</span><span class="tx">${rich(text)}</span>${gloss ? `<span class="gl">${rich(gloss)}</span>` : ''}`;
  }
  const text = (id) => { const l = S.lines.lines[id]; return l ? l.text : ''; };
  const data = (k) => (S.lines && S.lines[k]) || {};

  /* ---------- speaking ---------- */
  let playing = [];
  const sayHooks = [];                 // called with the speaker of every line (the bubble closes for someone else)
  function stopAudio() { for (const au of playing) au.pause(); playing = []; for (const a of Object.values(A)) setB(a, 'talking', false); }
  // say('l01'), say('l09', 'm02') (two at once), say('l04', { frame: ['liv', 'opa'] }) or { frame: false } (no close-up)
  async function say(...args) {
    const opt = args.length && typeof args[args.length - 1] === 'object' ? args.pop() : {}, ids = args;
    const gen = S.gen, lns = ids.map((id) => [id, S.lines.lines[id]]).filter(([, l]) => l); if (!lns.length) return;
    const [id0, l0] = lns[0]; caption(l0.who, l0.text, l0.gloss || l0.en || (S.lines.glosses || {})[id0]); for (const h of sayHooks) h(l0.who, id0);
    const talkers = [...new Set(lns.flatMap(([, l]) => l.who.split('+')))].map((k) => A[k]).filter(Boolean);
    const framed = opt.frame === false ? [] : (opt.frame ? opt.frame.map((k) => A[k]) : talkers).filter(inBase);
    if (S.zoom === false) { /* the camera stays; the spotlight shows who speaks */ } else if (isNarrator(l0.who)) wide(); else if (framed.length && framed.length === (opt.frame || talkers).length) closeUp(framed);
    const clips = lns.map(([id]) => S.audio.get(id)).filter(Boolean).slice(0, PLAYERS.length);
    let dur = Math.max(1.2, plain(l0.text).length * 0.068 + 0.5);    // reading time when a line has no recording
    if (clips.length && !S.muted) {
      stopAudio(); clips.forEach((u, i) => { const pl = PLAYERS[i]; pl.src = u; pl.currentTime = 0; playing.push(pl); });
      const ok = await Promise.all(playing.map((pl) => pl.play().then(() => true, () => false)));
      playing = playing.filter((_, i) => ok[i]); if (gen !== S.gen) { stopAudio(); throw new Abort(); }
      if (playing.length) dur = null;
    }
    S.line = { id: id0, who: l0.who, text: plain(l0.text), t0: S.t, dur: dur || 1, au: dur ? null : playing[0] };
    talkers.forEach((a) => setB(a, 'talking', true));
    try {
      if (dur) await wait(dur * (opt.slow || 1), gen); else await until(() => playing.every((au) => au.ended || au.error || (au.paused && !S.paused)), gen);
      await wait(0.25, gen);
    } finally { talkers.forEach((a) => setB(a, 'talking', false)); playing = playing.filter((au) => !au.ended); }
  }

  // how far the current line is (0 … 1): from its recording, or from its reading time; at(word) is when a word is said
  function progress() {
    const L = S.line; if (!L) return 0;
    if (L.au && L.au.duration > 0) return Math.min(1, L.au.currentTime / L.au.duration);
    return Math.min(1, (S.t - L.t0) / L.dur);
  }
  /* ---------- scenes ---------- */
  function dots() {
    $('dots').innerHTML = S.scenes.map((s, i) => `<button title="${esc(s.name)}" aria-label="Szene ${i + 1}: ${esc(s.name)}" data-i="${i}">${i + 1}</button>`).join('');
    $('dots').onclick = (e) => { const b = e.target.closest('button'); if (b) watch(+b.dataset.i); };
  }
  function markDot() { [...$('dots').children].forEach((b, i) => { b.classList.toggle('on', i === S.scene); b.classList.toggle('done', i < S.scene); }); }
  const resetHooks = [];
  // the versions this visitor has watched (or practised) a part of, per scene, in this browser only
  function seen() { try { const k = 'buehne-seen-' + tag.replace(/(-en|-sw|-fr)?(-long)?$/, ''), v = new Set(JSON.parse(localStorage.getItem(k) || '[]')); v.add(VERSION); localStorage.setItem(k, JSON.stringify([...v])); } catch (e) { /* private mode */ } }
  async function watch(from = 0) {
    abortAll(); for (const h of resetHooks) h('watch'); S.mode = 'watch'; setPaused(false); const gen = S.gen;
    try {
      for (let i = from; i < S.scenes.length; i++) { S.scene = i; markDot(); for (const h of resetHooks) h('scene'); await S.scenes[i].run(); if (gen !== S.gen) return; seen(); await wait(0.5, gen); }
      S.scene = S.scenes.length; markDot(); S.mode = 'idle'; seen(); if (S.onEnd) S.onEnd();
    } catch (e) { if (!(e instanceof Abort)) console.error(e); }
  }
  function setPaused(p) {
    S.paused = p; $('play').textContent = p ? '▶' : '❚❚'; $('play').setAttribute('aria-label', p ? 'Weiter' : 'Pause');
    for (const au of playing) p ? au.pause() : au.play().catch(() => {});
    for (const a of Object.values(A)) if (a.r) p ? a.r.pause() : a.r.play();
  }

  /* ---------- the frame ---------- */
  let last = performance.now(), visible = true;
  const onFrame = [];
  function frame(now) {
    const dt = Math.min(TEST ? 2 : 0.25, (now - last) / 1000) * SPEED; last = now;
    if (!S.paused) {
      S.t += dt;
      for (const tw of S.tweens) { const k = Math.min(1, (S.t - tw.t0) / tw.dur); tw.obj[tw.key] = tw.a + (tw.b - tw.a) * tw.ease(k); if (k >= 1) { tw.done = true; tw.ok(); } }
      S.tweens = S.tweens.filter((tw) => !tw.done);
      stepActors(dt);
      const due = S.waits.filter((w) => w.gen !== S.gen || (w.at != null ? S.t >= w.at : w.fn()));
      S.waits = S.waits.filter((w) => !due.includes(w)); due.forEach((w) => (w.gen !== S.gen ? w.no(new Abort()) : w.ok()));
    }
    set.setCam(S.cam.x, S.Z0 * S.cam.k, S.cam.ty);
    if (visible) { set.draw(S.t, S.paused ? 0 : dt); drawActors(); for (const f of onFrame) f(S.t, dt); }
    if (!TEST) requestAnimationFrame(frame);
  }

  /* ---------- start ---------- */
  // scenes: [{ name, run }]; practise: the practice (async); welcome: the line shown when the film ends
  // langs: ['de', 'en'] shows the switch (reloads the scene in the other language, kept in the address);
  // feedback: the scene's key, shows the feedback button (meinung.js)
  // long: the scene also has the long versions (?form=long): a second switch, short | long
  function start({ scenes, practise, end, langs, long, feedback }) {
    const copy = document.createElement('div'); copy.className = 'play-copy';
    $('panel').prepend(copy); copy.append($('cap'), $('practice'));
    const round = document.createElement('div'); round.id = 'round'; round.setAttribute('role', 'progressbar'); round.setAttribute('aria-label', T('play')); round.setAttribute('aria-valuemin', '0');
    $('panel').prepend(round);
    const soundIcon = () => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>' + (S.muted ? '<path d="m16 9 5 6m0-6-5 6"/>' : '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>') + '</svg>';
    $('sound').innerHTML = soundIcon();
    $('full').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
    // a slim row under the controls: the language switch (left) and the feedback button (right)
    if ((langs && langs.length > 1) || long || feedback) { const m = document.createElement('div'); m.id = 'meta'; $('ctl').after(m); }
    if (langs && langs.length > 1) {
      const sw = document.createElement('div'); sw.id = 'langsw'; sw.setAttribute('role', 'group'); sw.setAttribute('aria-label', SW[LANG].group);
      sw.innerHTML = langs.map((l) => `<button type="button" data-l="${l}" class="${l === LANG ? 'on' : ''}" aria-pressed="${l === LANG}" title="${SW[l].title}">${l.toUpperCase()}</button>`).join('');
      sw.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.l === LANG) { sw.classList.toggle('open'); return; }   // .open: a narrow practice panel shows the other languages only on request
      stopAudio(); const u = new URL(location.href); if (b.dataset.l === 'de') u.searchParams.delete('lang'); else u.searchParams.set('lang', b.dataset.l); location.replace(u); };
      const lab = document.createElement('span'); lab.className = 'meta-l'; lab.textContent = SW[LANG].label;
      if (long) lab.hidden = true;                    // two switches: no room for the label on a phone
      $('meta').append(lab, sw);
    }
    if (long) {
      const fw = document.createElement('div'); fw.id = 'formsw'; fw.className = 'seg'; fw.setAttribute('role', 'group'); fw.setAttribute('aria-label', SW[LANG].length);
      const names = SW[LANG], now = LONG ? 'long' : 'short';
      fw.innerHTML = ['short', 'long'].map((f) => `<button type="button" data-f="${f}" class="${f === now ? 'on' : ''}" aria-pressed="${f === now}" title="${f === 'long' ? SW[LANG].tLong : SW[LANG].tShort}">${names[f]}</button>`).join('');
      fw.onclick = (e) => { const b = e.target.closest('button'); if (!b || b.dataset.f === now) return; stopAudio(); const u = new URL(location.href); if (b.dataset.f === 'short') u.searchParams.delete('form'); else u.searchParams.set('form', 'long'); location.replace(u); };
      $('meta').append(fw);
    }
    if (feedback) import('./meinung.js?v=6').then((m) => m.createMeinung(B, { scene: feedback, versions: (langs || [LANG]).flatMap((l) => (long ? [l, l + '-long'] : [l])) }));
    // scenes: a list, or a function that makes it from the loaded lines (scenes written as data, regie.js)
    S.scenes = typeof scenes === 'function' ? [] : scenes; S.onEnd = end;
    fitStage(); new ResizeObserver(fitStage).observe($('stage'));
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
    set.setCam(S.cam.x, S.Z0 * S.cam.k);
    if (TEST) setInterval(() => frame(performance.now()), 33); else requestAnimationFrame(frame);
    dots();
    for (const k of keys) makeActor(k);
    if (EMBED && !qs.has('hero')) {
      const tell = () => parent.postMessage({ type: 'werkstatt-height', h: $('app').getBoundingClientRect().height + 4 }, location.origin);
      new ResizeObserver(tell).observe($('app')); tell();
      const x = document.createElement('button'); x.textContent = '✕'; x.title = 'Schließen'; x.setAttribute('aria-label', 'Schließen');
      x.onclick = () => { stopAudio(); parent.postMessage({ type: 'werkstatt-close' }, location.origin); }; $('corner').appendChild(x);
    }
    // a scene on a chapter page: starting the film or the practice brings the whole frame into view
    if (EMBED && qs.has('hero')) {
      const focus = () => parent.postMessage({ type: 'werkstatt-focus' }, location.origin);
      document.addEventListener('click', (e) => { if (e.target.closest('#goWatch, #goTry, #try, #play')) focus(); }, true);
      // Browsers can scroll the parent when a new task focuses its first control, even with preventScroll.
      document.addEventListener('focusin', (e) => { if (e.target.closest('#panel')) focus(); });
    }
    $('sound').onclick = () => { S.muted = !S.muted; $('sound').innerHTML = soundIcon(); $('sound').setAttribute('aria-pressed', String(!S.muted)); $('sound').setAttribute('aria-label', S.muted ? 'Ton aus' : 'Ton an'); if (S.muted) stopAudio(); };
    // full screen: the browser's own where it is allowed; else (iPhone, or a frame without permission) "max": the page
    // fills the window and, in a lesson, asks the lesson page to make the frame cover the whole screen
    const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
    const setMax = (on) => { S.max = on; document.documentElement.classList.toggle('max', on); $('full').setAttribute('aria-pressed', String(on)); if (EMBED) parent.postMessage({ type: 'werkstatt-max', on }, location.origin); };
    $('full').onclick = async () => {
      if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (S.max) { setMax(false); return; }
      const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) { try { await req.call(el); } catch (e) { /* refused */ } }
      if (!isFull()) setMax(true);
    };
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.max) setMax(false); });
    $('play').onclick = () => { if (S.mode === 'idle') watch(Math.max(0, Math.min(S.scene, S.scenes.length - 1))); else setPaused(!S.paused); };
    $('prev').onclick = () => watch(Math.max(0, S.scene - 1));
    $('next').onclick = () => watch(Math.min(S.scenes.length - 1, S.scene + 1));
    $('try').onclick = () => ($('panel').classList.contains('pr') ? watch(0) : practise());
    if (LANG !== 'de') { document.documentElement.lang = LANG; $('goWatch').textContent = T('watch'); $('goTry').textContent = T('play'); $('try').textContent = T('play'); $('load').textContent = T('loading'); const inp = $('inp'); if (inp) inp.placeholder = T('write'); }
    return (async () => {
      let lines = null; try { lines = await loadLines(); } catch (e) { lines = null; }
      if (!lines) { $('load').textContent = EMBED ? T('signin') : T('none'); return false; }
      S.lines = lines; preloadAudio(Object.keys(lines.lines));
      if (typeof scenes === 'function') { S.scenes = scenes(lines); dots(); }
      if (lines.start) { const h = document.querySelector('#start h2'), p = document.querySelector('#start p'); if (h && lines.start.title) h.textContent = lines.start.title; if (p && lines.start.text) p.textContent = lines.start.text; }
      await A[keys[0]].ready;
      $('goWatch').disabled = false; $('goTry').disabled = false; $('load').textContent = '';
      const go = (fn) => { unlockAudio(); $('start').style.display = 'none'; fn(); };
      $('goWatch').onclick = () => go(() => watch(0)); $('goTry').onclick = () => go(() => practise());
      // capture mode for pictures (tools/shoot.cjs): ?shot=<scene>&at=<line id>&after=<seconds> plays that scene
      // silently and stops the picture that long after the line starts; window.__shot tells the tool it is ready
      if (qs.has('shot')) {
        S.muted = true; $('start').style.display = 'none'; document.documentElement.classList.add('shot'); const at = qs.get('at'), after = +qs.get('after') || 1;
        sayHooks.push((who, id) => { if (id === at) wait(after).then(() => { setPaused(true); window.__shot = true; }).catch(() => {}); });
        watch(+qs.get('shot') || 0);
      }
      return true;
    })();
  }

  const B = { S, A, set, CAST, $, need, place, walkTo, cast, turn, faceTo, sit, trig, face, setB, cam, closeUp, wide, say, caption, text, data,
    wait, until, tween, abortAll, Abort, live, watch, setPaused, stopAudio, bodyRect, occupied, occupiers, start, onFrame, seen, tag, resetHooks, sayHooks, progress, isClean, players: PLAYERS };
  if (qs.has('debug')) window.__stage = B;            // for checking the figures from the console
  return B;
}
