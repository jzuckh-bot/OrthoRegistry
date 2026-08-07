import { notFound } from "next/navigation";
import { PatientForm } from "@/components/patient-form";
import { createClient } from "@/lib/supabase/server";
import type { Patient } from "@/lib/database.types";

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: patient } = await (await createClient()).from("patients").select("*").eq("id", id).returns<Patient[]>().single();
  if (!patient) notFound();
  return <div className="mx-auto max-w-3xl"><p className="text-sm font-semibold text-primary">PATIENT RECORD</p><h1 className="mt-1 text-3xl font-bold">Edit patient</h1><PatientForm patient={patient} /></div>;
}
