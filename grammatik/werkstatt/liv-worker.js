// Trennbar-Werkstatt 3D · Liv at the saw. Opt-in: index.html?liv=1 (main.js loads this file only then).
// Liv, the VRM girl of tools/liv3d, takes the workman's place. She is 1.09 m tall with 28 cm arms and the bench and
// the saw are built for an adult: the handle is 20 cm in from the bench edge, further than she can reach from the
// floor side. So she stands on a wooden platform with two steps, high enough (68 cm) that she can lean over the bench
// with her skirt clear of the bench top. Her hands are pinned to the saw's two handle points every frame (the player's
// arm IK), her shoulders lean in with the saw so the arms never overstretch, and the workman's reactions are mapped to
// her own actions. Needs '@pixiv/three-vrm' in the page's import map and the model file tools/liv3d/models/liv.vrm
// (not in the repository); if either is missing, main.js keeps the workman.
// No lesson text in here: the sentences still come from the lesson page.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LivActor } from '../../tools/liv3d/liv3d.js';
import { ACTIONS } from '../../tools/liv3d/actions.js';
import { shapeRow } from '../../tools/liv3d/hands.js';

const QS = new URLSearchParams(location.search), TESTING = QS.has('test');
// the model; in test mode another file can be named (also used to check that a missing model brings the workman back)
const MODEL = (TESTING && QS.get('livmodel')) || new URL('../../tools/liv3d/models/liv.vrm', import.meta.url).href;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => { const x = clamp(k, 0, 1); return x * x * (3 - 2 * x); };

// Everything that places and poses her (metres, radians, seconds).
export const P = {
  h: 0.68, x: -0.08, z: -0.455, yaw: -0.08,     // platform height; where she stands on it; which way she faces (0 = +Z, the viewer)
  reachIn: 0.5, reachOut: 0.28,                 // hands onto the handle, and off it
  reach0: 0.7, reach1: 0.83,                    // shoulder-to-wrist distance in arm lengths, saw raised .. saw down
  leanMin: 0.12, leanMax: 0.95,                 // how far her shoulders may pitch forward over the bench while holding
  hipShare: 0.62,                               // how much of that pitch is a lean from the hips; the rest is her back rounding (keeps the skirt down)
  follow: 18, headKeep: 0.15,                   // how fast the body follows the saw; how much of the lean the head undoes
  rollMin: -0.35, rollMax: 0.9,                 // how far a hand may roll round the handle (0 = on top, + = toward her)
  barR: 0.026, palmAlong: 0.32, palmSkin: 0.012,   // handle radius; where the handle lies in the hand
  row: [0.3, 0.45, 0.5, 0.52, 0.54, 0.56, 0.1],    // fingers curled over a thick handle, thumb underneath
  elbowL: [0.4, -0.9, -0.3], elbowR: [0.3, -0.9, -0.25],  // where the elbows point (root space): down and both a little to her left, so both forearms meet the slanted bar squarely
  lookRate: 7,
};

// the platform: three boarded boxes with corner posts and a deck each: where she stands, and two steps up on her right
// (about 70 small boxes, merged into one mesh per material)
function buildPlatform(kit) {
  const { box, mat, woodMat, shadowy, C } = kit, g = new THREE.Group(); g.name = 'livPlatform';
  const dark = mat(C.woodDark, 0.8), inside = mat(0x8a6238, 0.95), parts = new Map();
  const add = (o, x, y, z) => { if (!parts.has(o.material)) parts.set(o.material, []); parts.get(o.material).push(o.geometry.translate(x, y, z)); };
  const block = (x0, x1, z0, z1, h) => {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, post = 0.055, deck = 0.04, hb = h - deck, gap = 0.012;
    add(box(w - 0.05, hb - 0.01, d - 0.05, inside, 0), cx, hb / 2, cz);                       // seen through the gaps between the boards
    const rows = Math.max(2, Math.round(hb / 0.115)), bh = (hb - 0.016) / rows - gap;
    for (let r = 0; r < rows; r++) {
      const y = 0.014 + r * (bh + gap) + bh / 2;
      for (const s of [-1, 1]) { add(box(w - post, bh, 0.018, woodMat, 0.004), cx, y, cz + s * (d / 2 - 0.016)); add(box(0.018, bh, d - post, woodMat, 0.004), cx + s * (w / 2 - 0.016), y, cz); }
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(post, hb, post, dark, 0.008), cx + sx * (w - post) / 2, hb / 2, cz + sz * (d - post) / 2);
    add(box(w + 0.03, deck, d + 0.03, woodMat, 0.012), cx, h - deck / 2, cz);
  };
  const x0 = P.x - 0.32, x1 = P.x + 0.28, zF = P.z + 0.115, zB = P.z - 0.36;
  block(x0, x1, zB, zF, P.h);
  block(x0 - 0.27, x0, zB + 0.03, zF - 0.05, (P.h * 2) / 3);
  block(x0 - 0.54, x0 - 0.27, zB + 0.03, zF - 0.05, P.h / 3);
  for (const [m, geos] of parts) g.add(new THREE.Mesh(mergeGeometries(geos), m));
  return shadowy(g);
}

export async function attach(ctx) {
  const { scene, camera, S, sawState, handlePts, K, kit } = ctx, t0 = performance.now();
  const actor = await Promise.race([LivActor.load(MODEL), new Promise((_, no) => setTimeout(() => no(new Error('Liv: the model took too long to load')), 45000))]);
  const stats = { loadMs: Math.round(performance.now() - t0), updateMs: 0, maxErr: 0, maxReach: 0 };
  const rig = actor.rig, M = rig.M, rest = rig.rest, rootPos = V(P.x, P.h, P.z);
  let platform = null; scene.add(actor.root);
  // put the platform and her where P says (again after P was changed, for tuning in test mode)
  function place() {
    if (platform) scene.remove(platform);
    platform = buildPlatform(kit); scene.add(platform);
    rootPos.set(P.x, P.h, P.z); actor.root.position.copy(rootPos); actor.root.updateMatrixWorld(true);
  }
  place();
  actor.vrm.scene.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  if (ctx.canvas) ctx.canvas.setAttribute('aria-label', '3D-Werkstatt: Liv, ein Mädchen im roten Dirndl, steht auf einem Holzpodest und versucht, Verben mit einer Säge zu teilen.');

  // ---- her own actions (registered next to the player's 27; none of them changes an existing one) ----
  // lean = how far her shoulders pitch forward in all. Her legs stay straight: bent knees open the skirt over the thighs.
  const st = { lean: 0, hp: 0 };
  ACTIONS.werkStance = Object.assign(() => (st.lean > 1e-4 ? { lean: st.lean * P.hipShare, cpitch: st.lean * (1 - P.hipShare), hp: st.hp } : null), { dur: 1e9, tin: 0.01, tout: 0.2, key: 'stance' });
  // the saw kicks back: both hands fly off, open, and she leans away. Her left hand is the one next to the blade, so
  // it is the one that stays close to her (here and in the shrug).
  const openArm = (out, up, fwd) => ({ h: [out, up, fwd], e: [0.8, -0.8, -0.2], palm: [0, 0.2, 1], row: shapeRow('open'), bend: -0.35, m: 0, free: 0, chin: 0 });
  ACTIONS.werkRecoil = Object.assign((t) => {
    const j = Math.exp(-t * 5) * Math.cos(t * 13);
    return { aL: openArm(0.3, -0.34 + 0.1 * j, 0.46), aR: openArm(0.62, -0.08 + 0.14 * j, 0.5), lean: -0.1 - 0.05 * j, hp: -0.08, shL: 0.8, shR: 0.8, ctw: -0.12 };
  }, { dur: 1.0, tin: 0.1, tout: 0.25, key: 'act' });
  // the player's thumbs-up and shrug, with her face left to this file (theirs wink and look away); the thumb is held
  // higher and further out, clear of the handle in front of her
  ACTIONS.werkThumb = Object.assign((t, a) => { const p = ACTIONS.thumb(t, a), h = p[a.n].h; h[0] = 0.6; h[1] += 0.32; h[2] = 0.45; return p; }, { dur: 2.0, tin: 0.22, tout: 0.25, key: 'act' });
  ACTIONS.werkShrug = Object.assign((t, a) => { const p = ACTIONS.shrug(t, a); p.aL = Object.assign({}, p.aL, { h: [0.3, -0.46, 0.42] }); return p; }, { dur: 2.2, tin: 0.22, tout: 0.3, key: 'act' });

  // ---- the handle: a bar; `across` and `over` span the plane across it ----
  const bar = handlePts.R.clone().sub(handlePts.L).normalize();
  const over = V(0, 1, 0).addScaledVector(bar, -bar.y).normalize();
  const across = new THREE.Vector3().crossVectors(over, bar); if (across.z < 0) across.negate();      // away from Liv
  const handLen = M.L.handLen, grip = { L: 0.5, R: 0.5 };
  const NAME = (side) => (side === 'L' ? 'left' : 'right');
  // one hand on the bar: where the wrist has to be, and how the player has to bend it
  function aim(side, hp, dt) {
    const p = NAME(side), fa = actor.jointWorld(p + 'Hand').sub(actor.jointWorld(p + 'LowerArm')).normalize();
    // the hand rolls round the bar towards the forearm, so the wrist never bends far
    const want = clamp(Math.atan2(fa.dot(over), fa.dot(across)), P.rollMin, P.rollMax);
    grip[side] += (want - grip[side]) * (1 - Math.exp(-dt * 10));
    const a = grip[side], N = over.clone().multiplyScalar(-Math.cos(a)).addScaledVector(across, Math.sin(a));      // palm normal, into the bar
    // the palm lies flat on the bar (normal N); the player bends the wrist in the plane of the forearm and the palm
    // normal, so the fingers carry on where the forearm is heading, over the bar
    const d = N.dot(fa), flat = N.clone().addScaledVector(fa, -d), s = flat.length();
    const palm = s > 1e-3 ? flat.multiplyScalar(1 / s) : across.clone().multiplyScalar(-Math.sign(d)), bend = clamp(s > 1e-3 ? Math.atan2(-d, s) : -Math.sign(d) * Math.PI / 2, -1.25, 1.1);
    const fd = fa.clone().multiplyScalar(Math.cos(bend)).addScaledVector(palm, Math.sin(bend)), n = palm.clone().multiplyScalar(Math.cos(bend)).addScaledVector(fa, -Math.sin(bend));
    const wrist = hp.clone().addScaledVector(fd, -P.palmAlong * handLen).addScaledVector(n, -(P.barR + P.palmSkin));
    return { wrist, palm, bend };
  }
  // the centre of what a hand holds (a bar of radius barR in the palm), root space, after the last update
  const held = (side) => { const f = actor.handFrame(side); return f.wrist.addScaledVector(f.fingers, P.palmAlong * handLen).addScaledVector(f.palm, P.barR + P.palmSkin); };
  const handleAt = (side, sw) => handlePts[side].clone().add(V(sw.jit, sw.y, K.BOARD_Z)).sub(rootPos);      // a handle point in root space
  const slip = (sw) => Math.max(held('L').distanceTo(handleAt('L', sw)), held('R').distanceTo(handleAt('R', sw)));
  // both hands onto the handle with weight w; returns the middle of the two wrist targets
  function grasp(sw, w, dt) {
    const aL = aim('L', handleAt('L', sw), dt), aR = aim('R', handleAt('R', sw), dt);
    actor.setHandTarget('L', aL.wrist, { w, palm: aL.palm, bend: aL.bend, elbow: V(...P.elbowL), row: P.row });
    actor.setHandTarget('R', aR.wrist, { w, palm: aR.palm, bend: aR.bend, elbow: V(...P.elbowR), row: P.row });
    return aL.wrist.add(aR.wrist).multiplyScalar(0.5);
  }

  // ---- the lean: the smallest one that brings the shoulders within reach of the wrists (side view of her spine) ----
  const chain = ['spine', 'chest', 'upperChest'].filter((n) => rig.has(n)), shZ = (rest.leftUpperArm.z + rest.rightUpperArm.z) / 2;
  const turn = (dy, dz, a) => [dy * Math.cos(a) - dz * Math.sin(a), dy * Math.sin(a) + dz * Math.cos(a)];
  function shoulder(th, hipY, hipZ) {
    const lean = th * P.hipShare, cp = th * (1 - P.hipShare) * 0.5;      // as the player's _solve spreads them over the spine
    let y = hipY, z = hipZ, a = 0.35 * lean, prev = 'hips';
    for (const n of chain) { const [dy, dz] = turn(rest[n].y - rest[prev].y, rest[n].z - rest[prev].z, a); y += dy; z += dz; a += (0.65 * lean) / chain.length + (n === 'spine' ? 0 : cp); prev = n; }
    const [dy, dz] = turn(M.shY - rest[prev].y, shZ - rest[prev].z, a); return [y + dy, z + dz];
  }
  function leanFor(wm, d0) {
    const f = wm.x * Math.sin(actor.yaw) + wm.z * Math.cos(actor.yaw), u = wm.y, hipY = 0.985 * M.hipsY, hipZ = rest.hips.z;
    let best = P.leanMin, bd = 1e9, pd = 0, pt = 0;
    for (let i = 0; i <= 40; i++) {
      const th = lerp(P.leanMin, P.leanMax, i / 40), [y, z] = shoulder(th, hipY, hipZ), d = Math.hypot(u - y, f - z);
      if (d <= d0) return i ? lerp(pt, th, clamp((pd - d0) / Math.max(1e-6, pd - d), 0, 1)) : th;
      if (d < bd) { bd = d; best = th; }
      pd = d; pt = th;
    }
    return best;
  }

  // ---- what she is doing, from the round's clock (the same moments as the workman's pose()) ----
  const HOLD = new Set(['hold', 'cutting', 'grind']);
  function wantPhase(sw) {
    const t = S.t, k = S.kind;
    if (t < 0.7) return 'arrive';
    if (t < 1.3 || S.waiting || sw.held) return k === 'fail' && t > 2.0 ? 'grind' : k === 'cut' && t > 2.0 && !S.waiting ? 'cutting' : 'hold';
    if (k === 'cut') return t < 3.8 ? 'pleased' : t < 5.1 ? 'thumb' : 'idle';
    if (k === 'fail' && t < 3.3) return 'recoil';
    if (t < 4.1) return k === 'whole' ? 'agree' : 'ponder';
    if (t < 5.2) return k === 'whole' ? 'pleased' : 'shrug';
    return 'idle';
  }
  let phase = '', phaseT = 0, hold = 0, lookSet = false; const look = V();
  const hips = () => actor.play('hips', { hold: true });
  function enter(ph) {
    const from = phase; phase = ph; phaseT = 0;
    if (ph === 'arrive') { actor.setExpression('happy'); if (from !== 'idle') hips(); }
    else if (ph === 'hold') { actor.stopAction('act'); actor.setExpression('happy'); }
    else if (ph === 'cutting') actor.setExpression('effort', 0.5);
    else if (ph === 'grind') actor.setExpression('effort', 0.85);
    else if (ph === 'recoil') { actor.setExpression('surprised'); actor.play('werkRecoil', { dur: 1.0 }); }
    else if (ph === 'ponder') actor.play('think', { dur: 1.0 });
    else if (ph === 'shrug') { actor.setExpression('happy'); actor.play('werkShrug', { dur: 1.3 }); }
    else if (ph === 'agree') { actor.setExpression('smile'); actor.play('nod'); }
    else if (ph === 'pleased') { actor.setExpression('smile'); if (from !== 'agree') actor.stopAction('act'); }
    else if (ph === 'thumb') { actor.setExpression('laugh'); actor.play('werkThumb', { dur: 1.5 }); }
    else if (ph === 'idle') { actor.setExpression('happy'); hips(); }
  }
  // where she looks (world): the work, the sentence plank while the pieces fly, the viewer when she is pleased
  const CUT = V(K.CUT_X - 0.03, K.BENCH_Y + K.BH + 0.02, K.BOARD_Z + 0.04), PLANK = V(0, 0.68, 1.05);
  function lookWant() {
    const t = S.t;
    if (phase === 'arrive') return V(K.CUT_X - 1.4 * (1 - smooth(t / 0.7)), K.BENCH_Y + K.BH, K.BOARD_Z);       // the block sliding in
    if (HOLD.has(phase)) return CUT;
    if (phase === 'recoil') return V(K.CUT_X, sawState().y, K.BOARD_Z);                                          // the saw head jumping up
    if (phase === 'pleased') return S.kind === 'cut' && t < 3.55 ? PLANK : camera.position;
    if (phase === 'ponder' || phase === 'agree') return t < 3.6 ? CUT : PLANK;
    if (phase === 'thumb' || phase === 'shrug') return camera.position;
    return phaseT < 1.6 || (phaseT % 6.5) > 4.9 ? camera.position : V(K.CUT_X - 0.25, K.BENCH_Y + 0.05, 0.1);    // idle: the viewer, then the bench, in turns
  }

  function reset() {
    actor.reset({ yaw: P.yaw }); actor.play('werkStance', { hold: true });
    phase = ''; phaseT = 0; hold = 0; lookSet = false; st.lean = st.hp = 0; grip.L = grip.R = 0.5; stats.maxErr = stats.maxReach = 0;
  }
  function update(dt) {
    const c0 = TESTING ? performance.now() : 0, sw = sawState();
    const ph = wantPhase(sw); if (ph !== phase) enter(ph); phaseT += dt;
    hold = clamp(hold + (HOLD.has(phase) ? dt / P.reachIn : -dt / P.reachOut), 0, 1);
    const w = smooth(hold); let lean = 0;
    if (hold > 0) lean = leanFor(grasp(sw, w, dt), lerp(P.reach0, P.reach1, clamp((K.RAISED - sw.y) / (K.RAISED - K.THROUGH), 0, 1)) * M.arm);
    else { actor.setHandTarget('L', null); actor.setHandTarget('R', null); }
    st.lean = lerp(st.lean, lean * w, 1 - Math.exp(-dt * P.follow)); st.hp = -P.headKeep * st.lean;
    const lw = lookWant().clone().sub(rootPos);
    if (lookSet) look.lerp(lw, 1 - Math.exp(-dt * P.lookRate)); else { look.copy(lw); lookSet = true; }
    actor.lookAt(look);
    actor.update(dt);
    // The wrist bend was worked out from the forearm of the frame before. When the handle moves fast (a drag in
    // "Selbst sägen", the kick) the hands would slip on it, so solve once more for this frame (dt 0: nothing else moves).
    if (hold >= 1 && slip(sw) > 0.0015) { grasp(sw, 1, 0); actor.update(0); }
    if (TESTING) {
      stats.updateMs = lerp(stats.updateMs, performance.now() - c0, 0.05);
      if (hold >= 1) { const m = measure(); stats.maxErr = Math.max(stats.maxErr, m.errL, m.errR); stats.maxReach = Math.max(stats.maxReach, m.reachL, m.reachR); }
    }
  }
  // for the test pictures: how far each hand's grip is from its handle point (metres), how stretched each arm is (1 = straight)
  function measure() {
    const sw = sawState(), out = { phase, hold, lean: st.lean };
    for (const side of ['L', 'R']) {
      out['err' + side] = held(side).distanceTo(handleAt(side, sw));
      out['reach' + side] = actor.jointWorld(NAME(side) + 'Hand').distanceTo(actor.jointWorld(NAME(side) + 'UpperArm')) / M[side].arm;
    }
    return out;
  }

  reset();
  return { update, reset, measure, actor, stats, P, place() { place(); reset(); } };
}
