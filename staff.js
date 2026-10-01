(function () {
  var S = window.StafforaAPI;
  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg || 'Error';
    t.classList.add('show');
    clearTimeout(window.__t);
    window.__t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function setErr(msg) {
    var e = $('staffErr');
    if (e) e.textContent = msg || '';
  }

  function enter(me) {
    var gate = $('staffGate');
    var app = $('staffApp');
    if (gate) gate.classList.add('hidden');
    if (app) {
      app.classList.add('on');
      app.style.display = 'block';
    }
    if (me && $('staffUser')) {
      $('staffUser').textContent = (me.username || me.id || 'Staff') + (me.role ? ' · ' + me.role : '');
    }
    loadOverview();
    loadGuilds();
    loadBlacklist();
    loadErrors();
  }

  function loadOverview() {
    return S.staffOverview().catch(function () { return {}; }).then(function (o) {
      if ($('st-ok')) $('st-ok').textContent = o && o.ok !== false ? 'OK' : '—';
    });
  }
  function loadGuilds() {
    return S.staffGuilds().then(function (j) {
      var list = (j && (j.guilds || j)) || [];
      if (!Array.isArray(list)) list = [];
      if ($('st-servers')) $('st-servers').textContent = String(list.length);
      var body = $('guildBody');
      if (!body) return;
      body.innerHTML = list.map(function (g) {
        var id = g.id || g.guildId;
        var name = g.name || id;
        return '<tr><td><b>' + esc(name) + '</b></td><td><small>' + esc(id) + '</small></td>' +
          '<td><button type="button" class="btn" data-inv="' + esc(id) + '">Invite</button></td></tr>';
      }).join('') || '<tr><td colspan="3">Keine Server</td></tr>';
      body.querySelectorAll('[data-inv]').forEach(function (b) {
        b.onclick = function () {
          S.staffInvite(b.getAttribute('data-inv')).then(function (r) {
            toast((r && (r.url || r.invite)) || 'OK');
            if (r && r.url) prompt('Invite', r.url);
          }).catch(function () { toast('Error'); });
        };
      });
    }).catch(function () { toast('Error'); });
  }
  function loadBlacklist() {
    return S.staffBlacklist().then(function (j) {
      var entries = (j && (j.entries || j.blacklist || j)) || [];
      if (!Array.isArray(entries)) entries = [];
      if ($('st-bl')) $('st-bl').textContent = String(entries.length);
      var box = $('blList');
      if (!box) return;
      box.innerHTML = entries.map(function (e) {
        var id = e.guildId || e.id || e;
        var reason = e.reason || '';
        return '<div class="setting-row"><div><b>' + esc(id) + '</b><small>' + esc(reason) + '</small></div>' +
          '<button type="button" class="btn" data-rm="' + esc(id) + '">Remove</button></div>';
      }).join('') || '<p style="color:#9298a8">Leer</p>';
      box.querySelectorAll('[data-rm]').forEach(function (b) {
        b.onclick = function () {
          S.staffBlacklistRemove(b.getAttribute('data-rm')).then(function () {
            toast('OK'); loadBlacklist();
          }).catch(function () { toast('Error'); });
        };
      });
    }).catch(function () { if ($('st-bl')) $('st-bl').textContent = '0'; });
  }
  function loadErrors() {
    return S.staffErrors().then(function (j) {
      var errs = (j && (j.errors || j)) || [];
      if ($('st-err')) $('st-err').textContent = Array.isArray(errs) ? String(errs.length) : '—';
      if ($('errBox')) $('errBox').textContent = JSON.stringify(Array.isArray(errs) ? errs.slice(0, 40) : j, null, 2);
    }).catch(function () {
      if ($('errBox')) $('errBox').textContent = '—';
    });
  }

  document.querySelectorAll('.nav-s').forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll('.nav-s').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
      var tab = btn.getAttribute('data-tab');
      document.querySelectorAll('[data-pane]').forEach(function (p) {
        var on = p.getAttribute('data-pane') === tab;
        p.classList.toggle('hidden', !on);
        p.style.display = on ? '' : 'none';
      });
    };
  });

  if ($('staffDiscordLogin')) {
    $('staffDiscordLogin').onclick = function () {
      setErr('');
      S.login(location.origin + '/staff/');
    };
  }
  if ($('staffLogout')) {
    $('staffLogout').onclick = function () {
      S.logout();
      location.href = '/staff/';
    };
  }
  if ($('btnSyncGuilds')) $('btnSyncGuilds').onclick = function () { loadGuilds().then(function () { toast('OK'); }); };
  if ($('blAdd')) $('blAdd').onclick = function () {
    S.staffBlacklistAdd(($('blGuild').value || '').trim(), ($('blReason').value || '').trim())
      .then(function () { toast('OK'); loadBlacklist(); })
      .catch(function () { toast('Error'); });
  };
  if ($('premGrant')) $('premGrant').onclick = function () {
    S.staffPremiumGrant(($('premUser').value || '').trim(), parseInt(($('premDays') || {}).value, 10) || 30)
      .then(function () { toast('OK'); }).catch(function () { toast('Error'); });
  };
  if ($('premRevoke')) $('premRevoke').onclick = function () {
    S.staffPremiumRevoke(($('premUser').value || '').trim())
      .then(function () { toast('OK'); }).catch(function () { toast('Error'); });
  };
  if ($('premCheck')) $('premCheck').onclick = function () {
    S.staffPremiumCheck(($('premUser').value || '').trim())
      .then(function (r) { if ($('premOut')) $('premOut').textContent = JSON.stringify(r, null, 2); })
      .catch(function () { toast('Error'); });
  };

  async function boot() {
    if (!S) {
      setErr('Error');
      return;
    }
    S.readToken();
    if (!S.getToken()) {
      setErr('');
      return;
    }
    setErr('Prüfe Zugang…');
    try {
      await S.me();
    } catch (e) {
      S.logout();
      setErr('Session abgelaufen — bitte neu anmelden');
      return;
    }
    try {
      var me = await S.staffMe();
      if (!me || me.ok === false) {
        setErr('Kein Staff-Zugang');
        return;
      }
      setErr('');
      enter(me);
    } catch (e) {
      setErr('Kein Staff-Zugang');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
