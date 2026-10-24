/* Baker's Automotive customer inquiry formatter.
   No stored customer data. No network calls. Prepares text/email drafts only.
   The visitor MUST press Send in their messaging/email application.
*/
(function(root){
"use strict";
const PHONE="+15868434157", EMAIL="bakersauto2020@gmail.com";
function clean(value){
  return String(value===undefined||value===null?"":value)
    .replace(/\r/g,"").replace(/\u0000/g,"").trim();
}
function prepare(topic,fields){
  const title=clean(topic||"Repair estimate request").slice(0,120);
  if(!Array.isArray(fields)||!fields.length)throw Error("Please complete the required fields.");
  const details=fields
    .filter(x=>x&&clean(x[0]))
    .map(x=>clean(x[0]).slice(0,90)+": "+clean(x[1]).slice(0,2500));
  if(!details.length)throw Error("Please enter your request details.");
  return "Baker's Automotive Repair LLC\n"+title+"\n\n"+details.join("\n");
}
function smsUrl(message,ios){
  // RFC 5724 standard uses ?body=; the iOS Messages app commonly needs &body=.
  return "sms:"+PHONE+(ios?"&body=":"?body=")+encodeURIComponent(message);
}
function mailtoUrl(topic,message){
  return "mailto:"+EMAIL+"?subject="+encodeURIComponent("Baker's Automotive — "+clean(topic))+
   "&body="+encodeURIComponent(message);
}
root.BakersIntake=Object.freeze({prepare,smsUrl,mailtoUrl,phone:PHONE,email:EMAIL,smsMaxLength:950});
})(window);