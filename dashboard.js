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
community:[F('Community','Partner, Boost, Suggest und Giveaway.',['Partner-Kanal|partner|select','Boost-Kanal|boost-danke|select','Suggest-Kanal|suggest|select','Giveaway-Kanal|giveaway|select']),F('Interview','Interview-Fragen und Punkte.',['Interview-Log|interview-logs|select','Min. Punkte|0']),S('Community Module','',['Giveaway','Suggest'])],
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
const KEY_MAP={"Sprache": "language", "System-Name": "systemName", "Log-Kanal": "logChannelId", "Zeitzone": "timezone", "Admin-Rolle": "adminRoleIds", "Staff-Rolle": "staffRoleIds", "Mod-Rolle": "modRoleIds", "IC Panel Zugriff": "ingameAccessRoleIds", "Database Manager": "databaseManagerRoleIds", "Frak-Verwaltung": "factionManageRoleIds", "Partner Manager": "partnerManagerRoleIds", "HighTeam": "highTeamRoleIds", "Ticket-Panel-Kanal": "ticketPanelChannelId", "Ticket-Log": "ticketLogChannelId", "Ticket-Kategorie": "ticketCategoryId", "Support-Rolle": "ticketSupportRoleIds", "Ticket-Blacklist-Rolle": "ticketBlacklistRoleIds", "Warteraum Voice": "warteraumVoiceChannelId", "Support-Textkanal": "supportTextChannelId", "Warteraum-Musik": "warteraumMusicEnabled", "Musik-Preset": "warteraumMusicPreset", "Join-to-Create Support-VCs": "supportJoinToCreate", "Support-VC Kategorie": "supportVcCategoryId", "Admin-Call-Panel": "adminCallPanelChannelId", "Admin-Call-Log": "adminCallLogChannelId", "Büro-Warteraum": "officeWaitingChannelId", "Büro-Bereitschafts-Rolle": "officePingRoleIds", "Bewerbungs-Panel": "bewerbungPanelChannelId", "Bewerbungs-Log": "appLogChannelId", "Rolle bei Annahme": "applicationAcceptRoleIds", "Teamliste-Kanal": "teamlistChannelId", "Rollen in Teamliste": "teamlistRoleIds", "Duty-Panel": "dutyPanelChannelId", "Duty-Rolle": "dutyRoleIds", "Rollen bei Invite": "teamInviteRoleIds", "Rollen bei Kick entfernen": "teamKickRoleIds", "Team Invite/Kick Log": "teamLogChannelId", "Team-Warns bis Kick": "teamWarnsUntilKick", "Abmelde-Panel": "abmeldungPanelChannelId", "Abmelde-Log": "abmeldungLogChannelId", "Abmeldung muss bestätigt werden": "abmeldungRequireApproval", "Feedback-Kanal": "feedbackChannelId", "Feedback-Log": "feedbackLogChannelId", "Activity-Check-Kanal": "activityCheckChannelId", "Aufgaben-Panel": "tasksPanelChannelId", "Aufgaben-Log": "tasksLogChannelId", "Database-Panel": "databasePanelChannelId", "Fraktions-Announce": "factionAnnounceChannelId", "Fraktions-Log": "factionLogChannelId", "Hausliste-Kanal": "hauslisteChannelId", "Mod-Log": "modLogChannelId", "AutoMod-Log": "autoModLogChannelId", "Strafregister-Log": "recordsLogChannelId", "Security-Log": "securityLogChannelId", "Welcome-Kanal": "welcomeChannelId", "Leave-Kanal": "leaveChannelId", "Auto-Rolle": "autoRoleIds", "Verify-Kanal": "verifyChannelId", "Verify-Rolle": "verifyRoleIds", "Unverified-Rolle": "unverifiedRoleId", "Partner-Kanal": "partnerChannelId", "Boost-Kanal": "boostChannelId", "Suggest-Kanal": "suggestChannelId", "Giveaway-Kanal": "giveawayChannelId", "Uprank-Announce": "xpUprankChannelId", "Uprank Zeitraum": "xpUprankDays", "RP Announce": "rpAnnounceChannelId", "Server-Stats Kanal": "serverStatsChannelId", "System-Log": "logChannelId", "Partner-Log": "partnerLogChannelId", "Ausweis-Kanal": "ausweisChannelId", "Ausweis-Log": "ausweisLogChannelId", "Max. Zusatz-Ausweise": "ausweisMaxExtra", "Appeals aktiv": "unbanRequestEnabled", "Nur bei aktivem Ban": "unbanRequireActiveBan", "Appeal-Log": "unbanRequestChannelId", "Dizzy-Control-Kanal": "ingameDizzyChannelId", "Dizzy-Log-Kanal": "dizzyLogChannelId", "IC Log": "ingameBanLogChannelId", "IC Mod-Rolle": "ingameModRoleIds", "IC Access Rolle": "ingameAccessRoleIds"};
const MODULE_MAP={"Tickets": "tickets", "Warteraum": "warteraum", "Admin Call": "adminCall", "Büros": "offices", "Duty": "duty", "Bewerbungen": "applications", "Teamverwaltung": "team", "Security": "security", "AutoMod": "automod", "XP": "xp", "Verify": "verify", "Welcome/Leave": "welcomeLeave", "Partner": "partner", "Fraktionen": "factions", "Ausweis": "ausweis", "Feedback": "feedback", "Aufgaben": "tasks", "Database": "database", "Abmeldung": "abmeldung", "Giveaway": "giveaway", "Suggest": "suggest", "Modul aktiv": "dizzy", "XP aktiv": "xp", "XP Ticket übernehmen": "xpTicketClaim", "XP Voice / Support": "xpVoice", "XP Feedback gut": "xpFeedback"};
const PANEL_CHANNEL={"tickets": "ticketPanelChannelId", "adminCall": "adminCallPanelChannelId", "applications": "bewerbungPanelChannelId", "duty": "dutyPanelChannelId", "feedback": "feedbackChannelId", "tasks": "tasksPanelChannelId", "database": "databasePanelChannelId", "teamlist": "teamlistChannelId", "abmeldung": "abmeldungPanelChannelId", "verify": "verifyChannelId", "hausliste": "hauslisteChannelId", "serverStats": "serverStatsChannelId", "ausweis": "ausweisPanelChannelId", "dizzySticky": "ingameDizzyChannelId"};
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
function formatMembers(n){
  if (n == null || n === '' || isNaN(Number(n))) return '';
  return Number(n).toLocaleString('de-DE') + ' Mitglieder';
}
function setServerMeta(g){
  if (!g) return;
  const name = g.name || g.id || 'Server';
  const sn = $('serverName');
  if (sn) sn.textContent = name;
  const btn = $('serverButton');
  if (btn) {
    let small = btn.querySelector('small');
    if (!small) {
      const grow = btn.querySelector('.grow');
      if (grow) { small = document.createElement('small'); grow.appendChild(small); }
    }
    if (small) {
      const mc = g.memberCount != null ? formatMembers(g.memberCount) : '';
      small.textContent = mc ? (mc + ' · Online') : 'Online';
    }
    const iconEl = btn.querySelector('.server-icon');
    if (iconEl) {
      if (g.icon) {
        iconEl.innerHTML = '<img src="'+escapeHtml(g.icon)+'" alt="" style="width:100%;height:100%;border-radius:inherit;object-fit:cover">';
      } else {
        iconEl.textContent = (name||'S').charAt(0).toUpperCase();
      }
    }
  }
  const hint = $('serverHint');
  if (hint) hint.textContent = name + ' · Einstellungen gelten nur für diesen Server.';
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
    const mods = state.modules || state.settings.modules || {};
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
  state.currentCat = id;
  document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('active',x.dataset.cat===id));
  const empty=$('empty');
  if(empty){ empty.classList.add('hidden'); empty.style.display='none'; }
  const panel=$('settingsPanel');
  if(!panel) return;
  panel.classList.remove('hidden');
  panel.style.display='block';

  let banner = '';
  if(!API || !API.getToken()){
    banner = `<div class="login-banner glass"><div><b>Discord Login nötig</b><p>Melde dich an, wähle deinen Server und speichere Einstellungen.</p></div><button type="button" class="btn btn-primary" id="bannerLogin">Mit Discord anmelden</button></div>`;
  } else if(!state.guildId){
    banner = `<div class="login-banner glass"><div><b>Server wählen</b><p>Wähle links oben deinen Server, damit Kanäle und Rollen geladen werden.</p></div><button type="button" class="btn btn-primary" id="bannerServer">Server wählen</button></div>`;
  }

  panel.innerHTML = banner + `<div class="settings-heading"><div><div class="breadcrumb">Server Control <span>/</span> ${escapeHtml(c[1])}</div><h2>${escapeHtml(c[1])}</h2><p>${escapeHtml(c[2])}</p></div><button class="btn btn-primary" id="saveAll" type="button">Speichern</button></div><div class="settings-grid">${(templates[id]||[]).map(renderCard).join('')}</div>`;

  const bl = $('bannerLogin');
  if(bl) bl.onclick = ()=> API.login(location.origin + '/dashboard/');
  const bs = $('bannerServer');
  if(bs) bs.onclick = ()=> { const p=$('serverPicker'); if(p) p.classList.add('open'); };

  const saveBtn = $('saveAll');
  if(saveBtn) saveBtn.onclick = () => saveCurrent();
  panel.querySelectorAll('.toggle').forEach(t=>{ t.onclick = () => t.classList.toggle('on'); });
  panel.querySelectorAll('.action-btn').forEach(b=>{ b.onclick = () => handleAction(b.dataset.action, id); });
  panel.querySelectorAll('.role-btn').forEach(b=>{ b.onclick = () => openRoleDrawer(b); });
}

async function handleAction(label, catId){
  if(!state.guildId){ toast('Error'); return; }
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
    const chKey = PANEL_CHANNEL[panel];
    let channelId = chKey ? (state.settings[chKey] || null) : null;
    // fallback: any selected channel on page
    if (!channelId) {
      const sel = document.querySelector('#settingsPanel select[data-key$="ChannelId"], #settingsPanel select[data-key*="Panel"], #settingsPanel select[data-key*="Channel"]');
      if (sel && sel.value) channelId = sel.value;
    }
    if (!channelId) {
      toast('Error');
      return;
    }
    toast('Sende…');
    await API.sendPanel(state.guildId, panel, channelId);
    toast('Gesendet');
  } catch (e) {
    toast('Error');
  }
}

function openRoleDrawer(btn){
  const d=$('drawer');
  const key = btn.dataset.key || KEY_MAP[btn.dataset.role] || '';
  state.currentRoleKey = key;
  $('drawerTitle').textContent = btn.dataset.role || 'Rollen';
  const current = getSetting(key, []);
  const selSet = new Set((Array.isArray(current)?current:[current]).filter(Boolean).map(String));
  const body = (state.roles||[]).filter(r=>r && r.managed !== true).map(r=>{
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
  if(!state.guildId){ toast('Error'); return; }
  const panel = $('settingsPanel');
  const partial = {};
  panel.querySelectorAll('[data-key]').forEach(el=>{
    const key = el.getAttribute('data-key');
    if(!key) return;
    if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
      let v = el.value;
      // empty string → null so bot clears optional fields
      if (v === '') v = null;
      // numeric-looking single ids stay strings
      partial[key] = v;
    }
  });
  // role arrays from drawer
  Object.keys(KEY_MAP).forEach(label=>{
    const k = KEY_MAP[label];
    if (Array.isArray(state.settings[k])) partial[k] = state.settings[k];
  });
  // modules separate endpoint
  const modules = Object.assign({}, state.modules || {});
  let hasModules = false;
  panel.querySelectorAll('[data-switch]').forEach(el=>{
    const k = el.getAttribute('data-switch');
    if(!k) return;
    const on = el.classList.contains('on');
    if (Object.values(MODULE_MAP).includes(k) || MODULE_MAP[el.getAttribute('data-label')]) {
      modules[k] = on;
      hasModules = true;
    } else {
      partial[k] = on;
    }
  });
  try {
    toast('Speichern…');
    const tasks = [];
    if (Object.keys(partial).length) tasks.push(API.patchSettings(state.guildId, partial));
    if (hasModules) tasks.push(API.patchModules(state.guildId, modules));
    const results = await Promise.all(tasks);
    const last = results[results.length - 1] || {};
    if (last.settings) state.settings = Object.assign({}, state.settings, last.settings);
    else state.settings = Object.assign({}, state.settings, partial);
    if (last.modules) state.modules = Object.assign({}, state.modules, last.modules);
    else if (hasModules) state.modules = modules;
    toast('Gespeichert');
  } catch (e) {
    toast('Error');
  }
}

async function loadGuild(gid, opts){
  opts = opts || {};
  state.guildId = String(gid);
  const gmeta = (state.guilds || []).find(x => String(x.id) === String(gid));
  if (gmeta) setServerMeta(gmeta);
  try {
    toast('…');
    const [cfg, disc] = await Promise.all([
      API.config(gid),
      API.discord(gid, !!opts.refresh)
    ]);
    state.config = cfg || {};
    // Bot returns { settings, modules, ... }
    state.settings = Object.assign({}, (cfg && cfg.settings) || {});
    state.modules = Object.assign({}, (cfg && cfg.modules) || {});
    state.channels = (disc && disc.channels) || [];
    state.roles = (disc && disc.roles) || [];
    // categories: type 4
    state.categories = state.channels.filter(c => {
      const t = c.type;
      return t === 4 || t === '4' || t === 'GUILD_CATEGORY' || Number(t) === 4;
    });
    state.channels = state.channels.filter(c => {
      const t = c.type;
      return !(t === 4 || t === '4' || t === 'GUILD_CATEGORY' || Number(t) === 4);
    });
    // Prefer text/announce for panel channel selects still includes voice for warteraum
    if (state.currentCat) openCategory(state.currentCat);
    else openCategory('allgemein');
    toast('OK');
  } catch (e) {
    toast('Error');
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
  list.innerHTML = guilds.map((g)=>{
    const name = g.name || g.id;
    const letter = (name||'S').charAt(0).toUpperCase();
    const sel = String(state.guildId) === String(g.id) ? ' selected' : '';
    const members = g.memberCount != null ? formatMembers(g.memberCount) : 'Mitglieder werden geladen…';
    const iconHtml = g.icon
      ? `<img src="${escapeHtml(g.icon)}" alt="" style="width:100%;height:100%;border-radius:inherit;object-fit:cover">`
      : escapeHtml(letter);
    return `<button type="button" class="server-row${sel}" data-id="${escapeHtml(String(g.id))}" data-server="${escapeHtml(name)}"><span class="server-icon">${iconHtml}</span><span class="grow"><b>${escapeHtml(name)}</b><small>${escapeHtml(members)}</small></span><span class="check">✓</span></button>`;
  }).join('');
  list.querySelectorAll('.server-row').forEach(x=>{
    x.onclick = async ()=>{
      list.querySelectorAll('.server-row').forEach(y=>y.classList.remove('selected'));
      x.classList.add('selected');
      const id = x.dataset.id;
      const gmeta = (state.guilds||[]).find(g => String(g.id) === String(id));
      setServerMeta(gmeta || { id, name: x.dataset.server });
      $('serverPicker').classList.remove('open');
      await loadGuild(id, { refresh: true });
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
  // Always show first category so main is never empty
  openCategory(state.currentCat || 'allgemein');

  if(!API){ toast('Error'); return; }
  API.readToken();

  if(!API.getToken()){
    const su = document.querySelector('.side-user');
    if(su){
      su.innerHTML = `<button type="button" class="btn btn-primary" id="loginBtn" style="width:100%">Mit Discord anmelden</button>`;
      const lb = $('loginBtn');
      if(lb) lb.onclick = ()=> API.login(location.origin + '/dashboard/');
    }
    // refresh category banner
    openCategory(state.currentCat || 'allgemein');
    return;
  }

  try {
    const me = await API.me();
    state.user = me;
    const name = me.username || me.global_name || 'User';
    const su = document.querySelector('.side-user');
    if(su){
      const letter = (name||'U').charAt(0).toUpperCase();
      const av = me.avatar
        ? `<span class="avatar" style="background-image:url(${me.avatar});background-size:cover"></span>`
        : `<span class="avatar">${letter}</span>`;
      su.innerHTML = `${av}<span class="grow"><b>${escapeHtml(name)}</b><small>eingeloggt</small></span><button type="button" class="btn" id="logoutBtn" style="padding:6px 10px;font-size:11px">Logout</button>`;
      const lo = $('logoutBtn');
      if(lo) lo.onclick = ()=>{ API.logout(); location.reload(); };
    }
  } catch(e){
    toast('Error');
    API.logout();
    const su = document.querySelector('.side-user');
    if(su){
      su.innerHTML = `<button type="button" class="btn btn-primary" id="loginBtn" style="width:100%">Mit Discord anmelden</button>`;
      const lb = $('loginBtn');
      if(lb) lb.onclick = ()=> API.login(location.origin + '/dashboard/');
    }
    openCategory(state.currentCat || 'allgemein');
    return;
  }

  try {
    const g = await API.guilds(true);
    state.guilds = Array.isArray(g) ? g : ((g && (g.guilds || g.servers)) || []);
    renderServerList();
    if(state.guilds.length === 1){
      const g0 = state.guilds[0];
      setServerMeta(g0);
      await loadGuild(g0.id, { refresh: true });
      $('serverPicker') && $('serverPicker').classList.remove('open');
    } else if(state.guilds.length > 1){
      $('serverPicker') && $('serverPicker').classList.add('open');
      openCategory(state.currentCat || 'allgemein');
    } else {
      openCategory(state.currentCat || 'allgemein');
      toast('Error');
    }
  } catch(e){
    toast('Error');
    openCategory(state.currentCat || 'allgemein');
  }
}

document.addEventListener('DOMContentLoaded', boot);
