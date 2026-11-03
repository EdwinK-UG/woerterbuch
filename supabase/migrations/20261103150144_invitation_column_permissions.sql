-- Invitations use a column-level INSERT grant. Adding a recipient column does
-- not automatically extend it; keep this grant narrow and retain staff RLS.
grant insert (recipient_email) on public.invites to authenticated;
