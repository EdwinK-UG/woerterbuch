/* Finding a narrator for the bilingual scenes: a native German voice that also speaks English well (the owner's
   request: explanations in English, examples in German, in one voice).
     node tools/bilingual-voices.cjs models            the account's text-to-speech models
     node tools/bilingual-voices.cjs scout             German Voice Library voices also verified in English, with
                                                       their English and German preview clips (free)
     node tools/bilingual-voices.cjs audition          .local/scenes/bilingual/audition.json: one mixed line per voice
                                                       and model → .local/scenes/bilingual/<voice>-<model>.mp3
     node tools/bilingual-voices.cjs check             ElevenLabs speech-to-text on every audition clip: how many of the
                                                       English and of the German words come back right (a measure of
                                                       clear pronunciation in both languages), and a listening page
   The key comes only from ELEVENLABS_API_KEY. */
"use strict";
const fs = require("fs"), path = require("path");
const { call, speak, credits } = require("./elevenlabs.cjs");

const DIR = path.join(__dirname, "..", ".local", "scenes", "bilingual");
const read = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const SETTINGS = { stability: 0.55, similarity_boost: 0.75, style: 0, use_speaker_boost: true, speed: 0.95 };
// German parts of a line are marked {de:…}; the spoken text has no marks
const spoken = (t) => t.replace(/\{[a-z]+:([^}]*)\}/g, "$1");
const words = (t) => t.toLowerCase().replace(/[^a-zäöüß0-9' ]+/g, " ").split(/\s+/).filter(Boolean);

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  const [cmd] = process.argv.slice(2);
  if (cmd === "models") {
    const list = await (await call("/v1/models")).json();
    for (const m of list) if (m.can_do_text_to_speech) console.log([m.model_id, m.name, (m.languages || []).length + " languages"].join(" | "));
    return;
  }
  if (cmd === "scout") {
    const seen = new Map();
    for (const gender of ["female", "male"]) for (const sort of ["usage_character_count_1y", "cloned_by_count"]) for (const page of [0, 1]) {
      let r; try { r = await call(`/v1/shared-voices?page_size=100&page=${page}&language=de&gender=${gender}&sort=${sort}`, {}, true); } catch (e) { continue; }
      for (const v of (await r.json()).voices || []) {
        const langs = v.verified_languages || [], de = langs.find((l) => l.language === "de"), en = langs.find((l) => l.language === "en");
        if (de && en && !seen.has(v.voice_id)) seen.set(v.voice_id, { name: v.name, id: v.voice_id, gender, age: v.age, accent: v.accent, use: v.use_case, desc: (v.description || "").replace(/\s+/g, " ").slice(0, 160),
          uses: v.cloned_by_count || 0, chars1y: v.usage_character_count_1y || 0, enAccent: en.accent, enPreview: en.preview_url, dePreview: de.preview_url });
      }
    }
    const list = [...seen.values()].sort((a, b) => b.chars1y - a.chars1y).slice(0, 30);
    for (const v of list) for (const [lang, url] of [["en", v.enPreview], ["de", v.dePreview]]) {
      if (!url) continue; const f = path.join(DIR, `preview-${v.id}-${lang}.mp3`);
      if (!fs.existsSync(f)) { try { const a = await fetch(url); if (a.ok) fs.writeFileSync(f, Buffer.from(await a.arrayBuffer())); } catch (e) { /* none */ } }
    }
    fs.writeFileSync(path.join(DIR, "scout.json"), JSON.stringify(list, null, 1));
    for (const v of list) console.log([v.name.slice(0, 42), v.gender, v.age, v.accent, "en:" + v.enAccent, v.use, `${Math.round(v.chars1y / 1000)}k/yr`, v.id].join(" | "));
    return;
  }
  if (cmd === "audition") {
    const plan = read(path.join(DIR, "audition.json")); if (!plan) { console.error("no audition.json"); process.exit(1); }
    let chars = 0; const text = spoken(plan.text);
    for (const id of plan.voices) for (const model of plan.models) {
      const f = path.join(DIR, `${id}-${model}.mp3`); if (fs.existsSync(f)) continue;
      try { fs.writeFileSync(f, (await speak(text, id, model, { voice_settings: SETTINGS })).bytes); chars += text.length; console.log("sample", id, model); }
      catch (e) { console.log("failed", id, model, String(e.message || e).slice(0, 120)); }
    }
    console.log("used", credits(chars)); return;
  }
  if (cmd === "check") {
    const plan = read(path.join(DIR, "audition.json")), info = new Map(read(path.join(DIR, "scout.json"), []).map((v) => [v.id, v]));
    // which expected words are German, which English
    const de = [], en = []; plan.text.replace(/\{de:([^}]*)\}|([^{]+)/g, (_, g, e) => { (g ? de : en).push(...words(g || e)); return ""; });
    const score = (want, got) => { const pool = [...got]; let hit = 0; for (const w of want) { const i = pool.indexOf(w); if (i >= 0) { hit++; pool.splice(i, 1); } } return hit / Math.max(1, want.length); };
    const rows = [];
    for (const f of fs.readdirSync(DIR).filter((f) => /^[A-Za-z0-9]+-[a-z0-9_]+\.mp3$/.test(f) && !f.startsWith("preview-"))) {
      const [id, model] = f.replace(".mp3", "").split(/-(.+)/);
      const fd = new FormData(); fd.append("model_id", "scribe_v1"); fd.append("file", new Blob([fs.readFileSync(path.join(DIR, f))], { type: "audio/mpeg" }), f);
      let res; try { res = await (await call("/v1/speech-to-text", { method: "POST", body: fd }, true)).json(); } catch (e) { console.log("stt failed", f, String(e.message).slice(0, 100)); continue; }
      const got = words(res.text || ""), sDe = score(de, got), sEn = score(en, got);
      rows.push({ f, id, model, name: (info.get(id) || {}).name || id, de: sDe, en: sEn, both: (sDe + sEn) / 2, heard: res.text });
    }
    rows.sort((a, b) => b.both - a.both);
    for (const r of rows) console.log(`${(r.both * 100).toFixed(0).padStart(3)}%  en ${(r.en * 100).toFixed(0)}%  de ${(r.de * 100).toFixed(0)}%  ${r.name.slice(0, 34)} · ${r.model}`);
    fs.writeFileSync(path.join(DIR, "check.json"), JSON.stringify(rows, null, 1));
    const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    fs.writeFileSync(path.join(DIR, "index.html"), `<!doctype html><meta charset="utf-8"><title>Bilingual narrator</title><style>body{font-family:system-ui;max-width:900px;margin:20px auto;padding:0 16px;background:#f4efe4}.v{background:#fffcf6;border:1px solid #e6dccb;border-radius:12px;padding:10px;margin:8px 0}small{color:#6b7482}</style>
<h1>Bilingual narrator</h1><p>${esc(spoken(plan.text))}</p>${rows.map((r, i) => `<div class="v"><b>${i + 1}. ${esc(r.name)}</b> <small>${esc(r.model)} · English ${(r.en * 100).toFixed(0)}% · German ${(r.de * 100).toFixed(0)}% understood</small><br><audio controls preload="none" src="${r.f}"></audio><br><small>heard: ${esc(r.heard)}</small></div>`).join("")}`);
    console.log("listening page: .local/scenes/bilingual/index.html"); return;
  }
  console.error("usage: models | scout | audition | check"); process.exit(1);
}
main();
