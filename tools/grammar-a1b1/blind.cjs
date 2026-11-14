// Blind-solving support for the private A1–B1 rebuild.
//   node tools/grammar-a1b1/blind.cjs sheets [n ...]   → .local/grammar-a1b1/blind/sheets/NNN.json (no answers)
//   node tools/grammar-a1b1/blind.cjs compare [n ...]  → .local/grammar-a1b1/blind/mismatches/NNN.json
// A solver writes .local/grammar-a1b1/blind/answers/NNN.json:
//   {"<exercise id>": [ {"answer": <string | [per-gap strings] | [selected options] | {left: right}>, "also": [other acceptable answers in the same shape], "doubt": "optional note"} , … ] }
// The comparison uses the grader's own normalisation rules (copied from grammatik.js).
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-a1b1'), out = path.join(dir, 'blind');
const pad = n => String(n).padStart(3, '0'), read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const [mode, ...rest] = process.argv.slice(2);
const all = fs.readdirSync(path.join(dir, 'chapters')).filter(f => /^\d{3}\.json$/.test(f)).map(f => +f.slice(0, 3));
const list = rest.map(Number).filter(Boolean).length ? rest.map(Number).filter(Boolean) : all;
const partnersOf = n => { const d = path.join(dir, 'partners'); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => /^P\d+\.json$/.test(f)).map(f => read(path.join(d, f))).filter(p => p.target === n) : []; };
const groupsOf = n => { const c = read(path.join(dir, 'chapters', pad(n) + '.json')); return { c, groups: [...c.exercises, ...partnersOf(n).flatMap(p => p.exercises)] }; };
const sortCI = a => [...a].sort((x, y) => x.localeCompare(y, 'de'));

function sheet(x) {
  const base = { id: x.id, type: x.type, title: x.title, instruction: x.instr, commasMatter: !!x.commas, capitalisationMatters: !!x.strictCase, ...(x.bank ? { wordBox: x.bank } : {}), ...(x.before ? { context: x.before } : {}) };
  if (x.type === 'type') return { ...base, how: 'Write the text that goes between "before" and "after".', items: x.items.map(it => ({ prompt: it.q, before: it.pre, after: it.end })) };
  if (x.type === 'fill') return { ...base, how: 'Give one answer per numbered gap, in order.', items: x.items.map(it => { let k = 0; return { text: it.replace(/\[\[\^?([^\]]*)\]\]/g, (m, a) => `___(${++k}${m.startsWith('[[^') ? ', starts with ' + a[0] : ''})`) }; }) };
  if (x.type === 'choice') return { ...base, how: 'Choose one option per numbered gap.', items: x.items.map(it => { let k = 0; return { text: it.replace(/\(\(([^)]*)\)\)/g, (m, o) => `{${++k}: ${sortCI(o.split('|')).join(' / ')}}`) }; }) };
  if (x.type === 'order') return { ...base, how: 'Put ALL tiles in order (separate with single spaces); give the sentence without final punctuation.', items: x.items.map(it => ({ tiles: sortCI(it.tiles), after: it.end })) };
  if (x.type === 'select') return { ...base, how: 'Select every correct option.', items: x.items.map(it => ({ question: it.q, options: it.options })) };
  if (x.type === 'match') return { ...base, how: 'For each left side choose the right side. Answer as {"left": "right"}.', left: x.items.map(it => it.l), right: sortCI([...new Set(x.items.map(it => it.r))]) };
  if (x.type === 'cases') return { ...base, how: 'Give the case (n = Nominativ, a = Akkusativ, d = Dativ) of every numbered phrase.', items: x.items.map(it => { let k = 0; return { text: it.replace(/\{[nda]:([^}]*)\}/g, (m, t) => `[${++k}: ${t}]`) }; }) };
  return base;
}

const norm = s => s.replace(/[.,!?;:„“"'»«]/g, ' ').replace(/\s+/g, ' ').trim();
const commaNorm = s => s.normalize('NFC').replace(/[.!?;:„“"'»«]/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
function accepted(x, it, ans) {
  if (ans == null) return false;
  if (x.type === 'type') { const f = x.commas ? commaNorm : norm, v = f(String(ans)); return it.ok.some(a => f(a) === v || (!x.strictCase && f(a).toLowerCase() === v.toLowerCase())); }
  if (x.type === 'fill') { const gaps = [...it.matchAll(/\[\[\^?([^\]]*)\]\]/g)].map(m => m[1].split('|')); const a = [].concat(ans); return gaps.every((ok, k) => { const v = String(a[k] ?? '').trim(); return ok.includes(v) || (!x.strictCase && ok.some(o => o.toLowerCase() === v.toLowerCase())); }); }
  if (x.type === 'choice') { const gaps = [...it.matchAll(/\(\(([^)]*)\)\)/g)].map(m => m[1].split('|')[0]); const a = [].concat(ans); return gaps.every((ok, k) => String(a[k] ?? '').trim() === ok); }
  if (x.type === 'order') return it.ok.includes(String(ans).replace(/\s+/g, ' ').replace(/[.!?]$/, '').trim());
  if (x.type === 'select') { const a = [].concat(ans); return a.length === it.ok.length && it.ok.every(o => a.includes(o)); }
  if (x.type === 'cases') { const want = [...it.matchAll(/\{([nda]):/g)].map(m => m[1]); const a = [].concat(ans).map(s => String(s).trim().toLowerCase()[0]); return want.every((k, i) => a[i] === k); }
  return false;
}
const key = (x, it) => x.type === 'type' || x.type === 'order' ? it.ok : x.type === 'fill' ? [...it.matchAll(/\[\[\^?([^\]]*)\]\]/g)].map(m => m[1]) : x.type === 'choice' ? [...it.matchAll(/\(\(([^)]*)\)\)/g)].map(m => m[1].split('|')[0]) : x.type === 'select' ? it.ok : x.type === 'cases' ? [...it.matchAll(/\{([nda]):([^}]*)\}/g)].map(m => m[2] + '=' + m[1]) : it;

if (mode === 'sheets') {
  fs.mkdirSync(path.join(out, 'sheets'), { recursive: true }); fs.mkdirSync(path.join(out, 'answers'), { recursive: true });
  for (const n of list) { const { c, groups } = groupsOf(n); fs.writeFileSync(path.join(out, 'sheets', pad(n) + '.json'), JSON.stringify({ chapter: n, level: c.level, exercises: groups.map(sheet) }, null, 1)); }
  console.log('Wrote ' + list.length + ' blind sheets.');
} else if (mode === 'compare') {
  fs.mkdirSync(path.join(out, 'mismatches'), { recursive: true });
  let items = 0, wrong = 0, extra = 0, missing = 0;
  for (const n of list) {
    const af = path.join(out, 'answers', pad(n) + '.json'); if (!fs.existsSync(af)) { missing++; continue; }
    const answers = read(af), { groups } = groupsOf(n), found = [];
    for (const x of groups) {
      if (x.type === 'match') { const a = answers[x.id]?.[0]?.answer || {}; x.items.forEach((it, i) => { items++; if (a[it.l] !== it.r) { wrong++; found.push({ ex: x.id, item: i + 1, kind: 'solver answer rejected', left: it.l, key: it.r, solver: a[it.l] }); } }); continue; }
      x.items.forEach((it, i) => {
        items++; const s = answers[x.id]?.[i]; if (!s) { found.push({ ex: x.id, item: i + 1, kind: 'not answered' }); return; }
        const prompt = sheet({ ...x, items: [it] }).items?.[0];
        if (!accepted(x, it, s.answer)) { wrong++; found.push({ ex: x.id, item: i + 1, kind: 'solver answer rejected', prompt, key: key(x, it), solver: s.answer, also: s.also, doubt: s.doubt, spec: it.spec }); }
        for (const alt of s.also || []) if (!accepted(x, it, alt)) { extra++; found.push({ ex: x.id, item: i + 1, kind: 'solver alternative rejected', prompt, key: key(x, it), alternative: alt, doubt: s.doubt, spec: it.spec }); }
      });
    }
    fs.writeFileSync(path.join(out, 'mismatches', pad(n) + '.json'), JSON.stringify(found, null, 1));
  }
  console.log(`Compared ${list.length - missing} chapters: ${items} items, ${wrong} solver answers rejected by our key, ${extra} solver alternatives rejected${missing ? `, ${missing} chapters without answers` : ''}.`);
} else console.log('Usage: blind.cjs sheets|compare [n ...]');
