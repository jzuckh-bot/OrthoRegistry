import ExcelJS from "exceljs";
import { ageAt } from "./filters";
import type { CohortRow } from "./query";

const recorded = (value: unknown) => value === null || value === undefined || value === "" ? "Not recorded" : typeof value === "boolean" ? (value ? "Yes" : "No") : value as string | number;
type Column = { header: string; width: number; value: (row: CohortRow, asOf: string) => string | number };
const patient = (header: string, key: keyof CohortRow["patient"], width = 20): Column => ({ header, width, value: row => recorded(row.patient[key]) });
const surgery = (header: string, key: keyof Omit<CohortRow, "patient">, width = 22): Column => ({ header, width, value: row => recorded(row[key]) });
const legacyColumns: Column[] = [
  patient("Patient name", "name", 26), patient("MRN", "mrn"), patient("Sex", "sex", 12), patient("Date of birth", "birthday", 16),
  { header: "Age at search date", width: 20, value: (row, asOf) => recorded(ageAt(row.patient.birthday, asOf)) },
  patient("Height (cm)", "height", 14), patient("Weight (kg)", "weight", 14), patient("BMI", "bmi", 12),
  patient("Diabetes mellitus", "diabetes_mellitus"), patient("Smoking status", "smoking_status"),
  surgery("Surgery date", "surgery_date", 16), surgery("Side", "side", 12), surgery("Surgeon", "surgeon", 18),
  surgery("Revision surgery", "revision_surgery"), surgery("Diagnosis", "diagnosis", 46),
  surgery("Patte grade", "patte_grade", 14), surgery("Tangent sign", "tangent_sign", 16),
  surgery("Red tear", "red_tear", 14), surgery("Anterior cable tear", "anterior_cable_tear"), surgery("Acromioplasty", "acromioplasty"),
  surgery("Subscapularis tear type", "subscapularis_tear_type", 48), surgery("Subscapularis treatment", "subscapularis_treatment", 26),
  surgery("Subscapularis tear (previous record)", "subscapularis_tear", 36), surgery("Biceps lesion (previous record)", "biceps_lesion", 32),
  surgery("Biceps procedure", "biceps_procedure"), surgery("Biceps tenodesis location", "tenodesis_location", 28),
  surgery("Tear pattern", "tear_pattern"), surgery("Footprint coverage", "footprint_coverage", 34), surgery("Repair type", "repair_type"),
  surgery("Total anchors", "number_of_anchors", 16), surgery("Medial row anchors", "medial_row_anchors"), surgery("Lateral row anchors", "lateral_row_anchors"),
  surgery("Margin convergence", "margin_convergence"), surgery("Graft use", "graft_use", 14), surgery("Medialization", "medialization"),
  surgery("Superior capsule reconstruction", "superior_capsule_reconstruction", 36), surgery("Tendon transfer", "tendon_transfer"),
  surgery("Preoperative imaging source", "preop_imaging_source", 30), surgery("Ultrasound examination date", "preop_ultrasound_date", 28),
  surgery("MRI examination date", "preop_mri_date", 24), surgery("Operative notes", "operative_notes", 60),
];

// Indicators describe exact category membership, not independent clinical findings.
const category = (header: string, key: "diagnosis" | "tear_pattern" | "preop_imaging_source", expected: string): Column => ({
  header, width: 24, value: row => row[key] == null ? "Not recorded" : row[key] === expected ? "Yes" : "No",
});
export const EXPORT_COLUMNS: Column[] = [
  surgery("Surgeon", "surgeon", 18),
  patient("Patient name", "name", 26), patient("MRN", "mrn"),
  { header: "Age at search date", width: 20, value: (row, asOf) => recorded(ageAt(row.patient.birthday, asOf)) },
  patient("Sex", "sex", 12), patient("DM", "diabetes_mellitus"), patient("Smoking", "smoking_status"), surgery("Side", "side", 12),
  { header: "Primary / Revision", width: 22, value: row => row.revision_surgery === true ? "Revision" : row.revision_surgery === false ? "Primary" : "Not recorded" },
  surgery("Patte grade", "patte_grade", 14), surgery("Tangent sign", "tangent_sign", 16),
  surgery("MRI / preoperative imaging source", "preop_imaging_source", 36), surgery("MRI examination date", "preop_mri_date", 24),
  category("Sono / Ultrasound", "preop_imaging_source", "Ultrasound"), surgery("Ultrasound examination date", "preop_ultrasound_date", 28),
  category("Partial tear", "diagnosis", "Partial-thickness supraspinatus tear"),
  category("Full thickness tear", "diagnosis", "Full-thickness supraspinatus tear"),
  category("Massive tear", "diagnosis", "Massive rotator cuff tear"),
  category("U shape", "tear_pattern", "U shape"), category("L shape", "tear_pattern", "L shape"),
  surgery("Red tear", "red_tear"), surgery("Anterior cable tear", "anterior_cable_tear"),
  surgery("Subscapularis tear type", "subscapularis_tear_type", 48), surgery("Subscapularis treatment", "subscapularis_treatment", 26),
  surgery("Biceps procedure", "biceps_procedure"), surgery("Biceps tenodesis location", "tenodesis_location", 28),
  surgery("Margin convergence", "margin_convergence"), surgery("Footprint coverage", "footprint_coverage", 34),
  surgery("Graft", "graft_use"), surgery("Medialization", "medialization"), surgery("SCR", "superior_capsule_reconstruction"),
  surgery("Tendon transfer", "tendon_transfer"), surgery("Acromioplasty", "acromioplasty"), surgery("Anchor number", "number_of_anchors"),
  ...legacyColumns.filter(c => ["Surgery date", "Operative notes", "Diagnosis", "Tear pattern", "Repair type", "Medial row anchors", "Lateral row anchors", "Date of birth", "Height (cm)", "Weight (kg)", "BMI", "Subscapularis tear (previous record)", "Biceps lesion (previous record)"].includes(c.header)),
];

export async function createCohortWorkbook(rows: AsyncIterable<CohortRow>, asOf: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OrthoRegistry";
  const sheet = workbook.addWorksheet("Cohort", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = EXPORT_COLUMNS.map(column => ({ header: column.header, width: column.width }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF245BB2" } };
  sheet.getRow(1).alignment = { vertical: "middle", wrapText: true };
  sheet.getRow(1).height = 34;
  let count = 0;
  for await (const row of rows) {
    const values = EXPORT_COLUMNS.map(column => column.value(row, asOf));
    if (values.some(value => typeof value === "string" && value.length > 32767)) {
      throw new Error("A record exceeds Excel's 32,767-character cell limit. No partial file was exported.");
    }
    // Strings are literal cells, never formula objects (including leading =/+/−/@).
    const added = sheet.addRow(values);
    added.alignment = { vertical: "top", wrapText: true };
    count++;
  }
  if (count === 0) throw new Error("No matching surgery records to export. Please search again.");
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: count + 1, column: EXPORT_COLUMNS.length } };
  const info = workbook.addWorksheet("Search information");
  info.columns = [{ header: "Property", width: 30 }, { header: "Value", width: 50 }];
  info.addRow(["Age reference date (Asia/Taipei)", asOf]);
  info.addRow(["Matching surgeries exported", count]);
  info.addRow(["Missing values", "Not recorded (distinct from No and None)"]);
  info.addRow(["Category indicators", "Partial/full-thickness/massive map exactly to diagnosis; U/L map to tear_pattern. Yes means that category, No means another recorded category, not an independent clinical finding."]);
  info.addRow(["Imaging", "Sono indicates preop_imaging_source = Ultrasound. Other recorded sources do not establish whether an ultrasound was ever performed."]);
  info.getRow(1).font = { bold: true };
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
