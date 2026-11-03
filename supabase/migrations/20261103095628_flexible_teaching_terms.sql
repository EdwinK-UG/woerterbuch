-- Each class is a level-specific cohort for one independently scheduled term.
alter table public.classes add column if not exists term_name text check (char_length(term_name) <= 80);
alter table public.classes add column if not exists course_details text check (char_length(course_details) <= 1200);
do $$ begin
  if not exists (select from pg_constraint where conrelid='public.classes'::regclass and conname='class_dates_ordered') then
    alter table public.classes add constraint class_dates_ordered check (starts_on is null or ends_on is null or ends_on >= starts_on);
  end if;
  if not exists (select from pg_constraint where conrelid='public.classes'::regclass and conname='published_term_complete') then
    alter table public.classes add constraint published_term_complete check (
      not live_open or (nullif(btrim(term_name),'') is not null and starts_on is not null and ends_on is not null and nullif(btrim(schedule),'') is not null));
  end if;
end $$;
create or replace function public.live_class_catalog() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.starts_on nulls last, x.name), '[]'::json)
  from (
    select c.id, c.name, c.level, c.term_name, c.starts_on, c.ends_on, c.schedule, c.course_details,
      o.name as organisation, coalesce(p.display_name, o.name) as teacher
    from public.classes c join public.orgs o on o.id=c.org_id
    left join public.profiles p on p.user_id=c.teacher_id where c.live_open
  ) x;
$$;
revoke all on function public.live_class_catalog() from public;
grant execute on function public.live_class_catalog() to anon, authenticated;
