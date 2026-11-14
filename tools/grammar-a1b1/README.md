# A1–B1 grammar rebuild

The 85 A1–B1 chapters, 11 partner activities and the appendix reference units (101–104, 106) are rebuilt to the depth, coverage and quantity of *Grammatik aktiv A1–B1* (2nd updated edition), with every explanation, example, exercise item, title and instruction newly written. The book is used only as a measure: chapter for chapter, every rule, table, tip and FAQ question is covered, and every numbered exercise and speaking drill has a graded counterpart with at least as many items and answer points. `completion.json` records the verified counts. This folder holds tools and metadata only; lesson bodies and source extraction stay private under `.local/grammar-a1b1/`.

## Private layout (`.local/grammar-a1b1/`, ignored)

| Path | Contents |
| --- | --- |
| `AUTHORING.md`, `ADJUDICATION.md` | Authoring brief and blind-solving decision rules |
| `extraction/` | OCR text and layout of the reference book, page table (`units.json`) |
| `index/NNN.json` | Item-level index per chapter: explanation elements, exercises, item and point counts, drills, answer-key errors |
| `chapters/NNN.json` | Lesson data (explanations, examples, graded exercises, speaking cards) |
| `partners/PN.json` | Partner activities, appended to their target chapter at build |
| `refs/k10N.js` | Reference units with trainer generators |
| `base/NNN.json` | Pictures, word lemmas and exercise IDs kept from the previous lessons |
| `reports/` | Gap report per chapter, audit output |
| `blind/` | Answer-free worksheets, independent solver answers, mismatches and recorded decisions |

## Build and check

```sh
node tools/grammar-a1b1/catalog.cjs      # table of contents, order and display numbers in grammatik.js
node tools/grammar-a1b1/build.cjs        # validate and compile all chapters (and copy reference units)
node tools/grammar-a1b1/verify.cjs       # submit every answer through the real renderer and grader
node tools/grammar-a1b1/overlap.cjs      # shared 6-word sequences with the book (text hits must be 0)
node tools/grammar-a1b1/audit.cjs        # coverage against the item-level index
node tools/grammar-a1b1/blind.cjs sheets # answer-free worksheets; `compare` checks solver answers
npm run assets && npm run check
```

`verify.cjs` checks, per exercise group, that the key and every listed alternative score 100 %, that typical wrong answers (`bad`), wrong choice options, wrong orders and wrong matches are marked wrong, and that groups with `strictCase` reject wrong capitalisation. `blind.cjs` compares answers from an independent solver who never saw the key; every disagreement is recorded as accepted, rejected with a reason, or fixed by rewording the item.

## Order, numbers and IDs

`order.json` defines the learning order: level first (A1 → A2 → B1), topic groups within each level. Chapter IDs (`k1`–`k85`) never change, so saved results, assignments and links keep working; the displayed chapter number follows the order (`A1B1_NO` in `grammatik.js`). Previous exercise IDs (u1–u4) are kept on the group that practises the most similar skill; new groups continue the numbering.

## Release

Lesson bodies are served by the protected `lessons` function. A release must assemble a complete, versioned lesson folder (the current deployed folder with the A1–B1 files and reference units replaced), build the bundle from it, deploy the function and then publish the website. A local catalogue change alone is not a release.
