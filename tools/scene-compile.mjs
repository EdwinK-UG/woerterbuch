/* Scene compiler: turns a scene as an author writes it (acts of beats with handy shortcuts: `saw: 3`, `home: […]`,
   `carry: true`, `sign: {…}`, `band: 's2'` …) into scene format v1 (docs/scene-format.md): beats as ordered lists of
   single-key steps from one closed vocabulary, with every place resolved to a number and every scene's starting state
   written out. The web player (grammatik/buehne/regie.js) and the iOS and Android players read only format v1.
   Holds no lesson text: only staging (positions, gestures, timings) and the ids of lines.

     import { compileScene } from '../../../tools/scene-compile.mjs';
     const v1 = compileScene(lines, 'k05');           // lines: the private lines file as the script built it
     const v1 = compileScene(lines, 'k99', staging);  // a newer film brings its own staging (see `staging` below)

   Or, for files already written:  node tools/scene-compile.mjs .local/scenes/k05-long/lines.json [...] */
import fs from 'node:fs';

/* ---------- the pilots' staging: places, starting states and the practice staging ---------- */
const WERKSTATT = { door: -6.6, sign: -5.0, window: -3.4, planks: -1.95, tools: 0.4, bench: 3.2, shelf: 5.7, stool: 5.0 };
const BENCH = { x: WERKSTATT.bench, d: -0.5, left: true, show: true };     // Meister Anton at his workbench
const HOME = { max: -2.35, dog: -0.95, ball: -0.15, cat: -3.25, pack: -1.55 };
const BASE = -1.3, PBASE = -1.7;                                            // the meadow's wide shot; the practice's
const animalD = (k) => (k === 'cat' ? -0.2 : 0.12);

export const PILOTS = {
  k05: {
    set: 'werkstatt', cast: ['anton', 'liv', 'lena'], animals: {}, cases: false, spots: WERKSTATT, camStart: 1.6,
    setStart: { win: 0, sign: 'rauchen', signPic: 'rauchen', signGlow: 0, sweep: null },
    actStart: (act) => (act.cast || []).includes('anton') ? [{ place: { anton: { ...BENCH } } }] : [],
    filmStart: [{ place: { anton: { ...BENCH } } }],
    practice: {
      cast: ['anton', 'liv', 'lena'],
      start: [{ place: { anton: { ...BENCH }, liv: P(0.8), lena: P(-0.3, 0.05) } }, { cam: [1.5, 1.0, 1.0] }],
      parts: {
        order: { intro: 'p01' },
        choice: { intro: 'p02' },
        sign: { intro: 'p03', start: [{ place: { anton: P(-4.2, 0, true), liv: P(-2.9, 0, true), lena: P(-2.2, 0.05, true) } }, { set: { sign: '' } }, { cam: [-4.0, 1.05, 1.2] }] },
        type: { start: [{ place: { anton: { ...BENCH }, liv: P(0.8), lena: P(-0.3, 0.05) } }, { cam: [1.5, 1.0, 1.0] }] },
      },
      ask: { who: 'liv', frame: ['liv', 'lena'] },
      right: {
        type: { laugh: ['liv', 'lena'], say: ['r07'], bubble: true, hold: 2.2 },
        choice: { laugh: ['liv'], say: ['r06'], bubble: true, hold: 2.2 },
        '*': { laugh: ['anton'], say: ['r01', 'r02', 'r03'], bubble: true, hold: 2.2 },
      },
      miss: { order: { who: 'anton', say: ['r04', 'r05'] }, sign: { who: 'anton', say: ['r04', 'r05'] }, '*': { who: 'liv', say: ['r08'] } },
      end: [{ trig: { anton: 'clap' } }, { face: { anton: 'laugh', liv: 'laugh', lena: 'laugh' } }, { say: { id: 'p06', frame: false } }],
    },
  },
  k17: {
    set: 'dorf', cast: ['max'], animals: { dog: 'dog', cat: 'cat', ball: 'ball' }, cases: true, spots: HOME, camStart: BASE,
    setStart: {},
    actStart: () => [],
    filmStart: [{ place: { max: { x: HOME.max, d: 0, left: false, show: true }, ...homeAnimals(['dog']) } }],
    practice: {
      cast: ['max'],
      start: [{ place: { max: { x: HOME.max, d: 0, left: false, show: true }, ...homeAnimals(['dog', 'ball', 'cat']) } }, { cam: [PBASE, 1.0, 0.8] }],
      parts: {
        regie: { intro: 'p01' },
        choice: { start: [{ place: { ball: { x: HOME.ball, show: false } } }, { pack: { x: HOME.pack, d: 0.35 } }, { trig: { max: 'point' } }], intro: 'p02', thingAt: { x: HOME.pack, d: 0.35 } },
        type: { start: [{ pack: null }] },
      },
      act: { camBack: PBASE, wrong: 'r04', oops: 'r03', home: HOME },
      right: {
        regie: { laugh: ['max'], hop: 'dog', say: ['r02'], hold: 0.6 },
        '*': { laugh: ['max'], hop: 'dog', say: ['r01'], hold: 0.6 },
      },
      miss: { '*': { who: 'max', say: ['r04'] } },
      end: [{ pack: null }, { face: { max: 'laugh' } }, { hop: 'dog' }, { sfx: 'bark' }, { say: 'p06' }],
    },
  },
};
function P(x, d = 0, left = false) { return { x, d, left, show: true }; }
function homeAnimals(shown) {
  const out = {}; for (const k of ['dog', 'cat', 'ball']) out[k] = { x: HOME[k], d: animalD(k), left: k === 'dog', show: shown.includes(k) }; return out;
}

/* ---------- beats: shortcuts → steps ---------- */
const at = (pilot, x, who) => {
  if (typeof x === 'number') return x;
  const s = String(x);
  if (s === 'home') return pilot.spots[who];
  if (s === 'max') return HOME.max + 0.55;                                    // beside Max (the dog comes to him)
  const m = /^([a-z]+)([+-][\d.]+)?$/.exec(s);
  if (!m || pilot.spots[m[1]] == null) throw Error(`unknown place "${s}"`);
  return +(pilot.spots[m[1]] + (+m[2] || 0)).toFixed(3);
};
const isAnimal = (pilot, k) => !!pilot.animals[k];

function beatSteps(b, pilot) {
  if (Array.isArray(b)) {                                 // a beat already written as format v1 steps
    for (const s of b) { const k = Object.keys(s); if (k.length !== 1 || !VOCAB.has(k[0])) throw Error('not a v1 step: ' + JSON.stringify(s)); }
    return b;
  }
  const out = [], frame = b.sayOpt && 'frame' in b.sayOpt ? { frame: b.sayOpt.frame } : {};
  const sayOf = (id) => (Object.keys(frame).length ? { say: { id, ...frame } } : { say: id });
  for (const [k, v] of Object.entries(b)) {
    switch (k) {
      case 'say': out.push(sayOf(v)); break;
      case 'line': {
        const l = { id: v };
        for (const f of ['pic', 'icon', 'strip', 'kind']) if (b[f] != null) l[f] = b[f];
        if (b.at) l.who = b.at;
        if (pilot.cases) l.clamp = false;
        Object.assign(l, frame); out.push({ line: l }); break;
      }
      case 'pic': case 'icon': case 'strip': case 'kind': case 'sayOpt': case 'at': break;    // parts of line
      case 'place': {
        const p = {};
        for (const [who, [x, o = {}]] of Object.entries(v)) p[who] = { x: at(pilot, x, who), d: o.d ?? 0, left: o.left ?? false, show: o.show ?? true };
        out.push({ place: p }); break;
      }
      case 'walk': case 'run': case 'move': case 'dash': {
        const w = {}; for (const [who, x] of Object.entries(v)) w[who] = at(pilot, x, who);
        out.push({ [k === 'run' || k === 'dash' ? 'run' : 'walk']: w }); break;
      }
      case 'turn': case 'face': case 'trig': case 'mood': out.push({ [k]: v }); break;
      case 'look': out.push({ turn: v }); break;
      case 'calm': out.push({ calm: v }); break;
      case 'cam': out.push({ cam: [typeof v[0] === 'number' ? v[0] : BASE, v[1] ?? 1, v[2] ?? 1.2] }); break;
      case 'wait': out.push({ wait: v }); break;
      case 'bubble': out.push({ bubble: v.hide ? false : v }); break;
      case 'hideBubble': out.push({ bubble: false }); break;
      case 'band': { const [id, who] = Array.isArray(v) ? v : [v]; out.push({ bubble: { strip: id, ...(who ? { who } : {}), clamp: false } }); break; }
      case 'merk': out.push({ card: v }, { sfx: 'pop' }); break;
      case 'wheel': out.push({ wheel: v }); break;
      // the workshop
      case 'sign': out.push({ set: { sign: v.key, signPic: v.pic, ...(v.glow ? { signGlow: { from: 1, to: 0, dur: 1.4 } } : {}) } }, { sfx: 'pop' }); break;
      case 'window': out.push({ sfx: 'roll' }, { set: { win: { to: 1, dur: 1.0 } } }); break;
      case 'sweep': out.push({ sfx: 'roll' }, { set: { sweep: { from: -8, to: 7, dur: 6, ease: 'linear' } } }); break;
      case 'saw': { const n = v || 2, cues = []; for (let i = 0; i < n; i++) cues.push([+(i * 1.6).toFixed(2), { trig: { anton: 'pull' } }]); cues.push([+(n * 1.6).toFixed(2), { wait: 0 }]); out.push({ cues }); break; }
      case 'bench': out.push({ place: { anton: { ...BENCH } } }); break;
      // the meadow
      case 'home': out.push({ place: homeAnimals(v) }); break;
      case 'max': out.push({ place: { max: { x: HOME.max, d: 0, left: false, show: true } } }); break;
      case 'pet': {
        const p = {};
        for (const [who, [x, o = {}]] of Object.entries(v)) p[who] = { x: at(pilot, x, who), d: o.d ?? animalD(who), ...(o.left != null ? { left: o.left } : {}), show: true };
        out.push({ place: p }); break;
      }
      case 'ring': out.push({ ring: v }); break;
      case 'ringsOff': out.push({ ringsOff: true }); break;
      case 'lamps': out.push({ lamps: !!v }); break;
      case 'lamp': out.push({ lamp: v }); break;
      case 'chase': out.push({ chase: { by: v[0], after: v[1], to: 3.1, camOut: 0.9, camBack: BASE } }); break;
      case 'hop': out.push({ hop: v }); if (v === 'dog') out.push({ sfx: 'bark' }); break;
      case 'birds': out.push({ birds: v ? { on: true, x: BASE, y: 2.0 } : { on: false } }); break;
      case 'bleat': out.push({ set: { lambHop: 1 } }); break;
      case 'carry': out.push(v ? { hold: { dog: 'ball' } } : { hold: { dog: null } }, ...(v ? [] : [{ place: { ball: { x: +(HOME.max + 0.25).toFixed(3) } } }])); break;
      case 'backHome': out.push({ walk: { dog: HOME.dog, ball: HOME.ball, cat: HOME.cat } }); break;
      case 'base': out.push({ cam: [BASE, 1.0, v || 0.8] }); break;
      case 'start': break;
      default:
        if (VOCAB.has(k)) out.push({ [k]: v });             // already format v1
        else throw Error(`unknown beat key "${k}"`);
    }
  }
  return out;
}

/* the closed vocabulary of format v1 (docs/scene-format.md) */
export const VOCAB = new Set(['say', 'line', 'bubble', 'place', 'walk', 'run', 'turn', 'face', 'calm', 'trig', 'cam', 'wait', 'set', 'sfx',
  'card', 'wheel', 'lamps', 'lamp', 'ring', 'ringsOff', 'hop', 'mood', 'hold', 'birds', 'pack', 'chase', 'cues',
  'prop', 'move', 'morph', 'tape', 'dim', 'ghost', 'pop', 'ride', 'rain', 'tint', 'sit', 'sure']);

/* A film after the pilots brings its own staging instead of an entry in PILOTS:
   { set, sets? (the other places its acts play in, since k439), cast, animals?, cases?, spots (named places in metres), camStart?, setStart?, filmStart?, actStart?(act),
     practice (practiceStage) }. Its beats may be written as v1 lists of steps, or with the shortcuts above. */
export function staging(o) {
  return { animals: {}, cases: false, setStart: {}, filmStart: [], actStart: () => [], camStart: 0, spots: {}, ...o };
}

export function compileScene(data, base, own) {
  const pilot = own || PILOTS[base]; if (!pilot) throw Error('no staging for ' + base);
  if (data.format === 1) return data;
  const acts = (data.acts || []).map((act) => ({
    name: act.name, cast: act.cast || [], ...(act.need ? { need: act.need } : {}), ...(act.set ? { set: act.set } : {}),
    beats: [pilot.actStart(act), ...(act.beats || []).map((b) => beatSteps(b, pilot))].filter((b) => b.length),
  }));
  return {
    ...data, format: 1, set: pilot.set, ...(pilot.sets ? { sets: pilot.sets } : {}), cast: pilot.cast, animals: pilot.animals, cases: pilot.cases,
    setStart: pilot.setStart, camStart: pilot.camStart, filmStart: pilot.filmStart, acts, practiceStage: pilot.practice,
  };
}

// node tools/scene-compile.mjs <lines.json> …  (the scene's base, k05 or k17, from its folder name)
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const f of process.argv.slice(2)) {
    const base = /(k\d\d)/.exec(f)[1], d = JSON.parse(fs.readFileSync(f, 'utf8'));
    fs.writeFileSync(f, JSON.stringify(compileScene(d, base), null, 1) + '\n'); console.log('compiled', f);
  }
}
