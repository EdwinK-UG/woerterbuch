/* Das Satzband (M1) and the tiles (T): one sentence strip for every chapter about word order
   (plan §1.5). It sits below the picture as HTML, so it stays readable on a phone.
   - Wagons with seats: Position 1, the verb engine at Position 2 (dark, like the grammar pages' verb), the middle,
     and the last wagon at the end (dashed, like the grammar pages' verb part at the end).
   - The clamp: when the engine and the last wagon are both on the strip, a bracket joins them; its two jaws click
     shut. A wrong order makes the jaws slip.
   - Tile mode: empty wagons to fill. Tap a tile, it rides into the next free wagon (or the one you picked); tap a
     filled wagon to send its tile back. Keyboard: every tile and wagon is a button.
   Parts are { w: text, r: role, id }: r = 'v' engine (conjugated verb), 't' end (infinitive, verb part), 'n' subject,
   'x' anything else, 'c' a connector at seat 0. */
import { rich, plain, esc, REDUCED, T } from './stage.js';
import { play } from './sfx.js';

const EASE = 'cubic-bezier(.3,.8,.3,1)';
function seatLabel(parts, i) {
  const p = parts[i], v = parts.findIndex((q) => q.r === 'v');
  if (!p) return '';
  if (p.r === 'c') return '0';
  if (p.r === 'v') return String(i + 1 - (parts[0].r === 'c' ? 1 : 0));
  if (i === (parts[0].r === 'c' ? 1 : 0) && v !== i) return '1';
  if (p.r === 't' && i === parts.length - 1) return T('end');
  return '';
}

const CASES = { n: 'N', a: 'A', d: 'D', g: 'G' };
// cases: wagons with the roles n / a / d / g are coloured by case, with a letter (the case chapters only)
export function createStrip(root, { cases = false } = {}) {
  root.classList.add('sb'); root.classList.toggle('cases', cases);
  const badge = (r) => (cases && CASES[r] ? `<b class="sb-case">${CASES[r]}</b>` : '');
  root.innerHTML = '<div class="sb-rail"><div class="sb-row"></div><svg class="sb-clamp" aria-hidden="true"><path/></svg></div><div class="sb-bank"></div><div class="sb-act"></div>';
  const row = root.querySelector('.sb-row'), svg = root.querySelector('.sb-clamp'), path = svg.querySelector('path'), bank = root.querySelector('.sb-bank'), act = root.querySelector('.sb-act');
  let parts = [], clampOn = false;

  const rect = (el) => el.getBoundingClientRect();
  // a long sentence on a phone: the wagons shrink (down to 60 %) until the strip fits its width
  function fit() {
    // the practice strip wraps rather than shrink far (comfortable to tap), but a little shrinking first keeps the
    // sentence on one line, so the clamp can join the modal verb and the infinitive over it
    if (root.id === 'strip') {
      const wrapped = () => { const w = [...row.children].filter((c) => c.offsetParent); return w.length > 1 && w[w.length - 1].offsetTop > w[0].offsetTop + 4; };
      let k = 1; row.style.setProperty('--sbk', '1');
      while (wrapped() && k > 0.8) { k = Math.max(0.8, k - 0.05); row.style.setProperty('--sbk', k.toFixed(2)); }
      if (wrapped()) row.style.setProperty('--sbk', '1');      // it does not fit even so: wrap at the full size
      return;
    }
    // (gaps and the wagons' least width do not shrink with the font, so a few rounds until it fits)
    let k = 1; row.style.setProperty('--sbk', k); const have = row.parentElement.clientWidth - 6;
    for (let i = 0; i < 4 && row.scrollWidth > have && k > 0.6; i++) { k = Math.max(0.6, k * (have / row.scrollWidth) * 0.97); row.style.setProperty('--sbk', k.toFixed(3)); }
  }
  function flip(mutate, dur = 520) {
    const before = new Map([...row.children].map((el) => [el.dataset.id, rect(el)]));
    mutate();
    if (REDUCED) return Promise.resolve();
    const anims = [];
    for (const el of row.children) {
      const b = before.get(el.dataset.id), a = rect(el);
      if (b) { const dx = b.left - a.left, dy = b.top - a.top; if (Math.abs(dx) + Math.abs(dy) > 1) anims.push(el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: dur, easing: EASE }).finished); }
      else anims.push(el.animate([{ transform: 'translateY(-26px) scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: dur * 0.8, easing: EASE }).finished);
    }
    return Promise.all(anims).catch(() => {});
  }
  function wagon(p, i, list) {
    const el = document.createElement('div'); el.className = `sb-w r-${p.r}`; el.dataset.id = p.id || p.w;
    el.innerHTML = `<small class="sb-seat">${seatLabel(list, i)}</small><span class="sb-word">${rich(p.w)}</span><i class="sb-wh"></i>${badge(p.r)}`;
    return el;
  }
  function render(list) {
    const old = new Map([...row.children].map((el) => [el.dataset.id, el]));
    const els = list.map((p, i) => {
      const id = p.id || p.w, el = old.get(id);
      if (!el) return wagon(p, i, list);
      const word = el.querySelector('.sb-word'), changed = plain(word.textContent) !== plain(p.w);
      el.className = `sb-w r-${p.r}`; el.querySelector('.sb-seat').textContent = seatLabel(list, i);
      const prevBadge = el.querySelector('.sb-case'); if (prevBadge) prevBadge.remove(); if (badge(p.r)) el.insertAdjacentHTML('beforeend', badge(p.r));
      if (changed) { word.innerHTML = rich(p.w); el.classList.add('chg'); setTimeout(() => el.classList.remove('chg'), 900); }
      return el;
    });
    row.replaceChildren(...els); fit();
  }
  // show a sentence (animated from the one before: wagons keep their id, so they ride to their new seats)
  async function show(list, { clamp = 'auto' } = {}) {
    setClamp(false, true); parts = list.map((p) => ({ ...p, id: p.id || p.w }));
    root.classList.remove('tiles'); bank.replaceChildren(); act.replaceChildren();
    play.roll(); await flip(() => render(parts));
    if (clamp === true || (clamp === 'auto' && hasClamp())) await setClamp(true);
  }
  const hasClamp = () => parts.some((p) => p.r === 'v') && parts.length > 1 && parts[parts.length - 1].r === 't';
  function clampPath() {
    const els = [...row.children], v = els.find((el) => el.classList.contains('r-v')), t = els[els.length - 1];
    if (!v || !t || v === t) return null;
    const R = rect(row.parentElement), a = rect(v), b = rect(t), y = a.top - R.top - 4, top = 3;
    const x1 = a.left - R.left + a.width / 2, x2 = b.left - R.left + b.width / 2;
    svg.setAttribute('width', R.width); svg.setAttribute('height', R.height); svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
    if (Math.abs(a.top - b.top) > 8) {
      const edge = R.width - 2, endY = b.top - R.top - 3;
      return `M${x1} ${y} L${x1} ${top} L${edge} ${top} L${edge} ${endY} L${x2} ${endY} L${x2} ${endY + 5}`;
    }
    return `M${x1} ${y} L${x1} ${top} L${x2} ${top} L${x2} ${y}`;
  }
  async function setClamp(on, quiet) {
    clampOn = on; svg.classList.remove('slip');
    if (!on) { svg.classList.remove('on'); return; }
    const d = clampPath(); if (!d) return; path.setAttribute('d', d);
    const len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = REDUCED ? 0 : len;
    svg.classList.add('on'); if (!REDUCED) await path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 600, easing: EASE, fill: 'forwards' }).finished.catch(() => {});
    path.style.strokeDashoffset = 0;
    if (!quiet) { play.click(); if (!REDUCED) for (const el of [row.querySelector('.r-v'), row.lastElementChild]) el && el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 260 }); }
  }
  new ResizeObserver(() => { if (row.children.length) fit(); if (clampOn) { const d = clampPath(); if (d) path.setAttribute('d', d); } }).observe(root);

  // the jaws slip: the bracket wobbles red and falls away
  async function slip() {
    const d = clampPath(); if (d) { path.setAttribute('d', d); path.style.strokeDasharray = 'none'; path.style.strokeDashoffset = 0; svg.classList.add('on'); }
    svg.classList.add('slip'); play.slip();
    if (!REDUCED) await svg.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-3px) rotate(-1.5deg)', offset: 0.2 }, { transform: 'translateY(2px) rotate(1.5deg)', offset: 0.4 }, { transform: 'translateY(18px) rotate(4deg)', opacity: 0 }], { duration: 900, easing: 'ease-in' }).finished.catch(() => {});
    svg.classList.remove('on', 'slip');
  }
  // a wagon shakes (the engine stalls when the verb is not at its seat)
  function shake(i) { const el = row.children[i]; if (el && !REDUCED) el.animate([{ transform: 'none' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { duration: 420 }); }
  function mark(i, cls) { const el = row.children[i]; if (el) { el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 1400); } }

  /* ---------- tile mode ----------
     tiles(list, { fixed }) shows list.length empty wagons and the tiles in a shuffled bank; resolves with the order the
     learner checks (an array of tile indexes). fixed: { seatIndex: tileIndex } wagons already filled (a hint). */
  // slots: fewer wagons than tiles (the rest are distractors, e.g. der Hund / den Hund)
  // seats: the small label over each wagon ('' for none); by default 1, 2 … and the last one's "Ende"
  function tiles(list, { fixed = {}, check = T('check'), end = '', roles = [], slots, seats } = {}) {
    setClamp(false, true); root.classList.add('tiles'); parts = [];
    const n = slots || list.length, slot = new Array(n).fill(null);
    for (const [s, t] of Object.entries(fixed)) slot[+s] = t;
    let pick = null;
    const order = list.map((_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    if (list.length > 1 && order.every((v, i) => v === i)) order.push(order.shift());
    const draw = () => {
      row.replaceChildren(...slot.map((t, s) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'sb-w ' + (t == null ? 'empty' : fixed[s] != null ? 'r-' + (roles[t] || 'x') : 'r-x') + (pick === s ? ' pick' : '') + (fixed[s] != null ? ' fixed' : '');
        b.dataset.id = t == null ? 'slot' + s : 'tile' + t;
        b.innerHTML = `<small class="sb-seat">${seats ? esc(seats[s] || '') : s === 0 ? '1' : s === 1 ? '2' : s === n - 1 ? T('end') : ''}</small><span class="sb-word">${t == null ? '&nbsp;' : rich(list[t])}</span><i class="sb-wh"></i>${s === n - 1 && end ? `<b class="sb-end">${end}</b>` : ''}`;
        b.setAttribute('aria-label', t == null ? `${T('seat')} ${s + 1}, ${T('empty')}` : `${T('seat')} ${s + 1}: ${plain(list[t])}. ${T('putBack')}`);
        b.onclick = () => { if (fixed[s] != null) return; if (t != null) { slot[s] = null; play.tick(); flip(draw, 320); } else { pick = pick === s ? null : s; draw(); } };
        return b;
      })); fit();
      bank.replaceChildren(...order.filter((t) => !slot.includes(t)).map((t) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'sb-tile'; b.innerHTML = rich(list[t]); b.dataset.id = 'tile' + t;
        b.onclick = () => { const s = pick != null && slot[pick] == null ? pick : slot.indexOf(null); if (s < 0) { play.wrong(); return; } slot[s] = t; pick = null; root.dispatchEvent(new Event('practice-edit', { bubbles: true })); play.tick(); flip(draw, 360); ok.disabled = slot.includes(null); if (!slot.includes(null)) ok.focus({ preventScroll: true }); };
        return b;
      }));
      ok.disabled = slot.includes(null);
    };
    const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'main sb-check'; ok.textContent = check;
    act.replaceChildren(ok); draw();
    const first = bank.querySelector('button'); if (first) first.focus({ preventScroll: true });
    return new Promise((res) => { ok.onclick = () => { bank.replaceChildren(); act.replaceChildren(); res(slot.slice()); }; });
  }
  // after a check: show the learner's own order as a sentence (roles from the item), so the strip can react
  function settle(list, roles, order) { root.classList.remove('tiles'); parts = order.map((t) => ({ w: list[t], r: roles[t] || 'x', id: 'tile' + t })); render(parts); }

  // light up one wagon (by id) with a small label under it: the narrator's board points at it while she speaks
  function highlight(id, label) {
    const el = [...row.children].find((w) => w.dataset.id === id); if (!el) return;
    el.classList.add('hl'); play.tick();
    if (label) { const l = document.createElement('em'); l.className = 'sb-lab'; l.innerHTML = rich(label); el.append(l); fit(); }
    if (!REDUCED) el.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' });
  }
  function clear() { setClamp(false, true); parts = []; row.replaceChildren(); bank.replaceChildren(); act.replaceChildren(); root.classList.remove('tiles'); }
  return { show, setClamp, slip, shake, mark, highlight, tiles, settle, clear, get parts() { return parts; }, row };
}

/* The vowel wheel (Kapitel 5 and every chapter with a vowel change): a word whose vowel turns on a drum.
   wheel(el, ['k', 'ö', 'a', 'nn']) shows "können" turning into "kann"; ends are kept. */
export function wheel(el, [pre, from, to, post], { fromPost } = {}) {
  el.innerHTML = `<span class="vw">${pre}<span class="vw-drum"><span class="vw-roll"><b>${from}</b><b>${to}</b></span></span><span class="vw-post">${fromPost || post}</span></span>`;
  el.classList.add('on');
  const roll = el.querySelector('.vw-roll'), tail = el.querySelector('.vw-post');
  return {
    turn() {
      play.click();
      if (REDUCED) { roll.style.transform = 'translateY(-50%)'; tail.textContent = post; return Promise.resolve(); }
      const a = roll.animate([{ transform: 'none' }, { transform: 'translateY(-58%)', offset: 0.8 }, { transform: 'translateY(-50%)' }], { duration: 700, easing: EASE, fill: 'forwards' });
      setTimeout(() => { if (fromPost) { tail.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: 400 }); setTimeout(() => (tail.textContent = post), 200); } }, 500);
      return a.finished.catch(() => {});
    },
    hide() { el.classList.remove('on'); },
  };
}
