"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FILTERS, NULL_VALUE, ageAt, type CohortRequest, type FilterValues, type SortKey } from "@/lib/cohort/filters";
import type { CohortResult, CohortRow } from "@/lib/cohort/query";

const GROUPS = ["Patient", "Surgery", "Subscapularis & biceps", "Repair", "Preoperative imaging"] as const;
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Patient name" }, { key: "mrn", label: "MRN" }, { key: "age", label: "Age" }, { key: "sex", label: "Sex" },
  { key: "surgery_date", label: "Surgery date" }, { key: "side", label: "Side" }, { key: "surgeon", label: "Surgeon" },
  { key: "revision_surgery", label: "Revision surgery" }, { key: "patte_grade", label: "Patte grade" },
  { key: "tangent_sign", label: "Tangent sign" }, { key: "tear_pattern", label: "Tear pattern" },
  { key: "subscapularis_tear_type", label: "Subscapularis tear type" }, { key: "subscapularis_treatment", label: "Subscapularis treatment" },
  { key: "biceps_procedure", label: "Biceps procedure" }, { key: "footprint_coverage", label: "Footprint coverage" },
];
const initialRequest: CohortRequest = { filters: {}, page: 1, sort: "surgery_date", direction: "desc" };
function display(row: CohortRow, key: SortKey, asOf: string) {
  const value = key === "age" ? ageAt(row.patient.birthday, asOf) : key === "name" || key === "mrn" || key === "sex" ? row.patient[key] : row[key];
  return value === null || value === undefined || value === "" ? "Not recorded" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
}
async function checkResponse(response: Response) {
  if (response.redirected || response.status === 401) throw new Error("Your session has expired. Please sign in again.");
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Request failed. Please try again.");
  }
}

export function CohortSearch() {
  const [draft, setDraft] = useState<FilterValues>({});
  const [applied, setApplied] = useState<CohortRequest>(initialRequest);
  const [result, setResult] = useState<CohortResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied.filters);
  const busy = loading || exporting;

  async function search(next: CohortRequest) {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true); setError(""); setNotice(""); setResult(null);
    try {
      const response = await fetch("/api/cohort/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next), cache: "no-store", signal: controller.signal });
      await checkResponse(response);
      const found: CohortResult = await response.json();
      if (!controller.signal.aborted) { setResult(found); setApplied({ ...next, asOf: found.asOf }); }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Search failed.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void search({ ...initialRequest, filters: draft });
  }
  function clear() {
    setDraft({});
    void search({ ...initialRequest, filters: {} });
  }
  function sort(key: SortKey) {
    void search({ ...applied, page: 1, sort: key, direction: applied.sort === key && applied.direction === "asc" ? "desc" : "asc" });
  }
  async function exportExcel() {
    if (!result?.surgeries || dirty || busy) return;
    setExporting(true); setError(""); setNotice("");
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      // Export the submitted filters, never the unsubmitted draft or visible page.
      const response = await fetch("/api/cohort/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...applied, page: 1 }), cache: "no-store", signal: controller.signal });
      await checkResponse(response);
      if (!response.headers.get("Content-Type")?.includes("spreadsheetml")) throw new Error("The server did not return an Excel file. Please sign in and try again.");
      const blob = await response.blob();
      const filename = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "OrthoRegistry_Cohort.xlsx";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setNotice("Excel downloaded: all matching surgeries, across all pages.");
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Export failed.");
    } finally { if (!controller.signal.aborted) setExporting(false); }
  }

  return (
    <section className="surface mt-6 min-w-0 p-5 sm:p-7" aria-labelledby="cohort-title">
      <div className="flex items-center gap-3"><SlidersHorizontal className="size-5 text-primary" /><h2 id="cohort-title" className="text-xl font-bold">Cohort Search</h2></div>
      <p className="mt-2 text-sm text-muted">Search the shared registry. All selected conditions must match the same surgery. One result per surgery; patients without surgery records are not included.</p>
      <form onSubmit={submit} className="mt-5">
        <div className="space-y-3">
          {GROUPS.map(group => (
            <details key={group} className="rounded-2xl border bg-card">
              <summary className="min-h-12 cursor-pointer px-4 py-3 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                {group}<span className="ml-2 text-xs font-normal text-muted">{FILTERS.filter(f => f.group === group && draft[f.key]).length || "No"} filters</span>
              </summary>
              <div className="grid gap-4 border-t p-4 sm:grid-cols-2 xl:grid-cols-3">
                {FILTERS.filter(f => f.group === group).map(def => (
                  <label key={def.key} className="block text-sm font-medium">
                    {def.label}
                    {def.kind === "select" ? (
                      <select className="field mt-2 min-h-12 text-base" value={draft[def.key] ?? ""} disabled={busy || (def.key === "tenodesis_location" && Boolean(draft.biceps_procedure) && draft.biceps_procedure !== "Tenodesis")}
                        onChange={event => setDraft(current => {
                          const next = { ...current, [def.key]: event.target.value };
                          if (def.key === "biceps_procedure" && event.target.value && event.target.value !== "Tenodesis") delete next.tenodesis_location;
                          return next;
                        })}>
                        <option value="">Any</option>
                        {def.options?.map(value => <option key={value} value={value}>{value === "true" ? "Yes" : value === "false" ? "No" : value}</option>)}
                        <option value={NULL_VALUE}>{def.key === "diabetes_mellitus" || def.key === "smoking_status" ? "Unknown / Not recorded" : "Not recorded"}</option>
                      </select>
                    ) : (
                      <input className="field mt-2 min-h-12 text-base" type={def.kind === "age" ? "number" : def.kind === "date" ? "date" : "text"}
                        min={def.kind === "age" ? 0 : undefined} max={def.kind === "age" ? 150 : undefined} step={def.kind === "age" ? 1 : undefined}
                        maxLength={def.kind === "text" ? 200 : undefined} placeholder={def.kind === "text" ? "Contains…" : "Any"}
                        value={draft[def.key] ?? ""} disabled={busy} onChange={event => setDraft(current => ({ ...current, [def.key]: event.target.value }))} />
                    )}
                  </label>
                ))}
              </div>
            </details>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Age is calculated on the search date in Asia/Taipei. “Not recorded” means NULL, never No or None. Selecting a tenodesis location also requires a Tenodesis procedure.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="submit" className="h-12" disabled={busy}><Search className="size-4" />{loading ? "Searching…" : "Search"}</Button>
          <Button type="button" variant="secondary" className="h-12" disabled={busy} onClick={clear}>Clear filters</Button>
          <Button type="button" variant="secondary" className="h-12" disabled={busy || dirty || !result?.surgeries} onClick={() => void exportExcel()}><Download className="size-4" />{exporting ? "Exporting all matches…" : "Export Excel"}</Button>
        </div>
      </form>
      {dirty && result && <p className="mt-3 text-sm text-muted">Filters have changed. Press Search to update results and enable export.</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="mt-4 text-sm text-primary">{notice}</p>}
      <div aria-live="polite" aria-busy={busy} className="mt-5">
        {loading ? <p className="text-sm text-muted">Searching matching patients and surgeries…</p> : result ? (
          <>
            <p className="font-semibold">{result.patients} patients / {result.surgeries} surgeries found</p>
            <p className="mt-1 text-xs text-muted">Age reference date: {result.asOf}. Export includes all matching pages using these filters and the data available when exported.</p>
            {result.surgeries === 0 ? <p className="py-8 text-center text-muted">No records match these filters.</p> : (
              <>
                <div className="mt-4 overflow-x-auto rounded-xl border" tabIndex={0} role="region" aria-label="Cohort results; scroll horizontally for all columns">
                  <table className="w-full min-w-[1800px] text-left text-sm">
                    <caption className="sr-only">Matching surgery records, sortable by each column</caption>
                    <thead className="bg-foreground/5"><tr>{COLUMNS.map(column => (
                      <th key={column.key} scope="col" className="p-3" aria-sort={applied.sort === column.key ? (applied.direction === "asc" ? "ascending" : "descending") : "none"}>
                        <button type="button" className="min-h-11 text-left font-semibold hover:text-primary" disabled={busy || dirty} onClick={() => sort(column.key)}>{column.label}{applied.sort === column.key ? (applied.direction === "asc" ? " ↑" : " ↓") : " ↕"}</button>
                      </th>
                    ))}</tr></thead>
                    <tbody className="divide-y">{result.rows.map(row => (
                      <tr key={row.id} className="align-top hover:bg-foreground/[.03]">{COLUMNS.map(column => (
                        <td key={column.key} className="p-3">
                          {column.key === "name" ? <Link className="font-semibold text-primary underline-offset-4 hover:underline" href={`/patients/${row.patient_id}`}>{display(row, column.key, result.asOf)}</Link>
                            : column.key === "surgery_date" ? <Link className="text-primary underline-offset-4 hover:underline" href={`/patients/${row.patient_id}/surgeries/${row.id}`}>{display(row, column.key, result.asOf)}</Link>
                            : display(row, column.key, result.asOf)}
                        </td>
                      ))}</tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">Page {result.page} of {Math.max(1, Math.ceil(result.surgeries / result.pageSize))} · {result.pageSize} per page</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" className="h-11" disabled={busy || dirty || result.page <= 1} onClick={() => void search({ ...applied, page: result.page - 1 })}>Previous</Button>
                    <Button type="button" variant="secondary" className="h-11" disabled={busy || dirty || result.page * result.pageSize >= result.surgeries} onClick={() => void search({ ...applied, page: result.page + 1 })}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : <p className="text-sm text-muted">Choose filters and press Search, or search without filters for all surgery records.</p>}
      </div>
    </section>
  );
}
