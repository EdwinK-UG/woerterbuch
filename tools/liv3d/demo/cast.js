// Deutschklinik cast · every character on one stage, driven by the same LivActor player as Liv.
//   cast.html                       the line-up (Liv and the nine others); buttons make all of them walk, wave, emote
//   cast.html?ids=C03,C02           only those
// Hooks for contact sheets (posted to demo/shot_server.py, POST /save?name=x.png):
//   __views(name, ids, views)       one row per character: the given views, whole figure
//   __faces(name, id, exprs)        head close-ups, one per expression
//   __acts(name, id, actions)       one cell per action, at about the action's peak
//   __seq(name, id, setup, view, cols, rows, per, warm)   one motion over time
//   __lineup(name, fn)              everyone in a row, after fn(actor, i)
// 2D layers for Rive (tools/liv3d/rive2d, docs/rive2d-test.md):
//   __parts(id, {view, W2, H2, faces, prefix, order})   each body part alone through an orthographic camera, + joints
//   __rec(id, mode, {frames, prefix})                   joint paths of idle / walk / an action in that view
//   __oseq(name, id, mode, {view, n, every})            the whole figure through such a camera, n frames in a strip
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LivActor, ACTION_NAMES, EXPRESSION_NAMES } from '../liv3d.js';
import { ACTIONS } from '../actions.js';
import { shapeRow } from '../hands.js';
import { EXPRESSIONS } from '../face.js';

// faces for 2D heads: eyes shut (the 2D rig blinks by swapping heads) and an open mouth for talking, both on the
// resting smile
EXPRESSIONS.blink = { relaxed: 0.38, blink: 1.0 };
EXPRESSIONS.talk = { relaxed: 0.3, aa: 0.55 };
// the male face base bares its teeth with the sad mix's frown (a grimace): its sad face closes the mouth instead
EXPRESSIONS.sadMale = { sad: 0.85, ou: 0.12 };   // no lid droop: the male eyes are narrower and closed with it
const MALE = new Set(['C02', 'C04', 'A01', 'A02', 'A05']);

// wave2d: a wave staged for the three-quarter 2D view (camera on the character's right, 50 degrees round from the
// front). The 3D wave swings the hand out to the side, which from this angle points at the camera, so in a flat
// picture the arm hardly moves and reads like a hand at the hat brim. Here the hand is lifted above the hat and swings
// along the picture plane (out-and-back to forward-and-in), with the palm turned to the camera.
ACTIONS.wave2d = Object.assign((t, a) => {
  const s = Math.sin(t * 9.5);
  return { [a.n]: { h: [0.55 - 0.15 * s, 0.75 - 0.05 * Math.abs(s), 0.15 + 0.18 * s], e: [1, -0.5, 0.1], palm: [0.75, 0, 0.65], row: shapeRow('wave'), bend: 0, m: 0, free: 0, chin: 0 }, hr: 0.06 };
}, { dur: 2.6, tin: 0.22, tout: 0.25, key: 'act' });
// point2d: point for the three-quarter view, with the near arm. The 3D point uses the far arm, which in this view is
// stacked behind the body: its forearm stayed hidden and the hand floated in front of the chest.
ACTIONS.point2d = Object.assign((t, a) => ({ [a.n]: { h: [0.22, 0.12, 0.92], e: [0.3, -1, -0.3], palm: [0, -1, 0], row: shapeRow('point'), bend: 0, m: 0, free: 0, chin: 0 } }),
  { dur: 2.0, tin: 0.22, tout: 0.25, key: 'act' });
// pointSide: point for the front and back views, where the 3D point (forward) aims at the camera: the arm goes out
// to the side and a little up, in the picture plane.
ACTIONS.pointSide = Object.assign((t, a) => ({ [a.f]: { h: [0.97, 0.16, 0.06], e: [0.2, -1, -0.2], palm: [0, -1, 0.2], row: shapeRow('point'), bend: 0, m: 0, free: 0, chin: 0 },
}), { dur: 2.0, tin: 0.22, tout: 0.25, key: 'act' });
// pullDown: reach forward, close the hand on a handle, pull it down, hold, let go (a lever, the drop saw of the
// workshop scene, a rope). The near hand in the three-quarter view; pullSide does it out to the side for the front
// and back views. A page that draws the handle reads the recorded hand path (cast.js __rec) to put it in the hand.
const pullPose = (fwd) => (t, a) => {
  const sm = (x) => x * x * (3 - 2 * x), k = sm(Math.min(1, Math.max(0, (t - 1.1) / 0.8))) - sm(Math.min(1, Math.max(0, (t - 2.6) / 0.35))) * 0.25;
  const h = fwd ? [0.16, 0.06 - 0.5 * k, 0.74 - 0.12 * k] : [0.74, 0.06 - 0.5 * k, 0.06];
  return { [a.n]: { h, e: fwd ? [0.9, -0.6, -0.3] : [0.3, -1, -0.2], palm: fwd ? [-0.2, -1, 0.1] : [0, -1, 0.3], row: shapeRow('gripHandle', 0.85), bend: 0, m: 0, free: 0, chin: 0 },
    lean: 0.05 + 0.04 * k, hp: 0.06 };
};
ACTIONS.pullDown = Object.assign(pullPose(true), { dur: 3.2, tin: 0.3, tout: 0.3, key: 'act' });
ACTIONS.pullSide = Object.assign(pullPose(false), { dur: 3.2, tin: 0.3, tout: 0.3, key: 'act' });
// The clap, staged for the cut-outs. It is the 3D clap (actions.js): elbows down at the sides, forearms forward,
// the hands meeting in front of the chest, fingers up. An earlier staging pushed the hands far forward (three-quarter)
// or the elbows out sideways (front, back) so that no forearm pointed at the camera; both read as stiff arms held
// out, not as clapping. Now the forearms that do point at the camera are drawn in the clap's own pose (like the
// hands), the others are foreshortened by the rig, and in the three-quarter view the far forearm and hand are
// stacked in front of the body while she claps (see __export2d).
// The way in and out: the hands come up (and go down again) a little apart, each in front of its own shoulder, and
// only then close for the first clap. Going straight from the hanging hands to the meeting point, the cut-out
// forearms crossed at the waist for a few frames. (Further apart, they flew out sideways like wings in the front view.)
const CLAP_IN = 0.36, CLAP_DUR = 2.4;
const clapPose = (fwd, up) => (t) => {
  const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const on = t >= CLAP_IN && t < CLAP_DUR - 0.34, p = on ? ((t - CLAP_IN) % 0.42) / 0.42 : 0, k1 = p / 0.28, k2 = (p - 0.36) / 0.64;
  const o = !on ? 1 : p < 0.28 ? 1 - k1 * k1 : p < 0.36 ? 0 : 1 - (1 - k2) * (1 - k2);
  const wide = 0.16 * (1 - sm(t / CLAP_IN)) + 0.16 * sm((t - (CLAP_DUR - 0.34)) / 0.3);    // a little apart while they rise and sink: each hand in front of its own shoulder
  const A = { h: [0.07 + 0.17 * o + wide, up + 0.05 * o, fwd - 0.04 * o], e: [0.9, -0.7, 0], palm: [-1, 0.1, 0], row: shapeRow('flat'), bend: -0.95, m: 1, free: 0, chin: 0 };
  return { aL: A, aR: A, py: 0.985 + 0.004 * (1 - o) };
};
ACTIONS.clapFront = Object.assign(clapPose(0.56, -0.2), { dur: CLAP_DUR, tin: 0.22, tout: 0.25, key: 'act' });
ACTIONS.clap2d = Object.assign(clapPose(0.66, -0.17), { dur: CLAP_DUR, tin: 0.22, tout: 0.25, key: 'act' });
// pickUp: bow from the hips with the knees bent, reach down in front to about shin height (the top of a box, a
// basket's handle; a child's arm does not reach the ground without a full squat), close the hand (0.8 s), come up
// holding it at the waist; held with { hold: true } it stays in that pose (holding). Put down is the same motion
// backwards (the 2D rig plays it in reverse). It used to be a deep squat: the thighs turned to the horizontal and
// the body folded over them, more than cut-out clothes can do (shorts opened at the hip, a skirt or apron stood out
// like a board, a jacket's tails split). In a bow the legs stay nearly straight and only the waist bends.
// The knees point straight ahead: turned out (as in the 3D crouch), the near knee came out behind a long narrow skirt.
// The head goes down with the body (she looks at what she picks up): held level, it turned so far against the body
// that long hair, which below the neck belongs to the body's picture, broke at the neck.
// pickSide, for the front and back views: a smaller bow (it points at the camera, so it only shortens the body) and
// the hand goes down beside the leg.
const pickPose = (front) => (t, a) => {
  const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }, dn = sm(t / 0.7) * (1 - sm((t - 0.95) / 0.75)), up = sm((t - 0.95) / 0.75);
  const g = sm((t - 0.65) / 0.2), floor = front ? [0.1, -0.1, 1.0] : [0.34, -0.98, 0.16], held = front ? [0.16, -0.36, 0.46] : [0.2, -0.4, 0.42];
  const rest = [0.1, -0.62, 0.2], h = [0, 1, 2].map((i) => rest[i] + (floor[i] - rest[i]) * dn + (held[i] - rest[i]) * up);
  // the elbow stays down at the side while she holds it (out and back it read as a wing); the other arm hangs
  // straight and relaxed (its hand at belly height had lifted the elbow forward, like a second wing)
  const el = [0.8 - 0.55 * up, -0.6 - 0.4 * up, -0.2 + 0.1 * up];
  return { [a.n]: { h, e: el, palm: front ? [-0.3, -1, 0] : [0.2, -1, 0.2], row: shapeRow('gripHandle', 0.8 * g), bend: 0, m: 0.3, free: dn > 0 ? 1 : 0, chin: 0 },   // free: the reach goes down past the knees
    py: 0.985 - (front ? 0.28 : 0.2) * dn, knees: 0, lean: (front ? 1.35 : 0.7) * dn, hp: (front ? 0.1 : 0.05) * dn + 0.05, psf: (front ? -0.3 : -0.12) * dn,
    [a.f]: { h: [0.1, -0.9, 0.06 + (front ? 0.3 : 0.1) * dn], e: [0.3, -1, -0.1], palm: [-0.4, 0, 1], row: shapeRow('relaxed'), bend: 0, m: 0, free: 0, chin: 0 } };
};
ACTIONS.pickUp = Object.assign(pickPose(true), { dur: 1.8, tin: 0.15, tout: 0.4, key: 'act' });
ACTIONS.pickSide = Object.assign(pickPose(false), { dur: 1.8, tin: 0.15, tout: 0.4, key: 'act' });
// waveFront: the same for the front and back views. The 3D wave holds the hand a third of an arm in front of the
// shoulder, which faces the camera here; a flat cut-out cannot foreshorten the forearm, so the hand smears. Here the
// hand stays in the picture plane (out to the side and up).
ACTIONS.waveFront = Object.assign((t, a) => {
  const s = Math.sin(t * 9.5);
  return { [a.n]: { h: [0.66 + 0.16 * s, 0.6 - 0.04 * Math.abs(s), 0.04], e: [1, -0.55, -0.1], palm: [0, 0, 1], row: shapeRow('wave'), bend: 0, m: 0, free: 0, chin: 0 }, hr: 0.06 };
}, { dur: 2.6, tin: 0.22, tout: 0.25, key: 'act' });

export const CAST = [
  { id: 'C01', name: 'Liv', url: '../../../grammatik/liv/liv.vrm' },
  { id: 'C02', name: 'Village boy', url: '../models/cast/c02.vrm' },
  { id: 'C03', name: 'Blonde girl', url: '../models/cast/c03.vrm' },
  { id: 'C04', name: 'Ginger boy', url: '../models/cast/c04.vrm', satchel: true },
  { id: 'A01', name: 'Grandfather', url: '../models/cast/a01.vrm' },
  { id: 'A02', name: 'Craftsman', url: '../models/cast/a02.vrm' },
  { id: 'A03', name: 'Young woman', url: '../models/cast/a03.vrm' },
  { id: 'A04', name: 'Housekeeper', url: '../models/cast/a04.vrm' },
  { id: 'A05', name: 'Scholar', url: '../models/cast/a05.vrm' },
  { id: 'A06', name: 'Lady', url: '../models/cast/a06.vrm' },
];

const qs = new URLSearchParams(location.search);
const want = qs.get('ids') ? qs.get('ids').split(',') : CAST.map((c) => c.id);
const canvas = document.getElementById('c');
const R = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(Math.min(2, devicePixelRatio)); R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(0xf3e9d8);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(24, 1, 0.05, 200);
const ctl = new OrbitControls(cam, canvas);
scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb9a98a, 1.85));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(1.5, 3, 2.5); scene.add(sun);
const ground = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshBasicMaterial({ color: 0xece0cb })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
function resize() { R.setPixelRatio(Math.min(2, devicePixelRatio)); R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
let exporting = false;        // a window resize while layers are being saved would change their size
addEventListener('resize', () => { if (!exporting) resize(); }); resize();

const actors = {}; const status = document.getElementById('status');
// side by side with room for a waving arm: each takes its shoulder half-width plus most of an arm's reach
const reach = (a) => a.rig.M.shW + 0.75 * a.rig.M.arm;
function lineX(list) {
  const xs = []; let x = 0;
  list.forEach((id, i) => { if (i) x += reach(actors[list[i - 1]]) + reach(actors[id]) + 0.06; xs.push(x); });
  return xs.map((v) => v - x / 2);
}
function place(list, z = 0) {
  const xs = lineX(list);
  list.forEach((id, i) => { const a = actors[id]; a.reset({ x: xs[i], z, yaw: 0 }); if (CAST.find((c) => c.id === id).satchel) a.attachSatchel(true); });
}
window.__place = place;
async function load() {
  for (const c of CAST.filter((c) => want.includes(c.id))) {
    status.textContent = 'loading ' + c.name + '…';
    if (c.id === 'C01' && qs.get('liv')) c.url = qs.get('liv');
    const url = qs.get('raw') && c.id !== 'C01' ? c.url.replace(/\.vrm$/, '-vroid.vrm').replace(/c0[24]-vroid/, 'boy-vroid') : c.url;
    try { const a = await LivActor.load(url + (qs.get('v') ? '?v=' + qs.get('v') : ''), { scale: c.scale || 1 }); actors[c.id] = a; scene.add(a.root); }
    catch (e) { console.warn(c.id, e.message); }
  }
  const ids = Object.keys(actors); place(ids); still(); step(1 / 60, 30);
  const xs = lineX(ids), w = xs.length ? xs[xs.length - 1] - xs[0] + 1 : 1; ctl.target.set(0, 0.85, 0); cam.position.set(0, 1.25, Math.max(5, w * 1.9)); ctl.update();
  status.textContent = ids.map((id) => id + ' ' + CAST.find((c) => c.id === id).name).join(' · '); buildUI(); window.__ready = true;
}
function still() { for (const a of Object.values(actors)) if (a.face) a.face.blinkAt = 1e9; }
function step(dt, n) { for (let i = 0; i < n; i++) for (const a of Object.values(actors)) a.update(dt); }
let live = true, last = performance.now();
function loop(t) { const dt = Math.min(0.05, (t - last) / 1000); last = t; if (live && window.__ready) step(dt, 1); R.render(scene, cam); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

function buildUI() {
  const ui = document.getElementById('ui'); if (qs.get('ui') === '0') { ui.style.display = 'none'; return; }
  const btn = (label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; ui.appendChild(b); };
  btn('Line up', () => { place(Object.keys(actors)); });
  btn('Walk', () => Object.values(actors).forEach((a) => a.walk(0)));
  btn('Run', () => Object.values(actors).forEach((a) => a.run(0)));
  btn('Stop', () => Object.values(actors).forEach((a) => a.stop()));
  btn('Turn round', () => Object.values(actors).forEach((a) => { a.stop(); a.turnTo(a.yaw + Math.PI); }));
  for (const n of ['wave', 'cheer', 'bow', 'thumbsUp', 'think', 'jump', 'clap', 'point'].filter((n) => ACTION_NAMES.includes(n))) btn(n, () => Object.values(actors).forEach((a, i) => a.after(i * 0.12, () => a.play(n))));
  for (const n of ['smile', 'laugh', 'surprised', 'sad', 'think', 'wink']) btn('face: ' + n, () => Object.values(actors).forEach((a) => a.setExpression(n)));
}

// ---------------------------------------------------------------- contact sheets
const W = 1600;
function board(h) { const c = document.createElement('canvas'); c.width = W; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#f3e9d8'; g.fillRect(0, 0, W, h); return [c, g]; }
function fit(w, h) { R.setPixelRatio(1); R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
function only(id) { for (const [k, a] of Object.entries(actors)) a.root.visible = !id || k === id; }
const VIEWS = { front: 0, tq: 0.75, side: Math.PI / 2, back: Math.PI, tqb: 2.4 };
function topOf(a) { const b = new THREE.Box3().setFromObject(a.vrm.scene); return b.max.y; }
function bodyCam(a, view, back = 1) {
  const p = a.position, h = topOf(a) + 0.04, mid = new THREE.Vector3(p.x, h * 0.5, p.z), yaw = a.yaw + VIEWS[view];
  const d = (h * 0.5 / Math.tan(cam.fov * Math.PI / 360)) * 1.1 * back * Math.max(1, 0.6 / cam.aspect);
  cam.position.set(mid.x + Math.sin(yaw) * d, mid.y + 0.08 * d, mid.z + Math.cos(yaw) * d); cam.lookAt(mid);
}
function headCam(a, dist, yawOff) {
  const hp = new THREE.Vector3(); a.vrm.humanoid.getNormalizedBoneNode('head').getWorldPosition(hp); hp.y += 0.06 * a.rig.M.headY / 1.2;
  const yaw = a.yaw + yawOff; cam.position.set(hp.x + Math.sin(yaw) * dist, hp.y + 0.02, hp.z + Math.cos(yaw) * dist); cam.lookAt(hp);
}
function label(g, s, x, y) { g.fillStyle = '#4c4038'; g.font = '24px system-ui'; g.fillText(s, x + 10, y + 28); }
async function save(c, name) {
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  try { await fetch('/save?name=' + encodeURIComponent(name + '.png'), { method: 'POST', body: blob }); } catch (e) { return 'not saved: ' + e.message; }
  return name + '.png';
}
function solo(id) { only(id); const a = actors[id]; a.reset({ x: 0, z: 0, yaw: 0 }); if (CAST.find((c) => c.id === id).satchel) a.attachSatchel(true); still(); return a; }

window.__views = async (name, ids = Object.keys(actors), views = ['front', 'side', 'back'], rowH = 560) => {
  const [c, g] = board(rowH * ids.length), cw = W / views.length; fit(cw, rowH);
  for (const [r, id] of ids.entries()) {
    const a = solo(id); for (let i = 0; i < 40; i++) a.update(1 / 60);
    views.forEach((v, k) => { bodyCam(a, v); R.render(scene, cam); g.drawImage(R.domElement, k * cw, r * rowH, cw, rowH); });
    label(g, id + ' ' + CAST.find((x) => x.id === id).name, 0, r * rowH);
  }
  only(null); resize(); return save(c, name);
};
window.__faces = async (name, id, exprs = ['happy', 'smile', 'laugh', 'surprised', 'sad', 'think', 'wink', 'effort'], cols = 4, dist = 0.9, yawOff = 0.25) => {
  const rows = Math.ceil(exprs.length / cols), ch = 400, [c, g] = board(ch * rows), cw = W / cols; fit(cw, ch); const a = actors[id];
  exprs.forEach((e, k) => {
    solo(id); for (let i = 0; i < 20; i++) a.update(1 / 60); a.setExpression(e); for (let i = 0; i < 45; i++) a.update(1 / 60);
    headCam(a, dist * a.rig.M.headY / 1.2, yawOff); R.render(scene, cam); g.drawImage(R.domElement, (k % cols) * cw, Math.floor(k / cols) * ch, cw, ch); label(g, e, (k % cols) * cw, Math.floor(k / cols) * ch);
  });
  only(null); resize(); return save(c, name);
};
window.__acts = async (name, id, acts = ACTION_NAMES, cols = 7, view = 'tq') => {
  const rows = Math.ceil(acts.length / cols), ch = 330, [c, g] = board(ch * rows), cw = W / cols; fit(cw, ch); const a = actors[id];
  acts.forEach((n, k) => {
    solo(id); for (let i = 0; i < 30; i++) a.update(1 / 60); a.play(n); for (let i = 0; i < 50; i++) a.update(1 / 60);
    bodyCam(a, view, 1.05); R.render(scene, cam); g.drawImage(R.domElement, (k % cols) * cw, Math.floor(k / cols) * ch, cw, ch); label(g, n, (k % cols) * cw, Math.floor(k / cols) * ch);
  });
  only(null); resize(); return save(c, name);
};
window.__seq = async (name, id, setup, view = 'side', cols = 8, rows = 2, per = 4, warm = 150) => {
  const ch = 420, [c, g] = board(ch * rows), cw = W / cols; fit(cw, ch); const a = solo(id); setup(a);
  for (let i = 0; i < warm; i++) a.update(1 / 60);
  for (let k = 0; k < cols * rows; k++) { for (let i = 0; i < per; i++) a.update(1 / 60); bodyCam(a, view); R.render(scene, cam); g.drawImage(R.domElement, (k % cols) * cw, Math.floor(k / cols) * ch, cw, ch); }
  only(null); resize(); return save(c, name);
};
window.__lineup = async (name, fn = () => {}, n = 60, h = 700) => {
  const ids = Object.keys(actors), [c, g] = board(h); fit(W, h); only(null); place(ids); still(); ids.forEach((id, i) => fn(actors[id], i)); step(1 / 60, n);
  const xs = lineX(ids), w = xs[xs.length - 1] - xs[0] + 1; cam.position.set(0, 1.05, w * 1.6 + 1.5); cam.lookAt(0, 0.82, 0); R.render(scene, cam); g.drawImage(R.domElement, 0, 0, W, h);
  resize(); return save(c, name);
};
// rows = characters, columns = expressions / actions / frames of a gait
window.__facegrid = async (name, ids, exprs, ch = 300) => {
  const cw = W / exprs.length, [c, g] = board(ch * ids.length); fit(cw, ch);
  ids.forEach((id, r) => exprs.forEach((e, k) => {
    const a = solo(id); for (let i = 0; i < 20; i++) a.update(1 / 60); a.setExpression(e); for (let i = 0; i < 45; i++) a.update(1 / 60);
    headCam(a, 0.85 * a.rig.M.headY / 1.2 * (a.rig.M.headY > 1.2 ? 0.85 : 1), 0.25); R.render(scene, cam); g.drawImage(R.domElement, k * cw, r * ch, cw, ch);
    label(g, k ? e : id + ' ' + e, k * cw, r * ch);
  }));
  only(null); resize(); return save(c, name);
};
window.__actgrid = async (name, ids, acts, ch = 330, view = 'tq') => {
  const cw = W / acts.length, [c, g] = board(ch * ids.length); fit(cw, ch); const errs = [];
  ids.forEach((id, r) => acts.forEach((n, k) => { try {
    const a = solo(id); for (let i = 0; i < 30; i++) a.update(1 / 60);
    if (typeof n === 'function') n(a); else if (n && n.fn) n.fn(a); else a.play(n);
    for (let i = 0; i < 50; i++) a.update(1 / 60); bodyCam(a, view, 1.08); R.render(scene, cam); g.drawImage(R.domElement, k * cw, r * ch, cw, ch);
    label(g, typeof n === 'string' ? (k ? n : id + ' ' + n) : (n.label || ''), k * cw, r * ch);
  } catch (e) { errs.push(id + ' ' + n + ': ' + e.message); } }));
  only(null); resize(); return [await save(c, name), errs];
};
window.__gaitgrid = async (name, ids, mode = 'walk', cols = 8, per = 3, ch = 300, view = 'side') => {
  const cw = W / cols, [c, g] = board(ch * ids.length); fit(cw, ch);
  ids.forEach((id, r) => {
    const a = solo(id); a[mode](0); for (let i = 0; i < 150; i++) a.update(1 / 60);
    for (let k = 0; k < cols; k++) { for (let i = 0; i < per; i++) a.update(1 / 60); bodyCam(a, view); R.render(scene, cam); g.drawImage(R.domElement, k * cw, r * ch, cw, ch); }
    label(g, id + ' ' + mode, 0, r * ch);
  });
  only(null); resize(); return save(c, name);
};
// one character at several distances, happy face (to judge what reads at scene distance: nose, mouth, eyes)
window.__mid = async (name, id, dists = [1.2, 2.5, 4.5], H = 600) => {
  const a = solo(id), cw = W / dists.length, [c, g] = board(H); fit(cw, H);
  for (let i = 0; i < 40; i++) a.update(1 / 60); a.setExpression('happy'); for (let i = 0; i < 40; i++) a.update(1 / 60);
  const hp = new THREE.Vector3(); a.vrm.humanoid.getNormalizedBoneNode('head').getWorldPosition(hp);
  dists.forEach((d, k) => { cam.position.set(0, hp.y + 0.02, d); cam.lookAt(0, hp.y - 0.02 - 0.08 * d, 0); R.render(scene, cam); g.drawImage(R.domElement, k * cw, 0, cw, H); });
  only(null); resize(); return save(c, name);
};
// ---------------------------------------------------------------- 2D cut-out export (for Rive)
// One fixed view through an orthographic camera. Each body part is rendered alone on a transparent canvas of the same
// size, so all layers line up; joints are projected to the same pixels. Parts come from the skin weights: every vertex
// belongs to the main humanoid bone above its strongest bone; a triangle goes to every part one of its corners belongs
// to (so neighbouring layers overlap at the joints). Rigid meshes on the head (hat, beard) go with the head.
const PARTS = { Hips: 'pelvis', Spine: 'torso', Chest: 'torso', UpperChest: 'torso', L_Shoulder: 'torso', R_Shoulder: 'torso', Neck: 'head', Head: 'head',
  L_UpperArm: 'uarmL', L_LowerArm: 'larmL', L_Hand: 'handL', R_UpperArm: 'uarmR', R_LowerArm: 'larmR', R_Hand: 'handR',
  L_UpperLeg: 'ulegL', L_LowerLeg: 'llegL', L_Foot: 'footL', L_ToeBase: 'footL', R_UpperLeg: 'ulegR', R_LowerLeg: 'llegR', R_Foot: 'footR', R_ToeBase: 'footR' };
function partOf(obj) {
  for (let o = obj; o; o = o.parent) { const m = /^J_Bip_([CLR]_[A-Za-z]+?)(\d*)$/.exec(o.name || ''); if (m) { const k = m[1].replace(/^C_/, ''); if (PARTS[k]) return PARTS[k]; if (/^(L|R)_(Thumb|Index|Middle|Ring|Little)/.test(m[1])) return 'hand' + m[1][0]; } }
  return null;
}
const JOINTS2D = { hips: 'J_Bip_C_Hips', chest: 'J_Bip_C_UpperChest', neck: 'J_Bip_C_Neck', head: 'J_Bip_C_Head',
  shL: 'J_Bip_L_UpperArm', elL: 'J_Bip_L_LowerArm', wrL: 'J_Bip_L_Hand', fiL: 'J_Bip_L_Middle3', shR: 'J_Bip_R_UpperArm', elR: 'J_Bip_R_LowerArm', wrR: 'J_Bip_R_Hand', fiR: 'J_Bip_R_Middle3',
  hipL: 'J_Bip_L_UpperLeg', knL: 'J_Bip_L_LowerLeg', anL: 'J_Bip_L_Foot', toL: 'J_Bip_L_ToeBase', hipR: 'J_Bip_R_UpperLeg', knR: 'J_Bip_R_LowerLeg', anR: 'J_Bip_R_Foot', toR: 'J_Bip_R_ToeBase' };
let ortho = null;
// expressions need a few updates to blend in; the body must not move meanwhile (breathing): keep every bone as it was
function snapPose(a) { const m = new Map(); a.vrm.scene.traverse((o) => { if (o.isBone) m.set(o, [o.position.clone(), o.quaternion.clone(), o.scale.clone()]); }); return m; }
function restorePose(a, m) { for (const [o, [p, q, s]] of m) { o.position.copy(p); o.quaternion.copy(q); o.scale.copy(s); } a.vrm.scene.updateMatrixWorld(true); }
function orthoCam(a, view, W2, H2, pad = 1.18) {
  const h = topOf(a) * pad, w = h * W2 / H2, c = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 50);
  c.position.set(Math.sin(view) * 10, h / 2 - 0.02, Math.cos(view) * 10); c.lookAt(0, h / 2 - 0.02, 0); c.updateMatrixWorld(); c.updateProjectionMatrix(); return c;
}
function project(c, v, W2, H2) { const p = v.clone().project(c); return [+((p.x + 1) / 2 * W2).toFixed(2), +((1 - p.y) / 2 * H2).toFixed(2)]; }
function joints2d(a, c, W2, H2) {
  const out = {}, p = new THREE.Vector3(); a.vrm.scene.updateMatrixWorld(true);
  for (const [k, n] of Object.entries(JOINTS2D)) { const b = a.vrm.scene.getObjectByName(n); if (b) { b.getWorldPosition(p); out[k] = project(c, p, W2, H2); } }
  // the top of the head: the highest point of the figure above the head joint (hair, hat); measured on the whole
  // figure, since a head without a hat or bun has no rigid mesh of its own to measure
  const bb = new THREE.Box3().setFromObject(a.vrm.scene), hp = new THREE.Vector3(); a.vrm.scene.getObjectByName(JOINTS2D.head).getWorldPosition(hp);
  out.top = project(c, new THREE.Vector3(hp.x, bb.max.y, hp.z), W2, H2);
  // which way the head itself points (a point above the head joint, turning with the head): the 2D head follows
  // this, not the line from the neck to the head, which a bow tips over further than the head is tipped
  const hb = a.vrm.scene.getObjectByName(JOINTS2D.head), hq = new THREE.Quaternion(); hb.getWorldQuaternion(hq);
  out.hup = project(c, hp.clone().add(new THREE.Vector3(0, 0.15, 0).applyQuaternion(hq)), W2, H2);
  return out;
}
// order: the 2D stacking, back to front. Where a layer is stacked in front of another one but was behind it in 3D (the
// pelvis over the near thigh's top, the head over the collar), those pixels are removed from the front layer, so the
// layer behind shows through there exactly as in 3D, instead of the inside of a sleeve or trouser leg.
// The garment rules for every character (remap 'auto'): tops, dresses and aprons keep their tails or skirts with the
// pelvis and their cuffs with the forearm (a skirt split between the thighs tears when the legs move; a cuff on the
// hand piece shows as a band at the wrist); shorts and breeches (few vertices below the knee) keep the whole leg on
// the thigh, so the hem does not split when the knee bends; long trousers stay split at the knee, under the thigh.
function autoRemap(mat, part) {
  const n = (p) => part.filter((x) => x === p).length, legs = { ulegL: 'pelvis', ulegR: 'pelvis', llegL: 'pelvis', llegR: 'pelvis', footL: 'pelvis', footR: 'pelvis' };
  if (/Tops|Onepiece|Apron/.test(mat)) return { [mat]: { handL: 'larmL', handR: 'larmR', ...legs } };
  if (/Bottoms/.test(mat) && n('ulegL') > 0 && n('llegL') < 0.5 * n('ulegL')) return { [mat]: { llegL: 'ulegL', llegR: 'ulegR', footL: 'ulegL', footR: 'ulegR' } };
  return {};
}
// remap: per garment (a substring of its material name), parts moved to another layer, so a garment is not split
// across a joint it cannot bend at (shorts: the hem on the thigh, not half on the shin; shirt: tails with the pelvis,
// the cuff with the forearm, not the hand). poses: extra drawings of some parts in an action's pose (the open hand of
// a wave), with the joints of that pose, so the 2D rig can swap them in.
window.__parts = async (id, { view = -0.87, W2 = 768, H2 = 1024, faces = ['happy', 'laugh'], prefix, remap = {}, poses = [], facesOnly = false,
  order = ['handL', 'larmL', 'uarmL', 'llegL', 'footL', 'ulegL', 'llegR', 'footR', 'ulegR', 'pelvis', 'torso', 'head', 'handR', 'larmR', 'uarmR'] } = {}) => {
  const wasLive = live; live = false; exporting = true;      // the page's own loop must not move the figure while the layers are saved
  const a = solo(id); for (let i = 0; i < 90; i++) a.update(1 / 60);                 // the idle stance is the rest pose
  const c = orthoCam(a, view, W2, H2); ortho = { c, W2, H2, view };
  R.setPixelRatio(1); R.setSize(W2, H2, false); R.setClearColor(0x000000, 0);
  const meshes = []; a.vrm.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const waistY = (() => { const b = a.vrm.scene.getObjectByName('J_Bip_C_Spine'), q = new THREE.Vector3(); if (!b) return -1; b.getWorldPosition(q); return q.y; })();
  const save1 = async (name) => { const b = await new Promise((r) => R.domElement.toBlob(r, 'image/png')); await fetch('/save?name=' + encodeURIComponent(name) + '.png', { method: 'POST', body: b }); };
  // part of every vertex
  const info = meshes.map((m) => {
    const g = m.geometry, idx = g.index ? g.index.array : null, n = g.attributes.position.count, part = new Array(n).fill(partOf(m));
    if (m.isSkinnedMesh && g.attributes.skinIndex) { const si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      for (let v = 0; v < n; v++) { let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(v, k); if (w > bw) { bw = w; best = si.getComponent(v, k); } } part[v] = partOf(m.skeleton.bones[best]) || part[v]; } }
    const mat = ([].concat(m.material)[0] || {}).name || '';
    for (const [key, mp] of Object.entries(remap === 'auto' ? autoRemap(mat, part) : remap)) if (mat.includes(key)) for (let v = 0; v < n; v++) part[v] = mp[part[v]] || part[v];
    // From behind, a front apron (A02's sheet) is behind the legs. As part of the pelvis, which is stacked over the
    // legs, it covered them and the trousers' seat ended on it in a ragged edge: there it is a layer of its own, at
    // the very back.
    if (remap === 'auto' && /Apron/.test(mat) && Math.cos(view) < -0.9) part.fill('apron');
    // a dress's skirt hangs partly from the spine: below the waist every vertex of a top goes with the pelvis, so a
    // skirt or apron is one piece (split, the torso's half was drawn over the pelvis's half with a jagged edge)
    if (remap === 'auto' && /Tops|Onepiece|Apron/.test(mat)) {
      const p = g.attributes.position, wv = new THREE.Vector3(); m.updateMatrixWorld(true);
      for (let v = 0; v < n; v++) if (part[v] === 'torso') { wv.fromBufferAttribute(p, v).applyMatrix4(m.matrixWorld); if (wv.y < waistY) part[v] = 'pelvis'; }
    }
    // the body's skin under the clothes is painted with underwear (black on the male base): never seen in 3D, but a
    // trouser leg or a waist drawn alone is open at the top and showed it as a black patch. Those triangles are left out.
    let hid = null; const m0 = [].concat(m.material)[0];
    if (/Body_00_SKIN/.test(mat) && idx && m0 && m0.map && m0.map.image && g.attributes.uv) {
      const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(m0.map.image, 0, 0, S, S);
      const px = cx.getImageData(0, 0, S, S).data, uv = g.attributes.uv, dark = (u, v) => { const i = 4 * (Math.min(S - 1, Math.max(0, Math.floor(v * S))) * S + Math.min(S - 1, Math.max(0, Math.floor(u * S)))); return px[i + 3] > 128 && px[i] + px[i + 1] + px[i + 2] < 12; };
      hid = new Uint8Array(idx.length / 3);
      for (let t = 0; t < idx.length; t += 3) { const u = (uv.getX(idx[t]) + uv.getX(idx[t + 1]) + uv.getX(idx[t + 2])) / 3, v = (uv.getY(idx[t]) + uv.getY(idx[t + 1]) + uv.getY(idx[t + 2])) / 3;
        if (dark(u, v) || [0, 1, 2].filter((q) => dark(uv.getX(idx[t + q]), uv.getY(idx[t + q]))).length >= 2) hid[t / 3] = 1; }
    }
    return { m, idx: idx && idx.slice(), groups: g.groups.map((x) => ({ ...x })), part, vis: m.visible, hid };
  });
  const parts = [...new Set(info.flatMap((x) => x.part))].filter(Boolean);
  // clothes are two-sided: rendered alone, a part shows the inside of its sleeve, collar or trouser leg where the
  // neighbouring part used to cover it. Layers only need the outside (hair stays two-sided: its locks are sheets).
  const sides = [];
  for (const x of info) for (const mt of [].concat(x.m.material)) if (mt && !mt.isOutline && /CLOTH|SKIN/.test(mt.name || '')) { sides.push([mt, mt.side]); mt.side = THREE.FrontSide; mt.needsUpdate = true; }
  const allMats = [...new Set(info.flatMap((x) => [].concat(x.m.material)))];
  // pick(material, the three corners' parts, mesh, the three corners): which triangles are drawn
  const sel = (pick) => {
    for (const x of info) {
      const g = x.m.geometry, mats = [].concat(x.m.material); if (!x.idx) { x.m.visible = pick(mats[0] || {}, x.part[0], x.part[0], x.part[0]) && x.vis; continue; }
      const keep = [], groups = [], src = x.groups.length ? x.groups : [{ start: 0, count: x.idx.length, materialIndex: 0 }];
      for (const gr of src) { const s = keep.length, mt = mats[gr.materialIndex || 0] || {};
        for (let t = gr.start; t < gr.start + gr.count; t += 3) { if (x.hid && x.hid[t / 3]) continue; const i0 = x.idx[t], i1 = x.idx[t + 1], i2 = x.idx[t + 2]; if (pick(mt, x.part[i0], x.part[i1], x.part[i2], x, i0, i1, i2)) keep.push(i0, i1, i2); }
        groups.push({ start: s, count: keep.length - s, materialIndex: gr.materialIndex }); }
      g.setIndex(keep); g.clearGroups(); if (x.groups.length) for (const gr of groups) g.addGroup(gr.start, gr.count, gr.materialIndex); x.m.visible = x.vis && keep.length > 0;
    }
  };
  const select = (test, outlineTest) => sel((mt, ...r) => (mt.isOutline ? outlineTest : test)(...r));
  const isSkin = (mt) => /SKIN/.test(mt.name || ''), isCloth = (mt) => /CLOTH/.test(mt.name || '');
  // Every piece is drawn whole. Cutting a piece where another one hid it in the rest pose (a lock of hair in front
  // of a sleeve, the skirt over a hand, the pelvis over a thigh's top) made the rest pose match the 3D picture, but
  // the hole moved with the piece: a lifted arm had a bite out of its sleeve, a swinging thigh opened a gap at the
  // hip. Only two cuts are kept, where the stacking cannot say it: the collar in front of the neck (the head is
  // stacked over the body), and, seen from behind, a trouser hem in front of the calf (the calf is stacked over
  // the thigh there). A drawing in a pose may name its own (blockBy: a forearm that comes out from behind the chest).
  const BLOCK = { head: ['torso'], llegL: ['ulegL'], llegR: ['ulegR'] };
  // no ring between the body and the upper arms: the body's cloth on top of a sleeve turned with the arm (a patch of
  // vest on a raised shoulder); the shoulder is a ball joint made when the layers are prepared (rive_prep.py)
  const NORING = { uarmL: ['torso'], uarmR: ['torso'], torso: ['uarmL', 'uarmR'] };
  // a thigh does reach into the pelvis stacked in front of it: its picture then begins with the trousers' own cloth
  // at the hip, which is what its hip joint's ball is made of (rive_prep.py)
  const RINGFRONT = { ulegL: ['pelvis'], ulegR: ['pelvis'] };
  // The body under the clothes. A piece drawn alone is open where it was cut, and the body's skin inside it shows
  // (the waist inside a trouser top, a thigh inside a trouser leg), as does whatever its ring reaches under the next
  // piece's clothes (the waistband under a shirt's tail). So skin, and the ring, are only drawn where no garment of
  // the piece itself or of the pieces next to it covers them in 3D. A garment's own cloth is never cut by this.
  const NEXT = { pelvis: ['torso', 'ulegL', 'ulegR'], torso: ['pelvis', 'head', 'uarmL', 'uarmR'], head: ['torso'] };
  for (const s of 'LR') Object.assign(NEXT, { ['uarm' + s]: ['torso', 'larm' + s], ['larm' + s]: ['uarm' + s, 'hand' + s], ['hand' + s]: ['larm' + s],
    ['uleg' + s]: ['pelvis', 'lleg' + s], ['lleg' + s]: ['uleg' + s, 'foot' + s], ['foot' + s]: ['lleg' + s] });
  const render = async (P, name, free = false, blockBy = null, only = () => true) => {
    const behind = new Set(order.slice(0, Math.max(0, order.indexOf(P))));
    const block = new Set(free ? (blockBy || []) : (BLOCK[P] || []).filter((x) => behind.has(x)));
    if (block.size) {                                                                // depth of the layers that cut it
      const inB = (a, b, c) => block.has(a) && block.has(b) && block.has(c);
      // pushed back a little, so where a layer and the one behind share a surface (the overlap at a cut) the layer
      // wins; without it the two fight and the layer gets pinholes (skin specks on the seat)
      select(inB, () => false); allMats.forEach((m) => { m.colorWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = 2; m.polygonOffsetUnits = 8; });
      R.clear(); R.render(scene, c); allMats.forEach((m) => { m.colorWrite = true; m.polygonOffset = false; });
      R.autoClear = false; R.clearColor();
    }
    // the ring beyond the cut only reaches into layers stacked behind this one: there it covers the seam, and it moves
    // with this layer. A ring into a layer in front would be left behind when that layer moves (a sliver of shirt at
    // the shoulder when the arm is raised).
    // Two triangles deep, so the layers overlap instead of meeting edge to edge (a hairline gap after antialiasing).
    for (const x of info) { if (!x.idx) continue; x.near = new Uint8Array(x.part.length);
      for (let t = 0; t < x.idx.length; t += 3) { const v = [x.idx[t], x.idx[t + 1], x.idx[t + 2]]; if (v.some((i) => x.part[i] === P)) v.forEach((i) => { x.near[i] = 1; }); } }
    const ok = (x) => x === P || x == null || (behind.has(x) && !(NORING[P] || []).includes(x)) || (RINGFRONT[P] || []).includes(x);
    const any = (a, b, cc, x, i0, i1, i2) => (x && x.near ? x.near[i0] || x.near[i1] || x.near[i2] : a === P || b === P || cc === P) && ok(a) && ok(b) && ok(cc),
      core = (a, b, cc) => a === P && b === P && cc === P;
    // a drawing in a pose (a hand turned toward the camera) looks into its own cut: there the outline is seen from
    // inside, as a dark patch. Its outline keeps clear of the cut by one ring of triangles.
    const edge = new Map();
    if (free) for (const x of info) { if (!x.idx) continue; const e = new Uint8Array(x.part.length);
      for (let t = 0; t < x.idx.length; t += 3) { const v = [x.idx[t], x.idx[t + 1], x.idx[t + 2]]; if (v.some((i) => x.part[i] === P) && v.some((i) => x.part[i] !== P)) v.forEach((i) => { e[i] = 1; }); }
      edge.set(x, e); }
    const coreFree = (a, b, cc, x, i0, i1, i2) => core(a, b, cc) && !(x && edge.has(x) && (edge.get(x)[i0] || edge.get(x)[i1] || edge.get(x)[i2]));
    // The piece's own depth first, both sides of its cloth: through an open end (the top of a trouser leg, an
    // armhole, a cuff) the camera saw the far wall of the toon outline, a dark patch inside the piece. The cloth's
    // inside is not drawn, but it now hides that wall, so an open end is simply open.
    select(any, () => false);
    const own = allMats.filter((m) => m && !m.isOutline), lines = allMats.filter((m) => m && m.isOutline);
    own.forEach((m) => { m.colorWrite = false; m.userData.side2d = m.side; m.side = THREE.DoubleSide; m.needsUpdate = true; }); lines.forEach((m) => { m.userData.vis2d = m.visible; m.visible = false; });
    if (!block.size) R.clear(); R.autoClear = false; R.render(scene, c);
    own.forEach((m) => { m.colorWrite = true; m.side = m.userData.side2d; m.needsUpdate = true; }); lines.forEach((m) => { m.visible = m.userData.vis2d; });
    // 1. the piece's own cloth, hair and so on (whole), with its outline
    const line = free ? coreFree : core;
    sel((mt, ...r) => only(mt) && !isSkin(mt) && !mt.transparent && (mt.isOutline ? line(...r) : core(...r))); R.render(scene, c);
    // 2. depth of the garments of this piece and the pieces next to it (pushed back a little, so the ring, which is
    // those very triangles, is not cut by itself)
    const near = new Set([P, ...(NEXT[P] || [])]);
    sel((mt, a, b, cc) => isCloth(mt) && !mt.isOutline && (near.has(a) || near.has(b) || near.has(cc)));   // any corner: the crotch spans both legs
    allMats.forEach((m) => { m.colorWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = 2; m.polygonOffsetUnits = 8; });
    R.render(scene, c); allMats.forEach((m) => { m.colorWrite = true; m.polygonOffset = false; });
    // 3. the skin and the ring, where no such garment covers them
    sel((mt, ...r) => only(mt) && (mt.isOutline ? isSkin(mt) && line(...r) : !mt.transparent && any(...r) && (isSkin(mt) || !core(...r)))); R.render(scene, c);
    // 4. what is drawn over the skin without depth (brows, lashes, the eyes' light)
    sel((mt, ...r) => only(mt) && !!mt.transparent && !mt.isOutline && core(...r)); R.render(scene, c);
    R.autoClear = true; await save1(name);
  };
  const ground = scene.children.filter((o) => o.isMesh && o.geometry && o.geometry.type === 'CircleGeometry'); ground.forEach((o) => { o.visible = false; });
  const shadows = []; a.root.traverse((o) => { if (o.isMesh && !a.vrm.scene.getObjectById(o.id)) { shadows.push([o, o.visible]); o.visible = false; } });
  const pf = prefix || id.toLowerCase();
  if (!facesOnly) for (const P of parts) await render(P, `${pf}_${P}`);
  // the head's hair alone: where the head's picture is hair (rive_prep.py keeps the body's copy of long hair joined to it)
  if (!facesOnly && parts.includes('head')) await render('head', `${pf}_head_hair`, false, null, (mt) => /HAIR/.test(mt.name || ''));
  const pose = snapPose(a);
  for (const f of faces) { a.setExpression(f === 'sad' && MALE.has(id) ? 'sadMale' : f); for (let i = 0; i < 40; i++) a.update(1 / 60); restorePose(a, pose); await render('head', `${pf}_head_${f}`); }
  if (facesOnly) { sides.forEach(([mt, s]) => { mt.side = s; mt.needsUpdate = true; }); for (const x of info) { const g = x.m.geometry; if (x.idx) { g.setIndex(Array.from(x.idx)); g.clearGroups(); for (const gr of x.groups) g.addGroup(gr.start, gr.count, gr.materialIndex); } x.m.visible = x.vis; }
    ground.forEach((o) => { o.visible = true; }); shadows.forEach(([o, v]) => { o.visible = v; }); R.setClearColor(0xf3e9d8, 1); only(null); exporting = false; resize(); live = wasLive; return 'faces'; }
  const posed = {};
  for (const ps of poses) {                                    // e.g. { name: 'wave', mode: 'wave2d', t: 1.0, parts: ['handR'] }
    a.play(ps.mode, ps.hold ? { hold: true } : {}); for (let i = 0; i < Math.round(ps.t * 60); i++) a.update(1 / 60);
    posed[ps.name] = joints2d(a, c, W2, H2);
    for (const P of ps.parts) await render(P, `${pf}_${P}_${ps.name}`, true, (ps.blockBy || {})[P]);
    a.stopAction(); for (let i = 0; i < 30; i++) a.update(1 / 60); restorePose(a, pose);
  }
  // the whole figure, for comparison
  for (const x of info) { const g = x.m.geometry; if (x.idx) { g.setIndex(Array.from(x.idx)); g.clearGroups(); for (const gr of x.groups) g.addGroup(gr.start, gr.count, gr.materialIndex); } x.m.visible = x.vis; }
  a.setExpression('happy'); for (let i = 0; i < 40; i++) a.update(1 / 60); restorePose(a, pose); R.render(scene, c); await save1(`${pf}_whole`);
  const rig = { id, view, W: W2, H: H2, metres: topOf(a) * 1.18, parts, joints: joints2d(a, c, W2, H2), poses: posed };
  await fetch('/save?name=' + pf + '_rig.json', { method: 'POST', body: JSON.stringify(rig) });
  sides.forEach(([mt, s]) => { mt.side = s; mt.needsUpdate = true; });
  ground.forEach((o) => { o.visible = true; }); shadows.forEach(([o, v]) => { o.visible = v; }); R.setClearColor(0xf3e9d8, 1); only(null); exporting = false; resize();
  live = wasLive; return rig;
};
// Everything the 2D rig of one character needs, for each view: layers (with the posed hands), and the motions.
// Saved as <id>_<view>_* (view q = three-quarter facing right, f = front, b = back) plus <id>_<view>_manifest.json.
const V2D = { q: { view: -0.87, wave: 'wave2d', point: 'point2d', pull: 'pullDown', clap: 'clap2d', pick: 'pickUp' },
  f: { view: 0, wave: 'waveFront', point: 'pointSide', pull: 'pullSide', clap: 'clapFront', pick: 'pickSide' },
  b: { view: Math.PI, wave: 'waveFront', point: 'pointSide', pull: 'pullSide', clap: 'clapFront', pick: 'pickSide' } };
const FB_ORDER = ['footL', 'llegL', 'ulegL', 'footR', 'llegR', 'ulegR', 'pelvis', 'torso', 'head', 'handL', 'larmL', 'uarmL', 'handR', 'larmR', 'uarmR'];
// from behind the arms are stacked behind the body and the legs: whatever the hands do in front of it (clapping,
// thinking, hands on the lap, an arm swinging forward) is hidden by the back, as it is in 3D (stacked in front, the
// forearms lay across the back and the hands on the seat); and a calf is stacked over its thigh, so a foot kicked up
// behind shows
const B_ORDER = ['apron', 'handL', 'larmL', 'uarmL', 'handR', 'larmR', 'uarmR', 'ulegL', 'llegL', 'footL', 'ulegR', 'llegR', 'footR', 'pelvis', 'torso', 'head'];
window.__export2d = async (id, { views = ['q', 'f', 'b'], W2 = 1536, H2 = 2048 } = {}) => {
  const done = [];
  for (const v of views) {
    const V = V2D[v], pf = `${id.toLowerCase()}_${v}`;
    const acts = [{ name: 'wave', mode: V.wave, hands: ['handR'], t: 1.0 }, { name: 'point', mode: V.point, hands: [v === 'q' ? 'handR' : 'handL'], t: 1.0 },
      { name: 'cheer', mode: 'cheer', hands: ['handL', 'handR'], t: 1.65 }, { name: 'think', mode: 'think', hands: ['handR'], t: 1.5 },
      { name: 'pull', mode: V.pull, hands: ['handR'], t: 2.2 },
      // the clap's forearms point at the camera: they are drawn in the pose too. Three-quarter: the far forearm and hand
      // come out from behind the chest, so their drawings are cut by the body as it stands and stacked in front of it
      v === 'q' ? { name: 'clap', mode: V.clap, hands: ['handL', 'handR', 'larmL'], t: 0.99, front: ['handL', 'larmL'], blockBy: { handL: ['torso', 'pelvis', 'head'], larmL: ['torso', 'pelvis', 'head'] } }
        : { name: 'clap', mode: V.clap, hands: v === 'f' ? ['handL', 'handR', 'larmL', 'larmR'] : ['handL', 'handR'], t: 0.99 }];   // from behind they are hidden
    // states that hold: sitting (sit down, sitting, stand up) and holding something (pick up, holding; put down is
    // pick up backwards). swap: the frames of the posed hand (the grip closes 0.8 s into the pick-up).
    const seqs = [{ name: 'sitdown', mode: 'sit', in: 0.9, out: 0.9, pre: 0, frames: 40 }, { name: 'sitting', mode: 'sit', in: 0.9, out: 0.9, pre: 120, frames: 60, loop: true },
      { name: 'standup', mode: 'sit', in: 0.9, out: 0.9, pre: 120, stop: true, frames: 40 },
      { name: 'pickup', mode: V.pick, in: 0.15, out: 0.4, pre: 0, frames: 62, swaps: [['handR', 25]].concat(v === 'f' ? [['larmR', 50]] : []) },
      { name: 'holding', mode: V.pick, in: 0.15, out: 0.4, pre: 150, frames: 60, loop: true, swaps: [['handR', 0]].concat(v === 'f' ? [['larmR', 0]] : []) }];
    const o = { view: V.view, W2, H2, prefix: pf, remap: 'auto', faces: v === 'b' ? ['happy'] : ['happy', 'blink', 'talk', 'smile', 'laugh', 'surprised', 'sad'],
      poses: acts.map((x) => ({ name: x.name, mode: x.mode, t: x.t, parts: x.hands, blockBy: x.blockBy }))
        .concat([{ name: 'pick', mode: V.pick, t: 2.0, hold: true, parts: v === 'f' ? ['handR', 'larmR'] : ['handR'] }]) };   // from the front it is held toward the camera: the forearm too
    if (v !== 'q') o.order = v === 'b' ? B_ORDER : FB_ORDER;
    await __parts(id, o);
    await __rec(id, 'idle', { prefix: pf }); await __rec(id, 'walk', { prefix: pf }); await __rec(id, 'run', { prefix: pf });
    for (const x of acts) await __rec(id, x.mode, { prefix: pf, frames: Math.round(ACTIONS[x.mode].dur * 30) + 3 });
    for (const x of seqs) await __rec(id, x.mode, { prefix: pf, name: x.name, frames: x.frames, hold: true, in: x.in, out: x.out, pre: x.pre, stop: x.stop });
    await fetch('/save?name=' + pf + '_manifest.json', { method: 'POST', body: JSON.stringify({ id, view: v, kind: v === 'q' ? 'q' : v, order: o.order || null, actions: acts, seqs }) });
    done.push(pf);
  }
  return done;
};
// joint positions over time in the same view (for 2D keyframes): mode = 'idle' | 'walk' | 'wave' | an action name
window.__rec = async (id, mode, { frames = 120, warm = 150, every = 2, prefix, name, hold, in: tin, out: tout, pre = 0, stop } = {}) => {
  const { c, W2, H2 } = ortho, a = solo(id); for (let i = 0; i < 90; i++) a.update(1 / 60);
  if (mode === 'walk' || mode === 'run') { a[mode](0); for (let i = 0; i < warm; i++) a.update(1 / 60); }
  else if (mode !== 'idle') { a.play(mode, hold ? { hold: true, in: tin, out: tout } : {}); for (let i = 0; i < pre; i++) a.update(1 / 60); if (stop) a.stopAction('act'); }
  const out = [];
  for (let f = 0; f < frames; f++) { for (let i = 0; i < every; i++) a.update(1 / 60); const j = joints2d(a, c, W2, H2), sh = project(c, new THREE.Vector3(a.x, 0, a.z), W2, H2), sh0 = project(c, new THREE.Vector3(0, 0, 0), W2, H2); for (const k in j) { j[k][0] -= sh[0] - sh0[0]; j[k][1] -= sh[1] - sh0[1]; } out.push(j); }
  const pf = prefix || id.toLowerCase();
  await fetch('/save?name=' + `${pf}_anim_${name || mode}.json`, { method: 'POST', body: JSON.stringify({ mode, dt: every / 60, T: a.T || null, frames: out }) });
  only(null); return { mode, frames: out.length, T: a.T };
};
// what the 2D layers will show: the whole figure through the orthographic camera of the last __parts call (or view),
// n frames of a motion, every `every` 1/60 s, in one strip
window.__oseq = async (name, id, mode, { view = -0.87, n = 8, every = 6, warm = 20, W2 = 384, H2 = 512 } = {}) => {
  const a = solo(id); for (let i = 0; i < 90; i++) a.update(1 / 60);
  const c = orthoCam(a, view, W2, H2);
  if (mode === 'walk') { a.walk(0); for (let i = 0; i < 150; i++) a.update(1 / 60); } else if (mode !== 'idle') { a.play(mode); for (let i = 0; i < warm; i++) a.update(1 / 60); }
  R.setPixelRatio(1); R.setSize(W2, H2, false);
  const out = document.createElement('canvas'); out.width = W2 * n; out.height = H2; const g = out.getContext('2d');
  for (let f = 0; f < n; f++) { for (let i = 0; i < every; i++) a.update(1 / 60); const p0 = c.position.clone(); c.position.x += a.x; c.position.z += a.z; c.updateMatrixWorld(); R.render(scene, c); c.position.copy(p0); g.drawImage(R.domElement, f * W2, 0); }
  const b = await new Promise((r) => out.toBlob(r, 'image/png')); await fetch('/save?name=' + name + '.png', { method: 'POST', body: b });
  only(null); resize(); return name;
};
// foot slide: horizontal travel of a planted ankle per frame (mm), walking and running
window.__slide = (id, mode = 'walk', frames = 240) => {
  const a = solo(id); a[mode](0); for (let i = 0; i < 120; i++) a.update(1 / 60);
  const foot = a.vrm.humanoid.getNormalizedBoneNode('leftFoot'), p = new THREE.Vector3(); let last = null, minY = 1e9, rec = [];
  for (let i = 0; i < frames; i++) { a.update(1 / 60); foot.getWorldPosition(p); rec.push(p.clone()); minY = Math.min(minY, p.y); }
  let sum = 0, n = 0;
  for (let i = 1; i < rec.length; i++) if (rec[i].y < minY + 0.0015 && rec[i - 1].y < minY + 0.0015) { sum += Math.hypot(rec[i].x - rec[i - 1].x, rec[i].z - rec[i - 1].z); n++; }
  only(null); return { id, mode, plantedFrames: n, mmPerFrame: n ? +(sum / n * 1000).toFixed(3) : null };
};
window.__ACTIONS = ACTIONS; window.__shapeRow = shapeRow; window.__actors = actors; window.__scene = scene; window.__live = (v) => { live = v; }; window.__THREE = THREE; window.__R = R; window.__cam = cam; window.__step = step;
load();
