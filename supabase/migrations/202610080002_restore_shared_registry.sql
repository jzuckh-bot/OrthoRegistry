-- Restore shared authenticated-user CRUD; no clinical rows are changed.
begin;

alter table public.patients enable row level security;
alter table public.surgeries enable row level security;

do $$
declare p record;
begin
  -- Replace both permissive and restrictive clinical policies, including ownership.
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('patients', 'surgeries')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;

  -- Keep existing ownership metadata intact but stop assigning it on new rows.
  if exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'patients' and column_name = 'owner_id') then
    alter table public.patients alter column owner_id drop default;
  end if;
end $$;

grant select, insert, update, delete on public.patients, public.surgeries to authenticated;

create policy patients_shared_authenticated on public.patients
  for all to authenticated using (true) with check (true);

create policy surgeries_shared_authenticated on public.surgeries
  for all to authenticated using (true) with check (true);

commit;
