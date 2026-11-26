/* Die Wohnung: Lena's new flat on moving day (first used by the C1 film on the Futur II, id 439). An empty Altbau flat:
   high plaster walls with a cornice, a herringbone-ish parquet, two tall windows onto the street, a tiled stove, a
   doorway to the next room and the front door to the landing (the neighbour's door across it). Canvas 2D like the
   workshop and the lake, with the same interface for the stage: size, setCam, foot, draw, V. World units are metres;
   the back wall is a little slower than the floor (parallax 0.93, as the workshop's).
   Its parts (format v1 `set`): win 0 shut … 1 open (the big window's casements), wet 0 … 1 (the street outside after a
   night of rain: puddles, the sun out), eve 0 … 1 (evening in the windows), done 0 … 1 (the flat finished: pictures on
   the walls, curtains, plants, a rug, a sofa at x −0.2, a lamp with its warm light), door 0 shut … 1 open (the front door). Original design. */

const TAU = Math.PI * 2;
export const SPOTS = { door: -5.6, window: -2.2, window2: 2.4, stove: 5.4, arch: 8.4 };
const WALL_D = -1.7, P = 0.93;
const WIN = { w: 1.7, y0: 0.72, h: 1.95 };          // the windows: width, sill height, height (metres on the wall)
const DOOR = { w: 1.1, h: 2.35 };

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function createWohnung(bg, fg) {
  const V = { W: 1, H: 1, dpr: 1, cam: { x: 0, z: 100 }, gy: 0, hz: 0, cacheKey: '', A: document.createElement('canvas'), win: 0, wet: 0, eve: 0, done: 0, door: 0, t: 0 };
  const r = rng(439);
  const specks = Array.from({ length: 90 }, () => ({ x: -9 + r() * 22, y: 0.2 + r() * 3.0, a: r() }));
  const puddles = [[0.18, 0.86, 0.16], [0.55, 0.9, 0.22], [0.82, 0.84, 0.12]];

  const X = (wx, p = 1) => V.W / 2 + (wx - V.cam.x * p) * V.cam.z;
  const m = (v) => v * V.cam.z;
  const Yd = (d) => d >= 0 ? V.gy + m(d) * 0.55 : V.gy + (V.gy - V.hz) * Math.max(-1, d / 2.6);
  const WX = (wx) => X(wx, P);
  const wallBase = () => Yd(WALL_D);
  const WY = (h) => wallBase() - m(h * 0.92);            // a height on the back wall

  function size(W, H, dpr) { V.W = W; V.H = H; V.dpr = dpr; V.cacheKey = ''; for (const c of [bg, fg]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); } }
  function setCam(x, z, ty = 0) { V.cam.x = x; V.cam.z = z; V.gy = V.H * 0.8 + ty * z; V.hz = V.gy - m(1.05); }
  function rr(c, x, y, w, h, rad) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, rad) : c.rect(x, y, w, h); }
  const circle = (c, x, y, rad, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); };
  // a window's opening on screen: left, top, width, height
  const opening = (wx) => ({ x: WX(wx) - m(WIN.w * 0.92) / 2, y: WY(WIN.y0 + WIN.h), w: m(WIN.w * 0.92), h: m(WIN.h * 0.92) });
  const doorBox = () => ({ x: WX(SPOTS.door) - m(DOOR.w * 0.92) / 2, y: WY(DOOR.h), w: m(DOOR.w * 0.92), h: wallBase() - WY(DOOR.h) });

  /* ---------- the still parts ---------- */
  function wall(c) {
    const base = wallBase();
    const g = c.createLinearGradient(0, 0, 0, base); g.addColorStop(0, '#f3ecdf'); g.addColorStop(1, '#e8dcc6');
    c.fillStyle = g; c.fillRect(0, 0, V.W, base + 1);
    for (const s of specks) { const x = WX(s.x); if (x < -5 || x > V.W + 5) continue; c.fillStyle = `rgba(160,130,95,${0.05 + s.a * 0.06})`; c.beginPath(); c.arc(x, WY(s.y), Math.max(1, m(0.02)), 0, TAU); c.fill(); }
    // the ceiling and the cornice (stucco: a few mouldings)
    const top = WY(3.45); c.fillStyle = '#f7f3ec'; c.fillRect(0, 0, V.W, top);
    for (const [h, w, col] of [[3.45, 0.06, '#e0d5c2'], [3.36, 0.03, '#fbf8f2'], [3.3, 0.05, '#ddd1bb'], [3.22, 0.02, '#f6f0e5']]) { c.fillStyle = col; c.fillRect(0, WY(h), V.W, m(w)); }
    c.fillStyle = 'rgba(150,120,85,.18)'; c.fillRect(0, WY(3.2), V.W, m(0.02));
    // the skirting board
    c.fillStyle = '#f8f4ec'; c.fillRect(0, base - m(0.16), V.W, m(0.16)); c.fillStyle = 'rgba(120,95,65,.3)'; c.fillRect(0, base - m(0.16), V.W, m(0.012)); c.fillStyle = 'rgba(90,70,50,.25)'; c.fillRect(0, base - m(0.02), V.W, m(0.02));
    // the doorway to the next room (dark, with a hint of its floor)
    const ax = WX(SPOTS.arch), aw = m(1.3), at = WY(2.45);
    c.fillStyle = '#cdbfa6'; rr(c, ax - aw / 2, at, aw, base - at, [m(0.6), m(0.6), 0, 0]); c.fill();
    c.fillStyle = '#b9a98c'; c.fillRect(ax - aw / 2, base - m(0.25), aw, m(0.25));
    c.strokeStyle = '#faf6ee'; c.lineWidth = m(0.07); rr(c, ax - aw / 2, at, aw, base - at, [m(0.6), m(0.6), 0, 0]); c.stroke();
    // the bare bulb hanging from the ceiling (the finished flat gets a shade: done)
    const bx = WX(-0.1), by = WY(2.85); c.strokeStyle = '#4a4036'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, top); c.lineTo(bx, by); c.stroke();
    c.fillStyle = '#3a3530'; c.fillRect(bx - m(0.025), by, m(0.05), m(0.06)); circle(c, bx, by + m(0.1), m(0.05), '#fff6d8');
  }
  // the street outside: the opposite houses, a strip of sky, the road below (day dry, after the rain, or evening)
  function view(c, mode = 'day') {
    for (const wx of [SPOTS.window, SPOTS.window2]) {
      const o = opening(wx); c.save(); c.beginPath(); c.rect(o.x, o.y, o.w, o.h); c.clip();
      const eve = mode === 'eve', wet = mode === 'wet';
      const sky = c.createLinearGradient(0, o.y, 0, o.y + o.h * 0.4);
      if (eve) { sky.addColorStop(0, '#1f2a4d'); sky.addColorStop(1, '#5b4f7a'); } else { sky.addColorStop(0, wet ? '#8cc4ea' : '#a9d2ee'); sky.addColorStop(1, '#dcefff'); }
      c.fillStyle = sky; c.fillRect(o.x, o.y, o.w, o.h);
      if (wet) { circle(c, o.x + o.w * 0.8, o.y + o.h * 0.1, m(0.1), '#fff2b8'); }
      // the houses across the street (two facades)
      const fy = o.y + o.h * 0.16, fh = o.h * 0.62;
      for (const [k, col] of [[0, eve ? '#6b5a52' : '#e3c79a'], [0.52, eve ? '#5a5560' : '#d9b8a8']]) {
        const x0 = o.x + o.w * k - m(0.05), w = o.w * 0.56; c.fillStyle = col; c.fillRect(x0, fy, w, fh);
        c.fillStyle = eve ? '#3b3440' : 'rgba(255,255,255,.35)'; c.fillRect(x0, fy, w, m(0.04));
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
          const wx2 = x0 + w * (0.14 + i * 0.29), wy = fy + fh * (0.12 + j * 0.3), ww = w * 0.16, wh = fh * 0.18;
          c.fillStyle = eve ? ((i + j * 2 + (k ? 1 : 0)) % 3 ? '#f4c86a' : '#2e2a36') : '#9fc4dc'; c.fillRect(wx2, wy, ww, wh);
          c.fillStyle = eve ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.8)'; c.fillRect(wx2, wy + wh, ww, m(0.02));
        }
      }
      // the road and the pavement
      const ry = fy + fh;
      c.fillStyle = eve ? '#454553' : '#b8b2a6'; c.fillRect(o.x, ry, o.w, m(0.06));
      c.fillStyle = eve ? '#2e2f3a' : wet ? '#5d6470' : '#8b8d92'; c.fillRect(o.x, ry + m(0.06), o.w, o.y + o.h - ry);
      if (wet) for (const [u, v, w] of puddles) {
        const px = o.x + o.w * u, py = o.y + o.h * v; c.fillStyle = 'rgba(190,225,250,.85)'; c.beginPath(); c.ellipse(px, py, m(w), m(w * 0.22), 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(px - m(w * 0.3), py - m(0.005), m(w * 0.35), m(w * 0.05), 0, 0, TAU); c.fill();
      }
      if (eve) { const lx = o.x + o.w * 0.3; c.fillStyle = '#2a2b33'; c.fillRect(lx - m(0.01), fy + fh * 0.25, m(0.02), fh * 0.8); const lg = c.createRadialGradient(lx, fy + fh * 0.25, 0, lx, fy + fh * 0.25, m(0.25)); lg.addColorStop(0, 'rgba(255,220,140,.95)'); lg.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = lg; c.fillRect(lx - m(0.25), fy + fh * 0.25 - m(0.25), m(0.5), m(0.5)); }
      c.restore();
    }
  }
  // the window frames, sills and radiators; the tiled stove; the front door's frame with the landing behind it
  function frames(c) {
    for (const wx of [SPOTS.window, SPOTS.window2]) {
      const o = opening(wx);
      c.strokeStyle = '#fbf8f1'; c.lineWidth = m(0.1); c.strokeRect(o.x - m(0.05), o.y - m(0.05), o.w + m(0.1), o.h + m(0.1));
      c.strokeStyle = 'rgba(120,100,75,.25)'; c.lineWidth = 1; c.strokeRect(o.x - m(0.1), o.y - m(0.1), o.w + m(0.2), o.h + m(0.2));
      // the transom bar and the fixed upper lights
      c.fillStyle = '#fbf8f1'; c.fillRect(o.x, o.y + o.h * 0.24, o.w, m(0.06)); c.fillRect(o.x + o.w / 2 - m(0.025), o.y, m(0.05), o.h * 0.24);
      c.fillStyle = '#e9e2d4'; c.fillRect(o.x - m(0.14), o.y + o.h, o.w + m(0.28), m(0.06)); c.fillStyle = 'rgba(90,70,50,.2)'; c.fillRect(o.x - m(0.14), o.y + o.h + m(0.06), o.w + m(0.28), m(0.02));
      // a radiator under the sill
      const ry = o.y + o.h + m(0.16), rh = WY(0.12) - ry; c.fillStyle = '#efeae0'; rr(c, o.x + m(0.1), ry, o.w - m(0.2), rh, m(0.03)); c.fill();
      c.strokeStyle = 'rgba(120,105,85,.35)'; c.lineWidth = 1; for (let x = o.x + m(0.18); x < o.x + o.w - m(0.12); x += m(0.08)) { c.beginPath(); c.moveTo(x, ry + m(0.03)); c.lineTo(x, ry + rh - m(0.03)); c.stroke(); }
    }
    // the tiled stove (Kachelofen) with a brass door
    const sx = WX(SPOTS.stove), sw = m(1.0), base = wallBase(), top = WY(2.35);
    c.fillStyle = '#e6eee6'; rr(c, sx - sw / 2, top, sw, base - top, m(0.04)); c.fill();
    c.strokeStyle = 'rgba(90,120,100,.45)'; c.lineWidth = 1;
    for (let y = top + m(0.22); y < base; y += m(0.22)) { c.beginPath(); c.moveTo(sx - sw / 2, y); c.lineTo(sx + sw / 2, y); c.stroke(); }
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(sx - sw / 2 + (sw * i) / 4, top); c.lineTo(sx - sw / 2 + (sw * i) / 4, base); c.stroke(); }
    c.fillStyle = '#d4e1d6'; c.fillRect(sx - sw / 2 - m(0.06), top - m(0.08), sw + m(0.12), m(0.1)); c.fillRect(sx - sw / 2 - m(0.04), base - m(0.32), sw + m(0.08), m(0.08));
    c.fillStyle = '#c99a2e'; rr(c, sx - m(0.16), base - m(0.75), m(0.32), m(0.26), m(0.03)); c.fill(); c.fillStyle = '#7a5a1a'; c.fillRect(sx - m(0.1), base - m(0.66), m(0.2), m(0.03));
    // the front door's frame; behind it the landing: banister, stairs and the neighbour's door across
    const d = doorBox();
    c.fillStyle = '#d8cdb8'; c.fillRect(d.x, d.y, d.w, d.h);
    c.fillStyle = '#7a4f2c'; rr(c, d.x + d.w * 0.22, d.y + d.h * 0.1, d.w * 0.56, d.h * 0.9, m(0.02)); c.fill();
    c.fillStyle = '#d8b24a'; circle(c, d.x + d.w * 0.7, d.y + d.h * 0.58, m(0.025), '#d8b24a');
    c.fillStyle = '#b39a76'; c.fillRect(d.x, d.y + d.h * 0.92, d.w, d.h * 0.08);
    c.strokeStyle = '#6d4526'; c.lineWidth = m(0.03); c.beginPath(); c.moveTo(d.x, d.y + d.h * 0.55); c.lineTo(d.x + d.w * 0.18, d.y + d.h * 0.45); c.stroke();
    c.strokeStyle = '#fbf8f1'; c.lineWidth = m(0.09); c.strokeRect(d.x - m(0.045), d.y - m(0.045), d.w + m(0.09), d.h + m(0.045));
    c.fillStyle = '#fbf8f1'; c.fillRect(d.x - m(0.12), d.y - m(0.16), d.w + m(0.24), m(0.07));
  }
  // the parquet: boards across, rows toward the back, joints staggered
  function floor(c) {
    const base = wallBase();
    const g = c.createLinearGradient(0, base, 0, V.H); g.addColorStop(0, '#b98552'); g.addColorStop(1, '#d4a26a');
    c.fillStyle = g; c.fillRect(0, base, V.W, V.H - base);
    c.strokeStyle = 'rgba(110,70,35,.28)'; c.lineWidth = 1;
    const rows = []; for (let d = WALL_D; d <= 1.7; d += 0.16) rows.push(d);
    rows.forEach((d, i) => {
      const y = Yd(d); c.beginPath(); c.moveTo(0, y); c.lineTo(V.W, y); c.stroke();
      const y2 = Yd(Math.min(1.7, d + 0.16)), off = (i % 2) * 0.45;
      for (let wx = -12 + off; wx <= 15; wx += 0.9) { const x1 = X(wx, P + (1 - P) * Math.min(1, (d - WALL_D) / 1.7)), x2 = X(wx, P + (1 - P) * Math.min(1, (d + 0.16 - WALL_D) / 1.7)); if (x1 < -10 || x1 > V.W + 10) continue; c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y2); c.stroke(); }
    });
    c.fillStyle = 'rgba(60,35,15,.16)'; c.fillRect(0, base, V.W, m(0.05));
    // a soft daylight patch from each window on the floor
    for (const wx of [SPOTS.window, SPOTS.window2]) { c.fillStyle = 'rgba(255,248,225,.16)'; c.beginPath(); c.moveTo(X(wx - 0.7, P), base); c.lineTo(X(wx + 0.7, P), base); c.lineTo(X(wx + 1.3), Yd(1.0)); c.lineTo(X(wx - 0.3), Yd(1.0)); c.closePath(); c.fill(); }
  }

  /* ---------- the parts that change ---------- */
  function casements(c) {          // V.win 0 shut … 1 open: the big window's two lower casements swing inward
    const o = opening(SPOTS.window), k = V.win, y = o.y + o.h * 0.24 + m(0.06), h = o.h * 0.76 - m(0.06);
    for (const side of [-1, 1]) {
      const hinge = o.x + o.w / 2 + side * o.w / 2, cw = (o.w / 2) * (1 - k * 0.8), dir = -side, x0 = Math.min(hinge, hinge + dir * cw);
      c.fillStyle = `rgba(225,240,250,${0.3 - k * 0.12})`; c.fillRect(x0, y, cw, h);
      c.strokeStyle = '#fbf8f1'; c.lineWidth = m(0.05); c.strokeRect(x0, y, cw, h);
      c.lineWidth = m(0.025); c.beginPath(); c.moveTo(x0, y + h * 0.5); c.lineTo(x0 + cw, y + h * 0.5); c.stroke();
      c.fillStyle = '#c9c2b4'; c.fillRect(hinge + dir * cw * 0.85 - m(0.012), y + h * 0.48, m(0.024), m(0.08));
    }
    // the second window stays shut
    const o2 = opening(SPOTS.window2), y2 = o2.y + o2.h * 0.24 + m(0.06), h2 = o2.h * 0.76 - m(0.06);
    c.fillStyle = 'rgba(225,240,250,.3)'; c.fillRect(o2.x, y2, o2.w, h2); c.strokeStyle = '#fbf8f1'; c.lineWidth = m(0.05); c.strokeRect(o2.x, y2, o2.w / 2, h2); c.strokeRect(o2.x + o2.w / 2, y2, o2.w / 2, h2);
    c.lineWidth = m(0.025); c.beginPath(); c.moveTo(o2.x, y2 + h2 / 2); c.lineTo(o2.x + o2.w, y2 + h2 / 2); c.stroke();
  }
  function doorLeaf(c) {           // V.door 0 shut … 1 open: the leaf swings into the room (hinge on the left)
    const d = doorBox(), k = Math.max(0, Math.min(1, V.door)), w = d.w * Math.cos(k * Math.PI * 0.42), lean = m(0.12) * k;
    c.fillStyle = '#f4efe6'; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + w, d.y - lean * 0.4); c.lineTo(d.x + w, d.y + d.h + lean * 0.4); c.lineTo(d.x, d.y + d.h); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,100,75,.45)'; c.lineWidth = 1; c.stroke();
    for (const [v0, v1] of [[0.07, 0.45], [0.52, 0.93]]) { c.beginPath(); c.moveTo(d.x + w * 0.15, d.y + d.h * v0); c.lineTo(d.x + w * 0.85, d.y + d.h * v0 - lean * 0.1); c.lineTo(d.x + w * 0.85, d.y + d.h * v1 + lean * 0.1); c.lineTo(d.x + w * 0.15, d.y + d.h * v1); c.closePath(); c.stroke(); }
    c.fillStyle = '#c9a23a'; c.beginPath(); c.arc(d.x + w * 0.88, d.y + d.h * 0.5, Math.max(1.5, m(0.03)), 0, TAU); c.fill();
  }
  // the finished flat (V.done fades it in): curtains, framed pictures, plants on the sills, a lamp shade with its light
  function doneWall(c) {
    for (const wx of [SPOTS.window, SPOTS.window2]) {
      const o = opening(wx);
      c.fillStyle = '#c96f53'; c.fillRect(o.x - m(0.32), WY(3.15), o.w + m(0.64), m(0.04));
      for (const s of [-1, 1]) {
        const cx = s < 0 ? o.x - m(0.2) : o.x + o.w + m(0.2), cw = m(0.32);
        c.fillStyle = '#8fae8b'; c.beginPath(); c.moveTo(cx - cw / 2, WY(3.12)); c.lineTo(cx + cw / 2, WY(3.12)); c.quadraticCurveTo(cx + cw * 0.2, WY(1.6), cx + cw / 2 + s * m(0.04), WY(0.62)); c.lineTo(cx - cw / 2 + s * m(0.04), WY(0.62)); c.quadraticCurveTo(cx - cw * 0.3, WY(1.6), cx - cw / 2, WY(3.12)); c.fill();
        c.strokeStyle = 'rgba(70,100,70,.35)'; c.lineWidth = 1; for (const u of [-0.2, 0.15]) { c.beginPath(); c.moveTo(cx + cw * u, WY(3.1)); c.lineTo(cx + cw * u, WY(0.7)); c.stroke(); }
      }
      // a plant on the sill
      const px = o.x + o.w * 0.78, py = o.y + o.h; c.fillStyle = '#b5552f'; c.beginPath(); c.moveTo(px - m(0.09), py); c.lineTo(px - m(0.07), py - m(0.14)); c.lineTo(px + m(0.07), py - m(0.14)); c.lineTo(px + m(0.09), py); c.fill();
      for (const [dx, dy, rad] of [[0, -0.28, 0.12], [-0.1, -0.2, 0.09], [0.1, -0.21, 0.09]]) circle(c, px + m(dx), py + m(dy), m(rad), '#4f8a52');
    }
    // framed pictures
    for (const [wx, h, w, hh, col] of [[-3.95, 1.75, 0.7, 0.9, '#2f7fd1'], [0.1, 1.85, 0.9, 0.62, '#e8873a'], [3.9, 1.7, 0.55, 0.75, '#4f8a52'], [7.0, 1.8, 0.8, 0.55, '#9b6ee8']]) {
      const x = WX(wx) - m(w) / 2, y = WY(h + hh);
      c.fillStyle = '#3a2a1a'; c.fillRect(x - m(0.04), y - m(0.04), m(w) + m(0.08), m(hh) + m(0.08)); c.fillStyle = '#fbf6ea'; c.fillRect(x, y, m(w), m(hh));
      c.fillStyle = col; c.globalAlpha = 0.75; c.beginPath(); c.moveTo(x + m(w * 0.08), y + m(hh * 0.85)); c.lineTo(x + m(w * 0.4), y + m(hh * 0.35)); c.lineTo(x + m(w * 0.62), y + m(hh * 0.62)); c.lineTo(x + m(w * 0.78), y + m(hh * 0.45)); c.lineTo(x + m(w * 0.92), y + m(hh * 0.85)); c.closePath(); c.fill(); c.globalAlpha = 1;
      circle(c, x + m(w * 0.75), y + m(hh * 0.25), m(Math.min(w, hh) * 0.08), '#f2c94c');
    }
    // the lamp shade over the bulb
    const bx = WX(-0.1), by = WY(2.85); c.fillStyle = '#f2c94c'; c.beginPath(); c.moveTo(bx - m(0.28), by + m(0.2)); c.lineTo(bx - m(0.12), by - m(0.04)); c.lineTo(bx + m(0.12), by - m(0.04)); c.lineTo(bx + m(0.28), by + m(0.2)); c.closePath(); c.fill();
    c.fillStyle = '#d9a72e'; c.fillRect(bx - m(0.28), by + m(0.18), m(0.56), m(0.03));
  }
  function doneLight(c) {          // the lamp's warm light falling into the room
    const bx = WX(-0.1), by = WY(2.85) + m(0.2);
    const g = c.createRadialGradient(bx, by, m(0.05), bx, by + m(1.4), m(3.2)); g.addColorStop(0, 'rgba(255,224,150,.45)'); g.addColorStop(1, 'rgba(255,224,150,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(bx - m(0.28), by); c.lineTo(bx - m(2.8), V.gy + m(0.6)); c.lineTo(bx + m(2.8), V.gy + m(0.6)); c.lineTo(bx + m(0.28), by); c.fill();
  }
  // the new sofa (behind whoever sits on it; the prop `sofa` is its front: seat and arms over their laps)
  function sofa(c) {
    const f = { x: X(-0.2), y: Yd(-0.25) }, k = 1 - 0.25 * 0.06, M = (v) => m(v) * k, R = (x, y, w, h, r, col) => { c.fillStyle = col; rr(c, f.x + M(x), f.y - M(y + h), M(w), M(h), M(r)); c.fill(); };
    R(-0.98, 0.0, 0.08, 0.12, 0.01, '#4c7a75'); R(0.9, 0.0, 0.08, 0.12, 0.01, '#4c7a75');
    R(-1.05, 0.38, 2.1, 0.6, 0.12, '#5f8f8a'); R(-0.98, 0.1, 1.96, 0.42, 0.08, '#56857f');
    R(-0.85, 0.5, 0.42, 0.34, 0.08, '#e8873a'); R(0.43, 0.5, 0.42, 0.34, 0.08, '#f2c94c');
    R(-1.12, 0.1, 0.24, 0.55, 0.1, '#6fa19b'); R(0.88, 0.1, 0.24, 0.55, 0.1, '#6fa19b');
  }
  function doneFloor(c) {          // a rug where people stand
    c.fillStyle = '#b5554a'; c.beginPath(); c.ellipse(X(0.2), Yd(0.0), m(2.2), m(0.42), 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(250,225,180,.7)'; c.lineWidth = m(0.03); c.beginPath(); c.ellipse(X(0.2), Yd(0.0), m(1.95), m(0.34), 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(250,225,180,.45)'; c.beginPath(); c.ellipse(X(0.2), Yd(0.0), m(1.3), m(0.2), 0, 0, TAU); c.stroke();
    sofa(c);
  }

  function cache() {
    const key = [V.W, V.H, V.cam.x.toFixed(3), V.cam.z.toFixed(2), V.gy.toFixed(1)].join('|'); if (key === V.cacheKey) return; V.cacheKey = key;
    const A = V.A; A.width = bg.width; A.height = bg.height; const c = A.getContext('2d'); c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    wall(c); view(c, 'day'); frames(c); floor(c);
  }
  function fade(c, a, f) { if (a <= 0.001) return; c.save(); c.globalAlpha = Math.min(1, a); f(c); c.restore(); }
  function draw(t) {
    cache(); V.t = t;
    const c = bg.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(V.A, 0, 0);
    c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    // the window views change over the cached day view, then the frames go on top again
    if (V.wet > 0.001 || V.eve > 0.001) { fade(c, V.wet, (cc) => view(cc, 'wet')); fade(c, V.eve, (cc) => view(cc, 'eve')); frames(c); }
    casements(c); doorLeaf(c);
    fade(c, V.done, (cc) => { doneFloor(cc); doneWall(cc); doneLight(cc); });
    const f = fg.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fg.width, fg.height);
  }
  function foot(wx, d = 0) { const k = d < 0 ? 1 + d * 0.06 : 1; return { x: X(wx), y: Yd(d), k }; }
  return { V, size, setCam, draw, foot, toWorld: (sx) => (sx - V.W / 2) / V.cam.z + V.cam.x };
}
