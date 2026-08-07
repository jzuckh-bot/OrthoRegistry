import { PatientForm } from "@/components/patient-form";

export default function AddPatientPage() {
  return <div className="mx-auto max-w-3xl"><p className="text-sm font-semibold text-primary">NEW RECORD</p><h1 className="mt-1 text-3xl font-bold">Add patient</h1><p className="mt-2 text-muted">BMI is calculated automatically from height and weight.</p><PatientForm /></div>;
}
