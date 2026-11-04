-- Public, owner-configured learner support. Never infer it from an Auth email.
alter table public.orgs add column if not exists contact_email text;
alter table public.orgs drop constraint if exists orgs_contact_email_check;
alter table public.orgs add constraint orgs_contact_email_check check(contact_email is null or (length(contact_email)<=120 and contact_email ~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$'));
grant insert(contact_email),update(contact_email) on public.orgs to authenticated;

-- This lookup is for the existing authenticated mail worker, not browser claims.
create schema if not exists app_private;
grant usage on schema app_private to anon;
create or replace function app_private.welcome_brand_context(p_user uuid,p_worker_secret text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare secret text; result jsonb;
begin
 select decrypted_secret into secret from vault.decrypted_secrets where name='deutschklinik_welcome_hook' limit 1;
 if secret is null or secret='' or p_worker_secret is null or pg_catalog.md5(secret)<>pg_catalog.md5(p_worker_secret) then raise exception 'not authorised';end if;
 select jsonb_build_object('role',p.role,'name',p.display_name,'org',
   (select jsonb_build_object('id',o.id,'name',o.name,'kind',o.kind,'logo_url',o.logo_url,'theme',o.theme,'welcome',o.welcome,'website',o.website,'contact_email',o.contact_email)
    from public.orgs o where o.id=p.org_id or o.owner=p.user_id order by (o.id=p.org_id) desc nulls last,o.created_at limit 1),
   'class',(select jsonb_build_object('name',c.name,'level',c.level,'term_name',c.term_name,'schedule',c.schedule) from public.org_members m join public.classes c on c.id=m.class_id and c.org_id=m.org_id where m.user_id=p.user_id and m.org_id=p.org_id limit 1))
 into result from public.profiles p join auth.users u on u.id=p.user_id where p.user_id=p_user and u.email_confirmed_at is not null;
 return coalesce(result,'{}'::jsonb);
end $$;
revoke all on function app_private.welcome_brand_context(uuid,text) from public,anon,authenticated;
grant execute on function app_private.welcome_brand_context(uuid,text) to anon;
create or replace function public.welcome_brand_context(p_user uuid,p_worker_secret text)
returns jsonb language sql stable security invoker set search_path='' as $$
 select app_private.welcome_brand_context(p_user,p_worker_secret);
$$;
revoke all on function public.welcome_brand_context(uuid,text) from public,anon,authenticated;
grant execute on function public.welcome_brand_context(uuid,text) to anon;

create or replace function public.org_page(p_id uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'logo_url', o.logo_url, 'theme', o.theme, 'tagline', o.tagline,
    'about', o.about, 'city', o.city, 'country', o.country, 'website', o.website, 'contact_email', o.contact_email, 'org_type', o.org_type, 'languages', o.languages,
    'cover', o.cover, 'created_at', o.created_at,
    'levels', (select coalesce(json_agg(distinct c.level), '[]'::json) from public.classes c where c.org_id = o.id),
    'students', (select count(*) from public.org_members m where m.org_id = o.id and m.member_role = 'student'),
    'teachers', (select count(*) from public.org_members m where m.org_id = o.id and m.member_role = 'teacher') + case when o.kind = 'teacher' then 1 else 0 end,
    'owner_name', case when o.kind = 'teacher' then (select display_name from public.profiles where user_id = o.owner) end)
  from public.orgs o where o.id = p_id;
$$;

create or replace function public.invite_preview(p_code text) returns json
language sql stable security definer set search_path='' as $$
 select coalesce(
  (select json_build_object('type','org','role',i.member_role,'level',coalesce(c.level,i.level),'class',c.name,'org',o.name,'org_id',o.id,'kind',o.kind,'logo_url',o.logo_url,'theme',o.theme,'contact_email',o.contact_email,'tagline',o.tagline,'term_name',c.term_name,'starts_on',c.starts_on,'ends_on',c.ends_on,'schedule',c.schedule,'course_details',c.course_details)
    from public.invites i join public.orgs o on o.id=i.org_id left join public.classes c on c.id=i.class_id and c.org_id=i.org_id
    where i.code=lower(btrim(p_code)) and i.uses_left>0 and i.expires_at>now()),
  (select json_build_object('type','site','role',s.role,'level',s.level) from public.site_invites s where s.code=lower(btrim(p_code)) and s.uses_left>0 and s.expires_at>now()));
$$;

create or replace function public.my_org() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'logo_url', o.logo_url, 'theme', o.theme, 'pass_mark', o.pass_mark,
    'tagline', o.tagline, 'about', o.about, 'welcome', o.welcome, 'city', o.city, 'country', o.country, 'website', o.website, 'contact_email', o.contact_email,
    'org_type', o.org_type, 'languages', o.languages, 'cover', o.cover, 'owner', o.owner = auth.uid(),
    'owner_name', case when o.kind = 'teacher' then (select display_name from public.profiles where user_id = o.owner) end,
    'class', (select json_build_object('id', c.id, 'name', c.name, 'level', c.level, 'pass_mark', c.pass_mark, 'term_name',c.term_name, 'starts_on',c.starts_on, 'ends_on',c.ends_on, 'schedule',c.schedule, 'course_details',c.course_details, 'meeting_details',c.meeting_details)
              from public.org_members m join public.classes c on c.id = m.class_id and c.org_id=m.org_id where m.org_id = o.id and m.user_id = auth.uid()))
  from public.profiles p join public.orgs o on o.id = p.org_id where p.user_id = auth.uid();
$$;
