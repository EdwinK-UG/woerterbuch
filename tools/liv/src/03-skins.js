/* Liv engine · skins. A skin is data: proportions, colours, body sections, outfit paint, hair. No motion lives here. */
const mirrorT = (list) => list.map(([u, t]) => [u, -t]);
const backT = (list) => list.map(([u, t]) => [u, 180 - t]);
const SKINS = {};

/* Mia: a second character on the same rig (auburn braids, teal pinafore). She exists to show that every motion transfers. */
SKINS.mia = {
  name: 'Mia', scale: 1,
  col: { ink: '#3a2318', skin: '#f7cba6', skinShade: '#e3a37c', cheek: 'rgba(240,143,127,0.6)', cheek0: 'rgba(240,143,127,0)', hair: '#8a4526', hairDark: '#6a321a', eye: '#2e1c14', mouth: '#7a2a24', tongue: '#ee7f7b', white: '#ffffff',
    blouse: '#fff1dc', blouseShade: '#efd6b3', collar: '#ffffff', dress: '#2b7d78', dressDark: '#1e5f5b', trim: '#f3b33e', ribbon: '#e4573d', ribbonDark: '#c2432c', boot: '#6b3f28', sole: '#47281a', sock: '#fff6e8' },
  face: { eyeAz: 21, eyeEl: -5, eyeW: 0.105, eyeH: 0.155, browW: 0.13, browGap: 0.34, mouthEl: -41, mouthW: 0.2, freckles: true },
  legs: { thigh: 'skin', shin: 'skin', sock: { from: 0.7, col: 'sock', r: 1.15 }, boot: { col: 'boot', cuff: 'trim', shaft: 0.075, sole: 'sole' } },
  arms: { sleeve: { col: 'blouse', len: 0.4, puff: 1.55, end: 1.3 } },
  body: {
    col: 'blouse',
    skirt: true,
    sections: [{ u: -0.72, a: 0.2, b: 0.19 }, { u: -0.35, a: 0.152, b: 0.142 }, { u: 0.02, a: 0.1, b: 0.09 }, { u: 0.16, a: 0.084, b: 0.075 }, { u: 0.5, a: 0.09, b: 0.079 }, { u: 0.85, a: 0.1, b: 0.076 }, { u: 1.0, a: 0.096, b: 0.064 }, { u: 1.09, a: 0.05, b: 0.044 }],
    paint(B) {
      B.band(-0.72, 0.6, 'dress');
      B.band(-0.72, -0.64, 'trim', true);
      for (const strap of [[[0.58, 13], [1.07, 19], [1.07, 37], [0.58, 35]]]) { B.patch(strap, 'dress'); B.patch(mirrorT(strap), 'dress'); B.patch(backT(strap), 'dress'); B.patch(mirrorT(backT(strap)), 'dress'); }
      B.band(0.1, 0.2, 'dressDark');
      B.dot(0.44, 0, 0.012, 'trim'); B.dot(0.31, 0, 0.012, 'trim');
      for (const fold of [[[-0.05, 30], [-0.4, 33], [-0.7, 35]]]) { B.line(fold, 'dressDark', 0.007); B.line(mirrorT(fold), 'dressDark', 0.007); B.line(backT(fold), 'dressDark', 0.007); B.line(mirrorT(backT(fold)), 'dressDark', 0.007); }
      const collar = [[1.085, 2], [0.95, 3], [0.88, 12], [0.87, 24], [0.93, 36], [1.02, 44], [1.085, 46]];
      B.patch(collar, 'collar', 0.8); B.patch(mirrorT(collar), 'collar', 0.8);
    },
  },
  hair: {
    capR: 1.07,
    line(az) { const x = Math.abs(az); if (x < 70) return 31 + 8 * Math.cos(az * D2R * 1.3) - Math.pow(x / 70, 2) * 24; if (x < 100) return lerp(7, -30, (x - 70) / 30); return -30; },
    blobs: [
      { p: [-0.56, 0.6, 0.56], r: 0.26, front: true }, { p: [-0.24, 0.74, 0.6], r: 0.27, front: true }, { p: [0.12, 0.76, 0.6], r: 0.26, front: true }, { p: [0.46, 0.64, 0.58], r: 0.26, front: true },
      { p: [0.76, 0.4, 0.46], r: 0.2, front: true }, { p: [-0.78, 0.36, 0.44], r: 0.2, front: true },
    ],
    braids: [{ at: [0.86, -0.46, -0.22], n: 5, seg: 0.056, r: 0.041 }, { at: [-0.86, -0.46, -0.22], n: 5, seg: 0.056, r: 0.041 }],
  },
};

/* Liv, the Deutschklinik main character, built to the reference illustration:
   wavy dark-brown bob, cream puff-sleeve blouse, red laced dirndl, cream apron, tan satchel, ribbed socks, laced boots. */
SKINS.liv = {
  name: 'Liv', scale: 1,
  prop: { thigh: 0.29, shin: 0.29, ankleH: 0.06, foot: 0.19, hipW: 0.064, torso: 0.3, shW: 0.098, upArm: 0.16, foreArm: 0.152, headR: 0.132, neck: 0.058, rThigh: [0.05, 0.042], rShin: [0.041, 0.034], rUpArm: [0.04, 0.034], rForeArm: [0.034, 0.024], rNeck: 0.031, handScale: 1.22 },
  col: { ink: '#3b1f12', skin: '#f9c896', skinShade: '#e9a06c', cheek: 'rgba(243,128,104,0.62)', cheek0: 'rgba(243,128,104,0)', hair: '#63301a', hairDark: '#43200f', hairLight: '#874826', eye: '#2a130c', iris: '#6b3a22', mouth: '#8c2f25', tongue: '#f08c84', white: '#ffffff',
    blouse: '#fbeacb', blouseShade: '#e3c999', bodice: '#a83222', placket: '#cf6a45', cord: '#6e3520', skirt: '#b93a27', skirtDark: '#8f2a1c', apron: '#efd5a8', apronShade: '#d9b985',
    strap: '#c98a3a', bag: '#dc9a3f', bagDark: '#b87526', bagLight: '#e6ad55', sock: '#f7e3bd', sockShade: '#dcc292', boot: '#7a4a24', sole: '#4a2c14', lace: '#dba757' },
  face: { eyeAz: 21, eyeEl: -8, eyeW: 0.1, eyeH: 0.165, browW: 0.12, browGap: 0.4, browT: 0.026, browCol: 'hairDark', mouthEl: -44, mouthW: 0.25, freckles: true, iris: 'iris' },
  legs: { thigh: 'skin', shin: 'skin', sock: { from: 0.5, col: 'sock', r: 1.24, cuff: true, ribs: 'sockShade' }, boot: { col: 'boot', fat: 1.1, shaft: 0.08, sole: 'sole', lace: 'lace' } },
  arms: { sleeve: { col: 'blouse', len: 0.46, puff: 1.62, end: 1.72, cuff: 'blouse', cuffR: 1.36 } },
  body: {
    col: 'blouse', skirt: true,
    sections: [{ u: -0.95, a: 0.265, b: 0.24 }, { u: -0.5, a: 0.195, b: 0.18 }, { u: -0.1, a: 0.128, b: 0.118 }, { u: 0.28, a: 0.084, b: 0.076 }, { u: 0.6, a: 0.094, b: 0.082 }, { u: 0.88, a: 0.098, b: 0.078 }, { u: 1.0, a: 0.093, b: 0.064 }, { u: 1.09, a: 0.05, b: 0.044 }],
    paint(B) {
      // blouse neckline with its little notch
      const notch = [[1.09, -13], [0.99, -8], [0.9, 0], [0.99, 8], [1.09, 13]]; B.patch(notch, 'skin', 0.7);
      // skirt and its folds
      B.band(-0.95, 0.3, 'skirt');
      for (const fold of [[[0.1, 70], [-0.45, 76], [-0.93, 80]], [[0.0, 100], [-0.5, 104], [-0.93, 106]], [[0.05, 140], [-0.5, 143], [-0.93, 145]]]) { B.line(fold, 'skirtDark', 0.008); B.line(mirrorT(fold), 'skirtDark', 0.008); }
      // bodice: ring, front panels that leave a V, straps, closed back
      B.band(0.28, 0.6, 'bodice');
      const front = [[0.6, 2], [0.74, 7], [1.085, 23], [1.085, 41], [0.86, 52], [0.8, 90], [0.6, 90]], back = [[0.6, 90], [0.8, 90], [0.86, 128], [1.085, 139], [1.085, 157], [0.95, 180], [0.6, 180]];
      for (const pch of [front, mirrorT(front), back, mirrorT(back)]) B.patch(pch, 'bodice');
      B.line([[0.74, 7], [1.085, 23]], 'ink', 0.0045); B.line([[0.74, -7], [1.085, -23]], 'ink', 0.0045); B.line([[0.6, 2], [0.74, 7]], 'ink', 0.0045); B.line([[0.6, -2], [0.74, -7]], 'ink', 0.0045);
      B.line([[1.085, 41], [0.86, 52], [0.8, 88]], 'ink', 0.0045); B.line([[1.085, -41], [0.86, -52], [0.8, -88]], 'ink', 0.0045);
      // lacing
      B.patch([[0.3, -6.5], [0.61, -6.5], [0.61, 6.5], [0.3, 6.5]], 'placket');
      for (let i = 0; i < 3; i++) { const u0 = 0.34 + i * 0.09; B.line([[u0, -7], [u0 + 0.09, 7]], 'cord', 0.006); B.line([[u0, 7], [u0 + 0.09, -7]], 'cord', 0.006); }
      for (let i = 0; i < 4; i++) { B.dot(0.34 + i * 0.09, -8.5, 0.006, 'cord'); B.dot(0.34 + i * 0.09, 8.5, 0.006, 'cord'); }
      // apron with waistband
      const ap = [[0.26, -60], [0.26, -30], [0.26, 0], [0.26, 30], [0.26, 60], [-0.3, 64], [-0.78, 68], [-0.8, 45], [-0.815, 20], [-0.82, 0], [-0.815, -20], [-0.8, -45], [-0.78, -68], [-0.3, -64]];
      B.patch(ap, 'apron', 0.8);
      for (const fold of [[[0.16, 22], [-0.3, 26], [-0.7, 30]], [[0.16, -18], [-0.25, -22], [-0.6, -26]], [[0.12, 46], [-0.4, 52]]]) B.line(fold, 'apronShade', 0.011);
      B.band(0.215, 0.305, 'apron', true, true);
      // satchel strap: left shoulder to right hip, front and back
      const strap = (t0, t1, w) => { const a = [], b = []; for (let i = 0; i <= 8; i++) { const q = i / 8, u = lerp(1.085, 0.22, q), t = lerp(t0, t1, Math.pow(q, 1.15)); a.push([u, t - w]); b.push([u, t + w]); } return a.concat(b.reverse()); };
      B.patch(strap(31, -76, 6.5), 'strap', 0.75); B.patch(strap(149, 256, 6.5), 'strap', 0.75);
    },
    extras(X) {
      // the satchel hangs on the right hip, slightly to the front, and swings with the body
      const { self, J, cam, pr, C, G, k } = X, pf = J.pelF, sw = self.sway;
      const Nb = norm(add(mul(pf.F, 0.5), mul(pf.L, -0.866))), T = norm(add(mul(pf.F, 0.866), mul(pf.L, 0.5)));
      const top = add(J.pel, add(mul(pf.L, -0.098 * k), add(mul(pf.F, 0.06 * k), mul(pf.U, 0.045 * k))));
      const Ub = norm(sub([0, 1, 0], mul(sw, 6))), c = add(madd(top, Ub, -0.1 * k), mul(Nb, 0.05 * k));
      const w = 0.125 * k, h = 0.11 * k, q = (a, b, off) => pr(add(c, add(mul(T, a * w / 2), add(mul(Ub, b * h / 2), mul(Nb, off * k)))));
      const facing = dot(Nb, cam.Z) > 0, body = [q(-1, 1, 0), q(1, 1, 0), q(1, -1, 0), q(-1, -1, 0)], rear = [q(-1, 1, -0.05), q(1, 1, -0.05), q(1, -1, -0.05), q(-1, -1, -0.05)];
      const s = body[0][3], ow = self.ow(s), r = 0.026 * k * s, P2 = (a) => a.map((v) => [v[0], v[1]]);
      const shapes = [{ t: 'poly', pts: P2(facing ? rear : body), r, f: C('bagDark'), ow }, { t: 'poly', pts: P2(facing ? body : rear), r, f: C(facing ? 'bag' : 'bagDark'), ow }];
      if (facing) {
        const fl = [q(-1, 1, 0.004), q(1, 1, 0.004), q(1, 0.0, 0.004), q(0.55, -0.22, 0.004), q(-0.55, -0.22, 0.004), q(-1, 0.0, 0.004)], tab = [q(-0.16, -0.05, 0.006), q(0.16, -0.05, 0.006), q(0.16, -0.5, 0.006), q(-0.16, -0.5, 0.006)];
        shapes.push({ t: 'fn', fn(ctx) {
          const tr = (pts) => { ctx.beginPath(); pts.forEach((v, i) => (i ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]))); ctx.closePath(); };
          ctx.lineJoin = 'round'; ctx.strokeStyle = C('ink'); ctx.lineWidth = ow * 0.8;
          tr(fl); ctx.fillStyle = C('bagLight'); ctx.fill(); ctx.strokeStyle = C('bagLight'); ctx.lineWidth = r * 1.6; ctx.stroke(); ctx.strokeStyle = C('ink'); ctx.lineWidth = ow * 0.8;
          ctx.beginPath(); for (let i = 2; i < 6; i++) { const v = fl[i]; i === 2 ? ctx.moveTo(v[0] + r * 0.8, v[1] + r * 0.6) : ctx.lineTo(v[0] + (i === 5 ? -r * 0.8 : 0), v[1] + r * 0.6); } ctx.stroke();
          tr(tab); ctx.fillStyle = C('strap'); ctx.fill(); ctx.stroke();
        } });
      }
      G(pr(madd(c, Nb, 0.03 * k))[2] + 0.02, shapes);
    },
  },
  hair: {
    capR: 1.1, capUp: 0.1,
    line(az) { const x = Math.abs(az); if (x < 70) return 52 - Math.pow(x / 70, 2) * 35; if (x < 95) return lerp(17, -4, (x - 70) / 25); if (x < 112) return lerp(-4, -42, (x - 95) / 17); return -42; },
    blobs: (() => {
      const out = [], ring = (u, rad, r, azs, w) => { for (const a of azs) for (const sgn of a === 180 || a === 0 ? [1] : [1, -1]) out.push({ p: [Math.sin(a * D2R) * rad * sgn, u, Math.cos(a * D2R) * rad], r, w }); };
      // volume around the sides and back
      ring(0.74, 0.74, 0.4, [80, 130, 180], 0.3); ring(0.32, 1.0, 0.4, [116, 150, 180], 0.5); ring(-0.1, 1.08, 0.4, [124, 156, 180], 0.8); ring(-0.48, 1.06, 0.36, [126, 156, 180], 1.1);
      ring(1.0, 0.25, 0.38, [0, 120, 240], 0.2);
      // flicked ends
      const lock = (p, to, r, o) => out.push(Object.assign({ p, to, r, r2: 0.02, w: 1.2 }, o));
      for (const sgn of [1, -1]) {
        out.push({ p: [sgn * 0.96, -0.3, -0.5], via: [sgn * 1.3, -0.72, -0.44], to: [sgn * 1.56, -0.5, -0.4], r: 0.3, r2: 0.03, w: 1.2 }); out.push({ p: [sgn * 1.0, 0.1, -0.44], via: [sgn * 1.42, -0.2, -0.34], to: [sgn * 1.62, 0.0, -0.3], r: 0.27, r2: 0.03, w: 1.1 }); out.push({ p: [sgn * 0.9, 0.5, -0.34], via: [sgn * 1.3, 0.36, -0.24], to: [sgn * 1.46, 0.56, -0.2], r: 0.24, r2: 0.03, w: 0.9 });
        lock([sgn * 0.66, -0.7, -0.72], [sgn * 0.94, -1.04, -0.72], 0.25); lock([sgn * 0.28, -0.72, -0.96], [sgn * 0.4, -1.06, -1.02], 0.24);
        // locks in front of the ears
        lock([sgn * 0.8, 0.44, 0.5], [sgn * 0.84, -0.2, 0.5], 0.15, { front: true, r2: 0.025, hi: sgn > 0 });
      }
      lock([0.05, 1.08, 0.0], [0.5, 1.3, 0.05], 0.13, { w: 1.6 }); lock([-0.15, 1.1, -0.1], [-0.5, 1.27, -0.2], 0.11, { w: 1.6 });
      // fringe: curved, pointed locks swept from a parting, leaving the forehead open
      const sweep = (p, via, to, r, o) => out.push(Object.assign({ p, via, to, r, r2: 0.015, w: 0.6, front: true }, o));
      sweep([-0.22, 1.0, 0.36], [-0.74, 0.8, 0.5], [-0.86, 0.16, 0.56], 0.2, { hi: true });
      sweep([-0.1, 1.02, 0.4], [-0.44, 0.84, 0.7], [-0.5, 0.44, 0.86], 0.15);
      sweep([0.0, 1.02, 0.42], [-0.14, 0.86, 0.76], [-0.13, 0.6, 0.86], 0.12, { hi: true });
      sweep([0.14, 1.02, 0.4], [0.3, 0.84, 0.72], [0.31, 0.55, 0.86], 0.13);
      sweep([0.26, 1.0, 0.36], [0.7, 0.78, 0.5], [0.82, 0.2, 0.56], 0.19, { hi: true });
      return out;
    })(),
  },
};
