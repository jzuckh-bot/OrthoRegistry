# Phase 1 ASES — implementation and rollout

## Status

Release authorized by the user on 2026-10-15 after shared-account acceptance.
Live CRUD and scoring were exercised on synthetic records only.
No public links, QR forms, ownership isolation or cohort redesign are included.
Local verification (2026-10-14): 152 combined cohort/ASES tests, strict TypeScript
and `npm run build` all passed. The sandbox build hit EPERM creating a `.next`
directory; the identical build outside the sandbox completed successfully.
Mobile Sign out was added using the existing handler; TypeScript and the
production build passed again after that change. Deployment status must be
confirmed separately from local verification.

## Supabase setup

1. In the existing Supabase project `urpnhpfrbvyoydidmghy`, open SQL Editor.
2. Review and run the complete `supabase/migrations/202610120001_ases_assessments.sql`
   once. It runs in a transaction. Do not run only selected lines.
3. Confirm `public.ases_assessments` exists and RLS is enabled. Existing patients,
   surgeries and their policies are untouched. A unique `(id, patient_id)` index
   is added to surgeries solely to support the same-patient composite FK.
4. Reload a local Patient Detail page. The Function Scores / ASES section should
   load, with Add ASES enabled. No new Vercel environment variables or credentials.
5. Use an explicitly designated synthetic patient/surgery for acceptance below.
   Do not enter invented assessments on real clinical records.
6. Only after acceptance, commit/push the reviewed code; Vercel builds main.

The SQL intentionally fails if the table already exists: inspect that schema
before retrying rather than silently accepting an unknown table definition.

## Data and scoring

Columns: id, patient_id, surgery_id, assessment_date, timepoint,
custom_timepoint, completed_by, pain_score, function_put_on_coat,
function_sleep_affected_side, function_wash_back, function_toileting,
function_comb_hair, function_high_shelf, function_lift_4_5kg,
function_throw_ball, function_usual_work, function_usual_sport,
ases_pain_component, ases_function_component, ases_total_score, created_at,
updated_at, created_by.

Every raw answer is a NOT NULL bounded integer. Metadata selections may be NULL;
Other requires custom_timepoint. Every score is a stored generated numeric column:

```
pain_component = (10 - pain_score) * 5
function_component = (sum of all 10 function responses / 30) * 50
total = pain_component + function_component
```

No intermediate rounding is performed. UI shows two decimal places; Excel
retains numeric precision. `calculateAses` returns NULL unless all eleven raw
answers are valid. The server validates/recalculates, rejects supplied totals,
and writes only raw input. PostgreSQL recomputes persisted scores for every
insert/update, including direct API writes. Export checks scores against raw
responses and fails on inconsistency. No missing answer becomes zero.

`created_by` is assigned by auth.uid() on insert and remains an audit identifier
if the account is removed. It is not an access-control owner. All four policies
allow only authenticated shared access; anon has no table privileges.

## Deletion safety

Deleting one assessment affects only that row. Patient and linked surgery FKs
use RESTRICT: delete/unlink assessments explicitly before deleting their parents.
There is no cascading deletion. Patient deletion checks for ASES before deleting
any surgeries, avoiding the pre-existing two-step deletion reaching a blocked
patient after deleting surgeries. The database remains the final FK authority.

## UI / export

Patient Detail contains newest-first history and inline Add/View/Edit forms.
The questionnaire uses the exact supplied Traditional Chinese strings and
touch-friendly 0–10 and 0–3 buttons. A clear missing-question list blocks save.
Only surgeries from this patient are offered; both API validation and the
composite FK reject other patients' surgeries.

Export ASES Excel exports ALL assessments for the current patient, one row per
assessment, not the cohort-search result. Rows are fetched in batches, with count
and duplicate checks. The workbook includes demographics, optional surgery,
all raw answers, components, total and timestamps; it freezes/bolds the header,
adds an autofilter and preserves MRNs as text. ExcelJS is reused; no new packages.

## Acceptance (must finish after migration)

- [x] Chinese ASES questionnaire implemented
- [x] Pain 0–10 implemented
- [x] All 10 function items implemented
- [x] 4.5 kg wording implemented
- [x] Raw answers stored (live save/reopen and export)
- [x] Pain component calculated (unit and live round-trip)
- [x] Function component calculated (unit and live round-trip)
- [x] Total ASES calculated (unit and live round-trip)
- [x] Missing answers are not treated as zero
- [x] Patient Detail history works (Preop and 3 months verified)
- [x] Add/Edit/Delete works (live add/edit; user confirmed isolated deletion)
- [x] Surgery linking works (same-patient save and restricted selector verified;
  composite FK and server guard reviewed, direct cross-patient SQL not executed)
- [x] Excel export works (unit workbook test and downloaded XLSX inspected)
- [x] Shared authenticated access (user confirmed second account sees Preop 50;
  authenticated-only policies reviewed; unauthenticated API returned 401)

Test at least: pain=0 and all functions=3 yields 100; pain=10 and all=0 yields 0;
pain=4 and all=1 yields 46.666...; changing one function from 3 to 0 lowers total
by 5. Save/reopen all raw answers, add Preop and 3 months, link correct surgery,
reject cross-patient link, export/reload XLSX, use a second authenticated account
to view the same rows, and verify unauthenticated access is denied. Confirm one
assessment deletion leaves other assessments, patient and surgery intact.
Permanent deletion during browser testing requires explicit user confirmation.

## Live acceptance progress

User reported migration success. Authenticated read of the new table passed.
User authorized a synthetic patient (MRN ASES-TEST-20261013) and synthetic surgery.
Live form verified missing-answer blocking and the exact ten Chinese questions.
Preop: pain 4 and ten function answers of 1 saved and reopened as 30 + 16.666... =
46.666.... Editing coat to 3 persisted as 30 + 20 = 50. A second unlinked
3 months assessment with pain 0 and ten 3s persisted as 100. Both appear in
history. Related-surgery selector offered only the synthetic patient's surgery.
The live XLSX download was inspected on 2026-10-14: ASES!A1:AC3 contains 29
columns and both assessments. All ten raw responses and pain/function/total
components agree with the saved records (50 and 100). Native XLSX XML confirms
bold wrapped headers, a frozen first row, autofilter A1:AC3 and column widths.
An artifact-tool import displayed empty shared strings as "33"; inspecting the
actual sharedStrings.xml confirmed index 33 is an empty string, not stored data.
No workbook was modified.

The first deletion attempt was inconclusive (zero records visible). With explicit
user approval, two new synthetic assessments were saved on 2026-10-14: Preop 50
linked to the test surgery and unlinked 3 months 100. Both survived reload.
The user then confirmed deleting only 3 months left Preop 50. On 2026-10-15 the
user confirmed the second authenticated account also sees Preop 50 and authorized
production release. These manual results are user-attested, not automated browser
account-identity verification. Test records remain; no cleanup is authorized by
the release request. No real clinical records were changed during acceptance.

The live test found an origin-validation mismatch: browser Origin/Host were
127.0.0.1:3000 while Next's internal request URL used localhost:3000. The API now
checks the actual Host and scheme, rejecting missing/cross-site origins; added
origin regression tests pass. Final TypeScript/build rerun passed on 2026-10-14.
