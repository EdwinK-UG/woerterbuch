// POST /scene-feedback: what visitors think of an animated grammar scene (no sign-in needed: the scenes are shared
// publicly for feedback). Body (JSON, at most 4 KB):
//   { scene: 'k05' | 'k17', ratings: { de: 1–5 | null, en: 1–5 | null }, prefer: 'de' | 'en' | 'same' | null,
//     good: '' and improve: '' (each ≤ 4000 characters: what worked, what was confusing, broken or missing),
//     device: 'phone · iOS · Safari' (≤ 60), watched: ['de', 'en'], lang: 'de' | 'en' }
// At least one rating, a preference or some text. Stored in D1 (migrations/0006_scene_feedback.sql) without names,
// accounts or IP addresses; a one-day hash limits each visitor to 20 sends a day.
export const FEEDBACK_SCENES = ["k05", "k17"];
const reply = (status, data, h) => new Response(JSON.stringify(data), { status, headers: { ...h, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const rating = (v) => (v == null ? null : Number.isInteger(v) && v >= 1 && v <= 5 ? v : undefined);
async function dayHash(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function sceneFeedback(req, env, h) {
  if (req.method !== "POST") return reply(405, { error: "POST only" }, h);
  const raw = await req.text();
  if (raw.length > 12000) return reply(413, { error: "Too long." }, h);
  let b; try { b = JSON.parse(raw); } catch { return reply(400, { error: "Invalid feedback." }, h); }
  if (!b || typeof b !== "object" || !FEEDBACK_SCENES.includes(b.scene)) return reply(400, { error: "Unknown scene." }, h);
  const de = rating(b.ratings?.de), en = rating(b.ratings?.en);
  const prefer = b.prefer == null ? null : ["de", "en", "same"].includes(b.prefer) ? b.prefer : undefined;
  const text = (v) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : v == null ? "" : undefined);
  const good = text(b.good), improve = text(b.improve), device = typeof b.device === "string" ? b.device.replace(/[^\w ·.\-]/g, "").slice(0, 60) : "";
  const watched = Array.isArray(b.watched) ? b.watched.filter((x) => x === "de" || x === "en").join(",") : "";
  const lang = b.lang === "en" ? "en" : "de";
  if (de === undefined || en === undefined || prefer === undefined || good === undefined || improve === undefined || good.length > 4000 || improve.length > 4000) return reply(400, { error: "Invalid feedback." }, h);
  if (de == null && en == null && prefer == null && !good && !improve) return reply(400, { error: "Rate a version, choose one or write something." }, h);
  const now = new Date(), day = now.toISOString().slice(0, 10);
  const actor = await dayHash(day + "|" + (req.headers.get("CF-Connecting-IP") || "") + "|" + (env.FEEDBACK_SALT || "scene-feedback"));
  const row = await env.DB.prepare(
    `INSERT INTO scene_feedback(created,day,actor,scene,rating_de,rating_en,prefer,good,improve,device,watched,lang)
     SELECT ?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12 WHERE (SELECT COUNT(*) FROM scene_feedback WHERE day=?2 AND actor=?3)<20 RETURNING id`,
  ).bind(now.toISOString(), day, actor, b.scene, de, en, prefer, good, improve, device, watched, lang).first();
  return row ? reply(202, { received: true }, h) : reply(429, { error: "Thank you – that is enough for today." }, h);
}
