'use strict';
// The animated grammar scenes on the shared stage (grammatik/buehne/): public files hold no lesson text, every scene's
// private lines file is complete, and the recorder never packs Max/Mia/Finn without a chosen voice.
const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..'), PRIV = path.join(ROOT, '.local', 'scenes');
const PUBLIC = [path.join(ROOT, 'grammatik', 'buehne'), path.join(ROOT, 'grammatik', 'klammer'), path.join(ROOT, 'grammatik', 'jagd')];
const files = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : [path.join(d, e.name)]));
const scenes = () => (fs.existsSync(PRIV) ? fs.readdirSync(PRIV).filter((d) => fs.existsSync(path.join(PRIV, d, 'lines.json'))) : []);
const plain = (s) => s.replace(/\{[a-z]+:([^}]*)\}/g, '$1');

test('public scene code holds none of the private lines, strips or practice sentences', (t) => {
  if (!scenes().length) { t.skip('no private scene files on this machine'); return; }
  const code = PUBLIC.flatMap(files).filter((f) => /\.(js|html|css)$/.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  for (const s of scenes()) {
    const d = JSON.parse(fs.readFileSync(path.join(PRIV, s, 'lines.json'), 'utf8'));
    const texts = [...Object.values(d.lines).map((l) => plain(l.text)), ...(d.practice || []).flatMap((p) => [...(p.ok || []), p.q || '', p.cue || '']).map(plain)];
    for (const tx of texts.filter((x) => x.split(' ').length >= 4)) assert.ok(!code.includes(tx), `${s}: "${tx}" is in public code`);
  }
});

test('every scene line names a known speaker and every practice item can be graded', (t) => {
  if (!scenes().length) { t.skip('no private scene files on this machine'); return; }
  const stage = fs.readFileSync(path.join(ROOT, 'grammatik', 'buehne', 'stage.js'), 'utf8');
  const known = new Set([...stage.matchAll(/^\s{2}(\w+):\s+\{ id: '/gm)].map((m) => m[1]).concat(['elisa', 'narrator', 'you', 'lamb']));
  for (const s of scenes()) {
    const d = JSON.parse(fs.readFileSync(path.join(PRIV, s, 'lines.json'), 'utf8'));
    for (const [id, l] of Object.entries(d.lines)) for (const w of l.who.split('+')) assert.ok(known.has(w), `${s}/${id}: unknown speaker ${w}`);
    for (const [i, p] of (d.practice || []).entries()) {
      const at = `${s} practice ${i + 1}`;
      if (p.kind === 'order') {
        assert.equal(p.roles.length, p.tiles.length, at + ': a role per tile');
        // the tiles, in some order, make the first accepted sentence
        assert.deepEqual([...p.tiles].map(plain).join(' ').split(' ').sort(), plain(p.ok[0]).split(' ').sort(), at + ': tiles = sentence');
        if (p.q !== 'yn') assert.equal(plain(p.ok[0]).split(' ').length > 2, true);
      } else if (p.kind === 'choice') { assert.ok(p.q.includes('___'), at + ': a gap'); assert.ok(p.right >= 0 && p.right < p.options.length, at + ': the right option exists'); }
      else if (p.kind === 'regie') { assert.equal(p.want.length, 2, at + ': who chases whom'); assert.ok(p.slots < p.tiles.length, at + ': spare tiles'); assert.ok(p.tiles.every((x) => x.v || (x.who && /^[nad?]$/.test(x.c))), at + ': every tile is the verb or a noun with its case'); assert.ok(p.tiles.some((x) => x.v), at + ': a verb'); }
      else if (p.kind === 'type') { assert.ok(p.ok.length && (!p.ask || d.lines[p.ask]), at + ': answers and its spoken question'); }
      else assert.fail(at + ': unknown kind ' + p.kind);
    }
  }
});

// a syntax error in one stage module stops every scene without a visible error (the module graph never runs)
test('every stage and scene module parses as a JavaScript module', () => {
  const os = require('node:os'), { spawnSync } = require('node:child_process'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'buehne-'));
  try {
    for (const f of PUBLIC.flatMap(files).filter((f) => f.endsWith('.js'))) {
      const copy = path.join(tmp, 'm.mjs'); fs.copyFileSync(f, copy);
      const r = spawnSync(process.execPath, ['--check', copy], { encoding: 'utf8' });
      assert.equal(r.status, 0, path.relative(ROOT, f) + ' does not parse:\n' + r.stderr.split('\n').slice(0, 4).join('\n'));
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('the panel under the picture never squeezes its parts (they would overlap); a hero frame grows for the practice', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'grammatik', 'buehne', 'stage.css'), 'utf8');
  assert.match(css, /#panel > \* \{ flex-shrink: 0; \}/);
  const stage = fs.readFileSync(path.join(__dirname, '..', 'grammatik', 'buehne', 'stage.js'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, '..', 'grammatik', 'grammatik.js'), 'utf8');
  assert.match(stage, /type: 'werkstatt-need'/);
  assert.match(page, /d\.type === 'werkstatt-need' && f\.dataset\.hero/);
});

test('short character lines are recorded with German enforced ("Super!" was read the English way)', () => {
  const A = require('../tools/scene-audio.cjs');
  assert.equal(A.isShort({ who: 'liv', text: 'Super!' }), true);
  assert.equal(A.isShort({ who: 'max', text: '… {a:das Lamm} …' }), true);
  assert.equal(A.isShort({ who: 'liv', text: 'Ich will heute schwimmen gehen.' }), false);
  assert.equal(A.isShort({ who: 'narrator', text: 'Super!' }), false);
  assert.equal(A.isShort({ who: 'max+mia', text: 'Super!' }), false);
});
