# Scene assets: baked pictures, animals and sets

The grammar stage (`grammatik/buehne/`) draws its pictures of meaning, its animals and its sets with Canvas code every frame. For the native apps, and for one look everywhere, that drawing is **baked** into WebP images plus JSON manifests under `assets/scene/`. A player draws them with no drawing code of its own beyond a few simple shapes (rings, shadows, dust, shavings). Nothing here holds lesson text.

Bake again after any drawing change:

```bash
node tools/bake-scene-assets.cjs
```

- **Options:** `--only bilder,tiere,sets,check` runs some of the steps; `--keep` keeps the old files.
- **How it works:** the runner serves the repository locally and opens `tools/bake-scene-assets.html` in headless Chrome. That page imports the live `bilder.js`, `tiere.js`, `sets/werkstatt.js` and `dorf/village.js` unchanged. The two sets keep their drawing parts inside `createWerkstatt`/`createVillage`, so the page loads them through a thin wrapper (`importPatched`) that adds those parts to the returned object. If that return line ever changes, the bake stops with an error.
- **The check:** it draws chosen moments twice, once live and once from the baked files through the reference player `tools/bake-scene-assets.player.js`. The two are compared in `.local/scene-assets-check.jpg`, with the numbers in `.local/scene-assets-report.json`. Port the reference player when you build a native one: it is the format, in code.

## File layout

```
assets/scene/
  bilder.json                 pictures of meaning + icons
  bilder/<name>.webp          sheet of frames, 320 × 200 each (2 × the 160 × 100 box)
  icons/<name>.webp           56 × 56 (2 × the 28 × 28 badge)
  tiere.json                  animals, birds, backpack, things, case rings
  tiere/<kind>-<state>.webp   dog | cat | ball × idle | happy | run | walk | hop
  tiere/bird-fly.webp, tiere/pack.webp, tiere/thing-<name>.webp
  sets/werkstatt.json, sets/werkstatt/*.webp
  sets/dorf.json,      sets/dorf/*.webp
  sets/see.json,       sets/see/*.webp       (the lake, since the Konjunktiv II film k97)
  sets/wohnung.json,   sets/wohnung/*.webp   (Lena's flat, since the Futur II film k439)
  sets/redaktion.json, sets/redaktion/*.webp (the newsroom, since the Nominalstil film k482)
```

**Sheets.** A sheet holds `frames` frames of `frame = [w, h]` pixels, left to right. A sheet wider than WebP's 16 383 px limit wraps into `rows`, with `cols` frames per row. Frame `i` is at `x = (i mod cols)·w`, `y = floor(i / cols)·h`.

- **Looping frames:** a looping entry has `loop` (seconds) and `fps`. Frame `i` was drawn at `t = i·loop/frames`. To play it, show frame `floor(((t mod loop)/loop)·frames)`, where `t` is the time since the thing appeared.
- **State frames:** a state entry has `state` and `values`. Show the frame whose value is nearest the current state.

## bilder.json

- **The box:** `box` is `[160, 100]`, drawn at `scale` 2, so each frame is `[320, 200]`.
- **Each picture:** `pictures.<name>` has `file`, `frames`, `cols`, `rows`, and either `still: true` (one frame) or `loop` and `fps`.
  - `stillFrame` is the frame to show with reduced motion. The site then draws `t = reducedMotionT = 1.5`.
  - Loops come from each picture's own code, for example `t % 2.4` or `sin(3t)`. If a picture's motions do not share a period, the loop follows the main one; `.local/scene-assets-report.json → seams` says how far off the rest is. A picture with no entry in the bake's `PIC_LOOP` table gets 2 s.
  - The frame count is at least 16 and is raised so long loops still run at 8 fps or more (32 frames for loops up to 4 s, 48 above). Very fast motions alias: the phone shakes at 20 rad/s and the flames flicker at 14 rad/s.
- **Icons:** `icons.files.<name>` points to a 56 × 56 still.
- **The Passiv film (k99) added** `zeitung`, `paket`, `wer`, `gestohlen` (grey, 4 s), `post`, `kuchen`, `dach`, `muell`
  (4 s), `ferienlager`, `bohren`, `stromausfall` (4 s), `kurier`, `aushang`, `vertrag`, `aerztin`, `angerufen`, `anrufen`,
  `gitarre`, `kerzen`, `scheibe`.
- **The Konjunktiv II film (k97) added** (wishes and imagined worlds at the lake) `frueher`, `sonnig`, `sonne`, `rudern`,
  `tee`, `fahrplan`, `nickerchen`, `lesen`, `haengematte` (4 s: the sun crosses the sky), `klavier`, `feier`, `jung`,
  `umkehren`, `sofa`, `baecker`, `interview`, `streit`, `motorboot`, `cappuccino`, `email`, `fluegel`, `regenschirm`,
  `gruppenfoto`, `boot`, `bruecke`, `wunsch`, `wasware`. A picture can also float in the world in a bubble (the prop field
  `pic`, `docs/scene-format.md`).
- **The Futur II film (k439) added** (Lena's moving day; guesses about the past and things done by Friday) `bus`,
  `fertig`, `regennacht`, `vergessen` (2.5 s), `heimweg`, `sofachips`, `meeresspiegel` (3 s), `abgabe` (2.5 s),
  `drehkreuz` (3 s: pay, the gate opens, in), `bericht` (2.5 s), `treffen`, `rede`, `studium`, `lupe`, `zielfahne`,
  `plan`, `ankommen`, `auto`, `regal`, `lampen`, `nachbarin`, `festgeklebt`.
- **The Nominalstil film (k482) added** (the newsroom's stories; no text in any of them) `sanierung` (3 s: cars roll over
  the renewed bridge), `vulkan` (3 s), `erholung`, `analyse`, `impfstoff`, `wohnungsbau` (3 s), `kritik`, `warten`, `malerin`
  and `portraet` (the painter at her easel / in the frame: a picture bubble flips between them), `abstimmung`, `vorhang`
  (3 s: the curtain falls), `zugausfall`, `angelverbot`, `grillen`, `grillverbot`, `grillmenge` (2.5 s), `katzerettung` and
  `katzeheld` (2.5 s: the firefighter carries the cat down, or the cat in a helmet carries the firefighter), `schiff` (3 s:
  it sinks), `sturm`, `fachbuch`, `amtsbrief`, `streik`, `park`, `entschuldigung`, `gaehnen`, `begeistert`, `radweg`.

## tiere.json

- **Scale:** `pxPerMetre` = 391.56, the same scale as the sets. At feet `(fx, fy)` with `s = z·k` (pixels per metre at the animal's depth), scale the frame by `s / pxPerMetre`. Put its `foot` point on `(fx, fy)`, and mirror it horizontally for `left` (the sprites face right).
- **Draw order:** animals draw in front of the people (they share the stage's `#fx` canvas), sorted by depth `d`.
- **Kinds:** `kinds.<kind>` has `height`, `speed`, `runSpeed`, `ring` (metres), `frame`, `foot`, `shadow`, `hop` and `states`.
  - `shadow`: draw an ellipse at the feet first, `rx·s × ry·s` in `color`. Leave it out while the animal is carried (`raise > 0`).
  - `hop`: lift the sprite by `sin(π·hop)·lift·s`, where `hop` starts at 1 and falls by `decay` per second (0.42 s). The `hop` sheets have this lift baked in, for convenience.
  - `raise`: lifts the sprite by `raise·s`, for the ball in the dog's mouth (0.42 m).
- **States:**
  - **Same drawing:** `{ same: 'idle' }` means `tiere.js` draws nothing different for this state. `walk` is the idle pose gliding along. The dog's `scared` mood, which the chase in jagd sets, also looks like idle; while running it uses `running: 'run'`.
  - **Ball:** `ball-walk` has `advance: 'distance'`. Pick the frame from the spin (`frame = (spin / 2π mod 1)·frames`, with `spin = distance / 0.12 m`), not from time. `ball-run` includes its bounce.
- **Birds:** `birds` is one bird's flap (`anchor` = its centre). Use `flock` to lay out the five birds: their positions and phase offsets, in metres above the line `d = -1`.
- **Backpack:** `pack` is a state sheet over `fill` 0 to 4. Its `shake` rotates it about the foot.
- **Things:** each `things.<name>` is a still with its `centre`. Besides the backpack's camping kit (`schlafsack`, `zelt`,
  `taschenlampe`, `schuhe`, `hut`, `kompass`) they are the films' **props** (format v1 steps `prop`/`move`,
  `docs/scene-format.md`), drawn at real size in metres: `handschuh` (a glowing work glove, the passive's "invisible
  hands"), `fahrrad`, `reifen`, `flicken`, `oelkanne`, `tasse`, `hobel`, `span`, `dach`, `wolke`, `brief`, `kuchen`, `pult`,
  `blitz`, `papierflieger`, `handy`, `bohrer`, `brett`, `zeitung`, `fussball`, `teller`; since k97 `faehre` (the lake ferry,
  3.3 m, origin on the waterline), `ruderboot` (a red rowing boat with oars, 2.6 m, origin on the waterline: people "sit"
  in it, its hull covers their legs), `geschenk`, `radierer` (a giant eraser), `schloss` (a padlock), `schere`,
  `kalender` (a page with a summer sun, no words), `tropfen`, `spritzer` (a splash); since k439 (moving day) `kiste`
  (a taped moving box, 0.6 × 0.45 m, on the floor), `kisteauf` (the same, open and empty), `kartons` (flattened boxes
  leaning), `pflanze` (origin: the pot's bottom), `wanduhr` (a quarter past eight), `lupe`, `paket`, `murmel` (a glowing
  marble), `regal` (a bookshelf, full), `regalhalb` (the same half built), `sofa` (only its seat and arms: the set
  `wohnung` draws the sofa behind the people), `stehlampe`, `thermos`, `anleitung`; since k482 (the newsroom) `rotstift` (Frau Adler's red pen, 0.17 m: her wand), `meldungen` (a stack
  of press releases), `amtsbrief` (an official letter with a red seal, A4). A standing prop (bicycle, roof,
  lectern) has its `centre` at its foot, so `y: 0` stands it on the floor; a floating one has it in its middle.
- **Case rings:** `rings` are shapes only, with colours from `CASE`. Each is an ellipse at the feet, `rx = radius·z·k`, `ry = 0.3·rx`. Its back half is filled and stroked behind the people, its front half stroked in front, and it carries a letter badge.

## sets/&lt;set&gt;.json

Each set is baked once, from camera `camX`, at the reference scale: the site's 673 px picture at 2×, so `pxPerMetre` = 391.56.

- **The bake canvas:** `width × height` is the canvas every item's `x, y` refers to. It reaches `top` = 4 m above the ground line `groundY` (close-ups lift the camera) and 0.69 m below it, as the reference picture does. `world` gives the metres covered: werkstatt −10…7, dorf −10…12, enough for every camera the scenes use.
- **Items:** `items.<name>` are drawn in the order `back` (behind the people) and then `front` (in front of them). An item with `when: '<state>'` is drawn only when that state is not null. `state` lists the set's states and their defaults.
- **Spots:** `spots` (and `bridge` in the village) are the named places in metres. `depth` turns a depth `d` into the feet's y and size factor `k`, as `foot()` does.

### Drawing a frame

The view is `W × H` device pixels with `z` device pixels per metre (on the site, `z = Z0·k·dpr`, with `Z0 = min(0.8·H/2.75, W/minW)`). The camera is at `cam.x` and lifted by `ty` metres, and `t` is the scene time.

```
sc = z / pxPerMetre                       // image px → screen px
gy = 0.8·H + ty·z                         // the ground line on screen
X(ix, p) = W/2 + (ix − width/2)·sc + (camX − cam.x)·p·z     // a bake-image x on a layer with parallax p
Y(iy)    = gy + (iy − groundY)·sc
```

So an image item is drawn at `(X(x, parallax), Y(y))` with size `w·sc × h·sc`. Its left edge sits at `centre − (cam.x − camX)·parallax·z − (width/2 − x)·sc`.

- **Extending to the screen edge:** `extend: 'up'` / `'down'` repeat the image's top or bottom row out to the screen's edge. This covers the sky, the workshop wall and the lamp cord above the image, and the floor and meadow below it.
- **Half-resolution images:** `res: 0.5` marks an image stored at half size (the lamp's soft light). Still draw it into the box `w × h`.

Item types:

| type | drawn as |
|---|---|
| `image` | one image; `sway: {amp, w}` shifts it by `amp·sin(w·t)` metres (the lamp) |
| `states` | the frame whose `values` entry is nearest `state[item.state]` (window `win` 0…1, sign `signGlow` 0…1) |
| `loop` | frame by `t` (waterfall, stream, lamb); `hop: {state, lift}` lifts it by `sin(π·min(1, v))·lift` metres |
| `pivot` | the broom: moved by `state.sweep` metres, rotated about `pivot` by `base + amp·sin(w·t) − baked` |
| `sprites` | the clouds: one image placed and scaled per item `[x, y, s, v]`, wrapping every `wrap` metres |
| `particles` | the dust in the lamp light, small circles from the item list (formula in its `note`) |
| `shavings` | the image while `sweep` is null; while sweeping, the shavings right of the broom as elliptic arcs, plus a growing pile |

- **Werkstatt:**
  - `wall` has parallax 0.93; `floor`, `shavings` and `front` have 1.0.
  - The workshop's parts are `window` (the casements), `sign` (the empty board with its glow), `broom`, `light`, `lamp` and `dust`.
  - The player draws the sign's words and its picture itself, in the boxes given under `items.sign.pic` and `items.sign.text`.
- **Dorf:**
  - Each layer has its own parallax: `sky` 0.04, `clouds` 0.06, `mountains` 0.12, `hills` and `waterfall` 0.32, `village` 0.62, and `meadow`, `stream`, `ground`, `lamb` and `front` 1.0.
  - The sky is baked in the reference picture: its gradient runs from the screen top to the horizon.

- **See** (the lake, k97):
  - Layers and parallax: `sky` and `skySun` 0.04 (the sky's gradient baked in the reference picture, as the village's),
    `mountains` 0.12, `hills` (the far shore) 0.3, `lake`, `lakeSun`, `island`, `shore`, `bridge`, `door`, `clock` and
    `front` (reeds) 1.0.
  - **`fade`** (a field any item may have): draw the item with the named state's value (0 … 1) as its opacity.
    `skySun` and `lakeSun` fade in with `sun`, over the grey `sky` and `lake`.
  - **Item type `clock`**: two hands drawn by the player at `centre` (bake-image px), `r` metres: the hour hand at
    ((v/60) mod 12)/12 of a turn from twelve, the minute hand at (v mod 60)/60, with v = `state.clock` (minutes after
    midnight), `len × r` long, `width` metres wide (at least `minWidth` CSS px), in `color`, and a pin.
  - `bridge` and `door` are `states` sheets (11 frames, values 0 … 1). The footbridge's arch raises the feet as the
    village's bridge does (manifest `bridge`), only while `bridge` > 0.5.
  - A player passes every part named in the manifest's `state` to the drawing (`sun`, `clock`, `door`, `bridge`).

- **Wohnung** (Lena's flat, k439): an Altbau room, world −9 … 12.5 m.
  - Layers and parallax: `wall` (plaster, cornice, ceiling, skirting, the doorway, a bare bulb; extends up), `view`,
    `viewWet` (fade `wet`), `viewEve` (fade `eve`) (the street in both windows), `frames` (window frames, sills,
    radiators, the tiled stove, the door frame with the landing behind it), `window` (states `win`) and `door` (states
    `door`), all at 0.93; `floor` (parquet, extends down) and `doneFloor` (fade `done`: the rug and the sofa) at 1.0;
    `doneWall` (fade `done`: curtains, pictures, plants, the lamp's shade) and `doneLight` (fade `done`, half
    resolution: the lamp's warm light) at 0.93. No front layer.
  - Only the item types `image` and `states` and the field `fade`: nothing new for a player.

- **Redaktion** (the newsroom, k482): world −9 … 12 m.
  - Layers and parallax: `wall` (window onto the roofs, pinboard, the clock's face and the deadline plate, an old front
    page, the shelf; extends up), `door` (states `door`, the glass door) and `clock` (the item type `clock`, as the
    lake's: state `clock`) at 0.93; `floor` (carpet tiles, Frau Adler's desk at the back, a plant, Lena's chair; extends
    down), `screen` (the big screen on its low stand), `page` (states `page`: its narrow column filling with print),
    `press` (the printing press, still) and `pressRun` (a 1 s loop of the press running, 16 frames, drawn over the still
    one with the state `press` as its opacity: the field `fade` on a loop) at 1.0. Front: `desk` (Lena's desk, in front of
    the people).
  - The manifest also carries `screen`, `press` and `desk` (metres) so a player or an author can place props on them.
  - Only the item types `image`, `states`, `loop` and `clock` and the field `fade`: nothing new for a player.
  - Bake only this set: `node tools/bake-scene-assets.cjs --only sets,check --set redaktion`.

### Known differences from the live drawing

- **Pictures and animal loops** are sampled at their fps, while the site draws every frame. The seams of loops whose motions do not share a period are listed in the report.
- **Stream:** its ripples never repeat, so the 4 s stream loop crossfades its first second with the second after it.
- **Werkstatt floor boards:** they fan out from the screen centre in the live drawing and from the bake centre here. At the far left camera (−6.3) the board lines at the bottom edge differ slightly. The village path's pebbles also jump with the camera in the live code.
- **The lake's sun path** glitters at the sun's parallax (0.04) in the live drawing and at the water's (1.0) when baked.
- **Close-ups** up to 4.6× upscale the 2× images, so they are softer than the live vector drawing.
- **Text in the images** ("Bäckerei", "?", "P", "★") is frozen in this Mac's fonts. The site draws it in whatever font the device has.
