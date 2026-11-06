// Build the public course pages in lernen/ and sitemap.xml so search engines can index the course.
// Reads only public files: the chapter list in grammatik/grammatik.js, exercise counts from
// grammatik/catalog.js and the summaries in content/public-pages.json. No lesson text is used.
// Run after changing chapters (npm run assets does this). Use --check in CI.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const SITE = "https://deutschklinik.com";
const OUT = "lernen";
const check = process.argv.includes("--check");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

const noop = () => {};
const context = vm.createContext({ window: { addEventListener: noop }, document: { addEventListener: noop }, location: { hash: "" } });
vm.runInContext(read("grammatik/grammatik.js"), context);
vm.runInContext(read("grammatik/catalog.js") + "\nthis.catalog = LESSON_EXERCISES", context);
const chapters = context.window.GRAM.chapters();
const exercises = context.catalog;
const text = JSON.parse(read("content/public-pages.json"));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slug = (s) =>
  s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const short = (s, max = 158) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–-]\s*$/, "") + "…";
};
const groupName = (g) => g.replace(/\s·\s(A1|A2|B1|B2|C1)$/, "");

const SECTIONS = {
  grammatik: { name: "Grammar", de: "Grammatik", kind: "German grammar", levels: ["A1", "A2", "B1", "B2", "C1"], unit: "Chapter" },
  wortschatz: { name: "Vocabulary", de: "Wortschatz", kind: "German vocabulary", levels: ["A1", "A2", "B1", "C1"], unit: "Topic" },
  listen: { name: "Reference lists", de: "Listen", kind: "German reference list", levels: [], unit: "List" },
};
const sectionOf = (c) => (c.ref ? "listen" : c.vocab ? "wortschatz" : "grammatik");
const levelPath = (sec, lv) => `/${OUT}/${sec}/${lv.toLowerCase()}/`;

// one page per chapter, grouped by section and level, in course order
const pages = [];
const byPath = new Map();
const missing = [];
for (const c of chapters) {
  const sec = sectionOf(c);
  const base = sec === "listen" ? `/${OUT}/listen/` : levelPath(sec, c.level);
  const url = base + slug(c.title) + "/";
  if (byPath.has(url)) throw Error(`Two chapters share the address ${url} (${byPath.get(url).n} and ${c.n})`);
  const summary = text.chapters[c.n];
  if (!summary) missing.push(c.n);
  const page = { ...c, sec, url, summary: summary || `${c.title}: a ${sec === "listen" ? "reference list" : c.level + " " + SECTIONS[sec].name.toLowerCase() + " chapter"} in the Deutschklinik German course.`, count: (exercises[c.n] || []).length, film: sec === "grammatik" && (c.level === "B2" || c.level === "C1") };
  pages.push(page);
  byPath.set(url, page);
}
if (missing.length) console.warn("No summary in content/public-pages.json for chapters " + missing.join(", ") + " – using a short default.");

const CSS = `:root{--bg:#f6f4ef;--card:#fff;--fg:#20242b;--mut:#6b7482;--line:#e7e2d7;--ac:#1f6feb;--ac-s:#e9f1ff}
@media(prefers-color-scheme:dark){:root{--bg:#0f1319;--card:#171e27;--fg:#e8ecf2;--mut:#9aa6b4;--line:#242d39;--ac:#6ea8fe;--ac-s:#17273f}}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--fg);font:16px/1.6 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--ac)}.wrap{max-width:52rem;margin:0 auto;padding:0 1rem}
header{border-bottom:1px solid var(--line)}header .wrap{display:flex;align-items:center;gap:1rem;min-height:58px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:.5rem;font:700 1.25rem Fraunces,serif;color:var(--fg);text-decoration:none}.brand b{color:var(--ac)}
nav.top{display:flex;flex-wrap:wrap;gap:.2rem .9rem;margin-left:auto;font-size:.9rem;font-weight:600}nav.top a{color:var(--mut);text-decoration:none}nav.top a:hover{color:var(--fg)}
main{padding:1.6rem 0 3rem}.crumbs{font-size:.85rem;color:var(--mut);margin:0 0 1rem}.crumbs a{color:var(--mut)}
h1{font:600 clamp(1.9rem,5vw,2.6rem)/1.15 Fraunces,serif;letter-spacing:-.02em;margin:.2rem 0 .8rem}h2{font:600 1.3rem Fraunces,serif;margin:2rem 0 .6rem}
.eyebrow{font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut)}
.kick{font:italic 1.15rem Newsreader,Georgia,serif;color:var(--mut);margin:0 0 1rem}.lead{font-size:1.08rem;max-width:40rem}
.facts{display:flex;flex-wrap:wrap;gap:.4rem;padding:0;margin:1rem 0;list-style:none}.facts li{background:var(--ac-s);border-radius:99px;padding:.15rem .7rem;font-size:.85rem;font-weight:600}
.cta{display:inline-block;background:var(--ac);color:#fff;font-weight:700;text-decoration:none;padding:.7rem 1.2rem;border-radius:.7rem;margin:.6rem 0 .3rem}
.note{font-size:.88rem;color:var(--mut)}ul.list{padding:0;list-style:none;display:grid;gap:.45rem}
ul.list a{display:block;background:var(--card);border:1px solid var(--line);border-radius:.8rem;padding:.6rem .9rem;text-decoration:none;color:var(--fg)}
ul.list a:hover{border-color:var(--ac)}ul.list small{display:block;color:var(--mut)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:.7rem;padding:0;list-style:none}
.cards a{display:block;height:100%;background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:1rem;text-decoration:none;color:var(--fg)}.cards a:hover{border-color:var(--ac)}
.cards b{font:600 1.15rem Fraunces,serif}.cards span{display:block;color:var(--mut);font-size:.9rem;margin-top:.3rem}
.pager{display:flex;justify-content:space-between;gap:1rem;margin-top:2rem;font-size:.92rem}
footer{border-top:1px solid var(--line);font-size:.85rem;color:var(--mut);padding:1.2rem 0 2rem}footer a{color:var(--mut)}`;

const breadcrumbLd = (trail) =>
  JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + url })),
  }).replace(/</g, "\\u003c");

function layout({ url, title, description, trail, body }) {
  const crumbs = trail.map(([name, u], i) => (i === trail.length - 1 ? `<span>${esc(name)}</span>` : `<a href="${u}">${esc(name)}</a>`)).join(" › ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(short(description))}">
<link rel="canonical" href="${SITE + url}">
<link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-180.png?v=2">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Deutschklinik">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(short(description))}">
<meta property="og:url" content="${SITE + url}">
<meta property="og:image" content="${SITE}/icon-192.png">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;600;700&family=Newsreader:ital@1&display=swap" rel="stylesheet">
<style>${CSS}</style>
<script type="application/ld+json">${breadcrumbLd(trail)}</script>
</head>
<body>
<header><div class="wrap"><a class="brand" href="/"><img src="/icon-64.png?v=2" width="28" height="28" alt=""><span>Deutsch<b>klinik</b></span></a>
<nav class="top" aria-label="Course"><a href="/${OUT}/grammatik/">Grammar</a><a href="/${OUT}/wortschatz/">Vocabulary</a><a href="/${OUT}/listen/">Lists</a><a href="/#/">Dictionary</a></nav></div></header>
<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>
${body}
</main>
<footer><div class="wrap"><a href="/">Deutschklinik</a> · <a href="/${OUT}/">Course overview</a> · <a href="/#/privacy">Privacy · Datenschutz</a> · <a href="mailto:support@deutschklinik.com">Support</a></div></footer>
</body>
</html>
`;
}

const HOME = ["Deutschklinik", "/"], HUB = ["Course", `/${OUT}/`];
const secCrumb = (sec) => [SECTIONS[sec].name, `/${OUT}/${sec}/`];
const lvCrumb = (sec, lv) => [lv, levelPath(sec, lv)];
const appLink = (c) => "/" + (c.vocab ? "#/v/" : "#/g/") + c.n;
const item = (c) => `<li><a href="${c.url}"><span lang="de">${esc(c.title)}</span>${c.kick ? `<small lang="de">${esc(c.kick)}</small>` : ""}</a></li>`;

const outputs = new Map();
const put = (url, html) => outputs.set(path.join(OUT, url.slice(OUT.length + 2), "index.html"), html);

// chapter pages
for (const c of pages) {
  const S = SECTIONS[c.sec];
  const siblings = pages.filter((p) => p.sec === c.sec && p.level === c.level);
  const i = siblings.indexOf(c), prev = siblings[i - 1], next = siblings[i + 1];
  const group = siblings.filter((p) => p.group === c.group && p !== c);
  const trail = c.sec === "listen" ? [HOME, HUB, secCrumb("listen"), [c.title, c.url]] : [HOME, HUB, secCrumb(c.sec), lvCrumb(c.sec, c.level), [c.title, c.url]];
  const facts = [
    c.sec === "listen" ? "Reference list" : `Level ${c.level}`,
    c.sec === "listen" ? "" : `${S.unit} ${c.no}`,
    c.count ? `${c.count} exercise${c.count === 1 ? "" : "s"}` : "",
    c.film ? "Animated explanation" : "",
    c.vocab ? "Pictures and pronunciation" : "",
  ].filter(Boolean);
  const title = c.sec === "listen" ? `${c.title} – ${S.kind} | Deutschklinik` : `${c.title} – ${S.kind} ${c.level} | Deutschklinik`;
  const body = `<p class="eyebrow">${esc(S.kind)}${c.sec === "listen" ? "" : " · " + c.level} · <span lang="de">${esc(groupName(c.group))}</span></p>
<h1 lang="de">${esc(c.title)}</h1>
${c.kick ? `<p class="kick" lang="de">${esc(c.kick)}</p>` : ""}
<p class="lead">${esc(c.summary)}</p>
<ul class="facts">${facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
<a class="cta" href="${appLink(c)}">Open in Deutschklinik</a>
<p class="note">${c.sec === "listen" ? "Sign in to open the list and its trainer." : `Sign in and enrol in ${c.level} to open the ${c.vocab ? "topic" : "chapter"} and save your progress.`}</p>
${group.length ? `<h2>More in <span lang="de">${esc(groupName(c.group))}</span></h2>\n<ul class="list">${group.map(item).join("")}</ul>` : ""}
<nav class="pager" aria-label="Previous and next">${prev ? `<a href="${prev.url}">← <span lang="de">${esc(prev.title)}</span></a>` : "<span></span>"}${next ? `<a href="${next.url}"><span lang="de">${esc(next.title)}</span> →</a>` : ""}</nav>`;
  put(c.url, layout({ url: c.url, title, description: `${c.title}${c.sec === "listen" ? "" : " (" + c.level + ")"}: ${c.summary}`, trail, body }));
}

// level pages and section pages
const levelPages = [];
for (const [sec, S] of Object.entries(SECTIONS)) {
  const all = pages.filter((p) => p.sec === sec);
  const secUrl = `/${OUT}/${sec}/`;
  if (!S.levels.length) {
    const body = `<h1>${esc(S.name)} <span class="eyebrow" lang="de">${esc(S.de)}</span></h1>
<p class="lead">${esc(text.sections[sec])}</p>
<ul class="list">${all.map(item).join("")}</ul>`;
    put(secUrl, layout({ url: secUrl, title: `German reference lists: verbs and prepositions | Deutschklinik`, description: text.sections[sec], trail: [HOME, HUB, secCrumb(sec)], body }));
    continue;
  }
  const levels = S.levels.filter((lv) => all.some((p) => p.level === lv));
  for (const lv of levels) {
    const inLevel = all.filter((p) => p.level === lv);
    const groups = [...new Set(inLevel.map((p) => p.group))];
    const url = levelPath(sec, lv);
    const intro = text.levels[`${sec}:${lv}`] || "";
    const body = `<p class="eyebrow">${esc(S.kind)} · ${lv}</p>
<h1>${esc(S.name)} ${lv}</h1>
<p class="lead">${esc(intro)}</p>
<ul class="facts"><li>${inLevel.length} ${S.unit.toLowerCase()}s</li>${sec === "grammatik" && (lv === "B2" || lv === "C1") ? "<li>Animated explanations</li>" : ""}</ul>
${groups.map((g) => `${sec === "grammatik" ? `<h2 lang="de">${esc(groupName(g))}</h2>\n` : ""}<ul class="list">${inLevel.filter((p) => p.group === g).map(item).join("")}</ul>`).join("\n")}
<nav class="pager" aria-label="Levels">${levels.map((l) => (l === lv ? `<b>${l}</b>` : `<a href="${levelPath(sec, l)}">${l}</a>`)).join(" ")}</nav>`;
    put(url, layout({ url, title: `${S.kind} ${lv}: all ${S.unit.toLowerCase()}s | Deutschklinik`, description: intro || `${S.kind} ${lv} in the Deutschklinik course.`, trail: [HOME, HUB, secCrumb(sec), lvCrumb(sec, lv)], body }));
    levelPages.push(url);
  }
  const body = `<h1>${esc(S.name)} <span class="eyebrow" lang="de">${esc(S.de)}</span></h1>
<p class="lead">${esc(text.sections[sec])}</p>
<ul class="cards">${levels.map((lv) => `<li><a href="${levelPath(sec, lv)}"><b>${esc(S.name)} ${lv}</b><span>${all.filter((p) => p.level === lv).length} ${S.unit.toLowerCase()}s</span><span>${esc(text.levels[`${sec}:${lv}`] || "")}</span></a></li>`).join("")}</ul>`;
  put(secUrl, layout({ url: secUrl, title: `${S.kind} A1 to C1 | Deutschklinik`, description: text.sections[sec], trail: [HOME, HUB, secCrumb(sec)], body }));
}

// course overview
{
  const url = `/${OUT}/`;
  const card = (sec) => {
    const S = SECTIONS[sec], n = pages.filter((p) => p.sec === sec).length;
    return `<li><a href="/${OUT}/${sec}/"><b>${esc(S.name)}</b><span>${n} ${S.unit.toLowerCase()}s${S.levels.length ? " · " + S.levels.join(", ") : ""}</span><span>${esc(text.sections[sec])}</span></a></li>`;
  };
  const body = `<h1>Learn German from A1 to C1</h1>
<p class="lead">${esc(text.hub)}</p>
<ul class="cards">${Object.keys(SECTIONS).map(card).join("")}<li><a href="/#/"><b>Dictionary</b><span>Search German words with articles, plural forms and examples.</span></a></li></ul>`;
  put(url, layout({ url, title: "Learn German A1 to C1: grammar, vocabulary and lists | Deutschklinik", description: text.hub, trail: [HOME, HUB], body }));
}

// sitemap: the app's start page plus every generated page
const urls = ["/", ...[...outputs.keys()].map((f) => "/" + path.dirname(f).split(path.sep).join("/") + "/")].sort((a, b) => a.length - b.length || a.localeCompare(b));
outputs.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE + u}</loc></url>`).join("\n")}
</urlset>
`);

// write or compare; generated files under lernen/ that are no longer produced are removed
const existing = [];
const walk = (dir) => {
  if (!fs.existsSync(path.join(root, dir))) return;
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else existing.push(f);
  }
};
walk(OUT);
const stale = existing.filter((f) => !outputs.has(f));
const changed = [...outputs].filter(([f, body]) => !fs.existsSync(path.join(root, f)) || fs.readFileSync(path.join(root, f), "utf8") !== body).map(([f]) => f);
if (check) {
  if (stale.length || changed.length) throw Error(`Public pages are stale (${changed.length} changed, ${stale.length} extra). Run node tools/build-public-pages.cjs`);
} else {
  for (const f of stale) fs.unlinkSync(path.join(root, f));
  for (const f of changed) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), outputs.get(f));
  }
  const prune = (dir) => {
    const p = path.join(root, dir);
    if (!fs.existsSync(p)) return;
    for (const e of fs.readdirSync(p, { withFileTypes: true })) if (e.isDirectory()) prune(path.join(dir, e.name));
    if (dir !== OUT && !fs.readdirSync(p).length) fs.rmdirSync(p);
  };
  prune(OUT);
}
console.log(`${check ? "Verified" : "Built"} ${outputs.size - 1} public pages and a sitemap with ${urls.length} addresses.`);
