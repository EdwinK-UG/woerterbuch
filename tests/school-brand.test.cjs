const {test}=require('node:test');const assert=require('node:assert/strict'),fs=require('node:fs');const {PGlite}=require('@electric-sql/pglite');
test('school contact remains owner-controlled and welcome branding requires the server secret and confirmed identity',async()=>{
 const db=new PGlite();try{
 await db.exec(fs.readFileSync('tests/school-security-bootstrap.sql','utf8'));await db.exec(fs.readFileSync('supabase_setup.sql','utf8'));await db.exec(fs.readFileSync('accounts_setup.sql','utf8'));
 for(const file of fs.readdirSync('supabase/migrations').filter(f=>!f.endsWith('_welcome_delivery.sql')).sort())await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 await db.exec(`create schema vault;create table vault.decrypted_secrets(name text,decrypted_secret text);insert into vault.decrypted_secrets values('deutschklinik_welcome_hook','fixture-secret');
 insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-4000-ab00-000000000001','owner@example.invalid',now()),('00000000-0000-4000-ab00-000000000002','learner@example.invalid',now()),('00000000-0000-4000-ab00-000000000003','unconfirmed@example.invalid',null);
 insert into public.orgs(id,owner,kind,name,theme,contact_email) values('00000000-0000-4000-ab00-000000000011','00000000-0000-4000-ab00-000000000001','school','Gold School','#ac8935','help@example.invalid');
 update public.profiles set org_id='00000000-0000-4000-ab00-000000000011',display_name='A learner' where user_id='00000000-0000-4000-ab00-000000000002';
 update auth.users set raw_user_meta_data='{"role":"school","info":{"name":"Forged School"}}' where id='00000000-0000-4000-ab00-000000000002';
 set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000002',false);`);
 assert.equal((await db.query(`update public.orgs set contact_email='attacker@example.invalid' where id='00000000-0000-4000-ab00-000000000011' returning id`)).rows.length,0);
 assert.equal((await db.query('select public.my_org() as o')).rows[0].o.contact_email,'help@example.invalid');
 await db.exec(`reset role;set role anon;select set_config('request.jwt.claim.sub','',false)`);
 await assert.rejects(db.query(`select public.welcome_brand_context('00000000-0000-4000-ab00-000000000002','wrong')`),/not authorised/);
 const context=(await db.query(`select public.welcome_brand_context('00000000-0000-4000-ab00-000000000002','fixture-secret') as c`)).rows[0].c;
 assert.equal(context.role,'learner');assert.equal(context.org.name,'Gold School');assert.equal(context.org.contact_email,'help@example.invalid');assert.ok(!JSON.stringify(context).includes('learner@example.invalid'));assert.ok(!JSON.stringify(context).includes('Forged School'));
 assert.deepEqual((await db.query(`select public.welcome_brand_context('00000000-0000-4000-ab00-000000000003','fixture-secret') as c`)).rows[0].c,{});
 await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000001',false);update public.orgs set contact_email='new-help@example.invalid' where id='00000000-0000-4000-ab00-000000000011';reset role;set role anon;`);
 assert.equal((await db.query(`select public.org_page('00000000-0000-4000-ab00-000000000011') as o`)).rows[0].o.contact_email,'new-help@example.invalid');
 }finally{await db.close()}
});
