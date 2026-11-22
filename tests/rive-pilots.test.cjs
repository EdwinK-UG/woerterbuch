const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync('grammatik/grammatik.js', 'utf8');

function fixture(fetcher) {
  const dom = new JSDOM('<button id="open">Animation</button>', { url: 'https://school.invalid/' });
  const w = dom.window;
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; };
  w.document.querySelector('button').focus();
  const state = { user: null, allowed: true, sends: [] };
  const ctx = vm.createContext({
    window: w, document: w.document, location: w.location,
    addEventListener: w.addEventListener.bind(w), removeEventListener: w.removeEventListener.bind(w),
    lessonEpoch: 0, acct: () => state.user, allowed: () => state.allowed,
    APP_CONFIG: { supabaseUrl: 'https://backend.invalid', supabaseKey: 'public' },
    ACCT: { token: async () => 'user-jwt' }, fetch: fetcher, AbortSignal,
  });
  w.APP_CONFIG = { openAccess: true };
  vm.runInContext(source.slice(source.indexOf('let activeRivePilot ='), source.indexOf('const filmVisual =')), ctx);
  const open = () => ctx.openRivePilot(54, ['grammatik/rive-pilots/index.html?v=1#b1', 'Präteritum']);
  return { dom, w, state, ctx, open };
}

test('pilot data goes only to its own same-origin frame; close restores the chapter', async () => {
  let sent;
  const f = fixture(async (url, options) => {
    sent = options;
    assert.equal(url, 'https://backend.invalid/functions/v1/grammar-pilots?chapter=54');
    return Response.json({ recordings: ['fixture'] });
  });
  await f.open();
  assert.equal(sent.headers.apikey, 'public');
  assert.equal(sent.headers.Authorization, undefined);
  assert.equal(sent.cache, 'no-store');
  const frame = f.w.document.querySelector('iframe');
  assert.ok(frame.src.endsWith('#b1'));
  const received = [];
  frame.contentWindow.postMessage = (...args) => received.push(args);
  const message = (origin, source, type) => f.w.dispatchEvent(new f.w.MessageEvent('message', { origin, source, data: { type } }));
  message('https://evil.invalid', frame.contentWindow, 'rive-pilot-ready');
  message(f.w.location.origin, f.w, 'rive-pilot-ready');
  assert.equal(received.length, 0);
  message(f.w.location.origin, frame.contentWindow, 'rive-pilot-ready');
  assert.equal(received.length, 1);
  assert.equal(received[0][1], f.w.location.origin);
  assert.deepEqual(received[0][0].payload, { recordings: ['fixture'] });
  message(f.w.location.origin, frame.contentWindow, 'rive-pilot-close');
  assert.equal(f.w.document.querySelector('dialog'), null);
  assert.equal(f.w.document.body.style.overflow, '');
  assert.equal(f.w.document.activeElement.id, 'open');
  f.dom.window.close();
});

test('account changes discard an in-flight pilot and its recordings', async () => {
  let finish;
  const f = fixture(() => new Promise(resolve => { finish = resolve; }));
  f.state.user = { id: 'first' };
  const loading = f.open();
  await new Promise(setImmediate);
  f.state.user = null;
  f.w.dispatchEvent(new f.w.Event('acct:out'));
  finish(Response.json({ recordings: ['private'] }));
  await loading;
  assert.equal(f.w.document.querySelector('dialog'), null);
  assert.equal(f.w.document.querySelector('iframe'), null);
  f.dom.window.close();
});

test('failed pilot loads offer retry and navigation disposes the frame', async () => {
  let succeeds = false;
  const f = fixture(async () => succeeds ? Response.json({}) : new Response('', { status: 503 }));
  await f.open();
  assert.equal(f.w.document.querySelector('iframe'), null);
  assert.match(f.w.document.body.textContent, /Erneut versuchen/);
  succeeds = true;
  [...f.w.document.querySelectorAll('button')].find(b => b.textContent === 'Erneut versuchen').click();
  await new Promise(setImmediate);
  assert.ok(f.w.document.querySelector('iframe'));
  f.w.dispatchEvent(new f.w.Event('hashchange'));
  assert.equal(f.w.document.querySelector('dialog'), null);
  f.dom.window.close();
});

test('the published player contains no authored lesson or recording bundle', () => {
  const files = fs.readdirSync('grammatik/rive-pilots');
  assert.equal(files.includes('lessons.js'), false);
  assert.equal(files.includes('recordings'), false);
  assert.equal(fs.existsSync('supabase/functions/grammar-pilots/pilots.json'), false);
  assert.match(source, /54: \{ pilot: \['grammatik\/rive-pilots\/index.html\?v=\w+#b1'/);
});
