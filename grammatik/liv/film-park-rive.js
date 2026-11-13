/* Deutschklinik film park with Liv, drawn by the Rive runtime. EXPERIMENTAL drop-in for grammatik/liv/film-park.js: the same
   GRAM_PARK.draw(canvas, route, t, opts) the film player already calls ('into' = Akkusativ, 'within' = Dativ), but the picture comes
   from grammatik/liv/park.riv (built by tools/liv/rive/build_liv.py with LIV_PARK=1). The Rive file is a pure function of its numbers
   (`t`, `route`, `goal`, text `tag`): it replays the run from 0 in fixed steps, so seeking and replaying give the same picture.
   Needs the Rive web runtime (window.rive: @rive-app/canvas) before this file. Not wired into index.html: the canvas park stays the
   default until the owner approves (see docs/liv-park.md for how to switch). */
(function (root) {
  'use strict';
  const CYCLE = 8.0, W = 1760, H = 864;
  let R = null, vm = null, off = null, ready = false, failed = false, last = null, pending = false;
  function ensure(src) {
    if (R || failed) return;
    if (!root.rive || !root.rive.Rive) { failed = true; console.warn('GRAM_PARK (Rive): the Rive runtime is not loaded'); return; }
    off = root.document.createElement('canvas'); off.width = W; off.height = H;
    try {
      R = new root.rive.Rive({
        src, canvas: off, autoplay: true, autoBind: true, stateMachines: 'Liv',
        layout: new root.rive.Layout({ fit: root.rive.Fit.Contain }),
        onLoad() { vm = R.viewModelInstance; ready = !!vm; R.resizeDrawingSurfaceToCanvas(); if (last) draw.apply(null, last); },
        onLoadError(e) { failed = true; console.warn('GRAM_PARK (Rive): load error', e); },
      });
    } catch (e) { failed = true; console.warn('GRAM_PARK (Rive):', e); }
  }
  function copy(canvas) {
    const ctx = canvas.getContext('2d'); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = Math.min(canvas.width / W, canvas.height / H), w = W * s, h = H * s;
    ctx.drawImage(off, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h); ctx.restore();
  }
  // t: seconds into the action, clamped to the 8 s cycle. opts: { tag, goal, dpr }
  function draw(canvas, route, t, opts) {
    opts = opts || {}; last = [canvas, route, t, opts];
    ensure(root.GRAM_PARK_RIVE_SRC || 'grammatik/liv/park.riv');
    if (!ready) return;
    const set = (n, v) => { const p = vm.number(n); if (p) p.value = v; };
    set('route', route === 'within' ? 1 : 0); set('t', Math.min(Math.max(t, 0), CYCLE)); set('goal', opts.goal ? 1 : 0);
    const tag = vm.string && vm.string('tag'); if (tag) tag.value = opts.tag || '';
    copy(canvas);          // the picture Rive has drawn so far; Rive redraws on its next frame with the new numbers, so copy once more then
    if (!pending) { pending = true; root.requestAnimationFrame(() => root.requestAnimationFrame(() => { pending = false; if (last) copy(last[0]); })); }
  }
  root.GRAM_PARK = { draw, CYCLE, design: 'liv-rive' };
})(typeof window !== 'undefined' ? window : globalThis);
