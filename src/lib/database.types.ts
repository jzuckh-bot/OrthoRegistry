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
export type PatteGrade = "1" | "2" | "3" | "N/A";
export type TangentSign = "Positive" | "Negative" | "N/A";
export type RepairType = "Single row" | "Double row" | "Partial repair";
export type BicepsProcedure = "None" | "Tenotomy" | "Tenodesis" | "Transposition";
export type Surgeon = "蔣恩榮" | "陳昆暉" | "馬瑄孝";
export type PreopImagingSource = "Ultrasound" | "MRI" | "Cloud imaging";

export interface Surgery {
  id: string;
  patient_id: string;
  surgery_date: string;
  surgeon: Surgeon | null;
  preop_imaging_source: PreopImagingSource | null;
  preop_ultrasound_date: string | null;
  preop_mri_date: string | null;
  side: SurgerySide;
  diagnosis: SurgeryDiagnosis;
  patte_grade: PatteGrade;
  tangent_sign: TangentSign;
  subscapularis_tear: boolean | null;
  biceps_lesion: boolean | null;
  acromioplasty: boolean | null;
  subscapularis_tear_type: "None" | "Partial" | "Full thickness with retraction (comma sign +)" | null;
  subscapularis_treatment: "None" | "Debridement" | "Repair" | null;
  tenodesis_location: "Subpectoral" | "Suprapectoral" | null;
  tear_pattern: "U shape" | "L shape" | null;
  footprint_coverage: "Direct repair" | "Incomplete footprint coverage" | "Partial repair" | null;
  superior_capsule_reconstruction: boolean | null;
  tendon_transfer: "None" | "LTT" | "LD" | null;
  red_tear: boolean | null;
  anterior_cable_tear: boolean | null;
  revision_surgery: boolean | null;
  repair_type: RepairType;
  margin_convergence: boolean | null;
  graft_use: boolean | null;
  medialization: boolean | null;
  number_of_anchors: number;
  medial_row_anchors: number | null;
  lateral_row_anchors: number | null;
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
