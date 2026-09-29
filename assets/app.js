/**
 * Staffora website client
 */
(function () {
  'use strict';

  var FALLBACK_API = 'https://staffora.apps.bot-hosting.cloud';
  var host = (location.hostname || '').toLowerCase();
  var onStaffora = host === 'staffora.info' || host.endsWith('.staffora.info') || host === 'localhost' || host === '127.0.0.1';

  function resolveApi() {
    // Explicit override (proxy URL or custom API)
    if (window.STAFFORA_API != null && String(window.STAFFORA_API).length) {
      return String(window.STAFFORA_API).replace(/\/$/, '');
    }
    try {
      var ls = localStorage.getItem('staffora_api');
      if (ls) return String(ls).replace(/\/$/, '');
    } catch (e) {}
    // Optional same-origin API if enabled
    try {
      if (localStorage.getItem('staffora_api_proxy') === '1') return '';
    } catch (e) {}
    if (window.STAFFORA_USE_PROXY === true) return '';
    // Default: real bot API host (GitHub Pages has no /auth or /api)
    return FALLBACK_API;
  }

  var API = resolveApi();
  var token = '';
  var me = null;
  var guilds = [];
  var guildId = '';
  try { guildId = localStorage.getItem('staffora_guild') || ''; } catch (e) {}
  var settings = {};
  var roles = [];
  var channels = [];

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
      el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;padding:12px 16px;border-radius:12px;background:#15151c;border:1px solid rgba(139,92,246,.4);color:#f4f4f8;font-size:13px;max-width:340px;box-shadow:0 12px 40px rgba(0,0,0,.5)';
      document.body.appendChild(el);
    }
    el.style.borderColor = ok === false ? 'rgba(248,113,113,.55)' : 'rgba(139,92,246,.4)';
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.hidden = true; }, 4000);
  }

  function apiUrl(path) {
    if (path.charAt(0) !== '/') path = '/' + path;
    return (API || '') + path;
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
    if (!token) {
      try { token = localStorage.getItem('staffora_token') || ''; } catch (e) {}
    }
    if (!token) {
      try { token = sessionStorage.getItem('staffora_token') || ''; } catch (e) {}
    }
    if (token) {
      try { localStorage.setItem('staffora_token', token); } catch (e) {}
      try { sessionStorage.setItem('staffora_token', token); } catch (e) {}
      try {
        if (/[?&#]token=/.test(location.href)) {
          var u = new URL(location.href);
          u.searchParams.delete('token');
          history.replaceState({}, '', u.pathname + u.search + u.hash);
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
    var o = {
      method: opts.method || 'GET',
      headers: headers(!!opts.body),
      credentials: 'include'
    };
    if (opts.body) o.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    return fetch(apiUrl(path), o).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || j.message || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  /** Login always hits the bot API host (not GitHub Pages). */
  function goLogin() {
    var BOT = FALLBACK_API; // https://staffora.apps.bot-hosting.cloud
    var retUrl = window.STAFFORA_RETURN || (location.origin + '/dashboard/');
    try {
      var u = new URL(retUrl, location.origin);
      if (u.pathname.indexOf('/ic') >= 0) retUrl = location.origin + '/ic/';
      else retUrl = location.origin + '/dashboard/';
    } catch (e) {
      retUrl = location.origin + '/dashboard/';
    }
    var loginPath = BOT + '/auth/login?return=' + encodeURIComponent(retUrl);
    var err = $('auth-err');
    if (err) err.textContent = 'Weiterleitung zu Discord…';
    location.href = loginPath;
  }

  function ensureChrome() {
    if ($('staffora-auth-gate')) return;
    var gate = document.createElement('div');
    gate.id = 'staffora-auth-gate';
    gate.innerHTML =
      '<div style="position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(5,5,8,.92);backdrop-filter:blur(12px)">' +
      '<div style="max-width:420px;width:92%;padding:28px;text-align:center;border-radius:18px;background:#12121a;border:1px solid rgba(139,92,246,.25)">' +
      '<div style="letter-spacing:.12em;font-size:11px;color:#a78bfa;margin-bottom:8px">STAFFORA</div>' +
      '<h1 style="margin:0 0 10px;font-size:1.5rem;color:#fff">Dashboard Login</h1>' +
      '<p style="color:#9298a8;margin:0 0 16px;line-height:1.5;font-size:14px">Mit Discord anmelden, danach Server wählen.</p>' +
      '<button type="button" id="btn-login" style="width:100%;padding:12px 16px;border:0;border-radius:12px;background:#8b5cf6;color:#fff;font-weight:600;cursor:pointer">Mit Discord anmelden</button>' +
      '<p id="auth-err" style="color:#f87171;font-size:12px;margin-top:12px;line-height:1.4"></p>' +
            '</div></div>';
    document.body.appendChild(gate);
    $('btn-login').onclick = goLogin;

    var picker = document.createElement('div');
    picker.id = 'staffora-guild-picker';
    picker.hidden = true;
    picker.innerHTML =
      '<div style="position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(5,5,8,.92)">' +
      '<div style="max-width:440px;width:92%;padding:28px;border-radius:18px;background:#12121a;border:1px solid rgba(139,92,246,.25)">' +
      '<div style="letter-spacing:.12em;font-size:11px;color:#a78bfa">SERVER</div>' +
      '<h1 style="margin:8px 0 12px;color:#fff;font-size:1.4rem">Server wählen</h1>' +
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
      box.innerHTML = '<p style="color:#9298a8">Keine Server. Bot einladen und Seite neu laden.</p>';
      return;
    }
    box.innerHTML = guilds.map(function (g) {
      return '<button type="button" data-gid="' + esc(g.id) + '" style="text-align:left;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:#1a1a24;color:#fff;cursor:pointer">' +
        esc(g.name) + '</button>';
    }).join('');
    qsa('[data-gid]', box).forEach(function (btn) {
      btn.onclick = function () {
        guildId = btn.getAttribute('data-gid');
        try { localStorage.setItem('staffora_guild', guildId); } catch (e) {}
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
    }
  }

  function patchSettings(partial) {
    return api('/api/guilds/' + guildId + '/config', { method: 'PATCH', body: { settings: partial } })
      .then(function (j) {
        if (j.settings) Object.assign(settings, j.settings);
        else Object.assign(settings, partial);
        toast('Gespeichert', true);
        return j;
      });
  }

  function sendPanel(type, channelId) {
    return api('/api/guilds/' + guildId + '/panels/send', {
      method: 'POST',
      body: { type: type, channelId: channelId }
    }).then(function () { toast('Panel gesendet', true); });
  }

  function roleItems() {
    return (roles || []).map(function (r) { return { id: r.id, name: r.name || r.id }; });
  }
  function channelItems() {
    return (channels || []).map(function (c) {
      return { id: c.id, name: c.name ? '#' + c.name : c.id };
    });
  }
  function fillSelect(sel, items, placeholder) {
    if (!sel) return;
    sel.innerHTML = '<option value="">' + esc(placeholder || '—') + '</option>' +
      (items || []).map(function (it) {
        return '<option value="' + esc(it.id) + '">' + esc(it.name) + '</option>';
      }).join('');
  }

  function guessSettingKey(title, isRole) {
    var t = title.toLowerCase();
    if (/ticket.*panel/.test(t)) return 'ticketPanelChannelId';
    if (/ticket.*log/.test(t)) return 'ticketLogChannelId';
    if (/warteraum/.test(t) && !isRole) return 'warteraumChannelId';
    if (/admin.?call/.test(t) && !isRole) return 'adminCallPanelChannelId';
    if (/duty/.test(t) && !isRole) return 'dutyPanelChannelId';
    if (/teamliste|teamlist/.test(t)) return 'teamlistChannelId';
    if (/feedback/.test(t) && !isRole) return 'feedbackLogChannelId';
    if (/database/.test(t) && !isRole) return 'databasePanelChannelId';
    if (/mod.?log/.test(t)) return 'modLogChannelId';
    if (/welcome/.test(t) && !isRole) return 'welcomeChannelId';
    if (/leave/.test(t) && !isRole) return 'leaveChannelId';
    if (/verify/.test(t) && !isRole) return 'verifyChannelId';
    if (/verify/.test(t) && isRole) return 'verifyRoleIds';
    if (/dashboard|admin/.test(t) && isRole) return 'adminRoleIds';
    if (/staff/.test(t) && isRole) return 'staffRoleIds';
    if (/ic.?panel|ingame/.test(t) && isRole) return 'ingamePanelAccessRoleIds';
    if (/duty/.test(t) && isRole) return 'dutyRoleIds';
    return null;
  }

  function injectChannelSelects() {
    qsa('.setting-row').forEach(function (row) {
      var btn = row.querySelector('button.btn-ghost');
      var title = (row.querySelector('b') || {}).textContent || '';
      if (!btn || row.querySelector('select[data-live]')) return;
      if (!/kanal|channel|rolle|role|zugriff|staff/i.test(title + ' ' + (btn.textContent || ''))) return;
      var isRole = /rolle|role|zugriff|staff|manager|recht/i.test(title + btn.textContent);
      var sel = document.createElement('select');
      sel.className = 'select';
      sel.setAttribute('data-live', '1');
      sel.style.maxWidth = '220px';
      fillSelect(sel, isRole ? roleItems() : channelItems(), isRole ? 'Rolle…' : 'Kanal…');
      btn.parentNode.insertBefore(sel, btn);
      btn.textContent = 'Übernehmen';
      btn.onclick = function (ev) {
        ev.preventDefault();
        var key = guessSettingKey(title, isRole);
        if (!key) { toast('Unbekannte Einstellung: ' + title, false); return; }
        var body = {};
        body[key] = isRole && /rollen|staff|access|manager/i.test(title) ? (sel.value ? [sel.value] : []) : (sel.value || null);
        patchSettings(body).catch(function (e) { toast(e.message, false); });
      };
    });
  }

  function wirePanelButtons() {
    var map = [
      { re: /ticket/i, type: 'ticket' },
      { re: /admin.?call/i, type: 'admincall' },
      { re: /duty/i, type: 'duty' },
      { re: /teamliste|teamlist/i, type: 'teamlist' },
      { re: /feedback/i, type: 'feedback' },
      { re: /database/i, type: 'database' },
      { re: /aufgaben|task/i, type: 'tasks' },
      { re: /verify/i, type: 'verify' },
      { re: /stats/i, type: 'serverstats' }
    ];
    qsa('button').forEach(function (btn) {
      var t = (btn.textContent || '').trim();
      if (!/senden|panel|start/i.test(t)) return;
      map.forEach(function (m) {
        if (!m.re.test(t)) return;
        btn.onclick = function (ev) {
          ev.preventDefault();
          if (!guildId) { toast('Server wählen', false); return; }
          var sec = btn.closest('section');
          var sel = sec && sec.querySelector('select[data-live]');
          var ch = (sel && sel.value) || settings.ticketPanelChannelId || settings.dutyPanelChannelId || settings.logChannelId;
          if (!ch && m.type !== 'tasks') { toast('Zuerst Kanal wählen und übernehmen', false); return; }
          if (m.type === 'tasks') {
            api('/api/guilds/' + guildId + '/tasks/panel', { method: 'POST', body: {} })
              .then(function () { toast('Panel gesendet', true); })
              .catch(function (e) { toast(e.message, false); });
            return;
          }
          sendPanel(m.type, ch).catch(function (e) { toast(e.message, false); });
        };
      });
    });
  }

  function loadTeamStats() {
    var sec = $('stats');
    if (!sec || !guildId) return;
    var daysSel = sec.querySelector('select');
    var days = daysSel && daysSel.selectedIndex === 1 ? 30 : 7;
    if (daysSel) daysSel.onchange = function () { loadTeamStats(); };
    api('/api/guilds/' + guildId + '/team-stats?days=' + days)
      .then(function (data) {
        var s = data.summary || {};
        var cards = sec.querySelectorAll('.grid .card strong');
        var tl = (data.timeline && data.timeline.series) || [];
        var tickets = 0, ac = 0;
        tl.forEach(function (b) { tickets += b.tickets || 0; ac += b.adminCalls || 0; });
        if (cards[0]) cards[0].textContent = s.totalActions != null ? s.totalActions : '—';
        if (cards[1]) cards[1].textContent = tickets || (s.openTickets != null ? s.openTickets : '—');
        if (cards[2]) cards[2].textContent = ac || '—';
        if (cards[3]) cards[3].textContent = s.staffActive != null ? s.staffActive : '—';
        var bars = sec.querySelector('.bars');
        if (bars && tl.length) {
          var maxV = 1;
          tl.forEach(function (b) { maxV = Math.max(maxV, b.tickets || b.total || 0); });
          bars.innerHTML = tl.map(function (b) {
            var h = Math.max(8, Math.round(((b.tickets || b.total || 0) / maxV) * 100));
            return '<i style="height:' + h + '%"></i>';
          }).join('');
        }
      })
      .catch(function () {});
  }

  function bootGuild() {
    showGate(false);
    showPicker(false);
    updateServerChrome();
    Promise.all([
      api('/api/guilds/' + guildId + '/config').catch(function () { return { settings: {} }; }),
      api('/api/guilds/' + guildId + '/discord').catch(function () { return {}; })
    ]).then(function (pack) {
      settings = (pack[0] && pack[0].settings) || {};
      var disc = pack[1] || {};
      roles = disc.roles || [];
      channels = disc.channels || [];
      return Promise.all([
        roles.length ? null : api('/api/guilds/' + guildId + '/roles').then(function (j) { roles = j.roles || j || []; }).catch(function () {}),
        channels.length ? null : api('/api/guilds/' + guildId + '/channels').then(function (j) { channels = j.channels || j || []; }).catch(function () {})
      ]);
    }).then(function () {
      injectChannelSelects();
      wirePanelButtons();
      loadTeamStats();
      toast('Server geladen', true);
    }).catch(function (e) {
      toast(e.message || 'Laden fehlgeschlagen', false);
    });
  }

  function bootDashboard() {
    ensureChrome();
    readToken();
    if (!token) { showGate(true); return; }
    api('/api/me')
      .catch(function () { return api('/api/auth/me'); })
      .then(function (u) {
        me = u.user || u;
        return api('/api/guilds');
      })
      .then(function (g) {
        guilds = g.guilds || g || [];
        if (!Array.isArray(guilds)) guilds = [];
        if (guildId && guilds.some(function (x) { return String(x.id) === String(guildId); })) {
          bootGuild();
        } else {
          showGate(false);
          showPicker(true);
          renderGuildList();
        }
      })
      .catch(function (e) {
        token = '';
        try { localStorage.removeItem('staffora_token'); } catch (err) {}
        showGate(true);
        var err = $('auth-err');
        if (err) {
          err.textContent = (e && e.message) || 'Login fehlgeschlagen. Bitte erneut versuchen.';
        }
      });

    var sc = qs('.server-card');
    if (sc) {
      sc.style.cursor = 'pointer';
      sc.addEventListener('click', function () {
        showPicker(true);
        renderGuildList();
      });
    }
  }

  function bootIc() {
    ensureChrome();
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
        var _boot = bootGuild;
        bootGuild = function () {
          showPicker(false);
          updateServerChrome();
          wireIc();
        };
        return;
      }
      wireIc();
    }).catch(function () { showGate(true); });
  }

  function wireIc() {
    qsa('section#lookup button, section#mod button').forEach(function (btn) {
      var t = (btn.textContent || '').toLowerCase();
      if (/suchen|lookup|search/.test(t)) {
        btn.onclick = function (ev) {
          ev.preventDefault();
          var q = (qs('section#lookup input') || {}).value || '';
          if (!q) { toast('Name / ID eingeben', false); return; }
          api('/api/guilds/' + guildId + '/ingame/lookup?q=' + encodeURIComponent(q))
            .catch(function () {
              return api('/api/guilds/' + guildId + '/roblox/lookup', { method: 'POST', body: { query: q } });
            })
            .then(function (data) {
              toast('Lookup ok', true);
              var box = qs('section#lookup');
              if (!box) return;
              var pre = box.querySelector('pre') || document.createElement('pre');
              pre.style.cssText = 'margin-top:12px;font-size:12px;white-space:pre-wrap;color:#c4b5fd';
              pre.textContent = JSON.stringify(data.user || data.player || data, null, 2).slice(0, 1500);
              if (!pre.parentNode) box.appendChild(pre);
            })
            .catch(function (e) { toast(e.message, false); });
        };
      }
      if (/duty|dienst/.test(t)) {
        btn.onclick = function (ev) {
          ev.preventDefault();
          api('/api/guilds/' + guildId + '/duty/toggle', { method: 'POST', body: {} })
            .then(function (j) { toast(j.onDuty ? 'On Duty' : 'Off Duty', true); })
            .catch(function (e) { toast(e.message, false); });
        };
      }
    });
  }

  function bootAppeal() {
    var form = qs('form#step-form') || qs('form');
    var btnCheck = $('btn-check');
    if (btnCheck) return; // appeal page has own script
    if (!form) return;
    form.onsubmit = function (ev) {
      ev.preventDefault();
      toast('Bitte /appeal/ Seite nutzen', false);
    };
  }

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
      pts = [];
      for (var i = 0; i < 55; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 1 + 0.2,
          r: Math.random() * 1.4 + 0.3,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        });
      }
    }
    function draw() {
      c.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = 'rgba(167,139,250,' + (0.12 + p.z * 0.22) + ')';
        c.fill();
      }
      requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    addEventListener('resize', function () { resize(); init(); });
  }

  function wireNav() {
    // ensure top links are real routes (not dead hashes)
    qsa('.nav-links a, .nav a, footer a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href === '#dashboard') a.setAttribute('href', '/dashboard/');
      if (href === '#appeal') a.setAttribute('href', '/appeal/');
      if (href === '#ic') a.setAttribute('href', '/ic/');
      // magnetic buttons sometimes break click — force navigation
      a.addEventListener('click', function (ev) {
        var h = a.getAttribute('href') || '';
        if (h.charAt(0) === '/' && !h.startsWith('/#')) {
          // allow normal navigation
          return;
        }
      });
    });
    // Fix magnetic transform stealing clicks: reset on click
    qsa('.magnetic').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.style.transform = '';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    particles();
    wireNav();
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('/appeal') >= 0 || path.indexOf('unban') >= 0 || path.indexOf('ban-appeal') >= 0) {
      bootAppeal();
    } else if (path.indexOf('/ic') >= 0 || path.indexOf('ingame') >= 0 || path.indexOf('ic-panel') >= 0) {
      window.STAFFORA_RETURN = location.origin + '/ic/';
      bootIc();
    } else if (path.indexOf('/dashboard') >= 0) {
      window.STAFFORA_RETURN = location.origin + '/dashboard/';
      bootDashboard();
    }
  });
})();
