-- Add optional patient demographics without changing existing rows or RLS policies.
alter table public.patients
  add column if not exists diabetes_mellitus text,
  add column if not exists smoking_status text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_diabetes_mellitus_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_diabetes_mellitus_check
      check (diabetes_mellitus in ('Yes', 'No')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'patients_smoking_status_check'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_smoking_status_check
      check (smoking_status in ('Never', 'Former', 'Current')) not valid;
  end if;
end $$;
