# Clinical cohort grouping (supersedes the five-section UI checklist)

Seven sections, in order: Surgeon; Patient; Imaging / Preop; Tear pattern;
Subscapularis; Biceps; Repair. Existing name/MRN, dates and repair-type filters
are retained. Side is under Patient; acromioplasty is under Repair.

## Schema provenance

No migration, clinical data updates, auth or RLS changes are needed.
The existing surgery migration, database types and surgery validation agree:

| Requested finding | Stored source | Meaning |
| --- | --- | --- |
| Partial tear | diagnosis | Partial-thickness supraspinatus tear |
| Full thickness tear | diagnosis | Full-thickness supraspinatus tear |
| Massive tear | diagnosis | Massive rotator cuff tear |
| U shape / L shape | tear_pattern | Mutually exclusive existing categories |
| Red tear | red_tear | Nullable boolean |
| Anterior cable tear | anterior_cable_tear | Nullable boolean |
| Anchor number | number_of_anchors | Stored total, 0..20; row counts retained in export |
| MRI / Sono | preop_imaging_source | Single source: MRI / Ultrasound / Cloud imaging |

The first three diagnoses are not independent boolean findings. Search uses
their exact stored strings. Excel's three indicators are exact category
membership: Yes for that category, No for a different recorded category, and
Not recorded for NULL. U/L indicators follow the same rule. Neither diagnosis
nor prior examination history is inferred. The workbook includes a data
interpretation note and retains original diagnosis and tear_pattern columns.

MRI and Sono share a single source selector because the existing data model
stores only one source. Each examination retains its independent optional date
range. This does not answer whether both investigations were ever performed.

## Verification checklist

Automated tests cover all 38 inputs, each categorical value and missingness,
same-surgery AND logic, exact/range anchors including zero, invalid ranges,
distinct patient counts, 50-row pagination, and 120-row filtered XLSX export
across a lower simulated API cap. Excel order and NULL indicators are tested.

SURGEON
- [x] Surgeon

PATIENT
- [x] Age
- [x] Sex
- [x] DM
- [x] Smoking
- [x] Side

IMAGING / PREOP
- [x] Primary / Revision
- [x] Patte
- [x] Tangent sign
- [x] MRI
- [x] Sono

TEAR PATTERN
- [x] Partial tear
- [x] Full thickness tear
- [x] Massive tear
- [x] U shape
- [x] L shape
- [x] Red tear
- [x] Anterior cable tear

SUBSCAPULARIS
- [x] Partial / Full thickness
- [x] Debridement / Repair

BICEPS
- [x] None / Tenotomy / Tenodesis
- [x] Subpectoral / Suprapectoral

REPAIR
- [x] Margin convergence
- [x] Footprint coverage
- [x] Graft
- [x] Medialization
- [x] SCR
- [x] Tendon transfer
- [x] Acromioplasty
- [x] Anchor number

No new npm packages. Query transport, authentication, RLS and CRUD are unchanged.
Prior two-account and synthetic CRUD acceptance is documented in cohort-search.md;
this change does not repeat database writes. Automated tests use synthetic data,
not a replacement for live RLS verification. Prior security audit caveats remain.

Final verification: 146 tests, strict TypeScript and production build passed.
Browser verification showed all seven sections, full-thickness diagnosis with
anchors 2..10 returned ten matching rows, filtered export completed, clear
restored the then-current 19 patients / 19 surgeries, and diagnosis NULL returned
zero with Export disabled. No clinical data was written during these checks.
