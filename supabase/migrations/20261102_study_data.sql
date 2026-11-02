begin;
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
commit;
