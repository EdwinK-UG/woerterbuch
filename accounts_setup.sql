-- Wörterbuch: roles, levels, schools/teachers, classes, invites, assignments, pass marks,
-- school and teacher home pages, unlocked levels, owner invitations and owner statistics.
-- Run in Supabase → SQL Editor → New query → paste everything → Run.
-- Safe to run again: it only adds what is missing and replaces the functions and policies.
-- AFTER the first run: add your own account as founder (see the last lines of this file).

-- ===== founder (site owner) =====
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

create or replace function public.is_founder() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

-- ===== profiles: one row per account =====
create table if not exists public.profiles (
  user_id        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name   text check (char_length(display_name) <= 60),
  role           text not null default 'learner' check (role in ('learner', 'teacher', 'school', 'founder')),
  requested_role text check (requested_role in ('teacher', 'school')),
  level          text check (level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  ui_lang        text not null default 'auto' check (ui_lang in ('auto', 'en', 'de')),
  org_id         uuid,
  created_at     timestamptz not null default now()
);
-- levels the learner may open (a learner in a school gets them from the teacher; others unlock them themselves).
-- When the column is first added, learners who already have a level keep that level open.
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'unlocked') then
    alter table public.profiles add column unlocked text[] not null default '{}' check (unlocked <@ array['A1', 'A2', 'B1', 'B2', 'C1']);
    update public.profiles set unlocked = array[level] where role = 'learner' and level is not null;
  end if;
end $$;
-- details a teacher or school gave when signing up (used for their home page once approved)
alter table public.profiles add column if not exists request_info jsonb
  check (request_info is null or (jsonb_typeof(request_info) = 'object' and octet_length(request_info::text) < 4000));
alter table public.profiles enable row level security;

-- ===== organisations: a school, or a teacher working on their own =====
create table if not exists public.orgs (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('school', 'teacher')),
  name       text not null check (char_length(name) between 2 and 80),
  logo_url   text check (logo_url is null or logo_url ~ '^https://'),
  theme      text check (theme is null or theme ~ '^#[0-9a-fA-F]{6}$'),
  owner      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pass_mark  int not null default 70 check (pass_mark between 1 and 100),
  created_at timestamptz not null default now()
);
-- home page details
alter table public.orgs add column if not exists tagline   text check (char_length(tagline) <= 120);
alter table public.orgs add column if not exists about     text check (char_length(about) <= 2000);
alter table public.orgs add column if not exists welcome   text check (char_length(welcome) <= 600);
alter table public.orgs add column if not exists city      text check (char_length(city) <= 80);
alter table public.orgs add column if not exists country   text check (char_length(country) <= 80);
alter table public.orgs add column if not exists website   text check (website is null or website ~ '^https?://[^\s<>"]+$');
alter table public.orgs add column if not exists org_type  text check (char_length(org_type) <= 60);
alter table public.orgs add column if not exists languages text check (char_length(languages) <= 120);
alter table public.orgs add column if not exists cover     text not null default 'waves' check (cover in ('waves', 'dots', 'grid', 'plain'));
alter table public.orgs enable row level security;

create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  level      text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  pass_mark  int check (pass_mark between 1 and 100),
  teacher_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.classes enable row level security;

create table if not exists public.org_members (
  org_id      uuid not null references public.orgs (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  member_role text not null check (member_role in ('teacher', 'student')),
  class_id    uuid references public.classes (id) on delete set null,
  joined_at   timestamptz not null default now(),
  primary key (org_id, user_id)
);
alter table public.org_members enable row level security;

create table if not exists public.invites (
  code        text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  org_id      uuid not null references public.orgs (id) on delete cascade,
  class_id    uuid references public.classes (id) on delete cascade,
  member_role text not null default 'student' check (member_role in ('teacher', 'student')),
  level       text check (level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  uses_left   int not null default 200 check (uses_left >= 0),
  expires_at  timestamptz not null default now() + interval '60 days',
  created_by  uuid not null default auth.uid() references auth.users (id) on delete cascade
);
alter table public.invites enable row level security;

create table if not exists public.assignments (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 100),
  items      jsonb not null default '[]'::jsonb,   -- [{"ch":201,"ex":"u1"}, …]; ex null = whole chapter
  due_at     timestamptz,
  pass_mark  int check (pass_mark between 1 and 100),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.assignments enable row level security;

-- invitations the founder sends to new learners, teachers and schools
create table if not exists public.site_invites (
  code       text primary key default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  role       text not null check (role in ('learner', 'teacher', 'school')),
  name       text check (char_length(name) <= 80),
  email      text check (char_length(email) <= 120),
  level      text check (level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  note       text check (char_length(note) <= 300),
  uses_left  int not null default 1 check (uses_left >= 0),
  used_count int not null default 0,
  expires_at timestamptz not null default now() + interval '30 days',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.site_invites enable row level security;

-- site settings (one row): who may use which feature, and the welcome text on the visitors' home page.
-- features: {"dict":"everyone","games":"everyone","lists":"enrolled","cards":"enrolled","vocab":"enrolled","grammar":"enrolled"}
-- each value is one of: everyone · account (signed in) · enrolled (has a level) · off (only the owner)
create table if not exists public.site_settings (
  id         int primary key default 1 check (id = 1),
  features   jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object' and octet_length(features::text) < 2000),
  welcome    jsonb not null default '{}'::jsonb check (jsonb_typeof(welcome) = 'object' and octet_length(welcome::text) < 4000),
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;
alter table public.site_settings enable row level security;

-- ===== helper functions (security definer = no policy loops) =====
create or replace function public.is_org_owner(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.orgs where id = o and owner = auth.uid());
$$;
create or replace function public.is_org_staff(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_org_owner(o) or exists (select 1 from public.org_members where org_id = o and user_id = auth.uid() and member_role = 'teacher');
$$;
create or replace function public.is_org_member(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.org_members where org_id = o and user_id = auth.uid());
$$;
create or replace function public.class_org(c uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.classes where id = c;
$$;
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where user_id = auth.uid()), 'learner');
$$;
-- levels in order, without duplicates
create or replace function public.lv_sort(a text[]) returns text[]
language sql immutable set search_path = public as $$
  select coalesce(array(select x from unnest(a) x where x in ('A1', 'A2', 'B1', 'B2', 'C1') group by x
                        order by array_position(array['A1', 'A2', 'B1', 'B2', 'C1'], x)), '{}');
$$;

-- ===== policies =====
-- profiles: everyone sees and edits their own row (but not role/org); staff see their members; founder sees all.
drop policy if exists "profiles: own select" on public.profiles;
drop policy if exists "profiles: staff select" on public.profiles;
drop policy if exists "profiles: own insert" on public.profiles;
drop policy if exists "profiles: own update" on public.profiles;
create policy "profiles: own select" on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_founder());
create policy "profiles: staff select" on public.profiles for select to authenticated
  using (exists (select 1 from public.org_members m where m.user_id = profiles.user_id and public.is_org_staff(m.org_id)));
create policy "profiles: own insert" on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and role = 'learner' and org_id is null);
create policy "profiles: own update" on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (user_id, display_name, requested_role, level, unlocked, ui_lang, request_info) on public.profiles to authenticated;
grant update (display_name, requested_role, level, unlocked, ui_lang, request_info) on public.profiles to authenticated;

-- orgs
drop policy if exists "orgs: read" on public.orgs;
drop policy if exists "orgs: create" on public.orgs;
drop policy if exists "orgs: owner update" on public.orgs;
drop policy if exists "orgs: owner delete" on public.orgs;
create policy "orgs: read" on public.orgs for select to authenticated
  using (owner = (select auth.uid()) or public.is_org_member(id) or public.is_founder());
create policy "orgs: create" on public.orgs for insert to authenticated
  with check (owner = (select auth.uid()) and (public.my_role() = 'founder'
              or (public.my_role() = 'school' and kind = 'school') or (public.my_role() = 'teacher' and kind = 'teacher')));
create policy "orgs: owner update" on public.orgs for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "orgs: owner delete" on public.orgs for delete to authenticated using (owner = (select auth.uid()));
revoke all on public.orgs from anon, authenticated;
grant select, delete on public.orgs to authenticated;
grant insert (kind, name, logo_url, theme, pass_mark, tagline, about, welcome, city, country, website, org_type, languages, cover) on public.orgs to authenticated;
grant update (name, logo_url, theme, pass_mark, tagline, about, welcome, city, country, website, org_type, languages, cover) on public.orgs to authenticated;

-- classes
drop policy if exists "classes: read" on public.classes;
drop policy if exists "classes: staff write" on public.classes;
create policy "classes: read" on public.classes for select to authenticated
  using (public.is_org_member(org_id) or public.is_org_owner(org_id));
create policy "classes: staff write" on public.classes for all to authenticated
  using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));
revoke all on public.classes from anon, authenticated;
grant select, insert, update, delete on public.classes to authenticated;

-- members (joining happens only through join_with_code)
drop policy if exists "members: read" on public.org_members;
drop policy if exists "members: leave or remove" on public.org_members;
drop policy if exists "members: staff move" on public.org_members;
create policy "members: read" on public.org_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_org_staff(org_id));
create policy "members: leave or remove" on public.org_members for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_org_owner(org_id) or (public.is_org_staff(org_id) and member_role = 'student'));
create policy "members: staff move" on public.org_members for update to authenticated
  using (public.is_org_staff(org_id)) with check (public.is_org_staff(org_id));
revoke all on public.org_members from anon, authenticated;
grant select, delete on public.org_members to authenticated;
grant update (class_id) on public.org_members to authenticated;

-- invites: the owner makes teacher and student links, teachers make student links
drop policy if exists "invites: staff" on public.invites;
drop policy if exists "invites: staff insert" on public.invites;
create policy "invites: staff" on public.invites for select to authenticated using (public.is_org_staff(org_id));
create policy "invites: staff insert" on public.invites for insert to authenticated
  with check (created_by = (select auth.uid()) and (public.is_org_owner(org_id) or (public.is_org_staff(org_id) and member_role = 'student')));
drop policy if exists "invites: staff delete" on public.invites;
create policy "invites: staff delete" on public.invites for delete to authenticated using (public.is_org_staff(org_id));
revoke all on public.invites from anon, authenticated;
grant select, delete on public.invites to authenticated;
grant insert (org_id, class_id, member_role, level, uses_left, expires_at) on public.invites to authenticated;

-- assignments
drop policy if exists "assignments: read" on public.assignments;
drop policy if exists "assignments: staff write" on public.assignments;
create policy "assignments: read" on public.assignments for select to authenticated
  using (public.is_org_staff(public.class_org(class_id))
         or exists (select 1 from public.org_members m where m.user_id = (select auth.uid()) and m.class_id = assignments.class_id));
create policy "assignments: staff write" on public.assignments for all to authenticated
  using (public.is_org_staff(public.class_org(class_id))) with check (public.is_org_staff(public.class_org(class_id)));
revoke all on public.assignments from anon, authenticated;
grant select, insert, update, delete on public.assignments to authenticated;

-- site settings: everyone reads them (also before signing in), only the founder changes them
drop policy if exists "site settings: read" on public.site_settings;
drop policy if exists "site settings: founder" on public.site_settings;
create policy "site settings: read" on public.site_settings for select to anon, authenticated using (true);
create policy "site settings: founder" on public.site_settings for update to authenticated using (public.is_founder()) with check (public.is_founder());
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (features, welcome, updated_at) on public.site_settings to authenticated;

-- founder invitations
drop policy if exists "site invites: founder" on public.site_invites;
create policy "site invites: founder" on public.site_invites for all to authenticated
  using (public.is_founder()) with check (public.is_founder() and created_by = (select auth.uid()));
revoke all on public.site_invites from anon, authenticated;
grant select, delete on public.site_invites to authenticated;
grant insert (role, name, email, level, note, uses_left, expires_at) on public.site_invites to authenticated;

-- results: teachers and the school can read the results of their members
-- (only if the grammar results table from supabase_setup.sql exists)
do $$ begin
  if to_regclass('public.grammar_results') is not null then
    execute 'drop policy if exists "results: staff select" on public.grammar_results';
    execute 'create policy "results: staff select" on public.grammar_results for select to authenticated
      using (exists (select 1 from public.org_members m where m.user_id = grammar_results.user_id and public.is_org_staff(m.org_id)))';
  end if;
end $$;

-- logos: a public picture folder; everyone may only write into their own sub-folder
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('logos', 'logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
      on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
    execute 'drop policy if exists "logos: own read" on storage.objects';
    execute 'drop policy if exists "logos: own insert" on storage.objects';
    execute 'drop policy if exists "logos: own update" on storage.objects';
    execute 'drop policy if exists "logos: own delete" on storage.objects';
    execute $p$create policy "logos: own read" on storage.objects for select to authenticated
      using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "logos: own insert" on storage.objects for insert to authenticated
      with check (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "logos: own update" on storage.objects for update to authenticated
      using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
    execute $p$create policy "logos: own delete" on storage.objects for delete to authenticated
      using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid())::text)$p$;
  end if;
end $$;

-- a learner in a school cannot enroll themselves in a level; the teacher or the school does that.
-- (They can choose the level they want – the teacher sees it as a request – and they can unenroll.)
-- A learner opens exactly the levels in "unlocked" (no automatic access to lower levels).
create or replace function public.lock_level() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from unnest(new.unlocked) x where not (x = any(old.unlocked))) and old.org_id is not null and old.role = 'learner'
     and auth.uid() = old.user_id and not public.is_founder()
     and coalesce(current_setting('app.join', true), '') <> '1' then
    raise exception 'levels are unlocked by your teacher';
  end if;
  new.unlocked := public.lv_sort(new.unlocked);
  return new;
end $$;
drop trigger if exists profiles_lock_level on public.profiles;
create trigger profiles_lock_level before update on public.profiles for each row execute function public.lock_level();

-- leaving a school (or being removed) ends the link to it
create or replace function public.member_gone() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set org_id = null where user_id = old.user_id and org_id = old.org_id;
  return old;
end $$;
drop trigger if exists org_members_gone on public.org_members;
create trigger org_members_gone after delete on public.org_members for each row execute function public.member_gone();

-- ===== internal functions (not callable from the app) =====
-- create the home page / organisation of an approved or invited teacher or school
create or replace function public._make_org(p_uid uuid, p_kind text, i jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare oid uuid; nm text;
begin
  select id into oid from public.orgs where owner = p_uid and kind = p_kind order by created_at limit 1;
  if oid is null then
    i := coalesce(i, '{}'::jsonb);
    nm := left(trim(coalesce(nullif(trim(i->>'name'), ''), (select display_name from public.profiles where user_id = p_uid), '')), 80);
    if char_length(nm) < 2 then nm := case p_kind when 'school' then 'Meine Sprachschule' else 'Mein Deutschkurs' end; end if;
    insert into public.orgs (kind, name, owner, tagline, about, welcome, city, country, website, org_type, languages, logo_url, theme)
    values (p_kind, nm, p_uid, left(i->>'tagline', 120), left(i->>'about', 2000), left(i->>'welcome', 600), left(i->>'city', 80),
      left(i->>'country', 80), case when i->>'website' ~ '^https?://[^\s<>"]+$' then left(i->>'website', 200) end,
      left(i->>'org_type', 60), left(i->>'languages', 120),
      case when i->>'logo_url' ~ '^https://' then left(i->>'logo_url', 400) end,
      case when i->>'theme' ~ '^#[0-9a-fA-F]{6}$' then i->>'theme' end)
    returning id into oid;
  end if;
  update public.profiles set org_id = coalesce(org_id, oid) where user_id = p_uid;
  return oid;
end $$;

-- join a school or a teacher with an invite code
create or replace function public._join(p_uid uuid, p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare i public.invites; o public.orgs; lv text;
begin
  select * into i from public.invites where code = lower(trim(p_code)) for update;
  if not found or i.uses_left <= 0 or i.expires_at < now() then raise exception 'invalid code'; end if;
  perform set_config('app.join', '1', true);   -- lets the level trigger accept the level from the invite
  select * into o from public.orgs where id = i.org_id;
  lv := coalesce((select level from public.classes where id = i.class_id), i.level);
  insert into public.profiles (user_id) values (p_uid) on conflict (user_id) do nothing;
  insert into public.org_members (org_id, user_id, member_role, class_id) values (i.org_id, p_uid, i.member_role, i.class_id)
    on conflict (org_id, user_id) do update set member_role = excluded.member_role, class_id = coalesce(excluded.class_id, org_members.class_id);
  -- a class link is the teacher's "yes" for that level: it is unlocked at once
  update public.profiles set org_id = i.org_id,
    level = case when i.member_role = 'student' and lv is not null then lv else level end,
    unlocked = case when i.member_role = 'student' and lv is not null then public.lv_sort(unlocked || lv) else unlocked end,
    role = case when i.member_role = 'teacher' and role = 'learner' then 'teacher' else role end
    where user_id = p_uid;
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
  if not found or s.uses_left <= 0 or s.expires_at < now() then raise exception 'invalid code'; end if;
  insert into public.profiles (user_id) values (p_uid) on conflict (user_id) do nothing;
  if s.role in ('teacher', 'school') then
    update public.profiles set role = s.role, requested_role = null where user_id = p_uid and role = 'learner';
    select coalesce(request_info, '{}'::jsonb) into inf from public.profiles where user_id = p_uid;
    if s.role = 'school' and coalesce(inf->>'name', '') = '' and s.name is not null then inf := inf || jsonb_build_object('name', s.name); end if;
    perform public._make_org(p_uid, s.role, inf);
  elsif s.level is not null then
    update public.profiles set level = s.level, unlocked = public.lv_sort(unlocked || s.level) where user_id = p_uid and org_id is null;
  end if;
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
  if coalesce(m->>'invite', '') <> '' then
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

-- ===== functions the app calls =====
-- staff: set the current level of one of their students (and unlock it)
create or replace function public.set_student_level(p_user uuid, p_level text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_level not in ('A1', 'A2', 'B1', 'B2', 'C1') then raise exception 'bad level'; end if;
  if not exists (select 1 from public.org_members m where m.user_id = p_user and m.member_role = 'student' and public.is_org_staff(m.org_id)) then
    raise exception 'not your student';
  end if;
  update public.profiles set level = p_level, unlocked = public.lv_sort(unlocked || p_level) where user_id = p_user;
end $$;

-- staff: unlock or lock one level for one of their students
create or replace function public.unlock_level(p_user uuid, p_level text, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_level not in ('A1', 'A2', 'B1', 'B2', 'C1') then raise exception 'bad level'; end if;
  if not exists (select 1 from public.org_members m where m.user_id = p_user and m.member_role = 'student' and public.is_org_staff(m.org_id)) then
    raise exception 'not your student';
  end if;
  update public.profiles set
    unlocked = case when p_on then public.lv_sort(unlocked || p_level) else array_remove(unlocked, p_level) end,
    level = case when p_on and level is null then p_level else level end
    where user_id = p_user;
end $$;

create or replace function public.join_with_code(p_code text) returns json
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  return public._join(auth.uid(), p_code);
end $$;

create or replace function public.redeem_invite(p_code text) returns json
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  return public._redeem_site_invite(auth.uid(), p_code);
end $$;

-- what an invite link is for (shown on the sign-up form, also before signing in)
create or replace function public.invite_preview(p_code text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select json_build_object('type', 'org', 'role', i.member_role, 'level', coalesce(c.level, i.level), 'class', c.name,
            'org', o.name, 'org_id', o.id, 'kind', o.kind, 'logo_url', o.logo_url, 'theme', o.theme, 'tagline', o.tagline)
       from public.invites i join public.orgs o on o.id = i.org_id left join public.classes c on c.id = i.class_id
      where i.code = lower(trim(p_code)) and i.uses_left > 0 and i.expires_at > now()),
    (select json_build_object('type', 'site', 'role', s.role, 'level', s.level, 'name', s.name, 'email', s.email)
       from public.site_invites s where s.code = lower(trim(p_code)) and s.uses_left > 0 and s.expires_at > now()));
$$;

-- the public home page of a school or teacher (only what they chose to show)
create or replace function public.org_page(p_id uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'logo_url', o.logo_url, 'theme', o.theme, 'tagline', o.tagline,
    'about', o.about, 'city', o.city, 'country', o.country, 'website', o.website, 'org_type', o.org_type, 'languages', o.languages,
    'cover', o.cover, 'created_at', o.created_at,
    'levels', (select coalesce(json_agg(distinct c.level), '[]'::json) from public.classes c where c.org_id = o.id),
    'students', (select count(*) from public.org_members m where m.org_id = o.id and m.member_role = 'student'),
    'teachers', (select count(*) from public.org_members m where m.org_id = o.id and m.member_role = 'teacher') + case when o.kind = 'teacher' then 1 else 0 end,
    'owner_name', case when o.kind = 'teacher' then (select display_name from public.profiles where user_id = o.owner) end)
  from public.orgs o where o.id = p_id;
$$;

-- founder: list open teacher/school requests (with e-mail and the details they gave)
drop function if exists public.pending_requests();
create or replace function public.pending_requests() returns table (user_id uuid, email text, display_name text, requested_role text, request_info jsonb, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.user_id, u.email::text, p.display_name, p.requested_role, p.request_info, p.created_at
  from public.profiles p join auth.users u on u.id = p.user_id
  where p.requested_role is not null and public.is_founder()
  order by p.created_at;
$$;

-- founder: approve (creates the home page from the sign-up details) or reject a request
create or replace function public.decide_request(p_user uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if not public.is_founder() then raise exception 'founder only'; end if;
  select * into p from public.profiles where user_id = p_user;
  if not found or p.requested_role is null then return; end if;
  update public.profiles set role = case when p_ok and role = 'learner' then requested_role else role end, requested_role = null where user_id = p_user;
  if p_ok then perform public._make_org(p_user, p.requested_role, p.request_info); end if;
end $$;

-- a learner's or teacher's school: branding and home page (also for people who cannot read the whole org row)
create or replace function public.my_org() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'logo_url', o.logo_url, 'theme', o.theme, 'pass_mark', o.pass_mark,
    'tagline', o.tagline, 'about', o.about, 'welcome', o.welcome, 'city', o.city, 'country', o.country, 'website', o.website,
    'org_type', o.org_type, 'languages', o.languages, 'cover', o.cover, 'owner', o.owner = auth.uid(),
    'owner_name', case when o.kind = 'teacher' then (select display_name from public.profiles where user_id = o.owner) end,
    'class', (select json_build_object('id', c.id, 'name', c.name, 'level', c.level, 'pass_mark', c.pass_mark)
              from public.org_members m join public.classes c on c.id = m.class_id where m.org_id = o.id and m.user_id = auth.uid()))
  from public.profiles p join public.orgs o on o.id = p.org_id where p.user_id = auth.uid();
$$;

-- founder: what is going on on the site
create or replace function public.site_stats() returns json
language plpgsql stable security definer set search_path = public as $$
declare r json; act json := '{}'::json;
begin
  if not public.is_founder() then raise exception 'founder only'; end if;
  if to_regclass('public.grammar_results') is not null then
    execute $q$ select json_build_object(
      'active7',  (select count(distinct user_id) from public.grammar_results where created_at > now() - interval '7 days'),
      'active30', (select count(distinct user_id) from public.grammar_results where created_at > now() - interval '30 days'),
      'ex7',      (select count(*) from public.grammar_results where created_at > now() - interval '7 days'),
      'ex30',     (select count(*) from public.grammar_results where created_at > now() - interval '30 days'),
      'avg30',    (select round(avg(score::numeric / total) * 100) from public.grammar_results where created_at > now() - interval '30 days'),
      'top',      (select coalesce(json_agg(t), '[]'::json) from (select chapter, count(*) n, count(distinct user_id) users from public.grammar_results
                    where created_at > now() - interval '30 days' group by chapter order by n desc limit 8) t),
      'daily',    (select coalesce(json_agg(t order by t.d), '[]'::json) from (select created_at::date d, count(*) n from public.grammar_results
                    where created_at > now() - interval '30 days' group by 1) t)) $q$ into act;
  end if;
  select json_build_object(
    'users',     (select count(*) from auth.users),
    'confirmed', (select count(*) from auth.users where email_confirmed_at is not null),
    'new7',      (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'new30',     (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'signin7',   (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'signups',   (select coalesce(json_agg(t order by t.d), '[]'::json) from (select created_at::date d, count(*) n from auth.users
                   where created_at > now() - interval '30 days' group by 1) t),
    'roles',     (select coalesce(json_object_agg(role, n), '{}'::json) from (select role, count(*) n from public.profiles group by role) t),
    'levels',    (select coalesce(json_object_agg(lv, n), '{}'::json) from (select coalesce(level, '–') lv, count(*) n from public.profiles where role = 'learner' group by 1) t),
    'in_school', (select count(*) from public.profiles where role = 'learner' and org_id is not null),
    'orgs',      (select coalesce(json_object_agg(kind, n), '{}'::json) from (select kind, count(*) n from public.orgs group by kind) t),
    'classes',   (select count(*) from public.classes),
    'pending',   (select count(*) from public.profiles where requested_role is not null),
    'recent',    (select coalesce(json_agg(t), '[]'::json) from (select u.email::text email, u.created_at, u.email_confirmed_at is not null confirmed,
                   p.role, p.level, p.requested_role, p.display_name, o.name org from auth.users u left join public.profiles p on p.user_id = u.id
                   left join public.orgs o on o.id = p.org_id order by u.created_at desc limit 15) t),
    'org_list',  (select coalesce(json_agg(t), '[]'::json) from (select o.id, o.kind, o.name, o.city, o.country, o.created_at,
                   (select count(*) from public.org_members m where m.org_id = o.id and m.member_role = 'student') students,
                   (select count(*) from public.classes c where c.org_id = o.id) classes
                   from public.orgs o order by o.created_at desc limit 50) t),
    'activity',  act) into r;
  return r;
end $$;

revoke all on function public._make_org(uuid, text, jsonb), public._join(uuid, text), public._redeem_site_invite(uuid, text), public.handle_new_user()
  from public, anon, authenticated;
revoke all on function public.join_with_code(text), public.redeem_invite(text), public.pending_requests(), public.decide_request(uuid, boolean),
  public.my_org(), public.set_student_level(uuid, text), public.unlock_level(uuid, text, boolean), public.site_stats(),
  public.invite_preview(text), public.org_page(uuid) from public, anon;
grant execute on function public.join_with_code(text), public.redeem_invite(text), public.pending_requests(), public.decide_request(uuid, boolean),
  public.my_org(), public.set_student_level(uuid, text), public.unlock_level(uuid, text, boolean), public.site_stats() to authenticated;
grant execute on function public.invite_preview(text), public.org_page(uuid) to anon, authenticated;
grant execute on function public.is_founder(), public.is_org_owner(uuid), public.is_org_staff(uuid), public.is_org_member(uuid),
  public.class_org(uuid), public.my_role(), public.lv_sort(text[]) to authenticated;

-- ===== make yourself the founder (run once, with YOUR e-mail) =====
-- insert into public.app_admins (user_id) select id from auth.users where email = 'YOUR-EMAIL' on conflict do nothing;
-- insert into public.profiles (user_id, role) select id, 'founder' from auth.users where email = 'YOUR-EMAIL'
--   on conflict (user_id) do update set role = 'founder';
