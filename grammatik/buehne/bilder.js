/* Bilder: small animated pictures of what a sentence means, shown in a speech or thought bubble while a character
   says it (the user's review of Kap 5: every example sentence needs its meaning on screen). Each picture draws
   itself into a 160 × 100 box at time t (seconds), in the flat style of the sets. No text: they work for every
   language level. ICONS are the modal verbs' signs (plan Kap 6: a medal for können …), drawn in a corner badge. */
const TAU = Math.PI * 2;
const C = { ink: '#2a2f3a', wood: '#a8733f', dark: '#7a4a2a', red: '#d2453b', green: '#4f8a52', blue: '#2f7fd1', sky: '#cfe7f5', sun: '#f2c94c', pot: '#59636d', skin: '#f1c8a5', cream: '#fdf7ec' };
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
const circle = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
function steam(c, x, y, t, n = 3) {
  c.strokeStyle = 'rgba(160,170,180,.75)'; c.lineWidth = 2.5; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const k = (t * 0.6 + i / n) % 1, xx = x + (i - (n - 1) / 2) * 12; c.globalAlpha = Math.sin(Math.PI * k);
    c.beginPath(); c.moveTo(xx, y - k * 26); c.bezierCurveTo(xx + 6, y - k * 26 - 6, xx - 6, y - k * 26 - 12, xx, y - k * 26 - 18); c.stroke(); }
  c.globalAlpha = 1;
}
function pot(c, x, y, t, ladle = 1) {         // a soup pot on a little stove, with flames and a ladle that stirs
  for (let i = 0; i < 3; i++) { const f = 0.8 + 0.2 * Math.sin(t * 14 + i * 2); c.fillStyle = i % 2 ? '#f2994a' : '#f2c94c'; c.beginPath(); c.moveTo(x - 14 + i * 14, y + 18); c.quadraticCurveTo(x - 18 + i * 14, y + 18 - 10 * f, x - 14 + i * 14, y + 18 - 16 * f); c.quadraticCurveTo(x - 10 + i * 14, y + 18 - 10 * f, x - 14 + i * 14, y + 18); c.fill(); }
  c.fillStyle = '#3d4f6b'; c.fillRect(x - 30, y + 18, 60, 6);
  c.fillStyle = C.pot; rr(c, x - 26, y - 12, 52, 30, 6); c.fill(); c.fillStyle = '#6f7a86'; c.fillRect(x - 30, y - 14, 60, 5);
  c.fillStyle = '#e8873a'; c.beginPath(); c.ellipse(x, y - 12, 23, 4, 0, 0, TAU); c.fill();                 // soup
  circle(c, x - 8, y - 12, 2.5, '#f26b3a'); circle(c, x + 6, y - 11, 2.5, C.green);
  for (let i = 0; i < ladle; i++) { const a = t * 3 + i * Math.PI; c.save(); c.translate(x + Math.cos(a) * 9, y - 12 + Math.sin(a) * 2); c.rotate(-0.4 + i * 0.8);
    c.strokeStyle = i ? '#b06a35' : '#8b97a3'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(10, -30); c.stroke(); c.restore(); }
  steam(c, x, y - 18, t);
}
function clockFace(c, x, y, r, h, m, ring = 0) {
  const sh = ring ? Math.sin(ring * 40) * 2 : 0; c.save(); c.translate(x + sh, y);
  if (ring) { circle(c, -r * 0.6, -r * 0.95, r * 0.35, '#c9d2da'); circle(c, r * 0.6, -r * 0.95, r * 0.35, '#c9d2da'); }
  circle(c, 0, 0, r, C.red); circle(c, 0, 0, r * 0.8, C.cream);
  c.strokeStyle = C.ink; c.lineWidth = 2; c.lineCap = 'round';
  const ah = (h % 12 + m / 60) / 12 * TAU - Math.PI / 2, am = m / 60 * TAU - Math.PI / 2;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ah) * r * 0.45, Math.sin(ah) * r * 0.45); c.moveTo(0, 0); c.lineTo(Math.cos(am) * r * 0.65, Math.sin(am) * r * 0.65); c.stroke();
  c.restore();
  if (ring) { c.strokeStyle = C.ink; c.lineWidth = 1.5; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(x, y, r + 5 + i * 5, s > 0 ? -0.5 : Math.PI - 0.5 + 1, s > 0 ? 0.5 : Math.PI + 0.5); c.stroke(); } }
}
function question(c, x, y, s = 1) { c.fillStyle = C.blue; c.font = `800 ${26 * s}px Inter, system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', x, y); }
function noSign(c, x, y, r, draw) {           // a pictogram in a red circle with a slash
  circle(c, x, y, r, '#fff'); c.save(); c.beginPath(); c.arc(x, y, r * 0.86, 0, TAU); c.clip(); draw(); c.restore();
  c.strokeStyle = '#d32f2f'; c.lineWidth = r * 0.16; c.beginPath(); c.arc(x, y, r * 0.9, 0, TAU); c.stroke();
  c.beginPath(); c.moveTo(x - r * 0.64, y - r * 0.64); c.lineTo(x + r * 0.64, y + r * 0.64); c.stroke();
}
function person(c, x, y, s, col, t = 0, pose = 'stand') {   // a tiny figure: head, body, arms, legs
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round';
  circle(c, 0, -34, 7, C.skin); c.fillStyle = '#5b3b26'; c.beginPath(); c.arc(0, -36, 7.4, Math.PI, TAU); c.fill();
  c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.moveTo(0, -26); c.lineTo(0, -8); c.stroke();
  c.lineWidth = 4; const sw = pose === 'dance' ? Math.sin(t * 6) : 0;
  c.beginPath(); c.moveTo(0, -22); c.lineTo(-10, pose === 'dance' ? -32 + sw * 6 : -12); c.moveTo(0, -22); c.lineTo(10, pose === 'dance' ? -32 - sw * 6 : -12); c.stroke();
  c.strokeStyle = C.ink; c.beginPath(); c.moveTo(0, -8); c.lineTo(-5 + sw * 3, 6); c.moveTo(0, -8); c.lineTo(5 - sw * 3, 6); c.stroke();
  c.restore();
}

/* the lake film (id 97): water, the ferry, a rowing boat, a lilac sparkle */
function water(c, y, t, col = '#5fa9d8') {
  c.fillStyle = col; c.fillRect(0, y, 160, 100 - y); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) { const x = ((i * 31 + t * 12) % 180) - 10, yy = y + 6 + (i % 3) * 9; c.beginPath(); c.moveTo(x, yy); c.quadraticCurveTo(x + 6, yy - 3, x + 12, yy); c.stroke(); }
}
function ferry(c, x, y, s = 1, left = false) {
  c.save(); c.translate(x, y); c.scale(left ? -s : s, s);
  c.fillStyle = '#2f4a6b'; c.beginPath(); c.moveTo(-30, -6); c.lineTo(30, -6); c.lineTo(26, 3); c.lineTo(-27, 3); c.closePath(); c.fill();
  c.fillStyle = '#f7f4ec'; c.fillRect(-28, -11, 57, 5); rr(c, -18, -24, 36, 13, 2); c.fill(); c.fillStyle = '#8fc3ea'; for (let i = 0; i < 5; i++) c.fillRect(-15 + i * 7, -21, 4, 5);
  c.fillStyle = C.red; c.fillRect(17, -30, 5, 7); c.restore();
}
function rowboat(c, x, y, s = 1, row = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = C.wood; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-6, -8); c.lineTo(-20 + Math.sin(row) * 6, 6); c.moveTo(-6, -8); c.lineTo(8 + Math.sin(row) * 6, 6); c.stroke();
  c.fillStyle = '#b8432f'; c.beginPath(); c.moveTo(-30, -8); c.lineTo(30, -8); c.quadraticCurveTo(26, 3, 18, 4); c.lineTo(-20, 4); c.quadraticCurveTo(-28, 2, -30, -8); c.fill();
  c.fillStyle = '#f2e4c4'; c.fillRect(-30, -9, 60, 2); c.restore();
}
function sparkle(c, x, y, r, a = 1) {
  c.save(); c.globalAlpha = a; c.fillStyle = '#b48cf0'; c.beginPath(); for (let i = 0; i < 8; i++) { const q = (i * Math.PI) / 4, rr2 = i % 2 ? r * 0.3 : r; c.lineTo(x + Math.cos(q) * rr2, y + Math.sin(q) * rr2); } c.closePath(); c.fill(); c.restore();
}
function hatMan(c, x, y, s, t, straw = false) {   // Opa: grey hair, a moustache, maybe a straw hat
  person(c, x, y, s, '#7a5434', t); c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#d8d8d8'; c.beginPath(); c.arc(0, -36, 7.4, Math.PI, TAU); c.fill(); c.fillStyle = '#e8e8e8'; c.fillRect(-4, -31, 8, 2.2);
  if (straw) { c.fillStyle = '#e8c86a'; c.beginPath(); c.ellipse(0, -41, 12, 3, 0, 0, TAU); c.fill(); c.fillRect(-6, -48, 12, 7); c.fillStyle = C.red; c.fillRect(-6, -43, 12, 2); }
  c.restore();
}
function girl(c, x, y, s, t, pose) {               // Lena: a red dress, a ponytail
  person(c, x, y, s, '#b5455a', t, pose); c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#5b3b26'; c.beginPath(); c.ellipse(-8, -34, 3, 6, 0.4, 0, TAU); c.fill(); c.restore();
}

/* the Futur II film (id 439): someone walking or running (legs and arms swing with ph), a wall calendar, a big tick */
function walker(c, x, y, s, col, ph, hair = '#5b3b26', left = false) {
  c.save(); c.translate(x, y); c.scale(left ? -s : s, s); c.lineCap = 'round';
  const a = Math.sin(ph) * 0.6;
  c.strokeStyle = C.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -8); c.lineTo(Math.sin(a) * 12, 6 - Math.abs(Math.sin(a)) * 2); c.moveTo(0, -8); c.lineTo(-Math.sin(a) * 12, 6 - Math.abs(Math.sin(a)) * 2); c.stroke();
  c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.moveTo(0, -26); c.lineTo(1, -8); c.stroke();
  c.lineWidth = 4; c.beginPath(); c.moveTo(0, -22); c.lineTo(-Math.sin(a) * 11, -12); c.moveTo(0, -22); c.lineTo(Math.sin(a) * 11, -12); c.stroke();
  circle(c, 1, -34, 7, C.skin); c.fillStyle = hair; c.beginPath(); c.arc(1, -36, 7.4, Math.PI, TAU); c.fill();
  c.restore();
}
function calendar(c, x, y, s, mark) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#fffdf6'; rr(c, -24, -22, 48, 46, 3); c.fill(); c.strokeStyle = '#c9c0ad'; c.lineWidth = 1; c.stroke(); c.fillStyle = C.red; c.fillRect(-24, -22, 48, 11);
  c.fillStyle = '#59636d'; for (const dx of [-12, 12]) circle(c, dx, -22, 2.2, '#59636d');
  c.fillStyle = '#c9c0ad'; for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) c.fillRect(-20 + j * 8.5, -6 + i * 7.5, 5, 4);
  if (mark) { c.strokeStyle = C.red; c.lineWidth = 2.2; c.beginPath(); c.ellipse(-3, 3, 7, 5.5, 0, 0, TAU); c.stroke(); }
  c.restore();
}
function tick(c, x, y, r, k = 1) {
  if (k <= 0) return; c.save(); c.globalAlpha = Math.min(1, k * 2); circle(c, x, y, r, C.green); c.strokeStyle = '#fff'; c.lineWidth = r * 0.28; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - r * 0.45, y); c.lineTo(x - r * 0.1, y + r * 0.38); c.lineTo(x + r * 0.5, y - r * 0.4); c.stroke(); c.restore();
}
function box(c, x, y, w, h, open = false) {        // a moving box (cardboard), its bottom at y
  c.fillStyle = '#c99a5b'; c.fillRect(x - w / 2, y - h, w, h); c.fillStyle = '#b5844a'; c.fillRect(x - w / 2, y - h, w, h * 0.16);
  if (open) { c.fillStyle = '#d9ad72'; c.beginPath(); c.moveTo(x - w / 2, y - h); c.lineTo(x - w * 0.75, y - h * 1.35); c.lineTo(x - w * 0.15, y - h * 1.25); c.lineTo(x, y - h); c.fill(); c.beginPath(); c.moveTo(x + w / 2, y - h); c.lineTo(x + w * 0.78, y - h * 1.3); c.lineTo(x + w * 0.12, y - h * 1.22); c.lineTo(x, y - h); c.fill(); }
  else { c.fillStyle = '#e8d3a8'; c.fillRect(x - w * 0.08, y - h, w * 0.16, h * 0.5); }
}
function bus_(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#f2c94c'; rr(c, -40, -30, 80, 28, 5); c.fill(); c.fillStyle = '#8fc3ea'; for (let i = 0; i < 5; i++) c.fillRect(-34 + i * 15, -25, 11, 10);
  c.fillStyle = '#2f7fd1'; c.fillRect(-40, -12, 80, 3); c.fillStyle = C.ink; circle(c, -24, -2, 6, C.ink); circle(c, 24, -2, 6, C.ink); circle(c, -24, -2, 2.5, '#c9d2da'); circle(c, 24, -2, 2.5, '#c9d2da');
  c.restore();
}

/* the Nominalstil film (id 482): a ladder against a tree, a fire helmet, a firefighter, a cat */
function ladder(c) {
  c.strokeStyle = '#b8bec6'; c.lineWidth = 3; c.beginPath(); c.moveTo(70, 92); c.lineTo(116, 12); c.moveTo(84, 92); c.lineTo(128, 16); c.stroke();
  c.lineWidth = 2; for (let i = 1; i < 9; i++) { const u = i / 9; c.beginPath(); c.moveTo(70 + 46 * u, 92 - 80 * u); c.lineTo(84 + 44 * u, 92 - 76 * u); c.stroke(); }
}
function helmet(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#d2453b'; c.beginPath(); c.arc(0, 0, 9, Math.PI, TAU); c.fill(); c.fillRect(-12, -1, 24, 3); c.fillStyle = C.sun; c.fillRect(-2, -8, 4, 6); c.restore(); }
function firefighter(c, x, y, s) { person(c, x, y, s, '#2f3a4a', 0); helmet(c, x, y - 40 * s, s); c.fillStyle = C.sun; c.fillRect(x - 3.5 * s, y - 20 * s, 7 * s, 2 * s); }
function cat(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#e8873a'; c.beginPath(); c.ellipse(0, 0, 9, 6, 0, 0, TAU); c.fill(); circle(c, 8, -6, 5, '#e8873a');
  c.beginPath(); c.moveTo(5, -10); c.lineTo(6, -15); c.lineTo(9, -10); c.lineTo(12, -14); c.lineTo(12, -8); c.fill();
  c.strokeStyle = '#e8873a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-8, -2); c.quadraticCurveTo(-16, -10, -12, -16); c.stroke(); circle(c, 10, -7, 1, C.ink); c.restore();
}

export const BILDER = {
  // a key that is looked for: it wobbles under a magnifying glass (ich suche den Schlüssel)
  schluessel(c, t) {
    const w = Math.sin(t * 3) * 0.12; c.save(); c.translate(70, 58); c.rotate(-0.5 + w);
    c.strokeStyle = '#d9a521'; c.lineWidth = 7; c.beginPath(); c.arc(-24, 0, 12, 0, TAU); c.stroke();
    c.fillStyle = '#d9a521'; c.fillRect(-12, -3.5, 46, 7); c.fillRect(22, 3, 5, 9); c.fillRect(30, 3, 4, 7); c.restore();
    const gx = 108 + Math.cos(t * 1.6) * 8, gy = 40 + Math.sin(t * 1.6) * 5;
    c.strokeStyle = '#3d4f6b'; c.lineWidth = 5; c.beginPath(); c.arc(gx, gy, 15, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(143,195,234,.35)'; c.beginPath(); c.arc(gx, gy, 13, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(gx + 11, gy + 11); c.lineTo(gx + 26, gy + 26); c.stroke();
  },
  // a cup of coffee on a saucer, steaming, with a little heart in the foam (ich möchte einen Kaffee)
  kaffee(c, t) {
    c.fillStyle = '#c9d2da'; c.beginPath(); c.ellipse(80, 84, 44, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#2f7fd1'; c.beginPath(); c.moveTo(52, 44); c.lineTo(108, 44); c.quadraticCurveTo(106, 82, 80, 82); c.quadraticCurveTo(54, 82, 52, 44); c.fill();
    c.strokeStyle = '#2f7fd1'; c.lineWidth = 6; c.beginPath(); c.arc(110, 58, 9, -1.2, 1.3); c.stroke();
    c.fillStyle = '#8a5a3b'; c.beginPath(); c.ellipse(80, 45, 26, 5, 0, 0, TAU); c.fill();
    c.fillStyle = '#f1dfc6'; c.beginPath(); c.moveTo(80, 49); c.bezierCurveTo(70, 44, 74, 39, 80, 43); c.bezierCurveTo(86, 39, 90, 44, 80, 49); c.fill();
    steam(c, 80, 36, t);
  },
  suppe(c, t) { pot(c, 80, 58, t); },
  // cooking together: two ladles in one pot
  zusammen(c, t) { pot(c, 80, 58, t, 2); circle(c, 128, 30, 6, '#e0465a'); circle(c, 136, 30, 6, '#e0465a'); c.fillStyle = '#e0465a'; c.beginPath(); c.moveTo(122, 32); c.lineTo(132, 44); c.lineTo(142, 32); c.fill(); },
  // repairing: a chair whose leg is hammered back in
  reparieren(c, t) {
    const k = (t % 2.4) / 2.4, fixed = k > 0.62, hit = Math.max(0, Math.sin(k * TAU * 3)) * (k < 0.62 ? 1 : 0);
    c.fillStyle = C.wood; c.fillRect(40, 26, 8, 40); c.fillRect(40, 54, 50, 7); c.fillRect(44, 60, 6, 28);
    c.save(); c.translate(86, 60); c.rotate(fixed ? 0 : 0.35 - k * 0.5); c.fillRect(-3, 0, 6, 28); c.restore();
    c.save(); c.translate(112, 40); c.rotate(-0.9 + hit * 0.9); c.fillStyle = '#a5683a'; c.fillRect(-3, 0, 6, 30); c.fillStyle = '#59636d'; rr(c, -10, -6, 20, 9, 2); c.fill(); c.restore();
    if (fixed) { c.strokeStyle = C.green; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(112, 70); c.lineTo(119, 78); c.lineTo(132, 62); c.stroke(); }
    else if (hit > 0.9) { c.strokeStyle = C.sun; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); c.moveTo(90 + Math.cos(a) * 6, 64 + Math.sin(a) * 6); c.lineTo(90 + Math.cos(a) * 12, 64 + Math.sin(a) * 12); c.stroke(); } }
  },
  // getting up early: a bed at sunrise and a ringing alarm clock at six
  aufstehen(c, t) {
    const g = c.createLinearGradient(0, 0, 0, 60); g.addColorStop(0, '#f6b26b'); g.addColorStop(1, '#fde7c2'); c.fillStyle = g; rr(c, 92, 8, 56, 44, 4); c.fill();
    circle(c, 120, 52 - Math.min(1, (t % 4) / 2) * 12, 9, C.sun); c.strokeStyle = C.dark; c.lineWidth = 3; c.strokeRect(92, 8, 56, 44);
    c.fillStyle = C.wood; c.fillRect(8, 56, 78, 10); c.fillRect(8, 40, 7, 40); c.fillRect(80, 52, 6, 28);
    c.fillStyle = '#8fb3d9'; rr(c, 22, 48, 62, 16, 6); c.fill(); c.fillStyle = C.cream; rr(c, 14, 44, 18, 10, 4); c.fill();
    const up = Math.min(1, Math.max(0, ((t % 4) - 1.2) / 0.6));
    c.save(); c.translate(24, 46 - up * 8); circle(c, 0, 0, 7, C.skin); c.fillStyle = '#7a4a2a'; c.beginPath(); c.arc(0, -2, 7.4, Math.PI, TAU); c.fill();
    c.strokeStyle = C.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-3, 1); c.lineTo(-1, 1); c.moveTo(2, 1); c.lineTo(4, 1); c.stroke(); c.restore();
    clockFace(c, 112, 78, 13, 6, 0, (t % 4) < 1.4 ? t : 0);
  },
  // sawing: a saw going through a plank, with sawdust
  saegen(c, t) {
    c.fillStyle = '#e0b57a'; c.fillRect(14, 58, 132, 14); c.fillStyle = C.dark; c.fillRect(30, 72, 8, 20); c.fillRect(122, 72, 8, 20);
    const dx = Math.sin(t * 7) * 16; c.save(); c.translate(82 + dx, 40); c.rotate(0.5);
    c.fillStyle = '#c9d2da'; c.beginPath(); c.moveTo(-34, -6); c.lineTo(26, 0); c.lineTo(26, 12); c.lineTo(-34, 6); c.fill(); c.fillStyle = '#8f4a25'; rr(c, -50, -10, 18, 20, 5); c.fill(); c.restore();
    for (let i = 0; i < 8; i++) { const k = (t * 1.4 + i / 8) % 1; circle(c, 92 + Math.sin(i * 7) * 8, 72 + k * 22, 1.8, '#d9a868'); }
  },
  // painting: an easel; the picture paints itself, the brush moves
  malen(c, t) {
    c.strokeStyle = C.dark; c.lineWidth = 4; c.beginPath(); c.moveTo(58, 92); c.lineTo(76, 10); c.lineTo(94, 92); c.moveTo(76, 10); c.lineTo(76, 92); c.stroke();
    c.fillStyle = '#fff'; c.fillRect(46, 18, 60, 46); c.strokeStyle = '#c9b89a'; c.lineWidth = 2; c.strokeRect(46, 18, 60, 46);
    const k = (t % 4) / 3;
    c.save(); c.beginPath(); c.rect(46, 18, 60 * Math.min(1, k * 1.2), 46); c.clip();
    c.fillStyle = '#a7d3ef'; c.fillRect(46, 18, 60, 30); c.fillStyle = '#86b765'; c.beginPath(); c.ellipse(76, 66, 40, 18, 0, 0, TAU); c.fill(); circle(c, 92, 30, 7, C.sun);
    c.fillStyle = '#f3e2c3'; c.fillRect(58, 40, 16, 12); c.fillStyle = C.red; c.beginPath(); c.moveTo(56, 40); c.lineTo(66, 32); c.lineTo(76, 40); c.fill(); c.restore();
    const bx = 46 + 60 * Math.min(1, k * 1.2), by = 36 + Math.sin(t * 6) * 10; c.save(); c.translate(bx, by); c.rotate(0.6);
    c.fillStyle = '#b06a35'; c.fillRect(-2, 0, 4, 28); c.fillStyle = '#e0465a'; c.beginPath(); c.ellipse(0, -2, 3, 6, 0, 0, TAU); c.fill(); c.restore();
  },
  // no smoking: the pictogram everyone knows (no smoker in a children's picture)
  rauchen(c, t) { noSign(c, 80, 50, 40, () => { c.fillStyle = '#f4efe6'; c.fillRect(46, 50, 60, 11); c.strokeStyle = '#6b7482'; c.lineWidth = 2; c.strokeRect(46, 50, 60, 11); c.fillStyle = '#d9a868'; c.fillRect(46, 50, 16, 11); c.fillStyle = '#f2994a'; c.fillRect(104, 50, 5, 11); steam(c, 110, 46, t, 2); }); },
  // tidying up: a broom sweeps shavings into a pile, tools back on the wall
  aufraeumen(c, t) {
    const k = (t % 3) / 3, bx = 30 + k * 90;
    for (let i = 0; i < 9; i++) { const sx = 30 + i * 11; if (sx > bx) { c.strokeStyle = '#e0b57a'; c.lineWidth = 2; c.beginPath(); c.ellipse(sx, 86, 4, 2, i, 0.3, 5.5); c.stroke(); } }
    c.fillStyle = '#e0b57a'; c.beginPath(); c.ellipse(bx + 6, 88, 6 + k * 10, 3 + k * 4, 0, Math.PI, TAU); c.fill();
    c.save(); c.translate(bx, 88); c.rotate(-0.35 + Math.sin(t * 9) * 0.12); c.strokeStyle = '#a5683a'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -70); c.stroke();
    c.fillStyle = '#d9b24a'; c.beginPath(); c.moveTo(-8, -6); c.lineTo(8, -6); c.lineTo(12, 4); c.lineTo(-12, 4); c.fill(); c.restore();
    c.fillStyle = '#d9b98a'; rr(c, 104, 10, 46, 34, 3); c.fill(); c.fillStyle = '#59636d'; c.fillRect(112, 16, 4, 20); c.fillRect(108, 14, 12, 5); c.fillStyle = '#9aa6b1'; c.fillRect(130, 16, 4, 20); c.fillRect(130, 32, 14, 4);
  },
  // opening the window (it is warm): a window that opens, a hot sun, and a question
  fenster(c, t) {
    const k = Math.min(1, (t % 3.5) / 1.6);
    c.fillStyle = '#a7d3ef'; c.fillRect(40, 14, 70, 64); circle(c, 92, 34, 12, '#f6a33b');
    c.strokeStyle = '#f6a33b'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t; c.beginPath(); c.moveTo(92 + Math.cos(a) * 15, 34 + Math.sin(a) * 15); c.lineTo(92 + Math.cos(a) * 20, 34 + Math.sin(a) * 20); c.stroke(); }
    c.strokeStyle = C.dark; c.lineWidth = 4; c.strokeRect(40, 14, 70, 64);
    for (const s of [-1, 1]) { const hx = 75 + s * 35, w = 35 * (1 - k * 0.8); c.fillStyle = 'rgba(220,238,248,.6)'; c.fillRect(Math.min(hx, hx - s * w), 14, w, 64); c.strokeStyle = C.dark; c.lineWidth = 3; c.strokeRect(Math.min(hx, hx - s * w), 14, w, 64); }
    question(c, 136, 40);
  },
  // when do we eat: a bowl of soup, a spoon, a clock and a question
  essen(c, t) {
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(60, 66, 34, 8, 0, 0, TAU); c.fill(); c.fillStyle = '#e8873a'; c.beginPath(); c.ellipse(60, 62, 28, 6, 0, 0, TAU); c.fill();
    c.fillStyle = '#2f7fd1'; c.beginPath(); c.moveTo(26, 62); c.quadraticCurveTo(60, 96, 94, 62); c.fill(); steam(c, 60, 56, t);
    c.strokeStyle = '#8b97a3'; c.lineWidth = 3; c.beginPath(); c.moveTo(88, 54); c.lineTo(104, 34); c.stroke();
    clockFace(c, 126, 52, 15, 12, (t * 40) % 60); question(c, 126, 20, 0.9);
  },
  // all the people (man): a little crowd
  leute(c, t) { const cols = ['#d2453b', '#3d4f6b', '#4f8a52', '#9b5fb5', '#c99a2e', '#2f7fd1']; cols.forEach((col, i) => person(c, 22 + i * 23, 86 - (i % 2) * 6, 1.1 + (i % 3) * 0.12, col, t + i)); },
  /* practice sentences */
  parken(c) { noSign(c, 80, 50, 40, () => { c.fillStyle = '#2f7fd1'; c.fillRect(40, 10, 80, 80); c.fillStyle = '#fff'; c.font = '800 46px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', 80, 52); }); },
  telefonieren(c, t) { noSign(c, 80, 50, 40, () => { c.save(); c.translate(80, 50); c.rotate(-0.5 + Math.sin(t * 20) * 0.05); c.fillStyle = C.ink; rr(c, -12, -22, 24, 44, 5); c.fill(); c.fillStyle = '#8fc3ea'; c.fillRect(-9, -17, 18, 30); c.restore(); }); },
  tanzen(c, t) { person(c, 62, 84, 1.4, '#9b5fb5', t, 'dance'); for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; c.globalAlpha = Math.sin(Math.PI * k); c.fillStyle = C.ink; c.font = '700 18px serif'; c.fillText('♪', 100 + i * 14, 60 - k * 40); } c.globalAlpha = 1; },
  helfen(c, t) { person(c, 52, 84, 1.3, '#3d4f6b'); person(c, 104, 84, 1.3, C.red); const y = 40 + Math.sin(t * 3) * 3; c.fillStyle = C.wood; c.fillRect(56, y, 44, 10); },
  schwimmen(c, t) { c.fillStyle = '#7cc0e8'; c.fillRect(0, 50, 160, 50); c.save(); c.translate(80 + Math.sin(t) * 18, 54); circle(c, 0, 0, 7, C.skin); c.fillStyle = C.red; c.beginPath(); c.arc(0, -2, 7.4, Math.PI, TAU); c.fill(); const a = t * 5; c.strokeStyle = C.skin; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 4); c.lineTo(Math.cos(a) * 14, 4 + Math.sin(a) * 10); c.stroke(); c.restore(); c.strokeStyle = '#fff'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = (i * 30 + t * 20) % 170 - 5; c.beginPath(); c.moveTo(x, 62); c.quadraticCurveTo(x + 7, 57, x + 14, 62); c.stroke(); } },
  pfannkuchen(c, t) { const k = (t % 2) / 2, flip = Math.sin(Math.PI * k); c.fillStyle = C.ink; c.fillRect(20, 72, 46, 5); c.beginPath(); c.ellipse(86, 72, 30, 7, 0, 0, Math.PI); c.fill(); c.save(); c.translate(86, 66 - flip * 36); c.rotate(k * TAU); c.fillStyle = '#e8b85a'; c.beginPath(); c.ellipse(0, 0, 18, 6, 0, 0, TAU); c.fill(); c.fillStyle = '#d4943a'; circle(c, -5, -1, 2, '#d4943a'); circle(c, 6, 1, 2, '#d4943a'); c.restore(); },
  putzen(c, t) { c.fillStyle = '#2f7fd1'; c.beginPath(); c.moveTo(30, 52); c.lineTo(62, 52); c.lineTo(58, 88); c.lineTo(34, 88); c.fill(); c.fillStyle = '#a7d3ef'; c.beginPath(); c.ellipse(46, 52, 16, 4, 0, 0, TAU); c.fill(); const x = 96 + Math.sin(t * 5) * 18; c.fillStyle = C.sun; rr(c, x - 12, 70, 24, 12, 4); c.fill(); for (let i = 0; i < 4; i++) circle(c, x - 20 + i * 10 + Math.sin(t * 3 + i) * 3, 62 - (t * 20 + i * 9) % 30, 3, 'rgba(167,211,239,.9)'); c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '700 14px serif'; c.fillText('✦', 130, 50); },
  fit(c, t) { const up = Math.abs(Math.sin(t * 2.5)) * 22; c.fillStyle = C.ink; c.fillRect(46, 66 - up, 68, 6); c.fillStyle = '#59636d'; rr(c, 36, 54 - up, 14, 30, 3); c.fill(); rr(c, 110, 54 - up, 14, 30, 3); c.fill(); c.fillStyle = C.ink; rr(c, 28, 58 - up, 8, 22, 2); c.fill(); rr(c, 124, 58 - up, 8, 22, 2); c.fill(); },
  /* Passiv (B2): the work gets done; who does it is not the point */
  // a newspaper with a portrait (a mayor's chain of office) and confetti: someone has been re-elected
  zeitung(c, t) {
    c.save(); c.translate(80, 52); c.rotate(-0.05);
    c.fillStyle = '#fbf8ef'; rr(c, -58, -42, 116, 84, 3); c.fill(); c.strokeStyle = '#c9c0ad'; c.lineWidth = 1; c.stroke();
    c.fillStyle = C.ink; c.fillRect(-50, -36, 100, 9); c.fillStyle = '#cfd8e3'; c.fillRect(-50, -22, 42, 52);
    circle(c, -29, -7, 9, C.skin); c.fillStyle = '#7a4a2a'; c.beginPath(); c.arc(-29, -10, 9.6, Math.PI, TAU); c.fill(); c.fillStyle = '#3f6fa0'; rr(c, -42, 4, 26, 26, 8); c.fill();
    c.strokeStyle = C.sun; c.lineWidth = 2.5; c.beginPath(); c.arc(-29, 3, 9, 0.25, Math.PI - 0.25); c.stroke(); circle(c, -29, 12, 3, C.sun);
    c.fillStyle = '#b9b2a2'; for (let i = 0; i < 7; i++) c.fillRect(-2, -20 + i * 7.5, i === 6 ? 32 : 52, 3);
    c.restore();
    for (let i = 0; i < 10; i++) { const k = (t * 0.5 + i / 10) % 1; c.fillStyle = [C.red, C.sun, C.blue, C.green][i % 4]; c.save(); c.translate(12 + i * 15, k * 104 - 4); c.rotate(k * TAU * 2 + i); c.fillRect(-3, -1.5, 6, 3); c.restore(); }
  },
  // a parcel lands at a door, and the phone says: delivered
  paket(c, t) {
    const k = (t % 2) / 2, land = Math.min(1, k / 0.4), py = 64 - (1 - land * land) * 60;
    c.fillStyle = '#8a5a33'; rr(c, 18, 12, 40, 80, 3); c.fill(); circle(c, 50, 54, 2.5, C.sun); c.fillStyle = '#6d8a5a'; c.fillRect(58, 88, 50, 4);
    c.fillStyle = '#c99a5b'; c.fillRect(66, py, 34, 24); c.fillStyle = '#a87a3f'; c.fillRect(81, py, 4, 24); c.fillStyle = '#e8d3a8'; c.fillRect(66, py + 9, 34, 3);
    c.save(); c.translate(132, 50); c.rotate(k > 0.45 && k < 0.55 ? Math.sin(k * 400) * 0.08 : 0);
    c.fillStyle = C.ink; rr(c, -13, -25, 26, 50, 5); c.fill(); c.fillStyle = '#e9f5fb'; c.fillRect(-10, -20, 20, 38);
    if (k > 0.45) { c.fillStyle = C.green; rr(c, -9, -15, 18, 13, 3); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -9); c.lineTo(-1, -6); c.lineTo(4, -12); c.stroke(); c.fillStyle = '#c99a5b'; c.fillRect(-6, 3, 12, 9); }
    c.restore();
  },
  // nobody there: a dashed outline where a person should be, and a tyre that gets its patch anyway
  wer(c, t) {
    c.save(); c.setLineDash([5, 4]); c.lineDashOffset = -t * 9; c.strokeStyle = '#6b7482'; c.lineWidth = 2.5;
    c.beginPath(); c.arc(56, 26, 12, 0, TAU); c.stroke(); rr(c, 38, 42, 36, 50, 12); c.stroke(); c.restore();
    question(c, 56, 66, 1.1);
    c.strokeStyle = C.ink; c.lineWidth = 8; c.beginPath(); c.arc(118, 60, 22, 0, TAU); c.stroke();
    const k = (t % 2) / 2, p = Math.min(1, k / 0.5); c.save(); c.translate(118 + Math.cos(-0.8) * 22 + (1 - p) * 20, 60 + Math.sin(-0.8) * 22 - (1 - p) * 24); c.rotate(-0.8); c.fillStyle = '#e8873a'; c.fillRect(-6, -6, 12, 12); c.restore();
  },
  // a memory in grey: a bicycle at a lamp post at night; a shadow with a question mark for a face takes it; a cut lock stays
  gestohlen(c, t) {
    const k = (t % 4) / 4;
    c.fillStyle = '#3b4250'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#555d6b'; c.fillRect(0, 84, 160, 16);
    c.fillStyle = 'rgba(230,230,210,.13)'; c.beginPath(); c.moveTo(38, 22); c.lineTo(47, 22); c.lineTo(84, 86); c.lineTo(4, 86); c.fill();
    c.fillStyle = '#7d8592'; c.fillRect(40, 14, 5, 72); c.fillStyle = '#d9d9c8'; c.beginPath(); c.moveTo(34, 14); c.lineTo(51, 14); c.lineTo(46, 22); c.lineTo(39, 22); c.fill();
    const bx = k < 0.62 ? 66 : 66 + ((k - 0.62) / 0.38) * 130;
    c.strokeStyle = '#a7adb7'; c.lineWidth = 3; for (const dx of [-15, 15]) { c.beginPath(); c.arc(bx + dx, 74, 10, 0, TAU); c.stroke(); }
    c.beginPath(); c.moveTo(bx - 15, 74); c.lineTo(bx - 3, 60); c.lineTo(bx + 9, 60); c.lineTo(bx + 15, 74); c.moveTo(bx - 3, 60); c.lineTo(bx, 74); c.lineTo(bx - 15, 74); c.moveTo(bx + 9, 60); c.lineTo(bx + 8, 54); c.stroke();
    if (k > 0.2) {
      const sx = k < 0.42 ? 176 - ((k - 0.2) / 0.22) * 88 : bx + 22;
      c.fillStyle = '#1b1f27'; c.beginPath(); c.arc(sx, 40, 9, 0, TAU); c.fill(); rr(c, sx - 10, 50, 20, 30, 7); c.fill(); c.fillRect(sx - 8, 78, 6, 9); c.fillRect(sx + 2, 78, 6, 9);
      c.fillStyle = '#fff'; c.font = '800 15px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', sx, 41);
    }
    c.strokeStyle = '#c9d2da'; c.lineWidth = 2.5;
    if (k < 0.5) { c.beginPath(); c.moveTo(45, 70); c.lineTo(bx - 15, 72); c.stroke(); }
    else { c.beginPath(); c.arc(52, 82, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.fillStyle = '#c9d2da'; c.fillRect(46, 82, 10, 5); }
  },
  // letters drop through the letterbox; the clock says ten
  post(c, t) {
    const k = (t % 2) / 2;
    c.fillStyle = '#8a5a33'; rr(c, 20, 10, 64, 86, 3); c.fill(); c.fillStyle = '#d9a521'; rr(c, 36, 44, 32, 8, 2); c.fill(); c.fillStyle = '#4a3020'; c.fillRect(39, 47, 26, 2);
    for (let i = 0; i < 3; i++) {
      const q = Math.max(0, Math.min(1, k * 1.7 - i * 0.25)); if (q <= 0) continue;
      c.save(); c.translate(54 + q * 44 + i * 6, 48 + q * q * 38); c.rotate(q * 1.3 + i * 0.4); c.fillStyle = '#fffdf6'; c.fillRect(-9, -6, 18, 12); c.strokeStyle = '#b9b2a2'; c.lineWidth = 1; c.strokeRect(-9, -6, 18, 12); c.beginPath(); c.moveTo(-9, -6); c.lineTo(0, 1); c.lineTo(9, -6); c.stroke(); c.restore();
    }
    clockFace(c, 130, 26, 15, 10, 0);
  },
  // a round cake, fresh from the oven
  kuchen(c, t) {
    c.fillStyle = '#c9d2da'; c.beginPath(); c.ellipse(80, 84, 52, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#c98a4b'; rr(c, 40, 48, 80, 34, 6); c.fill(); c.fillStyle = '#a86f38'; c.fillRect(40, 64, 80, 4);
    c.fillStyle = '#fdf1e0'; c.beginPath(); c.ellipse(80, 49, 40, 8, 0, 0, TAU); c.fill(); for (let i = 0; i < 5; i++) circle(c, 52 + i * 14, 47, 3.5, C.red);
    steam(c, 80, 38, t);
  },
  // a roof being repaired: the hammer taps, the missing tile goes in, a tick
  dach(c, t) {
    const k = (t % 2) / 2, hit = k < 0.6 ? Math.max(0, Math.sin(k * TAU * 3)) : 0;
    c.fillStyle = '#e9dcc4'; c.fillRect(36, 56, 88, 38); c.fillStyle = '#8a5a33'; c.fillRect(70, 70, 18, 24); c.fillStyle = '#d8eef8'; c.fillRect(44, 64, 16, 12); c.fillRect(98, 64, 16, 12);
    c.fillStyle = '#b5543a'; c.beginPath(); c.moveTo(24, 58); c.lineTo(80, 16); c.lineTo(136, 58); c.fill();
    c.strokeStyle = '#8f3d28'; c.lineWidth = 1.5; for (let i = 1; i < 4; i++) { const y = 58 - i * 10, w = 56 * (1 - (i * 10) / 42); c.beginPath(); c.moveTo(80 - w, y); c.lineTo(80 + w, y); c.stroke(); }
    if (k < 0.6) { c.fillStyle = '#3b2a20'; c.fillRect(92, 38, 12, 8); }
    c.save(); c.translate(116, 26); c.rotate(-0.9 + hit * 0.8); c.fillStyle = '#a5683a'; c.fillRect(-2.5, 0, 5, 24); c.fillStyle = '#59636d'; rr(c, -9, -5, 18, 8, 2); c.fill(); c.restore();
    if (k >= 0.6) { c.strokeStyle = C.green; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(130, 76); c.lineTo(137, 84); c.lineTo(150, 68); c.stroke(); }
  },
  // a better world: a clean street, and the bins are emptied every day
  muell(c, t) {
    const k = (t % 4) / 4, tx = -70 + k * 270;
    c.fillStyle = '#e8eef6'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#c0c8d2'; c.fillRect(0, 80, 160, 20);
    c.fillStyle = '#e9dcc4'; c.fillRect(6, 34, 46, 46); c.fillStyle = '#b5543a'; c.beginPath(); c.moveTo(2, 36); c.lineTo(29, 14); c.lineTo(56, 36); c.fill();
    c.fillStyle = '#d8eef8'; c.fillRect(14, 44, 12, 10); c.fillRect(32, 44, 12, 10);
    for (const bx of [78, 100]) { const empty = tx > bx; c.fillStyle = '#4f8a52'; rr(c, bx - 8, 58, 16, 22, 2); c.fill(); c.fillStyle = '#3d6e40'; c.fillRect(bx - 9, 55 - (tx > bx - 30 && !empty ? 6 : 0), 18, 4); if (!empty) { c.fillStyle = '#8a7a5a'; c.beginPath(); c.arc(bx, 56, 5, Math.PI, TAU); c.fill(); } }
    c.save(); c.translate(tx, 0); c.fillStyle = '#e8873a'; rr(c, -60, 50, 46, 28, 3); c.fill(); c.fillStyle = '#f2c94c'; rr(c, -14, 58, 18, 20, 3); c.fill(); c.fillStyle = '#8fc3ea'; c.fillRect(-10, 61, 11, 8);
    c.fillStyle = C.ink; for (const wx of [-48, -22, -4]) { c.beginPath(); c.arc(wx, 80, 6, 0, TAU); c.fill(); } c.restore();
    for (let i = 0; i < 4; i++) { const p = (k * 2 + i / 4) % 1; c.globalAlpha = Math.sin(Math.PI * p); c.fillStyle = C.sun; c.save(); c.translate(70 + i * 22, 30 - p * 10); c.rotate(p * 3); c.fillRect(-3, -0.8, 6, 1.6); c.fillRect(-0.8, -3, 1.6, 6); c.restore(); }
    c.globalAlpha = 1;
  },
  // a holiday camp: a tent, a campfire, two children and a grown-up who looks after them
  ferienlager(c, t) {
    c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 72); c.fillStyle = '#8fbf6a'; c.fillRect(0, 72, 160, 28);
    c.fillStyle = '#4f8a52'; c.beginPath(); c.moveTo(6, 80); c.lineTo(36, 30); c.lineTo(66, 80); c.fill(); c.fillStyle = '#2f5d34'; c.beginPath(); c.moveTo(30, 80); c.lineTo(36, 54); c.lineTo(42, 80); c.fill();
    c.fillStyle = '#7a4a2a'; c.save(); c.translate(98, 86); c.rotate(0.3); c.fillRect(-12, -2, 24, 4); c.rotate(-0.6); c.fillRect(-12, -2, 24, 4); c.restore();
    for (let i = 0; i < 3; i++) { const f = 0.8 + 0.2 * Math.sin(t * Math.PI * 4 + i * 2); c.fillStyle = i % 2 ? '#f2994a' : C.sun; c.beginPath(); c.moveTo(90 + i * 8, 85); c.quadraticCurveTo(86 + i * 8, 85 - 10 * f, 90 + i * 8, 85 - 18 * f); c.quadraticCurveTo(94 + i * 8, 85 - 10 * f, 90 + i * 8, 85); c.fill(); }
    person(c, 76, 92, 0.85, C.red, t); person(c, 124, 92, 0.85, '#c99a2e', t); person(c, 142, 92, 1.3, '#3f6fa0', t);
    const hb = Math.sin(t * Math.PI) * 2; c.fillStyle = '#e0465a'; c.beginPath(); c.moveTo(142, 38 + hb); c.bezierCurveTo(132, 30 + hb, 136, 22 + hb, 142, 27 + hb); c.bezierCurveTo(148, 22 + hb, 152, 30 + hb, 142, 38 + hb); c.fill();
  },
  // a drill makes a hole in a board; the sawdust falls
  bohren(c, t) {
    c.fillStyle = '#e0b57a'; c.fillRect(16, 62, 128, 16); c.fillStyle = '#c99a5b'; c.fillRect(16, 74, 128, 4); c.fillStyle = '#5b3b26'; c.beginPath(); c.ellipse(80, 62, 6, 2.2, 0, 0, TAU); c.fill();
    const push = Math.abs(Math.sin(t * Math.PI)) * 3; c.save(); c.translate(80, 58 + push);
    c.fillStyle = '#8b97a3'; c.fillRect(-2, -16, 4, 16); c.strokeStyle = '#59636d'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const y = -14 + ((i * 4 + t * 40) % 16); c.beginPath(); c.moveTo(-2, y); c.lineTo(2, y + 2); c.stroke(); }
    c.fillStyle = '#59636d'; c.fillRect(-5, -22, 10, 6); c.fillStyle = '#f2994a'; rr(c, -14, -46, 28, 24, 6); c.fill(); c.fillStyle = C.ink; c.fillRect(-4, -46, 8, -18); rr(c, -9, -70, 18, 8, 2); c.fill(); c.restore();
    for (let i = 0; i < 8; i++) { const k = (t * 1.5 + i / 8) % 1; circle(c, 80 + Math.sin(i * 7) * 12 * k, 66 + k * 30, 1.8, '#d9a868'); }
  },
  // a power cut: the digger hits a cable; the spark runs through a ring (durch) into the house, and the lights go out
  stromausfall(c, t) {
    const k = (t % 4) / 4, dark = k > 0.62;
    c.fillStyle = dark ? '#2b3140' : '#cfe7f5'; c.fillRect(0, 0, 160, 72); c.fillStyle = '#9c7a52'; c.fillRect(0, 72, 160, 28);
    c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 88); c.lineTo(160, 88); c.stroke();
    const arm = k < 0.12 ? 0 : k < 0.28 ? (k - 0.12) / 0.16 : k < 0.5 ? 1 : Math.max(0, 1 - (k - 0.5) / 0.2);
    c.fillStyle = '#f2c94c'; rr(c, 6, 50, 34, 20, 3); c.fill(); c.fillStyle = '#8fc3ea'; c.fillRect(24, 54, 10, 8); c.fillStyle = C.ink; rr(c, 4, 68, 40, 8, 4); c.fill();
    c.save(); c.translate(38, 54); c.rotate(-0.6 + arm * 1.25); c.fillStyle = '#e0ac1a'; c.fillRect(0, -3, 26, 6); c.translate(26, 0); c.rotate(0.9); c.fillRect(0, -2.5, 20, 5); c.fillStyle = '#59636d'; c.beginPath(); c.moveTo(20, -6); c.lineTo(28, 2); c.lineTo(18, 6); c.fill(); c.restore();
    if (k > 0.26 && k < 0.4) { c.fillStyle = '#fff3a0'; c.beginPath(); for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12, r = i % 2 ? 4 : 11; c.lineTo(62 + Math.cos(a) * r, 86 + Math.sin(a) * r); } c.fill(); }
    c.strokeStyle = C.sun; c.lineWidth = 3; c.beginPath(); c.arc(98, 40, 11, 0, TAU); c.stroke();
    if (k > 0.3 && k < 0.66) {
      const q = Math.min(1, (k - 0.3) / 0.3), pt = (u) => (u < 0.5 ? [62 + (98 - 62) * u * 2, 86 + (40 - 86) * u * 2] : [98 + (134 - 98) * (u - 0.5) * 2, 40 + (58 - 40) * (u - 0.5) * 2]);
      c.strokeStyle = '#ffe066'; c.lineWidth = 3; c.beginPath(); for (let u = 0; u <= q; u += 0.05) { const [x, y] = pt(u); u ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      const [hx, hy] = pt(q), [px, py] = pt(Math.max(0, q - 0.05)), a = Math.atan2(hy - py, hx - px); c.fillStyle = '#ffe066'; c.save(); c.translate(hx, hy); c.rotate(a); c.beginPath(); c.moveTo(6, 0); c.lineTo(-5, -5); c.lineTo(-5, 5); c.fill(); c.restore();
    }
    c.fillStyle = '#c99a5b'; c.fillRect(118, 50, 38, 30); c.fillStyle = '#b5543a'; c.beginPath(); c.moveTo(114, 52); c.lineTo(137, 34); c.lineTo(160, 52); c.fill();
    c.fillStyle = dark ? '#1b2030' : '#ffe9a0'; c.fillRect(126, 58, 12, 10); c.fillRect(142, 58, 10, 10);
  },
  // a courier brings the parts from the factory to the workshop
  kurier(c, t) {
    const k = (t % 2) / 2;
    c.fillStyle = '#8fbf6a'; c.fillRect(0, 84, 160, 16);
    c.fillStyle = '#9aa4ad'; c.fillRect(4, 44, 34, 40); c.fillRect(10, 26, 8, 20); c.fillStyle = '#c9d2da'; for (let i = 0; i < 3; i++) circle(c, 14 + i * 5, 22 - i * 5 - ((t * 4) % 3), 3 + i, '#c9d2da');
    c.fillStyle = '#c99a5b'; c.fillRect(122, 50, 34, 34); c.fillStyle = '#b5543a'; c.beginPath(); c.moveTo(118, 52); c.lineTo(139, 34); c.lineTo(160, 52); c.fill(); c.fillStyle = '#7a4a2a'; c.fillRect(134, 64, 10, 20);
    c.save(); c.setLineDash([4, 4]); c.strokeStyle = '#6b7482'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(42, 92); c.lineTo(118, 92); c.stroke(); c.restore();
    const x = 44 + k * 66; person(c, x, 88, 1.15, '#e8873a', t * 6, 'stand'); c.fillStyle = '#c99a5b'; c.fillRect(x - 9, 46, 18, 13); c.fillStyle = '#a87a3f'; c.fillRect(x - 1.5, 46, 3, 13);
  },
  // a notice on the door: two neighbours read it
  aushang(c, t) {
    c.fillStyle = '#e9dcc4'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#8a5a33'; rr(c, 30, 8, 58, 92, 3); c.fill(); circle(c, 80, 56, 2.5, C.sun);
    c.save(); c.translate(59, 38); c.rotate(Math.sin(t * Math.PI) * 0.04); c.fillStyle = '#fffdf6'; c.fillRect(-16, -2, 32, 40); c.fillStyle = '#b9b2a2'; for (let i = 0; i < 6; i++) c.fillRect(-12, 6 + i * 5, i === 0 ? 24 : 20, 2); c.fillStyle = C.red; c.fillRect(-12, 1, 18, 3); circle(c, 0, -2, 2.5, C.red); c.restore();
    person(c, 112, 94, 1.3, C.green, t); person(c, 138, 94, 1.15, '#9b5fb5', t);
  },
  // a contract is signed: the pen writes the signature
  vertrag(c, t) {
    const k = Math.min(1, ((t % 2) / 2) / 0.75);
    c.save(); c.translate(80, 52); c.rotate(-0.04); c.fillStyle = '#fffdf6'; rr(c, -44, -44, 88, 88, 3); c.fill(); c.strokeStyle = '#c9c0ad'; c.lineWidth = 1; c.stroke();
    c.fillStyle = C.ink; c.fillRect(-34, -36, 50, 5); c.fillStyle = '#b9b2a2'; for (let i = 0; i < 6; i++) c.fillRect(-34, -24 + i * 7, i === 5 ? 40 : 68, 2.5);
    c.fillStyle = '#9aa4ad'; c.fillRect(-34, 32, 60, 1.5);
    c.strokeStyle = '#2f4a9f'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); let px = -30, py = 28;
    for (let u = 0; u <= k; u += 0.02) { px = -30 + u * 52; py = 26 + Math.sin(u * 22) * 5 * (1 - u * 0.5); u ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
    c.save(); c.translate(px, py); c.rotate(-0.7); c.fillStyle = C.ink; c.fillRect(-2, -30, 4, 28); c.fillStyle = '#2f4a9f'; c.beginPath(); c.moveTo(-2, -2); c.lineTo(2, -2); c.lineTo(0, 3); c.fill(); c.restore();
    c.restore();
  },
  // she has become a doctor: a white coat, a stethoscope, a red cross
  aerztin(c, t) {
    c.save(); c.translate(64, 94); c.scale(1.7, 1.7); circle(c, 0, -34, 7, C.skin); c.fillStyle = '#7a4a2a'; c.beginPath(); c.arc(0, -36, 7.6, Math.PI, TAU); c.fill(); c.fillRect(-7.6, -36, 3, 9); c.fillRect(4.6, -36, 3, 9);
    c.fillStyle = '#fbfbf6'; rr(c, -9, -27, 18, 24, 4); c.fill(); c.strokeStyle = '#c9d2da'; c.lineWidth = 0.8; c.stroke(); c.fillStyle = '#3f6fa0'; c.fillRect(-2, -26, 4, 8);
    c.strokeStyle = C.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-4, -25); c.quadraticCurveTo(-6, -14, 0, -13); c.quadraticCurveTo(5, -14, 4, -25); c.stroke(); circle(c, 0, -12, 1.6, '#8b97a3');
    c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(-3, -3); c.lineTo(-4, 6); c.moveTo(3, -3); c.lineTo(4, 6); c.stroke(); c.restore();
    const s = 1 + Math.sin(t * Math.PI) * 0.06; c.save(); c.translate(120, 40); c.scale(s, s); circle(c, 0, 0, 18, '#fff'); c.fillStyle = C.red; c.fillRect(-4, -12, 8, 24); c.fillRect(-12, -4, 24, 8); c.restore();
  },
  // you are called: someone else's phone sends the call, yours rings
  angerufen(c, t) {
    c.save(); c.translate(118, 54); c.fillStyle = '#6b7482'; rr(c, -9, -17, 18, 34, 4); c.fill(); c.fillStyle = '#d8eef8'; c.fillRect(-6, -13, 12, 24); c.restore();
    for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1; c.globalAlpha = 1 - k; c.strokeStyle = '#4f8a52'; c.lineWidth = 2.5; c.beginPath(); c.arc(118 - k * 56, 54, 8 + k * 6, Math.PI * 0.7, Math.PI * 1.3); c.stroke(); }
    c.globalAlpha = 1; c.save(); c.translate(44, 56); c.rotate(Math.sin(t * Math.PI * 12) * 0.1); c.fillStyle = C.ink; rr(c, -14, -26, 28, 52, 6); c.fill(); c.fillStyle = '#8fc3ea'; c.fillRect(-10, -20, 20, 36); c.fillStyle = C.green; circle(c, 0, 8, 5, C.green); c.restore();
    c.strokeStyle = C.sun; c.lineWidth = 2; for (const s of [-1, 1]) { c.beginPath(); c.arc(44, 56, 34, s > 0 ? -0.5 : Math.PI - 0.5 + 1, s > 0 ? 0.0 : Math.PI + 1); c.stroke(); }
  },
  // you call: a hand taps the number, the call goes out
  anrufen(c, t) {
    c.save(); c.translate(52, 56); c.fillStyle = C.ink; rr(c, -15, -28, 30, 56, 6); c.fill(); c.fillStyle = '#e9f5fb'; c.fillRect(-11, -22, 22, 40);
    c.fillStyle = '#9aa4ad'; for (let i = 0; i < 9; i++) circle(c, -6 + (i % 3) * 6, -14 + Math.floor(i / 3) * 7, 2.2, '#9aa4ad');
    const tap = Math.floor((t * 3) % 9); circle(c, -6 + (tap % 3) * 6, -14 + Math.floor(tap / 3) * 7, 2.6, C.green); c.restore();
    circle(c, 66, 72 - Math.abs(Math.sin(t * Math.PI * 3)) * 3, 6, C.skin);
    for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1; c.globalAlpha = 1 - k; c.strokeStyle = '#4f8a52'; c.lineWidth = 2.5; c.beginPath(); c.arc(72 + k * 60, 50, 8 + k * 6, -Math.PI * 0.3, Math.PI * 0.3); c.stroke(); }
    c.globalAlpha = 1;
  },
  // a guitar is tuned: the peg turns, the crooked note becomes a straight one
  gitarre(c, t) {
    const k = (t % 2) / 2, tuned = Math.min(1, k / 0.6);
    c.save(); c.translate(56, 60); c.rotate(-0.5); c.fillStyle = '#c98a4b'; c.beginPath(); c.ellipse(0, 12, 22, 18, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -12, 17, 14, 0, 0, TAU); c.fill();
    circle(c, 0, 2, 7, '#5b3b26'); c.fillStyle = '#7a4a2a'; c.fillRect(-3, -62, 6, 52); c.fillRect(-6, -74, 12, 14);
    c.save(); c.translate(-8, -68); c.rotate(tuned * TAU); c.fillStyle = '#d9d9c8'; c.fillRect(-4, -1.5, 8, 3); c.restore();
    c.strokeStyle = '#eee'; c.lineWidth = 0.8; for (const x of [-2, 0, 2]) { c.beginPath(); c.moveTo(x, -62); c.lineTo(x, 22); c.stroke(); } c.restore();
    c.strokeStyle = tuned >= 1 ? C.green : C.red; c.lineWidth = 2.5; c.beginPath();
    for (let x = 0; x <= 50; x += 2) { const y = 30 + Math.sin(x * 0.5 + t * 6) * 7 * (1 - tuned); x ? c.lineTo(100 + x, y) : c.moveTo(100 + x, y); } c.stroke();
    c.fillStyle = tuned >= 1 ? C.green : C.red; c.font = '700 20px serif'; c.textAlign = 'center'; c.fillText('♪', 126, 64);
  },
  // the candles are lit, one after another
  kerzen(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#c9d2da'; c.beginPath(); c.ellipse(80, 88, 56, 7, 0, 0, TAU); c.fill();
    [44, 80, 116].forEach((x, i) => {
      c.fillStyle = ['#fdf1e0', '#f6d6d0', '#e5f0dc'][i]; rr(c, x - 7, 46 + i * 4 - 4, 14, 42 - i * 4 + 4, 2); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, 42 + i * 4 - 4); c.lineTo(x, 36 + i * 4 - 4); c.stroke();
      if (k > 0.15 + i * 0.22) { const f = 0.85 + 0.15 * Math.sin(t * Math.PI * 8 + i); c.fillStyle = '#f2994a'; c.beginPath(); c.moveTo(x, 36 + i * 4 - 4); c.quadraticCurveTo(x - 6, 30 + i * 4 - 4, x, 20 * f + i * 4 + 2); c.quadraticCurveTo(x + 6, 30 + i * 4 - 4, x, 36 + i * 4 - 4); c.fill(); circle(c, x, 31 + i * 4 - 4, 2.5, C.sun); }
    });
  },
  // a football flies into a window, and the pane cracks
  scheibe(c, t) {
    const k = (t % 2) / 2, hit = k > 0.45;
    c.fillStyle = '#e9dcc4'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#8a5a33'; c.fillRect(86, 14, 64, 60); c.fillStyle = '#bfe0f5'; c.fillRect(91, 19, 54, 50); c.fillStyle = '#8a5a33'; c.fillRect(116, 19, 4, 50);
    if (hit) { c.strokeStyle = '#fff'; c.lineWidth = 1.5; for (let i = 0; i < 7; i++) { const a = (i * TAU) / 7 + 0.3; c.beginPath(); c.moveTo(104, 40); c.lineTo(104 + Math.cos(a) * 16, 40 + Math.sin(a) * 16); c.stroke(); } }
    const q = Math.min(1, k / 0.45), bx = hit ? 104 - (k - 0.45) * 60 : 14 + q * 90, by = hit ? 40 + (k - 0.45) * 90 : 86 - Math.sin(Math.PI * q * 0.9) * 50 - q * 6;
    c.save(); c.translate(bx, by); c.rotate(k * 12); circle(c, 0, 0, 9, '#fff'); c.strokeStyle = C.ink; c.lineWidth = 1; c.stroke(); circle(c, 0, 0, 3.2, C.ink); c.restore();
  },
  /* ---------- the lake film (id 97): wishes and imagined worlds ---------- */
  // she had left earlier: the ferry with her on deck, waving; a clock shows the earlier time
  frueher(c, t) {
    c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 60); water(c, 60, t); ferry(c, 70 + Math.sin(t * Math.PI) * 4, 64, 1.5);
    girl(c, 62 + Math.sin(t * Math.PI) * 4, 40, 0.55, t, 'dance'); clockFace(c, 136, 22, 14, 2, 0);
  },
  // the clouds open and the sun shines on the lake
  sonnig(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#9fd0f0'; c.fillRect(0, 0, 160, 64); water(c, 64, t);
    circle(c, 80, 34, 14, C.sun); c.strokeStyle = C.sun; c.lineWidth = 3; for (let i = 0; i < 10; i++) { const a = (i * TAU) / 10 + t * 0.5; c.beginPath(); c.moveTo(80 + Math.cos(a) * 18, 34 + Math.sin(a) * 18); c.lineTo(80 + Math.cos(a) * 25, 34 + Math.sin(a) * 25); c.stroke(); }
    c.fillStyle = '#8d97a3'; for (const sg of [-1, 1]) { const x = 80 + sg * (22 + k * 40); circle(c, x, 22, 14, '#8d97a3'); circle(c, x + sg * 14, 26, 11, '#8d97a3'); circle(c, x - sg * 10, 28, 10, '#8d97a3'); }
  },
  // the sun shines (on its own)
  sonne(c, t) {
    c.fillStyle = '#9fd0f0'; c.fillRect(0, 0, 160, 64); water(c, 64, t); const s = 1 + Math.sin(t * Math.PI) * 0.06;
    c.save(); c.translate(80, 34); c.scale(s, s); circle(c, 0, 0, 16, C.sun); c.strokeStyle = C.sun; c.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = (i * TAU) / 12; c.beginPath(); c.moveTo(Math.cos(a) * 21, Math.sin(a) * 21); c.lineTo(Math.cos(a) * 29, Math.sin(a) * 29); c.stroke(); } c.restore();
  },
  // grandfather in a straw hat rows her across, the present on her lap
  rudern(c, t) {
    c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 58); c.fillStyle = '#e9d6a6'; c.beginPath(); c.ellipse(148, 60, 30, 8, 0, Math.PI, TAU); c.fill();
    c.fillStyle = '#fbf8f1'; c.beginPath(); c.moveTo(134, 50); c.lineTo(146, 40); c.lineTo(158, 50); c.fill();
    water(c, 58, t); const x = 66 + Math.sin(t * Math.PI) * 6;
    hatMan(c, x - 10, 66, 0.6, t, true); girl(c, x + 14, 66, 0.55, t); c.fillStyle = '#2f7fd1'; c.fillRect(x + 12, 52, 8, 7); c.fillStyle = C.sun; c.fillRect(x + 15, 52, 2, 7);
    rowboat(c, x, 72, 1.1, t * Math.PI);
  },
  // a hot cup of tea with a tea bag's tag
  tee(c, t) {
    c.fillStyle = '#c9d2da'; c.beginPath(); c.ellipse(80, 84, 40, 7, 0, 0, TAU); c.fill();
    c.fillStyle = '#f4efe6'; c.beginPath(); c.moveTo(56, 46); c.lineTo(104, 46); c.quadraticCurveTo(102, 82, 80, 82); c.quadraticCurveTo(58, 82, 56, 46); c.fill(); c.strokeStyle = '#c9c0ad'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = '#f4efe6'; c.lineWidth = 6; c.beginPath(); c.arc(106, 58, 8, -1.2, 1.3); c.stroke();
    c.fillStyle = '#b5652e'; c.beginPath(); c.ellipse(80, 47, 22, 4, 0, 0, TAU); c.fill();
    c.strokeStyle = '#8b97a3'; c.lineWidth = 1; c.beginPath(); c.moveTo(90, 46); c.lineTo(98, 30); c.stroke(); c.fillStyle = '#4f8a52'; c.fillRect(95, 24, 9, 8);
    steam(c, 76, 38, t);
  },
  // a ferry timetable: the next departure is a question
  fahrplan(c, t) {
    c.fillStyle = '#fffdf6'; rr(c, 34, 10, 92, 80, 5); c.fill(); c.strokeStyle = '#3d4f6b'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#3d4f6b'; c.fillRect(34, 10, 92, 16); ferry(c, 56, 23, 0.32);
    c.fillStyle = '#b9b2a2'; for (let i = 0; i < 4; i++) { c.fillRect(44, 36 + i * 12, 24, 4); c.fillRect(76, 36 + i * 12, 38, 4); }
    question(c, 132 + Math.sin(t * Math.PI) * 2, 30, 1.2);
  },
  // a nap in a hammock between two trees
  nickerchen(c, t) {
    c.fillStyle = '#e9f4e1'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#7a5434'; c.fillRect(22, 30, 6, 64); c.fillRect(132, 30, 6, 64);
    circle(c, 25, 26, 16, '#5f9c48'); circle(c, 135, 26, 16, '#5f9c48');
    const sw = Math.sin(t * Math.PI) * 3; c.strokeStyle = '#d2453b'; c.lineWidth = 4; c.beginPath(); c.moveTo(28, 46); c.quadraticCurveTo(80, 82 + sw, 132, 46); c.stroke();
    circle(c, 60, 62 + sw * 0.6, 7, C.skin); c.fillStyle = '#d8d8d8'; c.beginPath(); c.arc(60, 60 + sw * 0.6, 7.4, Math.PI, TAU); c.fill();
    c.fillStyle = '#7a5434'; c.beginPath(); c.ellipse(86, 70 + sw, 22, 6, 0.15, 0, TAU); c.fill();
    c.fillStyle = C.blue; c.font = '700 13px Inter, sans-serif'; const k = (t % 2) / 2; c.globalAlpha = 1 - k; c.fillText('z', 70 + k * 14, 46 - k * 20); c.globalAlpha = 1; c.fillText('z', 82, 36);
  },
  // reading a book
  lesen(c, t) {
    c.fillStyle = '#fdf7ec'; c.fillRect(0, 0, 160, 100); hatMan(c, 64, 88, 1.3, 0);
    c.save(); c.translate(88, 52); c.rotate(-0.15); c.fillStyle = '#2f7fd1'; c.fillRect(-16, -12, 32, 24); c.fillStyle = '#fffdf6'; c.fillRect(-14, -10, 13, 20); c.fillRect(1, -10, 13, 20);
    const flip = (t % 2) / 2; c.fillStyle = '#e8e2d3'; c.fillRect(1, -10, 13 * Math.cos(flip * Math.PI), 20); c.restore();
  },
  // reading in the hammock all day: the sun goes over him
  haengematte(c, t) {
    const k = (t % 4) / 4; c.fillStyle = k < 0.85 ? '#cfe7f5' : '#f3c9a0'; c.fillRect(0, 0, 160, 100);
    const sx = 20 + k * 120, sy = 40 - Math.sin(Math.PI * k) * 30; circle(c, sx, sy, 9, C.sun);
    c.fillStyle = '#7a5434'; c.fillRect(22, 44, 5, 56); c.fillRect(133, 44, 5, 56);
    c.strokeStyle = '#d2453b'; c.lineWidth = 4; c.beginPath(); c.moveTo(27, 58); c.quadraticCurveTo(80, 92, 133, 58); c.stroke();
    circle(c, 58, 72, 7, C.skin); c.fillStyle = '#d8d8d8'; c.beginPath(); c.arc(58, 70, 7.4, Math.PI, TAU); c.fill(); c.fillStyle = '#7a5434'; c.beginPath(); c.ellipse(84, 78, 22, 6, 0.1, 0, TAU); c.fill();
    c.fillStyle = '#2f7fd1'; c.fillRect(64, 58, 16, 12); c.fillStyle = '#fffdf6'; c.fillRect(66, 60, 5, 8); c.fillRect(73, 60, 5, 8);
  },
  // playing the piano: notes rise
  klavier(c, t) {
    c.fillStyle = '#2a2f3a'; rr(c, 30, 36, 100, 40, 4); c.fill(); c.fillStyle = '#fffdf6'; c.fillRect(36, 58, 88, 14);
    c.fillStyle = '#2a2f3a'; for (let i = 0; i < 11; i++) { c.fillRect(36 + i * 8, 58, 1, 14); if (i % 7 !== 2 && i % 7 !== 6) c.fillRect(41 + i * 8, 58, 4, 8); }
    c.fillRect(38, 76, 5, 18); c.fillRect(117, 76, 5, 18);
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; c.globalAlpha = Math.sin(Math.PI * k); c.fillStyle = '#9b6ee8'; c.font = '700 18px serif'; c.fillText('♪', 60 + i * 20, 32 - k * 26); } c.globalAlpha = 1;
  },
  // the party: balloons, a cake, friends (she arrived on time)
  feier(c, t) {
    c.fillStyle = '#fdf1e0'; c.fillRect(0, 0, 160, 100);
    for (const [x, col, ph] of [[30, C.red, 0], [52, C.sun, 1], [110, C.blue, 2], [132, '#9b6ee8', 3]]) { const y = 24 + Math.sin(t * Math.PI + ph) * 3; c.strokeStyle = '#999'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x, 60); c.stroke(); c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 8, 10, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#c98a4b'; c.fillRect(64, 56, 32, 18); c.fillStyle = '#fdf1e0'; c.fillRect(64, 54, 32, 4); for (const x of [72, 80, 88]) { c.fillStyle = '#fff'; c.fillRect(x - 1, 46, 2, 8); circle(c, x, 45, 2, '#f2994a'); }
    person(c, 40, 94, 0.9, C.green, t, 'dance'); girl(c, 120, 94, 0.9, t, 'dance');
  },
  // twenty years younger: a young man with a big moustache swims across
  jung(c, t) {
    c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 50); water(c, 50, t); const x = 40 + ((t % 2) / 2) * 70;
    circle(c, x, 56, 8, C.skin); c.fillStyle = '#5b3b26'; c.beginPath(); c.arc(x, 54, 8.4, Math.PI, TAU); c.fill(); c.fillStyle = '#5b3b26'; c.beginPath(); c.ellipse(x - 4, 60, 6, 2.5, 0.2, 0, TAU); c.ellipse(x + 4, 60, 6, 2.5, -0.2, 0, TAU); c.fill();
    const a = t * Math.PI * 2; c.strokeStyle = C.skin; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 4, 62); c.lineTo(x + 4 + Math.cos(a) * 14, 62 + Math.sin(a) * 10); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x - 14 - i * 8, 64, 4, Math.PI, TAU); c.stroke(); }
  },
  // the ferry turns round in the middle of the lake and comes back
  umkehren(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 54); water(c, 54, t);
    const back = k > 0.5, x = back ? 130 - (k - 0.5) * 2 * 90 : 40 + k * 2 * 90; ferry(c, x, 66, 1.1, back);
    c.strokeStyle = '#9b6ee8'; c.lineWidth = 3; c.setLineDash([5, 4]); c.beginPath(); c.arc(130, 46, 14, -Math.PI / 2, Math.PI / 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#9b6ee8'; c.beginPath(); c.moveTo(130, 60); c.lineTo(138, 55); c.lineTo(138, 65); c.fill();
  },
  // at home on the sofa, pouring a second coffee
  sofa(c, t) {
    c.fillStyle = '#f3ead8'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#c96f53'; rr(c, 18, 50, 80, 30, 8); c.fill(); rr(c, 14, 36, 88, 18, 8); c.fill(); c.fillStyle = '#a8553d'; c.fillRect(22, 80, 6, 12); c.fillRect(88, 80, 6, 12);
    girl(c, 54, 76, 0.9, t); c.fillStyle = '#7a4a2a'; rr(c, 106, 70, 40, 6, 2); c.fill(); c.fillRect(110, 76, 4, 18); c.fillRect(138, 76, 4, 18);
    const k = Math.min(1, ((t % 2) / 2) / 0.6); c.save(); c.translate(116, 52); c.rotate(-0.9 * k); c.fillStyle = '#59636d'; rr(c, -8, -14, 16, 22, 3); c.fill(); c.fillRect(6, -10, 8, 3); c.restore();
    c.fillStyle = C.blue; c.fillRect(128, 60, 12, 10); if (k > 0.5) { c.strokeStyle = '#6b3d1f'; c.lineWidth = 2; c.beginPath(); c.moveTo(126, 56); c.lineTo(132, 62); c.stroke(); }
    c.fillStyle = C.blue; c.fillRect(66, 60, 9, 8);
  },
  // at the bakery counter: two rolls, please
  baecker(c, t) {
    c.fillStyle = '#f6ead6'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#c98a4b'; c.fillRect(0, 60, 160, 40); c.fillStyle = '#e3b277'; c.fillRect(0, 56, 160, 6);
    c.fillStyle = 'rgba(200,225,240,.6)'; c.fillRect(70, 22, 80, 34);
    for (let i = 0; i < 5; i++) { c.fillStyle = '#d9a05b'; c.beginPath(); c.ellipse(82 + i * 14, 48, 6, 4, 0, 0, TAU); c.fill(); }
    const up = Math.abs(Math.sin(t * Math.PI)) * 3; for (const x of [44, 56]) { c.fillStyle = '#d9a05b'; c.beginPath(); c.ellipse(x, 52 - up, 7, 5, 0, 0, TAU); c.fill(); c.strokeStyle = '#a86f38'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 3, 50 - up); c.lineTo(x + 3, 50 - up); c.stroke(); }
    girl(c, 22, 92, 0.95, t);
  },
  // a job interview: a table, two people facing each other, a question
  interview(c, t) {
    c.fillStyle = '#eef2f6'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#8a5a33'; c.fillRect(40, 66, 80, 6); c.fillRect(46, 72, 4, 22); c.fillRect(110, 72, 4, 22);
    person(c, 30, 92, 1.0, '#3d4f6b', t); girl(c, 130, 92, 1.0, t); c.fillStyle = '#fffdf6'; c.fillRect(70, 60, 18, 6);
    c.fillStyle = '#fffdf6'; rr(c, 50, 14, 40, 26, 8); c.fill(); c.strokeStyle = '#c9d2da'; c.lineWidth = 1.5; c.stroke(); question(c, 70, 28 + Math.sin(t * Math.PI) * 2, 1);
  },
  // after a quarrel: two people turned away from each other, a dark cloud
  streit(c, t) {
    c.fillStyle = '#f2eee8'; c.fillRect(0, 0, 160, 100); person(c, 58, 92, 1.1, '#3d4f6b', t); girl(c, 102, 92, 1.1, t);
    c.fillStyle = '#7d8893'; for (const [x, y, rad] of [[72, 22, 10], [84, 18, 12], [96, 24, 9]]) circle(c, x, y, rad, '#7d8893');
    c.strokeStyle = C.sun; c.lineWidth = 3; const f = Math.floor(t * 2) % 2; if (f) { c.beginPath(); c.moveTo(84, 30); c.lineTo(80, 40); c.lineTo(86, 40); c.lineTo(82, 50); c.stroke(); }
  },
  // a motorboat, fast
  motorboot(c, t) {
    c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 56); water(c, 56, t * 3);
    const x = 70 + Math.sin(t * Math.PI) * 6; c.fillStyle = '#f7f4ec'; c.beginPath(); c.moveTo(x - 34, 54); c.lineTo(x + 30, 54); c.lineTo(x + 40, 46); c.lineTo(x - 30, 46); c.closePath(); c.fill(); c.fillStyle = C.red; c.fillRect(x - 32, 52, 64, 3);
    c.fillStyle = '#8fc3ea'; c.beginPath(); c.moveTo(x - 4, 46); c.lineTo(x + 10, 36); c.lineTo(x + 14, 46); c.fill(); c.fillStyle = '#2a2f3a'; c.fillRect(x - 40, 44, 8, 12);
    c.strokeStyle = '#fff'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - 44 - i * 12, 54 + i); c.lineTo(x - 54 - i * 12, 50 - i * 2); c.stroke(); }
  },
  // a cappuccino with a foam heart, at a café counter
  cappuccino(c, t) {
    BILDER.kaffee(c, t); c.fillStyle = '#f1dfc6'; c.beginPath(); c.ellipse(80, 45, 24, 4.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#c98a4b'; c.beginPath(); c.moveTo(80, 49); c.bezierCurveTo(70, 44, 74, 39, 80, 43); c.bezierCurveTo(86, 39, 90, 44, 80, 49); c.fill();
  },
  // writing an email on a laptop: the envelope flies off
  email(c, t) {
    c.fillStyle = '#eef2f6'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#3d4f6b'; rr(c, 40, 26, 80, 50, 4); c.fill(); c.fillStyle = '#e9f5fb'; c.fillRect(45, 31, 70, 40); c.fillStyle = '#59636d'; c.fillRect(30, 76, 100, 6);
    c.fillStyle = '#b9b2a2'; for (let i = 0; i < 4; i++) c.fillRect(50, 38 + i * 7, i === 3 ? 30 : 56, 3);
    const k = (t % 2) / 2; c.save(); c.translate(100 + k * 40, 50 - k * 40); c.globalAlpha = 1 - k; c.fillStyle = '#fffdf6'; c.fillRect(-9, -6, 18, 12); c.strokeStyle = '#b9b2a2'; c.lineWidth = 1; c.strokeRect(-9, -6, 18, 12); c.beginPath(); c.moveTo(-9, -6); c.lineTo(0, 1); c.lineTo(9, -6); c.stroke(); c.restore();
  },
  // with wings she glides to the shore
  fluegel(c, t) {
    c.fillStyle = '#f3c9a0'; c.fillRect(0, 0, 160, 60); water(c, 60, t, '#4f8fc0'); c.fillStyle = '#e9d6a6'; c.beginPath(); c.ellipse(150, 64, 26, 8, 0, Math.PI, TAU); c.fill();
    const k = (t % 2) / 2, x = 30 + k * 100, y = 44 - Math.sin(Math.PI * k) * 14, fl = Math.sin(t * Math.PI * 4) * 0.5;
    for (const sg of [-1, 1]) { c.save(); c.translate(x, y - 24); c.rotate(sg * (0.6 + fl)); c.fillStyle = '#fbf6ff'; c.beginPath(); c.ellipse(sg * 12, -2, 14, 6, 0, 0, TAU); c.fill(); c.strokeStyle = '#b48cf0'; c.lineWidth = 1.5; c.stroke(); c.restore(); }
    girl(c, x, y, 0.75, t, 'dance');
  },
  // the umbrella stayed at home: it is in the house, the rain is outside
  regenschirm(c, t) {
    c.fillStyle = '#b9c1c8'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#f3e7cf'; c.fillRect(20, 40, 56, 50); c.fillStyle = '#b5552f'; c.beginPath(); c.moveTo(14, 40); c.lineTo(48, 14); c.lineTo(82, 40); c.fill();
    c.fillStyle = '#d8eef8'; c.fillRect(34, 52, 28, 24); c.strokeStyle = '#7a4a2a'; c.lineWidth = 2; c.strokeRect(34, 52, 28, 24);
    c.fillStyle = C.red; c.beginPath(); c.moveTo(38, 66); c.quadraticCurveTo(48, 54, 58, 66); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(48, 64); c.lineTo(48, 74); c.stroke();
    girl(c, 120, 92, 1.0, t); c.strokeStyle = 'rgba(80,110,150,.7)'; c.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const x = (i * 23) % 160, y = ((i * 17 + t * 60) % 100); if (x < 80 && y > 14 && y < 90) continue; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + 7); c.stroke(); }
  },
  // the group photo was taken without her: a gap in the row
  gruppenfoto(c, t) {
    c.fillStyle = '#2a2f3a'; rr(c, 44, 8, 72, 86, 8); c.fill(); c.fillStyle = '#fdf1e0'; c.fillRect(49, 18, 62, 62);
    const cols = [C.green, C.blue, '#9b6ee8', C.red]; [56, 70, 98, 108].forEach((x, i) => person(c, x, 72, 0.6, cols[i], t));
    c.strokeStyle = '#9b6ee8'; c.lineWidth = 1.5; c.setLineDash([3, 3]); rr(c, 79, 44, 12, 30, 4); c.stroke(); c.setLineDash([]); question(c, 85, 38, 0.6);
  },
  // a rowing boat on the water
  boot(c, t) { c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 56); water(c, 56, t); rowboat(c, 80 + Math.sin(t * Math.PI) * 4, 64, 1.5, t * Math.PI); },
  // the little wooden bridge over the stream
  bruecke(c, t) {
    c.fillStyle = '#9fcf7a'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#6aa9d0'; c.beginPath(); c.moveTo(62, 0); c.lineTo(98, 0); c.lineTo(112, 100); c.lineTo(48, 100); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const y = ((i * 25 + t * 20) % 100); c.beginPath(); c.moveTo(74, y); c.lineTo(84, y + 3); c.stroke(); }
    c.strokeStyle = '#8a5a33'; c.lineWidth = 3; c.beginPath(); c.moveTo(36, 50); c.quadraticCurveTo(80, 30, 124, 50); c.stroke(); c.fillStyle = '#c4935d'; c.beginPath(); c.moveTo(36, 62); c.quadraticCurveTo(80, 42, 124, 62); c.lineTo(124, 68); c.quadraticCurveTo(80, 48, 36, 68); c.fill();
  },
  // a wish: a shimmering bubble with a star
  wunsch(c, t) {
    const s = 1 + Math.sin(t * Math.PI) * 0.05; c.save(); c.translate(80, 50); c.scale(s, s); c.fillStyle = '#f1e8ff'; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill(); c.strokeStyle = '#9b6ee8'; c.lineWidth = 3; c.stroke();
    sparkle(c, 0, 0, 16); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(-14, -16, 8, 4, -0.6, 0, TAU); c.fill(); c.restore();
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; sparkle(c, 30 + i * 50, 90 - k * 80, 5, Math.sin(Math.PI * k)); }
  },
  // what if …? a question mark in a lilac swirl
  wasware(c, t) {
    c.strokeStyle = '#b48cf0'; c.lineWidth = 3; c.beginPath(); for (let a = 0; a < 4 * Math.PI; a += 0.15) { const r = 6 + a * 3; c.lineTo(80 + Math.cos(a + t) * r, 50 + Math.sin(a + t) * r * 0.8); } c.stroke();
    c.fillStyle = '#7c3aed'; c.font = '800 40px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 80, 52);
  },

  /* the Futur II film (id 439): Lena's moving day; guesses about what has happened, and what will be done by Friday */
  // the bus pulls away from the stop, and Lena runs after it, waving
  bus(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#dcefff'; c.fillRect(0, 0, 160, 70); c.fillStyle = '#e3c79a'; c.fillRect(0, 20, 160, 50); c.fillStyle = '#9fc4dc'; for (let i = 0; i < 6; i++) c.fillRect(8 + i * 27, 30, 12, 14);
    c.fillStyle = '#8b8d92'; c.fillRect(0, 70, 160, 30); c.fillStyle = '#c9c2b4'; c.fillRect(0, 68, 160, 4);
    c.fillStyle = '#59636d'; c.fillRect(30, 34, 3, 36); c.fillStyle = '#4f8a52'; circle(c, 31.5, 34, 7, '#4f8a52'); c.fillStyle = '#f2c94c'; c.font = '800 9px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', 31.5, 34.5);
    bus_(c, 78 + k * 70, 78, 1);
    walker(c, 20 + k * 26, 88, 0.95, '#b5455a', t * 9);
    c.strokeStyle = C.skin; c.lineWidth = 3; c.lineCap = 'round'; const hx = 22 + k * 26; c.beginPath(); c.moveTo(hx, 67); c.lineTo(hx + 7, 56 + Math.sin(t * 12) * 3); c.stroke();
  },
  // the finished flat: sofa, a picture on the wall, a plant, a lamp glowing
  fertig(c, t) {
    c.fillStyle = '#f3ecdf'; c.fillRect(0, 0, 160, 76); c.fillStyle = '#d4a26a'; c.fillRect(0, 76, 160, 24); c.fillStyle = '#b5554a'; c.beginPath(); c.ellipse(76, 88, 46, 7, 0, 0, TAU); c.fill();
    const g = 0.55 + 0.2 * Math.sin(t * Math.PI), lg = c.createRadialGradient(130, 30, 2, 130, 40, 44); lg.addColorStop(0, `rgba(255,220,140,${g})`); lg.addColorStop(1, 'rgba(255,220,140,0)'); c.fillStyle = lg; c.fillRect(80, 0, 80, 100);
    c.fillStyle = '#3a2a1a'; c.fillRect(58, 14, 34, 24); c.fillStyle = '#fbf6ea'; c.fillRect(61, 17, 28, 18); c.fillStyle = '#2f7fd1'; c.beginPath(); c.moveTo(62, 34); c.lineTo(72, 22); c.lineTo(80, 30); c.lineTo(88, 34); c.fill();
    c.fillStyle = '#5f8f8a'; rr(c, 36, 54, 70, 22, 6); c.fill(); rr(c, 32, 44, 78, 14, 6); c.fill(); c.fillStyle = '#e8873a'; rr(c, 44, 48, 14, 10, 3); c.fill();
    c.fillStyle = '#59636d'; c.fillRect(129, 34, 2, 46); c.fillStyle = '#f2c94c'; c.beginPath(); c.moveTo(120, 34); c.lineTo(124, 22); c.lineTo(136, 22); c.lineTo(140, 34); c.fill();
    c.fillStyle = '#b5552f'; c.fillRect(12, 64, 12, 12); for (const [dx, dy, r] of [[18, 54, 8], [12, 58, 6], [24, 58, 6]]) circle(c, dx, dy, r, '#4f8a52');
  },
  // a night of rain on the street: it pours, puddles grow
  regennacht(c, t) {
    c.fillStyle = '#1f2a4d'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#3b3440'; c.fillRect(0, 18, 160, 52);
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 3 ? '#f4c86a' : '#2e2a36'; c.fillRect(10 + i * 26, 30, 12, 14); }
    c.fillStyle = '#2e2f3a'; c.fillRect(0, 70, 160, 30); c.fillStyle = '#2a2b33'; c.fillRect(118, 26, 3, 46); circle(c, 119.5, 26, 5, '#f4d48a');
    c.fillStyle = 'rgba(140,180,220,.55)'; for (const [x, w] of [[30, 16], [84, 22]]) { c.beginPath(); c.ellipse(x, 86, w, 3.5, 0, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(200,220,245,.75)'; c.lineWidth = 1.3; for (let i = 0; i < 40; i++) { const x = (i * 37) % 166, y = ((i * 23 + t * 120) % 110) - 10; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 9); c.stroke(); }
  },
  // the drill left on the workbench: Anton walks out without it
  vergessen(c, t) {
    const k = (t % 2.5) / 2.5; c.fillStyle = '#c99a6a'; c.fillRect(0, 0, 160, 70); c.fillStyle = '#a87a4d'; c.fillRect(0, 70, 160, 30);
    c.fillStyle = '#8c5a33'; c.fillRect(128, 22, 26, 50); c.fillStyle = '#5e3b20'; c.fillRect(126, 20, 30, 3);
    c.fillStyle = '#7a4f2c'; c.fillRect(24, 64, 4, 24); c.fillRect(84, 64, 4, 24); c.fillStyle = '#c9955a'; c.fillRect(18, 58, 76, 7);
    c.fillStyle = '#e8873a'; rr(c, 40, 48, 24, 10, 3); c.fill(); c.fillStyle = '#3d4450'; c.fillRect(48, 56, 7, 9); c.fillStyle = '#9aa6b1'; c.fillRect(64, 51, 12, 3);
    c.save(); c.globalAlpha = k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1; walker(c, 70 + k * 64, 92, 1.0, '#8a5a2b', t * 8, '#5b3b26'); c.restore();
    c.strokeStyle = C.blue; c.lineWidth = 2; c.setLineDash([3, 3]); c.beginPath(); c.arc(56, 52, 14 + Math.sin(t * Math.PI * 2) * 1.5, 0, TAU); c.stroke(); c.setLineDash([]);
  },
  // Jonas walks home along the street, his house ahead
  heimweg(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#dcefff'; c.fillRect(0, 0, 160, 64); c.fillStyle = '#9fcf7a'; c.fillRect(0, 64, 160, 36); c.fillStyle = '#d8c7a0'; c.fillRect(0, 78, 160, 10);
    c.fillStyle = '#f3e7cf'; c.fillRect(118, 34, 34, 32); c.fillStyle = '#b5552f'; c.beginPath(); c.moveTo(112, 34); c.lineTo(135, 14); c.lineTo(158, 34); c.fill(); c.fillStyle = '#8c5a33'; c.fillRect(130, 48, 9, 18);
    walker(c, 30 + k * 60, 86, 1.0, '#2f7fd1', t * 7, '#3a2a1a');
  },
  // Jonas on the sofa with a bag of crisps
  sofachips(c, t) {
    c.fillStyle = '#eef2f6'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#5f8f8a'; rr(c, 28, 52, 100, 30, 8); c.fill(); rr(c, 22, 36, 112, 20, 8); c.fill(); c.fillStyle = '#4c7a75'; c.fillRect(34, 82, 6, 10); c.fillRect(116, 82, 6, 10);
    person(c, 70, 74, 1.0, '#2f7fd1', t); c.fillStyle = '#3a2a1a'; c.beginPath(); c.arc(70, 76 - 34, 7.4, Math.PI, TAU); c.fill();
    c.fillStyle = '#f2c94c'; rr(c, 84, 52, 16, 20, 3); c.fill(); c.fillStyle = C.red; c.fillRect(84, 58, 16, 5);
    const k = (t % 2) / 2, hy = 52 - Math.sin(Math.PI * k) * 12; c.strokeStyle = C.skin; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(76, 52); c.lineTo(84, hy); c.stroke(); circle(c, 84, hy - 2, 2.5, '#e8b85a');
  },
  // the sea rises up the harbour wall, a gauge with marks
  meeresspiegel(c, t) {
    const k = (t % 3) / 3; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#b9a98c'; c.fillRect(96, 20, 64, 80); c.fillStyle = '#a3937a'; for (let i = 0; i < 5; i++) c.fillRect(96, 26 + i * 15, 64, 2);
    c.fillStyle = '#fffdf6'; c.fillRect(84, 18, 8, 74); c.fillStyle = C.red; for (let i = 0; i < 8; i++) c.fillRect(84, 22 + i * 9, i % 2 ? 4 : 8, 2);
    const y = 76 - k * 26; c.fillStyle = 'rgba(47,127,209,.85)'; c.fillRect(0, y, 160, 100 - y); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const x = (i * 34 + t * 10) % 170 - 5; c.beginPath(); c.moveTo(x, y + 4); c.quadraticCurveTo(x + 6, y + 1, x + 12, y + 4); c.stroke(); }
    c.strokeStyle = C.red; c.lineWidth = 2.5; c.beginPath(); c.moveTo(66, 70); c.lineTo(66, 40); c.moveTo(60, 46); c.lineTo(66, 38); c.lineTo(72, 46); c.stroke();
  },
  // a thick piece of work handed in on time: the calendar's day is ticked
  abgabe(c, t) {
    const k = (t % 2.5) / 2.5; c.fillStyle = '#f6ead6'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#8a5a33'; c.fillRect(0, 70, 160, 30);
    calendar(c, 124, 32, 1.0, true); tick(c, 138, 46, 9, (k - 0.5) * 2);
    const x = 30 + Math.min(1, k * 2) * 42; c.fillStyle = '#2f4a6b'; rr(c, x - 22, 54, 44, 16, 2); c.fill(); c.fillStyle = '#fffdf6'; c.fillRect(x - 20, 58, 40, 9); c.fillStyle = C.sun; c.fillRect(x - 10, 60, 20, 3);
    girl(c, 20, 92, 0.9, t);
  },
  // the turnstile at the swimming pool: pay, the gate opens, in you go (again and again)
  drehkreuz(c, t) {
    const k = (t % 3) / 3; c.fillStyle = '#e6f3fb'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#7cc0e8'; c.fillRect(110, 56, 50, 30); c.strokeStyle = '#fff'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(114 + i * 14, 70); c.quadraticCurveTo(120 + i * 14, 66, 126 + i * 14, 70); c.stroke(); }
    c.fillStyle = '#c9d2da'; c.fillRect(0, 86, 160, 14); c.fillStyle = '#59636d'; rr(c, 66, 42, 16, 44, 3); c.fill(); c.fillStyle = '#2f9e5b'; circle(c, 74, 48, 3, k > 0.3 ? '#2f9e5b' : '#d2453b');
    const open = k > 0.3 && k < 0.7 ? 1.3 : 0; c.strokeStyle = '#9aa6b1'; c.lineWidth = 4; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = open + i * TAU / 3; c.beginPath(); c.moveTo(82, 62); c.lineTo(82 + Math.cos(a) * 16, 62 + Math.sin(a) * 6); c.stroke(); }
    const px = k < 0.3 ? 40 : 40 + (k - 0.3) / 0.7 * 90; walker(c, px, 92, 0.95, '#e8873a', k < 0.3 ? 0 : t * 8);
    if (k > 0.15 && k < 0.35) { circle(c, 64, 52 - (k - 0.15) * 40, 3, C.sun); }
  },
  // the report finished tomorrow at eight: the clock, the pages, a tick
  bericht(c, t) {
    const k = (t % 2.5) / 2.5; c.fillStyle = '#eef2f6'; c.fillRect(0, 0, 160, 100);
    c.fillStyle = '#fffdf6'; for (let i = 2; i >= 0; i--) { rr(c, 36 + i * 4, 18 + i * 3, 56, 70, 3); c.fill(); c.strokeStyle = '#c9c0ad'; c.lineWidth = 1; c.stroke(); }
    c.fillStyle = '#b9b2a2'; for (let i = 0; i < 6; i++) c.fillRect(44, 30 + i * 8, i === 5 ? 24 : 40, 3); c.fillStyle = C.ink; c.fillRect(44, 22, 30, 4);
    clockFace(c, 122, 34, 18, 8, 0); tick(c, 122, 74, 11, (k - 0.4) * 2.5);
  },
  // two friends meet in the street and wave (yesterday)
  treffen(c, t) {
    c.fillStyle = '#f3e7cf'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#d8c7a0'; c.fillRect(0, 80, 160, 20);
    girl(c, 58, 92, 1.1, t); person(c, 102, 92, 1.1, C.green, t); c.fillStyle = '#2a2f3a'; c.beginPath(); c.arc(102, 92 - 36 * 1.1 - 2, 8, Math.PI, TAU); c.fill();
    c.strokeStyle = C.skin; c.lineWidth = 4; c.lineCap = 'round'; const w = Math.sin(t * Math.PI * 2) * 5; c.beginPath(); c.moveTo(69, 68); c.lineTo(76, 54 + w); c.moveTo(91, 68); c.lineTo(84, 54 - w); c.stroke();
  },
  // a minister speaks at a lectern, on television
  rede(c, t) {
    c.fillStyle = '#2a2f3a'; rr(c, 14, 6, 132, 82, 6); c.fill(); c.fillStyle = '#3f6fa0'; c.fillRect(20, 12, 120, 70); c.fillStyle = '#59636d'; c.fillRect(70, 88, 20, 6); c.fillRect(56, 94, 48, 3);
    person(c, 80, 74, 1.0, '#3d4f6b', t); c.fillStyle = '#2c3a52'; c.fillRect(66, 56, 28, 26); c.fillStyle = C.sun; circle(c, 80, 66, 3, C.sun);
    c.fillStyle = C.red; c.fillRect(20, 70, 120, 12); c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) c.fillRect(26 + i * 18, 75, 12, 2);
    const k = (t % 1) ; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.globalAlpha = 1 - k; c.beginPath(); c.arc(96, 40, 6 + k * 8, -0.6, 0.6); c.stroke(); c.globalAlpha = 1;
  },
  // a graduate throws the cap into the air
  studium(c, t) {
    const k = (t % 2) / 2, up = Math.sin(Math.PI * k) * 34; c.fillStyle = '#dcefff'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 80, 160, 20);
    person(c, 80, 92, 1.25, '#2a2f3a', t, 'dance'); c.save(); c.translate(80, 40 - up); c.rotate(k * TAU); c.fillStyle = '#2a2f3a'; c.fillRect(-11, -2, 22, 4); c.fillRect(-6, 0, 12, 6); c.strokeStyle = C.sun; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(9, 8); c.stroke(); c.restore();
  },
  // a big magnifying glass over footprints: guessing what happened
  lupe(c, t) {
    c.fillStyle = '#f3e7cf'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#b39a76'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(24 + i * 22, 70 - (i % 2) * 12, 5, 8, 0.3, 0, TAU); c.fill(); }
    const x = 80 + Math.cos(t * Math.PI) * 18, y = 52 + Math.sin(t * Math.PI) * 8;
    c.strokeStyle = '#7a4a2a'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 17, y + 17); c.lineTo(x + 36, y + 36); c.stroke();
    c.fillStyle = 'rgba(200,230,250,.55)'; c.beginPath(); c.arc(x, y, 22, 0, TAU); c.fill(); c.strokeStyle = '#59636d'; c.lineWidth = 5; c.stroke(); question(c, x, y, 0.9);
  },
  // the finish flag waves at the end of the path
  zielfahne(c, t) {
    c.fillStyle = '#dcefff'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.beginPath(); c.moveTo(0, 100); c.quadraticCurveTo(80, 50, 160, 70); c.lineTo(160, 100); c.fill();
    c.strokeStyle = '#d8c7a0'; c.lineWidth = 8; c.beginPath(); c.moveTo(10, 100); c.quadraticCurveTo(70, 78, 110, 66); c.stroke();
    c.fillStyle = '#5b3a22'; c.fillRect(110, 16, 3, 54);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) { const w = Math.sin(t * Math.PI * 2 + j * 0.8) * 2 * (j / 6); c.fillStyle = (i + j) % 2 ? '#2a2f3a' : '#fffdf6'; c.fillRect(113 + j * 6, 16 + i * 6 + w, 6, 6); }
  },
  // the plan: Monday circled on the calendar, a briefcase ready
  plan(c, t) {
    c.fillStyle = '#f6ead6'; c.fillRect(0, 0, 160, 100); calendar(c, 60, 48, 1.4, true);
    c.fillStyle = '#7a4a2a'; rr(c, 106, 52, 38, 28, 4); c.fill(); c.strokeStyle = '#5b3520'; c.lineWidth = 3; c.beginPath(); c.moveTo(118, 52); c.lineTo(118, 46); c.lineTo(132, 46); c.lineTo(132, 52); c.stroke(); c.fillStyle = C.sun; c.fillRect(122, 62, 6, 4);
    sparkle(c, 140, 30 + Math.sin(t * Math.PI) * 3, 6);
  },
  // she has arrived: the suitcase at the door, a tick
  ankommen(c, t) {
    c.fillStyle = '#dcefff'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 80, 160, 20);
    c.fillStyle = '#f3e7cf'; c.fillRect(70, 34, 70, 48); c.fillStyle = '#b5552f'; c.beginPath(); c.moveTo(62, 34); c.lineTo(105, 8); c.lineTo(148, 34); c.fill(); c.fillStyle = '#8c5a33'; c.fillRect(98, 52, 14, 30);
    girl(c, 82, 92, 0.95, t); c.fillStyle = C.blue; rr(c, 58, 72, 14, 14, 2); c.fill(); tick(c, 40, 30, 12, 1);
  },
  // Anton at the wheel of his van, the phone buzzing on the seat
  auto(c, t) {
    c.fillStyle = '#dcefff'; c.fillRect(0, 0, 160, 70); c.fillStyle = '#8b8d92'; c.fillRect(0, 70, 160, 30); c.fillStyle = '#fff'; for (let i = 0; i < 5; i++) c.fillRect(((i * 40 - t * 40) % 200 + 200) % 200 - 20, 86, 18, 3);
    c.fillStyle = '#f7f4ec'; rr(c, 30, 30, 100, 40, 6); c.fill(); c.fillStyle = '#8fc3ea'; c.beginPath(); c.moveTo(100, 34); c.lineTo(122, 34); c.lineTo(128, 52); c.lineTo(100, 52); c.fill();
    circle(c, 110, 44, 5, C.skin); c.fillStyle = '#5b3b26'; c.beginPath(); c.arc(110, 42, 5.4, Math.PI, TAU); c.fill(); c.fillStyle = '#e8873a'; c.fillRect(36, 40, 50, 12);
    circle(c, 56, 72, 9, C.ink); circle(c, 112, 72, 9, C.ink); circle(c, 56, 72, 3.5, '#c9d2da'); circle(c, 112, 72, 3.5, '#c9d2da');
    c.save(); c.translate(140, 20); c.rotate(Math.sin(t * 20) * 0.12); c.fillStyle = C.ink; rr(c, -6, -10, 12, 20, 2); c.fill(); c.fillStyle = '#8fc3ea'; c.fillRect(-4, -7, 8, 13); c.restore();
  },
  // the bookshelf stands, full of books
  regal(c, t) {
    c.fillStyle = '#f3ecdf'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#d4a26a'; c.fillRect(0, 88, 160, 12);
    c.fillStyle = '#a8733f'; c.fillRect(48, 8, 64, 82); c.fillStyle = '#f3ecdf'; for (let i = 0; i < 4; i++) c.fillRect(52, 12 + i * 19.5, 56, 16);
    const cols = [C.red, C.blue, C.green, C.sun, '#9b6ee8', '#e8873a']; for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) { c.fillStyle = cols[(i * 3 + j) % 6]; c.fillRect(54 + j * 7.6, 14 + i * 19.5 + (j % 3), 6, 14 - (j % 3)); }
    sparkle(c, 122, 20 + Math.sin(t * Math.PI) * 3, 5);
  },
  // lamps hang from the ceiling and glow
  lampen(c, t) {
    c.fillStyle = '#f3ecdf'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#d4a26a'; c.fillRect(0, 86, 160, 14);
    for (const [x, len, ph] of [[40, 30, 0], [80, 40, 1], [120, 30, 2]]) {
      const sw = Math.sin(t * Math.PI + ph) * 0.06; c.save(); c.translate(x, 0); c.rotate(sw);
      c.strokeStyle = '#4a4036'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, len); c.stroke();
      const g = c.createRadialGradient(0, len + 8, 1, 0, len + 20, 30); g.addColorStop(0, 'rgba(255,225,150,.8)'); g.addColorStop(1, 'rgba(255,225,150,0)'); c.fillStyle = g; c.fillRect(-30, len, 60, 50);
      c.fillStyle = '#f2c94c'; c.beginPath(); c.moveTo(-12, len + 12); c.lineTo(-5, len); c.lineTo(5, len); c.lineTo(12, len + 12); c.fill(); c.restore();
    }
  },
  // the neighbour walks home down the stairs (she has gone)
  nachbarin(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#e8dcc6'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#b39a76'; for (let i = 0; i < 6; i++) c.fillRect(i * 26, 60 + i * 6, 30, 40);
    c.strokeStyle = '#6d4526'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 40); c.lineTo(160, 76); c.stroke(); c.fillStyle = '#7a4f2c'; c.fillRect(126, 14, 22, 50);
    walker(c, 30 + k * 80, 60 + k * 18 + 2, 1.0, '#3f6fa0', t * 8, '#c9c9c9');
  },
  // … and the same neighbour stuck to the floor: her feet will not come off
  festgeklebt(c, t) {
    c.fillStyle = '#e8dcc6'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#b39a76'; c.fillRect(0, 76, 160, 24);
    c.save(); c.translate(80, 0); c.rotate(Math.sin(t * Math.PI * 4) * 0.08); c.translate(-80, 0); person(c, 80, 84, 1.4, '#3f6fa0', 0); c.fillStyle = '#c9c9c9'; c.beginPath(); c.arc(80, 84 - 36 * 1.4 - 2, 10, Math.PI, TAU); c.fill(); c.restore();
    c.fillStyle = 'rgba(242,201,76,.85)'; c.beginPath(); c.ellipse(80, 92, 22, 5, 0, 0, TAU); c.fill(); question(c, 120, 36, 1.0);
  },
  /* the Nominalstil film (id 482): the newsroom's stories. Helpers: helmet (a firefighter's), cat, grill, ladder */
  // a bridge with a little scaffold; cars roll over it again
  sanierung(c, t) {
    const k = (t % 3) / 3; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 62, 160, 38); c.fillStyle = '#6aa9d0'; c.fillRect(0, 76, 160, 24);
    c.fillStyle = '#b9b2a2'; c.fillRect(14, 50, 132, 8); for (const x of [40, 80, 120]) c.fillRect(x - 4, 58, 8, 30);
    c.strokeStyle = '#e8873a'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.strokeRect(124 + i * 0, 22 + i * 9, 18, 9); } c.beginPath(); c.moveTo(124, 22); c.lineTo(142, 49); c.stroke();
    for (const [o, col] of [[0, C.red], [0.5, C.blue]]) { const x = ((k + o) % 1) * 190 - 20; c.fillStyle = col; rr(c, x, 40, 22, 9, 3); c.fill(); c.fillRect(x + 4, 35, 13, 6); circle(c, x + 5, 50, 3, C.ink); circle(c, x + 17, 50, 3, C.ink); }
  },
  // a volcano puffs a cloud
  vulkan(c, t) {
    const k = (t % 3) / 3; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 84, 160, 16);
    c.fillStyle = '#7a5a44'; c.beginPath(); c.moveTo(24, 90); c.lineTo(68, 40); c.lineTo(92, 40); c.lineTo(136, 90); c.fill(); c.fillStyle = '#e8873a'; c.beginPath(); c.moveTo(68, 40); c.lineTo(92, 40); c.lineTo(86, 52); c.lineTo(74, 52); c.fill();
    c.fillStyle = '#d2453b'; c.beginPath(); c.moveTo(74, 44); c.quadraticCurveTo(66, 62, 70, 74); c.lineTo(76, 74); c.quadraticCurveTo(74, 60, 80, 46); c.fill();
    c.globalAlpha = 1 - k * 0.7; for (const [dx, r] of [[0, 9], [-8, 7], [8, 8]]) circle(c, 80 + dx + k * 10, 34 - k * 26 - Math.abs(dx) * 0.2, r * (0.6 + k * 0.9), '#9aa3ad'); c.globalAlpha = 1;
  },
  // two children rest in deckchairs in the sun
  erholung(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#f2dca5'; c.fillRect(0, 70, 160, 30); circle(c, 132, 20, 11, C.sun);
    for (const [x, col] of [[46, C.red], [100, C.blue]]) {
      c.strokeStyle = C.wood; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 16, 84); c.lineTo(x + 10, 56); c.moveTo(x + 14, 84); c.lineTo(x - 6, 64); c.stroke();
      c.fillStyle = col; c.beginPath(); c.moveTo(x - 12, 78); c.lineTo(x + 8, 56); c.lineTo(x + 14, 60); c.lineTo(x - 4, 82); c.fill();
      circle(c, x + 8, 54, 6, C.skin); c.fillStyle = '#5b3b26'; c.beginPath(); c.arc(x + 8, 52, 6.3, Math.PI, TAU); c.fill();
      c.fillStyle = C.blue; c.font = '700 9px Inter, system-ui, sans-serif'; c.globalAlpha = Math.sin(Math.PI * k); c.fillText('z', x + 16, 44 - k * 10); c.fillText('z', x + 22, 36 - k * 12); c.globalAlpha = 1;
    }
  },
  // data on a screen: the bars grow, a magnifier looks closely
  analyse(c, t) {
    const k = Math.min(1, (t % 2) / 1.2); c.fillStyle = '#eef2f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = C.ink; rr(c, 26, 14, 108, 64, 4); c.fill(); c.fillStyle = '#fbfaf6'; c.fillRect(30, 18, 100, 56);
    c.fillStyle = '#59636d'; c.fillRect(74, 78, 12, 8); c.fillRect(60, 86, 40, 4);
    [0.5, 0.8, 0.35, 0.95, 0.65].forEach((h, i) => { c.fillStyle = i === 3 ? C.red : C.blue; c.fillRect(40 + i * 17, 68 - 44 * h * k, 11, 44 * h * k); });
    c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.arc(112, 34, 11, 0, TAU); c.stroke(); c.lineWidth = 4; c.beginPath(); c.moveTo(120, 42); c.lineTo(130, 52); c.stroke();
  },
  // a lab tests a vaccine: a vial, bubbles, a tick
  impfstoff(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#eef6f8'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#d7e3e8'; c.fillRect(0, 76, 160, 24);
    c.fillStyle = 'rgba(160,200,230,.5)'; c.beginPath(); c.moveTo(56, 22); c.lineTo(56, 44); c.lineTo(40, 76); c.lineTo(88, 76); c.lineTo(72, 44); c.lineTo(72, 22); c.fill(); c.strokeStyle = '#59636d'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#4fc0a0'; c.beginPath(); c.moveTo(46, 64); c.lineTo(82, 64); c.lineTo(88, 76); c.lineTo(40, 76); c.fill();
    for (let i = 0; i < 4; i++) { const q = (k + i / 4) % 1; c.globalAlpha = 1 - q; circle(c, 58 + i * 4, 64 - q * 30, 2.5, '#4fc0a0'); } c.globalAlpha = 1;
    c.fillStyle = '#fbfaf6'; rr(c, 100, 40, 14, 36, 3); c.fill(); c.strokeStyle = '#59636d'; c.stroke(); c.fillStyle = C.blue; c.fillRect(102, 56, 10, 18); c.fillStyle = '#59636d'; c.fillRect(102, 36, 10, 5);
    tick(c, 128, 26, 11, (k - 0.5) * 2);
  },
  // the town builds flats: a crane lifts a block onto a new house
  wohnungsbau(c, t) {
    const k = (t % 3) / 3; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#b9b2a2'; c.fillRect(0, 86, 160, 14);
    c.fillStyle = '#e3c79a'; c.fillRect(70, 46, 60, 40); c.fillStyle = '#9fc4dc'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) c.fillRect(76 + i * 18, 52 + j * 16, 10, 10);
    c.strokeStyle = '#e0a92a'; c.lineWidth = 3; c.beginPath(); c.moveTo(30, 86); c.lineTo(30, 14); c.lineTo(132, 14); c.stroke(); c.lineWidth = 1; for (let y = 20; y < 86; y += 8) { c.beginPath(); c.moveTo(27, y); c.lineTo(33, y + 6); c.stroke(); }
    const bx = 50 + Math.min(1, k * 1.6) * 64, by = 26 + Math.min(1, Math.max(0, k * 1.6 - 0.2)) * 0; c.strokeStyle = C.ink; c.beginPath(); c.moveTo(bx, 14); c.lineTo(bx, by + 4); c.stroke();
    c.fillStyle = '#d9b8a8'; c.fillRect(bx - 12, by + 4, 24, 14); c.fillStyle = '#9fc4dc'; c.fillRect(bx - 7, by + 8, 6, 6); c.fillRect(bx + 2, by + 8, 6, 6);
  },
  // the press criticises a plan: a newspaper beside a plan with a big thumb down
  kritik(c, t) {
    c.fillStyle = '#eef2f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#e8f0f8'; rr(c, 18, 18, 68, 64, 3); c.fill(); c.strokeStyle = C.blue; c.lineWidth = 1.5; c.strokeRect(26, 28, 52, 44);
    c.beginPath(); c.moveTo(26, 50); c.lineTo(78, 50); c.moveTo(52, 28); c.lineTo(52, 72); c.stroke();
    c.save(); c.translate(116, 52); c.rotate(Math.PI); c.fillStyle = C.red; rr(c, -16, -4, 12, 26, 3); c.fill(); rr(c, -2, -2, 24, 22, 6); c.fill(); rr(c, 4, -18, 10, 20, 5); c.fill(); c.restore();
  },
  // she waits for an answer: the phone stays silent, the clock turns
  warten(c, t) {
    c.fillStyle = '#f3ece0'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#c9b89c'; c.fillRect(0, 80, 160, 20);
    c.fillStyle = C.wood; c.fillRect(30, 62, 60, 6); c.fillRect(34, 68, 4, 12); c.fillRect(82, 68, 4, 12);
    person(c, 58, 66, 1.0, '#9b5fb5', 0); c.fillStyle = '#5b3b26'; c.beginPath(); c.ellipse(52, 31, 3, 6, 0.4, 0, TAU); c.fill(); c.fillStyle = C.ink; rr(c, 64, 44, 7, 11, 2); c.fill();
    clockFace(c, 120, 36, 18, 3, (t % 2) * 30);
  },
  // a painter at her easel paints a man …
  malerin(c, t) {
    c.fillStyle = '#f3ece0'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#c9b89c'; c.fillRect(0, 84, 160, 16);
    c.strokeStyle = C.wood; c.lineWidth = 3; c.beginPath(); c.moveTo(70, 88); c.lineTo(80, 30); c.lineTo(92, 88); c.stroke(); c.fillStyle = '#fbfaf6'; c.fillRect(66, 30, 30, 34); c.strokeStyle = '#59636d'; c.lineWidth = 1; c.strokeRect(66, 30, 30, 34);
    circle(c, 81, 42, 5, C.skin); c.fillStyle = '#3d4f6b'; c.fillRect(76, 48, 10, 12);
    person(c, 44, 86, 1.1, '#d2453b', 0); c.fillStyle = '#7a4a2a'; c.beginPath(); c.arc(44, 46, 8.5, Math.PI, TAU); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.ellipse(44, 44, 9, 3, -0.2, 0, TAU); c.fill();
    c.strokeStyle = C.wood; c.lineWidth = 2; const b = Math.sin(t * 5) * 4; c.beginPath(); c.moveTo(54, 64); c.lineTo(66, 48 + b); c.stroke();
    person(c, 128, 86, 1.1, '#3d4f6b', 0); c.fillStyle = C.wood; c.fillRect(120, 72, 16, 4);
  },
  // … or the painter herself in a gold frame
  portraet(c, t) {
    c.fillStyle = '#f3ece0'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#c99a2e'; rr(c, 46, 8, 68, 84, 4); c.fill(); c.fillStyle = '#e8d6a8'; c.fillRect(52, 14, 56, 72);
    c.fillStyle = '#d2453b'; c.beginPath(); c.moveTo(60, 86); c.quadraticCurveTo(80, 56, 100, 86); c.fill(); circle(c, 80, 50, 13, C.skin);
    c.fillStyle = '#7a4a2a'; c.beginPath(); c.arc(80, 47, 13.6, Math.PI, TAU); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.ellipse(80, 36, 15, 5, -0.15, 0, TAU); c.fill(); circle(c, 85, 31, 2.5, C.ink);
    circle(c, 75, 51, 1.5, C.ink); circle(c, 85, 51, 1.5, C.ink); c.strokeStyle = C.ink; c.lineWidth = 1.2; c.beginPath(); c.arc(80, 55, 4, 0.3, Math.PI - 0.3); c.stroke();
  },
  // the members of the council do not agree: arms crossed, red lights
  abstimmung(c, t) {
    c.fillStyle = '#eef0f3'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#8a6a4a'; c.fillRect(0, 70, 160, 30);
    for (let i = 0; i < 4; i++) { const x = 26 + i * 36; person(c, x, 74, 0.95, ['#3d4f6b', '#7a5434', '#4f8a52', '#9b5fb5'][i], 0); c.strokeStyle = ['#3d4f6b', '#7a5434', '#4f8a52', '#9b5fb5'][i]; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 9, 56); c.lineTo(x + 9, 60); c.moveTo(x + 9, 56); c.lineTo(x - 9, 60); c.stroke();
      circle(c, x, 14, 6, Math.sin(t * Math.PI + i) > -0.3 ? '#d32f2f' : '#f28b82'); }
  },
  // the curtain falls on a stage
  vorhang(c, t) {
    const k = Math.min(1, ((t % 3) / 3) / 0.6); c.fillStyle = '#2a2230'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#7a5a44'; c.fillRect(10, 76, 140, 10);
    circle(c, 80, 40, 22, 'rgba(255,240,190,.25)'); person(c, 80, 76, 1.0, '#e8873a', 0);
    c.fillStyle = '#b3263a'; c.fillRect(10, 8, 140, 10 + k * 66); c.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 18; x < 150; x += 14) c.fillRect(x, 8, 3, 10 + k * 66);
    c.fillStyle = '#c99a2e'; c.fillRect(10, 18 + k * 66 - 3, 140, 3); c.fillStyle = '#8a1a2a'; c.fillRect(4, 4, 152, 6);
  },
  // a train is cancelled: a red cross blinks on the platform's board
  zugausfall(c, t) {
    c.fillStyle = '#e8eef2'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9aa6ae'; c.fillRect(0, 72, 160, 28); c.fillStyle = '#59636d'; c.fillRect(0, 70, 160, 3);
    c.fillStyle = '#d9dee3'; rr(c, 10, 40, 90, 28, 6); c.fill(); c.fillStyle = C.red; c.fillRect(10, 54, 90, 4); c.fillStyle = '#8fc3ea'; for (let i = 0; i < 5; i++) c.fillRect(16 + i * 17, 44, 11, 8);
    c.fillStyle = C.ink; rr(c, 108, 14, 44, 26, 3); c.fill(); c.fillStyle = '#59636d'; c.fillRect(128, 40, 4, 32);
    if (Math.sin(t * Math.PI * 2) > -0.2) { c.strokeStyle = '#ff5a4f'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(122, 19); c.lineTo(138, 35); c.moveTo(138, 19); c.lineTo(122, 35); c.stroke(); }
    person(c, 120, 92, 0.75, '#3f6fa0', 0);
  },
  // no fishing at the lake: an angler, a fish, a red sign
  angelverbot(c, t) {
    c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100); water(c, 56, t); c.fillStyle = '#9fcf7a'; c.fillRect(0, 50, 46, 50);
    person(c, 28, 66, 0.9, '#4f8a52', 0); c.strokeStyle = C.wood; c.lineWidth = 2; c.beginPath(); c.moveTo(36, 50); c.quadraticCurveTo(60, 20, 76, 30); c.stroke(); c.strokeStyle = '#59636d'; c.lineWidth = 1; c.beginPath(); c.moveTo(76, 30); c.lineTo(76, 66); c.stroke();
    noSign(c, 122, 34, 24, () => { c.fillStyle = C.blue; c.beginPath(); c.ellipse(122, 38, 11, 5, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(132, 38); c.lineTo(140, 32); c.lineTo(140, 44); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(110, 16); c.lineTo(120, 34); c.stroke(); });
  },
  // a grill flames up merrily, sausages and all
  grillen(c, t) {
    c.fillStyle = '#d8efc8'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 74, 160, 26);
    c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(66, 88); c.lineTo(74, 66); c.moveTo(94, 88); c.lineTo(86, 66); c.stroke();
    for (let i = 0; i < 5; i++) { const f = 0.7 + 0.3 * Math.sin(t * 11 + i * 1.7); c.fillStyle = i % 2 ? '#f2994a' : '#f2c94c'; c.beginPath(); c.moveTo(58 + i * 11, 50); c.quadraticCurveTo(54 + i * 11, 50 - 22 * f, 62 + i * 11, 50 - 34 * f); c.quadraticCurveTo(66 + i * 11, 50 - 16 * f, 68 + i * 11, 50); c.fill(); }
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(54, 50); c.lineTo(106, 50); c.lineTo(98, 66); c.lineTo(62, 66); c.fill();
    for (let i = 0; i < 3; i++) { const h = Math.abs(Math.sin(t * 4 + i)) * 4; c.fillStyle = '#a5532e'; rr(c, 62 + i * 13, 44 - h, 11, 5, 2.5); c.fill(); }
  },
  // the park stays green: a sign with a crossed-out grill
  grillverbot(c, t) {
    c.fillStyle = '#d8efc8'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 70, 160, 30);
    for (const [x, r] of [[24, 16], [54, 12], [140, 15]]) { c.fillStyle = C.wood; c.fillRect(x - 2, 52, 4, 22); circle(c, x, 44, r, C.green); }
    c.fillStyle = '#59636d'; c.fillRect(97, 54, 4, 30); noSign(c, 99, 36, 20, () => { c.fillStyle = C.ink; c.beginPath(); c.moveTo(88, 34); c.lineTo(110, 34); c.lineTo(106, 42); c.lineTo(92, 42); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(94, 42); c.lineTo(91, 50); c.moveTo(104, 42); c.lineTo(107, 50); c.stroke(); c.fillStyle = '#f2994a'; c.beginPath(); c.moveTo(94, 34); c.lineTo(99, 24); c.lineTo(104, 34); c.fill(); });
  },
  // a crowd with grills marches into the park
  grillmenge(c, t) {
    const k = (t % 2.5) / 2.5; c.fillStyle = '#d8efc8'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 74, 160, 26);
    for (let i = 0; i < 5; i++) { const x = ((k * 190 + i * 38) % 190) - 20; walker(c, x, 86, 0.85, ['#d2453b', '#3f6fa0', '#e8873a', '#4f8a52', '#9b5fb5'][i], t * 8 + i);
      c.fillStyle = C.ink; c.fillRect(x + 6, 58, 12, 4); c.fillStyle = '#f2994a'; c.beginPath(); c.moveTo(x + 7, 58); c.lineTo(x + 12, 51 - Math.sin(t * 12 + i) * 2); c.lineTo(x + 17, 58); c.fill(); }
  },
  // the firefighter brings the cat down the ladder; it purrs
  katzerettung(c, t) {
    const k = (t % 2.5) / 2.5, y = 22 + Math.min(1, k * 1.4) * 42; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 88, 160, 12);
    c.fillStyle = C.wood; c.fillRect(122, 10, 10, 80); circle(c, 128, 16, 26, C.green);
    ladder(c); firefighter(c, 92, y + 24, 1.0); cat(c, 103, y + 4, 0.8);
    if (k > 0.65) { c.fillStyle = '#e0465a'; for (let i = 0; i < 2; i++) { const q = (k - 0.65) / 0.35, hx = 112 + i * 8, hy = y - 10 - q * 14 - i * 6; c.beginPath(); c.moveTo(hx, hy + 4); c.bezierCurveTo(hx - 5, hy, hx - 2, hy - 4, hx, hy - 1); c.bezierCurveTo(hx + 2, hy - 4, hx + 5, hy, hx, hy + 4); c.fill(); } }
  },
  // … and the other way round: a tiny cat in a helmet carries a very surprised firefighter
  katzeheld(c, t) {
    const k = (t % 2.5) / 2.5, y = 22 + Math.min(1, k * 1.4) * 42; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 88, 160, 12);
    c.fillStyle = C.wood; c.fillRect(122, 10, 10, 80); circle(c, 128, 16, 26, C.green);
    ladder(c); cat(c, 94, y + 20, 1.1); helmet(c, 93, y + 6, 0.7);
    c.save(); c.translate(96, y - 2); c.rotate(-1.2); firefighter(c, 0, 0, 0.75); c.restore(); question(c, 64, y - 14, 0.8);
  },
  // a ship sinks slowly
  schiff(c, t) {
    const k = (t % 3) / 3; c.fillStyle = '#cfe7f5'; c.fillRect(0, 0, 160, 100);
    c.save(); c.translate(80, 52 + k * 26); c.rotate(-0.15 - k * 0.25);
    c.fillStyle = '#2f4a6b'; c.beginPath(); c.moveTo(-40, -6); c.lineTo(40, -6); c.lineTo(32, 8); c.lineTo(-34, 8); c.closePath(); c.fill();
    c.fillStyle = '#f7f4ec'; rr(c, -24, -20, 40, 14, 2); c.fill(); c.fillStyle = C.red; c.fillRect(-4, -32, 9, 12); c.restore();
    water(c, 60, t); for (let i = 0; i < 3; i++) { const q = (k * 2 + i / 3) % 1; c.globalAlpha = 1 - q; c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(70 + i * 10, 66 - q * 16, 2.5, 0, TAU); c.stroke(); } c.globalAlpha = 1;
  },
  // warm seas and storms: a dark cloud, lightning, a bending palm
  sturm(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#7d8fa3'; c.fillRect(0, 0, 160, 100); water(c, 66, t * 2, '#e3a46b');
    for (const [x, y, r] of [[50, 22, 16], [72, 16, 20], [96, 22, 16], [118, 20, 12]]) circle(c, x, y, r, '#4a5360');
    if (k > 0.45 && k < 0.6) { c.strokeStyle = '#fff3a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(80, 34); c.lineTo(72, 50); c.lineTo(82, 50); c.lineTo(74, 64); c.stroke(); }
    const sw = Math.sin(t * Math.PI) * 0.25; c.save(); c.translate(26, 70); c.rotate(0.35 + sw); c.fillStyle = C.wood; c.fillRect(-2, -34, 4, 34); c.fillStyle = C.green; for (const a of [-0.8, -0.2, 0.4, 1.0]) { c.save(); c.translate(0, -34); c.rotate(a); c.beginPath(); c.ellipse(10, 0, 12, 3, 0, 0, TAU); c.fill(); c.restore(); } c.restore();
  },
  // a specialist book: open, a chart and lines of text
  fachbuch(c, t) {
    c.fillStyle = '#eef2f5'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#3f6fa0'; rr(c, 18, 20, 124, 64, 4); c.fill();
    c.fillStyle = '#fbfaf6'; c.beginPath(); c.moveTo(24, 24); c.quadraticCurveTo(52, 18, 80, 26); c.lineTo(80, 80); c.quadraticCurveTo(52, 72, 24, 78); c.fill(); c.beginPath(); c.moveTo(136, 24); c.quadraticCurveTo(108, 18, 80, 26); c.lineTo(80, 80); c.quadraticCurveTo(108, 72, 136, 78); c.fill();
    c.fillStyle = '#b9b2a2'; for (let i = 0; i < 7; i++) c.fillRect(30, 32 + i * 6, i % 3 === 2 ? 30 : 42, 2.5);
    c.strokeStyle = C.red; c.lineWidth = 2; c.beginPath(); c.moveTo(88, 66); c.lineTo(100, 56); c.lineTo(110, 60); c.lineTo(128, 38); c.stroke(); c.strokeStyle = '#59636d'; c.lineWidth = 1; c.beginPath(); c.moveTo(88, 34); c.lineTo(88, 68); c.lineTo(130, 68); c.stroke();
  },
  // an official letter with a round red seal
  amtsbrief(c, t) {
    c.fillStyle = '#eef2f5'; c.fillRect(0, 0, 160, 100); c.save(); c.translate(80, 50); c.rotate(-0.06); c.fillStyle = '#fbfaf6'; rr(c, -40, -42, 80, 84, 2); c.fill(); c.strokeStyle = '#c9c0ad'; c.lineWidth = 1; c.stroke();
    c.fillStyle = C.ink; c.fillRect(-32, -34, 30, 4); c.fillStyle = '#b9b2a2'; for (let i = 0; i < 8; i++) c.fillRect(-32, -22 + i * 6, i % 4 === 3 ? 36 : 62, 2.5);
    circle(c, 22, 28, 11, '#b3263a'); circle(c, 22, 28, 7, '#d2453b'); c.strokeStyle = '#8a1a2a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(18, 28); c.lineTo(22, 24); c.lineTo(26, 28); c.lineTo(22, 32); c.closePath(); c.stroke(); c.restore();
  },
  // a strike: people with signs wave them; the train behind them stands still
  streik(c, t) {
    c.fillStyle = '#e8eef2'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9aa6ae'; c.fillRect(0, 80, 160, 20);
    c.fillStyle = '#d9dee3'; rr(c, 4, 34, 150, 30, 6); c.fill(); c.fillStyle = C.red; c.fillRect(4, 50, 150, 4); c.fillStyle = '#8fc3ea'; for (let i = 0; i < 8; i++) c.fillRect(10 + i * 18, 38, 11, 8);
    for (let i = 0; i < 4; i++) { const x = 26 + i * 36, a = Math.sin(t * Math.PI * 2 + i) * 0.2; person(c, x, 94, 0.85, ['#e8873a', '#3f6fa0', '#d2453b', '#4f8a52'][i], 0);
      c.save(); c.translate(x + 6, 72); c.rotate(a); c.fillStyle = C.wood; c.fillRect(-1, -24, 2.5, 26); c.fillStyle = i % 2 ? '#f2c94c' : '#fbfaf6'; c.fillRect(-10, -34, 22, 14); c.restore(); }
  },
  // volunteers clean a park: a rake, a bag, the litter goes
  park(c, t) {
    const k = (t % 2) / 2; c.fillStyle = '#d8efc8'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#9fcf7a'; c.fillRect(0, 70, 160, 30);
    for (const [x, r] of [[20, 15], [140, 14]]) { c.fillStyle = C.wood; c.fillRect(x - 2, 50, 4, 22); circle(c, x, 42, r, C.green); }
    person(c, 62, 92, 0.9, '#e8873a', 0); c.strokeStyle = C.wood; c.lineWidth = 2; const a = Math.sin(t * Math.PI * 2) * 6; c.beginPath(); c.moveTo(70, 70); c.lineTo(80 + a, 92); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(74 + a, 92); c.lineTo(88 + a, 92); c.stroke();
    person(c, 108, 92, 0.9, '#3f6fa0', 0); c.fillStyle = '#4a5360'; rr(c, 114, 72, 14, 18, 4); c.fill();
    c.globalAlpha = 1 - k; for (const [x, y] of [[88, 86], [96, 90], [36, 88]]) { c.fillStyle = '#c9c0ad'; c.fillRect(x, y, 5, 3); } c.globalAlpha = 1;
  },
  // he says sorry for the mistake: a sheet with a red cross, flowers held out
  entschuldigung(c, t) {
    c.fillStyle = '#f3ece0'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#c9b89c'; c.fillRect(0, 84, 160, 16);
    c.save(); c.translate(56, 86); c.rotate(0.12 + Math.sin(t * Math.PI) * 0.04); c.translate(-56, -86); person(c, 56, 86, 1.1, '#3d4f6b', 0); c.restore();
    c.fillStyle = C.green; c.fillRect(70, 52, 2, 14); for (const [dx, col] of [[-4, C.red], [3, C.sun], [0, '#e0465a']]) circle(c, 71 + dx, 50 - Math.abs(dx), 4, col);
    person(c, 112, 86, 1.1, '#9b5fb5', 0);
    c.fillStyle = '#fbfaf6'; c.fillRect(124, 14, 26, 32); c.strokeStyle = C.red; c.lineWidth = 3; c.beginPath(); c.moveTo(130, 22); c.lineTo(144, 38); c.moveTo(144, 22); c.lineTo(130, 38); c.stroke();
  },
  // the guests yawn while someone speaks
  gaehnen(c, t) {
    const k = Math.abs(Math.sin(t * Math.PI / 2)); c.fillStyle = '#eef0f3'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#8a6a4a'; c.fillRect(0, 80, 160, 20);
    person(c, 132, 80, 0.9, '#3d4f6b', 0); c.fillStyle = C.wood; c.fillRect(122, 58, 20, 22);
    for (let i = 0; i < 3; i++) { const x = 22 + i * 32; person(c, x, 90, 0.95, ['#4f8a52', '#e8873a', '#9b5fb5'][i], 0); c.fillStyle = C.ink; c.beginPath(); c.ellipse(x, 60, 2.5, 1 + k * 3, 0, 0, TAU); c.fill(); }
    c.fillStyle = C.blue; c.font = '700 10px Inter, system-ui, sans-serif'; c.globalAlpha = k; c.fillText('z', 42, 36); c.fillText('z', 82, 32); c.globalAlpha = 1;
  },
  // … or suddenly thrilled: arms up, confetti
  begeistert(c, t) {
    c.fillStyle = '#eef0f3'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#8a6a4a'; c.fillRect(0, 80, 160, 20);
    for (let i = 0; i < 3; i++) { const x = 30 + i * 40, j = Math.abs(Math.sin(t * 6 + i)) * 4; person(c, x, 90 - j, 0.95, ['#4f8a52', '#e8873a', '#9b5fb5'][i], t, 'dance'); }
    for (let i = 0; i < 14; i++) { const x = (i * 23) % 160, y = ((i * 17 + t * 40) % 80); c.fillStyle = [C.red, C.sun, C.blue, C.green][i % 4]; c.fillRect(x, y, 4, 3); }
  },
  // the dark cycle path: the lamp is out, a sign says no cycling
  radweg(c, t) {
    c.fillStyle = '#1f2a4d'; c.fillRect(0, 0, 160, 100); c.fillStyle = '#2e3a2e'; c.fillRect(0, 60, 160, 40); c.fillStyle = '#4a4f5a'; c.beginPath(); c.moveTo(60, 60); c.lineTo(100, 60); c.lineTo(140, 100); c.lineTo(20, 100); c.fill();
    c.fillStyle = '#2a2b33'; c.fillRect(36, 18, 3, 44); c.fillStyle = Math.sin(t * 9) > 0.7 ? '#f4d48a' : '#555a66'; circle(c, 38, 18, 5, c.fillStyle);
    c.fillStyle = '#59636d'; c.fillRect(119, 40, 3, 28); noSign(c, 120, 30, 15, () => { c.strokeStyle = C.ink; c.lineWidth = 1.6; c.beginPath(); c.arc(114, 34, 4, 0, TAU); c.moveTo(130, 34); c.arc(126, 34, 4, 0, TAU); c.moveTo(114, 34); c.lineTo(119, 27); c.lineTo(126, 34); c.stroke(); });
  },
};

/* the modal verbs' icons (plan Kap 6): drawn in a 28 × 28 badge */
export const ICONS = {
  kann(c) { circle(c, 14, 17, 9, '#f2c94c'); c.fillStyle = '#d2453b'; c.beginPath(); c.moveTo(8, 2); c.lineTo(12, 10); c.lineTo(16, 10); c.lineTo(20, 2); c.fill(); c.fillStyle = '#b8730a'; c.font = '800 11px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', 14, 17.5); },
  muss(c) { circle(c, 14, 14, 12, '#e8873a'); c.fillStyle = '#fff'; c.fillRect(12, 6, 4, 11); circle(c, 14, 21, 2.2, '#fff'); },
  darf(c) { circle(c, 14, 14, 12, '#4f8a52'); c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(8, 14); c.lineTo(12, 18); c.lineTo(20, 9); c.stroke(); },
  nicht(c) { circle(c, 14, 14, 12, '#d32f2f'); c.fillStyle = '#fff'; c.fillRect(6, 12, 16, 4); },
  will(c) { for (const [r, col] of [[12, '#d2453b'], [8.5, '#fff'], [5, '#d2453b'], [2, '#fff']]) circle(c, 14, 14, r, col); c.strokeStyle = '#2a2f3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(14, 14); c.lineTo(25, 3); c.stroke(); },
  soll(c) { c.fillStyle = '#3f6fa0'; c.beginPath(); c.roundRect ? c.roundRect(2, 3, 24, 17, 6) : c.rect(2, 3, 24, 17); c.fill(); c.beginPath(); c.moveTo(8, 19); c.lineTo(6, 26); c.lineTo(14, 19); c.fill(); c.fillStyle = '#fff'; c.font = '800 12px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 14, 12); },
  moechte(c) { c.fillStyle = '#e0465a'; c.beginPath(); c.moveTo(14, 24); c.bezierCurveTo(-2, 12, 6, 0, 14, 8); c.bezierCurveTo(22, 0, 30, 12, 14, 24); c.fill(); },
  frage(c) { circle(c, 14, 14, 12, '#2f7fd1'); c.fillStyle = '#fff'; c.font = '800 16px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 14, 15); },
};
