// Workshop sound effects, synthesized live with the Web Audio API (no audio files, no licences).
// Audio can only start after a user gesture, so everything waits for ensure().
export class Sfx {
  constructor() { this.ctx = null; this.on = true; this.motor = null; this.out = null; this.noise = null; }

  ensure() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
      this.ctx = new C(); this.out = this.ctx.createGain(); this.out.gain.value = this.on ? 0.8 : 0;
      const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      this.out.connect(comp); comp.connect(this.ctx.destination);
      const n = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; this.noise = b;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }
  get ok() { return !!this.ctx && this.on; }
  setOn(v) { this.on = v; if (this.out) this.out.gain.setTargetAtTime(v ? 0.8 : 0, this.ctx.currentTime, 0.03); if (!v) this.motorOff(); }
  now() { return this.ctx.currentTime; }
  gain(v = 0) { const g = this.ctx.createGain(); g.gain.value = v; return g; }
  env(g, t0, attack, peak, decay) { g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay); }
  noiseSrc() { const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true; s.loopStart = Math.random(); return s; }
  filter(type, freq, q = 1) { const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; }
  tone(type, freq, t0, attack, peak, decay, dest) {
    const o = this.ctx.createOscillator(), g = this.gain(); o.type = type; o.frequency.value = freq; o.connect(g); g.connect(dest || this.out);
    this.env(g, t0, attack, peak, decay); o.start(t0); o.stop(t0 + attack + decay + 0.05); return o;
  }
  burst(type, freq, q, t0, attack, peak, decay, sweepTo) {
    const s = this.noiseSrc(), f = this.filter(type, freq, q), g = this.gain(); s.connect(f); f.connect(g); g.connect(this.out);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + attack + decay);
    this.env(g, t0, attack, peak, decay); s.start(t0); s.stop(t0 + attack + decay + 0.05);
  }

  // board sliding over the bench / being pushed
  slide(dur = 0.55) { if (!this.ok) return; const t = this.now(); this.burst('lowpass', 900, 0.7, t, 0.06, 0.22, dur, 400); }
  // saw motor: spins up, keeps running until motorOff
  motorOn() {
    if (!this.ok || this.motor) return; const t = this.now(), c = this.ctx;
    const a = c.createOscillator(), b = c.createOscillator(), lp = this.filter('lowpass', 1600, 0.8), g = this.gain();
    a.type = 'sawtooth'; b.type = 'square'; a.frequency.setValueAtTime(60, t); a.frequency.exponentialRampToValueAtTime(190, t + 0.7);
    b.frequency.setValueAtTime(120, t); b.frequency.exponentialRampToValueAtTime(380, t + 0.7);
    const bg = this.gain(0.25); a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(this.out);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.25);
    a.start(t); b.start(t); this.motor = { a, b, g };
  }
  motorLoad(k) { if (!this.motor) return; const t = this.now(); this.motor.a.frequency.setTargetAtTime(190 * (1 - 0.3 * k), t, 0.08); this.motor.b.frequency.setTargetAtTime(380 * (1 - 0.3 * k), t, 0.08); }
  motorOff() {
    if (!this.motor || !this.ctx) return; const t = this.now(), m = this.motor; this.motor = null;
    m.a.frequency.setTargetAtTime(50, t, 0.25); m.b.frequency.setTargetAtTime(100, t, 0.25); m.g.gain.setTargetAtTime(0.0001, t, 0.18);
    m.a.stop(t + 1); m.b.stop(t + 1);
  }
  // blade going through wood: band-limited noise with a fast tremolo
  cut(dur = 0.7) {
    if (!this.ok) return; const t = this.now(), c = this.ctx;
    const s = this.noiseSrc(), f = this.filter('bandpass', 3000, 1.6), g = this.gain(), trem = c.createOscillator(), tg = this.gain(0.06);
    trem.frequency.value = 24; trem.connect(tg); tg.connect(g.gain); s.connect(f); f.connect(g); g.connect(this.out);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.06); g.gain.setValueAtTime(0.2, t + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t); trem.start(t); s.stop(t + dur + 0.05); trem.stop(t + dur + 0.05); this.motorLoad(1); setTimeout(() => this.motorLoad(0), dur * 1000);
  }
  // blade biting something it cannot cut
  grind(dur = 0.4) {
    if (!this.ok) return; const t = this.now();
    this.burst('bandpass', 5200, 7, t, 0.02, 0.28, dur);
    for (let i = 0; i < 5; i++) this.tone('square', 1900 + i * 140, t + i * 0.07, 0.005, 0.05, 0.05);
    this.motorLoad(1);
  }
  clonk() {
    if (!this.ok) return; const t = this.now();
    [[233, 0.9, 0.22], [587, 0.6, 0.16], [1247, 0.35, 0.1], [2011, 0.22, 0.07]].forEach(([f, d, p]) => this.tone('sine', f, t, 0.003, p, d));
    this.burst('highpass', 2500, 0.7, t, 0.002, 0.35, 0.05); this.tone('sine', 85, t, 0.004, 0.4, 0.22);
  }
  crack() { if (!this.ok) return; const t = this.now(); this.burst('highpass', 1600, 0.8, t, 0.002, 0.45, 0.07); this.tone('triangle', 170, t, 0.003, 0.3, 0.12); }
  whoosh(dur = 0.6, peak = 0.22) { if (!this.ok) return; const t = this.now(); this.burst('bandpass', 350, 0.9, t, dur * 0.45, peak, dur * 0.55, 2400); }
  tock(pitch = 1, peak = 0.35) { if (!this.ok) return; const t = this.now(); this.tone('triangle', 820 * pitch, t, 0.002, peak, 0.09); this.burst('bandpass', 1800 * pitch, 2, t, 0.001, peak * 0.6, 0.035); }
  ding() { if (!this.ok) return; const t = this.now(); this.tone('sine', 1046.5, t, 0.004, 0.22, 1.1); this.tone('sine', 1568, t + 0.09, 0.004, 0.16, 1.0); this.tone('sine', 2093, t + 0.09, 0.004, 0.05, 0.6); }
  buzz() { if (!this.ok) return; const t = this.now(), lp = this.filter('lowpass', 900, 0.7); lp.connect(this.out); this.tone('square', 220, t, 0.01, 0.08, 0.17, lp); this.tone('square', 185, t + 0.2, 0.01, 0.08, 0.22, lp); }
  bonk() { if (!this.ok) return; const t = this.now(), o = this.ctx.createOscillator(), g = this.gain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.4); o.connect(g); g.connect(this.out); this.env(g, t, 0.01, 0.18, 0.4); o.start(t); o.stop(t + 0.5); }
}
