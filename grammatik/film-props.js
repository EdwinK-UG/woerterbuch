/* Deutschklinik film props: small SVG world in the approved Close Graphic Novel style (cream paper, brush-ink outlines,
   hatched shade, muted park palette, orange accent) for spatial scenes beside the grammar stage.
   A picture state lists items with explicit positions in a 600 x 260 design box. Between two states an item with the
   same id moves (walk, jump arc, lower, slide); poses switch at the right moment; marks and tags fade. Pure function of
   (previous state, state, progress), so seek and replay agree. GRAM_STAGE.picture(prev, cur, p, w, h, opts) -> SVG. */
(function (root) {
  'use strict';
  // scripts may arrive in any order: install now if the stage exists, otherwise the stage installs this when it loads
  function install(S) {
  const INK = '#1e2224', PAPER = '#f3eddc', K = { ink: INK, paper: PAPER, wall: '#b9ab90', wallTop: '#d4c7aa', wood: '#a8794d', woodDark: '#7a5534', lawn: '#a8bb83', path: '#e0d3b0', water: '#86aeb0', waterLine: '#3e6365', fin: '#d9622b', green: '#2f5d50', soft: '#5b5446', box: '#c9a46a', boxSide: '#a98650', cat: '#d58b4a', catDark: '#9a5a2a', skin: '#d6a77a', skin2: '#b9825a', metal: '#2f3a3a', glass: '#f6ecc6', sky: '#e9e2cf' };
  const f1 = (x) => Math.round(x * 10) / 10, lerp = (a, b, t) => a + (b - a) * t, sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const P = (d, fill, o) => '<path d="' + d + '" fill="' + (fill || 'none') + '" stroke="' + ((o && o.stroke) || INK) + '" stroke-width="' + ((o && o.w) || 2.2) + '" stroke-linejoin="round" stroke-linecap="round"' + (o && o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + (o && o.op != null ? ' opacity="' + o.op + '"' : '') + '/>';
  const R = (x, y, w, h, fill, o) => P('M' + f1(x) + ' ' + f1(y) + 'h' + f1(w) + 'v' + f1(h) + 'h' + f1(-w) + 'Z', fill, o);
  const C = (x, y, r, fill, o) => '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="' + (fill || 'none') + '" stroke="' + ((o && o.stroke) || INK) + '" stroke-width="' + ((o && o.w) || 2.2) + '"' + (o && o.op != null ? ' opacity="' + o.op + '"' : '') + '/>';
  const hatch = (d, id) => '<path d="' + d + '" fill="url(#' + id + 'h)" stroke="none"/>';
  const T = (x, y, s, size, col, o) => '<text x="' + f1(x) + '" y="' + f1(y) + '" font-family="\'Avenir Next\', \'Segoe UI\', system-ui, sans-serif" font-size="' + size + '" font-weight="' + ((o && o.weight) || 700) + '" fill="' + (col || INK) + '" text-anchor="' + ((o && o.anchor) || 'middle') + '"' + (o && o.op != null ? ' opacity="' + o.op + '"' : '') + ' paint-order="stroke" stroke="' + PAPER + '" stroke-width="4">' + esc(s) + '</text>';

  /* ---- people: jointed figure, 3/4 view, two-bone limbs so hands stay on wrists and feet stay on the ground ---- */
  const LOOK = {
    mara: { skin: K.skin, skin2: K.skin2, hair: '#6b2f1a', top: K.green, sleeve: '#f1ede4', legs: '#2b2d33', shoe: K.fin, braid: true },
    elias: { skin: '#a8724a', skin2: '#8a5a38', hair: '#1f1a17', top: '#3a5f8a', sleeve: '#3a5f8a', legs: '#c9b48e', shoe: '#2f3a3a', short: true, glasses: true },
    jonas: { skin: '#e2b48e', skin2: '#c4936c', hair: '#a8743a', top: '#7a8a3a', sleeve: '#7a8a3a', legs: '#3b4a5a', shoe: '#f1ede4', short: true },
    lena: { skin: '#8a5a3a', skin2: '#6e452b', hair: '#1a1210', top: '#b0413e', sleeve: '#b0413e', legs: '#2b2d33', shoe: '#f1ede4', bun: true },
  };
  function ik(ax, ay, bx, by, l1, l2, bend) { const dx = bx - ax, dy = by - ay, d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01), a = Math.atan2(dy, dx), c = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))); const ang = a + bend * c; return [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1, ax + Math.cos(a) * d, ay + Math.sin(a) * d]; }
  const limb = (x0, y0, x1, y1, x2, y2, w, col) => P('M' + f1(x0) + ' ' + f1(y0) + 'L' + f1(x1) + ' ' + f1(y1) + 'L' + f1(x2) + ' ' + f1(y2), 'none', { stroke: INK, w: w + 3.2 }) + P('M' + f1(x0) + ' ' + f1(y0) + 'L' + f1(x1) + ' ' + f1(y1) + 'L' + f1(x2) + ' ' + f1(y2), 'none', { stroke: col, w: w });
  // f: { who, x, y (ground), s (scale, 1 = 150 units tall), face: 1 right / -1 left, pose: stand|walk|sit|push|reach|wave, feet:[lx,rx] optional, hands:[[x,y],[x,y]] optional, mood }
  function figure(f, id) {
    const L = LOOK[f.who] || LOOK.mara, s = f.s || 1, d = f.face || 1, x = f.x, gy = f.y, sit = f.pose === 'sit';
    const hipY = gy - (sit ? 44 : 73.5) * s, shY = hipY - 46 * s, headY = shY - 22 * s, hx = x + (sit ? -d * 6 * s : 0);
    const feet = f.feet || [x - d * 7 * s, x + d * 9 * s], lift = f.lift || [0, 0];
    let out = '<ellipse cx="' + f1(x) + '" cy="' + f1(gy + 2) + '" rx="' + f1(26 * s) + '" ry="' + f1(5 * s) + '" fill="' + INK + '" opacity=".14"/>';
    const leg = (fx, ly, front) => { if (sit) { const kx = hx + d * 30 * s, ky = hipY - 2 * s; return limb(hx + d * (front ? 3 : -3) * s, hipY, kx, ky, kx + d * 2 * s, gy - 5 * s - ly, 9.5 * s, L.legs) + shoe(kx + d * 2 * s, gy - ly, front); } const r = ik(hx, hipY, fx, gy - 6 * s - ly, 36 * s, 34 * s, -d); return limb(hx + d * (front ? 2 : -2) * s, hipY, r[0], r[1], r[2], r[3], 9.5 * s, L.legs) + shoe(r[2], r[3] + 6 * s, front); };
    const shoe = (sx, sy, front) => P('M' + f1(sx - d * 5 * s) + ' ' + f1(sy) + 'q' + f1(d * 2 * s) + ' ' + f1(-9 * s) + ' ' + f1(d * 10 * s) + ' ' + f1(-8 * s) + 'q' + f1(d * 7 * s) + ' ' + f1(2 * s) + ' ' + f1(d * 8 * s) + ' ' + f1(8 * s) + 'Z', front ? L.shoe : shade(L.shoe), { w: 1.8 });
    const hands = f.hands || (f.pose === 'walk' ? [[hx - d * 14 * s, hipY + 4 * s], [hx + d * 16 * s, hipY]] : f.pose === 'wave' ? [[hx - d * 6 * s, hipY + 10 * s], [hx + d * 24 * s, shY - 34 * s]] : [[hx - d * 4 * s, hipY + 12 * s], [hx + d * 6 * s, hipY + 12 * s]]);
    const arm = (h, front) => { const sx = hx + d * (front ? 9 : -7) * s, r = ik(sx, shY + 4 * s, h[0], h[1], 26 * s, 25 * s, d * (h[1] < shY ? -1 : 1)); return limb(sx, shY + 4 * s, r[0], r[1], r[2], r[3], 7.5 * s, front ? L.sleeve : shade(L.sleeve)) + C(r[2], r[3], 4.6 * s, L.skin, { w: 1.8 }); };
    out += leg(feet[0], lift[0], false) + arm(hands[0], false);
    // torso and neck
    out += P('M' + f1(hx - 13 * s) + ' ' + f1(shY + 2 * s) + 'Q' + f1(hx) + ' ' + f1(shY - 5 * s) + ' ' + f1(hx + 13 * s) + ' ' + f1(shY + 2 * s) + 'L' + f1(hx + 11 * s) + ' ' + f1(hipY + 4 * s) + 'Q' + f1(hx) + ' ' + f1(hipY + 8 * s) + ' ' + f1(hx - 11 * s) + ' ' + f1(hipY + 4 * s) + 'Z', L.top, { w: 2 });
    out += hatch('M' + f1(hx - d * 13 * s) + ' ' + f1(shY + 4 * s) + 'L' + f1(hx - d * 4 * s) + ' ' + f1(shY + 2 * s) + 'L' + f1(hx - d * 5 * s) + ' ' + f1(hipY + 6 * s) + 'L' + f1(hx - d * 11 * s) + ' ' + f1(hipY + 4 * s) + 'Z', id);
    out += leg(feet[1], lift[1], true);
    out += R(hx - 3.5 * s, headY + 10 * s, 7 * s, 9 * s, L.skin, { w: 1.6 });
    // head: ellipse, hair cap, face features turned toward the facing side (3/4 view)
    const fx = hx + d * 3 * s, fy = headY;
    if (L.braid) out += P('M' + f1(fx - d * 9 * s) + ' ' + f1(fy - 2 * s) + 'q' + f1(-d * 10 * s) + ' ' + f1(10 * s) + ' ' + f1(-d * 6 * s) + ' ' + f1(26 * s), 'none', { stroke: L.hair, w: 6 * s });
    if (L.bun) out += C(fx - d * 9 * s, fy - 11 * s, 6 * s, L.hair, { w: 1.6 });
    out += '<ellipse cx="' + f1(fx) + '" cy="' + f1(fy) + '" rx="' + f1(11.5 * s) + '" ry="' + f1(13.5 * s) + '" fill="' + L.skin + '" stroke="' + INK + '" stroke-width="2"/>';
    out += P('M' + f1(fx - d * 11.5 * s) + ' ' + f1(fy - 1 * s) + 'Q' + f1(fx - d * 10 * s) + ' ' + f1(fy - 16 * s) + ' ' + f1(fx + d * 2 * s) + ' ' + f1(fy - 14 * s) + 'Q' + f1(fx + d * 12 * s) + ' ' + f1(fy - 12 * s) + ' ' + f1(fx + d * 11.5 * s) + ' ' + f1(fy - (L.short ? 4 : 6) * s) + 'Q' + f1(fx + d * 2 * s) + ' ' + f1(fy - 8 * s) + ' ' + f1(fx - d * 4 * s) + ' ' + f1(fy - 3 * s) + 'Q' + f1(fx - d * 8 * s) + ' ' + f1(fy + 2 * s) + ' ' + f1(fx - d * 11.5 * s) + ' ' + f1(fy + (L.short ? 0 : 6) * s) + 'Z', L.hair, { w: 1.6 });
    const ex = fx + d * 5 * s, ey = fy + 1 * s, mood = f.mood || 'calm';
    out += C(ex, ey, 1.6 * s, INK, { w: 0.5 }) + C(ex - d * 7 * s, ey, 1.4 * s, INK, { w: 0.5 });
    out += P('M' + f1(ex - 2.5 * s) + ' ' + f1(ey - 4.5 * s) + 'l' + f1(5 * s) + ' ' + f1(mood === 'focus' ? 1 : -1) + 'M' + f1(ex - d * 7 * s - 2 * s) + ' ' + f1(ey - 4.5 * s) + 'l' + f1(4 * s) + ' ' + f1(-0.6), 'none', { w: 1.6 });
    out += P('M' + f1(ex + d * 2.5 * s) + ' ' + f1(ey + 1 * s) + 'l' + f1(d * 2.4 * s) + ' ' + f1(4.2 * s) + 'l' + f1(-d * 2.6 * s) + ' ' + f1(0.6 * s), 'none', { w: 1.4 });
    out += P('M' + f1(ex - d * 4 * s) + ' ' + f1(ey + 8 * s) + 'q' + f1(d * 3 * s) + ' ' + f1(mood === 'happy' ? 2.4 * s : 0.8 * s) + ' ' + f1(d * 6 * s) + ' ' + f1(-0.5 * s), 'none', { stroke: '#8a3f36', w: 1.6 });
    if (L.glasses) out += C(ex - 0.5 * s, ey, 3.4 * s, 'none', { w: 1.2 }) + C(ex - d * 7.5 * s, ey, 3.1 * s, 'none', { w: 1.2 });
    out += arm(hands[1], true);
    return '<g>' + out + '</g>';
  }
  function shade(c) { const n = parseInt(c.slice(1), 16), k = 0.82; return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join(''); }

  /* ---- props (x,y = ground anchor) ---- */
  const PROPS = {
    floor: (it) => P('M' + f1(it.x0 || 20) + ' ' + f1(it.y) + 'H' + f1(it.x1 || 580), 'none', { w: 2.4 }) + '<rect x="' + f1(it.x0 || 20) + '" y="' + f1(it.y) + '" width="' + f1((it.x1 || 580) - (it.x0 || 20)) + '" height="10" fill="url(#IDh)" opacity=".6"/>',
    box: (it, id) => { const x = it.x, y = it.y, w = 120, h = 66; return '<g>' + P('M' + (x - w / 2) + ' ' + (y - h) + 'l18 -16h' + w + 'l-18 16Z', K.boxSide) + R(x - w / 2, y - h, w, h, K.box) + hatch('M' + (x + w / 2) + ' ' + (y - h) + 'l18 -16v' + h + 'l-18 16Z', id) + P('M' + (x + w / 2) + ' ' + (y - h) + 'l18 -16v' + h + 'l-18 16', K.boxSide) + P('M' + (x - w / 2 + 8) + ' ' + (y - h / 2) + 'h' + (w - 16), 'none', { w: 1.2, op: 0.5 }) + '</g>'; },
    boxFront: (it) => { const x = it.x, y = it.y, w = 120, h = 66; return R(x - w / 2, y - h, w, h, K.box) + P('M' + (x - w / 2 + 8) + ' ' + (y - h / 2) + 'h' + (w - 16), 'none', { w: 1.2, op: 0.5 }) + (it.rim ? P('M' + (x - w / 2) + ' ' + (y - h) + 'h' + w, 'none', { stroke: K.fin, w: 4 }) : ''); },
    cat: (it) => { const x = it.x, y = it.y, d = it.face || 1, po = it.pose || 'sit', c = K.cat; if (po === 'sleep') return '<g><ellipse cx="' + x + '" cy="' + (y - 11) + '" rx="30" ry="12" fill="' + c + '" stroke="' + INK + '" stroke-width="2"/>' + C(x + d * 24, y - 15, 9, c) + P('M' + (x + d * 20) + ' ' + (y - 16) + 'q3 2 6 0M' + (x + d * 26) + ' ' + (y - 16) + 'q3 2 6 0', 'none', { w: 1.3 }) + P('M' + (x - d * 30) + ' ' + (y - 8) + 'q' + (d * 12) + ' 8 ' + (d * 30) + ' 4', 'none', { stroke: K.catDark, w: 4 }) + '<text x="' + (x + d * 34) + '" y="' + (y - 30) + '" font-size="12" font-family="system-ui" fill="' + K.soft + '">z</text></g>';
      const body = po === 'jump' ? '<ellipse cx="' + x + '" cy="' + (y - 20) + '" rx="30" ry="11" transform="rotate(' + (-d * 18) + ' ' + x + ' ' + (y - 20) + ')" fill="' + c + '" stroke="' + INK + '" stroke-width="2"/>' + limb(x - d * 18, y - 16, x - d * 30, y - 6, x - d * 40, y - 2, 4, c) + limb(x + d * 14, y - 22, x + d * 28, y - 16, x + d * 38, y - 18, 4, c)
        : po === 'run' ? '<ellipse cx="' + x + '" cy="' + (y - 17) + '" rx="28" ry="11" fill="' + c + '" stroke="' + INK + '" stroke-width="2"/>' + limb(x - d * 16, y - 12, x - d * 24, y - 4, x - d * 18, y, 4, c) + limb(x + d * 14, y - 12, x + d * 22, y - 4, x + d * 30, y - 2, 4, c)
        : '<ellipse cx="' + (x - d * 4) + '" cy="' + (y - 20) + '" rx="18" ry="21" fill="' + c + '" stroke="' + INK + '" stroke-width="2"/>' + limb(x + d * 6, y - 18, x + d * 9, y - 8, x + d * 10, y - 1, 4, c);
      const hx = po === 'sit' ? x + d * 6 : x + d * 32, hy = po === 'sit' ? y - 44 : po === 'jump' ? y - 34 : y - 26;
      return '<g>' + P('M' + (x - d * 22) + ' ' + (y - 14) + 'q' + (-d * 20) + ' ' + (po === 'sit' ? -4 : -18) + ' ' + (-d * 12) + ' ' + (po === 'sit' ? -30 : -34), 'none', { stroke: INK, w: 7 }) + P('M' + (x - d * 22) + ' ' + (y - 14) + 'q' + (-d * 20) + ' ' + (po === 'sit' ? -4 : -18) + ' ' + (-d * 12) + ' ' + (po === 'sit' ? -30 : -34), 'none', { stroke: c, w: 4 }) + body + C(hx, hy, 12, c) + P('M' + (hx - 10) + ' ' + (hy - 6) + 'l2 -13 7 8M' + (hx + 10) + ' ' + (hy - 6) + 'l-2 -13 -7 8', c, { w: 1.8 }) + C(hx + d * 4, hy - 1, 1.5, INK, { w: 0.5 }) + C(hx - d * 3, hy - 1, 1.4, INK, { w: 0.5 }) + P('M' + (hx + d * 1) + ' ' + (hy + 4) + 'l' + (d * 2) + ' 2 ' + (d * 2) + ' -2', 'none', { w: 1.2 }) + '</g>'; },
    wall: (it, id) => { const x = it.x, y = it.y, h = it.h || 170, w = it.w || 26; let s = R(x, y - h, w, h, K.wall) + R(x - 3, y - h - 8, w + 6, 8, K.wallTop) + hatch('M' + x + ' ' + (y - h) + 'h' + w + 'v' + h + 'h' + (-w) + 'Z', id); for (let r = 1; r < h / 22; r++) s += P('M' + x + ' ' + (y - r * 22) + 'h' + w, 'none', { w: 1, op: 0.45 }); return s; },
    bike: (it) => { const x = it.x, y = it.y, d = it.face || 1, r = 27, tilt = it.lean || 0; const a = x - d * 38, b = x + d * 38, cy = y - r; const g = '<g transform="rotate(' + f1(tilt) + ' ' + f1(x) + ' ' + f1(y) + ')">' + C(a, cy, r, 'none', { w: 3 }) + C(b, cy, r, 'none', { w: 3 }) + C(a, cy, 3, INK) + C(b, cy, 3, INK) + P('M' + a + ' ' + cy + 'L' + (x - d * 4) + ' ' + cy + 'L' + (x + d * 20) + ' ' + (cy - 30) + 'L' + (x - d * 12) + ' ' + (cy - 30) + 'Z', 'none', { stroke: K.fin, w: 4 }) + P('M' + (x - d * 4) + ' ' + cy + 'L' + (x - d * 14) + ' ' + (cy - 38) + 'M' + (x + d * 20) + ' ' + (cy - 30) + 'L' + b + ' ' + cy + 'M' + (x + d * 20) + ' ' + (cy - 30) + 'l' + (d * 4) + ' -12h' + (d * 9), 'none', { stroke: K.fin, w: 4 }) + P('M' + (x - d * 20) + ' ' + (cy - 40) + 'h14', 'none', { w: 4 }) + '</g>'; return g; },
    table: (it, id) => { const x = it.x, y = it.y, w = it.w || 200, h = it.h || 92; return R(x - w / 2, y - h, w, 12, K.wood) + hatch('M' + (x - w / 2) + ' ' + (y - h + 12) + 'h' + w + 'v4h' + (-w) + 'Z', id) + R(x - w / 2 + 12, y - h + 12, 12, h - 12, K.woodDark) + R(x + w / 2 - 24, y - h + 12, 12, h - 12, K.woodDark); },
    book: (it) => { const x = it.x, y = it.y; return R(x - 30, y - 12, 60, 12, '#b0413e') + P('M' + (x - 26) + ' ' + (y - 4) + 'h52', 'none', { stroke: PAPER, w: 3 }); },
    lamp: (it) => { const x = it.x, y = it.y, top = it.top != null ? it.top : 18; return P('M' + x + ' ' + top + 'V' + (y - 30), 'none', { w: 2 }) + P('M' + (x - 30) + ' ' + y + 'L' + (x - 12) + ' ' + (y - 30) + 'h24L' + (x + 30) + ' ' + y + 'Z', K.green) + '<ellipse cx="' + x + '" cy="' + (y + 2) + '" rx="12" ry="4" fill="' + K.glass + '" stroke="' + INK + '" stroke-width="1.5"/>'; },
    hook: (it) => P('M' + (it.x0 || 40) + ' 14H' + (it.x1 || 560), 'none', { w: 3 }) + '<rect x="' + (it.x0 || 40) + '" y="4" width="' + ((it.x1 || 560) - (it.x0 || 40)) + '" height="10" fill="url(#IDh)" opacity=".7"/>',
    hand: (it) => { const x = it.x, y = it.y, d = it.face || -1; return P('M' + (x + d * 70) + ' ' + (y + 8) + 'Q' + (x + d * 30) + ' ' + (y + 4) + ' ' + (x + d * 12) + ' ' + y, 'none', { stroke: INK, w: 15 }) + P('M' + (x + d * 70) + ' ' + (y + 8) + 'Q' + (x + d * 30) + ' ' + (y + 4) + ' ' + (x + d * 12) + ' ' + y, 'none', { stroke: '#f1ede4', w: 11 }) + '<ellipse cx="' + x + '" cy="' + y + '" rx="12" ry="9" fill="' + K.skin + '" stroke="' + INK + '" stroke-width="2"/>'; },
    door: (it, id) => { const x = it.x, y = it.y; if (it.open) { const o = Math.max(0, Math.min(1, it.open)), lw = 72 * (1 - 0.72 * o); return R(x - 46, y - 170, 92, 170, '#e9e2cf', { w: 2.4 }) + R(x - 36, y - 162, 72, 162, '#3b3530') + P('M' + (x - 36) + ' ' + (y - 162) + 'L' + f1(x - 36 + lw) + ' ' + f1(y - 162 - 10 * o) + 'V' + f1(y + 8 * o) + 'L' + (x - 36) + ' ' + y + 'Z', '#7a5534') + C(x - 36 + lw - 10, y - 80, 4, '#d4c7aa') + R(x - 60, y, 120, 6, '#cfc2a2', { w: 1.6 }); }
      return R(x - 46, y - 170, 92, 170, '#e9e2cf', { w: 2.4 }) + R(x - 36, y - 162, 72, 162, '#7a5534') + hatch('M' + (x + 10) + ' ' + (y - 162) + 'h26v162h-26Z', id) + C(x + 24, y - 80, 4, '#d4c7aa') + R(x - 60, y, 120, 6, '#cfc2a2', { w: 1.6 }); },
    sign: (it) => { const x = it.x, y = it.y, ban = it.kind !== 'helmet', col = ban ? '#b0413e' : '#3a6ea5'; let ic = '';
      if (it.kind === 'helmet') ic = P('M' + (x - 22) + ' ' + (y - 70) + 'q22 -38 44 0z', '#f1ede4', { stroke: '#f1ede4', w: 2 }) + P('M' + (x - 28) + ' ' + (y - 70) + 'h56', 'none', { stroke: '#f1ede4', w: 4 });
      else if (it.kind === 'trash') ic = R(x - 14, y - 96, 28, 34, 'none', { stroke: INK, w: 3 }) + P('M' + (x - 18) + ' ' + (y - 100) + 'h36M' + (x - 5) + ' ' + (y - 106) + 'h10', 'none', { w: 3 });
      else ic = P('M' + (x - 22) + ' ' + (y - 66) + 'l6 -16l6 16l6 -20l6 20l6 -14l6 14', 'none', { stroke: K.green, w: 3 });
      return P('M' + x + ' ' + y + 'V' + (y - 50), 'none', { stroke: K.metal, w: 5 }) + C(x, y - 82, 34, ban ? '#f6f1e6' : col, { stroke: col, w: 6 }) + ic + (ban ? P('M' + (x - 24) + ' ' + (y - 106) + 'L' + (x + 24) + ' ' + (y - 58), 'none', { stroke: col, w: 6 }) : ''); },
    spot: (it) => '<ellipse cx="' + it.x + '" cy="' + (it.y + 3) + '" rx="34" ry="8" fill="none" stroke="' + K.fin + '" stroke-width="2.4" stroke-dasharray="6 5"/>',
    footprints: (it) => { const x = it.x, y = it.y; const fp = (fx) => '<ellipse cx="' + fx + '" cy="' + (y + 2) + '" rx="9" ry="4" fill="' + K.fin + '" opacity=".55"/>'; return fp(x - 10) + fp(x + 12); },
    house: (it, id) => { const x = it.x, y = it.y, w = it.w || 190, h = it.h || 110; return R(x - w / 2, y - h, w, h, '#c8b79a') + P('M' + (x - w / 2 - 12) + ' ' + (y - h) + 'L' + x + ' ' + (y - h - 62) + 'L' + (x + w / 2 + 12) + ' ' + (y - h) + 'Z', '#a14a33') + R(x - 18, y - 56, 36, 56, '#7a5534') + R(x - 72, y - 82, 34, 30, '#6a7470') + R(x + 38, y - 82, 34, 30, '#6a7470') + hatch('M' + (x + w / 2 - 40) + ' ' + (y - h) + 'h40v' + h + 'h-40Z', id); },
    plan: (it) => { const x = it.x, y = it.y, w = it.w || 120, h = it.h || 90; return '<g>' + R(x - w / 2, y - h / 2, w, h, 'rgba(243,237,220,.96)', { w: 1.6 }) + R(x - 26, y - 16, 52, 32, '#c8b79a', { w: 1.6 }) + T(x - w / 2 + 7, y + h / 2 - 7, 'vorne', 11, K.soft, { weight: 600, anchor: 'start' }) + T(x - w / 2 + 7, y - h / 2 + 15, 'hinten', 11, K.soft, { weight: 600, anchor: 'start' }) + (it.dot ? C(lerp(x, x, 0) + (it.dot[0] || 0), y + (it.dot[1] || 0), 5, K.fin, { w: 1.4 }) : '') + (it.zone ? R(x - 40, y - h / 2 + 18, 80, 14, 'none', { stroke: K.fin, w: 1.8, dash: '4 3' }) : '') + '</g>'; },
    chair: (it) => { const x = it.x, y = it.y, d = it.face || 1; return P('M' + (x - d * 26) + ' ' + y + 'V' + (y - 50) + 'H' + (x + d * 26) + 'V' + y + 'M' + (x - d * 26) + ' ' + (y - 50) + 'V' + (y - 112), 'none', { stroke: INK, w: 7 }) + P('M' + (x - d * 26) + ' ' + y + 'V' + (y - 50) + 'H' + (x + d * 26) + 'V' + y + 'M' + (x - d * 26) + ' ' + (y - 50) + 'V' + (y - 112), 'none', { stroke: K.wood, w: 4 }); },
    bench: (it) => { const x = it.x, y = it.y, w = it.w || 300; return R(x - w / 2, y - 44, w, 9, K.wood) + R(x - w / 2, y - 84, w, 8, K.wood) + P('M' + (x - w / 2 + 16) + ' ' + y + 'V' + (y - 84) + 'M' + (x + w / 2 - 16) + ' ' + y + 'V' + (y - 84), 'none', { stroke: K.metal, w: 5 }); },
    seat: (it) => R(it.x - 34, it.y - 50, 68, 8, 'none', { stroke: K.fin, w: 2.4, dash: '5 4' }),
    lake: (it, id) => { const x = it.x, y = it.y, w = it.w || 300; return P('M' + (x - w / 2) + ' ' + y + 'Q' + x + ' ' + (y + 60) + ' ' + (x + w / 2) + ' ' + y + 'Z', K.water) + P('M' + (x - w / 2 + 30) + ' ' + (y + 14) + 'h40M' + (x + 20) + ' ' + (y + 24) + 'h50', 'none', { stroke: K.waterLine, w: 1.6 }) + R(x - w / 2 - 120, y - 2, 120, 8, K.lawn, { w: 1.6 }); },
    swimmer: (it) => { const x = it.x, y = it.y, d = it.face || 1; return C(x + d * 18, y - 4, 9, K.skin) + P('M' + (x - d * 22) + ' ' + (y + 2) + 'q' + (d * 14) + ' -10 ' + (d * 30) + ' -2', 'none', { stroke: K.skin, w: 6 }) + P('M' + (x - d * 30) + ' ' + (y + 4) + 'q' + (d * 30) + ' 8 ' + (d * 60) + ' 0', 'none', { stroke: K.waterLine, w: 1.6 }); },
    diver: (it) => { const x = it.x, y = it.y, d = it.face || 1, a = it.dive ? 60 : 0; return '<g transform="rotate(' + (d * a) + ' ' + x + ' ' + (y - 40) + ')">' + figure({ who: 'jonas', x, y, s: 0.62, face: d, pose: 'stand', hands: [[x - d * 4, y - 82], [x + d * 6, y - 84]] }, 'IDp') + '</g>'; },
    country: (it) => { const x = it.x, y = it.y, w = it.w || 150, h = it.h || 110; return '<g>' + P('M' + (x - w / 2) + ' ' + (y - h / 2 + 10) + 'l' + (w * 0.3) + ' -14l' + (w * 0.4) + ' 8l' + (w * 0.3) + ' -6v' + (h - 20) + 'l' + (-w * 0.35) + ' 14l' + (-w * 0.65) + ' -8Z', it.fill || '#d8d0b8', { w: 2 }) + T(x, y + 6, it.label || '', 15, INK, { weight: 700 }) + '</g>'; },
    dot: (it) => C(it.x, it.y, it.r || 5, K.fin, { w: 1.4 }),
    splash: (it) => P('M' + (it.x - 30) + ' ' + it.y + 'q10 -22 18 -4q8 -26 16 0q8 -20 16 2', 'none', { stroke: K.waterLine, w: 2 }),
    pin: (it) => P('M' + it.x + ' ' + it.y + 'c-12 -16 -12 -26 0 -26c12 0 12 10 0 26Z', K.fin, { w: 1.8 }) + C(it.x, it.y - 17, 3.5, PAPER, { w: 1 }),
    photo: (it, id) => { const x = it.x, y = it.y; return R(x - 70, y - 90, 140, 90, '#fbf7ec', { w: 2.4 }) + R(x - 60, y - 80, 120, 64, '#a8bb83', { w: 1.4 }) + P('M' + (x - 60) + ' ' + (y - 34) + 'q30 -26 60 -10q30 -18 60 2v16h-120Z', '#86aeb0', { w: 1.2 }) + (it.detail ? '<g>' + C(x + 22, y - 48, 7, '#d58b4a', { w: 1.6 }) + P('M' + (x + 12) + ' ' + (y - 40) + 'q10 8 22 0', '#d58b4a', { w: 1.4 }) + '</g>' : ''); },
    busstop: (it) => { const x = it.x, y = it.y; return P('M' + x + ' ' + y + 'V' + (y - 150), 'none', { stroke: K.metal, w: 5 }) + C(x, y - 160, 15, '#e7b04a') + T(x, y - 155, 'H', 15, INK) + R(x + 30, y - 120, 80, 120, 'rgba(134,174,176,.25)', { w: 2 }); },
    bus: (it) => { const x = it.x, y = it.y; return R(x - 110, y - 92, 220, 80, '#e7b04a') + R(x - 96, y - 80, 50, 30, '#f6ecc6', { w: 1.6 }) + R(x - 36, y - 80, 50, 30, '#f6ecc6', { w: 1.6 }) + R(x + 24, y - 80, 50, 30, '#f6ecc6', { w: 1.6 }) + C(x - 66, y - 10, 13, K.metal) + C(x + 66, y - 10, 13, K.metal); },
  };

  /* ---- marks and tags (fade in/out) ---- */
  const MARKS = {
    contact: (m) => m.v ? P('M' + m.x + ' ' + m.y0 + 'V' + m.y1, 'none', { stroke: K.fin, w: 5 }) : P('M' + m.x0 + ' ' + m.y + 'H' + m.x1, 'none', { stroke: K.fin, w: 4 }),
    gap: (m) => P('M' + m.x + ' ' + m.y0 + 'V' + m.y1 + 'M' + (m.x - 7) + ' ' + m.y0 + 'h14M' + (m.x - 7) + ' ' + m.y1 + 'h14', 'none', { stroke: K.fin, w: 2.2 }) + (m.l ? T(m.x + 10, (m.y0 + m.y1) / 2 + 5, m.l, 13, K.fin, { anchor: 'start' }) : ''),
    start: (m) => C(m.x, m.y, 6, PAPER, { stroke: K.green, w: 3 }),
    end: (m) => P('M' + m.x + ' ' + m.y + 'c-10 -14 -10 -22 0 -22c10 0 10 8 0 22Z', K.fin, { w: 1.6 }),
    path: (m) => P(m.d, 'none', { stroke: K.fin, w: 2.4, dash: '7 6' }) + (m.arrow ? P('M' + m.arrow[0] + ' ' + m.arrow[1] + 'l-12 -6v12Z', K.fin, { stroke: K.fin, w: 1 }) : ''),
    zone: (m) => '<rect x="' + m.x + '" y="' + m.y + '" width="' + m.w + '" height="' + m.h + '" rx="10" fill="' + K.fin + '" fill-opacity=".08" stroke="' + K.fin + '" stroke-width="2" stroke-dasharray="6 5"/>',
    tag: (m) => { const z = Math.max(14, 11.5 / curScale), k = z / 14, w = (m.t.length * 8.2 + 22) * k, x = Math.max(w / 2 + 4, Math.min(596 - w / 2, m.x)); return '<g><rect x="' + f1(x - w / 2) + '" y="' + f1(m.y - 16 * k) + '" width="' + f1(w) + '" height="' + f1(24 * k) + '" rx="' + f1(12 * k) + '" fill="' + PAPER + '" stroke="' + (m.g ? K.fin : K.green) + '" stroke-width="2"/>' + T(x, m.y + k, m.t, f1(z), m.g ? K.fin : K.green) + '</g>'; },
    gaze: (it) => P('M' + it.x0 + ' ' + it.y0 + 'L' + it.x1 + ' ' + it.y1, 'none', { stroke: K.fin, w: 2, dash: '2 6' }) + C(it.x1, it.y1, 4, K.fin, { w: 1 }),
    note: (m) => T(m.x, m.y, m.t, f1(Math.max(13, 11.5 / curScale)), K.soft, { weight: 600, anchor: m.anchor || 'middle' }),
  };

  /* ---- motion between two picture states ---- */
  function walkFeet(x0, x1, u, s, face) { // grounded walk: each foot is planted or swinging, never sliding
    const dx = x1 - x0, n = Math.max(1, Math.ceil(Math.abs(dx) / (34 * s))), stepU = 1 / n, k = Math.min(n - 1, Math.floor(u / stepU)), f = sm((u - k * stepU) / stepU), st = dx / n, base = [-7 * s * face, 9 * s * face];
    const pos = [x0 + base[0], x0 + base[1]], lift = [0, 0];
    for (let j = 0; j <= k; j++) { const mover = j % 2, target = x0 + (j + 1) * st + base[mover] * (j === n - 1 ? 1 : 1); if (j < k) pos[mover] = target; else { pos[mover] = lerp(pos[mover], target, f); lift[mover] = Math.sin(Math.PI * f) * 10 * s; } }
    return { feet: pos, lift, x: lerp(x0, x1, sm(u)) };
  }
  function mix(a, b, p) { // one item between states a and b (same id)
    if (!a) return b; if (!b) return a; if (p >= 1) return b; if (p <= 0) return a;
    if (Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && JSON.stringify(a.hands) === JSON.stringify(b.hands) && (a.lean || 0) === (b.lean || 0) && (a.open || 0) === (b.open || 0)) return b.move === 'cut' || a.pose === b.pose ? b : (p < 0.5 ? a : b);   // nothing moves: no replayed jump or walk in place
    const how = b.move || 'slide', out = Object.assign({}, b);
    if (how === 'cut') return p < 0.5 ? a : b;
    const u = sm(p); out.x = lerp(a.x, b.x, u); out.y = lerp(a.y, b.y, u);
    if (how === 'jump') { out.y -= Math.sin(Math.PI * p) * (b.arc || 70); out.pose = p < 0.92 ? 'jump' : b.pose; out.x = lerp(a.x, b.x, p); }
    if (how === 'run') { out.pose = p < 0.95 ? 'run' : b.pose; }
    if (how === 'lower') { out.x = lerp(a.x, b.x, sm(p / 0.4)); out.y = lerp(a.y, b.y, sm((p - 0.35) / 0.65)); }
    if (how === 'walk' && b.k === 'figure') { const w = walkFeet(a.x, b.x, p, b.s || 1, b.face || 1); out.x = w.x; out.feet = w.feet; out.lift = w.lift; out.pose = 'walk'; }
    if (how === 'sit' && b.k === 'figure') { out.pose = p < 0.6 ? 'stand' : 'sit'; out.x = lerp(a.x, b.x, sm(p / 0.6)); }
    if (b.hands && a.hands) out.hands = b.hands.map((h, i) => [lerp(a.hands[i][0], h[0], u), lerp(a.hands[i][1], h[1], u)]);
    if (b.open != null || a.open != null) out.open = lerp(a.open || 0, b.open || 0, u);
    if (b.lean != null || a.lean != null) out.lean = lerp(a.lean || 0, b.lean || 0, sm((p - 0.6) / 0.4));
    return out;
  }
  function drawItem(it, id) { if (it.k === 'figure') return figure(it, id); const f = PROPS[it.k]; return f ? f(it, id).replace(/url\(#IDh\)/g, 'url(#' + id + 'h)') : ''; }
  // prev/cur: { items:[{id,k,x,y,...}], marks:[{k,...}], cut } ; returns an SVG group sized w x h
  let curScale = 1;
  S.picture = function (prev, cur, p, w, h, opt) {
    const id = (opt && opt.idp || 'g') + 'pic', sc = Math.min(w / 600, h / 260), ox = (w - 600 * sc) / 2; curScale = sc;
    const items = [], A = prev && !cur.cut ? new Map(prev.items.map((q) => [q.id, q])) : new Map(), B = new Map(cur.items.map((q) => [q.id, q]));
    let body = '';
    const fadeIn = prev ? Math.max(0, 2 * p - 1) : 1, fadeOut = Math.max(0, 1 - 2 * p);
    if (prev && cur.cut && p < 1) body += '<g opacity="' + f1(fadeOut * 100) / 100 + '">' + prev.items.map((q) => drawItem(q, id)).join('') + (prev.marks || []).map((m) => (MARKS[m.k] ? MARKS[m.k](m) : '')).join('') + '</g>';
    for (const q of cur.items) { const a = A.get(q.id), m = mix(a, q, p); items.push({ z: q.z || 0, svg: drawItem(m, id), op: a || !prev ? 1 : cur.cut ? fadeIn : fadeIn }); }
    if (prev && !cur.cut) for (const a of prev.items) if (!B.has(a.id)) items.push({ z: a.z || 0, svg: drawItem(a, id), op: fadeOut });
    items.sort((a, b) => a.z - b.z); for (const it of items) if (it.op > 0.01) body += it.op < 1 ? '<g opacity="' + f1(it.op * 100) / 100 + '">' + it.svg + '</g>' : it.svg;
    const key = (m) => JSON.stringify(m), pm = new Set(((prev && prev.marks) || []).map(key)), cm = new Set((cur.marks || []).map(key));
    for (const m of cur.marks || []) body += '<g opacity="' + f1((pm.has(key(m)) ? 1 : fadeIn) * 100) / 100 + '">' + (MARKS[m.k] ? MARKS[m.k](m) : '') + '</g>';
    if (prev && !cur.cut) for (const m of prev.marks || []) if (!cm.has(key(m))) body += '<g opacity="' + f1(fadeOut * 100) / 100 + '">' + (MARKS[m.k] ? MARKS[m.k](m) : '') + '</g>';
    const defs = '<defs><pattern id="' + id + 'h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="' + INK + '" stroke-width="1.1" opacity=".35"/></pattern></defs>';
    return '<g transform="translate(' + f1(ox) + ' 0) scale(' + f1(sc * 1000) / 1000 + ')">' + defs + body + '</g>';
  };
  S.describePicture = (pic) => (pic && pic.alt) || '';
  S.FIGURE = figure;
  S.KINDS = { props: Object.keys(PROPS).concat(['figure']), marks: Object.keys(MARKS), people: Object.keys(LOOK) };
  }
  if (root.GRAM_STAGE) install(root.GRAM_STAGE); else root.GRAM_PROPS_INSTALL = install;
})(typeof window !== 'undefined' ? window : globalThis);
