-- Hosted upgrade. Provision deutschklinik_welcome_hook in Vault before applying.
-- Only the three fields needed for a welcome message leave the Auth database.
begin;
create extension if not exists pg_net with schema extensions;
create or replace function public.queue_confirmed_welcome() returns trigger
language plpgsql security definer set search_path = '' as $$
declare hook_secret text;
begin
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
revoke all on function public.queue_confirmed_welcome() from public,anon,authenticated;
drop trigger if exists queue_welcome_insert on auth.users;
create trigger queue_welcome_insert after insert on auth.users for each row
  when(new.email_confirmed_at is not null) execute function public.queue_confirmed_welcome();
drop trigger if exists queue_welcome_confirmed on auth.users;
create trigger queue_welcome_confirmed after update of email_confirmed_at on auth.users for each row
  when(old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.queue_confirmed_welcome();
commit;
