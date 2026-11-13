# Liv in Rive: progress (three-quarter view, walk and run)

Branch `feat/liv-2d-scenes`, folder `tools/liv/rive/`. This follows the "Suggested order" in `docs/liv-rive-handoff.md`:
steps 1 to 3 are done for one view (three-quarter); steps 4 to 6 are not started.

```sh
python3 tools/liv/rive/cut_tq.py       # limbs and strap cut from the view picture  -> tools/liv/rive/tq/
python3 tools/liv/rive/build_tq.py     # the Rive project (scene.rml, pose.luau)    -> tools/liv/rive/liv-tq/
cd tools/liv/rive/liv-tq
rive . --verify                        # 0 errors, 0 warnings
rive .                                 # live window: Rest, Wave, Reach, Cheer, Crouch, Step, Hands, Bind, Walk, Run, Stop
```

Pictures and measurements: `liv-tq/preview/` (`liv-tq-demo.mp4`, 44 s with every button clicked in the Rive runtime;
`pose-sheet.png`, `walk-cycle.png`, `run-cycle.png`, `rig-diagram.png`, `motion-checks.json`).
Measuring: `python3 tools/liv/rive/measure_liv.py FRAMES_DIR OUT.json`.

## What is built

- **Art:** the pack's three-quarter parts (head, torso, skirt, sleeves, socks, boots, blink patches, hands, satchel) and
  what the pack does not cut: upper arms, forearms, bare legs, strap (`cut_tq.py`, from what is left of the view picture).
- **Skeleton** (names as in the handoff's proposed structure): pelvis, spine, head, shoulder / upperArm / foreArm / hand
  (R and L), thigh / shin / foot, plus hair, skirt, satchel and two sleeve helper bones per arm. R is her right (the
  viewer's left in this view).
- **Native Rive:** two-bone IK on both arms and legs; rotation constraints for the sleeve helpers and for foot levelling;
  skinned meshes (head with a hair bone, torso, skirt on pelvis, thighs and a skirt bone, cloth sleeves, leg tubes, strap).
- **Sleeves** are cloth: skinned from the torso at the shoulder seam through two helper bones to the cuff, with a shoulder
  cap that stays on the torso. Raised arms keep a whole sleeve.
- **Hands:** the pack's six hand drawings (relaxed, palm, fist, point, thumb, back); one shows at a time. A hand turns
  over (mirrors) so its fingers curl down whichever way the arm points.
- **Gait** (`pose.tmpl.luau`): one model for walk and run, driven by the `gait` number (0 stand, 1 walk, 2 run):
  speed 0.9 m/s walking, 2.5 m/s running, reached over several steps and left the same way; cadence 2.9 steps/s walking
  rising to 3.6 running; stance 62 % of the stride walking to 36 % running (a flight phase); heel strike, flat, heel lift,
  toe push-off; knee lift 5 cm walking, 17 cm running; pelvis lowest at contact and rising over the standing leg when
  walking, sinking on landing and rising in flight when running; arms swing against the legs, elbows fold to about 85
  degrees running; forward lean 2.6 degrees walking, 11 degrees running; spine twist against the hips with the head
  steadied. Hair, skirt hem and satchel trail the body on damped springs. A foot on the ground is planted in world
  coordinates and never moves; the camera follows her and ground markers slide past.
- **Idle:** slow breathing, small head sway, blink every 2.2 to 5.4 s (about 0.2 s).
- **Controls** (view-model numbers): `pose` 0 to 7, `gait` 0 to 2, `rate` (time scale, 0.25 plays everything at quarter
  speed), read-outs `speedOut`, `sOut`, `phaseOut`, `plA`/`plB`. Buttons are labelled.
- **Poses** (test set, not the handoff's 26 actions): Rest, Wave, Reach, Cheer, Crouch, Step, Hands, Bind (the art as drawn).

## Checked

| Check | Result |
|---|---|
| `rive . --verify` | 0 errors, 0 warnings |
| Foot sliding, controller (planted contact point in world coordinates) | 0.001 view px over 573 planted frame pairs |
| Foot sliding, rendered pixels (sole of the boot while its foot is flat, `measure_liv.py`) | at most 0.9 stage px between two frames, 0.28 to 0.55 at the 95th percentile; 0.96 px over a whole stance |
| Same at 0.25x (`rate` 0.25) | 1.1 px between frames, 1.26 px over a whole stance; the pelvis moves at most 2.3 px a frame |
| Leg reach (hip to ankle target against thigh plus shin) | at most 0.98: every target is reachable, no stretched leg |
| Pelvis | 28 px range walking, 46 running, no kinks (largest step 13 and 23 px a frame at 30 fps) |
| Web runtime | the `.riv` (2 MB) loaded in `@rive-app/canvas` in a browser: renders, the Luau controller runs, Walk and Run work (0.9 and 2.5 m/s), 60 fps on a desktop. See `liv-tq/web-check/`. |
| Repository tests | `node tests/liv.test.cjs`: 5 of 5 pass. (Other test files in this fresh worktree fail only because `node_modules` is not installed here.) |

## Against the handoff

| Requirement | State |
|---|---|
| Walk and run naturally; one model; speed-dependent cadence; stance 0.62 to 0.36; heel / toe; pelvis; arm swing; lean; no sliding | Done and measured for the three-quarter view |
| Walk 0.9 m/s, run 2.5 m/s; speeding up and slowing over several steps | Done |
| Hair, skirt, satchel trail and settle | Done (springs); the hair is the drawn head image bent by a hair bone, not separate strands |
| Acceptance 3: walk and run at 0.25x without sliding, popping joints or detached limbs | Done for this view |
| Acceptance 2: clothes stay whole in every pose | Looked at in all eight poses and in the walk and run frames: no gaps at shoulders or cuffs, no seams in the skirt. Not checked in other views (not built) |
| Hand movement | Hands turn over so the fingers curl down; arms use underdamped springs. Hand shapes switch by a quick cross-fade, not by in-between drawings |
| Rig transfers to other characters (same bone names, images swapped) | The names and structure are in place; not tried with a second character |
| **Five views, view switching, turns** | Not done (only the three-quarter view) |
| **Expressions (10), mouths, brows, eyes** | Not done; only blinking |
| **26 actions, gripping and handling** (the fist, point and thumb hand drawings exist; gripping an object is not built) | Not done; 7 test poses only |
| **State machine inputs the web app can drive** (`view`, `speed`, `expression`, triggers ...) | Only `gait`, `pose`, `rate`; no state machine beyond an idle clip |
| **Park and Werkstatt scenes in Rive**, wiring into the app, `GRAM_PARK.draw` determinism, `postMessage` protocol | Not done; the canvas versions are untouched and remain the fallback |
| Acceptance 1 (likeness), 4, 5, 6, 7, 8 (phone width, a real iPhone), 9 (owner watches before merge) | 1: the owner accepted the pack's younger-looking art. 8: not tested on a phone or in Safari. The others depend on the work above |

## Known weak spots

- **Crouch** looks stiff: the torso mesh is weighted only to pelvis and spine, and the knees point forward by projection.
- **Legs** are a skin tube stretched from a strip of the drawn leg, so the shadow under the hem is lost.
- **The far hand** is the near hand's drawing mirrored.
- **Walking toward the camera** is not shown in perspective: no scale change, and the ground is nearly level (7 % of depth).
- **The near hand** passes in front of the satchel when it swings back.
- `Inter.ttf` (SIL Open Font License) is included in `liv-tq/` for the button labels.
