import { z } from "zod";

export const NULL_VALUE = "__null";
export const PAGE_SIZE = 50;
type Scope = "patient" | "surgery";
type Group = "Patient" | "Surgery" | "Subscapularis & biceps" | "Repair" | "Preoperative imaging";
export type FilterDefinition = {
  key: string; label: string; scope: Scope; group: Group;
  kind: "text" | "age" | "date" | "select";
  column?: string; bound?: "min" | "max";
  options?: readonly string[];
};
const yesNo = ["true", "false"] as const;

export const FILTERS: readonly FilterDefinition[] = [
  { key: "name", label: "Patient name", scope: "patient", group: "Patient", kind: "text" },
  { key: "mrn", label: "MRN", scope: "patient", group: "Patient", kind: "text" },
  { key: "sex", label: "Sex", scope: "patient", group: "Patient", kind: "select", options: ["Male", "Female", "Other"] },
  { key: "age_min", label: "Minimum age", scope: "patient", group: "Patient", kind: "age", bound: "min" },
  { key: "age_max", label: "Maximum age", scope: "patient", group: "Patient", kind: "age", bound: "max" },
  { key: "diabetes_mellitus", label: "Diabetes mellitus", scope: "patient", group: "Patient", kind: "select", options: ["Yes", "No"] },
  { key: "smoking_status", label: "Smoking", scope: "patient", group: "Patient", kind: "select", options: ["Never", "Former", "Current"] },
  { key: "surgery_date_from", label: "Surgery date from", scope: "surgery", group: "Surgery", kind: "date", column: "surgery_date", bound: "min" },
  { key: "surgery_date_to", label: "Surgery date to", scope: "surgery", group: "Surgery", kind: "date", column: "surgery_date", bound: "max" },
  { key: "side", label: "Side", scope: "surgery", group: "Surgery", kind: "select", options: ["Right", "Left"] },
  { key: "surgeon", label: "Surgeon", scope: "surgery", group: "Surgery", kind: "select", options: ["蔣恩榮", "陳昆暉", "馬瑄孝"] },
  { key: "revision_surgery", label: "Revision surgery", scope: "surgery", group: "Surgery", kind: "select", options: yesNo },
  { key: "patte_grade", label: "Patte grade", scope: "surgery", group: "Surgery", kind: "select", options: ["1", "2", "3", "N/A"] },
  { key: "tangent_sign", label: "Tangent sign", scope: "surgery", group: "Surgery", kind: "select", options: ["Positive", "Negative", "N/A"] },
  { key: "red_tear", label: "Red tear", scope: "surgery", group: "Surgery", kind: "select", options: yesNo },
  { key: "anterior_cable_tear", label: "Anterior cable tear", scope: "surgery", group: "Surgery", kind: "select", options: yesNo },
  { key: "acromioplasty", label: "Acromioplasty", scope: "surgery", group: "Surgery", kind: "select", options: yesNo },
  { key: "subscapularis_tear_type", label: "Subscapularis tear type", scope: "surgery", group: "Subscapularis & biceps", kind: "select", options: ["None", "Partial", "Full thickness with retraction (comma sign +)"] },
  { key: "subscapularis_treatment", label: "Subscapularis treatment", scope: "surgery", group: "Subscapularis & biceps", kind: "select", options: ["None", "Debridement", "Repair"] },
  { key: "biceps_procedure", label: "Biceps procedure", scope: "surgery", group: "Subscapularis & biceps", kind: "select", options: ["None", "Tenotomy", "Tenodesis", "Transposition"] },
  { key: "tenodesis_location", label: "Tenodesis location", scope: "surgery", group: "Subscapularis & biceps", kind: "select", options: ["Subpectoral", "Suprapectoral"] },
  { key: "tear_pattern", label: "Tear pattern", scope: "surgery", group: "Repair", kind: "select", options: ["U shape", "L shape"] },
  { key: "footprint_coverage", label: "Footprint coverage", scope: "surgery", group: "Repair", kind: "select", options: ["Direct repair", "Incomplete footprint coverage", "Partial repair"] },
  { key: "repair_type", label: "Repair type", scope: "surgery", group: "Repair", kind: "select", options: ["Single row", "Double row", "Partial repair"] },
  { key: "margin_convergence", label: "Margin convergence", scope: "surgery", group: "Repair", kind: "select", options: yesNo },
  { key: "graft_use", label: "Graft use", scope: "surgery", group: "Repair", kind: "select", options: yesNo },
  { key: "medialization", label: "Medialization", scope: "surgery", group: "Repair", kind: "select", options: yesNo },
  { key: "superior_capsule_reconstruction", label: "Superior capsule reconstruction", scope: "surgery", group: "Repair", kind: "select", options: yesNo },
  { key: "tendon_transfer", label: "Tendon transfer", scope: "surgery", group: "Repair", kind: "select", options: ["None", "LTT", "LD"] },
  { key: "preop_imaging_source", label: "Imaging source", scope: "surgery", group: "Preoperative imaging", kind: "select", options: ["Ultrasound", "MRI", "Cloud imaging"] },
  { key: "preop_ultrasound_date_from", label: "Ultrasound date from", scope: "surgery", group: "Preoperative imaging", kind: "date", column: "preop_ultrasound_date", bound: "min" },
  { key: "preop_ultrasound_date_to", label: "Ultrasound date to", scope: "surgery", group: "Preoperative imaging", kind: "date", column: "preop_ultrasound_date", bound: "max" },
  { key: "preop_mri_date_from", label: "MRI date from", scope: "surgery", group: "Preoperative imaging", kind: "date", column: "preop_mri_date", bound: "min" },
  { key: "preop_mri_date_to", label: "MRI date to", scope: "surgery", group: "Preoperative imaging", kind: "date", column: "preop_mri_date", bound: "max" },
];

export const SORT_KEYS = ["name", "mrn", "age", "sex", "surgery_date", "side", "surgeon", "revision_surgery", "patte_grade", "tangent_sign", "tear_pattern", "subscapularis_tear_type", "subscapularis_treatment", "biceps_procedure", "footprint_coverage"] as const;
export type SortKey = typeof SORT_KEYS[number];
export type FilterValues = Record<string, string>;

export function todayInTaipei() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function ageAt(birthday: string | null | undefined, asOf: string): number | null {
  if (!birthday || !isDate(birthday) || birthday > asOf) return null;
  return Number(asOf.slice(0, 4)) - Number(birthday.slice(0, 4)) - (asOf.slice(5) < birthday.slice(5) ? 1 : 0);
}
export function yearsBefore(asOf: string, years: number) {
  const [y, m, d] = asOf.split("-").map(Number);
  const year = y - years;
  const day = Math.min(d, new Date(Date.UTC(year, m, 0)).getUTCDate());
  return `${String(year).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const filterSchema = z.record(z.string().max(200)).superRefine((values, ctx) => {
  for (const [key, raw] of Object.entries(values)) {
    const def = FILTERS.find(f => f.key === key);
    const value = raw.trim();
    const invalid = !def || (value && (
      (def.kind === "select" && value !== NULL_VALUE && !def.options?.includes(value)) ||
      (def.kind === "age" && (!/^\d+$/.test(value) || Number(value) > 150)) ||
      (def.kind === "date" && !isDate(value))
    ));
    if (invalid) ctx.addIssue({ code: "custom", path: [key], message: `Invalid ${def?.label ?? "filter"}` });
  }
  for (const [from, to] of [["age_min", "age_max"], ["surgery_date_from", "surgery_date_to"], ["preop_ultrasound_date_from", "preop_ultrasound_date_to"], ["preop_mri_date_from", "preop_mri_date_to"]]) {
    const a = values[from]?.trim(), b = values[to]?.trim();
    if (a && b && (from === "age_min" ? Number(a) > Number(b) : a > b)) ctx.addIssue({ code: "custom", path: [to], message: "Minimum/from must not exceed maximum/to" });
  }
  if (values.tenodesis_location && values.biceps_procedure && values.biceps_procedure !== "Tenodesis") {
    ctx.addIssue({ code: "custom", path: ["tenodesis_location"], message: "Tenodesis location requires Tenodesis (or Any procedure)" });
  }
}).transform(values => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== "")));

export const cohortRequestSchema = z.object({
  filters: filterSchema.default({}),
  page: z.number().int().min(1).max(1_000_000).default(1),
  sort: z.enum(SORT_KEYS).default("surgery_date"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  asOf: z.string().refine(isDate, "Invalid age reference date").optional(),
}).strict();
export type CohortRequest = z.infer<typeof cohortRequestSchema>;

export type Predicate = { scope: Scope; column: string; operator: "eq" | "ilike" | "is" | "lte" | "gte" | "gt"; value: string | number | boolean | null };
export function buildPredicates(filters: FilterValues, asOf: string): Predicate[] {
  const predicates: Predicate[] = [];
  for (const def of FILTERS) {
    const value = filters[def.key];
    if (!value) continue;
    const base = { scope: def.scope, column: def.column ?? def.key };
    if (def.kind === "age") {
      predicates.push({ scope: "patient", column: "birthday", operator: def.bound === "min" ? "lte" : "gt", value: yearsBefore(asOf, Number(value) + (def.bound === "max" ? 1 : 0)) });
    } else if (def.kind === "date") {
      predicates.push({ ...base, operator: def.bound === "min" ? "gte" : "lte", value });
    } else if (def.kind === "text") {
      predicates.push({ ...base, operator: "ilike", value: `%${value.replace(/[\\%_*]/g, "\\$&")}%` });
    } else {
      predicates.push({ ...base, operator: value === NULL_VALUE ? "is" : "eq", value: value === NULL_VALUE ? null : value === "true" ? true : value === "false" ? false : value });
    }
  }
  if (filters.age_min || filters.age_max) predicates.push({ scope: "patient", column: "birthday", operator: "lte", value: asOf });
  if (filters.tenodesis_location && !filters.biceps_procedure) predicates.push({ scope: "surgery", column: "biceps_procedure", operator: "eq", value: "Tenodesis" });
  return predicates;
}
