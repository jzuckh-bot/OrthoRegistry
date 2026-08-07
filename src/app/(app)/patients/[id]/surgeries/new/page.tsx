import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { Patient } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { SurgeryForm } from "@/components/surgery-form";

export default async function NewSurgeryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: patient } = await (await createClient()).from("patients").select("*").eq("id", id).returns<Patient[]>().single();
  if (!patient) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/patients/${id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" />{patient.name}</Link>
      <p className="mt-6 text-sm font-semibold text-primary">ROTATOR CUFF MODULE</p>
      <h1 className="mt-1 text-3xl font-bold">New surgery</h1>
      <p className="mt-2 text-muted">Tap to select. Required fields are validated before saving.</p>
      <SurgeryForm patientId={id} />
    </div>
  );
}
