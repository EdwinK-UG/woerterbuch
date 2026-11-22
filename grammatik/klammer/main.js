/* "Die Klammer-Werkstatt" – A1 · Kapitel 5 (Modalverben: Formen und Satzklammer), the first chapter built on the
   shared stage (grammatik/buehne/, plan docs/grammar-animation-plan.md). In Meister Anton's workshop the sentence
   strip shows the clamp: the modal verb takes seat 2, the infinitive rides to the last wagon, and the jaws click.
   The vowel wheel turns können into kann; a sign teaches man; Lena's question puts the modal verb in seat 1.
   Then the learner builds sentences (the chapter's own exercise items, from the private lines file).
   Like every lesson scene this file holds no lesson text: lines, strips, signs, cards and practice items come from
   .local/scenes/k05/lines.json (?local) or, embedded, from the lesson page. */
import { createStage, $, rich, plain, LANG, LANGS, LONG, T } from '../buehne/stage.js?v=5';
import { actsToScenes } from '../buehne/regie.js?v=5';
import { createWerkstatt, SPOTS } from '../buehne/sets/werkstatt.js?v=5';
import { createStrip, wheel } from '../buehne/satzband.js?v=5';
import { createPractice } from '../buehne/practice.js?v=5';
import { createBlase } from '../buehne/blase.js?v=5';
import { createTafel } from '../buehne/tafel.js?v=5';
import { createLicht } from '../buehne/licht.js?v=5';
import { sfx, play, unlockSfx } from '../buehne/sfx.js?v=5';

const set = createWerkstatt($('bg'), $('fg'));
// four versions: k05 (German), k05-en (English with German examples), and their long versions k05-long, k05-en-long
const TAG = 'k05' + (LANG === 'de' ? '' : '-' + LANG) + (LONG ? '-long' : '');
const B = createStage({ set, priv: `../../.local/scenes/${TAG}/`, tag: TAG, keys: ['anton', 'liv', 'lena'], onCast, minW: 4.3 });
const { A, S, place, walkTo, turn, trig, face, cam, say, wait, need } = B;
const strip = createStrip($('strip'));
const PR = createPractice(B, strip, { miss });
const bubble = createBlase(B);
const tafel = createTafel(B, { bubble });               // the narrator's explanations, drawn in the picture
createLicht(B);                                         // a soft spotlight on whoever speaks
S.zoom = false;                                         // the camera stays steady: no zooming in and out on speakers

// Anton lives at his workbench unless a scene moves him
function onCast(show) { if (show.includes('anton')) place(A.anton, SPOTS.bench, { d: -0.5, left: true }); }
const atBench = () => place(A.anton, SPOTS.bench, { d: -0.5, left: true });

/* ---------- what the scenes show besides the people ---------- */
const st = (id) => (B.data('strips')[id] || []).map(([w, r, key]) => ({ w, r, id: key || w }));
const cardText = (id) => B.data('cards')[id] || '';
function card(id) { const el = document.createElement('div'); el.className = 'card'; el.innerHTML = rich(cardText(id)); $('cards').appendChild(el); play.pop(1.2); }
function merk(id) { $('merk').innerHTML = `<small>${rich(cardText('merkTitle'))}</small>${rich(cardText(id))}`; $('merk').classList.add('on'); play.pop(0.9); }
let wh = null;
async function turnWheel(key) { const w = B.data('wheels')[key]; if (!w) return; bubble.hide(); wh = wheel($('wheel'), w.slice(0, 4), { fromPost: w[4] }); await wait(0.7); await wh.turn(); await wait(0.5); }
function clearAll() {
  $('cards').replaceChildren(); $('merk').classList.remove('on'); $('wheel').classList.remove('on'); strip.clear(); bubble.hide();
  set.V.win = 0; set.V.sign = B.data('signs').rauchen || ''; set.V.signPic = 'rauchen'; set.V.signGlow = 0; set.V.sweep = null;
}
B.resetHooks.push(clearAll);
// an example sentence: its bubble (the picture of what it means, the modal verb's icon, the sentence strip) by the
// speaker, then the line. o: { kind: 'think', pic, icon, strip }
function line(id, o = {}, sayOpt) {
  const who = (B.S.lines.lines[id] || {}).who;
  const shown = bubble.show({ who, kind: o.kind, pic: o.pic, icon: o.icon, strip: o.strip ? st(o.strip) : undefined });
  return Promise.all([shown, say(id, sayOpt)]);
}
const calm = (...keys) => keys.forEach((k) => face(A[k], 'happy'));

/* ---------- the six scenes ---------- */
const SCENES = [
  { name: 'Die Klammer', async run() {
    B.cast('anton', 'liv'); await need('anton', 'liv');
    place(A.liv, -2.6, { left: false, show: false }); S.cam.x = 0.6; S.cam.k = 1.0; cam(1.6, 1.0, 3.5);
    await say('e01');
    trig(A.anton, 'wave'); face(A.anton, 'happy'); const walk = walkTo(A.liv, 0.8, { run: true }); await say('a01', { frame: false }); await walk;
    face(A.liv, 'happy'); await line('l01', { pic: 'suppe', strip: 's1' });
    await say('e02');
    face(A.liv, 'laugh'); await line('l02', { kind: 'think', pic: 'suppe', icon: 'will', strip: 's2' }); calm('liv');
    face(A.anton, 'laugh'); await say('a02'); calm('anton');
    await say('e03'); merk('merk'); await wait(2.2);
  } },
  { name: 'Das Vokalrad', async run() {
    B.cast('anton', 'liv'); await need('anton', 'liv', 'lena');
    place(A.liv, 0.8, { left: false }); await cam(1.6, 1.0, 1.0);
    await say('e04');
    trig(A.anton, 'pull'); await line('a03', { pic: 'reparieren', icon: 'kann', strip: 's3' });
    face(A.liv, 'sad'); await line('l03', { kind: 'think', pic: 'aufstehen', icon: 'muss', strip: 's4' }); calm('liv');
    await say('e05');
    // Lena comes in by the door
    place(A.lena, SPOTS.door + 0.5, { d: -0.25, left: false, show: false }); cam(-0.6, 1.0, 1.6); turn(A.liv, true);
    await walkTo(A.lena, -0.2); turn(A.lena, false); trig(A.lena, 'wave'); face(A.lena, 'happy'); await say('n01');
    face(A.liv, 'laugh'); await line('n02', { pic: 'zusammen', icon: 'kann', strip: 's5' }); calm('liv');
    cam(1.5, 1.0, 1.2); await say('e06');
  } },
  { name: 'Ohne Endung', async run() {
    B.cast('anton', 'liv', 'lena'); await need('anton', 'liv', 'lena');
    place(A.lena, -0.2, { d: 0.05, left: false }); place(A.liv, 0.9, { left: false }); await cam(1.5, 1.0, 1.0);
    await say('e07');
    // Anton really saws while he says it
    trig(A.anton, 'pull'); const saw = (async () => { for (let i = 0; i < 2; i++) { await wait(1.6); trig(A.anton, 'pull'); } })();
    await line('a04', { pic: 'saegen', icon: 'kann', strip: 's6' }); await saw;
    trig(A.lena, 'point'); turn(A.liv, true); face(A.liv, 'laugh'); await line('n03', { pic: 'malen', icon: 'kann', strip: 's6b' }, { frame: ['lena', 'liv'] }); calm('liv');
    await say('e08');
  } },
  { name: 'man', async run() {
    B.cast('anton', 'liv'); await need('anton', 'liv');
    place(A.liv, -2.9, { left: true }); place(A.anton, -4.2, { left: true }); await cam(-4.0, 1.0, 1.2);
    trig(A.anton, 'point'); await line('a05', { pic: 'rauchen', icon: 'nicht', strip: 's7' }, { frame: false });
    await say('e09');
    set.V.signGlow = 1; B.tween(set.V, 'signGlow', 0, 1.4); set.V.sign = B.data('signs').aufräumen || ''; set.V.signPic = 'aufraeumen'; play.pop(0.8);
    trig(A.anton, 'point'); await line('a06', { pic: 'aufraeumen', icon: 'muss', strip: 's8' }, { frame: false });
    // and the broom starts sweeping, by itself
    set.V.sweep = -8; const sweep = B.tween(set.V, 'sweep', 7, 6, (k) => k); play.roll();
    face(A.liv, 'sad'); await say('l05', { frame: false }); calm('liv'); await sweep; set.V.sweep = 7;
  } },
  { name: 'Fragen', async run() {
    B.cast('anton', 'liv', 'lena'); await need('anton', 'liv', 'lena');
    place(A.anton, 0.3, { d: -0.1, left: true }); place(A.liv, -0.8, { left: false }); place(A.lena, -1.9, { d: 0.05, left: false });
    await cam(-1.5, 1.0, 1.2);
    await line('n04', { pic: 'fenster', icon: 'soll', strip: 's9' });
    face(A.anton, 'laugh'); await say('a07'); calm('anton');
    await walkTo(A.lena, SPOTS.window + 0.35); turn(A.lena, true); trig(A.lena, 'pull'); await wait(0.5); play.roll(); await B.tween(set.V, 'win', 1, 1.0); turn(A.lena, false);
    await say('e10');
    await line('l06', { kind: 'think', pic: 'essen', icon: 'kann', strip: 's10' });
    set.V.sign = B.data('signs').aufräumen || ''; set.V.signPic = 'aufraeumen';
    face(A.anton, 'laugh'); await say('a08'); calm('anton');
    await say('e11');
  } },
  { name: 'Merksatz', async run() {
    B.cast('anton', 'liv', 'lena'); await need('anton', 'liv', 'lena');
    set.V.win = 1; place(A.lena, -0.2, { d: 0.05, left: false }); place(A.liv, 0.9, { left: false }); await cam(1.5, 1.0, 1.0);
    bubble.show({ pic: 'suppe', icon: 'will', strip: st('s2') }); merk('merk');
    for (const k of ['anton', 'liv', 'lena']) face(A[k], 'laugh'); trig(A.anton, 'clap');
    await say('e12'); calm('anton', 'liv', 'lena');
  } },
];

/* ---------- the long versions: scenes written as data in their own script (regie.js) ---------- */
const VERBS = {
  line: (id, b, o) => line(id, b, o),
  bubble: (o) => bubble.show({ who: o.who, kind: o.kind, pic: o.pic, icon: o.icon, strip: o.strip ? st(o.strip) : undefined }),
  hideBubble: () => bubble.hide(),
  merk: (id) => { merk(id); return wait(0.2); },
  wheel: (key) => turnWheel(key),
  sign: ({ key, pic, glow }) => { if (glow) { set.V.signGlow = 1; B.tween(set.V, 'signGlow', 0, 1.4); } set.V.sign = B.data('signs')[key] || ''; set.V.signPic = pic; play.pop(0.8); },
  window: async () => { play.roll(); await B.tween(set.V, 'win', 1, 1.0); },
  sweep: async () => { set.V.sweep = -8; play.roll(); await B.tween(set.V, 'sweep', 7, 6, (k) => k); set.V.sweep = 7; },
  saw: async (n) => { for (let i = 0; i < (n || 2); i++) { trig(A.anton, 'pull'); await wait(1.6); } },
  bench: () => atBench(),
};

/* ---------- the practice ---------- */
function setPractice(on) {
  $('panel').classList.toggle('pr', on); $('ctl').classList.toggle('pr', on); $('try').textContent = on ? T('film') : T('play');
  if (!on) { PR.tell('', ''); $('answers').replaceChildren(); $('say').style.display = 'none'; $('panel').classList.remove('busy'); }
}
B.resetHooks.push((why) => { if (why === 'watch') setPractice(false); });
const pick = (ids) => ids[Math.floor(Math.random() * ids.length)];
async function miss(item, tries) {           // a miss: Anton frowns at the clamp, or Liv wonders
  const who = item.part === 'order' || item.part === 'sign' ? A.anton : A.liv;
  face(who, 'surprised');
  await say(who === A.anton ? (tries === 1 ? 'r04' : 'r05') : 'r08', { frame: false }); face(who, 'happy');
}
async function practise() {
  B.abortAll(); clearAll(); S.mode = 'practice'; B.setPaused(false); setPractice(true); PR.reset(); PR.busy(true); const gen = S.gen;
  try {
    if (['anton', 'liv', 'lena'].some((k) => !A[k].clean)) B.caption('elisa', T('wait'));
    await need('anton', 'liv', 'lena');
    B.cast('anton', 'liv', 'lena'); place(A.liv, 0.8, { left: false }); place(A.lena, -0.3, { d: 0.05, left: false }); await cam(1.5, 1.0, 1.0);
    let part = null; const parts = B.data('parts');
    for (const item of B.data('practice') || []) {
      B.live(gen); strip.clear(); PR.tell('', '');
      if (item.part !== part) {
        part = item.part;
        if (part === 'sign') { place(A.anton, -4.2, { left: true }); place(A.liv, -2.9, { left: true }); place(A.lena, -2.2, { d: 0.05, left: true }); set.V.sign = ''; await cam(-4.0, 1.05, 1.2); }
        else if (part === 'type') { atBench(); place(A.liv, 0.8, { left: false }); place(A.lena, -0.3, { d: 0.05, left: false }); await cam(1.5, 1.0, 1.0); }
        const intro = { order: 'p01', choice: 'p02', sign: 'p03' }[part];
        if (intro) { await say(intro, { frame: false }); }
      }
      const cue = item.cue || (item.ask ? B.text(item.ask) : '');
      PR.setLead(rich(parts[part] || '')); PR.prompt(cue ? `<b>${rich(cue)}</b>` : '');
      bubble.hide();
      if (item.ask) { bubble.show({ who: 'liv', kind: 'say', pic: item.askPic, icon: item.askIcon }); await say(item.ask, { frame: ['liv', 'lena'] }); B.wide(0.6); bubble.hide(); }
      const res = await Promise.race([PR.ask(item), B.until(() => false, gen)]);
      B.live(gen);
      if (res.right) {
        if (item.sign) { set.V.sign = item.sign; set.V.signPic = item.pic || null; set.V.signGlow = 1; B.tween(set.V, 'signGlow', 0, 1.6); }
        const who = part === 'type' ? [A.liv, A.lena] : part === 'choice' ? [A.liv] : [A.anton];
        for (const a of who) face(a, 'laugh');
        // the meaning of the sentence the learner made, in a bubble
        if (item.pic || item.icon) bubble.show({ who: who[0].key, kind: item.think ? 'think' : 'say', pic: item.pic, icon: item.icon, text: res.said ? res.said.replace(/^\([^)]*\)\s*/, '').replace(/[.!?]?$/, item.end || '.') : '' });
        await say(part === 'type' ? 'r07' : part === 'choice' ? 'r06' : pick(['r01', 'r02', 'r03']), { frame: false });
        for (const a of who) face(a, 'happy');
        await wait(item.pic ? 2.2 : 0.8); bubble.hide();
      } else await wait(2.6);
    }
    strip.clear(); PR.tell('', ''); PR.prompt('');
    bubble.hide(); trig(A.anton, 'clap'); for (const k of ['anton', 'liv', 'lena']) face(A[k], 'laugh'); await say('p06', { frame: false });
    B.caption('elisa', T('done', { s: PR.P.score, n: PR.P.asked })); S.mode = 'idle';
  } catch (e) { if (!(e instanceof B.Abort)) console.error(e); }
}

/* ---------- start ---------- */
$('sound').addEventListener('click', () => { sfx.muted = S.muted; });
B.start({ scenes: LONG ? (lines) => actsToScenes(B, lines.acts, VERBS, SPOTS) : SCENES, practise, langs: LANGS, long: true, feedback: 'k05', end: () => { B.caption('elisa', T('turn')); $('try').focus(); } }).then((ok) => {
  if (!ok) return;
  for (const id of ['goWatch', 'goTry']) $(id).addEventListener('click', unlockSfx, { capture: true });
  set.V.sign = B.data('signs').rauchen || ''; set.V.signPic = 'rauchen';
  place(A.anton, SPOTS.bench, { d: -0.5, left: true }); S.cam.x = 1.6;
});
window.__klammer = { B, S, A, set, strip, PR, bubble, practise, watch: B.watch, plain };
