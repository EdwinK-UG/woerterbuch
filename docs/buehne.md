# Die Bühne: the shared stage for the animated grammar chapters

The runtime of the plan in `docs/grammar-animation-plan.md` (§1.5). It is built and checked with its first chapter,
**Kapitel 5 · Modalverben (*Die Klammer-Werkstatt*)**. Every later chapter adds a set, its scenes and a private lines
file, and reuses the rest.

| File | What it is |
|---|---|
| `grammatik/buehne/stage.js` | **M0, the stage.** The cast (all ten 2D Rive figures), loading and the Rive logo check, walk, gestures, faces and talking. The camera: wide framing per scene, close-ups on whoever speaks, a cut from one close-up to a far speaker or out of a close-up, and also vertical (`ty`). Lines and captions, two audio players with the iPhone unlock, and reading time for lines not yet recorded. Waits and tweens on a scene clock that pauses and aborts. Scene dots, pause, the start box, embedding (height, ✕, private cues by message) and test hooks. |
| `grammatik/buehne/stage.css` | The page: the picture at 16:9 (4:3 on phones), with captions, strip, tiles and answers below it. The site's case colours and grammar marks. Dark mode and reduced motion. |
| `grammatik/buehne/satzband.js` | **M1, the sentence strip.** Wagons with seat numbers. The verb engine at Position 2 is dark with a gold seat; the last wagon is dashed. The clamp joins them and clicks shut; a wrong order makes it slip. Wagons keep their id, so they ride to their new seats (*koche* becomes *kochen* and rides to the end). Long sentences shrink to fit a phone. **T, the tiles**, use the same strip: tap a tile, it rides into the next free wagon (or the one you picked); tap a wagon to send it back. Every tile is a button. Also here: **the vowel wheel** (*k[ö→a]nn*). In the film the strip rides inside the bubble; below the picture it is only used for the practice tiles. |
| `grammatik/buehne/practice.js` | **F and P, feedback and the practice format.** Three kinds of round: `order` (tiles), `choice` and `type`. The hint ladder: the reason and the machine's failure animation, then a hint (the clamp's two wagons fixed), then "Richtig ist …". Only first tries count. A `miss` hook lets the figures react. |
| `grammatik/buehne/sfx.js` | Small Web Audio sounds (click, roll, slip, pop, right, wrong); no files. |
| `grammatik/buehne/sets/werkstatt.js` | **Meister Anton's workshop** (Canvas 2D). Plank wall, window onto the village (its casements open), tool board, leaning planks, a door with a sign (its text comes from the scene), a workbench in front of whoever works behind it, a lamp with dust in its light. Used again in Kap 8, 13, 28, 51, 57. |
| `grammatik/buehne/blase.js` | **The bubble** (after the review of Kap 5, 22 Nov). A speech bubble (pointed tail) or thought bubble (dots), by whoever says an example sentence, holding three things together: a picture of what the sentence means, the modal verb's icon, and the **sentence strip itself** (the film's strip now lives in the picture, not below it). It sits above the head, or beside it when there is no room, keeps clear of the corner buttons, follows the speaker, closes when someone else speaks or the narrator's board opens, and can dock at the top of the picture. |
| `grammatik/buehne/tafel.js` | **The narrator's board** (after the second review, 22 Nov): an explanation is never only subtitles. When Elisa says a line that has a board in the private lines file (`boards[<line id>]`), a chalkboard opens at the top of the picture and fills in **in time with her voice**: each step names a word of her line and fires when it is said (its place in the line × the recording's progress). Items: the strip with wagons lit up and labelled (*Position 2*, *Ende · Infinitiv*) and the clamp closing, table rows appearing, cards, turning vowel wheels, a picture. Every explanation line of both pilots has one. |
| `grammatik/buehne/platz.js` | **Where explanations go.** Bubbles and boards stay big, but each time one appears (and every half second after) they try a few spots (a board: top left, middle, right; a bubble: above the head, shifted, beside it, or a top corner with a long tail) and take the one that covers the least of the characters and animals. The speaker's own figure counts double. Phones get a square picture (not 4:3), so there is room above the heads. |
| `grammatik/buehne/licht.js` | **The spotlight** on whoever speaks. The camera no longer zooms in and out on speakers (`S.zoom = false`; a new framing inside a scene is a cut, pans stay smooth): the picture dims a little except for a soft pool of light around the speaker, which glides to the next one, and comes back up when the narrator speaks. |
| `grammatik/buehne/bilder.js` | **The pictures of meaning**, animated in a 160 × 100 box: cooking soup, cooking together, repairing a chair, getting up at six, sawing, painting, no smoking, tidying up, opening the window, waiting for dinner, and for the practice no parking, no phones, dancing, helping, swimming, pancakes, cleaning, getting fit. `ICONS`: the modal verbs' signs (medal = können, ! = müssen, check / red bar = dürfen / nicht, target = wollen, speech = sollen, heart = möchten, ? = a question). |
| `grammatik/buehne/tiere.js` | **The animal kit and M2, the case rings.** The dog (gallop, wagging tail, flapping ear, tongue), Minka the tabby cat, a bouncing beach ball, a flock of birds, Max's backpack and camping things that fly into it. Animals walk and run on the set's ground like the figures; `raise` carries one (the ball in the dog's mouth). The rings: amber N and teal A ellipses with a letter badge, drawn half behind and half in front of whoever stands in them. |
| `grammatik/jagd/` | Kapitel 17 (Akkusativ), *Wer jagt wen?*, on the village meadow (`grammatik/dorf/village.js` as its set). 5 scenes, plus 10 practice rounds: **Regie** (3: the learner's sentence is acted out exactly as its articles say, so *Den Hund jagt der Ball* makes the ball chase the dog), *Max packt* (4, from u2) and *Doch, ich habe …* (3, from t1). The strip is in case mode (`createStrip(el, { cases: true })`). |
| `grammatik/klammer/` | Kapitel 5: six scenes (Klammer, Vokalrad, Ohne Endung, man, Fragen, Merksatz) and 11 practice rounds. The rounds are the chapter's own exercises: u2, u3, u5, u4, u6 and t1. |
| `.local/scenes/k05/lines.json` | **Private** (git-ignored): every line, strip, wheel, sign, card, reason and practice item. Public files hold no lesson text; `tests/buehne.test.cjs` checks this. |
| `.local/scenes/voices.json` | **Private**: the cast's ElevenLabs voices, shared by all chapters (copied from Im Dorf). |
| `tools/scene-audio.cjs` | Recording for any scene: `record k05`, `pack k05`, plus `library` / `add` / `samples` for choosing a voice. |

## Try it

```bash
python3 -m http.server 8798 --bind 127.0.0.1
```

Then open `http://localhost:8798/grammatik/klammer/index.html?local` (Kap 5) or `…/grammatik/jagd/index.html?local` (Kap 17).
- `&speed=2` runs the scene clock twice as fast (checks only).
- `&test` drives the clock by a timer.
- Hooks: `__klammer.watch(i)`, `__klammer.practise()`, `__klammer.S`, `__klammer.A`.

## Voices

All of Kapitel 5's 43 lines are recorded (22 Nov 2026). The cast's voices are in `.local/scenes/voices.json`. The
five new ones were found with `scout`, compared with `audition` (a listening page in `.local/scenes/audition/`), and
chosen by pitch, liveliness and how different they sound from the rest of the cast:

| Role | Voice (ElevenLabs Voice Library) | Why |
|---|---|---|
| Meister Anton | Christian Plasa – Soft and Mild (played at 0.95 speed) | a natural, warm conversational voice for dialogue |
| Frau Adler | Dana – Friendly and Fun | warm and trustworthy; the lowest of the women, so different from Huber, Lena and Elisa |
| Max | Albert – Cheerful, Playful and Fun | the highest, most boyish pitch; made for funny characters |
| Mia | Ela – Cheerful and Happy | clearly higher than Liv |
| Finn | Chris Beck – Witty, Energetic and Bright (played calmer) | young and bright, distinct from Albert |

ElevenLabs has no child voices: the children are young adult voices played livelier (`SETTINGS.kid`). To record a
chapter, put the key in the terminal (a hidden pop-up works), then:

```bash
export ELEVENLABS_API_KEY="$(osascript -e 'text returned of (display dialog "ElevenLabs key" default answer "" with hidden answer)')"
```

```bash
node tools/scene-audio.cjs record k05
```

## In the lesson (live since 22 Nov 2026)

Both pilots are entries in `WERKSTATT` in `grammatik/grammatik.js` (`inline: true, audio: true`), like Im Dorf:
a card in the chapter's "1 Verstehen" section with "Animation starten", and a button in the chapter header.
- **A1 · Kapitel 18** (shown number; internal id 5, address `#/g/5`), Modalverben: Formen und Satzklammer, section *Können, müssen, dürfen: Modalverben* → *Die Klammer-Werkstatt* (`grammatik/klammer/`)
- **A1 · Kapitel 13** (shown number; internal id 17, address `#/g/17`), Der Akkusativ: das direkte Objekt, section *Wer, wen, wem? Akkusativ und Dativ* → *Wer jagt wen?* (`grammatik/jagd/`)

The site numbers A1–B1 chapters in learning order (`A1B1_NO` in `grammatik/grammatik.js`); the ids used in code, files (`k05`, `k17`) and the Worker (`k5`, `k17`) are the internal ones.

Both are **hero** scenes (`hero: true`): the chapter page opens with a slim title and the scene under it, sized to the screen (no scrolling on a phone); the rest of the chapter follows below.

Their lines, boards, practice and recordings travel through the Worker's private film-audio route (R2 keys `k5/`,
`k17/`). To publish a change to a scene's private file or voices:

```bash
node tools/scene-audio.cjs pack k05
```

```bash
FILM_AUDIO_DIR=$PWD/.local/scenes/k05/upload node tools/upload-film-audio.cjs --remote
```

(The path must be absolute; the tool runs wrangler from `worker/`, which needs wrangler installed or linked there.)
The upload replaces that chapter's narration list, so a chapter that also has film narration would need both in one
manifest. Anton's figure (`a02.riv`) is published with the rest of the 2D cast in `tools/liv3d/models/cast/2d/`.

## Adding a chapter

1. A set in `grammatik/buehne/sets/` (or reuse one), with the interface `{ V, size, setCam, foot, draw }`.
2. A folder `grammatik/<scene>/` with `index.html` (copy Kap 5's) and `main.js`: `createStage({ set, priv, tag, keys, onCast, minW })`, the scenes, and the practice loop.
3. `.local/scenes/<tag>/lines.json`: lines, plus whatever the scene shows (strips, cards …) and `practice`.
4. Run `node --test tests/buehne.test.cjs`, and check desktop and a 375-px phone.

## Two languages (22 Nov 2026)

Each pilot has a German version and a **bilingual** one (`?lang=en`, switch **DE | EN** under the picture): the
narrator (Enniah, ElevenLabs Voice Library, a native German voice verified in English) explains in English with the
German woven in; the characters speak German with an English gloss under their line; buttons and feedback are
English. Private files: `.local/scenes/k05-en/`, `.local/scenes/k17-en/` (same scenes; the characters' recordings
are reused). Both languages of a chapter travel in one narration list: `node tools/scene-audio.cjs pack k05 k05-en`.

**Pronunciation rules for the bilingual narrator** (the owner's review: no German word in an English accent, no
English word in a German one):
1. German is marked in the line (`{de:…}` or the grammar marks) and always comes as a phrase of at least two words
   (*ich will*, not *will*; *man darf*, not *man*), because single words like *will* or *man* are English words too.
2. `tools/split-voice.cjs` records each English and each German run on its own, with the language enforced and
   without the other language as context, keeps the parts (`<clip>.parts/`) and joins them.
3. Every part is checked by speech recognition for its language (faster-whisper, `detect_language`; German part:
   German more likely than English and at least 50 %; English part: at least 60 %), and failed parts are recorded
   again (`node tools/split-voice.cjs redo <scene> <failed.json>`) until all pass.

## Feedback

**★ Feedback** in every pilot opens a form: stars for the German and for the English version (a version not yet
watched in this browser is marked, with a link to it), which one helps more, a box to write freely, and then one
folding section for each part of a scene: **Understanding** (where people got lost), **Pictures & animation** (ideas
for what to draw), **Practice** (making the exercises more fun), **Problems** and **What you liked**. Each section has
quick-tap chips ("Too fast", "Make it a game" …) that add their phrase to its text. The kind of device is added
(phone · iOS · Safari; nothing personal). It is sent to the Worker (`POST /scene-feedback`,
`worker/src/scene-feedback.js`) and stored in D1 (`scene_feedback`, migrations 0006 and 0007: columns `free`,
`understand`, `pictures`, `practice`, `bugs`, `good`) without names, accounts or IP addresses; one visitor can send
20 a day.

To read it all:

```bash
node tools/scene-feedback.cjs export
```

This writes `.local/feedback/scene-feedback-<date>.json` (every entry), `.csv` (spreadsheet) and `.md` (a summary to
read or to hand to an agent: stars per version, preferences, devices, then every text grouped by section). Add
`--since 2026-11-23` for only the newest.

## Announcement emails

Calls to test and new-feature emails are designs in `worker/src/announce.js`, picked in the founder's email composer
(Konto → Email users → Design) and previewed there as the real email before sending. The pilots' design is
`pilots`; the draft and how to send it: `.local/feedback/email-draft.md`. Artwork: `tools/mail/README.md`.

## Long versions

Each pilot can come in four versions: short or long (`?form=long`), each explained in German or in English with
German examples (`?lang=en`). The long version opens like a class: today's topic, why it matters in daily life, a
question that gets the learner thinking, then the rule in more detail and a recap that comes back to the opening.
The German and the English long scripts are written apart, not translated, and are staged differently (the German
one starts from a story, Liv planning her day; the English one from what English speakers already know: "I can
dance" against "Ich kann gut tanzen").

- Scripts: `.local/scenes/<scene>-long/script.mjs` and `.local/scenes/<scene>-en-long/script.mjs` (private) write
  that version's `lines.json`; run them after a change, then `node tools/scene-audio.cjs record <scene>-long`.
  Lines shared with the short film reuse its recordings.
- Staging as data: a long script carries `acts` (scenes) made of `beats`, played by `grammatik/buehne/regie.js`; a
  scene file passes its own verbs (Kap 18: merk, wheel, sign, window, sweep, saw; Kap 13: home, pet, move, dash,
  ring, ringsOff, lamps, lamp, chase, hop, mood, look, birds, bleat, band, carry, backHome).
- Openers so far: Kap 18 German – Liv plans her day (will schwimmen, muss putzen, kann tanzen); Kap 18 English – "I
  can dance" against "Ich kann richtig gut tanzen"; Kap 13 German – a coffee, a lost key, a dog (someone does
  something, something receives it); Kap 13 English – "I see him", never "I see he", and word order against articles.
- Boards (`tafel.js`) also take `{ cards: [{ pic, icon, t, at }] }`: picture cards with a caption, or the modal
  verbs' icons with their meaning, appearing word by word.
- The switch under the film: DE | EN and Kurz | Lang (`start({ long: true })`); the feedback form rates every
  version this browser has watched (`de`, `en`, `de-long`, `en-long`).
- One chapter's narration list holds all its versions: `node tools/scene-audio.cjs pack k05 k05-en k05-long k05-en-long`
  (Kap 13: `pack k17 k17-en k17-long k17-en-long`), then `FILM_AUDIO_DIR=<abs>/.local/scenes/k05/upload node
  tools/upload-film-audio.cjs --remote --only 5` (needs wrangler in `worker/node_modules`).
- Local testing: the dev server in `.claude/launch.json` needs a long connection queue (`request_queue_size`), or
  Chrome's many parallel module requests get reset and the scene never starts.
