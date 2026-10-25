const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
function read(p){return fs.readFileSync(path.join(root,p),"utf8")}
test("the approved original Baker's brand image is a real optimized AVIF asset",()=>{
 const buf=fs.readFileSync(path.join(root,"assets/approved-bakers-brand-board.avif"));
 assert.ok(buf.length>10000,"Brand asset missing or suspiciously short");
 assert.ok(buf.length<200000,"Brand asset too large for mobile");
 assert.equal(buf.toString("ascii",4,12),"ftypavif");
});
test("actual approved artwork is on the website, FleetCare and B2B pages",()=>{
 for(const p of ["index.html","fleet-services.html","garage-os-for-shops.html"]){
  const html=read(p);
  assert.match(html,/assets\/approved-art\.css/);
  assert.match(html,/assets\/approved-bakers-brand-board\.avif/);
 }
 assert.match(read("index.html"),/approved-crop--bakers/);
 assert.match(read("index.html"),/approved-crop--fleet/);
 assert.match(read("fleet-services.html"),/approved-crop--van/);
});
test("Garage OS uses the same approved artwork without changing local-first security wording",()=>{
 const html=read("app/index.html"),js=read("app/app.js"),sw=read("app/sw.js");
 assert.match(html,/\.\.\/assets\/approved-art\.css/);
 assert.match(js,/approved-crop--bakers/);
 assert.match(js,/approved-crop--van/);
 assert.match(js,/\.\.\/assets\/approved-bakers-brand-board\.avif/);
 assert.match(js,/No account login, cloud synchronization or automatic backups/);
 assert.match(sw,/bakers-garage-os-v8/);
 assert.match(sw,/approved-bakers-brand-board\.avif/);
 assert.match(sw,/approved-art\.css/);
});
test("branding content is not passed off as an actual Baker's shop or vehicle",()=>{
 const web=read("fleet-services.html"),app=read("app/app.js");
 assert.match(web,/not a photograph of a Baker’s vehicle or facility/i);
 assert.match(app,/not a photograph of a Baker’s vehicle or shop/i);
 assert.doesNotMatch(read("index.html"),/Madison Heights/);
 assert.match(read("index.html"),/33860 Groesbeck Hwy/);
 assert.match(read("index.html"),/586-843-4157/);
});
