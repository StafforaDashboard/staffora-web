const C=[
['allgemein','Allgemein','Grunddaten für den Server'],
['module','Module','Alle Module einzeln an/aus'],
['dizzy','Dizzy Control','Roblox-Verknüpfungen und Staff-Bestätigung'],
['rights','Rollen & Rechte','Wer darf was'],
['tickets','Tickets & Support','Tickets, Warteraum, Admin Call, Büros'],
['applications','Bewerbungen','Bewerbungs-Panels und Annahmen'],
['team','Team','Teamliste, Duty, Invite/Kick, Abmeldung, Feedback'],
['clock','Schicht & Clock','Clock und Zeittracking'],
['tasks','Aufgaben','Aufgaben-Board und XP'],
['database','Database','Interne Einträge und Manager'],
['factions','Haus & Fraktionen','Fraktionen, Warns und Häuser'],
['moderation','Moderation','Moderations-Logs'],
['automod','AutoMod','Links, Invites, Caps, Spam'],
['records','Strafregister','Cases und Maßnahmen'],
['stats','Team-Stats','Support- und Team-Auswertung'],
['security','Security','Anti-Nuke, Anti-Raid, Backups'],
['welcome','Welcome / Leave','Join/Leave und Auto-Rolle'],
['verify','Verify','Verify-Gate und Rollen'],
['community','Community','Partner, Boost, Suggest, Giveaway'],
['xp','XP','XP und Uprank'],
['rp','RP','RP Announce und Server-Stats'],
['logs','Logs','Zentrale Log-Kanäle'],
['system','System','System-Name und Sprache'],
['partner','Partner','Partner-Kanal und interne Logs'],
['ausweis','Ausweis','ID-Kanal, Logs, Zusatz-Ausweise'],
['unban','Unban','Website Appeals und Appeal-Log'],
['ic','IC Panel','Zugriff und IC-Logs']
];
const GROUPS=[
['Server', ['allgemein','module','dizzy','rights']],
['Support & Team', ['tickets','applications','team','clock','tasks','database']],
['RP & Community', ['factions','moderation','automod','records','stats','welcome','verify','community','xp','rp']],
['System & Sicherheit', ['logs','security','system','partner']],
['Identität & IC', ['ausweis','unban','ic']]
];
const F=(title,desc,items)=>[title,desc,'fields',items]; const R=(title,desc,items)=>[title,desc,'roles',items]; const S=(title,desc,items)=>[title,desc,'switches',items]; const B=(title,desc,items)=>[title,desc,'buttons',items]; const A=(title,desc,items)=>[title,desc,'actions',items];
const templates={
allgemein:[F('Grunddaten','Grunddaten für den Server.',['Sprache|Deutsch|select','System-Name|Staffora Community','Log-Kanal|system-logs|select','Zeitzone|Europe/Berlin'])],
module:[S('Module','Jedes Modul einzeln an/aus. Aus = Feature läuft nicht, auch wenn Kanäle gesetzt sind.',['Tickets','Warteraum','Admin Call','Büros','Duty','Bewerbungen','Teamverwaltung','Security','AutoMod','XP','Verify','Welcome/Leave','Partner','Fraktionen','Ausweis','Feedback','Aufgaben','Database','Abmeldung','Giveaway','Suggest'])],
rights:[R('Zugriffsrollen','Wer darf was. Ohne passende Rollen greifen Commands/Panels nicht.',['Admin-Rolle','Staff-Rolle','Mod-Rolle','IC Panel Zugriff','Database Manager','Frak-Verwaltung','Partner Manager','HighTeam'])],
tickets:[F('Tickets & Support','Tickets, Warteraum, Admin Call und Büros.',['Ticket-Panel-Kanal|tickets|select','Ticket-Log|ticket-logs|select','Ticket-Kategorie|Support|select','Support-Rolle|Support|select','Ticket-Blacklist-Rolle|Ticket-Blacklist|select','Warteraum Voice|Warteraum|select','Support-Textkanal|support-alerts|select','Warteraum-Musik|Aus|select','Musik-Preset|DE|select','Join-to-Create Support-VCs|An|select','Support-VC Kategorie|Support VC|select','Admin-Call-Panel|admin-call|select','Admin-Call-Log|admin-call-logs|select','Büro-Warteraum|Büro Warteraum|select','Büro-Bereitschafts-Rolle|Büro Bereitschaft|select']),B('Panels','Panels in die gewählten Kanäle posten.',['Ticket-Panel senden','Admin-Call-Panel senden'])],
applications:[F('Bewerbungen','Bewerbungs-Panels und Annahmen.',['Bewerbungs-Panel|bewerbungen|select','Bewerbungs-Log|bewerbungs-logs|select','Rolle bei Annahme|Trial Staff|select']),B('Panel','Bewerbungs-Panel posten.',['Panel senden'])],
team:[F('Teamliste & Duty','Teamliste, Duty, Invite/Kick, Abmeldung, Feedback und Activity Check.',['Teamliste-Kanal|team|select','Rollen in Teamliste|Teamleitung, Admin, Moderator, Support','Duty-Panel|dienst|select','Duty-Rolle|Im Dienst|select','Rollen bei Invite|Trial Staff, Support|select','Rollen bei Kick entfernen|Trial Staff, Support|select','Team Invite/Kick Log|team-logs|select','Team-Warns bis Kick|3','Abmelde-Panel|abmeldung|select','Abmelde-Log|abmeldung-logs|select','Abmeldung muss bestätigt werden|An|select','Feedback-Log|feedback|select','Feedback als Sticky|An|select','Activity-Check Kanal|activity-check|select','Activity-Check Rollen|Team','Activity-Check Dauer|14 Tage','Activity-Check Text|Bitte Aktivität bestätigen.','Activity-Check Zeit|18:00']),B('Panels','Teamliste, Duty, Abmelde und Feedback.',['Teamliste Panel senden','Duty Panel senden','Abmelde Panel senden','Feedback Panel senden'])],
clock:[S('Schicht & Clock','Zeittracking und Schichtsystem.',['Clock aktiv']),F('Clock Log','Optionaler Log-Kanal.',['Clock-Log|clock-logs|select'])],
tasks:[F('Aufgaben','Aufgaben-Board.',['Aufgaben-Panel|tasks|select','XP für Aufgaben|25']),B('Panel','Aufgaben-Panel posten.',['Panel senden'])],
database:[F('Database','Interne Einträge, z.B. Teamsperre und permanente Flags.',['Database-Panel|database|select','Manager-Rolle|Database Manager|select']),B('Panel','Nur Panel-Funktionen.',['Panel senden'])],
factions:[F('Haus & Fraktionen','Fraktionen selbst konfigurieren — keine Memberverwaltung.',['Frak-Announce|fraktion-announce|select','Warns bis Remove|3','Hausliste-Kanal|hausliste|select','Haus-Ticket Kategorie|Haus-Käufe|select']),B('Hausliste','Hausliste posten.',['Hausliste senden'])],
moderation:[F('Moderation','Zentrale Moderations-Logs.',['Mod-Log|mod-logs|select','Warn-Log|warn-logs|select','Ban-Log|ban-logs|select'])],
automod:[S('AutoMod','Automatische Filter.',['Links blocken','Invites blocken','Caps-Filter','Spam-Filter']),F('AutoMod-Log','Log-Kanal für Filteraktionen.',['AutoMod-Log|automod-logs|select'])],
records:[F('Strafregister','Case- und Stufen-Logik.',['Strafregister-Log|record-logs|select','Beispiel Stufe 1|1 Warn','Beispiel Stufe 2|2 Kick','Beispiel Stufe 3|3 Ban'])],
stats:[['Support-Statistik','Übersicht über Aktionen, offene Tickets und aktive Staff.','stats','842|Support-Anfragen|317|Tickets|89|Admin Calls|24|Aktive Supporter'],['Supporter-Ranking','Wer die meisten Support-Anfragen bearbeitet hat.','table',''],['Alle Support-Anfragen','Durchsuchbare Support-Anfragen mit Supporter, Kategorie, Status und Zeit.','actions','Anfragen öffnen|Exportieren'],['Support-Verlauf','Tickets, Warteraum und Admin Calls nach Zeitraum.','chart','']],
security:[S('Security','Schutz vor Nuke und Raids.',['Anti-Nuke','Anti-Raid']),S('Externe Apps','Externe Apps deaktivieren.',['Externe Apps deaktivieren']),F('Security Logs & Backup','Security-Logs und Backup-Zugriff.',['Security-Log|security-logs|select','Main-Log|system-logs|select','Backup Whitelist-Rolle|Security Whitelist|select'])],
welcome:[F('Welcome / Leave','Join-/Leave-Nachrichten und Auto-Rolle.',['Welcome-Kanal|welcome|select','Welcome-Text|Willkommen {user} auf {server}!','Leave-Kanal|leave|select','Leave-Text|{user} hat den Server verlassen.','Auto-Rolle|Verified|select'])],
verify:[F('Verify','Verify-Gate und Rollen.',['Verify-Kanal|verify|select','Verified-Rolle|Verified|select','Unverified-Rolle|Unverified|select']),B('Panel','Verify-Panel posten.',['Panel senden'])],
community:[F('Community','Partner, Boost, Suggest und Giveaway.',['Partner-Kanal|partner|select','Boost-Kanal|boost-danke|select','Suggest-Kanal|suggest|select','Giveaway-Kanal|giveaway|select'])],
xp:[S('XP','XP-Master-Schalter und Aktionen.',['XP aktiv','XP Ticket übernehmen','XP Voice / Support','XP Feedback gut']),F('Uprank','Rank-Ups und Zeitraum.',['Uprank-Announce|xp-uprank|select','Uprank Zeitraum|7 Tage|select'])],
rp:[F('RP','Start/Stop und Ingame-Stats.',['RP Announce|rp-announce|select','Server-Stats Kanal|server-stats|select']),B('Stats Panel','Server-Stats Panel posten.',['Stats-Panel senden'])],
logs:[F('Zentrale Logs','Zentrale Log-Kanäle, die mit anderen Tabs überschneiden können.',['System-Log|system-logs|select','Mod-Log|mod-logs|select','Ticket-Log|ticket-logs|select','Security-Log|security-logs|select'])],
system:[F('System','System-Name und Sprache.',['System-Name|Staffora Community','Sprache|Deutsch|select'])],
partner:[F('Partner','Partner-Anzeige und interne Logs.',['Partner-Kanal|partner|select','Partner-Log|partner-logs|select'])],
ausweis:[F('Ausweis','Ausweis-System.',['Ausweis-Kanal|ausweis|select','Ausweis-Log|ausweis-logs|select','Max. Zusatz-Ausweise|3']),B('Panel','Ausweis-Panel posten.',['Panel senden'])],
unban:[F('Unban','Website Ban Appeal.',['Appeals aktiv|An|select','Nur bei aktivem Ban|An|select','Appeal-Log|appeal-logs|select'])],
dizzy:[S('Dizzy Control','User schreiben ihren Roblox-Namen in den Control-Kanal; Staff bestätigt die erkannte Verknüpfung.', ['Modul aktiv']),F('Dizzy Control','Kanal und Rechte für Roblox-Verknüpfungen.',['Dizzy-Control-Kanal|dizzy-control|select','Dizzy-Log-Kanal|dizzy-logs|select']),R('Bestätigung','Nur diese Rolle darf eine Verknüpfung mit „Complete“ bestätigen.',['Staff-Rolle']),B('Sticky','Sticky-Nachricht im Control-Kanal setzen bzw. neu setzen.',['Sticky senden']),F('Ablauf','Nach dem Namen prüft der Bot die Verknüpfung und zeigt das Roblox-Profil. Staff bestätigt; danach wird das Control-Embed nach kurzer Zeit entfernt, während das Sticky bleibt bzw. neu gesetzt wird. User-Nachrichten bleiben mit Reaktion erhalten.',['Control-Embed Bereinigung|Nach Bestätigung|select','User-Nachrichten|Bleiben mit Reaktion|select'])],
ic:[R('IC Panel Zugriff','Wer die IC-Seite nutzen darf.',['IC Access Rolle']),F('IC Logs & Moderation','Logs und Rechte für IC-Aktionen.',['IC Log|ic-logs|select','IC Mod-Rolle|IC Moderator|select'])]
};
const KEY_MAP={"Sprache": "language", "System-Name": "systemName", "Log-Kanal": "systemLogChannelId", "Zeitzone": "timezone", "Admin-Rolle": "adminRoleIds", "Staff-Rolle": "staffRoleIds", "Mod-Rolle": "modRoleIds", "IC Panel Zugriff": "icAccessRoleIds", "Database Manager": "databaseManagerRoleIds", "Frak-Verwaltung": "factionManageRoleIds", "Partner Manager": "partnerManagerRoleIds", "HighTeam": "highTeamRoleIds", "Ticket-Panel-Kanal": "ticketPanelChannelId", "Ticket-Log": "ticketLogChannelId", "Ticket-Kategorie": "ticketCategoryId", "Support-Rolle": "supportRoleIds", "Ticket-Blacklist-Rolle": "ticketBlacklistRoleIds", "Warteraum Voice": "warteraumVoiceChannelId", "Support-Textkanal": "supportTextChannelId", "Warteraum-Musik": "warteraumMusicEnabled", "Musik-Preset": "warteraumMusicPreset", "Join-to-Create Support-VCs": "supportJoinToCreate", "Support-VC Kategorie": "supportVcCategoryId", "Admin-Call-Panel": "adminCallPanelChannelId", "Admin-Call-Log": "adminCallLogChannelId", "Büro-Warteraum": "officeWaitingVoiceId", "Büro-Bereitschafts-Rolle": "officeReadyRoleIds", "Bewerbungs-Panel": "applicationPanelChannelId", "Bewerbungs-Log": "applicationLogChannelId", "Rolle bei Annahme": "applicationAcceptRoleIds", "Teamliste-Kanal": "teamlistChannelId", "Rollen in Teamliste": "teamlistRoleIds", "Duty-Panel": "dutyPanelChannelId", "Duty-Rolle": "dutyRoleIds", "Rollen bei Invite": "teamInviteRoleIds", "Rollen bei Kick entfernen": "teamKickRoleIds", "Team Invite/Kick Log": "teamLogChannelId", "Team-Warns bis Kick": "teamWarnsUntilKick", "Abmelde-Panel": "abmeldungPanelChannelId", "Abmelde-Log": "abmeldungLogChannelId", "Abmeldung muss bestätigt werden": "abmeldungRequireApproval", "Feedback-Kanal": "feedbackChannelId", "Feedback-Log": "feedbackLogChannelId", "Activity-Check-Kanal": "activityCheckChannelId", "Aufgaben-Panel": "tasksPanelChannelId", "Aufgaben-Log": "tasksLogChannelId", "Database-Panel": "databasePanelChannelId", "Fraktions-Announce": "factionAnnounceChannelId", "Fraktions-Log": "factionLogChannelId", "Hausliste-Kanal": "hauslisteChannelId", "Mod-Log": "modLogChannelId", "AutoMod-Log": "automodLogChannelId", "Strafregister-Log": "recordsLogChannelId", "Security-Log": "securityLogChannelId", "Welcome-Kanal": "welcomeChannelId", "Leave-Kanal": "leaveChannelId", "Auto-Rolle": "autoRoleIds", "Verify-Kanal": "verifyChannelId", "Verify-Rolle": "verifiedRoleIds", "Unverified-Rolle": "unverifiedRoleIds", "Partner-Kanal": "partnerChannelId", "Boost-Kanal": "boostChannelId", "Suggest-Kanal": "suggestChannelId", "Giveaway-Kanal": "giveawayChannelId", "Uprank-Announce": "xpUprankChannelId", "Uprank Zeitraum": "xpUprankDays", "RP Announce": "rpAnnounceChannelId", "Server-Stats Kanal": "serverStatsChannelId", "System-Log": "systemLogChannelId", "Partner-Log": "partnerLogChannelId", "Ausweis-Kanal": "ausweisChannelId", "Ausweis-Log": "ausweisLogChannelId", "Max. Zusatz-Ausweise": "ausweisMaxExtra", "Appeals aktiv": "unbanAppealsEnabled", "Nur bei aktivem Ban": "unbanRequireActiveBan", "Appeal-Log": "appealLogChannelId", "Dizzy-Control-Kanal": "dizzyControlChannelId", "Dizzy-Log-Kanal": "dizzyLogChannelId", "IC Log": "icLogChannelId", "IC Mod-Rolle": "icModRoleIds", "IC Access Rolle": "icAccessRoleIds", "Control-Embed Bereinigung": "dizzyCleanupMode", "User-Nachrichten": "dizzyKeepUserMessages"};
const MODULE_MAP={"Tickets": "tickets", "Warteraum": "warteraum", "Admin Call": "adminCall", "Büros": "offices", "Duty": "duty", "Bewerbungen": "applications", "Teamverwaltung": "team", "Security": "security", "AutoMod": "automod", "XP": "xp", "Verify": "verify", "Welcome/Leave": "welcomeLeave", "Partner": "partner", "Fraktionen": "factions", "Ausweis": "ausweis", "Feedback": "feedback", "Aufgaben": "tasks", "Database": "database", "Abmeldung": "abmeldung", "Giveaway": "giveaway", "Suggest": "suggest", "Modul aktiv": "dizzy", "XP aktiv": "xp", "XP Ticket übernehmen": "xpTicketClaim", "XP Voice / Support": "xpVoice", "XP Feedback gut": "xpFeedback"};
const PANEL_MAP={"Ticket-Panel senden": "tickets", "Admin-Call-Panel senden": "adminCall", "Sticky senden": "dizzySticky", "Stats-Panel senden": "serverStats", "Duty-Panel senden": "duty", "Feedback-Panel senden": "feedback", "Aufgaben-Panel senden": "tasks", "Database-Panel senden": "database", "Teamliste senden": "teamlist", "Abmelde-Panel senden": "abmeldung", "Verify-Panel senden": "verify", "Hausliste senden": "hausliste"};

const API = window.StafforaAPI;
let state = {
  guildId: null, guilds: [], config: {}, settings: {},
  channels: [], roles: [], categories: [], user: null,
  currentCat: null, currentRoleKey: null
};

function toast(msg){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}
function $(id){ return document.getElementById(id); }
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
function getSetting(key, fallback){
  const s = state.settings || {};
  if (s[key] !== undefined && s[key] !== null && s[key] !== '') return s[key];
  return fallback;
}
function channelOptions(selected){
  const opts = ['<option value="">—</option>'];
  (state.channels||[]).forEach(c=>{
    const sel = String(c.id)===String(selected) ? ' selected' : '';
    opts.push(`<option value="${c.id}"${sel}># ${escapeHtml(c.name||c.id)}</option>`);
  });
  return opts.join('');
}
function roleOptions(selected){
  const opts = ['<option value="">—</option>'];
  const selSet = new Set(Array.isArray(selected)?selected.map(String): selected?[String(selected)]:[]);
  (state.roles||[]).forEach(r=>{
    if(r.managed) return;
    const sel = selSet.has(String(r.id)) ? ' selected' : '';
    opts.push(`<option value="${r.id}"${sel}>@ ${escapeHtml(r.name||r.id)}</option>`);
  });
  return opts.join('');
}
function categoryOptions(selected){
  const opts = ['<option value="">—</option>'];
  (state.categories||[]).forEach(c=>{
    const sel = String(c.id)===String(selected) ? ' selected' : '';
    opts.push(`<option value="${c.id}"${sel}>${escapeHtml(c.name||c.id)}</option>`);
  });
  return opts.join('');
}
function detectFieldKind(label, typeHint){
  const l = label.toLowerCase();
  if (typeHint === 'select') {
    if (/rolle|role|zugriff|manager|highteam|bereitschaft|blacklist|staff|mod|admin|ic access|ic mod/.test(l)) return 'role';
    if (/kategorie|category|vc kategorie|ticket-kategorie/.test(l) && !/kanal/.test(l)) return 'category';
    if (/kanal|channel|voice|panel|log|warteraum|announce|stats|sticky|control/.test(l)) return 'channel';
  }
  return typeHint || 'text';
}
function fieldValueForLabel(label){
  const key = KEY_MAP[label];
  if (!key) return '';
  return getSetting(key, '');
}
function isOnLabel(label){
  if (MODULE_MAP[label]) {
    const k = MODULE_MAP[label];
    const mods = state.settings.modules || {};
    if (typeof mods === 'object' && mods[k] !== undefined) return !!mods[k];
    return true;
  }
  const key = KEY_MAP[label];
  if (key) {
    const v = getSetting(key, null);
    if (v === true || v === 'An' || v === 'on' || v === '1') return true;
    if (v === false || v === 'Aus' || v === 'off' || v === '0') return false;
  }
  return true;
}

function renderCard([title,desc,type,items]){
  let body='';
  if(type==='fields'){
    body = items.map(raw=>{
      const parts = String(raw).split('|');
      const label = parts[0];
      const def = parts[1]||'';
      const hint = parts[2]||'text';
      const key = KEY_MAP[label] || '';
      const kind = detectFieldKind(label, hint);
      let val = fieldValueForLabel(label);
      if (val === '' || val === null || val === undefined) val = def;
      let control = '';
      if (kind === 'channel') {
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}">${channelOptions(val && /^\d+$/.test(String(val)) ? val : '')}</select>`;
      } else if (kind === 'role') {
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}">${roleOptions(val)}</select>`;
      } else if (kind === 'category') {
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}">${categoryOptions(val && /^\d+$/.test(String(val)) ? val : '')}</select>`;
      } else if (hint === 'select') {
        const opts = String(def).split(',').map(o=>o.trim()).filter(Boolean);
        if (!opts.length) opts.push(def||'—');
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}"><option value="">—</option>${opts.map(o=>`<option value="${escapeHtml(o)}"${String(val)===o?' selected':''}>${escapeHtml(o)}</option>`).join('')}</select>`;
      } else {
        control = `<input data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}" value="${escapeHtml(val)}" placeholder="${escapeHtml(def)}">`;
      }
      return `<label class="setting-row"><span>${escapeHtml(label)}</span>${control}</label>`;
    }).join('');
  }
  if(type==='switches'){
    body = items.map(label=>{
      const modKey = MODULE_MAP[label] || KEY_MAP[label] || '';
      const on = isOnLabel(label);
      return `<div class="setting-row"><span>${escapeHtml(label)}</span><button type="button" class="toggle${on?' on':''}" data-switch="${escapeHtml(modKey||label)}" data-label="${escapeHtml(label)}"><i></i></button></div>`;
    }).join('');
  }
  if(type==='roles'){
    body = items.map(label=>{
      const key = KEY_MAP[label] || '';
      return `<button type="button" class="role-btn" data-role="${escapeHtml(label)}" data-key="${escapeHtml(key)}"><b>${escapeHtml(label)}</b><span>Rollen wählen ›</span></button>`;
    }).join('');
  }
  if(type==='buttons'||type==='actions'){
    body = `<div class="action-row">${items.map(label=>`<button type="button" class="btn action-btn" data-action="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join('')}</div>`;
  }
  if(type==='list') body = `<div class="list-box">${items.map(x=>`<div class="list-item">${x}</div>`).join('')}</div>`;
  if(type==='table') body=`<div class="table-wrap"><table><thead><tr><th>Member</th><th>XP</th><th>Tickets</th><th>Duty</th></tr></thead><tbody><tr><td colspan="4">—</td></tr></tbody></table></div>`;
  if(type==='chart') body=`<div class="chart-bars">${[42,68,51,79,63,88,71,94,77,83,69,98].map(v=>`<i style="height:${v}%"></i>`).join('')}</div>`;
  return `<article class="settings-card glass"><div class="card-head"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p></div><span class="card-chevron">›</span></div><div class="card-body">${body}</div></article>`;
}

function openCategory(id){
  const c=C.find(x=>x[0]===id);
  if(!c) return;
  if(!state.guildId){
    toast('Bitte zuerst einen Server wählen.');
    $('serverPicker') && $('serverPicker').classList.add('open');
    return;
  }
  state.currentCat = id;
  document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x.dataset.cat===id));
  const empty=$('empty');
  if(empty){ empty.classList.add('hidden'); empty.style.display='none'; }
  const panel=$('settingsPanel');
  panel.classList.remove('hidden');
  panel.style.display='block';
  // UI: c[1]=name, c[2]=desc (reference style)
  panel.innerHTML=`<div class="settings-heading"><div><div class="breadcrumb">Server Control <span>/</span> ${escapeHtml(c[1])}</div><h2>${escapeHtml(c[1])}</h2><p>${escapeHtml(c[2])}</p></div><button class="btn btn-primary" id="saveAll" type="button">Speichern</button></div><div class="settings-grid">${(templates[id]||[]).map(renderCard).join('')}</div>`;
  $('saveAll').onclick = () => saveCurrent();
  panel.querySelectorAll('.toggle').forEach(t=>{ t.onclick = () => t.classList.toggle('on'); });
  panel.querySelectorAll('.action-btn').forEach(b=>{ b.onclick = () => handleAction(b.dataset.action, id); });
  panel.querySelectorAll('.role-btn').forEach(b=>{ b.onclick = () => openRoleDrawer(b); });
}

async function handleAction(label, catId){
  if(!state.guildId){ toast('Kein Server'); return; }
  let panel = PANEL_MAP[label];
  if(!panel){
    if (label.includes('Ticket')) panel = 'tickets';
    else if (label.includes('Admin')) panel = 'adminCall';
    else if (label.includes('Sticky')) panel = 'dizzySticky';
    else if (label.includes('Stats')) panel = 'serverStats';
    else if (label.includes('Duty')) panel = 'duty';
    else if (label.includes('Feedback')) panel = 'feedback';
    else if (label.includes('Aufgabe')) panel = 'tasks';
    else if (label.includes('Database')) panel = 'database';
    else if (label.includes('Teamlist') || label.includes('Teamliste')) panel = 'teamlist';
    else if (label.includes('Abmeld')) panel = 'abmeldung';
    else if (label.includes('Verify')) panel = 'verify';
    else if (label.includes('Haus')) panel = 'hausliste';
    else {
      const mapCat = { tickets:'tickets', applications:'applications', team:'duty', ausweis:'ausweis', tasks:'tasks', database:'database', rp:'serverStats', dizzy:'dizzySticky', verify:'verify', factions:'hausliste' };
      panel = mapCat[catId] || 'tickets';
    }
  }
  try {
    toast('Sende…');
    await API.sendPanel(state.guildId, panel, null);
    toast('Gesendet');
  } catch (e) {
    toast(e.message || 'Senden fehlgeschlagen');
  }
}

function openRoleDrawer(btn){
  const d=$('drawer');
  const key = btn.dataset.key || KEY_MAP[btn.dataset.role] || '';
  state.currentRoleKey = key;
  $('drawerTitle').textContent = btn.dataset.role || 'Rollen';
  const current = getSetting(key, []);
  const selSet = new Set((Array.isArray(current)?current:[current]).filter(Boolean).map(String));
  const body = (state.roles||[]).filter(r=>!r.managed).map(r=>{
    const on = selSet.has(String(r.id));
    return `<button type="button" class="setting-row role-pick" data-id="${r.id}" style="width:100%;text-align:left;${on?'border-color:#805dff;':''}"><b>@ ${escapeHtml(r.name)}</b>${on?' <span>✓</span>':''}</button>`;
  }).join('') || '<p>Keine Rollen geladen.</p>';
  $('drawerBody').innerHTML = body;
  d.classList.add('open');
  $('drawerBody').querySelectorAll('.role-pick').forEach(btn2=>{
    btn2.onclick = () => {
      const id = btn2.dataset.id;
      let arr = getSetting(state.currentRoleKey, []);
      if (!Array.isArray(arr)) arr = arr ? [arr] : [];
      arr = arr.map(String);
      if (arr.includes(id)) arr = arr.filter(x=>x!==id);
      else arr.push(id);
      state.settings[state.currentRoleKey] = arr;
      openRoleDrawer(btn);
    };
  });
}

async function saveCurrent(){
  if(!state.guildId){ toast('Kein Server'); return; }
  const panel = $('settingsPanel');
  const partial = {};
  panel.querySelectorAll('[data-key]').forEach(el=>{
    const key = el.getAttribute('data-key');
    if(!key) return;
    if (el.tagName === 'SELECT' || el.tagName === 'INPUT') partial[key] = el.value;
  });
  const modules = Object.assign({}, state.settings.modules || {});
  panel.querySelectorAll('[data-switch]').forEach(el=>{
    const k = el.getAttribute('data-switch');
    if(!k) return;
    const on = el.classList.contains('on');
    if (Object.values(MODULE_MAP).includes(k) || MODULE_MAP[el.getAttribute('data-label')]) modules[k] = on;
    else partial[k] = on;
  });
  if (Object.keys(modules).length) partial.modules = modules;
  Object.keys(KEY_MAP).forEach(label=>{
    const k = KEY_MAP[label];
    if (Array.isArray(state.settings[k])) partial[k] = state.settings[k];
  });
  try {
    toast('Speichern…');
    const res = await API.patchSettings(state.guildId, partial);
    state.settings = Object.assign({}, state.settings, (res && res.settings) || partial);
    toast('Gespeichert');
  } catch (e) {
    toast(e.message || 'Speichern fehlgeschlagen');
  }
}

async function loadGuild(gid){
  state.guildId = gid;
  try {
    const [cfg, disc] = await Promise.all([
      API.config(gid).catch(()=>({})),
      API.discord(gid).catch(()=>({}))
    ]);
    state.config = cfg || {};
    state.settings = (cfg && (cfg.settings || cfg.config || cfg)) || {};
    if (state.settings.settings) state.settings = state.settings.settings;
    state.channels = (disc && disc.channels) || [];
    state.roles = (disc && disc.roles) || [];
    state.categories = (disc && disc.categories) || [];
    if (!state.categories.length && state.channels.length) {
      state.categories = state.channels.filter(c => c.type === 4 || c.type === 'GUILD_CATEGORY');
      state.channels = state.channels.filter(c => c.type !== 4 && c.type !== 'GUILD_CATEGORY');
    }
    if (state.currentCat) openCategory(state.currentCat);
    else openCategory('allgemein');
  } catch (e) {
    toast(e.message || 'Laden fehlgeschlagen');
  }
}

function renderServerList(){
  const list = $('serverList');
  if(!list) return;
  const guilds = state.guilds || [];
  if(!guilds.length){
    list.innerHTML = '<p style="padding:12px;color:#9aa">Keine Server gefunden.</p>';
    return;
  }
  list.innerHTML = guilds.map((g,i)=>{
    const name = g.name || g.id;
    const icon = (name||'S').charAt(0).toUpperCase();
    const sel = state.guildId === g.id ? ' selected' : '';
    return `<button type="button" class="server-row${sel}" data-id="${g.id}" data-server="${escapeHtml(name)}"><span class="server-icon">${escapeHtml(icon)}</span><span class="grow"><b>${escapeHtml(name)}</b><small>${g.memberCount?g.memberCount+' Mitglieder':''}</small></span><span class="check">✓</span></button>`;
  }).join('');
  list.querySelectorAll('.server-row').forEach(x=>{
    x.onclick = async ()=>{
      list.querySelectorAll('.server-row').forEach(y=>y.classList.remove('selected'));
      x.classList.add('selected');
      const id = x.dataset.id;
      const name = x.dataset.server;
      $('serverName').textContent = name;
      const hint = $('serverHint');
      if(hint) hint.textContent = name + ' · Einstellungen gelten nur für diesen Server.';
      $('serverPicker').classList.remove('open');
      await loadGuild(id);
      toast('Server: ' + name);
    };
  });
}

function buildNav(){
  const nav = $('categories');
  if(!nav) return;
  // GROUPS structure from reference
  if (typeof GROUPS !== 'undefined' && GROUPS.length) {
    nav.innerHTML = GROUPS.map(([gname, ids])=>{
      const links = ids.map(id=>{
        const c = C.find(x=>x[0]===id);
        if(!c) return '';
        return `<button type="button" class="nav-link" data-cat="${c[0]}"><span class="nav-label">${escapeHtml(c[1])}</span></button>`;
      }).join('');
      return `<div class="nav-group"><div class="nav-group-title">${escapeHtml(gname)}</div>${links}</div>`;
    }).join('');
  } else {
    nav.innerHTML = C.map(c=>`<button type="button" class="nav-link" data-cat="${c[0]}"><span class="nav-label">${escapeHtml(c[1])}</span></button>`).join('');
  }
  nav.querySelectorAll('[data-cat]').forEach(x=>{
    x.onclick = ()=> openCategory(x.dataset.cat);
  });
}

function bindUi(){
  buildNav();
  const picker = $('serverPicker');
  const btn = $('serverButton');
  if(btn && picker) btn.onclick = ()=> picker.classList.toggle('open');
  const search = $('serverSearch');
  if(search){
    search.oninput = e=>{
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.server-row').forEach(x=>{
        x.style.display = (x.dataset.server||'').toLowerCase().includes(q) ? 'flex' : 'none';
      });
    };
  }
  const gs = $('globalSearch');
  if(gs){
    gs.oninput = e=>{
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.nav-link').forEach(x=>{
        x.style.display = x.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
      });
      document.querySelectorAll('.nav-group').forEach(g=>{
        g.style.display = [...g.querySelectorAll('.nav-link')].some(x=>x.style.display!=='none') ? 'block' : 'none';
      });
    };
  }
  const dc = $('drawerClose');
  if(dc) dc.onclick = ()=> $('drawer').classList.remove('open');
}

async function boot(){
  bindUi();
  if(!API){ toast('API fehlt'); return; }
  API.readToken();
  if(!API.getToken()){
    const su = document.querySelector('.side-user .grow');
    if(su){
      document.querySelector('.side-user').innerHTML = `<button type="button" class="btn btn-primary" id="loginBtn" style="width:100%">Mit Discord anmelden</button>`;
      $('loginBtn').onclick = ()=> API.login(location.origin + '/dashboard/');
    }
    toast('Bitte anmelden');
    $('serverPicker') && $('serverPicker').classList.add('open');
    return;
  }
  try {
    const me = await API.me();
    state.user = me;
    const name = me.username || me.global_name || 'User';
    document.querySelectorAll('.side-user b').forEach(el=>{ el.textContent = name; });
    document.querySelectorAll('.side-user small').forEach(el=>{ el.textContent = 'eingeloggt'; });
  } catch(e){
    toast(e.message || 'Session ungültig');
    API.logout();
    API.login(location.origin + '/dashboard/');
    return;
  }
  try {
    const g = await API.guilds();
    state.guilds = Array.isArray(g) ? g : (g.guilds || g.servers || []);
    renderServerList();
    $('serverPicker') && $('serverPicker').classList.add('open');
    if(state.guilds.length === 1){
      const g0 = state.guilds[0];
      $('serverName').textContent = g0.name || g0.id;
      await loadGuild(g0.id);
      $('serverPicker').classList.remove('open');
    }
  } catch(e){
    toast(e.message || 'Serverliste fehlgeschlagen');
  }
}

document.addEventListener('DOMContentLoaded', boot);
