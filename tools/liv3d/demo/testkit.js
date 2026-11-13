// Test helpers for the demo page (loaded on demand: `await import('./testkit.js')`). They render at a fixed size with
// the stepping hooks (no animation frames needed) and post PNG contact sheets to a local sink (tools: a tiny HTTP
// server on 127.0.0.1:8794 that saves POST bodies; see docs/liv3d.md). Nothing here runs in the app.
const THREE = window.__THREE;
const r = () => window.__renderer, s = () => window.__scene, c = () => window.__camera, ctl = () => window.__controls;

export function render(w, h) {
  const R = r(), C = c(); R.setPixelRatio(1); R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix(); R.render(s(), C); return R.domElement;
}
// camera relative to the actor: view yaw offset (0 front), distance, look-at height
export function camAt(a, off, dist, y, follow = true) {
  const C = c(), A = window.__actor, p = follow ? A.position : new THREE.Vector3(0, 0, 0), ang = (follow ? A.yaw : 0) + off;
  C.position.set(p.x + Math.sin(ang) * dist, y + 0.05, p.z + Math.cos(ang) * dist); ctl().target.set(p.x, y, p.z); ctl().update(); C.lookAt(p.x, y, p.z);
}
// frames: array of functions run before each tile is drawn; returns a data URL of the sheet
export function sheet(frames, { w = 300, h = 420, cols = 8, label } = {}) {
  const rows = Math.ceil(frames.length / cols), out = document.createElement('canvas'); out.width = w * Math.min(cols, frames.length); out.height = h * rows;
  const g = out.getContext('2d');
  frames.forEach((f, i) => { const txt = f(); const cv = render(w, h); g.drawImage(cv, (i % cols) * w, Math.floor(i / cols) * h); if (txt || label) { g.fillStyle = '#3a1c0c'; g.font = '13px sans-serif'; g.fillText(txt || label, (i % cols) * w + 6, Math.floor(i / cols) * h + 16); } });
  return out.toDataURL('image/png');
}
export async function post(name, dataUrl) { await fetch('http://127.0.0.1:8794/' + name, { method: 'POST', body: dataUrl }); return name; }
// one gait cycle as a sheet: cmd(actor) starts the motion, 5 s settle, then n frames over one stride from a view
export async function cycle(name, cmd, off, n = 8, dist = 3.2, y = 0.75) {
  const A = window.__actor; A.reset({}); cmd(A); window.__step(1 / 60, 300); const T = A.T, fr = [];
  for (let i = 0; i < n; i++) fr.push(() => { if (i) window.__step(T / n / 4, 4); camAt(A, off, dist, y); return ((i * 360) / n | 0) + '°'; });
  return post(name, sheet(fr, { w: 260, h: 400, cols: 8 }));
}
export function view(bone, dx, dy, dz) { const A = window.__actor, h = A.jointWorld(bone), C = c(); C.position.set(h.x + dx, h.y + dy, h.z + dz); ctl().target.copy(h); ctl().update(); C.lookAt(h); }
export const ready = () => new Promise((res) => { const k = () => (window.__ready ? res() : setTimeout(k, 100)); k(); });
// Foot-slide and popping test. drive(actor, t) issues commands; returns the worst drift of a planted foot's contact
// point (heel while the toes are up, ball while the heel is up, the whole foot when flat) and the largest
// frame-to-frame rotation step of any driven bone.
export function slideTest(drive, seconds, dt = 1 / 60, start = {}) {
  const A = window.__actor, T = THREE, M = A.rig.M; A.reset(start);
  const segs = [], cur = { L: null, R: null }; let maxStep = 0, worst = null, prev = null, prevT = 0;
  const names = A.rig.names.filter((n) => !/Eye|jaw/.test(n));
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    drive(A, i * dt); A.update(dt);
    for (const S of ['L', 'R']) {
      const f = A.feet[S], p = S === 'L' ? 'left' : 'right', m = M[S], r = A.rig.rest[p + 'Foot'];
      const ft = A._feetBody[S];
      const mode = Math.abs(f.pitch) < 1e-4 ? 'flat' : f.pitch > 0 ? 'heel' : 'ball';
      const contact = r.clone().add(new T.Vector3(0, -m.ankleH, mode === 'ball' ? m.toeF : -m.heel));
      const w = A.root.worldToLocal(A.body.localToWorld(A.rig.carry(p + 'Foot', contact)));
      const on = f.planted && ft.p.y < m.ankleH + 0.2 * M.leg;
      if (on) {
        if (!cur[S] || cur[S].mode !== mode) { if (cur[S]) segs.push(cur[S]); cur[S] = { mode, start: w.clone(), max: 0, maxY: 0, n: 0, t: i * dt, S }; }
        const c = cur[S]; c.max = Math.max(c.max, Math.hypot(w.x - c.start.x, w.z - c.start.z)); c.maxY = Math.max(c.maxY, Math.abs(w.y - c.start.y)); c.n++;
      } else if (cur[S]) { segs.push(cur[S]); cur[S] = null; }
    }
    const qs = names.map((n) => A.rig.node[n].quaternion.clone());
    if (prev) qs.forEach((q, j) => { const a = 2 * Math.acos(Math.min(1, Math.abs(q.dot(prev[j])))); if (a > maxStep) { maxStep = a; worst = [names[j], +(i * dt).toFixed(2)]; } });
    prev = qs;
  }
  for (const S of ['L', 'R']) if (cur[S]) segs.push(cur[S]);
  const by = {}; for (const s of segs.filter((s) => s.n > 2)) { by[s.mode] = Math.max(by[s.mode] || 0, +(s.max * 1000).toFixed(3)); by[s.mode + 'Y'] = Math.max(by[s.mode + 'Y'] || 0, +(s.maxY * 1000).toFixed(3)); }
  return { bad: segs.filter((s) => s.max > 0.002).map((s) => [s.S, s.mode, +s.t.toFixed(2), +(s.max * 1000).toFixed(1), s.n]).slice(0, 8), segments: segs.length, driftMM: by, maxStepDeg: +(maxStep * 57.2958).toFixed(2), worst, maxOverMM: +(A.stats.maxOver * 1000).toFixed(2), end: { x: +A.x.toFixed(3), z: +A.z.toFixed(3), yaw: +A.yaw.toFixed(3), standing: A.frozen } };
}
// the standard locomotion scenario: walk, stop, turn on the spot, run, stop, turn round
export const scen = (A, t) => { const k = Math.round(t * 60), at = (x) => k === Math.round(x * 60); if (at(0.5)) A.walk(); if (at(3)) A.stop(); if (at(5)) A.turnTo(Math.PI / 2); if (at(8)) A.run(); if (at(11)) A.stop(); if (at(14)) A.turnTo(-Math.PI * 0.75); };
// lowest pelvis and the largest knee bend over a scenario (in metres / degrees)
export function extremes(sc, sec, start = {}) {
  const A = window.__actor; A.reset(start); let minY = 9, at = 0, maxStep = 0, stepAt = 0, prev = null;
  for (let i = 0; i < sec * 60; i++) {
    sc(A, i / 60); A.update(1 / 60); if (A.rig.hipsPos.y < minY) { minY = A.rig.hipsPos.y; at = i / 60; }
    const q = ['leftLowerLeg', 'rightLowerLeg', 'leftUpperLeg', 'rightUpperLeg'].map((n) => A.rig.node[n].quaternion.clone());
    if (prev) q.forEach((x, j) => { const a = 2 * Math.acos(Math.min(1, Math.abs(x.dot(prev[j])))) * 57.3; if (a > maxStep) { maxStep = a; stepAt = i / 60; } });
    prev = q;
  }
  return { minHipY: +minY.toFixed(3), restHipY: +A.rig.M.hipsY.toFixed(3), at: +at.toFixed(2), maxLegStepDeg: +maxStep.toFixed(1), stepAt: +stepAt.toFixed(2) };
}
// actions as a sheet: for each name, frames at the given times (seconds into the action; 'end' = after it finished)
export async function actSheet(file, names, { off = 0.6, times = [0.25, 0.5, 0.9, 1.4, 'end'], dist = 3.6, y = 0.85, walk = false, w = 200, h = 300 } = {}) {
  const A = window.__actor, ACT = (await import('../actions.js')).ACTIONS, fr = [];
  for (const n of names) times.forEach((t, j) => fr.push(() => {
    if (j === 0) { A.reset({}); if (walk) { A.walk(); window.__step(1 / 60, 150); } else window.__step(1 / 60, 20); A.play(n); A._t0 = 0; }
    const tt = t === 'end' ? ACT[n].dur + 0.5 : t; window.__step(1 / 60, Math.max(0, Math.round((tt - A._t0) * 60))); A._t0 = tt;
    camAt(A, off, dist * A.rig.M.leg / 0.768, y * A.rig.M.leg / 0.768); return n + ' ' + (t === 'end' ? 'end' : t + 's');
  }));
  return post(file, sheet(fr, { w, h, cols: times.length * 2 }));
}
