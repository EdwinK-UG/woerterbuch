/* Where an explanation may go: of a few candidate spots, the one that covers the least of the characters (and the
   animals) on screen. The speaker's own figure counts double: covering the face that is speaking is the worst.
   A choice is kept until another spot is clearly better, so bubbles and boards do not jump about.
   The fit rule (docs/scene-format.md, player behaviour): nothing with text or meaning reaches closer than MARGIN to an
   edge of the picture; a box too big for the picture is made smaller (fitScale), never cut. */
export function overlap(r, q) {
  const w = Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x), h = Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y);
  return w > 0 && h > 0 ? w * h : 0;
}
// the safe margin at each edge of a picture W px wide: 8 px on a phone, a little more on a wide screen
export const margin = (W) => Math.max(8, Math.round(W * 0.012));
// how far what is drawn inside an element reaches beyond its own box (a wagon's label, a note above a time line), in
// the element's own (unscaled) pixels; k is the scale it is drawn at now
const FLYING = '.tf-shaving, .tf-cork, .tf-plane, .tf-sparks';
export function reach(el, k = 1) {
  const r = el.getBoundingClientRect(); let l = r.left, t = r.top, rr = r.right, b = r.bottom;
  for (const e of el.querySelectorAll('*')) {
    if (e.closest(FLYING)) continue;
    const q = e.getBoundingClientRect(); if (q.width < 1 || q.height < 1) continue;
    if (q.left < l) l = q.left; if (q.top < t) t = q.top; if (q.right > rr) rr = q.right; if (q.bottom > b) b = q.bottom;
  }
  const s = k || 1;
  return { l: (r.left - l) / s, t: (r.top - t) / s, r: (rr - r.right) / s, b: (b - r.bottom) / s };
}
// the scale (at most 1) at which a box w × h, with what reaches out of it, fits the picture inside the margins
export function fitScale(w, h, W, H, out = { l: 0, t: 0, r: 0, b: 0 }, m = margin(W)) {
  const ow = w + out.l + out.r, oh = h + out.t + out.b;
  return Math.max(0.3, Math.min(1, (W - 2 * m) / Math.max(1, ow), (H - 2 * m) / Math.max(1, oh)));
}
// cands: [{ x, y, …}] (top-left corners); w, h: the box's size; W, H: the picture; speaker: the key of whoever speaks;
// m: the margin kept at every edge
export function bestSpot(cands, { w, h, W, H, busy, speaker, prev, m = margin(W) }) {
  let best = null;
  const fit = (v, lo, hi) => (hi < lo ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));    // too big: centred
  cands.forEach((c, i) => {
    let x = fit(c.x, m, W - w - m), y = fit(c.y, m, H - h - m);
    if (y < 52 && x + w > W - 96) { if (W - 96 - w >= m) x = W - 96 - w; else y = fit(52, m, H - h - m); }   // the corner buttons
    const box = { x, y, w, h };
    let score = busy.reduce((s, q) => s + overlap(box, q) * (q.who && q.who === speaker ? 2 : 1), 0) + i * 30 + (c.cost || 0);
    if (prev && prev.i === i) score *= 0.75;                       // stay where it is unless clearly better
    if (!best || score < best.score) best = { ...c, x, y, score, i };
  });
  return best;
}
