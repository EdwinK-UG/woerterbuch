# Grammar stage for the B2/C1 films

The films keep their original narration, scene and cue IDs, authored timing, examples and quizzes. A **private visual overlay** adds the grammar stage: real words of checked lesson examples that move into labelled positions, change role, merge or split where the source does, with brackets, arrows and timelines. Scenes without an overlay keep the classic picture. The overlay never contains narration, timing, quiz payload or example text.

## Pieces

| Part | Public? | What it does |
|---|---|---|
| `grammatik/film-stage.js` | yes (generic code) | Pure SVG renderer. The picture at time *t* is a function of the scene's keyframes and *t*; nothing accumulates, so seek, replay and resize always agree. Phrase-aware reflow at the real stage width, minimum 11 px labels, arrows routed around words, one bracket segment per wrapped line, text alternative for every state. |
| `grammatik/film.js` | yes | The existing player. With `opt.visual` and `opt.lesson` it draws covered scenes with the stage, uses the audited decoded 48 kHz length of a recording when the MP3 hash in its link matches, guards stale audio callbacks, pauses for checks and returns to the same picture. |
| `grammatik/grammatik.js` | yes | Receives `GRAM.filmVisual(n, …)` from the protected lesson response and passes it to the player. |
| `tools/film-visual.cjs` + `tools/film-visual-kit.cjs` | yes | Builds and validates overlays from private authoring modules. |
| `tools/film-integrity.cjs` | yes | Full 114-film narration baseline and checker (folder or bundle mode). |
| `tools/film-review-server.cjs`, `prototypes/film/review.html`, `prototypes/film/sheet.html` | yes, local only | Loopback review with the frozen lessons, overlays and original MP3s, read in place. |
| Authoring modules, built overlays, baseline, captures | **no** | Kept outside the repository with the other protected lesson material. |

## Build, check, review

```sh
node tools/film-visual.cjs --lessons /ABS/complete-lessons --authoring /ABS/authoring --audit /ABS/audio-audit.json --out /ABS/built
node tools/film-integrity.cjs baseline --lessons /ABS/complete-lessons --out /ABS/film-baseline.json
node tools/film-integrity.cjs check --baseline /ABS/film-baseline.json --lessons /ABS/complete-lessons
node tools/film-review-server.cjs --lessons /ABS/complete-lessons --visual /ABS/built --audio /ABS/film-audio-final --port 8790
```

The overlay builder re-reads every example from the frozen lesson and keeps only its path, offsets, length and hash. A row marked as a complete sentence must render exactly that source example, punctuation included; anything unfinished must be a dashed rail or a word list. Unknown cues, partial scene coverage, forbidden payload keys and non-increasing keyframe fractions fail the build.

## Release (separate step, not part of a push)

```sh
LESSON_SOURCE_DIR=/ABS/complete-lessons FILM_VISUAL_DIR=/ABS/built npm run lessons:bundle
node tools/film-integrity.cjs check --baseline /ABS/film-baseline.json --bundle .local/lesson-bundle/lessons.json
```

Each overlay is appended after the unchanged lesson source as one `GRAM.filmVisual(n, …)` call, and only when it was built from exactly that lesson file. The bundle check confirms every lesson still starts with its frozen file byte for byte. Deploy the bundle with the existing `lessons` function, JWT verification on. No database, Worker or audio change is needed.

## Rollback

- Per scene: if a lesson text no longer matches an overlay key, or a scene fails to render, that scene shows the classic picture automatically.
- Per release: rebuild the bundle without `FILM_VISUAL_DIR` (or without a film's `k<n>.visual.json`) and redeploy; all films return to the classic pictures. The renderer code can stay.
- Code: revert the feature commits; the classic renderer path is unchanged.

## Timing and listening

Keyframes sit at fractions of each cue. With a matching recording the cue length is the audited decoded length; silent films use the authored seconds as a deterministic visual clock. The fractions are estimates from the sentence structure, not word timestamps: a listening pass should nudge them where a move should land on a spoken word. Only the private authoring changes; narration and audio stay untouched.
