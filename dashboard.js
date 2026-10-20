
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
    state._webhookSecret = r.secret || '';
    state._webhookDetected = r.detected;
    paintWebhookCard();
  } catch (e) { console.warn('webhook-setup', e); }
}
function paintWebhookCard() {
  const panel = document.getElementById('settingsPanel');
  const old = document.getElementById('webhook-setup-info');
  if (old) old.remove();
  if (!panel || !state._webhookUrl || !['ic', 'icmod', 'dizzy'].includes(state.currentCat)) return;
  const grid = panel.querySelector('.settings-grid') || panel;
  const el = document.createElement('article');
  el.id = 'webhook-setup-info';
  el.className = 'settings-card glass live-block';
  el.innerHTML = '<div class="card-head"><div><h3>Ingame-Webhook</h3><p>Sende player_join, player_leave und player_heartbeat an diese URL. Danach ist das Tracking automatisch aktiv.</p></div></div>' +
    '<div class="card-body">' +
    '<div class="setting-row"><span>URL</span><div class="mp-row"><input readonly value="' + escapeHtml(state._webhookUrl) + '"><button type="button" class="btn btn-sm" data-copy="url">Kopieren</button></div></div>' +
    (state._webhookSecret ? '<div class="setting-row"><span>Secret</span><div class="mp-row"><input readonly value="' + escapeHtml(state._webhookSecret) + '"><button type="button" class="btn btn-sm" data-copy="secret">Kopieren</button></div></div>' : '') +
    '<div class="setting-row"><span>Status</span><span>' + (state._webhookDetected ? 'Erkannt und aktiv' : 'Wartet auf das erste Event') + '</span></div></div>';
  el.querySelectorAll('[data-copy]').forEach(b => {
    b.onclick = async () => {
      const v = b.dataset.copy === 'secret' ? state._webhookSecret : state._webhookUrl;
      try { await navigator.clipboard.writeText(v); toast('Kopiert', 'ok'); } catch (_) { toast('Kopieren nicht möglich – bitte markieren und mit Strg+C kopieren', 'err'); }
    };
  });
  grid.appendChild(el);
}

const C=[
['home','Übersicht','Status, Module und Hinweise'],
['ranglaufbahn','Ranglaufbahn','Gruppen, Rollen & Permissions'],
['embeds','Embeds','Nachrichten im Staffora-Layout'],
['teamsperre','Teamsperre','Bewerbungen sperren'],
['testphase','Testphase','Erinnerungen und Rolle danach'],
['temprollen','Temp-Rollen','Rollen auf Zeit'],
['honeypot','Honeypot','Falle für Bots und Raider'],
['rollenpanel','Rollen-Panel','Rollen selbst zuweisen'],
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
['houses','Häuser','Hausliste, Häuser verwalten, Kauf-Buttons'],
['icnames','IC-Namen','Eintragen, Suchen, Löschung nach Teamkick'],
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
['fly','Fly & Nametag','Anfragen, Staff-Kanal, Logs'],
['unban','Ban Appeal','Fragen, Log, Annahme'],
['dizzy','Dizzy Control','Roblox-Link und Sticky'],
['ic','IC Panel','Zugriff und Logs'],
['icmod','IC Moderation','Warn / Kick / Ban Panel + Log'],
['sticky','Sticky','Nachricht bleibt unten im Kanal'],
['logs','Logs','Zentrale Log-Kanäle']
];
const GROUPS=[
['Start', ['home']],
['Server', ['allgemein','module','logs','embeds','sticky']],
['Support', ['tickets','warteraum','admincall','offices']],
['Team', ['ranglaufbahn','teamlist','team','duty','abmeldung','feedback','tasks','interview','teamsperre','testphase','temprollen']],
['Moderation', ['moderation','records','security','database','icmod','honeypot']],
['Community', ['welcome','verify','suggest','giveaway','xp','partner','rollenpanel']],
['RP & IC', ['factions','houses','icnames','rp','ausweis','fly','unban','dizzy','ic']]
];
const F=(title,desc,items)=>[title,desc,'fields',items];
const R=(title,desc,items)=>[title,desc,'roles',items];
const S=(title,desc,items)=>[title,desc,'switches',items];
const B=(title,desc,items)=>[title,desc,'buttons',items];
const L=(title,desc,items)=>[title,desc,'listedit',items];
const K=(title,desc,coll)=>[title,desc,'collection',[coll]]; // Karten-Liste mit „… erstellen“ (siehe COLL)

const templates={
home:[],
ranglaufbahn:[
  S('Modul','Die Ranglaufbahn gilt für /team, /uprank, /downrank, Bewerbungen, Interviews, Tickets und Activity Checks.',['Teamverwaltung'])
],
teamsperre:[
  S('Modul','',['Teamsperre']),
  F('Rolle & Log','Wer diese Rolle hat, kann sich nicht für das Team bewerben. Die Bewerbungs-Blacklist-Rolle zählt ebenfalls.',['Teamsperre-Rolle||select','Teamsperre-Log|teamsperre-logs|select']),
  R('Verwalter','Admins dürfen immer.',['Teamsperre Manager'])
],
testphase:[
  S('Modul','',['Testphase']),
  F('Rollen','',['Testphase-Rolle||select','Rolle nach Testphase||select']),
  F('Dauer & Erinnerungen','Erinnerungen in Tagen vor dem Ende, z. B. 3,1. Bei Auto-Pass wird die Rolle danach nach Ablauf automatisch vergeben.',['Testphase Dauer (Tage)|14','Testphase Erinnerungen (Tage)|3,1','Testphase Auto-Pass|An|enum']),
  F('Kanäle','',['Testphase-Log|testphase-logs|select','Testphase-Erinnerungs-Kanal|testphase|select']),
  R('Entscheider','Admins dürfen immer.',['Testphase Manager'])
],
temprollen:[
  S('Modul','',['Temp-Rollen']),
  F('Log','',['Temp-Log|temprollen-logs|select']),
  R('Verwalter','Admins dürfen immer.',['Temp-Rollen Manager'])
],
embeds:[
  S('Modul','Schaltet die Embed-Seite und den Slash-Command /say an oder aus.',['Embeds & Say']),
  F('Embed','Nachricht im Staffora-Layout. Emoji-Platzhalter: {check} {warn} {online} {ticket}.',['Embed-Titel||text','Embed-Text||area','Embed-Farbe|#8b5cf6','Embed-Kanal||select']),
  B('Senden','',['Embed senden'])
],
honeypot:[
  S('Modul','',['Honeypot']),
  F('Falle','Wer hier schreibt (kein Staff), wird bestraft.',['Honeypot-Kanal||select','Honeypot Strafe|Ban|enum','Honeypot Timeout Minuten|1440','Honeypot DM|An|enum','Honeypot-Log|honeypot-logs|select']),
  R('Ausnahmen','',['Honeypot Ausnahme-Rolle']),
  B('Hinweis','Sendet die Warnnachricht in den Honeypot-Kanal.',['Honeypot-Hinweis senden'])
],
rollenpanel:[
  S('Modul','',['Rollen-Panel']),
  F('Panel','',['Auswahl-Panel-Kanal||select','Rollen-Panel Titel|Rollen','Rollen-Panel Text|Wähle deine Rollen','Rollen-Panel Modus|Mehrfach|enum']),
  R('Rollen','Nur sichere Rollen (ohne Admin-/Mod-Rechte) werden angeboten.',['Rollen-Panel Rollen']),
  B('Panel','',['Rollen-Panel senden'])
],
allgemein:[
  F('Grunddaten','Sprache und Zeitzone.',['Sprache|de|select','Zeitzone|Europe/Berlin','Log-Kanal|system-logs|select'])
],
module:[
  S('Module','Aus = Feature läuft nicht, die Kategorie wird ausgeblendet und die zugehörigen Slash-Commands verschwinden vom Server.',['Tickets','Warteraum','Admin Call','Büros','Duty','Bewerbungen','Teamverwaltung','Security','AutoMod','XP','Verify','Welcome/Leave','Partner','Fraktionen','Ausweis','Fly & Nametag','Sticky','Feedback','Aufgaben','Database','Abmeldung','Giveaway','Suggest','Interview','IC Panel','IC Moderation','Embeds & Say','Status & RP'])
],
tickets:[
  S('Modul','Tickets an/aus.',['Tickets']),
  K('Ticket-Panels','Erst ein Panel erstellen, dann öffnest du es und stellst Kanal, Titel, Text und Kategorien ein. Jedes Panel kann in einen eigenen Kanal.','ticketPanels'),
  K('Kategorien','Die Themen, aus denen Mitglieder beim Öffnen wählen. Jede Kategorie hat eigene Rollen, Discord-Kategorie und Texte.','ticketTypes'),
  F('Allgemein','Log, Support-Rolle und Sperre für alle Tickets.',['Ticket-Log|ticket-logs|select','Support-Rolle|Support|select','Ticket-Blacklist-Rolle|Ticket-Blacklist|select']),
  F('Ticket-KI','Antwortet im Ticket auf Fragen der Person, die es geöffnet hat. Aus = die KI schreibt nie. Sobald das Team das Ticket übernimmt, hält sie sich raus. Der API-Key steht in der Bot-Konfiguration (.env). Pro Kategorie lässt sich die KI zusätzlich abschalten.',['Ticket-KI|Aus|enum']),
  L('Eröffnungsfragen','Frage vor dem Öffnen',['ticketOpenQuestions']),
  F('Limits','',['Ticket-Limit pro User|3','Ticket-Limit Fenster Stunden|24']),
  F('Standard-Panel','Nur nötig, wenn du oben kein eigenes Panel erstellst: Dieses Panel wird mit „Ticket-Panel senden“ verschickt.',['Ticket-Panel-Kanal|tickets|select','Ticket-Kategorie|Support|select','Ticket-Panel-Titel|Erstelle hier ein Ticket','Ticket-Panel-Text|Klicke auf den Button, um ein Ticket zu öffnen.']),
  B('Panel','',['Ticket-Panel senden'])
],
warteraum:[
  S('Modul','',['Warteraum']),
  K('Warteraum','Erst den Warteraum (Voice-Kanal) erstellen, dann erscheinen die weiteren Einstellungen: Support-Modus, Übernahme, Support-VCs und Musik.','warteraumList'),
  F('Support-Modus','',['Support-VC Modus|Bestehende Channels|enum']),
  F('Übernahme & Support-VCs','Der Support-Fall mit dem Übernehmen-Button erscheint im Übernahme-Kanal. Feste Support-VCs gelten bei „Bestehende Channels“.',['Übernahme-Kanal|support-alerts|select','Support-VC Kategorie|Support VC|select']),
  R('Support VCs','Mehrere feste Support-VCs und XP-Räume.',['Feste Support-VCs','Support-Räume mit XP']),
  F('Join2Create','Nur bei Modus „Join2Create“.',['Support-VC Kategorie|Support VC|select','Join-to-Create Support-VCs|An|enum']),
  F('Musik','Preset oder eigene Datei. „Musik wiederholen“ An = Dauerschleife, Aus = einmal abspielen, dann verlässt der Bot den Kanal.',['Warteraum-Musik|An|enum','Musik wiederholen|An|enum','Musik-Preset|DE|enum']),
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
  F('Auswahl','Büros mit gleicher Kategorie werden im Warteraum zusammengefasst. Ohne Kategorien sehen Mitglieder direkt alle Büros.',['Kategorien mehrfach wählbar|An|enum']),
  K('Büros','Erst ein Büro erstellen, dann öffnest du es und stellst Warteraum, Rolle und Büro-VC ein. Mehr als 25 Büros werden automatisch auf mehrere Auswahlmenüs verteilt.','officesList'),
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
  S('Modul','Hausliste mit Kauf-Buttons für freie Häuser. Die Häuser selbst verwaltest du weiter unten unter „Häuser verwalten“.',['Häuser']),
  F('Hausliste','Das Panel aktualisiert sich automatisch, sobald du unten ein Haus änderst.',['Hausliste-Kanal|houses|select','Hausliste Titel|Hausliste','Hausliste Text||area']),
  R('Rechte','',['Haus Manager']),
  B('Panel','',['Hausliste senden'])
],
icnames:[
  S('Modul','Mitglieder tragen ihren IC-Namen über ein Panel ein, das Team sucht ihn. Gelöscht wird er nur automatisch, wenn jemand aus dem Team gekickt wurde.',['IC-Namen']),
  F('Panel','',['IC-Namen-Panel-Kanal|ic-namen|select','IC-Namen-Panel Titel|IC-Name','IC-Namen-Panel Text||area']),
  F('Regeln','Nach einem Teamkick wird der IC-Name nach dieser Zeit gelöscht. Wird die Person vorher wieder aufgenommen, bleibt er erhalten. Team-Mitglieder und Admins dürfen immer suchen.',['Löschung nach Teamkick (Stunden)|24','Namen selbst ändern|An|enum','Team darf suchen|An|enum']),
  F('Log','Eintragen, Ändern, geplante Löschung, Abbruch und Löschung.',['IC-Namen-Log|ic-namen-logs|select']),
  R('Zusätzliche Such-Rollen','',['IC-Namen Suche Rollen']),
  B('Panel','',['IC-Namen-Panel senden'])
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
  F('Texte','Platzhalter: {user} (Erwähnung) {userName} {userId} {server} {memberCount}',['Welcome Titel|Willkommen!','Welcome Text||area','Leave Titel|Tschüss','Leave Text||area','Welcome Ping|An|enum'])
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
  S('Modul','XP gibt es nur für Staff und nur für Staff-Aufgaben.',['XP']),
  K('XP-Gruppen','Erst eine Gruppe erstellen (z. B. Supporter mit allen Support-Rollen, Highteam mit allen Highteam-Rollen), dann öffnest du sie und stellst Zeitraum und Top-Zahl ein. Ohne Gruppen zählt die ganze Ranglaufbahn als eine Gruppe.','xpGroups'),
  F('Uprank & Kanäle','Wenn der Zeitraum einer Gruppe endet, bekommen die Besten einen Uprank in der Ranglaufbahn.',['XP Auto-Uprank|An|enum','XP Auswertungs-Kanal|xp-uprank|select','XP Rangliste Kanal|xp|select']),
  F('XP für Staff-Aufgaben','XP pro erledigter Aufgabe. 0 = diese Aufgabe gibt keine XP.',['XP Ticket übernehmen|15|text','XP Ticket schließen|8|text','XP Aufgabe übernehmen|12|text','XP Admin Call übernehmen|20|text','XP Warteraum übernehmen|15|text','XP Bewerbung bearbeiten|10|text','XP Interview führen|10|text','XP Anträge prüfen|4|text','XP Moderation|5|text','XP Team-Verwaltung|6|text']),
  F('Dienst & Support-Voice','Dienstzeit zählt beim Ausstempeln, Support-Voice beim Verlassen der Räume unter „Support-Räume mit XP“ (Warteraum-Seite).',['XP Dienst pro Stunde|10|text','XP Support-Voice pro Minute|2|text']),
  F('Feedback','XP für den bewerteten Staff je Sterne. Negative Werte ziehen XP ab.',['XP Feedback 1 Stern|-15|text','XP Feedback 2 Sterne|-5|text','XP Feedback 3 Sterne|8|text','XP Feedback 4 Sterne|15|text','XP Feedback 5 Sterne|25|text']),
  B('Panel','',['XP-Rangliste senden'])
],
rp:[
  S('Modul','Schaltet /rp-start, /rp-stop und /stats ein oder aus.',['Status & RP']),
  F('Server-Status-Panel','Das Panel zeigt Titel, Text, Owner, Spieler, Code und Online/Offline. Online/Offline und die Spielerzahl steuert das Team: /rp-start stellt auf Online, /rp-stop setzt die Spieler auf 0 und zeigt Offline, /stats players setzt die Spielerzahl.',[
    'Status-Panel Kanal|server-stats|select',
    'Status-Panel Titel|Server Stats',
    'Status-Panel Text||area',
    'Status-Panel Owner|',
    'Status-Panel Max Spieler|',
    'Server Code|'
  ]),
  R('Wer darf die Spielerzahl setzen?','Leer lassen = jedes Teammitglied der Ranglaufbahn (und Admins). Mit Auswahl nur diese Rollen (und Admins).',['Stats-Rollen']),
  F('RP-Ankündigung','Kanal für die Ankündigung bei /rp-start und /rp-stop.',['RP Announce|rp-announce|select']),
  B('Panel','Sendet das Panel einmal in den Stats-Kanal. Danach aktualisiert es sich selbst.',['Stats-Panel senden'])
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
sticky:[
  S('Modul','',['Sticky']),
  L('Sticky-Nachrichten','Pro Kanal eine Nachricht, die nach jeder neuen Nachricht wieder ganz unten steht. Änderungen übernimmt der Bot innerhalb von 2 Minuten. Höchstens 10 Kanäle.',['stickyList'])
],
fly:[
  S('Modul','',['Fly & Nametag']),
  F('Kanäle','Anfragekanal = hier steht das Panel. Staff-Kanal = dort bearbeitet das Team die Anfragen. Abschluss-Kanal = fertige Anfragen.',['Fly-Anfragekanal|fly-nametag|select','Fly-Staff-Kanal|fly-staff|select','Fly-Abschluss-Kanal|fly-erledigt|select','Fly-Log|fly-logs|select']),
  R('Rechte','Diese Rollen dürfen Anfragen übernehmen, abschließen oder ablehnen.',['Fly Staff-Rolle']),
  F('Panel-Text','',['Fly-Panel-Titel|Fly & Nametag','Fly-Panel-Text|Wähle dein Modell und trage deinen IC-Namen ein.']),
  B('Panel','',['Fly-Panel senden'])
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
  S('Modul','',['Audit-Log']),
  F('Audit-Log','Sammelt Aufnahmen, Beförderungen, Teamkicks, Rollen- und Namensänderungen sowie Admin-Aktionen mit Akteur, Person und Zeit in einem Kanal. Ohne Kanal ist der Audit-Log aus.',['Audit-Log-Kanal|audit-logs|select','Rollenänderungen loggen|An|enum','Namensänderungen loggen|An|enum','Admin-Aktionen loggen|An|enum']),
  F('Zentrale Logs','',['Log-Kanal|system-logs|select','Mod-Log|mod-logs|select','Ticket-Log|ticket-logs|select','Security-Log|security-logs|select'])
]
};

const KEY_MAP = {
  "Teamliste-Titel":"teamlistTitle","Team-Log":"teamLogChannelId","Team-Warns bis Auto-Kick":"teamWarnKickAt","Duty-Panel-Titel":"dutyPanelTitle","Duty-Panel-Text":"dutyPanelText","Duty Pflicht für Übernehmen":"requireDutyToClaim",
  "Database-Log":"databaseLogChannelId","Security Timeout Minuten":"securityTimeoutMinutes","Interview Punkte Richtig":"interviewPointsCorrect","Interview Punkte Fast":"interviewPointsAlmost","Interview Punkte Falsch":"interviewPointsWrong",
  "Suggest Einreichen Rolle":"suggestSubmitRoleIds","XP Uprank Kanal":"xpAnnounceChannelId","Server-Stats Kanal":"serverStatsChannelId","RP Announce":"rpAnnounceChannelId","Unban-Log":"unbanRequestChannelId",
  "Dizzy Control Kanal":"ingameDizzyChannelId","Dizzy Log":"dizzyLogChannelId","Stats Tickets":"statsShowTickets","Stats Support":"statsShowSupport","Stats Duty":"statsShowDuty",
  "Audit-Log-Kanal":"auditLogChannelId","Rollenänderungen loggen":"auditLogRoles","Namensänderungen loggen":"auditLogNicknames","Admin-Aktionen loggen":"auditLogAdmin","Alle Rollen loggen":"auditLogAllRoles",
  "Teamsperre-Rolle":"teamsperreRoleId","Teamsperre-Log":"teamsperreLogChannelId","Teamsperre Manager":"teamsperreManagerRoleIds",
  "Testphase-Rolle":"testphaseRoleId","Rolle nach Testphase":"testphasePassRoleId","Testphase Dauer (Tage)":"testphaseDays","Testphase Erinnerungen (Tage)":"testphaseReminderDays","Testphase Auto-Pass":"testphaseAutoPass","Testphase-Log":"testphaseLogChannelId","Testphase-Erinnerungs-Kanal":"testphaseNotifyChannelId","Testphase Manager":"testphaseManagerRoleIds",
  "Temp-Log":"tempRoleLogChannelId","Embed-Titel":"embedTitle","Embed-Text":"embedText","Embed-Farbe":"embedColor","Embed-Kanal":"embedChannelId","Temp-Rollen Manager":"tempRoleManagerRoleIds",
  "Honeypot-Kanal":"honeypotChannelId","Honeypot Strafe":"honeypotStrafe","Honeypot Timeout Minuten":"honeypotTimeoutMin","Honeypot DM":"honeypotDm","Honeypot-Log":"honeypotLogChannelId","Honeypot Ausnahme-Rolle":"honeypotIgnoreRoleIds",
  "Auswahl-Panel-Kanal":"rolePanelChannelId","Rollen-Panel Titel":"rolePanelTitle","Rollen-Panel Text":"rolePanelText","Rollen-Panel Modus":"rolePanelModus","Rollen-Panel Rollen":"rolePanelRoleIds",

  "Stats Titel":"serverStatsTitle","Status-Panel Kanal":"serverStatsChannelId","Status-Panel Titel":"serverStatsTitle","Status-Panel Text":"serverStatsDescription","Status-Panel Owner":"serverStatsOwner","Status-Panel Max Spieler":"serverStatsMaxPlayers","Stats-Rollen":"statsManageRoleIds","Server Name":"serverStatsServerName","Server Online":"serverStatsOnline",
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

  "Team Suspend Rolle":"teamSuspendRoleIds","Frak Manager":"factionManagerRoleIds","Haus Manager":"houseManagerRoleIds","Hausliste Titel":"hauslistePanelTitle","Hausliste Text":"hauslistePanelText",
  "IC-Namen-Panel-Kanal":"icNamePanelChannelId","IC-Namen-Panel Titel":"icNamePanelTitle","IC-Namen-Panel Text":"icNamePanelText","Löschung nach Teamkick (Stunden)":"icNameRemoveHours","Namen selbst ändern":"icNameSelfChange","Team darf suchen":"icNameSearchTeam","IC-Namen-Log":"icNameLogChannelId","IC-Namen Suche Rollen":"icNameSearchRoleIds",
  "Partner-Fragen":"partnerQuestions","IC-Mod Panel":"icModPanelChannelId","IC-Mod Log":"icModLogChannelId",
  "IC Log Remove Rolle":"icLogRemoveRoleIds","IC Moderation":"icModeration",
  "Aufgaben Manager":"tasksManagerRoleIds","Aufgaben Claim":"tasksClaimRoleIds",
  "Teamliste-Rollen":"teamlistRoleIds","Team Invite Rolle":"teamInviteRoleIds","Team Kick Rolle":"teamKickRoleIds",
  "Team Warn Rolle":"teamWarnRoleIds","Ban Rolle":"banRoleIds","Kick Rolle":"kickRoleIds","Timeout Rolle":"timeoutRoleIds",
  "Warn Rolle":"warnRoleIds","Softban Rolle":"softbanRoleIds","Security Whitelist Rolle":"securityWhitelistRoleIds",
  "Verify Rolle geben":"verifyRoleIds","Unverified Rolle":"unverifiedRoleIds","Suggest Annehmen Rolle":"suggestAcceptRoleIds",
  "Giveaway Rolle":"giveawayRoleIds","Ausweis Annehmen Rolle":"ausweisAcceptRoleIds","Unban Annehmen Rolle":"unbanAcceptRoleIds",
  "Büro-Log":"officeLogChannelId","Fly-Anfragekanal":"flyNametagChannelId","Fly-Staff-Kanal":"flyNametagStaffChannelId","Fly-Abschluss-Kanal":"flyNametagCompletedChannelId","Fly-Log":"flyNametagLogChannelId","Fly Staff-Rolle":"flyNametagStaffRoleIds","Fly-Panel-Titel":"flyNametagPanelTitle","Fly-Panel-Text":"flyNametagPanelText","Strafregister-Log":"recordsLogChannelId",
  "Sprache":"language","Kategorien mehrfach wählbar":"officeCategoryMulti","System-Name":"systemName","Log-Kanal":"logChannelId","Zeitzone":"timezone",
  "Admin-Rolle":"adminRoleIds","Staff-Rolle":"staffRoleIds","Mod-Rolle":"modRoleIds",
  "IC Panel Zugriff":"ingameAccessRoleIds","IC Access Rolle":"ingameAccessRoleIds","IC Mod-Rolle":"ingameModRoleIds","IC Log":"ingameLogChannelId",
  "Database Manager":"databaseManagerRoleIds","Frak-Verwaltung":"factionManageRoleIds","Partner Manager":"partnerManagerRoleIds","HighTeam":"highTeamRoleIds",
  "Ticket-Panel-Titel":"ticketPanelTitle","Ticket-Panel-Text":"ticketPanelText","Ticket-Panel-Kanal":"ticketPanelChannelId","Ticket-Log":"ticketLogChannelId","Ticket-Kategorie":"ticketCategoryId",
  "Support-Rolle":"ticketSupportRoleIds","Ticket-Blacklist-Rolle":"ticketBlacklistRoleIds",
  "Ticket-Limit pro User":"ticketLimitPerUser","Ticket-Limit Fenster Stunden":"ticketLimitWindowHours",
  "Warteraum Voice":"warteraumVoiceChannelId","Übernahme-Kanal":"supportTextChannelId",
  "Warteraum-Musik":"warteraumMusicEnabled","Musik wiederholen":"warteraumMusicRepeat","Musik-Preset":"warteraumMusicPreset",
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
  "Abmelde-Panel":"abmeldungPanelChannelId","Abmelden-Panel":"abmeldenPanelChannelId","Abmelde-Log":"abmeldungLogChannelId",
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
  "Dizzy-Control-Kanal":"ingameDizzyChannelId","Dizzy-Log-Kanal":"ingameDizzyLogChannelId",
  "Ticket-KI":"aiAssistEnabled","XP Ticket übernehmen":"xpTicketClaim",
  "XP Auto-Uprank":"xpAutoUprank","XP Auswertungs-Kanal":"xpAnnounceChannelId","XP Rangliste Kanal":"xpUprankChannelId",
  "XP Ticket schließen":"xpTicketClose","XP Aufgabe übernehmen":"xpTaskClaim","XP Admin Call übernehmen":"xpAdminCallClaim","XP Warteraum übernehmen":"xpWarteraumClaim",
  "XP Bewerbung bearbeiten":"xpApplication","XP Interview führen":"xpInterview","XP Anträge prüfen":"xpReview","XP Moderation":"xpModAction","XP Team-Verwaltung":"xpTeamAction",
  "XP Dienst pro Stunde":"xpPerDutyHour","XP Support-Voice pro Minute":"xpPerVcMinute",
  "XP Feedback 1 Stern":"xpFeedbackStar1","XP Feedback 2 Sterne":"xpFeedbackStar2","XP Feedback 3 Sterne":"xpFeedbackStar3","XP Feedback 4 Sterne":"xpFeedbackStar4","XP Feedback 5 Sterne":"xpFeedbackStar5"
};

const MODULE_MAP = {
  "Embeds & Say":"embedBuilder","Status & RP":"statusPanel",
  "Häuser":"houses","IC-Namen":"icNames","Teamsperre":"teamsperre","Testphase":"testphase","Temp-Rollen":"tempRoles","Honeypot":"honeypot","Rollen-Panel":"rolePanel",
  "Tickets":"tickets","Warteraum":"warteraum","Admin Call":"adminCall","Büros":"offices","Duty":"duty",
  "Bewerbungen":"applications","Teamverwaltung":"team","Security":"security","AutoMod":"automod","XP":"xp",
  "Verify":"verify","Welcome/Leave":"welcomeLeave","Audit-Log":"auditLog","Partner":"partner","Fraktionen":"factions","Ausweis":"ausweis","Fly & Nametag":"flyNametag","Sticky":"sticky",
  "Feedback":"feedback","Aufgaben":"tasks","Database":"database","Abmeldung":"abmeldung","Giveaway":"giveaway",
  "Suggest":"suggest","Interview":"interview","IC Panel":"icPanel","IC Moderation":"icModeration","Security Kick":"securityActionKick","Security Ban":"securityActionBan","Security Timeout":"securityActionTimeout","Security Warn":"securityActionWarn","Security Nachricht löschen":"securityActionDeleteMsg","Bots entfernen":"securityRemoveBots","Webhooks entfernen":"securityRemoveWebhooks","Integrationen entfernen":"securityRemoveIntegrations","Modul aktiv":"dizzy","XP aktiv":"xp",
};

const PANEL_CHANNEL = {
  "embed":"embedChannelId","honeypot":"honeypotChannelId","rollenpanel":"rolePanelChannelId",
  "tickets":"ticketPanelChannelId","ticket":"ticketPanelChannelId",
  "adminCall":"adminCallPanelChannelId","admincall":"adminCallPanelChannelId","admin_call":"adminCallPanelChannelId",
  "applications":"bewerbungPanelChannelId","bewerbung":"bewerbungPanelChannelId","app":"bewerbungPanelChannelId",
  "duty":"dutyPanelChannelId","online_admin":"dutyPanelChannelId",
  "feedback":"feedbackChannelId","tasks":"tasksPanelChannelId",
  "database":"databasePanelChannelId","teamlist":"teamlistChannelId","team_list":"teamlistChannelId",
  "abmeldung":"abmeldungPanelChannelId","abmelden":"abmeldungPanelChannelId","abmeldenPanel":"abmeldenPanelChannelId",
  "verify":"verifyChannelId","hausliste":"hauslisteChannelId","ic_names":"icNamePanelChannelId",
  "serverStats":"serverStatsChannelId","server_stats":"serverStatsChannelId","stats":"serverStatsChannelId",
  "ausweis":"ausweisChannelId","fly":"flyNametagChannelId","dizzySticky":"ingameDizzyChannelId",
  "icMod":"icModPanelChannelId","modpanel":"icModPanelChannelId",
  "partner":"partnerChannelId","suggest":"suggestChannelId","giveaway":"giveawayChannelId",
  "xp_panel":"xpUprankChannelId","interview":"interviewPanelChannelId","fraktionsliste":"fraktionslistePanelChannelId"
};
const PANEL_MAP = {
  "Embed senden":"embed","Honeypot-Hinweis senden":"honeypot","Rollen-Panel senden":"rollenpanel",
  "Ticket-Panel senden":"tickets","XP-Rangliste senden":"xp_panel","Admin-Call-Panel senden":"adminCall","Bewerbungs-Panel senden":"applications",
  "Sticky senden":"dizzySticky","Stats-Panel senden":"serverStats","Duty-Panel senden":"duty",
  "Feedback-Panel senden":"feedback","Aufgaben-Panel senden":"tasks","Database-Panel senden":"database",
  "Teamliste senden":"teamlist","Abmelde-Panel senden":"abmelden","Verify-Panel senden":"verify",
  "Hausliste senden":"hausliste","IC-Namen-Panel senden":"ic_names","Ausweis-Panel senden":"ausweis","Fly-Panel senden":"fly","Panel senden":"applications","IC-Mod-Panel senden":"modpanel","Ingame-Panel senden":"modpanel","IC-Panel senden":"modpanel","Mod-Panel senden":"modpanel"
};


const API = window.StafforaAPI;
window.API = API;
let state = {
  guildId: null, guilds: [], config: {}, settings: {},
  channels: [], roles: [], categories: [], user: null,
  currentCat: null, currentRoleKey: null, _tempMulti: {}, modules: {},
  pending: {}, dirty: false, dirtyCats: new Set(), extraSavers: {}, extraDirty: {}, saving: false, saveError: false,
  _health: null, _sys: null, _statusErr: ''
};
window.dashState = state;

let __toastTimer = null;
function toast(msg, kind){
  const t=document.getElementById('toast');
  if(!t) return;
  let m = String(msg == null ? '' : msg), k = kind;
  if (!k) {
    if (m === 'Error') { m = 'Das hat nicht geklappt. Bitte Eingaben prüfen.'; k = 'err'; }
    else if (m === 'OK') { m = 'Aktualisiert'; k = 'ok'; }
    else if (m === '…' || /…$/.test(m)) { if (m === '…') m = 'Lade …'; k = 'busy'; }
    else if (/^Sende/.test(m)) k = 'busy';
    else if (/^(Gespeichert|Gesendet|Gesperrt|Sperre aufgehoben|Aufgehoben|Entfernt|Vergeben|Gestartet|Beendet|Neu ausgelost|Hochgeladen|Aktualisiert|Ranglaufbahn gespeichert|Testphase gestartet|Giveaway gestartet|Verworfen|Kanäle und Rollen aktualisiert|Serverliste aktualisiert)/.test(m)) k = 'ok';
    else if (/(fehl|nicht |ungültig|error|zu groß|keine datei|mindestens|wählen|angeben)/i.test(m)) k = 'err';
  }
  t.textContent = m; t.dataset.kind = k || 'info'; t.classList.add('show');
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(()=>t.classList.remove('show'), k === 'busy' ? 20000 : k === 'err' ? 4600 : 2400);
}
function $(id){ return document.getElementById(id); }
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
function formatMembers(n){
  if (n == null || n === '' || isNaN(Number(n))) return '';
  return Number(n).toLocaleString('de-DE') + ' Mitglieder';
}

const ICON = {
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.9-3M4 5v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3M20 19v-4h-4"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  server: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/></svg>',
  support: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9"/></svg>',
  team: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14c2.5 0 4.5 2 4.5 4.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
};
const GROUP_ICON = { 'Start': 'home', 'Server': 'server', 'Support': 'support', 'Team': 'team', 'Moderation': 'shield', 'Community': 'chat', 'RP & IC': 'star' };

/* Linien-Icons der Seitenleiste (nur Dekoration, Beschriftung steht daneben) */
const NAV_PATH = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/>',
  pin: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3H7l3-3z"/>',
  ticket: '<path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z"/><path d="M14 6v12"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14c2.5 0 4.5 2 4.5 4.5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  checks: '<path d="M4 6l2 2 3-3M4 14l2 2 3-3M13 7h7M13 15h7"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.6 1.8-2.4 3-2.4s2.4.8 3 2.4M14 10h4M14 14h3"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  heart: '<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>',
  verify: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M12 8c-1.5-4-6-4-5 0M12 8c1.5-4 6-4 5 0"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  plane: '<path d="M3 11l18-8-8 18-2-8z"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10l3 2-3 2M12 15h5"/>',
  alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17h.01"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  flask: '<path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3L14 9V3"/>',
  hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
  drop: '<path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-4 3-6 6-10z"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'
};
const NAV_ICON = {
  home:'home', ranglaufbahn:'trend', embeds:'layout', teamsperre:'pause', testphase:'flask', temprollen:'hourglass', honeypot:'drop', rollenpanel:'tag',
  allgemein:'sliders', module:'grid', tickets:'ticket', warteraum:'headset', admincall:'bell', offices:'building', applications:'clipboard', teamlist:'list',
  team:'users', duty:'clock', abmeldung:'calendar', feedback:'chat', tasks:'checks', database:'database', factions:'flag', houses:'home', icnames:'idcard',
  moderation:'shield', records:'book', security:'lock', welcome:'heart', verify:'verify', interview:'mic', suggest:'bulb', giveaway:'gift', xp:'zap',
  rp:'radio', partner:'link', ausweis:'idcard', fly:'plane', unban:'ban', dizzy:'eye', ic:'terminal', icmod:'alert', sticky:'pin', logs:'file'
};
function navIcon(id){
  const p = NAV_PATH[NAV_ICON[id]];
  return p ? `<span class="nav-ico" aria-hidden="true"><svg viewBox="0 0 24 24">${p}</svg></span>` : '<span class="nav-ico" aria-hidden="true"></span>';
}

/* ---------- Änderungen merken, anzeigen und sicher speichern ---------- */
function isDirty(){ return !!state.dirty || Object.values(state.extraDirty || {}).some(Boolean); }
function paintSaveState(force){
  const dirty = isDirty();
  const mode = force || (state.saving ? 'saving' : state.saveError ? 'error' : dirty ? 'dirty' : 'clean');
  const text = { clean: 'Alles gespeichert', dirty: 'Ungespeicherte Änderungen', saving: 'Speichert …', error: 'Nicht gespeichert' }[mode];
  document.querySelectorAll('.save-state').forEach(el => { el.dataset.state = mode; el.textContent = text; });
  const d = $('discardAll'); if (d) d.hidden = !dirty;
  document.querySelectorAll('.nav-link').forEach(x => x.classList.toggle('is-dirty', state.dirtyCats.has(x.dataset.cat)));
}
function markDirty(){
  state.dirty = true; state.saveError = false;
  if (state.currentCat) state.dirtyCats.add(state.currentCat);
  paintSaveState();
}
function markClean(){
  state.dirty = false; state.saveError = false; state.pending = {};
  state.dirtyCats.clear();
  Object.keys(state.extraDirty).forEach(k => { state.extraDirty[k] = false; });
  paintSaveState('clean');
}
function setExtraDirty(name, on){
  state.extraDirty[name] = !!on;
  if (on) { state.saveError = false; if (state.currentCat) state.dirtyCats.add(state.currentCat); }
  else if (!isDirty()) state.dirtyCats.clear();
  paintSaveState();
}
function onPanelEdit(ev){
  const el = ev.target;
  if (!el || !el.getAttribute || (el.closest && el.closest('.rc-root, .live-block, .file-upload-block'))) return;
  const k = el.getAttribute('data-key');
  if (!k || !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
  state.pending[k] = el.value === '' ? null : el.value;
  markDirty();
}
window.addEventListener('beforeunload', (e) => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- Aktualisieren ---------- */
let __refreshArm = 0, __refreshTimer = null;
function applyDiscord(disc){
  const all = (disc && disc.channels) || [];
  const isCat = (c) => { const t = c.type; return t === 4 || t === '4' || t === 'GUILD_CATEGORY' || Number(t) === 4; };
  state.categories = all.filter(isCat);
  state.channels = all.filter(c => !isCat(c));
  state.roles = (disc && disc.roles) || [];
}
async function refreshDiscordData(){
  if (!state.guildId) { toast('Zuerst Server wählen'); return false; }
  try {
    toast('Kanäle und Rollen werden geladen …', 'busy');
    applyDiscord(await API.discord(state.guildId, true));
    if (state.currentCat) openCategory(state.currentCat);
    toast('Kanäle und Rollen aktualisiert', 'ok');
    return true;
  } catch (e) { toast((e && e.message) ? String(e.message).slice(0, 140) : 'Kanäle und Rollen konnten nicht geladen werden', 'err'); return false; }
}
async function refreshServers(){
  try {
    toast('Serverliste wird geladen …', 'busy');
    const g = await API.guilds(true);
    state.guilds = Array.isArray(g) ? g : ((g && (g.guilds || g.servers)) || []);
    renderServerList();
    toast('Serverliste aktualisiert', 'ok');
  } catch (e) { toast((e && e.message) ? String(e.message).slice(0, 140) : 'Serverliste konnte nicht geladen werden', 'err'); }
}
async function refreshPage(){
  if (!state.guildId) { await refreshServers(); return; }
  if (isDirty() && Date.now() > __refreshArm) {
    __refreshArm = Date.now() + 4500;
    const b = $('refreshPage');
    if (b) { b.dataset.armed = '1'; b.lastChild.textContent = ' Änderungen verwerfen?'; clearTimeout(__refreshTimer); __refreshTimer = setTimeout(() => { const x = $('refreshPage'); if (x) { delete x.dataset.armed; x.lastChild.textContent = ' Aktualisieren'; } }, 4500); }
    toast('Du hast ungespeicherte Änderungen. Zum Verwerfen und Neuladen noch einmal klicken.', 'err');
    return;
  }
  __refreshArm = 0;
  const b = $('refreshPage'); if (b) b.classList.add('is-spinning');
  try { await loadGuild(state.guildId, { refresh: true }); try { refreshStatus(); } catch (_) {} }
  finally { const x = $('refreshPage'); if (x) x.classList.remove('is-spinning'); }
}
async function discardChanges(){
  if (!state.guildId) return;
  __refreshArm = Date.now() + 1000;
  await loadGuild(state.guildId, { refresh: false, quiet: true });
  toast('Verworfen', 'ok');
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
  if (hint) hint.textContent = name;
}

/* Pfad in der Kopfleiste: Server / Gruppe / Seite */
function paintCrumbs(groupName, pageName){
  const g = $('crumbGroup'), p = $('crumbPage');
  if (g) g.textContent = groupName || '';
  if (p) p.textContent = pageName || '';
}

/* Modul-Hinweis oben auf Modul-Seiten: zeigt den Zustand und schaltet das Modul um */
function moduleKeyForCat(catId){
  const key = CAT_MODULE[catId];
  return key || '';
}
function paintModuleBanner(catId){
  const panel = $('settingsPanel'); if (!panel) return;
  const old = panel.querySelector('.mod-banner'); if (old) old.remove();
  const key = moduleKeyForCat(catId);
  const heading = panel.querySelector('.settings-heading');
  if (!key || !heading) return;
  const c = C.find(x => x[0] === catId);
  const on = (state.modules || {})[key] !== false;
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg>';
  const el = document.createElement('div');
  el.className = 'mod-banner'; el.dataset.on = on ? '1' : '0'; el.dataset.module = key;
  el.innerHTML = `<span class="mb-ico">${on ? CHECK : OFF}</span>` +
    `<div class="mb-text"><b>${on ? 'Modul aktiviert' : 'Modul deaktiviert'}</b><p>${on ? 'Das Modul „' + escapeHtml(c ? c[1] : 'Dieses') + '“ ist auf diesem Server eingeschaltet.' : 'Der Bot nutzt diese Funktion erst, wenn du das Modul aktivierst.'}</p></div>` +
    `<button type="button" class="btn ${on ? 'btn-danger' : 'btn-primary'}" id="modToggle">${on ? 'Deaktivieren' : 'Aktivieren'}</button>`;
  heading.insertAdjacentElement('afterend', el);
  // Die Karte „Modul“ mit genau diesem einen Schalter wäre doppelt: ausblenden, der Hinweis übernimmt sie
  panel.querySelectorAll('.settings-card').forEach(card => {
    const tg = card.querySelectorAll('.toggle');
    if (tg.length === 1 && tg[0].getAttribute('data-switch') === key) card.classList.add('is-redundant');
  });
  const btn = el.querySelector('#modToggle');
  btn.onclick = () => {
    if (!state.modules) state.modules = {};
    state.modules[key] = !on;
    panel.querySelectorAll('.toggle[data-switch="' + key + '"]').forEach(t => t.classList.toggle('on', !on));
    markDirty();
    try { buildNav(); } catch (_) {}
    paintModuleBanner(catId);
    const nb = panel.querySelector('.mod-banner'); if (nb) { nb.classList.add('is-flip'); }
    toast(!on ? 'Modul aktiviert. Mit „Speichern“ übernehmen.' : 'Modul deaktiviert. Mit „Speichern“ übernehmen.');
  };
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
  if (!arr.length) return 'Auswählen';
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
  if (state.pending && Object.prototype.hasOwnProperty.call(state.pending, key)) { const v = state.pending[key]; return v === null ? '' : v; }
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

function pickerKind(label, key){
  return (/Support-VCs|Support-Räume|Voice|Warteraum|Feste Support|XP/.test(label || '') || /Voice|ChannelIds|supportFixed|supportXp/.test(key || '')) ? 'voice' : 'role';
}
/* ---------- Kategorien-System: Karten-Liste → „… erstellen“ → Einstellungen ----------
   Seiten mit mehreren gleichartigen Einträgen (Ticket-Panels, Kategorien, Büros, XP-Gruppen) zeigen zuerst
   eine Liste aus Karten mit einer „… erstellen“-Karte. Die Einstellungen eines Eintrags erscheinen erst,
   wenn man ihn öffnet (neu erstellte Einträge öffnen sich sofort). Gespeichert wird mit „Speichern“. */
const PENCIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
const collNewId = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const collChan = (id) => { const c = (state.channels || []).find(x => String(x.id) === String(id)); return c ? c.name : ''; };
const collCat = (id) => { const c = (state.categories || []).find(x => String(x.id) === String(id)); return c ? c.name : ''; };
const collCount = (n, one, many) => n + ' ' + (n === 1 ? one : many);

const COLL = {
  ticketPanels: {
    noun: 'Panel', plural: 'Panels', create: 'Neues Panel erstellen', max: 10,
    name: (r) => r.name || 'Panel',
    meta: (r) => (r.channelId ? '#' + (collChan(r.channelId) || 'Kanal') : 'Noch kein Kanal') + ' · ' + ((r.typeIds || []).length ? collCount(r.typeIds.length, 'Kategorie', 'Kategorien') : 'alle Kategorien'),
    make: () => ({ id: collNewId('tp'), name: 'Neues Panel', channelId: '', title: 'Erstelle hier ein Ticket', description: 'Wähle unten das passende Thema aus, um ein Support-Ticket zu eröffnen.', typeIds: [], showLoad: true }),
    sections: [
      { title: 'Panel', desc: 'Wo und wie das Panel erscheint.', fields: [
        { k: 'name', label: 'Name', hint: 'Nur für dich im Dashboard', type: 'text', max: 50 },
        { k: 'channelId', label: 'Kanal', type: 'channel', kind: 'text' },
        { k: 'title', label: 'Titel', type: 'text', max: 100 },
        { k: 'description', label: 'Text', type: 'area', max: 1500, rows: 5 },
        { k: 'showLoad', label: 'Auslastung im Panel anzeigen', type: 'bool', def: true }
      ] },
      { title: 'Kategorien', desc: 'Diese Kategorien stehen im Auswahlmenü des Panels. Ohne Haken erscheinen alle.', fields: [
        { k: 'typeIds', label: 'Kategorien', type: 'checks', source: 'ticketTypes' }
      ] }
    ],
    actions: [{ label: 'Panel senden', run: (row, btn) => collSendTicketPanel(row, btn) }]
  },
  ticketTypes: {
    noun: 'Kategorie', plural: 'Kategorien', create: 'Kategorie erstellen', max: 25,
    name: (r) => ((r.emoji ? r.emoji + ' ' : '') + (r.name || 'Kategorie')).trim(),
    meta: (r) => ((r.supportRoleIds || []).length ? collCount(r.supportRoleIds.length, 'Rolle', 'Rollen') : 'Keine Rollen') + ' · ' + (collCat(r.categoryId) || 'Keine Discord-Kategorie'),
    make: () => ({ id: collNewId('tt'), name: 'Neue Kategorie', emoji: '', description: '', supportRoleIds: [], supportRoleId: '', staffRoleId: '', pingRoleIds: [], pingRoleId: '', categoryId: '', openQuestion: '', preQuestion: '', openEmbed: '', closeEmbed: '', maxLoad: 10, aiEnabled: true }),
    sync: (r) => {
      const sr = r.supportRoleIds || []; r.supportRoleId = sr[0] || ''; r.staffRoleId = sr[0] || '';
      const pr = r.pingRoleIds || []; r.pingRoleId = pr[0] || '';
      r.preQuestion = r.openQuestion || '';
    },
    onDelete: (row) => { (state.settings.ticketPanels || []).forEach(p => { if (p && Array.isArray(p.typeIds)) p.typeIds = p.typeIds.filter(x => String(x) !== String(row.id) && String(x) !== String(row.name)); }); },
    sections: [
      { title: 'Allgemein', desc: 'So erscheint die Kategorie im Auswahlmenü.', fields: [
        { k: 'name', label: 'Name', type: 'text', max: 60 },
        { k: 'emoji', label: 'Emoji', hint: 'Optional', type: 'text', max: 60 },
        { k: 'description', label: 'Beschreibung', hint: 'Kurzer Text unter dem Namen im Menü', type: 'text', max: 100 }
      ] },
      { title: 'Zuständigkeit', desc: 'Wer Tickets dieser Kategorie bearbeitet und wo sie angelegt werden.', fields: [
        { k: 'supportRoleIds', label: 'Zuständige Rollen', type: 'roles', kind: 'role' },
        { k: 'pingRoleIds', label: 'Rollen anpingen', type: 'roles', kind: 'role' },
        { k: 'categoryId', label: 'Discord-Kategorie', type: 'channel', kind: 'category' },
        { k: 'maxLoad', label: 'Auslastung', hint: 'Ab so vielen offenen Tickets gilt die Kategorie als voll', type: 'number', min: 1, max: 999, def: 10 }
      ] },
      { title: 'Texte', desc: 'Fragen und Nachrichten dieser Kategorie.', fields: [
        { k: 'openQuestion', label: 'Frage vor dem Öffnen', hint: 'Optional', type: 'text', max: 45 },
        { k: 'openEmbed', label: 'Text im Ticket beim Öffnen', type: 'area', max: 1500, rows: 4 },
        { k: 'closeEmbed', label: 'Text beim Schließen', type: 'area', max: 1500, rows: 3 }
      ] },
      { title: 'Verhalten', desc: '', fields: [
        { k: 'aiEnabled', label: 'Ticket-KI in dieser Kategorie', hint: 'Gilt nur, wenn die Ticket-KI auf der Seite eingeschaltet ist', type: 'bool', def: true }
      ] }
    ]
  },
  officesList: {
    noun: 'Büro', plural: 'Büros', create: 'Büro erstellen', max: 100,
    name: (r) => r.name || 'Büro',
    meta: (r) => (r.category ? r.category + ' · ' : '') + (r.waitingChannelId ? 'Warteraum: ' + (collChan(r.waitingChannelId) || 'gesetzt') : 'Kein Warteraum'),
    make: () => ({ name: 'Neues Büro', category: '', waitingChannelId: '', pingRoleId: '', voiceChannelId: '' }),
    sections: [
      { title: 'Büro', desc: 'Büros mit gleicher Kategorie werden im Warteraum zusammengefasst.', fields: [
        { k: 'name', label: 'Name', type: 'text', max: 60 },
        { k: 'category', label: 'Kategorie', hint: 'Optional, z. B. Leitung', type: 'text', max: 40 }
      ] },
      { title: 'Kanäle & Rolle', desc: '', fields: [
        { k: 'waitingChannelId', label: 'Warteraum', type: 'channel', kind: 'voice' },
        { k: 'voiceChannelId', label: 'Büro-VC', type: 'channel', kind: 'voice' },
        { k: 'pingRoleId', label: 'Rolle bei Beitritt', type: 'role' }
      ] }
    ]
  },
  warteraumList: {
    noun: 'Warteraum', plural: 'Warteräume', create: 'Warteraum erstellen', max: 1,
    name: (r) => r.name || 'Warteraum',
    meta: (r) => r.channelId ? 'Voice: ' + (collChan(r.channelId) || 'Kanal') : 'Noch kein Voice-Kanal',
    make: () => ({ id: collNewId('wr'), name: 'Warteraum', channelId: '' }),
    sync: (r) => { collSetFlat('warteraumVoiceChannelId', r.channelId || ''); },
    onDelete: () => { ['warteraumVoiceChannelId', 'warteraumChannelId', 'waitingRoomChannelId'].forEach(k => collSetFlat(k, '')); },
    sections: [
      { title: 'Warteraum', desc: 'Der Voice-Kanal, in dem Mitglieder auf den Support warten. Erst danach erscheinen die weiteren Einstellungen dieser Seite.', fields: [
        { k: 'name', label: 'Name', hint: 'Nur für dich im Dashboard', type: 'text', max: 50 },
        { k: 'channelId', label: 'Warteraum-VC', type: 'channel', kind: 'voice' }
      ] }
    ]
  },
  xpGroups: {
    noun: 'Gruppe', plural: 'Gruppen', create: 'Gruppe erstellen', max: 12,
    name: (r) => r.name || 'Gruppe',
    meta: (r) => (r.enabled === false ? 'Aus · ' : '') + collCount(Number(r.periodDays) || 14, 'Tag', 'Tage') + ' · Top ' + (Number(r.topN) || 3) + ' · ' + collCount((r.roleIds || []).length, 'Rolle', 'Rollen'),
    make: () => ({ id: collNewId('xg'), name: 'Neue Gruppe', roleIds: [], periodDays: 14, topN: 3, minXp: 1, capAtGroupTop: true, respectRequirements: false, enabled: true }),
    sections: [
      { title: 'Gruppe', desc: 'Wer zur Gruppe gehört: alle Mitglieder mit mindestens einer dieser Rollen.', fields: [
        { k: 'name', label: 'Name', hint: 'z. B. Supporter oder Highteam', type: 'text', max: 40 },
        { k: 'roleIds', label: 'Rollen der Gruppe', type: 'roles', kind: 'role' },
        { k: 'enabled', label: 'Gruppe aktiv', type: 'bool', def: true }
      ] },
      { title: 'Zeitraum & Uprank', desc: '', fields: [
        { k: 'periodDays', label: 'XP-Zeitraum in Tagen', hint: 'z. B. 14 = 2 Wochen. Danach wird ausgewertet und der Zeitraum beginnt neu', type: 'number', min: 1, max: 365, def: 14 },
        { k: 'topN', label: 'Uprank für die Top', hint: 'So viele Plätze bekommen am Ende einen Uprank', type: 'number', min: 1, max: 25, def: 3 },
        { k: 'minXp', label: 'Mindest-XP für einen Platz', hint: 'Wer weniger hat, bekommt keinen Platz', type: 'number', min: 0, max: 10000000, def: 1 },
        { k: '_note', type: 'note', text: (r) => 'Nach ' + (Number(r.periodDays) || 14) + ' Tagen bekommen die besten ' + (Number(r.topN) || 3) + ' Mitglieder dieser Gruppe einen Uprank (mindestens ' + (Number(r.minXp) || 0) + ' XP). Danach beginnt der Zeitraum neu. Jede Gruppe wird für sich ausgewertet.' }
      ] },
      { title: 'Feinheiten', desc: '', fields: [
        { k: 'capAtGroupTop', label: 'An der Spitze der Gruppe stoppen', hint: 'Aus = der Uprank darf auch über die höchste Rolle der Gruppe hinausführen', type: 'bool', def: true },
        { k: 'respectRequirements', label: 'Rang-Anforderungen zusätzlich prüfen', hint: 'Aus = der Top-Platz reicht für den Uprank', type: 'bool', def: false }
      ] }
    ]
  }
};

/* Einzelne Einstellung (kein Array) setzen und beim nächsten „Speichern“ mitschicken */
function collSetFlat(key, val) {
  state.settings[key] = val;
  if (!state.pending) state.pending = {};
  state.pending[key] = val === '' ? null : val;
}

/* Gate: Seiten, auf denen erst etwas erstellt werden muss, bevor die übrigen Einstellungen erscheinen */
const COLL_GATE = {
  tickets: {
    coll: 'ticketPanels',
    ok: (st) => (Array.isArray(st.ticketPanels) && st.ticketPanels.length > 0) || !!st.ticketPanelChannelId, // alte Einrichtung bleibt erreichbar
    hint: 'Erstelle zuerst ein Ticket-Panel. Danach erscheinen Kategorien und alle weiteren Einstellungen.'
  },
  warteraum: {
    coll: 'warteraumList',
    ok: (st) => (Array.isArray(st.warteraumList) && st.warteraumList.some(r => r && r.channelId)),
    hint: 'Erstelle zuerst einen Warteraum und wähle seinen Voice-Kanal. Danach erscheinen alle weiteren Einstellungen.'
  },
  offices: {
    coll: 'officesList',
    ok: (st) => Array.isArray(st.officesList) && st.officesList.length > 0,
    hint: 'Erstelle zuerst ein Büro. Danach erscheinen alle weiteren Einstellungen.'
  }
};
/* Alte Einrichtung übernehmen: ein bereits gesetzter Warteraum-VC wird als Eintrag angezeigt (ohne etwas zu ändern) */
function collMigrateLegacy() {
  const st = state.settings || {};
  if (!Array.isArray(st.warteraumList)) st.warteraumList = [];
  const legacy = st.warteraumVoiceChannelId || st.warteraumChannelId || st.waitingRoomChannelId;
  if (!st.warteraumList.length && legacy) st.warteraumList = [{ id: 'wr_main', name: 'Warteraum', channelId: String(legacy) }];
}
function collGateLocked(catId) {
  const g = COLL_GATE[catId];
  if (!g) return null;
  try { collMigrateLegacy(); } catch (_) {}
  return g.ok(state.settings || {}) ? null : g;
}

function collFindField(def, k) {
  for (const sec of def.sections) for (const f of sec.fields) if (f.k === k) return f;
  return null;
}

function collectionGridHtml(collId) {
  const def = COLL[collId];
  if (!def) return '';
  const arr = Array.isArray(state.settings[collId]) ? state.settings[collId] : [];
  const items = arr.map((r, i) => (r && typeof r === 'object')
    ? `<button type="button" class="coll-item" data-coll="${collId}" data-i="${i}"><span class="coll-txt"><b>${escapeHtml(def.name(r))}</b><small>${escapeHtml(def.meta(r))}</small></span><span class="coll-edit">${PENCIL}</span></button>`
    : '').join('');
  const full = !!(def.max && arr.length >= def.max);
  const create = full ? '' : `<button type="button" class="coll-item coll-new" data-coll="${collId}" data-new="1"><span class="coll-txt"><b>${escapeHtml(def.create)}</b></span><span class="coll-plus" aria-hidden="true">+</span></button>`;
  const lock = collGateLocked(state.currentCat);
  const hint = (lock && lock.coll === collId) ? `<p class="coll-hint">${escapeHtml(lock.hint)}</p>` : '';
  return `<div class="coll-grid">${items}${create}</div>${hint}`;
}

function collFieldHtml(f, row) {
  const k = escapeHtml(f.k);
  const lab = escapeHtml(f.label || '');
  const v = row[f.k];
  const label = `<span>${lab}${f.hint ? `<small>${escapeHtml(f.hint)}</small>` : ''}</span>`;
  if (f.type === 'note') return `<p class="coll-note">${escapeHtml(typeof f.text === 'function' ? f.text(row) : f.text)}</p>`;
  if (f.type === 'text') return `<label class="setting-row">${label}<input data-f="${k}" value="${escapeHtml(v == null ? '' : v)}" maxlength="${f.max || 200}" placeholder="${escapeHtml(f.ph || '')}"></label>`;
  if (f.type === 'area') return `<label class="setting-row">${label}<textarea data-f="${k}" rows="${f.rows || 4}" maxlength="${f.max || 1500}">${escapeHtml(v == null ? '' : v)}</textarea></label>`;
  if (f.type === 'number') return `<label class="setting-row">${label}<input data-f="${k}" data-num="1" type="number" inputmode="numeric" step="1" min="${f.min == null ? '' : f.min}" max="${f.max == null ? '' : f.max}" value="${(v == null || v === '' || !Number.isFinite(Number(v))) ? (f.def == null ? '' : f.def) : Number(v)}"></label>`;
  if (f.type === 'channel') return `<label class="setting-row">${label}<select data-f="${k}">${f.kind === 'category' ? categoryOptions(v) : channelOptions(v, f.kind)}</select></label>`;
  if (f.type === 'role') return `<label class="setting-row">${label}<select data-f="${k}">${roleOptions(v)}</select></label>`;
  if (f.type === 'roles') {
    const arr = Array.isArray(v) ? v : [];
    return `<div class="setting-row">${label}<button type="button" class="role-btn coll-multi${arr.length ? ' has-value' : ''}" data-f="${k}"><b>${lab}</b><span>${escapeHtml(multiLabel(arr, 'role'))}</span></button></div>`;
  }
  if (f.type === 'bool') {
    const on = f.def === true ? !(v === false || v === 'Aus' || v === 'false') : (v === true || v === 'An' || v === 'true');
    return `<div class="setting-row">${label}<button type="button" class="toggle${on ? ' on' : ''}" data-f="${k}" role="switch" aria-checked="${on}" aria-label="${lab}"><i></i></button></div>`;
  }
  if (f.type === 'checks') {
    const sel = new Set((Array.isArray(v) ? v : []).map(String));
    const src = Array.isArray(state.settings[f.source]) ? state.settings[f.source] : [];
    const boxes = src.filter(t => t && typeof t === 'object').map(t => {
      const id = String(t.id || t.name || '');
      const on = sel.has(id) || sel.has(String(t.name || ''));
      return `<label class="coll-check"><input type="checkbox" data-fc="${k}" value="${escapeHtml(id)}"${on ? ' checked' : ''}><span>${escapeHtml(((t.emoji ? t.emoji + ' ' : '') + (t.name || id)).trim())}</span></label>`;
    }).join('');
    return `<div class="setting-row coll-checks-row">${label}<div class="coll-checks">${boxes || '<p class="list-empty">Noch keine Kategorien. Erstelle sie auf der Seite „Tickets“ unter „Kategorien“. Ohne Auswahl erscheinen alle.</p>'}</div></div>`;
  }
  return '';
}

/** Detailansicht des geöffneten Eintrags (oder null, wenn es ihn nicht mehr gibt) */
function collDetail(catId) {
  const cs = state.coll;
  if (!cs) return null;
  const def = COLL[cs.id];
  const arr = state.settings[cs.id];
  if (!def || !Array.isArray(arr) || !arr[cs.i] || typeof arr[cs.i] !== 'object') return null;
  const row = arr[cs.i];
  const sections = def.sections.map(sec =>
    `<article class="settings-card glass coll-form"><div class="card-head"><div><h3>${escapeHtml(sec.title)}</h3>${sec.desc ? `<p>${escapeHtml(sec.desc)}</p>` : ''}</div></div><div class="card-body">${sec.fields.map(f => collFieldHtml(f, row)).join('')}</div></article>`
  ).join('');
  const actions = (def.actions || []).length
    ? `<article class="settings-card glass coll-form"><div class="card-head"><div><h3>Aktionen</h3></div></div><div class="card-body"><div class="action-row">${def.actions.map((a, j) => `<button type="button" class="btn btn-primary coll-act" data-j="${j}">${escapeHtml(a.label)}</button>`).join('')}</div></div></article>`
    : '';
  return {
    html: sections + actions,
    title: def.name(row),
    desc: def.noun + ' bearbeiten. Änderungen übernimmst du oben mit „Speichern“.',
    back: `<button type="button" class="btn btn-ghost btn-sm coll-back">← Alle ${escapeHtml(def.plural)}</button>`,
    tools: `<button type="button" class="btn btn-danger btn-sm coll-del">${escapeHtml(def.noun)} löschen</button>`
  };
}

async function collSendTicketPanel(row, btn) {
  if (!row.channelId) { toast('Wähle zuerst einen Kanal für dieses Panel', 'err'); return; }
  if (btn) btn.disabled = true;
  try {
    const ok = await saveCurrent();
    if (ok === false) { toast('Erst speichern, dann senden', 'err'); return; }
    toast('Sende …', 'busy');
    await API.sendPanel(state.guildId, 'tickets', row.channelId, { panelId: row.id });
    toast('Panel gesendet', 'ok');
  } catch (e) {
    toast((e && e.message) ? String(e.message).slice(0, 120) : 'Senden fehlgeschlagen', 'err');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function wireCollection(panel, catId) {
  panel.querySelectorAll('.coll-item').forEach(b => {
    b.onclick = () => {
      const cid = b.dataset.coll, def = COLL[cid];
      if (!def) return;
      const arr = Array.isArray(state.settings[cid]) ? state.settings[cid].slice() : [];
      if (b.dataset.new) {
        if (def.max && arr.length >= def.max) { toast('Maximal ' + def.max + ' ' + def.plural, 'err'); return; }
        arr.push(def.make());
        state.settings[cid] = arr;
        markDirty();
        state.coll = { cat: catId, id: cid, i: arr.length - 1 };
      } else {
        state.coll = { cat: catId, id: cid, i: Number(b.dataset.i) };
      }
      openCategory(catId);
      try { window.scrollTo(0, 0); const m = document.getElementById('main'); if (m) m.scrollTop = 0; } catch (_) {}
    };
  });
  const cs = state.coll;
  if (!cs || cs.cat !== catId) return;
  const def = COLL[cs.id];
  const row = (state.settings[cs.id] || [])[cs.i];
  if (!def || !row) return;
  const noteFields = [];
  def.sections.forEach(sec => sec.fields.forEach(f => { if (f.type === 'note' && typeof f.text === 'function') noteFields.push(f); }));
  const paintNotes = () => { const els = panel.querySelectorAll('.coll-note'); noteFields.forEach((f, i) => { if (els[i]) els[i].textContent = f.text(row); }); };
  const touch = () => { if (def.sync) def.sync(row); paintNotes(); markDirty(); };

  const back = panel.querySelector('.coll-back');
  if (back) back.onclick = () => { state.coll = null; openCategory(catId); };

  const del = panel.querySelector('.coll-del');
  if (del) {
    let armed = null;
    del.onclick = () => {
      if (!armed) {
        del.textContent = 'Wirklich löschen?'; del.classList.add('is-armed');
        armed = setTimeout(() => { armed = null; del.textContent = def.noun + ' löschen'; del.classList.remove('is-armed'); }, 4000);
        return;
      }
      clearTimeout(armed);
      const arr = state.settings[cs.id].slice();
      arr.splice(cs.i, 1);
      state.settings[cs.id] = arr;
      if (def.onDelete) def.onDelete(row);
      markDirty();
      state.coll = null;
      openCategory(catId);
      toast(def.noun + ' gelöscht – mit „Speichern“ übernehmen');
    };
  }

  panel.querySelectorAll('[data-f]').forEach(el => {
    const k = el.dataset.f;
    const f = collFindField(def, k) || {};
    if (el.classList.contains('toggle')) {
      el.onclick = () => { const on = !el.classList.contains('on'); el.classList.toggle('on', on); el.setAttribute('aria-checked', String(on)); row[k] = on; touch(); };
      return;
    }
    if (el.classList.contains('coll-multi')) {
      el.onclick = () => openPickerDrawer({
        title: f.label, kind: f.kind || 'role', sourceBtn: el,
        getCurrent: () => row[k] || [],
        onChange: (arr) => { row[k] = arr; el.classList.toggle('has-value', arr.length > 0); touch(); }
      });
      return;
    }
    const handler = () => {
      if (el.dataset.num) {
        const n = Number(el.value);
        const lo = f.min == null ? -Infinity : f.min, hi = f.max == null ? Infinity : f.max;
        row[k] = (el.value === '' || !Number.isFinite(n)) ? (f.def == null ? 0 : f.def) : Math.min(hi, Math.max(lo, Math.round(n)));
      } else {
        row[k] = el.value;
      }
      if (k === 'name') {
        const h = panel.querySelector('.settings-heading h1'); if (h) h.textContent = def.name(row);
        const cr = document.getElementById('crumbPage'); const cc = C.find(x => x[0] === catId);
        if (cr && cc) cr.textContent = cc[1] + ' / ' + def.name(row);
      }
      touch();
    };
    el.oninput = handler;
    el.onchange = handler;
    if (el.dataset.num) el.onblur = () => { el.value = row[k]; };
  });
  panel.querySelectorAll('[data-fc]').forEach(el => {
    el.onchange = () => {
      const k = el.dataset.fc;
      row[k] = [...panel.querySelectorAll('[data-fc="' + k + '"]')].filter(b => b.checked).map(b => b.value);
      touch();
    };
  });
  panel.querySelectorAll('.coll-act').forEach(b => { b.onclick = () => def.actions[Number(b.dataset.j)].run(row, b); });
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
        else if (/^(Warteraum-Musik|Musik wiederholen|Namen selbst ändern|Team darf suchen|Kategorien mehrfach wählbar|Rollenänderungen loggen|Namensänderungen loggen|Admin-Aktionen loggen|Alle Rollen loggen|Appeals aktiv|Nur bei aktivem Ban|Feedback als Sticky|Abmeldung muss bestätigt werden|Häuser auf Ausweis anzeigen|Externe Apps deaktivieren|Anti-Nuke|Anti-Raid|Welcome Ping|Join-to-Create Support-VCs|Stats Tickets|Stats Support|Stats Duty|Ticket-KI|XP Auto-Uprank)$/.test(label)) opts = ['An','Aus'];
        if (label === 'Testphase Auto-Pass' || label === 'Honeypot DM') opts = ['An','Aus'];
        if (label === 'Honeypot Strafe') opts = ['Ban','Softban','Kick','Timeout','Nur löschen'];
        if (label === 'Rollen-Panel Modus') opts = ['Mehrfach','Einzeln'];
        if (!opts.length) opts = [def||'—'].filter(Boolean);
        const isOnOff = opts.length === 2 && opts[0] === 'An' && opts[1] === 'Aus';
        // An/Aus: der Bot speichert true/false – hier wieder als „An“/„Aus“ anzeigen
        const cur = isOnOff
          ? ((val === false || /^(aus|off|false|0|nein)$/i.test(String(val))) ? 'Aus' : 'An')
          : String(val||'');
        control = `<select data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}">${isOnOff ? '' : '<option value="">—</option>'}${opts.map(o=>`<option value="${escapeHtml(o)}"${cur===o?' selected':''}>${escapeHtml(o)}</option>`).join('')}</select>`;
      } else if (hint === 'area') {
        control = `<textarea data-key="${escapeHtml(key)}" data-label="${escapeHtml(label)}" rows="5">${escapeHtml(val)}</textarea>`;
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
      const cur = key ? getSetting(key, []) : [];
      const has = (Array.isArray(cur) ? cur : (cur ? [cur] : [])).filter(Boolean).length;
      return `<button type="button" class="role-btn${has ? ' has-value' : ''}" data-role="${escapeHtml(label)}" data-key="${escapeHtml(key)}"><b>${escapeHtml(label)}</b><span>${escapeHtml(multiLabel(cur, pickerKind(label, key) === 'voice' ? 'channel' : 'role'))}</span></button>`;
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
          <div class="list-card-meta">Kategorie: ${escapeHtml(row.category||'—')} · Warteraum: ${escapeHtml(row.waitingChannelId||'—')} · Rolle: ${escapeHtml(row.pingRoleId||'—')} · VC: ${escapeHtml(row.voiceChannelId||'—')}</div>
        </div>`;
      }
      if (storeKey === 'stickyList' && row && typeof row === 'object') {
        const chName = ((state.channels||[]).find(c=>String(c.id)===String(row.channelId))||{}).name;
        return `<div class="list-card" data-i="${i}">
          <div class="list-card-head"><b>${escapeHtml(row.title||'Sticky')}</b><button type="button" class="btn listedit-rm" data-i="${i}">Entfernen</button></div>
          <div class="list-card-meta">Kanal: ${escapeHtml(chName?('#'+chName):(row.channelId||'—'))} · ${escapeHtml(String(row.text||'').slice(0,90))}</div>
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
        <label class="setting-row"><span>Kategorie (optional)</span><input class="sf-ocat" maxlength="40" placeholder="z.B. Leitung"></label>
        <label class="setting-row"><span>Warteraum</span><select class="sf-wait">${channelOptions('','voice')}</select></label>
        <label class="setting-row"><span>Rolle bei Beitritt</span><select class="sf-role">${roleOptions('')}</select></label>
        <label class="setting-row"><span>Büro VC</span><select class="sf-voice">${channelOptions('','voice')}</select></label>
        <button type="button" class="btn btn-primary listedit-add-btn" style="margin-top:8px">Büro hinzufügen</button>
      </div>`;
    } else if (storeKey === 'stickyList') {
      form = `<div class="structured-form" data-form="stickyList">
        <div class="form-title">Sticky hinzufügen</div>
        <label class="setting-row"><span>Kanal</span><select class="sf-chan">${channelOptions('','text')}</select></label>
        <label class="setting-row"><span>Titel (optional)</span><input class="sf-title" maxlength="100" placeholder="z.B. Hinweis"></label>
        <label class="setting-row"><span>Text</span><textarea class="sf-text" maxlength="1500" rows="4" placeholder="Der Text, der ganz unten im Kanal stehen bleibt"></textarea></label>
        <button type="button" class="btn btn-primary listedit-add-btn" style="margin-top:8px">Sticky hinzufügen</button>
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
          <button type="button" class="btn role-btn sf-staff-btn" data-temp="sfStaffRoles"><b>Staff-Rollen</b><span class="sf-staff-lbl">Auswählen</span></button>
        </label>
        <label class="setting-row"><span>Ping-Rollen</span>
          <button type="button" class="btn role-btn sf-ping-btn" data-temp="sfPingRoles"><b>Ping-Rollen</b><span class="sf-ping-lbl">Auswählen</span></button>
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
  if(type==='collection') body = collectionGridHtml(items[0]);
  if(type==='table') body=`<div class="table-wrap"><table><thead><tr><th>Member</th><th>XP</th><th>Tickets</th><th>Duty</th></tr></thead><tbody><tr><td colspan="4">—</td></tr></tbody></table></div>`;
  if(type==='chart') body=`<div class="chart-bars">${[42,68,51,79,63,88,71,94,77,83,69,98].map(v=>`<i style="height:${v}%"></i>`).join('')}</div>`;
  return `<article class="settings-card glass${type==='switches'?' card-switches':''}"><div class="card-head"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p></div><span class="card-chevron">›</span></div><div class="card-body">${body}</div></article>`;
}


  function wireFileUploads(catId) {
    const panel = document.getElementById('settingsPanel');
    if (!panel || !state.guildId) return;
    panel.querySelectorAll('.file-upload-block').forEach(n => n.remove());
    if (state.coll && state.coll.cat === catId) return; // Detailansicht eines Eintrags: nur dessen Einstellungen
    if (collGateLocked(catId)) return; // noch gesperrte Seite: erst den Eintrag erstellen

    function addBlock(title, hint, accept, maxMB, onFile) {
      const card = document.createElement('article');
      card.className = 'settings-card glass file-upload-block';
      card.innerHTML = `<div class="card-head"><div><h3>${title} <span class="chip-live">Sofort aktiv</span></h3><p>${hint}</p></div></div>
        <div class="card-body"><div class="setting-row">
          <span>Datei (max. ${maxMB} MB)</span>
          <div class="mp-row">
            <input type="file" accept="${accept}" class="fu-input">
            <button type="button" class="btn btn-primary fu-btn">Hochladen</button>
            <span class="fu-status" role="status"></span>
          </div>
        </div></div>`;
      const inp = card.querySelector('.fu-input');
      const btn = card.querySelector('.fu-btn');
      const st = card.querySelector('.fu-status');
      btn.onclick = async () => {
        const f = inp.files && inp.files[0];
        if (!f) { st.textContent = 'Bitte zuerst eine Datei wählen.'; st.dataset.state = 'err'; toast('Keine Datei gewählt'); return; }
        if (f.size > maxMB * 1024 * 1024) {
          st.textContent = 'Zu groß (' + (f.size / 1048576).toFixed(1) + ' MB, max. ' + maxMB + ' MB)'; st.dataset.state = 'err'; toast('Datei zu groß'); return;
        }
        btn.disabled = true; st.dataset.state = ''; st.textContent = 'Lade hoch …';
        try {
          const r = await onFile(f);
          st.textContent = (r && r.message) || 'Gespeichert ✓'; st.dataset.state = 'ok';
          toast('Hochgeladen');
        } catch (e) {
          const m = (e && e.message) ? String(e.message).slice(0, 140) : 'Upload fehlgeschlagen';
          st.textContent = m; st.dataset.state = 'err'; toast(m, 'err');
          console.warn('[upload]', e);
        } finally { btn.disabled = false; }
      };
      (panel.querySelector('.settings-grid') || panel).appendChild(card);
    }

    function readAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
        r.readAsDataURL(file);
      });
    }
    const IMG = 'image/png,image/jpeg,image/webp,image/gif';
    const imgUpload = (kind, label, hint) => addBlock(label, hint, IMG, 8, async (f) => {
      const data = await readAsDataURL(f);
      const r = await API.uploadTicketImage(state.guildId, kind, data);
      if (r && r.error) throw new Error(r.error);
      return { message: 'Gespeichert ✓ – Ticket-Panel neu senden, damit es erscheint' };
    });

    if (catId === 'warteraum') {
      addBlock('Warteraum-Musik', 'Wird im Warteraum abgespielt.', 'audio/*,.mp3,.ogg,.wav,.webm,.m4a', 25, async (f) => {
        const data = await readAsDataURL(f);
        const r = await API.uploadMusic(state.guildId, f.name, data);
        if (r && r.error) throw new Error(r.error);
        return { message: 'Gespeichert ✓ – wird beim nächsten Beitritt gespielt. Wiederholen oben unter „Musik wiederholen“ einstellen.' };
      });
    }
    if (catId === 'tickets') {
      imgUpload('panel', 'Ticket-Panel Bild', 'Bild im Ticket-Panel');
      imgUpload('create', 'Ticket-Eröffnung Bild', 'Bild in der Nachricht, wenn ein Ticket geöffnet wird');
      imgUpload('close', 'Ticket-Close Bild', 'Bild in der Nachricht beim Schließen');
    }
  }

  function openCategory(id){
  // file uploads after render
  const __after = () => { try { wireFileUploads(id); } catch (e) {} try { wireLive(id); } catch (e) { console.warn('[live]', e); } try { wireRank(id); } catch (e) { console.warn('[rank]', e); } try { wireHome(id); } catch (e) { console.warn('[home]', e); } try { paintWebhookCard(); } catch (e) {} };
  const c=C.find(x=>x[0]===id);
  if(!c) return;
  if (state.coll && state.coll.cat !== id) state.coll = null; // anderer Bereich: wieder die Karten-Liste
  state.currentCat = id;
  state.extraSavers = {}; state.extraDirty = {}; state.navWarn = null;
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

  const cd = (state.coll && state.coll.cat === id) ? collDetail(id) : null;
  if (state.coll && state.coll.cat === id && !cd) state.coll = null;
  const gateLock = cd ? null : collGateLocked(id);
  const tplCards = gateLock
    ? (templates[id] || []).filter(cc => cc[2] === 'switches' || (cc[2] === 'collection' && cc[3][0] === gateLock.coll))
    : (templates[id] || []);
  const cards = cd ? cd.html : tplCards.map(renderCard).join('');
  const emptyHint = cards
    ? ''
    : '<div class="settings-card glass"><div class="card-head"><div><h3>Keine Einstellungen hier</h3><p>Wähle links eine andere Seite. Ist das Modul ausgeschaltet, aktiviere es unter „Module“.</p></div></div></div>';
  const groupName = ((GROUPS.find(g => g[1].includes(id)) || [])[0]) || 'Dashboard';
  const tools = id === 'home'
    ? `<button class="btn" id="refreshPage" type="button" title="Status, Einstellungen, Kanäle und Rollen neu laden">${ICON.refresh}<span> Aktualisieren</span></button>`
    : `<span class="save-state" data-state="clean" role="status"></span><button class="btn btn-ghost" id="discardAll" type="button" hidden>Verwerfen</button><button class="btn" id="refreshPage" type="button" title="Einstellungen, Kanäle und Rollen vom Server neu laden">${ICON.refresh}<span> Aktualisieren</span></button><button class="btn btn-primary" id="saveAll" type="button">Speichern</button>`;
  panel.innerHTML = banner + `<div class="settings-heading"><div class="sh-text"><div class="breadcrumb">${escapeHtml(groupName)} <span>/</span> ${escapeHtml(c[1])}</div>${cd ? cd.back : ''}<h1>${escapeHtml(cd ? cd.title : c[1])}</h1><p>${escapeHtml(cd ? cd.desc : c[2])}</p></div><div class="sh-actions">${cd ? cd.tools : ''}${tools}</div></div><div class="settings-grid">${id === 'home' ? '' : (cards || emptyHint)}</div>`;
  panel.style.display = 'block';
  panel.style.visibility = 'visible';
  panel.style.opacity = '1';
  paintCrumbs(id === 'home' ? '' : groupName, cd ? c[1] + ' / ' + cd.title : c[1]);
  try { paintModuleBanner(id); } catch (e) { console.warn('[module-banner]', e); }

  const bl = $('bannerLogin');
  if(bl) bl.onclick = ()=> API.login(location.origin + '/dashboard/');
  const bs = $('bannerServer');
  if(bs) bs.onclick = ()=> { const p=$('serverPicker'); if(p) p.classList.add('open'); };

  const saveBtn = $('saveAll');
  if(saveBtn) saveBtn.onclick = () => saveCurrent();
  const rfBtn = $('refreshPage'); if (rfBtn) rfBtn.onclick = () => refreshPage();
  const dcBtn = $('discardAll'); if (dcBtn) dcBtn.onclick = () => discardChanges();
  paintSaveState();
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
        state.pending[KEY_MAP[t.getAttribute('data-label')]] = on;
      } else {
        state.modules[k] = on;
      }
      markDirty();
      // rebuild nav to hide disabled modules
      try { buildNav(); } catch(e) {}
      try { paintModuleBanner(id); } catch(e) {}
    };
  });
  panel.querySelectorAll('.action-btn').forEach(b=>{ b.onclick = () => handleAction(b.dataset.action, id); });
  panel.querySelectorAll('.role-btn').forEach(b=>{ b.onclick = () => openRoleDrawer(b); });
  __after(); // Upload-Blöcke (Ticket-Bilder, Warteraum-Musik) einhängen – wurde vorher nie aufgerufen
  try { wireCollection(panel, id); } catch (e) { console.warn('[coll]', e); } // überschreibt die allgemeinen Handler für Karten-Listen und Detailansicht
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
        } else if (key === 'stickyList') {
          const channelId = (box.querySelector('.sf-chan')||{}).value || '';
          const title = ((box.querySelector('.sf-title')||{}).value || '').trim().slice(0, 100);
          const text = ((box.querySelector('.sf-text')||{}).value || '').trim().slice(0, 1500);
          if (!channelId || !text) { toast('Error'); return; }
          if (arr.length >= 10) { toast('Error'); return; }
          if (arr.some(x => x && String(x.channelId) === String(channelId))) { toast('Error'); return; }
          arr.push({ id: 'st_'+Date.now().toString(36), channelId, title, text });
        } else if (key === 'officesList') {
          const name = (box.querySelector('.sf-name')||{}).value || '';
          const waitingChannelId = (box.querySelector('.sf-wait')||{}).value || '';
          const pingRoleId = (box.querySelector('.sf-role')||{}).value || '';
          const voiceChannelId = (box.querySelector('.sf-voice')||{}).value || '';
          if (!name.trim()) { toast('Error'); return; }
          const category = ((box.querySelector('.sf-ocat')||{}).value || '').trim().slice(0, 40);
          arr.push({ name: name.trim(), category, waitingChannelId, pingRoleId, voiceChannelId });
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
  try { await saveCurrent(); } catch (e) {}  // erst speichern, dann senden
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
    else if (L.includes('ic-namen')) panel = 'ic_names';
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
        verify:'verify', factions:'fraktionsliste', houses:'hausliste', icnames:'ic_names', feedback:'feedback',
        abmeldung:'abmelden', teamlist:'teamlist', admincall:'admincall', partner:'partner',
        icmod:'modpanel', suggest:'suggest', giveaway:'giveaway', xp:'xp_panel', interview:'interview'
      };
      panel = mapCat[catId] || catId || 'tickets';
    }
  }
  try {
    if (!state.guildId) {
      toast('Zuerst Server wählen');
      return;
    }
    // normalize panel type for bot
    const panelNormMap = {
      abmeldung: 'abmelden', abmelde: 'abmelden',
      icMod: 'modpanel', icmod: 'modpanel', ingame: 'modpanel', ic: 'modpanel'
    };
    if (panelNormMap[panel]) panel = panelNormMap[panel];

    const chKeys = [
      PANEL_CHANNEL[panel],
      panel === 'abmelden' ? 'abmeldungPanelChannelId' : null,
      panel === 'abmelden' ? 'abmeldenPanelChannelId' : null,
      panel === 'modpanel' ? 'icModPanelChannelId' : null,
      panel === 'modpanel' ? 'modPanelChannelId' : null,
      panel === 'modpanel' ? 'ingameLogChannelId' : null
    ].filter(Boolean);
    let channelId = null;
    for (const k of chKeys) {
      if (state.settings[k]) { channelId = state.settings[k]; break; }
    }
    // fallback: any selected channel on page
    if (!channelId) {
      const sels = document.querySelectorAll('#settingsPanel select[data-key$="ChannelId"], #settingsPanel select[data-key*="Panel"], #settingsPanel select[data-key*="Channel"]');
      for (const sel of sels) {
        if (sel && sel.value && /^\d{15,22}$/.test(String(sel.value))) { channelId = sel.value; break; }
      }
    }
    if (!channelId) {
      toast('Kanal wählen (Panel-Kanal in den Settings)');
      return;
    }
    toast('Sende…');
    await API.sendPanel(state.guildId, panel, channelId);
    toast('Gesendet');
  } catch (e) {
    const msg = (e && e.message) ? String(e.message).slice(0, 120) : 'Error';
    toast(msg);
    console.warn('[panel send]', panel, e);
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
  const readCurrent = () => {
    let cur = opts.getCurrent ? opts.getCurrent() : ((opts.tempStore && state._tempMulti && state._tempMulti[opts.tempStore]) ? state._tempMulti[opts.tempStore] : getSetting(key, []));
    if (!Array.isArray(cur)) cur = cur ? [cur] : [];
    return cur.map(String);
  };
  const selSet = new Set(readCurrent());
  let items = [];
  if (opts.kind === 'role') {
    items = (state.roles||[]).filter(r=>r && r.managed !== true).map(r=>({id:r.id,name:r.name,prefix:'@ '}));
  } else {
    let list = state.channels||[];
    if (opts.kind === 'voice') list = list.filter(isVoiceChannel);
    else if (opts.kind === 'text') list = list.filter(isTextChannel);
    items = list.map(c=>({id:c.id,name:c.name,prefix:isVoiceChannel(c)?'🔊 ':'# '}));
  }
  const body = items.map(it=>{
    const on = selSet.has(String(it.id));
    return `<button type="button" class="setting-row role-pick${on?' is-on':''}" data-id="${it.id}" data-name="${escapeHtml(it.name||'')}" aria-pressed="${on}"><b>${it.prefix}${escapeHtml(it.name||it.id)}</b></button>`;
  }).join('') || '<p class="list-empty">Nichts geladen. Tippe auf „Neu laden“, falls du gerade etwas in Discord angelegt hast.</p>';
  $('drawerBody').innerHTML = `<input type="search" id="drawerSearch" placeholder="Suchen" aria-label="Suchen" autocomplete="off"><div id="drawerList" class="action-list">${body}</div>` +
    `<div class="drawer-foot"><span class="dh-count" id="drawerCount"></span><span class="mp-row"><button type="button" class="btn btn-sm" id="drawerReload">${ICON.refresh}<span> Neu laden</span></button><button type="button" class="btn btn-primary btn-sm" id="drawerDone">Fertig</button></span></div>`;
  d.classList.add('open');
  const count = () => { const n = $('drawerList').querySelectorAll('.role-pick.is-on').length; $('drawerCount').textContent = n === 1 ? '1 ausgewählt' : n + ' ausgewählt'; };
  count();
  const applySearch = ()=>{
    const q = (($('drawerSearch')||{}).value||'').toLowerCase();
    $('drawerList').querySelectorAll('.role-pick').forEach(b=>{
      const n = (b.getAttribute('data-name')||b.textContent||'').toLowerCase();
      b.style.display = !q || n.includes(q) ? '' : 'none';
    });
  };
  if ($('drawerSearch')) { $('drawerSearch').oninput = applySearch; setTimeout(()=>{ try { $('drawerSearch').focus(); } catch (_) {} }, 60); }
  $('drawerDone').onclick = () => d.classList.remove('open');
  $('drawerReload').onclick = async () => {
    const b = $('drawerReload'); if (b) b.classList.add('is-spinning');
    try { applyDiscord(await API.discord(state.guildId, true)); toast('Kanäle und Rollen aktualisiert', 'ok'); openPickerDrawer(opts); }
    catch (e) { toast((e && e.message) ? String(e.message).slice(0, 120) : 'Konnte nicht neu laden', 'err'); if (b) b.classList.remove('is-spinning'); }
  };
  $('drawerList').querySelectorAll('.role-pick').forEach(btn2=>{
    btn2.onclick = () => {
      const id = btn2.dataset.id;
      let arr = readCurrent();
      if (arr.includes(id)) arr = arr.filter(x=>x!==id); else arr.push(id);
      const kindForLabel = opts.kind==='role'?'role':'channel';
      if (opts.onChange) {
        opts.onChange(arr);
        if (opts.sourceBtn) {
          const sp = opts.sourceBtn.querySelector('span');
          if (sp) sp.textContent = multiLabel(arr, kindForLabel);
        }
      } else if (opts.tempStore) {
        if (!state._tempMulti) state._tempMulti = {};
        state._tempMulti[opts.tempStore] = arr;
        if (opts.sourceBtn) {
          const sp = opts.sourceBtn.querySelector('span');
          if (sp) sp.textContent = multiLabel(arr, kindForLabel);
        }
      } else {
        state.settings[state.currentRoleKey] = arr;
        if (opts.sourceBtn) {
          const sp = opts.sourceBtn.querySelector('span');
          if (sp) sp.textContent = multiLabel(arr, kindForLabel);
          opts.sourceBtn.classList.toggle('has-value', arr.length > 0);
        }
        markDirty();
      }
      const on = arr.includes(id);
      btn2.classList.toggle('is-on', on); btn2.setAttribute('aria-pressed', String(on));
      count();
    };
  });
}
function openRoleDrawer(btn){
  const label = btn.dataset.role || '';
  const key = btn.dataset.key || KEY_MAP[label] || '';
  const kind = pickerKind(label, key);
  openPickerDrawer({ key, title: label || 'Auswahl', kind, sourceBtn: btn });
}

async function saveCurrent(){
  if(!state.guildId){ toast('Zuerst Server wählen'); return false; }
  if (state.saving) return false;
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
  // Änderungen von Seiten, die du zwischendurch verlassen hast
  Object.keys(state.pending || {}).forEach(k => { if (partial[k] === undefined) partial[k] = state.pending[k]; });
  // always persist arrays / multi-selects from state
  const arrayKeys = [
    'ticketTypes','ticketOpenQuestions','adminCallQuestions','officesList','stickyList','applicationsList',
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
  state.saving = true; state.saveError = false; paintSaveState();
  const sb = $('saveAll'); if (sb) sb.disabled = true;
  let ok = true;
  try {
    if (Object.keys(partial).length) tasks.push(API.patchSettings(state.guildId, partial));
    if (Object.keys(modules).length) tasks.push(API.patchModules(state.guildId, modules));
    await Promise.all(tasks);
    // merge back
    Object.assign(state.settings, partial);
    state.pending = {}; state.dirty = false;
    // Zusatz-Speicher der Seite (z. B. Ranglaufbahn mit eigener Prüfung)
    const extras = Object.values(state.extraSavers || {});
    if (extras.length) {
      const res = await Promise.all(extras.map(fn => Promise.resolve(fn()).catch(() => false)));
      if (res.some(r => r === false)) ok = false;
    }
    if (ok) { state.dirtyCats.clear(); toast('Gespeichert'); }
    else { state.saveError = true; toast('Teile der Seite sind nicht gespeichert. Details siehe Meldungen auf der Seite.', 'err'); }
  } catch (e) {
    ok = false; state.saveError = true; state.dirty = true;
    console.error('save', e);
    toast(e && e.message ? String(e.message).slice(0, 140) : 'Speichern fehlgeschlagen', 'err');
  } finally {
    state.saving = false;
    const sb2 = $('saveAll'); if (sb2) sb2.disabled = false;
    paintSaveState();
  }
  return ok;
}

async function loadGuild(gid, opts){
  setTimeout(function(){ try{ refreshStatus(); }catch(e){} }, 800);
  opts = opts || {};
  state.guildId = String(gid);
  const gmeta = (state.guilds || []).find(x => String(x.id) === String(gid));
  if (gmeta) setServerMeta(gmeta);
  document.body.classList.add('is-loading');
  try {
    if (!opts.quiet) toast('Lade …', 'busy');
    const [cfg, disc] = await Promise.all([
      API.config(gid),
      API.discord(gid, !!opts.refresh)
    ]);
    state.config = cfg || {};
    // Bot returns { settings, modules, ... }
    state.settings = Object.assign({}, (cfg && cfg.settings) || {});
    state.modules = Object.assign({}, (cfg && cfg.modules) || {});
    // Der Bot nutzt teils andere Modulnamen als das Dashboard – hier angleichen, damit Schalter wirklich wirken
    Object.entries({ team:'teamverwaltung', warteraum:'warteraumSupport', adminCall:'adminCalls', duty:'dutyPanel', applications:'bewerbungen', automod:'autoMod', abmeldung:'abmelden' }).forEach(([dash, bot]) => {
      if (state.modules[bot] !== undefined) { state.modules[dash] = state.modules[bot]; delete state.modules[bot]; }
    });
    applyDiscord(disc);
    markClean();
    buildNav();
    openCategory(state.currentCat || 'home');
    try { ensureWebhookSetup(gid); } catch (_) {}
    if (!opts.quiet) toast('Aktualisiert', 'ok');
  } catch (e) {
    toast((e && e.message) ? 'Server-Daten konnten nicht geladen werden: ' + String(e.message).slice(0, 110) : 'Server-Daten konnten nicht geladen werden', 'err');
  } finally {
    document.body.classList.remove('is-loading');
  }
}

function renderServerList(){
  const list = $('serverList');
  if(!list) return;
  const guilds = state.guilds || [];
  if(!guilds.length){
    list.innerHTML = '<p class="list-empty">Keine Server gefunden. Ist der Bot auf deinem Server und hast du dort Verwaltungsrechte?</p>';
    return;
  }
  list.innerHTML = guilds.map((g, i)=>{
    const name = g.name || g.id;
    const letter = (name||'S').charAt(0).toUpperCase();
    const sel = String(state.guildId) === String(g.id) ? ' selected' : '';
    const members = g.memberCount != null ? formatMembers(g.memberCount) : 'Mitglieder werden geladen…';
    const iconHtml = g.icon
      ? `<img src="${escapeHtml(g.icon)}" alt="" style="width:100%;height:100%;border-radius:inherit;object-fit:cover">`
      : escapeHtml(letter);
    // Banner-Farbe aus dem Servernamen: gleicher Server, gleiche Farbe
    let hue = 0; for (const ch of String(g.id || name)) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return `<button type="button" class="server-row${sel}" style="--h:${hue};--i:${Math.min(i, 12)}" data-id="${escapeHtml(String(g.id))}" data-server="${escapeHtml(name)}"><span class="sr-banner" aria-hidden="true"></span><span class="server-icon">${iconHtml}</span><span class="grow"><b>${escapeHtml(name)}</b><small>${escapeHtml(members)}</small></span><span class="sr-foot">${sel ? '<span class="sr-pill">Ausgewählt</span>' : '<span></span>'}<span class="sr-go">Verwalten</span></span></button>`;
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

const CAT_MODULE = {
  tickets:'tickets', warteraum:'warteraum', admincall:'adminCall', offices:'offices', rp:'statusPanel',
  applications:'applications', team:'team', duty:'duty', abmeldung:'abmeldung',
  feedback:'feedback', tasks:'tasks', database:'database', factions:'factions',
  houses:'houses', icnames:'icNames', security:'security',
  welcome:'welcomeLeave', verify:'verify', interview:'interview', suggest:'suggest',
  giveaway:'giveaway', xp:'xp', partner:'partner', ausweis:'ausweis', fly:'flyNametag', sticky:'sticky',
  dizzy:'dizzy', ic:'icPanel', icmod:'icModeration',
  ranglaufbahn:'team', teamsperre:'teamsperre', testphase:'testphase', temprollen:'tempRoles', honeypot:'honeypot', rollenpanel:'rolePanel', embeds:'embedBuilder'
};
function moduleEnabledForCat(catId){
  // always show server/meta categories
  if (['home','allgemein','module','logs'].includes(catId)) return true;
  const mod = CAT_MODULE[catId];
  if (!mod) return true;
  const mods = state.modules || {};
  if (mods[mod] === false || mods[mod] === 0 || mods[mod] === 'off') return false;
  return true;
}
function navGo(catId){
  // Ranglaufbahn hat eigene, noch ungespeicherte Änderungen: erst warnen, beim zweiten Klick verwerfen
  if (state.currentCat === 'ranglaufbahn' && state.extraDirty.rank && catId !== 'ranglaufbahn' && state.navWarn !== catId) {
    state.navWarn = catId;
    toast('Die Ranglaufbahn ist nicht gespeichert. Noch einmal klicken, um sie zu verwerfen.', 'err');
    return;
  }
  state.coll = null;
  openCategory(catId);
  try { document.body.classList.remove('nav-open'); } catch (_) {}
}
function buildNav(){
  const nav = $('categories');
  if(!nav) return;
  const link = (c) => `<button type="button" class="nav-link${state.currentCat===c[0]?' active':''}" data-cat="${c[0]}">${navIcon(c[0])}<span class="nav-label">${escapeHtml(c[1])}</span></button>`;
  if (typeof GROUPS !== 'undefined' && GROUPS.length) {
    nav.innerHTML = GROUPS.map(([gname, ids])=>{
      const links = ids.map(id=>{
        const c = C.find(x=>x[0]===id);
        if(!c) return '';
        if (!moduleEnabledForCat(id)) return '';
        return link(c);
      }).join('');
      if (!links.replace(/\s/g,'')) return '';
      return `<div class="nav-group"><div class="nav-group-title">${ICON[GROUP_ICON[gname]] || ''}<span>${escapeHtml(gname)}</span></div>${links}</div>`;
    }).join('');
  } else {
    nav.innerHTML = C.filter(c=>moduleEnabledForCat(c[0])).map(link).join('');
  }
  nav.querySelectorAll('[data-cat]').forEach(x=>{
    x.onclick = ()=> navGo(x.dataset.cat);
  });
  paintSaveState();
}

function bindUi(){
  buildNav();
  const picker = $('serverPicker');
  const btn = $('serverButton');
  if(btn && picker) btn.onclick = ()=> { picker.classList.toggle('open'); if (picker.classList.contains('open')) { const si = $('serverSearch'); if (si) setTimeout(()=>si.focus(), 30); } };
  const pr = $('pickerRefresh');
  if (pr) { pr.innerHTML = ICON.refresh; pr.onclick = () => refreshServers(); }
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
  // Änderungen an Feldern mitverfolgen (eine Stelle für alle Seiten)
  const sp = $('settingsPanel');
  if (sp && !sp.__editBound) { sp.__editBound = true; sp.addEventListener('input', onPanelEdit); sp.addEventListener('change', onPanelEdit); }
}

function forceDiscordLogin(returnUrl){
  const ret = returnUrl || (location.origin + '/dashboard/');
  try {
    // brief UI so user sees why redirect happens
    const panel = $('settingsPanel');
    if(panel){
      panel.innerHTML = `<div class="login-banner glass" style="max-width:480px;margin:40px auto;flex-direction:column;text-align:center">
        <div><b>Discord Login</b><p>Weiterleitung zu Discord …</p></div>
      </div>`;
    }
  } catch(_){}
  if(API && typeof API.login === 'function'){
    API.login(ret);
  } else {
    const apiBase = (window.STAFFORA_API || '').replace(/\/$/, '');
    location.href = apiBase + '/auth/login?return=' + encodeURIComponent(ret);
  }
}

async function boot(){
  bindUi();
  if(!API){ toast('Error'); return; }
  API.readToken();

  // No token → always redirect to Discord OAuth (do not show dashboard)
  if(!API.getToken()){
    forceDiscordLogin(location.origin + location.pathname + location.search);
    return;
  }

  // Token present → validate with API; invalid/expired → clear + OAuth
  try {
    const me = await API.me();
    if(!me || (!me.id && !me.username && !me.user)){
      try { API.setToken(''); } catch(_){}
      forceDiscordLogin(location.origin + '/dashboard/');
      return;
    }
    state.user = me.user || me;
    const u = state.user || {};
    const name = u.username || u.global_name || me.username || me.global_name || 'User';
    const avatarHash = u.avatar || me.avatar;
    const uid = u.id || me.id;
    const su = document.querySelector('.side-user');
    if(su){
      const letter = (name||'U').charAt(0).toUpperCase();
      let avHtml = `<span class="avatar">${letter}</span>`;
      if(avatarHash && uid){
        const url = String(avatarHash).startsWith('http')
          ? avatarHash
          : `https://cdn.discordapp.com/avatars/${uid}/${avatarHash}.png?size=64`;
        avHtml = `<span class="avatar" style="background-image:url(${url});background-size:cover"></span>`;
      }
      su.innerHTML = `${avHtml}<span class="grow"><b>${escapeHtml(name)}</b><small>eingeloggt</small></span><button type="button" class="btn btn-sm btn-ghost" id="logoutBtn">Abmelden</button>`;
      const lo = $('logoutBtn');
      if(lo) lo.onclick = ()=>{ API.logout(); forceDiscordLogin(location.origin + '/dashboard/'); };
    }
  } catch(e){
    // invalid/expired session → Discord OAuth again
    try { API.logout(); } catch(_){}
    forceDiscordLogin(location.origin + '/dashboard/');
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
      openCategory(state.currentCat || 'home');
    } else {
      openCategory(state.currentCat || 'home');
      toast('Error');
    }
  } catch(e){
    const msg = String((e && e.message) || '');
    if(/401|403|auth|token|login|unauthorized/i.test(msg) || !API.getToken()){
      try { API.logout(); } catch(_){}
      forceDiscordLogin(location.origin + '/dashboard/');
      return;
    }
    toast('Error');
    openCategory(state.currentCat || 'home');
  }
}

document.addEventListener('DOMContentLoaded', boot);


/* ---------- Ranglaufbahn & Permissions ---------- */
// Reine Hilfsfunktionen (auch ohne Browser testbar)
function rcMove(arr, from, to){
  if (!Array.isArray(arr) || from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return Array.isArray(arr) ? arr.slice() : [];
  const a = arr.slice(); const x = a.splice(from, 1)[0]; a.splice(to, 0, x); return a;
}
// Mittelpunkte der übrigen Karten (ohne die gezogene) → Einfügeposition 0..n
function rcDropIndex(mids, y){ let i = 0; while (i < mids.length && y > mids[i]) i++; return i; }
// Reihenfolge der Gruppen-IDs nach dem Ablegen: `others` = IDs der übrigen Karten, `at` = Einfügeposition
function rcOrderAfterDrop(others, draggedId, at){ const a = others.slice(); a.splice(Math.max(0, Math.min(a.length, at)), 0, draggedId); return a; }
function rcNewGroup(n){ return { id: 'g_' + Math.random().toString(16).slice(2, 10), name: 'Neue Gruppe ' + n, roles: [], permissions: {}, requirements: { xp: 0, dutyHours: 0, feedbackAvg: 0, feedbackCount: 0 } }; }
// Schnelle Prüfung vor dem Senden (der Bot prüft zusätzlich selbst)
function rcValidate(cfg){
  const errors = []; const owner = new Map();
  (cfg.groups || []).forEach((g, i) => {
    if (!String(g.name || '').trim()) errors.push('Gruppe ' + (i + 1) + ': Der Name fehlt.');
    (g.roles || []).forEach(r => {
      if (owner.has(r.roleId)) errors.push('Eine Rolle ist in „' + owner.get(r.roleId) + '“ und „' + g.name + '“ – eine Rolle darf nur in einer Gruppe sein.');
      else owner.set(r.roleId, g.name);
    });
  });
  (cfg.baseRoleIds || []).forEach(id => { if (owner.has(id)) errors.push('Eine Basisrolle ist gleichzeitig in „' + owner.get(id) + '“.'); });
  (cfg.suspendRoleIds || []).forEach(id => { if (owner.has(id)) errors.push('Eine Suspendierungs-Rolle ist gleichzeitig in „' + owner.get(id) + '“.'); if ((cfg.baseRoleIds || []).includes(id)) errors.push('Eine Rolle kann nicht Basis- und Suspendierungs-Rolle sein.'); });
  return errors;
}

function rcInjectStyle(){
  return; /* Die Stile liegen jetzt in dashboard.css */
  if (document.getElementById('rc-style')) return;
  const st = document.createElement('style'); st.id = 'rc-style';
  st.textContent = `
  .rc-root{display:flex;flex-direction:column;gap:14px;margin-top:6px}
  .rc-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .rc-note{color:#9aa3b8;font-size:13px}.rc-bad{color:#f87171}
  .rc-badge{font-size:12px;padding:3px 9px;border-radius:99px;background:rgba(251,191,36,.15);color:#fbbf24}
  .rc-msgs{display:flex;flex-direction:column;gap:6px}
  .rc-msg{padding:8px 11px;border-radius:10px;font-size:13px;background:rgba(255,255,255,.05)}
  .rc-msg.error{background:rgba(248,113,113,.14);color:#fca5a5}.rc-msg.warn{background:rgba(251,191,36,.12);color:#fcd34d}.rc-msg.ok{background:rgba(74,222,128,.12);color:#86efac}
  .rc-list{display:flex;flex-direction:column;gap:10px;position:relative}
  .rc-group{border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(255,255,255,.035)}
  .rc-group header{display:flex;align-items:center;gap:8px;padding:10px 12px;flex-wrap:wrap}
  .rc-handle{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;background:rgba(255,255,255,.07);border:0;color:#cbd5e1;border-radius:8px;width:34px;height:34px;font-size:18px;line-height:1}
  .rc-handle:active{cursor:grabbing}
  .rc-rank{font-size:12px;color:#a78bfa;min-width:74px}
  .rc-name{flex:1;min-width:140px;background:#111;color:#eee;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px 10px;font-weight:600}
  .rc-ib{background:rgba(255,255,255,.07);border:0;color:#cbd5e1;border-radius:8px;min-width:34px;height:34px;cursor:pointer}
  .rc-ib:hover{background:rgba(255,255,255,.14)}.rc-ib.danger:hover{background:rgba(248,113,113,.3)}
  .rc-count{font-size:12px;color:#9aa3b8}
  .rc-body{padding:4px 14px 14px;display:flex;flex-direction:column;gap:12px}
  .rc-body h4{margin:6px 0 2px;font-size:13px;color:#cbd5e1}
  .rc-role{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .rc-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:99px;background:rgba(255,255,255,.07);font-size:13px}
  .rc-chip i{width:10px;height:10px;border-radius:50%;background:var(--c,#99aab5);display:inline-block}
  .rc-chip.gone{background:rgba(248,113,113,.15);color:#fca5a5}
  .rc-input{background:#111;color:#ddd;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 9px;min-width:120px}
  .rc-perms{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px}
  .rc-check{display:flex;gap:8px;align-items:center;font-size:13px;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.04);cursor:pointer}
  .rc-reqs{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}
  .rc-req{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#9aa3b8}.rc-req.off{opacity:.4}
  .rc-chips{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .rc-x{cursor:pointer;margin-left:2px;opacity:.7}.rc-x:hover{opacity:1}
  .rc-dragging{position:fixed;z-index:9999;pointer-events:none;opacity:.92;box-shadow:0 14px 40px rgba(0,0,0,.5);background:#1b1f33}
  .rc-placeholder{border:2px dashed rgba(167,139,250,.55);border-radius:14px;background:rgba(167,139,250,.07)}
  .rc-empty{padding:18px;text-align:center;color:#9aa3b8;border:1px dashed rgba(255,255,255,.14);border-radius:14px}
  `;
  document.head.appendChild(st);
}

async function wireRank(catId){
  if (catId !== 'ranglaufbahn') return;
  const panel = $('settingsPanel');
  if (!panel || !state.guildId || !API || !API.getToken()) return;
  rcInjectStyle();
  panel.querySelectorAll('.rc-root').forEach(n => n.remove());
  const host = document.createElement('div'); host.className = 'rc-root';
  host.innerHTML = '<div class="rc-note">Lade Ranglaufbahn…</div>';
  panel.appendChild(host);
  const base = '/api/guilds/' + state.guildId + '/rank-career';
  let data;
  try { data = await API.get(base); }
  catch (e) { host.innerHTML = '<div class="rc-note rc-bad">' + escapeHtml(e.message || 'Konnte nicht geladen werden') + '</div>'; return; }
  if (state.currentCat !== 'ranglaufbahn' || !host.isConnected) return;

  const roleMap = new Map((data.roles || []).map(r => [r.id, r]));
  const perms = data.permissions || [];
  const cfg = JSON.parse(JSON.stringify(data.config));
  cfg.groups.forEach(g => { g.permissions = g.permissions || {}; g.requirements = g.requirements || {}; g.roles = g.roles || []; });
  const open = new Set(cfg.groups.length <= 4 ? cfg.groups.map(g => g.id) : []);
  let dirty = !!data.legacy, saving = false, messages = [];
  if (data.legacy) messages = [{ level: 'warn', text: 'Es wird noch die alte Rangliste verwendet. Speichere einmal, um sie in Gruppen umzuwandeln.' }];
  state.extraSavers.rank = async () => { if (!dirty) return true; await save(); return !dirty; };
  setExtraDirty('rank', dirty);
  const q = (sel) => host.querySelector(sel);
  const say = (m) => toast(String(m || '').slice(0, 140));

  const used = () => { const s = new Set(); cfg.groups.forEach(g => g.roles.forEach(r => s.add(r.roleId))); (cfg.baseRoleIds || []).forEach(i => s.add(i)); (cfg.suspendRoleIds || []).forEach(i => s.add(i)); return s; };
  const chip = (id, extra) => {
    const r = roleMap.get(id);
    if (!r) return '<span class="rc-chip gone" title="Diese Rolle gibt es nicht mehr">gelöschte Rolle ' + escapeHtml(String(id).slice(-6)) + (extra || '') + '</span>';
    return '<span class="rc-chip" style="--c:' + escapeHtml(r.color && r.color !== '#000000' ? r.color : '#99aab5') + '"><i></i>' + escapeHtml(r.name) + (extra || '') + '</span>';
  };
  const addSelect = (act, extra, label) => {
    const u = used();
    const opts = (data.roles || []).filter(r => !r.managed && !u.has(r.id)).map(r => '<option value="' + r.id + '">@ ' + escapeHtml(r.name) + '</option>').join('');
    return '<select class="rc-input" data-act="' + act + '" ' + (extra || '') + '><option value="">' + (label || '＋ Rolle hinzufügen…') + '</option>' + opts + '</select>';
  };
  const num = (v, key, g, step, max) => '<input class="rc-input" type="number" min="0" max="' + max + '" step="' + step + '" value="' + (Number(v) || 0) + '" data-f="' + key + '" data-gid="' + escapeHtml(g.id) + '">';

  function groupHtml(g, i){
    const isOpen = open.has(g.id); const n = cfg.groups.length;
    const tag = n > 1 ? (i === 0 ? 'Höchster Rang' : i === n - 1 ? 'Niedrigster Rang' : 'Rang ' + (i + 1)) : 'Rang 1';
    let body = '';
    if (isOpen) {
      const rows = g.roles.length ? g.roles.map((r, ri) => '<div class="rc-role">' + chip(r.roleId) +
        '<input class="rc-input" data-f="label" data-gid="' + escapeHtml(g.id) + '" data-ri="' + ri + '" maxlength="32" placeholder="Eigener Name (optional)" value="' + escapeHtml(r.label || '') + '">' +
        '<button type="button" class="rc-ib danger" data-act="rmrole" data-gid="' + escapeHtml(g.id) + '" data-ri="' + ri + '" title="Rolle aus der Gruppe entfernen">✕</button></div>').join('')
        : '<div class="rc-note">Noch keine Rolle. Füge bestehende Discord-Rollen hinzu – es werden keine neuen Rollen erstellt.</div>';
      const permHtml = perms.map(p => '<label class="rc-check"><input type="checkbox" data-perm="' + p.key + '" data-gid="' + escapeHtml(g.id) + '"' + (g.permissions[p.key] ? ' checked' : '') + '>' + escapeHtml(p.label) + '</label>').join('');
      const rq = cfg.requirements || {};
      const req = (on, label, field) => '<div class="rc-req' + (on ? '' : ' off') + '"><span>' + label + (on ? '' : ' (oben deaktiviert)') + '</span>' + field + '</div>';
      body = '<div class="rc-body"><div><h4>Discord-Rollen dieser Gruppe</h4>' + rows + '<div style="margin-top:6px">' + addSelect('addrole', 'data-gid="' + escapeHtml(g.id) + '"') + '</div></div>' +
        '<div><h4>Permissions <button type="button" class="rc-ib" data-act="permall" data-gid="' + escapeHtml(g.id) + '" style="height:26px;font-size:12px;padding:0 8px">Alle</button> <button type="button" class="rc-ib" data-act="permnone" data-gid="' + escapeHtml(g.id) + '" style="height:26px;font-size:12px;padding:0 8px">Keine</button></h4><div class="rc-perms">' + permHtml + '</div></div>' +
        '<div><h4>Anforderungen für den Aufstieg in diese Gruppe</h4><div class="rc-reqs">' +
        req(rq.xp, 'XP', num(g.requirements.xp, 'req.xp', g, 1, 10000000)) +
        req(rq.duty, 'Dienstzeit (Stunden)', num(g.requirements.dutyHours, 'req.dutyHours', g, 0.5, 10000)) +
        req(rq.feedback, 'Feedback-Schnitt (1–5)', num(g.requirements.feedbackAvg, 'req.feedbackAvg', g, 0.1, 5)) +
        req(rq.feedback, 'Mindestens Feedbacks', num(g.requirements.feedbackCount, 'req.feedbackCount', g, 1, 10000)) +
        '</div><div class="rc-note" style="margin-top:4px">0 = keine Anforderung für diesen Wert.</div></div></div>';
    }
    return '<article class="rc-group" data-gid="' + escapeHtml(g.id) + '"><header>' +
      '<button type="button" class="rc-handle" data-handle title="Ziehen zum Sortieren" aria-label="Gruppe verschieben">⠿</button>' +
      '<span class="rc-rank">' + tag + '</span>' +
      '<input class="rc-name" data-f="name" data-gid="' + escapeHtml(g.id) + '" maxlength="40" value="' + escapeHtml(g.name) + '" placeholder="Gruppenname">' +
      '<span class="rc-count">' + g.roles.length + ' Rolle' + (g.roles.length === 1 ? '' : 'n') + '</span>' +
      '<button type="button" class="rc-ib" data-act="up" data-gid="' + escapeHtml(g.id) + '" title="Nach oben"' + (i === 0 ? ' disabled' : '') + '>▲</button>' +
      '<button type="button" class="rc-ib" data-act="down" data-gid="' + escapeHtml(g.id) + '" title="Nach unten"' + (i === n - 1 ? ' disabled' : '') + '>▼</button>' +
      '<button type="button" class="rc-ib" data-act="toggle" data-gid="' + escapeHtml(g.id) + '" title="Ein-/Ausklappen">' + (isOpen ? '▴' : '▾') + '</button>' +
      '<button type="button" class="rc-ib danger" data-act="del" data-gid="' + escapeHtml(g.id) + '" title="Gruppe löschen">🗑</button></header>' + body + '</article>';
  }

  function render(){
    const rq = cfg.requirements || (cfg.requirements = { xp: true, duty: false, feedback: false, windowDays: 30 });
    const chips = (ids, rm) => ids.map((id, i) => chip(id, ' <span class="rc-x" data-act="' + rm + '" data-i="' + i + '" title="Entfernen">✕</span>')).join('') || '<span class="rc-note">keine</span>';
    host.innerHTML =
      '<div class="rc-bar"><b>Ranglaufbahn</b> <span class="rc-note">Oben = höchster Rang · Gruppen am Griff ⠿ ziehen oder mit ▲▼ verschieben</span>' + (dirty ? ' <span class="rc-badge">Ungespeicherte Änderungen</span>' : '') + '</div>' +
      '<div class="rc-bar"><button type="button" class="btn btn-primary" data-act="save"' + (saving ? ' disabled' : '') + '>' + (saving ? 'Speichert…' : 'Ranglaufbahn speichern') + '</button>' +
      '<button type="button" class="btn" data-act="addgroup">＋ Gruppe</button><button type="button" class="btn" data-act="check">Systemcheck</button></div>' +
      '<div class="rc-msgs">' + messages.map(m => '<div class="rc-msg ' + m.level + '">' + ({ error: '❌ ', warn: '⚠️ ', info: 'ℹ️ ', ok: '✅ ' }[m.level] || '') + escapeHtml(m.text) + '</div>').join('') + '</div>' +
      '<div class="rc-list">' + (cfg.groups.length ? cfg.groups.map(groupHtml).join('') : '<div class="rc-empty">Noch keine Gruppen. Lege mit „＋ Gruppe“ die erste an und füge bestehende Discord-Rollen hinzu.</div>') + '</div>' +
      '<article class="settings-card glass"><div class="card-head"><div><h3>Allgemein</h3><p>Gilt für alle Gruppen und alle Team-Commands und Panels.</p></div></div><div class="card-body" style="display:flex;flex-direction:column;gap:12px">' +
      '<div><b>Basisrollen</b><div class="rc-note">Bei der Aufnahme vergeben, bei „Staff entfernen“ entzogen, bei Rangwechseln behalten.</div><div class="rc-chips">' + chips(cfg.baseRoleIds || [], 'rmbase') + addSelect('addbase', '') + '</div></div>' +
      '<div><b>Suspendierungs-Rollen</b><div class="rc-note">Wer suspendiert ist, verliert die Gruppen-Rollen und bekommt diese Rollen. Beim Entsuspendieren kommt alles zurück.</div><div class="rc-chips">' + chips(cfg.suspendRoleIds || [], 'rmsusp') + addSelect('addsusp', '') + '</div></div>' +
      '<div><b>Anforderungen für Rangaufstiege</b><div class="rc-note">Aktive Anforderungen müssen für einen Uprank erfüllt sein. Standard: nur XP.</div><div class="rc-chips">' +
      '<label class="rc-check"><input type="checkbox" data-g="req.xp"' + (rq.xp ? ' checked' : '') + '>XP</label>' +
      '<label class="rc-check"><input type="checkbox" data-g="req.duty"' + (rq.duty ? ' checked' : '') + '>Dienstzeit</label>' +
      '<label class="rc-check"><input type="checkbox" data-g="req.feedback"' + (rq.feedback ? ' checked' : '') + '>Feedback</label>' +
      '<span class="rc-req" style="flex-direction:row;align-items:center;gap:6px">Zeitraum (Tage) <input class="rc-input" style="min-width:80px;width:80px" type="number" min="1" max="365" data-g="req.windowDays" value="' + (rq.windowDays || 30) + '"></span></div></div>' +
      '<div><label class="rc-check" style="display:inline-flex"><input type="checkbox" data-g="adminBypassRequirements"' + (cfg.adminBypassRequirements ? ' checked' : '') + '>Server-Admins dürfen Anforderungen überspringen</label>' +
      ' <label class="rc-check" style="display:inline-flex"><input type="checkbox" data-g="legacyFallback"' + (cfg.legacyFallback !== false ? ' checked' : '') + '>Bisherige Rollen-Einstellungen (z. B. Ticket-Support-Rollen) bleiben zusätzlich erlaubt</label></div>' +
      '</div></article>';
  }

  const find = (gid) => cfg.groups.find(g => g.id === gid);
  const mark = () => { setExtraDirty('rank', true); if (!dirty) { dirty = true; const bar = q('.rc-bar'); if (bar && !bar.querySelector('.rc-badge')) bar.insertAdjacentHTML('beforeend', ' <span class="rc-badge">Ungespeicherte Änderungen</span>'); } };

  async function save(){
    const errs = rcValidate(cfg);
    if (errs.length) { messages = errs.map(t => ({ level: 'error', text: t })); render(); say(errs[0]); return; }
    saving = true; render();
    try {
      const r = await API.put(base, cfg);
      cfg.groups = r.config.groups; cfg.baseRoleIds = r.config.baseRoleIds; cfg.suspendRoleIds = r.config.suspendRoleIds; cfg.requirements = r.config.requirements;
      cfg.adminBypassRequirements = r.config.adminBypassRequirements; cfg.legacyFallback = r.config.legacyFallback;
      dirty = false; setExtraDirty('rank', false); messages = (r.warnings || []).map(t => ({ level: 'warn', text: t })); if (!messages.length) messages = [{ level: 'ok', text: 'Gespeichert.' }];
      say('Ranglaufbahn gespeichert');
    } catch (e) {
      const list = (e && e.data && e.data.errors) || null;
      messages = (list || [e.message || 'Speichern fehlgeschlagen']).map(t => ({ level: 'error', text: t }));
      say(e.message);
    }
    saving = false; render();
  }
  async function check(){
    if (dirty) { messages = [{ level: 'warn', text: 'Der Systemcheck prüft die gespeicherte Ranglaufbahn – bitte zuerst speichern.' }]; render(); return; }
    messages = [{ level: 'info', text: 'Prüfe…' }]; render();
    try { const r = await API.get(base + '/check'); messages = (r.items || []).map(i => ({ level: i.level, text: i.text })); }
    catch (e) { messages = [{ level: 'error', text: e.message }]; }
    render();
  }

  host.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-act]'); if (!t || t.tagName === 'SELECT') return;
    const act = t.dataset.act; const g = t.dataset.gid ? find(t.dataset.gid) : null;
    const i = cfg.groups.findIndex(x => g && x.id === g.id);
    if (act === 'save') return save();
    if (act === 'check') return check();
    if (act === 'addgroup') { if (cfg.groups.length >= (data.limits && data.limits.groups || 25)) { say('Maximal ' + (data.limits && data.limits.groups || 25) + ' Gruppen'); return; } const ng = rcNewGroup(cfg.groups.length + 1); cfg.groups.push(ng); open.add(ng.id); mark(); render(); return; }
    if (!g && !/base|susp/.test(act)) return;
    if (act === 'toggle') { open.has(g.id) ? open.delete(g.id) : open.add(g.id); render(); return; }
    if (act === 'up' || act === 'down') { cfg.groups = rcMove(cfg.groups, i, act === 'up' ? i - 1 : i + 1); mark(); render(); return; }
    if (act === 'del') { if (!window.confirm('Gruppe „' + g.name + '“ löschen? Die Discord-Rollen bleiben bestehen.')) return; cfg.groups.splice(i, 1); mark(); render(); return; }
    if (act === 'rmrole') { g.roles.splice(Number(t.dataset.ri), 1); mark(); render(); return; }
    if (act === 'permall' || act === 'permnone') { perms.forEach(p => { g.permissions[p.key] = act === 'permall'; }); mark(); render(); return; }
    if (act === 'rmbase') { cfg.baseRoleIds.splice(Number(t.dataset.i), 1); mark(); render(); return; }
    if (act === 'rmsusp') { cfg.suspendRoleIds.splice(Number(t.dataset.i), 1); mark(); render(); return; }
  });
  host.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.tagName === 'SELECT' && t.dataset.act && t.value) {
      const v = t.value;
      if (t.dataset.act === 'addrole') { const g = find(t.dataset.gid); if (g && !used().has(v)) g.roles.push({ roleId: v, label: '' }); }
      if (t.dataset.act === 'addbase') { cfg.baseRoleIds = (cfg.baseRoleIds || []).concat(used().has(v) ? [] : [v]); }
      if (t.dataset.act === 'addsusp') { cfg.suspendRoleIds = (cfg.suspendRoleIds || []).concat(used().has(v) ? [] : [v]); }
      mark(); render(); return;
    }
    if (t.dataset.perm) { const g = find(t.dataset.gid); if (g) { g.permissions[t.dataset.perm] = t.checked; mark(); } return; }
    if (t.dataset.g) {
      const k = t.dataset.g; const rq = cfg.requirements || (cfg.requirements = {});
      if (k.startsWith('req.')) rq[k.slice(4)] = t.type === 'checkbox' ? t.checked : Math.max(1, Math.min(365, parseInt(t.value, 10) || 30));
      else cfg[k] = t.checked;
      mark(); render();
    }
  });
  host.addEventListener('input', (ev) => {
    const t = ev.target; const f = t.dataset && t.dataset.f; if (!f) return;
    const g = find(t.dataset.gid); if (!g) return;
    if (f === 'name') g.name = t.value;
    else if (f === 'label') { const r = g.roles[Number(t.dataset.ri)]; if (r) r.label = t.value; }
    else if (f.startsWith('req.')) g.requirements[f.slice(4)] = Number(t.value) || 0;
    mark();
  });

  // ---- Drag & Drop (Maus und Touch über Pointer Events) ----
  host.addEventListener('pointerdown', (ev) => {
    const h = ev.target.closest && ev.target.closest('[data-handle]'); if (!h) return;
    if (ev.button !== undefined && ev.button > 0) return;
    const card = h.closest('.rc-group'); const list = card && card.parentElement; if (!list) return;
    ev.preventDefault();
    const rect = card.getBoundingClientRect(); const offY = ev.clientY - rect.top;
    const ph = document.createElement('div'); ph.className = 'rc-placeholder'; ph.style.height = (rect.height || card.offsetHeight || 60) + 'px';
    const draggedId = card.dataset.gid;
    card.after(ph);
    card.classList.add('rc-dragging'); card.style.width = (rect.width || 0) + 'px'; card.style.left = rect.left + 'px'; card.style.top = rect.top + 'px';
    try { h.setPointerCapture(ev.pointerId); } catch (_) {}
    let lastY = ev.clientY; let done = false;
    const others = () => [...list.querySelectorAll(':scope > .rc-group')].filter(c => c !== card);
    const place = (y) => {
      const o = others(); const mids = o.map(c => { const r = c.getBoundingClientRect(); return r.top + r.height / 2; });
      const at = rcDropIndex(mids, y);
      if (at >= o.length) list.appendChild(ph); else list.insertBefore(ph, o[at]);
    };
    const move = (e) => { lastY = e.clientY; card.style.top = (e.clientY - offY) + 'px'; place(e.clientY); };
    const scroller = setInterval(() => { if (lastY < 90) window.scrollBy(0, -14); else if (lastY > (window.innerHeight || 800) - 90) window.scrollBy(0, 14); }, 30);
    const finish = (commit) => {
      if (done) return; done = true; clearInterval(scroller);
      h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', cancel); document.removeEventListener('keydown', esc);
      let at = 0; const kids = [...list.children].filter(c => c === ph || (c.classList && c.classList.contains('rc-group') && c !== card));
      at = kids.indexOf(ph); const ids = kids.filter(c => c !== ph).map(c => c.dataset.gid);
      ph.remove(); card.classList.remove('rc-dragging'); card.style.cssText = '';
      if (commit) {
        const order = rcOrderAfterDrop(ids, draggedId, at);
        const before = cfg.groups.map(g => g.id).join();
        if (order.join() !== before) { cfg.groups = order.map(id => find(id)).filter(Boolean); mark(); }
      }
      render();
    };
    const up = () => finish(true); const cancel = () => finish(false); const esc = (e) => { if (e.key === 'Escape') finish(false); };
    h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', cancel); document.addEventListener('keydown', esc);
  });

  render();
}

/* ---------- Live-Verwaltung im Dashboard (Teamsperre, Testphase, Temp-Rollen, Giveaways) ---------- */
function wireLive(catId){
  const panel = $('settingsPanel');
  if (!panel) return;
  panel.querySelectorAll('.live-block').forEach(n => n.remove());
  if (!['teamsperre','testphase','temprollen','giveaway','houses','icnames'].includes(catId)) return;
  if (!state.guildId || !API || !API.getToken()) return;
  const gid = state.guildId, base = '/api/guilds/' + gid;
  const say = (m) => toast(String(m || '').slice(0, 140));
  const gridHost = panel.querySelector('.settings-grid') || panel;
  const mk = (title, hint, inner, withRefresh) => {
    const el = document.createElement('article');
    el.className = 'settings-card glass live-block';
    el.innerHTML = '<div class="card-head"><div><h3>' + title + ' <span class="chip-live">Sofort aktiv</span></h3><p>' + hint + '</p></div>' +
      (withRefresh ? '<button type="button" class="icon-btn live-refresh" title="Liste aktualisieren" aria-label="Liste aktualisieren">' + ICON.refresh + '</button>' : '') +
      '</div><div class="card-body">' + inner + '</div>';
    gridHost.appendChild(el);
    return el;
  };
  const left = (ts) => {
    const ms = ts - Date.now();
    if (ms <= 0) return 'abgelaufen';
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + (d ? '' : m + 'm');
  };
  const row = (label, control) => '<div class="setting-row"><span>' + label + '</span>' + control + '</div>';
  const input = (cls, ph, extra) => '<input class="' + cls + '" placeholder="' + ph + '" ' + (extra || '') + '>';
  const btn = (cls, label, data) => '<button type="button" class="btn ' + cls + '" ' + (data || '') + '>' + label + '</button>';
  const empty = (t) => '<span class="live-empty">' + t + '</span>';
  const listRow = (text, buttons) => '<div class="live-row"><span>' + text + '</span><span class="lr-actions">' + buttons + '</span></div>';
  const listBox = (title, hint) => mk(title, hint, '<div class="live-list">' + empty('Lade …') + '</div>', true).querySelector('.live-list');
  // Aktualisieren-Knopf der Liste mit der Lade-Funktion verbinden
  const bindRefresh = (list, load) => {
    const b = list.closest('.live-block').querySelector('.live-refresh');
    if (!b) return;
    b.onclick = async () => { b.classList.add('is-spinning'); try { await load(); } finally { b.classList.remove('is-spinning'); } };
  };
  const act = async (fn, okMsg, reload) => {
    try { await fn(); say(okMsg); if (reload) reload(); }
    catch (e) { say(e && e.message ? e.message : 'Fehlgeschlagen'); }
  };
  const picker = () => row('Mitglied', '<div class="mp-row">' + input('mp-q', 'Name oder ID') + btn('mp-go', 'Suchen') + '<select class="mp-sel"><option value="">— zuerst suchen —</option></select></div>');
  const wirePicker = (el) => {
    const q = el.querySelector('.mp-q'), sel = el.querySelector('.mp-sel');
    const go = async () => {
      const v = q.value.trim();
      if (v.length < 2) { say('Mindestens 2 Zeichen'); return; }
      try {
        const r = await API.get(base + '/members/search?q=' + encodeURIComponent(v));
        const it = (r && r.items) || [];
        sel.innerHTML = it.length ? it.map(m => '<option value="' + escapeHtml(m.id) + '">' + escapeHtml(m.name) + ' (@' + escapeHtml(m.tag) + ')</option>').join('') : '<option value="">Niemand gefunden</option>';
      } catch (e) { say(e.message); }
    };
    el.querySelector('.mp-go').onclick = go;
    q.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); go(); } });
    return () => sel.value || (/^\d{15,22}$/.test(q.value.trim()) ? q.value.trim() : '');
  };

  if (catId === 'houses') {
    const STATUS = [['frei','Frei'],['reserviert','Reserviert'],['gemietet','Gemietet'],['verkauft','Verkauft']];
    const stOpts = (cur) => STATUS.map(([v, l]) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + l + '</option>').join('');
    let editId = null;
    const f = mk('Haus anlegen oder bearbeiten', 'Freie Häuser bekommen im Panel einen Kauf-Button. Änderungen erscheinen sofort in der Hausliste.',
      row('Name', input('hs-name', 'z. B. Villa am Hang', 'maxlength="80"')) +
      row('Adresse', input('hs-addr', 'optional', 'maxlength="120"')) +
      row('Preis', input('hs-price', 'z. B. 250.000 $', 'maxlength="40"')) +
      row('Status', '<select class="hs-status">' + stOpts('frei') + '</select>') +
      row('Inhaber (Text)', input('hs-owner', 'Ingame-Name, optional', 'maxlength="80"')) +
      row('Inhaber (Discord-ID)', input('hs-did', 'optional', 'inputmode="numeric" maxlength="22"')) +
      row('Notiz', input('hs-notes', 'optional', 'maxlength="300"')) +
      '<div class="action-row">' + btn('btn-primary hs-go', 'Haus hinzufügen') + btn('hs-cancel', 'Abbrechen', 'hidden') + '</div>');
    const list = listBox('Häuser verwalten', '');
    const field = (c) => f.querySelector('.' + c);
    const resetForm = () => {
      editId = null;
      ['hs-name','hs-addr','hs-price','hs-owner','hs-did','hs-notes'].forEach(c => field(c).value = '');
      field('hs-status').value = 'frei';
      field('hs-go').textContent = 'Haus hinzufügen';
      field('hs-cancel').hidden = true;
    };
    let cache = [];
    const render = () => {
      list.innerHTML = cache.length ? cache.map(h => listRow(
        '<b>' + escapeHtml(h.name) + '</b>' + (h.address ? ' · ' + escapeHtml(h.address) : '') + (h.price ? ' · ' + escapeHtml(h.price) : '') +
          (h.ownerDiscordId || h.owner ? ' · Inhaber: ' + escapeHtml(h.owner || h.ownerDiscordId) : ''),
        '<select class="hs-st" data-id="' + escapeHtml(h.id) + '" aria-label="Status">' + stOpts(h.status) + '</select>' +
          btn('hs-edit', 'Bearbeiten', 'data-id="' + escapeHtml(h.id) + '"') + btn('hs-del', 'Löschen', 'data-id="' + escapeHtml(h.id) + '"')
      )).join('') : empty('Noch keine Häuser angelegt.');
      list.querySelectorAll('.hs-st').forEach(sel => sel.onchange = () => act(() => API.patch(base + '/hausliste/' + sel.dataset.id, { status: sel.value }), 'Status gespeichert', load));
      list.querySelectorAll('.hs-del').forEach(b => b.onclick = () => {
        if (!confirm('Dieses Haus wirklich löschen?')) return;
        act(() => API.del(base + '/hausliste/' + b.dataset.id), 'Haus gelöscht', load);
      });
      list.querySelectorAll('.hs-edit').forEach(b => b.onclick = () => {
        const h = cache.find(x => String(x.id) === String(b.dataset.id)); if (!h) return;
        editId = h.id;
        field('hs-name').value = h.name || ''; field('hs-addr').value = h.address || ''; field('hs-price').value = h.price || '';
        field('hs-status').value = h.status || 'frei'; field('hs-owner').value = h.owner || ''; field('hs-did').value = h.ownerDiscordId || ''; field('hs-notes').value = h.notes || '';
        field('hs-go').textContent = 'Änderungen speichern'; field('hs-cancel').hidden = false;
        f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    };
    const load = async () => {
      try { const r = await API.get(base + '/hausliste'); cache = (r && r.houses) || []; render(); }
      catch (e) { list.innerHTML = empty(escapeHtml(e.message)); }
    };
    field('hs-cancel').onclick = resetForm;
    field('hs-go').onclick = () => {
      const body = {
        name: field('hs-name').value.trim(), address: field('hs-addr').value.trim(), price: field('hs-price').value.trim(),
        status: field('hs-status').value, owner: field('hs-owner').value.trim(), notes: field('hs-notes').value.trim(),
        ownerDiscordId: field('hs-did').value.trim() || null
      };
      if (!body.name) { say('Bitte einen Namen eingeben'); return; }
      if (body.ownerDiscordId && !/^\d{15,22}$/.test(body.ownerDiscordId)) { say('Die Discord-ID ist ungültig'); return; }
      const wasEdit = !!editId;
      act(() => wasEdit ? API.patch(base + '/hausliste/' + editId, body) : API.post(base + '/hausliste', body), wasEdit ? 'Haus gespeichert' : 'Haus hinzugefügt', () => { resetForm(); load(); });
    };
    bindRefresh(list, load);
    load();
  }

  if (catId === 'icnames') {
    const f = mk('IC-Namen suchen und bearbeiten', 'Suche nach Name, Teil des Namens oder Discord-ID. Änderungen und Löschungen werden protokolliert.',
      '<div class="setting-row"><span>Suche</span><div class="mp-row">' + input('ic-q', 'Name, Teilname oder ID') + btn('ic-go', 'Suchen') + btn('ic-all', 'Alle zeigen') + '</div></div>' +
      '<div class="live-list ic-results">' + empty('Noch keine Suche.') + '</div>' +
      '<div class="action-row ic-pager" hidden>' + btn('ic-prev', 'Zurück') + '<span class="live-empty ic-pageinfo"></span>' + btn('ic-next', 'Weiter') + '</div>' +
      '<div class="setting-row"><span>Eintragen / ändern</span><div class="mp-row">' + input('ic-uid', 'Discord-ID', 'inputmode="numeric" maxlength="22"') + input('ic-newname', 'IC-Name', 'maxlength="32"') + btn('btn-primary ic-save', 'Speichern') + '</div></div>');
    const results = f.querySelector('.ic-results'), pager = f.querySelector('.ic-pager'), info = f.querySelector('.ic-pageinfo');
    let query = '', page = 0, pages = 1;
    const search = async (pg) => {
      page = Math.max(0, pg || 0);
      try {
        const r = await API.get(base + '/ic-names?q=' + encodeURIComponent(query) + '&page=' + page);
        pages = r.pages || 1; page = r.page || 0;
        const it = r.items || [];
        results.innerHTML = it.length ? it.map(x => listRow(
          '<b>' + escapeHtml(x.name) + '</b> · ' + (x.inGuild ? escapeHtml(x.displayName || x.tag || x.userId) : 'nicht mehr auf dem Server') + ' · ' + escapeHtml(x.userId) +
            (x.removeAt ? ' · wird in ' + left(x.removeAt) + ' gelöscht' : ''),
          btn('ic-edit', 'Ändern', 'data-id="' + escapeHtml(x.userId) + '" data-name="' + escapeHtml(x.name) + '"') + btn('ic-del', 'Entfernen', 'data-id="' + escapeHtml(x.userId) + '"')
        )).join('') : empty(r.total ? 'Keine Treffer auf dieser Seite.' : (query ? 'Kein IC-Name gefunden.' : 'Es sind noch keine IC-Namen eingetragen.'));
        pager.hidden = pages <= 1;
        info.textContent = 'Seite ' + (page + 1) + ' von ' + pages + ' · ' + r.total + ' Einträge';
        f.querySelector('.ic-prev').disabled = page <= 0; f.querySelector('.ic-next').disabled = page >= pages - 1;
        results.querySelectorAll('.ic-del').forEach(b => b.onclick = () => {
          if (!confirm('Diesen IC-Namen wirklich entfernen?')) return;
          act(() => API.del(base + '/ic-names/' + b.dataset.id), 'Entfernt', () => { search(page); loadJobs(); });
        });
        results.querySelectorAll('.ic-edit').forEach(b => b.onclick = () => { f.querySelector('.ic-uid').value = b.dataset.id; f.querySelector('.ic-newname').value = b.dataset.name; f.querySelector('.ic-newname').focus(); });
      } catch (e) { results.innerHTML = empty(escapeHtml(e.message)); }
    };
    const runSearch = () => { query = f.querySelector('.ic-q').value.trim(); search(0); };
    f.querySelector('.ic-go').onclick = runSearch;
    f.querySelector('.ic-q').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); runSearch(); } });
    f.querySelector('.ic-all').onclick = () => { f.querySelector('.ic-q').value = ''; query = ''; search(0); };
    f.querySelector('.ic-prev').onclick = () => search(page - 1);
    f.querySelector('.ic-next').onclick = () => search(page + 1);
    f.querySelector('.ic-save').onclick = () => {
      const uid = f.querySelector('.ic-uid').value.trim(), name = f.querySelector('.ic-newname').value.trim();
      if (!/^\d{15,22}$/.test(uid)) { say('Bitte eine gültige Discord-ID eintragen'); return; }
      if (!name) { say('Bitte einen IC-Namen eintragen'); return; }
      act(() => API.put(base + '/ic-names/' + uid, { name }), 'Gespeichert', () => { f.querySelector('.ic-uid').value = ''; f.querySelector('.ic-newname').value = ''; search(page); });
    };
    const jobs = listBox('Geplante Löschungen nach Teamkick', 'Diese Personen wurden aus dem Team gekickt. Ihr IC-Name wird zur angezeigten Zeit gelöscht – außer sie werden vorher wieder aufgenommen.');
    const loadJobs = async () => {
      try {
        const r = await API.get(base + '/ic-names/removals');
        const it = (r && r.items) || [];
        jobs.innerHTML = it.length ? it.map(x => listRow(
          '<b>' + escapeHtml(x.name) + '</b> · ' + escapeHtml(x.displayName || x.userId) + ' · wird in ' + left(x.dueAt) + ' gelöscht',
          btn('ic-cancel', 'Löschung abbrechen', 'data-id="' + escapeHtml(x.userId) + '"')
        )).join('') : empty('Keine geplanten Löschungen.');
        jobs.querySelectorAll('.ic-cancel').forEach(b => b.onclick = () => act(() => API.post(base + '/ic-names/removals/' + b.dataset.id + '/cancel', {}), 'Löschung abgebrochen', () => { loadJobs(); search(page); }));
      } catch (e) { jobs.innerHTML = empty(escapeHtml(e.message)); }
    };
    bindRefresh(jobs, loadJobs);
    loadJobs();
  }

  if (catId === 'teamsperre') {
    const f = mk('Teamsperre setzen', 'Das Mitglied kann sich nicht mehr bewerben.',
      picker() + row('Dauer', input('ts-dur', 'leer = dauerhaft, z. B. 7d, 2w')) + row('Grund', input('ts-reason', 'optional')) +
      '<div class="action-row">' + btn('btn-primary ts-go', 'Sperren') + '</div>');
    const getUser = wirePicker(f);
    const list = listBox('Aktuell gesperrt', '');
    const load = async () => {
      try {
        const r = await API.get(base + '/teamsperre');
        if (r && r.configured === false) { list.innerHTML = empty('Zuerst oben eine Teamsperre-Rolle wählen und speichern.'); return; }
        const it = (r && r.items) || [];
        list.innerHTML = it.length
          ? it.map(m => listRow(escapeHtml(m.name) + ' · ' + (m.expiresAt ? 'endet in ' + left(m.expiresAt) : 'dauerhaft'), btn('ts-un', 'Aufheben', 'data-id="' + escapeHtml(m.id) + '"'))).join('')
          : empty('Niemand gesperrt.');
        list.querySelectorAll('.ts-un').forEach(b => b.onclick = () => act(() => API.del(base + '/teamsperre/' + b.dataset.id), 'Sperre aufgehoben', load));
      } catch (e) { list.innerHTML = empty(escapeHtml(e.message)); }
    };
    f.querySelector('.ts-go').onclick = () => {
      const uid = getUser(); if (!uid) { say('Mitglied wählen'); return; }
      act(() => API.post(base + '/teamsperre', { userId: uid, duration: f.querySelector('.ts-dur').value.trim(), reason: f.querySelector('.ts-reason').value.trim() }), 'Gesperrt', load);
    };
    bindRefresh(list, load);
    load();
  }

  if (catId === 'testphase') {
    const f = mk('Testphase starten', 'Das Mitglied erhält die Testphase-Rolle, du bekommst Erinnerungen vor dem Ende.',
      picker() + row('Dauer in Tagen', input('tp-days', 'Standard aus den Einstellungen', 'type="number" min="1" max="120"')) +
      '<div class="action-row">' + btn('btn-primary tp-go', 'Starten') + '</div>');
    const getUser = wirePicker(f);
    const list = listBox('Aktive Testphasen', '');
    const load = async () => {
      try {
        const r = await API.get(base + '/testphases');
        const it = (r && r.items) || [];
        list.innerHTML = it.length ? it.map(x => listRow(
          escapeHtml(x.name) + ' · endet in ' + left(x.endsAt) + (x.extensions ? ' · ' + x.extensions + '× verlängert' : ''),
          btn('tp-r', 'Bestanden', 'data-id="' + x.id + '" data-r="passed"') + btn('tp-r', '+7 Tage', 'data-id="' + x.id + '" data-r="extended"') + btn('tp-r', 'Nicht bestanden', 'data-id="' + x.id + '" data-r="failed"')
        )).join('') : empty('Keine aktiven Testphasen.');
        list.querySelectorAll('.tp-r').forEach(b => b.onclick = () => act(() => API.post(base + '/testphases/' + b.dataset.id + '/resolve', { result: b.dataset.r }), 'Gespeichert', load));
      } catch (e) { list.innerHTML = empty(escapeHtml(e.message)); }
    };
    f.querySelector('.tp-go').onclick = () => {
      const uid = getUser(); if (!uid) { say('Mitglied wählen'); return; }
      const days = f.querySelector('.tp-days').value.trim();
      act(() => API.post(base + '/testphases', { userId: uid, days: days ? Number(days) : undefined }), 'Testphase gestartet', load);
    };
    bindRefresh(list, load);
    load();
  }

  if (catId === 'temprollen') {
    const f = mk('Temp-Rolle vergeben', 'Die Rolle wird nach Ablauf automatisch entfernt.',
      picker() + row('Rolle', '<select class="tr-role">' + roleOptions('') + '</select>') +
      row('Dauer', input('tr-dur', 'z. B. 30m, 12h, 7d, 2w')) + row('Grund', input('tr-reason', 'optional')) +
      '<div class="action-row">' + btn('btn-primary tr-go', 'Vergeben') + '</div>');
    const getUser = wirePicker(f);
    const list = listBox('Aktive Temp-Rollen', '');
    const load = async () => {
      try {
        const r = await API.get(base + '/temp-roles');
        const it = (r && r.items) || [];
        list.innerHTML = it.length
          ? it.map(x => listRow(escapeHtml(x.name) + ' · @ ' + escapeHtml(x.roleName) + ' · endet in ' + left(x.expiresAt), btn('tr-rm', 'Entfernen', 'data-id="' + x.id + '"'))).join('')
          : empty('Keine aktiven Temp-Rollen.');
        list.querySelectorAll('.tr-rm').forEach(b => b.onclick = () => act(() => API.del(base + '/temp-roles/' + b.dataset.id), 'Entfernt', load));
      } catch (e) { list.innerHTML = empty(escapeHtml(e.message)); }
    };
    f.querySelector('.tr-go').onclick = () => {
      const uid = getUser(), roleId = f.querySelector('.tr-role').value, dur = f.querySelector('.tr-dur').value.trim();
      if (!uid) { say('Mitglied wählen'); return; }
      if (!roleId) { say('Rolle wählen'); return; }
      if (!dur) { say('Dauer angeben'); return; }
      act(() => API.post(base + '/temp-roles', { userId: uid, roleId, duration: dur, reason: f.querySelector('.tr-reason').value.trim() }), 'Vergeben', load);
    };
    bindRefresh(list, load);
    load();
  }

  if (catId === 'giveaway') {
    const f = mk('Giveaway starten', '',
      row('Preis', input('gw-prize', 'z. B. Nitro')) + row('Gewinner', input('gw-win', '1', 'type="number" min="1" max="20" value="1"')) +
      row('Dauer', input('gw-dur', 'z. B. 1h, 1d', 'value="1h"')) +
      row('Kanal', '<select class="gw-ch">' + channelOptions(getSetting('giveawayChannelId', ''), 'text') + '</select>') +
      '<div class="action-row">' + btn('btn-primary gw-go', 'Starten') + '</div>');
    const list = listBox('Giveaways', '');
    const load = async () => {
      try {
        const r = await API.get(base + '/giveaways');
        const it = (r && r.giveaways) || [];
        list.innerHTML = it.length ? it.slice(0, 15).map(g => g.status === 'active'
          ? listRow(escapeHtml(g.prize) + ' · endet in ' + left(g.ends_at) + ' · ' + (g.entries || []).length + ' Teilnehmer', btn('gw-end', 'Beenden', 'data-id="' + escapeHtml(g.id) + '"'))
          : listRow(escapeHtml(g.prize) + ' · beendet · ' + (g.winner_ids || []).length + ' Gewinner', btn('gw-re', 'Neu auslosen', 'data-id="' + escapeHtml(g.id) + '"'))
        ).join('') : empty('Noch keine Giveaways.');
        list.querySelectorAll('.gw-end').forEach(b => b.onclick = () => act(() => API.post(base + '/giveaways/' + b.dataset.id + '/end'), 'Beendet', load));
        list.querySelectorAll('.gw-re').forEach(b => b.onclick = () => act(() => API.post(base + '/giveaways/' + b.dataset.id + '/reroll'), 'Neu ausgelost', load));
      } catch (e) { list.innerHTML = empty(escapeHtml(e.message)); }
    };
    f.querySelector('.gw-go').onclick = () => {
      const prize = f.querySelector('.gw-prize').value.trim(), channelId = f.querySelector('.gw-ch').value;
      if (!prize) { say('Preis angeben'); return; }
      if (!channelId) { say('Kanal wählen'); return; }
      act(() => API.post(base + '/giveaways/start', { prize, winners: f.querySelector('.gw-win').value, duration: f.querySelector('.gw-dur').value.trim(), channelId }), 'Giveaway gestartet', load);
    };
    bindRefresh(list, load);
    load();
  }
}

/* ---------- Verbindungsstatus Website ↔ Bot ---------- */
async function refreshStatus(){
  const pill = $('statusPill');
  if (pill && pill.dataset.state === 'idle') { const t = $('statusText'); if (t) t.textContent = 'Prüfe …'; }
  let health = null, sys = null, err = '';
  try { health = await API.ping(); } catch(e){ err = (e && e.message) || 'nicht erreichbar'; }
  if (health && state.guildId && API.getToken && API.getToken()) {
    try { sys = await API.systemStatus(state.guildId); } catch(e){ /* Rechte/Server fehlen – nur Basisstatus zeigen */ }
    if (!sys || !Array.isArray(sys.system) || !sys.ai) sys = null;
  }
  state._health = health; state._sys = sys; state._statusErr = err;
  paintStatus();
  if (state.currentCat === 'home') { try { paintHome(); } catch (_) {} }
}
function statusIssues(){
  const sys = state._sys;
  return sys ? sys.system.filter(x=>!x.ok).concat(sys.ai && !sys.ai.ok ? [{ ok: false, text: 'KI: ' + sys.ai.text }] : []) : [];
}
function paintStatus(){
  const pill = $('statusPill'), txt = $('statusText'), pop = $('statusPop');
  if (!pill || !txt) return;
  const health = state._health, sys = state._sys, issues = statusIssues();
  let mode, label;
  if (!health) { mode = 'bad'; label = 'Bot nicht erreichbar'; }
  else if (health.bot === false) { mode = 'bad'; label = 'Bot offline'; }
  else if (issues.length) { mode = 'warn'; label = issues.length === 1 ? '1 Hinweis' : issues.length + ' Hinweise'; }
  else { mode = 'ok'; label = 'Bot online'; }
  pill.dataset.state = mode; txt.textContent = label;
  if (!pop) return;
  let html = '<h3>' + (mode === 'ok' ? 'Alles in Ordnung' : mode === 'warn' ? 'Das solltest du prüfen' : 'Verbindung gestört') + '</h3><ul class="status-list">';
  if (!health) html += '<li class="bad">' + escapeHtml(state._statusErr || 'Der Bot antwortet nicht.') + '</li>';
  else {
    html += '<li>' + (health.bot === false ? 'API erreichbar, Bot offline' : 'Bot online, ' + (health.guilds || 0) + ' Server') + '</li>';
    if (sys) {
      html += sys.system.map(x => '<li class="' + (x.ok ? '' : 'bad') + '">' + escapeHtml(x.text) + '</li>').join('');
      html += '<li class="' + (sys.ai.ok ? '' : 'bad') + '">KI: ' + escapeHtml(sys.ai.text) + '</li>';
    } else if (!state.guildId) html += '<li class="warn">Wähle einen Server, um die Systemprüfung zu sehen.</li>';
  }
  html += '</ul><button type="button" class="btn btn-sm" id="statusRecheck">' + ICON.refresh + '<span> Erneut prüfen</span></button>';
  pop.innerHTML = html;
  const rb = $('statusRecheck');
  if (rb) rb.onclick = async () => { rb.classList.add('is-spinning'); try { await refreshStatus(); } finally { const x = $('statusRecheck'); if (x) x.classList.remove('is-spinning'); } };
}

/* ---------- Übersicht (Startseite) ---------- */
function wireHome(catId){
  if (catId !== 'home') return;
  const panel = $('settingsPanel'); if (!panel) return;
  const grid = panel.querySelector('.settings-grid'); if (!grid) return;
  grid.innerHTML = '<div class="home-status" id="homeStatus" data-state="ok"></div>' +
    '<div class="home-grid" id="homeTiles"></div>' +
    '<article class="settings-card glass home-wide" id="homeModules"></article>' +
    '<article class="settings-card glass" id="homeNotes"></article>' +
    '<article class="settings-card glass" id="homeQuick"></article>';
  paintHome();
}
function paintHome(){
  const tiles = $('homeTiles'); if (!tiles) return;
  const h = state._health, issues = statusIssues();
  const g = (state.guilds || []).find(x => String(x.id) === String(state.guildId));
  const mods = Object.entries(CAT_MODULE).filter(([id]) => C.some(c => c[0] === id));
  const seen = new Set(), list = [];
  mods.forEach(([id, key]) => { if (seen.has(key)) return; seen.add(key); list.push([id, key]); });
  const on = list.filter(([, key]) => (state.modules || {})[key] !== false).length;
  const groups = (((state.settings || {}).rankConfig || {}).groups || []).length;
  const hsEl = $('homeStatus');
  if (hsEl) {
    const down = !h || h.bot === false;
    const mode = down ? 'bad' : issues.length ? 'warn' : 'ok';
    const ico = {
      ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
      warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 17h.01"/></svg>',
      bad: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>'
    }[mode];
    const title = mode === 'ok' ? (state._sys ? 'Alles erledigt' : 'Bot online') : mode === 'warn' ? (issues.length === 1 ? '1 Hinweis offen' : issues.length + ' Hinweise offen') : (!h ? 'Bot nicht erreichbar' : 'Bot offline');
    const sub = mode === 'ok' ? (state._sys ? 'Der Bot ist online und die Systemprüfung meldet nichts.' : 'Wähle einen Server, um die Systemprüfung zu sehen.')
      : mode === 'warn' ? statusIssues().map(x => x.text).slice(0, 1).join('') + (issues.length > 1 ? ' (und ' + (issues.length - 1) + ' weitere)' : '')
      : (state._statusErr || 'Die API antwortet, aber der Bot ist nicht verbunden.');
    if (hsEl.dataset.state !== mode || !hsEl.firstChild) {
      hsEl.dataset.state = mode;
      hsEl.innerHTML = '<span class="hs-ico">' + ico + '</span><div class="hs-text"><b></b><p></p></div><button type="button" class="btn" id="homeRecheck">' + ICON.refresh + '<span> Erneut prüfen</span></button>';
      const rc = $('homeRecheck');
      if (rc) rc.onclick = async () => { rc.classList.add('is-spinning'); try { await refreshStatus(); } finally { const x = $('homeRecheck'); if (x) x.classList.remove('is-spinning'); } };
    }
    hsEl.querySelector('b').textContent = title;
    hsEl.querySelector('p').textContent = sub;
  }
  const tile = (label, value, sub, st) => '<div class="home-tile glass" data-state="' + (st || '') + '"><div class="ht-label">' + escapeHtml(label) + '</div><div class="ht-value">' + escapeHtml(String(value)) + '</div><div class="ht-sub">' + escapeHtml(sub) + '</div></div>';
  tiles.innerHTML =
    tile('Bot', !h ? 'Offline' : h.bot === false ? 'Offline' : 'Online', h ? (h.guilds || 0) + ' Server verbunden' : 'Keine Antwort', !h || h.bot === false ? 'bad' : 'ok') +
    tile('Server', g ? (g.name || 'Server') : '—', g && g.memberCount != null ? formatMembers(g.memberCount) : (state.guildId ? 'Geladen' : 'Noch nicht gewählt'), '') +
    tile('Module aktiv', on + ' von ' + list.length, 'Unter „Module“ ein- und ausschalten', '') +
    tile('Hinweise', issues.length, issues.length ? 'Siehe unten' : 'Nichts zu tun', issues.length ? 'warn' : 'ok');

  const modEl = $('homeModules');
  if (modEl) {
    modEl.innerHTML = '<div class="card-head"><div><h3>Module</h3><p>Ein Klick öffnet die Einstellungen des Moduls.</p></div></div><div class="card-body"><div class="mod-grid">' +
      list.map(([id, key]) => { const c = C.find(x => x[0] === id); const isOn = (state.modules || {})[key] !== false; return '<button type="button" class="mod-chip' + (isOn ? '' : ' off') + '" data-go="' + id + '" title="' + (isOn ? 'Aktiv' : 'Ausgeschaltet') + '"><span>' + escapeHtml(c[1]) + '</span></button>'; }).join('') + '</div></div>';
  }
  const notes = $('homeNotes');
  if (notes) {
    notes.innerHTML = '<div class="card-head"><div><h3>Hinweise</h3><p>Ergebnis der Systemprüfung von Bot und Server.</p></div></div><div class="card-body">' +
      (issues.length ? '<ul class="status-list">' + issues.map(x => '<li class="bad">' + escapeHtml(x.text) + '</li>').join('') + '</ul>' : '<span class="live-empty">' + (h ? 'Keine Hinweise. Alles läuft.' : 'Der Bot ist gerade nicht erreichbar.') + '</span>') + '</div>';
  }
  const quick = $('homeQuick');
  if (quick) {
    quick.innerHTML = '<div class="card-head"><div><h3>Schnellzugriff</h3><p>Häufige Aufgaben auf einen Blick.</p></div></div><div class="card-body"><div class="quick-actions">' +
      '<button type="button" class="btn btn-primary" data-go="ranglaufbahn">Ranglaufbahn' + (groups ? ' (' + groups + ' Gruppen)' : ' einrichten') + '</button>' +
      '<button type="button" class="btn" data-go="tickets">Tickets</button>' +
      '<button type="button" class="btn" data-go="warteraum">Warteraum</button>' +
      '<button type="button" class="btn" data-go="houses">Häuser</button>' +
      '<button type="button" class="btn" id="homeDiscord">' + ICON.refresh + '<span> Kanäle und Rollen laden</span></button>' +
      '</div></div>';
    const d = $('homeDiscord'); if (d) d.onclick = () => refreshDiscordData();
  }
  $('settingsPanel').querySelectorAll('[data-go]').forEach(b => { b.onclick = () => navGo(b.dataset.go); });
}

setInterval(function(){ try{ refreshStatus(); }catch(e){} }, 60000);
window.addEventListener('load', function(){ setTimeout(function(){ try{ refreshStatus(); }catch(e){} }, 1200); });
