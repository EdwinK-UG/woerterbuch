/* Liv engine · actions. Each action is a function (t seconds, actor) -> partial pose, layered over walking or idling.
   Hand targets are in arm lengths from the shoulder [out, up, forward]; m = 1 measures from the breastbone instead.
   "near" is the arm towards the viewer, "far" the other one, so gestures read well whichever way she faces. */
const ACT = {};
const arm = (h, e, palm, fing, o) => Object.assign({ h, e, palm, fing: (typeof fing === 'string' ? FING[fing] : fing).slice(), spread: 0.2, bend: 0, m: 0, art: 0 }, o);
const def = (name, dur, fn, o) => { fn.dur = dur; Object.assign(fn, o); ACT[name] = fn; return fn; };
const NF = (a) => (a.near() === 'R' ? { n: 'aR', f: 'aL', sn: 'shR', sf: 'shL', fn: 'fR', ff: 'fL' } : { n: 'aL', f: 'aR', sn: 'shL', sf: 'shR', fn: 'fL', ff: 'fR' });
const mixF = (a, b, t) => FING[a].map((x, i) => lerp(x, FING[b][i], t));
const pulse = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d));

def('wave', 2.6, (t, a) => { const s = Math.sin(t * 9.5), k = NF(a); return { [k.n]: arm([0.64 + 0.16 * s, 0.6 - 0.04 * Math.abs(s), 0.3], [1, -0.55, 0.1], [0, 0, 1], 'open', { spread: 0.7 }), hr: 0.06, crl: 0.03 }; });
def('point', 2.0, (t, a) => { const k = NF(a); return { [k.f]: arm([0.9, 0.1, 0.22], [0.3, -1, -0.3], [0, -1, 0], 'point'), ctw: 0.06 }; });
def('pointUp', 2.0, (t, a) => { const k = NF(a); return { [k.n]: arm([0.6, 0.62, 0.3], [0.9, -0.6, 0], [-1, 0, 0.2], 'point'), hp: -0.08 }; });
def('thumb', 2.0, (t, a) => { const k = NF(a), b = 0.03 * Math.sin(t * 11) * pulse(t, 0.2, 0.5, 1.2, 1.5); return { [k.n]: arm([0.3, -0.12 + b, 0.66], [0.7, -0.8, -0.2], [-1, 0, 0.15], 'thumb'), hr: 0.05 }; }, { expr: 'wink' });
def('clap', 2.4, (t, a) => { const g = Math.abs(Math.sin(t * PI / 0.3)), h = [0.03 + 0.14 * g, -0.22, 0.62]; const A = arm(h, [0.9, -0.7, 0], [-1, 0, 0], 'flat', { m: 1 }); return { aL: A, aR: A, py: 0.985 + 0.006 * g }; }, { expr: 'laugh' });
def('shrug', 2.2, (t, a) => { const A = arm([0.5, -0.46, 0.42], [0.5, -0.9, -0.3], [0, 1, 0.2], 'open', { spread: 0.5 }); return { aL: A, aR: A, shL: 1.3, shR: 1.3, hr: 0.1 }; }, { expr: 'think' });
def('think', 3.0, (t, a) => { const k = NF(a); return { [k.n]: arm([0.14, 0.24, 0.44], [0.9, -0.8, 0.2], [-0.3, 0, -1], [0.5, 0.1, 0.9, 1, 1], { m: 0.85 }), [k.f]: arm([-0.05, -0.62, 0.32], [0.9, -0.6, -0.2], [0, 0, -1], 'relaxed', { m: 0.5 }), hr: -0.09, hp: -0.04 }; }, { expr: 'think' });
def('cheer', 2.4, (t, a) => { const b = Math.abs(Math.sin(t * PI / 0.42)), A = arm([0.42, 0.92 + 0.04 * b, 0.12], [1, 0.2, 0], [0, 0, 1], 'open', { spread: 0.8 }); return { aL: A, aR: A, hop: 0.05 * b * a.P.hipH, hp: -0.1 }; }, { expr: 'laugh' });
def('hips', 2.4, (t, a) => { const A = arm([0.34, -0.62, 0.0], [1, -0.15, -0.7], [0, 0, -1], 'fist'); return { aL: A, aR: A }; });
def('present', 2.6, (t, a) => { const k = NF(a), ph = a.skin.photoPose; return ph ? { [k.n]: ph.aR, [k.f]: ph.aL } : { [k.f]: arm([0.85, 0.1, 0.3], [0.3, -1, -0.3], [0, 1, 0.2], 'open') }; });
def('stop', 2.0, (t, a) => { const k = NF(a); return { [k.n]: arm([0.2, 0.22, 0.86], [0.6, -0.8, -0.2], [0, 0, 1], 'flat', { bend: -0.5 }) }; }, { expr: 'neutral' });
def('beckon', 2.4, (t, a) => { const k = NF(a), c = 0.5 + 0.5 * Math.sin(t * 9); return { [k.n]: arm([0.3, -0.05, 0.75], [0.7, -0.8, -0.2], [0, 1, 0], mixF('open', 'hook', c), { bend: 0.5 * c }) }; });
def('count', 3.0, (t, a) => { const k = NF(a), n = Math.min(2, Math.floor(t / 0.9)), b = 0.03 * Math.exp(-((t % 0.9) * 8)); return { [k.n]: arm([0.62, 0.38 + b, 0.42], [0.9, -0.7, 0], [0, 0, 1], ['one', 'two', 'three'][n], { spread: 0.5 }) }; });
def('nod', 1.6, (t) => ({ hp: 0.2 * Math.sin(t * TAU / 0.55) }), { tin: 0.1 });
def('shake', 1.6, (t) => ({ hy: 0.5 * Math.sin(t * TAU / 0.5), hr: 0.03 * Math.sin(t * TAU / 0.5) }), { tin: 0.1, expr: 'neutral' });
def('bow', 2.2, (t, a) => { const A = arm([0.16, -0.9, -0.2], [0.4, -0.3, -1], [-1, 0, 0], 'relaxed'); return { lean: 0.6, hp: 0.3, aL: A, aR: A, py: 0.96 }; }, { tin: 0.45, tout: 0.45 });
// whole-body actions
def('jump', 1.5, (t, a) => {
  const H = a.P.hipH, cr = pulse(t, 0, 0.28, 0.3, 0.42) + pulse(t, 0.86, 0.94, 1.0, 1.3) * 0.75, air = clamp((t - 0.4) / 0.46, 0, 1), up = seg(t, 0.3, 0.5) * (1 - seg(t, 0.9, 1.25));
  const hop = t > 0.4 && t < 0.86 ? 4 * 0.3 * H * air * (1 - air) : 0, tuck = Math.sin(PI * air) * 0.16;
  const A = arm(mix([0.14, -0.82, -0.42], [0.36, 0.86, 0.2], up), mix([0.3, -0.2, -1], [1, 0, 0], up), [-1, 0, 0], 'open', { spread: 0.5 });
  return { py: 0.985 - 0.2 * cr, lean: 0.24 * cr - 0.05 * up, hop, aL: A, aR: A, fL: { p: [1.05, tuck, hop > 0 ? -0.05 : 0], pitch: -0.5 * Math.sin(PI * air) }, fR: { p: [1.05, tuck * 0.8, hop > 0 ? 0.05 : 0], pitch: -0.5 * Math.sin(PI * air) }, hp: 0.1 * cr - 0.12 * up };
}, { tin: 0.08, tout: 0.2, expr: 'laugh' });
def('crouch', 2.6, (t, a) => { const A = arm([0.2, -0.5, 0.75], [0.8, -0.6, 0], [0, -1, 0], 'relaxed', { m: 0.3 }); return { py: 0.56, psf: -0.1, lean: 0.5, hp: -0.3, aL: A, aR: A }; }, { tin: 0.5, tout: 0.5 });
def('carry', 2, () => { const A = arm([0.3, -0.42, 0.55], [1, -0.6, -0.4], [-1, 0, 0], 'grip', { m: 1 }); return { aL: A, aR: A, lean: -0.05 }; }, { key: 'arms' });
def('push', 2.4, (t, a) => { const A = arm([0.14, -0.1, 0.9], [0.8, -0.7, -0.2], [0, 0, 1], 'flat', { m: 0.2, bend: -0.6 }); return { aL: A, aR: A, lean: 0.3, hp: -0.2 }; }, { key: 'arms', expr: 'effort' });
def('pull', 2.4, (t, a) => { const A = arm([0.12, -0.3, 0.8], [0.8, -0.7, -0.2], [-1, 0, 0], 'grip', { m: 0.6 }); return { aL: A, aR: A, lean: -0.22, py: 0.93 }; }, { key: 'arms', expr: 'effort' });
def('throw', 1.5, (t, a) => {
  const k = NF(a), w = seg(t, 0, 0.5), r = seg(t, 0.55, 0.72);
  return { [k.n]: arm(mix(mix([0.2, -0.5, 0.3], [0.4, 0.5, -0.55], w), [0.25, 0.3, 0.92], r), mix([0.8, -0.4, -0.6], [0.6, -0.8, 0], r), [0, 0, 1], r > 0.5 ? 'open' : 'grip'), ctw: (a.near() === 'R' ? 1 : -1) * (-0.35 * w + 0.6 * r), lean: -0.08 * w + 0.22 * r };
}, { tin: 0.12 });
def('kick', 1.3, (t, a) => {
  const k = NF(a), w = pulse(t, 0, 0.35, 0.35, 0.5), r = pulse(t, 0.4, 0.55, 0.7, 1.0);
  return { [k.fn]: { p: [1.0, 0.1 * w + 0.22 * r, -0.35 * w + 0.55 * r], pitch: -0.5 * w + 0.3 * r }, lean: 0.06 * w - 0.14 * r, py: 0.975, [k.n]: arm([0.35, -0.6, 0.45 * w - 0.4 * r], [0.6, -0.5, -0.6], [-1, 0, 0], 'relaxed'), [k.f]: arm([0.4, -0.6, -0.4 * w + 0.5 * r], [0.6, -0.5, -0.6], [-1, 0, 0], 'relaxed') };
}, { tin: 0.1 });
def('sit', 3.0, (t, a) => { const A = arm([0.12, -0.62, 0.42], [0.8, -0.6, -0.3], [0, -1, 0], 'relaxed', { m: 0.3 }); return { py: 0.6, psf: -0.34, lean: 0.06, aL: A, aR: A, fL: { p: [1.0, 0, 0.12], pitch: 0 }, fR: { p: [1.0, 0, 0.2], pitch: 0 } }; }, { tin: 0.6, tout: 0.6 });
def('dance', 3.2, (t, a) => {
  const s = Math.sin(t * TAU / 0.8), c = Math.cos(t * TAU / 0.8), b = Math.abs(Math.sin(t * TAU / 0.8));
  return { psx: 0.6 * s, prl: 0.06 * s, crl: -0.08 * s, py: 0.975 - 0.03 * b, hr: 0.08 * s, aL: arm([0.5, 0.2 + 0.25 * s, 0.4], [1, -0.4, 0], [0, 0, 1], 'open', { spread: 0.6 }), aR: arm([0.5, 0.2 - 0.25 * s, 0.4], [1, -0.4, 0], [0, 0, 1], 'open', { spread: 0.6 }), fL: { p: [1.2, 0.05 * Math.max(0, -c), 0], pitch: 0 }, fR: { p: [1.2, 0.05 * Math.max(0, c), 0], pitch: 0 } };
}, { expr: 'laugh' });
def('explain', 3.0, (t, a) => { const k = NF(a), b = Math.sin(t * 5.2); return { [k.n]: arm([0.44, -0.2 + 0.05 * b, 0.6], [0.8, -0.8, -0.1], [0, 1, 0.3], 'open', { spread: 0.35, bend: -0.15 + 0.1 * b }), hr: 0.03 * b }; });
def('ouchHand', 1.6, (t, a) => { const k = NF(a), s = Math.sin(t * 26) * Math.exp(-t * 1.6); return { [k.f]: arm([0.5 + 0.1 * s, -0.1 + 0.08 * Math.abs(s), 0.6], [0.5, -0.9, -0.2], [0, -1, 0], 'open', { spread: 0.7, bend: 0.5 * s }), lean: -0.12, hr: -0.06 }; }, { expr: 'ouch', tin: 0.08 });
