/* Szene: one player for every scene written in format v1 (docs/scene-format.md). A chapter's page only says which
   scene it is; the set, the cast, the animals, the film (acts of beats), the practice and how the figures react to it
   all come from the scene's private file. The iOS and Android apps play the same files with their own player of the
   same vocabulary, so a new lesson needs no new code anywhere.

     playScene({ base: 'k05', set: 'werkstatt', cast: ['anton', 'liv', 'lena'], feedback: 'k05', hook: '__klammer' })

   `set` and `cast` repeat the file's own `set` and `cast` so the web page can start loading the set and the figures
   before the private file arrives (tests/scene-format.test.cjs checks that they match). `langs`: the versions the scene
   has (default all four; the B2–C1 films have 'de' and 'en'), for the language switch and the feedback form. */
import { createStage, $, rich, LANG, LANGS, T } from './stage.js?v=7';
import { createDirector } from './regie.js?v=7';
import { createStrip, wheel as makeWheel } from './satzband.js?v=7';
import { createPractice } from './practice.js?v=7';
import { createBlase } from './blase.js?v=7';
import { createTafel } from './tafel.js?v=7';
import { createLicht } from './licht.js?v=7';
import { createFx } from './tiere.js?v=7';
import { sfx, play, unlockSfx } from './sfx.js?v=7';
import { createWerkstatt } from './sets/werkstatt.js?v=7';
import { createVillage } from '../dorf/village.js?v=7';
import { createSee } from './sets/see.js?v=7';
import { createWohnung } from './sets/wohnung.js?v=7';
import { createRedaktion } from './sets/redaktion.js?v=7';
import { bakeable, M as manifest } from './baked.js?v=7';
import { createRequisiten } from './requisiten.js?v=7';

const SETS = { werkstatt: createWerkstatt, dorf: createVillage, see: createSee, wohnung: createWohnung, redaktion: createRedaktion };

/* A film may play in more than one place (since k439: an act's `set`). The stage holds one set object; this one stands
   in for whichever set is in use, so every module that reads B.set.V or calls B.set.foot follows the switch. All the
   sets draw on the same two canvases. */
function multiSet(make, first) {
  let cur = make(first), dims = null; const all = new Set([cur]);
  return {
    get V() { return cur.V; },
    size(W, H, dpr) { dims = [W, H, dpr]; for (const s of all) s.size(W, H, dpr); },
    setCam(x, z, ty) { cur.setCam(x, z, ty); },
    draw(t, dt) { return cur.draw(t, dt); },
    foot(x, d) { return cur.foot(x, d); },
    toWorld(sx) { return cur.toWorld(sx); },
    use(name) {
      const s = make(name); if (!all.has(s)) { all.add(s); if (dims) s.size(...dims); }
      if (s !== cur) { const c = cur.V.cam, ty = (cur.V.gy - cur.V.H * 0.8) / (c.z || 1); s.setCam(c.x, c.z, ty); s.V.cacheKey = ''; cur = s; }
      return s;
    },
  };
}

function ensure(id, tag, before) {          // the layers every scene may need, in their stacking order
  let el = $(id); if (el) return el;
  el = document.createElement(tag); el.id = id; if (tag === 'div') el.setAttribute('aria-live', 'polite');
  const st = $('stage'); if (before && $(before)) st.insertBefore(el, $(before)); else st.insertBefore(el, $('corner'));
  return el;
}

export function playScene({ base, set: setName, sets: more = [], cast, cases = false, feedback, langs = LANGS, hook }) {
  ensure('fxb', 'canvas', 'people'); ensure('fx', 'canvas', 'fg');
  for (const id of ['cards', 'wheel', 'lamps', 'merk']) ensure(id, 'div');
  // the set: its baked images (assets/scene/sets/, as the apps draw them), its own Canvas drawing until they load;
  // `sets`: the other places some acts play in (made now, so their images load while the start box shows)
  const made = {}, make = (n) => made[n] || (made[n] = bakeable(SETS[n]($('bg'), $('fg')), n, $('bg'), $('fg')));
  const set = multiSet(make, setName); for (const n of more) make(n);
  const TAG = base + (LANG === 'de' ? '' : '-' + LANG) + '-long';
  const B = createStage({ set, priv: `../../.local/scenes/${TAG}/`, tag: TAG, keys: cast, minW: 4.3 });
  const { A, S, place, trig, face, say, wait, need } = B;
  S.zoom = false;                                          // the camera stays steady: no zooming in and out on speakers
  const fx = createFx(B);
  const strip = createStrip($('strip'), { cases });
  const PR = createPractice(B, strip, { miss });
  const bubble = createBlase(B, { cases });
  const tafel = createTafel(B, { cases, bubble });          // the narrator's explanations, drawn in the picture
  createLicht(B);                                            // a soft spotlight on whoever speaks
  const props = createRequisiten(B);                        // props, the tape, dimming, ghosts (steps prop, move, morph, tape, dim, ghost)
  const ani = {};

  /* ---------- overlays ---------- */
  const cardText = (id) => B.data('cards')[id] || '';
  const overlays = {
    card(id) { if (!id) { $('merk').classList.remove('on'); return; } $('merk').innerHTML = `<small>${rich(cardText('merkTitle'))}</small>${rich(cardText(id))}`; $('merk').classList.add('on'); },
    async wheel(key) { const w = B.data('wheels')[key]; if (!w) return; bubble.hide(); const wh = makeWheel($('wheel'), w.slice(0, 4), { fromPost: w[4] }); await wait(0.7); await wh.turn(); await wait(0.5); },
    lamps(on) {
      const L = B.data('lamps') || [];
      $('lamps').innerHTML = on ? L.map(([g, a]) => `<div class="lamp"><small>${g}</small><b>${a}</b></div>`).join('') : '';
      $('lamps').classList.toggle('on', !!on);
    },
    async lamp(i) {                                          // the article turns to its new form: it lights up when it changes
      const el = $('lamps').children[i], [, from, to] = (B.data('lamps') || [])[i] || []; if (!el) return;
      const b = el.querySelector('b');
      if (to !== from) { b.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(90deg)' }], { duration: 220 }); await wait(0.22); b.textContent = to; el.classList.add('lit'); play.click(); b.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }], { duration: 220 }); }
      else { el.animate([{ transform: 'none' }, { transform: 'translateY(-4px)' }, { transform: 'none' }], { duration: 400 }); play.tick(); }
    },
  };

  /* ---------- animals: carrying, and the chase ---------- */
  let held = null;                                           // { by, thing }
  B.onFrame.push(() => { if (held) { const a = ani[held.by], t = ani[held.thing]; if (a && t) { t.x = a.x + (a.left ? -0.5 : 0.5); t.d = a.d + 0.01; t.left = a.left; } } });
  function hold(by, thing) {
    if (thing) { held = { by, thing }; ani[thing].raise = 0.42; }
    else if (held && held.by === by) { ani[held.thing].raise = 0; held = null; }
  }
  async function chase({ by, after, to = 3.1, camOut = 0.9, camBack }) {
    const chaser = ani[by] || A[by], chased = ani[after] || A[after]; if (!chaser || !chased) return;
    const from = chased.x, gap = chaser.kind === 'ball' || chased.kind === 'ball' ? 0.95 : 1.0, v = 2.5;
    chased.mood = 'scared'; chaser.mood = 'happy'; if (by === 'dog' || after === 'dog') play.bark();
    const out = B.cam(camOut, 1.0, 1.0);
    const a = fx.moveTo(chased, to, { run: true, speed: v }); await wait(0.45); const b = fx.moveTo(chaser, to - gap, { run: true, speed: v });
    await Promise.all([a, b, out]);
    const back = Math.min(from, -0.6) - 0.6;
    await wait(0.25); const c = fx.moveTo(chased, back, { run: true, speed: v }); await wait(0.35); const d = fx.moveTo(chaser, back + gap, { run: true, speed: v });
    await Promise.all([c, d]); chased.mood = chaser.mood = 'idle';
    if (camBack != null) await B.cam(camBack, 1.0, 0.9);
  }

  // an act in another place (act.set): that set, its parts as its manifest starts them; back home: the file's setStart
  function useSet(name) {
    const other = name && name !== setName, s = set.use(other ? name : setName);
    const s0 = other ? ((manifest('sets/' + name) || {}).state || {}) : (S.lines && S.lines.setStart) || {};
    for (const [k, v] of Object.entries(s0)) s.V[k] = k === 'sign' ? (v ? (B.data('signs')[v] ?? v) : v) : v;
  }
  const D = createDirector({ B, set, fx, bubble, ani, overlays, hold, chase, props, useSet });

  /* ---------- every scene starts clean: overlays closed, the set as the file starts it ---------- */
  function clearAll() {
    $('cards').replaceChildren(); overlays.card(false); overlays.lamps(false); $('wheel').classList.remove('on'); strip.clear(); bubble.hide(); tafel.hide();
    fx.ringsOff(); fx.birds(false); fx.pack(null); fx.F.flyers = []; held = null; props.clear();
    for (const a of Object.values(ani)) { a.raise = 0; a.mood = 'idle'; }
    useSet(null);
  }
  B.resetHooks.push(clearAll);

  /* ---------- the practice: items from the file, staged and answered as its `practiceStage` says ---------- */
  function setPractice(on) {
    $('panel').classList.toggle('pr', on); $('ctl').classList.toggle('pr', on); $('try').textContent = on ? T('film') : T('play');
    if (!on) { $('panel').classList.remove('finished'); PR.tell('', ''); $('answers').replaceChildren(); $('say').style.display = 'none'; $('panel').classList.remove('busy'); }
  }
  B.resetHooks.push((why) => { if (why === 'watch') setPractice(false); });
  const stage = () => B.data('practiceStage') || {};
  const pick = (ids) => ids[Math.floor(Math.random() * ids.length)];
  let flyer = null;
  // a wrong answer: the item's own staging for that answer (stage.miss[<option index>] or ['*']), then its own
  // reaction line (react), or else the part's
  async function miss(item, tries, info = {}) {
    if (flyer) fx.sendThing(flyer, false);
    const sm = item.stage && item.stage.miss, steps = sm && (sm[String(info.pick)] || sm['*']);
    if (steps) await D.now(steps);
    if (item.react) {             // one line id, or several said in turn (a character's short German line, then the narrator)
      for (const id of [].concat(item.react)) {
        const w = ((B.S.lines.lines[id] || {}).who || '').split('+')[0], a = A[w];
        if (a) face(a, 'surprised'); await say(id, { frame: false }); if (a) face(a, 'happy');
      }
      return;
    }
    const M = (stage().miss || {})[item.part] || (stage().miss || {})['*']; if (!M) return;
    const a = A[M.who]; face(a, 'surprised');
    await say(M.say[Math.min(tries - 1, M.say.length - 1)], { frame: false }); face(a, 'happy');
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // the learner's sentence in the bubble: without a hint in brackets, only the quoted sentence when the task quotes one
  // ("Lenas Fahrrad: „Die Bremsen werden gerade geprüft.“"; of several quotes the one with the gap), and with its end mark.
  // Since k482: when a choice's gap stands outside its quotes ("Meldung: „…“ ___": a sentence to turn into a noun phrase), the chosen words
  // alone, with the item's end mark if it has one ('' for a noun phrase)
  const quotes = (s) => [...String(s).matchAll(/„([^“]*)“/g)].map((m) => m[1]);
  const shownSentence = (said, end, item = {}, pick = null) => {
    const qs = item.kind === 'choice' && item.q ? quotes(item.q) : [];
    if (qs.length && pick != null) {
      const i = qs.findIndex((x) => x.includes('___')), s = (i < 0 ? String(pick) : quotes(said)[i] || said).trim();
      return /[.!?]$/.test(s) ? s : s + (i < 0 ? end ?? '' : end ?? '.');
    }
    const q = /„([^“]*)“/.exec(said), s = (q ? q[1] : said.replace(/^\([^)]*\)\s*/, '')).trim(); return /[.!?]$/.test(s) ? s : s + (end ?? '.');
  };
  const why = (k, vars = {}) => (B.data('why')[k] || '').replace(/\{(\w)\}/g, (_, v) => vars[v] || '');

  // kind 'regie' (act it out): the learner's sentence, acted out by the animals exactly as its articles say
  async function actOut(item) {
    const cfg = stage().act || {};
    let tries = 0; const words = item.tiles.map((t) => t.w), names = B.data('names');
    while (true) {
      PR.busy(false); const order = (await strip.tiles(words, { slots: item.slots, end: '.' })).filter((i) => i != null); PR.busy(true); tries++;
      const ts = order.map((i) => item.tiles[i]), nouns = ts.filter((t) => t.who), shown = words.slice(); shown[order[0]] = cap(shown[order[0]]);
      let [c1, c2] = nouns.map((t) => t.c);                 // the cases: der/den decide; die Katze takes the other one
      if (c1 === '?' && c2 !== '?') c1 = c2 === 'n' ? 'a' : 'n'; else if (c2 === '?' && c1 !== '?') c2 = c1 === 'n' ? 'a' : 'n'; else if (c1 === '?' && c2 === '?') { c1 = 'n'; c2 = 'a'; }
      const caseOf = new Map(nouns.map((t, i) => [t, i ? c2 : c1]));
      strip.settle(shown, item.tiles.map((t) => (t.v ? 'v' : caseOf.get(t) || 'x')), order);
      let problem = null;
      if (ts[1] && !ts[1].v) problem = 'v_2';
      else if (nouns.length === 2 && nouns[0].who === nouns[1].who) problem = 'same';
      else if (c1 === 'n' && c2 === 'n') problem = 'two_n';
      else if (c1 === 'a' && c2 === 'a') problem = 'no_n';
      let right = false; const host = A[(stage().cast || [])[0]];
      if (problem) {
        play.wrong(); if (problem === 'v_2') strip.shake(order.findIndex((i) => item.tiles[i].v)); else strip.mark(0, 'bad');
        PR.tell('no', `<b>${T('notyet')}</b> ${rich(why(problem))}`); face(host, 'surprised'); await say(cfg.wrong, { frame: false }); face(host, 'happy');
      } else {
        const subj = nouns[caseOf.get(nouns[0]) === 'n' ? 0 : 1], obj = nouns.find((t) => t !== subj);
        fx.ring(ani[subj.who], 'n'); fx.ring(ani[obj.who], 'a');
        bubble.show({ strip: order.map((i) => ({ w: shown[i], r: item.tiles[i].v ? 'v' : caseOf.get(item.tiles[i]), id: 't' + i })), clamp: false });
        await chase({ by: subj.who, after: obj.who, camBack: cfg.camBack });
        await Promise.all(Object.keys(ani).filter((k) => ani[k].show && cfg.home && cfg.home[k] != null).map((k) => fx.moveTo(ani[k], cfg.home[k]))); bubble.hide();
        const meant = subj.who === item.want[0] && obj.who === item.want[1], firstOk = item.first == null || order[0] === item.first;
        right = meant && firstOk;
        if (right) { play.right(); PR.tell('ok', `<b>${T('right')}</b> ${rich(order.map((i) => shown[i]).join(' '))}.`); PR.count(tries === 1); }
        else if (meant) { play.wrong(); PR.tell('no', `<b>${T('almost')}</b> ${rich(why('first'))}`); }
        else { play.wrong(); PR.tell('no', `<b>${T('oops')}</b> ${rich(why('folge', { n: cap(names[subj.who].n), a: names[obj.who].a }))}`); face(host, 'laugh'); await say(cfg.oops, { frame: false }); face(host, 'happy'); }
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
      const P = stage(), ppl = (P.cast || []).filter((k) => A[k]);
      if (ppl.some((k) => !A[k].clean)) B.caption('elisa', T('wait'));
      await need(...ppl); B.live(gen);
      B.cast(...ppl); await D.now(P.start);
      let part = null; const parts = B.data('parts'), items = B.data('practice') || [];
      for (const item of items) {
        B.live(gen); PR.prepare(item, items.length); strip.clear(); PR.tell('', ''); flyer = null;
        const ps = (P.parts || {})[item.part] || {};
        if (item.part !== part) {
          part = item.part;
          await D.now(ps.start);
          if (ps.intro) await say(ps.intro, { frame: false });
          B.wide(0.6);
        }
        const cue = item.cue || (item.ask ? B.text(item.ask) : '');
        PR.setLead(rich(parts[part] || '')); PR.prompt(cue ? `<b>${rich(cue)}</b>` : '');
        bubble.hide();
        if (item.ask) {
          const ask = P.ask || {};
          if (item.askPic || item.askIcon) bubble.show({ who: ask.who, kind: 'say', pic: item.askPic, icon: item.askIcon });
          await say(item.ask, ask.frame ? { frame: ask.frame } : {}); B.wide(0.6); bubble.hide();
        }
        if (item.thing && ps.thingAt) flyer = fx.thing(item.thing, ps.thingAt);
        if (item.stage && item.stage.start) await D.now(item.stage.start);
        const res = item.kind === 'regie' ? await actOut(item) : await Promise.race([PR.ask(item), B.until(() => false, gen)]);
        B.live(gen);
        if (res.right) {
          if (flyer) await fx.sendThing(flyer, true);
          if (item.stage && item.stage.right) await D.now(item.stage.right);
          if (item.sign) { set.V.sign = item.sign; set.V.signPic = item.pic || null; set.V.signGlow = 1; B.tween(set.V, 'signGlow', 0, 1.6); }
          const R = (P.right || {})[part] || (P.right || {})['*'] || { laugh: [], say: [] };
          for (const k of R.laugh || []) face(A[k], 'laugh');
          if (R.hop && ani[R.hop]) fx.hop(ani[R.hop]);
          if (R.bubble && (item.pic || item.icon)) bubble.show({ who: (R.laugh || [])[0], kind: R.bubble === 'wish' ? 'wish' : item.think ? 'think' : 'say', pic: item.pic, icon: item.icon, text: res.said ? shownSentence(res.said, item.end, item, res.pick) : '' });
          if ((R.say || []).length) await say(pick(R.say), { frame: false });
          for (const k of R.laugh || []) face(A[k], 'happy');
          await wait(item.pic || item.icon ? (R.hold ?? 0.8) : Math.min(R.hold ?? 0.8, 0.8)); bubble.hide();
        } else { if (flyer) await fx.sendThing(flyer, true); await wait(P.afterMiss ?? 2.5); }
      }
      strip.clear(); PR.tell('', ''); PR.prompt(''); bubble.hide();
      await D.now(P.end || []);
      B.caption('elisa', T('done', { s: PR.P.score, n: PR.P.asked })); S.mode = 'idle'; PR.finish();
    } catch (e) { if (!(e instanceof B.Abort)) console.error(e); }
  }

  /* ---------- start ---------- */
  $('sound').addEventListener('click', () => { sfx.muted = S.muted; });
  const scenes = (lines) => {
    for (const [key, kind] of Object.entries(lines.animals || {})) ani[key] = ani[key] || fx.animal(key, kind);
    return D.actsToScenes(lines.acts);
  };
  const ready = B.start({ scenes, practise, langs, feedback, end: () => { B.caption('elisa', T('turn')); $('try').focus(); } }).then(async (ok) => {
    if (!ok) return false;
    for (const id of ['goWatch', 'goTry']) $(id).addEventListener('click', unlockSfx, { capture: true });
    clearAll(); await D.now(S.lines.filmStart || []); if (S.lines.camStart != null) S.cam.x = S.lines.camStart;
    return true;
  });
  const api = { B, S, A, set, strip, PR, fx, ani, bubble, tafel, D, practise, watch: B.watch, ready };
  if (hook) window[hook] = api;
  window.__szene = api;
  return api;
}
