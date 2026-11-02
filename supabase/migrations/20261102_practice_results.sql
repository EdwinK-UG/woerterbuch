begin;
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
commit;
