# The park scene with the 3D Liv

Live on main. The canvas park (`grammatik/liv/film-park.js`) is the fallback; the 3D park is the
default of the film player (see "In the film player").

| File | What |
|---|---|
| `tools/liv3d/park/park3d.js` | `ParkScene`: the park in Three.js (same layout, sizes and colours as the canvas park), Liv, the staging of each scene, the grammar drawn on the ground |
| `tools/liv3d/park/index.html` | local preview: scene buttons, Play, scrubber, the audio clock, captions and the example sentence |
| `tools/liv3d/park/make_video.py` | turns recorded frames plus the narration clips into an MP4 (private, see below) |
| `grammatik/liv/film-park-3d.js`, `grammatik/liv/park3d-frame.html` | the film player's 3D park: the same `GRAM_PARK.draw(canvas, route, t, opts)`, drawn by this scene |

## Scenes

| id | What happens | Length |
|---|---|---|
| `goal` ("in den Park · Wohin?", Akkusativ) | she waits on the pavement and points at the park (outside and the boundary are lit); she sets off at 3.90 s and is in the gate at 5.57 s (the recording's crossing is 5.583 s), the route arrow is drawn as far as she has come, the gate pulses; thumbs-up inside; in the last cue the park lights up and she cheers | 22.43 s, cues at 0 / 4.783 / 15.232 s |
| `location` ("im Park · Wo?", Dativ) | she jogs one loop on the lawn and never leaves the park, dots mark where she has been; she stops at 8.45 s and turns to the viewer; in the second cue the park and its border light up, she catches her breath and shows the place; she waves near the end | 26.33 s, cues at 0 / 9.195 / 18.576 s |
| `into`, `within` | the short versions with the canvas park's staging, used by the film player; the last picture is held | 8 s, 9.6 s |

The cue times are the measured lengths of the recorded clips. `park.seek(id, seconds)` gives the picture for a time:
going forward it continues the simulation in steps of 1/60 s, anything else replays from 0 (spring bones only for the last
1.5 s), so the same time always gives the same picture.

```js
import { ParkScene } from './tools/liv3d/park/park3d.js';
const park = await ParkScene.create({ model: 'grammatik/liv/liv.vrm' });
park.seek('goal', audio.currentTime); park.render(renderer);
```

## In the film player (default since 14 Nov 2026)

The 3D Liv is the default. `?liv3d=0` on the app page switches back to the 2D park and the workman for that browser tab
(`sessionStorage`); `?liv3d=1` switches it on again. The
same flag puts Liv into the 3D workshop of Kapitel 57 (`docs/liv3d-werkstatt.md`).

- `index.html`'s `loadFilmPark` loads the 2D park as before and then, only with the flag, `grammatik/liv/film-park-3d.js`.
  That file wraps the 2D park: it draws the 2D picture until the 3D scene is ready and whenever it cannot be used (no
  WebGL, libraries or model not reachable), so a park scene is never empty.
- The 3D libraries (Three.js r160, three-vrm 3.0.0 from jsDelivr) and their import map are in a hidden same-origin frame,
  `grammatik/liv/park3d-frame.html`. The app page itself gets no import map and no new library. Each film frame is
  rendered in that frame and copied onto the film's canvas; the tag pill is drawn on top as before.
- The model is served with the site: `grammatik/liv/liv.vrm` (4.6 MB, built by `vrm_fit.py`, versioned in `index.html`
  by `npm run assets`). `window.GRAM_PARK_3D_MODEL` can point elsewhere.
- `npm run assets` versions the new script like the others (`tools/version-assets.cjs`).

Checked in the app page served locally (14 Nov 2026), calling `loadFilmPark()` and `GRAM_PARK.draw` as `film.js` does:
with the flag the design is `liv-3d` and both routes draw (first frame 0.9 s for shader compile, then 3.8 ms a frame at
1800 x 620 while playing, 0.15 to 0.45 s for a jump in time); with `?park3d=0` only `film-park.js` is loaded and no frame is
created; with a model address that does not exist it warns once, removes the frame and draws the 2D park.
`npm test` passes (149 of 150, one skipped). Not checked: inside a signed-in B2 109 film (needs an account), phones.

## The narration is private

The recorded narration (Elisa), the captions and the example sentence are lesson material. They are not in this repository.
The preview reads them at run time from `tools/liv3d/park/.local/` (git-ignored): a link to the folder that holds
`data/lessons.json`, `data/audio-manifest.json`, `overlay/visual-overlay.json` and `audio/*.wav`
(here: `.../outputs/Claude-Animation-Design-Comparison-Sound`). Without it the scene plays silently with no text.
The clock is the audio position while narration plays, so picture and voice cannot drift.

```sh
ln -s "<private folder>" tools/liv3d/park/.local
python3 tools/liv3d/demo/shot_server.py 8795 /tmp/shots       # serves the repository root
# open http://127.0.0.1:8795/tools/liv3d/park/index.html and press Play
```

Videos: in the page's console `await __rec('goal', 0, 674)` writes frames through the shot server (define `__rec` as in
`make_video.py`'s header), then `python3 tools/liv3d/park/make_video.py goal <frames dir> out.mp4`. The two videos made on
14 Nov 2026 are in `.../outputs/Claude-Liv3D-Park/` (private, with sound).

## Checked

- Both scenes looked at as contact sheets and as the finished videos (frames at the crossing, the stop, each cue).
- `goal`: crossing at 5.567 s (target 5.583 s). `location`: she stays between x = 1.37 and 5.30 m and z ≥ -0.74 m (the pond
  starts at z = -1.6 m), arrives at 8.45 s, before the second cue.
- Preview page at 1100 px and at phone width (captions move below the picture, the tag to the lower corner).

## Open

- I could not listen (the built-in browser plays to no device here): the sync is by construction (audio clock), the
  loudness and the feel against the voice need a human ear.
- Not measured on phones. A seek far back replays up to 26 s of simulation (well under a second on this laptop).
- The lesson's sentence names another runner; the figure on screen is Liv.
