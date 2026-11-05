const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const motionSrc = fs.readFileSync(path.join(root, "grammatik/motion.js"), "utf8");
const artSrc = fs.readFileSync(path.join(root, "grammatik/illustrations.js"), "utf8");
const M = require("../grammatik/motion.js");

// a stand-in for the drawing kit: every piece returns a recognisable fragment
const kit = () => new Proxy({}, {
  get: (_t, k) => (k === "svg" ? (inner, label) => `<svg viewBox="0 0 520 360" role="img" aria-label="${label}">${inner}</svg>` : k === "person" ? () => "<g class=\"person\"/>" : k === "bubble" ? (x, y, t) => `<g class="bubble">${t}</g>` : () => ""),
});
const SCENES = {
  bridge: { kind: "bridge", bubble: "Am Wochenende *möchte* ich ans Meer *fahren*.", label: "Position 2 · Mittelfeld · Ende", alt: "x" },
  bridge2: { kind: "bridge", bubble: "*Mein Bruder* *fährt* morgen nach Hamburg.", label: "", alt: "x" },
  valency: { kind: "valency", bubble: "", label: "", alt: "x", verb: "schenkt", roles: [{ case: "N", text: "Er" }, { case: "D", text: "seinem Sohn" }, { case: "A", text: "ein Fahrrad" }] },
  wish: { kind: "wish", bubble: "Wenn ich einen Zauberstab *hätte*, *würde* ich fliegen.", label: "", alt: "x" },
  pastWish: { kind: "past-wish", bubble: "Wäre ich doch zu Hause *geblieben*!", label: "hätte / wäre + Partizip II", alt: "x" },
  conditional: { kind: "conditional", bubble: "Wenn ich Geld *hätte*, *würde* ich reisen.", label: "", alt: "x" },
  passive: { kind: "passive", bubble: "Die Gruppe *wird informiert*.", label: "Die Handlung im Mittelpunkt", alt: "x" },
  tokenPath: { kind: "token-path", bubble: "Sie haben lange *darauf gewartet*.", label: "Vor dem zweiten Verbteil", alt: "x", tokens: ["Sie", "haben", "darauf", "gewartet"] },
  clauseEnd: { kind: "clause-end", bubble: "*Wenn er kommt*, frage ich ihn.", label: "Der ganze Nebensatz besetzt Position 1", alt: "x" },
  verbCluster: { kind: "verb-cluster", bubble: "…, weil er *hätte kommen sollen*.", label: "Hilfsverb vor der Infinitivgruppe", alt: "x" },
  gender: { kind: "gender", bubble: "*Der*, *die* oder *das*?", label: "Das Genus gehört zum Wort.", alt: "x" },
  timeSpan: { kind: "time-span", bubble: "*Seit drei Jahren* in Frankfurt.", label: "Vom Beginn bis jetzt", alt: "x", tokens: ["Beginn", "seit drei Jahren", "jetzt"] },
  certainty: { kind: "certainty", bubble: "Er *könnte* im Stau stecken.", label: "Wie sicher bin ich?", alt: "x" },
  cause: { kind: "cause", bubble: "*Aus Wut* schreiben. *Vor Wut* rot werden.", label: "Ursachen unterscheiden", alt: "x" },
  prefix: { kind: "prefix", bubble: "mitkommen → *mitzukommen*.", label: "Präfix, zu und Verbstamm", alt: "x", parts: ["mit", "zu", "kommen"] },
};
for (const rel of ["in", "auf", "an", "über", "unter", "vor", "hinter", "neben", "zwischen"]) SCENES["spatial-" + rel] = { kind: "spatial", bubble: "", label: "Wo? · Wohin?", alt: "x", relation: rel };

test("a sentence is split into word groups, with the highlighted groups marked and punctuation kept with its word", () => {
  assert.deepEqual(M.chunks("Ich *möchte* ans Meer *fahren*."), [{ t: "Ich", hl: false }, { t: "möchte", hl: true }, { t: "ans Meer", hl: false }, { t: "fahren.", hl: true }]);
  assert.deepEqual(M.chunks("…, obwohl ich heute *arbeiten müsste*.").map((c) => c.t), ["…, obwohl ich heute", "arbeiten müsste."]);
  assert.deepEqual(M.chunks("Wäre ich doch zu Hause *geblieben*!").map((c) => c.t), ["Wäre ich doch zu Hause", "geblieben!"]);
  assert.deepEqual(M.chunks(""), []);
});

test("the sentence bridge puts the first word group, the verb on position 2, the middle and the second verb part in order", () => {
  const p = M.plan(SCENES.bridge);
  assert.deepEqual(p.chips.map((c) => c.role), ["p1", "v1", "mid", "v2"]);
  assert.ok(p.chips.every((c, i, a) => !i || c.fx > a[i - 1].fx), "words stand left to right in sentence order");
  assert.equal(p.frames.length, p.n);
  assert.ok(p.frames[0].every((f, i) => f.y < 140 && f.x !== p.chips[i].fx), "at the start the words float loose above the bridge");
  assert.deepEqual(p.frames[p.n - 1].map((f) => f.x), p.chips.map((c) => c.fx), "at the end every word is in its place");
  assert.deepEqual(M.plan(SCENES.bridge2).chips.map((c) => c.role), ["p1", "v1", "mid"]);
  assert.equal(M.plan(SCENES.bridge2).hasV2, false);
  assert.equal(M.plan({ kind: "bridge", bubble: "Ein Satz ohne Verbmarkierung." }), null, "no highlighted verbs: no bridge story");
});

test("the loose words never overlap each other", () => {
  for (const key of ["bridge", "bridge2", "valency", "wish"]) {
    const p = M.plan(SCENES[key]); if (!p.frames) continue;
    const f = p.frames[0].map((q, i) => ({ l: q.x - p.chips[i].w * q.s / 2, r: q.x + p.chips[i].w * q.s / 2, y: Math.round(q.y / 20) }));
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) if (f[i].y === f[j].y) assert.ok(f[i].r <= f[j].l + 1 || f[j].r <= f[i].l + 1, `${key}: words ${i} and ${j} overlap`);
  }
});

test("every story builds markup that carries its scene, escapes lesson text and never throws", () => {
  for (const [name, scene] of Object.entries(SCENES)) {
    const html = M.html(kit(), scene, {});
    assert.match(html, /^<svg class="gm gm-[a-z-]+ gm-story( gm-hidechips)?" data-gm="[a-z-]+" data-steps="\d+" data-scene="/, name);
    assert.match(html, /viewBox="0 0 520 360"/, name);
    assert.doesNotMatch(html, /undefined|NaN/, name);
  }
  const evil = M.html(kit(), { ...SCENES.valency, verb: "<img src=x onerror=alert(1)>", roles: [{ case: "N", text: "\"><script>alert(1)</script>" }] }, {});
  assert.doesNotMatch(evil, /<img|<script/i, "lesson text is escaped everywhere it is printed");
  assert.deepEqual(JSON.parse(new JSDOM(evil).window.document.querySelector("svg").dataset.scene).roles[0].text, "\"><script>alert(1)</script>", "…and survives the round trip through the attribute");
});

test("place prepositions: the ball starts away from the crate and ends exactly where the relation says", () => {
  const ends = {};
  for (const rel of ["in", "auf", "an", "über", "unter", "vor", "hinter", "neben", "zwischen"]) {
    const p = M.plan(SCENES["spatial-" + rel]);
    assert.equal(p.path.length, 15, rel);
    assert.deepEqual([p.path[0][0], p.path[0][1]], [54, 272], rel + " starts on the floor at the left");
    ends[rel] = [p.path.at(-1)[0], p.path.at(-1)[1]];
  }
  assert.ok(ends.auf[1] < ends.in[1] && ends.in[1] < ends.unter[1], "auf is above in, in is above unter");
  assert.ok(ends["über"][1] < ends.auf[1], "über floats higher than auf");
  assert.ok(ends.neben[0] > ends.an[0] && ends.an[0] > ends.auf[0], "neben is further right than an");
  assert.equal(M.plan({ kind: "spatial", relation: "gegenüber" }), null);
});

test("valency needs one to three known case groups, otherwise the picture falls back to the static one", () => {
  assert.equal(M.plan({ kind: "valency", roles: [] }), null);
  assert.equal(M.plan({ kind: "valency", roles: [{ case: "X", text: "?" }] }), null);
  assert.equal(M.plan({ kind: "valency", roles: [{ case: "N", text: "a" }, { case: "A", text: "b" }, { case: "D", text: "c" }, { case: "G", text: "d" }] }), null);
  const p = M.plan(SCENES.valency);
  assert.equal(p.n, 4);
  assert.equal(p.frames[1][0].x, 94, "the first partner plugs into the left socket");
});

function page() {
  const dom = new JSDOM('<main><figure id="f"></figure></main>', { url: "https://motion.test/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.eval(artSrc); w.eval(motionSrc);
  return { dom, w, M: w.GRAM_MOTION };
}

test("a mounted story plays, steps and ends on its finished picture", () => {
  const { w, M: m } = page(), fig = w.document.getElementById("f");
  fig.innerHTML = m.html(kit(), SCENES.bridge, {});
  const [ctl] = m.mount(fig, { auto: false });
  const svg = fig.querySelector("svg");
  assert.equal(ctl.i, ctl.plan.n - 1, "starts on the finished picture, so it is complete even if nothing moves");
  ctl.set(0, true); assert.equal(svg.dataset.step, "0"); assert.equal(svg.querySelectorAll(".gm-post.on").length, 0);
  ctl.set(2, true); assert.ok(svg.querySelector(".gm-post.v1").classList.contains("on"));
  ctl.set(99, true); assert.equal(ctl.i, ctl.plan.n - 1, "steps are clamped");
  const bar = fig.querySelector(".gm-bar");
  bar.querySelector(".gm-b-prev").click(); assert.equal(ctl.i, ctl.plan.n - 2);
  assert.equal(m.mount(fig, { auto: false }).length, 1, "mounting twice reuses the controller");
});

test("build-it-yourself: wrong places are refused, right places stick, finishing completes the bridge", () => {
  const { w, M: m } = page(), fig = w.document.getElementById("f");
  fig.innerHTML = m.html(kit(), SCENES.bridge, {});
  const [ctl] = m.mount(fig, { auto: false }), svg = fig.querySelector("svg");
  fig.querySelector(".gm-b-game").click();
  assert.ok(svg.classList.contains("gm-game"));
  const chip = (i) => svg.querySelectorAll(".gm-chip")[i], slot = (i) => svg.querySelectorAll(".gm-slot")[i], hint = () => fig.querySelector(".gm-hint").textContent;
  slot(0).dispatchEvent(new w.MouseEvent("click", { bubbles: true })); assert.match(hint(), /word first/i);
  chip(0).dispatchEvent(new w.MouseEvent("click", { bubbles: true })); assert.ok(chip(0).classList.contains("sel"));
  slot(1).dispatchEvent(new w.MouseEvent("click", { bubbles: true })); assert.equal(ctl.game.placed.size, 0); assert.match(hint(), /Not there/i);
  assert.ok(chip(0).classList.contains("sel"), "after a wrong try the word stays selected, so the learner can try another place");
  slot(0).dispatchEvent(new w.MouseEvent("click", { bubbles: true })); assert.equal(ctl.game.placed.size, 1);
  for (const i of [1, 2, 3]) { chip(i).dispatchEvent(new w.MouseEvent("click", { bubbles: true })); slot(i).dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
  assert.equal(ctl.game.placed.size, 4);
  assert.ok(svg.classList.contains("gm-done") && svg.querySelector(".gm-arch").classList.contains("on") && svg.querySelector(".gm-hero").classList.contains("on"));
  assert.match(hint(), /Well done/i);
});

test("build-it-yourself with sockets of the same case: any of them is a right place", () => {
  const { w, M: m } = page(), fig = w.document.getElementById("f");
  fig.innerHTML = m.html(kit(), { kind: "valency", bubble: "", label: "", alt: "x", verb: "Mann", roles: [{ case: "G", text: "des Mannes" }, { case: "G", text: "des Herrn" }, { case: "N", text: "der Mann" }] }, {});
  const [ctl] = m.mount(fig, { auto: false }), svg = fig.querySelector("svg"), click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  fig.querySelector(".gm-b-game").click();
  const chip = (i) => svg.querySelectorAll(".gm-chip")[i], slot = (i) => svg.querySelectorAll(".gm-slot")[i];
  click(chip(0)); click(slot(2)); assert.equal(ctl.game.placed.size, 0, "a genitive word does not belong in the nominative socket");
  click(slot(1)); assert.equal(ctl.game.placed.size, 1, "…but the second genitive socket is just as right as the first");
  assert.match(chip(0).style.transform, /translate\(426px,\s?163px\)/, "the word sits in the socket it was put into");
  click(chip(1)); click(slot(1)); assert.equal(ctl.game.placed.size, 1, "a filled socket takes no second word");
  click(slot(0)); assert.equal(ctl.game.placed.size, 2);
  click(chip(2)); click(slot(2)); assert.ok(svg.classList.contains("gm-done"));
});

test("pictures inside graded exercises are not turned into explainers or games", () => {
  const { w, M: m } = page(), doc = w.document;
  doc.body.innerHTML = '<div class="gr-it"><figure id="ex"></figure></div><figure id="learn"></figure>';
  const K = kit();
  doc.getElementById("ex").innerHTML = m.html(K, SCENES.bridge, {}); doc.getElementById("learn").innerHTML = m.html(K, SCENES.bridge, {});
  m.mount(doc, { auto: false });
  assert.equal(doc.querySelectorAll("#ex .gm-story, #ex .gm-bar").length, 0, "no controller, no game bar in an exercise");
  assert.ok(doc.querySelector("#ex svg.gm-life"), "the exercise picture is still drawn (with the life layer only)");
  assert.equal(doc.querySelectorAll("#learn .gm-bar").length, 1, "the same picture in the lesson text is an explainer");
});

test("word-order trains: the highlighted words are the ones that drop into gaps, in sentence order", () => {
  const p = M.plan(SCENES.tokenPath);
  assert.deepEqual(p.chips.map((c) => c.role), ["o", "o", "k", "k"], "tokens are matched word by word, so 'Sie' is not confused with a highlighted word that contains the same letters");
  assert.deepEqual(M.plan({ kind: "token-path", bubble: "Er *hatte* nämlich den Bus *verpasst*.", tokens: ["Er", "hatte", "den Bus", "verpasst"] }).chips.map((c) => c.role), ["o", "k", "o", "k"]);
  assert.deepEqual(M.plan(SCENES.clauseEnd).chips.map((c) => c.t), ["Wenn er kommt,", "frage ich ihn."], "without tokens the sentence's own word groups become the waggons");
  assert.ok(p.frames[0].every((f, i) => p.chips[i].role === "k" || f.x < 0), "at first the waggons are still off to the left");
  assert.ok(p.frames[1].every((f, i) => p.chips[i].role === "o" || f.y < p.Y - 60), "then the verbs hover above their gaps");
  assert.deepEqual(p.frames[2].map((f) => f.y), p.chips.map(() => p.Y), "finally every waggon stands on the track");
  assert.equal(M.plan({ kind: "token-path", bubble: "Nur ein Stück." }), null, "one word group is not a train");
  assert.equal(M.plan({ kind: "clause-end", bubble: "a *b* c *d* e *f* g *h*." }), null, "too long a sentence falls back to the plain picture");
});

test("der / die / das: each word goes to its own monster, and a wrong monster is refused", () => {
  const { w, M: m } = page(), fig = w.document.getElementById("f");
  fig.innerHTML = m.html(kit(), SCENES.gender, {});
  const [ctl] = m.mount(fig, { auto: false }), svg = fig.querySelector("svg"), click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  assert.equal(ctl.plan.chips.map((c) => c.art).join(), "der,die,das");
  ctl.set(2, true); assert.equal(svg.querySelectorAll(".gm-mon.full").length, 2, "two monsters have eaten a word after step 2");
  fig.querySelector(".gm-b-game").click();
  const chip = (i) => svg.querySelectorAll(".gm-chip")[i], slot = (i) => svg.querySelectorAll(".gm-slot")[i];
  click(chip(0)); click(slot(2)); assert.equal(ctl.game.placed.size, 0, "Apfel does not belong to the das monster");
  click(slot(0)); assert.equal(ctl.game.placed.size, 1);
  for (const i of [1, 2]) { click(chip(i)); click(slot(i)); }
  assert.ok(svg.classList.contains("gm-done"));
  assert.equal(M.plan({ kind: "gender", words: [["der", "A"], ["die", "B"]] }), null, "exactly three words are needed");
  assert.equal(M.plan({ kind: "gender", words: [["der", "Hund"], ["die", "Katze"], ["das", "Pferd"]] }).chips[2].t, "Pferd", "the lesson can supply its own words");
});

test("time spans use the lesson's three labels, or the highlighted words in the middle", () => {
  assert.deepEqual(M.plan(SCENES.timeSpan).labels, ["Beginn", "seit drei Jahren", "jetzt"]);
  assert.deepEqual(M.plan({ kind: "time-span", bubble: "*Seit Montag*." }).labels, ["Beginn", "Seit Montag", "Ende"]);
  assert.equal(M.plan({ kind: "time-span", bubble: "Ohne Markierung." }), null);
});

test("the certainty gauge points at the modal verb of the sentence and can be played with", () => {
  const zone = (b) => M.plan({ kind: "certainty", bubble: b }).zone;
  assert.equal(zone("Er *muss* gleich da sein."), 3);
  assert.equal(zone("Er *müsste* gleich da sein."), 2);
  assert.equal(zone("Er *dürfte* gleich da sein."), 1);
  assert.equal(zone("Er *könnte* im Stau stecken."), 0);
  assert.equal(zone("Sie *könnte* Lust auf Sport *gehabt haben*."), 0);
  assert.equal(zone("Er ist da."), -1, "no modal found: the needle rests in the middle");
  const { w, M: m } = page(), fig = w.document.getElementById("f");
  fig.innerHTML = m.html(kit(), SCENES.certainty, {});
  m.mount(fig, { auto: false }); const svg = fig.querySelector("svg");
  assert.match(svg.querySelector(".gm-needle").style.transform, /-67\.5deg/, "it ends on the sure-to-possible zone of könnte");
  svg.querySelector('.gm-zone[data-z="3"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  assert.match(svg.querySelector(".gm-needle").style.transform, /67\.5deg/, "tapping a verb swings the needle to it");
  assert.ok(svg.querySelector('.gm-zone[data-z="3"]').classList.contains("on"));
});

test("cause and effect pairs each highlighted cause with the words next to it", () => {
  const p = M.plan(SCENES.cause);
  assert.deepEqual(p.chips.map((c) => c.t + ":" + c.role), ["Aus Wut:cause", "schreiben.:effect", "Vor Wut:cause", "rot werden.:effect"]);
  assert.deepEqual(M.plan({ kind: "cause", bubble: "Sie ärgert sich *über den Lärm*." }).chips.map((c) => c.role), ["cause", "effect"], "when the cause comes last, the effect is the words before it");
  assert.equal(M.plan({ kind: "cause", bubble: "Kein Ursache markiert." }), null);
  assert.ok(p.chips.every((c) => c.fx > 0 && c.fx < 520));
});

test("word bricks: parts snap together in order, and a separate first word keeps a gap", () => {
  const joined = M.plan(SCENES.prefix), split = M.plan({ kind: "prefix", bubble: "bekommen → *zu bekommen*.", parts: ["zu", "be", "kommen"] });
  const gapOf = (p) => p.chips[1].fx - p.chips[1].w * p.k / 2 - (p.chips[0].fx + p.chips[0].w * p.k / 2);
  assert.ok(gapOf(joined) < 6 && gapOf(split) > 15, "mitzukommen is one word, 'zu bekommen' is two");
  assert.deepEqual(joined.frames[2].map((f, i) => f.x === joined.chips[i].fx), [true, true, false], "after step 2 the first two bricks have snapped on");
  assert.equal(M.plan({ kind: "prefix", parts: ["a", "b"] }), null);
  const { w, M: m } = page(), fig = w.document.getElementById("f");
  fig.innerHTML = m.html(kit(), SCENES.prefix, {});
  const [ctl] = m.mount(fig, { auto: false }), svg = fig.querySelector("svg"), click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  fig.querySelector(".gm-b-game").click();
  for (const i of [2, 0, 1]) { click(svg.querySelectorAll(".gm-chip")[i]); click(svg.querySelectorAll(".gm-slot")[i]); }
  assert.ok(svg.classList.contains("gm-done"), "bricks may be placed in any order, as long as each lands in its own place");
});

test("the life layer moves any picture that has no story of its own, without changing what it shows", () => {
  const { w } = page();
  const K = kit(), plain = new w.Function("K", "scene", "return GRAM_ART.draw(K, scene)");
  const html = plain(K, { kind: "coffee", bubble: "Zwei *Kaffee*, bitte.", label: "Im Café", alt: "Im Café" });
  assert.match(html, /^<svg class="gm gm-life"/);
  assert.match(html, /class="gm-p"/, "people breathe");
  assert.match(html, /class="gm-b"/, "speech bubbles pop in");
  assert.ok(w.GRAM_MOTION.original, "the untouched drawing function stays available");
  assert.throws(() => plain(K, { kind: "does-not-exist" }), /Unknown grammar illustration/, "unknown kinds still fail loudly");
});

test("every kind the pictures module draws still draws, with and without a story", () => {
  const { w } = page(), draw = new w.Function("K", "scene", "return GRAM_ART.draw(K, scene)");
  for (const kind of w.GRAM_ART.kinds) {
    const base = { kind, bubble: "Das *ist* ein *Beispiel*.", label: "Etikett", alt: "x" };
    const extra = { valency: { verb: "v", roles: [{ case: "N", text: "Er" }] }, spatial: { relation: "auf" }, adposition: { rows: [["in", "der Sonne", ""]] }, prefix: { parts: ["mit", "ge", "kommen"] }, gender: { words: [["der", "A"], ["die", "B"], ["das", "C"]] }, reference: { target: "bus" }, route: { place: "park", moving: false }, "token-path": { tokens: ["a", "b", "c", "d"] }, "verb-cluster": { tokens: ["a", "b", "c", "d"] }, "clause-end": { tokens: ["a", "b", "c", "d"] }, "clause-zero": { tokens: ["a", "b", "c", "d"] }, "clause-compare": { tokens: ["a", "b", "c", "d"] }, "time-span": { tokens: ["a", "b", "c"] } }[kind] || {};
    let html; try { html = draw(kit(), { ...base, ...extra }); } catch (e) { html = null; }
    const orig = new w.Function("K", "scene", "return GRAM_MOTION.original(K, scene)");
    let plainHtml; try { plainHtml = orig(kit(), { ...base, ...extra }); } catch (e) { plainHtml = null; }
    assert.equal(html === null, plainHtml === null, kind + ": the moving picture fails exactly when the original fails");
    if (html) assert.match(html, /<svg/, kind);
  }
});
