export type Sex = "Male" | "Female" | "Other";

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  birthday: string;
  sex: Sex;
  height: number;
  weight: number;
  bmi: number;
  created_at: string;
}

export type PatientInsert = Omit<Patient, "id" | "created_at">;
export type PatientUpdate = Partial<PatientInsert>;

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: Patient;
        Insert: PatientInsert;
        Update: PatientUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
