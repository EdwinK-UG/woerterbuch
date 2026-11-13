# Liv in Rive: face and expressions

Branch `liv/face`, folder `tools/liv/rive/face/`. Three-quarter view (`tq`) is built and checked; the other views need
their own cut (see "Other views"). Liv does not speak: there is no lip sync, only expression mouths.

```sh
python3 tools/liv/rive/face/cut_face.py            # face art from the pack's pixels   -> face/art/
python3 tools/liv/rive/face/build_face_test.py     # standalone test project          -> face/liv-face-test/
cd tools/liv/rive/face/liv-face-test && rive . --verify && rive .
python3 tools/liv/rive/face/render_preview.py all  # Rive-runtime renders              -> face/preview/
```

## How the face is made (no redrawing of her likeness)

What the pack has for the three-quarter view: `tq_head.png` with both eyes painted open, the far brow painted, the near
brow and the mouth already painted over with skin; `tq_brow0.png` (near brow), `tq_mouth.png` (her painted closed smile),
`mouth_0..8.png` (nine pack mouths), `tq_blink0/1.png` (skin patches with a closed lash; blink1 shows streaks of the open
eye and is replaced).

`cut_face.py` makes everything else from those pixels, with local pixel processing only (colour-class masks, Neumann
Laplace fills, alpha matting of dark ink over skin, an ellipse fit for the iris); no generative model, no third-party art.

| Layer (per eye, top first) | What it is | Moves |
|---|---|---|
| happy | skin patch (head's skin filled over the eye) with an upward lash arc in the art's lash colour | opacity (laugh, wink) |
| closed | near: the pack's `tq_blink0`; far: head skin + blink0's lash squeezed to the far eye's width | opacity (blink, below 30 % open) |
| frame | the head's own pixels around the eye with an eye-shaped hole | eye scale only |
| lash | upper lash + its curled ends (head pixels) | `lid` bone: down to close |
| lid filler | a strip of the skin painted above that eye, top fixed, bottom on the lid bone | stretches as the lid drops |
| iris | iris + highlight cut along the fitted ellipse (no eye-white rim) | `iris` bone: look, pupil size |
| sclera | eye white with iris and lash filled from the eye white's own pixels | eye scale only |

The frame sits above the moving layers, so a pupil can never leave the eye and a lowered lid never shows outside it. At
rest the layers reproduce the painted head (Python check in `mock_face.py`: 228 of about 10 000 eye pixels differ by more
than 12 levels, all on anti-aliased iris/lash edges; not visible at 3x).

Brows: the near brow is the pack's part; the far brow is matted off the head (`tq_browF.png`) with a skin-filled hole
patch underneath (`tq_browF_hole.png`), so no old brow shows when it moves. Mouths: the painted smile at its own place
and the nine pack mouths about the view's mouth point (577, 406), squeezed to 0.8 in x and tilted -0.04 rad, as the canvas
engine; `mouth_0f` (frown) and `mouth_4f` (grimace, corners down) are the pack mouths flipped.

## Rig (made by `face_tq.emit_face`)

All overlays are rigid quad meshes, children of the view's image group, each skinned to one small bone under the head bone:

```
head -> face (turned back by the head's bind angle: children use view axes)
          -> eyeN (scaleX/Y: wide) -> lidN (y), irisN (x, y, scale)        same for eyeF
          -> browN base -> browN (x, y, rotation)                           same for browF
          -> mouth base -> mouth (x, y, rotation, scaleX, scaleY)
```

Note: a `RootBone`'s x / y are property keys **90 / 91** (13 / 14 are a Node's; binding 13 / 14 to a bone crashes the
runtime with a segfault as soon as the value is non-zero).

View-model numbers it binds (39 for tq; names without the view prefix):
`mouth_x mouth_y mouth_r mouth_sx mouth_sy`, `mo_painted mo_0 .. mo_8 mo_0f mo_4f` (mouth opacities),
`browN_x browN_y browN_r browF_x browF_y browF_r`, and per eye N / F: `eyeN_sx eyeN_sy lidN_y irisN_x irisN_y irisN_s
happyN closedN`.

## Controller (`face.luau`, a Luau module)

Inputs (global view-model numbers): `expression` 0..9 (happy, smile, neutral, laugh, surprised, sad, think, ouch, effort,
wink: the handoff's order), `expressionAmount` 0..1, `lookX` / `lookY` -1..1 (+x viewer's right, +y up), `blinkNow`,
`winkNow` (set to 1, the module resets them), `faceIdle` (micro-saccades and glances, default 1), `autoBlink` (default 1).

- Expressions: 15 normalised channels (eyes open, wide, laughing eyes, brow raise and inner-end angle per brow, gaze,
  mouth move / size / turn) follow their target in about 0.2 s (rate 15/s); `expressionAmount` blends from happy.
- Mouth: a two-frame dissolve (in 0.05 s, out 0.07 s) inside a short squash (0.18 s), so a change reads as one mouth
  moving. Laughing / winking eyes switch in about one frame after the lid has started to close (a squeeze, not a fade).
- Blink: every 2.2 to 5.4 s (same gap table as the canvas engine), close 70 ms, hold 30 ms, open 100 ms; the lid comes
  down three quarters of the way, then the closed patch takes over. Wink: near eye, 0.54 s, laughing-eye arc.
- Gaze: critically damped spring (about 50 ms), iris travel per view in px (tq near eye -7 .. +2.5 x, +-2.5 y; far eye
  -2.6 .. +1.1 x, +-2.2 y); looking down lowers the lids a little. Idle: saccades every 0.8 to 2.4 s with two glances.
- One face state drives every view (`Face.new(vm, {{pre='tq_', cfg=CFG_TQ}, ...}, '')`), so blinks and blends stay in step
  while the rig cross-fades views. Views without a part simply have no such numbers.

## Integration into build_liv.py (feat/liv-2d-scenes, 6d5952a)

1. Imports, after the existing imports:
   ```python
   sys.path.insert(0, str(HERE / 'face')); from face_tq import emit_face
   ```
2. Global inputs, after `for k, v in GLOBAL_DEFAULTS.items(): prop(k, v)`:
   ```python
   for k, v in {'expression': 0, 'expressionAmount': 1.0, 'lookX': 0.0, 'lookY': 0.0, 'blinkNow': 0, 'winkNow': 0,
                'faceIdle': 1, 'autoBlink': 1}.items(): prop(k, v)
   FACE_VIEWS = []
   ```
3. In `emit_view(V)`, replace the line `lids = [rigid(f'Liv closed eye {i}', ...)]` by:
   ```python
   lids = []
   face = None
   if (HERE / 'face' / 'art' / f'{V}_face.json').exists():
       face = emit_face(el, bones['head'], {'char': g, 'head_world': (world['head'][0], world['head'][2]),
                                            'add_asset': lambda key, rel: asset(rel), 'art_rel': '../face/art', 'view': V}, pre=pre)
       lids = face['drawables']                 # first = on top; they take the old lids' place just above the head
       (OUTD / f'face_cfg_{V}.luau').write_text(face['luau_cfg']); FACE_VIEWS.append(V)
   ```
   (`order = [..., *lids, head, ...]` then puts the face just above the head image, below the near arm, unchanged.)
4. In the view-model section of `emit_view`, replace
   ```python
   vprop('blink', 0.0)
   for lid in lids: vbind(lid, 18, 'blink')
   ```
   by
   ```python
   if face:
       for n, d in face['props'].items(): vprop(n, d)
       for e_, key, n in face['bindings']: vbind(e_, key, n)
   ```
5. Scripts: modules must be declared **before** the script that requires them. Replace
   `el('ScriptAsset', root, file='liv.luau', name='liv', id='0:80')` by:
   ```python
   import shutil; shutil.copy(HERE / 'face' / 'face.luau', OUTD / 'face.luau')
   el('ScriptAsset', root, file='face.luau', name='face', isModule=True, id='0:77')
   for i, V in enumerate(FACE_VIEWS): el('ScriptAsset', root, file=f'face_cfg_{V}.luau', name=f'face_cfg_{V}', isModule=True, id=f'0:{70 + i}')
   el('ScriptAsset', root, file='liv.luau', name='liv', id='0:80')
   ```
   and generate the controller's require lines (add next to the other `.replace` calls):
   ```python
   face_req = ''.join(f"local FACE_CFG_{V.upper()} = require('face_cfg_{V}')\n" for V in FACE_VIEWS)
   face_list = ', '.join(f"{{pre = '{V}_', cfg = FACE_CFG_{V.upper()}}}" for V in FACE_VIEWS)
   luau = luau.replace('@FACEREQ@', face_req).replace('@FACEVIEWS@', face_list)
   ```
6. Optional test buttons (as in the face test): `button('Laugh', ..., [('expression', 3)])`, `[('blinkNow', 1)]`, etc.

## Integration into liv.tmpl.luau

1. Top of the file, after the header comment:
   ```luau
   local Face = require('face')
   @FACEREQ@
   ```
2. `type St = {...}`: replace `blinkT: number, blinkI: number,` by `face: Face.Face?,`.
3. `init`: in the per-view `grab` list remove `'blink'`; at the end of `init`, before `return true`:
   ```luau
   self.face = Face.new(vm, {@FACEVIEWS@}, '')
   ```
4. `advance`: delete the whole `-- blink: every 2.2 to 5.4 s ...` block (the `local blink=0.0` / `do ... end`) and the line
   `put(pre..'blink',blink)`; after `local dt=...;self.t+=dt` add
   ```luau
   local fc=self.face;if fc then Face.update(fc,dt) end
   ```
   (dt is already rate-scaled, so the face follows `rate` too.)
5. The constructor at the bottom: replace `blinkT=0,blinkI=1,` by `face=nil,`.
6. Optional: drive gaze from the body, e.g. `lookX` toward where she walks; and when `mirror` is 1 the whole view is
   mirrored, so `lookX` = +1 still means "the way she faces".

Check after integrating: `rive . --verify` (0 errors, 0 warnings), then a `--commands` run that sets `expression` 0..9
(the face test's `render_preview.py` shows how; note that the CLI's `data` command must come before the first
`screenshot` of a run, afterwards drive values through buttons with `pointer click@x,y`).

## Checked (Rive runtime renders, `face/preview/`)

| Check | Result |
|---|---|
| `rive . --verify` (test project) | 0 errors, 0 warnings |
| `expressions-3x.png` | all ten expressions at 3x the stage rig's size, and the same heads at 64 px tall |
| `look-blink-wink-3x.png` | look left / right / up / down, blink 2 frames in and closed, wink, head tilt (overlays follow the head bone) |
| `transitions.png` | five expression changes, 8 frames at 1/30 s each |
| `liv-face.mp4` | all expressions, then look, blink, wink, nod (30 fps, with idle saccades and auto blink) |
| Rest pose vs the painted head | identical at viewing scale (Python composite check, see above) |
| Ghost brows, misplaced mouths, pupils leaving the eye, hard patch edges | looked for at 3x and 6x in every expression: none of the first three; patch edges are feathered |

## Weak spots (honest)

- **Far eye** is 22 px wide: its upper-right edge, where lash, face contour and hair meet, stays painted when the lid comes
  down (a small dark stub above the lowered lid in ouch / sad at 3x), and looking left shows a thin double line there.
- **Lowered lids** (sad, ouch, effort, blink in-between) are the painted lash slid down: the lid edge is the lash's own
  arch, a little sharp where it crosses the iris; a drawn lid curve would be smoother.
- **Pack mouths** are front-view drawings squeezed to 0.8 for three-quarter; the neutral mouth (pack `mouth_1`) has a
  slight wave; surprised (`mouth_5`) is a dark oval with no tongue, it reads at 64 px but is plain up close.
- **Mouth changes** are cross-fades with a squash, not drawn in-betweens.
- **64 px**: laugh, surprised, wink, ouch and effort read clearly; happy / smile / neutral / sad / think differ mainly by the
  mouth and are subtle at that size (as in the canvas engine).
- **Not done**: the face squash on head turns (skipped: no cheap way without skinning the head mesh to face bones); the
  face is not yet integrated into `build_liv.py` (steps above; the lead integrates); not tested on a phone or in the web
  runtime.

## Other views

`cut_face.py` takes one `CFG[view]` per view (eye boxes in head-image pixels, iris guesses, the column where hair starts,
lid travel, iris travel, happy-arc points, far-brow box and hair edge, mouth point); `face_tq.VIEWS[view]` (or the
`view_cfg` argument) says which parts exist. Expected work per view:

- **front**: two eyes of equal size (call them N and F or add L / R names), two pack brows (`front_brow0/1`), front blink
  patches exist; mouth point (515, 394), no squeeze.
- **side**: one eye (`side_blink0` exists), no far brow, the mouth is a profile mouth: the pack mouths do not fit; the
  canvas engine draws a profile wedge there, which would have to be drawn in code.
- **tqb / back**: no face: emit nothing (`eyes: [], brows: [], mouths: []`), the controller skips missing numbers.
