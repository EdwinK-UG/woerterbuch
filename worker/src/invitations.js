import { authenticated } from "./control.js";
import { smtpSend } from "./mail-body.js";
import { invitationContent } from "./invitation-template.js";

const email = (value) =>
  typeof value === "string" && /^[^\s@<>]+@[^\s@<>]+$/.test(value.trim());
const json = (status, body, headers) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const text = (value, max) => String(value || "").trim().slice(0, max);
const date = (value) => (value ? new Date(value + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "to be confirmed");
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
  if (!response.ok) throw Object.assign(new Error("Class service could not load "+path.split("?")[0].split("/").pop()+" (HTTP "+response.status+")."),{status:response.status});
  return body;
};
const smtp = (env) => ({ host: String(env.SMTP_HOST || "smtppro.zoho.com"), port: Number(env.SMTP_PORT || 465) });

const diagnostic = error => Number.isInteger(error?.smtpCode) ? 'smtp_'+error.smtpCode+'_'+error.smtpStage : 'transport_'+(error?.smtpStage||'unknown');
const mailProblem = error => error?.smtpCode===535 ? 'The mail provider rejected the saved sign-in. Please contact support; your invitation is saved for retry.' : error?.smtpCode>=500 && error?.smtpStage==='RCPT' ? 'The mail provider rejected this recipient. Check the email address and try again.' : 'The email provider could not accept the invitation. Your invitation is saved; please retry in a moment.';
async function courseContext(req,env,classId){
  const token=req.headers.get('Authorization');
  const manager=await supabase(env,'/rest/v1/rpc/can_manage_class',token,{method:'POST',body:JSON.stringify({p_class:classId})});
  if(manager!==true)return null;
  const course=(await supabase(env,`/rest/v1/classes?select=id,org_id,teacher_id,name,level,term_name,starts_on,ends_on,schedule,course_details&id=eq.${classId}`,token))?.[0];
  if(!course)return null;
  const org=(await supabase(env,`/rest/v1/orgs?select=name,logo_url,theme,owner&id=eq.${course.org_id}`,token))?.[0]||{};
  const teacher=(await supabase(env,`/rest/v1/profiles?select=display_name&user_id=eq.${course.teacher_id||org.owner}`,token))?.[0]?.display_name||org.name;
  return {course,org,teacher};
}
export async function previewCourseInvitation(req,env,headers){
  if(req.method!=='POST')return json(405,{error:'POST only'},headers);
  const user=await authenticated(req,env,headers);if(user instanceof Response)return user;
  const body=await req.json().catch(()=>null),id=text(body?.class_id,36);
  if(!/^[0-9a-f-]{36}$/i.test(id))return json(400,{error:'Choose a teaching term.'},headers);
  let context;try{context=await courseContext(req,env,id);}catch(error){return json(503,{error:error.status?error.message:"Class service could not be reached. Please retry."},headers);}if(!context)return json(403,{error:'Only the responsible teacher or school owner may preview an invitation.'},headers);
  const content=invitationContent({...context,name:text(body?.name,60),note:text(body?.note,500),inviteUrl:env.SITE_URL});
  return json(200,{html:content.html},headers);
}
export async function courseInvitationStatus(req,env,headers){
  if(req.method!=='POST')return json(405,{error:'POST only'},headers);
  const user=await authenticated(req,env,headers);if(user instanceof Response)return user;
  const body=await req.json().catch(()=>null),id=text(body?.class_id,36);
  if(!/^[0-9a-f-]{36}$/i.test(id))return json(400,{error:'Choose a class.'},headers);
  let invitations;
  try{
    if(!await courseContext(req,env,id))return json(403,{error:'Only the responsible teacher or school owner may check invitation mail.'},headers);
    invitations=await supabase(env,`/rest/v1/invites?select=code&class_id=eq.${id}&recipient_email=not.is.null&order=expires_at.desc&limit=100`,req.headers.get('Authorization'));
  }catch{return json(503,{error:'Invitation status could not be loaded. Please retry.'},headers);}
  const codes=(invitations||[]).map(i=>i.code).filter(code=>/^[0-9a-f]{12}$/i.test(code));
  const rows=codes.length?(await env.DB.prepare(`SELECT id,state,updated_at FROM invitation_mail WHERE id IN (${codes.map(()=>'?').join(',')})`).bind(...codes).all()).results||[]:[];
  const records=new Map(rows.map(row=>[row.id,row]));
  return json(200,{invitations:codes.map(code=>({code,state:records.get(code)?.state||'not_sent',updated_at:records.get(code)?.updated_at||null}))},headers);
}
export async function sendCourseInvitation(req, env, headers, send = smtpSend) {
  if(req.method!=='POST')return json(405,{error:'POST only'},headers);
  const user=await authenticated(req,env,headers);if(user instanceof Response)return user;
  const body=await req.json().catch(()=>null);
  const classId=text(body?.class_id,36),to=text(body?.to,120).toLowerCase(),name=text(body?.name,60),note=text(body?.note,500);
  if(!/^[0-9a-f-]{36}$/i.test(classId)||!email(to))return json(400,{error:'Choose a class and enter a valid learner email.'},headers);
  let url;try{url=new URL(body?.invite_url);}catch{return json(400,{error:'Invalid invitation link.'},headers);}
  if(url.origin!==new URL(env.SITE_URL).origin||url.pathname!==new URL(env.SITE_URL).pathname||!new RegExp('^[0-9a-f]{12}$','i').test(url.searchParams.get('join')||''))return json(400,{error:'Invalid invitation link.'},headers);
  let context,invitation;
  try{
    context=await courseContext(req,env,classId);if(!context)return json(403,{error:'Only the class teacher or owner may send invitations.'},headers);
    invitation=(await supabase(env,`/rest/v1/invites?select=code,recipient_email,expires_at&code=eq.${url.searchParams.get('join')}&class_id=eq.${classId}&member_role=eq.student&uses_left=gt.0`,req.headers.get('Authorization')))?.[0];
  }catch(error){return json(503,{error:error.status?error.message:"Class details could not be loaded. Please retry."},headers);}
  if(!invitation||Date.parse(invitation.expires_at)<=Date.now()||invitation.recipient_email?.toLowerCase()!==to)return json(400,{error:'This invitation does not match the class or recipient. Create a new invitation.'},headers);
  const {course}=context;
  if(!course.term_name||!course.starts_on||!course.ends_on||!course.schedule)return json(400,{error:'Complete the term name, dates and timetable in class setup before sending invitations.'},headers);
  if(!env.SMTP_USER||!env.SMTP_PASSWORD)return json(503,{error:'Mail is not configured.'},headers);
  const content=invitationContent({...context,name,note,inviteUrl:url.href});
  return deliverInvitation(env,headers,user,invitation.code,to,content,context.org.name,send);
}
async function deliverInvitation(env,headers,user,id,to,content,brand,send=smtpSend){
  const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
  const existing=await env.DB.prepare('SELECT state,updated_at,attempts FROM invitation_mail WHERE id=?1').bind(id).first();
  if(existing?.state==='sent')return json(200,{sent:true,already_sent:true},headers);
  if(existing?.state==='sending'&&existing.updated_at>now-120000)return json(409,{error:'This invitation is still being sent. Check the inbox before retrying.'},headers);
  const claim=await env.DB.prepare(`INSERT INTO invitation_mail(id,sender,day,state,updated_at,attempts) SELECT ?1,?2,?3,'sending',?4,1 WHERE (SELECT count(*) FROM invitation_mail WHERE sender=?2 AND day=?3)<30
    ON CONFLICT(id) DO UPDATE SET state='sending',updated_at=?4,attempts=invitation_mail.attempts+1 WHERE invitation_mail.state<>'sent' AND (invitation_mail.state<>'sending' OR invitation_mail.updated_at<=?5) AND invitation_mail.attempts<5 RETURNING id`).bind(id,user.id,day,now,now-120000).first();
  if(!claim)return json(429,{error:'The invitation sending limit has been reached. Please try again tomorrow or contact support.'},headers);
  const transport=smtp(env);
  try{
    await send(env.SMTP_USER.trim(),env.SMTP_PASSWORD.replace(/\s+/g,''),to,content.subject,content.text,content.html,'invite-'+id,transport.host,transport.port,undefined,user.email,{from:env.INVITATION_FROM||'hello@deutschklinik.com',fromName:brand&&brand!=='Deutschklinik'?brand+' · Deutschklinik':'Deutschklinik'});
  }catch(error){
    await env.DB.prepare("UPDATE invitation_mail SET state='failed',last_error=?2,updated_at=?3 WHERE id=?1").bind(id,diagnostic(error),Date.now()).run();
    return json(502,{error:mailProblem(error),reference:id},headers);
  }
  await env.DB.prepare("UPDATE invitation_mail SET state='sent',last_error=NULL,updated_at=?2 WHERE id=?1").bind(id,Date.now()).run();
  return json(200,{sent:true},headers);
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

export async function sendSiteInvitation(req,env,headers,send=smtpSend){
 if(req.method!=='POST')return json(405,{error:'POST only'},headers);
 const user=await authenticated(req,env,headers);if(user instanceof Response)return user;
 const token=req.headers.get('Authorization'),owner=await supabase(env,'/rest/v1/rpc/is_founder',token,{method:'POST',body:'{}'});
 if(owner!==true)return json(403,{error:'Only the site owner may invite teachers and schools.'},headers);
 const body=await req.json().catch(()=>null),code=text(body?.code,12);
 if(!/^[0-9a-f]{12}$/i.test(code))return json(400,{error:'Invalid invitation.'},headers);
 const invitation=(await supabase(env,`/rest/v1/site_invites?select=code,name,email,role,expires_at,uses_left&code=eq.${code}`,token))?.[0];
 if(!invitation||!['teacher','school'].includes(invitation.role)||!email(invitation.email)||invitation.uses_left<1||Date.parse(invitation.expires_at)<=Date.now())return json(400,{error:'Choose a valid, addressed teacher or school invitation.'},headers);
 if(!env.SMTP_USER||!env.SMTP_PASSWORD)return json(503,{error:'Mail is not configured.'},headers);
 const url=new URL(env.SITE_URL);url.searchParams.set('invite',code);
 const what=invitation.role==='school'?'your school':'your teaching workspace';
 const content={subject:'Your invitation to teach · Deutschklinik',text:`Hello${invitation.name?' '+invitation.name:''},\n\nYou are invited to set up ${what} on Deutschklinik. Create an account, confirm your email and your personalised dashboard will be ready. Choose your own terms, classes, schedule and branding, then invite your learners.\n\nAccept your invitation: ${url.href}\n\nQuestions? Reply to this email.`,html:`<html><head><meta charset="UTF-8"></head><body style="margin:0;background:#f6f4ef;font-family:Arial,sans-serif;color:#242a34"><main style="max-width:500px;margin:32px auto;padding:30px;background:white;border:1px solid #e8e4dc;border-radius:24px"><b>Deutsch<span style="color:#1f6feb">klinik</span></b><h1 style="font-family:Georgia,serif;font-size:34px;font-weight:normal">Your space to teach.</h1><p style="line-height:1.8">Create ${what}, confirm your email and go straight to your personalised dashboard.</p><p style="line-height:1.8;color:#626a77">Your terms. Your timetable. Your branding.<br>Invite learners and follow their progress.</p><a style="display:inline-block;margin-top:20px;padding:14px 22px;border-radius:999px;background:#1f6feb;color:white;text-decoration:none" href="${url.href.replace(/&/g,'&amp;')}">Accept my invitation ↗</a><p style="font-size:12px;color:#747b87;margin-top:28px">Questions? Reply to this email or contact support@deutschklinik.com.</p></main></body></html>`};
 return deliverInvitation(env,headers,user,'site-'+code,invitation.email,content,'Deutschklinik',send);
}
