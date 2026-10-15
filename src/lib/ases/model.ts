import { z } from "zod";
import { isDate } from "../cohort/filters";

export const FUNCTION_ITEMS = [
  ["function_put_on_coat", "穿上外套"],
  ["function_sleep_affected_side", "側睡在患側肩膀"],
  ["function_wash_back", "清洗背部／在背後扣內衣"],
  ["function_toileting", "如廁後處理個人清潔"],
  ["function_comb_hair", "梳頭"],
  ["function_high_shelf", "伸手拿高處架子上的物品"],
  ["function_lift_4_5kg", "將約 4.5 公斤的物品舉到肩膀以上\n（大約相當於一袋接近 5 公斤的米）"],
  ["function_throw_ball", "過肩投球"],
  ["function_usual_work", "從事平常的工作"],
  ["function_usual_sport", "從事平常的運動或休閒活動"],
] as const;
export type FunctionKey = typeof FUNCTION_ITEMS[number][0];
export const TIMEPOINTS = ["Preop", "2 weeks", "6 weeks", "3 months", "6 months", "1 year", "2 years", "Other"] as const;
export const COMPLETED_BY = ["Patient", "Assistant", "Clinician"] as const;
export const FUNCTION_LABELS = ["無法完成", "非常困難", "有些困難", "不困難"] as const;
const answer = z.number().int().min(0).max(3);
export const rawSchema = z.object({
  pain_score: z.number().int().min(0).max(10),
  function_put_on_coat: answer, function_sleep_affected_side: answer,
  function_wash_back: answer, function_toileting: answer, function_comb_hair: answer,
  function_high_shelf: answer, function_lift_4_5kg: answer, function_throw_ball: answer,
  function_usual_work: answer, function_usual_sport: answer,
});
export const asesSchema = rawSchema.extend({
  patient_id: z.string().uuid(), surgery_id: z.string().uuid().nullable(),
  assessment_date: z.string().refine(isDate, "請填寫有效評估日期"),
  timepoint: z.enum(TIMEPOINTS).nullable(), custom_timepoint: z.string().trim().max(200).nullable(),
  completed_by: z.enum(COMPLETED_BY).nullable(),
}).strict().superRefine((v,ctx) => {
  if(v.timepoint === "Other" && !v.custom_timepoint) ctx.addIssue({code:"custom",path:["custom_timepoint"],message:"請填寫其他評估時點"});
}).transform(v=>({...v,custom_timepoint:v.timepoint === "Other" ? v.custom_timepoint : null}));
export type AsesInput = z.infer<typeof asesSchema>;
export function calculateAses(raw: unknown) {
  const parsed = rawSchema.safeParse(raw);
  if (!parsed.success) return null;
  const pain = (10 - parsed.data.pain_score) * 5;
  const sum = FUNCTION_ITEMS.reduce((n,[key])=>n+parsed.data[key],0);
  const functionComponent = (sum / 30) * 50;
  return { ases_pain_component: pain, ases_function_component: functionComponent, ases_total_score: pain + functionComponent };
}
export type AsesAssessment = AsesInput & {
  id: string; ases_pain_component: number; ases_function_component: number; ases_total_score: number;
  created_at: string; updated_at: string; created_by: string | null;
};
