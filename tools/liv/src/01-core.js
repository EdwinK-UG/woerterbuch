/* Liv engine · core: maths, camera, two-bone IK and the toon renderer.
   World units are metres. x = screen right, y = up, z = towards the viewer (camera at yaw 0). */
const PI = Math.PI, TAU = PI * 2, D2R = PI / 180;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ss5 = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
const seg = (t, a, b) => ss((t - a) / (b - a));
const wrapPi = (a) => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const madd = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = (a) => Math.sqrt(dot(a, a));
const norm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const lcomb = (fr, l, u, f) => [fr.L[0] * l + fr.U[0] * u + fr.F[0] * f, fr.L[1] * l + fr.U[1] * u + fr.F[1] * f, fr.L[2] * l + fr.U[2] * u + fr.F[2] * f];
const UP = [0, 1, 0];

/* A body frame: L = the character's left, U = up, F = forward.
   yaw 0 faces the viewer, +yaw turns to the character's left (screen right). pitch > 0 leans forward, roll > 0 leans left. */
function frame(yaw, pitch, roll) {
  const sy = Math.sin(yaw), cy = Math.cos(yaw);
  let F = [sy, 0, cy], L = [cy, 0, -sy], U = [0, 1, 0];
  if (pitch) { const c = Math.cos(pitch), s = Math.sin(pitch); const F1 = [F[0] * c, -s, F[2] * c], U1 = [F[0] * s, c, F[2] * s]; F = F1; U = U1; }
  if (roll) { const c = Math.cos(roll), s = Math.sin(roll); const U2 = add(mul(U, c), mul(L, s)), L2 = sub(mul(L, c), mul(U, s)); U = U2; L = L2; }
  return { L, U, F };
}

/* Two-bone IK. a = root joint, t = target, hint = a point the middle joint bends towards. */
function ik2(a, t, l1, l2, hint) {
  const d = sub(t, a), dist = vlen(d);
  const dn = dist > 1e-6 ? mul(d, 1 / dist) : [0, -1, 0];
  const dc = clamp(dist, Math.abs(l1 - l2) + 1e-4, (l1 + l2) * 0.9995);
  const ca = clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1), sa = Math.sqrt(1 - ca * ca);
  let h = sub(hint, a); h = madd(h, dn, -dot(h, dn));
  let hl = vlen(h);
  if (hl < 1e-5) { h = madd([0, 0, 1], dn, -dn[2]); hl = vlen(h) || 1; }
  return { mid: add(madd(a, dn, l1 * ca), mul(h, (l1 * sa) / hl)), end: madd(a, dn, dc) };
}

class Camera {
  constructor() { this.yaw = 0; this.pitch = 10 * D2R; this.target = [0, 0.7, 0]; this.zoom = 300; this.dist = 14; this.cx = 0; this.cy = 0; this.update(); }
  update() {
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw), sp = Math.sin(this.pitch), cp = Math.cos(this.pitch);
    this.X = [cy, 0, -sy]; this.Y = [-sy * sp, cp, -cy * sp]; this.Z = [sy * cp, sp, cy * cp];
  }
  // -> [screen x, screen y, depth towards the viewer, pixels per metre at that depth]
  project(p) {
    const rx = p[0] - this.target[0], ry = p[1] - this.target[1], rz = p[2] - this.target[2];
    const x = rx * this.X[0] + ry * this.X[1] + rz * this.X[2], y = rx * this.Y[0] + ry * this.Y[1] + rz * this.Y[2], d = rx * this.Z[0] + ry * this.Z[1] + rz * this.Z[2];
    const s = this.zoom * (this.dist / Math.max(0.5, this.dist - d));
    return [this.cx + x * s, this.cy - y * s, d, s];
  }
}

/* ---------- toon renderer ----------
   A frame is a list of groups {d, shapes}. Groups are painted far to near. Inside a group all ink outlines are
   painted first and all fills after, so overlapping shapes read as one outlined silhouette.
   Shapes: c (circle), cap (tapered capsule), poly (optionally fat = swollen by r), fn (free drawing, no ink). */
function capGeom(s) {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1, d = Math.hypot(dx, dy);
  if (d < 1e-3 || d <= Math.abs(s.r1 - s.r2)) return null;
  return { a: Math.atan2(dy, dx), b: Math.acos(clamp((s.r1 - s.r2) / d, -1, 1)) };
}
function capPath(ctx, s, openA, openB) {
  const g = capGeom(s);
  if (!g) { const big = s.r1 >= s.r2; ctx.moveTo((big ? s.x1 : s.x2) + Math.max(s.r1, s.r2), big ? s.y1 : s.y2); ctx.arc(big ? s.x1 : s.x2, big ? s.y1 : s.y2, Math.max(s.r1, s.r2), 0, TAU); return; }
  const { a, b } = g;
  const p = (x, y, r, ang) => [x + Math.cos(ang) * r, y + Math.sin(ang) * r];
  const a1p = p(s.x1, s.y1, s.r1, a + b), a1m = p(s.x1, s.y1, s.r1, a - b), a2p = p(s.x2, s.y2, s.r2, a + b), a2m = p(s.x2, s.y2, s.r2, a - b);
  if (!openA && !openB) { ctx.moveTo(a1p[0], a1p[1]); ctx.arc(s.x1, s.y1, s.r1, a + b, a - b + TAU); ctx.lineTo(a2m[0], a2m[1]); ctx.arc(s.x2, s.y2, s.r2, a - b, a + b); ctx.closePath(); return; }
  if (openA && openB) { ctx.moveTo(a1p[0], a1p[1]); ctx.lineTo(a2p[0], a2p[1]); ctx.moveTo(a1m[0], a1m[1]); ctx.lineTo(a2m[0], a2m[1]); return; }
  if (openA) { ctx.moveTo(a1m[0], a1m[1]); ctx.lineTo(a2m[0], a2m[1]); ctx.arc(s.x2, s.y2, s.r2, a - b, a + b); ctx.lineTo(a1p[0], a1p[1]); return; }
  ctx.moveTo(a2p[0], a2p[1]); ctx.lineTo(a1p[0], a1p[1]); ctx.arc(s.x1, s.y1, s.r1, a + b, a - b + TAU); ctx.lineTo(a2m[0], a2m[1]);
}
// Catmull-Rom through pts (open), appended to the current path
function splineTo(ctx, pts, start) {
  const n = pts.length; if (!n) return;
  if (start) ctx.moveTo(pts[0][0], pts[0][1]); else ctx.lineTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}
function polyPath(ctx, s) {
  const pts = s.pts; if (!pts.length) return;
  if (s.path) { s.path(ctx); return; }
  ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath();
}
function drawGroups(ctx, groups, ink) {
  groups.sort((a, b) => a.d - b.d);
  const seen = new Set();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const g of groups) {
    if (g.alpha != null) { ctx.save(); ctx.globalAlpha = g.alpha; }
    const inkCol = g.ink || ink;
    // ink pass
    ctx.strokeStyle = inkCol; ctx.fillStyle = inkCol;
    for (const s of g.shapes) {
      if (s.ink === false || s.t === 'fn') continue;
      const w = s.ow * 2;
      if (s.t === 'c') { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.lineWidth = w; ctx.stroke(); }
      else if (s.t === 'cap') {
        const oa = s.ja && seen.has(s.ja), ob = s.jb && seen.has(s.jb);
        ctx.beginPath(); capPath(ctx, s, oa, ob); ctx.lineWidth = w; ctx.stroke();
      } else if (s.t === 'poly') { ctx.beginPath(); polyPath(ctx, s); ctx.lineWidth = w + (s.r || 0) * 2; ctx.stroke(); }
    }
    for (const s of g.shapes) { if (s.ja) seen.add(s.ja); if (s.jb) seen.add(s.jb); }
    // fill pass
    for (const s of g.shapes) {
      if (s.t === 'fn') { s.fn(ctx); continue; }
      if (s.f == null) continue;
      ctx.fillStyle = s.f;
      if (s.t === 'c') { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }
      else if (s.t === 'cap') { ctx.beginPath(); capPath(ctx, s, false, false); ctx.fill(); }
      else if (s.t === 'poly') { ctx.beginPath(); polyPath(ctx, s); if (s.r) { ctx.strokeStyle = s.f; ctx.lineWidth = s.r * 2; ctx.stroke(); } ctx.fill(); }
    }
    if (g.alpha != null) ctx.restore();
  }
}
// small deterministic hash for art jitter
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
