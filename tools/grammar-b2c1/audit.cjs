// Coverage audit for the private B2–C1 rebuild: compares every authored lesson with the item-level book index
// and with the live lessons it replaces (never fewer questions or answer points than either).
// Usage: node tools/grammar-b2c1/audit.cjs [--soft] [chapter ...]   (--soft lists problems without failing)
// Prints counts only, never lesson text. Writes .local/grammar-b2c1/reports/audit.json.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-b2c1');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8')), pad = n => String(n).padStart(3, '0'), exists = f => fs.existsSync(f);
const args = process.argv.slice(2), soft = args.includes('--soft'), only = args.filter(a => !a.startsWith('--')).map(String);
const units = read(path.join(dir, 'units.json'));
const problems = [], notes = [], rows = [];
const points = x => x.type === 'fill' ? x.items.reduce((s, it) => s + (it.match(/\[\[/g) || []).length, 0) : x.type === 'choice' ? x.items.reduce((s, it) => s + (it.match(/\(\(/g) || []).length, 0) : x.items.length;
const lessonFile = n => path.join(dir, 'chapters', 'k' + n + '.json');
const lesson = n => exists(lessonFile(n)) ? read(lessonFile(n)) : null;
const num = s => String(s ?? '').trim();
const same = (groupEx, bookEx) => { const g = num(groupEx).toLowerCase(), b = num(bookEx).toLowerCase(); return g === b || (/^\d+$/.test(b) && new RegExp('^' + b + '[a-z]').test(g)); };
const oldPts = (n, pred) => { const b = read(path.join(dir, 'base', n + '.json')); return b.oldExercises.filter(pred).reduce((s, o) => s + o.points, 0); };
const want = (kind, id) => !only.length || only.includes(kind + id);   // chapters: '16', partners: 'P7', references: 'R183'

function covered(where, list, groups, bookItems, bookPts, oldPoints) {
  if (!groups.length) { problems.push(`${where} not mapped`); return; }
  const items = groups.reduce((s, x) => s + x.items.length, 0), pts = groups.reduce((s, x) => s + points(x), 0);
  if (pts < bookPts || items < Math.min(bookItems, bookPts) ) problems.push(`${where} has ${items} questions/${pts} points, book ${bookItems}/${bookPts}`);
  if (pts < oldPoints) problems.push(`${where} has ${pts} points, the live lesson had ${oldPoints}`);
}

for (const ch of units.chapters) {
  const c = ch.chapter; if (!want('', c)) continue;
  const where = 'chapter ' + c, xf = path.join(dir, 'index', pad(c) + '.json');
  const ls = Object.entries(ch.lessons).map(([lv, n]) => ({ lv, n, L: lesson(n) }));
  for (const { n, L, lv } of ls) { if (!L) problems.push(`${where}: lesson k${n} (${lv}) missing`); else if (L.level !== lv) problems.push(`${where}: k${n} level ${L.level}, expected ${lv}`); }
  if (!exists(xf)) { problems.push(`${where}: index missing`); continue; }
  if (!exists(path.join(dir, 'reports', pad(c) + '.md'))) problems.push(`${where}: report missing`);
  const idx = read(xf), have = ls.filter(u => u.L);
  const groups = have.flatMap(u => u.L.exercises.map(x => ({ ...x, _n: u.n, _lv: u.lv })));
  for (const ex of idx.exercises || []) {
    const g = groups.filter(x => x.source?.chapter === c && x.source?.exercise != null && same(x.source.exercise, ex.number));
    const old = have.reduce((s, u) => s + oldPts(u.n, o => o.source?.chapter === c && o.source?.exercise != null && same(o.source.exercise, ex.number)), 0);
    covered(`${where}: exercise ${ex.number}`, idx, g, ex.items || 0, ex.points || ex.items || 0, old);
    const unitOfLevel = ls.find(u => u.lv === ex.level);
    if (unitOfLevel && g.some(x => x._lv !== ex.level && !read(path.join(dir, 'base', x._n + '.json')).oldExercises.some(o => o.id === x.id))) problems.push(`${where}: exercise ${ex.number} is ${ex.level} in the book but a new group sits in the ${ex.level === 'B2' ? 'C1' : 'B2'} lesson`);
    if (!ex.level) problems.push(`${where}: exercise ${ex.number} has no level`);
  }
  const trainings = new Set((idx.training || []).map(t => t.training));
  for (const t of ch.training) if (!trainings.has(t.training)) problems.push(`${where}: training ${t.training} missing from the index`);
  for (const t of idx.training || []) {
    const g = groups.filter(x => x.source?.chapter === c && num(x.source?.training) === num(t.training));
    const old = (ch.training.find(u => u.training === t.training) || {}).questions || 0;
    covered(`${where}: training ${t.training}`, idx, g, t.items || 0, t.items || 0, old);
  }
  const concepts = new Set(have.flatMap(u => u.L.source?.concepts || []));
  for (const e of idx.explanation || []) {
    if (!concepts.has(e.id)) problems.push(`${where}: explanation ${e.id} (${e.kind}) not listed as covered`);
    if (!e.level) problems.push(`${where}: explanation ${e.id} has no level`);
  }
  for (const u of have) {
    if (u.L.exercises.some(x => x.items.some(it => typeof it === 'object' && it && !it.spec && x.type !== 'match'))) problems.push(`${where}: k${u.n} has items without spec`);
    const pts = u.L.exercises.reduce((s, x) => s + points(x), 0), livePts = oldPts(u.n, () => true);
    if (pts < livePts) problems.push(`${where}: k${u.n} has ${pts} answer points in total, the live lesson had ${livePts}`);
    rows.push({ n: u.n, chapter: c, level: u.lv, groups: u.L.exercises.length, items: u.L.exercises.reduce((s, x) => s + x.items.length, 0), points: pts, livePoints: livePts, blocks: u.L.understand.length, examples: u.L.examples.length, speak: u.L.speak?.items?.length || 0 });
  }
}

for (const p of units.partners) {
  if (!want('P', p.partner)) continue;
  const where = 'partner ' + p.partner, xf = path.join(dir, 'index', 'P' + p.partner + '.json');
  if (!exists(xf)) { problems.push(`${where}: index missing`); continue; }
  const idx = read(xf), targets = Object.values(p.targetLessons), have = targets.map(n => ({ n, L: lesson(n) })).filter(u => u.L);
  if (have.length < targets.length) { problems.push(`${where}: target lesson missing`); continue; }
  const groups = have.flatMap(u => u.L.exercises.filter(x => num(x.source?.partner) === num(p.partner)));
  const old = targets.reduce((s, n) => s + oldPts(n, o => /partner/i.test(o.id) && new RegExp('partner-?' + p.partner + '(\\D|$)', 'i').test(o.id)), 0);
  for (const ex of idx.exercises || []) covered(`${where}: ${ex.number}`, idx, groups.filter(x => same(x.source.exercise, ex.number)), ex.items || 0, ex.points || ex.items || 0, 0);
  const pts = groups.reduce((s, x) => s + points(x), 0);
  if (pts < old) problems.push(`${where}: ${pts} answer points, the live lessons had ${old}`);
}

for (const r of units.references) {
  const n = r.lesson; if (!want('R', n)) continue;
  const where = 'reference ' + n, xf = path.join(dir, 'index', 'R' + n + '.json'), L = lesson(n);
  if (!L) { problems.push(`${where}: lesson missing`); continue; }
  if (!exists(xf)) { problems.push(`${where}: index missing`); continue; }
  if (!exists(path.join(dir, 'reports', 'R' + n + '.md'))) problems.push(`${where}: report missing`);
  const idx = read(xf), listRows = L.understand.filter(b => b.type === 'reflist' || b.type === 'grid' || b.type === 'table').reduce((s, b) => s + (b.rows?.length || 0), 0);
  if (listRows < (idx.rows || 0)) problems.push(`${where}: ${listRows} list rows, book ${idx.rows}`);
  const pts = L.exercises.reduce((s, x) => s + points(x), 0), livePts = oldPts(n, () => true);
  if (pts < livePts) problems.push(`${where}: ${pts} answer points, the live lesson had ${livePts}`);
  if (L.exercises.some(x => x.items.some(it => typeof it === 'object' && it && !it.spec && x.type !== 'match'))) problems.push(`${where}: items without spec`);
  rows.push({ n, reference: true, groups: L.exercises.length, items: L.exercises.reduce((s, x) => s + x.items.length, 0), points: pts, livePoints: livePts, listRows });
}

const total = rows.reduce((t, r) => ({ items: t.items + r.items, points: t.points + r.points, livePoints: t.livePoints + r.livePoints, groups: t.groups + r.groups }), { items: 0, points: 0, livePoints: 0, groups: 0 });
fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
if (!only.length) fs.writeFileSync(path.join(dir, 'reports/audit.json'), JSON.stringify({ total, rows, problems, notes }, null, 1));
console.log(`${rows.length} lessons authored · ${total.groups} groups · ${total.items} questions · ${total.points} answer points (live lessons: ${total.livePoints})`);
if (problems.length) { console.log(problems.length + ' problem(s):\n' + problems.join('\n')); if (!soft) process.exitCode = 1; }
else console.log('No coverage problems.');
