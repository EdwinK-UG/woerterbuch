# Liv as a 3D character: the model brief

Goal: one reusable, rigged, toon-shaded 3D model of Liv in the VRM format (`liv.vrm`), driven by the player in `tools/liv3d/`
(Three.js + three-vrm). The same file is used in every scene, from every camera angle, with walk, run, gestures, ten
expressions, looking around and hair and skirt physics. The look is the painted Liv as closely as a stylized 3D model allows.

## Who she is (from `docs/liv-character.md` and the art pack in `tools/liv/rive/views/*.png`)

A girl of about nine, small and compact (head large for the body, about 5.5 heads tall), warm peach skin with a light blush and a few
freckles, big dark-brown eyes, a short wavy dark-brown bob with a fringe and one loose curl on top. She wears a cream blouse with
short puffed sleeves and turned-up cuffs, a red laced bodice, a red knee-length dirndl skirt with a cream apron, cream ribbed knee
socks, brown lace-up boots, and a tan satchel across the body (the player attaches the satchel; it does not need to be in the model).
She is always fully dressed. She does not speak, so no mouth shapes beyond a few expressions are needed.

| Part | Colour (eyedrop the exact values from the pictures) |
|---|---|
| skin | `#fdc28d`, shade `#f0a56e` |
| outline | `#3a1c0c` (thin, even) |
| hair | dark brown `#4a2313` with warm highlights |
| bodice and skirt | red `#be3b22` |
| blouse, apron, socks | cream `#f6e6c8` |
| boots, laces | brown `#7a4a26`, laces tan `#e0a74a` |
| satchel | tan `#e69d43` |

## How to make it (free, no 3D skills needed)

1. Install **VRoid Studio** (free, pixiv; vroid.com). Start a new female character.
2. Body: the smallest height; shorten the legs and arms and enlarge the head so she reads as a child (about 5 to 6 heads tall); small
   chest, rounded face, large eyes, small nose and mouth. Keep the default skeleton (humanoid). Hands with all five fingers.
3. Hair: a short wavy bob with a fringe; dark brown. Leave physics (spring bones) ON for hair and skirt.
4. Clothes: the dress base with a red skirt and a cream apron panel (paint it in the texture editor), a cream puff-sleeve blouse under a
   red bodice with lacing painted on, cream ribbed socks, brown lace-up boots. Use the texture editor for the apron, lacing and the
   freckles; keep the outline on.
5. Face: use the expression presets (happy, sad, surprised, angry, blink and the vowels); keep look-up/down/left/right on the eyes.
6. Export as **VRM 1.0**: texture size 2048 or smaller, keep the toon outline and spring bones, license "Allow everyone: use in
   education and commercial projects", and name the file `liv.vrm`. Expected size 5 to 20 MB.

Anything the model cannot do (the satchel, the dirndl details) the player can add on top; do not fight the tool for it.

## How we check it (acceptance)

Put `liv.vrm` in `tools/liv3d/models/` (that folder is not committed). The demo page shows her in all five directions, walking,
running, waving, pointing, thumbs up, cheering, crouching, with the ten expressions, looking left, right, up and down, and with hair
and skirt moving. We compare side by side with the painted Liv and fix proportions, colours and textures from there.

## Other ways to get the model

If you have an artist or a 3D tool (Blender, Maya) instead: any humanoid glTF / VRM with a standard skeleton works; a VRM brings
expressions, look-at and spring bones for free. An image-to-3D service followed by an auto-rigger also works for a first test but
usually gives stiff hair, clothes and hands.
