/**
 * Staffora Blueprint — live API wiring
 * Works with main Staffora bot backend (OAuth + guild config + panels + stats)
 */
(function () {
  'use strict';

  var CLOUD = 'https://staffora.apps.bot-hosting.cloud';
  var host = (location.hostname || '').toLowerCase();
  var onCloud = host.indexOf('bot-hosting') >= 0 || host === 'localhost' || host === '127.0.0.1';
  var API = (window.STAFFORA_API != null && window.STAFFORA_API !== undefined)
    ? String(window.STAFFORA_API)
    : (onCloud ? '' : (localStorage.getItem('staffora_api') || CLOUD));
  API = String(API || CLOUD).replace(/\/$/, '');

  var token = '';
  var me = null;
  var guilds = [];
  var guildId = localStorage.getItem('staffora_guild') || '';
  var settings = {};
  var roles = [];
  var channels = [];
  var page = document.body && document.body.dataset ? document.body.dataset.page : '';

  function $(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function toast(msg, ok) {
    var el = $('staffora-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'staffora-toast';
      el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:12px 16px;border-radius:12px;background:#1a1a22;border:1px solid rgba(139,92,246,.35);color:#f4f4f8;font-size:13px;max-width:320px;box-shadow:0 12px 40px rgba(0,0,0,.45)';
      document.body.appendChild(el);
    }
    el.style.borderColor = ok === false ? 'rgba(248,113,113,.5)' : 'rgba(139,92,246,.35)';
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.hidden = true; }, 3200);
  }

  function readToken() {
    try {
      var m = location.search.match(/[?&]token=([^&#]+)/);
      if (m) token = decodeURIComponent(m[1].replace(/\+/g, ' '));
      if (!token && location.hash) {
        var hm = location.hash.match(/(?:^|#|&)token=([^&]+)/);
        if (hm) token = decodeURIComponent(hm[1]);
      }
    } catch (e) {}
    if (!token) try { token = localStorage.getItem('staffora_token') || ''; } catch (e) {}
    if (!token) try { token = sessionStorage.getItem('staffora_token') || ''; } catch (e) {}
    if (token) {
      try { localStorage.setItem('staffora_token', token); } catch (e) {}
      try { sessionStorage.setItem('staffora_token', token); } catch (e) {}
      // clean URL
      try {
        if (/[?&#]token=/.test(location.href)) {
          history.replaceState({}, '', location.pathname + location.search.replace(/[?&]token=[^&]+/, '').replace(/^&/, '?').replace(/\?$/, '') + location.hash.replace(/token=[^&]+&?/, ''));
        }
      } catch (e) {}
    }
    return token;
  }

  function headers(json) {
    var h = {};
    if (json) h['Content-Type'] = 'application/json';
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  function api(path, opts) {
    opts = opts || {};
    var url = API + path;
    var o = {
      method: opts.method || 'GET',
      headers: headers(!!opts.body),
      credentials: 'include'
    };
    if (opts.body) o.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    return fetch(url, o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || j.message || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  function goLogin() {
    var ret = encodeURIComponent(location.href.split('#')[0].split('?')[0]);
    var url = API + '/auth/login?return=' + ret;
    fetch(API + '/api/health', { method: 'GET', cache: 'no-store' })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; })
      .then(function (ok) {
        if (!ok) {
          toast('API nicht erreichbar: ' + API + ' — Bot starten / PUBLIC_URL prüfen', false);
          return;
        }
        location.href = url;
      });
  }

  /* —— UI helpers —— */
  function setText(sel, text) {
    qsa(sel).forEach(function (el) { el.textContent = text; });
  }

  function fillSelect(sel, items, value, placeholder) {
    if (!sel) return;
    items = items || [];
    var html = '<option value="">' + esc(placeholder || '—') + '</option>';
    items.forEach(function (it) {
      var id = String(it.id || it.value || '');
      var name = it.name || it.label || id;
      html += '<option value="' + esc(id) + '"' + (String(value) === id ? ' selected' : '') + '>' + esc(name) + '</option>';
    });
    sel.innerHTML = html;
  }

  function roleItems() {
    return (roles || []).map(function (r) {
      return { id: r.id, name: r.name || r.id };
    });
  }
  function channelItems(kind) {
    return (channels || []).filter(function (c) {
      if (!kind) return true;
      if (kind === 'text') return !c.type || c.type === 0 || c.type === 'GUILD_TEXT' || c.type === 'text';
      if (kind === 'voice') return c.type === 2 || c.type === 'GUILD_VOICE' || c.type === 'voice';
      return true;
    }).map(function (c) {
      return { id: c.id, name: (c.name ? '#' + c.name : c.id) };
    });
  }

  function patchSettings(partial) {
    if (!guildId) return Promise.reject(new Error('Kein Server gewählt'));
    return api('/api/guilds/' + guildId + '/config', {
      method: 'PATCH',
      body: { settings: partial }
    }).then(function (j) {
      if (j.settings) Object.assign(settings, j.settings);
      else Object.assign(settings, partial);
      toast('Gespeichert', true);
      return j;
    });
  }

  function sendPanel(type, channelId) {
    if (!guildId) return Promise.reject(new Error('Kein Server'));
    if (!channelId) return Promise.reject(new Error('Kanal wählen'));
    return api('/api/guilds/' + guildId + '/panels/send', {
      method: 'POST',
      body: { type: type, channelId: channelId }
    }).then(function () {
      toast('Panel gesendet', true);
    });
  }

  /* —— Auth gate + server select —— */
  function ensureChrome() {
    if ($('staffora-auth-gate') || page === 'public' || page === 'landing') return;

    var gate = document.createElement('div');
    gate.id = 'staffora-auth-gate';
    gate.innerHTML =
      '<div style="position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(5,5,8,.92);backdrop-filter:blur(12px)">' +
      '<div class="glass panel" style="max-width:400px;width:92%;padding:28px;text-align:center">' +
      '<div class="eyebrow">Staffora</div><h1 style="margin:8px 0 12px">Dashboard Login</h1>' +
      '<p style="color:#9298a8;margin-bottom:18px;line-height:1.5">Mit Discord anmelden, danach Server wählen.</p>' +
      '<button type="button" class="btn btn-primary" id="btn-login" style="width:100%">Mit Discord anmelden</button>' +
      '<p id="auth-err" style="color:#f87171;font-size:13px;margin-top:12px"></p>' +
      '</div></div>';
    document.body.appendChild(gate);
    $('btn-login').onclick = goLogin;

    var picker = document.createElement('div');
    picker.id = 'staffora-guild-picker';
    picker.hidden = true;
    picker.innerHTML =
      '<div style="position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(5,5,8,.92)">' +
      '<div class="glass panel" style="max-width:440px;width:92%;padding:28px">' +
      '<div class="eyebrow">Server</div><h1 style="margin:8px 0 12px">Server wählen</h1>' +
      '<p style="color:#9298a8;margin-bottom:14px;font-size:14px">Nur Server, auf denen der Bot ist und du Rechte hast.</p>' +
      '<div id="guild-list" style="display:flex;flex-direction:column;gap:8px;max-height:50vh;overflow:auto"></div>' +
      '</div></div>';
    document.body.appendChild(picker);
  }

  function showGate(show) {
    var g = $('staffora-auth-gate');
    if (g) g.style.display = show ? 'flex' : 'none';
  }
  function showPicker(show) {
    var g = $('staffora-guild-picker');
    if (!g) return;
    g.hidden = !show;
    g.style.display = show ? 'block' : 'none';
  }

  function renderGuildList() {
    var box = $('guild-list');
    if (!box) return;
    if (!guilds.length) {
      box.innerHTML = '<p style="color:#9298a8">Keine Server gefunden. Lade den Bot auf deinen Server ein.</p>';
      return;
    }
    box.innerHTML = guilds.map(function (g) {
      return '<button type="button" class="btn btn-ghost" data-gid="' + esc(g.id) + '" style="justify-content:space-between;width:100%">' +
        '<span>' + esc(g.name) + '</span><span style="color:#6b7280;font-size:11px">' + esc(g.id) + '</span></button>';
    }).join('');
    qsa('[data-gid]', box).forEach(function (btn) {
      btn.onclick = function () {
        guildId = btn.getAttribute('data-gid');
        localStorage.setItem('staffora_guild', guildId);
        showPicker(false);
        bootGuild();
      };
    });
  }

  function updateServerChrome() {
    var g = guilds.find(function (x) { return String(x.id) === String(guildId); });
    var name = g ? g.name : (guildId || '—');
    var sc = qs('.server-card b');
    if (sc) sc.textContent = name + ' ▾';
    var eye = qs('.topbar .eyebrow');
    if (eye) eye.textContent = 'Server Control · ' + name;
    if (me) {
      var pill = qs('.user-pill span:nth-child(2)');
      if (pill) pill.textContent = me.username || me.global_name || 'User';
      var av = qs('.user-pill .avatar');
      if (av) av.textContent = (me.username || 'U').slice(0, 1).toUpperCase();
    }
    // overview cards
    var cards = qsa('.dash-main > .grid > .card strong');
    if (cards[0] && g && g.memberCount) cards[0].textContent = String(g.memberCount);
  }

  /* —— Bind settings from blueprint sections —— */
  function collectKnownFields() {
    // language
    var lang = qs('#allgemein select');
    if (lang) {
      lang.value = (settings.language === 'en') ? lang.options[1].value : lang.options[0].value;
      lang.onchange = function () {
        var v = lang.selectedIndex === 1 ? 'en' : 'de';
        patchSettings({ language: v }).catch(function (e) { toast(e.message, false); });
      };
    }
  }

  function wireSaveButtons() {
    qsa('[data-save], button.btn-primary').forEach(function (btn) {
      var label = (btn.textContent || '').toLowerCase();
      if (label.indexOf('speichern') >= 0 || btn.hasAttribute('data-save')) {
        btn.addEventListener('click', function (ev) {
          ev.preventDefault();
          // generic: mark success — section-specific handlers below override
          if (btn._wired) return;
          toast('Nutze die Modul-Buttons (Panel senden / Speichern in der Sektion)', true);
        });
      }
    });
  }

  function wirePanelButtons() {
    // Map button text → panel type
    var map = [
      { match: /ticket.*panel|panel senden/i, type: 'ticket', section: 'tickets' },
      { match: /admin.?call/i, type: 'admincall', section: 'tickets' },
      { match: /duty/i, type: 'duty', section: 'team' },
      { match: /teamliste|teamlist/i, type: 'teamlist', section: 'team' },
      { match: /feedback/i, type: 'feedback', section: 'team' },
      { match: /abmeld/i, type: 'abmelden', section: 'team' },
      { match: /database/i, type: 'database', section: 'database' },
      { match: /aufgaben|task/i, type: 'tasks', section: 'tasks' },
      { match: /hausliste|haus/i, type: 'hausliste', section: 'factions' },
      { match: /verify/i, type: 'verify', section: 'verify' },
      { match: /stats.?panel|server.?stats/i, type: 'serverstats', section: 'logs' },
      { match: /leaderboard/i, type: 'xpleaderboard', section: 'xp' }
    ];

    qsa('button').forEach(function (btn) {
      var t = (btn.textContent || '').trim();
      if (!/senden|panel/i.test(t) && !/starten|beenden/i.test(t)) return;
      map.forEach(function (m) {
        if (m.match.test(t)) {
          btn.onclick = function (ev) {
            ev.preventDefault();
            if (!guildId) { toast('Server wählen', false); return; }
            var ch = settings.ticketPanelChannelId || settings.dutyPanelChannelId ||
              settings.teamlistChannelId || settings.databasePanelChannelId ||
              settings.aufgabenPanelChannelId || settings.logChannelId;
            // prefer channel from nearest select if any
            var sec = btn.closest('section');
            var sel = sec && sec.querySelector('select[data-channel]');
            if (sel && sel.value) ch = sel.value;
            if (!ch) {
              toast('Bitte zuerst einen Panel-Kanal in den Settings speichern (oder data-channel Select)', false);
              return;
            }
            var type = m.type;
            if (type === 'tasks') {
              api('/api/guilds/' + guildId + '/tasks/panel', { method: 'POST', body: {} })
                .then(function () { toast('Aufgaben-Panel gesendet', true); })
                .catch(function (e) { toast(e.message, false); });
              return;
            }
            if (type === 'database') {
              api('/api/guilds/' + guildId + '/database/panel', { method: 'POST', body: { channelId: ch } })
                .then(function () { toast('Database-Panel gesendet', true); })
                .catch(function (e) {
                  sendPanel('database', ch).catch(function (e2) { toast(e2.message, false); });
                });
              return;
            }
            sendPanel(type, ch).catch(function (e) { toast(e.message, false); });
          };
        }
      });
      if (/activity|aktivitäts/i.test(t) && /start/i.test(t)) {
        btn.onclick = function (ev) {
          ev.preventDefault();
          api('/api/guilds/' + guildId + '/activity-check/start', { method: 'POST', body: {} })
            .then(function () { toast('Activity-Check gestartet', true); })
            .catch(function (e) { toast(e.message, false); });
        };
      }
    });
  }

  function injectChannelSelects() {
    // Add channel dropdowns next to "Kanal wählen" ghost buttons for real selection
    qsa('.setting-row').forEach(function (row) {
      var btn = row.querySelector('button.btn-ghost');
      var title = (row.querySelector('b') || {}).textContent || '';
      if (!btn) return;
      if (!/kanal|channel|rolle|role/i.test(title + ' ' + (btn.textContent || ''))) return;
      if (row.querySelector('select[data-live]')) return;
      var isRole = /rolle|role|zugriff|staff|manager|recht/i.test(title + btn.textContent);
      var sel = document.createElement('select');
      sel.className = 'select';
      sel.setAttribute('data-live', '1');
      if (isRole) sel.setAttribute('data-role', '1');
      else sel.setAttribute('data-channel', '1');
      sel.style.maxWidth = '220px';
      fillSelect(sel, isRole ? roleItems() : channelItems('text'), '', isRole ? 'Rolle…' : 'Kanal…');
      btn.parentNode.insertBefore(sel, btn);
      btn.textContent = 'Übernehmen';
      btn.onclick = function (ev) {
        ev.preventDefault();
        var key = guessSettingKey(title, isRole);
        if (!key) { toast('Setting-Key unbekannt für: ' + title, false); return; }
        var val = sel.value || null;
        var body = {};
        if (isRole && /rollen|roles|staff|access|manager/i.test(title)) {
          body[key] = val ? [val] : [];
        } else {
          body[key] = val;
        }
        patchSettings(body).catch(function (e) { toast(e.message, false); });
      };
    });
  }

  function guessSettingKey(title, isRole) {
    var t = title.toLowerCase();
    if (/ticket.*panel/.test(t)) return 'ticketPanelChannelId';
    if (/ticket.*log/.test(t)) return 'ticketLogChannelId';
    if (/warteraum.*voice|warteraum$/.test(t) && !isRole) return 'warteraumChannelId';
    if (/support.*text|support.?fall/.test(t)) return 'warteraumTextChannelId';
    if (/admin.?call.*log/.test(t)) return 'adminCallLogChannelId';
    if (/admin.?call/.test(t) && !isRole) return 'adminCallPanelChannelId';
    if (/duty/.test(t) && !isRole) return 'dutyPanelChannelId';
    if (/teamliste|teamlist/.test(t)) return 'teamlistChannelId';
    if (/feedback/.test(t) && !isRole) return 'feedbackLogChannelId';
    if (/abmeld/.test(t) && !isRole) return 'abmeldenPanelChannelId';
    if (/database/.test(t) && !isRole) return 'databasePanelChannelId';
    if (/aufgaben|task/.test(t) && !isRole) return 'aufgabenPanelChannelId';
    if (/mod.?log|moderation.*log/.test(t)) return 'modLogChannelId';
    if (/security.*log/.test(t)) return 'securityLogChannelId';
    if (/system.?log|main.?log/.test(t)) return 'logChannelId';
    if (/welcome/.test(t) && !isRole) return 'welcomeChannelId';
    if (/leave/.test(t) && !isRole) return 'leaveChannelId';
    if (/verify/.test(t) && !isRole) return 'verifyChannelId';
    if (/verify/.test(t) && isRole) return 'verifyRoleIds';
    if (/dashboard|admin/.test(t) && isRole) return 'adminRoleIds';
    if (/staff/.test(t) && isRole) return 'staffRoleIds';
    if (/ic.?panel|ingame/.test(t) && isRole) return 'ingamePanelAccessRoleIds';
    if (/database.*manager|manager/.test(t) && isRole) return 'databaseManagerRoleIds';
    if (/duty/.test(t) && isRole) return 'dutyRoleIds';
    if (/ping/.test(t) && isRole) return 'warteraumPingRoleIds';
    if (/support/.test(t) && isRole) return 'ticketSupportRoleIds';
    if (/stats/.test(t) && !isRole) return 'serverStatsChannelId';
    return null;
  }

  function loadTeamStats() {
    var sec = $('stats');
    if (!sec || !guildId) return;
    var daysSel = sec.querySelector('select');
    var days = 7;
    if (daysSel) {
      days = daysSel.selectedIndex === 1 ? 30 : 7;
      daysSel.onchange = function () { loadTeamStats(); };
    }
    api('/api/guilds/' + guildId + '/team-stats?days=' + days)
      .then(function (data) {
        var s = data.summary || {};
        var cards = sec.querySelectorAll('.grid .card strong');
        if (cards[0]) cards[0].textContent = s.totalActions != null ? s.totalActions : '—';
        if (cards[1]) cards[1].textContent = s.openTickets != null ? s.openTickets : '—';
        // try map admin calls / staff from timeline
        var tl = (data.timeline && data.timeline.series) || [];
        var tickets = 0, ac = 0, support = 0;
        tl.forEach(function (b) {
          tickets += b.tickets || 0;
          ac += b.adminCalls || 0;
          support += b.support || 0;
        });
        if (cards[1] && tickets) cards[1].textContent = String(tickets);
        if (cards[2]) cards[2].textContent = String(ac);
        if (cards[3]) cards[3].textContent = s.staffActive != null ? s.staffActive : '—';

        var bars = sec.querySelector('.bars');
        if (bars && tl.length) {
          var maxV = 1;
          tl.forEach(function (b) { maxV = Math.max(maxV, b.total || 0, b.tickets || 0); });
          bars.innerHTML = tl.map(function (b) {
            var h = Math.max(8, Math.round(((b.tickets || b.total || 0) / maxV) * 100));
            return '<i style="height:' + h + '%" title="' + esc(b.date) + ': ' + (b.tickets || 0) + ' Tickets"></i>';
          }).join('');
        }
      })
      .catch(function (e) {
        toast('Stats: ' + e.message, false);
      });
  }

  function wireTogglesModules() {
    qsa('#module .toggle, [data-toggle]').forEach(function (tg) {
      tg.addEventListener('click', function () {
        tg.classList.toggle('on');
      });
    });
  }

  function bootGuild() {
    showGate(false);
    showPicker(false);
    updateServerChrome();
    Promise.all([
      api('/api/guilds/' + guildId + '/config').catch(function () { return { settings: {} }; }),
      api('/api/guilds/' + guildId + '/discord').catch(function () {
        return api('/api/guilds/' + guildId + '/channels').catch(function () { return {}; });
      })
    ]).then(function (pack) {
      var cfg = pack[0] || {};
      settings = cfg.settings || settings || {};
      var disc = pack[1] || {};
      roles = disc.roles || roles || [];
      channels = disc.channels || channels || [];
      if (!roles.length && cfg.roles) roles = cfg.roles;
      if (!channels.length && cfg.channels) channels = cfg.channels;

      // fetch dedicated endpoints if needed
      return Promise.all([
        roles.length ? Promise.resolve() : api('/api/guilds/' + guildId + '/roles').then(function (j) { roles = j.roles || j || []; }).catch(function () {}),
        channels.length ? Promise.resolve() : api('/api/guilds/' + guildId + '/channels').then(function (j) { channels = j.channels || j || []; }).catch(function () {})
      ]);
    }).then(function () {
      collectKnownFields();
      injectChannelSelects();
      wirePanelButtons();
      wireSaveButtons();
      wireTogglesModules();
      loadTeamStats();
      toast('Server geladen', true);
    }).catch(function (e) {
      toast(e.message || 'Laden fehlgeschlagen', false);
    });
  }

  function bootDashboard() {
    ensureChrome();
    readToken();
    if (!token) {
      showGate(true);
      return;
    }
    api('/api/me').catch(function () { return api('/api/auth/me'); }).then(function (u) {
      me = u.user || u;
      return api('/api/guilds').catch(function () { return { guilds: [] }; });
    }).then(function (g) {
      guilds = g.guilds || g || [];
      if (!Array.isArray(guilds)) guilds = [];
      if (guildId && guilds.some(function (x) { return String(x.id) === String(guildId); })) {
        bootGuild();
      } else {
        showGate(false);
        showPicker(true);
        renderGuildList();
      }
    }).catch(function (e) {
      token = '';
      try { localStorage.removeItem('staffora_token'); } catch (err) {}
      showGate(true);
      var err = $('auth-err');
      if (err) err.textContent = e.message || 'Login fehlgeschlagen';
    });

    // server card click → re-pick
    var sc = qs('.server-card');
    if (sc) {
      sc.style.cursor = 'pointer';
      sc.addEventListener('click', function () {
        showPicker(true);
        renderGuildList();
      });
    }
  }

  /* —— IC Panel —— */
  function bootIc() {
    ensureChrome();
    page = 'ic';
    readToken();
    if (!token) { showGate(true); return; }
    api('/api/me').then(function (u) {
      me = u.user || u;
      return api('/api/guilds');
    }).then(function (g) {
      guilds = g.guilds || [];
      if (!guildId || !guilds.some(function (x) { return String(x.id) === String(guildId); })) {
        showPicker(true);
        renderGuildList();
        // override picker to boot IC
        var orig = bootGuild;
        bootGuild = function () {
          showPicker(false);
          updateServerChrome();
          wireIcActions();
        };
        return;
      }
      wireIcActions();
    }).catch(function () {
      showGate(true);
    });
  }

  function wireIcActions() {
    var lookupInput = qs('#lookup input, #lookup .input, section#lookup input');
    var lookupBtn = qs('#lookup button, section#lookup button');
    qsa('section#lookup button, section#mod button').forEach(function (btn) {
      var t = (btn.textContent || '').toLowerCase();
      if (/suchen|lookup|search/.test(t)) {
        btn.onclick = function (ev) {
          ev.preventDefault();
          var q = (qs('section#lookup input') || {}).value || '';
          if (!q) { toast('Roblox-Name oder ID eingeben', false); return; }
          api('/api/guilds/' + guildId + '/ingame/lookup?q=' + encodeURIComponent(q))
            .catch(function () {
              return api('/api/guilds/' + guildId + '/roblox/lookup', { method: 'POST', body: { query: q } });
            })
            .then(function (data) {
              toast('Lookup ok', true);
              var box = qs('section#lookup .notice') || qs('section#lookup');
              if (box) {
                var pre = document.createElement('pre');
                pre.style.cssText = 'margin-top:12px;font-size:12px;white-space:pre-wrap;color:#c4b5fd';
                pre.textContent = JSON.stringify(data.user || data.player || data, null, 2).slice(0, 1500);
                var old = box.querySelector('pre');
                if (old) old.remove();
                box.appendChild(pre);
              }
            })
            .catch(function (e) { toast(e.message, false); });
        };
      }
      if (/duty|dienst/.test(t)) {
        btn.onclick = function (ev) {
          ev.preventDefault();
          api('/api/guilds/' + guildId + '/duty/toggle', { method: 'POST', body: {} })
            .then(function (j) {
              toast(j.onDuty ? 'On Duty' : 'Off Duty', true);
            })
            .catch(function (e) { toast(e.message, false); });
        };
      }
    });
  }

  /* —— Ban Appeal —— */
  function bootAppeal() {
    page = 'public';
    var form = qs('form');
    if (!form) return;
    form.onsubmit = function (ev) {
      ev.preventDefault();
      var inputs = qsa('input, textarea', form);
      var roblox = (inputs[0] && inputs[0].value || '').trim();
      // prefer field labeled roblox - blueprint used Discord ID first; map first text as identifier
      var answers = [];
      inputs.forEach(function (inp, i) {
        if (i === 0) return;
        answers.push({ question: inp.previousElementSibling ? inp.previousElementSibling.textContent : 'q' + i, answer: inp.value });
      });
      if (!roblox) { toast('Roblox-Name / ID fehlt', false); return; }

      // need guild - optional query ?guild=
      var gid = new URLSearchParams(location.search).get('guild') || localStorage.getItem('staffora_guild') || '';
      var body = { roblox: roblox, username: roblox, answers: answers, guildId: gid };

      var url = API + '/api/public/unban-request';
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error || j.message || 'Fehler');
          return j;
        });
      }).then(function (j) {
        if (j.noBan || j.message && /keine ban/i.test(j.message)) {
          toast(j.message || 'Keine Bans auf diesem Konto registriert.', true);
        } else {
          toast('Antrag gesendet', true);
        }
        var sent = $('sent');
        if (sent) {
          sent.hidden = false;
          sent.textContent = j.message || 'Antrag übermittelt.';
        }
      }).catch(function (e) {
        toast(e.message, false);
      });
    };
  }

  /* —— Nav active state —— */
  function wireNav() {
    qsa('.dash-link').forEach(function (a) {
      a.addEventListener('click', function () {
        qsa('.dash-link').forEach(function (x) { x.classList.remove('active'); });
        a.classList.add('active');
      });
    });
  }

  /* —— Particle bg from original (safe) —— */
  function particles() {
    var canvas = document.getElementById('bg');
    if (!canvas || !canvas.getContext) return;
    var c = canvas.getContext('2d');
    var w, h, pts = [];
    function resize() {
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      c.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      w = innerWidth; h = innerHeight;
    }
    function init() {
      pts = Array.from({ length: 60 }, function () {
        return { x: Math.random() * w, y: Math.random() * h, z: Math.random() * 1 + 0.2, r: Math.random() * 1.5 + 0.3, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 };
      });
    }
    function draw() {
      c.clearRect(0, 0, w, h);
      pts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = 'rgba(167,139,250,' + (0.15 + p.z * 0.25) + ')';
        c.fill();
      });
      requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    addEventListener('resize', function () { resize(); init(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    particles();
    wireNav();
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('ban-appeal') >= 0 || path.indexOf('unban') >= 0) {
      bootAppeal();
    } else if (path.indexOf('ic-panel') >= 0 || path.indexOf('ingame') >= 0) {
      bootIc();
    } else if (path.indexOf('dashboard') >= 0) {
      bootDashboard();
    }
    // landing: no auth
  });
})();
