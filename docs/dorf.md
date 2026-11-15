# Im Dorf: A1 · Kapitel 1 (Personalpronomen)

An animated scene with practice for lesson 1. A green mountain village; Elisa (narrator) explains, Liv and her
neighbours introduce themselves with each pronoun, then Liv, Max and Herr Berger ask the learner. All characters are
the 2D Rive cast (`docs/rive2d-test.md`); the village is drawn in code.

| File | What |
|---|---|
| `grammatik/dorf/index.html` | the page: the picture (fixed shape), subtitles, controls and answers below it |
| `grammatik/dorf/village.js` | the village in Canvas 2D: sky, mountains, hills with a waterfall, houses, church, meadow, path, the stream (animated), the bridge, Liv's house, Opa's bench, the lamb's pen and the lamb, the bakery stall; parallax by layer |
| `grammatik/dorf/main.js` | the six figures, the eight scenes, subtitles with coloured pronouns, the pronoun cards, the practice |
| `tools/liv3d/models/cast/2d/{c01,c02,a01,a03,a04,a05}.riv` | Liv, Max, Opa Sepp, Lena, Frau Huber, Herr Berger (three-quarter view only; mirrored for facing left) |

## Cast and voices

| Figure | Rive | Voice (ElevenLabs unless noted) |
|---|---|---|
| Erzählerin | – | Elisa |
| Liv | C01 | Lucy (German, young; a little livelier and faster) |
| Max | C02 | KidVoice "Ellis Story" (German boy voices page; free plan = test only, not uploaded) |
| Lena | A03 | Alice – Young and Vibrant (German) |
| Herr Berger | A05 | Theo |
| Opa Sepp | A01 | Cornelius (Voice Library, used by id; the API key may not add voices) |
| Frau Huber | A04 | Petra |

ElevenLabs does not allow child or child-like voices, so the children are adults' voices made livelier, or KidVoice.
`tools/dorf-audio.cjs record` records every line of the private lines file with `.local/a1k1/voices.json`, keeps
unchanged lines (hash), and `pack --no-max` builds the upload. A line without a recording is shown with a reading
time instead (the scene still plays).

## Camera

Each scene sets a wide framing (`cam(x, zoom)`). A dialogue line moves the camera in on its speaker, from the head to
about the waist (`closeUp`: the figure 1.65 times the picture's height, the face in the upper third, a little room in
the direction the person looks; two people at once get a two-shot), so the talking mouth is visible on a phone; the
narrator's lines go back to the wide framing with the cards. `say(id, { frame: ['liv', 'opa'] })` frames other people
(Liv pointing at Opa), `{ frame: false }` keeps the wide shot. Nobody is framed who is outside the scene's wide shot
(Liv speaking off-screen while the camera shows the bakery). People standing further back (Frau Huber behind her
counter) are framed by their real height in the picture. Close-ups draw the figures at up to the artboard's own 2048 px.

## Text stays private

Like the other lesson scenes, the public files hold no spoken text. Every line and practice item is in a private
lines file: `.local/a1k1/lines.json` (git-ignored) for `?local`; in the lesson, the page asks the Worker's
`/film-audio?chapter=1` (signed in, enrolled in A1, or staff) and posts the cues to the scene (`werkstatt-audio`):
id `dorf|<line>|<who>`, the line as `say`, a 12-hour signed audio link; the practice is one cue with its JSON. `*word*` marks a pronoun to colour; `*Sie:sie*` colours a
sentence-initial *Sie* as the 3rd person.

## Phones and loading

- The picture keeps its shape: 16:9, 4:3 under 640 px, never taller than about 60 % of the screen. Subtitles, cards
  (small chips on phones) and answers sit below or at the edge, never over the people.
- No image files: the village is drawn, and only what moves (stream, waterfall, clouds, lamb) is redrawn each frame;
  the rest is cached per camera position.
- Six figures at 0.26 to 0.33 MB each (three-quarter view only). Liv loads first; the start buttons wait for her.
- **Rive logo screen**: the free Rive plan shows its logo for about 2.4 s when a file starts. A figure is shown only
  once its canvas corner is empty and its body is drawn. Rive also stops drawing canvases outside the window, so a
  figure that is still loading waits inside the picture, invisible.

## Test

`http://localhost:8796/grammatik/dorf/index.html?local` (launch config `woerterbuch-liv`). `&test` drives the clock by a
timer (for a background tab). Hooks: `__dorf.watch(i)`, `__dorf.practise()`, `__dorf.S`, `__dorf.A`.
