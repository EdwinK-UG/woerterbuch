# Liv in Rive: the action library

Branch `liv/actions` (from `feat/liv-2d-scenes`). Local only, nothing pushed. This ports the canvas engine's action library
(`tools/liv/src/06-actions.js`) to the Rive rig (`tools/liv/rive/liv/`), so every action plays in all five views and returns
to rest.

## How to trigger an action

View-model numbers of the `Liv` view model:

| Number | Meaning |
|---|---|
| `action` | 0 none; 1..27 an action in the canvas order (table below). Set it to start; the controller sets it back to 0 when the action has played and blended out. Setting another number while one plays blends the old one out (same key) and the new one in. |
| `actionT` | read-out: seconds into the requested action (0 when none) |
| `prop` | 0 empty hands, 1 apple (right hand), 2 crate (both hands, carry arms), 3 saw handle (right hand). A throw lets go of the apple and sets `prop` to 0. |
| `propApple`, `propCrate`, `propSaw`, `flyOp` | written by the controller (prop opacities, the thrown apple) |

In the demo window (`cd tools/liv/rive/liv && rive .`) a block of small **Actions** buttons sits under the view buttons
(three columns, canvas order) and a **Props** block under Gait. `throw` also sets `prop` = 1 (she throws the apple),
`carry` sets `prop` = 2 (she keeps the crate until **Empty hands**). From a page: set `action` (and `prop`) on the view-model
instance; with the CLI: `data action=5`, or `pointer click@x,y` on a button.

Actions layer over standing and walking as in the canvas engine: arms, torso lean and head always; the lower body (hips
height, hips back or sideways, feet) only while she stands (it is scaled by 1 - gait weight). `carry`, `push`, `pull`
have the canvas key `arms`, so another action does not end them. The action's expression is set on `expression` while it
plays and the previous value is restored when it blends out; nod / shake / bow also move the gaze (`lookX` / `lookY`,
restored afterwards).

## The actions

Durations, blend in / out and expressions are the canvas values (default blends 0.22 s in, 0.25 s out).

| # | Name | s | Blend | Expr. | What she does (and Rive notes) |
|---|---|---|---|---|---|
| 1 | wave | 2.6 | | | right hand up, side to side (open hand) |
| 2 | point | 2.0 | | | left (far) arm points out to her left; **turned toward her front** where it would point at or away from the camera (side views), and kept straight |
| 3 | pointUp | 2.0 | | | right index up beside her head |
| 4 | thumb | 2.0 | | wink | right thumbs-up in front of the chest |
| 5 | clap | 2.4 | | laugh | hands clap in front of the chest, small bounce |
| 6 | shrug | 2.2 | | think | palms up, shoulders up (2D: the head sinks a little between the shoulders) |
| 7 | think | 3.0 | | think | finger to the chin, other arm across the waist. **2D change:** the hand goes to the chin centre and lower (canvas out 0.14, up 0.24) so the elbow can rest low |
| 8 | cheer | 2.4 | | laugh | both arms up, small hops |
| 9 | hips | 2.4 | | | fists on the hips. **2D change:** out 0.2 arm lengths (canvas 0.34), otherwise the fists hang beside the waist |
| 10 | present | 2.6 | | | left arm open palm up to her side (turned like `point` in profile) |
| 11 | stop | 2.0 | | neutral | right palm forward |
| 12 | beckon | 2.4 | | | right hand forward, fingers curl (the hand_pose `beckon` cycle, 0.95 s; canvas 0.7 s) |
| 13 | count | 3.0 | | | right hand counts one, two, three (count1..3) |
| 14 | nod | 1.6 | 0.1 in | | head pitch ±0.2 rad; seen from the front the head dips on the neck and the eyes look down |
| 15 | shake | 1.6 | 0.1 in | neutral | head yaw ±0.5 rad: eyes left / right, the head shifts 1.6 cm sideways (as the canvas cut-out) |
| 16 | bow | 2.2 | 0.45 / 0.45 | | lean 0.6 rad, hands down; seen from the front the head drops toward the chest |
| 17 | jump | 1.5 | 0.08 / 0.2 | laugh | crouch, 15 cm hop with tucked feet, arms up, landing |
| 18 | crouch | 2.6 | 0.5 / 0.5 | | hips 21 cm down and back, lean 0.5 |
| 19 | carry | 2.0 | key arms | | both hands forward holding (crate when `prop` = 2) |
| 20 | push | 2.4 | key arms | effort | flat hands forward, lean in |
| 21 | pull | 2.4 | key arms | effort | gripping (gripHandle), lean back |
| 22 | throw | 1.5 | 0.12 in | | wind-up behind, release at 0.635 s (the apple flies, forward and up, and fades; toward the camera it grows) |
| 23 | kick | 1.3 | 0.1 in | | right foot kicks forward; front / back: the foot also goes a little outward (2D angle) |
| 24 | sit | 3.0 | 0.6 / 0.6 | | sits on an invisible seat (hips 19 cm down, 14 cm back), feet 5 / 8 cm forward |
| 25 | dance | 3.2 | | laugh | hip sway, arms up and down, little steps |
| 26 | explain | 3.0 | | | right open palm up, small beats |
| 27 | ouchHand | 1.6 | 0.08 in | ouch | left hand shaken out, lean back |

27 actions: the handoff said 26; `06-actions.js` has 27 (all ported).

## How it works

- `tools/liv/rive/actions.luau` (module, required by the controller): every action is a Luau function of t that fills a
  partial pose with the canvas maths. Units: hand targets in arm lengths from the shoulder -> metres in the chest frame
  (arm 0.274 m, shoulders ±0.098 m and 0.378 m above the pelvis, as measured on the Rive art; `m` measures from the
  breastbone); `py` (hip height factor, rest 0.985) x 0.498 m; `psf` x leg 0.40 m; `psx` x hip half width 0.076 m;
  foot `p` -> offsets from the planted foot; `shL/shR` -> `shrug` (0.035 m per unit); lean / hp / hr / hy / crl / ctw radians.
  Layers blend like the canvas `blendInto` (only what a part sets), `tin` / `tout` as there.
- Per view the controller projects body space with the view's yaw; the action's hands are in the chest frame and turn with
  the spine about the current pelvis (a bow carries the hands down). Pose / gait hand -> action hand blends along an arc about
  the shoulder (a raised hand swings down beside her instead of folding the arm across the chest).
- **Elbow side**: the Rive IK bends to a fixed side; each arm's `invertDirection` is now bound (`<view>_ikInvA/B`). Of the two
  elbows the 2D IK can make, the one nearer the canvas elbow hint wins. A change of side needs a straight arm: when one is
  pending the arm stretches for about 0.1 s, flips, then bends again (no elbow pop).
- **Hands off the head**: a hand target inside a 0.24 m circle round the head is pushed sideways out of it (seen from the
  side, forward). Without this the canvas 3D poses put the hand on the face in the three-quarter and side views (wave,
  pointUp, count, stop, cheer, dance, jump). Exempt: the think hand.
- **Readable pointing**: `point` / `present` turn about the shoulder toward her front until 85 % shows, and are kept as long
  on screen as in space.
- Far arm in front of the torso (the rig's front copy) when the far hand comes toward the viewer past the chest, with
  hysteresis and a 0.08 s fade (a half-faded copy shows the arm twice).
- Front and back views: during crouch / sit / jump leg A's knee is turned to the other side (`<view>_legInvA`), so the knees
  go apart instead of both to one side; switched only while the legs are nearly straight.
- Head on the neck: the head bone's position is bound (`<view>_headPX/PY`) for the nod / shake / shrug / bow offsets.
- Hand shapes (hand_pose.luau names): open -> open, point -> point, thumb -> thumbsUp, flat -> flat, grip -> gripSphere
  (apple, radius 24 px) / gripHandle (pull, saw, 15 px) / carry (crate), one/two/three -> count1..3, hook/open mix -> beckon,
  relaxed, fist. Palm or back of the hand from the action's palm direction where it is clear.
- Props (`actions_rig.py`): vector shapes in the painted style (ink #3a1c0c outline), apple #d9473a with leaf and stem,
  saw handle #b07a3f, crate tan with a blue label. Apple and handle are children of her right hand's mount (behind the
  fingers, so the grip wraps them), in every view; the crate is placed by the controller between the hands (behind her in
  the back views); a second apple per view flies when thrown. Holding the apple or the handle brings the hand forward a
  little (otherwise the satchel hides it): not in the canvas engine, where the scene code moves the arms.

Files: `tools/liv/rive/actions.luau`, `tools/liv/rive/actions_rig.py`, hooks marked `[liv-actions]` in `build_liv.py`
(4 blocks) and `liv.tmpl.luau` (about a dozen one- or few-line hooks), regenerated `tools/liv/rive/liv/`. Tools:
`actions/render_actions.py` (frames every 0.1 s + contact sheet per action), `actions/overview.py`, `actions/make_video.py`.

## What was checked

`rive . --verify`: 0 errors, 0 warnings. All 27 actions rendered with the Rive CLI every 1/10 s over the whole action plus
0.4 s, **in all five views**, and looked at as contact sheets; zoomed at full resolution on wave, point, pointUp, thumb,
think, stop, clap, hips, cheer, jump, crouch, sit, bow, nod, shake, throw (with the apple), carry (with the crate) and the
props in all five views. After every action `action` = 0, `actionT` = 0, expression and gaze are back, `prop` is 0 after
a throw. Foot targets during bow, crouch, clap: unchanged to 0.00 px in front / three-quarter / side (sit and dance move the
feet by design). Walking with wave, carry (with crate) and jump: arms replace the swing, feet keep the gait.
Previews: `tools/liv/rive/actions/previews/contact_<view>.jpg` (one per view, all actions, 10 frames each) and
`liv-actions.mp4` (30 fps, the demo buttons clicked with `pointer click@x,y`; a ring marks each click).

## Weak spots (honest list)

- **Sleeves** still tear when the upper arm goes forward and up past about 70 degrees in the side view (think, side) and the
  far arm's front copy shows a skin-coloured upper arm over the bodice in three-quarter (carry, crate). That is the sleeve
  skinning / cut art (not changed here: report to the lead).
- **Back views**: the near arm is always drawn on top, so hands that are in front of her chest (clap, think, sit, crouch)
  show on her back. Needs a back copy of the near arm in the rig.
- **Toward the camera** (front view): push, pull, stop, thumbs-up, the throw's release and the kick are foreshortened;
  thumbs-up's thumb points sideways (the hand turns with the forearm; no wrist roll in the rig).
- Expression changes cross-fade two mouths for a moment (face.luau's fade, visible at laugh -> happy). Not changed.
- Nod seen from the front is small (head dips about 10 px on screen plus the gaze); the side view shows it properly.
- `sit` slides the feet forward 5 / 8 cm on the ground (canvas maths); `crouch` / `sit` from the front: knees apart.
- Pelvis roll (`prl`, dance) has no bone in the Rive rig and is left out; the canvas wrist `bend` is applied to the hand
  bone as a plain screen rotation.
- A whole-body action requested while walking only plays its upper body (and the hop).
- The thrown apple's flight is a fixed throw (2.4 m/s forward, 2.6 m/s up), not derived from the hand speed.
- Mirrored (`mirror` = 1): wave, point, throw looked at in three-quarter only. Not checked: quarter-speed playback, a real
  browser / phone, the wrist bend's direction per view (applied, not verified).
- In the video she waves while carrying the crate: the crate stays centred between the hands, so it rides up with the
  waving hand. A held crate should block one-hand actions (not done).
