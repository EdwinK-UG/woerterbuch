-- Wörterbuch: one row per user with their lists and flashcard decks.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

create table if not exists public.user_data (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  lists      jsonb not null default '{}'::jsonb,
  decks      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Additive upgrade for lists, decks and custom quizzes on existing installations.
alter table public.user_data add column if not exists prefs jsonb not null default '{}'::jsonb;
alter table public.user_data add column if not exists revision bigint not null default 0;
create or replace function public.bump_user_data_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists user_data_revision on public.user_data;
create trigger user_data_revision before update on public.user_data
for each row execute function public.bump_user_data_revision();

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

-- ===== Grammatik: one row per attempt ("Prüfen") at a grammar exercise =====
-- Run this part once as well (Supabase → SQL Editor → New query → paste → Run).
create table if not exists public.grammar_results (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  chapter    int  not null,
  exercise   text not null,
  score      int  not null check (score >= 0),
  total      int  not null check (total > 0 and score <= total),
  passed     boolean not null,
  answers    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists grammar_results_user on public.grammar_results (user_id, chapter, exercise);

alter table public.grammar_results enable row level security;
drop policy if exists "own results: select" on public.grammar_results;
drop policy if exists "own results: insert" on public.grammar_results;
create policy "own results: select" on public.grammar_results
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own results: insert" on public.grammar_results
  for insert to authenticated with check ((select auth.uid()) = user_id);
-- No update or delete: the history of attempts stays as it was.
revoke all on public.grammar_results from anon;
grant select, insert on public.grammar_results to authenticated;

-- A stable client ID makes a retried insert the same attempt.
alter table public.grammar_results add column if not exists attempt_id uuid;
alter table public.grammar_results alter column attempt_id set default gen_random_uuid();
create unique index if not exists grammar_attempt_identity on public.grammar_results(user_id,attempt_id);
create index if not exists grammar_results_user_id on public.grammar_results(user_id,id);

-- Security invoker retains the caller's row-level policies, including active-school checks.
create or replace function public.practice_summary(
  p_users uuid[], p_after_user uuid default null, p_after_chapter int default 0, p_after_exercise text default ''
) returns table(user_id uuid, chapter int, exercise text, best_score numeric, attempt_count bigint,
  last_at timestamptz, recent_count bigint, recent_score numeric)
language sql stable security invoker set search_path = '' as $$
  select r.user_id,r.chapter,r.exercise,max(r.score::numeric/r.total),count(*),max(r.created_at),
    count(*) filter(where r.created_at >= now()-interval '30 days'),
    coalesce(sum(r.score::numeric/r.total) filter(where r.created_at >= now()-interval '30 days'),0)
  from public.grammar_results r
  where r.user_id=any(p_users) and
    (p_after_user is null or (r.user_id,r.chapter,r.exercise)>(p_after_user,p_after_chapter,p_after_exercise))
  group by r.user_id,r.chapter,r.exercise
  order by r.user_id,r.chapter,r.exercise limit 500;
$$;
revoke all on function public.practice_summary(uuid[],uuid,int,text) from public,anon;
grant execute on function public.practice_summary(uuid[],uuid,int,text) to authenticated;
