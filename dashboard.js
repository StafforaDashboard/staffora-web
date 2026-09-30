/**
 * Staffora Dashboard — 3D UI + live bot sync
 */
(function () {
  var S = window.StafforaAPI;
  if (!S) { console.error('StafforaAPI missing'); return; }

  var C = [
    ['allgemein','⌂','Allgemein','Sprache, Name, Log'],
    ['modules','▦','Module','Module an/aus'],
    ['rights','♙','Rollen & Rechte','Admin, Staff, IC'],
    ['tickets','▣','Tickets & Support','Tickets, Warteraum, Admin Call'],
    ['applications','✦','Bewerbungen','Panel & Log'],
    ['team','♟','Team','Teamliste, Duty, Abmeldung'],
    ['clock','◷','Schicht & Clock','Clock tracking'],
    ['tasks','✓','Aufgaben','Task-Panel'],
    ['database','▤','Database','Suchen / Add / Remove'],
    ['factions','⌂','Haus & Fraktionen','Fraks & Häuser'],
    ['moderation','⚔','Moderation','Mod-Log'],
    ['automod','◉','AutoMod','Filter'],
    ['records','▥','Strafregister','Case-Log'],
    ['stats','◉','Team-Stats','Auswertung'],
    ['security','⬡','Security','Anti-Nuke / Raid'],
    ['welcome','⌁','Welcome / Leave','Join/Leave'],
    ['verify','✓','Verify','Verify-Panel'],
    ['community','♢','Community','Partner, Boost'],
    ['xp','✦','XP','XP an/aus'],
    ['rp','⌖','RP','Start/Stop & Stats'],
    ['logs','▤','Logs','Log-Kanäle'],
    ['system','⚙','System','Basis'],
    ['partner','✧','Partner','Partner-Kanal'],
    ['ausweis','▣','Ausweis','ID-Kanal'],
    ['unban','↗','Unban','Appeal-Settings'],
    ['ic','⌘','IC Panel','Zugriff & Sync']
  ];

  // setting key maps per category for save/load
  var KEYS = {
    allgemein: [
      { id: 'language', label: 'Sprache', type: 'select', opts: [['de','Deutsch'],['en','English']] },
      { id: 'systemName', label: 'System-Name', type: 'text' },
      { id: 'logChannelId', label: 'Log-Kanal', type: 'channel' }
    ],
    modules: [
      { id: 'module_tickets', label: 'Tickets', type: 'toggle' },
      { id: 'module_warteraumSupport', label: 'Warteraum', type: 'toggle' },
      { id: 'module_adminCalls', label: 'Admin Call', type: 'toggle' },
      { id: 'module_dutyPanel', label: 'Duty', type: 'toggle' },
      { id: 'module_bewerbungen', label: 'Bewerbungen', type: 'toggle' },
      { id: 'module_security', label: 'Security', type: 'toggle' },
      { id: 'module_xp', label: 'XP', type: 'toggle' },
      { id: 'module_verify', label: 'Verify', type: 'toggle' }
    ],
    rights: [
      { id: 'adminRoleIds', label: 'Admin-Rolle', type: 'role', multi: false },
      { id: 'staffRoleIds', label: 'Staff-Rolle', type: 'role', multi: false },
      { id: 'ingamePanelAccessRoleIds', label: 'IC Panel Zugriff', type: 'role', multi: false }
    ],
    tickets: [
      { id: 'ticketPanelChannelId', label: 'Ticket-Panel-Kanal', type: 'channel' },
      { id: 'ticketLogChannelId', label: 'Ticket-Log', type: 'channel' },
      { id: 'warteraumChannelId', label: 'Warteraum Voice', type: 'channel' },
      { id: 'warteraumTextChannelId', label: 'Support-Text', type: 'channel' },
      { id: 'adminCallPanelChannelId', label: 'Admin-Call-Panel', type: 'channel' },
      { id: '_panel_ticket', label: 'Ticket-Panel senden', type: 'panel', panel: 'ticket', channelKey: 'ticketPanelChannelId' },
      { id: '_panel_admincall', label: 'Admin-Call-Panel senden', type: 'panel', panel: 'admincall', channelKey: 'adminCallPanelChannelId' }
    ],
    applications: [
      { id: 'applicationPanelChannelId', label: 'Bewerbungs-Panel', type: 'channel' },
      { id: 'applicationLogChannelId', label: 'Bewerbungs-Log', type: 'channel' },
      { id: '_panel_app', label: 'Panel senden', type: 'panel', panel: 'bewerbung', channelKey: 'applicationPanelChannelId' }
    ],
    team: [
      { id: 'teamlistChannelId', label: 'Teamliste-Kanal', type: 'channel' },
      { id: 'dutyPanelChannelId', label: 'Duty-Panel', type: 'channel' },
      { id: 'dutyRoleIds', label: 'Duty-Rolle', type: 'role' },
      { id: 'abmeldenPanelChannelId', label: 'Abmelde-Panel', type: 'channel' },
      { id: 'feedbackLogChannelId', label: 'Feedback-Log', type: 'channel' },
      { id: '_panel_team', label: 'Teamliste senden', type: 'panel', panel: 'teamlist', channelKey: 'teamlistChannelId' },
      { id: '_panel_duty', label: 'Duty-Panel senden', type: 'panel', panel: 'duty', channelKey: 'dutyPanelChannelId' },
      { id: '_panel_ab', label: 'Abmelde-Panel senden', type: 'panel', panel: 'abmelden', channelKey: 'abmeldenPanelChannelId' }
    ],
    clock: [{ id: 'clockEnabled', label: 'Clock aktiv', type: 'toggle' }],
    tasks: [
      { id: 'aufgabenPanelChannelId', label: 'Aufgaben-Panel', type: 'channel' },
      { id: '_panel_task', label: 'Panel senden', type: 'panel', panel: 'tasks', channelKey: 'aufgabenPanelChannelId' }
    ],
    database: [
      { id: 'databasePanelChannelId', label: 'Database-Panel', type: 'channel' },
      { id: 'databaseManagerRoleIds', label: 'Manager-Rolle', type: 'role' },
      { id: '_panel_db', label: 'Panel senden', type: 'panel', panel: 'database', channelKey: 'databasePanelChannelId' }
    ],
    factions: [
      { id: 'factionAnnounceChannelId', label: 'Frak-Announce', type: 'channel' },
      { id: 'hauslisteChannelId', label: 'Hausliste', type: 'channel' },
      { id: '_panel_haus', label: 'Hausliste senden', type: 'panel', panel: 'hausliste', channelKey: 'hauslisteChannelId' }
    ],
    moderation: [{ id: 'modLogChannelId', label: 'Mod-Log', type: 'channel' }],
    automod: [
      { id: 'automodBlockLinks', label: 'Links blocken', type: 'toggle' },
      { id: 'automodBlockInvites', label: 'Invites blocken', type: 'toggle' },
      { id: 'automodLogChannelId', label: 'AutoMod-Log', type: 'channel' }
    ],
    records: [{ id: 'caseLogChannelId', label: 'Case-Log', type: 'channel' }],
    stats: [{ id: '_stats', label: 'Stats laden', type: 'stats' }],
    security: [
      { id: 'securityAntiNuke', label: 'Anti-Nuke', type: 'toggle' },
      { id: 'securityAntiRaid', label: 'Anti-Raid', type: 'toggle' },
      { id: 'securityLogChannelId', label: 'Security-Log', type: 'channel' }
    ],
    welcome: [
      { id: 'welcomeChannelId', label: 'Welcome-Kanal', type: 'channel' },
      { id: 'leaveChannelId', label: 'Leave-Kanal', type: 'channel' }
    ],
    verify: [
      { id: 'verifyChannelId', label: 'Verify-Kanal', type: 'channel' },
      { id: 'verifyRoleIds', label: 'Verified-Rolle', type: 'role' },
      { id: '_panel_ver', label: 'Panel senden', type: 'panel', panel: 'verify', channelKey: 'verifyChannelId' }
    ],
    community: [
      { id: 'partnerChannelId', label: 'Partner-Kanal', type: 'channel' },
      { id: 'boostChannelId', label: 'Boost-Kanal', type: 'channel' }
    ],
    xp: [{ id: 'xpEnabled', label: 'XP aktiv', type: 'toggle' }],
    rp: [
      { id: 'rpAnnounceChannelId', label: 'RP-Announce', type: 'channel' },
      { id: 'serverStatsChannelId', label: 'Server-Stats', type: 'channel' },
      { id: '_panel_stats', label: 'Stats-Panel senden', type: 'panel', panel: 'serverstats', channelKey: 'serverStatsChannelId' }
    ],
    logs: [
      { id: 'logChannelId', label: 'System-Log', type: 'channel' },
      { id: 'modLogChannelId', label: 'Mod-Log', type: 'channel' }
    ],
    system: [{ id: 'systemName', label: 'System-Name', type: 'text' }],
    partner: [{ id: 'partnerChannelId', label: 'Partner-Kanal', type: 'channel' }],
    ausweis: [
      { id: 'ausweisChannelId', label: 'Ausweis-Kanal', type: 'channel' },
      { id: 'ausweisLogChannelId', label: 'Ausweis-Log', type: 'channel' }
    ],
    unban: [
      { id: 'unbanEnabled', label: 'Appeals aktiv', type: 'toggle' },
      { id: 'unbanRequireActiveBan', label: 'Nur bei aktivem Ban', type: 'toggle' }
    ],
    ic: [
      { id: 'ingamePanelAccessRoleIds', label: 'IC Access Rolle', type: 'role' },
      { id: 'ingameLogChannelId', label: 'IC Log-Kanal', type: 'channel' }
    ]
  };

  var state = {
    me: null,
    guilds: [],
    guildId: '',
    settings: {},
    modules: {},
    roles: [],
    channels: [],
    activeCat: null
  };

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
    clearTimeout(window.__toast);
    window.__toast = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  window.toast = toast;

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
    var html = '<select class="control" data-key="' + esc(id) + '"><option value="">— Kanal —</option>';
    (state.channels || []).forEach(function (c) {
      var cid = String(c.id);
      html += '<option value="' + esc(cid) + '"' + (String(selected || '') === cid ? ' selected' : '') + '>#' + esc(c.name || cid) + '</option>';
    });
    return html + '</select>';
  }
  function roleSelect(id, selected) {
    var sel = selected;
    if (Array.isArray(sel)) sel = sel[0] || '';
    var html = '<select class="control" data-key="' + esc(id) + '"><option value="">— Rolle —</option>';
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
      return '<div class="settings-actions" style="margin-top:8px"><button type="button" class="btn btn-primary" data-panel="' + esc(f.panel) + '" data-chkey="' + esc(f.channelKey) + '">' + esc(f.label) + '</button></div>';
    }
    if (f.type === 'stats') {
      return '<div class="settings-actions"><button type="button" class="btn btn-primary" id="btnLoadStats">Team-Stats laden</button></div><div id="statsOut" style="margin-top:12px"></div>';
    }
    return '<div class="field"><label>' + esc(f.label) + '</label><input class="control" data-key="' + esc(f.id) + '" value="' + esc(val || '') + '"></div>';
  }

  function collectSettings(panel) {
    var out = {};
    panel.querySelectorAll('[data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key');
      if (!key || key.charAt(0) === '_') return;
      if (el.classList.contains('toggle')) {
        out[key] = el.classList.contains('on');
      } else if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
        var v = el.value;
        if (key.indexOf('RoleIds') >= 0 || key.slice(-7) === 'RoleIds') {
          out[key] = v ? [v] : [];
        } else if (key.slice(-2) === 'Id' || key.indexOf('Channel') >= 0) {
          out[key] = v || null;
        } else {
          out[key] = v;
        }
      }
    });
    return out;
  }

  function renderCat(key) {
    var cat = C.find(function (x) { return x[0] === key; });
    if (!cat) return;
    state.activeCat = key;
    document.querySelectorAll('[data-cat]').forEach(function (x) {
      x.classList.toggle('active', x.getAttribute('data-cat') === key);
    });
    $('empty').classList.add('hidden');
    var p = $('settingsPanel');
    p.classList.remove('hidden');
    var fields = KEYS[key] || [{ id: 'logChannelId', label: 'Kanal', type: 'channel' }];
    var body = fields.map(renderField).join('');
    p.innerHTML =
      '<div class="settings-header"><div><span class="eyebrow">KATEGORIE</span><h2>' + esc(cat[2]) + '</h2><p>' + esc(cat[3]) + '</p></div>' +
      '<div class="settings-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnBackCat">← Kategorien</button>' +
      '<button type="button" class="btn btn-primary" id="btnSave">Speichern</button></div></div>' +
      '<article class="settings-card glass"><h3>Einstellungen</h3><p>Änderungen werden am Bot gespeichert (Live-Sync).</p>' + body + '</article>';

    p.querySelectorAll('[data-toggle]').forEach(function (t) {
      t.addEventListener('click', function () { t.classList.toggle('on'); });
    });
    var back = $('btnBackCat');
    if (back) back.onclick = function () {
      state.activeCat = null;
      p.classList.add('hidden');
      p.innerHTML = '';
      $('empty').classList.remove('hidden');
      document.querySelectorAll('[data-cat]').forEach(function (x) { x.classList.remove('active'); });
    };
    var save = $('btnSave');
    if (save) save.onclick = function () {
      var partial = collectSettings(p);
      save.disabled = true;
      S.patchSettings(state.guildId, partial).then(function () {
        Object.assign(state.settings, partial);
        toast('Gespeichert · Sync OK');
      }).catch(function (e) {
        toast(e.message || 'Speichern fehlgeschlagen');
      }).then(function () { save.disabled = false; });
    };
    p.querySelectorAll('[data-panel]').forEach(function (btn) {
      btn.onclick = function () {
        var chKey = btn.getAttribute('data-chkey');
        var sel = p.querySelector('[data-key="' + chKey + '"]');
        var ch = sel ? sel.value : '';
        if (!ch) { toast('Zuerst Kanal wählen und speichern'); return; }
        S.sendPanel(state.guildId, btn.getAttribute('data-panel'), ch)
          .then(function () { toast('Panel gesendet'); })
          .catch(function (e) { toast(e.message || 'Panel fehlgeschlagen'); });
      };
    });
    var st = $('btnLoadStats');
    if (st) st.onclick = function () {
      S.teamStats(state.guildId, 7).then(function (data) {
        var s = data.summary || data || {};
        $('statsOut').innerHTML =
          '<div class="grid mini-stats">' +
          '<div class="card glass"><small>Aktionen</small><strong>' + esc(s.totalActions != null ? s.totalActions : '—') + '</strong></div>' +
          '<div class="card glass"><small>Offene Tickets</small><strong>' + esc(s.openTickets != null ? s.openTickets : '—') + '</strong></div>' +
          '<div class="card glass"><small>Aktive Staff</small><strong>' + esc(s.staffActive != null ? s.staffActive : '—') + '</strong></div>' +
          '</div>';
      }).catch(function (e) { toast(e.message); });
    };
    p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function buildCats() {
    var nav = $('categories');
    var list = $('categoryList');
    var htmlNav = C.map(function (c) {
      return '<button type="button" class="nav-link" data-cat="' + c[0] + '"><span>' + c[1] + '</span><span>' + c[2] + '</span><span class="arrow">›</span></button>';
    }).join('');
    var htmlList = C.map(function (c) {
      return '<button type="button" class="category-item" data-cat="' + c[0] + '"><span>' + c[1] + ' ' + c[2] + '</span></button>';
    }).join('');
    if (nav) nav.innerHTML = htmlNav;
    if (list) list.innerHTML = htmlList;
    if ($('catCount')) $('catCount').textContent = String(C.length);
    document.querySelectorAll('[data-cat]').forEach(function (btn) {
      btn.addEventListener('click', function () { renderCat(btn.getAttribute('data-cat')); });
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
        '<span class="server-icon">S</span><span class="grow"><b>' + esc(g.name) + '</b>' +
        '<small>' + esc(g.memberCount != null ? g.memberCount + ' Mitglieder' : 'Discord Server') + '</small></span></button>';
    }).join('') || '<p style="color:#9298a8;padding:12px">Keine Server</p>';
    box.querySelectorAll('[data-id]').forEach(function (btn) {
      btn.onclick = function () { selectGuild(btn.getAttribute('data-id')); };
    });
  }

  function selectGuild(id) {
    state.guildId = id;
    try { localStorage.setItem('staffora_guild', id); } catch (e) {}
    var g = state.guilds.find(function (x) { return String(x.id) === String(id); });
    $('serverName').textContent = g ? g.name : id;
    $('serverMeta').textContent = 'Verbunden · Live-Sync';
    $('serverHint').textContent = (g ? g.name : id) + ' · Kategorie wählen für Settings';
    $('serverPicker').classList.remove('open');
    $('dashMain').style.display = '';
    toast('Server: ' + (g ? g.name : id));
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
      if ($('modCount')) $('modCount').textContent = 'OK';
      // reset category view
      state.activeCat = null;
      $('settingsPanel').classList.add('hidden');
      $('settingsPanel').innerHTML = '';
      $('empty').classList.remove('hidden');
    }).catch(function (e) { toast(e.message || 'Config-Fehler'); });
  }

  function boot() {
    buildCats();
    S.readToken();
    $('btnLogin').onclick = function () { S.login(location.origin + '/dashboard/'); };
    $('serverButton').onclick = function () {
      $('serverPicker').classList.add('open');
      paintServers($('serverSearch').value);
    };
    $('serverSearch').oninput = function () { paintServers($('serverSearch').value); };
    $('logoutBtn').onclick = function () {
      S.logout();
      location.href = '/dashboard/';
    };
    var gs = $('globalSearch');
    if (gs) gs.oninput = function () {
      var q = gs.value.toLowerCase();
      document.querySelectorAll('#categoryList [data-cat], #categories [data-cat]').forEach(function (x) {
        x.style.display = x.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
      });
    };

    if (!S.getToken()) {
      $('loginGate').style.display = '';
      return;
    }
    $('loginGate').style.display = 'none';
    $('appShell').style.display = '';

    S.me().then(function (u) {
      state.me = u.user || u;
      var name = state.me.username || state.me.global_name || 'User';
      $('userName').textContent = name;
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
      $('loginGate').style.display = '';
      $('appShell').style.display = 'none';
      $('loginErr').textContent = e.message || 'Session abgelaufen';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
