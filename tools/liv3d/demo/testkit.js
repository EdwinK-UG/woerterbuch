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
