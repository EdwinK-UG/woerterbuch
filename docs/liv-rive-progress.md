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
- **Face** (three-quarter view): ten expressions (`expression` 0..9, `expressionAmount`), gaze (`lookX`, `lookY`), blink, wink,
  idle glances; cut from the pack's pixels (`face/`, `docs/liv-face.md`). The other views keep the pack's blink patches.
- **Hands**: still the pack's six painted hand drawings, switched by cross-fade. A rig of articulated painted hands (cut from
  the generated parts sheet) is being built on branch `liv/hands`.
- **Controls** (view-model numbers): `pose` 0..7, `gait` 0..2, `view` 0..4, `mirror`, `rate` (time scale), face inputs.

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

- **Hands** are the old drawings (see above). **Faces** exist for the three-quarter view only (front needs a config entry, the side
  view needs a profile mouth drawn in code).
- Only seven test poses (Rest, Wave, Reach, Cheer, Crouch, Step, Hands, Bind), not the handoff's 26 actions; no gripping yet.
- The cross-fade between views is a dissolve with a small squash, not a drawn turn.
- Quarter-speed playback (`measure_all.py --slow`) was not re-measured after the multi-view rewrite. The front and back pixel
  numbers need a tracker that follows the sole in y as well.
- Side view: the legs are drawn spread about 150 px at the hips (the pack's stride); the pack's side torso part is wrong at the
  waist, so the cut uses the picture's pixels.
- Park and Werkstatt scenes in Rive, the state machine the web app drives, phone and Safari testing: not started. The canvas
  versions are untouched and remain the fallback.
- Far sleeves in the side and three-quarter-back views are the near sleeve mirrored (`fix_sleeves.py`): whole, but lit from the wrong side.
- Crouch is better (hips push back) but still the stiffest pose; the pack's neck at the top of the back torso has hair-coloured paint (hidden by the head).
