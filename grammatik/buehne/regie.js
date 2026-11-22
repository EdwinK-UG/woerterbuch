/* Regie: scenes written as data (the owner's long versions, whose German and English scripts are written apart and
   may be staged differently). The private lines file carries `acts`; each act is a scene:
     { name, cast: ['anton', 'liv'], need?: [… also those who come in later], beats: [ … ] }
   A beat is an object whose keys run in their written order; what moves (walks, the camera, set changes) runs on
   while the beat goes on, and the beat ends when its line and everything it started are done:
     say: 'e01'                                   a line (the narrator's board opens by itself, tafel.js)
     line: 'l01', pic, icon, strip, kind          an example sentence with its bubble (blase.js): the picture of what it
                                                  means, the modal verb's icon, the sentence strip; kind: 'think'
     place: { liv: [x, { d, left, show }] }       put people somewhere at once (x: a number, or a named spot of the
                                                  set with an offset: 'door+0.5', 'window+0.35')
     walk: { lena: x } / run: { liv: x }           walk or run there
     turn: { liv: true }   face: { liv: 'laugh' }   trig: { anton: 'wave' }   (gestures: wave point cheer think pull clap)
     cam: [x, k, seconds]                         move the camera (no zooming: keep k at 1)
     wait: seconds                                pause
     calm: ['liv', 'anton']                       back to a friendly face
     bubble: { who?, kind?, pic, icon, strip }   a bubble without a line (hide: true clears it)
     <verb>: …                                    anything the scene's own file adds (merk, sign, window, sweep, saw …)
   Unknown keys are ignored, so a script can name a verb another scene does not have. */
export function actsToScenes(B, acts, verbs = {}, spots = {}) {
  const { A, place, walkTo, turn, trig, face, cam, say, wait, need } = B;
  const at = (x) => { if (typeof x === 'number') return x; const m = /^([a-z]+)([+-][\d.]+)?$/.exec(String(x)); return m && spots[m[1]] != null ? spots[m[1]] + (+m[2] || 0) : 0; };
  async function beat(b) {
    const running = [];
    for (const [k, v] of Object.entries(b)) {
      if (k === 'say') await say(v, b.sayOpt);
      else if (k === 'line') await verbs.line(v, b, b.sayOpt);
      else if (k === 'place') for (const [who, [x, o]] of Object.entries(v)) place(A[who], at(x), o || {});
      else if (k === 'walk' || k === 'run') for (const [who, x] of Object.entries(v)) running.push(walkTo(A[who], at(x), { run: k === 'run' }));
      else if (k === 'turn') for (const [who, left] of Object.entries(v)) turn(A[who], left);
      else if (k === 'face') for (const [who, f] of Object.entries(v)) face(A[who], f);
      else if (k === 'trig') for (const [who, g] of Object.entries(v)) trig(A[who], g);
      else if (k === 'calm') for (const who of v) face(A[who], 'happy');
      else if (k === 'cam') running.push(cam(...v));
      else if (k === 'wait') await wait(v);
      else if (k === 'bubble') { if (v.hide) verbs.hideBubble?.(); else running.push(verbs.bubble?.(v)); }
      else if (verbs[k] && !['pic', 'icon', 'strip', 'kind', 'sayOpt', 'line'].includes(k)) running.push(verbs[k](v, b));
    }
    await Promise.all(running);
  }
  return (acts || []).map((act) => ({ name: act.name, async run() {
    if (act.cast) B.cast(...act.cast);
    if (act.cast || act.need) await need(...new Set([...(act.cast || []), ...(act.need || [])]));
    for (const b of act.beats || []) await beat(b);
  } }));
}
