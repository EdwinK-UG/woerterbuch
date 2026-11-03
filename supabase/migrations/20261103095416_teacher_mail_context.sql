-- Teacher mail needs only one authorised application, not a service-role key.
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;

create or replace function app_private.teacher_mail_context(p_request uuid, p_worker_secret text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare hook_secret text; recipient text;
begin
  if auth.uid() is null then raise exception 'not authorised'; end if;
  select decrypted_secret into hook_secret from vault.decrypted_secrets
    where name = 'deutschklinik_welcome_hook' limit 1;
  if hook_secret is null or hook_secret = '' or p_worker_secret is null
     or pg_catalog.md5(hook_secret) <> pg_catalog.md5(p_worker_secret) then
    raise exception 'not authorised';
  end if;
  select coalesce(nullif(btrim(c.notification_email), ''), u.email)
    into recipient
    from public.live_class_requests r
    join public.classes c on c.id = r.class_id
    join public.orgs o on o.id = c.org_id
    join auth.users u on u.id = coalesce(c.teacher_id, o.owner)
    where r.id = p_request and r.user_id = auth.uid();
  if not found then raise exception 'not authorised'; end if;
  return jsonb_build_object('notification_email', recipient);
end $$;
revoke all on function app_private.teacher_mail_context(uuid,text) from public, anon, authenticated;
grant execute on function app_private.teacher_mail_context(uuid,text) to authenticated;

create or replace function public.teacher_mail_context(p_request uuid, p_worker_secret text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select app_private.teacher_mail_context(p_request, p_worker_secret);
$$;
revoke all on function public.teacher_mail_context(uuid,text) from public, anon;
grant execute on function public.teacher_mail_context(uuid,text) to authenticated;
