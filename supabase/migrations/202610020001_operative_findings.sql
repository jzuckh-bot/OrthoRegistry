-- New structured operative fields; existing rows and legacy fields are preserved.
begin;

alter table public.surgeries
  add column if not exists acromioplasty boolean,
  add column if not exists subscapularis_tear_type text
    check (subscapularis_tear_type in ('None', 'Partial', 'Full thickness with retraction (comma sign +)')),
  add column if not exists subscapularis_treatment text
    check (subscapularis_treatment in ('None', 'Debridement', 'Repair')),
  add column if not exists tenodesis_location text
    check (tenodesis_location in ('Subpectoral', 'Suprapectoral')),
  add column if not exists tear_pattern text
    check (tear_pattern in ('U shape', 'L shape')),
  add column if not exists footprint_coverage text
    check (footprint_coverage in ('Direct repair', 'Incomplete footprint coverage', 'Partial repair')),
  add column if not exists superior_capsule_reconstruction boolean,
  add column if not exists tendon_transfer text
    check (tendon_transfer in ('None', 'LTT', 'LD'));

alter table public.surgeries
  drop constraint if exists surgeries_biceps_procedure_check;
alter table public.surgeries
  add constraint surgeries_biceps_procedure_check
    check (biceps_procedure in ('None', 'Tenotomy', 'Tenodesis', 'Transposition')) not valid;

commit;

