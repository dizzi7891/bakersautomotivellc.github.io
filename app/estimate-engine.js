/* Baker's Garage OS — precise line-item estimation core (no network requests).
   Work in integer cents; immutable validation; retain compatibility with legacy orders. */
(function(root){
"use strict";
const MAX_ROWS=120, MAX_PRICE=1000000, MAX_QTY=10000;
function cents(v){const n=Number(v);if(!Number.isFinite(n)||n<0||n>MAX_PRICE)throw new Error("Invalid nonnegative price");return Math.round((n+Number.EPSILON)*100)}
function money(c){return Math.round(c)/100}
function number(v,max){const n=Number(v);if(!Number.isFinite(n)||n<0||n>max)throw new Error("Invalid quantity");return n}
function safeLine(x,i){
  if(!x||typeof x!=="object")throw new Error("Invalid line "+(i+1));
  const type=String(x.type||"").toLowerCase().trim();
  if(!["labor","part","fee"].includes(type))throw new Error("Choose labor, part or fee for line "+(i+1));
  const description=String(x.description||"").trim();
  if(!description||description.length>300)throw new Error("Enter a description for line "+(i+1));
  const qty=number(x.qty,MAX_QTY);
  if(qty===0)throw new Error("Quantity must be greater than zero on line "+(i+1));
  const unitPrice=money(cents(x.unitPrice));
  const taxable=type==="part" ? x.taxable!==false&&x.taxable!=="false" : false;
  const condition=type==="part"?String(x.condition||"").slice(0,50):"";
  return {id:String(x.id||"line-"+(i+1)),type,description,qty,unitPrice,taxable,condition};
}
function legacyLines(job){
  const j=job||{},arr=[];
  if(Number(j.laborHours)>0)arr.push({id:"legacy-labor",type:"labor",description:String(j.title||"Labor service").slice(0,300),qty:Number(j.laborHours),unitPrice:Number(j.rate||0),taxable:false});
  if(Number(j.parts)>0)arr.push({id:"legacy-parts",type:"part",description:String(j.partsDetails||"Parts subtotal").slice(0,300),qty:1,unitPrice:Number(j.parts),taxable:true});
  return arr;
}
function linesFor(job){return Array.isArray(job&&job.lineItems) && job.lineItems.length ? job.lineItems : legacyLines(job)}
function calculate(job,taxRate){
  const source=linesFor(job),rate=number(taxRate,100);
  if(source.length>MAX_ROWS)throw new Error("Too many line items");
  const lines=source.map(safeLine);
  let labor=0,parts=0,fees=0,taxableParts=0;
  const enriched=lines.map((l)=>{
    const rowCents=Math.round((cents(l.unitPrice)*l.qty)+Number.EPSILON);
    if(!Number.isSafeInteger(rowCents))throw new Error("Line exceeds safe amount");
    if(l.type==="labor")labor+=rowCents;
    else if(l.type==="part"){parts+=rowCents;if(l.taxable)taxableParts+=rowCents;}
    else fees+=rowCents;
    return Object.assign({},l,{amount:money(rowCents)});
  });
  const discountCents=cents((job&&job.discount)||0);
  const subtotal=labor+parts+fees;
  if(discountCents>subtotal)throw new Error("Discount exceeds subtotal");
  // Item-level Michigan parts tax only. Fixed discounts reduce pre-tax total but do not
  // reduce taxable parts without an explicitly allocated, verified tax policy.
  const taxCents=Math.round(taxableParts*rate/100);
  const total=subtotal-discountCents+taxCents;
  if(!Number.isSafeInteger(total))throw new Error("Total exceeds safe amount");
  return {lines:enriched,labor:money(labor),parts:money(parts),fees:money(fees),taxableParts:money(taxableParts),
   discount:money(discountCents),subtotal:money(subtotal),tax:money(taxCents),total:money(total)};
}
root.BakersEstimateEngine=Object.freeze({calculate,legacyLines,linesFor,maxRows:MAX_ROWS});
})(window);