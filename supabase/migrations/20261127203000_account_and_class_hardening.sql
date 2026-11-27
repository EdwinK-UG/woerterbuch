-- Account, class and mail hardening (2026-11-27).
-- Safe to run again: functions and policies are replaced, constraints are added once
-- as NOT VALID and validated only when no stored row breaks them.
begin;
create schema if not exists app_private;

-- ===== 1. Assignments: only well-formed chapter references are stored =====
create or replace function public.assignment_items_ok(j jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(j) = 'array', false)
    and case when jsonb_typeof(j) = 'array' then
      jsonb_array_length(j) <= 200 and octet_length(j::text) <= 60000
      and not exists (select from jsonb_array_elements(j) e where
        jsonb_typeof(e) is distinct from 'object'
        or jsonb_typeof(e->'ch') is distinct from 'number' or (e->>'ch') !~ '^[0-9]{1,5}$'
        or not (e->'ex' is null or jsonb_typeof(e->'ex') = 'null'
                or (jsonb_typeof(e->'ex') = 'string' and (e->>'ex') ~ '^[A-Za-z0-9_-]{1,40}$'))
        or not (e->'required' is null or jsonb_typeof(e->'required') in ('array', 'null')))
    else false end;
$$;
revoke all on function public.assignment_items_ok(jsonb) from public, anon;
grant execute on function public.assignment_items_ok(jsonb) to authenticated;
do $$ begin
  if not exists (select from pg_constraint where conrelid = 'public.assignments'::regclass and conname = 'assignment_items_shape') then
    alter table public.assignments add constraint assignment_items_shape check (public.assignment_items_ok(items)) not valid;
  end if;
  if exists (select from public.assignments where not public.assignment_items_ok(items)) then
    raise notice 'assignment_items_shape left NOT VALID: stored rows need review';
  else
    alter table public.assignments validate constraint assignment_items_shape;
  end if;
end $$;

-- ===== 2. School logos come only from this project's own logo folder =====
create or replace function public.logo_url_ok(u text) returns boolean
language sql immutable set search_path = '' as $$
  select u is null or (char_length(u) <= 400 and u !~ '\.\.'
    and u ~ '^https://vnnhyhicppkexdibuqyu\.supabase\.co/storage/v1/object/public/logos/[A-Za-z0-9_./-]+$');
$$;
revoke all on function public.logo_url_ok(text) from public, anon;
grant execute on function public.logo_url_ok(text) to authenticated;
do $$ begin
  if not exists (select from pg_constraint where conrelid = 'public.orgs'::regclass and conname = 'org_logo_host') then
    alter table public.orgs add constraint org_logo_host check (public.logo_url_ok(logo_url)) not valid;
  end if;
  if exists (select from public.orgs where not public.logo_url_ok(logo_url)) then
    raise notice 'org_logo_host left NOT VALID: stored rows need review';
  else
    alter table public.orgs validate constraint org_logo_host;
  end if;
end $$;

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
      case when i->>'logo_url' is not null and public.logo_url_ok(i->>'logo_url') then i->>'logo_url' end,
      case when i->>'theme' ~ '^#[0-9a-fA-F]{6}$' then i->>'theme' end)
    returning id into oid;
  end if;
  update public.profiles set org_id = coalesce(org_id, oid) where user_id = p_uid;
  return oid;
end $$;
revoke all on function public._make_org(uuid, text, jsonb) from public, anon, authenticated;

-- ===== 3. Classes: a teacher manages their own classes, the owner manages all =====
-- A named teacher must still belong to the organisation.
create or replace function public.can_manage_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class and (public.is_org_owner(c.org_id)
      or (c.teacher_id = auth.uid() and public.is_org_staff(c.org_id)))
  );
$$;
revoke all on function public.can_manage_class(uuid) from public, anon;
grant execute on function public.can_manage_class(uuid) to authenticated;

drop policy if exists "classes: staff write" on public.classes;
drop policy if exists "classes: manager insert" on public.classes;
drop policy if exists "classes: manager update" on public.classes;
drop policy if exists "classes: manager delete" on public.classes;
create policy "classes: manager insert" on public.classes for insert to authenticated
  with check (public.is_org_owner(org_id) or (public.is_org_staff(org_id) and teacher_id = (select auth.uid())));
create policy "classes: manager update" on public.classes for update to authenticated
  using (public.is_org_owner(org_id) or (public.is_org_staff(org_id) and teacher_id = (select auth.uid())))
  with check (public.is_org_owner(org_id) or (public.is_org_staff(org_id) and teacher_id = (select auth.uid())));
create policy "classes: manager delete" on public.classes for delete to authenticated
  using (public.is_org_owner(org_id) or (public.is_org_staff(org_id) and teacher_id = (select auth.uid())));

-- Private columns (teacher contact, meeting link) are no longer readable from the table.
-- Learners get their own class's meeting details through my_org(); managers use class_private().
revoke select on public.classes from public, anon, authenticated;
revoke select (meeting_details, notification_email) on public.classes from public, anon, authenticated;
grant select (id, org_id, name, level, pass_mark, teacher_id, created_at, starts_on, ends_on, schedule,
              live_open, term_name, course_details) on public.classes to authenticated;

create or replace function public.class_private(p_org uuid)
returns table (id uuid, meeting_details text, notification_email text)
language sql stable security definer set search_path = '' as $$
  select c.id, c.meeting_details, c.notification_email from public.classes c
  where c.org_id = p_org and public.can_manage_class(c.id);
$$;
revoke all on function public.class_private(uuid) from public, anon;
grant execute on function public.class_private(uuid) to authenticated;

-- ===== 4. Class notifications go only to a confirmed staff mailbox =====
-- The class's notification address is used when it is the confirmed account address of the
-- class teacher or the organisation owner; otherwise the teacher's (then the owner's) own address.
create or replace function app_private.teacher_mail_context(p_request uuid, p_worker_secret text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare hook_secret text; recipient text; v_teacher uuid; v_owner uuid; v_org uuid; wanted text;
begin
  if auth.uid() is null then raise exception 'not authorised'; end if;
  select decrypted_secret into hook_secret from vault.decrypted_secrets
    where name = 'deutschklinik_welcome_hook' limit 1;
  if hook_secret is null or hook_secret = '' or p_worker_secret is null
     or pg_catalog.md5(hook_secret) <> pg_catalog.md5(p_worker_secret) then
    raise exception 'not authorised';
  end if;
  select c.teacher_id, o.owner, o.id, lower(nullif(btrim(c.notification_email), ''))
    into v_teacher, v_owner, v_org, wanted
    from public.live_class_requests r
    join public.classes c on c.id = r.class_id
    join public.orgs o on o.id = c.org_id
    where r.id = p_request and r.user_id = auth.uid();
  if not found then raise exception 'not authorised'; end if;
  select u.email into recipient from auth.users u
    where nullif(btrim(u.email), '') is not null and app_private.email_is_verified(u.id)
      and (u.id = v_owner or (u.id = v_teacher and exists (select from public.org_members m
            where m.org_id = v_org and m.user_id = u.id and m.member_role = 'teacher')))
    order by (lower(u.email) = wanted) desc nulls last, (u.id = v_teacher) desc nulls last
    limit 1;
  return jsonb_build_object('notification_email', recipient);
end $$;
revoke all on function app_private.teacher_mail_context(uuid, text) from public, anon, authenticated;
grant execute on function app_private.teacher_mail_context(uuid, text) to authenticated;

-- ===== 5. Live-class applications =====
create or replace function public.request_live_class(p_class uuid) returns json
language plpgsql security definer set search_path = public as $$
declare c public.classes; p public.profiles; r public.live_class_requests; v_enrolled boolean;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not app_private.email_is_verified(auth.uid()) then raise exception 'confirm your email first'; end if;
  select * into c from public.classes where id = p_class and live_open;
  if not found then raise exception 'this live class is not accepting applications'; end if;
  select * into p from public.profiles where user_id = auth.uid();
  if not found or p.role <> 'learner' then raise exception 'learner account required'; end if;
  if p.org_id is not null and p.org_id <> c.org_id then
    raise exception 'leave your current school before applying to this class';
  end if;
  v_enrolled := p.org_id is not distinct from c.org_id and exists (select from public.org_members m
    where m.org_id = c.org_id and m.user_id = auth.uid() and m.member_role = 'student');
  -- A declined application, or an accepted one whose learner has since left, can be made again.
  insert into public.live_class_requests(class_id, user_id)
    values (c.id, auth.uid())
    on conflict (class_id, user_id) do update set
      status = case when live_class_requests.status = 'declined'
        or (live_class_requests.status = 'accepted' and not v_enrolled) then 'pending' else live_class_requests.status end,
      created_at = case when live_class_requests.status = 'declined'
        or (live_class_requests.status = 'accepted' and not v_enrolled) then now() else live_class_requests.created_at end,
      decided_at = case when live_class_requests.status = 'declined'
        or (live_class_requests.status = 'accepted' and not v_enrolled) then null else live_class_requests.decided_at end
    returning * into r;
  return json_build_object('request_id', r.id, 'status', r.status, 'class_id', c.id,
    'class_name', c.name, 'level', c.level,
    'starts_on', c.starts_on, 'ends_on', c.ends_on, 'schedule', c.schedule);
end $$;

-- Only an open application can be decided, and accepting never moves a learner who has
-- meanwhile joined another school or is no longer a learner.
create or replace function public.decide_live_class_request(p_request uuid, p_accept boolean) returns json
language plpgsql security definer set search_path = public as $$
declare r public.live_class_requests; c public.classes; p public.profiles;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_accept is null then raise exception 'choose accept or decline'; end if;
  select * into r from public.live_class_requests where id = p_request for update;
  if not found then raise exception 'application not found'; end if;
  select * into c from public.classes where id = r.class_id;
  if not public.can_manage_class(c.id) then raise exception 'not your class'; end if;
  if r.status <> 'pending' then raise exception 'this application has already been decided'; end if;
  if p_accept then
    select * into p from public.profiles where user_id = r.user_id for update;
    if not found or p.role <> 'learner' then raise exception 'this account can no longer be enrolled as a learner'; end if;
    if p.org_id is not null and p.org_id <> c.org_id then
      raise exception 'this learner has joined another school; decline the application or ask them to apply again';
    end if;
    if not app_private.email_is_verified(r.user_id) then raise exception 'this learner has not confirmed their email yet'; end if;
  end if;
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
revoke all on function public.request_live_class(uuid), public.decide_live_class_request(uuid, boolean) from public, anon;
grant execute on function public.request_live_class(uuid), public.decide_live_class_request(uuid, boolean) to authenticated;

-- ===== 6. Teaching roles and invitations need a proven mailbox =====
create or replace function app_private.finish_onboarding(p_uid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare p public.profiles; u auth.users; m jsonb;
begin
  select * into u from auth.users where id = p_uid and email_confirmed_at is not null;
  if not found then return; end if;
  if not app_private.email_is_verified(p_uid) then return; end if;
  select * into p from public.profiles where user_id = p_uid for update;
  if p.role = 'learner' and p.requested_role in ('teacher', 'school') then
    update public.profiles set role = p.requested_role, requested_role = null where user_id = p_uid;
    perform public._make_org(p_uid, p.requested_role, p.request_info);
  end if;
  m := coalesce(u.raw_user_meta_data, '{}'::jsonb);
  -- These are bearer invitation codes, checked transactionally against stored
  -- class, recipient, expiry and receipt records by the redemption functions.
  if nullif(btrim(m->>'invite'), '') is not null then
    begin perform public._redeem_site_invite(p_uid, m->>'invite'); exception when others then raise warning 'Signup invitation not redeemed'; end;
  end if;
  if nullif(btrim(m->>'join'), '') is not null then
    begin perform public._join(p_uid, m->>'join'); exception when others then raise warning 'Class invitation not redeemed'; end;
  end if;
end $$;
revoke all on function app_private.finish_onboarding(uuid) from public, anon, authenticated;

-- Called on every sign-in while a teaching request is open: it must not fail for an
-- account that has not confirmed its email yet; the request simply stays open.
create or replace function app_private.complete_teacher_onboarding() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  perform app_private.finish_onboarding(auth.uid());
end $$;
revoke all on function app_private.complete_teacher_onboarding() from public, anon;
grant execute on function app_private.complete_teacher_onboarding() to authenticated;

-- Returns the new page's id, or null when the request was saved and waits for the
-- email confirmation (the workspace then opens by itself on confirmation).
create or replace function app_private.register_teaching_account(p_kind text, p_info jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare p public.profiles; oid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_kind not in ('teacher', 'school') or p_kind is null then raise exception 'choose teacher or school'; end if;
  if jsonb_typeof(p_info) is distinct from 'object' or octet_length(p_info::text) > 4000 then raise exception 'invalid page details'; end if;
  select * into p from public.profiles where user_id = auth.uid() for update;
  if not found then raise exception 'profile unavailable'; end if;
  if p.role = 'founder' then raise exception 'owner accounts cannot be changed here'; end if;
  if p.role <> 'learner' and p.role <> p_kind then raise exception 'use your existing teaching account'; end if;
  if not app_private.email_is_verified(auth.uid()) then
    if p.role = 'learner' then
      update public.profiles set requested_role = p_kind, request_info = p_info where user_id = auth.uid();
    end if;
    return null;
  end if;
  update public.profiles set role = p_kind, requested_role = null, request_info = p_info where user_id = auth.uid();
  oid := public._make_org(auth.uid(), p_kind, p_info);
  return oid;
end $$;
revoke all on function app_private.register_teaching_account(text, jsonb) from public, anon;
grant execute on function app_private.register_teaching_account(text, jsonb) to authenticated;

-- ===== 7. Email confirmation belongs to the signed-in account =====
-- The link proves the mailbox; the session proves the account. Both are needed, so a
-- mailbox owner can never confirm an account that somebody else created with their address.
-- "Stop reminders" keeps working from the link alone. Links are used up on confirmation.
create or replace function app_private.confirm_email_token(p_user uuid, p_token text, p_stop boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v app_private.email_verifications;
begin
  if p_user is null or p_token is null or length(p_token) <> 64 or p_token !~ '^[a-f0-9]+$' then raise exception 'invalid or expired confirmation link'; end if;
  if not coalesce(p_stop, false) then
    if auth.uid() is null or auth.uid() <> p_user then
      raise exception 'sign in to this account to confirm its email' using errcode = '28000';
    end if;
    -- Opening an already used link again is harmless for the account's own holder.
    if app_private.email_is_verified(p_user) then return '{"verified":true}'::jsonb; end if;
  end if;
  perform 1 from auth.users where id = p_user for update;
  select * into v from app_private.email_verifications where user_id = p_user for update;
  if not found or not exists (select from app_private.email_verification_tokens t where t.user_id = p_user and t.email = v.email and t.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and t.expires_at > now())
  or not exists (select from auth.users u where u.id = p_user and lower(u.email) = v.email) then raise exception 'invalid or expired confirmation link'; end if;
  if coalesce(p_stop, false) then
    update app_private.email_verifications set suppressed_at = now(), next_send_at = null where user_id = p_user;
    return '{"stopped":true}'::jsonb;
  end if;
  update app_private.email_verifications set verified_at = coalesce(verified_at, now()), next_send_at = null where user_id = p_user;
  delete from app_private.email_verification_tokens where user_id = p_user;
  update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"dk_email_verification_required":false}'::jsonb, email_confirmed_at = coalesce(email_confirmed_at, now()) where id = p_user;
  perform app_private.finish_onboarding(p_user);
  return '{"verified":true}'::jsonb;
end $$;
revoke all on function app_private.confirm_email_token(uuid, text, boolean) from public, anon, authenticated;
grant execute on function app_private.confirm_email_token(uuid, text, boolean) to anon, authenticated;

commit;
