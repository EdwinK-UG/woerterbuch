/* Die Redaktion: the newsroom of a small local paper (first used by the C1 film on the Nominalstil, id 482). A light
   office wall with a big window onto the town's roofs, a glass door to the corridor, a wall clock above a plate with
   the deadline, a pinboard and a shelf of old issues; in the middle a big freestanding screen showing tomorrow's front
   page (its narrow right column still empty); at the back right an old iron printing press; in front Lena's desk with
   her laptop. Canvas 2D like the other sets, with the same interface for the stage: size, setCam, foot, draw, V.
   World units are metres; the back wall is a little slower than the floor (parallax 0.93). The screen and the press
   stand on the floor (parallax 1), so props placed at their depth stay on them whatever the camera does.
   Its parts (format v1 `set`): clock (the wall clock, minutes after midnight: 1040 = 17:20), page 0 … 1 (the screen's
   empty column fills with lines of print; 1: the page is full), press 0 … 1 (the press runs: it rattles, its rollers
   turn, sheets come out), door 0 shut … 1 open (the glass door). Original design. */

const TAU = Math.PI * 2;
export const SPOTS = { door: -5.8, window: -3.6, desk: -1.45, clock: -0.95, screen: 1.1, press: 4.7, shelf: 6.9 };
// the big screen on a low stand (metres; d its depth): centre x, width, bottom and height of its picture; the empty column on it
// (low, so that the narrator's boards at the top of the picture leave what happens on it free)
export const SCREEN = { x: 1.1, d: -1.45, w: 2.3, y0: 0.42, h: 1.2, col: { x: 1.92, w: 0.46, y0: 0.5, y1: 1.36 } };
// the printing press at the back: centre x, depth, width, height; where paper goes in (left) and comes out (right)
export const PRESS = { x: 4.7, d: -1.2, w: 2.0, h: 1.5, in: { x: 3.85, y: 1.25 }, out: { x: 5.75, y: 0.95 } };
// Lena's desk (in front of whoever sits at it): left and right end, the top's height, depth
export const DESK = { x0: -2.2, x1: -0.75, top: 0.74, d: 0.24, seat: -1.4 };
export const CLOCK = { x: SPOTS.clock, y: 2.12, r: 0.17 };
const WALL_D = -1.7, P = 0.93;
const WIN = { x: SPOTS.window, w: 2.1, y0: 0.9, h: 1.55 };
const DOOR = { w: 1.05, h: 2.3 };

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function createRedaktion(bg, fg) {
  const V = { W: 1, H: 1, dpr: 1, cam: { x: 0, z: 100 }, gy: 0, hz: 0, cacheKey: '', A: document.createElement('canvas'), clock: 1040, page: 0, press: 0, door: 0, t: 0 };
  const r = rng(482);
  const lines = Array.from({ length: 60 }, () => 0.55 + r() * 0.45);           // the widths of the lines of print
  const roofs = Array.from({ length: 9 }, (_, i) => ({ x: i / 8, h: 0.25 + r() * 0.3, c: r() }));

  const X = (wx, p = 1) => V.W / 2 + (wx - V.cam.x * p) * V.cam.z;
  const m = (v) => v * V.cam.z;
  const Yd = (d) => d >= 0 ? V.gy + m(d) * 0.55 : V.gy + (V.gy - V.hz) * Math.max(-1, d / 2.6);
  const WX = (wx) => X(wx, P);
  const wallBase = () => Yd(WALL_D);
  const WY = (h) => wallBase() - m(h * 0.92);            // a height on the back wall
  // a point standing on the floor at depth d (as props and people are placed): x, height h in metres
  const at = (x, h, d) => { const k = d < 0 ? 1 + d * 0.06 : 1; return [X(x), Yd(d) - m(h) * k, k]; };

  function size(W, H, dpr) { V.W = W; V.H = H; V.dpr = dpr; V.cacheKey = ''; for (const c of [bg, fg]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); } }
  function setCam(x, z, ty = 0) { V.cam.x = x; V.cam.z = z; V.gy = V.H * 0.8 + ty * z; V.hz = V.gy - m(1.05); }
  function rr(c, x, y, w, h, rad) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, rad) : c.rect(x, y, w, h); }
  const circle = (c, x, y, rad, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); };

  /* ---------- the back wall (parallax 0.93) ---------- */
  function wall(c) {
    const base = wallBase();
    const g = c.createLinearGradient(0, 0, 0, base); g.addColorStop(0, '#e9eef0'); g.addColorStop(1, '#dde4e6');
    c.fillStyle = g; c.fillRect(0, 0, V.W, base + 1);
    // the ceiling with long lights
    const top = WY(3.3); c.fillStyle = '#f4f6f6'; c.fillRect(0, 0, V.W, top); c.fillStyle = '#c9d2d6'; c.fillRect(0, top, V.W, m(0.04));
    for (let x = -9; x <= 12; x += 3.2) { c.fillStyle = '#fbfdfc'; rr(c, WX(x) - m(0.7), WY(3.22), m(1.4), m(0.06), m(0.02)); c.fill(); c.fillStyle = 'rgba(255,250,225,.18)'; c.beginPath(); c.moveTo(WX(x) - m(0.7), WY(3.16)); c.lineTo(WX(x) + m(0.7), WY(3.16)); c.lineTo(WX(x) + m(1.3), WY(2.4)); c.lineTo(WX(x) - m(1.3), WY(2.4)); c.fill(); }
    // a dado: the lower wall a little darker, the skirting
    c.fillStyle = '#cfd9dc'; c.fillRect(0, WY(0.95), V.W, base - WY(0.95)); c.fillStyle = '#b8c5c9'; c.fillRect(0, WY(0.95), V.W, m(0.025));
    c.fillStyle = '#8f9da3'; c.fillRect(0, base - m(0.1), V.W, m(0.1));
    // the window onto the town's roofs (late afternoon)
    const wx0 = WX(WIN.x) - m(WIN.w * 0.92) / 2, wy0 = WY(WIN.y0 + WIN.h), ww = m(WIN.w * 0.92), wh = m(WIN.h * 0.92);
    c.save(); c.beginPath(); c.rect(wx0, wy0, ww, wh); c.clip();
    const sky = c.createLinearGradient(0, wy0, 0, wy0 + wh); sky.addColorStop(0, '#9cc8e8'); sky.addColorStop(1, '#f6d9b0'); c.fillStyle = sky; c.fillRect(wx0, wy0, ww, wh);
    for (const q of roofs) { const x = wx0 + q.x * ww - ww * 0.06, y = wy0 + wh * (1 - q.h); c.fillStyle = q.c > 0.5 ? '#c9764f' : '#b56446'; c.beginPath(); c.moveTo(x - ww * 0.08, y + wh * 0.08); c.lineTo(x + ww * 0.02, y - wh * 0.04); c.lineTo(x + ww * 0.12, y + wh * 0.08); c.fill(); c.fillStyle = q.c > 0.5 ? '#ead8bd' : '#e2cdb2'; c.fillRect(x - ww * 0.07, y + wh * 0.08, ww * 0.18, wh); c.fillStyle = 'rgba(80,90,110,.35)'; c.fillRect(x - ww * 0.03, y + wh * 0.14, ww * 0.03, wh * 0.06); c.fillRect(x + ww * 0.04, y + wh * 0.14, ww * 0.03, wh * 0.06); }
    // the town hall's tower
    const tx = wx0 + ww * 0.62; c.fillStyle = '#d8c3a0'; c.fillRect(tx, wy0 + wh * 0.18, ww * 0.1, wh); c.fillStyle = '#4f7a6a'; c.beginPath(); c.moveTo(tx - ww * 0.01, wy0 + wh * 0.18); c.lineTo(tx + ww * 0.05, wy0 + wh * 0.02); c.lineTo(tx + ww * 0.11, wy0 + wh * 0.18); c.fill();
    circle(c, tx + ww * 0.05, wy0 + wh * 0.27, ww * 0.025, '#fbf6ea');
    c.restore();
    c.strokeStyle = '#fafbfb'; c.lineWidth = m(0.07); c.strokeRect(wx0, wy0, ww, wh); c.lineWidth = m(0.035); c.beginPath(); c.moveTo(wx0 + ww / 2, wy0); c.lineTo(wx0 + ww / 2, wy0 + wh); c.moveTo(wx0, wy0 + wh * 0.3); c.lineTo(wx0 + ww, wy0 + wh * 0.3); c.stroke();
    c.fillStyle = '#eef2f3'; c.fillRect(wx0 - m(0.08), wy0 + wh, ww + m(0.16), m(0.05));
    // the glass door's frame and the corridor behind it
    const d = doorBox(); c.fillStyle = '#c3ced2'; c.fillRect(d.x, d.y, d.w, d.h); c.fillStyle = '#d7dee0'; c.fillRect(d.x, d.y + d.h * 0.82, d.w, d.h * 0.18);
    c.fillStyle = '#a9b6bb'; c.fillRect(d.x + d.w * 0.6, d.y + d.h * 0.25, d.w * 0.3, d.h * 0.4);
    c.strokeStyle = '#7d8a90'; c.lineWidth = m(0.06); c.strokeRect(d.x - m(0.03), d.y - m(0.03), d.w + m(0.06), d.h + m(0.03));
    // a pinboard with clippings, beside the door
    const px = WX(-4.95) - m(0.45), py = WY(1.95); c.fillStyle = '#c89b63'; rr(c, px, py, m(0.9), m(0.62), m(0.02)); c.fill(); c.strokeStyle = '#8a6237'; c.lineWidth = m(0.025); c.stroke();
    for (const [u, v, w, h, rot] of [[0.08, 0.1, 0.3, 0.38, -0.05], [0.45, 0.08, 0.22, 0.3, 0.06], [0.7, 0.15, 0.24, 0.32, -0.03], [0.4, 0.5, 0.34, 0.24, 0.04]]) {
      c.save(); c.translate(px + m(0.9 * u), py + m(0.62 * v)); c.rotate(rot); c.fillStyle = '#fbf9f2'; c.fillRect(0, 0, m(0.9 * w * 0.8), m(0.62 * h)); c.fillStyle = '#b9b2a2'; for (let i = 0; i < 4; i++) c.fillRect(m(0.02), m(0.03 + i * 0.04), m(0.9 * w * 0.6), m(0.012)); circle(c, m(0.9 * w * 0.4), m(0.01), m(0.015), '#d2453b'); c.restore();
    }
    // the wall clock (its hands are drawn every frame) and the deadline plate under it
    const cx = WX(CLOCK.x), cy = WY(CLOCK.y), cr = m(CLOCK.r);
    circle(c, cx, cy + m(0.01), cr + m(0.03), 'rgba(40,50,60,.18)'); circle(c, cx, cy, cr + m(0.025), '#2a2f3a'); circle(c, cx, cy, cr, '#fbfaf5');
    c.strokeStyle = '#2a2f3a'; c.lineWidth = Math.max(1, m(0.012)); for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12; c.beginPath(); c.moveTo(cx + Math.cos(a) * cr * 0.8, cy + Math.sin(a) * cr * 0.8); c.lineTo(cx + Math.cos(a) * cr * 0.94, cy + Math.sin(a) * cr * 0.94); c.stroke(); }
    const plw = m(0.62), plh = m(0.13), ply = cy + cr + m(0.09); c.fillStyle = '#c0392b'; rr(c, cx - plw / 2, ply, plw, plh, m(0.02)); c.fill();
    c.fillStyle = '#fffaf2'; c.font = `700 ${m(0.068).toFixed(1)}px Inter, system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Druck: 18 Uhr', cx, ply + plh / 2 + 1);
    // an old front page in a frame, between the screen and the press
    const fx = WX(2.95) - m(0.3), fy = WY(2.15); c.fillStyle = '#3a2a1a'; c.fillRect(fx - m(0.03), fy - m(0.03), m(0.66), m(0.86)); c.fillStyle = '#f3ecd9'; c.fillRect(fx, fy, m(0.6), m(0.8));
    c.fillStyle = '#4a4036'; c.fillRect(fx + m(0.05), fy + m(0.05), m(0.5), m(0.08)); c.fillStyle = '#b9ad94'; c.fillRect(fx + m(0.05), fy + m(0.18), m(0.24), m(0.2));
    for (let i = 0; i < 9; i++) { c.fillRect(fx + m(0.32), fy + m(0.19 + i * 0.022), m(0.22), m(0.01)); c.fillRect(fx + m(0.05), fy + m(0.42 + i * 0.036), m(i % 3 === 2 ? 0.3 : 0.5), m(0.012)); }
    // the shelf of old issues on the right
    const sx = WX(SPOTS.shelf) - m(0.6); c.fillStyle = '#8a6a4a'; c.fillRect(sx, WY(2.0), m(1.2), base - WY(2.0)); c.fillStyle = '#6d5238';
    for (let i = 0; i < 5; i++) { const y = WY(2.0 - i * 0.45) + m(0.4); c.fillRect(sx, y, m(1.2), m(0.04)); for (let j = 0; j < 4; j++) { c.fillStyle = j % 2 ? '#efe9dc' : '#e3dccc'; c.fillRect(sx + m(0.06 + j * 0.28), y - m(0.06 + (j % 3) * 0.03), m(0.24), m(0.06 + (j % 3) * 0.03)); } c.fillStyle = '#6d5238'; }
  }
  const doorBox = () => ({ x: WX(SPOTS.door) - m(DOOR.w * 0.92) / 2, y: WY(DOOR.h), w: m(DOOR.w * 0.92), h: wallBase() - WY(DOOR.h) });
  function doorLeaf(c) {           // V.door 0 shut … 1 open: the glass leaf swings into the room (hinge on the left)
    const d = doorBox(), k = Math.max(0, Math.min(1, V.door)), w = d.w * Math.cos(k * Math.PI * 0.42), lean = m(0.12) * k;
    c.fillStyle = 'rgba(225,238,244,.72)'; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + w, d.y - lean * 0.4); c.lineTo(d.x + w, d.y + d.h + lean * 0.4); c.lineTo(d.x, d.y + d.h); c.closePath(); c.fill();
    c.strokeStyle = '#7d8a90'; c.lineWidth = Math.max(1.5, m(0.04)); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(d.x + w * 0.15, d.y + d.h * 0.1); c.lineTo(d.x + w * 0.3, d.y + d.h * 0.1); c.lineTo(d.x + w * 0.12, d.y + d.h * 0.45); c.lineTo(d.x + w * 0.05, d.y + d.h * 0.45); c.fill();
    c.fillStyle = '#59636d'; c.fillRect(d.x + w * 0.82, d.y + d.h * 0.48, Math.max(2, m(0.03)), m(0.22));
  }
  function clockHands(c) {         // V.clock: minutes after midnight (1040 = 17:20)
    const cx = WX(CLOCK.x), cy = WY(CLOCK.y), rad = m(CLOCK.r), t = V.clock;
    const ah = (((t / 60) % 12) / 12) * TAU - Math.PI / 2, am = ((t % 60) / 60) * TAU - Math.PI / 2;
    c.strokeStyle = '#2a2f3a'; c.lineCap = 'round';
    c.lineWidth = Math.max(1.5, m(0.024)); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ah) * rad * 0.5, cy + Math.sin(ah) * rad * 0.5); c.stroke();
    c.lineWidth = Math.max(1, m(0.014)); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(am) * rad * 0.78, cy + Math.sin(am) * rad * 0.78); c.stroke();
    circle(c, cx, cy, Math.max(1.5, m(0.018)), '#2a2f3a');
  }

  /* ---------- the floor and what stands on it ---------- */
  function floor(c) {
    const base = wallBase();
    const g = c.createLinearGradient(0, base, 0, V.H); g.addColorStop(0, '#7f8c96'); g.addColorStop(1, '#9aa6ae');
    c.fillStyle = g; c.fillRect(0, base, V.W, V.H - base);
    c.strokeStyle = 'rgba(60,72,82,.16)'; c.lineWidth = 1;          // carpet tiles: rows toward the back, seams across
    for (let d = WALL_D; d <= 1.7; d += 0.5) { const y = Yd(d); c.beginPath(); c.moveTo(0, y); c.lineTo(V.W, y); c.stroke(); }
    for (let wx = -12; wx <= 15; wx += 0.5) { const x1 = X(wx, P), x2 = X(wx); if (Math.max(x1, x2) < -10 || Math.min(x1, x2) > V.W + 10) continue; c.beginPath(); c.moveTo(x1, base); c.lineTo(x2 + (x2 - V.W / 2) * 0.25, V.H); c.stroke(); }
    c.fillStyle = 'rgba(30,40,50,.16)'; c.fillRect(0, base, V.W, m(0.04));
    // the window's warm light on the floor
    c.fillStyle = 'rgba(255,236,200,.14)'; c.beginPath(); c.moveTo(X(WIN.x - 0.9, P), base); c.lineTo(X(WIN.x + 0.9, P), base); c.lineTo(X(WIN.x + 1.8), Yd(1.0)); c.lineTo(X(WIN.x - 0.2), Yd(1.0)); c.closePath(); c.fill();
    // Frau Adler's desk at the back (papers, a lamp, a monitor) and a plant
    const [ax, ay, ak] = at(-4.3, 0, -0.95), M = (v) => m(v) * ak;
    c.fillStyle = '#e9e4da'; c.fillRect(ax - M(0.75), ay - M(0.74), M(1.5), M(0.05)); c.fillStyle = '#b9b4aa'; c.fillRect(ax - M(0.7), ay - M(0.69), M(0.05), M(0.69)); c.fillRect(ax + M(0.65), ay - M(0.69), M(0.05), M(0.69));
    c.fillStyle = '#2a2f3a'; rr(c, ax - M(0.2), ay - M(1.15), M(0.5), M(0.34), M(0.02)); c.fill(); c.fillStyle = '#8fb4cf'; c.fillRect(ax - M(0.17), ay - M(1.12), M(0.44), M(0.27)); c.fillStyle = '#59636d'; c.fillRect(ax + M(0.03), ay - M(0.81), M(0.04), M(0.07));
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#fbf9f2' : '#ece6d8'; c.fillRect(ax - M(0.65), ay - M(0.78 + i * 0.03), M(0.32), M(0.03)); }
    const [px, py, pk] = at(2.55, 0, -1.1), Q = (v) => m(v) * pk;
    c.fillStyle = '#d9d2c4'; c.beginPath(); c.moveTo(px - Q(0.16), py); c.lineTo(px - Q(0.2), py - Q(0.4)); c.lineTo(px + Q(0.2), py - Q(0.4)); c.lineTo(px + Q(0.16), py); c.fill();
    for (const [dx, dy, rad] of [[0, -0.75, 0.22], [-0.15, -0.6, 0.16], [0.16, -0.62, 0.16], [0.02, -1.0, 0.15]]) circle(c, px + Q(dx), py + Q(dy), Q(rad), '#4f8a52');
    // Lena's office chair (she sits on it, the desk in front of her)
    const [chx, chy] = at(DESK.seat, 0, -0.04);
    c.fillStyle = '#3d4450'; c.fillRect(chx - m(0.03), chy - m(0.44), m(0.06), m(0.4)); c.fillRect(chx - m(0.25), chy - m(0.05), m(0.5), m(0.04));
    rr(c, chx - m(0.42), chy - m(1.02), m(0.12), m(0.58), m(0.05)); c.fill(); rr(c, chx - m(0.3), chy - m(0.5), m(0.5), m(0.08), m(0.03)); c.fill();
  }
  // the big freestanding screen with tomorrow's front page; its empty column glows (the lines in it: printed)
  function screen(c) {
    const S = SCREEN, [, , k] = at(S.x, 0, S.d), M = (v) => m(v) * k, P2 = (x, h) => at(x, h, S.d);
    const [lx, ly] = P2(S.x - S.w / 2, S.y0 + S.h), w = M(S.w), h = M(S.h);
    // the stand: two legs and feet
    for (const dx of [-0.75, 0.75]) { const [x0, y0] = P2(S.x + dx, 0); c.fillStyle = '#4a515c'; c.fillRect(x0 - M(0.03), y0 - M(S.y0), M(0.06), M(S.y0)); c.fillStyle = '#3a404a'; rr(c, x0 - M(0.22), y0 - M(0.04), M(0.44), M(0.05), M(0.02)); c.fill(); }
    c.fillStyle = 'rgba(20,30,40,.18)'; c.beginPath(); c.ellipse(...P2(S.x, 0).slice(0, 2), M(1.1), M(0.07), 0, 0, TAU); c.fill();
    c.fillStyle = '#23272f'; rr(c, lx - M(0.05), ly - M(0.05), w + M(0.1), h + M(0.1), M(0.05)); c.fill();
    c.fillStyle = '#fbfaf6'; c.fillRect(lx, ly, w, h);
    // the masthead
    c.fillStyle = '#1e3555'; c.fillRect(lx, ly, w, M(0.22));
    c.fillStyle = '#fbfaf6'; c.font = `700 ${M(0.13).toFixed(1)}px Fraunces, Georgia, serif`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('Stadtanzeiger', lx + M(0.08), ly + M(0.115));
    c.fillStyle = '#9fb3cc'; c.fillRect(lx + w - M(0.55), ly + M(0.09), M(0.47), M(0.035));
    // a headline, a photo and three columns of print on the left; the narrow column on the right stays empty
    c.fillStyle = '#2a2f3a'; c.fillRect(lx + M(0.08), ly + M(0.3), M(1.25), M(0.07)); c.fillRect(lx + M(0.08), ly + M(0.4), M(0.8), M(0.05));
    c.fillStyle = '#cfe0ec'; c.fillRect(lx + M(0.08), ly + M(0.52), M(0.62), M(0.4));
    c.fillStyle = '#9fc48a'; c.beginPath(); c.moveTo(lx + M(0.08), ly + M(0.92)); c.lineTo(lx + M(0.3), ly + M(0.68)); c.lineTo(lx + M(0.5), ly + M(0.82)); c.lineTo(lx + M(0.7), ly + M(0.7)); c.lineTo(lx + M(0.7), ly + M(0.92)); c.fill();
    circle(c, lx + M(0.55), ly + M(0.62), M(0.04), '#f2c94c');
    c.fillStyle = '#b9b2a2'; let n = 0;
    for (const [x0, y0, cw, rows] of [[0.08, 0.98, 0.62, 4], [0.78, 0.52, 0.5, 13], [1.34, 0.3, 0.42, 18]]) for (let i = 0; i < rows; i++) c.fillRect(lx + M(x0), ly + M(y0 + i * 0.048), M(cw * (i % 6 === 5 ? lines[n++ % 60] * 0.7 : lines[n++ % 60] > 0.9 ? 0.92 : 1)), M(0.018));
  }
  function page(c) {                // V.page 0 … 1: the narrow column fills with print from the top; until full its frame glows
    const S = SCREEN, C2 = S.col, [, , k] = at(S.x, 0, S.d), M = (v) => m(v) * k, v = Math.max(0, Math.min(1, V.page));
    const [x0, yTop] = at(C2.x - C2.w / 2, C2.y1, S.d), [, yBot] = at(C2.x, C2.y0, S.d), w = M(C2.w), rows = 17, shown = Math.round(v * rows);
    c.fillStyle = '#b9b2a2'; for (let i = 0; i < shown; i++) c.fillRect(x0 + M(0.02), yTop + M(0.02 + i * 0.048), M((C2.w - 0.04) * (i % 7 === 6 ? 0.55 : lines[(i * 7) % 60] > 0.8 ? 1 : 0.94)), M(0.018));
    if (v < 0.999) { c.save(); c.fillStyle = 'rgba(242,201,76,.12)'; c.fillRect(x0, yTop, w, yBot - yTop); c.setLineDash([M(0.04), M(0.025)]); c.strokeStyle = '#e0a92a'; c.lineWidth = Math.max(1.5, M(0.014)); c.strokeRect(x0, yTop, w, yBot - yTop); c.restore(); }
  }
  // the old printing press: two iron side frames, rollers, a flywheel; `run` 0 … 1: rattling, turning, printing
  function press(c, t = 0, run = 0) {
    const R = PRESS, [, , k] = at(R.x, 0, R.d), M = (v) => m(v) * k, jig = run ? M(0.008) * Math.sin(t * TAU * 8) : 0, A = run ? t * TAU * 2 : 0;
    const [bx, by] = at(R.x, 0, R.d); c.save(); c.translate(0, jig);
    c.fillStyle = 'rgba(20,30,40,.22)'; c.beginPath(); c.ellipse(bx, by, M(1.15), M(0.08), 0, 0, TAU); c.fill();
    // the base and the two side frames
    c.fillStyle = '#26332e'; rr(c, bx - M(1.0), by - M(0.32), M(2.0), M(0.32), M(0.03)); c.fill();
    for (const dx of [-0.75, 0.45]) { c.fillStyle = '#2f4a3f'; c.beginPath(); c.moveTo(bx + M(dx - 0.12), by - M(0.3)); c.lineTo(bx + M(dx - 0.06), by - M(1.45)); c.lineTo(bx + M(dx + 0.26), by - M(1.45)); c.lineTo(bx + M(dx + 0.32), by - M(0.3)); c.fill(); c.fillStyle = '#c99a2e'; c.fillRect(bx + M(dx), by - M(1.42), M(0.2), M(0.03)); }
    // the rollers
    for (const [dx, h, rad] of [[-0.35, 1.05, 0.14], [-0.05, 0.9, 0.17], [0.25, 1.05, 0.14]]) {
      const x = bx + M(dx), y = by - M(h); circle(c, x, y, M(rad), '#59636d'); circle(c, x, y, M(rad * 0.82), '#8b97a3');
      c.strokeStyle = '#3d4450'; c.lineWidth = Math.max(1, M(0.015)); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(A) * M(rad * 0.8), y + Math.sin(A) * M(rad * 0.8)); c.stroke();
    }
    // the paper feed (a stack, top left) and the tray (right)
    c.fillStyle = '#f3efe4'; c.beginPath(); c.moveTo(bx - M(1.15), by - M(1.3)); c.lineTo(bx - M(0.55), by - M(1.18)); c.lineTo(bx - M(0.55), by - M(1.12)); c.lineTo(bx - M(1.15), by - M(1.24)); c.fill();
    c.fillStyle = '#3a404a'; c.fillRect(bx + M(0.65), by - M(0.62), M(0.5), M(0.04));
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#f3efe4' : '#e6e0d1'; c.fillRect(bx + M(0.68), by - M(0.66 + i * 0.012), M(0.44), M(0.012)); }
    // the flywheel
    const fx = bx - M(0.95), fy = by - M(0.75), fr = M(0.42);
    c.strokeStyle = '#26332e'; c.lineWidth = M(0.06); c.beginPath(); c.arc(fx, fy, fr, 0, TAU); c.stroke(); c.lineWidth = M(0.03);
    for (let i = 0; i < 6; i++) { const a = A * 0.5 + (i * TAU) / 6; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr); c.stroke(); }
    circle(c, fx, fy, M(0.06), '#c99a2e');
    // printing: a sheet glides out onto the tray
    if (run) { const u = (t * 2) % 1; c.fillStyle = '#fbf9f2'; c.save(); c.translate(bx + M(0.4 + u * 0.55), by - M(0.95 - u * 0.25)); c.rotate(0.35 - u * 0.3); c.fillRect(-M(0.2), -M(0.01), M(0.4), M(0.02)); c.fillStyle = '#b9b2a2'; c.fillRect(-M(0.16), -M(0.03), M(0.3), M(0.012)); c.restore(); }
    c.restore();
  }
  // Lena's desk, in front of her: the top, a modesty panel, her laptop (we see its back), a mug, papers
  function deskFront(c) {
    const D = DESK, [x0, y0] = at(D.x0, D.top, D.d), [x1] = at(D.x1, 0, D.d), [, yf] = at(0, 0, D.d), w = x1 - x0;
    c.fillStyle = 'rgba(20,30,40,.18)'; c.beginPath(); c.ellipse((x0 + x1) / 2, yf, w * 0.55, m(0.06), 0, 0, TAU); c.fill();
    c.fillStyle = '#c9a77c'; c.fillRect(x0 + m(0.06), y0, m(0.05), yf - y0); c.fillRect(x1 - m(0.11), y0, m(0.05), yf - y0);
    c.fillStyle = '#e4d3b8'; c.fillRect(x0 + m(0.1), y0 + m(0.05), w - m(0.2), m(0.42));
    c.fillStyle = 'rgba(120,90,55,.18)'; c.fillRect(x0 + m(0.1), y0 + m(0.05), w - m(0.2), m(0.02));
    c.fillStyle = '#d8b98e'; rr(c, x0, y0 - m(0.02), w, m(0.06), m(0.015)); c.fill(); c.fillStyle = '#b8956a'; c.fillRect(x0, y0 + m(0.035), w, m(0.012));
    // the laptop near the right end, its lid toward Lena; a mug; a stack of papers at the left
    const lx = x1 - m(0.48); c.fillStyle = '#9aa5b1'; c.fillRect(lx - m(0.2), y0 - m(0.03), m(0.36), m(0.02));
    c.save(); c.translate(lx + m(0.14), y0 - m(0.03)); c.rotate(-0.22); c.fillStyle = '#b4bec8'; rr(c, -m(0.02), -m(0.27), m(0.03), m(0.27), m(0.01)); c.fill(); c.restore();
    c.fillStyle = '#c0392b'; rr(c, x1 - m(0.22), y0 - m(0.12), m(0.08), m(0.1), m(0.015)); c.fill(); c.strokeStyle = '#c0392b'; c.lineWidth = m(0.015); c.beginPath(); c.arc(x1 - m(0.13), y0 - m(0.07), m(0.025), -1.2, 1.2); c.stroke();
    for (let i = 0; i < 3; i++) { c.fillStyle = i % 2 ? '#fbf9f2' : '#ece6d8'; c.fillRect(x0 + m(0.08), y0 - m(0.03 + i * 0.022), m(0.32), m(0.022)); }
  }

  function cache() {
    const key = [V.W, V.H, V.cam.x.toFixed(3), V.cam.z.toFixed(2), V.gy.toFixed(1)].join('|'); if (key === V.cacheKey) return; V.cacheKey = key;
    const A = V.A; A.width = bg.width; A.height = bg.height; const c = A.getContext('2d'); c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    wall(c); floor(c); screen(c);
  }
  function draw(t) {
    cache(); V.t = t;
    const c = bg.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(V.A, 0, 0);
    c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    doorLeaf(c); clockHands(c); page(c);
    press(c, 0, 0); const run = Math.max(0, Math.min(1, V.press)); if (run > 0.001) { c.save(); c.globalAlpha = run; press(c, t % 1, 1); c.restore(); }
    const f = fg.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fg.width, fg.height); f.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    deskFront(f);
  }
  function foot(wx, d = 0) { const k = d < 0 ? 1 + d * 0.06 : 1; return { x: X(wx), y: Yd(d), k }; }
  return { V, size, setCam, draw, foot, toWorld: (sx) => (sx - V.W / 2) / V.cam.z + V.cam.x };
}
