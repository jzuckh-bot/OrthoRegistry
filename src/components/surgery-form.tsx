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
      preop_imaging_source: surgery.preop_imaging_source ?? null,
      preop_ultrasound_date: surgery.preop_ultrasound_date ?? "",
      preop_mri_date: surgery.preop_mri_date ?? "",
      side: surgery.side,
      diagnosis: surgery.diagnosis,
      patte_grade: surgery.patte_grade,
      tangent_sign: surgery.tangent_sign,
      subscapularis_tear: surgery.subscapularis_tear,
      biceps_lesion: surgery.biceps_lesion,
      red_tear: surgery.red_tear ?? null,
      anterior_cable_tear: surgery.anterior_cable_tear ?? null,
      revision_surgery: surgery.revision_surgery ?? null,
      repair_type: surgery.repair_type,
      margin_convergence: surgery.margin_convergence ?? null,
      graft_use: surgery.graft_use ?? null,
      medialization: surgery.medialization ?? null,
      number_of_anchors: surgery.number_of_anchors,
      medial_row_anchors: surgery.medial_row_anchors ?? null,
      lateral_row_anchors: surgery.lateral_row_anchors ?? null,
      biceps_procedure: surgery.biceps_procedure,
      operative_notes: surgery.operative_notes ?? "",
    } : {
      surgery_date: today(),
      surgeon: null,
      preop_imaging_source: null,
      preop_ultrasound_date: "",
      preop_mri_date: "",
      patte_grade: "1",
      tangent_sign: "Negative",
      subscapularis_tear: false,
      biceps_lesion: false,
      red_tear: null,
      anterior_cable_tear: null,
      revision_surgery: null,
      margin_convergence: null,
      graft_use: null,
      medialization: null,
      number_of_anchors: 0,
      medial_row_anchors: 0,
      lateral_row_anchors: 0,
      biceps_procedure: "None",
      operative_notes: "",
    },
  });

  async function submit(values: SurgeryFormValues) {
    setServerError("");
    const supabase = createClient();
    const payload = {
      ...values,
      number_of_anchors: values.medial_row_anchors !== null && values.lateral_row_anchors !== null
        ? values.medial_row_anchors + values.lateral_row_anchors
        : values.number_of_anchors,
      preop_ultrasound_date: values.preop_imaging_source === "Ultrasound" ? values.preop_ultrasound_date || null : null,
      preop_mri_date: values.preop_imaging_source === "MRI" ? values.preop_mri_date || null : null,
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
        <Controller name="revision_surgery" control={control} render={({ field }) => <SelectionCards label="Surgery type" options={[{ value: "false", label: "Primary surgery" }, { value: "true", label: "Revision surgery" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value === "true") }} selected={field.value == null ? undefined : String(field.value)} />} />
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
        <h2 className="text-lg font-bold">Preoperative imaging</h2>
        <Controller name="preop_imaging_source" control={control} render={({ field }) => <div><SelectionCards label="Imaging source" columns={3} options={[{ value: "Ultrasound" }, { value: "MRI" }, { value: "Cloud imaging" }]} registration={{ name: field.name, onBlur: field.onBlur, ref: field.ref, onChange: e => field.onChange(e.target.value) }} selected={field.value ?? undefined} />{field.value && <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={() => { field.onChange(null); setValue("preop_ultrasound_date", ""); setValue("preop_mri_date", ""); }}>Clear selection</button>}</div>} />
        {selected.preop_imaging_source === "Ultrasound" && <label className="block text-sm font-semibold">Ultrasound examination date<Input type="date" className="mt-3 h-12 text-base" {...register("preop_ultrasound_date")} /></label>}
        {selected.preop_imaging_source === "MRI" && <label className="block text-sm font-semibold">MRI examination date<Input type="date" className="mt-3 h-12 text-base" {...register("preop_mri_date")} /></label>}
      </section>

      <section className="surface space-y-7 p-5 sm:p-7">
        <h2 className="text-lg font-bold">Imaging & diagnosis</h2>
        <SelectionCards label="Diagnosis" columns={2} options={[
          { value: "Partial-thickness supraspinatus tear", label: "Partial-thickness", hint: "Supraspinatus tear" },
          { value: "Full-thickness supraspinatus tear", label: "Full-thickness", hint: "Supraspinatus tear" },
          { value: "Massive rotator cuff tear", label: "Massive tear", hint: "Rotator cuff" },
        ]} registration={registration("diagnosis")} selected={selected.diagnosis} error={errors.diagnosis} />
        <SelectionCards label="Patte grade" options={[{ value: "1" }, { value: "2" }, { value: "3" }, { value: "N/A" }]} registration={registration("patte_grade")} selected={selected.patte_grade} error={errors.patte_grade} />
        <SelectionCards label="Tangent sign" columns={3} options={[{ value: "Positive" }, { value: "Negative" }, { value: "N/A" }]} registration={registration("tangent_sign")} selected={selected.tangent_sign} error={errors.tangent_sign} />
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
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {([
              { name: "medial_row_anchors", label: "Medial row (內排)" },
              { name: "lateral_row_anchors", label: "Lateral row (外排)" },
            ] as const).map(({ name, label }) => (
              <Controller key={name} name={name} control={control} render={({ field }) => (
                <fieldset className="rounded-2xl border bg-card p-2">
                  <legend className="px-2 text-sm font-semibold">{label}</legend>
                  <div className="flex items-center justify-between gap-2">
                    <Button type="button" variant="ghost" className="size-12 shrink-0 rounded-xl p-0" aria-label={`Decrease ${label} anchors`} disabled={field.value === 0} onClick={() => field.onChange(Math.max(0, (field.value ?? 1) - 1))}><Minus /></Button>
                    <output className="text-center text-2xl font-bold tabular-nums" aria-live="polite">{field.value ?? "—"}</output>
                    <Button type="button" variant="ghost" className="size-12 shrink-0 rounded-xl p-0" aria-label={`Increase ${label} anchors`} disabled={(selected.medial_row_anchors ?? 0) + (selected.lateral_row_anchors ?? 0) >= 20} onClick={() => field.onChange(Math.min(20, (field.value ?? 0) + 1))}><Plus /></Button>
                  </div>
                  {field.value === null && <button type="button" className="w-full min-h-11 text-sm font-semibold text-primary" onClick={() => field.onChange(0)}>Record 0</button>}
                  {errors[name] && <p role="alert" className="p-2 text-xs text-red-600">{errors[name]?.message}</p>}
                </fieldset>
              )} />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold" aria-live="polite">
            {selected.medial_row_anchors !== null && selected.lateral_row_anchors !== null
              ? `Total anchors: ${selected.medial_row_anchors + selected.lateral_row_anchors}`
              : `Previously recorded total: ${selected.number_of_anchors}`}
          </p>
          {(selected.medial_row_anchors === null || selected.lateral_row_anchors === null) && <p className="mt-1 text-xs text-muted">Row counts were not recorded. To update the breakdown, record both rows; use 0 if none.</p>}
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
