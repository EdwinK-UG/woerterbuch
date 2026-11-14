/* Liv engine · turnaround renderer. A skin whose `cut.views` holds several drawn views (front, three-quarter, side,
   back) is shown in the view that matches the way the character faces; three-quarter and side are mirrored for the
   other direction. Arms and legs are drawn by the rig; "A" is the arm or leg on the left of the drawing, "B" the other. */
Character.prototype.drawViews = function (cam, groups) {
  const J = this.J, P = this.P, sk = this.skin, cut = sk.cut, A = sk.art.parts, col = sk.art.colors, k = this.k, self = this, pose = this.pose, id = this.id;
  const C = (key) => sk.col[key] || key, pr = (p) => cam.project(p);
  const G = (d, shapes) => { const g = { d, shapes, alpha: self.alpha < 1 ? self.alpha : null }; groups.push(g); return g; };
  // pick the view from the angle between her facing and the viewer, with a little hysteresis so it does not flicker
  const a = wrapPi(pose.yaw - cam.yaw), deg = Math.abs(a) / D2R, cur = this.viewName, order = cut.order || ['front', 'tq', 'side', 'back'], lims = cut.limits || [24, 62, 128];
  const pickView = (dg, was) => { for (let i = 0; i < lims.length; i++) { const hys = was === order[i] ? 4 : was === order[i + 1] ? -4 : 0; if (dg < lims[i] + hys) return order[i]; } return order[order.length - 1]; };
  const vn = pickView(deg, cur); this.viewName = vn;
  const V = cut.views[vn], sided = !!V.near, f = !sided ? 1 : a >= 0 ? 1 : -1; this.facing = sided ? f : 1;
  const base = V.back ? 'L' : 'R', nA = sided && f < 0 ? (base === 'R' ? 'L' : 'R') : base, nB = nA === 'R' ? 'L' : 'R', near = V.near || 'A', far = near === 'A' ? 'B' : 'A';
  const pp = pr(J.pel), pc = pr(J.chest), s = pp[3] / cut.ppm, D = pp[2], ppm = pp[3];
  const lean2 = sided ? pose.lean * 0.3 * f * Math.abs(Math.cos(pose.yaw)) : 0;
  const thT = Math.atan2(pc[0] - pp[0], -(pc[1] - pp[1])) + lean2, cT = Math.cos(thT), sT = Math.sin(thT);
  const tors = (q) => { const dx = f * (q[0] - V.pel[0]) * s, dy = (q[1] - V.pel[1]) * s; return [pp[0] + dx * cT - dy * sT, pp[1] + dx * sT + dy * cT]; };
  const spr = (name, anchor, pos, th, extra) => ({ t: 'fn', fn(ctx) { const p = A[name]; if (!p || !p.img) return; ctx.save(); ctx.translate(pos[0], pos[1]); ctx.rotate(th); ctx.scale(f * s, s); ctx.drawImage(p.img, p.x - anchor[0], p.y - anchor[1]); if (extra) { ctx.translate(-anchor[0], -anchor[1]); extra(ctx); } ctx.restore(); } });
  const dirTh = (v, d) => Math.atan2(v[1], v[0]) - Math.atan2(d[1], f * d[0]);
  const capS = (p0, p1, ra, rb, fill, ja, jb, noInk) => ({ t: 'cap', x1: p0[0], y1: p0[1], r1: ra * ppm, x2: p1[0], y2: p1[1], r2: rb * ppm, f: fill, ow: self.ow(ppm), ja, jb, ink: noInk ? false : undefined });
  const lerp2 = (p0, p1, t) => [lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t)];
  const pickHand = (fg) => { let best = null, bd = 0.42; for (const [nm, ref] of HAND_REF) { let d2 = 0; for (let i = 0; i < 5; i++) d2 += Math.pow(fg[i] - ref[i], 2); if (d2 < bd) { bd = d2; best = nm; } } return best; };

  /* arms */
  const sideOf = { A: nA, B: nB };
  for (const key of [far, near]) {
    const n = sideOf[key], w = pose['a' + n].w, VA = V[key], shS = tors(VA.sh), psh = pr(J['sh' + n]), pel = pr(J['elbow' + n]), pwr = pr(J['wrist' + n]);
    const ox = shS[0] - psh[0], oy = shS[1] - psh[1];
    const el = [pel[0] + ox * (1 - 0.5 * w), pel[1] + oy * (1 - 0.5 * w)], wr = [pwr[0] + ox * (1 - w), pwr[1] + oy * (1 - w)];
    const dF = pr(mix(J['elbow' + n], J['wrist' + n], 0.6))[2] - pc[2], front = !sided || key === near;
    const dUp = front ? D + 0.02 : D - 0.034, dFo = front ? (dF < -0.08 ? D - 0.03 : D + 0.022) : dF > 0.05 ? D + 0.026 : D - 0.032;
    const up = [capS(shS, el, P.rUpArm[0], P.rUpArm[1], C('skin'), null, id + 'el' + n)], name = vn + '_sleeve' + key;
    if (cut.sleeve) {
      // puff sleeve: a balloon that widens towards a gathered cuff. Drawn, not cut from the art, so it stays whole in every pose.
      const sl = cut.sleeve, v = [el[0] - shS[0], el[1] - shS[1]], vl = Math.hypot(v[0], v[1]), u = vl > 1 ? [v[0] / vl, v[1] / vl] : [0, 1], pe = [-u[1], u[0]], Lm = Math.max(vl, 0.35 * P.upArm * ppm);
      const at = (k) => [shS[0] + u[0] * Lm * k, shS[1] + u[1] * Lm * k], c2 = at(sl.c), q0 = at(sl.cuff0), q1 = at(sl.cuff1), r2 = sl.r2 * ppm, rc = sl.rc * ppm;
      up.push(capS(shS, c2, sl.r1, sl.r2, col.blouse));
      up.push({ t: 'poly', pts: [[q0[0] - pe[0] * rc, q0[1] - pe[1] * rc], [q0[0] + pe[0] * rc, q0[1] + pe[1] * rc], [q1[0] + pe[0] * rc * 0.96, q1[1] + pe[1] * rc * 0.96], [q1[0] - pe[0] * rc * 0.96, q1[1] - pe[1] * rc * 0.96]], r: 0.004 * ppm, f: col.blouse, ow: self.ow(ppm) });   // the cuff: a band with a straight edge the arm comes out of
      up.push({ t: 'fn', fn(ctx) {
        ctx.lineCap = 'round'; ctx.strokeStyle = col.blouseShade; ctx.lineWidth = 0.0075 * ppm;
        for (const k of [-0.55, 0, 0.55]) { const sx = q0[0] + pe[0] * k * r2 * 0.95 - u[0] * 0.012 * ppm, sy = q0[1] + pe[1] * k * r2 * 0.95 - u[1] * 0.012 * ppm; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - u[0] * 0.024 * ppm + pe[0] * k * 0.012 * ppm, sy - u[1] * 0.024 * ppm + pe[1] * k * 0.012 * ppm); ctx.stroke(); }
        ctx.strokeStyle = col.ink; ctx.lineWidth = self.ow(ppm) * 1.5; ctx.beginPath(); ctx.moveTo(q0[0] - pe[0] * rc * 0.98, q0[1] - pe[1] * rc * 0.98); ctx.quadraticCurveTo(q0[0] + u[0] * rc * 0.22, q0[1] + u[1] * rc * 0.22, q0[0] + pe[0] * rc * 0.98, q0[1] + pe[1] * rc * 0.98); ctx.stroke();
      } });
    } else
    if (cut.shoulderR) up.push({ t: 'c', x: shS[0], y: shS[1], r: cut.shoulderR * ppm, f: col.blouse, ow: self.ow(ppm), ink: false });
    if (cut.sleeve) { /* drawn above */ } else if (A[name] && VA.dir) { const v = [el[0] - shS[0], el[1] - shS[1]], vl = Math.hypot(v[0], v[1]), thDown = dirTh([0, 1], VA.dir); up.push(spr(name, VA.sh, shS, thDown + wrapPi(dirTh(v, VA.dir) - thDown) * clamp(vl / (0.45 * P.upArm * ppm), 0, 1))); }
    else up.push(capS(shS, lerp2(shS, el, 0.5), P.rUpArm[0] * 1.7, P.rUpArm[0] * 1.6, col.blouse));
    G(dUp, up); G(dFo, [capS(el, wr, P.rForeArm[0], P.rForeArm[1], C('skin'), id + 'el' + n, id + 'wr' + n)]);
    const hname = cut.hands ? pickHand(J['hand' + n].fing) : null;
    if (hname) {
      const H = J['hand' + n], w3 = J['wrist' + n], q0 = pr(w3), q1 = pr(madd(w3, H.fw, 0.05)), q2 = pr(madd(w3, H.side, 0.05));
      const nm = hname === 'open' ? (dot(H.pn, cam.Z) >= 0 ? 'hand_palm' : 'hand_back') : 'hand_' + hname, hp = A[nm];
      let d = [q1[0] - q0[0], q1[1] - q0[1]]; if (Math.hypot(d[0], d[1]) < 0.3 * 0.05 * ppm) d = [wr[0] - el[0], wr[1] - el[1]];
      const u = [q2[0] - q0[0], q2[1] - q0[1]], c = d[0] * u[1] - d[1] * u[0], h0 = nm === 'hand_palm' ? 1 : -1, strong = Math.abs(c) > 0.25 * Math.hypot(d[0], d[1]) * Math.hypot(u[0], u[1]);
      const flip = strong && Math.sign(c) !== h0 ? -1 : 1, ang = Math.atan2(d[1], d[0]), nat = Math.atan2(hp.fwd[1], hp.fwd[0]), sc = ppm / hp.ppm * P.handScale, wx = wr[0], wy = wr[1];
      G(dFo + 0.002, [{ t: 'fn', fn(ctx) { if (!hp.img) return; ctx.save(); ctx.translate(wx, wy); ctx.rotate(ang); ctx.scale(1, flip); ctx.rotate(-nat); ctx.scale(sc, sc); ctx.drawImage(hp.img, -hp.ax, -hp.ay); ctx.restore(); } }]);
    } else this.drawHand(cam, groups, n, [ox * (1 - w), oy * (1 - w)], dFo + 0.002);
  }
  /* legs with socks and boots */
  for (const key of [far, near]) {
    const n = sideOf[key], VA = V[V.feet || key], fk = V.feet || key, hip = pr(J['hip' + n]), kn = pr(J['knee' + n]), an = pr(J['ankle' + n]), dd = D - 0.02 + (key === near ? 0.004 : 0) + (sided ? 0 : (an[2] - pp[2]) * 0.02);
    G(dd, [capS(hip, kn, P.rThigh[0], P.rThigh[1], C('skinShade'), null, id + 'knee' + n)]);
    const pitch = pose['f' + n].pitch, shin = [capS(kn, an, P.rShin[0], P.rShin[1], C('skin'), id + 'knee' + n)];
    if (A[vn + '_sock' + fk] && VA.sockTop) shin.push(spr(vn + '_sock' + fk, VA.ankle, [an[0], an[1]], dirTh([kn[0] - an[0], kn[1] - an[1]], [VA.sockTop[0] - VA.ankle[0], VA.sockTop[1] - VA.ankle[1]])));
    else shin.push(capS(lerp2(kn, an, 0.64), lerp2(kn, an, 0.86), P.rShin[1] * 1.32, P.rShin[1] * 1.3, '#fbf1e2'));
    const bootName = A[vn + '_boot' + fk] ? vn + '_boot' + fk : 'side_bootA', bootAnk = A[vn + '_boot' + fk] ? VA.ankle : cut.views.side.A.ankle;
    shin.push(spr(bootName, bootAnk, [an[0], an[1]], sided ? -pitch * f : 0));
    G(dd + 0.001, shin);
  }
  /* skirt in slices */
  const swx = dot(this.sway, cam.X) * ppm, rT = (P.rThigh[1] + 0.02 * k) * ppm, hipL = pr(J.hipL), hipR = pr(J.hipR), knL = pr(J.kneeL), knR = pr(J.kneeR);
  const legX = (hq, kq, y) => (kq[1] <= y ? kq[0] : lerp(hq[0], kq[0], clamp((y - hq[1]) / Math.max(1, kq[1] - hq[1]), 0, 1)));
  G(D - 0.005, [{ t: 'fn', fn(ctx) {
    const p = A[vn + '_skirt']; if (!p || !p.img) return; const hb = Math.max(3, Math.ceil(2.5 / s)), ov = 1.2 / s,   // slices at least 2-3 screen pixels tall, overlapping, so no seams show at small sizes
      y0 = V.waistY || 868, y1 = p.y + p.h * 0.92;
    const hr = p.rows[Math.floor(p.h * 0.88)] || p.rows[p.rows.length - 4], yH = pp[1] + (p.y + p.h * 0.88 - V.pel[1]) * s, cH = pp[0] + f * ((hr[0] + hr[1]) / 2 - V.pel[0]) * s, hH = (hr[1] - hr[0]) / 2 * s;
    const xa = legX(hipL, knL, yH), xb = legX(hipR, knR, yH), extL = clamp(cH - hH - (Math.min(xa, xb) - rT), 0, hH * 0.6), extR = clamp(Math.max(xa, xb) + rT - (cH + hH), 0, hH * 0.6);
    for (let ry = 0; ry < p.h; ry += hb) {
      const hh = Math.min(hb + ov, p.h - ry), yArt = p.y + ry + hb / 2, row = p.rows[Math.min(p.rows.length - 1, ry + (hb >> 1))]; if (!row || row[1] - row[0] < 8) continue;
      const t = clamp((yArt - y0) / (y1 - y0), 0, 1), e = Math.pow(t, 1.7), ys = pp[1] + (p.y + ry - V.pel[1]) * s, cA = (row[0] + row[1]) / 2, half = Math.max(1, (row[1] - row[0]) / 2 * s), cX = pp[0] + f * (cA - V.pel[0]) * s;
      const L = cX - half - extL * e + swx * t * t, R = cX + half + extR * e + swx * t * t;
      ctx.save(); ctx.translate((L + R) / 2, ys); ctx.scale(f * s * (R - L) / (2 * half), s); ctx.drawImage(p.img, 0, ry, p.w, hh, p.x - cA, 0, p.w, hh); ctx.restore();
    }
  } }]);
  /* torso and head */
  G(D, [spr(vn + '_torso', V.pel, [pp[0], pp[1]], thT)]);
  const bag = sided && f < 0 && V.bagM ? V.bagM : V.bag;
  if (bag && A.satchel) {
    const a0 = tors(bag.a), b0 = tors(bag.b), b2 = bag.b2 ? tors(bag.b2) : null, bp = A.satchel, bsc = ppm / bp.ppm, sw = thT * 0.3 + clamp(-swx / ppm * 5 * f, -0.3, 0.3), lwS = 0.03 * ppm, owS = self.ow(ppm);
    const drawBag = (ctx) => { if (bp.img && !bag.hidden) { ctx.save(); ctx.translate(b0[0], b0[1]); ctx.rotate(sw); ctx.scale(f * bsc, bsc); ctx.drawImage(bp.img, -bp.ax, -bp.ay); ctx.restore(); } };
    G(D + 0.004, [{ t: 'fn', fn(ctx) {
      ctx.lineCap = 'butt';
      for (const e0 of b2 ? [b0, b2] : [b0]) { const dl = Math.hypot(e0[0] - a0[0], e0[1] - a0[1]) || 1, ex = bag.hidden ? 0 : (bag.behind ? 0.02 : 0.04) * ppm, e = [e0[0] + (e0[0] - a0[0]) / dl * ex, e0[1] + (e0[1] - a0[1]) / dl * ex]; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(e[0], e[1]); ctx.strokeStyle = col.ink; ctx.lineWidth = lwS + owS * 1.6; ctx.stroke(); ctx.strokeStyle = col.strap; ctx.lineWidth = lwS; ctx.stroke(); }
      if (!bag.behind) drawBag(ctx);
    } }]);
    if (bag.behind) G(D - 0.03, [{ t: 'fn', fn: drawBag }]);
  }
  const ah = wrapPi(pose.yaw + pose.hy - cam.yaw), hv = pickView(Math.abs(ah) / D2R, this.headView); this.headView = hv;
  const Vh = cut.views[hv], sidedH = !!Vh.near, fH = !sidedH ? 1 : ah >= 0 ? 1 : -1, fc = pose.face, lw = cut.lw || 1.7;
  const uh = J.headF.U, lagR = clamp(dot(this.hairOff, cam.X) * 5, -0.04, 0.04);
  const thH = Math.atan2(dot(uh, cam.X), dot(uh, cam.Y)) + (sidedH ? pose.hp * 0.4 * fH * Math.abs(Math.cos(pose.yaw + pose.hy)) : 0) + lagR;
  const nk = tors(V.neck); if (!sidedH) nk[1] += pose.hp * 0.03 * ppm;
  G(D + 0.012, [{ t: 'fn', fn(ctx) {
    const hpp = A[hv + '_head']; if (!hpp || !hpp.img) return;
    ctx.save(); ctx.translate(nk[0], nk[1]); ctx.rotate(thH); ctx.scale(fH * s, s); ctx.drawImage(hpp.img, hpp.x - Vh.neck[0], hpp.y - Vh.neck[1]); ctx.translate(-Vh.neck[0], -Vh.neck[1]);
    const V = Vh, vn = hv;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    (V.eyes || []).forEach((E, i) => {
      const open = i === 0 ? fc.eyeR : fc.eyeL, happy = fc.happy > 0.5; if (!happy && open > 0.93) return;
      const bl = A[vn + '_blink' + i]; if (bl && bl.img) { if (happy || open < 0.55) ctx.drawImage(bl.img, bl.x, bl.y); return; }
      const pad = cut.lw ? 4 : 1.8, o = happy ? 0 : clamp(open, 0, 1), top = E.c[1] - E.ry - pad, yl = top + (2 * E.ry + 2 * pad) * (happy ? 1 : (1 - o) * 0.84);
      ctx.save(); ctx.beginPath(); ctx.ellipse(E.c[0], E.c[1], E.rx + pad, E.ry + pad, 0, 0, TAU); ctx.clip(); ctx.fillStyle = col.lid; ctx.fillRect(E.c[0] - E.rx - pad - 2, top - 1, 2 * E.rx + 2 * pad + 4, yl - top + 1); ctx.restore();
      ctx.beginPath();
      if (happy) { ctx.moveTo(E.c[0] - E.rx, E.c[1] + 2); ctx.quadraticCurveTo(E.c[0], E.c[1] - E.ry * 1.05, E.c[0] + E.rx, E.c[1] + 2); }
      else { const hw = Math.sqrt(Math.max(0.05, 1 - Math.pow((yl - E.c[1]) / (E.ry + pad), 2))) * (E.rx + pad - 0.5); ctx.moveTo(E.c[0] - hw, yl - 0.5); ctx.quadraticCurveTo(E.c[0], yl + E.ry * 0.3 * (1 - o), E.c[0] + hw, yl - 0.5); }
      ctx.strokeStyle = col.ink; ctx.lineWidth = lw * 1.2; ctx.stroke();
    });
    for (let i = 0; i < 2; i++) { const b = A[vn + '_brow' + i]; if (!b || !b.img) continue; const raise = i === 0 ? fc.browR : fc.browL, sg = i === 0 ? -1 : 1; ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2 - raise * 0.02 * cut.ppm); ctx.rotate(sg * fc.browAng * 0.38); ctx.drawImage(b.img, -b.w / 2, -b.h / 2); ctx.restore(); }
    const flipM = fc.mid === 9, pm = cut.mouths && V.mouthSx && fc.mid >= 0 ? A['mouth_' + (flipM ? 0 : fc.mid)] : null;
    if (pm && pm.img) { const mc = sk.art.extra.mouth; ctx.save(); ctx.translate(V.mouth.c[0], V.mouth.c[1] + (V.mouthDy || 0) + (flipM ? 6 : 0)); ctx.rotate(V.mouth.tilt || 0); ctx.scale(V.mouthSx * (fc.msc || 1), (flipM ? -1 : 1) * (fc.msc || 1)); ctx.drawImage(pm.img, pm.x - mc.cx, pm.y - mc.cy); ctx.restore(); }
    else if (V.profile && fc.open > 0.07) {
      const m = V.mouth, o = clamp(fc.open, 0, 1), ed = sk.art.meta[vn].edge, eX = (y) => ed.xs[clamp(Math.round(y) - ed.y0, 0, ed.xs.length - 1)] + 0.5, yT = m.c[1] - 5 - 8 * o, yB = m.c[1] + 4 + 15 * o, top = [eX(yT), yT], bot = [eX(yB), yB], ex = Math.min(top[0], bot[0]), tip = [ex - 12 - 6 * fc.wide * (1 - fc.round) - 8 * o, m.c[1] + 1];
      const wedge = () => { ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); for (let y = yT; y <= yB; y += 1) ctx.lineTo(eX(y), y); ctx.lineTo(bot[0], bot[1]); ctx.closePath(); };   // follows the face outline, so nothing is painted outside the head
      wedge(); ctx.fillStyle = col.mouthIn; ctx.fill();
      if (o > 0.4) { ctx.save(); wedge(); ctx.clip(); ctx.beginPath(); ctx.ellipse(ex - 3, bot[1] - 2, 11, 6 + 4 * o, 0, 0, TAU); ctx.fillStyle = col.tongue; ctx.fill(); ctx.restore(); }
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(tip[0], tip[1]); ctx.lineTo(bot[0], bot[1]); ctx.strokeStyle = col.ink; ctx.lineWidth = lw; ctx.stroke();
    }
    else if (V.mouth) { const art = V.profile ? 1 : cut.mouths && V.mouthSx ? 0 : clamp(fc.art, 0, 1), mo = A[vn + '_mouth']; if (art < 0.98) { ctx.save(); if (V.mouthClipX) { ctx.beginPath(); ctx.rect(0, 0, V.mouthClipX, 4000); ctx.clip(); } ctx.globalAlpha = 1 - art; mouth2D(ctx, fc, V.mouth, col, lw); ctx.restore(); } if (art > 0.02 && mo && mo.img) { ctx.globalAlpha = art; if (V.profile && fc.mid === 9) { ctx.save(); ctx.translate(0, 2 * (mo.y + mo.h / 2) + 5); ctx.scale(1, -1); ctx.drawImage(mo.img, mo.x, mo.y); ctx.restore(); } else ctx.drawImage(mo.img, mo.x, mo.y); ctx.globalAlpha = 1; } }
    ctx.restore();
  } }]);
};

const HAND_REF = [['open', FING.open], ['open', FING.flat], ['relaxed', FING.relaxed], ['fist', FING.fist], ['fist', FING.grip], ['point', FING.point], ['thumb', FING.thumb]];
/* Liv from the C01 character sheet (green-skirt variant with a full turnaround). */
if (typeof C01_ART !== 'undefined') {
  Object.assign(C01_ART.colors, { lid: '#fbc695', ink: '#33180c' });
  SKINS.c01 = Object.assign({}, SKINS.liv, {
    name: 'Liv', art: C01_ART, restYaw: 0.72, stance: null, photoPose: null, line: 0.0042,
    prop: { thigh: 0.273, shin: 0.273, ankleH: 0.1025, foot: 0.19, hipW: 0.043, torso: 0.335, shW: 0.112, upArm: 0.194, foreArm: 0.178, headR: 0.114, neck: 0.045, rThigh: [0.04, 0.036], rShin: [0.036, 0.03], rUpArm: [0.028, 0.025], rForeArm: [0.025, 0.02], rNeck: 0.026, handScale: 0.92 },
    col: Object.assign({}, SKINS.liv.col, { skin: C01_ART.colors.skin, skinShade: '#f3a877', ink: '#33180c' }),
    cut: { ppm: 439, views: {
      front: { pel: [527, 945], chest: [527, 797], neck: [529, 770], waistY: 868, A: { sh: [480, 796], dir: [-2, 60], ankle: [508, 1190] }, B: { sh: [578, 796], dir: [2, 60], ankle: [546, 1190] }, eyes: [{ c: [518.5, 719], rx: 5.5, ry: 8.5 }, { c: [549, 719], rx: 5.5, ry: 8.5 }], mouth: { c: [529, 743], W: 13, H: 26, tilt: 0 } },
      tq: { near: 'A', pel: [722, 945], chest: [724, 797], neck: [730, 772], waistY: 867, A: { sh: [703, 797], dir: [-2, 60], ankle: [712, 1190] }, B: { sh: [762, 800], ankle: [738, 1190] }, eyes: [{ c: [739.5, 721], rx: 5.5, ry: 8.5 }, { c: [765.5, 720], rx: 4, ry: 8 }], mouth: { c: [758, 748], W: 9, H: 22, tilt: -0.05 } },
      side: { near: 'A', pel: [912, 945], chest: [913, 797], neck: [915, 773], waistY: 868, A: { sh: [906, 797], dir: [0, 60], ankle: [903, 1190] }, B: { sh: [914, 797], ankle: [903, 1190] }, eyes: [{ c: [945, 727], rx: 4, ry: 8.5 }], mouth: { c: [955, 752], W: 5, H: 16, tilt: 0 } },
      back: { back: true, pel: [1097, 945], chest: [1097, 799], neck: [1100, 779], waistY: 868, A: { sh: [1050, 799], dir: [-2, 60], ankle: [1074, 1190] }, B: { sh: [1146, 799], dir: [2, 60], ankle: [1120, 1190] }, eyes: [], mouth: null },
    } },
  });
}

/* Liv from the generated C01 rig pack: red skirt, five views (front, three-quarter, side, three-quarter back, back). */
if (typeof C01P_ART !== 'undefined') {
  const M = C01P_ART.meta, vw = (vn, o) => Object.assign({ pel: [512, 912], chest: [512, 528], neck: M[vn].neck, waistY: 748, A: M[vn].A, B: M[vn].B }, o);
  Object.assign(C01P_ART.colors, { ink: '#3a1c0c', blouseShade: '#e2bd8a' });
  SKINS.c01p = Object.assign({}, SKINS.liv, {
    name: 'Liv', art: C01P_ART, restYaw: 0.75, idleArms: { aL: { h: [0.21, -0.965, 0.04] }, aR: { h: [0.21, -0.965, 0.04] } }, stance: { near: { p: [1.25, 0, 0], yaw: 0.16 }, far: { p: [1.25, 0, 0], yaw: 0.16 } }, photoPose: null, line: 0.0042,
    prop: { thigh: 0.2, shin: 0.2, ankleH: 0.098, foot: 0.17, hipW: 0.076, torso: 0.386, shW: 0.13, upArm: 0.15, foreArm: 0.14, headR: 0.145, neck: 0.045, rThigh: [0.031, 0.029], rShin: [0.029, 0.026], rUpArm: [0.029, 0.025], rForeArm: [0.025, 0.016], rNeck: 0.03, handScale: 1.1 },
    col: Object.assign({}, SKINS.liv.col, { skin: '#fdc28d', skinShade: '#f0a56e', ink: '#3a1c0c' }),
    cut: { ppm: 996, lw: 3.2, hands: true, mouths: true, sleeve: { r1: 0.037, r2: 0.047, c: 0.3, cuff0: 0.6, cuff1: 0.74, rc: 0.034 }, order: ['front', 'tq', 'side', 'tqb', 'back'], limits: [24, 66, 112, 152], views: {
      front: vw('front', { pel: [513, 912], chest: [513, 528], eyes: [{ c: [463, 331], rx: 22, ry: 26 }, { c: [566, 331], rx: 22, ry: 26 }], mouth: { c: [515, 394], W: 34, H: 62, tilt: 0 }, mouthSx: 1, bag: { a: [566, 474], b: [416, 800] } }),
      tq: vw('tq', { near: 'A', pel: [510, 912], chest: [510, 528], eyes: [{ c: [536, 330], rx: 22, ry: 26 }, { c: [608, 329], rx: 11, ry: 24 }], mouth: { c: [577, 394], W: 27, H: 56, tilt: -0.04 }, mouthSx: 0.8, mouthDy: 12, bag: { a: [556, 478], b: [438, 800] }, bagM: { a: [456, 478], b: [634, 792], behind: true } }),
      side: vw('side', { near: 'A', feet: 'B', pel: [505, 912], chest: [512, 528], B: Object.assign({ sh: [540, 528] }, M.side.B), eyes: [{ c: [605, 331], rx: 10, ry: 25 }], mouth: { c: [631, 397], W: 17, H: 44, tilt: 0 }, mouthClipX: 639, profile: true, bag: { a: [524, 480], b: [498, 800] }, bagM: { a: [506, 480], b: [548, 706], b2: [470, 700], hidden: true } }),
      tqb: vw('tqb', { near: 'B', back: true, pel: [500, 912], chest: [498, 528], eyes: [], mouth: null, bag: { a: [470, 478], b: [592, 800] }, bagM: { a: [552, 478], b: [398, 792], behind: true } }),
      back: vw('back', { back: true, eyes: [], mouth: null, bag: { a: [462, 474], b: [622, 800] } }),
    } },
  });
}
