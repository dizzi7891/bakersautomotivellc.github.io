const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base=path.resolve(__dirname,"..");
const pages=["index.html","fleet-services.html","garage-os-for-shops.html"];
function hasId(html,id){
 const found=[...html.matchAll(/\bid\s*=\s*(["'])([^"']+)\1/g)];
 return found.some(match=>match[2]===id);
}
test("all public internal links and graphic sources resolve",()=>{
 for(const page of pages){
  const html=fs.readFileSync(path.join(base,page),"utf8");
  const attr=/\b(?:href|src)\s*=\s*(["'])(.*?)\1/g;
  let match;
  while((match=attr.exec(html))!==null){
   const link=match[2].replace(/&amp;/g,"&");
   if(!link||/^(?:mailto:|sms:|tel:|https?:|data:|javascript:)/i.test(link))continue;
   if(link.startsWith("#")){
    assert.ok(hasId(html,link.slice(1)),page+": no anchor "+link);
    continue;
   }
   const file=link.split("?")[0].split("#")[0];
   if(!file)continue;
   const resolved=path.resolve(path.dirname(path.join(base,page)),file);
   assert.ok(resolved.startsWith(base),page+": external-looking asset path "+link);
   assert.ok(fs.existsSync(resolved),page+": missing asset/link "+link);
  }
 }
});
test("public pages use real business contact information and no fake photos",()=>{
 for(const page of pages){
  const html=fs.readFileSync(path.join(base,page),"utf8");
  assert.ok(html.includes("586-843-4157"),page+": phone missing");
  assert.ok(html.includes("bakersauto2020@gmail.com"),page+": email missing");
  assert.ok(!html.includes("images.unsplash.com"),page+": unverified stock image used");
 }
});
test("CSS background ornament assets resolve",()=>{
 for(const file of ["assets/filigree-edition.css","assets/brand-layout.css","assets/intake.css"]){
  const css=fs.readFileSync(path.join(base,file),"utf8");
  const re=/url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  let m;
  while((m=re.exec(css))!==null){
   if(/^(?:data:|https?:)/.test(m[2]))continue;
   const resolved=path.resolve(path.dirname(path.join(base,file)),m[2].split("?")[0]);
   assert.ok(fs.existsSync(resolved),file+": missing local asset "+m[2]);
  }
 }
});
