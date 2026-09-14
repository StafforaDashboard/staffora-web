const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const DB_PATH = path.join(dataDir, 'staffora.json');

const DEFAULT_MODULES = {
  // Default: every module ON; can be disabled per guild in dashboard tabs
  dienstnummern: true,
  teamverwaltung: true,
  bewerbungen: true,
  robloxStaff: true,
  statusPanel: true,
  logs: true,
  adminCalls: true,
  warteraumSupport: true,
  tickets: true,
  ausweis: true,
  keywords: true,
  offices: true,
  panels: true,
  dutyPanel: true,
  ingameManagement: true,
  abmelden: true,
  schicht: true,
  warteraumMusic: true,
  autoNick: true,
  partner: true,
  giveaway: true,
  suggest: true,
  factions: true,
  feedback: true,
  xp: true,
  dizzy: true,
  flyNametag: true,
  moderation: true,
  security: false
};

const DEFAULT_SETTINGS = {
  systemName: 'Frankfurt Polizei',
  numberPrefix: 'SW-',
  numberDigits: 2,
  numberLabel: 'Dienstnummer',
  displayFormat: '{number} | {name}',
  identification: 'dienstnummer',
  appChannelId: null,
  logChannelId: null,
  staffRoleIds: [],
  teamlistChannelId: null,
    teamlistMessageId: null,
    adminRoleIds: [],
  statusChannelId: null,
  statusIntervalSec: 60,
  statusPingRoleIds: [],
  robloxGroupId: null,
  robloxMinRank: 255,
  robloxRankName: 'Administrator',
  ausweisChannelId: null,
  ausweisStaffRoleIds: [],
  // Tickets
  ticketCategoryId: null,
  ticketLogChannelId: null,
  ticketSupportRoleIds: [],
  ticketPanelChannelId: null,
  // Admin Calls / Warteraum
  adminCallWaitingChannelId: null,
  adminCallPingRoleIds: [],
  adminCallLogChannelId: null,
  // Bewerbungen extra
  appLogChannelId: null,
  appMinPoints: 10,
  appRejectBanDays: 7,
  appRejectRoleId: null,
  // Offices / Büros
  officeWaitingChannelId: null,
  officePingRoleId: null,
  officeLogChannelId: null,
  // Keywords
  keywordChannelIds: [],
  // Panels default channels
  bewerbungPanelChannelId: null,
  ausweisPanelChannelId: null,
  ticketPanelTitle: 'Support Tickets',
  ticketPanelText: 'Wähle unten die Ticket-Art, um ein Ticket zu öffnen.',
  ausweisServerName: null,
  ausweisMaxExtra: 3,
  modReasons: null,
  complaintCategoryId: null,
  complaintSupportRoleIds: [],
  complaintEnabled: true,
  ausweisPanelTitle: 'Ausweis beantragen',
  ausweisPanelText: 'Wähle den Ausweis-Typ und fülle die Anfrage aus.',
  bewerbungPanelTitle: 'Bewerbung',
  bewerbungPanelText: 'Bewerbe dich mit /bewerben oder über den Button.',
  // Duty / Clock-in panel (separate from Roblox & Dienstnummern)
  dutyPanelChannelId: null,
  dutyPanelTitle: 'Dienst',
  dutyRoleIds: [],
  // Security (anti-nuke) — module default OFF
  security: null,
  // Ingame Management / Roblox (Notruf Hamburg private server)
  ingameAutoNameLog: false,
  ingameDizzyControl: false,
  ingameDizzyChannelId: null,
  ingameWebhookChannelId: null,
  ingameWebhookSecret: null, // secret for POST /api/public/ingame/webhook/:guildId
  notrufHamburgWebhookUrl: null, // optional Discord webhook from NH server to mirror logs
  dizzyControllerRoleIds: [], // roles that can use Dizzy controller
  dizzyLogChannelId: null,

  ingameAccessRoleIds: [],
  ingameAdminRoleIds: [], // Discord roles = ingame admin rights (duty online panel)

  ingameLinkConfirmRoleIds: [],
  ingameBanLogChannelId: null,
  // Warn system (Roblox user)
  ingameWarnSteps: '—|kick|banned',
  ingameWarnLogChannelId: null,
  // Unban request (website)
  unbanRequestEnabled: true,
  unbanRequireActiveBan: true,
  unbanRequestChannelId: null,
  unbanQuestions: [
    { key: 'why', label: 'Warum sollte dein Ban aufgehoben werden?', required: true },
    { key: 'what', label: 'Was hast du falsch gemacht?', required: true },
    { key: 'change', label: 'Was wirst du in Zukunft anders machen?', required: true }
  ],
  // Abmelden
  abmeldenRoleIds: [], // roles removed while abgemeldet
  abmeldenGiveRoleIds: [], // roles given while abgemeldet (e.g. Abgemeldet-Rolle)
  abmeldenNickPrefix: 'Abgemeldet',
  // Schicht
  schichtRoleIds: [], // who may clock in
  // Warteraum music
  warteraumMusicEnabled: true,
  warteraumMusicUrl: null, // optional custom audio URL
  rankCareer: [],
  teamWarnKickAt: 3,
  teamLogChannelId: null, // [{key,name,roleId,order}]
  autoNickEnabled: false,
  autoNickFormat: '[{rank}] {name}',
  partnerEnabled: true,
  partnerApplicationChannelId: null,
  partnerManagerRoleIds: [],
  factionLeaderRoleIds: [],
  factions: [],
  xpEnabled: true,
  xpAutoUprank: true,
  xpPeriodDays: 7,
  xpPerMessage: 1,
  xpMessageCooldownSec: 60,
  xpPerDutyHour: 10,
  xpPerVcMinute: 2,
  xpTicketClaim: 15,
  xpTicketClose: 8,
  xpAdminCallClaim: 20,
  xpFeedback: 0,
  xpFeedbackStar1: -15,
  xpFeedbackStar2: -5,
  xpFeedbackStar3: 8,
  xpFeedbackStar4: 15,
  xpFeedbackStar5: 25,
  feedbackLogChannelId: null,
  feedbackPanelTitle: 'Feedback geben',
  feedbackPanelText: 'Hast du Lob, Kritik oder Verbesserungsvorschläge für unser Team?\nKlicke unten auf den Button, um dein Feedback einzureichen.',
  xpAnnounceChannelId: null,
  partnerTiers: [],
  ticketTypes: [],
  ticketPanels: [],
  rankCareerMode: 'discord', // discord | manual
  rankCareerManual: [],
  partnerChannelType: 'text', // [{key,name,minMembers,maxMembers,channelId}]
  stafforaPremium: false,
  disabledCommands: [],
  commandPermissions: {},
  statusChannelId: null,
  rpStartEmbed: { title: 'RP gestartet', description: 'Das Roleplay ist **gestartet**.', footer: 'STAFFORA BOT · RP', color: '#8b5cf6', fields: [] },
  hausliste: [],
  hauslistePanelTitle: 'Hausliste',
  hauslistePanelText: 'Übersicht aller Häuser / Grundstücke.',
  hauslistePanelChannelId: null,
  rpStopEmbed: { title: 'RP beendet', description: 'Das Roleplay ist **beendet**.', footer: 'STAFFORA BOT · RP', color: '#8b5cf6', fields: [] }
};

function emptyDb() {
  return {
    guilds: {},
    sessions: {},
    oauth_pending: {},
    dienstnummern: [],
    applications: [],
    number_change_requests: [],
    warnings: [],
    suspensions: [],
    duty_status: {},
    roblox_staff: [],
    action_logs: [],
    status_panel: {},
    ausweis_types: {},
    ausweis_cards: [],
    ausweis_requests: [],
    duty_panel: {},
    keywords: [],
    offices: [],
    // Ingame Management
    roblox_links: [],       // Discord ↔ Roblox player/staff links
    roblox_bans: [],        // active + archived bans
    roblox_unbans: [],      // documented unbans
    roblox_webhook_logs: [],// parsed webhook kick/ban events
    roblox_link_requests: [],// pending link confirmations
    roblox_warnings: [],    // warns on Roblox users
    unban_requests: [],     // website unban applications
    dn_groups: [],          // Dienstnummer groups
    abmelden_sessions: [],  // temporary leave sessions
    schicht_sessions: [],   // clock-in shifts
    ticket_messages: [],    // simple transcript buffer
    _seq: 1
  };
}

function load() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    console.warn('[db] load failed', e.message);
  }
  return emptyDb();
}

let state = load();

function save() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state));
  } catch (e) {
    console.error('[db] save failed', e.message);
  }
}

function nextId() {
  state._seq = (state._seq || 1) + 1;
  return state._seq;
}

function getGuild(guildId) {
  if (!state.guilds[guildId]) {
    state.guilds[guildId] = {
      modules: { ...DEFAULT_MODULES },
      settings: { ...DEFAULT_SETTINGS },
      updated_at: Date.now()
    };
    save();
  }
  const g = state.guilds[guildId];
  return {
    guildId,
    modules: { ...DEFAULT_MODULES, ...(g.modules || {}) },
    settings: { ...DEFAULT_SETTINGS, ...(g.settings || {}) }
  };
}

function saveGuild(guildId, { modules, settings }) {
  const cur = getGuild(guildId);
  state.guilds[guildId] = {
    modules: modules ? { ...cur.modules, ...modules } : cur.modules,
    settings: settings ? { ...cur.settings, ...settings } : cur.settings,
    updated_at: Date.now()
  };
  save();
  return getGuild(guildId);
}

function isModuleEnabled(guildId, key) {
  // Default ON when key missing (new modules / old saves)
  const v = getGuild(guildId).modules[key];
  if (v === undefined || v === null) return true;
  return !!v;
}

function addLog(entry) {
  state.action_logs.push({
    id: nextId(),
    guild_id: entry.guildId,
    module: entry.module || 'system',
    actor_id: entry.actorId || null,
    target_id: entry.targetId || null,
    action: entry.action,
    reason: entry.reason || null,
    old_data: entry.oldData ? JSON.stringify(entry.oldData) : null,
    new_data: entry.newData ? JSON.stringify(entry.newData) : null,
    dienstnummer: entry.dienstnummer || null,
    roblox_username: entry.robloxUsername || null,
    created_at: Date.now()
  });
  if (state.action_logs.length > 5000) state.action_logs = state.action_logs.slice(-4000);
  save();
}

function listLogs(guildId, { limit = 100, module, q } = {}) {
  let rows = state.action_logs.filter((l) => l.guild_id === guildId);
  if (module) rows = rows.filter((l) => l.module === module);
  if (q) {
    const qq = String(q).toLowerCase();
    rows = rows.filter(
      (l) =>
        (l.action && l.action.toLowerCase().includes(qq)) ||
        (l.reason && String(l.reason).toLowerCase().includes(qq)) ||
        (l.target_id && String(l.target_id).includes(qq)) ||
        (l.dienstnummer && String(l.dienstnummer).toLowerCase().includes(qq)) ||
        (l.roblox_username && String(l.roblox_username).toLowerCase().includes(qq))
    );
  }
  return rows.slice().reverse().slice(0, limit);
}

function setSession(token, data) {
  state.sessions[token] = data;
  save();
}
function getSessionRow(token) {
  return state.sessions[token] || null;
}
function delSession(token) {
  delete state.sessions[token];
  save();
}
function setPending(stateKey, data) {
  state.oauth_pending[stateKey] = data;
  save();
}
function getPending(stateKey) {
  return state.oauth_pending[stateKey] || null;
}
function delPending(stateKey) {
  delete state.oauth_pending[stateKey];
  save();
}

function listKeywords(guildId) {
  if (!state.keywords) state.keywords = [];
  return state.keywords.filter((k) => k.guild_id === guildId);
}
function addKeyword(guildId, { trigger, response }) {
  if (!state.keywords) state.keywords = [];
  const row = {
    id: nextId(),
    guild_id: guildId,
    trigger: String(trigger || '').toLowerCase().trim(),
    response: String(response || ''),
    created_at: Date.now()
  };
  state.keywords.push(row);
  save();
  return row;
}
function delKeyword(guildId, id) {
  if (!state.keywords) return false;
  const before = state.keywords.length;
  state.keywords = state.keywords.filter((k) => !(k.guild_id === guildId && String(k.id) === String(id)));
  save();
  return state.keywords.length < before;
}
function listOffices(guildId) {
  if (!state.offices) state.offices = [];
  return state.offices.filter((o) => o.guild_id === guildId);
}
function addOffice(guildId, { name, voiceChannelId, roleId }) {
  if (!state.offices) state.offices = [];
  const row = {
    id: nextId(),
    guild_id: guildId,
    name: String(name || 'Büro'),
    voice_channel_id: voiceChannelId || null,
    role_id: roleId || null,
    created_at: Date.now()
  };
  state.offices.push(row);
  save();
  return row;
}
function delOffice(guildId, id) {
  if (!state.offices) return false;
  const before = state.offices.length;
  state.offices = state.offices.filter((o) => !(o.guild_id === guildId && String(o.id) === String(id)));
  save();
  return state.offices.length < before;
}

module.exports = {
  state,
  save,
  nextId,
  DEFAULT_MODULES,
  DEFAULT_SETTINGS,
  getGuild,
  saveGuild,
  isModuleEnabled,
  addLog,
  listLogs,
  setSession,
  getSessionRow,
  delSession,
  setPending,
  getPending,
  delPending,
  listKeywords,
  addKeyword,
  delKeyword,
  listOffices,
  addOffice,
  delOffice
};
