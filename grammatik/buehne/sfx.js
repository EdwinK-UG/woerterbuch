/* Small sounds for the scenes, made with Web Audio (no files): the clamp's click, a wagon rolling, a slip, a pop,
   a soft "right" and "not yet". Quiet on purpose; muted together with the voices. */
let ctx = null, out = null;
export const sfx = { muted: false };
function ac() {
  if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); out = ctx.createGain(); out.gain.value = 0.35; out.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
export function unlockSfx() { ac(); }
function tone(f0, f1, dur, type = 'sine', vol = 0.5, at = 0) {
  const c = ac(); if (!c || sfx.muted) return; const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.3, freq = 1200, at = 0) {
  const c = ac(); if (!c || sfx.muted) return; const t = c.currentTime + at, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(out); s.start(t);
}
export const play = {
  click() { tone(1800, 900, 0.05, 'square', 0.25); tone(2400, 1200, 0.05, 'square', 0.2, 0.06); },
  roll() { noise(0.35, 0.18, 500); },
  slip() { tone(500, 180, 0.4, 'sawtooth', 0.12); noise(0.25, 0.15, 900, 0.05); },
  pop(p = 1) { tone(380 * p, 760 * p, 0.12, 'sine', 0.4); },
  right() { tone(660, 0, 0.14, 'sine', 0.35); tone(990, 0, 0.22, 'sine', 0.3, 0.1); },
  wrong() { tone(300, 240, 0.25, 'triangle', 0.25); },
  bark() { for (const at of [0, 0.22]) { tone(520, 260, 0.13, 'sawtooth', 0.16, at); noise(0.1, 0.22, 900, at); } },
  tick() { tone(1200, 0, 0.03, 'square', 0.12); },
  plopp() { tone(900, 260, 0.11, 'sine', 0.45); noise(0.08, 0.12, 2400); },          // a bubble bursts
  splash() { noise(0.5, 0.3, 700); noise(0.3, 0.2, 2200, 0.08); },                   // water
  creak() { tone(140, 220, 0.5, 'sawtooth', 0.07); tone(180, 120, 0.45, 'sawtooth', 0.06, 0.35); },   // an old door
};
