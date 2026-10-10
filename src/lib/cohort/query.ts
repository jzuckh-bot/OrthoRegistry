import type { SupabaseClient } from "@supabase/supabase-js";
import type { Patient, Surgery } from "../database.types";
import { buildPredicates, PAGE_SIZE, type CohortRequest } from "./filters";

export type CohortRow = Surgery & { patient: Patient };
export type CohortResult = { rows: CohortRow[]; patients: number; surgeries: number; page: number; pageSize: number; asOf: string };
const PATIENT_COLUMNS = "id,mrn,name,birthday,sex,height,weight,bmi,diabetes_mellitus,smoking_status,created_at";
const SURGERY_COLUMNS = "id,patient_id,surgery_date,side,surgeon,revision_surgery,diagnosis,patte_grade,tangent_sign,subscapularis_tear,biceps_lesion,red_tear,anterior_cable_tear,acromioplasty,subscapularis_tear_type,subscapularis_treatment,biceps_procedure,tenodesis_location,tear_pattern,footprint_coverage,repair_type,number_of_anchors,medial_row_anchors,lateral_row_anchors,margin_convergence,graft_use,medialization,superior_capsule_reconstruction,tendon_transfer,preop_imaging_source,preop_ultrasound_date,preop_mri_date,operative_notes,created_at";
function applyFilters<T extends { filter(column: string, operator: string, value: unknown): T }>(query: T, request: CohortRequest, asOf: string, root: "patients" | "surgeries") {
  for (const filter of buildPredicates(request.filters, asOf)) {
    const prefix = root === "surgeries" ? (filter.scope === "patient" ? "patient." : "") : (filter.scope === "surgery" ? "matching." : "");
    query = query.filter(`${prefix}${filter.column}`, filter.operator, filter.value);
  }
  return query;
}

export function surgeryQuery(client: SupabaseClient, request: CohortRequest, asOf: string) {
  const query = client.from("surgeries").select(`${SURGERY_COLUMNS},patient:patients!surgeries_patient_id_fkey!inner(${PATIENT_COLUMNS})`, { count: "exact" });
  const patientSort = ["name", "mrn", "age", "sex"].includes(request.sort);
  const column = request.sort === "age" ? "birthday" : request.sort;
  const ascending = request.sort === "age" ? request.direction !== "asc" : request.direction === "asc";
  // Ordering by a to-one relation orders root surgery rows, not the embedded object.
  return applyFilters(query, request, asOf, "surgeries")
    .order(patientSort ? `patient(${column})` : column, { ascending, nullsFirst: false })
    .order("id", { ascending: true });
}

export function patientCountQuery(client: SupabaseClient, request: CohortRequest, asOf: string) {
  // Count root patients, not joined rows. All surgery predicates apply to the
  // same inner-joined surgery, so different surgeries cannot satisfy separate filters.
  return applyFilters(client.from("patients").select("id,matching:surgeries!surgeries_patient_id_fkey!inner(id)", { count: "exact", head: true }), request, asOf, "patients");
}

export async function searchCohort(client: SupabaseClient, request: CohortRequest, asOf: string): Promise<CohortResult> {
  const start = (request.page - 1) * PAGE_SIZE;
  const [surgeries, patients] = await Promise.all([
    surgeryQuery(client, request, asOf).range(start, start + PAGE_SIZE - 1).returns<CohortRow[]>(),
    patientCountQuery(client, request, asOf),
  ]);
  if (surgeries.error || patients.error) throw new Error("Cohort query failed. Confirm the existing surgery migrations and shared-registry policies have been applied.");
  if (surgeries.count === null || patients.count === null) throw new Error("Cohort counts are unavailable. Please try again.");
  return { rows: surgeries.data ?? [], surgeries: surgeries.count, patients: patients.count, page: request.page, pageSize: PAGE_SIZE, asOf };
}

export async function* allCohortRows(client: SupabaseClient, request: CohortRequest, asOf: string): AsyncGenerator<CohortRow> {
  let offset = 0;
  let expected: number | undefined;
  const seen = new Set<string>();
  while (expected === undefined || offset < expected) {
    const result = await surgeryQuery(client, request, asOf).range(offset, offset + 499).returns<CohortRow[]>();
    if (result.error || result.count === null) throw new Error("Export query failed. Please search and export again.");
    if (expected !== undefined && result.count !== expected) throw new Error("The cohort changed during export. Please search and export again.");
    expected = result.count;
    if (expected > 1_048_575) throw new Error("The cohort exceeds Excel's worksheet row limit. Narrow the filters before exporting.");
    if (!result.data?.length) {
      if (offset < expected) throw new Error("Export was incomplete. Please try again.");
      break;
    }
    for (const row of result.data) {
      if (seen.has(row.id)) throw new Error("The cohort changed during export. Please search and export again.");
      seen.add(row.id);
      yield row;
    }
    // Advance by actual rows: Supabase's configured row cap may be below 500.
    offset += result.data.length;
  }
}
