// Liv 2.5D · what the Rive rig is built from: Liv's head and upper body seen from the front, one picture per piece
// (back hair, body, face skin, eyes, brows, mouth, front hair), each with its depth, and the same turn rendered from
// the 3D model to compare with. Open through the shot server (tools/liv3d/demo/shot_server.py), then in the console:
//   await __export25d()            -> l25_<piece>.png, l25_<piece>_z.png, l25_meta.json in the server's folder
//   await __ref25d()               -> l25_ref_<turn>_<tilt>.png: the 3D model at those turns
// Depth pictures: R,G = world z as 16 bits over [-ZR, ZR] metres, B = 255 where the piece has a surface.
import * as THREE from 'three';
import { LivActor } from '../liv3d.js';
import { EXPRESSIONS } from '../face.js';

export const W = 900, H = 1100, ZR = 0.6;
export const TURN = 40, BODY = 12, TILT = 6;          // degrees at turn = 1 (head, upper body) and tilt = 1 (head)
const log = (s) => { document.getElementById('log').textContent = s; };
const canvas = document.getElementById('c');
const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W, H, false); canvas.style.width = W / 2 + 'px'; canvas.style.height = H / 2 + 'px';
R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb9a98a, 1.85));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(1.5, 3, 2.5); scene.add(sun);
const a = await LivActor.load('../../../grammatik/liv/liv.vrm'); scene.add(a.root);
a.reset({ x: 0, z: 0, yaw: 0 }); a.face.blinkAt = 1e9; a.face.idle = false;
for (let i = 0; i < 40; i++) a.update(1 / 60);

const bone = (n) => a.vrm.scene.getObjectByName(n);
const wp = (o) => o.getWorldPosition(new THREE.Vector3());
const meshes = []; a.vrm.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
const matName = (o) => (Array.isArray(o.material) ? o.material[0] : o.material).name || '';
const KIND = [['mouth', /FaceMouth/], ['iris', /EyeIris/], ['hl', /EyeHighlight/], ['skin', /Face_00_SKIN/], ['white', /EyeWhite/], ['brow', /FaceBrow/], ['line', /FaceEyeline/],
  ['body', /Body_00_SKIN/], ['tops', /Tops/], ['shoes', /Shoes/], ['cap', /HairBack/], ['hair', /Hair_00_HAIR/]];
for (const o of meshes) o.userData.kind = (KIND.find(([, re]) => re.test(matName(o))) || ['other'])[0];
const mats = (o) => (Array.isArray(o.material) ? o.material : [o.material]);

// the frame: from the waist to a little above the hair; the camera looks at her front
const box = new THREE.Box3().setFromObject(a.vrm.scene), head = wp(bone('J_Bip_C_Head')), hips = wp(bone('J_Bip_C_Hips'));
const y0 = hips.y + 0.03, y1 = box.max.y + 0.05, S = H / (y1 - y0), CZ = 5;                 // S: pixels per metre
const cam = new THREE.OrthographicCamera(-W / 2 / S, W / 2 / S, (y1 - y0) / 2, -(y1 - y0) / 2, 1, 9);
cam.position.set(hips.x, (y0 + y1) / 2, CZ); cam.lookAt(hips.x, (y0 + y1) / 2, 0); cam.updateMatrixWorld();
const setClip = (zNear, zFar) => { cam.near = CZ - zNear; cam.far = CZ - zFar; cam.updateProjectionMatrix(); };   // world z of the nearest and farthest surface kept
const px = (v) => [+((v.x - hips.x) * S + W / 2).toFixed(2), +((y1 - v.y) * S).toFixed(2), +(v.z * S).toFixed(2)];   // artboard x, y and depth in pixels

const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
R.localClippingEnabled = true;
// the hair is parted into a front and a back half on a plane through the head joint that turns with the head
function part(side, turn) {                 // side: 1 front half, -1 back half, 0 whole
  const th = turn * TURN * Math.PI / 180, n = new THREE.Vector3(Math.sin(th), 0, Math.cos(th)), p = wp(bone('J_Bip_C_Head'));
  const planes = side ? [new THREE.Plane().setFromNormalAndCoplanarPoint(n.clone().multiplyScalar(side), p.clone().addScaledVector(n, side > 0 ? -0.005 : 0.007))] : [];
  for (const o of meshes) if (o.userData.kind === 'hair' || o.userData.kind === 'cap') for (const m of mats(o)) { m.clippingPlanes = planes; m.clipping = true; m.needsUpdate = true; }
  depthMat.clippingPlanes = planes; depthMat.needsUpdate = true;
}
const rt = new THREE.WebGLRenderTarget(W, H, { depthBuffer: true });
function show(kinds, hidden = []) {       // kinds drawn; hidden: kinds that only hide what lies behind them
  for (const o of meshes) {
    const k = o.userData.kind; o.visible = kinds.includes(k) || hidden.includes(k);
    if (o.userData.ro0 === undefined) o.userData.ro0 = o.renderOrder;
    o.renderOrder = hidden.includes(k) ? -100 : o.userData.ro0;      // what hides must be drawn first
    for (const m of mats(o)) m.colorWrite = !hidden.includes(k);
  }
}
async function post(name, blob) { await fetch('/save?name=' + encodeURIComponent(name), { method: 'POST', body: blob }); }
async function savePiece(name) {
  R.setRenderTarget(null); R.clear(); R.render(scene, cam);
  await post(`l25_${name}.png`, await new Promise((r) => canvas.toBlob(r, 'image/png')));
}
async function saveDepth(name, hidden) {
  // the pieces drawn in colour, with the depth material; what only hides them is left out (its depth is not the piece's)
  const vis = meshes.map((o) => o.visible); for (const o of meshes) if (hidden.includes(o.userData.kind)) o.visible = false;
  scene.overrideMaterial = depthMat; R.setRenderTarget(rt); R.setClearColor(0xffffff, 1); R.clear(); R.render(scene, cam);
  const buf = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, buf);
  scene.overrideMaterial = null; R.setRenderTarget(null); R.setClearColor(0x000000, 0); meshes.forEach((o, i) => { o.visible = vis[i]; });
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), im = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = ((H - 1 - y) * W + x) * 4, o = (y * W + x) * 4;
    const d = (255 / 256) * (buf[i] / 255 / 16777216 + buf[i + 1] / 255 / 65536 + buf[i + 2] / 255 / 256 + buf[i + 3] / 255);
    const hit = d < 0.9999, z = CZ - (cam.near + d * (cam.far - cam.near)), q = Math.max(0, Math.min(65535, Math.round((z + ZR) / (2 * ZR) * 65535)));
    im.data[o] = hit ? q >> 8 : 0; im.data[o + 1] = hit ? q & 255 : 0; im.data[o + 2] = hit ? 255 : 0; im.data[o + 3] = 255;
  }
  g.putImageData(im, 0, 0); await post(`l25_${name}_z.png`, await new Promise((r) => c.toBlob(r, 'image/png')));
}
async function piece(name, kinds, hidden = [], clip = [1.5, -1.5]) { show(kinds, hidden); setClip(...clip); await savePiece(name); await saveDepth(name, hidden); }
// The skull is part of the body's mesh (it turns with the head and lies under the hair): the body's picture leaves out
// every triangle that hangs more on the head bone than on the neck (what is left of the skull's dark underside above
// the neck is taken out of the picture by its colour, in liv25d_prep.py).
function dropSkull() {
  for (const o of meshes) if (o.userData.kind === 'body' && !o.userData.cut) {
    const g = o.geometry, hi = o.skeleton.bones.findIndex((b) => b.name === 'J_Bip_C_Head'), si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const headW = (v) => { let w = 0; for (let k = 0; k < 4; k++) if (si.getComponent(v, k) === hi) w += sw.getComponent(v, k); return w; };
    const idx = g.index.array, keep = [];
    for (let t = 0; t < idx.length; t += 3) if (headW(idx[t]) + headW(idx[t + 1]) + headW(idx[t + 2]) < 1.5) keep.push(idx[t], idx[t + 1], idx[t + 2]);
    o.userData.cut = [g.index, new THREE.BufferAttribute(new (idx.constructor)(keep), 1), g.groups.map((x) => ({ ...x }))];
  }
}
function skull(on) {
  for (const o of meshes) if (o.userData.cut) {
    const [full, cut, groups] = o.userData.cut, g = o.geometry; g.setIndex(on ? full : cut); g.clearGroups();
    for (const x of groups) g.addGroup(on ? x.start : 0, on ? x.count : cut.count, x.materialIndex);
  }
}
// faces: the cast's five, a blink and an open mouth for talking
export const FACES = { happy: EXPRESSIONS.happy, blink: { ...EXPRESSIONS.happy, blink: 1 }, talk: { ...EXPRESSIONS.happy, aa: 0.55 },
  smile: EXPRESSIONS.smile, laugh: EXPRESSIONS.laugh, surprised: EXPRESSIONS.surprised, sad: EXPRESSIONS.sad };
function setFace(name) {
  const em = a.vrm.expressionManager; for (const k of Object.keys(em.expressionMap)) em.setValue(k, 0);
  for (const [k, v] of Object.entries(FACES[name])) if (em.expressionMap[k]) em.setValue(k, v);
  em.update();
}
// the turn in 3D: the upper body turns on the spine, the head on the neck, the head also nods
// (turns about the world's axes: the bones' own frames lean a little, and turning in them moved the head sideways)
a.vrm.scene.updateMatrixWorld(true);
const restL = new Map(), restW = new Map();
for (const n of ['J_Bip_C_Spine', 'J_Bip_C_Head']) { restL.set(n, bone(n).quaternion.clone()); restW.set(n, bone(n).getWorldQuaternion(new THREE.Quaternion())); }
function setWorldQuat(b, q) { const pq = b.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); b.quaternion.copy(pq.multiply(q)); a.vrm.scene.updateMatrixWorld(true); }
function setTurn(turn, tilt) {
  const D = Math.PI / 180, qy = (d) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), d * D), qx = (d) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), d * D);
  for (const n of ['J_Bip_C_Spine', 'J_Bip_C_Head']) bone(n).quaternion.copy(restL.get(n)); a.vrm.scene.updateMatrixWorld(true);
  setWorldQuat(bone('J_Bip_C_Spine'), qy(turn * BODY).multiply(restW.get('J_Bip_C_Spine')));
  setWorldQuat(bone('J_Bip_C_Head'), qy(turn * TURN).multiply(qx(tilt * TILT)).multiply(restW.get('J_Bip_C_Head')));
}

window.__export25d = async () => {
  const FACE = ['skin', 'white', 'iris', 'hl', 'line', 'brow', 'mouth'], J = {}; dropSkull(); setClip(1.5, -1.5);
  const joints = () => Object.fromEntries(Object.entries({ head: 'J_Bip_C_Head', neck: 'J_Bip_C_Neck', spine: 'J_Bip_C_Spine', chest: 'J_Bip_C_UpperChest', hips: 'J_Bip_C_Hips' }).map(([k, n]) => [k, px(wp(bone(n)))]));
  // nine captures, every quarter of the turn (10 degrees): the head straight (z), turned to her right (n1..n4) and
  // to her left (p1..p4). Each piece as it shows then; the front hair without what the face hides of it (the far
  // lock behind the cheek).
  const VIEWS = { z: 0, n1: -0.25, p1: 0.25, n2: -0.5, p2: 0.5, n3: -0.75, p3: 0.75, n4: -1, p4: 1 };
  for (const [v, turn] of Object.entries(VIEWS)) {
    setTurn(turn, 0); setFace('happy'); J[v] = joints();
    part(-1, turn); await piece(`${v}_hairB`, ['hair', 'cap']);
    part(1, turn); await piece(`${v}_hairF`, ['hair', 'cap'], ['skin', 'white', 'mouth']); part(0, turn);   // (the eyes' whites too: through the skin's eye holes the far lock showed)
    await piece(`${v}_face`, FACE); show(['skin']); await saveDepth(`${v}_skin`, []);
    for (const f of Object.keys(FACES)) if (f !== 'happy') { setFace(f); show(FACE); await savePiece(`${v}_face_${f}`); }
  }
  setTurn(0, 0); setFace('happy'); skull(true); await piece('z_body', ['body', 'tops']);   // (with the skull: liv25d_prep.py keeps the neck's skin and drops the rest)
  show(KIND.map((k) => k[0])); await savePiece('whole');
  const meta = { W, H, S, ZR, turn: TURN, body: BODY, tilt: TILT, joints: J.z, jointsAt: J, faces: Object.keys(FACES), views: VIEWS };
  await post('l25_meta.json', new Blob([JSON.stringify(meta)])); log('exported'); return meta;
};
window.__ref25d = async (turns = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1], tilts = [0]) => {
  setFace('happy'); show(KIND.map((k) => k[0])); setClip(1.5, -1.5);
  for (const ti of tilts) for (const tu of turns) { setTurn(tu, ti); R.clear(); R.render(scene, cam); await post(`l25_ref_${tu}_${ti}.png`, await new Promise((r) => canvas.toBlob(r, 'image/png'))); }
  setTurn(0, 0); R.clear(); R.render(scene, cam); return 'ok';
};
window.__dbg = { a, meshes, cam, R, scene, THREE, show, setClip, setFace, setTurn, px, wp, bone };
show(KIND.map((k) => k[0])); R.render(scene, cam); log('ready: ' + meshes.map((o) => o.userData.kind).join(' ')); window.__ready = true;
