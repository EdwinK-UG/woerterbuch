// Compile the private B2–C1 lesson data (.local/grammar-b2c1/chapters/k<n>.json) into complete lesson files.
// Usage: node tools/grammar-b2c1/build.cjs [n ...]   (default: every authored lesson; n = lesson id, e.g. 105 or 401)
// The B2–C1 films (animation, narration and recordings) were removed on 2026-11-23, so lessons compile without a film.
// Output: .local/grammar-b2c1/out/k<n>.js (complete lesson file) and the same file in .local/lessons for local preview.
// The lesson bodies stay private; this script holds no lesson text.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), vm = require('node:vm');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-b2c1');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));

const BLOCKS = new Set(['cards', 'grid', 'merk', 'note', 'conj', 'slots', 'table', 'verbs', 'q3', 'reflist', 'dialog', 'scenes']);
const TYPES = new Set(['choice', 'fill', 'order', 'type', 'select', 'match', 'cases']);
const LEVELS = new Set(['B2', 'C1']);
const KINDS = (() => { const s = fs.readFileSync(path.join(root, 'grammatik/illustrations.js'), 'utf8'), k = [];
  for (const m of s.matchAll(/kinds(?:=|\.push\()\[?([^\]\)]*)/g)) for (const q of m[1].matchAll(/'([^']+)'/g)) k.push(q[1]); return new Set(k); })();
const norm = s => s.replace(/[.,!?;:„“"'»«]/g, ' ').replace(/\s+/g, ' ').trim();
const commaNorm = s => s.normalize('NFC').replace(/[.!?;:„“"'»«]/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
const gaps = (s, re) => s.match(re) || [];

function checkScene(sc, at) {
  if (sc == null) return;
  assert.ok(sc && typeof sc === 'object' && KINDS.has(sc.kind), at + ': scene kind must be one of the illustration kinds, got ' + (sc && sc.kind));
  for (const k of ['bubble', 'label', 'alt']) if (k in sc) assert.equal(typeof sc[k], 'string', at + ': scene.' + k);
}

function checkExercise(x, where) {
  const at = where + ' ' + x.id;
  assert.ok(typeof x.id === 'string' && /^[a-z0-9-]+$/i.test(x.id), at + ': id');
  assert.ok(TYPES.has(x.type), at + ': unsupported exercise type ' + x.type);
  assert.ok(x.title && x.instr, at + ': title and instruction');
  assert.notEqual(x.graded, false, at + ': every exercise is graded');
  const s = x.source || {};
  assert.ok(s.exercise != null || s.partner != null || s.training != null || s.reference != null, at + ': source mapping (exercise, training, partner or reference)');
  assert.ok(Array.isArray(x.items) && x.items.length, at + ': items');
  x.items.forEach((it, i) => {
    const ai = at + ' item ' + (i + 1);
    if (it && typeof it === 'object' && it.scene) checkScene(it.scene, ai);
    if (x.type === 'type') {
      assert.ok(typeof it.q === 'string' && Array.isArray(it.ok) && it.ok.length && it.ok.every(a => typeof a === 'string' && a.trim()), ai + ': q and ok');
      assert.ok(typeof it.pre === 'string' && typeof it.end === 'string', ai + ': pre and end');
      assert.ok(Array.isArray(it.bad) && it.bad.length, ai + ': needs at least one typical wrong answer in bad');
      const n = x.commas ? commaNorm : norm;
      for (const b of it.bad) assert.ok(!it.ok.some(a => n(a) === n(b)) && !(!x.strictCase && it.ok.some(a => n(a).toLowerCase() === n(b).toLowerCase())), ai + ': a bad answer is accepted by the grader: ' + b);
    } else if (x.type === 'fill') {
      assert.ok(typeof it === 'string' && gaps(it, /\[\[[^\]]+\]\]/g).length, ai + ': fill item needs [[gap]]');
    } else if (x.type === 'choice') {
      assert.ok(typeof it === 'string', ai + ': choice item is a string');
      const g = gaps(it, /\(\(([^)]*)\)\)/g); assert.ok(g.length, ai + ': choice item needs ((right|wrong))');
      for (const m of g) { const o = m.slice(2, -2).split('|'); assert.ok(o.length >= 2 && new Set(o).size === o.length && o.every(Boolean), ai + ': choice options'); }
    } else if (x.type === 'order') {
      assert.ok(Array.isArray(it.tiles) && it.tiles.length >= 2 && Array.isArray(it.ok) && it.ok.length && typeof it.end === 'string', ai + ': order tiles/ok/end');
      for (const a of it.ok) assert.ok(!/[.!?]$/.test(a), ai + ': order answers have no final punctuation (use end)');
    } else if (x.type === 'select') {
      assert.ok(it.q && Array.isArray(it.options) && new Set(it.options).size === it.options.length && it.ok?.length && it.ok.every(a => it.options.includes(a)), ai + ': select');
    } else if (x.type === 'match') {
      assert.ok(typeof it.l === 'string' && typeof it.r === 'string', ai + ': match l/r');
    } else if (x.type === 'cases') {
      assert.ok(typeof it === 'string' && /\{[nda]:[^}]+\}/.test(it), ai + ': cases item needs {n:…}/{d:…}/{a:…}');
    }
  });
}

function strip(x) { // authoring-only fields stay in the private JSON sources
  const y = structuredClone(x);
  for (const it of y.items) if (it && typeof it === 'object') { delete it.bad; delete it.spec; delete it.note; }
  delete y.note;
  if (y.type === 'fill' || y.type === 'choice') y.perGap = true;
  return y;
}

function compile(n) {
  const file = path.join(dir, 'chapters', 'k' + n + '.json'); assert.ok(fs.existsSync(file), 'missing lesson k' + n);
  const c = read(file), base = read(path.join(dir, 'base', n + '.json')), where = 'k' + n;
  assert.equal(c.n, n, where + ': n');
  if (base.reference) assert.equal(c.level, base.level, where + ': reference level stays ' + base.level); else { assert.ok(LEVELS.has(c.level), where + ': level'); assert.equal(c.level, base.level, where + ': level must stay ' + base.level + ' (lesson ids are per level)'); }
  for (const k of ['title', 'kicker', 'intro', 'hero']) assert.ok(typeof c[k] === 'string' && c[k].trim(), where + ': ' + k);
  if (base.reference) assert.equal(c.source?.reference, n, where + ': source.reference'); else assert.equal(c.source?.chapter, base.sourceChapter, where + ': source.chapter');
  assert.ok(Array.isArray(c.source?.concepts) && c.source.concepts.length, where + ': source.concepts');
  checkScene(c.scene, where + ' scene');
  assert.ok(Array.isArray(c.understand) && c.understand.length, where + ': understand');
  c.understand.forEach((b, i) => { assert.ok(BLOCKS.has(b.type), where + ': unsupported block ' + b.type); checkScene(b.scene, where + ' block ' + (i + 1)); if (b.type === 'scenes') b.items.forEach((it, j) => checkScene(it.scene, where + ' block ' + (i + 1) + ' scene ' + (j + 1))); });
  assert.ok(Array.isArray(c.examples), where + ': examples');
  c.exercises.forEach(x => checkExercise(x, where));
  const ids = c.exercises.map(x => x.id); assert.equal(new Set(ids).size, ids.length, where + ': duplicate exercise ids');
  for (const o of base.oldExercises) assert.ok(ids.includes(o.id), where + ': old exercise id ' + o.id + ' must stay in this lesson');
  const exercises = c.exercises.map(strip);
  const lesson = { n, level: c.level, group: c.group || base.group, title: c.title, kicker: c.kicker, intro: c.intro, hero: c.hero };
  if (c.scene) lesson.scene = c.scene;
  Object.assign(lesson, { lemmas: c.lemmas || base.lemmas || undefined, understand: c.understand, examples: c.examples, exercises,
    speak: c.speak || { title: 'Sprechen', intro: '', items: [] }, source: { chapter: base.sourceChapter, ...(base.reference ? { reference: n } : {}), partners: [...new Set(exercises.map(x => x.source?.partner).filter(p => p != null))] } });
  if (!lesson.lemmas) delete lesson.lemmas;
  if (exercises.length > 1) lesson.exercisePaging = true;
  const body = JSON.stringify(lesson, null, 1);
  assert.ok(!/data:image|\.pdf|<script/i.test(body), where + ': forbidden content');
  const inner = '/* Kapitel ' + (base.reference ? 'Liste ' + n : base.sourceChapter) + ' (' + c.level + '). Eigene Texte, Beispiele und Übungen. */\nGRAM.add(' + body + ');';
  const js = inner + '\n';
  let got; vm.runInNewContext(js, { GRAM: { add: l => { got = l; } } });     // syntax check
  assert.equal(got?.n, n, where + ': compiled file does not add the lesson');
  assert.ok(!('film' in got), where + ': B2–C1 lessons have no film');
  return js;
}

const all = fs.readdirSync(path.join(dir, 'chapters')).filter(f => /^k\d+\.json$/.test(f)).map(f => +f.slice(1, -5)).sort((a, b) => a - b);
const wanted = process.argv.slice(2).map(Number).filter(Boolean);
const list = wanted.length ? wanted : all;
const out = list.map(n => [n, compile(n)]); // validate everything before writing anything
fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
for (const [n, js] of out) { fs.writeFileSync(path.join(dir, 'out', 'k' + n + '.js'), js); fs.writeFileSync(path.join(root, '.local/lessons', 'k' + n + '.js'), js); }
console.log('Compiled ' + out.length + ' B2–C1 lessons: ' + list.join(', '));
