# Liv in Rive: a 2.5D head turn, and 3D inside Rive (22 Nov 2026)

Two experiments after the 2D cast (`docs/rive2d-test.md`): (A) one Rive file in which Liv's head and upper body turn
smoothly from side to side, and (B) Liv's real 3D model rendered by Rive itself. (A) is built and works, with the
limits listed below. (B) is not built: the facts about what Rive can do are here, and the two steps that stopped it.

## A. 2.5D Liv

Test page: `tools/liv3d/demo/liv25d.html` (open through `tools/liv3d/demo/shot_server.py`, like the other pages).
Sliders for turn and tilt, "follow the pointer", the five faces, talking, hair lag on or off; beside it the 3D model
rendered at the nearest of 41 turns. File: `tools/liv3d/models/liv25d/liv25d.riv`.

### What it is

Liv's head and upper body, from the waist up, on a 900 x 1100 artboard. `turn` runs from -1 to 1: the head turns 40
degrees to either side, the upper body 12 degrees with it. `tilt` from -1 to 1 nods the head 6 degrees down or up.

It is built from her 3D model, not drawn. `tools/liv3d/demo/liv25d-export.js` renders the model at nine turns, every
ten degrees from -40 to +40. At each it renders the head as three pictures (back hair, face, front hair) with a depth
picture for each, and the face once more for every expression; the body is rendered once. What a picture needs to
know about what hides it is rendered in: the front hair is rendered without what the face hides of it (the far lock
behind the cheek), the body without the skull (in this model part of the body's mesh).

In Rive every picture is an image mesh on a grid of bones (5 x 5 for a head picture, 4 x 4 for the body). A bone
only slides. Where it slides to is where its part of the picture would be if the picture were the 3D surface it
shows, turned with the head: each bone has a place in the head's own space, fitted by least squares, over the
weights Rive gave the mesh, to the true depth of every mesh point (from the depth picture), counting most where the
picture has lines and edges. So a picture is exact at the turn it was rendered at and stays close for the five
degrees to either side that it is used for; half way to the next capture, that one takes over.

The expressions are small overlays on the face: for each capture and each expression, the pixels that differ from
the resting face, a little wider and with a soft edge, on a mesh of their own bound to the face's bones.

### Why it is made this way

- One capture does not carry far. A single front view, depth-displaced, is good to about 15 degrees; at 35 the near
  ear and the side locks tear and the old outline of the face lies inside the cheek
  (`a_geometry_check_single_view.jpg` in the notes folder). With five captures (20 degrees apart) the far eye, which
  is squeezed in a turned capture, smeared when that capture was turned back toward the front, and two captures did
  not agree where they met. Nine captures, each used five degrees either way, was the first spacing at which the
  check page (`tools/liv3d/demo/liv25d-sim.html`, which draws the same geometry with exact depth) looked clean.
- The handover is a cut, not a fade. Faded into one another over a degree, both captures were there for a moment, a
  few pixels apart along the hair and at the far eye: a ghost whenever the head rested there. Now one capture shows
  at a time, and at a handover the picture shifts by the few pixels the two disagree.
- The turn is not a state machine input. Rive's own way is a blend state or a joystick driven by a number. The
  editor's local endpoint, through which all of this is built, can make neither (its state machine commands make
  states from linear animations only; there is no joystick command), and Rive's window does not take clicks while it
  is in the background. So the file has three animations that are not played but set: `Turn` and `HairTurn` (240
  frames: frame = (turn + 1) x 120) and `Tilt` (120 frames: frame = (tilt + 1) x 60). The page sets their time
  every frame; `HairTurn` a moment behind `Turn`, which is the hair's lag. Data binding with formula converters
  (bone x = a + b cos(turn) + c sin(turn), an interpolator converter for the lag) would put turn and tilt into the
  view model as two numbers; it was left out only because it needs a file of its own (see "The file" below).
- The export drops the animations' names (Optimization: Full), so the page finds the three by their place: the
  first two of 240 frames and the first of 120.
- Breathing, blinking, the five faces and talking run in the state machine "Character" from the view model `Cast2D`
  (`face`, `talking`), exactly as in the 2D cast.

### How it is built

```
# 1. pieces, depth and the 3D reference turns (shot server saving to SHOTS):
#    open http://127.0.0.1:8797/tools/liv3d/demo/liv25d-export.html, then in the console
#    await __export25d(); await __ref25d([...41 turns], [0]); await __ref25d([-1, -0.5, 0, 0.5, 1], [-1, 1])
cp SHOTS/l25_* tools/liv3d/models/liv25d/src/
python3 tools/liv3d/rive2d/liv25d_prep.py tools/liv3d/models/liv25d/src tools/liv3d/models/liv25d/work     # about 3 minutes; writes the depth as .npy (110 MB, deleted after the build)
# 2. with the Rive editor open on a file that has the view model Cast2D and no other artboard:
python3 tools/liv3d/rive2d/liv25d_build.py tools/liv3d/models/liv25d/work
python3 tools/liv3d/rive2d/rive_export.py tools/liv3d/models/liv25d/liv25d.riv Liv25D
# 3. the test page's 3D comparison pictures, as WebP (2.2 MB instead of 24 MB of PNG):
python3 -c "from PIL import Image;import glob,os;[Image.open(f).save('tools/liv3d/models/liv25d/ref/'+os.path.basename(f)[:-4]+'.webp',quality=82,method=6) for f in glob.glob('tools/liv3d/models/liv25d/src/l25_ref_*.png')]"
```

`tools/liv3d/models/` is git-ignored; `liv25d.riv` and `ref/*.webp` are tracked with `git add -f`. `src/` and `work/`
stay local.

`liv25d-sim.html` shows the prepared pieces turned by the same formulas with every point at its true depth, above
the 3D model: what the rig can look like at best, before anything is built in Rive.

### Results

| | file | player, first visit | ready after (local server, libraries cached) |
|---|---|---|---|
| 2.5D Liv, every turn from -40 to +40 degrees | 888 KB (626 KB compressed) | Rive runtime, about 0.85 MB compressed | about 0.75 s, plus Rive's splash on the free plan |
| 2D Liv, one fixed view | 337 KB; her three views 1.0 MB | the same runtime | about 0.2–0.5 s |
| 3D Liv | 2.6 MB (VRM) | three.js + three-vrm, about 0.26 MB compressed | about 0.9 s |

The file holds 28 pictures and 54 expression overlays (0.66 MB of WebP), 82 meshes on 691 bones (about 0.15 MB)
and about 7,500 keys. The first build, with a 17 x 17 mesh on every picture and overlay, was 2.0 MB: every mesh
point costs about 50 bytes, so the pictures now have 9 x 9 points and the overlays 5 x 5. The back hair, of which
only the rim shows, is stored at 0.4 of its size and the overlays at 0.75.

What it looks like, against the 3D model at the same turn: `liv-25d-3d/` in the notes folder
(`a_all_turns.jpg`: the 41 turns, Rive above, 3D below; `a_tilt.jpg`, `a_faces.jpg`, `a_handover.jpg`,
`a_clip.mp4`).

**Good.** At every turn the head reads as the 3D head: the face, the eyes, the fringe and the side locks are where
the model has them, the far eye and the far lock go behind the nose and cheek as they should, nothing is torn,
floating or spiky. The five faces, the blink and the talking mouth sit right at every turn. The hair's lag is a
separate value, so it can be tuned or switched off.

**Weak.**

- It is nine views with a small warp between them, not one drawing that turns. At each of the eight handovers
  (turn = ±0.125, ±0.375, ±0.625, ±0.875) the picture changes at once and some edges move by a few pixels: the
  outline of the hair and the far cheek most. In a turn at normal speed it does not show; moving the head very
  slowly across a handover it shows as a small jump.
- Size. 0.9 MB is nearly her three fixed 2D views together and a third of the 3D model; with fewer captures the far
  eye smears (see above). A drawn 2.5D rig (flat shapes made for it) would be far smaller, but would not be this
  model.
- The nod is small (6 degrees) and approximate: a bone's y follows the tilt and its x the turn, each on its own, so
  a turned head that nods lacks the small sideways part of the motion, and the chin comes out a little more pointed
  looking down than the model's.
- Under the jaw. The neck is the body's picture and does not turn with the head; turned fully, a little less neck
  shows beside the jaw than in the model, and the back hair, drawn as the inside of a bowl behind everything, ends
  in a straighter line under the ear.
- The turn and tilt are set from outside (animation time), not inputs of the file, and the animations have no names
  in the export (above). A native app sets the same two times.
- No arms, hands or gestures: this is a bust. Combining it with the 2D cast's body (the head as a component on the
  torso) was not tried.
- The Rive splash on the free plan, as for every file.

### The file it was built in

The rig was meant to get a Rive file of its own. One could not be made: the endpoint has no command to create or
open a file, exporting a backup (.rev) is not in this plan, and nobody was there to click "New File". It was built
in the cast's scratch file ("Untitled") in an artboard `Liv25D`, using only things that go away with the artboard
(pictures, meshes, bones, animations, a state machine) and the view model `Cast2D` that is already there; no
converters and no new view model, which the endpoint cannot delete. The export takes only the first artboard, so
the cast's leftover artboard of its last build (`A03 3q`) was removed; the cast build clears the file before every
build anyway. After the export the artboard `Liv25D` and its pictures were deleted again.

## B. 3D Liv inside Rive

Test page: `tools/liv3d/demo/liv-rive3d.html`. It says "not built" until
`tools/liv3d/models/liv25d/liv-rive3d.riv` exists, and then plays that file with the GPU Canvas switched on and
measures it.

### What Rive can do (checked 22 Nov 2026)

- **Scripts in a file.** Luau scripts are part of the .riv; the web packages `@rive-app/canvas` and
  `@rive-app/webgl2` run them from 2.34.0 (latest 2.54.0), `canvas-lite` does not. Scripts are compiled and signed
  by Rive's servers at export; a runtime interrupts a script call that runs longer than 200 ms. The free plan exports
  scripted files (with the splash). Sources: rive.app/docs/feature-support, /docs/scripting/security,
  /docs/account-admin/pricing.
- **3D.** A script gets a WebGPU-like API: `context:gpuCanvas({width, height})`, `GPUBuffer` (vertex, index,
  uniform; vertex formats are float32 only), `GPUTexture`, `GPUPipeline.new({vertex, fragment, vertexLayout,
  depthStencil, cullMode, ...})`, render passes with a depth attachment, shaders in WGSL (vertex and fragment, up to
  four bind groups; no compute). The canvas is drawn into the artboard with `renderer:drawImage(canvas.image, ...)`.
  The editor's own scripting reference, saved from its local endpoint (`rive/gpu`, `rive/interfaces`), agrees with
  rive.app/docs/scripting/wgsl-shaders.
- **Reading a model.** `context:blob(name)` returns a binary asset as a Luau `buffer` ("useful for advanced workflows
  where a script needs access to a custom file type, such as a 3D model", rive.app/docs/editor/fundamentals/
  assets-overview). `context:image(name)` returns an image asset and `Image:view()` a texture view of it;
  `context:decodeImage(buffer)` decodes PNG, JPEG or WebP bytes. There is no glTF importer: the script parses the
  bytes itself.
- **On the web.** GPU Canvas content plays in `@rive-app/webgl2` from 2.42.0 (2 Sep 2026), only when asked for with
  `enableGPUCanvas: true`, and is marked experimental ("The API may change in a minor release"). The Canvas2D
  packages do not play it. Shaders are compiled per target at export; WebGL2 needs the "GLSL ES 300" target, which
  is ticked in this editor (Export panel: Metal, GLSL ES 300, WGSL, HLSL, SPIR-V). Source: rive.app/docs/runtimes/
  web/gpu-canvas.
- **How large it would be.** Liv's mesh has 82,695 vertices and 38,538 triangles in three skinned meshes (125
  joints), 57 face morph targets, and 0.44 MB of textures (as WebP). As float32 the positions, normals, texture
  coordinates and indices are 3.1 MB; packed (16-bit positions and texture coordinates, 8-bit normals, 16-bit
  indices per part), which the script would have to unpack into float32 buffers when it loads, 1.2 MB; joints and
  weights for skinning 0.7 MB more. With the textures that is about 1.7 MB for a turntable and 2.3 MB with
  skinning, against 2.6 MB for the VRM: no smaller, and the player (Rive's WebGL2 runtime, about 0.85 MB) is larger
  than three.js with three-vrm (0.26 MB). The morph targets (her expressions) would come on top or be left out.

### Why it is not built

Everything in this project is built through the editor's local endpoint (`tools/liv3d/rive2d/rive_call.sh`), and
that endpoint cannot do two steps this needs:

1. **Put a drawing script on an artboard.** It can create and edit scripts and shaders (`manage_scripts`,
   `text_editor`, `script_diagnostics`), but the only place it can attach one is a listener action
   (`create_listeners`, action type "scripted"). A script that draws is a Node script, and a Node script has to be
   placed on the artboard in the editor's window.
2. **Add a binary asset.** `upload_asset` takes "ONE image (png/jpeg/webp), SVG, font (ttf/otf), or audio
   (mp3/wav/flac)". The mesh would have to be dragged into the editor, or packed into the script's own source as
   text (about 1.6 MB of base64 for the packed mesh; whether a script that long is accepted is not documented).

Rive's window is a single canvas: it takes no clicks or keys from the background, its menu bar has no File menu,
and nobody was at the computer to approve taking the screen (asked once, 22 Nov, no answer). The same stopped a
new file from being made (below), and (B) must not go into the cast's build file: a script and its view model
would stay in it.

What it takes to finish, with someone at the editor: a new file; a WGSL shader and a Luau Node script made through
the endpoint (both can be checked there with `script_diagnostics`); the mesh added as a blob and the textures as
images; the script dragged onto the artboard; export; open `liv-rive3d.html`. Nothing was faked with pre-rendered
pictures.
