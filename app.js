(function(){
var API=(window.STAFFORA_API||"https://staffora.apps.bot-hosting.cloud").replace(/\/$/,"");
var token=localStorage.getItem("staffora_token")||"";
try{var qs=new URLSearchParams(location.search||"");var qt=qs.get("token");if(qt){token=qt;localStorage.setItem("staffora_token",token);}var hm=(location.hash||"").match(/token=([a-f0-9]+)/i);if(hm){token=hm[1];localStorage.setItem("staffora_token",token);}if(qt||hm){qs.delete("token");history.replaceState({},"",location.pathname+(qs.toString()?"?"+qs.toString():""));}}catch(e){}
var user=null,guilds=[],guild=null,cfg=null,tab="overview",discord={channels:[],roles:[]},saveTimer=null;
var CATS=[
{id:"Team",mods:[{k:"dienstnummern",l:"Dienstnummern",tab:"dn"},{k:"teamverwaltung",l:"Teamverwaltung",tab:"team"},{k:"bewerbungen",l:"Bewerbungen",tab:"apps"},{k:"dutyPanel",l:"Dienst / Clock",tab:"duty"}]},
{id:"Dokumente",mods:[{k:"ausweis",l:"Ausweise",tab:"ausweis"}]},
{id:"Roblox",mods:[{k:"robloxStaff",l:"Roblox Staff",tab:"roblox"},{k:"statusPanel",l:"On Duty",tab:"roblox"}]},
{id:"System",mods:[{k:"tickets",l:"Tickets",tab:"tickets"},{k:"adminCalls",l:"Admin Calls",tab:"admincalls"},{k:"offices",l:"Büros",tab:"offices"},{k:"keywords",l:"Keywords",tab:"keywords"},{k:"logs",l:"Logs",tab:"logs"}]}
];
function $(id){return document.getElementById(id)}
function toast(m){var t=$("toast");if(!t)return;t.textContent=m;t.classList.add("show");setTimeout(function(){t.classList.remove("show")},1800)}
function show(v){["login","select","app"].forEach(function(x){var el=$("v-"+x);if(el)el.classList.toggle("hidden",x!==v)})}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]})}
var LOGIN=API+"/auth/login?return="+encodeURIComponent(location.href.split("#")[0]);
["btn-login","btn-login2","btn-login-nav"].forEach(function(id){var el=$(id);if(el)el.href=LOGIN});
if($("btn-invite"))$("btn-invite").href=API+"/invite";
fetch(API+"/api/invite").then(function(r){return r.json()}).then(function(d){if(d&&d.url&&$("btn-invite"))$("btn-invite").href=d.url}).catch(function(){});
async function api(path,opts){opts=opts||{};var headers=Object.assign({"Content-Type":"application/json"},opts.headers||{});if(token)headers.Authorization="Bearer "+token;var res=await fetch(API+path,Object.assign({},opts,{headers:headers}));var data=null;try{data=await res.json()}catch(e){}if(res.status===401){token="";localStorage.removeItem("staffora_token");show("login");throw new Error("Session abgelaufen")}if(!res.ok)throw new Error((data&&data.error)||("HTTP "+res.status));return data}
function logout(){if(token)api("/api/logout",{method:"POST"}).catch(function(){});token="";localStorage.removeItem("staffora_token");localStorage.removeItem("staffora_guild");guild=null;cfg=null;show("login")}
if($("btn-out"))$("btn-out").onclick=logout;if($("btn-out2"))$("btn-out2").onclick=logout;
if($("btn-back"))$("btn-back").onclick=function(){guild=null;show("select");loadGuilds()};
function textChannels(){return (discord.channels||[]).filter(function(c){return c.type===0||c.type===5||c.type===11||c.type===12})}
function voiceChannels(){return (discord.channels||[]).filter(function(c){return c.type===2||c.type===13})}
function categories(){return (discord.channels||[]).filter(function(c){return c.type===4})}
function rolesList(){return (discord.roles||[]).slice().sort(function(a,b){return (a.name||"").localeCompare(b.name||"")})}
function selText(id,cur,label){var opts='<option value="">— nicht gesetzt —</option>'+textChannels().map(function(c){return '<option value="'+c.id+'"'+(String(cur)===String(c.id)?" selected":"")+"># "+esc(c.name)+"</option>"}).join("");return '<div class="field"><label>'+esc(label)+'</label><select id="'+id+'">'+opts+"</select></div>"}
function selVoice(id,cur,label){var opts='<option value="">— nicht gesetzt —</option>'+voiceChannels().map(function(c){return '<option value="'+c.id+'"'+(String(cur)===String(c.id)?" selected":"")+">🔊 "+esc(c.name)+"</option>"}).join("");return '<div class="field"><label>'+esc(label)+'</label><select id="'+id+'">'+opts+"</select></div>"}
function selCat(id,cur,label){var opts='<option value="">— nicht gesetzt —</option>'+categories().map(function(c){return '<option value="'+c.id+'"'+(String(cur)===String(c.id)?" selected":"")+">"+esc(c.name)+"</option>"}).join("");return '<div class="field"><label>'+esc(label)+'</label><select id="'+id+'">'+opts+"</select></div>"}
function selRoles(id,cur,label){cur=Array.isArray(cur)?cur:(cur?[cur]:[]);var opts=rolesList().map(function(r){return '<option value="'+r.id+'"'+(cur.map(String).indexOf(String(r.id))>=0?" selected":"")+">"+esc(r.name)+"</option>"}).join("");return '<div class="field"><label>'+esc(label)+' <span style="opacity:.45">(Strg)</span></label><select id="'+id+'" multiple size="5">'+opts+"</select></div>"}
function selRole(id,cur,label){var opts='<option value="">— nicht gesetzt —</option>'+rolesList().map(function(r){return '<option value="'+r.id+'"'+(String(cur)===String(r.id)?" selected":"")+">"+esc(r.name)+"</option>"}).join("");return '<div class="field"><label>'+esc(label)+'</label><select id="'+id+'">'+opts+"</select></div>"}
function field(id,label,val,type){return '<div class="field"><label>'+esc(label)+'</label><input id="'+id+'" type="'+(type||"text")+'" value="'+esc(val==null?"":val)+'"/></div>'}
function v(id){var el=$(id);return el?el.value:""}
function multi(id){var el=$(id);if(!el)return[];return Array.prototype.slice.call(el.selectedOptions).map(function(o){return o.value})}
function emptyOr(x){return x===""?null:x}
async function saveSet(body){cfg=await api("/api/guilds/"+guild.id+"/settings",{method:"PATCH",body:JSON.stringify(body)});toast("Gespeichert")}
function autoSave(body){clearTimeout(saveTimer);saveTimer=setTimeout(async function(){try{await saveSet(body)}catch(e){toast(e.message)}},500)}
function wireAuto(map){Object.keys(map).forEach(function(id){var el=$(id);if(!el)return;var ev=el.tagName==="SELECT"||el.type==="checkbox"?"change":"input";el.addEventListener(ev,function(){var body={};if(el.multiple)body[map[id]]=multi(id);else if(el.type==="number")body[map[id]]=parseInt(el.value,10)||0;else body[map[id]]=emptyOr(el.value);autoSave(body)})})}
async function toggleMod(key){var body={};body[key]=!((cfg.modules||{})[key]);cfg=await api("/api/guilds/"+guild.id+"/modules",{method:"PATCH",body:JSON.stringify(body)});toast(cfg.modules[key]?"Aktiviert":"Deaktiviert");renderNav();renderPanel()}
async function sendPanel(type,channelId){if(!channelId){toast("Kanal wählen");return}await api("/api/guilds/"+guild.id+"/panels/send",{method:"POST",body:JSON.stringify({type:type,channelId:channelId})});toast("Panel gesendet")}
async function refreshServerData(){toast("Lade…");try{discord=await api("/api/guilds/"+guild.id+"/discord");cfg=await api("/api/guilds/"+guild.id+"/config");toast("Aktualisiert");renderPanel()}catch(e){toast(e.message)}}
async function boot(){if(!token){show("login");return}show("select");try{user=await api("/api/me");await loadGuilds();var s=localStorage.getItem("staffora_guild");if(s&&guilds.some(function(g){return g.id===s&&g.botInstalled}))await openGuild(s)}catch(e){toast(e.message||"Login fehlgeschlagen");show("login")}}
async function loadGuilds(){var data=await api("/api/guilds");guilds=data.guilds||[];var box=$("guilds");if(!box)return;if(!guilds.length){box.innerHTML='<p class="sub">Keine Server.</p>';return}box.innerHTML=guilds.map(function(g){var letter=(g.name||"S").charAt(0).toUpperCase();var av=g.icon?'<img src="'+g.icon+'" alt=""/>':letter;var mc=g.memberCount!=null?(g.memberCount+" Mitglieder"):"";var st=g.botInstalled?'<span class="server-st ok">Bot online</span>':'<span class="server-st warn">Invite nötig</span>';return '<button type="button" class="server-card" data-id="'+g.id+'"><div class="server-av">'+av+'</div><div class="server-meta"><strong>'+esc(g.name)+'</strong><div class="mc">'+esc(mc)+'</div></div>'+st+"</button>"}).join("");box.querySelectorAll(".server-card").forEach(function(el){el.onclick=function(){var id=el.getAttribute("data-id");var g=guilds.find(function(x){return x.id===id});if(g&&!g.botInstalled){window.open(($("btn-invite")&&$("btn-invite").href)||(API+"/invite"),"_blank");toast("Zuerst Bot einladen");return}openGuild(id)}})}
async function openGuild(id){guild=guilds.find(function(g){return g.id===id})||{id:id,name:id};localStorage.setItem("staffora_guild",id);cfg=await api("/api/guilds/"+id+"/config");try{discord=await api("/api/guilds/"+id+"/discord")}catch(e){discord={channels:[],roles:[]}}if($("gname"))$("gname").textContent=guild.name||id;show("app");tab="overview";renderNav();renderPanel()}
function renderNav(){var nav=$("nav");if(!nav)return;var items=[{id:"overview",l:"Übersicht"},{id:"dn",l:"Dienstnummern"},{id:"team",l:"Team"},{id:"apps",l:"Bewerbungen"},{id:"duty",l:"Dienst / Clock"},{id:"ausweis",l:"Ausweise"},{id:"roblox",l:"Roblox / Online"},{id:"tickets",l:"Tickets"},{id:"admincalls",l:"Admin Calls"},{id:"offices",l:"Büros"},{id:"keywords",l:"Keywords"},{id:"logs",l:"Logs"},{id:"settings",l:"Einstellungen"}];nav.innerHTML=items.map(function(it){return '<button type="button" data-t="'+it.id+'" class="'+(tab===it.id?"active":"")+'">'+it.l+"</button>"}).join("");nav.querySelectorAll("button").forEach(function(b){b.onclick=function(){tab=b.getAttribute("data-t");renderNav();renderPanel()}})}
function panelCard(title,type,ch,hint){return '<div class="card"><h2>📤 Panel · '+esc(title)+"</h2>"+selText("ps-"+type,ch,"Kanal")+(hint?'<p class="desc">'+esc(hint)+"</p>":"")+'<button class="btn btn-p" id="ps-btn-'+type+'">Panel senden</button></div>'}
async function renderPanel(){
var p=$("panel");if(!p)return;p.innerHTML='<p class="desc">Lädt…</p>';
var s=(cfg&&cfg.settings)||{},m=(cfg&&cfg.modules)||{};
try{
if(tab==="overview"){
var html='<div class="row" style="justify-content:space-between;margin-bottom:12px"><div><h1>Übersicht</h1><p class="desc">'+esc(s.systemName||guild.name||"")+'</p></div><button class="btn btn-sm" id="btn-refresh">↻ Server-Daten</button></div>';
CATS.forEach(function(cat){html+='<div class="card"><h2>'+esc(cat.id)+'</h2><div class="grid">';cat.mods.forEach(function(mod){var on=!!m[mod.k];html+='<div class="stat" data-tab="'+mod.tab+'"><strong>'+esc(mod.l)+'</strong><div class="row" style="margin-top:8px;justify-content:space-between"><span class="badge '+(on?"badge-on":"badge-off")+'">'+(on?"AN":"AUS")+'</span><button type="button" class="toggle '+(on?"on":"")+'" data-mod="'+mod.k+'"></button></div></div>'});html+="</div></div>"});
p.innerHTML=html;if($("btn-refresh"))$("btn-refresh").onclick=refreshServerData;
p.querySelectorAll(".toggle").forEach(function(btn){btn.onclick=function(e){e.stopPropagation();toggleMod(btn.getAttribute("data-mod"))}});
p.querySelectorAll(".stat").forEach(function(el){el.onclick=function(){tab=el.getAttribute("data-tab");renderNav();renderPanel()}});return}

if(tab==="dn"){
var data=await api("/api/guilds/"+guild.id+"/dienstnummern").catch(function(){return{}});var list=data.numbers||data.list||[];if(!Array.isArray(list))list=[];
p.innerHTML="<h1>Dienstnummern</h1>"+(m.dienstnummern?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><h2>Einstellungen</h2>'+field("dn-sys","Systemname",s.systemName)+field("dn-pre","Prefix",s.numberPrefix||"SW-")+field("dn-dig","Stellen",s.numberDigits||2,"number")+field("dn-fmt","Format",s.displayFormat||"{number} | {name}")+'<p class="desc">Auto-Save</p></div><div class="card"><h2>Zuweisen</h2><div class="row"><input id="dn-uid" placeholder="Discord User ID" style="flex:1"/><button class="btn btn-p" id="dn-as">Zuweisen</button></div></div><div class="card"><table><tr><th>Nummer</th><th>User</th><th></th></tr>'+(list.length?list.map(function(n){var uid=n.discord_id||n.userId||"";return "<tr><td>"+esc(n.number||n.dienstnummer)+"</td><td>"+esc(uid)+'</td><td><button class="btn btn-sm" data-rel="'+esc(uid)+'">Freigeben</button></td></tr>'}).join(""):"<tr><td colspan=3>Keine</td></tr>")+"</table></div>";
wireAuto({"dn-sys":"systemName","dn-pre":"numberPrefix","dn-dig":"numberDigits","dn-fmt":"displayFormat"});
$("dn-as").onclick=async function(){await api("/api/guilds/"+guild.id+"/dienstnummern/assign",{method:"POST",body:JSON.stringify({discordId:v("dn-uid")})});toast("OK");renderPanel()};
p.querySelectorAll("[data-rel]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/dienstnummern/release",{method:"POST",body:JSON.stringify({discordId:b.getAttribute("data-rel")})});renderPanel()}});return}

if(tab==="team"){
var data=await api("/api/guilds/"+guild.id+"/team").catch(function(){return{team:[]}});var list=data.team||[];
p.innerHTML="<h1>Team</h1>"+(m.teamverwaltung?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><h2>Rollen</h2>'+selRoles("tm-staff",s.staffRoleIds,"Staff-Rollen")+selRoles("tm-admin",s.adminRoleIds,"Admin-Rollen")+'<p class="desc">Auto-Save</p></div><div class="card"><table><tr><th>Nr</th><th>User</th><th>Dienst</th><th></th></tr>'+(list.length?list.map(function(t){return "<tr><td>"+esc(t.number)+"</td><td>"+esc(t.discord_id)+"</td><td>"+(t.onDuty?"AN":"AUS")+'</td><td><button class="btn btn-sm" data-f="'+t.discord_id+'">Feuern</button></td></tr>'}).join(""):"<tr><td colspan=4>Keine</td></tr>")+"</table></div>";
wireAuto({"tm-staff":"staffRoleIds","tm-admin":"adminRoleIds"});
p.querySelectorAll("[data-f]").forEach(function(b){b.onclick=async function(){if(!confirm("Feuern?"))return;await api("/api/guilds/"+guild.id+"/team/fire",{method:"POST",body:JSON.stringify({discordId:b.getAttribute("data-f")})});renderPanel()}});return}

if(tab==="apps"){
var data=await api("/api/guilds/"+guild.id+"/applications").catch(function(){return{applications:[]}});var pending=(data.applications||[]).filter(function(a){return a.status==="pending"});
p.innerHTML="<h1>Bewerbungen</h1>"+(m.bewerbungen?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><h2>Einstellungen</h2>'+selText("app-ch",s.appChannelId,"Bewerbungs-Kanal")+selText("app-log",s.appLogChannelId||s.logChannelId,"Log-Kanal")+field("app-pts","Min. Punkte",s.appMinPoints||10,"number")+field("app-ban","Sperre Tage",s.appRejectBanDays||7,"number")+selRole("app-role",s.appRejectRoleId,"Sperr-Rolle")+'<p class="desc">Auto-Save</p></div>'+panelCard("Bewerbung","bewerbung",s.bewerbungPanelChannelId,"Button mit Staffora-Branding")+
'<div class="card"><h2>Offene</h2>'+(pending.length?'<table><tr><th>User</th><th>Roblox</th><th></th></tr>'+pending.map(function(a){return "<tr><td>"+esc(a.discord_id)+"</td><td>"+esc(a.roblox_username||"—")+'</td><td class="row"><button class="btn btn-sm btn-p" data-a="'+a.id+'">OK</button><button class="btn btn-sm" data-r="'+a.id+'">Nein</button></td></tr>'}).join("")+"</table>":'<p class="desc">Keine</p>')+"</div>";
wireAuto({"app-ch":"appChannelId","app-log":"appLogChannelId","app-pts":"appMinPoints","app-ban":"appRejectBanDays","app-role":"appRejectRoleId"});
$("ps-btn-bewerbung").onclick=function(){sendPanel("bewerbung",v("ps-bewerbung"))};
p.querySelectorAll("[data-a]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/applications/"+b.getAttribute("data-a")+"/accept",{method:"POST",body:"{}"});renderPanel()}});
p.querySelectorAll("[data-r]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/applications/"+b.getAttribute("data-r")+"/reject",{method:"POST",body:JSON.stringify({note:"Abgelehnt"})});renderPanel()}});return}

if(tab==="duty"){
p.innerHTML="<h1>Dienst / Clock</h1>"+(m.dutyPanel||m.teamverwaltung?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><h2>Einstellungen</h2>'+selText("dy-ch",s.dutyPanelChannelId,"Dienst-Liste Kanal")+field("dy-title","Titel",s.dutyPanelTitle||"Dienst")+selRoles("dy-roles",s.dutyRoleIds,"Clock-in Rollen (leer=alle)")+'<p class="desc">Auto-Save · Liste auto-updated</p></div>'+panelCard("Clock-in / Clock-out","clock",s.dutyPanelChannelId,"Buttons Clock-in & Clock-out");
wireAuto({"dy-ch":"dutyPanelChannelId","dy-title":"dutyPanelTitle","dy-roles":"dutyRoleIds"});
$("ps-btn-clock").onclick=function(){sendPanel("clock",v("ps-clock"))};return}

if(tab==="ausweis"){
var data=await api("/api/guilds/"+guild.id+"/ausweis").catch(function(){return{types:[],requests:[]}});var pending=(data.requests||[]).filter(function(r){return r.status==="pending"});
p.innerHTML="<h1>Ausweise</h1>"+(m.ausweis?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><h2>Einstellungen</h2>'+selText("aw-ch",s.ausweisChannelId,"Log-Kanal")+selRoles("aw-roles",s.ausweisStaffRoleIds,"Staff-Rollen")+'<p class="desc">Auto-Save</p></div>'+panelCard("Ausweis","ausweis",s.ausweisPanelChannelId,"Dropdown Ausweis-Typen")+
'<div class="card"><h2>Anträge</h2>'+(pending.length?'<table><tr><th>Typ</th><th>User</th><th></th></tr>'+pending.map(function(r){return "<tr><td>"+esc(r.type_name)+"</td><td>"+esc(r.discord_id)+'</td><td class="row"><button class="btn btn-sm btn-p" data-aa="'+r.id+'">OK</button><button class="btn btn-sm" data-ar="'+r.id+'">Nein</button></td></tr>'}).join("")+"</table>":'<p class="desc">Keine</p>')+"</div>";
wireAuto({"aw-ch":"ausweisChannelId","aw-roles":"ausweisStaffRoleIds"});
$("ps-btn-ausweis").onclick=function(){sendPanel("ausweis",v("ps-ausweis"))};
p.querySelectorAll("[data-aa]").forEach(function(b){b.onclick=async function(){try{await api("/api/guilds/"+guild.id+"/ausweis/requests/"+b.getAttribute("data-aa")+"/approve",{method:"POST",body:"{}"})}catch(e){}renderPanel()}});
p.querySelectorAll("[data-ar]").forEach(function(b){b.onclick=async function(){try{await api("/api/guilds/"+guild.id+"/ausweis/requests/"+b.getAttribute("data-ar")+"/reject",{method:"POST",body:"{}"})}catch(e){}renderPanel()}});return}

if(tab==="roblox"){
var data=await api("/api/guilds/"+guild.id+"/roblox-staff").catch(function(){return{staff:[]}});var list=data.staff||[];var online=list.filter(function(x){return x.is_online});
p.innerHTML="<h1>Roblox / On Duty</h1><div class=\"card\"><h2>Übersicht</h2><div class=\"grid\"><div class=\"stat\"><strong>Online</strong><span class=\"badge badge-on\">"+online.length+'</span></div><div class="stat"><strong>Gesamt</strong><span class="badge">'+list.length+"</span></div></div></div>"+
'<div class="card"><h2>Online-Admin Panel</h2>'+selText("st-ch",s.statusChannelId,"Panel-Kanal")+selRoles("st-ping",s.statusPingRoleIds,"Ping-Rollen")+field("st-int","Interval Sek.",s.statusIntervalSec||60,"number")+field("st-gid","Group ID (optional)",s.robloxGroupId||"")+field("st-rank","Min-Rang (optional)",s.robloxMinRank||255,"number")+'<p class="desc">Auto-Save · Nur Online sichtbar</p></div>'+
panelCard("Roblox-Name angeben","roblox_register",s.statusChannelId,"User gibt Namen per Modal ein")+
'<div class="card"><h2>Staff</h2><div class="row"><input id="ru" placeholder="Roblox Username" style="flex:1"/><button class="btn btn-p" id="ra">+</button><button class="btn" id="rr">↻</button></div><table style="margin-top:10px"><tr><th>User</th><th>Online</th><th>Rechte</th><th></th></tr>'+(list.length?list.map(function(x){return "<tr><td>"+esc(x.roblox_username)+"</td><td>"+(x.is_online?'<span class="badge badge-on">ON</span>':'<span class="badge badge-off">OFF</span>')+"</td><td>"+(x.has_ingame_rights?'<span class="badge badge-on">JA</span>':'<span class="badge badge-off">NEIN</span>')+'</td><td><button class="btn btn-sm" data-x="'+x.id+'">X</button></td></tr>'}).join(""):"<tr><td colspan=4>Keine</td></tr>")+"</table></div>";
wireAuto({"st-ch":"statusChannelId","st-ping":"statusPingRoleIds","st-int":"statusIntervalSec","st-gid":"robloxGroupId","st-rank":"robloxMinRank"});
$("ps-btn-roblox_register").onclick=function(){sendPanel("roblox_register",v("ps-roblox_register"))};
$("ra").onclick=async function(){await api("/api/guilds/"+guild.id+"/roblox-staff",{method:"POST",body:JSON.stringify({username:v("ru")})});renderPanel()};
$("rr").onclick=async function(){await api("/api/guilds/"+guild.id+"/roblox-staff/refresh",{method:"POST",body:"{}"});renderPanel()};
p.querySelectorAll("[data-x]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/roblox-staff/"+b.getAttribute("data-x"),{method:"DELETE"});renderPanel()}});return}

if(tab==="tickets"){
p.innerHTML="<h1>Tickets</h1>"+(m.tickets?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><h2>Einstellungen</h2>'+selText("tk-panel",s.ticketPanelChannelId,"Panel-Kanal")+selCat("tk-cat",s.ticketCategoryId,"Kategorie")+selText("tk-log",s.ticketLogChannelId,"Log-Kanal")+selRoles("tk-roles",s.ticketSupportRoleIds,"Support-Rollen (Ping)")+field("tk-title","Panel-Titel",s.ticketPanelTitle||"Support Tickets")+field("tk-text","Panel-Text",s.ticketPanelText||"Ticket öffnen")+'<p class="desc">Auto-Save</p></div>'+panelCard("Ticket-Panel","tickets",s.ticketPanelChannelId,"Öffnet Ticket");
wireAuto({"tk-panel":"ticketPanelChannelId","tk-cat":"ticketCategoryId","tk-log":"ticketLogChannelId","tk-roles":"ticketSupportRoleIds","tk-title":"ticketPanelTitle","tk-text":"ticketPanelText"});
$("ps-btn-tickets").onclick=function(){sendPanel("tickets",v("ps-tickets"))};return}

if(tab==="admincalls"){
p.innerHTML="<h1>Admin Calls</h1>"+(m.adminCalls?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><h2>Einstellungen</h2>'+selVoice("ac-wait",s.adminCallWaitingChannelId,"Warteraum VC")+selRoles("ac-ping",s.adminCallPingRoleIds,"Ping-Rollen")+selText("ac-log",s.adminCallLogChannelId,"Log-Kanal")+'<p class="desc">Auto-Save</p></div>'+panelCard("Admin-Call Info","admincall",s.adminCallLogChannelId,"Info-Embed");
wireAuto({"ac-wait":"adminCallWaitingChannelId","ac-ping":"adminCallPingRoleIds","ac-log":"adminCallLogChannelId"});
$("ps-btn-admincall").onclick=function(){sendPanel("admincall",v("ps-admincall"))};return}

if(tab==="offices"){
var data=await api("/api/guilds/"+guild.id+"/offices").catch(function(){return{offices:[]}});var list=data.offices||[];
p.innerHTML="<h1>Büros</h1>"+(m.offices?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><h2>Einstellungen</h2>'+selVoice("of-wait",s.officeWaitingChannelId,"Warteraum")+selRole("of-ping",s.officePingRoleId,"Ping-Rolle")+selText("of-log",s.officeLogChannelId,"Log")+'<p class="desc">Auto-Save</p></div><div class="card"><h2>Büro +</h2>'+field("of-name","Name","")+selVoice("of-vc","","Voice")+selRole("of-role","","Rolle")+'<button class="btn btn-p" id="of-add">Hinzufügen</button></div><div class="card"><table><tr><th>Name</th><th>VC</th><th>Rolle</th><th></th></tr>'+(list.length?list.map(function(o){return "<tr><td>"+esc(o.name)+"</td><td>"+esc(o.voice_channel_id||"—")+"</td><td>"+esc(o.role_id||"—")+'</td><td><button class="btn btn-sm" data-ox="'+o.id+'">X</button></td></tr>'}).join(""):"<tr><td colspan=4>Keine</td></tr>")+"</table></div>";
wireAuto({"of-wait":"officeWaitingChannelId","of-ping":"officePingRoleId","of-log":"officeLogChannelId"});
$("of-add").onclick=async function(){await api("/api/guilds/"+guild.id+"/offices",{method:"POST",body:JSON.stringify({name:v("of-name"),voiceChannelId:emptyOr(v("of-vc")),roleId:emptyOr(v("of-role"))})});renderPanel()};
p.querySelectorAll("[data-ox]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/offices/"+b.getAttribute("data-ox"),{method:"DELETE"});renderPanel()}});return}

if(tab==="keywords"){
var data=await api("/api/guilds/"+guild.id+"/keywords").catch(function(){return{keywords:[]}});var list=data.keywords||[];
p.innerHTML="<h1>Keywords</h1>"+(m.keywords?"":'<p class="desc">Modul AUS.</p>')+'<div class="card"><div class="row"><input id="kw-t" placeholder="Trigger" style="flex:1"/><input id="kw-r" placeholder="Antwort" style="flex:2"/><button class="btn btn-p" id="kw-add">+</button></div></div><div class="card"><table><tr><th>Trigger</th><th>Antwort</th><th></th></tr>'+(list.length?list.map(function(k){return "<tr><td>"+esc(k.trigger)+"</td><td>"+esc(k.response)+'</td><td><button class="btn btn-sm" data-kx="'+k.id+'">X</button></td></tr>'}).join(""):"<tr><td colspan=3>Keine</td></tr>")+"</table></div>";
$("kw-add").onclick=async function(){await api("/api/guilds/"+guild.id+"/keywords",{method:"POST",body:JSON.stringify({trigger:v("kw-t"),response:v("kw-r")})});renderPanel()};
p.querySelectorAll("[data-kx]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/keywords/"+b.getAttribute("data-kx"),{method:"DELETE"});renderPanel()}});return}

if(tab==="logs"){
var data=await api("/api/guilds/"+guild.id+"/logs").catch(function(){return{logs:[]}});var logs=data.logs||[];
p.innerHTML="<h1>Logs</h1><div class=\"card\">"+selText("lg-ch",s.logChannelId,"Log-Kanal")+'<p class="desc">Auto-Save</p></div><div class="card"><table><tr><th>Zeit</th><th>Modul</th><th>Aktion</th><th>Ziel</th></tr>'+(logs.length?logs.map(function(l){return "<tr><td>"+esc(new Date(l.created_at).toLocaleString("de-DE"))+"</td><td>"+esc(l.module)+"</td><td>"+esc(l.action)+"</td><td>"+esc(l.target_id||"—")+"</td></tr>"}).join(""):"<tr><td colspan=4>Keine</td></tr>")+"</table></div>";
wireAuto({"lg-ch":"logChannelId"});return}

if(tab==="settings"){
p.innerHTML="<h1>Einstellungen</h1><div class=\"card\">"+field("set-sys","Systemname",s.systemName)+selText("set-log",s.logChannelId,"Globaler Log")+selRoles("set-staff",s.staffRoleIds,"Staff")+selRoles("set-admin",s.adminRoleIds,"Admin")+'<p class="desc">Auto-Save</p></div><div class="card"><button class="btn" id="btn-ref2">↻ Server-Daten</button></div>';
wireAuto({"set-sys":"systemName","set-log":"logChannelId","set-staff":"staffRoleIds","set-admin":"adminRoleIds"});
$("btn-ref2").onclick=refreshServerData;return}

p.innerHTML='<p class="desc">?</p>';
}catch(e){p.innerHTML='<div class="card" style="color:#fca5a5">'+esc(e.message)+"</div>"}
}
boot();
})();
