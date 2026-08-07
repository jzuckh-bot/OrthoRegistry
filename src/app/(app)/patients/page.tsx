import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/lib/database.types";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("patients").select("*").order("created_at", { ascending: false });
  if (q.trim()) {
    const safe = q.trim().replace(/[,%()]/g, "");
    query = query.or(`mrn.ilike.%${safe}%,name.ilike.%${safe}%`);
  }
  const { data: patients, error } = await query.returns<Patient[]>();
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-primary">PATIENT MODULE</p><h1 className="mt-1 text-3xl font-bold">Patients</h1><p className="mt-2 text-muted">Search and manage registry records.</p></div>
        <Link href="/patients/new"><Button><Plus className="size-4" /><span className="hidden sm:inline">Add patient</span></Button></Link>
      </div>
      <form className="relative mt-8"><Search className="absolute left-4 top-3.5 size-4 text-muted" /><input name="q" defaultValue={q} placeholder="Search by MRN or patient name…" className="field h-12 pl-11" /></form>
      {error && <p className="mt-4 rounded-xl bg-red-500/10 p-4 text-sm text-red-600">{error.message}</p>}
      <section className="surface mt-5 overflow-hidden">
        <div className="hidden grid-cols-[1fr_1.5fr_1fr_1fr] gap-4 border-b px-5 py-3 text-xs font-semibold uppercase text-muted sm:grid"><span>MRN</span><span>Name</span><span>Birthday</span><span>Sex</span></div>
        <div className="divide-y">
          {patients?.map(patient => <Link key={patient.id} href={`/patients/${patient.id}`} className="grid gap-1 p-5 transition hover:bg-foreground/[.03] sm:grid-cols-[1fr_1.5fr_1fr_1fr] sm:gap-4"><span className="text-sm font-semibold text-primary">{patient.mrn}</span><span className="font-medium">{patient.name}</span><span className="text-sm text-muted">{formatDate(patient.birthday)}</span><span className="text-sm text-muted">{patient.sex}</span></Link>)}
          {!patients?.length && <p className="p-10 text-center text-sm text-muted">No patients match your search.</p>}
        </div>
      </section>
    </div>
  );
}
