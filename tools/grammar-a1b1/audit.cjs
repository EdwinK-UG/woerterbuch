// Coverage audit for the private A1–B1 rebuild: compares every authored chapter with its item-level book index.
// Usage: node tools/grammar-a1b1/audit.cjs [--soft]   (--soft lists problems without failing)
// Prints counts only, never lesson text. Writes .local/grammar-a1b1/reports/audit.json.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-a1b1');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8')), pad = n => String(n).padStart(3, '0'), exists = f => fs.existsSync(f);
const soft = process.argv.includes('--soft');
const problems = [], rows = [];
const points = x => x.type === 'fill' ? x.items.reduce((s, it) => s + (it.match(/\[\[/g) || []).length, 0) : x.type === 'choice' ? x.items.reduce((s, it) => s + (it.match(/\(\(/g) || []).length, 0) : x.items.length;
const ocrNums = exists(path.join(dir, 'extraction/ocr-exercise-numbers.json')) ? read(path.join(dir, 'extraction/ocr-exercise-numbers.json')) : {};
const okOcr = exists(path.join(dir, 'reports/ocr-false-positives.json')) ? read(path.join(dir, 'reports/ocr-false-positives.json')) : {}; // checked by hand
const contiguous = a => { let k = 0; while (a.includes(k + 1)) k++; return k; };
const partners = exists(path.join(dir, 'partners')) ? fs.readdirSync(path.join(dir, 'partners')).filter(f => /^P\d+\.json$/.test(f)).map(f => read(path.join(dir, 'partners', f))) : [];
const num = s => String(s ?? '').match(/^\d+/)?.[0];

function cover(where, idx, groups, key) {
  for (const ex of idx) {
    const id = key === 'training' ? ex.label : String(ex.number);
    const mapped = groups.filter(x => key === 'training' ? x.source?.training === id : num(x.source?.exercise) === num(id) && (String(id).match(/[a-z]$/) ? String(x.source.exercise).startsWith(id) : true));
    if (!mapped.length) { problems.push(`${where}: ${key} ${id} not mapped`); continue; }
    const items = mapped.reduce((s, x) => s + x.items.length, 0), pts = mapped.reduce((s, x) => s + points(x), 0);
    const bookPts = ex.points || ex.items || 0, gapText = (ex.items || 0) === bookPts || /gap|lücke|text/i.test(ex.task || '');
    if ((!gapText && items < (ex.items || 0)) || pts < bookPts) problems.push(`${where}: ${key} ${id} has ${items} items/${pts} points, book ${ex.items}/${ex.points}`);
  }
}

for (let n = 1; n <= 85; n++) {
  const where = 'k' + n, cf = path.join(dir, 'chapters', pad(n) + '.json'), xf = path.join(dir, 'index', pad(n) + '.json'), rf = path.join(dir, 'reports', pad(n) + '.md');
  if (!exists(cf) || !exists(xf)) { problems.push(`${where}: ${!exists(cf) ? 'lesson' : ''} ${!exists(xf) ? 'index' : ''} missing`); continue; }
  if (!exists(rf)) problems.push(`${where}: report missing`);
  const c = read(cf), idx = read(xf), base = read(path.join(dir, 'base', pad(n) + '.json'));
  const groups = [...c.exercises, ...partners.filter(p => p.target === n).flatMap(p => p.exercises)];
  cover(where, idx.exercises || [], c.exercises, 'exercise');
  cover(where, idx.training || [], c.exercises, 'training');
  const concepts = new Set(c.source?.concepts || []);
  for (const e of idx.explanation || []) if (!concepts.has(e.id)) problems.push(`${where}: explanation ${e.id} (${e.kind}) not listed as covered`);
  for (const [id] of base.oldExerciseIds) if (!c.exercises.some(x => x.id === id)) problems.push(`${where}: old exercise id ${id} removed`);
  if (c.level !== idx.level) problems.push(`${where}: lesson level ${c.level} differs from book level ${idx.level}`);
  const ocr = contiguous(ocrNums[n] || []), indexed = (idx.exercises || []).map(e => num(e.number)).filter((v, i, a) => a.indexOf(v) === i).length;
  if (ocr > indexed && !(okOcr[n])) problems.push(`${where}: OCR layout shows at least ${ocr} numbered exercises, index lists ${indexed}`);
  if (c.exercises.some(x => x.items.some(it => typeof it === 'object' && it && !it.spec && x.type !== 'match'))) problems.push(`${where}: items without spec`);
  rows.push({ n, level: c.level, oldLevel: base.oldLevel, bookExercises: indexed, ocrExercises: ocr, groups: groups.length, items: groups.reduce((s, x) => s + x.items.length, 0), points: groups.reduce((s, x) => s + points(x), 0),
    bookItems: (idx.exercises || []).reduce((s, e) => s + (e.items || 0), 0) + (idx.training || []).reduce((s, e) => s + (e.items || 0), 0), explanation: (idx.explanation || []).length, blocks: c.understand.length, speak: c.speak?.items?.length || 0, examples: c.examples.length });
}
for (const id of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11']) {
  const p = partners.find(p => p.id === id), xf = path.join(dir, 'index', id + '.json');
  if (!p || !exists(xf)) { problems.push(`${id}: partner ${!p ? 'lesson' : ''} ${!exists(xf) ? 'index' : ''} missing`); continue; }
  if (!exists(path.join(dir, 'chapters', pad(p.target) + '.json'))) problems.push(`${id}: target chapter ${p.target} not authored`);
  const idx = read(xf); for (const ex of idx.exercises || []) { const mapped = p.exercises.filter(x => String(x.source?.exercise ?? '').includes(String(ex.number)) || (idx.exercises.length === 1)); const pts = (mapped.length ? mapped : p.exercises).reduce((s, x) => s + points(x), 0); if (pts < (ex.points || ex.items || 0)) problems.push(`${id}: ${ex.number} ${pts} points, book ${ex.points || ex.items}`); }
}
for (const f of ['k101.js', 'k102.js', 'k103.js', 'k104.js', 'k106.js']) if (!exists(path.join(dir, 'refs', f))) problems.push(`appendix: refs/${f} missing`);
const total = rows.reduce((t, r) => ({ items: t.items + r.items, points: t.points + r.points, groups: t.groups + r.groups, bookItems: t.bookItems + r.bookItems }), { items: 0, points: 0, groups: 0, bookItems: 0 });
fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
fs.writeFileSync(path.join(dir, 'reports/audit.json'), JSON.stringify({ total, rows, problems }, null, 1));
console.log(`${rows.length}/85 chapters authored · ${total.groups} groups · ${total.items} questions · ${total.points} answer points (book items indexed: ${total.bookItems}) · ${partners.length}/11 partner pages`);
if (problems.length) { console.log(problems.length + ' problem(s):\n' + problems.join('\n')); if (!soft) process.exitCode = 1; }
else console.log('No coverage problems.');
