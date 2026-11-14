/* Liv engine · motion: gait (walk and run from one model), idle life, face, and the Actor that layers actions on top.
   Everything here works on the skeleton only, in normalised units, so it plays on any skin. */
const GRAV = 9.81;
const softmin = (a, b, k) => -k * Math.log(Math.exp(-a / k) + Math.exp(-b / k));

/* Gait. ph = cycle phase 0..1 (left heel strike at 0, right at 0.5), v = speed in m/s, run = 0 (walk) .. 1 (run).
   Feet are planted: during stance a foot moves back under the body at exactly the travelling speed. */
function gaitPose(P, ph, v, run, amp, step) {
  const Hh = P.hipH, tau = Math.sqrt(Hh / GRAV), vn = v / Math.sqrt(GRAV * Hh);
  const cad = lerp(0.40 + 0.38 * vn, 0.70 + 0.16 * vn, run) / tau, T = 2 / cad;
  const beta = lerp(0.62, 0.36, run), D = v * beta * T, lead = lerp(-0.13, -0.1, run), fl = P.foot, aH = P.ankleH;
  const g1 = lerp(18, 6, run) * D2R, g0 = -lerp(55, 64, run) * D2R, sHo = lerp(0.5, 0.42, run), a = clamp(amp + step, 0, 1);
  const stance = (s) => {
    const ax = D * (0.5 + lead - s); let gam;
    if (s < 0.14) gam = g1 * (1 - s / 0.14) * amp; else if (s < sHo) gam = 0; else gam = g0 * amp * Math.pow(ss((s - sHo) / (1 - sHo)), 1.15);
    if (gam > 0) return { ax, x: ax - 0.25 * fl + 0.25 * fl * Math.cos(gam) - aH * Math.sin(gam), y: 0.25 * fl * Math.sin(gam) + aH * Math.cos(gam) - aH, pitch: gam };
    const g = -gam; return { ax, x: ax + 0.5 * fl - 0.5 * fl * Math.cos(g) + aH * Math.sin(g), y: 0.5 * fl * Math.sin(g) + aH * Math.cos(g) - aH, pitch: gam };
  };
  const A0 = stance(1), B0 = stance(0), lift = lerp(0.075, 0.3, run) * P.leg * amp + 0.07 * P.leg * step;
  const foot = (p) => {
    p = ((p % 1) + 1) % 1;
    if (p < beta) { const q = stance(p / beta); q.st = true; return q; }
    const w = (p - beta) / (1 - beta), e = ss(Math.pow(w, lerp(1, 1.12, run)));
    return { x: lerp(A0.x, B0.x, e), y: lerp(A0.y, B0.y, e) + lift * Math.pow(Math.sin(PI * Math.pow(w, lerp(0.85, 0.72, run))), 1.3), pitch: lerp(A0.pitch, B0.pitch, ss(w)) - run * 0.65 * Math.pow(Math.sin(PI * w), 2) * amp, st: false };
  };
  const fL = foot(ph), fR = foot(ph + 0.5), lat = lerp(1.05, lerp(0.72, 0.36, run), amp);
  // pelvis height: walking rides over the straight stance leg, running sinks in stance and rises in flight
  const reach = (q, rho) => q.y + aH + Math.sqrt(Math.max(0.01, Math.pow(rho * P.leg, 2) - q.x * q.x));
  const hW = softmin(softmin(fL.st ? reach(fL, 0.985) : 9, fR.st ? reach(fR, 0.985) : 9, 0.012), 0.992 * Hh, 0.012);
  const pfm = beta + (0.5 - beta) / 2;
  let hR = Hh * (0.905 + 0.04 * Math.cos(TAU * 2 * (ph - pfm)));
  if (fL.st) hR = Math.min(hR, reach(fL, 0.975)); if (fR.st) hR = Math.min(hR, reach(fR, 0.975));
  const py = lerp(0.985, lerp(hW, hR, run) / Hh, amp) - 0.012 * step * (1 - amp);
  const c0 = Math.cos(TAU * ph), cm = Math.cos(TAU * (ph - beta / 2));
  const out = {
    py, psx: lerp(0.38, 0.14, run) * amp * cm, ptw: -lerp(5, 10, run) * D2R * amp * c0, ctw: lerp(7, 14, run) * D2R * amp * c0,
    prl: -lerp(3, 4.5, run) * D2R * amp * cm, crl: lerp(1.6, 2.4, run) * D2R * amp * cm, lean: lerp(2.5, 11, run) * D2R * amp, hp: -lerp(1, 5, run) * D2R * amp,
    fL: { p: [lat, fL.y / P.leg, fL.x / P.leg], pitch: fL.pitch, yaw: lerp(0.16, 0.07, amp) }, fR: { p: [lat, fR.y / P.leg, fR.x / P.leg], pitch: fR.pitch, yaw: lerp(0.16, 0.07, amp) },
  };
  // arms swing against the legs; in a run the elbows fold and the forearms drive
  const S = lerp(24, 42, run) * D2R, abd = lerp(6, 9, run) * D2R, rest = armRest();
  for (const sgn of [1, -1]) {
    const sw = -sgn * Math.cos(TAU * (ph - 0.03)), th = lerp(2, -10, run) * D2R + S * sw, eb = lerp(18 + 14 * Math.max(0, sw), 86 + 16 * sw, run) * D2R, th2 = th + eb;
    const d1 = [Math.sin(abd), -Math.cos(th) * Math.cos(abd), Math.sin(th) * Math.cos(abd)], d2 = [-0.16 * run, -Math.cos(th2), Math.sin(th2)];
    const h = [(d1[0] * P.upArm + d2[0] * P.foreArm) / P.arm, (d1[1] * P.upArm + d2[1] * P.foreArm) / P.arm, (d1[2] * P.upArm + d2[2] * P.foreArm) / P.arm];
    out[sgn > 0 ? 'aL' : 'aR'] = { h: mix(rest.h, h, amp), e: mix(rest.e, d1, amp), palm: [-1, 0, 0], fing: FING.relaxed.map((x, i) => lerp(x, lerp(x, FING.grip[i], 0.75), run * amp)), spread: 0.12 };
  }
  out.T = T; out.plant = { L: fL.st ? (fL.x - fL.ax) / P.leg : null, R: fR.st ? (fR.x - fR.ax) / P.leg : null };   // per foot: ankle-minus-contact offset while it is on the ground
  return out;
}

const EXPR = {
  happy: { art: 1, open: 0.5, wide: 0.8, round: 0, smile: 0.95, teeth: 0, browL: 0, browR: 0, browAng: 0, eyeL: 1, eyeR: 1, happy: 0, gx: 0, gy: 0 },
  smile: { art: 0, open: 0, wide: 0.7, round: 0, smile: 0.8, teeth: 0, browL: 0, browR: 0, browAng: 0, eyeL: 1, eyeR: 1, happy: 0, gx: 0, gy: 0 },
  neutral: { art: 0, open: 0, wide: 0.5, round: 0, smile: 0.25, teeth: 0, browL: 0, browR: 0, browAng: 0, eyeL: 1, eyeR: 1, happy: 0, gx: 0, gy: 0 },
  laugh: { art: 0, open: 0.8, wide: 0.9, round: 0, smile: 1, teeth: 0, browL: 0.5, browR: 0.5, browAng: 0, eyeL: 1, eyeR: 1, happy: 1, gx: 0, gy: 0 },
  surprised: { art: 0, open: 0.6, wide: 0.3, round: 0.8, smile: 0, teeth: 0, browL: 1.2, browR: 1.2, browAng: 0, eyeL: 1, eyeR: 1, happy: 0, gx: 0, gy: 0 },
  sad: { art: 0, open: 0, wide: 0.4, round: 0, smile: -0.75, teeth: 0, browL: 0.2, browR: 0.2, browAng: 0.9, eyeL: 0.75, eyeR: 0.75, happy: 0, gx: 0, gy: -0.4 },
  think: { art: 0, open: 0, wide: 0.25, round: 0.25, smile: 0.1, teeth: 0, browL: 1, browR: -0.3, browAng: 0, eyeL: 1, eyeR: 1, happy: 0, gx: 0.5, gy: 0.6 },
  ouch: { art: 0, open: 0.45, wide: 1, round: 0, smile: -0.65, teeth: 1, browL: 0.6, browR: 0.6, browAng: 0.8, eyeL: 0.55, eyeR: 0.55, happy: 0, gx: 0, gy: 0 },
  effort: { art: 0, open: 0.12, wide: 1, round: 0, smile: -0.2, teeth: 1, browL: -0.3, browR: -0.3, browAng: -0.7, eyeL: 0.8, eyeR: 0.8, happy: 0, gx: 0, gy: 0 },
  wink: { art: 0, open: 0.4, wide: 0.85, round: 0, smile: 1, teeth: 0, browL: 0.4, browR: 0, browAng: 0, eyeL: 1, eyeR: 0, happy: 0, gx: 0, gy: 0 },
};
/* Speech sounds (espeak / IPA symbols as Piper reports them) -> mouth shape [open, wide, round, teeth]. */
const VISEME = (() => {
  const m = {}, put = (keys, v) => keys.split(' ').forEach((k) => (m[k] = v));
  put('_ . , ! ? : ;', [0, 0.5, 0, 0]);
  put('p b m', [0, 0.45, 0, 0]);
  put('f v ʋ', [0.08, 0.55, 0, 1]);
  put('a aː ɐ ɑ ɑː', [0.85, 0.7, 0, 0]);
  put('ɛ e eː ɛː ə ɜ æ', [0.48, 0.82, 0, 0.3]);
  put('ɪ i iː j', [0.24, 1, 0, 0.6]);
  put('ɔ o oː', [0.55, 0.3, 0.8, 0]);
  put('ʊ u uː w', [0.24, 0.1, 1, 0]);
  put('y yː ʏ', [0.2, 0.1, 1, 0]);
  put('ø øː œ', [0.42, 0.2, 0.85, 0]);
  put('s z t d n ts', [0.16, 0.8, 0, 1]);
  put('ʃ ʒ tʃ', [0.22, 0.25, 0.65, 0.6]);
  put('l ɾ r ʁ', [0.3, 0.6, 0, 0.3]);
  put('k g ɡ ŋ x ç h', [0.3, 0.6, 0, 0.2]);
  return m;
})();
const visemeOf = (ph) => VISEME[ph] || VISEME[ph[0]] || [0.3, 0.6, 0, 0.2];
/* The same sounds as an index into a painted mouth set: 0 rest, 1 M/B/P, 2 A, 3 E, 4 I/S, 5 O, 6 U, 7 F/W, 8 laugh. */
const MOUTH_ID = (() => {
  const m = {}, put = (keys, v) => keys.split(' ').forEach((k) => (m[k] = v));
  put('_ . , ! ? : ;', 0); put('p b m', 1); put('a aː ɐ ɑ ɑː', 2); put('ɛ e eː ɛː ə ɜ æ l ɾ r ʁ k g ɡ ŋ x ç h c', 3); put('ɪ i iː j s z t d n ts', 4);
  put('ɔ o oː ø øː œ', 5); put('ʊ u uː w y yː ʏ ʃ ʒ tʃ', 6); put('f v ʋ', 7); return m;
})();
const mouthIdOf = (ph) => (MOUTH_ID[ph] != null ? MOUTH_ID[ph] : MOUTH_ID[ph[0]] != null ? MOUTH_ID[ph[0]] : 3);
/* Speech track for the mouth, built the way a 2D animator would: vowels and lip closures get a shape, most
   consonants simply keep the shape around them, and nothing is held for less than about two frames. */
const MOUTH_VEC = [[0, 0.5, 0, 0], [0, 0.45, 0, 0], [0.7, 0.7, 0, 0], [0.4, 0.8, 0, 0.3], [0.18, 1, 0, 0.6], [0.46, 0.3, 0.8, 0], [0.2, 0.1, 1, 0], [0.07, 0.55, 0, 1]];
function mouthTrack(vis) {
  const KEEP = -1, segs = [];
  for (let i = 0; i < vis.length - 1; i++) {
    const p = vis[i][1], c = p[0], d = vis[i + 1][0] - vis[i][0]; let id;
    if ('_.,!?:;'.includes(p)) id = d >= 0.13 ? 0 : KEEP;
    else if ('pbm'.includes(c)) id = 1; else if ('fvʋ'.includes(c)) id = 7;
    else if ('aɐɑ'.includes(c)) id = d >= 0.1 ? 2 : 3; else if ('ɛeæ'.includes(c)) id = 3; else if ('əɜ'.includes(c)) id = d >= 0.06 ? 3 : KEEP;
    else if ('ɪij'.includes(c)) id = d >= 0.05 ? 4 : KEEP; else if ('ɔoøœ'.includes(c)) id = 5; else if ('ʊuyʏw'.includes(c)) id = 6; else if ('ʃʒ'.includes(c)) id = d >= 0.07 ? 6 : KEEP;
    else if ('sz'.includes(c)) id = d >= 0.09 ? 4 : KEEP; else id = KEEP;
    segs.push({ t: vis[i][0], d, id });
  }
  // consonants without a shape of their own: hold the previous shape, or lean into the coming vowel after a closure
  for (let i = 0; i < segs.length; i++) if (segs[i].id === KEEP) {
    const prev = i ? segs[i - 1].id : 0; let nx = -1; for (let j = i + 1; j < segs.length && segs[j].t - segs[i].t < 0.14; j++) if (segs[j].id !== KEEP) { nx = segs[j].id; break; }
    segs[i].id = (prev === 0 || prev === 1 || prev === 7) && nx > 1 && nx !== 7 ? nx : prev === 0 || prev === 1 ? 3 : prev;
  }
  const keys = []; for (const g of segs) { if (keys.length && keys[keys.length - 1].id === g.id) keys[keys.length - 1].d += g.d; else keys.push({ t: g.t, d: g.d, id: g.id }); }
  // nothing shorter than ~80 ms, except lip closures, which only need to be seen
  for (let pass = 0; pass < 3; pass++) for (let i = keys.length - 1; i > 0; i--) { const k = keys[i], min = k.id === 1 || k.id === 7 ? 0.045 : 0.08; if (k.d < min && i < keys.length - 1) { keys[i - 1].d += k.d; keys.splice(i, 1); if (i < keys.length && keys[i].id === keys[i - 1].id) { keys[i - 1].d += keys[i].d; keys.splice(i, 1); } } }
  for (let i = 1; i < keys.length; i++) { const k = keys[i]; if (k.id === 1 && k.d < 0.065) { const take = Math.min(0.065 - k.d, keys[i - 1].d - 0.05); if (take > 0) { k.t -= take; k.d += take; keys[i - 1].d -= take; } } }
  return keys.map((k) => [k.t, k.id]);
}
const EXPR_MOUTH = { happy: 0, smile: 0, neutral: 1, laugh: 8, surprised: 5, wink: 0, sad: 9, think: 1, ouch: 4, effort: 4 };   // 9 = the rest mouth turned upside down   // expressions that have a painted mouth

class Actor {
  constructor(skin, o = {}) {
    this.ch = new Character(skin); this.skin = skin; this.multi = !!(skin.cut && skin.cut.views && skin.art); this.cut = !!(skin.cut && skin.art) && !this.multi;
    this.x = o.x || 0; this.z = o.z || 0; this.gy = o.gy || 0; this.dir = o.dir || 1; this.restYaw = skin.restYaw == null ? (this.cut ? 0.35 : 0.3) : skin.restYaw;
    this.heading = o.heading == null ? (PI / 2) * this.dir : o.heading; this.yaw = o.yaw == null ? this.restYaw * this.dir : o.yaw; this.fixedYaw = o.yaw != null ? o.yaw : null;
    this.v = 0; this.ph = 0; this.run = 0; this.amp = 0; this.step = 0; this.acc = 0; this.leanA = 0; this.target = null; this.layers = []; this.t = 0;
    this.expr = 'happy'; this.face = faceRest(); Object.assign(this.face, EXPR.happy); this.blink = 2 + Math.random() * 2; this.blinkT = -1; this.speech = null; this.mouth = [0, 0.5, 0, 0]; this.talk = 0;
    this.look = null; this.hold = null; this.idleArms = o.idleArms || null;
  }
  get P() { return this.ch.P; }
  get J() { return this.ch.J; }
  turnTo(yaw) { this.fixedYaw = yaw; }   // fix the body angle (0 = towards the viewer), or null to let her face where she goes
  near() { return this.cut || this.multi ? (this.ch.facing == null ? (this.dir > 0 ? 'R' : 'L') : this.ch.facing > 0 ? 'R' : 'L') : 'R'; }
  speedOf(run) { return (run ? 1.12 : 0.4) * Math.sqrt(GRAV * this.P.hipH); }

  /* ----- commands (each returns a promise that resolves when it is finished) ----- */
  moveTo(x, z, o = {}) { return new Promise((res) => { if (this.target && this.target.res) this.target.res(); this.target = { x, z: z == null ? this.z : z, run: !!o.run, speed: o.speed, res, stopAt: o.stopAt == null ? 0.02 : o.stopAt, keep: !!o.keep }; }); }
  walkTo(x, z, o) { return this.moveTo(x, z, Object.assign({}, o, { run: false })); }
  runTo(x, z, o) { return this.moveTo(x, z, Object.assign({}, o, { run: true })); }
  faceDir(d) { this.dir = d; if (!this.target) this.heading = (PI / 2) * d; }
  setExpr(name) { this.expr = name; }
  // play an action: fn(t, actor) -> partial pose. o: { dur, in, out, hold (keep until stopped), key }
  play(fn, o = {}) {
    return new Promise((res) => {
      const L = { fn, t: 0, dur: o.dur == null ? fn.dur || 1.5 : o.dur, tin: o.in == null ? fn.tin || 0.22 : o.in, tout: o.out == null ? fn.tout || 0.25 : o.out, hold: !!o.hold, key: o.key || fn.key || 'act', res, w: 0, ending: false, arg: o.arg };
      for (const l of this.layers) if (l.key === L.key && !l.ending) { l.ending = true; l.te = 0; l.w0 = l.w; if (l.res) { l.res(); l.res = null; } }
      this.layers.push(L);
    });
  }
  stop(key) { for (const l of this.layers) if ((!key || l.key === key) && !l.ending) { l.ending = true; l.te = 0; l.w0 = l.w; if (l.res) { l.res(); l.res = null; } } }
  wait(sec) { return new Promise((res) => { this._waits = this._waits || []; this._waits.push({ t: sec, res }); }); }
  // lip sync: visemes = [[startSeconds, phoneme], ...], clock() = seconds into the clip (audio time), or null when it ended
  speak(visemes, clock) { this.speech = { v: mouthTrack(visemes), clock, i: 0 }; }

  update(dt) {
    dt = Math.min(dt, 0.05); this.t += dt; const P = this.P;
    if (this._waits) { for (const w of this._waits) { w.t -= dt; if (w.t <= 0) w.res(); } this._waits = this._waits.filter((w) => w.t > 0); }
    /* locomotion */
    const tg = this.target, v0 = this.v; let stepping = 0;
    if (tg) {
      const dx = tg.x - this.x, dz = tg.z - this.z, dist = Math.hypot(dx, dz), want = Math.atan2(dx, dz);
      let dh = wrapPi(want - this.heading);
      if (this.multi && Math.abs(dh) > 2.6) dh = -Math.sign(this.heading || 1) * Math.abs(dh);     // turn round by way of the viewer
      const rate = this.multi && Math.abs(dh) > 0.9 ? 5.4 : tg.run ? 3.4 : 4.6, turning = this.multi && Math.abs(dh) > 0.9;
      if (this.cut && Math.abs(dh) > 1.75) this.heading = want; else this.heading += clamp(dh, -dt * rate, dt * rate);
      const vmax = tg.speed || this.speedOf(tg.run), dec = tg.run ? 3.6 : 2.6, vt = turning ? 0 : tg.keep ? vmax : Math.min(vmax, Math.sqrt(2 * dec * Math.max(0, dist - tg.stopAt)) + 0.12);
      const accel = tg.run ? 3.4 : 2.2; this.v += clamp(vt - this.v, -(turning ? 9 : dec) * dt, accel * dt);
      if (!turning && (dist <= tg.stopAt + this.v * dt || (dist < 0.06 && this.v < 0.2))) { if (!tg.keep) { this.x = tg.x; this.z = tg.z; this.v = Math.min(this.v, 0.25); } this.target = null; tg.res(); }
      else { this.x += Math.sin(this.heading) * this.v * dt; this.z += Math.cos(this.heading) * this.v * dt; }
      const sx = Math.sin(this.heading); if (Math.abs(sx) > 0.3) this.dir = sx > 0 ? 1 : -1;
    } else this.v = Math.max(0, this.v - 3 * dt);
    this.acc = lerp(this.acc, (this.v - v0) / dt, 1 - Math.exp(-dt * 8));
    const vW = this.speedOf(false), moving = this.v > 0.03;
    this.amp = lerp(this.amp, moving ? clamp(this.v / (0.55 * vW), 0.25, 1) : 0, 1 - Math.exp(-dt * (moving ? 9 : 7)));
    this.run = lerp(this.run, seg(this.v, vW * 1.3, vW * 1.95), 1 - Math.exp(-dt * 6));
    // body yaw: profile while travelling, the skin's rest angle when standing
    const yawT = this.fixedYaw != null ? this.fixedYaw : moving || tg ? this.heading : this.restYaw * this.dir;
    const dy = wrapPi(yawT - this.yaw), yaw0 = this.yaw;
    if (this.cut && Math.abs(dy) > 1.9) this.yaw = yawT; else if (this.multi) this.yaw += clamp(dy * (1 - Math.exp(-dt * 12)), -dt * 5.4, dt * 5.4); else this.yaw += dy * (1 - Math.exp(-dt * 9));
    // turning on the spot is done with small steps, not by sliding the feet
    this.step = lerp(this.step, clamp(Math.abs(wrapPi(this.yaw - yaw0)) / dt / 2.2, 0, 1) * (1 - this.amp), 1 - Math.exp(-dt * 10)); stepping = this.step;
    const gp = gaitPose(P, this.ph, Math.max(this.v, 0.001), this.run, this.amp, stepping);
    if (this.amp > 0.02) this.ph = (this.ph + dt / gp.T) % 1; else if (stepping > 0.08) this.ph = (this.ph + dt / 0.62) % 1;
    this.leanA = lerp(this.leanA, clamp(this.acc * 0.03, -0.14, 0.14), 1 - Math.exp(-dt * 6));

    /* assemble the pose */
    const pose = basePose(), sk = this.skin, t = this.t;
    pose.x = this.x; pose.z = this.z; pose.gy = this.gy; pose.yaw = this.yaw;
    if (sk.stance) { const nr = this.dir > 0 ? 'fR' : 'fL', fr = this.dir > 0 ? 'fL' : 'fR'; blendInto(pose[nr], sk.stance.near, 1); blendInto(pose[fr], sk.stance.far, 1); }
    if (sk.idleArms) blendInto(pose, sk.idleArms, 1);
    if (this.idleArms) blendInto(pose, this.idleArms, 1);
    // breathing and small idle life
    const br = Math.sin(t * 1.9), idle = 1 - this.amp;
    pose.py += 0.004 * br * idle; pose.cpitch += 0.012 * br * idle; pose.shL += 0.25 * (br * 0.5 + 0.5) * idle; pose.shR += 0.25 * (br * 0.5 + 0.5) * idle;
    pose.hr += 0.02 * Math.sin(t * 0.7 + 1) * idle; pose.hp += 0.015 * Math.sin(t * 0.53) * idle; pose.crl += 0.008 * Math.sin(t * 0.61) * idle;
    for (const n of ['aL', 'aR']) { pose[n].h[2] += 0.012 * Math.sin(t * 1.1 + (n === 'aL' ? 0 : 2)) * idle; }
    const plant = gp.plant; delete gp.plant; delete gp.T; const gw = Math.max(this.amp, stepping * 0.9); if (gw > 0.003) blendInto(pose, gp, gw);
    pose.lean += this.leanA;
    // action layers
    for (const l of this.layers) {
      l.t += dt;
      if (!l.ending && !l.hold && l.t >= l.dur - l.tout) { l.ending = true; l.te = 0; l.w0 = l.w; if (l.res) { l.res(); l.res = null; } }
      if (l.ending) { l.te += dt; l.w = l.w0 * (1 - ss(l.te / l.tout)); if (l.te >= l.tout) l.dead = true; } else l.w = Math.max(l.w, ss(l.t / l.tin));
      const part = l.fn(l.t, this, l);
      if (part) blendInto(pose, part, l.w);
    }
    this.layers = this.layers.filter((l) => !l.dead);
    // objects held in the hands override the arm targets last
    if (this.hold) this.hold(pose, this);

    /* face */
    let en = this.expr; for (const l of this.layers) if (!l.ending && l.fn.expr) en = l.fn.expr;
    const E = EXPR[en] || EXPR.happy, fa = this.face, kf = 1 - Math.exp(-dt * 13);
    let speaking = false, mt = [0, 0.5, 0, 0], sid = 0;
    if (this.speech) {
      const tc = this.speech.clock();
      if (tc == null) this.speech = null;
      else {
        speaking = true; const vs = this.speech.v; let i = this.speech.i; const ta = tc + 0.02;   // lips lead the sound by about one frame
        while (i < vs.length - 1 && vs[i + 1][0] <= ta) i++; while (i > 0 && vs[i][0] > ta) i--; this.speech.i = i;
        sid = vs[i][1]; mt = MOUTH_VEC[sid];
      }
    }
    this.talk = lerp(this.talk, speaking ? 1 : 0, 1 - Math.exp(-dt * (speaking ? 30 : 9)));
    const km = 1 - Math.exp(-dt * 24); for (let j = 0; j < 4; j++) this.mouth[j] = lerp(this.mouth[j], mt[j], km);
    for (const key in E) fa[key] = lerp(fa[key], E[key], kf);
    Object.assign(pose.face, fa); pose.face.mid = speaking ? sid : EXPR_MOUTH[en] != null ? EXPR_MOUTH[en] : -1;
    if (this.talk > 0.01) { const w = this.talk, f = pose.face; f.art = fa.art * (1 - w); f.msc = lerp(1, 0.86, w); f.open = lerp(fa.open, this.mouth[0] * 0.85, w); f.wide = lerp(fa.wide, this.mouth[1], w); f.round = lerp(fa.round, this.mouth[2], w); f.teeth = lerp(fa.teeth, this.mouth[3], w); f.smile = lerp(fa.smile, Math.max(0.15, fa.smile * 0.45), w); f.happy = fa.happy * (1 - w); }
    this.blink -= dt; if (this.blink <= 0) { this.blinkT = 0; this.blink = 2.2 + Math.random() * 3.2; }
    if (this.blinkT >= 0) { this.blinkT += dt; const b = this.blinkT, o = b < 0.06 ? 1 - b / 0.06 : b < 0.1 ? 0 : b < 0.2 ? (b - 0.1) / 0.1 : 1; pose.face.eyeL *= o; pose.face.eyeR *= o; if (b > 0.2) this.blinkT = -1; }
    if (this.look) { const J0 = this.ch.J; if (J0) { const d = sub(this.look, J0.head), yl = wrapPi(Math.atan2(d[0], d[2]) - this.yaw); pose.hy += clamp(yl, -0.9, 0.9) * 0.7; pose.hp += clamp(-Math.atan2(d[1], Math.hypot(d[0], d[2])), -0.5, 0.5) * 0.6; } }
    /* planted feet: a foot that is on the ground stays on its spot in the world, whatever the body is doing
       (speeding up, slowing down, blending in or out of the gait). The correction fades out during the swing. */
    if (!this.locks) this.locks = { L: { on: false, off: 0 }, R: { on: false, off: 0 } };
    if (this._lx != null && Math.hypot(this.x - this._lx, this.z - this._lz) > 0.4) for (const n of ['L', 'R']) { this.locks[n].on = false; this.locks[n].off = 0; }   // she was moved by the scene
    this._lx = this.x; this._lz = this.z;
    { const Fx = Math.sin(this.yaw), Fz = Math.cos(this.yaw), leg = P.leg;
      for (const n of ['L', 'R']) {
        const f = pose['f' + n], K = this.locks[n], planted = !this.noPlant && this.amp > 0.02 && stepping < 0.3 && plant[n] != null && f.p[1] < 0.06;
        if (planted) {
          const cont = f.p[2] - this.amp * plant[n];
          if (!K.on) { K.on = true; K.cx = this.x + Fx * (cont + K.off) * leg; K.cz = this.z + Fz * (cont + K.off) * leg; }
          const rel = ((K.cx - this.x) * Fx + (K.cz - this.z) * Fz) / leg; K.off = rel - cont;
          if (Math.abs(K.off) > 0.5) { K.on = false; K.off = 0; }
        } else { K.on = false; K.off *= Math.exp(-dt * 16 * clamp(f.p[1] / 0.03, 0, 1)); }   // let go only while the foot is in the air; standing feet stay where the last step put them
        f.p[2] += K.off;
      } }
    this.ch.pose = pose; this.ch.solve(); this.ch.step(dt);
  }
  draw(ctx, cam, groups) { this.ch.draw(cam, groups); }
}
