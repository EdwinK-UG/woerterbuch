// Liv 3D · the player. Procedural animation for any humanoid VRM: walk and run with planted feet, idle life, hands,
// expressions, the 27 actions, props and a satchel. Plain ES module; needs 'three' (r160) and '@pixiv/three-vrm' (3.x)
// in the page's import map. See docs/liv3d.md.
//
//   const liv = await LivActor.load('models/liv.vrm'); scene.add(liv.root);
//   liv.walk(); liv.play('wave'); liv.setExpression('laugh'); ... liv.update(dt) every frame.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { Rig, V3, Q, clamp, lerp, smooth, wrapPi, qYPR, qAxis, alignQ, solve2 } from './rig.js';
import { Hand, shapeRow, SHAPE_NAMES } from './hands.js';
import { Face, EXPRESSION_NAMES } from './face.js';
import { ACTIONS, ACTION_NAMES } from './actions.js';
import { makeProp, Satchel } from './props.js';

export { ACTION_NAMES, EXPRESSION_NAMES, SHAPE_NAMES };
const D2R = Math.PI / 180;

// the 2D rig's tuned gait for a child with 0.39 m legs; vN is the speed scaled to that child (Froude number)
const cadence0 = (vN) => 1.9 + (1.0 * Math.min(vN, 0.9)) / 0.9 + Math.max(0, vN - 0.9) * 0.45;      // steps per second
const stanceOf = (vN) => 0.62 - 0.26 * smooth((vN - 0.9) / 1.1);                                    // share of the stride on the ground

const restArm = () => ({ h: [0.09, -0.985, 0.04], e: [0.25, -0.2, -1], palm: [-1, 0, 0], row: shapeRow('relaxed'), bend: 0, m: 0, free: 0, chin: 0 });
const basePose = () => ({ py: 0.985, psx: 0, psf: 0, ptw: 0, prl: 0, lean: 0, cpitch: 0, ctw: 0, crl: 0, hy: 0, hp: 0, hr: 0, shL: 0, shR: 0, hop: 0, knees: 0,
  aL: restArm(), aR: restArm(), fL: { p: [1, 0, 0], pitch: 0 }, fR: { p: [1, 0, 0], pitch: 0 } });
const LOWER = new Set(['py', 'psx', 'psf', 'prl', 'hop', 'fL', 'fR', 'knees']);
function blendInto(a, b, w, wLow = w) {
  for (const k in b) {
    const bv = b[k], av = a[k], ww = LOWER.has(k) ? wLow : w;
    if (bv == null || ww <= 0) continue;
    if (typeof bv === 'number') a[k] = av == null ? bv * ww : av + (bv - av) * ww;
    else if (Array.isArray(bv)) { if (!av) a[k] = bv.slice(); else for (let i = 0; i < bv.length; i++) av[i] += (bv[i] - av[i]) * ww; }
    else if (typeof bv === 'object') { if (!av) a[k] = {}; blendInto(a[k], bv, ww, ww); }
  }
  return a;
}
// world (actor.root space, ground plane) <-> body space for a body at (x, z) turned by yaw
const toBody = (wx, wz, x, z, yaw) => { const dx = wx - x, dz = wz - z, c = Math.cos(yaw), s = Math.sin(yaw); return [dx * c - dz * s, dx * s + dz * c]; };
const toWorld = (bx, bz, x, z, yaw) => { const c = Math.cos(yaw), s = Math.sin(yaw); return [x + bx * c + bz * s, z - bx * s + bz * c]; };

export class LivActor {
  /** Load a VRM and build the actor. opts: { scale (default 1), seed, satchel (bool), onProgress } */
  static async load(url, opts = {}) {
    const loader = new GLTFLoader(); loader.register((p) => new VRMLoaderPlugin(p));
    const gltf = await loader.loadAsync(url, opts.onProgress);
    const vrm = gltf.userData.vrm;
    VRMUtils.removeUnnecessaryVertices && VRMUtils.removeUnnecessaryVertices(gltf.scene);
    if (vrm.meta && vrm.meta.metaVersion === '0') VRMUtils.rotateVRM0(vrm);
    vrm.scene.traverse((o) => { o.frustumCulled = false; });
    return new LivActor(vrm, opts);
  }

  constructor(vrm, opts = {}) {
    this.vrm = vrm; this.opts = opts;
    this.root = new THREE.Group(); this.root.name = 'LivActor';
    this.body = new THREE.Group(); this.body.name = 'body'; this.root.add(this.body);
    vrm.scene.scale.setScalar(opts.scale || 1); this.body.add(vrm.scene);
    this.rig = new Rig(vrm, this.body); const M = this.rig.M;
    this.walkSpeed = 0.9 / M.k; this.runSpeed = 2.5 / M.k;
    this.hands = { L: new Hand(this.rig, 'L', 0.3), R: new Hand(this.rig, 'R', 1.7) };
    this.face = new Face(vrm);
    this.gaze = new THREE.Object3D(); this.root.add(this.gaze);
    if (vrm.lookAt) { vrm.lookAt.target = this.gaze; vrm.lookAt.autoUpdate = true; }
    this.shadow = makeShadow(M.leg); this.root.add(this.shadow);
    this.springs = true; this.air = 1;
    // spring bones are simulated relative to a centre that trails the body: hair and skirt swing on speed changes,
    // turns and the gait's bounce, but do not stream as in a wind at constant speed
    this.springCenter = new THREE.Object3D(); this.springCenter.name = 'springCenter'; this.root.add(this.springCenter);
    const sb = vrm.springBoneManager;
    if (sb) for (const j of sb.joints) { j.userData = j.userData || {}; j._liv = { g: j.settings.gravityPower, dir: j.settings.gravityDir.clone(), stiff: j.settings.stiffness, drag: j.settings.dragForce }; }
    this.reset(opts);
  }

  /** Back to standing at (x, z) facing yaw, nothing playing (also used by replay). */
  reset(o = {}) {
    const M = this.rig.M;
    this.t = 0; this.x = o.x || 0; this.z = o.z || 0; this.yaw = o.yaw || 0; this.yawRate = 0;
    this.v = 0; this.acc = 0; this.leanA = 0; this.rw = 0; this.gw = 0; this.phi = 0; this.frozen = true; this.move = 0;
    this.cmd = null; this.target = null; this.fixedYaw = null; this.layers = []; this.lookTarget = null;
    this.handOverride = { L: null, R: null }; this.exprName = 'happy';
    this.face = new Face(this.vrm); this.face.set('happy', 1);
    this.hands = { L: new Hand(this.rig, 'L', 0.3), R: new Hand(this.rig, 'R', 1.7) };
    this.feet = {};
    for (const S of ['L', 'R']) {
      const a = this.neutral(S);
      this.feet[S] = { planted: true, ax: a[0], az: a[1], yaw: a[2], sp: 1, lx: a[0], lz: a[1], lyaw: a[2], lpitch: 0, pitch: 0, flat: 0, ankle: null };
    }
    if (this.prop && this.prop.flying) this.prop = null;
    this.flying = [];
    this.stats = { maxOver: 0 }; this._pelY = null;
    this._place(); this.update(0);
    this.springCenter.position.set(this.x, 0, this.z); this.springCenter.updateMatrixWorld();
    const sb = this.vrm.springBoneManager; if (sb) { for (const j of sb.joints) j.center = this.springCenter; sb.reset(); }
  }
  _springs(dt) {
    const c = this.springCenter, k = 1 - Math.exp(-dt / 0.18);
    c.position.x += (this.x - c.position.x) * k; c.position.z += (this.z - c.position.z) * k; c.updateMatrixWorld();
    // a little air: gravity tilts back with speed (body frame), so a run trails the hair a bit
    const sb = this.vrm.springBoneManager; if (!sb) return;
    const vn = this.vN || 0, back = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).applyQuaternion(this.root.getWorldQuaternion(new THREE.Quaternion()));
    for (const j of sb.joints) { const o = j._liv; if (!o) continue; j.settings.gravityPower = o.g + this.air * 0.12 * vn * vn; j.settings.gravityDir.copy(o.dir).multiplyScalar(1).addScaledVector(back, this.air * 0.35 * vn).normalize(); }
  }

  /* ---------------- commands ---------------- */
  setVelocity(speed, heading = this.yaw) { this.target = null; this.cmd = { speed: Math.max(0, speed), heading }; if (speed > 0) this.fixedYaw = null; }
  walk(heading) { this.setVelocity(this.walkSpeed, heading == null ? this.yaw : heading); }
  run(heading) { this.setVelocity(this.runSpeed, heading == null ? this.yaw : heading); }
  stop() { this.cmd = null; if (this.target && this.target.res) this.target.res(false); this.target = null; }
  /** Walk (or run) to (x, z) in actor.root space; resolves on arrival. opts: { run, speed } */
  moveTo(x, z, o = {}) {
    return new Promise((res) => { if (this.target && this.target.res) this.target.res(false); this.cmd = null; this.fixedYaw = null; this.target = { x, z, run: !!o.run, speed: o.speed, res }; });
  }
  /** Turn on the spot (small steps) to face yaw (radians, 0 = +Z of actor.root); null = free. */
  turnTo(yaw) { this.fixedYaw = yaw; }
  /** Face a point (x, z). */
  turnToward(x, z) { this.turnTo(Math.atan2(x - this.x, z - this.z)); }
  /** Play an action by name or 1-based number. opts: { side: 'R'|'L' (gesturing arm), dur, in, out, hold }. Resolves when it ends. */
  play(name, o = {}) {
    if (typeof name === 'number') name = ACTION_NAMES[name - 1];
    const fn = ACTIONS[name]; if (!fn) return Promise.resolve(false);
    if (name === 'throw' && !this.prop) this.holdProp('apple');
    if (name === 'carry' && !(this.prop && this.prop.name === 'crate')) { this.holdProp('crate'); return Promise.resolve(true); }
    return new Promise((res) => {
      const L = { name, fn, t: 0, dur: o.dur ?? fn.dur, tin: o.in ?? fn.tin, tout: o.out ?? fn.tout, hold: !!o.hold, key: o.key || fn.key, w: 0, ending: false, side: o.side || 'R', res };
      for (const l of this.layers) if (l.key === L.key && !l.ending) this._end(l);
      this.layers.push(L);
    });
  }
  stopAction(key) { for (const l of this.layers) if ((!key || l.key === key) && !l.ending) this._end(l); }
  _end(l) { l.ending = true; l.te = 0; l.w0 = l.w; if (l.res) { l.res(true); l.res = null; } }
  /** Hand shape override for one hand (null = back to what the pose wants). grip 0..1 for the grip shapes. */
  setHand(side, shape, grip = 0) { this.handOverride[side] = shape ? { shape, grip } : null; }
  setExpression(name, amount = 1) { this.exprName = name; this.face.set(name, amount); }
  blink() { this.face.blink(); }
  /** Look at a point in actor.root space (head turns part of the way, eyes the rest), or null for idle glances. */
  lookAt(p) { this.lookTarget = p ? p.clone() : null; }
  /** 'apple' | 'crate' | 'sawHandle' | null */
  holdProp(name) {
    if (this.prop) { this.body.remove(this.prop.mesh); this.prop = null; }
    this.stopAction('hold');
    if (!name) return;
    const mesh = makeProp(name, this.rig.M.ls); this.body.add(mesh);
    this.prop = { name, mesh };
    this.play(name === 'crate' ? 'carry' : 'holdOne', { hold: true, key: 'hold' });
  }
  attachSatchel(on = true) {
    if (this.satchel) { this.body.remove(this.satchel.group); this.satchel = null; }
    if (on) { this.satchel = new Satchel(this); this.body.add(this.satchel.group); this.satchel.update(); }
  }
  get position() { return V3(this.x, 0, this.z); }
  get speed() { return this.v; }

  /* ---------------- per frame ---------------- */
  update(dt) {
    let n = Math.max(1, Math.ceil(dt / (1 / 60) - 1e-6)); const h = dt / n;
    if (dt === 0) { n = 1; }
    for (let i = 0; i < n; i++) this._tick(h, i === n - 1);
  }
  _tick(dt, last) {
    this.t += dt;
    this._locomotion(dt);
    const pose = this._pose(dt);
    this._solve(pose, dt);
    this.face.update(dt);
    this._gaze();
    this._place();
    if (this.prop || this.flying.length) this._props(dt);
    if (this.satchel && last) this.satchel.update();
    this._shadow();
    this._springs(dt);
    const sb = this.vrm.springBoneManager;
    if (sb && !this.springs) { this.vrm.springBoneManager = null; this.vrm.update(dt); this.vrm.springBoneManager = sb; } else this.vrm.update(dt);
  }
  _place() { this.body.position.set(this.x, 0, this.z); this.body.rotation.set(0, this.yaw, 0); this.body.updateMatrixWorld(true); }
  neutral(S) {
    const M = this.rig.M, a = M[S].ankle, lat = this._lat || 1, toe = M[S].sgn * lerp(0.12, 0.05, this.move || 0);
    const [wx, wz] = toWorld(a.x * lat, a.z, this.x, this.z, this.yaw);
    return [wx, wz, this.yaw + toe];
  }

  _locomotion(dt) {
    const M = this.rig.M, k = M.k;
    // desired speed and heading
    let vT = 0, hT = this.yaw, run = false;
    if (this.target) {
      const tg = this.target, dx = tg.x - this.x, dz = tg.z - this.z, dist = Math.hypot(dx, dz);
      run = tg.run; const vmax = tg.speed || (run ? this.runSpeed : this.walkSpeed), dec = 0.85 + 0.6 * vmax * k;
      hT = dist > 0.02 ? Math.atan2(dx, dz) : this.yaw;
      vT = Math.min(vmax, Math.sqrt(2 * dec * Math.max(0, dist - 0.005)));
      const dh = Math.abs(wrapPi(hT - this.yaw));
      if (dist < 0.025 || (dist < 0.25 && dh > 1.6)) { this.target = null; tg.res(true); vT = 0; hT = this.yaw; }
    } else if (this.cmd) { vT = this.cmd.speed; hT = this.cmd.heading; }
    else if (this.fixedYaw != null) hT = this.fixedYaw;
    // turn: while moving the body bends the path; a big change is done slowly, or on the spot
    const dh = wrapPi(hT - this.yaw), moving = this.v > 0.05 / k;
    if (Math.abs(dh) > 1.2 && vT > 0) vT = Math.min(vT, 0.3 / k);
    const rate = moving ? lerp(3.6, 2.4, this.rw) : 2.2;
    const wantRate = clamp(dh * 6, -rate, rate);
    this.yawRate = lerp(this.yawRate, wantRate, 1 - Math.exp(-dt * 10));
    if (!moving && this.frozen && Math.abs(dh) < 0.003) this.yawRate = 0;
    this.yaw = wrapPi(this.yaw + this.yawRate * dt);
    // speed: speeds up and slows over several steps
    const v0 = this.v, vN = this.v * k, a = vT > this.v ? 0.8 + 0.65 * Math.max(vN, vT * k * 0.5) : 0.9 + 0.75 * vN;
    this.v = vT > this.v ? Math.min(vT, this.v + a * dt) : Math.max(vT, this.v - a * dt);
    this.x += Math.sin(this.yaw) * this.v * dt; this.z += Math.cos(this.yaw) * this.v * dt;
    this.acc = lerp(this.acc, dt > 0 ? (this.v - v0) / dt : 0, 1 - Math.exp(-dt * 8));
    this.leanA = lerp(this.leanA, clamp(this.acc * 0.03, -0.12, 0.12), 1 - Math.exp(-dt * 6));
    // gait parameters at this speed
    const v = this.v, vn = v * k;
    this.vN = vn; this.cad = k * cadence0(vn); this.T = 2 / this.cad;
    // stance share from the 2D rig (62 % walking .. 36 % running), limited so the body travels at most ~1.05 leg
    // lengths over a planted foot (a straight-ish leg cannot reach further without the hips dropping)
    this.sg = Math.max(0.24, Math.min(stanceOf(vn), (1.05 * M.leg) / Math.max(1e-3, v * this.T)));
    this.rw = lerp(this.rw, smooth((vn - 1.2) / 0.8), 1 - Math.exp(-dt * 8));
    this.move = smooth(vn / 0.5);
    this._lat = lerp(1, 0.85, smooth(vn / 0.9)) * lerp(1, 0.65, this.rw);
    // stepping: walking, turning, or a foot that is not under the body yet
    const F = this.feet, err = (S) => { const n = this.neutral(S), f = F[S]; return [Math.hypot(f.ax - n[0], f.az - n[1]) / M.leg, Math.abs(wrapPi(f.yaw - n[2]))]; };
    const eL = err('L'), eR = err('R');
    if (this.frozen) {
      const want = vT > 0.02 || v > 0.02 || Math.abs(dh) > 0.3 || eL[0] > 0.07 || eR[0] > 0.07 || eL[1] > 0.35 || eR[1] > 0.35;
      if (want) {
        this.frozen = false;
        const lead = Math.abs(dh) > 0.3 ? (dh > 0 ? 'L' : 'R') : eL[0] + eL[1] > eR[0] + eR[1] ? 'L' : 'R';
        this.phi = lead === 'R' ? this.sg : (this.sg + 0.5) % 1;
      }
    }
    this.gw = lerp(this.gw, this.frozen ? 0 : 1, 1 - Math.exp(-dt * (this.frozen ? 6 : 10)));
    if (this.frozen) return;
    const phi0 = this.phi;
    // the next step comes early when a planted foot is left further behind than the stride it landed for (slowing
    // down: the stance share grows and would leave the foot behind out of reach)
    let boost = 1;
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    for (const S of ['L', 'R']) {
      const f = F[S]; if (!f.planted || f.expBack == null) continue;
      const back = -((f.ax - this.x) * fx + (f.az - this.z) * fz);
      boost = Math.max(boost, 1 + clamp((back - f.expBack) / (0.1 * M.leg), 0, 0.6));
    }
    this.boost = lerp(this.boost || 1, boost, 1 - Math.exp(-dt * 12));
    boost = this.boost;
    this.phi = (this.phi + dt * boost * this.cad / 2) % 1;
    this._stepFoot('R', this.phi, (phi0) % 1, dt);
    this._stepFoot('L', (this.phi + 0.5) % 1, (phi0 + 0.5) % 1, dt);
    const settled = eL[0] < 0.025 && eR[0] < 0.025 && eL[1] < 0.1 && eR[1] < 0.1;
    if (F.L.planted && F.R.planted && vT === 0 && v < 0.03 && Math.abs(this.yawRate) < 0.08 && Math.abs(dh) < 0.05 && settled) this.frozen = true;
  }
  // heel / ball rocker: the ankle relative to the flat-foot spot (forward, up) at a given foot pitch (+ = toes up)
  _pivot(S, p) {
    const m = this.rig.M[S], hb = m.heel, bf = m.toeF, aH = m.ankleH;
    if (p >= 0) return [-hb + hb * Math.cos(p) - aH * Math.sin(p), hb * Math.sin(p) + aH * Math.cos(p) - aH];
    return [bf - bf * Math.cos(p) - aH * Math.sin(p), -bf * Math.sin(p) + aH * Math.cos(p) - aH];
  }
  _stancePitch(u) {
    const pw = u < 0.16 ? 0.26 * (1 - smooth(u / 0.16)) : u < 0.55 ? 0 : -0.62 * smooth((u - 0.55) / 0.45);
    const pr = u < 0.25 ? 0.06 * (1 - smooth(u / 0.25)) : u < 0.58 ? 0 : -0.8 * smooth((u - 0.58) / 0.42);
    return lerp(pw, pr, this.rw) * smooth(this.vN / 0.3);
  }
  _stepFoot(S, ph, ph0, dt) {
    const f = this.feet[S], sg = this.sg, M = this.rig.M;
    if (f.planted) {
      const u = clamp(ph / sg, 0, 1);
      f.pitch = this._stancePitch(u); f.flat = f.pitch < 0 ? 1 : 0;
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), back = -((f.ax - this.x) * fx + (f.az - this.z) * fz);
      const late = f.expBack != null && back > f.expBack + 0.05 * M.leg && ph > 0.15;    // left behind (slowing from a run)
      if ((ph >= sg || late) && ph >= ph0) {           // toe-off
        f.planted = false; f.sp = 0; f.lx = f.ax; f.lz = f.az; f.lyaw = f.yaw; f.lpitch = f.pitch;
      }
    }
    if (!f.planted) {
      // the swing ends exactly when the phase wraps, whatever happens to the stance share meanwhile (no snapping)
      const tw = (1 - ph) * this.T;
      f.sp = ph < ph0 ? 1 : clamp(f.sp + (dt * (1 - f.sp)) / Math.max(tw + dt, dt), 0, 1);
      // where it lands: the body's spot at landing, half a stance ahead, at the stance width
      const tRem = ph < ph0 ? 0 : tw, yawL = this.yaw + clamp(this.yawRate * tRem, -0.6, 0.6);
      const px = this.x + Math.sin(this.yaw) * this.v * tRem, pz = this.z + Math.cos(this.yaw) * this.v * tRem;
      const lead = this.v * sg * this.T * lerp(0.37, 0.3, this.rw), a = M[S].ankle;
      const [lx, lz] = toWorld(a.x * this._lat, a.z + lead, px, pz, yawL);
      const toe = M[S].sgn * lerp(0.12, 0.05, this.move);
      const sp = f.sp, se = Math.pow(sp, lerp(1, 1.12, this.rw)), e = se - Math.sin(2 * Math.PI * se) / (2 * Math.PI);   // running: the foot stays back (heel up) and comes through late
      f.sx = lerp(f.lx, lx, e); f.sz = lerp(f.lz, lz, e); f.syaw = f.lyaw + wrapPi(yawL + toe - f.lyaw) * e;
      const vf = smooth(this.vN / 0.3), land = lerp(0.26, 0.06, this.rw) * vf, mid = 0.05 * vf;
      f.pitch = sp < 0.5 ? lerp(f.lpitch, mid, smooth(sp / 0.5)) : lerp(mid, land, smooth((sp - 0.5) / 0.5));
      f.flat = 1 - smooth(sp / 0.4);
      const Hs = lerp(0.05, 0.17, this.rw) * M.ls * Math.max(smooth(this.vN / 0.25), 0.5);
      f.lift = Hs * Math.pow(Math.sin(Math.PI * Math.pow(sp, lerp(0.85, 0.55, this.rw))), 2);
      f.offA = this._pivot(S, f.lpitch); f.offB = this._pivot(S, land);
      if (sp >= 1) { f.planted = true; f.ax = lx; f.az = lz; f.yaw = yawL + toe; f.pitch = land; f.expBack = this.v * sg * this.T * (1 - lerp(0.37, 0.3, this.rw)) + 0.06 * M.leg; }
    }
  }
  // the ankle target of one foot in world space and its yaw: planted feet never move
  _footWorld(S) {
    const f = this.feet[S], m = this.rig.M[S];
    let x, z, yaw, fwd, up;
    if (f.planted) { x = f.ax; z = f.az; yaw = f.yaw; [fwd, up] = this._pivot(S, f.pitch); }
    else {
      x = f.sx; z = f.sz; yaw = f.syaw; const t = smooth(f.sp);
      fwd = lerp(f.offA[0], f.offB[0], t); up = lerp(f.offA[1], f.offB[1], t) + f.lift;
    }
    return { x: x + Math.sin(yaw) * fwd, y: m.ankleH + up, z: z + Math.cos(yaw) * fwd, yaw, pitch: f.pitch, flat: f.flat };
  }

  _pose(dt) {
    const pose = basePose(), t = this.t, M = this.rig.M, gw = this.gw, mv = this.move, rw = this.rw, phi = this.phi, sg = this.sg;
    // idle life: breathing, a slow weight shift, small head motion
    const idle = 1 - gw * mv, br = Math.sin(t * 2 * Math.PI / 3.6);
    pose.py += 0.004 * br * idle; pose.cpitch -= 0.012 * br * idle; pose.shL += 0.2 * (br * 0.5 + 0.5) * idle; pose.shR += 0.2 * (br * 0.5 + 0.5) * idle;
    const ws = Math.sin(t * 2 * Math.PI / 7.3) * idle * (1 - gw);
    pose.psx += 0.45 * ws; pose.prl += 0.025 * ws; pose.crl -= 0.02 * ws;
    pose.hr += 0.02 * Math.sin(t * 0.7 + 1) * idle; pose.hp += 0.015 * Math.sin(t * 0.53) * idle; pose.hy += 0.04 * Math.sin(t * 0.37 + 2) * idle;
    for (const n of ['aL', 'aR']) pose[n].h[2] += 0.012 * Math.sin(t * 1.1 + (n === 'aL' ? 0 : 2)) * idle;
    // gait: pelvis, twist, lean, arm swing
    if (gw > 0.002) {
      const c2 = Math.cos(4 * Math.PI * (phi - sg / 2)), c1 = Math.cos(2 * Math.PI * (phi - sg / 2)), c0 = Math.cos(2 * Math.PI * phi);
      const g = {
        py: 0.985 - 0.012 * mv - 0.045 * rw + mv * ((1 - rw) * 0.02 * c2 - rw * 0.045 * c2),
        psx: (-mv * lerp(0.022, 0.012, rw) * M.ls * c1) / M.hipW,
        ptw: lerp(5, 10, rw) * D2R * mv * c0, ctw: -lerp(7, 14, rw) * D2R * mv * c0,
        prl: -lerp(3, 4.5, rw) * D2R * mv * c1, crl: lerp(1.6, 2.4, rw) * D2R * mv * c1,
        lean: mv * lerp(0.045, 0.19, rw),
      };
      for (const [n, sgn] of [['aR', 1], ['aL', -1]]) {
        const m = M[n === 'aR' ? 'R' : 'L'], A = lerp(0.36, 0.62, rw) * mv, al = -sgn * A * Math.cos(2 * Math.PI * (phi - 0.04));
        const fp = Math.max(0, al) / Math.max(A, 0.01), be = lerp(0.22 + 0.2 * fp, 1.55 - 0.2 * fp, rw) * Math.max(mv, 0.4), abd = lerp(6, 9, rw) * D2R;
        const d1 = [Math.sin(abd), -Math.cos(al) * Math.cos(abd), Math.sin(al) * Math.cos(abd)];
        const d2 = [Math.sin(abd) * (1 - rw) - 0.22 * rw, -Math.cos(al + be), Math.sin(al + be)];
        g[n] = { h: d1.map((x, i) => (x * m.A1 + d2[i] * m.A2) / m.arm), e: [0.3, -0.1, -1], palm: [-1, 0, 0.1], row: shapeRow('relaxed').map((x, i) => lerp(x, shapeRow('fist')[i], 0.6 * rw)) };
      }
      blendInto(pose, g, gw);
    }
    pose.lean += this.leanA;
    // action layers (the lower body only while she stands)
    const standW = 1 - smooth(this.vN / 0.3) * gw;
    const ctx = (l) => ({ n: l.side === 'L' ? 'aL' : 'aR', f: l.side === 'L' ? 'aR' : 'aL', fn: l.side === 'L' ? 'fL' : 'fR', ff: l.side === 'L' ? 'fR' : 'fL', H: M.hipsY, actor: this });
    let expr = null;
    for (const l of this.layers) {
      const t0 = l.t; l.t += dt;
      if (!l.ending && !l.hold && l.t >= l.dur - l.tout) this._end(l);
      if (l.ending) { l.te += dt; l.w = l.w0 * (1 - smooth(l.te / l.tout)); if (l.te >= l.tout) l.dead = true; } else l.w = Math.max(l.w, smooth(l.t / l.tin));
      const fn = l.name === 'holdOne' ? this._holdOne : l.fn;
      const part = fn.call(this, l.t, ctx(l));
      if (part) blendInto(pose, part, l.w, l.w * standW);
      if (!l.ending && l.fn.expr) expr = l.fn.expr;
      if (l.fn.release && t0 < l.fn.release && l.t >= l.fn.release) this._release();
    }
    this.layers = this.layers.filter((l) => !l.dead);
    this.face.override = expr;
    for (const S of ['L', 'R']) { const o = this.handOverride[S]; if (o) pose['a' + S].row = shapeRow(o.shape, o.grip, t); }
    // look: the head turns most of the way toward a target
    if (this.lookTarget) {
      const hp = this._headWorld || V3(this.x, M.headY, this.z), d = this.lookTarget.clone().sub(hp);
      const [bx, bz] = toBody(this.lookTarget.x, this.lookTarget.z, hp.x, hp.z, this.yaw);
      const yl = clamp(Math.atan2(bx, bz), -1.1, 1.1), pl = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.6, 0.5);
      pose.hy += 0.65 * yl; pose.hp -= 0.55 * pl; pose.ctw += 0.15 * yl;
    }
    return pose;
  }
  // holding a small prop: the hand comes forward a little, palm up for the apple, gripping for the saw handle
  _holdOne(t, a) {
    const p = this.prop; if (!p) return null;
    if (p.name === 'apple') return { aR: { h: [0.2, -0.55, 0.5], e: [0.8, -0.4, -0.6], palm: [-0.4, 1, 0], row: shapeRow('gripSphere', 0.56), bend: 0.15, m: 0 } };
    return { aR: { h: [0.15, -0.6, 0.5], e: [0.8, -0.4, -0.6], palm: [-1, 0, 0], row: shapeRow('gripHandle', 0.87), bend: 0, m: 0 } };
  }

  _solve(pose, dt) {
    const rig = this.rig, M = rig.M; rig.begin();
    const has = (n) => rig.has(n);
    // pelvis and spine
    const lean = pose.lean, hipsQ = qYPR(pose.ptw, lean * 0.35, pose.prl);
    rig.set('hips', hipsQ);
    const chain = ['spine', 'chest', 'upperChest'].filter(has), share = chain.length ? 1 / chain.length : 0;
    const dTw = pose.ctw - pose.ptw, dRl = pose.crl - pose.prl;
    let acc = hipsQ.clone();
    for (const n of chain) {
      const cp = n === 'spine' ? 0 : pose.cpitch * 0.5;
      acc = acc.clone().multiply(qYPR(dTw * share, lean * 0.65 * share + cp, dRl * share)); rig.set(n, acc);
    }
    // head steadied against the torso (keeps 45 % of the lean, 20 % of the chest twist)
    const cb = chain.length ? chain[chain.length - 1] : 'hips';
    const headQ = qYPR(pose.hy + 0.2 * pose.ctw, pose.hp + 0.45 * lean, pose.hr);
    if (has('neck')) rig.set('neck', rig.D[cb].clone().slerp(headQ, 0.45));
    rig.set('head', headQ);
    for (const S of ['L', 'R']) { const n = (S === 'L' ? 'left' : 'right') + 'Shoulder'; if (has(n)) rig.setLocal(n, qAxis(V3(0, 0, 1), M[S].sgn * 0.11 * pose['sh' + S])); }
    // feet: planted spots (world) plus what an action does to them while she stands
    const feet = {};
    for (const S of ['L', 'R']) {
      const w = this._footWorld(S), m = M[S], fp = pose['f' + S], s = m.sgn;
      let [bx, bz] = toBody(w.x, w.z, this.x, this.z, this.yaw);
      bx += (fp.p[0] - 1) * m.ankle.x; bz += fp.p[2] * m.leg;
      feet[S] = { p: V3(bx, w.y + fp.p[1] * m.leg + pose.hop, bz), yaw: wrapPi(w.yaw - this.yaw), pitch: w.pitch + fp.pitch, flat: w.flat };
      void s;
    }
    // pelvis position, kept within reach of both ankles (soft limit: no kink)
    const hp = V3(pose.psx * M.hipW, pose.py * M.hipsY + pose.hop, pose.psf * M.leg).add(V3(rig.rest.hips.x, 0, rig.rest.hips.z));
    let y = hp.y;
    for (const S of ['L', 'R']) {
      const m = M[S], o = rig.rest[(S === 'L' ? 'left' : 'right') + 'UpperLeg'].clone().sub(rig.rest.hips).applyQuaternion(hipsQ);
      const a = feet[S].p, dx = hp.x + o.x - a.x, dz = hp.z + o.z - a.z, L = 0.998 * m.leg;
      // planted feet bound the pelvis; a swinging foot only just after toe-off and just before landing
      const f = this.feet[S], wS = f.planted || this.frozen ? 1 : Math.max(1 - smooth(f.sp / 0.45), smooth((f.sp - 0.7) / 0.3));
      const ymax = a.y + Math.sqrt(Math.max(0, L * L - dx * dx - dz * dz)) - o.y + (1 - wS) * M.leg, k = 0.006 * M.leg;
      y = (y + ymax - Math.sqrt((y - ymax) * (y - ymax) + k * k)) / 2;
    }
    // the pelvis drops at once when it must, but rises smoothly (no jolt when a foot lets go)
    if (this._pelY != null && y > this._pelY && dt > 0) y = Math.min(y, lerp(this._pelY, y, 1 - Math.exp(-dt * 22)));
    this._pelY = y;
    hp.y = y; rig.hipsPos.copy(hp); rig.P = {};
    // legs
    for (const S of ['L', 'R']) {
      const p = S === 'L' ? 'left' : 'right', m = M[S], f = feet[S], H = rig.pos(p + 'UpperLeg');
      const pole = V3(Math.sin(f.yaw) + m.sgn * (0.08 + 0.6 * (pose.knees || 0)), 0, Math.cos(f.yaw));
      // a swinging leg stays folded: its foot is drawn in toward the hip (up behind her when running)
      const fs = this.feet[S];
      if (!fs.planted && !this.frozen) {
        const w = Math.sin(Math.PI * fs.sp), rmax = m.leg * (0.995 - (0.07 + 0.2 * this.rw) * w), d = f.p.distanceTo(H);
        if (d > rmax) f.p.sub(H).multiplyScalar(rmax / d).add(H);
      }
      const r = solve2(H, m.L1, m.L2, f.p, pole);
      if (fs.planted) this.stats.maxOver = Math.max(this.stats.maxOver, r.over);
      rig.set(p + 'UpperLeg', alignQ(r.mid.clone().sub(H), r.pole, m.restLegDir1, V3(0, 0, 1)));
      rig.set(p + 'LowerLeg', alignQ(r.end.clone().sub(r.mid), r.pole, m.restLegDir2, V3(0, 0, 1)));
      rig.set(p + 'Foot', qYPR(f.yaw, -f.pitch, 0));
      if (has(p + 'Toes')) rig.set(p + 'Toes', qYPR(f.yaw, -f.pitch * (1 - f.flat), 0));
      f.ik = r;
    }
    this._feetBody = feet;
    // arms: targets in the chest frame, kept out of the torso and the head
    const C = M.chestBone, dC = rig.D[C];
    for (const S of ['L', 'R']) {
      const p = S === 'L' ? 'left' : 'right', m = M[S], a = pose['a' + S], s = m.sgn, sv = (v) => V3(v[0] * s, v[1], v[2]);
      const sh0 = rig.rest[p + 'UpperArm'], O = sh0.clone().lerp(V3(0, sh0.y, sh0.z), a.m || 0);
      let tr = O.clone().add(sv(a.h).multiplyScalar(m.arm));
      if (a.chin > 0) { const B = this._bodyShape || (this._bodyShape = this._measureBody()); tr.lerp(B.chin.clone().add(sv(a.h).multiplyScalar(M.ls)), a.chin); }
      if (!a.free) this._avoidBody(tr, s);
      const target = rig.carry(C, tr), pole = sv(a.e).applyQuaternion(dC), palm = sv(a.palm).applyQuaternion(dC);
      const sh = rig.pos(p + 'UpperArm'), r = solve2(sh, m.A1, m.A2, target, pole.lengthSq() > 1e-6 ? pole : V3(0, 0, -1));
      rig.set(p + 'UpperArm', alignQ(r.mid.clone().sub(sh), r.pole, m.restArmDir1, V3(0, 0, -1)));
      const lo = alignQ(r.end.clone().sub(r.mid), r.pole, m.restArmDir2, V3(0, 0, -1));
      const fa = r.end.clone().sub(r.mid).normalize();
      let n = palm.clone().addScaledVector(fa, -palm.dot(fa));
      if (n.lengthSq() < 0.02) n = V3(0, -1, 0).applyQuaternion(lo).addScaledVector(fa, -V3(0, -1, 0).applyQuaternion(lo).dot(fa));
      n.normalize();
      const fd = fa.clone().multiplyScalar(Math.cos(a.bend || 0)).addScaledVector(n, Math.sin(a.bend || 0));
      const handQ = alignQ(fd, n, m.restFinger, V3(0, -1, 0));
      // forearm takes part of the twist so the wrist does not wring
      const rel = lo.clone().invert().multiply(handQ), ax = m.restArmDir2, d = rel.x * ax.x + rel.y * ax.y + rel.z * ax.z;
      const tw = new THREE.Quaternion(ax.x * d, ax.y * d, ax.z * d, rel.w); if (tw.lengthSq() > 1e-9) tw.normalize(); else tw.identity();
      rig.set(p + 'LowerArm', lo.multiply(Q().slerp(tw, 0.6)));
      rig.set(p + 'Hand', handQ);
      this.hands[S].update(dt, a.row);
      this.hands[S].apply();
    }
    rig.write();
  }
  // push a hand target (rest space of the chest) out of the torso cylinder and the head sphere
  _avoidBody(tr, s) {
    const B = this._bodyShape || (this._bodyShape = this._measureBody());
    if (tr.y > B.y0 && tr.y < B.y1) {
      const u = clamp((tr.y - B.lo.y) / (B.hi.y - B.lo.y), 0, 1), L = B.lo, H = B.hi;
      const rx = lerp(L.rx, H.rx, u), rf = lerp(L.rf, H.rf, u), rb = lerp(L.rb, H.rb, u), zc = lerp(L.zc, H.zc, u);
      const dx = tr.x / rx, dz = (tr.z - zc) / (tr.z > zc ? rf : rb), q = dx * dx + dz * dz;
      if (q < 1) { const k = 1 / Math.sqrt(Math.max(q, 1e-4)); if (q < 1e-4) tr.x = s * rx; else { tr.x *= k; tr.z = zc + (tr.z - zc) * k; } }
    }
    const hc = B.head, d = tr.clone().sub(hc), r = B.hr;
    if (d.length() < r) tr.copy(hc).add(d.lengthSq() < 1e-6 ? V3(s * r, 0, 0) : d.setLength(r));
  }
  // the torso as an elliptic cylinder at two heights (chest, hips with skirt or shorts) and the head as a sphere
  _measureBody() {
    const M = this.rig.M, r = this.rig.rest, pts = this.surfacePoints(), pad = 0.03 * M.ls;
    const ring = (y, maxX) => {
      let rx = 0, rf = -1, rb = 1;
      for (const p of pts) if (Math.abs(p.y - y) < 0.03 * M.ls && Math.abs(p.x) < maxX) { rx = Math.max(rx, Math.abs(p.x)); rf = Math.max(rf, p.z); rb = Math.min(rb, p.z); }
      if (rx === 0) { rx = M.hipW * 1.6; rf = 0.08 * M.ls; rb = -0.08 * M.ls; }
      const zc = (rf + rb) / 2; return { y, rx: rx + pad, rf: rf - zc + pad, rb: zc - rb + pad, zc };
    };
    const hi = ring(r.spine.y + (M.shY - r.spine.y) * 0.5, M.shW * 1.25), lo = ring(M.hipsY - 0.06 * M.leg, M.hipW * 2.6);
    let top = 0, hf = 0;
    for (const p of pts) if (p.y > M.headY) { top = Math.max(top, p.y); if (Math.abs(p.x) < 0.03 * M.ls) hf = Math.max(hf, p.z - r.head.z); }
    const hh = Math.max(0.08 * M.ls, (top - M.headY) * 0.5);
    const chin = V3(0, M.headY - 0.02 * M.ls, r.head.z + Math.max(hf, 0.04 * M.ls) * 0.75);
    return { chin, y0: M.hipsY - 0.25 * M.leg, y1: M.shY - 0.02 * M.ls, lo, hi, head: V3(r.head.x, M.headY + hh, r.head.z), hr: Math.max(hh, hf) + 0.06 * M.ls };
  }
  /** Rest-pose surface points of the body in body space (skinned vertices, hair excluded; cached). */
  surfacePoints() {
    if (this._pts) return this._pts;
    const pts = [], v = V3(), inv = this.body.matrixWorld.clone().invert();
    this.vrm.scene.updateMatrixWorld(true);
    this.vrm.scene.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.some((m) => /hair|outline|eye|face/i.test(m.name || '')) || /hair/i.test(o.name)) return;
      const pos = o.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 6000));
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i);
        if (o.isSkinnedMesh) o.applyBoneTransform(i, v);
        pts.push(v.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv));
      }
    });
    return (this._pts = pts);
  }
  _gaze() {
    const rig = this.rig, M = rig.M;
    const head = rig.pos('head').clone().add(V3(0, 0.08 * M.ls, 0)), hw = this.body.localToWorld(head.clone());
    this._headWorld = this.root.worldToLocal(hw.clone());
    let tgt;
    if (this.lookTarget) tgt = this.lookTarget.clone().add(V3(this.face.gx * 0.15, this.face.gy * 0.15, 0));
    else {
      const dir = V3(0, 0, 1).applyQuaternion(qYPR(this.face.gx, -this.face.gy, 0)).applyQuaternion(rig.D.head);
      tgt = this.root.worldToLocal(this.body.localToWorld(head.clone().addScaledVector(dir, 2)));
    }
    this.gaze.position.copy(tgt); this.gaze.updateMatrixWorld();
  }
  _props(dt) {
    const rig = this.rig, M = rig.M, p = this.prop;
    if (p && !p.flying) {
      if (p.name === 'crate') {
        const a = this._palm('L'), b = this._palm('R'), c = a.add(b).multiplyScalar(0.5);
        const u = p.mesh.children.length ? p.mesh : p.mesh;
        u.position.copy(c).add(V3(0, -0.02 * M.ls, 0.06 * M.ls).applyQuaternion(rig.D[M.chestBone]));
        u.quaternion.copy(qYPR(new THREE.Euler().setFromQuaternion(rig.D[M.chestBone], 'YXZ').y, 0, 0));
      } else {
        const S = 'R', side = 'right', hq = rig.D[side + 'Hand'], r = p.mesh.userData.radius || 0.02;
        p.mesh.position.copy(this._palm(S, r)); p.mesh.quaternion.copy(hq);
      }
    }
    for (const f of this.flying) {
      f.vel.y -= 9.81 * dt; f.mesh.position.addScaledVector(f.vel, dt); f.mesh.rotation.x += dt * 6;
      f.t += dt; if (f.mesh.position.y < 0.035 * M.ls) { f.mesh.position.y = 0.035 * M.ls; f.vel.multiplyScalar(0.4); f.vel.y = Math.abs(f.vel.y) * 0.3; }
      if (f.t > 2.5) f.mesh.parent && f.mesh.parent.remove(f.mesh);
    }
    this.flying = this.flying.filter((f) => f.t <= 2.5);
  }
  // palm centre of a hand in body space, r = how far in front of the palm (the held object's radius)
  _palm(S, r = 0) {
    const rig = this.rig, p = S === 'L' ? 'left' : 'right', m = rig.M[S];
    const restP = rig.rest[p + 'Hand'].clone().addScaledVector(m.restFinger, m.handLen * 0.32).add(V3(0, -(r + 0.012 * rig.M.ls), 0.008 * rig.M.ls));
    return rig.carry(p + 'Hand', restP);
  }
  _release() {
    const p = this.prop; if (!p || p.name !== 'apple') return;
    const wp = this.root.worldToLocal(this.body.localToWorld(p.mesh.position.clone()));
    this.body.remove(p.mesh); this.root.add(p.mesh); p.mesh.position.copy(wp);
    const s = Math.sqrt(this.rig.M.ls), dir = V3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.flying.push({ mesh: p.mesh, vel: dir.multiplyScalar(2.4 * s).add(V3(0, 2.6 * s, 0)), t: 0 });
    this.prop = null; this.stopAction('hold');
  }
  _shadow() {
    const M = this.rig.M, hp = this.rig.hipsPos, k = clamp(1 - (hp.y - M.hipsY * 0.985) / (M.hipsY * 0.6), 0.3, 1.05);
    const [x, z] = toWorld(hp.x, hp.z, this.x, this.z, this.yaw);
    this.shadow.position.set(x, 0.002, z); this.shadow.material.opacity = 0.3 * k; this.shadow.scale.setScalar(lerp(0.85, 1, k));
  }

  /* ---------------- measurement helpers for tests ---------------- */
  /** World (actor.root) positions of a few joints, for tests: ankles, toes, heels. */
  jointWorld(name) { return this.root.worldToLocal(this.body.localToWorld(this.rig.pos(name).clone())); }
  footState(S) { const f = this.feet[S]; return { planted: f.planted, pitch: f.pitch, sp: f.sp }; }

  /**
   * Replay a script as a pure function of time: reset, then simulate in fixed 1/60 s steps from 0 to t (spring bones
   * only for the last 1.5 s). script = [{ t, do: (actor) => ... }, ...] sorted by t; start = { x, z, yaw }.
   */
  replay(script, t, start = {}) {
    const springs = this.springs; this.reset(start);
    const h = 1 / 60, n = Math.round(t / h); let i = 0;
    for (let k = 0; k <= n; k++) {
      while (i < script.length && script[i].t <= k * h + 1e-9) script[i++].do(this);
      if (k === n) break;
      this.springs = springs && (n - k) * h <= 1.5;
      if (this.springs && (n - k) * h > 1.5 - h && this.vrm.springBoneManager) this.vrm.springBoneManager.reset();
      this._tick(h, k === n - 1);
    }
    this.springs = springs;
  }
}
// the canvas actions use 'holdOne' internally for props
ACTIONS.holdOne = Object.assign(() => null, { dur: 1e9, tin: 0.3, tout: 0.3, key: 'hold' });

function makeShadow(leg) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(60,40,20,1)'); gr.addColorStop(0.5, 'rgba(60,40,20,0.55)'); gr.addColorStop(1, 'rgba(60,40,20,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(leg * 1.1, leg * 0.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.3 }));
  m.rotation.x = -Math.PI / 2; m.renderOrder = -1; m.name = 'contactShadow'; return m;
}
