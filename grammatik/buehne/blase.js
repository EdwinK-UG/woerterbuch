/* Die Blase: a speech or thought bubble in the picture, next to whoever speaks (the user's review of Kap 5).
   It holds, together where the eye already is:
   - a picture of what the sentence means (bilder.js), with the modal verb's icon in its corner,
   - the sentence strip (satzband.js): wagons, seats and the clamp ride inside the bubble, not below the picture.
   kind 'say' has a pointed tail, 'think' (wishes, plans, questions to oneself) a trail of dots.
   It sits above the speaker's head, or beside it when there is no room, and follows them as the camera moves.
   The film leaves headroom for it (stage S.room: close-ups frame the face lower). */
import { $, rich, REDUCED, isNarrator } from './stage.js';
import { createStrip } from './satzband.js';
import { BILDER, ICONS } from './bilder.js';
import { play } from './sfx.js';
import { bestSpot } from './platz.js';

export function createBlase(B, { cases = false } = {}) {
  const st = $('stage');
  const el = document.createElement('div'); el.className = 'bub'; el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<div class="bub-pic"><canvas></canvas><i class="bub-icon"><canvas width="56" height="56"></canvas></i></div><div class="bub-text"></div><div class="bub-sb"></div>';
  const tail = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); tail.setAttribute('class', 'bub-tail'); tail.setAttribute('aria-hidden', 'true');
  st.append(tail, el);
  const picBox = el.querySelector('.bub-pic'), pic = picBox.querySelector('canvas'), iconBox = el.querySelector('.bub-icon'), icon = iconBox.querySelector('canvas');
  const strip = createStrip(el.querySelector('.bub-sb'), { cases });
  const S = { on: false, who: null, at: null, kind: 'say', pic: null, icon: null, x: null, y: null, t0: 0 };

  function anchor() {             // the point the tail points at: the speaker's head, an animal, or a world point
    const set = B.set;
    const at = typeof S.at === 'function' ? S.at() : S.at;          // a function follows something that moves
    if (at) { const f = set.foot(at.x, at.d || 0); return { x: f.x, y: f.y - (at.h || 0) * set.V.cam.z * f.k, w: 30 }; }
    const a = S.who && (B.A[S.who] || null); if (!a || !a.show) return null;
    const r = B.bodyRect(a); return { x: r.x + r.w / 2, y: r.y + r.h * 0.04, w: r.w };
  }
  function size() {
    const small = B.set.V.W < 520, pw = small ? 124 : 192, ph = small ? 78 : 120, dpr = Math.min(2, devicePixelRatio || 1);
    pic.style.width = pw + 'px'; pic.style.height = ph + 'px'; if (pic.width !== pw * dpr) { pic.width = pw * dpr; pic.height = ph * dpr; }
    return { pw, ph, dpr };
  }
  // show({ who | at, kind, pic, icon, strip, text, clamp }): returns when the strip has settled
  async function show(o = {}) {
    const fresh = !S.on || o.who !== S.who || !!o.at !== !!S.at;
    Object.assign(S, { on: true, who: o.who || null, at: o.at || null, kind: o.kind || 'say', pic: o.pic || null, icon: o.icon || null });
    if (fresh) { S.x = null; S.spot = null; S.t0 = B.S.t; }
    el.classList.toggle('think', S.kind === 'think'); el.classList.add('on');
    picBox.style.display = S.pic ? '' : 'none'; iconBox.style.display = S.icon ? '' : 'none';
    el.querySelector('.bub-text').innerHTML = o.text ? rich(o.text) : ''; el.querySelector('.bub-text').style.display = o.text ? '' : 'none';
    if (S.icon) { const c = icon.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 28, 28); ICONS[S.icon](c); }
    if (fresh && !REDUCED) el.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    if (fresh) play.pop(1.3);
    if (o.strip) await strip.show(o.strip, { clamp: o.clamp ?? 'auto' }); else if (o.strip === null) strip.clear();
  }
  // another speaker's line (not the narrator, who talks about the bubble): the bubble goes
  B.sayHooks.push((who) => { if (S.on && !isNarrator(who) && S.who && who !== S.who) hide(); });
  function hide() { if (!S.on) return; S.on = false; el.classList.remove('on'); tail.innerHTML = ''; strip.clear(); }

  B.onFrame.push((t) => {
    if (!S.on) return;
    const { pw, ph, dpr } = size();
    if (S.pic && BILDER[S.pic]) { const c = pic.getContext('2d'); c.setTransform(dpr * pw / 160, 0, 0, dpr * ph / 100, 0, 0); c.clearRect(0, 0, 160, 100); BILDER[S.pic](c, REDUCED ? 1.5 : t - S.t0); }
    // place it where it covers the least of anyone: above the head, shifted, beside it, or in a top corner
    const W = B.set.V.W, H = B.set.V.H, w = el.offsetWidth, h = el.offsetHeight, a = anchor(), gap = S.kind === 'think' ? 26 : 18;
    const cands = !a ? [{ x: (W - w) / 2, y: 8, side: 'none' }, { x: 8, y: 8, side: 'none' }, { x: W - w - 8, y: 8, side: 'none' }] : [
      { x: a.x - w / 2, y: a.y - h - gap, side: 'up' }, { x: a.x - w * 0.15, y: a.y - h - gap, side: 'up' }, { x: a.x - w * 0.85, y: a.y - h - gap, side: 'up' },
      { x: a.x + a.w * 0.6 + gap, y: a.y - h * 0.3, side: 'right' }, { x: a.x - a.w * 0.6 - gap - w, y: a.y - h * 0.3, side: 'left' },
      { x: 8, y: 8, side: 'up', cost: 400 }, { x: W - w - 8, y: 8, side: 'up', cost: 400 }];
    if (!S.spotT || B.S.t - S.spotT > 0.4 || !S.spot) { S.spot = bestSpot(cands, { w, h, W, H, busy: B.occupied(), speaker: S.who, prev: S.spot }); S.spotT = B.S.t; }
    const pick = cands[S.spot.i] ? { ...S.spot, ...bestSpot([cands[S.spot.i]], { w, h, W, H, busy: [], speaker: null }) } : S.spot;
    let { x, y, side } = pick;
    if (S.x == null) { S.x = x; S.y = y; } else { S.x += (x - S.x) * 0.25; S.y += (y - S.y) * 0.25; }
    el.style.transform = `translate(${S.x.toFixed(1)}px, ${S.y.toFixed(1)}px)`;
    // the tail: from the bubble's nearest edge toward the anchor
    if (!a || side === 'none') { tail.innerHTML = ''; return; }
    const bx = side === 'up' ? Math.max(S.x + 18, Math.min(S.x + w - 18, a.x)) : side === 'right' ? S.x + 2 : S.x + w - 2;
    const by = side === 'up' ? S.y + h - 2 : Math.max(S.y + 16, Math.min(S.y + h - 16, a.y));
    const tx = a.x + (side === 'right' ? a.w * 0.35 : side === 'left' ? -a.w * 0.35 : 0), ty = a.y - (side === 'up' ? 6 : 0);
    tail.setAttribute('width', W); tail.setAttribute('height', H); tail.setAttribute('viewBox', `0 0 ${W} ${H}`);
    if (S.kind === 'think') {
      const pts = [0.3, 0.58, 0.82].map((k, i) => `<circle cx="${(bx + (tx - bx) * k).toFixed(1)}" cy="${(by + (ty - by) * k).toFixed(1)}" r="${[7, 5, 3.4][i]}"/>`); tail.innerHTML = pts.join('');
    } else {
      const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, ex = bx + dx * 0.82, ey = by + dy * 0.82, s = len > 120 ? 6 : 9;   // a far bubble gets a slimmer tail
      tail.innerHTML = `<path d="M${(bx + nx * s).toFixed(1)} ${(by + ny * s).toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)} L${(bx - nx * s).toFixed(1)} ${(by - ny * s).toFixed(1)} Z"/>`;
    }
  });
  return { show, hide, strip, el, get on() { return S.on; } };
}
