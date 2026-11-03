import { authenticated } from "./control.js";
import { smtpSend } from "./mail-body.js";

const email = (value) =>
  typeof value === "string" && /^[^\s@<>]+@[^\s@<>]+$/.test(value.trim());
const json = (status, body, headers) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const text = (value, max) => String(value || "").trim().slice(0, max);
const date = (value) => (value ? new Date(value + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "to be confirmed");
const duration = (course) => {
  const days = Math.round((Date.parse(course.ends_on) - Date.parse(course.starts_on)) / 86400000) + 1;
  return Number.isFinite(days) && days > 0 ? (days % 7 === 0 ? `${days / 7} weeks` : `${days} days`) : "to be confirmed";
};
const supabase = async (env, path, token, options = {}) => {
  const response = await fetch(new URL(path, env.SUPABASE_URL), {
    ...options,
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error("database request failed");
  return body;
};
const smtp = (env) => ({ host: String(env.SMTP_HOST || "smtppro.zoho.com"), port: Number(env.SMTP_PORT || 465) });

function inviteText({ name, course, inviteUrl, note }) {
  return `Hello${name ? " " + name : ""},

You are invited to join ${course.name} (${course.level}) with Deutschklinik.

Your course
- Term: ${course.term_name || course.name}
- Starts: ${date(course.starts_on)}
- Ends: ${date(course.ends_on)}
- Course length: ${duration(course)}
- Meeting time: ${course.schedule || "to be confirmed"}
- What you can use: vocabulary and grammar lessons, progress tracking, flashcards, games, and instructor guidance.
${course.course_details ? "\nCourse details:\n" + course.course_details + "\n" : ""}
${note ? "\nA note from your teacher:\n" + note + "\n" : ""}
Create your free learner account and accept your invitation here:
${inviteUrl}

Once you confirm your account, your dashboard will show this class and its ${course.level} course.

See you in class,
Deutschklinik`;
}

function inviteHtml(data) {
  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  return `<main style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#20242b"><h1>Deutsch<span style="color:#1f6feb">klinik</span></h1><h2>Your class invitation</h2><p>Hello${data.name ? " " + esc(data.name) : ""},</p><p>You are invited to join <b>${esc(data.course.name)}</b> (${esc(data.course.level)}).</p><ul><li><b>Term:</b> ${esc(data.course.term_name || data.course.name)}</li><li><b>Course length:</b> ${esc(duration(data.course))}</li><li><b>Starts:</b> ${esc(date(data.course.starts_on))}</li><li><b>Ends:</b> ${esc(date(data.course.ends_on))}</li><li><b>Meeting time:</b> ${esc(data.course.schedule || "to be confirmed")}</li></ul><p>While you learn, you have vocabulary and grammar lessons, progress tracking, flashcards, games, and instructor guidance.</p>${data.course.course_details ? `<p style="white-space:pre-line"><b>Course details</b><br>${esc(data.course.course_details)}</p>` : ""}${data.note ? `<p><b>A note from your teacher:</b><br>${esc(data.note)}</p>` : ""}<p><a href="${esc(data.inviteUrl)}" style="display:inline-block;background:#1f6feb;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Create my account and join</a></p><p>After you confirm your account, your dashboard will show this class and its course.</p><p>See you in class,<br>Deutschklinik</p></main>`;
}

export async function sendCourseInvitation(req, env, headers, send = smtpSend) {
  if (req.method !== "POST") return json(405, { error: "POST only" }, headers);
  const user = await authenticated(req, env, headers);
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const classId = text(body?.class_id, 36), to = text(body?.to, 120), name = text(body?.name, 60), inviteUrl = text(body?.invite_url, 500), note = text(body?.note, 500);
  if (!/^[0-9a-f-]{36}$/i.test(classId) || !email(to)) return json(400, { error: "A class and valid learner email are required." }, headers);
  const site = new URL(env.SITE_URL);
  let url;
  try { url = new URL(inviteUrl); } catch { return json(400, { error: "Invalid invitation link." }, headers); }
  if (url.origin !== site.origin || !/^[0-9a-f]{12}$/i.test(url.searchParams.get("join") || "")) return json(400, { error: "Invalid invitation link." }, headers);
  let classes;
  try {
    const token = req.headers.get("Authorization");
    const manager = await supabase(env, "/rest/v1/rpc/can_manage_class", token, { method: "POST", body: JSON.stringify({ p_class: classId }) });
    if (manager !== true) return json(403, { error: "Only the class teacher or owner may send invitations." }, headers);
    const invitations = await supabase(env, `/rest/v1/invites?select=code&code=eq.${url.searchParams.get("join")}&class_id=eq.${encodeURIComponent(classId)}&member_role=eq.student&uses_left=gt.0`, token);
    if (!invitations?.length) return json(400, { error: "The invitation does not belong to this class." }, headers);
    classes = await supabase(env, `/rest/v1/classes?select=id,name,level,term_name,starts_on,ends_on,schedule,course_details&id=eq.${encodeURIComponent(classId)}`, token);
  }
  catch { return json(403, { error: "You cannot send an invitation for this class." }, headers); }
  const course = classes?.[0];
  if (!course) return json(403, { error: "You cannot send an invitation for this class." }, headers);
  if (!course.term_name || !course.starts_on || !course.ends_on || !course.schedule)
    return json(400, { error: "Complete the term name, dates and timetable in class setup before sending invitations." }, headers);
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) return json(503, { error: "Mail is not configured." }, headers);
  const transport = smtp(env), payload = { name, course, inviteUrl, note };
  await send(env.SMTP_USER.trim(), env.SMTP_PASSWORD.replace(/\s+/g, ""), to, `Your ${course.level} class invitation · Deutschklinik`, inviteText(payload), inviteHtml(payload), crypto.randomUUID(), transport.host, transport.port, undefined, user.email);
  return json(200, { sent: true }, headers);
}

export async function requestLiveClass(req, env, headers, send = smtpSend) {
  if (req.method !== "POST") return json(405, { error: "POST only" }, headers);
  const user = await authenticated(req, env, headers);
  if (user instanceof Response) return user;
  if (!env.SMTP_USER || !env.SMTP_PASSWORD || !env.WELCOME_HOOK_SECRET)
    return json(503, { error: "Class notification mail is not configured." }, headers);
  const body = await req.json().catch(() => null), classId = text(body?.class_id, 36);
  if (!/^[0-9a-f-]{36}$/i.test(classId)) return json(400, { error: "Choose a class." }, headers);
  let request;
  try { request = await supabase(env, "/rest/v1/rpc/request_live_class", req.headers.get("Authorization"), { method: "POST", body: JSON.stringify({ p_class: classId }) }); }
  catch { return json(400, { error: "This class is not accepting applications." }, headers); }
  const profile = await supabase(env, `/rest/v1/profiles?select=display_name&user_id=eq.${encodeURIComponent(user.id)}`, req.headers.get("Authorization")).catch(() => []);
  // The existing mail credential authorises exactly this learner's application.
  // Neither a service-role key nor the private teacher address reaches the browser.
  const context = await supabase(env, "/rest/v1/rpc/teacher_mail_context", req.headers.get("Authorization"), {
    method: "POST", body: JSON.stringify({ p_request: request.request_id, p_worker_secret: env.WELCOME_HOOK_SECRET }),
  });
  const notificationEmail = context.notification_email;
  const recipients = [env.SUPPORT_EMAIL || "support@deutschklinik.com", notificationEmail].filter(email).filter((v, i, a) => a.indexOf(v) === i);
  if (env.SMTP_USER && env.SMTP_PASSWORD) {
    const message = `New live-class application\n\nLearner: ${profile?.[0]?.display_name || "(no name)"}\nEmail: ${user.email}\nClass: ${request.class_name} (${request.level})\nStarts: ${date(request.starts_on)}\nSchedule: ${request.schedule || "to be confirmed"}\n\nOpen the teacher dashboard to accept or decline the application.`;
    const transport = smtp(env);
    await Promise.all(recipients.map((to) => send(env.SMTP_USER.trim(), env.SMTP_PASSWORD.replace(/\s+/g, ""), to, `New ${request.level} class application · Deutschklinik`, message, `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${message.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre>`, crypto.randomUUID(), transport.host, transport.port)));
  }
  return json(200, { status: request.status, class_name: request.class_name, level: request.level }, headers);
}
