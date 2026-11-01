-- Wörterbuch: roles, levels, schools/teachers, classes, invites, assignments, pass marks.
-- Run once in Supabase → SQL Editor → New query → paste everything → Run.
-- Safe to run again: it only creates what is missing and replaces the functions and policies.
-- AFTER running: add your own account as founder (see the last lines of this file).

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
grant insert (user_id, display_name, requested_role, level, ui_lang) on public.profiles to authenticated;
grant update (display_name, requested_role, level, ui_lang) on public.profiles to authenticated;

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
grant insert (kind, name, logo_url, theme, pass_mark) on public.orgs to authenticated;
grant update (name, logo_url, theme, pass_mark) on public.orgs to authenticated;

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

-- results: teachers and the school can read the results of their members
-- (only if the grammar results table from supabase_setup.sql exists)
do $$ begin
  if to_regclass('public.grammar_results') is not null then
    execute 'drop policy if exists "results: staff select" on public.grammar_results';
    execute 'create policy "results: staff select" on public.grammar_results for select to authenticated
      using (exists (select 1 from public.org_members m where m.user_id = grammar_results.user_id and public.is_org_staff(m.org_id)))';
  end if;
end $$;

-- a learner who belongs to a school or teacher cannot change their own level; the teacher does that
create or replace function public.lock_level() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.level is distinct from old.level and old.org_id is not null and auth.uid() = old.user_id and not public.is_founder()
     and coalesce(current_setting('app.join', true), '') <> '1' then
    raise exception 'level is set by your teacher';
  end if;
  return new;
end $$;
drop trigger if exists profiles_lock_level on public.profiles;
create trigger profiles_lock_level before update on public.profiles for each row execute function public.lock_level();

-- ===== functions the app calls =====
-- staff: set the level of one of their students
create or replace function public.set_student_level(p_user uuid, p_level text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_level not in ('A1', 'A2', 'B1', 'B2', 'C1') then raise exception 'bad level'; end if;
  if not exists (select 1 from public.org_members m where m.user_id = p_user and m.member_role = 'student' and public.is_org_staff(m.org_id)) then
    raise exception 'not your student';
  end if;
  update public.profiles set level = p_level where user_id = p_user;
end $$;

-- join a school or a teacher's class with an invite code
create or replace function public.join_with_code(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare i public.invites; o public.orgs;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into i from public.invites where code = lower(trim(p_code)) for update;
  if not found or i.uses_left <= 0 or i.expires_at < now() then raise exception 'invalid code'; end if;
  perform set_config('app.join', '1', true);   -- lets the level trigger accept the level from the invite
  select * into o from public.orgs where id = i.org_id;
  insert into public.profiles (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  insert into public.org_members (org_id, user_id, member_role, class_id) values (i.org_id, auth.uid(), i.member_role, i.class_id)
    on conflict (org_id, user_id) do update set member_role = excluded.member_role, class_id = coalesce(excluded.class_id, org_members.class_id);
  update public.profiles set org_id = i.org_id,
    level = case when i.member_role = 'student' and i.level is not null then i.level else level end,
    role = case when i.member_role = 'teacher' and role = 'learner' then 'teacher' else role end
    where user_id = auth.uid();
  update public.invites set uses_left = uses_left - 1 where code = i.code;
  return json_build_object('org', o.name, 'kind', o.kind, 'role', i.member_role, 'level', i.level);
end $$;

-- founder: list open teacher/school requests (with e-mail)
create or replace function public.pending_requests() returns table (user_id uuid, email text, display_name text, requested_role text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.user_id, u.email::text, p.display_name, p.requested_role, p.created_at
  from public.profiles p join auth.users u on u.id = p.user_id
  where p.requested_role is not null and public.is_founder()
  order by p.created_at;
$$;

-- founder: approve or reject a request
create or replace function public.decide_request(p_user uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_founder() then raise exception 'founder only'; end if;
  update public.profiles set role = case when p_ok then requested_role else role end, requested_role = null where user_id = p_user;
end $$;

-- a student's org branding (name, logo, theme) – also for students who cannot read the whole org row
create or replace function public.my_org() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'logo_url', o.logo_url, 'theme', o.theme, 'pass_mark', o.pass_mark,
    'class', (select json_build_object('id', c.id, 'name', c.name, 'level', c.level, 'pass_mark', c.pass_mark)
              from public.org_members m join public.classes c on c.id = m.class_id where m.org_id = o.id and m.user_id = auth.uid()))
  from public.profiles p join public.orgs o on o.id = p.org_id where p.user_id = auth.uid();
$$;

revoke all on function public.join_with_code(text), public.pending_requests(), public.decide_request(uuid, boolean), public.my_org(), public.set_student_level(uuid, text) from public, anon;
grant execute on function public.join_with_code(text), public.pending_requests(), public.decide_request(uuid, boolean), public.my_org(), public.set_student_level(uuid, text) to authenticated;
grant execute on function public.is_founder(), public.is_org_owner(uuid), public.is_org_staff(uuid), public.is_org_member(uuid), public.class_org(uuid), public.my_role() to authenticated;

-- ===== make yourself the founder (run once, with YOUR e-mail) =====
-- insert into public.app_admins (user_id) select id from auth.users where email = 'YOUR-EMAIL';
-- insert into public.profiles (user_id, role) select id, 'founder' from auth.users where email = 'YOUR-EMAIL'
--   on conflict (user_id) do update set role = 'founder';
