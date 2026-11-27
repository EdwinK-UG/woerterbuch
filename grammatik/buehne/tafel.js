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
     { pic: 'leute', icon: 'kann' }                                             a picture from bilder.js
     { cards: [{ pic, icon, t, at }] }        small picture cards with a caption, appearing when said (an icon alone
                                              is drawn large: the meanings of the modal verbs)
     { morph: [{ t, at, to, toAt, fx, stamp, twin, twinAt }] }   words that change when said (since k482 also fx 'fold':
                                              it folds up like a paper fan and unfolds as the new word): fx 'shave' (the first
                                              {e:…} part curls off as a wood shaving), 'stamp' (a stamp with the text
                                              `stamp` comes down, then the word flips), 'flip', 'grow' (the new {e:…}
                                              parts come in as ghost letters); `twin`: a mirror copy with that label
     { drawers: [{ t, at, open, c, items: [text | { t, at }] }] }   a cabinet of labelled drawers: each appears at
                                              `at`, slides open at `open` and shows its items
     { timeline: { now, marks: [{ x, t, at, flag }], notes: [{ x, t, at, row }], arcs: [{ from, to, t, at }] } }
                                              (since k439) a time line: x from 0 (left, the past) to 1 (right, the
                                              future); a bright point at `now`; marks under the line (a flag ⚑),
                                              notes above it (row 0 or 1), curved arrows from `from` to `to` */
import { $, rich, plain, REDUCED, isNarrator } from './stage.js';
import { createStrip, wheel } from './satzband.js';
import { BILDER, ICONS } from './bilder.js';
import { picture as bakedPic, icon as bakedIcon } from './baked.js';   // the baked images (as the apps draw them); live drawing until loaded
import { play } from './sfx.js';
import { bestSpot, margin, reach, fitScale } from './platz.js?v=9';

export function createTafel(B, { cases = false, bubble = null } = {}) {
  const el = document.createElement('div'); el.className = 'tafel'; el.setAttribute('aria-live', 'polite'); $('stage').append(el);
  let steps = [], pics = [], open = null, spot = null, spotT = 0, pos = null, early = false;
  let fk = 1, out = null, outT = 0, outWH = '';                // the fit: its scale, and how far its contents reach out of it
  // something to see: a title, a strip, wheels, a picture, or an item that is already showing
  const seen = () => !!el.querySelector('.tf-title, .tf-item > div:not(.tf-drawer), .tf-wheel, .tf-pic, tr:not(.wait), .tf-chip:not(.wait), .tf-card:not(.wait), .tf-mo:not(.wait), .tf-drawer:not(.wait)');
  // (shown from its first placed frame: until then its transform is still the last board's place)
  const reveal = () => { early = false; spot = null; pos = null; el.style.visibility = 'hidden'; el.classList.add('on'); if (!REDUCED) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' }); };

  function hide() { open = null; steps = []; pics = []; spot = null; pos = null; early = false; fk = 1; out = null; el.style.transform = ''; el.classList.remove('on'); el.replaceChildren(); }
  function show(id, board) {
    hide(); open = id; if (bubble) bubble.hide();
    const text = plain((B.S.lines.lines[id] || {}).text || ''), len = Math.max(1, text.length);
    let from = 0;
    // a word's time: searched after the previous step's word; a word said only earlier counts at its first place
    const when = (at) => { if (at == null) return 0; if (typeof at === 'number') return at; let i = text.indexOf(at, from); if (i < 0) { i = text.indexOf(at); if (i < 0) return 0; return Math.max(0, i / len - 0.02); } from = i; return Math.max(0, i / len - 0.02); };
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
          if (r.at != null) { tr.classList.add('wait'); steps.push({ k: when(r.at), go: () => { tr.classList.remove('wait'); tr.classList.add('now'); play.tick(); later(1.2, () => tr.classList.remove('now')); } }); }
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
      } else if (it.morph) {
        row.classList.add('tf-morphs');
        for (const m of it.morph) {
          const box = document.createElement('span'); box.className = 'tf-mo';
          const word = document.createElement('span'); word.className = 'tf-mw'; word.innerHTML = rich(m.t); box.append(word);
          let twin = null;
          if (m.twin) { twin = document.createElement('span'); twin.className = 'tf-twin wait'; twin.innerHTML = `${rich(m.t)}<small>${rich(m.twin)}</small>`; box.append(twin); }
          row.append(box);
          if (m.at != null) { box.classList.add('wait'); steps.push({ k: when(m.at), go: () => { box.classList.remove('wait'); play.pop(1.3); } }); }
          if (twin) steps.push({ k: when(m.twinAt ?? m.at), go: () => { twin.classList.remove('wait'); play.tick(); } });
          if (m.to != null) steps.push({ k: when(m.toAt), go: () => morphWord(word, m, twin) });
        }
      } else if (it.drawers) {
        row.classList.add('tf-drawers');
        for (const dr of it.drawers) {
          const box = document.createElement('div'); box.className = 'tf-drawer' + (dr.c ? ' cs-' + dr.c : '');
          box.innerHTML = `<div class="tf-dfront"><b>${rich(dr.t)}</b><i></i></div><div class="tf-dbody"></div>`; row.append(box);
          const body = box.querySelector('.tf-dbody');
          for (const x of dr.items || []) {
            const o = typeof x === 'string' ? { t: x } : x, li = document.createElement('div'); li.className = 'tf-ditem'; li.innerHTML = rich(o.t); body.append(li);
            if (o.at != null) { li.classList.add('wait'); steps.push({ k: when(o.at), go: () => { li.classList.remove('wait'); play.tick(); } }); }
          }
          if (dr.at != null) { box.classList.add('wait'); steps.push({ k: when(dr.at), go: () => { box.classList.remove('wait'); play.pop(1.2); } }); }
          if (dr.open != null) steps.push({ k: when(dr.open), go: () => { box.classList.add('open'); play.roll(); } }); else if (dr.items && dr.items.length) box.classList.add('open');
        }
      } else if (it.timeline) {
        // as wide as the board can be in this picture (its padding and frame take about 40 px), at most 300 / 540 px
        const tl = it.timeline, small = B.set.V.W < 520, W = Math.min(small ? 300 : 540, Math.max(200, Math.floor(B.set.V.W * 0.92 - 40))), H = (tl.notes || []).some((n) => n.row) ? (small ? 118 : 132) : (small ? 92 : 104), ly = H - 30;
        const box = document.createElement('div'); box.className = 'tf-tl'; box.style.width = W + 'px'; box.style.height = H + 'px'; row.append(box);
        const pc = (x) => (100 * Math.max(0, Math.min(1, x))).toFixed(1) + '%', now = tl.now;
        const line = document.createElement('i'); line.className = 'tf-tl-line'; line.style.top = ly + 'px';
        if (now != null) line.style.background = `linear-gradient(90deg, rgba(176,124,66,.12), #b07c42 ${pc(now - 0.22)}, #f2c94c ${pc(now - 0.01)}, #fffbe6 ${pc(now)}, #cdebff ${pc(now + 0.02)}, rgba(205,235,255,.12))`;
        box.append(line);
        if (now != null) { const d = document.createElement('i'); d.className = 'tf-tl-now'; d.style.left = pc(now); d.style.top = ly + 'px'; box.append(d); }
        const later = (el, at, sound) => { if (at == null) return; el.classList.add('wait'); steps.push({ k: when(at), go: () => { el.classList.remove('wait'); sound(); } }); };
        for (const mk of tl.marks || []) {
          const el = document.createElement('span'); el.className = 'tf-tl-mark' + (mk.flag ? ' flag' : ''); el.style.left = pc(mk.x); el.style.top = ly + 'px'; el.innerHTML = `<b>${rich(mk.t)}</b>`; box.append(el);
          later(el, mk.at, () => play.pop(1.2));
        }
        for (const nt of tl.notes || []) {
          const el = document.createElement('span'); el.className = 'tf-chip tf-tl-note'; el.innerHTML = rich(nt.t);
          el.style.left = pc(nt.x); el.style.bottom = (H - ly + 12 + (nt.row ? (small ? 28 : 32) : 0)) + 'px'; el.style.transform = `translateX(-${pc(Math.min(0.92, Math.max(0.08, nt.x)))})`; box.append(el);
          later(el, nt.at, () => play.pop(1.4));
        }
        for (const a of tl.arcs || []) {
          const x0 = a.from * W, x1 = a.to * W, top = ly - (small ? 52 : 62), d = `M${x0.toFixed(1)} ${ly - 6} Q${((x0 + x1) / 2).toFixed(1)} ${top} ${x1.toFixed(1)} ${ly - 6}`;
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'tf-tl-arc'); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
          const dir = Math.sign(x1 - x0) || 1, ah = `M${(x1 - dir * 12).toFixed(1)} ${ly - 18} L${x1.toFixed(1)} ${ly - 5} L${(x1 + dir * 3).toFixed(1)} ${ly - 21}`;
          svg.innerHTML = `<path class="tf-tl-curve" d="${d}" pathLength="100"/><path class="tf-tl-head" d="${ah}"/>`; box.append(svg);
          let lab = null; if (a.t) { lab = document.createElement('span'); lab.className = 'tf-tl-arclab'; lab.style.left = pc((a.from + a.to) / 2); lab.style.top = (top + (ly - top) * 0.25 - 14) + 'px'; lab.innerHTML = rich(a.t); box.append(lab); }
          if (a.at != null) { svg.classList.add('wait'); if (lab) lab.classList.add('wait'); steps.push({ k: when(a.at), go: () => { svg.classList.remove('wait'); svg.classList.add('draw'); if (lab) lab.classList.remove('wait'); play.roll(); } }); }
        }
      } else if (it.cards) {
        row.classList.add('tf-cards');
        for (const cd of it.cards) {
          const f = document.createElement('figure'); f.className = 'tf-card' + (cd.pic ? '' : ' ic'); const cv = document.createElement('canvas');
          f.append(cv); if (cd.t) { const cap = document.createElement('figcaption'); cap.innerHTML = rich(cd.t); f.append(cap); } row.append(f);
          pics.push({ cv, pic: cd.pic, icon: cd.icon, t0: B.S.t, small: true });
          if (cd.at != null) { f.classList.add('wait'); steps.push({ k: when(cd.at), go: () => { f.classList.remove('wait'); play.pop(1.2); } }); }
        }
      }
    }
    steps.sort((a, b) => a.k - b.k);
    // a board without a title whose items all wait for their words opens with the first of them (never an empty board)
    if (seen()) reveal(); else early = true;
  }
  // the board's timed changes run on the scene clock: they wait while the film is paused, and a jump cancels them
  const later = (sec, fn) => B.wait(sec).then(fn, () => {});
  // a word on the board turns into another (see { morph } above)
  function morphWord(word, m, twin) {
    const swap = () => { word.innerHTML = rich(m.to); };
    if (REDUCED) { swap(); if (twin) twin.classList.add('gone'); return; }
    if (m.fx === 'shave') {
      const cut = word.querySelector('.cs.e'); play.slip && play.slip();
      const plane = document.createElement('i'); plane.className = 'tf-plane'; word.append(plane);
      if (cut) { cut.classList.add('tf-shaving'); later(0.9, swap); } else later(0.5, swap);
      return;
    }
    if (m.fx === 'stamp') {
      const st = document.createElement('i'); st.className = 'tf-stamp'; st.textContent = plain(m.stamp || '='); word.parentNode.append(st); play.click();
      later(0.65, () => { word.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(90deg)' }], { duration: 200 }); });
      later(0.85, () => { swap(); word.classList.add('lit'); if (twin) twin.classList.add('gone'); word.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }], { duration: 220 }); });
      later(1.5, () => st.classList.add('gone'));
      return;
    }
    if (m.fx === 'cork') {                // the {e:…} part pops off like a cork (since k439)
      const cut = word.querySelector('.cs.e'); play.pop(0.8);
      if (cut) { cut.classList.add('tf-cork'); later(0.8, swap); } else later(0.4, swap);
      return;
    }
    if (m.fx === 'fold') {                // (since k482) the word folds up like a paper fan, gold sparkles, it unfolds as the new one
      play.slip();
      word.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(.06)' }], { duration: 420, easing: 'ease-in', fill: 'forwards' });
      const sp = document.createElement('i'); sp.className = 'tf-sparks'; word.parentNode.append(sp);
      later(0.46, () => { swap(); word.classList.add('lit'); word.animate([{ transform: 'scaleX(.06)' }, { transform: 'scaleX(1)' }], { duration: 480, easing: 'cubic-bezier(.2,1.4,.5,1)', fill: 'forwards' }); play.click(); });
      later(1.3, () => sp.remove());
      return;
    }
    if (m.fx === 'grow') { word.innerHTML = rich(m.to); word.classList.add('grow'); play.pop(1.1); return; }
    word.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(90deg)' }], { duration: 200 });
    later(0.2, () => { swap(); word.classList.add('lit'); word.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0)' }], { duration: 220 }); play.click(); });
  }
  B.sayHooks.push((who, id) => {
    const board = (B.data('boards') || {})[id];
    if (board) show(id, board); else if (!isNarrator(who)) hide();
  });
  B.resetHooks.push(hide);
  // its CSS and Web Animations (a stamp coming down, a word flipping) stop with the film too
  let held = null;
  B.onFrame.push(() => {
    if (!el.getAnimations) return;
    if (B.S.paused && !held) { held = el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running'); held.forEach((a) => a.pause()); }
    else if (!B.S.paused && held) { held.forEach((a) => { if (a.playState === 'paused') a.play(); }); held = null; }
  });
  B.onFrame.push((t) => {
    if (!open) return;
    // a top corner or the middle, whichever covers the least of the characters (re-checked as they move); the whole
    // board, with whatever sticks out of it (a wagon's label), inside the picture's margins: smaller when it is too big
    const W = B.set.V.W, H = B.set.V.H, w = el.offsetWidth, h = el.offsetHeight, m = margin(W);
    const now = performance.now();       // (real time: a paused film still settles what changed in it)
    if (el.classList.contains('on') && (!out || now - outT > 250 || outWH !== `${w}x${h}x${W}x${H}`)) { out = reach(el, fk); outT = now; outWH = `${w}x${h}x${W}x${H}`; }
    const o = out || { l: 0, t: 0, r: 0, b: 0 }; fk = fitScale(w, h, W, H, o, m);
    const ow = (w + o.l + o.r) * fk, oh = (h + o.t + o.b) * fk;
    const cands = [{ x: m, y: m }, { x: (W - ow) / 2, y: m }, { x: W - ow - m, y: m }];
    if (!spot || t - spotT > 0.5) { spot = bestSpot(cands, { w: ow, h: oh, W, H, m, busy: B.occupied(), prev: spot }); spotT = t; }
    const tgt = bestSpot([cands[spot.i]], { w: ow, h: oh, W, H, m, busy: [] });
    if (!pos) pos = { x: tgt.x, y: tgt.y }; else { pos.x += (tgt.x - pos.x) * 0.15; pos.y += (tgt.y - pos.y) * 0.15; }
    el.style.transform = `translate(${(pos.x + o.l * fk).toFixed(1)}px, ${(pos.y + o.t * fk).toFixed(1)}px)` + (fk < 0.999 ? ` scale(${fk.toFixed(3)})` : ''); el.style.visibility = '';
    // the steps follow the board's own line: the board opens before that line has started, and until then
    // progress() still describes the previous line (whose reused audio player had looked "done")
    const L = B.S.line, k = L && L.id === open ? B.progress() : 0;
    while (steps.length && steps[0].k <= k) steps.shift().go();
    if (early) { if (seen()) reveal(); else return; }
    const small = B.set.V.W < 520, pw = small ? 128 : 208, ph = pw * 0.625, dpr = Math.min(2, devicePixelRatio || 1);
    for (const p of pics) {
      // a card is smaller: four fit side by side on a phone
      const cw = p.small ? (p.pic ? (small ? 74 : 112) : (small ? 28 : 36)) : pw, ch = p.small && !p.pic ? cw : cw * 0.625;
      if (p.cv.width !== Math.round(cw * dpr)) { p.cv.width = Math.round(cw * dpr); p.cv.height = Math.round(ch * dpr); p.cv.style.width = cw + 'px'; p.cv.style.height = ch + 'px'; }
      const c = p.cv.getContext('2d');
      if (!p.pic) { c.setTransform(dpr * cw / 28, 0, 0, dpr * ch / 28, 0, 0); c.clearRect(0, 0, 28, 28); if (ICONS[p.icon] && !bakedIcon(c, p.icon, 0, 0, 28, 28)) ICONS[p.icon](c); continue; }
      c.setTransform(dpr * cw / 160, 0, 0, dpr * ch / 100, 0, 0); c.clearRect(0, 0, 160, 100);
      if (BILDER[p.pic] && !bakedPic(c, p.pic, REDUCED ? 1.5 : t - p.t0, 0, 0, 160, 100)) BILDER[p.pic](c, REDUCED ? 1.5 : t - p.t0);
      if (p.icon && ICONS[p.icon]) { c.save(); c.translate(128, 2); if (!bakedIcon(c, p.icon, 0, 0, 28, 28)) ICONS[p.icon](c); c.restore(); }
    }
  });
  return { show, hide, get open() { return open; } };
}
