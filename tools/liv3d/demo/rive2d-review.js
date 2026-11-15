// Review sheets for the 2D cast, taken from the Rive runtime in rive2d.html (served by shot_server.py):
//   await import('./rive2d-review.js'); await __rvAll(['A04'], ['3q', 'front', 'back'])
// Plays every gesture, gait, held state, face, talking and the mirror, and saves one strip per view as
// rv_<id>_<view>.jpg through the shot server (POST /save).
window.__strip2d = async (name, steps) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)), cv = document.getElementById('c');
  const W = cv.width / 3, H = cv.height / 3, cells = [];
  for (const s of steps) { if (s.do) await s.do(); await sleep(s.wait || 0); if (s.skip) continue; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = '#f3e9d8'; g.fillRect(0, 0, W, H); g.drawImage(cv, 0, 0, W, H); if (s.label) { g.fillStyle = '#3a1c0c'; g.font = '13px system-ui'; g.fillText(s.label, 6, 16); } cells.push(c); }
  const cols = 12, rows = Math.ceil(cells.length / cols), out = document.createElement('canvas'); out.width = W * cols; out.height = H * rows; const g = out.getContext('2d'); g.fillStyle = '#f3e9d8'; g.fillRect(0, 0, out.width, out.height);
  cells.forEach((c, i) => g.drawImage(c, (i % cols) * W, Math.floor(i / cols) * H));
  const b = await new Promise((r) => out.toBlob(r, 'image/jpeg', 0.85)); await fetch('/save?name=' + name + '.jpg', { method: 'POST', body: b });
};
window.__review = async (id, v) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await window.__open(id, v); for (let i = 0; i < 100 && !window.__ready; i++) await sleep(100); await sleep(3600);   // the free plan's splash (2.4 s) and a slow first frame
  const vm = () => window.__vm, T = (n) => ({ do: () => vm().trigger(n).trigger(), wait: 0, skip: true }), w = (ms, label) => ({ wait: ms, label });
  const B = (k, val) => ({ do: () => { vm().boolean(k).value = val; }, wait: 0, skip: true }), F = (f) => ({ do: () => { vm().enum('face').value = f; }, wait: 160, label: f });
  const steps = [w(50, 'idle'),
    T('wave'), w(600, 'wave'), w(500), w(2300), T('point'), w(900, 'point'), w(1900), T('cheer'), w(450, 'cheer'), w(450), w(2300),
    T('think'), w(1300, 'think'), w(2500), T('clap'), w(500, 'clap'), w(130), w(2500), T('pull'), w(700, 'pull'), w(800), w(600), w(1900),
    B('walking', true), w(500, 'walk'), w(180), w(180), B('walking', false), w(500), B('running', true), w(450, 'run'), w(130), w(130), B('running', false), w(600),
    B('sitting', true), w(700, 'sit down'), w(1200, 'sitting'), B('sitting', false), w(600, 'stand up'), w(900),
    B('holding', true), w(800, 'pick up'), w(1400, 'holding'), B('holding', false), w(700, 'put down'), w(1600),
    F('smile'), F('laugh'), F('surprised'), F('sad'), F('happy'), B('talking', true), w(150, 'talk'), w(130), B('talking', false), w(100),
    B('facingLeft', true), B('walking', true), w(500, 'left walk'), B('walking', false), B('facingLeft', false), w(300)];
  await window.__strip2d(`rv_${id.toLowerCase()}_${v}`, steps); return 'ok';
};
window.__rvAll = async (ids, views) => { window.__rvdone = []; for (const id of ids) for (const v of views) { await window.__review(id, v); window.__rvdone.push(id + ' ' + v); } };
