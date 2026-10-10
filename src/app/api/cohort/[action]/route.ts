import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cohortRequestSchema, todayInTaipei } from "@/lib/cohort/filters";
import { allCohortRows, searchCohort } from "@/lib/cohort/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (action !== "search" && action !== "export") return NextResponse.json({ error: "Not found" }, { status: 404, headers });
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid search request." }, { status: 400, headers }); }
  const parsed = cohortRequestSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map(issue => issue.message).join(". ") }, { status: 400, headers });
  const asOf = parsed.data.asOf ?? todayInTaipei();
  try {
    if (action === "search") return NextResponse.json(await searchCohort(supabase, parsed.data, asOf), { headers });
    const { createCohortWorkbook } = await import("@/lib/cohort/excel");
    const bytes = await createCohortWorkbook(allCohortRows(supabase, parsed.data, asOf), asOf);
    return new Response(bytes, { headers: {
      ...headers,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="OrthoRegistry_Cohort_${todayInTaipei()}.xlsx"`,
    } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cohort request failed. Please try again." }, { status: 500, headers });
  }
}
