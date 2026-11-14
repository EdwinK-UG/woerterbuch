# The park scene with the 3D Liv

Branch `feat/liv-2d-scenes`, local only. Nothing is wired into the web app: the canvas park (`grammatik/liv/film-park.js`)
stays the default until the owner approves.

| File | What |
|---|---|
| `tools/liv3d/park/park3d.js` | `ParkScene`: the park in Three.js (same layout, sizes and colours as the canvas park), Liv, the staging of each scene, the grammar drawn on the ground |
| `tools/liv3d/park/index.html` | local preview: scene buttons, Play, scrubber, the audio clock, captions and the example sentence |
| `tools/liv3d/park/make_video.py` | turns recorded frames plus the narration clips into an MP4 (private, see below) |

## Scenes

| id | What happens | Length |
|---|---|---|
| `goal` ("in den Park · Wohin?", Akkusativ) | she waits on the pavement and points at the park (outside and the boundary are lit); she sets off at 3.90 s and is in the gate at 5.57 s (the recording's crossing is 5.583 s), the route arrow is drawn as far as she has come, the gate pulses; thumbs-up inside; in the last cue the park lights up and she cheers | 22.43 s, cues at 0 / 4.783 / 15.232 s |
| `location` ("im Park · Wo?", Dativ) | she jogs one loop on the lawn and never leaves the park, dots mark where she has been; she stops at 8.45 s and turns to the viewer; in the second cue the park and its border light up, she catches her breath and shows the place; she waves near the end | 26.33 s, cues at 0 / 9.195 / 18.576 s |
| `into`, `within` | the short 8 s versions with the canvas park's staging, for the silent film player | 8 s |

The cue times are the measured lengths of the recorded clips. `park.seek(id, seconds)` gives the picture for a time:
going forward it continues the simulation in steps of 1/60 s, anything else replays from 0 (spring bones only for the last
1.5 s), so the same time always gives the same picture.

```js
import { ParkScene } from './tools/liv3d/park/park3d.js';
const park = await ParkScene.create({ model: 'tools/liv3d/models/liv.vrm' });
park.seek('goal', audio.currentTime); park.render(renderer);
```

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
- The film player integration is not built: `GRAM_PARK.draw(canvas, route, t, opts)` would draw this scene into an
  offscreen WebGL canvas and copy it over. It needs the import map for `three` and `@pixiv/three-vrm` in the app page and
  a place to host the 13.5 MB model; both are the owner's decisions.
- Not measured on phones. A seek far back replays up to 26 s of simulation (well under a second on this laptop).
- The lesson's sentence names another runner; the figure on screen is Liv.
