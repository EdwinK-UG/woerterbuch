# Liv, the 2D character

Liv is the Deutschklinik main character (C01): a girl with a wavy dark-brown bob, cream puff-sleeve blouse, red laced
dirndl, cream apron, tan satchel, ribbed socks and brown lace-up boots. She is a 2D rig drawn on a canvas. She does not
speak: she acts, and narration stays with the recorded Elisa voice of the films.

## Where she appears

| Place | File | How it is opened |
|---|---|---|
| Park scenes of the B2/C1 films | `grammatik/liv/film-park.js` | The film player calls `GRAM_PARK.draw(canvas, route, t, {tag, goal, dpr})` exactly as before. `index.html`'s `loadFilmPark` now loads Liv's art, rig and park instead of `grammatik/film-park.js`. No lesson, cue, overlay or recording changes. |
| Kapitel 57, "Trennbar oder untrennbar?" | `grammatik/liv/werkstatt/` | The lesson's card has two buttons: "Werkstatt mit Liv" (2D) and "3D-Werkstatt" (unchanged). Both open in the same full-screen dialog. |

## Pieces

| Part | What it does |
|---|---|
| `grammatik/liv/liv-art.js` | Generated. Liv cut into parts (five body views, mouths, closed eyes, hands, satchel) as WebP data. Sets `LIV_ART_C01P`. |
| `grammatik/liv/engine.js` | Generated from `tools/liv/src/` by `node tools/liv/build.cjs`. One closed script; adds `LIV` (skeleton, gait, actions, renderer, stage). |
| `grammatik/liv/film-park.js` | The park for the films. Sets `GRAM_PARK`. |
| `grammatik/liv/werkstatt/index.html`, `main.js` | The 2D saw workshop. Reuses the 3D workshop's `rounds.js` (verb facts) and `sfx.js` (generated sound). |
| `prototypes/liv/park.html`, `prototypes/liv/werkstatt.html` | Local previews without an account. The workshop preview sends stand-in sentences. |
| `tools/liv/` | Sources of the rig, the build script and the Python tools that cut a character art pack. |
| `tests/liv.test.cjs` | Engine is up to date, scripts parse, the park is deterministic, routes do what the grammar says, no lesson text in the workshop. |

## The park is a pure function of time

Each route (`into` = Akkusativ, through the gate; `within` = Dativ, stays inside) is simulated once at 60 frames a
second with a fixed random seed and stored. `draw` only looks a frame up, so seek, replay and resize always agree, as
the film player requires. The run starts after 0.7 s, ends well before 8 s and then holds.

## The workshop holds no lesson text

Like the 3D workshop, the page asks the lesson (`werkstatt-ready`), receives the chapter's own sentences
(`werkstatt-texts`) and lets `rounds.js` pick one per verb. Without them it explains that it must be opened from the
lesson. Captions are built from the public verb facts only. Keys: S saw, G keep whole, arrows change round, space
pauses, H hides the controls for screen recording, Escape closes.

## Preview

```sh
python3 -m http.server 8766 --bind 127.0.0.1
```

Open `http://127.0.0.1:8766/prototypes/liv/park.html` and `http://127.0.0.1:8766/prototypes/liv/werkstatt.html`.

## Changing the rig or the art

- Rig, motions, renderer: edit `tools/liv/src/*.js`, then `node tools/liv/build.cjs` and `npm run assets`.
- Art: the character art pack (five body views plus heads, mouths, hands and satchel sheets on a flat background) is
  kept outside the repository. With Python 3, `numpy`, `opencv-python-headless` and `pillow`:

  ```sh
  python3 tools/liv/cut_pack.py /ABS/pack-1024 /ABS/cut          # body views scaled to 1024 x 1536
  python3 tools/liv/cut_face.py /ABS/pack-1024 /ABS/pack-full /ABS/cut
  python3 tools/liv/pack.py /ABS/cut grammatik/liv/liv-art.js window.LIV_ART_C01P
  npm run assets
  ```

  The measured joint positions for this pack are in `tools/liv/src/04b-views.js`; a new character needs its own.
- After changing `grammatik/liv/werkstatt/` files, raise the `?v=` numbers in its `index.html` and in `WERKSTATT` in
  `grammatik/grammatik.js`.

## Rollback

- Park: in `index.html`, make `loadFilmPark` load `grammatik/film-park.js` again (the earlier park is untouched), then
  `npm run assets`.
- Workshop: remove the `liv` entry and button from `WERKSTATT`, `werkBtn` and `werkCard` in `grammatik/grammatik.js`.

## Known limits

- Facing left is the mirror image of facing right.
- Sleeves are drawn by the rig in the blouse colour, not cut from the painting, so they stay whole in every pose.
- In profile there is no painted mouth set; she keeps her drawn smile there.
- The rig still contains lip-sync support (`Actor.speak`), which nothing in the app uses.
- Checked in Chromium at desktop and phone widths. Not checked on iPhone/Safari hardware or low-end devices.
