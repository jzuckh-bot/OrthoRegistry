import { z } from "zod";

export const patientSchema = z.object({
  mrn: z.string().trim().min(1, "MRN is required").max(50),
  name: z.string().trim().min(2, "Name must have at least 2 characters").max(120),
  birthday: z.string().min(1, "Birthday is required").refine(v => new Date(v) <= new Date(), "Birthday cannot be in the future"),
  sex: z.enum(["Male", "Female", "Other"]),
  height: z.union([
    z.literal(""),
    z.coerce.number().min(30, "Enter a valid height").max(300),
  ]).transform(value => value === "" ? undefined : value),
  weight: z.union([
    z.literal(""),
    z.coerce.number().min(1, "Enter a valid weight").max(700),
  ]).transform(value => value === "" ? undefined : value),
});

export type PatientFormValues = z.infer<typeof patientSchema>;
