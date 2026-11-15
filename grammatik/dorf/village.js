/* The village for "Im Dorf" (A1 · Kapitel 1): drawn with Canvas 2D, no image files, so it is on screen at once.
   World units are metres. The camera has an x position (metres) and a zoom (pixels per metre); far layers move
   slower (parallax). What never moves is drawn once into two cached layers per camera position: the part behind
   the stream, and the part in front of it. The stream, the waterfall, the clouds and the lamb are drawn every frame.
   Original design: an alpine meadow village, wooden houses, a stream with a bridge, a bakery stall. */

const TAU = Math.PI * 2;
export const PLACES = { house: -5.4, bench: -3.4, pen: -7.4, bridge: 1.55, bakery: 7.2, school: 11 };
export const BRIDGE = { x: PLACES.bridge, half: 0.95, rise: 0.16 };

// seeded random, so the village looks the same every time
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function createVillage(bg, fg) {
  const V = { W: 1, H: 1, dpr: 1, cam: { x: 0, z: 100 }, gy: 0, hz: 0, cacheKey: '', A: document.createElement('canvas'), B: document.createElement('canvas'), lambHop: 0 };
  const r = rng(7);
  const peaks = Array.from({ length: 34 }, (_, i) => ({ x: -34 + i * 2.0 + r() * 1.0, h: 0.75 + r() * 0.75, w: 1.3 + r() * 0.9, snow: r() > 0.2 }));
  const ridges = Array.from({ length: 30 }, (_, i) => ({ x: -26 + i * 1.9 + r() * 0.8, h: 0.7 + r() * 0.7 }));
  const pines = Array.from({ length: 70 }, () => ({ x: -26 + r() * 54, y: 0.15 + r() * 0.55, s: 0.6 + r() * 0.5 }));
  const chalets = Array.from({ length: 9 }, (_, i) => ({ x: -16 + i * 3.6 + r() * 1.2, s: 0.75 + r() * 0.35, roof: ['#8a4b2e', '#7a3f27', '#94553a'][i % 3], wall: ['#f3e2c3', '#efd9b4', '#f6e8cf'][i % 3] }));
  const trees = [-9.6, -2.1, 3.9, 5.2, 9.3, 12.8].map((x, i) => ({ x, s: 0.85 + (i % 3) * 0.12 }));
  const flowers = Array.from({ length: 120 }, () => ({ x: -14 + r() * 32, d: r(), c: ['#f6d84a', '#ffffff', '#e88fb4', '#b48be6', '#f39c5a'][Math.floor(r() * 5)] }));
  const tufts = Array.from({ length: 90 }, () => ({ x: -14 + r() * 32, d: r(), h: 0.06 + r() * 0.08 }));
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: -20 + i * 7 + r() * 3, y: 0.55 + r() * 0.35, s: 0.7 + r() * 0.6, v: 0.05 + r() * 0.05 }));
  const ripples = Array.from({ length: 70 }, () => ({ u: r(), v: r() * 1.6 - 0.8, l: 0.05 + r() * 0.08, sp: 0.85 + r() * 0.3 }));
  const sparks = Array.from({ length: 26 }, () => ({ u: r(), v: r() * 1.4 - 0.7, ph: r() * TAU }));

  // screen position of a world point on a layer with parallax p (1 = the ground the people walk on)
  const X = (wx, p = 1) => V.W / 2 + (wx - V.cam.x * p) * V.cam.z;
  const m = (v) => v * V.cam.z;                                  // metres to pixels
  // the meadow has depth: d = 0 is the path, d < 0 behind it (toward the horizon), d > 0 in front (toward the viewer)
  const Yd = (d) => d >= 0 ? V.gy + m(d) * 0.55 : V.gy + (V.gy - V.hz) * Math.max(-1, d / 2.6) * 1;
  // the stream: u = 0 where it comes out of the meadow behind the path, u = 1 at the bottom edge of the picture
  const streamD = (u) => -1.55 + 2.4 * u;
  const streamC = (u) => BRIDGE.x - 0.55 + 0.75 * u + 0.18 * Math.sin(u * 4.2 + 0.6);
  const streamW = (u) => 0.18 + 0.9 * Math.pow(u, 1.1);

  function size(W, H, dpr) {
    V.W = W; V.H = H; V.dpr = dpr; V.cacheKey = '';
    for (const c of [bg, fg]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  }
  function setCam(x, z) {
    V.cam.x = x; V.cam.z = z; V.gy = V.H * 0.8; V.hz = V.gy - m(1.05);
  }

  /* ---------- the parts ---------- */
  function sky(c) {
    const g = c.createLinearGradient(0, 0, 0, V.hz); g.addColorStop(0, '#8fc3ea'); g.addColorStop(0.7, '#cfe7f5'); g.addColorStop(1, '#eef6ee');
    c.fillStyle = g; c.fillRect(0, 0, V.W, V.hz + 2);
    const sx = X(5, 0.04), sy = V.hz - m(1.35); const sg = c.createRadialGradient(sx, sy, 0, sx, sy, m(0.9));
    sg.addColorStop(0, 'rgba(255,248,214,.95)'); sg.addColorStop(0.25, 'rgba(255,242,190,.6)'); sg.addColorStop(1, 'rgba(255,242,190,0)'); c.fillStyle = sg; c.fillRect(sx - m(1), sy - m(1), m(2), m(2));
  }
  function mountains(c) {
    const p = 0.12, base = V.hz + m(0.05);
    for (const [k, col] of [[0, '#a9bed2'], [1, '#93abc3']]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, base);
      for (const pk of peaks) { if ((Math.round(pk.x * 10) & 1) !== k) continue; const x = X(pk.x, p), w = m(pk.w), h = m(pk.h * (k ? 0.85 : 1)); if (x + w < -50 || x - w > V.W + 50) continue;
        c.lineTo(x - w, base); c.lineTo(x - w * 0.18, base - h * 0.86); c.lineTo(x, base - h); c.lineTo(x + w * 0.24, base - h * 0.82); c.lineTo(x + w, base); }
      c.lineTo(V.W, base); c.closePath(); c.fill();
      for (const pk of peaks) { if (!pk.snow || (Math.round(pk.x * 10) & 1) !== k) continue; const x = X(pk.x, p), w = m(pk.w), h = m(pk.h * (k ? 0.85 : 1)); if (x + w < -50 || x - w > V.W + 50) continue;
        c.fillStyle = '#f7fbff'; c.beginPath(); c.moveTo(x - w * 0.18 - w * 0.06, base - h * 0.8); c.lineTo(x - w * 0.18, base - h * 0.86); c.lineTo(x, base - h); c.lineTo(x + w * 0.24, base - h * 0.82); c.lineTo(x + w * 0.3, base - h * 0.74);
        c.lineTo(x + w * 0.14, base - h * 0.78); c.lineTo(x + w * 0.04, base - h * 0.7); c.lineTo(x - w * 0.08, base - h * 0.79); c.closePath(); c.fill(); }
    }
  }
  function hills(c) {
    const p = 0.32, base = V.hz + m(0.12);
    c.fillStyle = '#7fae62'; c.beginPath(); c.moveTo(0, V.H);
    for (let x = -2; x <= V.W + 12; x += 10) { const wx = (x - V.W / 2) / V.cam.z + V.cam.x * p; c.lineTo(x, base - m(0.55 + 0.32 * Math.sin(wx * 0.55) + 0.18 * Math.sin(wx * 1.3 + 1))); }
    c.lineTo(V.W, V.H); c.closePath(); c.fill();
    // the cliff the waterfall comes down
    const fx = X(3.2, p); c.fillStyle = '#8c8f86'; c.beginPath(); c.moveTo(fx - m(0.35), base - m(0.25)); c.lineTo(fx - m(0.22), base - m(1.25)); c.lineTo(fx + m(0.2), base - m(1.32)); c.lineTo(fx + m(0.38), base - m(0.2)); c.closePath(); c.fill();
    for (const t of pines) { const x = X(t.x, p); if (x < -20 || x > V.W + 20) continue; const wx = t.x, y = base - m(0.55 + 0.32 * Math.sin(wx * 0.55) + 0.18 * Math.sin(wx * 1.3 + 1)) + m(t.y * 0.5), h = m(0.42 * t.s);
      c.fillStyle = '#3f6e45'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - h * 0.32, y); c.lineTo(x + h * 0.32, y); c.closePath(); c.fill(); }
  }
  function village(c) {
    const p = 0.62, base = V.hz + m(0.3);
    c.fillStyle = '#96c86d'; c.fillRect(0, V.hz + m(0.18), V.W, V.H);
    for (const h of chalets) { const x = X(h.x, p); if (x < -80 || x > V.W + 80) continue; house(c, x, base + m(0.08 * Math.sin(h.x)), m(0.55 * h.s), h.wall, h.roof, false); }
    // the church
    const cx = X(4.6, p), cb = base + m(0.02); c.fillStyle = '#f4ead8'; c.fillRect(cx - m(0.16), cb - m(1.05), m(0.32), m(1.05)); c.fillRect(cx + m(0.16), cb - m(0.5), m(0.6), m(0.5));
    c.fillStyle = '#7a3f27'; c.beginPath(); c.moveTo(cx + m(0.12), cb - m(0.5)); c.lineTo(cx + m(0.46), cb - m(0.78)); c.lineTo(cx + m(0.8), cb - m(0.5)); c.closePath(); c.fill();
    c.fillStyle = '#5d7d4f'; c.beginPath(); c.ellipse(cx, cb - m(1.12), m(0.13), m(0.14), 0, 0, TAU); c.fill(); c.fillRect(cx - m(0.01), cb - m(1.38), m(0.02), m(0.14));
    c.fillStyle = '#3a3a3a'; c.beginPath(); c.arc(cx, cb - m(0.82), m(0.06), 0, TAU); c.fill();
  }
  function house(c, x, base, s, wall, roof, big) {   // a wooden chalet, s = width in pixels
    const w = s, h = s * 0.62;
    c.fillStyle = wall; c.fillRect(x - w / 2, base - h, w, h);
    c.fillStyle = '#b07a4a'; c.fillRect(x - w / 2, base - h, w, h * 0.42);              // the upper storey in wood
    c.strokeStyle = 'rgba(90,50,25,.35)'; c.lineWidth = Math.max(1, s * 0.012); for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(x - w / 2, base - h + h * 0.07 * i); c.lineTo(x + w / 2, base - h + h * 0.07 * i); c.stroke(); }
    c.fillStyle = roof; c.beginPath(); c.moveTo(x - w * 0.62, base - h + s * 0.02); c.lineTo(x, base - h - s * 0.36); c.lineTo(x + w * 0.62, base - h + s * 0.02); c.closePath(); c.fill();
    c.fillStyle = '#e9e2d0'; c.fillRect(x - w * 0.62, base - h - s * 0.005, w * 1.24, s * 0.025);
    const win = (wx, wy) => { c.fillStyle = '#5b3a24'; c.fillRect(wx - s * 0.075, wy - s * 0.07, s * 0.15, s * 0.14); c.fillStyle = '#cfe6f1'; c.fillRect(wx - s * 0.06, wy - s * 0.055, s * 0.12, s * 0.11);
      if (big) { c.fillStyle = '#8a4b2e'; c.fillRect(wx - s * 0.08, wy + s * 0.07, s * 0.16, s * 0.035); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#e2384d' : '#f27a8a'; c.beginPath(); c.arc(wx - s * 0.055 + i * s * 0.037, wy + s * 0.065, s * 0.02, 0, TAU); c.fill(); } } };
    win(x - w * 0.25, base - h * 0.78); win(x + w * 0.25, base - h * 0.78); win(x + w * 0.27, base - h * 0.3);
    c.fillStyle = '#6b4228'; c.fillRect(x - w * 0.3 - s * 0.07, base - h * 0.48, s * 0.14, h * 0.48);
  }
  function meadow(c) {
    const g = c.createLinearGradient(0, V.hz, 0, V.H); g.addColorStop(0, '#a6d277'); g.addColorStop(0.45, '#93c862'); g.addColorStop(1, '#79b64e');
    c.fillStyle = g; c.fillRect(0, V.hz + m(0.3), V.W, V.H);
    for (const f of flowers) { const x = X(f.x); if (x < -5 || x > V.W + 5) continue; const d = -1.4 + f.d * 2.3, y = Yd(d); if (Math.abs(d) < 0.25) continue;
      const rr = Math.max(1.2, m(0.018) * (0.6 + 0.5 * (d + 1.4) / 2.3)); c.fillStyle = f.c; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); }
  }
  function path(c) {
    const y0 = Yd(-0.16), y1 = Yd(0.2);
    c.fillStyle = '#e4d1a2'; c.fillRect(0, y0, V.W, y1 - y0);
    c.fillStyle = 'rgba(160,125,70,.18)'; for (let i = 0; i < 60; i++) { const wx = Math.floor(V.cam.x - 10) + i * 0.37, x = X(wx); if (x < -4 || x > V.W + 4) continue; c.beginPath(); c.ellipse(x, y0 + (y1 - y0) * ((i * 0.37) % 1), m(0.03), m(0.012), 0, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(120,150,70,.55)'; c.lineWidth = Math.max(1, m(0.012)); for (const y of [y0, y1]) { c.beginPath(); c.moveTo(0, y); c.lineTo(V.W, y); c.stroke(); }
  }
  function tree(c, x, base, s) {
    c.fillStyle = '#7a5434'; c.fillRect(x - m(0.06) * s, base - m(1.1) * s, m(0.12) * s, m(1.1) * s);
    for (const [dx, dy, rr, col] of [[-0.32, -1.25, 0.42, '#4e8a3c'], [0.3, -1.3, 0.44, '#4e8a3c'], [0, -1.62, 0.52, '#5c9a45'], [-0.12, -1.35, 0.36, '#6aa84f']]) {
      c.fillStyle = col; c.beginPath(); c.arc(x + m(dx) * s, base + m(dy) * s, m(rr) * s, 0, TAU); c.fill(); }
  }
  function bench(c) {
    const x = X(PLACES.bench), y = Yd(-0.32);
    c.fillStyle = '#8a5a35'; c.fillRect(x - m(0.55), y - m(0.42), m(1.1), m(0.07)); c.fillRect(x - m(0.55), y - m(0.7), m(1.1), m(0.06)); c.fillRect(x - m(0.55), y - m(0.58), m(1.1), m(0.05));
    c.fillStyle = '#6b4228'; for (const dx of [-0.48, 0.44]) c.fillRect(x + m(dx), y - m(0.42), m(0.06), m(0.42));
  }
  function pen(c) {        // the lamb's little fenced meadow
    const x = X(PLACES.pen), y = Yd(-0.45);
    c.strokeStyle = '#8a5a35'; c.lineWidth = Math.max(2, m(0.035)); c.lineCap = 'round';
    for (let i = 0; i <= 6; i++) { const px = x - m(1.1) + i * m(0.37); c.beginPath(); c.moveTo(px, y); c.lineTo(px, y - m(0.42)); c.stroke(); }
    for (const h of [0.14, 0.32]) { c.beginPath(); c.moveTo(x - m(1.12), y - m(h)); c.lineTo(x + m(1.12), y - m(h)); c.stroke(); }
  }
  function bakery(c, front) {   // the stall: roof and back wall behind Frau Huber; the counter is drawn in front (fg)
    const x = X(PLACES.bakery), y = Yd(-0.5), w = m(1.7);
    if (!front) {
      c.fillStyle = '#d9b07a'; c.fillRect(x - w / 2, y - m(1.9), w, m(1.9));
      c.fillStyle = '#c99a62'; for (let i = 0; i < 6; i++) c.fillRect(x - w / 2 + i * w / 6, y - m(1.9), m(0.012), m(1.9));
      c.fillStyle = '#7a4a2a'; c.fillRect(x - w / 2 - m(0.08), y - m(2.0), m(0.08), m(2.0)); c.fillRect(x + w / 2, y - m(2.0), m(0.08), m(2.0));
      for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#fdf7ec' : '#d2453b'; c.beginPath(); c.moveTo(x - w / 2 - m(0.12) + i * (w + m(0.24)) / 7, y - m(2.05)); c.lineTo(x - w / 2 - m(0.12) + (i + 1) * (w + m(0.24)) / 7, y - m(2.05)); c.lineTo(x - w / 2 - m(0.12) + (i + 1) * (w + m(0.24)) / 7, y - m(1.84)); c.arc(x - w / 2 - m(0.12) + (i + 0.5) * (w + m(0.24)) / 7, y - m(1.84), (w + m(0.24)) / 14, 0, Math.PI); c.closePath(); c.fill(); }
      c.fillStyle = '#fdf7ec'; c.fillRect(x - m(0.5), y - m(2.38), m(1.0), m(0.28)); c.strokeStyle = '#7a4a2a'; c.lineWidth = Math.max(1, m(0.015)); c.strokeRect(x - m(0.5), y - m(2.38), m(1.0), m(0.28));
      c.fillStyle = '#7a4a2a'; c.font = `600 ${Math.max(8, m(0.15))}px Fraunces, Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Bäckerei', x, y - m(2.24));
      // shelves with bread
      c.fillStyle = '#8a5a35'; c.fillRect(x - w / 2 + m(0.1), y - m(1.45), w - m(0.2), m(0.04));
      for (let i = 0; i < 5; i++) loaf(c, x - w / 2 + m(0.3) + i * m(0.28), y - m(1.5), m(0.12));
    } else {
      const yy = Yd(-0.18);
      c.fillStyle = '#a8733f'; c.fillRect(x - w / 2 - m(0.05), yy - m(0.95), w + m(0.1), m(0.95)); c.fillStyle = '#8a5a35'; c.fillRect(x - w / 2 - m(0.1), yy - m(1.0), w + m(0.2), m(0.08));
      c.strokeStyle = 'rgba(60,35,15,.3)'; c.lineWidth = Math.max(1, m(0.012)); for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x - w / 2, yy - m(0.95) + i * m(0.19)); c.lineTo(x + w / 2, yy - m(0.95) + i * m(0.19)); c.stroke(); }
      for (let i = 0; i < 4; i++) loaf(c, x - w / 2 + m(0.3) + i * m(0.38), yy - m(1.03), m(0.15));
      c.fillStyle = '#e8c27a'; c.beginPath(); c.ellipse(x + w / 2 - m(0.25), yy - m(1.06), m(0.16), m(0.06), 0, 0, TAU); c.fill();
    }
  }
  function loaf(c, x, y, s) { c.fillStyle = '#c98a45'; c.beginPath(); c.ellipse(x, y, s, s * 0.55, 0, Math.PI, 0); c.fill(); c.strokeStyle = '#f2d39b'; c.lineWidth = Math.max(1, s * 0.12); for (const d of [-0.4, 0, 0.4]) { c.beginPath(); c.moveTo(x + d * s - s * 0.12, y - s * 0.38); c.lineTo(x + d * s + s * 0.12, y - s * 0.16); c.stroke(); } }
  function bridge(c, part) {   // 'back': deck and back rail (behind the people); 'front': the front rail
    const x0 = X(BRIDGE.x - BRIDGE.half), x1 = X(BRIDGE.x + BRIDGE.half), y = (dd) => Yd(dd);
    const arch = (x, dd) => y(dd) - m(BRIDGE.rise) * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - x0) / (x1 - x0))));
    if (part === 'back') {
      c.fillStyle = '#9b6a3e'; c.beginPath(); c.moveTo(x0, y(-0.2)); for (let x = x0; x <= x1; x += 4) c.lineTo(x, arch(x, -0.2)); c.lineTo(x1, y(0.22)); for (let x = x1; x >= x0; x -= 4) c.lineTo(x, arch(x, 0.22)); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,40,20,.35)'; c.lineWidth = Math.max(1, m(0.01)); for (let x = x0 + m(0.1); x < x1; x += m(0.12)) { c.beginPath(); c.moveTo(x, arch(x, -0.2)); c.lineTo(x, arch(x, 0.22)); c.stroke(); }
      rail(c, x0, x1, (x) => arch(x, -0.2));
    } else rail(c, x0, x1, (x) => arch(x, 0.22) + m(0.02));
  }
  function rail(c, x0, x1, yf) {
    c.strokeStyle = '#7a4a2a'; c.lineWidth = Math.max(2, m(0.035)); c.lineCap = 'round';
    for (let i = 0; i <= 6; i++) { const x = x0 + (x1 - x0) * i / 6; c.beginPath(); c.moveTo(x, yf(x)); c.lineTo(x, yf(x) - m(0.42)); c.stroke(); }
    c.beginPath(); for (let x = x0; x <= x1; x += 4) c.lineTo(x, yf(x) - m(0.42)); c.stroke();
    c.lineWidth = Math.max(1.5, m(0.022)); c.beginPath(); for (let x = x0; x <= x1; x += 4) c.lineTo(x, yf(x) - m(0.22)); c.stroke();
  }

  /* ---------- the moving parts ---------- */
  function stream(c, t) {
    const N = 40, L = [], R = [];
    for (let i = 0; i <= N; i++) { const u = i / N, d = streamD(u), cx = X(streamC(u)), w = m(streamW(u)), y = Yd(d); L.push([cx - w / 2, y]); R.push([cx + w / 2, y]); }
    const top = L[0][1];
    const g = c.createLinearGradient(0, top, 0, V.H); g.addColorStop(0, '#9fd3ea'); g.addColorStop(1, '#4f9ccc');
    c.fillStyle = '#7da35a'; c.beginPath(); L.forEach(([x, y], i) => (i ? c.lineTo(x - m(0.05), y) : c.moveTo(x - m(0.05), y))); R.slice().reverse().forEach(([x, y]) => c.lineTo(x + m(0.05), y)); c.closePath(); c.fill();   // banks
    c.fillStyle = g; c.beginPath(); L.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); R.slice().reverse().forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); c.fill();
    c.save(); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineCap = 'round';
    for (const rp of ripples) {          // light ripples carried down the stream
      const u = (rp.u + t * 0.09 * rp.sp) % 1, d = streamD(u), y = Yd(d), w = m(streamW(u)), x = X(streamC(u)) + rp.v * w * 0.45, len = m(rp.l) * (0.4 + u), a = Math.sin(Math.PI * u);
      c.globalAlpha = 0.25 + 0.5 * a; c.lineWidth = Math.max(1, m(0.012) * (0.5 + u)); c.beginPath(); c.moveTo(x - len, y - len * 0.25); c.quadraticCurveTo(x, y + len * 0.2, x + len, y - len * 0.25); c.stroke();
    }
    c.fillStyle = '#ffffff';
    for (const sp of sparks) { const u = (sp.u + t * 0.07) % 1, y = Yd(streamD(u)), w = m(streamW(u)), x = X(streamC(u)) + sp.v * w * 0.4, a = Math.max(0, Math.sin(t * 3 + sp.ph)); c.globalAlpha = a * 0.9; c.beginPath(); c.arc(x, y, Math.max(1, m(0.012) * (0.6 + u)), 0, TAU); c.fill(); }
    c.restore(); c.globalAlpha = 1;
    // stones on the banks
    c.fillStyle = '#a9a69a'; for (const [u, s] of [[0.32, -1], [0.55, 1], [0.78, -1], [0.9, 1]]) { const w = m(streamW(u)), x = X(streamC(u)) + s * w * 0.52, y = Yd(streamD(u)); c.beginPath(); c.ellipse(x, y, m(0.07) * (0.6 + u), m(0.04) * (0.6 + u), 0, 0, TAU); c.fill(); }
  }
  function waterfall(c, t) {
    const p = 0.32, fx = X(3.2, p), base = V.hz + m(0.12), top = base - m(1.25), bot = base - m(0.22);
    c.fillStyle = '#cfe9f5'; c.fillRect(fx - m(0.07), top, m(0.14), bot - top);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1, m(0.012));
    for (let i = 0; i < 6; i++) { const ph = ((t * 0.9 + i / 6) % 1), y = top + (bot - top) * ph; c.beginPath(); c.moveTo(fx - m(0.05) + i * m(0.02), y); c.lineTo(fx - m(0.05) + i * m(0.02), y + m(0.14)); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 4; i++) { const k = (t * 1.3 + i * 0.25) % 1; c.globalAlpha = 1 - k; c.beginPath(); c.arc(fx + (i - 1.5) * m(0.06), bot - m(0.02) - k * m(0.08), m(0.03) * (0.6 + k), 0, TAU); c.fill(); } c.globalAlpha = 1;
  }
  function cloudsDraw(c, t) {
    c.fillStyle = 'rgba(255,255,255,.92)';
    for (const cl of clouds) { const wx = ((cl.x + t * cl.v + 30) % 60) - 30, x = X(wx, 0.06), y = V.hz - m(0.95 + cl.y * 0.75), s = m(0.16 * cl.s); if (x < -s * 4 || x > V.W + s * 4) continue;
      c.beginPath(); c.arc(x, y, s, 0, TAU); c.arc(x + s * 0.9, y + s * 0.15, s * 0.8, 0, TAU); c.arc(x - s * 0.9, y + s * 0.2, s * 0.7, 0, TAU); c.arc(x + s * 0.2, y - s * 0.45, s * 0.7, 0, TAU); c.fill(); }
  }
  // the lamb: a fluffy white body, dark face and legs; it breathes, and hops when it bleats
  function lamb(c, t) {
    const x = X(PLACES.pen + 0.1), y0 = Yd(-0.35), hop = V.lambHop > 0 ? Math.sin(Math.PI * Math.min(1, V.lambHop)) * m(0.08) : 0, y = y0 - hop, s = m(0.36), br = 1 + 0.02 * Math.sin(t * 2.4);
    c.fillStyle = '#4a3b33'; for (const dx of [-0.3, -0.12, 0.12, 0.3]) c.fillRect(x + dx * s - s * 0.04, y - s * 0.42, s * 0.08, s * 0.42 - (hop ? 0 : 0));
    c.fillStyle = '#fbfaf5'; for (const [dx, dy, rr] of [[0, -0.62, 0.42], [-0.32, -0.6, 0.3], [0.3, -0.62, 0.3], [-0.12, -0.86, 0.28], [0.16, -0.84, 0.28], [0, -0.45, 0.32]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s * br, rr * s, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(160,150,130,.35)'; c.lineWidth = Math.max(1, s * 0.02); c.beginPath(); c.arc(x, y - 0.62 * s, 0.44 * s, 0.2, Math.PI - 0.2); c.stroke();
    c.fillStyle = '#4a3b33'; c.beginPath(); c.ellipse(x + s * 0.5, y - s * 0.78, s * 0.17, s * 0.22, -0.4, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x + s * 0.4, y - s * 0.93, s * 0.12, s * 0.05, -0.6, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + s * 0.64, y - s * 0.92, s * 0.1, s * 0.05, 0.6, 0, TAU); c.fill();
    c.fillStyle = '#fbfaf5'; c.beginPath(); c.arc(x + s * 0.47, y - s * 0.95, s * 0.12, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + s * 0.55, y - s * 0.82, s * 0.035, 0, TAU); c.fill();
  }
  function grassFront(c) {
    c.strokeStyle = '#5f9c3e'; c.lineCap = 'round';
    for (const g of tufts) { const x = X(g.x), d = 0.35 + g.d * 0.9, y = Yd(d); if (x < -10 || x > V.W + 10 || y > V.H + 4) continue; if (Math.abs(g.x - streamC((d + 1.55) / 2.4)) < streamW((d + 1.55) / 2.4) * 0.6) continue;
      c.lineWidth = Math.max(1, m(0.012)); const h = m(g.h) * (0.8 + d * 0.4); c.beginPath(); c.moveTo(x - h * 0.3, y - h); c.quadraticCurveTo(x - h * 0.1, y - h * 0.3, x, y); c.quadraticCurveTo(x + h * 0.05, y - h * 0.6, x + h * 0.1, y - h * 1.1); c.moveTo(x, y); c.quadraticCurveTo(x + h * 0.15, y - h * 0.4, x + h * 0.4, y - h * 0.85); c.stroke(); }
  }

  function cache() {
    const key = [V.W, V.H, V.cam.x.toFixed(3), V.cam.z.toFixed(2)].join('|'); if (key === V.cacheKey) return; V.cacheKey = key;
    for (const cv of [V.A, V.B]) { cv.width = bg.width; cv.height = bg.height; }
    const a = V.A.getContext('2d'), b = V.B.getContext('2d');
    for (const c of [a, b]) c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    sky(a); mountains(a); hills(a); village(a); meadow(a);
    for (const tr of trees.filter((t) => t.x < -6 || t.x > 9)) tree(b, X(tr.x), Yd(-0.95), tr.s);
    path(b); house(b, X(PLACES.house), Yd(-0.55), m(3.0), '#f6e8cf', '#7a3f27', true); pen(b); bench(b); bakery(b, false);
    for (const tr of trees.filter((t) => t.x >= -6 && t.x <= 9)) tree(b, X(tr.x), Yd(-0.9), tr.s * 0.95);
    bridge(b, 'back');
  }
  // the whole picture behind the people (bg) and in front of them (fg)
  function draw(t, dt) {
    if (V.lambHop > 0) V.lambHop = Math.max(0, V.lambHop - dt * 2.2);
    cache();
    const c = bg.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(V.A, 0, 0);
    c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); cloudsDraw(c, t); waterfall(c, t); stream(c, t);
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(V.B, 0, 0); c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); lamb(c, t);
    const f = fg.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fg.width, fg.height); f.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    bridge(f, 'front'); bakery(f, true); grassFront(f);
  }
  // where a person stands: screen x, the y of the feet, and a scale for depth (d < 0 is behind the path)
  function foot(wx, d = 0) {
    let y = Yd(d); const k = d < 0 ? 1 + d * 0.06 : 1;
    if (Math.abs(wx - BRIDGE.x) < BRIDGE.half && d > -0.25 && d < 0.25) y -= m(BRIDGE.rise) * Math.sin(Math.PI * (wx - BRIDGE.x + BRIDGE.half) / (2 * BRIDGE.half));
    return { x: X(wx), y, k };
  }
  return { V, size, setCam, draw, foot, bleat() { V.lambHop = 1; }, lambAt: () => ({ x: X(PLACES.pen + 0.1), y: Yd(-0.35) - m(0.5) }), toWorld: (sx) => (sx - V.W / 2) / V.cam.z + V.cam.x };
}
