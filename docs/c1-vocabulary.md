# C1 Wortwelten: editorial and release handoff

The C1 vocabulary routes 261–273 use a new native renderer. Other vocabulary levels, authored grammar films, account permissions and the existing spaced-repetition scheduler remain on their existing paths.

## Content and teaching

The supplied *Deutsch intensiv Wortschatz C1* word list contains 1,270 extracted source rows across 13 chapters. Three exact duplicate rows are consolidated, while `(un)verdaulich` becomes two cards: 1,268 teaching entries. Original row IDs, PDF pages, raw spellings and duplicate occurrences remain in the private JSON for audit. Every teaching entry is included in both meaning and context practice, in short rounds of up to eight words.

Meanings are sense-specific English glosses. German examples are attested quotations, dictionary examples, collocations or headings, with source URLs and credits. They are not newly generated German sentences. English translations without a separate translation credit are editorial translations. Ellipses indicate shortened excerpts. Corpus submissions require normal editorial judgement; a source link alone does not certify correctness. Medical, legal and political quotations are language examples, sometimes dated, rather than advice or the app's endorsement. Incorrect articles for *Schwermut* and *Karies* and the salary plural *Gehälter* are corrected in the teaching data, retaining the original source text for comparison.

Illustrations are original lightweight SVGs rendered locally. Concrete objects and contrast diagrams take priority; abstract terms use conceptual diagrams. They support a meaning, and are not a substitute for the written definition. School theme colours are inherited. Illustrations are static and reduced-motion-safe.

Learners discover a compact illustrated catalogue, open examples on demand, select any subset or the whole chapter for flashcards, and add words to games with one click. Flashcards preserve phrases and examples instead of depending on dictionary IDs, use the normal account deck storage, and are scheduled by the existing scheduler. New IDs are namespaced as `@c1/…`. Incorrect answers and skips earn no points; only completed rounds are recorded. Cloze answers use exact attested surface forms. If a safe cloze cannot be made, practice uses a meaning-to-German choice instead.

Retrieval and spaced practice follow the general evidence in [Karpicke & Roediger (2008)](https://doi.org/10.1126/science.1152408) and [Dunlosky et al. (2013)](https://doi.org/10.1177/1529100612453266). This does not claim that one exact schedule or every illustration has been experimentally validated.

## Private data

The authoritative reviewed input is `.local/c1-vocabulary/editorial.json`, with editorial records under `.local/c1-vocabulary/editorial/`. It is deliberately ignored by Git, as are all existing private lessons. Do not put full private lessons or the PDF in the public repository.

`.local/lessons` can be a symlink to another checkout. Do not write through it. This task's independent complete archive is `.local/c1-vocabulary/complete-lessons/`; only its thirteen C1 vocabulary files replace the baseline archive's lessons.

Use Node 24. From the review checkout:

```sh
node tools/build-c1-vocabulary.cjs
```

Copy the thirteen generated `k261.js` through `k273.js` into the independent complete archive, then build metadata and validate using that archive explicitly:

```sh
LESSON_SOURCE_DIR="$PWD/.local/c1-vocabulary/complete-lessons" npm run assets
LESSON_SOURCE_DIR="$PWD/.local/c1-vocabulary/complete-lessons" npm run check
LESSON_SOURCE_DIR="$PWD/.local/c1-vocabulary/complete-lessons" npm run lessons:bundle
```

The bundle command writes only `.local/lesson-bundle/lessons.json`. It does not upload lessons or deploy anything. Publishing requires the existing authenticated private-lesson deployment process and the site deployment together; committing the public renderer alone does not update private lesson content. The local offline preview has no account connection and does not prove production persistence or deployment.

## Public changes to review

- `grammatik/vocabulary.js`, `vocabulary-art.js`, `vocabulary.css`: catalogue, selection, detail cards, grading and original illustrations.
- `grammatik/grammatik.js`: authenticated native-lesson rendering and selected-word game bridge.
- `index.html`: lazy assets, native-card deck/scheduler integration and games.
- `tools/build-c1-vocabulary.cjs`, `tools/version-assets.cjs`: offline content build and asset versions.
- `grammatik/catalog.js`, `release.js`: regenerated metadata.
- `tests/vocabulary-studio.test.cjs`: selection, game isolation, actual scoring, attested answers, safe rendering, scheduler persistence and all-source coverage.

Commit: `feat(vocabulary): rebuild all C1 chapters as illustrated word worlds`. Private sources and the generated lesson bundle stay outside Git.

The branch was updated with `origin/main` at `61915a4` before the C1 commit. The asset command now also regenerates the public course pages from the catalogue. The thirteen C1 public summaries in `content/public-pages.json` describe this rebuilt content; no new chapter IDs were added.

After integrating main, `content/public-pages.json` and its generated C1 pages under `lernen/wortschatz/` are also part of the vocabulary change. The updated full check passed 110 site tests and 14 Worker tests, including all public-page, sitemap and freshness checks. Deployment must publish both the protected lesson bundle and the public site, then verify the deployed hashes and access restrictions.
