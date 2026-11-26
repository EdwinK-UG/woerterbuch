/* Regie: the player of scene format v1 (docs/scene-format.md). A scene file carries `acts`; each act is a scene of
   the film: { name, cast: ['anton', 'liv'], need?: [… also those who come in later], beats: [[step, step …], …] }.
   A beat is an ORDERED LIST of steps (JSON readers on phones do not keep the order of an object's keys); a step is an
   object with one key from the closed vocabulary below. Steps run in their order; what moves (walks, the camera, set
   tweens, a chase, timed cues, a bubble opening) runs on while the beat goes on, and the beat ends when its line and
   everything it started are done. `say`, `line` and `wait` wait.

   Vocabulary (who = a person of the cast or an animal of the scene):
     say: 'e01' | { id, frame }                 a line; the narrator's board opens by itself (tafel.js)
     line: { id, pic, icon, strip, kind, who, clamp, frame }   an example sentence with its bubble (blase.js)
     bubble: { who, kind, pic, icon, strip, clamp } | false     a bubble without a line, or close it
     place: { who: { x, d, left, show } }       put someone somewhere at once (an omitted field keeps its value)
     walk: { who: x }   run: { who: x }         walk or run there (people and animals)
     turn: { who: left }   face: { who: 'laugh' }   calm: [who]   trig: { who: 'wave' }   (people: Rive gestures)
     cam: [x, k, seconds]                       move the camera (k stays 1: no zooming)
     wait: seconds
     set: { part: value | { from, to, dur, ease } }   the set's named parts (werkstatt: win, sign, signPic, signGlow,
                                                sweep; dorf: lambHop); `sign` names a text in the file's `signs`
     sfx: 'pop' | 'roll' | 'bark' | 'click' | 'tick' | …   a small sound (sfx.js)
     card: 'merk' | false                       the Merksatz card (`cards.merkTitle` + `cards[id]`)
     wheel: 'können'                            the big vowel wheel (`wheels[key]`)
     lamps: true | false   lamp: i              the row of article lamps (`lamps`); lamp i turns to its new form
     ring: { who: 'n' | 'a' | 'd' | 'g' }   ringsOff: true     case rings at someone's feet
     hop: who   mood: { who: 'happy' | 'scared' | 'idle' }    animals
     hold: { holder: thing | null }             an animal carries a thing (the dog the ball) or lets it go
     birds: { on, x, y }   pack: { x, d } | null     the flock of birds; the backpack of the practice
     chase: { by, after, to, camOut, camBack } the chaser runs after the chased one over the bridge and back
     cues: [[seconds | word, step], …]          steps at set times, or when the next line says a word, while the beat goes on
     prop: { id: { thing | word, x, y, d, rot, s, alpha, glow, bob, tone, flip, look, on, show } | null }   a prop (requisiten.js)
     move: { id: { x, y, d, rot, s, alpha, glow, dur, ease, arc } }   a prop moves by itself
     morph: { id: { to, fx, stamp } }           a word prop turns into another word (shave, stamp, flip, grow)
     tape: { from, to, d, marks, dur } | { lit } | false   a measuring tape on the floor (a timeline)
     dim: amount | { to, dur }                  the picture darkens (a power cut)
     ghost: { who: amount | { to, dur } }       a person fades to a glowing outline (1) or fills in again (0)
     pop: [id, …]                               props burst into glitter and are gone (a wish meets reality)
     ride: { who: id | null }                   a person moves with a prop (sits in a boat that moves)
     rain: amount | { to, dur, back }           rain over the picture (back: it rises, time runs backwards)
     tint: { tone: 'sepia' | 'wish' | null, to, dur }   the whole picture takes a tone (the past; a "what if")
     sit: { who: true | false }                 a person sits down or stands up
     bubble: 'pop'                              the bubble bursts (a wish meets reality)
     sure: [id, …]                              (since k439) a guess (a prop in the tone 'guess') turns into a fact
   An act may name its own `set` (since k439: a film in two places); it then starts with that set's parts as its baked
   manifest starts them. An unknown step is an error (tests/scene-format.test.cjs checks every scene file). */
import { rich, plain } from './stage.js';
import { play } from './sfx.js';

export const STEPS = ['say', 'line', 'bubble', 'place', 'walk', 'run', 'turn', 'face', 'calm', 'trig', 'cam', 'wait', 'set', 'sfx',
  'card', 'wheel', 'lamps', 'lamp', 'ring', 'ringsOff', 'hop', 'mood', 'hold', 'birds', 'pack', 'chase', 'cues',
  'prop', 'move', 'morph', 'tape', 'dim', 'ghost', 'pop', 'ride', 'rain', 'tint', 'sit', 'sure'];

// ctx: { B, set, fx, bubble, ani: { key: animal }, overlays: { card, wheel, lamps, lamp }, chase, props (requisiten.js) }
export function createDirector(ctx) {
  const { B } = ctx;
  const who = (k) => B.A[k] || ctx.ani[k];
  const isAnimal = (k) => !B.A[k] && !!ctx.ani[k];
  const st = (id) => (B.data('strips')[id] || []).map(([w, r, key]) => ({ w, r, id: key || w }));
  const bubbleOf = (o) => ({ who: o.who, kind: o.kind, pic: o.pic, icon: o.icon, strip: o.strip ? st(o.strip) : undefined, clamp: o.clamp });
  const sayArgs = (v) => (typeof v === 'string' ? [v, {}] : [v.id, 'frame' in v ? { frame: v.frame } : {}]);

  // one step: returns a promise to wait for (say, line, wait) or pushes what runs on into `running`
  async function step(s, running) {
    const [k, v] = Object.entries(s)[0];
    switch (k) {
      case 'say': { const [id, o] = sayArgs(v); return B.say(id, o); }
      case 'line': {
        const [id, o] = sayArgs(v), w = v.who || (B.S.lines.lines[id] || {}).who;
        return Promise.all([ctx.bubble.show(bubbleOf({ ...v, who: w })), B.say(id, o)]);
      }
      case 'bubble': if (v === false) ctx.bubble.hide(); else if (v === 'pop') running.push(ctx.bubble.pop()); else running.push(ctx.bubble.show(bubbleOf(v))); return;
      case 'place':
        for (const [w, p] of Object.entries(v)) {
          const a = who(w); if (!a) continue;
          if (isAnimal(w)) ctx.fx.place(a, p.x ?? a.x, { d: p.d ?? a.d, left: p.left ?? a.left, show: p.show ?? true });
          else B.place(a, p.x ?? a.x, { d: p.d ?? a.d, left: p.left ?? a.left, show: p.show ?? true });
        }
        return;
      case 'walk': case 'run':
        for (const [w, x] of Object.entries(v)) {
          const a = who(w); if (!a) continue;
          running.push(isAnimal(w) ? ctx.fx.moveTo(a, x, { run: k === 'run' }) : B.walkTo(a, x, { run: k === 'run' }));
        }
        return;
      case 'turn': for (const [w, left] of Object.entries(v)) { const a = who(w); if (!a) continue; if (isAnimal(w)) a.left = left; else B.turn(a, left); } return;
      case 'face': for (const [w, f] of Object.entries(v)) B.face(B.A[w], f); return;
      case 'calm': for (const w of v) B.face(B.A[w], 'happy'); return;
      case 'trig': for (const [w, g] of Object.entries(v)) B.trig(B.A[w], g); return;
      case 'cam': running.push(B.cam(...v)); return;
      case 'wait': return B.wait(v);
      case 'set': {
        const V = ctx.set.V;
        for (const [part, val] of Object.entries(v)) {
          if (val && typeof val === 'object') {
            if (val.from != null) V[part] = val.from;
            running.push(B.tween(V, part, val.to, val.dur || 0.001, val.ease === 'linear' ? (q) => q : undefined));
          } else V[part] = part === 'sign' ? (val ? (B.data('signs')[val] ?? val) : val) : val;
        }
        return;
      }
      case 'sfx': if (play[v]) play[v](); return;
      case 'card': ctx.overlays.card(v); return;
      case 'wheel': running.push(ctx.overlays.wheel(v)); return;
      case 'lamps': ctx.overlays.lamps(v); return;
      case 'lamp': running.push(ctx.overlays.lamp(v)); return;
      case 'ring': for (const [w, c] of Object.entries(v)) { const a = who(w); if (a) ctx.fx.ring(a, c); } return;
      case 'ringsOff': ctx.fx.ringsOff(); return;
      case 'hop': { const a = ctx.ani[v]; if (a) ctx.fx.hop(a); return; }
      case 'mood': for (const [w, m] of Object.entries(v)) if (ctx.ani[w]) ctx.ani[w].mood = m; return;
      case 'hold': for (const [w, thing] of Object.entries(v)) ctx.hold(w, thing); return;
      case 'birds': ctx.fx.birds(!!v.on, { x: v.x ?? 0, y: v.y ?? 2.2 }); return;
      case 'pack': if (v) ctx.fx.pack(v.x, v.d); else ctx.fx.pack(null); return;
      case 'chase': running.push(ctx.chase(v)); return;
      case 'cues': running.push((async () => {
        let t = 0, line = null, from = 0; const inner = [], before = B.S.line;
        for (const [at, s2] of v) {
          if (typeof at === 'string') {
            // a word: when the next line to start says it (its share of the line × the recording's progress, as the
            // board steps); a word that line does not contain, or a line that ends first, fires the step at once
            if (!line) { await B.until(() => B.S.line && B.S.line !== before); line = B.S.line; }
            const text = plain((B.S.lines.lines[line.id] || {}).text || ''), i = text.indexOf(at, from);
            if (i >= 0) { from = i; const k = Math.max(0, i / Math.max(1, text.length) - 0.02); await B.until(() => B.S.line !== line || B.progress() >= k); }
          } else { if (at > t) await B.wait(at - t); t = Math.max(t, at); }
          const w = step(s2, inner); if (w) inner.push(w);
        }
        await Promise.all(inner);
      })()); return;
      case 'prop': ctx.props.prop(v); return;
      case 'move': running.push(ctx.props.move(v)); return;
      case 'morph': running.push(ctx.props.morph(v)); return;
      case 'tape': { const w = ctx.props.tape(v); if (w) running.push(w); return; }
      case 'dim': running.push(ctx.props.dim(v)); return;
      case 'ghost': running.push(ctx.props.ghost(v)); return;
      case 'pop': ctx.props.pop(v); return;
      case 'ride': ctx.props.ride(v); return;
      case 'rain': running.push(ctx.props.rain(v)); return;
      case 'tint': running.push(ctx.props.tint(v)); return;
      case 'sit': for (const [w, on] of Object.entries(v)) if (B.A[w]) B.sit(B.A[w], !!on); return;
      case 'sure': running.push(ctx.props.sure(v)); return;
      default: throw Error('unknown step ' + k);
    }
  }
  async function beat(steps) {
    const running = [];
    for (const s of steps) { const w = step(s, running); if (w && w.then) await w; }
    await Promise.all(running);
  }
  const run = async (steps) => { for (const s of steps || []) await beat([s]); };       // a list of steps, one after another
  const now = (steps) => beat(steps || []);                                               // a list of steps as one beat
  function actsToScenes(acts) {
    return (acts || []).map((act) => ({ name: act.name, async run() {
      if (ctx.useSet && act.set) ctx.useSet(act.set);          // an act in another place (since k439)
      B.cast(...(act.cast || []));
      const ppl = [...new Set([...(act.cast || []), ...(act.need || [])])].filter((k) => B.A[k]);
      if (ppl.length) await B.need(...ppl);
      for (const b of act.beats || []) await beat(b);
    } }));
  }
  return { step, beat, run, now, actsToScenes, st, rich };
}
