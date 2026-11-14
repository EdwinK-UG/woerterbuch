// Submit every authored A1–B1 answer through the real lesson renderer and grader.
// Usage: node tools/grammar-a1b1/verify.cjs [n ...]   (default: every authored chapter)
// Checks per exercise group: (1) the key scores 100 %, (2) every listed alternative scores 100 %,
// (3) typical wrong answers (bad), wrong choice options, wrong orders and wrong matches are marked wrong,
// (4) strictCase groups reject a wrongly capitalised answer. Prints no lesson text.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), vm = require('node:vm'), { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..'), dir = path.join(root, '.local/grammar-a1b1');
const pad = n => String(n).padStart(3, '0');
const all = fs.readdirSync(path.join(dir, 'chapters')).filter(f => /^\d{3}\.json$/.test(f)).map(f => +f.slice(0, 3));
const wanted = process.argv.slice(2).map(Number).filter(Boolean), list = wanted.length ? wanted : all;
const engine = fs.readFileSync(path.join(root, 'grammatik/grammatik.js'), 'utf8'), art = fs.readFileSync(path.join(root, 'grammatik/illustrations.js'), 'utf8');
const swapCase = s => s.replace(/[A-Za-zÄÖÜäöüß]/, ch => ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase());
let groups = 0, rows = 0, points = 0, submissions = 0; const failures = [];

for (const n of list) {
  const authored = JSON.parse(fs.readFileSync(path.join(dir, 'chapters', pad(n) + '.json'), 'utf8'));
  const partnerDir = path.join(dir, 'partners');
  const partnerEx = fs.existsSync(partnerDir) ? fs.readdirSync(partnerDir).filter(f => /^P\d+\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(partnerDir, f)))).filter(p => p.target === n).flatMap(p => p.exercises) : [];
  const byId = Object.fromEntries([...authored.exercises, ...partnerEx].map(x => [x.id, x]));
  let lesson; vm.runInNewContext(fs.readFileSync(path.join(root, '.local/lessons/k' + n + '.js'), 'utf8'), { GRAM: { add: c => lesson = c } });
  const dom = new JSDOM('<main id="view"></main>', { url: 'https://a1b1.test/', runScripts: 'outside-only', pretendToBeVisual: true }), w = dom.window;
  try {
    w.V = () => w.document.getElementById('view'); w.matchMedia = () => ({ matches: true }); w.crypto.randomUUID = require('node:crypto').randomUUID; w.ACCT = { user: () => ({ id: 'a1b1-check' }) };
    w.eval(art); w.eval(engine);
    w.GRAM._test.render(lesson);
    for (const x of lesson.exercises) {
      const src = byId[x.id]; assert.ok(src, 'k' + n + ' ' + x.id + ' has no authored source');
      const fail = msg => failures.push('k' + n + ' ' + x.id + ': ' + msg);
      const box = () => w.document.getElementById('ue-' + x.id);
      const els = () => [...box().querySelectorAll('.gr-it')];
      const reset = () => box().querySelector('[data-act=reset]').click();
      const submit = () => { box().querySelector('[data-act=check]').click(); submissions++; const a = w.GRAM._test.attempts().at(-1); assert.equal(a?.ex, x.id); return a; };
      const buildOrder = (el, text) => { let rest = text; while (rest) { const tile = [...el.querySelectorAll('.gr-pool .gr-tile')].filter(t => rest === t.textContent || rest.startsWith(t.textContent + ' ')).sort((a, b) => b.textContent.length - a.textContent.length)[0]; if (!tile) return false; tile.click(); rest = rest.slice(tile.textContent.length).trim(); } return el.querySelector('.gr-pool').children.length === 0; };
      // mode: {k} = k-th alternative (falls back to the first); 'wrong' = a wrong answer
      const fillItem = (el, i, mode) => {
        const it = x.items[i], k = mode === 'wrong' ? 0 : mode.k;
        if (x.type === 'type') { const v = mode === 'wrong' ? src.items[i].bad[0] : mode.case ? swapCase(it.ok[0]) : (it.ok[k] ?? it.ok[0]); el.querySelector('input,textarea').value = v; }
        else if (x.type === 'select') el.querySelectorAll('input').forEach(input => { const right = it.ok.includes(it.options[+input.value]); input.checked = mode === 'wrong' ? !right : right; });
        else if (x.type === 'choice') el.querySelectorAll('.gr-gap').forEach(gap => { const btn = [...gap.querySelectorAll('button')].find(b => mode === 'wrong' ? b.textContent !== gap.dataset.ok : b.textContent === gap.dataset.ok); btn.click(); });
        else if (x.type === 'fill') el.querySelectorAll('.gr-fill').forEach(input => { const ok = JSON.parse(input.dataset.ok); input.value = mode === 'wrong' ? '§§' : mode.case ? swapCase(ok[0]) : (ok[k] ?? ok[0]); });
        else if (x.type === 'match') { const opts = x._opts, right = opts.indexOf(it.r); let pick = right; if (mode === 'wrong') { pick = opts.findIndex(r => r !== it.r); } el.querySelector('select').value = pick < 0 ? '' : String.fromCharCode(97 + pick); }
        else if (x.type === 'cases') el.querySelectorAll('.gr-tag').forEach(tag => { const seq = ['', 'n', 'd', 'a'], target = mode === 'wrong' ? seq.find(s => s && s !== tag.dataset.k) : tag.dataset.k; while (tag.dataset.st !== target) tag.click(); });
        else if (x.type === 'order') { const v = mode === 'wrong' ? [...it.tiles].reverse().join(' ') : (it.ok[k] ?? it.ok[0]); if (!buildOrder(el, v)) { if (mode !== 'wrong') fail('item ' + (i + 1) + ' cannot be built from its tiles: alternative ' + k); return false; } }
        return true;
      };
      const total = x.perGap ? x.items.reduce((s, it) => s + (it.match(x.type === 'fill' ? /\[\[/g : /\(\(/g) || []).length, 0) : x.items.length;
      // 1 + 2: key and all alternatives
      const maxAlt = Math.max(1, ...x.items.map((it, i) => x.type === 'type' || x.type === 'order' ? it.ok.length : x.type === 'fill' ? Math.max(...[...it.matchAll(/\[\[\^?([^\]]*)\]\]/g)].map(m => m[1].split('|').length)) : 1));
      for (let k = 0; k < maxAlt; k++) {
        reset(); els().forEach((el, i) => fillItem(el, i, { k }));
        const a = submit(); if (a.score !== total) fail(`alternative set ${k} scored ${a.score}/${total}`);
        if (k === 0) assert.equal(a.total, total);
      }
      // 3: wrong answers must be marked wrong (choice with one option per gap cannot be tested)
      const negative = !(x.type === 'match' && new Set(x.items.map(it => it.r)).size < 2);
      if (negative) {
        reset(); const usable = els().map((el, i) => { const it = x.items[i]; if (x.type === 'order' && it.ok.includes([...it.tiles].reverse().join(' '))) return false; return fillItem(el, i, 'wrong'); });
        submit();
        els().forEach((el, i) => { if (usable[i] && el.classList.contains('ok')) fail('item ' + (i + 1) + ' accepts a wrong answer'); });
      }
      // 4: capitalisation
      if (x.strictCase && (x.type === 'type' || x.type === 'fill')) {
        reset(); els().forEach((el, i) => fillItem(el, i, { k: 0, case: true })); submit();
        els().forEach((el, i) => { const it = x.items[i], first = x.type === 'type' ? it.ok[0] : (/\[\[\^?([^\]|]*)/.exec(it) || [])[1] || ''; if (swapCase(first) !== first && el.classList.contains('ok')) fail('item ' + (i + 1) + ' accepts wrong capitalisation'); });
      }
      groups++; rows += x.items.length; points += total;
    }
  } catch (e) { failures.push('k' + n + ': ' + (e && e.message)); } finally { dom.window.close(); }
}
if (failures.length) { console.error(failures.join('\n')); console.error(failures.length + ' failure(s).'); process.exit(1); }
console.log(`Verified ${list.length} chapters: ${groups} exercise groups, ${rows} questions, ${points} answer points, ${submissions} real submissions.`);
