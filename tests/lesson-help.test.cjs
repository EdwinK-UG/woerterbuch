const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const help = require("../js/lesson-help.js");
const { problems } = require("../tools/lesson-help/check.cjs");

// An invented chapter in the lesson format (never real lesson text).
const chapter = () => ({
  n: 7, level: "A1", title: "Testkapitel", group: "Testgruppe", kicker: "Ich teste.", hero: "Ich {v:teste}.",
  intro: "Das ist die <b>Regel</b>: {v:Verb} auf Position 2.",
  understand: [
    { type: "grid", title: "Formen", head: ["", "Bedeutung"], rows: [["ich", "t{e:e}ste"]], foot: "Fuß" },
    { type: "cards", title: "Karten", items: [{ t: "testen", p: "Etwas prüfen", ex: "Ich {v:teste} das." }] },
    { type: "slots", title: "Satz", rows: [[["Ich", "n", "Subjekt"], ["teste", "v", "Position 2"]]], note: "Notiz" },
    { type: "merk", text: "Immer so: ich {e:teste}." },
  ],
  examples: ["Wir {v:testen}."],
  exercises: [{ id: "u1", type: "fill", title: "Ergänze", instr: "Schreib das Verb.", items: ["Ich [[teste]] heute."] }],
  speak: { title: "Sprich", intro: "Sag es laut.", items: [{ cue: [["x", "user", "du …"]], say: "Du {v:testest}." }] },
});

test("only A1–B1 grammar chapters and their reference units take translations", () => {
  assert.equal(help.eligible(chapter()), true);
  assert.equal(help.eligible({ ...chapter(), level: "B2" }), false);
  assert.equal(help.eligible({ ...chapter(), vocab: true }), false);
  assert.equal(help.eligible({ ...chapter(), n: 101, level: "Liste" }), true);
  assert.equal(help.eligible({ ...chapter(), n: 180, level: "Liste" }), false);
});

test("the translatable texts leave out examples, exercise items, speaking cues and answers", () => {
  const texts = help.strings(chapter());
  for (const t of ["Testkapitel", "Testgruppe", "Das ist die <b>Regel</b>: {v:Verb} auf Position 2.", "Bedeutung", "Etwas prüfen", "Subjekt", "Notiz",
    "Immer so: ich {e:teste}.", "Ergänze", "Schreib das Verb.", "Sprich", "Sag es laut."]) assert.ok(texts.includes(t), t);
  for (const t of ["Ich teste.", "Ich {v:teste}.", "Ich {v:teste} das.", "Wir {v:testen}.", "Ich [[teste]] heute.", "du …", "Du {v:testest}.", "Ich", "fill", "u1"])
    assert.ok(!texts.includes(t), t);
});

test("a translated view changes only explanation texts and never the lesson or its exercises", () => {
  const c = chapter(), before = JSON.stringify(c);
  const v = help.view(c, { "Testkapitel": "Test chapter", "Etwas prüfen": "To check something", "Schreib das Verb.": "Write the verb.", "Subjekt": "subject" });
  assert.equal(JSON.stringify(c), before, "the German lesson object is unchanged");
  assert.equal(v.title, help.OPEN + "Test chapter" + help.CLOSE);
  assert.equal(v.understand[1].items[0].p, help.OPEN + "To check something" + help.CLOSE);
  assert.equal(v.understand[1].items[0].ex, "Ich {v:teste} das.");
  assert.deepEqual(v.understand[2].rows[0][0], ["Ich", "n", help.OPEN + "subject" + help.CLOSE]);
  assert.equal(v.exercises[0].instr, help.OPEN + "Write the verb." + help.CLOSE);
  assert.equal(v.exercises[0].items, c.exercises[0].items, "exercise items are the very same objects");
  assert.equal(v.examples, c.examples);
  assert.equal(v.speak.items, c.speak.items);
  assert.equal(help.view(c, {}), c, "nothing to translate: the lesson itself");
  assert.equal(help.view({ ...c, level: "C1" }, { Testkapitel: "x" }).title, "Testkapitel");
});

test("markers become language spans in text and disappear inside tags", () => {
  const html = `<p title="${help.OPEN}Hi${help.CLOSE}">${help.OPEN}Hello <b>there</b>${help.CLOSE}</p>`;
  assert.equal(help.marks(html, "fr"), '<p title="Hi"><span lang="fr" class="gr-tr">Hello <b>there</b></span></p>');
  assert.equal(help.marks("<p>plain</p>", "en"), "<p>plain</p>");
});

test("page words fall back to German and fill in numbers", () => {
  assert.equal(help.ui("en", "Prüfen"), "Check");
  assert.equal(help.ui("de", "Prüfen"), "Prüfen");
  assert.equal(help.ui("sw", "Noch nie gesehen"), "Noch nie gesehen");
  assert.equal(help.ui("fr", "Runde %1 von %2", 2, 5), "Série 2 sur 5");
  for (const l of help.LANGS) for (const [de, t] of Object.entries(help.UI[l])) {
    const ph = s => (s.match(/%\d/g) || []).sort().join();
    assert.equal(ph(t), ph(de), `${l}: ${de}`);
    assert.equal((t.match(/<[^>]+>/g) || []).length, (de.match(/<[^>]+>/g) || []).length, `${l}: ${de}`);
  }
  assert.deepEqual(Object.keys(help.UI.fr).sort(), Object.keys(help.UI.en).sort());
  assert.deepEqual(Object.keys(help.UI.sw).sort(), Object.keys(help.UI.en).sort());
});

test("a translation must keep the German markup and tags", () => {
  assert.deepEqual(problems("Das {v:Verb} steht hier.", "The {v:Verb} is here."), []);
  assert.equal(problems("Das {v:Verb} steht hier.", "The {v:verb} is here.").length, 1);
  assert.equal(problems("Im <b>Singular</b>", "In the singular").length, 1);
  assert.equal(problems("x", "").length, 1);
  assert.equal(problems("gleich", "gleich").length, 1);
});

test("the lessons function serves translations under the same rules as the lesson", async () => {
  const { lessonHandler } = await import("../supabase/functions/lessons/handler.mjs");
  const lessons = { 7: { level: "A1", source: "PRIVATE A1", help: { en: { Hallo: "Hello" } } }, 22: { level: "A2", source: "PRIVATE A2" } };
  const open = lessonHandler({ url: "https://project.invalid", key: "public", open: true, lessons, fetcher: async () => { throw Error("no lookup"); } });
  const get = (h, q) => h(new Request("https://project.invalid/functions/v1/lessons?" + q));
  let r = await get(open, "chapter=7&help=en");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("Content-Type"), /application\/json/);
  assert.match(r.headers.get("Cache-Control"), /no-store/);
  assert.deepEqual(await r.json(), { lang: "en", map: { Hallo: "Hello" } });
  assert.deepEqual(await (await get(open, "chapter=7&help=fr")).json(), { lang: "fr", map: {} });
  assert.deepEqual(await (await get(open, "chapter=22&help=sw")).json(), { lang: "sw", map: {} });
  assert.equal((await get(open, "chapter=7&help=de")).status, 400);
  assert.equal((await get(open, "chapter=7&help=")).status, 400);
  assert.equal((await get(open, "chapter=99&help=en")).status, 404);
  assert.equal(await (await get(open, "chapter=7")).text(), "PRIVATE A1", "without help the lesson itself, unchanged");

  let unlocked = ["A1"];
  const closed = lessonHandler({ url: "https://project.invalid", key: "public", lessons, fetcher: async url =>
    url.endsWith("/user") ? new Response(JSON.stringify({ id: "s" })) : new Response(JSON.stringify([{ role: "learner", unlocked }])) });
  const auth = q => closed(new Request("https://project.invalid/functions/v1/lessons?" + q, { headers: { Authorization: "Bearer t" } }));
  assert.equal((await closed(new Request("https://project.invalid/functions/v1/lessons?chapter=7&help=en"))).status, 401);
  assert.deepEqual((await (await auth("chapter=7&help=en")).json()).map, { Hallo: "Hello" });
  unlocked = [];
  assert.equal((await auth("chapter=7&help=en")).status, 403);
});

test("the chapter page draws exercises from the lesson's own objects and translations only from the view", () => {
  const source = fs.readFileSync("grammatik/grammatik.js", "utf8");
  assert.match(source, /c\.exercises\.map\(\(x, i\) => exHTML\(x, i \+ 1, v\.exercises\[i\]\)\)/);
  assert.match(source, /function exHTML\(x, n, t = x\)/);
  assert.match(source, /&help=' \+ encodeURIComponent\(l\)/);
  assert.match(fs.readFileSync("index.html", "utf8"), /<script src="js\/lesson-help\.js\?v=[0-9a-f]{12}"><\/script>/);
});

test("the stored session keeps the explanation language and nothing else from the auth user's metadata", () => {
  const html = fs.readFileSync("index.html", "utf8");
  assert.match(html, /const hl=u\.user_metadata&&u\.user_metadata\.help_lang;if\(typeof hl==='string'\)session\.user\.user_metadata=\{help_lang:hl\};/);
  assert.match(html, /window\.ACCT=\{[^}]*keepMeta/);
  assert.ok(problems("Text <b>x</b>", "Texte <b>x</b> <!-- y").length > 0, "a comment is refused");
  assert.ok(problems("a < b", "a < b c").length > 0, "a bare < is refused");
});
