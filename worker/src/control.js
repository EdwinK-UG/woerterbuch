const reply = (status, data, h, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...h,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extra,
    },
  });
export const pending = (h) =>
  reply(
    202,
    { pending: true, message: "Suggestion submitted for editorial review." },
    h,
  );
export async function authenticated(req, env, h) {
  const token = req.headers.get("Authorization") || "";
  if (!/^Bearer [^\s]+$/i.test(token))
    return reply(401, { error: "Sign in to create new material." }, h);
  const url = new URL(env.SUPABASE_URL);
  if (url.protocol !== "https:") throw Error("Invalid Auth endpoint");
  const r = await fetch(new URL("/auth/v1/user", url), {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: token },
    signal: AbortSignal.timeout(7000),
    redirect: "error",
  });
  if (!r.ok)
    return reply(
      r.status === 401 || r.status === 403 ? 401 : 503,
      { error: "Account verification unavailable." },
      h,
    );
  const u = await r.json();
  if (!u.id || !u.email_confirmed_at)
    return reply(403, { error: "Confirm your account first." }, h);
  return u;
}
async function hash(s) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
}
export async function personalSeed(uid, w, pos, current) {
  const n =
    2 +
    (parseInt((await hash(JSON.stringify([uid, w, pos]))).slice(0, 10), 16) %
      999997);
  return n === current ? n + 1 : n;
}
const cap = (s) => (/^\d{1,5}$/.test(s || "") ? Number(s) : 0);
export async function reserve(env, uid, kind, resource, h) {
  if (env.GENERATION_ENABLED !== "true")
    return reply(503, { error: "Generation is paused." }, h);
  const global = cap(env.GLOBAL_DAILY_JOBS),
    user = cap(env.USER_DAILY_JOBS);
  if (!global || !user)
    return reply(503, { error: "Generation budget unavailable." }, h);
  const now = Date.now(),
    day = new Date(now).toISOString().slice(0, 10),
    id = crypto.randomUUID();
  const actor = await hash(day + "|" + uid),
    key = await hash(kind + "|" + resource);
  // Free expired leases. An attempt remains charged if the upstream call fails.
  await env.DB.prepare(
    "UPDATE generation_jobs SET lease_key=NULL WHERE lease_key=?1 AND lease_until<=?2",
  )
    .bind(key, now)
    .run();
  const row = await env.DB.prepare(
    `INSERT INTO generation_jobs(id,day,actor,lease_key,lease_until)
    SELECT ?1,?2,?3,?4,?5 WHERE (SELECT COUNT(*) FROM generation_jobs WHERE day=?2) < ?6
    AND (SELECT COUNT(*) FROM generation_jobs WHERE day=?2 AND actor=?3) < ?7
    ON CONFLICT(lease_key) DO NOTHING RETURNING id`,
  )
    .bind(id, day, actor, key, now + 10 * 60000, global, user)
    .first();
  if (row) return id;
  const other = await env.DB.prepare(
    "SELECT id FROM generation_jobs WHERE lease_key=?1",
  )
    .bind(key)
    .first();
  return other
    ? reply(
        409,
        { error: "Generation already in progress. Retry shortly." },
        h,
        { "Retry-After": "30" },
      )
    : reply(429, { error: "Daily generation budget exhausted." }, h, {
        "Retry-After": String(
          Math.ceil((Date.parse(day + "T00:00:00Z") + 86400000 - now) / 1000),
        ),
      });
}
export async function settle(env, id, completed) {
  if (completed)
    await env.DB.prepare(
      "UPDATE generation_jobs SET lease_until=?1 WHERE id=?2",
    )
      .bind(Date.now() + 120000, id)
      .run();
  else
    await env.DB.prepare(
      "UPDATE generation_jobs SET lease_key=NULL WHERE id=?1",
    )
      .bind(id)
      .run();
}

export async function correction(req, url, env, h) {
  if (req.method !== "POST") return reply(405, { error: "POST only" }, h);
  const word = (url.searchParams.get("w") || "").trim(),
    reason = url.searchParams.get("reason");
  if (
    !word ||
    word.length > 40 ||
    !["meaning", "example", "attribution", "form"].includes(reason)
  )
    return reply(400, { error: "Select a correction category." }, h);
  const user = await authenticated(req, env, h);
  if (user instanceof Response) return user;
  const day = new Date().toISOString().slice(0, 10),
    actor = await hash(day + "|" + user.id);
  const exists = await env.DB.prepare(
    "SELECT lemma FROM entry_publications WHERE lemma=?1",
  )
    .bind(word)
    .first();
  if (!exists) return reply(404, { error: "Unknown published entry." }, h);
  const row = await env.DB.prepare(
    `INSERT INTO entry_flags(lemma,day,actor,reason)
    SELECT ?1,?2,?3,?4 WHERE (SELECT COUNT(*) FROM entry_flags WHERE day=?2 AND actor=?3)<5
    ON CONFLICT(lemma,day,actor,reason) DO NOTHING RETURNING lemma`,
  )
    .bind(exists.lemma, day, actor, reason)
    .first();
  return row
    ? reply(202, { received: true }, h)
    : reply(
        200,
        {
          received: false,
          message: "Already reported or daily limit reached.",
        },
        h,
      );
}
