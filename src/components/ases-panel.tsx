"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { asesSchema, calculateAses, FUNCTION_ITEMS, FUNCTION_LABELS, TIMEPOINTS, COMPLETED_BY, type AsesAssessment, type AsesInput } from "@/lib/ases/model";
import type { Surgery } from "@/lib/database.types";

type SurgeryOption = Pick<Surgery,"id"|"surgery_date"|"side"|"surgeon">;
type Draft = Partial<AsesInput>;
const scoreText = (value:number|undefined)=>value === undefined ? "尚未完成" : value.toFixed(2);
async function responseData(response:Response) {
  if(response.redirected || response.status === 401) throw new Error("登入已逾時，請重新登入。");
  if(!response.ok) { const body=await response.json().catch(()=>null); throw new Error(body?.error ?? "操作失敗，請重試。"); }
}
export function AsesPanel({patientId,surgeries,today}:{patientId:string;surgeries:SurgeryOption[];today:string}) {
  const [records,setRecords] = useState<AsesAssessment[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [available,setAvailable] = useState(false);
  const [refresh,setRefresh] = useState(0);
  const [draft,setDraft] = useState<Draft|null>(null);
  const [editingId,setEditingId] = useState<string|null>(null);
  const [viewing,setViewing] = useState<AsesAssessment|null>(null);
  const endpoint = `/api/ases/${patientId}`;
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);
    void (async()=>{
      try {
        const response=await fetch(endpoint,{cache:"no-store",signal:controller.signal});
        await responseData(response);
        const rows:AsesAssessment[]=await response.json();
        if(!controller.signal.aborted) {setRecords(rows);setAvailable(true);}
      } catch(e) {if(!controller.signal.aborted) {setError(e instanceof Error ? e.message : "無法讀取 ASES");setAvailable(false);}}
      finally {if(!controller.signal.aborted) setLoading(false);}
    })();
    return ()=>controller.abort();
  },[endpoint,refresh]);
  function start(record?:AsesAssessment) {
    setError("");setNotice("");setViewing(null);setEditingId(record?.id ?? null);
    setDraft(record ? {patient_id:patientId,surgery_id:record.surgery_id,assessment_date:record.assessment_date,timepoint:record.timepoint,custom_timepoint:record.custom_timepoint,completed_by:record.completed_by,pain_score:record.pain_score,...Object.fromEntries(FUNCTION_ITEMS.map(([key])=>[key,record[key]]))} : {patient_id:patientId,surgery_id:null,assessment_date:today,timepoint:null,custom_timepoint:null,completed_by:null});
  }
  const scores=calculateAses(draft);
  const missing=draft ? [["pain_score","目前您的患側肩膀疼痛程度為何？"],...FUNCTION_ITEMS].filter(([key])=>draft[key as keyof Draft] == null).map(([,label])=>label) : [];
  async function save(event:React.FormEvent) {
    event.preventDefault();
    const parsed=asesSchema.safeParse(draft);
    if(!parsed.success) {setError(parsed.error.issues.map(i=>i.message).join("；"));return;}
    setBusy(true);setError("");
    try {
      await responseData(await fetch(endpoint,{method:editingId ? "PATCH" : "POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...(editingId ? {id:editingId}:{}),assessment:parsed.data})}));
      setDraft(null);setEditingId(null);setNotice("ASES 已儲存。");setRefresh(n=>n+1);
    } catch(e) {setError(e instanceof Error ? e.message : "儲存失敗");} finally {setBusy(false);}
  }
  async function remove(record:AsesAssessment) {
    if(!window.confirm(`確定永久刪除 ${record.assessment_date} 的這一筆 ASES 評估？此操作無法復原。病患與手術不會被刪除。`)) return;
    setBusy(true);setError("");setNotice("");
    try {
      await responseData(await fetch(endpoint,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:record.id})}));
      setViewing(null);setNotice("這筆 ASES 已刪除，病患與手術資料未變更。");setRefresh(n=>n+1);
    } catch(e) {setError(e instanceof Error ? e.message : "刪除失敗");} finally {setBusy(false);}
  }
  async function exportExcel() {
    setBusy(true);setError("");
    try {
      const response=await fetch(`${endpoint}?export=1`,{cache:"no-store"});await responseData(response);
      if(!response.headers.get("Content-Type")?.includes("spreadsheetml")) throw new Error("伺服器未回傳 Excel 檔案。");
      const url=URL.createObjectURL(await response.blob());const link=document.createElement("a");
      link.href=url;link.download=response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "OrthoRegistry_ASES.xlsx";
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
      setNotice("已匯出此病患全部 ASES 紀錄。");
    } catch(e) {setError(e instanceof Error ? e.message : "匯出失敗");} finally {setBusy(false);}
  }
  const surgeryLabel=(id:string|null)=>surgeries.find(s=>s.id===id);
  return <section className="surface mt-6 p-5" aria-labelledby="function-scores-title">
    <h2 id="function-scores-title" className="text-xl font-bold">Function Scores</h2>
    <div className="mt-3 flex flex-wrap items-center gap-3"><h3 className="mr-auto font-semibold">ASES</h3><Button disabled={busy||loading||!available} onClick={()=>start()}>Add ASES</Button><Button variant="secondary" disabled={busy||loading||!available||!records.length} onClick={()=>void exportExcel()}>Export ASES Excel</Button></div>
    <p className="mt-2 text-sm text-muted">此病患的全部評估，依評估日期由新至舊排列。分數越高代表肩部狀況越好。</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-4 text-red-600">{error}</p>}
    {notice && <p role="status" className="mt-4 text-primary">{notice}</p>}
    {loading ? <p className="p-4">載入中…</p> : available && !records.length ? <p className="p-4 text-muted">尚無 ASES 評估。</p> : null}
    {!loading && records.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><caption className="sr-only">ASES longitudinal history</caption><thead><tr>{["Assessment date","Timepoint","Related surgery","Completed by","Pain score","Pain component","Function component","ASES total score","Actions"].map(h=><th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead><tbody>{records.map(r=>{const surgery=surgeryLabel(r.surgery_id);return <tr key={r.id} className="border-t"><td className="p-2">{r.assessment_date}</td><td className="p-2">{r.timepoint === "Other" ? r.custom_timepoint : r.timepoint ?? "未記錄"}</td><td className="p-2">{surgery ? `${surgery.surgery_date} · ${surgery.side}` : r.surgery_id ?? "未連結"}</td><td className="p-2">{r.completed_by ?? "未記錄"}</td><td className="p-2">{r.pain_score}</td><td className="p-2">{Number(r.ases_pain_component).toFixed(2)}</td><td className="p-2">{Number(r.ases_function_component).toFixed(2)}</td><td className="p-2 font-bold">{Number(r.ases_total_score).toFixed(2)}</td><td className="flex gap-2 p-2"><Button variant="secondary" disabled={busy||!!draft} onClick={()=>setViewing(r)}>View</Button><Button variant="secondary" disabled={busy||!!draft} onClick={()=>start(r)}>Edit</Button><Button variant="danger" disabled={busy||!!draft} onClick={()=>void remove(r)}>Delete</Button></td></tr>;})}</tbody></table></div>}
    {viewing && !draft && <div className="mt-6 space-y-3 rounded-xl border p-4" lang="zh-Hant"><h3 className="font-bold">ASES 肩部功能評估 · {viewing.assessment_date}</h3><p>目前您的患側肩膀疼痛程度為何？ {viewing.pain_score} / 10</p>{FUNCTION_ITEMS.map(([key,label])=><p key={key} className="whitespace-pre-line">{label}：{viewing[key]} {FUNCTION_LABELS[viewing[key]]}</p>)}<Button variant="secondary" onClick={()=>setViewing(null)}>關閉</Button></div>}
    {draft && <form onSubmit={save} className="mt-6 space-y-6 border-t pt-6" lang="zh-Hant">
      <h3 className="text-2xl font-bold">ASES 肩部功能評估</h3>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <label>評估日期<input required className="field mt-2" type="date" value={draft.assessment_date ?? ""} onChange={e=>setDraft({...draft,assessment_date:e.target.value})}/></label>
        <label>相關手術（選填）<select className="field mt-2" value={draft.surgery_id ?? ""} onChange={e=>setDraft({...draft,surgery_id:e.target.value||null})}><option value="">未連結</option>{surgeries.map(s=><option key={s.id} value={s.id}>{s.surgery_date} · {s.side} · {s.surgeon}</option>)}</select></label>
        <label>評估時點（選填）<select className="field mt-2" value={draft.timepoint ?? ""} onChange={e=>setDraft({...draft,timepoint:(e.target.value||null) as AsesInput["timepoint"],custom_timepoint:null})}><option value="">未記錄</option>{TIMEPOINTS.map(t=><option key={t}>{t}</option>)}</select></label>
        {draft.timepoint === "Other" && <label>其他評估時點<input required maxLength={200} className="field mt-2" value={draft.custom_timepoint ?? ""} onChange={e=>setDraft({...draft,custom_timepoint:e.target.value})}/></label>}
        <label>填寫者（選填）<select className="field mt-2" value={draft.completed_by ?? ""} onChange={e=>setDraft({...draft,completed_by:(e.target.value||null) as AsesInput["completed_by"]})}><option value="">未記錄</option>{COMPLETED_BY.map(t=><option key={t}>{t}</option>)}</select></label>
      </fieldset>
      <h4 className="font-bold">A. 疼痛</h4><fieldset disabled={busy}><legend className="mb-3 font-semibold">目前您的患側肩膀疼痛程度為何？</legend><p className="mb-3 text-sm">0 = 完全不痛<br/>10 = 最嚴重的疼痛</p><div className="grid grid-cols-4 gap-2 sm:grid-cols-6">{Array.from({length:11},(_,n)=><button type="button" key={n} aria-pressed={draft.pain_score === n} className={`min-h-12 rounded-xl border p-3 ${draft.pain_score===n ? "border-primary bg-primary text-white":"bg-card"}`} onClick={()=>setDraft({...draft,pain_score:n})}>{n}</button>)}</div></fieldset>
      <h4 className="font-bold">B. 功能</h4>{FUNCTION_ITEMS.map(([key,label],i)=><fieldset key={key} disabled={busy}><legend className="mb-3 whitespace-pre-line font-semibold">{i+1}. {label}</legend><div className="grid grid-cols-2 gap-2">{FUNCTION_LABELS.map((meaning,n)=><button key={n} type="button" aria-pressed={draft[key]===n} className={`min-h-14 rounded-xl border p-3 text-left ${draft[key]===n ? "border-primary bg-primary text-white":"bg-card"}`} onClick={()=>setDraft({...draft,[key]:n})}>{n} {meaning}</button>)}</div></fieldset>)}
      <div aria-live="polite" className="rounded-xl bg-primary/10 p-4"><p>疼痛分數: {scoreText(scores?.ases_pain_component)} / 50</p><p>功能分數: {scoreText(scores?.ases_function_component)} / 50</p><p className="text-xl font-bold">ASES 總分: {scoreText(scores?.ases_total_score)} / 100</p>{missing.length>0 && <div className="mt-3 text-sm"><p>尚未完成：</p><ul className="list-inside list-disc">{missing.map(label=><li key={label}>{label}</li>)}</ul></div>}</div>
      <div className="flex gap-3"><Button type="submit" disabled={busy||!scores}>{busy ? "儲存中…":"儲存 ASES"}</Button><Button type="button" variant="secondary" disabled={busy} onClick={()=>setDraft(null)}>取消</Button></div>
    </form>}
  </section>;
}
