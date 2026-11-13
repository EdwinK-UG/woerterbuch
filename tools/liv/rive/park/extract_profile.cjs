// Runs the canvas engine's park run (the same recording as grammatik/liv/film-park.js `record`) in Node and writes the per-frame
// kinematics the Rive park needs: tools/liv/rive/park/profile.json  (60 frames a second over the 8 s cycle).
//   node tools/liv/rive/park/extract_profile.cjs
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const ctx = { Math, JSON, console, Image: class { set src(_) {} }, addEventListener() {}, setTimeout, clearTimeout };
ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['grammatik/liv/liv-art.js', 'grammatik/liv/engine.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const L = ctx.LIV; const { Actor, SKINS, ACT, lerp } = L;
const CYCLE = 8.0, FPS = 60, RUN_START = 0.7, SKIN = SKINS.c01p;
function record(route) {
  const random = Math.random; let seed = 20261113; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  try {
    const into = route === 'into', a = new Actor(SKIN, { x: into ? -3.4 : 1.6, z: 0, dir: 1 }), dt = 1 / FPS, out = [], events = [];
    let camX = a.x + 0.9, stage = 0, done = 0;
    for (let i = 0; i <= CYCLE * FPS; i++) {
      const t = i * dt;
      if (stage === 0 && t >= RUN_START) { a.runTo(into ? 2.6 : 5.6, 0); stage = 1; events.push([t, 'run1']); }
      else if (stage === 1 && !a.target) { if (into) { stage = 3; done = t; events.push([t, 'arrived']); } else { a.runTo(2.6, 0); stage = 2; events.push([t, 'run2']); } }
      else if (stage === 2 && !a.target) { stage = 3; done = t; events.push([t, 'arrived']); }
      else if (stage === 3 && t > done + 0.2) { a.turnTo(0); a.play(into ? ACT.thumb : ACT.cheer, { dur: 1.8 }); stage = 4; events.push([t, 'turn+action']); }
      a.update(dt);
      camX = lerp(camX, a.x + a.dir * (a.v > 0.3 ? 0.5 : 0.1), 1 - Math.exp(-dt * 3.2));
      out.push([+a.x.toFixed(5), +a.v.toFixed(5), a.dir, +(a.heading || 0).toFixed(5), +(a.yaw || 0).toFixed(5), a.fixedYaw == null ? null : +a.fixedYaw.toFixed(5), +camX.toFixed(5), stage >= 1 ? 1 : 0, stage]);
    }
    return { fields: ['x', 'v', 'dir', 'heading', 'yaw', 'fixedYaw', 'camX', 'moving', 'stage'], frames: out, events, actionStart: events.find((e) => e[1] === 'turn+action')[0] };
  } finally { Math.random = random; }
}
const res = { cycle: CYCLE, fps: FPS, into: record('into'), within: record('within') };
fs.writeFileSync(path.join(__dirname, 'profile.json'), JSON.stringify(res));
for (const k of ['into', 'within']) console.log(k, 'events', JSON.stringify(res[k].events), 'x at 0/3/6/8 s', [0, 3, 6, 8].map((s) => res[k].frames[s * 60][0]), 'yaw end', res[k].frames[480][4], 'fixedYaw end', res[k].frames[480][5]);
