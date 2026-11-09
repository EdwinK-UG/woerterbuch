/* Deutschklinik film park: the approved "Close Graphic Novel" park (close-novel), copied for production from
   Claude-Animation-Design-Comparison-Opus/src (engine.js, render.js, designs.js; the four other study directions removed).
   Pure functions of time: pose(t) and the camera follow a fixed route, so seek and replay give the same picture.
   Loaded only when a film scene uses the park. GRAM_PARK.draw(canvas, route, t, opts) paints one frame. */
/* Park motion engine: routes, speed profile, footstep plan, 3D rig, cameras and projection.
   Pure functions of (route, proportions, time); everything is precomputed once per route so scrubbing is deterministic.
   World units are metres. x = right, y = up, z = away from the default street-side camera.
   The park interior is z > 0 (front boundary on z = 0, entrance gap x in [-1.2, 1.2]). */
(function (root) {
  'use strict';
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const sstep5 = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const wrapPi = (a) => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
  const lerpAngle = (a, b, t) => a + wrapPi(b - a) * t;
  const V = (x, y, z) => ({ x, y, z });
  const add = (a, b) => V(a.x + b.x, a.y + b.y, a.z + b.z);
  const sub = (a, b) => V(a.x - b.x, a.y - b.y, a.z - b.z);
  const mul = (a, s) => V(a.x * s, a.y * s, a.z * s);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const len = (a) => Math.sqrt(dot(a, a));
  const norm = (a) => { const l = len(a) || 1; return V(a.x / l, a.y / l, a.z / l); };
  const madd = (a, b, s) => V(a.x + b.x * s, a.y + b.y * s, a.z + b.z * s);
  const UP = V(0, 1, 0);
  // rotate vector v about unit axis k by angle a (Rodrigues)
  const rot = (v, k, a) => { const c = Math.cos(a), s = Math.sin(a), d = dot(k, v), x = cross(k, v); return V(v.x * c + x.x * s + k.x * d * (1 - c), v.y * c + x.y * s + k.y * d * (1 - c), v.z * c + x.z * s + k.z * d * (1 - c)); };
  const fwdOf = (yaw) => V(Math.cos(yaw), 0, Math.sin(yaw));
  const leftOf = (yaw) => V(-Math.sin(yaw), 0, Math.cos(yaw)); // runner's own left for heading yaw

  /* ---------- shared timing of the preview cycle (identical for every design) ---------- */
  const CYCLE = 8.0;      // seconds per preview loop
  const RUN_START = 0.7;  // ready pose, slight anticipation before the first push-off
  const GAIT = { vTop: 3.0, aAcc: 2.6, aDec: 2.5, aLat: 2.4, cad0: 1.75, cadK: 0.35 };

  /* ---------- routes (same geometry for all five designs) ---------- */
  const ROUTE_DEFS = {
    // Dativ: starts inside, runs a U-shaped lap round the pond, stops inside. Never comes near the boundary.
    within: [
      { line: [-3.2, 6.4, 1.2, 6.4] },
      { arc: { cx: 1.2, cz: 9.0, r: 2.6, a0: -PI / 2, a1: PI / 2 } },
      { line: [1.2, 11.6, -1.6, 11.6] },
    ],
    // Akkusativ: starts on the pavement outside, turns left through the entrance gap, stops inside.
    into: [
      { line: [-10.0, -2.0, -2.4, -2.0] },
      { arc: { cx: -2.4, cz: 0.4, r: 2.4, a0: -PI / 2, a1: 0 } },
      { line: [0.0, 0.4, 0.0, 4.6] },
    ],
  };
  const PARK = { x0: -13, x1: 13, z0: 0, z1: 18, gate: [-1.2, 1.2] };

  function samplePath(defs, ds) {
    const P = [];
    for (const d of defs) {
      if (d.line) {
        const [x0, z0, x1, z1] = d.line, L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / ds));
        for (let i = P.length ? 1 : 0; i <= n; i++) { const t = i / n; P.push({ x: lerp(x0, x1, t), z: lerp(z0, z1, t), k: 0 }); }
      } else {
        const { cx, cz, r, a0, a1 } = d.arc, L = Math.abs(a1 - a0) * r, n = Math.max(1, Math.ceil(L / ds)), sg = a1 > a0 ? 1 : -1;
        for (let i = P.length ? 1 : 0; i <= n; i++) { const a = lerp(a0, a1, i / n); P.push({ x: cx + r * Math.cos(a), z: cz + r * Math.sin(a), k: sg / r }); } // k > 0: left turn
      }
    }
    let s = 0; P[0].s = 0;
    for (let i = 1; i < P.length; i++) { s += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z); P[i].s = s; }
    for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; P[i].yaw = Math.atan2(b.z - a.z, b.x - a.x); }
    for (let i = 1; i < P.length; i++) P[i].yaw = P[i - 1].yaw + wrapPi(P[i].yaw - P[i - 1].yaw); // unwrap
    return P;
  }

  function buildRoute(name) {
    const P = samplePath(ROUTE_DEFS[name], 0.02), N = P.length, S = P[N - 1].s;
    // curvature-limited speed with acceleration limits, then lightly smoothed
    const vmax = P.map((p) => Math.min(GAIT.vTop, Math.abs(p.k) > 1e-6 ? Math.sqrt(GAIT.aLat / Math.abs(p.k)) : GAIT.vTop));
    // spread curvature limits slightly so the runner slows before the bend (anticipation)
    const vm2 = vmax.slice(); const W = 40;
    for (let i = 0; i < N; i++) for (let j = Math.max(0, i - W); j <= Math.min(N - 1, i + W); j++) vm2[i] = Math.min(vm2[i], vmax[j] + 0.006 * Math.abs(i - j));
    const v = new Array(N); v[0] = 0;
    for (let i = 1; i < N; i++) { const ds = P[i].s - P[i - 1].s; v[i] = Math.min(vm2[i], Math.sqrt(v[i - 1] * v[i - 1] + 2 * GAIT.aAcc * ds)); }
    v[N - 1] = 0;
    for (let i = N - 2; i >= 0; i--) { const ds = P[i + 1].s - P[i].s; v[i] = Math.min(v[i], Math.sqrt(v[i + 1] * v[i + 1] + 2 * GAIT.aDec * ds)); }
    // smooth (keeps endpoints at zero)
    const vs = v.slice(); const K = 15;
    for (let i = 1; i < N - 1; i++) { let a = 0, c = 0; for (let j = -K; j <= K; j++) { const q = clamp(i + j, 0, N - 1); a += v[q]; c++; } vs[i] = Math.min(v[i] + 0.05, a / c); }
    vs[0] = 0; vs[N - 1] = 0;
    // time stamps
    const T = new Array(N); T[0] = 0;
    for (let i = 1; i < N; i++) { const ds = P[i].s - P[i - 1].s, vm = Math.max(0.05, (vs[i] + vs[i - 1]) / 2); T[i] = T[i - 1] + ds / vm; }
    const route = { name, P, v: vs, T, S, duration: T[N - 1] };
    route.at = (s) => pathAt(route, s);
    route.sOfT = (t) => sOfT(route, t);
    return route;
  }
  function idxOfS(route, s) {
    const P = route.P; s = clamp(s, 0, route.S);
    let lo = 0, hi = P.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].s <= s) lo = m; else hi = m; }
    const f = P[hi].s > P[lo].s ? (s - P[lo].s) / (P[hi].s - P[lo].s) : 0; return [lo, hi, f];
  }
  function pathAt(route, s) {
    const P = route.P;
    if (s > route.S) { const e = P[P.length - 1], f = fwdOf(e.yaw), d = s - route.S; return { x: e.x + f.x * d, z: e.z + f.z * d, yaw: e.yaw, k: 0 }; }
    if (s < 0) { const e = P[0], f = fwdOf(e.yaw); return { x: e.x + f.x * s, z: e.z + f.z * s, yaw: e.yaw, k: 0 }; }
    const [a, b, f] = idxOfS(route, s);
    return { x: lerp(P[a].x, P[b].x, f), z: lerp(P[a].z, P[b].z, f), yaw: lerp(P[a].yaw, P[b].yaw, f), k: lerp(P[a].k, P[b].k, f) };
  }
  // run-local time -> arc length and speed
  function sOfT(route, t) {
    const T = route.T, P = route.P;
    if (t <= 0) return { s: 0, v: 0 }; if (t >= route.duration) return { s: route.S, v: 0 };
    let lo = 0, hi = T.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= t) lo = m; else hi = m; }
    const f = (t - T[lo]) / (T[hi] - T[lo]); return { s: lerp(P[lo].s, P[hi].s, f), v: lerp(route.v[lo], route.v[hi], f) };
  }

  /* ---------- proportions (metres). Designs override these. ---------- */
  const BASE_BODY = {
    thigh: 0.44, shin: 0.43, ankleH: 0.075, footBack: 0.13, footFront: 0.07, ankleBack: 0.12, hipHalf: 0.09,
    pelvisH: 0.08, spine: 0.44, shoulderHalf: 0.17, upperArm: 0.28, forearm: 0.25, hand: 0.16, neck: 0.06,
    headR: 0.105, headSY: 1.12, armFwdMax: 0.55, armBackMax: 0.62, flexRun: 1.42, stepWidth: 0.085,
  };

  /* ---------- footstep plan ---------- */
  function cadence(v) { return GAIT.cad0 + GAIT.cadK * v; }
  function duty(v) { return lerp(1.15, 0.70, clamp(v / 2.6, 0, 1)); } // stance length in step periods
  function buildMotion(routeName, bodyOverrides) {
    const B = Object.assign({}, BASE_BODY, bodyOverrides || {});
    const route = buildRoute(routeName), runEnd = RUN_START + route.duration;
    const motion = { route, B, runEnd, cycle: CYCLE, runStart: RUN_START };
    const sv = (t) => route.sOfT(t - RUN_START);
    const plantAt = (s, foot) => { // ball of the foot, on the ground, beside the path
      const p = route.at(s), f = fwdOf(p.yaw), l = leftOf(p.yaw), side = foot === 0 ? 1 : -1;
      return { x: p.x + f.x * 0.10 + l.x * side * B.stepWidth, z: p.z + f.z * 0.10 + l.z * side * B.stepWidth, yaw: p.yaw };
    };
    // plants[foot] = [{tc, tl, ball, yaw}], initial plants start at -Infinity
    const plants = [[{ tc: -1e9, tl: null, ...plantAt(0, 0) }], [{ tc: -1e9, tl: null, ...plantAt(0, 1) }]];
    const steps = [];
    let foot = 1, tc = RUN_START + 0.30, guard = 0;
    while (guard++ < 200) {
      const vk = Math.max(0.6, sv(tc).v), c = cadence(vk), sigma = duty(vk) / c;
      const sMid = sv(tc + sigma * 0.4).s; // the foot lands a little ahead of the pelvis
      const final = sMid > route.S - 0.42 || tc > runEnd - 0.06;
      const s = final ? route.S : sMid, pl = plantAt(s, foot);
      steps.push({ foot, tc, sigma, v: vk });
      plants[foot].push({ tc, tl: null, sigma, ...pl });
      if (final) { // bring the other foot alongside and stop
        const other = 1 - foot, t2 = Math.max(tc + 0.30, runEnd + 0.05);
        steps.push({ foot: other, tc: t2, sigma: 1e9, v: 0, closing: true });
        plants[other].push({ tc: t2, tl: null, sigma: 1e9, ...plantAt(route.S, other) });
        break;
      }
      tc += 1 / c; foot = 1 - foot;
    }
    // lift-off times
    for (const seq of plants) {
      for (let i = 0; i < seq.length - 1; i++) {
        const cur = seq[i], nxt = seq[i + 1], vN = Math.max(0.6, sv(nxt.tc).v), swing = clamp((2 - duty(vN)) / cadence(vN), 0.26, 0.5);
        const natural = cur.tc > -1e8 ? cur.tc + cur.sigma : -1e9;
        cur.tl = Math.max(natural, nxt.tc - swing);
        if (cur.tc < -1e8) cur.tl = Math.max(RUN_START + (seq === plants[1] ? 0 : 0.16), nxt.tc - swing);
        cur.tl = Math.min(cur.tl, nxt.tc - 0.2);
      }
      seq[seq.length - 1].tl = 1e9;
    }
    motion.plants = plants; motion.steps = steps;
    // precompute filtered orientation tracks at 240 Hz (deterministic, scrub-safe)
    const H = 1 / 240, n = Math.ceil(CYCLE / H) + 2, yawB = new Float64Array(n), yawH = new Float64Array(n);
    let yb = route.at(0.3).yaw, yh = route.at(0.9).yaw, vb = 0, vh = 0;
    const wB = 11, wH = 8;
    for (let i = 0; i < n; i++) {
      const t = i * H, q = sv(t), tb = route.at(q.s + 0.35 + 0.12 * q.v).yaw, th = route.at(q.s + 0.9 + 0.35 * q.v).yaw;
      if (i === 0) { yb = tb; yh = th; }
      const tbU = yb + wrapPi(tb - yb), thU = yh + wrapPi(th - yh);
      vb += (wB * wB * (tbU - yb) - 2 * wB * vb) * H; yb += vb * H;
      vh += (wH * wH * (thU - yh) - 2 * wH * vh) * H; yh += vh * H;
      yawB[i] = yb; yawH[i] = yh;
    }
    motion.yawTrack = { H, yawB, yawH };
    for (const seq of plants) for (const pl of seq) pl.ball = { x: pl.x, z: pl.z };
    const raw = new Float64Array(n); for (let i = 0; i < n; i++) raw[i] = rawPelvisY(motion, i * H);
    const pelY = new Float64Array(n), R = 7, sg = 3.5; // ~15 ms gaussian
    for (let i = 0; i < n; i++) { let a = 0, w = 0; for (let j = -R; j <= R; j++) { const q = clamp(i + j, 0, n - 1), k = Math.exp(-(j * j) / (2 * sg * sg)); a += raw[q] * k; w += k; } pelY[i] = a / w; }
    motion.pelY = pelY;
    return motion;
  }
  function track(arr, H, t) { const x = clamp(t / H, 0, arr.length - 1.001), i = Math.floor(x), f = x - i; return lerp(arr[i], arr[i + 1], f); }

  /* ---------- foot state ---------- */
  const HEEL_RAISE = 0.62; // radians at toe-off
  function footGeom(B, ball, yaw, alpha) {
    // alpha > 0: heel raised, rotating about the ball (which stays put); alpha < 0: toes up (only in the air)
    const g = fwdOf(yaw), ca = Math.cos(alpha), sa = Math.sin(alpha);
    const R = (bx, uy) => { // point at (bx forward from ball, uy up) in foot frame, rotated by alpha about the ball
      const fx = bx * ca + uy * sa, fy = -bx * sa + uy * ca; return V(ball.x + g.x * fx, ball.y + fy, ball.z + g.z * fx);
    };
    // toes bend at the ball: they stay level while the heel is raised, and lift with the foot only when alpha < 0
    const ta = alpha > 0 ? 0 : alpha, toe = V(ball.x + g.x * B.footFront * Math.cos(ta), ball.y + B.footFront * Math.sin(-ta), ball.z + g.z * B.footFront * Math.cos(ta));
    return { ball: V(ball.x, ball.y, ball.z), heel: R(-B.footBack - 0.06, 0), toe, ankle: R(-B.ankleBack, B.ankleH), yaw, alpha };
  }
  function footState(M, foot, t) {
    const seq = M.plants[foot], B = M.B;
    let i = 0; while (i < seq.length - 1 && seq[i + 1].tc <= t) i++;
    const cur = seq[i];
    if (t <= cur.tl) { // stance (contact point fixed)
      const span = Math.min(cur.tl - Math.max(cur.tc, cur.tl - 0.6), 0.6), raise = cur.tl > 1e8 ? 0 : sstep(1 - (cur.tl - t) / Math.max(0.12, span * 0.48));
      const a = HEEL_RAISE * Math.pow(raise, 1.3);
      return Object.assign(footGeom(B, V(cur.ball.x ?? cur.x, 0, cur.ball.z ?? cur.z), cur.yaw, a), { stance: true, plant: i, u: raise });
    }
    const nxt = seq[i + 1];
    const u = clamp((t - cur.tl) / (nxt.tc - cur.tl), 0, 1);
    const g0 = footGeom(B, V(cur.x, 0, cur.z), cur.yaw, HEEL_RAISE), g1 = footGeom(B, V(nxt.x, 0, nxt.z), nxt.yaw, 0);
    const vN = Math.max(0, M.route.sOfT(nxt.tc - RUN_START).v), dist = Math.hypot(nxt.x - cur.x, nxt.z - cur.z);
    const e = sstep5(u), lift = (0.05 + 0.15 * clamp(vN / 2.6, 0, 1)) * clamp(dist / 0.5, 0.25, 1);
    const yaw = lerpAngle(cur.yaw, nxt.yaw, sstep(u)), alpha = lerp(HEEL_RAISE, 0, sstep(u)) - 0.22 * Math.sin(PI * u) * u;
    const ank = V(lerp(g0.ankle.x, g1.ankle.x, e), lerp(g0.ankle.y, g1.ankle.y, e) + lift * Math.pow(Math.sin(PI * Math.pow(u, 0.8)), 1.1), lerp(g0.ankle.z, g1.ankle.z, e));
    // place the foot from the ankle
    const g = fwdOf(yaw), ca = Math.cos(alpha), sa = Math.sin(alpha);
    const R = (bx, uy) => { const fx = bx * ca + uy * sa, fy = -bx * sa + uy * ca; return { fx, fy }; };
    const a0 = R(-B.ankleBack, B.ankleH), ball = V(ank.x - g.x * a0.fx, ank.y - a0.fy, ank.z - g.z * a0.fx);
    return Object.assign(footGeom(B, ball, yaw, alpha), { stance: false, plant: i, u });
  }
  // fix plant x/z shorthand
  function normPlants(M) { for (const seq of M.plants) for (const p of seq) p.ball = { x: p.x, z: p.z }; }

  /* ---------- two-bone IK ---------- */
  function ik2(A, C, l1, l2, hint) {
    let d = sub(C, A), L = len(d); const maxL = (l1 + l2) * 0.9995, minL = Math.abs(l1 - l2) + 1e-3;
    const reach = L; let Cc = C;
    if (L > maxL) { Cc = madd(A, d, maxL / L); L = maxL; } else if (L < minL) { Cc = madd(A, d, minL / L); L = minL; }
    const dn = norm(sub(Cc, A)), ca = clamp((l1 * l1 + L * L - l2 * l2) / (2 * l1 * L), -1, 1), a = Math.acos(ca);
    let pole = sub(hint, mul(dn, dot(hint, dn))); if (len(pole) < 1e-6) pole = V(0, 1, 0); pole = norm(pole);
    const mid = add(A, add(mul(dn, l1 * Math.cos(a)), mul(pole, l1 * Math.sin(a))));
    return { mid, end: Cc, stretched: reach > maxL + 1e-6, reach };
  }

  function gaitPhase(M, t) {
    let last = null; for (const s of M.steps) if (s.tc <= t) last = s; else break;
    if (!last || last.closing || t > M.runEnd + 0.1) return null;
    const per = 1 / cadence(last.v); return { last, per, u: (t - last.tc) / per, hmid: last.sigma / (2 * per) };
  }
  // un-smoothed pelvis height: gait bob limited by the reach of planted, lifting and landing legs
  const f0 = (f) => f.stance; // planted legs may extend a little further than lifting/landing legs
  function rawPelvisY(M, t) {
    const B = M.B, route = M.route, q = route.sOfT(t - RUN_START), p = route.at(q.s), rho = sstep(q.v / 1.4);
    const yawB = track(M.yawTrack.yawB, M.yawTrack.H, t), fB = fwdOf(yawB);
    const feet = [footState(M, 0, t), footState(M, 1, t)];
    const dF = feet.map((f) => (f.ankle.x - p.x) * fB.x + (f.ankle.z - p.z) * fB.z);
    const pre = sstep((t - (RUN_START - 0.42)) / 0.32) * (1 - sstep((t - RUN_START) / 0.3));
    const post = t > M.runEnd ? Math.exp(-(t - M.runEnd) * 3.2) * Math.sin(clamp((t - M.runEnd) / 0.45, 0, 1) * PI) : 0;
    const legL = B.thigh + B.shin, stand = legL * 0.985 + B.ankleH;
    const base = stand - 0.045 * rho - 0.03 * pre - 0.035 * post, amp = 0.03 * rho, gp = gaitPhase(M, t);
    let h = gp ? base - amp * Math.cos(TAU * (gp.u - gp.hmid)) : base;
    const torsion = clamp((dF[0] - dF[1]) * 0.25, -0.12, 0.12) * rho, lP = leftOf(yawB - torsion);
    let hmax = 1e9;
    for (let i = 0; i < 2; i++) {
      const hp = madd(V(p.x, h, p.z), lP, (i === 0 ? 1 : -1) * B.hipHalf), a = feet[i].ankle, d2 = (hp.x - a.x) ** 2 + (hp.z - a.z) ** 2, L = legL * (f0(feet[i]) ? 0.968 : 0.955);
      const lim = a.y + Math.sqrt(Math.max(0.01, L * L - d2)), f = feet[i];
      const w = f.stance ? 1 : clamp(1 - sstep(f.u / 0.35) + sstep((f.u - 0.45) / 0.4), 0, 1);
      hmax = Math.min(hmax, lim + (1 - w) * 0.35);
    }
    const k = 0.01; return -k * Math.log(Math.exp(-h / k) + Math.exp(-hmax / k));
  }

  /* ---------- full pose at time t ---------- */
  function pose(M, tIn) {
    const t = clamp(tIn, 0, CYCLE), B = M.B, route = M.route;
    const q = route.sOfT(t - RUN_START), p = route.at(q.s);
    const vNow = q.v, rho = sstep(vNow / 1.4);
    const yawB = track(M.yawTrack.yawB, M.yawTrack.H, t), yawHraw = track(M.yawTrack.yawH, M.yawTrack.H, t);
    const yawH = yawB + clamp(wrapPi(yawHraw - yawB), -0.65, 0.65);
    const fB = fwdOf(yawB), lB = leftOf(yawB);
    const feet = [footState(M, 0, t), footState(M, 1, t)];
    // forward offsets of ankles relative to pelvis (drives arm swing and torsion)
    const dF = feet.map((f) => (f.ankle.x - p.x) * fB.x + (f.ankle.z - p.z) * fB.z);
    // acceleration (finite difference)
    const q2 = route.sOfT(t - RUN_START + 0.05), q0 = route.sOfT(t - RUN_START - 0.05), acc = (q2.v - q0.v) / 0.1;
    // anticipation before the start, settle after the stop
    const pre = sstep((t - (RUN_START - 0.42)) / 0.32) * (1 - sstep((t - RUN_START) / 0.3));
    const post = t > M.runEnd ? Math.exp(-(t - M.runEnd) * 3.2) * Math.sin(clamp((t - M.runEnd) / 0.45, 0, 1) * PI) : 0;
    const breathe = Math.sin(t * TAU * (t > M.runEnd ? 0.55 : 0.3)) * (t > M.runEnd ? 1 : 0.3) * sstep((t - M.runEnd) / 0.6);
    const legL = B.thigh + B.shin;
    const lean = 0.05 + 0.10 * rho + clamp(acc, -2.5, 2.5) * 0.035 + 0.09 * pre - 0.03 * post; // forward pitch (rad)
    const bank = clamp(-(vNow * vNow) * p.k / 9.81, -0.22, 0.22); // k > 0 is a left turn: lean left, toward the turn centre
    const gp = gaitPhase(M, t), sway = gp ? 0.012 * rho * Math.cos(TAU * (gp.u - gp.hmid)) * (gp.last.foot === 0 ? 1 : -1) : 0;
    const torsion = clamp((dF[0] - dF[1]) * 0.25, -0.12, 0.12) * rho;
    const yawPel = yawB - torsion; // the hip of the forward leg leads
    const lP = leftOf(yawPel);
    const hipOf = (i, P) => madd(P, lP, (i === 0 ? 1 : -1) * B.hipHalf);
    // pelvis height: smoothed precomputed track, then a hard reach guarantee for every planted foot
    let pel = V(p.x + lB.x * sway, track(M.pelY, M.yawTrack.H, t), p.z + lB.z * sway);
    {
      let hmax = 1e9;
      for (let i = 0; i < 2; i++) if (feet[i].stance) {
        const hp = hipOf(i, pel), a = feet[i].ankle, d2 = (hp.x - a.x) ** 2 + (hp.z - a.z) ** 2, L = legL * 0.995;
        hmax = Math.min(hmax, a.y + Math.sqrt(Math.max(0.01, L * L - d2)));
      }
      if (hmax < 1e8) { const k = 0.004; pel = V(pel.x, -k * Math.log(Math.exp(-pel.y / k) + Math.exp(-hmax / k)), pel.z); }
    }
    // spine frame: forward pitch, bank roll
    const spineUp = norm(rot(rot(UP, lB, -lean * 0), lB, 0));
    let up = rot(UP, lB, -lean); // tilt forward around the left axis (toward fB)
    up = norm(add(mul(up, Math.cos(bank)), mul(lB, -Math.sin(bank)) )); // bank: lean toward turn centre
    void spineUp;
    const counter = torsion * 1.4; // shoulders counter-rotate against the pelvis
    const yawSh = yawB + counter, fS = norm(sub(fwdOf(yawSh), mul(up, dot(fwdOf(yawSh), up)))), lS = norm(cross(fS, up)); // left = fwd x up? check sign below
    const leftS = dot(lS, leftOf(yawSh)) < 0 ? mul(lS, -1) : lS;
    const pelvisTop = madd(pel, up, B.pelvisH);
    const chest = madd(pelvisTop, up, B.spine * (1 + 0.012 * breathe));
    const shoulders = [madd(chest, leftS, B.shoulderHalf), madd(chest, leftS, -B.shoulderHalf)];
    const neckBase = madd(chest, up, 0.03);
    // head: mostly upright, yaw leads the body into turns
    const headPitch = -lean * 0.7 + 0.05 * post;
    const fH0 = fwdOf(yawH), lH0 = leftOf(yawH);
    const hUp = norm(add(rot(UP, lH0, -lean * 0.3), mul(lB, -Math.sin(bank * 0.5))));
    let hF = norm(sub(fH0, mul(hUp, dot(fH0, hUp)))); hF = norm(rot(hF, lH0, -headPitch * 0)); // keep gaze level
    const hL = norm(cross(hUp, hF)); // left = up x fwd (right-handed with y up, fwd)
    const headLeft = dot(hL, lH0) < 0 ? mul(hL, -1) : hL;
    const neckTop = madd(neckBase, norm(add(up, hUp)), B.neck);
    const head = madd(neckTop, hUp, B.headR * B.headSY * (B.headLift || 0.62));
    // legs
    const legs = [0, 1].map((i) => {
      const hip = hipOf(i, pel), f = feet[i];
      const kneeHint = norm(add(fwdOf(f.yaw), mul(fB, 1))), r = ik2(hip, f.ankle, B.thigh, B.shin, kneeHint);
      let foot = f;
      if (r.stretched && !f.stance) { // a foot in the air may be pulled in; a planted foot never moves
        const d = sub(r.end, f.ankle), sh = (P) => add(P, d);
        foot = Object.assign({}, f, { ball: sh(f.ball), heel: sh(f.heel), toe: sh(f.toe), ankle: sh(f.ankle), pulled: len(d) });
      }
      return { hip, knee: r.mid, ankle: r.end, stretched: r.stretched, foot, ankleTarget: f.ankle };
    });
    // arms: contralateral swing driven by the legs
    const swing = clamp((dF[1] - dF[0]) * 1.15, -1, 1); // + when right foot is forward -> left arm forward
    const arms = [0, 1].map((i) => {
      const side = i === 0 ? 1 : -1, sh = shoulders[i];
      const sw = (i === 0 ? swing : -swing);
      const theta = lerp(0.04 + 0.06 * breathe * 0, sw > 0 ? 0.08 + sw * B.armFwdMax : 0.08 + sw * B.armBackMax, rho) + 0.25 * pre;
      const flex = lerp(0.16 + 0.05 * post, B.flexRun + 0.16 * clamp(sw, -1, 1), Math.max(rho, pre * 0.7));
      const abd = lerp(0.10, 0.17, rho);
      const dir1 = norm(add(add(mul(up, -Math.cos(theta)), mul(fS, Math.sin(theta))), mul(leftS, side * Math.sin(abd))));
      const elbow = madd(sh, dir1, B.upperArm);
      const phi2 = theta + flex;
      const inward = lerp(0.04, 0.30, rho) * (0.6 + 0.4 * clamp(sw + 0.4, 0, 1));
      const dir2 = norm(add(add(mul(up, -Math.cos(phi2)), mul(fS, Math.sin(phi2))), mul(leftS, -side * inward + side * Math.sin(abd) * 0.4)));
      const wrist = madd(elbow, dir2, B.forearm);
      const phi3 = phi2 + lerp(0.05, 0.22, rho);
      const dir3 = norm(add(add(mul(up, -Math.cos(phi3)), mul(fS, Math.sin(phi3))), mul(leftS, -side * inward * 0.8)));
      const handTip = madd(wrist, dir3, B.hand);
      return { shoulder: sh, elbow, wrist, handTip, dir1, dir2, dir3, side };
    });
    return {
      t, s: q.s, v: vNow, rho, yawB, yawH, pel, up, fB, lB, fS, leftS, pelvisTop, chest, neckBase, neckTop, head, hUp, hF, hL: headLeft,
      shoulders, legs, arms, feet: legs.map((l) => l.foot), bank, lean, pre, post, breathe, acc, phaseLeft: swing,
      running: t >= RUN_START && t <= M.runEnd, finished: t > M.runEnd,
    };
  }

  /* ---------- cameras ---------- */
  function makeCamera(spec, W, H) {
    // spec: {pos, target, fov(deg) | ortho(px per m), roll}
    const c = { W, H, pos: spec.pos, target: spec.target, ortho: spec.ortho || 0 };
    const w = norm(sub(spec.target, spec.pos));
    let r = norm(cross(UP, w)); if (!isFinite(r.x)) r = V(1, 0, 0);
    // screen right must be +x when looking along +z: cross(UP, w) with w=(0,0,1) -> (1,0,0)
    const u = cross(w, r);
    c.w = w; c.r = r; c.u = u;
    c.f = spec.fov ? (H / 2) / Math.tan((spec.fov * PI / 180) / 2) : 0;
    c.cx = W / 2 + (spec.shiftX || 0) * W; c.cy = H / 2 + (spec.shiftY || 0) * H;
    c.toCam = (P) => c.ortho ? mul(w, -1) : norm(sub(c.pos, P));
    c.cam = (P) => { const d = sub(P, c.pos); return V(dot(d, r), dot(d, u), dot(d, w)); };
    c.proj = (P) => {
      const d = sub(P, c.pos), x = dot(d, r), y = dot(d, u), z = dot(d, w);
      if (c.ortho) return { x: c.cx + x * c.ortho, y: c.cy - y * c.ortho, z, s: c.ortho };
      const zz = Math.max(z, 0.02); return { x: c.cx + c.f * x / zz, y: c.cy - c.f * y / zz, z, s: c.f / zz };
    };
    c.scaleAt = (P) => c.ortho ? c.ortho : c.f / Math.max(0.05, dot(sub(P, c.pos), w));
    c.near = 0.25;
    return c;
  }
  // damped follow of the runner, precomputed per (motion, camera spec)
  function followTrack(M, opts) {
    const H = 1 / 120, n = Math.ceil(CYCLE / H) + 2, xs = new Float64Array(n), zs = new Float64Array(n);
    const w = opts.omega || 2.4; let x = null, z = null, vx = 0, vz = 0;
    for (let i = 0; i < n; i++) {
      const t = i * H, q = M.route.sOfT(t - RUN_START), p = M.route.at(q.s + (opts.lead || 0) * q.v), tx = p.x, tz = p.z;
      if (x === null) { x = tx; z = tz; }
      vx += (w * w * (tx - x) - 2 * w * vx) * H; x += vx * H; vz += (w * w * (tz - z) - 2 * w * vz) * H; z += vz * H;
      xs[i] = x; zs[i] = z;
    }
    return (t) => ({ x: track(xs, H, t), z: track(zs, H, t) });
  }

  const api = { PI, TAU, clamp, lerp, sstep, sstep5, wrapPi, lerpAngle, V, add, sub, mul, dot, cross, len, norm, madd, rot, fwdOf, leftOf, UP,
    CYCLE, RUN_START, GAIT, ROUTE_DEFS, PARK, BASE_BODY, buildRoute, buildMotion: (r, b) => { const M = buildMotion(r, b); normPlants(M); return M; },
    pose, footState, makeCamera, followTrack, ik2, track };
  root.ParkEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Canvas renderer shared by the five directions: painters (line/material treatments), world primitives,
   a 3D-aware puppet (connected limb chains, per-pixel ellipsoid head, surface-mapped face features).
   Everything is drawn in device pixels. A probe object records the exact geometry used for drawing so tests
   can check the rendered chain, the planted feet and face clearance. */
(function (root) {
  'use strict';
  const E = root.ParkEngine;
  const { V, add, sub, mul, dot, cross, norm, len, madd, clamp, lerp, sstep, PI, TAU } = E;

  /* ---------- colour helpers ---------- */
  function hex(c) { if (Array.isArray(c)) return c; const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb(a) { return `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`; }
  function shade(c, k) { const a = hex(c); return k < 0 ? rgb(a.map((x) => x * (1 + k))) : rgb(a.map((x) => x + (255 - x) * k)); }
  function mix(c1, c2, t) { const a = hex(c1), b = hex(c2); return rgb(a.map((x, i) => x + (b[i] - x) * t)); }
  function toHex(s) { if (s[0] === '#') return s; const m = s.match(/\d+/g).map(Number); return '#' + m.slice(0, 3).map((x) => x.toString(16).padStart(2, '0')).join(''); }
  // deterministic noise
  function hash(i) { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* ---------- geometry helpers ---------- */
  function capsulePath(ctx, A, B, ra, rb) {
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
    if (d < Math.abs(ra - rb) + 0.01) { const big = ra > rb ? A : B; ctx.moveTo(big.x + Math.max(ra, rb), big.y); ctx.arc(big.x, big.y, Math.max(ra, rb), 0, TAU); return; }
    const th = Math.atan2(dy, dx), ph = Math.asin(clamp((ra - rb) / d, -1, 1)), q = PI / 2 - ph;
    ctx.moveTo(A.x + ra * Math.cos(th + q), A.y + ra * Math.sin(th + q));
    ctx.arc(A.x, A.y, ra, th + q, th + TAU - q, false);
    ctx.arc(B.x, B.y, rb, th - q, th + q, false);
    ctx.closePath();
  }
  function polyPath(ctx, pts, close = true) { ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); if (close) ctx.closePath(); }
  function smoothPath(ctx, pts) { // closed Catmull-Rom-ish through midpoints
    const n = pts.length; const m = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    let s = m(pts[n - 1], pts[0]); ctx.moveTo(s.x, s.y);
    for (let i = 0; i < n; i++) { const p = pts[i], q = m(p, pts[(i + 1) % n]); ctx.quadraticCurveTo(p.x, p.y, q.x, q.y); }
    ctx.closePath();
  }
  // clip a world polygon (array of V) against the camera near plane, then project
  function projPoly(cam, pts) {
    const cs = pts.map((p) => ({ p, z: cam.cam(p).z })), out = [], nz = cam.ortho ? -1e9 : cam.near;
    for (let i = 0; i < cs.length; i++) {
      const a = cs[i], b = cs[(i + 1) % cs.length], ain = a.z >= nz, bin = b.z >= nz;
      if (ain) out.push(a.p);
      if (ain !== bin) { const t = (nz - a.z) / (b.z - a.z); out.push(V(lerp(a.p.x, b.p.x, t), lerp(a.p.y, b.p.y, t), lerp(a.p.z, b.p.z, t))); }
    }
    return out.map((p) => cam.proj(p));
  }
  function groundRect(x0, z0, x1, z1, y = 0) { return [V(x0, y, z0), V(x1, y, z0), V(x1, y, z1), V(x0, y, z1)]; }
  function groundEllipse(cx, cz, rx, rz, n = 40, y = 0, wob = 0, seed = 0) {
    const a = []; for (let i = 0; i < n; i++) { const t = i / n * TAU, w = 1 + wob * (hash(seed + i) - 0.5); a.push(V(cx + Math.cos(t) * rx * w, y, cz + Math.sin(t) * rz * w)); } return a;
  }
  function stripPoly(pts, w, y = 0) { // polyline (x,z) with width -> polygon
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
      L.push(V(pts[i][0] + nx * w / 2, y, pts[i][1] + nz * w / 2)); R.push(V(pts[i][0] - nx * w / 2, y, pts[i][1] - nz * w / 2));
    }
    return L.concat(R.reverse());
  }
  function routeStrip(route, w, s0 = 0, s1 = null, step = 0.25) {
    const pts = []; s1 = s1 == null ? route.S : s1; for (let s = s0; s <= s1 + 1e-6; s += step) { const p = route.at(s); pts.push([p.x, p.z]); } return pts;
  }

  /* ---------- painters: one per line/material treatment ---------- */
  // Each painter exposes: fill(ctx, pathFn, color, info), chain(ctx, parts, info), edge width, ground polygons, post FX.
  function makePainter(kind, opts = {}) {
    const P = { kind, ink: opts.ink || '#22202a', ow: opts.ow || 2.4, light: norm(V(-0.5, 0.85, -0.45)), seed: opts.seed || 1 };
    const pat = {};
    P.scale = 1; // device-pixel scale set per frame (dpr * stage scale)
    P.setScale = (s) => { P.scale = s; };
    P.lw = (w) => Math.max(0.6, w * P.scale);
    // hatch/halftone patterns
    P.pattern = (ctx, name, color) => {
      const key = name + color + P.scale.toFixed(2); if (pat[key]) return pat[key];
      const c = document.createElement('canvas'), s = Math.max(4, Math.round((name === 'dots' ? 6 : 5) * P.scale)); c.width = c.height = s;
      const g = c.getContext('2d');
      if (name === 'hatch') { g.strokeStyle = color; g.lineWidth = Math.max(0.7, 0.9 * P.scale); g.beginPath(); g.moveTo(0, s); g.lineTo(s, 0); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(s - 1, s + 1); g.lineTo(s + 1, s - 1); g.stroke(); }
      if (name === 'dots') { g.fillStyle = color; g.beginPath(); g.arc(s / 2, s / 2, s * 0.22, 0, TAU); g.fill(); }
      if (name === 'grain') { const id = g.createImageData(s, s); for (let i = 0; i < s * s; i++) { const v = hash(i * 7.3 + P.seed) * 40; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 0; id.data[i * 4 + 3] = v; } g.putImageData(id, 0, 0); }
      return (pat[key] = ctx.createPattern(c, 'repeat'));
    };
    // generic filled shape with the painter's edge treatment
    P.shape = (ctx, path, color, info = {}) => {
      const far = info.far ? -0.16 : 0, col = far ? shade(color, far) : color;
      if (kind === 'paper') { // offset shadow, then flat paper
        ctx.save(); ctx.translate(1.6 * P.scale, 2.2 * P.scale); ctx.beginPath(); path(ctx); ctx.fillStyle = 'rgba(40,25,10,0.28)'; ctx.fill(); ctx.restore();
        ctx.beginPath(); path(ctx); ctx.fillStyle = col; ctx.fill();
        if (info.shadeSide) { ctx.save(); ctx.clip(); ctx.fillStyle = P.pattern(ctx, 'dots', 'rgba(60,30,30,0.35)'); ctx.fillRect(info.shadeSide.x0, info.shadeSide.y0, info.shadeSide.w, info.shadeSide.h); ctx.restore(); }
        return;
      }
      ctx.beginPath(); path(ctx);
      if (kind === 'clay' && info.box) { const b = info.box, g = ctx.createLinearGradient(b.x0, b.y0, b.x0 + b.w * 0.8, b.y0 + b.h); g.addColorStop(0, shade(col, 0.28)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.28)); ctx.fillStyle = g; }
      else ctx.fillStyle = col;
      ctx.fill();
      if (kind === 'ink') { ctx.lineWidth = P.lw(P.ow); ctx.strokeStyle = P.ink; ctx.lineJoin = 'round'; ctx.stroke(); }
      if (kind === 'hatch') {
        if (info.shadeSide) { ctx.save(); ctx.clip(); ctx.fillStyle = P.pattern(ctx, 'hatch', 'rgba(30,30,40,0.55)'); const s = info.shadeSide; ctx.fillRect(s.x0, s.y0, s.w, s.h); ctx.restore(); ctx.beginPath(); path(ctx); }
        ctx.lineWidth = P.lw(P.ow * (info.thin ? 0.55 : 1)); ctx.strokeStyle = P.ink; ctx.lineJoin = 'round'; ctx.stroke();
      }
      if (kind === 'gouache') { ctx.save(); ctx.clip(); ctx.fillStyle = P.pattern(ctx, 'grain'); ctx.fillRect(info.box ? info.box.x0 : 0, info.box ? info.box.y0 : 0, info.box ? info.box.w : ctx.canvas.width, info.box ? info.box.h : ctx.canvas.height); ctx.restore(); }
      if (kind === 'clay') { ctx.lineWidth = P.lw(1.1); ctx.strokeStyle = shade(col, -0.35); ctx.stroke(); }
    };
    // a connected limb chain: [{a, b, ra, rb, color}] drawn as ONE unit (outline under, fills over)
    P.chain = (ctx, parts, info = {}) => {
      const far = info.far ? -0.16 : 0;
      const bb = parts.reduce((m, p) => ({ x0: Math.min(m.x0, p.a.x - p.ra, p.b.x - p.rb), y0: Math.min(m.y0, p.a.y - p.ra, p.b.y - p.rb), x1: Math.max(m.x1, p.a.x + p.ra, p.b.x + p.rb), y1: Math.max(m.y1, p.a.y + p.ra, p.b.y + p.rb) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
      const box = { x0: bb.x0, y0: bb.y0, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0 };
      if (kind === 'paper') {
        ctx.save(); ctx.translate(1.6 * P.scale, 2.2 * P.scale); ctx.fillStyle = 'rgba(40,25,10,0.26)'; ctx.beginPath(); for (const p of parts) capsulePath(ctx, p.a, p.b, p.ra, p.rb); ctx.fill(); ctx.restore();
      }
      const ow = kind === 'ink' ? P.lw(P.ow) * 0.5 : kind === 'hatch' ? P.lw(P.ow) * 0.42 : kind === 'clay' ? P.lw(0.6) : 0;
      if (ow > 0) { ctx.beginPath(); for (const p of parts) capsulePath(ctx, p.a, p.b, p.ra + ow, p.rb + ow); ctx.fillStyle = kind === 'clay' ? 'rgba(40,20,30,0.35)' : P.ink; ctx.fill(); }
      for (const p of parts) {
        const col = far ? shade(p.color, far) : p.color;
        ctx.beginPath(); capsulePath(ctx, p.a, p.b, p.ra, p.rb);
        if (kind === 'clay') { const dx = p.b.x - p.a.x, dy = p.b.y - p.a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, r = Math.max(p.ra, p.rb);
          const mx = (p.a.x + p.b.x) / 2, my = (p.a.y + p.b.y) / 2, sgn = nx * -0.6 + ny * -0.8 > 0 ? 1 : -1;
          const g = ctx.createLinearGradient(mx + nx * r * sgn, my + ny * r * sgn, mx - nx * r * sgn, my - ny * r * sgn); g.addColorStop(0, shade(col, 0.3)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.3)); ctx.fillStyle = g; }
        else ctx.fillStyle = col;
        ctx.fill();
        if (kind === 'gouache') { ctx.save(); ctx.clip(); ctx.fillStyle = P.pattern(ctx, 'grain'); ctx.fillRect(box.x0, box.y0, box.w, box.h); ctx.restore(); }
      }
      if (kind === 'hatch' && info.far) { ctx.save(); ctx.beginPath(); for (const p of parts) capsulePath(ctx, p.a, p.b, p.ra, p.rb); ctx.clip(); ctx.fillStyle = P.pattern(ctx, 'hatch', 'rgba(25,25,35,0.5)'); ctx.fillRect(box.x0, box.y0, box.w, box.h); ctx.restore(); }
      return box;
    };
    P.line = (ctx, pts, color, w, close = false) => { ctx.beginPath(); polyPath(ctx, pts, close); ctx.strokeStyle = color; ctx.lineWidth = P.lw(w); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
    P.ground = (ctx, pts, color, edge) => {
      if (pts.length < 3) return; ctx.beginPath(); polyPath(ctx, pts); ctx.fillStyle = color; ctx.fill();
      if (kind === 'gouache') { ctx.save(); ctx.clip(); ctx.fillStyle = P.pattern(ctx, 'grain'); ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); }
      if (edge && (kind === 'ink' || kind === 'hatch')) { ctx.beginPath(); polyPath(ctx, pts); ctx.strokeStyle = edge; ctx.lineWidth = P.lw(kind === 'ink' ? 1.6 : 1.1); ctx.stroke(); }
      if (edge && kind === 'paper') { ctx.beginPath(); polyPath(ctx, pts); ctx.strokeStyle = 'rgba(60,40,20,0.35)'; ctx.lineWidth = P.lw(1.4); ctx.stroke(); }
      if (edge && kind === 'clay') { ctx.beginPath(); polyPath(ctx, pts); ctx.strokeStyle = 'rgba(40,30,20,0.25)'; ctx.lineWidth = P.lw(2); ctx.stroke(); }
    };
    return P;
  }

  /* ---------- world primitives (each returns a drawable with a depth key) ---------- */
  function boxItem(spec) { // {x,z,w,d,h,yaw,y0,colors:{top,front,side}, info}
    return { key: V(spec.x, spec.y0 || 0, spec.z), bbox: spec.noFade ? null : (cam) => { const pts = []; for (const i of [-1, 1]) for (const j of [-1, 1]) for (const y of [spec.y0 || 0, (spec.y0 || 0) + spec.h]) pts.push(cam.proj(V(spec.x + i * spec.w / 2, y, spec.z + j * spec.d / 2))); if (pts.some((q) => q.z < 0.05 && !cam.ortho)) return null; const b = bboxOf(pts); return { x0: b.x0, y0: b.y0, x1: b.x0 + b.w, y1: b.y0 + b.h }; }, draw(ctx, cam, P) {
      const c = Math.cos(spec.yaw || 0), s = Math.sin(spec.yaw || 0), y0 = spec.y0 || 0, y1 = y0 + spec.h;
      const corner = (i, j) => V(spec.x + c * i * spec.w / 2 - s * j * spec.d / 2, 0, spec.z + s * i * spec.w / 2 + c * j * spec.d / 2);
      const base = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
      const faces = [];
      for (let k = 0; k < 4; k++) { const a = base[k], b = base[(k + 1) % 4]; const f = [V(a.x, y0, a.z), V(b.x, y0, b.z), V(b.x, y1, b.z), V(a.x, y1, a.z)];
        const n = norm(cross(sub(f[1], f[0]), sub(f[3], f[0]))), mid = mul(add(add(f[0], f[1]), add(f[2], f[3])), 0.25), toC = cam.toCam(mid);
        if (dot(n, toC) < 0) faces.push({ f, depth: cam.cam(mid).z, side: k % 2 === 0 }); } // outward normals point away from centre with this winding
      faces.sort((a, b) => b.depth - a.depth);
      for (const fc of faces) { const pp = projPoly(cam, fc.f); if (pp.length > 2) P.shape(ctx, (g) => polyPath(g, pp), fc.side ? spec.colors.front : spec.colors.side, { box: bboxOf(pp), thin: true }); }
      const top = projPoly(cam, base.map((b) => V(b.x, y1, b.z))); if (top.length > 2 && cam.cam(V(spec.x, y1, spec.z)).y < 0 || cam.ortho) P.shape(ctx, (g) => polyPath(g, top), spec.colors.top, { box: bboxOf(top), thin: true });
    } };
  }
  function bboxOf(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); } return { x0, y0, w: x1 - x0, h: y1 - y0 }; }
  function postItem(x, z, h, r, color, capColor) {
    return { key: V(x, 0, z), draw(ctx, cam, P) { const a = cam.proj(V(x, 0, z)), b = cam.proj(V(x, h, z)); if (a.z < cam.near && !cam.ortho) return; P.chain(ctx, [{ a, b, ra: r * a.s, rb: r * b.s * 0.9, color }]); if (capColor) { ctx.beginPath(); ctx.arc(b.x, b.y, r * 1.5 * b.s, 0, TAU); ctx.fillStyle = capColor; ctx.fill(); } } };
  }
  function treeItem(x, z, h, cr, colors, seed = 1, style = 'round') {
    return { key: V(x, 0, z), bbox(cam) { const c = cam.proj(V(x, h * 0.72, z)), r = cr * 1.25 * c.s, b = cam.proj(V(x, 0, z)); return { x0: c.x - r, y0: c.y - r, x1: c.x + r, y1: Math.max(b.y, c.y + r) }; }, draw(ctx, cam, P) {
      const a = cam.proj(V(x, 0, z)); if (a.z < cam.near && !cam.ortho) return;
      const b = cam.proj(V(x, h * 0.62, z));
      P.chain(ctx, [{ a, b, ra: 0.16 * a.s, rb: 0.1 * b.s, color: colors.trunk }]);
      const blobs = [];
      const n = style === 'poplar' ? 5 : 7;
      for (let i = 0; i < n; i++) {
        const ang = hash(seed * 13 + i) * TAU, rr = cr * (style === 'poplar' ? 0.35 : 0.55) * hash(seed * 7 + i);
        const yy = h * (style === 'poplar' ? 0.45 + 0.5 * i / n : 0.62 + 0.22 * hash(seed + i * 3));
        blobs.push({ c: cam.proj(V(x + Math.cos(ang) * rr, yy, z + Math.sin(ang) * rr)), r: cr * (style === 'poplar' ? 0.5 : 0.55 + 0.25 * hash(seed + i)) });
      }
      blobs.sort((p, q) => q.c.z - p.c.z);
      const big = cam.proj(V(x, h * 0.72, z));
      const crown = (g, grow = 0) => { for (const bl of blobs) { const r = bl.r * bl.c.s + grow; g.moveTo(bl.c.x + r, bl.c.y); g.arc(bl.c.x, bl.c.y, r, 0, TAU); } };
      if (P.kind === 'ink' || P.kind === 'hatch') { // union outline: ink under, leaves over
        ctx.beginPath(); crown(ctx, P.lw(P.ow) * (P.kind === 'ink' ? 0.55 : 0.4)); ctx.fillStyle = P.ink; ctx.fill();
        ctx.beginPath(); crown(ctx); ctx.fillStyle = colors.leaf; ctx.fill();
        if (P.kind === 'hatch') { ctx.save(); ctx.beginPath(); crown(ctx); ctx.clip(); ctx.fillStyle = P.pattern(ctx, 'hatch', 'rgba(30,40,25,0.35)'); ctx.fillRect(big.x - cr * 2 * big.s, big.y, cr * 4 * big.s, cr * 2 * big.s); ctx.restore(); }
      } else P.shape(ctx, (g) => crown(g), colors.leaf, { box: { x0: big.x - cr * 2 * big.s, y0: big.y - cr * 2 * big.s, w: cr * 4 * big.s, h: cr * 4 * big.s } });
      // light side
      ctx.save(); ctx.beginPath(); for (const bl of blobs) { ctx.moveTo(bl.c.x + bl.r * bl.c.s, bl.c.y); ctx.arc(bl.c.x, bl.c.y, bl.r * bl.c.s, 0, TAU); } ctx.clip();
      ctx.fillStyle = colors.leafLight; for (const bl of blobs) { ctx.beginPath(); ctx.arc(bl.c.x - bl.r * bl.c.s * 0.3, bl.c.y - bl.r * bl.c.s * 0.35, bl.r * bl.c.s * 0.62, 0, TAU); ctx.fill(); }
      if (colors.dots) { ctx.fillStyle = colors.dots; for (let i = 0; i < 14; i++) { const bl = blobs[i % blobs.length]; ctx.beginPath(); ctx.arc(bl.c.x + (hash(seed + i * 5) - 0.5) * bl.r * bl.c.s * 1.4, bl.c.y + (hash(seed + i * 9) - 0.5) * bl.r * bl.c.s * 1.4, Math.max(1, 0.05 * bl.c.s), 0, TAU); ctx.fill(); } }
      ctx.restore();
    } };
  }
  function shadowEllipse(ctx, cam, x, z, rx, rz, alpha, yaw = 0) {
    const pts = []; for (let i = 0; i < 24; i++) { const t = i / 24 * TAU, lx = Math.cos(t) * rx, lz = Math.sin(t) * rz; pts.push(V(x + lx * Math.cos(yaw) - lz * Math.sin(yaw), 0.005, z + lx * Math.sin(yaw) + lz * Math.cos(yaw))); }
    const pp = projPoly(cam, pts); if (pp.length < 3) return; ctx.beginPath(); polyPath(ctx, pp); ctx.fillStyle = `rgba(20,20,40,${alpha})`; ctx.fill();
  }

  /* ---------- the character ---------- */
  // ch: {body, colors:{skin, skinShade, hair, top, top2, bottom, shoe, sole, sock}, hair:{type, line}, face:{...}, extras}
  function headPixels(cam, pose, ch, P, probe) {
    const B = ch.body, R = B.headR, sy = B.headSY, C = pose.head, pc = cam.proj(C), s = pc.s, rpx = R * s;
    const ext = Math.ceil(rpx * Math.max(1, sy) * 1.08) + 3, size = ext * 2;
    let cv = ch._headCanvas; if (!cv) { cv = ch._headCanvas = document.createElement('canvas'); }
    if (cv.width < size || cv.height < size) { cv.width = Math.max(size, cv.width); cv.height = Math.max(size, cv.height); }
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    const img = g.createImageData(size, size), D = img.data;
    const hR = mul(pose.hL, -1), hU = pose.hUp, hF = pose.hF, w = cam.ortho ? cam.w : norm(sub(C, cam.pos));
    // camera right/up at the head (perpendicular to the view ray)
    const cr = norm(cross(V(0, 1, 0), w)), cu = cross(w, cr);
    const dl = V(dot(w, hR), dot(w, hU) / sy, dot(w, hF)), a = dot(dl, dl);
    const L = norm(P.light), Ll = V(dot(L, hR), dot(L, hU), dot(L, hF));
    const skin = hex(ch.colors.skin), skinS = hex(ch.colors.skinShade), hair = hex(ch.colors.hair), hairS = hex(ch.colors.hairShade || shade(ch.colors.hair, -0.35)), ink = hex(P.ink);
    const band = ch.hair.band ? hex(ch.hair.band) : null, cap = ch.hair.cap ? hex(ch.hair.cap) : null;
    const owpx = P.kind === 'ink' ? Math.min(P.lw(P.ow) * 0.9, Math.max(1, rpx * 0.07)) : P.kind === 'hatch' ? Math.min(P.lw(P.ow) * 0.6, Math.max(0.8, rpx * 0.05)) : 0;
    const hl = ch.hair.line; // {front, side, back, part}
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
      const dx = (px + 0.5 - ext) / s, dy = -(py + 0.5 - ext) / s;
      const o = V(cr.x * dx + cu.x * dy - w.x * 3 * R, cr.y * dx + cu.y * dy - w.y * 3 * R, cr.z * dx + cu.z * dy - w.z * 3 * R);
      const ol = V(dot(o, hR) / R, dot(o, hU) / (R * sy), dot(o, hF) / R);
      const b = 2 * dot(ol, dl), c = dot(ol, ol) - 1, disc = b * b - 4 * a * c;
      // distance of the ray from the centre (unit sphere space) for anti-aliasing / outline
      const m2 = c + 1 - (b * b) / (4 * a), m = Math.sqrt(Math.max(0, m2)), edge = (1 - m) * rpx;
      if (edge < -1) continue;
      const tt = disc > 0 ? (-b - Math.sqrt(disc)) / (2 * a) : -b / (2 * a);
      const hx = ol.x + dl.x * tt, hy = ol.y + dl.y * tt, hz = ol.z + dl.z * tt; // unit-sphere hit
      const nl = norm(V(hx, hy / sy, hz)); // ellipsoid normal in head-local (x right, y up, z front)
      let lam = nl.x * Ll.x + nl.y * Ll.y + nl.z * Ll.z;
      const az = Math.atan2(nl.x, nl.z), el = Math.asin(clamp(nl.y, -1, 1)), ca = (1 - Math.cos(az)) / 2;
      let line = lerp(hl.front, hl.back, Math.pow(ca, hl.pow || 1.6)) + (hl.side || 0) * Math.sin(Math.abs(az)) ** 6 * (Math.abs(az) < 2.2 ? 1 : 0);
      if (hl.part) line += hl.part * Math.max(0, Math.cos(az)) * (0.5 + 0.5 * Math.sin(az * 3 + 0.6));
      const hairD = (el - line) * rpx; // >0 inside hair
      let col, isHair = hairD > 0;
      if (cap && el > (ch.hair.capLine || 0.32) + 0.06 * Math.cos(az)) col = cap; else col = null;
      let cel;
      if (P.kind === 'ink' || P.kind === 'paper') cel = lam > -0.05 ? 0 : 1; else if (P.kind === 'hatch') cel = lam > -0.05 ? 0 : 0.7; else cel = clamp(0.55 - lam * 0.8, 0, 1);
      let base, sh;
      if (col) { base = col; sh = col.map((x) => x * 0.72); isHair = true; }
      else if (isHair) { base = hair; sh = hairS; } else { base = skin; sh = skinS; }
      if (!col && band && Math.abs(el - (ch.hair.bandEl || 0.62)) < 0.09 && Math.abs(az) < 2.4) { base = band; sh = band.map((x) => x * 0.75); }
      if (!isHair && (P.kind === 'hatch' || P.kind === 'ink')) cel = lam < -0.3 ? 0.55 : 0; // keep faces clean: only the deep side turns
      let r = lerp(base[0], sh[0], cel), gg = lerp(base[1], sh[1], cel), bb = lerp(base[2], sh[2], cel);
      if (P.kind === 'clay') { const spec = Math.pow(clamp(nl.x * -0.35 + nl.y * 0.6 + nl.z * 0.7, 0, 1), 18) * 0.45; r += (255 - r) * spec; gg += (255 - gg) * spec; bb += (255 - bb) * spec; }
      if (P.kind === 'hatch' && isHair && lam < -0.2 && ((px + py) % Math.max(3, Math.round(4 * P.scale / 2))) === 0) { r *= 0.72; gg *= 0.72; bb *= 0.74; }
      
      if (P.kind === 'gouache') { const n = hash(px * 31 + py * 17) * 14 - 7; r += n; gg += n; bb += n; }
      // hairline stroke for ink styles
      if (owpx && !col && Math.abs(hairD) < owpx * 0.45 && edge > 0) { r = ink[0]; gg = ink[1]; bb = ink[2]; }
      if (owpx && edge < owpx) { const k = clamp(edge + 1, 0, 1); r = lerp(r, ink[0], 1); gg = lerp(gg, ink[1], 1); bb = lerp(bb, ink[2], 1); void k; }
      const alpha = clamp(edge + 0.5, 0, 1);
      const i4 = (py * size + px) * 4; D[i4] = r; D[i4 + 1] = gg; D[i4 + 2] = bb; D[i4 + 3] = alpha * 255;
    }
    g.putImageData(img, 0, 0);
    if (probe) probe.head = { x: pc.x, y: pc.y, r: rpx, ry: rpx * sy };
    return { cv, ext, size, pc, rpx };
  }

  // map a small surface patch at head-local (az, el) into screen, call fn with unit = head radius
  function onHead(ctx, cam, pose, ch, az, el, fn, out = 1.0) {
    const B = ch.body, R = B.headR, hR = mul(pose.hL, -1), hU = pose.hUp, hF = pose.hF;
    const nl = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const toW = (v) => add(add(mul(hR, v.x), mul(hU, v.y)), mul(hF, v.z));
    const n = norm(toW(V(nl.x, nl.y / B.headSY, nl.z)));
    const X = add(pose.head, toW(V(nl.x * R * out, nl.y * R * B.headSY * out, nl.z * R * out)));
    const vis = dot(n, cam.toCam(X)); if (vis < 0.08) return vis;
    const tR = norm(cross(hU, n)), tRr = dot(tR, hR) < 0 ? mul(tR, -1) : tR, tU = norm(cross(n, tRr)), tUu = dot(tU, hU) < 0 ? mul(tU, -1) : tU;
    const p0 = cam.proj(X), px = cam.proj(madd(X, tRr, R)), pu = cam.proj(madd(X, tUu, R));
    ctx.save(); ctx.setTransform(px.x - p0.x, px.y - p0.y, -(pu.x - p0.x), -(pu.y - p0.y), p0.x, p0.y); // local x right, y DOWN (canvas-like) in head radii
    fn(ctx, vis, p0); ctx.restore(); return vis;
  }

  function drawFace(ctx, cam, pose, ch, P, mood) {
    const F = ch.face, ink = P.ink, sR = cam.scaleAt(pose.head) * ch.body.headR, lwU = (w) => Math.max(w * 0.026, 0.7 / sR); // line widths scale with the head (head-radius units)
    const blink = (() => { const ph = (pose.t * 0.9 + F.blinkSeed) % 3.1; return ph < 0.12 ? Math.sin(ph / 0.12 * PI) : 0; })();
    const look = { x: clamp(Math.sin((pose.yawH - pose.yawB) * 1.4), -0.5, 0.5) * 0.08, y: 0.02 };
    for (const side of [-1, 1]) { // ears
      if (F.ears) onHead(ctx, cam, pose, ch, side * 1.57, -0.05, (g) => { g.beginPath(); g.ellipse(0, 0, 0.17, 0.25, 0, 0, TAU); g.fillStyle = ch.colors.skin; g.fill(); g.lineWidth = lwU(P.kind === 'ink' ? 1.6 : 1); g.strokeStyle = P.kind === 'ink' || P.kind === 'hatch' ? ink : ch.colors.skinShade; g.stroke();
        if (F.earring) { g.beginPath(); g.arc(0.02, 0.3, 0.1, 0, TAU); g.strokeStyle = F.earring; g.lineWidth = lwU(2); g.stroke(); } }, 0.98);
    }
    for (const side of [-1, 1]) { // eyes
      onHead(ctx, cam, pose, ch, side * F.eyeAz, F.eyeEl, (g, vis) => {
        const w = F.eyeW, h = F.eyeH * (1 - blink * 0.92) * (mood.squint ? 0.8 : 1);
        if (F.eyeStyle === 'big' || F.eyeStyle === 'almond') {
          g.beginPath(); if (F.eyeStyle === 'big') g.ellipse(0, 0, w, h, 0, 0, TAU); else { g.moveTo(-w, 0.02); g.quadraticCurveTo(0, -h * 1.5, w, -0.01); g.quadraticCurveTo(0, h * 1.25, -w, 0.02); }
          g.fillStyle = '#fbfaf5'; g.fill(); g.save(); g.clip();
          g.beginPath(); g.arc(look.x * side * 0 + look.x, look.y, F.iris, 0, TAU); g.fillStyle = F.irisColor; g.fill();
          g.beginPath(); g.arc(look.x, look.y, F.iris * 0.55, 0, TAU); g.fillStyle = '#121016'; g.fill();
          g.beginPath(); g.arc(look.x - F.iris * 0.35, look.y - F.iris * 0.4, F.iris * 0.28, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.restore();
          g.beginPath(); if (F.eyeStyle === 'big') g.ellipse(0, 0, w, h, 0, PI * 1.05, PI * 1.95); else { g.moveTo(-w * 1.05, 0.02); g.quadraticCurveTo(0, -h * 1.55, w * 1.08, -0.02); }
          g.lineWidth = lwU(F.lidW || 2.2); g.strokeStyle = ink; g.lineCap = 'round'; g.stroke();
          if (F.lashes) { g.beginPath(); g.moveTo(w * side * 0.85, -h * 0.55); g.lineTo(w * side * 1.25, -h * 0.95); g.stroke(); }
          if (P.kind !== 'clay') { g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, TAU); g.lineWidth = lwU(0.8); g.strokeStyle = 'rgba(30,20,30,0.5)'; g.stroke(); }
        } else { // dot / button eyes
          g.beginPath(); g.ellipse(look.x, look.y, w, h, 0, 0, TAU); g.fillStyle = '#17131a'; g.fill();
          g.beginPath(); g.arc(look.x - w * 0.3, look.y - h * 0.35, w * 0.32, 0, TAU); g.fillStyle = '#fff'; g.fill();
          if (F.lidW) { g.beginPath(); g.ellipse(look.x, look.y + h * 0.15, w * 1.25, h * 1.15, 0, PI * 1.1, PI * 1.9); g.lineWidth = lwU(F.lidW); g.strokeStyle = ink; g.stroke(); }
        }
      });
      onHead(ctx, cam, pose, ch, side * (F.eyeAz + 0.04), F.eyeEl + F.browUp + (mood.brow || 0), (g) => { // brows: fixed anatomy, only lifted
        g.beginPath(); g.moveTo(-F.eyeW * 1.1, 0.05 * side * F.browTilt); g.quadraticCurveTo(0, -0.07, F.eyeW * 1.15, -0.05 * side * F.browTilt);
        g.lineWidth = lwU(F.browW); g.strokeStyle = F.browColor || ink; g.lineCap = 'round'; g.stroke();
      });
      if (F.blush) onHead(ctx, cam, pose, ch, side * 0.62, -0.28, (g) => { g.beginPath(); g.ellipse(0, 0, 0.17, 0.09, 0, 0, TAU); g.fillStyle = F.blush; g.fill(); });
      if (F.freckles) onHead(ctx, cam, pose, ch, side * 0.45, -0.18, (g) => { g.fillStyle = F.freckles; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((hash(i * 3 + side) - 0.5) * 0.3, (hash(i * 7 + side) - 0.5) * 0.14, 0.012, 0, TAU); g.fill(); } });
    }
    if (F.glasses) {
      for (const side of [-1, 1]) onHead(ctx, cam, pose, ch, side * F.eyeAz, F.eyeEl, (g) => { g.beginPath(); g.ellipse(0, 0, F.eyeW * 1.55, F.eyeW * 1.35, 0, 0, TAU); g.lineWidth = lwU(2.4); g.strokeStyle = F.glasses; g.stroke(); }, 1.06);
      onHead(ctx, cam, pose, ch, 0, F.eyeEl + 0.02, (g) => { g.beginPath(); g.moveTo(-0.12, 0); g.quadraticCurveTo(0, -0.05, 0.12, 0); g.lineWidth = lwU(2); g.strokeStyle = F.glasses; g.stroke(); }, 1.1);
    }
    // nose: drawn from the surface outward so it protrudes in profile
    {
      const R = ch.body.headR, hR = mul(pose.hL, -1), base = add(pose.head, add(mul(pose.hF, R * 0.98), mul(pose.hUp, R * F.noseEl * ch.body.headSY)));
      const vis = dot(pose.hF, cam.toCam(base)) + 0.35;
      if (vis > 0) {
        const tip = add(base, add(mul(pose.hF, R * F.noseLen), mul(pose.hUp, -R * 0.08))), top = add(base, mul(pose.hUp, R * 0.22)), bot = add(base, mul(pose.hUp, -R * 0.12));
        const wl = add(bot, mul(hR, R * F.noseW)), wr = add(bot, mul(hR, -R * F.noseW));
        const pts = [cam.proj(top), cam.proj(wl), cam.proj(tip), cam.proj(wr)];
        const T = cam.proj(tip), Bt = cam.proj(bot);
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.quadraticCurveTo(pts[1].x, pts[1].y, T.x, T.y); ctx.quadraticCurveTo(pts[3].x, pts[3].y, pts[0].x, pts[0].y);
        ctx.fillStyle = F.noseColor || ch.colors.skin; ctx.fill();
        ctx.beginPath(); ctx.moveTo(pts[1].x, pts[1].y); ctx.quadraticCurveTo(T.x, T.y + (Bt.y - T.y) * 0.2, pts[3].x, pts[3].y);
        ctx.strokeStyle = P.kind === 'gouache' || P.kind === 'clay' ? shade(toHex(ch.colors.skinShade), -0.2) : ink; ctx.lineWidth = P.lw(P.kind === 'ink' ? 1.8 : 1.2); ctx.lineCap = 'round'; ctx.stroke();
      }
    }
    // mouth: breathing while running, small smile when settled
    onHead(ctx, cam, pose, ch, 0, F.mouthEl, (g) => {
      const open = clamp(mood.open, 0, 1), smile = mood.smile, w = F.mouthW;
      g.beginPath(); g.moveTo(-w, -smile * 0.05); g.quadraticCurveTo(0, 0.06 * smile + open * 0.16, w, -smile * 0.05);
      if (open > 0.05) { g.quadraticCurveTo(0, -0.02, -w, -smile * 0.05); g.fillStyle = '#5a2430'; g.fill(); g.save(); g.clip(); g.beginPath(); g.ellipse(0, 0.12 * open, w * 0.55, 0.05, 0, 0, TAU); g.fillStyle = '#d9707a'; g.fill(); g.restore(); g.beginPath(); g.moveTo(-w, -smile * 0.05); g.quadraticCurveTo(0, 0.06 * smile + open * 0.16, w, -smile * 0.05); g.quadraticCurveTo(0, -0.02, -w, -smile * 0.05); }
      g.lineWidth = lwU(F.mouthLine || 1.8); g.strokeStyle = F.lipColor || ink; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke();
    });
  }

  // hair masses attached to the head (puff, ponytail, braid, buns, pompom, visor)
  function hairItems(cam, pose, ch, P) {
    const R = ch.body.headR, H = ch.hair, items = [], hR = mul(pose.hL, -1);
    const at = (x, y, z) => add(pose.head, add(add(mul(hR, x * R), mul(pose.hUp, y * R)), mul(pose.hF, z * R)));
    const blob = (c, r, color, bumpy) => ({ key: c, draw(ctx) { const p = cam.proj(c), rp = r * R * p.s; P.shape(ctx, (g) => {
      if (bumpy) { const n = 14; for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = rp * (1 + 0.07 * Math.sin(a * 7 + 1)); const x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
      else { g.moveTo(p.x + rp, p.y); g.arc(p.x, p.y, rp, 0, TAU); } }, color, { box: { x0: p.x - rp, y0: p.y - rp, w: 2 * rp, h: 2 * rp } }); } });
    const ph = pose.t * 2.7 * TAU / 2, bob = Math.sin(ph * 2) * pose.rho, swayL = Math.sin(ph) * pose.rho;
    if (H.type === 'puff') items.push(blob(at(0, 1.05, -0.35), H.size || 0.95, ch.colors.hair, true));
    if (H.type === 'buns') { items.push(blob(at(0.62, 0.92, -0.15), 0.42, ch.colors.hair, true)); items.push(blob(at(-0.62, 0.92, -0.15), 0.42, ch.colors.hair, true)); }
    if (H.type === 'pompom') items.push(blob(at(0, 1.42, -0.1), 0.38, H.pom || '#fff', true));
    if (H.type === 'ponytail' || H.type === 'braid') {
      const base = at(0, H.type === 'braid' ? 0.15 : 0.62, -0.95), segs = H.type === 'braid' ? 6 : 4, segL = (H.length || 2.2) * R / segs;
      let p = base; const pts = [p];
      for (let i = 1; i <= segs; i++) {
        const k = i / segs, back = mul(pose.hF, -1);
        let d = norm(add(add(mul(back, 0.55 + 0.35 * pose.rho), mul(V(0, -1, 0), 0.9 - 0.35 * pose.rho + bob * 0.25 * k)), mul(pose.lB, swayL * 0.45 * k)));
        if (H.type === 'braid') d = norm(add(mul(pose.up, -1), mul(back, 0.35 + 0.4 * pose.rho)));
        p = madd(p, d, segL); pts.push(p);
      }
      items.push({ key: at(0, 0.3, -1.2), draw(ctx) {
        const pp = pts.map((q) => cam.proj(q)), s = pp[0].s;
        const parts = []; for (let i = 0; i < pp.length - 1; i++) { const k = i / (pp.length - 1); parts.push({ a: pp[i], b: pp[i + 1], ra: (H.type === 'braid' ? 0.33 : 0.42 - 0.18 * k) * R * s, rb: (H.type === 'braid' ? 0.3 : 0.3 - 0.16 * k) * R * s, color: ch.colors.hair }); }
        P.chain(ctx, parts);
        if (H.type === 'braid') { ctx.strokeStyle = shade(ch.colors.hair, -0.3); ctx.lineWidth = P.lw(1.2); for (let i = 1; i < pp.length - 1; i++) { ctx.beginPath(); ctx.arc(pp[i].x, pp[i].y, 0.26 * R * s, 0.3, 2.6); ctx.stroke(); } const e = pp[pp.length - 1]; ctx.beginPath(); ctx.arc(e.x, e.y, 0.2 * R * s, 0, TAU); ctx.fillStyle = H.tie || '#e94'; ctx.fill(); }
        if (H.tie && H.type === 'ponytail') { ctx.beginPath(); ctx.arc(pp[0].x, pp[0].y, 0.32 * R * s, 0, TAU); ctx.fillStyle = H.tie; ctx.fill(); }
      } });
    }
    if (H.visor) { // brim: a flat half-disc in front of the forehead
      const pts = []; for (let i = 0; i <= 12; i++) { const a = -PI / 2 + i / 12 * PI; pts.push(at(Math.sin(a) * 1.02, 0.48, Math.cos(a) * 1.02)); }
      for (let i = 12; i >= 0; i--) { const a = -PI / 2 + i / 12 * PI; pts.push(at(Math.sin(a) * 0.95, 0.40, 1.0 + Math.cos(a) * 0.7)); }
      items.push({ key: at(0, 0.45, 1.3), draw(ctx) { const pp = pts.map((q) => cam.proj(q)); P.shape(ctx, (g) => polyPath(g, pp), H.visor, { box: bboxOf(pp), thin: true }); } });
    }
    return items;
  }

  function drawCharacter(ctx, cam, pose, ch, P, probe, only) {
    const B = ch.body, C = ch.colors, pr = (p) => cam.proj(p), sc = (p) => cam.scaleAt(p);
    const torsoDepth = cam.cam(pose.chest).z;
    // ---- legs (always behind the torso/shorts; near/far by depth)
    const legItems = pose.legs.map((L, i) => {
      const f = L.foot, hip = pr(L.hip), knee = pr(L.knee), ank = pr(L.ankle), heel = pr(f.heel), toe = pr(f.toe), ball = pr(f.ball);
      const depth = (cam.cam(L.knee).z + cam.cam(L.ankle).z) / 2;
      return { depth, i, draw() {
        const far = depth > cam.cam(pose.pel).z + 0.02;
        const s = hip.s, sk = ank.s;
        const shortsK = ch.shortsLen ?? 0.45;
        const kneeShorts = { x: lerp(hip.x, knee.x, shortsK), y: lerp(hip.y, knee.y, shortsK), s: lerp(hip.s, knee.s, shortsK) };
        const parts = [
          { a: hip, b: knee, ra: B.thighR * s, rb: B.kneeR * knee.s, color: C.legs || C.skin },
          { a: knee, b: ank, ra: B.kneeR * knee.s, rb: B.ankleR * sk, color: C.shin || C.legs || C.skin },
        ];
        if (C.bottom) parts.push({ a: hip, b: kneeShorts, ra: (B.thighR + 0.012) * s, rb: (B.thighR + 0.006) * kneeShorts.s, color: C.bottom });
        if (C.sock) parts.push({ a: ank, b: { x: lerp(ank.x, knee.x, 0.22), y: lerp(ank.y, knee.y, 0.22), s: sk }, ra: (B.ankleR + 0.006) * sk, rb: (B.ankleR + 0.006) * sk, color: C.sock });
        // shoe from heel to toe, rooted at the ankle
        const heelUp = pr(add(f.heel, mul(V(0, 1, 0), 0.045))), toeUp = pr(add(f.toe, mul(V(0, 1, 0), 0.03)));
        parts.push({ a: { x: (heel.x + heelUp.x) / 2, y: (heel.y + heelUp.y) / 2 }, b: { x: (toe.x + toeUp.x) / 2, y: (toe.y + toeUp.y) / 2 }, ra: B.shoeR * heel.s, rb: B.shoeR * 0.8 * toe.s, color: C.shoe });
        parts.push({ a: ank, b: { x: (heel.x + heelUp.x) / 2, y: (heel.y + heelUp.y) / 2 }, ra: B.ankleR * 1.15 * sk, rb: B.shoeR * heel.s, color: C.shoe });
        P.chain(ctx, parts, { far });
        // sole
        ctx.beginPath(); ctx.moveTo(heel.x, heel.y); ctx.lineTo(ball.x, ball.y); ctx.lineTo(toe.x, toe.y); ctx.strokeStyle = C.sole; ctx.lineWidth = Math.max(1, 0.022 * heel.s); ctx.lineCap = 'round'; ctx.stroke();
        if (probe) probe.legs[i] = { hip, knee, ankle: ank, heel, toe, ball, stance: f.stance, plant: f.plant, ballWorld: f.ball };
      } };
    });
    legItems.sort((a, b) => b.depth - a.depth);
    // ---- torso
    const torso = { draw() {
      const up = pose.up, lv = pose.leftS, fv = pose.fS;
      const lev = (P0, a, b) => { // cross-section ellipse -> screen half-width perpendicular to the projected spine
        const c = pr(P0), ax = pr(madd(P0, lv, a)), bx = pr(madd(P0, fv, b)), top = pr(madd(P0, up, 0.1));
        let nx = -(top.y - c.y), ny = top.x - c.x; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        const A = { x: ax.x - c.x, y: ax.y - c.y }, Bv = { x: bx.x - c.x, y: bx.y - c.y };
        const w = Math.sqrt((A.x * nx + A.y * ny) ** 2 + (Bv.x * nx + Bv.y * ny) ** 2);
        return { c, nx, ny, w };
      };
      const hipC = madd(pose.pel, up, -0.03), waist = madd(pose.pelvisTop, up, B.spine * 0.32), chest = madd(pose.pelvisTop, up, B.spine * 0.72), shoulder = madd(pose.chest, up, -0.01);
      const L = [lev(hipC, B.hipW, B.hipD), lev(waist, B.waistW, B.waistD), lev(madd(chest, fv, 0.015), B.chestW, B.chestD), lev(shoulder, B.shoulderW, B.chestD * 0.8)];
      const left = L.map((l) => ({ x: l.c.x + l.nx * l.w, y: l.c.y + l.ny * l.w })), right = L.map((l) => ({ x: l.c.x - l.nx * l.w, y: l.c.y - l.ny * l.w }));
      const neckTop = pr(madd(pose.chest, up, 0.04));
      const outline = [...left, neckTop, ...right.reverse()];
      // pelvis bottom (crotch) rounded
      const bot = pr(madd(pose.pel, up, -0.09));
      const shape = [bot, ...outline];
      const box = bboxOf(shape);
      const shadeSide = { x0: box.x0 + box.w * 0.55, y0: box.y0, w: box.w * 0.5, h: box.h };
      // bottom (shorts/leggings) then top garment
      const r2 = [...right].reverse(); // `right` was reversed in place above; r2 is hip..shoulder on the right side
      P.shape(ctx, (g) => smoothPath(g, [bot, left[0], left[1], r2[1], r2[0]]), C.bottom || C.legs, { box, shadeSide });
      const hemK = ch.topHem ?? 0.55;
      const hemL = { x: lerp(left[0].x, left[1].x, hemK), y: lerp(left[0].y, left[1].y, hemK) }, hemR = { x: lerp(r2[0].x, r2[1].x, hemK), y: lerp(r2[0].y, r2[1].y, hemK) };
      P.shape(ctx, (g) => smoothPath(g, [hemL, left[1], left[2], left[3], neckTop, r2[3], r2[2], r2[1], hemR]), C.top, { box, shadeSide });
      if (ch.topDetail) ch.topDetail(ctx, { left, right: r2, neckTop, hemL, hemR, box, pose, cam, P });
      if (probe) probe.torso = { left, right: r2 };
    } };
    // ---- arms (one connected shoulder-elbow-wrist-hand chain each)
    const armItems = pose.arms.map((A, i) => {
      const depth = (cam.cam(A.elbow).z + cam.cam(A.wrist).z) / 2;
      return { depth, i, draw(lowerOnly) {
        const sh = pr(A.shoulder), el = pr(A.elbow), wr = pr(A.wrist), tip = pr(A.handTip);
        const handC = pr(madd(A.wrist, A.dir3, B.hand * 0.5));
        const far = depth > torsoDepth + 0.01;
        const sleeveEnd = ch.sleeve ?? 0.55; // fraction of the forearm covered by the sleeve (0 = short sleeve on upper arm)
        const parts = [];
        if (sleeveEnd >= 0) {
          parts.push({ a: sh, b: el, ra: B.upperArmR * sh.s, rb: B.elbowR * el.s, color: C.sleeve || C.top });
          const sl = { x: lerp(el.x, wr.x, sleeveEnd), y: lerp(el.y, wr.y, sleeveEnd), s: lerp(el.s, wr.s, sleeveEnd) };
          parts.push({ a: el, b: wr, ra: B.elbowR * el.s, rb: B.wristR * wr.s, color: C.skin });
          if (sleeveEnd > 0) parts.push({ a: el, b: sl, ra: (B.elbowR + 0.006) * el.s, rb: (B.elbowR + 0.002) * sl.s, color: C.sleeve || C.top });
        } else {
          const sl = { x: lerp(sh.x, el.x, 0.45), y: lerp(sh.y, el.y, 0.45), s: sh.s };
          parts.push({ a: sh, b: el, ra: B.upperArmR * sh.s, rb: B.elbowR * el.s, color: C.skin });
          parts.push({ a: el, b: wr, ra: B.elbowR * el.s, rb: B.wristR * wr.s, color: C.skin });
          parts.push({ a: sh, b: sl, ra: (B.upperArmR + 0.012) * sh.s, rb: (B.upperArmR + 0.008) * sl.s, color: C.sleeve || C.top });
        }
        // hand: a loose fist on the wrist transform (centre on the forearm axis beyond the wrist)
        const hw = B.handR * handC.s;
        parts.push({ a: wr, b: handC, ra: B.wristR * wr.s * 1.05, rb: hw, color: C.skin });
        const box = P.chain(ctx, lowerOnly ? parts.filter((q) => q.a !== sh) : parts, { far });
        // knuckle / thumb detail (on the hand transform)
        const ax = tip.x - wr.x, ay = tip.y - wr.y, al = Math.hypot(ax, ay) || 1;
        if (hw > 3.5 && P.kind !== 'gouache') {
          ctx.beginPath(); const nx = -ay / al, ny = ax / al, sgn = (A.side === 1 ? 1 : -1) * (dot(pose.fS, cam.toCam(A.wrist)) > 0 ? 1 : -1);
          ctx.moveTo(handC.x + nx * hw * 0.65 * sgn - ax / al * hw * 0.2, handC.y + ny * hw * 0.65 * sgn - ay / al * hw * 0.2);
          ctx.quadraticCurveTo(handC.x + ax / al * hw * 0.6, handC.y + ay / al * hw * 0.6, handC.x - nx * hw * 0.2 * sgn + ax / al * hw * 0.5, handC.y - ny * hw * 0.2 * sgn + ay / al * hw * 0.5);
          ctx.strokeStyle = P.kind === 'clay' ? 'rgba(80,40,30,0.5)' : P.ink; ctx.lineWidth = P.lw(P.kind === 'hatch' ? 0.9 : 1.2); ctx.stroke();
        }
        if (ch.watch && A.side === 1) { const wpt = { x: lerp(wr.x, el.x, 0.12), y: lerp(wr.y, el.y, 0.12) }; ctx.save(); ctx.translate(wpt.x, wpt.y); ctx.rotate(Math.atan2(el.y - wr.y, el.x - wr.x)); ctx.fillStyle = ch.watch; const ww = B.wristR * wr.s * 2.4; ctx.fillRect(-ww * 0.2, -ww / 2, ww * 0.42, ww); ctx.restore(); }
        if (probe) probe.arms[i] = { shoulder: sh, elbow: el, wrist: wr, hand: handC, handR: hw, tip, box, side: A.side, far };
      } };
    });
    // ---- neck + head + hair masses
    const headDepth = cam.cam(pose.head).z;
    const neck = { draw() { const a = pr(madd(pose.chest, pose.up, -0.02)), b = pr(pose.neckTop); P.chain(ctx, [{ a, b, ra: B.neckR * a.s, rb: B.neckR * 0.92 * b.s, color: C.skin }]); if (ch.collar) ch.collar(ctx, { a, b, P, pose, cam }); } };
    const hair = hairItems(cam, pose, ch, P).map((h) => ({ depth: cam.cam(h.key).z, draw: () => h.draw(ctx) }));
    const mood = { open: pose.rho * (0.45 + 0.25 * Math.sin(pose.t * 2.8 * PI)) + pose.post * 0.6, smile: pose.finished ? sstep((pose.t - 7.4) / 0.4) : 0.15 * (1 - pose.rho), brow: pose.rho * 0.04, squint: false };
    const head = { draw() {
      const H = headPixels(cam, pose, ch, P, probe);
      ctx.drawImage(H.cv, 0, 0, H.size, H.size, H.pc.x - H.ext, H.pc.y - H.ext, H.size, H.size);
      drawFace(ctx, cam, pose, ch, P, mood);
    } };
    // ---- order: far hair, far arm, legs, torso, neck, near arm, head, near hair
    const seq = [];
    for (const h of hair) if (h.depth > headDepth) seq.push(h);
    for (const a of armItems) if (a.depth > torsoDepth + 0.01) seq.push(a);
    seq.push(...legItems, torso, neck);
    for (const a of armItems) if (!(a.depth > torsoDepth + 0.01)) seq.push(a);
    seq.push(head);
    for (const h of hair) if (!(h.depth > headDepth)) seq.push(h);
    const names = seq.map((s) => s === head ? 'head' : s === torso ? 'torso' : s === neck ? 'neck' : legItems.includes(s) ? 'leg' + s.i : armItems.includes(s) ? 'arm' + s.i : 'hair');
    if (probe) probe.order = names;
    seq.forEach((it, k) => { if (!only || only.includes(names[k])) it.draw(); else if (only.includes(names[k] + ':lower')) it.draw(true); });
  }

  /* ---------- frame assembly ---------- */
  function renderFrame(ctx, design, motion, cam, t, opts = {}) {
    const P = design.painter, pose = E.pose(motion, t), probe = opts.probe ? { legs: [], arms: [], t } : null;
    P.setScale(opts.scale || 1);
    { const toC = cam.ortho ? mul(cam.w, -1) : norm(sub(cam.pos, pose.head)); P.light = norm(add(add(mul(toC, 0.75), V(0, 0.75, 0)), mul(cam.r, -0.35))); }
    if (opts.only) { drawCharacter(ctx, cam, pose, design.character, P, probe, opts.only); if (probe) probe.pose = pose; return { pose, probe }; }
    design.drawBackdrop(ctx, cam, P, t, opts);
    // runner's screen box, used to fade trees standing between the camera and the runner
    const rb = (() => { const pts = [pose.pel, pose.head, pose.feet[0].ball, pose.feet[1].ball, pose.arms[0].handTip, pose.arms[1].handTip].map((q) => cam.proj(q)); const r = cam.scaleAt(pose.head) * 0.25; return { x0: Math.min(...pts.map((p) => p.x)) - r, x1: Math.max(...pts.map((p) => p.x)) + r, y0: Math.min(...pts.map((p) => p.y)) - r, y1: Math.max(...pts.map((p) => p.y)) + r }; })();
    const runnerDepth = cam.cam(pose.pel).z;
    const items = design.items(cam, P, t, opts).map((it) => {
      const depth = cam.cam(it.key).z;
      let alpha = 1;
      if (it.bbox && depth < runnerDepth) { const b = it.bbox(cam); if (b) { const ix = Math.max(0, Math.min(b.x1, rb.x1) - Math.max(b.x0, rb.x0)), iy = Math.max(0, Math.min(b.y1, rb.y1) - Math.max(b.y0, rb.y0)), frac = (ix * iy) / Math.max(1, (rb.x1 - rb.x0) * (rb.y1 - rb.y0)); alpha = 1 - 0.85 * sstep(frac / 0.35); } }
      return { depth, draw: () => { if (alpha < 1) { ctx.save(); ctx.globalAlpha = alpha; it.draw(ctx, cam, P, t); ctx.restore(); } else it.draw(ctx, cam, P, t); } };
    });
    const runner = { depth: cam.cam(pose.pel).z, draw: () => {
      // contact shadows
      shadowEllipse(ctx, cam, pose.pel.x, pose.pel.z, 0.32, 0.2, design.shadowAlpha || 0.18, pose.yawB);
      for (const f of pose.feet) shadowEllipse(ctx, cam, f.ball.x - Math.cos(f.yaw) * 0.06, f.ball.z - Math.sin(f.yaw) * 0.06, 0.14, 0.07, (design.shadowAlpha || 0.18) * clamp(1 - f.ball.y * 4, 0, 1), f.yaw);
      drawCharacter(ctx, cam, pose, design.character, P, probe);
    } };
    items.push(runner);
    if (design.trail) items.push({ depth: 1e9, draw: () => design.trail(ctx, cam, P, motion, t) });
    items.sort((a, b) => b.depth - a.depth);
    for (const it of items) it.draw();
    if (design.overlayFX) design.overlayFX(ctx, cam, P, t, pose, motion, opts);
    if (probe) { probe.pose = pose; }
    return { pose, probe };
  }

  const api = { makePainter, renderFrame, drawCharacter, capsulePath, polyPath, smoothPath, projPoly, groundRect, groundEllipse, stripPoly, routeStrip, boxItem, postItem, treeItem, shadowEllipse, bboxOf, shade, mix, hex, hash, toHex };
  root.ParkRender = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Five original visual directions for the same two park actions (within = Dativ, into = Akkusativ).
   All five share the route geometry, the footstep plan and the 8-second preview pace from engine.js.
   They differ in character design, line/material treatment, park dressing, boundary type and camera. */
(function (root) {
  'use strict';
  const E = root.ParkEngine, R = root.ParkRender;
  const { V, add, sub, mul, norm, dot, clamp, lerp, sstep, PI, TAU, fwdOf, leftOf, wrapPi } = E;
  const { groundRect, groundEllipse, stripPoly, routeStrip, projPoly, polyPath, boxItem, postItem, treeItem, shade, hash, bboxOf } = R;

  /* ---------- shared park layout (metres) ---------- */
  const GATE = 1.2;
  const LOOP = (() => { // stadium-shaped jogging path round the pond; the 'within' route runs three quarters of it
    const pts = []; for (let x = -4.0; x <= 1.2; x += 0.4) pts.push([x, 6.4]);
    for (let i = 1; i <= 16; i++) { const a = -PI / 2 + i / 16 * PI; pts.push([1.2 + 2.6 * Math.cos(a), 9 + 2.6 * Math.sin(a)]); }
    for (let x = 0.8; x >= -4.0; x -= 0.4) pts.push([x, 11.6]);
    for (let i = 1; i <= 16; i++) { const a = PI / 2 + i / 16 * PI; pts.push([-4 + 2.6 * Math.cos(a), 9 + 2.6 * Math.sin(a)]); }
    return pts;
  })();
  const TREES = [[-9.2, 3.6, 1], [-7.4, 14.2, 2], [5.6, 4.0, 3], [7.6, 12.6, 4], [-11.2, 9.5, 5], [10.4, 7.8, 6], [3.6, 15.6, 7], [-3.4, 16.2, 8], [9.6, 2.2, 9], [-6.2, 2.0, 10], [11.2, 15.8, 11], [-11.6, 16.4, 12]];
  const BENCHES = [[-7.4, 8.6, PI / 2], [5.0, 13.2, -PI / 2], [-2.2, 3.2, 0]];

  function makeCtxHelpers(P) {
    return {
      ground(ctx, cam, pts, color, edge) { const pp = projPoly(cam, pts); if (pp.length > 2) P.ground(ctx, pp, color, edge); },
    };
  }

  // fence-like boundary split into short items (depth-sortable); kind decides the look
  function boundaryItems(kind, pal) {
    const items = [], segs = [];
    const addRun = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.0)); for (let i = 0; i < n; i++) segs.push([lerp(x0, x1, i / n), lerp(z0, z1, i / n), lerp(x0, x1, (i + 1) / n), lerp(z0, z1, (i + 1) / n)]); };
    addRun(-13, 0, -GATE - 0.2, 0); addRun(GATE + 0.2, 0, 13, 0); addRun(13, 0, 13, 18); addRun(-13, 0, -13, 18); addRun(-13, 18, 13, 18);
    for (const [x0, z0, x1, z1] of segs) items.push(segmentItem(kind, pal, x0, z0, x1, z1));
    return items;
  }
  function segmentItem(kind, pal, x0, z0, x1, z1) {
    const mid = V((x0 + x1) / 2, 0, (z0 + z1) / 2), Hs = { iron: 1.4, hedge: 1.0, clayhedge: 0.9, wall: 1.2, picket: 1.0 }[kind];
    return { key: mid, bbox(cam) { const pts = [V(x0, 0, z0), V(x1, 0, z1), V(x0, Hs, z0), V(x1, Hs, z1)].map((q) => cam.proj(q)); if (pts.some((q) => q.z < 0.05 && !cam.ortho)) return null; const b = bboxOf(pts); return { x0: b.x0, y0: b.y0, x1: b.x0 + b.w, y1: b.y0 + b.h }; }, draw(ctx, cam, P) {
      const p = (x, y, z) => cam.proj(V(x, y, z));
      if (kind === 'iron') { // wrought iron bars with rails
        const H = 1.35, n = 5; ctx.lineCap = 'round';
        for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), z = lerp(z0, z1, i / n), a = p(x, 0, z), b = p(x, H, z); if (a.z < cam.near && !cam.ortho) continue;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = pal.iron; ctx.lineWidth = Math.max(1, 0.028 * a.s); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - 0.04 * b.s, b.y + 0.08 * b.s); ctx.lineTo(b.x, b.y - 0.1 * b.s); ctx.lineTo(b.x + 0.04 * b.s, b.y + 0.08 * b.s); ctx.closePath(); ctx.fillStyle = pal.iron; ctx.fill(); }
        for (const y of [0.18, 1.12]) { const a = p(x0, y, z0), b = p(x1, y, z1); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = pal.iron; ctx.lineWidth = Math.max(1, 0.045 * Math.min(a.s, b.s)); ctx.stroke(); }
      } else if (kind === 'hedge' || kind === 'clayhedge') {
        const H = kind === 'hedge' ? 0.95 : 0.85, D = 0.35, dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), nx = -dz / L * D, nz = dx / L * D;
        const f = [V(x0 - nx, 0, z0 - nz), V(x1 - nx, 0, z1 - nz), V(x1 - nx, H, z1 - nz), V(x0 - nx, H, z0 - nz)];
        const b = [V(x0 + nx, 0, z0 + nz), V(x1 + nx, 0, z1 + nz), V(x1 + nx, H, z1 + nz), V(x0 + nx, H, z0 + nz)];
        const top = [f[3], f[2], b[2], b[3]];
        const toC = cam.toCam(mid), n = norm(V(-dz, 0, dx)), face = dot(n, toC) > 0 ? b : f;
        const pf = projPoly(cam, face), pt = projPoly(cam, top);
        const bump = (pts) => (g) => { // lumpy top edge
          g.moveTo(pts[0].x, pts[0].y); g.lineTo(pts[1].x, pts[1].y);
          const a = pts[2], c = pts[3], m = 4; for (let i = 0; i <= m; i++) { const t = i / m, x = lerp(a.x, c.x, t), y = lerp(a.y, c.y, t); g.quadraticCurveTo(x + (c.x - a.x) / m * -0.5, y - (kind === 'hedge' ? 0.1 : 0.14) * cam.scaleAt(mid), x, y); }
          g.closePath(); };
        if (pf.length === 4) P.shape(ctx, bump(pf), pal.hedgeSide, { box: bboxOf(pf) });
        if (pt.length === 4) P.shape(ctx, (g) => polyPath(g, pt), pal.hedgeTop, { box: bboxOf(pt), thin: true });
      } else if (kind === 'wall') { // low stone wall with a slim railing on top
        const H = 0.62, D = 0.22, dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), nx = -dz / L * D, nz = dx / L * D;
        const toC = cam.toCam(mid), n = norm(V(-dz, 0, dx)), s = dot(n, toC) > 0 ? 1 : -1;
        const face = [V(x0 + nx * s, 0, z0 + nz * s), V(x1 + nx * s, 0, z1 + nz * s), V(x1 + nx * s, H, z1 + nz * s), V(x0 + nx * s, H, z0 + nz * s)];
        const top = [V(x0 - nx, H, z0 - nz), V(x1 - nx, H, z1 - nz), V(x1 + nx, H, z1 + nz), V(x0 + nx, H, z0 + nz)];
        const pf = projPoly(cam, face), pt = projPoly(cam, top);
        if (pf.length > 2) { P.shape(ctx, (g) => polyPath(g, pf), pal.wall, { box: bboxOf(pf), thin: true, shadeSide: { x0: bboxOf(pf).x0, y0: bboxOf(pf).y0 + bboxOf(pf).h * 0.6, w: bboxOf(pf).w, h: bboxOf(pf).h } });
          ctx.save(); ctx.beginPath(); polyPath(ctx, pf); ctx.clip(); ctx.strokeStyle = pal.wallLine; ctx.lineWidth = P.lw(0.8);
          for (let r = 1; r < 3; r++) { const y = H * r / 3, a = cam.proj(V(face[0].x, y, face[0].z)), b = cam.proj(V(face[1].x, y, face[1].z)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          for (let i = 0; i < 4; i++) { const t = (i + (hash(x0 * 3 + z0) * 0.5)) / 4, r = i % 3, y0 = H * r / 3, y1 = H * (r + 1) / 3, x = lerp(face[0].x, face[1].x, t), z = lerp(face[0].z, face[1].z, t), a = cam.proj(V(x, y0, z)), b = cam.proj(V(x, y1, z)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          ctx.restore(); }
        if (pt.length > 2) P.shape(ctx, (g) => polyPath(g, pt), pal.wallTop, { box: bboxOf(pt), thin: true });
        const n2 = 5; for (let i = 0; i <= n2; i++) { const x = lerp(x0, x1, i / n2), z = lerp(z0, z1, i / n2), a = cam.proj(V(x, H, z)), b = cam.proj(V(x, H + 0.55, z)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = pal.rail; ctx.lineWidth = Math.max(1, 0.03 * a.s); ctx.stroke(); }
        { const a = cam.proj(V(x0, H + 0.55, z0)), b = cam.proj(V(x1, H + 0.55, z1)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = pal.rail; ctx.lineWidth = Math.max(1, 0.04 * a.s); ctx.stroke(); }
      } else if (kind === 'picket') {
        const H = 0.95, n = 9;
        { const a = cam.proj(V(x0, 0.3, z0)), b = cam.proj(V(x1, 0.3, z1)), c = cam.proj(V(x0, 0.72, z0)), d = cam.proj(V(x1, 0.72, z1)); ctx.lineCap = 'butt'; for (const [u, v] of [[a, b], [c, d]]) { ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(v.x, v.y); ctx.strokeStyle = pal.picketShade; ctx.lineWidth = Math.max(1.5, 0.07 * Math.min(u.s, v.s)); ctx.stroke(); } }
        for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), dx = (x1 - x0) / n * 0.32, dz = (z1 - z0) / n * 0.32;
          const pts = [V(x - dx, 0, z - dz), V(x + dx, 0, z + dz), V(x + dx, H - 0.08, z + dz), V(x, H, z), V(x - dx, H - 0.08, z - dz)].map((q) => cam.proj(q));
          if (pts[0].z < cam.near && !cam.ortho) continue; P.shape(ctx, (g) => polyPath(g, pts), pal.picket, { box: bboxOf(pts), thin: true }); }
      }
    } };
  }
  function gateItems(kind, pal, signWord) {
    const items = [];
    for (const sx of [-1, 1]) {
      const x = sx * (GATE + 0.22);
      if (kind === 'brick' || kind === 'stone' || kind === 'clay') items.push(boxItem({ x, z: 0, w: 0.46, d: 0.46, h: kind === 'clay' ? 1.5 : 2.0, colors: pal.pillar, noFade: true }));
      if (kind === 'brick' || kind === 'stone') items.push(boxItem({ x, z: 0, w: 0.56, d: 0.56, h: 0.1, y0: 2.0, colors: pal.cap, noFade: true }));
      if (kind === 'wood') items.push(postItem(x, 0, 2.5, 0.09, pal.wood));
      if (kind === 'clay') items.push({ key: V(x, 0, 0.05), draw(ctx, cam, P) { const c = cam.proj(V(x, 1.78, 0)), r = 0.3 * c.s; P.shape(ctx, (g) => { g.moveTo(c.x + r, c.y); g.arc(c.x, c.y, r, 0, TAU); }, pal.topiary, { box: { x0: c.x - r, y0: c.y - r, w: 2 * r, h: 2 * r } }); } });
    }
    // arch / sign spanning the opening
    items.push({ key: V(0, 0, 0.02), draw(ctx, cam, P) {
      const yA = kind === 'clay' ? 1.9 : kind === 'wood' ? 2.35 : 2.25, rise = kind === 'stone' ? 0 : 0.42, pts = [], pts2 = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20, x = lerp(-GATE - 0.22, GATE + 0.22, t), y = yA + Math.sin(t * PI) * rise; pts.push(cam.proj(V(x, y, 0))); pts2.push(cam.proj(V(x, y - (kind === 'wood' ? 0.12 : 0.1), 0))); }
      if (pts[10].z < cam.near && !cam.ortho) return;
      const band = [...pts, ...pts2.reverse()];
      if (kind !== 'stone') P.shape(ctx, (g) => polyPath(g, band), kind === 'brick' ? pal.iron : kind === 'wood' ? pal.wood : pal.arch, { box: bboxOf(band), thin: true });
      if (kind === 'wood' && pal.flowers) for (let i = 0; i < 16; i++) { const q = pts[(i * 5) % 21]; const r = 0.07 * q.s; ctx.beginPath(); ctx.arc(q.x + (hash(i) - 0.5) * 0.2 * q.s, q.y + (hash(i + 9) - 0.5) * 0.18 * q.s, r, 0, TAU); ctx.fillStyle = pal.flowers[i % pal.flowers.length]; ctx.fill(); }
      if (signWord) { // small name plate (the only scenic text)
        const c = cam.proj(V(0, yA + rise * 0.55 - (kind === 'stone' ? 0.25 : 0.2), -0.02)), w = 1.25 * c.s, h = 0.3 * c.s;
        if (!cam.ortho && c.z < 1.2) return;
        if (kind === 'stone') { // plate on the right pillar instead
          const q = cam.proj(V(GATE + 0.22, 1.45, -0.24)); if ((!cam.ortho && q.z < 1.2) || dot(V(0, 0, -1), cam.toCam(V(GATE + 0.22, 1.45, -0.24))) < 0.35) return; const ww = 0.36 * q.s, hh = 0.22 * q.s; ctx.fillStyle = pal.plate; ctx.fillRect(q.x - ww / 2, q.y - hh / 2, ww, hh); ctx.fillStyle = pal.plateInk; ctx.font = `600 ${Math.max(6, hh * 0.42)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(signWord, q.x, q.y); return; }
        ctx.save(); ctx.fillStyle = pal.plate; ctx.strokeStyle = P.ink; ctx.lineWidth = P.lw(1.2); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(c.x - w / 2, c.y - h / 2, w, h, h * 0.25) : ctx.rect(c.x - w / 2, c.y - h / 2, w, h); ctx.fill(); if (P.kind === 'ink' || P.kind === 'hatch') ctx.stroke();
        ctx.fillStyle = pal.plateInk; ctx.font = `700 ${Math.max(6, h * 0.62)}px ${pal.font || 'system-ui, sans-serif'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(signWord, c.x, c.y + h * 0.04); ctx.restore();
      }
    } });
    if (kind === 'stone') for (const sx of [-1, 1]) items.push({ key: V(sx * 1.9, 0, 0.6), draw(ctx, cam) { // open gate leaves swung inward
      const hx = sx * (GATE + 0.0), pts = [V(hx, 0.05, 0.02), V(hx + sx * 0.25, 0.05, 1.05), V(hx + sx * 0.25, 1.55, 1.05), V(hx, 1.55, 0.02)].map((q) => cam.proj(q));
      if (pts[0].z < cam.near && !cam.ortho) return; ctx.strokeStyle = pal.rail; ctx.lineWidth = Math.max(1, 0.035 * pts[0].s); ctx.beginPath(); polyPath(ctx, pts); ctx.stroke();
      for (let i = 1; i < 6; i++) { const a = cam.proj(V(hx + sx * 0.25 * i / 6, 0.05, 0.02 + 1.03 * i / 6)), b = cam.proj(V(hx + sx * 0.25 * i / 6, 1.55, 0.02 + 1.03 * i / 6)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } } });
    return items;
  }
  function benchItem(x, z, yaw, pal) {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    return { key: V(x, 0, z), draw(ctx, cam, P) {
      const L = (u, y, v) => cam.proj(V(x + c * u - s * v, y, z + s * u + c * v));
      const seat = [L(-0.8, 0.45, -0.22), L(0.8, 0.45, -0.22), L(0.8, 0.45, 0.2), L(-0.8, 0.45, 0.2)];
      const back = [L(-0.8, 0.5, 0.2), L(0.8, 0.5, 0.2), L(0.8, 0.92, 0.26), L(-0.8, 0.92, 0.26)];
      if (seat[0].z < cam.near && !cam.ortho) return;
      for (const u of [-0.7, 0.7]) for (const v of [-0.18, 0.18]) { const a = L(u, 0, v), b = L(u, 0.45, v); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = pal.benchLeg; ctx.lineWidth = Math.max(1, 0.05 * a.s); ctx.stroke(); }
      const backFirst = dot(V(-s, 0, c), cam.toCam(V(x, 0.5, z))) < 0;
      const draws = [() => P.shape(ctx, (g) => polyPath(g, seat), pal.bench, { box: bboxOf(seat), thin: true }), () => P.shape(ctx, (g) => polyPath(g, back), pal.benchBack || pal.bench, { box: bboxOf(back), thin: true })];
      if (backFirst) { draws[1](); draws[0](); } else { draws[0](); draws[1](); }
    } };
  }
  function lampItem(x, z, pal) { return { key: V(x, 0, z), draw(ctx, cam, P) { const a = cam.proj(V(x, 0, z)), b = cam.proj(V(x, 3.2, z)); if (a.z < cam.near && !cam.ortho) return; P.chain(ctx, [{ a, b, ra: 0.06 * a.s, rb: 0.04 * b.s, color: pal.lamp }]); const h = cam.proj(V(x, 3.35, z)); P.shape(ctx, (g) => { g.moveTo(h.x + 0.2 * h.s, h.y); g.ellipse(h.x, h.y, 0.2 * h.s, 0.28 * h.s, 0, 0, TAU); }, pal.lampGlass, { box: { x0: h.x - 0.2 * h.s, y0: h.y - 0.3 * h.s, w: 0.4 * h.s, h: 0.6 * h.s } }); } }; }
  function binItem(x, z, pal) { return boxItem({ x, z, w: 0.42, d: 0.42, h: 0.8, colors: pal.bin }); }
  function duckItem(x, z, pal, phase) { return { key: V(x, 0, z), draw(ctx, cam, P, t) { const tt = (t || 0) * 0.3 + phase, dx = Math.sin(tt) * 0.25, c = cam.proj(V(x + dx, 0.08, z)), r = 0.12 * c.s; ctx.beginPath(); ctx.ellipse(c.x, c.y, r * 1.3, r * 0.7, 0, 0, TAU); ctx.fillStyle = pal.duck; ctx.fill(); ctx.beginPath(); ctx.arc(c.x + r * 1.0, c.y - r * 0.8, r * 0.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8a33a'; ctx.beginPath(); ctx.moveTo(c.x + r * 1.45, c.y - r * 0.85); ctx.lineTo(c.x + r * 1.85, c.y - r * 0.7); ctx.lineTo(c.x + r * 1.45, c.y - r * 0.6); ctx.fill(); } }; }
  function buildingRow(z, x0, x1, pal, seed, faceDir = -1) {
    const items = []; let x = x0, i = 0;
    while (x < x1) { const w = 5 + hash(seed + i) * 4, h = 9 + hash(seed + i * 3) * 9, col = pal.buildings[i % pal.buildings.length];
      const bx = x + w / 2, item = boxItem({ x: bx, z, w: w - 0.2, d: 8, h, colors: { front: col, side: shade(col, -0.18), top: shade(col, -0.1) } });
      const draw0 = item.draw, ww = w, hh = h;
      item.draw = (ctx, cam, P) => { draw0(ctx, cam, P); // windows on the street-facing facade
        const fz = z + faceDir * 4; if (dot(V(0, 0, faceDir), cam.toCam(V(bx, 3, fz))) <= 0) return;
        ctx.fillStyle = pal.window; for (let r = 0; r < Math.floor(hh / 3); r++) for (let c = 0; c < Math.floor(ww / 1.6); c++) {
          const wx = bx - ww / 2 + 0.8 + c * 1.6, wy = 1.6 + r * 3, q = [V(wx, wy, fz), V(wx + 0.8, wy, fz), V(wx + 0.8, wy + 1.4, fz), V(wx, wy + 1.4, fz)].map((p) => cam.proj(p));
          if (q[0].z < cam.near && !cam.ortho) continue; ctx.beginPath(); polyPath(ctx, q); ctx.fill(); } };
      items.push(item); x += w; i++; }
    return items;
  }
  function kioskItem(x, z, pal) { // corner kiosk with awning
    const body = boxItem({ x, z, w: 2.2, d: 1.6, h: 2.3, colors: pal.kiosk });
    return { key: V(x, 0, z), draw(ctx, cam, P) { body.draw(ctx, cam, P);
      const pts = [V(x - 1.25, 2.3, z - 0.8), V(x + 1.25, 2.3, z - 0.8), V(x + 1.25, 1.9, z - 1.5), V(x - 1.25, 1.9, z - 1.5)].map((q) => cam.proj(q)); if (pts[0].z < cam.near && !cam.ortho) return;
      P.shape(ctx, (g) => polyPath(g, pts), pal.awning, { box: bboxOf(pts), thin: true });
      ctx.save(); ctx.beginPath(); polyPath(ctx, pts); ctx.clip(); for (let i = 0; i < 6; i += 2) { const a = [0, 1, 2, 3].map((k) => cam.proj(V(x - 1.25 + (i + (k === 1 || k === 2 ? 1 : 0)) * 2.5 / 6, k < 2 ? 2.3 : 1.9, k < 2 ? z - 0.8 : z - 1.5))); ctx.beginPath(); polyPath(ctx, a); ctx.fillStyle = pal.awning2; ctx.fill(); } ctx.restore(); } };
  }
  function bikeRack(x, z, pal) { return { key: V(x, 0, z), draw(ctx, cam) { ctx.strokeStyle = pal.iron; for (let i = 0; i < 3; i++) { const xx = x + i * 0.7, a = cam.proj(V(xx, 0, z)), pts = []; for (let k = 0; k <= 10; k++) { const ang = PI * k / 10; pts.push(cam.proj(V(xx + 0.3 * Math.cos(ang) - 0.0, 0.55 * Math.sin(ang), z))); } if (a.z < cam.near && !cam.ortho) continue; ctx.lineWidth = Math.max(1, 0.04 * a.s); ctx.beginPath(); polyPath(ctx, pts, false); ctx.stroke();
    // a parked bike
    if (i === 1) { const w1 = cam.proj(V(xx - 0.55, 0.33, z - 0.25)), w2 = cam.proj(V(xx + 0.55, 0.33, z - 0.25)), r = 0.33 * w1.s; ctx.lineWidth = Math.max(1, 0.035 * w1.s); ctx.beginPath(); ctx.arc(w1.x, w1.y, r, 0, TAU); ctx.moveTo(w2.x + r, w2.y); ctx.arc(w2.x, w2.y, r, 0, TAU); ctx.stroke(); const s1 = cam.proj(V(xx - 0.1, 0.85, z - 0.25)), h1 = cam.proj(V(xx + 0.45, 0.95, z - 0.25)); ctx.beginPath(); ctx.moveTo(w1.x, w1.y); ctx.lineTo(s1.x, s1.y); ctx.lineTo(h1.x, h1.y); ctx.lineTo(w2.x, w2.y); ctx.moveTo(s1.x, s1.y); ctx.lineTo(w1.x + (w2.x - w1.x) * 0.45, w1.y + (w2.y - w1.y) * 0.45 ); ctx.stroke(); } } } }; }
  function flowerBed(x, z, rx, rz, pal, seed) { return { key: V(x, 0, z + rz), draw(ctx, cam, P) { const pp = projPoly(cam, groundEllipse(x, z, rx, rz, 24, 0.02)); if (pp.length < 3) return; P.ground(ctx, pp, pal.bed, pal.bedEdge); for (let i = 0; i < 26; i++) { const a = hash(seed + i) * TAU, rr = Math.sqrt(hash(seed + i * 3)) * 0.85, q = cam.proj(V(x + Math.cos(a) * rx * rr, 0.12, z + Math.sin(a) * rz * rr)); ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1, 0.07 * q.s), 0, TAU); ctx.fillStyle = pal.flowers[i % pal.flowers.length]; ctx.fill(); } } }; }

  /* ---------- base world builder ---------- */
  function makeWorld(pal, opt) {
    const W = {};
    W.backdrop = (ctx, cam, P) => {
      const h = ctx.canvas.height, w = ctx.canvas.width, g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, pal.sky[0]); g.addColorStop(1, pal.sky[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const G = (pts, c, e) => { const pp = projPoly(cam, pts); if (pp.length > 2) P.ground(ctx, pp, c, e); };
      G(groundRect(-60, -60, 60, 80, -0.01), pal.far);
      G(groundRect(-60, -9.0, 60, -3.4), pal.street, null);
      if (pal.lane) for (let x = -40; x < 40; x += 4) G(groundRect(x, -6.3, x + 2, -6.1, 0.002), pal.lane);
      G(groundRect(-60, -3.4, 60, -3.2, 0.004), pal.curb);
      G(groundRect(-60, -3.2, 60, -0.8, 0.005), pal.sidewalk, pal.sidewalkEdge);
      if (pal.slabs) { ctx.strokeStyle = pal.slabs; ctx.lineWidth = P.lw(0.6); for (let x = -40; x < 40; x += 1.2) { const a = cam.proj(V(x, 0.006, -3.2)), b = cam.proj(V(x, 0.006, -0.8)); if (cam.cam(V(x, 0, -2)).z < cam.near && !cam.ortho) continue; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      G(groundRect(-60, -0.8, 60, 0, 0.004), pal.verge);
      G(groundRect(-60, -11.5, 60, -9.0, 0.004), pal.sidewalk);
      G(groundRect(-GATE - 0.1, -0.85, GATE + 0.1, 0.4, 0.007), pal.apron, pal.pathEdge);
      G(groundRect(-13, 0, 13, 18, 0.006), pal.lawn, pal.lawnEdge);
      if (pal.mow) { ctx.save(); const pp = projPoly(cam, groundRect(-13, 0, 13, 18, 0.006)); ctx.beginPath(); polyPath(ctx, pp); ctx.clip(); for (let x = -13; x < 13; x += 2) { const q = projPoly(cam, groundRect(x, 0, x + 1, 18, 0.0065)); if (q.length > 2) { ctx.beginPath(); polyPath(ctx, q); ctx.fillStyle = pal.mow; ctx.fill(); } } ctx.restore(); }
      G(stripPoly([[0, 0.2], [0, 6.4]], 2.0, 0.008), pal.path, pal.pathEdge);
      G(stripPoly([...LOOP, LOOP[0]], 1.7, 0.009), pal.path, pal.pathEdge);
      G(stripPoly([[-6.6, 9], [-11, 9]], 1.4, 0.008), pal.path, pal.pathEdge);
      G(stripPoly([[3.8, 9], [12.6, 9]], 1.4, 0.008), pal.path, pal.pathEdge);
      G(groundEllipse(-1.4, 9.0, 2.5, 1.35, 40, 0.012, 0.06, 4), pal.pondEdge || pal.pond);
      G(groundEllipse(-1.4, 9.0, 2.25, 1.15, 40, 0.014, 0.06, 4), pal.pond, pal.pondLine);
      if (opt.backdropExtra) opt.backdropExtra(ctx, cam, P);
    };
    const fixed = [];
    fixed.push(...boundaryItems(opt.boundary, pal), ...gateItems(opt.gate, pal, opt.sign));
    TREES.forEach(([x, z, s]) => fixed.push(treeItem(x, z, 4.6 + hash(s) * 2.2, 1.5 + hash(s + 4) * 0.6, pal.tree, s, opt.treeStyle && s % 3 === 0 ? opt.treeStyle : 'round')));
    BENCHES.forEach(([x, z, y]) => fixed.push(benchItem(x, z, y, pal)));
    fixed.push(lampItem(-6.2, -0.45, pal), lampItem(6.2, -0.45, pal), lampItem(-4.6, 6.0 - 1.2, pal), binItem(2.1, -0.45, pal));
    fixed.push(duckItem(-1.0, 9.3, pal, 0), duckItem(-2.2, 8.6, pal, 2));
    if (opt.kiosk) fixed.push(kioskItem(6.5, -1.6, pal));
    if (opt.bikes) fixed.push(bikeRack(3.0, -1.2, pal));
    if (opt.beds) fixed.push(flowerBed(3.4, 1.8, 1.0, 0.6, pal, 3), flowerBed(-3.6, 1.6, 1.1, 0.55, pal, 8));
    if (opt.buildings) fixed.push(...buildingRow(-15.5, -40, 40, pal, 3, 1), ...buildingRow(26, -40, 40, pal, 9, -1));
    if (opt.extra) fixed.push(...opt.extra);
    W.items = (cam) => fixed.filter((it) => { if (cam.ortho) return true; const d = sub(it.key, cam.pos); return Math.hypot(d.x, d.z) > (opt.cullNear || 1.4); });
    return W;
  }

  /* ---------- camera helpers ---------- */
  function railCam(M, o) { // damped follow, world-fixed offsets
    const F = E.followTrack(M, { omega: o.omega || 2.2, lead: o.lead || 0 });
    return (t) => { const f = F(t), k = o.kz ?? 1; return { pos: V(f.x * (o.kx ?? 1) + o.dx, o.h, (o.fz ?? 0) + f.z * k + o.dz), target: V(f.x * (o.tkx ?? 1) + (o.tx || 0), o.ty, f.z * (o.tkz ?? 1) + (o.tz || 0)), fov: o.fov, ortho: o.ortho, shiftY: o.shiftY || 0 }; };
  }
  function orbitCam(M, o) { // follow at an offset that rotates with the smoothed heading
    const F = E.followTrack(M, { omega: o.omega || 3, lead: o.lead || 0 }), FT = E.followTrack(M, { omega: o.tOmega || o.omega || 3, lead: o.lead || 0 });
    const H = 1 / 120, n = Math.ceil(E.CYCLE / H) + 2, yaws = new Float64Array(n); let y = null, vy = 0; const w = o.yawOmega || 1.6;
    for (let i = 0; i < n; i++) { const t = i * H, q = M.route.sOfT(t - E.RUN_START), ty = M.route.at(q.s + 0.6).yaw; if (y === null) y = ty; const tu = y + wrapPi(ty - y); vy += (w * w * (tu - y) - 2 * w * vy) * H; y += vy * H; yaws[i] = y; }
    return (t) => { const f = F(t), yaw = E.track(yaws, H, t), fw = fwdOf(yaw), rt = mul(leftOf(yaw), -1);
      const pos = V(f.x + fw.x * o.ahead + rt.x * o.side, o.h, f.z + fw.z * o.ahead + rt.z * o.side);
      const ft = FT(t); return { pos, target: V(ft.x + fw.x * (o.look || 0), o.ty, ft.z + fw.z * (o.look || 0)), fov: o.fov }; };
  }

  /* ======================================================================
     1. KIEZ INK — bold ink outlines, flat cel colour, warm late afternoon on a busy street corner.
     ====================================================================== */
  function closeNovel() {
    const pal = {
      sky: ['#e9e2cf', '#f3eddc'], far: '#d8d0b8', street: '#8b8f8a', lane: '#ece6d2', curb: '#c3bdaa', sidewalk: '#d6ccb4', sidewalkEdge: '#5b5446', slabs: 'rgba(60,50,40,0.25)', verge: '#9bad7c',
      apron: '#cfc2a2', lawn: '#a8bb83', lawnEdge: '#4b5a37', path: '#e0d3b0', pathEdge: '#6d6248', pond: '#86aeb0', pondEdge: '#cfc3a3', pondLine: '#3e6365',
      wall: '#b9ab90', wallTop: '#d4c7aa', wallLine: 'rgba(60,50,35,0.55)', rail: '#2f3a3a', pillar: { front: '#bfae8f', side: '#a39374', top: '#d3c4a6' }, cap: { front: '#d3c4a6', side: '#b5a688', top: '#e2d6bb' },
      plate: '#2f4b4a', plateInk: '#efe6cf', tree: { trunk: '#5f4c3a', leaf: '#6f8f5a', leafLight: '#8eaa70' }, bench: '#a8794d', benchLeg: '#2f3a3a', lamp: '#2f3a3a', lampGlass: '#f6ecc6',
      bin: { front: '#5d7a74', side: '#4c6660', top: '#6f8e87' }, duck: '#f4efe2', kiosk: { front: '#c9a46a', side: '#a98650', top: '#6d4c3a' }, awning: '#2f5d50', awning2: '#e9e2cf', buildings: ['#c8b79a', '#a9b0a6', '#c7a58b'], window: '#6a7470',
      bed: '#8f6a4c', bedEdge: '#3f2f22', flowers: ['#d0573b', '#f2e3b3', '#e7b04a'], iron: '#2f3a3a',
    };
    const world = makeWorld(pal, { boundary: 'wall', gate: 'stone', sign: 'Stadtpark', kiosk: true, beds: true, buildings: true, cullNear: 1.0 });
    const ch = {
      body: { headR: 0.105, headSY: 1.16, thighR: 0.072, kneeR: 0.048, ankleR: 0.032, shoeR: 0.046, upperArmR: 0.04, elbowR: 0.032, wristR: 0.024, handR: 0.043, neckR: 0.042,
        hipW: 0.165, hipD: 0.12, waistW: 0.13, waistD: 0.1, chestW: 0.165, chestD: 0.125, shoulderW: 0.185, thigh: 0.45, shin: 0.44, spine: 0.47, neck: 0.055, neckR: 0.05, headR: 0.112 },
      colors: { skin: '#d6a77a', skinShade: '#b07c55', hair: '#6b2f1a', hairShade: '#45190c', top: '#2f5d50', sleeve: '#f1ede4', bottom: '#2b2d33', legs: '#2b2d33', shin: '#2b2d33', shoe: '#d9622b', sole: '#f3efe6' },
      hair: { type: 'braid', length: 3.0, tie: '#d9622b', line: { front: 0.5, back: -0.7, side: 0.12, pow: 1.5, part: 0.06 } },
      face: { eyeStyle: 'almond', eyeAz: 0.36, eyeEl: 0.08, eyeW: 0.19, eyeH: 0.12, iris: 0.09, irisColor: '#4f7a4a', lidW: 1.8, browUp: 0.2, browW: 2.2, browTilt: 0.5, browColor: '#4a2414',
        noseEl: -0.1, noseLen: 0.24, noseW: 0.12, mouthEl: -0.46, mouthW: 0.2, lipColor: '#8a3f36', mouthLine: 1.6, ears: true, freckles: 'rgba(140,70,40,0.35)', blinkSeed: 2.2 },
      sleeve: 0.95, topHem: 0.25, shortsLen: 1.0, watch: '#1d1f22',
      topDetail(ctx, g) { // vest: white long-sleeve visible at the neckline
        const { neckTop, left, right } = g; ctx.beginPath(); ctx.moveTo(lerp(left[3].x, neckTop.x, 0.45), lerp(left[3].y, neckTop.y, 0.45)); ctx.quadraticCurveTo(neckTop.x, neckTop.y + (left[2].y - left[3].y) * 0.5, lerp(right[3].x, neckTop.x, 0.45), lerp(right[3].y, neckTop.y, 0.45)); ctx.strokeStyle = '#f1ede4'; ctx.lineWidth = g.P.lw(2.4); ctx.stroke(); },
    };
    const design = {
      id: 'close-novel', name: 'Close Graphic Novel', painter: R.makePainter('hatch', { ow: 2.2, ink: '#1e2224' }), character: ch, shadowAlpha: 0.2,
      summary: 'Adult proportions, close 3/4 front tracking camera at hip height. Brush ink with cross-hatched shadows on cream. Face and hands stay large; a small map keeps the location legible.',
      drawBackdrop: world.backdrop, items: world.items,
      camera: { within: (M) => orbitCam(M, { ahead: 3.5, side: -2.6, h: 1.3, ty: 0.9, fov: 40, omega: 2.0, tOmega: 7, lead: 0.15, yawOmega: 1.6 }),
                into: (M) => orbitCam(M, { ahead: 3.5, side: -2.6, h: 1.3, ty: 0.9, fov: 40, omega: 2.0, tOmega: 7, lead: 0.15, yawOmega: 1.6 }) },
      overlayFX(ctx, cam, P, t, pose, M, opts) { if (opts.noMap) return; miniMap(ctx, P, pose, M, { ink: '#1e2224', paper: 'rgba(243,237,220,0.94)', lawn: '#b9c79a', path: '#e0d3b0', boundary: '#2f3a3a', dot: '#d9622b' }); },
    };
    return design;
  }
  function miniMap(ctx, P, pose, M, c) {
    const W = ctx.canvas.width, s = P.scale, w = Math.round(118 * s), h = Math.round(86 * s), x0 = W - w - 10 * s, y0 = 10 * s;
    const mx = (x) => x0 + 8 * s + (x + 14) / 28 * (w - 16 * s), mz = (z) => y0 + h - 8 * s - (z + 4.5) / 23 * (h - 16 * s);
    ctx.save(); ctx.fillStyle = c.paper; ctx.strokeStyle = c.ink; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c.lawn; ctx.fillRect(mx(-13), mz(18), mx(13) - mx(-13), mz(0) - mz(18));
    ctx.strokeStyle = c.boundary; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(mx(-1.2), mz(0)); ctx.lineTo(mx(-13), mz(0)); ctx.lineTo(mx(-13), mz(18)); ctx.lineTo(mx(13), mz(18)); ctx.lineTo(mx(13), mz(0)); ctx.lineTo(mx(1.2), mz(0)); ctx.stroke();
    ctx.strokeStyle = c.ink; ctx.setLineDash([2 * s, 2 * s]); ctx.lineWidth = 1 * s; ctx.beginPath(); for (let q = 0; q <= M.route.S; q += 0.3) { const p = M.route.at(q); q ? ctx.lineTo(mx(p.x), mz(p.z)) : ctx.moveTo(mx(p.x), mz(p.z)); } ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = c.dot; ctx.beginPath(); ctx.arc(mx(pose.pel.x), mz(pose.pel.z), 3.4 * s, 0, TAU); ctx.fill(); ctx.strokeStyle = c.ink; ctx.lineWidth = 1 * s; ctx.stroke();
    ctx.restore();
  }

  /* ======================================================================
     4. PAPER STAGE — cut-paper collage with drop shadows and halftone; reverse angle from inside the park, so the runner arrives toward us.
     ====================================================================== */
  function isoCam(M, o) {
    const F = E.followTrack(M, { omega: o.omega });
    return (t, W, H) => { const f = F(t), dir = norm(V(1, 1.05, -1.25)), tg = V(f.x * 0.85, 0.7, f.z * 0.85 + 0.2); return { pos: add(tg, mul(dir, 40)), target: tg, ortho: o.scale * H }; };
  }

  const DESIGNS = [closeNovel()];
  // one body definition per design, shared by the motion engine and the renderer
  for (const d of DESIGNS) d.character.body = Object.assign({}, E.BASE_BODY, d.character.body);
  root.ParkDesigns = { DESIGNS, LOOP, GATE };
})(typeof window !== 'undefined' ? window : globalThis);


(function (root) {
  'use strict';
  const E = root.ParkEngine, R = root.ParkRender, D = root.ParkDesigns.DESIGNS[0], rigs = {};
  const rig = (route) => rigs[route] || (rigs[route] = (() => { const M = E.buildMotion(route, D.character.body); return { M, cam: D.camera[route](M) }; })());
  // t: seconds into the action (clamped to the one-off run: start, cruise, settled stop). opts.map=false hides the inset map.
  function draw(canvas, route, t, opts) {
    opts = opts || {}; const r = rig(route), ctx = canvas.getContext('2d'), tt = Math.max(0, Math.min(E.CYCLE, t));
    const spec = r.cam(tt, canvas.width, canvas.height), cam = E.makeCamera(spec, canvas.width, canvas.height);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    const out = R.renderFrame(ctx, D, r.M, cam, tt, { scale: canvas.width / 880, noMap: opts.map === false });
    if (opts.tag) { // a short phrase tag under the inset map (e.g. "im Park · Wo?")
      const sc = canvas.width / 880, W = canvas.width, mw = 118 * sc, x = W - mw / 2 - 10 * sc, y = 10 * sc + 86 * sc + 22 * sc;
      const u = Math.max(sc, 0.85 * (opts.dpr || 1));   // readable on phones: never below about 13 CSS pixels
      ctx.font = '700 ' + Math.round(15 * u) + 'px "Avenir Next", "Segoe UI", system-ui, sans-serif'; const tw = ctx.measureText(opts.tag).width + 20 * u, th = 26 * u;
      ctx.fillStyle = 'rgba(243,237,220,0.96)'; ctx.strokeStyle = opts.goal ? '#d9622b' : '#2f5d50'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.roundRect(Math.min(x - tw / 2, W - tw - 6 * sc), y - th / 2, tw, th, th / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(opts.tag, Math.min(x, W - tw / 2 - 6 * sc), y + 1);
    }
    ctx.restore(); return out;
  }
  root.GRAM_PARK = { draw, CYCLE: E.CYCLE, design: D.id };
})(typeof window !== 'undefined' ? window : globalThis);
