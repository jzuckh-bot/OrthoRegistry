import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import type { Patient, Surgery } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DeleteSurgeryButton } from "@/components/delete-surgery-button";
import { formatDate } from "@/lib/utils";

const yesNo = (value: boolean) => value ? "Yes" : "No";

export default async function SurgeryDetailPage({ params }: { params: Promise<{ id: string; surgeryId: string }> }) {
  const { id, surgeryId } = await params;
  const supabase = await createClient();
  const [{ data: patient }, { data: surgery }] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).returns<Patient[]>().single(),
    supabase.from("surgeries").select("*").eq("id", surgeryId).eq("patient_id", id).returns<Surgery[]>().single(),
  ]);
  if (!patient || !surgery) notFound();
  const details = [
    ["Surgery date", formatDate(surgery.surgery_date)],
    ["Side", surgery.side],
    ["Diagnosis", surgery.diagnosis],
    ["Patte grade", surgery.patte_grade],
    ["Tangent sign", surgery.tangent_sign],
    ["Subscapularis tear", yesNo(surgery.subscapularis_tear)],
    ["Biceps lesion", yesNo(surgery.biceps_lesion)],
    ...(surgery.red_tear == null ? [] : [["Red tear", yesNo(surgery.red_tear)]]),
    ...(surgery.anterior_cable_tear == null ? [] : [["Anterior cable tear", yesNo(surgery.anterior_cable_tear)]]),
    ["Repair type", surgery.repair_type],
    ...(surgery.margin_convergence == null ? [] : [["Margin convergence", yesNo(surgery.margin_convergence)]]),
    ...(surgery.graft_use == null ? [] : [["Graft use", yesNo(surgery.graft_use)]]),
    ...(surgery.medialization == null ? [] : [["Medialization", yesNo(surgery.medialization)]]),
    ["Number of anchors", surgery.number_of_anchors],
    ["Biceps procedure", surgery.biceps_procedure],
    ...(surgery.operative_notes ? [["Operative notes", surgery.operative_notes]] : []),
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/patients/${id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" />Back to {patient.name}</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-primary">ROTATOR CUFF SURGERY</p><h1 className="mt-1 text-3xl font-bold">{surgery.side} shoulder</h1><p className="mt-2 text-muted">{formatDate(surgery.surgery_date)}</p></div>
        <div className="flex gap-2"><Link href={`/patients/${id}/surgeries/${surgeryId}/edit`}><Button variant="secondary" className="h-11"><Pencil className="size-4" />Edit</Button></Link><DeleteSurgeryButton id={surgeryId} patientId={id} /></div>
      </div>
      <section className="surface mt-8 grid gap-px overflow-hidden bg-border sm:grid-cols-2">
        {details.map(([label, value]) => <div key={String(label)} className={label === "Operative notes" ? "bg-card p-5 sm:col-span-2" : "bg-card p-5"}><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className={label === "Operative notes" ? "mt-2 whitespace-pre-wrap font-medium" : "mt-2 font-medium"}>{value}</p></div>)}
      </section>
    </div>
  );
}
