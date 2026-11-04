-- Run once after the compatible migration, website and mail Worker are deployed.
-- Then set Auth > Email > Confirm email OFF: mailbox proof is now handled separately.
begin;
insert into app_private.email_verifications(user_id,email)
 select id,lower(email) from auth.users where email_confirmed_at is null and email is not null
 on conflict(user_id) do nothing;
update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"dk_email_verification_required":true}'::jsonb,
 email_confirmed_at=now()
 where email_confirmed_at is null and exists(select from app_private.email_verifications v where v.user_id=auth.users.id and v.verified_at is null);
update app_private.signup_policy set immediate_access=true where id;
commit;
