'use strict';
// The animated grammar scenes on the shared stage (grammatik/buehne/): public files hold no lesson text, every scene's
// private lines file is complete, and the recorder never packs Max/Mia/Finn without a chosen voice.
const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..'), PRIV = path.join(ROOT, '.local', 'scenes');
const PUBLIC = [path.join(ROOT, 'grammatik', 'buehne'), path.join(ROOT, 'grammatik', 'klammer'), path.join(ROOT, 'grammatik', 'jagd'), path.join(ROOT, 'grammatik', 'passiv'), path.join(ROOT, 'grammatik', 'konjunktiv'), path.join(ROOT, 'grammatik', 'futur2'), path.join(ROOT, 'grammatik', 'nominalstil')];
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
        // (since k439: with `slots` some tiles are spare; the sentence then uses tiles from the set, each once)
        const tw = [...p.tiles].map(plain).join(' ').split(' ').sort(), sw = plain(p.ok[0]).split(' ').sort();
        if (p.slots) { assert.ok(p.slots < p.tiles.length, at + ': spare tiles'); const left = [...tw]; for (const x of sw) { const i = left.indexOf(x); assert.ok(i >= 0, at + ': word ' + x + ' has a tile'); left.splice(i, 1); } }
        else assert.deepEqual(tw, sw, at + ': tiles = sentence');
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

test('the play dock reserves feedback space and keeps readable, wrapping sentence controls', () => {
  const css = fs.readFileSync(path.join(ROOT, 'grammatik/buehne/stage.css'), 'utf8');
  assert.match(css, /#panel > \* \{ flex-shrink: 0; \}/);
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) var\(--dock\)/);
  // the dock grows with long options or a two-line reason instead of overlapping (27 Nov 2026)
  assert.match(css, /grid-template-rows: minmax\(0, 1fr\) fit-content\(58%\)/); assert.match(css, /#panel\.pr #practice2 \{[^}]*align-self: safe center/);
  assert.match(css, /#panel\.pr #strip \.sb-row \{[^}]*flex-wrap: wrap/);
  // 16 px, shrinking to 80 % at most so the clamp's sentence stays on one line; tap targets keep 44 px
  assert.match(css, /#panel\.pr #strip \.sb-w \{[^}]*font-size: calc\(16px \* var\(--sbk, 1\)\);[^}]*min-height: 44px/);
  assert.match(fs.readFileSync(path.join(ROOT, 'grammatik/buehne/satzband.js'), 'utf8'), /while \(wrapped\(\) && k > 0\.8\)/);
  assert.match(css, /#panel\.pr\.finished #cap/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  const page = fs.readFileSync(path.join(ROOT, 'grammatik/grammatik.js'), 'utf8');
  assert.match(page, /d\.type === 'werkstatt-focus' && f\.dataset\.hero/);
  assert.doesNotMatch(page, /werkstatt-need/);
});

// Run the small DOM-facing modules with inert sound and a local scene clock: no Rive, audio or services.
const { JSDOM } = require('jsdom'), vm = require('node:vm');
function uiModule(file, exports, w, extra = {}) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/^import .*;$/gm, '').replace(/export /g, '');
  const context = vm.createContext({ document: w.document, window: w, localStorage: w.localStorage,
    navigator: w.navigator, screen: { width: 390, height: 844 }, innerWidth: 390, innerHeight: 844,
    $: id => w.document.getElementById(id), LANG: 'de', VERSION: 'de',
    rich: s => String(s), plain: s => String(s), esc: s => String(s), T: k => k,
    play: new Proxy({}, { get: () => () => {} }), ...extra });
  return vm.runInContext(source + ';({' + exports.join(',') + '})', context);
}
function practiceUI() {
  const dom = new JSDOM('<div id="panel"><div id="round"></div><div id="prompt"></div><div id="verdict"></div><div id="answers"></div><div id="say"><input id="inp"><button id="ok">OK</button></div><div id="score"></div></div>', { url: 'https://local.test' });
  const { createPractice } = uiModule('grammatik/buehne/practice.js', ['createPractice'], dom.window);
  const ui = createPractice({ data: () => ({}), wait: async () => {}, Abort: class extends Error {} }, { clear() {} });
  return { dom, ui, q: s => dom.window.document.querySelector(s) };
}
test('round progress counts completed tasks, preserves first-try scoring, and resets the finish', async () => {
  const { dom, ui, q } = practiceUI();
  try {
    const item = { kind: 'choice', q: '___', options: ['a', 'b', 'c'], right: 1 };
    ui.reset(); ui.prepare(item, 2); ui.setLead('instruction');
    const first = ui.ask(item); q('#answers button').click(); await Promise.resolve();
    q('#answers button:nth-child(2)').click(); await first;
    assert.equal(ui.P.score, 0); assert.equal(ui.P.asked, 1);
    assert.equal(q('#round').getAttribute('aria-valuenow'), '1');
    assert.equal(q('#round').querySelectorAll('.done').length, 1);
    ui.prepare(item, 2); const second = ui.ask(item); q('#answers button:nth-child(2)').click(); await second;
    assert.equal(ui.P.score, 1); ui.finish();
    assert.equal(q('#prompt').textContent, ''); assert.ok(q('#panel').classList.contains('finished'));
    assert.equal(q('#round').querySelectorAll('.done').length, 2);
    ui.reset(); ui.prepare(item, 2);
    assert.equal(q('#round').getAttribute('aria-valuenow'), '0');
    assert.equal(q('#round').querySelectorAll('.current').length, 1);
    assert.equal(q('#panel').classList.contains('finished'), false);
  } finally { dom.window.close(); }
});
test('editing an answer clears the previous verdict without changing the question', () => {
  const { dom, ui, q } = practiceUI();
  try {
    ui.setLead('instruction'); ui.prompt('<b>task</b>'); ui.tell('no', 'reason');
    q('#inp').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.equal(q('#verdict').textContent, ''); assert.equal(q('#prompt').textContent, 'instructiontask');
    ui.tell('no', 'reason'); q('#panel').dispatchEvent(new dom.window.Event('practice-edit'));
    assert.equal(q('#verdict').textContent, '');
  } finally { dom.window.close(); }
});
test('feedback resumes a running scene and preserves a deliberately paused one', () => {
  const dom = new JSDOM('<div id="meta"></div>', { url: 'https://local.test' });
  try {
    const { createMeinung } = uiModule('grammatik/buehne/meinung.js', ['createMeinung'], dom.window);
    const B = { S: { paused: false }, setPaused(p) { this.S.paused = p; } };
    createMeinung(B, { scene: 'fixture', versions: ['de'] });
    const q = s => dom.window.document.querySelector(s);
    q('#fbBtn').click(); assert.equal(B.S.paused, true);
    q('[data-x]').click(); assert.equal(B.S.paused, false);
    B.S.paused = true; q('#fbBtn').click(); q('.fb').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(B.S.paused, true); assert.equal(dom.window.document.activeElement, q('#fbBtn'));
  } finally { dom.window.close(); }
});
test('reduced motion keeps sentence selection and the clamp usable without animation', async () => {
  const dom = new JSDOM('<div id="strip"></div>', { url: 'https://local.test' });
  try {
    dom.window.Element.prototype.animate = () => { throw Error('animation with reduced motion'); };
    const { createStrip } = uiModule('grammatik/buehne/satzband.js', ['createStrip'], dom.window,
      { REDUCED: true, ResizeObserver: class { observe() {} }, Event: dom.window.Event });
    const root = dom.window.document.querySelector('#strip'), strip = createStrip(root);
    root.querySelector('path').getTotalLength = () => 100;
    const result = strip.tiles(['A', 'B'], { roles: ['v', 't'] });
    [...root.querySelectorAll('.sb-tile')].find(b => b.textContent === 'A').click();
    root.querySelector('.sb-tile').click(); root.querySelector('.sb-check').click();
    const order = await result; strip.settle(['A', 'B'], ['v', 't'], order); await strip.setClamp(true);
    assert.equal(root.querySelectorAll('.sb-w').length, 2); assert.ok(root.querySelector('.sb-clamp.on'));
    assert.equal(root.querySelector('.sb-row').style.getPropertyValue('--sbk'), '1');
  } finally { dom.window.close(); }
});
test('hero focus accounts for the whole sticky header and ignores removed frames', () => {
  const dom = new JSDOM('<header style="position:sticky"></header><nav class="tabs" style="position:fixed"></nav><iframe></iframe>', { url: 'https://local.test' });
  try {
    const w = dom.window, q = s => w.document.querySelector(s), frames = [], timers = [], scrolls = [];
    q('header').getBoundingClientRect = () => ({ top: 0, bottom: 113 });
    q('nav').getBoundingClientRect = () => ({ top: 731 });
    q('iframe').getBoundingClientRect = () => ({ top: 45 });
    const source = fs.readFileSync(path.join(ROOT, 'grammatik/grammatik.js'), 'utf8');
    const funcs = source.slice(source.indexOf('function topBar()'), source.indexOf('function sceneFrameMessages('));
    const context = vm.createContext({ document: w.document, getComputedStyle: w.getComputedStyle.bind(w), innerHeight: 844, scrollY: 100,
      requestAnimationFrame: f => frames.push(f), setTimeout: f => timers.push(f), scrollTo: p => scrolls.push(p) });
    const helpers = vm.runInContext(funcs + ';({topBar,bottomBar,focusHero})', context);
    assert.equal(helpers.topBar(), 113); assert.equal(helpers.bottomBar(), 113);
    helpers.focusHero(q('iframe')); while (frames.length) frames.shift()();
    assert.equal(scrolls[0].top, 26); assert.equal(scrolls[0].behavior, 'instant');
    q('iframe').remove(); timers.shift()(); assert.equal(scrolls.length, 1);
  } finally { dom.window.close(); }
});

test('short character lines are recorded with German enforced ("Super!" was read the English way)', () => {
  const A = require('../tools/scene-audio.cjs');
  assert.equal(A.isShort({ who: 'liv', text: 'Super!' }), true);
  assert.equal(A.isShort({ who: 'max', text: '… {a:das Lamm} …' }), true);
  assert.equal(A.isShort({ who: 'liv', text: 'Ich will heute schwimmen gehen.' }), false);
  assert.equal(A.isShort({ who: 'narrator', text: 'Super!' }), false);
  assert.equal(A.isShort({ who: 'max+mia', text: 'Super!' }), false);
});

test('Swahili and French versions: every text in every language, German examples marked, the Swahili duet', (t) => {
  const stage = fs.readFileSync(path.join(ROOT, 'grammatik', 'buehne', 'stage.js'), 'utf8'), meinung = fs.readFileSync(path.join(ROOT, 'grammatik', 'buehne', 'meinung.js'), 'utf8');
  assert.match(stage, /export const LANGS = \['de', 'en', 'sw', 'fr'\]/);
  for (const l of ['sw', 'fr']) { assert.match(stage, new RegExp(`\\n  ${l}: \\{ narrator:`)); assert.match(stage, new RegExp(`\\n  ${l}: \\{ on:`)); assert.match(meinung, new RegExp(`\\n  ${l}: \\{ btn:`)); assert.match(meinung, new RegExp(`\\n  ${l}: \\[\\['understand'`)); }
  const keys = (src, l) => (src.match(new RegExp(`\\n  ${l}: \\{ ([^]*?)\\},\\n`)) || [, ''])[1].match(/(?:^|, |\n +)(\w+): ['"]/g).map((k) => k.replace(/[^\w]/g, '')).sort().join();
  assert.equal(keys(stage, 'sw'), keys(stage, 'en')); assert.equal(keys(stage, 'fr'), keys(stage, 'en'));
  const { NARRATOR } = require('../tools/split-voice.cjs');
  assert.equal(NARRATOR.sw.de.role, 'narrator', 'Swahili: the German examples are spoken by the native German narrator');
  assert.ok(!NARRATOR.fr.de, 'French: one voice for both languages');
  const vs = scenes().filter((s) => /-(sw|fr)(-long)?$/.test(s));
  if (!vs.length) { t.skip('no private Swahili/French files on this machine'); return; }
  for (const s of vs) {
    const d = JSON.parse(fs.readFileSync(path.join(PRIV, s, 'lines.json'), 'utf8'));
    assert.equal(d.lang, s.split('-')[1], `${s}: lang`);
    for (const [id, l] of Object.entries(d.lines)) {
      if (l.who === 'narrator') for (const m of l.text.matchAll(/\{de:([^}]*)\}/g)) assert.ok(/\S+\s+\S+/.test(m[1]), `${s} ${id}: German comes as a phrase of two words or more ("${m[1]}")`);
      else assert.ok(!l.en, `${s} ${id}: gloss in the version's language, not English`);
    }
  }
});
test('subtitles come a sentence or clause at a time, never cutting a mark; long versions only', async () => {
  const src = fs.readFileSync(path.join(ROOT, 'grammatik', 'buehne', 'stage.js'), 'utf8');
  const body = src.slice(src.indexOf('export const esc'), src.indexOf('export function subtitleParts')) + src.slice(src.indexOf('export function subtitleParts')).split('\n}\n')[0] + '\n}';
  const { subtitleParts, plain } = new Function(body.replace(/export /g, '') + '\nreturn { subtitleParts, plain };')();
  const line = 'In English, can and dance sit right next to each other: I can dance really well. In German they split up. {v:Ich kann} stays near the front, and the dancing, {t:gut tanzen}, moves to the very end of the sentence.';
  const parts = subtitleParts(line);
  assert.ok(parts.length >= 3, parts.join(' | '));
  assert.ok(parts.every((p) => plain(p).length <= 84), parts.join(' | '));
  assert.equal(parts.join(' '), line, 'nothing is lost or reordered');
  assert.ok(parts.every((p) => (p.match(/\{/g) || []).length === (p.match(/\}/g) || []).length), 'a mark is never cut');
  assert.deepEqual(subtitleParts('Das ist z. B. ein Haus.'), ['Das ist z. B. ein Haus.'], 'an abbreviation does not end a sentence');
  assert.deepEqual(subtitleParts('Ja. Gut.'), ['Ja. Gut.'], 'short sentences share a part');
  assert.match(src, /export const LONG = true, VERSION = LANG \+ '-long'/);
  assert.ok(!/formsw|SW\[LANG\]\.length/.test(src), 'no Kurz | Lang switch');
  assert.match(src, /cc\.id = 'cc'/); assert.match(src, /localStorage\.setItem\('buehne-cc'/);
  assert.match(src, /!qs\.get\('hero'\)/, 'no language buttons inside a chapter');
});

// Player labels in the scene's language (27 Nov 2026): every language has every label, and no fixed German UI text
// is left in the player's code outside the strings table
test('player labels exist in de, en, fr and sw and the code reads them from the strings table', () => {
  const src = fs.readFileSync(path.join(ROOT, 'grammatik/buehne/stage.js'), 'utf8');
  const UI = new Function(src.slice(src.indexOf('export const UI = {'), src.indexOf('\n};\n', src.indexOf('export const UI = {')) + 3).replace('export const UI', 'const UI') + '\nreturn UI;')();
  for (const l of ['de', 'en', 'fr', 'sw']) {
    assert.deepEqual(Object.keys(UI[l]).sort(), Object.keys(UI.de).sort(), l + ': the same labels as German');
    for (const [k, v] of Object.entries(UI[l])) assert.ok(String(v).trim(), `${l}.${k} is empty`);
  }
  for (const k of ['soundOn', 'soundOff', 'sound', 'full', 'prev', 'next', 'pause', 'resume', 'close', 'scene', 'answer', 'and', 'seat', 'empty', 'putBack', 'end']) assert.ok(UI.de[k], k);
  assert.equal(UI.en.full, 'Full screen'); assert.equal(UI.fr.end, 'Fin'); assert.equal(UI.sw.play, 'Cheza pamoja');
  const code = src.slice(src.indexOf('\n};\n', src.indexOf('export const UI = {')));
  for (const de of ["'Ton an'", "'Ton aus'", "'Vollbild'", "'Schließen'", "'Weiter'", "' und '", 'Szene ${']) assert.ok(!code.includes(de), `stage.js still has ${de}`);
  const sb = fs.readFileSync(path.join(ROOT, 'grammatik/buehne/satzband.js'), 'utf8');
  for (const de of ['Platz ', 'Zurücklegen', "'Ende'", 'leer`']) assert.ok(!sb.includes(de), `satzband.js still has ${de}`);
  assert.match(src, /document\.title = title \+/, 'the tab title follows the version');
});
// The act buttons (27 Nov 2026, the owner's iPhone): one numbered button per act under the transport controls, as in
// the iOS app; on a phone a row of their own that scrolls sideways, never hidden; hidden while playing along
test('act buttons: one per act, labelled in the scene\'s language, the current one marked, a tap jumps to its act', () => {
  const src = fs.readFileSync(path.join(ROOT, 'grammatik/buehne/stage.js'), 'utf8');
  const fn = src.slice(src.indexOf('export function actButtons'), src.indexOf('\n}\n', src.indexOf('export function actButtons')) + 2);
  const esc = src.slice(src.indexOf('export const esc'), src.indexOf('\n', src.indexOf('export const esc')));
  const dom = new JSDOM('<div id="ctl"><div id="dots"></div></div>');
  const { actButtons } = new Function('document', (esc + '\n' + fn).replace(/export /g, '') + '\nreturn { actButtons };')(dom.window.document);
  const root = dom.window.document.getElementById('dots'), jumps = [];
  const acts = actButtons(root, [{ name: 'Die Werkstatt' }, { name: 'Wer <macht> was?' }, { name: 'Ende' }], { label: 'Scene', jump: (i) => jumps.push(i) });
  const bs = [...root.querySelectorAll('button')];
  assert.deepEqual(bs.map((b) => b.textContent), ['1', '2', '3']);
  assert.equal(bs[1].getAttribute('aria-label'), 'Scene 2: Wer <macht> was?', 'label: the scene word, its number and the act\'s name');
  assert.equal(root.querySelector('macht'), null, 'act names are escaped');
  assert.ok(bs.every((b) => b.type === 'button'));
  assert.equal(root.getAttribute('role'), 'group');
  acts.mark(1);
  assert.deepEqual(bs.map((b) => b.className.trim()), ['done', 'on', ''], 'the act playing is highlighted, the ones before it done');
  assert.equal(bs[1].getAttribute('aria-current'), 'step'); assert.equal(bs[0].getAttribute('aria-current'), null);
  acts.mark(3); assert.ok(bs.every((b) => b.classList.contains('done') && !b.classList.contains('on')), 'after the last act');
  bs[2].click(); bs[0].click(); assert.deepEqual(jumps, [2, 0], 'a tap jumps to the start of that act');
  assert.match(src, /actButtons\(\$\('dots'\), S\.scenes, \{ label: T\('scene'\), jump: \(i\) => watch\(i\)/, 'the player wires them to watch(act)');
  const UI = new Function(src.slice(src.indexOf('export const UI = {'), src.indexOf('\n};\n', src.indexOf('export const UI = {')) + 3).replace('export const UI', 'const UI') + '\nreturn UI;')();
  assert.deepEqual(['de', 'en', 'fr', 'sw'].map((l) => UI[l].scene), ['Szene', 'Scene', 'Scène', 'Onyesho']);
  const css = fs.readFileSync(path.join(ROOT, 'grammatik/buehne/stage.css'), 'utf8');
  assert.doesNotMatch(css, /(^|[{}]\s*)#dots \{ display: none; \}/m, 'never hidden on a phone');
  assert.match(css, /@media \(max-width: 460px\) \{[^}]*#ctl \{[^}]*flex-wrap: wrap[^}]*\}\s*#dots \{ order: 3; flex: 1 0 100%; \}/, 'a phone: a row of their own');
  assert.match(css, /#dots \{[^}]*overflow-x: auto/, 'many acts: the row scrolls sideways');
  assert.match(css, /#ctl\.pr #prev, #ctl\.pr #play, #ctl\.pr #next, #ctl\.pr #dots \{ display: none; \}/, 'hidden while playing along');
  for (const f of ['passiv', 'konjunktiv', 'futur2', 'nominalstil', 'klammer', 'jagd']) assert.match(fs.readFileSync(path.join(ROOT, 'grammatik', f, 'index.html'), 'utf8'), /<div id="ctl">[\s\S]*<div id="dots"><\/div>/, f + ': the row is on the page');
});

// The fit rule (27 Nov 2026): boards, bubbles, word props and the tape's labels keep inside the picture with a margin
test('fit rule: a margin at every edge, boxes too big are scaled down, never cut', async () => {
  const src = fs.readFileSync(path.join(ROOT, 'grammatik/buehne/platz.js'), 'utf8');
  const { bestSpot, margin, fitScale } = await import('data:text/javascript,' + encodeURIComponent(src));
  assert.equal(margin(320), 8); assert.equal(margin(390), 8); assert.ok(margin(1280) > 8);
  const W = 390, H = 600, m = margin(W);
  for (const c of [{ x: -40, y: -10 }, { x: 300, y: 500 }, { x: 0, y: 0 }]) {
    const s = bestSpot([c], { w: 200, h: 120, W, H, busy: [] });
    assert.ok(s.x >= m && s.y >= m && s.x + 200 <= W - m && s.y + 120 <= H - m, JSON.stringify(s));
  }
  assert.equal(fitScale(300, 100, W, H), 1, 'fits: full size');
  const k = fitScale(500, 100, W, H, { l: 0, t: 0, r: 20, b: 0 });
  assert.ok(Math.abs(520 * k - (W - 2 * m)) < 0.01, 'too wide (with what sticks out): exactly as wide as the picture allows');
  assert.ok(fitScale(200, 900, W, H) * 900 <= H - 2 * m + 0.01, 'too tall: as tall as it allows');
  for (const f of ['tafel.js', 'blase.js']) {
    const code = fs.readFileSync(path.join(ROOT, 'grammatik/buehne', f), 'utf8');
    assert.match(code, /fitScale\(/, f + ' scales down what does not fit'); assert.match(code, /reach\(el/, f + ' counts what sticks out of it');
  }
  const req = fs.readFileSync(path.join(ROOT, 'grammatik/buehne/requisiten.js'), 'utf8');
  assert.match(req, /function nudgeTo\(p\)/); assert.match(req, /labelShift\(/);
  assert.match(fs.readFileSync(path.join(ROOT, 'grammatik/buehne/blase.js'), 'utf8'), /scale: '\.6'/, 'the pop-in keeps the bubble in its place');
  assert.match(fs.readFileSync(path.join(ROOT, 'grammatik/buehne/stage.css'), 'utf8'), /\.tf-item > \.sb, \.bub-sb \{ min-width: 0; max-width: 100%; \}/, 'a strip on a board shrinks instead of overflowing it');
});
test('wagon labels: 1, 2 … end by default, none with spare tiles, the item\'s own seats when given', async () => {
  const dom = new JSDOM('<div id="strip"></div>', { url: 'https://local.test' });
  try {
    const { createStrip } = uiModule('grammatik/buehne/satzband.js', ['createStrip'], dom.window,
      { REDUCED: true, ResizeObserver: class { observe() {} }, Event: dom.window.Event });
    const root = dom.window.document.querySelector('#strip'), strip = createStrip(root);
    const seats = () => [...root.querySelectorAll('.sb-seat')].map((s) => s.textContent);
    strip.tiles(['A', 'B', 'C', 'D']); assert.deepEqual(seats(), ['1', '2', '', 'end']);
    assert.equal(root.querySelector('.sb-w').getAttribute('aria-label'), 'seat 1, empty');
    strip.tiles(['A', 'B', 'C', 'D'], { slots: 3, seats: [] }); assert.deepEqual(seats(), ['', '', '']);
    strip.tiles(['A', 'B', 'C'], { seats: ['x', '', 'z'] }); assert.deepEqual(seats(), ['x', '', 'z']);
  } finally { dom.window.close(); }
  const pr = fs.readFileSync(path.join(ROOT, 'grammatik/buehne/practice.js'), 'utf8');
  assert.match(pr, /item\.seats \|\| \(item\.slots && item\.slots < item\.tiles\.length \? \[\] : undefined\)/);
});
test('practice: a typed answer waits for the reaction; the last wrong choice is staged before the solution', async () => {
  const dom = new JSDOM('<div id="panel"><div id="round"></div><div id="prompt"></div><div id="verdict"></div><div id="answers"></div><div id="say"><input id="inp"><button id="ok">OK</button></div><div id="score"></div></div>', { url: 'https://local.test' });
  try {
    const { createPractice } = uiModule('grammatik/buehne/practice.js', ['createPractice'], dom.window);
    let release, misses = [];
    const hooks = { miss: (item, tries, info) => { misses.push([tries, info && info.pick, dom.window.document.querySelector('#verdict').textContent]); return new Promise((r) => { release = r; }); } };
    const ui = createPractice({ data: () => ({}), wait: async () => {}, Abort: class extends Error {} }, { clear() {} }, hooks);
    const q = (s) => dom.window.document.querySelector(s), tick = () => new Promise((r) => setTimeout(r, 0));
    // type: a wrong answer locks the field until the reaction is over; a fast retry does nothing
    const typed = ui.ask({ kind: 'type', q: 'x', ok: ['Das ist gut'], end: '.' });
    q('#inp').value = 'falsch'; q('#ok').click(); await tick();
    assert.equal(misses.length, 1); assert.ok(q('#panel').classList.contains('busy')); assert.equal(q('#inp').readOnly, true);
    q('#ok').click(); q('#inp').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter' })); await tick();
    assert.equal(misses.length, 1, 'no second check while the reaction plays');
    release(); await tick();
    assert.equal(q('#panel').classList.contains('busy'), false); assert.equal(q('#inp').readOnly, false);
    q('#inp').value = 'Das ist gut'; q('#ok').click(); const r1 = await typed; assert.equal(r1.right, true); assert.equal(r1.tries, 2);
    // choice of three: the second wrong pick plays its reaction (with its reason) before "rightis"
    misses = [];
    const chosen = ui.ask({ kind: 'choice', q: '___', options: ['a', 'b', 'c'], right: 2, why: { 0: 'why a', 1: 'why b' } });
    q('#answers button').click(); await tick(); release(); await tick();
    q('#answers button:nth-child(2)').click(); await tick();
    assert.deepEqual(misses.map((m) => m.slice(0, 2)), [[1, 0], [2, 1]]);
    assert.match(misses[1][2], /why b/); assert.doesNotMatch(q('#verdict').textContent, /rightis/);
    release(); const r2 = await chosen;
    assert.equal(r2.right, false); assert.match(q('#verdict').textContent, /rightis/);
  } finally { dom.window.close(); }
});
