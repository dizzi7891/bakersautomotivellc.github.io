(function(){
'use strict';
var KEY='bakers_garage_os_v1';
var checkNames=['Tires & tire pressure','Brakes','Steering & suspension','Exterior lights','Battery & charging','Fluid levels','Fluid leaks','Windshield & wipers','Belts & hoses','Exhaust & underbody'];
var pageNames={dashboard:'Command overview',customers:'Customer directory',vehicles:'Vehicle registry',jobs:'Work order board',inspections:'Inspection records',fleet:'FleetCare accounts',reports:'Business reporting',compliance:'Michigan compliance',settings:'Settings & backup'};
var currentPage='dashboard',query='';
function byId(id){return document.getElementById(id)}
function today(){var x=new Date();return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')}
function uid(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)}
function fresh(){return{version:1,customers:[],vehicles:[],jobs:[],inspections:[],prefs:{laborRate:150,foreignLaborRate:175,taxRate:6,fleetRate:49,facilityRegistration:'',mechanicCertificate:'',technicianName:'Michael Baker',signerName:''}}}
function restore(){try{var a=JSON.parse(localStorage.getItem(KEY)||'null');if(!a||a.version!==1||!Array.isArray(a.customers)||!Array.isArray(a.vehicles)||!Array.isArray(a.jobs)||!Array.isArray(a.inspections))return fresh();a.prefs=Object.assign(fresh().prefs,a.prefs||{});return a}catch(e){return fresh()}}
var state=restore();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){notify('Storage full or unavailable. Please export a backup.');return false}}
function esc(a){return String(a===undefined||a===null?'':a).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function n(v){var x=Number(v);return Number.isFinite(x)?Math.max(0,x):0}
function fixed(v){return Math.round(n(v)*100)/100}
function cash(a){return fixed(a).toLocaleString('en-US',{style:'currency',currency:'USD'})}
function nameCustomer(id){var a=state.customers.find(function(x){return x.id===id});return a?(a.company||a.name):'Unassigned'}
function getCustomer(id){return state.customers.find(function(x){return x.id===id})}
function getVehicle(id){return state.vehicles.find(function(x){return x.id===id})}
function vehicleName(v){return v?[v.year,v.make,v.model].filter(Boolean).join(' ')+' '+(v.plate?'· '+v.plate:''):'Unknown vehicle'}
function vehicleCustomer(id){var v=getVehicle(id);return v?v.customerId:''}
function totalFor(j){
  try{return window.BakersEstimateEngine.calculate(j,n(state.prefs.taxRate));}
  catch(e){return {lines:[],labor:0,parts:0,fees:0,taxableParts:0,discount:0,subtotal:0,tax:0,total:0,error:String(e&&e.message||e)}}
}
function dueSoon(v){if(!v.nextDue)return false;var diff=(new Date(v.nextDue+'T12:00:00')-new Date(today()+'T12:00:00'))/86400000;return diff<=30}
function counts(){var paid=state.jobs.filter(function(j){return j.status==='Paid'}),active=state.jobs.filter(function(j){return j.status!=='Paid'&&j.status!=='Cancelled'});return{paid:paid.reduce(function(s,j){return s+totalFor(j).total},0),open:active.reduce(function(s,j){return s+totalFor(j).total},0),due:state.vehicles.filter(dueSoon).length,fleet:state.vehicles.filter(function(v){var c=getCustomer(v.customerId);return c&&c.type==='Fleet'}).length}}
function status(s){var c=s==='Paid'?'paid':s==='Completed'?'done':s==='In Progress'?'progress':s==='Awaiting Approval'?'awaiting':s==='Attention'?'attention':'',label=esc(s||'Estimate');return '<span class="tag '+c+'">'+label+'</span>'}
function textMatch(a){return !query||String(a).toLowerCase().includes(query.toLowerCase())}
function pageIntro(eyebrow,title,description,button){return '<div class="view-intro"><div><span class="eyebrow">'+eyebrow+'</span><h1>'+title+'</h1><p class="lede">'+description+'</p></div>'+(button||'')+'</div>'}
function metric(label,value,foot,gold){return '<div class="metric '+(gold?'gold':'')+'"><div class="m-label">'+label+'</div><div class="m-value">'+value+'</div><div class="m-foot">'+foot+'</div></div>'}
function empty(title,copy,action){return '<div class="empty"><div class="symbol">◇</div><b>'+title+'</b><p>'+copy+'</p>'+(action||'')+'</div>'}
function toolbar(placeholder,button){return '<div class="toolbar"><div class="left"><input data-search type="search" aria-label="Search records" placeholder="'+esc(placeholder)+'" value="'+esc(query)+'"></div>'+button+'</div>'}
function emptyRecords(){return state.customers.length+state.vehicles.length+state.jobs.length+state.inspections.length===0}
function topJobs(limit){return state.jobs.slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))}).slice(0,limit)}

function renderTodayQueue(){
  var pending=state.jobs.filter(function(j){return j.status==="Awaiting Approval"}).slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date))}).slice(0,7);
  var due=state.vehicles.filter(dueSoon).slice().sort(function(a,b){return String(a.nextDue).localeCompare(String(b.nextDue))}).slice(0,7);
  function jobRow(j){return '<li><div><strong>'+esc(j.title)+'</strong><small>'+esc(vehicleName(getVehicle(j.vehicleId)))+' · '+cash(totalFor(j).total)+'</small></div><button class="text-btn" data-action="job-edit" data-id="'+esc(j.id)+'">Review →</button></li>'}
  function vehicleRow(v){return '<li><div><strong>'+esc(vehicleName(v))+'</strong><small>'+esc(nameCustomer(v.customerId))+' · Due '+esc(v.nextDue)+'</small></div><button class="text-btn" data-action="vehicle-history" data-id="'+esc(v.id)+'">History →</button></li>'}
  return '<div class="board-grid" style="margin-top:18px">'+
    '<div class="panel"><div class="panel-head"><h2>Awaiting customer decisions</h2><small>'+pending.length+' shown</small></div>'+
    (pending.length?'<ul class="list-simple">'+pending.map(jobRow).join("")+'</ul>':'<p class="lede">Nothing is awaiting approval in this workspace.</p>')+'</div>'+
    '<div class="panel"><div class="panel-head"><h2>Maintenance to review</h2><small>Next 30 days / overdue</small></div>'+
    (due.length?'<ul class="list-simple">'+due.map(vehicleRow).join("")+'</ul>':'<p class="lede">No upcoming maintenance dates recorded.</p>')+'</div></div>';
}

function renderDashboard(){var c=counts(),recent=topJobs(6);return pageIntro('SHOP / LIVE OVERVIEW','An elevated view of your shop.','Every customer, vehicle, inspection and work order — organized with clarity and purpose.','<button class="gold-btn" data-action="quick-add">+ Create record</button>')+'<div class="banner"><div><b>Local-only workspace</b><p>This version stores records on this device only. No account login, cloud synchronization or automatic backups. Keep regular exports and avoid using this as your only customer record.</p></div><button data-action="export">Export backup</button></div>'+
'<div class="metrics">'+metric('Customers',state.customers.length,'Retail & fleet accounts')+metric('Vehicles',state.vehicles.length,c.due+' with next-service dates due',false)+metric('Open work value',cash(c.open),'Unpaid, non-cancelled job estimates',true)+metric('Marked paid',cash(c.paid),'Total of work orders marked paid')+'</div>'+
'<div class="board-grid"><div class="panel"><div class="panel-head"><h2>Recent work orders</h2><button class="text-btn" data-page="jobs">View all →</button></div>'+(recent.length?'<ul class="list-simple">'+recent.map(function(j){return '<li><div><strong>'+esc(j.title)+'</strong><small>'+esc(vehicleName(getVehicle(j.vehicleId)))+' · '+esc(j.date)+'</small></div><div style="text-align:right">'+status(j.status)+'<small>'+cash(totalFor(j).total)+'</small></div></li>'}).join('')+'</ul>':empty('Nothing on the board yet','Create your first customer, then a vehicle and work order.','<button class="gold-btn" data-action="customer-new">Add customer</button>'))+'</div>'+
'<div class="panel"><div class="panel-head"><h2>Quick actions</h2></div><div class="quick-grid"><button class="quick-card" data-action="customer-new"><span>♧</span>Add customer</button><button class="quick-card" data-action="vehicle-new"><span>▤</span>Add vehicle</button><button class="quick-card" data-action="job-new"><span>▥</span>New work order</button><button class="quick-card" data-action="inspection-new"><span>☑</span>New inspection</button></div><div style="margin-top:18px" class="board-note">For your first look, use <button class="text-btn" data-action="demo">Load fictional example records</button>. They are labeled as examples and are not real customers.</div></div></div>'+renderTodayQueue()}

function renderCustomers(){var rows=state.customers.filter(function(c){return textMatch([c.name,c.company,c.phone,c.email,c.type].join(' '))});return pageIntro('RELATIONSHIPS / DIRECTORY','Every relationship, valued.','Keep commercial and retail customer details organized.','<button class="gold-btn" data-action="customer-new">+ Add customer</button>')+
toolbar('Search customer, business, phone...', '<button class="ghost-btn" data-action="export">↓ Backup</button>')+(rows.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Customer / business</th><th>Type</th><th>Contact</th><th>Vehicles</th><th>Actions</th></tr></thead><tbody>'+rows.map(function(c){return '<tr><td><strong>'+esc(c.name)+'</strong><small>'+esc(c.company||'Individual customer')+'</small></td><td><span class="tag '+(c.type==='Fleet'?'fleet':'')+'">'+esc(c.type)+'</span></td><td>'+esc(c.phone||'—')+'<br><small>'+esc(c.email||'')+'</small></td><td>'+state.vehicles.filter(function(v){return v.customerId===c.id}).length+'</td><td><div class="row-actions"><button data-action="customer-edit" data-id="'+esc(c.id)+'">Edit</button><button data-action="customer-delete" data-id="'+esc(c.id)+'">Delete</button></div></td></tr>'}).join('')+'</tbody></table></div>':empty('No matching customers','Add a customer or change the search terms.','<button class="gold-btn" data-action="customer-new">Add customer</button>'))}
function renderVehicles(){var rows=state.vehicles.filter(function(v){return textMatch([vehicleName(v),nameCustomer(v.customerId),v.vin,v.mileage].join(' '))});return pageIntro('ASSETS / VEHICLE REGISTRY','Every vehicle, accounted for.','Track ownership, mileage, identification and the next service date.','<button class="gold-btn" data-action="vehicle-new">+ Add vehicle</button>')+toolbar('Search make, model, owner, plate...','')+
(rows.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Vehicle</th><th>Customer</th><th>Mileage</th><th>Next service</th><th>Actions</th></tr></thead><tbody>'+rows.map(function(v){return '<tr><td><strong>'+esc(vehicleName(v))+'</strong><small>'+esc(v.vin||'No VIN recorded')+'</small></td><td>'+esc(nameCustomer(v.customerId))+'</td><td>'+(n(v.mileage)?n(v.mileage).toLocaleString('en-US'):'—')+'</td><td>'+(v.nextDue?'<span class="tag '+(dueSoon(v)?'attention':'')+'">'+esc(v.nextDue)+'</span>':'Not set')+'</td><td><div class="row-actions"><button data-action="vehicle-history" data-id="'+esc(v.id)+'">History</button><button data-action="vehicle-edit" data-id="'+esc(v.id)+'">Edit</button><button data-action="vehicle-delete" data-id="'+esc(v.id)+'">Delete</button></div></td></tr>'}).join('')+'</tbody></table></div>':empty('No matching vehicles','Create a customer first, then add their vehicle.','<button class="gold-btn" data-action="vehicle-new">Add vehicle</button>'))}
function renderJobs(){var rows=state.jobs.filter(function(j){return textMatch([j.title,j.status,vehicleName(getVehicle(j.vehicleId)),nameCustomer(vehicleCustomer(j.vehicleId))].join(' '))}).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))});return pageIntro('SERVICE / WORK ORDERS','Every repair, in focus.','Create estimates, track job status, itemize parts and labor, and print professional draft invoices.','<div class="row-actions"><button class="ghost-btn" data-action="csv-export">Export CSV</button><button class="gold-btn" data-action="job-new">+ New work order</button></div>')+toolbar('Search jobs, vehicles, status...','')+
'<div class="board-note">Estimates calculate labor separately from parts tax (default 6% Michigan parts sales tax). These are draft shop documents; verify charges, legal disclosures and customer approvals before using them as final invoices.</div>'+
(rows.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Work order</th><th>Vehicle / customer</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead><tbody>'+rows.map(function(j){return '<tr><td><strong>'+esc(j.title)+'</strong><small>'+esc(j.date)+' · '+esc(j.id.slice(0,8).toUpperCase())+'</small></td><td>'+esc(vehicleName(getVehicle(j.vehicleId)))+'<br><small>'+esc(nameCustomer(vehicleCustomer(j.vehicleId)))+'</small></td><td>'+status(j.status)+'</td><td><strong>'+cash(totalFor(j).total)+'</strong></td><td><div class="row-actions"><button data-action="job-edit" data-id="'+esc(j.id)+'">Edit</button><button data-action="job-print" data-id="'+esc(j.id)+'">Print</button><button data-action="job-share" data-id="'+esc(j.id)+'">Text</button><button data-action="job-delete" data-id="'+esc(j.id)+'">Delete</button></div></td></tr>'}).join('')+'</tbody></table></div>':empty('No work orders','Build your first job to calculate labor, parts, tax and a printable estimate.','<button class="gold-btn" data-action="job-new">New work order</button>'))}
function inspectionSummary(i){var vals=Object.values(i.checks||{});return vals.filter(function(x){return x==='Attention'}).length+' attention · '+vals.filter(function(x){return x==='OK'}).length+' OK'}
function renderInspections(){var rows=state.inspections.filter(function(i){return textMatch([vehicleName(getVehicle(i.vehicleId)),nameCustomer(vehicleCustomer(i.vehicleId)),i.notes].join(' '))}).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))});return pageIntro('QUALITY / INSPECTIONS','Confidence in every check.','Digital visual inspection checklist, recorded vehicle mileage and printable customer reports.','<button class="gold-btn" data-action="inspection-new">+ New inspection</button>')+toolbar('Search inspected vehicles, notes...','')+
(rows.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Vehicle</th><th>Inspected</th><th>Results</th><th>Notes</th><th>Actions</th></tr></thead><tbody>'+rows.map(function(i){return '<tr><td><strong>'+esc(vehicleName(getVehicle(i.vehicleId)))+'</strong><small>'+esc(nameCustomer(vehicleCustomer(i.vehicleId)))+'</small></td><td>'+esc(i.date)+'</td><td>'+esc(inspectionSummary(i))+'</td><td>'+esc((i.notes||'').slice(0,80))+'</td><td><div class="row-actions"><button data-action="inspection-edit" data-id="'+esc(i.id)+'">Edit</button><button data-action="inspection-print" data-id="'+esc(i.id)+'">Print</button><button data-action="inspection-delete" data-id="'+esc(i.id)+'">Delete</button></div></td></tr>'}).join('')+'</tbody></table></div>':empty('No inspections yet','Record a visual inspection and generate a clean printable report.','<button class="gold-btn" data-action="inspection-new">New inspection</button>'))}
function renderFleet(){var cs=state.customers.filter(function(c){return c.type==='Fleet'}),count=counts().fleet;return pageIntro('COMMERCIAL / FLEETCARE','Fleet management, refined.','Commercial accounts, assigned vehicles and a proposed maintenance membership model.','<button class="gold-btn" data-action="customer-new">+ Add fleet account</button>')+
'<div class="metrics">'+metric('Fleet accounts',cs.length,'Businesses marked Fleet')+metric('Fleet vehicles',count,'Assigned commercial units')+metric('Pilot rate',cash(state.prefs.fleetRate),'Per vehicle monthly (illustrative)',true)+metric('Monthly potential',cash(count*n(state.prefs.fleetRate)),'Not contracted or collected')+'</div>'+
'<div class="board-note">FleetCare subscriptions and payment collection are not active. Revenue shown here is only an illustrative projection based on vehicles assigned to fleet-type customers.</div>'+
(cs.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Account</th><th>Contact</th><th>Fleet vehicles</th><th>Illustrative monthly</th><th>Actions</th></tr></thead><tbody>'+cs.map(function(c){var count=state.vehicles.filter(function(v){return v.customerId===c.id}).length;return '<tr><td><strong>'+esc(c.company||c.name)+'</strong><small>'+esc(c.name)+'</small></td><td>'+esc(c.phone||'—')+'</td><td>'+count+'</td><td>'+cash(count*n(state.prefs.fleetRate))+'</td><td><div class="row-actions"><button data-action="customer-edit" data-id="'+esc(c.id)+'">Edit account</button></div></td></tr>'}).join('')+'</tbody></table></div>':empty('No fleet accounts yet','Create a customer and choose Fleet as the account type.','<button class="gold-btn" data-action="customer-new">Add fleet account</button>'))}
function renderReports(){var c=counts(),data=[],now=new Date();for(var i=5;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');var value=state.jobs.filter(function(j){return j.status==='Paid'&&String(j.date||'').slice(0,7)===key}).reduce(function(s,j){return s+totalFor(j).total},0);data.push({name:d.toLocaleDateString('en-US',{month:'short'}),value:value})}var max=Math.max.apply(null,data.map(function(x){return x.value}).concat([1]));return pageIntro('PERFORMANCE / SNAPSHOT','Performance with perspective.','Live totals calculated from work orders saved in this browser. For operating insight only, not a bookkeeping or tax return system.','<div class="row-actions"><button class="ghost-btn" data-action="csv-export">↓ CSV work orders</button><button class="ghost-btn" data-action="export">↓ JSON backup</button></div>')+
'<div class="metrics">'+metric('Marked paid',cash(c.paid),'All-time local job totals')+metric('Open job value',cash(c.open),'Estimates / work in progress',true)+metric('Total work orders',state.jobs.length,'Includes estimates and paid work')+metric('Fleet potential',cash(c.fleet*n(state.prefs.fleetRate)),'Illustrative monthly membership value')+'</div>'+
'<div class="board-grid"><div class="panel"><div class="panel-head"><h2>Paid work orders · last six months</h2></div><div class="report-chart">'+data.map(function(x){return '<div class="bar-col" title="'+esc(x.name+': '+cash(x.value))+'"><span style="font-size:10px;color:#ddd">'+(x.value?esc(cash(x.value)):'')+'</span><div class="bar" style="height:'+Math.max(3,Math.round(x.value/max*152))+'px"></div><small>'+esc(x.name)+'</small></div>'}).join('')+'</div></div><div class="panel"><div class="panel-head"><h2>Workspace totals</h2></div><ul class="list-simple"><li><span>Customers</span><strong>'+state.customers.length+'</strong></li><li><span>Vehicles</span><strong>'+state.vehicles.length+'</strong></li><li><span>Inspections</span><strong>'+state.inspections.length+'</strong></li><li><span>Jobs awaiting approval</span><strong>'+state.jobs.filter(function(j){return j.status==='Awaiting Approval'}).length+'</strong></li><li><span>Service dates within 30 days / overdue</span><strong>'+c.due+'</strong></li></ul></div></div>'}

function renderCompliance(){
 var reviewed=state.jobs.slice().sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""))}).map(function(j){
   return {job:j,report:window.BakersMICompliance.check(j,state.prefs,totalFor(j).total)};
 });
 var flagged=reviewed.filter(function(x){return !x.report.ready});
 return pageIntro("MICHIGAN / REPAIR DOCUMENTATION","Compliance readiness.","Review estimates, repair authorizations, parts disclosures and final invoice fields. This is an advisory checklist, not an official compliance certification.",
   '<button class="gold-btn" data-page="settings">Set facility credentials →</button>')+
 '<div class="banner"><div><b>Document readiness ≠ legal certification</b><p>Local records cannot establish verified consent or tamper-proof authorization. Keep copies of original estimates, customer approvals, invoices, waivers and signed final documents in a protected system.</p></div></div>'+
 '<div class="metrics">'+metric("Repair orders",reviewed.length,"Local work orders")+
 metric("Required-field flags",flagged.length,"Records to review",flagged.length>0)+
 metric("Shop registration",state.prefs.facilityRegistration?"Entered":"Missing","Verify current MI license")+
 metric("Mechanic certificate",state.prefs.mechanicCertificate?"Entered":"Missing","Final-invoice disclosure")+'</div>'+
 '<div class="panel" style="margin-bottom:18px"><div class="panel-head"><h2>Michigan-specific requirements</h2></div>'+
 '<ul class="list-simple"><li><span>Written estimate generally required at $50 or more before repairs commence.</span></li>'+
 '<li><span>Disclose replacement parts condition and itemized price; show labor rate, time and separately itemized shop/disposal charges.</span></li>'+
 '<li><span>Additional authorization is needed when charges exceed the estimate by more than 10% or $50, whichever is less.</span></li>'+
 '<li><span>Final invoices must identify the mechanic and certificate number, repairs performed and facility-owner/designee completion certification.</span></li>'+
 '<li><span>Retain legally required records: at least three years for transaction files, and five years for vehicle repair records per SOS guidance; longer where necessary.</span></li></ul>'+
 '<p class="lede" style="margin-top:20px">Read the <a href="https://www.michigan.gov/sos/industry-services/repair-facilities" target="_blank" rel="noopener" class="compliance-source-link">official Michigan Secretary of State repair facility guidance ↗</a>.</p></div>'+
 (reviewed.length?'<div class="panel"><div class="panel-head"><h2>Record-by-record review</h2><small>Flagging missing fields only</small></div>'+
 reviewed.map(function(x){
  var j=x.job,required=x.report.findings.filter(function(f){return f.level==="required"});
  return '<div class="history-record"><div class="compliance-record-head"><strong>'+esc(j.title)+' '+(required.length?'<span class="tag attention">'+required.length+' required field(s) missing</span>':'<span class="tag ok">No required fields missing</span>')+'</strong><button class="ghost-btn" data-action="job-edit" data-id="'+esc(j.id)+'">Review work order →</button></div>'+
  '<small>'+esc(vehicleName(getVehicle(j.vehicleId)))+' · '+esc(j.date)+' · '+esc(j.status)+'</small>'+
  '<ul class="compliance-findings">'+x.report.findings.map(function(f){return '<li class="'+esc(f.level)+'">'+esc(f.message)+'</li>'}).join("")+'</ul></div>';
 }).join("")+'</div>':empty("No work orders yet","Create an estimate to see your Michigan documentation checklist."))+
 '<div class="board-note">Reminder: entering a name or date is not a legally authenticated signature or independent verification of customer consent. Review current law and keep source documents.</div>';
}

function renderSettings(){var p=state.prefs;return pageIntro('SYSTEM / YOUR SHOP','Make it yours.','Your shop rates, Michigan parts tax calculation, backup exports and local workspace controls.','')+
'<div class="settings-grid"><div class="panel"><div class="panel-head"><h2>Pricing settings</h2></div><form id="form-settings" class="form-grid"><label class="field">Standard labor $/hr<input name="laborRate" type="number" min="0" max="1000" step=".01" value="'+n(p.laborRate)+'" required></label><label class="field">Foreign labor $/hr<input name="foreignLaborRate" type="number" min="0" max="1000" step=".01" value="'+n(p.foreignLaborRate)+'" required></label><label class="field">Parts sales tax %<input name="taxRate" type="number" min="0" max="30" step=".01" value="'+n(p.taxRate)+'" required></label><label class="field">Fleet pilot $/vehicle/month<input name="fleetRate" type="number" min="0" max="1000" step=".01" value="'+n(p.fleetRate)+'" required></label><div class="field span pro-lines-heading"><strong>Michigan facility credentials</strong><span>Displayed on repair documents</span></div><label class="field span">MI repair facility registration number<input name="facilityRegistration" maxlength="80" placeholder="Enter your registration number" value="'+esc(p.facilityRegistration||"")+'"></label><label class="field">Diagnosing / repairing technician<input name="technicianName" maxlength="120" value="'+esc(p.technicianName||"Michael Baker")+'"></label><label class="field">Mechanic certificate number<input name="mechanicCertificate" maxlength="80" placeholder="Michigan mechanic certificate" value="'+esc(p.mechanicCertificate||"")+'"></label><div class="field span"><button class="gold-btn" type="submit">Save shop settings</button></div></form><p class="lede" style="margin-top:15px">Settings affect existing work-order totals when viewed or printed. Tax applies only to the parts subtotal in the current estimator. Validate all charges before invoicing.</p></div>'+
'<div class="panel"><div class="panel-head"><h2>Data & backup</h2></div><p class="lede">Records are stored only in this browser. Clearing browser data, switching devices, or reinstalling can erase them. Save a JSON backup after each workday.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin:20px 0"><button class="gold-btn" data-action="export">↓ Download backup</button><button class="ghost-btn" data-action="import">↑ Restore backup</button></div><div class="board-note">Restoring a backup replaces the records currently on this device. No server-side recovery is available.</div><button class="ghost-btn" data-action="demo">Load fictional examples</button> <button class="ghost-btn" data-action="reset" style="color:#eaa69c">Clear all local data</button></div></div>'+
'<div class="panel" style="margin-top:15px"><div class="panel-head"><h2>What this version does / does not do</h2></div><div class="settings-grid"><div><ul class="list-simple"><li>✓ Customer & vehicle records</li><li>✓ Labor / parts totals and tax</li><li>✓ Work-order status & printing</li><li>✓ Inspections & printable reports</li><li>✓ Import/export local backups</li></ul></div><div><ul class="list-simple"><li>— No cloud account or device sync</li><li>— No integrated card processing</li><li>— No automatic customer notifications</li><li>— No secure digital approvals</li><li>— Not an accounting / tax filing system</li></ul></div></div></div>'}
function render(){document.querySelectorAll('[data-page]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-page')===currentPage)});byId('page-name').textContent=pageNames[currentPage]||'Shop workspace';var html={dashboard:renderDashboard,customers:renderCustomers,vehicles:renderVehicles,jobs:renderJobs,inspections:renderInspections,fleet:renderFleet,reports:renderReports,compliance:renderCompliance,settings:renderSettings}[currentPage]();byId('view').innerHTML=html}
function go(name){if(!pageNames[name])return;currentPage=name;query='';render();closeMobile();window.scrollTo(0,0)}
function closeMobile(){byId('sidebar').classList.remove('open');document.querySelector('.mobile-shade').classList.remove('show');byId('menu-toggle').setAttribute('aria-expanded','false')}
function notify(message){var a=byId('toast');a.textContent=message;a.classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(function(){a.classList.remove('visible')},4000)}
function openDialog(title,body){var modal=byId('record-dialog');byId('dialog-content').innerHTML='<div class="dialog-top"><h2 id="dialog-title">'+esc(title)+'</h2><button type="button" class="dialog-close" data-action="close-dialog" aria-label="Close">×</button></div><div class="dialog-body">'+body+'</div>';modal.showModal()}
function closeDialog(){var d=byId('record-dialog');if(d.open)d.close()}
function opts(items,selected){return items.map(function(o){return '<option value="'+esc(o[0])+'" '+(String(o[0])===String(selected)?'selected':'')+'>'+esc(o[1])+'</option>'}).join('')}
function actions(){return '<div class="dialog-actions"><button type="button" class="ghost-btn" data-action="close-dialog">Cancel</button><button class="gold-btn" type="submit">Save record</button></div>'}
function field(label,name,value,type,other){return '<label class="field '+(other||'')+'">'+label+'<input name="'+name+'" type="'+(type||'text')+'" value="'+esc(value||'')+'" maxlength="300"></label>'}
function customerForm(id){var c=getCustomer(id)||{name:'',company:'',phone:'',email:'',type:'Retail',notes:''};openDialog(id?'Edit customer':'Add customer','<form id="form-customer" data-id="'+esc(id||'')+'" class="form-grid">'+
'<label class="field">Contact name<input name="name" value="'+esc(c.name)+'" required maxlength="100" autocomplete="name"></label>'+
'<label class="field">Account type<select name="type">'+opts([['Retail','Retail'],['Fleet','Fleet / commercial']],c.type)+'</select></label>'+
field('Company / business','company',c.company)+field('Phone','phone',c.phone,'tel')+
'<label class="field span">Email<input name="email" type="email" value="'+esc(c.email)+'" maxlength="150"></label>'+
'<label class="field span">Notes<textarea name="notes" maxlength="2000">'+esc(c.notes)+'</textarea></label>'+actions()+'</form>')}
function vehicleForm(id){
 if(!state.customers.length){notify("Add a customer first.");customerForm();return}
 var v=getVehicle(id)||{customerId:state.customers[0].id,year:"",make:"",model:"",trim:"",engine:"",body:"",drive:"",fuel:"",plate:"",plateState:"MI",vin:"",mileage:"",nextDue:"",decodeSource:""};
 openDialog(id?"Edit vehicle":"Add vehicle",'<form id="form-vehicle" data-id="'+esc(id||"")+'" class="form-grid vehicle-identity">'+
 '<div class="field span vehicle-id-panel"><strong>Vehicle identification</strong><p>Decode a VIN with the public NHTSA database, or enter details manually. Always verify results against the actual vehicle.</p></div>'+
 '<label class="field span">Customer<select name="customerId" required>'+opts(state.customers.map(function(c){return[c.id,(c.company?c.company+" · ":"")+c.name]}),v.customerId)+'</select></label>'+
 '<label class="field span">17-character VIN (optional)<input name="vin" maxlength="17" autocomplete="off" autocapitalize="characters" value="'+esc(v.vin)+'" placeholder="e.g. 1HGCM82633A004352"></label>'+
 '<div class="field span vin-actions"><button type="button" class="gold-btn" data-action="vin-decode">Decode VIN →</button><button type="button" class="ghost-btn" data-action="plate-lookup">Plate lookup options</button><span id="vin-status" role="status" aria-live="polite">NHTSA vPIC · No owner/registration lookup</span></div>'+
 '<div class="field span" id="vin-result">'+(v.decodeSource?'<div class="vin-result-success">Previous VIN match: '+esc(v.decodeSource)+' — please verify</div>':"")+'</div>'+
 '<label class="field">Year<input name="year" type="number" min="1900" max="2100" value="'+esc(v.year)+'" required></label>'+
 field("Make","make",v.make)+field("Model","model",v.model)+field("Trim","trim",v.trim)+
 field("Engine","engine",v.engine)+field("Body style","body",v.body)+field("Drive","drive",v.drive)+field("Fuel","fuel",v.fuel)+
 '<label class="field">License plate<input name="plate" maxlength="16" value="'+esc(v.plate)+'" autocapitalize="characters" placeholder="Vehicle plate"></label>'+
 '<label class="field">Plate state<select name="plateState">'+opts([["MI","Michigan"],["OH","Ohio"],["IN","Indiana"],["OTHER","Other / unknown"]],v.plateState||"MI")+'</select></label>'+
 '<label class="field">Mileage<input name="mileage" type="number" min="0" max="2000000" value="'+esc(v.mileage)+'"></label>'+
 '<label class="field">Next service date<input name="nextDue" type="date" value="'+esc(v.nextDue)+'"></label>'+
 '<div class="field span"><div class="callout">License-plate-to-VIN retrieval requires a separate authorized data subscription. A plate alone is not proof of ownership or reliable vehicle identity.</div></div>'+actions()+'</form>');
}
async function decodeVehicleForm(){
 const form=byId("form-vehicle");if(!form)return;
 const vinInput=form.querySelector('[name="vin"]'),status=byId("vin-status"),result=byId("vin-result");
 const button=form.querySelector('[data-action="vin-decode"]');
 if(!vinInput)return;
 let vin;
 try{vin=window.BakersVIN.validate(vinInput.value)}
 catch(e){if(status)status.textContent=String(e.message||e);return}
 if(button)button.disabled=true;
 if(status)status.textContent="Looking up manufacturer vehicle data…";
 try{
   const decoded=await window.BakersVIN.decode(vin);
   for(const [key,value] of Object.entries({year:decoded.year,make:decoded.make,model:decoded.model,trim:decoded.trim,engine:decoded.engine||([decoded.displacementL?"L"+decoded.displacementL:"",decoded.cylinders?"V"+decoded.cylinders:""].filter(Boolean).join(" ")),body:decoded.body,drive:decoded.drive,fuel:decoded.fuel})){
     const input=form.querySelector('[name="'+key+'"]');if(input&&value)input.value=value;
   }
   form.setAttribute("data-decode-source","NHTSA vPIC");
   if(status)status.textContent="NHTSA decode returned. Verify every field before saving.";
   if(result)result.textContent=[decoded.year,decoded.make,decoded.model,decoded.trim,decoded.engine,decoded.fuel].filter(Boolean).join(" · ");
 }catch(e){
   if(status)status.textContent="VIN lookup unavailable: "+String(e.message||e)+" Enter vehicle details manually.";
 }finally{if(button)button.disabled=false}
}
function plateLookupInfo(){
 openDialog("License plate lookup",'<div class="callout"><b>Plate-to-VIN service not connected.</b><p>Michigan does not provide this app with unrestricted public plate identification or private owner records. A licensed commercial plate/VIN provider and an authorized-purpose review are needed before automatic lookup can be enabled.</p><p>For now, record the customer-provided plate and state, and scan/enter the VIN to use NHTSA decoding.</p><p><a href="https://www.michigan.gov/sos/faqs/transparency-and-foia/driver-and-vehicle-records" target="_blank" rel="noopener" style="color:#e6c58c">Michigan vehicle record privacy guidance ↗</a></p></div>');
}


function lineEditorRow(l,i){
  l=l||{type:"labor",description:"",qty:1,unitPrice:state.prefs.laborRate,taxable:false};
  var type=String(l.type||"labor"),part=type==="part";
  return '<div class="estimate-line" data-estimate-line>'+
   '<div class="estimate-line-head"><span class="line-no">LINE '+(i+1)+'</span><button type="button" class="text-btn" data-action="line-remove" aria-label="Remove line item">Remove ✕</button></div>'+
   '<div class="estimate-line-grid">'+
   '<label class="field">Category<select name="itemType" required>'+opts([["labor","Labor"],["part","Part"],["fee","Other charge"]],type)+'</select></label>'+
   '<label class="field item-description">Description<input name="itemDescription" value="'+esc(l.description||"")+'" required maxlength="300" placeholder="Brake pads, diagnosis, labor operation..."></label>'+
   '<label class="field">Qty / hours<input name="itemQty" type="number" min=".01" max="10000" step=".01" required value="'+esc(l.qty===undefined?1:l.qty)+'"></label>'+
   '<label class="field">Unit price / hourly rate $<input name="itemUnit" type="number" min="0" max="1000000" step=".01" required value="'+esc(l.unitPrice===undefined?0:l.unitPrice)+'"></label>'+
   '<label class="field">Parts tax treatment<select name="itemTax">'+opts([["tax","Taxable part"],["exempt","Not taxable"]],(l.taxable===undefined?part:l.taxable)?"tax":"exempt")+'</select></label>'+ 
   '<label class="field span">Replacement part condition<select name="itemCondition">'+opts([["","Not specified"],["New OEM","New OEM"],["New aftermarket","New aftermarket"],["OEM surplus","OEM surplus"],["Used","Used"],["Rebuilt","Rebuilt"],["Reconditioned","Reconditioned"]],l.condition||"")+'</select></label>'+
   '</div></div>';
}
function formLines(f){
  var types=f.getAll("itemType"),desc=f.getAll("itemDescription"),qtys=f.getAll("itemQty"),units=f.getAll("itemUnit"),taxes=f.getAll("itemTax"),conditions=f.getAll("itemCondition"),items=[];
  if(types.length===0)throw new Error("Add at least one service or part line");
  if(types.length>window.BakersEstimateEngine.maxRows)throw new Error("Too many line items");
  types.forEach(function(type,i){
    var rawQty=String(qtys[i]===undefined?"":qtys[i]).trim(),rawUnit=String(units[i]===undefined?"":units[i]).trim();
    if(!rawQty||!rawUnit||!String(desc[i]||"").trim())throw new Error("Each line needs a description, quantity and unit price");
    items.push({id:"item-"+i,type:String(type),description:String(desc[i]).trim(),qty:Number(rawQty),unitPrice:Number(rawUnit),taxable:taxes[i]==="tax",condition:String(conditions[i]||"")});
  });
  return items;
}
function refreshEstimatePreview(){
  var el=byId("form-job");if(!el)return;
  var display=byId("estimate-live-total"),detail=byId("estimate-live-detail");if(!display)return;
  try{
    var form=new FormData(el),preview=window.BakersEstimateEngine.calculate({lineItems:formLines(form),discount:Number(form.get("discount")||0)},state.prefs.taxRate);
    display.textContent=cash(preview.total);
    if(detail)detail.textContent="Labor "+cash(preview.labor)+" · Parts "+cash(preview.parts)+" · Other "+cash(preview.fees)+" · Discount "+cash(preview.discount)+" · Parts tax "+cash(preview.tax);
  }catch(e){display.textContent="—";if(detail)detail.textContent=String(e.message||e)}
}
function appendEstimateRow(){
  var host=byId("estimate-lines");if(!host)return;
  var count=host.querySelectorAll("[data-estimate-line]").length;
  if(count>=window.BakersEstimateEngine.maxRows)return notify("The maximum is 120 line items");
  host.insertAdjacentHTML("beforeend",lineEditorRow({type:"part",description:"",qty:1,unitPrice:0,taxable:true},count));
  refreshEstimatePreview();
}

function jobForm(id){
  if(!state.vehicles.length){notify("Add a vehicle first.");vehicleForm();return}
  var j=state.jobs.find(function(x){return x.id===id})||{title:"",vehicleId:state.vehicles[0].id,status:"Estimate",date:today(),description:"",partsDetails:"",recommendations:"",warranty:"",discount:0};
  var lines=window.BakersEstimateEngine.linesFor(j);
  if(!lines.length)lines=[{type:"labor",description:"",qty:1,unitPrice:n(state.prefs.laborRate),taxable:false}];
  var content='<form id="form-job" data-id="'+esc(id||"")+'" class="form-grid pro-workorder">'+
    '<label class="field span">Customer vehicle<select name="vehicleId" required>'+opts(state.vehicles.map(function(v){return [v.id,vehicleName(v)+" · "+nameCustomer(v.customerId)]}),j.vehicleId)+'</select></label>'+
    '<label class="field span">Repair order / service title<input name="title" value="'+esc(j.title)+'" required maxlength="180" placeholder="e.g. Front brake service and inspection"></label>'+
    '<label class="field">Workflow status<select name="status">'+opts([["Estimate","Estimate"],["Awaiting Approval","Awaiting Approval"],["In Progress","In Progress"],["Completed","Completed"],["Paid","Paid"],["Cancelled","Cancelled"]],j.status)+'</select></label>'+
    '<label class="field">Work order date<input type="date" name="date" required value="'+esc(j.date)+'"></label>'+
    '<div class="field span pro-lines-heading"><strong>Itemized estimate</strong><span>Every part and labor operation is priced separately</span></div>'+
    '<div class="field span" id="estimate-lines">'+lines.map(lineEditorRow).join("")+'</div>'+
    '<div class="field span"><button type="button" class="ghost-btn" data-action="line-add">+ Add another line</button></div>'+
    '<label class="field span">Discount $ (applied after item subtotal; verify tax treatment)<input type="number" name="discount" min="0" max="1000000" step=".01" value="'+esc(n(j.discount||0))+'"></label>'+
    '<div class="field span estimate-total-panel"><small>LIVE CALCULATED ESTIMATE</small><strong id="estimate-live-total">—</strong><p id="estimate-live-detail">Preparing line totals…</p></div>'+
    '<label class="field span">Inspection notes / diagnostic findings<textarea name="description" maxlength="5000" placeholder="Symptoms, confirmed failure, testing and services recommended...">'+esc(j.description)+'</textarea></label>'+
    '<label class="field span">Parts reference / supplier notes<textarea name="partsDetails" maxlength="5000" placeholder="Optional: OEM numbers, sources and service notes">'+esc(j.partsDetails||"")+'</textarea></label>'+
    '<label class="field span">Further recommendations<textarea name="recommendations" maxlength="3000">'+esc(j.recommendations||"")+'</textarea></label>'+
    '<label class="field span">Warranty / work-specific exclusions<textarea name="warranty" maxlength="2500" placeholder="Enter warranty terms agreed for this repair">'+esc(j.warranty||"")+'</textarea></label>'+
    '<div class="field span pro-lines-heading"><strong>Michigan repair record</strong><span>Manual documentation — not a digital signature service</span></div>'+
    '<label class="field">Estimate provided date/time<input name="estimateProvidedAt" type="datetime-local" value="'+esc(j.estimateProvidedAt||"")+'"></label>'+
    '<label class="field">Estimate delivery<select name="estimateDelivery">'+opts([["","Not recorded"],["Paper","Paper"],["Electronic","Electronic with consent"],["Waiver","Valid written waiver (retain separately)"]],j.estimateDelivery||"")+'</select></label>'+
    '<label class="field">Approving customer full name<input name="approvalBy" maxlength="150" value="'+esc(j.approvalBy||"")+'"></label>'+
    '<label class="field">Authorization method<select name="approvalMethod">'+opts([["","Not documented"],["Written","Written"],["Phone","Phone / verbal"],["Text","Text message"],["Electronic","Other electronic"],["Waiver","Signed waiver"]],j.approvalMethod||"")+'</select></label>'+
    '<label class="field">Approval received date/time<input name="approvalAt" type="datetime-local" value="'+esc(j.approvalAt||"")+'"></label>'+
    '<label class="field">Original approved amount $<input name="approvedAmount" type="number" min="0" max="1000000" step=".01" value="'+esc(j.approvedAmount===undefined?"":j.approvedAmount)+'"></label>'+
    '<label class="field span pro-check-field"><input name="electronicConsent" type="checkbox" '+(j.electronicConsent?"checked":"")+'><span>Customer agreed to receive estimates electronically (retain evidence)</span></label>'+
    '<label class="field">Supplemental approval date/time<input name="supplementApprovalAt" type="datetime-local" value="'+esc(j.supplementApprovalAt||"")+'"></label>'+
    '<label class="field">Replaced parts return choice<select name="partsReturn">'+opts([["","Not recorded"],["Requested","Return requested (subject to exceptions)"],["Declined","Customer declined return"],["Not applicable","Not applicable"]],j.partsReturn||"")+'</select></label>'+
    '<label class="field span">Actual work performed / exceptions<textarea name="repairsPerformed" maxlength="5000">'+esc(j.repairsPerformed||"")+'</textarea></label>'+
    '<label class="field span">Facility owner / designee completing final repair certification<input name="completionSigner" maxlength="150" value="'+esc(j.completionSigner||"")+'" placeholder="A typed name is not an electronic signature"></label>'+
    '<div class="field span"><div class="callout">Michigan documentation guide: this form records staff-entered details only. Save original estimates, customer approvals, revisions and signed final paperwork separately in a secure record system.</div></div>'+actions()+'</form>';
  openDialog(id?"Edit work order":"New work order",content);refreshEstimatePreview();
}
function inspectionForm(id){if(!state.vehicles.length){notify('Add a vehicle first.');vehicleForm();return}var a=state.inspections.find(function(x){return x.id===id})||{vehicleId:state.vehicles[0].id,date:today(),mileage:'',notes:'',checks:{}};openDialog(id?'Edit inspection':'New inspection','<form id="form-inspection" data-id="'+esc(id||'')+'" class="form-grid">'+
'<label class="field span">Vehicle<select name="vehicleId" required>'+opts(state.vehicles.map(function(v){return[v.id,vehicleName(v)]}),a.vehicleId)+'</select></label>'+
'<label class="field">Date<input type="date" name="date" value="'+esc(a.date)+'" required></label>'+
'<label class="field">Mileage<input type="number" name="mileage" min="0" max="2000000" value="'+esc(a.mileage)+'"></label>'+
'<div class="field span"><div class="checks">'+checkNames.map(function(c,i){return '<label class="check-row">'+esc(c)+'<select name="check'+i+'">'+opts([['Not checked','Not checked'],['OK','OK'],['Attention','Attention']],a.checks&&a.checks[c]||'Not checked')+'</select></label>'}).join('')+'</div></div>'+
'<label class="field span">Inspector notes<textarea name="notes" maxlength="5000" placeholder="Measured tread, brake condition, findings, recommended follow-ups...">'+esc(a.notes)+'</textarea></label>'+actions()+'</form>')}
function formSave(form){var f=new FormData(form),id=form.getAttribute('data-id')||uid(),kind=form.id;
if(kind==='form-customer'){var c={id:id,name:String(f.get('name')||'').trim(),company:String(f.get('company')||'').trim(),phone:String(f.get('phone')||'').trim(),email:String(f.get('email')||'').trim(),type:String(f.get('type')||'Retail'),notes:String(f.get('notes')||'').trim()};if(!c.name)return notify('Customer name is required.');upsert(state.customers,c)}
if(kind==='form-vehicle'){var v={id:id,customerId:String(f.get('customerId')),year:String(f.get('year')||'').trim(),make:String(f.get('make')||'').trim(),model:String(f.get('model')||'').trim(),trim:String(f.get('trim')||'').trim(),engine:String(f.get('engine')||'').trim(),body:String(f.get('body')||'').trim(),drive:String(f.get('drive')||'').trim(),fuel:String(f.get('fuel')||'').trim(),plate:String(f.get('plate')||'').trim().toUpperCase(),plateState:String(f.get('plateState')||'MI'),vin:window.BakersVIN.normalize(f.get('vin')),decodeSource:form.getAttribute('data-decode-source')||'',mileage:fixed(f.get('mileage')),nextDue:String(f.get('nextDue')||'')};if(!v.year||!v.make||!v.model)return notify('Vehicle year, make and model are required.');if(v.vin){try{window.BakersVIN.validate(v.vin)}catch(e){return notify(String(e.message||e))}}upsert(state.vehicles,v)}
if(kind==='form-job'){
  var lines,totals;
  try{
    lines=formLines(f);
    totals=window.BakersEstimateEngine.calculate({lineItems:lines,discount:Number(f.get("discount")||0)},state.prefs.taxRate);
  }catch(e){notify("Check estimate: "+String(e.message||e));return}
  var existing=state.jobs.find(function(x){return x.id===id});
  var statusValue=String(f.get("status")||"Estimate");
  var titleValue=String(f.get("title")||"").trim(),dateValue=String(f.get("date")||today());
  if(!titleValue)return notify("Enter a service title.");
  if(!getVehicle(String(f.get("vehicleId"))))return notify("Choose a valid customer vehicle.");
  if(!["Estimate","Awaiting Approval","In Progress","Completed","Paid","Cancelled"].includes(statusValue))return notify("Choose a valid workflow status.");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateValue))return notify("Use a valid service date.");
  var laborLines=lines.filter(function(x){return x.type==="labor"});
  var j={
    id:id,vehicleId:String(f.get("vehicleId")),title:titleValue,status:statusValue,date:dateValue,
    lineItems:lines,discount:fixed(f.get("discount")||0),
    laborHours:fixed(laborLines.reduce(function(a,x){return a+x.qty},0)),
    rate:laborLines.length?fixed(laborLines[0].unitPrice):0,
    parts:totals.parts,
    description:String(f.get("description")||"").trim(),
    partsDetails:String(f.get("partsDetails")||"").trim(),
    recommendations:String(f.get("recommendations")||"").trim(),
    warranty:String(f.get("warranty")||"").trim(),
    estimateProvidedAt:String(f.get("estimateProvidedAt")||""),
    estimateDelivery:String(f.get("estimateDelivery")||""),
    approvalBy:String(f.get("approvalBy")||"").trim(),
    approvalMethod:String(f.get("approvalMethod")||""),
    approvalAt:String(f.get("approvalAt")||""),
    approvedAmount:String(f.get("approvedAmount")||"").trim()?fixed(f.get("approvedAmount")):null,
    electronicConsent:String(f.get("electronicConsent")||"")==="on",
    supplementApprovalAt:String(f.get("supplementApprovalAt")||""),
    partsReturn:String(f.get("partsReturn")||""),
    repairsPerformed:String(f.get("repairsPerformed")||"").trim(),
    completionSigner:String(f.get("completionSigner")||"").trim(),
    updatedAt:new Date().toISOString(),
    createdAt:existing&&existing.createdAt||new Date().toISOString()
  };
  upsert(state.jobs,j)
}
if(kind==='form-inspection'){var checks={};checkNames.forEach(function(c,i){checks[c]=String(f.get('check'+i)||'Not checked')});var a={id:id,vehicleId:String(f.get('vehicleId')),date:String(f.get('date')||today()),mileage:fixed(f.get('mileage')),notes:String(f.get('notes')||'').trim(),checks:checks};upsert(state.inspections,a)}
persist();closeDialog();render();notify('Record saved on this device.')}
function upsert(arr,record){var i=arr.findIndex(function(x){return x.id===record.id});if(i>=0)arr[i]=record;else arr.push(record)}
function erase(type,id){var map={customer:'customers',vehicle:'vehicles',job:'jobs',inspection:'inspections'},key=map[type];if(!key)return;if(type==='customer'&&state.vehicles.some(function(v){return v.customerId===id}))return notify('Delete or reassign this customer’s vehicles first.');if(type==='vehicle'&&(state.jobs.some(function(j){return j.vehicleId===id})||state.inspections.some(function(i){return i.vehicleId===id})))return notify('Delete related work orders and inspections first.');if(!confirm('Delete this '+type+' permanently from this browser?'))return;state[key]=state[key].filter(function(x){return x.id!==id});persist();render();notify('Record deleted.')}
function paper(body,title){var win=window.open('','_blank');if(!win)return notify('Pop-up blocked. Allow pop-ups to print.');win.document.write('<!doctype html><html lang="en"><head><title>'+esc(title)+'</title><meta charset="utf-8"><style>@page{size:letter;margin:16mm 17mm}*{box-sizing:border-box}body{font:12px/1.75 Arial,Helvetica,sans-serif;color:#202523;margin:28px 34px;background:#fff}header{border-top:7px solid #b99965;border-bottom:1px solid #b2a081;padding:22px 0 25px;display:flex;justify-content:space-between;align-items:flex-start;gap:26px}header>div:last-child{text-align:right;font-size:12px;color:#54452c;white-space:nowrap}header>div:last-child b{display:block;letter-spacing:1.3px;font-size:11px;color:#9d7b44}h1{font:700 23px/1.13 Georgia,serif;letter-spacing:-.45px;color:#131918;max-width:360px;margin:0 0 9px}h2{font:bold 12px/1.4 Arial,sans-serif;text-transform:uppercase;letter-spacing:1.4px;color:#795c2e;margin:29px 0 13px;padding-bottom:7px;border-bottom:1px solid #d7d1c5}small{color:#666}p{margin:12px 0;white-space:normal;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin-top:15px;table-layout:auto}th{background:#f1ece1;color:#463920;letter-spacing:.8px;text-transform:uppercase;font-size:10px}td,th{border-bottom:1px solid #d8d6cf;padding:12px 11px;text-align:left;vertical-align:top}td{overflow-wrap:anywhere}table.totals{max-width:360px;margin:26px 0 0 auto}table.totals th{font-size:14px;background:#e8d9ba;color:#1f1e1a;padding:15px}.totals td:last-child{text-align:right}.note{margin-top:34px;color:#555b55;font-size:10px;line-height:1.65;border-top:1px solid #c7c0af;padding-top:14px}.sig{padding-top:33px;font-size:12px}.sig span{display:inline-block;border-bottom:1px solid #6c6c6c;min-width:220px}tr,h2,.sig{break-inside:avoid}header,table{break-inside:auto}@media print{body{margin:0}button{display:none}}</style></head><body>'+body+'<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)})<\/script></body></html>');win.document.close()}
function jobPrint(id){
  var j=state.jobs.find(function(x){return x.id===id});if(!j)return;
  var v=getVehicle(j.vehicleId),c=getCustomer(v&&v.customerId),t=totalFor(j);
  if(t.error){notify("Cannot print this estimate: "+t.error);return}
  var items=t.lines.map(function(l){
    var kind=l.type==="labor"?"Labor":l.type==="part"?"Part":"Other";
    return '<tr><td><b>'+esc(l.description)+'</b><br><small>'+kind+(l.type==="part"?(l.taxable?" · Taxable":" · Exempt"):"")+'</small></td><td>'+esc(l.qty)+'</td><td>'+cash(l.unitPrice)+'</td><td style="text-align:right">'+cash(l.amount)+'</td></tr>'
  }).join("");
  var heading=j.status==="Paid"?"WORK ORDER / MARKED PAID":j.status==="Completed"?"COMPLETED WORK ORDER":"REPAIR ESTIMATE / WORK ORDER";
  var subtotalRows=
      '<tr><td>Labor subtotal</td><td>'+cash(t.labor)+'</td></tr>'+
      '<tr><td>Parts subtotal</td><td>'+cash(t.parts)+'</td></tr>'+
      (t.fees?'<tr><td>Other charges</td><td>'+cash(t.fees)+'</td></tr>':"")+
      (t.discount?'<tr><td>Discount</td><td>−'+cash(t.discount)+'</td></tr>':"")+
      '<tr><td>MI parts sales tax ('+esc(state.prefs.taxRate)+'% on taxable parts)</td><td>'+cash(t.tax)+'</td></tr>';
  paper('<header><div><h1>BAKER’S AUTOMOTIVE REPAIR LLC</h1><div>33860 Groesbeck Hwy · Clinton Township, MI 48035</div><div>586-843-4157 · bakersauto2020@gmail.com</div></div><div><b>'+heading+'</b><div># '+esc(j.id.slice(0,11).toUpperCase())+'</div><small>Date: '+esc(j.date)+'</small></div></header>'+
    '<h2>Customer and vehicle details</h2><table><tr><td><b>Customer</b><br>'+esc(c&&c.name||"—")+'<br>'+esc(c&&c.company||"")+'<br>Phone: '+esc(c&&c.phone||"—")+'</td><td><b>Vehicle</b><br>'+esc(vehicleName(v))+'<br>VIN: '+esc(v&&v.vin||"Not recorded")+'<br>Mileage: '+esc(v&&v.mileage||"—")+'</td></tr></table>'+
    '<h2>'+esc(j.title)+'</h2>'+
    (j.description?'<p><b>Findings:</b><br>'+esc(j.description).replace(/\n/g,"<br>")+'</p>':"")+
    '<table><thead><tr><th>Item / service</th><th>Qty / hours</th><th>Unit rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>'+items+'</tbody></table>'+
    '<table class="totals">'+subtotalRows+'<tr><th>ESTIMATED TOTAL</th><th>'+cash(t.total)+'</th></tr></table>'+
    (j.partsDetails?'<h2>Parts information</h2><p>'+esc(j.partsDetails).replace(/\n/g,"<br>")+'</p>':"")+
    (j.recommendations?'<h2>Recommendations</h2><p>'+esc(j.recommendations).replace(/\n/g,"<br>")+'</p>':"")+
    '<h2>Service details and warranty</h2><p><b>Technician:</b> Michael Baker</p><p><b>Warranty:</b> '+esc(j.warranty||"Warranty terms must be confirmed with the shop before approval.").replace(/\n/g,"<br>")+'</p>'+
    '<p class="note"><b>Shop status:</b> '+esc(j.status)+'. Draft document created from locally entered information. Neither work authorization nor payment has been independently verified by this system. Review Michigan-specific estimate, consent, tax, environmental fee, return-of-parts and warranty disclosures and obtain valid customer authorization before issuing as a final legal shop record. Listed prices can change upon approved revision.</p>'+
    '<div class="sig">Customer approval / full legal name: <span></span> &nbsp; Date: <span style="min-width:100px"></span></div>',
    'Baker’s Automotive · '+j.id.slice(0,8));
}
function inspectionPrint(id){var i=state.inspections.find(function(x){return x.id===id});if(!i)return;var v=getVehicle(i.vehicleId),c=getCustomer(v&&v.customerId);paper('<header><div><h1>BAKER’S AUTOMOTIVE REPAIR LLC</h1>33860 Groesbeck Hwy · Clinton Township, MI 48035<br>586-843-4157</div><div><b>VISUAL VEHICLE INSPECTION</b><br>'+esc(i.date)+'</div></header><h2>Vehicle</h2><p>'+esc(vehicleName(v))+' | '+esc(nameCustomer(v&&v.customerId))+' | Mileage: '+esc(i.mileage)+'</p><table><tr><th>Inspection item</th><th>Observation</th></tr>'+checkNames.map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+esc(i.checks&&i.checks[k]||'Not checked')+'</td></tr>'}).join('')+'</table><h2>Inspector notes</h2><p>'+esc(i.notes||'No notes recorded.')+'</p><p class="note">Visual inspection only. No disassembly, complete diagnostic testing or guarantee against future failure is implied. Follow-up diagnostics and repairs require separate authorization.</p>','Baker’s inspection '+i.id.slice(0,8))}
function jobShare(id){var j=state.jobs.find(function(x){return x.id===id});if(!j)return;var v=getVehicle(j.vehicleId),c=getCustomer(v&&v.customerId);if(!c||!c.phone)return notify('Add a phone number to the customer record first.');var phone=c.phone.replace(/[^0-9+]/g,''),msg='Baker’s Automotive Repair LLC: Draft '+j.status.toLowerCase()+' for '+vehicleName(v)+' — '+j.title+'. Estimated total: '+cash(totalFor(j).total)+'. Please contact 586-843-4157 to review and authorize before any work begins.';window.location.href='sms:'+phone+'?body='+encodeURIComponent(msg)}

function vehicleHistory(id){
  var v=getVehicle(id);if(!v)return notify("Vehicle not found.");
  var jobs=state.jobs.filter(function(j){return j.vehicleId===id}).sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""))});
  var inspections=state.inspections.filter(function(i){return i.vehicleId===id}).sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""))});
  var rows=jobs.map(function(j){
    var t=totalFor(j);
    return '<div class="history-record"><strong>'+esc(j.title)+' '+status(j.status)+'</strong><small>'+esc(j.date)+' · '+cash(t.total)+'</small><div class="row-actions"><button data-action="job-edit" data-id="'+esc(j.id)+'">Edit work order</button><button data-action="job-print" data-id="'+esc(j.id)+'">Print</button></div></div>'
  }).join("");
  var checks=inspections.map(function(i){return '<div class="history-record"><strong>Visual inspection</strong><small>'+esc(i.date)+' · '+esc(inspectionSummary(i))+'</small><p class="lede">'+esc(i.notes||"No notes recorded.")+'</p><div class="row-actions"><button data-action="inspection-print" data-id="'+esc(i.id)+'">Print inspection</button></div></div>'}).join("");
  openDialog("Vehicle service history",'<div class="board-note"><b>'+esc(vehicleName(v))+'</b><br>Owner: '+esc(nameCustomer(v.customerId))+'<br>Mileage: '+esc(n(v.mileage).toLocaleString("en-US"))+' · VIN: '+esc(v.vin||"Not recorded")+'</div>'+
    '<h3 style="color:#e7c78f">Work order history ('+jobs.length+')</h3>'+(rows||'<p class="lede">No work orders recorded.</p>')+
    '<h3 style="color:#e7c78f;margin-top:25px">Inspection history ('+inspections.length+')</h3>'+(checks||'<p class="lede">No inspections recorded.</p>'));
}
function exportCsv(){
  var columns=["Work order ID","Service date","Status","Customer","Company","Phone","Vehicle","VIN","Service","Labor","Parts","Other charges","Discount","Parts tax","Total","Last updated"];
  function safeCell(v){var s=String(v==null?"":v);if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
  var rows=state.jobs.map(function(j){
    var v=getVehicle(j.vehicleId),c=getCustomer(v&&v.customerId),t=totalFor(j);
    return [j.id,j.date,j.status,c&&c.name,c&&c.company,c&&c.phone,vehicleName(v),v&&v.vin,j.title,t.labor,t.parts,t.fees||0,t.discount||0,t.tax,t.total,j.updatedAt||""]
  });
  var csv="\uFEFF"+[columns].concat(rows).map(function(row){return row.map(safeCell).join(",")}).join("\r\n");
  var blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="Bakers-Work-Orders-"+today()+".csv";document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500);
  notify("Work-order CSV exported. Keep customer information private.");
}

function exportData(){var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Bakers-GarageOS-Backup-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500);notify('Backup downloaded. Store it somewhere safe.')}
function validateBackup(a){
 if(!a||a.version!==1||!["customers","vehicles","jobs","inspections"].every(function(k){return Array.isArray(a[k])&&a[k].length<=20000}))throw new Error("Unsupported or oversized backup");
 var customerIds=new Set(),vehicleIds=new Set(),jobIds=new Set(),inspectionIds=new Set();
 a.customers.forEach(function(c){
   if(!c||typeof c.id!=="string"||!c.id||!String(c.name||"").trim()||customerIds.has(c.id))throw new Error("Invalid customer record");
   customerIds.add(c.id);
 });
 a.vehicles.forEach(function(v){
   if(!v||!v.id||vehicleIds.has(v.id)||!customerIds.has(v.customerId)||!String(v.make||"").trim()||!String(v.model||"").trim())throw new Error("Vehicle record has invalid owner or details");
   vehicleIds.add(v.id);
 });
 a.jobs.forEach(function(j){
   if(!j||!j.id||jobIds.has(j.id)||!vehicleIds.has(j.vehicleId)||!String(j.title||"").trim())throw new Error("Work order has invalid vehicle or description");
   if(!["Estimate","Awaiting Approval","In Progress","Completed","Paid","Cancelled"].includes(String(j.status||"")))throw new Error("Work order has invalid status");
   window.BakersEstimateEngine.calculate(j,n(a.prefs&&a.prefs.taxRate!==undefined?a.prefs.taxRate:6));
   jobIds.add(j.id);
 });
 a.inspections.forEach(function(i){
   if(!i||!i.id||inspectionIds.has(i.id)||!vehicleIds.has(i.vehicleId))throw new Error("Inspection references missing vehicle");
   inspectionIds.add(i.id);
 });
}
function importData(file){
 if(!file)return;
 if(file.size>5000000)return notify("Backup is larger than the supported 5 MB limit");
 var r=new FileReader();
 r.onload=function(){
   try{
     var a=JSON.parse(String(r.result));
     validateBackup(a);
     if(!confirm("This will replace ALL local customers, vehicles, work orders and inspections. Have you downloaded a backup of the current data?"))return;
     var p=fresh().prefs;
     ["laborRate","foreignLaborRate","taxRate","fleetRate"].forEach(function(k){if(a.prefs&&Number.isFinite(Number(a.prefs[k]))&&Number(a.prefs[k])>=0)p[k]=fixed(a.prefs[k])});
     if(p.taxRate>30)throw new Error("Tax setting exceeds supported limit");
     var snapshot=state;
     state={version:1,customers:a.customers,vehicles:a.vehicles,jobs:a.jobs,inspections:a.inspections,prefs:p};
     if(!persist()){state=snapshot;return}
     go("dashboard");notify("Backup restored. Review the work orders before continuing.");
   }catch(e){notify("Backup not restored: "+String(e.message||"Invalid file").slice(0,160))}
   finally{byId("import-input").value=""}
 };
 r.onerror=function(){notify("Unable to read selected backup file")};
 r.readAsText(file)
}
function demo(){if(!confirm('Add fictional examples to this workspace? These are not actual customers.'))return;var c1={id:uid(),name:'Morgan Example',company:'Example Property Services (DEMO)',phone:'',email:'',type:'Fleet',notes:'Fictional sample only'},c2={id:uid(),name:'Taylor Sample',company:'',phone:'',email:'',type:'Retail',notes:'Fictional sample only'};state.customers.push(c1,c2);var v1={id:uid(),customerId:c1.id,year:'2018',make:'Ford',model:'Transit',plate:'DEMO-01',vin:'',mileage:100750,nextDue:today()},v2={id:uid(),customerId:c1.id,year:'2017',make:'Chevrolet',model:'Silverado',plate:'DEMO-02',vin:'',mileage:123450,nextDue:''},v3={id:uid(),customerId:c2.id,year:'2016',make:'Toyota',model:'Camry',plate:'DEMO-03',vin:'',mileage:94000,nextDue:''};state.vehicles.push(v1,v2,v3);state.jobs.push({id:uid(),vehicleId:v1.id,title:'Brake system inspection and service (DEMO)',status:'Awaiting Approval',date:today(),laborHours:2,rate:150,parts:195,description:'Fictional sample estimate — not a real repair.'},{id:uid(),vehicleId:v3.id,title:'Battery replacement (DEMO)',status:'Paid',date:today(),laborHours:.7,rate:150,parts:175,description:'Fictional sample entry. Not a real payment.'});var checks={};checkNames.forEach(function(k){checks[k]='OK'});checks['Brakes']='Attention';state.inspections.push({id:uid(),vehicleId:v1.id,date:today(),mileage:100750,notes:'DEMO ONLY — front brake pads approaching service range.',checks:checks});persist();go('dashboard');notify('Fictional demo records added.')}
function reset(){if(!confirm('Permanently erase all records and settings from this browser? Export a backup first.'))return;if(!confirm('Confirm permanent local deletion. There is no undo.'))return;state=fresh();persist();go('dashboard');notify('Local workspace cleared.')}
function quickAdd(){openDialog('Create new record','<p class="lede">Choose the type of shop record to create.</p><div class="quick-grid" style="margin-top:18px"><button class="quick-card" data-action="customer-new"><span>♧</span>Customer</button><button class="quick-card" data-action="vehicle-new"><span>▤</span>Vehicle</button><button class="quick-card" data-action="job-new"><span>▥</span>Work order</button><button class="quick-card" data-action="inspection-new"><span>☑</span>Inspection</button></div>')}
document.addEventListener('click',function(e){var nav=e.target.closest('[data-page]');if(nav){go(nav.getAttribute('data-page'));return}var a=e.target.closest('[data-action]');if(!a)return;var action=a.getAttribute('data-action'),id=a.getAttribute('data-id');if(action==='close-dialog')return closeDialog();if(action==='quick-add')return quickAdd();if(action==='line-add')return appendEstimateRow();
if(action==='line-remove'){
var row=a.closest('[data-estimate-line]');
var container=byId('estimate-lines');
if(!container||!row)return;
if(container.querySelectorAll('[data-estimate-line]').length<=1)return notify('Keep at least one estimate line.');
row.remove();refreshEstimatePreview();return;
}if(action==='customer-new')return customerForm();if(action==='customer-edit')return customerForm(id);if(action==='vehicle-history')return vehicleHistory(id);if(action==='vin-decode')return decodeVehicleForm();if(action==='plate-lookup')return plateLookupInfo();if(action==='vehicle-new')return vehicleForm();if(action==='vehicle-edit')return vehicleForm(id);if(action==='job-new')return jobForm();if(action==='job-edit')return jobForm(id);if(action==='inspection-new')return inspectionForm();if(action==='inspection-edit')return inspectionForm(id);if(action==='job-print')return jobPrint(id);if(action==='inspection-print')return inspectionPrint(id);if(action==='job-share')return jobShare(id);if(action==='csv-export')return exportCsv();if(action==='export')return exportData();if(action==='import')return byId('import-input').click();if(action==='demo')return demo();if(action==='reset')return reset();var parts=action.split('-');if(parts[1]==='delete')return erase(parts[0],id)});
document.addEventListener('submit',function(e){var form=e.target;if(form.id==='form-settings'){e.preventDefault();var f=new FormData(form);['laborRate','foreignLaborRate','taxRate','fleetRate'].forEach(function(k){state.prefs[k]=fixed(f.get(k))});['facilityRegistration','technicianName','mechanicCertificate'].forEach(function(k){state.prefs[k]=String(f.get(k)||'').trim().slice(0,150)});persist();render();notify('Shop rates saved.');return}if(/^form-(customer|vehicle|job|inspection)$/.test(form.id)){e.preventDefault();if(form.reportValidity())formSave(form)}});
document.addEventListener('input',function(e){if(e.target.closest('#form-job')){refreshEstimatePreview();return}if(!e.target.matches('[data-search]'))return;query=e.target.value;var cursor=e.target.selectionStart;render();var input=document.querySelector('[data-search]');if(input){input.focus();try{input.setSelectionRange(cursor,cursor)}catch(err){}}});
document.addEventListener('change',function(e){
  var form=e.target.closest('#form-job');if(!form)return;
  if(e.target.name==='itemType'){
    var row=e.target.closest('[data-estimate-line]'),tax=row&&row.querySelector('[name=itemTax]');
    if(tax)tax.value=e.target.value==='part'?'tax':'exempt';
  }
  refreshEstimatePreview();
});
byId('import-input').addEventListener('change',function(e){importData(e.target.files[0])});
byId('menu-toggle').addEventListener('click',function(){var o=byId('sidebar').classList.toggle('open');document.querySelector('.mobile-shade').classList.toggle('show',o);this.setAttribute('aria-expanded',String(o))});
document.querySelector('.mobile-shade').addEventListener('click',closeMobile);
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMobile()});
byId('record-dialog').addEventListener('click',function(e){if(e.target===this)closeDialog()});
byId('year').textContent=new Date().getFullYear();byId('today-label').textContent=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
if('serviceWorker'in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(){})});
render();
})();