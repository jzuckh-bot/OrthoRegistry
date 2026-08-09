"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Minus, Plus } from "lucide-react";
import type { Surgery } from "@/lib/database.types";
import { surgerySchema, type SurgeryFormValues } from "@/lib/validation/surgery";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectionCards } from "@/components/ui/selection-cards";

const today = () => new Date().toISOString().slice(0, 10);

export function SurgeryForm({ patientId, surgery }: { patientId: string; surgery?: Surgery }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, control, setValue, formState: { errors, isSubmitting } } = useForm<SurgeryFormValues>({
    resolver: zodResolver(surgerySchema),
    defaultValues: surgery ? {
      surgery_date: surgery.surgery_date,
      surgeon: surgery.surgeon ?? null,
      side: surgery.side,
      diagnosis: surgery.diagnosis,
      patte_grade: surgery.patte_grade,
      tangent_sign: surgery.tangent_sign,
      subscapularis_tear: surgery.subscapularis_tear,
      biceps_lesion: surgery.biceps_lesion,
      red_tear: surgery.red_tear ?? null,
      anterior_cable_tear: surgery.anterior_cable_tear ?? null,
      repair_type: surgery.repair_type,
      margin_convergence: surgery.margin_convergence ?? null,
      graft_use: surgery.graft_use ?? null,
      medialization: surgery.medialization ?? null,
      number_of_anchors: surgery.number_of_anchors,
      biceps_procedure: surgery.biceps_procedure,
      operative_notes: surgery.operative_notes ?? "",
    } : {
      surgery_date: today(),
      surgeon: null,
      patte_grade: 1,
      tangent_sign: "Negative",
      subscapularis_tear: false,
      biceps_lesion: false,
      red_tear: null,
      anterior_cable_tear: null,
      margin_convergence: null,
      graft_use: null,
      medialization: null,
      number_of_anchors: 0,
      biceps_procedure: "None",
      operative_notes: "",
    },
  });

  async function submit(values: SurgeryFormValues) {
    setServerError("");
    const supabase = createClient();
    const payload = {
      ...values,
      operative_notes: values.operative_notes.trim() || null,
    };
    const result = surgery
      ? await supabase.from("surgeries").update(payload).eq("id", surgery.id)
      : await supabase.from("surgeries").insert({ ...payload, patient_id: patientId });
    if (result.error) return setServerError(result.error.message);
    router.push(`/patients/${patientId}`);
    router.refresh();
  }

  const selected = watch();
  const registration = <K extends keyof SurgeryFormValues>(name: K) => register(name);

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4 pb-28">
      <section className="surface space-y-7 p-5 sm:p-7">
        <label className="block text-sm font-semibold">Surgery date
          <span className="relative mt-3 block">
            <CalendarDays className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted" />
            <Input type="date" className="h-12 pl-11 text-base" {...register("surgery_date")} />
          </span>
          {errors.surgery_date && <span className="mt-2 block text-xs text-red-600">{errors.surgery_date.message}</span>}
        </label>
        <Controller name="surgeon" control={control} render={({ field }) => <SelectionCards label="Surgeon" columns={3} options={[{ value: "蔣恩榮" }, { value: "陳昆暉" }, { value: "馬瑄孝" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value) }} selected={field.value ?? undefined} />} />
        <SelectionCards label="Side" options={[{ value: "Right" }, { value: "Left" }]} registration={registration("side")} selected={selected.side} error={errors.side} />
      </section>

      <section className="surface space-y-7 p-5 sm:p-7">
        <h2 className="text-lg font-bold">Imaging & diagnosis</h2>
        <SelectionCards label="Diagnosis" columns={2} options={[
          { value: "Partial-thickness supraspinatus tear", label: "Partial-thickness", hint: "Supraspinatus tear" },
          { value: "Full-thickness supraspinatus tear", label: "Full-thickness", hint: "Supraspinatus tear" },
          { value: "Massive rotator cuff tear", label: "Massive tear", hint: "Rotator cuff" },
        ]} registration={registration("diagnosis")} selected={selected.diagnosis} error={errors.diagnosis} />
        <SelectionCards label="Patte grade" columns={3} options={[{ value: 1 }, { value: 2 }, { value: 3 }]} registration={registration("patte_grade")} selected={Number(selected.patte_grade)} error={errors.patte_grade} />
        <SelectionCards label="Tangent sign" options={[{ value: "Positive" }, { value: "Negative" }]} registration={registration("tangent_sign")} selected={selected.tangent_sign} error={errors.tangent_sign} />
        <Controller name="subscapularis_tear" control={control} render={({ field }) => <SelectionCards label="Subscapularis tear" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value === "true") }} selected={String(field.value)} />} />
        <Controller name="biceps_lesion" control={control} render={({ field }) => <SelectionCards label="Biceps lesion" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value === "true") }} selected={String(field.value)} />} />
        <Controller name="red_tear" control={control} render={({ field }) => <SelectionCards label="Red tear" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value === "true") }} selected={field.value == null ? undefined : String(field.value)} />} />
        <Controller name="anterior_cable_tear" control={control} render={({ field }) => <SelectionCards label="Anterior cable tear" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value === "true") }} selected={field.value == null ? undefined : String(field.value)} />} />
      </section>

      <section className="surface space-y-7 p-5 sm:p-7">
        <h2 className="text-lg font-bold">Repair</h2>
        <SelectionCards label="Repair type" options={[{ value: "Single row" }, { value: "Double row" }, { value: "Partial repair" }]} registration={registration("repair_type")} selected={selected.repair_type} error={errors.repair_type} />
        <Controller name="margin_convergence" control={control} render={({ field }) => <SelectionCards label="Margin convergence" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value === "true") }} selected={field.value == null ? undefined : String(field.value)} />} />
        <Controller name="graft_use" control={control} render={({ field }) => <SelectionCards label="Graft use" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value === "true") }} selected={field.value == null ? undefined : String(field.value)} />} />
        <Controller name="medialization" control={control} render={({ field }) => <SelectionCards label="Medialization" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value === "true") }} selected={field.value == null ? undefined : String(field.value)} />} />
        <div>
          <p className="text-sm font-semibold">Number of anchors</p>
          <div className="mt-3 flex items-center justify-between rounded-2xl border bg-card p-2">
            <Button type="button" variant="ghost" className="size-12 rounded-xl p-0" aria-label="Remove anchor" onClick={() => setValue("number_of_anchors", Math.max(0, Number(selected.number_of_anchors) - 1), { shouldValidate: true })}><Minus /></Button>
            <div className="text-center"><span className="text-3xl font-bold tabular-nums">{selected.number_of_anchors}</span><p className="text-xs text-muted">anchors</p></div>
            <Button type="button" variant="ghost" className="size-12 rounded-xl p-0" aria-label="Add anchor" onClick={() => setValue("number_of_anchors", Math.min(20, Number(selected.number_of_anchors) + 1), { shouldValidate: true })}><Plus /></Button>
          </div>
          <input type="hidden" {...register("number_of_anchors")} />
          {errors.number_of_anchors && <p className="mt-2 text-xs text-red-600">{errors.number_of_anchors.message}</p>}
        </div>
        <SelectionCards label="Biceps procedure" columns={3} options={[{ value: "None" }, { value: "Tenotomy" }, { value: "Tenodesis" }]} registration={registration("biceps_procedure")} selected={selected.biceps_procedure} error={errors.biceps_procedure} />
        <label className="block text-sm font-semibold">
          Operative notes
          <textarea
            className="field mt-3 min-h-36 resize-y px-4 py-3 text-base"
            placeholder="Add operative details..."
            {...register("operative_notes")}
          />
        </label>
      </section>

      {serverError && <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-600">{serverError}</p>}
      <div className="fixed inset-x-0 bottom-[65px] z-20 border-t bg-background/90 p-3 backdrop-blur-xl md:bottom-0 md:left-64">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Button type="button" variant="secondary" className="h-12 flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button className="h-12 flex-[2]" disabled={isSubmitting}>{isSubmitting ? "Saving…" : surgery ? "Save changes" : "Save surgery"}</Button>
        </div>
      </div>
    </form>
  );
}
