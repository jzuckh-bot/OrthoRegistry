import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { asesSchema, calculateAses } from "@/lib/ases/model";
import type { AsesExportRow } from "@/lib/ases/excel";
import { todayInTaipei } from "@/lib/cohort/filters";
import { isSameOrigin } from "@/lib/ases/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = {"Cache-Control":"private, no-store",Vary:"Cookie","X-Content-Type-Options":"nosniff"};
type Context = { params: Promise<{patientId:string}> };
const fail = (error:string,status=400)=>NextResponse.json({error},{status,headers});
async function handle(request:Request, context:Context) {
  const {patientId} = await context.params;
  if (!z.string().uuid().safeParse(patientId).success) return fail("無效病患 ID");
  if (request.method !== "GET" && !isSameOrigin(request)) return fail("Invalid origin",403);
  const client = await createClient();
  const {data:{user},error:authError} = await client.auth.getUser();
  if(authError || !user) return fail("請重新登入",401);
  const {data:patient,error:patientError} = await client.from("patients").select("id").eq("id",patientId).maybeSingle();
  if(patientError) return fail("無法讀取病患",500);
  if(!patient) return fail("找不到病患",404);
  if(request.method === "GET") {
    const rows: AsesExportRow[] = [];
    let expected:number|undefined;
    while(expected === undefined || rows.length < expected) {
      const {data,error,count} = await client.from("ases_assessments").select("*,patient:patients!patient_id(*),surgery:surgeries!ases_surgery_patient_fk(*)",{count:"exact"}).eq("patient_id",patientId).order("assessment_date",{ascending:false}).order("id").range(rows.length,rows.length+499).returns<AsesExportRow[]>();
      if(error || count === null) return fail("ASES 尚未可用，請確認已套用 ASES migration。",503);
      if(expected !== undefined && count !== expected) return fail("紀錄已變更，請重試。",409);
      expected=count;
      if(!data?.length) { if(rows.length < expected) return fail("讀取不完整，請重試。",500); break; }
      if(data.some(r=>rows.some(old=>old.id===r.id))) return fail("紀錄已變更，請重試。",409);
      rows.push(...data);
    }
    if(new URL(request.url).searchParams.get("export") === "1") {
      if(!rows.length) return fail("沒有可匯出的 ASES 紀錄。");
      try {
        const {asesWorkbook} = await import("@/lib/ases/excel");
        return new Response(await asesWorkbook(rows),{headers:{...headers,"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="OrthoRegistry_ASES_${todayInTaipei()}.xlsx"`}});
      } catch { return fail("匯出失敗，請檢查原始答案及分數後重試。",500); }
    }
    return NextResponse.json(rows,{headers});
  }
  let body: unknown;
  try {body=await request.json();} catch {return fail("無效資料");}
  const envelope = z.object({id:z.string().uuid().optional(),assessment:z.unknown().optional()}).strict().safeParse(body);
  if(!envelope.success) return fail("無效資料");
  const {id,assessment} = envelope.data;
  if(request.method !== "POST" && !id) return fail("缺少評估 ID");
  if(request.method === "DELETE") {
    const {data,error} = await client.from("ases_assessments").delete().eq("patient_id",patientId).eq("id",id!).select("id");
    if(error) return fail("刪除失敗，請重試。",500);
    if(!data?.length) return fail("找不到評估紀錄",404);
    return NextResponse.json({success:true},{headers});
  }
  const parsed = asesSchema.safeParse(assessment);
  if(!parsed.success) return fail("請填寫有效日期、疼痛 0–10，以及全部十題功能分數 0–3。");
  if(parsed.data.patient_id !== patientId) return fail("病患不符");
  if(!calculateAses(parsed.data)) return fail("原始答案不完整");
  if(parsed.data.surgery_id) {
    const {data:surgery,error} = await client.from("surgeries").select("id").eq("id",parsed.data.surgery_id).eq("patient_id",patientId).maybeSingle();
    if(error || !surgery) return fail("相關手術必須屬於同一病患。");
  }
  // Only validated raw inputs are writable. PostgreSQL generated columns persist
  // recomputed scores even for direct Supabase API calls (not just this endpoint).
  const query = request.method === "POST" ? client.from("ases_assessments").insert(parsed.data) : client.from("ases_assessments").update(parsed.data).eq("id",id!).eq("patient_id",patientId);
  const {data,error} = await query.select("id").maybeSingle();
  if(error) return fail("儲存失敗，請確認 migration 與資料完整性。",500);
  if(!data) return fail("找不到評估紀錄",404);
  return NextResponse.json(data,{headers});
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
