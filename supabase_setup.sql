-- Wörterbuch: one row per user with their lists and flashcard decks.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

create table if not exists public.user_data (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  lists      jsonb not null default '{}'::jsonb,
  decks      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row level security: every account can only see and change its own row.
alter table public.user_data enable row level security;

drop policy if exists "own row: select" on public.user_data;
drop policy if exists "own row: insert" on public.user_data;
drop policy if exists "own row: update" on public.user_data;
drop policy if exists "own row: delete" on public.user_data;

create policy "own row: select" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own row: insert" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own row: update" on public.user_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own row: delete" on public.user_data
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Signed-out visitors get no access at all.
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;
