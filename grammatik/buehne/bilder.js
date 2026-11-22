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
