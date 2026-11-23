# B2–C1 grammar rebuild

The 114 B2–C1 lessons (88 book chapters, split by level into B2 and C1 lessons), the 9 partner activities and the 8 reference lists (180–187) are rebuilt to the depth, coverage and quantity of *Grammatik aktiv B2–C1*, with every explanation, example, exercise item, reading text, title, instruction and picture caption newly written. The book is used only as a measure: chapter for chapter, every rule, table and tip is covered, and every numbered exercise, Training drill and partner prompt has a graded counterpart with at least as many items and answer points as the book and as the lesson it replaced. Lesson ids, levels and exercise ids are unchanged, so saved results, assignments and links keep working. This folder holds tools only; lesson bodies, the book extraction and the working files stay private under `.local/grammar-b2c1/`.

## Private layout (`.local/grammar-b2c1/`, ignored)

| Path | Contents |
| --- | --- |
| `AUTHORING.md`, `ADJUDICATION.md`, `BLIND.md` | Authoring brief, blind-solving instructions and decision rules |
| `units.json` | Book pages, level split, lesson ids, answer-key pages, Training drills, partner pages and reference lists |
| `extraction/` | Link to the OCR text and page renders of the reference book |
| `live/` | The lessons as they were live before the rebuild (bodies, film overlays, visuals) |
| `base/N.json` | Old title, picture kinds and exercise ids with their book mapping and points |
| `index/NNN.json`, `index/P#.json`, `index/R###.json` | Item-level book index per chapter, partner page and reference list |
| `chapters/kN.json` | Lesson data (one file per lesson id) |
| `reports/` | Gap report per chapter, waivers, audit output |
| `blind/` | Answer-free worksheets, independent solver answers, mismatches and recorded decisions |
| `out/kN.js` | Compiled complete lesson files (the live film wrapper kept byte for byte) |

## Build and check

```sh
node tools/grammar-b2c1/build.cjs        # validate and compile every lesson (keeps each lesson's film unchanged)
node tools/grammar-b2c1/verify.cjs       # submit every answer through the real renderer and grader
node tools/grammar-b2c1/overlap.cjs      # shared 6-word sequences with any page of the book (text hits must be 0)
node tools/grammar-b2c1/audit.cjs        # coverage against the item-level index and the replaced lessons
node tools/grammar-b2c1/blind.cjs sheets # answer-free worksheets; `compare` checks solver answers
node tools/grammar-b2c1/catalog.cjs      # new lesson titles into the table of contents (addresses stay pinned)
```

`verify.cjs` checks, per exercise group, that the key and every listed alternative score 100 %, that typical wrong answers are marked wrong and that strict-case groups reject wrong capitalisation. `blind.cjs` compares answers from independent solvers who never saw the key; every disagreement is recorded as accepted, rejected with a reason, or fixed by rewording the item.

## Release

A release assembles a complete, versioned lesson folder from the live bundle with the B2–C1 files replaced, re-attaches each film's visual overlay to its new lesson file (scenes whose example sentences no longer exist fall back to the plain picture; narration, scene ids and cue order are unchanged and checked with `tools/film-integrity.cjs`), builds the bundle with `LESSON_SOURCE_DIR` and `FILM_VISUAL_DIR`, deploys the protected `lessons` function and then publishes the website. Public page addresses are pinned in `content/public-pages.json` (`slugs`), so renamed lessons keep their links.
