"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Patient } from "@/lib/database.types";
import { calculateBmi } from "@/lib/utils";
import { patientSchema, type PatientFormValues } from "@/lib/validation/patient";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PatientForm({ patient }: { patient?: Patient }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? {
      mrn: patient.mrn,
      name: patient.name,
      birthday: patient.birthday,
      sex: patient.sex,
      height: patient.height ?? undefined,
      weight: patient.weight ?? undefined,
    } : { sex: "Male" },
  });
  const [height, weight] = watch(["height", "weight"]);
  const bmi = useMemo(() => calculateBmi(Number(height), Number(weight)), [height, weight]);

  async function submit(values: PatientFormValues) {
    setServerError("");
    const payload = {
      ...values,
      height: values.height ?? null,
      weight: values.weight ?? null,
      bmi: calculateBmi(values.height, values.weight),
    };
    const supabase = createClient();
    const result = patient
      ? await supabase.from("patients").update(payload).eq("id", patient.id).select().single()
      : await supabase.from("patients").insert(payload).select().single();
    if (result.error) return setServerError(result.error.code === "23505" ? "A patient with this MRN already exists." : result.error.message);
    router.push(`/patients/${result.data.id}`); router.refresh();
  }

  const field = (name: keyof PatientFormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm font-medium">{label}<Input className="mt-2" {...props} {...register(name)} />{errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]?.message}</span>}</label>
  );
  return (
    <form onSubmit={handleSubmit(submit)} className="surface mt-8 p-5 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        {field("mrn", "Medical record number", { placeholder: "e.g. OR-10291" })}
        {field("name", "Full name", { placeholder: "Patient name" })}
        {field("birthday", "Birthday", { type: "date" })}
        <label className="block text-sm font-medium">Sex<select className="field mt-2" {...register("sex")}><option>Male</option><option>Female</option><option>Other</option></select></label>
        {field("height", "Height (cm) · Optional", { type: "number", step: "0.1", inputMode: "decimal" })}
        {field("weight", "Weight (kg) · Optional", { type: "number", step: "0.1", inputMode: "decimal" })}
      </div>
      <div className="mt-6 rounded-2xl bg-primary/5 p-4"><p className="text-xs font-semibold uppercase text-muted">Calculated BMI</p><p className="mt-1 text-2xl font-bold">{bmi ?? "Not available"}</p></div>
      {serverError && <p role="alert" className="mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{serverError}</p>}
      <div className="mt-7 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button disabled={isSubmitting}>{isSubmitting ? "Saving…" : patient ? "Save changes" : "Add patient"}</Button></div>
    </form>
  );
}
