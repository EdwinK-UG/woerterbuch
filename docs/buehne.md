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
| `grammatik/buehne/baked.js` | **The baked assets** (`assets/scene/`, `docs/scene-assets.md`): sets, animals, birds, the backpack, things, pictures of meaning and icons drawn from images and manifests, as the apps draw them. The sets, `tiere.js`, `blase.js` and `tafel.js` use it and fall back to their own Canvas drawing for any frame whose image has not loaded yet. Re-bake after a drawing change: `node tools/bake-scene-assets.cjs`. |
| `grammatik/buehne/szene.js`, `regie.js` | **The player of scene format v1** (`docs/scene-format.md`, since 24 Nov 2026): a scene is one data file per version (set, cast, animals, acts of beats in a closed vocabulary, practice and its staging); `szene.js` builds the scene and runs the practice, `regie.js` runs the steps. The pilot pages only call `playScene({ base, set, cast })`; the iOS and Android apps play the same files. `tools/scene-compile.mjs` turns an author's script (with shortcuts) into v1; `tests/scene-format.test.cjs` checks every file. |
| `grammatik/buehne/requisiten.js` | **Props, the tape, dimming and ghosts** (26 Nov 2026, for the B2–C1 films): baked things (and words on planks or cards) placed, carried by a person, moving by themselves, glowing, toned sepia / gray / ghost; a word that is shaved, stamped, flipped or grows into another; a measuring tape as a timeline on the floor; the picture darkening; a person fading to a glowing outline. One canvas above the set's front. Steps `prop`, `move`, `morph`, `tape`, `dim`, `ghost` (`docs/scene-format.md`). Since the Konjunktiv II film (k97) also: pictures of meaning floating in bubbles (`pic`), words on stone, the tone `wish` (lilac, twinkling), props bursting into glitter (`pop`), people riding a prop (`ride`), rain (`rain`, also rising backwards) and a tone for the whole picture (`tint`: sepia, or a lilac "what if"). Since the Nominalstil film (k482): a word that folds into another like a paper fan (`fold`) and a picture bubble that flips to another picture (`morph` on a `pic`). Since the Futur II film (k439): guesses (the tone `guess`, turned into facts by `sure`), words on a finish flag (`flag`) or as an empty glowing slot (`slot`, width `w`), a cork that pops off a word (`cork`), the tint `future`, and the tape as a glowing time band (`look: "band"`, with `now`, flag marks, an arc looking back). |
| `grammatik/buehne/sets/see.js` | **The lake** (k97): a stream with a footbridge (it can be rubbed out: `bridge`), the boathouse with its canopy, clock (`clock`) and door (`door`), a jetty, open water, the island's beach with a pavilion; grey or sunny (`sun`). Baked like the other sets. |
| `grammatik/passiv/` | B2 · id 99 (Passiv), *Die Werkstatt der unsichtbaren Hände*: Anton, Lena, Frau Huber in the workshop; 11 acts and 10 practice rounds, four of them acted out. Private source `.local/scenes/k99-long/` (`staging.mjs` shared by every language, `script.mjs` German). Hero film of the chapter page `#/g/99` (B2 · Kapitel 14, `WERKSTATT` in `grammatik/grammatik.js`) since 27 Nov 2026, German and English, feedback key `k99`. |
| `grammatik/konjunktiv/` | B2 · id 97 (Konjunktiv II: Wünsche und irreale Bedingungen), *Wunschblasen am See*: Lena and Opa Sepp miss the ferry to a party on the island; wishes appear as lilac bubbles and pop when reality returns. 10 acts and 10 practice rounds (wish bubbles that glow or pop; the wings are acted out). Private source `.local/scenes/k97-long/` (`staging.mjs` shared by every language, `script.mjs` German). Hero film of `#/g/97` (B2 · Kapitel 12) since 27 Nov 2026, German and English, feedback key `k97`. |
| `grammatik/buehne/sets/wohnung.js` | **Lena's flat** (k439): an empty Altbau flat on moving day: two tall windows onto the street (it can be wet after the rain: `wet`, or evening: `eve`), a tiled stove, the front door to the landing (`door`), the big window's casements (`win`), and the finished flat fading in (`done`: curtains, pictures, a rug, a sofa, the lamp). Baked like the other sets. |
| `grammatik/buehne/sets/redaktion.js` | **The newsroom** (k482): the local paper's office just before the deadline: a window onto the roofs, a glass door (`door`), a wall clock (`clock`, minutes), a big screen on a low stand with tomorrow's front page and its narrow empty column that fills with print (`page`), an old printing press at the back that rattles and prints (`press`), Lena's desk in front. Baked like the other sets. |
| `grammatik/nominalstil/` | C1 · id 482 (Nominalstil: Verben werden zu Nomen), *Die Spalte ist zu schmal*: Lena's news items are too wide for the column; Frau Adler's red pen folds verbs into nouns (morph fx `fold`), case badges flip, whole sentences shrink into noun phrases that drop into the column; a portrait flips between two meanings (a picture bubble's `morph`); a heavy letter from the town hall hangs with noun weights. 10 acts, 10 practice rounds (each right answer folds a news item into the column). Private source `.local/scenes/k482-long/` (`staging.mjs` shared by every language, `script.mjs` German). Hero film of `#/g/482` (C1 · Kapitel 82) since 27 Nov 2026, German and English, feedback key `k482`. |
| `grammatik/futur2/` | C1 · id 439 (Futur II: Vermutungen über Vergangenes und Abschlüsse in der Zukunft), *Lenas Umzug auf dem Zeitband*: in Antons Werkstatt and in Lena's new flat (the first film in two places: an act's `set`); a glowing time band on the floor; guesses as see-through bubbles with a "?" that fill in when they come true (`sure`); the camera flies to Friday and looks back. 10 acts, 10 practice rounds (each right answer unpacks a box). Private source `.local/scenes/k439-long/` (`staging.mjs` shared by every language, `script.mjs` German). Hero film of `#/g/439` (C1 · Kapitel 39) since 27 Nov 2026, German and English, feedback key `k439`. |
| `tools/scene-frames.cjs` | **Contact sheet** of any v1 scene, headless: a frame near the end of every line, plus how much the board and bubble cover the people's faces and which board steps are still waiting. `node tools/scene-frames.cjs "http://localhost:8798/grammatik/passiv/index.html?local" .local/scenes/k99-long/frames [--phone] [--sound]` (needs Node 22+). |
| `grammatik/jagd/` | Kapitel 17 (Akkusativ), *Wer jagt wen?*, on the village meadow (`grammatik/dorf/village.js` as its set). 5 scenes, plus 10 practice rounds: **Regie** (3: the learner's sentence is acted out exactly as its articles say, so *Den Hund jagt der Ball* makes the ball chase the dog), *Max packt* (4, from u2) and *Doch, ich habe …* (3, from t1). The strip is in case mode (`createStrip(el, { cases: true })`). |
| `grammatik/klammer/` | Kapitel 5: six scenes (Klammer, Vokalrad, Ohne Endung, man, Fragen, Merksatz) and 11 practice rounds. The rounds are the chapter's own exercises: u2, u3, u5, u4, u6 and t1. |
| `.local/scenes/k05-long/lines.json` (and `-en-long`, `-sw-long`, `-fr-long`) | **Private** (git-ignored): every line, strip, wheel, sign, card, reason and practice item. Public files hold no lesson text; `tests/buehne.test.cjs` checks this. |
| `.local/scenes/voices.json` | **Private**: the cast's ElevenLabs voices, shared by all chapters (copied from Im Dorf). |
| `tools/scene-audio.cjs` | Recording for any scene: `record k05-long`, `pack k05-long …`, plus `library` / `add` / `samples` for choosing a voice. |

## Try it

```bash
python3 -m http.server 8798 --bind 127.0.0.1
```

Then open `http://localhost:8798/grammatik/klammer/index.html?local` (Kap 5), `…/grammatik/jagd/index.html?local` (Kap 17) `…/grammatik/passiv/index.html?local` (B2 · Passiv, k99) `…/grammatik/konjunktiv/index.html?local` (B2 · Konjunktiv II, k97) `…/grammatik/futur2/index.html?local` (C1 · Futur II, k439) or `…/grammatik/nominalstil/index.html?local` (C1 · Nominalstil, k482).
- `&speed=2` runs the scene clock twice as fast (checks only).
- `&test` drives the clock by a timer.
- Hooks: `__klammer.watch(i)`, `__klammer.practise()`, `__klammer.S`, `__klammer.A`.

## Voices

All of Kapitel 5's 43 lines are recorded (22 Nov 2026). The cast's voices are in `.local/scenes/voices.json`. The
five new ones were found with `scout`, compared with `audition` (a listening page in `.local/scenes/audition/`), and
chosen by pitch, liveliness and how different they sound from the rest of the cast:

| Role | Voice (ElevenLabs Voice Library) | Why |
|---|---|---|
| Narrator (role `elisa`, German) | Otto – Casual and Normal (since 24 Nov 2026, speed 1.0; before: Elisa) | the owner's choice for a lighter, still teacherly narrator at a natural pace, mid-low pitch; the German caption says *Erzähler* (`.local/scenes/audition/narrator-2026-11.md`) |
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

Short character lines (three words or fewer: *Super!*, *Genau!*, *Oh nein!*) are recorded with German enforced
(`eleven_turbo_v2_5` + `language_code: "de"`): on their own, the multilingual model read words both languages share the
English way (Liv's *Super!* with an English hissing s, Anton's *Klick! Perfekt.* as "Click, perfect"). Check a take by
its first 100 ms: German *Super* starts with a voiced z (strong energy below 400 Hz), English with a hiss.

## In the lesson (live since 22 Nov 2026)

Both pilots are entries in `WERKSTATT` in `grammatik/grammatik.js` (`inline: true, audio: true`), like Im Dorf:
a card in the chapter's "1 Verstehen" section with "Animation starten", and a button in the chapter header.
- **A1 · Kapitel 18** (shown number; internal id 5, address `#/g/5`), Modalverben: Formen und Satzklammer, section *Können, müssen, dürfen: Modalverben* → *Die Klammer-Werkstatt* (`grammatik/klammer/`)
- **A1 · Kapitel 13** (shown number; internal id 17, address `#/g/17`), Der Akkusativ: das direkte Objekt, section *Wer, wen, wem? Akkusativ und Dativ* → *Wer jagt wen?* (`grammatik/jagd/`)

The site numbers A1–B1 chapters in learning order (`A1B1_NO` in `grammatik/grammatik.js`); the ids used in code, files (`k05`, `k17`) and the Worker (`k5`, `k17`) are the internal ones.

Both are **hero** scenes (`hero: true`): the chapter page opens with a slim title and the scene under it, sized to the screen (no scrolling on a phone); the rest of the chapter follows below. The frame is as tall as the screen under the site's sticky header (300–920 px); starting the film or the practice sends `werkstatt-focus` and the page scrolls the whole frame into view. **The practice stays on one screen with the picture** (the owner: you play while you watch the animals act): in a frame at least 3:2 wide (a laptop window, full screen, a phone on its side) the exercise is a column beside the picture; in a taller frame (a phone) a compact panel under it, the film button and the switches sharing one row. The check button sits beside the tiles, the verdict takes the place of the instructions, the sentence strip shrinks its words until it fits, and in a very short frame (≤ 360 px) the spoken caption and the general instruction give way. Nothing in the panel is ever squeezed (`#panel > * { flex-shrink: 0 }`): a squeezed caption ran over the task. In the practice of *Wer jagt wen?* the camera centres on the cat, Max, the dog and the ball (`PBASE`), as the picture is narrower there.

Their lines, boards, practice and recordings travel through the Worker's private film-audio route (R2 keys `k5/`,
`k17/`). To publish a change to a scene's private file or voices:

```bash
node tools/scene-audio.cjs pack k05-long k05-en-long k05-sw-long k05-fr-long
```

```bash
FILM_AUDIO_DIR=$PWD/.local/scenes/k05-long/upload node tools/upload-film-audio.cjs --remote --only 5
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
narrator (Katja since 25 Nov 2026, an Azure German voice; until then Enniah) explains in English with the
German woven in; the characters speak German with an English gloss under their line; buttons and feedback are
English. Private files: `.local/scenes/k05-en-long/`, `.local/scenes/k17-en-long/` (the characters' recordings are
reused). All languages of a chapter travel in one narration list (see Long versions).

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

**Since 24 Nov 2026 each pilot has only its long version**, explained in German, English, Swahili or French
(`?lang=`). The short versions are archived: code in git tag `archive/short-pilots-k5-k17`, private lines and
recordings in `.local/release-backups/20261124-short-pilots-k5-k17/` (README there). The long version opens like a class: today's topic, why it matters in daily life, a
question that gets the learner thinking, then the rule in more detail and a recap that comes back to the opening.
The German and the English long scripts are written apart, not translated, and are staged differently (the German
one starts from a story, Liv planning her day; the English one from what English speakers already know: "I can
dance" against "Ich kann gut tanzen").

- Scripts: `.local/scenes/<scene>-long/script.mjs` and `.local/scenes/<scene>-en-long/script.mjs` (private) write
  that version's `lines.json`; run them after a change, then `node tools/scene-audio.cjs record <scene>-long`.
  Lines it once shared with the short film are frozen in `base.json` and `base/audio/` in the same folder.
- Staging as data: a long script carries `acts` (scenes) made of `beats` and may use shortcuts (`saw`, `home`, `carry`,
  `sign`, `band` …); at its end it runs `tools/scene-compile.mjs`, which writes scene format v1 (`docs/scene-format.md`):
  beats as ordered lists of single-key steps from one closed vocabulary, played by `grammatik/buehne/regie.js` and the apps.
- Openers so far: Kap 18 German – Liv plans her day (will schwimmen, muss putzen, kann tanzen); Kap 18 English – "I
  can dance" against "Ich kann richtig gut tanzen"; Kap 13 German – a coffee, a lost key, a dog (someone does
  something, something receives it); Kap 13 English – "I see him", never "I see he", and word order against articles.
- Boards (`tafel.js`) also take `{ cards: [{ pic, icon, t, at }] }`: picture cards with a caption, or the modal
  verbs' icons with their meaning, appearing word by word.
- The switch under the film: DE | EN | SW | FR; the feedback form rates every version this browser has watched
  (`de-long`, `en-long`, `sw-long`, `fr-long`; the old short ratings stay in their own columns).
- One chapter's narration list holds all its versions: `node tools/scene-audio.cjs pack k05-long k05-en-long k05-sw-long
  k05-fr-long` (Kap 13: the same with `k17`), then `FILM_AUDIO_DIR=<abs>/.local/scenes/k05-long/upload node
  tools/upload-film-audio.cjs --remote --only 5` (needs wrangler in `worker/node_modules`). The upload replaces the
  chapter's list, so the archived short cues leave the live list with it.
- Local testing: the dev server in `.claude/launch.json` needs a long connection queue (`request_queue_size`), or
  Chrome's many parallel module requests get reset and the scene never starts.

## Swahili and French (22 Nov 2026)

Both pilots also explain in **Kenyan Swahili** (`?lang=sw`) and **standard French** (`?lang=fr`),
with the German examples and the characters' German lines unchanged (their recordings are reused) and a gloss under
each character line in the new language. The switch under the film reads **DE | EN | SW | FR**; in a narrow practice
panel (a phone, or the column beside the picture) only the language in use shows, and tapping it opens the others,
so the picture keeps its size. Buttons, feedback and practice hints are in the version's language (`UI`, `SW` in
`stage.js`; `TXT`, `PARTS` in `meinung.js`).

- **Voices since 25 Nov 2026** (the owner's choice: *a German teaching German*, German voices from Azure;
  `.local/scenes/audition/narrators-azure-2026-11.md`): English **Katja** (`azure:de-DE-KatjaNeural`, German only, so
  she reads English with a German accent), French **Florian** (`azure:de-DE-FlorianMultilingualNeural:tagged`, the
  French parts tagged `fr-FR`), Swahili still Mohammed (ElevenLabs), whose German examples are now spoken by Katja.
  An Azure narrator speaks a whole line in one SSML request, the `{de:…}` runs in `<lang xml:lang='de-DE'>`
  (`tools/azure-tts.cjs`; key in `.env.azure`). German narrator: Otto (ElevenLabs). Labels: *Narrator*, *Narrateur*.
  Checking a whole Azure line: `node .local/scenes/lang/scribe-lines.cjs <scene>…` (Scribe detects the languages;
  share of German and of own-language words heard; `--lang de --only e11,e16` to hear given lines as German). Local
  Whisper is no use on these mixed lines: forced to one language it translates the other. The Swahili parts are
  still checked one by one (`scribe.cjs`, faster-whisper for the German parts) and redone with `split-voice.cjs redo`.
  The paragraph below is the history.
- **Voices until 24 Nov.** French: Victoria (ElevenLabs Voice Library, standard Parisian French, verified in French and German),
  on `eleven_turbo_v2_5` like English, one voice for both languages, each run recorded alone with its language
  enforced (on `eleven_v4` her short German phrases, *den Ball*, *du kannst*, were heard as English: 2 of 10 takes
  passed the check, against 8 of 10 on Turbo). Swahili is a
  **duet**: Mohammed ("Swahili Local", a native Swahili voice in the owner's account; Swahili needs `eleven_v3`)
  explains, and every German example is spoken by Enniah, the native German narrator of the English version
  (`eleven_turbo_v2_5`, German enforced), the parts brought to the same loudness with a short pause between the two
  speakers. Mohammed's own German was tried and came out with an English accent on short phrases. Voices:
  `narrator-sw`, `narrator-fr` in `.local/scenes/voices.json`; models and the duet in `NARRATOR`
  (`tools/split-voice.cjs`).
- **Scripts** (private): `.local/scenes/lang/texts_k05.py` and `texts_k17.py` hold the narration, written for each
  language (the English comparisons became Swahili and French ones: *ninaweza kucheza* and *je peux danser*,
  *ni-na-mw-ona* and *je le vois*, Swahili school terms *kiima* and *yambwa*, French *on* for *man*), plus every
  board, hint and gloss. Then:

```bash
python3 .local/scenes/lang/texts.py
```

```bash
node .local/scenes/lang/make.cjs --missing
```

  `make.cjs` builds `<scene>-sw-long` and `<scene>-fr-long` from the English long version (same
  scenes, staging and practice), copies the characters' recordings, keeps a recording whose line did not change,
  and lists any text without a translation and any board timing it had to guess.
- **Recording and checks.** `node tools/scene-audio.cjs record k05-sw` (and the other seven). German parts are
  checked with faster-whisper as before; Swahili and French parts with ElevenLabs speech-to-text
  (`node .local/scenes/lang/scribe.cjs <scene>…`), as the local model cannot judge short Swahili. A German example
  always comes as a phrase of two words or more, and a run of the explaining language between two German phrases has
  at least two words (*na pia*, *et aussi*), so the duet does not switch speakers every half second.
- **Packing.** One chapter's narration list holds all four versions:
  `node tools/scene-audio.cjs pack k05-long k05-en-long k05-sw-long k05-fr-long`.
- **Feedback.** Stars for every version (`sw-long`, `fr-long`), stored in the columns of migration 0008.

## Redesign of the play-along (22 Nov 2026)

A second agent reviewed the pilots (`.local/redesign/review.md`, with screenshots) and redesigned the look and the
practice without touching lesson content; merged the same day. The practice is a **play dock**: a fixed-height
panel under the picture on a phone (320 px; 264 for choices, 304 for typing) and a floating card beside it when the
frame is wide, so feedback never resizes the picture. Above it, quiet progress dots (`#round`); at the end, a calm
finish state (`.finished`) with the existing caption and score. Tiles, wagons and buttons are at least 40–44 px;
the pilots use the brand colours (paper, ink, blue) and SVG corner icons. The sentence strip in the practice keeps
16 px and wraps rather than shrink far, but first shrinks to at most 80 % to stay on one line, so the clamp can join
the modal verb and the infinitive over it (`fit()` in `satzband.js`). With four explaining languages a narrow dock
shows only the language in use; tapping it opens the others in place of the film button. On a chapter page, a short
landscape screen hides the site's tab bar so the frame fits under the header.
