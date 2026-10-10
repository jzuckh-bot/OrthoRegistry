# Dashboard cohort search and Excel export

## Behavior

- Shared registry: authenticated users query with their existing Supabase session.
  No owner filtering, service-role client, RLS change, or clinical mutation.
- Cohort unit: one surgery joined to its patient. Patients without a surgery are
  outside this surgery cohort. The patient total counts distinct matching patients.
- All non-empty filters use AND. Patient and surgery filters must match the same
  joined record; two different surgeries cannot satisfy separate conditions.
- Select fields offer Any, recorded values, and Not recorded (SQL NULL). No, None,
  zero, and N/A remain distinct from NULL.
- Age is completed years on the displayed Asia/Taipei search date, not age at
  surgery. Leap-day birthdays advance on March 1 in non-leap years. The same
  reference date is retained for pagination and export.
- A tenodesis-location filter implies a Tenodesis procedure. A location cannot
  be combined with Tenotomy/None/Transposition. Dates use inclusive bounds.
- Results use database sorting and 50-row pagination. Export fetches every
  matching page server-side (including when the API's response cap is below the
  export batch size), using the last submitted filters, not an edited draft.
- Changing filters disables export until Search is pressed. Clear filters
  submits an empty search. No matching surgeries disables export.

## Architecture

`src/lib/cohort/filters.ts` defines allowed filters, validation, birthday bounds,
and predicates. `query.ts` applies the same predicates to surgery results and
the patient count. It uses the existing `surgeries_patient_id_fkey` relationship.

`POST /api/cohort/search` returns one page plus totals. `POST /api/cohort/export`
returns a genuine XLSX file built with ExcelJS 4.4.0. Both verify the session with
`auth.getUser()`, keep existing RLS, and use private/no-store responses. Search
terms go in a POST body rather than the browser address bar. The Excel library
is imported only on the server export path.

Excel includes patient demographics, all clinical surgery fields, historical
subscapularis/biceps fields, and total/medial/lateral anchors. Dates are ISO
YYYY-MM-DD strings, MRNs stay text, booleans are Yes/No, and NULL is Not recorded.
Headers are bold, row 1 is frozen, autofilter is enabled, and widths are set.
Text is written as literal cells, never formulas. Oversized Excel cells or
worksheets fail with an explicit error instead of silently truncating data.

Search and export use current database contents at request time, not a database
snapshot. Export detects changed counts/duplicate rows across batches and asks
for a retry. Concurrent clinical edits with unchanged membership may still be
reflected in the exported data. No files or clinical exports are stored on the
server. Very large exports remain subject to the hosting memory/request limits;
an error must be retried with a narrower cohort rather than accepting a partial
file. The route declares a 60-second duration.

## Setup

Run `npm ci`. No new environment variables or Supabase migration is required.
The existing clinical-field migrations and shared-authenticated RLS restoration
must already be applied. A Git push does not apply database SQL.

## Verification

`npm test` runs deterministic tests using the real Supabase query builder and a
synthetic PostgREST-shaped transport, plus actual XLSX generation and readback:

- Single and combined filters; surgeon + Patte + date range.
- Same-surgery AND semantics and distinct patient counts.
- NULL/No/N/A distinctions; cleared filters; age boundaries and validation.
- All selection values; conditional tenodesis; database sorting and pagination.
- Export of all 120 matches across a 37-row API cap, excluding nonmatching rows;
  preservation of MRN leading zeroes and literal text; Excel header/freeze/filter.
- Empty export errors.

Also run `npm run typecheck` and `npm run build`.

These fixture tests do not prove deployed PostgREST/RLS behavior. Before commit
and push, complete the user's live acceptance requirements:

1. Sign into the local dashboard and run the above searches against the shared
   Supabase data; compare displayed counts, returned records and downloaded XLSX.
2. Check mobile layout, sorting, pagination, clear filters, loading/error states.
3. Verify existing patient/surgery CRUD using approved synthetic test records in
   a test environment, without changing existing clinical records.
4. Use a second authenticated account with identical filters and confirm the
   same shared results. Confirm logged-out requests cannot export clinical data.

Live acceptance and authorized synthetic-data cleanup are complete.

### Local verification status (2026-10-09)

- Strict TypeScript, `npm run build`, and all 13 deterministic tests passed.
- `.env.local` remains ignored; new feature files contain no service-role key.
- Local `/login` returned HTTP 200. An unauthenticated POST to the export
  endpoint returned a 307 redirect to `/login`, without clinical data.
- Local development reported an existing logo image decode error for
  `/orthoregistry-logo.png`; the branding assets were not changed in this work.
- First authenticated account live acceptance passed: unfiltered 18 patients /
  18 surgeries; Patte 1 returned 9; surgeon + Patte 1 + 2026-09-01 through
  2026-10-09 returned 4. Clear restored 18. Revision NULL returned 13, while No
  returned 4. Joined-patient age sorting returned ascending ages without errors.
- The browser downloaded a real XLSX for the 4-row combined cohort. Read-only
  workbook inspection confirmed 4 rows, matching dates/Patte values, 41 clinical
  columns, bold headers, freeze pane A2, autofilter A1:AO5, and no formula cells.
  Live data has only 18 surgeries, so multi-page coverage remains proven by the
  120-row fixture test rather than the production data.
- At the observed 714px viewport, the document did not overflow horizontally;
  the wide results table scrolled inside its own container. Browser error logs
  were empty during this authenticated check.
- After the user confirmed signing into the second account, a fresh browser
  search returned the same 18 surgery record links as the first-account baseline
  (not merely the same count). The identical surgeon + Patte + date-range search
  returned 4 matching rows with no errors. The user performed the account switch;
  credentials were not read or collected.
- On 2026-10-10, the user confirmed Test / MRN 1234 as synthetic data. Patient
  read/edit passed, retaining blank optional height and weight. A new explicitly
  labelled synthetic surgery was created, read, edited and read back successfully;
  both surgery saves returned to Patient Detail. User-created patient and earlier
  surgery records were also visible. No pre-existing clinical records were edited.
- Following explicit user approval, standalone surgery deletion passed. The user
  completed the patient deletion confirmations, removing the synthetic patient
  and remaining linked surgery. A fresh cohort query returned 18 patients / 18
  surgeries with exactly the original 18 surgery record links, and the patient
  dashboard total returned to 18. No synthetic records remain in those results.
- `npm audit --omit=dev` reports seven affected production dependencies (two
  moderate, four high, one critical), including the existing Next.js 15.5.9 and
  ExcelJS's indirect `uuid` dependency. A successful build is not a clean
  security audit. Framework upgrades have not been bundled into this feature;
  review and remediate these findings separately before production release.
