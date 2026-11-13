/* Liv engine · cut-out renderer. A skin with `cut` + `art` is drawn from the parts of its own illustration
   (head, torso, sleeves, skirt, bag, socks, boots, mouth, brows), moved by the same skeleton as every other skin.
   Arms, legs and hands are drawn by the rig in the illustration's colours, because they have to bend freely.
   All `cut` coordinates are pixels of the original illustration. The art faces right; facing left mirrors it. */
function loadArt(skin) {
  const art = skin.art; if (!art) return Promise.resolve();
  if (!art.promise) art.promise = Promise.all(Object.values(art.parts).map((p) => new Promise((res) => { const im = new Image(); im.onload = () => { p.img = im; res(); }; im.onerror = res; im.src = p.src; }))).then(() => { art.ready = true; });
  return art.promise;
}

// one parametric mouth for expressions and speech, drawn in illustration pixels
function mouth2D(ctx, f, M, col, lw) {
  const open = clamp(f.open, 0, 1), rnd = clamp(f.round, 0, 1), sm = clamp(f.smile, -1, 1), wide = clamp(f.wide, 0, 1);
  const Wb = M.W, W = Wb * (0.58 + 0.42 * wide) * (1 - 0.5 * rnd) * (1 + 0.12 * Math.max(0, sm) * (1 - rnd)), Hh = M.H * open * (1 + 0.15 * rnd), cl = Wb * 0.33 * sm * (1 - 0.6 * rnd), N = 12;
  ctx.save(); ctx.translate(M.c[0], M.c[1]); ctx.rotate(M.tilt); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = (fy, w, close) => { for (let i = 0; i <= N; i++) { const t = i / N * 2 - 1, x = t * W * w, y = -fy(t); if (i || close) ctx.lineTo(x, y); else ctx.moveTo(x, y); } };
  const back = (fy, w) => { for (let i = N; i >= 0; i--) { const t = i / N * 2 - 1; ctx.lineTo(t * W * w, -fy(t)); } };
  if (open < 0.06) {
    ctx.beginPath(); path((t) => cl * t * t - (0.22 * Wb * sm + 0.06 * Wb) * (1 - t * t), 1); ctx.strokeStyle = col.ink; ctx.lineWidth = lw * 1.25; ctx.stroke();
  } else {
    const yU = (t) => cl * t * t + (Hh * 0.2 - 0.075 * Wb * sm) * (1 - t * t), yL = (t) => cl * t * t - Hh * 0.8 * Math.pow(1 - t * t, 0.75) - 0.1 * Wb * (1 - t * t);
    ctx.beginPath(); path(yU, 1); back(yL, 1); ctx.closePath(); ctx.fillStyle = col.mouthIn; ctx.fill(); ctx.save(); ctx.clip();
    ctx.beginPath(); path((t) => yL(0) + Hh * 0.45 * (1 - t * t) - 0.04 * Wb, 0.74); back(() => yL(0) - 0.3 * Wb, 0.74); ctx.closePath(); ctx.fillStyle = col.tongue; ctx.fill();
    if (open > 0.16 || f.teeth > 0.3) { const th = Math.min(Hh * 0.34, 0.25 * Wb) + 0.1 * Wb * f.teeth; ctx.beginPath(); path((t) => yU(t) + 0.2 * Wb, 1); back((t) => yU(t) - th, 1); ctx.closePath(); ctx.fillStyle = '#fffaf2'; ctx.fill(); }
    ctx.restore(); ctx.beginPath(); path(yU, 1); back(yL, 1); ctx.closePath(); ctx.strokeStyle = col.ink; ctx.lineWidth = lw; ctx.stroke();
  }
  ctx.restore();
}

Character.prototype.drawCut = function (cam, groups) {
  const J = this.J, P = this.P, sk = this.skin, cut = sk.cut, A = sk.art.parts, k = this.k, self = this, pose = this.pose, id = this.id;
  const C = (key) => sk.col[key] || key, pr = (p) => cam.project(p);
  const G = (d, shapes) => { const g = { d, shapes, alpha: self.alpha < 1 ? self.alpha : null }; groups.push(g); return g; };
  // which way the art faces
  const yw = wrapPi(pose.yaw);
  if (this.facing == null) this.facing = yw < -0.1 ? -1 : 1;
  if (yw > 0.2 && yw < PI - 0.2) this.facing = 1; else if (yw < -0.2 && yw > -PI + 0.2) this.facing = -1;
  const f = this.facing, nN = f > 0 ? 'R' : 'L', nF = f > 0 ? 'L' : 'R';
  const pp = pr(J.pel), pc = pr(J.chest), s = pp[3] / cut.ppm, D = pp[2], ppm = pp[3];
  // leaning towards the viewer cannot be foreshortened in flat art, so part of it is shown as a turn of the torso
  const thT = Math.atan2(pc[0] - pp[0], -(pc[1] - pp[1])) + pose.lean * 0.55 * f * Math.abs(Math.cos(pose.yaw)), cT = Math.cos(thT), sT = Math.sin(thT);
  const tors = (q) => { const dx = f * (q[0] - cut.pel[0]) * s, dy = (q[1] - cut.pel[1]) * s; return [pp[0] + dx * cT - dy * sT, pp[1] + dx * sT + dy * cT]; };
  const spr = (name, anchor, pos, th, extra) => ({ t: 'fn', fn(ctx) { const a = A[name]; if (!a.img) return; ctx.save(); ctx.translate(pos[0], pos[1]); ctx.rotate(th); ctx.scale(f * s, s); ctx.drawImage(a.img, a.x - anchor[0], a.y - anchor[1]); if (extra) { ctx.translate(-anchor[0], -anchor[1]); extra(ctx); } ctx.restore(); } });
  const dirTh = (v, d) => Math.atan2(v[1], v[0]) - Math.atan2(d[1], f * d[0]);
  const capS = (a, b, ra, rb, fill, ja, jb, noInk) => ({ t: 'cap', x1: a[0], y1: a[1], r1: ra * ppm, x2: b[0], y2: b[1], r2: rb * ppm, f: fill, ow: self.ow(ppm), ja, jb, ink: noInk ? false : undefined });
  const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

  /* ---- arms: drawn limbs hung from the illustration's shoulders, sleeve parts on top ---- */
  for (const n of [nF, nN]) {
    const near = n === nN, w = pose['a' + n].w, sl = near ? cut.sleeveN : cut.sleeveF, shA = near ? cut.shN : cut.shF;
    const shS = tors(shA), psh = pr(J['sh' + n]), pel = pr(J['elbow' + n]), pwr = pr(J['wrist' + n]);
    const ox = shS[0] - psh[0], oy = shS[1] - psh[1];
    const el = [pel[0] + ox * (1 - 0.5 * w), pel[1] + oy * (1 - 0.5 * w)], wr = [pwr[0] + ox * (1 - w), pwr[1] + oy * (1 - w)];
    const v = [el[0] - shS[0], el[1] - shS[1]], vl = Math.hypot(v[0], v[1]), thDown = dirTh([0, 1], sl);
    const th = thDown + wrapPi(dirTh(v, sl) - thDown) * clamp(vl / (0.45 * P.upArm * ppm), 0, 1);
    const dF = pr(mix(J['elbow' + n], J['wrist' + n], 0.6))[2] - pc[2];
    let dUp, dFo;
    if (near) { dUp = D + 0.02; dFo = dF < -0.08 ? D - 0.03 : D + 0.022; } else { dUp = D - 0.034; dFo = dF > 0.05 ? D + 0.026 : D - 0.032; }
    G(dUp, [capS(shS, el, P.rUpArm[0], P.rUpArm[1], C('skin'), null, id + 'el' + n), spr(near ? 'sleeve_n' : 'sleeve_f', shA, shS, th)]);
    G(dFo, [capS(el, wr, P.rForeArm[0], P.rForeArm[1], C('skin'), id + 'el' + n, id + 'wr' + n)]);
    const hA = near ? cut.handN : cut.handF;
    if (pose['a' + n].art > 0.5 && hA) G(dFo + 0.002, [spr(near ? 'hand_n' : 'hand_f', hA.at, wr, dirTh([wr[0] - el[0], wr[1] - el[1]], hA.dir))]);
    else this.drawHand(cam, groups, n, [ox * (1 - w), oy * (1 - w)], dFo + 0.002);
  }

  /* ---- legs: drawn skin, sock and boot parts ---- */
  if (!this.bootProf) this.bootProf = { L: false, R: false };
  for (const n of [nF, nN]) {
    const near = n === nN, hip = pr(J['hip' + n]), kn = pr(J['knee' + n]), an = pr(J['ankle' + n]), dd = D - 0.02 + (near ? 0.004 : 0);
    G(dd, [capS(hip, kn, P.rThigh[0], P.rThigh[1], C('skinShade'), null, id + 'knee' + n)]);
    const Ff = J['footF' + n], m = (Ff[0] * cam.X[0] + Ff[2] * cam.X[2]) / (Math.hypot(Ff[0], Ff[2]) || 1) * f;
    if (m > 0.5) this.bootProf[n] = true; else if (m < 0.3) this.bootProf[n] = false;
    const prof = this.bootProf[n], pitch = pose['f' + n].pitch;
    const sockA = near ? [cut.ankleN, cut.sockTopN, 'sock_n'] : [cut.ankleF, cut.sockTopF, 'sock_f'];
    const shin = [capS(kn, an, P.rShin[0], P.rShin[1], C('skin'), id + 'knee' + n), capS(kn, lerp2(kn, an, 0.2), P.rShin[0] * 0.99, lerp(P.rShin[0], P.rShin[1], 0.2) * 0.99, C('skinShade'), null, null, true)];
    shin.push(spr(sockA[2], sockA[0], [an[0], an[1]], dirTh([kn[0] - an[0], kn[1] - an[1]], [sockA[1][0] - sockA[0][0], sockA[1][1] - sockA[0][1]])));
    shin.push(prof ? spr('boot_f', cut.ankleF, [an[0], an[1]], -pitch * f * clamp(Math.abs(m) * 1.2, 0, 1)) : spr('boot_n', cut.ankleN, [an[0], an[1]], 0));
    G(dd + 0.001, shin);
  }

  /* ---- skirt: horizontal slices, so the hem can swing and make room for the legs ---- */
  const swx = dot(this.sway, cam.X) * ppm, rT = (P.rThigh[1] + 0.025 * k) * ppm;
  const hipL = pr(J.hipL), hipR = pr(J.hipR), knL = pr(J.kneeL), knR = pr(J.kneeR);
  const legX = (h, kq, y) => (kq[1] <= y ? kq[0] : lerp(h[0], kq[0], clamp((y - h[1]) / Math.max(1, kq[1] - h[1]), 0, 1)));
  G(D - 0.005, [{ t: 'fn', fn(ctx) {
    const a = A.skirt; if (!a.img) return; const hb = Math.max(4, Math.ceil(2.5 / s)), y0 = cut.waistY, y1 = a.y + a.h * 0.9;
    // how far the hem has to give way for the thighs, measured once at the hem and eased in from the waist
    const hr = a.rows[Math.floor(a.h * 0.86)], yH = pp[1] + (a.y + a.h * 0.86 - cut.pel[1]) * s, cH = pp[0] + f * ((hr[0] + hr[1]) / 2 - cut.pel[0]) * s, hH = (hr[1] - hr[0]) / 2 * s;
    const xa = legX(hipL, knL, yH), xb = legX(hipR, knR, yH);
    const extL = clamp(cH - hH - (Math.min(xa, xb) - rT), 0, hH * 0.55), extR = clamp(Math.max(xa, xb) + rT - (cH + hH), 0, hH * 0.55);
    for (let ry = 0; ry < a.h; ry += hb) {
      const hh = Math.min(hb + 1.2 / s, a.h - ry), yArt = a.y + ry + hb / 2, row = a.rows[Math.min(a.rows.length - 1, ry + (hb >> 1))]; if (!row || row[1] - row[0] < 14) continue;
      const t = clamp((yArt - y0) / (y1 - y0), 0, 1), e = Math.pow(t, 1.7), ys = pp[1] + (a.y + ry - cut.pel[1]) * s;
      const cA = (row[0] + row[1]) / 2, half = Math.max(1, (row[1] - row[0]) / 2 * s), cX = pp[0] + f * (cA - cut.pel[0]) * s;
      const L = cX - half - extL * e + swx * t * t, R = cX + half + extR * e + swx * t * t;
      ctx.save(); ctx.translate((L + R) / 2, ys); ctx.scale(f * s * (R - L) / (2 * half), s); ctx.drawImage(a.img, 0, ry, a.w, hh, a.x - cA, 0, a.w, hh); ctx.restore();
    }
  } }]);

  /* ---- torso, bag, head ---- */
  G(D, [spr('torso', cut.pel, [pp[0], pp[1]], thT)]);
  const bagTh = thT * 0.3 + clamp(-swx / ppm * 5 * f, -0.3, 0.3) * 1;
  G(D + 0.004, [spr('bag', cut.bagPivot, tors(cut.bagPivot), bagTh)]);
  const uh = J.headF.U, thH = Math.atan2(dot(uh, cam.X), dot(uh, cam.Y)) + (pose.hp + pose.lean * 0.5) * 0.5 * f * Math.abs(Math.cos(pose.yaw)), fc = pose.face, col = sk.art.colors, lw = 3.6;
  const nk = tors(cut.neck); nk[0] += Math.sin(pose.hy) * 0.016 * ppm * f;
  G(D + 0.012, [spr('head', cut.neck, nk, thH + Math.sin(pose.hy) * 0.05 * f, (ctx) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // brows: the illustration's own, lifted or tilted by the expression
    for (const [nm, raise, sg] of [['brow_n', f > 0 ? fc.browR : fc.browL, -1], ['brow_f', f > 0 ? fc.browL : fc.browR, 1]]) {
      const b = A[nm]; if (!b.img) continue; ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2 - raise * 9); ctx.rotate(sg * fc.browAng * 0.4); ctx.drawImage(b.img, -b.w / 2, -b.h / 2); ctx.restore();
    }
    // eyes: lids for blinking, arcs for a laughing face
    for (const [E, open] of [[cut.eyeN, f > 0 ? fc.eyeR : fc.eyeL], [cut.eyeF, f > 0 ? fc.eyeL : fc.eyeR]]) {
      const happy = fc.happy > 0.5; if (!happy && open > 0.93) continue;
      const o = happy ? 0 : clamp(open, 0, 1), top = E.c[1] - E.ry - 4, yl = top + (2 * E.ry + 8) * (happy ? 1 : (1 - o) * 0.84);
      ctx.save(); ctx.beginPath(); ctx.ellipse(E.c[0], E.c[1], E.rx + 3.5, E.ry + 3.5, 0, 0, TAU); ctx.clip(); ctx.fillStyle = col[E.lid]; ctx.fillRect(E.c[0] - E.rx - 5, top - 2, 2 * E.rx + 10, yl - top + 2); ctx.restore();
      ctx.beginPath();
      if (happy) { ctx.moveTo(E.c[0] - E.rx, E.c[1] + 5); ctx.quadraticCurveTo(E.c[0], E.c[1] - E.ry * 1.05, E.c[0] + E.rx, E.c[1] + 5); }
      else { const hw = Math.sqrt(Math.max(0.05, 1 - Math.pow((yl - E.c[1]) / (E.ry + 3.5), 2))) * (E.rx + 3); ctx.moveTo(E.c[0] - hw, yl - 1); ctx.quadraticCurveTo(E.c[0], yl + E.ry * 0.3 * (1 - o), E.c[0] + hw, yl - 1); }
      ctx.strokeStyle = col.ink; ctx.lineWidth = lw * 1.2; ctx.stroke();
    }
    // mouth: the illustration's smile at rest, the parametric mouth for speech and other expressions
    const art = clamp(fc.art, 0, 1), mo = A.mouth;
    if (art < 0.98) { ctx.globalAlpha = 1 - art; mouth2D(ctx, fc, cut.mouth, col, lw); ctx.globalAlpha = 1; }
    if (art > 0.02 && mo.img) { ctx.globalAlpha = art; ctx.drawImage(mo.img, mo.x, mo.y); ctx.globalAlpha = 1; }
  })]);
};

/* Liv's cut-out rig: where the joints sit in the illustration. */
SKINS.liv.art = typeof LIV_ART !== 'undefined' ? LIV_ART : null;
SKINS.liv.cut = {
  ppm: 946, pel: [555, 640], chest: [552, 372], neck: [560, 336], waistY: 540,
  shN: [438, 392], shF: [664, 381], sleeveN: [-27, 113], sleeveF: [70, 40], bagPivot: [528, 548],
  ankleN: [426, 1186], sockTopN: [444, 1040], ankleF: [628, 1186], sockTopF: [625, 1052],
  eyeN: { c: [521, 194], rx: 20, ry: 23, lid: 'lidN' }, eyeF: { c: [606, 176], rx: 13.5, ry: 20, lid: 'lidF' },
  mouth: { c: [581, 245], W: 30, H: 60, tilt: -0.19 },
  handN: { at: [303, 608], dir: [-100, 107] }, handF: { at: [888, 340], dir: [78, -58] },
};
if (SKINS.liv.art) { const c = SKINS.liv.art.colors; Object.assign(SKINS.liv.col, { skin: c.skin, skinShade: '#f0a468', ink: '#3a1c0c' }); Object.assign(c, { ink: '#3a1c0c' }); }
Object.assign(SKINS.liv.prop, { torso: 0.283, ankleH: 0.076, thigh: 0.282, shin: 0.282, rThigh: [0.054, 0.046], rShin: [0.045, 0.036] });
// the pose of the reference illustration, used to check the likeness and as her "present" gesture
SKINS.liv.photoPose = {
  yaw: 0.35, fR: { p: [1.787, 0, -0.15], yaw: 0.55 }, fL: { p: [1.108, 0, 0.055], yaw: 0.5 },
  aR: { h: [0.561, -0.731, 0.205], e: [0.4, -1, 0.05], palm: [0.1, 0.6, 0.8], fing: [-0.25, 0, 0.02, 0.04, 0.06], spread: 0.55, art: 1 },
  aL: { h: [0.677, 0.138, 0.36], e: [1, -0.13, -0.09], palm: [0, 1, 0.2], fing: [-0.2, 0.02, 0.03, 0.05, 0.08], spread: 0.3, art: 1 },
};
// her standing stance, as in the illustration (near = the foot towards the viewer)
SKINS.liv.stance = { near: { p: [1.787, 0, -0.15], yaw: 0.55 }, far: { p: [1.108, 0, 0.055], yaw: 0.5 } };
