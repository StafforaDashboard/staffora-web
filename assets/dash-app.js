/**
 * Staffora Dashboard — 3D UI, hub-first categories, full settings
 */
(function () {
  'use strict';

  var API = String(window.STAFFORA_API || 'https://staffora.apps.bot-hosting.cloud').replace(/\/$/, '');
  var token = '';
  var me = null;
  var guilds = [];
  var guildId = '';
  var settings = {};
  var modules = {};
  var roles = [];
  var channels = [];
  var view = 'hub';
  var activeCat = null;

  var CATS = [
    { id: 'allgemein', ic: '⚙️', l: 'Allgemein', d: 'Sprache, Log, Auto-Rollen' },
    { id: 'modules', ic: '🧩', l: 'Module', d: 'Module an / aus' },
    { id: 'perms', ic: '🔐', l: 'Rollen & Rechte', d: 'Admin, Staff, IC-Zugriff' },
    { id: 'tickets', ic: '🎫', l: 'Tickets & Support', d: 'Tickets, Warteraum, Admin Call, Büros' },
    { id: 'apps', ic: '📝', l: 'Bewerbungen', d: 'Fragen, Panel, Log' },
    { id: 'team', ic: '👥', l: 'Team', d: 'Liste, Duty, Feedback, Abmeldung' },
    { id: 'schicht', ic: '⏱️', l: 'Schicht & Clock', d: 'Clock-In / Out' },
    { id: 'aufgaben', ic: '📋', l: 'Aufgaben', d: 'Board & Panel' },
    { id: 'database', ic: '🗄️', l: 'Database', d: 'Suchen, Add, Remove' },
    { id: 'haus', ic: '🏠', l: 'Haus & Fraktionen', d: 'Fraks, Hausliste' },
    { id: 'mod', ic: '🛡️', l: 'Moderation', d: 'Log & Command-Rechte' },
    { id: 'automod', ic: '🤖', l: 'AutoMod', d: 'Filter & Spam' },
    { id: 'cases', ic: '⚖️', l: 'Strafregister', d: 'Gründe & Stufen' },
    { id: 'stats', ic: '📊', l: 'Team-Stats', d: 'Tickets, Support, Staff' },
    { id: 'security', ic: '🔒', l: 'Security', d: 'Anti-Nuke / Anti-Raid' },
    { id: 'welcome', ic: '👋', l: 'Welcome / Leave', d: 'Begrüßung & Leave' },
    { id: 'verify', ic: '✓', l: 'Verify', d: 'Verify-Rollen' },
    { id: 'community', ic: '🤝', l: 'Community', d: 'Partner, Suggest, Boost' },
    { id: 'xp', ic: '⭐', l: 'XP', d: 'XP & Uprank' },
    { id: 'rp', ic: '🚀', l: 'RP', d: 'Start/Stop & Stats' },
    { id: 'logs', ic: '📜', l: 'Logs & Stats', d: 'Log-Kanäle' },
    { id: 'system', ic: '🔧', l: 'System', d: 'Basis-Optionen' }
  ];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function toast(msg, ok) {
    var t = $('toast');
    t.style.display = 'block';
    t.style.borderColor = ok === false ? 'rgba(251,113,133,.5)' : 'rgba(139,92,246,.35)';
    t.textContent = msg;
    clearTimeout(t._x);
    t._x = setTimeout(function () { t.style.display = 'none'; }, 3200);
  }

  function readToken() {
    try {
      var m = location.search.match(/[?&]token=([^&#]+)/);
      if (m) token = decodeURIComponent(m[1].replace(/\+/g, ' '));
    } catch (e) {}
    if (!token) try { token = localStorage.getItem('staffora_token') || ''; } catch (e) {}
    if (token) {
      try { localStorage.setItem('staffora_token', token); } catch (e) {}
      try {
        if (/[?&]token=/.test(location.search)) {
          history.replaceState({}, '', location.pathname);
        }
      } catch (e) {}
    }
    try { guildId = localStorage.getItem('staffora_guild') || ''; } catch (e) {}
    return token;
  }

  function api(path, opts) {
    opts = opts || {};
    var o = {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    };
    if (token) o.headers.Authorization = 'Bearer ' + token;
    if (opts.body) o.body = JSON.stringify(opts.body);
    return fetch(API + path, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || j.message || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  function goLogin() {
    var ret = encodeURIComponent(window.STAFFORA_RETURN || (location.origin + '/dashboard/'));
    location.href = API + '/auth/login?return=' + ret;
  }

  function chOptions(selected) {
    var html = '<option value="">— Kanal —</option>';
    (channels || []).forEach(function (c) {
      var id = String(c.id);
      html += '<option value="' + esc(id) + '"' + (String(selected) === id ? ' selected' : '') + '>' + esc((c.name ? '#' + c.name : id)) + '</option>';
    });
    return html;
  }
  function roleOptions(selected) {
    var sel = selected;
    if (!Array.isArray(sel)) sel = sel ? [sel] : [];
    var html = '<option value="">— Rolle —</option>';
    (roles || []).forEach(function (r) {
      var id = String(r.id);
      html += '<option value="' + esc(id) + '"' + (sel.map(String).indexOf(id) >= 0 ? ' selected' : '') + '>' + esc(r.name || id) + '</option>';
    });
    return html;
  }

  function loadDiscordMeta() {
    return api('/api/guilds/' + guildId + '/discord')
      .catch(function () { return {}; })
      .then(function (d) {
        roles = d.roles || [];
        channels = d.channels || [];
        if (!roles.length) {
          return api('/api/guilds/' + guildId + '/roles').then(function (j) { roles = j.roles || j || []; }).catch(function () {});
        }
      })
      .then(function () {
        if (!channels.length) {
          return api('/api/guilds/' + guildId + '/channels').then(function (j) { channels = j.channels || j || []; }).catch(function () {});
        }
      });
  }

  function loadConfig() {
    return api('/api/guilds/' + guildId + '/config')
      .catch(function () { return api('/api/guilds/' + guildId); })
      .then(function (j) {
        settings = j.settings || j.config || {};
        modules = j.modules || settings.modules || {};
      });
  }

  function saveSettings(partial) {
    return api('/api/guilds/' + guildId + '/config', {
      method: 'PATCH',
      body: { settings: partial }
    }).then(function (j) {
      if (j.settings) Object.assign(settings, j.settings);
      else Object.assign(settings, partial);
      toast('Gespeichert', true);
    }).catch(function (e) { toast(e.message, false); });
  }

  function sendPanel(type, channelId) {
    if (!channelId) { toast('Kanal wählen', false); return Promise.resolve(); }
    return api('/api/guilds/' + guildId + '/panels/send', {
      method: 'POST',
      body: { type: type, channelId: channelId }
    }).then(function () { toast('Panel gesendet', true); })
      .catch(function (e) { toast(e.message, false); });
  }

  /* —— Views —— */
  function showGate(v) { $('gate').classList.toggle('hidden', !v); }
  function showPicker(v) { $('picker').classList.toggle('hidden', !v); }
  function showApp(v) { $('app').classList.toggle('hidden', !v); }

  function paintServerList(filter) {
    var q = (filter || '').toLowerCase();
    var box = $('srv-list');
    var items = guilds.filter(function (g) {
      return !q || String(g.name || '').toLowerCase().indexOf(q) >= 0;
    });
    box.innerHTML = items.map(function (g) {
      return '<button type="button" data-gid="' + esc(g.id) + '"><strong>' + esc(g.name) + '</strong></button>';
    }).join('') || '<p style="color:#9298a8">Keine Server</p>';
    box.querySelectorAll('[data-gid]').forEach(function (btn) {
      btn.onclick = function () { selectGuild(btn.getAttribute('data-gid')); };
    });
  }

  function selectGuild(id) {
    guildId = id;
    try { localStorage.setItem('staffora_guild', id); } catch (e) {}
    var g = guilds.find(function (x) { return String(x.id) === String(id); });
    $('srv-name').textContent = g ? g.name : id;
    $('top-eye').textContent = 'Server Control · ' + (g ? g.name : id);
    showPicker(false);
    showApp(true);
    view = 'hub';
    activeCat = null;
    try { sessionStorage.setItem('staffora_view', 'hub'); sessionStorage.removeItem('staffora_cat'); } catch (e0) {}
    Promise.all([loadConfig(), loadDiscordMeta()]).then(function () {
      render();
      toast('Server geladen', true);
    }).catch(function (e) { toast(e.message, false); render(); });
  }

  function renderHub() {
    $('top-title').textContent = 'Kategorie wählen';
    $('top-eye').textContent = 'Schritt 2 von 3 · Settings erst nach Auswahl';
    var html = '';
    html += '<div class="glass" style="padding:22px 24px;margin-bottom:22px">';
    html += '<div class="eyebrow">Übersicht</div>';
    html += '<h2 style="margin:0 0 8px;font:700 22px Space Grotesk,sans-serif">Wähle eine Kategorie</h2>';
    html += '<p style="color:#9298a8;margin:0;line-height:1.55;font-size:14px">Die Einstellungen öffnen sich auf der <b style="color:#e2e8f0">nächsten Seite</b>. Ohne Kategorie siehst du keine Settings.</p>';
    html += '</div>';
    html += '<div class="hub-grid">';
    CATS.forEach(function (c) {
      html += '<button type="button" class="hub-card" data-cat="' + c.id + '">' +
        '<div class="ic">' + c.ic + '</div><h3>' + esc(c.l) + '</h3><p>' + esc(c.d) + '</p></button>';
    });
    html += '</div>';
    $('view').innerHTML = html;
    $('view').querySelectorAll('[data-cat]').forEach(function (b) {
      b.onclick = function () {
        activeCat = b.getAttribute('data-cat');
        view = 'cat';
        try { sessionStorage.setItem('staffora_view', 'cat'); sessionStorage.setItem('staffora_cat', activeCat); } catch (e) {}
        render();
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e2) { window.scrollTo(0, 0); }
      };
    });
  }

  function backBar() {
    return '<button type="button" class="btn btn-back" id="btn-back">← Kategorien</button>';
  }

  function fieldSelect(id, label, optionsHtml) {
    return '<div class="field"><label>' + esc(label) + '</label><select id="' + id + '">' + optionsHtml + '</select></div>';
  }

  function renderCat() {
    var cat = CATS.find(function (c) { return c.id === activeCat; }) || { l: activeCat, ic: '' };
    $('top-title').textContent = cat.ic + ' ' + cat.l;
    var s = settings || {};
    var html = backBar();

    if (activeCat === 'allgemein') {
      html += '<div class="set-card glass"><h3>Sprache</h3><p class="hint">Dashboard und Bot-Texte wo möglich</p>' +
        fieldSelect('f-lang', 'Sprache', '<option value="de"' + (s.language !== 'en' ? ' selected' : '') + '>Deutsch</option><option value="en"' + (s.language === 'en' ? ' selected' : '') + '>English</option>') +
        '<button type="button" class="btn btn-p" id="save-lang">Speichern</button></div>';
      html += '<div class="set-card glass"><h3>System</h3><p class="hint">Name und Haupt-Log</p>' +
        '<div class="field"><label>System-Name</label><input id="f-name" value="' + esc(s.systemName || s.botName || 'Staffora') + '"></div>' +
        fieldSelect('f-log', 'Log-Kanal', chOptions(s.logChannelId)) +
        '<button type="button" class="btn btn-p" id="save-sys">Speichern</button></div>';
    } else if (activeCat === 'modules') {
      var mods = [
        ['tickets', 'Tickets'], ['warteraumSupport', 'Warteraum'], ['adminCalls', 'Admin Call'],
        ['dutyPanel', 'Duty'], ['bewerbungen', 'Bewerbungen'], ['security', 'Security'],
        ['automod', 'AutoMod'], ['xp', 'XP'], ['verify', 'Verify']
      ];
      html += '<div class="set-card glass"><h3>Module</h3><p class="hint">An = aktiv, Aus = deaktiviert</p>';
      mods.forEach(function (m) {
        var on = modules[m[0]] !== false && s['module_' + m[0]] !== false;
        html += '<div class="toggle-row"><span>' + m[1] + '</span><div class="toggle' + (on ? ' on' : '') + '" data-mod="' + m[0] + '"><i></i></div></div>';
      });
      html += '<button type="button" class="btn btn-p" id="save-mods" style="margin-top:12px">Speichern</button></div>';
    } else if (activeCat === 'perms') {
      html += '<div class="set-card glass"><h3>Rollen</h3><p class="hint">Wer darf was</p>' +
        fieldSelect('f-admin', 'Dashboard / Admin', roleOptions(s.adminRoleIds || s.adminRoleId)) +
        fieldSelect('f-staff', 'Staff', roleOptions(s.staffRoleIds || s.staffRoleId)) +
        fieldSelect('f-ic', 'IC Panel Zugriff', roleOptions(s.ingamePanelAccessRoleIds)) +
        '<button type="button" class="btn btn-p" id="save-perms">Speichern</button></div>';
    } else if (activeCat === 'tickets') {
      html += '<div class="set-card glass"><h3>Ticket-Panel</h3><p class="hint">Kanal für das Ticket-Panel</p>' +
        fieldSelect('f-tp', 'Panel-Kanal', chOptions(s.ticketPanelChannelId)) +
        fieldSelect('f-tl', 'Ticket-Log', chOptions(s.ticketLogChannelId)) +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-p" id="save-tick">Speichern</button>' +
        '<button type="button" class="btn" id="send-tick">Panel senden</button></div></div>';
      html += '<div class="set-card glass"><h3>Warteraum</h3>' +
        fieldSelect('f-wv', 'Warteraum Voice', chOptions(s.warteraumChannelId)) +
        fieldSelect('f-wt', 'Support Text', chOptions(s.warteraumTextChannelId)) +
        '<button type="button" class="btn btn-p" id="save-wart">Speichern</button></div>';
      html += '<div class="set-card glass"><h3>Admin Call</h3>' +
        fieldSelect('f-ac', 'Panel-Kanal', chOptions(s.adminCallPanelChannelId)) +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-p" id="save-ac">Speichern</button>' +
        '<button type="button" class="btn" id="send-ac">Panel senden</button></div></div>';
    } else if (activeCat === 'apps') {
      html += '<div class="set-card glass"><h3>Bewerbungen</h3>' +
        fieldSelect('f-app-ch', 'Panel-Kanal', chOptions(s.applicationPanelChannelId || s.bewerbungChannelId)) +
        fieldSelect('f-app-log', 'Log-Kanal', chOptions(s.applicationLogChannelId)) +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-p" id="save-app">Speichern</button>' +
        '<button type="button" class="btn" id="send-app">Panel senden</button></div></div>';
    } else if (activeCat === 'team') {
      html += '<div class="set-card glass"><h3>Teamliste & Duty</h3>' +
        fieldSelect('f-teamlist', 'Teamliste-Kanal', chOptions(s.teamlistChannelId)) +
        fieldSelect('f-duty', 'Duty-Panel-Kanal', chOptions(s.dutyPanelChannelId)) +
        fieldSelect('f-duty-role', 'Duty-Rolle', roleOptions(s.dutyRoleIds || s.dutyRoleId)) +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="btn btn-p" id="save-team">Speichern</button>' +
        '<button type="button" class="btn" id="send-teamlist">Teamliste senden</button>' +
        '<button type="button" class="btn" id="send-duty">Duty-Panel senden</button></div></div>';
      html += '<div class="set-card glass"><h3>Feedback & Abmeldung</h3>' +
        fieldSelect('f-fb', 'Feedback-Log', chOptions(s.feedbackLogChannelId)) +
        fieldSelect('f-ab', 'Abmeldung-Panel', chOptions(s.abmeldenPanelChannelId)) +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-p" id="save-fb">Speichern</button>' +
        '<button type="button" class="btn" id="send-ab">Abmelde-Panel senden</button></div></div>';
    } else if (activeCat === 'schicht') {
      html += '<div class="set-card glass"><h3>Clock</h3><p class="hint">Schichtzeiten tracken</p>' +
        '<div class="toggle-row"><span>Clock aktiv</span><div class="toggle' + (s.clockEnabled !== false ? ' on' : '') + '" id="tg-clock"><i></i></div></div>' +
        '<button type="button" class="btn btn-p" id="save-clock">Speichern</button></div>';
    } else if (activeCat === 'aufgaben') {
      html += '<div class="set-card glass"><h3>Aufgaben</h3>' +
        fieldSelect('f-task', 'Panel-Kanal', chOptions(s.aufgabenPanelChannelId)) +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-p" id="save-task">Speichern</button>' +
        '<button type="button" class="btn" id="send-task">Panel senden</button></div></div>';
    } else if (activeCat === 'database') {
      html += '<div class="set-card glass"><h3>Database Panel</h3><p class="hint">Suchen / Hinzufügen / Entfernen nur über Panel</p>' +
        fieldSelect('f-db', 'Panel-Kanal', chOptions(s.databasePanelChannelId)) +
        fieldSelect('f-db-role', 'Manager-Rolle', roleOptions(s.databaseManagerRoleIds)) +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-p" id="save-db">Speichern</button>' +
        '<button type="button" class="btn" id="send-db">Panel senden</button></div></div>';
    } else if (activeCat === 'haus') {
      html += '<div class="set-card glass"><h3>Fraktionen & Häuser</h3>' +
        fieldSelect('f-frak', 'Announce-Kanal', chOptions(s.factionAnnounceChannelId)) +
        fieldSelect('f-haus', 'Hausliste-Kanal', chOptions(s.hauslisteChannelId)) +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-p" id="save-haus">Speichern</button>' +
        '<button type="button" class="btn" id="send-haus">Hausliste senden</button></div></div>';
    } else if (activeCat === 'mod') {
      html += '<div class="set-card glass"><h3>Moderation</h3>' +
        fieldSelect('f-modlog', 'Mod-Log', chOptions(s.modLogChannelId)) +
        '<button type="button" class="btn btn-p" id="save-mod">Speichern</button></div>';
    } else if (activeCat === 'automod') {
      html += '<div class="set-card glass"><h3>AutoMod</h3>' +
        '<div class="toggle-row"><span>Links blocken</span><div class="toggle' + (s.automodBlockLinks ? ' on' : '') + '" data-k="automodBlockLinks"><i></i></div></div>' +
        '<div class="toggle-row"><span>Invites blocken</span><div class="toggle' + (s.automodBlockInvites ? ' on' : '') + '" data-k="automodBlockInvites"><i></i></div></div>' +
        fieldSelect('f-amlog', 'Log-Kanal', chOptions(s.automodLogChannelId)) +
        '<button type="button" class="btn btn-p" id="save-am">Speichern</button></div>';
    } else if (activeCat === 'cases') {
      html += '<div class="set-card glass"><h3>Strafregister</h3><p class="hint">Gründe werden im Bot / über erweiterte API gepflegt. Hier Log-Kanal.</p>' +
        fieldSelect('f-cases', 'Log-Kanal', chOptions(s.caseLogChannelId || s.modLogChannelId)) +
        '<button type="button" class="btn btn-p" id="save-cases">Speichern</button></div>';
    } else if (activeCat === 'stats') {
      html += '<div class="set-card glass"><h3>Team-Stats</h3>' +
        fieldSelect('f-days', 'Zeitraum', '<option value="7">7 Tage</option><option value="14">14 Tage</option><option value="30">30 Tage</option>') +
        '<button type="button" class="btn btn-p" id="load-stats">Laden</button>' +
        '<div id="stats-box" style="margin-top:14px;color:#aeb3c2"></div></div>';
    } else if (activeCat === 'security') {
      html += '<div class="set-card glass"><h3>Security</h3>' +
        '<div class="toggle-row"><span>Anti-Nuke</span><div class="toggle' + (s.securityAntiNuke ? ' on' : '') + '" data-k="securityAntiNuke"><i></i></div></div>' +
        '<div class="toggle-row"><span>Anti-Raid</span><div class="toggle' + (s.securityAntiRaid ? ' on' : '') + '" data-k="securityAntiRaid"><i></i></div></div>' +
        fieldSelect('f-seclog', 'Security-Log', chOptions(s.securityLogChannelId)) +
        '<button type="button" class="btn btn-p" id="save-sec">Speichern</button></div>';
    } else if (activeCat === 'welcome') {
      html += '<div class="set-card glass"><h3>Welcome / Leave</h3>' +
        fieldSelect('f-wel', 'Welcome-Kanal', chOptions(s.welcomeChannelId)) +
        fieldSelect('f-leave', 'Leave-Kanal', chOptions(s.leaveChannelId)) +
        '<button type="button" class="btn btn-p" id="save-wel">Speichern</button></div>';
    } else if (activeCat === 'verify') {
      html += '<div class="set-card glass"><h3>Verify</h3>' +
        fieldSelect('f-ver', 'Verify-Kanal', chOptions(s.verifyChannelId)) +
        fieldSelect('f-verr', 'Verified-Rolle', roleOptions(s.verifyRoleIds || s.verifiedRoleId)) +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-p" id="save-ver">Speichern</button>' +
        '<button type="button" class="btn" id="send-ver">Panel senden</button></div></div>';
    } else if (activeCat === 'community') {
      html += '<div class="set-card glass"><h3>Community</h3>' +
        fieldSelect('f-partner', 'Partner-Kanal', chOptions(s.partnerChannelId)) +
        fieldSelect('f-boost', 'Boost-Kanal', chOptions(s.boostChannelId)) +
        '<button type="button" class="btn btn-p" id="save-com">Speichern</button></div>';
    } else if (activeCat === 'xp') {
      html += '<div class="set-card glass"><h3>XP</h3>' +
        '<div class="toggle-row"><span>XP aktiv</span><div class="toggle' + (s.xpEnabled !== false ? ' on' : '') + '" id="tg-xp"><i></i></div></div>' +
        '<button type="button" class="btn btn-p" id="save-xp">Speichern</button></div>';
    } else if (activeCat === 'rp') {
      html += '<div class="set-card glass"><h3>RP</h3>' +
        fieldSelect('f-rp', 'Announce-Kanal', chOptions(s.rpAnnounceChannelId)) +
        fieldSelect('f-stats', 'Server-Stats-Kanal', chOptions(s.serverStatsChannelId)) +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-p" id="save-rp">Speichern</button>' +
        '<button type="button" class="btn" id="send-stats">Stats-Panel senden</button></div></div>';
    } else if (activeCat === 'logs') {
      html += '<div class="set-card glass"><h3>Logs</h3>' +
        fieldSelect('f-mainlog', 'System-Log', chOptions(s.logChannelId)) +
        fieldSelect('f-modlog2', 'Mod-Log', chOptions(s.modLogChannelId)) +
        '<button type="button" class="btn btn-p" id="save-logs">Speichern</button></div>';
    } else {
      html += '<div class="set-card glass"><h3>' + esc(cat.l) + '</h3><p class="hint">Einstellungen speichern</p>' +
        fieldSelect('f-gen', 'Haupt-Kanal', chOptions(s.logChannelId)) +
        '<button type="button" class="btn btn-p" id="save-gen">Speichern</button></div>';
    }

    $('view').innerHTML = html;
    wireCatButtons();
  }

  function val(id) { var el = $(id); return el ? el.value : ''; }
  function isOn(el) { return el && el.classList.contains('on'); }

  function wireCatButtons() {
    var b = $('btn-back');
    if (b) b.onclick = function () { view = 'hub'; activeCat = null; try { sessionStorage.setItem('staffora_view','hub'); sessionStorage.removeItem('staffora_cat'); } catch(e){} render(); try { window.scrollTo(0,0); } catch(e2){} };

    document.querySelectorAll('.toggle').forEach(function (tg) {
      tg.onclick = function () { tg.classList.toggle('on'); };
    });

    function bind(id, fn) { var el = $(id); if (el) el.onclick = fn; }

    bind('save-lang', function () { saveSettings({ language: val('f-lang') }); });
    bind('save-sys', function () { saveSettings({ systemName: val('f-name'), logChannelId: val('f-log') || null }); });
    bind('save-mods', function () {
      var body = {};
      document.querySelectorAll('[data-mod]').forEach(function (tg) {
        body['module_' + tg.getAttribute('data-mod')] = isOn(tg);
      });
      saveSettings(body);
    });
    bind('save-perms', function () {
      saveSettings({
        adminRoleIds: val('f-admin') ? [val('f-admin')] : [],
        staffRoleIds: val('f-staff') ? [val('f-staff')] : [],
        ingamePanelAccessRoleIds: val('f-ic') ? [val('f-ic')] : []
      });
    });
    bind('save-tick', function () {
      saveSettings({ ticketPanelChannelId: val('f-tp') || null, ticketLogChannelId: val('f-tl') || null });
    });
    bind('send-tick', function () { sendPanel('ticket', val('f-tp')); });
    bind('save-wart', function () {
      saveSettings({ warteraumChannelId: val('f-wv') || null, warteraumTextChannelId: val('f-wt') || null });
    });
    bind('save-ac', function () { saveSettings({ adminCallPanelChannelId: val('f-ac') || null }); });
    bind('send-ac', function () { sendPanel('admincall', val('f-ac')); });
    bind('save-app', function () {
      saveSettings({ applicationPanelChannelId: val('f-app-ch') || null, applicationLogChannelId: val('f-app-log') || null });
    });
    bind('send-app', function () { sendPanel('bewerbung', val('f-app-ch')); });
    bind('save-team', function () {
      saveSettings({
        teamlistChannelId: val('f-teamlist') || null,
        dutyPanelChannelId: val('f-duty') || null,
        dutyRoleIds: val('f-duty-role') ? [val('f-duty-role')] : []
      });
    });
    bind('send-teamlist', function () { sendPanel('teamlist', val('f-teamlist')); });
    bind('send-duty', function () { sendPanel('duty', val('f-duty')); });
    bind('save-fb', function () {
      saveSettings({ feedbackLogChannelId: val('f-fb') || null, abmeldenPanelChannelId: val('f-ab') || null });
    });
    bind('send-ab', function () { sendPanel('abmelden', val('f-ab')); });
    bind('save-clock', function () {
      var tg = $('tg-clock');
      saveSettings({ clockEnabled: isOn(tg) });
    });
    bind('save-task', function () { saveSettings({ aufgabenPanelChannelId: val('f-task') || null }); });
    bind('send-task', function () {
      api('/api/guilds/' + guildId + '/tasks/panel', { method: 'POST', body: {} })
        .then(function () { toast('Panel gesendet', true); })
        .catch(function (e) { sendPanel('tasks', val('f-task')); });
    });
    bind('save-db', function () {
      saveSettings({
        databasePanelChannelId: val('f-db') || null,
        databaseManagerRoleIds: val('f-db-role') ? [val('f-db-role')] : []
      });
    });
    bind('send-db', function () { sendPanel('database', val('f-db')); });
    bind('save-haus', function () {
      saveSettings({ factionAnnounceChannelId: val('f-frak') || null, hauslisteChannelId: val('f-haus') || null });
    });
    bind('send-haus', function () { sendPanel('hausliste', val('f-haus')); });
    bind('save-mod', function () { saveSettings({ modLogChannelId: val('f-modlog') || null }); });
    bind('save-am', function () {
      var body = { automodLogChannelId: val('f-amlog') || null };
      document.querySelectorAll('[data-k]').forEach(function (tg) {
        body[tg.getAttribute('data-k')] = isOn(tg);
      });
      saveSettings(body);
    });
    bind('save-cases', function () { saveSettings({ caseLogChannelId: val('f-cases') || null }); });
    bind('load-stats', function () {
      var days = val('f-days') || 7;
      api('/api/guilds/' + guildId + '/team-stats?days=' + days)
        .then(function (data) {
          var s = data.summary || {};
          $('stats-box').innerHTML =
            '<div class="row-2">' +
            '<div class="glass" style="padding:14px"><small>Aktionen</small><div style="font-size:22px;font-weight:700">' + (s.totalActions != null ? s.totalActions : '—') + '</div></div>' +
            '<div class="glass" style="padding:14px"><small>Offene Tickets</small><div style="font-size:22px;font-weight:700">' + (s.openTickets != null ? s.openTickets : '—') + '</div></div>' +
            '<div class="glass" style="padding:14px"><small>Aktive Staff</small><div style="font-size:22px;font-weight:700">' + (s.staffActive != null ? s.staffActive : '—') + '</div></div>' +
            '</div>';
        })
        .catch(function (e) { toast(e.message, false); });
    });
    bind('save-sec', function () {
      var body = { securityLogChannelId: val('f-seclog') || null };
      document.querySelectorAll('[data-k]').forEach(function (tg) {
        body[tg.getAttribute('data-k')] = isOn(tg);
      });
      saveSettings(body);
    });
    bind('save-wel', function () {
      saveSettings({ welcomeChannelId: val('f-wel') || null, leaveChannelId: val('f-leave') || null });
    });
    bind('save-ver', function () {
      saveSettings({
        verifyChannelId: val('f-ver') || null,
        verifyRoleIds: val('f-verr') ? [val('f-verr')] : []
      });
    });
    bind('send-ver', function () { sendPanel('verify', val('f-ver')); });
    bind('save-com', function () {
      saveSettings({ partnerChannelId: val('f-partner') || null, boostChannelId: val('f-boost') || null });
    });
    bind('save-xp', function () { saveSettings({ xpEnabled: isOn($('tg-xp')) }); });
    bind('save-rp', function () {
      saveSettings({ rpAnnounceChannelId: val('f-rp') || null, serverStatsChannelId: val('f-stats') || null });
    });
    bind('send-stats', function () { sendPanel('serverstats', val('f-stats')); });
    bind('save-logs', function () {
      saveSettings({ logChannelId: val('f-mainlog') || null, modLogChannelId: val('f-modlog2') || null });
    });
    bind('save-gen', function () { saveSettings({ logChannelId: val('f-gen') || null }); });
  }

  function render() {
    document.body.classList.remove('page-hub', 'page-cat', 'page-pick');
    if (view === 'hub' || !activeCat) {
      document.body.classList.add('page-hub');
      renderHub();
    } else {
      document.body.classList.add('page-cat');
      renderCat();
    }
  }

  function particles() {
    var canvas = document.getElementById('bg');
    if (!canvas || !canvas.getContext) return;
    var c = canvas.getContext('2d'), w, h, pts = [];
    function resize() {
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      c.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      w = innerWidth; h = innerHeight;
    }
    function init() {
      pts = [];
      for (var i = 0; i < 50; i++) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), r: Math.random() * 1.5 + 0.3, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });
      }
    }
    function draw() {
      c.clearRect(0, 0, w, h);
      pts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = 'rgba(167,139,250,' + (0.12 + p.z * 0.2) + ')';
        c.fill();
      });
      requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    addEventListener('resize', function () { resize(); init(); });
  }

  function boot() {
    particles();
    $('btn-login').onclick = goLogin;
    $('srv-card').onclick = function () {
      if (guilds.length) { showPicker(true); paintServerList($('srv-search').value); }
    };
    $('srv-search').oninput = function () { paintServerList($('srv-search').value); };
    $('side-nav').onclick = function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      if (btn.getAttribute('data-view') === 'hub') {
        view = 'hub'; activeCat = null; render();
      }
    };

    readToken();
    if (!token) { showGate(true); return; }
    showGate(false);

    api('/api/me').catch(function () { return api('/api/auth/me'); }).then(function (u) {
      me = u.user || u;
      $('user-name').textContent = me.username || me.global_name || 'User';
      return api('/api/guilds');
    }).then(function (g) {
      guilds = g.guilds || g || [];
      if (!Array.isArray(guilds)) guilds = [];
      if (guildId && guilds.some(function (x) { return String(x.id) === String(guildId); })) {
        selectGuild(guildId);
      } else {
        showPicker(true);
        paintServerList('');
      }
    }).catch(function (e) {
      token = '';
      try { localStorage.removeItem('staffora_token'); } catch (err) {}
      showGate(true);
      $('login-err').textContent = e.message || 'Login fehlgeschlagen';
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
