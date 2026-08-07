import Link from "next/link";
import { ArrowRight, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Patient } from "@/lib/database.types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ count }, { data: recent }] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase.from("patients").select("*").order("created_at", { ascending: false }).limit(5).returns<Patient[]>(),
  ]);
  return (
    <div>
      <p className="text-sm font-semibold text-primary">OVERVIEW</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Clinical dashboard</h1>
      <p className="mt-2 text-muted">A focused view of your orthopedic registry.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/patients" className="surface p-6 transition hover:-translate-y-0.5">
          <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Users /></span><ArrowRight className="text-muted" /></div>
          <p className="mt-8 text-4xl font-bold">{count ?? 0}</p><p className="mt-1 text-sm text-muted">Registered patients</p>
        </Link>
        <Link href="/patients/new" className="surface p-6 transition hover:-translate-y-0.5">
          <span className="grid size-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600"><Plus /></span>
          <p className="mt-8 text-xl font-bold">Add a patient</p><p className="mt-1 text-sm text-muted">Create a new registry record</p>
        </Link>
      </div>
      <section className="surface mt-6 overflow-hidden">
        <div className="border-b p-5"><h2 className="font-semibold">Recently added</h2></div>
        <div className="divide-y">
          {recent?.length ? recent.map(patient => <Link key={patient.id} href={`/patients/${patient.id}`} className="flex items-center justify-between p-5 hover:bg-foreground/[.03]"><div><p className="font-medium">{patient.name}</p><p className="text-sm text-muted">MRN {patient.mrn}</p></div><ArrowRight className="size-4 text-muted" /></Link>) : <p className="p-8 text-center text-sm text-muted">No patients have been added yet.</p>}
        </div>
      </section>
    </div>
  );
}
