-- Class boundaries for members and invitations (2026-11-27).
-- A learner's class is changed only by somebody who manages the classes involved; a teacher's
-- own membership row never carries class access. Safe to run again: everything is replaced.
begin;

-- ===== 1. Only an enrolled learner receives their class (with its meeting details) =====
create or replace function public.my_org() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'logo_url', o.logo_url, 'theme', o.theme, 'pass_mark', o.pass_mark,
    'tagline', o.tagline, 'about', o.about, 'welcome', o.welcome, 'city', o.city, 'country', o.country, 'website', o.website, 'contact_email', o.contact_email,
    'org_type', o.org_type, 'languages', o.languages, 'cover', o.cover, 'owner', o.owner = auth.uid(),
    'owner_name', case when o.kind = 'teacher' then (select display_name from public.profiles where user_id = o.owner) end,
    'class', (select json_build_object('id', c.id, 'name', c.name, 'level', c.level, 'pass_mark', c.pass_mark, 'term_name',c.term_name, 'starts_on',c.starts_on, 'ends_on',c.ends_on, 'schedule',c.schedule, 'course_details',c.course_details, 'meeting_details',c.meeting_details)
              from public.org_members m join public.classes c on c.id = m.class_id and c.org_id=m.org_id
              where m.org_id = o.id and m.user_id = auth.uid() and m.member_role = 'student'))
  from public.profiles p join public.orgs o on o.id = p.org_id where p.user_id = auth.uid();
$$;
revoke all on function public.my_org() from public, anon;
grant execute on function public.my_org() to authenticated;

-- ===== 2. Moving a learner between classes =====
-- Only learner rows can be moved. The owner moves any learner of the organisation. A teacher
-- moves a learner who is in one of their own classes or in no class yet, and only into one of
-- their own classes or out of a class. Joining by code and accepted live-class applications
-- set the class inside their own functions and are not affected.
drop policy if exists "members: staff move" on public.org_members;
create policy "members: staff move" on public.org_members for update to authenticated
  using (member_role = 'student' and (public.is_org_owner(org_id)
    or (public.staff_controls_student(user_id, org_id) and (class_id is null or public.can_manage_class(class_id)))))
  with check (member_role = 'student' and (public.is_org_owner(org_id)
    or (public.is_org_staff(org_id) and (class_id is null or public.can_manage_class(class_id)))));

-- ===== 3. Class invitation links belong to the class's manager =====
-- The owner sees and makes every link. A teacher sees, makes and deletes learner links for
-- the whole organisation (no class) and for their own classes.
drop policy if exists "invites: staff" on public.invites;
drop policy if exists "invites: staff insert" on public.invites;
drop policy if exists "invites: staff delete" on public.invites;
create policy "invites: staff" on public.invites for select to authenticated
  using (public.is_org_owner(org_id) or (public.is_org_staff(org_id) and member_role = 'student'
    and (class_id is null or public.can_manage_class(class_id))));
create policy "invites: staff insert" on public.invites for insert to authenticated
  with check (created_by = (select auth.uid()) and (public.is_org_owner(org_id)
    or (public.is_org_staff(org_id) and member_role = 'student'
      and (class_id is null or public.can_manage_class(class_id)))));
create policy "invites: staff delete" on public.invites for delete to authenticated
  using (public.is_org_owner(org_id) or (public.is_org_staff(org_id) and member_role = 'student'
    and (class_id is null or public.can_manage_class(class_id))));

commit;
