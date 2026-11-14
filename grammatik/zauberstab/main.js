// Wunschzauber · B2 Kapitel 9 · Konjunktiv II der Gegenwart.
// An evening meadow; Liv (the VRM girl of tools/liv3d) holds a magic wand. Every wish sentence of the lesson has gaps
// where the Konjunktiv II goes; glowing word orbs float around her (the right form and the Indikativ forms she must not
// take). She, or the learner by swiping, swings the wand at an orb: the right one flies into the gap, a wrong one
// fizzles. A complete wish comes true: she floats up in a whirl of stars. Opening rounds show how the form is made
// (kam → käme: Präteritum, Umlaut, -e). No lesson text is in this file: the lesson page sends it (see wishes.js).
import * as THREE from 'three';
import { Sfx } from '../werkstatt/sfx.js';
import { ROUNDS, loadRounds, why, praise, VERBS } from './wishes.js';
import { pickVision, makeVision, stepVision } from './visions.js';

const qs = new URLSearchParams(location.search), TEST = qs.has('test');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => { const x = clamp(k, 0, 1); return x * x * (3 - 2 * x); };
const $ = (id) => document.getElementById(id);
const sfx = new Sfx();

/* ---------------- renderer, camera, light ---------------- */
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: TEST });
renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
scene.add(new THREE.HemisphereLight(0xfff0e6, 0x8f86b0, 1.75));
const key = new THREE.DirectionalLight(0xfff4e8, 1.35); key.position.set(1.4, 2.6, 3); scene.add(key);
const wandLight = new THREE.PointLight(0xffd36b, 0, 0.45, 2); scene.add(wandLight);

/* ---------------- the evening: sky, stars, moon, hills, meadow, trees, fireflies ---------------- */
function skyTexture() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 512; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#26244a'); gr.addColorStop(0.45, '#4b4680'); gr.addColorStop(0.78, '#c58aa0'); gr.addColorStop(1, '#f2c39a');
  g.fillStyle = gr; g.fillRect(0, 0, 8, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
scene.background = skyTexture();
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const INK = 0x2a1830;
function glowTexture(inner = 'rgba(255,236,170,1)', mid = 'rgba(255,214,120,.45)') {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  r.addColorStop(0, inner); r.addColorStop(0.35, mid); r.addColorStop(1, 'rgba(255,214,120,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function starTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,240,190,.9)'); r.addColorStop(1, 'rgba(255,220,140,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,250,225,.95)';
  g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, R = i % 2 ? 7 : 31; g.lineTo(32 + Math.cos(a) * R, 32 + Math.sin(a) * R); } g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW = glowTexture(), STAR = starTexture();
const world = new THREE.Group(); scene.add(world);
{
  // stars in the sky
  const n = 260, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const r = (k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); }; pos.set([(r(1) - 0.5) * 30, 2.4 + r(2) * 9, -12 - r(3) * 2], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  world.add(new THREE.Points(g, new THREE.PointsMaterial({ map: STAR, size: 0.16, transparent: true, depthWrite: false, color: 0xfff6dc })));
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.55, 40), flat(0xfff3d1)); moon.position.set(4.2, 5.4, -12.5); world.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, opacity: 0.55, depthWrite: false })); halo.scale.set(3.4, 3.4, 1); halo.position.copy(moon.position); world.add(halo);
  // far hills, two layers
  for (const [z, y, c, f] of [[-11, 0.2, 0x5a4f84, 0.33], [-8, 0, 0x4d6b6a, 0.55]]) {
    const s = new THREE.Shape(); s.moveTo(-30, -2);
    for (let x = -30; x <= 30; x += 0.5) s.lineTo(x, y + 0.9 + 0.55 * Math.sin(x * f + z) + 0.25 * Math.sin(x * 1.3 + z * 2));
    s.lineTo(30, -2); const m = new THREE.Mesh(new THREE.ShapeGeometry(s), flat(c)); m.position.z = z; world.add(m);
  }
  // the meadow: a wide floor and a round lawn she stands on
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), flat(0x5f8a5c)); floor.rotation.x = -Math.PI / 2; floor.position.z = -6; world.add(floor);
  const rim = new THREE.Mesh(new THREE.CircleGeometry(1.62, 64), flat(INK)); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.002; world.add(rim);
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(1.58, 64), flat(0x86b46b)); lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0.004; world.add(lawn);
  // trees and bushes, flat with an ink edge (the look of the painted lessons)
  const ball = new THREE.SphereGeometry(1, 18, 12);
  const tree = (x, z, h, c) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, h * 0.6, 10), flat(0x6e4a32)); trunk.position.set(x, h * 0.3, z); world.add(trunk);
    for (const [dx, dy, r] of [[0, 0.78, 0.44], [-0.34, 0.62, 0.34], [0.34, 0.62, 0.34], [-0.16, 0.95, 0.3], [0.2, 0.93, 0.3]]) {
      const R = r * h * 0.6; const o = new THREE.Mesh(ball, flat(INK)); o.scale.set(R + 0.03, R + 0.03, R * 0.6); o.position.set(x + dx * h * 0.6, dy * h, z - 0.04); world.add(o);
      const b = new THREE.Mesh(ball, flat(c)); b.scale.set(R, R, R * 0.6); b.position.set(x + dx * h * 0.6, dy * h, z); world.add(b);
    }
  };
  tree(-2.6, -2.6, 2.3, 0x3f6f58); tree(2.9, -3.2, 2.6, 0x46705b); tree(-4.6, -4.5, 2.8, 0x3a6352); tree(4.9, -4.8, 2.4, 0x3f6f58);
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(ball, flat(i % 2 ? 0x4f7d5e : 0x588a63)); const x = -5 + i * 1.25; b.scale.set(0.55, 0.42, 0.35); b.position.set(x, 0.25, -5.6 + Math.sin(i) * 0.3); world.add(b); }
  // flowers on the lawn
  for (let i = 0; i < 30; i++) { const a = i * 2.39996, r = 0.55 + (i * 0.37) % 1 * 0.95; const f = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), flat([0xffffff, 0xf6d255, 0xf29bb5][i % 3])); f.position.set(Math.cos(a) * r, 0.03, Math.sin(a) * r * 0.9); world.add(f); }
}
const flies = [];
for (let i = 0; i < 14; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff3a8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(0.09); s.userData = { a: i * 1.7, r: 1.6 + (i % 5) * 0.5, y: 0.3 + (i % 4) * 0.35, sp: 0.15 + (i % 3) * 0.07 }; world.add(s); flies.push(s);
}

/* ---------------- the wand (her own object, aimed every frame from her fist) ---------------- */
const wand = new THREE.Group(); scene.add(wand);
{
  const L = 0.3, stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0075, L, 10), new THREE.MeshToonMaterial({ color: 0x5a3a26 }));
  stick.position.y = L / 2 - 0.04; wand.add(stick);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0095, L + 0.004, 10), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); shell.position.copy(stick.position); wand.add(shell);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.02, 10), new THREE.MeshToonMaterial({ color: 0xd9a441 })); band.position.y = L * 0.62; wand.add(band);
  const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.016 : 0.036; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); } st.closePath();
  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(st, { depth: 0.01, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1 }), new THREE.MeshBasicMaterial({ color: 0xffd45e }));
  star.position.set(0, L - 0.04 + 0.03, -0.005); wand.add(star); wand.userData.star = star;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(0.16); halo.position.copy(star.position); wand.add(halo); wand.userData.halo = halo;
  wand.userData.tipLocal = V(0, L - 0.01, 0);
}
const tipWorld = () => wand.localToWorld(wand.userData.tipLocal.clone());

/* ---------------- sparkles ---------------- */
const sparks = [];
let vision = null;
const sparkMat = (c) => new THREE.SpriteMaterial({ map: STAR, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
function spark(p, v, life = 0.8, size = 0.06, color = 0xfff0b0, grav = -0.6) {
  if (sparks.length > 420) return;
  const s = new THREE.Sprite(sparkMat(color)); s.position.copy(p); s.scale.setScalar(size); scene.add(s);
  sparks.push({ s, v: v.clone(), life, t: 0, size, grav, spin: Math.random() * 6 });
}
function burst(p, n = 26, color = 0xfff0b0, speed = 1.2) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), sp = speed * (0.4 + Math.random() * 0.8); spark(p, V(Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp), 0.6 + Math.random() * 0.6, 0.04 + Math.random() * 0.05, color); }
}
function puff(p) { for (let i = 0; i < 18; i++) spark(p, V((Math.random() - 0.5) * 0.5, 0.2 + Math.random() * 0.4, (Math.random() - 0.5) * 0.3), 0.9, 0.09 + Math.random() * 0.06, 0x8f8a9c, 0.1); }
function stepSparks(dt) {
  for (const k of sparks) {
    k.t += dt; k.v.y += k.grav * dt; k.v.multiplyScalar(1 - dt * 0.9); k.s.position.addScaledVector(k.v, dt);
    const f = 1 - k.t / k.life; k.s.material.opacity = clamp(f * 1.4, 0, 1); k.s.scale.setScalar(k.size * (0.6 + 0.4 * f)); k.s.material.rotation = k.spin + k.t * 3;
    if (k.t >= k.life) { scene.remove(k.s); k.s.material.dispose(); }
  }
  for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].t >= sparks[i].life) sparks.splice(i, 1);
}

/* ---------------- word orbs ---------------- */
function labelTexture(text, dim = false) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d');
  g.font = '600 76px Inter, system-ui, sans-serif'; const w = Math.min(500, g.measureText(text).width + 64), x = (512 - w) / 2;
  g.fillStyle = dim ? 'rgba(120,116,140,.92)' : 'rgba(255,252,240,.96)'; g.strokeStyle = dim ? '#5c5870' : '#c9932a'; g.lineWidth = 6;
  g.beginPath(); g.roundRect(x, 26, w, 108, 54); g.fill(); g.stroke();
  g.fillStyle = dim ? '#e8e6ee' : '#3a2a12'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 84);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const orbs = [];
function clearOrbs() { for (const o of orbs) scene.remove(o.g); orbs.length = 0; }
function makeOrb(word, kind, home) {
  const g = new THREE.Group(); g.position.copy(home);
  // a word in a ring of light with a few stars circling it (not a ball: a pale disc reads as a second moon)
  const ball = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.006, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd76e, transparent: true, opacity: 0.9 })); ball.scale.set(1.25, 0.62, 1);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xffc95a, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(0.62, 0.36, 1);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(word), transparent: true, depthTest: false })); label.scale.set(0.4, 0.125, 1); label.renderOrder = 5;
  const orbit = new THREE.Group();
  for (let i = 0; i < 3; i++) { const st = new THREE.Sprite(sparkMat(0xfff3c4)); st.scale.setScalar(0.05); st.userData.a = i * 2.094; orbit.add(st); }
  g.add(halo, ball, orbit, label); scene.add(g); g.userData.orbit = orbit;
  const o = { g, ball, halo, label, word, kind, home: home.clone(), state: 'idle', t: 0, ph: orbs.length * 2.1, s0: portrait() ? 0.8 : 1 }; g.scale.setScalar(o.s0);
  orbs.push(o); return o;
}
function setLabel(o, word, dim) { o.label.material.map.dispose(); o.label.material.map = labelTexture(word, dim); o.label.material.needsUpdate = true; o.word = word; }

/* ---------------- Liv ---------------- */
let liv = null, rig = null;
const ST = { aim: V(), hand: V(), float: 0, floatT: -1, look: null };
const portrait = () => innerWidth / innerHeight < 0.9;
const SPOT = () => (portrait() ? { x: 0, yaw: 0 } : { x: -0.36, yaw: 0.28 });
// an offset given in her own frame (x = her left, z = in front of her) turned into the world
const own = (x, y, z) => { const a = liv ? liv.yaw : SPOT().yaw; return V(x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)); };
const SH = () => { const sp = SPOT(); if (!rig) return V(sp.x - 0.13, 0.8, 0); const r = rig.rest.rightUpperArm; return own(r.x, 0, r.z).add(V(liv.x, r.y, liv.z)); };
function restHand() { return SH().add(own(-0.05, -0.17, 0.17)); }
function restAim() { return palmWorld().add(own(-0.12, 0.5, 0.4)); }
function palmWorld() {
  if (!liv) return V(-0.22, 0.75, 0.25);
  return liv.body.localToWorld(liv._palm('R', 0.008));
}
async function loadLiv() {
  const { LivActor } = await import('../../tools/liv3d/liv3d.js');
  const { shapeRow } = await import('../../tools/liv3d/hands.js');
  const model = (TEST && qs.get('livmodel')) || new URL('../liv/liv.vrm', import.meta.url).href;
  const a = await Promise.race([LivActor.load(model), new Promise((_, no) => setTimeout(() => no(new Error('Liv: the model took too long')), 45000))]);
  liv = a; rig = a.rig; scene.add(a.root); const sp = SPOT(); a.reset({ x: sp.x, z: 0, yaw: sp.yaw }); a.setExpression('happy');
  ST.grip = shapeRow('gripHandle', 0.92);
  ST.hand.copy(restHand());
}

/* ---------------- the swing ---------------- */
// windup -> strike -> hold -> back. kind 'auto' starts with a windup; a swipe ('user') strikes from where the hand is.
let swing = null;
function startSwing(orb, kind = 'auto') {
  if (swing || !orb) return;
  swing = { orb, t: kind === 'user' ? 0.26 : 0, hit: false, from: ST.hand.clone(), fromAim: ST.aim.clone() };
  sfx.ok && swish(kind === 'user' ? 0.9 : 1);
}
function stepSwing(dt) {
  const s = SH(); let hand, aim;
  if (swing) {
    swing.t += dt; const t = swing.t, tgt = swing.orb.g.position.clone().sub(V(0, ST.float, 0)), dir = tgt.clone().sub(s).normalize();
    const reach = rig ? rig.M.arm * 0.86 : 0.25;
    const wind = s.clone().add(own(-0.1, 0.17, -0.03)), strike = s.clone().addScaledVector(dir, reach);
    if (t < 0.3) { const k = ease(t / 0.3); hand = swing.from.clone().lerp(wind, k); aim = swing.fromAim.clone().lerp(wind.clone().add(own(-0.15, 0.55, -0.15)), k); }
    else if (t < 0.46) { const k = ease((t - 0.3) / 0.16); hand = wind.clone().lerp(strike, k); aim = wind.clone().add(own(-0.15, 0.55, -0.15)).lerp(tgt, k); }
    else if (t < 0.8) { hand = strike; aim = tgt; }
    else { const k = ease((t - 0.8) / 0.45); hand = strike.clone().lerp(restHand(), k); aim = tgt.clone().lerp(restAim(), k); }
    if (!swing.hit && t >= 0.44) { swing.hit = true; onHit(swing.orb); }
    if (t >= 1.25) swing = null;
  } else if (drag.on && drag.p3) {
    // the hand follows the pointer but stays in front of her (the wand, not her arm, does the reaching), never across her face
    const dir = drag.p3.clone().sub(s).normalize(); hand = s.clone().addScaledVector(dir, (rig ? rig.M.arm : 0.28) * 0.75).add(own(0, 0, 0.1)); hand.y = Math.min(hand.y, s.y + 0.06); aim = drag.p3.clone();
  } else { hand = restHand(); aim = vision && vision.t < 2.4 ? vision.root.position.clone() : restAim(); }
  // springs, so nothing jumps
  const k = 1 - Math.exp(-dt * (swing ? 30 : drag.on ? 18 : 6));
  ST.hand.lerp(hand, k); ST.aim.lerp(aim, 1 - Math.exp(-dt * (swing ? 40 : 10)));
  if (liv) { if (ST.floatT >= 0) { liv.setHandTarget('R', null); ST.hand.copy(restHand()); } else liv.setHandTarget('R', ST.hand, { row: ST.grip, elbow: own(-0.7, -0.7, -0.1) }); }
}
function placeWand() {
  const base = palmWorld(), dir = ST.aim.clone().sub(base); if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0); dir.normalize();
  wand.position.copy(base); wand.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
  const tip = tipWorld(), mv = ST.lastTip ? tip.distanceTo(ST.lastTip) : 0; ST.lastTip = tip;
  wandLight.position.copy(tip); wandLight.intensity = lerp(wandLight.intensity, clamp(mv * 20, 0, 0.25) + 0.04, 0.2);
  return mv;
}

/* ---------------- sound (synthesized, like the workshop) ---------------- */
function swish(s = 1) { const t = sfx.now(); sfx.burst('bandpass', 700, 1.4, t, 0.05, 0.18 * s, 0.32, 3600); }
function chime() { const t = sfx.now(); [1318.5, 1760, 2093, 2637].forEach((f, i) => { sfx.tone('sine', f, t + i * 0.07, 0.005, 0.12, 0.5); sfx.tone('triangle', f * 2, t + i * 0.07, 0.005, 0.03, 0.3); }); }
function fizzle() { const t = sfx.now(); sfx.burst('lowpass', 900, 0.8, t, 0.02, 0.25, 0.5, 140); sfx.tone('square', 110, t, 0.01, 0.05, 0.25); }
function magic() { const t = sfx.now(); [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => { sfx.tone('sine', f, t + i * 0.09, 0.01, 0.1, 0.7); }); sfx.burst('highpass', 3000, 0.7, t, 0.3, 0.06, 1.4); }

/* ---------------- rounds ---------------- */
const S = { mode: 'watch', ri: 0, gi: 0, phase: 'idle', t: 0, score: 0, tries: 0, firstTry: true, wait: 0, plan: null };
const R = () => ROUNDS[S.ri];
function shuffle(a, seed) { const b = a.slice(); let x = seed * 9301 + 49297; for (let i = b.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function orbHomes(n) {
  const p = portrait();
  return Array.from({ length: n }, (_, i) => { const u = n === 1 ? 0 : i / (n - 1) * 2 - 1;
    return p ? V(u * 0.36, 1.32 + (1 - u * u) * 0.14, 0.4 - Math.abs(u) * 0.06) : V(0.42 + u * 0.34, 0.93 + (1 - u * u) * 0.17, 0.32 - Math.abs(u) * 0.05); });
}
function ui() {
  const r = R(); $('round').textContent = r ? `Runde ${S.ri + 1} / ${ROUNDS.length}` : '';
  $('score').textContent = S.mode === 'try' && S.tries ? `${S.score} / ${S.tries} beim ersten Mal` : '';
  const w = $('wish');
  if (!r) { w.innerHTML = ''; return; }
  if (r.kind === 'form') {
    const shown = S.phase === 'done' || S.phase === 'next';
    w.innerHTML = `<span class="hint">So entsteht die Form</span><span class="form"><b>${r.from}</b> → ` + (shown ? r.parts.map((p) => p.kind === 'umlaut' ? `<b class="u">${p.c}</b>` : p.kind === 'ending' ? `<b class="e">${p.c}</b>` : p.c).join('') + `<small>${[r.umlaut ? 'Umlaut' : '', r.ending ? 'Endung -' + r.ending : ''].filter(Boolean).join(' · ')}</small>` : '<span class="gap now">?</span>') + '</span>';
  } else {
    let n = 0; const parts = r.toks.map((t) => { if (!t.gap) return t.text; const i = n++; const cls = i < S.gi || S.phase === 'done' || S.phase === 'next' ? 'done' : i === S.gi ? 'now' : ''; return `<span class="gap ${cls}">${t.text}</span>${t.comma ? ',' : ''}`; });
    w.innerHTML = (r.hint ? `<span class="hint">${r.hint}</span>` : '') + parts.join(' ') + '.';
  }
  const ch = $('choices'); ch.innerHTML = '';
  if (S.mode === 'try' && S.phase === 'choose') orbs.forEach((o, i) => { if (o.state !== 'idle') return; const b = document.createElement('button'); b.textContent = `${i + 1} · ${o.word}`; b.onclick = () => userPick(o); ch.appendChild(b); });
  const c = $('controls'); c.innerHTML = '';
  if (S.phase === 'next') { const b = document.createElement('button'); b.className = 'on'; b.textContent = S.ri + 1 < ROUNDS.length ? 'Nächster Wunsch →' : 'Noch einmal'; b.onclick = next; c.appendChild(b); setTimeout(() => S.mode === 'try' && b.focus(), 0); }
}
function caption(html) { $('caption').innerHTML = html || ''; }
function gapNow() { const r = R(); const t = r && r.kind === 'wish' ? r.toks.filter((x) => x.gap)[S.gi] : null; return t ? t.gap : null; }

function startRound(i) {
  if (vision) { scene.remove(vision.root); vision = null; }
  S.ri = i; S.gi = 0; S.phase = 'idle'; S.t = 0; S.firstTry = true; swing = null; clearOrbs();
  if (liv) { liv.setExpression('happy'); liv.lookAt(null); }
  const r = R(); if (!r) return;
  if (r.kind === 'form') {
    const o = makeOrb(r.from, 'form', orbHomes(1)[0]);
    caption(`Präteritum <b>${r.from}</b> – wie wird daraus der Konjunktiv II? ${S.mode === 'try' ? 'Schwing den Stab über die Kugel!' : ''}`);
    S.phase = 'choose'; S.plan = { at: 1.4, orb: o };
  } else setupGap();
  ui();
}
function setupGap() {
  clearOrbs(); const g = gapNow(); if (!g) return;
  const homes = orbHomes(g.opts.length), opts = shuffle(g.opts, S.ri * 7 + S.gi * 3 + 1);
  opts.forEach((o, i) => makeOrb(o.w, o.kind, homes[i]));
  const verb = g.verb === 'werden' ? 'würde + Infinitiv' : 'Konjunktiv II von ' + g.verb;
  caption(S.mode === 'try' ? `Welches Wort macht den Wunsch? <span style="color:#6b6f78">(${verb})</span> Wisch mit dem Stab über die richtige Kugel.` : `Liv sucht das Wort für den Wunsch …`);
  S.phase = 'choose'; S.t = 0;
  // in "watch", Liv first glances at the orbs; sometimes she takes the Indikativ first, to show what goes wrong
  const right = orbs.find((o) => o.kind === 'k2'), wrong = orbs.find((o) => o.kind === 'pres');
  S.plan = S.mode === 'watch' ? { at: 1.9, orb: (S.ri % 3 === 1 && S.gi === 0 && wrong) ? wrong : right } : null;
  ui();
}
function onHit(o) {
  const r = R(); if (!r || o.state !== 'idle') return;
  if (r.kind === 'form') {
    o.state = 'win'; burst(o.g.position, 40); sfx.ok && chime(); setLabel(o, r.to);
    caption(`<b>${r.from}</b> → <b class="ok">${r.to}</b>: Präteritum${r.umlaut ? ' + Umlaut' : ''}${r.ending ? ' + Endung -' + r.ending : ''}. So entsteht der Konjunktiv II.`);
    if (liv) liv.setExpression('smile');
    S.phase = 'done'; S.wait = 1.6; ui(); return;
  }
  const g = gapNow(); if (!g) return;
  if (S.mode === 'try') { if (S.firstTry) S.tries++; }
  if (o.kind === 'k2') {
    if (S.mode === 'try' && S.firstTry) S.score++;
    o.state = 'fly'; o.t = 0; burst(o.g.position, 30); sfx.ok && chime(); ST.lastHit = o.home.clone();
    caption(praise(g)); if (liv) liv.setExpression('smile');
    for (const x of orbs) if (x !== o && x.state === 'idle') { x.state = 'fade'; x.t = 0; }
    S.phase = 'won'; S.wait = 1.3; ui();
  } else {
    o.state = 'fizzle'; o.t = 0; puff(o.g.position); setLabel(o, o.word, true); sfx.ok && fizzle();
    caption(why(g, o.kind)); S.firstTry = false;
    if (liv) { liv.setExpression('surprised'); liv.play('shake'); setTimeout(() => liv && liv.setExpression('happy'), 1400); }
    if (S.mode === 'watch') { S.plan = { at: S.t + 2.6, orb: orbs.find((x) => x.kind === 'k2') }; }
    ui();
  }
}
function afterGap() {
  const r = R(), total = r.toks.filter((t) => t.gap).length;
  S.gi++; S.firstTry = true;
  if (S.gi < total) { setupGap(); return; }
  // the wish comes true
  S.phase = 'done'; clearOrbs(); ui();
  const sent = r.toks.map((t) => t.text + (t.comma ? ',' : '')).join(' ') + '.';
  caption(`✨ <b class="ok">Wunsch erfüllt!</b> ${sent}${r.alt.length ? ` <span style="color:#6b6f78">Auch richtig: ${r.alt[0]}.</span>` : ''}`);
  ST.floatT = 0; sfx.ok && magic(); if (liv) { liv.setExpression('laugh'); liv.play('cheer'); }
  // the wish appears where the wand just struck: a small picture of it grows out of the sparkles
  if (vision) scene.remove(vision.root);
  vision = makeVision(pickVision(sent), GLOW); const at = (ST.lastHit || orbHomes(3)[1]).clone(); at.y = portrait() ? 1.38 : 0.9; at.z = 0.3;
  vision.root.position.copy(at); vision.y0 = at.y; vision.from = tipWorld(); scene.add(vision.root);
  S.wait = reduce ? 1.6 : 3.9;
}
function next() { const n = S.ri + 1 < ROUNDS.length ? S.ri + 1 : 0; if (n === 0) { S.score = 0; S.tries = 0; } startRound(n); }
function userPick(o) { if (S.phase !== 'choose' || swing || o.state !== 'idle') return; startSwing(o, 'auto'); }

/* ---------------- the learner's swipe ---------------- */
const drag = { on: false, pts: [], p3: null, down: null };
const ray = new THREE.Raycaster(), plane = new THREE.Plane(V(0, 0, 1), -0.42);
function to3(x, y) { const r = canvas.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), camera); const p = V(); return ray.ray.intersectPlane(plane, p) ? p : null; }
function screenOf(p) { const r = canvas.getBoundingClientRect(), v = p.clone().project(camera); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; }
function orbRadiusPx(o) { const a = screenOf(o.g.position), b = screenOf(o.g.position.clone().add(V(0.14, 0, 0))); return Math.max(26, Math.hypot(b.x - a.x, b.y - a.y)); }
function segDist(p, a, b) { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1, t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l, 0, 1); return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y); }
canvas.addEventListener('pointerdown', (e) => {
  if (S.mode !== 'try' || S.phase !== 'choose' || swing) return;
  sfx.ensure(); canvas.setPointerCapture(e.pointerId);
  drag.on = true; drag.pts = [{ x: e.clientX, y: e.clientY, t: performance.now() }]; drag.down = drag.pts[0]; drag.p3 = to3(e.clientX, e.clientY);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag.on) return;
  const p = { x: e.clientX, y: e.clientY, t: performance.now() }, a = drag.pts[drag.pts.length - 1]; drag.pts.push(p); if (drag.pts.length > 40) drag.pts.shift();
  drag.p3 = to3(e.clientX, e.clientY) || drag.p3;
  const speed = Math.hypot(p.x - a.x, p.y - a.y) / Math.max(1, p.t - a.t) * 1000;
  if (speed > 260) for (const o of orbs) { if (o.state !== 'idle') continue; if (segDist(screenOf(o.g.position), a, p) < orbRadiusPx(o)) { drag.on = false; startSwing(o, 'user'); break; } }
});
const endDrag = (e) => {
  if (!drag.on) return; drag.on = false;
  const moved = drag.down ? Math.hypot(e.clientX - drag.down.x, e.clientY - drag.down.y) : 99;
  if (moved < 12) for (const o of orbs) { if (o.state === 'idle' && Math.hypot(screenOf(o.g.position).x - e.clientX, screenOf(o.g.position).y - e.clientY) < orbRadiusPx(o)) { startSwing(o, 'auto'); break; } }
};
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', () => { drag.on = false; });
addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '3' && S.mode === 'try') { const live = orbs.filter((o) => o.state === 'idle'); const o = orbs[+e.key - 1]; if (o && live.includes(o)) userPick(o); }
  if ((e.key === 'ArrowRight' || e.key === 'Enter') && S.phase === 'next') next();
  if (e.key === 'Escape') window.parent !== window && window.parent.postMessage({ type: 'werkstatt-close' }, location.origin);
});

/* ---------------- the clock ---------------- */
function step(dt) {
  S.t += dt;
  // watch mode: Liv glances at the orbs, then swings
  if (S.phase === 'choose' && S.plan && !swing) {
    if (liv && S.mode === 'watch') { const k = Math.floor(S.t / 0.55) % Math.max(1, orbs.length); const o = orbs[k]; if (o) liv.lookAt(o.g.position); }
    if (S.t >= S.plan.at) { const o = S.plan.orb; S.plan = null; if (liv && o) liv.lookAt(o.g.position); startSwing(o, 'auto'); }
  }
  if (S.mode === 'try' && liv && S.phase === 'choose' && !swing) liv.lookAt(drag.on && drag.p3 ? drag.p3 : null);
  if ((S.phase === 'won' || S.phase === 'done') && S.wait > 0) {
    S.wait -= dt;
    if (S.wait <= 0) { if (S.phase === 'won') afterGap(); else { S.phase = 'next'; ui(); if (S.mode === 'watch') S.wait = -1, S.auto = 2.4; } }
  }
  if (S.phase === 'next' && S.mode === 'watch' && S.auto != null) { S.auto -= dt; if (S.auto <= 0) { S.auto = null; next(); } }
  // orbs: bob, fly into the sentence, fade, fizzle and fall
  const bottom = V(0.1, -0.15, 1.6);
  for (const o of orbs) {
    o.t += dt; const b = Math.sin(S.t * 1.8 + o.ph) * 0.025;
    for (const st of o.g.userData.orbit.children) { const a = st.userData.a + S.t * 1.6 + o.ph; st.position.set(Math.cos(a) * 0.19, Math.sin(a) * 0.095, Math.sin(a) * 0.02); }
    if (o.state === 'idle') { o.g.position.set(o.home.x, o.home.y + b, o.home.z); o.halo.material.opacity = 0.45 + 0.2 * Math.sin(S.t * 3 + o.ph); }
    else if (o.state === 'fly') { const k = ease(o.t / 0.9); o.g.position.lerpVectors(o.home, bottom, k); o.g.scale.setScalar(o.s0 * (1 - 0.5 * k)); if (o.t < 0.9 && Math.random() < 0.6) spark(o.g.position, V(0, 0.1, 0), 0.5, 0.04); if (o.t > 0.9) o.g.visible = false; }
    else if (o.state === 'fade') { const k = clamp(o.t / 0.5, 0, 1); o.g.scale.setScalar(o.s0 * (1 - k)); }
    else if (o.state === 'fizzle') { o.ball.material.color.setHex(0x8f8aa0); o.halo.material.opacity = 0.08; o.g.userData.orbit.visible = false; o.g.position.y = o.home.y - Math.min(0.25, o.t * o.t * 0.6); o.g.rotation.z = Math.sin(o.t * 20) * 0.08 * Math.exp(-o.t * 3); }
    else if (o.state === 'win') { o.g.scale.setScalar(o.s0 + 0.25 * Math.sin(Math.min(o.t, 0.6) / 0.6 * Math.PI)); }
  }
  // the wish comes true: she floats up in a whirl of stars
  if (ST.floatT >= 0) {
    ST.floatT += dt; const T = reduce ? 1.2 : 3.0, k = ST.floatT / T;
    ST.float = (reduce ? 0.08 : 0.3) * Math.sin(Math.PI * clamp(k, 0, 1)) ** 1.3;
    if (k < 1 && Math.random() < 0.55) { const a = ST.floatT * 5 + Math.random() * 6.28, r = 0.3 + Math.random() * 0.12, cx = liv ? liv.x : 0; spark(V(cx + Math.cos(a) * r, 0.05 + Math.random() * (0.9 + ST.float), Math.sin(a) * r * 0.7), V(-Math.sin(a) * 0.25, 0.3 + Math.random() * 0.3, Math.cos(a) * 0.18), 0.9, 0.035 + Math.random() * 0.03, Math.random() < 0.5 ? 0xfff0b0 : 0xffc8e6, 0.05); }
    else { ST.floatT = -1; ST.float = 0; if (liv) liv.setExpression('happy'); }
  }
  stepSwing(dt);
  if (liv) { liv.root.position.y = ST.float; liv.update(dt); }
  const mv = placeWand();
  if (mv > 0.004) { const tip = tipWorld(); spark(tip, V((Math.random() - 0.5) * 0.2, -0.05, (Math.random() - 0.5) * 0.2), 0.55, 0.035 + Math.random() * 0.03); }
  if (Math.random() < 0.06) spark(tipWorld(), V((Math.random() - 0.5) * 0.08, 0.05, 0), 0.7, 0.025);
  for (const f of flies) { const u = f.userData, a = u.a + S.t * u.sp; f.position.set(Math.cos(a) * u.r, u.y + Math.sin(a * 2.3) * 0.12, Math.sin(a) * u.r * 0.6 - 0.6); f.material.opacity = 0.45 + 0.4 * Math.sin(S.t * 2 + u.a); }
  if (vision) {
    const v = vision; if (v.t < 0.45 && v.from) { const k = v.t / 0.45, p = v.from.clone().lerp(v.root.position, k); for (let i = 0; i < 3; i++) spark(p, V((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 0), 0.5, 0.05, 0xfff0b0, 0); }
    if (v.t > 0.45 && v.t < 0.5) burst(v.root.position, 24, 0xfff3c4, 0.8);
    if (!stepVision(v, dt, reduce ? 1.8 : 3.8)) { scene.remove(v.root); vision = null; }
  }
  stepSparks(dt);
}

/* ---------------- layout ---------------- */
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  if (w / h < 0.9) { camera.fov = 44; camera.position.set(0.05, 1.05, 3.1); camera.lookAt(0, 0.82, 0.1); }
  else { camera.fov = 30; camera.position.set(0.2, 0.92, 3.5); camera.lookAt(0.08, 0.5, 0.1); }
  if (liv) { const sp = SPOT(); if (Math.abs(liv.x - sp.x) > 0.01 || Math.abs(liv.yaw - sp.yaw) > 0.01) { liv.reset({ x: sp.x, z: 0, yaw: sp.yaw }); liv.setExpression('happy'); } }
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => { resize(); if (S.phase === 'choose') { const homes = orbHomes(orbs.length); orbs.forEach((o, i) => o.home.copy(homes[i])); } });

/* ---------------- start: texts from the lesson page, Liv, buttons ---------------- */
let gotTexts; const textsReady = new Promise((r) => { gotTexts = r; });
addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.type !== 'werkstatt-texts') return;
  gotTexts(loadRounds(e.data.texts));
});
if (window.parent !== window) window.parent.postMessage({ type: 'werkstatt-ready' }, location.origin);
function setMode(m) {
  S.mode = m; $('watch').classList.toggle('on', m === 'watch'); $('try').classList.toggle('on', m === 'try');
  canvas.style.cursor = m === 'try' ? 'crosshair' : 'default'; startRound(S.ri);
}
$('watch').onclick = () => { sfx.ensure(); setMode('watch'); };
$('try').onclick = () => { sfx.ensure(); setMode('try'); };
$('sound').onclick = () => { sfx.ensure(); sfx.setOn(!sfx.on); $('sound').textContent = sfx.on ? 'Ton an' : 'Ton aus'; $('sound').setAttribute('aria-pressed', String(sfx.on)); };
$('close').onclick = () => (window.parent !== window ? window.parent.postMessage({ type: 'werkstatt-close' }, location.origin) : history.back());

let last = performance.now(), started = false;
function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); renderer.render(scene, camera); requestAnimationFrame(frame); }
resize();
(async () => {
  const late = setTimeout(() => { $('goWatch').textContent = 'Nicht verfügbar'; }, 8000);
  const livP = loadLiv().catch((e) => { console.warn('Wunschzauber: Liv could not be loaded; the wand works alone.', e); });
  const n = await textsReady; clearTimeout(late); await livP;
  if (!n) { $('goWatch').textContent = 'Nicht verfügbar'; return; }
  ST.aim.copy(restAim()); stepSwing(1); placeWand();
  const go = (m) => { sfx.ensure(); $('start').remove(); setMode(m); started = true; };
  $('goWatch').disabled = false; $('goWatch').textContent = 'Zuschauen'; $('goWatch').onclick = () => go('watch');
  $('goTry').disabled = false; $('goTry').onclick = () => go('try'); $('goTry').focus();
  startRound(0);
})();
if (!TEST) requestAnimationFrame(frame); else renderer.render(scene, camera);

// hooks for checking without real time (test mode): __z.adv(n) steps, __z.render(), __z.view(pos, at, fov)
window.__z = {
  S, orbs, get liv() { return liv; }, renderer, scene, camera, ROUNDS, sparks,
  adv(n = 1) { for (let i = 0; i < n; i++) step(1 / 60); renderer.render(scene, camera); return S.t; },
  render() { renderer.render(scene, camera); },
  mode(m) { $('start') && $('start').remove(); setMode(m); },
  round(i) { startRound(i); }, pick(i) { userPick(orbs[i]); }, swipe(i) { startSwing(orbs[i], 'user'); },
  screenOf: (p) => screenOf(p),
  view(pos, at, fov) { if (fov) camera.fov = fov; camera.position.set(...pos); camera.lookAt(...at); camera.updateProjectionMatrix(); renderer.render(scene, camera); },
  resize,
};
