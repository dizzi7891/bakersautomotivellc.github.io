const {test}=require("node:test");const assert=require("node:assert/strict");const fs=require("node:fs");const vm=require("node:vm");const path=require("node:path");
function setup(){
 const calls=[];const root={};const ctx={window:root,fetch:async (url)=>{
 calls.push(url);return{ok:true,json:async()=>({Results:[{VIN:"1HGCM82633A004352",ModelYear:"2003",Make:"HONDA",Model:"Accord",Trim:"EX",EngineModel:"K24A4",EngineCylinders:"4",DisplacementL:"2.4",FuelTypePrimary:"Gasoline",DriveType:"FWD",BodyClass:"Sedan",ErrorCode:"0"}]})}
 },AbortController,clearTimeout,setTimeout,Date,Number,Math,Error,encodeURIComponent};
 const dir=path.join(__dirname,"..");
 vm.runInNewContext(fs.readFileSync(path.join(dir,"vin-decoder.js"),"utf8"),ctx);
 vm.runInNewContext(fs.readFileSync(path.join(dir,"mi-compliance.js"),"utf8"),ctx);
 return{VIN:root.BakersVIN,MI:root.BakersMICompliance,calls};
}
test("VIN decoder validates length and excludes ambiguous characters",()=>{
 const {VIN}=setup();
 assert.equal(VIN.normalize(" 1hgcm82633a004352 "), "1HGCM82633A004352");
 assert.throws(()=>VIN.validate("123"),/17-character/);
 assert.throws(()=>VIN.validate("1HGCM82633A00435I"),/17-character/);
 assert.equal(VIN.validate("1HGCM82633A004352"),"1HGCM82633A004352");
});
test("VIN lookup uses NHTSA public-only URL and returns manufacturer data",async()=>{
 const {VIN,calls}=setup();
 const result=await VIN.decode("1HGCM82633A004352");
 assert.equal(result.make,"HONDA");assert.equal(result.model,"Accord");assert.equal(result.year,"2003");
 assert.equal(result.engine,"K24A4");assert.equal(result.provider,"NHTSA vPIC");
 assert.ok(calls[0].startsWith("https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/1HGCM82633A004352?format=json"));
});
test("VIN service incomplete results never fill incorrect vehicle identity",()=>{
 const {VIN}=setup();
 assert.throws(()=>VIN.parse({Results:[{Make:"Honda",Model:"",ModelYear:"2008"}]}),/incomplete/);
 assert.throws(()=>VIN.parse({Results:[]}),/no usable/);
});
test("MI compliance flags missing registration, replacement-part condition and authorization",()=>{
 const {MI}=setup();
 const report=MI.check({status:"In Progress",lineItems:[{type:"part",description:"Pads",qty:1,unitPrice:80}],approvedAmount:100}, {},200);
 const codes=report.findings.filter(f=>f.level==="required").map(f=>f.code);
 for(const c of ["facility-registration","estimate-delivery","approval","parts-condition","amended-estimate"])assert.ok(codes.includes(c),c);
 assert.equal(report.ready,false);
});
test("MI compliance flags missing completion certification and mechanic credential on final invoice",()=>{
 const {MI}=setup();
 const r=MI.check({status:"Completed",estimateProvidedAt:"2026-10-24T10:00",approvalBy:"Customer Example",
  approvalAt:"2026-10-24T10:05",approvalMethod:"Written",partsReturn:"Declined",lineItems:[{type:"part",condition:"New OEM"}],
  repairsPerformed:"Replaced front brake pads",approvedAmount:120,completionSigner:""}, {facilityRegistration:"RF123"},120);
 const codes=r.findings.filter(f=>f.level==="required").map(f=>f.code);
 assert.ok(codes.includes("mechanic"));assert.ok(codes.includes("completion-certification"));
});
test("MI checklist never claims independent approval verification",()=>{
 const {MI}=setup();
 const r=MI.check({status:"Completed",estimateProvidedAt:"2026-10-24T10:00",approvalBy:"Example",
 approvalAt:"2026-10-24T10:05",approvalMethod:"Written",partsReturn:"Declined",
 lineItems:[{type:"part",condition:"New OEM"}],repairsPerformed:"Finished work",
 approvedAmount:100,completionSigner:"Supervisor"},
 {facilityRegistration:"R-TEST",technicianName:"Certified Person",mechanicCertificate:"M-TEST"},100);
 assert.equal(r.ready,true);
 assert.ok(r.findings.some(f=>f.code==="records"));
});
