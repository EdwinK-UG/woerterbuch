/* "Mit Liv sprechen" – the grammar speaking trainer (docs/speak-trainer.md). Liv stands in Meister Anton's workshop
   and talks with the learner about one chapter's grammar: she asks, the learner answers aloud (or types), Liv reacts,
   recasts a mistake gently and asks the next question. Her words come from Claude and her voice from ElevenLabs,
   both through the Worker (/speak/turn); this page never sees a key. Only the founder and people with one of the
   founder's access codes can use it (the Worker checks every turn).
   ?ch=5 the chapter (internal id). ?local: a pretend Liv for checking the page offline; ?local&live: the real Worker. */
// (stage.js?v=7: the version that takes lines directly; browsers may still hold the pilots' v=6)
import { createStage, $, LOCAL, EMBED } from '../buehne/stage.js?v=7';
import { createWerkstatt } from '../buehne/sets/werkstatt.js?v=6';

const qs = new URLSearchParams(location.search);
const CHAPTER = /^\d{1,4}$/.test(qs.get('ch') || '') ? qs.get('ch') : '5';
const MOCK = LOCAL && !qs.has('live');
const MAX_SECONDS = 20;

const set = createWerkstatt($('bg'), $('fg'));
const B = createStage({ set, priv: '', tag: 'speak', keys: ['liv'], minW: 3.0 });
const { A, S, place, trig, face, cam, say, need } = B;
S.zoom = false;                     // the camera stays still while Liv talks

/* ---------- the conversation ---------- */
let history = [], n = 0, busy = false, done = false, rec = null, urls = [];
const status = (t) => { $('state').textContent = t; };
function ui(mode) {                 // ready | listen | think | speak | end
  const mic = $('mic');
  mic.disabled = !['ready', 'listen'].includes(mode); mic.classList.toggle('rec', mode === 'listen');
  mic.setAttribute('aria-label', mode === 'listen' ? 'Fertig – senden' : 'Tippen und sprechen');
  $('panel').classList.toggle('busy', mode === 'think' || mode === 'speak');
  $('again').hidden = mode !== 'end'; $('microw').hidden = mode === 'end'; $('typeit').hidden = mode === 'end';
  if (mode === 'end') $('say').classList.remove('on');
  status({ ready: 'Tippen und sprechen', listen: 'Ich höre zu … tippen zum Senden', think: 'Liv überlegt …', speak: '', end: '' }[mode]);
}
function you(text) { $('you').innerHTML = text ? `<span>Du</span> „${esc(text)}“` : ''; }
function note(fix, why) {
  $('note').innerHTML = fix ? `<b>Besser:</b> ${esc(fix)}${why ? `<small>${esc(why)}</small>` : ''}` : '';
  $('note').classList.toggle('on', !!fix);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const blobOf = (b64) => new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'audio/mpeg' });

async function token() {
  try { return EMBED && parent.ACCT && parent.ACCT.token ? await parent.ACCT.token() : null; } catch (e) { return null; }
}
async function ask(input) {
  if (MOCK) return pretend(input);
  const t = await token(); if (!t) throw Object.assign(new Error('Bitte melde dich an.'), { status: 401 });
  const fd = new FormData(); fd.append('chapter', CHAPTER); fd.append('history', JSON.stringify(history.slice(-16)));
  if (input.text) fd.append('text', input.text);
  if (input.audio) fd.append('audio', input.audio, 'answer');
  const base = (window.APP_CONFIG && APP_CONFIG.workerUrl) || (parent.APP_CONFIG && parent.APP_CONFIG.workerUrl) || '';
  const r = await fetch(base + '/speak/turn', { method: 'POST', headers: { Authorization: 'Bearer ' + t }, body: fd, signal: AbortSignal.timeout(45000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'Keine Verbindung. Versuch es noch einmal.'), { status: r.status, data: d });
  return d;
}
// ?local: a pretend Liv, so the page can be checked without the Worker (no network, no costs)
const PRETEND = ['Hallo! Ich bin Liv. Kannst du schwimmen?', 'Toll! Was musst du morgen machen?', 'Oh, viel Arbeit! Und was möchtest du am Wochenende machen?', 'Schön! Tschüss – du sprichst schon super mit Modalverben!'];
async function pretend(input) {
  await new Promise((r) => setTimeout(r, 900));
  const k = history.filter((m) => m.r === 'liv').length, heard = input.text || (input.audio ? 'Ich kann schwimmen gut.' : '');
  const wrong = /schwimmen gut/i.test(heard);
  return { heard, say: PRETEND[Math.min(k, 3)], verdict: !heard ? 'none' : wrong ? 'fix' : 'good', fix: wrong ? 'Ich kann gut schwimmen.' : '', why: wrong ? 'The second verb goes to the end.' : '', done: k >= 3, audio: null, left: 37 };
}

async function turn(input = {}) {
  if (busy || done) return; busy = true; ui('think'); note('');
  if (input.text) you(input.text);
  face(A.liv, 'happy'); const thinking = setTimeout(() => trig(A.liv, 'think'), 600);
  let res;
  try { res = await ask(input); }
  catch (e) {
    clearTimeout(thinking); busy = false; face(A.liv, 'sad'); setTimeout(() => face(A.liv, 'happy'), 1600); ui('ready');
    status(e.status === 401 ? 'Bitte melde dich wieder an.' : e.data && e.data.soon ? 'Einen Moment, bitte …' : e.status ? e.message : 'Keine Verbindung. Versuch es noch einmal.');
    if (e.status === 429 && e.data && e.data.left === 0) { $('mic').disabled = true; $('say').classList.remove('on'); }
    return;
  }
  clearTimeout(thinking);
  if (res.retry) { busy = false; face(A.liv, 'sad'); setTimeout(() => face(A.liv, 'happy'), 1600); ui('ready'); status('Ich habe nichts gehört. Noch einmal, bitte!'); return; }
  if (res.heard) { you(res.heard); history.push({ r: 'you', t: res.heard }); }
  if (res.verdict === 'fix' && res.fix) note(res.fix, res.why);
  else if (res.verdict === 'good') { trig(A.liv, 'cheer'); face(A.liv, 'laugh'); }
  history.push({ r: 'liv', t: res.say });
  const id = 't' + (++n); S.lines.lines[id] = { who: 'liv', text: res.say };
  for (const u of urls.splice(0)) URL.revokeObjectURL(u);
  if (res.audio) { const u = URL.createObjectURL(blobOf(res.audio)); urls.push(u); S.audio.set(id, u); }
  ui('speak');
  try { await say(id); } catch (e) { /* stopped */ }
  face(A.liv, 'happy'); busy = false; done = !!res.done;
  if (done) { ui('end'); trig(A.liv, 'wave'); return; }
  ui('ready');
  if (res.left != null && res.left <= 5) status(res.left ? `Tippen und sprechen · noch ${res.left} heute` : 'Für heute ist genug gesprochen. Bis morgen!');
  if (res.left === 0) $('mic').disabled = true;
}

/* ---------- the microphone: tap to talk, tap again to send (at most 20 seconds) ---------- */
async function startRec() {
  if (!navigator.mediaDevices || !window.MediaRecorder) { typing(true); status('Hier gibt es kein Mikrofon – schreib deine Antwort.'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } }); }
  catch (e) { typing(true); status('Das Mikrofon ist nicht erlaubt – schreib deine Antwort.'); return; }
  const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  const mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 24000 } : undefined), chunks = [];
  mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const ended = new Promise((ok) => { mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); ok(new Blob(chunks, { type: (mr.mimeType || type || 'audio/webm').split(';')[0] })); }; });
  mr.start(250); rec = { mr, ended, t0: performance.now(), timer: setTimeout(stopRec, MAX_SECONDS * 1000) };
  B.stopAudio(); ui('listen'); face(A.liv, 'happy');
}
async function stopRec() {
  if (!rec) return; const r = rec; rec = null; clearTimeout(r.timer);
  if (r.mr.state !== 'inactive') r.mr.stop();
  const blob = await r.ended;
  if (performance.now() - r.t0 < 700 || blob.size < 1000) { ui('ready'); status('Zu kurz – tippe, sprich und tippe dann noch einmal.'); return; }
  turn({ audio: blob });
}
$('mic').onclick = () => (rec ? stopRec() : startRec());
function typing(on) { $('say').classList.toggle('on', on); if (on) $('inp').focus({ preventScroll: true }); }
$('typeit').onclick = () => typing(!$('say').classList.contains('on'));
$('say').onsubmit = (e) => { e.preventDefault(); const v = $('inp').value.trim(); if (!v || busy || done) return; $('inp').value = ''; turn({ text: v.slice(0, 300) }); };
$('again').onclick = () => { history = []; done = false; you(''); note(''); $('cap').innerHTML = ''; turn({}); };

/* ---------- start ---------- */
async function begin() {
  busy = true;                      // nothing can be sent before Liv's first question
  await need('liv'); B.cast('liv'); place(A.liv, 1.3, { left: true }); cam(1.3, 2.1, 0.001, 0.3);   // Liv in the middle, from the knees up on a phone
  face(A.liv, 'happy'); trig(A.liv, 'wave'); busy = false; turn({});
}
B.start({ scenes: [], practise: begin, lines: { lines: {} } });
if (EMBED) {                        // the chapter page: the frame's ✕ and full screen go through the lesson page
  addEventListener('pagehide', () => { if (rec) { rec.mr.stop(); rec = null; } });
}
window.__sprechen = { S, A, history: () => history, turn };     // for checks
