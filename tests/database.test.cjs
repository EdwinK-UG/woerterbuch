const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
const read = (file) => fs.readFileSync(file, "utf8");
test("SQL upgrades replay safely and enforce school, save and attempt boundaries", async () => {
  const db = new PGlite();
  try {
    await db.exec(read("tests/school-security-bootstrap.sql"));
    for (let pass = 0; pass < 2; pass++) {
      await db.exec(read("supabase_setup.sql"));
      await db.exec(read("accounts_setup.sql"));
      // The hosted pg_net/Vault integration has a separate webhook test with stubs.
      for (const file of fs.readdirSync("supabase/migrations").filter(f => !f.endsWith("_welcome_delivery.sql")).sort())
        await db.exec(read("supabase/migrations/" + file));
    }
    await db.exec(read("tests/school-security.sql"));
    const a = "00000000-0000-4000-ab00-000000000051",
      b = "00000000-0000-4000-ab00-000000000052";
    await db.exec(
      "insert into auth.users(id) values ('" +
        a +
        "'),('" +
        b +
        "');set role authenticated;select set_config('request.jwt.claim.sub','" +
        a +
        "',false)",
    );
    const attempt =
      "insert into public.grammar_results(attempt_id,chapter,exercise,score,total,passed) values('00000000-0000-4000-ab00-000000000061',1,'u1',1,1,true) on conflict(user_id,attempt_id) do nothing";
    await db.exec(attempt);
    await db.exec(attempt);
    assert.equal(
      (await db.query("select count(*)::int n from public.grammar_results"))
        .rows[0].n,
      1,
    );
    await db.exec(
      "insert into public.grammar_results(chapter,exercise,score,total,passed) select 2,'u1',1,1,true from generate_series(1,1505)",
    );
    const summary = await db.query(
      "select * from public.practice_summary($1::uuid[])",
      [[a]],
    );
    assert.equal(summary.rows.length, 2);
    assert.equal(Number(summary.rows[1].attempt_count), 1505);
    await db.exec(
      "insert into public.user_data(lists,prefs) values('{\"one\":1}','{\"quizzes\":{}}')",
    );
    await db.exec(
      "update public.user_data set lists='{\"two\":2}' where revision=0",
    );
    assert.equal(
      (await db.query("select revision::int from public.user_data")).rows[0]
        .revision,
      1,
    );
    assert.equal(
      (
        await db.query(
          "update public.user_data set lists='{}' where revision=0 returning *",
        )
      ).rows.length,
      0,
    );
    await db.exec(
      "select set_config('request.jwt.claim.sub','" + b + "',false)",
    );
    assert.equal(
      (
        await db.query("select * from public.practice_summary($1::uuid[])", [
          [a],
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from public.user_data")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});

test('confirmed teachers self-activate; addressed class invitations enrol only the confirmed recipient',async()=>{
  const db=new PGlite();
  try{
    await db.exec(read('tests/school-security-bootstrap.sql'));
    await db.exec(read('supabase_setup.sql'));await db.exec(read('accounts_setup.sql'));
    for(const file of fs.readdirSync('supabase/migrations').filter(f=>!f.endsWith('_welcome_delivery.sql')).sort())await db.exec(read('supabase/migrations/'+file));
    const teacher='00000000-0000-4000-ab00-000000000071',learner='00000000-0000-4000-ab00-000000000072',other='00000000-0000-4000-ab00-000000000073';
    await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,'teacher@example.invalid','{"role":"teacher","name":"A teacher","info":{"about":"Patient and practical","languages":"English, German"}}')`,[teacher]);
    assert.equal((await db.query('select role from public.profiles where user_id=$1',[teacher])).rows[0].role,'learner');
    await db.query('update auth.users set email_confirmed_at=now() where id=$1',[teacher]);
    const profile=(await db.query('select role,org_id from public.profiles where user_id=$1',[teacher])).rows[0];assert.equal(profile.role,'teacher');assert.ok(profile.org_id);
    assert.equal((await db.query('select about from public.orgs where id=$1',[profile.org_id])).rows[0].about,'Patient and practical');
    await db.query(`update auth.users set raw_user_meta_data='{"role":"founder"}' where id=$1`,[teacher]);
    await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[teacher]);
    await db.query('select public.complete_teacher_onboarding()');
    await assert.rejects(db.query("select public.register_teaching_account('founder','{}')"),/choose teacher or school/);
    await assert.rejects(db.query('select public.owner_accounts()'),/owner only/);
    await db.exec('reset role');
    const classId=(await db.query("insert into public.classes(org_id,name,level) values($1,'B1 evening','B1') returning id",[profile.org_id])).rows[0].id;
    await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[teacher]);
    const addressed=(await db.query("insert into public.invites(org_id,class_id,member_role,level,recipient_email,uses_left) values($1,$2,'student','B1','learner@example.invalid',1) returning code",[profile.org_id,classId])).rows[0].code;
    await db.exec('reset role');
    await db.query("update public.invites set code='abcdef123456' where code=$1",[addressed]);
    await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,'learner@example.invalid','{"join":"abcdef123456"}'),($2,'other@example.invalid','{"join":"abcdef123456"}')`,[learner,other]);
    assert.equal((await db.query('select count(*)::int n from public.org_members')).rows[0].n,0);
    await db.query('update auth.users set email_confirmed_at=now() where id=$1',[other]);
    assert.equal((await db.query('select count(*)::int n from public.org_members')).rows[0].n,0);
    await db.query('update auth.users set email_confirmed_at=now() where id=$1',[learner]);
    const enrolled=(await db.query('select org_id,level,unlocked from public.profiles where user_id=$1',[learner])).rows[0];assert.equal(enrolled.org_id,profile.org_id);assert.equal(enrolled.level,'B1');assert.deepEqual(enrolled.unlocked,['B1']);
    assert.equal((await db.query('select class_id from public.org_members where user_id=$1',[learner])).rows[0].class_id,classId);
    await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[learner]);await db.query("select public.join_with_code('abcdef123456')");
    await db.exec('reset role');assert.equal((await db.query("select uses_left from public.invites where code='abcdef123456'")).rows[0].uses_left,0);
    // A new identity cannot give itself owner privileges through signup metadata.
    await db.exec(`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values('00000000-0000-4000-ab00-000000000074','fake@example.invalid',now(),'{"role":"founder"}')`);
    assert.equal((await db.query("select role from public.profiles where user_id='00000000-0000-4000-ab00-000000000074'")).rows[0].role,'learner');
    await db.query('insert into public.app_admins(user_id) values($1)',[teacher]);
    await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[teacher]);
    const directory=(await db.query('select public.owner_accounts() as value')).rows[0].value;
    assert.equal(directory.total,4);assert.equal(directory.users.find(u=>u.id===teacher).protected,true);
    await db.exec('reset role;set role anon');await assert.rejects(db.query('select public.owner_accounts()'),/permission denied/);
  }finally{await db.close();}
});
