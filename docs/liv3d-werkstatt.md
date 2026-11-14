# Liv in the 3D workshop of Kapitel 57

Live on main. Liv is the default worker of the 3D workshop (`grammatik/werkstatt/`); the workman is the fallback.
With `?liv=1` on the workshop page the 3D Liv (`tools/liv3d`) takes his place at the saw.

## How to switch it on

- In the app this is the default (since 14 Nov 2026): the lesson page opens the "3D-Werkstatt" with `&liv=1`.
  `?liv3d=0` on the app page brings the workman back for that browser tab (the same switch as for the park).
- The workshop page alone shows "Nicht verfügbar": it gets its sentences from the lesson page by message. For local
  work a harness outside git (`.local/w57/`, git-ignored) embeds it and posts the texts it reads at run time from the
  private folder. No lesson sentence is in any repository file.
- The model is `grammatik/liv/liv.vrm` (4.6 MB, served with the site). Without it, or on any error, the workman comes
  back (one console warning). The open button waits for her; after 45 s the workman takes over.

## What was built

| File | What |
|---|---|
| `grammatik/werkstatt/liv-worker.js` | Liv at the saw: the boarded platform with two steps, both hands pinned to the saw's handle points every frame, shoulders leaning in with the saw, the round's clock mapped to her reactions and where she looks |
| `grammatik/werkstatt/main.js` | `?liv=1` flag, `showWorkman`, hand-over of the per-frame update, lazy import with fallback, test hooks (`__tb.adv`, `__tb.view`, renderer, scene, camera, liv) |
| `grammatik/werkstatt/index.html` | import-map entry for `@pixiv/three-vrm` (fetched only with `?liv=1`), `main.js?v=3` |
| `grammatik/grammatik.js` | the workshop opener adds `&liv=1` to the 3D workshop when the app flag is set |
| `tools/liv3d/liv3d.js` | additive: `setHandTarget(side, vec3 or null, { w, palm, elbow, bend, shape, grip, row })` (wrist target in the actor's root space, solved by the arm IK every frame until cleared) and `handFrame(side)` |

What she does: idle with hands on hips, looking at the viewer; takes the handle, pulls the saw down through a separable
verb, lets go, thumbs-up with a laugh; on a verb that cannot be cut the saw grinds, she recoils surprised, thinks and
shrugs. "Selbst sägen" (dragging the handle) moves her hands with it.

## Checked (14 Nov 2026)

- Hands on the handle: at most 1.5 mm between grip centre and handle point while holding, over a whole cut, a failed
  cut and with the handle shaken in try mode. Arms stretch to at most 0.85 of their length.
- Her mesh never enters the saw guard or motor and never goes below the deck; nearest approach to the blade plane
  11.5 cm in the cut; the skirt hem stays at least 4.2 cm above the bench top.
- Default mode: 11 frames (cut, fail, whole) are byte-identical PNGs between the last commit and the working tree; no Liv
  or VRM file is requested. With a model address that does not exist the workman returns and the same frames are
  identical.
- No console errors in Liv mode over three rounds. 13.1 ms per frame with her against 9.1 ms without at 2560 x 1600.
- Pictures (cut, failed cut, hands, idle from six sides, phone portrait) were looked at; they show lesson words, so they
  are kept outside the repository (`.../outputs/Claude-Liv3D-Werkstatt/`).

## Open (honest)

- **She stands on a 68 cm platform**, not a low step: her arms are 28 cm, the handle is 20 cm in from the bench edge and
  the bench is 95 cm high, built for an adult. From lower down she cannot reach it without the skirt cutting into the bench.
- With Liv the camera comes closer (landscape: 1.65 m half width instead of 2.0; portrait: 1.0 instead of 1.15), so she
  is about a quarter bigger; shelves, bench and sentence row stay in the picture.
- She bows up to 43° at the bottom of the cut (knees stay straight, or the skirt opens over the thighs).
- After a failed cut the block slides forward by itself (the workman pushed it; she cannot reach bench level).
- The handle is thicker (52 mm) than her hands can close around: her fingers lie over it.
- Her thumbs-up face is a laugh, not the player's wink.
- Not tested: real phones, Safari, Firefox, the signed-in lesson page, sound.
