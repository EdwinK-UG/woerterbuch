// Flag word sequences shared between the private A1–B1 lesson data and the OCR text of the reference book.
// Usage: node tools/grammar-a1b1/overlap.cjs [--n=6] [chapter|P# ...]   (default: everything authored)
// Paradigm tables (grid, conj, table, verbs, reflist rows) are reported separately as "table" hits, because
// verb forms and article tables are facts. Every "text" hit must be rewritten. Prints only the shared words.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-a1b1');
const args = process.argv.slice(2), N = +(args.find(a => a.startsWith('--n='))?.slice(4) || 6), only = args.filter(a => !a.startsWith('--'));
const words = s => (String(s).toLowerCase().normalize('NFC').match(/[a-zäöüß]+/g) || []);
const book = new Set();
for (const f of fs.readdirSync(path.join(dir, 'extraction/text'))) {
  const p = +f.slice(5, 8); if (p < 11) continue;
  const w = words(fs.readFileSync(path.join(dir, 'extraction/text', f), 'utf8').replace(/-\n/g, ''));
  for (let i = 0; i + N <= w.length; i++) book.add(w.slice(i, i + N).join(' '));
}
const SKIP_KEYS = new Set(['id', 'type', 'source', 'spec', 'k', 'icon', 'kind', 'min', 'hl', 'bad', 'note']);
const TABLE_TYPES = new Set(['grid', 'conj', 'table', 'verbs', 'reflist']);
function strings(v, p, inTable, out) {
  if (typeof v === 'string') { out.push({ p, s: v, table: inTable }); return; }
  if (Array.isArray(v)) { v.forEach((x, i) => { if (/\.ok$/.test(p) && i > 0) return; strings(x, p + '[' + i + ']', inTable, out); }); return; } // hidden accepted alternatives are grading data, not shown text
  if (v && typeof v === 'object') { const t = inTable || TABLE_TYPES.has(v.type); for (const [k, x] of Object.entries(v)) if (!SKIP_KEYS.has(k)) strings(x, p + '.' + k, t, out); }
}
const files = [];
for (const sub of ['chapters', 'partners']) { const d = path.join(dir, sub); if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter(f => /\.json$/.test(f))) { const id = f.replace(/\.json$/, '').replace(/^0+/, ''); if (!only.length || only.includes(id)) files.push([id, path.join(d, f)]); } }
let textHits = 0, tableHits = 0;
for (const [id, f] of files) {
  const out = []; strings(JSON.parse(fs.readFileSync(f, 'utf8')), '', false, out);
  const seen = new Set();
  for (const { p, s, table } of out) {
    const w = words(s.replace(/\{[ndaevtp]:/g, ' ').replace(/[[\]()|^}]/g, ' '));
    let i = 0;
    while (i + N <= w.length) {
      if (book.has(w.slice(i, i + N).join(' '))) { let j = i + N; while (j < w.length && book.has(w.slice(j - N + 1, j + 1).join(' '))) j++;
        const hit = w.slice(i, j).join(' '), key = hit + '|' + table; if (!seen.has(key)) { seen.add(key); console.log((table ? 'table ' : 'TEXT  ') + id + ' ' + p + ': ' + hit); table ? tableHits++ : textHits++; } i = j; }
      else i++;
    }
  }
}
console.log(`${files.length} files checked with ${N}-word sequences: ${textHits} text hit(s) to rewrite, ${tableHits} table hit(s) to review.`);
process.exitCode = textHits ? 1 : 0;
