/* Deutschklinik film park with Liv (2D). Drop-in for grammatik/film-park.js: the same GRAM_PARK.draw(canvas, route, t, opts)
   the film player already calls, so every park scene shows Liv without touching a lesson, a cue or a recording.
   route 'into' = Akkusativ (she starts on the pavement and runs through the gate), 'within' = Dativ (she stays inside).
   Needs grammatik/liv/liv-art.js and grammatik/liv/engine.js first (index.html's loadFilmPark loads all three).

   The picture is a pure function of (route, t): each route is simulated once at 60 frames a second with a fixed random
   seed and stored, so seeking, replaying and resizing always show the same frame. */
(function (root) {
  'use strict';
  const L = root.LIV; if (!L || !L.SKINS.c01p) return;
  const { Actor, Camera, SKINS, ACT, drawGroups, loadArt, scn, D2R, TAU, clamp, lerp, hash } = L;
  const CYCLE = 8.0, FPS = 60, RUN_START = 0.7, GATE = 0, INK = '#3a1c0c', SKIN = SKINS.c01p;
  const rnd = (i) => hash(i * 7.31 + 1.7), recs = {};

  /* ---------- the run, recorded once per route ---------- */
  function record(route) {
    const random = Math.random; let seed = 20261113; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    try {
      const into = route === 'into', a = new Actor(SKIN, { x: into ? -3.4 : 1.6, z: 0, dir: 1 }), frames = [], dt = 1 / FPS;
      let camX = a.x + 0.9, stage = 0, done = 0;
      for (let i = 0; i <= CYCLE * FPS; i++) {
        const t = i * dt;
        if (stage === 0 && t >= RUN_START) { a.runTo(into ? 2.6 : 5.6, 0); stage = 1; }
        else if (stage === 1 && !a.target) { if (into) { stage = 3; done = t; } else { a.runTo(2.6, 0); stage = 2; } }
        else if (stage === 2 && !a.target) { stage = 3; done = t; }
        else if (stage === 3 && t > done + 0.2) { a.turnTo(0); a.play(into ? ACT.thumb : ACT.cheer, { dur: 1.8 }); stage = 4; }
        a.update(dt);
        camX = lerp(camX, a.x + a.dir * (a.v > 0.3 ? 0.5 : 0.1), 1 - Math.exp(-dt * 3.2));
        frames.push({ pose: JSON.parse(JSON.stringify(a.ch.pose)), sway: a.ch.sway.slice(), hair: a.ch.hairOff.slice(), camX, moving: stage >= 1 });
      }
      return { ch: a.ch, frames };
    } finally { Math.random = random; }
  }
  // the stored state at time t (exported for tests: the same t always gives the same state)
  function frameAt(route, t) {
    const key = route === 'into' ? 'into' : 'within', r = recs[key] || (recs[key] = record(key));
    return { r, f: r.frames[clamp(Math.round(clamp(t, 0, CYCLE) * FPS), 0, r.frames.length - 1)], into: key === 'into' };
  }

  /* ---------- scenery ---------- */
  function tree(ctx, cm, x, z, h, hue, u) {
    const b = cm.project([x, 0, z]), t = cm.project([x, h * 0.55, z]), s = b[3];
    ctx.lineJoin = 'round'; ctx.fillStyle = '#8a5a35'; ctx.strokeStyle = INK; ctx.lineWidth = Math.max(u, s * 0.006);
    ctx.beginPath(); ctx.moveTo(b[0] - 0.07 * s, b[1]); ctx.lineTo(b[0] - 0.045 * s, t[1]); ctx.lineTo(b[0] + 0.045 * s, t[1]); ctx.lineTo(b[0] + 0.07 * s, b[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    const blobs = [[0, 0.78, 0.44], [-0.34, 0.62, 0.34], [0.34, 0.62, 0.34], [-0.16, 0.95, 0.3], [0.2, 0.93, 0.3]];
    const path = () => { ctx.beginPath(); for (const [dx, dy, r] of blobs) { ctx.moveTo(b[0] + dx * h * s * 0.6 + r * h * s * 0.6, b[1] - dy * h * s); ctx.arc(b[0] + dx * h * s * 0.6, b[1] - dy * h * s, r * h * s * 0.6, 0, TAU); } };
    path(); ctx.lineWidth = Math.max(2 * u, s * 0.012); ctx.stroke(); path(); ctx.fillStyle = hue; ctx.fill();
  }
  function post(ctx, cm, x, z, u) {
    scn.box(ctx, cm, x - 0.11, 0, z - 0.09, x + 0.11, 1.56, z + 0.09, { front: '#d8cdb8', top: '#ece4d2', side: '#b9ac94' }, INK, 1.4 * u);
    scn.box(ctx, cm, x - 0.15, 1.56, z - 0.12, x + 0.15, 1.65, z + 0.12, { front: '#c2b59c', top: '#e0d6c0', side: '#a59880' }, INK, 1.4 * u);
  }
  function background(ctx, cm, W, H, into, moving, t, u) {
    const hz = cm.project([cm.target[0], 0, -7])[1], g = ctx.createLinearGradient(0, 0, 0, Math.max(1, hz)); g.addColorStop(0, '#cfe6ee'); g.addColorStop(1, '#f6efe0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz + 1);
    const par = -cm.target[0] * cm.zoom * 0.12; ctx.fillStyle = '#c9dcc2'; ctx.beginPath(); ctx.moveTo(0, hz);
    for (let x = 0; x <= W + 40 * u; x += 40 * u) ctx.lineTo(x, hz - (46 + 26 * Math.sin((x - par) / u * 0.006) + 14 * Math.sin((x - par) / u * 0.017 + 1)) * u * 0.6);
    ctx.lineTo(W, hz); ctx.closePath(); ctx.fill();
    const G = (x0, x1, z0, z1, fill) => scn.poly(ctx, cm, [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], fill);
    G(-30, GATE, -7, 9, '#e3dccd'); G(GATE, 40, -7, 9, '#b9d49a'); G(-30, GATE, -0.5, 0.55, '#d6cebd'); G(GATE, 40, -0.42, 0.42, '#ead9b0');
    ctx.strokeStyle = 'rgba(58,28,12,.22)'; ctx.lineWidth = u; for (let x = -30; x < GATE; x += 0.8) { const a = cm.project([x, 0, -0.5]), b = cm.project([x, 0, 0.55]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    for (let i = 0; i < 6; i++) {
      const x = -2.2 - i * 2.3, h = 1.9 + rnd(i) * 0.7, c = ['#f1d9b5', '#e9c3a6', '#dfd3bd', '#f0cfa0'][i % 4];
      scn.box(ctx, cm, x - 1.05, 0, -3.4, x + 1.05, h, -2.6, { front: c, top: '#c8a98a', side: '#cdb695' }, INK, 1.3 * u); scn.poly(ctx, cm, [[x - 1.15, h, -2.6], [x, h + 0.75, -2.6], [x + 1.15, h, -2.6]], '#b8553f', INK, 1.3 * u);
      for (const wx of [-0.5, 0.5]) for (const wy of [0.9, 1.7]) scn.poly(ctx, cm, [[x + wx - 0.2, wy, -2.59], [x + wx + 0.2, wy, -2.59], [x + wx + 0.2, wy + 0.45, -2.59], [x + wx - 0.2, wy + 0.45, -2.59]], '#cfe3ea', INK, u);
    }
    const pond = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; pond.push([6.3 + Math.cos(a) * 1.7, 0, -2.3 + Math.sin(a) * 0.7]); } scn.poly(ctx, cm, pond, '#9fd0df', INK, 1.3 * u);
    for (let x = GATE + 0.4; x < 40; x += 0.95) { const q = cm.project([x, 0.5, -4.4]); ctx.beginPath(); ctx.arc(q[0], q[1], 0.62 * q[3], 0, TAU); ctx.fillStyle = '#86b46b'; ctx.fill(); }
    [[1.5, -3.4, 2.1, '#7fb069'], [3.6, -3.9, 2.5, '#6aa65c'], [8.6, -3.3, 2.3, '#7fb069'], [10.4, -3.8, 2.6, '#6aa65c'], [12.6, -3.1, 2.2, '#86b46b'], [-1.3, -2.3, 1.9, '#8fba74']].forEach((p) => tree(ctx, cm, p[0], p[1], p[2], p[3], u));
    for (const x of [2.72, 3.5]) scn.box(ctx, cm, x, 0, -1.55, x + 0.05, 0.3, -1.3, { front: '#6b4a2c', side: '#553a22' }, INK, u);
    scn.box(ctx, cm, 2.6, 0.3, -1.6, 3.65, 0.35, -1.25, { front: '#b98450', top: '#d9a868' }, INK, 1.2 * u); for (const y of [0.44, 0.56]) scn.box(ctx, cm, 2.6, y, -1.62, 3.65, y + 0.08, -1.6, { front: '#c79258', top: '#d9a868' }, INK, 1.2 * u);
    for (let i = 0; i < 26; i++) { const q = cm.project([0.6 + rnd(i) * 13, 0.07, -0.75 - rnd(i + 50) * 1.6]); ctx.fillStyle = ['#ffffff', '#f6d255', '#f29b9b'][i % 3]; ctx.beginPath(); ctx.arc(q[0], q[1], 0.03 * q[3], 0, TAU); ctx.fill(); }
    post(ctx, cm, GATE, -0.72, u);
    // the grammar on the ground: a path through the gate (Wohin?) or the place she stays in (Wo?)
    if (!moving) return;
    if (into) {
      ctx.save(); ctx.strokeStyle = '#d9622b'; ctx.fillStyle = '#d9622b'; ctx.lineWidth = 4 * u; ctx.lineCap = 'round'; ctx.setLineDash([11 * u, 9 * u]); ctx.lineDashOffset = -t * 36 * u;
      const a = cm.project([-1.7, 0.01, 0.48]), b = cm.project([1.25, 0.01, 0.48]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(b[0] + 16 * u, b[1]); ctx.lineTo(b[0] - 4 * u, b[1] - 10 * u); ctx.lineTo(b[0] - 4 * u, b[1] + 10 * u); ctx.closePath(); ctx.fill(); ctx.restore();
    } else {
      ctx.save(); ctx.globalAlpha = 0.2; G(GATE + 0.1, 10.5, -4, 1.4, '#2f5d50'); ctx.restore();
      ctx.save(); ctx.setLineDash([8 * u, 7 * u]); scn.poly(ctx, cm, [[GATE + 0.1, 0, -4], [10.5, 0, -4], [10.5, 0, 1.4], [GATE + 0.1, 0, 1.4]], null, '#2f5d50', 2.4 * u); ctx.restore();
    }
  }
  // drawn in front of Liv: the near gate post with the park sign, and tufts of grass at the bottom edge
  function foreground(cm, groups, u) {
    groups.push({ d: 0.7, shapes: [{ t: 'fn', fn(c) {
      post(c, cm, GATE, 0.72, u);
      const a = cm.project([GATE - 0.06, 1.65, 0.72]), b = cm.project([GATE - 0.06, 1.65, -0.72]), s = a[3];
      c.fillStyle = '#5d7a52'; c.strokeStyle = INK; c.lineWidth = 1.4 * u; scn.rrect(c, Math.min(a[0], b[0]) - 0.5 * s, b[1] - 0.3 * s, 1.0 * s, 0.26 * s + (a[1] - b[1]), 0.05 * s); c.fill(); c.stroke();
      c.fillStyle = '#fffaf0'; c.font = '600 ' + 0.125 * s + 'px "Avenir Next", "Segoe UI", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('STADTPARK', (a[0] + b[0]) / 2, b[1] - 0.17 * s + (a[1] - b[1]) / 2);
    } }] });
    for (let i = 0; i < 9; i++) {
      const x = -5 + i * 2.1 + rnd(i) * 0.8, z = 0.95 + rnd(i + 9) * 0.3;
      groups.push({ d: z, shapes: [{ t: 'fn', fn(c) { const q = cm.project([x, 0, z]), s = q[3]; c.strokeStyle = x > GATE ? '#5f9450' : '#9aa58a'; c.lineWidth = 0.016 * s; c.lineCap = 'round'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(q[0] + k * 0.03 * s, q[1]); c.quadraticCurveTo(q[0] + k * 0.05 * s, q[1] - 0.09 * s, q[0] + k * 0.085 * s, q[1] - (0.16 - Math.abs(k) * 0.02) * s); c.stroke(); } } }] });
    }
  }

  /* ---------- one frame ---------- */
  let last = null, waiting = false;
  // t: seconds into the action, clamped to the one-off run (start, run, settled stop). opts: { tag, goal, dpr }
  function draw(canvas, route, t, opts) {
    opts = opts || {}; const { r, f, into } = frameAt(route, t), ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height, u = W / 880;
    const cam = new Camera(); cam.pitch = 7 * D2R; cam.dist = 60; cam.zoom = Math.min(W / 4.4, H / 2.16); cam.target = [f.camX, 0.93, 0]; cam.cx = W / 2; cam.cy = H * 0.5; cam.update();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    background(ctx, cam, W, H, into, f.moving, clamp(t, 0, CYCLE), u);
    const groups = []; foreground(cam, groups, u);
    if (SKIN.art.ready) {
      const ch = r.ch; ch.pose = f.pose; ch.sway = f.sway; ch.hairOff = f.hair; ch.viewName = null; ch.headView = null; ch.solve();
      ch.drawShadow(ctx, cam); ch.draw(cam, groups);
    } else if (!waiting) { waiting = true; loadArt(SKIN).then(() => { waiting = false; if (last && last[0].isConnected !== false) draw.apply(null, last); }); }   // the art is still decoding: show her as soon as it is ready
    drawGroups(ctx, groups, INK);
    if (opts.tag) {   // a short phrase tag in the top right corner (e.g. "im Park · Wo?")
      const k = Math.max(u, 0.85 * (opts.dpr || 1));   // readable on phones: never below about 13 CSS pixels
      ctx.font = '700 ' + Math.round(15 * k) + 'px "Avenir Next", "Segoe UI", system-ui, sans-serif'; const tw = ctx.measureText(opts.tag).width + 20 * k, th = 26 * k, x = W - tw - 10 * u, y = 10 * u + th / 2;
      ctx.fillStyle = 'rgba(243,237,220,0.96)'; ctx.strokeStyle = opts.goal ? '#d9622b' : '#2f5d50'; ctx.lineWidth = 2 * k; scn.rrect(ctx, x, y - th / 2, tw, th, th / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(opts.tag, x + tw / 2, y + k);
    }
    ctx.restore(); last = [canvas, route, t, opts];
  }
  root.GRAM_PARK = { draw, CYCLE, design: 'liv-2d', frameAt };
})(typeof window !== 'undefined' ? window : globalThis);
