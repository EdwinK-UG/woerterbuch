# Liv in Rive: progress

Branch `feat/liv-2d-scenes`, folder `tools/liv/rive/`. All local, nothing pushed. This follows `docs/liv-rive-handoff.md`.

```sh
python3 tools/liv/rive/cut_tq.py && python3 tools/liv/rive/cut_cloth.py && python3 tools/liv/rive/cut_tq.py   # three-quarter art (limbs, re-toned cloth, apron cut, base layers)
python3 tools/liv/rive/cut_front.py; python3 tools/liv/rive/cut_back.py; python3 tools/liv/rive/cut_side.py; python3 tools/liv/rive/cut_tqb.py
python3 tools/liv/rive/face/cut_face.py                 # face art for the three-quarter view
python3 tools/liv/rive/build_liv.py                      # -> tools/liv/rive/liv/ (scene.rml, liv.luau, face modules)
cd tools/liv/rive/liv && rive . --verify && rive .       # live window: poses, gait, views, mirror
```

`python3 tools/liv/rive/render_seq.py liv OUT "data view=2" "adv 2" "shot name"` renders frames from the CLI;
`measure_liv.py FRAMES OUT.json --prefix f --view tq --yaw 43 --footw 0.8523` measures foot sliding.
`tools/liv/rive/liv-tq/` is the older single-view project (kept until the new one is accepted).

## What is built

- **Five views in one artboard**: front, three-quarter front, side, three-quarter back, back. Each is a rig of its own (bones,
  IK, skinned cloth) in a Node group; `build_liv.py` builds every view that has `<view>/<view>.json`.
- **One body, projected per view** (`liv.tmpl.luau`): feet are planted in world (u, w) coordinates and never slide; hand targets
  are in body space (X left, Y up, Z forward); a view projects them with its yaw (0, 43, 90, 137, 180). The `view` number (0..4)
  turns toward that yaw; the two views around it cross-fade, the others are hidden and not computed. `mirror` = 1 faces left.
- **Clothes and skin are separate layers** (`cut_cloth.py`): cloth is linen white (the pack's cream was almost the skin colour),
  skin keeps the pack's colour; apron cut off the skirt; plain linen petticoat and chemise as base layers under the dress (never
  skin); sleeves, caps, socks re-toned.
- **Cloth moves**: apron on a two-bone chain, skirt hem in three bones that flutter with the stride, sleeves trail the arm's
  swing, bow tails (back views), hair, satchel on damped springs.
- **Limbs**: arms with round elbows and shoulder caps that stay on the torso; legs as thigh and shin pieces with a round knee;
  seen from the front or back a lifted leg is foreshortened (thigh bone scaled, boot counter-scaled) instead of bending sideways.
- **Gait** (walk 0.9 m/s, run 2.5 m/s, stance 62 % to 36 %, flight phase, heel and toe, pelvis, arm swing, lean) as before.
  Foot sliding in the three-quarter view: 0.0003 view px controller, at most 0.65 px in rendered pixels while walking.
- **Face** (front, three-quarter, side): ten expressions (`expression` 0..9, `expressionAmount`), gaze (`lookX`, `lookY`), blink,
  wink, idle glances; cut from the pack's pixels, profile mouths drawn in code (`face/`, `docs/liv-face.md`). The back views
  have no face.
- **Hands**: articulated painted hands cut from the owner's generated parts sheet (`hands/`, `docs/liv-hands.md`): 17 shapes
  (relaxed, open, flat, wave, fist, point, thumbs-up, pinch, grips, carry, beckon, count 1 to 5), fingers curl and spread with
  springs and a cascade, back or palm side, left and right; loose fists while running.
- **Actions** (`actions.luau`, `docs/liv-actions.md`): the canvas engine's 27 actions (wave, point, clap, think, cheer, jump,
  crouch, carry, push, pull, throw, kick, sit, bow, nod, shake, dance ...) in all five views, layered over standing or walking,
  with props (apple, crate, saw handle) in her hand.
- **Turns**: a turn switches whole views at the middle with a squash (a fading group would show its own layers through each
  other); the art is lossy WebP copies (the Rive file is about 2.3 MB).
- **Controls** (view-model numbers): `pose` 0..7, `action` 1..27, `prop` 0..3, `gait` 0..2, `view` 0..4, `mirror`, `rate` (time
  scale), face inputs `expression`, `expressionAmount`, `lookX`, `lookY`, `blinkNow`, `winkNow`.

## Checked

| Check | Result |
|---|---|
| `rive . --verify` (all five views, 378 view-model numbers) | 0 errors, 0 warnings |
| Cut art assembled at the bind pose vs the pack's pictures (front, back, side, three-quarter back) | under 1 % of pixels differ outside the re-toned cloth |
| Poses, walk, run rendered in the three-quarter, front, back, side, three-quarter-back views | looked at, see weak spots |
| Foot sliding, all five views, walking and running (`measure_all.py`) | controller: planted contact points fixed to under 0.001 view px in every run. Rendered sole: at most about 1 px between frames walking in all views (three-quarter back 4 px once), and at most 1.2 px running in the side and three-quarter views. Front and back running read 30 to 45 px: the planted foot's screen y moves with the ground by design (she runs toward or away from the camera) and the sole tracker is x-only and unreliable there; the contact sheets of the front run show the feet staying on the ground markers. Not re-measured at quarter speed after the multi-view rewrite. |
| Foot sliding, three-quarter walk | see above |
| Turn between views | cross-fades (looked at one front to three-quarter turn) |

## Not done / weak spots

- Hands: pinch does not make the thumb and index tips meet; grips are finger shapes only (the props are in front of or behind the
  hand, not wrapped); from the back, curled fingers hide behind the palm; palm-side half-curled fingers look short; a faint dashed
  line at the wrist; flatter than the pack's painted hands; no side view of the hand.
- Actions: sleeves still tear in the side view when the upper arm goes forward and up past about 70 degrees; in the back views
  the near arm is always drawn on top, so hands in front of her chest (clap, think, sit) show on her back; in the front view
  push, pull, stop, thumbs-up and kick are foreshortened (no wrist roll); holding a crate does not block one-hand actions.
- The cross-fade between views is a dissolve with a small squash, not a drawn turn.
- Quarter-speed playback (`measure_all.py --slow`) was not re-measured after the multi-view rewrite. The front and back pixel
  numbers need a tracker that follows the sole in y as well.
- Side view: the legs are drawn spread about 150 px at the hips (the pack's stride); the pack's side torso part is wrong at the
  waist, so the cut uses the picture's pixels.
- Web runtime speed of the full project (five views, hands, faces) is unmeasured: the browser pane was hidden, so the page only
  got about 1 frame a second whatever it loaded. The CLI renders it fast. Phone and Safari testing: not done.
- Park and Werkstatt scenes in Rive and the state machine the web app drives: not started. The canvas
  versions are untouched and remain the fallback.
- Far sleeves in the side and three-quarter-back views are the near sleeve mirrored (`fix_sleeves.py`): whole, but lit from the wrong side.
- Crouch is better (hips push back) but still the stiffest pose; the pack's neck at the top of the back torso has hair-coloured paint (hidden by the head).
