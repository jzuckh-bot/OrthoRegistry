-- Add an optional single-select preoperative imaging source and matching dates.
-- Existing surgery rows remain unchanged with NULL values.
alter table public.surgeries
  add column if not exists preop_imaging_source text,
  add column if not exists preop_ultrasound_date date,
  add column if not exists preop_mri_date date;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'surgeries_preop_imaging_source_check'
      and conrelid = 'public.surgeries'::regclass
  ) then
    alter table public.surgeries
      add constraint surgeries_preop_imaging_source_check
      check (preop_imaging_source in ('Ultrasound', 'MRI', 'Cloud imaging')) not valid;
  end if;
end $$;
