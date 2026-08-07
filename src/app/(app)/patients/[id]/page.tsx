import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DeletePatientButton } from "@/components/delete-patient-button";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/lib/database.types";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: patient } = await (await createClient()).from("patients").select("*").eq("id", id).returns<Patient[]>().single();
  if (!patient) notFound();
  const details = [["MRN", patient.mrn], ["Birthday", formatDate(patient.birthday)], ["Sex", patient.sex], ["Height", `${patient.height} cm`], ["Weight", `${patient.weight} kg`], ["BMI", patient.bmi], ["Created", formatDate(patient.created_at)]];
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/patients" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" />Back to patients</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">PATIENT RECORD</p><h1 className="mt-1 text-3xl font-bold">{patient.name}</h1></div><div className="flex gap-2"><Link href={`/patients/${id}/edit`}><Button variant="secondary"><Pencil className="size-4" />Edit</Button></Link><DeletePatientButton id={id} /></div></div>
      <section className="surface mt-8 grid gap-px overflow-hidden bg-border sm:grid-cols-2">
        {details.map(([label, value]) => <div key={label} className="bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-2 font-medium">{value}</p></div>)}
      </section>
      <section className="surface mt-6 p-6"><h2 className="font-semibold">Surgical history</h2><p className="mt-2 text-sm text-muted">Surgery records will be available in a future phase.</p></section>
    </div>
  );
}
