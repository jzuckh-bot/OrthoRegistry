import { z } from "zod";

export const surgerySchema = z.object({
  surgery_date: z.string().min(1, "Surgery date is required"),
  side: z.enum(["Right", "Left"], { required_error: "Select a side" }),
  diagnosis: z.enum([
    "Partial-thickness supraspinatus tear",
    "Full-thickness supraspinatus tear",
    "Massive rotator cuff tear",
  ], { required_error: "Select a diagnosis" }),
  patte_grade: z.coerce.number().int().min(1).max(3),
  tangent_sign: z.enum(["Positive", "Negative"]),
  subscapularis_tear: z.boolean(),
  biceps_lesion: z.boolean(),
  red_tear: z.boolean().nullable(),
  anterior_cable_tear: z.boolean().nullable(),
  repair_type: z.enum(["Single row", "Double row", "Partial repair"]),
  number_of_anchors: z.coerce.number().int("Use a whole number").min(0, "Cannot be negative").max(20, "Maximum is 20"),
  biceps_procedure: z.enum(["None", "Tenotomy", "Tenodesis"]),
});

export type SurgeryFormValues = z.infer<typeof surgerySchema>;
