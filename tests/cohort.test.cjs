const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
const { cohortRequestSchema, buildPredicates, ageAt, FILTERS } = require('../src/lib/cohort/filters.ts');
const { searchCohort, allCohortRows, surgeryQuery } = require('../src/lib/cohort/query.ts');
const { createCohortWorkbook, EXPORT_COLUMNS } = require('../src/lib/cohort/excel.ts');
const asOf = '2026-10-08';
const request = filters => cohortRequestSchema.parse({ filters });

const patients = [
  { id: 'p1', mrn: '000123', name: 'Synthetic Alpha', birthday: '1980-10-09', sex: 'Female', diabetes_mellitus: null, smoking_status: null, height: null, weight: null, bmi: null },
  { id: 'p2', mrn: '000456', name: 'Synthetic Beta', birthday: '1960-01-01', sex: 'Male', diabetes_mellitus: 'No', smoking_status: 'Never', height: 170, weight: 70, bmi: 24.2 },
];
function surgery(id, patient_id, extra = {}) {
  return { id, patient_id, surgery_date: '2026-10-01', side: 'Right', surgeon: '蔣恩榮', patte_grade: '2', tangent_sign: 'Negative', revision_surgery: false, acromioplasty: null, biceps_procedure: 'None', tenodesis_location: null, number_of_anchors: 0, medial_row_anchors: 0, lateral_row_anchors: 0, operative_notes: '=SUM(1,2)', ...extra };
}
const surgeries = [
  surgery('s001', 'p1', { acromioplasty: false }),
  surgery('s002', 'p1', { surgeon: '陳昆暉', patte_grade: '3', biceps_procedure: 'Tenodesis', tenodesis_location: 'Subpectoral' }),
  surgery('s003', 'p2', { side: 'Left', patte_grade: 'N/A' }),
];

// The real Supabase client builds the requests; a deterministic PostgREST-shaped
// test transport evaluates fixture rows. This is NOT a live DB/RLS verification.
function fixtureClient(records = surgeries, cap = 1000) {
  const calls = [];
  const client = createClient('https://cohort-fixture.invalid', 'test-publishable-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init = {}) => {
      const url = new URL(String(input));
      calls.push(url);
      const isPatientRoot = url.pathname.endsWith('/patients');
      const predicates = [...url.searchParams.entries()].filter(([key]) => !['select', 'order', 'limit', 'offset'].includes(key));
      function matches(s, p) {
        return predicates.every(([key, expression]) => {
          const dot = expression.indexOf('.');
          const op = expression.slice(0, dot), expected = expression.slice(dot + 1);
          const target = key.startsWith('patient.') ? p : key.startsWith('matching.') ? s : isPatientRoot ? p : s;
          const field = key.split('.').at(-1);
          const actual = target[field];
          if (op === 'is') return actual == null;
          if (actual == null) return false;
          if (op === 'eq') return String(actual) === expected;
          if (op === 'gte') return String(actual) >= expected;
          if (op === 'lte') return String(actual) <= expected;
          if (op === 'gt') return String(actual) > expected;
          if (op === 'ilike') return String(actual).toLowerCase().includes(expected.slice(1, -1).toLowerCase());
          throw new Error(`Unexpected test predicate ${op}`);
        });
      }
      let matching = isPatientRoot
        ? patients.filter(p => records.some(s => s.patient_id === p.id && matches(s, p)))
        : records.flatMap(s => { const p = patients.find(p => p.id === s.patient_id); return p && matches(s, p) ? [{ ...s, patient: p }] : []; });
      const count = matching.length;
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Math.min(cap, Number(url.searchParams.get('limit') || cap));
      matching = matching.slice(offset, offset + limit);
      return new Response(init.method === 'HEAD' ? null : JSON.stringify(matching), { status: 200, headers: { 'content-type': 'application/json', 'content-range': `${offset}-${Math.max(offset, offset + matching.length - 1)}/${count}` } });
    } },
  });
  return { client, calls };
}

test('single filter is executed in the database query', async () => {
  const { client, calls } = fixtureClient();
  const result = await searchCohort(client, request({ side: 'Left' }), asOf);
  assert.equal(result.surgeries, 1); assert.equal(result.patients, 1);
  assert.equal(result.rows[0].id, 's003');
  assert.equal(calls[0].searchParams.get('side'), 'eq.Left');
});

test('surgeon + Patte + date AND filters and distinct patient count', async () => {
  const { client } = fixtureClient();
  const result = await searchCohort(client, request({ surgeon: '蔣恩榮', patte_grade: '2', surgery_date_from: '2026-10-01', surgery_date_to: '2026-10-01', sex: 'Female' }), asOf);
  assert.deepEqual(result.rows.map(r => r.id), ['s001']);
  assert.equal(result.patients, 1);
});

test('different surgeries of one patient cannot satisfy different AND predicates', async () => {
  const { client } = fixtureClient();
  const result = await searchCohort(client, request({ surgeon: '蔣恩榮', patte_grade: '3' }), asOf);
  assert.equal(result.surgeries, 0); assert.equal(result.patients, 0);
});

test('NULL is distinct from false / No, and N/A remains recorded', async () => {
  const { client } = fixtureClient();
  const missing = await searchCohort(client, request({ acromioplasty: '__null', diabetes_mellitus: '__null' }), asOf);
  assert.deepEqual(missing.rows.map(r => r.id), ['s002']);
  const no = await searchCohort(client, request({ acromioplasty: 'false' }), asOf);
  assert.deepEqual(no.rows.map(r => r.id), ['s001']);
  const na = await searchCohort(client, request({ patte_grade: 'N/A' }), asOf);
  assert.deepEqual(na.rows.map(r => r.id), ['s003']);
});

test('empty/cleared filters restore the entire surgery cohort', async () => {
  const { client } = fixtureClient();
  const result = await searchCohort(client, request({ name: '', sex: '' }), asOf);
  assert.equal(result.surgeries, 3); assert.equal(result.patients, 2);
});

test('birthday range and displayed age agree at birthday/leap boundaries', async () => {
  assert.equal(ageAt('1980-10-09', asOf), 45);
  assert.equal(ageAt('1980-10-08', asOf), 46);
  assert.equal(ageAt('2000-02-29', '2025-02-28'), 24);
  assert.equal(ageAt('2000-02-29', '2025-03-01'), 25);
  assert.equal(ageAt(null, asOf), null);
  const { client } = fixtureClient();
  const result = await searchCohort(client, request({ age_min: '45', age_max: '45' }), asOf);
  assert.equal(result.surgeries, 2);
});

test('reject invalid ranges, dates, enums, unknown fields; zero age is valid', () => {
  for (const filters of [{ age_min: '60', age_max: '20' }, { age_min: '-1' }, { surgery_date_from: '2026-02-30' }, { side: 'Both' }, { owner_id: 'x' }, { surgery_date_from: '2026-10-02', surgery_date_to: '2026-10-01' }]) {
    assert.equal(cohortRequestSchema.safeParse({ filters }).success, false);
  }
  assert.equal(cohortRequestSchema.safeParse({ filters: { age_min: '0' } }).success, true);
  assert.equal(cohortRequestSchema.safeParse({ sort: 'operative_notes' }).success, false);
});

test('all select filters produce exact predicates, including explicit missing values', () => {
  for (const def of FILTERS.filter(f => f.kind === 'select')) {
    for (const value of [...def.options, '__null']) {
      const predicates = buildPredicates(request({ [def.key]: value }).filters, asOf);
      const own = predicates.find(p => p.column === def.key);
      assert.equal(own.operator, value === '__null' ? 'is' : 'eq');
    }
  }
});

test('tenodesis location implies Tenodesis and rejects conflicting procedures', () => {
  const predicates = buildPredicates(request({ tenodesis_location: '__null' }).filters, asOf);
  assert.ok(predicates.some(p => p.column === 'biceps_procedure' && p.value === 'Tenodesis'));
  assert.equal(cohortRequestSchema.safeParse({ filters: { biceps_procedure: 'Tenotomy', tenodesis_location: 'Subpectoral' } }).success, false);
});

test('patient-related sorting uses root relation ordering and stable surgery id', async () => {
  const { client, calls } = fixtureClient();
  await surgeryQuery(client, { ...request({}), sort: 'age', direction: 'asc' }, asOf);
  assert.equal(calls[0].searchParams.get('order'), 'patient(birthday).desc.nullslast,id.asc');
  assert.ok(!calls[0].searchParams.has('owner_id'));
});

test('Excel includes only matching rows across all pages and a lower API cap', async () => {
  const many = Array.from({ length: 123 }, (_, i) => surgery(`s${i}`, i < 120 ? 'p1' : 'p2'));
  const { client } = fixtureClient(many, 37);
  const filters = request({ sex: 'Female' });
  const bytes = await createCohortWorkbook(allCohortRows(client, { ...filters, page: 3 }, asOf), asOf);
  assert.equal(String.fromCharCode(bytes[0], bytes[1]), 'PK');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.getWorksheet('Cohort');
  assert.equal(sheet.rowCount, 121);
  assert.equal(sheet.getCell('A2').value, 'Synthetic Alpha');
  assert.equal(sheet.getCell('B2').value, '000123');
  assert.equal(sheet.getCell('D2').value, '1980-10-09');
  assert.equal(sheet.getRow(1).font.bold, true);
  assert.equal(sheet.views[0].ySplit, 1);
  assert.ok(sheet.autoFilter);
  const notes = EXPORT_COLUMNS.findIndex(c => c.header === 'Operative notes') + 1;
  const cell = sheet.getRow(2).getCell(notes);
  assert.equal(cell.value, '=SUM(1,2)');
  assert.equal(cell.type, ExcelJS.ValueType.String);
  const revision = EXPORT_COLUMNS.findIndex(c => c.header === 'Revision surgery') + 1;
  assert.equal(sheet.getRow(2).getCell(revision).value, 'No');
  const acromioplasty = EXPORT_COLUMNS.findIndex(c => c.header === 'Acromioplasty') + 1;
  assert.equal(sheet.getRow(2).getCell(acromioplasty).value, 'Not recorded');
});

test('result pagination defaults to 50 without downloading all matches', async () => {
  const many = Array.from({ length: 120 }, (_, i) => surgery(`s${i}`, 'p1'));
  const { client, calls } = fixtureClient(many);
  const result = await searchCohort(client, { ...request({}), page: 2 }, asOf);
  assert.equal(result.rows.length, 50); assert.equal(result.surgeries, 120); assert.equal(result.patients, 1);
  assert.equal(result.rows[0].id, 's50');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].searchParams.get('offset'), '50');
});

test('empty exports fail clearly rather than producing a misleading file', async () => {
  const { client } = fixtureClient();
  await assert.rejects(createCohortWorkbook(allCohortRows(client, request({ name: 'absent' }), asOf), asOf), /No matching/);
});
