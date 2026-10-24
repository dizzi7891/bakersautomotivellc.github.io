/* Baker's public website — responsive navigation and footer utilities.
   Lead-intake actions live in assets/intake.js. */
(()=>{
"use strict";
const button=document.querySelector("[data-menu-button]"),nav=document.querySelector("[data-navlinks]");
function closeNav(){
 if(!button||!nav)return;
 nav.classList.remove("open");
 button.setAttribute("aria-expanded","false");
 button.textContent="Menu ☰";
}
if(button&&nav){
 button.addEventListener("click",()=>{
   const open=nav.classList.toggle("open");
   button.setAttribute("aria-expanded",String(open));
   button.textContent=open?"Close ✕":"Menu ☰";
 });
 nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeNav));
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeNav()});
 document.addEventListener("click",e=>{
   if(!nav.contains(e.target)&&!button.contains(e.target))closeNav()
 });
}
document.querySelectorAll("[data-year]").forEach(x=>x.textContent=String(new Date().getFullYear()));
})();