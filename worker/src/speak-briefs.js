// What Liv practises with the learner in each grammar chapter of the speaking trainer (worker/src/speak.js).
// Keyed by the chapter's internal id (the site shows its own numbers: id 5 is A1 · Kapitel 18). A chapter without a
// brief has no trainer. The briefs describe the grammar target and a situation; they hold no lesson text.
export const BRIEFS = {
  5: {
    shown: "A1 · Kapitel 18",
    title: "Modalverben: Formen und Satzklammer",
    level: "A1",
    target: `The modal verbs können, müssen, dürfen, wollen, sollen and möchten in the present tense.
- The modal verb carries the person ending and stands in position 2; the second verb is an infinitive at the very end
  (the sentence bracket): "Ich kann heute nicht kommen." "Am Samstag muss ich arbeiten."
- Singular vowel change: ich/er kann, du kannst; muss, musst; darf, darfst; will, willst. sollen and möchten keep
  their vowel.
- ich and er/sie/es/man have no ending: ich kann, sie kann, man darf, er möchte (never "ich kanne", "er möchtet").
- Yes/no questions put the modal verb first: "Kannst du schwimmen?" W-questions: "Was möchtest du trinken?"
- Meanings: können = ability or possibility, müssen = necessity, dürfen = permission (nicht dürfen = prohibition),
  wollen = a firm wish or plan, sollen = someone else's advice or order, möchten = a polite wish.
Typical learner errors to notice: the infinitive not at the end ("Ich kann schwimmen gut"), a conjugated second verb
("Ich muss arbeite"), a missing vowel change ("du könnst"), an ending on ich/er ("ich kanne", "er willt"), a wrong
modal for the meaning (dürfen for ability).`,
    situation: `Liv is planning her weekend and wants to make plans with the learner. Ask about what the learner can do
(swim, cook, dance, speak languages), what they have to do this week (work, study, shop), what they want to do on the
weekend, what one may or may not do somewhere (in the library, in class, at home), and what they would like to eat or
drink. Mix the six modal verbs over the conversation; make sure the learner gets to answer with at least four
different ones.`,
  },
};
