// Liv 3D · hands: 17 hand shapes (the 2D rig's hand_pose numbers), one damped spring per channel with a small cascade
// (index leads, the little finger follows ~60 ms later) and idle micro-motion, applied to the VRM finger bones.
// Channels: thumbCurl, thumbOpp (-1 thumbs-up .. 0 rest .. 1 across the palm), index, middle, ring, little (0 straight
// .. 1 fist), spread (0 together .. 1 fanned).
import { V3, Q, clamp, lerp, qAxis, FINGERS } from './rig.js';

export const SHAPES = {
  relaxed: [0.25, 0.05, 0.20, 0.27, 0.33, 0.40, 0.14],
  open: [0.00, -0.35, 0.00, 0.00, 0.02, 0.04, 1.00],
  flat: [0.06, 0.08, 0.02, 0.02, 0.03, 0.04, 0.05],
  wave: [0.04, -0.30, 0.02, 0.01, 0.03, 0.05, 0.55],
  fist: [0.62, 0.62, 1.00, 1.00, 1.00, 1.00, 0.00],
  point: [0.55, 0.62, 0.00, 0.97, 1.00, 1.00, 0.06],
  thumbsUp: [0.00, -1.00, 1.00, 1.00, 1.00, 1.00, 0.00],
  pinch: [0.70, 0.60, 0.475, 0.30, 0.26, 0.24, 0.30],
  gripSphere: null, gripHandle: null,
  carry: [0.30, 0.15, 0.66, 0.68, 0.70, 0.72, 0.00],
  beckon: [0.30, 0.25, 0.10, 0.62, 0.80, 0.86, 0.10],
  count1: [0.55, 0.62, 0.00, 0.97, 1.00, 1.00, 0.30],
  count2: [0.55, 0.65, 0.00, 0.00, 1.00, 1.00, 0.55],
  count3: [0.55, 0.70, 0.00, 0.00, 0.00, 1.00, 0.65],
  count4: [0.55, 0.50, 0.00, 0.00, 0.00, 0.02, 0.75],
  count5: [0.00, -0.65, 0.00, 0.00, 0.00, 0.02, 0.90],
};
export const SHAPE_NAMES = Object.keys(SHAPES);
const DELAY = [0.012, 0.0, 0.0, 0.025, 0.042, 0.058, 0.0];
const OMEGA = [19.0, 17.0, 21.0, 20.0, 19.0, 18.5, 14.0];
const ZETA = [0.70, 0.75, 0.62, 0.64, 0.66, 0.68, 0.80];
const IDLE_P = [4.1, 5.3, 3.3, 3.7, 4.4, 3.1, 5.9];

// shape row; grip = 0..1 how far the fingers wrap (sphere: an apple ~0.55; handle ~0.85); beckon cycles with time
export function shapeRow(name, grip = 0, t = 0) {
  if (name === 'gripSphere') { const c = grip || 0.56; return [0.45, 0.62, c - 0.04, c, c + 0.03, c + 0.06, clamp(0.5 - c * 0.5, 0, 1)]; }
  if (name === 'gripHandle') { const c = grip || 0.87; return [0.62, 0.66, c - 0.02, c, c + 0.01, c + 0.02, 0]; }
  const row = (SHAPES[name] || SHAPES.relaxed).slice();
  if (name === 'beckon') {
    const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * ((t % 0.95) / 0.95));
    row[2] = lerp(0.08, 0.92, w); row[3] = lerp(0.35, 0.95, 0.5 - 0.5 * Math.cos(2 * Math.PI * (((t - 0.07) % 0.95 + 0.95) % 0.95) / 0.95));
  }
  return row;
}

export class Hand {
  constructor(rig, side, seed) {
    this.rig = rig; this.side = side; this.p = side === 'L' ? 'left' : 'right'; this.seed = seed;
    this.cur = SHAPES.relaxed.slice(); this.vel = [0, 0, 0, 0, 0, 0, 0]; this.hist = []; this.t = 0;
    const r = rig.rest, p = this.p, wr = r[p + 'Hand'];
    const fd = rig.M[side].restFinger, n = V3(0, -1, 0);        // T-pose: palm down
    this.palmN = n; this.fingerDir = fd;
    this.ax = {};
    for (const f of FINGERS) {
      const a = r[p + f + 'Proximal'], b = r[p + f + 'Intermediate'];
      const d = a && b ? b.clone().sub(a).normalize() : fd.clone();
      this.ax[f] = { curl: V3().crossVectors(d, n).normalize(), spread: V3().crossVectors(fd, V3(0, 0, 1)).normalize() };
    }
    const m0 = r[p + 'ThumbMetacarpal'] || r[p + 'ThumbProximal'], m1 = r[p + 'ThumbProximal'], m2 = r[p + 'ThumbDistal'];
    const td = m0 && m2 ? m2.clone().sub(m0).normalize() : V3(0.7 * Math.sign(fd.x), 0, 0.7);
    const tPerp = td.clone().addScaledVector(fd, -td.dot(fd)).normalize();
    const pad = n.clone().addScaledVector(tPerp, -0.6).normalize();            // the thumb's pad faces the palm side and the index
    this.thumb = { flex: V3().crossVectors(td, pad).normalize(), opp: V3().crossVectors(tPerp, n).normalize(), up: V3().crossVectors(fd, tPerp).normalize().negate() };
  }
  update(dt, target) {
    this.t += dt; const t = this.t;
    this.hist.push([t, target.slice()]); while (this.hist.length > 2 && this.hist[1][0] < t - 0.08) this.hist.shift();
    for (let i = 0; i < 7; i++) {
      let tg = target[i];
      if (DELAY[i] > 0) { for (const [ht, row] of this.hist) { if (ht <= t - DELAY[i]) tg = row[i]; } }
      tg += 0.018 * Math.sin(2 * Math.PI * t / IDLE_P[i] + this.seed + i);
      const w = OMEGA[i], z = ZETA[i];
      this.vel[i] += (w * w * (tg - this.cur[i]) - 2 * z * w * this.vel[i]) * dt;
      this.cur[i] += this.vel[i] * dt;
    }
  }
  apply() {
    const rig = this.rig, p = this.p, c = this.cur;
    const spreadW = [0.20, 0.04, -0.12, -0.26];
    FINGERS.forEach((f, i) => {
      const curl = clamp(c[2 + i], -0.2, 1.1), ax = this.ax[f], sp = (c[6] - 0.15) * spreadW[i];
      rig.setLocal(p + f + 'Proximal', qAxis(ax.spread, sp).multiply(qAxis(ax.curl, curl * 1.45)));
      rig.setLocal(p + f + 'Intermediate', qAxis(ax.curl, curl * 1.65));
      rig.setLocal(p + f + 'Distal', qAxis(ax.curl, curl * 1.05));
    });
    const tc = clamp(c[0], -0.3, 1.1), to = clamp(c[1], -1.2, 1.2), th = this.thumb;
    const meta = qAxis(th.up, 0.3 + (to < 0 ? to * 0.85 : to * 0.2)).multiply(qAxis(th.opp, Math.max(0, to) * 0.8));
    rig.setLocal(p + 'ThumbMetacarpal', meta.multiply(qAxis(th.flex, tc * 0.25)));
    rig.setLocal(p + 'ThumbProximal', qAxis(th.flex, tc * 0.95));
    rig.setLocal(p + 'ThumbDistal', qAxis(th.flex, tc * 1.15));
  }
}
