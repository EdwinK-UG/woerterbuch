/* Das Licht: a soft stage spotlight on whoever is speaking (the user's review: zooming in on every speaker felt odd,
   and a round face window looked silly). The camera stays still; the picture dims a little except for a gentle pool
   of light around the speaker (or around two speakers at once), which glides from one speaker to the next. When the
   narrator speaks, the light comes back up everywhere (her board explains instead). Drawn on one canvas above the
   set and the people, below bubbles, boards and cards. */
import { $, REDUCED } from './stage.js';

export function createLicht(B) {
  const cv = document.createElement('canvas'); cv.className = 'spot'; cv.setAttribute('aria-hidden', 'true'); $('stage').append(cv);
  let who = [], k = 0, x = null, y = 0, r = 0;
  B.sayHooks.push((w) => { who = w.split('+').map((key) => B.A[key]).filter(Boolean); });
  B.resetHooks.push(() => { who = []; });
  B.onFrame.push((t, dt) => {
    const V = B.set.V, dpr = V.dpr, W = Math.round(V.W * dpr), H = Math.round(V.H * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const on = who.filter((a) => a.show && a.clean);
    k += ((on.length ? 1 : 0) - k) * Math.min(1, dt * 3);
    const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    if (k < 0.01) { x = null; return; }
    if (on.length) {        // where the light should be: around the speaker(s), from the hips up
      const rs = on.map((a) => B.bodyRect(a)), x0 = Math.min(...rs.map((q) => q.x)), x1 = Math.max(...rs.map((q) => q.x + q.w)), tall = Math.max(...rs.map((q) => q.h));
      const tx = (x0 + x1) / 2, ty = Math.min(...rs.map((q) => q.y)) + tall * 0.42, tr = Math.max(tall * 0.78, (x1 - x0) / 2 + tall * 0.35);
      if (x == null || REDUCED) { x = tx; y = ty; r = tr; } else { const e = Math.min(1, dt * 4); x += (tx - x) * e; y += (ty - y) * e; r += (tr - r) * e; }
    }
    if (x == null) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = `rgba(28, 20, 12, ${0.3 * k})`; c.fillRect(0, 0, V.W, V.H);
    c.globalCompositeOperation = 'destination-out';
    const g = c.createRadialGradient(x, y, r * 0.35, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 1.15, 0, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
    // a warm touch of light on the speaker
    const w = c.createRadialGradient(x, y, 0, x, y, r * 0.9); w.addColorStop(0, `rgba(255, 236, 190, ${0.1 * k})`); w.addColorStop(1, 'rgba(255, 236, 190, 0)');
    c.fillStyle = w; c.fillRect(x - r, y - r * 1.2, r * 2, r * 2.4);
  });
}
