const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');

test('teacher contact requires both the server mail secret and the application owner', async () => {
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync('tests/school-security-bootstrap.sql', 'utf8'));
    await db.exec(`create schema vault;
      create table vault.decrypted_secrets(name text, decrypted_secret text);
      insert into vault.decrypted_secrets values('deutschklinik_welcome_hook','fixture-mail-secret');
      create table public.orgs(id uuid, owner uuid);
      create table public.classes(id uuid, org_id uuid, teacher_id uuid, notification_email text);
      create table public.live_class_requests(id uuid, class_id uuid, user_id uuid);
      insert into auth.users(id,email) values ('00000000-0000-4000-ab00-000000000001','teacher@example.invalid');
      insert into public.orgs values('00000000-0000-4000-ab00-000000000002','00000000-0000-4000-ab00-000000000001');
      insert into public.classes values('00000000-0000-4000-ab00-000000000003','00000000-0000-4000-ab00-000000000002',null,null);
      insert into public.live_class_requests values('00000000-0000-4000-ab00-000000000004','00000000-0000-4000-ab00-000000000003','00000000-0000-4000-ab00-000000000005');`);
    await db.exec(fs.readFileSync('supabase/migrations/20261103095416_teacher_mail_context.sql','utf8'));
    const query = "select public.teacher_mail_context('00000000-0000-4000-ab00-000000000004', $1) as context";
    await db.exec("set role anon");
    await assert.rejects(db.query(query,['fixture-mail-secret']), /permission denied/);
    await db.exec("reset role; set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000005',false)");
    await assert.rejects(db.query(query,['wrong-secret']), /not authorised/);
    assert.deepEqual((await db.query(query,['fixture-mail-secret'])).rows[0].context, {notification_email:'teacher@example.invalid'});
    await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000006',false)");
    await assert.rejects(db.query(query,['fixture-mail-secret']), /not authorised/);
  } finally { await db.close(); }
});
