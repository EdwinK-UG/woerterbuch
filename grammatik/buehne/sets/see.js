/* Der See: a lakeshore on a Sunday afternoon (first used by the B2 film on Konjunktiv II, id 97). Canvas 2D like the
   village and the workshop, with the same interface for the stage: size, setCam, foot, draw, V. World units are metres.
   From left to right: a stream with a small wooden footbridge, the boathouse (a canopy over the path, a clock on its
   gable, a wide door), the shore, a wooden jetty out into the lake, open water, and the island's beach with a
   pavilion, balloons and a party table. Behind: the lake to the far shore, hills, mountains, the sky.
   Its parts (format v1 `set`): sun 0 (grey, overcast) … 1 (sunny), clock (the time on the gable, minutes after
   midnight), door 0 shut … 1 open, bridge 1 (there) … 0 (rubbed out). Original design. */

const TAU = Math.PI * 2;
export const SPOTS = { bridge: -7.2, boathouse: -3.8, door: -3.55, clock: -4.65, shore: 0.6, jetty: 2.6, jettyEnd: 4.9, lake: 7.2, beach: 10.2, pavilion: 11.4 };
export const BRIDGE = { x: SPOTS.bridge, half: 0.85, rise: 0.14 };
// the boathouse (metres; d its facade's depth): wall and gable heights, the door, the clock, the canopy's front edge
export const HOUSE = { x0: -5.4, x1: -2.2, d: -1.1, wall: 1.85, apex: 2.45, door: { x: SPOTS.door, w: 1.25, h: 1.45 }, clock: { x: SPOTS.clock, y: 1.45, r: 0.2 }, front: 0.25, edge: 2.05 };
const BACK = -1.4;                              // how far back the land reaches (depth)
const shoreX = (d) => SPOTS.shore + 0.22 * d;   // the shoreline of the main land, by depth
const beachX = (d) => 9.6 - 0.35 * d;           // the island's shoreline

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function createSee(bg, fg) {
  const V = { W: 1, H: 1, dpr: 1, cam: { x: 0, z: 100 }, gy: 0, hz: 0, cacheKey: '', A: document.createElement('canvas'), sun: 0, clock: 870, door: 0, bridge: 1, t: 0 };
  const r = rng(97);
  const peaks = Array.from({ length: 30 }, (_, i) => ({ x: -30 + i * 2.2 + r() * 1.2, h: 0.55 + r() * 0.6, w: 1.4 + r() * 1.0, snow: r() > 0.35 }));
  const hillsF = Array.from({ length: 26 }, (_, i) => ({ x: -22 + i * 1.8 + r() * 0.9, h: 0.28 + r() * 0.3, w: 1.2 + r() * 0.8 }));
  const pinesF = Array.from({ length: 60 }, () => ({ x: -22 + r() * 48, h: 0.12 + r() * 0.1 }));
  const housesF = Array.from({ length: 7 }, (_, i) => ({ x: -14 + i * 4.6 + r() * 2, s: 0.7 + r() * 0.3 }));
  const ripples = Array.from({ length: 150 }, () => ({ x: -14 + r() * 30, d: -2.5 + r() * 3.6, l: 0.12 + r() * 0.25 }));
  const tufts = Array.from({ length: 70 }, () => ({ x: -13 + r() * 13, d: BACK + r() * 2.6, h: 0.05 + r() * 0.07 }));
  const flowers = Array.from({ length: 40 }, () => ({ x: -13 + r() * 12.5, d: BACK + 0.2 + r() * 2.3, c: ['#f6d84a', '#ffffff', '#e88fb4', '#b48be6'][Math.floor(r() * 4)] }));
  const balloons = [[10.0, 1.95, '#e0465a'], [10.2, 2.12, '#f2c94c'], [10.4, 1.9, '#2f7fd1'], [12.4, 1.98, '#9b6ee8'], [12.6, 2.15, '#4f8a52'], [12.8, 1.92, '#f39c5a']];

  const X = (wx, p = 1) => V.W / 2 + (wx - V.cam.x * p) * V.cam.z;
  const m = (v) => v * V.cam.z;
  const Yd = (d) => d >= 0 ? V.gy + m(d) * 0.55 : V.gy + (V.gy - V.hz) * Math.max(-1, d / 2.6);

  function size(W, H, dpr) { V.W = W; V.H = H; V.dpr = dpr; V.cacheKey = ''; for (const c of [bg, fg]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); } }
  function setCam(x, z, ty = 0) { V.cam.x = x; V.cam.z = z; V.gy = V.H * 0.8 + ty * z; V.hz = V.gy - m(1.05); }
  function rr(c, x, y, w, h, rad) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, rad) : c.rect(x, y, w, h); }
  const circle = (c, x, y, rad, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); };

  /* ---------- the sky and the lake: grey, and sunny (drawn over it as `sun` rises) ---------- */
  function sky(c, sunny) {
    const g = c.createLinearGradient(0, 0, 0, V.hz);
    if (sunny) { g.addColorStop(0, '#7db6e4'); g.addColorStop(0.75, '#cfe8f6'); g.addColorStop(1, '#f1f6ea'); }
    else { g.addColorStop(0, '#8c97a3'); g.addColorStop(0.75, '#b9c1c8'); g.addColorStop(1, '#d3d8dc'); }
    c.fillStyle = g; c.fillRect(0, 0, V.W, V.hz + 2);
    const p = 0.04;
    if (sunny) {
      const sx = X(7.5, p), sy = V.hz - m(1.0), sg = c.createRadialGradient(sx, sy, 0, sx, sy, m(0.65));
      sg.addColorStop(0, 'rgba(255,248,214,1)'); sg.addColorStop(0.22, 'rgba(255,240,180,.75)'); sg.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = sg; c.fillRect(sx - m(0.7), sy - m(0.7), m(1.4), m(1.4));
      for (const [x, y, s] of [[-6, 1.15, 0.7], [1.5, 1.2, 0.8], [11, 1.1, 0.6]]) cloud(c, X(x, 0.06), V.hz - m(y), m(s), '#ffffff', 0.92);
    } else for (const [x, y, s] of [[-9, 1.0, 1.0], [-4, 1.1, 1.0], [1, 0.95, 1.0], [6, 1.1, 1.0], [11, 1.0, 1.0], [15, 1.05, 1.0]]) cloud(c, X(x, 0.06), V.hz - m(y), m(s), '#7d8893', 0.85);
  }
  function cloud(c, x, y, s, col, a) {
    c.save(); c.globalAlpha = a; c.fillStyle = col; c.beginPath();
    for (const [dx, dy, rad] of [[-0.55, 0.08, 0.32], [-0.2, -0.1, 0.42], [0.25, -0.05, 0.38], [0.6, 0.1, 0.28], [0, 0.14, 0.34]]) { c.moveTo(x + dx * s + rad * s, y + dy * s); c.arc(x + dx * s, y + dy * s, rad * s, 0, TAU); }
    c.fill(); c.restore();
  }
  function mountains(c) {
    const p = 0.12, base = V.hz + m(0.02);
    c.fillStyle = '#9fb0c2'; c.beginPath(); c.moveTo(0, base);
    for (const pk of peaks) { const x = X(pk.x, p), w = m(pk.w), h = m(pk.h); if (x + w < -60 || x - w > V.W + 60) continue; c.lineTo(x - w, base); c.lineTo(x, base - h); c.lineTo(x + w, base); }
    c.lineTo(V.W, base); c.closePath(); c.fill();
    c.fillStyle = '#eef2f6';
    for (const pk of peaks) { if (!pk.snow) continue; const x = X(pk.x, p), w = m(pk.w), h = m(pk.h); if (x + w < -60 || x - w > V.W + 60) continue;
      c.beginPath(); c.moveTo(x - w * 0.26, base - h * 0.74); c.lineTo(x, base - h); c.lineTo(x + w * 0.26, base - h * 0.74); c.lineTo(x + w * 0.1, base - h * 0.8); c.lineTo(x - w * 0.05, base - h * 0.72); c.closePath(); c.fill(); }
  }
  function hills(c) {              // the far shore: green hills, dark pines, a few houses with red roofs
    const p = 0.3, base = V.hz + m(0.03);
    c.fillStyle = '#6f9a5b'; c.beginPath(); c.moveTo(0, base);
    for (const h of hillsF) { const x = X(h.x, p), w = m(h.w); if (x + w < -60 || x - w > V.W + 60) continue; c.lineTo(x - w, base); c.quadraticCurveTo(x, base - m(h.h) * 2, x + w, base); }
    c.lineTo(V.W, base); c.closePath(); c.fill();
    c.fillStyle = '#4b7a45'; for (const t of pinesF) { const x = X(t.x, p); if (x < -10 || x > V.W + 10) continue; c.beginPath(); c.moveTo(x - m(t.h * 0.35), base); c.lineTo(x, base - m(t.h)); c.lineTo(x + m(t.h * 0.35), base); c.fill(); }
    for (const h of housesF) { const x = X(h.x, p), s = m(0.12 * h.s); if (x < -20 || x > V.W + 20) continue; c.fillStyle = '#f3e7cf'; c.fillRect(x - s, base - s * 1.2, s * 2, s * 1.2); c.fillStyle = '#b5552f'; c.beginPath(); c.moveTo(x - s * 1.2, base - s * 1.2); c.lineTo(x, base - s * 2); c.lineTo(x + s * 1.2, base - s * 1.2); c.fill(); }
    c.fillStyle = 'rgba(70,110,80,.35)'; c.fillRect(0, base - 1, V.W, m(0.03));
  }
  function lake(c, sunny) {
    const g = c.createLinearGradient(0, V.hz, 0, V.H);
    if (sunny) { g.addColorStop(0, '#a9d6ef'); g.addColorStop(0.25, '#5fa9d8'); g.addColorStop(1, '#2f7fb6'); }
    else { g.addColorStop(0, '#b4bfc5'); g.addColorStop(0.25, '#8b9ba4'); g.addColorStop(1, '#66777f'); }
    c.fillStyle = g; c.fillRect(0, V.hz + m(0.03), V.W, V.H - V.hz);
    c.strokeStyle = sunny ? 'rgba(255,255,255,.55)' : 'rgba(225,232,236,.38)'; c.lineCap = 'round';
    for (const q of ripples) {
      const k = 1 + Math.max(-0.9, q.d) * 0.3, x = X(q.x), y = Yd(q.d); if (x < -30 || x > V.W + 30) continue;
      c.lineWidth = Math.max(1, m(0.014) * k); c.beginPath(); c.moveTo(x - m(q.l) * k, y); c.quadraticCurveTo(x, y - m(0.02) * k, x + m(q.l) * k, y); c.stroke();
    }
    if (sunny) {                  // the sun's path on the water
      const sx = X(7.5, 0.04); c.fillStyle = 'rgba(255,250,220,.5)';
      for (let i = 0; i < 9; i++) { const y = V.hz + m(0.06 + i * i * 0.012), w = m(0.12 + i * 0.05); c.fillRect(sx - w / 2 + Math.sin(i * 2.3) * m(0.08), y, w, Math.max(1.5, m(0.015))); }
    }
  }

  /* ---------- the land: the shore with the boathouse and the jetty; the island ---------- */
  function landShape(c, edge, left) {          // a piece of land from the back edge to the bottom, cut by a shoreline
    c.beginPath();
    const ds = []; for (let d = BACK; d <= 1.6; d += 0.1) ds.push(d);
    if (left) { c.moveTo(-10, Yd(BACK)); for (const d of ds) c.lineTo(X(edge(d)), Yd(d)); c.lineTo(X(edge(1.6)), V.H + 10); c.lineTo(-10, V.H + 10); }
    else { c.moveTo(V.W + 10, Yd(BACK)); for (const d of ds) c.lineTo(X(edge(d)), Yd(d)); c.lineTo(X(edge(1.6)), V.H + 10); c.lineTo(V.W + 10, V.H + 10); }
    c.closePath();
  }
  function land(c, edge, left) {
    landShape(c, edge, left); const g = c.createLinearGradient(0, Yd(BACK), 0, V.H); g.addColorStop(0, '#8fb86a'); g.addColorStop(1, '#6e9e4c'); c.fillStyle = g; c.fill();
    // the bank: a strip of pebbles and sand along the water
    c.strokeStyle = '#d9c9a0'; c.lineWidth = m(0.09); c.beginPath(); for (let d = BACK; d <= 1.6; d += 0.1) { const x = X(edge(d)) + (left ? -m(0.04) : m(0.04)); d === BACK ? c.moveTo(x, Yd(d)) : c.lineTo(x, Yd(d)); } c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = Math.max(1, m(0.015)); c.beginPath(); for (let d = BACK; d <= 1.6; d += 0.1) { const x = X(edge(d)) + (left ? m(0.03) : -m(0.03)); d === BACK ? c.moveTo(x, Yd(d)) : c.lineTo(x, Yd(d)); } c.stroke();
    // the back edge: a softer line of bushes
    c.fillStyle = '#5f8f49'; for (let x = left ? -13 : 9.4; x < (left ? edge(BACK) - 0.2 : 14); x += 0.45) { const sx = X(x), y = Yd(BACK); if (sx < -40 || sx > V.W + 40) continue; c.beginPath(); c.ellipse(sx, y, m(0.3), m(0.16), 0, Math.PI, TAU); c.fill(); }
  }
  function path(c) {               // the gravel path along the shore, from the bridge to the jetty
    c.fillStyle = '#d8c7a0'; c.beginPath(); c.moveTo(X(-14), Yd(-0.32)); c.lineTo(X(shoreX(-0.32) + 0.1), Yd(-0.32)); c.lineTo(X(shoreX(0.38) + 0.1), Yd(0.38)); c.lineTo(X(-14), Yd(0.38)); c.closePath(); c.fill();
    c.fillStyle = 'rgba(150,130,90,.35)'; const pr = rng(5); for (let i = 0; i < 160; i++) { const x = -13 + pr() * 13.5, d = -0.3 + pr() * 0.66; c.beginPath(); c.arc(X(x), Yd(d), Math.max(0.8, m(0.012)), 0, TAU); c.fill(); }
  }
  function stream(c) {             // the stream under the footbridge, from the back edge to the bottom of the picture
    const cx = (d) => BRIDGE.x + 0.25 * d + 0.12 * Math.sin(d * 2.4), w = (d) => 0.32 + 0.18 * (d - BACK);
    c.beginPath(); for (let d = BACK; d <= 1.6; d += 0.1) c.lineTo(X(cx(d) - w(d) / 2), Yd(d)); for (let d = 1.6; d >= BACK; d -= 0.1) c.lineTo(X(cx(d) + w(d) / 2), Yd(d)); c.closePath();
    c.fillStyle = '#6aa9d0'; c.fill(); c.strokeStyle = '#c7b48a'; c.lineWidth = m(0.035); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = Math.max(1, m(0.012));
    for (let d = BACK + 0.2; d < 1.5; d += 0.28) { const x = X(cx(d)), y = Yd(d); c.beginPath(); c.moveTo(x - m(0.06), y); c.lineTo(x + m(0.06), y + m(0.02)); c.stroke(); }
  }
  // the boathouse: facade at depth HOUSE.d; a canopy reaches out over the path, just above the heads
  function boathouse(c) {
    const B = HOUSE, x0 = X(B.x0), x1 = X(B.x1), base = Yd(B.d), k = 1 + B.d * 0.06, H = (h) => base - m(h) * k, cx = X((B.x0 + B.x1) / 2);
    c.fillStyle = '#7a4f2c'; c.beginPath(); c.moveTo(x1, base); c.lineTo(x1 + m(0.45), Yd(B.d - 0.5)); c.lineTo(x1 + m(0.45), Yd(B.d - 0.5) - m(B.wall) * k); c.lineTo(x1, H(B.wall)); c.closePath(); c.fill();
    c.fillStyle = '#b97a48'; c.beginPath(); c.moveTo(x0 - m(0.1), H(B.wall)); c.lineTo(cx, H(B.apex)); c.lineTo(x1 + m(0.1), H(B.wall)); c.closePath(); c.fill();
    c.fillStyle = '#a8693d'; c.fillRect(x0, H(B.wall), x1 - x0, base - H(B.wall));
    c.strokeStyle = 'rgba(80,45,20,.35)'; c.lineWidth = 1; for (let x = x0 + m(0.2); x < x1; x += m(0.2)) { c.beginPath(); c.moveTo(x, H(B.wall)); c.lineTo(x, base); c.stroke(); }
    c.strokeStyle = '#5b3520'; c.lineWidth = m(0.09); c.lineJoin = 'round'; c.beginPath(); c.moveTo(x0 - m(0.3), H(B.wall - 0.12)); c.lineTo(cx, H(B.apex + 0.06)); c.lineTo(x1 + m(0.3), H(B.wall - 0.12)); c.stroke();
    // the clock's face (its hands are drawn every frame: clockHands)
    const kx = X(B.clock.x), ky = H(B.clock.y); circle(c, kx, ky, m(B.clock.r + 0.04) * k, '#5b3520'); circle(c, kx, ky, m(B.clock.r) * k, '#fbf6ea');
    c.strokeStyle = '#2a2f3a'; c.lineWidth = Math.max(1, m(0.014)); for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12, r1 = m(B.clock.r) * k; c.beginPath(); c.moveTo(kx + Math.cos(a) * r1 * 0.8, ky + Math.sin(a) * r1 * 0.8); c.lineTo(kx + Math.cos(a) * r1 * 0.95, ky + Math.sin(a) * r1 * 0.95); c.stroke(); }
    // the door frame and its dark inside (the leaves are drawn by `door`)
    const D = B.door, dx = X(D.x), dw = m(D.w) * k, dh = m(D.h) * k; c.fillStyle = '#2b1d14'; c.fillRect(dx - dw / 2, base - dh, dw, dh);
    c.fillStyle = 'rgba(120,80,50,.45)'; c.fillRect(dx - dw / 2 + m(0.08), base - m(0.2), dw - m(0.16), m(0.06));
    c.strokeStyle = '#5b3520'; c.lineWidth = m(0.07); c.strokeRect(dx - dw / 2, base - dh, dw, dh);
    // the canopy: a roof plane from the facade out over the path, on two posts
    const fy = Yd(B.front) - m(B.edge), by = H(B.wall), fx0 = X(B.x0 - 0.25), fx1 = X(B.x1 + 0.25);
    c.fillStyle = '#8a4b2e'; c.beginPath(); c.moveTo(x0 - m(0.1), by); c.lineTo(x1 + m(0.1), by); c.lineTo(fx1, fy); c.lineTo(fx0, fy); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(60,30,15,.4)'; c.lineWidth = 1; for (let i = 1; i < 10; i++) { const u = i / 10; c.beginPath(); c.moveTo(x0 + (x1 - x0) * u, by); c.lineTo(fx0 + (fx1 - fx0) * u, fy); c.stroke(); }
    c.fillStyle = '#6d3a22'; c.fillRect(fx0 - m(0.05), fy - m(0.03), fx1 - fx0 + m(0.1), m(0.08));
    c.fillStyle = '#6d4526'; for (const px of [B.x0 - 0.15, B.x1 + 0.15]) c.fillRect(X(px) - m(0.05), fy, m(0.1), Yd(B.front) - fy);
    // a lifebuoy on the facade
    const lx = X(B.x1 - 0.55), ly = H(1.05); c.strokeStyle = '#e0465a'; c.lineWidth = m(0.07); c.beginPath(); c.arc(lx, ly, m(0.14), 0, TAU); c.stroke();
    c.strokeStyle = '#fff'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(lx, ly, m(0.14), i * Math.PI / 2, i * Math.PI / 2 + 0.4); c.stroke(); }
  }
  function jetty(c) {              // planks across, from the shore to its end; posts in the water
    const x0 = shoreX(0) - 0.3, x1 = SPOTS.jettyEnd, d0 = -0.42, d1 = 0.4;
    c.fillStyle = '#5b3a22'; for (let x = x0 + 0.6; x <= x1; x += 1.1) for (const d of [d0, d1]) c.fillRect(X(x) - m(0.06), Yd(d), m(0.12), m(0.3));
    c.fillStyle = '#c4935d'; c.beginPath(); c.moveTo(X(x0), Yd(d0)); c.lineTo(X(x1), Yd(d0)); c.lineTo(X(x1), Yd(d1)); c.lineTo(X(x0), Yd(d1)); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,55,30,.45)'; c.lineWidth = Math.max(1, m(0.012)); for (let x = x0 + 0.22; x < x1; x += 0.22) { c.beginPath(); c.moveTo(X(x), Yd(d0)); c.lineTo(X(x), Yd(d1)); c.stroke(); }
    c.fillStyle = '#8a5a33'; c.fillRect(X(x0), Yd(d1), X(x1) - X(x0), m(0.08));
    // a mooring post at the end, with a rope
    c.fillStyle = '#6d4526'; rr(c, X(x1 - 0.15) - m(0.07), Yd(-0.35) - m(0.55), m(0.14), m(0.55), m(0.03)); c.fill();
    c.strokeStyle = '#e8d9b0'; c.lineWidth = m(0.03); c.beginPath(); c.ellipse(X(x1 - 0.15), Yd(-0.35) - m(0.4), m(0.09), m(0.03), 0, 0, TAU); c.stroke();
  }
  function shore(c) {
    land(c, shoreX, true); stream(c); path(c);
    for (const t of tufts) { const x = X(t.x); if (t.x > shoreX(t.d) - 0.3 || Math.abs(t.x - BRIDGE.x - 0.25 * t.d) < 0.5 || (t.d > -0.35 && t.d < 0.4)) continue; c.strokeStyle = '#5f9c3e'; c.lineWidth = Math.max(1, m(0.012)); c.beginPath(); c.moveTo(x - m(t.h * 0.4), Yd(t.d) - m(t.h)); c.quadraticCurveTo(x, Yd(t.d) - m(t.h * 0.3), x, Yd(t.d)); c.quadraticCurveTo(x + m(0.01), Yd(t.d) - m(t.h * 0.6), x + m(t.h * 0.4), Yd(t.d) - m(t.h * 1.05)); c.stroke(); }
    for (const f of flowers) { if (f.x > shoreX(f.d) - 0.3 || Math.abs(f.x - BRIDGE.x - 0.25 * f.d) < 0.5 || (f.d > -0.35 && f.d < 0.4)) continue; circle(c, X(f.x), Yd(f.d) - m(0.03), Math.max(1.2, m(0.022)), f.c); }
    boathouse(c); jetty(c);
    // a tree behind the boathouse and one by the stream
    for (const [x, d, s] of [[-1.2, -1.3, 1.0], [-9.4, -1.2, 0.9]]) { const tx = X(x), ty = Yd(d); c.fillStyle = '#6d4526'; c.fillRect(tx - m(0.07 * s), ty - m(1.1 * s), m(0.14 * s), m(1.1 * s)); for (const [dx, dy, rad, col] of [[0, -1.6, 0.62, '#4f8a3c'], [-0.3, -1.25, 0.45, '#5f9c48'], [0.32, -1.3, 0.42, '#5a9442']]) circle(c, tx + m(dx * s), ty + m(dy * s), m(rad * s), col); }
  }
  function island(c) {             // the island's beach: sand, the pavilion with balloons and a banner, a party table
    landShape(c, beachX, false); const g = c.createLinearGradient(0, Yd(BACK), 0, V.H); g.addColorStop(0, '#e9d6a6'); g.addColorStop(1, '#dcc28c'); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = Math.max(1, m(0.02)); c.beginPath(); for (let d = BACK; d <= 1.6; d += 0.1) { const x = X(beachX(d)) - m(0.03); d === BACK ? c.moveTo(x, Yd(d)) : c.lineTo(x, Yd(d)); } c.stroke();
    c.fillStyle = '#7fae5c'; for (let x = 10.2; x < 14; x += 0.5) { const y = Yd(BACK); c.beginPath(); c.ellipse(X(x), y, m(0.32), m(0.2), 0, Math.PI, TAU); c.fill(); }
    // the pavilion: a white tent roof on four posts
    const px = SPOTS.pavilion, base = Yd(-0.95), k = 1 - 0.95 * 0.06, H = (h) => base - m(h) * k, x0 = X(px - 1.25), x1 = X(px + 1.25);
    c.fillStyle = '#f4efe4'; for (const x of [px - 1.15, px + 1.15]) c.fillRect(X(x) - m(0.05), H(1.55), m(0.1), m(1.55) * k);
    c.fillStyle = '#fbf8f1'; c.beginPath(); c.moveTo(x0 - m(0.15), H(1.6)); c.lineTo(X(px), H(2.15)); c.lineTo(x1 + m(0.15), H(1.6)); c.closePath(); c.fill();
    c.fillStyle = '#e8c4c4'; for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 0.5) / 6; c.beginPath(); c.moveTo(x0 - m(0.15) + (x1 - x0 + m(0.3)) * u0, H(1.6)); c.lineTo(X(px), H(2.15)); c.lineTo(x0 - m(0.15) + (x1 - x0 + m(0.3)) * u1, H(1.6)); c.fill(); }
    for (let i = 0; i < 10; i++) { const u = (i + 0.5) / 10; c.fillStyle = i % 2 ? '#e0465a' : '#f2c94c'; c.beginPath(); c.moveTo(x0 + (x1 - x0) * u - m(0.08), H(1.6)); c.lineTo(x0 + (x1 - x0) * u + m(0.08), H(1.6)); c.lineTo(x0 + (x1 - x0) * u, H(1.42)); c.fill(); }
    // the banner "30" and the balloons on strings
    c.fillStyle = '#2f7fd1'; rr(c, X(px) - m(0.36), H(1.36), m(0.72), m(0.26), m(0.05)); c.fill();
    c.fillStyle = '#fff'; c.font = `800 ${m(0.2).toFixed(1)}px Inter, system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('30', X(px), H(1.23));
    for (const [bx, by, col] of balloons) { const sx = X(bx), sy = H(by); c.strokeStyle = 'rgba(60,60,60,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx, sy + m(0.17)); c.quadraticCurveTo(sx + m(0.05), sy + m(0.6), X(bx < px ? px - 1.15 : px + 1.15), H(1.55)); c.stroke();
      c.fillStyle = col; c.beginPath(); c.ellipse(sx, sy, m(0.13), m(0.17), 0, 0, TAU); c.fill(); circle(c, sx - m(0.04), sy - m(0.06), m(0.03), 'rgba(255,255,255,.6)'); }
    // the party table with a cake
    const ty = Yd(-0.75); c.fillStyle = '#8a6a4a'; for (const dx of [-0.6, 0.6]) c.fillRect(X(px + dx) - m(0.03), ty - m(0.72), m(0.06), m(0.72)); c.fillStyle = '#fdfdfb'; c.fillRect(X(px - 0.7), ty - m(0.75), m(1.4), m(0.08)); c.fillStyle = '#e8c4c4'; c.fillRect(X(px - 0.7), ty - m(0.67), m(1.4), m(0.2));
    c.fillStyle = '#c98a4b'; c.fillRect(X(px - 0.18), ty - m(0.97), m(0.36), m(0.22)); c.fillStyle = '#fdf1e0'; c.fillRect(X(px - 0.18), ty - m(0.99), m(0.36), m(0.05));
    for (const dx of [-0.1, 0, 0.1]) { c.fillStyle = '#fff'; c.fillRect(X(px + dx) - 1, ty - m(1.07), 2, m(0.08)); circle(c, X(px + dx), ty - m(1.09), m(0.015), '#f2994a'); }
  }
  /* ---------- the parts that change ---------- */
  function bridge(c) {             // the footbridge over the stream; V.bridge < 1 rubs it out from its right end
    const v = Math.max(0, Math.min(1, V.bridge)); if (v <= 0.001) return;
    const x0 = BRIDGE.x - BRIDGE.half - 0.15, x1 = BRIDGE.x + BRIDGE.half + 0.15, cut = x0 + (x1 - x0) * v;
    c.save(); c.beginPath(); c.rect(X(x0) - m(0.3), 0, X(cut) - X(x0) + m(0.3), V.H); c.clip();
    const arc = (d, h) => { c.beginPath(); for (let i = 0; i <= 20; i++) { const x = x0 + ((x1 - x0) * i) / 20, u = (x - BRIDGE.x + BRIDGE.half) / (2 * BRIDGE.half), lift = u > 0 && u < 1 ? Math.sin(Math.PI * u) * BRIDGE.rise : 0; c.lineTo(X(x), Yd(d) - m(lift + h)); } };
    c.lineCap = 'round';
    for (const [d, col] of [[-0.3, '#8a5a33'], [0.3, '#a06a3d']]) { c.strokeStyle = col; c.lineWidth = m(0.06); arc(d, 0.62); c.stroke(); for (let x = x0 + 0.1; x <= x1; x += 0.35) { const u = (x - BRIDGE.x + BRIDGE.half) / (2 * BRIDGE.half), lift = u > 0 && u < 1 ? Math.sin(Math.PI * u) * BRIDGE.rise : 0; c.lineWidth = m(0.045); c.beginPath(); c.moveTo(X(x), Yd(d) - m(lift)); c.lineTo(X(x), Yd(d) - m(lift + 0.62)); c.stroke(); } }
    c.fillStyle = '#c4935d'; c.beginPath();
    for (let i = 0; i <= 20; i++) { const x = x0 + ((x1 - x0) * i) / 20, u = (x - BRIDGE.x + BRIDGE.half) / (2 * BRIDGE.half), lift = u > 0 && u < 1 ? Math.sin(Math.PI * u) * BRIDGE.rise : 0; c.lineTo(X(x), Yd(-0.3) - m(lift)); }
    for (let i = 20; i >= 0; i--) { const x = x0 + ((x1 - x0) * i) / 20, u = (x - BRIDGE.x + BRIDGE.half) / (2 * BRIDGE.half), lift = u > 0 && u < 1 ? Math.sin(Math.PI * u) * BRIDGE.rise : 0; c.lineTo(X(x), Yd(0.3) - m(lift)); }
    c.closePath(); c.fill(); c.strokeStyle = 'rgba(90,55,30,.5)'; c.lineWidth = 1; c.stroke();
    c.restore();
  }
  function door(c) {               // two leaves; V.door 0 shut … 1 open (they swing outward, getting narrower)
    const B = HOUSE, D = B.door, k = 1 + B.d * 0.06, cx = X(D.x), base = Yd(B.d), dw = m(D.w) * k, dh = m(D.h) * k, o = Math.max(0, Math.min(1, V.door));
    for (const s of [-1, 1]) {
      const hinge = cx + s * dw / 2, w = (dw / 2) * Math.cos(o * Math.PI * 0.45), lean = m(0.1) * o;
      c.fillStyle = '#8a5a33'; c.beginPath(); c.moveTo(hinge, base - dh); c.lineTo(hinge - s * w, base - dh - lean * 0.3); c.lineTo(hinge - s * w, base + lean * 0.3); c.lineTo(hinge, base); c.closePath(); c.fill();
      c.strokeStyle = '#5b3520'; c.lineWidth = Math.max(1, m(0.025)); c.stroke();
      c.beginPath(); c.moveTo(hinge, base - dh * 0.15); c.lineTo(hinge - s * w, base - dh * 0.85); c.stroke();
    }
  }
  function clockHands(c) {         // V.clock: minutes after midnight (870 = 14:30)
    const B = HOUSE, k = 1 + B.d * 0.06, cx = X(B.clock.x), cy = Yd(B.d) - m(B.clock.y) * k, r = m(B.clock.r) * k, t = V.clock;
    const ah = (((t / 60) % 12) / 12) * TAU - Math.PI / 2, am = ((t % 60) / 60) * TAU - Math.PI / 2;
    c.strokeStyle = '#2a2f3a'; c.lineCap = 'round';
    c.lineWidth = Math.max(1.5, m(0.028)); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ah) * r * 0.5, cy + Math.sin(ah) * r * 0.5); c.stroke();
    c.lineWidth = Math.max(1, m(0.016)); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(am) * r * 0.78, cy + Math.sin(am) * r * 0.78); c.stroke();
    circle(c, cx, cy, Math.max(1.5, m(0.02)), '#2a2f3a');
  }
  function reeds(c) {              // in front: reeds at the water's edge, left of the jetty and by the island
    c.strokeStyle = '#5a7f3a'; c.lineCap = 'round';
    for (const [x0, n] of [[0.15, 7], [9.35, 6]]) for (let i = 0; i < n; i++) {
      const x = X(x0 + i * 0.07), y = Yd(1.05 + (i % 3) * 0.06), h = m(0.42 + ((i * 37) % 10) * 0.025);
      c.lineWidth = Math.max(1, m(0.016)); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + m(0.04), y - h * 0.6, x + m(0.02 * ((i % 2) * 2 - 1)), y - h); c.stroke();
      if (i % 2 === 0) { c.fillStyle = '#7a5434'; rr(c, x - m(0.02), y - h * 0.8, m(0.04), m(0.12), m(0.02)); c.fill(); }
    }
  }

  function cache() {
    const key = [V.W, V.H, V.cam.x.toFixed(3), V.cam.z.toFixed(2), V.gy.toFixed(1)].join('|'); if (key === V.cacheKey) return; V.cacheKey = key;
    const A = V.A; A.width = bg.width; A.height = bg.height; const c = A.getContext('2d'); c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    island(c); shore(c);
  }
  function draw(t) {
    cache(); V.t = t;
    const c = bg.getContext('2d'); c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    const sun = Math.max(0, Math.min(1, V.sun));
    sky(c, false); if (sun > 0.001) { c.globalAlpha = sun; sky(c, true); c.globalAlpha = 1; }
    mountains(c); hills(c);
    lake(c, false); if (sun > 0.001) { c.globalAlpha = sun; lake(c, true); c.globalAlpha = 1; }
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(V.A, 0, 0); c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    bridge(c); door(c); clockHands(c);
    const f = fg.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fg.width, fg.height); f.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    reeds(f);
  }
  // where a person stands: on the footbridge the feet rise with its arch (while it is there)
  function foot(wx, d = 0) {
    let y = Yd(d); const k = d < 0 ? 1 + d * 0.06 : 1;
    if (V.bridge > 0.5 && Math.abs(wx - BRIDGE.x) < BRIDGE.half && d > -0.3 && d < 0.3) y -= m(BRIDGE.rise) * Math.sin(Math.PI * (wx - BRIDGE.x + BRIDGE.half) / (2 * BRIDGE.half));
    return { x: X(wx), y, k };
  }
  return { V, size, setCam, draw, foot, toWorld: (sx) => (sx - V.W / 2) / V.cam.z + V.cam.x };
}
