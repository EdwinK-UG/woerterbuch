const { test } = require("node:test");
const assert = require("node:assert/strict");
const { script, stats, plain, spoken } = require("../grammatik/watch.js");

const lesson = {
  n: 12, level: "A1", group: "Sätze und Fragen", title: "Das Verb auf Position 2", kicker: "Heute gehen wir ins Kino.",
  intro: "Das Verb steht <b>immer auf Position 2</b>.", hero: "{e:Heute} {v:gehen} wir ins Kino.",
  understand: [
    { type: "slots", title: "Position 1 wechselt", rows: [[["Wir", "n", "Position 1"], ["gehen", "v", "Position 2"], ["heute", "x", ""]], [["Heute", "q", ""], ["gehen", "v", ""], ["wir", "n", ""]]], note: "Das Verb <b>bewegt sich nie</b>." },
    { type: "grid", title: "Pronomen", head: ["", "Singular", "Plural"], rows: [["1. Person", "ich", "wir"], ["3. Person", "er · sie · es", "sie"]], foot: "Fertig." },
    { type: "grid", title: "Sätze", head: ["", "Position 1", "Position 2"], rows: [["Zeit", "Heute", "gehen wir ins Kino."]] },
    { type: "cards", title: "Position 1", items: [{ t: "Zeit", p: "z. B. heute", ex: "{e:Heute} {v:arbeite} ich." }] },
    { type: "merk", text: "Das Verb ist immer die Nummer {v:2}." },
    { type: "note", title: "Achtung", text: "Nicht {e:aber}." },
    { type: "conj", title: "Konjugation", verbs: {} },
  ],
  examples: ["{e:Heute} {v:gehen} wir ins Kino.", "{e:Leider} {v:habe} ich keine Zeit."],
  exercises: [{ id: "u1" }, { id: "u2" }],
};

test("a lesson becomes scenes in teaching order", () => {
  const scenes = script(lesson);
  assert.deepEqual(scenes.map((s) => s.type), ["title", "slots", "grid", "grid", "cards", "merk", "note", "examples", "outro"]);
  assert.deepEqual(scenes.skipped, ["conj"], "blocks without a scene are reported, not silently dropped");
  assert.equal(scenes.at(-1).data.n, 2, "the closing scene knows how many exercises follow");
  for (const scene of scenes) assert.ok(scene.steps.length && scene.steps.every((step) => step.say.length > 0));
});

test("narration is plain speakable German without markup", () => {
  for (const scene of script(lesson))
    for (const step of scene.steps) assert.doesNotMatch(step.say, /[{}<>*·→…]/, step.say);
  assert.equal(plain("{e:Heute} <b>gehen</b> wir *ins* Kino"), "Heute gehen wir ins Kino");
  assert.equal(spoken("z. B. heute"), "zum Beispiel heute");
});

test("sentence rows are read as sentences and word rows column by column", () => {
  const scenes = script(lesson), slots = scenes[1], tables = scenes.filter((s) => s.type === "grid");
  assert.equal(slots.steps[0].say, "Position 1 wechselt. Wir gehen heute.");
  assert.equal(slots.steps[1].say, "Heute gehen wir.");
  assert.equal(slots.steps.at(-1).say, "Das Verb bewegt sich nie.");
  assert.equal(tables[0].steps[0].say, "Pronomen. 1. Person. Singular: ich. Plural: wir.");
  assert.equal(tables[0].steps[1].say, "3. Person. Singular: er, sie, es. Plural: sie.");
  assert.equal(tables[1].steps[0].say, "Sätze. Zeit: Heute gehen wir ins Kino.");
});

test("the size estimate counts every narrated character", () => {
  const scenes = script(lesson), expected = scenes.reduce((a, s) => a + s.steps.reduce((b, t) => b + t.say.length, 0), 0);
  assert.equal(stats(scenes).chars, expected);
  assert.equal(stats(scenes).scenes, scenes.length);
  assert.ok(stats(scenes).minutes > 0);
});

test("stray punctuation and symbols are cleaned before anything is voiced", () => {
  const scenes = script({
    ...lesson,
    understand: [
      { type: "slots", title: "Was kann auf Position 1 stehen?", rows: [[["Heute", "q"], ["gehen", "v"]]] },
      { type: "cards", title: "Regeln", items: [{ t: "Sie groß = höflich", p: "zu + dem: zum", ex: "{e:Ja/Nein}-Fragen …" }] },
      { type: "merk", text: "Merkwort: FUDOG," },
    ],
  });
  const said = scenes.flatMap((s) => s.steps.map((t) => t.say));
  assert.equal(said[3], "Was kann auf Position 1 stehen? Heute gehen.");
  assert.match(said[4], /^Regeln\. Sie groß ist höflich\. zu plus dem: zum\. Ja-Nein-Fragen\.$/);
  assert.equal(said[5], "Merke dir: Merkwort: FUDOG.");
  for (const line of said) assert.doesNotMatch(line, /[?!][.,]|\s[.,;:!?]|\.\.|[=+/]/, line);
});
