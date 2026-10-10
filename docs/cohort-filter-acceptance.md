# Complete cohort filter acceptance

This extension keeps the existing shared, authenticated registry. No schema,
RLS, authentication, CRUD, or clinical-record changes are included.

## Filter checklist

Every row below is implemented in the UI and server-side Supabase predicates.
Every select option is tested independently against synthetic joined records,
including Any and Not recorded. Tests assert matching IDs, distinct patient
counts, both query roots, and export selection. Text, age and date bounds have
independent result tests. These are database-query transport fixtures, not a
claim that every option exists in the live clinical dataset.

| Input | Implemented | Automated result test |
| --- | --- | --- |
| Patient name (partial, case-insensitive) | Yes | Pass |
| MRN (partial) | Yes | Pass |
| Sex | Yes | Pass |
| Minimum age | Yes | Pass |
| Maximum age | Yes | Pass |
| Diabetes mellitus | Yes | Pass |
| Smoking status | Yes | Pass |
| Surgery date from | Yes | Pass |
| Surgery date to | Yes | Pass |
| Side | Yes | Pass |
| Surgeon (all three) | Yes | Pass |
| Revision surgery | Yes | Pass |
| Patte grade (including N/A) | Yes | Pass |
| Tangent sign (including N/A) | Yes | Pass |
| Red tear | Yes | Pass |
| Anterior cable tear | Yes | Pass |
| Acromioplasty | Yes | Pass |
| Subscapularis tear type | Yes | Pass |
| Subscapularis treatment | Yes | Pass |
| Biceps procedure (including Transposition) | Yes | Pass |
| Tenodesis location | Yes | Pass |
| Tear pattern | Yes | Pass |
| Footprint coverage | Yes | Pass |
| Repair type | Yes | Pass |
| Margin convergence | Yes | Pass |
| Graft use | Yes | Pass |
| Medialization | Yes | Pass |
| Superior capsule reconstruction | Yes | Pass |
| Tendon transfer | Yes | Pass |
| Preoperative imaging source | Yes | Pass |
| Ultrasound date from | Yes | Pass |
| Ultrasound date to | Yes | Pass |
| MRI date from | Yes | Pass |
| MRI date to | Yes | Pass |

## Additional coverage

- Independent contract asserts all 34 inputs and exact stored enum values.
- All 24 select conditions combined with AND: a record failing any one is excluded.
- Different surgeries cannot separately satisfy different conditions for a patient.
- NULL is never false, No, None or N/A. Tenodesis location implies Tenodesis.
- Date bounds are inclusive; reversed ranges are rejected; missing dates do not match.
- Clear filters restores the unfiltered cohort. Default page size is 50.
- XLSX test exports 120 matching records across pages with a simulated 37-row API cap.
- Workbook validation checks actual XLSX data, headers, freeze pane and autofilter.
- Browser inspection confirmed all 34 named controls and every option are present.
- Expand/collapse controls and section inventories make all filters discoverable.
- Form submission reads named controls, including native dates and autofill.
- Updated UI live smoke: surgeon + Patte 1 + 2026-09-01..2026-10-09 returned
  four matching surgeries with those dates and enabled export. Revision Not
  recorded returned 13 rows, all displaying Not recorded. Clear restored 18
  patients / 18 surgeries with every input empty. Collapse all closed all five
  sections. Tenotomy disabled tenodesis location; Any re-enabled it. Browser
  error log was empty and the page had no horizontal document overflow.

Earlier live acceptance of the unchanged query/export/CRUD implementation is
recorded in `cohort-search.md`, including two authenticated accounts returning
identical surgery IDs, a real filtered XLSX, and user-approved synthetic CRUD
tests followed by cleanup. This extension does not repeat clinical writes.

No new npm dependency or Supabase migration is required. Existing ExcelJS is
reused. Existing dependency audit findings remain documented in `cohort-search.md`.

Verification completed: 138 tests passed, strict `tsc --noEmit` passed, and
`npm run build` passed (Next.js 15.5.9, all 12 static pages generated). The first
sandboxed build stalled and was stopped; the subsequent unrestricted build
completed successfully. `.env.local` remains ignored. Only this document, the
cohort component and cohort tests changed in this extension.
