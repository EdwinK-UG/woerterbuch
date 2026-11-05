-- Legacy storage protection for the abandoned source-image workbook.
-- Current native grammar lessons do not use this bucket or its image assets.
-- Retain this migration to record the private-bucket access restrictions;
-- its presence in git neither applies it nor deploys any lesson content.
-- Hosted migration history confirmed version 20261104232256 on 2026-11-05.
-- A public bucket would bypass these enrolment checks entirely.
do $migration$
begin
if to_regclass('storage.buckets') is not null then
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('grammar-source', 'grammar-source', false, 2097152, array['image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "grammar source: enrolled read" on storage.objects;
create policy "grammar source: enrolled read" on storage.objects
for select to authenticated
using (
  bucket_id = 'grammar-source'
  and exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
    and (
      p.role in ('founder', 'school', 'teacher')
      or (
        (storage.foldername(name))[1] in ('B2', 'C1')
        and (storage.foldername(name))[1] = any(p.unlocked)
      )
      or (
        (storage.foldername(name))[1] = 'Liste'
        and p.unlocked && array['A1', 'A2', 'B1', 'B2', 'C1']::text[]
      )
    )
  )
);
-- Uploads use the private deployment account. No client upload/write policy.

end if;
end
$migration$;
