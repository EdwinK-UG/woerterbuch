// Wunschzauber · the wish pictures: when a wish comes true, a small picture of it grows out of the wand's sparkles.
// Chosen by single keywords (no lesson sentences in this file). Flat colours with a dark edge, like the painted lessons.
import * as THREE from 'three';

const INK = 0x2a1830;
const flat = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// which picture a wish gets: the first rule whose word occurs in the sentence (lower case)
const RULES = [
  ['city', /new york|amerika|usa|großstadt|hochhaus|wolkenkratzer/],
  ['travel', /ausland|reise|urlaub|ferien|weltreise|paris|london|rom\b|strand|meer/],
  ['cinema', /kino|film/],
  ['home', /umzieh|umzug|wohnung|haus\b|geld|reich|lotto/],
  ['job', /job|stelle|bewerb|beruf|chance|chef|büro|arbeit/],
  ['time', /rechtzeitig|pünktlich|schneller|früher|zeit|uhr/],
  ['sky', /fliegen|flieg|zauberstab|vogel|himmel/],
  ['heart', /freund|liebe|familie|freuen|glücklich/],
];
export function pickVision(sentence) {
  const s = sentence.toLowerCase();
  for (const [k, re] of RULES) if (re.test(s)) return k === 'travel' ? 'city' : k;
  return 'star';
}

// a shape cut out of a flat colour with a dark outline behind it
function cut(shape, color, z = 0, edge = 0.008) {
  const g = new THREE.Group(), geo = new THREE.ShapeGeometry(shape);
  const o = new THREE.Mesh(geo, flat(INK)); o.scale.setScalar(1); o.position.z = z - 0.002;
  geo.computeBoundingBox(); const bb = geo.boundingBox, c = bb.getCenter(V()), sz = bb.getSize(V());
  o.scale.set(1 + 2 * edge / Math.max(sz.x, 1e-3), 1 + 2 * edge / Math.max(sz.y, 1e-3), 1); o.position.x = c.x * (1 - o.scale.x); o.position.y = c.y * (1 - o.scale.y);
  const m = new THREE.Mesh(geo, flat(color)); m.position.z = z; g.add(o, m); return g;
}
const rect = (x, y, w, h) => { const s = new THREE.Shape(); s.moveTo(x, y); s.lineTo(x + w, y); s.lineTo(x + w, y + h); s.lineTo(x, y + h); s.closePath(); return s; };
const poly = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };
const circle = (x, y, r, n = 28) => { const s = new THREE.Shape(); s.absarc(x, y, r, 0, Math.PI * 2, false); return s; };
function windows(g, x, y, w, h, z, seed) {
  const cols = Math.max(1, Math.round(w / 0.022)), rows = Math.max(1, Math.round(h / 0.03));
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const r = Math.sin((i + 1) * 12.9898 + (j + 1) * 78.233 + seed) * 43758.5453; if (r - Math.floor(r) < 0.35) continue;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w / cols * 0.5, h / rows * 0.45), flat(0xffe08a)); m.position.set(x + (i + 0.5) * w / cols, y + (j + 0.5) * h / rows, z + 0.001); g.add(m);
  }
}

const BUILD = {
  // skyscrapers with lit windows, a tall tower with a spire, a small plane
  city(g) {
    const B = [[-0.27, 0.07, 0.2, 0x5b6a9a], [-0.19, 0.08, 0.31, 0x6c7bab], [-0.1, 0.07, 0.24, 0x55618f], [-0.03, 0.09, 0.46, 0x7886b5], [0.07, 0.07, 0.28, 0x5d6c9c], [0.15, 0.08, 0.36, 0x6a78a8], [0.24, 0.07, 0.19, 0x56628f]];
    B.forEach(([x, w, h, c], i) => { g.add(cut(rect(x, 0, w, h), c, 0.001 * i)); windows(g, x, 0.01, w, h - 0.03, 0.001 * i + 0.002, i * 3.1); });
    g.add(cut(poly([[-0.005, 0.46], [0.035, 0.53], [0.075, 0.46]]), 0x8b97c4, 0.012));
    g.add(cut(rect(0.031, 0.53, 0.008, 0.08), 0xc7cde6, 0.012));
    const plane = cut(poly([[0, 0], [0.09, 0.012], [0.1, 0.022], [0.012, 0.016], [-0.01, 0.03], [-0.016, 0.03], [-0.004, 0.012]]), 0xf3f0ea, 0.02, 0.005);
    plane.position.set(-0.3, 0.55, 0); plane.userData.fly = true; g.add(plane);
    return 0.62;
  },
  // a cinema screen with a film on it, seats, popcorn
  cinema(g) {
    g.add(cut(rect(-0.26, 0.12, 0.52, 0.3), 0xf4ead2, 0));
    g.add(cut(poly([[-0.2, 0.15], [-0.08, 0.32], [0.0, 0.22], [0.08, 0.36], [0.2, 0.15]]), 0x7fb3d6, 0.003));
    g.add(cut(circle(0.15, 0.36, 0.03), 0xffd55e, 0.004));
    for (const x of [-0.3, 0.27]) g.add(cut(rect(x, 0.1, 0.03, 0.34), 0xb4413a, 0.002));
    for (let i = 0; i < 5; i++) g.add(cut(rect(-0.24 + i * 0.1, 0, 0.08, 0.07), 0xc0503f, 0.006));
    g.add(cut(poly([[0.2, -0.02], [0.27, -0.02], [0.29, 0.08], [0.18, 0.08]]), 0xe8e2d6, 0.01));
    for (let i = 0; i < 6; i++) g.add(cut(circle(0.19 + (i % 3) * 0.04, 0.09 + Math.floor(i / 3) * 0.025, 0.018), 0xfff2c4, 0.011 + i * 0.0005));
    return 0.48;
  },
  // a new house, moving boxes, a few coins
  home(g) {
    g.add(cut(rect(-0.16, 0, 0.32, 0.22), 0xf0d2a6, 0));
    g.add(cut(poly([[-0.2, 0.21], [0, 0.36], [0.2, 0.21]]), 0xc65a43, 0.002));
    g.add(cut(rect(-0.035, 0, 0.07, 0.12), 0x8a5a3a, 0.004));
    for (const x of [-0.12, 0.06]) g.add(cut(rect(x, 0.12, 0.06, 0.05), 0xffe08a, 0.004));
    for (const [x, y, s] of [[0.22, 0, 0.09], [0.31, 0, 0.07], [0.25, 0.09, 0.07]]) { g.add(cut(rect(x, y, s, s * 0.8), 0xc89b62, 0.006)); g.add(cut(rect(x + s * 0.42, y, s * 0.16, s * 0.8), 0xe2c08c, 0.007, 0)); }
    for (let i = 0; i < 4; i++) g.add(cut(circle(-0.27 + i * 0.012, 0.015 + i * 0.022, 0.03), 0xf2c94c, 0.01 + i * 0.001));
    return 0.38;
  },
  // a briefcase and a big star
  job(g) {
    g.add(cut(rect(-0.16, 0, 0.32, 0.2), 0x8a5a3a, 0)); g.add(cut(rect(-0.05, 0.2, 0.1, 0.04), 0x6e4630, 0.001)); g.add(cut(rect(-0.16, 0.085, 0.32, 0.02), 0x6e4630, 0.002));
    const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.045 : 0.1; i ? st.lineTo(0.18 + Math.cos(a) * r, 0.3 + Math.sin(a) * r) : st.moveTo(0.18 + Math.cos(a) * r, 0.3 + Math.sin(a) * r); } st.closePath();
    g.add(cut(st, 0xffd45e, 0.006)); return 0.42;
  },
  // a clock that is on time, and running shoes
  time(g) {
    g.add(cut(circle(0, 0.2, 0.17), 0xfff7e6, 0)); g.add(cut(rect(-0.008, 0.2, 0.016, 0.12), 0x3a2a40, 0.004)); g.add(cut(rect(0, 0.192, 0.09, 0.016), 0x3a2a40, 0.004));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, m = new THREE.Mesh(new THREE.CircleGeometry(0.008, 8), flat(0x3a2a40)); m.position.set(Math.sin(a) * 0.14, 0.2 + Math.cos(a) * 0.14, 0.003); g.add(m); }
    g.add(cut(poly([[0.17, 0], [0.31, 0], [0.31, 0.04], [0.24, 0.07], [0.19, 0.07]]), 0xd9622b, 0.006)); return 0.4;
  },
  // clouds, the sun going down, a few birds
  sky(g) {
    g.add(cut(circle(0.12, 0.26, 0.09), 0xffc56b, 0));
    for (const [x, y, s] of [[-0.18, 0.12, 1], [0.05, 0.05, 1.2], [0.22, 0.14, 0.8]]) for (const [dx, dy, r] of [[0, 0, 0.06], [0.06, 0.02, 0.05], [-0.06, 0.01, 0.045], [0.02, 0.05, 0.05]]) g.add(cut(circle(x + dx * s, y + dy * s, r * s), 0xffffff, 0.004 + x * 0.001));
    for (const [x, y] of [[-0.2, 0.33], [-0.1, 0.38], [-0.03, 0.31]]) { const b = cut(poly([[-0.03, 0], [0, -0.012], [0.03, 0], [0, -0.004]]), 0x3a2a40, 0.01, 0.002); b.position.set(x, y, 0); b.userData.flap = true; g.add(b); }
    return 0.44;
  },
  heart(g) { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(-0.24, 0.14, -0.14, 0.36, 0, 0.24); s.bezierCurveTo(0.14, 0.36, 0.24, 0.14, 0, 0); g.add(cut(s, 0xf07a8f, 0)); return 0.36; },
  star(g) { const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.07 : 0.16; i ? st.lineTo(Math.cos(a) * r, 0.17 + Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, 0.17 + Math.sin(a) * r); } st.closePath(); g.add(cut(st, 0xffd45e, 0)); return 0.34; },
};

// the picture in a soft glow; returns { group, t, ... } for stepVision
export function makeVision(kind, glowTexture) {
  const root = new THREE.Group(), pic = new THREE.Group();
  const h = (BUILD[kind] || BUILD.star)(pic);
  pic.position.y = -h / 2;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xffe6b0, transparent: true, opacity: 0.4, depthWrite: false })); glow.scale.set(1.0, 0.85, 1); glow.position.z = -0.06;
  root.add(glow, pic); root.scale.setScalar(0.001); root.renderOrder = 3;
  pic.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.depthWrite = false; } });
  return { root, pic, glow, kind, t: 0 };
}
// grow (overshoot), bob, then fade. Returns false when it is over.
export function stepVision(v, dt, life = 3.6) {
  v.t += dt; const t = v.t;
  const grow = t < 0.6 ? 1 + 0.12 * Math.sin(Math.PI * t / 0.6) - (1 - t / 0.6) ** 3 : 1, fade = t > life - 0.6 ? Math.max(0, (life - t) / 0.6) : 1;
  v.root.scale.setScalar(Math.max(0.001, grow * (0.85 + 0.15 * fade)));
  v.root.position.y = v.y0 + Math.sin(t * 1.6) * 0.015;
  v.pic.traverse((o) => { if (o.material) o.material.opacity = fade; if (o.userData.fly) o.position.x = -0.3 + ((t * 0.18) % 0.7); if (o.userData.flap) o.scale.y = 0.6 + 0.4 * Math.abs(Math.sin(t * 9 + o.position.x * 20)); });
  v.glow.material.opacity = 0.4 * fade;
  return t < life;
}
