-- OrthoRegistry Phase 2: Rotator cuff surgery fields.
-- Additive only: does not update or delete patients or existing surgery rows.

alter table public.surgeries
  add column if not exists patient_id uuid,
  add column if not exists surgery_date date,
  add column if not exists side text,
  add column if not exists diagnosis text,
  add column if not exists patte_grade smallint,
  add column if not exists tangent_sign text,
  add column if not exists subscapularis_tear boolean,
  add column if not exists biceps_lesion boolean,
  add column if not exists repair_type text,
  add column if not exists number_of_anchors smallint,
  add column if not exists biceps_procedure text,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'surgeries_patient_id_fkey') then
    alter table public.surgeries
      add constraint surgeries_patient_id_fkey
      foreign key (patient_id) references public.patients(id)
      on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'surgeries_side_check') then
    alter table public.surgeries add constraint surgeries_side_check
      check (side in ('Right', 'Left')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'surgeries_diagnosis_check') then
    alter table public.surgeries add constraint surgeries_diagnosis_check
      check (diagnosis in (
        'Partial-thickness supraspinatus tear',
        'Full-thickness supraspinatus tear',
        'Massive rotator cuff tear'
      )) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'surgeries_patte_grade_check') then
    alter table public.surgeries add constraint surgeries_patte_grade_check
      check (patte_grade between 1 and 3) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'surgeries_tangent_sign_check') then
    alter table public.surgeries add constraint surgeries_tangent_sign_check
      check (tangent_sign in ('Positive', 'Negative')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'surgeries_repair_type_check') then
    alter table public.surgeries add constraint surgeries_repair_type_check
      check (repair_type in ('Single row', 'Double row', 'Partial repair')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'surgeries_anchor_count_check') then
    alter table public.surgeries add constraint surgeries_anchor_count_check
      check (number_of_anchors between 0 and 20) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'surgeries_biceps_procedure_check') then
    alter table public.surgeries add constraint surgeries_biceps_procedure_check
      check (biceps_procedure in ('None', 'Tenotomy', 'Tenodesis')) not valid;
  end if;
end $$;

create index if not exists surgeries_patient_id_surgery_date_idx
  on public.surgeries (patient_id, surgery_date desc);

-- RLS remains enabled and existing policies are preserved.
-- If surgeries has no policies yet, create authenticated CRUD policies separately
-- according to your organization-level access model.
