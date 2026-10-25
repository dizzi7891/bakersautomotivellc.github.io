const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base=path.resolve(__dirname,"..");
function read(p){return fs.readFileSync(path.join(base,p),"utf8")}
test("main and FleetCare emblems contain no tiny captions overlapping important text",()=>{
 const main=read("assets/bakers-crest-v2.svg");
 const fleet=read("assets/fleetcare-crest-v2.svg");
 assert.match(main,/>BAKER’S<\/text>/);
 assert.match(main,/>AUTOMOTIVE REPAIR<\/text>/);
 assert.match(main,/>LLC<\/text>/);
 assert.doesNotMatch(main,/font-size="(?:[1-9]|1[0-9]|2[0-9])"/);
 assert.match(fleet,/>BAKER’S<\/text>/);
 assert.match(fleet,/>FLEETCARE<\/text>/);
 assert.doesNotMatch(fleet,/COMMERCIAL VEHICLE SERVICE/);
 assert.doesNotMatch(fleet,/font-size="(?:[1-9]|1[0-9]|2[0-9])"/);
});
test("site loads refreshed crests and compact header symbol",()=>{
 for(const p of ["index.html","fleet-services.html","garage-os-for-shops.html"]){
  const h=read(p);
  assert.match(h,/assets\/legibility\.css/);
  assert.match(h,/assets\/bakers-mark\.svg/);
  assert.doesNotMatch(h,/src="assets\/bakers-crest\.svg"/);
  assert.doesNotMatch(h,/src="assets\/fleetcare-crest\.svg"/);
 }
 const h=read("index.html");
 assert.match(h,/src="assets\/bakers-crest-v2\.svg"/);
 assert.match(h,/src="assets\/fleetcare-crest-v2\.svg"/);
});
test("updated vector files are standard self-contained SVGs",()=>{
 for(const p of ["assets/bakers-crest-v2.svg","assets/fleetcare-crest-v2.svg","assets/bakers-mark.svg"]){
  const svg=read(p);
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/<\/svg>$/);
  assert.match(svg,/<title[^>]*>.+<\/title>/);
  assert.doesNotMatch(svg,/<image\b|href="https?:\/\//i);
 }
});
