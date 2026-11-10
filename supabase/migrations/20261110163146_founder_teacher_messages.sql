begin;
-- Contact addresses are resolved only for the mail Worker. Browsers receive
-- names/IDs (plus the founder's existing email directory), never a teacher's
-- access to an unrelated class or a general auth.users directory.
create schema if not exists app_private;
-- Preserve existing anon schema usage for secret-protected welcome callbacks.
-- Each new mail function below still explicitly denies anon execution.
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;
create index if not exists org_members_mail_class_students on public.org_members(class_id,user_id) where member_role='student';

create or replace function app_private.message_sender_allowed(p_class uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select auth.uid() is not null
 and exists(select from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null
   and u.raw_app_meta_data->>'dk_email_verification_required' is distinct from 'true')
 and (public.is_founder() or (p_class is not null
   and exists(select from public.profiles p where p.user_id=auth.uid() and p.role in ('teacher','school'))
   and public.can_manage_class(p_class)
   and exists(select from public.classes c join public.orgs o on o.id=c.org_id where c.id=p_class
     and (o.owner=auth.uid() or exists(select from public.org_members staff
       where staff.org_id=o.id and staff.user_id=auth.uid() and staff.member_role='teacher')))));
$$;
revoke all on function app_private.message_sender_allowed(uuid) from public,anon,authenticated;

create or replace function app_private.message_recipients(p_class uuid default null,p_search text default '',p_offset int default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; founder boolean;
begin
 if not app_private.message_sender_allowed(p_class) then raise exception 'not authorised' using errcode='42501'; end if;
 founder:=public.is_founder();
 with eligible as (
   select u.id,coalesce(nullif(p.display_name,''),case when founder then u.email else 'Learner' end) as name,
     case when founder then u.email end as email,coalesce(p.role,'learner') as role
   from auth.users u left join public.profiles p on p.user_id=u.id
   where nullif(btrim(u.email),'') is not null and
     (p_class is null or exists(select from public.org_members m join public.classes c on c.id=m.class_id and c.org_id=m.org_id
       where c.id=p_class and m.user_id=u.id and m.member_role='student' and p.org_id=m.org_id))
     and (coalesce(p_search,'')='' or position(lower(left(p_search,120)) in lower(coalesce(p.display_name,'')||case when founder then ' '||u.email else '' end))>0)
 ), page as (select * from eligible order by lower(name),id limit 50 offset greatest(0,least(coalesce(p_offset,0),100000)))
 select jsonb_build_object('total',(select count(*) from eligible),'users',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function app_private.message_recipients(uuid,text,int) from public,anon;
grant execute on function app_private.message_recipients(uuid,text,int) to authenticated;
create or replace function public.message_recipients(p_class uuid default null,p_search text default '',p_offset int default 0)
returns jsonb language sql stable security invoker set search_path='' as $$
 select app_private.message_recipients(p_class,p_search,p_offset);
$$;
revoke all on function public.message_recipients(uuid,text,int) from public,anon;
grant execute on function public.message_recipients(uuid,text,int) to authenticated;

create or replace function app_private.message_delivery_context(p_recipient uuid,p_class uuid,p_worker_secret text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare hook_secret text; recipient jsonb; org jsonb;
begin
 if not app_private.message_sender_allowed(p_class) then raise exception 'not authorised' using errcode='42501'; end if;
 select decrypted_secret into hook_secret from vault.decrypted_secrets where name='deutschklinik_welcome_hook' limit 1;
 if nullif(hook_secret,'') is null or p_worker_secret is null or pg_catalog.md5(hook_secret)<>pg_catalog.md5(p_worker_secret) then
   raise exception 'not authorised' using errcode='42501';
 end if;
 select jsonb_build_object('id',u.id,'email',u.email,'name',coalesce(p.display_name,'')) into recipient
 from auth.users u left join public.profiles p on p.user_id=u.id where u.id=p_recipient and nullif(btrim(u.email),'') is not null
 and (p_class is null or exists(select from public.org_members m join public.classes c on c.id=m.class_id and c.org_id=m.org_id
   where c.id=p_class and m.user_id=u.id and m.member_role='student' and p.org_id=m.org_id));
 if recipient is null then raise exception 'recipient unavailable' using errcode='42501'; end if;
 if p_class is not null then
   select jsonb_build_object('name',o.name,'theme',o.theme,'logo_url',o.logo_url,'contact_email',o.contact_email)
   into org from public.classes c join public.orgs o on o.id=c.org_id where c.id=p_class;
 end if;
 return jsonb_build_object('recipient',recipient,'org',org,'class_name',(select name from public.classes where id=p_class),'sender_name',(select display_name from public.profiles where user_id=auth.uid()));
end $$;
revoke all on function app_private.message_delivery_context(uuid,uuid,text) from public,anon;
grant execute on function app_private.message_delivery_context(uuid,uuid,text) to authenticated;
create or replace function public.message_delivery_context(p_recipient uuid,p_class uuid,p_worker_secret text)
returns jsonb language sql stable security invoker set search_path='' as $$
 select app_private.message_delivery_context(p_recipient,p_class,p_worker_secret);
$$;
revoke all on function public.message_delivery_context(uuid,uuid,text) from public,anon;
grant execute on function public.message_delivery_context(uuid,uuid,text) to authenticated;
commit;
