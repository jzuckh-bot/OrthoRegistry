import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronRight, Pencil, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DeletePatientButton } from "@/components/delete-patient-button";
import { formatDate } from "@/lib/utils";
import type { Patient, Surgery } from "@/lib/database.types";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: patient }, { data: surgeries, error: surgeryError }] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).returns<Patient[]>().single(),
    supabase.from("surgeries").select("*").eq("patient_id", id).order("surgery_date", { ascending: false }).returns<Surgery[]>(),
  ]);
  if (!patient) notFound();
  const details = [["MRN", patient.mrn], ["Birthday", formatDate(patient.birthday)], ["Sex", patient.sex], ["Height", `${patient.height} cm`], ["Weight", `${patient.weight} kg`], ["BMI", patient.bmi], ["Created", formatDate(patient.created_at)]];
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/patients" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" />Back to patients</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">PATIENT RECORD</p><h1 className="mt-1 text-3xl font-bold">{patient.name}</h1></div><div className="flex gap-2"><Link href={`/patients/${id}/edit`}><Button variant="secondary"><Pencil className="size-4" />Edit</Button></Link><DeletePatientButton id={id} /></div></div>
      <section className="surface mt-8 grid gap-px overflow-hidden bg-border sm:grid-cols-2">
        {details.map(([label, value]) => <div key={label} className="bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-2 font-medium">{value}</p></div>)}
      </section>
      <section className="surface mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b p-5">
          <div><h2 className="font-semibold">Rotator cuff surgeries</h2><p className="mt-1 text-sm text-muted">{surgeries?.length ?? 0} records</p></div>
          <Link href={`/patients/${id}/surgeries/new`}><Button><Plus className="size-4" /><span className="hidden sm:inline">New surgery</span></Button></Link>
        </div>
        {surgeryError && <p className="m-5 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">Surgery records are unavailable. Apply the Phase 2 database migration, then refresh.</p>}
        <div className="divide-y">
          {surgeries?.map(surgery => (
            <Link key={surgery.id} href={`/patients/${id}/surgeries/${surgery.id}`} className="flex items-center gap-4 p-5 transition hover:bg-foreground/[.03]">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></span>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{surgery.side} shoulder</span><span className="block truncate text-sm text-muted">{formatDate(surgery.surgery_date)} · {surgery.repair_type}</span></span>
              <ChevronRight className="size-4 shrink-0 text-muted" />
            </Link>
          ))}
          {!surgeryError && !surgeries?.length && <div className="p-8 text-center"><p className="text-sm text-muted">No rotator cuff surgeries recorded.</p><Link href={`/patients/${id}/surgeries/new`} className="mt-3 inline-block text-sm font-semibold text-primary">Add the first surgery</Link></div>}
        </div>
      </section>
    </div>
  );
}
