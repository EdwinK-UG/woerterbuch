/* "Wer jagt wen?" – A1 · Kapitel 17 (Der Akkusativ), the second pilot on the shared stage (plan
   docs/grammar-animation-plan.md, Kap 17). On the village meadow (grammatik/dorf/village.js) Max meets a dog; coloured
   case rings at their feet show who is the subject (N, amber) and who the object (A, teal). Lights show that only the
   masculine article changes (der → den). Then the word order turns round – Den Ball jagt der Hund: the dog still
   chases – and the articles swap – Der Ball jagt den Hund: now the ball chases the dog across the meadow.
   Practice: Regie (the learner's sentence is acted out, exactly as it is grammatically), Max packs his backpack
   (den / das / die) and "Doch, ich habe …". All lesson text comes from the private .local/scenes/k17/lines.json. */
import { createStage, $, rich, LANG, LANGS, LONG, T } from '../buehne/stage.js?v=5';
import { actsToScenes } from '../buehne/regie.js?v=5';
import { createVillage } from '../dorf/village.js?v=5';
import { createStrip } from '../buehne/satzband.js?v=5';
import { createPractice } from '../buehne/practice.js?v=5';
import { createFx } from '../buehne/tiere.js?v=5';
import { createBlase } from '../buehne/blase.js?v=5';
import { createTafel } from '../buehne/tafel.js?v=5';
import { createLicht } from '../buehne/licht.js?v=5';
import { sfx, play, unlockSfx } from '../buehne/sfx.js?v=5';

const set = createVillage($('bg'), $('fg'));
// four versions: k17 (German), k17-en (English with German examples), and their long versions k17-long, k17-en-long
const TAG = 'k17' + (LANG === 'de' ? '' : '-' + LANG) + (LONG ? '-long' : '');
const B = createStage({ set, priv: `../../.local/scenes/${TAG}/`, tag: TAG, keys: ['max'], minW: 4.3 });
const { A, S, place, trig, face, cam, say, wait, need } = B;
const fx = createFx(B);
const strip = createStrip($('strip'), { cases: true });
const PR = createPractice(B, strip, { miss });
const bubble = createBlase(B, { cases: true });
const tafel = createTafel(B, { cases: true, bubble });   // the narrator's explanations, drawn in the picture
createLicht(B);                                         // a soft spotlight on whoever speaks
S.zoom = false;                                         // the camera stays steady: no zooming in and out on speakers
const dog = fx.animal('dog', 'dog'), cat = fx.animal('cat', 'cat'), ball = fx.animal('ball', 'ball');
const PETS = { dog, cat, ball };
const HOME = { max: -2.35, dog: -0.95, ball: -0.15, cat: -3.25, pack: -1.55 };
const BASE = -1.3;                                    // the meadow's wide shot
const PBASE = -1.7;                                   // in the practice: the cat, Max, the dog and the ball (a narrow picture beside the exercise)

/* ---------- helpers ---------- */
const st = (id) => (B.data('strips')[id] || []).map(([w, r, key]) => ({ w, r, id: key || w }));
// the sentence in a bubble: by its speaker (who), or docked at the top of the picture while the narrator talks
const showStrip = (id, who) => bubble.show({ who, strip: st(id), clamp: false });
const cardText = (id) => B.data('cards')[id] || '';
function card(id) { const el = document.createElement('div'); el.className = 'card'; el.innerHTML = rich(cardText(id)); $('cards').appendChild(el); play.pop(1.2); }
function merk(id) { $('merk').innerHTML = `<small>${rich(cardText('merkTitle'))}</small>${rich(cardText(id))}`; $('merk').classList.add('on'); play.pop(0.9); }
function lamps(on) {
  const L = B.data('lamps') || [];
  $('lamps').innerHTML = on ? L.map(([g, a]) => `<div class="lamp"><small>${g}</small><b>${a}</b></div>`).join('') : '';
  $('lamps').classList.toggle('on', !!on);
}
async function lamp(i) {                // the article turns to its accusative: it lights up when it changes
  const el = $('lamps').children[i], [, nom, akk] = (B.data('lamps') || [])[i] || []; if (!el) return;
  const b = el.querySelector('b');
  if (akk !== nom) { b.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(90deg)' }], { duration: 220 }); await wait(0.22); b.textContent = akk; el.classList.add('lit'); play.click(); b.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }], { duration: 220 }); }
  else { el.animate([{ transform: 'none' }, { transform: 'translateY(-4px)' }, { transform: 'none' }], { duration: 400 }); play.tick(); }
}
function clearAll() {
  $('cards').replaceChildren(); $('merk').classList.remove('on'); lamps(false); strip.clear(); bubble.hide(); fx.ringsOff(); fx.birds(false); fx.pack(null); fx.F.flyers = [];
  for (const a of Object.values(PETS)) { a.raise = 0; a.mood = 'idle'; }
}
B.resetHooks.push(clearAll);
// the Kurz | Lang switch appears once the long versions are recorded (their lines reach the page from the Worker)
const LONG_READY = true;
function home(...keys) {               // the animals in their places on the meadow
  for (const k of ['dog', 'cat', 'ball']) fx.place(PETS[k], HOME[k], { d: k === 'cat' ? -0.2 : 0.12, left: k === 'dog', show: keys.includes(k) });
}
let carrying = false;
B.onFrame.push(() => { if (carrying) { ball.x = dog.x + (dog.left ? -0.5 : 0.5); ball.d = dog.d + 0.01; ball.left = dog.left; } });

// a chase: the chased one runs off over the bridge, the chaser after it, and both come back across the meadow
async function chase(chaser, chased) {
  const from = chased.x, gap = chaser.kind === 'ball' || chased.kind === 'ball' ? 0.95 : 1.0;
  chased.mood = 'scared'; chaser.mood = 'happy'; if (chaser === dog || chased === dog) play.bark();
  const out = cam(0.9, 1.0, 1.0);
  const v = 2.5, a = fx.moveTo(chased, 3.1, { run: true, speed: v }); await wait(0.45); const b = fx.moveTo(chaser, 3.1 - gap, { run: true, speed: v });
  await Promise.all([a, b, out]);
  await wait(0.25); const c = fx.moveTo(chased, Math.min(from, -0.6) - 0.6, { run: true, speed: v }); await wait(0.35); const d = fx.moveTo(chaser, Math.min(from, -0.6) - 0.6 + gap, { run: true, speed: v });
  await Promise.all([c, d]); chased.mood = chaser.mood = 'idle';
  await cam(S.mode === 'practice' ? PBASE : BASE, 1.0, 0.9);
}
const backHome = () => Promise.all(['dog', 'ball', 'cat'].filter((k) => PETS[k].show).map((k) => fx.moveTo(PETS[k], HOME[k])));

/* ---------- the five scenes ---------- */
const SCENES = [
  { name: 'Wer sieht wen?', async run() {
    B.cast('max'); await need('max'); home(); place(A.max, HOME.max, { left: false }); S.cam.x = BASE - 0.6; cam(BASE, 1.0, 2.5);
    fx.place(dog, 3.4, { d: 0.12, left: true, show: true });
    const trot = fx.moveTo(dog, HOME.dog); await say('e01'); await trot;
    play.bark(); fx.hop(dog); face(A.max, 'surprised'); await wait(0.5); face(A.max, 'laugh'); trig(A.max, 'point');   // he points at the dog he sees
    showStrip('s1', 'max'); fx.ring(A.max, 'n'); fx.ring(dog, 'a'); await say('m01'); face(A.max, 'happy');
    showStrip('s2', 'max'); await say('e02');
  } },
  { name: 'Nur maskulin', async run() {
    B.cast('max'); await need('max'); home('dog'); place(A.max, HOME.max, { left: false }); await cam(BASE, 1.0, 0.8);
    lamps(true); await say('e03');
    trig(A.max, 'point'); fx.hop(dog); play.bark(); lamp(0); await say('m02', { frame: false });
    await cam(-6.3, 1.0, 1.2); set.bleat(); lamp(1); await say('m03', { frame: false });
    await cam(BASE, 1.0, 1.0); fx.place(cat, HOME.cat, { d: -0.2, left: false, show: true }); lamp(2); await say('m04', { frame: false });
    fx.birds(true, { x: BASE, y: 2.0 }); lamp(3); await say('m05', { frame: false });
    await wait(0.8); lamps(false); await say('e04');
  } },
  { name: 'Wer jagt wen?', async run() {
    B.cast('max'); await need('max'); home('dog', 'cat'); place(A.max, HOME.max, { left: false }); await cam(BASE, 1.0, 0.8);
    fx.place(ball, HOME.max + 0.4, { d: 0.12, show: true });
    trig(A.max, 'point'); face(A.max, 'laugh'); await say('m06');                      // he points: fetch!
    fx.moveTo(ball, HOME.ball, { speed: 2.4 }); await wait(0.6); face(A.max, 'happy');
    fx.ring(dog, 'n'); fx.ring(ball, 'a'); say('e05'); await chase(dog, ball);
    await say('e06'); await chase(dog, ball);
    fx.ring(ball, 'n'); fx.ring(dog, 'a'); await say('e07');
    const run = chase(ball, dog); await wait(1.2); face(A.max, 'laugh'); await say('m07', { frame: false }); await run; face(A.max, 'happy');
    await backHome(); await say('e08');
  } },
  { name: 'Wer? Wen? Was?', async run() {
    B.cast('max'); await need('max'); home('dog', 'ball', 'cat'); place(A.max, HOME.max, { left: false }); await cam(BASE, 1.0, 0.8);
    await say('e09');
    showStrip('s6', 'max'); fx.ring(dog, 'n'); fx.ring(A.max, 'a');
    const run = fx.moveTo(dog, HOME.max + 0.55, { run: true }); dog.mood = 'happy'; await run; dog.left = true; fx.hop(dog); play.bark();
    face(A.max, 'laugh'); await say('m08'); face(A.max, 'happy');
    fx.ringsOff(); bubble.hide(); await say('e10');
    // the dog fetches the ball and brings it in his mouth
    await fx.moveTo(dog, HOME.ball - 0.45, { run: true }); dog.left = false; ball.raise = 0.42; carrying = true; await wait(0.3);
    await fx.moveTo(dog, HOME.max + 0.6, { run: true }); dog.left = true; dog.mood = 'happy';
    showStrip('s7', 'max'); fx.ring(dog, 'n'); fx.ring(ball, 'a'); trig(A.max, 'point'); await say('m09');
    carrying = false; ball.raise = 0; ball.x = HOME.max + 0.25;
  } },
  { name: 'Merksatz', async run() {
    B.cast('max'); await need('max'); home('dog', 'ball', 'cat'); place(A.max, HOME.max, { left: false }); await cam(BASE, 1.0, 0.8);
    fx.ring(dog, 'n'); fx.ring(ball, 'a'); merk('merk');
    face(A.max, 'laugh'); fx.hop(dog); play.bark(); dog.mood = 'happy';
    await say('e11'); face(A.max, 'happy');
  } },
];
B.resetHooks.push(() => { carrying = false; });

/* ---------- the long versions: scenes written as data in their own script (regie.js) ---------- */
const who = (k) => (k === 'max' ? A.max : PETS[k]);
const VERBS = {
  line: (id, b, o) => { if (b.strip) showStrip(b.strip, b.at || (B.S.lines.lines[id] || {}).who); return say(id, o); },
  band: (v) => { const [id, at] = Array.isArray(v) ? v : [v]; showStrip(id, at); },
  hideBubble: () => bubble.hide(),
  home: (keys) => home(...keys),
  pet: (v) => { for (const [k, [x, o]] of Object.entries(v)) fx.place(PETS[k], x === 'home' ? HOME[k] : x, { d: k === 'cat' ? -0.2 : 0.12, show: true, ...(o || {}) }); },
  move: (v) => Promise.all(Object.entries(v).map(([k, x]) => fx.moveTo(PETS[k], x === 'home' ? HOME[k] : x === 'max' ? HOME.max + 0.55 : x))),
  dash: (v) => Promise.all(Object.entries(v).map(([k, x]) => fx.moveTo(PETS[k], x === 'home' ? HOME[k] : x === 'max' ? HOME.max + 0.55 : x, { run: true }))),
  ring: (v) => { for (const [k, c] of Object.entries(v)) fx.ring(who(k), c); },
  ringsOff: () => fx.ringsOff(),
  lamps: (on) => lamps(on),
  lamp: (i) => lamp(i),
  chase: ([a, b]) => chase(PETS[a], PETS[b]),
  hop: (k) => { fx.hop(PETS[k]); if (k === 'dog') play.bark(); },
  mood: (v) => { for (const [k, m] of Object.entries(v)) PETS[k].mood = m; },
  look: (v) => { for (const [k, left] of Object.entries(v)) PETS[k].left = left; },
  birds: (on) => fx.birds(on, { x: BASE, y: 2.0 }),
  bleat: () => set.bleat(),
  merk: (id) => { merk(id); return wait(0.2); },
  carry: async (on) => { if (on) { ball.raise = 0.42; carrying = true; } else { carrying = false; ball.raise = 0; ball.x = HOME.max + 0.25; } },
  backHome: () => backHome(),
  base: (sec) => cam(BASE, 1.0, sec || 0.8),
  max: () => place(A.max, HOME.max, { left: false }),
};

/* ---------- the practice ---------- */
function setPractice(on) {
  $('panel').classList.toggle('pr', on); $('ctl').classList.toggle('pr', on); $('try').textContent = on ? T('film') : T('play');
  if (!on) { PR.tell('', ''); $('answers').replaceChildren(); $('say').style.display = 'none'; $('panel').classList.remove('busy'); }
}
B.resetHooks.push((why) => { if (why === 'watch') setPractice(false); });
let flyer = null;
async function miss(item) {
  if (item.part === 'choice' && flyer) fx.sendThing(flyer, false);
  face(A.max, 'surprised'); await say('r04', { frame: false }); face(A.max, 'happy');
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const why = (k, vars = {}) => (B.data('why')[k] || '').replace(/\{(\w)\}/g, (_, v) => vars[v] || '');

// Regie: the learner's sentence, acted out by the animals exactly as its articles say
async function regie(item) {
  let tries = 0; const words = item.tiles.map((t) => t.w), names = B.data('names');
  while (true) {
    PR.busy(false); const order = (await strip.tiles(words, { slots: item.slots, end: '.' })).filter((i) => i != null); PR.busy(true); tries++;
    const ts = order.map((i) => item.tiles[i]), nouns = ts.filter((t) => t.who), shown = words.slice(); shown[order[0]] = cap(shown[order[0]]);
    // the cases: der/den decide; die Katze takes the other one
    let [c1, c2] = nouns.map((t) => t.c);
    if (c1 === '?' && c2 !== '?') c1 = c2 === 'n' ? 'a' : 'n'; else if (c2 === '?' && c1 !== '?') c2 = c1 === 'n' ? 'a' : 'n'; else if (c1 === '?' && c2 === '?') { c1 = 'n'; c2 = 'a'; }
    const caseOf = new Map(nouns.map((t, i) => [t, i ? c2 : c1]));
    strip.settle(shown, item.tiles.map((t) => (t.v ? 'v' : caseOf.get(t) || 'x')), order);
    let problem = null;
    if (ts[1] && !ts[1].v) problem = 'v_2';
    else if (nouns.length === 2 && nouns[0].who === nouns[1].who) problem = 'same';
    else if (c1 === 'n' && c2 === 'n') problem = 'two_n';
    else if (c1 === 'a' && c2 === 'a') problem = 'no_n';
    let right = false;
    if (problem) {
      play.wrong(); if (problem === 'v_2') strip.shake(order.findIndex((i) => item.tiles[i].v)); else strip.mark(0, 'bad');
      PR.tell('no', `<b>${T('notyet')}</b> ${rich(why(problem))}`); face(A.max, 'surprised'); await say('r04', { frame: false }); face(A.max, 'happy');
    } else {
      const subj = nouns[caseOf.get(nouns[0]) === 'n' ? 0 : 1], obj = nouns.find((t) => t !== subj);
      fx.ring(PETS[subj.who], 'n'); fx.ring(PETS[obj.who], 'a');
      // the learner's sentence goes up into the picture while the animals act it out
      bubble.show({ strip: order.map((i) => ({ w: shown[i], r: item.tiles[i].v ? 'v' : caseOf.get(item.tiles[i]), id: 't' + i })), clamp: false });
      await chase(PETS[subj.who], PETS[obj.who]); await backHome(); bubble.hide();
      const meant = subj.who === item.want[0] && obj.who === item.want[1], firstOk = item.first == null || order[0] === item.first;
      right = meant && firstOk;
      if (right) { play.right(); PR.tell('ok', `<b>${T('right')}</b> ${rich(order.map((i) => shown[i]).join(' '))}.`); PR.count(tries === 1); }
      else if (meant) { play.wrong(); PR.tell('no', `<b>${T('almost')}</b> ${rich(why('first'))}`); }
      else { play.wrong(); PR.tell('no', `<b>${T('oops')}</b> ${rich(why('folge', { n: cap(names[subj.who].n), a: names[obj.who].a }))}`); face(A.max, 'laugh'); await say('r03', { frame: false }); face(A.max, 'happy'); }
      fx.ringsOff();
    }
    if (right) return { right: true, tries };
    if (tries >= 3) { PR.tell('no', `${T('rightis')} <b>${rich(item.ok[0])}.</b>`); PR.count(false); return { right: false, tries }; }
    await wait(1.4);
  }
}

async function practise() {
  B.abortAll(); clearAll(); S.mode = 'practice'; B.setPaused(false); setPractice(true); PR.reset(); PR.busy(true); const gen = S.gen;
  try {
    await need('max');
    B.cast('max'); place(A.max, HOME.max, { left: false }); home('dog', 'ball', 'cat'); await cam(PBASE, 1.0, 0.8);
    let part = null; const parts = B.data('parts');
    for (const item of B.data('practice') || []) {
      B.live(gen); strip.clear(); PR.tell('', ''); flyer = null;
      if (item.part !== part) {
        part = item.part;
        if (part === 'regie') { await say('p01'); }
        if (part === 'choice') { ball.show = false; fx.pack(HOME.pack, 0.35); trig(A.max, 'point'); await say('p02'); }
        if (part === 'type') { fx.pack(null); }
        B.wide(0.6);
      }
      const cue = item.cue || (item.ask ? B.text(item.ask) : '');
      PR.setLead(rich(parts[part] || '')); PR.prompt(cue ? `<b>${rich(cue)}</b>` : '');
      if (item.ask) { await say(item.ask); B.wide(0.6); }
      if (item.thing) flyer = fx.thing(item.thing, { x: HOME.pack, d: 0.35 });
      const res = item.kind === 'regie' ? await regie(item) : await Promise.race([PR.ask(item), B.until(() => false, gen)]);
      B.live(gen);
      if (res.right) {
        if (flyer) await fx.sendThing(flyer, true);
        face(A.max, 'laugh'); fx.hop(dog);
        await say(item.part === 'regie' ? 'r02' : 'r01', { frame: false }); face(A.max, 'happy'); await wait(0.6);
      } else { if (flyer) await fx.sendThing(flyer, true); await wait(2.4); }
    }
    strip.clear(); PR.tell('', ''); PR.prompt(''); fx.pack(null);
    face(A.max, 'laugh'); fx.hop(dog); play.bark(); await say('p06');
    B.caption('elisa', T('done', { s: PR.P.score, n: PR.P.asked })); S.mode = 'idle';
  } catch (e) { if (!(e instanceof B.Abort)) console.error(e); }
}

/* ---------- start ---------- */
$('sound').addEventListener('click', () => { sfx.muted = S.muted; });
B.start({ scenes: LONG ? (lines) => actsToScenes(B, lines.acts, VERBS) : SCENES, practise, langs: LANGS, long: LONG_READY, feedback: 'k17', end: () => { B.caption('elisa', T('turn')); $('try').focus(); } }).then((ok) => {
  if (!ok) return;
  for (const id of ['goWatch', 'goTry']) $(id).addEventListener('click', unlockSfx, { capture: true });
  place(A.max, HOME.max, { left: false }); home('dog'); S.cam.x = BASE;
});
window.__jagd = { B, S, A, set, strip, PR, fx, PETS, bubble, practise, watch: B.watch, chase };
