-- Run ONLY in the disposable local database from school-security.sh.
-- Fixed fixture IDs keep failing assertions easy to trace. Roll back all test rows.
begin;
create function pg_temp.check_ok(ok boolean, problem text) returns void language plpgsql as $$
begin if ok is not true then raise exception 'TEST FAILED: %',problem; end if; end $$;

insert into auth.users(id) values ('00000000-0000-4000-ab00-000000000001'),
 ('00000000-0000-4000-ab00-000000000002'),('00000000-0000-4000-ab00-000000000003');
insert into public.orgs(id,owner,kind,name) values
 ('00000000-0000-4000-ab00-000000000011','00000000-0000-4000-ab00-000000000001','school','School A'),
 ('00000000-0000-4000-ab00-000000000012','00000000-0000-4000-ab00-000000000002','school','School B');
insert into public.classes(id,org_id,name,level) values
 ('00000000-0000-4000-ab00-000000000021','00000000-0000-4000-ab00-000000000011','A class','A1'),
 ('00000000-0000-4000-ab00-000000000022','00000000-0000-4000-ab00-000000000012','B class','B1');
insert into public.invites(code,created_by,org_id,class_id,uses_left)
 select 'class'||right(id::text,2),case right(id::text,2) when '21' then '00000000-0000-4000-ab00-000000000001'::uuid
 else '00000000-0000-4000-ab00-000000000002'::uuid end,org_id,id,1 from public.classes;
insert into public.assignments(created_by,class_id,title)
 select o.owner,c.id,c.name from public.classes c join public.orgs o on c.org_id=o.id;

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000003',true);
select public.join_with_code('class21');
select public.join_with_code('class21'); -- same person retries an exhausted code
insert into public.grammar_results(chapter,exercise,score,total,passed) values(1,'u1',1,1,true);
select pg_temp.check_ok((select count(*)=1 from public.assignments where title='A class'),'learner reads A assignment');
select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000001',true);
select pg_temp.check_ok((select count(*)=1 from public.grammar_results),'current school reads attempt');
select pg_temp.check_ok((select uses_left=0 from public.invites where code='class21'),'one invite use consumed');
do $$ begin
  begin
    insert into public.invites(org_id,class_id) values('00000000-0000-4000-ab00-000000000011','00000000-0000-4000-ab00-000000000022');
    raise exception 'wrong-school invite accepted';
  exception when foreign_key_violation then null; end;
  begin
    update public.org_members set class_id='00000000-0000-4000-ab00-000000000022' where org_id='00000000-0000-4000-ab00-000000000011';
    raise exception 'wrong-school membership accepted';
  exception when foreign_key_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000003',true);
select public.join_with_code('class22');
select pg_temp.check_ok((select count(*)=1 and min(title)='B class' from public.assignments),'transferred learner sees only B assignments');
do $$ begin
  begin perform public.join_with_code('class21'); raise exception 'old code reinstated school';
  exception when raise_exception then if sqlerrm not like 'invitation already used%' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000001',true);
select pg_temp.check_ok((select count(*)=0 from public.profiles where user_id='00000000-0000-4000-ab00-000000000003'),'former school cannot read learner profile');
select pg_temp.check_ok((select count(*)=0 from public.grammar_results),'former school cannot read history');
do $$ begin
  begin perform public.unlock_level('00000000-0000-4000-ab00-000000000003','C1',true); raise exception 'old school unlocked';
  exception when raise_exception then if sqlerrm <> 'not your student' then raise; end if; end;
  begin perform public.set_student_level('00000000-0000-4000-ab00-000000000003','C1'); raise exception 'old school changed course';
  exception when raise_exception then if sqlerrm <> 'not your student' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000002',true);
select public.unlock_level('00000000-0000-4000-ab00-000000000003','B2',true);
select pg_temp.check_ok((select count(*)=1 from public.grammar_results),'current teacher can see practice history');
delete from public.classes where id='00000000-0000-4000-ab00-000000000022';
select pg_temp.check_ok((select class_id is null from public.org_members where org_id='00000000-0000-4000-ab00-000000000012'),'deleting class keeps membership');
select pg_temp.check_ok((select count(*)=0 from public.invites where code='class22'),'class invite deleted with class');

reset role;
insert into public.site_invites(code,role,created_by,email,name) values
 ('staff-link','teacher','00000000-0000-4000-ab00-000000000001','Teacher@EXAMPLE.invalid','Private Name');
set local role anon;
select pg_temp.check_ok((public.invite_preview('staff-link')::jsonb->>'role')='teacher' and
 not (public.invite_preview('staff-link')::jsonb ?| array['name','email']),'anonymous preview omits contact details');
select pg_temp.check_ok(not has_table_privilege(current_user,'public.site_invite_receipts','SELECT'),'anon cannot read receipts');
reset role;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-ab00-000000000004','teacher@example.invalid','{"invite":"staff-link"}');
select pg_temp.check_ok((select role='learner' from public.profiles where user_id='00000000-0000-4000-ab00-000000000004'),'unconfirmed user not promoted');
update auth.users set email='wrong@example.invalid',email_confirmed_at=now() where id='00000000-0000-4000-ab00-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000003',true);
do $$ begin
  begin perform public.redeem_invite('staff-link'); raise exception 'wrong user accepted a named invitation';
  exception when raise_exception then if sqlerrm <> 'confirm the e-mail address for this invitation' then raise; end if; end;
end $$;
reset role;
update auth.users set email_confirmed_at=now() where id='00000000-0000-4000-ab00-000000000004';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-ab00-000000000004',true);
select public.redeem_invite('staff-link');
select pg_temp.check_ok((select role='teacher' from public.profiles where user_id=auth.uid()),'matching confirmed invite promotes teacher');
reset role;
select pg_temp.check_ok((select uses_left=0 and used_count=1 from public.site_invites where code='staff-link'),'signup, confirmation and retries charge once');
rollback;
