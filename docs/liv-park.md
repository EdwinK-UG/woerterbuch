# The park scene with Liv in Rive

Branch `feat/liv-2d-scenes`. Nothing is wired into the web app: the canvas park (`grammatik/liv/film-park.js`) stays the default
until the owner approves.

```sh
node tools/liv/rive/park/extract_profile.cjs        # the canvas engine's own run (both routes) -> park/profile.json
python3 tools/liv/rive/build_liv.py                 # (the demo window, unchanged)
LIV_PARK=1 python3 tools/liv/rive/build_liv.py      # the park project -> tools/liv/rive/park-liv/
cd tools/liv/rive/park-liv && rive . --verify && rive .
```

## What it is

A 1760 x 864 artboard with the canvas park's camera (pitch 7 degrees, 400 px per metre, target x follows her). Behind her: the
scenery (`park/scenery.py`: sky, hills, pavement and lawn, houses, trees, hedge, pond, bench, flowers, the far gate post); in front
of her: the near gate post with the green STADTPARK sign and the grass tufts. On the ground: the dashed orange arrow through the
gate (`into`) or the dashed green park area (`within`), shown once she is moving. Top right: the tag pill.

Liv is the five-view rig (only front, three-quarter and side are needed here): she runs along the street in the side view, turns
through three-quarter to the viewer and does a thumbs-up (`into`) or cheers (`within`), as in the canvas version.

## Inputs (view-model numbers, nothing else is needed)

| name | meaning |
|---|---|
| `t` | seconds into the action, 0..8 (clamped) |
| `route` | 0 `into` (Akkusativ: starts on the pavement at x = -3.4, runs through the gate to x = 2.6), 1 `within` (Dativ: x 1.6 to 5.6 and back to 2.6) |
| `goal` | 0 / 1: the pill's border is orange (goal) or green |
| `tag` (text) | the phrase in the pill, for example "im Park · Wo?" |

## Same picture for the same time

The picture is a pure function of `t` and `route`: nothing runs by itself (no animation, no random numbers, no clock). The run of
the canvas engine (60 frames a second, fixed seed) is stored in `park/profile.json` (x, speed, facing, camera). The controller
replays the body from t = 0 in fixed steps of 1/60 s: the steps before the last 1.5 s only advance the gait state (cheap), the last
1.5 s are rendered (cloth springs, hands, face). Going back in time resets and replays. Checked: a direct seek to t = 3.0 and a
stepwise run to t = 3.0 differ by 0.008 grey levels on average (56 pixels of cloth and finger idle drift); two seeks to the same
t are identical.

## The film player

`grammatik/liv/film-park-rive.js` is a drop-in for `film-park.js` (the same `GRAM_PARK.draw(canvas, route, t, opts)`): it draws the
Rive artboard into an offscreen canvas and copies it onto the film's canvas, setting the numbers above. It needs the Rive web
runtime (`@rive-app/canvas`) loaded first and `grammatik/liv/park.riv` (published from `park-liv`). It is not loaded by
`index.html`. To try it: load `rive.js` and `film-park-rive.js` instead of the three Liv canvas files in `loadFilmPark`.

`tools/liv/rive/park/web-check/index.html` is a standalone page (route buttons, play, a time slider) for looking at it in a browser
with the real runtime: copy the published `.riv` next to it as `park.riv` and serve the folder.

## Open (honest)

* The web runtime's speed on phones and the film's seek behaviour are untested: the Browser pane in my session was hidden, so a page
  only got about one frame a second. The CLI renders the park fast.
* `rive . --publish` writes a watermarked, signed `.riv` on the free plan; a clean file needs an export from an account with a
  plan that allows it. That is the owner's decision.
* Narration timing: the action fits in 8 s like the canvas version (the run ends at about 3.9 s for `into`, 5.2 s for `within`, then the
  turn and a 1.8 s gesture), taken from the canvas engine's own recording.
* The Rive text of the pill is not measured by the runtime: the controller sets the pill width from the text length.
