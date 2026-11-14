/* Liv engine · rig: one skeleton for every character. A skin only supplies proportions, colours, hair and outfit.
   Pose values are normalised (arm lengths, leg lengths, hip widths), so every motion transfers to any skin. */
const BASE_PROP = { hipH: 0.60, thigh: 0.27, shin: 0.27, ankleH: 0.06, foot: 0.17, hipW: 0.068, torso: 0.31, shW: 0.108, upArm: 0.15, foreArm: 0.142, hand: 0.085, neck: 0.045, headR: 0.15,
  rThigh: [0.05, 0.04], rShin: [0.04, 0.031], rUpArm: [0.04, 0.035], rForeArm: [0.035, 0.029], rNeck: 0.033, handScale: 1 };

const FING = {
  relaxed: [0.25, 0.2, 0.24, 0.28, 0.32], open: [-0.2, 0, 0, 0, 0], flat: [0.15, 0, 0, 0, 0], fist: [1, 1, 1, 1, 1], grip: [0.75, 0.8, 0.8, 0.8, 0.8],
  point: [0.9, 0, 1, 1, 1], thumb: [-0.5, 1, 1, 1, 1], pinch: [0.55, 0.5, 0.75, 0.85, 0.9], one: [0.9, 0, 1, 1, 1], two: [0.9, 0, 0, 1, 1], three: [-0.3, 0, 0, 1, 1], hook: [0.5, 0.55, 0.55, 0.55, 0.55],
};
const armRest = () => ({ art: 0, h: [0.09, -0.985, 0.04], e: [0.25, -0.2, -1], palm: [-1, 0, 0], bend: 0, m: 0, fing: FING.relaxed.slice(), spread: 0.12, w: 0, wp: [0, 0, 0], pw: 0, wpalm: [0, 0, 1] });
const faceRest = () => ({ mid: 0, msc: 1, art: 1, open: 0, wide: 0.5, round: 0, smile: 0.45, teeth: 0, browL: 0, browR: 0, browAng: 0, eyeL: 1, eyeR: 1, happy: 0, gx: 0, gy: 0, blush: 0.5 });
function basePose() {
  return { x: 0, z: 0, gy: 0, hop: 0, yaw: 0, py: 0.985, psx: 0, psf: 0, ptw: 0, prl: 0, lean: 0, cpitch: 0, ctw: 0, crl: 0, hy: 0, hp: 0, hr: 0, shL: 0, shR: 0,
    aL: armRest(), aR: armRest(), fL: { p: [1, 0, 0], pitch: 0, yaw: 0.16 }, fR: { p: [1, 0, 0], pitch: 0, yaw: 0.16 }, face: faceRest() };
}
// deep numeric blend of b into a (in place) with weight w; only keys present in b are touched
function blendInto(a, b, w) {
  for (const k in b) {
    const bv = b[k], av = a[k];
    if (bv == null) continue;
    if (typeof bv === 'number') a[k] = av == null ? bv : av + (bv - av) * w;
    else if (Array.isArray(bv)) { if (!av || k === 'wp' || k === 'wpalm') a[k] = bv.slice(); else for (let i = 0; i < bv.length; i++) av[i] += (bv[i] - av[i]) * w; }   // world targets are absolute: their weight does the blending
    else if (typeof bv === 'object') { if (!av) a[k] = {}; blendInto(a[k], bv, w); }
  }
  return a;
}
const clonePose = (p) => JSON.parse(JSON.stringify(p));

class Character {
  constructor(skin) {
    this.skin = skin; const k = this.k = skin.scale || 1; this.P = {};
    for (const key in BASE_PROP) { const v = skin.prop && skin.prop[key] != null ? skin.prop[key] : BASE_PROP[key]; this.P[key] = Array.isArray(v) ? v.map((x) => x * k) : key === 'handScale' ? v : v * k; }
    const P = this.P; P.leg = P.thigh + P.shin; P.arm = P.upArm + P.foreArm; P.hipH = P.leg + P.ankleH;
    this.pose = basePose(); this.J = null; this.braids = null; this.sway = [0, 0, 0]; this.swayV = [0, 0, 0]; this.hairOff = [0, 0, 0]; this.hairV = [0, 0, 0]; this.last = null; this.alpha = 1;
  }
  ow(s) { return Math.max(0.8, s * (this.skin.line || 0.0046) * Math.sqrt(this.k)); }

  /* ----- pose -> joints ----- */
  solve() {
    const p = this.pose, P = this.P, J = {};
    const g = [p.x, p.gy + p.hop, p.z], R0 = frame(p.yaw, 0, 0);
    J.ground = g; J.R0 = R0;
    J.pelF = frame(p.yaw + p.ptw, p.lean * 0.45, p.prl);
    J.chF = frame(p.yaw + p.ctw, p.lean + p.cpitch, p.crl);
    J.pel = add(g, add(mul(R0.L, p.psx * P.hipW), add(mul(R0.F, p.psf * P.leg), [0, p.py * P.hipH + 0.02 * this.k, 0])));
    J.chest = madd(J.pel, add(J.pelF.U, J.chF.U), 0.5 * P.torso);
    J.neck = madd(J.chest, J.chF.U, 0.035 * this.k);
    J.headF = frame(p.yaw + p.hy, p.hp, p.hr);
    J.head = madd(J.neck, norm(add(mul(J.chF.U, 0.4), mul(J.headF.U, 0.6))), P.neck + P.headR * 0.82);
    for (const s of [1, -1]) {
      const n = s > 0 ? 'L' : 'R', f = p['f' + n], a = p['a' + n];
      // leg
      const hip = add(J.pel, add(mul(J.pelF.L, s * P.hipW), mul(J.pelF.U, -0.02 * this.k)));
      const ankT = add(g, add(mul(R0.L, s * f.p[0] * P.hipW), add(mul(R0.F, f.p[2] * P.leg), [0, f.p[1] * P.leg + P.ankleH, 0])));
      const fy = p.yaw + s * f.yaw, Ff0 = [Math.sin(fy), 0, Math.cos(fy)];
      const kneeHint = add(mix(hip, ankT, 0.5), add(mul(Ff0, 1), mul(R0.L, s * 0.12)));
      const leg = ik2(hip, ankT, P.thigh, P.shin, kneeHint);
      const cg = Math.cos(f.pitch), sg = Math.sin(f.pitch);
      J['hip' + n] = hip; J['knee' + n] = leg.mid; J['ankle' + n] = leg.end;
      J['footF' + n] = [Ff0[0] * cg, sg, Ff0[2] * cg]; J['footU' + n] = [-Ff0[0] * sg, cg, -Ff0[2] * sg];
      // arm
      const O = mul(J.chF.L, s), sh = add(J.chest, add(mul(O, P.shW), mul(J.chF.U, (s > 0 ? p.shL : p.shR) * 0.035 * this.k)));
      const org = madd(sh, O, -a.m * P.shW);
      let ht = add(org, add(mul(O, a.h[0] * P.arm), add(mul(J.chF.U, a.h[1] * P.arm), mul(J.chF.F, a.h[2] * P.arm))));
      if (a.w > 0) ht = mix(ht, a.wp, a.w);
      const eh = add(sh, add(mul(O, a.e[0]), add(mul(J.chF.U, a.e[1]), mul(J.chF.F, a.e[2]))));
      const arm = ik2(sh, ht, P.upArm, P.foreArm, eh);
      let fw = norm(sub(arm.end, arm.mid));
      let pv = add(mul(O, a.palm[0]), add(mul(J.chF.U, a.palm[1]), mul(J.chF.F, a.palm[2])));
      if (a.pw > 0) pv = mix(pv, a.wpalm, a.pw);
      let pn = madd(pv, fw, -dot(pv, fw)); if (vlen(pn) < 1e-3) pn = madd(O, fw, -dot(O, fw)); pn = norm(pn);
      if (a.bend) { const c = Math.cos(a.bend), sn = Math.sin(a.bend); const f2 = add(mul(fw, c), mul(pn, sn)); pn = sub(mul(pn, c), mul(fw, sn)); fw = f2; }
      J['sh' + n] = sh; J['elbow' + n] = arm.mid; J['wrist' + n] = arm.end;
      J['hand' + n] = { fw, pn, side: mul(cross(pn, fw), s), fing: a.fing, spread: a.spread };
      J['palm' + n] = madd(arm.end, fw, 0.045 * this.k * P.handScale);
    }
    this.J = J; return J;
  }

  /* ----- secondary motion: braids (verlet chains), skirt sway and hair bounce ----- */
  step(dt) {
    const J = this.J; if (!J) return;
    dt = Math.min(dt, 1 / 30);
    const sk = this.skin, R = this.P.headR;
    const lag = (pos, vel, target, kf, damp) => { for (let i = 0; i < 3; i++) { vel[i] += ((target[i] - pos[i]) * kf - vel[i] * damp) * dt; pos[i] += vel[i] * dt; } };
    if (!this.last) this.last = { pel: J.pel.slice(), head: J.head.slice(), pv: [0, 0, 0], hv: [0, 0, 0] };
    const L = this.last, pv = mul(sub(J.pel, L.pel), 1 / dt), hv = mul(sub(J.head, L.head), 1 / dt);
    // skirt: the hem trails behind the pelvis
    lag(this.sway, this.swayV, mul(pv, -0.035), 90, 11);
    lag(this.hairOff, this.hairV, mul(hv, -0.02), 160, 13);
    L.pel = J.pel.slice(); L.head = J.head.slice();
    for (const v of [this.sway, this.hairOff]) { const l = vlen(v); if (l > 0.08) { v[0] *= 0.08 / l; v[1] *= 0.08 / l; v[2] *= 0.08 / l; } }
    if (sk.hair.braids) {
      const defs = sk.hair.braids;
      if (!this.braids) this.braids = defs.map((b) => { const a = add(J.head, lcomb(J.headF, b.at[0] * R, b.at[1] * R, b.at[2] * R)); return { n: Array.from({ length: b.n }, (_, i) => [a[0], a[1] - i * b.seg * this.k, a[2]]), o: null }; });
      this.braids.forEach((br, bi) => {
        const b = defs[bi], segL = b.seg * this.k, a = add(J.head, lcomb(J.headF, b.at[0] * R, b.at[1] * R, b.at[2] * R));
        if (!br.o) br.o = br.n.map((q) => q.slice());
        for (let i = 1; i < br.n.length; i++) { const q = br.n[i], o = br.o[i]; const vx = (q[0] - o[0]) * 0.94, vy = (q[1] - o[1]) * 0.94, vz = (q[2] - o[2]) * 0.94; o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; q[0] += vx; q[1] += vy - 9.8 * dt * dt * 1.6; q[2] += vz; }
        br.n[0] = a; br.o[0] = a.slice();
        for (let it = 0; it < 4; it++) {
          for (let i = 1; i < br.n.length; i++) {
            const prev = br.n[i - 1], q = br.n[i]; let d = sub(q, prev); const l = vlen(d) || 1e-6; br.n[i] = madd(prev, d, segL / l);
            // keep the braid outside the neck/chest column and the head
            for (const [c, rad] of [[J.chest, 0.105 * this.k], [mix(J.chest, J.pel, 0.5), 0.1 * this.k], [J.head, R * 1.02]]) { const e = sub(br.n[i], c), el = vlen(e); if (el < rad + b.r * this.k) br.n[i] = madd(c, e, (rad + b.r * this.k) / (el || 1e-6)); }
          }
        }
      });
    }
  }
  resetSprings() { this.braids = null; this.last = null; this.sway = [0, 0, 0]; this.swayV = [0, 0, 0]; this.hairOff = [0, 0, 0]; this.hairV = [0, 0, 0]; }

  /* ----- drawing ----- */
  draw(cam, groups) {
    const J = this.J, P = this.P, sk = this.skin, col = sk.col, k = this.k, self = this;
    const pr = (p) => cam.project(p);
    const C = (key) => col[key] || key;
    const circ = (p3, r, f, extra) => { const q = pr(p3); return Object.assign({ t: 'c', x: q[0], y: q[1], r: r * q[3], f, ow: self.ow(q[3]), d: q[2] }, extra); };
    const cap = (a3, b3, ra, rb, f, ja, jb) => { const a = pr(a3), b = pr(b3); return { t: 'cap', x1: a[0], y1: a[1], r1: ra * a[3], x2: b[0], y2: b[1], r2: rb * b[3], f, ow: self.ow((a[3] + b[3]) / 2), ja, jb, d: (a[2] + b[2]) / 2 }; };
    const G = (d, shapes) => { const g = { d, shapes, alpha: self.alpha < 1 ? self.alpha : null }; groups.push(g); return g; };
    const id = this.id || (this.id = 'c' + Math.random().toString(36).slice(2, 7));
    if (sk.cut && sk.art && sk.art.ready) return sk.cut.views ? this.drawViews(cam, groups) : this.drawCut(cam, groups);
    const pelD = pr(J.pel)[2], chD = pr(J.chest)[2];

    /* ---- body: torso (+ skirt) as stacked elliptical sections ---- */
    const defs = sk.body.sections, hasSkirt = !!sk.body.skirt;
    const legCross = (n, y) => { const h = J['hip' + n], kn = J['knee' + n]; if (kn[1] >= y) return kn; return mix(h, kn, clamp((h[1] - y) / Math.max(1e-4, h[1] - kn[1]), 0, 1)); };
    const secs = defs.map((d) => {
      let c, L, F, a = d.a * k, b = d.b * k;
      if (d.u >= 0) { const u = Math.min(d.u, 1), ex = d.u - u; c = add(J.pel, mul(add(mul(J.pelF.U, u - u * u / 2), mul(J.chF.U, u * u / 2)), P.torso)); if (ex) c = madd(c, J.chF.U, ex * P.torso); L = norm(mix(J.pelF.L, J.chF.L, u)); F = norm(mix(J.pelF.F, J.chF.F, u)); }
      else {
        c = madd(J.pel, norm(mix(J.pelF.U, UP, 0.65)), d.u * P.torso); L = J.pelF.L; F = J.pelF.F;
        if (hasSkirt) {
          const w = clamp(-d.u / 0.7, 0, 1), q1 = sub(legCross('L', c[1]), c), q2 = sub(legCross('R', c[1]), c);
          const l1 = dot(q1, L), l2 = dot(q2, L), f1 = dot(q1, F), f2 = dot(q2, F), rt = P.rThigh[1] + 0.022 * k;
          c = add(c, add(mul(L, (l1 + l2) * 0.35 * w), mul(F, (f1 + f2) * 0.4 * w)));
          c = madd(c, self.sway, w);
          a = Math.max(a, Math.abs(l1 - l2) / 2 + rt); b = Math.max(b, Math.abs(f1 - f2) * 0.5 + rt + 0.02 * k * w);
        }
      }
      return { u: d.u, c, L, F, a, b, q: pr(c) };
    });
    const secAt = (u) => {
      let i = 0; while (i < secs.length - 2 && secs[i + 1].u < u) i++;
      const A = secs[i], B = secs[i + 1], t = clamp((u - A.u) / (B.u - A.u), 0, 1);
      return { c: mix(A.c, B.c, t), L: norm(mix(A.L, B.L, t)), F: norm(mix(A.F, B.F, t)), a: lerp(A.a, B.a, t), b: lerp(A.b, B.b, t), tx: B.q[0] - A.q[0], ty: B.q[1] - A.q[1] };
    };
    // silhouette of one section: 3D normal N lies in the screen plane, perpendicular to the spine as drawn
    const silN = (tx, ty) => { const l = Math.hypot(tx, ty); if (l < 1e-3) return cam.X; const px = -ty / l, py = tx / l; const N = add(mul(cam.X, px), mul(cam.Y, -py)); return dot(N, cam.X) < 0 && Math.abs(px) > 0.3 ? mul(N, -1) : N; };
    const ext = (S, N) => { const ln = dot(S.L, N), fn = dot(S.F, N), w = Math.hypot(S.a * ln, S.b * fn) || 1e-6; return add(mul(S.L, S.a * S.a * ln / w), mul(S.F, S.b * S.b * fn / w)); };
    const ring = (S, N, n = 8) => { // near half of the section ellipse, from its right silhouette point to the left one
      const tR = Math.atan2(S.b * dot(S.F, N), S.a * dot(S.L, N)), tN = Math.atan2(S.b * dot(S.F, cam.Z), S.a * dot(S.L, cam.Z));
      const dir = Math.cos(tR + PI / 2 - tN) > 0 ? 1 : -1, out = [];
      for (let i = 0; i <= n; i++) { const t = tR + dir * PI * i / n; const q = pr(add(S.c, add(mul(S.L, S.a * Math.cos(t)), mul(S.F, S.b * Math.sin(t))))); out.push([q[0], q[1]]); }
      return out;
    };
    const right = [], left = [];
    for (let i = 0; i < secs.length; i++) {
      const S = secs[i], A = secs[Math.max(0, i - 1)], B = secs[Math.min(secs.length - 1, i + 1)];
      S.N = silN(B.q[0] - A.q[0], B.q[1] - A.q[1]);
      const e = ext(S, S.N), r = pr(add(S.c, e)), l = pr(sub(S.c, e));
      right.push([r[0], r[1]]); left.push([l[0], l[1]]);
    }
    const hem = ring(secs[0], secs[0].N, 10);
    const bodyPath = (ctx) => { splineTo(ctx, right.slice().reverse(), true); for (const q of hem) ctx.lineTo(q[0], q[1]); splineTo(ctx, left, false); ctx.closePath(); };
    const sAvg = secs[secs.length - 2].q[3], owB = this.ow(sAvg);
    const ringU = (u, n) => { const S = secAt(u); S.N = silN(S.tx, S.ty); return ring(S, S.N, n); };
    const surf = (u, tdeg) => {
      const S = secAt(u), t0 = Math.atan2(S.b * dot(S.L, cam.Z), S.a * dot(S.F, cam.Z)); let t = tdeg * D2R, dt = wrapPi(t - t0), cl = false;
      const lim = 87 * D2R; if (dt > lim) { dt = lim; cl = true; } else if (dt < -lim) { dt = -lim; cl = true; } t = t0 + dt;
      const q = pr(add(S.c, add(mul(S.L, S.a * Math.sin(t)), mul(S.F, S.b * Math.cos(t))))); return [q[0], q[1], cl, q[3]];
    };
    const bodyShapes = [];
    bodyShapes.push(cap(madd(J.neck, J.chF.U, -0.03 * k), madd(J.head, J.headF.U, -P.headR * 0.5), P.rNeck, P.rNeck, C('skin')));
    bodyShapes.push({ t: 'poly', pts: right, path: bodyPath, f: C(sk.body.col), ow: owB });
    bodyShapes.push({ t: 'fn', fn(ctx) {
      ctx.save(); ctx.beginPath(); bodyPath(ctx); ctx.clip();
      const B = {
        ctx, s: sAvg, ow: owB, C, surf, k,
        band(u1, u2, color, inkTop, inkBottom) {
          const a = ringU(u2, 8), b = ringU(u1, 8);
          const M = 400, la = a.length - 1, lb = b.length - 1, sgn = a[la][0] >= a[0][0] ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(a[0][0] - sgn * M, a[0][1]); for (const q of a) ctx.lineTo(q[0], q[1]); ctx.lineTo(a[la][0] + sgn * M, a[la][1]);
          ctx.lineTo(b[lb][0] + sgn * M, b[lb][1]); for (let i = lb; i >= 0; i--) ctx.lineTo(b[i][0], b[i][1]); ctx.lineTo(b[0][0] - sgn * M, b[0][1]); ctx.closePath();
          ctx.fillStyle = C(color); ctx.fill();
          ctx.strokeStyle = C('ink'); ctx.lineWidth = owB * 0.9;
          for (const [on, r] of [[inkTop, a], [inkBottom, b]]) if (on) { ctx.beginPath(); r.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); }
        },
        patch(list, color, inkW) {
          const pts = list.map(([u, t]) => surf(u, t)); if (pts.every((q) => q[2])) return false;
          ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
          if (color) { ctx.fillStyle = C(color); ctx.fill(); }
          if (inkW) { ctx.strokeStyle = C('ink'); ctx.lineWidth = owB * inkW; ctx.stroke(); }
          return true;
        },
        line(list, color, w) {
          const pts = list.map(([u, t]) => surf(u, t)); ctx.beginPath(); let pen = false;
          for (let i = 0; i < pts.length; i++) { if (pts[i][2]) { pen = false; continue; } if (pen) ctx.lineTo(pts[i][0], pts[i][1]); else ctx.moveTo(pts[i][0], pts[i][1]); pen = true; }
          ctx.strokeStyle = C(color); ctx.lineWidth = w * sAvg; ctx.stroke();
        },
        dot(u, t, r, color) { const q = surf(u, t); if (q[2]) return; ctx.beginPath(); ctx.arc(q[0], q[1], r * q[3], 0, TAU); ctx.fillStyle = C(color); ctx.fill(); },
      };
      if (sk.body.paint) sk.body.paint(B, self);
      ctx.restore();
    } });
    const bodyD = (pelD + chD) / 2;
    G(bodyD, bodyShapes);
    if (sk.body.extras) sk.body.extras({ self, J, cam, pr, C, G, circ, cap, surf, bodyD, k });

    /* ---- legs ---- */
    const skirtFront = pelD + (hasSkirt ? secs[0].b * 0.9 : -99), lg = sk.legs;
    let under = 0;
    const legGroup = (d, shapes) => { if (hasSkirt && d < skirtFront) { under++; return G(bodyD - 0.02 + d * 0.01, shapes); } return G(d, shapes); };
    for (const n of ['L', 'R']) {
      const hip = J['hip' + n], knee = J['knee' + n], ank = J['ankle' + n], Ff = J['footF' + n], Fu = J['footU' + n];
      const th = cap(hip, knee, P.rThigh[0], P.rThigh[1], C(lg.thigh), null, id + 'knee' + n);
      legGroup(th.d, [th]);
      const shS = [cap(knee, ank, P.rShin[0], P.rShin[1], C(lg.shin), id + 'knee' + n, id + 'ank' + n)];
      const shinD = norm(sub(knee, ank)), bt = lg.boot, bf = bt.fat || 1;
      if (lg.sock) {
        const so = lg.sock, top = mix(knee, ank, so.from), rs = P.rShin[1] * so.r;
        shS.push(cap(top, ank, rs * 1.08, rs, C(so.col)));
        if (so.cuff) shS.push(cap(top, madd(top, shinD, -0.035 * k), rs * 1.2, rs * 1.2, C(so.col)));
        if (so.ribs) { const a = pr(top), b = pr(madd(ank, shinD, (bt.shaft || 0) * k)), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, rr = rs * a[3]; shS.push({ t: 'fn', fn(ctx) { ctx.strokeStyle = C(so.ribs); ctx.lineWidth = 0.006 * k * a[3]; for (const o of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.moveTo(a[0] + nx * rr * o, a[1] + ny * rr * o); ctx.lineTo(b[0] + nx * rr * o, b[1] + ny * rr * o); ctx.stroke(); } } }); }
      }
      if (bt.shaft) {
        const top = madd(ank, shinD, bt.shaft * k), rsh = 0.043 * k * bf;
        shS.push(cap(top, ank, rsh, rsh * 1.04, C(bt.col)));
        if (bt.cuff) shS.push(cap(top, madd(top, shinD, -0.014 * k), rsh * 1.12, rsh * 1.12, C(bt.cuff)));
        if (bt.lace) {
          const Ff0 = norm([J['footF' + n][0], 0, J['footF' + n][2]]), sdv = norm(cross(shinD, Ff0)), vis = dot(Ff0, cam.Z);
          if (vis > -0.25) {
            const rows = []; for (let i = 0; i < 4; i++) { const c0 = add(madd(ank, shinD, bt.shaft * k * (0.1 + 0.3 * i)), mul(Ff0, rsh * 0.98)); rows.push([pr(madd(c0, sdv, 0.017 * k)), pr(madd(c0, sdv, -0.017 * k))]); }
            shS.push({ t: 'fn', fn(ctx) {
              ctx.strokeStyle = C(bt.lace); ctx.lineWidth = 0.0085 * k * rows[0][0][3]; ctx.beginPath();
              for (let i = 0; i < 3; i++) { ctx.moveTo(rows[i][0][0], rows[i][0][1]); ctx.lineTo(rows[i + 1][1][0], rows[i + 1][1][1]); ctx.moveTo(rows[i][1][0], rows[i][1][1]); ctx.lineTo(rows[i + 1][0][0], rows[i + 1][0][1]); }
              ctx.stroke();
              const t0 = rows[3], cx = (t0[0][0] + t0[1][0]) / 2, cy = (t0[0][1] + t0[1][1]) / 2, br = 0.017 * k * t0[0][3];
              ctx.beginPath(); ctx.ellipse(cx - br, cy - br * 0.3, br, br * 0.55, -0.5, 0, TAU); ctx.ellipse(cx + br, cy - br * 0.3, br, br * 0.55, 0.5, 0, TAU); ctx.stroke();
            } });
          }
        }
      }
      legGroup(shS[0].d, shS);
      const fl = P.foot, rh = 0.036 * k * bf, rt = 0.041 * k * bf;
      const heel = add(ank, add(mul(Ff, -0.2 * fl), mul(Fu, -(P.ankleH - rh)))), toe = add(ank, add(mul(Ff, 0.66 * fl), mul(Fu, -(P.ankleH - rt))));
      const ftS = [], fq = (f, u) => { const q = pr(add(ank, add(mul(Ff, f * fl), mul(Fu, u * k)))); return [q[0], q[1], q[3]]; };
      const shape = (du, rr) => { const pts = [fq(-0.22, -P.ankleH / k + rr / k + du), fq(0.66, -P.ankleH / k + rr / k + du), fq(0.62, -P.ankleH / k + rr / k + du + 0.022), fq(0.1, -0.008 + du)]; return { t: 'poly', pts: pts.map((q) => [q[0], q[1]]), r: rr * pts[0][2], ow: self.ow(pts[0][2]) }; };
      if (bt.sole) ftS.push(Object.assign(shape(-0.013, rh), { f: C(bt.sole) }));
      ftS.push(Object.assign(shape(bt.sole ? 0.006 : 0, rh * (bt.sole ? 0.93 : 1)), { f: C(bt.col) }));
      legGroup(pr(mix(heel, toe, 0.5))[2], ftS);
    }

    /* ---- arms and hands ---- */
    const ar = sk.arms;
    for (const n of ['L', 'R']) {
      const sh = J['sh' + n], el = J['elbow' + n], wr = J['wrist' + n], H = J['hand' + n];
      const up = [cap(sh, el, P.rUpArm[0], P.rUpArm[1], C(ar.upper || 'skin'), null, id + 'el' + n)];
      if (ar.sleeve) { const sl = ar.sleeve, e2 = mix(sh, el, sl.len); up.push(cap(sh, e2, P.rUpArm[0] * sl.puff, P.rUpArm[0] * (sl.end || 1.25), C(sl.col))); if (sl.cuff) up.push(cap(e2, madd(e2, norm(sub(el, sh)), 0.02 * k), P.rUpArm[0] * (sl.cuffR || 1.18), P.rUpArm[0] * (sl.cuffR || 1.18), C(sl.cuff))); }
      G(up[0].d + 0.012, up);
      const fo = cap(el, wr, P.rForeArm[0], P.rForeArm[1], C(ar.lower || 'skin'), id + 'el' + n, id + 'wr' + n);
      G(fo.d + 0.014, [fo]);
      this.drawHand(cam, groups, n, [0, 0], null);
    }

    /* ---- head ---- */
    this.drawHead(cam, groups, G, circ, cap, pr, C);

    /* ---- braids ---- */
    if (this.braids) this.braids.forEach((br, bi) => {
      const b = sk.hair.braids[bi], S = [], nn = br.n.length;
      for (let i = 0; i < nn; i++) { const r = lerp(b.r, b.r * 0.72, i / (nn - 1)) * k; S.push(circ(br.n[i], r, C('hair'))); }
      const endD = norm(sub(br.n[nn - 1], br.n[nn - 2]));
      S.push(cap(br.n[nn - 1], madd(br.n[nn - 1], endD, 0.055 * k), b.r * 0.6 * k, 0.006 * k, C('hair')));
      const rb = br.n[nn - 1];
      S.push(circ(madd(rb, cam.X, -0.024 * k), 0.017 * k, C('ribbon')), circ(madd(rb, cam.X, 0.024 * k), 0.017 * k, C('ribbon')), circ(rb, 0.012 * k, C('ribbonDark')));
      const tw = br.n.map(pr);
      S.push({ t: 'fn', fn(ctx) { ctx.strokeStyle = C('hairDark'); ctx.lineWidth = 0.007 * k * tw[0][3]; for (let i = 0; i < nn - 1; i++) { const q = tw[i], r = b.r * k * q[3] * 0.62; ctx.beginPath(); ctx.moveTo(q[0] - r, q[1] - r * 0.25); ctx.quadraticCurveTo(q[0], q[1] + r * 0.75, q[0] + r, q[1] - r * 0.25); ctx.stroke(); } } });
      G(pr(br.n[Math.floor(nn / 2)])[2] + 0.01, S);
    });
  }

  // one hand: palm (a swollen quad), four two-bone fingers and a thumb, all taken from the 3D hand frame.
  // shift moves the finished hand on screen (used by cut-out skins whose drawn shoulders differ from the skeleton's).
  drawHand(cam, groups, n, shift, dFix) {
    const J = this.J, P = this.P, k = this.k, self = this, sk = this.skin, id = this.id, wr = J['wrist' + n], H = J['hand' + n];
    const C = (key) => sk.col[key] || key;
    const pr = (p) => { const q = cam.project(p); q[0] += shift[0]; q[1] += shift[1]; return q; };
    const cap = (a3, b3, ra, rb, f, ja, jb) => { const a = pr(a3), b = pr(b3); return { t: 'cap', x1: a[0], y1: a[1], r1: ra * a[3], x2: b[0], y2: b[1], r2: rb * b[3], f, ow: self.ow((a[3] + b[3]) / 2), ja, jb, d: (a[2] + b[2]) / 2 }; };
    const G = (d, shapes) => { const g = { d, shapes, alpha: self.alpha < 1 ? self.alpha : null }; groups.push(g); return g; };
      // hand: palm (a swollen quad) + two-bone fingers + thumb
      const hs = k * P.handScale, fw = H.fw, pn = H.pn, sd = H.side, sc = C('skin');
      const at = (f, s2, n2) => add(wr, add(mul(fw, f * hs), add(mul(sd, s2 * hs), mul(pn, n2 * hs))));
      const qs = [at(0, -0.013, 0), at(0, 0.013, 0), at(0.046, 0.021, 0), at(0.046, -0.021, 0)].map(pr), hd = dFix != null ? dFix : pr(at(0.04, 0, 0))[2] + 0.016;
      const palmKey = id + 'palm' + n, fg = [];
      G(hd, [{ t: 'poly', pts: qs.map((q) => [q[0], q[1]]), r: 0.0125 * hs * qs[0][3], f: sc, ow: self.ow(qs[0][3]), ja: id + 'wr' + n, jb: palmKey }]);
      const fl = [[0.027, 0.023], [0.03, 0.025], [0.027, 0.023], [0.021, 0.018]];
      for (let i = 0; i < 4; i++) {
        const c = clamp(H.fing[i + 1], 0, 1), off = (1.5 - i) * 0.0135, spr = (1.5 - i) * (0.06 + H.spread * 0.2);
        const base = at(0.05, off, 0), d0 = norm(add(mul(fw, Math.cos(spr)), mul(sd, Math.sin(spr))));
        const a1 = c * 80 * D2R, a2 = c * 175 * D2R;
        const d1 = add(mul(d0, Math.cos(a1)), mul(pn, Math.sin(a1))), d2 = add(mul(d0, Math.cos(a2)), mul(pn, Math.sin(a2)));
        const m = madd(base, d1, fl[i][0] * hs), tip = madd(m, d2, fl[i][1] * hs);
        const c1 = cap(base, m, 0.0083 * hs, 0.0078 * hs, sc, palmKey), c2 = cap(m, tip, 0.0078 * hs, 0.0068 * hs, sc);
        fg.push(c1, c2);
      }
      const tc = H.fing[0], tb = at(0.012, 0.02, 0.002);
      let t1, t2;
      if (tc <= 0) { t1 = norm(add(mul(sd, 1), mul(fw, 0.7 * (1 + 2 * tc)))); t2 = t1; }
      else { t1 = norm(add(mul(sd, lerp(0.78, 0.25, tc)), add(mul(fw, lerp(0.7, 0.6, tc)), mul(pn, lerp(0.05, 0.7, tc))))); t2 = norm(add(mul(sd, lerp(0.78, -0.55, tc)), add(mul(fw, lerp(0.7, 0.45, tc)), mul(pn, lerp(0.05, 0.6, tc))))); }
      const tm = madd(tb, t1, 0.026 * hs), tt = madd(tm, t2, 0.021 * hs);
      fg.push(cap(tb, tm, 0.0105 * hs, 0.0095 * hs, sc, palmKey), cap(tm, tt, 0.0095 * hs, 0.0082 * hs, sc));
      // fingers curled into the palm sit on the palm side of the hand
      const curl = (H.fing[1] + H.fing[2] + H.fing[3] + H.fing[4]) / 4;
      G(hd + (dot(pn, cam.Z) > 0 || curl < 0.5 ? 0.002 : -0.002), fg);
      }

  drawHead(cam, groups, G, circ, cap, pr, C) {
    const J = this.J, P = this.P, sk = this.skin, k = this.k, self = this, R = P.headR, Cc = J.head, Hf = J.headF, f = this.pose.face, fc = sk.face;
    const hl = (l, u, fw) => add(Cc, lcomb(Hf, l * R, u * R, fw * R));
    const pc = pr(Cc), s = pc[3], ow = this.ow(s), headD = pc[2] + 0.02;
    // hair volume blobs, split into those behind the skull and those in front of the face
    const back = [], front = [], streaks = [];
    for (const b of sk.hair.blobs || []) {
      const w = b.w == null ? 1 : b.w, p3 = madd(hl(b.p[0], b.p[1], b.p[2]), this.hairOff, w);
      const tip = b.to ? madd(hl(b.to[0], b.to[1], b.to[2]), this.hairOff, w * 1.7) : null, hc = C(b.c || 'hair');
      let list;
      if (b.via) {
        const via = madd(hl(b.via[0], b.via[1], b.via[2]), this.hairOff, w * 1.3), bz = (t) => add(mul(p3, (1 - t) * (1 - t)), add(mul(via, 2 * t * (1 - t)), mul(tip, t * t))), rr = (t) => lerp(b.r, b.r2 || 0.02, Math.pow(t, 1.4)) * R;
        list = []; for (let i = 0; i < 4; i++) list.push(cap(bz(i / 4), bz((i + 1) / 4), rr(i / 4), rr((i + 1) / 4), hc));
      } else list = [b.to ? cap(p3, tip, b.r * R, (b.r2 || 0.02) * R, hc) : circ(p3, b.r * R, hc)];
      const dd = list.reduce((a, x) => a + x.d, 0) / list.length, isFront = !(dd - pc[2] < (b.front ? -0.25 : 0.12) * R);
      for (const x of list) (isFront ? front : back).push(x);
      if (b.hi && isFront && b.to) { const m0 = b.via ? hl(b.via[0], b.via[1], b.via[2]) : mix(p3, tip, 0.5), a = pr(mix(p3, m0, 0.35)), m = pr(mix(m0, tip, 0.15)), e = pr(mix(m0, tip, 0.6)); streaks.push([a, m, e, b.r * R * a[3] * 0.3]); }
    }
    if (back.length) G(headD - 0.05, back);
    // skull: cranium + jaw + nose as one skin silhouette
    const skull = [circ(Cc, R, C('skin')), circ(hl(0, -0.36, 0.1), R * 0.78, C('skin')), circ(hl(0, -0.2, 0.97), R * 0.1, C('skin'))];
    const capUp = sk.hair.capUp == null ? 0.07 : sk.hair.capUp, Ch = hl(0, capUp, -0.04), Rh = R * (sk.hair.capR || 1.07);
    const hn = (az, el) => { const ce = Math.cos(el); return lcomb(Hf, Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce); };
    const strips = [];
    for (let az = -180; az < 180; az += 15) {
      const ns = [], h1 = sk.hair.line(az), h2 = sk.hair.line(az + 15);
      for (let i = 0; i <= 5; i++) ns.push(hn(az * D2R, lerp(h1, 89, i / 5) * D2R));
      for (let i = 5; i >= 0; i--) ns.push(hn((az + 15) * D2R, lerp(h2, 89, i / 5) * D2R));
      const out = [];
      for (let i = 0; i < ns.length; i++) { const a = ns[i], b = ns[(i + 1) % ns.length], va = dot(a, cam.Z), vb = dot(b, cam.Z); if (va >= 0) out.push(a); if ((va >= 0) !== (vb >= 0)) out.push(norm(mix(a, b, va / (va - vb)))); }
      if (out.length > 2) strips.push(out.map((n) => { const q = pr(madd(Ch, n, Rh)); return [q[0], q[1]]; }));
    }
    const fp = (az, el) => { const ce = Math.cos(el), n = lcomb(Hf, Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce); const q = pr(madd(Cc, n, R)); return [q[0], q[1], dot(n, cam.Z)]; };
    const skullC = skull.slice(0, 2);
    skull.push({ t: 'fn', fn(ctx) {
      const ink = C('ink');
      const trace = (pts) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); };
      ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = ow * 2; for (const st of strips) { trace(st); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = C('hair'); ctx.strokeStyle = C('hair'); ctx.lineWidth = 1.3; for (const st of strips) { trace(st); ctx.fill(); ctx.stroke(); }
      // ears (only the near ones; the far ear is behind the head)
      for (const sd of [1, -1]) { const e3 = hl(sd * 0.98, -0.12, -0.02), q = pr(e3); if (q[2] < pc[2] - 0.3 * R) continue; const r = 0.19 * R * q[3]; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, TAU); ctx.lineWidth = ow * 2; ctx.strokeStyle = ink; ctx.stroke(); ctx.fillStyle = C('skin'); ctx.fill(); ctx.beginPath(); ctx.arc(q[0], q[1], r * 0.5, 0, TAU); ctx.fillStyle = C('skinShade'); ctx.fill(); }
      // ---- face ----
      ctx.save(); ctx.beginPath(); for (const c of skullC) { ctx.moveTo(c.x + c.r, c.y); ctx.arc(c.x, c.y, c.r, 0, TAU); } ctx.clip();
      const poly = (pts, fill, stroke, w) => { const v = pts.filter((q) => q[2] > 0.02); if (v.length < 3) return; ctx.beginPath(); v.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); } };
      const line = (pts, stroke, w) => { ctx.beginPath(); let pen = false; for (const q of pts) { if (q[2] <= 0.04) { pen = false; continue; } if (pen) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); pen = true; } ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); };
      const eyeAz = fc.eyeAz * D2R, eyeEl = fc.eyeEl * D2R, ra = fc.eyeW, rb = fc.eyeH;
      // cheeks and freckles
      for (const sd of [1, -1]) {
        const pts = []; for (let i = 0; i < 14; i++) { const t = i / 14 * TAU; pts.push(fp(sd * 41 * D2R + Math.cos(t) * 0.2, -25 * D2R + Math.sin(t) * 0.15)); }
        { const cq = fp(sd * 41 * D2R, -25 * D2R), gr = ctx.createRadialGradient(cq[0], cq[1], 0, cq[0], cq[1], 0.2 * R * s); gr.addColorStop(0, C('cheek')); gr.addColorStop(1, C('cheek0')); ctx.globalAlpha = Math.min(1, 0.75 * f.blush + 0.25); poly(pts, gr); ctx.globalAlpha = 1; }
        if (fc.freckles) for (const [a, e] of [[30, -19], [36, -16], [42, -20], [33, -24], [40, -25]]) { const q = fp(sd * a * D2R, e * D2R); if (q[2] > 0.15) { ctx.beginPath(); ctx.arc(q[0], q[1], 0.013 * R * s, 0, TAU); ctx.fillStyle = C('skinShade'); ctx.fill(); } }
      }
      // nose mark (fades out towards profile, where the bump takes over)
      { const pts = [fp(-0.045, -16.5 * D2R), fp(0, -19.5 * D2R), fp(0.045, -16.5 * D2R)]; const vis = Math.min(pts[0][2], pts[2][2]); if (vis > 0.55) { ctx.globalAlpha = clamp((vis - 0.55) * 5, 0, 1); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); ctx.strokeStyle = C('skinShade'); ctx.lineWidth = 0.028 * R * s; ctx.stroke(); ctx.globalAlpha = 1; } }
      // eyes and brows
      for (const sd of [1, -1]) {
        const az0 = sd * eyeAz + f.gx * 0.07, el0 = eyeEl + f.gy * 0.06, open = clamp(sd > 0 ? f.eyeL : f.eyeR, 0, 1.25), cen = fp(az0, el0);
        if (cen[2] > 0.1) {
          if (open < 0.2 || f.happy > 0.5) { const cv = f.happy > 0.5 ? 1 : -0.55, pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8 * 2 - 1; pts.push(fp(az0 + t * ra * 1.05, el0 + cv * (1 - t * t) * rb * 0.55 - (cv > 0 ? rb * 0.2 : 0))); } line(pts, C('eye'), 0.034 * R * s); }
          else {
            const pts = []; for (let i = 0; i < 18; i++) { const t = i / 18 * TAU; pts.push(fp(az0 + Math.cos(t) * ra, el0 + Math.sin(t) * rb * Math.min(1.12, open))); } poly(pts, C('eye'));
            if (fc.iris) { const ir = []; for (let i = 0; i < 14; i++) { const t = i / 14 * TAU; ir.push(fp(az0 + Math.cos(t) * ra * 0.74, el0 - rb * 0.2 * open + Math.sin(t) * rb * 0.62 * Math.min(1.1, open))); } poly(ir, C(fc.iris)); const pu = []; for (let i = 0; i < 12; i++) { const t = i / 12 * TAU; pu.push(fp(az0 + Math.cos(t) * ra * 0.45, el0 + Math.sin(t) * rb * 0.45 * Math.min(1.1, open))); } poly(pu, C('eye')); }
            line([fp(az0 + sd * ra * 0.95, el0 + rb * 0.62 * open), fp(az0 + sd * ra * 1.5, el0 + rb * 0.86 * open)], C('eye'), 0.022 * R * s);
            const lash = []; for (let i = 0; i <= 8; i++) { const t = lerp(168, 12, i / 8) * D2R; lash.push(fp(az0 + Math.cos(t) * ra * 1.12, el0 + Math.sin(t) * rb * Math.min(1.12, open) * 1.08)); } line(lash, C('eye'), 0.028 * R * s);
            if (cen[2] > 0.3) { const g1 = fp(az0 - 0.035, el0 + rb * 0.42 * open), g2 = fp(az0 + 0.04, el0 - rb * 0.4 * open); ctx.fillStyle = C('white'); ctx.beginPath(); ctx.arc(g1[0], g1[1], 0.036 * R * s * Math.min(1, open), 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(g2[0], g2[1], 0.016 * R * s, 0, TAU); ctx.fill(); }
          }
        }
        const raise = (sd > 0 ? f.browL : f.browR) * 0.085, pts = [];
        for (let i = 0; i <= 6; i++) { const t = i / 6 * 2 - 1; pts.push(fp(az0 * 0 + sd * eyeAz + sd * t * fc.browW + sd * 0.02, eyeEl + fc.browGap + raise + 0.035 * (1 - t * t) - f.browAng * 0.07 * t)); }
        line(pts, C(fc.browCol || 'hairDark'), (fc.browT || 0.036) * R * s);
      }
      // mouth: one parametric shape for every expression and every speech sound
      {
        const mEl = fc.mouthEl * D2R, open = clamp(f.open, 0, 1), rnd = clamp(f.round, 0, 1), sm = clamp(f.smile, -1, 1), wide = clamp(f.wide, 0, 1);
        const W = fc.mouthW * (0.58 + 0.42 * wide) * (1 - 0.5 * rnd) * (1 + 0.12 * Math.max(0, sm) * (1 - rnd)), Hh = 0.3 * open * (1 + 0.15 * rnd);
        const cl = 0.07 * sm * (1 - 0.6 * rnd), N = 10, m = (a, b) => fp(a, mEl + b);
        if (m(0, 0)[2] > 0.08) {
          if (open < 0.06) { const pts = []; for (let i = 0; i <= N; i++) { const t = i / N * 2 - 1; pts.push(m(t * W, cl * t * t - (0.045 * sm + 0.012) * (1 - t * t))); } line(pts, C('mouth'), 0.034 * R * s); }
          else {
            const yU = (t) => cl * t * t + (Hh * 0.2 - 0.015 * sm) * (1 - t * t), yL = (t) => cl * t * t - Hh * 0.8 * Math.pow(1 - t * t, 0.75) - 0.02 * (1 - t * t);
            const outl = []; for (let i = 0; i <= N; i++) { const t = i / N * 2 - 1; outl.push(m(t * W, yU(t))); } for (let i = N; i >= 0; i--) { const t = i / N * 2 - 1; outl.push(m(t * W, yL(t))); }
            const vis = outl.filter((q) => q[2] > 0.02);
            if (vis.length > 3) {
              ctx.save(); ctx.beginPath(); vis.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fillStyle = C('mouth'); ctx.fill(); ctx.clip();
              const tg = []; for (let i = 0; i <= N; i++) { const t = i / N * 2 - 1; tg.push(m(t * W * 0.72, yL(0) + Hh * 0.42 * (1 - t * t) - 0.01)); } for (let i = N; i >= 0; i--) { const t = i / N * 2 - 1; tg.push(m(t * W * 0.72, yL(0) - 0.05)); } poly(tg, C('tongue'));
              if (open > 0.16 || f.teeth > 0.3) { const th = Math.min(Hh * 0.34, 0.05) + 0.02 * f.teeth, te = []; for (let i = 0; i <= N; i++) { const t = i / N * 2 - 1; te.push(m(t * W, yU(t) + 0.03)); } for (let i = N; i >= 0; i--) { const t = i / N * 2 - 1; te.push(m(t * W, yU(t) - th)); } poly(te, C('white')); }
              ctx.restore(); ctx.beginPath(); vis.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.strokeStyle = C('ink'); ctx.lineWidth = ow * 1.1; ctx.stroke();
            }
          }
        }
      }
      ctx.restore();
    } });
    G(headD, skull);
    if (streaks.length) front.push({ t: 'fn', fn(ctx) { ctx.strokeStyle = C('hairLight'); for (const [a, m, e, w] of streaks) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(m[0], m[1], e[0], e[1]); ctx.stroke(); } } });
    if (front.length) G(headD + 0.03, front);
    if (sk.hair.extras) sk.hair.extras({ self, J, cam, pr, C, G, circ, cap, hl, headD, R });
  }

  // ground shadow, drawn by the stage before everything else
  drawShadow(ctx, cam) {
    const J = this.J, k = this.k, g = [J.pel[0], this.pose.gy, J.pel[2]], q = cam.project(g), h = Math.max(0, Math.min(J.ankleL[1], J.ankleR[1]) - this.pose.gy - this.P.ankleH);
    const rx = 0.2 * k * q[3] * (1 - Math.min(0.5, h * 1.2)), ry = rx * Math.max(0.16, Math.sin(cam.pitch) * 1.25);
    ctx.save(); ctx.globalAlpha = 0.16 * this.alpha * (1 - Math.min(0.6, h * 1.5)); ctx.fillStyle = '#0b2a28'; ctx.beginPath(); ctx.ellipse(q[0], q[1], rx, ry, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
}
