/* Die Tafel: the narrator's explanation board, in the picture (the user's review: an explanation must never be only
   subtitles while the characters just stand there). When Elisa says a line that has a board in the private lines file
   (lines.boards[<line id>]), a chalkboard opens at the top of the picture and fills in step by step, in time with her
   voice: each step names a word of the line ("at"), and fires when that word is said (its place in the line ×
   the recording's progress). It stays through her following lines without a board, and closes when a character
   speaks or the scene changes.
   A board is { title?, items: [ … ] }; an item is one of
     { strip: 's2', steps: [{ at, mark: <wagon id>, label, clamp: true }] }   the sentence strip, lit up wagon by wagon
     { rows: [{ c: ['ich', 'k{e:a}nn'], at, cls }] }                            a small table; rows appear when said
     { chips: [{ t, at, c: 'n' | 'a' | 'd' | 'g' }] }                           cards in a row, appearing when said
     { wheels: [['k','ö','a','nn','nnen'], …], at: [word, …] }                  vowel wheels that turn when said
     { pic: 'leute', icon: 'kann' }                                             a picture from bilder.js */
import { $, rich, plain, REDUCED } from './stage.js';
import { createStrip, wheel } from './satzband.js';
import { BILDER, ICONS } from './bilder.js';
import { play } from './sfx.js';
import { bestSpot } from './platz.js';

export function createTafel(B, { cases = false, bubble = null } = {}) {
  const el = document.createElement('div'); el.className = 'tafel'; el.setAttribute('aria-live', 'polite'); $('stage').append(el);
  let steps = [], pics = [], open = null, spot = null, spotT = 0, pos = null;

  function hide() { open = null; steps = []; pics = []; spot = null; pos = null; el.classList.remove('on'); el.replaceChildren(); }
  function show(id, board) {
    hide(); open = id; if (bubble) bubble.hide();
    const text = plain((B.S.lines.lines[id] || {}).text || ''), len = Math.max(1, text.length);
    let from = 0;
    const when = (at) => { if (at == null) return 0; if (typeof at === 'number') return at; const i = text.indexOf(at, from); if (i < 0) return 0; from = i; return Math.max(0, i / len - 0.02); };
    if (board.title) { const h = document.createElement('div'); h.className = 'tf-title'; h.innerHTML = rich(board.title); el.append(h); }
    for (const it of board.items || []) {
      const row = document.createElement('div'); row.className = 'tf-item'; el.append(row);
      if (it.strip) {
        const box = document.createElement('div'); row.append(box); const sb = createStrip(box, { cases });
        const parts = (B.data('strips')[it.strip] || []).map(([w, r, key]) => ({ w, r, id: key || w }));
        sb.show(parts, { clamp: false });
        for (const s of it.steps || []) steps.push({ k: when(s.at), go: () => { if (s.mark) sb.highlight(s.mark, s.label); if (s.clamp) sb.setClamp(true); } });
      } else if (it.rows) {
        const t = document.createElement('table'); t.className = 'tf-rows'; row.append(t);
        for (const r of it.rows) {
          const tr = document.createElement('tr'); tr.className = r.cls || ''; tr.innerHTML = r.c.map((c) => `<td>${rich(c)}</td>`).join(''); t.append(tr);
          if (r.at != null) { tr.classList.add('wait'); steps.push({ k: when(r.at), go: () => { tr.classList.remove('wait'); tr.classList.add('now'); play.tick(); setTimeout(() => tr.classList.remove('now'), 1200); } }); }
        }
      } else if (it.chips) {
        row.classList.add('tf-chips');
        for (const ch of it.chips) {
          const c = document.createElement('span'); c.className = 'tf-chip' + (ch.c ? ' cs ' + ch.c : ''); c.innerHTML = rich(ch.t); row.append(c);
          if (ch.at != null) { c.classList.add('wait'); steps.push({ k: when(ch.at), go: () => { c.classList.remove('wait'); play.pop(1.4); } }); }
        }
      } else if (it.wheels) {
        row.classList.add('tf-wheels');
        it.wheels.forEach((w, i) => { const span = document.createElement('span'); span.className = 'tf-wheel'; row.append(span); const wh = wheel(span, w.slice(0, 4), { fromPost: w[4] }); steps.push({ k: when((it.at || [])[i]), go: () => wh.turn() }); });
      } else if (it.pic) {
        const cv = document.createElement('canvas'); cv.className = 'tf-pic'; row.append(cv); pics.push({ cv, pic: it.pic, icon: it.icon, t0: B.S.t });
      }
    }
    steps.sort((a, b) => a.k - b.k);
    el.classList.add('on'); if (!REDUCED) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
  }
  B.sayHooks.push((who, id) => {
    const board = (B.data('boards') || {})[id];
    if (board) show(id, board); else if (who !== 'elisa') hide();
  });
  B.resetHooks.push(hide);
  B.onFrame.push((t) => {
    if (!open) return;
    // a top corner or the middle, whichever covers the least of the characters (re-checked as they move)
    const W = B.set.V.W, H = B.set.V.H, w = el.offsetWidth, h = el.offsetHeight;
    const cands = [{ x: 8, y: 8 }, { x: (W - w) / 2, y: 8 }, { x: W - w - 8, y: 8 }];
    if (!spot || t - spotT > 0.5) { spot = bestSpot(cands, { w, h, W, H, busy: B.occupied(), prev: spot }); spotT = t; }
    const tgt = bestSpot([cands[spot.i]], { w, h, W, H, busy: [] });
    if (!pos) pos = { x: tgt.x, y: tgt.y }; else { pos.x += (tgt.x - pos.x) * 0.15; pos.y += (tgt.y - pos.y) * 0.15; }
    el.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`;
    const k = B.progress();
    while (steps.length && steps[0].k <= k) steps.shift().go();
    const small = B.set.V.W < 520, pw = small ? 128 : 208, ph = pw * 0.625, dpr = Math.min(2, devicePixelRatio || 1);
    for (const p of pics) {
      if (p.cv.width !== Math.round(pw * dpr)) { p.cv.width = Math.round(pw * dpr); p.cv.height = Math.round(ph * dpr); p.cv.style.width = pw + 'px'; p.cv.style.height = ph + 'px'; }
      const c = p.cv.getContext('2d'); c.setTransform(dpr * pw / 160, 0, 0, dpr * ph / 100, 0, 0); c.clearRect(0, 0, 160, 100);
      if (BILDER[p.pic]) BILDER[p.pic](c, REDUCED ? 1.5 : t - p.t0);
      if (p.icon && ICONS[p.icon]) { c.save(); c.translate(128, 2); ICONS[p.icon](c); c.restore(); }
    }
  });
  return { show, hide, get open() { return open; } };
}
