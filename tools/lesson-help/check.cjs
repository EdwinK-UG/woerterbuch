// Checks translated explanation maps against the German texts of the lessons.
// node tools/lesson-help/check.cjs <en|fr|sw> [chapter …]   (no chapters: every file of that language)
// Errors (exit 1): a key that is not a text of that chapter, changed markup ({x:…} tokens or HTML tags), an empty or
// unchanged translation, private-use markers. Warnings: German quoted examples or numbers missing, odd length.
const fs = require("node:fs");
const path = require("node:path");
const help = require("../../js/lesson-help.js");
const root = path.resolve(__dirname, "../..");
const base = path.join(root, ".local/lesson-help");

const tokens = s => (s.match(/\{[ndaevt]:[^}]*\}/g) || []).sort();
const tags = s => (s.match(/<\/?[a-z][^>]*>/gi) || []).map(t => t.toLowerCase().replace(/\s+/g, " ")).sort();
const quoted = s => [...s.matchAll(/„([^“]+)“/g)].map(m => m[1]);
const digits = s => (s.match(/\d+/g) || []).sort();
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// The hard rules for one pair (German text, translation): [] when it may be shown. The build applies them too.
function problems(de, tr) {
  if (typeof tr !== "string" || !tr.trim()) return ["empty translation"];
  if (tr === de) return ["same as the German; leave it out of the map instead"];
  const out = [];
  if (/[]/.test(tr)) out.push("contains private-use characters");
  if (!same(tokens(de), tokens(tr))) out.push(`markup tokens differ\n    de: ${tokens(de).join(" ")}\n    tr: ${tokens(tr).join(" ")}`);
  if ((tr.match(/</g) || []).length !== tags(tr).length || /<!/.test(tr)) out.push("a < that is not one of the German text's tags");
  if (!same(tags(de), tags(tr))) out.push(`HTML tags differ\n    de: ${tags(de).join(" ")}\n    tr: ${tags(tr).join(" ")}`);
  return out;
}

function checkFile(lang, n) {
  const src = JSON.parse(fs.readFileSync(path.join(base, "source", `k${n}.json`), "utf8"));
  const file = path.join(base, lang, `k${n}.json`);
  const errors = [], warnings = [];
  let data;
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return { errors: [`k${n}: ${e.message}`], warnings, count: 0 }; }
  if (data.n !== n || data.lang !== lang || !data.map || typeof data.map !== "object") errors.push(`k${n}: needs { n: ${n}, lang: "${lang}", map: {…} }`);
  const known = new Set(src.strings), map = data.map || {};
  for (const [de, tr] of Object.entries(map)) {
    const at = `k${n} ${JSON.stringify(de.slice(0, 70))}`;
    if (!known.has(de)) { errors.push(`${at}: not a text of this chapter (copy keys exactly from source/k${n}.json)`); continue; }
    const hard = problems(de, tr);
    for (const p of hard) errors.push(`${at}: ${p}`);
    if (hard.length) continue;
    if (/^\s|\s$/.test(tr) !== /^\s|\s$/.test(de)) warnings.push(`${at}: leading/trailing space differs`);
    for (const q of quoted(de)) if (!tr.includes(q)) warnings.push(`${at}: German example „${q}“ not found unchanged`);
    if (!same(digits(de), digits(tr))) warnings.push(`${at}: numbers differ (${digits(de).join(",")} → ${digits(tr).join(",")})`);
    const r = tr.length / de.length;
    if (de.length > 25 && (r < 0.45 || r > 2.4)) warnings.push(`${at}: length ratio ${r.toFixed(2)}`);
  }
  return { errors, warnings, count: Object.keys(map).length, total: src.strings.length };
}
module.exports = { checkFile, problems };

if (require.main === module) {
  const [lang, ...ns] = process.argv.slice(2);
  if (!help.LANGS.includes(lang)) { console.error("usage: check.cjs <" + help.LANGS.join("|") + "> [chapter …]"); process.exit(2); }
  const dir = path.join(base, lang);
  const list = ns.length ? ns.map(Number) : (fs.existsSync(dir) ? fs.readdirSync(dir) : []).map(f => /^k(\d+)\.json$/.exec(f)).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b);
  let bad = 0, done = 0, translated = 0, total = 0;
  for (const n of list) {
    const r = checkFile(lang, n);
    for (const e of r.errors) console.log("ERROR " + e);
    for (const w of r.warnings) console.log("warn  " + w);
    bad += r.errors.length; done++; translated += r.count; total += r.total || 0;
  }
  console.log(`${lang}: ${done} chapters, ${translated} of ${total} texts translated, ${bad} errors`);
  process.exit(bad ? 1 : 0);
}
