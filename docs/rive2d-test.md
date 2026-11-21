# The cast in 2D with Rive (15 Nov 2026)

Every character of the 3D cast (Liv and the nine of `docs/cast3d.md`) also exists as an interactive 2D figure for the
Rive runtimes (web, iOS, Android, Flutter, React Native, Unity): the art and the motion come from the 3D models, the
2D rig is built and exported by script. Nothing here is wired into the site.

## What each character can do

Three files per character, one per view, in `tools/liv3d/models/cast/2d/` (git-ignored): `<id>.riv` three-quarter
facing right (mirrored for facing left), `<id>-front.riv`, `<id>-back.riv`. An app loads the view it shows.

Each file has the state machine `Character` and the view model `Cast2D`:

| Property | Kind | What it does |
|---|---|---|
| `walking`, `running` | boolean | walk or run on the spot (the app moves the figure); running wins over walking |
| `sitting` | boolean | sits down (1.3 s), stays seated (breathing), stands up when set back to false |
| `holding` | boolean | bows, takes hold of something in front of it at about shin height (the top of a box, a basket's handle), holds it at the waist; false puts it down again |
| `wave`, `point`, `cheer`, `think`, `pull`, `clap` | trigger | one gesture; a new one may interrupt the one playing; during a walk or run the figure stops for it and walks on after |
| `face` | enum `happy`, `smile`, `laugh`, `surprised`, `sad` | the face; `happy` is the resting smile and blinks every few seconds |
| `talking` | boolean | the mouth moves (over the resting face) |
| `facingLeft` | boolean | mirrors the figure (turning round over 0.2 s) |

The motions are those of the 3D player (`tools/liv3d/actions.js`), some staged for a flat picture (below). `pull`
reaches forward, closes the hand on a handle, pulls it down and lets go (a lever, a rope, the workshop saw). Scenes that
put something in the hand (a handle, a picked-up box) read the recorded hand paths: `<id>[-view].motion.json` next to
each file (hand and hip joints of every motion, artboard pixels, 30 a second; `metres` and `ground` convert to metres).

Test page: `tools/liv3d/demo/rive2d.html` (served over http, e.g. `python3 tools/liv3d/demo/shot_server.py 8797 /tmp/shots`,
then `http://127.0.0.1:8797/tools/liv3d/demo/rive2d.html`): every character, view, motion and face.

## Two scenes rebuilt with it

- **The park** (`tools/liv3d/park/park2d.html`, `?id=C03` for another character, default Liv): the 3D park, its
  staging and timing from `park3d.js`; the 3D figure is hidden and only drives where the character is and when it
  gestures; the 2D figure is drawn on top at that spot, three-quarter view mirrored by direction, front or back view
  when it faces toward or away from the camera, walking or running by speed.
- **The Trennbar workshop** (`grammatik/werkstatt2d/index.html?local`, Kapitel 57): the 2D workshop of
  `grammatik/liv/werkstatt` with the grandfather (A01). He stands behind the bench (drawn into the stage at his depth,
  so the bench and saw stay in front of him) and works the saw: the handle is drawn in his hand along his recorded
  `pull` motion, and the saw head follows it down; on an inseparable verb the saw stops, kicks back, he lets go,
  surprised, and thinks. Not opened from the lesson; `?local` reads the chapter's sentences from the git-ignored
  `.local` folder (embedded, it asks the lesson page, like the other workshops).

## How a character is made

1. **Layers and motions from the 3D model**: `__export2d(id)` in `tools/liv3d/demo/cast.html` (all characters loaded).
   For each view an orthographic camera at a fixed angle; every body part rendered alone at 1536 x 2048, so all
   layers line up; the joints of every motion projected into the same view, 30 times a second, with a point above
   the head joint that turns with the head (the 2D head follows the 3D head's own tilt; following the line from the
   neck to the head, it tipped over in a bow further than the head was tipped). The rules (in `__parts`, `cast.js`),
   each of them there because its absence showed as torn cloth:
   - **Every piece is whole.** A piece is not cut where another piece hid it in the rest pose (a lock of hair in
     front of a sleeve, the skirt over a hand, the pelvis over the top of a thigh): the hole moved with the piece, so
     a lifted arm had a bite out of its sleeve and a swinging leg opened a gap at the hip. Two cuts remain, where the
     stacking cannot say it: the collar in front of the neck, and, from behind, a trouser hem in front of the calf.
   - **No body under the clothes.** A piece drawn alone is open where it was cut. So its own depth is drawn first
     with both sides of the cloth (the far wall of the toon outline, seen through an open trouser top or armhole, was
     a dark patch inside the piece); skin, and the ring of triangles a piece reaches into the next one, are drawn
     only where no garment of the piece itself or of the pieces next to it covers them in 3D (the waist inside a
     trouser top, a thigh inside a trouser leg, a waistband under a shirt's tail); and the triangles of the body's
     skin that are painted as underwear (black on the male base) are left out.
   - **Rings.** A layer reaches two triangles past its cut into the layers stacked behind it, so layers overlap
     instead of meeting edge to edge; not between the body and the upper arms (a patch of vest turned with a raised
     sleeve), and a thigh also reaches into the pelvis in front of it (so its picture begins with the trousers' own
     cloth at the hip). A layer's toon outline covers only its own triangles.
   - **Garments are kept whole across joints they cannot bend at** (`autoRemap`, from each garment's own vertices):
     shorts and breeches stay on the thigh; skirts, dresses, aprons and shirt tails stay with the pelvis, including
     the part of a skirt that hangs from the spine (below the waist everything of a top goes with the pelvis); shirt
     cuffs go with the forearm; long trousers stay split at the knee, the thigh's layer over the shin's.
   - **Stacking**, back to front. Three-quarter: far hand, forearm, upper arm; far lower leg, foot, thigh; near lower
     leg, foot, thigh; pelvis; torso; head; near hand, forearm, upper arm. Front: feet, lower legs, thighs; pelvis;
     torso; head; arms. Back: arms; thighs, lower legs, feet; pelvis; torso; head (from behind, whatever the hands do
     in front of the body is hidden by it, and a foot kicked up behind is in front of its thigh). A front apron
     (A02's sheet) is, from behind, a layer of its own at the very back: as part of the pelvis it covered the legs,
     and the trousers' seat ended on it in a ragged edge.
   - **Heads**: one per face (happy, eyes shut, mouth open, smile, laugh, surprised, sad; the back view has one), and
     the head's hair alone (for step 2).
   - **Parts drawn in an action's pose**, turned so they sit on their bone; the rig shows them instead of the resting
     part while the action holds. Hands: the open palm of wave, cheer and clap, the pointing finger, the hand at the
     chin, the grip of pull and of holding (a cut-out hand cannot turn its palm to the camera any other way).
     Forearms that point at the camera: both while clapping seen from the front, the holding one from the front,
     and the far one of the three-quarter clap, which is cut by the body as it stands and, with its hand, stacked in
     front of the body while the clap plays (it comes out from behind the chest). Seen from the front such a forearm
     points at the camera with the hand at its near end, so there the posed hand is stacked in front of the posed
     forearm (behind it, a long sleeve's white cuff covered the hand: a white disc on the chest with no hand in it),
     and the clap's hands in front of everything: on their way to the chest they pass before the shoulders, and
     behind the upper arms they showed as fingers sticking up from behind the shoulder.
2. **Prepare** (`tools/liv3d/rive2d/rive_prep.py`): crops, WebP at quality 90 (a fifth of PNG), one JSON per view.
   - **Round joints.** Upper arms, forearms, thighs and calves end at the joint they hang from in a ball: a disc
     round the joint as wide as the limb, filled with the piece's own cloth or skin, and where the piece begins some
     way below the joint (a trouser leg below the hip, a thigh below a skirt's hem) joined to it by a straight piece
     of the same. What is added stays under the piece it hangs from as that stands at rest, so the rest pose is
     unchanged. An arm stacked in front of the body gets a smaller ball, inside the figure's outline, and its top
     is closed to one convex shape (the hollow between the ball and the sleeve's inner edge filled): left open, that
     hollow was a wedge of background in the armpit as soon as the arm swung out from the body, in every frame of
     the front clap. Both are added only where the whole figure's picture shows this same cloth at rest, and in
     exactly that picture's colours, so nothing of them shows at rest. (Filled from the sleeve's own cloth the ball
     was a disc of another shade on the chest, and over a bodice of another colour, Liv's and A03's, a
     sleeve-coloured lobe at each shoulder; a strip of sleeve left on the body to close the armpit instead stood
     out as a bump under a raised arm.) A forearm's top is closed the same way: between the elbow's ball and a
     cuff wider than it there was a notch, hidden under the upper arm at rest and a pale streak across the far
     sleeve once the elbow bent (the three-quarter cheer). The whole outline of an upper arm is smoothed a little,
     so the hem of a short or puffed sleeve does not end in two sharp corners. At the far end (elbow, knee, wrist) a
     piece is trimmed to the joint's disc; a garment that reaches far
     past the joint on purpose (breeches over the knee) keeps its end. The cut at the shoulder and the hip follows
     the mesh's triangles, a zigzag: there the piece's outline is smoothed.
   - **Shoulders on the body.** Under an arm stacked in front of it the body's picture has the armhole. It gets the
     arm's own top (the disc round the shoulder joint, as the arm has it at rest), and the armhole next to it is
     closed in the sleeve's colour, so a raised arm turns on a shoulder of its own cloth. (Before, that place was
     painted in the median colour round the shoulder: white on a black coat, cream on a brown vest.)
   - **Arms behind the body** (the far arm in the three-quarter view, both from behind). The arm's top is filled out
     to one smooth, closed shape: the convex outline of the ball and the sleeve's top, as far as that lies inside the
     figure as it stands at rest (so nothing new shows at rest). Before, the side the body hides was a staircase
     where the mesh was parted, with a wedge-shaped bite below the ball, and the ball was cut off where it would have
     shown: a raised arm showed all that as notches, and the point of the shoulder beside them as a frayed spike.
     What the sleeve shows past the joint at rest (the top of a puff) stays on the arm and goes up with it. The
     sleeve is carried a little under the body's picture, the body's own cut at that shoulder is smoothed, and the
     thin open slits the body's picture has along the armhole (the sleeve behind shows through them at rest, the
     background did with the arm raised) are closed with its cloth.
   - **Closed at rest** (`mend`). Round the shoulders, whatever of the whole figure's picture no piece covers as the
     pieces stand at rest is added in the figure's own colours: the top of a puffed sleeve that neither the body's
     nor the arm's part of the mesh drew (a wedge of background between sleeve and body in the front view, even
     standing still), the outline along the top of a sleeve. What lies against an arm goes to that arm (an arm
     stacked in front of the body only if sleeve and body are one garment: on the body the sleeve's point stood out
     as a wing under the raised arm; on the arm it turns in over the body, where it does not show); the rest goes to
     the body if it lies against it. Specks and hairlines are left out: they would hang in the air once the arm
     moves away.
   - **A long skirt's bow** (three-quarter view; A03, A04, A06). The skirt's one picture reaches from the waist down
     and turns forward with the thighs on the hip joints. Bowing to pick something up, the body leans forward from
     the hips while the skirt's top stayed upright and swung back: a square flap behind the waist. For the bow the
     skirt is two pictures, shown instead of the one while the bow lasts: a waistband from the waist to a little
     below the hip joints, fading out downwards and round its lower back corner, and behind it the skirt from a
     little above the hip line down. (Sitting and walking keep the one picture: its top, turned back under the body,
     is the seat she sits on; cut off at the hips for good, a seated skirt was hollow behind and its lap rose in a
     peak.)
   - **Thighs seen from behind.** From behind the calves are stacked over the thighs (a heel kicked back comes
     toward the camera), so the calf has no ball at the knee and is cut off along the thigh's lower edge. Two
     additions, both hidden at rest. The thigh carries a copy of the calf's knee under the calf: when the calf gets
     shorter in a step its top draws back, and the background showed across the back of the knee. And each thigh
     has a second drawing (`ulegL_sit`, `ulegR_sit`: the same picture, its outline a little smoother) stacked over
     the calves and shown only while she sits or squats: with the calves in front of the shortened thighs, shorts
     showed bare calves up to the seat with rags of cloth beside them and background along the hem.
   - **Neck.** What a head picture holds below the neck (a piece of collar, long hair) is moved into the body
     picture: bowing the head swung the collar piece out like a ribbon (a beard below the neck, A01's, stays with
     the head). The head's picture fades out over a few pixels below that line, and the body's copy of the hair
     reaches a little above it: cut on the line, a hairline of background showed across the hair.
   - Thin stray lines (the far rim of a waistband seen through the open top of the hips) are removed; a hole right
     through a piece (looking into a cut-off sleeve from the body's side) is closed.
3. **Build in the Rive editor** (`rive_build.py`, through the editor's local MCP endpoint, about a minute a view):
   images placed and stacked, bones at the joints, meshes; the body (pelvis and torso) weighted as one blended
   surface on a fine grid mesh with a narrow blend at the waist (every piece has a plain rectangle mesh: traced to
   the picture's outline, one laughing face came out with a hole over the eyes), the heads rigid on the head bone,
   limb pieces rigid with the joint covered by the layer in front.
   **The bow of a long skirt**: the waistband is weighted between the hips and the body like the body's own picture,
   so it leans with the body at the waist and stays on the hips below. The skirt under it is on a finer mesh,
   weighted between the hips, the skirt's bones and the hem's with a wide blend (0.7; everything else 0.3), and its
   bones turn on the back of the seat (the point where its back edge crosses the hip line, which goes with the
   hips) as far as the body leans over, stretched to reach where the knee end would be: so its back stays with the
   seat at the top and curves from there to the hem. The knee end is as far from the hips as the knees are in the
   picture (the two thighs' average): the thighs of a deep bow point partly at the camera, and at their full
   length the skirt's knees were a hand's breadth in front of hers, so the far calf stood out behind the skirt. Rigid on its bones it met the waistband in a corner, a boxy
   seat with flat facets; turning on the hip joints its back edge sank away under the waistband; with the body
   among its bones it swung forward like a bell and left the legs standing behind it. The two pictures come in with
   the motion itself, and the skirt's own picture stays under them until the motion has blended in (and is back
   before they go): swapped at one frame inside that blend, both were half transparent for a few frames and the
   legs showed through the skirt. (The editor's mesh tool binds bones and solves weights automatically; it cannot
   set a weight per vertex, so "the skirt's top on the pelvis alone" is done with pictures, not weights. And on the
   pelvis alone it was worse: the body's picture ends at the waist, well above the hip joint it leans on, and slid
   forward off an upright waistband.)
   **Foreshortening**: a limb that points partly at the camera is shorter in the picture, and a cut-out piece kept
   its full length, so it ran on past its joint (a forearm beyond the hand, a thigh beyond the knee). Upper arms,
   forearms and thighs are drawn on a bone of their own inside the joint's bone, scaled along its length to the
   length the 3D limb has in the picture (not below 0.45, forearms 0.3; scaling the joint's bone itself would scale
   and shear what hangs from it). In the front and back views the calves as well (not below 0.25): running, a heel
   kicked up points the calf at the camera, a fifth of its length in the picture, and drawn at its full length it
   stuck out sideways past its own boot for a third of every stride. Then keys for every motion, thinned to where the motion bends; faces, mirror,
   view model and state machine; a simulated run at the end.
   **No whole turns between animations**: angles are keyed as the nearest turn to the frame before, so nothing
   spins inside an animation, but a hand or forearm that points at the camera passes through every direction in the
   picture and could end a motion one whole turn away from where the next one starts; the blend between the two
   then spun it once round (a hand wheeling round the wrist as the front clap ended; forearms after the cheer). An
   animation that hands back to Idle now ends within half a turn of the rest pose (a turn too many is taken out in
   one step between two frames, where it cannot be seen), and a state that follows another (PickUp, Holding,
   PutDown; SitDown, Sitting, StandUp) starts from that one's last angles.
4. **Export** (`rive_export.py`). The editor exports only the **first artboard of the file**, so `rive_all.py` builds
   each view alone (clears the file, builds, exports) and writes the motion JSON. A retry skips views that are
   already up to date.

Things that went wrong once and are now guarded against:
- The cast page's own animation loop kept moving the figure while layers were being saved, so a posed hand could be
  drawn after the pose had ended (a hand left floating at the hip); `__parts` now pauses the loop.
- The editor answers an upload of bytes it already holds with no asset; the build uploads identical pictures once.
- A half-written image (a killed prep) uploads as nothing; the build stops with the image's name.
- The editor sometimes answers an export without the file; the export retries.
- Keys: every frame of every motion is about 40,000 keys a view and took the editor 10–15 minutes; keys are thinned to
  where the motion bends (within 0.25 degree or half a pixel), about 6,000 a view, with no visible difference.

```sh
# 1. in http://127.0.0.1:8797/tools/liv3d/demo/cast.html (shot server saving to SHOTS): await __export2d('A01')
# 2. with the Rive editor open on a scratch file:
python3 tools/liv3d/rive2d/rive_all.py SHOTS WORK A01            # -> models/cast/2d/a01.riv, a01-front.riv, a01-back.riv
```

## Checking: exact frames

`tools/liv3d/demo/rive2d-frames.html` (same server) steps a file's state machine by hand, 1/60 s at a time, with
Rive's low-level runtime, and saves sheets of chosen frames at any zoom through the shot server: the same frames
every time, the frames in the middle of a motion, and no splash. `await __reviewRows('tag', ['C01', …])` saves, per
view, the clap close up, picking up and putting down, and everything else, one row per character;
`__sheet(name, id, view, steps, {zoom, cx, cy, …})` any frames of one view. The page keeps every file it has
loaded: reload it after a rebuild, or it goes on showing the old file. It does not wait for animation frames, so it
also works in a tab that is hidden or behind another. Make the cells wide enough for the whole figure with its arms
out: in a sheet of narrow cells the arms were cut off at the cell's edge, and the background between an arm and the
body read as a pale, pointed "broken arm". The test page plays in real time, so a
picture of it shows whichever frame the clock reached; the cast sheets below are made with the frames page.

## Staged for a flat picture

The motions are the 3D player's; some are staged per view (runtime actions in `cast.js`; the 3D player's own
motions are unchanged):

- `wave2d` (three-quarter): the hand above the hat, swinging along the picture plane, palm to the camera;
  `waveFront` (front, back): out to the side and up.
- `point2d` (three-quarter) points with the near arm (the 3D point uses the far arm, stacked behind the body);
  `pointSide`, `pullSide` (front, back): out to the side.
- **Clap** (`clap2d`, `clapFront`): the 3D clap itself, elbows down, forearms forward, the hands meeting in front
  of the chest, fingers up. An earlier staging held the hands far forward (three-quarter) or the elbows out
  sideways (front, back) so that no forearm pointed at the camera, and read as stiff arms held out. Now the
  forearms that point at the camera are drawn in the clap's pose and the rest is foreshortened by the rig; from
  behind only the elbows show. On the way in and out the hands rise and sink apart, each on its own side, and close
  only for the first clap (going straight to the meeting point, the forearms crossed at the waist for a few frames).
  Seen from the front the drawings in the clap's pose show from frame 5 to frame 67 of 75 (from 8 to 63, as in the three-quarter view,
  the resting hand stood upright at the shoulder for three frames before and after), and outside them the forearm is not
  squeezed below 0.72 of its length: it only swings through the camera's direction for a moment on its way down,
  and squeezed to a third a long sleeve's cuff was a pale stripe across the arm.
- **Picking up** (`pickUp`, `pickSide`): a bow from the hips with the knees bent, the hand down in front to about
  shin height (the top of a box, a basket's handle), the head going down with the body; then up, holding it at the
  waist with the elbow at the side. It used to be a deep squat with the hand at the ankles: the thighs turned to
  the horizontal and the body folded over them, more than cut-out clothes can do. Front and back: a smaller bow
  (it points at the camera, so it only shortens the figure), the hand down beside the leg.
- Front and back, standing and walking: the arms keep their rest lengths and the hands stay in line with the
  forearms. Running and sitting the forearms point at the camera and are foreshortened.
- Sitting, bowing and standing up, seen from the front or back: the recorded thighs point at the camera or out to
  the sides. There the thighs hang as at rest and get shorter (never below half): a long skirt keeps its shape and
  only gets shorter, shorts and trousers end at the knee, and the shins run from there to the recorded ankles
  (`drape_leg` in `rive_build.py`). From behind the thighs' second drawings show meanwhile, over the calves, and
  the calves go up a little way under them: on with the motion, the resting drawings hidden once it has blended in
  and back before it blends out, so nothing is half transparent in between.

## Results

| | 2D (Rive), one view | 3D (VRM) |
|---|---|---|
| Character file | three-quarter and front 259–428 KB (median 319 KB; C03's long hair is the largest), back 180–225 KB; 114–363 KB compressed; all three views of one character 0.7–1.1 MB, all thirty files 8.3 MB | 2.6 MB (1.6 MB compressed) |
| Player, first visit on the web | rive.js 0.12 MB + rive.wasm 0.73 MB (compressed) | three.js + three-vrm about 0.26 MB |
| First frame, local server, libraries cached | about 0.2–0.5 s | 0.88 s |
| Native apps | the same .riv in the official runtimes | VRM importers or a WebView |
| Views | three-quarter (both directions), front, back; turning swaps files (the park page squeezes through the turn) | any angle |

Pictures: `tools/liv3d/preview/cast/rive2d-cast-3q.jpg`, `-front.jpg`, `-back.jpg` (every character in every state,
exact frames from the Rive runtime: `await __castSheet('3q')` in `tools/liv3d/demo/rive2d-frames.html`, which saves
`cast2d_3q.jpg` through the shot server). `tools/liv3d/demo/rive2d-review.js` takes strips from the test page in
real time instead.

## The Rive splash, and scenes with several actions

Every exported file plays Rive's black "RIVE" splash for about 2.4 s before the character appears; that is the free
plan (the export carries Rive's watermark artboards). It plays **once per loaded file**, not per action: walking,
gestures, faces and talking are all inside one file and switch without it. A scene therefore loads every file it
needs at the start, while its title or start button is showing (the park page loads the three views of its character
at once and switches between them without a splash). Turning to another view or adding another character loads
another file and shows the splash for that file. With a paid Rive plan the export has no splash at all.

## What is still weak

- The Rive splash on the free plan (above).
- Not tested in a native app, and on a phone only as the web page in a phone-sized browser window.
- No in-between angles (a head and upper body that turn smoothly were tried separately: `docs/liv-rive-25d-3d.md`).
  Turning round in the three-quarter view is in the file: `facingLeft` blends the mirror over 0.2 s, so the figure
  narrows to its middle and opens facing the other way. Changing between three-quarter, front and back means changing
  file; the park page turns the figure there the way 2D animation does (the old view narrows to its edge and the new
  one opens from it, 0.2 s), and an app has to do the same.
- Joints are cut-out joints. They are round and closed, but a sharply bent elbow or knee shows the sleeve's or
  trouser's end as an edge, and a limb pointing straight at the camera is a squeezed side view, not a view along it
  (except where it is drawn in the pose: the clap's forearms, the holding forearm from the front). Running, seen
  from the front or from behind, the leg kicked up is a short stub of calf with the boot at the knee, and from the
  front the thigh above it ends bluntly.
- Stacking is fixed per view. From the front an arm swinging back is still drawn over the hip; from behind the
  arms are behind the body and legs, so a hand swinging back is hidden by the thigh's edge. In the three-quarter
  view the near sleeve covers a lock of hair that in 3D hangs in front of it (C03), and a far hand that points at the
  camera (running in a long-sleeved coat) is hidden under its own squeezed sleeve.
- Picking up reaches shin height, not the ground (a child's arm does not reach it without a full squat, which
  cut-out clothes cannot do). From the front and back it is a small bow with the hand down beside the leg.
- A long skirt in a bow (A03, A04, A06, three-quarter view) rounds from the waist over the seat to the hem in one
  curve now. It is still two drawings shown instead of the skirt's one while the bow lasts, and the waistband's
  faded lower edge is a faint soft line behind the seat when looked at closely. A05's jacket tails still stand out
  a little behind in a bow.
- A raised puff sleeve (C01, A03) is the sleeve's own picture turned upward, its cuff corners rounded off.
- The front clap: for one frame on the way in (frame 10 of 75), before the posed hands show, a long sleeve's cuff
  can be seen without its hand (A06).
- Running seen from behind, a shorts leg squeezed to half its length shows its folds as small teeth along the hem
  for two or three frames of a stride (C02, C04, A01). Seated in the three-quarter view the far calf shows behind
  the hanging part of a long skirt (A03 and A06, whose pale stockings make it visible): the figure sits with its knees apart and
  the skirt covers only as far as the near knee. Seen from behind in a bow, a small notch of A02's apron shows
  between his trouser legs.
- Long skirts and A02's apron are one picture hung from two skirt bones that follow the thighs (together fully,
  apart only a third, and in a walk or run they lean at most 8 degrees), each with a lower bone that lies along the
  shins: seated, the skirt lies on the lap and falls from the knees; it does not swing or fold like cloth. A02's
  apron, which hangs in front of the legs, follows the thighs less the more the body leans over them: in a bow it
  hangs nearly straight down from the waist, a flat sheet. Under a
  floor-length skirt there are no thighs: a leg kicked up behind in a run is a calf and a boot coming out of the
  skirt. Knee-length skirts stay with the hips (the legs move behind them).
- Sitting seen from the front or back shortens the thighs to half; shorts become a low band. From behind the
  thighs' second drawings are a little softer in outline than the standing ones.
- 3D-side: A03's bare upper arms (cloth painted as skin below the puff sleeve) are banded; the tucked shirt's lower
  edge on the boys and A01 is uneven (the texture's cut), which a bow makes more visible (A02's is evened out).
- A gesture asked for while the previous one is blending out (its last 0.12 s) is not taken. A gesture during a walk
  or run stops the figure for the gesture; it walks on afterwards (no waving while walking).
- Hands that hold or grip something show a closed hand; the thing itself is the scene's to draw (the motion JSON says
  where the hand is).
- The build needs the Rive editor with a file open. On 15 Nov an export hung inside the editor once ("an export of
  this file is already in progress") and stayed hung until the editor was restarted; the scratch file ("Untitled",
  the most recent one under Recents; it holds the view model `Cast2D`) then has to be opened by hand: it cannot be
  opened through the editor's MCP endpoint.
