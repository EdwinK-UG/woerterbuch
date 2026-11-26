/* A reference player for the baked scene assets (assets/scene/, docs/scene-assets.md): it draws a picture frame, an
   animal and a whole set from the images and manifests only, with no drawing code of its own beyond simple shapes.
   tools/bake-scene-assets.js uses it to prove the bake (live Canvas drawing vs this player, side by side); the iOS and
   Android players can port it function by function. All sizes are device pixels; z = device pixels per metre. */

const TAU = Math.PI * 2;

/* ---------- sheets ---------- */
// which frame of a looping sheet shows at time t (seconds since it started)
export function loopFrame(e, t) {
  if (!e.loop || e.frames === 1) return 0;
  const k = ((t % e.loop) + e.loop) % e.loop;
  return Math.min(e.frames - 1, Math.floor((k / e.loop) * e.frames + 1e-6));
}
// the frame of a state sheet for a state value (nearest baked value)
export function stateFrame(e, v) {
  let best = 0; e.values.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(e.values[best] - v)) best = i; }); return best;
}
// draw frame i of a sheet (frames left to right, then the next row) into the box dx, dy, dw, dh
export function cell(c, img, e, i, dx, dy, dw, dh) {
  const [fw, fh] = e.frame, cols = e.cols || e.frames;
  c.drawImage(img, (i % cols) * fw, Math.floor(i / cols) * fh, fw, fh, dx, dy, dw, dh);
}

/* ---------- pictures of meaning ---------- */
// a picture into a box (x, y, w, h) at time t since it appeared
export function drawPicture(c, man, imgs, name, t, x, y, w, h) {
  const e = man.pictures[name]; cell(c, imgs[e.file], { ...e, frame: man.frame }, loopFrame(e, t), x, y, w, h);
}

/* ---------- animals ---------- */
// a = { kind, state ('idle' | 'walk' | 'run' | 'happy' | 'scared'), t, hop (1 → 0), left, raise (metres), spin } at
// feet (fx, fy) with s = device pixels per metre at its depth (z × k)
export function drawAnimal(c, man, imgs, a, fx, fy, s) {
  const K = man.kinds[a.kind], sc = s / man.pxPerMetre;
  let st = K.states[a.state] || K.states.idle;
  if (st.same) st = K.states[a.running && st.running ? st.running : st.same];
  if (!a.raise) { c.fillStyle = K.shadow.color; c.beginPath(); c.ellipse(fx, fy, K.shadow.rx * s, K.shadow.ry * s, 0, 0, TAU); c.fill(); }
  const lift = Math.sin(Math.PI * (a.hop || 0)) * K.hop.lift * s + (a.raise || 0) * s;
  const i = st.advance === 'distance' ? Math.floor(((((a.spin || 0) / TAU) % 1) + 1) % 1 * st.frames + 1e-6) % st.frames : loopFrame(st, a.t);
  c.save(); c.translate(fx, fy - lift); if (a.left) c.scale(-1, 1);
  cell(c, imgs[st.file], { ...st, frame: K.frame }, i, -K.foot[0] * sc, -K.foot[1] * sc, K.frame[0] * sc, K.frame[1] * sc);
  c.restore();
}
// the flock of birds: dt = seconds since it started, (x0, y) its start in metres, X(wx) the screen x of a world x on
// the ground layer, gy1 the screen y of the line d = -1, z pixels per metre
export function drawBirds(c, man, imgs, dt, x0, y, X, gy1, z) {
  const B = man.birds, F = B.flock, sc = z / man.pxPerMetre;
  for (let i = 0; i < F.count; i++) {
    const wx = x0 + F.start + dt * F.speed + i * F.gap + Math.sin(i * F.jitter[0]) * F.jitter[1];
    const wy = y + Math.sin(i * F.rows[0]) * F.rows[1] + Math.sin(dt * F.bob[0] + i) * F.bob[1];
    const fr = loopFrame(B, dt + (i * F.phase) / F.flapRate);
    cell(c, imgs[B.file], B, fr, X(wx) - B.anchor[0] * sc, gy1 - wy * z - B.anchor[1] * sc, B.frame[0] * sc, B.frame[1] * sc);
  }
}

/* ---------- sets ---------- */
// view = { W, H, z, camX, ty, t, dpr } and the set's state (win, sign, signGlow, sweep, lambHop …);
// phase 'back' (behind the people) or 'front' (in front of them)
export function drawSet(c, man, imgs, view, state, phase) {
  const { W, H, z, camX, ty = 0, t = 0, dpr = 1 } = view, sc = z / man.pxPerMetre, gy = H * 0.8 + ty * z;
  const sx = (ix, p) => W / 2 + (ix - man.width / 2) * sc + (man.camX - camX) * p * z;   // a bake-image x on a layer
  const sy = (iy) => gy + (iy - man.groundY) * sc;                                            // a bake-image y
  const Yd = (d) => (d >= 0 ? gy + d * man.depth.front * z : gy + man.depth.back * z * Math.max(-1, d / man.depth.backDepth));
  const img = (it, dx = 0, dy = 0) => {
    const x = sx(it.x, it.parallax) + dx, y = sy(it.y) + dy, w = it.w * sc, h = it.h * sc, im = imgs[it.file];
    if (it.extend === 'up' && y > 0) c.drawImage(im, 0, 0, it.w, 1, x, 0, w, y + 1);
    if (it.extend === 'down' && y + h < H) c.drawImage(im, 0, it.h - 1, it.w, 1, x, y + h - 1, w, H - y - h + 1);
    c.drawImage(im, x, y, w, h);
  };
  const sheet = (it, i, dx = 0, dy = 0) => cell(c, imgs[it.file], it, i, sx(it.x, it.parallax) + dx, sy(it.y) + dy, it.frame[0] * sc, it.frame[1] * sc);
  const sway = (it) => (it.sway ? it.sway.amp * Math.sin(it.sway.w * t) * z : 0);
  for (const name of man[phase]) {
    const it = man.items[name];
    if (it.when && state[it.when] == null) continue;
    // fade: the item is drawn with that state's value (0 … 1) as its opacity (the lake's sunny sky over the grey one)
    const fade = it.fade ? Math.max(0, Math.min(1, state[it.fade] ?? 0)) : 1; if (fade <= 0.001) continue;
    c.globalAlpha = fade;
    switch (it.type) {
      case 'image': img(it, sway(it)); break;
      case 'states': sheet(it, stateFrame(it, state[it.state] ?? it.values[0])); break;
      case 'loop': {
        const hop = it.hop && state[it.hop.state] > 0 ? Math.sin(Math.PI * Math.min(1, state[it.hop.state])) * it.hop.lift * z : 0;
        sheet(it, loopFrame(it, t), 0, -hop); break;
      }
      case 'shavings':
        if (state.sweep == null) { img(it); break; }
        c.save(); c.strokeStyle = it.stroke; c.lineWidth = it.lineWidth * z;
        for (const [x, d, a, s] of it.items) {
          if (x < state.sweep) continue;
          c.beginPath(); c.ellipse(sx(it.originX, 1) + x * z, Yd(d), s * z, s * 0.45 * z, a, it.arc[0], it.arc[1]); c.stroke();
        }
        { const P = it.pile, n = it.items.filter((q) => q[0] < state.sweep).length;
          c.fillStyle = P.color; c.beginPath(); c.ellipse(sx(it.originX, 1) + (state.sweep + P.dx) * z, Yd(P.d), (P.rx[0] + n * P.rx[1]) * z, (P.ry[0] + n * P.ry[1]) * z, 0, Math.PI, TAU); c.fill(); }
        c.restore(); break;
      case 'pivot': {
        const v = state[it.state]; if (v == null || v > it.hideAbove) break;
        const px = sx(it.pivot[0], it.parallax) + v * z, py = sy(it.pivot[1]), a = it.angle.base + it.angle.amp * Math.sin(it.angle.w * t) - it.angle.baked;
        c.save(); c.translate(px, py); c.rotate(a); c.drawImage(imgs[it.file], (it.x - it.pivot[0]) * sc, (it.y - it.pivot[1]) * sc, it.w * sc, it.h * sc); c.restore(); break;
      }
      case 'sprites':
        for (const [x0, y0, s, v] of it.items) {
          const wx = ((x0 + t * v + it.wrap / 2) % it.wrap) - it.wrap / 2, k = s / it.bakedScale;
          const ax = sx(it.anchor[0], it.parallax) + wx * z, ay = sy(it.anchor[1]) - y0 * it.rise * z;
          c.drawImage(imgs[it.file], ax + (it.x - it.anchor[0]) * sc * k, ay + (it.y - it.anchor[1]) * sc * k, it.w * sc * k, it.h * sc * k);
        }
        break;
      case 'clock': {                 // two hands at the clock's centre; state[it.state] = minutes after midnight
        const v = state[it.state] ?? 0, cx = sx(it.centre[0], it.parallax), cy = sy(it.centre[1]), r = it.r * z;
        c.save(); c.strokeStyle = it.color; c.lineCap = 'round';
        for (const [hand, a] of [['hour', (((v / 60) % 12) / 12) * TAU - Math.PI / 2], ['minute', ((v % 60) / 60) * TAU - Math.PI / 2]]) {
          const h = it.hands[hand]; c.lineWidth = Math.max(h.minWidth * dpr, h.width * z); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r * h.len, cy + Math.sin(a) * r * h.len); c.stroke();
        }
        c.fillStyle = it.color; c.beginPath(); c.arc(cx, cy, Math.max(it.pin.minRadius * dpr, it.pin.radius * z), 0, TAU); c.fill(); c.restore(); break;
      }
      case 'particles': {
        const L = man.items[it.from], lx = sx(it.origin[0], it.parallax) + sway(L), ly = sy(it.origin[1]);
        for (const [u0, v, ph, sp] of it.items) {
          const u = (u0 + t * sp) % 1, px = lx + (v - 0.5) * it.spread * z * u + Math.sin(t * it.drift[0] + ph) * it.drift[1] * z, py = ly + it.drop * z + u * (gy - ly);
          c.fillStyle = `rgba(${it.rgb},${it.alpha * Math.sin(Math.PI * u)})`; c.beginPath(); c.arc(px, py, Math.max(it.minRadius * dpr, it.radius * z), 0, TAU); c.fill();
        }
        break;
      }
    }
    c.globalAlpha = 1;
  }
}
