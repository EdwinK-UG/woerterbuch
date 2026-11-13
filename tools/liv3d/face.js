// Liv 3D · face: ten named expressions mapped onto the VRM expression presets (a model that lacks a preset simply
// skips it), smooth blends, blinks every 2.2 to 5.4 s (close 70 ms, hold 30 ms, open 100 ms), a wink, gaze with idle
// saccades and glances. Gaze is given as yaw / pitch offsets in radians relative to the head; the actor turns it into
// a look-at target for vrm.lookAt.
import { clamp, lerp } from './rig.js';

export const EXPRESSIONS = {
  happy: { happy: 0.42, relaxed: 0.2 },
  smile: { relaxed: 0.6 },
  neutral: {},
  laugh: { happy: 1.0, aa: 0.45 },
  surprised: { surprised: 1.0 },
  sad: { sad: 0.9 },
  think: { sad: 0.12, ou: 0.3 },
  ouch: { sad: 0.55, angry: 0.3, ih: 0.4, blink: 0.4 },
  effort: { angry: 0.6, ee: 0.35, blink: 0.18 },
  wink: { relaxed: 0.5, blinkLeft: 1.0 },
};
export const EXPRESSION_NAMES = Object.keys(EXPRESSIONS);
// gaze offsets an expression adds (yaw + = her left, pitch + = up)
const GAZE = { think: [0.35, 0.3], sad: [0, -0.3] };
const GAPS = [2.6, 4.1, 3.3, 5.4, 2.9, 3.8, 2.2, 4.6];
const SAC = [[0.9, 0.10, 0.04], [1.7, -0.06, -0.03], [1.1, 0.04, 0.07], [2.4, -0.55, 0.12], [0.8, 0, 0], [1.5, 0.08, -0.06], [2.1, -0.03, 0.03], [1.2, 0.35, -0.1], [0.9, 0, 0.02]];

export class Face {
  constructor(vrm) {
    this.em = vrm.expressionManager; this.names = new Set(this.em ? Object.keys(this.em.expressionMap) : []);
    this.cur = {}; this.expr = 'happy'; this.amount = 1; this.override = null;
    if (this.em) for (const n of this.names) this.em.setValue(n, 0);   // a new face starts clean (a reset must not leave the last expression on)
    this.t = 0; this.blinkT = -1; this.blinkI = 0; this.blinkAt = 1.4; this.winkT = -1;
    this.sacI = 0; this.sacT = 0; this.gx = 0; this.gy = 0; this.sx = 0; this.sy = 0; this.idle = true;
  }
  set(name, amount = 1) { this.expr = name; this.amount = amount; }
  blink() { this.blinkT = 0; }
  update(dt) {
    this.t += dt;
    const name = this.override || this.expr, amt = this.override ? 1 : this.amount;
    const target = {}; const def = EXPRESSIONS[name];
    if (def) for (const k in def) target[k] = def[k] * amt; else if (this.names.has(name)) target[name] = amt;
    // blink
    if (this.t >= this.blinkAt && this.blinkT < 0) { this.blinkT = 0; this.blinkAt = this.t + GAPS[this.blinkI++ % GAPS.length] * (0.85 + 0.15 * Math.sin(this.t * 7.3)); }
    let close = 0;
    if (this.blinkT >= 0) { const b = (this.blinkT += dt); close = b < 0.07 ? b / 0.07 : b < 0.1 ? 1 : b < 0.2 ? 1 - (b - 0.1) / 0.1 : 0; if (b >= 0.2) this.blinkT = -1; }
    const k = 1 - Math.exp(-dt * 13);
    const keys = new Set([...Object.keys(this.cur), ...Object.keys(target)]);
    for (const key of keys) this.cur[key] = lerp(this.cur[key] || 0, target[key] || 0, k);
    if (!this.em) return;
    for (const key of keys) if (this.names.has(key) && key !== 'blink') this.em.setValue(key, clamp(this.cur[key], 0, 1));
    // the blink is added on top of an expression's own lid closing; laughing eyes are already closed
    const own = this.cur.blink || 0, happyEyes = clamp((this.cur.happy || 0) - 0.5, 0, 0.5) * 2;
    if (this.names.has('blink')) this.em.setValue('blink', clamp(own + close * (1 - own) * (1 - happyEyes), 0, 1));
    // gaze: idle saccades and glances, expression offsets, springy eye motion
    let [tx, ty] = GAZE[name] ? GAZE[name].map((x) => x * amt) : [0, 0];
    if (this.idle) {
      this.sacT += dt; const s = SAC[this.sacI % SAC.length];
      if (this.sacT > s[0]) { this.sacT = 0; this.sacI++; const n = SAC[this.sacI % SAC.length]; this.sx = n[1]; this.sy = n[2]; }
      tx += this.sx; ty += this.sy;
    }
    const kg = 1 - Math.exp(-dt * 30); this.gx = lerp(this.gx, tx, kg); this.gy = lerp(this.gy, ty, kg);
  }
}
