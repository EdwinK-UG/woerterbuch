// Deutschklinik cast · every character on one stage, driven by the same LivActor player as Liv.
//   cast.html                       the line-up (Liv and the nine others); buttons make all of them walk, wave, emote
//   cast.html?ids=C03,C02           only those
// Hooks for contact sheets (posted to demo/shot_server.py, POST /save?name=x.png):
//   __views(name, ids, views)       one row per character: the given views, whole figure
//   __faces(name, id, exprs)        head close-ups, one per expression
//   __acts(name, id, actions)       one cell per action, at about the action's peak
//   __seq(name, id, setup, view, cols, rows, per, warm)   one motion over time
//   __lineup(name, fn)              everyone in a row, after fn(actor, i)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LivActor, ACTION_NAMES, EXPRESSION_NAMES } from '../liv3d.js';

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
addEventListener('resize', resize); resize();

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
// foot slide: horizontal travel of a planted ankle per frame (mm), walking and running
window.__slide = (id, mode = 'walk', frames = 240) => {
  const a = solo(id); a[mode](0); for (let i = 0; i < 120; i++) a.update(1 / 60);
  const foot = a.vrm.humanoid.getNormalizedBoneNode('leftFoot'), p = new THREE.Vector3(); let last = null, minY = 1e9, rec = [];
  for (let i = 0; i < frames; i++) { a.update(1 / 60); foot.getWorldPosition(p); rec.push(p.clone()); minY = Math.min(minY, p.y); }
  let sum = 0, n = 0;
  for (let i = 1; i < rec.length; i++) if (rec[i].y < minY + 0.0015 && rec[i - 1].y < minY + 0.0015) { sum += Math.hypot(rec[i].x - rec[i - 1].x, rec[i].z - rec[i - 1].z); n++; }
  only(null); return { id, mode, plantedFrames: n, mmPerFrame: n ? +(sum / n * 1000).toFixed(3) : null };
};
window.__actors = actors; window.__scene = scene; window.__live = (v) => { live = v; }; window.__THREE = THREE; window.__R = R; window.__cam = cam; window.__step = step;
load();
