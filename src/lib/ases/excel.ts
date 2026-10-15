import ExcelJS from "exceljs";
import { ageAt } from "../cohort/filters";
import { FUNCTION_ITEMS, calculateAses, type AsesAssessment } from "./model";
import type { Patient, Surgery } from "../database.types";
export type AsesExportRow = AsesAssessment & { patient: Patient; surgery: Surgery | null };
export async function asesWorkbook(rows: AsesExportRow[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("ASES", { views: [{state:"frozen",ySplit:1}] });
  const headers = ["Patient name","MRN","Sex","DOB","Age at assessment","Surgery date","Side","Surgeon","Related surgery ID","Assessment date","Timepoint","Custom timepoint","Completed by","Pain score","ASES pain component",...FUNCTION_ITEMS.map(([,label])=>label.split("\n")[0]),"ASES function component","ASES total score","Created at","Updated at"];
  sheet.columns = headers.map(header=>({header,width:header.length > 24 ? 38 : 23}));
  sheet.getRow(1).font = {bold:true};
  sheet.getRow(1).alignment = {wrapText:true};
  for (const row of rows) {
    const scores = calculateAses(row);
    if (!scores) throw new Error("ASES 原始答案不完整，無法匯出。");
    for (const key of ["ases_pain_component","ases_function_component","ases_total_score"] as const) {
      if (Math.abs(Number(row[key])-scores[key]) > 0.000001) throw new Error("ASES 分數與原始答案不一致，請先檢查紀錄。");
    }
    sheet.addRow([row.patient.name,row.patient.mrn,row.patient.sex,row.patient.birthday,ageAt(row.patient.birthday,row.assessment_date),row.surgery?.surgery_date ?? "",row.surgery?.side ?? "",row.surgery?.surgeon ?? "",row.surgery_id ?? "",row.assessment_date,row.timepoint ?? "",row.custom_timepoint ?? "",row.completed_by ?? "",row.pain_score,scores.ases_pain_component,...FUNCTION_ITEMS.map(([key])=>row[key]),scores.ases_function_component,scores.ases_total_score,row.created_at,row.updated_at]);
  }
  sheet.autoFilter = {from:{row:1,column:1},to:{row:Math.max(1,rows.length+1),column:headers.length}};
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
