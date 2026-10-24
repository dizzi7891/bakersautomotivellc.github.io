/* Michigan repair-record readiness checks, not a certification of legal compliance.
   Source: Michigan SOS Repair Facility Manual / Motor Vehicle Service and Repair Act.
   Always review current law and use an authenticated consent archive in production. */
(function(root){
"use strict";
const ACTIVE=["In Progress","Completed","Paid"],FINAL=["Completed","Paid"];
function str(s){return String(s==null?"":s).trim()}
function amount(x){const v=Number(x);return Number.isFinite(v)&&v>=0?v:null}
function check(job,prefs,total){
 const j=job||{},p=prefs||{},out=[];
 function add(level,code,message){out.push({level,code,message})}
 const totalCost=amount(total);
 if(!str(p.facilityRegistration))add("required","facility-registration","Enter Michigan repair facility registration number in Settings for every public-facing repair document.");
 if(totalCost===null)add("required","amount","Estimate total is invalid or missing.");
 if(j.status==="Estimate"||j.status==="Awaiting Approval"){
   add("review","pre-repair","Provide a written estimate (generally required at $50 or more) or a legally valid waiver before repairs begin.");
 }else if(ACTIVE.includes(j.status)){
   if(totalCost>=50&&!str(j.estimateProvidedAt))add("required","estimate-delivery","Record delivery of the initial written estimate, or a valid waiver, before repair.");
   if(!str(j.approvalBy)||!str(j.approvalAt)||!str(j.approvalMethod))add("required","approval","Record customer authorization: full name, method, time and agreed amount.");
   if((str(j.estimateDelivery)==="Electronic"||str(j.approvalMethod)==="Electronic")&&!j.electronicConsent)add("required","electronic-consent","Record customer consent to receive estimates electronically or provide a paper estimate.");
 }
 const original=amount(j.approvedAmount);
 if(ACTIVE.includes(j.status)&&original!==null&&totalCost!==null&&original>0){
   const allowance=Math.min(original*.1,50);
   if(totalCost-original>allowance+0.001&&!str(j.supplementApprovalAt)){
     add("required","amended-estimate","Current total exceeds the approved estimate beyond the 10% / $50 limit; document additional authorization before extra work.");
   }
 }
 const items=Array.isArray(j.lineItems)?j.lineItems:[];
 if(items.some(l=>l&&l.type==="part"&&!str(l.condition)) || (!items.length && Number(j.parts)>0))add("required","parts-condition","Specify whether each replacement part is new OEM, new aftermarket, OEM surplus, used, rebuilt or reconditioned.");
 if(FINAL.includes(j.status)){
   if(!str(p.technicianName)||!str(p.mechanicCertificate))add("required","mechanic","Enter the diagnosing/repairing mechanic's name and Michigan certificate number.");
   if(!str(j.completionSigner))add("required","completion-certification","Final invoices require facility-owner/designee certification or an explanation of incomplete repairs, signed by the responsible person.");
   if(!str(j.repairsPerformed))add("required","work-performed","Describe the repairs actually performed on the final invoice.");
 }
 if(!str(j.partsReturn))add("review","parts-return","Confirm whether the customer requested return of replaced parts and document any exceptions.");
 add("info","records","Maintain legally required records and authorization evidence; the current browser-only prototype is not a tamper-evident compliance archive.");
 return {ready:!out.some(x=>x.level==="required"),findings:out,checkedAt:new Date().toISOString()};
}
root.BakersMICompliance=Object.freeze({check,version:"MI-2026-10"});
})(window);