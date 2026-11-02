import { authenticated } from "./control.js";
import { textBody, htmlBody, smtpSend } from "./mail-body.js";
const json = (status, o, h) =>
  new Response(JSON.stringify(o), {
    status,
    headers: {
      ...h,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
export async function enqueue(u, env, h) {
  if (
    !u?.email_confirmed_at ||
    !uuid.test(u.id) ||
    !/^\S+@\S+$/.test(u.email || "")
  )
    return json(200, { sent: false, reason: "not eligible" }, h);
  const cutoff = Date.parse(env.WELCOME_FROM || ""),
    confirmed = Date.parse(u.email_confirmed_at);
  if (!Number.isFinite(cutoff) || !env.GMAIL_USER || !env.GMAIL_APP_PASSWORD)
    return json(503, { error: "Mail not configured." }, h);
  if (!Number.isFinite(confirmed) || confirmed < cutoff)
    return json(200, { sent: false, reason: "outside welcome cohort" }, h);
  if (await env.IMG.get("welcome|" + u.id))
    return json(200, { sent: false, reason: "already sent" }, h);
  const r = await env.DB.prepare(
    `INSERT INTO welcome_jobs(user_id,email,next_try) VALUES(?1,?2,?3)
     ON CONFLICT(user_id) DO NOTHING RETURNING user_id`,
  )
    .bind(u.id, u.email, Date.now())
    .first();
  return json(r ? 202 : 200, { sent: false, queued: !!r }, h);
}
export async function handleWelcome(req, env, h) {
  if (req.method !== "POST") return json(405, { error: "POST only" }, h);
  const user = await authenticated(req, env, h);
  return user instanceof Response ? user : enqueue(user, env, h);
}
const digest = (x) =>
  crypto.subtle.digest("SHA-256", new TextEncoder().encode(x));
async function secretOK(a, b) {
  if (!a || !b) return false;
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let n = 0;
  const v = new Uint8Array(y);
  new Uint8Array(x).forEach((c, i) => (n |= c ^ v[i]));
  return n === 0;
}
export async function welcomeHook(req, env, h) {
  if (req.method !== "POST") return json(405, { error: "POST only" }, h);
  if (
    !(await secretOK(
      req.headers.get("Authorization") || "",
      env.WELCOME_HOOK_SECRET ? "Bearer " + env.WELCOME_HOOK_SECRET : "",
    ))
  )
    return json(403, { error: "Forbidden" }, h);
  const raw = await req.text();
  if (raw.length > 131072) return json(413, { error: "Too large" }, h);
  let p;
  try {
    p = JSON.parse(raw);
  } catch {
    return json(400, { error: "Invalid event" }, h);
  }
  if (
    p.schema !== "auth" ||
    p.table !== "users" ||
    !["INSERT", "UPDATE"].includes(p.type) ||
    (p.type === "UPDATE" && p.old_record?.email_confirmed_at)
  )
    return json(200, { queued: false }, h);
  return enqueue(p.record, env, h);
}
export async function drainMail(env, send = smtpSend) {
  const now = Date.now();
  const day = new Date(now - 3 * 86400000).toISOString().slice(0, 10);
  await env.DB.prepare("DELETE FROM generation_jobs WHERE day<?1")
    .bind(day)
    .run();
  // Remove failed recipients after seven days, preserving only the deduplication row.
  await env.DB.prepare(
    "UPDATE welcome_jobs SET email=NULL WHERE state='failed' AND next_try<?1 AND email IS NOT NULL",
  )
    .bind(now - 7 * 86400000)
    .run();
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return;
  const site = new URL(env.SITE_URL);
  if (site.protocol !== "https:" || /[<>"']/.test(site.href))
    throw Error("Invalid site URL");
  const jobs = await env.DB.prepare(
    "SELECT user_id FROM welcome_jobs WHERE state='queued' AND next_try<=?1 ORDER BY next_try LIMIT 5",
  )
    .bind(now)
    .all();
  for (const { user_id } of jobs.results || []) {
    const claim = crypto.randomUUID();
    const row = await env.DB.prepare(
      `UPDATE welcome_jobs SET claim=?1,next_try=?2,attempts=attempts+1
      WHERE user_id=?3 AND state='queued' AND next_try<=?4 RETURNING email,attempts`,
    )
      .bind(claim, Date.now() + 5 * 60000, user_id, Date.now())
      .first();
    if (!row) continue;
    try {
      if (!(await env.IMG.get("welcome|" + user_id)))
        await send(
          env.GMAIL_USER.trim(),
          env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
          row.email,
          "Welcome to Deutschklinik!",
          textBody(site.href),
          htmlBody(site.href),
          user_id,
        );
    } catch (error) {
      const reason = /bad address/.test(error?.message || "") ? "address" : /timed? ?out/i.test(error?.message || "") ? "timeout" : /tls|ssl/i.test(error?.message || "") ? "tls" : /closed|reset|connection/i.test(error?.message || "") ? "connection" : "error";
      const diagnostic = Number.isInteger(error?.smtpCode)
        ? "smtp_" + error.smtpCode + "_" + error.smtpStage
        : "transport_" + (error?.smtpStage || "connect") + "_" + reason;
      await env.DB.prepare(
        "UPDATE welcome_jobs SET state=?1,next_try=?2,claim=NULL,last_error=?5 WHERE user_id=?3 AND claim=?4",
      )
        .bind(
          row.attempts >= 5 ? "failed" : "queued",
          Date.now() + 60000 * 2 ** Math.min(row.attempts, 5),
          user_id,
          claim,
          diagnostic,
        )
        .run();
      continue;
    }
    await env.DB.prepare(
      "UPDATE welcome_jobs SET state='sent',email=NULL,claim=NULL,last_error=NULL WHERE user_id=?1 AND claim=?2",
    )
      .bind(user_id, claim)
      .run();
  }
}
