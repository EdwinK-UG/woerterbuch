-- Where each signed-in learner stopped, so the website and the apps can offer "Continue" at the same place.
-- One row per account. `place` is small: {"ch": 12, "part": "ue-3"} (part: an exercise "ue-<id>", or a chapter
-- section such as "grs-v"; null = the chapter itself). `at` is when the learner was there, by the device's clock;
-- a device that comes back online with an older place can't overwrite a newer one.
begin;
create table if not exists public.learner_places (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  place      jsonb not null check (jsonb_typeof(place) = 'object' and octet_length(place::text) <= 1000),
  at         timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.learner_places enable row level security;
drop policy if exists "own place: select" on public.learner_places;
drop policy if exists "own place: insert" on public.learner_places;
drop policy if exists "own place: update" on public.learner_places;
create policy "own place: select" on public.learner_places for select to authenticated using (user_id = (select auth.uid()));
create policy "own place: insert" on public.learner_places for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own place: update" on public.learner_places for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.learner_places from anon, authenticated;
grant select, insert, update on public.learner_places to authenticated;

create or replace function public.keep_newest_learner_place() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.at < old.at then return old; end if;   -- an older place arriving late keeps the newer one
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists learner_places_newest on public.learner_places;
create trigger learner_places_newest before update on public.learner_places
for each row execute function public.keep_newest_learner_place();
commit;
