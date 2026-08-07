import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { Patient, Surgery } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { SurgeryForm } from "@/components/surgery-form";

export default async function EditSurgeryPage({ params }: { params: Promise<{ id: string; surgeryId: string }> }) {
  const { id, surgeryId } = await params;
  const supabase = await createClient();
  const [{ data: patient }, { data: surgery }] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).returns<Patient[]>().single(),
    supabase.from("surgeries").select("*").eq("id", surgeryId).eq("patient_id", id).returns<Surgery[]>().single(),
  ]);
  if (!patient || !surgery) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/patients/${id}/surgeries/${surgeryId}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" />Surgery detail</Link>
      <p className="mt-6 text-sm font-semibold text-primary">ROTATOR CUFF MODULE</p>
      <h1 className="mt-1 text-3xl font-bold">Edit surgery</h1>
      <p className="mt-2 text-muted">{patient.name} · {formatDateForInput(surgery.surgery_date)}</p>
      <SurgeryForm patientId={id} surgery={surgery} />
    </div>
  );
}

function formatDateForInput(value: string) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}
