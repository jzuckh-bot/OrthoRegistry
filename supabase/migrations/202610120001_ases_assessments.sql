-- Additive Phase 1 ASES. Does not update/delete clinical records or existing RLS.
begin;
-- Required by the composite FK: prevents linking an assessment to another patient's surgery.
create unique index if not exists surgeries_id_patient_id_ases_key on public.surgeries(id, patient_id);
create table public.ases_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  surgery_id uuid,
  assessment_date date not null,
  timepoint text check (timepoint in ('Preop','2 weeks','6 weeks','3 months','6 months','1 year','2 years','Other')),
  custom_timepoint text,
  completed_by text check (completed_by in ('Patient','Assistant','Clinician')),
  pain_score integer not null check (pain_score between 0 and 10),
  function_put_on_coat integer not null check (function_put_on_coat between 0 and 3),
  function_sleep_affected_side integer not null check (function_sleep_affected_side between 0 and 3),
  function_wash_back integer not null check (function_wash_back between 0 and 3),
  function_toileting integer not null check (function_toileting between 0 and 3),
  function_comb_hair integer not null check (function_comb_hair between 0 and 3),
  function_high_shelf integer not null check (function_high_shelf between 0 and 3),
  function_lift_4_5kg integer not null check (function_lift_4_5kg between 0 and 3),
  function_throw_ball integer not null check (function_throw_ball between 0 and 3),
  function_usual_work integer not null check (function_usual_work between 0 and 3),
  function_usual_sport integer not null check (function_usual_sport between 0 and 3),
  ases_pain_component numeric generated always as ((10 - pain_score) * 5) stored,
  ases_function_component numeric generated always as ((function_put_on_coat + function_sleep_affected_side + function_wash_back + function_toileting + function_comb_hair + function_high_shelf + function_lift_4_5kg + function_throw_ball + function_usual_work + function_usual_sport)::numeric / 30 * 50) stored,
  ases_total_score numeric generated always as ((10 - pain_score) * 5 + (function_put_on_coat + function_sleep_affected_side + function_wash_back + function_toileting + function_comb_hair + function_high_shelf + function_lift_4_5kg + function_throw_ball + function_usual_work + function_usual_sport)::numeric / 30 * 50) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Audit identifier is retained even if the auth account is later removed.
  created_by uuid default auth.uid(),
  constraint ases_surgery_patient_fk foreign key (surgery_id, patient_id) references public.surgeries(id, patient_id) on delete restrict,
  constraint ases_custom_timepoint_check check ((timepoint = 'Other' and nullif(btrim(custom_timepoint),'') is not null and length(custom_timepoint) <= 200) or (timepoint is distinct from 'Other' and custom_timepoint is null))
);
create index ases_patient_date_idx on public.ases_assessments(patient_id, assessment_date desc, id);
create index ases_surgery_idx on public.ases_assessments(surgery_id);
create index ases_date_idx on public.ases_assessments(assessment_date);
create index ases_timepoint_idx on public.ases_assessments(timepoint);
create function public.ases_set_metadata() returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    new.created_by := auth.uid(); new.created_at := now();
  else
    new.created_by := old.created_by; new.created_at := old.created_at;
    if new.patient_id <> old.patient_id then raise exception 'Assessment patient cannot be changed'; end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger ases_metadata before insert or update on public.ases_assessments for each row execute function public.ases_set_metadata();
alter table public.ases_assessments enable row level security;
revoke all on public.ases_assessments from anon;
grant select, insert, update, delete on public.ases_assessments to authenticated;
create policy ases_shared_select on public.ases_assessments for select to authenticated using (true);
create policy ases_shared_insert on public.ases_assessments for insert to authenticated with check (true);
create policy ases_shared_update on public.ases_assessments for update to authenticated using (true) with check (true);
create policy ases_shared_delete on public.ases_assessments for delete to authenticated using (true);
commit;
