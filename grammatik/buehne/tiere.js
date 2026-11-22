/* The animal kit and the case rings (plan §1.3, §1.4, M2), drawn in Canvas 2D in the village's flat style.
   - Animals: the dog (der Hund), Minka the cat (die Katze), a beach ball (der Ball), birds (die Vögel), a backpack.
     Each is an actor in metres on the set's ground (x, d), walks or runs to a target, faces left or right, and has
     its own idle life (a wagging tail, breathing, ears). Drawn on two canvases around the Rive people:
     #fxb (behind the people: the back half of the rings, shadows) and #fx (in front: animals, the rings' front half,
     badges, flying things).
   - Case rings: a coloured ellipse on the ground around whoever is subject (N, amber) or object (A, teal), with the
     letter for colour-blind learners. Arrow and pin are not cases (plan §1.4), so they are not here.
   Nothing here holds lesson text. */
const TAU = Math.PI * 2;
export const CASE = { n: { col: '#d48a12', soft: 'rgba(252,240,217,.55)', l: 'N' }, a: { col: '#0b8579', soft: 'rgba(220,243,239,.55)', l: 'A' },
  d: { col: '#7c3aed', soft: 'rgba(241,234,254,.55)', l: 'D' }, g: { col: '#4b5d73', soft: 'rgba(230,235,241,.55)', l: 'G' } };
const ease = (k) => k * k * (3 - 2 * k);

export function createFx(B) {
  const back = document.getElementById('fxb'), front = document.getElementById('fx'), set = B.set;
  const F = { animals: {}, rings: [], flyers: [], birds: null, pack: null };

  /* ---------- animals ---------- */
  // h = the animal's height in metres, used for its ring and its feet
  const KIND = { dog: { h: 0.62, speed: 1.6, run: 3.6, ring: 0.42 }, cat: { h: 0.4, speed: 1.0, run: 3.2, ring: 0.3 }, ball: { h: 0.24, speed: 1.4, run: 3.4, ring: 0.2 } };
  function animal(key, kind, { x = 0, d = 0.15, left = false, show = false } = {}) {
    const a = { key, kind, K: KIND[kind], x, d, left, show, tx: null, speed: 1, running: false, t: Math.random() * 10, hop: 0, spin: 0, alpha: show ? 1 : 0, mood: 'idle', look: 0 };
    F.animals[key] = a; return a;
  }
  function moveTo(a, x, { run = false, speed } = {}) {
    a.tx = x; a.running = run; a.speed = speed || (run ? a.K.run : a.K.speed); a.left = x < a.x; a.show = true;
    return B.until(() => a.tx === null);
  }
  const placeA = (a, x, { d = a.d, left = a.left, show = true } = {}) => { a.x = x; a.d = d; a.left = left; a.show = show; a.tx = null; a.running = false; };
  function hop(a) { a.hop = 1; }

  /* ---------- rings ---------- */
  // ring(target, case): target is a Rive actor (B.A.max) or an animal; on → fades in; ringOff(target) fades out
  function ring(target, c) {
    let r = F.rings.find((q) => q.target === target);
    if (!r) { r = { target, c, k: 0, want: 1, pulse: 1 }; F.rings.push(r); } else { r.pulse = r.c !== c ? 1 : r.pulse; r.c = c; r.want = 1; }
  }
  const ringOff = (target) => { const r = F.rings.find((q) => q.target === target); if (r) r.want = 0; };
  const ringsOff = () => F.rings.forEach((r) => (r.want = 0));

  /* ---------- the frame ---------- */
  function fit(cv) { const w = Math.round(set.V.W * set.V.dpr), h = Math.round(set.V.H * set.V.dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h); c.setTransform(set.V.dpr, 0, 0, set.V.dpr, 0, 0); return c; }
  B.onFrame.push((t, dt) => {
    const cb = fit(back), cf = fit(front), Z = set.V.cam.z;
    for (const a of Object.values(F.animals)) {               // move
      a.t += dt; a.alpha += ((a.show ? 1 : 0) - a.alpha) * Math.min(1, dt * 6); a.hop = Math.max(0, a.hop - dt * 2.4);
      if (a.tx !== null) { const dir = Math.sign(a.tx - a.x), mv = a.speed * dt; if (Math.abs(a.tx - a.x) <= mv) { a.x = a.tx; a.tx = null; a.running = false; } else a.x += dir * mv; if (a.kind === 'ball') a.spin += dir * mv / 0.12; }
    }
    for (const r of F.rings) { r.k += (r.want - r.k) * Math.min(1, dt * 5); r.pulse = Math.max(0, r.pulse - dt * 1.5); }
    F.rings = F.rings.filter((r) => r.want > 0 || r.k > 0.02);
    // what stands where, back to front
    const items = [...Object.values(F.animals).filter((a) => a.alpha > 0.02).map((a) => ({ d: a.d, draw: () => drawAnimal(cf, a, Z) }))];
    for (const r of F.rings) drawRing(cb, cf, r, Z, t);
    if (F.pack) items.push({ d: F.pack.d, draw: () => drawPack(cf, F.pack, Z) });
    items.sort((p, q) => p.d - q.d).forEach((it) => it.draw());
    for (const f of F.flyers) drawFlyer(cf, f, Z);
    if (F.birds) drawBirds(cf, F.birds, t, Z);
  });

  function where(target) {           // feet position, size and ring radius of a Rive actor or an animal
    if (target.K) { const f = set.foot(target.x, target.d); return { x: f.x, y: f.y, k: f.k, r: target.K.ring, alpha: target.alpha }; }
    const f = set.foot(target.x, target.d); return { x: f.x, y: f.y, k: f.k, r: target.C.m * 0.2, alpha: target.show ? 1 : 0 };
  }
  function drawRing(cb, cf, r, Z, t) {
    const w = where(r.target); if (!w.alpha) return;
    const C = CASE[r.c], rx = w.r * Z * w.k * (1 + 0.25 * r.pulse * Math.sin(t * 12)), ry = rx * 0.3, a = r.k * w.alpha;
    for (const [c, half] of [[cb, 'back'], [cf, 'front']]) {
      c.save(); c.globalAlpha = a; c.beginPath();
      if (half === 'back') c.ellipse(w.x, w.y, rx, ry, 0, Math.PI, TAU); else c.ellipse(w.x, w.y, rx, ry, 0, 0, Math.PI);
      if (half === 'back') { c.fillStyle = C.soft; c.save(); c.beginPath(); c.ellipse(w.x, w.y, rx, ry, 0, 0, TAU); c.fill(); c.restore(); }
      c.strokeStyle = C.col; c.lineWidth = Math.max(2.5, Z * 0.035); c.lineCap = 'round'; c.shadowColor = C.col; c.shadowBlur = 8 + 10 * r.pulse; c.stroke(); c.restore();
    }
    // the letter badge at the ring's front right
    const bx = w.x + rx * 0.78, by = w.y + ry * 0.75, br = Math.max(9, Z * 0.085);
    cf.save(); cf.globalAlpha = a; cf.fillStyle = C.col; cf.beginPath(); cf.arc(bx, by, br, 0, TAU); cf.fill();
    cf.strokeStyle = '#fff'; cf.lineWidth = Math.max(1.5, br * 0.16); cf.stroke();
    cf.fillStyle = '#fff'; cf.font = `800 ${br * 1.15}px Inter, system-ui, sans-serif`; cf.textAlign = 'center'; cf.textBaseline = 'middle'; cf.fillText(C.l, bx, by + br * 0.05); cf.restore();
  }

  /* ---------- drawing the animals (side view, facing right; mirrored for left) ---------- */
  function drawAnimal(c, a, Z) {
    const f = set.foot(a.x, a.d), s = Z * f.k;                // pixels per metre at its depth
    c.save(); c.globalAlpha = a.alpha; c.translate(f.x, f.y);
    // a soft shadow
    if (!a.raise) { c.fillStyle = 'rgba(40,60,30,.18)'; c.beginPath(); c.ellipse(0, 0, s * a.K.h * (a.kind === 'ball' ? 0.45 : 0.62), s * 0.04, 0, 0, TAU); c.fill(); }
    const lift = Math.sin(Math.PI * a.hop) * s * (a.kind === 'ball' ? 0.25 : 0.18);
    c.translate(0, -lift - (a.raise || 0) * s);        // raise: carried above the ground (the ball in the dog's mouth)
    if (a.left) c.scale(-1, 1); c.scale(s, s);
    if (a.kind === 'dog') dog(c, a); else if (a.kind === 'cat') cat(c, a); else ball(c, a);
    c.restore();
  }
  function leg(c, x, y, len, ang, w, col, paw) {
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = col; c.beginPath(); c.roundRect ? c.roundRect(-w / 2, 0, w, len, w / 2) : c.rect(-w / 2, 0, w, len); c.fill();
    c.fillStyle = paw; c.beginPath(); c.ellipse(w * 0.25, len - w * 0.1, w * 0.75, w * 0.42, 0, 0, TAU); c.fill(); c.restore();
  }
  function dog(c, a) {
    const t = a.t, run = a.running, ph = t * (run ? 13 : 0), sw = run ? 0.75 : 0, bob = run ? Math.abs(Math.sin(ph)) * 0.035 : Math.sin(t * 2.2) * 0.004;
    const fur = '#b8743d', dark = '#8a5228', light = '#f3e2c8', paw = '#f3e2c8';
    c.translate(0, -bob);
    // far legs (darker), then body, near legs
    leg(c, 0.17, -0.36, 0.33, Math.sin(ph + 0.6) * sw, 0.065, dark, '#d9c4a5'); leg(c, -0.2, -0.36, 0.33, Math.sin(ph + Math.PI + 0.6) * sw, 0.07, dark, '#d9c4a5');
    // tail: wags (fast when happy, straight back when running)
    const wag = run ? 0.2 * Math.sin(t * 9) : 0.55 * Math.sin(t * (a.mood === 'happy' ? 16 : 7));
    c.save(); c.translate(-0.29, -0.43); c.rotate(-0.9 + wag + (run ? 0.6 : 0)); c.strokeStyle = fur; c.lineWidth = 0.05; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-0.02, -0.12, 0.05, -0.2); c.stroke();
    c.fillStyle = light; c.beginPath(); c.arc(0.05, -0.2, 0.028, 0, TAU); c.fill(); c.restore();
    // body
    c.fillStyle = fur; c.beginPath(); c.ellipse(-0.01, -0.42, 0.31, 0.13, run ? Math.sin(ph) * 0.06 : 0, 0, TAU); c.fill();
    c.fillStyle = light; c.beginPath(); c.ellipse(0.04, -0.35, 0.2, 0.06, 0, 0, TAU); c.fill();
    c.fillStyle = dark; c.beginPath(); c.ellipse(-0.1, -0.5, 0.11, 0.06, 0.2, 0, TAU); c.fill();       // a dark patch on the back
    leg(c, 0.2, -0.36, 0.33, Math.sin(ph) * sw, 0.07, fur, paw); leg(c, -0.17, -0.36, 0.33, Math.sin(ph + Math.PI) * sw, 0.075, fur, paw);
    // neck and head
    const hx = 0.31, hy = -0.6 + (run ? Math.sin(ph) * 0.015 : 0), look = a.look;
    c.fillStyle = fur; c.beginPath(); c.moveTo(0.16, -0.5); c.quadraticCurveTo(0.24, -0.62, hx, hy - 0.04); c.lineTo(hx + 0.05, hy + 0.08); c.quadraticCurveTo(0.26, -0.42, 0.2, -0.36); c.fill();
    c.save(); c.translate(hx, hy); c.rotate(look);
    c.fillStyle = fur; c.beginPath(); c.arc(0, 0, 0.115, 0, TAU); c.fill();
    c.fillStyle = light; c.beginPath(); c.ellipse(0.11, 0.035, 0.085, 0.058, 0.1, 0, TAU); c.fill();     // snout
    c.fillStyle = '#2a1d16'; c.beginPath(); c.ellipse(0.185, 0.012, 0.027, 0.021, 0, 0, TAU); c.fill(); // nose
    c.fillStyle = '#2a1d16'; c.beginPath(); c.arc(0.04, -0.03, 0.018, 0, TAU); c.fill();                // eye
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0.046, -0.037, 0.006, 0, TAU); c.fill();
    if (run || a.mood === 'happy') { c.fillStyle = '#e7738a'; c.beginPath(); c.ellipse(0.12, 0.095, 0.03, 0.045, 0.3, 0, TAU); c.fill(); }   // tongue
    // the floppy ear (it flies back when running)
    const flap = run ? -0.6 + 0.3 * Math.sin(ph * 1.1) : 0.1 * Math.sin(t * 2.4);
    c.save(); c.translate(-0.04, -0.07); c.rotate(flap); c.fillStyle = dark; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-0.09, 0.03, -0.07, 0.15); c.quadraticCurveTo(-0.02, 0.17, 0.03, 0.06); c.closePath(); c.fill(); c.restore();
    c.restore();
    // the red collar with a golden tag
    c.strokeStyle = '#d2453b'; c.lineWidth = 0.035; c.beginPath(); c.moveTo(0.2, -0.56); c.lineTo(0.27, -0.46); c.stroke();
    c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(0.26, -0.43, 0.022, 0, TAU); c.fill();
  }
  function cat(c, a) {
    const t = a.t, run = a.running, ph = t * (run ? 14 : 0), sw = run ? 0.7 : 0, bob = run ? Math.abs(Math.sin(ph)) * 0.025 : 0;
    const fur = '#8f8f9a', dark = '#5e5e6a', white = '#f4f1ec';
    c.translate(0, -bob);
    leg(c, 0.11, -0.22, 0.21, Math.sin(ph + 0.6) * sw, 0.04, dark, '#d6d3cc'); leg(c, -0.13, -0.22, 0.21, Math.sin(ph + Math.PI + 0.6) * sw, 0.045, dark, '#d6d3cc');
    // the long tail: an S that sways
    const sway = Math.sin(t * 1.6) * 0.15;
    c.strokeStyle = fur; c.lineWidth = 0.035; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.19, -0.27);
    if (run) c.bezierCurveTo(-0.3, -0.3, -0.38, -0.3, -0.45, -0.34); else c.bezierCurveTo(-0.3, -0.3, -0.3 + sway, -0.48, -0.2 + sway, -0.55); c.stroke();
    c.fillStyle = fur; c.beginPath(); c.ellipse(0, -0.27, 0.2, 0.075, 0, 0, TAU); c.fill();
    c.strokeStyle = dark; c.lineWidth = 0.018; for (const sx of [-0.1, -0.03, 0.04]) { c.beginPath(); c.moveTo(sx, -0.34); c.quadraticCurveTo(sx + 0.02, -0.29, sx - 0.005, -0.24); c.stroke(); }   // tabby stripes
    leg(c, 0.13, -0.22, 0.21, Math.sin(ph) * sw, 0.045, fur, white); leg(c, -0.11, -0.22, 0.21, Math.sin(ph + Math.PI) * sw, 0.05, fur, white);
    const hx = 0.2, hy = -0.37;
    c.fillStyle = white; c.beginPath(); c.ellipse(0.17, -0.28, 0.06, 0.05, 0, 0, TAU); c.fill();      // white chest
    c.fillStyle = fur; c.beginPath(); c.arc(hx, hy, 0.085, 0, TAU); c.fill();
    for (const [ex, tilt] of [[-0.045, -0.2], [0.04, 0.2]]) { c.beginPath(); c.moveTo(hx + ex - 0.035, hy - 0.05); c.lineTo(hx + ex + tilt * 0.05, hy - 0.14); c.lineTo(hx + ex + 0.035, hy - 0.06); c.fill(); }   // ears
    c.fillStyle = '#e9a3b3'; c.beginPath(); c.moveTo(hx + 0.025, hy - 0.06); c.lineTo(hx + 0.05, hy - 0.115); c.lineTo(hx + 0.06, hy - 0.06); c.fill();
    c.fillStyle = white; c.beginPath(); c.ellipse(hx + 0.05, hy + 0.025, 0.045, 0.032, 0, 0, TAU); c.fill();
    const blink = (t % 3.7) < 0.12;
    c.fillStyle = '#7cc46b'; if (!blink) { c.beginPath(); c.ellipse(hx + 0.035, hy - 0.015, 0.018, 0.022, 0, 0, TAU); c.fill(); c.fillStyle = '#1d1d22'; c.beginPath(); c.ellipse(hx + 0.038, hy - 0.015, 0.006, 0.017, 0, 0, TAU); c.fill(); }
    else { c.strokeStyle = '#1d1d22'; c.lineWidth = 0.008; c.beginPath(); c.moveTo(hx + 0.02, hy - 0.015); c.lineTo(hx + 0.05, hy - 0.015); c.stroke(); }
    c.fillStyle = '#d97c8e'; c.beginPath(); c.arc(hx + 0.08, hy + 0.012, 0.011, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 0.004; for (const dy of [-0.01, 0.01]) { c.beginPath(); c.moveTo(hx + 0.07, hy + 0.025); c.lineTo(hx + 0.16, hy + 0.02 + dy * 2.5); c.stroke(); }
  }
  function ball(c, a) {
    const r = 0.12, bounce = a.running ? Math.abs(Math.sin(a.t * 7)) * 0.14 : 0;
    c.translate(0, -r - bounce); c.rotate(a.spin);
    const cols = ['#e0463c', '#fdf7ec', '#2f7fd1', '#fdf7ec', '#f2c94c', '#fdf7ec'];
    for (let i = 0; i < 6; i++) { c.fillStyle = cols[i]; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, i * TAU / 6, (i + 1) * TAU / 6); c.closePath(); c.fill(); }
    c.fillStyle = '#fdf7ec'; c.beginPath(); c.arc(0, 0, r * 0.22, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.008; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.rotate(-a.spin); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.15, -0.6, 0, TAU); c.fill();
  }

  /* ---------- birds (die Vögel): a little flock that crosses the sky ---------- */
  function birds(on, { x = 0, y = 2.2 } = {}) { F.birds = on ? { x0: x, y, t0: B.S.t } : null; }
  function drawBirds(c, b, t, Z) {
    const f = set.foot(0, -1), dt = t - b.t0;
    for (let i = 0; i < 5; i++) {
      const wx = b.x0 - 3 + dt * 0.9 + i * 0.45 + Math.sin(i * 3.1) * 0.2, wy = b.y + Math.sin(i * 1.7) * 0.25 + Math.sin(dt * 1.4 + i) * 0.05;
      const x = set.V.W / 2 + (wx - set.V.cam.x) * Z, y = f.y - wy * Z, s = Z * 0.09, flap = Math.sin(dt * 9 + i * 1.3) * 0.6;
      c.strokeStyle = '#3a3f4a'; c.lineWidth = Math.max(1.5, s * 0.16); c.lineCap = 'round'; c.beginPath();
      c.moveTo(x - s, y - s * flap * 0.6); c.quadraticCurveTo(x - s * 0.4, y - s * (0.5 + flap * 0.3), x, y); c.quadraticCurveTo(x + s * 0.4, y - s * (0.5 + flap * 0.3), x + s, y - s * flap * 0.6); c.stroke();
    }
  }

  /* ---------- the backpack and things that fly into it (Max packt) ---------- */
  function pack(x, d = 0.3) { F.pack = x == null ? null : { x, d, fill: 0, shake: 0 }; }
  function drawPack(c, p, Z) {
    const f = set.foot(p.x, p.d), s = Z * f.k, sh = Math.sin(B.S.t * 40) * p.shake * 0.03;
    p.shake = Math.max(0, p.shake - 0.03);
    c.save(); c.translate(f.x, f.y); c.rotate(sh); c.scale(s, s);
    c.fillStyle = 'rgba(40,60,30,.2)'; c.beginPath(); c.ellipse(0, 0, 0.26, 0.04, 0, 0, TAU); c.fill();
    const h = 0.5 + p.fill * 0.06;
    c.fillStyle = '#2f6f8f'; c.beginPath(); c.roundRect(-0.2, -h, 0.4, h, 0.09); c.fill();
    c.fillStyle = '#285f7a'; c.beginPath(); c.roundRect(-0.15, -0.24, 0.3, 0.2, 0.05); c.fill();      // front pocket
    c.fillStyle = '#f2c94c'; c.fillRect(-0.02, -0.2, 0.04, 0.025);
    c.fillStyle = '#3b84a8'; c.beginPath(); c.moveTo(-0.2, -h + 0.1); c.quadraticCurveTo(0, -h - 0.08, 0.2, -h + 0.1); c.lineTo(0.2, -h + 0.16); c.quadraticCurveTo(0, -h + 0.02, -0.2, -h + 0.16); c.fill();   // flap
    c.strokeStyle = '#1f4f66'; c.lineWidth = 0.025; c.beginPath(); c.arc(0, -h - 0.02, 0.06, Math.PI, TAU); c.stroke();   // handle
    c.restore();
  }
  // a thing (one of THINGS) appears above the pack and flies in (ok) or bounces off (no)
  function thing(kind, { x, d = 0.3 } = {}) { const f = { kind, x, d, y: 1.25, k: 0, mode: 'show', t0: B.S.t }; F.flyers = [f]; return f; }
  function sendThing(f, ok) {
    f.mode = ok ? 'in' : 'off'; f.t0 = B.S.t;
    return B.wait(ok ? 0.8 : 0.9).then(() => { if (ok && F.pack) { F.pack.fill = Math.min(4, F.pack.fill + 1); F.pack.shake = 1; } if (ok) F.flyers = F.flyers.filter((q) => q !== f); else { f.mode = 'show'; f.t0 = B.S.t; } });
  }
  function drawFlyer(c, f, Z) {
    const dt = B.S.t - f.t0; let wy = f.y + Math.sin(B.S.t * 2) * 0.03, wx = f.x, rot = 0, sc = Math.min(1, dt / 0.3);
    if (f.mode === 'in') { const k = ease(Math.min(1, dt / 0.8)); wx = f.x + ((F.pack ? F.pack.x : f.x) - f.x) * k; wy = f.y * (1 - k) + 0.35 * k + Math.sin(Math.PI * k) * 0.5; rot = k * 2.5; sc = 1 - 0.5 * k; }
    if (f.mode === 'off') { const k = Math.min(1, dt / 0.9); wx = f.x + Math.sin(k * 30) * 0.04 * (1 - k); wy = f.y + Math.sin(Math.PI * k) * 0.15; }
    const g = set.foot(wx, f.d), s = Z * g.k; c.save(); c.translate(g.x, g.y - wy * s); c.rotate(rot); c.scale(s * sc, s * sc); THINGS[f.kind](c); c.restore();
  }

  B.occupiers.push(() => Object.values(F.animals).filter((a) => a.alpha > 0.5).map((a) => {
    const f = set.foot(a.x, a.d), s = set.V.cam.z * f.k, h = a.K.h * s; return { x: f.x - h * 0.7, y: f.y - h - (a.raise || 0) * s, w: h * 1.4, h, who: a.key };
  }));
  return { F, animal, moveTo, place: placeA, hop, ring, ringOff, ringsOff, birds, pack, thing, sendThing, where };
}

/* Things for the backpack (camping kit), about 0.3 m, centred on (0, 0). */
export const THINGS = {
  schlafsack(c) { c.fillStyle = '#d2453b'; c.beginPath(); c.roundRect(-0.2, -0.1, 0.4, 0.2, 0.1); c.fill(); c.strokeStyle = '#a3332b'; c.lineWidth = 0.015; for (const x of [-0.08, 0.06]) { c.beginPath(); c.moveTo(x, -0.1); c.lineTo(x, 0.1); c.stroke(); } c.fillStyle = '#f2c94c'; c.beginPath(); c.ellipse(0.2, 0, 0.03, 0.1, 0, 0, TAU); c.fill(); },
  zelt(c) { c.fillStyle = '#4f8a52'; c.beginPath(); c.moveTo(-0.22, 0.12); c.lineTo(0, -0.16); c.lineTo(0.22, 0.12); c.fill(); c.fillStyle = '#2f5d34'; c.beginPath(); c.moveTo(-0.05, 0.12); c.lineTo(0, 0.0); c.lineTo(0.05, 0.12); c.fill(); c.strokeStyle = '#7a4a2a'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(0, -0.16); c.lineTo(0, -0.22); c.stroke(); },
  taschenlampe(c) { c.fillStyle = '#3d4f6b'; c.beginPath(); c.roundRect(-0.18, -0.045, 0.26, 0.09, 0.02); c.fill(); c.fillStyle = '#59636d'; c.beginPath(); c.moveTo(0.08, -0.06); c.lineTo(0.17, -0.08); c.lineTo(0.17, 0.08); c.lineTo(0.08, 0.06); c.fill(); c.fillStyle = 'rgba(255,240,170,.55)'; c.beginPath(); c.moveTo(0.17, -0.07); c.lineTo(0.32, -0.15); c.lineTo(0.32, 0.15); c.lineTo(0.17, 0.07); c.fill(); c.fillStyle = '#f2c94c'; c.fillRect(-0.06, -0.015, 0.05, 0.03); },
  schuhe(c) { for (const dx of [-0.11, 0.07]) { c.fillStyle = '#8a5228'; c.beginPath(); c.moveTo(dx - 0.06, -0.12); c.lineTo(dx + 0.03, -0.12); c.lineTo(dx + 0.04, 0.02); c.lineTo(dx + 0.12, 0.05); c.lineTo(dx + 0.12, 0.1); c.lineTo(dx - 0.07, 0.1); c.closePath(); c.fill(); c.fillStyle = '#3a2a1a'; c.fillRect(dx - 0.07, 0.08, 0.19, 0.03); c.strokeStyle = '#f2c94c'; c.lineWidth = 0.008; for (const y of [-0.08, -0.04, 0]) { c.beginPath(); c.moveTo(dx - 0.04, y); c.lineTo(dx + 0.02, y); c.stroke(); } } },
  hut(c) { c.fillStyle = '#7a5434'; c.beginPath(); c.ellipse(0, 0.06, 0.22, 0.05, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-0.12, 0.06); c.quadraticCurveTo(-0.12, -0.12, 0, -0.12); c.quadraticCurveTo(0.12, -0.12, 0.12, 0.06); c.fill(); c.fillStyle = '#d2453b'; c.fillRect(-0.12, 0.0, 0.24, 0.035); c.fillStyle = '#4f8a52'; c.beginPath(); c.ellipse(0.08, -0.02, 0.025, 0.06, 0.6, 0, TAU); c.fill(); },
  kompass(c) { c.fillStyle = '#c9d2da'; c.beginPath(); c.arc(0, 0, 0.13, 0, TAU); c.fill(); c.fillStyle = '#fdf7ec'; c.beginPath(); c.arc(0, 0, 0.1, 0, TAU); c.fill(); c.fillStyle = '#d2453b'; c.beginPath(); c.moveTo(0, -0.08); c.lineTo(0.025, 0); c.lineTo(-0.025, 0); c.fill(); c.fillStyle = '#3d4f6b'; c.beginPath(); c.moveTo(0, 0.08); c.lineTo(0.025, 0); c.lineTo(-0.025, 0); c.fill(); },
};
