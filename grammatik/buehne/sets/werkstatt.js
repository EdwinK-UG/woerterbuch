/* Meister Anton's workshop (an interior; plan §1.2, first used in Kapitel 5, again in 8, 13, 28, 51, 57).
   Canvas 2D like the village (grammatik/dorf/village.js), with the same interface for the stage: size, setCam,
   foot, draw, V. World units are metres; the back wall is a little slower than the floor (parallax).
   What never moves is cached per camera position; the lamp's light, the dust in it, the window's casements and
   the sign are drawn every frame. Original design: a timber workshop in the village. */

import { BILDER } from '../bilder.js';

const TAU = Math.PI * 2;
export const SPOTS = { door: -6.6, sign: -5.0, window: -3.4, planks: -1.95, tools: 0.4, bench: 3.2, shelf: 5.7, stool: 5.0 };
const WALL_D = -1.7;                        // the back wall's depth

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function createWerkstatt(bg, fg) {
  const V = { W: 1, H: 1, dpr: 1, cam: { x: 0, z: 100 }, gy: 0, hz: 0, cacheKey: '', A: document.createElement('canvas'), win: 0, sign: '', signPic: null, signGlow: 0, lamp: 1, sweep: null };
  const r = rng(11);
  const planks = Array.from({ length: 60 }, (_, i) => ({ x: -12 + i * 0.4, tone: r() }));
  const knots = Array.from({ length: 40 }, () => ({ x: -12 + r() * 24, y: 0.3 + r() * 2.2 }));
  const shavings = Array.from({ length: 70 }, () => ({ x: -7 + r() * 14, d: r() * 1.4 - 0.6, a: r() * TAU, s: 0.05 + r() * 0.06 }));
  const dust = Array.from({ length: 36 }, () => ({ u: r(), v: r(), ph: r() * TAU, sp: 0.02 + r() * 0.04 }));
  const peaks = Array.from({ length: 8 }, (_, i) => ({ x: i * 0.32 + r() * 0.1, h: 0.18 + r() * 0.2 }));

  const X = (wx, p = 1) => V.W / 2 + (wx - V.cam.x * p) * V.cam.z;
  const m = (v) => v * V.cam.z;
  const Yd = (d) => d >= 0 ? V.gy + m(d) * 0.55 : V.gy + (V.gy - V.hz) * Math.max(-1, d / 2.6);
  const P = 0.93;                                     // the wall's parallax
  const WX = (wx) => X(wx, P);
  const wallBase = () => Yd(WALL_D);
  const WY = (h) => wallBase() - m(h * 0.92);          // a height on the back wall

  function size(W, H, dpr) { V.W = W; V.H = H; V.dpr = dpr; V.cacheKey = ''; for (const c of [bg, fg]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); } }
  function setCam(x, z, ty = 0) { V.cam.x = x; V.cam.z = z; V.gy = V.H * 0.8 + ty * z; V.hz = V.gy - m(1.05); }

  function rr(c, x, y, w, h, rad) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, rad) : c.rect(x, y, w, h); }

  /* ---------- the still parts ---------- */
  function wall(c) {
    const base = wallBase();
    c.fillStyle = '#b98a5c'; c.fillRect(0, 0, V.W, base + 1);
    for (const p of planks) {                       // vertical boards with seams and a little grain
      const x = WX(p.x), w = m(0.4 * 0.92); if (x + w < 0 || x > V.W) continue;
      c.fillStyle = `hsl(28, ${38 + p.tone * 10}%, ${52 + p.tone * 9}%)`; c.fillRect(x, 0, w - 1, base);
      c.fillStyle = 'rgba(70,40,20,.28)'; c.fillRect(x + w - 2, 0, 2, base);
      c.strokeStyle = 'rgba(90,55,30,.12)'; c.lineWidth = 1; c.beginPath();
      for (let k = 1; k < 3; k++) { c.moveTo(x + w * k / 3, 0); c.bezierCurveTo(x + w * k / 3 + 3, base * 0.3, x + w * k / 3 - 3, base * 0.6, x + w * k / 3, base); } c.stroke();
    }
    for (const k of knots) { const x = WX(k.x), y = WY(k.y); c.fillStyle = 'rgba(95,55,28,.35)'; c.beginPath(); c.ellipse(x, y, m(0.035), m(0.06), 0, 0, TAU); c.fill(); }
    // the skirting board and the shadow where wall meets floor
    c.fillStyle = '#7a5232'; c.fillRect(0, base - m(0.12), V.W, m(0.12));
    // beams: one across under the roof, posts every few metres
    c.fillStyle = '#6d4526'; c.fillRect(0, WY(2.9), V.W, m(0.22));
    for (const bx of [-7.7, -2.35, 2.0, 7.4]) { const x = WX(bx); c.fillStyle = '#6d4526'; c.fillRect(x - m(0.11), WY(2.9), m(0.22), base - WY(2.9)); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x + m(0.07), WY(2.9), m(0.04), base - WY(2.9)); }
  }
  function windowFrame(c) {        // the window: the village outside (sky, mountains, the meadow); casements drawn per frame
    const x = WX(SPOTS.window), w = m(1.5), y0 = WY(2.12), h = m(1.12), y1 = y0;
    const g = c.createLinearGradient(0, y1, 0, y1 + h); g.addColorStop(0, '#8fc3ea'); g.addColorStop(0.7, '#d8eef8'); g.addColorStop(1, '#e9f5e6');
    c.fillStyle = g; c.fillRect(x - w / 2, y1, w, h);
    c.save(); c.beginPath(); c.rect(x - w / 2, y1, w, h); c.clip();
    c.fillStyle = '#a7bdd2'; c.beginPath(); c.moveTo(x - w / 2, y1 + h * 0.72);
    for (const pk of peaks) { const px = x - w / 2 + pk.x * w, ph = m(pk.h); c.lineTo(px + m(0.1), y1 + h * 0.72 - ph); c.lineTo(px + m(0.22), y1 + h * 0.72); }
    c.lineTo(x + w / 2, y1 + h * 0.72); c.lineTo(x + w / 2, y1 + h); c.lineTo(x - w / 2, y1 + h); c.fill();
    c.fillStyle = '#86b765'; c.fillRect(x - w / 2, y1 + h * 0.76, w, h * 0.24);
    c.fillStyle = '#6ea353'; c.beginPath(); c.ellipse(x - w * 0.15, y1 + h * 0.8, w * 0.4, h * 0.08, 0, 0, TAU); c.fill();
    // a chalet far off
    c.fillStyle = '#f3e2c3'; c.fillRect(x + w * 0.18, y1 + h * 0.66, m(0.16), m(0.12)); c.fillStyle = '#8a4b2e'; c.beginPath(); c.moveTo(x + w * 0.18 - m(0.03), y1 + h * 0.66); c.lineTo(x + w * 0.18 + m(0.08), y1 + h * 0.58); c.lineTo(x + w * 0.18 + m(0.19), y1 + h * 0.66); c.fill();
    c.restore();
    c.strokeStyle = '#5e3b20'; c.lineWidth = m(0.07); c.strokeRect(x - w / 2, y1, w, h);
    c.fillStyle = '#6d4526'; c.fillRect(x - w / 2 - m(0.1), y1 + h, w + m(0.2), m(0.08));          // the sill
    // a flower pot on the sill
    c.fillStyle = '#b5552f'; c.beginPath(); c.moveTo(x + w * 0.28, y1 + h); c.lineTo(x + w * 0.31, y1 + h - m(0.14)); c.lineTo(x + w * 0.41, y1 + h - m(0.14)); c.lineTo(x + w * 0.44, y1 + h); c.fill();
    for (const [dx, col] of [[0.33, '#e0465a'], [0.37, '#f2c94c'], [0.41, '#e0465a']]) { c.fillStyle = '#4e8a3c'; c.fillRect(x + w * dx, y1 + h - m(0.28), m(0.012), m(0.14)); c.fillStyle = col; c.beginPath(); c.arc(x + w * dx, y1 + h - m(0.29), m(0.035), 0, TAU); c.fill(); }
  }
  function toolWall(c) {           // a pegboard with the tools' outlines and the tools on them
    const x0 = WX(SPOTS.tools - 1.3), x1 = WX(SPOTS.tools + 1.3), y0 = WY(2.2), y1 = WY(1.05);
    c.fillStyle = '#d9b98a'; rr(c, x0, y0, x1 - x0, y1 - y0, m(0.04)); c.fill();
    c.strokeStyle = '#8a6440'; c.lineWidth = m(0.03); c.stroke();
    c.fillStyle = 'rgba(90,60,30,.35)';
    for (let gx = x0 + m(0.1); gx < x1 - m(0.05); gx += m(0.14)) for (let gy = y0 + m(0.1); gy < y1 - m(0.05); gy += m(0.14)) { c.beginPath(); c.arc(gx, gy, m(0.012), 0, TAU); c.fill(); }
    const T = (fx, fy) => [x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy];
    // a saw
    let [sx, sy] = T(0.08, 0.18); c.fillStyle = '#c9d2da'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + m(0.62), sy + m(0.06)); c.lineTo(sx + m(0.62), sy + m(0.2)); c.lineTo(sx, sy + m(0.12)); c.fill();
    c.strokeStyle = '#8b97a3'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 18; i++) { c.moveTo(sx + m(0.034 * i), sy + m(0.12 + 0.0045 * i)); c.lineTo(sx + m(0.034 * i + 0.017), sy + m(0.14 + 0.0045 * i)); } c.stroke();
    c.fillStyle = '#8f4a25'; rr(c, sx - m(0.16), sy - m(0.02), m(0.18), m(0.16), m(0.04)); c.fill();
    // a hammer
    [sx, sy] = T(0.62, 0.12); c.fillStyle = '#a5683a'; c.fillRect(sx, sy, m(0.04), m(0.42)); c.fillStyle = '#59636d'; rr(c, sx - m(0.08), sy - m(0.02), m(0.2), m(0.08), m(0.015)); c.fill();
    // a square
    [sx, sy] = T(0.8, 0.12); c.fillStyle = '#9aa6b1'; c.fillRect(sx, sy, m(0.04), m(0.4)); c.fillRect(sx, sy + m(0.36), m(0.24), m(0.04)); c.fillStyle = '#7a4a28'; c.fillRect(sx - m(0.01), sy, m(0.06), m(0.18));
    // chisels and a screwdriver
    for (let i = 0; i < 4; i++) { [sx, sy] = T(0.1 + i * 0.07, 0.62); c.fillStyle = ['#b06a35', '#c9792f', '#9b5a2b', '#3d6fa1'][i]; rr(c, sx, sy, m(0.04), m(0.13), m(0.012)); c.fill(); c.fillStyle = '#aab4be'; c.fillRect(sx + m(0.012), sy + m(0.13), m(0.016), m(0.13)); }
    // pliers and a ruler
    [sx, sy] = T(0.45, 0.6); c.strokeStyle = '#d24a3a'; c.lineWidth = m(0.03); c.lineCap = 'round'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + m(0.06), sy + m(0.25)); c.moveTo(sx + m(0.08), sy); c.lineTo(sx + m(0.03), sy + m(0.25)); c.stroke(); c.lineCap = 'butt';
    [sx, sy] = T(0.6, 0.72); c.fillStyle = '#f2c94c'; c.fillRect(sx, sy, m(0.6), m(0.06)); c.fillStyle = '#4a3b20'; for (let i = 1; i < 12; i++) c.fillRect(sx + m(0.05 * i), sy, 1, m(i % 2 ? 0.02 : 0.035));
  }
  function shelf(c) {              // a shelf left of the window with jars and a clock
    const x = WX(SPOTS.shelf), y = WY(2.0);
    c.fillStyle = '#6d4526'; c.fillRect(x - m(0.8), y, m(1.6), m(0.06));
    for (let i = 0; i < 4; i++) { const jx = x - m(0.65) + m(0.32 * i); c.fillStyle = ['rgba(190,220,230,.75)', 'rgba(220,200,150,.8)', 'rgba(190,220,230,.75)', 'rgba(180,140,90,.8)'][i]; rr(c, jx, y - m(0.24), m(0.18), m(0.24), m(0.03)); c.fill(); c.fillStyle = '#8a6440'; c.fillRect(jx - m(0.01), y - m(0.27), m(0.2), m(0.04)); }
    // the clock on the wall
    const cx = WX(SPOTS.shelf), cy = WY(2.6); c.fillStyle = '#fbf3e3'; c.beginPath(); c.arc(cx, cy, m(0.18), 0, TAU); c.fill(); c.strokeStyle = '#5e3b20'; c.lineWidth = m(0.03); c.stroke();
    c.strokeStyle = '#2a2f3a'; c.lineWidth = m(0.018); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - m(0.12)); c.moveTo(cx, cy); c.lineTo(cx + m(0.08), cy + m(0.03)); c.stroke();
  }
  function door(c) {
    const x = WX(SPOTS.door), w = m(1.05), y0 = WY(2.15), base = wallBase();
    c.fillStyle = '#5e3b20'; c.fillRect(x - w / 2 - m(0.08), y0 - m(0.08), w + m(0.16), base - y0 + m(0.08));
    c.fillStyle = '#8c5a33'; c.fillRect(x - w / 2, y0, w, base - y0);
    c.strokeStyle = 'rgba(50,28,12,.45)'; c.lineWidth = 2; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - w / 2 + w * i / 4, y0); c.lineTo(x - w / 2 + w * i / 4, base); c.stroke(); }
    c.fillStyle = '#6d4526'; c.fillRect(x - w / 2, y0 + m(0.3), w, m(0.1)); c.fillRect(x - w / 2, base - m(0.5), w, m(0.1));
    c.fillStyle = '#d8b24a'; c.beginPath(); c.arc(x + w * 0.36, y0 + m(1.05), m(0.04), 0, TAU); c.fill();
  }
  function planksLeaning(c) {      // boards leaning against the wall right of the tool wall
    const x = WX(SPOTS.planks), base = wallBase();
    for (let i = 0; i < 4; i++) { c.save(); c.translate(x + m(0.12 * i), base); c.rotate(-0.12 + i * 0.03); c.fillStyle = ['#d8a868', '#c9955a', '#e0b57a', '#c48c50'][i]; c.fillRect(-m(0.07), -m(2.0 - i * 0.12), m(0.14), m(2.0 - i * 0.12)); c.restore(); }
  }
  function floor(c) {
    const base = wallBase();
    const g = c.createLinearGradient(0, base, 0, V.H); g.addColorStop(0, '#a87a4d'); g.addColorStop(1, '#c4955f');
    c.fillStyle = g; c.fillRect(0, base, V.W, V.H - base);
    // boards running toward the back: lines from the bottom edge to the wall, slightly converging
    c.strokeStyle = 'rgba(80,50,25,.25)'; c.lineWidth = 1.2;
    for (let wx = -16; wx <= 16; wx += 0.55) { const xb = X(wx); c.beginPath(); c.moveTo(xb + (xb - V.W / 2) * 0.25, V.H); c.lineTo(X(wx, P), base); c.stroke(); }
    c.fillStyle = 'rgba(60,35,15,.18)'; c.fillRect(0, base, V.W, m(0.05));
    // a rug where people stand
    c.fillStyle = 'rgba(160,60,50,.35)'; c.beginPath(); c.ellipse(X(-0.4), Yd(0.05), m(1.9), m(0.32), 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(240,210,160,.5)'; c.lineWidth = m(0.02); c.beginPath(); c.ellipse(X(-0.4), Yd(0.05), m(1.7), m(0.26), 0, 0, TAU); c.stroke();
  }
  function stool(c) {
    const x = X(SPOTS.stool), y = Yd(-0.9);
    c.fillStyle = '#7a4f2c'; for (const dx of [-0.16, 0.16]) c.fillRect(x + m(dx) - m(0.025), y - m(0.5), m(0.05), m(0.5));
    c.fillStyle = '#9a6a3d'; rr(c, x - m(0.24), y - m(0.56), m(0.48), m(0.08), m(0.03)); c.fill();
  }
  function benchBack(c) {          // the workbench's back legs (behind the person working at it)
    const x = X(SPOTS.bench), y = Yd(-0.65);
    c.fillStyle = '#6d4526'; for (const dx of [-0.95, 0.95]) c.fillRect(x + m(dx) - m(0.05), y - m(0.86), m(0.1), m(0.86));
  }

  /* ---------- drawn every frame ---------- */
  function casements(c) {          // V.win 0 shut … 1 open: the two casements swing inward
    const x = WX(SPOTS.window), w = m(1.5), y = WY(2.12), h = m(1.12), k = V.win;
    for (const side of [-1, 1]) {
      const hinge = x + side * w / 2, cw = (w / 2) * (1 - k * 0.82), dir = -side;
      c.fillStyle = `rgba(215,235,245,${0.35 - k * 0.15})`; c.fillRect(Math.min(hinge, hinge + dir * cw), y, cw, h);
      c.strokeStyle = '#5e3b20'; c.lineWidth = m(0.05); c.strokeRect(Math.min(hinge, hinge + dir * cw), y, cw, h);
      c.lineWidth = m(0.025); c.beginPath(); c.moveTo(hinge + dir * cw / 2, y); c.lineTo(hinge + dir * cw / 2, y + h); c.moveTo(Math.min(hinge, hinge + dir * cw), y + h / 2); c.lineTo(Math.max(hinge, hinge + dir * cw), y + h / 2); c.stroke();
    }
  }
  function sign(c) {               // the sign by the door; its text comes from the scene (V.sign), wrapped on two lines
    if (V.sign == null) return;                    // null: no sign; '': an empty board waiting for its words
    const x = WX(SPOTS.sign), y = WY(1.68), w = m(1.35), h = m(0.62);
    c.save(); c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = m(0.06); c.shadowOffsetY = m(0.02);
    c.fillStyle = '#fbf3e3'; rr(c, x - w / 2, y, w, h, m(0.05)); c.fill(); c.restore();
    c.strokeStyle = V.signGlow > 0 ? `rgba(47,125,91,${0.4 + 0.6 * V.signGlow})` : '#8a6440'; c.lineWidth = m(0.03 + 0.02 * V.signGlow); rr(c, x - w / 2, y, w, h, m(0.05)); c.stroke();
    c.fillStyle = '#5e3b20'; c.beginPath(); c.arc(x, y - m(0.14), m(0.025), 0, TAU); c.fill(); c.strokeStyle = '#5e3b20'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - w * 0.35, y); c.lineTo(x, y - m(0.14)); c.lineTo(x + w * 0.35, y); c.stroke();
    // text: the verb engine and the infinitive bold (marks {v:…} {t:…})
    // a pictogram on the left (V.signPic: one of the no-… pictures in bilder.js), the words on the right
    let tw = w, tcx = x;
    if (V.signPic && BILDER[V.signPic]) {
      const ps = h * 0.86 / 100; c.save(); c.translate(x - w / 2 + m(0.04) - 40 * ps, y + h * 0.07); c.scale(ps, ps); BILDER[V.signPic](c, V.t || 0); c.restore();
      tw = w - 80 * ps - m(0.08); tcx = x + w / 2 - tw / 2 - m(0.02);
    }
    if (!V.sign) return;
    const words = V.sign.split(' '); let fs = m(0.12); c.textAlign = 'left'; c.textBaseline = 'middle';
    const font = (b) => `${b ? 700 : 500} ${fs}px Inter, system-ui, sans-serif`;
    const width = (ws) => ws.reduce((s, wd) => { c.font = font(/^\{/.test(wd)); return s + c.measureText(wd.replace(/\{[a-z]+:|\}/g, '') + ' ').width; }, 0);
    let lines = [words]; if (width(words) > tw * 0.88) { let best = 1, bd = 1e9; for (let i = 1; i < words.length; i++) { const d = Math.abs(width(words.slice(0, i)) - width(words.slice(i))); if (d < bd) { bd = d; best = i; } } lines = [words.slice(0, best), words.slice(best)]; }
    while (Math.max(...lines.map(width)) > tw * 0.9 && fs > 6) fs *= 0.92;
    lines.forEach((ln, li) => {
      let tx = tcx - width(ln) / 2; const ty = y + h * (lines.length === 1 ? 0.5 : 0.32 + li * 0.38);
      for (const wd of ln) { const b = /^\{[vt]:/.test(wd), t = wd.replace(/\{[a-z]+:|\}/g, ''); c.font = font(b); c.fillStyle = b ? '#2f7d5b' : '#3a2a1a'; c.fillText(t, tx, ty); tx += c.measureText(t + ' ').width; }
    });
  }
  function lampAndDust(c, t) {
    const x = X(-0.4, P), top = 0, y = WY(3.05) + m(0.25), sway = Math.sin(t * 0.7) * 0.02;
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, top); c.lineTo(x + m(sway), y); c.stroke();
    const lx = x + m(sway);
    const g = c.createRadialGradient(lx, y + m(0.1), m(0.05), lx, y + m(1.2), m(2.6)); g.addColorStop(0, 'rgba(255,236,180,.42)'); g.addColorStop(1, 'rgba(255,236,180,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(lx - m(0.2), y + m(0.1)); c.lineTo(lx - m(2.2), V.gy + m(0.4)); c.lineTo(lx + m(2.2), V.gy + m(0.4)); c.lineTo(lx + m(0.2), y + m(0.1)); c.fill();
    c.fillStyle = '#2f5d4a'; c.beginPath(); c.moveTo(lx - m(0.26), y + m(0.14)); c.quadraticCurveTo(lx, y - m(0.16), lx + m(0.26), y + m(0.14)); c.fill();
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(lx, y + m(0.14), m(0.06), 0, Math.PI); c.fill();
    for (const d of dust) {
      const u = (d.u + t * d.sp) % 1, px = lx + (d.v - 0.5) * m(2.4) * u + Math.sin(t * 0.8 + d.ph) * m(0.05), py = y + m(0.2) + u * (V.gy - y);
      c.fillStyle = `rgba(255,245,210,${0.55 * Math.sin(Math.PI * u)})`; c.beginPath(); c.arc(px, py, Math.max(0.8, m(0.008)), 0, TAU); c.fill();
    }
  }
  function benchFront(c) {         // the workbench top, front legs and the vice: in front of whoever works behind it
    const x = X(SPOTS.bench), y = Yd(-0.35), w = m(2.2), top = y - m(0.9);
    c.fillStyle = '#7a4f2c'; for (const dx of [-0.95, 0.95]) c.fillRect(x + m(dx) - m(0.06), top, m(0.12), y - top);
    c.fillStyle = '#6d4526'; c.fillRect(x - m(0.95), y - m(0.25), m(1.9), m(0.06));
    c.fillStyle = '#c9955a'; c.fillRect(x - w / 2, top - m(0.1), w, m(0.12)); c.fillStyle = '#a87a4d'; c.fillRect(x - w / 2, top + m(0.02), w, m(0.06));
    c.fillStyle = '#59636d'; c.fillRect(x - w / 2 + m(0.12), top - m(0.18), m(0.18), m(0.3)); c.fillStyle = '#3f4850'; c.fillRect(x - w / 2 + m(0.05), top - m(0.02), m(0.32), m(0.04));
    // a plank in the vice and a little pile of shavings on top
    c.fillStyle = '#e0b57a'; c.fillRect(x - w / 2 + m(0.3), top - m(0.16), m(1.2), m(0.07));
    c.strokeStyle = 'rgba(240,205,150,.95)'; c.lineWidth = m(0.012); for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(x + m(0.6 + i * 0.07), top - m(0.11), m(0.05), m(0.025), i, 0.3, 5.6); c.stroke(); }
  }

  function cache() {
    const key = [V.W, V.H, V.cam.x.toFixed(3), V.cam.z.toFixed(2), V.gy.toFixed(1)].join('|'); if (key === V.cacheKey) return; V.cacheKey = key;
    const A = V.A; A.width = bg.width; A.height = bg.height; const c = A.getContext('2d'); c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    wall(c); shelf(c); windowFrame(c); toolWall(c); planksLeaning(c); door(c); floor(c); stool(c); benchBack(c);
  }
  // the shavings on the floor, drawn every frame: a broom (V.sweep = its x in metres) sweeps them into a pile
  function floorBits(c) {
    for (const s of shavings) {
      if (V.sweep != null && s.x < V.sweep) continue;
      const x = X(s.x), y = Yd(s.d); if (x < -20 || x > V.W + 20) continue; c.strokeStyle = 'rgba(240,205,150,.9)'; c.lineWidth = m(0.012); c.beginPath(); c.ellipse(x, y, m(s.s), m(s.s * 0.45), s.a, 0.3, TAU - 0.6); c.stroke();
    }
    if (V.sweep == null) return;
    const n = shavings.filter((s) => s.x < V.sweep).length, px = X(V.sweep + 0.25), py = Yd(0.2);
    c.fillStyle = '#e8c48c'; c.beginPath(); c.ellipse(px, py, m(0.08 + n * 0.004), m(0.03 + n * 0.0015), 0, Math.PI, TAU); c.fill();
  }
  function broom(c, t) {            // the broom sweeps by itself (a little magic: nobody holds it)
    if (V.sweep == null || V.sweep > 6.5) return;
    const x = X(V.sweep), y = Yd(0.2), a = -0.35 + Math.sin(t * 10) * 0.15;
    c.save(); c.translate(x, y); c.rotate(a); c.strokeStyle = '#a5683a'; c.lineWidth = m(0.035); c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-m(0.25), -m(1.15)); c.stroke();
    c.fillStyle = '#d9b24a'; c.beginPath(); c.moveTo(-m(0.12), -m(0.1)); c.lineTo(m(0.12), -m(0.1)); c.lineTo(m(0.2), m(0.04)); c.lineTo(-m(0.2), m(0.04)); c.fill();
    c.strokeStyle = '#b8902e'; c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * m(0.03), -m(0.09)); c.lineTo(i * m(0.055), m(0.04)); c.stroke(); }
    c.restore();
  }
  function draw(t) {
    cache(); V.t = t;
    const c = bg.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(V.A, 0, 0);
    c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); floorBits(c); casements(c); sign(c);
    const f = fg.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fg.width, fg.height); f.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    benchFront(f); broom(f, t); lampAndDust(f, t);
  }
  function foot(wx, d = 0) { const k = d < 0 ? 1 + d * 0.06 : 1; return { x: X(wx), y: Yd(d), k }; }
  return { V, size, setCam, draw, foot, toWorld: (sx) => (sx - V.W / 2) / V.cam.z + V.cam.x };
}
