const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const SITE = "https://deutschklinik.com";
const read = (f) => fs.readFileSync(f, "utf8");
const pageFile = (url) => path.join(url.slice(1), "index.html");

test("every sitemap address is a real page with its own canonical address and description", () => {
  const sitemap = read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(SITE.length));
  assert.ok(urls.includes("/") && urls.includes("/lernen/"));
  assert.equal(new Set(urls).size, urls.length);
  for (const url of urls.filter((u) => u !== "/")) {
    const html = read(pageFile(url));
    const { document } = new JSDOM(html).window;
    assert.equal(document.querySelector('link[rel="canonical"]').href, SITE + url, url);
    assert.equal(document.querySelectorAll("h1").length, 1, url);
    const description = document.querySelector('meta[name="description"]').content;
    assert.ok(description.length >= 40 && description.length <= 160, url + " description length " + description.length);
    assert.doesNotMatch(html, /undefined|NaN|\[object /, url);
    JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    for (const a of document.querySelectorAll("a[href^='/']")) {
      const href = a.getAttribute("href");
      if (href === "/" || href.startsWith("/#/")) continue;
      assert.ok(fs.existsSync(pageFile(href)), `${url} links to missing ${href}`);
    }
  }
});

test("each chapter has one page that opens the right place in the app", () => {
  const noop = () => {};
  const context = vm.createContext({ window: { addEventListener: noop }, document: { addEventListener: noop }, location: { hash: "" } });
  vm.runInContext(read("grammatik/grammatik.js"), context);
  const chapters = context.window.GRAM.chapters();
  const summaries = JSON.parse(read("content/public-pages.json")).chapters;
  const links = new Map();
  for (const file of fs.readdirSync("lernen", { recursive: true }).filter((f) => f.endsWith("index.html"))) {
    const cta = new JSDOM(read(path.join("lernen", file))).window.document.querySelector("a.cta");
    if (cta) links.set(cta.getAttribute("href"), (links.get(cta.getAttribute("href")) || 0) + 1);
  }
  for (const c of chapters) {
    assert.equal(links.get("/" + (c.vocab ? "#/v/" : "#/g/") + c.n), 1, "chapter " + c.n);
    assert.ok(summaries[c.n], "summary for chapter " + c.n);
  }
  assert.equal(links.size, chapters.length);
});

test("public pages use public metadata only and robots.txt points to the sitemap", () => {
  const generator = read("tools/build-public-pages.cjs");
  assert.deepEqual(
    [...generator.matchAll(/read\("([^"]+)"\)/g)].map((m) => m[1]),
    ["grammatik/grammatik.js", "grammatik/catalog.js", "content/public-pages.json"],
  );
  assert.doesNotMatch(generator, /["'`]\.local\/|LESSON_SOURCE_DIR/);
  const robots = read("robots.txt");
  assert.match(robots, /^Sitemap: https:\/\/deutschklinik\.com\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /Disallow: \/(lernen|grammatik|js)?\/?$/m);
  const home = read("index.html");
  assert.match(home, /<a href="lernen\/">Course overview/);
});
