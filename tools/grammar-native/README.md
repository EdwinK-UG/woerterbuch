# Native B2/C1 authoring

Use the existing A2/B1 lesson format: explanations, native tables, original SVG scenes, and submitted exercises. Never use source-page screenshots, table crops, a source-image workbook, or self-assessed answers as a substitute.

The provided source is *Grammatik aktiv B2–C1 – Üben, Hören, Sprechen* by Friederike Jin and Ute Voß. `source-index.json` records chapter levels and page ranges; `exercise-index.json` records the 499 original numbered exercise groups. These indexes contain metadata only. Audio recordings are excluded at the user's request.

## Authored checkpoint: source chapters 1–69

The native rebuild currently contains 90 B2/C1 units plus the irregular-verb reference and trainer (91 units total). It includes partner activities 1–7 and written drills 2–28. All numbered source exercise groups through chapter 69 have mappings: 394 of 499 across the complete source. The private verifier submits 4,546 question rows containing 5,444 answer points in 661 exercise groups. Mapping and successful grading do not substitute for linguistic review.

The latest additions cover adjective endings, comparison, participles, reported speech, temporal/causal/concessive/consecutive/conditional/modal clauses and infinitive constructions. Their illustrations are original, theme-aware SVGs; the dinner activity combines both partner versions and has five separately graded picture corrections. The practice-round selector has an explicit accessible name.

Remaining work: source chapters 70–88, partner activities 8–9, written drills 29–37 and references 180–186. This authored checkpoint is not a deployment receipt; release the matching private bundle and website together.

## Private authoring

Authored JSON lives in `.local/grammar-native/chapters/NNN-B2.json`, `NNN-C1.json`, or `NNN-Liste.json`. Lesson bodies and source extraction remain private and outside the public repository. Each concept needs a meaningful `scene` or an illustrated `scenes` block. Scene kinds are explicit: a missing kind throws instead of silently substituting unrelated artwork. Custom sentence diagrams use `tokens`; preposition-position diagrams use `rows`. Object exercise items can carry a `scene` and must also have a useful text prompt for accessibility and the quiz mode. Rebuild tables as `grid`, `conj`, or `reflist` blocks.

Every exercise must have a supported automatically graded type and a source mapping. Preserve intentionally incorrect source sentences in correction tasks. Check underlined text and tables against the rendered original: OCR frequently drops their words. Use the supplied answer key and explicitly encode valid alternatives. Constrain open-ended prompts enough to make marking fair while preserving every source scenario.

Long `type` tasks use editable text fields with `start`, `long`, and `rows`. Set `commas: true` when comma placement matters. `select` tasks require every correct option and reject extra choices. Native `fill` and `choice` exercises use `perGap`: every answer field contributes one point, including correct fields in a partly wrong sentence. Legacy exercises keep their existing scoring. Question counts in the coverage audit count rows; the verifier also reports the total number of answer points. `exercisePaging` displays trainers in short rounds without discarding answers or saved grades. The compiler enables it for native lessons with multiple exercise groups. Context in `before` stays inside its own round, so tables from other rounds remain hidden.

Partner activities live in `.local/grammar-native/partners/NNN.json`, with an original activity `id`, `targets` mapping level to authored lesson ID, and `understand` / `exercises` arrays. Optional `levels` limits a block or group to specific targets. The compiler appends fresh copies each build; originals and partner coverage are audited separately. Written partner prompts are adapted for submission, with optional paired practice; the source game format is not itself an online multiplayer implementation.

## Build and check

```sh
node tools/grammar-native/build.cjs
node tools/grammar-native/verify.cjs
node tools/build-course-catalog.cjs
node tools/version-assets.cjs
npm run check
```

Use Node 24. The private verifier submits each authored answer through the real rendering and grading code. It checks mechanics, not linguistic correctness: source review and desktop/mobile visual review are still required.

`build.cjs` writes private lesson files, authored coverage, and source-group mappings under `.local/grammar-native/`. A mapping is not proof of complete linguistic review. Only authored units enter the ready catalogue; unconverted chapters stay unavailable. Reference lists do not inflate grammar chapter counts. B2 vocabulary remains separate.

Before release, build and deploy the matching protected lesson bundle, then publish the website. A local catalogue change alone is not a release. Do not deploy the archived rejected source-image workbook.
