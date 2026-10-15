const {test}=require('node:test');
const assert=require('node:assert/strict');
const ExcelJS=require('exceljs');
const {FUNCTION_ITEMS,asesSchema,calculateAses}=require('../src/lib/ases/model.ts');
const {asesWorkbook}=require('../src/lib/ases/excel.ts');
const {isSameOrigin}=require('../src/lib/ases/origin.ts');
test('origin protection accepts actual local Host and rejects cross-origin/missing origins',()=>{
  const req=(origin,host='127.0.0.1:3000')=>new Request('http://localhost:3000/api/ases/test',{headers:{host,...(origin?{origin}:{})}});
  assert.equal(isSameOrigin(req('http://127.0.0.1:3000')),true);
  for(const value of ['https://evil.example','http://localhost:3000','null',undefined,'http://127.0.0.1:3000/path','https://127.0.0.1:3000']) assert.equal(isSameOrigin(req(value)),false);
  assert.equal(isSameOrigin(new Request('https://orthoregistry.vercel.app/api/ases/test',{headers:{host:'orthoregistry.vercel.app',origin:'https://orthoregistry.vercel.app'}})),true);
});
const input=(pain=0,value=3)=>({patient_id:'00000000-0000-4000-8000-000000000001',surgery_id:null,assessment_date:'2026-10-12',timepoint:null,custom_timepoint:null,completed_by:null,pain_score:pain,...Object.fromEntries(FUNCTION_ITEMS.map(([key])=>[key,value]))});
test('exact ten Chinese questions and 4.5kg field',()=>{
  assert.equal(FUNCTION_ITEMS.length,10);assert.equal(new Set(FUNCTION_ITEMS.map(([key])=>key)).size,10);
  assert.equal(FUNCTION_ITEMS[6][0],'function_lift_4_5kg');
  assert.equal(FUNCTION_ITEMS[6][1],'將約 4.5 公斤的物品舉到肩膀以上\n（大約相當於一袋接近 5 公斤的米）');
});
test('ASES boundaries and fractional scores follow formula without premature rounding',()=>{
  assert.deepEqual(calculateAses(input()),{ases_pain_component:50,ases_function_component:50,ases_total_score:100});
  assert.deepEqual(calculateAses(input(10,0)),{ases_pain_component:0,ases_function_component:0,ases_total_score:0});
  const scores=calculateAses(input(4,1));assert.equal(scores.ases_pain_component,30);assert.equal(scores.ases_function_component,10/30*50);assert.equal(scores.ases_total_score,30+10/30*50);
});
test('every missing, null or invalid raw answer blocks calculation and save',()=>{
  for(const key of ['pain_score',...FUNCTION_ITEMS.map(([key])=>key)]) {
    for(const bad of [undefined,null,'0',-1,0.5,NaN,Infinity,key==='pain_score'?11:4]) {
      const row={...input(),[key]:bad};assert.equal(calculateAses(row),null);assert.equal(asesSchema.safeParse(row).success,false);
    }
  }
  assert.ok(asesSchema.safeParse(input(0,0)).success);
});
test('raw edit recalculates; client total and invalid metadata rejected',()=>{
  const row=input();row.function_put_on_coat=0;assert.equal(calculateAses(row).ases_total_score,95);
  assert.equal(asesSchema.safeParse({...row,ases_total_score:100}).success,false);
  for(const update of [{assessment_date:''},{assessment_date:'2026-02-30'},{surgery_id:'bad'},{completed_by:'Other'},{timepoint:'Other',custom_timepoint:''}]) assert.equal(asesSchema.safeParse({...row,...update}).success,false);
  assert.equal(asesSchema.parse({...row,timepoint:'Preop',custom_timepoint:'old'}).custom_timepoint,null);
});
test('XLSX exports all 10 literal raw responses, linkage, components and metadata',async()=>{
  const raw=input(2,2),scores=calculateAses(raw);
  const row={...raw,...scores,id:'assessment',created_at:'2026-10-12T00:00:00Z',updated_at:'2026-10-12T01:00:00Z',created_by:null,patient:{name:'=Synthetic',mrn:'00001',sex:'Female',birthday:'1980-10-12'},surgery:null};
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await asesWorkbook([row]));
  const sheet=workbook.getWorksheet('ASES');assert.equal(sheet.rowCount,2);assert.equal(sheet.views[0].ySplit,1);assert.equal(sheet.getRow(1).font.bold,true);assert.ok(sheet.autoFilter);
  assert.equal(sheet.getCell('A2').type,ExcelJS.ValueType.String);assert.equal(sheet.getCell('B2').value,'00001');
  for(let i=0;i<10;i++) assert.equal(sheet.getRow(2).getCell(16+i).value,2);
  assert.equal(sheet.getRow(2).getCell(27).value,scores.ases_total_score);
  await assert.rejects(asesWorkbook([{...row,ases_total_score:0}]));
});
