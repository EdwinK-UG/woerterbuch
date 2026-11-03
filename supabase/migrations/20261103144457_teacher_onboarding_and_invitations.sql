begin;
-- Student email invitations are bound to the confirmed recipient. Shared links remain available.
alter table public.invites add column if not exists recipient_email text;
do $$ begin
  if not exists(select from pg_constraint where conrelid='public.invites'::regclass and conname='invite_recipient_email_valid') then
    alter table public.invites add constraint invite_recipient_email_valid check (recipient_email is null or (length(recipient_email)<=120 and recipient_email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+$'));
  end if;
end $$;
create schema if not exists app_private;
revoke all on schema app_private from public,anon;
grant usage on schema app_private to authenticated;

-- Open teacher/school registration is an explicit product policy. Only these two
-- roles can be self-activated; owner access still requires app_admins. Decisions
-- use the database profile and confirmed Auth row, never JWT user_metadata.
create or replace function app_private.finish_onboarding(p_uid uuid) returns void
language plpgsql security definer set search_path='' as $$
declare p public.profiles; u auth.users; m jsonb;
begin
  select * into u from auth.users where id=p_uid and email_confirmed_at is not null;
  if not found then return; end if;
  select * into p from public.profiles where user_id=p_uid for update;
  if p.role='learner' and p.requested_role in ('teacher','school') then
    update public.profiles set role=p.requested_role,requested_role=null where user_id=p_uid;
    perform public._make_org(p_uid,p.requested_role,p.request_info);
  end if;
  m:=coalesce(u.raw_user_meta_data,'{}'::jsonb);
  -- These are bearer invitation codes, checked transactionally against stored
  -- class, recipient, expiry and receipt records by the redemption functions.
  if nullif(btrim(m->>'invite'),'') is not null then
    begin perform public._redeem_site_invite(p_uid,m->>'invite'); exception when others then raise warning 'Signup invitation not redeemed'; end;
  end if;
  if nullif(btrim(m->>'join'),'') is not null then
    begin perform public._join(p_uid,m->>'join'); exception when others then raise warning 'Class invitation not redeemed'; end;
  end if;
end $$;
revoke all on function app_private.finish_onboarding(uuid) from public,anon,authenticated;

create or replace function app_private.complete_teacher_onboarding() returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not exists(select from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'confirm your email first'; end if;
  perform app_private.finish_onboarding(auth.uid());
end $$;
revoke all on function app_private.complete_teacher_onboarding() from public,anon;
grant execute on function app_private.complete_teacher_onboarding() to authenticated;
create or replace function public.complete_teacher_onboarding() returns void
language sql security invoker set search_path='' as $$ select app_private.complete_teacher_onboarding(); $$;
revoke all on function public.complete_teacher_onboarding() from public,anon;
grant execute on function public.complete_teacher_onboarding() to authenticated;

create or replace function app_private.register_teaching_account(p_kind text,p_info jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare p public.profiles; oid uuid;
begin
  if auth.uid() is null or not exists(select from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'confirm your email first'; end if;
  if p_kind not in ('teacher','school') or p_kind is null then raise exception 'choose teacher or school'; end if;
  if jsonb_typeof(p_info) is distinct from 'object' or octet_length(p_info::text)>4000 then raise exception 'invalid page details'; end if;
  select * into p from public.profiles where user_id=auth.uid() for update;
  if not found then raise exception 'profile unavailable'; end if;
  if p.role='founder' then raise exception 'owner accounts cannot be changed here'; end if;
  if p.role<>'learner' and p.role<>p_kind then raise exception 'use your existing teaching account'; end if;
  update public.profiles set role=p_kind,requested_role=null,request_info=p_info where user_id=auth.uid();
  oid:=public._make_org(auth.uid(),p_kind,p_info);
  return oid;
end $$;
revoke all on function app_private.register_teaching_account(text,jsonb) from public,anon;
grant execute on function app_private.register_teaching_account(text,jsonb) to authenticated;
create or replace function public.register_teaching_account(p_kind text,p_info jsonb) returns uuid
language sql security invoker set search_path='' as $$ select app_private.register_teaching_account(p_kind,p_info); $$;
revoke all on function public.register_teaching_account(text,jsonb) from public,anon;
grant execute on function public.register_teaching_account(text,jsonb) to authenticated;

create or replace function public._join(p_uid uuid, p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare i public.invites; o public.orgs; lv text;
begin
  select * into i from public.invites where code = lower(trim(p_code)) for update;
  if not found then raise exception 'invalid code'; end if;
  select * into o from public.orgs where id = i.org_id;
  lv := coalesce((select level from public.classes where id = i.class_id and org_id=i.org_id), i.level);
  if exists(select from public.org_invite_receipts r where r.code=i.code and r.user_id=p_uid) then
    -- Do not reinstate a removed member or overwrite a later class/school change.
    if not exists(select from public.org_members m join public.profiles p on p.user_id=m.user_id
                  where m.org_id=i.org_id and m.user_id=p_uid and p.org_id=i.org_id) then
      raise exception 'invitation already used; ask for a new link';
    end if;
    return json_build_object('org',o.name,'kind',o.kind,'role',i.member_role,'level',lv);
  end if;
  if i.uses_left <= 0 or i.expires_at <= now() then raise exception 'invalid code'; end if;
  if i.class_id is not null and not exists(select from public.classes c where c.id=i.class_id and c.org_id=i.org_id) then
    raise exception 'invalid class invitation';
  end if;
  if i.recipient_email is not null and not exists(select from auth.users u where u.id=p_uid and u.email_confirmed_at is not null and lower(u.email)=lower(i.recipient_email)) then
    raise exception 'confirm the e-mail address for this invitation';
  end if;
  perform set_config('app.join', '1', true);   -- lets the level trigger accept the level from the invite
  insert into public.profiles (user_id) values (p_uid) on conflict (user_id) do nothing;
  insert into public.org_members (org_id, user_id, member_role, class_id) values (i.org_id, p_uid, i.member_role, i.class_id)
    on conflict (org_id, user_id) do update set member_role = excluded.member_role, class_id = coalesce(excluded.class_id, org_members.class_id);
  -- a class link is the teacher's "yes" for that level: it is unlocked at once
  update public.profiles set org_id = i.org_id,
    level = case when i.member_role = 'student' and lv is not null then lv else level end,
    unlocked = case when i.member_role = 'student' and lv is not null then public.lv_sort(unlocked || lv) else unlocked end,
    role = case when i.member_role = 'teacher' and role = 'learner' then 'teacher' else role end
    where user_id = p_uid;
  insert into public.org_invite_receipts(code,user_id) values(i.code,p_uid);
  update public.invites set uses_left = uses_left - 1 where code = i.code;
  perform set_config('app.join', '', true);
  return json_build_object('org', o.name, 'kind', o.kind, 'role', i.member_role, 'level', lv);
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb); lv text := m->>'level'; r text := m->>'role'; inf jsonb := m->'info';
begin
  begin
    insert into public.profiles (user_id, display_name, level, unlocked, ui_lang, requested_role, request_info) values (
      new.id, left(nullif(trim(m->>'name'), ''), 60),
      case when lv in ('A1', 'A2', 'B1', 'B2', 'C1') then lv end,
      case when lv in ('A1', 'A2', 'B1', 'B2', 'C1') and coalesce(m->>'join', '') = '' then array[lv] else '{}'::text[] end,
      case when m->>'lang' in ('en', 'de') then m->>'lang' else 'auto' end,
      case when r in ('teacher', 'school') and coalesce(m->>'invite', '') = '' then r end,
      case when r in ('teacher', 'school') and jsonb_typeof(inf) = 'object' and octet_length(inf::text) < 4000 then inf end)
    on conflict (user_id) do nothing;
  exception when others then raise warning 'handle_new_user profile: %', sqlerrm;
  end;
  if new.email_confirmed_at is not null then perform app_private.finish_onboarding(new.id); end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created_woerterbuch on auth.users;
create trigger on_auth_user_created_woerterbuch after insert on auth.users for each row execute function public.handle_new_user();


create or replace function public.finish_confirmed_invite() returns trigger
language plpgsql security definer set search_path='' as $$
begin perform app_private.finish_onboarding(new.id); return new; end $$;
revoke all on function public.finish_confirmed_invite() from public,anon,authenticated;

-- Enrich the invitation landing page, without publishing learner contact details.
create or replace function public.invite_preview(p_code text) returns json
language sql stable security definer set search_path='' as $$
 select coalesce(
  (select json_build_object('type','org','role',i.member_role,'level',coalesce(c.level,i.level),'class',c.name,'org',o.name,'org_id',o.id,'kind',o.kind,'logo_url',o.logo_url,'theme',o.theme,'tagline',o.tagline,'term_name',c.term_name,'starts_on',c.starts_on,'ends_on',c.ends_on,'schedule',c.schedule,'course_details',c.course_details)
    from public.invites i join public.orgs o on o.id=i.org_id left join public.classes c on c.id=i.class_id and c.org_id=i.org_id
    where i.code=lower(btrim(p_code)) and i.uses_left>0 and i.expires_at>now()),
  (select json_build_object('type','site','role',s.role,'level',s.level) from public.site_invites s where s.code=lower(btrim(p_code)) and s.uses_left>0 and s.expires_at>now()));
$$;
revoke all on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon,authenticated;

create or replace function public.my_org() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'logo_url', o.logo_url, 'theme', o.theme, 'pass_mark', o.pass_mark,
    'tagline', o.tagline, 'about', o.about, 'welcome', o.welcome, 'city', o.city, 'country', o.country, 'website', o.website,
    'org_type', o.org_type, 'languages', o.languages, 'cover', o.cover, 'owner', o.owner = auth.uid(),
    'owner_name', case when o.kind = 'teacher' then (select display_name from public.profiles where user_id = o.owner) end,
    'class', (select json_build_object('id', c.id, 'name', c.name, 'level', c.level, 'pass_mark', c.pass_mark, 'term_name',c.term_name, 'starts_on',c.starts_on, 'ends_on',c.ends_on, 'schedule',c.schedule, 'course_details',c.course_details, 'meeting_details',c.meeting_details)
              from public.org_members m join public.classes c on c.id = m.class_id and c.org_id=m.org_id where m.org_id = o.id and m.user_id = auth.uid()))
  from public.profiles p join public.orgs o on o.id = p.org_id where p.user_id = auth.uid();
$$;

create or replace function public.org_public_terms(p_org uuid) returns json
language sql stable security definer set search_path='' as $$
 select coalesce(json_agg(json_build_object('id',c.id,'name',c.name,'level',c.level,'term_name',c.term_name,'starts_on',c.starts_on,'ends_on',c.ends_on,'schedule',c.schedule,'course_details',c.course_details) order by c.starts_on),'[]'::json)
 from public.classes c where c.org_id=p_org and c.live_open;
$$;
revoke all on function public.org_public_terms(uuid) from public;
grant execute on function public.org_public_terms(uuid) to anon,authenticated;

-- Owner-only directory and deletion impact. No anonymous directory or private emails in public teacher pages.
create or replace function app_private.owner_accounts(p_search text default '',p_offset int default 0,p_user uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.is_founder() then raise exception 'owner only'; end if;
 select jsonb_build_object('total',(select count(*) from auth.users u where (p_user is null or u.id=p_user) and (coalesce(p_search,'')='' or position(lower(left(p_search,120)) in lower(coalesce(u.email,'')))>0)),
  'users',coalesce(jsonb_agg(x),'[]'::jsonb)) into result from (
    select u.id,u.email,p.display_name,p.role,u.email_confirmed_at,u.created_at,
      (u.id=auth.uid() or exists(select from public.app_admins a where a.user_id=u.id)) as protected,
      (select count(*) from public.orgs o where o.owner=u.id) as pages,
      (select count(*) from public.classes c join public.orgs o on o.id=c.org_id where o.owner=u.id) as classes,
      (select count(*) from public.org_members m join public.orgs o on o.id=m.org_id where o.owner=u.id and m.user_id<>u.id) as memberships
    from auth.users u left join public.profiles p on p.user_id=u.id
    where (p_user is null or u.id=p_user) and (coalesce(p_search,'')='' or position(lower(left(p_search,120)) in lower(coalesce(u.email,'')))>0)
    order by u.created_at desc,u.id limit 50 offset greatest(0,least(coalesce(p_offset,0),100000))
  )x;
 return result;
end $$;
revoke all on function app_private.owner_accounts(text,int,uuid) from public,anon;
grant execute on function app_private.owner_accounts(text,int,uuid) to authenticated;
create or replace function public.owner_accounts(p_search text default '',p_offset int default 0,p_user uuid default null) returns jsonb
language sql stable security invoker set search_path='' as $$ select app_private.owner_accounts(p_search,p_offset,p_user); $$;
revoke all on function public.owner_accounts(text,int,uuid) from public,anon;
grant execute on function public.owner_accounts(text,int,uuid) to authenticated;

-- Finish any previously requested, already confirmed teaching account once.
do $$ declare r record; begin
 for r in select p.user_id from public.profiles p join auth.users u on u.id=p.user_id where p.role='learner' and p.requested_role in ('teacher','school') and u.email_confirmed_at is not null loop
  perform app_private.finish_onboarding(r.user_id);
 end loop;
end $$;
commit;
