# Park scenery in Rive (Liv film, PARK scene)

A vector port of the scenery of `grammatik/liv/film-park.js` (`background()`, `foreground()`, the tag pill): sky, hills,
pavement and lawn, path strips and pavement lines, six houses, pond, hedge, six trees, bench, 26 flowers, both gate posts,
the STADTPARK sign, nine grass tufts, the dashed arrow (`into`), the dashed green area (`within`) and the tag pill.
Liv and the time-driven controller are not part of it: there is an empty **Liv slot** between the back and the front.

| File | |
|---|---|
| `tools/liv/rive/park/scenery.py` | `emit_scenery(el, parent, ctx)` and the test build (`python3 tools/liv/rive/park/scenery.py`) |
| `tools/liv/rive/park/layers.json` | the scroll layers (generated) |
| `tools/liv/rive/park/park-scenery-test/` | test project: `scene.rml`, `park_test.luau` (camX -> parX), `rive.yaml` |
| `tools/liv/rive/park/ref.html`, `ref_server.py` | the canvas reference (film-park.js itself, camera and Liv overridable) |
| `tools/liv/rive/park/compare.py` | renders the Rive test at the comparison frames and diffs them with the references |
| `tools/liv/rive/park/preview/` | `ref_*` (canvas), `rive_*` (Rive), `cmp_*` (canvas / Rive / difference) |

## Camera and scrolling

Artboard 1760 x 864, the canvas camera with W = 1760, H = 864: pitch 7°, dist 60, zoom 400 px/m, centre (880, 432),
target (camX, 0.93, 0). Every shape is the canvas drawing at camX = 0, in artboard pixels (`proj(x, y, z)` in scenery.py
is `Camera.project`). With yaw 0 a moving camera only moves things sideways: a point at depth (y, z) moves by
`-camX * 400 * m`, `m = s(y, z) / 400` (s = pixels per metre there). Screen y never depends on camX.

The scenery is split into **layers**, one view-model number each, bound to the `x` of the layer's Node(s):

| prop | layer | depth (y, z) | m |
|---|---|---|---|
| parX0 | hills | parallax | 0.12 (canvas factor) |
| parX1 | far: hedge, trees at z < -3 | 0, -3.6 | 0.9421148 |
| parX2 | houses, pond, near tree | 0, -2.6 | 0.95703 |
| parX3 | park: bench, flowers | 0, -1.4 | 0.9755637 |
| parX4 | far gate post | 0, -0.72 | 0.9863883 |
| parX5 | ground planes, pavement lines, arrow, area | 0, 0 | 0.9981146 |
| parX6 | near gate post + sign (front) | 0, 0.72 | 1.010123 |
| parX7 | grass tufts (front) | 0, 1.1 | 1.0165781 |

The controller writes **every** layer number every frame: `parX<i> = -camX * 400 * m<i>` (`layers.json` has the list).
A shape or a vertex that is not at its layer's depth reads the same number through a range-mapper converter
(`x = base + parX * (m_v / m_L - 1)`), so the perspective is exact for every vertex at every camX: the ground planes and
the gate line between pavement and lawn, the pavement cross lines, the box tops and sides (houses, posts, bench), the pond
and the area outline all shear exactly as in the canvas. Boxes draw both side faces under the top and the front: the
face the camera cannot see lies inside the top + front silhouette, so the visible side follows camX with no switch. The
sign board's left edge follows `min(near end, far end)` like the canvas (a formula converter).

Coverage: pavement cross lines exist for x >= -10.4, the hedge up to x = 40, hills for parallax shifts from camX -10 to
20. The film's park camera stays in -2.5 .. 6.2.

## View model (all numbers unless noted; defaults)

| name | default | meaning |
|---|---|---|
| parX0 .. parX7 | 0 | layer scroll in artboard px, `-camX * 400 * m` |
| t | 0 | seconds; the arrow's dashes scroll with it (canvas `lineDashOffset = -t * 36 u`, u = 2) |
| route | 0 | 0 into (the arrow), 1 within (the area) |
| goal | 0 | 1: pill border and text orange `#d9622b`, 0: green `#2f5d50` |
| goalVis | 1 | 0 hides the grammar overlay (the canvas draws it only while `moving`) |
| tag | "in den Park · Wohin?" | **string**: the pill text; the pill sizes itself (layout hug), right aligned, 20 px margin |

No `tagW` is needed: the pill is a hug LayoutComponent around the text. Nothing advances by itself (no animation, no
looping state): the picture is a pure function of these values.

## Integration (the lead's build)

```python
sys.path.insert(0, str(HERE / 'park')); from scenery import emit_scenery
def prop_str(name, default):     # build_liv.py has only number props
    props[name] = el('ViewModelPropertyString', vm, name=name).get('id'); sdefaults[name] = default
slot = emit_scenery(el, ab, {'root': root, 'prop': prop, 'prop_str': prop_str, 'bindp': bindp, 'font_id': '0:30'})
slot.append(char)                # Liv's group (node scale 0.4016) goes into the slot
# instance values: ViewModelInstanceString for 'tag' (sdefaults) next to the ViewModelInstanceNumber ones
```

- `emit_scenery` declares its props through `prop` / `prop_str` (the table above), creates converters under `root`,
  and appends four Nodes to `parent`, top to bottom: `tag pill`, `scenery front`, `Liv slot`, `scenery back`.
  It returns the `Liv slot` Node (stats in `ctx['stats']`).
- `bindp(target, key, name)` must append the DataBindContext as the target's **last** child (build_liv.py's does):
  `emit_scenery` then sets `converterId` on it.
- `font_id`: a FontAsset with the variable Inter (`wght` axis; build_liv.py's `0:30`, `Inter.ttf`). Weights 600 (sign)
  and 700 (pill) are set with `TextStyleAxis`.
- Liv slot: (880, 800.53) = `proj(0, 0, 0)`, her feet at world x = 0 under camX = 0. The canvas puts her at
  `cx + (a.x - camX) * s(0, 0)`, so her offset inside the slot is `a.x * 399.25 + parX5`
  (s = 399.25 px/m at the ground under the camera target; 400/996 = 0.4016 is 0.2 % larger, about 1 px on her height).
  Her contact shadow goes into the slot too.
- The test controller (`park_test.luau`) shows the per-frame code: read `camX`, write the eight numbers.

## Checks

`rive . --verify` in `park-scenery-test/`: 0 errors, 0 warnings. 152 shapes, 504 straight vertices, 98 ellipses,
447 bindings, 319 range mappers, 4 formulas; the .riv is 924 KB, of which 876 KB is the font.

`compare.py` against film-park.js itself (Liv off, `moving` on, t = 3), mean |RGB diff| per pixel (0..765), Liv's
column masked:

| camX | into | within |
|---|---|---|
| -2.5 | 0.82 | 0.80 |
| 0 | 0.94 | 1.07 |
| 3 | 0.69 | 1.00 |
| 6 | 0.60 | 0.96 |
| 10 | 0.55 | 0.79 |

What is left is edge antialiasing and the font. Matches: positions and proportions of the gate, houses (with the side
faces), pond, hedge, trees, bench, flowers, posts and sign at every camX checked; colours; ink widths; hill parallax;
dash pattern and its phase (checked at t = 0, 0.1, 3, 7.77); pill size and place. Differences: the canvas uses
Avenir Next, the file uses Inter (sign text nudged and tightened to the same box: within 1 px; the pill text is a few px
narrower, the pill hugs it); the hill silhouette is sampled at world-fixed points (the canvas samples at screen-fixed
points, a sub-pixel change of the polyline as it scrolls).

Rive note: `DashPath.offset` runs opposite to the canvas `lineDashOffset`, and an offset larger than one period draws a
broken first dash, so the arrow's offset is `period * (frac(t * 72 / 40) - 1)`, always within one period.
