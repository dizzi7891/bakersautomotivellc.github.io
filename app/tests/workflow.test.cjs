/* Automated Garage OS workflow smoke test using a DOM stub; no browser or private data required. */
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
function harness(){
  const events={},elements={},storage={};let printed="",download="";
  function el(id){return elements[id]||(elements[id]={id,innerHTML:"",textContent:"",value:"",open:false,
    classList:{toggle(){return false},add(){},remove(){}},
    addEventListener(){},setAttribute(){},getAttribute(){return""},querySelector(){return null},querySelectorAll(){return[]},
    showModal(){this.open=true},close(){this.open=false},focus(){},click(){},remove(){}});
  }
  const document={
    addEventListener(event,fn){events[event]=fn},
    getElementById:el,
    querySelector(s){return s===".mobile-shade"?el("shade"):null},
    querySelectorAll(){return[]},
    createElement(){return el("anchor"+Math.random())},
    body:{appendChild(){}}
  };
  const window={
    location:{href:""},
    addEventListener(){},
    scrollTo(){},
    open(){return{document:{write(x){printed=x},close(){}}}}
  };
  const localStorage={getItem(k){return storage[k]||null},setItem(k,v){storage[k]=v}};
  class FormDataMock{
    constructor(form){this.fields=form.fields||{}}
    get(k){const v=this.fields[k];return v===undefined?null:Array.isArray(v)?v[0]:v}
    getAll(k){const v=this.fields[k];return v===undefined?[]:Array.isArray(v)?v:[v]}
  }
  class BlobMock{constructor(parts){download=parts.join("")}}
  const context={document,window,localStorage,navigator:{},confirm(){return true},setTimeout(){return 1},clearTimeout(){},
    FormData:FormDataMock,Blob:BlobMock,URL:{createObjectURL(){return"blob:local"},revokeObjectURL(){}}};
  const dir=path.join(__dirname,"..");
  vm.runInNewContext(fs.readFileSync(path.join(dir,"estimate-engine.js"),"utf8"),context,{filename:"estimate-engine.js"});
  vm.runInNewContext(fs.readFileSync(path.join(dir,"app.js"),"utf8"),context,{filename:"app.js"});
  function submit(id,fields){events.submit({target:{id,fields,getAttribute(){return""},reportValidity(){return true}},preventDefault(){}})}
  function click(action,id){events.click({target:{closest(selector){if(selector==="[data-action]")return{getAttribute(k){return k==="data-action"?action:id}};return null}}})}
  function data(){return JSON.parse(storage.bakers_garage_os_v1)}
  return {window,elements,submit,click,data,print:()=>printed,csv:()=>download};
}
test("dashboard initializes and full quote workflow preserves individual line totals",()=>{
  const h=harness();
  assert.match(h.elements.view.innerHTML,/shop|command|overview|customers/i);
  h.submit("form-customer",{name:"QA example",company:"Fictional",phone:"5551230000",email:"qa@example.invalid",type:"Retail"});
  const c=h.data().customers[0];assert.ok(c&&c.id);
  h.submit("form-vehicle",{customerId:c.id,year:"2020",make:"Ford",model:"F-150",plate:"QA",vin:"",mileage:"120000",nextDue:"2026-11-10"});
  const v=h.data().vehicles[0];assert.ok(v&&v.id);
  h.submit("form-job",{
    vehicleId:v.id,title:"Brake service QA",status:"Awaiting Approval",date:"2026-10-24",
    itemType:["labor","part","part"],itemDescription:["Diagnosis","Pads","Rotor"],itemQty:["1.5","2","1"],
    itemUnit:["150","35","100"],itemTax:["exempt","tax","exempt"],discount:"0",
    description:"QA inspection",partsDetails:"Demo only",recommendations:"Follow up",warranty:"Test only"
  });
  const j=h.data().jobs[0];assert.equal(j.lineItems.length,3);
  assert.equal(j.parts,170);assert.equal(j.laborHours,1.5);
  assert.match(h.elements.view.innerHTML,/Awaiting customer decisions/);
  assert.match(h.elements.view.innerHTML,/Maintenance to review/);
  h.click("job-print",j.id);
  assert.match(h.print(),/Pads/);assert.match(h.print(),/Rotor/);assert.match(h.print(),/\$399\.20/);
  h.click("vehicle-history",v.id);
  assert.match(h.elements["dialog-content"].innerHTML,/Brake service QA/);
  h.click("csv-export");
  assert.match(h.csv(),/399\.2/);assert.match(h.csv(),/Work order ID/);
  assert.equal(h.csv().charCodeAt(0),0xFEFF);
});
test("invalid item prices are not persisted",()=>{
  const h=harness();
  h.submit("form-customer",{name:"QA",type:"Retail"});const c=h.data().customers[0];
  h.submit("form-vehicle",{customerId:c.id,year:"2021",make:"Jeep",model:"Wrangler"});const v=h.data().vehicles[0];
  h.submit("form-job",{vehicleId:v.id,title:"Invalid",date:"2026-10-24",status:"Estimate",
    itemType:["part"],itemDescription:["Test"],itemQty:["1"],itemUnit:["-30"],itemTax:["tax"]});
  assert.equal(h.data().jobs.length,0);
});
