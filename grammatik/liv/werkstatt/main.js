/* Kapitel 57 · Trennbar-Werkstatt in 2D with Liv (grammatik/liv/). Opened from the lesson, see grammatik.js.
   Like the 3D workshop it holds no lesson text: the lesson page sends the chapter's own sentences (rounds.js picks
   one per verb). Liv does not speak: she acts, with the workshop's generated sound effects. Same logic as the 3D workshop:
   a drop saw comes down on each verb. Separable verbs split and the prefix flies to the end of the sentence;
   inseparable verbs make the saw kick back and stay whole. */
import { ROUNDS, VERBS, loadRounds } from '../../werkstatt/rounds.js?v=1';
import { Sfx } from '../../werkstatt/sfx.js?v=1';

const { PI, TAU, D2R, clamp, lerp, ss, madd, Actor, Stage, SKINS, ACT, arm, NF, scn, loadArt } = window.LIV;
// two extra sounds for this scene
Sfx.prototype.pop = function (pitch = 1) { if (!this.ok) return; const t = this.now(), o = this.ctx.createOscillator(), g = this.gain(); o.type = 'sine'; o.frequency.setValueAtTime(380 * pitch, t); o.frequency.exponentialRampToValueAtTime(760 * pitch, t + 0.08); o.connect(g); g.connect(this.out); this.env(g, t, 0.004, 0.2, 0.12); o.start(t); o.stop(t + 0.2); };

const SKIN = SKINS.c01p, EMBED = window.parent !== window;
const TEST = /[?&]test/.test(location.search);
const $ = (id) => document.getElementById(id);
const sfx = new Sfx();
const stage = new Stage($('scene'), { manual: TEST });
const liv = new Actor(SKIN, { x: 0.02, z: -0.3, dir: 1 }); stage.actors.push(liv);
const cam = stage.cam; cam.pitch = 5 * D2R; cam.dist = 40;
stage.fit = (s) => {   // the stage sits between the header and the caption bar, whatever height they wrap to
  const hd = document.querySelector('header.ui'), ft = document.querySelector('footer.ui'), clean = document.body.classList.contains('clean');
  const top = clean || !hd ? 12 : hd.getBoundingClientRect().height + 4, bot = clean || !ft ? 12 : Math.max(150, ft.getBoundingClientRect().height + 6), h = Math.max(120, s.H - top - bot);
  cam.zoom = Math.min(s.W / (s.W < 640 ? 1.98 : 2.3), h / 1.8); cam.target = [0.4, 0.86, 0]; cam.cy = top + h * 0.5;
};
stage.fit(stage);

/* ---------- workshop geometry (metres) ---------- */
const BY = 0.58, BH = 0.13, CUT = 0.56, RB = 0.15, RAISED = BY + BH + 0.07 + RB, TOUCH = BY + BH + RB - 0.012, THROUGH = BY + RB - 0.02, RAIL_Y = 1.6, FONT = 0.088;
const W = { saw: RAISED, spin: 0, jit: 0, shake: 0, block: null, tiles: [], dust: [], sep: [], ins: [], round: 0, mode: 0, score: 0, tries: 0, waiting: null, run: 0, say: '', rule: '', verdict: '', started: false };
const grip = () => [CUT - 0.27 + W.jit, W.saw + 0.115, -0.1];
const tweens = [];
const tween = (obj, key, to, dur, ease) => new Promise((res) => tweens.push({ obj, key, a: obj[key], b: to, t: 0, dur, ease: ease || ss, res }));
stage.onUpdate = (dt) => {
  for (const t of tweens) { t.t += dt; const k = Math.min(1, t.t / t.dur); t.obj[t.key] = lerp(t.a, t.b, t.ease(k)); if (k >= 1) { t.done = true; t.res(); } }
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].done) tweens.splice(i, 1);
  W.spin += dt * (W.motor ? 38 : 0); W.shake = Math.max(0, W.shake - dt * 2.2);
  for (const d of W.dust) { d.t += dt; d.v[1] -= 3.2 * dt; d.p = madd(d.p, d.v, dt); }
  W.dust = W.dust.filter((d) => d.t < d.life);
  // footsteps are not needed here; keep Liv's eyes on her work
};
const ctx0 = stage.ctx, fontPx = () => FONT * cam.zoom;
const setFont = (ctx, px) => { ctx.font = '600 ' + px + 'px Inter, system-ui, sans-serif'; };
const textM = (t) => { setFont(ctx0, 100); return ctx0.measureText(t).width / 100 * FONT + 0.05; };

/* ---------- drawing ---------- */
const WOOD = '#e2b77d', WOOD_D = '#a8733f', WOOD_L = '#f0cf9c', PREFIX = '#f0a98a', INK = '#3a1c0c', AMBER = '#e6a532', STEEL = '#9aa3aa', STEEL_D = '#5d6670';
function tile(ctx, x, y, w, text, kind, rot, alpha, sc) {
  const q = cam.project([x, y, 0.06]), s = q[3] * (sc || 1), pw = w * s, ph = BH * s;
  ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(rot || 0); ctx.globalAlpha = alpha == null ? 1 : alpha;
  if (kind === 'ghost') { ctx.setLineDash([5, 5]); scn.rrect(ctx, -pw / 2, -ph, pw, ph, 6); ctx.strokeStyle = '#b89c74'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]); }
  else {
    scn.rrect(ctx, -pw / 2, -ph, pw, ph, Math.min(7, ph * 0.18)); ctx.fillStyle = kind === 'prefix' ? PREFIX : kind === 'paper' ? '#fffaf0' : kind === 'verb' ? '#f6d9a8' : WOOD; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.2, s * 0.005); ctx.stroke();
    if (kind !== 'paper') { ctx.strokeStyle = 'rgba(150,100,50,.28)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-pw / 2 + 5, -ph * 0.3); ctx.lineTo(pw / 2 - 5, -ph * 0.34); ctx.moveTo(-pw / 2 + 5, -ph * 0.68); ctx.lineTo(pw / 2 - 5, -ph * 0.64); ctx.stroke(); }
    setFont(ctx, FONT * s); ctx.fillStyle = kind === 'prefix' ? '#8a2e20' : '#2a2f3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, -ph * 0.47);
  }
  ctx.restore();
}
stage.bg = (ctx, cm, s) => {
  const fl = cm.project([0, 0, -0.62])[1];
  ctx.fillStyle = '#f1e6d2'; ctx.fillRect(0, 0, s.W, fl); ctx.fillStyle = '#d9c3a0'; ctx.fillRect(0, fl, s.W, s.H - fl);
  ctx.strokeStyle = 'rgba(140,100,60,.25)'; ctx.lineWidth = 1.5; for (let i = 1; i < 7; i++) { const y = fl + (s.H - fl) * Math.pow(i / 7, 1.5); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.W, y); ctx.stroke(); }
  ctx.strokeStyle = '#c9b28c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, fl); ctx.lineTo(s.W, fl); ctx.stroke();
  const R = (x0, y0, x1, y1, fill, r) => { const a = cm.project([x0, y1, -0.62]), b = cm.project([x1, y0, -0.62]); scn.rrect(ctx, a[0], a[1], b[0] - a[0], b[1] - a[1], r || 4); ctx.fillStyle = fill; ctx.fill(); return [a[0], a[1], b[0] - a[0], b[1] - a[1]]; };
  // window
  R(1.02, 0.86, 1.62, 1.42, '#e2d3b6', 6); const g = R(1.06, 0.9, 1.58, 1.38, '#cfe3ea', 3); ctx.strokeStyle = '#e2d3b6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(g[0] + g[2] / 2, g[1]); ctx.lineTo(g[0] + g[2] / 2, g[1] + g[3]); ctx.moveTo(g[0], g[1] + g[3] / 2); ctx.lineTo(g[0] + g[2], g[1] + g[3] / 2); ctx.stroke();
  // pegboard with tools
  const pb = R(-0.86, 0.84, -0.3, 1.4, '#e2cfae', 6); ctx.fillStyle = 'rgba(140,100,60,.4)'; for (let x = pb[0] + 9; x < pb[0] + pb[2] - 4; x += 14) for (let y = pb[1] + 9; y < pb[1] + pb[3] - 4; y += 14) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
  const u = pb[2] / 0.56; ctx.lineCap = 'round';
  ctx.strokeStyle = '#8c6239'; ctx.lineWidth = 0.022 * u; ctx.beginPath(); ctx.moveTo(pb[0] + 0.12 * u, pb[1] + 0.14 * u); ctx.lineTo(pb[0] + 0.12 * u, pb[1] + 0.44 * u); ctx.stroke();
  ctx.fillStyle = STEEL_D; scn.rrect(ctx, pb[0] + 0.06 * u, pb[1] + 0.08 * u, 0.12 * u, 0.06 * u, 3); ctx.fill();
  ctx.strokeStyle = '#7d868d'; ctx.lineWidth = 0.028 * u; ctx.beginPath(); ctx.moveTo(pb[0] + 0.28 * u, pb[1] + 0.16 * u); ctx.lineTo(pb[0] + 0.28 * u, pb[1] + 0.44 * u); ctx.stroke(); ctx.lineWidth = 0.016 * u; ctx.beginPath(); ctx.arc(pb[0] + 0.28 * u, pb[1] + 0.11 * u, 0.035 * u, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#f1c64c'; scn.rrect(ctx, pb[0] + 0.36 * u, pb[1] + 0.1 * u, 0.15 * u, 0.035 * u, 2); ctx.fill(); ctx.fillStyle = '#c8503d'; scn.rrect(ctx, pb[0] + 0.4 * u, pb[1] + 0.2 * u, 0.04 * u, 0.26 * u, 3); ctx.fill();
  // sentence rail on the wall
  const a = cm.project([-0.62, RAIL_Y, 0.02]), b = cm.project([1.46, RAIL_Y - 0.04, 0.02]); scn.rrect(ctx, a[0], a[1], b[0] - a[0], b[1] - a[1], 4); ctx.fillStyle = WOOD_D; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
  for (const x of [-0.5, 1.34]) { const q = cm.project([x, RAIL_Y - 0.04, 0]), z = q[3]; ctx.beginPath(); ctx.moveTo(q[0] - 0.03 * z, q[1]); ctx.lineTo(q[0] + 0.03 * z, q[1]); ctx.lineTo(q[0], q[1] + 0.08 * z); ctx.closePath(); ctx.fillStyle = WOOD_D; ctx.fill(); ctx.stroke(); }
};
// the saw's handle is drawn behind Liv so that her hand closes over it; the rest of the scene in front of her
stage.props.push((ctx, cm, groups) => {
  groups.push({ d: -1.2, shapes: [{ t: 'fn', fn(c) {
    const y = W.saw, j = W.jit, a = cm.project([CUT - 0.1 + j, y + 0.17, -0.02]), b = cm.project([CUT - 0.36 + j, y + 0.1, -0.1]);
    c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 0.05 * a[3]; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#33373d'; c.lineWidth = 0.036 * a[3]; c.stroke();
    const g1 = cm.project([CUT - 0.2 + j, y + 0.143, -0.06]); c.strokeStyle = '#191b1f'; c.lineWidth = 0.05 * a[3]; c.beginPath(); c.moveTo(g1[0], g1[1]); c.lineTo(b[0], b[1]); c.stroke();
  } }] });
  groups.push({ d: 0.3, shapes: [{ t: 'fn', fn(c) {
    const lw = Math.max(1.4, cm.zoom * 0.005), col = { front: WOOD, top: WOOD_L, side: WOOD_D };
    // column and base of the saw (behind the bench top)
    scn.box(c, cm, 1.0, BY, -0.2, 1.06, BY + 0.98, -0.14, { front: STEEL, top: '#c3cbd0', side: STEEL_D }, INK, lw);
    scn.box(c, cm, 0.86, BY, -0.3, 1.2, BY + 0.04, -0.04, { front: STEEL_D, top: '#7b848b' }, INK, lw);
    // workbench
    for (const x of [-0.56, 1.3]) scn.box(c, cm, x, 0, 0.14, x + 0.08, BY - 0.07, 0.22, { front: WOOD_D, side: '#8a5c30' }, INK, lw);
    scn.box(c, cm, -0.5, 0.2, 0.16, 1.32, 0.25, 0.2, { front: WOOD_D, top: '#b98450' }, INK, lw);
    scn.box(c, cm, -0.66, BY - 0.07, -0.14, 1.44, BY, 0.24, col, INK, lw);
    const sh = W.shake * 0.006 * Math.sin(stage.t * 90);
    // verb block on the bench
    const B = W.block;
    if (B) {
      if (B.whole) tile(c, B.x + sh, BY, B.w, B.text, B.kind || 'wood', 0, B.alpha);
      else { tile(c, CUT - B.wp / 2 - B.gap + B.dx + sh, BY, B.wp, B.pre, 'prefix', -B.gap * 0.5, B.aPre); tile(c, CUT + B.ws / 2 + B.gap * 0.4 + B.dx + sh, BY, B.ws, B.stem, 'wood', B.gap * 0.2, B.aStem); if (B.gap < 0.004 && B.aPre > 0.9) { const q = cm.project([CUT + B.dx + sh, BY + BH, 0.06]); c.strokeStyle = 'rgba(58,28,12,.55)'; c.lineWidth = 1.2; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0], q[1] + BH * q[3]); c.stroke(); c.setLineDash([]); } }
    }
    // saw head: arm, motor, blade, guard
    const y = W.saw, j = W.jit, P3 = (x, yy, z) => cm.project([x + j, yy, z]), cb = P3(CUT, y, 0.08), s = cb[3];
    scn.box(c, cm, 0.97 + j, y + 0.06, -0.22, 1.09 + j, y + 0.2, -0.12, { front: '#4a5159', top: '#6a727a', side: '#3a4047' }, INK, lw);
    const a1 = P3(1.0, y + 0.13, -0.12), a2 = P3(CUT + 0.02, y + 0.13, 0.04); c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 0.062 * s; c.beginPath(); c.moveTo(a1[0], a1[1]); c.lineTo(a2[0], a2[1]); c.stroke(); c.strokeStyle = STEEL_D; c.lineWidth = 0.046 * s; c.stroke();
    scn.rrect(c, cb[0] + 0.03 * s, cb[1] - 0.085 * s, 0.2 * s, 0.14 * s, 0.03 * s); c.fillStyle = AMBER; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    c.strokeStyle = '#b9822a'; c.lineWidth = 0.012 * s; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(cb[0] + (0.08 + i * 0.035) * s, cb[1] - 0.05 * s); c.lineTo(cb[0] + (0.08 + i * 0.035) * s, cb[1] + 0.02 * s); c.stroke(); }
    // blade (teeth blur when it spins)
    c.save(); c.translate(cb[0], cb[1]); c.rotate(W.spin); const teeth = 22, r = RB * s; c.beginPath(); for (let i = 0; i < teeth * 2; i++) { const an = i / (teeth * 2) * TAU, rr = i % 2 ? r : r * 0.9; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); c.fillStyle = '#dfe5e9'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    c.strokeStyle = '#aeb7bd'; c.lineWidth = 0.014 * s; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(Math.cos(i * 2.1) * r * 0.25, Math.sin(i * 2.1) * r * 0.25); c.lineTo(Math.cos(i * 2.1) * r * 0.72, Math.sin(i * 2.1) * r * 0.72); c.stroke(); }
    c.beginPath(); c.arc(0, 0, r * 0.2, 0, TAU); c.fillStyle = '#7d868d'; c.fill(); c.stroke(); c.restore();
    if (W.motor) { c.globalAlpha = 0.35; c.beginPath(); c.arc(cb[0], cb[1], r * 0.96, 0, TAU); c.strokeStyle = '#ffffff'; c.lineWidth = r * 0.07; c.stroke(); c.globalAlpha = 1; }
    c.beginPath(); c.arc(cb[0], cb[1], r + 0.022 * s, PI, TAU); c.closePath(); c.fillStyle = AMBER; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    // sawdust and sparks
    for (const d of W.dust) { const q = cm.project(d.p); c.globalAlpha = 1 - d.t / d.life; c.fillStyle = d.c; c.beginPath(); c.arc(q[0], q[1], d.r * q[3], 0, TAU); c.fill(); } c.globalAlpha = 1;
  } }] });
  // tiles on the rail and tiles in flight, in front of everything
  groups.push({ d: 2, shapes: [{ t: 'fn', fn(c) { for (const t of W.tiles) tile(c, t.x, t.y, t.w, t.text, t.kind, t.rot, t.alpha, t.sc); } }] });
});

/* ---------- helpers ---------- */
class Cancel extends Error {}
const mk = () => { const id = ++W.run; return async (p) => { const r = await p; if (id !== W.run) throw new Cancel(); return r; }; };
const emit = (n, hot) => { for (let i = 0; i < n; i++) W.dust.push({ p: [CUT + (Math.random() - 0.5) * 0.04, BY + BH + 0.01, 0.08], v: [(Math.random() - 0.5) * (hot ? 2.2 : 1.1), 0.6 + Math.random() * (hot ? 1.6 : 0.9), 0], t: 0, life: 0.35 + Math.random() * 0.4, r: hot ? 0.006 : 0.008, c: hot ? (Math.random() < 0.5 ? '#ffd257' : '#ff8a3c') : '#d9a868' }); };
function layout(rd) {
  const toks = rd.words.map((w) => ({ text: w === '#F' || w === '#V' ? rd.fin : w === '#P' ? rd.pre : w, slot: w[0] === '#' ? w : null })), gap = 0.03;
  toks.forEach((t) => (t.w = t.text === '.' ? 0.07 : textM(t.text)));
  let x = 0.42 - (toks.reduce((a, t) => a + t.w, 0) + gap * (toks.length - 1)) / 2;
  W.tiles = []; W.slots = {};
  for (const t of toks) { const cx = x + t.w / 2; if (t.slot) { W.slots[t.slot] = { x: cx, w: t.w, text: t.text }; W.tiles.push({ x: cx, y: RAIL_Y, w: t.w, text: '', kind: 'ghost' }); } else W.tiles.push({ x: cx, y: RAIL_Y, w: t.w, text: t.text, kind: 'paper' }); x += t.w + gap; }
}
async function fly(tl, slot, dur, st) {
  const x0 = tl.x, y0 = tl.y, t0 = stage.t; W.tiles.push(tl); sfx.whoosh(dur * 0.8, 0.14);
  await st(stage.until(() => { const k = Math.min(1, (stage.t - t0) / dur), e = ss(k); tl.x = lerp(x0, slot.x, e); tl.y = lerp(y0, RAIL_Y, e) + Math.sin(PI * k) * 0.22; tl.rot = Math.sin(PI * k) * 0.25; tl.w = lerp(tl.w0, slot.w, e); return k >= 1; }));
  tl.rot = 0; tl.text = slot.text; sfx.tock(1.1);
}
// Liv does not speak: she acts, and a short caption says what is happening. note() shows it for a moment.
const note = (html, sec, st) => { W.say = html; ui(); return st(stage.sleep(sec)).then(() => { W.say = ''; ui(); }); };
const gripAct = Object.assign((t, a) => { const k = NF(a); return { [k.f]: Object.assign(arm([0.5, 0, 0.5], [0.15, -1, -0.3], [0, -1, 0], 'grip'), { w: 1, wp: grip() }), lean: 0.1, ctw: 0.14, hp: 0.12 }; }, { dur: 99, tin: 0.4, tout: 0.3, key: 'arms', expr: 'effort' });
const ruleText = (rd) => { const note = rd.note ? ' (' + rd.pre + rd.stem + ' = ' + rd.note + ')' : ''; return rd.sep ? 'Betonung auf dem Präfix: <b>' + rd.stress + '</b> ist trennbar. Das Präfix geht ans Satzende.' + note : 'Betonung auf dem Verb: <b>' + rd.stress + '</b> ist untrennbar. Die Säge schafft es nicht, das Verb bleibt ganz.' + note; };

/* ---------- one round ---------- */
async function round(i, st) {
  const rd = ROUNDS[i], n = VERBS.findIndex((v) => v.stress === rd.stress) + 1; W.round = i; W.rule = ''; W.verdict = ''; W.waiting = null; W.saw = RAISED; W.jit = 0; W.motor = false; sfx.motorOff(); liv.stop(); liv.setExpr('happy');
  layout(rd);
  const wp = textM(rd.pre), ws = textM(rd.stem);
  W.block = { pre: rd.pre, stem: rd.stem, wp, ws, gap: 0, dx: 1.2, aPre: 1, aStem: 1 }; ui();
  liv.turnTo(null); sfx.slide(); await st(tween(W.block, 'dx', 0, 0.55));
  const where = rd.sep ? 'vorn, auf <b>' + rd.pre + '</b>' : 'auf <b>' + rd.stem.replace(/en$/, '') + '</b>, nicht auf ' + rd.pre;
  liv.play(ACT.think, { dur: 2.3 }); await note('<b>' + rd.stress + '</b> – die Betonung liegt ' + where + '.', 2.4, st);
  let saw = true;
  if (W.mode === 1) { liv.play(ACT.shrug, { dur: 1.4 }); W.waiting = {}; ui(); saw = await st(new Promise((res) => (W.waiting.res = res))); W.waiting = null; W.tries++; const ok = saw === rd.sep; if (ok) W.score++; ok ? sfx.ding() : sfx.buzz(); W.verdict = '<b class="' + (ok ? 'ok' : 'no') + '">' + (saw && rd.sep ? 'Richtig! Die Säge trennt ' + rd.pre + ' ab.' : saw ? 'Nicht ganz: ' + rd.pre + rd.stem + ' lässt sich nicht trennen.' : rd.sep ? 'Doch sägen! ' + rd.stress + ' ist trennbar.' : 'Richtig! ' + rd.pre + rd.stem + ' bleibt ganz.') + '</b> '; ui(); await st(stage.sleep(0.5)); if (!saw && rd.sep) saw = true; }
  if (saw) {
    liv.play(gripAct, { hold: true }); await st(stage.sleep(0.55));
    W.motor = true; sfx.motorOn(); await st(stage.sleep(0.45));
    await st(tween(W, 'saw', TOUCH, 0.65));
    if (rd.sep) {
      sfx.cut(0.7); const t0 = stage.t; const sp = setInterval(() => emit(3, false), 40);
      try { await st(tween(W, 'saw', THROUGH, 0.7, (k) => k)); } finally { clearInterval(sp); }
      sfx.crack(); tween(W.block, 'gap', 0.05, 0.25); liv.setExpr('laugh');
      await st(tween(W, 'saw', RAISED, 0.55)); W.motor = false; sfx.motorOff(); liv.stop('arms');
      W.rule = ruleText(rd); ui();
      const B = W.block, pt = { x: CUT - wp / 2 - 0.05, y: BY, w: wp, w0: wp, text: rd.pre, kind: 'prefix' }, stl = { x: CUT + ws / 2 + 0.02, y: BY, w: ws, w0: ws, text: rd.stem, kind: 'verb' };
      B.aPre = 0; await st(fly(pt, W.slots['#P'], 0.75, st)); B.aStem = 0; await st(fly(stl, W.slots['#F'], 0.7, st)); sfx.ding(); W.block = null;
    } else {
      sfx.grind(0.4); W.shake = 1; const sp = setInterval(() => emit(4, true), 35), t0 = stage.t;
      try { await st(stage.until(() => { W.jit = Math.sin(stage.t * 95) * 0.004; W.saw = TOUCH - 0.002 + Math.abs(W.jit); return stage.t - t0 > 0.42; })); } finally { clearInterval(sp); }
      sfx.clonk(); W.shake = 1; W.motor = false; sfx.motorOff(); liv.stop('arms'); liv.play(ACT.ouchHand, { key: 'arms' });
      const k0 = stage.t; await st(stage.until(() => { const k = (stage.t - k0) / 0.7, kick = Math.sin(Math.min(1, k * 2.2) * PI) * (1 - k * 0.4); W.saw = lerp(TOUCH, RAISED, ss(k * 1.6)) + 0.07 * kick; W.jit = Math.sin(stage.t * 40) * 0.006 * Math.max(0, 1 - k); return k >= 1; })); W.saw = RAISED; W.jit = 0;
      W.rule = ruleText(rd); ui(); await st(stage.sleep(0.5));
    }
  }
  if (!rd.sep) {
    const B = W.block, wt = textM(rd.pre + rd.stem); W.block = { whole: true, x: CUT + (ws - wp) / 2, w: wt, text: rd.pre + rd.stem, kind: 'verb', alpha: 1 }; sfx.pop();
    W.rule = ruleText(rd); ui(); liv.play(ACT.shrug, { dur: 1.5 }); await st(stage.sleep(0.6));
    const tl = { x: W.block.x, y: BY, w: wt, w0: wt, text: rd.pre + rd.stem, kind: 'verb' }; W.block = null; await st(fly(tl, W.slots['#V'], 0.8, st)); sfx.bonk();
  }
  const list = rd.sep ? W.sep : W.ins; if (!list.includes(i)) list.push(i); ui();
  if (liv.multi) liv.turnTo(0); liv.play(rd.sep ? ACT.thumb : ACT.nod, { dur: 1.6 }); await st(stage.sleep(2.0)); liv.turnTo(null); W.done = true; ui();
}
async function show(from) {
  const st = mk(); tweens.length = 0;
  try {
    if (from === 0 && W.mode === 0 && !W.introDone) { W.block = null; W.tiles = []; ui(); if (liv.multi) liv.turnTo(0); liv.play(ACT.wave, { dur: 2.2 }); await note('Trennbar oder untrennbar? Die Säge zeigt es.', 2.4, st); liv.turnTo(null); W.introDone = true; }
    for (let i = from; i < ROUNDS.length; i++) { W.done = false; await round(i, st); if (W.mode === 1) { await st(new Promise((res) => (W.next = res))); } else await st(stage.sleep(1.1)); }
    W.block = null; if (liv.multi) liv.turnTo(0); liv.play(ACT.cheer, { dur: 2.2 }); await note('Merke: Ist das Präfix betont, ist das Verb <b>trennbar</b>.', 3.2, st); W.finished = true; ui();
  } catch (e) { if (!(e instanceof Cancel)) throw e; }
}
function go(i) { W.finished = false; W.next = null; liv.stop(); sfx.motorOff(); W.motor = false; W.saw = RAISED; W.jit = 0; W.dust = []; show(clamp(i, 0, ROUNDS.length - 1)); }
function setMode(m) { W.mode = m; W.score = 0; W.tries = 0; W.sep = []; W.ins = []; go(0); }

/* ---------- UI ---------- */
let lastUi = '';
function ui() {
  const rd = ROUNDS[W.round];
  $('round').textContent = 'Runde ' + (W.round + 1) + ' / ' + ROUNDS.length + (W.mode === 1 ? '  ·  Richtig: ' + W.score + ' / ' + W.tries : '');
  $('watch').classList.toggle('on', W.mode === 0); $('try').classList.toggle('on', W.mode === 1);
  $('sepList').textContent = W.sep.map((i) => ROUNDS[i].stress).join(', ') || '–'; $('insList').textContent = W.ins.map((i) => ROUNDS[i].stress).join(', ') || '–';
  let cap = '';
  if (W.waiting) cap = 'Was passiert mit <b>' + rd.pre + rd.stem + '</b>? Wähle: sägen oder ganz einbauen.';
  else if (W.say) cap = W.say;
  else cap = W.verdict + W.rule;
  const ctr = W.mode === 0
    ? `<button type="button" data-a="prev" ${W.round ? '' : 'disabled'}>Zurück</button><button type="button" data-a="play">${stage.paused ? 'Abspielen' : 'Pause'}</button><button type="button" data-a="next" ${W.round < ROUNDS.length - 1 ? '' : 'disabled'}>Weiter</button><button type="button" data-a="slow" class="${stage.speed < 1 ? 'on' : ''}">${stage.speed < 1 ? '0,5×' : '1×'}</button>`
    : `<button type="button" data-a="saw" ${W.waiting ? '' : 'disabled'}>Sägen</button><button type="button" data-a="whole" ${W.waiting ? '' : 'disabled'}>Ganz einbauen</button><button type="button" data-a="nextTry" ${W.next || W.finished ? '' : 'disabled'}>${W.finished ? 'Neu starten' : 'Nächstes Verb'}</button><span class="score">Richtig: ${W.score} / ${W.tries}</span>`;
  const key = cap + '|' + ctr; if (key !== lastUi) { lastUi = key; $('caption').innerHTML = cap; $('controls').innerHTML = ctr; }
}
const pause = (p) => { stage.paused = p; if (sfx.ctx) p ? sfx.ctx.suspend() : sfx.ctx.resume(); ui(); };
$('controls').addEventListener('click', (e) => {
  const a = e.target.closest('button') && e.target.closest('button').dataset.a; if (!a) return; sfx.ensure();
  if (a === 'prev') { pause(false); go(W.round - 1); } else if (a === 'next') { pause(false); go(W.round + 1); } else if (a === 'play') pause(!stage.paused);
  else if (a === 'slow') { stage.speed = stage.speed < 1 ? 1 : 0.5; ui(); }
  else if (a === 'saw' && W.waiting) W.waiting.res(true); else if (a === 'whole' && W.waiting) W.waiting.res(false);
  else if (a === 'nextTry') { if (W.finished) setMode(1); else if (W.next) { const f = W.next; W.next = null; f(); ui(); } }
});
$('watch').onclick = () => { sfx.ensure(); pause(false); setMode(0); }; $('try').onclick = () => { sfx.ensure(); pause(false); W.introDone = true; setMode(1); };
$('sound').onclick = () => { sfx.ensure(); const on = !sfx.on; sfx.setOn(on); $('sound').textContent = on ? 'Ton an' : 'Ton aus'; $('sound').setAttribute('aria-pressed', String(on)); };
const clean = () => { document.body.classList.toggle('clean'); stage.resize(); }; $('clean').onclick = clean;
addEventListener('keydown', (e) => { if (e.key === 'h' || e.key === 'H') clean(); else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); pause(!stage.paused); } else if (e.key === 'ArrowRight') go(W.round + 1); else if (e.key === 'ArrowLeft') go(W.round - 1); });
$('scene').addEventListener('click', () => { if (document.body.classList.contains('clean')) clean(); });

let gotRounds; const roundsReady = new Promise((r) => { gotRounds = r; });
function takeTexts(texts) { if (ROUNDS.length) return; if (loadRounds(texts)) gotRounds(); }
addEventListener('message', (e) => { if (e.origin === location.origin && e.source === window.parent && e.data && e.data.type === 'werkstatt-texts') takeTexts(e.data.texts); });
const closeMe = () => { sfx.motorOff(); if (EMBED) window.parent.postMessage({ type: 'werkstatt-close' }, location.origin); };
if (EMBED) {
  const b = document.createElement('button'); b.id = 'close'; b.type = 'button'; b.textContent = 'Schließen'; b.onclick = closeMe; $('clean').after(b);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMe(); }, true);
  window.parent.postMessage({ type: 'werkstatt-ready' }, location.origin); stage.resize();
}
addEventListener('keydown', (e) => { if (!W.waiting || e.target.tagName === 'BUTTON') return; if (e.key === 's' || e.key === 'S') W.waiting.res(true); else if (e.key === 'g' || e.key === 'G') W.waiting.res(false); });
const late = setTimeout(() => {
  if (ROUNDS.length) return;
  const p = document.querySelector('#start p'); if (p) p.textContent = 'Die Werkstatt braucht die Beispielsätze aus Kapitel 57. Öffne sie in der Lektion „Trennbar oder untrennbar?“ (mit Anmeldung).';
  if ($('go')) $('go').textContent = 'Nicht verfügbar';
}, 6000);
Promise.all([roundsReady, loadArt(SKIN), document.fonts ? document.fonts.ready : 0]).then(() => { clearTimeout(late); layout(ROUNDS[0]); W.tiles = []; ui(); $('go').disabled = false; $('go').textContent = 'Los geht’s'; $('go').focus(); });
$('go').onclick = () => { sfx.ensure(); $('start').remove(); W.started = true; setMode(0); };
if (TEST) { window.__tbLoad = takeTexts; window.__liv = { stage, W, liv, go, setMode, start: async () => { await roundsReady; await loadArt(SKIN); $('start').remove(); W.started = true; W.introDone = !/intro/.test(location.search); const m = /r=(\d)/.exec(location.search); W.mode = /try/.test(location.search) ? 1 : 0; go(m ? +m[1] : 0); }, step: async (sec) => { for (let i = 0; i < sec * 60; i++) { stage.frame(1 / 60); await new Promise((r) => setTimeout(r, 0)); } } }; }
