(function () {
  var S = window.StafforaAPI;
  var HQ_KEY = 'staffora_hq_token';

  function $(id) { return document.getElementById(id); }
  function toast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__t);
    window.__t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // staff portal uses cookie/session from login endpoint — also store flag
  function logged() {
    try { return sessionStorage.getItem('staffora_staff') === '1'; } catch (e) { return false; }
  }
  function setLogged(v) {
    try { sessionStorage.setItem('staffora_staff', v ? '1' : '0'); } catch (e) {}
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
          '<td><button type="button" class="btn btn-ghost" data-inv="' + esc(id) + '">Invite</button></td></tr>';
      }).join('') || '<tr><td colspan="3">Keine Server</td></tr>';
      body.querySelectorAll('[data-inv]').forEach(function (b) {
        b.onclick = function () {
          S.staffInvite(b.getAttribute('data-inv')).then(function (r) {
            toast(r.url || r.invite || 'Invite erstellt');
            if (r.url) prompt('Invite', r.url);
          }).catch(function (e) { toast(e.message); });
        };
      });
    }).catch(function (e) { toast(e.message); });
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
          '<button type="button" class="btn btn-ghost" data-rm="' + esc(id) + '">Remove</button></div>';
      }).join('') || '<p style="color:#9298a8">Leer</p>';
      $('blList').querySelectorAll('[data-rm]').forEach(function (b) {
        b.onclick = function () {
          S.staffBlacklistRemove(b.getAttribute('data-rm')).then(function () {
            toast('Entfernt'); loadBlacklist();
          }).catch(function (e) { toast(e.message); });
        };
      });
    }).catch(function () { if ($('st-bl')) $('st-bl').textContent = '0'; });
  }
  function loadErrors() {
    return S.staffErrors().then(function (j) {
      var errs = j.errors || j || [];
      if ($('st-err')) $('st-err').textContent = Array.isArray(errs) ? String(errs.length) : '—';
      $('errBox').textContent = Array.isArray(errs) ? JSON.stringify(errs.slice(0, 50), null, 2) : JSON.stringify(j, null, 2);
    }).catch(function (e) {
      $('errBox').textContent = e.message || 'Keine Errors';
    });
  }

  function enter() {
    $('staffGate').classList.add('hidden');
    $('staffApp').classList.remove('hidden');
    loadOverview();
    loadGuilds();
    loadBlacklist();
    loadErrors();
  }

  $('staffLoginBtn').onclick = function () {
    var pw = $('staffPw').value;
    $('staffErr').textContent = '';
    S.staffLogin(pw).then(function () {
      setLogged(true);
      enter();
      toast('Staff angemeldet');
    }).catch(function () {
      return S.hqLogin(pw).then(function () {
        setLogged(true);
        enter();
        toast('HQ angemeldet');
      });
    }).catch(function (e) {
      $('staffErr').textContent = e.message || 'Falsches Passwort';
    });
  };
  $('staffLogout').onclick = function () {
    setLogged(false);
    location.reload();
  };
  $('btnSyncGuilds').onclick = function () { loadGuilds().then(function () { toast('Sync OK'); }); };
  $('blAdd').onclick = function () {
    S.staffBlacklistAdd($('blGuild').value.trim(), $('blReason').value.trim())
      .then(function () { toast('Blacklist +'); loadBlacklist(); })
      .catch(function (e) { toast(e.message); });
  };
  $('premGrant').onclick = function () {
    S.staffPremiumGrant($('premUser').value.trim(), parseInt($('premDays').value, 10) || 30)
      .then(function () { toast('Premium vergeben'); })
      .catch(function (e) { toast(e.message); });
  };
  $('premCheck').onclick = function () {
    S.staffPremium($('premUser').value.trim()).then(function (j) {
      $('premOut').textContent = JSON.stringify(j);
    }).catch(function (e) { $('premOut').textContent = e.message; });
  };
  $('premRevoke').onclick = function () {
    S.staffPremiumRevoke($('premUser').value.trim())
      .then(function () { toast('Premium entfernt'); })
      .catch(function (e) { toast(e.message); });
  };
  $('errRefresh').onclick = loadErrors;

  if (logged()) enter();
})();
