/* Baked scene assets (assets/scene/, docs/scene-assets.md): the pictures of meaning, the animals and the sets as
   images plus manifests, drawn here with no drawing code of its own beyond simple shapes. The web stage draws these,
   as the iOS and Android players do, so a scene looks the same everywhere. Until an image has loaded, callers draw
   the live Canvas version (bilder.js, tiere.js, the sets) for that frame, so nothing waits.
   tools/bake-scene-assets.cjs makes the files (its check compares them with the live drawing). */

const TAU = Math.PI * 2;
const ROOT = new URL('../../assets/scene/', import.meta.url);

/* ---------- loading: manifests at once, images when first asked for ---------- */
const man = {}, imgs = {};
const manifest = (name) => man[name] || (man[name] = fetch(new URL(name + '.json', ROOT)).then((r) => (r.ok ? r.json() : null)).then((m) => (man[name] = m)).catch(() => (man[name] = null)));
export const M = (name) => (man[name] && !man[name].then ? man[name] : null);
// the image for a manifest file path, or null while it loads (then the caller draws the live version)
export function image(file) {
  let im = imgs[file];
  if (!im) { im = imgs[file] = new Image(); im.decoding = 'async'; im.src = new URL(file, ROOT).href; }
  return im.complete && im.naturalWidth ? im : null;
}
export const preload = (files) => files.forEach(image);
export const ready = (name) => Promise.resolve(manifest(name)).then(() => M(name));
manifest('bilder'); manifest('tiere');

/* ---------- sheets ---------- */
export function loopFrame(e, t) {
  if (!e.loop || e.frames === 1) return 0;
  const k = ((t % e.loop) + e.loop) % e.loop;
  return Math.min(e.frames - 1, Math.floor((k / e.loop) * e.frames + 1e-6));
}
export function stateFrame(e, v) { let best = 0; e.values.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(e.values[best] - v)) best = i; }); return best; }
export function cell(c, img, e, i, dx, dy, dw, dh) {
  const [fw, fh] = e.frame, cols = e.cols || e.frames;
  c.drawImage(img, (i % cols) * fw, Math.floor(i / cols) * fh, fw, fh, dx, dy, dw, dh);
}

/* ---------- pictures of meaning and icons ---------- */
// a picture into the box (x, y, w, h) at t seconds since it appeared; false if not drawn (not baked, or loading)
export function picture(c, name, t, x, y, w, h) {
  const B = M('bilder'), e = B && B.pictures[name]; if (!e) return false;
  const im = image(e.file); if (!im) return false;
  cell(c, im, { ...e, frame: B.frame }, loopFrame(e, t), x, y, w, h); return true;
}
export function icon(c, name, x, y, w, h) {
  const B = M('bilder'), f = B && B.icons.files[name]; if (!f) return false;
  const im = image(f); if (!im) return false;
  c.drawImage(im, x, y, w, h); return true;
}

/* ---------- animals, birds, the backpack, things ---------- */
// a = { kind, state ('idle' | 'walk' | 'run' | 'happy' | 'scared'), running, t, hop (1 → 0), left, raise, spin } at
// feet (fx, fy) with s = pixels per metre at its depth; false if not drawn
export function animal(c, a, fx, fy, s) {
  const T = M('tiere'), K = T && T.kinds[a.kind]; if (!K) return false;
  let st = K.states[a.state] || K.states.idle;
  if (st.same) st = K.states[a.running && st.running ? st.running : st.same];
  const im = image(st.file); if (!im) return false;
  const sc = s / T.pxPerMetre;
  if (!a.raise) { c.fillStyle = K.shadow.color; c.beginPath(); c.ellipse(fx, fy, K.shadow.rx * s, K.shadow.ry * s, 0, 0, TAU); c.fill(); }
  const lift = Math.sin(Math.PI * (a.hop || 0)) * K.hop.lift * s + (a.raise || 0) * s;
  const i = st.advance === 'distance' ? Math.floor(((((a.spin || 0) / TAU) % 1) + 1) % 1 * st.frames + 1e-6) % st.frames : loopFrame(st, a.t);
  c.save(); c.translate(fx, fy - lift); if (a.left) c.scale(-1, 1);
  cell(c, im, { ...st, frame: K.frame }, i, -K.foot[0] * sc, -K.foot[1] * sc, K.frame[0] * sc, K.frame[1] * sc);
  c.restore(); return true;
}
// the flock: dt = seconds since it started, (x0, y) its start in metres, X(wx) a ground x on screen, gy1 the y of d = -1
export function birds(c, dt, x0, y, X, gy1, z) {
  const T = M('tiere'), Bd = T && T.birds; if (!Bd) return false;
  const im = image(Bd.file); if (!im) return false;
  const F = Bd.flock, sc = z / T.pxPerMetre;
  for (let i = 0; i < F.count; i++) {
    const wx = x0 + F.start + dt * F.speed + i * F.gap + Math.sin(i * F.jitter[0]) * F.jitter[1];
    const wy = y + Math.sin(i * F.rows[0]) * F.rows[1] + Math.sin(dt * F.bob[0] + i) * F.bob[1];
    const fr = loopFrame(Bd, dt + (i * F.phase) / F.flapRate);
    cell(c, im, Bd, fr, X(wx) - Bd.anchor[0] * sc, gy1 - wy * z - Bd.anchor[1] * sc, Bd.frame[0] * sc, Bd.frame[1] * sc);
  }
  return true;
}
// the backpack at feet (fx, fy), s pixels per metre, with its fill (0–4) and shake (1 → 0); t the scene time
export function pack(c, p, fx, fy, s, t) {
  const T = M('tiere'), P = T && T.pack; if (!P) return false;
  const im = image(P.file); if (!im) return false;
  const sc = s / T.pxPerMetre, rot = P.shake.amp * (p.shake || 0) * Math.sin(P.shake.w * t);
  c.save(); c.translate(fx, fy); c.rotate(rot);
  cell(c, im, P, stateFrame(P, p.fill || 0), -P.foot[0] * sc, -P.foot[1] * sc, P.frame[0] * sc, P.frame[1] * sc);
  c.restore(); return true;
}
// a thing centred at (x, y), s pixels per metre, rotated and scaled
export function thing(c, kind, x, y, s, rot = 0, k = 1) {
  const T = M('tiere'), e = T && T.things[kind]; if (!e) return false;
  const im = image(e.file); if (!im) return false;
  const sc = (s / T.pxPerMetre) * k;
  c.save(); c.translate(x, y); c.rotate(rot); c.drawImage(im, -e.centre[0] * sc, -e.centre[1] * sc, e.size[0] * sc, e.size[1] * sc); c.restore(); return true;
}

/* ---------- sets ---------- */
// the files a set needs, to load them while the start box shows
export function setFiles(m) { return Object.values(m.items).map((it) => it.file).filter(Boolean); }
// draw the set's back (behind the people) or front phase. view = { W, H, z, camX, ty, t, dpr } in device pixels;
// state = { win, sign, signGlow, sweep, lambHop … }. Returns false if an image is still loading (draw the live set).
export function drawSet(c, m, view, state, phase) {
  for (const name of m[phase]) { const it = m.items[name]; if (it.file && !image(it.file)) return false; }
  const { W, H, z, camX, ty = 0, t = 0, dpr = 1 } = view, sc = z / m.pxPerMetre, gy = H * 0.8 + ty * z;
  const sx = (ix, p) => W / 2 + (ix - m.width / 2) * sc + (m.camX - camX) * p * z;
  const sy = (iy) => gy + (iy - m.groundY) * sc;
  const Yd = (d) => (d >= 0 ? gy + d * m.depth.front * z : gy + m.depth.back * z * Math.max(-1, d / m.depth.backDepth));
  const img = (it, dx = 0, dy = 0) => {
    const x = sx(it.x, it.parallax) + dx, y = sy(it.y) + dy, w = it.w * sc, h = it.h * sc, im = image(it.file);
    if (it.extend === 'up' && y > 0) c.drawImage(im, 0, 0, im.naturalWidth, 1, x, 0, w, y + 1);
    if (it.extend === 'down' && y + h < H) c.drawImage(im, 0, im.naturalHeight - 1, im.naturalWidth, 1, x, y + h - 1, w, H - y - h + 1);
    c.drawImage(im, x, y, w, h);
  };
  const sheet = (it, i, dx = 0, dy = 0) => cell(c, image(it.file), it, i, sx(it.x, it.parallax) + dx, sy(it.y) + dy, it.frame[0] * sc, it.frame[1] * sc);
  const sway = (it) => (it.sway ? it.sway.amp * Math.sin(it.sway.w * t) * z : 0);
  for (const name of m[phase]) {
    const it = m.items[name];
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
        c.save(); c.translate(px, py); c.rotate(a); c.drawImage(image(it.file), (it.x - it.pivot[0]) * sc, (it.y - it.pivot[1]) * sc, it.w * sc, it.h * sc); c.restore(); break;
      }
      case 'sprites':
        for (const [x0, y0, s, v] of it.items) {
          const wx = ((x0 + t * v + it.wrap / 2) % it.wrap) - it.wrap / 2, k = s / it.bakedScale;
          const ax = sx(it.anchor[0], it.parallax) + wx * z, ay = sy(it.anchor[1]) - y0 * it.rise * z;
          c.drawImage(image(it.file), ax + (it.x - it.anchor[0]) * sc * k, ay + (it.y - it.anchor[1]) * sc * k, it.w * sc * k, it.h * sc * k);
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
        const L = m.items[it.from], lx = sx(it.origin[0], it.parallax) + sway(L), ly = sy(it.origin[1]);
        for (const [u0, v, ph, sp] of it.items) {
          const u = (u0 + t * sp) % 1, px = lx + (v - 0.5) * it.spread * z * u + Math.sin(t * it.drift[0] + ph) * it.drift[1] * z, py = ly + it.drop * z + u * (gy - ly);
          c.fillStyle = `rgba(${it.rgb},${it.alpha * Math.sin(Math.PI * u)})`; c.beginPath(); c.arc(px, py, Math.max(it.minRadius * dpr, it.radius * z), 0, TAU); c.fill();
        }
        break;
      }
    }
    c.globalAlpha = 1;
  }
  return true;
}
// the workshop sign's picture and words (the board itself is baked): text with {v:…}/{t:…} in bold green
export function signWords(c, m, view, state) {
  const it = m.items.sign; if (!it || state.sign == null) return;
  const { W, H, z, camX, ty = 0, t = 0 } = view, sc = z / m.pxPerMetre, gy = H * 0.8 + ty * z;
  const cx = W / 2 + (it.board.centre[0] - m.width / 2) * sc + (m.camX - camX) * it.parallax * z, cy = gy + (it.board.centre[1] - m.groundY) * sc;
  const w = it.board.w * z, h = it.board.h * z, x = cx, y = cy - h / 2, T = it.text;
  let box = T.box.withoutPic;
  if (state.signPic) {
    const P = it.pic, ps = P.scale * z;
    if (picture(c, state.signPic, t, x + P.left * z, y + P.top * z, 160 * ps, 100 * ps)) box = T.box.withPic;
  }
  if (!state.sign) return;
  const tw = box.w * z, tcx = x + box.cx * z, words = state.sign.split(' ');
  let fs = T.size * z; c.textAlign = 'left'; c.textBaseline = 'middle';
  const bold = (wd) => /^\{[vt]:/.test(wd), clean = (wd) => wd.replace(/\{[a-z]+:|\}/g, '');
  const font = (b) => `${b ? T.weights[1] : T.weights[0]} ${fs}px ${T.font}`;
  const width = (ws) => ws.reduce((s, wd) => { c.font = font(bold(wd)); return s + c.measureText(clean(wd) + ' ').width; }, 0);
  let lines = [words];
  if (width(words) > tw * 0.88) { let best = 1, bd = 1e9; for (let i = 1; i < words.length; i++) { const d = Math.abs(width(words.slice(0, i)) - width(words.slice(i))); if (d < bd) { bd = d; best = i; } } lines = [words.slice(0, best), words.slice(best)]; }
  while (Math.max(...lines.map(width)) > tw * T.fit && fs > 6) fs *= T.shrink;
  lines.forEach((ln, li) => {
    let tx = tcx - width(ln) / 2; const yy = y + h * (lines.length === 1 ? T.y.one : T.y.two[li]);
    for (const wd of ln) { const b = bold(wd), s = clean(wd); c.font = font(b); c.fillStyle = b ? T.colors[1] : T.colors[0]; c.fillText(s, tx, yy); tx += c.measureText(s + ' ').width; }
  });
}
// a live set that draws its baked images once they have loaded (and its own Canvas drawing until then)
export function bakeable(set, name, bg, fg) {
  const live = set.draw; let m = null;
  ready('sets/' + name).then((x) => { m = x; if (m) preload(setFiles(m)); });
  set.baked = () => !!m;
  set.draw = (t, dt) => {
    const V = set.V;
    if (!m) return live(t, dt);
    if (V.lambHop > 0) V.lambHop = Math.max(0, V.lambHop - (dt || 0) * 2.2);
    V.t = t;
    const dpr = V.dpr, z = V.cam.z * dpr, view = { W: bg.width, H: bg.height, z, camX: V.cam.x, ty: (V.gy - V.H * 0.8) / V.cam.z, t, dpr };
    const state = { win: V.win, sign: V.sign, signPic: V.signPic, signGlow: V.signGlow, sweep: V.sweep, lambHop: V.lambHop };
    for (const k of Object.keys(m.state || {})) state[k] = V[k];      // every part the set's manifest names (see: sun, clock, door, bridge)
    const c = bg.getContext('2d'), f = fg.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (!drawSet(c, m, view, state, 'back')) return live(t, dt);
    signWords(c, m, view, state);
    f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fg.width, fg.height);
    if (!drawSet(f, m, view, state, 'front')) return live(t, dt);
  };
  return set;
}
