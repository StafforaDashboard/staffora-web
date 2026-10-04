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
    var ak = getAccessKey();
    if (ak) h["X-Staffora-Access-Key"] = ak;
    return h;
  }
  var accessKeyKey = "staffora_access_key";
  var accessOkFlag = "staffora_access_ok";
  function getAccessKey() { try { return localStorage.getItem(accessKeyKey) || ""; } catch (e) { return ""; } }
  function setAccessKey(k) { try { if (k) localStorage.setItem(accessKeyKey, k); else localStorage.removeItem(accessKeyKey); } catch (e) {} }
  function hasAccess() {
    if (!window.STAFFORA_EARLY_ACCESS) return true;
    try { return !!getAccessKey() && sessionStorage.getItem(accessOkFlag) === "1"; } catch (e) { return false; }
  }
  async function validateAccessKey(key) {
    key = String(key || "").trim();
    if (!key) throw new Error("Bitte einen Key eingeben.");
    var res;
    try {
      res = await fetch(API.replace(/\/$/, "") + "/api/early-access/validate", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ key: key }), mode: "cors", credentials: "omit"
      });
    } catch (e) { throw new Error("Bot nicht erreichbar – bitte später erneut versuchen."); }
    var data = null; try { data = await res.json(); } catch (e) {}
    if (!res.ok || !data || !data.valid) throw new Error((data && (data.message || data.error)) || "Ungültiger Key");
    setAccessKey(key);
    try { sessionStorage.setItem(accessOkFlag, "1"); } catch (e) {}
    return data;
  }

  async function req(path, opts) {
    opts = opts || {};
    var url = API.replace(/\/$/, "") + path;
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, opts.timeout || 30000) : null;
    var res;
    try {
      res = await fetch(url, {
        method: opts.method || "GET",
        headers: headers(!!opts.body),
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        credentials: "omit",
        mode: "cors",
        signal: ctrl ? ctrl.signal : undefined
      });
    } catch (e) {
      if (timer) clearTimeout(timer);
      var err = new Error(e && e.name === "AbortError"
        ? "Zeitüberschreitung – der Bot antwortet nicht (Upload zu groß oder Bot offline)."
        : "Bot nicht erreichbar – läuft der Bot und stimmt die API-URL?");
      err.network = true;
      throw err;
    }
    if (timer) clearTimeout(timer);
    var text = await res.text();
    var data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
    if (!res.ok) {
      // Nur bei abgelaufener Anmeldung ausloggen – 403 heißt nur "keine Rechte für diese Aktion"
      if (res.status === 401) { try { setToken(""); } catch (e) {} }
      var msg = (data && (data.error || data.message)) ||
        (res.status === 413 ? "Datei zu groß für den Server." :
         res.status === 401 ? "Nicht angemeldet – bitte neu einloggen." :
         res.status === 403 ? "Keine Berechtigung für diese Aktion." :
         res.status === 404 ? "Nicht gefunden (Bot nicht auf dem Server?)." :
         res.status >= 500 ? "Serverfehler im Bot (" + res.status + ")." : "Fehler " + res.status);
      var e2 = new Error(msg); e2.status = res.status; throw e2;
    }
    return data;
  }
  function login(returnUrl) {
    var ru = encodeURIComponent(returnUrl || (location.origin + "/dashboard/"));
    // always prefer Staffora dashboard, never staff center as default
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
    getAccessKey: getAccessKey, setAccessKey: setAccessKey, validateAccessKey: validateAccessKey, hasAccess: hasAccess,
    ping: function () { return req("/api/health", { timeout: 8000 }); },
    systemStatus: function (gid) { return req("/api/guilds/" + gid + "/system-status"); },
    tempRoles: function (gid) { return req("/api/guilds/" + gid + "/temp-roles"); },
    testphases: function (gid) { return req("/api/guilds/" + gid + "/testphases"); },
    teamsperre: function (gid) { return req("/api/guilds/" + gid + "/teamsperre"); },
    logout: function () { setToken(""); setStaffPw(""); try { sessionStorage.removeItem(staffFlag); } catch(e){} },
    login: login,
    me: function () { return req("/api/me"); },
    get: function (path) { return req(path); },
    webhookSetup: function (gid) { return req("/api/guilds/" + gid + "/ingame/webhook-setup"); },
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
        method: "POST", timeout: 180000,
        body: { filename: filename, data: dataBase64 }
      });
    },
    uploadTicketImage: function (guildId, kind, dataBase64) {
      return req("/api/guilds/" + guildId + "/ticket-image/upload", {
        method: "POST", timeout: 120000,
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
