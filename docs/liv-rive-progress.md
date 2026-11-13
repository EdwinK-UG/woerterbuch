# Liv in Rive: three-quarter view (step 1 of the handoff's suggested order)

What this is: the first view of Liv rebuilt as a native Rive rig, from the pack's cut parts, to be looked at before the
other views, the walk and run, the face and the scenes are built.

```sh
python3 tools/liv/rive/cut_tq.py       # limbs cut from the view picture  -> tools/liv/rive/tq/
python3 tools/liv/rive/build_tq.py     # the Rive project                 -> tools/liv/rive/liv-tq/
cd tools/liv/rive/liv-tq
rive . --verify                        # 0 errors, 0 warnings
rive .                                 # live window; click Rest, Wave, Reach, Cheer, Crouch, Step, Hands, Bind
```

Pictures: `liv-tq/preview/pose-sheet.png`, `rig-diagram.png`, `liv-tq-poses.mp4` (24 s, rendered by the Rive runtime).

## What is in the rig

- **Art:** the pack's three-quarter parts (head, torso, skirt, sleeves, socks, boots) and its six hand drawings, plus the
  parts the pack does not cut: upper arms, forearms and the bare legs, made by `cut_tq.py` from what is left of the view.
- **Bones** (named as in the handoff's proposed skeleton): pelvis, spine, head; shoulder_R/L, upperArm, foreArm, hand;
  thigh, shin, foot; two sleeve helper bones per arm. R is her right (viewer's left in this view).
- **IK:** native two-bone IK on both arms and both legs, toward target nodes the controller moves.
- **Sleeves:** a mesh skinned from the torso (shoulder seam) through two helper bones (one third and two thirds of the
  upper arm's rotation, by rotation constraints) to the arm (cuff), plus a shoulder cap that stays on the torso. Raised
  arms keep a whole sleeve; there is no torn cloth.
- **Elbows** are rounded in the art; the shoulder is a zero-length bone so the arm's own rotation stays small (rotation
  constraints cannot follow the +-pi wrap).
- **Hands:** six poses as sprites on the hand bone; one visible at a time, cross-faded.
- **Far arm:** drawn behind the torso, or in front of it (`frontB`), so it can pass over the chest.
- **Feet:** a foot target node carries the foot's angle (a rotation constraint), so boots stay level when the shin tilts.
- **Controller** (`pose.luau`): sets view-model numbers only (IK targets, spine and head rotation, hand shapes, pose
  id); every channel follows a critically damped spring.

## Checked

`rive . --verify` is clean. Rendered through the Rive command-line runtime: all eight poses, and frames in between.

## Not checked, and what is still weak

- **Web runtime:** no `.riv` has been loaded in a browser yet. Writing a `.riv` with the CLI signs it with the owner's
  Rive login, so that was not done without asking.
- **No walk or run yet** (step 3), so foot sliding is untested.
- **Face and hair are one picture.** Blink, brows, mouths and expressions come with step 4.
- **The leg is a skin tube** stretched from a strip of the drawn leg: the shadow under the hem is lost, and a bent knee is
  a projection (knees point toward her facing side), not drawn art.
- **Crouch** looks stiff: the torso mesh is weighted only to pelvis and spine.
- **Hands** keep the pack's drawings; the other arm's hand is the same drawing mirrored.
- **Likeness:** this is the pack's art, which draws her younger than the owner's original picture (open question in the
  handoff). Nothing here changes that.
- Inter.ttf (OFL) is included for the button labels.
