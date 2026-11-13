// Liv 3D · props and the satchel, built in code from simple geometry in the toon style (MToon-like flat shading via
// MeshToonMaterial plus a back-face outline shell). Sizes scale with the character (leg length).
import * as THREE from 'three';
import { V3, clamp } from './rig.js';

const INK = 0x3a1c0c;
let gradient = null;
function toon(color) {
  if (!gradient) { const d = new Uint8Array([90, 170, 255]); gradient = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true; }
  return new THREE.MeshToonMaterial({ color, gradientMap: gradient });
}
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
// a mesh with an outline shell (the same geometry pushed out along its normals, drawn back-faces only)
function inked(geo, color, w = 0.004) {
  const g = new THREE.Group(), m = new THREE.Mesh(geo, toon(color));
  const shell = geo.clone(); const p = shell.attributes.position, n = shell.attributes.normal;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * w, p.getY(i) + n.getY(i) * w, p.getZ(i) + n.getZ(i) * w);
  g.add(m, new THREE.Mesh(shell, inkMat)); return g;
}
function roundedBox(w, h, d, r) {
  const geo = new THREE.BoxGeometry(w, h, d, 6, 6, 6), p = geo.attributes.position, v = V3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const c = V3(clamp(v.x, -w / 2 + r, w / 2 - r), clamp(v.y, -h / 2 + r, h / 2 - r), clamp(v.z, -d / 2 + r, d / 2 - r));
    const o = v.clone().sub(c); if (o.lengthSq() > 1e-12) v.copy(c).add(o.setLength(r));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals(); return geo;
}

// Props are given in the hand's rest frame: X along the fingers' side, -Y out of the palm, origin at the palm centre.
export function makeProp(name, s) {
  const g = new THREE.Group(); g.name = 'prop:' + name;
  if (name === 'apple') {
    const r = 0.036 * s, geo = new THREE.SphereGeometry(r, 20, 14), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / r; p.setY(i, p.getY(i) * (0.92 - 0.12 * Math.exp(-((1 - Math.abs(y)) * 6)))); }
    geo.computeVertexNormals();
    const body = inked(geo, 0xd9473a, 0.003 * s); g.add(body);
    const stem = inked(new THREE.CylinderGeometry(0.0025 * s, 0.003 * s, 0.018 * s, 6), 0x6b4a2b, 0.0015 * s); stem.position.y = r * 0.95; stem.rotation.z = 0.25; g.add(stem);
    const leaf = inked(new THREE.SphereGeometry(0.011 * s, 8, 6).scale(1, 0.25, 0.5), 0x5d9e3a, 0.0015 * s); leaf.position.set(0.011 * s, r * 1.02, 0); leaf.rotation.z = -0.5; g.add(leaf);
    g.userData = { radius: r, grip: 'gripSphere', gripAmount: 0.56 };
  } else if (name === 'crate') {
    const w = 0.34 * s, h = 0.22 * s, d = 0.24 * s;
    g.add(inked(roundedBox(w, h, d, 0.01 * s), 0xc9a36b, 0.004 * s));
    for (const y of [-h * 0.22, h * 0.22]) for (const z of [-1, 1]) { const slat = inked(new THREE.BoxGeometry(w * 1.01, h * 0.16, 0.012 * s), 0xa77d47, 0.002 * s); slat.position.set(0, y, z * d / 2); g.add(slat); }
    const label = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.3, h * 0.25), toon(0x4f7fb5)); label.position.set(0, 0, d / 2 + 0.008 * s); g.add(label);
    g.userData = { w, h, d };
  } else if (name === 'sawHandle') {
    const hl = 0.11 * s, hr = 0.016 * s;
    const handle = inked(new THREE.CapsuleGeometry(hr, hl, 4, 10), 0xb07a3f, 0.003 * s); handle.rotation.x = Math.PI / 2; g.add(handle);   // along Z (across the palm)
    const blade = inked(new THREE.BoxGeometry(0.004 * s, 0.07 * s, 0.2 * s), 0xb8c2c8, 0.002 * s); blade.position.set(0, 0.045 * s, hl * 0.5 + 0.1 * s); g.add(blade);
    g.userData = { radius: hr, grip: 'gripHandle', gripAmount: 0.87 };
  }
  return g;
}

// The satchel: a tan bag on the right hip and a cross-body strap from the left shoulder. The strap path is fitted
// to the model's own surface (rest-pose vertices, hair excluded) and carried by the spine bones every frame.
export class Satchel {
  constructor(actor) {
    const rig = actor.rig, M = rig.M, r = rig.rest, s = M.ls;
    this.rig = rig; this.group = new THREE.Group(); this.group.name = 'satchel';
    const pts = actor.surfacePoints();
    const near = (fn) => { let best = null; for (const p of pts) { const v = fn(p); if (v != null && (best == null || v > best)) best = v; } return best; };
    const front = (x, y) => near((p) => (Math.abs(p.x - x) < 0.025 * s && Math.abs(p.y - y) < 0.02 * s ? p.z : null));
    const back = (x, y) => { const v = near((p) => (Math.abs(p.x - x) < 0.025 * s && Math.abs(p.y - y) < 0.02 * s ? -p.z : null)); return v == null ? null : -v; };
    const top = (x, z) => near((p) => (Math.abs(p.x - x) < 0.02 * s && Math.abs(p.z - z) < 0.02 * s && p.y < M.shY + 0.12 * s ? p.y : null));
    const side = (y) => near((p) => (Math.abs(p.y - y) < 0.02 * s && p.x < 0 && p.x > -M.hipW * 3 ? -p.x : null));
    const shX = M.shW * 0.9, hipY = M.hipsY - 0.02 * s, bagX = -((side(hipY - 0.04 * s) || M.hipW * 1.5) + 0.01 * s);
    const lift = 0.007 * s;
    const A = V3(shX, M.shY, r.leftUpperArm.z), B = V3(bagX * 0.8, hipY, 0);
    const path = [];
    const N = 12;
    for (let i = 0; i <= N; i++) { const t = i / N, x = A.x + (B.x - A.x) * t, y = A.y - 0.01 * s + (B.y - A.y) * t; const z = front(x, y); path.push(V3(x, y, (z == null ? 0.08 * s : z) + lift)); }
    const fz = path[0].z, bz = (back(A.x, A.y - 0.01 * s) ?? -0.08 * s) - lift;
    const over = [];
    for (let i = 1; i < 6; i++) { const z = fz + (bz - fz) * (i / 6), y = top(A.x, z); over.push(V3(A.x, (y == null ? A.y + 0.03 * s : y) + lift, z)); }
    const bpath = [];
    for (let i = 0; i <= N; i++) { const t = i / N, x = A.x + (B.x - A.x) * t, y = A.y - 0.01 * s + (B.y - A.y) * t; const z = back(x, y); bpath.push(V3(x, y, (z == null ? -0.08 * s : z) - lift)); }
    this.restPts = [...path.reverse(), ...over.reverse(), ...bpath];     // bag (front) -> over the left shoulder -> bag (back)
    const ys = { chest: r[M.chestBone].y, spine: r.spine.y };
    this.bones = this.restPts.map((p) => (p.y > ys.chest ? M.chestBone : p.y > ys.spine ? 'spine' : 'hips'));
    this.strapR = 0.008 * s;
    this.strap = new THREE.Mesh(new THREE.BufferGeometry(), toon(0x8a5a2e)); this.group.add(this.strap);
    // the bag, centred beside the right hip
    const bw = 0.17 * s, bh = 0.13 * s, bd = 0.05 * s;
    this.bag = new THREE.Group();
    const box = inked(roundedBox(bd, bh, bw, 0.012 * s), 0xc8a06a, 0.004 * s); this.bag.add(box);
    const flap = inked(roundedBox(bd * 0.35, bh * 0.55, bw * 1.02, 0.008 * s), 0xb48a55, 0.003 * s); flap.position.set(-bd * 0.42, bh * 0.25, 0); this.bag.add(flap);
    const clasp = inked(new THREE.BoxGeometry(0.008 * s, 0.022 * s, 0.022 * s), 0x8a5a2e, 0.002 * s); clasp.position.set(-bd * 0.62, bh * 0.02, 0); this.bag.add(clasp);
    this.bagRest = V3(bagX - bd * 0.5, hipY - bh * 0.35, 0.01 * s);
    this.group.add(this.bag);
    this.restPts[0].copy(this.bagRest).add(V3(0, bh * 0.45, bw * 0.3)); this.restPts[this.restPts.length - 1].copy(this.bagRest).add(V3(0, bh * 0.45, -bw * 0.3));
    this.bones[0] = this.bones[this.bones.length - 1] = 'hips';
  }
  // body-space positions from the current pose; the group lives in the body
  update() {
    const rig = this.rig;
    const pts = this.restPts.map((p, i) => rig.carry(this.bones[i], p));
    const curve = new THREE.CatmullRomCurve3(pts);
    this.strap.geometry.dispose(); this.strap.geometry = new THREE.TubeGeometry(curve, 60, this.strapR, 6, false);
    this.bag.position.copy(rig.carry('hips', this.bagRest)); this.bag.quaternion.copy(rig.D.hips);
  }
}
