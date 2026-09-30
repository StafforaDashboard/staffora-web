(function () {
  var S = window.StafforaAPI;
  if (!S) return;

  var C = [
    ['allgemein', '⌂', 'Allgemein'],
    ['modules', '▦', 'Module'],
    ['dizzy', '◉', 'Dizzy Control'],
    ['rights', '♙', 'Rollen & Rechte'],
    ['tickets', '▣', 'Tickets & Support'],
    ['applications', '✦', 'Bewerbungen'],
    ['team', '♟', 'Team'],
    ['clock', '◷', 'Schicht & Clock'],
    ['tasks', '✓', 'Aufgaben'],
    ['database', '▤', 'Database'],
    ['factions', '⌂', 'Haus & Fraktionen'],
    ['moderation', '⚔', 'Moderation'],
    ['automod', '◉', 'AutoMod'],
    ['records', '▥', 'Strafregister'],
    ['stats', '◉', 'Team-Stats'],
    ['security', '⬡', 'Security'],
    ['welcome', '⌁', 'Welcome / Leave'],
    ['verify', '✓', 'Verify'],
    ['community', '♢', 'Community'],
    ['xp', '✦', 'XP'],
    ['rp', '⌖', 'RP'],
    ['logs', '▤', 'Logs'],
    ['system', '⚙', 'System'],
    ['partner', '✧', 'Partner'],
    ['ausweis', '▣', 'Ausweis'],
    ['unban', '↗', 'Unban'],
    ['ic', '⌘', 'IC Panel']
  ];

  var KEYS = {
    allgemein: [
      { id: 'language', label: 'Sprache', type: 'select', opts: [['de', 'Deutsch'], ['en', 'English']] },
      { id: 'systemName', label: 'System-Name', type: 'text' },
      { id: 'logChannelId', label: 'Log-Kanal', type: 'channel' },
      { id: 'timezone', label: 'Zeitzone', type: 'text' }
    ],
    modules: [
      { id: 'module_tickets', label: 'Tickets', type: 'toggle' },
      { id: 'module_warteraumSupport', label: 'Warteraum', type: 'toggle' },
      { id: 'module_adminCalls', label: 'Admin Call', type: 'toggle' },
      { id: 'module_offices', label: 'Büros', type: 'toggle' },
      { id: 'module_dutyPanel', label: 'Duty', type: 'toggle' },
      { id: 'module_bewerbungen', label: 'Bewerbungen', type: 'toggle' },
      { id: 'module_teamverwaltung', label: 'Teamverwaltung', type: 'toggle' },
      { id: 'module_dizzy', label: 'Dizzy Control', type: 'toggle' },
      { id: 'module_security', label: 'Security', type: 'toggle' },
      { id: 'module_automod', label: 'AutoMod', type: 'toggle' },
      { id: 'module_xp', label: 'XP', type: 'toggle' },
      { id: 'module_verify', label: 'Verify', type: 'toggle' },
      { id: 'module_welcome', label: 'Welcome/Leave', type: 'toggle' },
      { id: 'module_partner', label: 'Partner', type: 'toggle' },
      { id: 'module_fraktionen', label: 'Fraktionen', type: 'toggle' },
      { id: 'module_ausweis', label: 'Ausweis', type: 'toggle' },
      { id: 'module_feedback', label: 'Feedback', type: 'toggle' },
      { id: 'module_aufgaben', label: 'Aufgaben', type: 'toggle' },
      { id: 'module_database', label: 'Database', type: 'toggle' },
      { id: 'module_abmelden', label: 'Abmeldung', type: 'toggle' },
      { id: 'module_giveaway', label: 'Giveaway', type: 'toggle' },
      { id: 'module_suggest', label: 'Suggest', type: 'toggle' }
    ],
    dizzy: [
      { id: 'dizzyEnabled', label: 'Modul aktiv', type: 'toggle' },
      { id: 'dizzyChannelId', label: 'Dizzy-Control-Kanal', type: 'channel' },
      { id: 'dizzyLogChannelId', label: 'Dizzy-Log-Kanal', type: 'channel' },
      { id: 'dizzyStaffRoleIds', label: 'Staff-Rolle (Bestätigen)', type: 'role' },
      { id: '_panel_dizzy', label: 'Sticky senden', type: 'panel', panel: 'dizzy', channelKey: 'dizzyChannelId' }
    ],
    rights: [
      { id: 'adminRoleIds', label: 'Admin-Rolle', type: 'role' },
      { id: 'staffRoleIds', label: 'Staff-Rolle', type: 'role' },
      { id: 'modRoleIds', label: 'Mod-Rolle', type: 'role' },
      { id: 'ingamePanelAccessRoleIds', label: 'IC Panel Zugriff', type: 'role' },
      { id: 'databaseManagerRoleIds', label: 'Database Manager', type: 'role' },
      { id: 'factionManagerRoleIds', label: 'Frak-Verwaltung', type: 'role' },
      { id: 'partnerManagerRoleIds', label: 'Partner Manager', type: 'role' },
      { id: 'highteamRoleIds', label: 'HighTeam', type: 'role' }
    ],
    tickets: [
      { id: 'ticketPanelChannelId', label: 'Ticket-Panel-Kanal', type: 'channel' },
      { id: 'ticketLogChannelId', label: 'Ticket-Log', type: 'channel' },
      { id: 'ticketCategoryId', label: 'Ticket-Kategorie', type: 'channel' },
      { id: 'ticketSupportRoleIds', label: 'Support-Rolle', type: 'role' },
      { id: 'ticketBlacklistRoleIds', label: 'Ticket-Blacklist-Rolle', type: 'role' },
      { id: 'warteraumChannelId', label: 'Warteraum Voice', type: 'channel' },
      { id: 'warteraumTextChannelId', label: 'Support-Textkanal', type: 'channel' },
      { id: 'warteraumMusicEnabled', label: 'Warteraum-Musik', type: 'toggle' },
      { id: 'warteraumMusicPreset', label: 'Musik-Preset', type: 'select', opts: [['de', 'Deutsch'], ['en', 'English']] },
      { id: 'supportJoinToCreate', label: 'Join-to-Create Support-VCs', type: 'toggle' },
      { id: 'supportVoiceCategoryId', label: 'Support-VC Kategorie', type: 'channel' },
      { id: 'adminCallPanelChannelId', label: 'Admin-Call-Panel', type: 'channel' },
      { id: 'adminCallLogChannelId', label: 'Admin-Call-Log', type: 'channel' },
      { id: 'officeWaitingChannelId', label: 'Büro-Warteraum', type: 'channel' },
      { id: 'officeReadyRoleIds', label: 'Büro-Bereitschafts-Rolle', type: 'role' },
      { id: '_panel_ticket', label: 'Ticket-Panel senden', type: 'panel', panel: 'ticket', channelKey: 'ticketPanelChannelId' },
      { id: '_panel_admincall', label: 'Admin-Call-Panel senden', type: 'panel', panel: 'admincall', channelKey: 'adminCallPanelChannelId' }
    ],
    applications: [
      { id: 'applicationPanelChannelId', label: 'Bewerbungs-Panel', type: 'channel' },
      { id: 'applicationLogChannelId', label: 'Bewerbungs-Log', type: 'channel' },
      { id: 'applicationAcceptRoleIds', label: 'Rolle bei Annahme', type: 'role' },
      { id: '_panel_app', label: 'Panel senden', type: 'panel', panel: 'bewerbung', channelKey: 'applicationPanelChannelId' }
    ],
    team: [
      { id: 'teamlistChannelId', label: 'Teamliste-Kanal', type: 'channel' },
      { id: 'teamlistRoleIds', label: 'Rollen in Teamliste', type: 'role' },
      { id: 'dutyPanelChannelId', label: 'Duty-Panel', type: 'channel' },
      { id: 'dutyRoleIds', label: 'Duty-Rolle', type: 'role' },
      { id: 'teamInviteRoleIds', label: 'Rollen bei Invite', type: 'role' },
      { id: 'teamKickRoleIds', label: 'Rollen bei Kick entfernen', type: 'role' },
      { id: 'teamLogChannelId', label: 'Team Invite/Kick Log', type: 'channel' },
      { id: 'teamWarnKickAt', label: 'Team-Warns bis Kick', type: 'text' },
      { id: 'abmeldenPanelChannelId', label: 'Abmelde-Panel', type: 'channel' },
      { id: 'abmeldenLogChannelId', label: 'Abmelde-Log', type: 'channel' },
      { id: 'abmeldenRequireApproval', label: 'Abmeldung muss bestätigt werden', type: 'toggle' },
      { id: 'feedbackLogChannelId', label: 'Feedback-Log', type: 'channel' },
      { id: 'feedbackSticky', label: 'Feedback als Sticky', type: 'toggle' },
      { id: 'activityCheckChannelId', label: 'Activity-Check Kanal', type: 'channel' },
      { id: '_panel_team', label: 'Teamliste senden', type: 'panel', panel: 'teamlist', channelKey: 'teamlistChannelId' },
      { id: '_panel_duty', label: 'Duty-Panel senden', type: 'panel', panel: 'duty', channelKey: 'dutyPanelChannelId' },
      { id: '_panel_ab', label: 'Abmelde-Panel senden', type: 'panel', panel: 'abmelden', channelKey: 'abmeldenPanelChannelId' },
      { id: '_panel_fb', label: 'Feedback-Panel senden', type: 'panel', panel: 'feedback', channelKey: 'feedbackLogChannelId' }
    ],
    clock: [
      { id: 'clockEnabled', label: 'Clock aktiv', type: 'toggle' },
      { id: 'clockLogChannelId', label: 'Clock-Log', type: 'channel' }
    ],
    tasks: [
      { id: 'aufgabenPanelChannelId', label: 'Aufgaben-Panel', type: 'channel' },
      { id: 'aufgabenXp', label: 'XP für Aufgaben', type: 'text' },
      { id: '_panel_task', label: 'Panel senden', type: 'panel', panel: 'tasks', channelKey: 'aufgabenPanelChannelId' }
    ],
    database: [
      { id: 'databasePanelChannelId', label: 'Database-Panel', type: 'channel' },
      { id: 'databaseManagerRoleIds', label: 'Manager-Rolle', type: 'role' },
      { id: '_panel_db', label: 'Panel senden', type: 'panel', panel: 'database', channelKey: 'databasePanelChannelId' }
    ],
    factions: [
      { id: 'factionAnnounceChannelId', label: 'Frak-Announce', type: 'channel' },
      { id: 'factionWarnKickAt', label: 'Warns bis Remove', type: 'text' },
      { id: 'hauslisteChannelId', label: 'Hausliste-Kanal', type: 'channel' },
      { id: 'hausTicketCategoryId', label: 'Haus-Ticket Kategorie', type: 'channel' },
      { id: '_panel_haus', label: 'Hausliste senden', type: 'panel', panel: 'hausliste', channelKey: 'hauslisteChannelId' }
    ],
    moderation: [
      { id: 'modLogChannelId', label: 'Mod-Log', type: 'channel' },
      { id: 'warnLogChannelId', label: 'Warn-Log', type: 'channel' },
      { id: 'banLogChannelId', label: 'Ban-Log', type: 'channel' }
    ],
    automod: [
      { id: 'automodBlockLinks', label: 'Links blocken', type: 'toggle' },
      { id: 'automodBlockInvites', label: 'Invites blocken', type: 'toggle' },
      { id: 'automodCaps', label: 'Caps-Filter', type: 'toggle' },
      { id: 'automodSpam', label: 'Spam-Filter', type: 'toggle' },
      { id: 'automodLogChannelId', label: 'AutoMod-Log', type: 'channel' }
    ],
    records: [
      { id: 'caseLogChannelId', label: 'Strafregister-Log', type: 'channel' }
    ],
    stats: [
      { id: '_stats', label: 'Stats', type: 'stats' }
    ],
    security: [
      { id: 'securityAntiNuke', label: 'Anti-Nuke', type: 'toggle' },
      { id: 'securityAntiRaid', label: 'Anti-Raid', type: 'toggle' },
      { id: 'securityDisableExternalApps', label: 'Externe Apps deaktivieren', type: 'toggle' },
      { id: 'securityLogChannelId', label: 'Security-Log', type: 'channel' },
      { id: 'securityMainLogChannelId', label: 'Main-Log', type: 'channel' },
      { id: 'backupWhitelistRoleIds', label: 'Backup Whitelist-Rolle', type: 'role' }
    ],
    welcome: [
      { id: 'welcomeChannelId', label: 'Welcome-Kanal', type: 'channel' },
      { id: 'welcomeMessage', label: 'Welcome-Text', type: 'text' },
      { id: 'leaveChannelId', label: 'Leave-Kanal', type: 'channel' },
      { id: 'leaveMessage', label: 'Leave-Text', type: 'text' },
      { id: 'autoRoleIds', label: 'Auto-Rolle', type: 'role' }
    ],
    verify: [
      { id: 'verifyChannelId', label: 'Verify-Kanal', type: 'channel' },
      { id: 'verifyRoleIds', label: 'Verified-Rolle', type: 'role' },
      { id: 'unverifiedRoleIds', label: 'Unverified-Rolle', type: 'role' },
      { id: '_panel_ver', label: 'Panel senden', type: 'panel', panel: 'verify', channelKey: 'verifyChannelId' }
    ],
    community: [
      { id: 'partnerChannelId', label: 'Partner-Kanal', type: 'channel' },
      { id: 'boostChannelId', label: 'Boost-Kanal', type: 'channel' },
      { id: 'suggestChannelId', label: 'Suggest-Kanal', type: 'channel' },
      { id: 'giveawayChannelId', label: 'Giveaway-Kanal', type: 'channel' }
    ],
    xp: [
      { id: 'xpEnabled', label: 'XP aktiv', type: 'toggle' },
      { id: 'xpTicket', label: 'XP Ticket übernehmen', type: 'text' },
      { id: 'xpVoice', label: 'XP Voice / Support', type: 'text' },
      { id: 'xpFeedbackGood', label: 'XP Feedback gut', type: 'text' },
      { id: 'xpAnnounceChannelId', label: 'Uprank-Announce', type: 'channel' }
    ],
    rp: [
      { id: 'rpAnnounceChannelId', label: 'RP Announce', type: 'channel' },
      { id: 'serverStatsChannelId', label: 'Server-Stats Kanal', type: 'channel' },
      { id: '_panel_stats', label: 'Stats-Panel senden', type: 'panel', panel: 'serverstats', channelKey: 'serverStatsChannelId' }
    ],
    logs: [
      { id: 'logChannelId', label: 'System-Log', type: 'channel' },
      { id: 'modLogChannelId', label: 'Mod-Log', type: 'channel' },
      { id: 'ticketLogChannelId', label: 'Ticket-Log', type: 'channel' },
      { id: 'securityLogChannelId', label: 'Security-Log', type: 'channel' }
    ],
    system: [
      { id: 'systemName', label: 'System-Name', type: 'text' },
      { id: 'language', label: 'Sprache', type: 'select', opts: [['de', 'Deutsch'], ['en', 'English']] }
    ],
    partner: [
      { id: 'partnerChannelId', label: 'Partner-Kanal', type: 'channel' },
      { id: 'partnerLogChannelId', label: 'Partner-Log', type: 'channel' }
    ],
    ausweis: [
      { id: 'ausweisChannelId', label: 'Ausweis-Kanal', type: 'channel' },
      { id: 'ausweisLogChannelId', label: 'Ausweis-Log', type: 'channel' },
      { id: 'ausweisMaxExtra', label: 'Max. Zusatz-Ausweise', type: 'text' },
      { id: '_panel_aus', label: 'Panel senden', type: 'panel', panel: 'ausweis', channelKey: 'ausweisChannelId' }
    ],
    unban: [
      { id: 'unbanEnabled', label: 'Appeals aktiv', type: 'toggle' },
      { id: 'unbanRequireActiveBan', label: 'Nur bei aktivem Ban', type: 'toggle' },
      { id: 'unbanLogChannelId', label: 'Appeal-Log', type: 'channel' }
    ],
    ic: [
      { id: 'ingamePanelAccessRoleIds', label: 'IC Access Rolle', type: 'role' },
      { id: 'ingameLogChannelId', label: 'IC Log', type: 'channel' },
      { id: 'ingameModRoleIds', label: 'IC Mod-Rolle', type: 'role' }
    ]
  };

  var state = { me: null, guilds: [], guildId: '', settings: {}, modules: {}, roles: [], channels: [], activeCat: null };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__t);
    window.__t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function getVal(key) {
    var s = state.settings || {};
    var v = s[key];
    if (v == null && key.indexOf('module_') === 0) {
      var mk = key.slice(7);
      if (state.modules && state.modules[mk] != null) return state.modules[mk];
      return true;
    }
    return v;
  }

  function channelSelect(id, selected) {
    var html = '<select class="control" data-key="' + esc(id) + '"><option value="">—</option>';
    (state.channels || []).forEach(function (c) {
      var cid = String(c.id);
      var label = c.type === 4 ? ('▸ ' + (c.name || cid)) : ('#' + (c.name || cid));
      html += '<option value="' + esc(cid) + '"' + (String(selected || '') === cid ? ' selected' : '') + '>' + esc(label) + '</option>';
    });
    return html + '</select>';
  }
  function roleSelect(id, selected) {
    var sel = Array.isArray(selected) ? selected[0] : selected;
    var html = '<select class="control" data-key="' + esc(id) + '"><option value="">—</option>';
    (state.roles || []).forEach(function (r) {
      var rid = String(r.id);
      html += '<option value="' + esc(rid) + '"' + (String(sel || '') === rid ? ' selected' : '') + '>' + esc(r.name || rid) + '</option>';
    });
    return html + '</select>';
  }

  function renderField(f) {
    var val = getVal(f.id);
    if (f.type === 'toggle') {
      var on = val !== false && val !== 0 && val !== '0';
      return '<div class="switch"><span>' + esc(f.label) + '</span><span class="toggle' + (on ? ' on' : '') + '" data-toggle data-key="' + esc(f.id) + '"><i></i></span></div>';
    }
    if (f.type === 'channel') {
      return '<div class="field"><label>' + esc(f.label) + '</label>' + channelSelect(f.id, val) + '</div>';
    }
    if (f.type === 'role') {
      return '<div class="field"><label>' + esc(f.label) + '</label>' + roleSelect(f.id, val) + '</div>';
    }
    if (f.type === 'select') {
      var html = '<div class="field"><label>' + esc(f.label) + '</label><select class="control" data-key="' + esc(f.id) + '">';
      (f.opts || []).forEach(function (o) {
        html += '<option value="' + esc(o[0]) + '"' + (String(val || 'de') === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      });
      return html + '</select></div>';
    }
    if (f.type === 'panel') {
      return '<div class="settings-actions" style="margin-top:10px"><button type="button" class="btn btn-primary" data-panel="' + esc(f.panel) + '" data-chkey="' + esc(f.channelKey) + '">' + esc(f.label) + '</button></div>';
    }
    if (f.type === 'stats') {
      return '<div class="settings-actions"><button type="button" class="btn btn-primary" id="btnLoadStats">Laden</button></div><div id="statsOut" style="margin-top:12px"></div>';
    }
    return '<div class="field"><label>' + esc(f.label) + '</label><input class="control" data-key="' + esc(f.id) + '" value="' + esc(val == null ? '' : val) + '"></div>';
  }

  function collectSettings(panel) {
    var out = {};
    panel.querySelectorAll('[data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (!key || key.charAt(0) === '_') return;
      if (el.classList.contains('toggle')) {
        out[key] = el.classList.contains('on');
      } else {
        var v = el.value;
        if (/RoleIds$/i.test(key)) out[key] = v ? [v] : [];
        else if (/ChannelId$|CategoryId$/i.test(key) || /Id$/.test(key)) out[key] = v || null;
        else out[key] = v;
      }
    });
    return out;
  }

  function renderCat(key) {
    var cat = C.find(function (x) { return x[0] === key; });
    if (!cat) return;
    state.activeCat = key;
    document.querySelectorAll('#categories [data-cat]').forEach(function (x) {
      x.classList.toggle('active', x.getAttribute('data-cat') === key);
    });
    var empty = $('empty');
    if (empty) {
      empty.classList.add('hidden');
      empty.style.display = 'none';
    }
    var p = $('settingsPanel');
    p.classList.remove('hidden');
    p.style.display = 'block';
    var fields = KEYS[key] || [];
    p.innerHTML =
      '<div class="settings-header"><div><span class="eyebrow">KATEGORIE</span><h2>' + esc(cat[2]) + '</h2></div>' +
      '<div class="settings-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnBackCat">Zurück</button>' +
      '<button type="button" class="btn btn-primary" id="btnSave">Speichern</button></div></div>' +
      '<article class="settings-card glass"><h3>Einstellungen</h3>' + fields.map(renderField).join('') + '</article>';

    p.querySelectorAll('[data-toggle]').forEach(function (t) {
      t.addEventListener('click', function () { t.classList.toggle('on'); });
    });
    $('btnBackCat').onclick = function () {
      state.activeCat = null;
      p.classList.add('hidden');
      p.style.display = 'none';
      p.innerHTML = '';
      var empty = $('empty');
      if (empty) {
        empty.classList.remove('hidden');
        empty.style.display = '';
      }
      document.querySelectorAll('#categories [data-cat]').forEach(function (x) { x.classList.remove('active'); });
    };
    $('btnSave').onclick = function () {
      var partial = collectSettings(p);
      var btn = $('btnSave');
      btn.disabled = true;
      S.patchSettings(state.guildId, partial).then(function () {
        Object.assign(state.settings, partial);
        toast('Gespeichert');
      }).catch(function (e) {
        toast(e.message || 'Fehler');
      }).then(function () { btn.disabled = false; });
    };
    p.querySelectorAll('[data-panel]').forEach(function (btn) {
      btn.onclick = function () {
        var chKey = btn.getAttribute('data-chkey');
        var sel = p.querySelector('[data-key="' + chKey + '"]');
        var ch = sel ? sel.value : '';
        if (!ch) { toast('Kanal wählen'); return; }
        S.sendPanel(state.guildId, btn.getAttribute('data-panel'), ch)
          .then(function () { toast('Panel gesendet'); })
          .catch(function (e) { toast(e.message || 'Fehler'); });
      };
    });
    var st = $('btnLoadStats');
    if (st) st.onclick = function () {
      S.teamStats(state.guildId, 7).then(function (data) {
        var s = data.summary || data || {};
        $('statsOut').innerHTML =
          '<div class="grid mini-stats">' +
          '<div class="card glass"><small>Aktionen</small><strong>' + esc(s.totalActions != null ? s.totalActions : '—') + '</strong></div>' +
          '<div class="card glass"><small>Tickets offen</small><strong>' + esc(s.openTickets != null ? s.openTickets : '—') + '</strong></div>' +
          '<div class="card glass"><small>Staff aktiv</small><strong>' + esc(s.staffActive != null ? s.staffActive : '—') + '</strong></div></div>';
      }).catch(function (e) { toast(e.message); });
    };
  }

  function buildCats() {
    var nav = $('categories');
    nav.innerHTML = C.map(function (c) {
      return '<button type="button" class="nav-link" data-cat="' + c[0] + '"><span>' + c[1] + '</span><span>' + c[2] + '</span><span class="arrow">›</span></button>';
    }).join('');
    nav.querySelectorAll('[data-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!state.guildId) { toast('Zuerst Server wählen'); return; }
        renderCat(btn.getAttribute('data-cat'));
      });
    });
  }

  function paintServers(filter) {
    var q = (filter || '').toLowerCase();
    var box = $('serverList');
    var items = state.guilds.filter(function (g) {
      return !q || String(g.name || '').toLowerCase().indexOf(q) >= 0;
    });
    box.innerHTML = items.map(function (g) {
      return '<button type="button" class="server-row" data-id="' + esc(g.id) + '">' +
        '<span class="server-icon">S</span><span class="grow"><b>' + esc(g.name) + '</b></span></button>';
    }).join('') || '<p style="padding:12px;color:var(--muted)">Keine Server</p>';
    box.querySelectorAll('[data-id]').forEach(function (btn) {
      btn.onclick = function () { selectGuild(btn.getAttribute('data-id')); };
    });
  }

  function selectGuild(id) {
    state.guildId = id;
    try { localStorage.setItem('staffora_guild', id); } catch (e) {}
    var g = state.guilds.find(function (x) { return String(x.id) === String(id); });
    $('serverName').textContent = g ? g.name : id;
    $('serverMeta').textContent = 'Server';
    $('serverHint').textContent = (g ? g.name : id) + ' · Kategorie links wählen';
    $('serverPicker').classList.remove('open');
    $('dashMain').style.display = '';
    Promise.all([
      S.config(id).catch(function () { return {}; }),
      S.discord(id).catch(function () { return {}; })
    ]).then(function (pair) {
      var cfg = pair[0] || {};
      state.settings = cfg.settings || cfg.config || cfg || {};
      state.modules = cfg.modules || state.settings.modules || {};
      var d = pair[1] || {};
      state.roles = d.roles || [];
      state.channels = d.channels || [];
      state.activeCat = null;
      $('settingsPanel').classList.add('hidden');$('settingsPanel').style.display='none';$('settingsPanel').innerHTML='';var __e=$('empty');if(__e){__e.classList.remove('hidden');__e.style.display='';}
      document.querySelectorAll('#categories [data-cat]').forEach(function (x) { x.classList.remove('active'); });
    }).catch(function (e) { toast(e.message || 'Fehler'); });
  }

  function boot() {
    buildCats();
    S.readToken();

    var accessGate = $('accessGate');
    var btnAk = $('btnAccessKey');
    if (window.STAFFORA_EARLY_ACCESS && accessGate) {
      if (!S.hasEarlyAccess()) {
        accessGate.style.display = 'flex';
        $('loginGate').style.display = 'none';
        $('appShell').style.display = 'none';
      } else {
        accessGate.style.display = 'none';
      }
      if (btnAk) {
        btnAk.onclick = function () {
          var key = ($('accessKeyInput') || {}).value || '';
          btnAk.disabled = true;
          $('accessErr').textContent = '';
          S.validateAccessKey(key).then(function () {
            accessGate.style.display = 'none';
            continueAuth();
          }).catch(function (e) {
            $('accessErr').textContent = e.message || 'Invalid key';
          }).then(function () { btnAk.disabled = false; });
        };
      }
    }

    $('btnLogin').onclick = function () { S.login(location.origin + '/dashboard/'); };
    $('serverButton').onclick = function () {
      $('serverPicker').classList.add('open');
      paintServers($('serverSearch').value);
    };
    $('serverSearch').oninput = function () { paintServers($('serverSearch').value); };
    $('logoutBtn').onclick = function () { S.logout(); location.href = '/dashboard/'; };
    var gs = $('globalSearch');
    if (gs) gs.oninput = function () {
      var q = gs.value.toLowerCase();
      document.querySelectorAll('#categories [data-cat]').forEach(function (x) {
        x.style.display = x.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
      });
    };

    if (window.STAFFORA_EARLY_ACCESS && !S.hasEarlyAccess()) {
      return;
    }
    continueAuth();
  }

  function continueAuth() {
    if (!S.getToken()) {
      $('loginGate').style.display = 'flex';
      $('appShell').style.display = 'none';
      return;
    }
    $('loginGate').style.display = 'none';
    $('appShell').style.display = '';

    S.me().then(function (u) {
      state.me = u.user || u;
      var name = state.me.username || state.me.global_name || 'User';
      $('userName').textContent = name;
      $('userRole').textContent = 'Admin';
      var av = (name.charAt(0) || '?').toUpperCase();
      if ($('userAv')) $('userAv').textContent = av;
      if ($('userAv2')) $('userAv2').textContent = av;
      return S.guilds();
    }).then(function (g) {
      state.guilds = g.guilds || g || [];
      if (!Array.isArray(state.guilds)) state.guilds = [];
      var last = '';
      try { last = localStorage.getItem('staffora_guild') || ''; } catch (e) {}
      if (last && state.guilds.some(function (x) { return String(x.id) === String(last); })) {
        selectGuild(last);
      } else {
        $('serverPicker').classList.add('open');
        $('dashMain').style.display = 'none';
        paintServers('');
      }
    }).catch(function (e) {
      S.logout();
      $('loginGate').style.display = 'flex';
      $('appShell').style.display = 'none';
      $('loginErr').textContent = e.message || 'Session abgelaufen';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
