(function(){
var API=(window.STAFFORA_API||"https://staffora.apps.bot-hosting.cloud").replace(/\/$/,"");
document.getElementById("api-label").textContent=API;
var token=localStorage.getItem("staffora_token")||"";
try{var h=(location.hash||"").match(/token=([a-f0-9]+)/i);if(h){token=h[1];localStorage.setItem("staffora_token",token);history.replaceState({},"",location.pathname+location.search);}}catch(e){}
var user=null,guilds=[],guild=null,cfg=null,tab="overview";
var MODS=[{k:"dienstnummern",l:"Dienstnummern",cat:"Team"},{k:"teamverwaltung",l:"Teamverwaltung",cat:"Team"},{k:"bewerbungen",l:"Bewerbungen",cat:"Team"},{k:"ausweis",l:"Ausweise",cat:"Dokumente"},{k:"robloxStaff",l:"Roblox Staff",cat:"Roblox"},{k:"statusPanel",l:"Status Panel",cat:"Roblox"},{k:"logs",l:"Logs",cat:"System"},{k:"adminCalls",l:"Admin Calls",cat:"System"},{k:"tickets",l:"Tickets",cat:"System"}];
function $(id){return document.getElementById(id)}
function toast(m){var t=$("toast");t.textContent=m;t.classList.add("show");setTimeout(function(){t.classList.remove("show")},2200)}
function show(v){["login","select","app"].forEach(function(x){var el=$("v-"+x);if(el)el.classList.toggle("hidden",x!==v)})}
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]})}
$("btn-login").href=API+"/auth/login?return="+encodeURIComponent(location.href.split("#")[0]);
$("btn-invite").href=API+"/invite";
fetch(API+"/api/invite").then(function(r){return r.json()}).then(function(d){if(d&&d.url)$("btn-invite").href=d.url}).catch(function(){});
async function api(path,opts){
  opts=opts||{};
  var headers=Object.assign({"Content-Type":"application/json"},opts.headers||{});
  if(token)headers.Authorization="Bearer "+token;
  var res=await fetch(API+path,Object.assign({},opts,{headers:headers}));
  var data=null;try{data=await res.json()}catch(e){}
  if(res.status===401){token="";localStorage.removeItem("staffora_token");show("login");throw new Error("Session abgelaufen")}
  if(!res.ok)throw new Error((data&&data.error)||("HTTP "+res.status));
  return data;
}
function logout(){if(token)api("/api/logout",{method:"POST"}).catch(function(){});token="";localStorage.removeItem("staffora_token");localStorage.removeItem("staffora_guild");guild=null;cfg=null;show("login")}
$("btn-out").onclick=$("btn-out2").onclick=logout;
$("btn-back").onclick=function(){guild=null;show("select");loadGuilds()};
async function boot(){
  if(!token){show("login");return}
  show("select");
  try{
    user=await api("/api/me");
    $("user-chip").textContent=user.username||user.id;
    await loadGuilds();
    var s=localStorage.getItem("staffora_guild");
    if(s&&guilds.some(function(g){return g.id===s&&g.botInstalled}))await openGuild(s);
  }catch(e){toast(e.message||"Login fehlgeschlagen");show("login")}
}
async function loadGuilds(){
  var data=await api("/api/guilds");
  guilds=data.guilds||[];
  var box=$("guilds");
  if(!guilds.length){box.innerHTML='<div class="card"><p class="lead">Keine Server.</p><a class="btn btn-p" href="'+$("btn-invite").href+'" target="_blank">Bot einladen</a></div>';return}
  box.innerHTML=guilds.map(function(g){
    return '<div class="guild" data-id="'+g.id+'">'+(g.icon?'<img src="'+g.icon+'" width="40" height="40" style="border-radius:10px"/>':'<div class="logo">S</div>')+'<div><strong>'+esc(g.name)+'</strong><div class="lead" style="font-size:12px;margin:0">'+(g.botInstalled?"Bot installiert":"Bot fehlt")+"</div></div></div>"
  }).join("");
  box.querySelectorAll(".guild").forEach(function(el){
    el.onclick=function(){
      var id=el.getAttribute("data-id");
      var g=guilds.find(function(x){return x.id===id});
      if(g&&!g.botInstalled){window.open($("btn-invite").href,"_blank");toast("Bot einladen, dann neu laden");return}
      openGuild(id);
    };
  });
}
async function openGuild(id){
  guild=guilds.find(function(g){return g.id===id})||{id:id,name:id};
  localStorage.setItem("staffora_guild",id);
  cfg=await api("/api/guilds/"+id+"/config");
  $("gname").textContent=guild.name||id;
  show("app");renderNav();renderPanel();
}
function renderNav(){
  var m=(cfg&&cfg.modules)||{};
  var items=[{id:"overview",l:"Übersicht"},{id:"modules",l:"Module"}];
  if(m.dienstnummern)items.push({id:"dn",l:"Dienstnummern"});
  if(m.bewerbungen)items.push({id:"apps",l:"Bewerbungen"});
  if(m.teamverwaltung)items.push({id:"team",l:"Team"});
  if(m.ausweis)items.push({id:"ausweis",l:"Ausweise"});
  if(m.robloxStaff)items.push({id:"roblox",l:"Roblox"});
  if(m.statusPanel)items.push({id:"status",l:"Status Panel"});
  if(m.logs!==false)items.push({id:"logs",l:"Logs"});
  items.push({id:"settings",l:"Einstellungen"});
  $("nav").innerHTML=items.map(function(it){return '<button type="button" data-t="'+it.id+'" class="'+(tab===it.id?"active":"")+'">'+it.l+"</button>"}).join("");
  $("nav").querySelectorAll("button").forEach(function(b){b.onclick=function(){tab=b.getAttribute("data-t");renderNav();renderPanel()}});
}
async function renderPanel(){
  var p=$("panel");p.innerHTML='<p class="lead">Lädt…</p>';
  try{
    if(tab==="overview"){
      var m=cfg.modules||{},s=cfg.settings||{};
      var cats={};MODS.forEach(function(x){var c=x.cat||"Sonstig";if(!cats[c])cats[c]=[];cats[c].push(x)});
      var html="<h1>Übersicht</h1><p class=\"lead\">"+esc(s.systemName||"Staffora")+"</p>";
      Object.keys(cats).forEach(function(cat){
        html+="<h2 style=\"font-size:0.95rem;color:var(--muted);margin:16px 0 8px\">"+esc(cat)+"</h2><div class=\"grid\">";
        html+=cats[cat].map(function(x){return '<div class="card"><strong>'+x.l+'</strong><div style="margin-top:8px"><span class="badge '+(m[x.k]?"on":"off")+'">'+(m[x.k]?"AN":"AUS")+"</span></div></div>"}).join("");
        html+="</div>";
      });
      p.innerHTML=html;
    }else if(tab==="modules"){
      var m=cfg.modules||{};
      var cats={};MODS.forEach(function(x){var c=x.cat||"Sonstig";if(!cats[c])cats[c]=[];cats[c].push(x)});
      var html="<h1>Module</h1>";
      Object.keys(cats).forEach(function(cat){
        html+="<div class=\"card\"><h2 style=\"margin:0 0 10px;font-size:1rem\">"+esc(cat)+"</h2>";
        html+=cats[cat].map(function(x){return '<div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span>'+x.l+'</span><label><input type="checkbox" data-m="'+x.k+'" '+(m[x.k]?"checked":"")+"/> aktiv</label></div>"}).join("");
        html+="</div>";
      });
      html+='<button class="btn btn-p" id="save-m">Speichern</button>';
      p.innerHTML=html;
      $("save-m").onclick=async function(){var body={};p.querySelectorAll("[data-m]").forEach(function(i){body[i.getAttribute("data-m")]=i.checked});cfg=await api("/api/guilds/"+guild.id+"/modules",{method:"PATCH",body:JSON.stringify(body)});toast("Gespeichert");renderNav();renderPanel()};
    }else if(tab==="settings"){
      var s=cfg.settings||{};
      function f(k,l,v){return '<div><label class="lead" style="font-size:12px">'+l+'</label><input data-k="'+k+'" value="'+esc(v==null?"":v)+'"/></div>'}
      p.innerHTML="<h1>Einstellungen</h1><div class=\"card\"><h2 style=\"font-size:1rem\">Allgemein</h2>"+f("systemName","Systemname",s.systemName)+"</div><div class=\"card\"><h2 style=\"font-size:1rem\">Dienstnummern</h2>"+f("numberPrefix","Prefix (z.B. SW-)",s.numberPrefix)+f("numberDigits","Stellen",s.numberDigits)+f("numberLabel","Label",s.numberLabel)+f("displayFormat","Format {number} {name}",s.displayFormat)+"</div><div class=\"card\"><h2 style=\"font-size:1rem\">Kanäle</h2>"+f("appChannelId","Bewerbungs-Kanal",s.appChannelId)+f("logChannelId","Log-Kanal",s.logChannelId)+f("ausweisChannelId","Ausweis-Antrags-Kanal",s.ausweisChannelId)+f("statusChannelId","Status-Kanal",s.statusChannelId)+"</div><div class=\"card\"><h2 style=\"font-size:1rem\">Roblox</h2>"+f("robloxGroupId","Gruppen-ID",s.robloxGroupId)+f("robloxMinRank","Min. Rang",s.robloxMinRank)+f("statusIntervalSec","Status-Intervall (s)",s.statusIntervalSec)+'</div><button class="btn btn-p" id="save-s">Speichern</button>';
      $("save-s").onclick=async function(){var body={};p.querySelectorAll("[data-k]").forEach(function(i){var k=i.getAttribute("data-k"),v=i.value;if(k==="numberDigits"||k==="robloxMinRank"||k==="statusIntervalSec")v=Number(v);body[k]=v===""?null:v});cfg=await api("/api/guilds/"+guild.id+"/settings",{method:"PATCH",body:JSON.stringify(body)});toast("Gespeichert")};
    }else if(tab==="dn"){
      var data=await api("/api/guilds/"+guild.id+"/dienstnummern");
      var reqs=await api("/api/guilds/"+guild.id+"/dienstnummern/requests");
      var rows=data.numbers||[];
      p.innerHTML="<h1>Dienstnummern</h1><div class=\"card\"><table class=\"table\"><tr><th>Nr</th><th>Status</th><th>Discord</th><th>Roblox</th></tr>"+rows.map(function(n){return "<tr><td>"+esc(n.number)+"</td><td>"+esc(n.status)+"</td><td>"+esc(n.discord_id||"—")+"</td><td>"+esc(n.roblox_username||"—")+"</td></tr>"}).join("")+"</table></div>";
      var rr=reqs.requests||[];
      if(rr.length){p.innerHTML+="<div class=\"card\"><h2>Wechsel-Anträge</h2><table class=\"table\">"+rr.map(function(r){return "<tr><td>"+r.id+"</td><td>"+esc(r.discord_id)+"</td><td>"+esc(r.current_number||"—")+'</td><td class="row"><button class="btn btn-sm btn-p" data-ap="'+r.id+'">OK</button><button class="btn btn-sm" data-rj="'+r.id+'">Nein</button></td></tr>'}).join("")+"</table></div>";
        p.querySelectorAll("[data-ap]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/dienstnummern/requests/"+b.getAttribute("data-ap")+"/approve",{method:"POST",body:"{}"});toast("Genehmigt");renderPanel()}});
        p.querySelectorAll("[data-rj]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/dienstnummern/requests/"+b.getAttribute("data-rj")+"/reject",{method:"POST",body:"{}"});toast("Abgelehnt");renderPanel()}});
      }
    }else if(tab==="apps"){
      var data=await api("/api/guilds/"+guild.id+"/applications?status=pending");
      var list=data.applications||[];
      p.innerHTML="<h1>Bewerbungen</h1><div class=\"card\">"+(list.length?"<table class=\"table\"><tr><th>ID</th><th>Discord</th><th>Roblox</th><th></th></tr>"+list.map(function(a){return "<tr><td>"+a.id+"</td><td>"+esc(a.discord_id)+"</td><td>"+esc(a.roblox_username||"—")+'</td><td class="row"><button class="btn btn-sm btn-p" data-a="'+a.id+'">Annehmen</button><button class="btn btn-sm" data-r="'+a.id+'">Ablehnen</button></td></tr>'}).join("")+"</table>":'<p class="lead">Keine offenen</p>')+"</div>";
      p.querySelectorAll("[data-a]").forEach(function(b){b.onclick=async function(){var r=await api("/api/guilds/"+guild.id+"/applications/"+b.getAttribute("data-a")+"/accept",{method:"POST",body:"{}"});toast("OK → "+(r.number&&r.number.number));renderPanel()}});
      p.querySelectorAll("[data-r]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/applications/"+b.getAttribute("data-r")+"/reject",{method:"POST",body:JSON.stringify({note:"Abgelehnt"})});toast("Abgelehnt");renderPanel()}});
    }else if(tab==="team"){
      var data=await api("/api/guilds/"+guild.id+"/team");
      var list=data.team||[];
      p.innerHTML="<h1>Team</h1><div class=\"card\"><table class=\"table\"><tr><th>Nr</th><th>Discord</th><th>Dienst</th><th>Warns</th><th></th></tr>"+list.map(function(t){return "<tr><td>"+esc(t.number)+"</td><td>"+esc(t.discord_id)+"</td><td>"+(t.onDuty?"AN":"AUS")+"</td><td>"+t.warnings+'</td><td class="row"><button class="btn btn-sm" data-d="'+t.discord_id+'" data-on="'+(t.onDuty?0:1)+'">'+(t.onDuty?"Außer Dienst":"In Dienst")+'</button><button class="btn btn-sm" data-w="'+t.discord_id+'">Warn</button><button class="btn btn-sm" data-f="'+t.discord_id+'">Feuern</button></td></tr>'}).join("")+"</table></div>";
      p.querySelectorAll("[data-d]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/team/duty",{method:"POST",body:JSON.stringify({discordId:b.getAttribute("data-d"),onDuty:b.getAttribute("data-on")==="1"})});renderPanel()}});
      p.querySelectorAll("[data-w]").forEach(function(b){b.onclick=async function(){var reason=prompt("Grund")||"";await api("/api/guilds/"+guild.id+"/team/warn",{method:"POST",body:JSON.stringify({discordId:b.getAttribute("data-w"),reason:reason})});toast("Warn");renderPanel()}});
      p.querySelectorAll("[data-f]").forEach(function(b){b.onclick=async function(){if(!confirm("Feuern?"))return;await api("/api/guilds/"+guild.id+"/team/fire",{method:"POST",body:JSON.stringify({discordId:b.getAttribute("data-f"),reason:"Kündigung"})});toast("Gekündigt");renderPanel()}});
    }else if(tab==="ausweis"){
      var types=await api("/api/guilds/"+guild.id+"/ausweis/types");
      var reqs=await api("/api/guilds/"+guild.id+"/ausweis/requests");
      var list=types.types||[];
      var pending=reqs.requests||[];
      p.innerHTML="<h1>Ausweise</h1><p class=\"lead\">Typen · Anträge · /ausweis zeigen</p><div class=\"card\"><h2 style=\"margin:0 0 10px;font-size:1rem\">Dokument-Typen</h2>"+list.map(function(t){return '<div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span><strong>'+esc(t.name)+'</strong> <span class="badge '+(t.enabled!==false?"on":"off")+'">'+(t.enabled!==false?"AN":"AUS")+'</span></span><span class="row"><button class="btn btn-sm" data-te="'+t.id+'">'+(t.enabled!==false?"Deaktivieren":"Aktivieren")+'</button><button class="btn btn-sm" data-td="'+t.id+'">Löschen</button></span></div>'}).join("")+'<div class="row" style="margin-top:12px"><input id="nt" placeholder="Neuer Typ" style="max-width:260px"/><button class="btn btn-p" id="nta">Hinzufügen</button></div></div><div class="card"><h2 style="margin:0 0 10px;font-size:1rem">Offene Anträge</h2>'+(pending.length?"<table class=\"table\"><tr><th>ID</th><th>Typ</th><th>User</th><th></th></tr>"+pending.map(function(r){return "<tr><td>"+r.id+"</td><td>"+esc(r.type_name)+"</td><td>"+esc(r.discord_id)+'</td><td class="row"><button class="btn btn-sm btn-p" data-aa="'+r.id+'">OK</button><button class="btn btn-sm" data-ar="'+r.id+'">Nein</button></td></tr>'}).join("")+"</table>":'<p class="lead">Keine offenen</p>')+"</div><div class=\"card\"><label class=\"lead\" style=\"font-size:12px\">Ausweis Log-Kanal ID</label><input id=\"ac\" value=\""+esc((cfg.settings||{}).ausweisChannelId||"")+"\"/><button class=\"btn btn-p\" id=\"acs\" style=\"margin-top:8px\">Kanal speichern</button></div>";
      $("nta").onclick=async function(){var n=$("nt").value.trim();if(!n)return;await api("/api/guilds/"+guild.id+"/ausweis/types",{method:"POST",body:JSON.stringify({name:n})});toast("Typ angelegt");renderPanel()};
      $("acs").onclick=async function(){cfg=await api("/api/guilds/"+guild.id+"/settings",{method:"PATCH",body:JSON.stringify({ausweisChannelId:$("ac").value||null})});toast("Gespeichert")};
      p.querySelectorAll("[data-te]").forEach(function(b){b.onclick=async function(){var id=b.getAttribute("data-te");var t=list.find(function(x){return x.id===id});await api("/api/guilds/"+guild.id+"/ausweis/types/"+id,{method:"PATCH",body:JSON.stringify({enabled:!(t&&t.enabled!==false)})});renderPanel()}});
      p.querySelectorAll("[data-td]").forEach(function(b){b.onclick=async function(){if(!confirm("Löschen?"))return;await api("/api/guilds/"+guild.id+"/ausweis/types/"+b.getAttribute("data-td"),{method:"DELETE"});renderPanel()}});
      p.querySelectorAll("[data-aa]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/ausweis/requests/"+b.getAttribute("data-aa")+"/approve",{method:"POST",body:"{}"});toast("Angenommen");renderPanel()}});
      p.querySelectorAll("[data-ar]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/ausweis/requests/"+b.getAttribute("data-ar")+"/reject",{method:"POST",body:JSON.stringify({note:"Abgelehnt"})});toast("Abgelehnt");renderPanel()}});
    }else if(tab==="roblox"){
      var data=await api("/api/guilds/"+guild.id+"/roblox-staff");
      var list=data.staff||[];
      p.innerHTML='<h1>Roblox Staff</h1><p class="lead">Nur Ingame-Rechte JA/NEIN.</p><div class="card row"><input id="ru" placeholder="Roblox Username" style="max-width:200px"/><button class="btn btn-p" id="ra">Hinzufügen</button><button class="btn" id="rr">Rechte prüfen</button></div><div class="card"><table class="table"><tr><th>User</th><th>Rechte</th><th></th></tr>'+list.map(function(s){return "<tr><td>"+esc(s.roblox_username)+'</td><td><span class="badge '+(s.has_ingame_rights?"on":"off")+'">'+(s.has_ingame_rights?"JA":"NEIN")+'</span></td><td><button class="btn btn-sm" data-x="'+s.id+'">X</button></td></tr>'}).join("")+"</table></div>";
      $("ra").onclick=async function(){var u=$("ru").value.trim();if(!u)return;await api("/api/guilds/"+guild.id+"/roblox-staff",{method:"POST",body:JSON.stringify({robloxUsername:u})});toast("OK");renderPanel()};
      $("rr").onclick=async function(){await api("/api/guilds/"+guild.id+"/roblox-staff/refresh",{method:"POST",body:"{}"});toast("Aktualisiert");renderPanel()};
      p.querySelectorAll("[data-x]").forEach(function(b){b.onclick=async function(){await api("/api/guilds/"+guild.id+"/roblox-staff/"+b.getAttribute("data-x"),{method:"DELETE"});renderPanel()}});
    }else if(tab==="status"){
      var s=cfg.settings||{};
      p.innerHTML="<h1>Status Panel</h1><div class=\"card\"><p>Kanal: <code>"+esc(s.statusChannelId||"—")+"</code></p><p>Gruppe: "+esc(s.robloxGroupId||"—")+" · Min-Rang: "+(s.robloxMinRank||255)+'</p><button class="btn btn-p" id="su">Panel aktualisieren</button></div>';
      $("su").onclick=async function(){await api("/api/guilds/"+guild.id+"/status-panel/update",{method:"POST",body:"{}"});toast("OK")};
    }else if(tab==="logs"){
      var data=await api("/api/guilds/"+guild.id+"/logs?limit=50");
      var logs=data.logs||[];
      p.innerHTML="<h1>Logs</h1><div class=\"card\"><table class=\"table\"><tr><th>Zeit</th><th>Modul</th><th>Aktion</th><th>Ziel</th><th>Nr</th></tr>"+logs.map(function(l){return "<tr><td>"+esc(new Date(l.created_at).toLocaleString("de-DE"))+"</td><td>"+esc(l.module)+"</td><td>"+esc(l.action)+"</td><td>"+esc(l.target_id||"—")+"</td><td>"+esc(l.dienstnummer||"—")+"</td></tr>"}).join("")+"</table></div>";
    }else p.innerHTML="<p>Tab</p>";
  }catch(e){p.innerHTML='<div class="card" style="color:#fecaca">'+esc(e.message)+"</div>"}
}
boot();
})();
