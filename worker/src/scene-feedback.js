// POST /scene-feedback: what visitors think of an animated grammar scene (no sign-in needed: the scenes are shared
// publicly for feedback). Body (JSON, at most 32 KB):
//   { scene: 'k05' | 'k17' | 'k99' | 'k97' | 'k439' | 'k482', version: 'de' | 'en' | 'sw' | 'fr', each also with '-long' (the one being watched),
//     ratings: { de, en, sw, fr, 'de-long', 'en-long', 'sw-long', 'fr-long': 1–5 | null }, prefer: one of the versions | 'same' | null,
//     free: '' (written freely), understand: '' (the film: where it was hard to follow), pictures: '' (ideas for
//     pictures and animation), practice: '' (making the exercises more fun), bugs: '' (anything broken),
//     good: '' (what they liked), improve: '' (the older single field) – each ≤ 4000 characters,
//     device: 'phone · iOS · Safari' (≤ 60), watched: versions this browser has watched (e.g. ['de-long', 'en-long']),
//     lang: 'de' | 'en' | 'sw' | 'fr' }
// Since 24 Nov 2026 the pages only show the '-long' versions; the short ones are still accepted from older pages.
// At least one rating, a preference or some text. Stored in D1 (migrations/0006, 0007 and 0008) without names,
// accounts or IP addresses; a one-day hash limits each visitor to 20 sends a day.
export const FEEDBACK_SCENES = ["k05", "k17", "k99", "k97", "k439", "k482"];   // since 27 Nov 2026 also the four B2–C1 films
export const LANGS = ["de", "en", "sw", "fr"];
export const VERSIONS = [...LANGS, ...LANGS.map((l) => l + "-long")];
const reply = (status, data, h) => new Response(JSON.stringify(data), { status, headers: { ...h, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const rating = (v) => (v == null ? null : Number.isInteger(v) && v >= 1 && v <= 5 ? v : undefined);
async function dayHash(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function sceneFeedback(req, env, h) {
  if (req.method !== "POST") return reply(405, { error: "POST only" }, h);
  const raw = await req.text();
  if (raw.length > 32000) return reply(413, { error: "Too long." }, h);
  let b; try { b = JSON.parse(raw); } catch { return reply(400, { error: "Invalid feedback." }, h); }
  if (!b || typeof b !== "object" || !FEEDBACK_SCENES.includes(b.scene)) return reply(400, { error: "Unknown scene." }, h);
  const de = rating(b.ratings?.de), en = rating(b.ratings?.en);
  const deL = rating(b.ratings?.["de-long"]), enL = rating(b.ratings?.["en-long"]);
  const sw = rating(b.ratings?.sw), fr = rating(b.ratings?.fr), swL = rating(b.ratings?.["sw-long"]), frL = rating(b.ratings?.["fr-long"]);
  const prefer = b.prefer == null ? null : VERSIONS.concat("same").includes(b.prefer) ? b.prefer : undefined;
  const version = VERSIONS.includes(b.version) ? b.version : "";
  const text = (v) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : v == null ? "" : undefined);
  const FIELDS = ["free", "understand", "pictures", "practice", "bugs", "good", "improve"], t = Object.fromEntries(FIELDS.map((f) => [f, text(b[f])]));
  const device = typeof b.device === "string" ? b.device.replace(/[^\w ·.\-]/g, "").slice(0, 60) : "";
  const watched = Array.isArray(b.watched) ? b.watched.filter((x) => VERSIONS.includes(x)).join(",") : "";
  const lang = LANGS.includes(b.lang) ? b.lang : "de";
  if ([de, en, deL, enL, sw, fr, swL, frL, prefer].includes(undefined) || FIELDS.some((f) => t[f] === undefined || t[f].length > 4000)) return reply(400, { error: "Invalid feedback." }, h);
  if ([de, en, deL, enL, sw, fr, swL, frL, prefer].every((x) => x == null) && FIELDS.every((f) => !t[f])) return reply(400, { error: "Rate a version, choose one or write something." }, h);
  const now = new Date(), day = now.toISOString().slice(0, 10);
  const actor = await dayHash(day + "|" + (req.headers.get("CF-Connecting-IP") || "") + "|" + (env.FEEDBACK_SALT || "scene-feedback"));
  const row = await env.DB.prepare(
    `INSERT INTO scene_feedback(created,day,actor,scene,rating_de,rating_en,prefer,good,improve,device,watched,lang,free,understand,pictures,practice,bugs,version,rating_de_long,rating_en_long,preference,rating_sw,rating_fr,rating_sw_long,rating_fr_long)
     SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25 WHERE (SELECT COUNT(*) FROM scene_feedback WHERE day=?2 AND actor=?3)<20 RETURNING id`,
  ).bind(now.toISOString(), day, actor, b.scene, de, en, ["de", "en", "same"].includes(prefer) ? prefer : null, t.good, t.improve, device, watched, lang, t.free, t.understand, t.pictures, t.practice, t.bugs, version, deL, enL, prefer || "", sw, fr, swL, frL).first();
  return row ? reply(202, { received: true }, h) : reply(429, { error: "Thank you – that is enough for today." }, h);
}
