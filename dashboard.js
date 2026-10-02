
async function ensureWebhookSetup(gid) {
  try {
    if (!gid || !window.API) return;
    const r = await (window.API.webhookSetup
      ? window.API.webhookSetup(gid)
      : window.API.get('/api/guilds/' + gid + '/ingame/webhook-setup'));
    if (!r || !r.ok) return;
    state.settings = state.settings || {};
    if (r.secret) state.settings.ingameWebhookSecret = r.secret;
    state._webhookUrl = r.url;
    state._webhookDetected = r.detected;
    let box = document.getElementById('webhook-setup-info');
    if (!box) {
      const host = document.getElementById('settingsForm') || document.getElementById('content') || document.body;
      box = document.createElement('div');
      box.id = 'webhook-setup-info';
      if (host.firstChild) host.insertBefore(box, host.firstChild);
      else host.appendChild(box);
    }
    box.innerHTML = '<div class="card" style="padding:12px;margin:8px 0;border:1px solid rgba(139,92,246,.35);border-radius:12px">' +
      '<div style="font-weight:600;margin-bottom:6px">Ingame Webhook</div>' +
      '<div style="font-size:12px;opacity:.85;word-break:break-all">URL: <code>' + (r.url||'') + '</code></div>' +
      '<div style="font-size:12px;opacity:.85;margin-top:4px">Secret: <code>' + (r.secret||'') + '</code></div>' +
      '<div style="font-size:12px;margin-top:4px">' + (r.detected ? 'Status: erkannt · aktiv' : 'Status: warte auf erstes Event') + '</div>' +
      '<div style="font-size:11px;opacity:.7;margin-top:6px">Playtime: player_join / player_leave / player_heartbeat an diese URL senden. Danach ist Tracking automatisch aktiv.</div></div>';
  } catch (e) { console.warn('webhook-setup', e); }
}

const C=[
['allgemein','Allgemein / General','Sprache und Grunddaten'],
['module','Module','Alle Module einzeln an/aus'],
['tickets','Tickets','Ticket-Arten, Panel, Fragen, Rechte'],
['warteraum','Warteraum','Voice-Support, Musik, Join2Create'],
['admincall','Admin Call','Panel, Fragen, Logs'],
['offices','Büros','Jedes Büro mit Warteraum und Bereitschaft'],
['applications','Bewerbungen','Mehrere Bewerbungen, Fragen, Blacklist'],
['teamlist','Teamliste','Rollen und Panel'],
['team','Teamverwaltung','Invite, Kick, Warns, Suspend, Logs'],
['duty','Duty & Clock','Duty-Panel, Rolle, Zeittracking'],
['abmeldung','Abmeldung','Panel, Log, Bestätigung'],
['feedback','Feedback','Panel, Log, Sticky'],
['tasks','Aufgaben','Panel, Manager, Permissions'],
['database','Database','Panel und Manager'],
['factions','Fraktionen','Announce, Log, Verwaltung'],
['houses','Häuser','Hausliste und Anzeige'],
['moderation','Moderation','Logs und Command-Permissions'],
['records','Strafregister','Gründe und Maßnahmen'],
['security','Security','Anti-Nuke, Anti-Raid, Externe Apps'],
['welcome','Welcome / Leave','Eigene Nachrichten und Kanäle'],
['verify','Verify','Gate, Rollen, Panel'],
['interview','Interview','Fragen und Punkte'],
['suggest','Suggest','Kanal und Rechte'],
['giveaway','Giveaway','Kanal und Rechte'],
['xp','XP','Quellen und Uprank'],
['rp','RP','Announce, Embed, Server-Stats'],
['partner','Partner','Kanal, Manager, Fragen'],
['ausweis','Ausweis','Kanal, Request, Annahme, Custom'],
['unban','Ban Appeal','Fragen, Log, Annahme'],
['dizzy','Dizzy Control','Roblox-Link und Sticky'],
['ic','IC Panel','Zugriff und Logs'],
['icmod','IC Moderation','Warn / Kick / Ban Panel + Log'],
['logs','Logs','Zentrale Log-Kanäle']
];
const GROUPS=[
['Server', ['allgemein','module','logs']],
['Support', ['tickets','warteraum','admincall','offices']],
['Team', ['teamlist','team','duty','abmeldung','feedback','tasks','interview']],
['Moderation', ['moderation','records','security','database','icmod']],
['Community', ['welcome','verify','suggest','giveaway','xp','partner']],
['RP & IC', ['factions','houses','rp','ausweis','unban','dizzy','ic']]
];
const F=(title,desc,items)=>[title,desc,'fields',items];
const R=(title,desc,items)=>[title,desc,'roles',items];
const S=(title,desc,items)=>[title,desc,'switches',items];
const B=(title,desc,items)=>[title,desc,'buttons',items];
const L=(title,desc,items)=>[title,desc,'listedit',items];

const templates={
allgemein:[
  F('Grunddaten','Sprache und Zeitzone.',['Sprache|de|select','Zeitzone|Europe/Berlin','Log-Kanal|system-logs|select'])
],
module:[
  S('Module','Aus = Feature läuft nicht und Kategorie wird ausgeblendet.',['Tickets','Warteraum','Admin Call','Büros','Duty','Bewerbungen','Teamverwaltung','Security','AutoMod','XP','Verify','Welcome/Leave','Partner','Fraktionen','Ausweis','Feedback','Aufgaben','Database','Abmeldung','Giveaway','Suggest','Interview','IC Panel','IC Moderation'])
],
tickets:[
  S('Modul','Tickets an/aus.',['Tickets']),
  F('Panel & Kanäle','Ticket-Panel und Logs.',['Ticket-Panel-Kanal|tickets|select','Ticket-Log|ticket-logs|select','Ticket-Kategorie|Support|select','Support-Rolle|Support|select','Ticket-Blacklist-Rolle|Ticket-Blacklist|select','Ticket-Panel-Titel|Erstelle hier ein Ticket','Ticket-Panel-Text|Klicke auf den Button, um ein Ticket zu öffnen.']),
  L('Ticket-Arten','Neue Ticket-Art mit Rollen, Kategorie und Embeds.',['ticketTypes']),
  L('Eröffnungsfragen','Frage vor dem Öffnen',['ticketOpenQuestions']),
  F('Limits','',['Ticket-Limit pro User|3','Ticket-Limit Fenster Stunden|24']),
  B('Panel','',['Ticket-Panel senden'])
],
warteraum:[
  S('Modul','',['Warteraum']),
  F('Support-Modus','',['Support-VC Modus|Bestehende Channels|enum']),
  F('Bestehende Channels','Nur bei Modus „Bestehende Channels“.',['Warteraum Voice|Warteraum|select','Support-Textkanal|support-alerts|select','Support-VC Kategorie|Support VC|select']),
  R('Support VCs','Mehrere feste Support-VCs und XP-Räume.',['Feste Support-VCs','Support-Räume mit XP']),
  F('Join2Create','Nur bei Modus „Join2Create“.',['Support-VC Kategorie|Support VC|select','Join-to-Create Support-VCs|An|enum']),
  F('Musik','Preset oder eigene Datei unten.',['Warteraum-Musik|An|enum','Musik-Preset|DE|enum']),
  F('Logs','',['Warteraum Claim-Log|warteraum-claim-logs|select'])
],
admincall:[
  S('Modul','',['Admin Call']),
  F('Panel & Log','',['Admin-Call-Panel|admin-call|select','Admin-Call-Log|admin-call-logs|select','Admin-Call Support-Rolle|Admin|select','Admin-Call Blacklist-Rolle|']),
  L('Admin-Call Fragen','',['adminCallQuestions']),
  B('Panel','',['Admin-Call-Panel senden'])
],
offices:[
  S('Modul','',['Büros']),
  L('Büros','Büro anlegen: Name, Warteraum, Beitritts-Rolle, Büro-VC.',['officesList']),
  F('Log','',['Büro-Log|office-logs|select'])
],
applications:[
  S('Modul','',['Bewerbungen']),
  F('Panel & Log','',['Bewerbungs-Panel|applications|select','Bewerbungs-Log|application-logs|select','Bewerbungs-Blacklist-Rolle|']),
  L('Bewerbungen','Format: Name | Accept-Rollen-ID',['applicationsList']),
  L('Fragen','',['applicationQuestions']),
  B('Panel','',['Bewerbungs-Panel senden'])
],
teamlist:[
  F('Teamliste','Titel und Kanal (kein Auto-Timer).',[
    'Teamliste-Kanal|teamlist|select',
    'Teamliste-Titel|Teamliste'
  ]),
  R('Rollen in der Liste','Reihenfolge = Discord-Hierarchie.',['Teamliste-Rollen']),
  B('Panel','',['Teamliste senden'])
],
team:[
  S('Modul','',['Teamverwaltung']),
  F('Logs','',['Team-Log|team-logs|select']),
  R('Rechte','',['Team Invite Rolle','Team Kick Rolle','Team Warn Rolle','Team Suspend Rolle']),
  F('Warns bis Kick','',['Team-Warns bis Auto-Kick|3'])
],
duty:[
  S('Modul','',['Duty']),
  F('Panel','Titel, Text und Kanal (GalaxyBot-Style Support-Bereitschaft).',[
    'Duty-Panel|duty|select',
    'Duty-Panel-Titel|Support-Bereitschaft',
    'Duty-Panel-Text|Trete die Supportbereitschaft an, um Benachrichtigungen zu neuen Support Fällen zu erhalten und diese übernehmen zu können. Nutze dafür den unteren Button.',
    'Duty-Rolle|On Duty|select'
  ]),
  F('Übernehmen nur mit Bereitschaft','Wenn An: nur User im Dienst können Tickets/Support übernehmen.',[
    'Duty Pflicht für Übernehmen|Aus|enum'
  ]),
  B('Panel','',['Duty-Panel senden'])
],
abmeldung:[
  S('Modul','',['Abmeldung']),
  F('Panel & Log','',['Abmelde-Panel|abmeldung|select','Abmelde-Log|abmeldung-logs|select','Abmeldung muss bestätigt werden|An|enum']),
  B('Panel','',['Abmelde-Panel senden'])
],
feedback:[
  S('Modul','',['Feedback']),
  F('Panel & Log','',['Feedback-Kanal|feedback|select','Feedback-Log|feedback-logs|select','Feedback als Sticky|Aus|enum']),
  B('Panel','',['Feedback-Panel senden'])
],
tasks:[
  S('Modul','',['Aufgaben']),
  F('Panel','',['Aufgaben-Panel|tasks|select']),
  R('Rechte','',['Aufgaben Manager','Aufgaben Claim']),
  B('Panel','',['Aufgaben-Panel senden'])
],
database:[
  S('Modul','',['Database']),
  F('Panel & Log','',['Database-Panel|database|select','Database-Log|database-logs|select']),
  R('Rechte','',['Database Manager']),
  F('Typen','Custom-Einträge über Panel: Teamsperre, Perm-Ban, Note, Custom + sticky Rollen.',[]),
  B('Panel','',['Database-Panel senden'])
],
factions:[
  S('Modul','',['Fraktionen']),
  F('Kanäle','',['Fraktions-Announce|faction-announce|select','Fraktions-Log|faction-logs|select']),
  R('Rechte','',['Frak-Verwaltung','Frak Manager']),
  L('Fraktions-Bewerbungsfragen','',['factionAppQuestions'])
],
houses:[
  F('Hausliste','',['Hausliste-Kanal|houses|select']),
  R('Rechte','',['Haus Manager']),
  B('Panel','',['Hausliste senden'])
],
moderation:[
  F('Logs','',['Mod-Log|mod-logs|select']),
  R('Command Rechte','',['Ban Rolle','Kick Rolle','Timeout Rolle','Warn Rolle','Softban Rolle']),
  B('Panel','Discord Mod-Panel senden',['Mod-Panel senden'])
],
records:[
  L('Strafgründe','Format: VDM | 1:warn,2:kick,3:ban',['modReasons']),
  F('Log','',['Strafregister-Log|records-logs|select'])
],
stats:[
  F('Stats','',['Stats Tickets|An|enum','Stats Support|An|enum','Stats Duty|An|enum'])
],
security:[
  S('Module','',['Security','Anti-Nuke','Anti-Raid']),
  F('Allgemein','',[
    'Security-Log|security-logs|select',
    'Security Standard-Aktion|Strip roles|enum',
    'Security Timeout Minuten|10',
    'Externe Apps deaktivieren|An|enum',
    'Anti-Nuke Fenster Sekunden|10'
  ]),
  R('Whitelist','',['Security Whitelist Rolle']),
  F('Anti-Nuke','Pro Modul An/Aus, Limit und Aktion.',[
    'Nuke Channel Delete|An|enum','Nuke Channel Delete Limit|3','Nuke Channel Delete Aktion|Strip roles|enum',
    'Nuke Channel Create|An|enum','Nuke Channel Create Limit|5','Nuke Channel Create Aktion|Strip roles|enum',
    'Nuke Role Delete|An|enum','Nuke Role Delete Limit|3','Nuke Role Delete Aktion|Strip roles|enum',
    'Nuke Role Create|An|enum','Nuke Role Create Limit|5','Nuke Role Create Aktion|Strip roles|enum',
    'Nuke Ban|An|enum','Nuke Ban Limit|3','Nuke Ban Aktion|Ban|enum',
    'Nuke Kick|An|enum','Nuke Kick Limit|5','Nuke Kick Aktion|Kick|enum',
    'Nuke Webhook|An|enum','Nuke Webhook Limit|2','Nuke Webhook Aktion|Remove|enum',
    'Nuke Bot Add|An|enum','Nuke Bot Add Limit|1','Nuke Bot Add Aktion|Kick|enum',
    'Nuke Integration|An|enum','Nuke Integration Limit|1','Nuke Integration Aktion|Remove|enum',
    'Nuke Guild Update|An|enum','Nuke Guild Update Limit|2','Nuke Guild Update Aktion|Strip roles|enum'
  ]),
  F('Anti-Raid','',[
    'Raid Join Wave|An|enum','Raid Join Limit|15','Raid Join Fenster|10','Raid Join Aktion|Kick|enum',
    'Raid Account Age|An|enum','Raid Min Account Tage|7','Raid Account Age Aktion|Kick|enum',
    'Raid Message Spam|An|enum','Raid Spam Limit|8','Raid Spam Fenster|5','Raid Spam Aktion|Timeout|enum',
    'Raid Mention Spam|An|enum','Raid Mention Limit|5','Raid Mention Aktion|Timeout|enum',
    'Raid Lockdown|An|enum'
  ])
],
welcome:[
  S('Modul','',['Welcome/Leave']),
  F('Kanäle','',['Welcome-Kanal|welcome|select','Leave-Kanal|leave|select']),
  F('Texte','Platzhalter: {user} {server} {memberCount}',['Welcome-Nachricht|Willkommen {user}!','Leave-Nachricht|{user} hat den Server verlassen.','Welcome Ping|Aus|enum'])
],
verify:[
  S('Modul','',['Verify']),
  F('Panel & Rollen','',['Verify-Kanal|verify|select']),
  R('Rollen','',['Verify Rolle geben','Unverified Rolle']),
  B('Panel','',['Verify-Panel senden'])
],
interview:[
  S('Modul','',['Interview']),
  L('Fragen','',['interviewQuestions']),
  F('Punkte','',['Interview Punkte Richtig|2','Interview Punkte Fast|1','Interview Punkte Falsch|0'])
],
suggest:[
  S('Modul','',['Suggest']),
  F('Kanal','',['Suggest-Kanal|suggestions|select']),
  R('Rechte','',['Suggest Einreichen Rolle','Suggest Annehmen Rolle']),
  L('Kategorien','z.B. Ingame, Discord, Team — Hinzufügen drücken',['suggestCategories'])
],
giveaway:[
  S('Modul','',['Giveaway']),
  F('Kanal','',['Giveaway-Kanal|giveaways|select']),
  R('Rechte','',['Giveaway Rolle'])
],
xp:[
  S('Modul','',['XP','XP Ticket übernehmen','XP Voice / Support','XP Feedback gut']),
  F('Uprank','',['XP Uprank Kanal|xp-uprank|select'])
],
rp:[
  F('Server Stats','Titel, Code, Owner, Online/Offline, Players.',[
    'Server-Stats Kanal|server-stats|select',
    'Stats Titel|Server Stats',
    'Server Name|Server',
    'Server Code|',
    'Server Online|An|enum',
    'Players|0',
    'Max Players|',
    'Owner Roblox|',
    'RP Announce|rp-announce|select'
  ]),
  B('Panel','',['Stats-Panel senden'])
],
partner:[
  S('Modul','',['Partner']),
  F('Kanal','',['Partner-Kanal|partners|select']),
  R('Rechte','',['Partner Manager']),
  L('Partner-Fragen','',['partnerQuestions']),
  B('Panel','',['Panel senden'])
],
ausweis:[
  S('Modul','',['Ausweis']),
  F('Kanäle','',['Ausweis-Kanal|ausweis|select','Ausweis-Log|ausweis-logs|select','Ausweis Request-Kanal|ausweis-request|select']),
  R('Rechte','',['Ausweis Annehmen Rolle']),
  L('Custom Ausweise','Eigene Ausweis-Arten mit Vorschau.',['customAusweise']),
  B('Panel','',['Ausweis-Panel senden'])
],
unban:[
  S('Modul','',['Appeals aktiv']),
  F('Appeal','',['Unban-Log|unban-logs|select','Appeals aktiv|An|enum','Nur bei aktivem Ban|An|enum']),
  L('Unban-Fragen','',['unbanQuestions']),
  R('Rechte','',['Unban Annehmen Rolle'])
],
dizzy:[
  S('Modul','',['Modul aktiv']),
  F('Kanal','',['Dizzy Control Kanal|dizzy|select','Dizzy Log|dizzy-logs|select']),
  B('Panel','',['Sticky senden'])
],
ic:[
  S('Modul','',['IC Panel']),
  R('Zugriff','',['IC Panel Zugriff','IC Mod-Rolle']),
  F('Log','',['IC Log|ic-logs|select'])
],
icmod:[
  S('Modul','',['IC Moderation']),
  F('Panel & Log','Discord-Panel für Warn/Kick/Tempban/Permban (sync mit IC).',['IC-Mod Panel|ic-mod|select','IC-Mod Log|ic-mod-logs|select']),
  R('Rechte','',['IC Mod-Rolle','IC Log Remove Rolle']),
  B('Panel','',['IC-Mod-Panel senden'])
],
logs:[
  F('Zentrale Logs','',['Log-Kanal|system-logs|select','Mod-Log|mod-logs|select','Ticket-Log|ticket-logs|select','Security-Log|security-logs|select'])
]
};

const KEY_MAP = {

  "Stats Titel":"serverStatsTitle","Server Name":"serverStatsServerName","Server Online":"serverStatsOnline",
  "Players":"serverStatsPlayers","Max Players":"serverStatsMaxPlayers","Owner Roblox":"serverStatsOwnerRoblox",
  "Ingame Webhook Log":"ingameWebhookChannelId",
  "Suggest Kategorien":"suggestCategories",
  "Nuke Channel Delete":"nukeChannelDeleteEnabled","Nuke Channel Delete Limit":"nukeChannelDeleteLimit","Nuke Channel Delete Aktion":"nukeChannelDeleteAction",
  "Nuke Channel Create":"nukeChannelCreateEnabled","Nuke Channel Create Limit":"nukeChannelCreateLimit","Nuke Channel Create Aktion":"nukeChannelCreateAction",
  "Nuke Role Delete":"nukeRoleDeleteEnabled","Nuke Role Delete Limit":"nukeRoleDeleteLimit","Nuke Role Delete Aktion":"nukeRoleDeleteAction",
  "Nuke Role Create":"nukeRoleCreateEnabled","Nuke Role Create Limit":"nukeRoleCreateLimit","Nuke Role Create Aktion":"nukeRoleCreateAction",
  "Nuke Ban":"nukeBanEnabled","Nuke Ban Limit":"nukeBanLimit","Nuke Ban Aktion":"nukeBanAction",
  "Nuke Kick":"nukeKickEnabled","Nuke Kick Limit":"nukeKickLimit","Nuke Kick Aktion":"nukeKickAction",
  "Nuke Webhook":"nukeWebhookEnabled","Nuke Webhook Limit":"nukeWebhookLimit","Nuke Webhook Aktion":"nukeWebhookAction",
  "Nuke Bot Add":"nukeBotAddEnabled","Nuke Bot Add Limit":"nukeBotAddLimit","Nuke Bot Add Aktion":"nukeBotAddAction",
  "Nuke Integration":"nukeIntegrationEnabled","Nuke Integration Limit":"nukeIntegrationLimit","Nuke Integration Aktion":"nukeIntegrationAction",
  "Nuke Guild Update":"nukeGuildUpdateEnabled","Nuke Guild Update Limit":"nukeGuildUpdateLimit","Nuke Guild Update Aktion":"nukeGuildUpdateAction",
  "Raid Join Wave":"raidJoinEnabled","Raid Join Limit":"raidJoinLimit","Raid Join Fenster":"raidJoinWindowSec","Raid Join Aktion":"raidJoinAction",
  "Raid Account Age":"raidAccountAgeEnabled","Raid Min Account Tage":"raidMinAccountDays","Raid Account Age Aktion":"raidAccountAgeAction",
  "Raid Message Spam":"raidSpamEnabled","Raid Spam Limit":"raidSpamLimit","Raid Spam Fenster":"raidSpamWindowSec","Raid Spam Aktion":"raidSpamAction",
  "Raid Mention Spam":"raidMentionEnabled","Raid Mention Limit":"raidMentionLimit","Raid Mention Aktion":"raidMentionAction",
  "Raid Lockdown":"raidLockdownEnabled","Anti-Nuke Fenster Sekunden":"antiNukeWindowSec",

  "Channel löschen":"antiNukeChannelDeleteAction","Channel erstellen":"antiNukeChannelCreateAction",
  "Rolle löschen":"antiNukeRoleDeleteAction","Rolle erstellen":"antiNukeRoleCreateAction",
  "Mass Ban":"antiNukeBanAction","Mass Kick":"antiNukeKickAction",
  "Webhook erstellen":"antiNukeWebhookAction","Bot hinzufügen":"antiNukeBotAddAction",
  "Integration hinzufügen":"antiNukeIntegrationAction",
  "Join-Spam":"antiRaidJoinAction","Message-Spam":"antiRaidSpamAction",
  "Mention-Spam":"antiRaidMentionAction","Emoji-Spam":"antiRaidEmojiAction",
  "Security Standard-Aktion":"antiNukeAction",

  "Team Suspend Rolle":"teamSuspendRoleIds","Frak Manager":"factionManagerRoleIds","Haus Manager":"houseManagerRoleIds",
  "Partner-Fragen":"partnerQuestions","IC-Mod Panel":"icModPanelChannelId","IC-Mod Log":"icModLogChannelId",
  "IC Log Remove Rolle":"icLogRemoveRoleIds","IC Moderation":"icModeration",
  "Aufgaben Manager":"tasksManagerRoleIds","Aufgaben Claim":"tasksClaimRoleIds",
  "Teamliste-Rollen":"teamlistRoleIds","Team Invite Rolle":"teamInviteRoleIds","Team Kick Rolle":"teamKickRoleIds",
  "Team Warn Rolle":"teamWarnRoleIds","Ban Rolle":"banRoleIds","Kick Rolle":"kickRoleIds","Timeout Rolle":"timeoutRoleIds",
  "Warn Rolle":"warnRoleIds","Softban Rolle":"softbanRoleIds","Security Whitelist Rolle":"securityWhitelistRoleIds",
  "Verify Rolle geben":"verifyRoleIds","Unverified Rolle":"unverifiedRoleIds","Suggest Annehmen Rolle":"suggestAcceptRoleIds",
  "Giveaway Rolle":"giveawayRoleIds","Ausweis Annehmen Rolle":"ausweisAcceptRoleIds","Unban Annehmen Rolle":"unbanAcceptRoleIds",
  "Büro-Log":"officeLogChannelId","Strafregister-Log":"recordsLogChannelId",
  "Sprache":"language","System-Name":"systemName","Log-Kanal":"logChannelId","Zeitzone":"timezone",
  "Admin-Rolle":"adminRoleIds","Staff-Rolle":"staffRoleIds","Mod-Rolle":"modRoleIds",
  "IC Panel Zugriff":"ingameAccessRoleIds","IC Access Rolle":"ingameAccessRoleIds","IC Mod-Rolle":"ingameModRoleIds","IC Log":"ingameLogChannelId",
  "Database Manager":"databaseManagerRoleIds","Frak-Verwaltung":"factionManageRoleIds","Partner Manager":"partnerManagerRoleIds","HighTeam":"highTeamRoleIds",
  "Ticket-Panel-Titel":"ticketPanelTitle","Ticket-Panel-Text":"ticketPanelText","Ticket-Panel-Kanal":"ticketPanelChannelId","Ticket-Log":"ticketLogChannelId","Ticket-Kategorie":"ticketCategoryId",
  "Support-Rolle":"ticketSupportRoleIds","Ticket-Blacklist-Rolle":"ticketBlacklistRoleIds",
  "Ticket-Limit pro User":"ticketLimitPerUser","Ticket-Limit Fenster Stunden":"ticketLimitWindowHours",
  "Warteraum Voice":"warteraumVoiceChannelId","Support-Textkanal":"supportTextChannelId",
  "Warteraum-Musik":"warteraumMusicEnabled","Musik-Preset":"warteraumMusicPreset",
  "Join-to-Create Support-VCs":"supportJoinToCreate","Support-VC Kategorie":"supportVcCategoryId",
  "Support-VC Modus":"supportVcMode","Feste Support-VCs":"supportFixedVoiceIds","Support-Räume mit XP":"supportXpVoiceIds",
  "Warteraum Claim-Log":"warteraumClaimLogChannelId",
  "Admin-Call-Panel":"adminCallPanelChannelId","Admin-Call-Log":"adminCallLogChannelId",
  "Admin-Call Support-Rolle":"adminCallSupportRoleIds","Admin-Call Blacklist-Rolle":"adminCallBlacklistRoleIds",
  "Büro-Warteraum":"officeWaitingChannelId","Büro-Bereitschafts-Rolle":"officePingRoleIds",
  "Bewerbungs-Panel":"bewerbungPanelChannelId","Bewerbungs-Log":"appLogChannelId","Rolle bei Annahme":"applicationAcceptRoleIds",
  "Bewerbungs-Blacklist-Rolle":"applicationBlacklistRoleIds",
  "Teamliste-Kanal":"teamlistChannelId","Rollen in Teamliste":"teamlistRoleIds",
  "Duty-Panel":"dutyPanelChannelId","Duty-Rolle":"dutyRoleIds","Clock-Log":"clockLogChannelId",
  "Rollen bei Invite":"teamInviteRoleIds","Rollen bei Kick entfernen":"teamKickRoleIds",
  "Team Invite/Kick Log":"teamLogChannelId","Team-Warns bis Kick":"teamWarnsUntilKick",
  "Abmelde-Panel":"abmeldungPanelChannelId","Abmelde-Log":"abmeldungLogChannelId",
  "Abmeldung muss bestätigt werden":"abmeldungRequireApproval","Abmelde-Rolle":"abmeldungRoleIds",
  "Feedback-Kanal":"feedbackChannelId","Feedback-Log":"feedbackLogChannelId","Feedback als Sticky":"feedbackSticky",
  "Activity-Check-Kanal":"activityCheckChannelId","Activity-Check Dauer":"activityCheckDurationMin","Activity-Check Text":"activityCheckText",
  "Aufgaben-Panel":"tasksPanelChannelId","Aufgaben-Log":"tasksLogChannelId",
  "Aufgaben-Manager":"tasksManagerRoleIds","Aufgaben Claim-Rolle":"tasksClaimRoleIds",
  "Database-Panel":"databasePanelChannelId",
  "Fraktions-Announce":"factionAnnounceChannelId","Fraktions-Log":"factionLogChannelId","Fraktions-Warns bis Kick":"factionWarnsUntilKick",
  "Hausliste-Kanal":"hauslisteChannelId","Häuser auf Ausweis anzeigen":"ausweisShowHouses",
  "Mod-Log":"modLogChannelId",
  "Warn Permission":"permWarnRoleIds","Kick Permission":"permKickRoleIds","Ban Permission":"permBanRoleIds",
  "Timeout Permission":"permTimeoutRoleIds","Softban Permission":"permSoftbanRoleIds","Note Permission":"permNoteRoleIds",
  "AutoMod-Log":"autoModLogChannelId","Strafregister-Log":"recordsLogChannelId","Security-Log":"securityLogChannelId",
  "Externe Apps deaktivieren":"securityDisableExternalApps","Externe-Apps Rolle":"securityExternalAppsRoleIds",
  "Anti-Nuke":"antiNukeEnabled","Anti-Raid":"antiRaidEnabled","Backup Whitelist-Rolle":"backupWhitelistRoleIds",
  "Welcome-Kanal":"welcomeChannelId","Leave-Kanal":"leaveChannelId","Auto-Rolle":"autoRoleIds",
  "Welcome Titel":"welcomeTitle","Welcome Text":"welcomeText","Welcome Ping":"welcomePing",
  "Leave Titel":"leaveTitle","Leave Text":"leaveText",
  "Verify-Kanal":"verifyChannelId","Verify-Rolle":"verifyRoleIds","Unverified-Rolle":"unverifiedRoleId",
  "Interview-Log":"interviewLogChannelId","Interview Min. Punkte":"interviewMinPoints",
  "Suggest-Kanal":"suggestChannelId","Suggest Manager":"suggestManagerRoleIds",
  "Giveaway-Kanal":"giveawayChannelId","Giveaway Manager":"giveawayManagerRoleIds",
  "Partner-Kanal":"partnerChannelId","Partner-Log":"partnerLogChannelId","Boost-Kanal":"boostChannelId",
  "XP Uprank Announce":"xpUprankChannelId","XP für Uprank":"xpUprankThreshold",
  "RP-Announce-Kanal":"rpAnnounceChannelId","RP Start Titel":"rpStartTitle","RP Start Text":"rpStartText",
  "RP Stop Titel":"rpStopTitle","RP Stop Text":"rpStopText",
  "Stats-Panel-Kanal":"serverStatsChannelId","Stats-Kanal":"teamStatsChannelId","Server Code":"serverStatsCode","Server Name":"serverStatsServerName",
  "Ausweis-Kanal":"ausweisChannelId","Ausweis-Log":"ausweisLogChannelId","Ausweis Request-Kanal":"ausweisRequestChannelId",
  "Ausweis Annehmen":"ausweisAcceptRoleIds","Max. Zusatz-Ausweise":"ausweisMaxExtra",
  "Appeals aktiv":"unbanRequestEnabled","Nur bei aktivem Ban":"unbanRequireActiveBan","Appeal-Log":"unbanRequestChannelId",
  "Appeal Manager":"unbanManagerRoleIds",
  "Dizzy-Control-Kanal":"ingameDizzyChannelId","Dizzy-Log-Kanal":"ingameDizzyLogChannelId"
};

const MODULE_MAP = {
  "Tickets":"tickets","Warteraum":"warteraum","Admin Call":"adminCall","Büros":"offices","Duty":"duty",
  "Bewerbungen":"applications","Teamverwaltung":"team","Security":"security","AutoMod":"automod","XP":"xp",
  "Verify":"verify","Welcome/Leave":"welcomeLeave","Partner":"partner","Fraktionen":"factions","Ausweis":"ausweis",
  "Feedback":"feedback","Aufgaben":"tasks","Database":"database","Abmeldung":"abmeldung","Giveaway":"giveaway",
  "Suggest":"suggest","Interview":"interview","IC Panel":"icPanel","IC Moderation":"icModeration","Security Kick":"securityActionKick","Security Ban":"securityActionBan","Security Timeout":"securityActionTimeout","Security Warn":"securityActionWarn","Security Nachricht löschen":"securityActionDeleteMsg","Bots entfernen":"securityRemoveBots","Webhooks entfernen":"securityRemoveWebhooks","Integrationen entfernen":"securityRemoveIntegrations","Modul aktiv":"dizzy","XP aktiv":"xp",
  "XP Ticket übernehmen":"xpTicketClaim","XP Voice / Support":"xpVoice","XP Feedback gut":"xpFeedback",
  "Stats Tickets":"statsShowTickets","Stats Support":"statsShowSupport","Stats Duty":"statsShowDuty"
};

const PANEL_CHANNEL = {
  "tickets":"ticketPanelChannelId","ticket":"ticketPanelChannelId",
  "adminCall":"adminCallPanelChannelId","admincall":"adminCallPanelChannelId","admin_call":"adminCallPanelChannelId",
  "applications":"bewerbungPanelChannelId","bewerbung":"bewerbungPanelChannelId","app":"bewerbungPanelChannelId",
  "duty":"dutyPanelChannelId","online_admin":"dutyPanelChannelId",
  "feedback":"feedbackChannelId","tasks":"tasksPanelChannelId",
  "database":"databasePanelChannelId","teamlist":"teamlistChannelId","team_list":"teamlistChannelId",
  "abmeldung":"abmeldungPanelChannelId","abmelden":"abmeldungPanelChannelId",
  "verify":"verifyChannelId","hausliste":"hauslisteChannelId",
  "serverStats":"serverStatsChannelId","server_stats":"serverStatsChannelId","stats":"serverStatsChannelId",
  "ausweis":"ausweisChannelId","dizzySticky":"ingameDizzyChannelId",
  "icMod":"icModPanelChannelId","modpanel":"icModPanelChannelId",
  "partner":"partnerChannelId","suggest":"suggestChannelId","giveaway":"giveawayChannelId",
  "xp_panel":"xpUprankChannelId","interview":"interviewPanelChannelId","fraktionsliste":"fraktionslistePanelChannelId"
};
const PANEL_MAP = {
  "Ticket-Panel senden":"tickets","Admin-Call-Panel senden":"adminCall","Bewerbungs-Panel senden":"applications",
  "Sticky senden":"dizzySticky","Stats-Panel senden":"serverStats","Duty-Panel senden":"duty",
  "Feedback-Panel senden":"feedback","Aufgaben-Panel senden":"tasks","Database-Panel senden":"database",
  "Teamliste senden":"teamlist","Abmelde-Panel senden":"abmeldung","Verify-Panel senden":"verify",
  "Hausliste senden":"hausliste","Ausweis-Panel senden":"ausweis","Panel senden":"applications","IC-Mod-Panel senden":"icMod"
};


const API = window.StafforaAPI;
let state = {
  guildId: null, guilds: [], config: {}, settings: {},
  channels: [], roles: [], categories: [], user: null,
  currentCat: null, currentRoleKey: null, _tempMulti: {}, modules: {}
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
function isVoiceChannel(c){
  const t = c && c.type;
  return t === 2 || t === 13 || t === '2' || t === '13' || t === 'GUILD_VOICE' || t === 'GUILD_STAGE_VOICE' || c.isVoice === true;
}
function isTextChannel(c){
  const t = c && c.type;
  return t === 0 || t === 5 || t === '0' || t === '5' || t === 'GUILD_TEXT' || t === 'GUILD_ANNOUNCEMENT' || (!isVoiceChannel(c) && t !== 4 && t !== '4');
}
function channelOptions(selected, filter){
  const opts = ['<option value="">—</option>'];
  let list = state.channels || [];
  if (filter === 'voice') list = list.filter(isVoiceChannel);
  else if (filter === 'text') list = list.filter(isTextChannel);
  list.forEach(c=>{
    const sel = String(c.id)===String(selected) ? ' selected' : '';
    const prefix = isVoiceChannel(c) ? '🔊 ' : '# ';
    opts.push(`<option value="${c.id}"${sel}>${prefix}${escapeHtml(c.name||c.id)}</option>`);
  });
  return opts.join('');
}
function multiLabel(ids, kind){
  const arr = (Array.isArray(ids)?ids:[ids]).filter(Boolean).map(String);
  if (!arr.length) return 'Auswählen ›';
  const src = kind === 'role' ? (state.roles||[]) : (state.channels||[]);
  const names = arr.map(id=>{
    const hit = src.find(x=>String(x.id)===id);
    return hit ? (kind==='role'?'@ ':'# ')+(hit.name||id) : id;
  });
  return names.slice(0,3).join(', ') + (names.length>3?' +'+(names.length-3):'');
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
  const l = String(label||'').toLowerCase();
  const hint = String(typeHint||'').toLowerCase();
  if (hint === 'enum' || hint === 'text') return hint === 'enum' ? 'enum' : (hint || 'text');
  if (hint === 'select') {
    // pure option selects (not discord entities)
    if (/modus|preset|sprache|language|appeals|sticky|bestätigt|häuser auf|externe apps|anti-nuke|anti-raid|welcome ping|join-to-create|stats |musik/.test(l)) return 'enum';
    if (/rolle|role|zugriff|manager|highteam|bereitschaft|blacklist|staff|mod-rolle|admin-rolle|ic access|ic mod|annehmen|suspend|claim|whitelist|unverified|giveaway rolle|invite rolle|kick rolle|warn rolle|ban rolle|timeout|softban/.test(l)) return 'role';
    if (/kategorie|category/.test(l) && !/kanal|channel|panel|log/.test(l)) return 'category';
    if (/kanal|channel|voice|panel|log|warteraum|announce|stats-kanal|sticky|control|hausliste|teamliste|duty-panel|bewerbungs|ticket-panel|feedback|aufgaben|database|verify-kanal|leave|welcome-kanal|partner-kanal|ausweis|suggest|giveaway|uprank|rp announce|ic-mod|ic log|büro-log|strafregister/.test(l)) return 'channel';
  }
  return hint || 'text';
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
        const vf = /voice|warteraum|support-vc|büro|vc /.test(String(label).toLowerCase()) ? 'voice' : 'text';
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}">${channelOptions(val && /^\d+$/.test(String(val)) ? val : '', vf)}</select>`;
      } else if (kind === 'role') {
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}">${roleOptions(val)}</select>`;
      } else if (kind === 'category') {
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}">${categoryOptions(val && /^\d+$/.test(String(val)) ? val : '')}</select>`;
      } else if (kind === 'enum' || hint === 'enum' || hint === 'select') {
        let opts = String(def).split(',').map(o=>o.trim()).filter(Boolean);
        if (label === 'Sprache' || key === 'language') opts = ['de','en'];
        if (label === 'Support-VC Modus' || key === 'supportVcMode') opts = ['Bestehende Channels','Join2Create'];
        if (/Aktion|Standard-Aktion/.test(label)) opts = ['Log only','Warn','Kick','Ban','Timeout','Strip roles','Remove','Delete','Quarantine'];
        if ((/^Nuke /.test(label) || /^Raid /.test(label) || label === 'Duty Pflicht für Übernehmen' || label === 'Server Online') && !/Limit|Aktion|Fenster|Tage|Minuten/.test(label)) opts = ['An','Aus'];
        if (/Channel löschen|Channel erstellen|Rolle löschen|Rolle erstellen|Mass Ban|Mass Kick|Webhook|Bot hinzufügen|Integration|Join-Spam|Message-Spam|Mention-Spam|Emoji-Spam|Security Standard-Aktion/.test(label)) {
          opts = ['Log only','Warn','Kick','Ban','Timeout','Remove','Delete'];
        }
        if (label === 'Musik-Preset' || key === 'warteraumMusicPreset') opts = ['DE','EN'];
        else if (/^(Warteraum-Musik|Appeals aktiv|Nur bei aktivem Ban|Feedback als Sticky|Abmeldung muss bestätigt werden|Häuser auf Ausweis anzeigen|Externe Apps deaktivieren|Anti-Nuke|Anti-Raid|Welcome Ping|Join-to-Create Support-VCs|Stats Tickets|Stats Support|Stats Duty)$/.test(label)) opts = ['An','Aus'];
        if (!opts.length) opts = [def||'—'].filter(Boolean);
        const cur = String(val||'');
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}"><option value="">—</option>${opts.map(o=>`<option value="${escapeHtml(o)}"${cur===o?' selected':''}>${escapeHtml(o)}</option>`).join('')}</select>`;
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
  if(type==='listedit'){
    const storeKey = items[0] || 'list';
    let arr = state.settings[storeKey];
    if(!Array.isArray(arr)) arr = [];
    const itemRows = arr.map((row,i)=>{
      if (storeKey === 'officesList' && row && typeof row === 'object') {
        return `<div class="list-card" data-i="${i}">
          <div class="list-card-head"><b>${escapeHtml(row.name||'Büro')}</b><button type="button" class="btn listedit-rm" data-i="${i}">Entfernen</button></div>
          <div class="list-card-meta">Warteraum: ${escapeHtml(row.waitingChannelId||'—')} · Rolle: ${escapeHtml(row.pingRoleId||'—')} · VC: ${escapeHtml(row.voiceChannelId||'—')}</div>
        </div>`;
      }
      if (storeKey === 'ticketTypes' && row && typeof row === 'object') {
        return `<div class="list-card" data-i="${i}">
          <div class="list-card-head"><b>${escapeHtml((row.emoji?row.emoji+' ':'')+(row.name||'Ticket'))}</b><button type="button" class="btn listedit-rm" data-i="${i}">Entfernen</button></div>
          <div class="list-card-meta">${escapeHtml(row.description||'')} · Cat: ${escapeHtml(row.categoryId||'—')} · Staff: ${escapeHtml(row.supportRoleId||row.staffRoleId||'—')}</div>
        </div>`;
      }
      const text = typeof row === 'string' ? row : (row.name || row.question || row.label || row.reason || JSON.stringify(row));
      return `<div class="setting-row"><span>${escapeHtml(String(text))}</span><button type="button" class="btn listedit-rm" data-i="${i}">Entfernen</button></div>`;
    }).join('') || '<p class="list-empty">Noch keine Einträge.</p>';

    let form = '';
    if (storeKey === 'officesList') {
      form = `<div class="structured-form" data-form="officesList">
        <div class="form-title">Büro hinzufügen</div>
        <label class="setting-row"><span>Name</span><input class="sf-name" placeholder="z.B. Highteam Büro"></label>
        <label class="setting-row"><span>Warteraum</span><select class="sf-wait">${channelOptions('','voice')}</select></label>
        <label class="setting-row"><span>Rolle bei Beitritt</span><select class="sf-role">${roleOptions('')}</select></label>
        <label class="setting-row"><span>Büro VC</span><select class="sf-voice">${channelOptions('','voice')}</select></label>
        <button type="button" class="btn btn-primary listedit-add-btn" style="margin-top:8px">Büro hinzufügen</button>
      </div>`;
    } else if (storeKey === 'customAusweise') {
      form = `<div class="structured-form" data-form="customAusweise">
        <div class="form-title">Custom Ausweis</div>
        <label class="setting-row"><span>Name</span><input class="sf-name" placeholder="z.B. PKW-Ausweis"></label>
        <label class="setting-row"><span>Emoji</span><input class="sf-emoji" placeholder="🚗" style="max-width:80px"></label>
        <label class="setting-row"><span>Beschreibung</span><input class="sf-desc" placeholder="Was der Ausweis bedeutet"></label>
        <div class="ausweis-preview" id="ausweisPreview"><div class="aw-card"><span class="aw-emoji">🪪</span><div><b class="aw-name">Vorschau</b><p class="aw-desc">Beschreibung</p></div></div></div>
        <button type="button" class="btn btn-primary listedit-add-btn" style="margin-top:8px">Ausweis speichern</button>
      </div>`;
    } else if (storeKey === 'ticketTypes') {
      form = `<div class="structured-form" data-form="ticketTypes">
        <div class="form-title">Ticket-Art hinzufügen</div>
        <label class="setting-row"><span>Name</span><input class="sf-name" placeholder="z.B. Support"></label>
        <label class="setting-row"><span>Emoji</span><input class="sf-emoji" placeholder="🎫" style="max-width:80px"></label>
        <label class="setting-row"><span>Beschreibung</span><input class="sf-desc" placeholder="Kurze Beschreibung"></label>
        <label class="setting-row"><span>Staff-Rollen</span>
          <button type="button" class="btn role-btn sf-staff-btn" data-temp="sfStaffRoles"><b>Staff-Rollen</b><span class="sf-staff-lbl">Auswählen ›</span></button>
        </label>
        <label class="setting-row"><span>Ping-Rollen</span>
          <button type="button" class="btn role-btn sf-ping-btn" data-temp="sfPingRoles"><b>Ping-Rollen</b><span class="sf-ping-lbl">Auswählen ›</span></button>
        </label>
        <label class="setting-row"><span>Kategorie</span><select class="sf-cat">${categoryOptions('')}</select></label>
        <label class="setting-row"><span>Eröffnungsfrage</span><input class="sf-preq" placeholder="Optional: Frage vor dem Öffnen"></label>
        <label class="setting-row"><span>Eröffnungs-Embed</span><textarea class="sf-open" rows="2" placeholder="Text im Ticket beim Öffnen"></textarea></label>
        <label class="setting-row"><span>Schließungs-Embed</span><textarea class="sf-close" rows="2" placeholder="Text beim Schließen"></textarea></label>
        <button type="button" class="btn btn-primary listedit-add-btn" style="margin-top:8px">Ticket-Art hinzufügen</button>
      </div>`;
    } else {
      form = `<div class="listedit-add" style="display:flex;gap:8px;margin-top:8px">
        <input class="listedit-input" placeholder="Neuer Eintrag…" style="flex:1">
        <button type="button" class="btn btn-primary listedit-add-btn">Hinzufügen</button>
      </div>`;
    }

    body = `<div class="listedit" data-store="${escapeHtml(storeKey)}">
      <div class="listedit-items">${itemRows}</div>
      ${form}
    </div>`;
  }
  if(type==='table') body=`<div class="table-wrap"><table><thead><tr><th>Member</th><th>XP</th><th>Tickets</th><th>Duty</th></tr></thead><tbody><tr><td colspan="4">—</td></tr></tbody></table></div>`;
  if(type==='chart') body=`<div class="chart-bars">${[42,68,51,79,63,88,71,94,77,83,69,98].map(v=>`<i style="height:${v}%"></i>`).join('')}</div>`;
  return `<article class="settings-card glass"><div class="card-head"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p></div><span class="card-chevron">›</span></div><div class="card-body">${body}</div></article>`;
}


  function wireFileUploads(catId) {
    const panel = document.getElementById('settingsPanel');
    if (!panel || !state.guildId) return;
    // remove old
    panel.querySelectorAll('.file-upload-block').forEach(n => n.remove());

    function addBlock(title, accept, onFile) {
      const card = document.createElement('div');
      card.className = 'settings-card glass file-upload-block';
      card.innerHTML = `<div class="card-head"><div><h3>${title}</h3><p>Datei wählen und hochladen</p></div></div>
        <div class="card-body"><div class="setting-row">
          <span>${title}</span>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input type="file" accept="${accept}" class="fu-input" style="max-width:220px;background:#111;color:#ddd;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px">
            <button type="button" class="btn btn-primary fu-btn">Upload</button>
            <span class="fu-status" style="font-size:12px;color:#9aa3b8"></span>
          </div>
        </div></div>`;
      const inp = card.querySelector('.fu-input');
      const btn = card.querySelector('.fu-btn');
      const st = card.querySelector('.fu-status');
      btn.onclick = async () => {
        const f = inp.files && inp.files[0];
        if (!f) { if (window.toast) toast('Error'); return; }
        st.textContent = '…';
        try {
          await onFile(f, st);
          st.textContent = 'OK';
          if (window.toast) toast('OK');
        } catch (e) {
          st.textContent = 'Error';
          if (window.toast) toast('Error');
        }
      };
      panel.appendChild(card);
    }

    function readAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    }

    if (catId === 'warteraum') {
      addBlock('Warteraum Musik-Datei (mp3/ogg/wav)', 'audio/*,.mp3,.ogg,.wav,.webm,.m4a', async (f, st) => {
        if (!state.guildId) throw new Error('Kein Server');
        if (!API || !API.uploadMusic) throw new Error('Upload API fehlt');
        const data = await readAsDataURL(f);
        const r = await API.uploadMusic(state.guildId, f.name, data);
        if (r && r.error) throw new Error(r.error);
      });
    }
    if (catId === 'tickets') {
      addBlock('Ticket Panel Bild', 'image/png,image/jpeg,image/webp,image/gif', async (f) => {
        if (!state.guildId) throw new Error('Kein Server');
        const data = await readAsDataURL(f);
        const r = await API.uploadTicketImage(state.guildId, 'panel', data);
        if (r && r.error) throw new Error(r.error);
      });
      addBlock('Ticket Eröffnung Bild', 'image/png,image/jpeg,image/webp,image/gif', async (f) => {
        if (!state.guildId) throw new Error('Kein Server');
        const data = await readAsDataURL(f);
        const r = await API.uploadTicketImage(state.guildId, 'create', data);
        if (r && r.error) throw new Error(r.error);
      });
      addBlock('Ticket Close Bild', 'image/png,image/jpeg,image/webp,image/gif', async (f) => {
        if (!state.guildId) throw new Error('Kein Server');
        const data = await readAsDataURL(f);
        const r = await API.uploadTicketImage(state.guildId, 'close', data);
        if (r && r.error) throw new Error(r.error);
      });
    }
  }

  function openCategory(id){
  // file uploads after render
  const __after = () => { try { wireFileUploads(id); } catch (e) {} };
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
  panel.querySelectorAll('.toggle').forEach(t=>{
    t.onclick = () => {
      t.classList.toggle('on');
      const k = t.getAttribute('data-switch');
      if (!k) return;
      if (!state.modules) state.modules = {};
      const on = t.classList.contains('on');
      // module keys are short ids without Role
      if (MODULE_MAP[t.getAttribute('data-label')] || Object.values(MODULE_MAP).includes(k)) {
        state.modules[k] = on;
      } else if (KEY_MAP[t.getAttribute('data-label')]) {
        state.settings[KEY_MAP[t.getAttribute('data-label')]] = on;
      } else {
        state.modules[k] = on;
      }
      // rebuild nav to hide disabled modules
      try { buildNav(); } catch(e) {}
    };
  });
  panel.querySelectorAll('.action-btn').forEach(b=>{ b.onclick = () => handleAction(b.dataset.action, id); });
  panel.querySelectorAll('.role-btn').forEach(b=>{ b.onclick = () => openRoleDrawer(b); });
  panel.querySelectorAll('.listedit').forEach(box=>{
    const key = box.getAttribute('data-store');
    box.querySelectorAll('.listedit-rm').forEach(btn=>{
      btn.onclick = (ev) => {
        ev.preventDefault();
        const i = parseInt(btn.getAttribute('data-i'), 10);
        let arr = Array.isArray(state.settings[key]) ? state.settings[key].slice() : [];
        arr.splice(i, 1);
        state.settings[key] = arr;
        openCategory(id);
        saveCurrent();
      };
    });
    const addBtn = box.querySelector('.listedit-add-btn');
    if (addBtn) {
      addBtn.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        let arr = Array.isArray(state.settings[key]) ? state.settings[key].slice() : [];
        if (key === 'customAusweise') {
          const name = (box.querySelector('.sf-name')||{}).value || '';
          const emoji = (box.querySelector('.sf-emoji')||{}).value || '🪪';
          const description = (box.querySelector('.sf-desc')||{}).value || '';
          if (!name.trim()) { toast('Error'); return; }
          arr.push({ id: 'aw_'+Date.now().toString(36), name: name.trim(), emoji: emoji.trim(), description: description.trim() });
        } else if (key === 'officesList') {
          const name = (box.querySelector('.sf-name')||{}).value || '';
          const waitingChannelId = (box.querySelector('.sf-wait')||{}).value || '';
          const pingRoleId = (box.querySelector('.sf-role')||{}).value || '';
          const voiceChannelId = (box.querySelector('.sf-voice')||{}).value || '';
          if (!name.trim()) { toast('Error'); return; }
          arr.push({ name: name.trim(), waitingChannelId, pingRoleId, voiceChannelId });
        } else if (key === 'ticketTypes') {
          const name = (box.querySelector('.sf-name')||{}).value || '';
          const emoji = (box.querySelector('.sf-emoji')||{}).value || '';
          const description = (box.querySelector('.sf-desc')||{}).value || '';
          const staffRoles = (state._tempMulti && state._tempMulti.sfStaffRoles) || [];
          const pingRoles = (state._tempMulti && state._tempMulti.sfPingRoles) || [];
          const categoryId = (box.querySelector('.sf-cat')||{}).value || '';
          const openQuestion = (box.querySelector('.sf-preq')||{}).value || '';
          const openEmbed = (box.querySelector('.sf-open')||{}).value || '';
          const closeEmbed = (box.querySelector('.sf-close')||{}).value || '';
          if (!name.trim()) { toast('Error'); return; }
          arr.push({
            id: 'tt_' + Date.now().toString(36),
            name: name.trim(), emoji: emoji.trim(), description: description.trim(),
            supportRoleIds: staffRoles.slice(), supportRoleId: staffRoles[0]||'', staffRoleId: staffRoles[0]||'',
            pingRoleIds: pingRoles.slice(), pingRoleId: pingRoles[0]||'',
            categoryId, openQuestion: openQuestion.trim(), preQuestion: openQuestion.trim(),
            openEmbed: openEmbed.trim(), closeEmbed: closeEmbed.trim(), maxLoad: '10'
          });
          if (state._tempMulti) { state._tempMulti.sfStaffRoles = []; state._tempMulti.sfPingRoles = []; }
        } else {
          const inp = box.querySelector('.listedit-input');
          const v = ((inp && inp.value) || '').trim();
          if (!v) { toast('Error'); return; }
          if (key === 'modReasons' && v.includes('|')) {
            const [reason, ladder] = v.split('|').map(s=>s.trim());
            arr.push({ reason, ladder: ladder || '' });
          } else if (key === 'applicationsList' && v.includes('|')) {
            const parts = v.split('|').map(s=>s.trim());
            arr.push({ name: parts[0], acceptRoleId: parts[1]||'' });
          } else {
            arr.push(v);
          }
          if (inp) inp.value = '';
        }
        state.settings[key] = arr;
        openCategory(id);
        saveCurrent();
      };
    }
  });

  // ausweis preview live
  panel.querySelectorAll('[data-form="customAusweise"]').forEach(form=>{
    const upd = ()=>{
      const em = (form.querySelector('.sf-emoji')||{}).value || '🪪';
      const nm = (form.querySelector('.sf-name')||{}).value || 'Vorschau';
      const ds = (form.querySelector('.sf-desc')||{}).value || 'Beschreibung';
      const pe = form.querySelector('.aw-emoji'); if(pe) pe.textContent = em;
      const pn = form.querySelector('.aw-name'); if(pn) pn.textContent = nm;
      const pd = form.querySelector('.aw-desc'); if(pd) pd.textContent = ds;
    };
    form.querySelectorAll('input').forEach(i=> i.oninput = upd);
  });
  // Join2Create conditional
  // Join2Create conditional: hide/show field groups by mode
  if(id === 'warteraum'){
    const modeSel = panel.querySelector('select[data-key="supportVcMode"]');
    const applyMode = () => {
      const mode = modeSel ? modeSel.value : '';
      const isJ2C = /join/i.test(mode) || mode === 'Join2Create';
      panel.querySelectorAll('.settings-card').forEach(card=>{
        const h = (card.querySelector('h3')||{}).textContent || '';
        if(h.includes('Join2Create')) card.style.display = isJ2C ? '' : 'none';
        if(h.includes('Bestehende')) card.style.display = isJ2C ? 'none' : '';
      });
    };
    if(modeSel){ modeSel.onchange = applyMode; applyMode(); }
  }

  try { wireFileUploads(id); } catch (e) {}
}

async function handleAction(label, catId){
  if(!state.guildId){ toast('Error'); return; }
  let panel = PANEL_MAP[label];
  if(!panel){
    const L = String(label||'').toLowerCase();
    if (L.includes('ticket')) panel = 'tickets';
    else if (L.includes('admin')) panel = 'admincall';
    else if (L.includes('sticky') || L.includes('dizzy')) panel = 'dizzySticky';
    else if (L.includes('stats')) panel = 'server_stats';
    else if (L.includes('duty') || L.includes('online')) panel = 'duty';
    else if (L.includes('feedback')) panel = 'feedback';
    else if (L.includes('aufgabe')) panel = 'tasks';
    else if (L.includes('database')) panel = 'database';
    else if (L.includes('teamlist') || L.includes('teamliste')) panel = 'teamlist';
    else if (L.includes('abmeld')) panel = 'abmelden';
    else if (L.includes('verify')) panel = 'verify';
    else if (L.includes('haus')) panel = 'hausliste';
    else if (L.includes('bewerb') || L.includes('application')) panel = 'bewerbung';
    else if (L.includes('ausweis')) panel = 'ausweis';
    else if (L.includes('partner')) panel = 'partner';
    else if (L.includes('ic-mod') || L.includes('ic mod')) panel = 'modpanel';
    else if (L.includes('suggest')) panel = 'suggest';
    else if (L.includes('giveaway')) panel = 'giveaway';
    else if (L.includes('xp')) panel = 'xp_panel';
    else if (L.includes('interview')) panel = 'interview';
    else {
      const mapCat = {
        tickets:'tickets', applications:'bewerbung', team:'duty', ausweis:'ausweis',
        tasks:'tasks', database:'database', rp:'server_stats', dizzy:'dizzySticky',
        verify:'verify', factions:'fraktionsliste', houses:'hausliste', feedback:'feedback',
        abmeldung:'abmelden', teamlist:'teamlist', admincall:'admincall', partner:'partner',
        icmod:'modpanel', suggest:'suggest', giveaway:'giveaway', xp:'xp_panel', interview:'interview'
      };
      panel = mapCat[catId] || catId || 'tickets';
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

function openPickerDrawer(opts){
  // opts: { key, title, kind: 'role'|'channel'|'voice', sourceBtn, tempStore }
  const d=$('drawer');
  if(!d) return;
  const key = opts.key || '';
  state.currentRoleKey = key;
  state._pickerKind = opts.kind || 'role';
  state._pickerBtn = opts.sourceBtn || null;
  state._pickerTemp = opts.tempStore || null;
  const titleEl = $('drawerTitle');
  if (titleEl) titleEl.textContent = opts.title || 'Auswahl';
  let current = [];
  if (opts.tempStore && state._tempMulti && state._tempMulti[opts.tempStore]) {
    current = state._tempMulti[opts.tempStore];
  } else {
    current = getSetting(key, []);
  }
  if (!Array.isArray(current)) current = current ? [current] : [];
  const selSet = new Set(current.map(String));
  let items = [];
  if (opts.kind === 'role') {
    items = (state.roles||[]).filter(r=>r && r.managed !== true).map(r=>({id:r.id,name:r.name,prefix:'@ '}));
  } else {
    let list = state.channels||[];
    if (opts.kind === 'voice') list = list.filter(isVoiceChannel);
    else if (opts.kind === 'text') list = list.filter(isTextChannel);
    items = list.map(c=>({id:c.id,name:c.name,prefix:isVoiceChannel(c)?'🔊 ':'# '}));
  }
  const searchHtml = `<input type="search" id="drawerSearch" placeholder="Suchen…" style="width:100%;margin-bottom:10px;padding:10px;border-radius:10px;background:#111;border:1px solid rgba(255,255,255,.08);color:#eee">`;
  const body = items.map(it=>{
    const on = selSet.has(String(it.id));
    return `<button type="button" class="setting-row role-pick" data-id="${it.id}" data-name="${escapeHtml(it.name||'')}" style="width:100%;text-align:left;${on?'border-color:#805dff;':''}"><b>${it.prefix}${escapeHtml(it.name||it.id)}</b>${on?' <span>✓</span>':''}</button>`;
  }).join('') || '<p style="color:#f87171">Nichts geladen — Server neu wählen oder Rollen aktualisieren.</p>';
  $('drawerBody').innerHTML = searchHtml + '<div id="drawerList">'+body+'</div>';
  d.classList.add('open');
  const applySearch = ()=>{
    const q = (($('drawerSearch')||{}).value||'').toLowerCase();
    $('drawerList').querySelectorAll('.role-pick').forEach(b=>{
      const n = (b.getAttribute('data-name')||b.textContent||'').toLowerCase();
      b.style.display = !q || n.includes(q) ? '' : 'none';
    });
  };
  if ($('drawerSearch')) $('drawerSearch').oninput = applySearch;
  $('drawerList').querySelectorAll('.role-pick').forEach(btn2=>{
    btn2.onclick = () => {
      const id = btn2.dataset.id;
      let arr;
      if (opts.tempStore) {
        if (!state._tempMulti) state._tempMulti = {};
        arr = state._tempMulti[opts.tempStore] || [];
      } else {
        arr = getSetting(state.currentRoleKey, []);
      }
      if (!Array.isArray(arr)) arr = arr ? [arr] : [];
      arr = arr.map(String);
      if (arr.includes(id)) arr = arr.filter(x=>x!==id);
      else arr.push(id);
      if (opts.tempStore) {
        state._tempMulti[opts.tempStore] = arr;
        // update label on form button
        if (opts.sourceBtn) {
          const sp = opts.sourceBtn.querySelector('span');
          if (sp) sp.textContent = multiLabel(arr, opts.kind==='role'?'role':'channel');
        }
      } else {
        state.settings[state.currentRoleKey] = arr;
      }
      openPickerDrawer(opts);
    };
  });
}
function openRoleDrawer(btn){
  const label = btn.dataset.role || '';
  const key = btn.dataset.key || KEY_MAP[label] || '';
  let kind = 'role';
  if (/Support-VCs|Support-Räume|Voice|Warteraum|Feste Support|XP/.test(label) || /Voice|ChannelIds|supportFixed|supportXp/.test(key)) {
    kind = 'voice';
  }
  openPickerDrawer({ key, title: label || 'Auswahl', kind, sourceBtn: btn });
}

async function saveCurrent(){
  if(!state.guildId){ toast('Error'); return; }
  const panel = $('settingsPanel');
  const partial = {};
  if (panel) {
    panel.querySelectorAll('[data-key]').forEach(el=>{
      const key = el.getAttribute('data-key');
      if(!key) return;
      if (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        let v = el.value;
        if (v === '') v = null;
        partial[key] = v;
      }
    });
  }
  // always persist arrays / multi-selects from state
  const arrayKeys = [
    'ticketTypes','ticketOpenQuestions','adminCallQuestions','officesList','applicationsList',
    'applicationQuestions','modReasons','interviewQuestions','factionAppQuestions','customAusweise',
    'unbanQuestions','partnerQuestions','teamlistRoleIds','supportFixedVoiceIds','supportXpVoiceIds',
    'ticketSupportRoleIds','adminRoleIds','staffRoleIds','modRoleIds','ingameAccessRoleIds',
    'ingameModRoleIds','teamInviteRoleIds','teamKickRoleIds','teamWarnRoleIds','teamSuspendRoleIds',
    'factionManageRoleIds','factionManagerRoleIds','houseManagerRoleIds','databaseManagerRoleIds',
    'tasksManagerRoleIds','tasksClaimRoleIds','securityWhitelistRoleIds','verifyRoleIds','unverifiedRoleIds',
    'banRoleIds','kickRoleIds','timeoutRoleIds','warnRoleIds','softbanRoleIds','highTeamRoleIds',
    'partnerManagerRoleIds','ausweisAcceptRoleIds','unbanAcceptRoleIds','giveawayRoleIds','suggestAcceptRoleIds'
  ];
  arrayKeys.forEach(k=>{
    if (state.settings[k] !== undefined) partial[k] = state.settings[k];
  });
  // any other array in settings
  Object.keys(state.settings||{}).forEach(k=>{
    if (Array.isArray(state.settings[k]) && partial[k] === undefined) partial[k] = state.settings[k];
  });

  const modules = Object.assign({}, state.modules || {});
  const tasks = [];
  try {
    if (Object.keys(partial).length) tasks.push(API.patchSettings(state.guildId, partial));
    if (Object.keys(modules).length) tasks.push(API.patchModules(state.guildId, modules));
    await Promise.all(tasks);
    // merge back
    Object.assign(state.settings, partial);
    toast('Gespeichert');
  } catch (e) {
    console.error('save', e);
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
    state.channels = (state.channels||[]).filter(c => {
      const t = c.type;
      // keep text, announce, voice, stage — drop categories only
      return !(t === 4 || t === '4' || t === 'GUILD_CATEGORY' || Number(t) === 4);
    });
    // Prefer text/announce for panel channel selects still includes voice for warteraum
    if (state.currentCat) openCategory(state.currentCat);
    else openCategory('allgemein');
    try { ensureWebhookSetup(gid); } catch (_) {}
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

function moduleEnabledForCat(catId){
  // always show server/meta categories
  if (['allgemein','module','logs'].includes(catId)) return true;
  const map = {
    tickets:'tickets', warteraum:'warteraum', admincall:'adminCall', offices:'offices',
    applications:'applications', team:'team', duty:'duty', abmeldung:'abmeldung',
    feedback:'feedback', tasks:'tasks', database:'database', factions:'factions',
    houses:'houses', moderation:null, records:null, stats:null, security:'security',
    welcome:'welcomeLeave', verify:'verify', interview:'interview', suggest:'suggest',
    giveaway:'giveaway', xp:'xp', rp:null, partner:'partner', ausweis:'ausweis',
    unban:null, dizzy:'dizzy', ic:'icPanel', icmod:'icModeration', teamlist:null
  };
  const mod = map[catId];
  if (!mod) return true;
  const mods = state.modules || {};
  if (mods[mod] === false || mods[mod] === 0 || mods[mod] === 'off') return false;
  return true;
}
function buildNav(){
  const nav = $('categories');
  if(!nav) return;
  if (typeof GROUPS !== 'undefined' && GROUPS.length) {
    nav.innerHTML = GROUPS.map(([gname, ids])=>{
      const links = ids.map(id=>{
        const c = C.find(x=>x[0]===id);
        if(!c) return '';
        if (!moduleEnabledForCat(id)) return '';
        return `<button type="button" class="nav-link" data-cat="${c[0]}"><span class="nav-label">${escapeHtml(c[1])}</span></button>`;
      }).join('');
      if (!links.replace(/\s/g,'')) return '';
      return `<div class="nav-group"><div class="nav-group-title">${escapeHtml(gname)}</div>${links}</div>`;
    }).join('');
  } else {
    nav.innerHTML = C.filter(c=>moduleEnabledForCat(c[0])).map(c=>`<button type="button" class="nav-link" data-cat="${c[0]}"><span class="nav-label">${escapeHtml(c[1])}</span></button>`).join('');
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
  if(!API){ toast('Error'); return; }
  API.readToken();

  if(!API.getToken()){
    const su = document.querySelector('.side-user');
    if(su){
      su.innerHTML = `<button type="button" class="btn btn-primary" id="loginBtn" style="width:100%">Discord Login</button>`;
      const lb = $('loginBtn');
      if(lb) lb.onclick = ()=> API.login(location.origin + '/dashboard/');
    }
    const panel = $('settingsPanel');
    if(panel){
      panel.innerHTML = `<div class="login-banner glass" style="max-width:480px;margin:40px auto;flex-direction:column;text-align:center">
        <div><b>Login required</b><p>Melde dich mit Discord an, um das Dashboard zu nutzen. / Log in with Discord to use the dashboard.</p></div>
        <button type="button" class="btn btn-primary" id="mainLogin" style="margin-top:12px">Discord Login</button>
      </div>`;
      const ml = $('mainLogin');
      if(ml) ml.onclick = ()=> API.login(location.origin + '/dashboard/');
    }
    // disable nav until login
    document.querySelectorAll('[data-cat]').forEach(x=>{
      x.onclick = ()=> API.login(location.origin + '/dashboard/');
    });
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
