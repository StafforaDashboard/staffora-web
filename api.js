window.STAFFORA_API = window.STAFFORA_API || "https://staffora.apps.bot-hosting.cloud";
window.STAFFORA_EARLY_ACCESS = false;
window.StafforaAPI = (function () {
  var API = window.STAFFORA_API;
  var tokenKey = "staffora_token";
  var staffPwKey = "staffora_staff_pw";
  var staffFlag = "staffora_staff_ok";

  function token() { try { return localStorage.getItem(tokenKey) || ""; } catch (e) { return ""; } }
  function setToken(t) {
    try { if (t) localStorage.setItem(tokenKey, t); else localStorage.removeItem(tokenKey); } catch (e) {}
  }
  function getStaffPw() { try { return localStorage.getItem(staffPwKey) || ""; } catch (e) { return ""; } }
  function setStaffPw(p) {
    try { if (p) localStorage.setItem(staffPwKey, p); else localStorage.removeItem(staffPwKey); } catch (e) {}
  }
  function headers(json) {
    var h = { Accept: "application/json" };
    if (json) h["Content-Type"] = "application/json";
    var t = token();
    if (t) h["Authorization"] = "Bearer " + t;
    var pw = getStaffPw();
    if (pw) h["X-Staff-Password"] = pw;
    return h;
  }
  async function req(path, opts) {
    opts = opts || {};
    var url = API.replace(/\/$/, "") + path;
    var res;
    try {
      res = await fetch(url, {
        method: opts.method || "GET",
        headers: headers(!!opts.body),
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        credentials: "omit",
        mode: "cors"
      });
    } catch (e) {
      throw new Error("Error");
    }
    var text = await res.text();
    var data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
    if (!res.ok) throw new Error((data && (data.error || data.message)) || "Error");
    return data;
  }
  function login(returnUrl) {
    var ru = encodeURIComponent(returnUrl || (location.origin + "/dashboard/"));
    location.href = API.replace(/\/$/, "") + "/auth/login?return=" + ru;
  }
  function readTokenFromUrl() {
    var q = new URLSearchParams(location.search);
    var t = q.get("token") || q.get("access_token");
    if (t) {
      setToken(t);
      q.delete("token"); q.delete("access_token");
      history.replaceState({}, "", location.pathname + (q.toString() ? "?" + q : "") + location.hash);
    }
  }
  return {
    getToken: token, setToken: setToken, readToken: readTokenFromUrl,
    logout: function () { setToken(""); setStaffPw(""); try { sessionStorage.removeItem(staffFlag); } catch(e){} },
    login: login,
    me: function () { return req("/api/me"); },
    guilds: function (refresh) { return req("/api/guilds" + (refresh ? "?refresh=1" : "")); },
    config: function (gid) { return req("/api/guilds/" + gid + "/config"); },
    discord: function (gid, refresh) {
      return req("/api/guilds/" + gid + "/discord" + (refresh ? "?refresh=1" : ""));
    },
    patchSettings: function (gid, partial) {
      return req("/api/guilds/" + gid + "/settings", { method: "PATCH", body: partial || {} });
    },
    patchModules: function (gid, modules) {
      return req("/api/guilds/" + gid + "/modules", { method: "PATCH", body: modules || {} });
    },
    sendPanel: function (gid, type, channelId) {
      return req("/api/guilds/" + gid + "/panels/send", {
        method: "POST", body: { type: type, channelId: channelId }
      });
    },
    /* Public Unban / Appeal */
    unbanServers: function () { return req("/api/public/unban/servers"); },
    unbanConfig: function (gid) { return req("/api/public/guilds/" + gid + "/unban/config"); },
    unbanCheck: function (gid, robloxUsername) {
      return req("/api/public/guilds/" + gid + "/unban/check", {
        method: "POST", body: { robloxUsername: robloxUsername }
      });
    },
    unbanSubmit: function (gid, body) {
      return req("/api/public/guilds/" + gid + "/unban/submit", { method: "POST", body: body || {} });
    },
    /* Staff portal (Discord OAuth + roster) */
    staffMe: function () { return req("/api/staff-portal/me"); },
    staffOverview: function () { return req("/api/staff-portal/overview"); },
    staffGuilds: function () { return req("/api/staff-portal/guilds"); },
    staffBlacklist: function () { return req("/api/staff-portal/blacklist"); },
    staffBlacklistAdd: function (guildId, reason) {
      return req("/api/staff-portal/blacklist/add", { method: "POST", body: { guildId: guildId, reason: reason } });
    },
    staffBlacklistRemove: function (guildId) {
      return req("/api/staff-portal/blacklist/remove", { method: "POST", body: { guildId: guildId } });
    },
    staffErrors: function () { return req("/api/staff-portal/errors"); },
    staffInvite: function (guildId) {
      return req("/api/staff-portal/invite", { method: "POST", body: { guildId: guildId } });
    },
    staffPremiumGrant: function (userId, days) {
      return req("/api/staff-portal/premium/grant", { method: "POST", body: { userId: userId, days: days } });
    },
    staffPremiumRevoke: function (userId) {
      return req("/api/staff-portal/premium/revoke", { method: "POST", body: { userId: userId } });
    },
    staffPremiumCheck: function (userId) {
      return req("/api/staff-portal/premium/" + encodeURIComponent(userId));
    },
    staffRoster: function () { return req("/api/staff-portal/roster"); },
    uploadMusic: function (guildId, filename, dataBase64) {
      return req("/api/guilds/" + guildId + "/music/upload", {
        method: "POST",
        body: { filename: filename, data: dataBase64 }
      });
    },
    uploadTicketImage: function (guildId, kind, dataBase64) {
      return req("/api/guilds/" + guildId + "/ticket-image/upload", {
        method: "POST",
        body: { kind: kind || "panel", data: dataBase64 }
      });
    },
    staffPasswordLogin: function (password) {
      return req("/api/staff-portal/login", { method: "POST", body: { password: password } }).then(function (data) {
        if (data && (data.token || data.ok)) setStaffPw(password);
        return data;
      });
    },
    clearStaffPw: function () { setStaffPw(""); },
    getStaffPw: getStaffPw
  };
})();
