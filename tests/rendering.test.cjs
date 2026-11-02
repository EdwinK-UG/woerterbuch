const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

test("definitions retain dictionary formatting and remove executable markup and links", () => {
  const dom = new JSDOM("", { runScripts: "outside-only" });
  dom.window.eval(fs.readFileSync("js/render-safety.js", "utf8"));
  const html = dom.window.definitionHTML(
    '<span class="sn" onclick="bad()">1</span><b>Haus</b><img src=x onerror="bad()"><a href="javascript:bad()">bad</a><a href="#/w/Haus">safe</a>',
  );
  assert.equal(
    html,
    '<span class="sn">1</span><b>Haus</b><a>bad</a><a href="#/w/Haus">safe</a>',
  );
});

test("a school name in an enrollment dialog is text", () => {
  const src = fs.readFileSync("konto.js", "utf8");
  const ctx = {
    LV: ["A1"],
    lvState: () => "locked",
    P: { org_id: "school" },
    ORG: { name: "<img src=x onerror=bad()>" },
    me: () => true,
    T: (a) => a,
    lvName: () => "",
    icons() {},
    icn: () => "",
    openSheet: (html) => {
      ctx.html = html;
    },
  };
  vm.runInNewContext(
    src.match(/const esc = [^\n]+/)[0] +
      "\n" +
      src.slice(
        src.indexOf("function lockSheet"),
        src.indexOf("icons();\n}", src.indexOf("function lockSheet")) + 10,
      ) +
      '\nlockSheet("A1")',
    ctx,
  );
  const document = new JSDOM(ctx.html).window.document;
  assert.equal(document.querySelector("img"), null);
  assert.match(document.querySelector("p").textContent, /<img src=x/);
});
