# Wunschzauber: B2 · Kapitel 9 (Konjunktiv II der Gegenwart)

An interactive scene for lesson 94, opened from the lesson page ("Zauberstab" in the hero, "Wünsch dir was!" card in
Verstehen). An evening meadow; Liv (the 3D character, `tools/liv3d`) holds a magic wand.

| File | What |
|---|---|
| `grammatik/zauberstab/index.html` | the page (header, sentence with gaps, caption, choice buttons, start card) |
| `grammatik/zauberstab/main.js` | the scene: sky, meadow, Liv, the wand, word orbs, sparkles, the swing, the learner's swipe, rounds, sound |
| `grammatik/zauberstab/visions.js` | the wish pictures: chosen by single keywords (fliegen → clouds and birds, umziehen/Geld → house, boxes, coins, Ausland/Urlaub/New York → skyline with a plane, Job → briefcase and star, Kino → cinema, rechtzeitig → clock; otherwise a star) |
| `grammatik/zauberstab/wishes.js` | verb facts only (Konjunktiv II, Präsens and Präteritum of 17 verbs) and `loadRounds(texts)` |
| `grammatik/grammatik.js` | `WERKSTATT[94]`: button, card, and the lesson's exercises are sent along with its texts |

## What happens

1. **So entsteht die Form** (up to 3 rounds): a Präteritum form the lesson shows (kam, war, hatte) floats in a ring of
   light; a swing turns it into the Konjunktiv II (käme), and the sentence box shows what changed: Umlaut, Endung -e.
2. **Wünsche** (up to 6 rounds): the lesson's own wenn-sentences, the Konjunktiv II forms as gaps. For each gap three
   word orbs float beside Liv: the right form and the Indikativ forms (hat / hatte, wird / wurde; for wollen and sollen a
   wrong Umlaut form). The right orb flies into the gap with sparkles; a wrong one fizzles, goes grey and drops, and the
   caption says why (Präsens = reality, Präteritum has no Umlaut …). A complete wish comes true: a stream of sparkles leaves the wand and a small
   picture of the wish grows where it struck (a skyline for a trip abroad, a cinema for Kino …); Liv floats up in a
   whirl of stars and cheers. Other correct versions from the lesson (ginge, kämen) are shown as "Auch richtig".

**Zuschauen**: Liv glances at the orbs and swings herself; now and then she takes the Indikativ first, to show the
mistake. **Selbst zaubern**: the learner swipes across an orb (her arm and the wand follow the pointer, sparkles trail
from the tip); tapping an orb, the buttons 1 · 2 · 3 or the keys 1 2 3 do the same. First-try score in the corner.
Sound is synthesized (swish, chime, fizzle, a rising arpeggio for a wish); "Ton aus" turns it off. Reduced motion:
smaller float, no pulsing gap.

## Loading

- The lesson page downloads Liv's model while the learner reads lesson 94 (about 2.5 s after the page, when the browser
  is idle; not with data saving or on 2G), so the scene usually finds it in the browser's cache. `window.DK_LIV_MODEL`
  in `index.html` is the one versioned address for the park and all Liv scenes; `openWerkstatt` passes its version as `?lv=`.
- The scene's `index.html` starts the model download and preloads every module (three.js minified, GLTFLoader,
  three-vrm, `tools/liv3d/*`) at once, instead of one import after another.
- Measured (14 Nov 2026), opened directly with an empty cache: before, the model request started 1.35 s after the
  scene's code and took 4.9 s for 2.84 MB; now it starts with the page and is 1.49 MB. Building Liv after the download
  takes 0.3 to 0.5 s.

## Lesson text stays private

`wishes.js` holds no sentence. The lesson page posts its texts (`werkstatt-ready` → `werkstatt-texts`, as for the
Kapitel 57 workshop) and `loadRounds` finds the wenn-sentences and the Präteritum/Konjunktiv II pairs there. Opened
directly the page says "Nicht verfügbar". Local testing: `.local/w94/` (git-ignored) plays the lesson page's part with
texts built at run time from the private lesson.

## Checked (14 Nov 2026)

With the chapter's real texts: 9 rounds (3 forms, 6 wishes). Pictures of a form round, a wish round in Zuschauen
(including the planned mistake and the float) and Selbst zaubern (a swipe across a wrong orb, then a tap on the right
one), at 1280 x 800 and at 375 x 812. Swipe hit detection, the fizzle explanation and the score were checked by
dispatching pointer events. Not tested: real phones and touch, Safari, sound by ear, the signed-in lesson page.
