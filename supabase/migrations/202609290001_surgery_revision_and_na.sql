-- Add explicit N/A imaging assessment values and an optional revision flag.
-- Existing Patte grades are preserved as their text equivalents.

alter table public.surgeries
  drop constraint if exists surgeries_patte_grade_check;

alter table public.surgeries
  alter column patte_grade type text using patte_grade::text;

alter table public.surgeries
  add constraint surgeries_patte_grade_check
  check (patte_grade in ('1', '2', '3', 'N/A')) not valid;

alter table public.surgeries
  drop constraint if exists surgeries_tangent_sign_check;

alter table public.surgeries
  add constraint surgeries_tangent_sign_check
  check (tangent_sign in ('Positive', 'Negative', 'N/A')) not valid;

alter table public.surgeries
  add column if not exists revision_surgery boolean;
