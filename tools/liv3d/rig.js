// Liv 3D · rig: measures a loaded VRM (any humanoid proportions) and drives its NORMALISED humanoid bones.
// Body space: the character's own frame, origin on the ground under the standing hips, X her left, Y up, Z forward.
// Every pose is written as body-space rotations relative to the rest (T-)pose ("deltas" D); the rig turns them
// into the local rotations of the normalised bones. Nothing here assumes the proportions of a particular model.
import * as THREE from 'three';

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const Q = () => new THREE.Quaternion();
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const seg = (t, a, b) => smooth((t - a) / (b - a));
export const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// yaw (about Y), pitch (about X, + tips the top forward), roll (about Z): R = Ry * Rx * Rz
export const qYPR = (yaw, pitch = 0, roll = 0) => Q().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'));
export const qAxis = (axis, a) => Q().setFromAxisAngle(axis, a);

// rotation that takes the frame (a0, b0) to (a1, b1): a = primary axis, b = a secondary direction (orthogonalised)
const _m = new THREE.Matrix4();
function frameQ(a, b) {
  const x = a.clone().normalize();
  const y = b.clone().addScaledVector(x, -b.dot(x));
  if (y.lengthSq() < 1e-10) y.set(x.y, -x.x, 0.3).addScaledVector(x, -x.dot(y));
  y.normalize();
  const z = V3().crossVectors(x, y);
  return Q().setFromRotationMatrix(_m.makeBasis(x, y, z));
}
export const alignQ = (a1, b1, a0, b0) => frameQ(a1, b1).multiply(frameQ(a0, b0).invert());

// two-bone IK: root, lengths, target, pole (the direction the middle joint should point). Returns mid and end.
export function solve2(root, L1, L2, target, pole) {
  const d = target.clone().sub(root); let dist = d.length();
  const u = dist > 1e-6 ? d.clone().divideScalar(dist) : V3(0, -1, 0);
  const reach = dist; dist = clamp(dist, Math.abs(L1 - L2) + 1e-4, (L1 + L2) * 0.9999);
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), b = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const p = pole.clone().addScaledVector(u, -pole.dot(u));
  if (p.lengthSq() < 1e-8) p.set(0, 0, 1).addScaledVector(u, -u.z);
  p.normalize();
  return { mid: root.clone().addScaledVector(u, a).addScaledVector(p, b), end: root.clone().addScaledVector(u, dist), over: reach - dist, pole: p };
}

const SIDES = { L: 'left', R: 'right' };
export const FINGERS = ['Index', 'Middle', 'Ring', 'Little'];

export class Rig {
  constructor(vrm, body) {
    this.vrm = vrm; this.body = body; this.h = vrm.humanoid;
    this.sceneQ = vrm.scene.quaternion.clone(); this.sceneQi = this.sceneQ.clone().invert(); this.scale = vrm.scene.scale.x;
    body.updateMatrixWorld(true);
    const inv = body.matrixWorld.clone().invert();
    this.node = {}; this.rest = {}; this.parent = {}; this.names = [];
    const byNode = new Map();
    for (const name of Object.keys(this.h.humanBones)) {
      const n = this.h.getNormalizedBoneNode(name); if (!n) continue;
      this.node[name] = n; byNode.set(n, name);
      this.rest[name] = n.getWorldPosition(V3()).applyMatrix4(inv);
    }
    // order bones parent-first and find each one's nearest humanoid ancestor
    const order = [];
    const visit = (o) => { if (byNode.has(o)) order.push(byNode.get(o)); for (const c of o.children) visit(c); };
    visit(this.h.normalizedHumanBonesRoot);
    for (const name of order) {
      let p = this.node[name].parent; while (p && !byNode.has(p)) p = p.parent;
      this.parent[name] = p ? byNode.get(p) : null;
    }
    this.names = order;
    this.D = {}; for (const n of order) this.D[n] = Q();
    this.P = {}; this.hipsPos = this.rest.hips.clone();
    this.measure();
  }
  has(n) { return !!this.node[n]; }
  measure() {
    const r = this.rest, M = (this.M = {});
    M.hipsY = r.hips.y;
    for (const s of ['L', 'R']) {
      const p = SIDES[s], hip = r[p + 'UpperLeg'], knee = r[p + 'LowerLeg'], ank = r[p + 'Foot'], toe = r[p + 'Toes'];
      const sh = r[p + 'UpperArm'], el = r[p + 'LowerArm'], wr = r[p + 'Hand'];
      const mid = r[p + 'MiddleProximal'] || wr.clone().add(V3(s === 'L' ? 0.06 : -0.06, 0, 0));
      M[s] = {
        L1: hip.distanceTo(knee), L2: knee.distanceTo(ank), ankleH: ank.y, ankle: ank.clone(),
        toeF: toe ? Math.max(0.02, toe.z - ank.z) : 0.28 * (hip.distanceTo(knee) + knee.distanceTo(ank)) * 0.45,
        A1: sh.distanceTo(el), A2: el.distanceTo(wr), handLen: wr.distanceTo(mid) * 1.9,
        restLegDir1: knee.clone().sub(hip).normalize(), restLegDir2: ank.clone().sub(knee).normalize(),
        restArmDir1: el.clone().sub(sh).normalize(), restArmDir2: wr.clone().sub(el).normalize(),
        restFinger: mid.clone().sub(wr).normalize(),
        sgn: s === 'L' ? 1 : -1,
      };
      M[s].leg = M[s].L1 + M[s].L2; M[s].arm = M[s].A1 + M[s].A2; M[s].heel = 0.62 * M[s].toeF;
    }
    M.leg = (M.L.leg + M.R.leg) / 2; M.arm = (M.L.arm + M.R.arm) / 2;
    M.hipW = Math.abs(r.leftUpperLeg.x - r.rightUpperLeg.x) / 2;
    M.shW = Math.abs(r.leftUpperArm.x - r.rightUpperArm.x) / 2;
    M.shY = (r.leftUpperArm.y + r.rightUpperArm.y) / 2;
    M.chestBone = this.has('upperChest') ? 'upperChest' : this.has('chest') ? 'chest' : 'spine';
    M.headY = r.head.y;
    // Froude scaling against the 2D rig's tuned child (0.39 m legs)
    M.k = Math.sqrt(0.39 / M.leg); M.ls = M.leg / 0.39;
  }
  begin() { for (const n of this.names) this.D[n].identity(); this.P = {}; }
  // body-space position of a bone from its ancestors' deltas (call after the ancestors are final)
  pos(n) {
    if (this.P[n]) return this.P[n];
    if (n === 'hips') return (this.P.hips = this.hipsPos.clone());
    const p = this.parent[n];
    const off = this.rest[n].clone().sub(this.rest[p]).applyQuaternion(this.D[p]);
    return (this.P[n] = this.pos(p).clone().add(off));
  }
  // a point given in rest body space, carried along by bone n
  carry(n, restPoint) { return restPoint.clone().sub(this.rest[n]).applyQuaternion(this.D[n]).add(this.pos(n)); }
  set(n, q) { if (this.D[n]) { this.D[n].copy(q); this.P = {}; } }
  // a rotation given in the bone's rest frame, applied on top of its parent's delta
  setLocal(n, q) { if (!this.D[n]) return; const p = this.parent[n]; this.D[n].copy(p ? this.D[p] : Q()).multiply(q); this.P = {}; }
  write() {
    const sq = this.sceneQ, si = this.sceneQi;
    for (const n of this.names) {
      if (n === 'leftEye' || n === 'rightEye' || n === 'jaw') continue;   // the look-at applier owns the eyes
      const p = this.parent[n], loc = p ? this.D[p].clone().invert().multiply(this.D[n]) : this.D[n].clone();
      this.node[n].quaternion.copy(si).multiply(loc).multiply(sq);
    }
    this.node.hips.position.copy(this.hipsPos).applyQuaternion(si).divideScalar(this.scale);
  }
}
