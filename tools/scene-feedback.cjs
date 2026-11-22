#!/usr/bin/env node
/* The feedback on the animated scenes, collected by the Worker (POST /scene-feedback, D1 table scene_feedback):
     node tools/scene-feedback.cjs export            all feedback into .local/feedback/ (needs a wrangler login):
                                                      scene-feedback-<date>.json   every entry, complete
                                                      scene-feedback-<date>.csv    for a spreadsheet
                                                      scene-feedback-<date>.md     a summary to read or to hand to an
                                                                                    agent: stars per version, which
                                                                                    version people prefer, devices, and
                                                                                    every text by section of the form
     node tools/scene-feedback.cjs export --since 2026-11-23   only entries from that day on
   Nothing in the table identifies a person (see worker/migrations/0006_scene_feedback.sql). */
"use strict";
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");
const root = path.resolve(__dirname, ".."), OUT = path.join(root, ".local", "feedback");
const SCENES = { k05: "A1 · Kapitel 18 · Modalverben – Die Klammer-Werkstatt", k17: "A1 · Kapitel 13 · Der Akkusativ – Wer jagt wen?" };
const argv = process.argv.slice(2), since = (argv[argv.indexOf("--since") + 1] || "").match(/^\d{4}-\d\d-\d\d$/)?.[0] || "";

function rows() {
  const sql = `SELECT id,created,scene,rating_de,rating_en,prefer,free,understand,pictures,practice,bugs,good,improve,device,watched,lang FROM scene_feedback${since ? ` WHERE day >= '${since}'` : ""} ORDER BY id`;
  const r = spawnSync("npx", ["--yes", "wrangler@4.161.0", "d1", "execute", "woerterbuch-eintraege", "--remote", "--json", "--command", sql], { cwd: path.join(root, "worker"), encoding: "utf8", maxBuffer: 64e6 });
  if (r.status !== 0) { console.error((r.stderr || r.stdout).split("\n").slice(-12).join("\n")); process.exit(1); }
  const out = JSON.parse(r.stdout.slice(r.stdout.indexOf("[")));
  return out[0].results || [];
}
const avg = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : "–");
const csvCell = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

function summary(all) {
  const lines = [`# Feedback on the animated grammar scenes`, ``, `${all.length} entries${since ? ` since ${since}` : ""}, exported ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC.`,
    `Versions: **DE** = everything explained in German; **EN** = explained in English, examples in German. Stars 1–5.`, ``];
  for (const [key, title] of Object.entries(SCENES)) {
    const rs = all.filter((r) => r.scene === key); if (!rs.length) continue;
    const de = rs.map((r) => r.rating_de).filter((x) => x != null), en = rs.map((r) => r.rating_en).filter((x) => x != null);
    const pref = { de: 0, en: 0, same: 0 }; rs.forEach((r) => r.prefer && pref[r.prefer]++);
    const dev = {}; rs.forEach((r) => { const k = (r.device || "unknown").split(" · ").slice(0, 2).join(" · "); dev[k] = (dev[k] || 0) + 1; });
    lines.push(`## ${title}`, ``, `| | DE | EN |`, `|---|---|---|`, `| average stars | ${avg(de)} (${de.length}) | ${avg(en)} (${en.length}) |`,
      `| prefer it | ${pref.de} | ${pref.en} |`, ``, `Both the same: ${pref.same}. Devices: ${Object.entries(dev).map(([k, n]) => `${k} ${n}`).join(", ")}.`, ``);
    const text = (field, head) => {
      const xs = rs.filter((r) => r[field]); if (!xs.length) return;
      lines.push(`### ${head} (${xs.length})`, ``);
      for (const r of xs) lines.push(`- **#${r.id}** ${r.created.slice(0, 10)} · watched ${r.watched || r.lang} · stars DE ${r.rating_de ?? "–"} / EN ${r.rating_en ?? "–"} · ${r.device || "?"}  `, `  ${r[field].replace(/\n/g, "\n  ")}`);
      lines.push(``);
    };
    // one heading per section of the form, in the order of the lesson (improve = the older single field)
    text("free", "Written freely");
    text("understand", "1 · Understanding the film (where people got lost)");
    text("pictures", "2 · Pictures & animation (ideas)");
    text("practice", "3 · Practice (making it more fun)");
    text("bugs", "4 · Problems and bugs");
    text("good", "5 · What people liked");
    text("improve", "Older entries: unclear, wrong, broken or missing");
  }
  return lines.join("\n");
}

if (argv[0] !== "export") { console.error("usage: node tools/scene-feedback.cjs export [--since YYYY-MM-DD]"); process.exit(1); }
const all = rows(), stamp = new Date().toISOString().slice(0, 10); fs.mkdirSync(OUT, { recursive: true });
const base = path.join(OUT, `scene-feedback-${stamp}${since ? "-since-" + since : ""}`);
fs.writeFileSync(base + ".json", JSON.stringify(all, null, 1));
const cols = ["id", "created", "scene", "rating_de", "rating_en", "prefer", "free", "understand", "pictures", "practice", "bugs", "good", "improve", "device", "watched", "lang"];
fs.writeFileSync(base + ".csv", [cols.join(","), ...all.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n");
fs.writeFileSync(base + ".md", summary(all) + "\n");
console.log(`${all.length} entries → ${path.relative(root, base)}.{json,csv,md}`);
