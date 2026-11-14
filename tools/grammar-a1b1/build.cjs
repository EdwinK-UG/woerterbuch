// Compile the private A1–B1 lesson data (.local/grammar-a1b1) into .local/lessons/k<n>.js.
// Usage: node tools/grammar-a1b1/build.cjs [n ...]   (default: every authored chapter)
// The lesson bodies stay private; this script holds no lesson text.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-a1b1');
const pad = n => String(n).padStart(3, '0');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));

const BLOCKS = new Set(['cards', 'grid', 'merk', 'note', 'conj', 'slots', 'table', 'verbs', 'q3', 'reflist', 'dialog']);
const TYPES = new Set(['choice', 'fill', 'order', 'type', 'select', 'match', 'cases']);
const LEVELS = new Set(['A1', 'A2', 'B1']);
const norm = s => s.replace(/[.,!?;:„“"'»«]/g, ' ').replace(/\s+/g, ' ').trim();
const commaNorm = s => s.normalize('NFC').replace(/[.!?;:„“"'»«]/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
const gaps = (s, re) => s.match(re) || [];

function checkExercise(x, where) {
  const at = where + ' ' + x.id;
  assert.ok(typeof x.id === 'string' && /^[a-z0-9-]+$/i.test(x.id), at + ': id');
  assert.ok(TYPES.has(x.type), at + ': unsupported exercise type ' + x.type);
  assert.ok(x.title && x.instr, at + ': title and instruction');
  assert.notEqual(x.graded, false, at + ': every exercise is graded');
  assert.ok(x.source && (x.source.exercise != null || x.source.partner != null || x.source.training != null), at + ': source mapping');
  assert.ok(Array.isArray(x.items) && x.items.length, at + ': items');
  x.items.forEach((it, i) => {
    const ai = at + ' item ' + (i + 1);
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
      const key = [...it.tiles].sort().join('\u0001');
      for (const a of it.ok) { assert.ok(!/[.!?]$/.test(a), ai + ': order answers have no final punctuation (use end)'); }
      // every accepted order must be buildable from the tiles: verified by the real UI in verify.cjs
      assert.ok(key.length, ai);
    } else if (x.type === 'select') {
      assert.ok(it.q && Array.isArray(it.options) && new Set(it.options).size === it.options.length && it.ok?.length && it.ok.every(a => it.options.includes(a)), ai + ': select');
    } else if (x.type === 'match') {
      assert.ok(typeof it.l === 'string' && typeof it.r === 'string', ai + ': match l/r');
    } else if (x.type === 'cases') {
      assert.ok(typeof it === 'string' && /\{[nda]:[^}]+\}/.test(it), ai + ': cases item needs {n:…}/{d:…}/{a:…}');
    }
  });
  if (x.type === 'fill' || x.type === 'choice') x.perGap = true;
}

function strip(x) { // authoring-only fields stay private to the JSON sources
  const y = structuredClone(x);
  for (const it of y.items) if (it && typeof it === 'object') { delete it.bad; delete it.spec; delete it.note; }
  delete y.note;
  return y;
}

function compile(n) {
  const file = path.join(dir, 'chapters', pad(n) + '.json'); assert.ok(fs.existsSync(file), 'missing chapter ' + n);
  const c = read(file), base = read(path.join(dir, 'base', pad(n) + '.json')), where = 'k' + n;
  assert.equal(c.n, n, where + ': n'); assert.ok(LEVELS.has(c.level), where + ': level');
  for (const k of ['title', 'kicker', 'intro', 'hero']) assert.ok(typeof c[k] === 'string' && c[k].trim(), where + ': ' + k);
  assert.equal(c.source?.chapter, n, where + ': source.chapter');
  assert.ok(Array.isArray(c.understand) && c.understand.length, where + ': understand');
  for (const b of c.understand) assert.ok(BLOCKS.has(b.type), where + ': unsupported block ' + b.type);
  assert.ok(Array.isArray(c.examples), where + ': examples');
  const exercises = c.exercises.map(strip);
  const partnerDir = path.join(dir, 'partners');
  const partners = fs.existsSync(partnerDir) ? fs.readdirSync(partnerDir).filter(f => /^P\d+\.json$/.test(f)).map(f => read(path.join(partnerDir, f))).filter(p => p.target === n) : [];
  const understand = structuredClone(c.understand);
  for (const p of partners) { if (p.understand) understand.push(...structuredClone(p.understand)); for (const x of p.exercises) { checkExercise(x, where + ' partner ' + p.id); exercises.push(strip(x)); } }
  c.exercises.forEach(x => checkExercise(x, where));
  exercises.forEach(x => { if (x.type === 'fill' || x.type === 'choice') x.perGap = true; });
  const ids = exercises.map(x => x.id); assert.equal(new Set(ids).size, ids.length, where + ': duplicate exercise ids');
  const groupsFile = path.join(dir, 'groups.json'), groupName = fs.existsSync(groupsFile) ? String(read(groupsFile)[n] || '').replace(/^(A1|A2|B1) · /, '') || null : null; // the level badge is shown separately
  const lesson = { n, level: c.level, group: groupName || c.group || base.oldGroup, title: c.title, kicker: c.kicker, intro: c.intro, hero: c.hero,
    lemmas: c.lemmas || base.lemmas || {}, understand, examples: c.examples, exercises, speak: c.speak || { title: 'Sprechen', intro: '', items: [] }, source: { chapter: n, partners: partners.map(p => p.id) } };
  if (exercises.length > 1) lesson.exercisePaging = true;
  const body = JSON.stringify(lesson, null, 1);
  assert.ok(!/data:image|\.pdf|<script/i.test(body), where + ': forbidden content');
  const art = c.art || base.art;
  const js = '/* Kapitel ' + n + ' (' + c.level + '). Eigene Texte, Beispiele und Übungen. */\nGRAM.add(Object.assign(' + body + (art ? ', { art: ' + art + ' }' : '') + '));\n';
  new Function('GRAM', js)({ add: () => {} }); // syntax check
  return js;
}

const all = fs.readdirSync(path.join(dir, 'chapters')).filter(f => /^\d{3}\.json$/.test(f)).map(f => +f.slice(0, 3));
const wanted = process.argv.slice(2).map(Number).filter(Boolean);
const list = wanted.length ? wanted : all;
const out = list.map(n => [n, compile(n)]); // validate everything before writing anything
for (const [n, js] of out) fs.writeFileSync(path.join(root, '.local/lessons/k' + n + '.js'), js);
// Reference units (verb lists, ordinal numbers) contain trainer generators, so they are authored as lesson JS directly.
const refDir = path.join(dir, 'refs');
if (!wanted.length && fs.existsSync(refDir)) for (const f of fs.readdirSync(refDir).filter(f => /^k\d+\.js$/.test(f))) {
  const js = fs.readFileSync(path.join(refDir, f), 'utf8'); let added = 0; new Function('GRAM', js)({ add: () => added++ }); assert.equal(added, 1, f + ' must call GRAM.add once');
  fs.writeFileSync(path.join(root, '.local/lessons', f), js); console.log('Copied reference ' + f);
}
console.log('Compiled ' + out.length + ' A1–B1 lessons: ' + list.join(', '));
