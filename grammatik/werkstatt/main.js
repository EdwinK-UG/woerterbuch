// Trennbar-Werkstatt 3D · B1 Kapitel 57 (three.js + generated sound). Opened from the lesson, see grammatik.js.
// Same lesson logic as the Rive version: a workman pulls a bench-mounted drop saw down onto each verb.
// Separable verbs split (the prefix flies to the end of the sentence); inseparable verbs make the saw kick back.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ROUNDS, loadRounds } from './rounds.js?v=1';
import { Sfx } from './sfx.js?v=1';

const qs = new URLSearchParams(location.search), TEST = qs.has('test');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sfx = new Sfx();

// ---------- renderer, camera, light ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: TEST });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf3e9d8);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
scene.add(new THREE.HemisphereLight(0xfff6e6, 0xb89a74, 0.8));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.0); sun.position.set(2.6, 4.4, 3.2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -2, near: 0.5, far: 14 }); sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
scene.add(sun); const fill = new THREE.DirectionalLight(0xdde8ff, 0.45); fill.position.set(-3, 2, 2); scene.add(fill);

const mats = {};
const mat = (hex, rough = 0.75, metal = 0, extra = {}) => { const k = hex + '|' + rough + '|' + metal + JSON.stringify(extra); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: rough, metalness: metal }, extra))); };
const C = { wood: 0xe2b77d, woodDark: 0xa8733f, prefix: 0xf0a98a, paper: 0xfffaf0, ink: '#2a2f3a', coralInk: '#8a2e20', skin: 0xe9b48c, skinDark: 0xc98d66, denim: 0x3f6fa8, denimDark: 0x2c5182, cap: 0x2f6e9e, beard: 0x6b4630, boot: 0x7a4a2c, amber: 0xe6a532, steel: 0xc9d1d6, dark: 0x3a3f45, green: 0x2f7d5b };
const shadowy = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
const box = (w, h, d, m, r = 0.01) => new THREE.Mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d), m);
const cyl = (r1, r2, h, m, seg = 20) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m);
const sph = (r, m, seg = 24) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), m);
const UP = new THREE.Vector3(0, 1, 0), V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- text on blocks ----------
const BH = 0.13, MPP = BH / 128;          // block height 13 cm; 128 canvas px per block height
const measureCtx = document.createElement('canvas').getContext('2d');
function textW(t, scale = 1) { measureCtx.font = '500 80px Inter'; return measureCtx.measureText(t).width * MPP * scale; }
function textTexture(t, w, color, scale = 1) {
  const c = document.createElement('canvas'); c.width = Math.max(64, Math.round(w / MPP / scale)); c.height = 128;
  const g = c.getContext('2d'); g.font = '500 80px Inter'; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, c.width / 2, 68);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}
function plankTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#e2b77d'; g.fillRect(0, 0, 512, 64); g.strokeStyle = 'rgba(150,100,50,.35)'; g.lineWidth = 2;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 8 + i * 10); for (let x = 0; x <= 512; x += 32) g.lineTo(x, 8 + i * 10 + Math.sin(x * 0.03 + i) * 3); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const grain = plankTexture();
const woodMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: grain, roughness: 0.7 });
const prefixMat = new THREE.MeshStandardMaterial({ color: C.prefix, map: grain, roughness: 0.7 });
// a block: wooden (or paper) box with its word printed on the front face
function makeBlock(t, kind, scale = 1, dent = false) {
  const w = textW(t, scale) + 0.06 * scale, h = BH * scale, d = (kind === 'paper' ? 0.05 : 0.14) * scale;
  const g = new THREE.Group();
  const m = kind === 'prefix' ? prefixMat : kind === 'paper' ? mat(C.paper, 0.9) : woodMat;
  const b = box(w, h, d, m, 0.012 * scale); b.castShadow = true; b.receiveShadow = true; g.add(b);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textTexture(t, w, kind === 'prefix' ? C.coralInk : C.ink, scale), transparent: true, toneMapped: false }));
  p.position.z = d / 2 + 0.0015; g.add(p);
  if (dent) { const n = new THREE.Mesh(new THREE.ConeGeometry(0.018 * scale, 0.03 * scale, 4), mat(0x7a4a26)); n.rotation.x = Math.PI; n.position.set(0, h / 2 - 0.008, 0); g.add(n); }
  g.userData = { w, h, d, text: t }; return g;
}
function ghost(w, h, d) { const g = box(w, h, d, new THREE.MeshStandardMaterial({ color: 0xc9b493, transparent: true, opacity: 0.35, roughness: 1 }), 0.01); return g; }
function label(t, color, scale, bg) {
  const w = textW(t, scale) + 0.04 * scale; const g = new THREE.Group();
  if (bg) { const b = box(w + 0.02, BH * scale, 0.02, mat(bg, 0.9), 0.008); g.add(b); }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, BH * scale), new THREE.MeshBasicMaterial({ map: textTexture(t, w, color, scale), transparent: true, toneMapped: false })); p.position.z = 0.012; g.add(p);
  g.userData.w = w; return g;
}

// ---------- the workshop ----------
const BENCH_Y = 0.95, BOARD_Z = -0.12, CUT_X = 0.2, COL_X = CUT_X + 0.42, COL_Z = -0.34, R_BLADE = 0.17;
const RAISED = BENCH_Y + BH + 0.06 + R_BLADE, TOUCH = BENCH_Y + BH + R_BLADE - 0.012, THROUGH = BENCH_Y + R_BLADE - 0.02;
const room = new THREE.Group(); scene.add(room);
{
  const fc = document.createElement('canvas'); fc.width = 512; fc.height = 512; const g = fc.getContext('2d'); g.fillStyle = '#d9c3a0'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(140,100,60,.25)'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace; ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(3, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.z = 1.5; floor.receiveShadow = true; room.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), mat(0xefe3cf, 0.95)); wall.position.set(0, 3, -1.35); wall.receiveShadow = true; room.add(wall);
  // pegboard with tools
  const pc = document.createElement('canvas'); pc.width = 256; pc.height = 140; const pg = pc.getContext('2d'); pg.fillStyle = '#e2cfae'; pg.fillRect(0, 0, 256, 140); pg.fillStyle = 'rgba(140,100,60,.45)';
  for (let x = 10; x < 256; x += 18) for (let y = 10; y < 140; y += 18) { pg.beginPath(); pg.arc(x, y, 2.4, 0, 7); pg.fill(); }
  const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace;
  const peg = box(1.2, 0.66, 0.025, new THREE.MeshStandardMaterial({ map: pt, roughness: 0.9 }), 0.01); peg.position.set(0.05, 1.95, -1.33); room.add(peg);
  const hammer = new THREE.Group(); const hh = cyl(0.014, 0.014, 0.34, mat(0x8c6239)); hammer.add(hh); const hd = box(0.11, 0.045, 0.045, mat(0x5d6670, 0.4, 0.6), 0.006); hd.position.y = 0.17; hammer.add(hd); hammer.position.set(-0.35, 1.95, -1.29); room.add(shadowy(hammer));
  const wrench = box(0.03, 0.32, 0.012, mat(0x7d868d, 0.35, 0.7), 0.006); wrench.position.set(-0.13, 1.95, -1.3); room.add(shadowy(wrench));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 10, 20), mat(0x7d868d, 0.35, 0.7)); ring.position.set(-0.13, 2.13, -1.3); room.add(shadowy(ring));
  const saw2 = box(0.04, 0.3, 0.01, mat(0xc8503d, 0.6), 0.005); saw2.rotation.z = 0.2; saw2.position.set(0.1, 1.95, -1.3); room.add(shadowy(saw2));
  const rule = box(0.36, 0.035, 0.01, mat(0xf1c64c, 0.6), 0.004); rule.position.set(0.35, 2.1, -1.3); room.add(shadowy(rule));
  // window
  const win = box(0.86, 0.62, 0.03, mat(0xefe3cf, 0.8), 0.01); win.position.set(1.15, 1.95, -1.33); room.add(win);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.52), new THREE.MeshBasicMaterial({ color: 0xcfe3ea })); glass.position.set(1.15, 1.95, -1.31); room.add(glass);
  const bar1 = box(0.025, 0.52, 0.02, mat(0xefe3cf)); bar1.position.set(1.15, 1.95, -1.3); room.add(bar1); const bar2 = box(0.76, 0.025, 0.02, mat(0xefe3cf)); bar2.position.set(1.15, 1.95, -1.3); room.add(bar2);
  // workbench
  const top = box(2.5, 0.08, 0.8, woodMat, 0.02); top.position.set(0.05, BENCH_Y - 0.04, 0); room.add(top);
  for (const x of [-1.1, 1.2]) for (const z of [-0.32, 0.32]) { const l = box(0.08, BENCH_Y - 0.08, 0.08, mat(C.woodDark, 0.8), 0.01); l.position.set(x, (BENCH_Y - 0.08) / 2, z); room.add(l); }
  const st = box(2.3, 0.05, 0.04, mat(C.woodDark, 0.8), 0.01); st.position.set(0.05, 0.25, 0.3); room.add(st);
  shadowy(room); floor.castShadow = false; wall.castShadow = false;
}
// drop saw: base and column stay, the head slides down
const head = new THREE.Group(); const blade = new THREE.Group(); const handlePts = { L: V(), R: V() };
{
  const base = box(0.3, 0.035, 0.26, mat(0x5d6670, 0.5, 0.4), 0.01); base.position.set(COL_X, BENCH_Y + 0.017, COL_Z); room.add(shadowy(base));
  const col = cyl(0.028, 0.028, 0.95, mat(0x9aa3aa, 0.35, 0.8)); col.position.set(COL_X, BENCH_Y + 0.47, COL_Z); room.add(shadowy(col));
  const capT = box(0.09, 0.04, 0.09, mat(0x5d6670, 0.5, 0.4), 0.01); capT.position.set(COL_X, BENCH_Y + 0.95, COL_Z); room.add(shadowy(capT));
  // head: carriage, arm, motor, guard, handle, blade
  const carriage = box(0.09, 0.12, 0.09, mat(0x4a5159, 0.5, 0.4), 0.012); carriage.position.set(COL_X, 0.07, COL_Z - BOARD_Z); head.add(carriage);
  const armLen = Math.hypot(COL_X - CUT_X, COL_Z - BOARD_Z); const arm = box(armLen, 0.05, 0.05, mat(0x5d6670, 0.5, 0.4), 0.01);
  arm.position.set((COL_X + CUT_X) / 2 + 0.03, 0.08, (COL_Z - BOARD_Z) / 2); arm.rotation.y = Math.atan2(-(COL_Z - BOARD_Z), COL_X - CUT_X); head.add(arm);
  const motor = cyl(0.07, 0.07, 0.13, mat(C.amber, 0.5, 0.1)); motor.rotation.z = Math.PI / 2; motor.position.set(CUT_X + 0.1, 0.0, 0); head.add(motor);
  for (let i = 0; i < 4; i++) { const v = box(0.012, 0.09, 0.014, mat(0xb9822a, 0.6)); v.position.set(CUT_X + 0.06 + i * 0.025, 0.0, 0.07); head.add(v); }
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(R_BLADE + 0.025, R_BLADE + 0.025, 0.07, 40, 1, true, 0, Math.PI), mat(C.amber, 0.5, 0.1, { side: THREE.DoubleSide }));
  guard.rotation.z = Math.PI / 2; guard.rotation.y = Math.PI / 2; guard.position.set(CUT_X, 0, 0); head.add(guard);
  const guardSide = new THREE.Mesh(new THREE.CircleGeometry(R_BLADE + 0.025, 40, 0, Math.PI), mat(C.amber, 0.5, 0.1, { side: THREE.DoubleSide })); guardSide.rotation.y = Math.PI / 2; guardSide.position.set(CUT_X + 0.036, 0, 0); head.add(guardSide);
  // handle: angled back towards the workman, below his face
  const hA = V(CUT_X - 0.07, R_BLADE - 0.02, 0), hB = V(CUT_X - 0.36, R_BLADE - 0.11, -0.1);
  const hDir = hB.clone().sub(hA), hLen = hDir.length(); const hnd = cyl(0.02, 0.02, hLen, mat(C.dark, 0.6)); hnd.position.copy(hA).addScaledVector(hDir, 0.5); hnd.quaternion.setFromUnitVectors(UP, hDir.clone().normalize()); head.add(hnd);
  const grip = cyl(0.026, 0.026, hLen * 0.55, mat(0x222428, 0.9)); grip.position.copy(hA).addScaledVector(hDir, 0.72); grip.quaternion.copy(hnd.quaternion); head.add(grip); grip.name = 'grip';
  handlePts.L.copy(hA).addScaledVector(hDir, 0.52); handlePts.R.copy(hA).addScaledVector(hDir, 0.9);
  // blade with teeth (extruded star), spinning about the x axis
  const sh = new THREE.Shape(); const teeth = 28;
  for (let i = 0; i < teeth * 2; i++) { const a = (i / (teeth * 2)) * Math.PI * 2, r = i % 2 === 0 ? R_BLADE : R_BLADE - 0.014; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y); }
  const bladeGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false, curveSegments: 4 }); bladeGeo.translate(0, 0, -0.003);
  const disc = new THREE.Mesh(bladeGeo, mat(0xdfe5e9, 0.3, 0.75)); blade.add(disc);
  const hub = cyl(0.03, 0.03, 0.02, mat(0x7d868d, 0.4, 0.8)); hub.rotation.x = Math.PI / 2; blade.add(hub);
  for (let i = 0; i < 3; i++) { const s2 = box(0.11, 0.012, 0.008, mat(0xaeb7bd, 0.3, 0.9), 0.003); s2.rotation.z = i * 2.1; s2.position.set(Math.cos(i * 2.1) * 0.065, Math.sin(i * 2.1) * 0.065, 0.004); blade.add(s2); }
  blade.rotation.y = Math.PI / 2; blade.position.set(CUT_X, 0, 0); head.add(blade);
  head.position.set(0, RAISED, BOARD_Z); scene.add(shadowy(head));
}
// sentence plank in front, wall shelves on the left
const plank = new THREE.Group(); scene.add(plank);
const shelfUnit = new THREE.Group(); scene.add(shelfUnit);
const SHELF = { x: -1.42, y: 1.12, z: -1.27, colW: 0.5, rowH: 0.2 };
{
  const back = box(1.08, 1.06, 0.03, mat(0xd8c3a0, 0.9), 0.01); back.position.set(SHELF.x, SHELF.y + 0.5, SHELF.z - 0.02); shelfUnit.add(back);
  for (let c = 0; c < 2; c++) for (let i = 0; i < 4; i++) {
    const s = box(SHELF.colW, 0.022, 0.14, woodMat, 0.006); s.position.set(SHELF.x + (c ? 0.27 : -0.27), SHELF.y + i * SHELF.rowH, SHELF.z + 0.05); shelfUnit.add(s);
  }
  const div = box(0.022, 0.8, 0.14, woodMat, 0.006); div.position.set(SHELF.x, SHELF.y + 0.33, SHELF.z + 0.05); shelfUnit.add(div);
  const l1 = label('TRENNBAR', '#ffffff', 0.62, C.green); l1.position.set(SHELF.x - 0.27, SHELF.y + 0.9, SHELF.z + 0.02); shelfUnit.add(l1);
  const l2 = label('UNTRENNBAR', '#ffffff', 0.62, 0x41536b); l2.position.set(SHELF.x + 0.27, SHELF.y + 0.9, SHELF.z + 0.02); shelfUnit.add(l2);
  shadowy(shelfUnit);
}

// ---------- the workman ----------
const W = new THREE.Group(); scene.add(W); W.position.set(-0.36, 0, -0.52); W.rotation.y = 0.35;
const plaid = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#c8574a'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(255,220,190,.35)'; for (let i = 0; i < 128; i += 32) { g.fillRect(i, 0, 8, 128); g.fillRect(0, i, 128, 8); }
  g.fillStyle = 'rgba(90,20,20,.25)'; for (let i = 16; i < 128; i += 32) { g.fillRect(i, 0, 4, 128); g.fillRect(0, i, 128, 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
})();
const shirtMat = new THREE.MeshStandardMaterial({ map: plaid, roughness: 0.85 });
const skinMat = mat(C.skin, 0.7), denimMat = mat(C.denim, 0.85), denimDark = mat(C.denimDark, 0.85);
const torso = new THREE.Group(); W.add(torso); torso.position.y = 0.98;           // hips pivot
const headG = new THREE.Group(); torso.add(headG); headG.position.y = 0.72;
const face = {};
{
  for (const x of [-0.1, 0.1]) { const leg = cyl(0.075, 0.07, 0.86, denimMat); leg.position.set(x, 0.53, 0); W.add(leg); const cuff = cyl(0.08, 0.08, 0.06, denimDark); cuff.position.set(x, 0.14, 0); W.add(cuff);
    const boot = box(0.13, 0.1, 0.24, mat(C.boot, 0.7), 0.035); boot.position.set(x, 0.05, 0.04); W.add(boot); const sole = box(0.14, 0.025, 0.25, mat(0x4e2f1c), 0.008); sole.position.set(x, 0.012, 0.04); W.add(sole); }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.36, 8, 20), shirtMat); body.scale.set(1.05, 1, 0.72); body.position.y = 0.27; torso.add(body);
  const pants = cyl(0.2, 0.19, 0.18, denimMat); pants.scale.set(1.0, 1, 0.74); pants.position.y = 0.04; torso.add(pants);
  const bib = box(0.28, 0.3, 0.05, denimMat, 0.02); bib.position.set(0, 0.24, 0.125); torso.add(bib);
  const pocket = box(0.11, 0.08, 0.012, denimDark, 0.008); pocket.position.set(0, 0.27, 0.152); torso.add(pocket);
  for (const x of [-0.11, 0.11]) { const strap = box(0.045, 0.32, 0.03, denimMat, 0.01); strap.position.set(x, 0.48, 0.03); strap.rotation.x = -0.25; torso.add(strap);
    const btn = cyl(0.016, 0.016, 0.012, mat(0xf1c64c, 0.3, 0.8)); btn.rotation.x = Math.PI / 2; btn.position.set(x, 0.37, 0.155); torso.add(btn); }
  const neck = cyl(0.055, 0.06, 0.1, mat(C.skinDark, 0.7)); neck.position.y = 0.66; torso.add(neck);
  const skull = sph(0.135, skinMat); skull.scale.set(1, 1.08, 1); headG.add(skull);
  for (const x of [-0.13, 0.13]) { const ear = sph(0.035, mat(C.skinDark, 0.7)); ear.scale.set(0.6, 1, 0.8); ear.position.set(x, 0, -0.01); headG.add(ear); }
  const hair = sph(0.14, mat(0x5a3a26, 0.9)); hair.scale.set(1.02, 0.7, 1.0); hair.position.set(0, 0.02, -0.03); headG.add(hair);
  const beard = sph(0.125, mat(C.beard, 0.95)); beard.scale.set(1.0, 0.85, 0.85); beard.position.set(0, -0.065, 0.035); headG.add(beard);
  const cheekL = sph(0.07, skinMat); cheekL.position.set(-0.055, 0.0, 0.085); headG.add(cheekL); const cheekR = cheekL.clone(); cheekR.position.x = 0.055; headG.add(cheekR);
  const nose = sph(0.034, mat(0xe7a882, 0.6)); nose.scale.set(1, 0.9, 1.1); nose.position.set(0, 0.0, 0.135); headG.add(nose);
  const mus = sph(0.06, mat(C.beard, 0.95)); mus.scale.set(1.3, 0.38, 0.6); mus.position.set(0, -0.045, 0.125); headG.add(mus);
  for (const x of [-0.05, 0.05]) {
    const eye = sph(0.022, mat(0xffffff, 0.3)); eye.position.set(x, 0.04, 0.118); headG.add(eye);
    const pupil = sph(0.012, mat(0x1d2028, 0.3)); pupil.position.set(x, 0.04, 0.138); headG.add(pupil);
    const brow = box(0.055, 0.013, 0.015, mat(0x4a2e1e, 0.9), 0.005); brow.position.set(x, 0.085, 0.124); headG.add(brow); (face.brows || (face.brows = [])).push(brow);
  }
  face.smile = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0075, 8, 16, Math.PI), mat(0x7c2e25, 0.6)); face.smile.rotation.z = Math.PI; face.smile.position.set(0, -0.07, 0.122); headG.add(face.smile);
  face.ow = sph(0.018, mat(0x5c1f19, 0.6)); face.ow.scale.set(1, 1.2, 0.6); face.ow.position.set(0, -0.08, 0.125); headG.add(face.ow);
  const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.145, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(C.cap, 0.7)); capTop.position.y = 0.05; headG.add(capTop);
  const band = cyl(0.146, 0.146, 0.035, mat(0x24577f, 0.7)); band.position.y = 0.055; headG.add(band);
  const brim = cyl(0.11, 0.11, 0.014, mat(0x24577f, 0.7), 24); brim.scale.set(1, 1, 1.25); brim.position.set(0, 0.05, 0.15); brim.rotation.x = 0.08; headG.add(brim);
  const knob = sph(0.016, mat(0x24577f)); knob.position.y = 0.195; headG.add(knob);
}
// arms: segments are placed between computed shoulder, elbow and hand points every frame
const UA = 0.34, FA = 0.32;
function limb(r, m) { const o = cyl(r, r * 0.94, 1, m, 14); scene.add(o); o.castShadow = true; return o; }
function placeLimb(o, a, b) { const d = b.clone().sub(a), len = d.length(); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(UP, d.normalize()); o.scale.set(1, len, 1); }
function makeHand(sign) {
  const g = new THREE.Group(); scene.add(g); const kinds = {};
  const fistG = new THREE.Group(); const fist = sph(0.05, skinMat); fist.scale.set(0.95, 0.8, 1.1); fistG.add(fist); const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.04, 4, 8), skinMat); th.rotation.x = Math.PI / 2.4; th.position.set(0.035 * sign, 0.03, 0.02); fistG.add(th); kinds.fist = fistG;
  const gripG = new THREE.Group(); const gf = sph(0.05, skinMat); gf.scale.set(1, 0.85, 1.05); gripG.add(gf);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.013, 6, 10, Math.PI * 1.2), skinMat); f.rotation.y = Math.PI / 2; f.position.set(-0.03 + i * 0.02, -0.01, 0.03); gripG.add(f); }
  const gth = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.04, 4, 8), skinMat); gth.rotation.z = Math.PI / 2; gth.position.set(0, 0.035, 0.03); gripG.add(gth); kinds.grip = gripG;
  const openG = new THREE.Group(); const palm = box(0.085, 0.025, 0.08, skinMat, 0.012); openG.add(palm);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.045 + (i === 1 || i === 2 ? 0.01 : 0), 4, 8), skinMat); f.rotation.x = Math.PI / 2; f.position.set(-0.03 + i * 0.02, 0, 0.075); openG.add(f); }
  const oth = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.04, 4, 8), skinMat); oth.rotation.set(Math.PI / 2, 0, -0.9 * sign); oth.position.set(0.05 * sign, 0, 0.025); openG.add(oth); kinds.open = openG;
  const upG = new THREE.Group(); const uf = sph(0.05, skinMat); uf.scale.set(0.95, 0.85, 1.05); upG.add(uf); const ut = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.05, 4, 8), skinMat); ut.position.set(0, 0.07, 0.01); upG.add(ut); kinds.thumb = upG;
  for (const k of Object.values(kinds)) { g.add(k); k.traverse((m) => { if (m.isMesh) m.castShadow = true; }); }
  return { g, kinds };
}
const ARMS = {};
for (const side of ['L', 'R']) {
  const sign = side === 'L' ? 1 : -1;
  ARMS[side] = { sign, upper: limb(0.055, shirtMat), fore: limb(0.045, skinMat), cuff: limb(0.06, mat(0xb64a3f, 0.85)), sJ: sph(0.075, shirtMat), eJ: sph(0.052, shirtMat), hand: makeHand(sign) };
  scene.add(ARMS[side].sJ, ARMS[side].eJ); ARMS[side].sJ.castShadow = ARMS[side].eJ.castShadow = true;
}

// ---------- state ----------
const S = { mode: 0, round: 0, t: 0, kind: 'cut', waiting: false, decided: false, playing: true, slow: false, hold: 0, drag: 0, dragging: false,
  sepList: [], insList: [], score: 0, tries: 0, verdict: '', verdictOk: true, landed: false, portrait: false, shake: 0, spin: 0 };
const ease = (k) => { const x = Math.min(1, Math.max(0, k)); return x * x * (3 - 2 * x); };
const seg = (t, a, b) => ease((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const cur = () => ROUNDS[S.round];
const END = 5.6;

function sawState() {
  const t = S.t;
  if (t < 1.05) return { y: RAISED, jit: 0, held: false };
  if (S.waiting || (S.kind !== 'whole' && t < 1.31)) return { y: lerp(RAISED, TOUCH, S.drag), jit: 0, held: true };
  if (S.kind === 'cut') {
    if (t < 2.0) return { y: lerp(RAISED, TOUCH, seg(t, 1.3, 2.0)), jit: 0, held: true };
    if (t < 2.7) return { y: lerp(TOUCH, THROUGH, (t - 2.0) / 0.7), jit: 0, held: true };
    return { y: lerp(THROUGH, RAISED, seg(t, 2.7, 3.3)), jit: 0, held: t < 3.0 };
  }
  if (S.kind === 'fail') {
    if (t < 2.0) return { y: lerp(RAISED, TOUCH, seg(t, 1.3, 2.0)), jit: 0, held: true };
    if (t < 2.4) { const j = Math.sin(t * 95) * 0.004; return { y: TOUCH - 0.002 + Math.abs(j), jit: j, held: true }; }
    if (t < 3.1) { const k = (t - 2.4) / 0.7, kick = Math.sin(Math.min(1, k * 2.2) * Math.PI) * (1 - k * 0.4); return { y: lerp(TOUCH, RAISED, ease(k * 1.6)) + 0.07 * kick, jit: Math.sin(t * 40) * 0.006 * (1 - k), held: t < 2.45 }; }
  }
  return { y: RAISED, jit: 0, held: false };
}
const spinning = () => S.waiting ? S.drag > 0.02 : S.kind === 'cut' ? S.t > 1.05 && S.t < 3.0 : S.kind === 'fail' ? S.t > 1.05 && S.t < 2.45 : false;

// ---------- blocks for the current round ----------
let BL = { pre: null, stem: null, whole: null, fin: null, tokens: [], ghosts: [], words: [], tile: null };
const shelfObjs = [];
function clearRound() { for (const o of [BL.pre, BL.stem, BL.whole, BL.fin, BL.tile, ...BL.tokens, ...BL.ghosts, ...BL.words]) if (o) o.parent && o.parent.remove(o); BL = { pre: null, stem: null, whole: null, fin: null, tokens: [], ghosts: [], words: [], tile: null }; }
function layoutSentence() {
  const rd = cur(), sc = S.portrait ? 1.1 : 1, maxW = S.portrait ? 1.8 : 2.6, gap = 0.045 * sc;
  plank.clear();
  const items = rd.words.map((w) => { const kind = w === '#F' ? 'F' : w === '#P' ? 'P' : w === '#V' ? 'V' : (w === '.' || w === '?') ? 'punct' : 'w';
    const text = kind === 'F' || kind === 'V' ? rd.fin : kind === 'P' ? rd.pre : w; const w0 = kind === 'punct' ? textW(text, sc) + 0.01 : textW(text, sc) + 0.06 * sc; return { kind, text, w: w0 }; });
  const rows = [[]]; let x = 0;
  for (const it of items) { const need = (rows.at(-1).length && it.kind !== 'punct' ? gap : 0) + it.w; if (x + need > maxW && rows.at(-1).length && it.kind !== 'punct') { rows.push([]); x = 0; } rows.at(-1).push(it); x += (rows.at(-1).length > 1 && it.kind !== 'punct' ? gap : 0) + it.w; }
  const cx = S.portrait ? 0.02 : -0.1, rowY = (i) => 0.6 - i * 0.3 * sc, rowZ = (i) => 1.05 + i * 0.14;
  rows.forEach((row, ri) => {
    const total = row.reduce((a, it, i) => a + it.w + (i && it.kind !== 'punct' ? gap : 0), 0); let px = cx - total / 2;
    const plankW = (S.portrait ? 2.0 : 2.75);
    const p = box(plankW, 0.045, 0.22, woodMat, 0.01); p.position.set(cx, rowY(ri) - 0.0225, rowZ(ri)); plank.add(p);
    for (const lx of [-plankW / 2 + 0.15, plankW / 2 - 0.15]) { const leg = cyl(0.02, 0.025, rowY(ri) - 0.045, mat(C.woodDark)); leg.position.set(cx + lx, (rowY(ri) - 0.045) / 2, rowZ(ri)); plank.add(leg); }
    row.forEach((it, i) => {
      if (i && it.kind !== 'punct') px += gap;
      const pos = V(px + it.w / 2, rowY(ri) + BH * sc / 2, rowZ(ri));
      it.pos = pos; it.scale = sc;
      if (it.kind === 'w') { const b = makeBlock(it.text, 'paper', sc); b.position.copy(pos); plank.add(b); }
      else if (it.kind === 'punct') { const l = label(it.text, C.ink, sc); l.position.set(pos.x, pos.y, pos.z - 0.01); plank.add(l); }
      else if (!(it.kind === 'P' && !rd.sep)) { const g = ghost(it.w, BH * sc, 0.12 * sc); g.position.copy(pos); plank.add(g); it.ghost = g; }
      px += it.w;
    });
  });
  shadowy(plank); BL.tokens = []; BL.items = items;
}
const tok = (k) => (BL.items || []).find((it) => it.kind === k);
function buildBoard() {
  const rd = cur(); BL.pre = makeBlock(rd.pre, 'prefix'); BL.stem = makeBlock(rd.stem, 'wood'); scene.add(BL.pre, BL.stem); shadowy(BL.pre); shadowy(BL.stem);
  const pencil = box(0.004, 0.003, 0.15, mat(0x5a3b22)); pencil.position.set(BL.pre.userData.w / 2, BH / 2 + 0.002, 0); BL.pre.add(pencil);
}
function boardLeft() { return CUT_X - BL.pre.userData.w; }
function shelfSlot(sep, i) { return V(SHELF.x + (sep ? -0.27 : 0.27), SHELF.y + i * SHELF.rowH + 0.011 + BH * 0.55 / 2 + 0.002, SHELF.z + 0.06); }
function shelfTile(idx) {
  const rd = ROUNDS[idx], sc = 0.55, g = new THREE.Group();
  if (rd.sep) { const a = makeBlock(rd.pre, 'prefix', sc), b = makeBlock(rd.stem, 'wood', sc); const tw = a.userData.w + b.userData.w + 0.015; a.position.x = -tw / 2 + a.userData.w / 2; b.position.x = tw / 2 - b.userData.w / 2; g.add(a, b); }
  else g.add(makeBlock(rd.pre + rd.stem, 'wood', sc, true));
  return shadowy(g);
}
function rebuildShelves() {
  for (const o of shelfObjs) o.parent && o.parent.remove(o); shelfObjs.length = 0;
  S.sepList.forEach((idx, i) => { const t = shelfTile(idx); t.position.copy(shelfSlot(true, i)); scene.add(t); shelfObjs.push(t); });
  S.insList.forEach((idx, i) => { const t = shelfTile(idx); t.position.copy(shelfSlot(false, i)); scene.add(t); shelfObjs.push(t); });
  for (const o of shelfObjs) o.visible = !S.portrait;
  const fmt = (l) => l.length ? l.map((i) => ROUNDS[i].sep ? ROUNDS[i].pre + '|' + ROUNDS[i].stem : ROUNDS[i].pre + ROUNDS[i].stem).join(', ') : '–';
  document.getElementById('sepList').textContent = ' ' + fmt(S.sepList); document.getElementById('insList').textContent = ' ' + fmt(S.insList);
}

// ---------- poses (world space) ----------
const tmp = new THREE.Vector3();
const local = (x, y, z) => W.localToWorld(V(x, y, z));
const HIPS = () => ({ L: local(0.215, 1.04, 0.03), R: local(-0.215, 1.04, 0.03), kL: 'fist', kR: 'fist', lean: 0, smile: 0.6, brow: 0, shrug: 0 });
function pose() {
  const t = S.t, sw = sawState(); const hp = HIPS();
  const L = handlePts.L.clone().add(V(sw.jit, sw.y, BOARD_Z)), R = handlePts.R.clone().add(V(sw.jit, sw.y, BOARD_Z));
  const hold = { L, R, kL: 'grip', kR: 'grip', lean: 0.08, smile: 0.35, brow: 0.2, shrug: 0 };
  if (t < 0.7) return hp;
  if (t < 1.3 || S.waiting || sw.held) { if (S.kind === 'fail' && t > 2.0 && t < 2.9) return Object.assign(hold, { smile: -1, brow: 1, lean: -0.06 }); return hold; }
  if (S.kind === 'cut') {
    const up = { L: hp.L, R: local(-0.27, 1.56, 0.24), kL: 'fist', kR: 'thumb', lean: -0.03, smile: 1, brow: 0.6, shrug: 0 };
    return t > 3.8 && t < 5.1 ? up : Object.assign(hp, { smile: 0.9 });
  }
  const st = Math.max(0, t - 2.5), amp = 0.07 * Math.exp(-st * 1.6), ph = st * Math.PI * 2 * 2.6;
  const shake = { L: hp.L, R: local(-0.13 + Math.sin(ph) * amp, 1.3 + Math.abs(Math.cos(ph)) * amp * 0.5, 0.3), kL: 'fist', kR: 'open', lean: -0.06, smile: -1, brow: 1, shrug: 0.2 };
  const bl = BL.pre ? boardLeft() : 0, push0 = Math.min(1, seg(t, 3.6, 4.0)) * 0.22;
  const push = { L: V(bl + 0.22, BENCH_Y + 0.07, BOARD_Z - 0.06 + push0), R: V(bl + 0.04, BENCH_Y + 0.07, BOARD_Z - 0.04 + push0), kL: 'open', kR: 'open', lean: 0.16, smile: 0.2, brow: 0.5, shrug: 0 };
  const shrug = { L: local(0.37, 1.27, 0.16), R: local(-0.37, 1.27, 0.16), kL: 'open', kR: 'open', lean: 0, smile: 0.25, brow: 0.9, shrug: 1 };
  if (S.kind === 'fail' && t < 3.3) return shake;
  if (t < 4.1) return push;
  if (t < 5.2) return shrug;
  return hp;
}
const handState = HIPS();
function smoothHands(dt) {
  const target = pose(), held = sawState().held, k = 1 - Math.exp(-dt * (held ? 30 : 9));
  for (const s of ['L', 'R']) { handState[s].lerp(target[s], k); if (handState[s].distanceTo(target[s]) < 0.06) handState['k' + s] = target['k' + s]; }
  for (const f of ['lean', 'smile', 'brow', 'shrug']) handState[f] = lerp(handState[f], target[f], Math.min(1, k * 1.5));
}
// two-bone IK with a pole: elbows point down, slightly out and back
function solveArm(side) {
  const A = ARMS[side], sh = handState.shrug * 0.035;
  const S0 = torso.localToWorld(V(A.sign * 0.23, 0.53 + sh, 0.0)), T = handState[side].clone();
  const d0 = T.clone().sub(S0); let d = d0.length(); const maxd = UA + FA - 0.004; if (d > maxd) { T.copy(S0).addScaledVector(d0.normalize(), maxd); d = maxd; }
  const dir = T.clone().sub(S0).normalize(), along = (UA * UA - FA * FA + d * d) / (2 * d), h = Math.sqrt(Math.max(0, UA * UA - along * along));
  // elbows point down, out and a little back; with the hand on the hip they swing out sideways (akimbo)
  const tl = W.worldToLocal(T.clone()), onHip = Math.max(0, Math.min(1, (1.18 - tl.y) / 0.12)) * Math.max(0, Math.min(1, (0.12 - tl.z) / 0.12));
  const pl = V(A.sign * lerp(0.45, 1.0, onHip), lerp(-0.8, -0.15, onHip), lerp(-0.3, -0.5, onHip));
  const pole = W.localToWorld(pl).sub(W.position).normalize(); pole.addScaledVector(dir, -pole.dot(dir)); if (pole.lengthSq() < 1e-6) pole.set(0, -1, 0); pole.normalize();
  const E = S0.clone().addScaledVector(dir, along).addScaledVector(pole, h);
  placeLimb(A.upper, S0, E); A.sJ.position.copy(S0); A.eJ.position.copy(E);
  const fdir = T.clone().sub(E).normalize(); placeLimb(A.fore, E, T); placeLimb(A.cuff, E, E.clone().addScaledVector(fdir, 0.07));
  const hand = A.hand, kind = handState['k' + side]; hand.g.position.copy(T).addScaledVector(fdir, 0.03);
  for (const [k, o] of Object.entries(hand.kinds)) o.visible = k === kind;
  if (kind === 'thumb') { hand.g.quaternion.setFromUnitVectors(V(0, 0, 1), V(0.15, 0, 1).normalize()); }
  else {
    const z = fdir.clone(), y = UP.clone().addScaledVector(z, -UP.dot(z)); if (y.lengthSq() < 1e-4) y.set(0, 0, 1); y.normalize(); const x = new THREE.Vector3().crossVectors(y, z);
    const m = new THREE.Matrix4().makeBasis(x, y, z); hand.g.quaternion.setFromRotationMatrix(m);
    if (kind === 'open' && S.t > 3.3 && S.t < 4.1 && S.kind !== 'cut') hand.g.rotateX(-Math.PI / 2);   // palms forward when pushing
  }
}
function updateWorkman(dt) {
  smoothHands(dt);
  torso.rotation.x = handState.lean; torso.position.y = 0.98 - Math.abs(handState.lean) * 0.03;
  headG.position.y = 0.72 + handState.shrug * 0.02 - handState.shrug * 0.03;
  // head follows the work
  const look = (S.kind === 'cut' && S.t > 3.0 && S.t < 4.2) || (S.kind !== 'cut' && S.t > 3.6 && S.t < 4.4) ? V(0, 0.6, 1.2) : V(CUT_X, BENCH_Y + 0.1, BOARD_Z);
  const lp = W.worldToLocal(look.clone()), want = Math.atan2(lp.x, lp.z) * 0.6, tilt = -0.25 + (S.t > 3.8 && S.kind === 'cut' ? 0.2 : 0);
  headG.rotation.y = lerp(headG.rotation.y, want, Math.min(1, dt * 5)); headG.rotation.x = lerp(headG.rotation.x, tilt, Math.min(1, dt * 5));
  face.smile.visible = handState.smile >= -0.2; face.ow.visible = !face.smile.visible; face.smile.scale.set(1, 0.5 + Math.max(0, handState.smile) * 0.8, 1);
  face.brows.forEach((b, i) => { b.position.y = 0.085 + handState.brow * 0.018; b.rotation.z = (i ? -1 : 1) * handState.brow * 0.18; });
  solveArm('L'); solveArm('R');
}

// ---------- sparks ----------
const SP = 160, spGeo = new THREE.BufferGeometry(), spPos = new Float32Array(SP * 3), spVel = new Float32Array(SP * 3), spLife = new Float32Array(SP), spCol = new Float32Array(SP * 3);
spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3));
const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(sparks);
let spNext = 0;
function emit(n, at, hot) {
  for (let i = 0; i < n; i++) { const j = spNext++ % SP; spPos.set([at.x, at.y, at.z], j * 3); const a = Math.random() * Math.PI - Math.PI, sp = 0.6 + Math.random() * 1.4;
    spVel.set([Math.cos(a) * 0.3 * Math.random(), Math.abs(Math.sin(a)) * sp * 0.6 + 0.2, 0.3 + Math.random() * sp], j * 3); spLife[j] = 0.35 + Math.random() * 0.4;
    if (hot) spCol.set([1, 0.55 + Math.random() * 0.3, 0.15], j * 3); else spCol.set([0.75, 0.6, 0.42], j * 3); }
}
function updateSparks(dt) {
  for (let j = 0; j < SP; j++) { if (spLife[j] <= 0) { spPos[j * 3 + 1] = -10; continue; } spLife[j] -= dt; spVel[j * 3 + 1] -= 3.5 * dt;
    for (let a = 0; a < 3; a++) spPos[j * 3 + a] += spVel[j * 3 + a] * dt; }
  spGeo.attributes.position.needsUpdate = true; spGeo.attributes.color.needsUpdate = true;
}

// ---------- blocks per frame ----------
const bez = (a, b, h, k) => { const m = a.clone().lerp(b, 0.5); m.y += h; const p = a.clone().lerp(m, k), q = m.clone().lerp(b, k); return p.lerp(q, k); };
function updateBlocks() {
  const rd = cur(), t = S.t, sw = sawState(); if (!BL.pre) return;
  const pw = BL.pre.userData.w, slide = -1.4 * (1 - seg(t, 0, 0.7));
  const shake = S.kind === 'fail' && t > 2.0 && t < 2.6 ? Math.sin(t * 80) * 0.004 : 0;
  const preHome = V(CUT_X - pw / 2 + slide + shake, BENCH_Y + BH / 2, BOARD_Z), stemHome = V(CUT_X + BL.stem.userData.w / 2 + slide + shake, BENCH_Y + BH / 2, BOARD_Z);
  BL.pre.visible = BL.stem.visible = true; if (BL.fin) BL.fin.visible = false; if (BL.whole) BL.whole.visible = false;
  if (S.kind === 'cut' && t >= 2.7) {
    const split = seg(t, 2.7, 3.0) * 0.03, fly = seg(t, 3.0, 4.0), P = tok('P'), F = tok('F');
    const a = preHome.clone().add(V(-split, 0, 0)), b = stemHome.clone().add(V(split, 0, 0));
    BL.pre.position.copy(bez(a, P.pos, 0.55, fly)); BL.pre.scale.setScalar(lerp(1, P.scale, fly)); BL.pre.rotation.z = Math.sin(fly * Math.PI) * 0.5;
    if (!BL.fin) { BL.fin = makeBlock(rd.fin, 'wood', F.scale); scene.add(shadowy(BL.fin)); }
    const morph = t > 3.55, sp = bez(b, F.pos, 0.3, fly);
    BL.stem.visible = !morph; BL.fin.visible = morph; BL.stem.position.copy(sp); BL.stem.scale.setScalar(lerp(1, F.scale, fly)); BL.fin.position.copy(sp);
    BL.fin.scale.setScalar(morph ? 0.9 + 0.1 * seg(t, 3.55, 3.75) : 1);
    if (fly >= 1) { if (P.ghost) P.ghost.visible = false; if (F.ghost) F.ghost.visible = false; }
    return;
  }
  if ((S.kind === 'fail' || S.kind === 'whole') && t >= 4.0) {
    const Vt = tok('V'), k = seg(t, 4.0, 4.5);
    if (!BL.whole) { BL.whole = makeBlock(rd.fin, 'wood', Vt.scale, true); scene.add(shadowy(BL.whole)); }
    const start = preHome.clone().lerp(stemHome, 0.5).add(V(0, 0, 0.22));
    BL.pre.visible = BL.stem.visible = false; BL.whole.visible = true; BL.whole.position.copy(bez(start, Vt.pos, 0.35, k)); BL.whole.rotation.x = Math.sin(k * Math.PI) * -0.4;
    if (k >= 1 && Vt.ghost) Vt.ghost.visible = false; return;
  }
  const pushZ = (S.kind !== 'cut' && t > 3.6) ? seg(t, 3.6, 4.0) * 0.22 : 0;
  BL.pre.position.copy(preHome).add(V(0, 0, pushZ)); BL.stem.position.copy(stemHome).add(V(0, 0, pushZ));
  if (S.kind === 'cut' && t > 2.0 && t < 2.7) { BL.pre.position.x -= 0; }
  BL.pre.rotation.set(0, 0, 0); BL.stem.rotation.set(0, 0, 0);
}
function updateTile() {
  const t = S.t, rd = cur(); const list = rd.sep ? S.sepList : S.insList;
  if (S.portrait || t < 4.6 || t >= 5.4 || list.includes(S.round)) { if (BL.tile) BL.tile.visible = false; return; }   // phones show the shelves as a list instead
  if (!BL.tile) { BL.tile = shelfTile(S.round); scene.add(BL.tile); }
  const src = (tok(rd.sep ? 'F' : 'V')).pos.clone().add(V(0, 0.12, 0.05)), dst = shelfSlot(rd.sep, list.length), k = seg(t, 4.6, 5.4);
  BL.tile.visible = true; BL.tile.position.copy(bez(src, dst, 0.6, k)); BL.tile.rotation.y = Math.sin(k * Math.PI) * 0.6;
}

// ---------- sound cues on the timeline ----------
const CUES = {
  cut: [[0.02, () => sfx.slide()], [1.05, () => sfx.motorOn()], [2.0, () => sfx.cut(0.7)], [2.7, () => sfx.crack()], [3.0, () => { sfx.motorOff(); sfx.whoosh(0.8); }], [4.0, () => { sfx.tock(1); setTimeout(() => sfx.tock(1.25), 90); }], [4.15, () => sfx.ding()], [4.6, () => sfx.whoosh(0.6, 0.12)], [5.4, () => sfx.tock(1.6, 0.25)]],
  fail: [[0.02, () => sfx.slide()], [1.05, () => sfx.motorOn()], [2.0, () => sfx.grind(0.4)], [2.4, () => { sfx.clonk(); sfx.motorOff(); S.shake = 0.35; }], [3.6, () => sfx.slide(0.45)], [4.0, () => sfx.whoosh(0.5, 0.15)], [4.5, () => sfx.tock(0.85)], [4.7, () => sfx.bonk()], [4.6, () => sfx.whoosh(0.6, 0.12)], [5.4, () => sfx.tock(1.6, 0.25)]],
  whole: [[3.6, () => sfx.slide(0.45)], [4.0, () => sfx.whoosh(0.5, 0.15)], [4.5, () => sfx.tock(0.85)], [4.6, () => sfx.whoosh(0.6, 0.12)], [5.4, () => sfx.tock(1.6, 0.25)]],
};
function fireCues(t0, t1) { for (const [at, fn] of CUES[S.kind] || []) if (t0 < at && at <= t1) fn(); }

// ---------- rounds and modes ----------
function startRound(i) {
  sfx.motorOff(); clearRound(); S.round = Math.max(0, Math.min(ROUNDS.length - 1, i)); S.t = 0; S.hold = 0; S.drag = 0; S.verdict = ''; S.decided = false; S.waiting = false;
  S.kind = cur().sep ? 'cut' : 'fail'; layoutSentence(); buildBoard(); ui();
}
function finish() { const rd = cur(), list = rd.sep ? S.sepList : S.insList; if (!list.includes(S.round)) { list.push(S.round); rebuildShelves(); } }
function decide(sawChosen) {
  if (!S.waiting) return; const rd = cur(); S.waiting = false; S.decided = true; S.tries++;
  const ok = sawChosen === rd.sep; if (ok) S.score++; S.verdictOk = ok; ok ? sfx.ding() : sfx.buzz();
  if (sawChosen && rd.sep) { S.verdict = 'Richtig! Die Säge trennt ' + rd.pre + ' ab.'; S.kind = 'cut'; S.t = 1.3 + 0.7 * S.drag; }
  else if (sawChosen) { S.verdict = 'Nicht ganz: ' + rd.pre + rd.stem + ' lässt sich nicht trennen.'; S.kind = 'fail'; S.t = 1.3 + 0.7 * S.drag; }
  else if (rd.sep) { S.verdict = 'Doch sägen! ' + rd.stress + ' ist trennbar.'; S.kind = 'cut'; S.t = 1.3; }
  else { S.verdict = 'Richtig! ' + rd.pre + rd.stem + ' bleibt ganz.'; S.kind = 'whole'; S.t = 3.0; sfx.motorOff(); }
  if (S.kind !== 'whole' && !sfx.motor) sfx.motorOn();
  S.drag = 0; ui();
}
function setMode(m) { S.mode = m; S.score = 0; S.tries = 0; S.sepList = []; S.insList = []; S.playing = m === 0; rebuildShelves(); startRound(0); }
function goNext() { if (S.round < ROUNDS.length - 1) startRound(S.round + 1); else if (S.mode === 1) setMode(1); }

// ---------- UI ----------
const $ = (id) => document.getElementById(id);
function ruleText() {
  const rd = cur(), note = rd.note ? ' (' + rd.pre + rd.stem + ' = ' + rd.note + ')' : '';
  return rd.sep ? 'Betonung auf dem Präfix: <b>' + rd.stress + '</b> ist trennbar. Das Präfix geht ans Satzende.' + note
    : 'Betonung auf dem Verb: <b>' + rd.stress + '</b> ist untrennbar. Die Säge schafft es nicht, das Verb bleibt ganz.' + note;
}
let lastUi = '';
function ui() {
  const done = S.t >= END - 0.2, rd = cur();
  $('round').textContent = 'Runde ' + (S.round + 1) + ' / ' + ROUNDS.length + (S.mode === 1 ? '  ·  Richtig: ' + S.score + ' / ' + S.tries : '');
  $('watch').classList.toggle('on', S.mode === 0); $('try').classList.toggle('on', S.mode === 1);
  let cap = '';
  if (S.mode === 1 && S.waiting) cap = 'Was passiert mit <b>' + rd.pre + rd.stem + '</b>? Ziehe den Griff der Säge nach unten oder wähle eine Taste.';
  else if (S.mode === 1 && S.verdict) cap = '<b class="' + (S.verdictOk ? 'ok' : 'no') + '">' + S.verdict + '</b>' + (S.t > 2.0 ? ' ' + ruleText() : '');
  else if (S.t > 2.0) cap = ruleText();
  const ctr = S.mode === 0
    ? `<button data-a="prev" ${S.round ? '' : 'disabled'}>Zurück</button><button data-a="play">${S.playing ? 'Pause' : 'Abspielen'}</button><button data-a="next" ${S.round < ROUNDS.length - 1 ? '' : 'disabled'}>Weiter</button><button data-a="slow" class="${S.slow ? 'on' : ''}">${S.slow ? '0,5×' : '1×'}</button>`
    : `<button data-a="saw" ${S.waiting ? '' : 'disabled'}>Sägen</button><button data-a="whole" ${S.waiting ? '' : 'disabled'}>Ganz einbauen</button><button data-a="next" ${done ? '' : 'disabled'}>${S.round < ROUNDS.length - 1 ? 'Nächstes Verb' : 'Neu starten'}</button><span class="score">Richtig: ${S.score} / ${S.tries}</span>`;
  const key = cap + '|' + ctr; if (key !== lastUi) { lastUi = key; $('caption').innerHTML = cap; $('controls').innerHTML = ctr; }
}
$('controls').addEventListener('click', (e) => { const a = e.target.closest('button')?.dataset.a; if (!a) return; sfx.ensure();
  if (a === 'prev') startRound(S.round - 1); else if (a === 'next') goNext(); else if (a === 'play') S.playing = !S.playing; else if (a === 'slow') S.slow = !S.slow;
  else if (a === 'saw') decide(true); else if (a === 'whole') decide(false); ui(); });
$('watch').onclick = () => { sfx.ensure(); setMode(0); }; $('try').onclick = () => { sfx.ensure(); setMode(1); };
$('sound').onclick = () => { sfx.ensure(); sfx.setOn(!sfx.on); $('sound').textContent = sfx.on ? 'Ton an' : 'Ton aus'; $('sound').setAttribute('aria-pressed', String(sfx.on)); };
$('go').onclick = () => { sfx.ensure(); $('start').remove(); started = true; };
addEventListener('keydown', (e) => { if (e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return; sfx.ensure();
  if (e.key === ' ') { S.playing = !S.playing; e.preventDefault(); } else if (e.key === 'ArrowRight' || e.key === 'Enter') goNext(); else if (e.key === 'ArrowLeft') startRound(S.round - 1);
  else if (e.key === 's' || e.key === 'S') decide(true); else if (e.key === 'g' || e.key === 'G') decide(false); ui(); });
// drag the saw handle down (try mode)
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let dragY0 = 0;
canvas.addEventListener('pointerdown', (e) => {
  if (!(S.mode === 1 && S.waiting)) return; sfx.ensure();
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (ray.intersectObject(head, true).length) { S.dragging = true; dragY0 = e.clientY; canvas.setPointerCapture(e.pointerId); if (!sfx.motor) sfx.motorOn(); }
});
canvas.addEventListener('pointermove', (e) => { if (!S.dragging) return; S.drag = Math.max(0, Math.min(1, (e.clientY - dragY0) / (innerHeight * 0.12))); });
canvas.addEventListener('pointerup', () => { if (!S.dragging) return; S.dragging = false; if (S.drag > 0.55) decide(true); else sfx.motorOff(); });

// ---------- layout / camera ----------
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  const portrait = w / h < 0.9; const changed = portrait !== S.portrait; S.portrait = portrait;
  if (portrait) { camera.fov = 40; const half = 1.15, d = half / (Math.tan(THREE.MathUtils.degToRad(20)) * camera.aspect); camera.position.set(0.15, 1.2 + d * 0.28, d); camera.lookAt(0.05, 0.92, 0.3); shelfUnit.visible = false; for (const o of shelfObjs) o.visible = false; }
  else { camera.fov = 35; const half = 2.0, d = Math.max(3.3, half / (Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.aspect)); camera.position.set(0.75, 1.2 + d * 0.2, d + 0.25); camera.lookAt(-0.15, 1.02, 0.2); shelfUnit.visible = true; for (const o of shelfObjs) o.visible = true; }
  if (qs.get('cam') === 'close') { camera.fov = 30; camera.position.set(0.55, 1.62, 1.55); camera.lookAt(-0.12, 1.25, -0.35); }
  camera.updateProjectionMatrix(); baseCam = camera.position.clone(); if (changed && BL.pre) { layoutSentence(); }
}
addEventListener('resize', resize);

// ---------- loop ----------
let started = false, last = performance.now(), baseCam = null;
function step(dt) {
  const before = S.t;
  if (S.mode === 1 && !S.decided) { if (S.t < 1.3) S.t = Math.min(1.3, S.t + dt); else if (!S.waiting) { S.waiting = true; ui(); } if (!S.dragging && S.drag > 0) S.drag = Math.max(0, S.drag - dt * 3); }
  else if ((S.playing || S.mode === 1) && S.t < END) { S.t = Math.min(END, S.t + dt); if (before < 5.4 && S.t >= 5.4) finish(); }
  else if (S.playing && S.mode === 0) { S.hold += dt; if (S.hold > 2.6 && S.round < ROUNDS.length - 1) startRound(S.round + 1); }
  if (started) fireCues(before, S.t);
  if (spinning()) S.spin += dt * (S.kind === 'fail' && S.t > 2.0 ? 8 : 38);
  const sw = sawState(); head.position.set(sw.jit, sw.y, BOARD_Z); blade.rotation.x = S.spin;
  if (S.kind === 'cut' && S.t > 2.0 && S.t < 2.7) emit(3, V(CUT_X + 0.0, BENCH_Y + BH, BOARD_Z + 0.07), false);
  if (S.kind === 'fail' && S.t > 2.0 && S.t < 2.42) emit(4, V(CUT_X, BENCH_Y + BH + 0.005, BOARD_Z + 0.07), true);
  updateSparks(dt); updateBlocks(); updateTile(); updateWorkman(dt);
  if (S.t > 2.0 && S.t - dt <= 2.0) ui(); if (S.t >= END - 0.2 && before < END - 0.2) ui();
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000) * (S.slow ? 0.5 : 1); last = now;
  if (started) step(dt);
  if (baseCam) { camera.position.copy(baseCam); if (S.shake > 0 && !reduce) { S.shake = Math.max(0, S.shake - dt); const a = S.shake * 0.05; camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a; } }
  renderer.render(scene, camera); requestAnimationFrame(frame);
}

// test hooks: jump to a moment deterministically (used for screenshots)
window.__tb = {
  S, seek(round, kind, t, mode = 0) { if (mode !== S.mode) setMode(mode); S.sepList = []; S.insList = []; for (let i = 0; i < round; i++) (ROUNDS[i].sep ? S.sepList : S.insList).push(i); rebuildShelves(); startRound(round); if (kind) S.kind = kind; const st = 1 / 60; let x = 0; while (x < t) { step(st); x += st; } resize(); ui(); renderer.render(scene, camera); return S.t; },
  decide, setMode,
};

// The example sentences come from the lesson page (Kapitel 57, loaded with the learner's enrolment), never from this
// public folder. The page answers 'werkstatt-ready' with the lesson's texts; 'werkstatt-close' asks it to close us.
const EMBED = window.parent !== window;
let gotRounds; const roundsReady = new Promise((r) => { gotRounds = r; });
function takeTexts(texts) { if (ROUNDS.length) return; if (loadRounds(texts)) gotRounds(); }
addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.type !== 'werkstatt-texts') return;
  takeTexts(e.data.texts);
});
const closeMe = () => { sfx.motorOff(); if (EMBED) window.parent.postMessage({ type: 'werkstatt-close' }, location.origin); };
if (EMBED) {
  const b = document.createElement('button'); b.id = 'close'; b.textContent = 'Schließen'; b.onclick = closeMe; $('sound').after(b);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMe(); }, true);
  window.parent.postMessage({ type: 'werkstatt-ready' }, location.origin);
}
if (TEST) window.__tbLoad = takeTexts;

(async () => {
  try { await document.fonts.load('500 80px Inter'); } catch (e) { console.warn('font', e); }
  if (TEST) document.getElementById('start')?.remove();
  resize(); rebuildShelves(); renderer.render(scene, camera);
  const go = $('go');
  if (go) { go.disabled = true; go.textContent = 'Lädt …'; }
  const late = setTimeout(() => {
    if (ROUNDS.length) return;
    const p = document.querySelector('#start p'); if (p) p.textContent = 'Die Werkstatt braucht die Beispielsätze aus Kapitel 57. Öffne sie in der Lektion „Trennbar oder untrennbar?“ (mit Anmeldung).';
    if (go) go.textContent = 'Nicht verfügbar';
  }, 6000);
  await roundsReady; clearTimeout(late);
  if (go) { go.disabled = false; go.textContent = 'Werkstatt öffnen'; go.focus(); }
  startRound(0); ui(); requestAnimationFrame(frame);
  if (TEST) { started = !qs.has('still'); window.__tbReady = true; }
})();
