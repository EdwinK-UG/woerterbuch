// Flag word sequences shared between the private B2–C1 lesson data and the OCR text of the reference book
// (every page: chapters, training, appendix lists and the answer key).
// Usage: node tools/grammar-b2c1/overlap.cjs [--n=6] [lesson id ...]   (default: everything authored)
// Only pure form lists (reflist, conj, verbs blocks) count as "table" hits. Every TEXT hit must be rewritten,
// unless it is a pure list of forms (e.g. a fixed preposition list) recorded with a reason in
// .local/grammar-b2c1/reports/waivers/k<lesson id>.json as [{"hit": "<shared words>", "reason": "…"}].
// Prints only the shared words.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-b2c1');
const args = process.argv.slice(2), N = +(args.find(a => a.startsWith('--n='))?.slice(4) || 6), only = args.filter(a => !a.startsWith('--')).map(String);
const words = s => (String(s).toLowerCase().normalize('NFC').match(/[a-zäöüß]+/g) || []);
const book = new Set(), textDir = path.join(dir, 'extraction/text');
for (const f of fs.readdirSync(textDir)) {
  const p = +f.slice(5, 8); if (p < 5) continue;
  const w = words(fs.readFileSync(path.join(textDir, f), 'utf8').replace(/-\n/g, ''));
  for (let i = 0; i + N <= w.length; i++) book.add(w.slice(i, i + N).join(' '));
}
const waiverDir = path.join(dir, 'reports/waivers'), waivers = {};
if (fs.existsSync(waiverDir)) for (const f of fs.readdirSync(waiverDir).filter(f => /^k\d+\.json$/.test(f))) waivers[f.slice(1, -5)] = JSON.parse(fs.readFileSync(path.join(waiverDir, f), 'utf8'));
const SKIP_KEYS = new Set(['id', 'type', 'source', 'spec', 'k', 'icon', 'kind', 'min', 'hl', 'bad', 'frame', 'perGap']);
const TABLE_TYPES = new Set(['conj', 'verbs', 'reflist']);
function strings(v, p, inTable, out) {
  if (typeof v === 'string') { out.push({ p, s: v, table: inTable }); return; }
  if (Array.isArray(v)) { v.forEach((x, i) => { if (/\.ok$/.test(p) && i > 0) return; strings(x, p + '[' + i + ']', inTable, out); }); return; } // hidden accepted alternatives are grading data, not shown text
  if (v && typeof v === 'object') { const t = inTable || TABLE_TYPES.has(v.type); for (const [k, x] of Object.entries(v)) if (!SKIP_KEYS.has(k)) strings(x, p + '.' + k, t, out); }
}
const files = fs.readdirSync(path.join(dir, 'chapters')).filter(f => /^k\d+\.json$/.test(f)).map(f => [f.slice(1, -5), path.join(dir, 'chapters', f)])
  .filter(([id]) => !only.length || only.includes(id)).sort((a, b) => a[0] - b[0]);
let textHits = 0, tableHits = 0, waived = 0;
for (const [id, f] of files) {
  const out = []; strings(JSON.parse(fs.readFileSync(f, 'utf8')), '', false, out);
  const seen = new Set(), okHits = new Set((waivers[id] || []).map(w => w.hit));
  for (const { p, s, table } of out) {
    const w = words(s.replace(/\{[ndaevtp]:/g, ' ').replace(/[[\]()|^}*]/g, ' '));
    let i = 0;
    while (i + N <= w.length) {
      if (book.has(w.slice(i, i + N).join(' '))) { let j = i + N; while (j < w.length && book.has(w.slice(j - N + 1, j + 1).join(' '))) j++;
        const hit = w.slice(i, j).join(' '), key = hit + '|' + table;
        if (!seen.has(key)) { seen.add(key);
          if (!table && okHits.has(hit)) waived++;
          else { console.log((table ? 'table ' : 'TEXT  ') + id + ' ' + p + ': ' + hit); table ? tableHits++ : textHits++; } }
        i = j; }
      else i++;
    }
  }
}
console.log(`${files.length} lessons checked with ${N}-word sequences: ${textHits} text hit(s) to rewrite, ${tableHits} table hit(s) to review${waived ? `, ${waived} waived form list(s)` : ''}.`);
process.exitCode = textHits ? 1 : 0;
