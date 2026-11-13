/* Liv engine · stage: canvas, camera, frame loop, and small drawing helpers for scenery. */
class Stage {
  constructor(canvas, o = {}) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.cam = new Camera(); this.actors = []; this.props = []; this.t = 0; this.paused = false; this.speed = 1; this.ink = o.ink || '#3a1c0c';
    this.bg = null; this.fg = null; this.onUpdate = null; this.W = 0; this.H = 0; this._waits = []; this.fit = o.fit || null; this._last = 0; this.manual = !!o.manual;
    this.resize(); addEventListener('resize', () => this.resize());
    if (!this.manual) requestAnimationFrame((n) => this.loop(n));
  }
  resize() { const r = this.cv.getBoundingClientRect(), d = Math.min(2.5, window.devicePixelRatio || 1); this.W = Math.max(50, r.width); this.H = Math.max(50, r.height); this.cv.width = Math.round(this.W * d); this.cv.height = Math.round(this.H * d); this.dpr = d; if (this.fit) this.fit(this); }
  // a wait that follows the stage clock, so it pauses with the stage
  sleep(sec) { return new Promise((res) => this._waits.push({ t: this.t + sec, res })); }
  until(fn) { return new Promise((res) => this._waits.push({ fn, res })); }
  loop(now) { const dt = Math.min(0.05, (now - (this._last || now)) / 1000); this._last = now; this.frame(dt); requestAnimationFrame((n) => this.loop(n)); }
  frame(dtReal) {
    const dt = this.paused ? 0 : dtReal * this.speed, ctx = this.ctx, cam = this.cam;
    if (dt > 0) {
      this.t += dt; if (this.onUpdate) this.onUpdate(dt, this);
      for (const a of this.actors) a.update(dt);
      const w = this._waits; this._waits = []; for (const x of w) { if (x.fn ? x.fn() : this.t >= x.t) x.res(); else this._waits.push(x); }
    } else if (!this.actors.every((a) => a.ch.J)) for (const a of this.actors) a.update(0.001);
    cam.cx = this.W / 2; cam.update(); ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.clearRect(0, 0, this.W, this.H);
    if (this.bg) this.bg(ctx, cam, this);
    for (const a of this.actors) if (a.ch.J && !a.hidden) a.ch.drawShadow(ctx, cam);
    const groups = [];
    for (const p of this.props) p(ctx, cam, groups, this);
    for (const a of this.actors) if (a.ch.J && !a.hidden) a.draw(ctx, cam, groups);
    drawGroups(ctx, groups, this.ink);
    if (this.fg) this.fg(ctx, cam, this);
  }
}

/* scenery helpers: everything is projected with the same camera as the characters */
const scn = {
  poly(ctx, cam, pts3, fill, stroke, lw) { ctx.beginPath(); pts3.forEach((p, i) => { const q = cam.project(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.lineJoin = 'round'; ctx.stroke(); } },
  // axis-aligned box: draws the faces the camera sees (front, top, and the side facing the camera's x)
  box(ctx, cam, x0, y0, z0, x1, y1, z1, col, ink, lw) {
    const P = (x, y, z) => [x, y, z];
    scn.poly(ctx, cam, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], col.top || col.front, ink, lw);
    const cx = cam.target[0]; if (cx > x1) scn.poly(ctx, cam, [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], col.side || col.front, ink, lw); else if (cx < x0) scn.poly(ctx, cam, [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], col.side || col.front, ink, lw);
    scn.poly(ctx, cam, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], col.front, ink, lw);
  },
  rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); },
};
