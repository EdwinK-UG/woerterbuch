-- Upgrade for the supplied accounts schema at 898b89a, PostgreSQL 15+.
-- Fresh installs use supabase_setup.sql then accounts_setup.sql. See docs/school-security-rollout.md.
begin;

-- 2026-11-02 school boundaries & invite receipts; PostgreSQL 15+.
-- Refuse ambiguous legacy rows; see docs/school-security-rollout.md for inspection.
do $$ begin
  if exists (select from public.org_members m join public.classes c on c.id=m.class_id where c.org_id<>m.org_id)
     or exists (select from public.invites i join public.classes c on c.id=i.class_id where c.org_id<>i.org_id) then
    raise exception 'cross-school class references exist; inspect docs/school-security-rollout.md before migration';
  end if;
end $$;
create unique index if not exists classes_org_id_id on public.classes (org_id,id);
alter table public.org_members drop constraint if exists org_members_class_id_fkey;
alter table public.invites drop constraint if exists invites_class_id_fkey;
do $$ begin
  if not exists(select from pg_constraint where conrelid='public.org_members'::regclass and conname='members_class_in_org') then
    alter table public.org_members add constraint members_class_in_org foreign key (org_id,class_id)
      references public.classes (org_id,id) on delete set null (class_id);
  end if;
  if not exists(select from pg_constraint where conrelid='public.invites'::regclass and conname='invites_class_in_org') then
    alter table public.invites add constraint invites_class_in_org foreign key (org_id,class_id)
      references public.classes (org_id,id) on delete cascade;
  end if;
end $$;

-- Private receipts are written only by the two locked redemption transactions.
create table if not exists public.org_invite_receipts (
  code text not null references public.invites(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key(code,user_id)
);
create table if not exists public.site_invite_receipts (
  code text not null references public.site_invites(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key(code,user_id)
);
alter table public.org_invite_receipts enable row level security;
alter table public.site_invite_receipts enable row level security;
revoke all on public.org_invite_receipts, public.site_invite_receipts from public, anon, authenticated;

create or replace function public.is_org_member(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select from public.org_members m where m.org_id = o and m.user_id = auth.uid()
    and (m.member_role='teacher' or exists(select from public.profiles p where p.user_id=m.user_id and p.org_id=o)));
$$;
-- Checks both the caller's staff role and the student's active school; no membership-discovery oracle.
create or replace function public.staff_controls_student(u uuid, o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_org_staff(o) and exists(
    select from public.org_members m join public.profiles p on p.user_id=m.user_id and p.org_id=m.org_id
    where m.user_id=u and m.org_id=o and m.member_role='student');
$$;
revoke all on function public.staff_controls_student(uuid,uuid) from public, anon;
grant execute on function public.staff_controls_student(uuid,uuid) to authenticated;

drop policy if exists "profiles: staff select" on public.profiles;
create policy "profiles: staff select" on public.profiles for select to authenticated
  using (exists (select 1 from public.org_members m where m.user_id = profiles.user_id and m.org_id = profiles.org_id and public.is_org_staff(m.org_id)));

drop policy if exists "members: read" on public.org_members;
create policy "members: read" on public.org_members for select to authenticated
  using (user_id = (select auth.uid()) or (public.is_org_staff(org_id)
    and (member_role='teacher' or public.staff_controls_student(user_id,org_id))));

drop policy if exists "assignments: read" on public.assignments;
create policy "assignments: read" on public.assignments for select to authenticated
  using (public.is_org_staff(public.class_org(class_id))
         or exists (select 1 from public.org_members m where m.user_id = (select auth.uid()) and m.class_id = assignments.class_id and m.org_id = public.class_org(assignments.class_id) and public.is_org_member(m.org_id)));

-- results: teachers and the school can read the results of their members
-- (only if the grammar results table from supabase_setup.sql exists)
do $$ begin
  if to_regclass('public.grammar_results') is not null then
    execute 'drop policy if exists "results: staff select" on public.grammar_results';
    execute 'create policy "results: staff select" on public.grammar_results for select to authenticated
      using (exists (select 1 from public.org_members m where m.user_id = grammar_results.user_id and public.staff_controls_student(m.user_id,m.org_id)))';
  end if;
end $$;

-- join a school or a teacher with an invite code
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

-- use an invitation from the founder
create or replace function public._redeem_site_invite(p_uid uuid, p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare s public.site_invites; inf jsonb;
begin
  select * into s from public.site_invites where code = lower(trim(p_code)) for update;
  if not found then raise exception 'invalid code'; end if;
  if exists(select from public.site_invite_receipts r where r.code=s.code and r.user_id=p_uid) then
    return json_build_object('role', s.role, 'level', s.level);
  end if;
  if s.uses_left <= 0 or s.expires_at <= now() then raise exception 'invalid code'; end if;
  if nullif(btrim(s.email),'') is not null and not exists(select from auth.users u where u.id=p_uid
      and u.email_confirmed_at is not null and lower(btrim(u.email))=lower(btrim(s.email))) then
    raise exception 'confirm the e-mail address for this invitation';
  end if;
  insert into public.profiles (user_id) values (p_uid) on conflict (user_id) do nothing;
  if s.role in ('teacher', 'school') then
    update public.profiles set role = s.role, requested_role = null where user_id = p_uid and role = 'learner';
    select coalesce(request_info, '{}'::jsonb) into inf from public.profiles where user_id = p_uid;
    if s.role = 'school' and coalesce(inf->>'name', '') = '' and s.name is not null then inf := inf || jsonb_build_object('name', s.name); end if;
    perform public._make_org(p_uid, s.role, inf);
  elsif s.level is not null then
    update public.profiles set level = s.level, unlocked = public.lv_sort(unlocked || s.level) where user_id = p_uid and org_id is null;
  end if;
  insert into public.site_invite_receipts(code,user_id) values(s.code,p_uid);
  update public.site_invites set uses_left = uses_left - 1, used_count = used_count + 1 where code = s.code;
  return json_build_object('role', s.role, 'level', s.level);
end $$;

-- new account: create the profile from what the sign-up form sent (name, role, level, language, details, codes)
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
  if coalesce(m->>'invite', '') <> '' and (new.email_confirmed_at is not null or not exists
     (select from public.site_invites s where s.code=lower(trim(m->>'invite')) and nullif(btrim(s.email),'') is not null)) then
    begin perform public._redeem_site_invite(new.id, m->>'invite');
    exception when others then raise warning 'handle_new_user invite: %', sqlerrm; end;
  end if;
  if coalesce(m->>'join', '') <> '' then
    begin perform public._join(new.id, m->>'join');
    exception when others then raise warning 'handle_new_user join: %', sqlerrm; end;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created_woerterbuch on auth.users;
create trigger on_auth_user_created_woerterbuch after insert on auth.users for each row execute function public.handle_new_user();

-- Finish an addressed invitation on the first confirmation, including on a different device.
create or replace function public.finish_confirmed_invite() returns trigger
language plpgsql security definer set search_path = public as $$
declare c text := new.raw_user_meta_data->>'invite';
begin
  if nullif(btrim(c),'') is not null then
    begin perform public._redeem_site_invite(new.id,c);
    exception when others then raise warning 'confirmation invitation: %',sqlerrm; end;
  end if;
  return new;
end $$;
revoke all on function public.finish_confirmed_invite() from public, anon, authenticated;
drop trigger if exists on_confirmed_invite_woerterbuch on auth.users;
create trigger on_confirmed_invite_woerterbuch after update of email_confirmed_at on auth.users
  for each row when(old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.finish_confirmed_invite();

-- staff: set the current level of one of their students (and unlock it)
create or replace function public.set_student_level(p_user uuid, p_level text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_level not in ('A1', 'A2', 'B1', 'B2', 'C1') then raise exception 'bad level'; end if;
  update public.profiles set level = p_level, unlocked = public.lv_sort(unlocked || p_level) where user_id = p_user and public.staff_controls_student(user_id, org_id);
  if not found then raise exception 'not your student'; end if;
end $$;

-- staff: unlock or lock one level for one of their students
create or replace function public.unlock_level(p_user uuid, p_level text, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_level not in ('A1', 'A2', 'B1', 'B2', 'C1') then raise exception 'bad level'; end if;
  update public.profiles set
    unlocked = case when p_on then public.lv_sort(unlocked || p_level) else array_remove(unlocked, p_level) end,
    level = case when p_on and level is null then p_level else level end
    where user_id = p_user and public.staff_controls_student(user_id, org_id);
  if not found then raise exception 'not your student'; end if;
end $$;

-- what an invite link is for (shown on the sign-up form, also before signing in)
create or replace function public.invite_preview(p_code text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select json_build_object('type', 'org', 'role', i.member_role, 'level', coalesce(c.level, i.level), 'class', c.name,
            'org', o.name, 'org_id', o.id, 'kind', o.kind, 'logo_url', o.logo_url, 'theme', o.theme, 'tagline', o.tagline)
       from public.invites i join public.orgs o on o.id = i.org_id left join public.classes c on c.id = i.class_id and c.org_id=i.org_id
      where i.code = lower(trim(p_code)) and i.uses_left > 0 and i.expires_at > now()),
    (select json_build_object('type', 'site', 'role', s.role, 'level', s.level)
       from public.site_invites s where s.code = lower(trim(p_code)) and s.uses_left > 0 and s.expires_at > now()));
$$;

-- a learner's or teacher's school: branding and home page (also for people who cannot read the whole org row)
create or replace function public.my_org() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'logo_url', o.logo_url, 'theme', o.theme, 'pass_mark', o.pass_mark,
    'tagline', o.tagline, 'about', o.about, 'welcome', o.welcome, 'city', o.city, 'country', o.country, 'website', o.website,
    'org_type', o.org_type, 'languages', o.languages, 'cover', o.cover, 'owner', o.owner = auth.uid(),
    'owner_name', case when o.kind = 'teacher' then (select display_name from public.profiles where user_id = o.owner) end,
    'class', (select json_build_object('id', c.id, 'name', c.name, 'level', c.level, 'pass_mark', c.pass_mark)
              from public.org_members m join public.classes c on c.id = m.class_id and c.org_id=m.org_id where m.org_id = o.id and m.user_id = auth.uid()))
  from public.profiles p join public.orgs o on o.id = p.org_id where p.user_id = auth.uid();
$$;

revoke all on function public._join(uuid,text), public._redeem_site_invite(uuid,text), public.handle_new_user() from public, anon, authenticated;

commit;
