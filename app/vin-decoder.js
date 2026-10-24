/* Baker's Garage OS — public NHTSA vPIC VIN decoder.
   No user credentials, government registration data, or owner lookups.
   A decoded VIN is a suggestion only; the technician must verify vehicle specs. */
(function(root){
"use strict";
function normalize(input){return String(input||"").trim().toUpperCase().replace(/[\s-]/g,"")}
function validate(raw){const vin=normalize(raw);if(!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))throw new Error("Enter a valid 17-character VIN (I, O and Q are not used).");return vin}
function value(v){return String(v||"").trim()}
function parse(result){
 const r=result&&result.Results&&result.Results[0];
 if(!r||typeof r!=="object")throw new Error("The VIN service returned no usable vehicle record.");
 const out={
   vin:value(r.VIN),year:value(r.ModelYear),make:value(r.Make),model:value(r.Model),
   trim:value(r.Trim),body:value(r.BodyClass),vehicleType:value(r.VehicleType),
   engine:value(r.EngineModel),cylinders:value(r.EngineCylinders),displacementL:value(r.DisplacementL),
   fuel:value(r.FuelTypePrimary),drive:value(r.DriveType),transmission:value(r.TransmissionStyle),
   series:value(r.Series),plantCountry:value(r.PlantCountry),
   errorText:value(r.ErrorText),errorCode:value(r.ErrorCode),
   provider:"NHTSA vPIC"
 };
 if(out.errorCode&&out.errorCode!=="0")throw new Error("NHTSA flagged the VIN: "+(out.errorText||"Decoder error "+out.errorCode)+". Verify the VIN manually.");
 if(!out.make||!out.model||!/^\d{4}$/.test(out.year))throw new Error("VIN lookup returned incomplete year/make/model data; enter details manually.");
 return out;
}
async function decode(input){
 const vin=validate(input);
 // Public NHTSA endpoint intentionally has no secret key; do not transmit plate, name or other customer data.
 const url="https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/"+encodeURIComponent(vin)+"?format=json";
 const controller=typeof AbortController!=="undefined"?new AbortController():null;
 const timer=controller?setTimeout(()=>controller.abort(),13000):null;
 try{
   const res=await fetch(url,controller?{signal:controller.signal,headers:{"Accept":"application/json"}}:{headers:{"Accept":"application/json"}});
   if(!res.ok)throw new Error("VIN service returned HTTP "+res.status);
   const payload=await res.json();
   return Object.assign(parse(payload),{vin});
 }catch(err){
   if(err&&err.name==="AbortError")throw new Error("VIN lookup timed out. Verify your connection or enter vehicle details manually.");
   throw err;
 }finally{if(timer)clearTimeout(timer)}
}
root.BakersVIN=Object.freeze({normalize,validate,parse,decode});
})(window);