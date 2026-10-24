/* Baker's Automotive — functional static-site customer intake.
   Opens native Messages/email with drafted details; does not claim to submit.
*/
(()=>{
"use strict";
const core=window.BakersIntake;
if(!core)return;
const ios=/iPad|iPhone|iPod/i.test(navigator.userAgent||"") ||
 (navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function preview(form,message){
 const p=form.querySelector(".intake-preview"),field=form.querySelector(".intake-preview textarea");
 if(p&&field){field.value=message;p.hidden=false;}
}
function state(form,message,problem){
 const p=form.querySelector('[role="status"]');
 if(p){p.textContent=message;p.classList.toggle("intake-warning",!!problem);}
}
function request(form){
 if(!form.reportValidity())return null;
 const topic=form.getAttribute("data-email-draft")||"Service inquiry";
 const message=core.prepare(topic,Array.from(new FormData(form).entries()));
 preview(form,message);
 return {topic,message};
}
async function copyRequest(form){
 const d=request(form);if(!d)return;
 try{
   if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error("No clipboard");
   await navigator.clipboard.writeText(d.message);
   state(form,"Request copied. Paste it into a text or email to "+core.phone+". Nothing has been sent.");
 }catch(e){
   const field=form.querySelector(".intake-preview textarea");
   if(field){field.focus();field.select();}
   state(form,"Your request is shown above. Select and copy the text manually, or use Email.",true);
 }
}
function emailRequest(form){
 const d=request(form);if(!d)return;
 state(form,"Your email app should open with your details. Press Send there to contact Baker's.");
 window.location.href=core.mailtoUrl(d.topic,d.message);
}
function textRequest(form){
 const d=request(form);if(!d)return;
 if(d.message.length>core.smsMaxLength){
   state(form,"This request is too long for reliable text-message links. Choose Email or Copy Details instead.",true);
   return;
 }
 state(form,"Your Messages app should open with your request. Press Send there; the website has NOT sent it.");
 window.location.href=core.smsUrl(d.message,ios);
}
document.querySelectorAll("form[data-email-draft]").forEach(form=>{
 const original=form.querySelector('button[type="submit"]');
 if(!original)return;
 const wrapper=document.createElement("div");
 wrapper.className="intake-actions";
 const email=document.createElement("button");
 email.type="button";email.className="btn outline intake-email";email.textContent="Email request ↗";
 const copy=document.createElement("button");
 copy.type="button";copy.className="intake-copy";copy.textContent="Copy details";
 original.parentNode.insertBefore(wrapper,original);
 wrapper.append(original,email,copy);
 original.textContent="Text my request ↗";
 original.classList.add("intake-primary");
 const info=document.createElement("div");
 info.className="intake-preview";info.hidden=true;
 const label=document.createElement("label");label.className="intake-preview-label";
 label.textContent="Request prepared — review before sending";
 const textarea=document.createElement("textarea");
 textarea.readOnly=true;textarea.rows=7;textarea.setAttribute("aria-label","Your prepared customer request");
 const help=document.createElement("p");
 help.textContent="Your details remain in this browser until you choose Text, Email or Copy. Press Send in the messaging app to contact the shop.";
 info.append(label,textarea,help);
 wrapper.insertAdjacentElement("afterend",info);
 const status=form.querySelector('[role="status"]');
 if(status)status.textContent="Choose Text, Email or Copy. This site only prepares your request; you must send it yourself.";
 form.addEventListener("submit",e=>{e.preventDefault();textRequest(form)});
 email.addEventListener("click",()=>emailRequest(form));
 copy.addEventListener("click",()=>{void copyRequest(form)});
});
/* Sticky mobile actions stay available without collecting visitor data. */
if(document.body&&!document.querySelector(".mobile-contact-bar")){
 const bar=document.createElement("nav");
 bar.className="mobile-contact-bar";bar.setAttribute("aria-label","Quick contact Baker's Automotive");
 const call=document.createElement("a");
 call.href="tel:"+core.phone;call.textContent="Call Baker's";call.className="mobile-contact-call";
 const text=document.createElement("a");
 text.href="sms:"+core.phone;text.textContent="Text Baker's";text.className="mobile-contact-text";
 bar.append(call,text);document.body.append(bar);
}
})();