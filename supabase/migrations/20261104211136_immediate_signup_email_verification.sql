-- Password access and proof of mailbox ownership are separate product states.
-- Activation is a deliberate release step after the compatible code is deployed.
create schema if not exists app_private;
create table if not exists app_private.signup_policy(id boolean primary key default true check(id),immediate_access boolean not null default false);
insert into app_private.signup_policy(id) values(true) on conflict do nothing;
alter table app_private.signup_policy enable row level security;
revoke all on app_private.signup_policy from public,anon,authenticated;
create table if not exists app_private.email_verifications(
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null, verified_at timestamptz, created_at timestamptz not null default now(),
 next_send_at timestamptz default now(),last_sent_at timestamptz,stage integer not null default 0,
 attempts integer not null default 0,attempt_day date,day_count integer not null default 0,
 lease_id uuid,lease_until timestamptz,last_request_at timestamptz,suppressed_at timestamptz,last_error text
);
alter table app_private.email_verifications enable row level security;
revoke all on app_private.email_verifications from public,anon,authenticated;
create table if not exists app_private.email_verification_tokens(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,token_hash text not null,expires_at timestamptz not null default now()+interval '7 days'
);
create index if not exists email_verification_due on app_private.email_verifications(next_send_at) where verified_at is null and suppressed_at is null;
create index if not exists email_verification_token_user on app_private.email_verification_tokens(user_id);
alter table app_private.email_verification_tokens enable row level security;
revoke all on app_private.email_verification_tokens from public,anon,authenticated;

create or replace function app_private.email_is_verified(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select u.email_confirmed_at is not null
 and coalesce(u.raw_app_meta_data->>'dk_email_verification_required','false')<>'true'
 and not exists(select from app_private.email_verifications v where v.user_id=u.id and (v.verified_at is null or lower(v.email)<>lower(u.email)))
 from auth.users u where u.id=p_user),false);
$$;
revoke all on function app_private.email_is_verified(uuid) from public,anon,authenticated;

create or replace function app_private.mark_mailbox_pending() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' and exists(select from app_private.email_verifications v where v.user_id=new.id and v.email=lower(new.email) and v.verified_at is null) then
   new.raw_app_meta_data:=coalesce(new.raw_app_meta_data,'{}'::jsonb)||'{"dk_email_verification_required":true}'::jsonb;
 end if;
 if (select immediate_access from app_private.signup_policy where id) and new.email is not null
 and (TG_OP='INSERT' or new.email is distinct from old.email) then
   new.raw_app_meta_data:=coalesce(new.raw_app_meta_data,'{}'::jsonb)||'{"dk_email_verification_required":true}'::jsonb;
 end if;
 return new;
end $$;
revoke all on function app_private.mark_mailbox_pending() from public,anon,authenticated;
drop trigger if exists aa_mailbox_pending on auth.users;
create trigger aa_mailbox_pending before insert or update of email,raw_app_meta_data on auth.users for each row execute function app_private.mark_mailbox_pending();

create or replace function app_private.queue_mailbox_verification() returns trigger
language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 if coalesce(new.raw_app_meta_data->>'dk_email_verification_required','false')<>'true' or new.email is null then return new;end if;
 insert into app_private.email_verifications(user_id,email) values(new.id,lower(new.email))
 on conflict(user_id) do update set email=excluded.email,verified_at=null,created_at=now(),stage=0,next_send_at=now(),attempts=0,lease_id=null,lease_until=null,suppressed_at=null
 where app_private.email_verifications.email is distinct from excluded.email;
 -- A failed wakeup never blocks account creation. The Worker cron is the fallback.
 if to_regnamespace('net') is not null and to_regclass('vault.decrypted_secrets') is not null then
   select decrypted_secret into secret from vault.decrypted_secrets where name='deutschklinik_welcome_hook' limit 1;
   if secret is not null then
     perform net.http_post(url:='https://woerterbuch-bilder.edwin1kitaka.workers.dev/hooks/email-verification',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret),body:=jsonb_build_object('user_id',new.id),timeout_milliseconds:=7000);
   end if;
 end if;
 return new;
exception when others then raise warning 'Verification wakeup unavailable';return new;
end $$;
revoke all on function app_private.queue_mailbox_verification() from public,anon,authenticated;
drop trigger if exists ab_mailbox_queue on auth.users;
create trigger ab_mailbox_queue after insert or update of email on auth.users for each row execute function app_private.queue_mailbox_verification();

create or replace function app_private.verification_worker_authorized(p_secret text) returns void
language plpgsql stable security definer set search_path='' as $$
declare secret text;
begin
 select decrypted_secret into secret from vault.decrypted_secrets where name='deutschklinik_welcome_hook' limit 1;
 if secret is null or secret='' or p_secret is null or pg_catalog.md5(secret)<>pg_catalog.md5(p_secret) then raise exception 'not authorised';end if;
end $$;
revoke all on function app_private.verification_worker_authorized(text) from public,anon,authenticated;

create or replace function app_private.claim_verification_mail(p_worker_secret text,p_user uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v app_private.email_verifications; raw_token text; result jsonb:='[]'::jsonb; claim uuid; org jsonb;
begin
 perform app_private.verification_worker_authorized(p_worker_secret);
 delete from app_private.email_verification_tokens where expires_at<now();
 for v in select e.* from app_private.email_verifications e join auth.users u on u.id=e.user_id and lower(u.email)=e.email
 where e.verified_at is null and e.suppressed_at is null and e.next_send_at<=now()
 and (e.lease_until is null or e.lease_until<now()) and (e.attempt_day is distinct from current_date or e.day_count<3)
 and (p_user is null or e.user_id=p_user) order by e.next_send_at limit 5 for update of e skip locked loop
  raw_token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');claim:=gen_random_uuid();
  insert into app_private.email_verification_tokens(user_id,email,token_hash) values(v.user_id,v.email,encode(sha256(convert_to(raw_token,'UTF8')),'hex'));
  update app_private.email_verifications set lease_id=claim,lease_until=now()+interval '5 minutes',attempts=attempts+1,attempt_day=current_date,day_count=case when attempt_day=current_date then day_count+1 else 1 end where user_id=v.user_id;
  -- Only an actual membership/owned school or a valid bearer invite supplies public branding.
  select jsonb_build_object('name',o.name,'kind',o.kind,'theme',o.theme,'logo_url',o.logo_url,'contact_email',o.contact_email) into org
   from public.orgs o join public.profiles p on p.user_id=v.user_id
   where o.id=p.org_id or o.owner=v.user_id or exists(select from auth.users u join public.invites i on i.code=lower(btrim(u.raw_user_meta_data->>'join')) where u.id=v.user_id and i.org_id=o.id and i.uses_left>0 and i.expires_at>now() and (i.recipient_email is null or lower(i.recipient_email)=v.email))
   order by (o.id=p.org_id) desc nulls last,o.created_at limit 1;
  result:=result||jsonb_build_array(jsonb_build_object('user_id',v.user_id,'email',v.email,'stage',v.stage,'claim',claim,'token',raw_token,'org',org));
 end loop;
 return result;
end $$;
revoke all on function app_private.claim_verification_mail(text,uuid) from public,anon,authenticated;

create or replace function app_private.finish_verification_mail(p_worker_secret text,p_user uuid,p_claim uuid,p_sent boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform app_private.verification_worker_authorized(p_worker_secret);
 update app_private.email_verifications set lease_id=null,lease_until=null,
  last_sent_at=case when p_sent then now() else last_sent_at end,
  stage=case when p_sent then stage+1 else stage end,
  next_send_at=case when verified_at is not null or suppressed_at is not null then null
    when p_sent and stage=0 then now()+interval '24 hours'
    when p_sent and stage=1 then now()+interval '48 hours'
    when p_sent then null
    when attempts>=5 then null else now()+interval '15 minutes' end,
  attempts=case when p_sent then 0 else attempts end,last_error=case when p_sent then null else 'delivery_failed' end
 where user_id=p_user and lease_id=p_claim;
end $$;
revoke all on function app_private.finish_verification_mail(text,uuid,uuid,boolean) from public,anon,authenticated;

create or replace function app_private.email_verification_status() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('verified',app_private.email_is_verified(auth.uid()),'required',coalesce(u.raw_app_meta_data->>'dk_email_verification_required','false')='true','email',u.email,'initial_pending',exists(select from app_private.email_verifications e where e.user_id=u.id and e.stage=0 and e.last_sent_at is null))
 from auth.users u where u.id=auth.uid();
$$;
revoke all on function app_private.email_verification_status() from public,anon;
grant execute on function app_private.email_verification_status() to authenticated;

create or replace function app_private.request_email_verification() returns jsonb
language plpgsql security definer set search_path='' as $$
declare v app_private.email_verifications;
begin
 if auth.uid() is null then raise exception 'sign in first';end if;
 if app_private.email_is_verified(auth.uid()) then return '{"verified":true}'::jsonb;end if;
 select * into v from app_private.email_verifications where user_id=auth.uid() for update;
 if not found then raise exception 'verification unavailable';end if;
 if greatest(v.last_request_at,v.last_sent_at)>now()-interval '10 minutes' or (v.attempt_day=current_date and v.day_count>=3) then return '{"queued":false,"wait":true}'::jsonb;end if;
 update app_private.email_verifications set next_send_at=now(),last_request_at=now(),suppressed_at=null,attempts=0 where user_id=auth.uid();
 return '{"queued":true}'::jsonb;
end $$;
revoke all on function app_private.request_email_verification() from public,anon;
grant execute on function app_private.request_email_verification() to authenticated;

create or replace function app_private.confirm_email_token(p_user uuid,p_token text,p_stop boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v app_private.email_verifications;
begin
 perform 1 from auth.users where id=p_user for update;
 if length(p_token)<>64 or p_token!~'^[a-f0-9]+$' then raise exception 'invalid or expired confirmation link';end if;
 select * into v from app_private.email_verifications where user_id=p_user for update;
 if not found or not exists(select from app_private.email_verification_tokens t where t.user_id=p_user and t.email=v.email and t.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and t.expires_at>now())
 or not exists(select from auth.users u where u.id=p_user and lower(u.email)=v.email) then raise exception 'invalid or expired confirmation link';end if;
 if p_stop then
   update app_private.email_verifications set suppressed_at=now(),next_send_at=null where user_id=p_user;
   return '{"stopped":true}'::jsonb;
 end if;
 update app_private.email_verifications set verified_at=coalesce(verified_at,now()),next_send_at=null where user_id=p_user;
 update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"dk_email_verification_required":false}'::jsonb,email_confirmed_at=coalesce(email_confirmed_at,now()) where id=p_user;
 perform app_private.finish_onboarding(p_user);
 return '{"verified":true}'::jsonb;
end $$;
revoke all on function app_private.confirm_email_token(uuid,text,boolean) from public,anon,authenticated;
grant execute on function app_private.confirm_email_token(uuid,text,boolean) to anon,authenticated;

create or replace function app_private.verification_mail_current(p_worker_secret text,p_user uuid,p_claim uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform app_private.verification_worker_authorized(p_worker_secret);
 return jsonb_build_object('send',exists(select from app_private.email_verifications v join auth.users u on u.id=v.user_id and lower(u.email)=v.email where v.user_id=p_user and v.lease_id=p_claim and v.lease_until>now() and v.verified_at is null and v.suppressed_at is null));
end $$;
revoke all on function app_private.verification_mail_current(text,uuid,uuid) from public,anon,authenticated;

grant execute on function app_private.claim_verification_mail(text,uuid) to anon;
create or replace function public.claim_verification_mail(p_worker_secret text,p_user uuid default null) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.claim_verification_mail(p_worker_secret,p_user); $$;
revoke all on function public.claim_verification_mail(text,uuid) from public,anon,authenticated;
grant execute on function public.claim_verification_mail(text,uuid) to anon;

grant execute on function app_private.finish_verification_mail(text,uuid,uuid,boolean) to anon;
create or replace function public.finish_verification_mail(p_worker_secret text,p_user uuid,p_claim uuid,p_sent boolean) returns void
language sql security invoker set search_path='' as $$ select app_private.finish_verification_mail(p_worker_secret,p_user,p_claim,p_sent); $$;
revoke all on function public.finish_verification_mail(text,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.finish_verification_mail(text,uuid,uuid,boolean) to anon;

grant execute on function app_private.verification_mail_current(text,uuid,uuid) to anon;
create or replace function public.verification_mail_current(p_worker_secret text,p_user uuid,p_claim uuid) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.verification_mail_current(p_worker_secret,p_user,p_claim); $$;
revoke all on function public.verification_mail_current(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.verification_mail_current(text,uuid,uuid) to anon;

grant execute on function app_private.email_verification_status() to authenticated;
create or replace function public.email_verification_status() returns jsonb
language sql security invoker set search_path='' as $$ select app_private.email_verification_status(); $$;
revoke all on function public.email_verification_status() from public,anon,authenticated;
grant execute on function public.email_verification_status() to authenticated;

grant execute on function app_private.request_email_verification() to authenticated;
create or replace function public.request_email_verification() returns jsonb
language sql security invoker set search_path='' as $$ select app_private.request_email_verification(); $$;
revoke all on function public.request_email_verification() from public,anon,authenticated;
grant execute on function public.request_email_verification() to authenticated;

grant execute on function app_private.confirm_email_token(uuid,text,boolean) to anon,authenticated;
create or replace function public.confirm_email_token(p_user uuid,p_token text,p_stop boolean default false) returns jsonb
language sql security invoker set search_path='' as $$ select app_private.confirm_email_token(p_user,p_token,p_stop); $$;
revoke all on function public.confirm_email_token(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.confirm_email_token(uuid,text,boolean) to anon,authenticated;

create or replace function public._join(p_uid uuid, p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare i public.invites; o public.orgs; lv text;
begin
  if not app_private.email_is_verified(p_uid) then raise exception 'confirm your email before joining a school';end if;
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

create or replace function public._redeem_site_invite(p_uid uuid, p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare s public.site_invites; inf jsonb;
begin
  if not app_private.email_is_verified(p_uid) then raise exception 'confirm your email before joining a school';end if;
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
  if not app_private.email_is_verified(p_uid) then return;end if;
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
 into result from public.profiles p join auth.users u on u.id=p.user_id where p.user_id=p_user and app_private.email_is_verified(u.id);
 return coalesce(result,'{}'::jsonb);
end $$;

create or replace function public.queue_confirmed_welcome() returns trigger
language plpgsql security definer set search_path = '' as $$
declare hook_secret text;
begin
  if not app_private.email_is_verified(new.id) then return new;end if;
  select decrypted_secret into hook_secret from vault.decrypted_secrets
    where name='deutschklinik_welcome_hook' limit 1;
  if hook_secret is null then return new; end if;
  perform net.http_post(
    url := 'https://woerterbuch-bilder.edwin1kitaka.workers.dev/hooks/welcome',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||hook_secret),
    body := jsonb_build_object('schema','auth','table','users','type',TG_OP,
      'record',jsonb_build_object('id',new.id,'email',new.email,'email_confirmed_at',new.email_confirmed_at),
      'old_record',jsonb_build_object('email_confirmed_at',null)),
    timeout_milliseconds := 7000);
  return new;
exception when others then
  -- A mail outage must not prevent an account confirmation. Sign-in retries queueing.
  raise warning 'welcome notification unavailable';
  return new;
end $$;

-- Proof completion retries onboarding and wakes the existing welcome queue.
drop trigger if exists on_actual_email_verified on auth.users;
create trigger on_actual_email_verified after update of raw_app_meta_data on auth.users for each row
 when(old.raw_app_meta_data->>'dk_email_verification_required'='true' and new.raw_app_meta_data->>'dk_email_verification_required'='false') execute function public.finish_confirmed_invite();
drop trigger if exists queue_actual_email_welcome on auth.users;
create trigger queue_actual_email_welcome after update of raw_app_meta_data on auth.users for each row
 when(old.raw_app_meta_data->>'dk_email_verification_required'='true' and new.raw_app_meta_data->>'dk_email_verification_required'='false') execute function public.queue_confirmed_welcome();
