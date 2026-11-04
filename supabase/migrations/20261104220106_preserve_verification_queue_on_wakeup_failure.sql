-- Commit the durable queue even when the optional network wakeup fails.
create or replace function app_private.queue_mailbox_verification() returns trigger
language plpgsql security definer set search_path='' as $$
declare secret text;
begin
 if coalesce(new.raw_app_meta_data->>'dk_email_verification_required','false')<>'true' or new.email is null then return new;end if;
 insert into app_private.email_verifications(user_id,email) values(new.id,lower(new.email))
 on conflict(user_id) do update set email=excluded.email,verified_at=null,created_at=now(),stage=0,next_send_at=now(),attempts=0,lease_id=null,lease_until=null,suppressed_at=null
 where app_private.email_verifications.email is distinct from excluded.email;
 -- A failed wakeup never blocks account creation. The Worker cron is the fallback.
 begin
 if to_regnamespace('net') is not null and to_regclass('vault.decrypted_secrets') is not null then
   select decrypted_secret into secret from vault.decrypted_secrets where name='deutschklinik_welcome_hook' limit 1;
   if secret is not null then
     perform net.http_post(url:='https://woerterbuch-bilder.edwin1kitaka.workers.dev/hooks/email-verification',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret),body:=jsonb_build_object('user_id',new.id),timeout_milliseconds:=7000);
   end if;
 end if;
 exception when others then raise warning 'Verification wakeup unavailable';
 end;
 return new;
end $$;
