# Liv's hands: a rig from the painted parts sheet

Branch `liv/hands` (from `feat/liv-2d-scenes` 66037dc). Everything is under `tools/liv/rive/hands/`. Nothing outside
that folder and this file was changed; `build_liv.py` is **not** integrated yet (steps below).

Replaces the six cross-faded hand drawings with a hand built from the owner's painted parts sheet
(`source/C01_right_hand_cutout_parts_4096x2048.png`, prompt in `source/C01_right_hand_cutout_prompt.txt`): a palm, four
fingers of two pieces and a thumb of two pieces, for the back of the hand and for the palm side. Fingers curl, spread
and grip as continuous numbers; a damped-spring helper (`hand_pose.luau`) turns named hand shapes into natural motion.

```sh
python3 tools/liv/rive/hands/cut_hand_sheet.py      # sheet -> pieces/ (pictures + measured pivots)
python3 tools/liv/rive/hands/build_hand_test.py     # test project -> hands/liv-hand-test/
cd tools/liv/rive/hands/liv-hand-test && rive . --verify && rive .
```

## Files

| File | What |
|---|---|
| `cut_hand_sheet.py` | Finds the 22 pieces, cleans them, writes `pieces/native/*.png` (sheet resolution), `pieces/rig/*.png` (what Rive loads) and `pieces/pieces.json` (sizes, measured pivots) |
| `hand_rig.py` | `emit_hand(el, parent, side, scale, props, pre='')`: emits one hand (both sides of it) as RML elements |
| `hand_pose.luau` | Luau module: shapes, springs with cascade, idle drift, blending, beckon / wave cycles |
| `build_hand_test.py`, `liv-hand-test/` | Test project: two arms as bone chains, hands attached by a world TransformConstraint, a button per shape |
| `preview/liv-hands-sequence.mp4` | 12 s, 30 fps: the shape sequence, arms moving (the hands follow the wrist bones), turned to the palm side at 6 s |
| `preview/contact-sheet.png` | Every shape: back of the right hand, back of the left hand (mirror), palm of both |

## The pieces (`cut_hand_sheet.py`)

* The sheet's palette was snapped to four colours, so its antialiasing became a skin-coloured fringe outside the ink
  and white specks inside. A piece is the region its ink encloses (fringe dropped, specks filled from neighbours); the
  outer edge gets a soft alpha. The outline is thickened outward by 14 sheet px (from about 10): at the rig's scale the
  sheet's line would be 0.8 view px against about 2 for the pack's painted hands.
* Palm pieces: the ink across the wrist cut-off is painted out (the forearm is drawn under the hand there).
* Palm-side tips: the dorsal nail is painted out (nail and its line become skin, the outer outline stays). Checked at
  3x on all five tips: clean apart from two small shade wedges where the sheet's shade stripe starts.
* Palm-side thumb pieces are mirrored (the sheet tilts them up-left like the back row; on the palm side of a right hand
  the thumb is on the viewer's right).
* Pivots measured from the pixels: per finger/thumb piece the principal axis, both end points, the cap centres; per
  palm the four knuckle bumps (local minima of the top edge; on both palms the index knuckle is drawn as a shoulder, not
  a bump, so it is placed one knuckle spacing further out), the wrist centre and the thumb mound.
* Rig pictures (`pieces/rig/`): 0.105 of the sheet (the stage scale on a 2x screen), finger pieces baked at the rig's
  proportions (0.74 wide, 1.12 long) so Rive draws every picture at one uniform scale, a 3 px transparent margin,
  premultiplied resizing, ink colour under the soft edge, and **square canvases**. The last one matters: Rive's renderer
  picks an image's mip level from the axis-aligned bounds of the drawn picture, so a tall picture (a finger) turned
  near 90 degrees came out smeared along its length. Reproduced in a 3-image test file; square canvases fix it.
* Also written: `palm_<finger>_root.png`, a patch of the palm picture over each finger's root, for the palm side.

## The rig (`hand_rig.py`)

```
hand (scale) -> mirror (scaleY = flip: +1 right, -1 left) -> art (sheet px -> view px, sheet "up" -> along the bone)
  -> back side / palm side (opacity from palmSide; cross-fade between 0.4 and 0.6)
     -> palm picture, thumb, fingers
finger: root (at the knuckle, rotation = spread fan) -> converge (rotation, closes up with the curl)
        -> base piece, tip joint -> tip piece
thumb : root (in the mound, rotation = thumbOpp) -> mcp (rotation = thumbCurl) -> base piece, tip joint -> tip piece
```

* All motion is data binding on the view-model numbers (21 formula and 21 range-mapper converters, shared by every hand
  under one Rive root); the hand works without a script, e.g. with keyed numbers.
* Curling. The sheet draws the fingers straight, seen from the back or the palm, so a real curl is a turn away from or
  toward the viewer, not a turn in the picture plane (turning them in the plane bent them sideways). Each piece is
  foreshortened along the finger: s = cos(angle + 16 deg) / cos(16 deg), base angle = curl x 118 deg (MCP and PIP
  together, the base piece is two phalanges), tip angle = base angle + curl^2 x 128 deg (the end joint lags at small
  curls and follows fully in a fist).
  * Back of the hand: the palm is drawn in front of the fingers. A curling finger **slides back** under the palm by
    its lost length instead of being squashed (round ends and even lines stay), and the tip slides under the base.
    The fingers are clipped a little below the knuckles (inside the palm) so a slid finger never comes out at the
    wrist. A fist from the back is the back of the hand with its knuckle bumps, as the sheet drew it.
  * Palm side: fingers in front of the palm, foreshortened by scale; past 90 deg they fold down over the palm (drawn
    mirrored). A patch of the palm picture covers each finger's root while the curl is below 0.42 and fades out by 0.6,
    so a straight finger grows out from behind the knuckle edge and a curled one folds over the palm. A piece seen
    nearly end-on (|s| < 0.2) fades out rather than showing as a sliver.
* Joints. Tip and base meet end to end with 34 sheet px of overlap, base drawn above tip on both sides: the base's
  closed end overlaps the tip's root end and reads as one knuckle line with no notch at the sides.
* Proportions. Wrist to middle fingertip about 115 view px at scale 1 (sheet x 0.084). Finger pieces are drawn 0.74 as
  wide and 1.12 as long as on the sheet (the sheet's fingers are too wide and too short for its palm); thumb pieces
  x 0.70 (the "cupcake").
* Left hand = `flip` -1 (mirror across the hand's own axis). Turning the hand over = `palmSide` 0 -> 1 (the test
  controller narrows the hand through edge-on with |flip| while it switches). Checked: back of the right hand with the
  fingers to the right has the thumb up, its palm side has it down, the left hand the reverse.

View-model numbers per hand (`pre + prefix + Name`, e.g. `tq_handAIndexCurl`): `ThumbCurl`, `ThumbOpp` (-1 out /
thumbs-up, 0 rest, 1 across the palm), `IndexCurl`, `MiddleCurl`, `RingCurl`, `PinkyCurl` (0 straight .. 1 fist),
`Spread` (0 .. 1), `Flip` (+1 / -1), `PalmSide` (0 back .. 1 palm).

Cost per hand: 26 pictures (13 per side, one side drawn at a time; 22 pieces + 4 root patches), 67 nodes, 58 binds,
1 clipping shape; converters shared. All rig pictures together: 48 KB of PNG, 0.24 MB decoded. The test project's
`.riv` is 1.2 MB, almost all of it the font and the pack's reference pictures.

## Motion (`hand_pose.luau`)

```luau
local HandPose = require('hand_pose')
local h = HandPose.new(0.0)                   -- seed: phase of the idle drift
HandPose.attach(h, vm, 'tq_handA')            -- finds tq_handAThumbCurl ... (the prefix INCLUDING the view prefix)
HandPose.setShape(h, 'gripSphere', 20)        -- name, grip radius in view px (gripSphere / gripHandle)
HandPose.setBlend(h, 'relaxed', 'fist', .4, 0, 0)   -- or a mix of two shapes
HandPose.fistGrip(h, .3)                      -- squeeze toward a fist on top of the shape
HandPose.update(h, dt); HandPose.write(h)     -- every frame
local wristAdd = HandPose.wrist(h)            -- radians for the hand bone (wave flaps, beckon nods)
```

Shapes: `relaxed open flat wave fist point thumbsUp pinch gripSphere gripHandle carry beckon count1..count5`.
One spring per channel (about 18-21 rad/s, damping 0.62-0.8: a few percent overshoot), a cascade (index first, middle
+25 ms, ring +42 ms, pinky +58 ms), idle drift of about 3 % with slow, different periods per channel and hand.
`flip` and `palmSide` are not set by the module (they depend on the view and the arm): the controller sets them.

## Integration into `tools/liv/rive/build_liv.py` (branch feat/liv-2d-scenes, 352c10e)

1. Copy-free import: at the top
   `sys.path.insert(0, str(HERE / 'hands')); import hand_rig`.
2. In `emit_view(V)`, replace the hand sprites (`HAND_POSES`, `make_hand`, `hand_imgs`, `far_hand_front` and their
   `vprop`/`vbind` lines) with one mount per side, following the hand bone in world space:
   ```python
   def bind_c(t, k, name, conv):            # bindp with an optional converter
       a = {'sourcePathIds': '0:40-' + props[name], 'propertyKey': k}
       if conv: a['converterId'] = conv
       el('DataBindContext', t, **a)
   def hand_mount(sd, tag=''):
       m = el('Node', g, name=f'Liv hand {sd}{tag} mount')
       el('TransformConstraint', m, targetId=bones[f'hand{sd}'].get('id'), sourceSpaceValue='world',
          destSpaceValue='world', strength=1, name=f'follow hand {sd}{tag}')
       side = 'R' if (sd == 'A') == A_is_R else 'L'
       hp = {'prefix': f'hand{sd}{tag}', 'root': root, 'asset': asset, 'pieces': '../hands/pieces/rig',
             'bind': bind_c, 'declare': prop}
       hand_rig.emit_hand(el, m, side, 1.0, hp, pre=pre)
       return m
   hand_mounts = {sd: hand_mount(sd) for sd in SIDES}
   far_hand_front = hand_mount(far, 'F') if far in SIDES else None
   ```
   `prop` (global) is the declare function because `emit_hand` already adds `pre`. Scale 1.0: the constraint copies
   the bone's world transform, which already contains the character's 0.62 and the facing mirror.
3. Draw order: in `arm_group`, put the mount where the six pictures were:
   `def arm_group(sd, up, fo, hand): return [hand, fo, ...]` with `hand_mounts[sd]` for the near arm and the far arm
   behind the torso, and `far_hand_front` for the far arm's copy in front. Bind the two far copies' opacity as the
   forearm copies are (`vbind(far_hand_front, 18, 'frontB')`-style, and the behind copy to `backB`). The far copy in
   front has its own numbers (`hand{far}F...`); the controller writes the same pose to both.
4. Remove the bone flip: `vbind(bones[f'hand{sd}'], 17, f'hand{sd}Flip')` must go (the new hand turns over with its
   own `PalmSide`; mirroring the bone would also mirror the constraint's copy). Keep `hand{sd}Rot`.
5. Controller (`liv.tmpl.luau`): copy `hands/hand_pose.luau` into `tools/liv/rive/liv/` in the build (as
   `build_hand_test.py` does) and declare it before the controller:
   `el('ScriptAsset', root, file='hand_pose.luau', name='hand_pose', isModule=True, id='0:79')`.
   In the controller: `local HandPose = require('hand_pose')`; per view and side `HandPose.new(seed)` +
   `HandPose.attach(h, vm, V..'_hand'..sd)` (and `..'F'` for the far front copy, or write the same values to both);
   every frame `setShape`, `update`, `write`. Map the old shape numbers: 1 relaxed -> `relaxed`, 2 palm -> `open`,
   3 fist -> `fist`, 4 point -> `point`, 5 thumb -> `thumbsUp`, 6 back -> `flat`. Set `..Flip` to +1 / -1 for the
   right / left hand of that view and `..PalmSide` to 1 when the palm should face the viewer (the old code's flip rule,
   "fingers curl the way gravity wants", becomes "palm side when the forearm points away from the body"); turning
   over can narrow |Flip| through ~0.08 while PalmSide passes 0.5, as the test controller does. Add
   `HandPose.wrist(h)` to the hand bone rotation for wave and beckon.
6. `rive . --verify` (0/0) and look at the hands at 3x in every view. The hand art is a right hand seen from the back
   or palm, so it fits front, three-quarter and back views; in the side view the hand is seen edge-on, which these
   pieces do not draw (use palm or back with the fingers together, `flat`, and accept it, or ask for side pieces).

## Checked (rendered with `rive . --commands`, looked at at 3x)

* `rive . --verify`: 0 errors, 0 warnings; `rive inspect --summary`: no problems.
* All 17 shapes on the back and the palm side, right hand and mirrored left hand (`preview/contact-sheet.png`).
* Transitions at 1/30 s: relaxed -> fist -> open on the back (cascade visible, index first; no pop), point -> wave ->
  fist on the palm side (a piece passing end-on fades over 2-3 frames).
* Attachment: the hands follow the forearm bone chain in world space while the arms move, mirrored hand included
  (`preview/liv-hands-sequence.mp4`).
* Thumb side for both hands and both sides; nail removal on the palm-side tips; the smeared-picture problem and its fix.

## Weak spots (honest)

* **Not integrated** into `build_liv.py`, not seen on Liv, not tried in the web runtime or on a phone.
* Back of the hand: curled fingers are hidden behind the palm (correct for a straight-on back view), so relaxed,
  carry and grips look like a fist with stubs from the back; the cue is in the silhouette only.
* Palm side: fingers between curl 0.4 and 0.65 show short foreshortened pieces; tips fade instead of showing a
  fingertip pad seen end-on. The sheet has no end-on fingertip drawing.
* Pinch does not make the thumb and index tips touch convincingly on either side; grips are shapes only (the apple and
  handle in the test are props behind the hand, not wrapped by the fingers).
* Faint seams: a light line at the wrist cut over the test forearm, and very faint patch edges in the palm (palm side).
* The pieces have no shading between fingers; the look is flatter than the pack's painted hands, and the knuckle
  bumps of the back palm make a relaxed hand from the back look slightly like a fist.
* In the CLI's @1x renders at the stage scale (0.62) the pictures are minified to about half: fine, but slightly soft.
