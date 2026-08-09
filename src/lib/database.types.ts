export type Sex = "Male" | "Female" | "Other";
export type DiabetesMellitusStatus = "Yes" | "No";
export type SmokingStatus = "Never" | "Former" | "Current";

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  birthday: string;
  sex: Sex;
  diabetes_mellitus: DiabetesMellitusStatus | null;
  smoking_status: SmokingStatus | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  created_at: string;
}

export type PatientInsert = Omit<Patient, "id" | "created_at">;
export type PatientUpdate = Partial<PatientInsert>;

export type SurgerySide = "Right" | "Left";
export type SurgeryDiagnosis =
  | "Partial-thickness supraspinatus tear"
  | "Full-thickness supraspinatus tear"
  | "Massive rotator cuff tear";
export type PatteGrade = 1 | 2 | 3;
export type TangentSign = "Positive" | "Negative";
export type RepairType = "Single row" | "Double row" | "Partial repair";
export type BicepsProcedure = "None" | "Tenotomy" | "Tenodesis";

export interface Surgery {
  id: string;
  patient_id: string;
  surgery_date: string;
  side: SurgerySide;
  diagnosis: SurgeryDiagnosis;
  patte_grade: PatteGrade;
  tangent_sign: TangentSign;
  subscapularis_tear: boolean;
  biceps_lesion: boolean;
  red_tear: boolean | null;
  anterior_cable_tear: boolean | null;
  repair_type: RepairType;
  margin_convergence: boolean | null;
  graft_use: boolean | null;
  medialization: boolean | null;
  number_of_anchors: number;
  biceps_procedure: BicepsProcedure;
  operative_notes: string | null;
  created_at: string;
}

export type SurgeryInsert = Omit<Surgery, "id" | "created_at">;
export type SurgeryUpdate = Partial<Omit<SurgeryInsert, "patient_id">>;

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: Patient;
        Insert: PatientInsert;
        Update: PatientUpdate;
        Relationships: [];
      };
      surgeries: {
        Row: Surgery;
        Insert: SurgeryInsert;
        Update: SurgeryUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
