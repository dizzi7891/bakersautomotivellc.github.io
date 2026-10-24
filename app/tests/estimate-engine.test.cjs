/* Automated financial-core regression tests. Run: node --test app/tests/estimate-engine.test.cjs */
const {test}=require("node:test");
const assert=require("node:assert/strict");
global.window=global;
require("../estimate-engine.js");
const E=global.BakersEstimateEngine;
function line(type,description,qty,unitPrice,taxable){return{type,description,qty,unitPrice,taxable}}
test("itemized repair combines labor, taxable and exempt parts",()=>{
 const t=E.calculate({lineItems:[line("labor","Diagnose brakes",1.5,150,false),line("part","Pads",2,35,true),line("part","Rotor",1,100,false)]},6);
 assert.equal(t.labor,225);assert.equal(t.parts,170);assert.equal(t.taxableParts,70);assert.equal(t.tax,4.20);assert.equal(t.total,399.20);
});
test("old jobs retain existing labor+parts total after upgrade",()=>{
 assert.equal(E.calculate({title:"Legacy job",laborHours:2,rate:150,parts:650},6).total,989);
});
test("parts-only tax is computed on subtotal, not per row",()=>{
 const t=E.calculate({lineItems:[line("part","Tiny part A",1,.29,true),line("part","Tiny part B",1,.29,true)]},6);
 assert.equal(t.parts,.58);assert.equal(t.tax,.03);assert.equal(t.total,.61);
});
test("tax-exempt parts do not accumulate sales tax",()=>{
 const t=E.calculate({lineItems:[line("part","Non-taxable item",1,80,false),line("labor","Install",2,100,false)]},6);
 assert.equal(t.tax,0);assert.equal(t.total,280);
});
test("fees do not receive parts sales tax",()=>{
 const t=E.calculate({lineItems:[line("fee","Shop service fee",1,12,false)]},6);
 assert.equal(t.tax,0);assert.equal(t.total,12);
});
test("fixed discount is reflected without negative balance",()=>{
 const t=E.calculate({lineItems:[line("labor","Labor",2,150,false)],discount:40},6);
 assert.equal(t.subtotal,300);assert.equal(t.total,260);
 assert.throws(()=>E.calculate({lineItems:[line("labor","Labor",1,100,false)],discount:101},6),/Discount exceeds subtotal/);
});
test("numeric invalid entries are rejected and never silently billed",()=>{
 assert.throws(()=>E.calculate({lineItems:[line("part","Part",1,-10,true)]},6),/Invalid nonnegative price/);
 assert.throws(()=>E.calculate({lineItems:[line("part","Part",-2,50,true)]},6),/Invalid quantity/);
 assert.throws(()=>E.calculate({lineItems:[line("part","Part",0,50,true)]},6),/Quantity must be greater/);
 assert.throws(()=>E.calculate({lineItems:[line("part","",2,50,true)]},6),/description/);
 assert.throws(()=>E.calculate({lineItems:[line("service","Invalid",1,50,true)]},6),/Choose labor/);
});
test("source lines are not mutated",()=>{
 const orig={lineItems:[line("part","Part",1,20,true)]};
 const json=JSON.stringify(orig);
 E.calculate(orig,6);
 assert.equal(JSON.stringify(orig),json);
});
test("unreasonably large work orders are rejected",()=>{
 const lines=Array.from({length:121},(_,i)=>line("part","Part "+i,1,1,true));
 assert.throws(()=>E.calculate({lineItems:lines},6),/Too many/);
});
test("default taxable interpretation applies to parts, never labor",()=>{
 const t=E.calculate({lineItems:[line("part","Part",1,100,undefined),line("labor","Labor",1,200,true)]},6);
 assert.equal(t.tax,6);assert.equal(t.total,306);
});
