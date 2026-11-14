# The Deutschklinik cast in 3D (A01–A06, C02–C04)

The nine other characters of the reference pack (`DeutschKlinik_Remaining_Cast_Reference_Pack.zip`), made the way Liv
was made (`docs/liv3d.md`): a VRoid Studio base, a fit script that turns the export into the character inside the VRM
file, the same procedural player (`tools/liv3d/liv3d.js`, `LivActor`), and checks by contact sheets against the
reference. State of 14 Nov 2026. Nothing here is wired into the site yet.

| ID | Character | Base (VRoid project) | Fit highlights |
|---|---|---|---|
| C02 | Village boy, straw hat, vest, patched breeches | `Boy_Base` (male, child sliders) | vest painted over the shirt, rolled sleeves, belt and patch, slouch socks, generated straw hat |
| C03 | Blonde girl, blue dress, big bow | `C03_Girl` = Liv's project with a long-hair preset | Liv's dress mesh repainted blue, Peter Pan collar and buttons, hair cut to mid-back with waves, generated bow, blue eyes |
| C04 | Ginger boy, green shirt, braces, satchel | `Boy_Base` (same export as C02) | braces (Y at the back), freckles, fluffy ginger hair; the player's satchel; slingshot prop |
| A01 | Grandfather, white beard, vest, breeches, cane | `Man_A01` (male adult, short and broad) | generated beard and moustache, wrinkles, bushy white brows, vest, ribbed socks; cane prop |
| A02 | Craftsman, beard, leather bib apron | `Man_A02` (broad), long trousers | **skinned apron** (follows hips and both thighs), straps crossed on the back, rolled sleeves, beard |
| A03 | Young woman, mauve pinafore, bun | `Woman_A03` (female adult), the long maid dress | dress mauve with cream puff sleeves cut at the elbow and a square neckline, the apron layer reduced to a sash and back bow, preset buns removed and one bun generated |
| A04 | Housekeeper, headscarf, green dress, apron | `Woman_A04` (fuller, shorter) | 3/4 sleeves with cream cuffs, apron without bib, **headscarf** fitted to the hair, knot at the nape |
| A05 | Scholar, bowler, glasses, moustache | `Man_A05` (slim), blazer + trousers | coat charcoal, shirt, tie and brown vest in the opening, generated bowler, round glasses, moustache; book prop |
| A06 | Lady, slate gown, updo (marked optional in the pack) | `Woman_A06`, the long black dress with puffed shoulders | gown slate with white collar and cuffs, dark buttons, generated top bun, brooch and pearl earrings |

## Why not just redress Liv

Liv's VRM is a nine-year-old girl's mesh. The fit script can scale joints, cut hair and repaint textures, but it cannot
add long hair, trousers, coats or floor-length skirts, and an adult body is not a scaled child. So every character got
its own VRoid export, but cheaply: the male/female base is a pair of sliders in the `.vroid` file (`baseMale`,
`baseFemale`), so four projects were made by copying and editing files (`vroid_params.py set`), and VRoid Studio was
only needed to pick hair and outfit presets and to export. C03 is the closest to "redressed Liv": Liv's own project,
body and dress, with another hair preset.

## Files

| Where | What |
|---|---|
| `tools/liv3d/cast_fit.py` | the fit library: landmarks, **painting by world position**, hair recolour/cut/drop, face (skin, blush, freckles, wrinkles, brows, iris), generated parts (ellipsoid, lathe, torus, tube, beard, moustache, spherical head cover), skinned sheets (the apron), look |
| `tools/liv3d/cast_specs.py` | one function per character: the measured palette and the rules; `CAST` lists source export, heads-tall target and skin colour |
| `tools/liv3d/demo/cast.html` | all ten (Liv included) on one stage with buttons; `?ids=C02,A01` for a subset, `?raw=1` for the untouched exports; contact-sheet hooks `__views`, `__facegrid`, `__actgrid`, `__gaitgrid`, `__slide`, `__lineup` |
| `tools/liv3d/props.js` | new props `cane`, `book`, `slingshot` (`actor.holdProp(name)`; the cane hangs from the hand to the ground, no holding pose) |
| `tools/liv3d/preview/cast/` | reference above model for each character, the line-up |
| `tools/liv3d/models/cast/` (git-ignored) | `*-vroid.vrm` exports, `*.vroid` projects, fitted `*.vrm`, packed `packed/*.vrm` |

Rebuild one or all (about 40 s each; they can run in parallel):

```sh
python3 tools/liv3d/cast_fit.py C04          # models/cast/boy-vroid.vrm -> models/cast/c04.vrm
python3 tools/liv3d/cast_fit.py all
python3 tools/liv3d/vrm_pack.py tools/liv3d/models/cast/c04.vrm tools/liv3d/models/cast/packed/c04.vrm
python3 tools/liv3d/demo/shot_server.py 8797 /tmp/shots      # then open /tools/liv3d/demo/cast.html
```

## How the fit works (what is new compared with Liv)

- **Painting by world position.** Every texel of a texture is mapped back to the point of the body it covers (rest
  pose, by rasterising the mesh's UV triangles). Rules are then written in body terms: "vest: the trunk from the belt to
  the neck, except a V at the front that widens toward the collar", "braces: 5 cm from the middle in front, meeting in a
  Y at the back". This works on any preset without measuring its texture layout. Repaints keep the texture's own folds
  and seams, normalised to their local mean so a red bodice next to a cream apron repaints evenly.
- **Heads tall from the sheets.** Measured on the front views (crown to chin against crown to sole): children about 5,
  A03/A04 about 5.3, A01/A02/A06 about 6.5, A05 about 7. The head joint scale follows from that (C02/C04 0.52,
  C03 0.49, A01 0.76, A02 0.99, A03 1.29, A04 1.23, A05 1.02, A06 1.08).
- **Generated parts** are rigid meshes on the head joint (beards, moustaches, hats, bun, bow, scarf, glasses) or the
  neck (brooch), with MToon materials named `AccHair_*`, so the player ignores them when it measures the body. Hats and
  the scarf are fitted to the hair's measured shape; beard and moustache to the face surface.
- **The apron (A02)** is a sheet added to the body's skin: the bib follows the chest, below the hips each half leans
  on its own thigh and a little on the other, and it stands off the knees, so it swings like cloth when he walks
  instead of folding round a leg.
- **Skin**: the male base's skin is much paler than Liv's; the fit measures each texture's own skin colour before toning.

## Checked (pictures in `tools/liv3d/preview/cast/`, more in the session's shot folder)

- Front, side and back against the reference for all nine.
- Eight expressions each (happy, smile, laugh, surprised, sad, think, wink, ouch): eyes, brows and mouth work through
  beards, moustaches and glasses.
- Gestures: wave, point, think, cheer, bow, crouch, jump for all nine.
- Walk and run from the side and three-quarter. Foot slide while planted (mm per frame, walk / run): C02 0.19/0.23,
  C03 0.13/0.38, C04 0.19/0.23, A01 0.10/0.26, A02 0.08/0.16, A03 0.05/0.33, A04 0.10/0.32, A05 0.09/0.32,
  A06 0.05/0.33 (Liv: 0.14/0.39).
- Props: cane, book, slingshot and the old apple in several hands.

## Polish after the first review (15 Nov 2026)

- **Noses and mouths** read at scene distance now, for the cast and Liv (`cast_fit.face_lines`, also a step of
  `vrm_fit.py`): the face's own nose stroke and closed-mouth line are found by position and by being darker than the
  skin, then darkened a little and grown to about twice their size. No new lines are drawn. Liv's model was rebuilt
  with it; without the step the rebuild is byte-identical to the model the site served, so this is the only change.
- **Cheer** is two real little jumps (knee dip, push-off, both feet off the ground with the toes pointing down, knees
  giving on landing), then the arms stay up; it used to bounce the whole figure 5 % of hip height with the feet flat.
  **Dance** now steps: the weight goes onto one foot while the other lifts and points. Both are in `actions.js`, so
  they also change Liv's cheer in the workshop and wand scenes, which load the player directly.
- **Line-up spacing** on the cast page follows each character's shoulder width and arm reach, so a waving arm never
  crosses a neighbour (two arms through each other also made the toon outlines look as if a hand were in front and
  behind at once).

## Weak (honest list)

- **A05** wears a hip-length blazer: VRoid has no frock coat and the length slider does not lengthen it. The vest shows
  only in the opening.
- **A01 and A04** are less stout than drawn (VRoid has no belly slider); A01's breeches are straight, not gathered.
- **Hair**: C03's waves are stringy rather than the drawn soft mass; A02's hair is wavy, not curly; C04's is longer
  and flatter than the drawn spiky curls; A06 keeps a short fringe where the drawing sweeps the hair up; A03 has no
  loose wisps.
- **Long skirts** (A03, A04, A06) balloon in a crouch and fly wide in a run (the presets' skirt springs); C03's skirt
  opens in a crouch like Liv's. A02's apron goes flat like a tray in a deep crouch.
- **A02's kick** goes through his apron (the sheet follows the thighs only partly).
- **Bow** (C03) reads as two round loops; the reference bow is flatter with pointed ends. A04's scarf is a snug cap,
  not a kerchief with a point at the back; its knot tails stick out sideways.
- **C04's satchel** hangs on the right hip (the player's satchel is fixed to one side); the drawing has it on the left.
- **Not done**: buckle/pocket details on aprons and vests, A06's lace chemisette and full bell skirt, A02's apron pocket.
- **Size**: 4.3–5.6 MB each after the fit, 2.4–2.8 MB after `vrm_pack.py` (1.4–1.6 MB as the server sends them),
  23.6 MB for all nine. Not measured on
  phones; ten characters on one stage were fine on a laptop.

## The Gemini script that came with the pack

`deutschklinik_vroid_rive_pipeline.py` (identical copy inside the pack) does three things: it writes a "VRoid preset"
and a "Rive rig scaffold" JSON per character, which neither VRoid Studio nor Rive can open; it cuts each sheet into
front, side and back crops by looking for the emptiest column inside fixed windows (this worked on all nine sheets, and
its crops are already in the pack); and it cuts out the cream background, which also removes cream clothing (97 % of
A04's apron, half of A03's blouse become transparent). Its config's image paths (`input_file_2.png` …) do not exist,
so run as it is it would skip the slicing silently; the `--export-rive-scaffold` option in its help does not exist.
Only the crops were used; its hex colours were treated as guesses and measured again.
