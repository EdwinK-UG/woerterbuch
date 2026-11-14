/* Deutschklinik film park with the 3D Liv. OPT-IN drop-in over grammatik/liv/film-park.js: the same
   GRAM_PARK.draw(canvas, route, t, opts) the film player already calls ('into' = Akkusativ, 'within' = Dativ).
   index.html's loadFilmPark loads this file after the 2D park, and only when the page was opened with ?liv3d=1 (or
   ?park3d=1; remembered for this browser tab; ?liv3d=0 switches it off again). Without it nothing changes.

   The picture comes from tools/liv3d/park/park3d.js (Three.js, the VRM Liv). The 3D libraries and their import map live
   in a hidden same-origin frame (park3d-frame.html), so the app page itself loads nothing new; each frame of the film is
   rendered there and copied onto the film's canvas. Until the model has loaded, and whenever it cannot load (no WebGL,
   the libraries or the model file missing: the model is not in the repository, see docs/liv3d-park.md), the 2D park that
   was loaded before this file is drawn instead, so a park scene never stays empty. */
(function (root) {
  'use strict';
  const flat = root.GRAM_PARK, CYCLE = 8.0, doc = root.document;
  let frame = null, api = null, failed = false, last = null;
  function ensure() {
    if (frame || failed) return;
    try {
      const model = root.GRAM_PARK_3D_MODEL;
      frame = doc.createElement('iframe'); frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1; frame.title = '';
      frame.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;border:0;opacity:0;pointer-events:none;visibility:hidden';
      frame.src = (root.GRAM_PARK_3D_FRAME || SRC) + (model ? '?model=' + encodeURIComponent(model) : '');
      frame.onload = () => {
        const w = frame.contentWindow, p = w && w.PARK3D_READY;
        if (!p) { fail(new Error('frame did not start')); return; }
        p.then((a) => { api = a; if (last && last[0].isConnected !== false) draw.apply(null, last); }, fail);
      };
      frame.onerror = () => fail(new Error('frame could not be loaded'));
      (doc.body || doc.documentElement).appendChild(frame);
    } catch (e) { fail(e); }
  }
  function fail(e) { failed = true; api = null; if (frame) { frame.remove(); } console.warn('GRAM_PARK (3D): using the 2D park.', e && e.message ? e.message : e); }
  function tag(ctx, W, opts) {          // the phrase tag in the top right corner, as the 2D park draws it
    const u = W / 880, k = Math.max(u, 0.85 * (opts.dpr || 1));
    ctx.font = '700 ' + Math.round(15 * k) + 'px "Avenir Next", "Segoe UI", system-ui, sans-serif';
    const tw = ctx.measureText(opts.tag).width + 20 * k, th = 26 * k, x = W - tw - 10 * u, y = 10 * u + th / 2, r = th / 2;
    ctx.beginPath(); ctx.moveTo(x + r, y - r); ctx.lineTo(x + tw - r, y - r); ctx.arc(x + tw - r, y, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x + r, y + r); ctx.arc(x + r, y, r, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
    ctx.fillStyle = 'rgba(243,237,220,0.96)'; ctx.strokeStyle = opts.goal ? '#d9622b' : '#2f5d50'; ctx.lineWidth = 2 * k; ctx.fill(); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(opts.tag, x + tw / 2, y + k);
  }
  // t: seconds into the action (start, run, settled stop; held afterwards). opts: { tag, goal, dpr }
  function draw(canvas, route, t, opts) {
    opts = opts || {}; last = [canvas, route, t, opts]; ensure();
    if (!api) { if (flat) flat.draw(canvas, route, t, opts); return; }
    try {
      const pic = api.draw(route, Math.max(t, 0), canvas.width, canvas.height), ctx = canvas.getContext('2d');      // the scene holds its last picture after its run
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(pic, 0, 0, canvas.width, canvas.height);
      if (opts.tag) tag(ctx, canvas.width, opts);
      ctx.restore();
    } catch (e) { fail(e); if (flat) flat.draw(canvas, route, t, opts); }
  }
  const SRC = (function () { const s = doc.currentScript && doc.currentScript.src; return s ? s.replace(/film-park-3d\.js.*$/, 'park3d-frame.html') : 'grammatik/liv/park3d-frame.html'; })();
  root.GRAM_PARK = { draw, CYCLE, design: 'liv-3d', flat, get ready() { return !!api; }, get failed() { return failed; } };
})(typeof window !== 'undefined' ? window : globalThis);
