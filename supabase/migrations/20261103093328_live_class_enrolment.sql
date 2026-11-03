-- Live-class catalogue, learner requests and teacher decisions.
-- Optional information for public, instructor-led classes. A class remains private
-- unless the teacher explicitly opens it for live applications.
alter table public.classes add column if not exists starts_on date;
alter table public.classes add column if not exists ends_on date;
alter table public.classes add column if not exists schedule text check (char_length(schedule) <= 240);
alter table public.classes add column if not exists meeting_details text check (char_length(meeting_details) <= 400);
alter table public.classes add column if not exists live_open boolean not null default false;
alter table public.classes add column if not exists notification_email text check (notification_email is null or (char_length(notification_email) <= 120 and notification_email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+$'));
alter table public.classes enable row level security;

-- A signed-in learner can apply for an open live class. The application is not
-- enrolment: a teacher must accept it, which prevents public links from granting
-- course access without review.
create table if not exists public.live_class_requests (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (class_id, user_id)
);
alter table public.live_class_requests enable row level security;

-- A teacher may manage their own class; an organisation owner may manage all
-- classes in that organisation. This is deliberately narrower than general
-- staff access for the actions that enrol a learner or send an invitation.
create or replace function public.can_manage_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class and (c.teacher_id = auth.uid() or public.is_org_owner(c.org_id))
  );
$$;

-- Only the learner and the class's responsible teacher/owner can read a live
-- application. The table itself is never exposed for anonymous writes.
drop policy if exists "live requests: learner read" on public.live_class_requests;
drop policy if exists "live requests: manager read" on public.live_class_requests;
create policy "live requests: learner read" on public.live_class_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy "live requests: manager read" on public.live_class_requests for select to authenticated
  using (public.can_manage_class(class_id));
revoke all on public.live_class_requests from public, anon, authenticated;
grant select on public.live_class_requests to authenticated;

-- Public catalogue: deliberately exposes only the details a prospective learner
-- needs. Contact addresses and meeting links remain private.
create or replace function public.live_class_catalog() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.starts_on nulls last, x.name), '[]'::json)
  from (
    select c.id, c.name, c.level, c.starts_on, c.ends_on, c.schedule,
      o.name as organisation, coalesce(p.display_name, o.name) as teacher
    from public.classes c
    join public.orgs o on o.id = c.org_id
    left join public.profiles p on p.user_id = c.teacher_id
    where c.live_open
  ) x;
$$;

-- A learner applies after signing in. They are not enrolled here: a named
-- teacher or the organisation owner decides explicitly in the dashboard.
create or replace function public.request_live_class(p_class uuid) returns json
language plpgsql security definer set search_path = public as $$
declare c public.classes; p public.profiles; r public.live_class_requests;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into c from public.classes where id = p_class and live_open;
  if not found then raise exception 'this live class is not accepting applications'; end if;
  select * into p from public.profiles where user_id = auth.uid();
  if not found or p.role <> 'learner' then raise exception 'learner account required'; end if;
  insert into public.live_class_requests(class_id, user_id)
    values (c.id, auth.uid())
    on conflict (class_id, user_id) do update set status = case
      when live_class_requests.status = 'declined' then 'pending' else live_class_requests.status end,
      created_at = case when live_class_requests.status = 'declined' then now() else live_class_requests.created_at end,
      decided_at = case when live_class_requests.status = 'declined' then null else live_class_requests.decided_at end
    returning * into r;
  return json_build_object('request_id', r.id, 'status', r.status, 'class_id', c.id,
    'class_name', c.name, 'level', c.level,
    'starts_on', c.starts_on, 'ends_on', c.ends_on, 'schedule', c.schedule);
end $$;

-- Accepting an application performs the same secure enrolment as a class invite.
create or replace function public.decide_live_class_request(p_request uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare r public.live_class_requests; c public.classes;
begin
  select * into r from public.live_class_requests where id = p_request for update;
  if not found then raise exception 'application not found'; end if;
  select * into c from public.classes where id = r.class_id;
  if not public.can_manage_class(c.id) then raise exception 'not your class'; end if;
  update public.live_class_requests set status = case when p_accept then 'accepted' else 'declined' end,
    decided_at = now() where id = r.id;
  if p_accept then
    perform set_config('app.join', '1', true);
    insert into public.org_members(org_id, user_id, member_role, class_id)
      values (c.org_id, r.user_id, 'student', c.id)
      on conflict (org_id, user_id) do update set class_id = excluded.class_id, member_role = 'student';
    update public.profiles set org_id = c.org_id, level = c.level,
      unlocked = public.lv_sort(unlocked || c.level) where user_id = r.user_id;
    perform set_config('app.join', '', true);
  end if;
  return json_build_object('status', case when p_accept then 'accepted' else 'declined' end,
    'class_name', c.name, 'level', c.level);
end $$;


revoke all on function public.can_manage_class(uuid), public.request_live_class(uuid), public.decide_live_class_request(uuid, boolean) from public, anon;
revoke all on function public.live_class_catalog() from public;
grant execute on function public.can_manage_class(uuid), public.request_live_class(uuid), public.decide_live_class_request(uuid, boolean) to authenticated;
grant execute on function public.live_class_catalog() to anon, authenticated;
