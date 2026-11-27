// Account, class and mail hardening (supabase/migrations/20261127203000_account_and_class_hardening.sql).
// Every rule is tested twice: the misuse is refused and the ordinary flow still works.
const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), { PGlite } = require('@electric-sql/pglite');
const read = f => fs.readFileSync(f, 'utf8');
const id = n => '00000000-0000-4000-ab00-' + String(n).padStart(12, '0');
const LOGOS = 'https://vnnhyhicppkexdibuqyu.supabase.co/storage/v1/object/public/logos/';
async function database() {
  const db = new PGlite();
  for (const f of ['tests/school-security-bootstrap.sql', 'supabase_setup.sql', 'accounts_setup.sql']) await db.exec(read(f));
  for (const f of fs.readdirSync('supabase/migrations').filter(x => !x.endsWith('_welcome_delivery.sql')).sort()) await db.exec(read('supabase/migrations/' + f));
  await db.exec(`create schema vault;create table vault.decrypted_secrets(name text,decrypted_secret text);insert into vault.decrypted_secrets values('deutschklinik_welcome_hook','fixture-secret');`);
  const as = async (user, role = 'authenticated') => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user || '']); await db.exec('set role ' + role); };
  const admin = async () => { await db.exec('reset role'); };
  const one = async (sql, args = []) => (await db.query(sql, args)).rows[0];
  return { db, as, admin, one };
}
// A school with an owner, two teachers (each with one class) and one enrolled learner.
const owner = id(101), teacherA = id(102), teacherB = id(103), learner = id(104), outsider = id(105), org = id(110), classA = id(111), classB = id(112), classOwner = id(113);
async function school({ db }) {
  await db.query(`insert into auth.users(id,email,email_confirmed_at) values($1,'owner@school.invalid',now()),($2,'a@school.invalid',now()),($3,'b@school.invalid',now()),($4,'learner@example.invalid',now()),($5,'outsider@example.invalid',now())`, [owner, teacherA, teacherB, learner, outsider]);
  await db.query(`update public.profiles set role='school' where user_id=$1`, [owner]);
  await db.query(`update public.profiles set role='teacher' where user_id in ($1,$2)`, [teacherA, teacherB]);
  await db.query(`insert into public.orgs(id,owner,kind,name) values($1,$2,'school','Hardening School')`, [org, owner]);
  await db.query(`insert into public.org_members(org_id,user_id,member_role) values($1,$2,'teacher'),($1,$3,'teacher')`, [org, teacherA, teacherB]);
  await db.query(`update public.profiles set org_id=$1 where user_id in ($2,$3,$4)`, [org, owner, teacherA, teacherB]);
  await db.query(`insert into public.classes(id,org_id,name,level,teacher_id,meeting_details,notification_email) values
    ($2,$1,'A1 morning','A1',$5,'https://meet.invalid/a','a@school.invalid'),
    ($3,$1,'B1 evening','B1',$6,'https://meet.invalid/b','b@school.invalid'),
    ($4,$1,'Owner class','A2',null,'https://meet.invalid/o',null)`, [org, classA, classB, classOwner, teacherA, teacherB]);
  await db.query(`insert into public.org_members(org_id,user_id,member_role,class_id) values($1,$2,'student',$3)`, [org, learner, classA]);
  await db.query(`update public.profiles set org_id=$1,level='A1',unlocked='{A1}' where user_id=$2`, [org, learner]);
}

test('assignments store only well-formed chapter references', async () => {
  const t = await database(), { db, as, one } = t;
  try {
    await school(t); await as(teacherA);
    const add = items => db.query(`insert into public.assignments(class_id,title,items) values($1,'Task',$2::jsonb)`, [classA, JSON.stringify(items)]);
    for (const bad of [[{ ch: '"><img src=x onerror=alert(1)>', ex: 'u1' }], [{ ch: '201' }], [{ ch: 201, ex: '"><svg onload=1>' }], [{ ch: -1 }], [{ ch: 2.5 }], [{ ch: 201, required: 'u1' }], ['201'], { ch: 201 }, [{ ex: 'u1' }]])
      await assert.rejects(add(bad), /assignment_items_shape/, JSON.stringify(bad));
    await add([{ ch: 201, ex: null, required: ['u1', 'u2'] }, { ch: 7, ex: 'u-3_b' }, { ch: 12 }]); await add([]);
    await assert.rejects(db.query(`update public.assignments set items='[{"ch":"x"}]' where class_id=$1`, [classA]), /assignment_items_shape/);
    assert.equal((await one('select count(*)::int n from public.assignments')).n, 2);
    await t.admin();
    assert.equal((await one(`select convalidated from pg_constraint where conname='assignment_items_shape'`)).convalidated, true);
    // The learner in that class still reads the assignment.
    await as(learner); assert.equal((await one('select count(*)::int n from public.assignments')).n, 2);
  } finally { await db.close(); }
});

test('a school logo must live in the project logo folder', async () => {
  const t = await database(), { db, as, one, admin } = t;
  try {
    await school(t); await as(owner);
    for (const bad of ['https://tracker.invalid/pixel.png', LOGOS.replace('vnnhyhicppkexdibuqyu', 'attackerprojectrefxyz') + 'x/logo.png', LOGOS + '../../x.png', LOGOS + 'x/logo.png?u=1', 'http://vnnhyhicppkexdibuqyu.supabase.co/storage/v1/object/public/logos/x.png'])
      await assert.rejects(db.query('update public.orgs set logo_url=$2 where id=$1', [org, bad]), /org_logo_host/, bad);
    await db.query('update public.orgs set logo_url=$2 where id=$1', [org, LOGOS + owner + '/logo-1764270000000.webp']);
    await db.query('update public.orgs set logo_url=null where id=$1', [org]);
    // Sign-up details with a foreign picture still create the page, without that picture.
    await admin();
    await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,'new@teacher.invalid',$2)`, [id(120), JSON.stringify({ role: 'teacher', name: 'New', info: { logo_url: 'https://tracker.invalid/p.png', about: 'Hello' } })]);
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [id(120)]);
    const made = await one('select logo_url,about from public.orgs where owner=$1', [id(120)]);
    assert.equal(made.logo_url, null); assert.equal(made.about, 'Hello');
    await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,'own@teacher.invalid',$2)`, [id(121), JSON.stringify({ role: 'teacher', info: { logo_url: LOGOS + id(121) + '/logo-1.png' } })]);
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [id(121)]);
    assert.equal((await one('select logo_url from public.orgs where owner=$1', [id(121)])).logo_url, LOGOS + id(121) + '/logo-1.png');
  } finally { await db.close(); }
});

test('private class details reach only the class manager; a learner gets only their own class', async () => {
  const t = await database(), { db, as, one } = t;
  try {
    await school(t);
    const columns = 'id,org_id,name,level,pass_mark,teacher_id,created_at,starts_on,ends_on,schedule,live_open,term_name,course_details';
    for (const user of [learner, teacherB, owner]) {
      await as(user);
      await assert.rejects(db.query('select notification_email from public.classes'), /permission denied/);
      await assert.rejects(db.query('select meeting_details from public.classes'), /permission denied/);
      await assert.rejects(db.query('select * from public.classes'), /permission denied/);
      assert.equal((await db.query(`select ${columns} from public.classes`)).rows.length, 3);
    }
    const priv = async user => { await as(user); return (await db.query('select * from public.class_private($1) order by meeting_details', [org])).rows; };
    assert.deepEqual(await priv(learner), []); assert.deepEqual(await priv(outsider), []);
    assert.deepEqual(await priv(teacherA), [{ id: classA, meeting_details: 'https://meet.invalid/a', notification_email: 'a@school.invalid' }]);
    assert.deepEqual((await priv(teacherB)).map(r => r.id), [classB]);
    assert.deepEqual((await priv(owner)).map(r => r.id), [classA, classB, classOwner]);
    await as(null, 'anon'); await assert.rejects(db.query('select * from public.class_private($1)', [org]), /permission denied/);
    await assert.rejects(db.query('select id from public.classes'), /permission denied/);
    // The learner's own meeting link still arrives with their school.
    await as(learner); assert.equal((await one('select public.my_org() as o')).o.class.meeting_details, 'https://meet.invalid/a');
    // Saving the private details stays possible for the manager without reading them back.
    await as(teacherA); await db.query(`update public.classes set meeting_details='Room 2',notification_email=null where id=$1`, [classA]);
    assert.equal((await priv(teacherA))[0].meeting_details, 'Room 2');
  } finally { await db.close(); }
});

test('a teacher manages only their own classes; only the owner assigns the teacher', async () => {
  const t = await database(), { db, as, one, admin } = t;
  try {
    await school(t);
    const manages = async (user, cls) => { await as(user); return (await one('select public.can_manage_class($1) as m', [cls])).m; };
    await as(teacherB);
    // Taking a colleague's or the owner's class changes nothing.
    for (const cls of [classA, classOwner]) {
      assert.equal((await db.query('update public.classes set teacher_id=$2 where id=$1', [cls, teacherB])).affectedRows, 0);
      assert.equal((await db.query(`update public.classes set name='Taken',live_open=false where id=$1`, [cls])).affectedRows, 0);
      assert.equal((await db.query('delete from public.classes where id=$1', [cls])).affectedRows, 0);
    }
    assert.equal(await manages(teacherB, classA), false); assert.equal(await manages(teacherB, classOwner), false);
    // Handing the own class to someone else, or creating a class in a colleague's name, is refused.
    await as(teacherB);
    await assert.rejects(db.query('update public.classes set teacher_id=$2 where id=$1', [classB, teacherA]), /row-level security/);
    await assert.rejects(db.query('update public.classes set teacher_id=null where id=$1', [classB]), /row-level security/);
    await assert.rejects(db.query(`insert into public.classes(org_id,name,level,teacher_id) values($1,'Ghost','A1',$2)`, [org, teacherA]), /row-level security/);
    await assert.rejects(db.query(`insert into public.classes(org_id,name,level) values($1,'Nobody','A1')`, [org]), /row-level security/);
    // Ordinary work on the own class.
    assert.equal((await db.query('update public.classes set pass_mark=80 where id=$1', [classB])).affectedRows, 1);
    await db.query(`insert into public.classes(id,org_id,name,level,teacher_id) values($3,$1,'B2 new','B2',$2)`, [org, teacherB, id(114)]);
    assert.equal((await db.query('delete from public.classes where id=$1', [id(114)])).affectedRows, 1);
    assert.equal(await manages(teacherB, classB), true);
    // A learner or an outsider can do none of this.
    for (const user of [learner, outsider]) { await as(user); assert.equal((await db.query(`update public.classes set name='x' where id=$1`, [classA])).affectedRows, 0); await assert.rejects(db.query(`insert into public.classes(org_id,name,level,teacher_id) values($1,'x','A1',$2)`, [org, user]), /row-level security/); }
    // The owner manages every class and may reassign it.
    await as(owner);
    assert.equal((await db.query('update public.classes set teacher_id=$2 where id=$1', [classOwner, teacherB])).affectedRows, 1);
    assert.equal((await db.query(`update public.classes set name='A1 mornings' where id=$1`, [classA])).affectedRows, 1);
    await db.query(`insert into public.classes(org_id,name,level) values($1,'Unassigned','A1')`, [org]);
    assert.equal(await manages(teacherB, classOwner), true);
    // A teacher who was removed from the school no longer manages the class they were named on.
    await as(owner); await db.query('delete from public.org_members where org_id=$1 and user_id=$2', [org, teacherB]);
    assert.equal(await manages(teacherB, classB), false);
    await as(teacherB); assert.deepEqual((await db.query('select * from public.class_private($1)', [org])).rows, []);
    await admin(); assert.equal((await one('select name from public.classes where id=$1', [classA])).name, 'A1 mornings');
  } finally { await db.close(); }
});

test('only an open application can be decided, and a learner who moved on is never pulled back', async () => {
  const t = await database(), { db, as, one, admin } = t;
  try {
    await school(t);
    const applicant = id(130), other = id(131), otherOrg = id(132), otherClass = id(133);
    await db.query(`insert into auth.users(id,email,email_confirmed_at) values($1,'applicant@example.invalid',now()),($2,'other@school.invalid',now())`, [applicant, other]);
    await db.query(`update public.profiles set role='teacher' where user_id=$1`, [other]);
    await db.query(`insert into public.orgs(id,owner,kind,name) values($1,$2,'teacher','Other teacher')`, [otherOrg, other]);
    await db.query(`insert into public.classes(id,org_id,name,level,teacher_id) values($1,$2,'Other A2','A2',$3)`, [otherClass, otherOrg, other]);
    await db.query(`insert into public.invites(code,org_id,class_id,member_role,uses_left,created_by) values('aaaaaaaaaaaa',$1,$2,'student',5,$3)`, [otherOrg, otherClass, other]);
    await db.query(`update public.classes set live_open=true,term_name='Term',starts_on='2027-01-01',ends_on='2027-03-01',schedule='Mon' where id=$1`, [classA]);
    const apply = async () => { await as(applicant); return (await one('select public.request_live_class($1) as r', [classA])).r; };
    const decide = async (user, request, accept) => { await as(user); return db.query('select public.decide_live_class_request($1,$2) as r', [request, accept]); };
    const first = await apply(); assert.equal(first.status, 'pending');
    assert.equal((await apply()).request_id, first.request_id);
    // Only the class's teacher or the owner decides.
    await assert.rejects(decide(teacherB, first.request_id, true), /not your class/);
    await assert.rejects(decide(applicant, first.request_id, true), /not your class/);
    // Declined, then "accepted" later without a new application: refused.
    await decide(teacherA, first.request_id, false);
    await assert.rejects(decide(teacherA, first.request_id, true), /already been decided/);
    await admin(); assert.equal((await one('select org_id from public.profiles where user_id=$1', [applicant])).org_id, null);
    // The learner applies again: the ordinary flow enrols them.
    assert.equal((await apply()).status, 'pending');
    assert.equal((await decide(teacherA, first.request_id, true)).rows[0].r.status, 'accepted');
    await admin();
    assert.deepEqual(await one('select org_id,level,unlocked from public.profiles where user_id=$1', [applicant]), { org_id: org, level: 'A1', unlocked: ['A1'] });
    assert.equal((await one('select class_id from public.org_members where user_id=$1', [applicant])).class_id, classA);
    // Deciding it again in either direction is refused.
    await assert.rejects(decide(teacherA, first.request_id, false), /already been decided/);
    await assert.rejects(decide(owner, first.request_id, true), /already been decided/);
    // The learner leaves and joins another school; the old teacher cannot take them back.
    await as(applicant); await db.query('delete from public.org_members where org_id=$1 and user_id=$2', [org, applicant]);
    await db.query(`select public.join_with_code('aaaaaaaaaaaa')`);
    await assert.rejects(decide(teacherA, first.request_id, true), /already been decided/);
    await as(teacherA);
    assert.equal((await db.query('select * from public.grammar_results where user_id=$1', [applicant])).rows.length, 0);
    await assert.rejects(db.query(`select public.unlock_level($1,'C1',true)`, [applicant]), /not your student/);
    // While they belong to another school they cannot apply, so nothing stale can pile up.
    await as(applicant); await assert.rejects(db.query('select public.request_live_class($1)', [classA]), /leave your current school/);
    // Even an open application made before the move does not move them.
    await admin(); await db.query(`update public.live_class_requests set status='pending',decided_at=null where id=$1`, [first.request_id]);
    await assert.rejects(decide(teacherA, first.request_id, true), /joined another school/);
    await admin(); assert.equal((await one('select org_id from public.profiles where user_id=$1', [applicant])).org_id, otherOrg);
    assert.equal((await one('select status from public.live_class_requests where id=$1', [first.request_id])).status, 'pending');
    await decide(teacherA, first.request_id, false);
    // After leaving that school too, a fresh application works again.
    await as(applicant); await db.query('delete from public.org_members where org_id=$1 and user_id=$2', [otherOrg, applicant]);
    assert.equal((await apply()).status, 'pending');
    await decide(owner, first.request_id, true);
    await admin(); assert.equal((await one('select org_id from public.profiles where user_id=$1', [applicant])).org_id, org);
    // Left after being accepted: applying again reopens the application instead of staying "accepted".
    await as(applicant); await db.query('delete from public.org_members where org_id=$1 and user_id=$2', [org, applicant]);
    assert.equal((await apply()).status, 'pending');
    // Someone who has become a teacher is not enrolled as a learner.
    await admin(); await db.query(`update public.profiles set role='teacher' where user_id=$1`, [applicant]);
    await assert.rejects(decide(teacherA, first.request_id, true), /no longer be enrolled as a learner/);
  } finally { await db.close(); }
});

test('class notifications go to a confirmed staff mailbox, never to a free-text address', async () => {
  const t = await database(), { db, as, one, admin } = t;
  try {
    await school(t);
    await db.query(`update public.classes set live_open=true,term_name='Term',starts_on='2027-01-01',ends_on='2027-03-01',schedule='Mon'`);
    const applicant = id(140);
    await db.query(`insert into auth.users(id,email,email_confirmed_at) values($1,'applicant@example.invalid',now())`, [applicant]);
    const recipient = async cls => { await as(applicant); const r = (await one('select public.request_live_class($1) as r', [cls])).r; return (await one(`select public.teacher_mail_context($1,'fixture-secret') as c`, [r.request_id])).c.notification_email; };
    assert.equal(await recipient(classA), 'a@school.invalid');
    await admin(); await db.query(`update public.classes set notification_email='victim@elsewhere.invalid' where id=$1`, [classA]);
    assert.equal(await recipient(classA), 'a@school.invalid');
    await admin(); await db.query(`update public.classes set notification_email='Owner@School.invalid' where id=$1`, [classA]);
    assert.equal(await recipient(classA), 'owner@school.invalid');
    assert.equal(await recipient(classOwner), 'owner@school.invalid');
    // A teacher whose own mailbox is unproven is not written to; the owner is.
    await admin(); await db.query(`update auth.users set raw_app_meta_data='{"dk_email_verification_required":true}' where id=$1`, [teacherB]);
    await db.query(`update public.classes set notification_email='b@school.invalid' where id=$1`, [classB]);
    assert.equal(await recipient(classB), 'owner@school.invalid');
    await admin(); await db.query(`update auth.users set raw_app_meta_data='{"dk_email_verification_required":true}' where id=$1`, [owner]);
    assert.equal(await recipient(classB), null);
    await as(applicant); await assert.rejects(db.query(`select public.teacher_mail_context($1,'wrong')`, [id(1)]), /not authorised/);
    // An applicant without a proven mailbox cannot apply at all.
    await admin(); await db.query(`update auth.users set raw_app_meta_data='{"dk_email_verification_required":true}' where id=$1`, [applicant]);
    await as(applicant); await assert.rejects(db.query('select public.request_live_class($1)', [classOwner]), /confirm your email first/);
  } finally { await db.close(); }
});

test('an account made with somebody else’s address gains nothing from that person’s inbox', async () => {
  const t = await database(), { db, as, one, admin } = t;
  try {
    await school(t);
    await db.exec(`update app_private.signup_policy set immediate_access=true`);
    await db.query(`insert into public.invites(code,org_id,class_id,member_role,recipient_email,uses_left,created_by) values('bbbbbbbbbbbb',$1,$2,'student','victim@school.invalid',1,$3)`, [org, classA, owner]);
    await db.query(`insert into public.site_invites(code,role,email,created_by) values('cccccccccccc','teacher','victim@school.invalid',$1)`, [owner]);
    // Somebody registers the invited person's address with their own password and both codes.
    const squatter = id(150);
    await db.query(`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'victim@school.invalid',now(),'{"join":"bbbbbbbbbbbb","invite":"cccccccccccc","role":"teacher","name":"V"}')`, [squatter]);
    const state = async () => { await admin(); return { ...(await one('select role,org_id,requested_role from public.profiles where user_id=$1', [squatter])), verified: (await one('select app_private.email_is_verified($1) as v', [squatter])).v, members: (await one('select count(*)::int n from public.org_members where user_id=$1', [squatter])).n, pages: (await one('select count(*)::int n from public.orgs where owner=$1', [squatter])).n }; };
    assert.deepEqual(await state(), { role: 'learner', org_id: null, requested_role: null, verified: false, members: 0, pages: 0 });
    // Signed in, the account still cannot use the invitations, open a workspace or apply to a class.
    await as(squatter);
    await assert.rejects(db.query(`select public.join_with_code('bbbbbbbbbbbb')`), /confirm your email/);
    await assert.rejects(db.query(`select public.redeem_invite('cccccccccccc')`), /confirm your email/);
    assert.equal((await one(`select public.register_teaching_account('school','{"name":"Fake school"}') as id`)).id, null);
    await db.query('select public.complete_teacher_onboarding()');
    assert.equal((await state()).role, 'learner'); assert.equal((await state()).pages, 0);
    // The real owner of the address opens the link from their inbox without that account's session: nothing is confirmed.
    await as(null, 'anon'); const mail = (await one(`select public.claim_verification_mail('fixture-secret',$1) as j`, [squatter])).j[0];
    await assert.rejects(db.query('select public.confirm_email_token($1,$2)', [squatter, mail.token]), /sign in to this account/);
    await as(learner); await assert.rejects(db.query('select public.confirm_email_token($1,$2)', [squatter, mail.token]), /sign in to this account/);
    const after = await state();
    assert.equal(after.verified, false); assert.equal(after.members, 0); assert.equal(after.role, 'learner'); assert.equal(after.pages, 0);
    assert.equal((await one(`select uses_left from public.invites where code='bbbbbbbbbbbb'`)).uses_left, 1);
    assert.equal((await one(`select uses_left from public.site_invites where code='cccccccccccc'`)).uses_left, 1);
    // They can still stop the reminders from the link alone.
    await as(null, 'anon'); assert.equal((await one('select public.confirm_email_token($1,$2,true) as r', [squatter, mail.token])).r.stopped, true);
    // An honest new teacher: signs up, opens the link while signed in, and the workspace opens by itself.
    const honest = id(151);
    await admin(); await db.query(`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,'honest@teacher.invalid',now(),'{"role":"teacher","name":"Honest","info":{"about":"Hi"}}')`, [honest]);
    assert.equal((await one('select role,requested_role from public.profiles where user_id=$1', [honest])).requested_role, 'teacher');
    assert.equal((await one('select role from public.profiles where user_id=$1', [honest])).role, 'learner');
    await as(honest); await db.query('select public.complete_teacher_onboarding()');
    await as(null, 'anon'); const own = (await one(`select public.claim_verification_mail('fixture-secret',$1) as j`, [honest])).j[0];
    await as(honest); assert.equal((await one('select public.confirm_email_token($1,$2) as r', [honest, own.token])).r.verified, true);
    await admin();
    const ready = await one('select role,requested_role,org_id from public.profiles where user_id=$1', [honest]);
    assert.equal(ready.role, 'teacher'); assert.equal(ready.requested_role, null); assert.ok(ready.org_id);
    assert.equal((await one('select about from public.orgs where id=$1', [ready.org_id])).about, 'Hi');
    // An honest learner who decides to teach later, with a proven mailbox, gets the page at once.
    await as(learner); await db.query('delete from public.org_members where user_id=$1', [learner]);
    assert.ok((await one(`select public.register_teaching_account('teacher','{"name":"Learner turned teacher"}') as id`)).id);
  } finally { await db.close(); }
});
