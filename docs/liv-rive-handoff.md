# Handoff: rebuild Liv and her two scenes in Rive

Written by a cloud session that could not reach the Rive desktop app. Read this first, then `docs/liv-character.md`.
Everything below is on branch `feat/liv-2d-scenes`.

## Goal (the owner's words, condensed)

- Liv (character C01) is the reusable Deutschklinik main character for interactive animations **in Rive**.
- She must walk and run naturally, gesture, handle things, and show expressions. Running, walking and hand
  movements matter most. Animations run on all devices, mainly mobile; videos are screen recordings of the browser.
- The rig must transfer to other characters without redoing the animation.
- **Liv does not speak.** Narration is the recorded Elisa voice (ElevenLabs). No lip sync is needed.
- Two scenes must exist in Rive and be wired into the web app: the film **park** (in den Park / im Park) and the
  **Kapitel 57** saw workshop (trennbar oder untrennbar).

## What exists today (not Rive)

A plain JavaScript canvas rig, already integrated and tested. Treat it as the specification and the fallback.

| What | Where |
|---|---|
| Rig sources (skeleton, gait, actions, renderer) | `tools/liv/src/*.js`, built to `grammatik/liv/engine.js` |
| Park for the films | `grammatik/liv/film-park.js` (drop-in `GRAM_PARK`) |
| Kapitel 57 workshop | `grammatik/liv/werkstatt/` |
| Previews without an account | `prototypes/liv/park.html`, `prototypes/liv/werkstatt.html` |
| Tests | `tests/liv.test.cjs` |

Not verified by the cloud session: a real film park scene with Elisa's audio, Kapitel 57 with a signed-in account
(both need the protected lessons), and iPhone/Safari.

## Art for the Rive build

`tools/liv/rive/` holds what a Rive file needs as image assets:

- `views/01_front.png … 05_back.png`: the five body views (1024 x 1536, flat background `#BFD9E6`), arms held away
  from the body. The original pack is 2560 x 3840 and also has sheets for heads, mouths, hands and the satchel; the
  owner has it as `C01_Liv_rig_pack.zip`.
- `parts/*.png`: the same art cut into parts per view (`front`, `tq`, `side`, `tqb`, `back`): head, torso, skirt,
  sleeves, socks, boots, brows, closed-eye patches, nine mouths, six hands, satchel.
- `parts/parts.json`: where each part sits in view pixels (`x, y, w, h`), plus `_meta` per view: neck point, hem
  line, and for each side `A`/`B` the shoulder pivot `sh`, arm direction `dir`, `ankle` and `sockTop`.
- Further joint positions (pelvis, chest, eyes, mouth, satchel strap) are in `tools/liv/src/04b-views.js`, in the
  `SKINS.c01p` definition. One metre is 996 view pixels.

Known gaps in the art, all met by the owner as complaints at some point:

- **Arms and legs are not cut as parts.** The canvas rig draws them as shapes. For Rive they must be cut from
  `views/` (upper arm, forearm, thigh, shin per view) or drawn as vector shapes.
- **Sleeves:** rotating the cut sleeve pictures looked torn. The canvas rig draws puff sleeves as shapes instead. In
  Rive, bind the sleeve image to the upper-arm bone with a mesh, or draw it as a vector shape.
- Facing left is a mirror image. No painted mouths in profile. No painted hands for counting, beckoning or gripping.
- The pack drew Liv younger than the owner's original picture; the owner has not yet said whether that is acceptable.

## Behaviour to reproduce

- **Gait:** `gaitPose` in `tools/liv/src/05-motion.js`. One model for walk and run (speed-dependent cadence, stance
  ratio 0.62 walking to 0.36 running, heel strike, toe-off, pelvis rise and fall, counter-rotating shoulders, arm
  swing that folds at the elbow when running). Feet that are on the ground must not slide.
- **Actions:** `tools/liv/src/06-actions.js`: 26 actions (wave, point, thumbs up, clap, shrug, think, cheer, jump,
  crouch, carry, push, pull, throw, kick, sit, bow, nod, shake, dance …).
- **Expressions:** `EXPR` in `05-motion.js`: happy, smile, neutral, laugh, surprised, sad, think, ouch, effort, wink.
- **Views:** front / three-quarter / side / three-quarter back / back, chosen from the facing angle; the head can turn
  one view further than the body.
- **Park:** `into` starts on the pavement and runs through the gate; `within` runs a stretch and back inside the park.
  The film player calls `GRAM_PARK.draw(canvas, route, t, opts)` and needs **the same picture for the same `t`**
  (seek, replay, resize). A Rive version must be driven by time, not by free-running playback.
- **Workshop:** per verb: block slides in, Liv thinks, grips the saw handle, saws; separable verbs split and the
  prefix flies to the sentence end, inseparable verbs make the saw kick back and stay whole. Modes "Zuschauen" and
  "Selbst sägen". Sentences arrive from the lesson page by `postMessage` (`werkstatt-ready` / `werkstatt-texts` /
  `werkstatt-close`); no lesson text may live in a public file.

## Two ways to build in Rive (from Rive's documentation, November 2026)

Neither was run by the cloud session; confirm each step.

1. **Rive CLI** builds `.riv` files from text (Rive Markup Language, Luau scripts), no editor needed. Runs on macOS
   (Apple Silicon), Linux x86_64 and Windows.

   ```sh
   curl -fsSL https://releases.rive.app/cli/install.sh | sh
   rive doctor
   rive create liv
   rive liv            # live preview window
   rive liv --verify   # compile check
   ```

   `rive create` writes an `AGENTS.md`/`CLAUDE.md` that explains RML lookups (`rive docs`, `rive schema`) and checks
   (`rive inspect --summary`, `--screenshot`). Docs: https://rive.app/docs/cli/overview.md

2. **Rive desktop editor over MCP** (macOS/Windows, the app must be open): bones, weights, state machines, view
   models, scripts.

   ```sh
   claude mcp add --transport http rive http://127.0.0.1:9791/mcp
   ```

   Docs: https://rive.app/docs/editor/ai/mcp.md

Unknown until tried: whether the CLI needs a Rive account, what plan limits apply, how well either route handles a
five-view cut-out character with image meshes, and how Rive's web runtime can be advanced to an exact time for the
film park.

## Suggested order

1. Install the CLI, run `rive doctor`, build a throwaway project, and confirm a `.riv` plays in the Rive web runtime.
2. One view first (three-quarter): import parts, cut or draw limbs, bones, IK for arms and legs, sleeve bound to the
   upper arm. Show the owner before going further.
3. Walk and run cycles on that view; check for foot sliding.
4. Remaining views and view switching; expressions; hand swaps; satchel.
5. State machine with inputs the web app can drive (view, speed, action, expression).
6. Park and workshop in Rive; then replace the canvas versions behind the same interfaces (`GRAM_PARK.draw`, the
   workshop `postMessage` protocol) and keep the canvas versions as fallback until the owner approves.

## Process notes from the owner

- Do not report something as blocked or impossible without checking; say what was and was not verified.
- Check motion frame by frame before showing it; the owner should not have to point out visible faults.
- Ask before `git push` to `main` (that deploys) and before deploying the Worker.

---

# Design specification (added after review: the first version pointed at code for these)

## Likeness and style

- **Likeness target:** `tools/liv/rive/reference/C01_red_skirt_original.png`, the owner's original picture. The owner
  asked for the character to look exactly like it. `C01_green_skirt_turnaround.png` is the owner's earlier sheet
  (other outfit; useful for expressions and the back view).
- The generated pack in `tools/liv/rive/views/` matches the outfit but draws her younger: bigger head, shorter legs,
  curlier hair with a tuft. **Open question for the owner:** accept this, or regenerate the body views.
- Style: storybook illustration, warm flat colours with soft shading, dark-brown outlines of even weight. The owner's
  starting wish was "like Heidi"; the design must stay an original character and not copy that cartoon.

## Colours (sampled from the pack)

| Part | Colour | Part | Colour |
|---|---|---|---|
| Outline | `#3a1c0c` | Skin, lit | `#fdc28d` |
| Skin, shade | `#f0a56e` | Blouse and socks | `#fed9a6` |
| Blouse fold lines | `#e2bd8a` | Bodice and skirt | `#b9301a` (range `#b93018`–`#bc301b`) |
| Satchel strap | `#e69d43` | Mouth interior | `#8c3a2c` |
| Tongue | `#e07a66` | Eyelid skin | `#fec087` |
| Pack background (not part of her) | `#bfd9e6` | | |

## Proportions (metres; 996 view pixels = 1 m; she stands about 1.31 m tall in the pack)

| Measure | Value | Measure | Value |
|---|---|---|---|
| Thigh / shin | 0.20 / 0.20 | Ankle height | 0.098 |
| Foot length | 0.17 | Hip half-width | 0.076 |
| Pelvis to chest | 0.386 | Shoulder half-width | 0.13 |
| Upper arm / forearm | 0.15 / 0.14 | Head radius | 0.145 |
| Upper arm thickness | 0.058 to 0.050 | Forearm thickness | 0.050 to 0.032 |
| Thigh thickness | 0.062 to 0.058 | Shin thickness | 0.058 to 0.052 |

In view pixels (all five views share a 1024 x 1536 canvas): pelvis about (512, 912), chest (512, 528), neck about
(512, 465), eyes at y 331, mouth at y 394, waist line y 748, hem about y 1100, ankles about y 1320, soles y 1420.
Exact per-view values: `tools/liv/src/04b-views.js` (`SKINS.c01p`) and `tools/liv/rive/parts/parts.json`.

View switching by angle between her facing and the viewer: front below 24°, three-quarter to 66°, side to 112°,
three-quarter back to 152°, back beyond. Standing at rest she faces about 43° (three-quarter).

## Expressions (0 = none, 1 = full)

| Name | Mouth | Brows | Eyes |
|---|---|---|---|
| happy (rest) | painted closed smile | neutral | open |
| smile | closed smile | neutral | open |
| neutral | lips together, flat | neutral | open |
| laugh | big open smile | raised 0.5 | closed, curved up |
| surprised | round, open 0.6 | raised 1.2 | open |
| sad | corners down | inner ends up | 0.75 open, looking down |
| think | small, flat | one raised, one slightly lowered | looking up and aside |
| ouch | wide, teeth, corners down | raised, inner ends up | 0.55 open |
| effort | teeth together, slight frown | lowered, inner ends down | 0.8 open |
| wink | open smile | one raised | one closed |

Blink: every 2.2 to 5.4 s, about 0.2 s. Idle: slow breathing (chest and shoulders), small head and weight shifts.

## Motion targets

- Walk about 0.9 m/s, run about 2.5 m/s for her leg length (0.4 and 1.12 times the square root of g times hip height). Cadence rises with speed; stance takes 62 % of the cycle
  walking and 36 % running (so running has a flight phase).
- Heel strikes first, foot rolls flat, heel lifts, toe pushes off. Knee lift in the swing: low walking, high running.
- Pelvis rises over the standing leg when walking; when running it sinks on landing and rises in flight.
- Shoulders counter-rotate against the hips. Arms swing against the legs; elbows fold to about 90° running.
- Forward lean about 2.5° walking, 11° running. Hair, skirt hem and satchel trail the movement and settle.
- She speeds up and slows down over several steps, turns on the spot with small steps, and turns through the front.
- A foot on the ground does not slide (the canvas rig measures 1–2 mm per half second at steady pace).
- Action poses: `tools/liv/src/06-actions.js`. Each entry gives hand targets in arm lengths from the shoulder
  (out, up, forward), hand shape, and body lean; durations are 1.3 to 3.2 s with about 0.2 s blends.

## Scene design

**Park** (side view, camera follows her, slight downward tilt): pavement and town houses with red roofs on the left
of a stone gate with a green "STADTPARK" sign at x = 0; lawn, sand path, hedge, trees, bench, pond and flowers on the
right. Sky `#cfe6ee` to `#f6efe0`, lawn `#b9d49a`, path `#ead9b0`, pavement `#e3dccd`.
`into`: stands at x = −3.4, starts at 0.7 s, runs to x = 2.6 through the gate, turns to the viewer, thumbs up. A dashed
orange arrow `#d9622b` on the ground crosses the gate. `within`: starts at x = 1.6, runs to 5.6 and back to 2.6, turns
to the viewer, cheers. A dashed green area `#2f5d50` marks the park. A pill tag top right shows the phrase the film
passes in (for example "im Park · Wo?"). Whole action fits in 8 s, then holds.

**Workshop** (front view of a room): cream wall, pegboard with tools on the left, window on the right, wooden
workbench, a drop saw on a column at the right of the bench (amber guard and motor, steel blade), a wooden rail on the
wall above holding the sentence as paper tiles with dashed empty slots for the verb parts. Liv stands left of the saw
in three-quarter view and turns to the viewer for results. The verb lies on the bench as two wooden blocks, prefix
tinted `#f0a98a`. Page look as the 3D workshop: background `#f3e9d8`, ink `#2a2f3a`, green `#2f7d5b`, coral `#c8503d`,
headings Fraunces, text Inter. Controls: Zuschauen, Selbst sägen, Ton an/aus, Nur Bühne (hides controls for screen
recording, also key H), Schließen; then Zurück, Pause, Weiter, 1×/0,5× or Sägen, Ganz einbauen, Nächstes Verb.
One round, about 10 s: block slides in (0.55 s) → Liv thinks with a caption naming the stressed syllable (2.4 s) →
grips the handle, motor starts (1 s) → saw comes down (0.65 s) → separable: cuts through (0.7 s), halves part, prefix
then verb fly to their slots; inseparable: grinds, sparks, saw kicks back, Liv shakes her hand, the whole verb flies to
its slot → rule caption → Liv turns to the viewer and gestures (2 s). Sounds are generated (`grammatik/werkstatt/sfx.js`).

## Proposed Rive file structure (a proposal, not yet tried)

- One file `liv.riv`. Artboard **Liv** 1024 x 1536 with the pivot at her feet; artboards **Park** and **Werkstatt**
  that nest Liv, so other scenes and other characters reuse the same rig.
- One skeleton shared by all views: `root, pelvis, spine, chest, neck, head, shoulder_L/R, upperArm_L/R,
  foreArm_L/R, hand_L/R, thigh_L/R, shin_L/R, foot_L/R, skirt, satchel`. IK on arms and legs. Each view is a set of
  images bound to these bones; a solo switches the visible view. Hands, mouths, eyes and brows are solos too.
- State machine **Liv** inputs: `view` (0 front … 4 back), `mirror` (bool), `speed` (0 stand, 1 walk, 2 run, blended),
  `expression` (0–9 in the table's order), `hand_L`, `hand_R` (pose index), one trigger per action (`wave`, `point`,
  `thumb`, `cheer`, `think`, `shrug`, `nod`, `grip`, `ouch`, …), `lookX`, `lookY`.
- **Park**: a number input `t` (seconds) that the page sets from the film clock, plus `route` (0 into, 1 within) and a
  text value for the tag. Nothing in it may advance by itself.
- **Werkstatt**: triggers `slideIn`, `think`, `saw`, `cut`, `fail`, `whole`, `result`; text values for prefix, stem and
  sentence tiles are set by the page from the lesson's sentences.
- A new character = a new set of images bound to the same bone names; animations stay untouched.

## Acceptance checks

1. Likeness: side by side with the original picture in the same pose, the owner agrees it is the same character.
2. Clothes stay whole in every pose and view: no gaps at shoulders, no detached cuffs, no seams in the skirt.
3. Walk and run at 0.25× speed: no foot sliding, no popping joints, limbs never detach.
4. Every view switch and the turn-around read as a turn, not a jump.
5. All ten expressions and every listed action play and return to rest.
6. Park: setting the same time twice gives the same picture; it stays in step with a film's Elisa narration.
7. Workshop: all eight verbs in both modes, with the lesson's real sentences, opened from Kapitel 57 while signed in.
8. Phone width 390 px and a real iPhone: readable, smooth, nothing cut off.
9. The owner watches both scenes before anything is merged to `main`.

## Other context

- `grammatik/werkstatt/main.js` mentions an earlier "Rive version" of the Kapitel 57 workshop. The cloud session never
  saw that file; ask the owner where it is before starting from nothing.
- Other characters are planned on the same rig. Their art should come as the same kind of pack (five body views with
  arms away from the body on a flat background, plus heads, mouths, hands and props).
- Not in the repository because of size: the full-resolution pack sheets (`C01_Liv_rig_pack.zip`, owner has it).
- Earlier canvas previews (private to the owner; they still contain a stand-in voice that is no longer wanted):
  workshop https://claude.ai/artifact/9ePhTMnau7Bi4hcfJcuQDL, park https://claude.ai/artifact/R38NxjRbh1K13HRxarG87c,
  motion lab https://claude.ai/artifact/LgL2wgmAiXaRKwTaEuMnoz.
