// Write the new B2–C1 lesson titles (from the private lesson data) into the table of contents in grammatik/grammatik.js.
// Lesson ids, order, groups, levels and display numbers stay as they are; public page addresses stay pinned in
// content/public-pages.json (slugs), so links keep working after the rename.
// Usage: node tools/grammar-b2c1/catalog.cjs
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-b2c1');
const file = path.join(root, 'grammatik/grammatik.js');
let s = fs.readFileSync(file, 'utf8'), changed = 0;
const ids = fs.readdirSync(path.join(dir, 'chapters')).filter(f => /^k\d+\.json$/.test(f)).map(f => +f.slice(1, -5));
for (const n of ids) {
  const c = JSON.parse(fs.readFileSync(path.join(dir, 'chapters', 'k' + n + '.json'), 'utf8'));
  const re = new RegExp('\\[' + n + ',"((?:[^"\\\\]|\\\\.)*)",');
  const m = re.exec(s); assert.ok(m, 'lesson ' + n + ' not found in the table of contents');
  const title = JSON.stringify(c.title).slice(1, -1);
  if (m[1] !== title) { s = s.slice(0, m.index) + '[' + n + ',"' + title + '",' + s.slice(m.index + m[0].length); changed++; }
}
fs.writeFileSync(file, s);
console.log('Updated ' + changed + ' of ' + ids.length + ' B2–C1 titles in the table of contents.');
