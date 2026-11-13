# Liv 3D: the VRM player

Branch `liv/liv3d` (from `feat/liv-2d-scenes`), local only. `tools/liv3d/` is a small runtime that makes any humanoid VRM
walk, run, gesture and emote procedurally, without animation files. It replaces the abandoned Rive rig; the Rive rig's
tuned gait numbers and the canvas engine's 27 actions are its specification. No model file is committed
(`tools/liv3d/models/` is git-ignored).

## Files

| File | What |
|---|---|
| `tools/liv3d/liv3d.js` | `LivActor`: loading, locomotion (step planner with world-planted feet), pose layers, IK, look, props, replay |
| `tools/liv3d/rig.js` | measures the loaded VRM and drives its normalised humanoid bones; two-bone IK, rotation helpers |
| `tools/liv3d/hands.js` | 17 hand shapes, finger springs with a cascade, finger bone mapping |
| `tools/liv3d/face.js` | 10 expressions mapped onto VRM presets, blinks, gaze and idle glances |
| `tools/liv3d/actions.js` | the 27 canvas actions (same timings, blends, hand targets) |
| `tools/liv3d/props.js` | apple, crate, saw handle, satchel (built from simple geometry, toon material, ink outline) |
| `tools/liv3d/demo/` | `index.html` + `demo.js` (buttons for everything, orbit camera, stepping hooks), `testkit.js` (tests) |

Stack: Three.js r160 and `@pixiv/three-vrm` 3.0.0 through an import map (same Three version as the Kapitel 57
workshop). Plain ES modules, no bundler, no other dependencies.

## Using it

```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/",
  "@pixiv/three-vrm": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.0.0/lib/three-vrm.module.min.js" } }</script>
<script type="module">
  import { LivActor } from './tools/liv3d/liv3d.js';
  const liv = await LivActor.load('tools/liv3d/models/liv.vrm', { scale: 1 });
  scene.add(liv.root);
  liv.run(); liv.play('wave'); liv.setExpression('laugh');
  // every frame: liv.update(dt); renderer.render(scene, camera);
</script>
```

World units are metres; `actor.root` is her world (place or scale it as a whole). Yaw 0 faces +Z.

### API

| Call | Does |
|---|---|
| `LivActor.load(url, { scale, onProgress })` | loads a VRM (VRM 0 models are turned to face +Z), measures it, returns the actor |
| `actor.root` | `THREE.Group` to add to the scene (body, props, contact shadow, gaze target) |
| `actor.update(dt)` | advances everything (internally in steps of at most 1/60 s), then `vrm.update` (spring bones) |
| `walk(heading?)`, `run(heading?)`, `stop()` | walk / run speed for her leg length, along `heading` (radians) or straight on |
| `setVelocity(speed, heading)` | any speed (m/s) and heading; she turns and changes speed gradually |
| `moveTo(x, z, { run, speed, then })` | goes there and stops; returns a promise; `then(actor)` is called synchronously on arrival |
| `turnTo(yaw)`, `turnToward(x, z)` | turns on the spot with small steps (`null` = free) |
| `play(name or 1..27, { side, dur, in, out, hold })` | plays an action, layered over standing or walking; promise resolves when it ends |
| `stopAction(key?)` | blends actions out (`'act'`, `'arms'`, `'hold'`) |
| `setHand('L'|'R', shape, grip)` | overrides one hand's shape (`null` = back to the pose's own) |
| `setExpression(name, amount)` | happy (rest), smile, neutral, laugh, surprised, sad, think, ouch, effort, wink; or any VRM expression name |
| `blink()` | one blink now (she also blinks by herself every 2.2 to 5.4 s) |
| `lookAt(vec3 | null)` | head turns most of the way, eyes the rest; `null` = idle glances |
| `holdProp('apple'|'crate'|'sawHandle'|null)` | a prop in the right hand (crate: both hands, carry pose); `throw` releases the apple |
| `attachSatchel(on = true)` | the tan satchel on a cross-body strap (fitted to the model's surface) |
| `after(sec, fn)` | a timer in actor time (deterministic, unlike `setTimeout`) |
| `reset({ x, z, yaw })` | standing, nothing playing, no props |
| `replay(script, t, start)` | **pure function of time**: reset and simulate in fixed 1/60 s steps to `t` (spring bones only for the last 1.5 s). `script = [{ t, do: (actor) => ... }]` |
| `walkSpeed`, `runSpeed`, `v`, `yaw`, `x`, `z`, `frozen` | read-outs |

Exports: `LivActor`, `ACTION_NAMES` (27, canvas order), `EXPRESSION_NAMES`, `SHAPE_NAMES` (17).
Hand shapes: relaxed, open, flat, wave, fist, point, thumbsUp, pinch, gripSphere, gripHandle, carry, beckon, count1..5.

### Pointing it at liv.vrm

Put the model at `tools/liv3d/models/liv.vrm` (git-ignored; copy it from the lead's checkout when it exists). The demo
loads `../models/liv.vrm` by default and falls back to `../models/sample.vrm` (the three-vrm sample
`VRM1_Constraint_Twist_Sample.vrm`, download it there for development). `?model=<url>` loads any other VRM,
`?scale=0.7` scales the model, `?ui=0` hides the panel.

Nothing is tied to the sample's proportions: bone positions, leg and arm lengths, ankle height, foot length (ankle to
toes bone), hip and shoulder width, torso and head size (from the rest-pose vertices) are measured at load. Speeds and
cadence scale with the square root of the leg length (Froude scaling of the 2D rig's child with 0.39 m legs: 0.9 m/s at
2.9 steps per second walking, 2.5 m/s running); step width, foot lift, sway and prop sizes scale with the leg length.
For the real model check: VRoid hair materials are recognised by name (`hair`) so the satchel strap and the body
measurements ignore the hair; the satchel strap is fitted to the clothes' surface; the spring bone settings are the
model's own (the runtime adds a moving centre and a little air, see below).

## How it moves

- **Gait** (one model for walk and run, `_locomotion` / `_stepFoot`): a phase advances at the 2D rig's cadence
  `1.9 + 1.0 min(v,.9)/.9 + max(0, v-.9) .45` steps/s (Froude-scaled). Each foot is planted at a spot in the world and
  never moves while it is on the ground; a swinging foot travels from its lift-off spot to a predicted landing spot (where
  the body will be, half a stance ahead, at the stance width, turned with the body). Heel strike (toes up 0.26 rad walking),
  flat foot, heel lift and toe push-off (ball pivot, up to 0.62 / 0.8 rad) are rockers about the heel and the ball, so the
  contact point stays put. Swing lift 5 cm walking to 17 cm running (scaled by leg length); running, the swinging leg
  folds (heel toward the hip). The swing always ends exactly when its phase does, so speed changes never make a foot snap.
- **Stance share** 62 % walking to 36 % running (2D rig), but limited so the body travels at most about 1.05 leg lengths
  over a planted foot: with the specified cadence the run's stance would otherwise need the hips to drop 15 %. In practice
  the run uses 30 % (adult sample and 0.7 scale alike). A planted foot left behind while she slows from a run lets go
  early (and the phase hurries a little), so she brakes in a few shorter steps.
- **Speed** changes over several steps (accelerating 0.8 to 2.4 m/s², braking about the same); big heading changes slow
  her down first; standing turns are taken with small steps (both feet re-planted under the turned body), and she stops
  with both feet planted under her.
- **Pelvis**: lowest at double support and rising over the standing leg walking, sinking on landing and rising in flight
  running (2D rig model), always within reach of both planted ankles (soft limit, so knees never lock or overreach); it
  drops at once when it must and rises smoothly. Side sway toward the standing leg, pelvis yaw and roll.
- **Upper body**: counter-rotating chest (7 to 14°), forward lean 2.6° walking and 11° running plus a little with
  acceleration, head steadied (keeps 45 % of the lean, 20 % of the twist). Arms swing against the legs (2D rig angles),
  elbows fold to about 85° running with loose fists.
- **Arms**: two-bone IK with an elbow hint, in the chest frame (arm lengths from the shoulder, as the canvas). Targets
  are pushed out of an elliptic torso (measured at chest and hips) and a head sphere; the reach saturates softly (an arm
  never locks straight, which would make the elbow swing wildly); the forearm takes 60 % of the wrist twist.
- **Idle**: breathing (pelvis, chest, shoulders), a slow weight shift, small head motion, blinks, saccades and glances.
- **Hands**: per channel a damped spring (slight overshoot), cascade index → little finger (~60 ms), idle drift; thumbs
  have opposition, adduction and flexion axes worked out from the model's own thumb bones.
- **Spring bones** (hair, skirt): simulated relative to a centre that trails the body (0.18 s), so hair swings on speed
  changes, turns, crouches and the gait's bounce instead of streaming at constant speed (the sample's hair has no gravity
  and 0.4 drag, which made it fly horizontally); gravity tilts back a little with speed (`actor.air`, default 1).
- **Actions**: blended like the canvas `blendInto`; the lower body (hips height, feet, hop) only while she stands;
  `carry`/`push`/`pull` use the `arms` key; the action's expression overrides while it plays. `think` puts the hand at the
  chin, measured from the face (not the canvas numbers, which put it on the eye in 3D).

## What was verified (and how)

Served with a local static server, looked at in the built-in browser with the deterministic hooks (`__step`, `__seek`,
`__render`) and `testkit.js`, which renders contact sheets at a fixed size and posts them to a local sink (a 20-line
Python server on 127.0.0.1:8794 that saves POST bodies; not part of the repo). All with the sample model.

- **Foot sliding** (`testkit.slideTest`): scenario walk 2.5 s → stop → turn on the spot 90° → run 3 s → stop → turn 135°.
  For every planted segment the contact point (heel while the toes are up, ball while the heel is up, the foot when flat)
  is tracked on the final skeleton: **0.000 mm horizontal drift, < 0.02 mm vertical**, 63 segments, also at scale 0.7
  (72 segments). Planted-leg overreach: 0 mm.
- **Popping**: largest frame-to-frame rotation of any leg or spine bone over the scenario 16 to 20° (knee swing in the run)
  with no isolated jumps (largest step-to-step change about 10°, at running speed). All 27 actions played one after another
  standing: arm bones move up to about 25°/frame while the 0.22 s canvas blends raise an arm, continuously (no flips: the
  elbow side is kept, twist is taken by angle).
- **Proportions**: the same scenario with the VRM scaled to 0.7 (leg 0.54 m): walk 1.06 m/s at 2.47 steps/s, run 2.94 m/s
  at 3.08 steps/s, zero drift, no overreach, gait sheets look the same.
- **Looked at**: walk and run cycles, 8 frames each, side / front / back / three-quarter; deceleration from a run;
  turn on the spot; all ten expressions; all 27 actions (5 frames each, plus wave, carry, thumb, cheer and jump while
  walking); the 17 hand shapes on a close-up; apple, saw handle, crate; the satchel standing, walking, waving, bowing,
  crouching and cheering; the park route.
- **Replay**: `__seek(5)` twice and with a different seek in between gives identical bone rotations (hair 1e-13); the
  park route (run 6 m from x = -3.4 at 2.48 m/s, stop at 2.6, turn to the viewer, thumbs-up) arrives within 1 cm.
  A seek to 5 s re-simulates 300 steps in about 0.14 s.
- Blinks: 7 in 20 s idle. No console errors (the missing `liv.vrm` 404 is the expected fallback).

## Weak spots (honest list)

- Only tested on the adult-proportioned sample (and it scaled). The child model may need: the arm rest pose (`restArm`,
  hand just beside the thigh) and the torso/head avoidance radii checked; the satchel and crate sizes; hair and skirt
  spring settings; thumb axes (worked out from the thumb bones, verify the fist and thumbs-up).
- Running stance is 30 %, not the specified 36 % (see above); the 2D rig's numbers overstretch a 3D leg.
- Braking hard from a run lowers the hips to about 80 % of standing height for a step or two.
- Raising an arm in the canvas' 0.22 s blend is fast (up to ~25° per frame); it reads as snappy, not as a pop.
- Hair can flare briefly when she drops quickly (crouch, sit) because the sample's hair is very light (no gravity);
  long hair rests on the thighs while crouching (spring colliders).
- `moveTo` stops at each point (no path following); "Walk a circle" in the demo is stop-and-go.
- The crate follows the hands (a one-handed gesture while carrying lifts one side); a whole-body action while walking
  plays only its upper body. `dance` steps the feet by offsets, not by planted steps.
- The saw handle has a short blade stub; no saw motion (that belongs to the workshop scene).
- MToon outlines are the model's own (the sample has them); a model exported without outlines will not get them.
- Not checked: phones / Safari, performance with several actors, VRM 0.x models (rotation handled, untested).
