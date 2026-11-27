# Scene format v1

Every animated grammar scene is **one data file per version**: German, English, Swahili or French. The web player,
the iOS app and the Android app play the same files, so a new lesson needs no new code on any platform. There is
no code per scene: one player per platform implements the vocabulary below once.

| Player | Where |
|---|---|
| Web | `grammatik/buehne/szene.js` (scene, practice) and `grammatik/buehne/regie.js` (the steps) |
| iOS, Android | the scene player in `docs/ios-app-brief.md` / `docs/android-app-brief.md` §4.5 |

Authors don't write format v1 by hand. They write a private script (`.local/scenes/<scene>-long/script.mjs`) with
handy shortcuts. `tools/scene-compile.mjs` turns it into v1: it expands composites (a saw sawing three times, the dog
carrying the ball, everyone going home), resolves named places to numbers, and writes out each scene's starting state.
`tests/scene-format.test.cjs` checks every scene file against this document.

## Where a file comes from

- **Local:** `.local/scenes/<tag>/lines.json`, private and git-ignored.
- **Published:** through the Worker, `GET /film-audio?chapter=<n>`. The cue `<tag>|data|-` carries everything except
  the lines as JSON; the other cues carry the lines with signed links to their recordings (see `docs/buehne.md`,
  "In the lesson").

**Tags:** `<base>-long` (German), `<base>-en-long`, `<base>-sw-long`, `<base>-fr-long`. The bases are `k05` (A1 ·
Kapitel 18 on the site), `k17` (A1 · Kapitel 13) and the B2–C1 films `k99` (B2 · Passiv; page `grammatik/passiv/`) and `k97` (B2 · Konjunktiv II: Wünsche und
irreale Bedingungen; page `grammatik/konjunktiv/`), `k439` (C1 · Futur II; page `grammatik/futur2/`) and `k482` (C1 ·
Nominalstil; page `grammatik/nominalstil/`).

**A newer film's private source** (`.local/scenes/k99-long/`): `staging.mjs` holds what every language version shares
(acts and beats as v1 steps, props, the practice's staging) and `script.mjs` the version's words (lines read from the
reviewed script `.local/films-b2c1/<lang>/k<id>.md`, boards, strips, practice texts). The compiler takes the film's own
staging (`compileScene(data, base, staging({...}))`) instead of an entry in its `PILOTS` table, and accepts beats that
are already lists of v1 steps.

## Top level

| Key | What |
|---|---|
| `format` | `1` |
| `set` | `"werkstatt"`, `"dorf"`, `"see"`, `"wohnung"` or (since k482) `"redaktion"`: which set to draw (baked assets: `docs/scene-assets.md`) |
| `sets` | (since k439) the other sets some acts play in, e.g. `["werkstatt"]`: load them too (an act names its own with `set`) |
| `cast` | the Rive people this scene uses, e.g. `["anton", "liv", "lena"]` (files: `tools/liv3d/models/cast/2d/<id>.riv`, artboard `<ID> 3q`, state machine `Character`; ids in `grammatik/buehne/stage.js` `CAST`) |
| `animals` | `{ key: kind }`, kinds `dog`, `cat`, `ball` (`grammatik/buehne/tiere.js`) |
| `cases` | `true`: strips colour their wagons by case (N, A, D, G) |
| `setStart` | the set's parts at the start of every scene (see `set` below) |
| `filmStart` | steps run once when the page is ready, before anyone presses play (the picture behind the start box) |
| `camStart` | the camera's x before the film |
| `acts` | the film: `[{ name, cast, need?, beats }]` |
| `practiceStage` | how the practice is staged and how the figures react (below) |
| `practice` | the practice items (below) |
| `lines` | `{ id: { who, text, audio?, gloss?, en? } }`. `who`: a cast key, `elisa`/`narrator` (the narrator, no figure), or `a+b` (two at once) |
| `strips` | `{ id: [[word, role, key?], …] }`. Roles: `n` subject, `v` conjugated verb (Position 2), `t` the verb part at the end, `x` anything else, `c` a connector at seat 0; cases `n a d g` when `cases` |
| `boards` | `{ lineId: { title?, items: [...] } }`: the narrator's board for that line (below) |
| `cards` | texts: `merkTitle`, `merk`, … |
| `signs` | texts for the workshop sign, by key |
| `wheels` | `{ key: [prefix, from, to, post, fromPost] }`: vowel wheels (k[ö→a]nn) |
| `lamps` | `[[label, from, to], …]`: the row of article lamps |
| `names` | `{ animal: { n, a } }`: its noun in the nominative and accusative (act-it-out practice) |
| `why` | reasons shown when an answer is wrong, by key |
| `parts` | the instruction above each practice part, by part |
| `start` | optional title and text for the start box |
| `chapter`, `level`, `title`, `lang` | information |

**Text marks** in any text: `{v:…}` the conjugated verb, `{t:…}` the verb part at the end, `{e:…}` an important
part (ending, vowel), `{n:…} {a:…} {d:…} {g:…}` the cases, `{de:…}` German inside another language, and (since k97)
`{k:…}` a form that is only wished or imagined (Konjunktiv II): drawn like the verb's pill, but lilac with a soft glow
(`#8b5cf6 → #b48cf0`, white text; on a board `#a78bfa → #c4b0fb`, dark text, slowly shimmering; on a word prop drawn in
the picture a solid `#9b6ee8` pill, no gradient, with a lilac glow `rgba(170,120,255,.8)`, blur 0.5 × the font size, and
text `#fffcf6`). Films use it on boards and props; the lines keep `{v:…}`.

## Acts and beats

```json
{ "name": "Die Klammer", "cast": ["anton", "liv"], "need": ["lena"], "beats": [
  [ { "place": { "liv": { "x": -2.6, "d": 0, "left": false, "show": false } } }, { "cam": [1.6, 1, 2.5] }, { "say": "e07" } ],
  [ { "trig": { "anton": "wave" } }, { "run": { "liv": 0.8 } }, { "say": { "id": "a01", "frame": false } } ]
] }
```

- **An act** is one scene of the film. Its `cast` may appear; everyone else is hidden. `need` lists people who come
  in later, so the player loads them in advance. `set` (since k439, a film in two places): the act plays in that set
  (one of `sets`) instead of the file's `set`. The camera keeps its x; the set's parts start as its baked manifest's
  `state` (`assets/scene/sets/<set>.json`), not as `setStart` (which is for the file's own `set`). The next act without
  `set`, the film's start and the practice are in the file's `set` again.
- **Every act starts clean:**
  - bubble, board and cards closed;
  - rings off, birds and backpack gone;
  - animals calm and carrying nothing;
  - the set's parts as `setStart`.

  The act's first beat places everyone.
- **A beat is an ordered list of steps.** It is a list because JSON readers on phones don't keep an object's key
  order.
- **A step is an object with exactly one key.**
- **Order:**
  - steps run in their order;
  - `say`, `line` and `wait` hold the beat until they finish;
  - everything else starts and runs on (walks, the camera, set tweens, a chase, cues, a bubble opening);
  - a beat ends when its line and everything it started are done.

### Steps

**Speech and bubbles**

| Step | Value | Effect |
|---|---|---|
| `say` | `"e01"` or `{ "id", "frame" }` | Plays a line, captions it, makes the speaker's mouth move and lights them. If the line has a board, the board opens (see Boards). `frame: false` or a list is a camera hint; the web keeps the camera still. |
| `line` | `{ "id", "pic", "icon", "strip", "kind", "who", "clamp" }` | An example sentence. A bubble by the speaker (`who`, else the line's own `who`) holds a picture of the meaning (`pic`), the modal verb's icon (`icon`) and the sentence strip (`strip`). It opens with the line. `kind: "think"` is a thought bubble; `kind: "wish"` (since k97) a wish bubble: a thought bubble (trail of dots) in lilac, `#fdfaff → #efe4ff` with a 2 px `#b48cf0` rim and a lilac glow that breathes (2.4 s). `clamp: false` means no clamp on the strip. |
| `bubble` | the same keys without `id`, `false`, or `"pop"` | A bubble without a line, or closes it. With no `who` it docks at the top of the picture. `"pop"` (since k97): the bubble bursts, as a wish meets reality: it swells to 1.15× and fades (0.32 s), 12 small lilac-rimmed white stars fly out from its centre over 0.55 s, and the sound `plopp`. Runs on. |

**People and animals** (`who` is a cast key or an animal key)

| Step | Value | Effect |
|---|---|---|
| `place` | `{ who: { "x", "d", "left", "show" } }` | At once. `x` in metres, `d` depth (negative is further back), `left` faces left, `show` visible. An omitted field keeps its value. |
| `walk`, `run` | `{ who: x }` | Walk or run there, turning that way. People walk at 1.0 m/s (children 0.95) and run at 2.2. |
| `turn` | `{ who: left }` | Face left (`true`) or right. |
| `face` | `{ who: "happy" \| "smile" \| "laugh" \| "surprised" \| "sad" }` | People: the Rive `face` enum. |
| `calm` | `[who, …]` | `face: happy`. |
| `trig` | `{ who: "wave" \| "point" \| "cheer" \| "think" \| "pull" \| "clap" }` | People: a Rive trigger. |
| `hop` | `who` | An animal hops. |
| `mood` | `{ who: "idle" \| "happy" \| "scared" }` | An animal's mood. The dog wags or tucks its tail. |
| `hold` | `{ holder: thing }` or `{ holder: null }` | The holder carries the thing at its mouth (raised 0.42 m, half a metre ahead) until it lets go. |
| `chase` | `{ "by", "after", "to", "camOut", "camBack" }` | The chased one runs to `to` over the bridge, the chaser 0.45 s later (gap 1 m, 0.95 with the ball, speed 2.5 m/s). The camera goes to `camOut`. After 0.25 s both run back past the meadow (to `min(from, −0.6) − 0.6`), and the camera returns to `camBack`. Moods: chaser happy, chased scared. |
| `ring` | `{ who: "n" \| "a" \| "d" \| "g" }` | A case ring at their feet: half behind, half in front, with a letter badge (colours in `stage.css`). |
| `ringsOff` | `true` | All rings fade. |

**The camera, the set and sound**

| Step | Value | Effect |
|---|---|---|
| `cam` | `[x, k, seconds]` | Camera to `x` metres over `seconds` (eased). `k` stays 1; a change of `k` is a cut. |
| `wait` | seconds | Pauses the beat. |
| `set` | `{ part: value }` or `{ part: { "from", "to", "dur", "ease" } }` | The set's named parts (below). With an object the part tweens (eased; `ease: "linear"` for linear). |
| `sfx` | `"pop" \| "roll" \| "bark" \| "click" \| "tick" \| "slip" \| "right" \| "wrong" \| "plopp" \| "splash" \| "creak"` | A small sound (`grammatik/buehne/sfx.js`; the apps use recorded equivalents). |
| `cues` | `[[seconds \| word, step], …]` | Steps at those times after the cue list starts, while the beat goes on. A word instead of seconds: the step fires when the next line to start says that word (its place in the line × the recording's progress, as the board steps; searched after the previous word). If that line lacks the word, or ends first, the step fires at once. Put `cues` before the `say` it follows, since `say` waits. Words keep the timing right in every language: anchor on the German example words that every version says. |

**Overlays**

| Step | Value | Effect |
|---|---|---|
| `card` | `"merk"` or `false` | The Merksatz card at the bottom of the picture: `cards.merkTitle` above `cards[id]`. |
| `wheel` | key of `wheels` | The big vowel wheel turns. |
| `lamps` | `true` / `false` | Shows or hides the row of article lamps (`lamps`). |
| `lamp` | index | That lamp turns to its new form (a flip) and lights up, or nods if it stays the same. |
| `birds` | `{ "on", "x", "y" }` | A flock crosses the sky near `x`. |
| `pack` | `{ "x", "d" }` or `null` | The backpack of the practice. |

**Props, the tape, dimming and ghosts** (since 26 Nov 2026, first used by k99; web: `grammatik/buehne/requisiten.js`).
All of them are drawn in one layer **above the set's front** (a prop on the workbench is not hidden by it) and below
the spotlight, bubbles and boards. Every act starts clean: no props, no tape, no dimming, no rain, no tint, nobody a ghost, nobody riding or sitting.

| Step | Value | Effect |
|---|---|---|
| `prop` | `{ id: { "thing" \| "word" \| "pic", "x", "y", "d", "rot", "s", "alpha", "glow", "bob", "tone", "flip", "look", "on", "show" } \| null }` | Places a prop at once, or changes one (an omitted field keeps its value; a new prop starts at `x 0, y 0, d 0, rot 0, s 1, alpha 1, glow 0, bob 0`). `thing`: a name in `tiere.json → things` (baked stills, `docs/scene-assets.md`); `word`: text with marks, drawn on a wooden plank (`look: "wood"`, the default), a white card (`look: "paper"`) or a grey stone (`look: "stone"`, since k97: reality, carved: `#a9adb2`, a light top band, two cracks, dark text). `pic` (since k97): a picture of meaning (`docs/scene-assets.md`) in a soft round bubble, 1.24 × 0.92 m at `s` 1 (white to `#f4f8fc`, a grey rim, a shine at the top left; the picture 0.96 m wide, clipped to the bubble); `pic: ""` is an empty bubble. `x` metres, `y` metres above the floor at depth `d` (people's depth scale), `rot` radians, `s` scale, `flip` mirrors it. `glow` 0…1: a soft warm-white halo (shadow blur 18·glow px, plus a second pass at half alpha for things). `bob`: floats up and down by that many metres (`y + bob·sin(2.4 t + phase)`). `tone`: `"sepia"` (the past: desaturated, then coloured `#a5743f`), `"gray"` (a memory: desaturated), `"ghost"` (not yet / imagined: tinted to `rgba(255,253,240,.82)` over itself, with a white glow), `"wish"` (since k97: only wished; a thing is tinted `rgba(176,128,255,.5)` over itself, a word or a picture bubble keeps its colours; all get a lilac glow, shadow blur 16 px, `rgba(180,130,255, 0.75 + 0.25·sin 3t)`, a lilac rim on a bubble, and four small twinkling stars around it). `on: who` carries it with a person: `x`, `y` become offsets from their feet, `x` and `flip` mirror when they face left, `d` is their depth + `d` (default 0.02); `on: null` lets go where it is. `show: false` fades it out (`true`, the default, pops it in: 0.28 s, scale 0.6 → 1 with a little overshoot). `null` removes it at once. Draw order: by depth. |
| `move` | `{ id: { "x", "y", "d", "rot", "s", "alpha", "glow", "dur", "ease", "arc" } }` | The prop moves by itself: each given number eases (smoothstep; `ease: "linear"`) from its value to the target over `dur` s (default 0.8). `arc` adds a hop: `y + arc·sin(π·k)`. Runs on; a new `move` of the same prop replaces the running one. |
| `morph` | `{ id: { "to", "fx", "stamp" } }` | A word prop turns into `to`. `fx`: `"shave"` (1.1 s: the first `{e:…}` part of the word curls up and away like a wood shaving, rotating and fading, and the rest closes the gap), `"stamp"` (1.5 s: a red stamp with the text `stamp` slams down, then the word flips over to the new one), `"flip"` (0.6 s: flips over, the new word on its back), `"grow"` (1.2 s: the new word's `{e:…}` parts come in as ghost letters, 15 % → 100 % opacity). Runs on. |
| `tape` | `{ "from", "to", "d", "marks": [{ "x", "t", "flag" }], "lit", "dur", "look", "now", "arc" }` · `{ "lit": i }` · `{ "marks" }` · `{ "arc": { "from", "to", "t" } \| null }` · `{ "now": x }` · `false` | A yellow measuring tape lying on the floor at depth `d` (default 0.45) from `from` to `to`, unrolling (linear) over `dur` s (default 1.5): a timeline the camera can travel along. Ticks every 0.1 m; each mark is a post 0.42 m high with its label `t` (text of the version). `{ lit: i }` lights mark `i` (yellow, 1.2× label, glow) and dims the others to 55 %; `false` rolls it up (0.5 s) and removes it. `look`: `"tape"` (the default) or (since k439) `"band"`, the glowing time band, with `now` (the bright point, in metres) and `arc` (a look back); a mark's `flag` (band only) makes it a pennant. Without `from`, `{ marks }`, `{ arc }` and `{ now }` change the band that lies there. All of these are described in "Since k439" below. |
| `dim` | amount or `{ "to", "dur" }` | The picture darkens: a layer `rgba(8,12,28, 0.8·amount)` over the set, people and props (boards and bubbles stay bright). 0 is normal; default `dur` 0.6. A power cut, night. Runs on. |
| `ghost` | `{ who: amount \| { "to", "dur" } }` | A person fades to a pale glowing outline (1) or fills in again (0): a bare amount over 0.8 s; `{ "to" }` without `dur` over 0.6 s (as `dim`); `to` defaults to 1. At amount g the figure is drawn desaturated by g, brightened by 1 + 0.9·g, at opacity 1 − 0.72·g, with a white glow of 4·g px. (The passive: the doer disappears from the sentence and comes back with *von*.) Runs on. |
| `pop` | `[id, …]` | (since k97) The props burst into glitter and are gone, as a wish meets reality: where each was, a lilac ring widens (radii from 0.8 to 1.5 × its half height, 0.6 s) and 14 stars fly out and fade; the sound `plopp`. A move or morph of a removed prop ends at once (so does one of a prop set to `null`). |
| `ride` | `{ who: id \| null }` | (since k97) A person moves with a prop, keeping the distance between them at this moment (people in a boat that moves); `null` gets off. Their walk is not played: the figure keeps its pose. |
| `sit` | `{ who: true \| false }` | (since k97) A person sits down (the Rive boolean `sitting`) or stands up. Every act starts with everyone standing. |
| `rain` | amount \| `{ "to", "dur", "back" }` | (since k97) Rain over the picture (above the props, below boards and bubbles), 0 dry … 1 heavy; default `dur` 1.0. Screen-space streaks: of 240 drops (drop i: u = frac(0.6180339·i), v = frac(0.7548776·i), speed 0.8 + 0.45·frac(0.3819·i)), the first `240·amount` fall; drop i is at y = frac(v + 0.9·speed·t)·(H + L) − L and x = u·(W + 0.3H) − 0.15H + 0.15·y, a line to (x − 0.18L, y + L) with L = 0.22 m, colour `rgba(214,226,242,.62)`, width max(1 px, 0.012 m). `back: true` makes them rise (time runs backwards) until a later `rain` says `back: false`. Runs on. |
| `sure` | `[id, …]` | (since k439) A guess becomes a fact: each prop in the tone `guess` turns solid over 0.6 s (eased): its dashed rim fills in, the veil and the picture's fading go, and its "?" badge flips (scale x by |cos πk|) into a green tick, which stays. The sound `click`. Runs on. |
| `tint` | `{ "tone", "to", "dur" }` | (since k97) The whole picture (set, people, props; not boards, bubbles or captions) takes a tone, `to` 0…1 (default 1) over `dur` (0.8): `"sepia"` (the past: a filter sepia(0.85·a) saturate(1 − 0.15·a)), `"wish"` (a "what if": a lilac glow from the edges, a radial gradient from `rgba(170,120,255,0.06·a)` at 35 % of the smaller side to `rgba(170,120,255,0.5·a)` at the corners). `tone: null` fades it out. Runs on. |

**Since k439 (Futur II): guesses, flags, slots, the time band** (web: `grammatik/buehne/requisiten.js`, `tafel.js`).

- **Tone `guess`** (a prop field `tone`): only supposed, not seen. On a picture bubble (`pic`): the rim is dashed
  (`#5d6b7c`, 1.4 × the normal width; dashes max(4 px, 0.06 m) and max(3 px, 0.04 m)), the fill's alpha drops by 0.5,
  the picture is drawn at half opacity under a veil `rgba(235,242,250,0.35)`, and a badge sits at the bubble's top right
  (at 0.78·rx, −0.78·ry; radius max(7 px, 0.13 m·s)): a blue `#2f7fd1` circle with a white "?". A thing in this tone is
  drawn at 55 % opacity. The step `sure` turns it into a fact (above); the green `#2f9e5b` tick stays. A guess given a
  new tone (or the tone `guess` again) starts with its "?" again.
- **Look `flag`** (a word prop): the word on a little finish flag. `(x, y)` is the foot of its pole (1.05 m × `s`,
  brown `#5b3a22`, a gold knob); the cloth hangs to the right from the pole's top, as wide as the word + 1.6 × its font
  height, 2 font heights tall, waving gently (each point lifted by 0.06·h·u·sin(3t + 4u)); white with a 2 × 4
  chequered strip at its far end; the word in the paper look's colours.
- **Look `slot`** (a word prop) and the prop field **`w`**: an empty frame `w` metres wide (default 1) and 0.36 m tall,
  centred at `(x, y)`: a dashed gold `#e0a92a` border with a pulsing glow and a faint warm fill; the word is its label,
  white on a gold pill above it. Tiles (word props) are moved into it; `move` may tween `w` (the frame stretches).
- **Morph fx `cork`** (prop and board): 1.0 s; the first `{e:…}` part pops off like a cork (the sound `pop` at the
  start): it flies up and to the right, spinning about 5.5 radians, and fades in its last 40 %; the rest closes the gap.
- **Tint `future`**: ahead in time. As `wish`, a radial glow from the edges, in `rgba(175,225,255,…)`, plus a white
  layer at 0.08·a over the picture.
- **The tape's look `band`** (`tape: { look: "band", from, to, d, now, marks, arc, dur }`): a glowing time band on
  the floor, 0.1 m thick (at least 7 px), rounded, with a soft warm glow. Its colour runs from the past at `from`
  (`rgba(165,116,63,.25)`) through sepia (`rgba(176,124,66,.75)` 25 % of its length before `now`) and gold (`#f2c94c`)
  to white at `now`, then pale blue (`rgba(205,235,255,.9)`) fading to `.3` at `to`. Small ticks every 0.5 m. At `now`
  a glowing white ring with a gold rim, pulsing (±12 %). A mark with `flag: true` is a pennant on a 0.75 m post with
  the label and a chequered edge (instead of a sign). Changes to the band that lies there (no `from`):
  `{ marks: [...] }` replaces its marks (new ones pop in: 0.35 s, scale 0.4 → 1 with an overshoot; ones that were
  there, same `x` and `t`, stay); `{ arc: { from, to, t } }` draws a dashed gold arrow arching 0.9 m above the band from
  `from` back to `to` (a look back from a point in time), growing over 0.9 s, its label `t` at the top once half drawn;
  `{ arc: null }` removes it; `{ now: x }` moves the bright "now" there over 0.9 s (standing on Friday in thought: what
  lies before it turns into the past). A band's marks and arc are drawn over the props (their labels stay readable).
  Both looks: marks are drawn over the props.

**Since k482 (Nominalstil): a verb folds into a noun, a picture flips** (web: `grammatik/buehne/requisiten.js`, `tafel.js`).

- **Morph fx `fold`** (a word prop's `morph`, and a board's `{ morph }`): the word folds up like a paper fan and
  unfolds as the new word, with gold sparkles: the verb that becomes a noun. 1.0 s; at k (0 … 1 of the time) the fan is
  open by fk = 1 − 0.9·smoothstep(k / 0.45) until k 0.45, stays at 0.1 until k 0.55, then 0.1 + 0.9·smoothstep((k − 0.55) / 0.45).
  The old word is drawn until k 0.5, the new one after, scaled horizontally by fk (at least 0.02) about its centre; the
  plank or card is as wide as that word × fk (+ its padding). Six upright pleats across the plank: the even ones darkened
  `rgba(40,30,20, 0.28·(1 − fk))`, the odd ones lightened `rgba(255,255,255, 0.35·(1 − fk))`. While 0.3 < k < 0.85, with
  q = (k − 0.3) / 0.55: 9 gold sparkles at the angles i·2π/9 + 0.4, at a distance px·(0.6 + 2.6q) (vertically × 0.7) from
  the word's centre, radius px·0.32·(1 − 0.6q), opacity 1 − q (px: the word's font size); a sparkle is an 8-point star
  (radii r and 0.32 r), fill `#fff3c4` with a glow `rgba(242,201,76,.95)`, blur 3r. The sound `slip` at the start.
  On a board: the word squeezes to scaleX 0.06 (0.42 s, ease-in), turns into the new one, springs back to scaleX 1
  (0.48 s, with a little overshoot) and stays lightly highlighted, a ring of gold sparkles widening and fading (0.9 s);
  the sounds `slip`, then `click`.
- **Morph on a picture bubble** (a prop with `pic`): `{ morph: { id: { to: "<picture>" } } }` flips the bubble over
  to another picture (fx `flip`, the only one for pictures): 0.6 s, the bubble scaled vertically by |cos πk|, showing the
  old picture until k 0.5 and the new one after; the sound `click`. (The portrait that is once the painter at her easel,
  once the painter in the frame.)

### The set's parts

| Set | Part | Values |
|---|---|---|
| `werkstatt` | `win` | 0 shut … 1 open (the casements swing inward) |
| | `sign` | key of `signs`, `""` (an empty board) or `null` (no sign) |
| | `signPic` | a picture name drawn on the sign's left |
| | `signGlow` | 0 … 1 (a green outline) |
| | `sweep` | the broom's x in metres, or `null`. Shavings left of it are swept into a pile beside it. |
| `dorf` | `lambHop` | 1 makes the lamb hop once (it decays by itself) |
| `see` | `sun` | 0 grey and overcast … 1 sunny (the sunny sky and lake fade in over the grey ones) |
| | `clock` | the boathouse clock: minutes after midnight (870 = 14:30); tween it to turn the hands |
| | `door` | the boathouse door: 0 shut … 1 open |
| | `bridge` | the footbridge over the stream: 1 there … 0 rubbed out (from its right end) |
| `wohnung` (since k439) | `win` | the big window's casements: 0 shut … 1 open |
| | `wet` | 0 … 1: the street in the windows after a night of rain (puddles, the sun out) |
| | `eve` | 0 … 1: evening in the windows (lit windows across the street, a street lamp) |
| | `done` | 0 … 1: the flat finished (curtains, framed pictures, plants on the sills, a rug, a sofa at x −0.2 behind whoever sits on it, the lamp's shade and its warm light) |
| | `door` | the front door to the landing: 0 shut … 1 open |
| `redaktion` (since k482) | `clock` | the wall clock: minutes after midnight (1040 = 17:20); tween it to turn the hands |
| | `page` | 0 … 1: the narrow column on the big screen fills with print from the top (17 lines); below 1 its frame glows (dashed gold, a faint warm fill) |
| | `press` | 0 … 1: the old printing press at the back runs (rattles, its rollers and flywheel turn, a sheet comes out), as the opacity of a looping picture over the still one |
| | `door` | the glass door to the corridor: 0 shut … 1 open |

Places on the sets (metres), for authors (`redaktion`: below): `werkstatt` door −6.6, sign −5.0, window −3.4, planks −1.95, tools 0.4,
bench 3.2, shelf 5.7, stool 5.0; `dorf` house −5.4, bench −3.4, pen −7.4, bridge 1.55, bakery 7.2, school 11; `see` footbridge −7.2, boathouse −5.4…−2.2 (door −3.55, clock
−4.65; its canopy covers the path from −5.65 to −1.95), shore 0.6, jetty 0.3…4.9, open water 4.9…9.6, the island's beach from 9.6
(pavilion 11.4). On the water a person stands "in" a boat: the boat prop covers their legs. `wohnung` front door −5.6,
big window −2.2, second window 2.4, tiled stove 5.4, doorway 8.4; the sofa (part `done`) stands at x −0.2, depth −0.25:
people who sit on it stand at depth 0.02 with `sit`, and the prop `sofa` at the same place draws its seat and arms over
their laps.

`redaktion` (the newsroom, k482): glass door −5.8, window −3.6, Lena's desk −2.2…−0.75 (its top 0.74 m, depth 0.24, drawn
in front of the people; her chair at −1.4: she sits there at depth 0.02 with `sit`), the wall clock −0.95 (2.12 m up, the
deadline plate under it), the big screen x 1.1 ± 1.15 at depth −1.45 on a low stand (its picture 0.42 … 1.62 m; the masthead
its top 0.22 m; the empty column x 1.92 ± 0.23, 0.5 … 1.36 m), the printing press 3.7 … 5.7 at depth −1.2 (paper goes in
at 3.85, 1.25 m and comes out at 5.75, 0.95 m), the shelf 6.9. The screen and the press stand on the floor (parallax 1):
a prop at the screen's depth stays on it whatever the camera does (the exact numbers: `SCREEN`, `PRESS`, `DESK` in
`grammatik/buehne/sets/redaktion.js`, and in its baked manifest).

## Boards

When a narrator line with an entry in `boards` starts, its board opens at the top of the picture. In the top-left,
middle or top-right spot, the one that covers the fewest figures. It stays through the narrator's following lines
without a board, and closes when a character speaks or the act changes.

Its steps fire **when their word is said**: `at` names a word of the line. Its time is the word's place in the
line's text (index ÷ length, minus 0.02) × the recording's length. Items:

| Item | Effect |
|---|---|
| `{ "strip": id, "steps": [{ "at", "mark", "label", "clamp" }] }` | The sentence strip. `mark` lights a wagon (by key) with a gold ring and an optional `label` under it. `clamp: true` closes the clamp. |
| `{ "rows": [{ "c": [cell, cell], "at", "cls" }] }` | A small table; a row with `at` appears when said. |
| `{ "chips": [{ "t", "at", "c" }] }` | Cards in a row, appearing when said. |
| `{ "wheels": [[…], …], "at": [word, …] }` | Vowel wheels that turn when their word is said. |
| `{ "pic": name, "icon": name }` | A picture of meaning (`docs/scene-assets.md`). |
| `{ "cards": [{ "pic", "icon", "t", "at" }] }` | Small picture cards with a caption. An icon alone is drawn large. |
| `{ "morph": [{ "t", "at", "to", "toAt", "fx", "stamp", "twin", "twinAt" }] }` | Words that change when said (in a row). Each word `t` appears at `at` (or at once); at `toAt` it turns into `to` with `fx` as the `morph` step (`shave`: a little plane slides across and the first `{e:…}` part curls away; `stamp`: a red stamp `stamp` comes down, then the word flips and stays lightly highlighted; `flip`; `grow`: the new `{e:…}` parts come in from ghost letters). `twin`: a mirror copy of `t` appears beside it at `twinAt`, flipping in from a mirror image, with the small label `twin` (e.g. "= Indikativ"); it fades when the word is stamped. |
| `{ "timeline": { "now", "marks": [{ "x", "t", "at", "flag" }], "notes": [{ "x", "t", "at", "row" }], "arcs": [{ "from", "to", "t", "at" }] } }` | (since k439) A time line, 540 × 104 px (300 × 92 on a phone; 28 px taller when a note has `row` 1; never wider than the board can be in the picture: 92 % of its width less 40 px): x runs from 0 (left, the past) to 1 (the future). The line 30 px above the bottom, 7 px thick: from sepia to gold at `now`, white at `now`, pale blue after it; a glowing dot at `now`. Marks hang under the line (a tick and the label; `flag`: ⚑ before it). Notes are chips above the line (row 0, or row 1 higher), anchored at `x` (the chip's own x% point on it). An arc is a dashed gold curve from `from` to `to`, 62 px high (52 on a phone), with an arrowhead at `to` and its label in a white pill; it draws itself in 0.9 s when said. Each part with `at` appears when said. |
| `{ "drawers": [{ "t", "at", "open", "c", "items": [text \| { "t", "at" }] }] }` | A cabinet of labelled wooden drawers side by side. A drawer appears at `at` (or at once), slides open at `open` (or is open from the start if it has items and no `open`), and shows its items, each at its own `at`. `c` (`n a d g`) colours the label by case. |

A step's word is searched after the previous step's word; a word said only earlier in the line counts at its first
place; a word the line does not say makes the step fire at once (`tests/scene-format.test.cjs` checks every board word).

## Practice

`practice`: items, one per round, in order. Every item has a `part` and a `kind`.

**Kinds** (graded the same on every platform; see `grammatik/buehne/practice.js`):

| Kind | Item |
|---|---|
| `order` | `tiles`, `roles`, `ok`, `end`, `first?`, `why?`, `q?`, `slots?`, `bad?`: tiles onto the sentence strip. Compared with `ok` without capitals (since k97: "Ich" may stand in the middle, "Am liebsten" at the start); a right answer shows the matching `ok` sentence. `q: "yn"`: the verb belongs on position 1. Since k439: `slots` (fewer than the tiles) leaves spare tiles in the bank (*geworden* beside *worden*); `bad: { sentence: reason }` gives a known wrong order its own reason (compared as `ok`), before `why[key]`, which is chosen by where the order goes wrong (`t_end`: the `t` tile not last; `v_1`/`v_2`: the `v` tile not at seat 1 (`q: "yn"`) or 2; `first`: not `first` at seat 1; else `mid`). `seats?` (since 27 Nov 2026): a label over each empty wagon (`""` for none, text of the version); without it the wagons are labelled 1, 2 and the last one "Ende" (the version's word for it), but **none at all when `slots` leaves spare tiles** (a wagon is not a sentence position when a phrase is split over tiles: k482 *Wegen \| des Streiks \| …*) |
| `choice` | `q` with `___`, `options`, `right`, `why`: tap the right form |
| `type` | `q`, `ok`, `bad`, `chips`, `hint`, `pre`, `end`: write the sentence |
| `regie` | act it out: `tiles [{ w, who?, c?, v? }]` (`c`: `n`, `a` or `?` for "die"), `slots`, `want [subject, object]`, `first?`, `ok` |

For `regie`, the learner's order is played back exactly as its articles say: the noun in N chases the noun in A
(`chase`), whatever the word order.

**Optional item fields:**
- `ask`: a line the cast says first;
- `askPic`, `askIcon`: a bubble with it;
- `cue`: the task text, otherwise the ask line's text;
- `pic`, `icon`, `think`: the meaning of the right answer, shown in a bubble;
- `sign`: the workshop sign shows this text (with `pic`) after a right answer;
- `thing`: a prop that flies into the backpack when right, and back when wrong;
- `react`: a line id, or a list of ids said in turn, spoken after a wrong answer instead of the part's `miss` line
  (its speaker looks surprised). The en/fr/sw versions use a list: the character's short German line, then the
  narrator's explanation in the version's language;
- `stage`: the item acted out on stage, as lists of steps: `start` (before the item is asked), `right` (after a right
  answer, before the reaction), `miss` (after a wrong answer, before `react`): `{ "<option index>": [steps], "*": [steps] }`
  (the index of the option the learner tapped, for `choice`; `*` for any wrong answer). The practice's props stay
  from one item to the next.

**Since k482:** a `type` item with `end: ""` is a phrase, not a sentence (a noun phrase: no end mark in the verdict or the
bubble). For the bubble after a right `choice`, the learner's sentence is the quoted one that holds the gap (of several
quotes, that one); when the gap stands outside every quote ("Meldung: „…“ ___"), the bubble shows the chosen option
alone, with the item's `end` if it has one.

**Two gaps:** a `choice` question may have two gaps (`… ___ … ___ …`); each option then fills both, its two parts
split by ` … ` (`"werde … würden"`).

**The hint ladder:**
1. First miss: the reason (`why`) and the machine's failure animation.
2. Second miss: a hint.
3. Third miss: "Richtig ist …".

Only first tries count for the score. A `choice` of three options or fewer ends after the second miss (one option is
left); four or more after the third.

**Practice behaviour (since 27 Nov 2026; the apps follow it):**
- **Every wrong answer is answered before the learner goes on.** After a wrong answer of any kind, the reason shows,
  then the item's staging for it (`stage.miss`) and its reaction (`react`, every id in turn, or the part's `miss` line)
  play to the end; until then the answers are locked (dimmed, no taps, and a typed answer's field is read-only: Return
  and OK do nothing). Then the field is focused with the wrong text selected. A typed answer waits like a tap.
- **The last wrong pick of a `choice` is staged too.** When a pick ends the item (the second of three options), its
  reason, its staging (`stage.miss["<its index>"]`, else `"*"`) and its reaction play first; only then
  "Richtig ist: …" shows and the item ends (then `afterMiss`). Before, the item ended at once and that option's
  picture never showed. (`order` and `type` end after the third miss as before: the failure animation, then
  "Richtig ist …", without a reaction.)
- **Wagon labels:** see `order` above (`seats`; none with spare tiles).
- **Player labels** follow the version's language (`de`, `en`, `fr`, `sw`): the buttons, the sound and full-screen
  buttons, scene dots, the wagons' "Platz 1, leer … Zurücklegen" and "Ende", "Deine Antwort", the "und" between two
  speakers' names. German examples and answers stay German. The web player's strings are `UI` in
  `grammatik/buehne/stage.js`.
- **The page title** is the version's `title` (else `start.title`), followed by the page's own " – <topic>".
- **Layout:** the dock under the picture has a minimum height per exercise family and grows (up to 58 % of the screen)
  when long options or a two-line reason need it; the task, the answers and the film button never overlap.
- **The board's timed changes** (`morph` fx on a board, a row's highlight) run on the scene clock: pausing freezes
  them, a jump cancels them.

**`practiceStage`:**

```json
{ "cast": ["anton", "liv", "lena"],
  "start": [steps],                                  // before the first item, as one beat
  "parts": { "<part>": { "start": [steps], "intro": "p01", "thingAt": { "x", "d" } } },
  "ask": { "who": "liv", "frame": ["liv", "lena"] }, // who holds the ask bubble
  "right": { "<part>" | "*": { "laugh": [who], "hop": animal, "say": ["r01", "r02"], "bubble": true, "hold": 2.2 } },
  "miss":  { "<part>" | "*": { "who": "anton", "say": ["r04", "r05"] } },   // say[n] after the n-th miss
  "act":   { "camBack", "wrong": "r04", "oops": "r03", "home": { animal: x } },   // for kind regie
  "afterMiss": 2.5,
  "end": [steps] }
```

**A right answer:**
1. The thing flies into the pack.
2. A `sign` item updates the sign.
3. `laugh` people laugh; `hop` hops.
4. With `bubble` and an item `pic`/`icon`, the first laughing person shows the learner's sentence with its meaning
   (`bubble: "wish"`, since k97: in a wish bubble).
5. One of `say` is spoken at random, then the bubble stays `hold` seconds (0.8 if there is no picture).

**A wrong answer:** the item's `stage.miss` steps, then its `react` lines, or else the `miss` person looks surprised and
says `say[n]` (the answers locked until done). When the item ends without a right answer, a pause of `afterMiss`.

**After the last item:** the `end` steps, then "Fertig! …" with the score.

## Player behaviour

What every player does the same way, whatever the scene (web: `grammatik/buehne/stage.js`, `platz.js`; since
27 Nov 2026).

**The act buttons.** Under the transport controls (⏮ ▶/❚❚ ⏭) there is one round button per act, numbered 1, 2, 3 … in
the order of `acts`. The act playing is filled (ink on the page's background colour), the acts before it are lightly
tinted (done), the ones after it plain. A tap plays the film from the start of that act, exactly as ⏮/⏭ do (the act
starts clean, see Acts and beats). On a phone (the panel 460 px wide or less) the buttons have a row of their own
under ⏮ ▶ ⏭ and the play-along button, centred while they fit; with more acts than fit, the row scrolls sideways
and keeps the act playing in view (it scrolls itself, never the page around the frame). On a wider screen they sit
between ⏭ and the play-along button in the same row. Each button is 36 px round, 5 px apart; its accessible label is
`<scene> <n>: <act name>` with the scene word in the version's language (`Szene`, `Scene`, `Scène`, `Onyesho`;
stage.js `UI.scene`), the act's `name` also as its tooltip. The act playing is marked `aria-current="step"`. While
the learner plays along (practice), the act buttons are hidden with ⏮ ▶ ⏭.

**The fit rule.** Nothing with text or meaning may reach past the edges of the picture, at any size from a 320 px
phone to a full-screen desktop: boards (with everything on them, e.g. a wagon's label), bubbles, cards, word and
picture props and the tape's labels keep a margin at every edge of **8 px, or 1.2 % of the picture's width when that
is more** (`margin(W)` in platz.js). Players keep it so:

- A sentence strip on a board or in a bubble is never wider than the board or bubble: its wagons shrink (down to
  60 %) until it fits. Chips and cards wrap onto another row.
- A board or bubble that still does not fit (with whatever sticks out of it) is scaled down as a whole, from its top
  left corner, until it does (`fitScale`; never below 30 %), then placed inside the margins. Never cut.
- A word or picture prop is drawn just inside the margins when it is in the picture even in part, or when it stands
  within the scene's wide shot as a wide screen shows it (3.1 m either side of the camera's `x`; a phone shows less
  of the room). The shift eases in (about 0.1 s), so nothing jumps; things (`thing`) are not moved, and a prop that
  leaves the scene leaves the picture.
- A label on the tape that is in the picture in part slides sideways along the edge until it is whole (its post
  stays on its point of the tape); a flag near the right edge waves to the left of its pole. A label that would then
  cover one drawn before it is lifted above it on a longer post. Labels of parts of the tape the camera has not
  reached are not shown.

`tools/scene-frames.cjs` checks a film against this rule at any size (`--phone`, `--phone 320x640`, `--size WxH`):
its "edge findings" line must say 0.

## Versions and feedback

- **Feedback:** `POST /scene-feedback` with `{ scene: base, version: "<lang>-long", ratings, … }`
  (`grammatik/buehne/meinung.js`, `worker/src/scene-feedback.js`).
- **Short versions:** existed until 24 Nov 2026; they are archived (git tag `archive/short-pilots-k5-k17`).
