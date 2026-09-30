/**
 * Staffora API client — sync website ↔ bot
 */
(function (global) {
  var API = String(global.STAFFORA_API || 'https://staffora.apps.bot-hosting.cloud').replace(/\/$/, '');
  var token = '';

  function readToken() {
    try {
      var m = location.search.match(/[?&]token=([^&#]+)/);
      if (m) token = decodeURIComponent(m[1].replace(/\+/g, ' '));
    } catch (e) {}
    if (!token) try { token = localStorage.getItem('staffora_token') || ''; } catch (e) {}
    if (token) {
      try { localStorage.setItem('staffora_token', token); } catch (e) {}
      try {
        if (/[?&]token=/.test(location.search)) history.replaceState({}, '', location.pathname + location.hash);
      } catch (e) {}
    }
    return token;
  }

  function setToken(t) {
    token = t || '';
    try {
      if (token) localStorage.setItem('staffora_token', token);
      else localStorage.removeItem('staffora_token');
    } catch (e) {}
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      credentials: 'include',
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.error || j.message || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  function login(returnUrl) {
    var ret = encodeURIComponent(returnUrl || (location.origin + '/dashboard/'));
    location.href = API + '/auth/login?return=' + ret;
  }

  function logout() {
    setToken('');
    try { localStorage.removeItem('staffora_guild'); } catch (e) {}
  }

  global.StafforaAPI = {
    API: API,
    readToken: readToken,
    setToken: setToken,
    getToken: function () { return token; },
    api: api,
    login: login,
    logout: logout,
    me: function () { return api('/api/me').catch(function () { return api('/api/auth/me'); }); },
    guilds: function () { return api('/api/guilds'); },
    config: function (gid) { return api('/api/guilds/' + gid + '/config'); },
    patchSettings: function (gid, settings) {
      return api('/api/guilds/' + gid + '/settings', { method: 'PATCH', body: { settings: settings } })
        .catch(function () {
          return api('/api/guilds/' + gid + '/config', { method: 'PATCH', body: { settings: settings } });
        });
    },
    patchModules: function (gid, modules) {
      return api('/api/guilds/' + gid + '/modules', { method: 'PATCH', body: { modules: modules } });
    },
    discord: function (gid) { return api('/api/guilds/' + gid + '/discord'); },
    sendPanel: function (gid, type, channelId) {
      return api('/api/guilds/' + gid + '/panels/send', {
        method: 'POST',
        body: { type: type, channelId: channelId }
      });
    },
    teamStats: function (gid, days) {
      return api('/api/guilds/' + gid + '/team-stats?days=' + (days || 7));
    },
    // Staff portal
    staffLogin: function (password) {
      return api('/api/staff-portal/login', { method: 'POST', body: { password: password } });
    },
    hqLogin: function (password) {
      return api('/api/hq/login', { method: 'POST', body: { password: password } });
    },
    staffOverview: function () { return api('/api/staff-portal/overview'); },
    staffGuilds: function () {
      return api('/api/staff-portal/guilds').catch(function () { return api('/api/hq/guilds'); });
    },
    staffBlacklist: function () {
      return api('/api/hq/blacklist').catch(function () { return { entries: [] }; });
    },
    staffBlacklistAdd: function (guildId, reason) {
      return api('/api/staff-portal/blacklist/add', { method: 'POST', body: { guildId: guildId, reason: reason } })
        .catch(function () {
          return api('/api/hq/blacklist', { method: 'POST', body: { guildId: guildId, reason: reason } });
        });
    },
    staffBlacklistRemove: function (guildId) {
      return api('/api/staff-portal/blacklist/remove', { method: 'POST', body: { guildId: guildId } });
    },
    staffPremium: function (userId) { return api('/api/staff-portal/premium/' + userId); },
    staffPremiumGrant: function (userId, days) {
      return api('/api/staff-portal/premium/grant', { method: 'POST', body: { userId: userId, days: days } });
    },
    staffPremiumRevoke: function (userId) {
      return api('/api/staff-portal/premium/revoke', { method: 'POST', body: { userId: userId } });
    },
    staffInvite: function (guildId) {
      return api('/api/staff-portal/invite', { method: 'POST', body: { guildId: guildId } })
        .catch(function () { return api('/api/hq/invite', { method: 'POST', body: { guildId: guildId } }); });
    },
    staffErrors: function () { return api('/api/staff-portal/errors'); }
  };
})(window);
