import { z } from "zod";

export const surgerySchema = z.object({
  surgery_date: z.string().min(1, "Surgery date is required"),
  surgeon: z.enum(["蔣恩榮", "陳昆暉", "馬瑄孝"]).nullable(),
  preop_imaging_source: z.enum(["Ultrasound", "MRI", "Cloud imaging"]).nullable(),
  preop_ultrasound_date: z.string(),
  preop_mri_date: z.string(),
  side: z.enum(["Right", "Left"], { required_error: "Select a side" }),
  diagnosis: z.enum([
    "Partial-thickness supraspinatus tear",
    "Full-thickness supraspinatus tear",
    "Massive rotator cuff tear",
  ], { required_error: "Select a diagnosis" }),
  patte_grade: z.enum(["1", "2", "3", "N/A"]),
  tangent_sign: z.enum(["Positive", "Negative", "N/A"]),
  acromioplasty: z.boolean().nullable(),
  subscapularis_tear_type: z.enum(["None","Partial","Full thickness with retraction (comma sign +)"]).nullable(),
  subscapularis_treatment: z.enum(["None","Debridement","Repair"]).nullable(),
  tenodesis_location: z.enum(["Subpectoral","Suprapectoral"]).nullable(),
  tear_pattern: z.enum(["U shape","L shape"]).nullable(),
  footprint_coverage: z.enum(["Direct repair","Incomplete footprint coverage","Partial repair"]).nullable(),
  superior_capsule_reconstruction: z.boolean().nullable(),
  tendon_transfer: z.enum(["None","LTT","LD"]).nullable(),
  red_tear: z.boolean().nullable(),
  anterior_cable_tear: z.boolean().nullable(),
  revision_surgery: z.boolean().nullable(),
  repair_type: z.enum(["Single row", "Double row", "Partial repair"]),
  margin_convergence: z.boolean().nullable(),
  graft_use: z.boolean().nullable(),
  medialization: z.boolean().nullable(),
  number_of_anchors: z.coerce.number().int("Use a whole number").min(0, "Cannot be negative").max(20, "Maximum is 20"),
  medial_row_anchors: z.number().int().min(0).max(20).nullable(),
  lateral_row_anchors: z.number().int().min(0).max(20).nullable(),
  biceps_procedure: z.enum(["None", "Tenotomy", "Tenodesis", "Transposition"]),
  operative_notes: z.string(),
}).superRefine((values, context) => {
  const medial = values.medial_row_anchors;
  const lateral = values.lateral_row_anchors;
  if ((medial === null) !== (lateral === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: [medial === null ? "medial_row_anchors" : "lateral_row_anchors"], message: "Record both row counts (use 0 if none)" });
  }
  if (medial !== null && lateral !== null && medial + lateral > 20) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["number_of_anchors"], message: "Maximum total is 20" });
  }
});

export type SurgeryFormValues = z.infer<typeof surgerySchema>;
