// Recorded narration for the B2/C1 films, kept in the private R2 bucket bound as FILM_AUDIO.
//   GET /film-audio?chapter=487   signed in; the lesson rule decides -> {chapter, expires, cues:[{id, say, seconds, url}]}
//   GET /film-audio/clip?k=&e=&s=  a short-lived signed link to one clip (an <audio> element cannot send a sign-in)
// Same rule as the lessons Edge Function: staff (teacher, school, founder) hear every film, learners the levels
// they are enrolled in. The bucket holds kN/manifest.json and kN/<sha256 of the audio>.mp3, written by
// tools/upload-film-audio.cjs. Without the bucket or the signing secret the route answers 404 and films stay silent.
const LEVELS = ["A1", "A2", "B1", "B2", "C1"], STAFF = ["teacher", "school", "founder"];
export const LINK_SECONDS = 12 * 3600;
const CLIP = /^k\d{1,4}\/[0-9a-f]{64}\.mp3$/;

const reply = (status, data, h) =>
  new Response(JSON.stringify(data), { status, headers: { ...h, "Content-Type": "application/json", "Cache-Control": "private, no-store" } });
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const hmac = (env) =>
  crypto.subtle.importKey("raw", new TextEncoder().encode(env.FILM_AUDIO_SIGNING_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
const ready = (env) => env.FILM_AUDIO && String(env.FILM_AUDIO_SIGNING_KEY || "").length >= 32;

export async function signClip(env, key, expires) {
  return b64url(await crypto.subtle.sign("HMAC", await hmac(env), new TextEncoder().encode(key + "|" + expires)));
}

export async function filmAudioList(req, env, h) {
  if (req.method !== "GET") return reply(405, { error: "GET only" }, h);
  if (!ready(env)) return reply(404, { error: "Recorded narration is not available." }, h);
  const authorization = req.headers.get("Authorization") || "";
  if (!/^Bearer \S+$/i.test(authorization)) return reply(401, { error: "Sign in to hear the narration." }, h);
  const chapter = new URL(req.url).searchParams.get("chapter") || "";
  if (!/^\d{1,4}$/.test(chapter)) return reply(400, { error: "Choose a film." }, h);

  const base = new URL(env.SUPABASE_URL);
  if (base.protocol !== "https:") throw Error("Invalid Auth endpoint");
  const auth = { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: authorization };
  const ask = (path) => fetch(new URL(path, base), { headers: auth, signal: AbortSignal.timeout(7000), redirect: "manual" });
  const userResponse = await ask("/auth/v1/user");
  if (userResponse.status === 401 || userResponse.status === 403) return reply(401, { error: "Sign in again." }, h);
  if (!userResponse.ok) return reply(503, { error: "Account service unavailable." }, h);
  const user = await userResponse.json();
  if (!user?.id) return reply(401, { error: "Sign in again." }, h);
  const profileResponse = await ask("/rest/v1/profiles?select=role,unlocked&user_id=eq." + encodeURIComponent(user.id));
  if (!profileResponse.ok) return reply(503, { error: "Enrolment service unavailable." }, h);
  const profile = (await profileResponse.json())[0];
  if (!profile) return reply(403, { error: "An enrolled account is required." }, h);

  const stored = await env.FILM_AUDIO.get("k" + Number(chapter) + "/manifest.json");
  if (!stored) return reply(404, { error: "This film has no recorded narration yet." }, h);
  const manifest = await stored.json();
  const levels = Array.isArray(profile.unlocked) ? profile.unlocked.filter((l) => LEVELS.includes(l)) : [];
  if (!STAFF.includes(profile.role) && !levels.includes(manifest.level)) return reply(403, { error: "Enrol in this level to hear the film." }, h);

  const expires = Math.floor(Date.now() / 1000) + LINK_SECONDS, origin = new URL(req.url).origin, cues = [];
  for (const c of manifest.cues || []) {
    if (!CLIP.test(c.key) || !c.key.startsWith("k" + Number(chapter) + "/")) continue;
    const url = `${origin}/film-audio/clip?k=${encodeURIComponent(c.key)}&e=${expires}&s=${await signClip(env, c.key, expires)}`;
    cues.push({ id: c.id, say: c.say, seconds: c.seconds, url });
  }
  return reply(200, { chapter: Number(chapter), level: manifest.level, expires, cues }, h);
}

export async function filmAudioClip(req, env, h) {
  if (req.method !== "GET" && req.method !== "HEAD") return reply(405, { error: "GET only" }, h);
  if (!ready(env)) return reply(404, { error: "Recorded narration is not available." }, h);
  const q = new URL(req.url).searchParams, key = q.get("k") || "", sig = q.get("s") || "", expires = Number(q.get("e"));
  const now = Math.floor(Date.now() / 1000);
  if (!CLIP.test(key) || !Number.isInteger(expires) || !/^[\w-]{43}$/.test(sig)) return reply(400, { error: "Invalid link." }, h);
  if (expires < now || expires > now + LINK_SECONDS + 60) return reply(403, { error: "This link has expired." }, h);
  const valid = await crypto.subtle.verify("HMAC", await hmac(env), unb64url(sig), new TextEncoder().encode(key + "|" + expires));
  if (!valid) return reply(403, { error: "Invalid link." }, h);

  let object;
  try { object = req.method === "HEAD" ? await env.FILM_AUDIO.head(key) : await env.FILM_AUDIO.get(key, { range: req.headers }); }
  catch { return new Response(null, { status: 416, headers: h }); }
  if (!object) return reply(404, { error: "Clip not found." }, h);
  const headers = new Headers({ ...h, "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes", ETag: object.httpEtag,
    "Cache-Control": "private, max-age=" + Math.max(0, expires - now), "X-Content-Type-Options": "nosniff" });
  const r = object.range;
  if (r && req.method === "GET" && req.headers.has("Range")) {
    const start = "suffix" in r ? object.size - r.suffix : r.offset ?? 0;
    const length = "suffix" in r ? r.suffix : r.length ?? object.size - start;
    headers.set("Content-Range", `bytes ${start}-${start + length - 1}/${object.size}`);
    headers.set("Content-Length", String(length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(object.size));
  return new Response(req.method === "HEAD" ? null : object.body, { status: 200, headers });
}
