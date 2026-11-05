/* Deutschklinik – "Watch": turns a grammar lesson into a narrated, animated explainer. PROTOTYPE.
   1) script(chapter)  – pure function: lesson → scenes with narration text (no DOM; usable in Node for audio/video export)
   2) open(chapter, {art, onExercises}) – plays the scenes in a full-screen player: animated sentences, highlighted
      parts, subtitles and a German voice (browser speech for now; swap in recorded audio later).
   Lesson text is trusted authored content, like on the lesson pages. */
(function (root) {
'use strict';

/* ---------- text helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plain = s => String(s == null ? '' : s).replace(/\{[a-z]:([^}]*)\}/g, '$1').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
const rich = s => String(s == null ? '' : s).replace(/\{([a-z]):([^}]*)\}/g, (m, k, t) => `<span class="w-${k}">${t}</span>`);
const spoken = s => plain(s).replace(/z\. ?B\./g, 'zum Beispiel').replace(/bzw\./g, 'beziehungsweise').replace(/u\. ?a\./g, 'unter anderem').replace(/usw\./g, 'und so weiter')
  .replace(/\s+·\s+/g, ', ').replace(/…/g, '.').replace(/\s*→\s*/g, '. ').replace(/\s+[–—]\s+/g, ', ').replace(/\(([^)]*)\)/g, ', $1, ').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/,\s*\./g, '.').replace(/\s+/g, ' ').trim();
const endP = s => (/[.!?]$/.test(s) ? s : s + '.');
// last clean-up of every narrated text: symbols a voice would read badly, and stray punctuation left by joining pieces
const tidy = s => {
  s = String(s).replace(/Ja\/Nein/g, 'Ja-Nein').replace(/\s=\s/g, ' ist ').replace(/\s\+\s/g, ' plus ').replace(/(\p{L})\/(\p{L})/gu, '$1 oder $2');
  for (let i = 0; i < 3; i++) s = s.replace(/\s+([.,;:!?])/g, '$1').replace(/([?!])[.,]/g, '$1').replace(/[.,:]([?!])/g, '$1').replace(/:\./g, '.').replace(/\.,/g, '.').replace(/,\./g, '.').replace(/\.{2,}/g, '.').replace(/,{2,}/g, ',');
  return s.replace(/\s{2,}/g, ' ').trim().replace(/[,;:]$/, '.');
};

/* ---------- 1. script: lesson → scenes ---------- */
const rowSentence = row => endP(row.map(s => plain(s[0])).join(' '));
// a row that is a sentence is read as a sentence; any other row is read column by column ("Singular: …. Plural: …")
function gridRowSay(row, head) {
  const label = plain(row[0]), cells = row.slice(1).map(plain);
  if (!cells.some(Boolean)) return label;
  if (/[.!?]$/.test(cells.filter(Boolean).pop())) return (label ? label + ': ' : '') + cells.filter(Boolean).join(' ');
  const named = head && head.slice(1).some(h => plain(h)), parts = cells.map((c, i) => c && (named && plain(head[i + 1]) ? plain(head[i + 1]) + ': ' + c : c)).filter(Boolean);
  return (label ? endP(label) + ' ' : '') + parts.map(endP).join(' ');
}
const SKIPPED = ['conj', 'table', 'machine', 'html', 'reflist', 'dialog'];   // blocks that need their own scenes later
function blockScene(b) {
  const T = plain(b.title || ''), pre = i => (i ? '' : T ? T + '. ' : '');
  const mk = (type, label, steps) => ({ type, label: label || T || 'Szene', title: T, data: b, steps });
  switch (b.type) {
    case 'slots': {
      const rows = b.rows || []; if (!rows.length) return null;
      const steps = rows.map((r, i) => ({ say: pre(i) + spoken(rowSentence(r)) }));
      if (b.note) steps.push({ say: spoken(b.note) });
      return mk('slots', T, steps);
    }
    case 'grid': {
      const rows = b.rows || []; if (!rows.length) return null;
      const steps = rows.map((r, i) => ({ say: pre(i) + spoken(gridRowSay(r, b.head)) }));
      if (b.foot) steps.push({ say: spoken(b.foot) });
      return mk('grid', T, steps);
    }
    case 'cards': {
      const items = b.items || []; if (!items.length) return null;
      const steps = items.map((c, i) => ({ say: pre(i) + [plain(c.t), c.s && plain(c.s), c.p && spoken(c.p), c.ex && spoken(c.ex), c.ws && c.ws.join(', ')].filter(Boolean).map(endP).join(' ') }));
      if (b.foot) steps.push({ say: spoken(b.foot) });
      return mk('cards', T, steps);
    }
    case 'q3': {
      const items = b.items || []; if (!items.length) return null;
      return mk('cards', T, items.map((c, i) => ({ say: pre(i) + [plain(c.q) + '?', plain(c.t), c.ex && spoken(c.ex)].filter(Boolean).map(endP).join(' ') })));
    }
    case 'verbs': {
      const items = b.items || []; if (!items.length) return null;
      const steps = [{ say: pre(0) + spoken(b.pattern || '') }].concat(items.map(v => ({ say: endP(plain(v[0]) + ': ' + spoken(v[1])) })));
      return mk('verbs', T, steps);
    }
    case 'merk': return mk('merk', 'Merksatz', [{ say: 'Merke dir: ' + spoken(b.text) }]);
    case 'note': return mk('note', T || 'Achtung', [{ say: pre(0) + spoken(b.text) }]);
    default: return null;
  }
}
function script(c) {
  const S = [];
  S.push({ type: 'title', label: 'Start', title: plain(c.title), data: { kicker: c.kicker, intro: c.intro, hero: c.hero },
    steps: [{ say: endP(plain(c.title)) + ' ' + spoken(c.kicker) }, { say: spoken(c.intro) }, { say: spoken(c.hero) }] });
  const skipped = [];
  (c.understand || []).forEach(b => { const sc = blockScene(b); if (sc) S.push(sc); else skipped.push(b.type); });
  if ((c.examples || []).length) S.push({ type: 'examples', label: 'Beispiele', title: 'Beispiele', data: { items: c.examples },
    steps: c.examples.map((e, i) => ({ say: (i ? '' : 'Beispiele. ') + spoken(e) })) });
  const merks = (c.understand || []).filter(b => b.type === 'merk');
  const outro = [];
  if (merks.length) outro.push({ say: 'Zum Schluss: ' + spoken(merks[merks.length - 1].text) });
  outro.push({ say: 'Jetzt bist du dran. Übe das Thema mit den Aufgaben.' });
  S.push({ type: 'outro', label: 'Üben', title: 'Jetzt bist du dran', data: { merk: merks.length ? merks[merks.length - 1].text : '', n: (c.exercises || []).length }, steps: outro });
  S.forEach(sc => sc.steps.forEach(st => { st.say = tidy(st.say); }));
  S.skipped = skipped;
  return S;
}
const stats = scenes => { const chars = scenes.reduce((a, s) => a + s.steps.reduce((b, t) => b + t.say.length, 0), 0); return { scenes: scenes.length, steps: scenes.reduce((a, s) => a + s.steps.length, 0), chars, minutes: Math.round(chars / 14 / 6) / 10, skipped: scenes.skipped || [] }; };

if (typeof module !== 'undefined' && module.exports) { module.exports = { script, stats, plain, spoken }; }
if (typeof document === 'undefined') return;

/* ---------- 2. player ---------- */
const reduced = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
const en = () => !(root.KONTO && KONTO.lang && KONTO.lang() === 'de');
const L = (e, d) => (en() ? e : d);
const BASE_RATE = 0.92;
let ov = null, cleanup = null;

function css() {
  if (document.getElementById('watch-css')) return;
  const s = document.createElement('style'); s.id = 'watch-css';
  s.textContent = `
.w-ov{position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:10px;background:rgba(8,11,16,.78);font-family:Inter,system-ui,sans-serif}
.w-win{width:min(1040px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--card,#fff);color:var(--fg,#20242b);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.w-win:fullscreen{width:100vw;max-width:none;border-radius:0}
.w-win>*{flex:0 0 auto}.w-win>.w-stage{flex:0 1 auto;min-height:0}
.w-top{display:flex;align-items:center;gap:.6rem;padding:.55rem .8rem;border-bottom:1px solid var(--line,#e7e2d7)}
.w-crumb{flex:1;min-width:0;display:flex;flex-direction:column}.w-crumb b{font-size:.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.w-crumb small{color:var(--mut,#6b7482);font-size:.72rem}
.w-btn{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;min-width:40px;min-height:40px;padding:0 .7rem;border:1px solid var(--line,#e7e2d7);border-radius:999px;background:var(--card,#fff);color:inherit;font:600 .8rem Inter,sans-serif;cursor:pointer}
.w-btn:hover{border-color:var(--ac,#1f6feb)}.w-btn:focus-visible{outline:3px solid var(--ac,#1f6feb);outline-offset:2px}.w-btn[aria-pressed="true"]{background:var(--ac-salt,#e9f1ff);border-color:var(--ac,#1f6feb);color:var(--ac,#1f6feb)}
.w-btn.pri{background:var(--ac,#1f6feb);border-color:var(--ac,#1f6feb);color:#fff;min-width:52px;min-height:52px;font-size:1rem}
.w-stage{position:relative;aspect-ratio:16/9;display:grid;background:var(--bg,#f6f4ef);overflow:hidden}
.w-body{padding:clamp(14px,3vw,34px);overflow:auto;display:flex;flex-direction:column;gap:1rem;width:100%;max-height:100%;margin:auto;font-family:Newsreader,Georgia,serif}.w-body>:first-child{margin-top:auto}.w-body>:last-child{margin-bottom:auto}
.w-h{font:700 clamp(1.05rem,2.4vw,1.5rem) Fraunces,Georgia,serif;margin:0;text-align:center}
.w-note{margin:0;text-align:center;font:500 clamp(.9rem,1.8vw,1.1rem)/1.5 Inter,sans-serif;color:var(--mut,#6b7482);opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s;max-width:46rem;margin-inline:auto}.w-note.on{opacity:1;transform:none}
.w-note b{color:var(--fg,#20242b)}
/* highlights – same colour code as the lessons */
.w-n,.w-d,.w-a,.w-e,.w-v,.w-t{border-radius:.35em;padding:0 .22em;font-weight:600;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.w-n{background:var(--nom-s,#fcf0d9);color:var(--nom,#b8730a);box-shadow:inset 0 -2px 0 var(--nom,#b8730a)}
.w-d{background:var(--dat-s,#f1eafe);color:var(--dat,#7c3aed);box-shadow:inset 0 -2px 0 var(--dat,#7c3aed)}
.w-a{background:var(--akk-s,#dcf3ef);color:var(--akk,#0b8579);box-shadow:inset 0 -2px 0 var(--akk,#0b8579)}
.w-e{background:var(--ac-salt,#e9f1ff);color:var(--ac,#1f6feb);box-shadow:inset 0 -2px 0 var(--ac,#1f6feb);padding:0 .1em}
.w-v{background:var(--fg,#20242b);color:var(--bg,#f6f4ef);padding:0 .3em}
.w-t{outline:1.5px dashed var(--fg,#20242b);outline-offset:-1px;padding:0 .3em}
/* title scene */
.w-ts{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(12px,3vw,32px);align-items:center}.w-ts:not(.has-art){grid-template-columns:1fr;text-align:center}
.w-eye{margin:0;font:700 .72rem Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--ac,#1f6feb)}
.w-h1{font:700 clamp(1.5rem,4.2vw,2.8rem)/1.1 Fraunces,Georgia,serif;margin:.3rem 0}
.w-kick{margin:0 0 .6rem;font:italic clamp(1rem,2.2vw,1.35rem) Newsreader,Georgia,serif;color:var(--mut,#6b7482)}
.w-intro,.w-hero{margin:.5rem 0 0;opacity:0;transform:translateY(10px);transition:opacity .6s,transform .6s}.w-intro.on,.w-hero.on{opacity:1;transform:none}
.w-intro{font:400 clamp(.92rem,1.9vw,1.2rem)/1.55 Newsreader,Georgia,serif}.w-hero{font:600 clamp(1.1rem,2.6vw,1.7rem)/1.4 Fraunces,Georgia,serif}
.w-art{margin:0}.w-art svg{width:100%;height:auto;border-radius:14px;display:block}
/* sentence chips (slots) */
.w-slots{display:flex;flex-wrap:wrap;justify-content:center;gap:clamp(6px,1.4vw,14px);min-height:5.5rem;align-items:flex-start}
.w-chip{display:flex;flex-direction:column;align-items:center;gap:.3rem;will-change:transform}
.w-chip b{display:block;padding:.45em .9em;border-radius:.7em;border:2px solid var(--line,#e7e2d7);background:var(--card,#fff);font:700 clamp(1rem,2.8vw,1.8rem) Fraunces,Georgia,serif;white-space:nowrap}
.w-chip small{font:600 .7rem Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--mut,#6b7482);min-height:1em}
.w-chip.k-v b{background:var(--fg,#20242b);color:var(--bg,#f6f4ef);border-color:var(--fg,#20242b)}
.w-chip.k-n b{background:var(--nom-s,#fcf0d9);border-color:var(--nom,#b8730a);color:var(--nom,#b8730a)}
.w-chip.k-d b{background:var(--dat-s,#f1eafe);border-color:var(--dat,#7c3aed);color:var(--dat,#7c3aed)}
.w-chip.k-a b{background:var(--akk-s,#dcf3ef);border-color:var(--akk,#0b8579);color:var(--akk,#0b8579)}
.w-chip.k-q b{background:var(--ac-salt,#e9f1ff);border-color:var(--ac,#1f6feb);color:var(--ac,#1f6feb)}
.w-chip.w-in{animation:w-in .55s cubic-bezier(.3,.9,.3,1) both}.w-chip.k-v.w-in b{animation:w-pulse 1.2s .5s 1}
@keyframes w-in{from{opacity:0;transform:translateY(18px) scale(.9)}to{opacity:1;transform:none}}
@keyframes w-pulse{50%{box-shadow:0 0 0 8px color-mix(in srgb,var(--fg,#20242b) 18%,transparent)}}
/* tables */
.w-tw{overflow:auto;max-height:100%;border:1px solid var(--line,#e7e2d7);border-radius:12px;background:var(--card,#fff)}
.w-tbl{border-collapse:collapse;width:100%;font:500 clamp(.82rem,1.7vw,1.1rem)/1.45 Newsreader,Georgia,serif}
.w-tbl th{position:sticky;top:0;background:var(--panel,#fffdf8);font:700 .72rem Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--mut,#6b7482);text-align:left;padding:.5rem .7rem;border-bottom:1px solid var(--line,#e7e2d7)}
.w-tbl td{padding:.5rem .7rem;border-bottom:1px solid var(--line2,#efeadf);transition:background .3s}.w-tbl td.l{font:700 .8rem Inter,sans-serif;color:var(--mut,#6b7482)}
.w-tbl tbody tr{opacity:0;transform:translateY(6px);transition:opacity .45s,transform .45s}.w-tbl tbody tr.on{opacity:.55;transform:none}.w-tbl tbody tr.cur{opacity:1}.w-tbl tbody tr.cur td{background:var(--ac-salt,#e9f1ff)}
/* cards */
.w-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr));gap:.7rem}
.w-card{padding:.8rem .9rem;border:2px solid var(--line,#e7e2d7);border-radius:14px;background:var(--card,#fff);opacity:0;transform:translateY(14px) scale(.97);transition:opacity .5s,transform .5s,border-color .3s}
.w-card.on{opacity:.6;transform:none}.w-card.cur{opacity:1;border-color:var(--ac,#1f6feb);box-shadow:0 8px 24px rgba(20,24,32,.1)}
.w-ct{display:block;font:700 clamp(.95rem,1.9vw,1.15rem) Fraunces,Georgia,serif;margin-bottom:.25rem}.w-card p{margin:.2rem 0;font:400 clamp(.82rem,1.6vw,1rem)/1.45 Newsreader,Georgia,serif}.w-card .w-ex{font-weight:600}
.w-card.k-n{border-left:6px solid var(--nom,#b8730a)}.w-card.k-d{border-left:6px solid var(--dat,#7c3aed)}.w-card.k-a{border-left:6px solid var(--akk,#0b8579)}.w-card.k-v{border-left:6px solid var(--fg,#20242b)}
.w-ws{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.3rem}.w-ws span{padding:.1rem .5rem;border-radius:999px;background:var(--ac-salt,#e9f1ff);color:var(--ac,#1f6feb);font:600 .85rem Inter,sans-serif}
/* merk, note, examples, outro */
.w-merk,.w-callout{max-width:42rem;margin:0 auto;padding:1.1rem 1.3rem;border-radius:16px;opacity:0;transform:scale(.96);transition:opacity .6s,transform .6s}.w-merk.on,.w-callout.on{opacity:1;transform:none}
.w-merk{background:var(--cream,#fbf4e3);border:2px solid var(--cream-b,#ecdcb8);color:var(--cream-ink,#5a4626)}
.w-merk small,.w-callout b{display:block;font:700 .72rem Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.4rem}
.w-merk p,.w-callout p{margin:0;font:600 clamp(1.05rem,2.5vw,1.55rem)/1.45 Fraunces,Georgia,serif}
.w-callout{background:var(--card,#fff);border:2px solid var(--warn,#e4860a)}.w-callout b{color:var(--warn,#e4860a)}.w-callout p{font:500 clamp(.95rem,2vw,1.25rem)/1.55 Newsreader,Georgia,serif}
.w-exs{list-style:none;margin:0;padding:0;display:grid;gap:.5rem;max-width:44rem;margin-inline:auto;width:100%}
.w-exs li{padding:.6rem .9rem;border-radius:12px;background:var(--card,#fff);border:1px solid var(--line,#e7e2d7);font:600 clamp(1rem,2.4vw,1.5rem)/1.4 Fraunces,Georgia,serif;opacity:0;transform:translateX(-14px);transition:opacity .5s,transform .5s}
.w-exs li.on{opacity:.55;transform:none}.w-exs li.cur{opacity:1;border-color:var(--ac,#1f6feb);box-shadow:0 6px 18px rgba(20,24,32,.1)}
.w-outro{display:grid;gap:1rem;justify-items:center;text-align:center}.w-outro .w-btn{min-height:46px}
/* captions + controls */
.w-cap{max-height:30vh;overflow:auto;min-height:3.4rem;padding:.7rem 1rem;text-align:center;font:500 clamp(.92rem,1.9vw,1.15rem)/1.45 Inter,sans-serif;background:var(--panel,#fffdf8);border-top:1px solid var(--line,#e7e2d7)}
.w-cap span{border-radius:.3em;padding:0 .08em;transition:background .15s}.w-cap span.hl{background:var(--ac-salt,#e9f1ff);color:var(--ac,#1f6feb)}
.w-bar{display:flex;gap:4px;padding:.45rem .8rem 0;background:var(--card,#fff)}
.w-dot{flex:1;height:8px;min-width:6px;padding:0;border:0;border-radius:6px;background:var(--line,#e7e2d7);cursor:pointer;position:relative;overflow:hidden}.w-dot i{position:absolute;inset:0;width:0;background:var(--ac,#1f6feb);transition:width .4s}
.w-dot.done i{width:100%}.w-dot:focus-visible{outline:3px solid var(--ac,#1f6feb);outline-offset:2px}
.w-ctl{display:flex;align-items:center;justify-content:center;gap:.6rem;padding:.6rem .8rem .8rem;flex-wrap:wrap}
.w-sp{display:flex;gap:.25rem}.w-sp .w-btn{min-width:46px;padding:0 .5rem}
@media(max-width:700px){.w-win>.w-stage{aspect-ratio:auto;flex:1 1 340px;min-height:0}.w-ts{grid-template-columns:1fr}.w-art svg{max-height:32vh}.w-top{flex-wrap:wrap}.w-crumb{flex-basis:100%;order:-1}.w-top .w-lab{display:none}.w-crumb small.w-lab{display:block}.w-slots{gap:5px;flex-wrap:nowrap}.w-chip b{padding:.4em .55em;font-size:clamp(.78rem,4.2vw,1.05rem)}.w-chip small{font-size:.58rem}}
@media(prefers-reduced-motion:reduce){.w-ov *{transition:none!important;animation:none!important}}`;
  document.head.appendChild(s);
}

/* ---------- speech ---------- */
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in root)) return;
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /^de[-_](DE|AT|CH)/i.test(v.lang) && /enhanced|premium|natural|anna|petra|marlene|vicki|katja|hedda|google/i.test(v.name)) || vs.find(v => /^de/i.test(v.lang)) || null;
}
if ('speechSynthesis' in root) { pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice); }
const segment = t => { const out = []; let cur = ''; (t.match(/[^.!?:]+[.!?:]*\s*/g) || [t]).forEach(p => { if (cur && (cur + p).length > 220) { out.push(cur); cur = ''; } cur += p; }); if (cur) out.push(cur); return out; };

/* ---------- scene views ---------- */
function chipEl() { const el = document.createElement('span'); el.className = 'w-chip'; el.innerHTML = '<b></b><small></small>'; return el; }
function setChip(el, s) { el.className = 'w-chip k-' + (s[1] || 'x'); el.querySelector('b').textContent = plain(s[0]); el.querySelector('small').textContent = s[2] || ''; el.dataset.k = plain(s[0]).toLowerCase(); }
// rows change in place: words that stay move to their new place (FLIP), new words fade in, old words leave
function morph(box, row) {
  const old = {}; [...box.children].forEach(el => { (old[el.dataset.k] = old[el.dataset.k] || []).push({ el, rect: el.getBoundingClientRect() }); });
  const used = new Set(), next = [], fresh = [];
  row.forEach(s => {
    const k = plain(s[0]).toLowerCase(), pool = old[k]; let el;
    if (pool && pool.length) { const o = pool.shift(); el = o.el; el._first = o.rect; used.add(el); } else { el = chipEl(); fresh.push(el); }
    setChip(el, s); next.push(el);
  });
  [...box.children].forEach(el => { if (!used.has(el)) el.remove(); });
  next.forEach(el => box.appendChild(el));
  if (reduced()) return;
  next.forEach(el => {
    if (el._first) {
      const r = el.getBoundingClientRect(), dx = el._first.left - r.left, dy = el._first.top - r.top; el._first = null;
      if (dx || dy) { el.style.transition = 'none'; el.style.transform = `translate(${dx}px,${dy}px)`; el.getBoundingClientRect(); el.style.transition = 'transform .8s cubic-bezier(.3,.8,.25,1)'; el.style.transform = ''; }
    }
  });
  fresh.forEach((el, i) => { el.style.animationDelay = (i * 0.12) + 's'; el.classList.add('w-in'); });
}
const V = {
  title(body, sc, ctx) {
    body.innerHTML = `<div class="w-ts${ctx.art ? ' has-art' : ''}"><div><p class="w-eye">${esc(ctx.eyebrow)}</p><h2 class="w-h1">${esc(sc.title)}</h2><p class="w-kick">${esc(sc.data.kicker)}</p><p class="w-intro">${rich(sc.data.intro)}</p><p class="w-hero">${rich(sc.data.hero)}</p></div>${ctx.art ? `<figure class="w-art">${ctx.art}</figure>` : ''}</div>`;
    const a = body.querySelector('.w-intro'), b = body.querySelector('.w-hero');
    return i => { a.classList.toggle('on', i >= 1); b.classList.toggle('on', i >= 2); };
  },
  slots(body, sc) {
    const b = sc.data; body.innerHTML = `<h3 class="w-h">${esc(sc.title)}</h3><div class="w-slots"></div><p class="w-note">${rich(b.note || '')}</p>`;
    const box = body.querySelector('.w-slots'), note = body.querySelector('.w-note');
    return i => { morph(box, b.rows[Math.min(i, b.rows.length - 1)]); note.classList.toggle('on', i >= b.rows.length && !!b.note); };
  },
  grid(body, sc) {
    const b = sc.data, lab = b.label !== false;
    body.innerHTML = `<h3 class="w-h">${esc(sc.title)}</h3><div class="w-tw"><table class="w-tbl">${b.head ? `<thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>` : ''}<tbody>${b.rows.map(r => `<tr>${r.map((c, k) => `<td${k === 0 && lab ? ' class="l"' : ''}>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="w-note">${rich(b.foot || '')}</p>`;
    const trs = [...body.querySelectorAll('tbody tr')], note = body.querySelector('.w-note');
    return i => { trs.forEach((tr, k) => { tr.classList.toggle('on', k <= i); tr.classList.toggle('cur', k === i); }); if (trs[i]) trs[i].scrollIntoView({ block: 'nearest' }); note.classList.toggle('on', i >= trs.length && !!b.foot); };
  },
  cards(body, sc) {
    const b = sc.data, items = b.items || [];
    body.innerHTML = `<h3 class="w-h">${esc(sc.title)}</h3><div class="w-cards">${items.map(c => `<div class="w-card k-${esc(c.k || 'ac')}"><span class="w-ct">${esc(c.t || c.q || '')}</span>${c.c ? `<p>${esc(c.c)}</p>` : ''}${c.s ? `<p>${esc(c.s)}</p>` : ''}${c.p ? `<p>${rich(c.p)}</p>` : ''}${b.type === 'q3' && c.t ? `<p>${esc(c.t)}</p>` : ''}${c.ex ? `<p class="w-ex">${rich(c.ex)}</p>` : ''}${c.ws ? `<div class="w-ws">${c.ws.map(w => `<span>${esc(w)}</span>`).join('')}</div>` : ''}</div>`).join('')}</div><p class="w-note">${rich(b.foot || '')}</p>`;
    const cs = [...body.querySelectorAll('.w-card')], note = body.querySelector('.w-note');
    return i => { cs.forEach((c, k) => { c.classList.toggle('on', k <= i); c.classList.toggle('cur', k === i); }); if (cs[i]) cs[i].scrollIntoView({ block: 'nearest' }); note.classList.toggle('on', i >= cs.length && !!b.foot); };
  },
  verbs(body, sc) {
    const b = sc.data; body.innerHTML = `<h3 class="w-h">${esc(sc.title)}</h3><p class="w-note on">${esc(b.pattern || '')}</p><div class="w-cards">${b.items.map(v => `<div class="w-card"><span class="w-ct">${esc(plain(v[0]))}</span><p class="w-ex">${rich(v[1])}</p></div>`).join('')}</div>`;
    const cs = [...body.querySelectorAll('.w-card')];
    return i => cs.forEach((c, k) => { c.classList.toggle('on', k <= i - 1); c.classList.toggle('cur', k === i - 1); });
  },
  merk(body, sc) { body.innerHTML = `<div class="w-merk"><small>${L('Key rule', 'Merksatz')}</small><p>${rich(sc.data.text)}</p></div>`; const m = body.firstChild; return () => m.classList.add('on'); },
  note(body, sc) { body.innerHTML = `<div class="w-callout"><b>${esc(sc.title || L('Watch out', 'Achtung'))}</b><p>${rich(sc.data.text)}</p></div>`; const m = body.firstChild; return () => m.classList.add('on'); },
  examples(body, sc) {
    body.innerHTML = `<h3 class="w-h">${L('Examples', 'Beispiele')}</h3><ul class="w-exs">${sc.data.items.map(e => `<li>${rich(e)}</li>`).join('')}</ul>`;
    const li = [...body.querySelectorAll('li')];
    return i => li.forEach((e, k) => { e.classList.toggle('on', k <= i); e.classList.toggle('cur', k === i); });
  },
  outro(body, sc, ctx) {
    body.innerHTML = `<div class="w-outro"><h3 class="w-h">${L('Your turn!', 'Jetzt bist du dran!')}</h3>${sc.data.merk ? `<div class="w-merk"><small>${L('Key rule', 'Merksatz')}</small><p>${rich(sc.data.merk)}</p></div>` : ''}<button class="w-btn pri" data-go>${L('Go to the exercises', 'Zu den Übungen')} (${sc.data.n})</button></div>`;
    const m = body.querySelector('.w-merk'); body.querySelector('[data-go]').onclick = () => ctx.exercises();
    if (m) m.classList.add('on');
    return () => {};
  }
};

/* ---------- the player ---------- */
const ICON = {
  play: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zM20 6v12L9.5 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16 6h2v12h-2zM4 6l10.5 6L4 18z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  sound: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
  mute: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
  full: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg>'
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

function close() { if (cleanup) cleanup(); }
function open(c, opt) {
  opt = opt || {}; close(); css();
  const scenes = script(c), info = stats(scenes);
  const st = { si: 0, step: 0, playing: false, tok: 0, speed: 1, voice: true, view: null, mounted: -1, done: false, clip: null };
  const opener = document.activeElement;
  ov = document.createElement('div'); ov.className = 'w-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', L('Video explanation: ', 'Video-Erklärung: ') + plain(c.title));
  const chNo = opt.number || c.n;
  ov.innerHTML = `<div class="w-win"><div class="w-top"><div class="w-crumb"><b>${esc(plain(c.title))}</b><small class="w-lab">${L('Chapter', 'Kapitel')} ${esc(chNo)} · ${esc(c.level || '')} · ≈ ${info.minutes} min</small></div>
    <button class="w-btn" data-a="voice" aria-pressed="true" title="${L('Voice on/off', 'Stimme an/aus')}">${ICON.sound}<span class="w-lab">${L('Voice', 'Stimme')}</span></button>
    <span class="w-sp" role="group" aria-label="${L('Speed', 'Tempo')}"><button class="w-btn" data-sp="0.8" aria-pressed="false">0.8×</button><button class="w-btn" data-sp="1" aria-pressed="true">1×</button><button class="w-btn" data-sp="1.25" aria-pressed="false">1.25×</button></span>
    <button class="w-btn" data-a="full" title="${L('Full screen', 'Vollbild')}" aria-label="${L('Full screen', 'Vollbild')}">${ICON.full}</button>
    <button class="w-btn" data-a="close" title="${L('Close (Esc)', 'Schließen (Esc)')}" aria-label="${L('Close', 'Schließen')}">${ICON.close}</button></div>
    <div class="w-stage"><div class="w-body"></div></div><div class="w-cap" aria-hidden="true"></div>
    <div class="w-bar" role="group" aria-label="${L('Scenes', 'Szenen')}">${scenes.map((s, i) => `<button class="w-dot" data-i="${i}" title="${esc(s.label)}" aria-label="${L('Scene', 'Szene')} ${i + 1}: ${esc(s.label)}"><i></i></button>`).join('')}</div>
    <div class="w-ctl"><button class="w-btn" data-a="prev" aria-label="${L('Previous scene', 'Vorige Szene')}">${ICON.prev}</button><button class="w-btn pri" data-a="play" aria-label="${L('Play', 'Abspielen')}">${ICON.play}</button><button class="w-btn" data-a="next" aria-label="${L('Next scene', 'Nächste Szene')}">${ICON.next}</button><button class="w-btn" data-a="restart" aria-label="${L('Start again', 'Von vorn')}">${ICON.replay}</button></div></div>`;
  document.body.appendChild(ov);
  const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
  const q = s => ov.querySelector(s), body = q('.w-body'), cap = q('.w-cap'), playBtn = q('[data-a=play]'), dots = [...ov.querySelectorAll('.w-dot')];
  const ctx = { art: opt.art || '', eyebrow: `${L('Chapter', 'Kapitel')} ${chNo} · ${c.group || ''} · ${c.level || ''}`, exercises: () => { close(); opt.onExercises && opt.onExercises(); } };

  let capWords = [];
  const capHTML = text => { capWords = []; let out = '', last = 0; text.replace(/\S+/g, (w, off) => { out += esc(text.slice(last, off)) + `<span>${esc(w)}</span>`; capWords.push(off); last = off + w.length; return w; }); return out; };
  const showCaption = text => { cap.innerHTML = capHTML(text); };
  const highlight = pos => { let k = 0; for (let i = 0; i < capWords.length; i++) if (capWords[i] <= pos) k = i; const sp = cap.children; for (let i = 0; i < sp.length; i++) sp[i].classList.toggle('hl', i === k); };

  function ui() {
    playBtn.innerHTML = st.playing ? ICON.pause : st.done ? ICON.replay : ICON.play;
    playBtn.setAttribute('aria-label', st.playing ? L('Pause', 'Pause') : st.done ? L('Watch again', 'Nochmal ansehen') : L('Play', 'Abspielen'));
    dots.forEach((d, i) => { d.classList.toggle('done', i < st.si); d.querySelector('i').style.width = i === st.si ? ((st.step + 1) / scenes[i].steps.length * 100) + '%' : ''; d.setAttribute('aria-current', i === st.si ? 'step' : 'false'); });
  }
  function mount(i) { st.si = i; st.mounted = i; body.scrollTop = 0; st.view = V[scenes[i].type](body, scenes[i], ctx); }
  function show() { const sc = scenes[st.si], stp = sc.steps[st.step]; if (st.mounted !== st.si) mount(st.si); st.view(st.step); showCaption(stp.say); ui(); }

  function speakSynth(text, tok) {
    return new Promise(resolve => {
      const rate = BASE_RATE * st.speed;
      if (!st.voice || !('speechSynthesis' in root)) { setTimeout(resolve, Math.max(1500, text.length * 62) / st.speed); return; }
      const segs = segment(text); let k = 0, base = 0;
      const next = () => {
        if (tok !== st.tok || k >= segs.length) return resolve();
        const seg = segs[k++], u = new SpeechSynthesisUtterance(seg), b0 = base; base += seg.length;
        u.lang = 'de-DE'; if (voice) u.voice = voice; u.rate = rate;
        u.onboundary = e => { if (tok === st.tok) highlight(b0 + e.charIndex); };
        let done = false; const fin = () => { if (done) return; done = true; clearTimeout(guard); next(); };
        u.onend = fin; u.onerror = fin; const guard = setTimeout(fin, Math.max(3000, seg.length * 140 / rate));
        (speakSynth.keep = speakSynth.keep || []).push(u); if (speakSynth.keep.length > 6) speakSynth.keep.shift();
        speechSynthesis.speak(u);
      };
      setTimeout(next, 90);
    });
  }
  // recorded narration (opt.audio.urlFor(scene, step, text) → url or null): played instead of the browser voice;
  // a missing or broken file falls back to the browser voice so the video never stalls
  function playClip(url, text, tok) {
    return new Promise(resolve => {
      const a = new Audio(url); a.preload = 'auto'; a.playbackRate = st.speed;
      let done = false; const fin = ok => { if (done) return; done = true; a.onended = a.onerror = a.ontimeupdate = null; if (st.clip && st.clip.a === a) st.clip = null; resolve(ok); };
      st.clip = { a, fin }; a.onended = () => fin(true); a.onerror = () => fin(false);
      a.ontimeupdate = () => { if (tok === st.tok && a.duration > 0) highlight(Math.floor(text.length * a.currentTime / a.duration)); };
      a.play().catch(() => fin(false));
    });
  }
  async function speakStep(text, tok) {
    const url = st.voice && opt.audio && opt.audio.urlFor(st.si, st.step, text);
    if (url && await playClip(url, text, tok)) return;
    if (tok !== st.tok) return;
    return speakSynth(text, tok);
  }
  const stopSpeech = () => { if (st.clip) { const c = st.clip; c.a.pause(); c.fin(true); } if ('speechSynthesis' in root) speechSynthesis.cancel(); };

  async function run() {
    const tok = ++st.tok; st.playing = true; st.done = false;
    while (tok === st.tok) {
      show(); await speakStep(scenes[st.si].steps[st.step].say, tok); if (tok !== st.tok) return;
      await sleep(380 / st.speed); if (tok !== st.tok) return;
      st.step++;
      if (st.step >= scenes[st.si].steps.length) {
        if (st.si >= scenes.length - 1) { st.step = scenes[st.si].steps.length - 1; st.playing = false; st.done = true; ui(); return; }
        st.si++; st.step = 0; await sleep(520 / st.speed); if (tok !== st.tok) return;
      }
    }
  }
  function pause() { st.tok++; st.playing = false; stopSpeech(); ui(); }
  function go(i) { const was = st.playing; st.tok++; stopSpeech(); st.si = Math.max(0, Math.min(scenes.length - 1, i)); st.step = 0; st.done = false; st.playing = false; show(); if (was) run(); }
  const toggle = () => { if (st.playing) pause(); else { if (st.done) { st.si = 0; st.step = 0; } run(); } };

  const onClick = e => {
    const b = e.target.closest('button'); if (!b || !ov.contains(b)) return;
    if (b.dataset.a === 'play') toggle(); else if (b.dataset.a === 'prev') go(st.si - 1); else if (b.dataset.a === 'next') go(st.si + 1);
    else if (b.dataset.a === 'restart') { st.done = false; go(0); run(); }
    else if (b.dataset.a === 'close') close();
    else if (b.dataset.a === 'voice') { st.voice = !st.voice; b.setAttribute('aria-pressed', st.voice); b.querySelector('svg').outerHTML = st.voice ? ICON.sound : ICON.mute; if (!st.voice) stopSpeech(); if (st.playing) { const t = st.step; pause(); st.step = t; run(); } }
    else if (b.dataset.a === 'full') { const w = q('.w-win'); if (document.fullscreenElement) document.exitFullscreen(); else if (w.requestFullscreen) w.requestFullscreen().catch(() => {}); }
    else if (b.dataset.sp) { st.speed = +b.dataset.sp; ov.querySelectorAll('[data-sp]').forEach(x => x.setAttribute('aria-pressed', x === b)); if (st.playing) { const t = st.step; pause(); st.step = t; run(); } }
    else if (b.dataset.i != null) go(+b.dataset.i);
  };
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { const f = [...ov.querySelectorAll('button:not([disabled])')]; if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } return; }
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if (e.key === ' ' && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') go(st.si + 1); else if (e.key === 'ArrowLeft') go(st.si - 1);
    else if (e.key === 'm' || e.key === 'M') q('[data-a=voice]').click();
  };
  ov.addEventListener('click', onClick); document.addEventListener('keydown', onKey, true);
  cleanup = () => { st.tok++; stopSpeech(); document.removeEventListener('keydown', onKey, true); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); ov.remove(); document.body.style.overflow = prevOverflow; ov = null; cleanup = null; if (opener && opener.focus) try { opener.focus(); } catch (e) {} };
  show(); playBtn.focus(); run();
  return { close, state: st, scenes };
}

root.WATCH = { script, stats, open, close, plain, spoken };
})(typeof window !== 'undefined' ? window : globalThis);
