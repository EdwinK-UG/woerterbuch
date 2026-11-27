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
import { picture as bakedPic, icon as bakedIcon } from './baked.js';   // the baked images (as the apps draw them); live drawing until loaded
import { play } from './sfx.js';
import { bestSpot, margin, reach, fitScale } from './platz.js?v=9';

export function createBlase(B, { cases = false } = {}) {
  const st = $('stage');
  const el = document.createElement('div'); el.className = 'bub'; el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<div class="bub-pic"><canvas></canvas><i class="bub-icon"><canvas width="56" height="56"></canvas></i></div><div class="bub-text"></div><div class="bub-sb"></div>';
  const tail = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); tail.setAttribute('class', 'bub-tail'); tail.setAttribute('aria-hidden', 'true');
  st.append(tail, el);
  const picBox = el.querySelector('.bub-pic'), pic = picBox.querySelector('canvas'), iconBox = el.querySelector('.bub-icon'), icon = iconBox.querySelector('canvas');
  const strip = createStrip(el.querySelector('.bub-sb'), { cases });
  const S = { on: false, who: null, at: null, kind: 'say', pic: null, icon: null, x: null, y: null, t0: 0, k: 1, out: null, outT: 0, outWH: '' };

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
    // a new bubble shows from its first placed frame (until then its transform is still the last bubble's place)
    if (fresh) { S.x = null; S.spot = null; S.t0 = B.S.t; S.out = null; el.style.visibility = 'hidden'; }
    el.classList.toggle('think', S.kind === 'think' || S.kind === 'wish'); el.classList.toggle('wish', S.kind === 'wish'); tail.classList.toggle('wish', S.kind === 'wish'); el.classList.add('on');
    picBox.style.display = S.pic ? '' : 'none'; iconBox.style.display = S.icon ? '' : 'none';
    el.querySelector('.bub-text').innerHTML = o.text ? rich(o.text) : ''; el.querySelector('.bub-text').style.display = o.text ? '' : 'none';
    // (the scale property, not transform: an animated transform would replace the bubble's place for its 0.26 s)
    if (fresh && !REDUCED) el.animate([{ scale: '.6', opacity: 0 }, { scale: '1', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    if (fresh) play.pop(1.3);
    if (o.strip) await strip.show(o.strip, { clamp: o.clamp ?? 'auto' }); else if (o.strip === null) strip.clear();
  }
  // another speaker's line (not the narrator, who talks about the bubble): the bubble goes
  B.sayHooks.push((who) => { if (S.on && !isNarrator(who) && S.who && who !== S.who) hide(); });
  function hide() { if (!S.on) return; S.on = false; el.classList.remove('on'); tail.innerHTML = ''; strip.clear(); }
  // the bubble bursts (a wish meets reality): it swells and fades, sparkles fly out (0.35 s), plopp
  async function pop() {
    if (!S.on) return; play.plopp && play.plopp();
    const r = el.getBoundingClientRect(), sr = st.getBoundingClientRect(), cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height / 2;
    if (!REDUCED) {
      for (let i = 0; i < 12; i++) {
        const sp = document.createElement('i'); sp.className = 'bub-spark'; sp.style.left = cx + 'px'; sp.style.top = cy + 'px'; st.append(sp);
        const a = (i / 12) * Math.PI * 2, d = 0.45 * Math.max(r.width, r.height) * (0.8 + 0.4 * Math.random());
        sp.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.3)`, opacity: 0 }], { duration: 550, easing: 'ease-out' }).onfinish = () => sp.remove();
      }
      tail.innerHTML = '';
      await el.animate([{ transform: el.style.transform + ' scale(1)', opacity: 1 }, { transform: el.style.transform + ' scale(1.15)', opacity: 0 }], { duration: 320, easing: 'ease-in' }).finished.catch(() => {});
    }
    hide();
  }

  B.onFrame.push((t) => {
    if (!S.on) return;
    const { pw, ph, dpr } = size();
    if (S.pic && BILDER[S.pic]) { const c = pic.getContext('2d'); c.setTransform(dpr * pw / 160, 0, 0, dpr * ph / 100, 0, 0); c.clearRect(0, 0, 160, 100); if (!bakedPic(c, S.pic, REDUCED ? 1.5 : t - S.t0, 0, 0, 160, 100)) BILDER[S.pic](c, REDUCED ? 1.5 : t - S.t0); }
    if (S.icon && ICONS[S.icon]) { const c = icon.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 28, 28); if (!bakedIcon(c, S.icon, 0, 0, 28, 28)) ICONS[S.icon](c); }
    // place it where it covers the least of anyone: above the head, shifted, beside it, or in a top corner
    // the whole bubble, with whatever sticks out of it, inside the picture's margins: smaller when it is too big
    const W = B.set.V.W, H = B.set.V.H, w0 = el.offsetWidth, h0 = el.offsetHeight, m = margin(W), a = anchor(), gap = S.kind === 'think' ? 26 : 18;
    const now = performance.now();       // (real time: a paused film still settles what changed in it)
    if (!S.out || now - S.outT > 250 || S.outWH !== `${w0}x${h0}x${W}x${H}`) { S.out = reach(el, S.k); S.outT = now; S.outWH = `${w0}x${h0}x${W}x${H}`; }
    const o = S.out; S.k = fitScale(w0, h0, W, H, o, m);
    const w = (w0 + o.l + o.r) * S.k, h = (h0 + o.t + o.b) * S.k;
    const cands = !a ? [{ x: (W - w) / 2, y: m, side: 'none' }, { x: m, y: m, side: 'none' }, { x: W - w - m, y: m, side: 'none' }] : [
      { x: a.x - w / 2, y: a.y - h - gap, side: 'up' }, { x: a.x - w * 0.15, y: a.y - h - gap, side: 'up' }, { x: a.x - w * 0.85, y: a.y - h - gap, side: 'up' },
      { x: a.x + a.w * 0.6 + gap, y: a.y - h * 0.3, side: 'right' }, { x: a.x - a.w * 0.6 - gap - w, y: a.y - h * 0.3, side: 'left' },
      { x: m, y: m, side: 'up', cost: 400 }, { x: W - w - m, y: m, side: 'up', cost: 400 }];
    if (!S.spotT || B.S.t - S.spotT > 0.4 || !S.spot) { S.spot = bestSpot(cands, { w, h, W, H, m, busy: B.occupied(), speaker: S.who, prev: S.spot }); S.spotT = B.S.t; }
    const pick = cands[S.spot.i] ? { ...S.spot, ...bestSpot([cands[S.spot.i]], { w, h, W, H, m, busy: [], speaker: null }) } : S.spot;
    let { x, y, side } = pick;
    if (S.x == null) { S.x = x; S.y = y; } else { S.x += (x - S.x) * 0.25; S.y += (y - S.y) * 0.25; }
    el.style.transform = `translate(${(S.x + o.l * S.k).toFixed(1)}px, ${(S.y + o.t * S.k).toFixed(1)}px)` + (S.k < 0.999 ? ` scale(${S.k.toFixed(3)})` : ''); el.style.visibility = '';
    // the tail: from the bubble's nearest edge toward the anchor
    if (!a || side === 'none') { tail.innerHTML = ''; return; }
    const bx = side === 'up' ? Math.max(S.x + 18, Math.min(S.x + w - 18, a.x)) : side === 'right' ? S.x + 2 : S.x + w - 2;
    const by = side === 'up' ? S.y + h - 2 : Math.max(S.y + 16, Math.min(S.y + h - 16, a.y));
    const tx = a.x + (side === 'right' ? a.w * 0.35 : side === 'left' ? -a.w * 0.35 : 0), ty = a.y - (side === 'up' ? 6 : 0);
    tail.setAttribute('width', W); tail.setAttribute('height', H); tail.setAttribute('viewBox', `0 0 ${W} ${H}`);
    if (S.kind === 'think' || S.kind === 'wish') {
      const pts = [0.3, 0.58, 0.82].map((k, i) => `<circle cx="${(bx + (tx - bx) * k).toFixed(1)}" cy="${(by + (ty - by) * k).toFixed(1)}" r="${[7, 5, 3.4][i]}"/>`); tail.innerHTML = pts.join('');
    } else {
      const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, ex = bx + dx * 0.82, ey = by + dy * 0.82, s = len > 120 ? 6 : 9;   // a far bubble gets a slimmer tail
      tail.innerHTML = `<path d="M${(bx + nx * s).toFixed(1)} ${(by + ny * s).toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)} L${(bx - nx * s).toFixed(1)} ${(by - ny * s).toFixed(1)} Z"/>`;
    }
  });
  return { show, hide, pop, strip, el, get on() { return S.on; } };
}
