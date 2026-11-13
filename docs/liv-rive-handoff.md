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
