'use strict';
// Scene format v1 (docs/scene-format.md): every private scene file uses only the closed vocabulary that the web, iOS
// and Android players implement, every id it names exists, and each pilot page names the same set and cast as its file.
const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..'), PRIV = path.join(ROOT, '.local', 'scenes');
const scenes = () => (fs.existsSync(PRIV) ? fs.readdirSync(PRIV).filter((d) => /-long$/.test(d) && fs.existsSync(path.join(PRIV, d, 'lines.json'))) : []);
const read = (s) => JSON.parse(fs.readFileSync(path.join(PRIV, s, 'lines.json'), 'utf8'));

const STEPS = new Set(['say', 'line', 'bubble', 'place', 'walk', 'run', 'turn', 'face', 'calm', 'trig', 'cam', 'wait', 'set', 'sfx',
  'card', 'wheel', 'lamps', 'lamp', 'ring', 'ringsOff', 'hop', 'mood', 'hold', 'birds', 'pack', 'chase', 'cues',
  'prop', 'move', 'morph', 'tape', 'dim', 'ghost', 'pop', 'ride', 'rain', 'tint', 'sit', 'sure']);
const TOP = new Set(['format', 'set', 'sets', 'cast', 'animals', 'cases', 'setStart', 'filmStart', 'camStart', 'acts', 'practiceStage', 'practice',
  'lines', 'strips', 'boards', 'cards', 'signs', 'wheels', 'lamps', 'names', 'why', 'parts', 'start', 'chapter', 'level', 'title', 'lang', 'glosses']);
const PARTS = { werkstatt: new Set(['win', 'sign', 'signPic', 'signGlow', 'sweep']), dorf: new Set(['lambHop']), see: new Set(['sun', 'clock', 'door', 'bridge']), wohnung: new Set(['win', 'wet', 'eve', 'done', 'door']), redaktion: new Set(['clock', 'page', 'press', 'door']) };
const FACES = new Set(['happy', 'smile', 'laugh', 'surprised', 'sad']), GESTURES = new Set(['wave', 'point', 'cheer', 'think', 'pull', 'clap']);
const SFX = new Set(['pop', 'roll', 'bark', 'click', 'tick', 'slip', 'right', 'wrong', 'plopp', 'splash', 'creak']), CASES = new Set(['n', 'a', 'd', 'g']);
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const BILDER = new Set([...src('grammatik/buehne/bilder.js').split('export const ICONS')[0].split('export const BILDER')[1].matchAll(/^ {2}([a-zA-Z]+)\(c/gm)].map((m) => m[1]));
const ICONS = new Set([...src('grammatik/buehne/bilder.js').split('export const ICONS')[1].matchAll(/^ {2}([a-zA-Z]+)\(c/gm)].map((m) => m[1]));
const THINGS = new Set([...src('grammatik/buehne/tiere.js').split('export const THINGS')[1].matchAll(/^ {2}([a-zA-Z]+)\(c/gm)].map((m) => m[1]));
const PROP_FIELDS = new Set(['thing', 'word', 'pic', 'x', 'y', 'd', 'rot', 's', 'alpha', 'glow', 'bob', 'tone', 'flip', 'look', 'on', 'show', 'w']);
const MOVE_FIELDS = new Set(['x', 'y', 'd', 'rot', 's', 'alpha', 'glow', 'dur', 'ease', 'arc', 'w']);
const MORPH_FX = new Set(['shave', 'stamp', 'flip', 'grow', 'cork', 'fold']), TONES = new Set(['sepia', 'gray', 'ghost', 'wish', 'guess']), LOOKS = new Set(['wood', 'paper', 'stone', 'flag', 'slot']);
const amount = (v) => typeof v === 'number' || (v && typeof v === 'object' && typeof (v.to ?? 1) === 'number');
const CAST = new Set([...src('grammatik/buehne/stage.js').split('export const CAST')[1].split('};')[0].matchAll(/^ {2}([a-z]+):/gm)].map((m) => m[1]));

const PICS = new Set();                       // the ids of props that are picture bubbles (a morph flips them to another picture)
// since k439: a film may play in more than one set (an act's `set`); `set` steps name the parts of the act's set
function checkSteps(steps, d, where, problems, setName = d.set) {
  const who = new Set([...(d.cast || []), ...Object.keys(d.animals || {})]), lines = d.lines || {};
  const need = (ok, msg) => { if (!ok) problems.push(`${where}: ${msg}`); };
  assert.ok(Array.isArray(steps), where + ': a beat is a list of steps');
  for (const s of steps) {
    need(s && typeof s === 'object' && !Array.isArray(s) && Object.keys(s).length === 1, 'a step has exactly one key: ' + JSON.stringify(s));
    const [k, v] = Object.entries(s)[0];
    need(STEPS.has(k), 'unknown step ' + k);
    const ids = (o) => need(lines[typeof o === 'string' ? o : o.id], 'no line ' + JSON.stringify(o));
    if (k === 'say') ids(v);
    if (k === 'line') { ids(v); if (v.strip) need(d.strips[v.strip], 'no strip ' + v.strip); if (v.pic) need(BILDER.has(v.pic), 'no picture ' + v.pic); if (v.icon) need(ICONS.has(v.icon), 'no icon ' + v.icon); }
    if (k === 'bubble' && v && v !== 'pop') { if (v.strip) need(d.strips[v.strip], 'no strip ' + v.strip); if (v.pic) need(BILDER.has(v.pic), 'no picture ' + v.pic); }
    if (['place', 'walk', 'run', 'turn', 'ring', 'mood'].includes(k)) for (const w of Object.keys(v)) need(who.has(w), `${k}: ${w} is neither cast nor animal`);
    if (k === 'place') for (const p of Object.values(v)) need(typeof p.x === 'number' && Object.keys(p).every((f) => ['x', 'd', 'left', 'show'].includes(f)), 'place needs a number x and only d/left/show');
    if (k === 'walk' || k === 'run') for (const x of Object.values(v)) need(typeof x === 'number', k + ' needs a number');
    if (k === 'face') for (const f of Object.values(v)) need(FACES.has(f), 'unknown face ' + f);
    if (k === 'trig') for (const g of Object.values(v)) need(GESTURES.has(g), 'unknown gesture ' + g);
    if (k === 'ring') for (const c of Object.values(v)) need(CASES.has(c), 'unknown case ' + c);
    if (k === 'cam') need(Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number'), 'cam is [x, k, seconds]');
    if (k === 'set') for (const part of Object.keys(v)) need(PARTS[setName].has(part), `the ${setName} has no part ${part}`);
    if (k === 'set' && v.sign) need(d.signs && d.signs[v.sign] != null, 'no sign ' + v.sign);
    if (k === 'sfx') need(SFX.has(v), 'unknown sound ' + v);
    if (k === 'card' && v) need(d.cards && d.cards[v], 'no card ' + v);
    if (k === 'lamp') need(d.lamps && d.lamps[v], 'no lamp ' + v);
    if (k === 'hop') need(d.animals && d.animals[v], 'hop: no animal ' + v);
    if (k === 'chase') need(who.has(v.by) && who.has(v.after), 'chase: unknown ' + v.by + '/' + v.after);
    // props (grammatik/buehne/requisiten.js): a prop is a baked thing or a word; move/morph name a prop placed before
    if (k === 'prop') for (const [id, p] of Object.entries(v)) {
      if (p === null) { PICS.delete(id); continue; }
      if (p.pic != null) PICS.add(id); else if (p.word != null || p.thing != null) PICS.delete(id);
      need(Object.keys(p).every((f) => PROP_FIELDS.has(f)), `prop ${id}: unknown field in ${JSON.stringify(p)}`);
      if (p.thing != null) need(THINGS.has(p.thing), `prop ${id}: no thing ${p.thing}`);
      if (p.tone != null) need(TONES.has(p.tone), `prop ${id}: unknown tone ${p.tone}`);
      if (p.on) need(who.has(p.on), `prop ${id}: on ${p.on} is not in the cast`);
      if (p.pic) need(BILDER.has(p.pic), `prop ${id}: no picture ${p.pic}`);
      if (p.look != null) need(LOOKS.has(p.look), `prop ${id}: unknown look ${p.look}`);
      need([p.thing, p.word, p.pic].filter((x) => x != null).length <= 1, `prop ${id}: a thing, a word or a picture, not two`);
      for (const f of ['x', 'y', 'd', 'rot', 's', 'alpha', 'glow', 'bob']) if (f in p) need(typeof p[f] === 'number', `prop ${id}: ${f} is a number`);
    }
    if (k === 'move') for (const [id, m] of Object.entries(v)) need(Object.keys(m).every((f) => MOVE_FIELDS.has(f)) && Object.entries(m).every(([f, x]) => f === 'ease' || typeof x === 'number'), `move ${id}: ${JSON.stringify(m)}`);
    if (k === 'morph') for (const [id, m] of Object.entries(v)) need(typeof m.to === 'string' && MORPH_FX.has(m.fx || 'flip'), `morph ${id}: ${JSON.stringify(m)}`);
    // (since k482) a picture bubble flips over to another picture: its `to` names a picture that exists
    if (k === 'morph') for (const [id, m] of Object.entries(v)) if (PICS.has(id)) need(BILDER.has(m.to) && (m.fx || 'flip') === 'flip', `morph ${id}: a picture flips to a picture: ${JSON.stringify(m)}`);
    const marksOk = (ms) => Array.isArray(ms) && ms.every((m) => typeof m.x === 'number' && typeof m.t === 'string' && Object.keys(m).every((f) => ['x', 't', 'flag'].includes(f)));
    const arcOk = (a) => a === null || (a && typeof a.from === 'number' && typeof a.to === 'number' && (a.t == null || typeof a.t === 'string'));
    if (k === 'tape') need(v === false || v === null || (typeof v.from === 'number' && typeof v.to === 'number' && marksOk(v.marks) && [undefined, 'tape', 'band'].includes(v.look) && (v.now == null || typeof v.now === 'number') && (!('arc' in v) || arcOk(v.arc)))
      || (v.from == null && Object.keys(v).length && Object.keys(v).every((f) => ['lit', 'marks', 'arc', 'now'].includes(f)) && (v.now == null || typeof v.now === 'number') && (!v.marks || marksOk(v.marks)) && (!('arc' in v) || arcOk(v.arc))), 'tape: ' + JSON.stringify(v));
    if (k === 'sure') need(Array.isArray(v) && v.every((x) => typeof x === 'string'), 'sure is a list of prop ids');
    if (k === 'dim') need(amount(v), 'dim is an amount or { to, dur }');
    if (k === 'ghost') for (const [w, x] of Object.entries(v)) { need(who.has(w), `ghost: ${w} is not in the cast`); need(amount(x), 'ghost: an amount or { to, dur }'); }
    // since k97: props burst, people ride props and sit, rain, the picture's tint, a bubble that bursts
    if (k === 'pop') need(Array.isArray(v) && v.every((x) => typeof x === 'string'), 'pop is a list of prop ids');
    if (k === 'ride') for (const [w, id] of Object.entries(v)) { need(who.has(w), `ride: ${w} is not in the cast`); need(id === null || typeof id === 'string', 'ride: a prop id or null'); }
    if (k === 'sit') for (const [w, on] of Object.entries(v)) { need(who.has(w), `sit: ${w} is not in the cast`); need(typeof on === 'boolean', 'sit: true or false'); }
    if (k === 'rain') need(amount(v) && (typeof v === 'number' || Object.keys(v).every((f) => ['to', 'dur', 'back'].includes(f))), 'rain is an amount or { to, dur, back }');
    if (k === 'tint') need(v && typeof v === 'object' && [null, 'none', 'sepia', 'wish', 'future'].includes(v.tone ?? null) && Object.keys(v).every((f) => ['tone', 'to', 'dur'].includes(f)), 'tint is { tone: sepia | wish | future | null, to, dur }');
    if (k === 'line' && v.kind) need(['say', 'think', 'wish'].includes(v.kind), 'unknown bubble kind ' + v.kind);
    if (k === 'cues') {
      // a word cue fires when the beat's next line says the word: that line must contain it (in every language)
      const said = steps.map((x) => x.say || x.line).filter(Boolean).map((x) => (typeof x === 'string' ? x : x.id))[0];
      const text = said && d.lines[said] ? d.lines[said].text.replace(/\{[a-z]+:([^}]*)\}/g, '$1') : '';
      let from = 0;
      for (const [t, s2] of v) {
        need(typeof t === 'number' || typeof t === 'string', 'cue time is seconds or a word');
        if (typeof t === 'string') { const i = text.indexOf(t, from); need(i >= 0, `cue word "${t}" is not in line ${said}`); if (i >= 0) from = i; }
        checkSteps([s2], d, where + ' cue', problems, setName);
      }
    }
  }
}

test('every scene file is format v1, in the closed vocabulary, and names only things that exist', (t) => {
  if (!scenes().length) { t.skip('no private scene files on this machine'); return; }
  for (const s of scenes()) {
    const d = read(s), problems = [];
    assert.equal(d.format, 1, s + ': format 1 (run tools/scene-compile.mjs)');
    for (const k of Object.keys(d)) assert.ok(TOP.has(k), `${s}: unknown top-level key ${k}`);
    assert.ok(PARTS[d.set], s + ': unknown set ' + d.set);
    for (const c of d.cast) assert.ok(CAST.has(c), s + ': unknown cast ' + c);
    for (const kind of Object.values(d.animals || {})) assert.ok(['dog', 'cat', 'ball'].includes(kind), s + ': unknown animal ' + kind);
    for (const part of Object.keys(d.setStart || {})) assert.ok(PARTS[d.set].has(part), `${s}: setStart part ${part}`);
    checkSteps(d.filmStart || [], d, s + ' filmStart', problems);
    for (const x of d.sets || []) assert.ok(PARTS[x] && x !== d.set, `${s}: unknown extra set ${x}`);
    d.acts.forEach((a, i) => {
      assert.ok(a.name && Array.isArray(a.cast), `${s} act ${i}`);
      if (a.set) assert.ok(a.set === d.set || (d.sets || []).includes(a.set), `${s} act ${i}: set ${a.set} is neither set nor in sets`);
      a.beats.forEach((b, j) => checkSteps(b, d, `${s} act ${i} beat ${j}`, problems, a.set || d.set));
    });
    for (const [id, b] of Object.entries(d.boards || {})) {
      if (!d.lines[id]) { problems.push(`${s}: board for missing line ${id}`); continue; }
      const said = d.lines[id].text.replace(/\{[a-z]+:([^}]*)\}/g, '$1');
      // every word a board step waits for is said in its line (else the step fires at once)
      const word = (at, what) => { if (typeof at === 'string' && !said.includes(at)) problems.push(`${s}: board ${id} ${what}: "${at}" is not in the line`); };
      for (const it of b.items || []) {
        if (it.strip && !d.strips[it.strip]) problems.push(`${s}: board ${id} strip ${it.strip}`);
        if (it.morph) for (const m of it.morph) { word(m.at, 'morph'); word(m.toAt, 'morph to'); word(m.twinAt, 'morph twin'); if (!MORPH_FX.has(m.fx || 'flip')) problems.push(`${s}: board ${id} morph fx ${m.fx}`); }
        if (it.drawers) for (const dr of it.drawers) { word(dr.at, 'drawer'); word(dr.open, 'drawer open'); for (const x of dr.items || []) if (x && typeof x === 'object') word(x.at, 'drawer item'); }
        if (it.cards) for (const cd of it.cards) if (cd.pic && !BILDER.has(cd.pic)) problems.push(`${s}: board ${id} picture ${cd.pic}`);
        if (it.pic && !BILDER.has(it.pic)) problems.push(`${s}: board ${id} picture ${it.pic}`);
        if (it.timeline) { const tl = it.timeline; for (const x of [...(tl.marks || []), ...(tl.notes || [])]) { word(x.at, 'timeline'); if (!(x.x >= 0 && x.x <= 1)) problems.push(`${s}: board ${id} timeline x ${x.x}`); } for (const a of tl.arcs || []) word(a.at, 'timeline arc'); }
      }
    }
    const P = d.practiceStage || {}, parts = new Set((d.practice || []).map((p) => p.part));
    checkSteps(P.start || [], d, s + ' practice start', problems); checkSteps(P.end || [], d, s + ' practice end', problems);
    for (const [part, ps] of Object.entries(P.parts || {})) { checkSteps(ps.start || [], d, `${s} practice ${part}`, problems); if (ps.intro && !d.lines[ps.intro]) problems.push(`${s}: intro ${ps.intro}`); }
    for (const p of parts) assert.ok((P.right || {})[p] || (P.right || {})['*'], `${s}: no reaction for part ${p}`);
    for (const r of [...Object.values(P.right || {}), ...Object.values(P.miss || {})]) for (const id of r.say || []) if (!d.lines[id]) problems.push(`${s}: reaction line ${id}`);
    for (const p of d.practice || []) {
      assert.ok(['order', 'choice', 'type', 'regie'].includes(p.kind), `${s}: practice kind ${p.kind}`);
      // an item's own staging (stage.start / right / miss[option index | '*']) and its reaction lines
      if (p.stage) {
        for (const k of Object.keys(p.stage)) assert.ok(['start', 'right', 'miss'].includes(k), `${s}: practice stage ${k}`);
        checkSteps(p.stage.start || [], d, `${s} practice ${p.src} start`, problems); checkSteps(p.stage.right || [], d, `${s} practice ${p.src} right`, problems);
        for (const [o, steps] of Object.entries(p.stage.miss || {})) { assert.ok(o === '*' || (p.options && p.options[+o] != null), `${s}: practice ${p.src} miss for option ${o}`); checkSteps(steps, d, `${s} practice ${p.src} miss ${o}`, problems); }
      }
      for (const id of [].concat(p.react || [])) if (!d.lines[id]) problems.push(`${s}: practice ${p.src} reaction ${id}`);
      if (p.kind === 'choice' && p.q.split('___').length > 2) for (const o of p.options) if (o.split(' … ').length !== p.q.split('___').length - 1) problems.push(`${s}: practice ${p.src}: option "${o}" fills every gap`);
      if (p.ask && !d.lines[p.ask]) problems.push(`${s}: ask ${p.ask}`);
      if (p.pic && !BILDER.has(p.pic)) problems.push(`${s}: practice picture ${p.pic}`);
    }
    assert.deepEqual(problems, [], s);
  }
});

test('each pilot page names the set and cast of its scene files', (t) => {
  if (!scenes().length) { t.skip('no private scene files on this machine'); return; }
  for (const [page, base] of [['grammatik/klammer/main.js', 'k05'], ['grammatik/jagd/main.js', 'k17'], ['grammatik/passiv/main.js', 'k99'], ['grammatik/konjunktiv/main.js', 'k97'], ['grammatik/futur2/main.js', 'k439'], ['grammatik/nominalstil/main.js', 'k482']]) {
    const m = /playScene\(\{ base: '(\w+)', set: '(\w+)', cast: \[([^\]]*)\]/.exec(src(page)); assert.ok(m, page);
    const cast = [...m[3].matchAll(/'(\w+)'/g)].map((x) => x[1]);
    for (const s of scenes().filter((x) => x.startsWith(base))) {
      const d = read(s); assert.equal(m[1], base); assert.equal(m[2], d.set, `${s}: set`); assert.deepEqual(cast, d.cast, `${s}: cast`);
      const more = /sets: \[([^\]]*)\]/.exec(src(page)); assert.deepEqual(more ? [...more[1].matchAll(/'(\w+)'/g)].map((x) => x[1]) : [], d.sets || [], `${s}: sets`);
    }
  }
});

test('the compiler leaves a format-v1 file as it is', async () => {
  const { compileScene } = await import(path.join(ROOT, 'tools', 'scene-compile.mjs'));
  const d = { format: 1, acts: [] }; assert.equal(compileScene(d, 'k05'), d);
  const old = { lines: { e01: { who: 'elisa', text: 'x' } }, acts: [{ name: 'a', cast: ['anton'], beats: [{ saw: 2, say: 'e01', sayOpt: { frame: false } }] }] };
  const v1 = compileScene(old, 'k05');
  assert.deepEqual(v1.acts[0].beats[1], [{ cues: [[0, { trig: { anton: 'pull' } }], [1.6, { trig: { anton: 'pull' } }], [3.2, { wait: 0 }]] }, { say: { id: 'e01', frame: false } }]);
  assert.deepEqual(v1.acts[0].beats[0], [{ place: { anton: { x: 3.2, d: -0.5, left: true, show: true } } }]);
});

test('the web player, the compiler and this test know the same steps, sounds and set parts', async () => {
  const regie = src('grammatik/buehne/regie.js'), steps = JSON.parse(regie.split('export const STEPS = ')[1].split(';')[0].replace(/'/g, '"').replace(/\s+/g, ''));
  assert.deepEqual(new Set(steps), STEPS, 'regie.js STEPS');
  const { VOCAB } = await import(path.join(ROOT, 'tools', 'scene-compile.mjs'));
  assert.deepEqual(VOCAB, STEPS, 'scene-compile.mjs VOCAB');
  const sounds = new Set([...src('grammatik/buehne/sfx.js').split('export const play = {')[1].matchAll(/^ {2}([a-z]+)\(/gm)].map((m) => m[1]));
  assert.deepEqual(sounds, SFX, 'sfx.js play');
  // the lake's parts are the ones its baked manifest names (when baked)
  const man = path.join(ROOT, 'assets', 'scene', 'sets', 'see.json');
  if (fs.existsSync(man)) assert.deepEqual(new Set(Object.keys(JSON.parse(fs.readFileSync(man, 'utf8')).state)), PARTS.see);
  const wm = path.join(ROOT, 'assets', 'scene', 'sets', 'wohnung.json');
  if (fs.existsSync(wm)) assert.deepEqual(new Set(Object.keys(JSON.parse(fs.readFileSync(wm, 'utf8')).state)), PARTS.wohnung);
  const rm = path.join(ROOT, 'assets', 'scene', 'sets', 'redaktion.json');
  if (fs.existsSync(rm)) assert.deepEqual(new Set(Object.keys(JSON.parse(fs.readFileSync(rm, 'utf8')).state)), PARTS.redaktion);
  // every set the web player can draw is a set this test knows
  const szene = src('grammatik/buehne/szene.js'), sets = [...szene.split('const SETS = {')[1].split('}')[0].matchAll(/(\w+):/g)].map((m) => m[1]);
  assert.deepEqual(new Set(sets), new Set(Object.keys(PARTS)), 'szene.js SETS');
});
