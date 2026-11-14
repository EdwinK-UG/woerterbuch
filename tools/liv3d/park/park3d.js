// Liv 3D · the park scene (B2 109: "im Park · Wo?" and "in den Park · Wohin?").
// The same park as the canvas film (grammatik/liv/film-park.js: layout, sizes, colours), built in Three.js, with the VRM Liv
// from ../liv3d.js. Scenery is unlit flat colour with ink hulls (the look of the 2D art); Liv is lit.
//
//   const park = await ParkScene.create({ model: '../models/liv.vrm' });
//   park.seek('goal', seconds); park.render(renderer);         // the picture is a function of (scene, seconds)
//
// Scenes: 'location' = Dativ, she jogs a loop inside the park, stops, the place lights up (26.3 s with narration);
//         'goal'     = Akkusativ, she waits on the pavement, runs through the gate, the route and then the park light up (22.4 s).
//         'within' / 'into' = the short versions the film player uses (same staging as the canvas park; 9.6 s and 8 s, then held).
// Cue times are the lengths of the recorded narration clips (Elisa); they are numbers only, no lesson text is in this file.
import * as THREE from 'three';
import { LivActor } from '../liv3d.js';

const INK = 0x3a1c0c, GATE = 0, H = 1 / 60;
const rnd = (i) => { const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453; return s - Math.floor(s); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const env = (t, on, off, fade = 0.5) => ss(on, on + fade, t) * (1 - ss(off, off + fade, t));

const flat = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
const decal = (c, opacity = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
function inked(mesh, w = 0.012) {            // ink outline: the same shape, a little larger, back faces only
  const bb = new THREE.Box3().setFromBufferAttribute(mesh.geometry.attributes.position), s = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
  const hull = new THREE.Mesh(mesh.geometry, inkMat), k = new THREE.Vector3(1 + 2 * w / Math.max(s.x, 1e-3), 1 + 2 * w / Math.max(s.y, 1e-3), 1 + 2 * w / Math.max(s.z, 1e-3));
  hull.scale.copy(k); hull.position.set(c.x * (1 - k.x), c.y * (1 - k.y), c.z * (1 - k.z)); mesh.add(hull); return mesh;
}
// a box drawn like the canvas boxes: its own colour for the front, the top and the sides
function box(x0, y0, z0, x1, y1, z1, col, ink = 0.012) {
  const side = flat(col.side || col.front), m = [side, side, flat(col.top || col.front), side, flat(col.front), side];
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const o = new THREE.Mesh(g, m); return ink ? inked(o, ink) : o;
}
function ground(x0, x1, z0, z1, c, y = 0, mat) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  return new THREE.Mesh(g, mat || flat(c));
}
function textPlate(text, w, h, bg, fg) {
  const c = document.createElement('canvas'); c.width = 768; c.height = Math.round(768 * h / w); const x = c.getContext('2d'), r = c.height * 0.2;
  x.fillStyle = '#' + new THREE.Color(INK).getHexString(); x.beginPath(); x.roundRect(0, 0, c.width, c.height, r); x.fill();
  x.fillStyle = bg; x.beginPath(); x.roundRect(9, 9, c.width - 18, c.height - 18, r * 0.8); x.fill();
  x.fillStyle = fg; x.font = `600 ${Math.round(c.height * 0.5)}px "Avenir Next", "Segoe UI", system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2 + c.height * 0.03);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
}

function buildScenery(scene) {
  const S = new THREE.Group(); scene.add(S);
  // sky and far hills
  const sc = document.createElement('canvas'); sc.width = 4; sc.height = 256; const sx = sc.getContext('2d'), gr = sx.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#cfe6ee'); gr.addColorStop(1, '#f6efe0'); sx.fillStyle = gr; sx.fillRect(0, 0, 4, 256);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(120, 16), new THREE.MeshBasicMaterial({ map: st })); sky.position.set(5, 8, -13.2); S.add(sky);
  const hs = new THREE.Shape(); hs.moveTo(-50, 0);
  for (let x = -50; x <= 60; x += 0.5) hs.lineTo(x, 0.95 + 0.5 * Math.sin(x * 0.37) + 0.28 * Math.sin(x * 1.05 + 1));
  hs.lineTo(60, 0); const hills = new THREE.Mesh(new THREE.ShapeGeometry(hs), flat(0xc9dcc2)); hills.position.set(0, 0, -13); S.add(hills);
  // ground: pavement left of the gate, lawn right of it, the street and the park path
  S.add(ground(-40, GATE, -13, 9, 0xe3dccd), ground(GATE, 50, -13, 9, 0xb9d49a), ground(-40, GATE, -0.5, 0.55, 0xd6cebd, 0.002), ground(GATE, 50, -0.42, 0.42, 0xead9b0, 0.002));
  const joint = flat(INK, { transparent: true, opacity: 0.2 }); for (let x = -30; x < GATE; x += 0.8) S.add(ground(x - 0.007, x + 0.007, -0.5, 0.55, 0, 0.004, joint));
  // houses along the street
  for (let i = 0; i < 6; i++) {
    const x = -2.2 - i * 2.3, h = 1.9 + rnd(i) * 0.7, c = [0xf1d9b5, 0xe9c3a6, 0xdfd3bd, 0xf0cfa0][i % 4];
    S.add(box(x - 1.05, 0, -3.4, x + 1.05, h, -2.6, { front: c, top: 0xc8a98a, side: 0xcdb695 }, 0.016));
    const rs = new THREE.Shape(); rs.moveTo(-1.15, 0); rs.lineTo(0, 0.75); rs.lineTo(1.15, 0); rs.closePath();
    const roof = inked(new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 0.84, bevelEnabled: false }), flat(0xb8553f)), 0.016); roof.position.set(x, h, -3.42); S.add(roof);
    for (const wx of [-0.5, 0.5]) for (const wy of [0.9, 1.7]) {
      if (wy + 0.45 > h - 0.1) continue;
      const fr = ground(0, 1, 0, 1, 0, 0, flat(INK)); fr.geometry = new THREE.PlaneGeometry(0.44, 0.49); fr.position.set(x + wx, wy + 0.225, -2.596); S.add(fr);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.45), flat(0xcfe3ea)); win.position.set(x + wx, wy + 0.225, -2.592); S.add(win);
    }
  }
  // pond, hedge, trees, bench, flowers
  const pondInk = new THREE.Mesh(new THREE.CircleGeometry(1, 40), flat(INK)); pondInk.rotation.x = -Math.PI / 2; pondInk.scale.set(1.73, 0.73, 1); pondInk.position.set(6.3, 0.003, -2.3); S.add(pondInk);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 40), flat(0x9fd0df)); pond.rotation.x = -Math.PI / 2; pond.scale.set(1.7, 0.7, 1); pond.position.set(6.3, 0.005, -2.3); S.add(pond);
  const ball = new THREE.SphereGeometry(1, 20, 14);
  for (let x = GATE + 0.4; x < 26; x += 0.95) { const b = new THREE.Mesh(ball, flat(0x86b46b)); b.scale.set(0.62, 0.62, 0.5); b.position.set(x, 0.5, -4.4); S.add(b); }
  const tree = (x, z, h, hue) => {
    const trunk = inked(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, h * 0.6, 10), flat(0x8a5a35)), 0.012); trunk.position.set(x, h * 0.3, z); S.add(trunk);
    const crown = new THREE.Group(), hull = new THREE.Group(); crown.position.set(x, 0, z); hull.position.set(x, 0, z - 0.02);
    for (const [dx, dy, r] of [[0, 0.78, 0.44], [-0.34, 0.62, 0.34], [0.34, 0.62, 0.34], [-0.16, 0.95, 0.3], [0.2, 0.93, 0.3]]) {
      const R = r * h * 0.6, b = new THREE.Mesh(ball, flat(hue)); b.scale.set(R, R, R * 0.7); b.position.set(dx * h * 0.6, dy * h, 0); crown.add(b);
      const o = new THREE.Mesh(ball, flat(INK)); o.scale.set(R + 0.022, R + 0.022, R * 0.7); o.position.copy(b.position); hull.add(o);
    }
    S.add(hull, crown);
  };
  [[1.5, -3.4, 2.1, 0x7fb069], [3.6, -3.9, 2.5, 0x6aa65c], [8.6, -3.3, 2.3, 0x7fb069], [10.4, -3.8, 2.6, 0x6aa65c], [12.6, -3.1, 2.2, 0x86b46b], [-1.3, -2.3, 1.9, 0x8fba74]].forEach((p) => tree(...p));
  for (const x of [2.72, 3.5]) S.add(box(x, 0, -1.55, x + 0.05, 0.3, -1.3, { front: 0x6b4a2c, side: 0x553a22 }, 0.008));
  S.add(box(2.6, 0.3, -1.6, 3.65, 0.35, -1.25, { front: 0xb98450, top: 0xd9a868 }, 0.01));
  for (const y of [0.44, 0.56]) S.add(box(2.6, y, -1.62, 3.65, y + 0.08, -1.6, { front: 0xc79258, top: 0xd9a868 }, 0.01));
  for (const x of [2.66, 3.57]) S.add(box(x, 0.35, -1.625, x + 0.03, 0.66, -1.6, { front: 0x6b4a2c, side: 0x553a22 }, 0.006));
  for (let i = 0; i < 26; i++) { const f = new THREE.Mesh(ball, flat([0xffffff, 0xf6d255, 0xf29b9b][i % 3])); f.scale.setScalar(0.03); f.position.set(0.6 + rnd(i) * 13, 0.05, -0.85 - rnd(i + 50) * 1.5); S.add(f); }
  // the gate: two posts, a beam, the sign (a little lower than the canvas gate, so the sign stays in the closer picture)
  const gate = new THREE.Group(); S.add(gate);
  const near = [];                                   // the post between her and the camera: it fades while she is in the gate
  for (const z of [-0.72, 0.72]) {
    const a = box(GATE - 0.11, 0, z - 0.09, GATE + 0.11, 1.4, z + 0.09, { front: 0xd8cdb8, top: 0xece4d2, side: 0xb9ac94 }, 0.012);
    const b = box(GATE - 0.15, 1.4, z - 0.12, GATE + 0.15, 1.48, z + 0.12, { front: 0xc2b59c, top: 0xe0d6c0, side: 0xa59880 }, 0.012);
    gate.add(a, b); if (z > 0) near.push(a, b);
  }
  for (const m of near) for (const q of m.material) { q.transparent = true; }
  gate.add(box(GATE - 0.05, 1.48, -0.72, GATE + 0.05, 1.55, 0.72, { front: 0x8a6a45, top: 0xa9875c, side: 0x7a5c3a }, 0.008));
  const sign = textPlate('STADTPARK', 0.96, 0.27, '#5d7a52', '#fffaf0'); sign.position.set(GATE, 1.62, 0.86); gate.add(sign);
  const gc = document.createElement('canvas'); gc.width = gc.height = 128; const gx = gc.getContext('2d'), rg = gx.createRadialGradient(64, 64, 4, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,214,150,1)'); rg.addColorStop(0.55, 'rgba(255,214,150,.45)'); rg.addColorStop(1, 'rgba(255,214,150,0)'); gx.fillStyle = rg; gx.fillRect(0, 0, 128, 128);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, opacity: 0, depthWrite: false })); glow.position.set(GATE, 0.95, -0.9); gate.add(glow);
  // tufts of grass near the camera
  const blade = new THREE.BufferGeometry(); blade.setAttribute('position', new THREE.Float32BufferAttribute([-0.012, 0, 0, 0.012, 0, 0, 0, 0.1, 0], 3));
  for (let i = 0; i < 9; i++) {
    const x = -5 + i * 2.1 + rnd(i) * 0.8, z = 0.95 + rnd(i + 9) * 0.3, m = flat(x > GATE ? 0x5f9450 : 0x9aa58a, { side: THREE.DoubleSide });
    for (let k = -2; k <= 2; k++) { const b = new THREE.Mesh(blade, m); b.position.set(x + k * 0.03, 0, z); b.rotation.z = -k * 0.2; b.scale.y = 1 - Math.abs(k) * 0.14; S.add(b); }
  }
  return { S, gate, sign, glow, near };
}

// the grammar drawn on the ground
function buildOverlays(scene) {
  const O = new THREE.Group(); scene.add(O); const o = {};
  const AZ = [-4, 1.4], AX = [GATE + 0.1, 10.5], dash = (x0, z0, x1, z1, m) => { const len = Math.hypot(x1 - x0, z1 - z0), g = new THREE.PlaneGeometry(len, 0.04); g.rotateX(-Math.PI / 2); const q = new THREE.Mesh(g, m); q.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); q.rotation.y = -Math.atan2(z1 - z0, x1 - x0); return q; };
  // the park as a place (Wo?): tint and dashed border
  o.areaMat = decal(0x2f5d50, 0); o.area = ground(AX[0], AX[1], AZ[0], AZ[1], 0, 0.008, o.areaMat); O.add(o.area);
  o.borderMat = decal(0x2f5d50, 0); o.border = new THREE.Group(); O.add(o.border);
  const ring = [[AX[0], AZ[0], AX[1], AZ[0]], [AX[1], AZ[0], AX[1], AZ[1]], [AX[1], AZ[1], AX[0], AZ[1]], [AX[0], AZ[1], AX[0], AZ[0]]];
  for (const [x0, z0, x1, z1] of ring) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 0.19); for (let i = 0; i < n; i++) { const a = i / n, b = (i + 0.55) / n; o.border.add(dash(lerp(x0, x1, a), lerp(z0, z1, a), lerp(x0, x1, b), lerp(z0, z1, b), o.borderMat)); } }
  // outside (the pavement before the gate) and the boundary line at the gate
  o.outMat = decal(0xd9622b, 0); O.add(ground(-9, GATE - 0.1, AZ[0], AZ[1], 0, 0.008, o.outMat));
  o.lineMat = decal(0xd9622b, 0); const bl = ground(GATE - 0.03, GATE + 0.03, AZ[0], AZ[1], 0, 0.014, o.lineMat); O.add(bl);
  // the way in (Wohin?): dashes through the gate with an arrow head, shown as far as she has come
  o.arrowMat = decal(0xd9622b, 0); o.dashes = [];
  for (let x = -1.7; x < 1.2; x += 0.21) { const d = dash(x, 0.48, x + 0.125, 0.48, o.arrowMat); d.scale.z = 2.0; d.userData.x = x; o.dashes.push(d); O.add(d); }
  const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute([1.52, 0.013, 0.48, 1.22, 0.013, 0.33, 1.22, 0.013, 0.63], 3)); hg.setIndex([0, 1, 2]);
  o.head = new THREE.Mesh(hg, o.arrowMat); O.add(o.head);
  // her route inside the park: dots where she has been
  o.trailMat = decal(0x2f5d50, 0.85); const dg = new THREE.CircleGeometry(0.035, 10); dg.rotateX(-Math.PI / 2);
  o.trail = new THREE.InstancedMesh(dg, o.trailMat, 260); o.trail.count = 0; o.trail.frustumCulled = false; O.add(o.trail);
  return o;
}

/* ---------- the staging: what she does when, and what lights up ---------- */
// cue starts are the measured lengths of the narration clips (seconds)
export const SCENES = {
  location: { route: 'within', length: 26.33, cues: [0, 9.195, 18.576], start: { x: 1.5, z: 0.05, yaw: Math.PI / 2 }, tag: 'im Park · Wo?', goal: false },
  goal: { route: 'into', length: 22.43, cues: [0, 4.783, 15.232], start: { x: -2.35, z: 0, yaw: Math.PI / 2 }, tag: 'in den Park · Wohin?', goal: true, crossing: 5.583 },
  within: { route: 'within', length: 9.6, cues: [0], start: { x: 1.6, z: 0, yaw: Math.PI / 2 }, tag: 'im Park · Wo?', goal: false },
  into: { route: 'into', length: 8, cues: [0], start: { x: -3.4, z: 0, yaw: Math.PI / 2 }, tag: 'in den Park · Wohin?', goal: true },
};
// a loop on the lawn: she never leaves the park
const LOOP = [[4.6, 0.1], [5.1, -0.03], [5.3, -0.28], [5.1, -0.54], [4.6, -0.62], [2.1, -0.62], [1.58, -0.54], [1.38, -0.28], [1.58, -0.02], [2.1, 0.1]];

function events(id, P) {
  const A = P.actor, jog = A.runSpeed * P.jog;
  if (id === 'location') return [
    { t: 0.5, do: () => P.follow(LOOP, jog, 1, () => { A.moveTo(3.0, 0.1, { speed: jog, run: true, then: () => { A.turnTo(0.12); P.arrived = A.t; } }); }) },
    { t: 9.9, do: () => { A.play('hips'); } },                                 // she has stopped: catches her breath
    { t: 12.6, do: () => { A.setExpression('smile'); A.play('present'); } },   // here, in the park
    { t: 18.9, do: () => { A.lookAt(null); A.play('hips'); } },
    { t: 22.6, do: () => { A.setExpression('happy'); A.play('wave'); } },
  ];
  if (id === 'goal') return [
    { t: 0.9, do: () => { A.play('point'); } },                                // outside: over there, the park
    { t: P.goStart, do: () => { A.moveTo(2.6, 0, { run: true, then: () => { A.turnTo(0.12); A.after(0.55, () => { A.setExpression('smile'); A.play('thumb'); }); } }); } },
    { t: 11.4, do: () => { A.play('present'); } },
    { t: 15.6, do: () => { A.setExpression('happy'); A.play('hips'); } },
    { t: 19.2, do: () => { A.setExpression('laugh'); A.play('cheer'); A.after(1.9, () => A.setExpression('happy')); } },
  ];
  if (id === 'within') return [
    { t: 0.7, do: () => A.moveTo(5.6, 0, { run: true, then: () => A.moveTo(2.6, 0, { run: true, then: () => A.after(0.2, () => { A.turnTo(0); A.play('cheer', { dur: 1.8 }); }) }) }) },
  ];
  return [
    { t: 0.7, do: () => A.moveTo(2.6, 0, { run: true, then: () => A.after(0.2, () => { A.turnTo(0); A.play('thumb', { dur: 1.8 }); }) }) },
  ];
}
// what is lit at time t: 0..1 each
function fx(id, t, P) {
  const s = SCENES[id], c = s.cues;
  if (id === 'location') return { trail: 1, area: 0.22 * env(t, c[1] + 0.2, 1e9, 0.9) * (c[2] < t ? 0.75 + 0.25 * Math.cos((t - c[2]) * 1.6) : 1), border: env(t, c[1] + 0.2, 1e9, 0.9), out: 0, line: 0, arrow: 0, gate: 0 };
  if (id === 'goal') { const x = s.crossing; return { trail: 0, out: 0.16 * env(t, 0.3, c[1] - 0.2, 0.6), line: env(t, 0.3, c[2], 0.6) * (0.55 + 0.45 * Math.sin(t * 4.2) ** 2), arrow: env(t, c[1], 1e9, 0.4), gate: env(t, x - 0.35, x + 0.9, 0.3), area: 0.2 * env(t, c[2] + 0.1, 1e9, 0.9), border: env(t, c[2] + 0.1, 1e9, 0.9) }; }
  const m = t > 0.7 ? 1 : 0;
  return id === 'within' ? { trail: 0, area: 0.2 * m, border: m, out: 0, line: 0, arrow: 0, gate: 0 } : { trail: 0, area: 0, border: 0, out: 0, line: 0, arrow: m, gate: 0 };
}

export class ParkScene {
  static async create(o = {}) {
    const actor = await LivActor.load(o.model || new URL('../models/liv.vrm', import.meta.url).href, { scale: o.scale || 1 });
    return new ParkScene(actor, o);
  }
  constructor(actor, o = {}) {
    this.actor = actor; this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0xf6efe0);
    this.scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb9a98a, 1.85)); const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(1.5, 3, 2.5); this.scene.add(sun);
    this.set = buildScenery(this.scene); this.ov = buildOverlays(this.scene); this.scene.add(actor.root);
    this.camera = new THREE.PerspectiveCamera(o.fov || 21, 16 / 9, 0.5, 80);
    this.jog = 0.6; this.goStart = 3.90;            // jog pace (share of her run speed); when she sets off so that she is in the gate at the crossing time
    this.id = null; this.t = 0; this._tmp = new THREE.Object3D(); this.reset('goal');
  }
  reset(id) {
    const s = SCENES[id]; this.id = id; this.t = 0; this.k = 0; this.ev = events(id, this).sort((a, b) => a.t - b.t); this.ei = 0;
    this.actor.reset(s.start); this.way = null; this.arrived = null; this.maxX = s.start.x; this.crossed = null;
    this.camX = s.start.x + 0.55; this.pts = []; this.dist = 0; this.last = [s.start.x, s.start.z]; this.ov.trail.count = 0;
  }
  // run along way points without stopping at each (moveTo stops): steer toward the next point, then hand over
  follow(pts, speed, laps, done) { this.way = { pts, speed, i: 0, left: laps * pts.length, done }; }
  _step() {
    const A = this.actor; this.t = ++this.k * H;
    while (this.ei < this.ev.length && this.ev[this.ei].t <= this.t) this.ev[this.ei++].do();
    if (this.way) {
      const w = this.way, [px, pz] = w.pts[w.i], dx = px - A.x, dz = pz - A.z;
      if (Math.hypot(dx, dz) < 0.42) { w.i = (w.i + 1) % w.pts.length; if (--w.left <= 0) { this.way = null; w.done && w.done(); } }
      else A.setVelocity(w.speed, Math.atan2(dx, dz));
    }
    A.update(H);
    const moving = A.v > 0.3, dir = Math.sin(A.yaw);
    this.camX = lerp(this.camX, A.x + dir * (moving ? 0.5 : 0.1), 1 - Math.exp(-H * 3.2));
    if (this.crossed == null && this.last[0] < GATE && A.x >= GATE) this.crossed = this.t;
    this.maxX = Math.max(this.maxX, A.x);
    this.dist += Math.hypot(A.x - this.last[0], A.z - this.last[1]); this.last = [A.x, A.z];
    if (SCENES[this.id].route === 'within' && this.dist >= 0.17 && this.pts.length < 260) { this.dist = 0; this.pts.push([A.x, A.z]); }
  }
  // the scene at time t (seconds). Forward in small steps continues; anything else replays from 0, so the same t gives the same picture
  seek(id, t) {
    t = clamp(t, 0, SCENES[id].length); const n = Math.round(t / H), A = this.actor;
    if (id !== this.id || n < this.k || n - this.k > 150) { this.reset(id); }
    const springs = A.springs !== false;
    while (this.k < n) { A.springs = springs && (n - this.k) * H <= 1.5; this._step(); }
    A.springs = springs; this._apply(); return this;
  }
  _apply() {
    const o = this.ov, f = fx(this.id, this.t, this), s = SCENES[this.id], col = s.goal ? 0xd9622b : 0x2f5d50;
    o.areaMat.opacity = f.area; o.borderMat.opacity = f.border * 0.95; o.outMat.opacity = f.out; o.lineMat.opacity = f.line * 0.9; o.arrowMat.opacity = f.arrow;
    for (const d of o.dashes) d.visible = f.arrow > 0 && (this.id === 'into' || d.userData.x < this.maxX + 0.25);
    o.head.visible = f.arrow > 0 && (this.id === 'into' || this.maxX > 1.2);
    o.trailMat.color.setHex(col); o.trail.visible = f.trail > 0; o.trail.count = this.pts.length;
    this.pts.forEach((p, i) => { this._tmp.position.set(p[0], 0.011, p[1]); this._tmp.updateMatrix(); o.trail.setMatrixAt(i, this._tmp.matrix); }); o.trail.instanceMatrix.needsUpdate = true;
    const g = f.gate, pulse = g * (0.5 + 0.5 * Math.sin(this.t * 9)); this.set.glow.material.opacity = 0.75 * g * (0.6 + 0.4 * pulse); this.set.sign.scale.setScalar(1 + 0.08 * pulse);
    const hide = 1 - ss(0.25, 0.75, Math.abs(this.actor.x - GATE));                 // she is in the gate: let her be seen through the near post
    for (const m of this.set.near) { for (const q of m.material) q.opacity = 1 - 0.78 * hide; m.children[0].visible = hide < 0.02; }
    const d = 5.9, pitch = 8 * Math.PI / 180, cam = this.camera;
    cam.position.set(this.camX, 0.72 + Math.sin(pitch) * d, Math.cos(pitch) * d); cam.lookAt(this.camX, 0.72, 0);
  }
  cueAt(t = this.t) { const c = SCENES[this.id].cues; let i = 0; while (i + 1 < c.length && t >= c[i + 1]) i++; return i; }
  render(renderer) { const s = renderer.getSize(new THREE.Vector2()); this.camera.aspect = s.x / s.y; this.camera.updateProjectionMatrix(); renderer.render(this.scene, this.camera); }
}
