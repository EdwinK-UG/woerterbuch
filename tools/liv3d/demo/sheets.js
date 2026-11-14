// Contact sheets from the demo page, for checking motion without waiting for animation frames. Load it in the page's console:
//   await import('./sheets.js')
// then  await __seq(name, setup, view, cols, rows, framesPerCell, warmFrames)   one motion over time
//       await __grid(name, [{label, fn, n, view}], view, cols, rows)             one cell per item, whole body
//       await __faces(name, [{label, fn, n}], cols, rows)                        one cell per item, head close-up
// Each writes a PNG through the shot server (tools/liv3d/demo/shot_server.py) when it runs, and shows it over the page.
const a = window.__actor, R = window.__renderer, cam = window.__camera, ctl = window.__controls, T = window.__THREE;
const vrm = a.vrm || a.rig.vrm;
const W = 1600; let Hh = 1600;
window.__board = (h) => { Hh = h; };                      // board height in px (width is 1600)
function board() {
  let ov = document.getElementById('ov');
  if (!ov) { ov = document.createElement('canvas'); ov.id = 'ov'; ov.style.cssText = 'position:fixed;left:0;top:0;z-index:99;width:100vmin;height:100vmin'; document.body.appendChild(ov); }
  ov.width = W; ov.height = Hh; const g = ov.getContext('2d'); g.fillStyle = '#f3e9d8'; g.fillRect(0, 0, W, Hh); return [ov, g];
}
function fit(w, h) { R.setPixelRatio(1); R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
function bodyCam(view, back) {
  // the whole figure, feet to hair: aim at mid height and stand far enough back for the cell's shape
  window.__cam(view); const t = ctl.target, p = cam.position, top = new T.Vector3(); vrm.humanoid.getNormalizedBoneNode('head').getWorldPosition(top);
  const h = top.y + 0.22, ap = a.position || a.root.position, mid = new T.Vector3(ap.x, h * 0.5, ap.z), dir = new T.Vector3(p.x - t.x, 0, p.z - t.z).normalize();
  const d = (h * 0.5 / Math.tan(cam.fov * Math.PI / 360)) * 1.12 * (back || 1) * Math.max(1, 0.62 / cam.aspect);
  cam.position.set(mid.x + dir.x * d, mid.y + 0.12 * d, mid.z + dir.z * d); cam.lookAt(mid);
}
const still = () => { if (a.face) a.face.blinkAt = 1e9; };      // no blink caught in a still
function headCam(dist, yawOff) {
  const hp = new T.Vector3(); vrm.humanoid.getNormalizedBoneNode('head').getWorldPosition(hp); hp.y += 0.09;
  const yaw = (a.yaw || 0) + yawOff; cam.position.set(hp.x + Math.sin(yaw) * dist, hp.y + 0.03, hp.z + Math.cos(yaw) * dist); cam.lookAt(hp);
}
function label(g, s, x, y) { g.fillStyle = '#4c4038'; g.font = '26px system-ui'; g.fillText(s, x + 12, y + 32); }
async function save(ov, name) {
  const blob = await new Promise((r) => ov.toBlob(r, 'image/png'));
  try { await fetch('/save?name=' + encodeURIComponent(name + '.png'), { method: 'POST', body: blob }); } catch (e) { return 'not saved: ' + e.message; }
  return name + '.png';
}
window.__seq = async (name, setup, view = 'side', cols = 4, rows = 2, per = 4, warm = 120, back = 1) => {
  const [ov, g] = board(), cw = W / cols, ch = Hh / rows; fit(cw, ch);
  a.reset(); still(); setup(a); window.__step(1 / 60, warm);
  for (let k = 0; k < cols * rows; k++) { window.__step(1 / 60, per); bodyCam(view, back); window.__render(); g.drawImage(R.domElement, (k % cols) * cw, Math.floor(k / cols) * ch, cw, ch); }
  return save(ov, name);
};
window.__grid = async (name, items, view = 'tq', cols = 4, rows = 2, back = 1) => {
  const [ov, g] = board(), cw = W / cols, ch = Hh / rows; fit(cw, ch); const errs = [];
  items.forEach((it, k) => { try {
    a.reset(); still(); a.attachSatchel(it.satchel !== false); window.__step(1 / 60, 30); it.fn(a); window.__step(1 / 60, it.n || 60); bodyCam(it.view || view, it.back || back); window.__render();
    g.drawImage(R.domElement, (k % cols) * cw, Math.floor(k / cols) * ch, cw, ch); label(g, it.label, (k % cols) * cw, Math.floor(k / cols) * ch);
  } catch (e) { errs.push(it.label + ': ' + e.message); } });
  return [await save(ov, name), errs];
};
window.__faces = async (name, items, cols = 4, rows = 2, dist = 1.05, yawOff = 0.3) => {
  const [ov, g] = board(), cw = W / cols, ch = Hh / rows; fit(cw, ch); const errs = [];
  items.forEach((it, k) => { try {
    a.reset(); still(); window.__step(1 / 60, 20); it.fn(a); window.__step(1 / 60, it.n || 50); headCam(it.dist || dist, it.yaw == null ? yawOff : it.yaw); window.__render();
    g.drawImage(R.domElement, (k % cols) * cw, Math.floor(k / cols) * ch, cw, ch); label(g, it.label, (k % cols) * cw, Math.floor(k / cols) * ch);
  } catch (e) { errs.push(it.label + ': ' + e.message); } });
  return [await save(ov, name), errs];
};
