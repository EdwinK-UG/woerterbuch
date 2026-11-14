// Liv 3D demo: orbit camera, buttons for every command, and deterministic stepping hooks for tests:
//   __step(dt, n)  advance n steps of dt seconds (pauses the live clock)     __render()  draw one frame
//   __seek(t)      replay the current script at time t (pure function of t)  __actor, __THREE, __cam(view)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LivActor, ACTION_NAMES, EXPRESSION_NAMES, SHAPE_NAMES } from '../liv3d.js';

const qs = new URLSearchParams(location.search);
const modelUrl = qs.get('model') || '../../../grammatik/liv/liv.vrm';
const fallback = '../models/sample.vrm';
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
renderer.setClearColor(0xf3e9d8);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
const controls = new OrbitControls(cam, canvas); controls.enableDamping = false;
scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb9a98a, 1.85));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(1.5, 3, 2.5); scene.add(sun);
// ground with soft markers, so motion over the ground (and any foot sliding) is visible
const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshBasicMaterial({ color: 0xece0cb })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.02, 10), new THREE.MeshBasicMaterial({ color: 0xd2c1a3 }), 61 * 61);
{ const m = new THREE.Matrix4(); let i = 0; for (let x = -30; x <= 30; x++) for (let z = -30; z <= 30; z++) { m.makeRotationX(-Math.PI / 2).setPosition(x * 0.5, 0.001, z * 0.5); dots.setMatrixAt(i++, m); } scene.add(dots); }

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

let actor, H = 1.4, follow = true, close = false, view = 'tq', live = true, script = [];
const status = document.getElementById('status');
async function load() {
  const o = { scale: +(qs.get('scale') || 1) };
  try { actor = await LivActor.load(modelUrl, o); document.getElementById('model').textContent = modelUrl.split('/').pop(); }
  catch (e) { actor = await LivActor.load(fallback, o); document.getElementById('model').textContent = 'sample.vrm (no liv.vrm yet)'; }
  scene.add(actor.root); H = actor.rig.M.headY * 1.12;
  setView('tq'); buildUI(); if (qs.get('ui') === '0') window.__ui(false); window.__actor = actor; window.__ready = true;
}

// camera: full body or close-up, from the front / side / back / three-quarter of her current facing
const VIEWS = { front: 0, tq: 0.75, side: Math.PI / 2, back: Math.PI, tqb: 2.4 };
function frame() {
  const p = actor.position, y = close ? actor.rig.M.headY * 0.95 : H * 0.5, d = close ? H * 1.1 : H * 2.6;
  return { p, y, d };
}
function setView(v) {
  view = v; const { p, y, d } = frame(), a = actor.yaw + VIEWS[v];
  controls.target.set(p.x, y, p.z); cam.position.set(p.x + Math.sin(a) * d, y + H * 0.08, p.z + Math.cos(a) * d); controls.update();
}
function followCam() {
  if (!follow) return; const { p, y } = frame(), dx = p.x - controls.target.x, dz = p.z - controls.target.z, dy = y - controls.target.y;
  controls.target.x += dx; controls.target.z += dz; controls.target.y += dy; cam.position.x += dx; cam.position.z += dz; cam.position.y += dy; controls.update();
}

// UI
function buildUI() {
  const root = document.getElementById('panels');
  const sec = (title) => { const h = document.createElement('h2'); h.textContent = title; root.appendChild(h); const d = document.createElement('div'); root.appendChild(d); return d; };
  const btn = (d, label, fn) => { const b = document.createElement('button'); b.textContent = label; b.onclick = () => { live = true; if (!/park/.test(label)) run = null; fn(b); }; d.appendChild(b); return b; };
  const toCam = () => Math.atan2(cam.position.x - actor.x, cam.position.z - actor.z);
  let d = sec('Move');
  btn(d, 'Walk', () => actor.walk()); btn(d, 'Run', () => actor.run()); btn(d, 'Stop', () => actor.stop());
  btn(d, 'Turn left', () => { actor.stop(); actor.turnTo(actor.yaw + Math.PI / 2); });
  btn(d, 'Turn right', () => { actor.stop(); actor.turnTo(actor.yaw - Math.PI / 2); });
  btn(d, 'Turn to the camera', () => { actor.stop(); actor.turnTo(toCam()); });
  btn(d, 'Walk away', () => { actor.walk(toCam() + Math.PI); });
  btn(d, 'Walk toward camera', () => { actor.walk(toCam()); });
  btn(d, 'Run 3 m and back', async () => { const x = actor.x, z = actor.z, a = actor.yaw; await actor.moveTo(x + 3 * Math.sin(a), z + 3 * Math.cos(a), { run: true }); await actor.moveTo(x, z); actor.turnTo(a); });
  btn(d, 'Walk a circle', () => { let k = 0; const go = () => { if (k++ > 7) return; const a = k * Math.PI / 4; actor.moveTo(1.2 * Math.sin(a), 1.2 - 1.2 * Math.cos(a)).then((ok) => ok && go()); }; go(); });
  d = sec('Actions');
  ACTION_NAMES.forEach((n) => btn(d, n, () => actor.play(n)));
  d = sec('Expressions');
  EXPRESSION_NAMES.forEach((n) => btn(d, n, () => actor.setExpression(n)));
  btn(d, 'blink', () => actor.blink());
  d = sec('Hand shape (both hands)');
  btn(d, 'auto', () => { actor.setHand('L', null); actor.setHand('R', null); });
  SHAPE_NAMES.forEach((n) => btn(d, n, () => { actor.setHand('L', n); actor.setHand('R', n); }));
  d = sec('Look');
  btn(d, 'idle', () => actor.lookAt(null));
  btn(d, 'camera', () => actor.lookAt(cam.position));
  for (const [n, x, y] of [['left', 1, 1.0], ['right', -1, 1.0], ['up', 0, 2.2], ['down', 0, 0.2]]) btn(d, n, () => { const a = actor.yaw, s = Math.sin(a), c = Math.cos(a); actor.lookAt(new THREE.Vector3(actor.x + s * 1.5 + c * x * 1.5, y * actor.rig.M.headY / 1.4, actor.z + c * 1.5 - s * x * 1.5)); });
  d = sec('Props');
  btn(d, 'apple', () => actor.holdProp('apple')); btn(d, 'crate', () => actor.holdProp('crate')); btn(d, 'saw handle', () => actor.holdProp('sawHandle')); btn(d, 'empty hands', () => actor.holdProp(null));
  btn(d, 'satchel on/off', () => actor.attachSatchel(!actor.satchel));
  d = sec('Camera');
  for (const v of Object.keys(VIEWS)) btn(d, { front: 'front', tq: 'three-quarter', side: 'side', back: 'back', tqb: 'three-quarter back' }[v], () => setView(v));
  btn(d, 'close-up on/off', () => { close = !close; setView(view); });
  btn(d, 'follow on/off', () => { follow = !follow; });
  d = sec('Scripted scene (replay)');
  btn(d, 'park route', () => { script = parkScript(); actor.reset(START); run = { t: 0, i: 0 }; setView('front'); });
}

// the film park, as a pure function of time: run 6 m, stop, turn to the camera, thumbs-up
function parkScript() {
  return [
    { t: 0.7, do: (a) => a.moveTo(2.6, 0, { run: true, speed: 2.48, then: (a) => { a.turnTo(0); a.after(0.45, (a) => a.play('thumb')); } }) },
  ];
}
let run = null;   // a script playing live (events fired as their time comes)
const START = { x: -3.4, z: 0, yaw: Math.PI / 2 };

window.__step = (dt = 1 / 60, n = 1) => { live = false; run = null; for (let i = 0; i < n; i++) actor.update(dt); followCam(); };
window.__render = () => { renderer.render(scene, cam); return true; };
window.__seek = (t, s) => { live = false; run = null; actor.replay(s || (script.length ? script : parkScript()), t, START); followCam(); };
window.__cam = (v, closeUp = false) => { close = closeUp; setView(v); };
window.__ui = (on) => { document.getElementById('ui').style.display = on ? '' : 'none'; document.getElementById('status').style.display = on ? '' : 'none'; };
window.__THREE = THREE; window.__renderer = renderer; window.__scene = scene; window.__camera = cam; window.__controls = controls;
window.__park = parkScript;

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!actor) return;
  if (live && run) { run.t += dt; while (run.i < script.length && script[run.i].t <= run.t) script[run.i++].do(actor); }
  if (live) { actor.update(dt); followCam(); }
  status.textContent = `${actor.v.toFixed(2)} m/s  yaw ${(actor.yaw * 57.3).toFixed(0)}°  ${actor.frozen ? 'standing' : 'stepping'}`;
  renderer.render(scene, cam);
}
load().then(() => requestAnimationFrame(loop)).catch((e) => { status.textContent = 'error: ' + e.message; console.error(e); });
