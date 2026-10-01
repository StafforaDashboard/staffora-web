(function () {
  var S = window.StafforaAPI;
  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__t);
    window.__t = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function enter(me) {
    $('staffGate').classList.add('hidden');
    $('staffApp').classList.add('on');
    if (me) {
      $('staffUser').textContent = (me.username || me.id || '') + (me.role ? ' · ' + me.role : '');
    }
    loadOverview();
    loadGuilds();
    loadBlacklist();
    loadErrors();
  }

  function loadOverview() {
    return S.staffOverview().catch(function () { return {}; }).then(function (o) {
      if ($('st-ok')) $('st-ok').textContent = o.ok !== false ? 'OK' : '—';
    });
  }
  function loadGuilds() {
    return S.staffGuilds().then(function (j) {
      var list = j.guilds || j || [];
      if (!Array.isArray(list)) list = [];
      if ($('st-servers')) $('st-servers').textContent = String(list.length);
      var body = $('guildBody');
      body.innerHTML = list.map(function (g) {
        var id = g.id || g.guildId;
        var name = g.name || id;
        return '<tr><td><b>' + esc(name) + '</b></td><td><small>' + esc(id) + '</small></td>' +
          '<td><button type="button" class="btn" data-inv="' + esc(id) + '">Invite</button></td></tr>';
      }).join('') || '<tr><td colspan="3">—</td></tr>';
      body.querySelectorAll('[data-inv]').forEach(function (b) {
        b.onclick = function () {
          S.staffInvite(b.getAttribute('data-inv')).then(function (r) {
            toast(r.url || r.invite || 'OK');
            if (r.url) prompt('Invite', r.url);
          }).catch(function () { toast('Error'); });
        };
      });
    }).catch(function () { toast('Error'); });
  }
  function loadBlacklist() {
    return S.staffBlacklist().then(function (j) {
      var entries = j.entries || j.blacklist || j || [];
      if (!Array.isArray(entries)) entries = [];
      if ($('st-bl')) $('st-bl').textContent = String(entries.length);
      $('blList').innerHTML = entries.map(function (e) {
        var id = e.guildId || e.id || e;
        var reason = e.reason || '';
        return '<div class="setting-row"><div><b>' + esc(id) + '</b><small>' + esc(reason) + '</small></div>' +
          '<button type="button" class="btn" data-rm="' + esc(id) + '">Remove</button></div>';
      }).join('') || '<p style="color:#9298a8">Leer</p>';
      $('blList').querySelectorAll('[data-rm]').forEach(function (b) {
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
      var errs = j.errors || j || [];
      if ($('st-err')) $('st-err').textContent = Array.isArray(errs) ? String(errs.length) : '—';
      $('errBox').textContent = Array.isArray(errs) ? JSON.stringify(errs.slice(0, 40), null, 2) : JSON.stringify(j, null, 2);
    }).catch(function () {
      $('errBox').textContent = '—';
    });
  }

  document.querySelectorAll('.nav-s').forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll('.nav-s').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
      var tab = btn.getAttribute('data-tab');
      document.querySelectorAll('[data-pane]').forEach(function (p) {
        p.classList.toggle('hidden', p.getAttribute('data-pane') !== tab);
      });
    };
  });

  $('staffDiscordLogin').onclick = function () {
    S.login(location.origin + '/staff/');
  };
  $('staffLogout').onclick = function () {
    S.logout();
    location.reload();
  };
  if ($('btnSyncGuilds')) $('btnSyncGuilds').onclick = function () { loadGuilds().then(function () { toast('OK'); }); };
  if ($('blAdd')) $('blAdd').onclick = function () {
    S.staffBlacklistAdd($('blGuild').value.trim(), $('blReason').value.trim())
      .then(function () { toast('OK'); loadBlacklist(); })
      .catch(function () { toast('Error'); });
  };
  if ($('premGrant')) $('premGrant').onclick = function () {
    S.staffPremiumGrant($('premUser').value.trim(), parseInt($('premDays').value, 10) || 30)
      .then(function () { toast('OK'); })
      .catch(function () { toast('Error'); });
  };
  if ($('premRevoke')) $('premRevoke').onclick = function () {
    S.staffPremiumRevoke($('premUser').value.trim())
      .then(function () { toast('OK'); })
      .catch(function () { toast('Error'); });
  };
  if ($('premCheck')) $('premCheck').onclick = function () {
    S.staffPremiumCheck($('premUser').value.trim())
      .then(function (r) { $('premOut').textContent = JSON.stringify(r, null, 2); })
      .catch(function () { toast('Error'); });
  };

  async function boot() {
    S.readToken();
    if (!S.getToken()) return;
    try {
      var me = await S.staffMe();
      if (!me || me.ok === false) {
        $('staffErr').textContent = 'Kein Staff-Zugang';
        return;
      }
      enter(me);
    } catch (e) {
      $('staffErr').textContent = 'Kein Staff-Zugang';
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
