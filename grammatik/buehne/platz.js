/* Where an explanation may go: of a few candidate spots, the one that covers the least of the characters (and the
   animals) on screen. The speaker's own figure counts double: covering the face that is speaking is the worst.
   A choice is kept until another spot is clearly better, so bubbles and boards do not jump about. */
export function overlap(r, q) {
  const w = Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x), h = Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y);
  return w > 0 && h > 0 ? w * h : 0;
}
// cands: [{ x, y, …}] (top-left corners); w, h: the box's size; W, H: the picture; speaker: the key of whoever speaks
export function bestSpot(cands, { w, h, W, H, busy, speaker, prev }) {
  let best = null;
  cands.forEach((c, i) => {
    let x = Math.max(6, Math.min(W - w - 6, c.x)), y = Math.max(6, Math.min(H - h - 6, c.y));
    if (y < 52 && x + w > W - 96) { if (W - 96 - w >= 6) x = W - 96 - w; else y = Math.min(52, H - h - 6); }   // the corner buttons
    const box = { x, y, w, h };
    let score = busy.reduce((s, q) => s + overlap(box, q) * (q.who && q.who === speaker ? 2 : 1), 0) + i * 30 + (c.cost || 0);
    if (prev && prev.i === i) score *= 0.75;                       // stay where it is unless clearly better
    if (!best || score < best.score) best = { ...c, x, y, score, i };
  });
  return best;
}
