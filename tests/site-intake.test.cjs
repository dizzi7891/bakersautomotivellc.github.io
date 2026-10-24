const {test}=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
function core(){
 const window={};
 const c={window,encodeURIComponent,Error,Array,String,Object};
 vm.runInNewContext(fs.readFileSync(path.join(root,"assets/intake-core.js"),"utf8"),c,{filename:"intake-core.js"});
 return window.BakersIntake;
}
test("customer estimate can be prepared for texting without a server",()=>{
 const i=core(),msg=i.prepare("Repair estimate request",[
 ["Name","Sam Example"],["Phone","(555) 010-1234"],
 ["Vehicle","2018 Ford F-150"],["Problem description","Brakes grinding, check front rotors"]
 ]);
 assert.match(msg,/Sam Example/);
 assert.match(msg,/2018 Ford F-150/);
 assert.match(msg,/Brakes grinding/);
 const link=i.smsUrl(msg,false);
 assert.match(link,/^sms:\+15868434157\?body=/);
 assert.ok(link.includes(encodeURIComponent("Brakes grinding")));
});
test("the same request can be prepared as email, not sent automatically",()=>{
 const i=core(),body=i.prepare("FleetCare consultation request",[["Business","Example Fleet"],["Vehicles","5 vans"]]);
 const link=i.mailtoUrl("FleetCare consultation request",body);
 assert.match(link,/^mailto:bakersauto2020@gmail\.com\?subject=/);
 assert.ok(link.includes(encodeURIComponent("Example Fleet")));
});
test("iOS fallback uses the supported SMS body separator",()=>{
 const i=core();
 assert.match(i.smsUrl("Test",true),/^sms:\+15868434157&body=Test$/);
});
test("input formatter rejects empty or nameless requests",()=>{
 const i=core();
 assert.throws(()=>i.prepare("Repair",[]),/required fields/);
 assert.throws(()=>i.prepare("Repair",[["", "something"]]),/details/);
});
test("formatting removes carriage returns and handles punctuation safely",()=>{
 const i=core();
 assert.equal(i.prepare("Quote\r", [["Notes","brake pads\r\nplease"]]),"Baker's Automotive Repair LLC\nQuote\n\nNotes: brake pads\nplease");
 const link=i.smsUrl("Would you check a 2012 F-150? <test>",false);
 assert.ok(link.includes("%3F"));
 assert.ok(link.includes("%3Ctest%3E"));
});
test("all public request pages use the same connected CSS and JS in correct order",()=>{
 for(const filename of ["index.html","fleet-services.html","garage-os-for-shops.html"]){
   const html=fs.readFileSync(path.join(root,filename),"utf8");
   assert.ok(html.includes('assets/intake.css'),filename+" missing CSS");
   assert.ok(html.includes('data-email-draft'),filename+" missing form");
   const a=html.indexOf('src="assets/site.js"'),b=html.indexOf('src="assets/intake-core.js"'),c=html.indexOf('src="assets/intake.js"');
   assert.ok(a!==-1&&b>a&&c>b,filename+" needs correct JS loading order");
 }
});
test("intake UI never claims a message has been sent without the visitor sending",()=>{
 const js=fs.readFileSync(path.join(root,"assets/intake.js"),"utf8");
 assert.match(js,/website has NOT sent it/);
 assert.match(js,/Press Send/);
 assert.doesNotMatch(js,/fetch\(/);
 assert.doesNotMatch(js,/XMLHttpRequest/);
 new vm.Script(js);
});
